import { configService } from "@/utils/config";
import { logger } from "@/utils/logger";

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

export interface CryptoNewsResponse {
  articles: CryptoNewsArticle[];
  totalResults: number;
}

class CryptoNewsService {
  private readonly BASE_URL = "https://newsapi.org/v2";

  // Fallback data in case API is not available
  private readonly FALLBACK_NEWS: CryptoNewsArticle[] = [
    {
      id: "1",
      title: "Bitcoin Surges Past $45,000 as Institutional Adoption Grows",
      description:
        "Bitcoin has reached new heights as major financial institutions continue to show interest in cryptocurrency investments.",
      content:
        "Bitcoin has demonstrated remarkable resilience and growth, reaching the $45,000 milestone. This surge comes amid increasing institutional adoption, with major financial players recognizing the potential of digital assets. Analysts suggest this could be the beginning of a broader crypto bull run.",
      url: "https://example.com/bitcoin-surge",
      image:
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
      publishedAt: new Date().toISOString(),
      source: {
        name: "CryptoNews",
        url: "https://cryptonews.com",
      },
      sentiment: "positive" as const,
      relevance: 95,
    },
    {
      id: "2",
      title: "Ethereum 2.0 Staking Reaches New Milestone",
      description:
        "The Ethereum network continues to see increased staking participation, signaling strong community confidence.",
      content:
        "Ethereum 2.0 staking has reached a significant milestone with over 20 million ETH now staked. This represents a major step forward in the network's transition to proof-of-stake consensus mechanism.",
      url: "https://example.com/ethereum-staking",
      image:
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      source: {
        name: "EthereumWorld",
        url: "https://ethereumworld.com",
      },
      sentiment: "positive" as const,
      relevance: 88,
    },
    {
      id: "3",
      title: "Regulatory Clarity Boosts Crypto Market Confidence",
      description:
        "Recent regulatory developments have provided much-needed clarity for the cryptocurrency industry.",
      content:
        "New regulatory frameworks are providing clearer guidelines for cryptocurrency operations, which is boosting market confidence and encouraging institutional investment.",
      url: "https://example.com/regulatory-clarity",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
      publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      source: {
        name: "CryptoRegulation",
        url: "https://cryptoregulation.com",
      },
      sentiment: "neutral" as const,
      relevance: 82,
    },
  ];

  async getTopCryptoNews(limit: number = 3): Promise<CryptoNewsArticle[]> {
    try {
      // Get API key from secure configuration
      const apiKey = configService.get("NEWS_API_KEY");

      if (!apiKey) {
        logger.warn(
          "No API key configured, using fallback data",
          "CryptoNewsService"
        );
        return this.FALLBACK_NEWS.slice(0, limit);
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

      // Transform the API response to our format
      const transformedArticles = (data.articles || []).map(
        (article: any, index: number) => ({
          id: article.url || `article_${index}`,
          title: article.title || "No Title",
          description: article.description || "No description available",
          content:
            article.content || article.description || "No content available",
          url: article.url || "",
          image: article.urlToImage || this.getDefaultImage(),
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

      // Return transformed articles or fallback if no articles found
      if (transformedArticles.length > 0) {
        return transformedArticles.slice(0, limit);
      } else {
        logger.warn(
          "No articles found from API, using fallback data",
          "CryptoNewsService"
        );
        return this.FALLBACK_NEWS.slice(0, limit);
      }
    } catch (error) {
      logger.error("Error fetching crypto news", "CryptoNewsService", error);
      // Return fallback data on error
      return this.FALLBACK_NEWS.slice(0, limit);
    }
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positiveWords = [
      "surge",
      "bullish",
      "gain",
      "rise",
      "positive",
      "growth",
      "adoption",
      "milestone",
      "success",
    ];
    const negativeWords = [
      "crash",
      "bearish",
      "drop",
      "fall",
      "negative",
      "decline",
      "loss",
      "concern",
      "risk",
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter((word) =>
      lowerText.includes(word)
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private calculateRelevance(text: string): number {
    const cryptoKeywords = [
      "bitcoin",
      "ethereum",
      "crypto",
      "blockchain",
      "defi",
      "nft",
      "altcoin",
    ];
    const lowerText = text.toLowerCase();
    const keywordCount = cryptoKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Calculate relevance score (0-100)
    return Math.min(100, (keywordCount / cryptoKeywords.length) * 100 + 50);
  }

  private getDefaultImage(): string {
    const images = [
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    ];
    return images[Math.floor(Math.random() * images.length)];
  }

  async getNewsDetail(articleId: string): Promise<CryptoNewsArticle | null> {
    try {
      const allNews = await this.getTopCryptoNews(10);
      return allNews.find((article) => article.id === articleId) || null;
    } catch (error) {
      logger.error("Error fetching news detail", "CryptoNewsService", error);
      return null;
    }
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

      // Get API key from secure configuration
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
          image: article.urlToImage || this.getDefaultImage(),
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
