import React from "react";
import { CryptoNewsArticle } from "@/services/CryptoNewsService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface CryptoNewsCardProps {
  article: CryptoNewsArticle;
  onPress: (article: CryptoNewsArticle) => void;
}

export const CryptoNewsCard: React.FC<CryptoNewsCardProps> = ({
  article,
  onPress,
}) => {
  const getSentimentColors = (sentiment: string): [string, string] => {
    switch (sentiment) {
      case "positive":
        return ["#4BB543", "#45A03D"];
      case "negative":
        return ["#FF6B6B", "#FF5252"];
      case "neutral":
        return ["#6262D9", "#9D62D9"];
      default:
        return ["#9DA3B4", "#7A7F8C"];
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "trending-up";
      case "negative":
        return "trending-down";
      case "neutral":
        return "remove";
      default:
        return "remove";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(article)}
      activeOpacity={0.8}>
      <LinearGradient
        colors={getSentimentColors(article.sentiment)}
        style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceName}>{article.source.name}</Text>
            <Text style={styles.publishTime}>
              {formatDate(article.publishedAt)}
            </Text>
          </View>
          <View style={styles.sentimentContainer}>
            <View style={styles.sentimentBadge}>
              <Ionicons
                name={getSentimentIcon(article.sentiment) as any}
                size={12}
                color="white"
              />
              <Text style={styles.sentimentText}>
                {article.sentiment.charAt(0).toUpperCase() +
                  article.sentiment.slice(1)}
              </Text>
            </View>
            <View style={styles.relevanceContainer}>
              <Text style={styles.relevanceLabel}>Relevance</Text>
              <Text style={styles.relevanceValue}>{article.relevance}%</Text>
              <View style={styles.relevanceBar}>
                <View
                  style={[
                    styles.relevanceFill,
                    { width: `${article.relevance}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {article.description}
          </Text>
        </View>

        {article.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: article.image }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageOverlay}
            />
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Read Full Article</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.statText}>5 min read</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sourceContainer: {
    flex: 1,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  publishTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
  },
  sentimentContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  sentimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  relevanceContainer: {
    alignItems: "flex-end",
  },
  relevanceLabel: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  relevanceValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
  },
  relevanceBar: {
    width: 40,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  relevanceFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
