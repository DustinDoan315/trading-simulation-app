import React, { useState } from 'react';
import { CryptoNewsArticle } from '@/services/CryptoNewsService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';
import {
  ActivityIndicator,
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
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getSentimentColors = (
    sentiment: string
  ): readonly [string, string, string, string] => {
    switch (sentiment) {
      case "positive":
        return ["#00FF88", "#00CC6A", "#00994C", "#00662E"] as const;
      case "negative":
        return ["#FF4757", "#FF3742", "#FF2E3A", "#FF1F2A"] as const;
      case "neutral":
        return ["#A4B0BE", "#747D8C", "#57606F", "#2F3542"] as const;
      default:
        return ["#A4B0BE", "#747D8C", "#57606F", "#2F3542"] as const;
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

    if (diffInHours < 1) return t("news.justNow");
    if (diffInHours < 24) return t("news.hoursAgo", { hours: diffInHours });
    if (diffInHours < 48) return t("news.yesterday");
    return date.toLocaleDateString();
  };

  const hasValidImage =
    article.image &&
    article.image.trim() !== "" &&
    !imageError &&
    article.image !==
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800" &&
    article.image !==
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800" &&
    article.image !==
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800";

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getDefaultImage = () => {
    const images = [
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(article)}
      activeOpacity={0.9}>
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={getSentimentColors(article.sentiment)}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <View style={styles.mainContent}>
            <View
              style={[
                styles.textContent,
                hasValidImage
                  ? styles.textContentWithImage
                  : styles.textContentFull,
              ]}>
              <View style={styles.header}>
                <View style={styles.sourceContainer}>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceName}>{article.source.name}</Text>
                  </View>
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
                </View>
              </View>

              <View style={styles.articleContent}>
                <Text style={styles.title} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text
                  style={styles.description}
                  numberOfLines={hasValidImage ? 3 : 4}>
                  {article.description}
                </Text>
              </View>

              <View style={styles.footer}>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>
                    {t("news.readFullArticle")}
                  </Text>
                  <View style={styles.arrowContainer}>
                    <Ionicons name="arrow-forward" size={14} color="white" />
                  </View>
                </View>
              </View>
            </View>

            {hasValidImage && (
              <View style={styles.imageContainer}>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                  </View>
                )}
                <Image
                  source={{
                    uri: article.image,
                    headers: {
                      "User-Agent": "Mozilla/5.0 (compatible; NewsApp/1.0)",
                    },
                    cache: "force-cache",
                  }}
                  style={[styles.image, imageLoading && styles.imageLoading]}
                  resizeMode="cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  style={styles.imageOverlay}
                />
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    marginBottom: 20,
  },
  cardWrapper: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    borderRadius: 20,
    padding: 16,
    minHeight: 180,
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
    gap: 16,
  },
  textContent: {
    justifyContent: "space-between",
  },
  textContentWithImage: {
    flex: 0.65,
  },
  textContentFull: {
    flex: 1,
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
  sourceBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  sourceName: {
    fontSize: 10,
    fontWeight: "500",
    color: "white",
    letterSpacing: 0.3,
  },
  publishTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  sentimentContainer: {},
  sentimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.2,
  },
  articleContent: {
    flex: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
    fontWeight: "400",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.2,
  },
  arrowContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: 3,
  },
  imageContainer: {
    flex: 0.35,
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoading: {
    opacity: 0.3,
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
});
