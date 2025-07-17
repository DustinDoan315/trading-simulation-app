import { enhancedCryptoService } from './EnhancedCryptoService';
import { logger } from '@/utils/logger';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradientColors: [string, string];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  progress: number;
  isCompleted: boolean;
  category: "basics" | "technical" | "advanced";
  content?: string;
  videoUrl?: string;
  quizQuestions?: QuizQuestion[];
  prerequisites?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LearningProgress {
  moduleId: string;
  userId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
  quizScore?: number;
  timeSpent: number; // in minutes
  lastAccessed: string;
}

export interface LearningCategory {
  key: "basics" | "technical" | "advanced";
  title: string;
  icon: string;
  description: string;
  moduleCount: number;
  completedCount: number;
}

class LearningService {
  private static instance: LearningService;
  private modules: LearningModule[] = [];
  private progress: Map<string, LearningProgress> = new Map();
  private isLoading = false;
  private error: string | null = null;

  private constructor() {
    this.initializeModules();
  }

  public static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
    }
    return LearningService.instance;
  }

  private initializeModules(): void {
    this.modules = [
      // Basics Category
      {
        id: "basics-001",
        title: "Crypto Trading Basics",
        description: "Learn the fundamentals of cryptocurrency trading, including market orders, limit orders, and risk management.",
        icon: "school",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Beginner",
        duration: "10 min",
        progress: 0,
        isCompleted: false,
        category: "basics",
        tags: ["fundamentals", "orders", "risk-management"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "basics-002",
        title: "Understanding Market Orders",
        description: "Master the different types of market orders and when to use each one for optimal trading.",
        icon: "trending-up",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Beginner",
        duration: "8 min",
        progress: 0,
        isCompleted: false,
        category: "basics",
        tags: ["market-orders", "trading-types"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "basics-003",
        title: "Risk Management Fundamentals",
        description: "Learn essential risk management strategies to protect your capital and maximize returns.",
        icon: "shield-checkmark",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Beginner",
        duration: "12 min",
        progress: 0,
        isCompleted: false,
        category: "basics",
        tags: ["risk-management", "capital-protection"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },

      // Technical Category
      {
        id: "technical-001",
        title: "Technical Analysis",
        description: "Master chart patterns, indicators, and technical analysis tools to make informed trading decisions.",
        icon: "analytics",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Intermediate",
        duration: "15 min",
        progress: 0,
        isCompleted: false,
        category: "technical",
        tags: ["technical-analysis", "chart-patterns"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "technical-002",
        title: "Chart Patterns & Trends",
        description: "Identify key chart patterns and trend analysis techniques for better entry and exit points.",
        icon: "bar-chart",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Intermediate",
        duration: "18 min",
        progress: 0,
        isCompleted: false,
        category: "technical",
        tags: ["chart-patterns", "trend-analysis"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "technical-003",
        title: "Trading Indicators",
        description: "Learn to use popular trading indicators like RSI, MACD, and moving averages effectively.",
        icon: "speedometer",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Intermediate",
        duration: "20 min",
        progress: 0,
        isCompleted: false,
        category: "technical",
        tags: ["indicators", "rsi", "macd", "moving-averages"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },

      // Advanced Category
      {
        id: "advanced-001",
        title: "Advanced Trading Strategies",
        description: "Explore advanced trading strategies including scalping, swing trading, and position sizing.",
        icon: "rocket",
        gradientColors: ["#6366F1", "#8B5CF6"],
        difficulty: "Advanced",
        duration: "25 min",
        progress: 0,
        isCompleted: false,
        category: "advanced",
        tags: ["advanced-strategies", "scalping", "swing-trading"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "advanced-002",
        title: "Portfolio Management",
        description: "Learn advanced portfolio management techniques and diversification strategies.",
        icon: "pie-chart",
        gradientColors: ["#8B5CF6", "#EC4899"],
        difficulty: "Advanced",
        duration: "22 min",
        progress: 0,
        isCompleted: false,
        category: "advanced",
        tags: ["portfolio-management", "diversification"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "advanced-003",
        title: "Psychology of Trading",
        description: "Master the psychological aspects of trading and develop emotional discipline.",
        icon: "brain",
        gradientColors: ["#EC4899", "#F59E0B"],
        difficulty: "Advanced",
        duration: "30 min",
        progress: 0,
        isCompleted: false,
        category: "advanced",
        tags: ["psychology", "emotional-discipline"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
  }

  public getCategories(): LearningCategory[] {
    return [
      {
        key: "basics",
        title: "Basics",
        icon: "school",
        description: "Master the fundamentals of crypto trading",
        moduleCount: this.getModulesByCategory("basics").length,
        completedCount: this.getCompletedModulesByCategory("basics").length,
      },
      {
        key: "technical",
        title: "Technical",
        icon: "analytics",
        description: "Learn technical analysis and chart patterns",
        moduleCount: this.getModulesByCategory("technical").length,
        completedCount: this.getCompletedModulesByCategory("technical").length,
      },
      {
        key: "advanced",
        title: "Advanced",
        icon: "rocket",
        description: "Advanced strategies and portfolio management",
        moduleCount: this.getModulesByCategory("advanced").length,
        completedCount: this.getCompletedModulesByCategory("advanced").length,
      },
    ];
  }

  public getModulesByCategory(category: "basics" | "technical" | "advanced"): LearningModule[] {
    return this.modules.filter(module => module.category === category);
  }

  public getModuleById(id: string): LearningModule | undefined {
    return this.modules.find(module => module.id === id);
  }

  public getAllModules(): LearningModule[] {
    return [...this.modules];
  }

  private getCompletedModulesByCategory(category: "basics" | "technical" | "advanced"): LearningModule[] {
    return this.modules.filter(module => 
      module.category === category && module.isCompleted
    );
  }

  public async updateProgress(moduleId: string, progress: number, userId: string): Promise<void> {
    try {
      const module = this.getModuleById(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Update module progress
      module.progress = Math.min(100, Math.max(0, progress));
      module.isCompleted = progress >= 100;

      // Update progress tracking
      const progressEntry: LearningProgress = {
        moduleId,
        userId,
        progress: module.progress,
        isCompleted: module.isCompleted,
        completedAt: module.isCompleted ? new Date().toISOString() : undefined,
        timeSpent: 0, // This would be calculated based on actual usage
        lastAccessed: new Date().toISOString(),
      };

      this.progress.set(`${userId}-${moduleId}`, progressEntry);

      logger.info(`Updated progress for module ${moduleId}`, "LearningService");
    } catch (error) {
      logger.error(`Error updating progress for module ${moduleId}`, "LearningService", error);
      throw error;
    }
  }

  public getProgress(moduleId: string, userId: string): LearningProgress | undefined {
    return this.progress.get(`${userId}-${moduleId}`);
  }

  public getOverallProgress(userId: string): number {
    const userProgress = Array.from(this.progress.values()).filter(p => p.userId === userId);
    if (userProgress.length === 0) return 0;
    
    const totalProgress = userProgress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / userProgress.length);
  }

  public getCompletedModulesCount(userId: string): number {
    return Array.from(this.progress.values()).filter(p => p.userId === userId && p.isCompleted).length;
  }

  public async loadUserProgress(userId: string): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // In a real app, this would fetch from an API or database
      // For now, we'll simulate loading progress
      logger.info(`Loading progress for user ${userId}`, "LearningService");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : "Failed to load progress";
      logger.error(`Error loading progress for user ${userId}`, "LearningService", error);
    }
  }

  public getLoadingState(): { isLoading: boolean; error: string | null } {
    return { isLoading: this.isLoading, error: this.error };
  }

  public async startModule(moduleId: string, userId: string): Promise<void> {
    try {
      const module = this.getModuleById(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Update last accessed time
      await this.updateProgress(moduleId, 0, userId);
      
      logger.info(`Started module ${moduleId} for user ${userId}`, "LearningService");
    } catch (error) {
      logger.error(`Error starting module ${moduleId}`, "LearningService", error);
      throw error;
    }
  }

  public async completeModule(moduleId: string, userId: string, quizScore?: number): Promise<void> {
    try {
      const progress = this.getProgress(moduleId, userId);
      if (!progress) {
        await this.startModule(moduleId, userId);
      }

      await this.updateProgress(moduleId, 100, userId);
      
      // Update quiz score if provided
      if (quizScore !== undefined) {
        const progressEntry = this.progress.get(`${userId}-${moduleId}`);
        if (progressEntry) {
          progressEntry.quizScore = quizScore;
        }
      }

      logger.info(`Completed module ${moduleId} for user ${userId}`, "LearningService");
    } catch (error) {
      logger.error(`Error completing module ${moduleId}`, "LearningService", error);
      throw error;
    }
  }
}

export const learningService = LearningService.getInstance(); 