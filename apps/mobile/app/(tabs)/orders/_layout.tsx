import { Stack } from "expo-router";

/**
 * Orders stack: pending list → order details
 */
export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#111" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
      }}
      initialRouteName="pending"
    >
      <Stack.Screen
        name="pending"
        options={{ title: "Pending Orders", headerBackVisible: false }}
      />
      <Stack.Screen
        name="[orderId]"
        options={{ title: "Order Details" }}
      />
    </Stack>
  );
}
