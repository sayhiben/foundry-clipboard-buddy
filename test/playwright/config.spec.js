const {test: base, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  buildSharedFoundryTest,
  cleanupClipboardRun,
  closeUploadDestinationConfig,
  controlPlaceable,
  dispatchFilePaste,
  dispatchTextPaste,
  focusCanvas,
  focusChatInput,
  getFixtureUrl,
  getNewDocuments,
  getSafeCanvasPoint,
  getStateSnapshot,
  getTokenDocument,
  getUploadDestinationSummary,
  invokeSceneTool,
  openUploadDestinationConfig,
  resetFoundryUiState,
  restoreClipboardRead,
  restoreModuleSettings,
  setCanvasMousePosition,
  setModuleSettings,
  stubClipboardRead,
} = require("./helpers/foundry");

const GM_CREDENTIALS = {
  user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
  password: process.env.FOUNDRY_GM_PASSWORD ?? "",
};

const test = buildSharedFoundryTest(base, GM_CREDENTIALS, {acceptDownloads: true});

test.describe.configure({mode: "serial"});

test.beforeEach(async ({foundryPage: page}) => {
  await resetFoundryUiState(page);
});

test.afterEach(async ({foundryPage: page}) => {
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

async function createLinkedActorToken(page, {
  actorName,
  tokenName,
  textureSrc,
  x,
  y,
  width = 1,
  height = 1,
}) {
  return page.evaluate(async data => {
    const ActorDocument = globalThis.Actor || foundry.documents.Actor;
    const actor = await ActorDocument.create({
      name: data.actorName,
      type: CONFIG.Actor.defaultType || game.system.documentTypes.Actor?.[0] || "character",
      img: data.textureSrc,
      prototypeToken: {
        name: data.tokenName,
        texture: {src: data.textureSrc},
        width: data.width,
        height: data.height,
      },
    });

    const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
      actorId: actor.id,
      actorLink: true,
      name: data.tokenName,
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
    }]);

    return {
      actorId: actor.id,
      tokenId: token.id,
    };
  }, {actorName, tokenName, textureSrc, x, y, width, height});
}

async function getActorArtInfo(page, actorId) {
  return page.evaluate(id => {
    const actor = game.actors.get(id);
    return {
      img: actor?.img || "",
      prototypeTokenSrc: actor?.prototypeToken?.texture?.src || "",
    };
  }, actorId);
}

async function createLinkedTokenOnScene(page, {
  sceneName,
  actorId,
  tokenName,
  textureSrc,
  x,
  y,
  width = 1,
  height = 1,
}) {
  return page.evaluate(async data => {
    const SceneDocument = globalThis.Scene || foundry.documents.Scene;
    const scene = await SceneDocument.create({
      name: data.sceneName,
      navigation: false,
      active: false,
    });

    const [token] = await scene.createEmbeddedDocuments("Token", [{
      actorId: data.actorId,
      actorLink: true,
      name: data.tokenName,
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
    }]);

    return {
      sceneId: scene.id,
      tokenId: token.id,
    };
  }, {sceneName, actorId, tokenName, textureSrc, x, y, width, height});
}

async function getSceneTokenDocument(page, {sceneId, tokenId}) {
  return page.evaluate(data => {
    const scene = game.scenes.get(data.sceneId);
    const token = scene?.tokens?.get?.(data.tokenId) ||
      scene?.tokens?.contents?.find?.(candidate => candidate.id === data.tokenId) ||
      null;
    if (!token) return null;
    return {
      id: token.id,
      actorId: token.actorId,
      textureSrc: token.texture?.src || "",
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
    };
  }, {sceneId, tokenId});
}

async function captureClipboardErrors(page) {
  await page.evaluate(() => {
    window.__clipboardConfigErrors = [];
    if (ui.notifications.__clipboardConfigErrorsWrapped) return;

    const originalError = ui.notifications.error.bind(ui.notifications);
    ui.notifications.error = message => {
      window.__clipboardConfigErrors.push(String(message || ""));
      return originalError(message);
    };
    ui.notifications.__clipboardConfigErrorsWrapped = true;
  });
}

async function getClipboardErrors(page) {
  return page.evaluate(() => [...(window.__clipboardConfigErrors || [])]);
}

async function createTemporaryActorPortraitField(page) {
  return page.evaluate(() => {
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
      previewSelector: `[data-appid="${appId}"] [data-edit="img"]`,
    };
  });
}

async function closeTemporaryActorPortraitFields(page) {
  await page.evaluate(() => {
    for (const app of Object.values(ui.windows)) {
      if (app?.document?.documentName !== "Actor") continue;
      if (!String(app.appId || "").startsWith("clipboard-art-")) continue;
      app.close?.();
    }
  }).catch(() => {});
}

