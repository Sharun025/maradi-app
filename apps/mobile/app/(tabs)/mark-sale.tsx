import { StyleSheet, Text, View } from "react-native";

export default function MarkSaleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Sale</Text>
      <Text style={styles.subtitle}>Record a new sale</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
