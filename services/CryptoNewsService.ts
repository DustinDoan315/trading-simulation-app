import { configService } from '@/utils/config';
import { ensureHttpsUrl } from '@/utils/helper';
import { logger } from '@/utils/logger';
import { waitForAppInitialization } from '@/utils/initializeApp';

export interface CryptoNewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  sentiment: "positive" | "negative" | "neutral";
  relevance: number;
}

class CryptoNewsService {
  private readonly BASE_URL = "https://newsapi.org/v2";

  async getTopCryptoNews(limit: number = 3): Promise<CryptoNewsArticle[]> {
    try {
      logger.info("Starting getTopCryptoNews", "CryptoNewsService");
      
      try {
        logger.info("Waiting for app initialization...", "CryptoNewsService");
        await waitForAppInitialization(5000);
        logger.info("App initialization completed", "CryptoNewsService");
      } catch (error) {
        logger.warn("App initialization timeout, proceeding without API key", "CryptoNewsService");
      }

      const apiKey = configService.get("NEWS_API_KEY");
      logger.info(`API key available: ${apiKey ? 'Yes' : 'No'}`, "CryptoNewsService");

      if (!apiKey) {
        logger.error(
          "No API key configured. Please check your .env file or app.json configuration.",
          "CryptoNewsService"
        );
        logger.error(
          "Expected: EXPO_PUBLIC_NEWS_API_KEY in .env or NEWS_API_KEY in app.json extra section",
          "CryptoNewsService"
        );
        return [];
      }

      logger.info("Fetching real crypto news from API", "CryptoNewsService");

      const query =
        "cryptocurrency OR bitcoin OR ethereum OR crypto OR blockchain OR defi OR nft";
      const url = `${this.BASE_URL}/everything?q=${encodeURIComponent(
        query
      )}&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`;

      logger.info(
        `API URL: ${url.replace(apiKey, "***")}`,
        "CryptoNewsService"
      );

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          `HTTP error! status: ${response.status}, response: ${errorText}`,
          "CryptoNewsService"
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      if (data.status === "error") {
        logger.error(`API Error: ${data.message}`, "CryptoNewsService");
        throw new Error(data.message || "API Error");
      }

      logger.info(
        `Successfully fetched ${data.articles?.length || 0} articles`,
        "CryptoNewsService"
      );

      const transformedArticles = (data.articles || []).map(
        (article: any, index: number) => ({
          id: article.url || `article_${index}`,
          title: article.title || "No Title",
          description: article.description || "No description available",
          content:
            article.content || article.description || "No content available",
          url: ensureHttpsUrl(article.url || ""),
          image: this.validateAndFixImageUrl(article.urlToImage),
          publishedAt: article.publishedAt || new Date().toISOString(),
          source: {
            name: article.source?.name || "Unknown Source",
            url: ensureHttpsUrl(article.source?.url || ""),
          },
          sentiment: this.analyzeSentiment(
            (article.title || "") + " " + (article.description || "")
          ),
          relevance: this.calculateRelevance(
            (article.title || "") + " " + (article.description || "")
          ),
        })
      );

            if (transformedArticles.length > 0) {
        logger.info(`Returning ${transformedArticles.length} articles`, "CryptoNewsService");
        return transformedArticles.slice(0, limit);
      } else {
        logger.warn(
          "No articles found from API, returning empty array",
          "CryptoNewsService"
        );
        return [];
      }
    } catch (error) {
      logger.error("Error fetching crypto news", "CryptoNewsService", error);
      return [];
    }
  }

  async getNewsDetail(articleId: string): Promise<CryptoNewsArticle> {
    try {
     
      throw new Error("News detail not implemented - use direct URL instead");
    } catch (error) {
      logger.error("Error fetching news detail", "CryptoNewsService", error);
      throw error;
    }
  }

