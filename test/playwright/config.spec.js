const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  closeUploadDestinationConfig,
  dispatchFilePaste,
  dispatchTextPaste,
  focusCanvas,
  focusChatInput,
  getNewDocuments,
  getSafeCanvasPoint,
  getStateSnapshot,
  getUploadDestinationSummary,
  invokeSceneTool,
  loginToFoundry,
  openUploadDestinationConfig,
  restoreClipboardRead,
  restoreModuleSettings,
  setCanvasMousePosition,
  setModuleSettings,
  stubClipboardRead,
} = require("./helpers/foundry");

test.describe.configure({mode: "serial"});

test.beforeEach(async ({page}) => {
  await loginToFoundry(page, {
    user: process.env.FOUNDRY_GM_USER || process.env.FOUNDRY_USER || "Clipboard QA 1",
    password: process.env.FOUNDRY_GM_PASSWORD ?? process.env.FOUNDRY_PASSWORD ?? "",
  });
});

test.afterEach(async ({page}) => {
  await restoreClipboardRead(page).catch(() => {});
});

async function getTokenActorInfo(page, tokenId) {
  return page.evaluate(id => {
    const token = canvas.scene.tokens.get(id);
    return {
      actorId: token?.actorId || null,
      actorExists: Boolean(token?.actor),
    };
  }, tokenId);
}

