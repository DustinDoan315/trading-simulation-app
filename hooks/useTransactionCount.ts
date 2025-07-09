import { useEffect, useState } from "react";
import { UserService } from "@/services/UserService";

export const useTransactionCount = (userId: string | undefined) => {
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionCount = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch transactions to get the count
        const transactions = await UserService.getTransactions(userId, 1000); // Get a large number to count all
        setTransactionCount(transactions.length);
      } catch (err) {
        console.error("Error fetching transaction count:", err);
        setError("Failed to fetch transaction count");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionCount();
  }, [userId]);

  const refresh = async () => {
    if (userId) {
      try {
        setLoading(true);
        const transactions = await UserService.getTransactions(userId, 1000);
        setTransactionCount(transactions.length);
      } catch (err) {
        console.error("Error refreshing transaction count:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    transactionCount,
    loading,
    error,
    refresh,
  };
};
