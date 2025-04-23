import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  FlatList,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CryptoListItem from "@/components/crypto/CryptoListItem";
import TabBar from "@/components/crypto/TabBar";
import SortToggle from "@/components/crypto/SortToggle";
import { getMarketData, type CryptoCurrency } from "@/services/CryptoService";
import colors from "@/styles/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/app/store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CryptoMarketScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [cryptoData, setCryptoData] = useState<CryptoCurrency[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoCurrency[]>([]);
  const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCryptoData();
  }, []);

  useEffect(() => {
    if (selectedTab === "favorites") {
      setFilteredData(
        cryptoData.filter((item) => favoriteIds.includes(item.id))
      );
    } else if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredData(cryptoData);
    }
  }, [selectedTab, favoriteIds, cryptoData, searchQuery]);

  const loadCryptoData = async () => {
    try {
      setIsLoading(true);
      const market = await getMarketData(true, 10);
      const sortMarket = market.sort(
        (a, b) =>
          Math.abs(b.price_change_percentage_24h) -
          Math.abs(a.price_change_percentage_24h)
      );
      setCryptoData(sortMarket);
      setFilteredData(sortMarket);
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCryptoData();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = cryptoData.filter(
        (item) =>
          item.name.toLowerCase().includes(text.toLowerCase()) ||
          item.symbol.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(cryptoData);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleCryptoPress = (symbol: string) => {
    console.log(`Selected crypto: ${symbol}`);
  };

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <Text style={styles.headerLabel}>Tên</Text>
      <View style={styles.priceHeaderContainer}>
        <SortToggle
          label="Giá"
          onToggle={(direction) => console.log("Sort direction:", direction)}
        />
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.modalContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6674CC" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.modalContainer}>
        <SafeAreaView
          style={[
            styles.container,
            {
              maxHeight: SCREEN_HEIGHT * 0.9 - insets.top,
            },
          ]}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <View style={styles.header}></View>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* Tab bar */}
          <TabBar
            tabs={[
              { id: "favorites", label: "Yêu thích" },
              { id: "all", label: "Tất cả" },
              { id: "trending", label: "Hàng đầu" },
              { id: "more", label: "Xem thêm" },
            ]}
            selectedTab={selectedTab}
            onTabPress={handleTabChange}
          />

          {/* Crypto list */}
          <FlatList
            data={filteredData}
            renderItem={({ item }) => (
              <CryptoListItem crypto={item} onPress={handleCryptoPress} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderListHeader}
            onRefresh={onRefresh}
            refreshing={refreshing}
            bounces={true}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  container: {
    width: "100%",
    height: "90%",
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    paddingVertical: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  header: {
    marginTop: 10,
    width: 50,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.ui.toggle,
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    height: 40,
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  headerLabel: {
    color: "#8E8E93",
    fontSize: 14,
  },
  priceHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

export default CryptoMarketScreen;