test("default empty-canvas target steers new media creation across all configured modes", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "default-empty-canvas-target": "active-layer",
  });

  try {
    await focusCanvas(page);

    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 40));
    await page.evaluate(() => canvas.tokens.activate());
    const beforeActiveLayer = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(beforeActiveLayer.tokens.length + 1);
    const afterActiveLayer = await getStateSnapshot(page);
    expect(afterActiveLayer.tiles.length).toBe(beforeActiveLayer.tiles.length);

    await setModuleSettings(page, {"default-empty-canvas-target": "tile"});
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 41));
    await page.evaluate(() => canvas.tokens.activate());
    const beforeTileOverride = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeTileOverride.tiles.length + 1);
    const afterTileOverride = await getStateSnapshot(page);
    expect(afterTileOverride.tokens.length).toBe(beforeTileOverride.tokens.length);

    await setModuleSettings(page, {"default-empty-canvas-target": "token"});
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 42));
    await page.evaluate(() => canvas.tiles.activate());
    const beforeTokenOverride = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-panorama.svg",
      mimeType: "image/svg+xml",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(beforeTokenOverride.tokens.length + 1);
    const afterTokenOverride = await getStateSnapshot(page);
    expect(afterTokenOverride.tiles.length).toBe(beforeTokenOverride.tiles.length);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("create-backing-actors controls whether new pasted tokens get backing actors", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "default-empty-canvas-target": "token",
    "create-backing-actors": false,
  });

  try {
    await focusCanvas(page);
    await page.evaluate(() => canvas.tokens.activate());

    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 43));
    const beforeActorless = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(beforeActorless.tokens.length + 1);
    const afterActorless = await getStateSnapshot(page);
    const [actorlessToken] = getNewDocuments(beforeActorless, afterActorless, "tokens");
    expect(await getTokenActorInfo(page, actorlessToken.id)).toEqual({
      actorId: null,
      actorExists: false,
    });

    await setModuleSettings(page, {"create-backing-actors": true});
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 44));
    const beforeBacked = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(beforeBacked.tokens.length + 1);
    const afterBacked = await getStateSnapshot(page);
    const [backedToken] = getNewDocuments(beforeBacked, afterBacked, "tokens");
    await expect.poll(() => getTokenActorInfo(page, backedToken.id)).toMatchObject({
      actorExists: true,
    });
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("chat media display modes change the chat preview markup", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-chat-media": true,
    "chat-media-display": "thumbnail",
  });

  try {
    await focusChatInput(page);

    const beforeThumbnail = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: await focusChatInput(page),
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(beforeThumbnail.messages.length + 1);
    const afterThumbnail = await getStateSnapshot(page);
    const [thumbnailMessage] = getNewDocuments(beforeThumbnail, afterThumbnail, "messages");
    expect(thumbnailMessage.content).toContain("clipboard-image-chat-thumbnail");
    expect(thumbnailMessage.content).toContain("<img");

    await setModuleSettings(page, {"chat-media-display": "full-preview"});
    const beforeFull = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: await focusChatInput(page),
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(beforeFull.messages.length + 1);
    const afterFull = await getStateSnapshot(page);
    const [fullPreviewMessage] = getNewDocuments(beforeFull, afterFull, "messages");
    expect(fullPreviewMessage.content).toContain("clipboard-image-chat-full-preview");
    expect(fullPreviewMessage.content).toContain("<img");

    await setModuleSettings(page, {"chat-media-display": "link-only"});
    const beforeLinkOnly = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: await focusChatInput(page),
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(beforeLinkOnly.messages.length + 1);
    const afterLinkOnly = await getStateSnapshot(page);
    const [linkOnlyMessage] = getNewDocuments(beforeLinkOnly, afterLinkOnly, "messages");
    expect(linkOnlyMessage.content).not.toContain("<img");
    expect(linkOnlyMessage.content).not.toContain("<video");
    expect(linkOnlyMessage.content).toContain("Open full media");
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("canvas text paste mode can disable or re-enable note creation", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "canvas-text-paste-mode": "disabled",
  });

  try {
    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 45));

    const beforeDisabled = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: `${run.prefix} disabled note`,
    });
    await page.waitForTimeout(300);
    const afterDisabled = await getStateSnapshot(page);
    expect(afterDisabled.notes.length).toBe(beforeDisabled.notes.length);

    await setModuleSettings(page, {"canvas-text-paste-mode": "scene-notes"});
    const beforeEnabled = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: `${run.prefix} enabled note`,
    });
    await expect.poll(async () => (await getStateSnapshot(page)).notes.length).toBe(beforeEnabled.notes.length + 1);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("scene paste prompt mode controls whether the scene tool reads directly or opens the prompt", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "scene-paste-prompt-mode": "auto",
  });

  try {
    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());
    await stubClipboardRead(page, [
      {filename: "test-token.png", mimeType: "image/png"},
    ]);

    const beforeAuto = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "clipboard-image-paste");
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeAuto.tiles.length + 1);
    await expect(page.locator("#clipboard-image-scene-paste-prompt")).toHaveCount(0);

    await restoreClipboardRead(page);
    await setModuleSettings(page, {"scene-paste-prompt-mode": "always"});
    await stubClipboardRead(page, [
      {filename: "test-token.png", mimeType: "image/png"},
    ]);
    const beforeAlways = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "clipboard-image-paste");
    await expect(page.locator("#clipboard-image-scene-paste-target")).toBeVisible();
    await page.waitForTimeout(300);
    const afterAlways = await getStateSnapshot(page);
    expect(afterAlways.tiles.length).toBe(beforeAlways.tiles.length);
    await page.locator('#clipboard-image-scene-paste-prompt [data-action="cancel"]').click();

    await restoreClipboardRead(page);
    await setModuleSettings(page, {"scene-paste-prompt-mode": "never"});
    await stubClipboardRead(page, [{}]);
    const beforeNever = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "clipboard-image-paste");
    await page.waitForTimeout(300);
    const afterNever = await getStateSnapshot(page);
    expect(afterNever.tiles.length).toBe(beforeNever.tiles.length);
    await expect(page.locator("#clipboard-image-scene-paste-prompt")).toHaveCount(0);
  } finally {
    await restoreClipboardRead(page).catch(() => {});
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("verbose logging controls whether successful workflows emit browser console diagnostics", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo, {verboseLogging: false});
  const previousSettings = await setModuleSettings(page, {
    "verbose-logging": false,
  });
  const messages = [];
  const listener = message => {
    const text = message.text();
    if (text.includes("Clipboard Image [")) messages.push(text);
  };
  page.on("console", listener);

  try {
    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());

    messages.length = 0;
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 46));
    const beforeQuiet = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeQuiet.tiles.length + 1);
    await page.waitForTimeout(300);
    expect(messages).toHaveLength(0);

    messages.length = 0;
    await setModuleSettings(page, {"verbose-logging": true});
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 47));
    const beforeVerbose = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeVerbose.tiles.length + 1);
    await expect.poll(() => messages.length).toBeGreaterThan(0);
  } finally {
    page.off("console", listener);
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("upload destination config saves custom folders and uses them for later uploads", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "image-location-source": "data",
    "image-location": "pasted_images",
    "image-location-bucket": "",
  });
  const customFolder = `${run.uploadFolder}/config-ui`;

  try {
    await openUploadDestinationConfig(page);
    const app = page.locator("#clipboard-image-destination-config");
    await app.locator('select[name="source"]').selectOption("data");
    await app.locator('input[name="target"]').fill(customFolder);
    await expect.poll(() => getUploadDestinationSummary(page)).toContain(customFolder);
    await app.locator('button[name="submit"]').click();
    await expect(app).toHaveCount(0);

    const storedSettings = await page.evaluate(() => ({
      source: game.settings.get("clipboard-image", "image-location-source"),
      target: game.settings.get("clipboard-image", "image-location"),
      bucket: game.settings.get("clipboard-image", "image-location-bucket"),
    }));
    expect(storedSettings).toEqual({
      source: "data",
      target: customFolder,
      bucket: "",
    });

    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 48));
    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");
    expect(tile.textureSrc).toContain(customFolder);
  } finally {
    await closeUploadDestinationConfig(page);
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});
