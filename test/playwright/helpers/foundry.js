const fs = require("fs/promises");
const path = require("path");
const {expect} = require("@playwright/test");

const MODULE_ID = "clipboard-image";
const DEFAULT_TIMEOUT = 120_000;
const CHAT_INPUT_SELECTORS = [
  "form textarea[name='content']",
  "#chat-form textarea",
  ".chat-form textarea",
  "textarea[name='content']",
];
const CLIPBOARD_LOG_PREFIX = "Clipboard Image [";

function getFoundryUrl() {
  return process.env.FOUNDRY_URL || process.env.FOUNDRY_JOIN_URL || process.env.FOUNDRY_BASE_URL || "http://127.0.0.1:30000";
}

function getFixturePath(filename) {
  return path.resolve(__dirname, "..", "..", "assets", filename);
}

function getFixtureUrl(filename) {
  return new URL(`/modules/${MODULE_ID}/test/assets/${filename}`, getFoundryUrl()).href;
}

function sanitizeId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "run";
}

async function waitForFoundryReady(page) {
  await page.waitForFunction(() => globalThis.game?.ready && globalThis.canvas?.ready, null, {
    timeout: DEFAULT_TIMEOUT,
  });
  await expect.poll(() => page.evaluate(() => game.modules.get("clipboard-image")?.active ?? false), {
    timeout: DEFAULT_TIMEOUT,
    message: "clipboard-image module is not active in the loaded Foundry world",
  }).toBe(true);
}

async function loginToFoundry(page) {
  attachClipboardConsoleLogging(page);
  await page.goto(getFoundryUrl(), {waitUntil: "domcontentloaded"});
  await waitForFoundryShell(page);
  await page.waitForFunction(() => {
    if (globalThis.game?.ready && globalThis.canvas?.ready) return true;
    return Boolean(
      document.querySelector("button[type='submit'], button[name='join']") ||
      document.querySelector("select[name='userid']") ||
      document.querySelector("input[name='userid'], input[name='username'], input[type='password']")
    );
  }, null, {
    timeout: DEFAULT_TIMEOUT,
  });

  if (await isFoundryReady(page)) {
    await waitForFoundryReady(page);
    return;
  }

  const user = process.env.FOUNDRY_USER || process.env.FOUNDRY_USERNAME || "";
  const password = process.env.FOUNDRY_PASSWORD || "";

  const userSelect = page.locator("select[name='userid']").first();
  if (await userSelect.count()) {
    if (!user) {
      throw new Error("FOUNDRY_USER is required when Foundry shows a user selection prompt.");
    }

    const options = await userSelect.locator("option").evaluateAll(selectOptions => selectOptions.map(option => ({
      value: option.value,
      label: option.textContent?.trim() || "",
    })));
    const matchedOption = options.find(option => option.value === user || option.label === user);
    if (!matchedOption) {
      throw new Error(`Could not find a Foundry user option matching "${user}".`);
    }
    await userSelect.selectOption(matchedOption.value);
  }

  const userInput = page.locator("input[name='userid'], input[name='username']").first();
  if (await userInput.count()) {
    if (!user) {
      throw new Error("FOUNDRY_USER is required when Foundry shows a user input field.");
    }
    await userInput.fill(user);
  }

  const passwordInput = page.locator("input[type='password']").first();
  if (await passwordInput.count()) {
    await passwordInput.fill(password);
  }

  const joinButton = await findFirstVisibleLocator(page, [
    "button[type='submit']",
    "button[name='join']",
    "button:has-text('Join Game')",
    "button:has-text('Join')",
  ]);

  if (!joinButton) {
    throw new Error("Could not find a Foundry login or join button. Set FOUNDRY_STORAGE_STATE or verify FOUNDRY_URL.");
  }

  await Promise.all([
    page.waitForLoadState("networkidle").catch(() => {}),
    joinButton.click(),
  ]);
  await waitForFoundryReady(page);
}

function attachClipboardConsoleLogging(page) {
  if (page.__clipboardConsoleLoggingAttached) return;

  page.__clipboardConsoleLoggingAttached = true;
  page.on("console", message => {
    const text = message.text();
    if (!text.includes(CLIPBOARD_LOG_PREFIX)) return;
    console.log(`[browser:${message.type()}] ${text}`);
  });
}

