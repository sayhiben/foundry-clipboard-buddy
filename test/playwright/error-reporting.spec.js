const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  closeOwnedContext,
  createAuthenticatedPage,
  dispatchFilePaste,
  ensureUploadDirectory,
  ensureFoundryUsers,
  focusCanvas,
  getSafeCanvasPoint,
  getStateSnapshot,
  resetFoundrySessions,
  restoreCorePermissions,
  setCanvasMousePosition,
  setCorePermissions,
  setModuleSettings,
} = require("./helpers/foundry");

test.describe.configure({mode: "serial"});
test.setTimeout(300_000);

async function ensureClipboardQaUsers() {
  await resetFoundrySessions();
  return ensureFoundryUsers([
    {name: "Gamemaster", role: 4, pronouns: ""},
    {name: "Clipboard QA 1", role: 4, pronouns: ""},
    {name: "Clipboard QA 2", role: 1, pronouns: ""},
    {name: "Clipboard QA 3", role: 1, pronouns: ""},
  ]);
}

async function captureClipboardUi(page) {
  await page.evaluate(() => {
    window.__clipboardUi = {
      notifications: {
        error: [],
        warn: [],
        info: [],
      },
      dialogs: [],
      downloads: [],
    };

    if (!ui.notifications.__clipboardUiWrapped) {
      for (const level of ["error", "warn", "info"]) {
        const original = ui.notifications[level].bind(ui.notifications);
        ui.notifications[level] = message => {
          window.__clipboardUi.notifications[level].push(String(message || ""));
          return original(message);
        };
      }
      ui.notifications.__clipboardUiWrapped = true;
    }

    if (!window.__clipboardDialogWrapped && typeof globalThis.Dialog === "function") {
      const OriginalDialog = globalThis.Dialog;
      globalThis.Dialog = class ClipboardUiDialog extends OriginalDialog {
        constructor(data, ...args) {
          window.__clipboardUi.dialogs.push({
            title: String(data?.title || ""),
            content: String(data?.content || ""),
          });
          super(data, ...args);
        }
      };
      window.__clipboardDialogWrapped = true;
    }

    if (!window.__clipboardSaveDataWrapped && typeof globalThis.saveDataToFile === "function") {
      const originalSaveDataToFile = globalThis.saveDataToFile.bind(globalThis);
      globalThis.saveDataToFile = (content, mimeType, filename) => {
        window.__clipboardUi.downloads.push({
          filename: String(filename || ""),
          mimeType: String(mimeType || ""),
          content: String(content || ""),
        });
        return originalSaveDataToFile(content, mimeType, filename);
      };
      window.__clipboardSaveDataWrapped = true;
    }
  });
}

async function getClipboardUi(page) {
  return page.evaluate(() => ({
    notifications: {
      error: [...(window.__clipboardUi?.notifications?.error || [])],
      warn: [...(window.__clipboardUi?.notifications?.warn || [])],
      info: [...(window.__clipboardUi?.notifications?.info || [])],
    },
    dialogs: [...(window.__clipboardUi?.dialogs || [])],
    downloads: [...(window.__clipboardUi?.downloads || [])],
  }));
}

async function resetClipboardUi(page) {
  await page.evaluate(() => {
    if (!window.__clipboardUi) return;
    window.__clipboardUi.notifications.error = [];
    window.__clipboardUi.notifications.warn = [];
    window.__clipboardUi.notifications.info = [];
    window.__clipboardUi.dialogs = [];
    window.__clipboardUi.downloads = [];
  });
}

async function triggerMissingBucketCanvasError(page) {
  await focusCanvas(page);
  await page.evaluate(() => canvas.tiles.activate());
  await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 9));
  await dispatchFilePaste(page, {
    targetSelector: ".game",
    filename: "test-token.png",
    mimeType: "image/png",
  });
}

