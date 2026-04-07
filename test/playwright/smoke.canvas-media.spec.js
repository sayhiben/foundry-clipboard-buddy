/* eslint-disable no-unused-vars */
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
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

async function getRenderedTokenInfo(page, tokenId) {
  return page.evaluate(id => {
    const placeable = canvas.tokens.placeables.find(entry => entry.document.id === id);
    const texture = placeable?.texture || placeable?.mesh?.texture || null;
    const baseTexture = texture?.baseTexture || texture?.source || null;
    return {
      src: placeable?.document?.texture?.src || null,
      resourceUrl: baseTexture?.resource?.src || baseTexture?.resource?.url || null,
      textureWidth: texture?.width ?? null,
      textureHeight: texture?.height ?? null,
      baseValid: baseTexture?.valid ?? null,
    };
  }, tokenId);
}

async function getRenderedTileInfo(page, tileId) {
  return page.evaluate(id => {
    const placeable = canvas.tiles.placeables.find(entry => entry.document.id === id);
    const texture = placeable?.texture || placeable?.mesh?.texture || null;
    const baseTexture = texture?.baseTexture || texture?.source || null;
    return {
      src: placeable?.document?.texture?.src || null,
      resourceUrl: baseTexture?.resource?.src || baseTexture?.resource?.url || null,
      textureWidth: texture?.width ?? null,
      textureHeight: texture?.height ?? null,
      baseValid: baseTexture?.valid ?? null,
    };
  }, tileId);
}

