import React from "react";
import { chartHtml } from "@/utils/chartHtml";
import { ChartProps as BaseChartProps } from "../../types/components";
import { ChartType } from "../../types/crypto";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ChartProps extends BaseChartProps {
  webViewRef: React.RefObject<WebView>;
  loading: boolean;
  error: string | null;
  onMessage: (event: any) => void;
  chartType: ChartType;
  title: string;
  seriesName: string;
}

const Chart = ({
  webViewRef,
  loading,
  error,
  onMessage,
  chartType,
  title,
  seriesName,
}: ChartProps) => {
  return (
    <View style={styles.chartContainer}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0078FF" />
          <Text style={styles.loaderText}>Loading chart...</Text>
        </View>
      )}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      <WebView
        ref={webViewRef}
        source={{ html: chartHtml }}
        style={styles.webView}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
        onLoadStart={() => console.log("WebView loading started")}
        onLoad={() => {
          console.log("WebView loaded");
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: "setChartParams",
                title: "",
                seriesName: seriesName,
              })
            );
            webViewRef.current.postMessage(
              JSON.stringify({
                type: "initialize",
                chartType: "candlestick",
              })
            );
          }
        }}
        onError={(syntheticEvent) => {
          const desc = syntheticEvent.nativeEvent.description;
          console.log("WebView error:", desc);
        }}
      />

      {/* Chart Controls Overlay */}
      <View style={styles.chartControls}>
        <TouchableOpacity
          style={styles.chartControlButton}
          onPress={() => {
            webViewRef.current?.postMessage(JSON.stringify({ type: "zoomIn" }));
          }}>
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chartControlButton}
          onPress={() => {
            webViewRef.current?.postMessage(
              JSON.stringify({ type: "zoomOut" })
            );
          }}>
          <Ionicons name="remove" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    height: 225,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    position: "relative",
  },
  webView: {
    backgroundColor: "#000",
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 1000,
  },
  loaderText: {
    color: "white",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 10,
  },
  chartControls: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 100,
  },
  chartControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
});

export default Chart;
