module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated/worklets plugin is added automatically by babel-preset-expo
    // when react-native-reanimated is installed — do not add it manually.
  };
};
