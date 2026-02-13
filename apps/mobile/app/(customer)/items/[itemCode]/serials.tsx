/**
 * Serial grid - Select serial for item, quick add to cart.
 * 2-3 column grid, 1 qty per serial, "Added to Cart" state.
 */
import {
  addToCart,
  getAvailableSerials,
  getCart,
  getItemByCode,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { AvailableSerial } from "@/lib/api";

export default function SerialsScreen() {
  const { itemCode } = useLocalSearchParams<{ itemCode: string }>();
  const router = useRouter();
  const { token } = useAuthStore();

  const [item, setItem] = useState<{
    id: string;
    itemCode: string;
    itemName: string;
    masterPrice: number;
  } | null>(null);
  const [serials, setSerials] = useState<AvailableSerial[]>([]);
  const [cartSerialIds, setCartSerialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!itemCode) return;
    setLoading(true);
    const [itemRes, cartRes] = await Promise.all([
      getItemByCode(itemCode),
      token ? getCart() : Promise.resolve({ data: [] }),
    ]);
    setLoading(false);

    if (itemRes.error || !itemRes.data) {
      setItem(null);
      setSerials([]);
      return;
    }
    setItem(itemRes.data);

    const serialsRes = await getAvailableSerials(itemRes.data.id);
    if (serialsRes.data?.items) {
      setSerials(serialsRes.data.items);
      const batchColors = [
        ...new Set(
          serialsRes.data.items
            .map((s) => s.batchNumber)
            .filter(Boolean) as string[]
        ),
      ];
      setColors(batchColors);
    } else {
      setSerials([]);
    }

    if (cartRes.data && Array.isArray(cartRes.data)) {
      setCartSerialIds(
        new Set(cartRes.data.map((c: { serialId: string }) => c.serialId))
      );
    }
  }, [itemCode, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = async (serial: AvailableSerial) => {
    if (!token) {
      Alert.alert(
        "Sign in required",
        "Please sign in to add items to your cart.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/(auth)/login") },
        ]
      );
      return;
    }
    if (cartSerialIds.has(serial.id)) return;

    setAddingId(serial.id);
    const res = await addToCart(serial.id);
    setAddingId(null);
    if (res.error) {
      Alert.alert("Error", res.error);
    } else {
      setCartSerialIds((prev) => new Set([...prev, serial.id]));
    }
  };

  const filteredSerials = colorFilter
    ? serials.filter((s) => s.batchNumber === colorFilter)
    : serials;

  const renderSerial = ({ item: s }: { item: AvailableSerial }) => {
    const inCart = cartSerialIds.has(s.id);
    const isAdding = addingId === s.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardImage}>
          {s.imageUrl ? (
            <Image source={{ uri: s.imageUrl }} style={styles.serialImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="barcode" size={32} color="#94a3b8" />
            </View>
          )}
        </View>
        <Text style={styles.serialNumber}>{s.serialNumber}</Text>
        <Text style={styles.price}>
          ₹{(s.item?.masterPrice ?? 0).toLocaleString()}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, inCart && styles.addBtnInCart]}
          onPress={() => handleAddToCart(s)}
          disabled={inCart || isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : inCart ? (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.addBtnText}>In Cart</Text>
            </>
          ) : (
            <>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#64748b" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {colors.length > 0 && (
        <View style={styles.colorFilter}>
          <Text style={styles.filterLabel}>Color:</Text>
          <TouchableOpacity
            style={[
              styles.colorChip,
              !colorFilter && styles.colorChipActive,
            ]}
            onPress={() => setColorFilter(null)}
          >
            <Text style={styles.colorChipText}>All</Text>
          </TouchableOpacity>
          {colors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorChip,
                colorFilter === c && styles.colorChipActive,
              ]}
              onPress={() => setColorFilter(c)}
            >
              <Text
                style={[
                  styles.colorChipText,
                  colorFilter === c && styles.colorChipActiveText,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={filteredSerials}
        keyExtractor={(s) => s.id}
        renderItem={renderSerial}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No serials available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  errorText: { fontSize: 14, color: "#64748b" },
  colorFilter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  colorChipActive: {
    backgroundColor: "#0f172a",
  },
  colorChipText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  colorChipActiveText: {
    color: "#fff",
  },
  list: { padding: 12, paddingBottom: 32 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardImage: {
    aspectRatio: 1,
    marginBottom: 8,
  },
  serialImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  serialNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#0f172a",
  },
  addBtnInCart: {
    backgroundColor: "#059669",
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
