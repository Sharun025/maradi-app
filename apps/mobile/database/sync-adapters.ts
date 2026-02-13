/**
 * Sync adapters for add_stock, mark_sale, and audit_scan.
 * Queue actions when offline; execute API calls when online.
 * Conflict resolution: server wins for stock availability.
 */
import { Q } from "@nozbe/watermelondb";
import { database } from "./index";
import type SyncQueue from "./models/SyncQueue";
import type {
  AddStockPayload,
  MarkSalePayload,
  AuditScanPayload,
} from "./models/SyncQueue";
import { createSerial } from "@/lib/api";

/** Max retries before marking as failed */
const MAX_RETRIES = 3;

export type ApiCall = () => Promise<{ data?: unknown; error?: string; status?: number }>;

/** Queue add_stock for upload when online */
export async function queueAddStock(payload: AddStockPayload): Promise<string> {
  const queue = database.get<SyncQueue>("sync_queue");
  const record = await queue.create((r) => {
    (r as SyncQueue).actionType = "add_stock";
    (r as SyncQueue).payloadRaw = JSON.stringify(payload);
    (r as SyncQueue).status = "pending";
    (r as SyncQueue).retryCount = 0;
    (r as SyncQueue).errorMessage = null;
    (r as SyncQueue).serverId = null;
  });
  return record.id;
}

/** Queue mark_sale for upload when online */
export async function queueMarkSale(payload: MarkSalePayload): Promise<string> {
  const queue = database.get<SyncQueue>("sync_queue");
  const record = await queue.create((r) => {
    (r as SyncQueue).actionType = "mark_sale";
    (r as SyncQueue).payloadRaw = JSON.stringify(payload);
    (r as SyncQueue).status = "pending";
    (r as SyncQueue).retryCount = 0;
    (r as SyncQueue).errorMessage = null;
    (r as SyncQueue).serverId = null;
  });
  return record.id;
}

/** Queue audit_scan (discrepancy) for upload when online */
export async function queueAuditScan(payload: AuditScanPayload): Promise<string> {
  const queue = database.get<SyncQueue>("sync_queue");
  const record = await queue.create((r) => {
    (r as SyncQueue).actionType = "audit_scan";
    (r as SyncQueue).payloadRaw = JSON.stringify(payload);
    (r as SyncQueue).status = "pending";
    (r as SyncQueue).retryCount = 0;
    (r as SyncQueue).errorMessage = null;
    (r as SyncQueue).serverId = null;
  });
  return record.id;
}

/** Get all pending sync items ordered by created_at */
export async function getPendingSyncItems(): Promise<SyncQueue[]> {
  const queue = database.get<SyncQueue>("sync_queue");
  return queue
    .query(
      Q.where("status", "pending"),
      Q.sortBy("created_at", Q.asc)
    )
    .fetch();
}

/** Mark item as syncing */
export async function markSyncing(record: SyncQueue): Promise<void> {
  await record.update((r) => {
    (r as SyncQueue).status = "syncing";
  });
}

/** Mark item as synced (success) */
export async function markSynced(record: SyncQueue, serverId?: string): Promise<void> {
  await record.update((r) => {
    (r as SyncQueue).status = "synced";
    (r as SyncQueue).errorMessage = null;
    if (serverId) (r as SyncQueue).serverId = serverId;
  });
}

/** Mark item as failed (retry or give up) */
export async function markFailed(record: SyncQueue, error: string): Promise<void> {
  const newRetry = record.retryCount + 1;
  await record.update((r) => {
    (r as SyncQueue).status = newRetry >= MAX_RETRIES ? "failed" : "pending";
    (r as SyncQueue).retryCount = newRetry;
    (r as SyncQueue).errorMessage = error;
  });
}

/** Execute add_stock via API. Uploads image first if imageUri (local) provided. */
export async function executeAddStock(payload: AddStockPayload): Promise<{
  success: boolean;
  serverId?: string;
  error?: string;
  conflict?: boolean; // server wins - item already exists / not available
}> {
  let imageUrl = payload.imageUrl;
  if (!imageUrl && payload.imageUri) {
    const { uploadImage } = await import("@/lib/api");
    const uploadRes = await uploadImage(payload.imageUri, "serials");
    if (uploadRes.error) {
      return { success: false, error: uploadRes.error };
    }
    imageUrl = uploadRes.data?.url;
  }

  const res = await createSerial({
    itemId: payload.itemId,
    serialNumber: payload.serialNumber,
    batchNumber: payload.batchNumber,
    quantity: payload.quantity ?? 1,
    imageUrl,
  });

  if (res.error) {
    const conflict =
      res.status === 409 ||
      res.error?.toLowerCase().includes("already exists") ||
      res.error?.toLowerCase().includes("duplicate");
    return { success: false, error: res.error, conflict };
  }
  const id = (res.data as { id?: string })?.id;
  return { success: true, serverId: id };
}

/** Execute mark_sale via API. Server wins for availability. */
export async function executeMarkSale(payload: MarkSalePayload): Promise<{
  success: boolean;
  error?: string;
  conflict?: boolean; // server wins - already sold / not available
}> {
  const { apiFetch } = await import("@/lib/api");
  const res = await apiFetch<{
    updated?: string[];
    notFound?: string[];
    alreadySold?: string[];
  }>("/api/serials/mark-sold", {
    method: "POST",
    body: JSON.stringify({
      serialIds: payload.serialIds ?? (payload.serialId ? [payload.serialId] : []),
      soldTo: payload.soldTo,
      soldType: payload.soldType,
    }),
  });

  if (res.error) {
    const conflict =
      res.error?.toLowerCase().includes("already sold") ||
      res.error?.toLowerCase().includes("not available");
    return { success: false, error: res.error, conflict };
  }

  const data = res.data;
  if (data?.alreadySold?.length || data?.notFound?.length) {
    // Server wins: some serials not available
    return { success: false, error: "Some serials not available (server state)", conflict: true };
  }
  return { success: true };
}

/** Execute audit_scan via API. Placeholder until audit API exists. */
export async function executeAuditScan(_payload: AuditScanPayload): Promise<{
  success: boolean;
  error?: string;
  conflict?: boolean;
}> {
  const { apiFetch } = await import("@/lib/api");
  // TODO: Replace with actual audit API when available, e.g. POST /api/audits/discrepancies
  const res = await apiFetch("/api/audits/discrepancies", {
    method: "POST",
    body: JSON.stringify(_payload),
  });

  if (res.error) {
    if (res.status === 404 || res.status === 501) {
      // API not implemented yet - keep in queue for future
      return { success: false, error: "Audit API not available", conflict: false };
    }
    return { success: false, error: res.error, conflict: false };
  }
  return { success: true };
}
