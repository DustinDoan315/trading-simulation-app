import React, {
  useCallback,
  useEffect,
  useRef,
  useState
  } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


// Lazy load camera modules to avoid crashes
let CameraView: any = null;
let useCameraPermissions: any = null;
let cameraAvailable = false;

try {
  const cameraModule = require("expo-camera");
  CameraView = cameraModule.CameraView;
  useCameraPermissions = cameraModule.useCameraPermissions;
  cameraAvailable = true;
} catch (error: any) {
  cameraAvailable = false;
}

let Clipboard: any = null;
let clipboardAvailable = false;

try {
  Clipboard = require("expo-clipboard");
  clipboardAvailable = true;
} catch (error: any) {
  clipboardAvailable = false;
}

const InviteCodeScreen: React.FC = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const [permission, requestPermission] =
    cameraAvailable && useCameraPermissions
      ? useCameraPermissions()
      : [null, () => {}];

  // Keyboard listeners
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

  // Camera mode management
  useEffect(() => {
    if (mode === "camera") {
      if (permission?.granted) {
        setCameraActive(true);
        setShowPermissionAlert(false);
      } else if (permission?.canAskAgain) {
        requestPermission();
      } else if (permission?.denied) {
        setShowPermissionAlert(true);
        setCameraActive(false);
      }
    } else {
      setCameraActive(false);
      setShowPermissionAlert(false);
      // Focus input after mode switch
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [
    mode,
    permission?.granted,
    permission?.canAskAgain,
    permission?.denied,
    requestPermission,
  ]);

  // Optimized handlers
  const handleSubmit = useCallback(async () => {
    if (inviteCode.trim().length >= 6) {
      setLoading(true);
      Keyboard.dismiss();

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        router.back();
      } catch (error) {
        Alert.alert("Error", "Failed to join collection. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid invite code (at least 6 characters)."
      );
    }
  }, [inviteCode]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setInviteCode("");
    setCameraActive(false);
    setShowPermissionAlert(false);
    router.back();
  }, []);

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleInputFocus = useCallback(() => {
    if (mode === "manual") {
      setKeyboardVisible(true);
    }
  }, [mode]);

  const handleInputBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const handleRequestPermission = useCallback(async () => {
    try {
      const result = await requestPermission();
      if (result?.granted) {
        setCameraActive(true);
        setShowPermissionAlert(false);
      } else {
        setShowPermissionAlert(true);
      }
    } catch (error) {
      setShowPermissionAlert(true);
    }
  }, [requestPermission]);

  const handleOpenSettings = useCallback(() => {
    Alert.alert(
      "Camera Permission Required",
      "Please enable camera access in your device settings to use QR code scanning.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            Alert.alert(
              "Settings",
              "Please go to Settings > Privacy & Security > Camera and enable access for this app."
            );
          },
        },
      ]
    );
  }, []);

  const handleBarcodeScanned = useCallback(async (result: any) => {
    if (result?.data) {
      const scannedCode = result.data.trim();
      if (scannedCode.length >= 6) {
        setCameraActive(false);
        setLoading(true);

        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          router.back();
        } catch (error) {
          Alert.alert("Error", "Failed to join collection. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        Alert.alert(
          "Invalid QR Code",
          "The scanned QR code doesn't contain a valid invite code."
        );
      }
    }
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (!clipboardAvailable || !Clipboard) {
        Alert.alert(
          "Clipboard Not Available",
          "Clipboard functionality is not available on this device."
        );
        return;
      }

      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText && clipboardText.trim().length >= 6) {
        setInviteCode(formatInviteCode(clipboardText));
        Alert.alert(
          "Code Pasted",
          "Invite code has been pasted from clipboard."
        );
      } else {
        Alert.alert(
          "No Valid Code",
          "No valid invite code found in clipboard."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to read from clipboard.");
    }
  }, []);

  const toggleMode = useCallback(() => {
    if (mode === "manual" && !cameraAvailable) {
      Alert.alert(
        "Camera Not Available",
        "Camera functionality is not available on this device. Please use manual input."
      );
      return;
    }
    setMode(mode === "manual" ? "camera" : "manual");
    Keyboard.dismiss();
  }, [mode]);

  const formatInviteCode = useCallback((text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return cleaned.slice(0, 12);
  }, []);

  const clearInviteCode = useCallback(() => {
    setInviteCode("");
  }, []);

  // Render functions (not memoized)
  function renderManualInput() {
    return (
      <>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#6674CC", "#5A67D8", "#4C51BF", "#7C3AED"]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Ionicons name="key-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.iconGlow} />
          <View style={styles.iconGlow2} />
        </View>

        <Text style={styles.mainTitle}>Enter Invite Code</Text>
        <Text style={styles.subtitle}>
          Type the invite code you received from the collection owner
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inviteCode}
            onChangeText={(text) => setInviteCode(formatInviteCode(text))}
            placeholder="Enter invite code..."
            placeholderTextColor="#9DA3B4"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            selectionColor="#6674CC"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <View style={styles.inputIcons}>
            {inviteCode.length > 0 && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={clearInviteCode}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={24} color="#9DA3B4" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handlePasteFromClipboard}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="clipboard-outline" size={24} color="#6674CC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <LinearGradient
            colors={["rgba(157, 163, 180, 0.12)", "rgba(157, 163, 180, 0.06)"]}
            style={styles.infoGradient}>
            <Ionicons name="information-circle" size={18} color="#9DA3B4" />
            <Text style={styles.infoText}>
              Invite codes are usually 6-12 characters long
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.tipContainer}>
          <LinearGradient
            colors={["rgba(102, 116, 204, 0.15)", "rgba(102, 116, 204, 0.08)"]}
            style={styles.tipGradient}>
            <Ionicons name="bulb-outline" size={18} color="#6674CC" />
            <Text style={styles.tipText}>
              You can also scan a QR code or paste from clipboard
            </Text>
          </LinearGradient>
        </View>
      </>
    );
  }

  function renderCameraScanner() {
    return (
      <>
        <View style={styles.cameraHeader}>
          <View style={styles.cameraIconContainer}>
            <LinearGradient
              colors={["#6674CC", "#5A67D8", "#4C51BF", "#7C3AED"]}
              style={styles.cameraIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.cameraTitle}>Scan QR Code</Text>
          <Text style={styles.cameraSubtitle}>
            Point your camera at the QR code to automatically join the
            collection
          </Text>
        </View>

        <View style={styles.cameraContainer}>
          {showPermissionAlert ? (
            <View style={styles.permissionContainer}>
              <LinearGradient
                colors={["rgba(26, 29, 47, 0.9)", "rgba(19, 21, 35, 0.9)"]}
                style={styles.permissionGradient}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="close-circle" size={48} color="#EF4444" />
                </View>
                <Text style={styles.permissionTitle}>Camera Access Denied</Text>
                <Text style={styles.permissionText}>
                  Camera permission was denied. Please enable it in your device
                  settings to scan QR codes.
                </Text>
                <View style={styles.permissionButtons}>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={handleRequestPermission}
                    activeOpacity={0.8}>
                    <LinearGradient
                      colors={["#6674CC", "#5A67D8", "#4C51BF"]}
                      style={styles.permissionButtonGradient}>
                      <Text style={styles.permissionButtonText}>Try Again</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.permissionButton,
                      styles.secondaryPermissionButton,
                    ]}
                    onPress={handleOpenSettings}
                    activeOpacity={0.8}>
                    <Text style={styles.secondaryPermissionButtonText}>
                      Open Settings
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          ) : !permission?.granted ? (
            <View style={styles.permissionContainer}>
              <LinearGradient
                colors={["rgba(26, 29, 47, 0.9)", "rgba(19, 21, 35, 0.9)"]}
                style={styles.permissionGradient}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="camera" size={48} color="#9DA3B4" />
                </View>
                <Text style={styles.permissionTitle}>
                  Camera Permission Required
                </Text>
                <Text style={styles.permissionText}>
                  We need camera access to scan QR codes
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={handleRequestPermission}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#6674CC", "#5A67D8", "#4C51BF"]}
                    style={styles.permissionButtonGradient}>
                    <Text style={styles.permissionButtonText}>
                      Grant Permission
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : cameraActive && cameraAvailable && CameraView ? (
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
                  setMode("manual");
                }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
                  <View
                    style={[styles.scanCorner, styles.scanCornerTopRight]}
                  />
                  <View
                    style={[styles.scanCorner, styles.scanCornerBottomLeft]}
                  />
                  <View
                    style={[styles.scanCorner, styles.scanCornerBottomRight]}
                  />
                </View>
                <View style={styles.scanInstructions}>
                  <Text style={styles.scanText}>
                    Position QR code within frame
                  </Text>
                  <View style={styles.scanPulse} />
                </View>
              </View>
            </View>
          ) : !cameraAvailable || !CameraView ? (
            <View style={styles.permissionContainer}>
              <LinearGradient
                colors={["rgba(26, 29, 47, 0.9)", "rgba(19, 21, 35, 0.9)"]}
                style={styles.permissionGradient}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="camera" size={48} color="#9DA3B4" />
                </View>
                <Text style={styles.permissionTitle}>Camera Not Available</Text>
                <Text style={styles.permissionText}>
                  Camera functionality is not available on this device.
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={() => setMode("manual")}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#6674CC", "#5A67D8", "#4C51BF"]}
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

        <View style={styles.cameraTips}>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color="#6674CC" />
            <Text style={styles.tipText}>Ensure QR code is well-lit</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="hand-left-outline" size={16} color="#6674CC" />
            <Text style={styles.tipText}>Hold device steady</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="scan-outline" size={16} color="#6674CC" />
            <Text style={styles.tipText}>Center code in frame</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <Pressable
      disabled={!keyboardVisible}
      style={styles.container}
      onPress={handleDismissKeyboard}>
      <StatusBar barStyle="light-content" backgroundColor="#131523" />

      <LinearGradient
        colors={["#131523", "#1A1D2F", "#2D3748"]}
        style={styles.backgroundGradient}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.headerGradient}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.15)",
                    "rgba(255, 255, 255, 0.08)",
                  ]}
                  style={styles.closeButtonGradient}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.title}>Join Collection</Text>
              {cameraAvailable && (
                <TouchableOpacity
                  style={styles.modeToggle}
                  onPress={toggleMode}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0.15)",
                      "rgba(255, 255, 255, 0.08)",
                    ]}
                    style={styles.modeToggleGradient}>
                    <Ionicons
                      name={mode === "manual" ? "camera" : "keypad"}
                      size={22}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View
            style={[
              styles.content,
              keyboardVisible && styles.contentWithKeyboard,
              { paddingBottom: keyboardVisible ? 20 : 120 },
            ]}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            {mode === "manual" ? renderManualInput() : renderCameraScanner()}
          </View>
        </View>
      </ScrollView>
      {!keyboardVisible && (
        <View style={styles.footer}>
          {mode === "manual" && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                !inviteCode.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!inviteCode.trim() || loading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={
                  !inviteCode.trim()
                    ? ["#4A5568", "#2D3748"]
                    : ["#6674CC", "#5A67D8", "#4C51BF", "#7C3AED"]
                }
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Joining...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Join Collection</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  closeButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  closeButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  modeToggle: {
    borderRadius: 24,
    overflow: "hidden",
  },
  modeToggleGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
    position: "relative",
  },
  contentWithKeyboard: {
    paddingTop: 24,
  },
  decorativeCircle1: {
    position: "absolute",
    top: 100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 200,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
  },
  decorativeCircle3: {
    position: "absolute",
    top: 300,
    left: 50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(102, 116, 204, 0.06)",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 36,
    position: "relative",
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  iconGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(102, 116, 204, 0.15)",
    zIndex: -1,
  },
  iconGlow2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    zIndex: -2,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.75,
  },
  subtitle: {
    fontSize: 17,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 48,
    letterSpacing: 0.3,
  },
  inputContainer: {
    position: "relative",
    backgroundColor: "rgba(26,29,47,0.8)",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 24,
    justifyContent: "center",
  },
  input: {
    width: "100%",
    fontSize: 20,
    color: "#fff",
    letterSpacing: 4,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  inputIcons: {
    position: "absolute",
    right: 16,
    top: "50%",
    flexDirection: "row",
    alignItems: "center",
    transform: [{ translateY: -16 }],
  },
  iconButton: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  inputActions: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  infoText: {
    fontSize: 15,
    color: "#9DA3B4",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  tipContainer: {
    marginBottom: 32,
  },
  tipGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "rgba(102, 116, 204, 0.15)",
  },
  tipText: {
    fontSize: 15,
    color: "#6674CC",
    textAlign: "center",
    lineHeight: 22,
    flex: 1,
    letterSpacing: 0.3,
  },
  cameraContainer: {
    marginBottom: 32,
    borderRadius: 24,
    overflow: "hidden",
    height: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
    borderRadius: 24,
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
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: "#6674CC",
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  scanText: {
    position: "absolute",
    bottom: -50,
    fontSize: 15,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionGradient: {
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(102, 116, 204, 0.4)",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: "#9DA3B4",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  permissionButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cameraLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
  },
  cameraLoadingText: {
    fontSize: 15,
    color: "#9DA3B4",
    marginTop: 16,
    textAlign: "center",
  },
  cameraHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  cameraIconContainer: {
    marginBottom: 16,
  },
  cameraIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  cameraTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cameraSubtitle: {
    fontSize: 15,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  permissionIconContainer: {
    marginBottom: 16,
  },
  scanCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#6674CC",
    borderWidth: 3,
  },
  scanCornerTopLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  scanCornerTopRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  scanCornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  scanCornerBottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstructions: {
    position: "absolute",
    bottom: -60,
    alignItems: "center",
  },
  scanPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6674CC",
    marginTop: 8,
    opacity: 0.8,
  },
  cameraTips: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tipItem: {
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    backgroundColor: "transparent",
  },
  submitButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#6674CC",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  permissionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryPermissionButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#9DA3B4",
  },
  secondaryPermissionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9DA3B4",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
});

export default InviteCodeScreen;
