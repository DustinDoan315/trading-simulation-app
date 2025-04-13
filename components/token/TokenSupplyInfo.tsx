import * as Progress from 'react-native-progress';
import Colors from '@/styles/colors';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View
    } from 'react-native';
import { ProgressView } from '@react-native-community/progress-view';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';



interface TokenSupplyInfoProps {
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  dilutionRisk?: "None" | "Low" | "Medium" | "High";
}

export const TokenSupplyInfo: React.FC<TokenSupplyInfoProps> = ({
  circulatingSupply,
  totalSupply,
  maxSupply,
  dilutionRisk = "None",
}) => {
  const circulatingPercentage =
    totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;
  const maxPercentage =
    maxSupply && totalSupply > 0 ? (totalSupply / maxSupply) * 100 : 100;

  const formatNumber = (num: number) => {
    return num >= 1_000_000_000
      ? `${(num / 1_000_000_000).toFixed(2)}B`
      : num >= 1_000_000
      ? `${(num / 1_000_000).toFixed(2)}M`
      : num.toLocaleString();
  };

  const getDilutionColor = () => {
    switch (dilutionRisk) {
      case "High":
        return "#FF4444";
      case "Medium":
        return "#FFBB33";
      case "Low":
        return "#00C851";
      default:
        return Colors.text.secondary;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Supply Information
      </ThemedText>

      <View style={styles.supplyItem}>
        <ThemedText>Circulating Supply</ThemedText>
        <ThemedText style={styles.value}>
          {formatNumber(circulatingSupply)}
        </ThemedText>
      </View>

      <View style={styles.progressContainer}>
        {Platform.OS === "ios" ? (
          <ProgressView
            progressTintColor="#007bff"
            trackTintColor={Colors.border.light}
            progress={circulatingPercentage / 100}
          />
        ) : (
          <Progress.Bar
            progress={circulatingPercentage / 100}
            width={null}
            height={8}
            color="#007bff"
            unfilledColor={Colors.border.light}
            borderWidth={0}
          />
        )}
        <Text style={styles.percentText}>
          {circulatingPercentage.toFixed(2)}%
        </Text>
      </View>

      <View style={styles.supplyItem}>
        <ThemedText>Total Supply</ThemedText>
        <ThemedText style={styles.value}>
          {formatNumber(totalSupply)}
        </ThemedText>
      </View>

      {maxSupply !== null && (
        <>
          <View style={styles.progressContainer}>
            {Platform.OS === "ios" ? (
              <ProgressView
                progressTintColor="#6610f2"
                trackTintColor={Colors.border.light}
                progress={maxPercentage / 100}
              />
            ) : (
              <Progress.Bar
                progress={maxPercentage / 100}
                width={null}
                height={8}
                color="#6610f2"
                unfilledColor={Colors.border.light}
                borderWidth={0}
              />
            )}
            <Text style={styles.percentText}>{maxPercentage.toFixed(2)}%</Text>
          </View>

          <View style={styles.supplyItem}>
            <ThemedText>Max Supply</ThemedText>
            <ThemedText style={styles.value}>
              {formatNumber(maxSupply)}
            </ThemedText>
          </View>
        </>
      )}

      {dilutionRisk && (
        <View style={styles.dilutionRiskContainer}>
          <ThemedText>Supply Dilution Risk</ThemedText>
          <View
            style={[
              styles.dilutionBadge,
              { backgroundColor: getDilutionColor() },
            ]}>
            <Text style={styles.dilutionText}>{dilutionRisk}</Text>
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  supplyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  value: {
    fontWeight: "600",
  },
  progressContainer: {
    marginVertical: 8,
  },
  percentText: {
    alignSelf: "flex-end",
    fontSize: 12,
    marginTop: 4,
    color: Colors.text.secondary,
  },
  dilutionRiskContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  dilutionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dilutionText: {
    color: "white",
    fontWeight: "600",
  },
});