async function waitForFoundryShell(page) {
  await page.waitForFunction(() => document.readyState === "complete" || document.readyState === "interactive", null, {
    timeout: DEFAULT_TIMEOUT,
  });
}

async function isFoundryReady(page) {
  return page.evaluate(() => Boolean(globalThis.game?.ready && globalThis.canvas?.ready)).catch(() => false);
}

async function findFirstVisibleLocator(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) return locator;
  }
  return null;
}

async function beginClipboardRun(page, testInfo, options = {}) {
  const runId = `${Date.now()}-${sanitizeId(testInfo.title)}`;
  const prefix = `[PW ${runId}]`;
  const uploadFolder = await page.evaluate(({runId, overrideTarget}) => {
    const worldId = game.world?.id || "world";
    return overrideTarget || `worlds/${worldId}/pasted_images/playwright/${runId}`;
  }, {runId, overrideTarget: options.target || ""});
  const source = options.source || "data";
  const bucket = source === "s3" ? (options.bucket || "") : "";
  const verboseLogging = Object.hasOwn(options, "verboseLogging") ? Boolean(options.verboseLogging) : true;

  const previousSettings = await page.evaluate(async ({moduleId, uploadFolder, source, bucket, verboseLogging}) => {
    const previousSource = await game.settings.get(moduleId, "image-location-source");
    const previousTarget = await game.settings.get(moduleId, "image-location");
    const previousBucket = await game.settings.get(moduleId, "image-location-bucket");
    const previousVerboseLogging = await game.settings.get(moduleId, "verbose-logging");

    await game.settings.set(moduleId, "image-location-source", source);
    await game.settings.set(moduleId, "image-location", uploadFolder);
    await game.settings.set(moduleId, "image-location-bucket", bucket);
    await game.settings.set(moduleId, "verbose-logging", verboseLogging);

    return {
      source: previousSource,
      target: previousTarget,
      bucket: previousBucket,
      verboseLogging: previousVerboseLogging,
    };
  }, {moduleId: MODULE_ID, uploadFolder, source, bucket, verboseLogging});

  await releaseAllControlledPlaceables(page);

  return {
    runId,
    prefix,
    uploadFolder,
    source,
    bucket,
    previousSettings,
  };
}

async function cleanupClipboardRun(page, run) {
  if (!run) return;

  await page.evaluate(async ({moduleId, run}) => {
    const messageIds = game.messages.contents
      .filter(message => (message.content || "").includes(run.uploadFolder) || (message.content || "").includes(run.prefix))
      .map(message => message.id);
    for (const id of messageIds) {
      await game.messages.get(id)?.delete();
    }

    const journalIds = game.journal.contents
      .filter(entry => (entry.name || "").includes(run.prefix))
      .map(entry => entry.id);

    const noteIds = canvas.scene.notes.contents
      .filter(note => journalIds.includes(note.entryId) || (note.text || "").includes(run.prefix))
      .map(note => note.id);
    if (noteIds.length) {
      await canvas.scene.deleteEmbeddedDocuments("Note", noteIds);
    }

    const tokenIds = canvas.scene.tokens.contents
      .filter(token =>
        (token.name || "").includes(run.prefix) ||
        (token.texture?.src || "").includes(run.uploadFolder)
      )
      .map(token => token.id);
    if (tokenIds.length) {
      await canvas.scene.deleteEmbeddedDocuments("Token", tokenIds);
    }

    const tileIds = canvas.scene.tiles.contents
      .filter(tile => (tile.texture?.src || "").includes(run.uploadFolder))
      .map(tile => tile.id);
    if (tileIds.length) {
      await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
    }

    const actorIds = game.actors.contents
      .filter(actor =>
        (actor.img || "").includes(run.uploadFolder) ||
        (actor.prototypeToken?.texture?.src || "").includes(run.uploadFolder)
      )
      .map(actor => actor.id);
    for (const id of actorIds) {
      await game.actors.get(id)?.delete();
    }

    for (const id of journalIds) {
      await game.journal.get(id)?.delete();
    }

    await game.settings.set(moduleId, "image-location-source", run.previousSettings.source);
    await game.settings.set(moduleId, "image-location", run.previousSettings.target);
    await game.settings.set(moduleId, "image-location-bucket", run.previousSettings.bucket);
    await game.settings.set(moduleId, "verbose-logging", run.previousSettings.verboseLogging);
  }, {moduleId: MODULE_ID, run});

  await releaseAllControlledPlaceables(page);
}

