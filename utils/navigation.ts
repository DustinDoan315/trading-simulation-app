import { Asset } from "@/app/types/crypto";
import { router } from "expo-router";

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
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: asset.id,
        symbol: asset.symbol
          ? `${asset.symbol.toUpperCase()}/USDT`
          : "BTC/USDT",
        name: asset.name,
        image: asset.image || "",
      },
    });
  }
};
