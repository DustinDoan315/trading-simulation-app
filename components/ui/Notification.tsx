import React, { createContext, useContext, useState, ReactNode } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type NotificationType = {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
};

type NotificationContextType = {
  showNotification: (notification: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [opacity] = useState(new Animated.Value(0));

  const showNotification = (notification: NotificationType) => {
    setNotification(notification);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideNotification();
    }, notification.duration || 3000);
  };

  const hideNotification = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  const colorScheme = useColorScheme();
  const getBackgroundColor = () => {
    const themeColors = Colors[colorScheme ?? "light"];
    switch (notification?.type) {
      case "success":
        return themeColors.success;
      case "error":
        return themeColors.error;
      default:
        return themeColors.primary;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity,
              backgroundColor: getBackgroundColor(),
            },
          ]}>
          <Text style={styles.message}>{notification.message}</Text>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 1000,
  },
  message: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
