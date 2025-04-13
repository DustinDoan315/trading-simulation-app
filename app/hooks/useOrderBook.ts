import { OrderBookEntry } from "../types/crypto";
import { useEffect, useState } from "react";

export default function useOrderBook() {
  // Initial state
  const [askOrders, setAskOrders] = useState<OrderBookEntry[]>([
    { price: "83,051.9", amount: "7,88317" },
    { price: "83,051.5", amount: "0,00500" },
    { price: "83,050.0", amount: "9,30944" },
    { price: "83,049.9", amount: "0,00060" },
    { price: "83,049.8", amount: "7,10912" },
  ]);

  const [bidOrders, setBidOrders] = useState<OrderBookEntry[]>([
    { price: "83,049.7", amount: "8,44064" },
    { price: "83,049.2", amount: "0,02990" },
    { price: "83,049.1", amount: "8,59518" },
    { price: "83,049.0", amount: "0,01232" },
    { price: "83,048.0", amount: "8,93452" },
  ]);

  // Helper function to simulate price changes with preserved formatting
  const simulatePriceChange = (currentPrice: string, range: number = 0.2) => {
    const numericPrice = parseFloat(currentPrice.replace(",", "."));
    const variation = (Math.random() * 2 - 1) * range;
    const newPrice = numericPrice + variation;
    const decimalPlaces = 2;
    const randomDecimal = Math.floor(Math.random() * 100) / 100;
    return newPrice.toFixed(decimalPlaces).replace(".", ",") + randomDecimal;
  };

  // Update orders periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Update Ask Orders
      const newAskOrders = askOrders.map((order) => ({
        price: simulatePriceChange(order.price),
        amount: order.amount,
      }));
      setAskOrders(newAskOrders);

      // Update Bid Orders
      const newBidOrders = bidOrders.map((order) => ({
        price: simulatePriceChange(order.price, 0.1),
        amount: order.amount,
      }));
      setBidOrders(newBidOrders);
    }, 3000);

    return () => clearInterval(updateInterval);
  }, [askOrders, bidOrders]);

  return { askOrders, bidOrders };
}
