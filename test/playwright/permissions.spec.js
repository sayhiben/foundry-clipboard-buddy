const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  closeOwnedContext,
  controlPlaceable,
  createAuthenticatedPage,
  createActorBackedToken,
  dispatchFilePaste,
  dispatchTextPaste,
  ensureUploadDirectory,
  focusCanvas,
  focusChatInput,
  getFixtureUrl,
  getSafeCanvasPoint,
  getStateSnapshot,
  getTokenDocument,
  releaseAllControlledPlaceables,
  resetFoundrySessions,
  restoreCorePermissions,
  restoreModuleSettings,
  resetFoundryUiState,
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

async function ensureClipboardQaUsers(browser) {
  await resetFoundrySessions();
  const session = await createAuthenticatedPage(browser, {
    user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
    password: process.env.FOUNDRY_GM_PASSWORD ?? "",
  }, {gm: true, reuseAuth: false});

  try {
    return session.page.evaluate(async users => {
      const results = [];

      for (const spec of users) {
        const user = game.users.find(entry => entry.name === spec.name) || null;
        if (!user) {
          throw new Error(`Could not find Foundry user "${spec.name}" in the active world. Seed the QA users in the test world first.`);
        }

        const update = {};
        if (typeof spec.role === "number" && user.role !== spec.role) update.role = spec.role;
        if ((spec.pronouns ?? "") !== (user.pronouns ?? "")) update.pronouns = spec.pronouns ?? "";

        if (Object.keys(update).length) {
          await user.update(update);
        }

        results.push({
          id: user.id,
          name: user.name,
          role: update.role ?? user.role,
        });
      }

      return results;
    }, [
      {name: "Gamemaster", role: 4, pronouns: ""},
      {name: "Clipboard QA 1", role: 4, pronouns: ""},
      {name: "Clipboard QA 2", role: 1, pronouns: ""},
      {name: "Clipboard QA 3", role: 1, pronouns: ""},
    ]);
  } finally {
    await closeOwnedContext(session.context);
  }
}

async function getHookedSceneToolState(page, controlName, toolName) {
  return page.evaluate(({controlName, toolName}) => {
    const controls = {
      tiles: {name: "tiles", tools: {}},
      tokens: {name: "tokens", tools: {}},
    };
    Hooks.callAll("getSceneControlButtons", controls);
    const control = controls[controlName] || null;
    const tools = Array.isArray(control?.tools)
      ? control.tools
      : Object.values(control?.tools || {});
    const tool = tools.find(entry => entry?.name === toolName) || null;
    return {
      exists: Boolean(tool),
      visible: Boolean(tool?.visible),
      title: tool?.title || null,
    };
  }, {controlName, toolName});
}

async function invokeHookedSceneTool(page, controlName, toolName) {
  await page.evaluate(({controlName, toolName}) => {
    const controls = {
      tiles: {name: "tiles", tools: {}},
      tokens: {name: "tokens", tools: {}},
    };
    Hooks.callAll("getSceneControlButtons", controls);
    const control = controls[controlName] || null;
    const tools = Array.isArray(control?.tools)
      ? control.tools
      : Object.values(control?.tools || {});
    const tool = tools.find(entry => entry?.name === toolName) || null;
    if (!tool?.visible || typeof tool.onClick !== "function") {
      throw new Error(`Could not find visible tool ${toolName} on control ${controlName}.`);
    }
    tool.onClick();
  }, {controlName, toolName});
}

test("player role gates block canvas text, chat media, and owned-token replacement until settings permit them", async ({browser}, testInfo) => {
  testInfo.setTimeout(240_000);
  await ensureClipboardQaUsers(browser);

  let gmPage = null;
  let previousSettings = null;
  let previousPermissions = null;
  let run = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    gmPage = gmSession.page;
    run = await beginClipboardRun(gmPage, testInfo);
    await ensureUploadDirectory(gmPage, run.uploadFolder, {
      source: run.source,
      bucket: run.bucket,
    });
    previousSettings = await setModuleSettings(gmPage, {
      "enable-chat-media": true,
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
      const playerSession = await createAuthenticatedPage(browser, {
        user: "Clipboard QA 2",
        password: "",
      });
      const playerContext = playerSession.context;
      const playerPage = playerSession.page;
      try {
        return await callback(playerPage);
      } finally {
        await closeOwnedContext(playerContext);
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
    await closeOwnedContext(gmPage);
  }
});

test("players can replace tokens they own but not tokens owned by another user", async ({browser}, testInfo) => {
  testInfo.setTimeout(240_000);
  await ensureClipboardQaUsers(browser);

  let gmPage = null;
  let previousSettings = null;
  let previousPermissions = null;
  let run = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    gmPage = gmSession.page;
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

    const playerSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    });
    const playerContext = playerSession.context;
    const playerPage = playerSession.page;
    try {
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
    } finally {
      await closeOwnedContext(playerContext);
    }

    const noteSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    });
    const noteContext = noteSession.context;
    const notePage = noteSession.page;
    try {
      await focusCanvas(notePage);
      await releaseAllControlledPlaceables(notePage);
      await setCanvasMousePosition(notePage, await getSafeCanvasPoint(notePage, 13));
      await notePage.evaluate(() => canvas.tiles.activate());
      const beforeNotes = await getStateSnapshot(notePage);
      await dispatchTextPaste(notePage, {
        targetSelector: ".game",
        text: `${run.prefix} Player note`,
      });
      await expect.poll(async () => (await getStateSnapshot(notePage)).notes.length).toBe(beforeNotes.notes.length + 1);
    } finally {
      await closeOwnedContext(noteContext);
    }
  } finally {
    await restoreCorePermissions(gmPage, previousPermissions);
    await restoreModuleSettings(gmPage, previousSettings || {});
    await cleanupClipboardRun(gmPage, run);
    await closeOwnedContext(gmPage);
  }
});

