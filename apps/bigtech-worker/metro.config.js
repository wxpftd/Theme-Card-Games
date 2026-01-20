const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 监听整个 monorepo
config.watchFolders = [workspaceRoot];

// 依赖解析路径
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 启用 symlinks 支持（pnpm hoisted 模式需要）
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