async function focusCanvas(page) {
  await page.evaluate(() => {
    const root = document.querySelector(".game");
    if (!root) throw new Error("Could not find the Foundry game root.");
    root.tabIndex = 0;
    root.focus({preventScroll: true});
  });
  await page.waitForFunction(() => document.activeElement === document.querySelector(".game"));
}

async function releaseAllControlledPlaceables(page) {
  await page.evaluate(() => {
    const layers = [canvas.tokens, canvas.tiles, canvas.notes].filter(Boolean);
    for (const layer of layers) {
      layer.releaseAll?.();
      for (const placeable of layer.placeables || []) {
        if (placeable.controlled) {
          placeable.release?.();
        }
      }
    }
  });

  await expect.poll(() => page.evaluate(() => ({
    tokens: canvas.tokens?.controlled?.length || 0,
    tiles: canvas.tiles?.controlled?.length || 0,
    notes: canvas.notes?.controlled?.length || 0,
  })), {
    timeout: 5_000,
    message: "Expected all controlled placeables to be released before continuing",
  }).toEqual({tokens: 0, tiles: 0, notes: 0});
}

async function focusChatInput(page) {
  await page.evaluate(() => {
    ui.sidebar?.expand?.();
    ui.sidebar?.activateTab?.("chat");
  });
  await page.waitForFunction(selectors => selectors.some(selector => document.querySelector(selector)), CHAT_INPUT_SELECTORS, {
    timeout: DEFAULT_TIMEOUT,
  });

  const selector = await page.evaluate(selectors => {
    for (const candidate of selectors) {
      const element = document.querySelector(candidate);
      if (!element) continue;
      element.focus();
      return candidate;
    }
    return null;
  }, CHAT_INPUT_SELECTORS);

  if (!selector) {
    throw new Error("Could not find a Foundry chat input.");
  }

  return selector;
}

async function setCanvasMousePosition(page, position) {
  await page.evaluate(({x, y}) => {
    const point = canvas.mousePosition;
    if (point && typeof point.copyFrom === "function" && globalThis.PIXI?.Point) {
      point.copyFrom(new PIXI.Point(x, y));
      return;
    }

    if (point) {
      point.x = x;
      point.y = y;
      return;
    }

    canvas.mousePosition = globalThis.PIXI?.Point ? new PIXI.Point(x, y) : {x, y};
  }, position);
}

async function getSafeCanvasPoint(page, offset = 0) {
  return page.evaluate(index => {
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const baseX = Math.min(Math.max(160 + (index * 120), 160), Math.max(width - 220, 160));
    const baseY = Math.min(Math.max(180 + (index * 100), 180), Math.max(height - 220, 180));
    return {x: baseX, y: baseY};
  }, offset);
}

async function getCanvasDimensions(page) {
  return page.evaluate(() => ({
    width: canvas.dimensions.width,
    height: canvas.dimensions.height,
    sceneWidth: canvas.dimensions.sceneWidth,
    sceneHeight: canvas.dimensions.sceneHeight,
    gridSize: canvas.grid.size,
  }));
}

async function createToken(page, {name, textureSrc, x, y, width = 1, height = 1}) {
  return page.evaluate(async data => {
    const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
      actorId: null,
      name: data.name,
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
    }]);
    return {
      id: token.id,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      name: token.name,
    };
  }, {name, textureSrc, x, y, width, height});
}

async function createTile(page, {textureSrc, x, y, width = 120, height = 120}) {
  return page.evaluate(async data => {
    const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [{
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
      rotation: 0,
      sort: 0,
    }]);
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
    };
  }, {textureSrc, x, y, width, height});
}

async function controlPlaceable(page, documentName, id) {
  await page.evaluate(({documentName, id}) => {
    canvas.tokens?.releaseAll?.();
    canvas.tiles?.releaseAll?.();

    const layer = documentName === "Token" ? canvas.tokens : canvas.tiles;
    const object = layer.placeables.find(placeable => placeable.document.id === id);
    if (!object) {
      throw new Error(`Could not find ${documentName} ${id} to control.`);
    }
    object.control({releaseOthers: true});
  }, {documentName, id});
}

