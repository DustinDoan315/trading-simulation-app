import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } from 'react-native';
import { TradingContext } from '@/types/database';
import { useDualBalance } from '@/hooks/useDualBalance';


interface TradingContextIndicatorProps {
  onContextChange?: (context: TradingContext) => void;
  showSwitchButton?: boolean;
  collectionName?: string;
}

export const TradingContextIndicator: React.FC<
  TradingContextIndicatorProps
> = ({ onContextChange, showSwitchButton = true, collectionName }) => {
  const { activeContext, switchContext, currentBalance } = useDualBalance();

  const handleContextSwitch = () => {
    const newContext: TradingContext =
      activeContext.type === "individual"
        ? { type: "collection", collectionId: "default" } // You might want to show a collection picker
        : { type: "individual" };

    switchContext(newContext);
    onContextChange?.(newContext);
  };

  const getContextIcon = () => {
    return activeContext.type === "individual" ? "person" : "people";
  };

  const getContextColor = () => {
    return activeContext.type === "individual" ? "#6674CC" : "#10B981";
  };

  const getContextText = () => {
    if (activeContext.type === "individual") {
      return "Individual Trading";
    } else {
      return collectionName || "Collection Trading";
    }
  };

  const getBalanceText = () => {
    const balance = currentBalance.usdtBalance.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

    return `${balance} USDT`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(102, 116, 204, 0.1)", "rgba(102, 116, 204, 0.05)"]}
        style={styles.indicatorContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getContextColor()}20` },
            ]}>
            <Ionicons
              name={getContextIcon()}
              size={20}
              color={getContextColor()}
            />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.contextText}>{getContextText()}</Text>
            <Text style={styles.balanceText}>{getBalanceText()}</Text>
          </View>
        </View>

        {showSwitchButton && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleContextSwitch}>
            <LinearGradient
              colors={[getContextColor(), `${getContextColor()}CC`]}
              style={styles.switchButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
              <Text style={styles.switchButtonText}>Switch</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(102, 116, 204, 0.2)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  contextText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 14,
    color: "#9DA3B4",
  },
  switchButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  switchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default TradingContextIndicator;
