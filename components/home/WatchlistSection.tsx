import React from "react";
import { AddButton } from "./AddButton";
import { CryptoCurrency } from "@/services/CryptoService";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { WatchlistItem } from "./WatchlistItem";
import { useAppSelector } from "@/app/store";

// components/home/WatchlistSection.tsx

interface WatchlistSectionProps {
  title?: string;
  cryptoList: CryptoCurrency[];
  refreshing: boolean;
  onRefresh: () => void;
  onItemPress: (id: string) => void;
  onAddPress?: () => void;
  scrollEnabled?: boolean;
}

const WatchlistSectionComponent: React.FC<WatchlistSectionProps> = ({
  title = "Watchlist",
  cryptoList,
  refreshing,
  onRefresh,
  onItemPress,
  onAddPress,
  scrollEnabled,
}) => {
  const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);
  const filteredList = cryptoList.filter((crypto) =>
    favoriteIds.includes(crypto.id)
  );

  const renderItem = React.useCallback(
    ({ item: crypto }: { item: CryptoCurrency }) => (
      <WatchlistItem key={crypto.id} crypto={crypto} onPress={onItemPress} />
    ),
    [onItemPress]
  );

  return (
    <View style={styles.watchlistContainer}>
      <Text style={styles.watchlistTitle}>{title}</Text>

      <FlatList
        data={filteredList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled !== false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={<AddButton onPress={onAddPress} />}
      />
    </View>
  );
};

export const WatchlistSection = React.memo(WatchlistSectionComponent);

const styles = StyleSheet.create({
  watchlistContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  watchlistTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
