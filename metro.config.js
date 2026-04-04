const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude Rust/Tauri build output from Metro file watcher
config.watchFolders = (config.watchFolders ?? []).filter(
  (f) => !f.includes('src-tauri'),
);
const tauriTarget = path.join(__dirname, 'src-tauri', 'target');
const escapedTauriTarget = tauriTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];
config.resolver.blockList = [...existingBlockList, new RegExp(`${escapedTauriTarget}.*`)];

module.exports = withNativeWind(config, { input: './global.css' });
