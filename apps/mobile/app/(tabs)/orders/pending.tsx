/**
 * Pending orders list with pull-to-refresh.
 * Tap an order to navigate to details.
 */
import { getOrders } from "@/lib/api";
import { OrderCard } from "@/components/orders/OrderCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { OrderListItem } from "@/lib/api";

export default function PendingOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await getOrders({
      status: "pending",
      limit: 50,
      offset: 0,
    });
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
    if (res.error) {
      setError(res.error);
      setOrders([]);
    } else {
      setOrders(res.data?.items ?? []);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = useCallback(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  const handleOrderPress = useCallback(
    (order: OrderListItem) => {
      router.push({
        pathname: "/(tabs)/orders/[orderId]",
        params: { orderId: order.id },
      });
    },
    [router]
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#fca5a5" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: OrderListItem }) => (
          <OrderCard order={item} onPress={handleOrderPress} />
        )}
        contentContainerStyle={
          orders.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No pending orders</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7f1d1d",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 48,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginTop: 16,
  },
});
