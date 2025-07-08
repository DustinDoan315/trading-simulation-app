import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import React, { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface InviteCodeQRProps {
  visible: boolean;
  onClose: () => void;
  inviteCode: string;
  collectionName: string;
}

const InviteCodeQR: React.FC<InviteCodeQRProps> = ({
  visible,
  onClose,
  inviteCode,
  collectionName,
}) => {
  const qrRef = useRef<any>(null);
  const hiddenQrRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Set QR as ready after component mounts
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setQrReady(true);
        console.log("QR Code marked as ready");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const generateDeepLink = () => {
    return `myapp://join-collection?code=${inviteCode}&name=${encodeURIComponent(
      collectionName
    )}`;
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      animatePress();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const deepLink = generateDeepLink();
      const shareMessage = `🚀 Join my collection "${collectionName}" on TradingSim!\n\n📱 Invite Code: ${inviteCode}\n\n💡 Download the app and scan this QR code or use the invite code to join.\n\n🔗 Or click this link: ${deepLink}`;

      await Share.share({
        message: shareMessage,
        title: `Join ${collectionName}`,
        url: deepLink,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share invite code");
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      animatePress();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      Toast.show({
        type: "success",
        text1: "✅ Invite Code Copied!",
        text2: "The invite code has been copied to your clipboard",
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "❌ Copy Failed",
        text2: "Failed to copy invite code to clipboard",
        position: "top",
        visibilityTime: 2000,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Share Collection</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Collection Info */}
          <View style={styles.collectionInfo}>
            <View style={styles.collectionIcon}>
              <LinearGradient
                colors={["#6674CC", "#5A67D8"]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.collectionName}>{collectionName}</Text>
          </View>

          <Text style={styles.mainTitle}>Invite Friends to Join</Text>
          <Text style={styles.subtitle}>
            Share this invite code with friends to let them join your collection
          </Text>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>📱 Scan QR Code</Text>
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={generateDeepLink()}
                  size={200}
                  color="#6674CC"
                  backgroundColor="#1A1D2F"
                  logoSize={50}
                  logoBackgroundColor="#1A1D2F"
                  logoBorderRadius={10}
                  quietZone={15}
                  enableLinearGradient={false}
                  ref={qrRef}
                  onError={(error: any) =>
                    console.error("QR Code generation error:", error)
                  }
                />
              </View>
              <Text style={styles.qrText}>Point camera at QR code to join</Text>
            </View>
          </View>

          {/* Invite Code Section */}
          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>🔑 Manual Entry</Text>
            <View style={styles.codeContainer}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <TouchableOpacity
                  style={[styles.copyButton, copied && styles.copyButtonActive]}
                  onPress={handleCopyInviteCode}>
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={20}
                    color={copied ? "#10B981" : "#6674CC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <Text style={styles.sectionTitle}>📤 Share Options</Text>
            <View style={styles.optionsGrid}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleShare}>
                <LinearGradient
                  colors={["#6674CC", "#5A67D8"]}
                  style={styles.optionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}>
                  <Ionicons name="share-social" size={24} color="#FFFFFF" />
                  <Text style={styles.optionText}>Share Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  collectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  collectionIcon: {
    marginRight: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  collectionName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  qrSection: {
    marginBottom: 32,
  },
  qrContainer: {
    alignItems: "center",
  },
  qrWrapper: {
    backgroundColor: "#1A1D2F",
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: "#6674CC",
    marginBottom: 12,
    shadowColor: "#6674CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
  },
  codeSection: {
    marginBottom: 32,
  },
  codeContainer: {
    alignItems: "center",
  },
  codeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#6674CC",
    marginBottom: 8,
    minWidth: 300,
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 3,
  },
  copyButton: {
    position: "absolute",
    right: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
  },
  copyButtonActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  codeHint: {
    fontSize: 12,
    color: "#9DA3B4",
    textAlign: "center",
  },
  shareOptions: {
    marginBottom: 32,
  },
  optionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },

  optionGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(102, 116, 204, 0.2)",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#9DA3B4",
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  doneButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default InviteCodeQR;