test("gm-local errors show a popup, a richer dialog, and a verbose logfile download", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  let gmPage = null;
  let run = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    }, {acceptDownloads: true, reuseAuth: false});
    gmPage = gmSession.page;
    await captureClipboardUi(gmPage);
    run = await beginClipboardRun(gmPage, testInfo, {verboseLogging: true});
    await setModuleSettings(gmPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
    });

    const before = await getStateSnapshot(gmPage);
    await resetClipboardUi(gmPage);
    await triggerMissingBucketCanvasError(gmPage);

    await expect.poll(async () => (await getClipboardUi(gmPage)).notifications.error.length > 0).toBe(true);
    await expect.poll(async () => (await getClipboardUi(gmPage)).dialogs.length > 0).toBe(true);
    await expect.poll(async () => (await getClipboardUi(gmPage)).downloads.length > 0).toBe(true);

    const uiState = await getClipboardUi(gmPage);
    expect(uiState.notifications.error.at(-1)).toContain("Clipboard QA 1 attempted to paste an image");
    expect(uiState.notifications.error.at(-1)).toContain("S3-compatible destinations require a bucket selection");
    expect(uiState.dialogs.at(-1).content).toContain("Download module logfile");
    expect(uiState.dialogs.at(-1).content).toContain("This client encountered a Foundry Paste Eater error.");
    expect(uiState.dialogs.at(-1).content).toContain("GM guidance:");
    expect(uiState.dialogs.at(-1).content).toMatch(/Foundry Paste Eater(?:&#x27;|')s world settings/);
    expect(uiState.downloads.at(-1).filename).toMatch(/^foundry-paste-eater-error-/);
    expect(uiState.downloads.at(-1).content).toContain("Foundry Paste Eater Error Report");

    const after = await getStateSnapshot(gmPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    await cleanupClipboardRun(gmPage, run);
    await closeOwnedContext(gmPage);
  }
});

test("player-side errors alert the player and relay richer details to connected gms", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  let gmPage = null;
  let playerPage = null;
  let run = null;
  let previousSettings = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    }, {acceptDownloads: true, reuseAuth: false});
    gmPage = gmSession.page;
    await captureClipboardUi(gmPage);
    run = await beginClipboardRun(gmPage, testInfo, {verboseLogging: false});
    previousSettings = await setModuleSettings(gmPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
      "minimum-role-canvas-media": "PLAYER",
    });

    const playerSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    }, {acceptDownloads: true, reuseAuth: false});
    playerPage = playerSession.page;
    await captureClipboardUi(playerPage);

    const before = await getStateSnapshot(playerPage);
    await resetClipboardUi(gmPage);
    await resetClipboardUi(playerPage);
    await triggerMissingBucketCanvasError(playerPage);

    await expect.poll(async () => (await getClipboardUi(playerPage)).notifications.error.length > 0).toBe(true);
    await expect.poll(async () => (await getClipboardUi(gmPage)).dialogs.length > 0).toBe(true);

    const playerUi = await getClipboardUi(playerPage);
    const gmUi = await getClipboardUi(gmPage);
    expect(playerUi.notifications.error.at(-1)).toContain("Clipboard QA 2 attempted to paste an image");
    expect(playerUi.notifications.error.at(-1)).toContain("S3-compatible destinations require a bucket selection");
    expect(playerUi.dialogs).toHaveLength(0);
    expect(gmUi.notifications.error.at(-1)).toContain("Clipboard QA 2 attempted to paste an image");
    expect(gmUi.notifications.error.at(-1)).toContain("S3-compatible destinations require a bucket selection");
    expect(gmUi.dialogs.at(-1).content).toContain("Another user encountered a Foundry Paste Eater error.");
    expect(gmUi.dialogs.at(-1).content).toContain("Download module logfile");
    expect(gmUi.dialogs.at(-1).content).toContain("Clipboard QA 2 attempted to paste an image");
    expect(gmUi.downloads).toHaveLength(0);

    const after = await getStateSnapshot(playerPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    if (gmPage && previousSettings) {
      await setModuleSettings(gmPage, previousSettings);
    }
    await cleanupClipboardRun(gmPage, run);
    await closeOwnedContext(playerPage);
    await closeOwnedContext(gmPage);
  }
});

