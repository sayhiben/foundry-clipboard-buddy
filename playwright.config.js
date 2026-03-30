const {defineConfig} = require("@playwright/test");
const {
  getDefaultFoundryStorageStatePath,
  getPlaywrightBrowserName,
  getPlaywrightChromiumChannel,
  getPlaywrightHeadless,
  getPlaywrightLaunchOptions,
} = require("./test/playwright/helpers/browser");

const browserName = getPlaywrightBrowserName();
const headless = getPlaywrightHeadless();
const chromiumHeadlessChannel = getPlaywrightChromiumChannel(browserName, headless);
const launchOptions = getPlaywrightLaunchOptions(browserName, headless);

module.exports = defineConfig({
  testDir: "./test/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  globalSetup: require.resolve("./test/playwright/global-setup.js"),
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ["list"],
    ["html", {open: "never"}],
  ],
  use: {
    baseURL: process.env.FOUNDRY_URL || process.env.FOUNDRY_JOIN_URL || process.env.FOUNDRY_BASE_URL || "http://127.0.0.1:30000",
    headless,
    launchOptions: Object.keys(launchOptions).length ? launchOptions : undefined,
    viewport: {width: 1600, height: 1000},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    storageState: process.env.FOUNDRY_STORAGE_STATE || getDefaultFoundryStorageStatePath(),
  },
  projects: [
    {
      name: browserName,
      use: {
        browserName,
        channel: chromiumHeadlessChannel,
      },
    },
  ],
  workers: 1,
});
