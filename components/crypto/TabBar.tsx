import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  selectedTab: string;
  onTabPress: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, selectedTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}>
              <Text
                style={[styles.tabText, isSelected && styles.selectedTabText]}>
                {tab.label}
              </Text>
              {isSelected && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.refreshButton}>
        <Ionicons name="repeat" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  tabText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  selectedTabText: {
    color: "#FFFFFF",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 5,
    height: 2,
    borderRadius: 2,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  refreshButton: {
    width: 50,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabBar;
