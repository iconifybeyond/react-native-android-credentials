const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration for the example app.
 * Adds the parent library root as a watchFolder so that
 * changes in src/ are picked up without publishing.
 */
const config = {
  watchFolders: [root],
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (name === '@iconifybeyond/react-native-android-credentials') {
            return root;
          }
          return path.join(__dirname, `node_modules/${String(name)}`);
        },
      }
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