async function controlPlaceables(page, placeables) {
  await page.evaluate(items => {
    canvas.tokens?.releaseAll?.();
    canvas.tiles?.releaseAll?.();

    for (const item of items) {
      const layer = item.documentName === "Token" ? canvas.tokens : canvas.tiles;
      const object = layer.placeables.find(placeable => placeable.document.id === item.id);
      if (!object) {
        throw new Error(`Could not find ${item.documentName} ${item.id} to control.`);
      }
      object.control({releaseOthers: false});
    }
  }, placeables);
}

async function setActiveLayerClipboardObjects(page, documentName, count = 1) {
  await page.evaluate(({documentName, count}) => {
    const layer = documentName === "Token" ? canvas.tokens : canvas.tiles;
    layer.clipboard = layer.clipboard || {};
    layer.clipboard.objects = Array.from({length: count}, (_, index) => ({id: `pw-${documentName}-${index}`}));
  }, {documentName, count});
}

async function clearActiveLayerClipboardObjects(page, documentName) {
  await page.evaluate(documentName => {
    const layer = documentName === "Token" ? canvas.tokens : canvas.tiles;
    if (!layer.clipboard) return;
    layer.clipboard.objects = [];
  }, documentName);
}

async function clearCanvasMousePosition(page) {
  await page.evaluate(() => {
    canvas.mousePosition = null;
  });
}

async function invokeSceneTool(page, controlName, toolName) {
  await page.evaluate(({controlName, toolName}) => {
    const controls = Array.isArray(ui.controls.controls)
      ? ui.controls.controls
      : Object.values(ui.controls.controls || {});
    const control = controls.find(entry => entry.name === controlName);
    if (!control) {
      throw new Error(`Could not find scene control ${controlName}.`);
    }

    const tools = Array.isArray(control.tools)
      ? control.tools
      : Object.values(control.tools || {});
    const tool = tools.find(entry => entry.name === toolName);
    const handler = tool?.onClick || tool?.onChange;
    if (!handler) {
      throw new Error(`Could not find tool ${toolName} on control ${controlName}.`);
    }

    handler(true);
  }, {controlName, toolName});
}

async function readFixtureBytes(filename) {
  return Array.from(await fs.readFile(getFixturePath(filename)));
}

async function dispatchFilePaste(page, {targetSelector, filename, mimeType}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, bytes, filename, mimeType});
}

async function dispatchFileDrop(page, {targetSelector, filename, mimeType}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find drop target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    for (const eventName of ["dragover", "drop"]) {
      const event = new Event(eventName, {bubbles: true, cancelable: true, composed: true});
      Object.defineProperty(event, "dataTransfer", {
        configurable: true,
        value: dataTransfer,
      });
      target.dispatchEvent(event);
    }
  }, {targetSelector, bytes, filename, mimeType});
}

async function dispatchMixedPaste(page, {
  targetSelector,
  filename,
  mimeType,
  text,
  textMimeType = "text/plain",
  html,
}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType, text, textMimeType, html}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    if (text != null) dataTransfer.setData(textMimeType, text);
    if (html != null) dataTransfer.setData("text/html", html);
    dataTransfer.items.add(file);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, bytes, filename, mimeType, text, textMimeType, html});
}

async function dispatchTextPaste(page, {targetSelector, text, mimeType = "text/plain", html}) {
  await page.evaluate(({targetSelector, text, mimeType, html}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const dataTransfer = new DataTransfer();
    if (text != null) dataTransfer.setData(mimeType, text);
    if (html != null) dataTransfer.setData("text/html", html);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, text, mimeType, html});
}

async function dispatchClipboardModeKeydown(page, {
  code = "KeyV",
  ctrlKey = false,
  metaKey = false,
  altKey = false,
  capsLock = false,
}) {
  await page.evaluate(({code, ctrlKey, metaKey, altKey, capsLock}) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code,
      ctrlKey,
      metaKey,
      altKey,
    });
    Object.defineProperty(event, "getModifierState", {
      configurable: true,
      value: key => key === "CapsLock" ? capsLock : false,
    });
    document.dispatchEvent(event);
  }, {code, ctrlKey, metaKey, altKey, capsLock});
}

