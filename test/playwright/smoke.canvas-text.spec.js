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


test("creates a standalone note when plain text is pasted on open canvas", async ({foundryPage: page}, testInfo) => {
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

test("creates a standalone note when a non-media URL is pasted on canvas", async ({foundryPage: page}, testInfo) => {
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

test("appends plain text to the same linked note for a selected token", async ({foundryPage: page}, testInfo) => {
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

    await expect.poll(async () => {
      const updatedJournal = await getJournalEntry(page, firstJournal.id);
      return updatedJournal.pages[0].content || "";
    }).toContain(secondText);

    const updatedJournal = await getJournalEntry(page, firstJournal.id);
    expect(updatedJournal.pages[0].content).toContain(firstText);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("creates a linked note for a selected tile", async ({foundryPage: page}, testInfo) => {
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

test("appends pasted text to a selected scene note", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const mouse = await getSafeCanvasPoint(page, 23);
    const appendedText = `${run.prefix} note append text`;
    await focusCanvas(page);
    await setCanvasMousePosition(page, mouse);

    const seededNote = await page.evaluate(async ({x, y, name}) => {
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
        texture: {src: CONFIG.JournalEntry.noteIcons.Book},
      }]);
      return {
        id: note.id,
        entryId: entry.id,
        pageId: page.id,
      };
    }, {
      x: mouse.x,
      y: mouse.y,
      name: `${run.prefix} Text Note`,
    });

    await page.evaluate(() => canvas.notes.activate());
    await controlPlaceable(page, "Note", seededNote.id);

    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: appendedText,
      mimeType: "text/plain",
    });

    await expect.poll(async () => {
      const journal = await getJournalEntry(page, seededNote.entryId);
      return journal?.pages?.[0]?.content || "";
    }).toContain(appendedText);

    const note = await getNoteDocument(page, seededNote.id);
    const journal = await getJournalEntry(page, seededNote.entryId);
    expect(note.entryId).toBe(seededNote.entryId);
    expect(note.pageId).toBe(seededNote.pageId);
    expect(journal.pages[0].content).toContain("Seed");
    expect(journal.pages[0].content).toContain(appendedText);
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("applies pasted text to multiple selected tokens on the active layer", async ({foundryPage: page}, testInfo) => {
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

test("preserves paragraph and line breaks when HTML is pasted into a note", async ({foundryPage: page}, testInfo) => {
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