async function getExpectedOrganizedUploadPrefix(page, baseTarget, uploadContext) {
  return page.evaluate(({baseTarget, uploadContext}) => {
    const userId = game.user?.id || "user";
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `${baseTarget}/${uploadContext}/${userId}/${month}/`;
  }, {baseTarget, uploadContext});
}

test("default empty-canvas target steers new media creation across all configured modes", async ({foundryPage: page}, testInfo) => {
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

test("create-backing-actors controls whether new pasted tokens get backing actors", async ({foundryPage: page}, testInfo) => {
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

test("selected token scene-only mode leaves actor art unchanged while replacing the scene token", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "scene-only",
  });

  try {
    await focusCanvas(page);
    const linked = await createLinkedActorToken(page, {
      actorName: `${run.prefix} Scene Only Actor`,
      tokenName: `${run.prefix} Scene Only Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 400,
      y: 400,
    });
    const beforeActor = await getActorArtInfo(page, linked.actorId);

    await controlPlaceable(page, "Token", linked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(() => getTokenDocument(page, linked.tokenId)).toMatchObject({
      textureSrc: expect.stringContaining(run.uploadFolder),
    });
    expect(await getActorArtInfo(page, linked.actorId)).toEqual(beforeActor);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("selected token actor-art mode updates the actor portrait and linked token defaults", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "actor-art",
  });

  try {
    await focusCanvas(page);
    const linked = await createLinkedActorToken(page, {
      actorName: `${run.prefix} Actor Art`,
      tokenName: `${run.prefix} Actor Art Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 500,
      y: 500,
    });

    await controlPlaceable(page, "Token", linked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(() => getActorArtInfo(page, linked.actorId)).toMatchObject({
      img: expect.stringContaining(run.uploadFolder),
      prototypeTokenSrc: expect.stringContaining(run.uploadFolder),
    });
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("selected token actor-art mode updates linked tokens on other scenes for the same actor", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "actor-art",
  });
  let secondarySceneId = null;

  try {
    await focusCanvas(page);
    const linked = await createLinkedActorToken(page, {
      actorName: `${run.prefix} Cross Scene Actor`,
      tokenName: `${run.prefix} Cross Scene Active Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 540,
      y: 540,
    });
    const secondary = await createLinkedTokenOnScene(page, {
      sceneName: `${run.prefix} Actor Art Secondary Scene`,
      actorId: linked.actorId,
      tokenName: `${run.prefix} Cross Scene Linked Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 240,
      y: 240,
    });
    secondarySceneId = secondary.sceneId;

    await controlPlaceable(page, "Token", linked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(() => getActorArtInfo(page, linked.actorId)).toMatchObject({
      img: expect.stringContaining(run.uploadFolder),
      prototypeTokenSrc: expect.stringContaining(run.uploadFolder),
    });
    await expect.poll(() => getTokenDocument(page, linked.tokenId)).toMatchObject({
      textureSrc: expect.stringContaining(run.uploadFolder),
    });
    await expect.poll(() => getSceneTokenDocument(page, secondary)).toMatchObject({
      textureSrc: expect.stringContaining(run.uploadFolder),
    });
  } finally {
    if (secondarySceneId) {
      await page.evaluate(async sceneId => {
        const scene = game.scenes.get(sceneId);
        if (scene) await scene.delete();
      }, secondarySceneId).catch(() => {});
    }
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("ineligible actor-art replacement fails closed without changing the token or actor", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "actor-art",
  });

  try {
    await captureClipboardErrors(page);
    await focusCanvas(page);
    const unlinked = await page.evaluate(async data => {
      const ActorDocument = globalThis.Actor || foundry.documents.Actor;
      const actor = await ActorDocument.create({
        name: data.actorName,
        type: CONFIG.Actor.defaultType || game.system.documentTypes.Actor?.[0] || "character",
        img: data.textureSrc,
        prototypeToken: {
          name: data.tokenName,
          texture: {src: data.textureSrc},
          width: 1,
          height: 1,
        },
      });

      const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
        actorId: actor.id,
        actorLink: false,
        name: data.tokenName,
        texture: {src: data.textureSrc},
        width: 1,
        height: 1,
        x: 600,
        y: 600,
        hidden: false,
        locked: false,
      }]);

      return {
        actorId: actor.id,
        tokenId: token.id,
      };
    }, {
      actorName: `${run.prefix} Unlinked Actor`,
      tokenName: `${run.prefix} Unlinked Token`,
      textureSrc: getFixtureUrl("test-token.png"),
    });
    const beforeActor = await getActorArtInfo(page, unlinked.actorId);
    const beforeToken = await getTokenDocument(page, unlinked.tokenId);

    await controlPlaceable(page, "Token", unlinked.tokenId);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(() => getClipboardErrors(page).then(messages => messages.length)).toBeGreaterThan(0);
    expect((await getClipboardErrors(page)).at(-1)).toContain("linked to a base Actor");
    expect(await getActorArtInfo(page, unlinked.actorId)).toEqual(beforeActor);
    expect(await getTokenDocument(page, unlinked.tokenId)).toEqual(beforeToken);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("ask-each-time mode prompts before applying actor-wide token art changes", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "prompt",
  });

  try {
    await focusCanvas(page);
    const linked = await createLinkedActorToken(page, {
      actorName: `${run.prefix} Prompt Actor`,
      tokenName: `${run.prefix} Prompt Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 700,
      y: 700,
    });

    await controlPlaceable(page, "Token", linked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect(page.locator("button:has-text('Actor portrait + linked token art')")).toBeVisible();
    await page.locator("button:has-text('Actor portrait + linked token art')").click();

    await expect.poll(() => getActorArtInfo(page, linked.actorId)).toMatchObject({
      img: expect.stringContaining(run.uploadFolder),
      prototypeTokenSrc: expect.stringContaining(run.uploadFolder),
    });
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("ask-each-time mode skips the prompt and uses scene-only replacement for ineligible token images", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "prompt",
  });

  try {
    await focusCanvas(page);
    const unlinked = await page.evaluate(async data => {
      const ActorDocument = globalThis.Actor || foundry.documents.Actor;
      const actor = await ActorDocument.create({
        name: data.actorName,
        type: CONFIG.Actor.defaultType || game.system.documentTypes.Actor?.[0] || "character",
        img: data.textureSrc,
        prototypeToken: {
          name: data.tokenName,
          texture: {src: data.textureSrc},
          width: 1,
          height: 1,
        },
      });

      const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
        actorId: actor.id,
        actorLink: false,
        name: data.tokenName,
        texture: {src: data.textureSrc},
        width: 1,
        height: 1,
        x: 620,
        y: 620,
        hidden: false,
        locked: false,
      }]);

      return {
        actorId: actor.id,
        tokenId: token.id,
      };
    }, {
      actorName: `${run.prefix} Prompt Fallback Actor`,
      tokenName: `${run.prefix} Prompt Fallback Token`,
      textureSrc: getFixtureUrl("test-token.png"),
    });
    const beforeActor = await getActorArtInfo(page, unlinked.actorId);

    await controlPlaceable(page, "Token", unlinked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-portrait.svg",
      mimeType: "image/svg+xml",
    });

    await expect.poll(() => getTokenDocument(page, unlinked.tokenId)).toMatchObject({
      textureSrc: expect.stringContaining(run.uploadFolder),
    });
    await expect(page.locator("button:has-text('Actor portrait + linked token art')")).toHaveCount(0);
    expect(await getActorArtInfo(page, unlinked.actorId)).toEqual(beforeActor);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("ask-each-time mode skips the prompt and keeps video token replacement scene-local", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "selected-token-paste-mode": "prompt",
  });

  try {
    await focusCanvas(page);
    const linked = await createLinkedActorToken(page, {
      actorName: `${run.prefix} Prompt Video Actor`,
      tokenName: `${run.prefix} Prompt Video Token`,
      textureSrc: getFixtureUrl("test-token.png"),
      x: 760,
      y: 760,
    });
    const beforeActor = await getActorArtInfo(page, linked.actorId);

    await controlPlaceable(page, "Token", linked.tokenId);
    await focusCanvas(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-video.webm",
      mimeType: "video/webm",
    });

    await expect.poll(() => getTokenDocument(page, linked.tokenId)).toMatchObject({
      textureSrc: expect.stringContaining(run.uploadFolder),
    });
    await expect(page.locator("button:has-text('Actor portrait + linked token art')")).toHaveCount(0);
    expect(await getActorArtInfo(page, linked.actorId)).toEqual(beforeActor);
  } finally {
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("chat media display modes change the chat preview markup", async ({foundryPage: page}, testInfo) => {
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
    expect(thumbnailMessage.content).toContain("foundry-paste-eater-chat-thumbnail");
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
    expect(fullPreviewMessage.content).toContain("foundry-paste-eater-chat-full-preview");
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

test("canvas text paste mode can disable or re-enable note creation", async ({foundryPage: page}, testInfo) => {
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

test("scene paste prompt mode controls whether the scene tool reads directly or opens the prompt", async ({foundryPage: page}, testInfo) => {
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
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeAuto.tiles.length + 1);
    await expect(page.locator("#foundry-paste-eater-scene-paste-prompt")).toHaveCount(0);

    await restoreClipboardRead(page);
    await setModuleSettings(page, {"scene-paste-prompt-mode": "always"});
    await stubClipboardRead(page, [
      {filename: "test-token.png", mimeType: "image/png"},
    ]);
    const beforeAlways = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");
    await expect(page.locator("#foundry-paste-eater-scene-paste-target")).toBeVisible();
    await page.waitForTimeout(300);
    const afterAlways = await getStateSnapshot(page);
    expect(afterAlways.tiles.length).toBe(beforeAlways.tiles.length);
    await page.locator('#foundry-paste-eater-scene-paste-prompt [data-action="cancel"]').click();

    await restoreClipboardRead(page);
    await setModuleSettings(page, {"scene-paste-prompt-mode": "never"});
    await stubClipboardRead(page, [{}]);
    const beforeNever = await getStateSnapshot(page);
    await invokeSceneTool(page, "tiles", "foundry-paste-eater-paste");
    await page.waitForTimeout(300);
    const afterNever = await getStateSnapshot(page);
    expect(afterNever.tiles.length).toBe(beforeNever.tiles.length);
    await expect(page.locator("#foundry-paste-eater-scene-paste-prompt")).toHaveCount(0);
  } finally {
    await restoreClipboardRead(page).catch(() => {});
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});

test("verbose logging controls whether successful workflows emit browser console diagnostics", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo, {verboseLogging: false});
  const previousSettings = await setModuleSettings(page, {
    "verbose-logging": false,
  });
  const messages = [];
  const listener = message => {
    const text = message.text();
    if (text.includes("Foundry Paste Eater [")) messages.push(text);
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

test("upload destination config saves custom folders and uses them for later uploads", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "image-location-source": "data",
    "image-location": "pasted_images",
    "image-location-bucket": "",
  });
  const customFolder = `${run.uploadFolder}/config-ui`;

  try {
    await openUploadDestinationConfig(page);
    const app = page.locator("#foundry-paste-eater-destination-config");
    await app.locator('select[name="source"]').selectOption("data");
    await app.locator('input[name="target"]').fill(customFolder);
    await expect.poll(() => getUploadDestinationSummary(page)).toContain(customFolder);
    await app.locator('button[name="submit"]').click();
    await expect(app).toHaveCount(0);

    const storedSettings = await page.evaluate(() => ({
      source: game.settings.get("foundry-paste-eater", "image-location-source"),
      target: game.settings.get("foundry-paste-eater", "image-location"),
      bucket: game.settings.get("foundry-paste-eater", "image-location-bucket"),
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

test("upload path organization routes canvas, chat, and document-art uploads into context-specific subfolders", async ({foundryPage: page}, testInfo) => {
  const run = await beginClipboardRun(page, testInfo);
  const previousSettings = await setModuleSettings(page, {
    "upload-path-organization": "context-user-month",
  });

  try {
    const canvasPrefix = await getExpectedOrganizedUploadPrefix(page, run.uploadFolder, "canvas");
    const chatPrefix = await getExpectedOrganizedUploadPrefix(page, run.uploadFolder, "chat");
    const documentArtPrefix = await getExpectedOrganizedUploadPrefix(page, run.uploadFolder, "document-art");

    await focusCanvas(page);
    await page.evaluate(() => canvas.tiles.activate());
    await setCanvasMousePosition(page, await getSafeCanvasPoint(page, 49));
    const beforeCanvas = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: ".game",
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).tiles.length).toBe(beforeCanvas.tiles.length + 1);
    const afterCanvas = await getStateSnapshot(page);
    const [canvasTile] = getNewDocuments(beforeCanvas, afterCanvas, "tiles");
    expect(canvasTile.textureSrc).toContain(canvasPrefix);

    const beforeChat = await getStateSnapshot(page);
    await dispatchFilePaste(page, {
      targetSelector: await focusChatInput(page),
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => (await getStateSnapshot(page)).messages.length).toBe(beforeChat.messages.length + 1);
    const afterChat = await getStateSnapshot(page);
    const [chatMessage] = getNewDocuments(beforeChat, afterChat, "messages");
    expect(chatMessage.content).toContain(chatPrefix);

    const actorSheet = await createTemporaryActorPortraitField(page);
    await page.locator(actorSheet.fieldSelector).focus();
    await dispatchFilePaste(page, {
      targetSelector: actorSheet.fieldSelector,
      filename: "test-token.png",
      mimeType: "image/png",
    });
    await expect.poll(async () => page.locator(actorSheet.fieldSelector).inputValue()).toContain(documentArtPrefix);
    await expect.poll(async () => {
      return page.locator(actorSheet.previewSelector).getAttribute("src");
    }).toContain(documentArtPrefix);
  } finally {
    await closeTemporaryActorPortraitFields(page);
    await restoreModuleSettings(page, previousSettings);
    await cleanupClipboardRun(page, run);
  }
});
