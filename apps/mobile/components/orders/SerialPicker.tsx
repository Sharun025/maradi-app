/**
 * SerialPicker - Grid view modal to select a replacement serial.
 * Fetches available serials for the item and displays in a grid.
 */
import { getAvailableSerials, getItems } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { AvailableSerial, ItemListItem } from "@/lib/api";

interface SerialPickerProps {
  itemId: string;
  currentSerialId?: string;
  mode: "replace" | "suggest";
  onSelect: (serialId: string, itemId?: string) => void;
  onClose: () => void;
}

export function SerialPicker({
  itemId,
  currentSerialId,
  mode,
  onSelect,
  onClose,
}: SerialPickerProps) {
  const [serials, setSerials] = useState<AvailableSerial[]>([]);
  const [items, setItems] = useState<ItemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"item" | "serial">(
    mode === "suggest" ? "item" : "serial"
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    mode === "replace" ? itemId : null
  );

  const loadSerials = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const res = await getAvailableSerials(id);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setSerials([]);
    } else {
      setSerials(res.data?.items ?? []);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getItems();
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setItems([]);
    } else {
      setItems(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  useEffect(() => {
    if (mode === "replace" || step === "serial") {
      const id = step === "serial" && selectedItemId ? selectedItemId : itemId;
      loadSerials(id);
    } else if (mode === "suggest" && step === "item") {
      loadItems();
    }
  }, [mode, step, itemId, selectedItemId, loadSerials, loadItems]);

  const handleItemSelect = (it: ItemListItem) => {
    setSelectedItemId(it.id);
    setStep("serial");
  };

  const handleSerialSelect = (s: AvailableSerial) => {
    const item = s.item;
    onSelect(s.id, item?.id);
  };

  const title =
    mode === "replace"
      ? "Select replacement serial"
      : step === "item"
        ? "Select different item"
        : "Select serial for replacement";

  if (mode === "suggest" && step === "item") {
    return (
      <Modal visible transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={16}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : error ? (
              <View style={styles.error}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={({ item: it }) => (
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => handleItemSelect(it)}
                  >
                    <View style={styles.gridItemPlaceholder}>
                      <Ionicons name="cube" size={40} color="#666" />
                    </View>
                    <Text style={styles.gridItemName} numberOfLines={2}>
                      {it.itemName}
                    </Text>
                    <Text style={styles.gridItemCode}>{it.itemCode}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            {mode === "suggest" && step === "serial" ? (
              <TouchableOpacity onPress={() => setStep("item")} hitSlop={16}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={16}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={serials}
              keyExtractor={(s) => s.id}
              numColumns={2}
              contentContainerStyle={styles.grid}
              renderItem={({ item: s }) => (
                <TouchableOpacity
                  style={[
                    styles.gridItem,
                    s.id === currentSerialId && styles.gridItemSelected,
                  ]}
                  onPress={() => handleSerialSelect(s)}
                >
                  {s.imageUrl ? (
                    <Image source={{ uri: s.imageUrl }} style={styles.gridImage} />
                  ) : (
                    <View style={styles.gridItemPlaceholder}>
                      <Ionicons name="barcode" size={40} color="#666" />
                    </View>
                  )}
                  <Text style={styles.gridItemSerial}>{s.serialNumber}</Text>
                  {s.item && (
                    <Text style={styles.gridItemCode} numberOfLines={1}>
                      {s.item.itemCode}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  loading: {
    padding: 48,
    alignItems: "center",
  },
  error: {
    padding: 24,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  gridItem: {
    width: "48%",
    margin: "1%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  gridItemSelected: {
    borderColor: "#22c55e",
  },
  gridImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridItemPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridItemName: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginBottom: 2,
  },
  gridItemSerial: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  gridItemCode: {
    fontSize: 11,
    color: "#888",
  },
});
