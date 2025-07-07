import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Conditional camera import to handle cases where it's not available
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const cameraModule = require("expo-camera");
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;
} catch (error: any) {
  console.warn("expo-camera not available:", error);
}

// Conditional clipboard import to handle cases where it's not available
let Clipboard: any = null;
try {
  Clipboard = require("expo-clipboard");
} catch (error: any) {
  console.warn("expo-clipboard not available:", error);
}

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface InviteCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
  loading?: boolean;
}

const { height: screenHeight } = Dimensions.get("window");

const InviteCodeScanner: React.FC<InviteCodeScannerProps> = ({
  visible,
  onClose,
  onCodeScanned,
  loading = false,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [null, () => {}];
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-focus input after animation if in manual mode
      if (scanMode === "manual") {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 350);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Deactivate camera when modal closes
      setCameraActive(false);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, scanMode]);

  // Handle camera permissions and activation
  useEffect(() => {
    if (visible && scanMode === "camera") {
      if (permission?.granted) {
        setCameraActive(true);
      } else if (permission?.canAskAgain) {
        requestPermission();
      }
    } else {
      setCameraActive(false);
    }
  }, [visible, scanMode, permission?.granted, permission?.canAskAgain]);

  const handleManualSubmit = () => {
    if (manualCode.trim().length >= 6) {
      Keyboard.dismiss();
      onCodeScanned(manualCode.trim());
      setManualCode("");
      onClose();
    } else {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid invite code (at least 6 characters)."
      );
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setManualCode("");
    setCameraActive(false);
    onClose();
  };

  const handleBarcodeScanned = (result: any) => {
    if (result?.data) {
      const scannedCode = result.data.trim();
      if (scannedCode.length >= 6) {
        setCameraActive(false);
        onCodeScanned(scannedCode);
        onClose();
      } else {
        Alert.alert(
          "Invalid QR Code",
          "The scanned QR code doesn't contain a valid invite code."
        );
      }
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      // Check if clipboard is available
      if (!Clipboard) {
        Alert.alert(
          "Clipboard Not Available",
          "Clipboard functionality is not available on this device. Please enter the code manually."
        );
        return;
      }

      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText && clipboardText.trim().length >= 6) {
        setManualCode(formatInviteCode(clipboardText));
        Alert.alert(
          "Code Pasted",
          "Invite code has been pasted from clipboard. Please review and submit."
        );
      } else {
        Alert.alert(
          "No Valid Code",
          "No valid invite code found in clipboard."
        );
      }
    } catch (error) {
      console.error("Clipboard error:", error);
      Alert.alert(
        "Error",
        "Failed to read from clipboard. Please enter the code manually."
      );
    }
  };

  const toggleScanMode = () => {
    if (scanMode === "manual") {
      setScanMode("camera");
      Keyboard.dismiss();
    } else {
      setScanMode("manual");
      setCameraActive(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const formatInviteCode = (text: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    // Limit to 12 characters
    return cleaned.slice(0, 12);
  };

  const renderManualInput = () => (
    <>
      {/* Icon with enhanced gradient */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={["#6674CC", "#5A67D8", "#4C51BF"]}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.iconGlow} />
      </View>

      <Text style={styles.mainTitle}>Enter Invite Code</Text>
      <Text style={styles.subtitle}>
        Type the invite code you received from the collection owner
      </Text>

      {/* Enhanced input container */}
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={["#1A1D2F", "#131523"]}
          style={styles.inputGradient}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={manualCode}
            onChangeText={(text) => setManualCode(formatInviteCode(text))}
            placeholder="Enter invite code..."
            placeholderTextColor="#9DA3B4"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            selectionColor="#6674CC"
            returnKeyType="done"
            onSubmitEditing={handleManualSubmit}
          />
        </LinearGradient>
      </View>

      {/* Paste from clipboard button */}
      <TouchableOpacity
        style={styles.pasteButton}
        onPress={handlePasteFromClipboard}
        activeOpacity={0.8}>
        <LinearGradient
          colors={["rgba(102, 116, 204, 0.2)", "rgba(102, 116, 204, 0.1)"]}
          style={styles.pasteButtonGradient}>
          <Ionicons name="clipboard-outline" size={16} color="#6674CC" />
          <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Info section with enhanced styling */}
      <View style={styles.infoContainer}>
        <LinearGradient
          colors={["rgba(157, 163, 180, 0.1)", "rgba(157, 163, 180, 0.05)"]}
          style={styles.infoGradient}>
          <Ionicons name="information-circle" size={16} color="#9DA3B4" />
          <Text style={styles.infoText}>
            Invite codes are usually 6-12 characters long
          </Text>
        </LinearGradient>
      </View>

      {/* Tip section with enhanced styling */}
      <View style={styles.tipContainer}>
        <LinearGradient
          colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
          style={styles.tipGradient}>
          <Ionicons name="bulb-outline" size={16} color="#6674CC" />
          <Text style={styles.tipText}>
            Tip: You can also scan a QR code or ask the collection owner to
            share the invite code via text or email
          </Text>
        </LinearGradient>
      </View>
    </>
  );

  const renderCameraScanner = () => (
    <>
      {/* Camera scanner icon */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={["#6674CC", "#5A67D8", "#4C51BF"]}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons name="camera-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.iconGlow} />
      </View>

      <Text style={styles.mainTitle}>Scan QR Code</Text>
      <Text style={styles.subtitle}>
        Point your camera at the QR code to automatically join the collection
      </Text>

      {/* Camera view container */}
      <View style={styles.cameraContainer}>
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <LinearGradient
              colors={["#1A1D2F", "#131523"]}
              style={styles.permissionGradient}>
              <Ionicons name="camera" size={48} color="#9DA3B4" />
              <Text style={styles.permissionTitle}>
                Camera Permission Required
              </Text>
              <Text style={styles.permissionText}>
                We need camera access to scan QR codes
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={["#6674CC", "#5A67D8"]}
                  style={styles.permissionButtonGradient}>
                  <Text style={styles.permissionButtonText}>
                    Grant Permission
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : cameraActive && CameraView ? (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={handleBarcodeScanned}
              onMountError={(error: any) => {
                console.error("Camera mount error:", error);
                Alert.alert(
                  "Camera Error",
                  "Failed to start camera. Please try manual input instead."
                );
                setScanMode("manual");
              }}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>Position QR code within frame</Text>
            </View>
          </View>
        ) : !CameraView ? (
          <View style={styles.permissionContainer}>
            <LinearGradient
              colors={["#1A1D2F", "#131523"]}
              style={styles.permissionGradient}>
              <Ionicons name="camera" size={48} color="#9DA3B4" />
              <Text style={styles.permissionTitle}>Camera Not Available</Text>
              <Text style={styles.permissionText}>
                Camera functionality is not available on this device. Please use
                manual input instead.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={() => setScanMode("manual")}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={["#6674CC", "#5A67D8"]}
                  style={styles.permissionButtonGradient}>
                  <Text style={styles.permissionButtonText}>
                    Use Manual Input
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.cameraLoading}>
            <ActivityIndicator size="large" color="#6674CC" />
            <Text style={styles.cameraLoadingText}>Starting camera...</Text>
          </View>
        )}
      </View>

      {/* Camera tip */}
      <View style={styles.tipContainer}>
        <LinearGradient
          colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
          style={styles.tipGradient}>
          <Ionicons name="bulb-outline" size={16} color="#6674CC" />
          <Text style={styles.tipText}>
            Make sure the QR code is well-lit and clearly visible in the frame
          </Text>
        </LinearGradient>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}>
            {/* Header with gradient background */}
            <LinearGradient
              colors={["#1A1D2F", "#131523"]}
              style={styles.headerGradient}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.1)",
                      "rgba(255, 255, 255, 0.05)",
                    ]}
                    style={styles.closeButtonGradient}>
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.title}>Join Collection</Text>
                <TouchableOpacity
                  style={styles.modeToggle}
                  onPress={toggleScanMode}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.1)",
                      "rgba(255, 255, 255, 0.05)",
                    ]}
                    style={styles.modeToggleGradient}>
                    <Ionicons
                      name={scanMode === "manual" ? "camera" : "keypad"}
                      size={20}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Content */}
            <View
              style={[
                styles.content,
                keyboardVisible && styles.contentKeyboardVisible,
              ]}>
              {scanMode === "manual"
                ? renderManualInput()
                : renderCameraScanner()}
            </View>

            {/* Footer with gradient background */}
            <LinearGradient
              colors={["#131523", "#1A1D2F"]}
              style={styles.footerGradient}>
              <View style={styles.footer}>
                {scanMode === "manual" && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !manualCode.trim() && styles.submitButtonDisabled,
                    ]}
                    onPress={handleManualSubmit}
                    disabled={!manualCode.trim() || loading}
                    activeOpacity={0.8}>
                    <LinearGradient
                      colors={
                        !manualCode.trim()
                          ? ["#4A5568", "#2D3748"]
                          : ["#6674CC", "#5A67D8", "#4C51BF"]
                      }
                      style={styles.submitButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>
                            Joining...
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Ionicons
                            name="add-circle"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.submitButtonText}>
                            Join Collection
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.1)",
                      "rgba(255, 255, 255, 0.05)",
                    ]}
                    style={styles.cancelButtonGradient}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#131523",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  headerGradient: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  closeButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  modeToggle: {
    borderRadius: 20,
    overflow: "hidden",
  },
  modeToggleGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
  },
  contentKeyboardVisible: {
    paddingTop: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 28,
    position: "relative",
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    zIndex: -1,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
    letterSpacing: 0.2,
  },
  inputContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  inputGradient: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(102, 116, 204, 0.3)",
  },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 3,
    fontWeight: "700",
  },
  pasteButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  pasteButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  pasteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6674CC",
    letterSpacing: 0.2,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  tipContainer: {
    marginBottom: 28,
  },
  tipGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  tipText: {
    fontSize: 14,
    color: "#6674CC",
    textAlign: "center",
    lineHeight: 20,
    flex: 1,
    letterSpacing: 0.2,
  },
  cameraContainer: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: "hidden",
    height: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
    borderRadius: 20,
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#6674CC",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scanText: {
    position: "absolute",
    bottom: -40,
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionGradient: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(102, 116, 204, 0.3)",
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  permissionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cameraLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
  },
  cameraLoadingText: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 12,
    textAlign: "center",
  },
  footerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 28,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  submitButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cancelButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cancelButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

export default InviteCodeScanner;
