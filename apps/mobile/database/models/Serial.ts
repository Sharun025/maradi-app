import { field, date } from "@nozbe/watermelondb/decorators";
import { Model } from "@nozbe/watermelondb";

export default class Serial extends Model {
  static table = "serials";

  @field("server_id") serverId!: string;
  @field("item_id") itemId!: string;
  @field("serial_number") serialNumber!: string;
  @field("batch_number") batchNumber!: string | null;
  @field("status") status!: string;
  @field("quantity") quantity!: number;
  @field("image_url") imageUrl!: string | null;
  @date("date_added") dateAdded!: Date;
  @date("synced_at") syncedAt!: Date;
}
