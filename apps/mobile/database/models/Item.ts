import { field, date } from "@nozbe/watermelondb/decorators";
import { Model } from "@nozbe/watermelondb";

export default class Item extends Model {
  static table = "items";

  @field("server_id") serverId!: string;
  @field("item_code") itemCode!: string;
  @field("item_name") itemName!: string;
  @field("category") category!: string;
  @field("master_price") masterPrice!: number;
  @field("inventory_type") inventoryType!: string;
  @field("uom") uom!: string;
  @field("is_active") isActive!: boolean;
  @date("synced_at") syncedAt!: Date;
}
