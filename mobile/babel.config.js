module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo aktiviert weiterhin React Compiler (app.json
    // experiments.reactCompiler) und den Reanimated/Worklets-Plugin.
    // jsxImportSource: 'nativewind' schaltet className auf RN-Primitiven frei.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
