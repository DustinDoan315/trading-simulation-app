import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } from 'react-native';


interface SectionHeaderProps {
  title: string;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showSeeAll = true,
  onSeeAllPress,
}) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showSeeAll && (
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  seeAllText: {
    color: "#3498db",
    fontSize: 14,
  },
});
