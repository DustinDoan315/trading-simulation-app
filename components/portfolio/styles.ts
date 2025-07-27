import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  errorText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  enhancedContainer: {
    position: "relative",
    paddingBottom: 20,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  balanceCardContainer: {
    marginBottom: 10,
  },
  enhancedStatsContainer: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  statsGradient: {
    padding: 14,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(140, 158, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(140, 158, 255, 0.2)",
    marginHorizontal: 20,
  },
  welcomeContainer: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  welcomeGradient: {
    padding: 20,
    alignItems: "center",
    borderRadius: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#9DA3B4",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  welcomeStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeStat: {
    alignItems: "center",
    flex: 1,
  },
  welcomeStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8C9EFF",
    marginBottom: 4,
  },
  welcomeStatLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  welcomeStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(140, 158, 255, 0.2)",
    marginHorizontal: 20,
  },
  // Assets Header Styles
  assetsHeader: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingTop: 6,
  },
  assetsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  assetsSubtitle: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#8C9EFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  // Enhanced AssetItem styles
  enhancedAssetContainer: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  assetGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  imageBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(140, 158, 255, 0.2)",
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 2,
  },
  amount: {
    fontSize: 14,
    color: "#9DA3B4",
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  percentageIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(140, 158, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  percentage: {
    fontSize: 14,
    color: "#8C9EFF",
    fontWeight: "600",
  },
  pnlContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pnlIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  pnlValue: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  pnlPercentage: {
    fontSize: 10,
    fontWeight: "500",
  },
  // OthersButton styles
  othersContainer: {
    backgroundColor: "#2A2D3C",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  othersName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  othersAmount: {
    color: "#8F95B2",
    fontSize: 14,
  },
  // User stats styles (keeping for backward compatibility)
  userStatsContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 6,
  },
});
