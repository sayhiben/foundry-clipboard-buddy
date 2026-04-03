const {test: base, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  buildSharedFoundryTest,
  cleanupClipboardRun,
  closeReadinessSupportConfig,
  closeUploadedMediaAuditConfig,
  closeUploadDestinationConfig,
  openReadinessSupportConfig,
  openUploadedMediaAuditConfig,
  restoreModuleSettings,
  setModuleSettings,
} = require("./helpers/foundry");

const GM_CREDENTIALS = {
  user: process.env.FOUNDRY_GM_USER || "Clipboard QA 1",
  password: process.env.FOUNDRY_GM_PASSWORD ?? "",
};

const test = buildSharedFoundryTest(base, GM_CREDENTIALS, {acceptDownloads: true});

test.describe.configure({mode: "serial"});

async function captureClipboardUi(page) {
  await page.evaluate(() => {
    window.__clipboardUi = {
      dialogs: [],
      downloads: [],
    };

    if (!window.__clipboardDialogWrapped && typeof globalThis.Dialog === "function") {
      const OriginalDialog = globalThis.Dialog;
      globalThis.Dialog = class ClipboardSupportDialog extends OriginalDialog {
        constructor(data, ...args) {
          window.__clipboardUi.dialogs.push({
            title: String(data?.title || ""),
            content: String(data?.content || ""),
          });
          super(data, ...args);
        }
      };
      window.__clipboardDialogWrapped = true;
    }

    if (!window.__clipboardSaveDataWrapped && typeof globalThis.saveDataToFile === "function") {
      const originalSaveDataToFile = globalThis.saveDataToFile.bind(globalThis);
      globalThis.saveDataToFile = (content, mimeType, filename) => {
        window.__clipboardUi.downloads.push({
          filename: String(filename || ""),
          mimeType: String(mimeType || ""),
          content: String(content || ""),
        });
        return originalSaveDataToFile(content, mimeType, filename);
      };
      window.__clipboardSaveDataWrapped = true;
    }
  });
}

async function getClipboardUi(page) {
  return page.evaluate(() => ({
    dialogs: [...(window.__clipboardUi?.dialogs || [])],
    downloads: [...(window.__clipboardUi?.downloads || [])],
  }));
}

async function resetClipboardUi(page) {
  await page.evaluate(() => {
    if (!window.__clipboardUi) return;
    window.__clipboardUi.dialogs = [];
    window.__clipboardUi.downloads = [];
  });
}

async function seedAuditFixtures(page) {
  await page.evaluate(async () => {
    await game.settings.set("foundry-paste-eater", "image-location-source", "data");
    await game.settings.set("foundry-paste-eater", "image-location", "audit-browser-root");
    await game.settings.set("foundry-paste-eater", "image-location-bucket", "");
    await game.settings.set("foundry-paste-eater", "known-upload-roots", JSON.stringify([{
      storedSource: "data",
      source: "data",
      target: "audit-browser-root",
      bucket: "",
      endpoint: "https://storage.example.com/root?token=secret",
    }]));

    const ActorDocument = globalThis.Actor || foundry.documents.Actor;
    const actor = await ActorDocument.create({
      name: "Audit Hero",
      type: CONFIG.Actor.defaultType || game.system.documentTypes.Actor?.[0] || "character",
      img: "audit-browser-root/document-art/user-1/2026-04/portrait.png",
      prototypeToken: {
        texture: {
          src: "audit-browser-root/document-art/user-1/2026-04/token.png",
        },
      },
    });

    await canvas.scene.createEmbeddedDocuments("Token", [{
      actorId: actor.id,
      actorLink: true,
      name: "Audit Token",
      texture: {src: "audit-browser-root/canvas/user-1/2026-04/token-scene.png"},
      width: 1,
      height: 1,
      x: 100,
      y: 100,
    }]);
    await canvas.scene.createEmbeddedDocuments("Tile", [{
      name: "Audit Tile",
      texture: {src: "audit-browser-root/canvas/user-1/2026-04/tile.png"},
      width: 200,
      height: 200,
      x: 400,
      y: 100,
    }]);
    await canvas.scene.createEmbeddedDocuments("Note", [{
      entryId: null,
      pageId: null,
      text: "Audit Note",
      x: 700,
      y: 100,
      texture: {src: "audit-browser-root/canvas/user-1/2026-04/note.png"},
    }]);
    await foundry.documents.ChatMessage.create({
      content: '<figure class="foundry-paste-eater-chat-message"><a href="audit-browser-root/chat/user-1/2026-04/chat.png">Open full media</a></figure>',
      speaker: foundry.documents.ChatMessage.getSpeaker(),
      user: game.user.id,
    });
  });
}

