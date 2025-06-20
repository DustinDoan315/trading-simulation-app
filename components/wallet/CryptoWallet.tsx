import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableHighlight,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Currencies } from "@/utils/fake";
import { navigateToCryptoChart } from "@/utils/navigation";
import { DEFAULT_BALANCE, DEFAULT_CRYPTO_ID } from "@/utils/constant";

export default function CryptoWalletScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(Currencies[1]);
  const [assets, setAssets] = useState(Currencies);

  const [convertedAssets, setConvertedAssets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const convertAssetsToSelectedCurrency = () => {
      const converted = Currencies.filter((asset) => !asset.is_fiat).map(
        (asset) => {
          let convertedBalance, convertedFrozen;

          switch (selectedCurrency.name) {
            case "USDT":
              convertedBalance = asset.usdt_price;
              convertedFrozen =
                asset.frozen * (asset.usdt_price / asset.balance);
              break;
            case "EUR":
              convertedBalance = asset.eur_price;
              convertedFrozen =
                asset.frozen * (asset.eur_price / asset.balance);
              break;
            case "USD":
              convertedBalance = asset.usd_price;
              convertedFrozen =
                asset.frozen * (asset.usd_price / asset.balance);
              break;
            case "BTC":
              convertedBalance = asset.btc_price;
              convertedFrozen =
                asset.frozen * (asset.btc_price / asset.balance);
              break;
            case "VND":
              convertedBalance = asset.vnd_price;
              convertedFrozen =
                asset.frozen * (asset.vnd_price / asset.balance);
              break;
            default:
              convertedBalance = asset.usdt_price;
              convertedFrozen =
                asset.frozen * (asset.usdt_price / asset.balance);
          }

          return {
            ...asset,
            convertedBalance,
            convertedFrozen,
          };
        }
      );

      // Calculate total balance
      const total = converted.reduce(
        (sum, asset) => sum + asset.convertedBalance,
        0
      );

      setConvertedAssets(converted);
      setTotalBalance(total);
    };

    convertAssetsToSelectedCurrency();
  }, [selectedCurrency, assets]);

  // Mock data for assets

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate loading data
    setTimeout(() => {
      // Update asset values with slight variations to simulate real data
      setAssets(
        assets.map((asset) => ({
          ...asset,
          balance:
            asset.balance + (Math.random() * 2 - 1) * 0.05 * asset.balance,
        }))
      );
      setRefreshing(false);
    }, 1500);
  }, [assets]);

  const handleReset = () => {
    Alert.alert(
      t("wallet.resetConfirmTitle"),
      t("wallet.resetConfirmMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("wallet.reset"),
          onPress: () => {
            // Reset the portfolio using default values
            setAssets(
              assets.map((asset) => ({
                ...asset,
                balance:
                  asset.id === DEFAULT_CRYPTO_ID.tether ? DEFAULT_BALANCE : 0,
                frozen: 0,
              }))
            );
            Alert.alert(
              t("wallet.resetSuccessTitle"),
              t("wallet.resetSuccessMessage")
            );
          },
        },
      ]
    );
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden);
  };

  const handleCurrencySelect = () => {
    Alert.alert(
      t("wallet.selectCurrencyTitle"),
      t("wallet.selectCurrencyMessage"),
      [
        ...Currencies.map((currency) => ({
          text: currency.name,
          onPress: () => setSelectedCurrency(currency),
          style: "default" as const,
        })),
        {
          text: t("common.cancel"),
          style: "cancel" as const,
        },
      ]
    );
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const searchToken = () => {
    router.navigate("/(subs)/crypto-search");
  };

  const exchangeToken = () => {
    navigateToCryptoChart();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => Alert.alert(t("common.menu"))}
            style={styles.iconButton}>
            <Ionicons name="grid" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("wallet.title")}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>
              {t("wallet.totalEstimatedValue")}
            </Text>
            <TouchableOpacity onPress={toggleBalanceVisibility}>
              <Ionicons
                name={isBalanceHidden ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceAmount}>
              {isBalanceHidden ? "******" : formatNumber(totalBalance)}
            </Text>
            <TouchableOpacity
              style={styles.currencySelector}
              onPress={handleCurrencySelect}>
              <Text style={styles.currencyText}>{selectedCurrency?.name}</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReset}
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>{t("wallet.reset")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                t("wallet.history"),
                t("wallet.viewTransactionHistory")
              )
            }
            activeOpacity={0.7}>
            <Text style={styles.actionButtonText}>{t("wallet.history")}</Text>
          </TouchableOpacity>
        </View>

        {/* Tools */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(t("wallet.filter"), t("wallet.openAssetFilter"))
            }
            style={styles.iconButton}>
            <Feather name="sliders" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={searchToken} style={styles.iconButton}>
            <Feather name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Asset List */}
        <View style={styles.assetList}>
          {Currencies.filter((asset) => !asset.is_fiat).map((asset) => {
            // Dynamically select the price based on selectedCurrency
            const getPriceForCurrency = () => {
              const originalBalance = asset.balance;
              switch (selectedCurrency.name) {
                case "USDT":
                  return originalBalance * (asset.usdt_price / asset.balance);
                case "EUR":
                  return originalBalance * (asset.eur_price / asset.balance);
                case "USD":
                  return originalBalance * (asset.usd_price / asset.balance);
                case "VND":
                  return originalBalance * (asset.vnd_price / asset.balance);
                case "BTC":
                  return originalBalance * (asset.btc_price / asset.balance);
                default:
                  return originalBalance;
              }
            };

            const convertedBalance = getPriceForCurrency();
            const convertedFrozen =
              asset.frozen * (convertedBalance / asset.balance);

            return (
              <TouchableHighlight
                key={asset.id}
                onPress={() => exchangeToken()}
                underlayColor="#1C1C1E"
                style={styles.assetItemTouchable}>
                <View style={styles.assetItem}>
                  <View style={styles.assetItemLeft}>
                    <View
                      style={[
                        styles.assetIcon,
                        { backgroundColor: asset.color },
                      ]}>
                      <Text style={styles.assetIconText}>{asset.symbol}</Text>
                    </View>
                    <Text style={styles.assetName}>{asset.name}</Text>
                  </View>
                  <View style={styles.assetDetailsContainer}>
                    <View style={styles.assetDetails}>
                      <Text style={styles.assetDetailLabel}>
                        {t("wallet.equity")}
                      </Text>
                      <Text style={styles.assetDetailValue}>
                        {`${selectedCurrency.symbol}${formatNumber(
                          convertedBalance
                        )}`}
                      </Text>
                    </View>
                    <View style={styles.assetDetails}>
                      <Text style={styles.assetDetailLabel}>
                        {t("wallet.frozen")}
                      </Text>
                      <Text style={styles.assetDetailValue}>
                        {`${selectedCurrency.symbol}${formatNumber(
                          convertedFrozen
                        )}`}
                      </Text>
                    </View>
                    <View style={styles.assetDetails}>
                      <Text style={styles.assetDetailLabel}>
                        {t("wallet.available")}
                      </Text>
                      <Text style={styles.assetDetailValue}>
                        {`${selectedCurrency.symbol}${formatNumber(
                          convertedBalance - convertedFrozen
                        )}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableHighlight>
            );
          })}

          {/* Add more assets button */}
          <TouchableOpacity
            style={styles.addAssetButton}
            onPress={() =>
              Alert.alert(
                t("wallet.addAsset"),
                t("wallet.addNewAssetToPortfolio")
              )
            }>
            <Ionicons name="add-circle-outline" size={24} color="#666" />
            <Text style={styles.addAssetText}>{t("wallet.addNewAsset")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  headerButton: {
    backgroundColor: "#333",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerButtonText: {
    color: "white",
    fontSize: 14,
  },
  balanceSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: "white",
    fontSize: 15,
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  balanceAmount: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    padding: 5,
  },
  currencyText: {
    color: "white",
    fontSize: 18,
    marginRight: 5,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 25,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 25,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 25,
  },
  assetList: {
    marginTop: 15,
  },
  assetItemTouchable: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  assetItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  assetItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  assetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  assetIconText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  assetName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  assetDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  assetDetails: {
    flex: 1,
  },
  assetDetailLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  assetDetailValue: {
    color: "white",
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
  },
  addAssetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  addAssetText: {
    color: "#666",
    fontSize: 16,
    marginLeft: 10,
  },
});
