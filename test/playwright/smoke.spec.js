const http = require("http");
const {execFileSync} = require("child_process");
const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  clearActiveLayerClipboardObjects,
  clearCanvasMousePosition,
  cleanupClipboardRun,
  closeUploadDestinationConfig,
  controlPlaceable,
  controlPlaceables,
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
  loginToFoundry,
  openUploadDestinationConfig,
  releaseAllControlledPlaceables,
  restoreClipboardRead,
  restoreModuleSettings,
  setModuleSettings,
  setActiveLayerClipboardObjects,
  setCanvasMousePosition,
  stubClipboardRead,
} = require("./helpers/foundry");

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

test.beforeEach(async ({page}) => {
  await loginToFoundry(page);
});

test.afterEach(async ({page}) => {
  await restoreClipboardRead(page).catch(() => {});
});

test("pastes an image as a tile on the Tiles layer", async ({page}, testInfo) => {
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

test("uses the intrinsic square SVG size for tile pastes", async ({page}, testInfo) => {
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

test("creates correctly sized tiles when different raster images reuse the same filename", async ({page}, testInfo) => {
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

test("pastes a Finder-copied file through the native macOS paste event", async ({page}, testInfo) => {
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
    await page.bringToFront();
    await page.keyboard.press("Meta+V");

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain("test-token");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("pastes an image as a token on the Tokens layer", async ({page}, testInfo) => {
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

test("normalizes new token sizing for a portrait asset", async ({page}, testInfo) => {
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

test("scales oversized tile media down to one-third of the scene width", async ({page}, testInfo) => {
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

test("replaces a selected token image in place", async ({page}, testInfo) => {
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

    await expect.poll(async () => (await getTokenDocument(page, token.id)).textureSrc).toContain(run.uploadFolder);
    const updated = await getTokenDocument(page, token.id);

    expect(updated.textureSrc).not.toBe(token.textureSrc);
    expect(updated.x).toBe(token.x);
    expect(updated.y).toBe(token.y);
    expect(updated.width).toBe(token.width);
    expect(updated.height).toBe(token.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces a selected tile image in place", async ({page}, testInfo) => {
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

    await expect.poll(async () => (await getTileDocument(page, tile.id)).textureSrc).toContain(run.uploadFolder);
    const updated = await getTileDocument(page, tile.id);

    expect(updated.textureSrc).not.toBe(tile.textureSrc);
    expect(updated.x).toBe(tile.x);
    expect(updated.y).toBe(tile.y);
    expect(updated.width).toBe(tile.width);
    expect(updated.height).toBe(tile.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("replaces multiple selected token images in place", async ({page}, testInfo) => {
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

test("replaces multiple selected tile images in place", async ({page}, testInfo) => {
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

test("creates a video tile with autoplay, loop, and muted volume", async ({page}, testInfo) => {
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

test("creates a video token on the Tokens layer", async ({page}, testInfo) => {
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

test("replaces a selected tile with video media in place", async ({page}, testInfo) => {
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

    await expect.poll(async () => (await getTileDocument(page, tile.id)).textureSrc).toContain(run.uploadFolder);
    const updated = await getTileDocument(page, tile.id);

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

test("prefers media files over accompanying text in a mixed paste payload", async ({page}, testInfo) => {
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

test("creates a standalone note when plain text is pasted on open canvas", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const text = `${run.prefix} standalone note`;
    const mouse = await getSafeCanvasPoint(page, 4);
    const dimensions = await getCanvasDimensions(page);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => {
      canvas.tiles.activate();
      canvas.tokens.releaseAll();
      canvas.tiles.releaseAll();
    });

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text,
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).notes.length).toBe(before.notes.length + 1);
    await expect.poll(async () => (await getStateSnapshot(page)).journals.length).toBe(before.journals.length + 1);

    const after = await getStateSnapshot(page);
    const [note] = getNewDocuments(before, after, "notes");
    const [journal] = getNewDocuments(before, after, "journals");

    expect(note.text.length).toBeGreaterThan(0);
    expect(note.x).toBeGreaterThanOrEqual(0);
    expect(note.y).toBeGreaterThanOrEqual(0);
    expect(note.x).toBeLessThanOrEqual(dimensions.sceneWidth);
    expect(note.y).toBeLessThanOrEqual(dimensions.sceneHeight);
    expect(journal.name).toContain("Pasted Note:");
    expect(note.entryId).toBe(journal.id);
    expect(note.pageId).toBe(journal.pages[0].id);
    expect(journal.pages[0].content).toContain(text);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates a standalone note when a non-media URL is pasted on canvas", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const url = `https://example.com/${run.runId}`;
    const mouse = await getSafeCanvasPoint(page, 5);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => {
      canvas.tiles.activate();
      canvas.tokens.releaseAll();
      canvas.tiles.releaseAll();
    });

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: url,
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).notes.length).toBe(before.notes.length + 1);
    await expect.poll(async () => (await getStateSnapshot(page)).journals.length).toBe(before.journals.length + 1);
    const after = await getStateSnapshot(page);
    const [journal] = getNewDocuments(before, after, "journals");

    expect(after.tiles.length).toBe(before.tiles.length);
    expect(journal.pages[0].content).toContain(url);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("extracts a media URL from pasted HTML and creates a tile", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 6);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: null,
      html: `<figure><img src="${getFixtureUrl("test-token.png")}" alt="${run.prefix} html media" /></figure>`,
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

test("appends plain text to the same linked note for a selected token", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 5);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const token = await createToken(page, {
      name: `${run.prefix} Note Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
      width: 1,
      height: 1,
    });

    await page.evaluate(() => canvas.tokens.activate());
    await controlPlaceable(page, "Token", token.id);

    const firstText = `${run.prefix} first text block`;
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: firstText,
      mimeType: "text/plain",
    });

    await expect.poll(async () => {
      const tokenState = await getTokenDocument(page, token.id);
      return tokenState?.flags?.["foundry-paste-eater"]?.textNote || null;
    }).not.toBeNull();
    const firstNoteData = await page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("foundry-paste-eater", "textNote"), token.id);
    const firstJournal = await getJournalEntry(page, firstNoteData.entryId);

    const secondText = `${run.prefix} second text block`;
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: secondText,
      mimeType: "text/plain",
    });

    await expect.poll(() => page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("foundry-paste-eater", "textNote") || null, token.id)).not.toBeNull();
    const secondNoteData = await page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("foundry-paste-eater", "textNote"), token.id);
    expect(secondNoteData.noteId).toBe(firstNoteData.noteId);
    expect(secondNoteData.entryId).toBe(firstNoteData.entryId);
    expect(secondNoteData.pageId).toBe(firstNoteData.pageId);

    const updatedJournal = await getJournalEntry(page, firstJournal.id);
    expect(updatedJournal.pages[0].content).toContain(firstText);
    expect(updatedJournal.pages[0].content).toContain(secondText);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates a linked note for a selected tile", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 19);
    const text = `${run.prefix} tile note text`;
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const tile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
      width: 140,
      height: 100,
    });

    await page.evaluate(() => canvas.tiles.activate());
    await controlPlaceable(page, "Tile", tile.id);

    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text,
      mimeType: "text/plain",
    });

    await expect.poll(async () => getPlaceableTextNoteFlag(page, "Tile", tile.id)).not.toBeNull();
    const noteData = await getPlaceableTextNoteFlag(page, "Tile", tile.id);
    const [journal, note] = await Promise.all([
      getJournalEntry(page, noteData.entryId),
      getNoteDocument(page, noteData.noteId),
    ]);

    expect(note.entryId).toBe(journal.id);
    expect(note.pageId).toBe(journal.pages[0].id);
    expect(journal.pages[0].content).toContain(text);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("applies pasted text to multiple selected tokens on the active layer", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const firstMouse = await getSafeCanvasPoint(page, 20);
    const secondMouse = await getSafeCanvasPoint(page, 21);
    const text = `${run.prefix} multi token text`;
    await focusCanvas(page);
    await page.evaluate(() => canvas.tokens.activate());

    const firstToken = await createToken(page, {
      name: `${run.prefix} Text Token 1`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: firstMouse.x,
      y: firstMouse.y,
      width: 1,
      height: 1,
    });
    const secondToken = await createToken(page, {
      name: `${run.prefix} Text Token 2`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: secondMouse.x,
      y: secondMouse.y,
      width: 1,
      height: 1,
    });

    const before = await getStateSnapshot(page);
    await controlPlaceables(page, [
      {documentName: "Token", id: firstToken.id},
      {documentName: "Token", id: secondToken.id},
    ]);

    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text,
      mimeType: "text/plain",
    });

    await expect.poll(async () => {
      const [firstNote, secondNote] = await Promise.all([
        getPlaceableTextNoteFlag(page, "Token", firstToken.id),
        getPlaceableTextNoteFlag(page, "Token", secondToken.id),
      ]);
      return [Boolean(firstNote?.entryId), Boolean(secondNote?.entryId)];
    }).toEqual([true, true]);

    const after = await getStateSnapshot(page);
    const [firstNoteData, secondNoteData] = await Promise.all([
      getPlaceableTextNoteFlag(page, "Token", firstToken.id),
      getPlaceableTextNoteFlag(page, "Token", secondToken.id),
    ]);
    const [firstJournal, secondJournal] = await Promise.all([
      getJournalEntry(page, firstNoteData.entryId),
      getJournalEntry(page, secondNoteData.entryId),
    ]);

    expect(after.notes.length).toBe(before.notes.length + 2);
    expect(after.journals.length).toBe(before.journals.length + 2);
    expect(firstNoteData.noteId).not.toBe(secondNoteData.noteId);
    expect(firstJournal.pages[0].content).toContain(text);
    expect(secondJournal.pages[0].content).toContain(text);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("preserves paragraph and line breaks when HTML is pasted into a note", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 7);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => {
      canvas.tiles.activate();
      canvas.tokens.releaseAll();
      canvas.tiles.releaseAll();
    });

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: null,
      html: `<p>${run.prefix} Alpha<br>Beta</p><p>Gamma</p>`,
    });

    await expect.poll(async () => (await getStateSnapshot(page)).notes.length).toBe(before.notes.length + 1);
    const after = await getStateSnapshot(page);
    const [journal] = getNewDocuments(before, after, "journals");

    expect(journal.pages[0].content).toContain(`${run.prefix} Alpha`);
    expect(journal.pages[0].content).toContain("Beta</p>");
    expect(journal.pages[0].content).toContain("<p>Gamma</p>");
    expect(journal.pages[0].content).not.toContain("<p><br");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates hidden tiles when Caps Lock paste mode is active", async ({page}, testInfo) => {
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

test("posts chat media on image paste without creating canvas content", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: chatSelector,
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain("foundry-paste-eater-chat-message");
    expect(message.content).toContain("Open full media");
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("posts chat media on video paste without creating canvas content", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: chatSelector,
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain("foundry-paste-eater-chat-message");
    expect(message.content).toContain("<video");
    expect(message.content).toContain("Open full media");
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("accepts dropped chat media without creating canvas content", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);

    await dispatchFileDrop(page, {
      targetSelector: chatSelector,
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain("foundry-paste-eater-chat-message");
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates media from text/uri-list paste on the canvas", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 8);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: `# comment line\n${getFixtureUrl("test-token.png")}`,
      mimeType: "text/uri-list",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("leaves a non-media URL as plain chat text", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);
    const url = "https://example.com/not-media";

    await dispatchTextPaste(page, {
      targetSelector: chatSelector,
      text: url,
      mimeType: "text/plain",
    });

    await expect.poll(async () => page.locator(chatSelector).inputValue()).toContain(url);

    const after = await getStateSnapshot(page);
    expect(after.messages.length).toBe(before.messages.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("leaves plain text as normal chat input", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);
    const text = `${run.prefix} plain chat text`;

    const defaultPrevented = await page.evaluate(({targetSelector, text}) => {
      const target = document.querySelector(targetSelector);
      if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", text);

      const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: dataTransfer,
      });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    }, {
      targetSelector: chatSelector,
      text,
    });

    const after = await getStateSnapshot(page);
    expect(defaultPrevented).toBe(false);
    expect(after.messages.length).toBe(before.messages.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("blocks normal canvas paste when Foundry copied objects are present", async ({page}, testInfo) => {
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

test("downloads a direct media URL and creates a tile", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 6);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: getFixtureUrl("test-token.png"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).not.toContain("/modules/foundry-paste-eater/test/assets/test-token.png");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("downloads a direct media URL and creates a token", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 22);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: getFixtureUrl("test-token.png"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(before.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(before, after, "tokens");
    const actorInfo = await getTokenActorInfo(page, token.id);

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.textureSrc).not.toContain("/modules/foundry-paste-eater/test/assets/test-token.png");
    expect(token.actorId).toBeTruthy();
    expect(actorInfo.actorExists).toBe(true);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("downloads a direct media URL and replaces a selected token in place", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 23);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const token = await createToken(page, {
      name: `${run.prefix} URL Token`,
      textureSrc: getFixtureUrl("test-token.svg"),
      x: mouse.x,
      y: mouse.y,
      width: 2,
      height: 1,
    });

    await page.evaluate(() => canvas.tokens.activate());
    await controlPlaceable(page, "Token", token.id);

    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: getFixtureUrl("test-token.png"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getTokenDocument(page, token.id)).textureSrc).toContain(run.uploadFolder);
    const updated = await getTokenDocument(page, token.id);

    expect(updated.textureSrc).not.toBe(token.textureSrc);
    expect(updated.textureSrc).not.toContain("/modules/foundry-paste-eater/test/assets/test-token.png");
    expect(updated.x).toBe(token.x);
    expect(updated.y).toBe(token.y);
    expect(updated.width).toBe(token.width);
    expect(updated.height).toBe(token.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("downloads a direct media URL and replaces a selected tile in place", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 24);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const tile = await createTile(page, {
      textureSrc: getFixtureUrl("test-token.svg"),
      x: mouse.x,
      y: mouse.y,
      width: 170,
      height: 130,
    });

    await page.evaluate(() => canvas.tiles.activate());
    await controlPlaceable(page, "Tile", tile.id);

    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: getFixtureUrl("test-token.png"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getTileDocument(page, tile.id)).textureSrc).toContain(run.uploadFolder);
    const updated = await getTileDocument(page, tile.id);

    expect(updated.textureSrc).not.toBe(tile.textureSrc);
    expect(updated.textureSrc).not.toContain("/modules/foundry-paste-eater/test/assets/test-token.png");
    expect(updated.x).toBe(tile.x);
    expect(updated.y).toBe(tile.y);
    expect(updated.width).toBe(tile.width);
    expect(updated.height).toBe(tile.height);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("does not create broken canvas content when a direct media url download is blocked", async ({page}, testInfo) => {
  const blockedServer = await startBlockedMediaServer();
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 10);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());
    await captureClipboardErrors(page);

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: blockedServer.url,
      mimeType: "text/plain",
    });

    await page.waitForTimeout(400);
    const after = await getStateSnapshot(page);
    const errors = await getClipboardErrors(page);

    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.messages.length).toBe(before.messages.length);
    expect(errors.at(-1)).toContain("cannot download and re-upload");
  } finally {
    await blockedServer.close();
    await cleanupClipboardRun(page, run);
  }
});

test("leaves the original url text in chat when a direct media url download is blocked", async ({page}, testInfo) => {
  const blockedServer = await startBlockedMediaServer();
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);

    await dispatchTextPaste(page, {
      targetSelector: chatSelector,
      text: blockedServer.url,
      mimeType: "text/plain",
    });

    await expect.poll(async () => page.locator(chatSelector).inputValue()).toBe(blockedServer.url);

    const after = await getStateSnapshot(page);
    expect(after.messages.length).toBe(before.messages.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await blockedServer.close();
    await cleanupClipboardRun(page, run);
  }
});

test("scene prompt upload still works when copied objects are present and falls back to canvas center", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
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

test("scene paste reads later async clipboard items, ignores copied objects, and falls back to canvas center", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
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
    await page.evaluate(() => {
      ui.controls.initialize({control: "tiles"});
      ui.controls.render(true);
    });
    await page.evaluate(() => {
      const button = document.querySelector('[data-tool="foundry-paste-eater-paste"]');
      if (!button) throw new Error("Could not find the scene Paste Media button.");
      button.click();
    });

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

test("scene paste button falls back to a manual paste prompt when direct reads cannot access media", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
  });
  try {
    await clearCanvasMousePosition(page);
    await page.evaluate(() => canvas.tiles.activate());
    await stubClipboardRead(page, [{}]);

    const before = await getStateSnapshot(page);
    await page.evaluate(() => {
      const button = document.querySelector('[data-tool="foundry-paste-eater-paste"]');
      if (!button) throw new Error("Could not find the scene Paste Media button.");
      button.click();
    });

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

test("scene paste button supports Finder-copied files on macOS via the prompt fallback", async ({page}, testInfo) => {
  test.skip(process.platform !== "darwin", "Finder clipboard integration is only available on macOS.");
  test.skip(process.env.PW_HEADLESS === "true", "Finder clipboard integration requires a headed macOS browser session.");

  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-scene-paste-tool": true,
    "enable-scene-upload-tool": true,
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
    await page.evaluate(() => {
      const button = document.querySelector('[data-tool="foundry-paste-eater-paste"]');
      if (!button) throw new Error("Could not find the scene Paste Media button.");
      button.click();
    });
    await expect(page.locator("#foundry-paste-eater-scene-paste-target")).toBeVisible();
    await page.keyboard.press("Meta+V");

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    await expect(page.locator("#foundry-paste-eater-scene-paste-prompt")).toHaveCount(0);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("uses the chat upload button to post media", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    await focusChatInput(page);
    const before = await getStateSnapshot(page);

    const chooserPromise = page.waitForEvent("filechooser");
    await page.locator(".foundry-paste-eater-chat-upload").click();
    const chooser = await chooserPromise;
    await chooser.setFiles(getFixturePath("test-token.png"));

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain("foundry-paste-eater-chat-message");
    expect(message.content).toContain("Open full media");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("shows the configured S3 endpoint in the upload destination config and hides it for non-s3 sources", async ({page}) => {
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

test("fails cleanly when S3-compatible storage is selected without a bucket", async ({page}, testInfo) => {
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

test("feature toggles disable canvas create and replace flows without rerouting", async ({page}, testInfo) => {
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

test("chat feature toggles disable media posting and the upload button", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "enable-chat-media": false,
    "enable-chat-upload-button": false,
  });

  try {
    await rerenderChat(page);
    await expect(page.locator(".foundry-paste-eater-chat-upload")).toHaveCount(0);

    const before = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: await focusChatInput(page),
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await page.waitForTimeout(300);
    const after = await getStateSnapshot(page);
    expect(after.messages.length).toBe(before.messages.length);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await rerenderChat(page);
    await cleanupClipboardRun(page, run);
  }
});