test("Readiness & Support renders expected statuses and launches existing configuration flows", async ({foundryPage: page}, testInfo) => {
  let run = null;
  let previousSettings = null;

  try {
    await captureClipboardUi(page);
    run = await beginClipboardRun(page, testInfo);
    previousSettings = await setModuleSettings(page, {
      "canvas-text-paste-mode": "scene-notes",
    });

    await openReadinessSupportConfig(page);
    await expect(page.locator("#foundry-paste-eater-readiness-support")).toContainText("Client capability");
    await expect(page.locator("#foundry-paste-eater-readiness-support")).toContainText("Storage readiness");
    await expect(page.locator("#foundry-paste-eater-readiness-support")).toContainText("Player upload readiness");
    await expect(page.locator("#foundry-paste-eater-readiness-support")).toContainText("Default-profile drift");
    await expect(page.locator("#foundry-paste-eater-readiness-support [data-action='open-upload-destination']")).toBeVisible();
    await expect(page.locator("#foundry-paste-eater-readiness-support [data-action='open-recommended-defaults']")).toBeVisible();
    await expect(page.locator("#foundry-paste-eater-readiness-support [data-action='download-support-bundle']")).toBeVisible();

    await page.click("#foundry-paste-eater-readiness-support [data-action='open-upload-destination']");
    await expect(page.locator("#foundry-paste-eater-destination-config")).toBeVisible();
    await closeUploadDestinationConfig(page);

    await resetClipboardUi(page);
    await page.click("#foundry-paste-eater-readiness-support [data-action='open-recommended-defaults']");
    await expect.poll(async () => (await getClipboardUi(page)).dialogs.length > 0).toBe(true);
    const uiState = await getClipboardUi(page);
    expect(uiState.dialogs.at(-1).title).toContain("Apply Recommended Defaults");
  } finally {
    if (previousSettings) await restoreModuleSettings(page, previousSettings);
    await closeUploadDestinationConfig(page).catch(() => {});
    await closeReadinessSupportConfig(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("Readiness & Support downloads a sanitized support bundle", async ({foundryPage: page}, testInfo) => {
  let run = null;

  try {
    await captureClipboardUi(page);
    run = await beginClipboardRun(page, testInfo);
    await page.evaluate(() => game.settings.set("foundry-paste-eater", "known-upload-roots", JSON.stringify([{
      storedSource: "data",
      source: "data",
      target: "bundle-root",
      bucket: "",
      endpoint: "https://storage.example.com/root?token=secret",
    }])));

    await openReadinessSupportConfig(page);
    await resetClipboardUi(page);
    await page.click("#foundry-paste-eater-readiness-support [data-action='download-support-bundle']");

    await expect.poll(async () => (await getClipboardUi(page)).downloads.length > 0).toBe(true);
    const uiState = await getClipboardUi(page);
    expect(uiState.downloads.at(-1).filename).toMatch(/^foundry-paste-eater-support-/);
    expect(uiState.downloads.at(-1).mimeType).toBe("application/json");
    expect(uiState.downloads.at(-1).content).toContain('"module"');
    expect(uiState.downloads.at(-1).content).not.toContain("token=secret");
    expect(uiState.downloads.at(-1).content).toContain("https://storage.example.com/root");
  } finally {
    await closeReadinessSupportConfig(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});

test("Uploaded Media Audit renders grouped referenced media and exports JSON", async ({foundryPage: page}, testInfo) => {
  let run = null;

  try {
    await captureClipboardUi(page);
    run = await beginClipboardRun(page, testInfo);
    await seedAuditFixtures(page);

    await openUploadedMediaAuditConfig(page);
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("Audit Summary");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("audit-browser-root");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("document-art");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("chat");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("canvas");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("Audit Hero");
    await expect(page.locator("#foundry-paste-eater-uploaded-media-audit")).toContainText("tile.png");

    await resetClipboardUi(page);
    await page.click("#foundry-paste-eater-uploaded-media-audit [data-action='download-media-audit']");
    await expect.poll(async () => (await getClipboardUi(page)).downloads.length > 0).toBe(true);
    const uiState = await getClipboardUi(page);
    expect(uiState.downloads.at(-1).filename).toMatch(/^foundry-paste-eater-media-audit-/);
    expect(uiState.downloads.at(-1).content).toContain('"referenceCount"');
    expect(uiState.downloads.at(-1).content).toContain("audit-browser-root");
  } finally {
    await closeUploadedMediaAuditConfig(page).catch(() => {});
    await cleanupClipboardRun(page, run);
  }
});
