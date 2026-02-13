import { field, date, readonly } from "@nozbe/watermelondb/decorators";
import { Model } from "@nozbe/watermelondb";

export type SyncActionType = "add_stock" | "mark_sale" | "audit_scan";
export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface AddStockPayload {
  itemId: string;
  serialNumber: string;
  batchNumber?: string;
  quantity?: number;
  imageUrl?: string; // Server URL (after upload)
  imageUri?: string; // Local URI when queued offline - upload during sync
}

export interface MarkSalePayload {
  serialIds: string[];
  serialId?: string;
  soldTo?: string;
  soldType?: string;
}

export interface AuditScanPayload {
  auditId: string;
  serialId: string;
  serialNumber: string;
  type: string;
  notes?: string;
}

export type SyncPayload = AddStockPayload | MarkSalePayload | AuditScanPayload;

export default class SyncQueue extends Model {
  static table = "sync_queue";

  @field("action_type") actionType!: SyncActionType;
  @field("payload") payloadRaw!: string;
  @field("status") status!: SyncStatus;
  @field("retry_count") retryCount!: number;
  @field("error_message") errorMessage!: string | null;
  @field("server_id") serverId!: string | null;
  @readonly @date("created_at") createdAt!: Date;

  get payload(): SyncPayload {
    return JSON.parse(this.payloadRaw) as SyncPayload;
  }

}
