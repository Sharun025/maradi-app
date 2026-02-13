import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuthStore } from "@/store/auth";

/**
 * Root index - handles auth-based redirect.
 * - No token: customer browse (guest)
 * - Customer role: customer home
 * - Admin/user: staff tabs
 */
export default function IndexScreen() {
  const { token, isHydrated, role } = useAuthStore();

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  if (!token || role === "customer") {
    return <Redirect href="/(customer)" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
