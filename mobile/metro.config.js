const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const sharedSrcInMobile = path.resolve(projectRoot, 'shared-src');
const sharedSrcInRepo = path.resolve(workspaceRoot, 'src');

const config = getDefaultConfig(projectRoot);

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

const sharedSrc = fs.existsSync(sharedSrcInMobile)
  ? sharedSrcInMobile
  : fs.existsSync(sharedSrcInRepo)
    ? sharedSrcInRepo
    : null;

if (sharedSrc) {
  config.watchFolders = [sharedSrc];
} else {
  console.warn(
    '[metro] No shared engine found. Run: npm run sync-engine (from mobile/)',
  );
}

config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

const { resolve } = require('metro-resolver');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath;
  const inSharedEngine =
    origin.includes(`${path.sep}shared-src${path.sep}`) ||
    origin.includes(`${path.sep}src${path.sep}`);

  if (moduleName.startsWith('.') && moduleName.endsWith('.js') && inSharedEngine) {
    const tsModule = moduleName.replace(/\.js$/, '');
    try {
      return resolve(context, tsModule, platform);
    } catch {
      // fall through
    }
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
