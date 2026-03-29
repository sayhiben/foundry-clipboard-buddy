import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("canvas context helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("runtime state", () => {
    it("returns the default runtime state", () => {
      expect(api._clipboardGetRuntimeState()).toEqual({locked: false, hiddenMode: false});
    });

    it("updates the runtime state", () => {
      api._clipboardSetRuntimeState({hiddenMode: true, locked: true});
      expect(api._clipboardGetRuntimeState()).toEqual({locked: true, hiddenMode: true});
    });
  });

  describe("placeable strategies", () => {
    it("returns the token strategy for the tokens layer", () => {
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;
      expect(api._clipboardGetActiveDocumentName()).toBe("Token");
      expect(api._clipboardGetPlaceableStrategy("Token").documentName).toBe("Token");
      expect(api._clipboardGetPlaceableStrategy("Token").getLayer()).toBe(globalThis.canvas.tokens);
    });

    it("falls back to the tile strategy for unknown document names", () => {
      expect(api._clipboardGetPlaceableStrategy("Unknown").documentName).toBe("Tile");
    });

    it("builds actor-backed token create data", async () => {
      api._clipboardSetRuntimeState({hiddenMode: true});
      await expect(api._clipboardGetPlaceableStrategy("Token").createData({
        path: "image.png",
        imgWidth: 400,
        imgHeight: 200,
        mousePos: {x: 155, y: 245},
        mediaKind: "image",
      })).resolves.toEqual([{
        actorId: "actor-1",
        actorLink: false,
        name: "image",
        texture: {src: "image.png"},
        width: 2,
        height: 1,
        x: 100,
        y: 200,
        hidden: true,
        locked: false,
      }]);
      expect(globalThis.foundry.documents.Actor.create).toHaveBeenCalledWith({
        name: "image",
        type: "character",
        img: "image.png",
        prototypeToken: {
          name: "image",
          texture: {src: "image.png"},
          width: 2,
          height: 1,
        },
      });
    });

    it("uses the default actor icon for video-backed token actors", async () => {
      await expect(api._clipboardCreatePastedTokenActor({
        path: "video.webm",
        mediaKind: "video",
        width: 1,
        height: 1,
      })).resolves.toMatchObject({
        id: "actor-1",
        img: "icons/svg/mystery-man.svg",
        prototypeToken: {
          texture: {src: "video.webm"},
          width: 1,
          height: 1,
        },
      });
      expect(globalThis.foundry.documents.Actor.create).toHaveBeenCalledWith({
        name: "video",
        type: "character",
        img: "icons/svg/mystery-man.svg",
        prototypeToken: {
          name: "video",
          texture: {src: "video.webm"},
          width: 1,
          height: 1,
        },
      });
    });

    it("builds tile create data", () => {
      api._clipboardSetRuntimeState({hiddenMode: true});
      expect(api._clipboardGetPlaceableStrategy("Tile").createData({
        path: "video.webm",
        imgWidth: 1200,
        imgHeight: 600,
        mousePos: {x: 10, y: 20},
        mediaKind: "video",
      })).toEqual([{
        texture: {src: "video.webm"},
        width: 300,
        height: 150,
        x: 10,
        y: 20,
        sort: 0,
        rotation: 0,
        hidden: true,
        locked: false,
        video: {autoplay: true, loop: true, volume: 0},
      }]);
    });

    it("prefers the configured default actor type when it is allowed", () => {
      globalThis.CONFIG.Actor.defaultType = "npc";
      expect(api._clipboardGetDefaultActorType()).toBe("npc");
    });

    it("falls back to the first available actor type when the configured default is unavailable", () => {
      globalThis.CONFIG.Actor.defaultType = "vehicle";
      expect(api._clipboardGetDefaultActorType()).toBe("character");
    });

    it("keeps the raw document name when url decoding fails", () => {
      expect(api._clipboardGetPastedDocumentName("%E0%A4%A.png")).toBe("%E0%A4%A");
    });

    it("strips generated upload suffixes from pasted document names", () => {
      expect(api._clipboardGetPastedDocumentName("folder/test-token-1774745045587.png?clipboard-image=1774745045596")).toBe("test-token");
    });

    it("throws when token actor creation is unavailable", async () => {
      const originalCreate = globalThis.foundry.documents.Actor.create;
      globalThis.foundry.documents.Actor.create = undefined;
      try {
        await expect(api._clipboardCreatePastedTokenActor({
          path: "image.png",
          mediaKind: "image",
          width: 1,
          height: 1,
        })).rejects.toThrow("Actor creation is unavailable");
      } finally {
        globalThis.foundry.documents.Actor.create = originalCreate;
      }
    });

    it("can create actorless pasted tokens when backing actors are disabled", async () => {
      env.settingsValues.set("clipboard-image.create-backing-actors", false);

      await expect(api._clipboardGetPlaceableStrategy("Token").createData({
        path: "image.png",
        imgWidth: 400,
        imgHeight: 200,
        mousePos: {x: 155, y: 245},
        mediaKind: "image",
      })).resolves.toEqual([{
        name: "image",
        texture: {src: "image.png"},
        width: 2,
        height: 1,
        x: 100,
        y: 200,
        hidden: false,
        locked: false,
      }]);
      expect(globalThis.foundry.documents.Actor.create).not.toHaveBeenCalled();
    });
  });

  describe("replacement target and paste context", () => {
    it("prefers controlled tokens when the tokens layer is active", () => {
      const token = env.createControlledPlaceable("Token", {id: "token-a"});
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.tiles.controlled = [tile];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      expect(api._clipboardGetReplacementTarget("Token")).toMatchObject({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 1,
        blocked: false,
      });
    });

    it("falls back to controlled tiles when no token is selected", () => {
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      globalThis.canvas.tiles.controlled = [tile];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      expect(api._clipboardGetReplacementTarget("Token")).toMatchObject({
        documentName: "Tile",
        documents: [tile.document],
        requestedCount: 1,
        blocked: false,
      });
    });

    it("resolves paste context with the active strategy and replacement target", () => {
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      globalThis.canvas.tiles.controlled = [tile];
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;
      globalThis.canvas.mousePosition = null;

      expect(api._clipboardResolvePasteContext()).toMatchObject({
        mousePos: null,
        createStrategy: api._clipboardGetPlaceableStrategy("Tile"),
        replacementTarget: {
          documentName: "Tile",
          documents: [tile.document],
        },
        requireCanvasFocus: true,
      });
    });

    it("can fall back to the canvas center", () => {
      globalThis.canvas.mousePosition = null;
      expect(api._clipboardResolvePasteContext({fallbackToCenter: true, requireCanvasFocus: false}).mousePos).toEqual({
        x: 500,
        y: 400,
      });
    });

    it("uses the configured default empty-canvas target instead of the active layer", () => {
      env.settingsValues.set("clipboard-image.default-empty-canvas-target", "token");
      globalThis.canvas.activeLayer = globalThis.canvas.tiles;

      const context = api._clipboardResolvePasteContext({requireCanvasFocus: false});
      expect(context.createDocumentName).toBe("Token");
      expect(context.createStrategy.documentName).toBe("Token");
    });

    it("blocks replacement when selected tokens are not user-editable", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = 1;
      const token = env.createControlledPlaceable("Token", {
        id: "token-a",
        isOwner: false,
        canUserModify: () => false,
        actor: {isOwner: false, canUserModify: () => false},
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      expect(api._clipboardGetReplacementTarget("Token")).toMatchObject({
        documentName: "Token",
        documents: [],
        requestedCount: 1,
        blocked: true,
      });
    });
  });

  describe("focus and paste eligibility", () => {
    it("detects when the game element has focus", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.querySelector(".game").focus();
      expect(api._clipboardHasCanvasFocus()).toBe(true);
    });

    it("detects when another element has focus", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      expect(api._clipboardHasCanvasFocus()).toBe(false);
    });

    it("checks whether a mouse position is inside the canvas", () => {
      expect(api._clipboardIsMouseWithinCanvas({x: 10, y: 10})).toBe(true);
      expect(api._clipboardIsMouseWithinCanvas({x: -1, y: 10})).toBe(false);
    });

    it("allows paste when focus and mouse position are valid", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      expect(api._clipboardCanPasteToContext({
        requireCanvasFocus: true,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      })).toBe(true);
    });

    it("allows paste when replacing selected documents even without a mouse position", () => {
      expect(api._clipboardCanPasteToContext({
        requireCanvasFocus: false,
        replacementTarget: {documentName: "Tile", documents: [env.createPlaceableDocument("Tile")]},
        mousePos: null,
      })).toBe(true);
    });

    it("rejects paste when canvas focus is required and missing", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      expect(api._clipboardCanPasteToContext({
        requireCanvasFocus: true,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      })).toBe(false);
    });
  });

  describe("_clipboardPrepareCreateLayer", () => {
    it("activates the create layer when not replacing an existing document", () => {
      api._clipboardPrepareCreateLayer({
        replacementTarget: null,
        createStrategy: api._clipboardGetPlaceableStrategy("Tile"),
      });
      expect(globalThis.canvas.tiles.activate).toHaveBeenCalled();
    });

    it("does not activate a layer when replacing selected documents", () => {
      const document = env.createPlaceableDocument("Tile");
      api._clipboardPrepareCreateLayer({
        replacementTarget: {documents: [document]},
        createStrategy: api._clipboardGetPlaceableStrategy("Token"),
      });
      expect(globalThis.canvas.tokens.activate).not.toHaveBeenCalled();
    });
  });
});
