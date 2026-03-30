const path = require("path");

function getPlaywrightBrowserName() {
  return process.env.PW_BROWSER || "chromium";
}

function getPlaywrightHeadless() {
  const defaultHeadless = process.env.CI ? true : false;
  if (process.env.PW_HEADLESS === "true") return true;
  if (process.env.PW_HEADLESS === "false") return false;
  return defaultHeadless;
}

function getPlaywrightChromiumHeadlessArgs(browserName = getPlaywrightBrowserName(), headless = getPlaywrightHeadless()) {
  if (!(headless && browserName === "chromium")) return [];

  return [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ];
}

function getPlaywrightChromiumChannel(browserName = getPlaywrightBrowserName(), headless = getPlaywrightHeadless()) {
  return headless && browserName === "chromium" ? "chromium" : undefined;
}

function getPlaywrightLaunchOptions(browserName = getPlaywrightBrowserName(), headless = getPlaywrightHeadless()) {
  const args = getPlaywrightChromiumHeadlessArgs(browserName, headless);
  return args.length ? {args} : {};
}

function getDefaultFoundryStorageStatePath() {
  return path.resolve(__dirname, "..", ".auth", "default-user.json");
}

module.exports = {
  getDefaultFoundryStorageStatePath,
  getPlaywrightBrowserName,
  getPlaywrightChromiumChannel,
  getPlaywrightHeadless,
  getPlaywrightLaunchOptions,
};
