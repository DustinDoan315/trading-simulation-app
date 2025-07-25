import { OrderBookEntry } from '../types/crypto';
import { RootState } from '../store';
import {
  useCallback,
  useEffect,
  useMemo,
  useState
  } from 'react';
import { useSelector } from 'react-redux';


// Symbol-specific fallback prices
const getFallbackPrice = (symbol: string): number => {
  const symbolUpper = symbol.toUpperCase();
  switch (symbolUpper) {
    case 'BTC':
      return 45000;
    case 'ETH':
      return 2500;
    case 'SOL':
      return 166;
    case 'BNB':
      return 300;
    case 'ADA':
      return 0.5;
    case 'DOT':
      return 7;
    case 'LINK':
      return 15;
    case 'UNI':
      return 7;
    case 'MATIC':
      return 0.8;
    case 'LTC':
      return 70;
    default:
      return 100; 
  }
};

export default function useOrderBook(symbol: string = "BTC") {
  const baseSymbol = useMemo(() => symbol?.split('/')[0] || symbol, [symbol]);
  
  const realTimePrice = useSelector(
    (state: RootState) => state.cryptoPrices.prices[baseSymbol.toUpperCase()]
  );

  const allPrices = useSelector((state: RootState) => state.cryptoPrices.prices);

  const basePrice = useMemo(() => realTimePrice || getFallbackPrice(baseSymbol), [realTimePrice, baseSymbol]);

  const generateInitialOrders = useCallback((basePrice: number) => {
    const spread = basePrice * 0.0005;
    const askOrders = Array(5)
      .fill(0)
      .map((_, i) => ({
        price: (basePrice + spread * (5 - i)).toFixed(2),
        amount: (Math.random() * 10).toFixed(5),
      }));

    const bidOrders = Array(5)
      .fill(0)
      .map((_, i) => ({
        price: (basePrice - spread * (i + 1)).toFixed(2),
        amount: (Math.random() * 10).toFixed(5),
      }));

    return { askOrders, bidOrders };
  }, []);

  const initialOrders = useMemo(() => generateInitialOrders(basePrice), [generateInitialOrders, basePrice]);


  const [askOrders, setAskOrders] = useState<OrderBookEntry[]>(
    initialOrders.askOrders
  );
  const [bidOrders, setBidOrders] = useState<OrderBookEntry[]>(
    initialOrders.bidOrders
  );

  const simulatePriceChange = useCallback((currentPrice: string, range: number = 0.2) => {
    const numericPrice = parseFloat(currentPrice);
    const variation = (Math.random() * 2 - 1) * range;
    const newPrice = numericPrice + variation;
    const decimalPlaces = 2;
    return newPrice.toFixed(decimalPlaces);
  }, []);

  useEffect(() => {
    if (realTimePrice && realTimePrice !== basePrice) {
      console.log("useOrderBook: Updating orders with new real-time price:", realTimePrice);
      const newOrders = generateInitialOrders(realTimePrice);
      setAskOrders(newOrders.askOrders);
      setBidOrders(newOrders.bidOrders);
    }
  }, [realTimePrice, symbol, basePrice, generateInitialOrders]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Update Ask Orders
      const newAskOrders = askOrders.map((order) => ({
        price: simulatePriceChange(order.price),
        amount: (Math.random() * 10).toFixed(5),
      }));
      setAskOrders(newAskOrders);

      // Update Bid Orders
      const newBidOrders = bidOrders.map((order) => ({
        price: simulatePriceChange(order.price, 0.1),
        amount: (Math.random() * 10).toFixed(5),
      }));
      setBidOrders(newBidOrders);
    }, 3000);

    return () => clearInterval(updateInterval);
  }, [askOrders, bidOrders, symbol, simulatePriceChange]);

  // Calculate current price as midpoint between best bid and ask
  const currentPrice = useMemo(() => (
    (parseFloat(askOrders[0]?.price || "0") +
      parseFloat(bidOrders[0]?.price || "0")) /
    2
  ).toFixed(2), [askOrders, bidOrders]);

  return { askOrders, bidOrders, currentPrice };
}