function getGeneratedJpegFixturePath() {
  const targetPath = path.join(os.tmpdir(), "foundry-paste-eater-test-token.jpg");
  execFileSync("sips", [
    "-s",
    "format",
    "jpeg",
    getFixturePath("test-token.png"),
    "--out",
    targetPath,
  ], {stdio: "ignore"});
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Failed to generate JPEG fixture at ${targetPath}`);
  }
  return targetPath;
}

test.describe.configure({mode: "serial"});

test.beforeEach(async ({foundryPage: page}) => {
  await resetFoundryUiState(page);
  await setModuleSettings(page, SMOKE_BASELINE_SETTINGS);
});

test.afterEach(async ({foundryPage: page}) => {
  await restoreClipboardRead(page).catch(() => {});
});


test("pastes an image as a tile on the Tiles layer", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 0);
    const dimensions = await getCanvasDimensions(page);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.width).toBeGreaterThan(0);
    expect(tile.height).toBeGreaterThan(0);
    expect(tile.x).toBeGreaterThanOrEqual(0);
    expect(tile.y).toBeGreaterThanOrEqual(0);
    expect(tile.x + tile.width).toBeLessThanOrEqual(dimensions.sceneWidth);
    expect(tile.y + tile.height).toBeLessThanOrEqual(dimensions.sceneHeight);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("uses the intrinsic square SVG size for tile pastes", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 20);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");
    const renderInfo = await page.evaluate(id => {
      const placeable = canvas.tiles.placeables.find(entry => entry.document.id === id);
      const texture = placeable?.texture || placeable?.mesh?.texture || null;
      return {
        objectWidth: placeable?.width ?? null,
        objectHeight: placeable?.height ?? null,
        meshWidth: placeable?.mesh?.width ?? null,
        meshHeight: placeable?.mesh?.height ?? null,
        textureWidth: texture?.baseTexture?.realWidth ?? texture?.baseTexture?.width ?? texture?.width ?? null,
        textureHeight: texture?.baseTexture?.realHeight ?? texture?.baseTexture?.height ?? texture?.height ?? null,
      };
    }, tile.id);

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.width).toBeCloseTo(512, 0);
    expect(tile.height).toBeCloseTo(512, 0);
    expect(Math.abs(tile.width - tile.height)).toBeLessThanOrEqual(1);
    if (renderInfo.meshWidth !== null && renderInfo.meshHeight !== null) {
      expect(renderInfo.meshWidth).toBeCloseTo(512, 0);
      expect(renderInfo.meshHeight).toBeCloseTo(512, 0);
    } else {
      expect(renderInfo.objectWidth).toBeCloseTo(512, 0);
      expect(renderInfo.objectHeight).toBeCloseTo(512, 0);
    }
    if (renderInfo.textureWidth !== null && renderInfo.textureHeight !== null) {
      expect(renderInfo.textureWidth).toBeGreaterThan(0);
      expect(renderInfo.textureHeight).toBeGreaterThan(0);
    }
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates correctly sized tiles when different raster images reuse the same filename", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 0);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    async function pasteGeneratedRaster(width, height, filename) {
      await page.evaluate(async ({width, height, filename}) => {
        const target = document.querySelector(".game");
        if (!target) throw new Error("Could not find the Foundry game root.");

        const canvasElement = document.createElement("canvas");
        canvasElement.width = width;
        canvasElement.height = height;
        const context = canvasElement.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#111111";
        context.fillRect(4, 4, width - 8, height - 8);

        const blob = await new Promise(resolve => canvasElement.toBlob(resolve, "image/png"));
        const file = new File([blob], filename, {type: "image/png"});
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
        Object.defineProperty(event, "clipboardData", {
          configurable: true,
          value: dataTransfer,
        });
        target.dispatchEvent(event);
      }, {width, height, filename});
    }

    const before = await getStateSnapshot(page);
    await pasteGeneratedRaster(1200, 600, "same-name.png");
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const afterLandscape = await getStateSnapshot(page);
    const [landscapeTile] = getNewDocuments(before, afterLandscape, "tiles");

    await pasteGeneratedRaster(200, 400, "same-name.png");
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(afterLandscape.tiles.length + 1);
    const afterPortrait = await getStateSnapshot(page);
    const [portraitTile] = getNewDocuments(afterLandscape, afterPortrait, "tiles");

    expect(landscapeTile.width).toBeGreaterThan(landscapeTile.height);
    expect(portraitTile.height).toBeGreaterThan(portraitTile.width);
    expect(landscapeTile.textureSrc).not.toBe(portraitTile.textureSrc);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes a Finder-copied file through the native macOS paste event", async ({foundryPage: page}, testInfo) => {
  test.skip(process.platform !== "darwin", "Finder clipboard integration is only available on macOS.");
  test.skip(process.env.PW_HEADLESS === "true", "Finder clipboard integration requires a headed macOS browser session.");

  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 0);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    execFileSync("osascript", [
      "-e",
      `set the clipboard to (POSIX file "${getFixturePath("test-token.png")}")`,
    ]);

    const before = await getStateSnapshot(page);
    await pasteNativeClipboardWithRetry(page, {
      prepare: async () => {
        await focusCanvas(page);
      },
      verify: async () => {
        await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
      },
    });
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain("test-token");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes a Finder-copied animated gif as a token through the native macOS paste event", async ({foundryPage: page}, testInfo) => {
  test.skip(process.platform !== "darwin", "Finder clipboard integration is only available on macOS.");
  test.skip(process.env.PW_HEADLESS === "true", "Finder clipboard integration requires a headed macOS browser session.");

  const run = await beginClipboardRun(page, testInfo);
  try {
    await setModuleSettings(page, {"create-backing-actors": false});
    const mouse = await getSafeCanvasPoint(page, 0);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    execFileSync("osascript", [
      "-e",
      `set the clipboard to (POSIX file "${getFixturePath("test-animated.gif")}")`,
    ]);

    const before = await getStateSnapshot(page);
    await pasteNativeClipboardWithRetry(page, {
      prepare: async () => {
        await focusCanvas(page);
      },
      verify: async () => {
        await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
      },
    });
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");
    const renderInfo = await getRenderedTokenInfo(page, token.id);

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.textureSrc).toContain(".png");
    expect(token.actorId).toBeNull();
    expect(renderInfo.src).toContain(".png");
    expect(renderInfo.resourceUrl).toContain(".png");
    expect(renderInfo.resourceUrl).not.toContain("mystery-man");
    expect(renderInfo.textureWidth).toBeGreaterThan(0);
    expect(renderInfo.textureHeight).toBeGreaterThan(0);
    expect(renderInfo.baseValid).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes a Finder-copied jpeg as a tile through the native macOS paste event", async ({foundryPage: page}, testInfo) => {
  test.skip(process.platform !== "darwin", "Finder clipboard integration is only available on macOS.");
  test.skip(process.env.PW_HEADLESS === "true", "Finder clipboard integration requires a headed macOS browser session.");

  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 0);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    execFileSync("osascript", [
      "-e",
      `set the clipboard to (POSIX file "${getGeneratedJpegFixturePath()}")`,
    ]);

    const before = await getStateSnapshot(page);
    await pasteNativeClipboardWithRetry(page, {
      prepare: async () => {
        await focusCanvas(page);
      },
      verify: async () => {
        await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
      },
    });
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    await expect.poll(async () => getRenderedTileInfo(page, tile.id), {
      timeout: 15_000,
    }).toMatchObject({
      baseValid: true,
    });

    const renderInfo = await getRenderedTileInfo(page, tile.id);
    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain(".jpg");
    expect(renderInfo.src).toContain(".jpg");
    expect(renderInfo.resourceUrl).toContain(".jpg");
    expect(renderInfo.resourceUrl).not.toContain("hazard");
    expect(renderInfo.textureWidth).toBeGreaterThan(0);
    expect(renderInfo.textureHeight).toBeGreaterThan(0);
    expect(renderInfo.baseValid).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes an image as a token on the Tokens layer", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 1);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");
    const actorInfo = await page.evaluate(tokenId => {
      const tokenDocument = canvas.scene.tokens.get(tokenId);
      if (!tokenDocument) return null;
      return {
        actorId: tokenDocument.actorId,
        actorExists: Boolean(tokenDocument.actor),
        actorName: tokenDocument.actor?.name || null,
        actorImg: tokenDocument.actor?.img || null,
      };
    }, token.id);

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.name).toBe("test-token");
    expect(token.actorId).toBeTruthy();
    expect(actorInfo).toEqual({
      actorId: token.actorId,
      actorExists: true,
      actorName: "test-token",
      actorImg: expect.stringContaining(run.uploadFolder),
    });
    expect(token.width).toBeGreaterThan(0);
    expect(token.height).toBeGreaterThan(0);

    await page.evaluate(tokenId => {
      const tokenPlaceable = canvas.tokens.placeables.find(placeable => placeable.document.id === tokenId);
      if (!tokenPlaceable) throw new Error(`Could not find token placeable ${tokenId}.`);
      tokenPlaceable.control({releaseOthers: true});
      tokenPlaceable.document.actor.sheet.render(true);
    }, token.id);

    await expect.poll(async () => page.evaluate(actorId => {
      const app = Object.values(ui.windows).find(entry => (entry.document?.id || entry.object?.id) === actorId);
      return app ? {title: app.title || "", actorId} : null;
    }, token.actorId)).toEqual({
      title: "[Token] test-token",
      actorId: token.actorId,
    });

    await page.evaluate(actorId => Promise.all(Object.values(ui.windows)
      .filter(entry => (entry.document?.id || entry.object?.id) === actorId)
      .map(entry => entry.close())), token.actorId);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes an animated gif as a token even when the pasted file has no mime type", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    await setModuleSettings(page, {"create-backing-actors": false});
    const mouse = await getSafeCanvasPoint(page, 1);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-animated.gif",
      mimeType: "",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");
    const renderInfo = await getRenderedTokenInfo(page, token.id);

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.textureSrc).toContain(".png");
    expect(token.name).toBe("test-animated");
    expect(token.actorId).toBeNull();
    expect(renderInfo.src).toContain(".png");
    expect(renderInfo.resourceUrl).toContain(".png");
    expect(renderInfo.resourceUrl).not.toContain("mystery-man");
    expect(renderInfo.baseValid).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes an animated gif as a tile by rasterizing it to a static png texture", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 1);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-animated.gif",
      mimeType: "image/gif",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");
    const renderInfo = await getRenderedTileInfo(page, tile.id);

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain(".png");
    expect(renderInfo.src).toContain(".png");
    expect(renderInfo.resourceUrl).toContain(".png");
    expect(renderInfo.resourceUrl).not.toContain("hazard");
    expect(renderInfo.baseValid).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("normalizes new token sizing for a portrait asset", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 1);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.width).toBe(1);
    expect(token.height).toBe(2);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("scales oversized tile media down to one-third of the scene width", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 2);
    const dimensions = await getCanvasDimensions(page);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-panorama.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.width).toBeCloseTo(dimensions.sceneWidth / 3, 1);
    expect(tile.height).toBeCloseTo(tile.width / 2, 1);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces a selected token image in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 2);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const token = await createToken(page, {
      name: `${run.prefix} Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
      width: 1,
      height: 1,
    });

    await page.evaluate(() => canvas.tokens.activate());
    await controlPlaceable(page, "Token", token.id);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    let updated;
    await expect.poll(async () => {
      updated = await getTokenDocument(page, token.id);
      return updated?.textureSrc || "";
    }).toContain(run.uploadFolder);

    expect(updated.textureSrc).not.toBe(token.textureSrc);
    expect(updated.x).toBe(token.x);
    expect(updated.y).toBe(token.y);
    expect(updated.width).toBe(token.width);
    expect(updated.height).toBe(token.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces a selected tile image in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 3);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const tile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
      width: 140,
      height: 140,
    });

    await page.evaluate(() => canvas.tiles.activate());
    await controlPlaceable(page, "Tile", tile.id);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    let updated;
    await expect.poll(async () => {
      updated = await getTileDocument(page, tile.id);
      return updated?.textureSrc || "";
    }).toContain(run.uploadFolder);

    expect(updated.textureSrc).not.toBe(tile.textureSrc);
    expect(updated.x).toBe(tile.x);
    expect(updated.y).toBe(tile.y);
    expect(updated.width).toBe(tile.width);
    expect(updated.height).toBe(tile.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces multiple selected token images in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const firstMouse = await getSafeCanvasPoint(page, 12);
    const secondMouse = await getSafeCanvasPoint(page, 13);
    await focusCanvas(page);
    await page.evaluate(() => canvas.tokens.activate());

    const firstToken = await createToken(page, {
      name: `${run.prefix} Multi Token 1`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: firstMouse.x,
      y: firstMouse.y,
      width: 1,
      height: 1,
    });
    const secondToken = await createToken(page, {
      name: `${run.prefix} Multi Token 2`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: secondMouse.x,
      y: secondMouse.y,
      width: 2,
      height: 1,
    });

    await controlPlaceables(page, [
      {documentName: "Token", id: firstToken.id},
      {documentName: "Token", id: secondToken.id},
    ]);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => {
      const [updatedFirst, updatedSecond] = await Promise.all([
        getTokenDocument(page, firstToken.id),
        getTokenDocument(page, secondToken.id),
      ]);
      return [
        updatedFirst?.textureSrc || "",
        updatedSecond?.textureSrc || "",
      ];
    }).toEqual([
      expect.stringContaining(run.uploadFolder),
      expect.stringContaining(run.uploadFolder),
    ]);

    const [updatedFirst, updatedSecond] = await Promise.all([
      getTokenDocument(page, firstToken.id),
      getTokenDocument(page, secondToken.id),
    ]);

    expect(updatedFirst.x).toBe(firstToken.x);
    expect(updatedFirst.y).toBe(firstToken.y);
    expect(updatedFirst.width).toBe(firstToken.width);
    expect(updatedFirst.height).toBe(firstToken.height);
    expect(updatedSecond.x).toBe(secondToken.x);
    expect(updatedSecond.y).toBe(secondToken.y);
    expect(updatedSecond.width).toBe(secondToken.width);
    expect(updatedSecond.height).toBe(secondToken.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces multiple selected tile images in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const firstMouse = await getSafeCanvasPoint(page, 14);
    const secondMouse = await getSafeCanvasPoint(page, 15);
    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());

    const firstTile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: firstMouse.x,
      y: firstMouse.y,
      width: 120,
      height: 120,
    });
    const secondTile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: secondMouse.x,
      y: secondMouse.y,
      width: 180,
      height: 90,
    });

    await controlPlaceables(page, [
      {documentName: "Tile", id: firstTile.id},
      {documentName: "Tile", id: secondTile.id},
    ]);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => {
      const [updatedFirst, updatedSecond] = await Promise.all([
        getTileDocument(page, firstTile.id),
        getTileDocument(page, secondTile.id),
      ]);
      return [
        updatedFirst?.textureSrc || "",
        updatedSecond?.textureSrc || "",
      ];
    }).toEqual([
      expect.stringContaining(run.uploadFolder),
      expect.stringContaining(run.uploadFolder),
    ]);

    const [updatedFirst, updatedSecond] = await Promise.all([
      getTileDocument(page, firstTile.id),
      getTileDocument(page, secondTile.id),
    ]);

    expect(updatedFirst.x).toBe(firstTile.x);
    expect(updatedFirst.y).toBe(firstTile.y);
    expect(updatedFirst.width).toBe(firstTile.width);
    expect(updatedFirst.height).toBe(firstTile.height);
    expect(updatedSecond.x).toBe(secondTile.x);
    expect(updatedSecond.y).toBe(secondTile.y);
    expect(updatedSecond.width).toBe(secondTile.width);
    expect(updatedSecond.height).toBe(secondTile.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates a video tile with autoplay, loop, and muted volume", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 16);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain(".webm");
    expect(tile.video).toMatchObject({
      autoplay: true,
      loop: true,
      volume: 0,
    });
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates a video token on the Tokens layer", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 17);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");
    const actorInfo = await getTokenActorInfo(page, token.id);

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.textureSrc).toContain(".webm");
    expect(token.actorId).toBeTruthy();
    expect(actorInfo).toEqual({
      actorId: token.actorId,
      actorExists: true,
      actorName: "test-video",
      actorImg: "icons/svg/mystery-man.svg",
    });
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces a selected tile with video media in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 18);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const tile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
      width: 160,
      height: 110,
    });

    await page.evaluate(() => canvas.tiles.activate());
    await controlPlaceable(page, "Tile", tile.id);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    let updated;
    await expect.poll(async () => {
      updated = await getTileDocument(page, tile.id);
      return updated?.textureSrc || "";
    }).toContain(run.uploadFolder);

    expect(updated.textureSrc).toContain(".webm");
    expect(updated.x).toBe(tile.x);
    expect(updated.y).toBe(tile.y);
    expect(updated.width).toBe(tile.width);
    expect(updated.height).toBe(tile.height);
    expect(updated.video).toMatchObject({
      autoplay: true,
      loop: true,
      volume: 0,
    });
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces a selected note icon in place", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 22);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const seededNote = await page.evaluate(async ({x, y, textureSrc, name}) => {
      const entry = await foundry.documents.JournalEntry.create({
        name,
        pages: [{
          name: "Notes",
          type: "text",
          text: {
            content: "<p>Seed</p>",
            format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
          },
        }],
      });
      const page = entry.pages.contents[0];
      const [note] = await canvas.scene.createEmbeddedDocuments("Note", [{
        entryId: entry.id,
        pageId: page.id,
        text: name,
        x,
        y,
        texture: {src: textureSrc},
      }]);
      return {
        id: note.id,
        entryId: entry.id,
        pageId: page.id,
      };
    }, {
      x: mouse.x,
      y: mouse.y,
      textureSrc: getFixtureUrl("test-token.png"),
      name: `${run.prefix} Scene Note`,
    });

    await page.evaluate(() => canvas.notes.activate());
    await controlPlaceable(page, "Note", seededNote.id);
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(async () => (await getNoteDocument(page, seededNote.id))?.textureSrc || "").toContain(run.uploadFolder);
    const after = await getStateSnapshot(page);
    const updatedNote = await getNoteDocument(page, seededNote.id);

    expect(updatedNote.textureSrc).toContain(run.uploadFolder);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});
