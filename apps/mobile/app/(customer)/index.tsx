/**
 * Customer Home - Categories grid, Added Today, New stock banner.
 */
import { getRecentSerials } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { RecentSerial } from "@/lib/api";

const CATEGORIES = [
  { id: "Sarees", label: "Sarees", icon: "woman" as const },
  { id: "Dothis", label: "Dothis", icon: "shirt" as const },
  { id: "Fabrics", label: "Fabrics", icon: "grid" as const },
  { id: "Accessories", label: "Accessories", icon: "pricetag" as const },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentSerial[]>([]);
  const [totalAddedToday, setTotalAddedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    const res = await getRecentSerials();
    setLoading(false);
    if (res.data) {
      setRecent(res.data.items);
      setTotalAddedToday(res.data.totalAddedToday);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleCategory = (categoryId: string) => {
    router.push({
      pathname: "/(customer)/items",
      params: { category: categoryId },
    });
  };

  const handleAddedTodayItem = (itemCode: string) => {
    router.push({
      pathname: "/(customer)/items/[itemCode]/serials",
      params: { itemCode },
    });
  };

  const showBanner = totalAddedToday >= 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.browseAll}
        onPress={() => router.push("/(customer)/items")}
      >
        <Text style={styles.browseAllText}>Browse all products</Text>
        <Ionicons name="arrow-forward" size={18} color="#0ea5e9" />
      </TouchableOpacity>

      {/* Categories grid */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoriesGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => handleCategory(cat.id)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={cat.icon} size={36} color="#0f172a" />
            </View>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* New stock banner */}
      {showBanner && (
        <View style={styles.banner}>
          <Ionicons name="sparkles" size={24} color="#fbbf24" />
          <Text style={styles.bannerText}>
            100+ new items added today! Browse the latest stock.
          </Text>
        </View>
      )}

      {/* Added Today */}
      <Text style={styles.sectionTitle}>Added Today</Text>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#64748b" />
        </View>
      ) : recent.length === 0 ? (
        <Text style={styles.empty}>No new items today</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.addedTodayScroll}
        >
          {recent.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.addedTodayCard}
              onPress={() => handleAddedTodayItem(s.item.itemCode)}
              activeOpacity={0.8}
            >
              {s.imageUrl ? (
                <Image
                  source={{ uri: s.imageUrl }}
                  style={styles.addedTodayImage}
                />
              ) : (
                <View style={styles.addedTodayPlaceholder}>
                  <Ionicons name="image" size={32} color="#64748b" />
                </View>
              )}
              <Text style={styles.addedTodayName} numberOfLines={2}>
                {s.item.itemName}
              </Text>
              <Text style={styles.addedTodayPrice}>
                ₹{s.item.masterPrice?.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  browseAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  browseAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0ea5e9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  loading: {
    padding: 24,
    alignItems: "center",
  },
  empty: {
    fontSize: 14,
    color: "#64748b",
    paddingVertical: 16,
  },
  addedTodayScroll: {
    gap: 12,
    paddingVertical: 8,
  },
  addedTodayCard: {
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addedTodayImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  addedTodayPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addedTodayName: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "500",
    marginBottom: 4,
  },
  addedTodayPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
});
