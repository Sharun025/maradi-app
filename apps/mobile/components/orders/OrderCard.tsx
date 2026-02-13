/**
 * OrderCard - List item for pending orders.
 * Displays order number, customer, date, amount. Tappable to navigate to details.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { OrderListItem } from "@/lib/api";

interface OrderCardProps {
  order: OrderListItem;
  onPress?: (order: OrderListItem) => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(order);
    } else {
      router.push({
        pathname: "/(tabs)/orders/[orderId]",
        params: { orderId: order.id },
      });
    }
  };

  const customerName =
    order.customer?.companyName ?? order.customer?.email ?? "—";
  const date = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString()
    : "—";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </View>
      <Text style={styles.customer} numberOfLines={1}>
        {customerName}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.amount}>₹{order.totalAmount?.toLocaleString() ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  customer: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
  },
});
