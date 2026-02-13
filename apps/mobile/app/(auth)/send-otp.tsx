import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SendOtpScreen() {
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState("");

  const handleSendOtp = () => {
    // TODO: Call API to send OTP
    router.push({
      pathname: "/(auth)/verify-otp",
      params: { phoneOrEmail },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send OTP</Text>
      <Text style={styles.subtitle}>
        Enter your phone or email to receive a verification code
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Phone or email"
        placeholderTextColor="#999"
        value={phoneOrEmail}
        onChangeText={setPhoneOrEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
  },
  backText: {
    color: "#666",
    fontSize: 14,
  },
});
