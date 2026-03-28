const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  clearActiveLayerClipboardObjects,
  clearCanvasMousePosition,
  cleanupClipboardRun,
  controlPlaceable,
  createTile,
  createToken,
  dispatchClipboardModeKeydown,
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
  getSafeCanvasPoint,
  getStateSnapshot,
  getTileDocument,
  getTokenDocument,
  invokeSceneTool,
  loginToFoundry,
  restoreClipboardRead,
  setActiveLayerClipboardObjects,
  setCanvasMousePosition,
  stubClipboardRead,
} = require("./helpers/foundry");

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
    expect(Math.abs(tile.x - mouse.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(tile.y - mouse.y)).toBeLessThanOrEqual(2);
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
    expect(Math.abs(note.x - mouse.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(note.y - mouse.y)).toBeLessThanOrEqual(2);
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
      return tokenState?.flags?.["clipboard-image"]?.textNote || null;
    }).not.toBeNull();
    const firstNoteData = await page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("clipboard-image", "textNote"), token.id);
    const firstJournal = await getJournalEntry(page, firstNoteData.entryId);

    const secondText = `${run.prefix} second text block`;
    await dispatchTextPaste(page, {
      targetSelector: ".game",
      text: secondText,
      mimeType: "text/plain",
    });

    await expect.poll(() => page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("clipboard-image", "textNote") || null, token.id)).not.toBeNull();
    const secondNoteData = await page.evaluate(tokenId => canvas.scene.tokens.get(tokenId)?.getFlag("clipboard-image", "textNote"), token.id);
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
      canvas.tokens.releaseAll();
      canvas.tiles.releaseAll();
    });
    await dispatchClipboardModeKeydown(page, {
      code: "KeyA",
      ctrlKey: true,
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
      code: "KeyA",
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

    expect(message.content).toContain("clipboard-image-chat-message");
    expect(message.content).toContain("Open full media");
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
    expect(tile.textureSrc).not.toContain("/modules/clipboard-image/test/assets/test-token.png");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});

test("scene upload still works when copied objects are present and falls back to canvas center", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    const dimensions = await getCanvasDimensions(page);
    await clearCanvasMousePosition(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setActiveLayerClipboardObjects(page, "Tile", 1);
    const before = await getStateSnapshot(page);

    const chooserPromise = page.waitForEvent("filechooser");
    await invokeSceneTool(page, "tiles", "clipboard-image-upload");
    const chooser = await chooserPromise;
    await chooser.setFiles(getFixturePath("test-token.png"));

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.x).toBeCloseTo(dimensions.width / 2, 0);
    expect(tile.y).toBeCloseTo(dimensions.height / 2, 0);
  } finally {
    await clearActiveLayerClipboardObjects(page, "Tile");
    await cleanupClipboardRun(page, run);
  }
});

test("scene paste reads later async clipboard items, ignores copied objects, and falls back to canvas center", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
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
    await invokeSceneTool(page, "tiles", "clipboard-image-paste");

    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(before.tiles.length + 1);
    const after = await getStateSnapshot(page);
    const [tile] = getNewDocuments(before, after, "tiles");

    expect(tile.textureSrc).toContain(run.uploadFolder);
    expect(tile.x).toBeCloseTo(dimensions.width / 2, 0);
    expect(tile.y).toBeCloseTo(dimensions.height / 2, 0);
    expect(after.notes.length).toBe(before.notes.length);
    expect(after.journals.length).toBe(before.journals.length);
  } finally {
    await clearActiveLayerClipboardObjects(page, "Tile");
    await restoreClipboardRead(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("uses the chat upload button to post media", async ({page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  try {
    await focusChatInput(page);
    const before = await getStateSnapshot(page);

    const chooserPromise = page.waitForEvent("filechooser");
    await page.locator(".clipboard-image-chat-upload").click();
    const chooser = await chooserPromise;
    await chooser.setFiles(getFixturePath("test-token.png"));

    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(before.messages.length + 1);
    const after = await getStateSnapshot(page);
    const [message] = getNewDocuments(before, after, "messages");

    expect(message.content).toContain("clipboard-image-chat-message");
    expect(message.content).toContain("Open full media");
  } finally {
    await cleanupClipboardRun(page, run);
  }
});
