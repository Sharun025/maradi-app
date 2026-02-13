/**
 * WatermelonDB schema matching Prisma models for offline sync.
 * Tables: sync_queue (pending uploads), items (cache), serials (cache)
 */
import { appSchema, tableSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 1,
  tables: [
    // Pending actions to upload when online
    tableSchema({
      name: "sync_queue",
      columns: [
        { name: "action_type", type: "string", isIndexed: true },
        { name: "payload", type: "string" }, // JSON
        { name: "created_at", type: "number", isIndexed: true },
        { name: "status", type: "string", isIndexed: true }, // pending | syncing | synced | failed
        { name: "retry_count", type: "number" },
        { name: "error_message", type: "string", isOptional: true },
        { name: "server_id", type: "string", isOptional: true }, // id from server after sync
      ],
    }),
    // Cached items for offline add-stock lookup
    tableSchema({
      name: "items",
      columns: [
        { name: "server_id", type: "string", isIndexed: true },
        { name: "item_code", type: "string", isIndexed: true },
        { name: "item_name", type: "string" },
        { name: "category", type: "string" },
        { name: "master_price", type: "number" },
        { name: "inventory_type", type: "string" },
        { name: "uom", type: "string" },
        { name: "is_active", type: "boolean" },
        { name: "synced_at", type: "number" },
      ],
    }),
    // Cached serials for offline mark-sale / audit
    tableSchema({
      name: "serials",
      columns: [
        { name: "server_id", type: "string", isIndexed: true },
        { name: "item_id", type: "string", isIndexed: true },
        { name: "serial_number", type: "string", isIndexed: true },
        { name: "batch_number", type: "string", isOptional: true },
        { name: "status", type: "string", isIndexed: true },
        { name: "quantity", type: "number" },
        { name: "image_url", type: "string", isOptional: true },
        { name: "date_added", type: "number" },
        { name: "synced_at", type: "number" },
      ],
    }),
    // Audit scans (stock audit discrepancies) - queue for upload
    tableSchema({
      name: "audit_discrepancies",
      columns: [
        { name: "audit_id", type: "string", isIndexed: true },
        { name: "serial_id", type: "string", isIndexed: true },
        { name: "serial_number", type: "string" },
        { name: "type", type: "string" }, // found | missing | damaged etc
        { name: "notes", type: "string", isOptional: true },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
      ],
    }),
  ],
});