async function stubClipboardRead(page, items) {
  const payloads = [];

  for (const item of items) {
    const payload = {texts: item.texts || {}};
    if (item.text != null) {
      payload.texts[item.mimeType || "text/plain"] = item.text;
    }
    if (item.html != null) {
      payload.texts["text/html"] = item.html;
    }
    if (item.filename) {
      payload.file = {
        bytes: await readFixtureBytes(item.filename),
        filename: item.filename,
        mimeType: item.mimeType,
      };
    }
    payloads.push(payload);
  }

  await page.evaluate(payloads => {
    const originalClipboard = navigator.clipboard || null;
    globalThis.__clipboardImageOriginalClipboard ??= originalClipboard;

    const stubbedClipboard = Object.create(originalClipboard);
    stubbedClipboard.read = async () => payloads.map(payload => ({
      types: [
        ...Object.keys(payload.texts || {}),
        ...(payload.file ? [payload.file.mimeType] : []),
      ],
      getType: async type => {
        if (payload.texts && Object.hasOwn(payload.texts, type)) {
          return new Blob([payload.texts[type]], {type});
        }

        if (payload.file && payload.file.mimeType === type) {
          return new File([new Uint8Array(payload.file.bytes)], payload.file.filename, {
            type: payload.file.mimeType,
          });
        }

        throw new DOMException(`No clipboard item for ${type}`, "NotFoundError");
      },
    }));

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: stubbedClipboard,
    });
  }, payloads);
}

async function restoreClipboardRead(page) {
  await page.evaluate(() => {
    if (!Object.hasOwn(globalThis, "__clipboardImageOriginalClipboard")) return;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: globalThis.__clipboardImageOriginalClipboard,
    });
  });
}

async function getStateSnapshot(page) {
  return page.evaluate(() => ({
    tokens: canvas.scene.tokens.contents.map(token => ({
      id: token.id,
      name: token.name,
      actorId: token.actorId,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      hidden: token.hidden,
      flags: token.flags,
    })),
    tiles: canvas.scene.tiles.contents.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
      hidden: tile.hidden,
      video: tile.video,
    })),
    notes: canvas.scene.notes.contents.map(note => ({
      id: note.id,
      entryId: note.entryId,
      pageId: note.pageId,
      text: note.text,
      x: note.x,
      y: note.y,
    })),
    journals: game.journal.contents.map(entry => ({
      id: entry.id,
      name: entry.name,
      pages: entry.pages.contents.map(page => ({
        id: page.id,
        name: page.name,
        type: page.type,
        content: page.text?.content || "",
      })),
    })),
    messages: game.messages.contents.map(message => ({
      id: message.id,
      content: message.content || "",
    })),
  }));
}

async function getTokenDocument(page, id) {
  return page.evaluate(tokenId => {
    const token = canvas.scene.tokens.get(tokenId);
    if (!token) return null;
    return {
      id: token.id,
      actorId: token.actorId,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      flags: token.flags,
    };
  }, id);
}

async function getTileDocument(page, id) {
  return page.evaluate(tileId => {
    const tile = canvas.scene.tiles.get(tileId);
    if (!tile) return null;
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
      video: tile.video,
    };
  }, id);
}

async function getJournalEntry(page, id) {
  return page.evaluate(entryId => {
    const entry = game.journal.get(entryId);
    if (!entry) return null;
    return {
      id: entry.id,
      name: entry.name,
      pages: entry.pages.contents.map(page => ({
        id: page.id,
        name: page.name,
        type: page.type,
        content: page.text?.content || "",
      })),
    };
  }, id);
}

async function getNoteDocument(page, id) {
  return page.evaluate(noteId => {
    const note = canvas.scene.notes.get(noteId);
    if (!note) return null;
    return {
      id: note.id,
      entryId: note.entryId,
      pageId: note.pageId,
      text: note.text,
      x: note.x,
      y: note.y,
    };
  }, id);
}

function getNewDocuments(before, after, key) {
  const beforeIds = new Set(before[key].map(document => document.id));
  return after[key].filter(document => !beforeIds.has(document.id));
}

module.exports = {
  beginClipboardRun,
  clearActiveLayerClipboardObjects,
  clearCanvasMousePosition,
  cleanupClipboardRun,
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
  getTileDocument,
  getTokenDocument,
  invokeSceneTool,
  loginToFoundry,
  restoreClipboardRead,
  releaseAllControlledPlaceables,
  setActiveLayerClipboardObjects,
  setCanvasMousePosition,
  stubClipboardRead,
};