test("player-side errors still alert the acting user when no gm client is connected", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  let setupPage = null;
  let run = null;
  let previousSettings = null;

  try {
    const setupSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    }, {acceptDownloads: true, reuseAuth: false});
    setupPage = setupSession.page;
    run = await beginClipboardRun(setupPage, testInfo, {verboseLogging: false});
    previousSettings = await setModuleSettings(setupPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
      "minimum-role-canvas-media": "PLAYER",
    });
  } finally {
    await closeOwnedContext(setupPage);
  }

  let playerPage = null;
  try {
    const playerSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    }, {acceptDownloads: true, reuseAuth: false});
    playerPage = playerSession.page;
    await captureClipboardUi(playerPage);
    const before = await getStateSnapshot(playerPage);
    await resetClipboardUi(playerPage);
    await triggerMissingBucketCanvasError(playerPage);

    await expect.poll(async () => (await getClipboardUi(playerPage)).notifications.error.length > 0).toBe(true);
    const playerUi = await getClipboardUi(playerPage);
    expect(playerUi.notifications.error.at(-1)).toContain("Clipboard QA 2 attempted to paste an image");
    expect(playerUi.notifications.error.at(-1)).toContain("S3-compatible destinations require a bucket selection");
    expect(playerUi.dialogs).toHaveLength(0);

    const after = await getStateSnapshot(playerPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    await closeOwnedContext(playerPage);
    let cleanupPage = null;
    try {
      const cleanupSession = await createAuthenticatedPage(browser, {
        user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
        password: process.env.FOUNDRY_GM_PASSWORD ?? "",
      }, {acceptDownloads: true, reuseAuth: false});
      cleanupPage = cleanupSession.page;
      if (previousSettings) {
        await setModuleSettings(cleanupPage, previousSettings);
      }
      await cleanupClipboardRun(cleanupPage, run);
    } finally {
      await closeOwnedContext(cleanupPage);
    }
  }
});

test("storage permission errors tell the gm to check Foundry core settings instead of module settings", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  let gmPage = null;
  let playerPage = null;
  let run = null;
  let previousPermissions = null;
  let previousSettings = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    }, {acceptDownloads: true, reuseAuth: false});
    gmPage = gmSession.page;
    await captureClipboardUi(gmPage);
    run = await beginClipboardRun(gmPage, testInfo, {verboseLogging: false});
    await ensureUploadDirectory(gmPage, run.uploadFolder, {
      source: run.source,
      bucket: run.bucket,
    });
    previousSettings = await setModuleSettings(gmPage, {
      "minimum-role-canvas-media": "PLAYER",
    });
    previousPermissions = await setCorePermissions(gmPage, {
      FILES_BROWSE: [4],
      FILES_UPLOAD: [4],
    });

    const playerSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    }, {acceptDownloads: true, reuseAuth: false});
    playerPage = playerSession.page;
    await captureClipboardUi(playerPage);

    const before = await getStateSnapshot(playerPage);
    await resetClipboardUi(gmPage);
    await resetClipboardUi(playerPage);
    await triggerMissingBucketCanvasError(playerPage);

    await expect.poll(async () => (await getClipboardUi(playerPage)).notifications.error.length > 0).toBe(true);
    await expect.poll(async () => (await getClipboardUi(gmPage)).dialogs.length > 0).toBe(true);

    const playerUi = await getClipboardUi(playerPage);
    const gmUi = await getClipboardUi(gmPage);
    expect(playerUi.notifications.error.at(-1)).toContain("Clipboard QA 2 attempted to paste an image");
    expect(playerUi.notifications.error.at(-1)).toContain("Foundry's core settings");
    expect(gmUi.dialogs.at(-1).content).toMatch(/Foundry(?:&#x27;|')s core settings/);
    expect(gmUi.dialogs.at(-1).content).toMatch(/not this module(?:&#x27;|')s settings/);

    const after = await getStateSnapshot(playerPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    if (gmPage && previousPermissions) {
      await restoreCorePermissions(gmPage, previousPermissions);
    }
    if (gmPage && previousSettings) {
      await setModuleSettings(gmPage, previousSettings);
    }
    await cleanupClipboardRun(gmPage, run);
    await closeOwnedContext(playerPage);
    await closeOwnedContext(gmPage);
  }
});
