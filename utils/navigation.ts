import { Asset } from '@/types/crypto';
import { getCryptoIdFromSymbol } from './cryptoMapping';
import { router } from 'expo-router';

export const navigateToCryptoChart = (asset?: Asset) => {
  if (!asset || !asset.id) {
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: "bitcoin",
        symbol: "BTC/USDT",
        name: "Bitcoin",
        image:
          "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
      },
    });
  } else {
    // Use crypto ID if available, otherwise fallback to symbol mapping
    const cryptoId = asset.cryptoId || getCryptoIdFromSymbol(asset.symbol) || asset.id;
    
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: cryptoId,
        symbol: asset.symbol
          ? `${asset.symbol.toUpperCase()}/USDT`
          : "BTC/USDT",
        name: asset.name,
        image: asset.image || "",
      },
    });
  }
};
