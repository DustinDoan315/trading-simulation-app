import React from 'react';
import { AddButton } from './AddButton';
import { CryptoCurrency } from '@/services/CryptoService';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
  } from 'react-native';
import { useAppSelector } from '@/store';
import { useLanguage } from '@/context/LanguageContext';
import { WatchListChild } from './WatchlistItem';


// components/home/WatchListSection.tsx

interface WatchListSectionProps {
  title?: string;
  cryptoList: CryptoCurrency[];
  refreshing: boolean;
  onRefresh: () => void;
  onItemPress: (crypto: CryptoCurrency) => void;
  onAddPress?: () => void;
  scrollEnabled?: boolean;
}

const WatchListSectionComponent: React.FC<WatchListSectionProps> = ({
  title = "Watchlist",
  cryptoList,
  refreshing,
  onRefresh,
  onItemPress,
  scrollEnabled,
}) => {
  const { t } = useLanguage();
  const favoriteIds = useAppSelector((state) => state.favorites.favoriteIds);
  const filteredList = cryptoList.filter((crypto) =>
    favoriteIds.includes(crypto.id)
  );

  const renderItem = React.useCallback(
    ({ item: crypto }: { item: CryptoCurrency }) => (
      <WatchListChild
        key={crypto.id}
        crypto={crypto}
        onPress={() => onItemPress(crypto)}
      />
    ),
    [onItemPress]
  );

  return (
    <View style={styles.watchlistContainer}>
      <Text style={styles.watchlistTitle}>{`${t("watchList.title")}`}</Text>

      <FlatList
        data={filteredList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled !== false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export const WatchListSection = React.memo(WatchListSectionComponent);

const styles = StyleSheet.create({
  watchlistContainer: {
    flex: 1,
    paddingTop: 12,
  },
  watchlistTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
