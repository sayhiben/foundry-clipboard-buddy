const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  controlPlaceable,
  createActorBackedToken,
  dispatchFilePaste,
  dispatchTextPaste,
  ensureUploadDirectory,
  ensureFoundryUsers,
  focusCanvas,
  focusChatInput,
  getFixtureUrl,
  getSafeCanvasPoint,
  getSceneToolState,
  getStateSnapshot,
  getTokenDocument,
  loginToFoundry,
  restoreCorePermissions,
  restoreModuleSettings,
  setCanvasMousePosition,
  setCorePermissions,
  setModuleSettings,
} = require("./helpers/foundry");

test.describe.configure({mode: "serial"});

async function captureClipboardNotifications(page) {
  await page.evaluate(() => {
    window.__clipboardNotifications = {
      error: [],
      warn: [],
      info: [],
    };

    if (ui.notifications.__clipboardNotificationsWrapped) return;

    for (const level of ["error", "warn", "info"]) {
      const original = ui.notifications[level].bind(ui.notifications);
      ui.notifications[level] = message => {
        window.__clipboardNotifications[level].push(String(message || ""));
        return original(message);
      };
    }

    ui.notifications.__clipboardNotificationsWrapped = true;
  });
}

async function ensureClipboardQaUsers() {
  return ensureFoundryUsers([
    {name: "Gamemaster", role: 4, pronouns: ""},
    {name: "Clipboard QA 1", role: 4, pronouns: ""},
    {name: "Clipboard QA 2", role: 1, pronouns: ""},
    {name: "Clipboard QA 3", role: 1, pronouns: ""},
  ]);
}

