/**
 * Order details: customer info, order items with serial images,
 * per-item actions (Confirm, Replace, Suggest, Reject), notes, submit.
 */
import {
  confirmOrder,
  getOrder,
  type OrderDetail,
  type OrderItemListItem,
} from "@/lib/api";
import { OrderItemRow, type ItemAction } from "@/components/orders/OrderItemRow";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ItemActionPayload =
  | { orderItemId: string; action: "confirm" }
  | { orderItemId: string; action: "replace"; replacementSerialId: string }
  | {
      orderItemId: string;
      action: "suggest";
      replacementItemId: string;
      replacementSerialId: string;
    }
  | { orderItemId: string; action: "reject" };

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [itemActions, setItemActions] = useState<
    Record<string, ItemActionPayload>
  >({});

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    const res = await getOrder(orderId);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      setOrder(null);
    } else {
      setOrder(res.data ?? null);
      setNotes(res.data?.notes ?? "");
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleActionChange = useCallback(
    (orderItemId: string, action: ItemAction) => {
      setItemActions((prev) => {
        const next = { ...prev };
        if (action === null) {
          delete next[orderItemId];
        } else if (action === "confirm") {
          next[orderItemId] = { orderItemId, action: "confirm" };
        } else if (action === "reject") {
          next[orderItemId] = { orderItemId, action: "reject" };
        }
        return next;
      });
    },
    []
  );

  const handleReplaceSerialSelect = useCallback((orderItemId: string) => {
    return (serialId: string) => {
      setItemActions((prev) => ({
        ...prev,
        [orderItemId]: {
          orderItemId,
          action: "replace",
          replacementSerialId: serialId,
        },
      }));
    };
  }, []);

  const handleSuggestItemSelect = useCallback((orderItemId: string) => {
    return (itemId: string, serialId: string) => {
      setItemActions((prev) => ({
        ...prev,
        [orderItemId]: {
          orderItemId,
          action: "suggest",
          replacementItemId: itemId,
          replacementSerialId: serialId,
        },
      }));
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!orderId || !order) return;
    const actions = Object.values(itemActions);
    if (actions.length === 0) {
      Alert.alert(
        "No actions",
        "Please select an action (Confirm, Replace, Suggest, or Reject) for at least one item."
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await confirmOrder(orderId, {
      notes: notes.trim() || undefined,
      itemActions: actions,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      Alert.alert("Error", res.error);
    } else {
      Alert.alert(
        "Success",
        "Order confirmation submitted.",
        [{ text: "OK", onPress: () => fetchOrder() }]
      );
    }
  }, [orderId, order, itemActions, notes, fetchOrder]);

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>
          {loading ? "Loading order..." : error ?? "Order not found"}
        </Text>
      </View>
    );
  }

  const customer = order.customer;
  const customerName =
    customer?.companyName ?? customer?.email ?? "—";
  const customerBp = customer?.bpCode ? `BP: ${customer.bpCode}` : "";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <Text style={styles.customerName}>{customerName}</Text>
            {customerBp ? (
              <Text style={styles.customerBp}>{customerBp}</Text>
            ) : null}
            <Text style={styles.customerEmail}>{customer?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map((item: OrderItemListItem) => (
            <OrderItemRow
              key={item.id}
              item={item}
              action={
                itemActions[item.id]?.action === "confirm"
                  ? "confirm"
                  : itemActions[item.id]?.action === "replace"
                    ? "replace"
                    : itemActions[item.id]?.action === "suggest"
                      ? "suggest"
                      : itemActions[item.id]?.action === "reject"
                        ? "reject"
                        : null
              }
              onActionChange={(a) => handleActionChange(item.id, a)}
              onReplaceSerialSelect={handleReplaceSerialSelect(item.id)}
              onSuggestItemSelect={handleSuggestItemSelect(item.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes for Customer</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Enter any notes to share with the customer..."
            placeholderTextColor="#666"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#fca5a5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={22} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Confirmation</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  customerCard: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  customerBp: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: "#aaa",
  },
  notesInput: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7f1d1d",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22c55e",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
