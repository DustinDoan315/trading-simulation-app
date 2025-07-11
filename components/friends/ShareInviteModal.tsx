import colors from '@/styles/colors';
import React, { useEffect, useState } from 'react';
import { FriendsService } from '@/services/FriendsService';
import { useNotification } from '@/components/ui/Notification';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface ShareInviteModalProps {
  userId: string;
  onClose: () => void;
}

const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  userId,
  onClose,
}) => {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  const generateInviteCode = async () => {
    try {
      setIsLoading(true);
      const code = await FriendsService.createInvitation({
        created_by: userId,
        max_uses: 10,
      });
      setInviteCode(code);
    } catch (error) {
      console.error("Error generating invite code:", error);
      showNotification({
        type: "error",
        message: "Failed to generate invite code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateInviteCode();
  }, [userId]);

  const handleShare = async () => {
    if (!inviteCode) return;

    try {
      const shareMessage = `Join me on TradingSim! Use my invite code: ${inviteCode}\n\nDownload the app and enter this code to become my friend and compete on the leaderboard!`;

      await Share.share({
        message: shareMessage,
        title: "Join TradingSim",
      });
    } catch (error) {
      console.error("Error sharing invite:", error);
    }
  };

  const handleCopyCode = () => {
    // You can implement clipboard functionality here
    Alert.alert("Copied!", "Invite code copied to clipboard");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Invite</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Share this invite code with friends to add them to your friends list
          and compete together!
        </Text>

        <View style={styles.inviteCodeContainer}>
          <Text style={styles.inviteCodeLabel}>Your Invite Code:</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.inviteCode}>
              {isLoading ? "Generating..." : inviteCode}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
              disabled={isLoading}>
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={isLoading}>
            <Text style={styles.shareButtonText}>Share Invite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={generateInviteCode}
            disabled={isLoading}>
            <Text style={styles.regenerateButtonText}>
              {isLoading ? "Generating..." : "Generate New Code"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Share your invite code with friends{"\n"}
            2. Friends enter the code in the app{"\n"}
            3. You'll be automatically added as friends{"\n"}
            4. Compete together on the friends leaderboard!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1D2F",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#9DA3B4",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: "#9DA3B4",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  inviteCodeContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: "#9DA3B4",
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6674CC",
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: "#252A3D",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  shareButton: {
    backgroundColor: "#6674CC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  regenerateButton: {
    backgroundColor: "#252A3D",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  regenerateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#9DA3B4",
    lineHeight: 20,
  },
});

export default ShareInviteModal;
