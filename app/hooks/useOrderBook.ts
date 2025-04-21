import { OrderBookEntry } from "../types/crypto";
import { useEffect, useState } from "react";

export default function useOrderBook(symbol: string = 'BTC') {
  // Get base price based on symbol
  const getBasePrice = () => {
    switch(symbol) {
      case 'BTC': return 83000;
      case 'ETH': return 4000;
      case 'BNB': return 600;
      case 'SOL': return 180;
      default: return 100;
    }
  };

  // Generate initial orders
  const generateInitialOrders = (basePrice: number) => {
    const spread = basePrice * 0.0005; // 0.05% spread
    const askOrders = Array(5).fill(0).map((_, i) => ({
      price: (basePrice + spread * (5 - i)).toFixed(2).replace('.', ','),
      amount: (Math.random() * 10).toFixed(5).replace('.', ',')
    }));
    
    const bidOrders = Array(5).fill(0).map((_, i) => ({
      price: (basePrice - spread * (i + 1)).toFixed(2).replace('.', ','),
      amount: (Math.random() * 10).toFixed(5).replace('.', ',')
    }));

    return { askOrders, bidOrders };
  };

  const basePrice = getBasePrice();
  const initialOrders = generateInitialOrders(basePrice);

  // Initial state
  const [askOrders, setAskOrders] = useState<OrderBookEntry[]>(initialOrders.askOrders);
  const [bidOrders, setBidOrders] = useState<OrderBookEntry[]>(initialOrders.bidOrders);

  // Helper function to simulate price changes with preserved formatting
  const simulatePriceChange = (currentPrice: string, range: number = 0.2) => {
    const numericPrice = parseFloat(currentPrice.replace(",", "."));
    const variation = (Math.random() * 2 - 1) * range;
    const newPrice = numericPrice + variation;
    const decimalPlaces = 2;
    return newPrice.toFixed(decimalPlaces).replace(".", ",");
  };

  // Update orders periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Update Ask Orders
      const newAskOrders = askOrders.map((order) => ({
        price: simulatePriceChange(order.price),
        amount: (Math.random() * 10).toFixed(5).replace('.', ','),
      }));
      setAskOrders(newAskOrders);

      // Update Bid Orders
      const newBidOrders = bidOrders.map((order) => ({
        price: simulatePriceChange(order.price, 0.1),
        amount: (Math.random() * 10).toFixed(5).replace('.', ','),
      }));
      setBidOrders(newBidOrders);
    }, 3000);

    return () => clearInterval(updateInterval);
  }, [askOrders, bidOrders, symbol]);

  // Calculate current price as midpoint between best bid and ask
  const currentPrice = ((parseFloat(askOrders[0]?.price.replace(',', '.')) + 
                        parseFloat(bidOrders[0]?.price.replace(',', '.'))) / 2)
                        .toFixed(2).replace('.', ',');

  return { askOrders, bidOrders, currentPrice };
}
