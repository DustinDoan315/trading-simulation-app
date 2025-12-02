// utils/sentry.ts
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Get Sentry DSN from configuration
 * Priority: EXPO_PUBLIC_SENTRY_DSN > SENTRY_DSN > process.env
 */
function getSentryDSN(): string | undefined {
  const extra = Constants.expoConfig?.extra || {};
  
  return (
    extra.EXPO_PUBLIC_SENTRY_DSN ||
    extra.SENTRY_DSN ||
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    process.env.SENTRY_DSN
  );
}

/**
 * Get environment name from configuration
 */
function getEnvironment(): string {
  const extra = Constants.expoConfig?.extra || {};
  return extra.ENVIRONMENT || process.env.ENVIRONMENT || __DEV__ ? "development" : "production";
}

/**
 * Get release version for Sentry
 */
function getRelease(): string {
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber = Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber || "1",
    android: Constants.expoConfig?.android?.versionCode?.toString() || "1",
  });
  return `${Constants.expoConfig?.slug || "trading-simulation-app"}@${appVersion}+${buildNumber}`;
}

/**
 * Initialize Sentry with configuration
 */
export function initSentry(): void {
  const dsn = getSentryDSN();
  const environment = getEnvironment();
  const release = getRelease();

  // Only initialize if DSN is provided
  if (!dsn) {
    if (__DEV__) {
      console.warn("[Sentry] DSN not configured. Sentry error tracking is disabled.");
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds
      
      // Only capture errors in production/staging, not in development
      enabled: environment !== "development",
      
      // Configure what to capture
      attachStacktrace: true,
      enableNativeCrashHandling: true,
      enableAutoPerformanceInstrumentation: false, // Disable performance monitoring for now
      
      // Filter out common non-critical errors
      ignoreErrors: [
        // Network errors that are handled gracefully
        "Network request failed",
        "NetworkError",
        // User cancellation errors
        "User cancelled",
        // Common React Native errors that are handled
        "Unable to resolve module",
      ],
      
      // Configure beforeSend to filter or modify events
      beforeSend(event, hint) {
        // Don't send events in development mode
        if (__DEV__) {
          return null;
        }
        
        // Filter out errors that are too noisy
        if (event.exception) {
          const errorMessage = event.exception.values?.[0]?.value || "";
          if (errorMessage.includes("Non-Error promise rejection")) {
            return null;
          }
        }
        
        return event;
      },
      
      // Configure integrations (minimal for error tracking only)
      integrations: [],
      
      // Set sample rate for error events (1.0 = 100%)
      tracesSampleRate: 0, // Disable performance monitoring
      
      // Configure native options
      ...(Platform.OS === "ios" && {
        enableNative: true,
        enableNativeNagger: false,
      }),
      ...(Platform.OS === "android" && {
        enableNative: true,
        enableNativeNagger: false,
      }),
    });

    if (__DEV__) {
      console.log("[Sentry] Initialized successfully", {
        environment,
        release,
        dsnConfigured: !!dsn,
      });
    }
  } catch (error) {
    console.error("[Sentry] Failed to initialize:", error);
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, username?: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    username: username || userId,
    email,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    message,
    category: category || "user",
    level: "info",
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info"): void {
  Sentry.captureMessage(message, level);
}

// Export Sentry instance for advanced usage
export { Sentry };

