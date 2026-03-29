import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createClipboardItem, withMockImage, withMockVideo, withRejectingImage} from "./spec-helpers.js";

describe("paste and handler workflows", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("_clipboardApplyPasteResult", () => {
    it("replaces controlled documents before creating new ones", async () => {
      await expect(api._clipboardApplyPasteResult("path.png", {
        replacementTarget: {
          documentName: "Token",
          documents: [env.createPlaceableDocument("Token", {id: "token-1"})],
        },
        createStrategy: api._clipboardGetPlaceableStrategy("Token"),
        mousePos: {x: 100, y: 100},
      })).resolves.toBe(true);
    });

    it("creates new documents when there is no replacement target", async () => {
      const restoreImage = withMockImage({width: 200, height: 100});
      await expect(api._clipboardApplyPasteResult("path.png", {
        replacementTarget: null,
        createStrategy: api._clipboardGetPlaceableStrategy("Token"),
        mousePos: {x: 150, y: 250},
      })).resolves.toBe(true);
      restoreImage();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({
          actorId: expect.any(String),
          actorLink: false,
          texture: {src: "path.png"},
          width: 2,
          height: 1,
        }),
      ]);
      expect(globalThis.foundry.documents.Actor.create).toHaveBeenCalledWith(expect.objectContaining({
        img: "path.png",
        prototypeToken: expect.objectContaining({
          texture: {src: "path.png"},
        }),
      }));
    });

    it("fails when token actor creation does not return a usable actor", async () => {
      const restoreImage = withMockImage({width: 200, height: 100});
      globalThis.foundry.documents.Actor.create.mockResolvedValueOnce(null);

      await expect(api._clipboardApplyPasteResult("path.png", {
        replacementTarget: null,
        createStrategy: api._clipboardGetPlaceableStrategy("Token"),
        mousePos: {x: 150, y: 250},
      })).rejects.toThrow("backing Actor");

      restoreImage();
    });
  });

  describe("_clipboardPostChatImage and _clipboardPasteBlob", () => {
    it("uploads chat media and creates a chat message", async () => {
      await expect(api._clipboardPostChatImage(new File(["x"], "chat.png", {type: "image/png"}))).resolves.toBe(true);
    });

    it("returns false when canvas is unavailable for a blob paste", async () => {
      globalThis.canvas.ready = false;
      await expect(api._clipboardPasteBlob(new File(["x"], "a.png", {type: "image/png"}), {
        source: "data",
        target: "folder",
        bucket: "",
      })).resolves.toBe(false);
    });

    it("returns false when paste context is not eligible", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();

      await expect(api._clipboardPasteBlob(new File(["x"], "a.png", {type: "image/png"}), {
        source: "data",
        target: "folder",
        bucket: "",
      })).resolves.toBe(false);
    });

    it("creates pasted video media when fallback center placement is allowed", async () => {
      const restoreVideo = withMockVideo({width: 640, height: 360});
      await expect(api._clipboardPasteBlob(new File(["x"], "movie.webm", {type: "video/webm"}), {
        source: "data",
        target: "folder",
        bucket: "",
      }, {fallbackToCenter: true})).resolves.toBe(true);
      restoreVideo();
    });

    it("uses intrinsic SVG dimensions from the pasted file instead of browser fallback sizing", async () => {
      await expect(api._clipboardPasteBlob(new File([
        '<svg viewBox="0 0 512 512"><rect width="512" height="512"/></svg>',
      ], "token.svg", {type: "image/svg+xml"}), {
        source: "data",
        target: "folder",
        bucket: "",
      }, {fallbackToCenter: true})).resolves.toBe(true);

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Tile", [
        expect.objectContaining({
          texture: expect.objectContaining({
            src: expect.stringMatching(/^folder\/token-\d+\.svg\?clipboard-image=\d+$/),
          }),
          width: 512,
          height: 512,
        }),
      ]);
    });

    it("creates documents from an existing media path without uploading", async () => {
      const restoreImage = withMockImage({width: 200, height: 100});
      await expect(api._clipboardPasteMediaPath("worlds/test/pasted/file.svg", {fallbackToCenter: true})).resolves.toBe(true);
      restoreImage();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Tile", [
        expect.objectContaining({
          texture: {src: "worlds/test/pasted/file.svg"},
        }),
      ]);
    });

    it("skips existing media paths when the current paste context is ineligible", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();

      await expect(api._clipboardPasteMediaPath("worlds/test/pasted/file.svg")).resolves.toBe(false);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });
  });

  describe("_clipboardHasPasteConflict", () => {
    it("defers to copied objects by default", () => {
      globalThis.canvas.activeLayer.clipboard = {objects: [1]};
      expect(api._clipboardHasPasteConflict()).toBe(true);
    });

    it("blocks when the module is already handling a paste", () => {
      api._clipboardSetRuntimeState({locked: true});
      expect(api._clipboardHasPasteConflict({respectCopiedObjects: false})).toBe(true);
    });

    it("blocks when VTTA Tokenizer is active", () => {
      globalThis.game.modules.set("vtta-tokenizer", {active: true});
      globalThis.ui.windows.tokenizer = {id: "tokenizer-control"};
      expect(api._clipboardHasPasteConflict({respectCopiedObjects: false})).toBe(true);
    });

    it("returns false when no conflict exists", () => {
      expect(api._clipboardHasPasteConflict({respectCopiedObjects: false})).toBe(false);
    });
  });

  describe("_clipboardExecutePasteWorkflow", () => {
    it("returns the workflow result on success", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => "ok")).resolves.toBe("ok");
    });

    it("reports handled errors through notifications", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => {
        throw new Error("bad");
      })).resolves.toBe(false);

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: bad");
    });

    it("can suppress user notifications", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => {
        throw new Error("quiet");
      }, {notifyError: false, respectCopiedObjects: false})).resolves.toBe(false);
    });

    it("uses a generic message for non-Error failures", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => {
        throw "plain failure";
      })).resolves.toBe(false);

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Clipboard Image: Failed to handle media input. Check the console."
      );
    });
  });

  describe("media handlers", () => {
    it("handles blob media input", async () => {
      const restoreImage = withMockImage();
      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(true);
      restoreImage();
    });

    it("handles url media input", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {get: () => "image/png"},
        blob: async () => new Blob(["x"], {type: "image/png"}),
      });
      const restoreImage = withMockImage();
      await expect(api._clipboardHandleImageInput({url: "https://example.com/file.png"}, {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(true);
      restoreImage();
    });

    it("reports a clear error instead of creating canvas content when a direct media url download is blocked", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(api._clipboardHandleImageInput({url: "https://example.com/file.svg"}, {
        contextOptions: {fallbackToCenter: true},
      })).rejects.toThrow("cannot download and re-upload");

      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("returns false for empty media input", async () => {
      await expect(api._clipboardHandleImageInput(null)).resolves.toBe(false);
    });

    it("skips canvas media handling when the user lacks canvas media access", async () => {
      env.settingsValues.set("clipboard-image.minimum-role-canvas-media", "ASSISTANT");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(false);
    });

    it("fails closed when token creation is disabled", async () => {
      env.settingsValues.set("clipboard-image.enable-token-creation", false);
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true, requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fails closed when tile creation is disabled", async () => {
      env.settingsValues.set("clipboard-image.enable-tile-creation", false);
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true, requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fails closed when token replacement is disabled", async () => {
      env.settingsValues.set("clipboard-image.enable-token-replacement", false);
      globalThis.canvas.tokens.controlled = [env.createControlledPlaceable("Token", {name: "Hero"})];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fails closed when tile replacement is disabled", async () => {
      env.settingsValues.set("clipboard-image.enable-tile-replacement", false);
      globalThis.canvas.tiles.controlled = [env.createControlledPlaceable("Tile", {name: "Map"})];
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("falls back to text handling when media input resolves to non-media text", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      await expect(api._clipboardHandleImageInputWithTextFallback({
        url: "https://example.com/file.txt",
        text: "https://example.com/file.txt",
      }, {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(true);
    });

    it("rethrows when media handling fails and no fallback text exists", async () => {
      const restoreImage = withRejectingImage();
      await expect(api._clipboardHandleImageInputWithTextFallback({
        blob: new Blob(["x"], {type: "text/plain"}),
      }, {
        contextOptions: {fallbackToCenter: true},
      })).rejects.toThrow();
      restoreImage();
    });

    it("returns false when there is no chat blob to handle", async () => {
      await expect(api._clipboardHandleChatImageBlob(null)).resolves.toBe(false);
    });

    it("posts chat image blobs", async () => {
      await expect(api._clipboardHandleChatImageBlob(new File(["x"], "chat.png", {type: "image/png"}))).resolves.toBe(true);
    });

    it("skips chat media posting when chat media handling is disabled", async () => {
      env.settingsValues.set("clipboard-image.enable-chat-media", false);
      await expect(api._clipboardHandleChatImageBlob(new File(["x"], "chat.png", {type: "image/png"}))).resolves.toBe(false);
    });

    it("posts chat image urls", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {get: () => "image/png"},
        blob: async () => new Blob(["x"], {type: "image/png"}),
      });
      await expect(api._clipboardHandleChatImageInput({url: "https://example.com/file.png"})).resolves.toBe(true);
    });

    it("rejects blocked direct media urls in chat so the caller can fall back cleanly", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(api._clipboardHandleChatImageInput({url: "https://example.com/file.svg"})).rejects.toThrow(
        "cannot download and re-upload"
      );
      expect(globalThis.foundry.documents.ChatMessage.create).not.toHaveBeenCalled();
    });

    it("does not fall back to note text when a direct media url download is blocked on canvas", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(api._clipboardHandleImageInputWithTextFallback({
        url: "https://example.com/file.svg",
        text: "https://example.com/file.svg",
      }, {
        contextOptions: {fallbackToCenter: true},
      })).rejects.toThrow("cannot download and re-upload");
    });
  });

  describe("_clipboardHandleTextInput", () => {
    it("applies text to selected placeables", async () => {
      globalThis.canvas.tokens.controlled = [env.createControlledPlaceable("Token", {name: "Hero"})];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      await expect(api._clipboardHandleTextInput({text: "Attach to token"})).resolves.toBe(true);
    });

    it("creates a standalone text note when no placeable is selected", async () => {
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;
      await expect(api._clipboardHandleTextInput({text: "Standalone"})).resolves.toBe(true);
    });

    it("returns false for empty text", async () => {
      await expect(api._clipboardHandleTextInput({text: " \n"})).resolves.toBe(false);
    });

    it("returns false when canvas text paste is disabled", async () => {
      env.settingsValues.set("clipboard-image.canvas-text-paste-mode", "disabled");
      await expect(api._clipboardHandleTextInput({text: "Disabled"})).resolves.toBe(false);
    });

    it("returns false when the canvas is unavailable", async () => {
      globalThis.canvas.ready = false;
      await expect(api._clipboardHandleTextInput({text: "No canvas"})).resolves.toBe(false);
    });

    it("returns false when the current context is not eligible", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      await expect(api._clipboardHandleTextInput({text: "No focus"})).resolves.toBe(false);
    });
  });

  describe("clipboard-read orchestrators", () => {
    it("warns when no clipboard media exists", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([]);
      await expect(api._clipboardReadAndPasteImage({notifyNoImage: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith("Clipboard Image: No clipboard media was available.");
    });

    it("warns when clipboard content has no supported media", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([{types: ["text/plain"], getType: async () => ({text: async () => "plain"})}]);
      await expect(api._clipboardReadAndPasteImage({notifyNoImage: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Clipboard Image: No supported media or media URL was found in the clipboard."
      );
    });

    it("passes media input to a custom image-input handler", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"text/plain": "https://example.com/file.png"}),
      ]);
      const handler = vi.fn(async input => input);

      await expect(api._clipboardReadAndPasteImage({handleImageInput: handler})).resolves.toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });
    });

    it("passes resolved blobs to a custom blob handler", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"image/png": new Blob(["x"], {type: "image/png"})}),
      ]);
      const handler = vi.fn(async blob => blob);

      await expect(api._clipboardReadAndPasteImage({handleImageBlob: handler})).resolves.toBeInstanceOf(Blob);
    });

    it("handles clipboard media through the default image pipeline", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"image/png": new Blob(["x"], {type: "image/png"})}),
      ]);
      await expect(api._clipboardReadAndPasteImage({
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(true);
      restoreImage();
    });

    it("warns when no clipboard content exists", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([]);
      await expect(api._clipboardReadAndPasteClipboardContent({notifyNoContent: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith("Clipboard Image: No clipboard data was available.");
    });

    it("passes media input to a custom content handler", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"text/plain": "https://example.com/file.png"}),
      ]);
      const handler = vi.fn(async input => input);

      await expect(api._clipboardReadAndPasteClipboardContent({handleImageInput: handler})).resolves.toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });
    });

    it("passes plain text to a custom text handler", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"text/plain": "hello world"}),
      ]);
      const handler = vi.fn(async input => input);

      await expect(api._clipboardReadAndPasteClipboardContent({handleTextInput: handler})).resolves.toEqual({
        text: "hello world",
      });
    });

    it("falls back to default text handling when the clipboard has plain text", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"text/plain": "not a url"}),
      ]);
      await expect(api._clipboardReadAndPasteClipboardContent({notifyNoContent: true})).resolves.toBe(true);
    });

    it("warns when clipboard content has no supported media or text", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([
        createClipboardItem({"application/json": "{}"}),
      ]);
      await expect(api._clipboardReadAndPasteClipboardContent({notifyNoContent: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Clipboard Image: No supported media or text was found in the clipboard."
      );
    });
  });
});
