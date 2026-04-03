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
