import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createDataTransfer, flush, setInputClickBehavior, withMockImage} from "./spec-helpers.js";

describe("ui and hook integration helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
    env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "active-layer");
    env.settingsValues.set("foundry-paste-eater.create-backing-actors", true);
    env.settingsValues.set("foundry-paste-eater.pasted-token-actor-type", "system-default");
    env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "scene-notes");
    env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "scene-only");
    env.settingsValues.set("foundry-paste-eater.upload-path-organization", "flat");
  });

  describe("file chooser helpers", () => {
    it("resolves with a selected file", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardChooseImageFile()).resolves.toBeInstanceOf(File);
      restoreClick();
    });

    it("returns null when the picker closes without a selection", async () => {
      const restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
      });

      await expect(api._clipboardChooseImageFile()).resolves.toBeNull();
      restoreClick();
    });

    it("returns null when the picker dispatches a cancel event", async () => {
      const restoreClick = setInputClickBehavior(input => {
        input.dispatchEvent(new Event("cancel"));
      });

      await expect(api._clipboardChooseImageFile()).resolves.toBeNull();
      restoreClick();
    });

    it("keeps a real selection when change arrives after window focus returns", async () => {
      const restoreClick = setInputClickBehavior(input => {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
        window.setTimeout(() => {
          Object.defineProperty(input, "files", {
            configurable: true,
            value: [new File(["x"], "late-picked.png", {type: "image/png"})],
          });
          input.dispatchEvent(new Event("change"));
        }, 0);
      });

      await expect(api._clipboardChooseImageFile()).resolves.toMatchObject({name: "late-picked.png"});
      restoreClick();
    });

    it("delegates selected files to a custom media handler", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      const handler = vi.fn(async file => file.name);
      await expect(api._clipboardChooseAndHandleMediaFile({
        emptyMessage: "no file",
        selectedMessage: "selected",
        handler,
      })).resolves.toBe("picked.png");
      restoreClick();
    });

    it("returns false when the media chooser closes without a selection", async () => {
      const restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
      });

      await expect(api._clipboardChooseAndHandleMediaFile({
        emptyMessage: "no file",
        selectedMessage: "selected",
        handler: vi.fn(),
      })).resolves.toBe(false);
      restoreClick();
    });
  });

  describe("scene and chat actions", () => {
    it("opens the scene upload picker", async () => {
      const restoreImage = withMockImage();
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardOpenUploadPicker()).resolves.toBe(true);
      restoreClick();
      restoreImage();
    });

    it("opens the chat upload picker", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardOpenChatUploadPicker()).resolves.toBe(true);
      restoreClick();
    });

    it("detects focused actor, item, and token art fields", () => {
      const actorRoot = document.createElement("section");
      actorRoot.dataset.appid = "actor-sheet";
      actorRoot.innerHTML = '<input type="text" name="img">';
      document.body.append(actorRoot);
      globalThis.ui.windows["actor-sheet"] = {object: {documentName: "Actor"}};

      const itemRoot = document.createElement("section");
      itemRoot.dataset.appid = "item-sheet";
      itemRoot.innerHTML = '<input type="text" name="img">';
      document.body.append(itemRoot);
      globalThis.ui.windows["item-sheet"] = {object: {documentName: "Item"}};

      const tokenRoot = document.createElement("section");
      tokenRoot.dataset.appid = "token-config";
      tokenRoot.innerHTML = '<input type="text" name="texture.src"><input type="text" name="prototypeToken.texture.src">';
      document.body.append(tokenRoot);
      globalThis.ui.windows["token-config"] = {object: {documentName: "Token"}};

      expect(api._clipboardGetFocusedArtFieldTarget(actorRoot.querySelector('input[name="img"]'))).toMatchObject({
        fieldName: "img",
        documentName: "Actor",
        mediaKinds: ["image"],
      });
      expect(api._clipboardGetFocusedArtFieldTarget(itemRoot.querySelector('input[name="img"]'))).toMatchObject({
        fieldName: "img",
        documentName: "Item",
        mediaKinds: ["image"],
      });
      expect(api._clipboardGetFocusedArtFieldTarget(tokenRoot.querySelector('input[name="texture.src"]'))).toMatchObject({
        fieldName: "texture.src",
        documentName: "Token",
        mediaKinds: ["image", "video"],
      });
      expect(api._clipboardGetFocusedArtFieldTarget(tokenRoot.querySelector('input[name="prototypeToken.texture.src"]'))).toMatchObject({
        fieldName: "prototypeToken.texture.src",
        documentName: "Token",
        mediaKinds: ["image", "video"],
      });
    });

    it("ignores unsupported editable texture fields instead of routing them to canvas", async () => {
      const tileRoot = document.createElement("section");
      tileRoot.dataset.appid = "tile-config";
      tileRoot.innerHTML = '<input type="text" name="texture.src" value="tiles/original.png">';
      document.body.append(tileRoot);
      globalThis.ui.windows["tile-config"] = {object: {documentName: "Tile"}};
      const field = tileRoot.querySelector('input[name="texture.src"]');
      field.focus();

      const file = new File(["x"], "tile-replacement.png", {type: "image/png"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      field.dispatchEvent(event);
      await flush();

      expect(field.value).toBe("tiles/original.png");
      expect(event.defaultPrevented).toBe(false);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("routes pasted media into a focused art field before canvas handling", async () => {
      const restoreImage = withMockImage();
      const actorRoot = document.createElement("section");
      actorRoot.dataset.appid = "actor-sheet";
      actorRoot.innerHTML = '<input type="text" name="img"><img data-edit="img" src="">';
      document.body.append(actorRoot);
      globalThis.ui.windows["actor-sheet"] = {object: {documentName: "Actor"}};
      const field = actorRoot.querySelector('input[name="img"]');
      field.focus();

      const file = new File(["x"], "portrait.png", {type: "image/png"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      field.dispatchEvent(event);
      await flush();

      expect(field.value).toMatch(/^pasted_images\/portrait-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
      restoreImage();
    });

    it("routes pasted PDFs into focused PDF Journal page source fields before canvas handling", async () => {
      const root = document.createElement("form");
      root.id = "JournalEntryPageConfig-4";
      root.className = "application sheet journal-page";
      root.innerHTML = '<file-picker name="src"><input type="text" value=""></file-picker>';
      document.body.append(root);
      const page = env.createPage({type: "pdf"});
      page.documentName = "JournalEntryPage";
      globalThis.foundry.applications.instances = new Map([[root.id, {
        id: root.id,
        object: page,
      }]]);
      const field = root.querySelector("input");
      field.focus();

      const file = new File(["pdf"], "focused.pdf", {type: "application/pdf"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      field.dispatchEvent(event);
      await flush();

      expect(field.value).toMatch(/^pasted_images\/focused-\d+\.pdf\?foundry-paste-eater=\d+$/);
      expect(event.defaultPrevented).toBe(true);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("ignores pasted PDFs in unsupported editable fields", async () => {
      const root = document.createElement("section");
      root.dataset.appid = "actor-sheet-pdf";
      root.innerHTML = '<input type="text" name="src" value="original">';
      document.body.append(root);
      globalThis.ui.windows["actor-sheet-pdf"] = {object: {documentName: "Actor"}};
      const field = root.querySelector("input");
      field.focus();

      const file = new File(["pdf"], "ignored.pdf", {type: "application/pdf"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      field.dispatchEvent(event);
      await flush();

      expect(field.value).toBe("original");
      expect(event.defaultPrevented).toBe(false);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("warns when direct scene paste is unavailable", () => {
      const originalClipboard = window.navigator.clipboard;
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {},
      });

      api._clipboardHandleScenePasteAction();
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Foundry Paste Eater: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media, PDF, or Audio tool instead."
      );
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });
    });

    it("runs the direct scene paste action", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      api._clipboardHandleScenePasteAction();
      await flush();
      restoreImage();
    });

    it("opens the scene paste prompt when direct reads cannot return media", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([{types: []}]);

      api._clipboardHandleScenePasteToolClick();
      await flush();

      const prompt = api._clipboardGetScenePastePrompt();
      expect(prompt).toBeTruthy();
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("not exposed to direct clipboard reads");
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("supports always-show prompt mode for the scene paste tool", async () => {
      env.settingsValues.set("foundry-paste-eater.scene-paste-prompt-mode", "always");
      api._clipboardHandleScenePasteToolClick();
      await flush();

      expect(window.navigator.clipboard.read).not.toHaveBeenCalled();
      expect(api._clipboardGetScenePastePrompt()).toBeTruthy();
      api._clipboardCloseScenePastePrompt();
    });

    it("omits the upload button from the scene paste prompt when uploads are disabled", () => {
      env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", false);
      const prompt = api._clipboardOpenScenePastePrompt();

      expect(prompt.querySelector('[data-action="upload"]')).toBeNull();
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("supports direct-read-only scene paste tool mode", async () => {
      env.settingsValues.set("foundry-paste-eater.scene-paste-prompt-mode", "never");
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      expect(api._clipboardHandleScenePasteToolClick()).toBe(true);
      await flush();

      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("handles media pasted into the scene paste prompt", async () => {
      const restoreImage = withMockImage();
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const file = new File(["x"], "prompt.png", {type: "image/png"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalled();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("handles PDFs pasted into the scene paste prompt", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const file = new File(["pdf"], "prompt.pdf", {type: "application/pdf"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          text: "prompt",
        }),
      ]);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("handles audio pasted into the scene paste prompt", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const file = new File(["audio"], "prompt.mp3", {type: "audio/mpeg"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/mpeg",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      env.dialogInstances.at(-1).data.close();
      await flush();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("AmbientSound", [
        expect.objectContaining({
          name: "prompt",
          path: expect.stringMatching(/^pasted_images\/prompt-\d+\.mp3\?foundry-paste-eater=\d+$/),
        }),
      ]);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("keeps the scene paste prompt open for unsupported pasted content", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          data: {"text/plain": "not-media"},
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Foundry Paste Eater: No supported media, PDF, or audio was found in that paste."
      );
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("closes the scene paste prompt when paste handling returns false", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const file = new File(["x"], "prompt.png", {type: "image/png"});
      api._clipboardSetRuntimeState({locked: true});

      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(prompt.querySelector("[data-role='message']").textContent).toContain("Paste did not create media");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);
      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("keeps the scene paste prompt open when PDF handling returns false", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#foundry-paste-eater-scene-paste-target");
      const file = new File(["pdf"], "prompt.pdf", {type: "application/pdf"});
      api._clipboardSetRuntimeState({locked: true});

      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(prompt.querySelector("[data-role='message']").textContent).toContain("Paste did not create a PDF note");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);
      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("updates the scene paste prompt when direct reads are unavailable", async () => {
      const originalClipboard = window.navigator.clipboard;
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {},
      });

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("Direct clipboard reads are unavailable");

      api._clipboardCloseScenePastePrompt(prompt);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });
    });

    it("keeps the scene paste prompt open when direct reads return no clipboard items", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([]);

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not return usable media");
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("does not create media when the scene paste prompt is closed before direct-read resolves", async () => {
      let resolveClipboardRead;
      window.navigator.clipboard.read.mockImplementationOnce(() => new Promise(resolve => {
        resolveClipboardRead = resolve;
      }));

      const prompt = api._clipboardOpenScenePastePrompt();
      const pending = api._clipboardTryScenePastePromptDirectRead(prompt);
      api._clipboardCloseScenePastePrompt(prompt);
      resolveClipboardRead([{types: ["image/png"]}]);

      await expect(pending).resolves.toBe(false);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("closes the scene paste prompt when direct read media succeeds", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(true);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("closes the scene paste prompt when direct read PDF succeeds", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["application/pdf"], getType: async () => new File(["pdf"], "direct.pdf", {type: "application/pdf"})},
      ]);

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(true);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          text: "direct",
        }),
      ]);
    });

    it("closes the scene paste prompt when direct read audio succeeds", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["audio/wav"], getType: async () => new File(["audio"], "direct.wav", {type: "audio/wav"})},
      ]);

      const prompt = api._clipboardOpenScenePastePrompt();
      const pending = api._clipboardTryScenePastePromptDirectRead(prompt);
      await flush();
      env.dialogInstances.at(-1).data.close();
      await expect(pending).resolves.toBe(true);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("AmbientSound", [
        expect.objectContaining({
          name: "direct",
          path: expect.stringMatching(/^pasted_images\/direct-\d+\.wav\?foundry-paste-eater=\d+$/),
        }),
      ]);
    });

    it("keeps the scene paste prompt open when direct read media cannot be applied", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);
      api._clipboardSetRuntimeState({locked: true});

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not create media");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
      restoreImage();
    });

    it("keeps the scene paste prompt open when direct read PDF cannot be applied", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["application/pdf"], getType: async () => new File(["pdf"], "direct.pdf", {type: "application/pdf"})},
      ]);
      api._clipboardSetRuntimeState({locked: true});

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not create a PDF note");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("keeps the scene paste prompt open when direct read audio cannot be applied", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["audio/wav"], getType: async () => new File(["audio"], "direct.wav", {type: "audio/wav"})},
      ]);
      api._clipboardSetRuntimeState({locked: true});

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not create an ambient sound");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("allows the scene paste prompt buttons to upload or cancel", async () => {
      let restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      const restoreImage = withMockImage();
      const prompt = api._clipboardOpenScenePastePrompt();
      prompt.querySelector('[data-action="upload"]').click();
      await flush();
      restoreClick();
      restoreImage();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();

      restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("blur"));
        window.dispatchEvent(new Event("focus"));
      });
      const secondPrompt = api._clipboardOpenScenePastePrompt();
      secondPrompt.querySelector('[data-action="cancel"]').click();
      await flush();
      restoreClick();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("reuses the existing scene paste prompt and supports overlay dismissal", () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      expect(api._clipboardOpenScenePastePrompt()).toBe(prompt);

      prompt.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("runs the scene and chat upload actions", async () => {
      let restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      api._clipboardHandleSceneUploadAction();
      await flush();
      restoreClick();

      restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      api._clipboardHandleChatUploadAction();
      await flush();
      restoreClick();
    });

    it("returns false from scene and chat actions when their settings disable them", () => {
      env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", false);
      env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", false);
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);

      expect(api._clipboardHandleScenePasteAction()).toBe(false);
      expect(api._clipboardHandleSceneUploadAction()).toBe(false);
      expect(api._clipboardHandleChatUploadAction()).toBe(false);
    });

    it("runs the chat upload action in isolation", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardHandleChatUploadAction();
      await flush();
      restoreClick();
    });
  });

  describe("scene control and chat DOM helpers", () => {
    it("builds video chat preview content", () => {
      expect(api._clipboardCreateChatMediaContent("https://example.com/file.webm")).toContain("video");
    });

    it("supports link-only chat media display", () => {
      env.settingsValues.set("foundry-paste-eater.chat-media-display", "link-only");
      const content = api._clipboardCreateChatMediaContent("https://example.com/file.png");
      expect(content).not.toContain("<img");
      expect(content).toContain("Open full media");
    });

    it("supports full-preview chat media display", () => {
      env.settingsValues.set("foundry-paste-eater.chat-media-display", "full-preview");
      expect(api._clipboardCreateChatMediaContent("https://example.com/file.png"))
        .toContain("foundry-paste-eater-chat-full-preview");
    });

    it("creates chat messages directly", async () => {
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);
      env.settingsValues.set("core.rollMode", "gmroll");
      await api._clipboardCreateChatMessage("folder/file.png");
      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith(
        {
          content: expect.stringContaining("folder/file.png"),
          speaker: {alias: "GM"},
          user: "user-1",
        },
        {rollMode: "gmroll"}
      );
    });

    it("uses v14 message visibility modes for chat media messages", async () => {
      globalThis.game.version = "14.359";
      globalThis.game.release.version = "14.359";
      env.settingsValues.set("core.messageMode", "ic");

      await api._clipboardCreateChatMessage("folder/file.png");

      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith(
        {
          content: expect.stringContaining("folder/file.png"),
          speaker: {alias: "GM"},
          user: "user-1",
        },
        {messageMode: "ic"}
      );
    });

    it("falls back to legacy rollMode on v14 and omits visibility options when none are configured", async () => {
      globalThis.game.version = "14.359";
      globalThis.game.release.version = "14.359";
      env.settingsValues.set("core.messageMode", "   ");
      env.settingsValues.set("core.rollMode", "gmroll");

      await api._clipboardCreateChatMessage("folder/file.png");

      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith(
        {
          content: expect.stringContaining("folder/file.png"),
          speaker: {alias: "GM"},
          user: "user-1",
        },
        {rollMode: "gmroll"}
      );

      globalThis.foundry.documents.ChatMessage.create.mockClear();
      env.settingsValues.set("core.rollMode", "   ");
      await api._clipboardCreateChatMessage("folder/file.png");
      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith({
        content: expect.stringContaining("folder/file.png"),
        speaker: {alias: "GM"},
        user: "user-1",
      });
    });

    it("defaults unknown chat media to image output when no visibility mode is configured", async () => {
      const originalRelease = globalThis.game.release;
      globalThis.game.release = null;
      globalThis.game.version = "";
      env.settingsValues.set("core.rollMode", "");

      expect(api._clipboardCreateChatMediaContent("folder/file")).toContain("<img");
      await api._clipboardCreateChatMessage("folder/file");
      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith({
        content: expect.stringContaining("folder/file"),
        speaker: {alias: "GM"},
        user: "user-1",
      });

      globalThis.game.release = originalRelease;
      globalThis.game.version = "13.0.0";
    });

    it("rejects chat messages without a usable media path", async () => {
      await expect(api._clipboardCreateChatMessage("")).rejects.toThrow("usable media path");
    });

    it("can mark chat audio cards to play once now and auto-play them once on render", async () => {
      const message = await api._clipboardCreateAudioChatMessage({
        audioData: {
          src: "folder/theme.mp3",
          name: "theme",
        },
        playOnceNow: true,
      });

      expect(message.flags?.["foundry-paste-eater"]?.playOnceNow).toBe(true);
      expect(api._clipboardGetChatAudioAutoplayFlag(message)).toBe(true);
      expect(api._clipboardShouldAutoplayChatAudio(message)).toBe(true);

      const root = document.createElement("div");
      root.innerHTML = message.content;
      const audio = root.querySelector(".foundry-paste-eater-chat-audio");
      audio.play = vi.fn(() => Promise.resolve());

      api._clipboardOnRenderChatMessageHTML(message, root);
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(api._clipboardShouldAutoplayChatAudio(message)).toBe(false);

      api._clipboardOnRenderChatMessageHTML(message, root);
      expect(audio.play).toHaveBeenCalledTimes(1);
    });

    it("covers chat audio autoplay edge cases and fallback branches", async () => {
      const message = {
        id: "message-edge",
        timestamp: Date.now(),
        flags: {
          "foundry-paste-eater": {
            playOnceNow: true,
          },
        },
      };
      const root = document.createElement("div");
      root.innerHTML = '<audio class="foundry-paste-eater-chat-audio"></audio>';
      const audio = root.querySelector(".foundry-paste-eater-chat-audio");

      expect(api._clipboardResolveChatHtmlRoot(root)).toBe(root);
      expect(api._clipboardResolveChatHtmlRoot({0: root})).toBe(root);
      expect(api._clipboardResolveChatHtmlRoot({get: () => root})).toBe(root);
      expect(api._clipboardResolveChatHtmlRoot({})).toBeNull();
      expect(api._clipboardShouldAutoplayChatAudio({
        ...message,
        timestamp: Date.now() - 60_000,
      })).toBe(false);

      audio.play = undefined;
      api._clipboardQueueChatAudioAutoplay(message.id);
      api._clipboardOnRenderChatMessageHTML(message, root);
      expect(api._clipboardShouldAutoplayChatAudio(message)).toBe(true);

      audio.play = vi.fn(() => Promise.reject(new Error("blocked")));
      api._clipboardQueueChatAudioAutoplay(message.id);
      api._clipboardOnRenderChatMessageHTML(message, root);
      await Promise.resolve();
      expect(audio.play).toHaveBeenCalledTimes(1);

      const syncMessage = {
        ...message,
        id: "message-sync",
      };
      audio.play = vi.fn(() => {
        throw new Error("sync");
      });
      api._clipboardQueueChatAudioAutoplay(syncMessage.id);
      api._clipboardOnRenderChatMessageHTML(syncMessage, root);
      expect(audio.play).toHaveBeenCalledTimes(1);

      await expect(api._clipboardCreateAudioChatMessage({audioData: {}})).rejects.toThrow("usable audio path");
    });

    it("adds scene control buttons to tiles and tokens", () => {
      const controls = {
        tiles: {tools: {}},
        tokens: {tools: {}},
        sounds: {tools: {}},
        walls: {tools: {}},
      };

      api._clipboardAddSceneControlButtons(controls);
      expect(controls.tiles.tools["foundry-paste-eater-paste"]).toMatchObject({title: "Paste Media, PDF, or Audio", button: true});
      expect(controls.tiles.tools["foundry-paste-eater-paste"].onClick).toBeUndefined();
      expect(controls.tiles.tools["foundry-paste-eater-paste"].onChange).toBeTypeOf("function");
      expect(controls.tokens.tools["foundry-paste-eater-upload"]).toMatchObject({title: "Upload Media, PDF, or Audio", button: true});
      expect(controls.tokens.tools["foundry-paste-eater-upload"].onClick).toBeUndefined();
      expect(controls.tokens.tools["foundry-paste-eater-upload"].onChange).toBeTypeOf("function");
      expect(controls.sounds.tools["foundry-paste-eater-paste"]).toMatchObject({title: "Paste Media, PDF, or Audio", button: true});
      expect(controls.walls.tools["foundry-paste-eater-paste"]).toBeUndefined();
    });

    it("adds scene control buttons when Foundry provides tool arrays", () => {
      const controls = {
        tiles: {
          tools: [
            {name: "select", title: "Select Tiles"},
            {name: "tile", title: "Place Tile"},
          ],
        },
        tokens: {
          tools: [
            {name: "select", title: "Select Tokens"},
          ],
        },
      };

      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools.map(tool => tool.name)).toEqual([
        "select",
        "tile",
        "foundry-paste-eater-paste",
        "foundry-paste-eater-upload",
      ]);
      expect(controls.tokens.tools.map(tool => tool.name)).toEqual([
        "select",
        "foundry-paste-eater-paste",
        "foundry-paste-eater-upload",
      ]);
    });

    it("updates existing array-backed scene control tools instead of appending duplicates", () => {
      const control = {
        tools: [
          {name: "select", title: "Select"},
          {name: "foundry-paste-eater-paste", title: "Old Paste", visible: false},
        ],
      };

      api._clipboardUpsertSceneControlTool(control, "foundry-paste-eater-paste", {
        name: "foundry-paste-eater-paste",
        title: "Paste Media",
        button: true,
        visible: true,
      });

      expect(control.tools).toHaveLength(2);
      expect(control.tools[1]).toMatchObject({
        name: "foundry-paste-eater-paste",
        title: "Paste Media",
        button: true,
        visible: true,
      });
    });

    it("can upsert scene control tools into object-backed tool collections", () => {
      const control = {
        tools: {},
      };

      api._clipboardUpsertSceneControlTool(control, "foundry-paste-eater-upload", {
        name: "foundry-paste-eater-upload",
        title: "Upload Media",
        button: true,
      });

      expect(control.tools["foundry-paste-eater-upload"]).toMatchObject({
        name: "foundry-paste-eater-upload",
        title: "Upload Media",
        button: true,
      });
    });

    it("ignores scene control upserts cleanly when no tools container exists", () => {
      expect(() => api._clipboardUpsertSceneControlTool(null, "foundry-paste-eater-paste", {
        name: "foundry-paste-eater-paste",
      })).not.toThrow();
      expect(() => api._clipboardUpsertSceneControlTool({}, "foundry-paste-eater-paste", {
        name: "foundry-paste-eater-paste",
      })).not.toThrow();
    });

    it("respects scene control visibility settings for non-gm users", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", true);
      env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", false);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["foundry-paste-eater-paste"].visible).toBe(false);
      expect(controls.tiles.tools["foundry-paste-eater-upload"].visible).toBe(true);
    });

    it("shows both scene controls to allowed non-gm users", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", true);
      env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", true);
      env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", true);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["foundry-paste-eater-paste"].visible).toBe(true);
      expect(controls.tiles.tools["foundry-paste-eater-upload"].visible).toBe(true);
    });

    it("respects the upload-tool toggle for non-gm users independently", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", true);
      env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", true);
      env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", false);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["foundry-paste-eater-paste"].visible).toBe(true);
      expect(controls.tiles.tools["foundry-paste-eater-upload"].visible).toBe(false);
    });

    it("hides scene controls from non-gms when the world setting disallows them", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", false);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["foundry-paste-eater-paste"].visible).toBe(false);
      expect(controls.tiles.tools["foundry-paste-eater-upload"].visible).toBe(false);
    });

    it("invokes scene control callbacks", async () => {
      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);
      controls.tiles.tools["foundry-paste-eater-paste"].onChange();
      controls.tokens.tools["foundry-paste-eater-upload"].onChange();
      await flush();
      api._clipboardCloseScenePastePrompt();
    });

    it("toggles chat drop-target styling", () => {
      const root = document.createElement("form");
      api._clipboardToggleChatDropTarget(root, true);
      expect(root.classList.contains("foundry-paste-eater-chat-drop-target")).toBe(true);
      api._clipboardToggleChatDropTarget(root, false);
      expect(root.classList.contains("foundry-paste-eater-chat-drop-target")).toBe(false);
    });

    it("prevents dragover for supported media", () => {
      const root = document.createElement("form");
      const event = {
        currentTarget: root,
        dataTransfer: {
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
          files: [],
        },
        preventDefault: vi.fn(),
      };

      api._clipboardOnChatDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();

      const pdfEvent = {
        currentTarget: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => new File(["pdf"], "drag.pdf", {type: "application/pdf"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnChatDragOver(pdfEvent);
      expect(pdfEvent.preventDefault).toHaveBeenCalled();
    });

    it("ignores dragover when chat media is disabled or no media is present", () => {
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
      const root = document.createElement("form");
      const disabledEvent = {
        currentTarget: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };

      api._clipboardOnChatDragOver(disabledEvent);
      expect(disabledEvent.preventDefault).not.toHaveBeenCalled();

      env.settingsValues.set("foundry-paste-eater.enable-chat-media", true);
      const emptyEvent = {
        currentTarget: root,
        dataTransfer: createDataTransfer({
          data: {"text/plain": "no file"},
        }),
        preventDefault: vi.fn(),
      };

      api._clipboardOnChatDragOver(emptyEvent);
      expect(emptyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("clears dragover styling when leaving the chat root", () => {
      const root = document.createElement("form");
      api._clipboardOnChatDragLeave({currentTarget: root, relatedTarget: null});
      expect(root.classList.contains("foundry-paste-eater-chat-drop-target")).toBe(false);
    });

    it("keeps dragover styling while the pointer stays inside the chat root", () => {
      const root = document.createElement("form");
      const child = document.createElement("div");
      root.append(child);
      api._clipboardToggleChatDropTarget(root, true);

      api._clipboardOnChatDragLeave({currentTarget: root, relatedTarget: child});
      expect(root.classList.contains("foundry-paste-eater-chat-drop-target")).toBe(true);
    });

    it("handles dropped chat media", async () => {
      const root = document.createElement("form");
      const event = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("handles dropped chat PDFs", async () => {
      const root = document.createElement("form");
      const pdf = new File(["pdf"], "drag.pdf", {type: "application/pdf"});
      const event = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => pdf,
          }],
          files: [pdf],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(globalThis.game.messages.contents.at(-1).content).toContain("foundry-paste-eater-chat-pdf-message");
    });

    it("handles dropped chat audio", async () => {
      const root = document.createElement("form");
      const audio = new File(["audio"], "drag.mp3", {type: "audio/mpeg"});
      const event = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/mpeg",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(event);
      env.dialogInstances.at(-1).data.close();
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(globalThis.game.messages.contents.at(-1).content).toContain("foundry-paste-eater-chat-audio-message");
    });

    it("ignores dropped chat media when disabled or unsupported", () => {
      const root = document.createElement("form");
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
      const disabledEvent = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(disabledEvent);
      expect(disabledEvent.preventDefault).not.toHaveBeenCalled();

      env.settingsValues.set("foundry-paste-eater.enable-chat-media", true);
      const unsupportedEvent = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          data: {"text/plain": "no file"},
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(unsupportedEvent);
      expect(unsupportedEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("adds and binds the chat upload button once", () => {
      const root = document.createElement("form");
      const controls = document.createElement("div");
      controls.id = "chat-controls";
      const buttons = document.createElement("div");
      buttons.className = "control-buttons";
      controls.append(buttons);
      const input = document.createElement("textarea");
      root.append(controls, input);
      document.body.append(root);

      api._clipboardAttachChatUploadButton(root);
      expect(buttons.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeTruthy();
      api._clipboardBindChatRoot(root);
      api._clipboardBindChatRoot(root);
      expect(root.getAttribute("data-foundry-paste-eater-chat-root")).toBe("true");
    });

    it("omits the chat upload button when that feature is disabled", () => {
      env.settingsValues.set("foundry-paste-eater.enable-chat-upload-button", false);
      const root = document.createElement("form");
      document.body.append(root);

      api._clipboardAttachChatUploadButton(root);
      expect(root.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeNull();
    });

    it("removes orphaned chat upload buttons and temporary rows when the feature is disabled", () => {
      const root = document.createElement("form");
      const controls = document.createElement("div");
      controls.id = "chat-controls";
      const temporaryButtons = document.createElement("div");
      temporaryButtons.className = "control-buttons foundry-paste-eater-chat-buttons";
      const button = document.createElement("button");
      button.dataset.action = "foundry-paste-eater-chat-upload";
      temporaryButtons.append(button);
      controls.append(temporaryButtons);
      document.body.append(root, controls);

      env.settingsValues.set("foundry-paste-eater.enable-chat-upload-button", false);
      api._clipboardAttachChatUploadButton(root);

      expect(document.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeNull();
      expect(document.querySelector(".foundry-paste-eater-chat-buttons")).toBeNull();
    });

    it("does not add duplicate chat upload buttons when one already exists", () => {
      const root = document.createElement("form");
      const existingButton = document.createElement("button");
      existingButton.dataset.action = "foundry-paste-eater-chat-upload";
      root.append(existingButton);

      api._clipboardAttachChatUploadButton(root);
      expect(root.querySelectorAll('[data-action="foundry-paste-eater-chat-upload"]')).toHaveLength(1);
    });

    it("creates a compact chat action row when chat controls lack a button group", () => {
      const root = document.createElement("form");
      const controls = document.createElement("div");
      controls.id = "chat-controls";
      root.append(controls, document.createElement("textarea"));
      document.body.append(root);

      api._clipboardAttachChatUploadButton(root);

      const buttons = controls.querySelector(".foundry-paste-eater-chat-buttons");
      expect(buttons).toBeTruthy();
      expect(buttons?.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeTruthy();
    });

    it("mounts the chat upload button into v14 chat controls without relying on a form root", () => {
      const chatMessage = document.createElement("prose-mirror");
      chatMessage.id = "chat-message";
      const controls = document.createElement("div");
      controls.id = "chat-controls";
      const hiddenButtons = document.createElement("div");
      hiddenButtons.className = "control-buttons";
      hiddenButtons.hidden = true;
      controls.append(hiddenButtons);
      document.body.append(chatMessage, controls);

      api._clipboardAttachChatUploadButton(chatMessage);

      const button = controls.querySelector('[data-action="foundry-paste-eater-chat-upload"]');
      expect(button).toBeTruthy();
      expect(button?.parentElement?.classList.contains("foundry-paste-eater-chat-buttons")).toBe(true);
      expect(button?.parentElement?.hidden).toBe(false);
    });

    it("binds chat roots from rendered chat input elements", () => {
      const root = document.createElement("form");
      const input = document.createElement("textarea");
      root.append(input);
      document.body.append(root);

      api._clipboardOnRenderChatInput(null, {
        form: root,
        ignored: document.createElement("div"),
        text: "not-element",
      });
      expect(root.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeTruthy();
    });

    it("binds the v14 chat input and controls from rendered chat input elements", () => {
      const chatMessage = document.createElement("prose-mirror");
      chatMessage.id = "chat-message";
      const controls = document.createElement("div");
      controls.id = "chat-controls";
      const messageModes = document.createElement("div");
      messageModes.id = "message-modes";
      controls.append(messageModes);
      document.body.append(chatMessage, controls);

      api._clipboardOnRenderChatInput(null, {
        "#chat-message": chatMessage,
        "#chat-controls": controls,
        "#message-modes": messageModes,
      });

      expect(chatMessage.getAttribute("data-foundry-paste-eater-chat-root")).toBe("true");
      expect(controls.getAttribute("data-foundry-paste-eater-chat-root")).toBe("true");
      expect(messageModes.getAttribute("data-foundry-paste-eater-chat-root")).toBe("true");
      expect(controls.querySelector('[data-action="foundry-paste-eater-chat-upload"]')).toBeTruthy();
    });
  });

  describe("_clipboardBindEventDocument", () => {
    it("binds document listeners only once per document", () => {
      const detachedDocument = {
        addEventListener: vi.fn(),
      };

      api._clipboardBindEventDocument(detachedDocument);
      api._clipboardBindEventDocument(detachedDocument);

      expect(detachedDocument.addEventListener).toHaveBeenCalledTimes(3);
      expect(detachedDocument.addEventListener).toHaveBeenCalledWith("keydown", api._clipboardOnKeydown);
      expect(detachedDocument.addEventListener).toHaveBeenCalledWith("mousedown", api._clipboardOnMouseDown, true);
      expect(detachedDocument.addEventListener).toHaveBeenCalledWith("paste", api._clipboardOnPaste);
    });

    it("ignores documents that cannot register listeners", () => {
      expect(() => api._clipboardBindEventDocument(null)).not.toThrow();
      expect(() => api._clipboardBindEventDocument({})).not.toThrow();
    });
  });

  describe("_clipboardInsertTextAtTarget", () => {
    it("inserts text into text inputs", () => {
      const input = document.createElement("textarea");
      input.value = "hello";
      input.selectionStart = 5;
      input.selectionEnd = 5;

      expect(api._clipboardInsertTextAtTarget(input, " world")).toBe(true);
      expect(input.value).toBe("hello world");
    });

    it("inserts text into contenteditable elements", () => {
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      document.body.append(editable);

      expect(api._clipboardInsertTextAtTarget(editable, "editable")).toBe(true);
      expect(editable.textContent).toBe("editable");
    });

    it("inserts text into contenteditable descendants from a prose-mirror wrapper target", () => {
      const wrapper = document.createElement("prose-mirror");
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      wrapper.append(editable);
      document.body.append(wrapper);

      expect(api._clipboardInsertTextAtTarget(wrapper, "wrapped")).toBe(true);
      expect(editable.textContent).toBe("wrapped");
    });

    it("reanchors an existing selection before inserting into a different contenteditable target", () => {
      const source = document.createElement("div");
      source.setAttribute("contenteditable", "true");
      Object.defineProperty(source, "isContentEditable", {configurable: true, value: true});
      source.textContent = "source";

      const wrapper = document.createElement("prose-mirror");
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      editable.textContent = "target";
      wrapper.append(editable);
      document.body.append(source, wrapper);

      const sourceRange = document.createRange();
      sourceRange.selectNodeContents(source);
      sourceRange.collapse(false);
      let activeRange = sourceRange;
      const addedRanges = [];
      const originalGetSelection = window.getSelection;
      const selection = {
        get rangeCount() {
          return activeRange ? 1 : 0;
        },
        removeAllRanges: vi.fn(() => {
          activeRange = null;
        }),
        addRange: vi.fn(range => {
          addedRanges.push(range.cloneRange());
          activeRange = range;
        }),
        getRangeAt: vi.fn(() => activeRange),
      };
      window.getSelection = vi.fn(() => selection);

      expect(api._clipboardInsertTextAtTarget(wrapper, " text")).toBe(true);
      expect(source.textContent).toBe("source");
      expect(editable.textContent).toContain("target");
      expect(editable.textContent).toContain(" text");
      expect(addedRanges[0].startContainer).toBe(editable);
      expect(addedRanges[0].startOffset).toBe(1);
      expect(addedRanges[0].collapsed).toBe(true);

      window.getSelection = originalGetSelection;
    });

    it("creates a collapsed range when contenteditable has no selection", () => {
      const selection = {
        rangeCount: 0,
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
        getRangeAt: vi.fn(() => ({
          deleteContents: vi.fn(),
          insertNode: vi.fn(),
          setStartAfter: vi.fn(),
          collapse: vi.fn(),
        })),
      };
      const originalGetSelection = window.getSelection;
      window.getSelection = vi.fn(() => selection);

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      document.body.append(editable);

      expect(api._clipboardInsertTextAtTarget(editable, "range")).toBe(true);
      window.getSelection = originalGetSelection;
    });

    it("returns false when there is no selection object", () => {
      const originalGetSelection = window.getSelection;
      window.getSelection = vi.fn(() => null);

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});

      expect(api._clipboardInsertTextAtTarget(editable, "range")).toBe(false);
      window.getSelection = originalGetSelection;
    });

    it("returns false for unsupported targets", () => {
      expect(api._clipboardInsertTextAtTarget(document.createElement("div"), "nope")).toBe(false);
    });
  });

  describe("paste event helpers", () => {
    it("falls back to raw text when chat media handling fails", async () => {
      const input = document.createElement("textarea");
      input.value = "";
      globalThis.fetch.mockRejectedValueOnce(new Error("bad"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        url: "https://example.com/not-media.txt",
        text: "https://example.com/not-media.txt",
      }, input)).resolves.toBe(false);

      expect(input.value).toContain("https://example.com/not-media.txt");
    });

    it("falls back to the original url text when a direct media url download is blocked in chat", async () => {
      const input = document.createElement("textarea");
      input.value = "";
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        url: "https://example.com/file.svg",
        text: "https://example.com/file.svg",
      }, input)).resolves.toBe(false);

      expect(input.value).toBe("https://example.com/file.svg");
      expect(globalThis.foundry.documents.ChatMessage.create).not.toHaveBeenCalled();
    });

    it("rethrows chat media failures when the original URL cannot be inserted", async () => {
      const target = document.createElement("div");
      globalThis.foundry.documents.ChatMessage.create.mockRejectedValueOnce(new Error("bad"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        blob: new Blob(["x"], {type: "image/png"}),
      }, target)).rejects.toThrow("bad");
    });

    it("consumes paste events", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      api._clipboardConsumePasteEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("reports whether a canvas paste context is eligible", () => {
      expect(api._clipboardCanHandleCanvasPasteContext({
        requireCanvasFocus: false,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      }, "ignored")).toBe(true);
    });

    it("returns false for ineligible canvas paste contexts", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      expect(api._clipboardCanHandleCanvasPasteContext({
        requireCanvasFocus: true,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      }, "ignored")).toBe(false);
    });

    it("restores game focus for board interactions but not chat or editable targets", () => {
      document.body.innerHTML = `
        <div class="game"></div>
        <div id="board"><canvas id="board-canvas"></canvas></div>
        <form data-foundry-paste-eater-chat-root="true"><textarea id="chat-box"></textarea></form>
        <input id="sheet-field" name="img">
      `;

      const chatBox = document.getElementById("chat-box");
      chatBox.focus();
      expect(document.activeElement).toBe(chatBox);

      expect(api._clipboardShouldRestoreGameFocus(document.getElementById("board-canvas"))).toBe(true);
      expect(api._clipboardShouldRestoreGameFocus(chatBox)).toBe(false);
      expect(api._clipboardShouldRestoreGameFocus(document.getElementById("sheet-field"))).toBe(false);

      api._clipboardOnMouseDown({target: document.getElementById("board-canvas")});
      expect(document.activeElement).toBe(document.querySelector(".game"));
    });

    it("routes canvas media paste events through the media pipeline", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      api._clipboardSetRuntimeState({locked: false, hiddenMode: false});
      const restoreImage = withMockImage();
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "paste.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      restoreImage();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("classifies native paste routes across all supported outcomes", () => {
      expect(api._clipboardResolveNativePasteRoute({
        hasPdfInput: true,
        hasPdfFieldTarget: true,
      })).toEqual({route: "pdf-field"});
      expect(api._clipboardResolveNativePasteRoute({
        hasPdfInput: true,
        isChatTarget: true,
        canUseChatMedia: true,
      })).toEqual({route: "chat-pdf"});
      expect(api._clipboardResolveNativePasteRoute({
        hasPdfInput: true,
        isEditableTarget: true,
      })).toEqual({route: "ignore-editable-pdf"});
      expect(api._clipboardResolveNativePasteRoute({
        hasPdfInput: true,
        canvasContextEligible: true,
      })).toEqual({route: "canvas-pdf"});
      expect(api._clipboardResolveNativePasteRoute({
        hasPdfInput: true,
        canvasContextEligible: false,
      })).toEqual({route: "ignore-pdf-ineligible"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        hasAudioFieldTarget: true,
      })).toEqual({route: "audio-field"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        isChatTarget: true,
        canUseChatMedia: true,
      })).toEqual({route: "chat-audio"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        isChatTarget: true,
        canUseChatMedia: false,
      })).toEqual({route: "ignore-chat-media-disabled"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        isEditableTarget: true,
        hasPlaylistTarget: true,
      })).toEqual({route: "ignore-editable-audio"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        hasPlaylistTarget: true,
      })).toEqual({route: "playlist-audio"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        canvasAudioEligible: true,
      })).toEqual({route: "canvas-audio"});
      expect(api._clipboardResolveNativePasteRoute({
        hasAudioInput: true,
        canvasAudioEligible: false,
      })).toEqual({route: "ignore-audio-ineligible"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        hasArtFieldTarget: true,
      })).toEqual({route: "art-field-media"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        isChatTarget: true,
        canUseChatMedia: true,
      })).toEqual({route: "chat-media"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        isChatTarget: true,
        canUseChatMedia: false,
      })).toEqual({route: "ignore-chat-media-disabled"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        isEditableTarget: true,
      })).toEqual({route: "ignore-editable-media"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        canvasContextEligible: true,
      })).toEqual({route: "canvas-media"});
      expect(api._clipboardResolveNativePasteRoute({
        hasMediaInput: true,
        canvasContextEligible: false,
      })).toEqual({route: "ignore-media-ineligible"});
      expect(api._clipboardResolveNativePasteRoute({
        hasTextInput: true,
        isChatTarget: true,
      })).toEqual({route: "ignore-chat-text"});
      expect(api._clipboardResolveNativePasteRoute({
        hasTextInput: true,
        isEditableTarget: true,
      })).toEqual({route: "ignore-editable-text"});
      expect(api._clipboardResolveNativePasteRoute({
        hasTextInput: true,
        canvasContextEligible: true,
      })).toEqual({route: "canvas-text"});
      expect(api._clipboardResolveNativePasteRoute({
        hasTextInput: true,
        canvasContextEligible: false,
      })).toEqual({route: "ignore-text-ineligible"});
      expect(api._clipboardResolveNativePasteRoute()).toEqual({route: "ignore-empty"});
    });

    it("returns null game roots cleanly and restores focus by adding tabindex when needed", () => {
      document.body.innerHTML = "";
      expect(api._clipboardGetGameRoot()).toBeNull();
      expect(api._clipboardFocusGameRoot()).toBe(false);

      document.body.innerHTML = '<div class="game"></div>';
      const root = document.querySelector(".game");
      expect(root.hasAttribute("tabindex")).toBe(false);
      expect(api._clipboardFocusGameRoot()).toBe(true);
      expect(root.getAttribute("tabindex")).toBe("0");
    });

    it("routes chat media paste events through the chat pipeline", async () => {
      const root = document.createElement("form");
      root.setAttribute("data-foundry-paste-eater-chat-root", "true");
      const input = document.createElement("textarea");
      root.append(input);

      const event = {
        target: input,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "chat.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("routes chat PDF paste events through the PDF chat pipeline", async () => {
      const root = document.createElement("form");
      root.setAttribute("data-foundry-paste-eater-chat-root", "true");
      const input = document.createElement("textarea");
      root.append(input);

      const pdf = new File(["pdf"], "chat.pdf", {type: "application/pdf"});
      const event = {
        target: input,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => pdf,
          }],
          files: [pdf],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.game.messages.contents.at(-1).content).toContain("foundry-paste-eater-chat-pdf-message");
    });

    it("routes chat audio paste events through the audio chat pipeline", async () => {
      const root = document.createElement("form");
      root.setAttribute("data-foundry-paste-eater-chat-root", "true");
      const input = document.createElement("textarea");
      root.append(input);

      const audio = new File(["audio"], "chat.mp3", {type: "audio/mpeg"});
      const event = {
        target: input,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/mpeg",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      env.dialogInstances.at(-1).data.close();
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.game.messages.contents.at(-1).content).toContain("foundry-paste-eater-chat-audio-message");
    });

    it("routes focused audio field paste events before playlist or canvas handling", async () => {
      const root = document.createElement("form");
      root.id = "AmbientSoundConfig-native";
      root.className = "application sheet ambient-sound";
      root.innerHTML = '<input type="text" name="path" value="">';
      document.body.append(root);
      const ambientSound = env.createPlaceableDocument("AmbientSound", {id: "native-audio-field", path: ""});
      globalThis.foundry.applications.instances = new Map([[root.id, {
        id: root.id,
        object: ambientSound,
      }]]);
      const input = root.querySelector("input");
      const audio = new File(["audio"], "field.wav", {type: "audio/wav"});
      const event = {
        target: input,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(input.value).toMatch(/^pasted_images\/field-\d+\.wav\?foundry-paste-eater=\d+$/);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalledWith("AmbientSound", expect.anything());
    });

    it("routes playlist audio paste events through PlaylistSound creation", async () => {
      const playlist = env.createPlaylist({id: "native-playlist", name: "Native Playlist"});
      const directory = document.createElement("div");
      directory.id = "playlists";
      directory.innerHTML = '<div data-playlist-id="native-playlist"><span>Native Playlist</span></div>';
      document.body.append(directory);
      const target = directory.querySelector("span");
      const audio = new File(["audio"], "playlist.wav", {type: "audio/wav"});
      const event = {
        target,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(playlist.createEmbeddedDocuments).toHaveBeenCalledWith("PlaylistSound", [
        expect.objectContaining({
          name: "playlist",
          path: expect.stringMatching(/^pasted_images\/playlist-\d+\.wav\?foundry-paste-eater=\d+$/),
        }),
      ]);
    });

    it("routes playlist audio paste events through the last clicked playlist row when paste lands on the page root", async () => {
      const playlist = env.createPlaylist({id: "native-playlist", name: "Native Playlist"});
      const directory = document.createElement("section");
      directory.id = "playlists";
      directory.className = "tab sidebar-tab directory playlists-sidebar active";
      directory.dataset.tab = "playlists";
      directory.innerHTML = '<div data-entry-id="native-playlist"><span id="playlist-row-label">Native Playlist</span></div>';
      document.body.append(directory);

      api._clipboardOnMouseDown({target: document.getElementById("playlist-row-label")});
      directory.innerHTML = '<div class="playlist-rerendered">Native Playlist</div>';

      const audio = new File(["audio"], "playlist-body.wav", {type: "audio/wav"});
      const event = {
        target: document.body,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(playlist.createEmbeddedDocuments).toHaveBeenCalledWith("PlaylistSound", [
        expect.objectContaining({
          name: "playlist-body",
          path: expect.stringMatching(/^pasted_images\/playlist-body-\d+\.wav\?foundry-paste-eater=\d+$/),
        }),
      ]);
    });

    it("routes playlist audio paste events through the active playlist sidebar when no specific row is targeted", async () => {
      const directory = document.createElement("section");
      directory.id = "playlists";
      directory.className = "tab sidebar-tab directory playlists-sidebar active";
      directory.dataset.tab = "playlists";
      document.body.append(directory);
      api._clipboardOnMouseDown({target: directory});

      const audio = new File(["audio"], "playlist-panel.wav", {type: "audio/wav"});
      const event = {
        target: document.body,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.foundry.documents.Playlist.create).toHaveBeenCalledWith(expect.objectContaining({
        name: "Pasted Audio",
      }));
      const createdPlaylist = globalThis.game.playlists.contents.find(entry => entry.name === "Pasted Audio");
      expect(createdPlaylist?.sounds?.contents?.[0]).toMatchObject({
        name: "playlist-panel",
        path: expect.stringMatching(/^pasted_images\/playlist-panel-\d+\.wav\?foundry-paste-eater=\d+$/),
      });
    });

    it("does not route page-root audio paste into playlists without playlist interaction", async () => {
      const directory = document.createElement("section");
      directory.id = "playlists";
      directory.className = "tab sidebar-tab directory playlists-sidebar active";
      directory.dataset.tab = "playlists";
      document.body.append(directory);
      document.querySelector(".game").focus();

      const audio = new File(["audio"], "playlist-unfocused.wav", {type: "audio/wav"});
      const event = {
        target: document.body,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(globalThis.foundry.documents.Playlist.create).not.toHaveBeenCalled();
    });

    it("routes canvas PDF paste events through the PDF note pipeline", async () => {
      document.querySelector(".game").focus();
      const pdf = new File(["pdf"], "canvas.pdf", {type: "application/pdf"});
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "application/pdf",
            getAsFile: () => pdf,
          }],
          files: [pdf],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          text: "canvas",
        }),
      ]);
    });

    it("routes canvas audio paste events through the AmbientSound pipeline", async () => {
      document.querySelector(".game").focus();
      const audio = new File(["audio"], "canvas.mp3", {type: "audio/mpeg"});
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/mpeg",
            getAsFile: () => audio,
          }],
          files: [audio],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      env.dialogInstances.at(-1).data.close();
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("AmbientSound", [
        expect.objectContaining({
          name: "canvas",
          path: expect.stringMatching(/^pasted_images\/canvas-\d+\.mp3\?foundry-paste-eater=\d+$/),
        }),
      ]);
    });

    it("ignores audio paste in unsupported editable targets and ineligible canvas contexts", () => {
      const unsupportedEditable = document.createElement("textarea");
      unsupportedEditable.dataset.edit = "path";
      const editableAudioEvent = {
        target: unsupportedEditable,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => new File(["audio"], "sheet.wav", {type: "audio/wav"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(editableAudioEvent);
      expect(editableAudioEvent.preventDefault).not.toHaveBeenCalled();

      const ineligibleTarget = document.createElement("div");
      globalThis.canvas.mousePosition = null;
      const ineligibleAudioEvent = {
        target: ineligibleTarget,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            type: "audio/wav",
            getAsFile: () => new File(["audio"], "canvas.wav", {type: "audio/wav"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      api._clipboardOnPaste(ineligibleAudioEvent);
      expect(ineligibleAudioEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("ignores already-handled, empty, disabled-chat, and unsupported-editable paste events", () => {
      const chatRoot = document.createElement("form");
      chatRoot.setAttribute("data-foundry-paste-eater-chat-root", "true");
      const chatInput = document.createElement("textarea");
      chatRoot.append(chatInput);
      document.body.append(chatRoot);

      api._clipboardOnPaste({defaultPrevented: true});

      const emptyEvent = {
        target: document.createElement("div"),
        clipboardData: createDataTransfer({}),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(emptyEvent);
      expect(emptyEvent.preventDefault).not.toHaveBeenCalled();

      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
      const disabledChatEvent = {
        target: chatInput,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "chat.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(disabledChatEvent);
      expect(disabledChatEvent.preventDefault).not.toHaveBeenCalled();

      env.settingsValues.set("foundry-paste-eater.enable-chat-media", true);
      const unsupportedEditable = document.createElement("textarea");
      unsupportedEditable.name = "notes";
      const editableMediaEvent = {
        target: unsupportedEditable,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "sheet.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(editableMediaEvent);
      expect(editableMediaEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("stops paste handling early when conflicts block art-field, chat, canvas-media, and canvas-text routes", () => {
      api._clipboardSetRuntimeState({locked: true});

      document.body.innerHTML = `
        <div class="game" tabindex="0"></div>
        <section data-appid="actor-app"><input id="art-field" name="img"></section>
        <form data-foundry-paste-eater-chat-root="true"><textarea id="chat-input"></textarea></form>
      `;
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };

      const artFieldEvent = {
        target: document.getElementById("art-field"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "art.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(artFieldEvent);
      expect(artFieldEvent.preventDefault).not.toHaveBeenCalled();

      const chatEvent = {
        target: document.getElementById("chat-input"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "chat.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(chatEvent);
      expect(chatEvent.preventDefault).not.toHaveBeenCalled();

      document.querySelector(".game").focus();
      const canvasMediaEvent = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "scene.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(canvasMediaEvent);
      expect(canvasMediaEvent.preventDefault).not.toHaveBeenCalled();

      const canvasTextEvent = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          data: {"text/plain": "blocked text"},
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(canvasTextEvent);
      expect(canvasTextEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("ignores ineligible image routes and logs unsupported editable targets with dataset names", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><div id="target"></div>';
      const imageEvent = {
        target: document.getElementById("target"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "scene.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(imageEvent);
      expect(imageEvent.preventDefault).not.toHaveBeenCalled();

      const editable = document.createElement("textarea");
      editable.dataset.edit = "texture.src";
      const editableMediaEvent = {
        target: editable,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "sheet.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
      };
      api._clipboardOnPaste(editableMediaEvent);
      expect(editableMediaEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("routes canvas text paste events through the note pipeline", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          data: {"text/plain": "Text note"},
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("leaves editable text paste alone", () => {
      const input = document.createElement("textarea");
      const event = {
        target: input,
        clipboardData: createDataTransfer({
          data: {"text/plain": "Chat text"},
        }),
        preventDefault: vi.fn(),
      };

      api._clipboardOnPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("leaves ineligible canvas text paste alone and ignores art-field focus restoration", () => {
      document.body.innerHTML = `
        <div class="game" tabindex="0"></div>
        <div id="board"><canvas id="board-canvas"></canvas></div>
        <input id="art-field" name="img">
      `;
      const artField = document.getElementById("art-field");
      artField.focus();

      expect(api._clipboardShouldRestoreGameFocus(artField)).toBe(false);

      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          data: {"text/plain": "No canvas focus"},
        }),
        preventDefault: vi.fn(),
      };
      artField.focus();
      api._clipboardOnPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("returns false for non-element focus-restore targets and ignores those mousedown events", () => {
      expect(api._clipboardShouldRestoreGameFocus({})).toBe(false);
      expect(() => api._clipboardOnMouseDown({target: {}})).not.toThrow();
    });
  });

  describe("keydown handling and config ui", () => {
    it("tracks hidden paste mode without intercepting the browser paste shortcut", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();

      const event = {
        ctrlKey: false,
        metaKey: true,
        altKey: false,
        code: "KeyV",
        defaultPrevented: false,
        repeat: false,
        getModifierState: vi.fn(() => true),
        preventDefault: vi.fn(),
      };

      api._clipboardOnKeydown(event);
      expect(api._clipboardGetRuntimeState().hiddenMode).toBe(true);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(window.navigator.clipboard.read).not.toHaveBeenCalled();
    });

    it("clears hidden paste mode when modifier state is no longer active", () => {
      api._clipboardSetRuntimeState({hiddenMode: true});

      api._clipboardOnKeydown({
        ctrlKey: false,
        metaKey: false,
        code: "KeyV",
        getModifierState: () => false,
      });

      expect(api._clipboardGetRuntimeState().hiddenMode).toBe(false);
    });

    it("ignores keydowns that should not trigger clipboard handling", () => {
      api._clipboardOnKeydown({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        code: "KeyV",
        defaultPrevented: true,
        repeat: false,
        getModifierState: () => false,
      });

      api._clipboardOnKeydown({
        ctrlKey: false,
        metaKey: true,
        altKey: true,
        code: "KeyV",
        defaultPrevented: false,
        repeat: false,
        getModifierState: () => false,
      });
    });

    it("exposes destination-config default options and data", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      expect(FoundryPasteEaterDestinationConfig.defaultOptions).toMatchObject({
        id: "foundry-paste-eater-destination-config",
        width: 520,
      });

      const app = new FoundryPasteEaterDestinationConfig();
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
      env.settingsValues.set("foundry-paste-eater.image-location-source", "s3");
      env.settingsValues.set("foundry-paste-eater.image-location", "folder");
      env.settingsValues.set("foundry-paste-eater.image-location-bucket", "bucket");
      expect(app.getData()).toMatchObject({
        bucket: "bucket",
        isS3: true,
        s3Endpoint: "https://r2.example.com",
        target: "folder",
        source: "s3",
      });
    });

    it("keeps the s3 endpoint hidden and empty for non-s3 sources", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      env.settingsValues.set("foundry-paste-eater.image-location-source", "data");
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";

      expect(app.getData()).toMatchObject({
        isS3: false,
        s3Endpoint: "https://r2.example.com",
        source: "data",
      });
    });

    it("binds config form listeners and refreshes form state", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      const sourceHandlers = {};
      const targetHandlers = {};
      const bucketHandlers = {};
      const clickHandlers = {};
      const bucketGroup = {toggleClass: vi.fn()};
      const endpointGroup = {toggleClass: vi.fn()};

      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
        querySelector: vi.fn(selector => {
          if (selector === '[data-role="destination-summary"]') return {value: ""};
          if (selector === '[data-role="s3-endpoint"]') return {value: ""};
          return {value: ""};
        }),
      };
      app.element = {find: vi.fn(selector => {
        if (selector === ".foundry-paste-eater-s3-endpoint") return endpointGroup;
        return bucketGroup;
      })};

      app.activateListeners({
        find: vi.fn(selector => {
          if (selector === '[name="source"]') return {on: vi.fn((event, handler) => { sourceHandlers[event] = handler; })};
          if (selector === '[name="target"]') return {on: vi.fn((event, handler) => { targetHandlers[event] = handler; })};
          if (selector === '[name="bucket"]') return {on: vi.fn((event, handler) => { bucketHandlers[event] = handler; })};
          if (selector === '[data-action="browse-destination"]') return {on: vi.fn((event, handler) => { clickHandlers[event] = handler; })};
          return {toggleClass: vi.fn()};
        }),
      });

      sourceHandlers.change();
      targetHandlers.input();
      bucketHandlers.input();
      expect(bucketGroup.toggleClass).toHaveBeenCalled();
      expect(endpointGroup.toggleClass).toHaveBeenCalled();
      expect(clickHandlers.click).toBeTypeOf("function");
    });

    it("ensures custom source options exist and refreshes summary text", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
        querySelector: vi.fn(selector => {
          if (selector === '[data-role="destination-summary"]') return {value: ""};
          if (selector === '[data-role="s3-endpoint"]') return {value: ""};
          return {value: ""};
        }),
      };
      app.element = {find: vi.fn(() => ({toggleClass: vi.fn()}))};

      app._ensureSourceOption("custom");
      app._refreshFormState();
      expect(app.form.elements.source.add).toHaveBeenCalled();
      expect(app.form.querySelector).toHaveBeenCalledWith('[data-role="destination-summary"]');
      expect(app.form.querySelector).toHaveBeenCalledWith('[data-role="s3-endpoint"]');
    });

    it("returns early from config refresh helpers when no form or source field exists", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();

      app.form = null;
      expect(() => app._refreshFormState()).not.toThrow();
      expect(() => app._ensureSourceOption("custom")).not.toThrow();

      app.form = {elements: {}};
      expect(() => app._ensureSourceOption("custom")).not.toThrow();
    });

    it("skips adding duplicate source options", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      const add = vi.fn();
      app.form = {
        elements: {
          source: {
            options: [{value: "data"}, {value: "custom"}],
            add,
          },
        },
      };

      app._ensureSourceOption("custom");
      expect(add).not.toHaveBeenCalled();
    });

    it("applies picker selections and rejects unsupported sources", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
      };
      app.element = {find: vi.fn(() => ({toggleClass: vi.fn()}))};
      app._refreshFormState = vi.fn();

      app._applyPickerSelection("new-folder", {
        activeSource: "public",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "auto");
      expect(globalThis.ui.notifications.warn).toHaveBeenCalled();

      app._applyPickerSelection("new-folder", {
        activeSource: "data",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "auto");
      expect(app.form.elements.source.value).toBe("auto");

      app._applyPickerSelection("new-folder", {
        activeSource: "s3",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "s3");
      expect(app.form.elements.bucket.value).toBe("bucket-x");
    });

    it("returns early when applyPickerSelection has no form", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = null;
      app._applyPickerSelection("ignored", {
        activeSource: "data",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "data");
    });

    it("opens a destination browser and configures s3 pickers", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = {
        elements: {
          source: {value: "s3"},
          target: {value: "s3-folder"},
          bucket: {value: "bucket-a"},
        },
      };

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });

      expect(env.MockFilePicker.instances.at(-1).sources.s3.target).toBe("s3-folder");
    });

    it("invokes the picker callback through _onBrowseDestination", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = {
        elements: {
          source: {value: "data"},
          target: {value: "folder"},
          bucket: {value: ""},
        },
      };
      app._applyPickerSelection = vi.fn();

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });

      env.MockFilePicker.instances.at(-1).callback("callback-folder");
      expect(app._applyPickerSelection).toHaveBeenCalledWith(
        "callback-folder",
        expect.any(env.MockFilePicker),
        "data"
      );
    });

    it("returns early from browse when there is no form", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = null;

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });
    });

    it("writes destination settings on submit", async () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      await app._updateObject(null, {
        source: "s3",
        target: "final-folder",
        bucket: "bucket-z",
      });
      expect(globalThis.game.settings.set).toHaveBeenCalledTimes(4);
      expect(globalThis.game.settings.set).toHaveBeenCalledWith(
        "foundry-paste-eater",
        "known-upload-roots",
        expect.any(String)
      );
    });

    it("does not persist any endpoint override from the destination form", async () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      await app._updateObject(null, {
        source: "s3",
        target: "final-folder",
        bucket: "bucket-z",
        endpoint: "https://should-not-save.example.com",
      });

      expect(globalThis.game.settings.set).not.toHaveBeenCalledWith(
        "foundry-paste-eater",
        expect.stringContaining("endpoint"),
        expect.anything()
      );
    });

    it("clears the stored bucket when the destination source is not s3", async () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      await app._updateObject(null, {
        source: "data",
        target: "final-folder",
        bucket: "should-be-cleared",
      });

      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location-source", "data");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location", "final-folder");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location-bucket", "");
    });

    it("defaults blank destination form values and preserves picker fallbacks", async () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      const summaryField = {value: ""};
      const endpointField = {value: ""};
      const bucketGroup = {toggleClass: vi.fn()};
      const endpointGroup = {toggleClass: vi.fn()};

      app.form = {
        elements: {
          source: {
            value: "",
            options: [{value: "auto"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "   "},
          bucket: {value: "   "},
        },
        querySelector: vi.fn(selector => {
          if (selector === '[data-role="destination-summary"]') return summaryField;
          if (selector === '[data-role="s3-endpoint"]') return endpointField;
          return null;
        }),
      };
      app.element = {
        find: vi.fn(selector => selector.includes("endpoint") ? endpointGroup : bucketGroup),
      };

      app._refreshFormState();
      expect(summaryField.value).toContain("Automatic");
      expect(endpointField.value).toBe("");

      app._applyPickerSelection("", {
        activeSource: "",
        target: "picker-folder",
        sources: {},
      }, "auto");
      expect(app.form.elements.source.value).toBe("auto");
      expect(app.form.elements.target.value).toBe("picker-folder");

      await app._updateObject(null, {
        source: "   ",
        target: "   ",
        bucket: "bucket-z",
      });
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location-source", "auto");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location", "pasted_images");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "image-location-bucket", "");
      expect(JSON.parse(globalThis.game.settings.set.mock.calls.at(-1)[2])).toEqual(expect.arrayContaining([
        expect.objectContaining({storedSource: "data", target: "pasted_images"}),
        expect.objectContaining({storedSource: "auto", target: "pasted_images"}),
      ]));
    });

    it("uses default browse values and initializes missing s3 picker state", () => {
      const {FoundryPasteEaterDestinationConfig} = env.runtime;
      const app = new FoundryPasteEaterDestinationConfig();
      app.form = {
        elements: {
          source: {value: ""},
          target: {value: "   "},
          bucket: {value: "   "},
        },
      };

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });
      expect(env.MockFilePicker.instances.at(-1).current).toBe("pasted_images");

      app.form.elements.source.value = "s3";
      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });
      expect(env.MockFilePicker.instances.at(-1).sources.s3.bucket).toBe("");
      expect(env.MockFilePicker.instances.at(-1).sources.s3.target).toBe("pasted_images");
    });
  });

  describe("settings registration and hook wiring", () => {
    it("registers settings and menus", () => {
      api._clipboardRegisterSettings();
      expect(globalThis.game.settings.registerMenu).toHaveBeenCalled();
      expect(globalThis.game.settings.register).toHaveBeenCalled();
    });

    it("registers every module setting with the expected defaults and scopes", () => {
      api._clipboardRegisterSettings();

      expect(env.registeredMenus).toHaveLength(4);
      expect(env.registeredMenus[0]).toMatchObject({
        moduleId: "foundry-paste-eater",
        key: "upload-destination",
        config: {
          restricted: true,
          type: env.runtime.FoundryPasteEaterDestinationConfig,
        },
      });
      expect(env.registeredMenus[1]).toMatchObject({
        moduleId: "foundry-paste-eater",
        key: "recommended-defaults",
        config: {
          restricted: true,
          type: api.FoundryPasteEaterRecommendedDefaultsConfig,
        },
      });
      expect(env.registeredMenus[2]).toMatchObject({
        moduleId: "foundry-paste-eater",
        key: "readiness-support",
        config: {
          restricted: true,
          type: api.FoundryPasteEaterReadinessSupportConfig,
        },
      });
      expect(env.registeredMenus[3]).toMatchObject({
        moduleId: "foundry-paste-eater",
        key: "uploaded-media-audit",
        config: {
          restricted: true,
          type: api.FoundryPasteEaterUploadedMediaAuditConfig,
        },
      });

      const registeredByKey = new Map(env.registeredSettings.map(entry => [entry.key, entry.config]));
      const expectedSettings = {
        "image-location": {scope: "world", config: false, default: "pasted_images", type: String},
        "image-location-source": {scope: "world", config: false, default: "data", type: String},
        "image-location-bucket": {scope: "world", config: false, default: "", type: String},
        "known-upload-roots": {scope: "world", config: false, default: "[]", type: String},
        "verbose-logging": {scope: "client", config: true, default: false, type: Boolean},
        "minimum-role-canvas-media": {scope: "world", config: true, default: "PLAYER", type: String},
        "minimum-role-canvas-text": {scope: "world", config: true, default: "PLAYER", type: String},
        "minimum-role-chat-media": {scope: "world", config: true, default: "PLAYER", type: String},
        "allow-non-gm-scene-controls": {scope: "world", config: true, default: true, type: Boolean},
        "enable-chat-media": {scope: "world", config: true, default: true, type: Boolean},
        "enable-chat-upload-button": {scope: "world", config: true, default: true, type: Boolean},
        "enable-token-creation": {scope: "world", config: true, default: true, type: Boolean},
        "enable-tile-creation": {scope: "world", config: true, default: true, type: Boolean},
        "enable-token-replacement": {scope: "world", config: true, default: true, type: Boolean},
        "enable-tile-replacement": {scope: "world", config: true, default: true, type: Boolean},
        "enable-scene-paste-tool": {scope: "world", config: true, default: true, type: Boolean},
        "enable-scene-upload-tool": {scope: "world", config: true, default: true, type: Boolean},
        "default-empty-canvas-target": {scope: "world", config: true, default: "active-layer", type: String},
        "create-backing-actors": {scope: "world", config: true, default: true, type: Boolean},
        "pasted-token-actor-type": {scope: "world", config: true, default: "ask", type: String},
        "lock-pasted-token-rotation": {scope: "world", config: true, default: true, type: Boolean},
        "chat-media-display": {scope: "world", config: true, default: "thumbnail", type: String},
        "canvas-text-paste-mode": {scope: "world", config: true, default: "scene-notes", type: String},
        "scene-paste-prompt-mode": {scope: "world", config: true, default: "auto", type: String},
        "selected-token-paste-mode": {scope: "world", config: true, default: "prompt", type: String},
        "upload-path-organization": {scope: "world", config: true, default: "context-user-month", type: String},
      };

      expect(registeredByKey.size).toBe(Object.keys(expectedSettings).length);
      for (const [key, expected] of Object.entries(expectedSettings)) {
        expect(registeredByKey.get(key)).toMatchObject(expected);
      }

      expect(registeredByKey.get("minimum-role-canvas-media").choices).toMatchObject({
        PLAYER: "Player",
        TRUSTED: "Trusted Player",
        ASSISTANT: "Assistant GM",
        GAMEMASTER: "Gamemaster",
      });
      expect(registeredByKey.get("pasted-token-actor-type").choices).toMatchObject({
        ask: "Ask each time",
        "system-default": "System default",
        character: "Character",
        npc: "NPC",
      });
      for (const key of [
        "minimum-role-canvas-media",
        "minimum-role-chat-media",
        "allow-non-gm-scene-controls",
        "enable-chat-media",
        "enable-chat-upload-button",
        "enable-scene-paste-tool",
        "enable-scene-upload-tool",
      ]) {
        expect(registeredByKey.get(key).onChange).toBeTypeOf("function");
      }
      expect(env.settingsRegistry.size).toBe(Object.keys(expectedSettings).length);
    });

    it("opens the recommended-defaults review dialog and only reapplies configurable world defaults", async () => {
      api._clipboardRegisterSettings();

      await globalThis.game.settings.set("foundry-paste-eater", "image-location-source", "s3");
      await globalThis.game.settings.set("foundry-paste-eater", "verbose-logging", true);
      await globalThis.game.settings.set("foundry-paste-eater", "default-empty-canvas-target", "token");
      await globalThis.game.settings.set("foundry-paste-eater", "pasted-token-actor-type", "npc");
      await globalThis.game.settings.set("foundry-paste-eater", "lock-pasted-token-rotation", false);
      await globalThis.game.settings.set("foundry-paste-eater", "canvas-text-paste-mode", "disabled");
      await globalThis.game.settings.set("foundry-paste-eater", "selected-token-paste-mode", "scene-only");

      const app = new api.FoundryPasteEaterRecommendedDefaultsConfig();
      await app.render(true);

      expect(env.dialogInstances).toHaveLength(1);
      const dialog = env.dialogInstances[0];
      expect(dialog.data.title).toBe("Foundry Paste Eater: Apply Recommended Defaults");
      expect(dialog.data.content).toContain("Only configurable world behavior settings are changed here.");
      expect(dialog.data.content).toContain("Default empty-canvas paste target");
      expect(dialog.data.content).not.toContain("Pasted media source");
      expect(dialog.data.buttons.apply.label).toContain('<i class="fa-solid fa-wand-magic-sparkles"></i>');
      expect(dialog.data.buttons.cancel.label).toContain('<i class="fa-solid fa-xmark"></i>');

      await dialog.data.buttons.apply.callback();

      expect(env.settingsValues.get("foundry-paste-eater.default-empty-canvas-target")).toBe("active-layer");
      expect(env.settingsValues.get("foundry-paste-eater.create-backing-actors")).toBe(true);
      expect(env.settingsValues.get("foundry-paste-eater.pasted-token-actor-type")).toBe("ask");
      expect(env.settingsValues.get("foundry-paste-eater.lock-pasted-token-rotation")).toBe(true);
      expect(env.settingsValues.get("foundry-paste-eater.canvas-text-paste-mode")).toBe("scene-notes");
      expect(env.settingsValues.get("foundry-paste-eater.selected-token-paste-mode")).toBe("prompt");
      expect(env.settingsValues.get("foundry-paste-eater.upload-path-organization")).toBe("context-user-month");
      expect(env.settingsValues.get("foundry-paste-eater.image-location-source")).toBe("s3");
      expect(env.settingsValues.get("foundry-paste-eater.verbose-logging")).toBe(true);
      expect(globalThis.ui.notifications.info).toHaveBeenCalledWith(
        "Foundry Paste Eater: Applied 6 recommended world settings."
      );
    });

    it("opens a close-only recommended-defaults dialog when nothing differs", async () => {
      api._clipboardRegisterSettings();
      env.settingsValues.set("foundry-paste-eater.pasted-token-actor-type", "ask");
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "prompt");
      env.settingsValues.set("foundry-paste-eater.upload-path-organization", "context-user-month");

      const app = new api.FoundryPasteEaterRecommendedDefaultsConfig();
      await app.render(true);

      expect(env.dialogInstances).toHaveLength(1);
      const dialog = env.dialogInstances[0];
      expect(dialog.data.content).toContain("already matches the current Foundry Paste Eater configurable behavior defaults");
      expect(dialog.data.content).not.toContain("<ul>");
      expect(dialog.data.buttons.close.label).toContain('<i class="fa-solid fa-check"></i>');
      expect(dialog.data.buttons.apply).toBeUndefined();
      expect(dialog.data.buttons.cancel).toBeUndefined();
      expect(dialog.data.default).toBe("close");
    });

    it("rerenders scene controls when scene-control visibility settings change", async () => {
      api._clipboardRegisterSettings();

      globalThis.ui.controls.initialize.mockClear();
      globalThis.ui.controls.render.mockClear();

      await globalThis.game.settings.set("foundry-paste-eater", "allow-non-gm-scene-controls", true);

      expect(globalThis.ui.controls.initialize).toHaveBeenCalledWith({control: "tiles"});
      expect(globalThis.ui.controls.render).toHaveBeenCalledWith(true);
    });

    it("rerenders chat when chat visibility settings change", async () => {
      api._clipboardRegisterSettings();

      globalThis.ui.chat.render.mockClear();

      await globalThis.game.settings.set("foundry-paste-eater", "enable-chat-upload-button", false);

      expect(globalThis.ui.chat.render).toHaveBeenCalledWith(true);
    });

    it("wires init hooks without registering a custom paste keybinding", () => {
      expect(env.onceHandlers.init).toBeTypeOf("function");
      env.onceHandlers.init();
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("getSceneControlButtons", api._clipboardAddSceneControlButtons);
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("renderChatInput", api._clipboardOnRenderChatInput);
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("renderChatMessageHTML", api._clipboardOnRenderChatMessageHTML);
      expect(globalThis.game.keybindings.register).not.toHaveBeenCalled();
    });

    it("shows the ready notification for gms when direct clipboard reads are unavailable", async () => {
      const secondEnv = loadRuntime({
        customize() {
          Object.defineProperty(window.navigator, "clipboard", {
            configurable: true,
            value: {},
          });
          globalThis.game.user.isGM = true;
        },
      });

      await secondEnv.onceHandlers.ready();
      expect(globalThis.game.socket.on).toHaveBeenCalledWith("module.foundry-paste-eater", secondEnv.api._clipboardHandleSocketReport);
      expect(globalThis.ui.notifications.info).toHaveBeenCalledWith(
        "Foundry Paste Eater: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled."
      );
    });

    it("skips the ready notification for non-gms", async () => {
      const thirdEnv = loadRuntime({
        customize() {
          Object.defineProperty(window.navigator, "clipboard", {
            configurable: true,
            value: {},
          });
          globalThis.game.user.isGM = false;
        },
      });

      await thirdEnv.onceHandlers.ready();
      expect(globalThis.ui.notifications.info).not.toHaveBeenCalledWith(
        "Foundry Paste Eater: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled."
      );
    });
  });
});
