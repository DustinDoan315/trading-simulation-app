import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { store } from "@/store";
import { setBalance } from "@/features/balanceSlice";
import { UserBalance } from "@/services/CryptoService";

const USER_TIMEZONE = "Asia/Saigon"; // UTC+7

export async function updateDailyBalance() {
  try {
    // Get current balance from store
    const currentBalance = store.getState().balance.balance;

    // Create a copy of current balance to use as new balance
    const newBalance: UserBalance = {
      totalInUSD: currentBalance.totalInUSD,
      holdings: { ...currentBalance.holdings },
    };

    // Update the store with new balance (automatically calculates change)
    store.dispatch(setBalance(newBalance));

    console.log("Daily balance updated at", new Date().toISOString());
  } catch (error) {
    console.error("Error updating daily balance:", error);
  }
}

export function getUserLocalMidnightUTC() {
  const now = new Date();
  const userTime = toZonedTime(now, USER_TIMEZONE);

  // Set to midnight in user's timezone
  userTime.setHours(0, 0, 0, 0);

  // Convert back to UTC
  return fromZonedTime(userTime, USER_TIMEZONE);
}

export function isMidnightUTC() {
  const now = new Date();
  return (
    now.getUTCHours() === 0 &&
    now.getUTCMinutes() === 0 &&
    now.getUTCSeconds() < 10
  ); // 10 second window
}
