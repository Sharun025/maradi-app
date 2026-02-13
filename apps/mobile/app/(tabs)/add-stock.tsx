/**
 * Add Stock screen: scan item QR, scan serial QR, capture image, preview.
 * Uses offline sync: queues when offline, syncs when online.
 */
import {
  getItemByCode,
  getSerialByNumber,
  uploadImage,
} from "@/lib/api";
import { useSyncStore } from "@/store/sync";
import {
  QRScanner,
  type QRScannerResult,
} from "@/components/QRScanner";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "scan_item" | "scan_serial" | "capture_image" | "preview" | "done";

interface ItemDetails {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  masterPrice: number;
}

export default function AddStockScreen() {
  const isOnline = useSyncStore((s) => s.isOnline);
  const [step, setStep] = useState<Step>("scan_item");
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [serialNumber, setSerialNumber] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setStep("scan_item");
    setItem(null);
    setSerialNumber(null);
    setImageUri(null);
    setError(null);
    setLoading(false);
    setSuccess(false);
  }, []);

  const handleItemScan = useCallback(async (result: QRScannerResult) => {
    if (result.type !== "item_code" && result.type !== "unknown") {
      setError("Scan an item code QR (FG-D12345-...)");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await getItemByCode(result.data);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      setItem(res.data);
      setStep("scan_serial");
    }
  }, []);

  const handleSerialScan = useCallback(async (result: QRScannerResult) => {
    if (result.type !== "serial" && result.type !== "unknown") {
      setError("Scan a serial QR (E1234, D1234, or F1234)");
      return;
    }
    if (!item) return;
    setError(null);
    setLoading(true);
    const res = await getSerialByNumber(result.data);
    setLoading(false);
    if (res.status === 404) {
      setSerialNumber(result.data);
      setStep("capture_image");
      return;
    }
    if (res.data) {
      setError("Serial already exists. Use a different serial.");
      return;
    }
    setError(res.error ?? "Failed to validate serial");
  }, [item]);

  const handleCaptureImage = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission is required to capture image");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("preview");
      setError(null);
    }
  }, []);

  const handlePickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission is required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep("preview");
      setError(null);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!item || !serialNumber) return;
    setLoading(true);
    setError(null);

    const { addStock, isOnline } = useSyncStore.getState();

    // When online: upload image first to get URL. When offline: queue with local URI.
    let imageUrl: string | undefined;
    let imageUriLocal: string | undefined;
    if (imageUri) {
      if (isOnline) {
        const uploadRes = await uploadImage(imageUri, "serials");
        if (uploadRes.error) {
          setLoading(false);
          setError(uploadRes.error);
          return;
        }
        imageUrl = uploadRes.data?.url;
      } else {
        imageUriLocal = imageUri;
      }
    }

    try {
      await addStock({
        itemId: item.id,
        serialNumber,
        quantity: 1,
        imageUrl,
        imageUri: imageUriLocal,
      });
      setSuccess(true);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add stock");
    } finally {
      setLoading(false);
    }
  }, [item, serialNumber, imageUri]);

  const handleSkipImage = useCallback(() => {
    setStep("preview");
    setImageUri(null);
  }, []);

  if (step === "scan_item") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>1. Scan item code</Text>
          <Text style={styles.subtitle}>Point at QR: FG-D12345-...</Text>
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Fetching item...</Text>
          </View>
        )}
        <QRScanner
          onScan={handleItemScan}
          paused={loading}
          showManualEntry={true}
        />
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  if (step === "scan_serial") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>2. Scan serial number</Text>
          <Text style={styles.subtitle}>
            Item: {item?.itemCode} – {item?.itemName}
          </Text>
        </View>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Validating...</Text>
          </View>
        )}
        <QRScanner
          onScan={handleSerialScan}
          paused={loading}
          showManualEntry={true}
        />
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("scan_item")}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Change item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "capture_image") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>3. Capture image</Text>
          <Text style={styles.subtitle}>
            Serial: {serialNumber} • Item: {item?.itemCode}
          </Text>
        </View>
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleCaptureImage}
          >
            <Ionicons name="camera" size={32} color="#111" />
            <Text style={styles.imageButtonText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handlePickFromGallery}
          >
            <Ionicons name="images" size={32} color="#111" />
            <Text style={styles.imageButtonText}>From gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.imageButton, styles.skipButton]}
            onPress={handleSkipImage}
          >
            <Ionicons name="close" size={32} color="#666" />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("scan_serial")}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Change serial</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === "preview") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>4. Preview & confirm</Text>
        </View>
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Item</Text>
          <Text style={styles.previewValue}>
            {item?.itemCode} – {item?.itemName}
          </Text>
          <Text style={styles.previewLabel}>Serial</Text>
          <Text style={styles.previewValue}>{serialNumber}</Text>
          {imageUri && (
            <>
              <Text style={styles.previewLabel}>Image</Text>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.removeImageText}>Remove image</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {loading ? (
          <ActivityIndicator size="large" color="#111" style={styles.spinner} />
        ) : (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm & Add Stock</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep("capture_image")}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === "done") {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <View style={styles.doneContent}>
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
          <Text style={styles.doneTitle}>
            {isOnline ? "Stock added successfully" : "Queued for sync"}
          </Text>
          <Text style={styles.doneSubtitle}>
            {item?.itemCode} • Serial {serialNumber}
            {!isOnline && " (will upload when online)"}
          </Text>
          <TouchableOpacity style={styles.confirmButton} onPress={reset}>
            <Text style={styles.confirmButtonText}>Add another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
  },
  imageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  imageButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  imageButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  skipButton: {
    backgroundColor: "#333",
  },
  skipButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  previewCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  previewLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  previewValue: {
    color: "#fff",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#222",
  },
  removeImage: {
    marginTop: 8,
    padding: 8,
  },
  removeImageText: {
    color: "#ef4444",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#22c55e",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  spinner: {
    marginTop: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  doneContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  doneContent: {
    alignItems: "center",
    padding: 24,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 24,
  },
});
