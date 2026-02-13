/**
 * WatermelonDB database initialization.
 * Uses SQLiteAdapter on native, LokiJSAdapter on web.
 */
import { Platform } from "react-native";
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import schema from "./schema";
import migrations from "./migrations";
import SyncQueue from "./models/SyncQueue";
import Item from "./models/Item";
import Serial from "./models/Serial";
import AuditDiscrepancy from "./models/AuditDiscrepancy";

const modelClasses = [SyncQueue, Item, Serial, AuditDiscrepancy];

function createAdapter() {
  if (Platform.OS === "web") {
    return new LokiJSAdapter({
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      onSetUpError: (error) => {
        console.error("[WatermelonDB] LokiJS setup error:", error);
      },
    });
  }

  return new SQLiteAdapter({
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error) => {
      console.error("[WatermelonDB] SQLite setup error:", error);
    },
  });
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses,
});

export { SyncQueue, Item, Serial, AuditDiscrepancy };
export type { SyncActionType, SyncStatus, SyncPayload, AddStockPayload, MarkSalePayload, AuditScanPayload } from "./models/SyncQueue";
