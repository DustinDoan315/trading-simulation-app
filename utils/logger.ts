import { captureException } from './sentry';
// utils/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = __DEV__;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only show logs in development
    if (this.isDevelopment) {
      const prefix = context ? `[${context}]` : "";
      const logMessage = `${prefix} ${message}`;

      switch (level) {
        case "debug":
          console.log(logMessage, data || "");
          break;
        case "info":
          console.info(logMessage, data || "");
          break;
        case "warn":
          console.warn(logMessage, data || "");
          break;
        case "error":
          console.error(logMessage, data || "");
          break;
      }
    }

    // Send error logs to Sentry in production
    if (level === "error" && !this.isDevelopment) {
      try {
        // If data is an Error object, capture it as an exception
        if (data instanceof Error) {
          const errorContext: Record<string, any> = {
            logger: {
              context: context || "Logger",
              originalMessage: message,
            },
          };
          
          // Add any additional context from the error
          if (data.message) {
            errorContext.errorMessage = data.message;
          }
          
          captureException(data, errorContext);
        } else {
          // Create an error from the message and capture it
          const error = new Error(message);
          const errorContext: Record<string, any> = {
            logger: {
              context: context || "Logger",
            },
          };
          
          // Add additional data as context if provided
          if (data && typeof data === "object") {
            errorContext.additionalData = data;
          } else if (data !== undefined) {
            errorContext.additionalData = { value: data };
          }
          
          captureException(error, errorContext);
        }
      } catch (sentryError) {
        // Silently fail if Sentry is not configured or fails
        // This prevents logger errors from breaking the app
        if (this.isDevelopment) {
          console.warn("[Logger] Failed to send error to Sentry:", sentryError);
        }
      }
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log("debug", message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log("info", message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log("warn", message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log("error", message, context, data);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