test("non-gm scene controls require both the world toggle and canvas-media role eligibility", async ({browser}, testInfo) => {
  testInfo.setTimeout(240_000);
  await ensureClipboardQaUsers(browser);

  let gmPage = null;
  let previousSettings = null;
  let previousPermissions = null;
  let run = null;
  let playerContext = null;
  let playerPage = null;

  try {
    const gmSession = await createAuthenticatedPage(browser, {
      user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
      password: process.env.FOUNDRY_GM_PASSWORD ?? "",
    });
    gmPage = gmSession.page;
    run = await beginClipboardRun(gmPage, testInfo);
    await ensureUploadDirectory(gmPage, run.uploadFolder, {
      source: run.source,
      bucket: run.bucket,
    });
    previousSettings = await setModuleSettings(gmPage, {
      "allow-non-gm-scene-controls": false,
      "enable-scene-paste-tool": true,
      "enable-scene-upload-tool": true,
      "minimum-role-canvas-media": "PLAYER",
      "scene-paste-prompt-mode": "always",
    });
    previousPermissions = await setCorePermissions(gmPage, {
      FILES_BROWSE: [1, 2, 3, 4],
      FILES_UPLOAD: [1, 2, 3, 4],
    });
    const ownedTokenPosition = await getSafeCanvasPoint(gmPage, 14);
    const ownedToken = await createActorBackedToken(gmPage, {
      actorName: `${run.prefix} Scene Tool Actor`,
      tokenName: `${run.prefix} Scene Tool Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: ownedTokenPosition.x,
      y: ownedTokenPosition.y,
      ownerUserName: "Clipboard QA 2",
    });

    const playerSession = await createAuthenticatedPage(browser, {
      user: "Clipboard QA 2",
      password: "",
    });
    playerContext = playerSession.context;
    playerPage = playerSession.page;

    await resetFoundryUiState(playerPage);
    {
      const pasteTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-paste");
      const uploadTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-upload");
      expect(pasteTool.visible).toBe(false);
      expect(uploadTool.visible).toBe(false);
    }

    await setModuleSettings(gmPage, {
      "allow-non-gm-scene-controls": true,
      "minimum-role-canvas-media": "ASSISTANT",
    });
    await resetFoundryUiState(playerPage);
    {
      const pasteTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-paste");
      const uploadTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-upload");
      expect(pasteTool.visible).toBe(false);
      expect(uploadTool.visible).toBe(false);
    }

    await setModuleSettings(gmPage, {
      "minimum-role-canvas-media": "PLAYER",
    });
    await resetFoundryUiState(playerPage);
    {
      const pasteTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-paste");
      const uploadTool = await getHookedSceneToolState(playerPage, "tiles", "foundry-paste-eater-upload");
      expect(pasteTool.visible).toBe(true);
      expect(uploadTool.visible).toBe(true);

      await focusCanvas(playerPage);
      await playerPage.evaluate(() => canvas.tokens.activate());
      await controlPlaceable(playerPage, "Token", ownedToken.tokenId);
      const before = await getTokenDocument(playerPage, ownedToken.tokenId);
      await invokeHookedSceneTool(playerPage, "tokens", "foundry-paste-eater-paste");
      await expect(playerPage.locator("#foundry-paste-eater-scene-paste-target")).toBeVisible();
      await dispatchFilePaste(playerPage, {
        targetSelector: "#foundry-paste-eater-scene-paste-target",
        filename: "test-token.png",
        mimeType: "image/png",
      });
      await expect.poll(async () => (await getTokenDocument(playerPage, ownedToken.tokenId)).textureSrc).not.toBe(before.textureSrc);
      await expect.poll(async () => (await getTokenDocument(playerPage, ownedToken.tokenId)).textureSrc).toContain(run.uploadFolder);
    }
  } finally {
    await closeOwnedContext(playerContext);
    await restoreCorePermissions(gmPage, previousPermissions);
    await restoreModuleSettings(gmPage, previousSettings || {});
    await cleanupClipboardRun(gmPage, run);
    await closeOwnedContext(gmPage);
  }
});
