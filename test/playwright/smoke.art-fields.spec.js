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


test("fills a focused actor portrait field instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
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

    await dispatchFilePaste(page, {
      targetSelector: selector,
      filename: "test-token.png",
      mimeType: "image/png",
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

test("fills focused AmbientSound and PlaylistSound audio path fields", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const targets = await page.evaluate(async prefix => {
      const ambientAppId = `clipboard-audio-ambient-${Date.now()}`;
      const ambientRoot = document.createElement("div");
      ambientRoot.dataset.appid = ambientAppId;
      ambientRoot.innerHTML = '<form><input type="text" name="path" value=""><audio data-edit="path"></audio></form>';
      document.body.append(ambientRoot);
      ui.windows[ambientAppId] = {
        appId: ambientAppId,
        object: {
          id: ambientAppId,
          documentName: "AmbientSound",
          canUserModify: () => true,
        },
        close: () => {
          ambientRoot.remove();
          delete ui.windows[ambientAppId];
        },
      };

      const PlaylistDocument = foundry.documents.Playlist || CONFIG.Playlist.documentClass || globalThis.Playlist;
      const playlist = await PlaylistDocument.create({name: `${prefix} Field Audio`});
      const [playlistSound] = await playlist.createEmbeddedDocuments("PlaylistSound", [{
        name: `${prefix} Field Sound`,
        path: "",
      }]);

      const playlistAppId = `clipboard-audio-playlist-${Date.now()}`;
      const playlistRoot = document.createElement("div");
      playlistRoot.dataset.appid = playlistAppId;
      playlistRoot.innerHTML = '<form><input type="text" name="path" value=""><audio data-edit="path"></audio></form>';
      document.body.append(playlistRoot);
      ui.windows[playlistAppId] = {
        appId: playlistAppId,
        object: playlistSound,
        close: () => {
          playlistRoot.remove();
          delete ui.windows[playlistAppId];
        },
      };

      return {
        ambientSelector: `[data-appid="${ambientAppId}"] input[name="path"]`,
        playlistSelector: `[data-appid="${playlistAppId}"] input[name="path"]`,
      };
    }, run.prefix);

    await page.locator(targets.ambientSelector).focus();
    await dispatchFilePaste(page, {
      targetSelector: targets.ambientSelector,
      fixtureFilename: "test-audio.wav",
      filename: `${run.prefix} ambient-field.wav`,
      mimeType: "audio/wav",
    });
    await expect.poll(() => page.locator(targets.ambientSelector).inputValue()).toContain(run.uploadFolder);

    await page.locator(targets.playlistSelector).focus();
    await dispatchFilePaste(page, {
      targetSelector: targets.playlistSelector,
      fixtureFilename: "test-audio.wav",
      filename: `${run.prefix} playlist-field.wav`,
      mimeType: "audio/wav",
    });
    await expect.poll(() => page.locator(targets.playlistSelector).inputValue()).toContain(run.uploadFolder);
  } finally {
    await page.evaluate(() => {
      for (const app of Object.values(ui.windows)) {
        if (!String(app?.appId || "").startsWith("clipboard-audio-")) continue;
        app.close?.();
      }
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("fills a focused item portrait field instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const itemSheet = await page.evaluate(() => {
      const appId = `clipboard-art-${Date.now()}`;
      const root = document.createElement("div");
      root.dataset.appid = appId;
      root.innerHTML = `
        <form>
          <input type="text" name="img" value="icons/svg/item-bag.svg">
          <img data-edit="img" src="icons/svg/item-bag.svg" alt="Item preview">
        </form>
      `;
      document.body.append(root);

      ui.windows[appId] = {
        appId,
        document: {
          id: appId,
          documentName: "Item",
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

    const selector = itemSheet.fieldSelector;
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: selector,
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await expect.poll(async () => page.locator(selector).inputValue()).toContain(run.uploadFolder);
    await expect.poll(async () => {
      return page.evaluate(appId => {
        const preview = document.querySelector(`[data-appid="${appId}"] [data-edit="img"]`);
        return preview?.getAttribute?.("src") || preview?.src || "";
      }, itemSheet.appId);
    }).toContain(run.uploadFolder);

    const after = await getStateSnapshot(page);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await page.evaluate(() => {
      for (const app of Object.values(ui.windows)) {
        if (app?.document?.documentName !== "Item") continue;
        if (!String(app.appId || "").startsWith("clipboard-art-")) continue;
        app.close?.();
      }
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("fills a real focused token config texture field instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 24);
    const token = await createActorBackedToken(page, {
      actorName: `${run.prefix} Token Config Actor`,
      tokenName: `${run.prefix} Token Config`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: mouse.x,
      y: mouse.y,
    });
    const tokenConfig = await page.evaluate(async tokenId => {
      const tokenDocument = canvas.scene.tokens.get(tokenId);
      if (!tokenDocument?.sheet) throw new Error(`Could not find a token config sheet for ${tokenId}.`);
      tokenDocument.sheet.render(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        appId: tokenDocument.sheet.id,
        fieldSelector: `[id="${tokenDocument.sheet.id}"] file-picker[name="texture.src"] input`,
        pickerSelector: `[id="${tokenDocument.sheet.id}"] file-picker[name="texture.src"]`,
        appearanceTabSelector: `[id="${tokenDocument.sheet.id}"] [data-action="tab"][data-tab="appearance"]`,
      };
    }, token.tokenId);

    const selector = tokenConfig.fieldSelector;
    await page.locator(tokenConfig.appearanceTabSelector).click();
    await page.waitForSelector(selector, {state: "visible"});
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: selector,
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(async () => page.locator(selector).inputValue()).toContain(run.uploadFolder);
    await expect.poll(async () => {
      return page.evaluate(selector => {
        const picker = document.querySelector(selector);
        return picker?.value || "";
      }, tokenConfig.pickerSelector);
    }).toContain(run.uploadFolder);

    const after = await getStateSnapshot(page);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await page.evaluate(prefix => {
      for (const app of foundry.applications.instances.values()) {
        if (app?.constructor?.name !== "TokenConfig") continue;
        if (!String(app.title || "").includes(prefix)) continue;
        app.close?.();
      }
    }, run.prefix).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("fills a focused actor prototype token texture field instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const actorSheet = await page.evaluate(() => {
      const appId = `clipboard-art-${Date.now()}`;
      const root = document.createElement("div");
      root.dataset.appid = appId;
      root.innerHTML = `
        <form>
          <file-picker name="prototypeToken.texture.src">
            <input type="text" value="icons/svg/mystery-man.svg">
          </file-picker>
          <video data-edit="prototypeToken.texture.src" src=""></video>
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
        fieldSelector: `[data-appid="${appId}"] file-picker[name="prototypeToken.texture.src"] input`,
        pickerSelector: `[data-appid="${appId}"] file-picker[name="prototypeToken.texture.src"]`,
      };
    });

    const selector = actorSheet.fieldSelector;
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: selector,
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(async () => page.locator(selector).inputValue()).toContain(run.uploadFolder);
    await expect.poll(async () => {
      return page.evaluate(selector => {
        const picker = document.querySelector(selector);
        return picker?.value || "";
      }, actorSheet.pickerSelector);
    }).toContain(run.uploadFolder);
    await expect.poll(async () => {
      return page.evaluate(appId => {
        const preview = document.querySelector(`[data-appid="${appId}"] [data-edit="prototypeToken.texture.src"]`);
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

test("ignores unsupported editable texture fields instead of creating canvas media", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const tileConfig = await page.evaluate(() => {
      const appId = `clipboard-art-${Date.now()}`;
      const root = document.createElement("div");
      root.dataset.appid = appId;
      root.innerHTML = `
        <form>
          <input type="text" name="texture.src" value="tiles/original.png">
        </form>
      `;
      document.body.append(root);

      ui.windows[appId] = {
        appId,
        object: {
          id: appId,
          documentName: "Tile",
        },
        close: () => {
          root.remove();
          delete ui.windows[appId];
        },
      };

      return {
        appId,
        fieldSelector: `[data-appid="${appId}"] input[name="texture.src"]`,
      };
    });

    const selector = tileConfig.fieldSelector;
    await page.locator(selector).focus();
    const before = await getStateSnapshot(page);

    await dispatchFilePaste(page, {
      targetSelector: selector,
      filename: "test-token.png",
      mimeType: "image/png",
    });

    await page.waitForTimeout(300);
    await expect(page.locator(selector)).toHaveValue("tiles/original.png");

    const after = await getStateSnapshot(page);
    expect(after.tokens.length).toBe(before.tokens.length);
    expect(after.tiles.length).toBe(before.tiles.length);
    expect(after.notes.length).toBe(before.notes.length);
  } finally {
    await page.evaluate(() => {
      for (const app of Object.values(ui.windows)) {
        if (app?.object?.documentName !== "Tile") continue;
        if (!String(app.appId || "").startsWith("clipboard-art-")) continue;
        app.close?.();
      }
    }).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});
