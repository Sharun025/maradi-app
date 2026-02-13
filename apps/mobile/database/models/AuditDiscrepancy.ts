import { field, date } from "@nozbe/watermelondb/decorators";
import { Model } from "@nozbe/watermelondb";

export default class AuditDiscrepancy extends Model {
  static table = "audit_discrepancies";

  @field("audit_id") auditId!: string;
  @field("serial_id") serialId!: string;
  @field("serial_number") serialNumber!: string;
  @field("type") type!: string;
  @field("notes") notes!: string | null;
  @field("synced") synced!: boolean;
  @date("created_at") createdAt!: Date;
}
