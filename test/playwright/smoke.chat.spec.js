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
  "pasted-token-actor-type": "system-default",
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


test("posts chat media on image paste without creating canvas content", async ({foundryPage: page}, testInfo) => {
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

test("returns paste targeting to the canvas after clicking back into the board", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const chatSelector = await focusChatInput(page);
    const beforeChat = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: chatSelector,
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(beforeChat.messages.length + 1);

    const mouse = await getSafeCanvasPoint(page, 5);
    await setCanvasMousePosition(page, mouse);
    await page.evaluate(() => canvas.tokens.activate());
    await page.evaluate(() => {
      const board = document.querySelector("#board");
      if (!board) throw new Error("Could not find the Foundry board.");
      board.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }));
    });
    await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector(".game"))).toBe(true);

    const beforeTokenPaste = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-animated.gif",
      mimeType: "",
    });

    await expect.poll(async () => (await getStateSnapshot(page)).tokens.length).toBe(beforeTokenPaste.tokens.length + 1);
    const after = await getStateSnapshot(page);
    const [token] = getNewDocuments(beforeTokenPaste, after, "tokens");

    expect(token.textureSrc).toContain(run.uploadFolder);
    expect(token.textureSrc).toContain(".png");
    expect(after.messages.length).toBe(beforeTokenPaste.messages.length);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("posts chat media on video paste without creating canvas content", async ({foundryPage: page}, testInfo) => {
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

test("accepts dropped chat media without creating canvas content", async ({foundryPage: page}, testInfo) => {
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

test("leaves a non-media URL as plain chat text", async ({foundryPage: page}, testInfo) => {
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

test("leaves plain text as normal chat input", async ({foundryPage: page}, testInfo) => {
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

test("uses the chat upload button to post media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    await focusChatInput(page);
    const before = await getStateSnapshot(page);
    await expect(page.locator("#chat-controls .foundry-paste-eater-chat-upload")).toHaveCount(1);

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

test("chat feature toggles disable media posting and the upload button", async ({foundryPage: page}, testInfo) => {
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
