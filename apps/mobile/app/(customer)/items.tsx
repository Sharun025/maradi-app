/**
 * Item list - Filter by category, subcategory, price.
 * Shows thumbnail, item code, name, qty available, tier price, MRP.
 */
import {
  getBrowseItems,
  type BrowseItem,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** Resolve customer tier price from item and priceList */
function getTierPrice(item: BrowseItem, priceList?: string | null): number {
  if (!priceList) return item.masterPrice;
  const p = priceList.toUpperCase();
  if (p === "A" && item.aPrice != null) return item.aPrice;
  if (p === "B" && item.bPrice != null) return item.bPrice;
  if (p === "C" && item.cPrice != null) return item.cPrice;
  return item.masterPrice;
}

export default function ItemsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    subcategory?: string;
  }>();
  const { user } = useAuthStore();
  const priceList = user?.priceList ?? null;

  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState(params.category ?? "");
  const [subcategory, setSubcategory] = useState(params.subcategory ?? "");

  useEffect(() => {
    if (params.category != null) setCategory(params.category);
    if (params.subcategory != null) setSubcategory(params.subcategory);
  }, [params.category, params.subcategory]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [subcategories, setSubcategories] = useState<string[]>([]);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await getBrowseItems({
      category: category || undefined,
      subcategory: subcategory || undefined,
      minPrice,
      maxPrice,
      limit: 50,
    });
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (res.data) {
      setItems(Array.isArray(res.data) ? res.data : []);
      const subs = [
        ...new Set(
          (Array.isArray(res.data) ? res.data : [])
            .map((i) => i.subcategory)
            .filter(Boolean) as string[]
        ),
      ];
      setSubcategories(subs);
    } else {
      setItems([]);
    }
  }, [category, subcategory, minPrice, maxPrice]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleItemPress = (item: BrowseItem) => {
    router.push({
      pathname: "/(customer)/items/[itemCode]/serials",
      params: { itemCode: item.itemCode },
    });
  };

  const renderItem = ({ item }: { item: BrowseItem }) => {
    const tierPrice = getTierPrice(item, priceList);
    const showTierDiscount = tierPrice < item.masterPrice;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.itemThumb}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.thumbImage}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#94a3b8" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemCode}>{item.itemCode}</Text>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.itemName}
          </Text>
          <Text style={styles.itemQty}>
            {item.availableCount} available
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.tierPrice}>₹{tierPrice.toLocaleString()}</Text>
            {showTierDiscount && (
              <Text style={styles.mrpPrice}>
                MRP ₹{item.masterPrice.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, !category && styles.filterChipActive]}
          onPress={() => {
            setCategory("");
            setSubcategory("");
          }}
        >
          <Text
            style={[
              styles.filterText,
              !category && styles.filterChipActiveText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {["Sarees", "Dothis", "Fabrics", "Accessories"].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              category === cat && styles.filterChipActive,
            ]}
            onPress={() => {
              setCategory(cat);
              setSubcategory("");
            }}
          >
            <Text
              style={[
                styles.filterText,
                category === cat && styles.filterChipActiveText,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
        {subcategories.map((sub) => (
          <TouchableOpacity
            key={sub}
            style={[
              styles.filterChip,
              subcategory === sub && styles.filterChipActive,
            ]}
            onPress={() => setSubcategory(subcategory === sub ? "" : sub)}
          >
            <Text
              style={[
                styles.filterText,
                subcategory === sub && styles.filterChipActiveText,
              ]}
            >
              {sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#64748b" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchItems(true)}
              tintColor="#64748b"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  filterChipActiveText: {
    color: "#fff",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 16, paddingBottom: 32 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemThumb: {
    width: 64,
    height: 64,
    marginRight: 12,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemCode: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  mrpPrice: {
    fontSize: 12,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 12,
  },
});
