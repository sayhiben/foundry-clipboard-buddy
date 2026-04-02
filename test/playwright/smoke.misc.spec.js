/* eslint-disable no-unused-vars */
const http = require("http");
const {execFileSync} = require("child_process");
const {test: base, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  buildSharedFoundryTest,
  clearActiveLayerClipboardObjects,
  clearCanvasMousePosition,
  cleanupClipboardRun,
  closeUploadDestinationConfig,
  controlPlaceable,
  controlPlaceables,
  createActorBackedToken,
  createTile,
  createToken,
  dispatchClipboardModeKeydown,
  dispatchFileDrop,
  dispatchFilePaste,
  dispatchMixedPaste,
  dispatchTextPaste,
  focusCanvas,
  focusChatInput,
  getCanvasDimensions,
  getFixturePath,
  getFixtureUrl,
  getJournalEntry,
  getNewDocuments,
  getNoteDocument,
  getSafeCanvasPoint,
  getStateSnapshot,
  getUploadDestinationSummary,
  getTileDocument,
  getTokenDocument,
  invokeSceneTool,
  openUploadDestinationConfig,
  releaseAllControlledPlaceables,
  resetFoundryUiState,
  restoreClipboardRead,
  restoreModuleSettings,
  setModuleSettings,
  setActiveLayerClipboardObjects,
  setCanvasMousePosition,
  stubClipboardRead,
} = require("./helpers/foundry");

const GM_CREDENTIALS = {
  user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
  password: process.env.FOUNDRY_GM_PASSWORD ?? "",
};

const SMOKE_BASELINE_SETTINGS = {
  "default-empty-canvas-target": "active-layer",
  "create-backing-actors": true,
  "canvas-text-paste-mode": "scene-notes",
  "selected-token-paste-mode": "scene-only",
  "upload-path-organization": "flat",
};

const test = buildSharedFoundryTest(base, GM_CREDENTIALS, {acceptDownloads: true});

async function startBlockedMediaServer() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#111111"/>
  <circle cx="32" cy="32" r="18" fill="#ffffff"/>
</svg>`;

  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.url !== "/blocked.svg") {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.end("missing");
        return;
      }

      response.writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      });
      response.end(body);
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        url: `http://127.0.0.1:${address.port}/blocked.svg`,
        close: () => new Promise(closeResolve => server.close(closeResolve)),
      });
    });
  });
}

async function captureClipboardErrors(page) {
  await page.evaluate(() => {
    window.__clipboardErrorMessages = [];
    if (ui.notifications.__clipboardErrorWrapped) return;

    const originalError = ui.notifications.error.bind(ui.notifications);
    ui.notifications.error = message => {
      window.__clipboardErrorMessages.push(String(message || ""));
      return originalError(message);
    };
    ui.notifications.__clipboardErrorWrapped = true;
  });
}

async function getClipboardErrors(page) {
  return page.evaluate(() => window.__clipboardErrorMessages || []);
}

async function rerenderChat(page) {
  await page.evaluate(() => {
    ui.chat?.render?.(true);
  });
  await focusChatInput(page);
}

async function pasteNativeClipboardWithRetry(page, {prepare, verify, attempts = 3} = {}) {
  const pasteShortcut = process.platform === "darwin" ? "Meta+V" : "Control+V";
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (prepare) await prepare();
    await page.bringToFront();
    await expect.poll(() => page.evaluate(() => document.hasFocus()), {
      timeout: 5_000,
      message: "Expected the browser page to be focused before sending the native paste shortcut.",
    }).toBe(true);
    await page.waitForTimeout(150);
    await page.keyboard.press(pasteShortcut);

    try {
      if (verify) await verify();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
      await page.waitForTimeout(250);
    }
  }

  throw lastError ?? new Error("Native clipboard paste did not complete successfully.");
}

async function getPlaceableTextNoteFlag(page, documentName, id) {
  return page.evaluate(({documentName, id}) => {
    const collection = documentName === "Token" ? canvas.scene.tokens : canvas.scene.tiles;
    return collection.get(id)?.getFlag("foundry-paste-eater", "textNote") || null;
  }, {documentName, id});
}

async function getTokenActorInfo(page, tokenId) {
  return page.evaluate(id => {
    const tokenDocument = canvas.scene.tokens.get(id);
    if (!tokenDocument) return null;
    return {
      actorId: tokenDocument.actorId,
      actorExists: Boolean(tokenDocument.actor),
      actorName: tokenDocument.actor?.name || null,
      actorImg: tokenDocument.actor?.img || null,
    };
  }, tokenId);
}

