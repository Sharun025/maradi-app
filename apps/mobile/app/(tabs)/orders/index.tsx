import { Redirect } from "expo-router";

/**
 * Redirect /orders to /orders/pending
 */
export default function OrdersIndex() {
  return <Redirect href="/(tabs)/orders/pending" />;
}
