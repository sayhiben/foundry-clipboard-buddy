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


test("extracts a media URL from pasted HTML and creates a tile", async ({foundryPage: page}, testInfo) => {
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

test("downloads a direct media url into a focused actor portrait field instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const actorSheet = await page.evaluate(() => {
      const appId = `clipboard-art-${Date.now()}`;
      const root = document.createElement("div");
      root.dataset.appid = appId;
      root.innerHTML = `
        <form>
          <input type="text" name="img" value="icons/svg/mystery-man.svg">
          <img data-edit="img" src="icons/svg/mystery-man.svg" alt="Portrait preview">
        </form>
      `;
      document.body.append(root);

      ui.windows[appId] = {
        appId,
        document: {
          id: appId,
          documentName: "Actor",
        },
        close: () => {
          root.remove();
          delete ui.windows[appId];
        },
      };

      return {
        appId,
        fieldSelector: `[data-appid="${appId}"] input[name="img"]`,
      };
    });

    const selector = actorSheet.fieldSelector;
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchTextPaste(page, {
      targetSelector: selector,
      text: getFixtureUrl("test-token.png"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => page.locator(selector).inputValue()).toContain(run.uploadFolder);
    await expect.poll(async () => {
      return page.evaluate(appId => {
        const preview = document.querySelector(`[data-appid="${appId}"] [data-edit="img"]`);
        return preview?.getAttribute?.("src") || preview?.src || "";
      }, actorSheet.appId);
    }).toContain(run.uploadFolder);

    const after = await getStateSnapshot(page);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.messages.length).toBe(before.messages.length);
  } finally {
    await page.evaluate(() => {
      for (const app of Object.values(ui.windows)) {
        if (app?.document?.documentName !== "Actor") continue;
        if (!String(app.appId || "").startsWith("clipboard-art-")) continue;
        app.close?.();
      }
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("falls back to the original direct media url in a focused actor portrait field when download is blocked", async ({foundryPage: page}, testInfo) => {
  const blockedServer = await startBlockedMediaServer();
  const run = await beginClipboardRun(page, testInfo);
  try {
    const actorSheet = await page.evaluate(() => {
      const appId = `clipboard-art-${Date.now()}`;
      const root = document.createElement("div");
      root.dataset.appid = appId;
      root.innerHTML = `
        <form>
          <input type="text" name="img" value="icons/svg/mystery-man.svg">
          <img data-edit="img" src="icons/svg/mystery-man.svg" alt="Portrait preview">
        </form>
      `;
      document.body.append(root);

      ui.windows[appId] = {
        appId,
        document: {
          id: appId,
          documentName: "Actor",
        },
        close: () => {
          root.remove();
          delete ui.windows[appId];
        },
      };

      return {
        appId,
        fieldSelector: `[data-appid="${appId}"] input[name="img"]`,
      };
    });

    const selector = actorSheet.fieldSelector;
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchTextPaste(page, {
      targetSelector: selector,
      text: blockedServer.url,
      mimeType: "text/plain",
    });

    await expect.poll(async () => page.locator(selector).inputValue()).toBe(blockedServer.url);
    await expect.poll(async () => {
      return page.evaluate(appId => {
        const preview = document.querySelector(`[data-appid="${appId}"] [data-edit="img"]`);
        return preview?.getAttribute?.("src") || preview?.src || "";
      }, actorSheet.appId);
    }).toContain(blockedServer.url);

    const after = await getStateSnapshot(page);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.messages.length).toBe(before.messages.length);
  } finally {
    await blockedServer.close();
    await page.evaluate(() => {
      for (const app of Object.values(ui.windows)) {
        if (app?.document?.documentName !== "Actor") continue;
        if (!String(app.appId || "").startsWith("clipboard-art-")) continue;
        app.close?.();
      }
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("prefers an animated media url over a rasterized pasted blob in chat", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const before = await getStateSnapshot(page);

    await dispatchMixedPaste(page, {
      targetSelector: chatSelector,
      filename: "test-token.png",
      mimeType: "image/png",
      text: getFixtureUrl("test-animated.gif"),
      html: `<img src="${getFixtureUrl("test-animated.gif")}" alt="${run.prefix} animated media">`,
    });

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain(".gif?foundry-paste-eater=");
    expect(message.content).not.toContain(".png?foundry-paste-eater=");
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("prefers an animated media url over a rasterized pasted blob on the canvas", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 25);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchMixedPaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
      text: getFixtureUrl("test-animated.gif"),
      html: `<img src="${getFixtureUrl("test-animated.gif")}" alt="${run.prefix} animated canvas media">`,
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(".png?foundry-paste-eater=");
    expect(tile.textureSrc).not.toContain(".gif?foundry-paste-eater=");
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.messages.length).toBe(before.messages.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates media from text/uri-list paste on the canvas", async ({foundryPage: page}, testInfo) => {
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

test("downloads a direct media URL and creates a tile", async ({foundryPage: page}, testInfo) => {
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

test("downloads a direct media URL and creates a token", async ({foundryPage: page}, testInfo) => {
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

test("downloads a direct video url and creates a tile", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 26);
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tiles.activate());

    const before = await getStateSnapshot(page);
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: getFixtureUrl("test-video.webm"),
      mimeType: "text/plain",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.textureSrc).toContain(".webm");
    expect(tile.textureSrc).not.toContain("/modules/foundry-paste-eater/test/assets/test-video.webm");
    expect(tile.video).toMatchObject({
      autoplay: true,
      loop: true,
      volume: 0,
    });
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("downloads a direct media URL and replaces a selected token in place", async ({foundryPage: page}, testInfo) => {
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

    let updated;
    await expect.poll(async () => {
      updated = await getTokenDocument(page, token.id);
      return updated?.textureSrc || "";
    }).toContain(run.uploadFolder);

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

test("downloads a direct media URL and replaces a selected tile in place", async ({foundryPage: page}, testInfo) => {
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

    let updated;
    await expect.poll(async () => {
      updated = await getTileDocument(page, tile.id);
      return updated?.textureSrc || "";
    }).toContain(run.uploadFolder);

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

test("does not create broken canvas content when a direct media url download is blocked", async ({foundryPage: page}, testInfo) => {
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

test("leaves the original url text in chat when a direct media url download is blocked", async ({foundryPage: page}, testInfo) => {
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
