import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import defaultsContract from "../shared/defaults-contract.js";
import scenarios from "../shared/behavior-scenarios.js";

const {SUPPORT_CONTRACT} = defaultsContract;
const {READINESS_STATUS_SCENARIOS} = scenarios;

describe("support and readiness helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
    api._clipboardRegisterSettings();
  });

  it("matches the shared readiness section contract", () => {
    const report = api._clipboardGetReadinessReport();
    expect(report.sections.map(section => section.id)).toEqual(SUPPORT_CONTRACT.readinessSectionIds);
  });

  for (const scenario of READINESS_STATUS_SCENARIOS) {
    it(`evaluates readiness status: ${scenario.name}`, () => {
      scenario.customize(env);
      const report = api._clipboardGetReadinessReport();

      if (scenario.expectedStorageStatus) {
        expect(
          report.sections.find(section => section.id === "storage-readiness")
            ?.items.find(item => item.id === "destination")
            ?.status
        ).toBe(scenario.expectedStorageStatus);
      }

      if (scenario.expectedPlayerStatus) {
        expect(
          report.sections.find(section => section.id === "player-upload-readiness")
            ?.items.find(item => item.id === "canvas-role-gate")
            ?.status
        ).toBe(scenario.expectedPlayerStatus);
      }

      if (scenario.expectedDefaultsStatus) {
        expect(
          report.sections.find(section => section.id === "default-profile-drift")
            ?.items.find(item => item.id === "recommended-defaults")
            ?.status
        ).toBe(scenario.expectedDefaultsStatus);
      }
    });
  }

  it("reports the non-s3 and feature-disabled readiness warnings cleanly", () => {
    env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
    env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", false);
    env.settingsValues.set("foundry-paste-eater.image-location-source", "data");

    const report = api._clipboardGetReadinessReport();
    expect(
      report.sections.find(section => section.id === "storage-readiness")
        ?.items.find(item => item.id === "endpoint-visibility")
        ?.status
    ).toBe("pass");
    expect(
      report.sections.find(section => section.id === "player-upload-readiness")
        ?.items.find(item => item.id === "chat-role-gate")
        ?.status
    ).toBe("warn");
    expect(
      report.sections.find(section => section.id === "player-upload-readiness")
        ?.items.find(item => item.id === "scene-controls")
        ?.status
    ).toBe("warn");
  });

  it("creates a sanitized support bundle", () => {
    api._clipboardLog("info", "bundle context", {
      token: "super-secret",
      nested: {
        password: "really-secret",
      },
      url: "https://example.com/media/file.png?X-Amz-Signature=abc123",
    });

    const bundle = api._clipboardCollectSupportBundle();
    expect(Object.keys(bundle)).toEqual(expect.arrayContaining(SUPPORT_CONTRACT.supportBundleKeys));
    expect(bundle.module.id).toBe("foundry-paste-eater");
    expect(bundle.browser.clipboardReadAvailable).toBe(true);

    const serializedBundle = JSON.stringify(bundle);
    expect(serializedBundle).not.toContain("super-secret");
    expect(serializedBundle).not.toContain("really-secret");
    expect(serializedBundle).not.toContain("X-Amz-Signature");
    expect(serializedBundle).toContain("[Redacted]");
    expect(api._clipboardStripUrlSecrets("http://[bad")).toBe("http://[bad");
  });

  it("covers support helper fallbacks and primitive redaction branches", () => {
    const moduleRecord = globalThis.game.modules.get("foundry-paste-eater");
    moduleRecord.version = null;
    moduleRecord.manifest = {version: "9.9.9"};
    expect(api._clipboardGetModuleVersion()).toBe("9.9.9");

    globalThis.game.modules.delete("foundry-paste-eater");
    expect(api._clipboardGetModuleVersion()).toBeNull();
    globalThis.game.modules.set("foundry-paste-eater", moduleRecord);

    const originalClipboard = window.navigator.clipboard;
    const originalSecureContext = globalThis.isSecureContext;
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: false,
    });

    expect(api._clipboardGetBrowserContextSummary()).toMatchObject({
      clipboardReadAvailable: false,
      isSecureContext: false,
    });

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: originalSecureContext,
    });

    expect(api._clipboardStripUrlSecrets("plain text")).toBe("plain text");
    expect(api._clipboardStripUrlSecrets("https://user:secret@example.com/path/file.png?token=abc#hash"))
      .toBe("https://example.com/path/file.png");

    const circular = {};
    circular.self = circular;
    const redacted = api._clipboardRedactSupportSecrets({
      authorization: "super-secret",
      nested: {
        cookie: "cookie-value",
        inline: 'see "https://example.com/file.png?sig=1"',
      },
      values: [1, true, 2n, Symbol("x"), circular, "https://example.com/file.png?sig=1"],
    });

    expect(redacted.authorization).toBe("[Redacted]");
    expect(redacted.nested.cookie).toBe("[Redacted]");
    expect(redacted.nested.inline).toContain("https://example.com/file.png");
    expect(redacted.nested.inline).not.toContain("?sig=1");
    expect(redacted.values[2]).toBe("2");
    expect(redacted.values[3]).toBe("Symbol(x)");
    expect(redacted.values[4].self).toBe("[Circular]");
    expect(redacted.values[5]).toBe("https://example.com/file.png");
  });

  it("downloads the support bundle through saveDataToFile and anchor fallbacks", () => {
    const bundle = api._clipboardCollectSupportBundle();

    const saved = api._clipboardDownloadSupportBundle(bundle);
    expect(saved.filename).toMatch(/^foundry-paste-eater-support-/);
    expect(globalThis.saveDataToFile).toHaveBeenCalledWith(
      expect.stringContaining('"module"'),
      "application/json",
      expect.stringMatching(/^foundry-paste-eater-support-/)
    );

    const createElement = document.createElement.bind(document);
    const click = vi.fn();
    globalThis.saveDataToFile = undefined;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(tagName => {
      const element = createElement(tagName);
      if (tagName === "a") element.click = click;
      return element;
    });

    api._clipboardDownloadSupportBundle(bundle);
    expect(click).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it("returns a support bundle file without trying to download when no download path exists", () => {
    const originalCreateObjectURL = globalThis.URL.createObjectURL;
    globalThis.saveDataToFile = undefined;
    globalThis.URL.createObjectURL = undefined;

    const file = api._clipboardDownloadSupportBundle(api._clipboardCollectSupportBundle());
    expect(file).toMatchObject({
      filename: expect.stringMatching(/^foundry-paste-eater-support-/),
      url: "",
    });

    globalThis.URL.createObjectURL = originalCreateObjectURL;
  });

  it("tracks known upload roots when the configured destination changes", async () => {
    const app = new env.runtime.FoundryPasteEaterDestinationConfig();
    await app._updateObject(null, {
      source: "s3",
      target: "campaign-assets",
      bucket: "party-art",
    });

    const roots = api._clipboardGetKnownUploadRoots();
    expect(roots).toEqual(expect.arrayContaining([
      expect.objectContaining({
        target: "pasted_images",
      }),
      expect.objectContaining({
        storedSource: "s3",
        source: "s3",
        target: "campaign-assets",
        bucket: "party-art",
      }),
    ]));
  });

  it("parses invalid known-upload-root data safely and avoids rewriting unchanged root sets", async () => {
    env.settingsValues.set("foundry-paste-eater.known-upload-roots", "not-json");
    expect(api._clipboardGetKnownUploadRoots()).toEqual([]);
    expect(api._clipboardNormalizeUploadRoot(null)).toBeNull();
    expect(api._clipboardParseKnownUploadRoots("{}")).toEqual([]);
    expect(api._clipboardCreateUploadRootKey({storedSource: "", source: "", bucket: "", target: ""})).toBe("data||");
    expect(api._clipboardSerializeKnownUploadRoots([null, {target: ""}])).toBe("[]");
    expect(api._clipboardMergeKnownUploadRoots([], [null, {target: ""}])).toEqual([]);

    await api._clipboardSetKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "stable-root",
      bucket: "",
      endpoint: "",
    }]);
    const callsAfterSet = globalThis.game.settings.set.mock.calls.length;
    await api._clipboardRememberKnownUploadRoot({
      storedSource: "data",
      source: "data",
      target: "stable-root",
      bucket: "",
      endpoint: "",
    });
    expect(globalThis.game.settings.set.mock.calls).toHaveLength(callsAfterSet);
  });

  it("covers known-upload-root normalization and persistence branches", async () => {
    expect(api._clipboardParseKnownUploadRoots("")).toEqual([]);
    expect(api._clipboardNormalizeUploadRoot({
      storedSource: " forge ",
      target: "\\nested//folder\\",
      bucket: " bucket-a ",
      endpoint: " https://cdn.example.com/base ",
    })).toMatchObject({
      storedSource: "forge",
      source: "forge",
      target: "nested/folder",
      bucket: "bucket-a",
      endpoint: "https://cdn.example.com/base",
    });

    expect(api._clipboardSerializeKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "/root//media/",
      bucket: "",
      endpoint: "",
    }])).toContain('"target":"root/media"');

    await api._clipboardSetKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "stored-root",
      bucket: "",
      endpoint: "",
    }]);

    env.settingsValues.set("foundry-paste-eater.image-location", "current-root");
    expect(api._clipboardGetKnownUploadRoots()).toEqual([
      expect.objectContaining({target: "stored-root"}),
    ]);
    expect(api._clipboardGetKnownUploadRoots({includeCurrent: true})).toEqual(expect.arrayContaining([
      expect.objectContaining({target: "stored-root"}),
      expect.objectContaining({target: "current-root"}),
    ]));

    const setCallCount = globalThis.game.settings.set.mock.calls.length;
    await api._clipboardRememberKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "new-root",
      bucket: "",
      endpoint: "",
    }]);
    expect(globalThis.game.settings.set.mock.calls).toHaveLength(setCallCount + 1);
  });

  it("returns empty stored upload roots when settings access is unavailable", () => {
    const originalSettings = globalThis.game.settings;
    globalThis.game.settings = {};

    expect(api._clipboardGetStoredKnownUploadRoots()).toEqual([]);
    expect(api._clipboardMergeKnownUploadRoots(undefined, undefined)).toEqual([]);

    globalThis.game.settings = originalSettings;
  });

  it("collects a reference-based uploaded media audit across actors, scenes, notes, and chat", async () => {
    await globalThis.game.settings.set("foundry-paste-eater", "image-location", "audit-root");
    await api._clipboardSetKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "audit-root",
      bucket: "",
      endpoint: "",
    }]);

    const actor = env.createActor({
      name: "Hero",
      img: "audit-root/document-art/user-1/2026-04/portrait.png",
      prototypeToken: {
        texture: {
          src: "audit-root/document-art/user-1/2026-04/token.png",
        },
      },
    });
    globalThis.canvas.scene.tokens.contents.push(env.createPlaceableDocument("Token", {
      id: "token-1",
      name: "Scene Hero",
      texture: {src: "audit-root/canvas/user-1/2026-04/scene-token.png"},
      actor,
    }));
    globalThis.canvas.scene.tiles.contents.push(env.createPlaceableDocument("Tile", {
      id: "tile-1",
      name: "Map Tile",
      texture: {src: "audit-root/canvas/user-1/2026-04/tile.png"},
    }));
    globalThis.canvas.scene.notes.contents.push(env.createPlaceableDocument("Note", {
      id: "note-1",
      text: "Scene Note",
      texture: {src: "audit-root/canvas/user-1/2026-04/note-icon.png"},
    }));
    globalThis.game.messages.contents.push({
      id: "message-1",
      speaker: {alias: "GM"},
      content: api._clipboardCreateChatMediaContent("audit-root/chat/user-1/2026-04/chat.png"),
    });

    const report = api._clipboardCollectMediaAuditReport();
    expect(report.summary.referenceCount).toBe(6);
    expect(report.groups.map(group => group.context)).toEqual(expect.arrayContaining([
      "canvas",
      "chat",
      "document-art",
    ]));
    expect(report.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentType: "Actor",
        field: "img",
        context: "document-art",
      }),
      expect.objectContaining({
        documentType: "ChatMessage",
        context: "chat",
      }),
      expect.objectContaining({
        documentType: "Token",
        context: "canvas",
      }),
    ]));
  });

  it("covers audit helper fallbacks and JSON download paths", () => {
    expect(api._clipboardNormalizeAuditPath("https://example.com/root/file.png?token=1")).toBe("root/file.png");
    expect(api._clipboardNormalizeAuditPath("http://[bad")).toBe("http://[bad");
    expect(api._clipboardMatchUploadRoot("other-root/file.png", api._clipboardGetKnownUploadRoots())).toBeNull();
    expect(api._clipboardInferAuditContext("audit-root/other/file.png", {
      target: "audit-root",
    }, "canvas")).toBe("canvas");
    expect(api._clipboardCollectChatMessagePaths({content: "<p>plain text</p>"})).toEqual([]);
    expect(api._clipboardCreateAuditReference({
      path: "audit-root/file.png",
      documentType: "Tile",
      documentId: "tile-1",
      documentName: "Tile",
      field: "texture.src",
      uploadRoot: null,
      fallbackContext: "canvas",
    })).toBeNull();
    expect(api._clipboardCollectDocumentMediaReferences({
      texture: {src: "untracked/file.png"},
    }, [], {
      documentType: "Tile",
      documentId: "tile-1",
      documentName: "Tile",
      field: "texture.src",
      fallbackContext: "canvas",
    })).toEqual([]);

    const report = api._clipboardCollectMediaAuditReport();
    const file = api._clipboardCreateMediaAuditFile(report);
    expect(file.filename).toMatch(/^foundry-paste-eater-media-audit-/);
    expect(file.content).toContain('"summary"');

    const saved = api._clipboardDownloadMediaAuditReport(report);
    expect(saved.filename).toMatch(/^foundry-paste-eater-media-audit-/);
    expect(globalThis.saveDataToFile).toHaveBeenCalledWith(
      expect.stringContaining('"summary"'),
      "application/json",
      expect.stringMatching(/^foundry-paste-eater-media-audit-/)
    );

    const originalCreateObjectURL = globalThis.URL.createObjectURL;
    const createElement = document.createElement.bind(document);
    const click = vi.fn();
    globalThis.saveDataToFile = undefined;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(tagName => {
      const element = createElement(tagName);
      if (tagName === "a") element.click = click;
      return element;
    });

    api._clipboardDownloadMediaAuditReport(report);
    expect(click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    globalThis.URL.createObjectURL = undefined;
    const noDownloadFile = api._clipboardDownloadMediaAuditReport(report);
    expect(noDownloadFile.url).toBe("");
    globalThis.URL.createObjectURL = originalCreateObjectURL;
  });

  it("covers media-audit helper edge cases and fallback document labels", async () => {
    await api._clipboardSetKnownUploadRoots([{
      storedSource: "data",
      source: "data",
      target: "audit-root",
      bucket: "",
      endpoint: "",
    }]);

    expect(api._clipboardNormalizeAuditPath(" \\audit-root\\chat\\user-1\\image.png?x=1#hash "))
      .toBe("audit-root/chat/user-1/image.png");
    expect(api._clipboardMatchUploadRoot("audit-root", api._clipboardGetKnownUploadRoots()))
      .toMatchObject({target: "audit-root"});
    expect(api._clipboardInferAuditContext("audit-root/chat/user-1/image.png", {
      target: "audit-root",
    }, "canvas")).toBe("chat");
    expect(api._clipboardCollectChatMessagePaths({
      content: `
        <figure class="foundry-paste-eater-chat-message">
          <img src="audit-root/chat/user-1/image.png">
          <a href="audit-root/chat/user-1/image.png">dup</a>
          <video src="audit-root/chat/user-1/clip.webm"></video>
        </figure>
      `,
    })).toEqual([
      "audit-root/chat/user-1/image.png",
      "audit-root/chat/user-1/clip.webm",
    ]);
    expect(api._clipboardCreateAuditReference({
      path: "   ",
      documentType: "Tile",
      documentId: "tile-1",
      documentName: "Tile",
      field: "texture.src",
      uploadRoot: {key: "data||audit-root", label: "User Data / audit-root", target: "audit-root"},
      fallbackContext: "canvas",
    })).toBeNull();
    expect(api._clipboardCollectDocumentMediaReferences({
      img: "audit-root/document-art/user-1/portrait.png",
    }, api._clipboardGetKnownUploadRoots(), {
      documentType: "Actor",
      documentId: "actor-1",
      documentName: "Actor",
      field: "img",
      fallbackContext: "document-art",
    })).toEqual([
      expect.objectContaining({
        documentType: "Actor",
        context: "document-art",
      }),
    ]);

    const fallbackActor = env.createActor({
      id: "actor-fallback",
      name: "",
      img: "audit-root/document-art/user-1/portrait-fallback.png",
      prototypeToken: {
        texture: {
          src: "",
        },
      },
    });
    fallbackActor.name = "";
    fallbackActor.prototypeToken.texture.src = "";

    const fallbackToken = env.createPlaceableDocument("Token", {
      id: "token-fallback",
      name: "",
      texture: {src: "audit-root/canvas/user-1/token-fallback.png"},
    });
    fallbackToken.name = "";

    const fallbackTile = env.createPlaceableDocument("Tile", {
      id: "tile-fallback",
      name: "",
      texture: {src: "audit-root/canvas/user-1/tile-fallback.png"},
    });
    fallbackTile.name = "";

    const fallbackNote = env.createPlaceableDocument("Note", {
      id: "note-fallback",
      name: "Fallback Note",
      text: "",
      texture: {src: "audit-root/canvas/user-1/note-fallback.png"},
    });

    globalThis.game.scenes.contents.push({
      id: "",
      name: "",
      tokens: {
        contents: [fallbackToken],
      },
      tiles: {
        contents: [fallbackTile],
      },
      notes: {
        contents: [fallbackNote],
      },
    });
    globalThis.game.messages.contents.push({
      id: "message-fallback",
      speaker: {},
      content: api._clipboardCreateChatMediaContent("audit-root/chat/user-1/chat-fallback.png"),
    });

    const report = api._clipboardCollectMediaAuditReport();
    expect(report.references).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentId: "actor-fallback",
        documentName: "actor-fallback",
      }),
      expect.objectContaining({
        documentId: "token-fallback",
        documentName: "token-fallback",
        sceneId: null,
        sceneName: null,
      }),
      expect.objectContaining({
        documentId: "tile-fallback",
        documentName: "tile-fallback",
      }),
      expect.objectContaining({
        documentId: "note-fallback",
        documentName: "Fallback Note",
      }),
      expect.objectContaining({
        documentId: "message-fallback",
        documentName: "message-fallback",
      }),
    ]));
  });

  it("covers readiness helper branches across insecure, s3, and player-fail states", () => {
    const originalClipboard = window.navigator.clipboard;
    const originalSecureContext = globalThis.isSecureContext;
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: false,
    });

    const clientSection = api._clipboardEvaluateClientCapabilitySection();
    expect(clientSection.items.map(item => item.status)).toEqual(["warn", "warn"]);

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: originalSecureContext,
    });

    env.settingsValues.set("foundry-paste-eater.image-location-source", "s3");
    env.settingsValues.set("foundry-paste-eater.image-location-bucket", "");
    env.settingsValues.set("foundry-paste-eater.upload-path-organization", "flat");
    globalThis.game.data.files.s3.endpoint = {
      url: " https://cdn.example.com/base ",
    };

    const storageSection = api._clipboardEvaluateStorageReadinessSection();
    expect(storageSection.items.find(item => item.id === "destination")?.status).toBe("fail");
    expect(storageSection.items.find(item => item.id === "endpoint-visibility")?.status).toBe("pass");
    expect(storageSection.items.find(item => item.id === "upload-organization")?.status).toBe("warn");

    env.settingsValues.set("foundry-paste-eater.enable-chat-media", true);
    env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", true);
    env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", true);
    env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", false);
    env.settingsValues.set("core.permissions", {
      FILES_BROWSE: [4],
      FILES_UPLOAD: [4],
    });

    const playerSection = api._clipboardEvaluatePlayerUploadSection();
    expect(playerSection.items.map(item => item.status)).toEqual(["fail", "fail", "fail"]);
  });

  it("covers support and audit download early returns when serialization is empty", () => {
    const stringifySpy = vi.spyOn(JSON, "stringify").mockReturnValue("");

    const supportFile = api._clipboardDownloadSupportBundle({generatedAt: "2026-04-07T00:00:00.000Z"});
    const auditFile = api._clipboardDownloadMediaAuditReport({generatedAt: "2026-04-07T00:00:00.000Z"});

    expect(supportFile.content).toBe("");
    expect(auditFile.content).toBe("");
    expect(globalThis.saveDataToFile).not.toHaveBeenCalled();

    stringifySpy.mockRestore();
  });

  it("collects support bundles with null foundry and world fallbacks", () => {
    globalThis.game.release.version = "";
    globalThis.game.version = "";
    globalThis.game.world.id = "";
    globalThis.game.world.title = "";

    const bundle = api._clipboardCollectSupportBundle();
    expect(bundle.foundry.version).toBeNull();
    expect(bundle.world).toEqual({id: null, title: null});
  });

  it("exposes the read-only support api on the active module record after ready", async () => {
    await env.onceHandlers.init?.();
    await env.onceHandlers.ready?.();

    const runtimeApi = globalThis.game.modules.get("foundry-paste-eater")?.api;
    expect(runtimeApi).toBeTruthy();
    expect(Object.keys(runtimeApi)).toEqual(expect.arrayContaining(SUPPORT_CONTRACT.runtimeApiMethods));
    expect(runtimeApi.getReadinessReport().sections.map(section => section.id)).toEqual(SUPPORT_CONTRACT.readinessSectionIds);
  });

  it("covers support app handlers and runtime api registration fallback", async () => {
    const readinessApp = new api.FoundryPasteEaterReadinessSupportConfig();
    const auditApp = new api.FoundryPasteEaterUploadedMediaAuditConfig();
    expect(readinessApp.getData().sections).toHaveLength(4);
    expect(auditApp.getData().summary).toBeTruthy();

    const selectorCalls = [];
    const html = {
      find: selector => ({
        on: (_eventName, callback) => {
          selectorCalls.push({selector, callback});
        },
      }),
    };

    readinessApp.activateListeners(html);
    auditApp.activateListeners(html);
    expect(selectorCalls.map(entry => entry.selector)).toEqual(expect.arrayContaining([
      '[data-action="open-upload-destination"]',
      '[data-action="open-recommended-defaults"]',
      '[data-action="download-support-bundle"]',
      '[data-action="download-media-audit"]',
    ]));

    const event = {preventDefault: vi.fn()};
    await readinessApp._onOpenUploadDestination(event);
    expect(globalThis.ui.windows["foundry-paste-eater-destination-config"]).toBeTruthy();
    await readinessApp._onOpenRecommendedDefaults(event);
    expect(env.dialogInstances.at(-1)?.data?.title).toContain("Apply Recommended Defaults");
    readinessApp._onDownloadSupportBundle(event);
    auditApp._onDownloadMediaAudit(event);
    expect(globalThis.ui.notifications.info).toHaveBeenCalledWith("Foundry Paste Eater: Downloaded a support bundle.");
    expect(globalThis.ui.notifications.info).toHaveBeenCalledWith("Foundry Paste Eater: Downloaded the uploaded media audit report.");

    const moduleRecord = globalThis.game.modules.get("foundry-paste-eater");
    globalThis.game.modules.delete("foundry-paste-eater");
    expect(api._clipboardRegisterRuntimeApi()).toBeNull();
    globalThis.game.modules.set("foundry-paste-eater", moduleRecord);
    const createdApi = api._clipboardCreateRuntimeApi();
    expect(createdApi.collectSupportBundle().module.id).toBe("foundry-paste-eater");
    expect(createdApi.collectMediaAuditReport().summary).toBeTruthy();
  });
});
