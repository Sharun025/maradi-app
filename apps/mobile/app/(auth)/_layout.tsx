import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

/**
 * Auth layout - redirects to tabs if user is already authenticated.
 */
export default function AuthLayout() {
  const { token, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null; // Or a loading spinner - root handles splash
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="send-otp" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="set-password" />
    </Stack>
  );
}
