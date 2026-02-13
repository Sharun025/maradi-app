import { Stack } from "expo-router";

/**
 * Customer browsing layout - Home, items list, serial grid.
 */
export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Maradi", headerBackVisible: false }}
      />
      <Stack.Screen name="items" options={{ title: "Products" }} />
      <Stack.Screen
        name="items/[itemCode]/serials"
        options={{ title: "Select Serial" }}
      />
    </Stack>
  );
}
