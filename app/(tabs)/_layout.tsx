import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RouteName = "index" | "exchange" | "wallet";

type IconMapping = {
  [key in RouteName]: {
    inactive: keyof typeof Ionicons.glyphMap;
    active: keyof typeof Ionicons.glyphMap;
  };
};

const ICON_MAP: IconMapping = {
  index: {
    inactive: "home-outline",
    active: "home",
  },
  wallet: {
    inactive: "wallet-outline",
    active: "wallet",
  },
  exchange: {
    inactive: "repeat",
    active: "repeat",
  },
};

function CustomTabBar({ state, navigation, descriptors }: any) {
  const insets = useSafeAreaInsets();

  const orderedRoutes: Array<{ name: RouteName; key: string }> = [];

  state.routes.forEach((route: any) => {
    if (
      route.name === "index" ||
      route.name === "exchange" ||
      route.name === "wallet"
    ) {
      orderedRoutes.push(route);
    }
  });

  orderedRoutes.sort((a, b) => {
    const order: RouteName[] = ["index", "exchange", "wallet"];
    return (
      order.indexOf(a.name as RouteName) - order.indexOf(b.name as RouteName)
    );
  });

  const exchangeToken = () => {
    router.navigate("/(subs)/enhanced-crypto-chart");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
      {orderedRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isActive =
          state.index ===
          state.routes.findIndex((r: any) => r.name === route.name);

        const label = options.title || route.name;

        const icons = ICON_MAP[route.name as RouteName];
        const iconName = isActive ? icons.active : icons.inactive;

        const isCenter = index === 1;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <View key={route.key} style={styles.centerButtonContainer}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isActive ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={exchangeToken}
                style={styles.centerButton}>
                <Ionicons name={iconName} size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.tabText}>{label}</Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.tabButton}>
            <Ionicons name={iconName} size={24} color={"#FFFFFF"} />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: "DWallet",
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: "Giao dịch",
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Tài sản",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: "center",
  },
  centerButton: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "#FFFFFF",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
});
