import colors from '@/styles/colors';
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
  } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type RouteName =
  | "index"
  | "portfolio"
  | "collections"
  | "leaderboard"
  | "watchlist"
  | "profile";

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
  portfolio: {
    inactive: "pie-chart-outline",
    active: "pie-chart",
  },
  collections: {
    inactive: "people-outline",
    active: "people",
  },
  leaderboard: {
    inactive: "trophy-outline",
    active: "trophy",
  },
  watchlist: {
    inactive: "star-outline",
    active: "star",
  },
  profile: {
    inactive: "person-outline",
    active: "person",
  },
};

function CustomTabBar({ state, navigation, descriptors }: any) {
  const insets = useSafeAreaInsets();

  const orderedRoutes: Array<{ name: RouteName; key: string }> = [];

  state.routes.forEach((route: any) => {
    if (
      route.name === "index" ||
      route.name === "portfolio" ||
      route.name === "leaderboard" ||
      route.name === "watchlist" ||
      route.name === "profile"
    ) {
      orderedRoutes.push(route);
    }
  });

  orderedRoutes.sort((a, b) => {
    const order: RouteName[] = [
      "index",
      "portfolio",
      "leaderboard",
      "watchlist",
      "profile",
    ];
    return (
      order.indexOf(a.name as RouteName) - order.indexOf(b.name as RouteName)
    );
  });

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
        name="portfolio"
        options={{
          title: "Portfolio",
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
        }}
      />

      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
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
