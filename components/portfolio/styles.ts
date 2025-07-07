import { StyleSheet } from 'react-native';

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
    paddingHorizontal: 15,
  },
  errorText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  // AssetItem styles
  assetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1A1D2F",
    marginVertical: 6,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nameContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  amount: {
    fontSize: 14,
    color: "#9DA3B4",
    marginTop: 3,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  percentage: {
    fontSize: 14,
    marginTop: 2,
    color: "#6674CC",
  },
  pnlContainer: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  pnlValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  pnlPercentage: {
    fontSize: 10,
    marginTop: 1,
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
  // User stats styles
  userStatsContainer: {
    backgroundColor: "#1A1D2F",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
