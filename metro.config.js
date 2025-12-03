const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable React 19 optimizations
config.transformer = {
  ...config.transformer,
  experimentalImportSupport: false,
  inlineRequires: true,
};

// Optimize bundle size
config.resolver = {
  ...config.resolver,
  // Enable tree shaking
};

// Enable production optimizations
if (process.env.NODE_ENV === "production") {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    // Enable dead code elimination
    mangle: {
      ...config.transformer.minifierConfig?.mangle,
      keep_fnames: false,
    },
    compress: {
      ...config.transformer.minifierConfig?.compress,
      // Enable dead code elimination
      dead_code: true,
      // Enable unused variable removal
      unused: true,
    },
  };
}

module.exports = config;
