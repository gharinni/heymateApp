module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'], // ✅ Required for Expo

    plugins: [
      // (optional plugins can go here)

      'react-native-reanimated/plugin', // ✅ MUST ALWAYS BE LAST
    ],
  };
};