import React, { useRef, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "../store";
import {
  addSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
} from "../features/searchHistorySlice";
import {
  searchCryptocurrencies,
  CryptoCurrency,
} from "../../services/CryptoService";
import CryptoListItem from "../../components/crypto/CryptoListItem";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/styles/colors";

interface SearchHistoryItem {
  id: string;
  text: string;
}

export default function CryptoSearch() {
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [suggestions, setSuggestions] = useState<CryptoCurrency[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dispatch = useAppDispatch();
  const searchHistory = useAppSelector((state) => state.searchHistory.items);
  const inputRef = useRef<TextInput>(null);

  const handleClearHistory = () => {
    dispatch(clearSearchHistory());
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const results = await searchCryptocurrencies(searchText);
      setSearchResults(results);

      if (results.length > 0) {
        const newItem = {
          id: Date.now().toString(),
          text: searchText,
          timestamp: Date.now(),
        };
        dispatch(addSearchHistory(newItem));
      } else {
        setSearchError("No results found");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setSearchText("");
    }
  };

  const handleHistoryItemPress = (item: SearchHistoryItem) => {
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: { symbol: item.text },
    });
  };

  const handleCancel = () => {
    setSearchText("");
    inputRef.current?.blur();
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button */}
      <View style={styles.headerContainer}></View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={22}
            color="#777"
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text.toUpperCase());
              if (text.length >= 3) {
                searchCryptocurrencies(text, 10).then((results) => {
                  setSuggestions(results);
                  setShowSuggestions(true);
                });
              } else {
                setShowSuggestions(false);
              }
            }}
            placeholder="Tìm kiếm tiền mã hóa, bot"
            placeholderTextColor="#777"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Huỷ</Text>
        </TouchableOpacity>
      </View>

      {/* Search History Section */}
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Lịch sử tìm kiếm</Text>
          <TouchableOpacity onPress={handleClearHistory}>
            <Feather name="trash-2" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}>
          {searchHistory.map((item) => (
            <View key={item.id} style={styles.historyChipContainer}>
              <TouchableOpacity
                style={styles.historyChip}
                onPress={() => handleHistoryItemPress(item)}>
                <Text style={styles.chipText}>{item.text}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteChipButton}
                onPress={() => dispatch(removeSearchHistoryItem(item.id))}>
                <Ionicons name="close" size={16} color="#777" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Suggestions Section */}
      {showSuggestions &&
        searchResults.length == 0 &&
        suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Gợi ý</Text>
            <ScrollView style={styles.suggestionsList}>
              {suggestions.map((crypto) => (
                <CryptoListItem
                  key={crypto.id}
                  crypto={crypto}
                  onPress={(symbol) => {
                    setShowSuggestions(false);
                    router.push({
                      pathname: "/(subs)/crypto-chart",
                      params: { symbol },
                    });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Kết quả</Text>
          <ScrollView style={styles.resultsList}>
            {searchResults.map((crypto) => (
              <CryptoListItem
                key={crypto.id}
                crypto={crypto}
                onPress={(symbol) => {
                  router.push({
                    pathname: "/(subs)/crypto-chart",
                    params: { symbol },
                  });
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerContainer: {
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 0,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    paddingVertical: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "white",
    fontSize: 16,
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  chipsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  historyChipContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  historyChip: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  deleteChipButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  chipText: {
    color: "white",
    fontSize: 14,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 420,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
  },
  bottomSearchBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
    backgroundColor: colors.background.primary,
  },
  bottomSearchText: {
    color: "#777",
    fontSize: 16,
  },
  doneButton: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    paddingVertical: 5,
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  key: {
    width: 40,
    height: 45,
    borderRadius: 5,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  spaceKey: {
    width: 200,
    height: 45,
    borderRadius: 5,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  searchKey: {
    backgroundColor: "#0078FF",
    width: 70,
  },
  keyText: {
    color: "white",
    fontSize: 16,
  },
  searchKeyText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  resultsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultsList: {
    flex: 1,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  suggestionsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  suggestionsList: {
    flex: 1,
  },
});
