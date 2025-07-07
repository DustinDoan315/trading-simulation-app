import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
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

interface InviteCodeInputProps {
  visible: boolean;
  onClose: () => void;
  onCodeSubmitted: (code: string) => void;
  loading?: boolean;
}

const { height: screenHeight } = Dimensions.get("window");

const InviteCodeInput: React.FC<InviteCodeInputProps> = ({
  visible,
  onClose,
  onCodeSubmitted,
  loading = false,
}) => {
  const [inviteCode, setInviteCode] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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

      // Auto-focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
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
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const handleSubmit = () => {
    if (inviteCode.trim().length >= 6) {
      Keyboard.dismiss();
      onCodeSubmitted(inviteCode.trim());
      setInviteCode("");
    } else {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid invite code (at least 6 characters)."
      );
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setInviteCode("");
    onClose();
  };

  const formatInviteCode = (text: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    // Limit to 12 characters
    return cleaned.slice(0, 12);
  };

  const handlePaste = async () => {
    try {
      // For now, we'll just show a message since clipboard API might need additional setup
      Alert.alert(
        "Paste Feature",
        "You can paste your invite code directly into the input field."
      );
    } catch (error) {
      console.log("Paste not available");
    }
  };

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
                <View style={styles.placeholder} />
              </View>
            </LinearGradient>

            {/* Content */}
            <View
              style={[
                styles.content,
                keyboardVisible && styles.contentKeyboardVisible,
              ]}>
              {/* Icon with enhanced gradient */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={["#6674CC", "#5A67D8", "#4C51BF"]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  <Ionicons name="key-outline" size={32} color="#FFFFFF" />
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
                    value={inviteCode}
                    onChangeText={(text) =>
                      setInviteCode(formatInviteCode(text))
                    }
                    placeholder="Enter invite code..."
                    placeholderTextColor="#9DA3B4"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                    selectionColor="#6674CC"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <View style={styles.inputActions}>
                    {inviteCode.length > 0 && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setInviteCode("")}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#9DA3B4"
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handlePaste}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name="clipboard-outline"
                        size={20}
                        color="#6674CC"
                      />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {/* Info section with enhanced styling */}
              <View style={styles.infoContainer}>
                <LinearGradient
                  colors={[
                    "rgba(157, 163, 180, 0.1)",
                    "rgba(157, 163, 180, 0.05)",
                  ]}
                  style={styles.infoGradient}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#9DA3B4"
                  />
                  <Text style={styles.infoText}>
                    Invite codes are usually 6-12 characters long
                  </Text>
                </LinearGradient>
              </View>

              {/* Tip section with enhanced styling */}
              <View style={styles.tipContainer}>
                <LinearGradient
                  colors={[
                    "rgba(102, 116, 204, 0.1)",
                    "rgba(102, 116, 204, 0.05)",
                  ]}
                  style={styles.tipGradient}>
                  <Ionicons name="bulb-outline" size={16} color="#6674CC" />
                  <Text style={styles.tipText}>
                    You can copy and paste the invite code from a message or
                    email
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Footer with gradient background */}
            <LinearGradient
              colors={["#131523", "#1A1D2F"]}
              style={styles.footerGradient}>
              <View style={styles.footer}>
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
                        : ["#6674CC", "#5A67D8", "#4C51BF"]
                    }
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}>
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Joining...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>
                          Join Collection
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

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
  placeholder: {
    width: 40,
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
    marginBottom: 28,
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
    paddingRight: 88,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 3,
    fontWeight: "700",
  },
  inputActions: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -10,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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

export default InviteCodeInput;
