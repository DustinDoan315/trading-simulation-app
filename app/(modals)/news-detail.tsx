import { CryptoNewsArticle } from '@/services/CryptoNewsService';
import { ensureHttpsUrl } from '@/utils/helper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


const { width, height } = Dimensions.get("window");

const NewsDetailScreen = () => {
  const { articleId, articleData } = useLocalSearchParams<{
    articleId: string;
    articleData: string;
  }>();
  const [article, setArticle] = useState<CryptoNewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);

  useEffect(() => {
    loadArticle();
  }, [articleId, articleData]);

  const loadArticle = async () => {
    if (!articleId || !articleData) {
      logger.error("No article ID or data provided", "NewsDetailScreen");
      return;
    }

    try {
      setLoading(true);
      const parsedArticle = JSON.parse(articleData) as CryptoNewsArticle;
      setArticle(parsedArticle);
    } catch (error) {
      logger.error("Error parsing article data", "NewsDetailScreen", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewLoadStart = () => {
    setWebViewLoading(true);
    setWebViewError(null); // Clear any previous errors
  };

  const handleWebViewLoadEnd = () => {
    setWebViewLoading(false);
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMessage = nativeEvent.description || "Failed to load article";
    
    logger.error("WebView error loading news article", "NewsDetailScreen", {
      url: article?.url,
      httpsUrl: article ? ensureHttpsUrl(article.url) : undefined,
      error: errorMessage,
    });
    
    setWebViewLoading(false);
    setWebViewError(errorMessage);
  };

  const handleRetryLoad = () => {
    setWebViewError(null);
    setWebViewLoading(true);
    // The WebView will automatically reload when the error state is cleared
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
        <LinearGradient colors={["#0F0F23", "#1A1D2F"]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading article...</Text>
              <Text style={styles.loadingSubtext}>
                Please wait while we fetch the latest news
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
        <LinearGradient colors={["#0F0F23", "#1A1D2F"]} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
              </View>
              <Text style={styles.errorTitle}>Article Not Found</Text>
              <Text style={styles.errorText}>
                The article you're looking for doesn't exist or has been
                removed.
              </Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}>
                <LinearGradient
                  colors={["#6366F1", "#4F46E5"]}
                  style={styles.backButtonGradient}>
                  <Ionicons name="arrow-back" size={20} color="white" />
                  <Text style={styles.backButtonText}>Go Back</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      <View style={styles.webViewHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.sourceName}>{article.source.name}</Text>
          <Text style={styles.articleTitle} numberOfLines={1}>
            {article.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <View style={styles.shareButtonInner}>
            <Ionicons name="share-outline" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      <WebView
        source={{ uri: ensureHttpsUrl(article.url) }}
        style={styles.webView}
        startInLoadingState={true}
        onLoadStart={handleWebViewLoadStart}
        onLoadEnd={handleWebViewLoadEnd}
        onError={handleWebViewError}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.webViewLoadingText}>Loading article...</Text>
          </View>
        )}
      />

      {webViewLoading && !webViewError && (
        <View style={styles.webViewLoadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.webViewLoadingText}>Loading article...</Text>
        </View>
      )}

      {webViewError && (
        <View style={styles.webViewErrorOverlay}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Failed to Load Article</Text>
            <Text style={styles.errorText}>
              {webViewError.includes("App Transport Security") 
                ? "This article uses an insecure connection that couldn't be automatically fixed."
                : "Unable to load the article. This might be due to network issues or the website being unavailable."
              }
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetryLoad}>
                <LinearGradient
                  colors={["#6366F1", "#4F46E5"]}
                  style={styles.retryButtonGradient}>
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonInner: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  backButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#0F0F23",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    lineHeight: 20,
  },
  shareButton: {
    marginLeft: 16,
  },
  shareButtonInner: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 8,
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
    backgroundColor: "#0F0F23",
  },
  webViewLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 15, 35, 0.9)",
  },
  webViewLoadingText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
    fontWeight: "500",
  },
  webViewErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 15, 35, 0.95)",
    paddingHorizontal: 40,
  },
  errorActions: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  retryButton: {
    width: "100%",
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default NewsDetailScreen;
