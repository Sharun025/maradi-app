/**
 * Offline sync store: queue actions when offline, auto-sync when online.
 * - Network status detection via NetInfo
 * - Auto-sync when connectivity restored
 * - Sync status for UI
 * - Conflict handling: server wins for stock availability
 */
import { create } from "zustand";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import {
  queueAddStock,
  queueMarkSale,
  queueAuditScan,
  getPendingSyncItems,
  markSyncing,
  markSynced,
  markFailed,
  executeAddStock,
  executeMarkSale,
  executeAuditScan,
} from "@/database/sync-adapters";
import type {
  AddStockPayload,
  MarkSalePayload,
  AuditScanPayload,
} from "@/database/models/SyncQueue";

export type SyncState = "idle" | "syncing" | "error";
export type SyncStatus = {
  state: SyncState;
  isOnline: boolean;
  pendingCount: number;
  lastError: string | null;
  lastSyncedAt: Date | null;
};

interface SyncStore {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastError: string | null;
  lastSyncedAt: Date | null;
  unsubscribeNetwork: (() => void) | null;

  /** Initialize network listener and optionally trigger sync */
  init: () => void;

  /** Queue add_stock; returns queue id. If online, may sync immediately. */
  addStock: (payload: AddStockPayload) => Promise<string>;

  /** Queue mark_sale; returns queue id. */
  markSale: (payload: MarkSalePayload) => Promise<string>;

  /** Queue audit_scan; returns queue id. */
  auditScan: (payload: AuditScanPayload) => Promise<string>;

  /** Manually trigger sync of pending items */
  syncNow: () => Promise<void>;

  /** Get current sync status for UI */
  getStatus: () => SyncStatus;

  /** Reset last error */
  clearError: () => void;
}

/** Build processQueue with store reference to avoid circular deps */
function createProcessQueue(
  store: ReturnType<typeof useSyncStore.getState>
): () => Promise<void> {
  return async function processQueue() {
    store.setSyncState("syncing");

    const pendings = await getPendingSyncItems();
    if (pendings.length === 0) {
      store.setSyncState("idle");
      store.setLastSyncedAt(new Date());
      store.refreshPendingCount();
      return;
    }

    let hadError = false;
    for (const record of pendings) {
      const payload = record.payload;
      const actionType = record.actionType;

      await markSyncing(record);

      try {
        if (actionType === "add_stock") {
          const res = await executeAddStock(payload as AddStockPayload);
          if (res.success) {
            await markSynced(record, res.serverId);
          } else if (res.conflict) {
            await markSynced(record); // server wins
          } else {
            await markFailed(record, res.error ?? "Unknown error");
            hadError = true;
          }
        } else if (actionType === "mark_sale") {
          const res = await executeMarkSale(payload as MarkSalePayload);
          if (res.success) {
            await markSynced(record);
          } else if (res.conflict) {
            await markSynced(record); // server wins
          } else {
            await markFailed(record, res.error ?? "Unknown error");
            hadError = true;
          }
        } else if (actionType === "audit_scan") {
          const res = await executeAuditScan(payload as AuditScanPayload);
          if (res.success) {
            await markSynced(record);
          } else if (res.conflict) {
            await markSynced(record);
          } else {
            await markFailed(record, res.error ?? "Unknown error");
            hadError = true;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sync failed";
        await markFailed(record, msg);
        store.setLastError(msg);
        hadError = true;
      }
    }

    store.setSyncState(hadError ? "error" : "idle");
    store.setLastSyncedAt(new Date());
    store.refreshPendingCount();
  };
}

export const useSyncStore = create<
  SyncStore & {
    setSyncState: (s: SyncState) => void;
    setLastError: (e: string | null) => void;
    setLastSyncedAt: (d: Date | null) => void;
    setPendingCount: (n: number) => void;
    refreshPendingCount: () => Promise<void>;
    processQueue: () => Promise<void>;
  }
>((set, get) => {
  const refreshPendingCount = async () => {
    const pendings = await getPendingSyncItems();
    set({ pendingCount: pendings.length });
  };

  const store = {
    setSyncState: (syncState: SyncState) => set({ syncState }),
    setLastError: (lastError: string | null) => set({ lastError }),
    setLastSyncedAt: (lastSyncedAt: Date | null) => set({ lastSyncedAt }),
    setPendingCount: (pendingCount: number) => set({ pendingCount }),
    refreshPendingCount,
    getState: get,
  };

  const processQueue = createProcessQueue(store);

  return {
    isOnline: true,
    syncState: "idle" as SyncState,
    pendingCount: 0,
    lastError: null,
    lastSyncedAt: null,
    unsubscribeNetwork: null,

    setSyncState: store.setSyncState,
    setLastError: store.setLastError,
    setLastSyncedAt: store.setLastSyncedAt,
    setPendingCount: store.setPendingCount,
    refreshPendingCount,
    processQueue,

    init: () => {
      const unsub = get().unsubscribeNetwork;
      if (unsub) unsub();

      refreshPendingCount();

      const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const isOnline =
          state.isConnected === true && state.isInternetReachable !== false;
        set({ isOnline });
        if (isOnline) processQueue();
      });

      set({ unsubscribeNetwork: () => unsubscribe() });

      NetInfo.fetch().then((state: NetInfoState) => {
        const isOnline =
          state.isConnected === true && state.isInternetReachable !== false;
        set({ isOnline });
        if (isOnline) processQueue();
      });
    },

    addStock: async (payload: AddStockPayload) => {
      const id = await queueAddStock(payload);
      const { isOnline } = get();
      set({ pendingCount: get().pendingCount + 1 });
      if (isOnline) processQueue();
      return id;
    },

    markSale: async (payload: MarkSalePayload) => {
      const id = await queueMarkSale(payload);
      const { isOnline } = get();
      set({ pendingCount: get().pendingCount + 1 });
      if (isOnline) processQueue();
      return id;
    },

    auditScan: async (payload: AuditScanPayload) => {
      const id = await queueAuditScan(payload);
      const { isOnline } = get();
      set({ pendingCount: get().pendingCount + 1 });
      if (isOnline) processQueue();
      return id;
    },

    syncNow: async () => {
      const { isOnline } = get();
      if (!isOnline) {
        set({ lastError: "You are offline. Sync when connected." });
        return;
      }
      await processQueue();
    },

    getStatus: () => {
      const { isOnline, syncState, pendingCount, lastError, lastSyncedAt } =
        get();
      return {
        state: syncState,
        isOnline,
        pendingCount,
        lastError,
        lastSyncedAt,
      };
    },

    clearError: () => set({ lastError: null }),
  };
});
