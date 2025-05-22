import colors from "@/styles/colors";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type RouteName = "index" | "portfolio" | "wallet" | "chart";

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
  portfolio: {
    inactive: "pie-chart-outline",
    active: "pie-chart",
  },
  chart: {
    inactive: "repeat-outline",
    active: "repeat",
  },
};

function CustomTabBar({ state, navigation, descriptors }: any) {
  const insets = useSafeAreaInsets();

  const orderedRoutes: Array<{ name: RouteName; key: string }> = [];

  state.routes.forEach((route: any) => {
    if (
      route.name === "index" ||
      route.name === "chart" ||
      route.name === "portfolio" ||
      route.name === "wallet"
      // ||
      // route.name === "products"
    ) {
      orderedRoutes.push(route);
    }
  });

  orderedRoutes.sort((a, b) => {
    const order: RouteName[] = ["index", "chart", "portfolio", "wallet"];
    return (
      order.indexOf(a.name as RouteName) - order.indexOf(b.name as RouteName)
    );
  });

  const navigateToChart = () => {
    router.push({
      pathname: "/(subs)/crypto-chart",
      params: {
        id: "bitcoin",
        symbol: "BTC/USDT",
        name: "Bitcoin",
        image_url: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=022",
      },
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: 10 }]}>
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
                onPress={navigateToChart}
                // onPress={onPress}
                style={[
                  styles.centerButton,
                  isActive && styles.activeCenterButton,
                ]}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isActive ? "#FFFFFF" : "#000"}
                />
              </TouchableOpacity>
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
            <Ionicons
              name={iconName}
              size={24}
              color={isActive ? "#7878FA" : "#FFFFFF"}
            />
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
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="chart"
        options={{
          title: "Trading",
        }}
      />

      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#131523",
    borderTopWidth: 1,
    borderTopColor: colors.border.dark,
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
  },
  activeCenterButton: {
    backgroundColor: "#7878FA",
    width: 40,
    height: 40,
    borderRadius: 28,
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
