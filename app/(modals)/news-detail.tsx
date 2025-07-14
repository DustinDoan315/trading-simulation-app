import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { logger } from "@/utils/logger";
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CryptoNewsArticle,
  cryptoNewsService,
} from "@/services/CryptoNewsService";

const { width, height } = Dimensions.get("window");

const NewsDetailScreen = () => {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const [article, setArticle] = useState<CryptoNewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    if (!articleId) {
      logger.error("No article ID provided", "NewsDetailScreen");
      return;
    }

    try {
      setLoading(true);
      const articleData = await cryptoNewsService.getNewsDetail(articleId);
      setArticle(articleData);
    } catch (error) {
      logger.error("Error loading article", "NewsDetailScreen", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "#4BB543";
      case "negative":
        return "#FF6B6B";
      case "neutral":
        return "#6262D9";
      default:
        return "#9DA3B4";
    }
  };

  const handleOpenWebView = () => {
    setShowWebView(true);
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6262D9" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseWebView}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Reading Article</Text>
        </View>
        <WebView
          source={{ uri: article.url }}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#6262D9" />
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#131523", "#1A1D2F"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.sourceName}>{article.source.name}</Text>
            <Text style={styles.publishDate}>
              {formatDate(article.publishedAt)}
            </Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {/* Article Image */}
          {article.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: article.image }}
                style={styles.articleImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.imageOverlay}
              />
            </View>
          )}

          {/* Article Content */}
          <View style={styles.content}>
            {/* Sentiment Badge */}
            <View style={styles.sentimentContainer}>
              <View
                style={[
                  styles.sentimentBadge,
                  { backgroundColor: getSentimentColor(article.sentiment) },
                ]}>
                <Ionicons
                  name={
                    article.sentiment === "positive"
                      ? "trending-up"
                      : article.sentiment === "negative"
                      ? "trending-down"
                      : "remove"
                  }
                  size={16}
                  color="white"
                />
                <Text style={styles.sentimentText}>
                  {article.sentiment.charAt(0).toUpperCase() +
                    article.sentiment.slice(1)}{" "}
                  Sentiment
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

            {/* Article Title */}
            <Text style={styles.articleTitle}>{article.title}</Text>

            {/* Article Description */}
            <Text style={styles.articleDescription}>{article.description}</Text>

            {/* Article Content */}
            <Text style={styles.articleContent}>{article.content}</Text>

            {/* Read Full Article Button */}
            <TouchableOpacity
              style={styles.readFullButton}
              onPress={handleOpenWebView}>
              <LinearGradient
                colors={["#6262D9", "#9D62D9"]}
                style={styles.readFullGradient}>
                <Ionicons name="open-outline" size={20} color="white" />
                <Text style={styles.readFullText}>Read Full Article</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Source Information */}
            <View style={styles.sourceContainer}>
              <Text style={styles.sourceLabel}>Source:</Text>
              <Text style={styles.sourceUrl}>{article.source.url}</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#9DA3B4",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#6262D9",
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  publishDate: {
    fontSize: 12,
    color: "#9DA3B4",
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: 200,
    position: "relative",
  },
  articleImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  content: {
    padding: 20,
  },
  sentimentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sentimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  relevanceContainer: {
    alignItems: "flex-end",
  },
  relevanceLabel: {
    fontSize: 10,
    color: "#9DA3B4",
    marginBottom: 2,
  },
  relevanceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  relevanceBar: {
    width: 60,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  relevanceFill: {
    height: "100%",
    backgroundColor: "#6262D9",
    borderRadius: 2,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    lineHeight: 32,
    marginBottom: 16,
  },
  articleDescription: {
    fontSize: 16,
    color: "#9DA3B4",
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: "italic",
  },
  articleContent: {
    fontSize: 15,
    color: "white",
    lineHeight: 24,
    marginBottom: 30,
  },
  readFullButton: {
    marginBottom: 20,
  },
  readFullGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  readFullText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  sourceContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  sourceLabel: {
    fontSize: 12,
    color: "#9DA3B4",
    marginBottom: 4,
  },
  sourceUrl: {
    fontSize: 14,
    color: "#6262D9",
    textDecorationLine: "underline",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#131523",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    padding: 8,
  },
  webViewTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 16,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131523",
  },
});

export default NewsDetailScreen;
