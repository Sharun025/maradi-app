# Offline Sync (WatermelonDB)

Offline-first sync for Add Stock, Mark Sale, and Stock Audit scans.

## Architecture

- **WatermelonDB** (SQLite on native, LokiJS on web) stores:
  - `sync_queue` – pending actions (add_stock, mark_sale, audit_scan)
  - `items`, `serials` – optional cache tables for future use
  - `audit_discrepancies` – local audit scan records

- **Sync adapters** (`sync-adapters.ts`):
  - Queue actions when offline
  - Execute API calls when online
  - Conflict resolution: **server wins** for stock availability

- **Sync store** (`store/sync.ts`):
  - Network status via `@react-native-community/netinfo`
  - Auto-sync when connectivity restored
  - Sync status for UI (`SyncStatus` component)

## Usage

```ts
import { useSyncStore } from "@/store/sync";

// Queue add stock (works offline)
await useSyncStore.getState().addStock({
  itemId: "...",
  serialNumber: "...",
  imageUri: "file://..." // local path when offline
});

// Queue mark sale
await useSyncStore.getState().markSale({ serialIds: ["..."] });

// Queue audit scan
await useSyncStore.getState().auditScan({
  auditId: "...",
  serialId: "...",
  serialNumber: "...",
  type: "found"
});
```

## Build

WatermelonDB requires a **development build** (not Expo Go):

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

For Expo Go / web, LokiJS is used (no native SQLite).
