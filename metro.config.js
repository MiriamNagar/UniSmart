// @see https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Pin the project root so Metro resolves entry and chunks reliably (helps some Windows / monorepo setups).
config.watchFolders = [projectRoot];

module.exports = config;
