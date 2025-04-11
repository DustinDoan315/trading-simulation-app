import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

interface SearchHistoryItem {
  id: string;
  text: string;
}

export default function CryptoSearch() {
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([
    { id: "1", text: "KAITO/ USDT 10x" },
    { id: "2", text: "USDC/ USDT 10x" },
  ]);
  const inputRef = useRef<TextInput>(null);

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: searchText,
      };
      setSearchHistory([newItem, ...searchHistory]);
      setSearchText("");
    }
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
            onChangeText={setSearchText}
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
            <TouchableOpacity key={item.id} style={styles.historyChip}>
              <Text style={styles.chipText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    paddingHorizontal: 16,
    backgroundColor: "#000",
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
    backgroundColor: "#000",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
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
  historyChip: {
    backgroundColor: "#222",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  chipText: {
    color: "white",
    fontSize: 14,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 420, // Position above keyboard
    left: 0,
    right: 0,
    backgroundColor: "#000",
  },
  bottomSearchBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
    backgroundColor: "#000",
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
});
