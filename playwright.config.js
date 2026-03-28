const {defineConfig} = require("@playwright/test");

const browserName = process.env.PW_BROWSER || "chromium";
const defaultHeadless = process.env.CI ? true : false;
const headless = process.env.PW_HEADLESS === "true"
  ? true
  : process.env.PW_HEADLESS === "false"
    ? false
    : defaultHeadless;

module.exports = defineConfig({
  testDir: "./test/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
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
    viewport: {width: 1600, height: 1000},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    storageState: process.env.FOUNDRY_STORAGE_STATE || undefined,
  },
  projects: [
    {
      name: browserName,
      use: {browserName},
    },
  ],
  workers: 1,
});
