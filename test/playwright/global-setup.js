const fs = require("fs");
const path = require("path");
const {chromium, firefox, webkit} = require("playwright");
const {loginToFoundry, resolveFoundryCredentials, resetFoundrySessions} = require("./helpers/foundry");
const {
  getDefaultFoundryStorageStatePath,
  getPlaywrightBrowserName,
  getPlaywrightChromiumChannel,
  getPlaywrightHeadless,
  getPlaywrightLaunchOptions,
} = require("./helpers/browser");

module.exports = async () => {
  if (process.env.FOUNDRY_STORAGE_STATE) return;

  await resetFoundrySessions();

  const browserName = getPlaywrightBrowserName();
  const headless = getPlaywrightHeadless();
  const channel = getPlaywrightChromiumChannel(browserName, headless);
  const launchOptions = {
    headless,
    ...getPlaywrightLaunchOptions(browserName, headless),
  };
  if (channel) launchOptions.channel = channel;

  const browserLauncher = {
    chromium,
    firefox,
    webkit,
  }[browserName] || chromium;

  const storageStatePath = getDefaultFoundryStorageStatePath();
  fs.mkdirSync(path.dirname(storageStatePath), {recursive: true});

  const browser = await browserLauncher.launch(launchOptions);
  try {
    const context = await browser.newContext({acceptDownloads: true});
    try {
      const page = await context.newPage();
      const credentials = resolveFoundryCredentials({
        user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
        password: Object.hasOwn(process.env, "FOUNDRY_GM_PASSWORD") ? process.env.FOUNDRY_GM_PASSWORD : undefined,
      }, {gm: true});
      await loginToFoundry(page, credentials);
      await context.storageState({path: storageStatePath});
    } finally {
      await context.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
};
