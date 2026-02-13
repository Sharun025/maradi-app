/**
 * Shows offline sync status: pending count, online/offline, last error.
 */
import { useEffect } from "react";
import { useSyncStore } from "@/store/sync";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function SyncStatus() {
  const isOnline = useSyncStore((s) => s.isOnline);
  const syncState = useSyncStore((s) => s.syncState);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const lastError = useSyncStore((s) => s.lastError);
  const syncNow = useSyncStore((s) => s.syncNow);
  const clearError = useSyncStore((s) => s.clearError);
  const init = useSyncStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Hide when online, no pending, no error
  if (isOnline && pendingCount === 0 && !lastError) {
    return null;
  }

  const isSyncing = syncState === "syncing";
  const hasError = !!lastError;

  return (
    <View style={[styles.container, !isOnline && styles.offline]}>
      <View style={styles.content}>
        {!isOnline && (
          <View style={styles.row}>
            <Ionicons name="cloud-offline" size={16} color="#f59e0b" />
            <Text style={styles.text}>Offline</Text>
          </View>
        )}
        {isOnline && pendingCount > 0 && (
          <View style={styles.row}>
            {isSyncing ? (
              <Ionicons name="sync" size={16} color="#3b82f6" />
            ) : (
              <Ionicons name="cloud-upload" size={16} color="#22c55e" />
            )}
            <Text style={styles.text}>
              {isSyncing ? "Syncing..." : `${pendingCount} pending`}
            </Text>
          </View>
        )}
        {hasError && (
          <TouchableOpacity
            style={styles.errorRow}
            onPress={() => {
              clearError();
              if (isOnline) syncNow();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.errorText} numberOfLines={1}>
              {lastError}
            </Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  offline: {
    backgroundColor: "#292524",
    borderBottomColor: "#57534e",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    color: "#a3a3a3",
    fontSize: 13,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    flex: 1,
  },
  retryText: {
    color: "#60a5fa",
    fontSize: 12,
  },
});
