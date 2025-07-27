import React from "react";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { Dimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

export const ShimmerBalanceSection = () => (
  <View style={styles.balanceSection}>
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={styles.balanceTitle}
      shimmerStyle={styles.shimmer}
    />
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={styles.balanceAmount}
      shimmerStyle={styles.shimmer}
    />
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={styles.balanceSub}
      shimmerStyle={styles.shimmer}
    />
  </View>
);

export const ShimmerPortfolioCard = () => (
  <View style={styles.portfolioCard}>
    <View style={styles.portfolioRow}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioValue}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioLabel}
      />
    </View>
    <View style={styles.portfolioRow}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioValue}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioLabel}
      />
    </View>
    <View style={styles.portfolioRow}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioValue}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.portfolioLabel}
      />
    </View>
  </View>
);

export const ShimmerNewsCard = () => (
  <View style={styles.newsCard}>
    <ShimmerPlaceHolder
      LinearGradient={LinearGradient}
      style={styles.newsImage}
    />
    <View style={styles.newsTextContainer}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.newsTitle}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={styles.newsSubtitle}
      />
    </View>
  </View>
);

export const ShimmerQuickActions = () => (
  <View style={styles.quickActionsGrid}>
    {[1, 2, 3, 4].map((_, idx) => (
      <View key={idx} style={styles.quickActionCard}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={styles.quickActionIcon}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={styles.quickActionTitle}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={styles.quickActionSubtitle}
        />
      </View>
    ))}
  </View>
);

export const ShimmerLeaderboardHeader = () => (
  <View style={leaderboardStyles.headerContainer}>
    <View style={leaderboardStyles.userRankSection}>
      <View style={leaderboardStyles.rankDisplay}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 8 }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 80, height: 16, borderRadius: 8, marginBottom: 4 }}
        />
      </View>
    </View>
    <View style={leaderboardStyles.statsSection}>
      {[1, 2, 3].map((_, idx) => (
        <View key={idx} style={leaderboardStyles.statCard}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 40, height: 20, borderRadius: 8, marginBottom: 4 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 60, height: 12, borderRadius: 6 }}
          />
        </View>
      ))}
    </View>
  </View>
);

export const ShimmerLeaderboardItem = () => (
  <View style={leaderboardStyles.rankedItem}>
    <View style={leaderboardStyles.rankSection}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
    </View>
    <View style={leaderboardStyles.infoSection}>
      <View style={leaderboardStyles.userInfo}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: 24, height: 24, borderRadius: 12, marginRight: 12 }}
        />
        <View style={leaderboardStyles.nameContainer}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 80, height: 14, borderRadius: 7, marginBottom: 2 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: 60, height: 12, borderRadius: 6 }}
          />
        </View>
      </View>
      <View style={leaderboardStyles.statsContainer}>
        {[1, 2].map((_, idx) => (
          <View key={idx} style={leaderboardStyles.statItem}>
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{
                width: 50,
                height: 14,
                borderRadius: 7,
                marginBottom: 2,
              }}
            />
            <ShimmerPlaceHolder
              LinearGradient={LinearGradient}
              style={{ width: 40, height: 10, borderRadius: 5 }}
            />
          </View>
        ))}
      </View>
    </View>
  </View>
);

export const ShimmerWatchlistStatsCard = () => (
  <View style={watchlistStyles.statsCard}>
    <View style={watchlistStyles.statsHeader}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.statsTitle}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.statsBadge}
      />
    </View>
    <View style={watchlistStyles.statsGrid}>
      {[1, 2, 3].map((_, idx) => (
        <View key={idx} style={watchlistStyles.statItem}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={watchlistStyles.statIconContainer}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={watchlistStyles.statValue}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={watchlistStyles.statLabel}
          />
        </View>
      ))}
    </View>
  </View>
);

export const ShimmerWatchlistItem = () => (
  <View style={watchlistStyles.watchlistItem}>
    <View style={watchlistStyles.itemLeft}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.cryptoIcon}
      />
      <View style={watchlistStyles.cryptoInfo}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={watchlistStyles.cryptoName}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={watchlistStyles.cryptoSymbol}
        />
      </View>
    </View>
    <View style={watchlistStyles.itemRight}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.priceValue}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.priceChange}
      />
    </View>
  </View>
);

export const ShimmerWatchlistEmptyState = () => (
  <View style={watchlistStyles.emptyState}>
    <View style={watchlistStyles.emptyStateCard}>
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.emptyStateIcon}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.emptyStateTitle}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.emptyStateDescription}
      />
      <ShimmerPlaceHolder
        LinearGradient={LinearGradient}
        style={watchlistStyles.emptyStateButton}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  balanceSection: {
    marginVertical: 16,
    alignItems: "center",
  },
  balanceTitle: {
    width: screenWidth * 0.4,
    height: 18,
    borderRadius: 8,
    marginBottom: 8,
  },
  balanceAmount: {
    width: screenWidth * 0.6,
    height: 32,
    borderRadius: 12,
    marginBottom: 8,
  },
  balanceSub: {
    width: screenWidth * 0.3,
    height: 14,
    borderRadius: 7,
  },
  portfolioCard: {
    backgroundColor: "#23263A",
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  portfolioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  portfolioValue: {
    width: screenWidth * 0.25,
    height: 20,
    borderRadius: 8,
    marginRight: 12,
  },
  portfolioLabel: {
    width: screenWidth * 0.2,
    height: 14,
    borderRadius: 7,
  },
  newsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23263A",
    borderRadius: 12,
    marginVertical: 8,
    padding: 12,
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  newsTextContainer: {
    flex: 1,
  },
  newsTitle: {
    width: "80%",
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  newsSubtitle: {
    width: "60%",
    height: 12,
    borderRadius: 6,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  quickActionCard: {
    width: screenWidth * 0.42,
    height: 100,
    backgroundColor: "#23263A",
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  quickActionTitle: {
    width: "60%",
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    width: "40%",
    height: 10,
    borderRadius: 5,
  },
  shimmer: {
    marginBottom: 8,
  },
});

const leaderboardStyles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  userRankSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  rankDisplay: {
    alignItems: "center",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  rankedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1A1D2F",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankSection: {
    marginRight: 16,
  },
  infoSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    marginLeft: 16,
  },
});

const watchlistStyles = StyleSheet.create({
  statsCard: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.15)",
    elevation: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  statsTitle: {
    width: 120,
    height: 18,
    borderRadius: 8,
  },
  statsBadge: {
    width: 80,
    height: 24,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
  },
  statValue: {
    width: 40,
    height: 26,
    borderRadius: 8,
    marginBottom: 8,
  },
  statLabel: {
    width: 50,
    height: 11,
    borderRadius: 6,
  },
  watchlistItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(102, 126, 234, 0.05)",
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.1)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cryptoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoName: {
    width: 80,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  cryptoSymbol: {
    width: 60,
    height: 12,
    borderRadius: 6,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  priceValue: {
    width: 80,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  priceChange: {
    width: 60,
    height: 14,
    borderRadius: 7,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyStateCard: {
    alignItems: "center",
    padding: 48,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(102, 126, 234, 0.2)",
    elevation: 16,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: screenWidth - 48,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  emptyStateTitle: {
    width: "90%",
    height: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  emptyStateDescription: {
    width: "70%",
    height: 14,
    borderRadius: 7,
    marginBottom: 20,
  },
  emptyStateButton: {
    width: "80%",
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007BFF",
  },
});
