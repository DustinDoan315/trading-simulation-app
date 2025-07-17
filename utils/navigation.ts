import { Asset } from '@/types/crypto';
import { getCryptoIdFromSymbol } from './cryptoMapping';
import { NON_TRADEABLE_TOKENS } from './constant';
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
    // Check if the asset is a non-tradeable token (like USDT)
    const assetSymbol = asset.symbol?.toUpperCase();
    if (assetSymbol && NON_TRADEABLE_TOKENS.includes(assetSymbol as any)) {
      // Do nothing for non-tradeable tokens like USDT
      return;
    }

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
