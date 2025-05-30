import { AppState } from "react-native";
import { format, addDays, isBefore, differenceInMilliseconds } from "date-fns";
import { toDate } from "date-fns-tz";

type ScheduledTask = {
  id: string;
  execute: () => Promise<void>;
  interval: number;
  lastRun?: Date;
};

class Scheduler {
  private tasks: ScheduledTask[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private timezone: string;

  constructor(timezone: string = "UTC") {
    this.timezone = timezone;
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    AppState.addEventListener("change", (state) => {
      if (state === "active") {
        this.checkAllTasks();
      }
    });
  }

  addDailyTask(
    id: string,
    execute: () => Promise<void>,
    targetHourUTC: number
  ) {
    const now = new Date();
    const todayUTC = toDate(now, { timeZone: this.timezone });
    let nextRun = new Date(todayUTC);

    // Set to target hour UTC
    nextRun.setUTCHours(targetHourUTC, 0, 0, 0);

    // If target time already passed today, schedule for tomorrow
    if (isBefore(nextRun, todayUTC)) {
      nextRun = addDays(nextRun, 1);
    }

    const initialDelay = differenceInMilliseconds(nextRun, todayUTC);
    const dailyInterval = 24 * 60 * 60 * 1000; // 24 hours in ms

    // Run immediately if within first minute of target hour
    if (initialDelay <= 60000) {
      execute();
    }

    this.tasks.push({
      id,
      execute,
      interval: dailyInterval,
      lastRun: new Date(),
    });

    // Schedule recurring execution
    this.timer = setTimeout(() => {
      execute();
      setInterval(execute, dailyInterval);
    }, initialDelay);
  }

  async checkAllTasks() {
    for (const task of this.tasks) {
      const now = new Date();
      const timeSinceLastRun = task.lastRun
        ? now.getTime() - task.lastRun.getTime()
        : Infinity;

      if (timeSinceLastRun > task.interval) {
        await task.execute();
        task.lastRun = now;
      }
    }
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.tasks = [];
  }
}

// Create global scheduler instance with UTC timezone
const scheduler = new Scheduler("UTC");

export default scheduler;
