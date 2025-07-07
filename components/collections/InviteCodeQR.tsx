import * as MediaLibrary from "expo-media-library";
import QRCode from "react-native-qrcode-svg";
import React, { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  Alert,
  Modal,
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

  const handleShare = async () => {
    try {
      const shareMessage = `Join my collection "${collectionName}" on TradingSim!\n\nInvite Code: ${inviteCode}\n\nDownload the app and enter this code to join.`;

      await Share.share({
        message: shareMessage,
        title: `Join ${collectionName}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share invite code");
    }
  };

  const handleSaveToGallery = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save images to your gallery"
        );
        return;
      }

      // Generate QR code as data URL
      if (qrRef.current) {
        qrRef.current.toDataURL((data: string) => {
          // Convert data URL to base64
          const base64Data = data.replace("data:image/png;base64,", "");

          // Save to media library
          MediaLibrary.saveToLibraryAsync(`data:image/png;base64,${base64Data}`)
            .then(() => {
              Alert.alert("Success", "QR code saved to gallery!");
            })
            .catch((error) => {
              Alert.alert("Error", "Failed to save QR code to gallery");
            });
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save QR code to gallery");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Invite Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={["#6674CC", "#5A67D8"]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="qr-code" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.mainTitle}>Share Invite Code</Text>
          <Text style={styles.subtitle}>
            Share this code with others to invite them to join "{collectionName}
            "
          </Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={inviteCode}
                size={180}
                color="#6674CC"
                backgroundColor="#1A1D2F"
                logoSize={40}
                logoBackgroundColor="#1A1D2F"
                logoBorderRadius={8}
                quietZone={10}
                enableLinearGradient={false}
                ref={qrRef}
              />
            </View>
            <Text style={styles.qrText}>Scan to join collection</Text>
          </View>

          {/* Invite Code Display */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color="#9DA3B4" />
            <Text style={styles.infoText}>
              Share this code with friends to invite them to your collection
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <LinearGradient
              colors={["#6674CC", "#5A67D8"]}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="share" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Invite Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveToGallery}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="download" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save QR Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 60,
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
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 40,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrWrapper: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#6674CC",
    marginBottom: 12,
  },
  qrText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: "#9DA3B4",
    marginBottom: 8,
    textAlign: "center",
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
  },
  codeText: {
    flex: 1,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 2,
  },
  copyButton: {
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  shareButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default InviteCodeQR;