test.describe.configure({mode: "serial"});

test.beforeEach(async ({foundryPage: page}) => {
  await resetFoundryUiState(page);
  await setModuleSettings(page, SMOKE_BASELINE_SETTINGS);
});

test.afterEach(async ({foundryPage: page}) => {
  await restoreClipboardRead(page).catch(() => {});
});


test("prefers media files over accompanying text in a mixed paste payload", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 3);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchMixedPaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
      text: `${run.prefix} ignored text payload`,
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.journals.length).toBe(before.journals.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates hidden tiles when Caps Lock paste mode is active", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 7);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => {
      canvas.tiles.activate();
    });
    await releaseAllControlledPlaceables(page);
    await dispatchClipboardModeKeydown(page, {
      code: "F13",
      metaKey: true,
      capsLock: true,
    });

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");
    expect(tile.hidden).toBe(true);
  } finally {
    await dispatchClipboardModeKeydown(page, {
      code: "F13",
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      capsLock: false,
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("blocks normal canvas paste when Foundry copied objects are present", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 9);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());
    await setActiveLayerClipboardObjects(page, "Tile", 1);

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await page.waitForTimeout(300);
    const after = await getStateSnapshot(page);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
  } finally {
    await clearActiveLayerClipboardObjects(page, "Tile");
    await cleanupClipboardRun(page, run);
  }
});

test("scene prompt upload still works when copied objects are present and falls back to canvas center", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
    "scene-paste-prompt-mode": "auto",
  });
  try {
    const dimensions = await getCanvasDimensions(page);
    await clearCanvasMousePosition(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setActiveLayerClipboardObjects(page, "Tile", 1);
    const before = await getStateSnapshot(page);

    const chooserPromise = page.waitForEvent("filechooser");
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");
    await page.locator('#foundry-paste-eater-scene-paste-prompt [data-action="upload"]').click();
    const chooser = await chooserPromise;
    await chooser.setFiles(getFixturePath("test-token.png"));

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.x).toBeCloseTo(dimensions.width / 2, 0);
    expect(tile.y).toBeCloseTo(dimensions.height / 2, 0);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await clearActiveLayerClipboardObjects(page, "Tile");
    await cleanupClipboardRun(page, run);
  }
});

