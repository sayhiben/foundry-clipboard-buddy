const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  dispatchFilePaste,
  ensureFoundryUsers,
  focusCanvas,
  getStateSnapshot,
  loginToFoundry,
  setModuleSettings,
} = require("./helpers/foundry");

test.describe.configure({mode: "serial"});

async function ensureClipboardQaUsers() {
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

async function triggerMissingBucketCanvasError(page) {
  await focusCanvas(page);
  await page.evaluate(() => canvas.tiles.activate());
  await dispatchFilePaste(page, {
    targetSelector: ".game",
    filename: "test-token.png",
    mimeType: "image/png",
  });
}

test("gm-local errors show a popup, a richer dialog, and a verbose logfile download", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  const gmContext = await browser.newContext({acceptDownloads: true});
  const gmPage = await gmContext.newPage();
  let run = null;

  try {
    await loginToFoundry(gmPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    await captureClipboardUi(gmPage);
    run = await beginClipboardRun(gmPage, testInfo, {verboseLogging: true});
    await setModuleSettings(gmPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
    });

    const before = await getStateSnapshot(gmPage);
    await triggerMissingBucketCanvasError(gmPage);

    await expect.poll(async () => (await getClipboardUi(gmPage)).notifications.error.length).toBe(1);
    await expect.poll(async () => (await getClipboardUi(gmPage)).dialogs.length).toBe(1);
    await expect.poll(async () => (await getClipboardUi(gmPage)).downloads.length).toBe(1);

    const uiState = await getClipboardUi(gmPage);
    expect(uiState.notifications.error[0]).toContain("S3-compatible destinations require a bucket selection");
    expect(uiState.dialogs[0].content).toContain("Download module logfile");
    expect(uiState.dialogs[0].content).toContain("This client encountered a Clipboard Image error.");
    expect(uiState.downloads[0].filename).toMatch(/^clipboard-image-error-/);
    expect(uiState.downloads[0].content).toContain("Clipboard Image Error Report");

    const after = await getStateSnapshot(gmPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    await cleanupClipboardRun(gmPage, run);
    await gmContext.close();
  }
});

test("player-side errors alert the player and relay richer details to connected gms", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  const gmContext = await browser.newContext({acceptDownloads: true});
  const gmPage = await gmContext.newPage();
  const playerContext = await browser.newContext({acceptDownloads: true});
  const playerPage = await playerContext.newPage();
  let run = null;

  try {
    await loginToFoundry(gmPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    await captureClipboardUi(gmPage);
    run = await beginClipboardRun(gmPage, testInfo, {verboseLogging: false});
    await setModuleSettings(gmPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
    });

    await loginToFoundry(playerPage, {
      user: "Clipboard QA 2",
      password: "",
    });
    await captureClipboardUi(playerPage);

    const before = await getStateSnapshot(playerPage);
    await triggerMissingBucketCanvasError(playerPage);

    await expect.poll(async () => (await getClipboardUi(playerPage)).notifications.error.length).toBe(1);
    await expect.poll(async () => (await getClipboardUi(gmPage)).dialogs.length).toBe(1);

    const playerUi = await getClipboardUi(playerPage);
    const gmUi = await getClipboardUi(gmPage);
    expect(playerUi.notifications.error[0]).toContain("S3-compatible destinations require a bucket selection");
    expect(playerUi.dialogs).toHaveLength(0);
    expect(gmUi.notifications.error[0]).toContain("S3-compatible destinations require a bucket selection");
    expect(gmUi.dialogs[0].content).toContain("Another user encountered a Clipboard Image error.");
    expect(gmUi.dialogs[0].content).toContain("Download module logfile");
    expect(gmUi.downloads).toHaveLength(0);

    const after = await getStateSnapshot(playerPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    await cleanupClipboardRun(gmPage, run);
    await playerContext.close();
    await gmContext.close();
  }
});

test("player-side errors still alert the acting user when no gm client is connected", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  const setupContext = await browser.newContext({acceptDownloads: true});
  const setupPage = await setupContext.newPage();
  let run = null;

  try {
    await loginToFoundry(setupPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    run = await beginClipboardRun(setupPage, testInfo, {verboseLogging: false});
    await setModuleSettings(setupPage, {
      "image-location-source": "s3",
      "image-location-bucket": "",
    });
  } finally {
    await setupContext.close();
  }

  const playerContext = await browser.newContext({acceptDownloads: true});
  const playerPage = await playerContext.newPage();
  try {
    await loginToFoundry(playerPage, {
      user: "Clipboard QA 2",
      password: "",
    });
    await captureClipboardUi(playerPage);
    const before = await getStateSnapshot(playerPage);
    await triggerMissingBucketCanvasError(playerPage);

    await expect.poll(async () => (await getClipboardUi(playerPage)).notifications.error.length).toBe(1);
    const playerUi = await getClipboardUi(playerPage);
    expect(playerUi.notifications.error[0]).toContain("S3-compatible destinations require a bucket selection");
    expect(playerUi.dialogs).toHaveLength(0);

    const after = await getStateSnapshot(playerPage);
    expect(after.tokens).toEqual(before.tokens);
    expect(after.tiles).toEqual(before.tiles);
    expect(after.notes).toEqual(before.notes);
    expect(after.messages).toEqual(before.messages);
  } finally {
    await playerContext.close();
    const cleanupContext = await browser.newContext({acceptDownloads: true});
    const cleanupPage = await cleanupContext.newPage();
    try {
      await loginToFoundry(cleanupPage, {
        user: process.env.FOUNDRY_GM_USER || "Gamemaster",
        password: process.env.FOUNDRY_GM_PASSWORD ?? "",
      });
      await cleanupClipboardRun(cleanupPage, run);
    } finally {
      await cleanupContext.close();
    }
  }
});
