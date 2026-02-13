/**
 * QR Scanner component with expo-camera.
 * Auto-detects QR type: item code (FG-D12345-*) vs serial ([EDF]1234).
 * Handles permissions and provides manual entry fallback.
 */
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** Serial pattern: E/D/F followed by 4 digits, e.g. E1234, D5678, F9999 */
const SERIAL_PATTERN = /^[EDF]\d{4}$/;

/** Item code pattern: FG-D followed by 5 digits and optional suffix */
const ITEM_CODE_PATTERN = /^FG-D\d{5}-.*$/;

export type QRType = "serial" | "item_code" | "unknown";

export function detectQRType(data: string): QRType {
  const trimmed = data.trim();
  if (SERIAL_PATTERN.test(trimmed)) return "serial";
  if (ITEM_CODE_PATTERN.test(trimmed)) return "item_code";
  return "unknown";
}

export interface QRScannerResult {
  data: string;
  type: QRType;
}

export interface QRScannerProps {
  onScan: (result: QRScannerResult) => void;
  /** If true, scanning is disabled (e.g. after a successful scan) */
  paused?: boolean;
  /** Show manual entry input */
  showManualEntry?: boolean;
}

export function QRScanner({
  onScan,
  paused = false,
  showManualEntry = true,
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualInput, setManualInput] = useState("");
  const [previewData, setPreviewData] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef(false);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (paused || scanCooldownRef.current) return;
      const trimmed = data.trim();
      if (!trimmed || trimmed === lastScannedRef.current) return;

      scanCooldownRef.current = true;
      lastScannedRef.current = trimmed;
      setTimeout(() => {
        scanCooldownRef.current = false;
        lastScannedRef.current = null;
      }, 2000);

      const type = detectQRType(trimmed);
      setPreviewData(trimmed);
      onScan({ data: trimmed, type });
    },
    [onScan, paused]
  );

  const handleManualSubmit = useCallback(() => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const type = detectQRType(trimmed);
    setPreviewData(trimmed);
    onScan({ data: trimmed, type });
    setManualInput("");
  }, [manualInput, onScan]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.message}>Checking camera access...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required to scan QR codes</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
        {showManualEntry && (
          <View style={styles.manualSection}>
            <Text style={styles.manualLabel}>Or enter manually:</Text>
            <TextInput
              style={styles.input}
              placeholder="E1234 or FG-D12345-..."
              placeholderTextColor="#999"
              value={manualInput}
              onChangeText={setManualInput}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleManualSubmit}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!paused ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      ) : (
        <View style={[styles.camera, styles.cameraPaused]}>
          <Text style={styles.pausedText}>Scanner paused</Text>
        </View>
      )}
      {previewData && (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Scanned:</Text>
          <Text style={styles.previewData} selectable>
            {previewData}
          </Text>
          <Text style={styles.previewType}>
            Type: {detectQRType(previewData)}
          </Text>
        </View>
      )}
      {showManualEntry && (
        <View style={styles.manualSection}>
          <Text style={styles.manualLabel}>Or enter manually:</Text>
          <TextInput
            style={styles.input}
            placeholder="E1234 or FG-D12345-..."
            placeholderTextColor="#999"
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualSubmit}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleManualSubmit}
          >
            <Text style={styles.buttonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    minHeight: 280,
  },
  cameraPaused: {
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  pausedText: {
    color: "#fff",
    fontSize: 16,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  preview: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  previewLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },
  previewData: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  previewType: {
    color: "#8f8",
    fontSize: 12,
  },
  manualSection: {
    padding: 16,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  manualLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonSecondary: {
    backgroundColor: "#333",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
