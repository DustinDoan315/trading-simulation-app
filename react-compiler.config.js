module.exports = {
  // Enable React compiler optimizations
  experimental: {
    // Enable automatic memoization
    autoMemo: true,
    // Enable automatic optimization of components
    optimizeComponents: true,
    // Enable dead code elimination
    deadCodeElimination: true,
    // Enable bundle size optimization
    bundleOptimization: true,
  },

  // Specific optimizations for trading app components
  components: {
    // Optimize frequently re-rendered components
    crypto: {
      autoMemo: true,
      optimizeProps: true,
    },
    trading: {
      autoMemo: true,
      optimizeState: true,
    },
    portfolio: {
      autoMemo: true,
      optimizeCalculations: true,
    },
  },

  // Performance monitoring
  performance: {
    // Enable performance tracking
    trackRenders: process.env.NODE_ENV === "development",
    // Enable bundle analysis
    analyzeBundle: process.env.NODE_ENV === "production",
  },
};
