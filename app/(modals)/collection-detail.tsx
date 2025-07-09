import InviteCodeQR from "@/components/collections/InviteCodeQR";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import TradingContextIndicator from "@/components/trading/TradingContextIndicator";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store";
import { router, useLocalSearchParams } from "expo-router";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";
import { useCollectionsData } from "@/hooks/useCollectionsData";
import { useDualBalance } from "@/hooks/useDualBalance";
import { useSelector } from "react-redux";
import { useUser } from "@/context/UserContext";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CollectionDetailScreen = () => {
  const { user } = useUser();
  const { leaveCollection } = useCollectionsData();
  const { switchContext, loadCollection, currentBalance, currentPnL } =
    useDualBalance();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Get collection ID from route params
  const params = useLocalSearchParams();
  const collectionId = params.id as string;
  const collectionName = params.name as string;
  const isOwner = params.isOwner === "true";

  // Use cloud data hook for collection details and members
  const {
    collection: cloudCollection,
    members: cloudMembers,
    loading: cloudLoading,
    refreshing,
    error: cloudError,
    lastSyncTime,
    onRefresh,
  } = useCollectionDetail(collectionId);

  // Get collection data from Redux store as fallback
  const collections = useSelector((state: RootState) => state.user.collections);
  const fallbackCollection = useMemo(() => {
    const foundCollection = collections?.find(
      (c: any) => c.id === collectionId
    );
    if (foundCollection) {
      return {
        id: foundCollection.id,
        name: foundCollection.name,
        description:
          foundCollection.description ||
          "A trading collection for crypto enthusiasts",
        members: foundCollection.member_count || 0,
        maxMembers: foundCollection.max_members || 50,
        startingBalance: foundCollection.starting_balance || "100000",
        totalValue: parseFloat(foundCollection.total_volume || "0"),
        avgPnl: parseFloat(foundCollection.avg_pnl || "0"),
        status: foundCollection.status || "ACTIVE",
        startDate: foundCollection.start_date || "2024-01-15",
        endDate: foundCollection.end_date,
        inviteCode: foundCollection.invite_code || "ABC12345",
        isPublic: foundCollection.is_public || true,
        allowInvites: foundCollection.allow_invites || true,
      };
    }
    // Fallback data if collection not found
    return {
      id: collectionId,
      name: collectionName || "Collection Name",
      description: "A trading collection for crypto enthusiasts",
      members: 12,
      maxMembers: 50,
      startingBalance: "100000",
      totalValue: 150000,
      avgPnl: 2500,
      status: "ACTIVE",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      inviteCode: "ABC12345",
      isPublic: true,
      allowInvites: true,
    };
  }, [collections, collectionId, collectionName]);

  // Use cloud data if available, otherwise use fallback
  const collection = cloudCollection || fallbackCollection;
  const members = cloudMembers || [];

  // Set collection trading context when component mounts
  useEffect(() => {
    if (collectionId && user?.id) {
      switchContext({ type: "collection", collectionId });
      loadCollection(collectionId);
    }
  }, [collectionId, user?.id, switchContext, loadCollection]);

  const handleShareInvite = useCallback(() => {
    setShowQRModal(true);
  }, []);

  const handleQRModalClose = useCallback(() => {
    setShowQRModal(false);
  }, []);

  const handleLeaveCollection = useCallback(async () => {
    Alert.alert(
      "Leave Collection",
      `Are you sure you want to leave "${collection.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await leaveCollection(collection.id);
              Alert.alert("Success", "You have left the collection", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to leave collection");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [collection.name, collection.id, leaveCollection]);

  const handleEditCollection = useCallback(() => {
    // TODO: Navigate to edit collection screen
    Alert.alert("Edit Collection", "Edit functionality coming soon!");
  }, []);

  const handleDeleteCollection = useCallback(() => {
    Alert.alert(
      "Delete Collection",
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement delete collection
            Alert.alert(
              "Delete Collection",
              "Delete functionality coming soon!"
            );
          },
        },
      ]
    );
  }, [collection.name]);

  const handleStartTrading = useCallback(() => {
    // Navigate to trading screen with collection context
    router.push({
      pathname: "/(subs)/crypto-chart" as any,
      params: {
        collectionId: collectionId,
        collectionName: collection.name,
      },
    });
  }, [collectionId, collection.name]);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{collection.name}</Text>
        <View style={styles.headerRight}>
          {/* Sync Status Indicator */}
          {lastSyncTime && (
            <View style={styles.syncIndicator}>
              <Ionicons name="cloud-done" size={16} color="#10B981" />
              <Text style={styles.syncText}>
                {new Date(lastSyncTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              if (isOwner) {
                Alert.alert(
                  "Collection Options",
                  "What would you like to do?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Edit", onPress: handleEditCollection },
                    { text: "Share Invite", onPress: handleShareInvite },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: handleDeleteCollection,
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Collection Options",
                  "What would you like to do?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Share Invite", onPress: handleShareInvite },
                    {
                      text: "Leave",
                      style: "destructive",
                      onPress: handleLeaveCollection,
                    },
                  ]
                );
              }
            }}>
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }>
        <View style={styles.content}>
          {/* Trading Context Indicator */}
          <TradingContextIndicator
            collectionName={collection.name}
            showSwitchButton={false}
          />

          {/* Loading State */}
          {cloudLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6674CC" />
              <Text style={styles.loadingText}>Loading collection data...</Text>
            </View>
          )}

          {/* Error State */}
          {cloudError && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{cloudError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content - only show if not loading and no error */}
          {!cloudLoading && !cloudError && (
            <>
              {/* Collection Info Card */}
              <LinearGradient
                colors={["#1A1D2F", "#2A2D3F"]}
                style={styles.infoCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.infoHeader}>
                  <View style={styles.infoHeaderLeft}>
                    <Text style={styles.infoTitle}>Collection Info</Text>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#FFFFFF"
                      />
                      <Text style={styles.statusText}>{collection.status}</Text>
                    </View>
                  </View>
                  {isOwner && (
                    <View style={styles.ownerBadge}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ownerText}>Owner</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.description}>{collection.description}</Text>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemIcon}>
                      <Ionicons name="people" size={16} color="#6674CC" />
                    </View>
                    <View style={styles.infoItemContent}>
                      <Text style={styles.infoLabel}>Members</Text>
                      <Text style={styles.infoValue}>
                        {Math.max(collection.members, 1)}/
                        {collection.maxMembers}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemIcon}>
                      <Ionicons name="wallet" size={16} color="#10B981" />
                    </View>
                    <View style={styles.infoItemContent}>
                      <Text style={styles.infoLabel}>Starting Balance</Text>
                      <Text style={styles.infoValue}>
                        {formatCurrency(collection.startingBalance)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemIcon}>
                      <Ionicons name="trending-up" size={16} color="#6674CC" />
                    </View>
                    <View style={styles.infoItemContent}>
                      <Text style={styles.infoLabel}>Total Value</Text>
                      <Text style={styles.infoValue}>
                        {formatCurrency(collection.totalValue)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemIcon}>
                      <Ionicons name="analytics" size={16} color="#10B981" />
                    </View>
                    <View style={styles.infoItemContent}>
                      <Text style={styles.infoLabel}>Avg P&L</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          {
                            color:
                              Number(collection.avgPnl) >= 0
                                ? "#10B981"
                                : "#EF4444",
                          },
                        ]}>
                        {formatCurrency(collection.avgPnl)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dateInfo}>
                  <View style={styles.dateInfoHeader}>
                    <Ionicons name="calendar" size={16} color="#9DA3B4" />
                    <Text style={styles.dateLabel}>Duration</Text>
                  </View>
                  <Text style={styles.dateValue}>
                    {formatDate(collection.startDate)} -{" "}
                    {collection.endDate
                      ? formatDate(collection.endDate)
                      : "Ongoing"}
                  </Text>
                </View>
              </LinearGradient>

              {/* Quick Actions */}
              <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShareInvite}>
                    <LinearGradient
                      colors={["#6674CC", "#5A67D8"]}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      <Ionicons name="share-social" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Share Invite</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleStartTrading}>
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      <Ionicons name="trending-up" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Start Trading</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Share Info */}
                <View style={styles.shareInfo}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#9DA3B4"
                  />
                  <Text style={styles.shareInfoText}>
                    Share invite code or QR code with friends to let them join
                    this collection
                  </Text>
                </View>
              </View>

              {/* Your Collection Performance */}
              <LinearGradient
                colors={["#1A1D2F", "#2A2D3F"]}
                style={styles.performanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.performanceHeader}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Your Performance</Text>
                </View>

                <View style={styles.performanceStats}>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceLabel}>Current Balance</Text>
                    <Text style={styles.performanceValue}>
                      {formatCurrency(currentBalance.usdtBalance)}
                    </Text>
                  </View>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceLabel}>Total P&L</Text>
                    <Text
                      style={[
                        styles.performanceValue,
                        {
                          color:
                            currentPnL.totalPnL >= 0 ? "#10B981" : "#EF4444",
                        },
                      ]}>
                      {currentPnL.totalPnL >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(currentPnL.totalPnL))}
                    </Text>
                  </View>
                  <View style={styles.performanceStat}>
                    <Text style={styles.performanceLabel}>P&L %</Text>
                    <Text
                      style={[
                        styles.performanceValue,
                        {
                          color:
                            currentPnL.totalPnLPercentage >= 0
                              ? "#10B981"
                              : "#EF4444",
                        },
                      ]}>
                      {currentPnL.totalPnLPercentage >= 0 ? "+" : "-"}
                      {Math.abs(currentPnL.totalPnLPercentage).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Members List */}
              <LinearGradient
                colors={["#1A1D2F", "#2A2D3F"]}
                style={styles.membersCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.membersHeader}>
                  <View style={styles.membersHeaderLeft}>
                    <Ionicons name="people" size={20} color="#6674CC" />
                    <Text style={styles.sectionTitle}>Members</Text>
                  </View>
                  <View style={styles.membersCountContainer}>
                    <Text style={styles.membersCount}>
                      {Math.max(members.length, 1)} members
                    </Text>
                  </View>
                </View>

                {members.length === 1 && members[0]?.role === "OWNER" ? (
                  // Special UI for single owner
                  <View style={styles.singleOwnerContainer}>
                    <LinearGradient
                      colors={[
                        "rgba(255, 215, 0, 0.1)",
                        "rgba(255, 215, 0, 0.05)",
                      ]}
                      style={styles.singleOwnerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      <View style={styles.singleOwnerHeader}>
                        <View style={styles.singleOwnerAvatar}>
                          <Ionicons name="star" size={32} color="#FFD700" />
                        </View>
                        <View style={styles.singleOwnerInfo}>
                          <Text style={styles.singleOwnerName}>
                            {members[0].displayName}
                          </Text>
                          <Text style={styles.singleOwnerUsername}>
                            @{members[0].username}
                          </Text>
                          <View style={styles.singleOwnerBadge}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.singleOwnerBadgeText}>
                              Collection Owner
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.singleOwnerStats}>
                        <View style={styles.singleOwnerStat}>
                          <Text style={styles.singleOwnerStatLabel}>
                            Balance
                          </Text>
                          <Text style={styles.singleOwnerStatValue}>
                            {formatCurrency(members[0].balance)}
                          </Text>
                        </View>
                        <View style={styles.singleOwnerStat}>
                          <Text style={styles.singleOwnerStatLabel}>
                            Total P&L
                          </Text>
                          <Text
                            style={[
                              styles.singleOwnerStatValue,
                              {
                                color:
                                  Number(members[0].totalPnl) >= 0
                                    ? "#10B981"
                                    : "#EF4444",
                              },
                            ]}>
                            {Number(members[0].totalPnl) >= 0 ? "+" : "-"}
                            {formatCurrency(
                              Math.abs(Number(members[0].totalPnl))
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.singleOwnerMessage}>
                        <Ionicons
                          name="people-outline"
                          size={20}
                          color="#FFD700"
                        />
                        <Text style={styles.singleOwnerMessageText}>
                          You're the only member. Share the invite code to grow
                          your collection!
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ) : members.length > 0 ? (
                  // Regular members list
                  members.map((member, index) => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberRank}>
                        <Text style={styles.rankText}>#{member.rank}</Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>
                            {member.displayName}
                          </Text>
                          {member.role === "OWNER" && (
                            <View style={styles.ownerBadgeSmall}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.ownerTextSmall}>Owner</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.memberUsername}>
                          @{member.username}
                        </Text>
                      </View>
                      <View style={styles.memberStats}>
                        <Text style={styles.memberBalance}>
                          {formatCurrency(member.balance)}
                        </Text>
                        <Text
                          style={[
                            styles.memberPnl,
                            {
                              color:
                                Number(member.totalPnl) >= 0
                                  ? "#10B981"
                                  : "#EF4444",
                            },
                          ]}>
                          {Number(member.totalPnl) >= 0 ? "+" : "-"}
                          {formatCurrency(Math.abs(Number(member.totalPnl)))}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyMembers}>
                    <Ionicons name="people" size={24} color="#9DA3B4" />
                    <Text style={styles.emptyMembersText}>
                      No members found. Owner should be displayed.
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </>
          )}
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      {showQRModal && (
        <InviteCodeQR
          visible={showQRModal}
          inviteCode={collection.inviteCode}
          collectionName={collection.name}
          onClose={handleQRModalClose}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#9DA3B4",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#6674CC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syncIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  description: {
    fontSize: 14,
    color: "#9DA3B4",
    lineHeight: 20,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  infoItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoItemContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dateInfo: {
    borderTopWidth: 1,
    borderTopColor: "#2A2D3F",
    paddingTop: 16,
  },
  dateInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  actionsCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  shareInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2D3F",
    gap: 8,
  },
  shareInfoText: {
    fontSize: 12,
    color: "#9DA3B4",
    flex: 1,
    lineHeight: 16,
  },
  performanceCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  performanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  performanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  performanceStat: {
    alignItems: "center",
  },
  membersCard: {
    backgroundColor: "#1A1D2F",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2D3F",
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  membersCountContainer: {
    backgroundColor: "rgba(102, 116, 204, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membersCount: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D3F",
  },
  memberRank: {
    width: 40,
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6674CC",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ownerBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  ownerTextSmall: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFD700",
  },
  emptyMembers: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyMembersText: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    marginTop: 12,
  },
  // Single Owner Styles
  singleOwnerContainer: {
    marginBottom: 16,
  },
  singleOwnerGradient: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  singleOwnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  singleOwnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  singleOwnerInfo: {
    flex: 1,
  },
  singleOwnerName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  singleOwnerUsername: {
    fontSize: 14,
    color: "#9DA3B4",
    marginBottom: 8,
  },
  singleOwnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  singleOwnerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  singleOwnerStats: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 20,
  },
  singleOwnerStat: {
    flex: 1,
  },
  singleOwnerStatLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  singleOwnerStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  singleOwnerMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  singleOwnerMessageText: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  memberUsername: {
    fontSize: 12,
    color: "#9DA3B4",
  },
  memberStats: {
    alignItems: "flex-end",
  },
  memberBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  memberPnl: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CollectionDetailScreen;
