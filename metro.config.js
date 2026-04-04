const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude Rust/Tauri build output from Metro file watcher
config.watchFolders = (config.watchFolders ?? []).filter(
  (f) => !f.includes('src-tauri'),
);
config.resolver.blockList = [
  new RegExp(path.join(__dirname, 'src-tauri', 'target').replace(/\\/g, '\\\\')),
];

module.exports = withNativeWind(config, { input: './global.css' });
