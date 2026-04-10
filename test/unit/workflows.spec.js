import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createClipboardItem, withMockImage, withMockVideo, withRejectingImage} from "./spec-helpers.js";

describe("paste and handler workflows", () => {
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
          actorLink: true,
          texture: {src: "path.png"},
          width: 2,
          height: 1,
          lockRotation: true,
        }),
      ]);
      expect(globalThis.foundry.documents.Actor.create).toHaveBeenCalledWith(expect.objectContaining({
        img: "path.png",
        prototypeToken: expect.objectContaining({
          texture: {src: "path.png"},
          lockRotation: true,
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

  describe("token replacement mode helpers", () => {
    it("falls back to scene-only replacement when no selected token replacement applies", async () => {
      await expect(api._clipboardResolveTokenReplacementBehavior({
        replacementTarget: null,
      }, "image")).resolves.toEqual({
        mode: "scene-only",
        uploadContext: "canvas",
        eligibility: null,
      });

      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "actor-art");
      await expect(api._clipboardResolveTokenReplacementBehavior({
        replacementTarget: {
          documentName: "Token",
          documents: [env.createPlaceableDocument("Token", {id: "token-video"})],
        },
      }, "video")).resolves.toEqual({
        mode: "scene-only",
        uploadContext: "canvas",
        eligibility: null,
      });

      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "scene-only");
      await expect(api._clipboardResolveTokenReplacementBehavior({
        replacementTarget: {
          documentName: "Token",
          documents: [env.createPlaceableDocument("Token", {id: "token-scene-only"})],
        },
      }, "image")).resolves.toEqual({
        mode: "scene-only",
        uploadContext: "canvas",
        eligibility: null,
      });
    });

    it("keeps prompt-mode token replacement scene-local when the selection is ineligible", async () => {
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "prompt");
      const actor = env.createActor({id: "actor-ineligible"});
      actor.canUserModify = () => true;

      await expect(api._clipboardResolveTokenReplacementBehavior({
        replacementTarget: {
          documentName: "Token",
          documents: [env.createPlaceableDocument("Token", {
            id: "token-ineligible",
            actor,
            actorId: actor.id,
            actorLink: false,
          })],
          requestedCount: 1,
        },
      }, "image")).resolves.toMatchObject({
        mode: "scene-only",
        uploadContext: "canvas",
        eligibility: {
          eligible: false,
        },
      });
    });

    it("defaults the prompt helper to scene-only when the dialog closes", async () => {
      const prompt = api._clipboardPromptSelectedTokenPasteMode();
      expect(env.dialogInstances).toHaveLength(1);
      env.dialogInstances.at(-1).data.close();

      await expect(prompt).resolves.toBe("scene-only");
    });

    it("restores .game focus after the selected-token mode prompt resolves", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><button id="other">Other</button>';
      document.getElementById("other").focus();

      const prompt = api._clipboardPromptSelectedTokenPasteMode();
      expect(env.dialogInstances).toHaveLength(1);
      env.dialogInstances.at(-1).data.buttons.actorArt.callback();

      await expect(prompt).resolves.toBe("actor-art");
      expect(document.activeElement).toBe(document.querySelector(".game"));
    });

    it("renders the selected-token prompt with a dedicated layout class and wider dialog width", async () => {
      const prompt = api._clipboardPromptSelectedTokenPasteMode();
      expect(env.dialogInstances).toHaveLength(1);
      const dialog = env.dialogInstances.at(-1);

      expect(dialog.options.classes).toContain("foundry-paste-eater-token-mode-dialog");
      expect(dialog.options.width).toBe(760);

      dialog.data.close();
      await expect(prompt).resolves.toBe("scene-only");
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
            src: expect.stringMatching(/^folder\/token-\d+\.svg\?foundry-paste-eater=\d+$/),
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

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: bad"
      );
    });

    it("can suppress user notifications", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => {
        throw new Error("quiet");
      }, {notifyError: false, respectCopiedObjects: false})).resolves.toBe(false);

      expect(globalThis.ui.notifications.error).not.toHaveBeenCalled();
      expect(env.dialogInstances).toHaveLength(0);
    });

    it("uses a generic message for non-Error failures", async () => {
      await expect(api._clipboardExecutePasteWorkflow(async () => {
        throw "plain failure";
      })).resolves.toBe(false);

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: Failed to handle media input. Check the console."
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

    it("rasterizes gif canvas pastes into static png textures", async () => {
      env.settingsValues.set("foundry-paste-eater.create-backing-actors", false);
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      const restoreImage = withMockImage({width: 64, height: 32});
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      const drawImage = vi.fn();
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage})),
          toBlob: callback => callback(new Blob(["png"], {type: "image/png"})),
        };
      });

      try {
        await expect(api._clipboardHandleImageBlob(new File(["gif"], "test-animated.gif", {type: "image/gif"}), {
          contextOptions: {fallbackToCenter: true},
        })).resolves.toBe(true);
      } finally {
        restoreImage();
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }

      expect(drawImage).toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({
          texture: expect.objectContaining({
            src: expect.stringMatching(/test-animated-\d+\.png\?foundry-paste-eater=\d+$/),
          }),
        }),
      ]);
    });

    it("updates actor portrait and linked token art when the selected-token mode is actor-art", async () => {
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "actor-art");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-art",
        img: "old-portrait.png",
        prototypeToken: {
          texture: {src: "old-token.png"},
        },
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-art",
        actor,
        actorId: actor.id,
        actorLink: true,
        canUserModify: () => true,
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      const restoreImage = withMockImage();
      await expect(api._clipboardHandleImageBlob(new File(["x"], "portrait.png", {type: "image/png"}), {
        contextOptions: {requireCanvasFocus: false},
      })).resolves.toBe(true);
      restoreImage();

      expect(actor.img).toMatch(/^pasted_images\/portrait-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(actor.prototypeToken.texture.src).toBe(actor.img);
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({
          _id: "token-art",
          "texture.src": actor.img,
        }),
      ]);
    });

    it("fails closed when actor-art mode is selected for an ineligible token selection", async () => {
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "actor-art");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-unlinked",
        img: "old-portrait.png",
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-unlinked",
        actor,
        actorId: actor.id,
        actorLink: false,
        canUserModify: () => true,
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      const restoreImage = withMockImage();
      await expect(api._clipboardHandleImageBlob(new File(["x"], "portrait.png", {type: "image/png"}), {
        contextOptions: {requireCanvasFocus: false},
      })).rejects.toThrow("linked to a base Actor");
      restoreImage();

      expect(actor.update).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("can prompt for actor-art replacement and honor the actor-wide choice", async () => {
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "prompt");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-prompt",
        img: "old-portrait.png",
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-prompt",
        actor,
        actorId: actor.id,
        actorLink: true,
        canUserModify: () => true,
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      const OriginalDialog = globalThis.Dialog;
      globalThis.Dialog = class PromptDialog {
        constructor(data) {
          this.data = data;
        }

        render() {
          this.data.buttons.actorArt.callback();
          return this;
        }
      };

      const restoreImage = withMockImage();
      try {
        await expect(api._clipboardHandleImageBlob(new File(["x"], "portrait.png", {type: "image/png"}), {
          contextOptions: {requireCanvasFocus: false},
        })).resolves.toBe(true);
      } finally {
        restoreImage();
        globalThis.Dialog = OriginalDialog;
      }

      expect(actor.img).toMatch(/^pasted_images\/portrait-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(actor.prototypeToken.texture.src).toBe(actor.img);
    });

    it("can prompt for token replacement and keep the scene-only choice", async () => {
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "prompt");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-scene-prompt",
        img: "old-portrait.png",
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-scene-prompt",
        actor,
        actorId: actor.id,
        actorLink: true,
        canUserModify: () => true,
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      const OriginalDialog = globalThis.Dialog;
      globalThis.Dialog = class PromptDialog {
        constructor(data) {
          this.data = data;
        }

        render() {
          this.data.buttons.sceneOnly.callback();
          return this;
        }
      };

      const restoreImage = withMockImage();
      try {
        await expect(api._clipboardHandleImageBlob(new File(["x"], "portrait.png", {type: "image/png"}), {
          contextOptions: {requireCanvasFocus: false},
        })).resolves.toBe(true);
      } finally {
        restoreImage();
        globalThis.Dialog = OriginalDialog;
      }

      expect(actor.update).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({
          _id: "token-scene-prompt",
          "texture.src": expect.stringMatching(/^pasted_images\/portrait-\d+\.png\?foundry-paste-eater=\d+$/),
        }),
      ]);
    });

    it("uses a pre-resolved replacement context even if selection state changes before upload completes", async () => {
      const restoreImage = withMockImage();
      const note = env.createControlledPlaceable("Note", {id: "note-a"});
      globalThis.canvas.notes.controlled = [note];
      globalThis.canvas.notes.controlledObjects.set(note.document.id, note);
      globalThis.canvas.activeLayer = globalThis.canvas.notes;

      const context = api._clipboardResolvePasteContext({requireCanvasFocus: false});

      globalThis.canvas.notes.controlled = [];
      globalThis.canvas.notes.controlledObjects.clear();
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        context,
      })).resolves.toBe(true);
      restoreImage();

      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          _id: "note-a",
          "texture.src": expect.stringMatching(/^pasted_images\/image-\d+\.png\?foundry-paste-eater=\d+$/),
        }),
      ]);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
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

    it("fills a focused actor art field with uploaded media instead of creating canvas content", async () => {
      const restoreImage = withMockImage();
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = `
        <input type="text" name="img" value="">
        <img data-edit="img" src="icons/svg/mystery-man.svg">
      `;
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');
      field.focus();

      await expect(api._clipboardHandleArtFieldImageInput(
        {blob: new File(["x"], "portrait.png", {type: "image/png"})},
        field
      )).resolves.toBe(true);

      restoreImage();
      expect(field.value).toMatch(/^pasted_images\/portrait-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(appRoot.querySelector('[data-edit="img"]').src).toContain("pasted_images/portrait-");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fills a focused item art field with uploaded media instead of creating canvas content", async () => {
      const restoreImage = withMockImage();
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "item-app";
      appRoot.innerHTML = `
        <input type="text" name="img" value="">
        <img data-edit="img" src="icons/svg/item-bag.svg">
      `;
      document.body.append(appRoot);
      globalThis.ui.windows["item-app"] = {
        object: {documentName: "Item"},
      };
      const field = appRoot.querySelector('input[name="img"]');
      field.focus();

      await expect(api._clipboardHandleArtFieldImageInput(
        {blob: new File(["x"], "item-art.png", {type: "image/png"})},
        field
      )).resolves.toBe(true);

      restoreImage();
      expect(field.value).toMatch(/^pasted_images\/item-art-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(appRoot.querySelector('[data-edit="img"]').src).toContain("pasted_images/item-art-");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fills a focused token texture field with uploaded video instead of creating canvas content", async () => {
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "token-app";
      appRoot.innerHTML = `
        <input type="text" name="prototypeToken.texture.src" value="">
        <video data-edit="prototypeToken.texture.src" src=""></video>
      `;
      document.body.append(appRoot);
      globalThis.ui.windows["token-app"] = {
        object: {documentName: "Token"},
      };
      const field = appRoot.querySelector('input[name="prototypeToken.texture.src"]');
      field.focus();

      await expect(api._clipboardHandleArtFieldImageInput(
        {blob: new File(["x"], "token-art.webm", {type: "video/webm"})},
        field
      )).resolves.toBe(true);

      expect(field.value).toMatch(/^pasted_images\/token-art-\d+\.webm\?foundry-paste-eater=\d+$/);
      expect(appRoot.querySelector('[data-edit="prototypeToken.texture.src"]').src).toContain("pasted_images/token-art-");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("rasterizes gif uploads for focused token texture fields", async () => {
      const restoreImage = withMockImage({width: 64, height: 32});
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage: vi.fn()})),
          toBlob: callback => callback(new Blob(["png"], {type: "image/png"})),
        };
      });

      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "token-app";
      appRoot.innerHTML = `
        <input type="text" name="prototypeToken.texture.src" value="">
        <video data-edit="prototypeToken.texture.src" src=""></video>
      `;
      document.body.append(appRoot);
      globalThis.ui.windows["token-app"] = {
        object: {documentName: "Token"},
      };
      const field = appRoot.querySelector('input[name="prototypeToken.texture.src"]');
      field.focus();

      try {
        await expect(api._clipboardHandleArtFieldImageInput(
          {blob: new File(["gif"], "token-art.gif", {type: "image/gif"})},
          field
        )).resolves.toBe(true);
      } finally {
        restoreImage();
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }

      expect(field.value).toMatch(/^pasted_images\/token-art-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(appRoot.querySelector('[data-edit="prototypeToken.texture.src"]').src).toContain("pasted_images/token-art-");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("falls back to the original direct media url for a focused art field when download is blocked", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = '<input type="text" name="img" value=""><img data-edit="img" src="">';
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');

      await expect(api._clipboardHandleArtFieldImageInput({
        url: "https://example.com/file.svg",
      }, field)).resolves.toBe(true);

      expect(field.value).toBe("https://example.com/file.svg");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("falls back to the pasted blob for a focused art field when a preferred direct media url download is blocked", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const restoreImage = withMockImage();
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = '<input type="text" name="img" value=""><img data-edit="img" src="">';
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');

      await expect(api._clipboardHandleArtFieldImageInput({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: new File(["x"], "copied-image.png", {type: "image/png"}),
      }, field)).resolves.toBe(true);

      restoreImage();
      expect(field.value).toMatch(/^pasted_images\/copied-image-\d+\.png\?foundry-paste-eater=\d+$/);
      expect(appRoot.querySelector('[data-edit="img"]').src).toContain("pasted_images/copied-image-");
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("rejects unsupported video media for focused actor portrait fields", async () => {
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = '<input type="text" name="img" value="">';
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');

      await expect(api._clipboardHandleArtFieldImageInput(
        {blob: new File(["x"], "portrait.webm", {type: "video/webm"})},
        field
      )).rejects.toThrow("does not support pasted video media");
    });

    it("fails clearly when a blocked direct video url targets an image-only art field", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = '<input type="text" name="img" value="">';
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');

      await expect(api._clipboardHandleArtFieldImageInput({
        url: "https://example.com/portrait.webm",
      }, field)).rejects.toMatchObject({
        message: "The focused img field does not support pasted video media.",
        clipboardContentSummary: "a video",
      });
    });

    it("annotates focused art-field write failures with the attempted clipboard content", async () => {
      const restoreImage = withMockImage();
      const appRoot = document.createElement("section");
      appRoot.dataset.appid = "actor-app";
      appRoot.innerHTML = '<input type="text" name="img" value=""><img data-edit="img" src="">';
      document.body.append(appRoot);
      globalThis.ui.windows["actor-app"] = {
        object: {documentName: "Actor"},
      };
      const field = appRoot.querySelector('input[name="img"]');
      field.dispatchEvent = vi.fn(() => {
        throw new Error("field write failed");
      });

      await expect(api._clipboardHandleArtFieldImageInput(
        {blob: new File(["x"], "portrait.png", {type: "image/png"})},
        field
      )).rejects.toMatchObject({
        message: "field write failed",
        clipboardContentSummary: "an image",
      });

      restoreImage();
    });

    it("returns false for empty media input", async () => {
      await expect(api._clipboardHandleImageInput(null)).resolves.toBe(false);
    });

    it("skips canvas media handling when the user lacks canvas media access", async () => {
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "ASSISTANT");
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(false);
    });

    it("fails closed when token creation is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.enable-token-creation", false);
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true, requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fails closed when tile creation is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.enable-tile-creation", false);
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageBlob(new File(["x"], "image.png", {type: "image/png"}), {
        contextOptions: {fallbackToCenter: true, requireCanvasFocus: false},
      })).resolves.toBe(false);

      restoreImage();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it("fails closed when token replacement is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.enable-token-replacement", false);
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
      env.settingsValues.set("foundry-paste-eater.enable-tile-replacement", false);
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

    it("routes organized uploads into chat, canvas, and document-art prefixes", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-01T10:00:00Z"));
      env.settingsValues.set("foundry-paste-eater.upload-path-organization", "context-user-month");

      try {
        await expect(api._clipboardHandleChatImageBlob(new File(["x"], "chat.png", {type: "image/png"}))).resolves.toBe(true);
        expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
          content: expect.stringContaining("pasted_images/chat/user-1/2026-04/"),
        }));

        const restoreImage = withMockImage();
        await expect(api._clipboardHandleImageBlob(new File(["x"], "scene.png", {type: "image/png"}), {
          contextOptions: {fallbackToCenter: true},
        })).resolves.toBe(true);
        restoreImage();
        expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Tile", [
          expect.objectContaining({
            texture: {
              src: expect.stringMatching(/^pasted_images\/canvas\/user-1\/2026-04\/scene-\d+\.png\?foundry-paste-eater=\d+$/),
            },
          }),
        ]);

        const appRoot = document.createElement("section");
        appRoot.dataset.appid = "actor-app";
        appRoot.innerHTML = '<input type="text" name="img" value=""><img data-edit="img" src="">';
        document.body.append(appRoot);
        globalThis.ui.windows["actor-app"] = {
          object: {documentName: "Actor"},
        };
        const field = appRoot.querySelector('input[name="img"]');

        const restoreArtImage = withMockImage();
        await expect(api._clipboardHandleArtFieldImageInput(
          {blob: new File(["x"], "portrait.png", {type: "image/png"})},
          field
        )).resolves.toBe(true);
        restoreArtImage();

        expect(field.value).toMatch(/^pasted_images\/document-art\/user-1\/2026-04\/portrait-\d+\.png\?foundry-paste-eater=\d+$/);
      } finally {
        vi.useRealTimers();
      }
    });

    it("skips chat media posting when chat media handling is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
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

    it("returns false for empty chat media input", async () => {
      await expect(api._clipboardHandleChatImageInput(null)).resolves.toBe(false);
    });

    it("rejects blocked direct media urls in chat so the caller can fall back cleanly", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      await expect(api._clipboardHandleChatImageInput({url: "https://example.com/file.svg"})).rejects.toThrow(
        "cannot download and re-upload"
      );
      expect(globalThis.foundry.documents.ChatMessage.create).not.toHaveBeenCalled();
    });

    it("falls back to the pasted blob when a preferred direct media url download is blocked on canvas", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const restoreImage = withMockImage();

      await expect(api._clipboardHandleImageInput({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: new File(["x"], "copied-image.png", {type: "image/png"}),
      }, {
        contextOptions: {fallbackToCenter: true},
      })).resolves.toBe(true);

      restoreImage();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalled();
    });

    it("falls back to the pasted blob when a preferred direct media url download is blocked in chat", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(api._clipboardHandleChatImageInput({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: new File(["x"], "copied-image.png", {type: "image/png"}),
      })).resolves.toBe(true);

      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalled();
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

    it("rejects video media for selected note replacements", async () => {
      globalThis.canvas.activeLayer = globalThis.canvas.notes;
      globalThis.canvas.notes.controlled = [env.createControlledPlaceable("Note", {id: "note-video"})];

      await expect(api._clipboardHandleImageBlob(new File(["x"], "clip.webm", {type: "video/webm"}), {
        contextOptions: {fallbackToCenter: true, requireCanvasFocus: false},
      })).rejects.toThrow("Selected note targets do not support pasted video media");

      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
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

    it("appends text to selected scene notes", async () => {
      const entry = env.createJournalEntry({
        id: "entry-note",
        name: "Note Entry",
        pages: [{
          id: "page-note",
          type: "text",
          text: {content: "<p>Before</p>", format: 1},
        }],
      });
      const note = env.createControlledPlaceable("Note", {
        id: "note-1",
        entryId: entry.id,
        pageId: "page-note",
        text: "Target Note",
      });
      globalThis.canvas.notes.controlled = [note];
      globalThis.canvas.activeLayer = globalThis.canvas.notes;

      await expect(api._clipboardHandleTextInput({text: "After"})).resolves.toBe(true);
      expect(entry.pages.get("page-note").update).toHaveBeenCalledWith({
        "text.content": "<p>Before</p><hr><p>After</p>",
        "text.format": 9,
      });
    });

    it("returns false for empty text", async () => {
      await expect(api._clipboardHandleTextInput({text: " \n"})).resolves.toBe(false);
    });

    it("returns false when canvas text paste is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "disabled");
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

    it("annotates standalone text-note creation failures with the attempted content summary", async () => {
      globalThis.canvas.scene.createEmbeddedDocuments.mockRejectedValueOnce(new Error("scene note write failed"));

      await expect(api._clipboardHandleTextInput({text: "Broken note"})).rejects.toMatchObject({
        message: "scene note write failed",
        clipboardContentSummary: "text",
      });
    });
  });

  describe("PDF workflows", () => {
    function installMockPdfJsPreview() {
      const originalPdfJsLib = globalThis.pdfjsLib;
      const originalCreateElement = document.createElement.bind(document);
      const render = vi.fn(() => ({promise: Promise.resolve()}));
      const getViewport = vi.fn(({scale}) => ({
        width: 720 * scale,
        height: 1000 * scale,
      }));
      globalThis.pdfjsLib = {
        getDocument: vi.fn(() => ({
          promise: Promise.resolve({
            getPage: vi.fn(async () => ({
              getViewport,
              render,
            })),
          }),
        })),
      };
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage: vi.fn()})),
          toBlob: callback => callback(new Blob(["preview"], {type: "image/png"})),
        };
      });

      return () => {
        globalThis.pdfjsLib = originalPdfJsLib;
        document.createElement = originalCreateElement;
      };
    }

    it("describes and names PDF inputs", () => {
      expect(api._clipboardDescribePdfInput(null)).toBeNull();
      expect(api._clipboardDescribePdfInput({
        blob: new File(["pdf"], "named.pdf", {type: "application/pdf"}),
      })).toMatchObject({
        source: "blob",
        name: "named.pdf",
        type: "application/pdf",
      });
      expect(api._clipboardDescribePdfInput({
        url: "https://example.com/named.pdf",
      })).toEqual({
        source: "url",
        url: "https://example.com/named.pdf",
      });
      expect(api._clipboardGetPdfFilename({}, new File(["pdf"], "named", {type: "application/pdf"}))).toBe("named.pdf");
      expect(api._clipboardGetPdfFilename({url: "https://example.com/source.pdf"})).toBe("source.pdf");
      expect(api._clipboardGetPdfDisplayName({url: "https://example.com/source.pdf"})).toBe("source");
      expect(api._clipboardSanitizePdfPreviewBaseName(" Bad PDF!!.pdf ")).toBe("Bad-PDF");
    });

    it("detects blocked direct PDF URLs that may use external URL fallback", () => {
      const blocked = new Error("Failed to download pasted PDF URL from https://example.com/handout.pdf");
      expect(api._clipboardIsBlockedDirectPdfUrlDownload({url: "https://example.com/handout.pdf"}, blocked)).toBe(true);
      expect(api._clipboardCanUseExternalPdfUrlFallback({url: "https://example.com/handout.pdf"}, blocked)).toBe(true);
      expect(api._clipboardCanUseExternalPdfUrlFallback({url: "https://example.com/handout.txt"}, blocked)).toBe(false);
      expect(api._clipboardIsBlockedDirectPdfUrlDownload(null, blocked)).toBe(false);
    });

    it("generates PDF preview blobs through available pdfjs rendering", async () => {
      const restorePreview = installMockPdfJsPreview();
      try {
        const pdfBlob = new File(["pdf"], "handout.pdf", {type: "application/pdf"});
        const preview = await api._clipboardTryCreatePdfPreviewBlob({
          blob: pdfBlob,
        }, pdfBlob, "Handout PDF.pdf");

        expect(preview).toBeInstanceOf(File);
        expect(preview.name).toBe("Handout-PDF-preview.png");
        expect(preview.type).toBe("image/png");
        expect(globalThis.pdfjsLib.getDocument).toHaveBeenCalled();
      } finally {
        restorePreview();
      }
    });

    it("supports FileReader fallback paths while generating PDF previews", async () => {
      const restorePreview = installMockPdfJsPreview();
      const OriginalFileReader = globalThis.FileReader;
      const pdfBlob = new File(["pdf"], "fallback.pdf", {type: "application/pdf"});
      Object.defineProperty(pdfBlob, "arrayBuffer", {
        configurable: true,
        value: undefined,
      });

      try {
        globalThis.FileReader = class {
          readAsArrayBuffer() {
            this.result = new ArrayBuffer(3);
            this.onload();
          }
        };
        await expect(api._clipboardTryCreatePdfPreviewBlob({
          blob: pdfBlob,
        }, pdfBlob, "Fallback.pdf")).resolves.toBeInstanceOf(File);

        globalThis.FileReader = class {
          readAsArrayBuffer() {
            this.error = new Error("read failed");
            this.onerror();
          }
        };
        await expect(api._clipboardTryCreatePdfPreviewBlob({
          blob: pdfBlob,
        }, pdfBlob, "Fallback.pdf")).resolves.toBeNull();
      } finally {
        globalThis.FileReader = OriginalFileReader;
        restorePreview();
      }
    });

    it("treats PDF preview generation as optional", async () => {
      await expect(api._clipboardTryCreatePdfPreviewBlob({
        blob: new File(["pdf"], "handout.pdf", {type: "application/pdf"}),
      })).resolves.toBeNull();

      const originalPdfJsLib = globalThis.pdfjsLib;
      globalThis.pdfjsLib = {
        getDocument: vi.fn(() => {
          throw new Error("pdfjs failed");
        }),
      };
      await expect(api._clipboardTryCreatePdfPreviewBlob({
        blob: new File(["pdf"], "handout.pdf", {type: "application/pdf"}),
      })).resolves.toBeNull();
      globalThis.pdfjsLib = originalPdfJsLib;
    });

    it("resolves PDF resources with best-effort preview uploads", async () => {
      const restorePreview = installMockPdfJsPreview();
      try {
        const resource = await api._clipboardResolvePdfResource({
          blob: new File(["pdf"], "resource.pdf", {type: "application/pdf"}),
        });

        expect(resource).toMatchObject({
          name: "resource",
          src: expect.stringMatching(/^pasted_images\/resource-\d+\.pdf\?foundry-paste-eater=\d+$/),
          previewSrc: expect.stringMatching(/^pasted_images\/resource-preview-\d+\.png\?foundry-paste-eater=\d+$/),
          external: false,
        });
      } finally {
        restorePreview();
      }
    });

    it("does not block PDF resource creation when preview upload fails", async () => {
      const restorePreview = installMockPdfJsPreview();
      env.MockFilePicker.upload
        .mockResolvedValueOnce({path: "pasted_images/resource.pdf"})
        .mockRejectedValueOnce(new Error("preview upload failed"));

      try {
        const resource = await api._clipboardResolvePdfResource({
          blob: new File(["pdf"], "resource.pdf", {type: "application/pdf"}),
        });

        expect(resource).toMatchObject({
          src: expect.stringMatching(/^pasted_images\/resource\.pdf\?foundry-paste-eater=\d+$/),
          previewSrc: "",
          external: false,
        });
      } finally {
        restorePreview();
      }
    });

    it("returns null for empty PDF resources", async () => {
      await expect(api._clipboardResolvePdfResource(null)).resolves.toBeNull();
    });

    it("creates a shared Journal PDF page and rich chat card from a pasted PDF", async () => {
      await expect(api._clipboardHandleChatPdfInput({
        blob: new File(["pdf"], "handout.pdf", {type: "application/pdf"}),
      })).resolves.toBe(true);

      expect(globalThis.foundry.documents.JournalEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        name: "handout",
        ownership: expect.objectContaining({
          default: 2,
          "user-1": 3,
        }),
        pages: [expect.objectContaining({
          type: "pdf",
          src: expect.stringMatching(/^pasted_images\/handout-\d+\.pdf\?foundry-paste-eater=\d+$/),
        })],
      }));
      const message = globalThis.game.messages.contents.at(-1);
      expect(message.content).toContain("foundry-paste-eater-chat-pdf-message");
      expect(message.content).toContain("data-uuid=");
      expect(message.content).toContain("Open PDF");
    });

    it("renders chat PDF preview thumbnails when a preview upload exists", async () => {
      const entry = env.createJournalEntry({
        id: "entry-chat-pdf-preview",
        pages: [{
          id: "page-chat-pdf-preview",
          type: "pdf",
          src: "folder/handout.pdf",
        }],
      });
      const html = api._clipboardCreateChatPdfContent({
        entry,
        page: entry.pages.get("page-chat-pdf-preview"),
        pdfData: {
          name: "Handout",
          src: "folder/handout.pdf",
          previewSrc: "folder/handout-preview.png",
        },
      });

      expect(html).toContain("folder/handout-preview.png");
      expect(html).toContain("PDF preview: Handout");
    });

    it("creates external URL PDF chat references when browser download is blocked", async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(api._clipboardHandleChatPdfInput({
        url: "https://example.com/handout.pdf",
        text: "https://example.com/handout.pdf",
      })).resolves.toBe(true);

      expect(env.MockFilePicker.upload).not.toHaveBeenCalled();
      expect(globalThis.foundry.documents.JournalEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        pages: [expect.objectContaining({
          type: "pdf",
          src: "https://example.com/handout.pdf",
          flags: {
            "foundry-paste-eater": expect.objectContaining({
              pdfExternal: true,
            }),
          },
        })],
      }));
      expect(globalThis.game.messages.contents.at(-1).content).toContain("External PDF URL");
    });

    it("returns false when PDF chat handling is disabled", async () => {
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
      await expect(api._clipboardHandleChatPdfInput({
        blob: new File(["pdf"], "handout.pdf", {type: "application/pdf"}),
      })).resolves.toBe(false);
    });

    it("annotates PDF chat handling failures", async () => {
      globalThis.foundry.documents.JournalEntry.create.mockRejectedValueOnce(new Error("journal write failed"));

      await expect(api._clipboardHandleChatPdfInput({
        blob: new File(["pdf"], "broken.pdf", {type: "application/pdf"}),
      })).rejects.toMatchObject({
        message: "journal write failed",
        clipboardContentSummary: "a PDF",
      });
    });

    it("creates a canvas Journal Note for pasted PDFs without replacing selected tokens or tiles", async () => {
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      const selectedToken = env.createControlledPlaceable("Token", {id: "token-pdf"});
      globalThis.canvas.tokens.controlled = [selectedToken];

      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "map-handout.pdf", {type: "application/pdf"}),
      })).resolves.toBe(true);

      expect(globalThis.canvas.scene.updateEmbeddedDocuments).not.toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          text: "map-handout",
          entryId: expect.any(String),
          pageId: expect.any(String),
          x: 150,
          y: 250,
        }),
      ]);
      const entry = globalThis.game.journal.contents.at(-1);
      expect(entry.pages.contents.at(-1)).toMatchObject({
        type: "pdf",
        src: expect.stringMatching(/^pasted_images\/map-handout-\d+\.pdf\?foundry-paste-eater=\d+$/),
      });
    });

    it("returns false for canvas PDF handling when canvas text is disabled or context is ineligible", async () => {
      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "disabled");
      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "disabled.pdf", {type: "application/pdf"}),
      })).resolves.toBe(false);

      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "scene-notes");
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "ineligible.pdf", {type: "application/pdf"}),
      })).resolves.toBe(false);

      globalThis.canvas.ready = false;
      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "unready.pdf", {type: "application/pdf"}),
      })).resolves.toBe(false);
    });

    it("appends PDFs to selected scene notes and repoints the note", async () => {
      const entry = env.createJournalEntry({
        id: "entry-selected-note",
        name: "Selected Note",
        pages: [],
      });
      const note = env.createPlaceableDocument("Note", {
        id: "selected-note",
        entryId: entry.id,
        text: "Selected Note",
      });
      globalThis.canvas.notes.controlled = [{document: note}];

      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "appendix.pdf", {type: "application/pdf"}),
      })).resolves.toBe(true);

      expect(entry.createEmbeddedDocuments).toHaveBeenCalledWith("JournalEntryPage", [
        expect.objectContaining({
          type: "pdf",
          src: expect.stringMatching(/^pasted_images\/appendix-\d+\.pdf\?foundry-paste-eater=\d+$/),
        }),
      ]);
      expect(entry.update).not.toHaveBeenCalledWith(expect.objectContaining({
        ownership: expect.any(Object),
      }));
      expect(note.update).toHaveBeenCalledWith(expect.objectContaining({
        entryId: entry.id,
        pageId: expect.any(String),
        text: "appendix",
      }));
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalledWith("Token", expect.any(Array));
      expect(globalThis.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalledWith("Tile", expect.any(Array));
    });

    it("fails closed when selected scene notes are not editable for PDF append", async () => {
      const note = env.createPlaceableDocument("Note", {
        id: "selected-note-locked",
        isOwner: false,
      });
      globalThis.game.user.isGM = false;
      globalThis.canvas.notes.controlled = [{document: note}];

      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "appendix.pdf", {type: "application/pdf"}),
      })).rejects.toMatchObject({
        message: "Selected scene notes must be editable before a pasted PDF can be attached to them.",
        clipboardContentSummary: "a PDF",
      });
    });

    it("preflights selected scene note Journal entry updates before uploading PDFs", async () => {
      const entry = env.createJournalEntry({
        id: "entry-selected-note-locked",
        name: "Private Journal",
        isOwner: false,
      });
      const note = env.createPlaceableDocument("Note", {
        id: "selected-note-linked-locked-entry",
        entryId: entry.id,
        text: "Target Note",
        isOwner: true,
      });
      globalThis.game.user.isGM = false;
      globalThis.canvas.notes.controlled = [{document: note}];

      await expect(api._clipboardHandleCanvasPdfInput({
        blob: new File(["pdf"], "appendix.pdf", {type: "application/pdf"}),
      })).rejects.toMatchObject({
        message: "Selected scene notes must be linked to Journal entries you can update before a pasted PDF can be attached to them.",
        clipboardContentSummary: "a PDF",
      });

      expect(env.MockFilePicker.upload).not.toHaveBeenCalled();
      expect(entry.createEmbeddedDocuments).not.toHaveBeenCalled();
      expect(note.update).not.toHaveBeenCalled();
    });

    it("fills focused PDF Journal page src fields from uploaded PDFs", async () => {
      const root = document.createElement("form");
      root.id = "JournalEntryPageConfig-2";
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

      await expect(api._clipboardHandlePdfFieldInput({
        blob: new File(["pdf"], "form.pdf", {type: "application/pdf"}),
      }, field)).resolves.toBe(true);

      expect(field.value).toMatch(/^pasted_images\/form-\d+\.pdf\?foundry-paste-eater=\d+$/);
    });

    it("uses the original direct PDF URL for focused PDF fields when download is blocked", async () => {
      const root = document.createElement("form");
      root.id = "JournalEntryPageConfig-3";
      root.className = "application sheet journal-page";
      root.innerHTML = '<input type="text" name="src" value="">';
      document.body.append(root);
      const page = env.createPage({type: "pdf"});
      page.documentName = "JournalEntryPage";
      globalThis.foundry.applications.instances = new Map([[root.id, {
        id: root.id,
        object: page,
      }]]);
      const field = root.querySelector("input");
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(api._clipboardHandlePdfFieldInput({
        url: "https://example.com/form.pdf",
      }, field)).resolves.toBe(true);

      expect(field.value).toBe("https://example.com/form.pdf");
    });

    it("returns false for PDF field handling when disabled or unsupported", async () => {
      await expect(api._clipboardHandlePdfFieldInput({
        blob: new File(["pdf"], "field.pdf", {type: "application/pdf"}),
      }, document.createElement("input"))).resolves.toBe(false);

      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "disabled");
      await expect(api._clipboardHandlePdfFieldInput({
        blob: new File(["pdf"], "field.pdf", {type: "application/pdf"}),
      }, {
        field: document.createElement("input"),
      })).resolves.toBe(false);
    });

    it("annotates focused PDF field handling failures", async () => {
      const root = document.createElement("form");
      root.id = "JournalEntryPageConfig-4";
      root.className = "application sheet journal-page";
      root.innerHTML = '<input type="text" name="src" value="">';
      document.body.append(root);
      const page = env.createPage({type: "pdf"});
      page.documentName = "JournalEntryPage";
      globalThis.foundry.applications.instances = new Map([[root.id, {
        id: root.id,
        object: page,
      }]]);
      const field = root.querySelector("input");
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "text/plain",
        },
        blob: async () => new Blob(["x"], {type: "text/plain"}),
      });

      await expect(api._clipboardHandlePdfFieldInput({
        url: "https://example.com/not-a-pdf.txt",
      }, field)).rejects.toMatchObject({
        clipboardContentSummary: "a PDF",
      });
    });
  });

  describe("clipboard-read orchestrators", () => {
    it("warns when no clipboard media exists", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([]);
      await expect(api._clipboardReadAndPasteImage({notifyNoImage: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith("Foundry Paste Eater: No clipboard media or PDF was available.");
    });

    it("warns when clipboard content has no supported media", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([{types: ["text/plain"], getType: async () => ({text: async () => "plain"})}]);
      await expect(api._clipboardReadAndPasteImage({notifyNoImage: true})).resolves.toBe(false);
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Foundry Paste Eater: No supported media, PDF, or direct URL was found in the clipboard."
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
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith("Foundry Paste Eater: No clipboard data was available.");
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
        "Foundry Paste Eater: No supported media, PDF, or text was found in the clipboard."
      );
    });
  });
});
