import UUIDService from '@/services/UUIDService';
import {
    LearningCategory,
    LearningModule,
    LearningProgress,
    learningService
    } from '@/services/LearningService';
import { useAppSelector } from '@/store';
import { useCallback, useEffect, useState } from 'react';


export interface UseLearningDataReturn {
  modules: LearningModule[];
  categories: LearningCategory[];
  selectedCategory: "basics" | "technical" | "advanced";
  setSelectedCategory: (category: "basics" | "technical" | "advanced") => void;
  isLoading: boolean;
  error: string | null;
  userProgress: Map<string, LearningProgress>;
  overallProgress: number;
  completedModulesCount: number;
  startModule: (moduleId: string) => Promise<void>;
  completeModule: (moduleId: string, quizScore?: number) => Promise<void>;
  updateProgress: (moduleId: string, progress: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useLearningData(): UseLearningDataReturn {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"basics" | "technical" | "advanced">("basics");
  const [userProgress, setUserProgress] = useState<Map<string, LearningProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedModulesCount, setCompletedModulesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAppSelector((state) => state.user.currentUser);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

   
      const userId = await UUIDService.getOrCreateUser();

     
      await learningService.loadUserProgress(userId);

  
      const allModules = learningService.getAllModules();
      const allCategories = learningService.getCategories();


      const modulesWithProgress = allModules.map(module => {
        const progress = learningService.getProgress(module.id, userId);
        return {
          ...module,
          progress: progress?.progress || 0,
          isCompleted: progress?.isCompleted || false,
        };
      });

      setModules(modulesWithProgress);
      setCategories(allCategories);

      
      const overall = learningService.getOverallProgress(userId);
      const completed = learningService.getCompletedModulesCount(userId);

      setOverallProgress(overall);
      setCompletedModulesCount(completed);

     
      const progressMap = new Map<string, LearningProgress>();
      allModules.forEach(module => {
        const progress = learningService.getProgress(module.id, userId);
        if (progress) {
          progressMap.set(module.id, progress);
        }
      });
      setUserProgress(progressMap);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load learning data";
      setError(errorMessage);
      console.error("Error loading learning data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startModule = useCallback(async (moduleId: string) => {
    try {
      const userId = await UUIDService.getOrCreateUser();
      await learningService.startModule(moduleId, userId);
      
  
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start module";
      setError(errorMessage);
      console.error("Error starting module:", err);
    }
  }, [loadData]);

  const completeModule = useCallback(async (moduleId: string, quizScore?: number) => {
    try {
      const userId = await UUIDService.getOrCreateUser();
      await learningService.completeModule(moduleId, userId, quizScore);
      
   
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete module";
      setError(errorMessage);
      console.error("Error completing module:", err);
    }
  }, [loadData]);

  const updateProgress = useCallback(async (moduleId: string, progress: number) => {
    try {
      const userId = await UUIDService.getOrCreateUser();
      await learningService.updateProgress(moduleId, progress, userId);
      
 
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update progress";
      setError(errorMessage);
      console.error("Error updating progress:", err);
    }
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  return {
    modules,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    userProgress,
    overallProgress,
    completedModulesCount,
    startModule,
    completeModule,
    updateProgress,
    refreshData,
  };
} 