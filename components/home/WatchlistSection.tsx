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
import { WatchlistItem } from './WatchlistItem';


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

export const WatchlistSection: React.FC<WatchlistSectionProps> = ({
  title = "Watchlist",
  cryptoList,
  refreshing,
  onRefresh,
  onItemPress,
  onAddPress,
  scrollEnabled,
}) => {
  const renderItem = ({
    item: crypto,
    index,
  }: {
    item: CryptoCurrency;
    index: number;
  }) => (
    <WatchlistItem
      key={`${crypto.id}-${index}`}
      crypto={crypto}
      onPress={onItemPress}
    />
  );

  return (
    <View style={styles.watchlistContainer}>
      <Text style={styles.watchlistTitle}>{title}</Text>

      <FlatList
        data={cryptoList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
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