test("non-gm scene controls follow visibility and per-tool world settings", async ({browser}) => {
  await ensureClipboardQaUsers();

  const gmContext = await browser.newContext();
  const gmPage = await gmContext.newPage();
  let previousSettings = null;

  try {
    await loginToFoundry(gmPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    previousSettings = await setModuleSettings(gmPage, {
      "allow-non-gm-scene-controls": false,
      "minimum-role-canvas-media": "PLAYER",
      "enable-scene-paste-tool": true,
      "enable-scene-upload-tool": true,
    });

    async function getPlayerToolState() {
      const playerContext = await browser.newContext();
      const playerPage = await playerContext.newPage();
      try {
        await loginToFoundry(playerPage, {
          user: "Clipboard QA 2",
          password: "",
        });

        return {
          paste: await getSceneToolState(playerPage, "tokens", "clipboard-image-paste"),
          upload: await getSceneToolState(playerPage, "tokens", "clipboard-image-upload"),
        };
      } finally {
        await playerContext.close();
      }
    }

    let toolState = await getPlayerToolState();
    expect(toolState.paste.visible).toBe(false);
    expect(toolState.upload.visible).toBe(false);

    await setModuleSettings(gmPage, {"allow-non-gm-scene-controls": true});
    toolState = await getPlayerToolState();
    expect(toolState.paste.visible).toBe(true);
    expect(toolState.upload.visible).toBe(true);

    await setModuleSettings(gmPage, {"enable-scene-upload-tool": false});
    toolState = await getPlayerToolState();
    expect(toolState.paste.visible).toBe(true);
    expect(toolState.upload.visible).toBe(false);

    await setModuleSettings(gmPage, {"enable-scene-paste-tool": false, "enable-scene-upload-tool": true});
    toolState = await getPlayerToolState();
    expect(toolState.paste.visible).toBe(false);
    expect(toolState.upload.visible).toBe(true);
  } finally {
    await restoreModuleSettings(gmPage, previousSettings || {});
    await gmContext.close();
  }
});

test("player role gates block canvas text, chat media, and owned-token replacement until settings permit them", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  const gmContext = await browser.newContext();
  const gmPage = await gmContext.newPage();
  let previousSettings = null;
  let previousPermissions = null;
  let run = null;

  try {
    await loginToFoundry(gmPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    run = await beginClipboardRun(gmPage, testInfo);
    await ensureUploadDirectory(gmPage, run.uploadFolder, {
      source: run.source,
      bucket: run.bucket,
    });
    previousSettings = await setModuleSettings(gmPage, {
      "minimum-role-canvas-media": "ASSISTANT",
      "minimum-role-canvas-text": "ASSISTANT",
      "minimum-role-chat-media": "ASSISTANT",
    });
    previousPermissions = await setCorePermissions(gmPage, {
      FILES_BROWSE: [1, 2, 3, 4],
      FILES_UPLOAD: [1, 2, 3, 4],
      JOURNAL_CREATE: [1, 2, 3, 4],
      NOTE_CREATE: [1, 2, 3, 4],
    });

    const ownedTokenPosition = await getSafeCanvasPoint(gmPage, 2);
    const ownedToken = await createActorBackedToken(gmPage, {
      actorName: `${run.prefix} Owned Actor`,
      tokenName: `${run.prefix} Owned Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: ownedTokenPosition.x,
      y: ownedTokenPosition.y,
      ownerUserName: "Clipboard QA 2",
    });

    async function withPlayerSession(callback) {
      const playerContext = await browser.newContext();
      const playerPage = await playerContext.newPage();
      try {
        await loginToFoundry(playerPage, {
          user: "Clipboard QA 2",
          password: "",
        });
        return await callback(playerPage);
      } finally {
        await playerContext.close();
      }
    }

    await withPlayerSession(async playerPage => {
      await captureClipboardNotifications(playerPage);
      await focusCanvas(playerPage);
      await playerPage.evaluate(() => canvas.tiles.activate());
      const beforeBlockedText = await getStateSnapshot(playerPage);
      await dispatchTextPaste(playerPage, {
        targetSelector: ".game",
        text: "Blocked by minimum role",
      });
      await playerPage.waitForTimeout(300);
      const afterBlockedText = await getStateSnapshot(playerPage);
      expect(afterBlockedText.notes.length).toBe(beforeBlockedText.notes.length);

      const beforeBlockedChat = await getStateSnapshot(playerPage);
      await dispatchFilePaste(playerPage, {
        targetSelector: await focusChatInput(playerPage),
        filename: "test-token.png",
        mimeType: "image/png",
      });
      await playerPage.waitForTimeout(300);
      const afterBlockedChat = await getStateSnapshot(playerPage);
      expect(afterBlockedChat.messages.length).toBe(beforeBlockedChat.messages.length);

      await focusCanvas(playerPage);
      await playerPage.evaluate(() => canvas.tokens.activate());
      await controlPlaceable(playerPage, "Token", ownedToken.tokenId);
      const beforeBlockedToken = await getTokenDocument(playerPage, ownedToken.tokenId);
      await dispatchFilePaste(playerPage, {
        targetSelector: ".game",
        filename: "test-panorama.svg",
        mimeType: "image/svg+xml",
      });
      await playerPage.waitForTimeout(300);
      expect(await getTokenDocument(playerPage, ownedToken.tokenId)).toEqual(beforeBlockedToken);
    });

    await setModuleSettings(gmPage, {
      "minimum-role-canvas-media": "PLAYER",
      "minimum-role-canvas-text": "PLAYER",
      "minimum-role-chat-media": "PLAYER",
    });

    await withPlayerSession(async playerPage => {
      await focusCanvas(playerPage);
      await setCanvasMousePosition(playerPage, await getSafeCanvasPoint(playerPage, 12));
      await playerPage.evaluate(() => canvas.tiles.activate());
      const beforeAllowedText = await getStateSnapshot(playerPage);
      await dispatchTextPaste(playerPage, {
        targetSelector: ".game",
        text: `${run.prefix} Allowed note`,
      });
      await expect.poll(async () => (await getStateSnapshot(playerPage)).notes.length).toBe(beforeAllowedText.notes.length + 1);

      const beforeAllowedChat = await getStateSnapshot(playerPage);
      await dispatchFilePaste(playerPage, {
        targetSelector: await focusChatInput(playerPage),
        filename: "test-token.png",
        mimeType: "image/png",
      });
      await expect.poll(async () => (await getStateSnapshot(playerPage)).messages.length).toBe(beforeAllowedChat.messages.length + 1);

      await focusCanvas(playerPage);
      await playerPage.evaluate(() => canvas.tokens.activate());
      await controlPlaceable(playerPage, "Token", ownedToken.tokenId);
      await dispatchFilePaste(playerPage, {
        targetSelector: ".game",
        filename: "test-panorama.svg",
        mimeType: "image/svg+xml",
      });
      await expect.poll(async () => (await getTokenDocument(playerPage, ownedToken.tokenId)).textureSrc).toContain(run.uploadFolder);
    });
  } finally {
    await restoreCorePermissions(gmPage, previousPermissions);
    await restoreModuleSettings(gmPage, previousSettings || {});
    await cleanupClipboardRun(gmPage, run);
    await gmContext.close();
  }
});

test("players can replace tokens they own but not tokens owned by another user", async ({browser}, testInfo) => {
  await ensureClipboardQaUsers();

  const gmContext = await browser.newContext();
  const gmPage = await gmContext.newPage();
  let previousSettings = null;
  let previousPermissions = null;
  let run = null;

  try {
    await loginToFoundry(gmPage, {
      user: process.env.FOUNDRY_GM_USER || "Gamemaster",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    run = await beginClipboardRun(gmPage, testInfo);
    await ensureUploadDirectory(gmPage, run.uploadFolder, {
      source: run.source,
      bucket: run.bucket,
    });
    previousSettings = await setModuleSettings(gmPage, {
      "minimum-role-canvas-media": "PLAYER",
      "minimum-role-canvas-text": "PLAYER",
      "enable-token-replacement": true,
    });
    previousPermissions = await setCorePermissions(gmPage, {
      FILES_BROWSE: [1, 2, 3, 4],
      FILES_UPLOAD: [1, 2, 3, 4],
      JOURNAL_CREATE: [1, 2, 3, 4],
      NOTE_CREATE: [1, 2, 3, 4],
    });

    const ownedPosition = await getSafeCanvasPoint(gmPage, 3);
    const otherPosition = await getSafeCanvasPoint(gmPage, 4);
    const ownedToken = await createActorBackedToken(gmPage, {
      actorName: `${run.prefix} Owned Actor`,
      tokenName: `${run.prefix} Owned Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: ownedPosition.x,
      y: ownedPosition.y,
      ownerUserName: "Clipboard QA 2",
    });
    const otherToken = await createActorBackedToken(gmPage, {
      actorName: `${run.prefix} Other Actor`,
      tokenName: `${run.prefix} Other Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: otherPosition.x,
      y: otherPosition.y,
      ownerUserName: "Clipboard QA 3",
    });

    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();
    try {
      await loginToFoundry(playerPage, {
        user: "Clipboard QA 2",
        password: "",
      });
      await focusCanvas(playerPage);
      await playerPage.evaluate(() => canvas.tokens.activate());

      await controlPlaceable(playerPage, "Token", ownedToken.tokenId);
      await dispatchFilePaste(playerPage, {
        targetSelector: ".game",
        filename: "test-panorama.svg",
        mimeType: "image/svg+xml",
      });
      await expect.poll(async () => (await getTokenDocument(playerPage, ownedToken.tokenId)).textureSrc).toContain(run.uploadFolder);

      const beforeOther = await getTokenDocument(playerPage, otherToken.tokenId);
      await controlPlaceable(playerPage, "Token", otherToken.tokenId);
      await dispatchFilePaste(playerPage, {
        targetSelector: ".game",
        filename: "test-portrait.svg",
        mimeType: "image/svg+xml",
      });
      await playerPage.waitForTimeout(300);
      expect(await getTokenDocument(playerPage, otherToken.tokenId)).toEqual(beforeOther);

      await focusCanvas(playerPage);
      await setCanvasMousePosition(playerPage, await getSafeCanvasPoint(playerPage, 13));
      await playerPage.evaluate(() => canvas.tiles.activate());
      const beforeNotes = await getStateSnapshot(playerPage);
      await dispatchTextPaste(playerPage, {
        targetSelector: ".game",
        text: `${run.prefix} Player note`,
      });
      await expect.poll(async () => (await getStateSnapshot(playerPage)).notes.length).toBe(beforeNotes.notes.length + 1);
    } finally {
      await playerContext.close();
    }
  } finally {
    await restoreCorePermissions(gmPage, previousPermissions);
    await restoreModuleSettings(gmPage, previousSettings || {});
    await cleanupClipboardRun(gmPage, run);
    await gmContext.close();
  }
});
