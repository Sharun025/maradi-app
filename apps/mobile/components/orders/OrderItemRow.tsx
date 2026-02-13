/**
 * OrderItemRow - Displays an order item with image, serial, and action buttons.
 * Actions: Confirm, Replace, Suggest, Reject.
 */
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { OrderItemListItem } from "@/lib/api";
import { SerialPicker } from "./SerialPicker";

export type ItemAction =
  | "confirm"
  | "replace"
  | "suggest"
  | "reject"
  | null;

interface OrderItemRowProps {
  item: OrderItemListItem;
  action: ItemAction;
  onActionChange: (action: ItemAction) => void;
  onReplaceSerialSelect?: (serialId: string) => void;
  onSuggestItemSelect?: (itemId: string, serialId: string) => void;
  disabled?: boolean;
}

export function OrderItemRow({
  item,
  action,
  onActionChange,
  onReplaceSerialSelect,
  onSuggestItemSelect,
  disabled,
}: OrderItemRowProps) {
  const [showSerialPicker, setShowSerialPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"replace" | "suggest">("replace");

  const imageUrl = item.serial?.imageUrl ?? undefined;
  const serialNumber = item.serial?.serialNumber ?? "—";
  const itemName = item.item?.itemName ?? item.itemId;
  const itemCode = item.item?.itemCode ?? "";

  const handleReplace = () => {
    setPickerMode("replace");
    setShowSerialPicker(true);
    onActionChange("replace");
  };

  const handleSuggest = () => {
    setPickerMode("suggest");
    setShowSerialPicker(true);
    onActionChange("suggest");
  };

  const handleSerialSelect = (serialId: string, selectedItemId?: string) => {
    if (pickerMode === "replace") {
      onReplaceSerialSelect?.(serialId);
    } else {
      onSuggestItemSelect?.(selectedItemId ?? item.itemId, serialId);
    }
    setShowSerialPicker(false);
  };

  const hasSerial = !!item.serialId;
  const isStockAvailable = hasSerial; // Serial exists => reserved for this order

  return (
    <>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#555" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.itemName} numberOfLines={2}>
            {itemName}
          </Text>
          <Text style={styles.itemCode}>{itemCode}</Text>
          <Text style={styles.serial}>Serial: {serialNumber}</Text>
          <Text style={styles.price}>₹{item.price?.toLocaleString() ?? 0}</Text>
          <View style={styles.actions}>
            {isStockAvailable && (
              <TouchableOpacity
                style={[styles.actionBtn, action === "confirm" && styles.actionBtnActive]}
                onPress={() => onActionChange(action === "confirm" ? null : "confirm")}
                disabled={disabled}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={action === "confirm" ? "#fff" : "#22c55e"}
                />
                <Text
                  style={[
                    styles.actionText,
                    action === "confirm" && styles.actionTextActive,
                  ]}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, action === "replace" && styles.actionBtnActive]}
              onPress={handleReplace}
              disabled={disabled}
            >
              <Ionicons
                name="swap-horizontal"
                size={18}
                color={action === "replace" ? "#fff" : "#3b82f6"}
              />
              <Text
                style={[
                  styles.actionText,
                  action === "replace" && styles.actionTextActive,
                ]}
              >
                Replace
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, action === "suggest" && styles.actionBtnActive]}
              onPress={handleSuggest}
              disabled={disabled}
            >
              <Ionicons
                name="bulb"
                size={18}
                color={action === "suggest" ? "#fff" : "#f59e0b"}
              />
              <Text
                style={[
                  styles.actionText,
                  action === "suggest" && styles.actionTextActive,
                ]}
              >
                Suggest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, action === "reject" && styles.actionBtnReject]}
              onPress={() => onActionChange(action === "reject" ? null : "reject")}
              disabled={disabled}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={action === "reject" ? "#fff" : "#ef4444"}
              />
              <Text
                style={[
                  styles.actionText,
                  action === "reject" && styles.actionTextActive,
                ]}
              >
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {showSerialPicker && (
        <SerialPicker
          itemId={item.itemId}
          currentSerialId={item.serialId ?? undefined}
          mode={pickerMode}
          onSelect={(serialId, selectedItemId) => {
            if (pickerMode === "replace") {
              onReplaceSerialSelect?.(serialId);
            } else {
              onSuggestItemSelect?.(selectedItemId ?? item.itemId, serialId);
            }
            setShowSerialPicker(false);
          }}
          onClose={() => setShowSerialPicker(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  imageContainer: {
    width: 72,
    height: 72,
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  serial: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22c55e",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  actionBtnActive: {
    backgroundColor: "#3b82f6",
  },
  actionBtnReject: {
    backgroundColor: "#ef4444",
  },
  actionText: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  actionTextActive: {
    color: "#fff",
  },
});