  private validateAndFixImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return this.getDefaultImage();
    }

    
    let cleanUrl = imageUrl.trim();

   
    if (cleanUrl.includes('cointelegraph.com') && cleanUrl.includes('format=auto')) {
      const match = cleanUrl.match(/https:\/\/s3\.cointelegraph\.com\/uploads\/[^"]+/);
      if (match) {
        cleanUrl = match[0];
      }
    }

    if (cleanUrl.includes('biztoc.com/cdn/')) {
      
      cleanUrl = cleanUrl.replace('_s.webp', '_l.webp');
    }

    
    try {
      new URL(cleanUrl);
    } catch {
      logger.warn(`Invalid image URL: ${imageUrl}`, "CryptoNewsService");
      return this.getDefaultImage();
    }

    
    const problematicPatterns = [
      'data:image',
      'blob:',
      'javascript:',
      'about:',
      'chrome:',
      'moz-extension:'
    ];

    for (const pattern of problematicPatterns) {
      if (cleanUrl.toLowerCase().startsWith(pattern)) {
        logger.warn(`Blocked image URL with pattern ${pattern}: ${imageUrl}`, "CryptoNewsService");
        return this.getDefaultImage();
      }
    }

    
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }

    logger.info(`Validated image URL: ${cleanUrl}`, "CryptoNewsService");
    return cleanUrl;
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      "surge", "rise", "gain", "bullish", "rally", "breakthrough", "adoption",
      "growth", "increase", "positive", "success", "profit", "up", "higher",
      "strong", "boost", "recovery", "rebound", "soar", "jump", "climb"
    ];
    
    const negativeWords = [
      "crash", "fall", "drop", "bearish", "decline", "loss", "sell-off",
      "dump", "plunge", "negative", "failure", "risk", "down", "lower",
      "weak", "concern", "fear", "panic", "sell", "bear", "correction"
    ];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private calculateRelevance(text: string): number {
    const cryptoKeywords = [
      "bitcoin", "ethereum", "crypto", "cryptocurrency", "blockchain",
      "defi", "nft", "token", "coin", "wallet", "exchange", "trading",
      "mining", "staking", "smart contract", "dapp", "dao", "yield",
      "liquidity", "amm", "dex", "cex", "metaverse", "web3"
    ];

    const lowerText = text.toLowerCase();
    const keywordMatches = cryptoKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;

    // Calculate relevance as a percentage (0-100)
    const relevance = Math.min(100, (keywordMatches / cryptoKeywords.length) * 100);
    return Math.round(relevance);
  }

  private getDefaultImage(): string {
    const images = [
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    ];
    return images[Math.floor(Math.random() * images.length)];
  }

  async refreshNews(limit: number = 3): Promise<CryptoNewsArticle[]> {
    logger.info("Refreshing crypto news", "CryptoNewsService");
    return this.getTopCryptoNews(limit);
  }

  async getMoreNews(
    page: number = 1,
    limit: number = 5
  ): Promise<CryptoNewsArticle[]> {
    try {
      logger.info(
        `Fetching more crypto news - page ${page}`,
        "CryptoNewsService"
      );

     
      try {
        await waitForAppInitialization(5000); 
      } catch (error) {
        logger.warn("App initialization timeout, proceeding without API key", "CryptoNewsService");
      }

      
      const apiKey = configService.get("NEWS_API_KEY");

      if (!apiKey) {
        logger.warn(
          "No API key configured, returning empty array",
          "CryptoNewsService"
        );
        return [];
      }

      const response = await fetch(
        `${this.BASE_URL}/everything?q=cryptocurrency+OR+bitcoin+OR+ethereum+OR+crypto+OR+blockchain&language=en&sortBy=publishedAt&page=${page}&pageSize=${limit}&apiKey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      if (data.status === "error") {
        throw new Error(data.message || "API Error");
      }

      const transformedArticles = (data.articles || []).map(
        (article: any, index: number) => ({
          id: article.url || `article_${page}_${index}`,
          title: article.title || "No Title",
          description: article.description || "No description available",
          content:
            article.content || article.description || "No content available",
          url: article.url || "",
          image: this.validateAndFixImageUrl(article.urlToImage),
          publishedAt: article.publishedAt || new Date().toISOString(),
          source: {
            name: article.source?.name || "Unknown Source",
            url: article.source?.url || "",
          },
          sentiment: this.analyzeSentiment(
            (article.title || "") + " " + (article.description || "")
          ),
          relevance: this.calculateRelevance(
            (article.title || "") + " " + (article.description || "")
          ),
        })
      );

      return transformedArticles;
    } catch (error) {
      logger.error("Error fetching more news", "CryptoNewsService", error);
      return [];
    }
  }
}

export const cryptoNewsService = new CryptoNewsService();