test("scene paste reads later async clipboard items, ignores copied objects, and falls back to canvas center", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
    "scene-paste-prompt-mode": "auto",
  });
  try {
    const dimensions = await getCanvasDimensions(page);
    await clearCanvasMousePosition(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setActiveLayerClipboardObjects(page, "Tile", 1);
    await stubClipboardRead(page, [
      {text: `${run.prefix} ignored clipboard text`},
      {filename: "test-token.png", mimeType: "image/png"},
    ]);

    const before = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.x).toBeCloseTo(dimensions.width / 2, 0);
    expect(tile.y).toBeCloseTo(dimensions.height / 2, 0);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.journals.length).toBe(before.journals.length);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await clearActiveLayerClipboardObjects(page, "Tile");
    await restoreClipboardRead(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("scene paste button falls back to a manual paste prompt when direct reads cannot access media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
    "scene-paste-prompt-mode": "auto",
  });
  try {
    await clearCanvasMousePosition(page);
    await page.evaluate(() => canvas.tiles.activate());
    await stubClipboardRead(page, [{}]);

    const before = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");

    await expect(page.locator("#foundry-paste-eater-scene-paste-target")).toBeVisible();
    await dispatchFilePaste(page, {
      targetSelector: "#foundry-paste-eater-scene-paste-target",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    await expect(page.locator("#foundry-paste-eater-scene-paste-prompt")).toHaveCount(0);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await restoreClipboardRead(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("scene paste button supports Finder-copied files on macOS via the prompt fallback", async ({foundryPage: page}, testInfo) => {
  test.skip(process.platform !== "darwin", "Finder clipboard integration is only available on macOS.");
  test.skip(process.env.PW_HEADLESS === "true", "Finder clipboard integration requires a headed macOS browser session.");

  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
    "scene-paste-prompt-mode": "auto",
  });
  try {
    await clearCanvasMousePosition(page);
    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());
    execFileSync("osascript", [
      "-e",
      `set the clipboard to (POSIX file "${getFixturePath("test-token.png")}")`,
    ]);

    const before = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");
    await expect(page.locator("#foundry-paste-eater-scene-paste-target")).toBeVisible();
    await pasteNativeClipboardWithRetry(page, {
      prepare: async () => {
        await page.locator("#foundry-paste-eater-scene-paste-target").focus();
      },
      verify: async () => {
        await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
      },
    });
    await expect(page.locator("#foundry-paste-eater-scene-paste-prompt")).toHaveCount(0);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("shows the configured S3 endpoint in the upload destination config and hides it for non-s3 sources", async ({foundryPage: page}) => {
  const previousSettings = await setModuleSettings(page, {
    "image-location-source": "s3",
    "image-location": "worlds/foundry-paste-eater-v13-test/pasted_images",
    "image-location-bucket": "foundry-store",
  });

  try {
    const expectedEndpoint = await page.evaluate(() => {
      const endpoint = game.data.files?.s3?.endpoint;
      if (!endpoint) return "";
      if (typeof endpoint === "string") return endpoint;
      return endpoint.href || endpoint.url || `${endpoint}`;
    });

    await openUploadDestinationConfig(page);
    const app = page.locator("#foundry-paste-eater-destination-config");
    const sourceSelect = app.locator('select[name="source"]');
    const bucketGroup = app.locator(".foundry-paste-eater-s3-bucket");
    const endpointGroup = app.locator(".foundry-paste-eater-s3-endpoint");
    const endpointField = app.locator('[data-role="s3-endpoint"]');

    await expect(bucketGroup).toBeVisible();
    await expect(endpointGroup).toBeVisible();
    await expect(endpointField).toHaveValue(expectedEndpoint);
    await expect.poll(() => getUploadDestinationSummary(page)).toContain("S3-Compatible Storage / foundry-store");

    await sourceSelect.selectOption("data");
    await expect(bucketGroup).toBeHidden();
    await expect(endpointGroup).toBeHidden();
    await expect.poll(() => getUploadDestinationSummary(page)).toContain("User Data");

    await sourceSelect.selectOption("auto");
    await expect.poll(() => getUploadDestinationSummary(page)).toContain("Automatic");
  } finally {
    await closeUploadDestinationConfig(page);
    await restoreModuleSettings(page, previousSettings);
  }
});

test("fails cleanly when S3-compatible storage is selected without a bucket", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo, {
    source: "s3",
    bucket: "",
  });

  try {
    await captureClipboardErrors(page);
    const mouse = await getSafeCanvasPoint(page, 0);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getClipboardErrors(page)).length, {
      timeout: 10_000,
    }).toBeGreaterThan(0);

    const after = await getStateSnapshot(page);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect((await getClipboardErrors(page)).some(message => message.toLowerCase().includes("bucket"))).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("feature toggles disable canvas create and replace flows without rerouting", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-token-creation": false,
    "enable-tile-creation": false,
    "enable-token-replacement": false,
    "enable-tile-replacement": false,
  });

  try {
    const tokenPosition = await getSafeCanvasPoint(page, 0);
    const tilePosition = await getSafeCanvasPoint(page, 1);
    const token = await createToken(page, {
      name: `${run.prefix} Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: tokenPosition.x,
      y: tokenPosition.y,
    });
    const tile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: tilePosition.x,
      y: tilePosition.y,
      width: 160,
      height: 160,
    });

    await focusCanvas(page);
    await page.evaluate(() => canvas.tokens.activate());
    const beforeTokenCreate = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await page.waitForTimeout(300);
    const afterTokenCreate = await getStateSnapshot(page);
    expect(afterTokenCreate.tokens.length).toBe(beforeTokenCreate.tokens.length);

    await page.evaluate(() => canvas.tiles.activate());
    const beforeTileCreate = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await page.waitForTimeout(300);
    const afterTileCreate = await getStateSnapshot(page);
    expect(afterTileCreate.tiles.length).toBe(beforeTileCreate.tiles.length);

    await page.evaluate(() => canvas.tokens.activate());
    await controlPlaceable(page, "Token", token.id);
    const beforeToken = await getTokenDocument(page, token.id);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-panorama.svg",
      mimeType: "image/svg+xml",
    });
    await page.waitForTimeout(300);
    expect(await getTokenDocument(page, token.id)).toEqual(beforeToken);

    await page.evaluate(() => canvas.tiles.activate());
    await controlPlaceable(page, "Tile", tile.id);
    const beforeTile = await getTileDocument(page, tile.id);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });
    await page.waitForTimeout(300);
    expect(await getTileDocument(page, tile.id)).toEqual(beforeTile);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});
