import {beforeEach, describe, expect, it, vi} from "vitest";

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

    it("returns the note strategy for the notes layer", () => {
      globalThis.canvas.activeLayer = globalThis.canvas.notes;
      expect(api._clipboardGetActiveDocumentName()).toBe("Note");
      expect(api._clipboardGetPlaceableStrategy("Note").documentName).toBe("Note");
      expect(api._clipboardGetPlaceableStrategy("Note").getLayer()).toBe(globalThis.canvas.notes);
      expect(api._clipboardGetCreateDocumentName("Note")).toBe("Tile");
    });

    it("exposes controlled documents for token, tile, and note strategies", () => {
      const token = env.createControlledPlaceable("Token", {id: "token-a"});
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      const note = env.createControlledPlaceable("Note", {id: "note-a"});
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.tiles.controlled = [tile];
      globalThis.canvas.notes.controlled = [note];

      expect(api._clipboardGetPlaceableStrategy("Token").getControlledDocuments()).toEqual([token.document]);
      expect(api._clipboardGetPlaceableStrategy("Tile").getControlledDocuments()).toEqual([tile.document]);
      expect(api._clipboardGetPlaceableStrategy("Note").getControlledDocuments()).toEqual([note.document]);
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

    it("uses the explicit tile target when configured", () => {
      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "tile");
      expect(api._clipboardGetCreateDocumentName("Token")).toBe("Tile");
    });

    it("strips generated upload suffixes from pasted document names", () => {
      expect(api._clipboardGetPastedDocumentName("folder/test-token-1774745045587.png?foundry-paste-eater=1774745045596")).toBe("test-token");
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
      env.settingsValues.set("foundry-paste-eater.create-backing-actors", false);

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

    it("checks whether token and tile creation are currently allowed", () => {
      expect(api._clipboardCanCreateDocument("Token")).toBe(true);
      expect(api._clipboardCanCreateDocument("Tile")).toBe(true);

      env.settingsValues.set("foundry-paste-eater.enable-token-creation", false);
      env.settingsValues.set("foundry-paste-eater.enable-tile-creation", false);

      expect(api._clipboardCanCreateDocument("Token")).toBe(false);
      expect(api._clipboardCanCreateDocument("Tile")).toBe(false);
      expect(api._clipboardCanCreateDocument("Unknown")).toBe(false);
    });
  });

  describe("replacement target and paste context", () => {
    it.each([
      {activeDocumentName: "Token", expected: ["Token", "Tile", "Note"]},
      {activeDocumentName: "Tile", expected: ["Tile", "Token", "Note"]},
      {activeDocumentName: "Note", expected: ["Note", "Token", "Tile"]},
      {activeDocumentName: "Weird", expected: ["Tile", "Token", "Note"]},
    ])("returns the expected replacement order for $activeDocumentName", ({activeDocumentName, expected}) => {
      expect(api._clipboardGetReplacementOrder(activeDocumentName)).toEqual(expected);
    });

    it.each([
      {
        name: "prefers token replacement on the tokens layer",
        activeDocumentName: "Token",
        replacementCandidates: () => ({
          Token: {documents: [env.createPlaceableDocument("Token", {id: "token-priority"})], requestedCount: 1},
          Tile: {documents: [env.createPlaceableDocument("Tile", {id: "tile-fallback"})], requestedCount: 1},
        }),
        expected: {
          documentName: "Token",
          documents: [expect.objectContaining({id: "token-priority"})],
          requestedCount: 1,
          blocked: false,
        },
      },
      {
        name: "falls back to the next candidate type when the preferred type is not selected",
        activeDocumentName: "Token",
        replacementCandidates: () => ({
          Token: {documents: [], requestedCount: 0},
          Tile: {documents: [env.createPlaceableDocument("Tile", {id: "tile-selected"})], requestedCount: 1},
        }),
        expected: {
          documentName: "Tile",
          documents: [expect.objectContaining({id: "tile-selected"})],
          requestedCount: 1,
          blocked: false,
        },
      },
      {
        name: "returns a blocked replacement target when the first matching selection exists but is not eligible",
        activeDocumentName: "Token",
        replacementCandidates: () => ({
          Token: {documents: [], requestedCount: 2},
          Tile: {documents: [env.createPlaceableDocument("Tile", {id: "tile-should-not-win"})], requestedCount: 1},
        }),
        expected: {
          documentName: "Token",
          documents: [],
          requestedCount: 2,
          blocked: true,
        },
      },
      {
        name: "returns null when nothing is selected anywhere",
        activeDocumentName: "Tile",
        replacementCandidates: () => ({
          Tile: {documents: [], requestedCount: 0},
          Token: {documents: [], requestedCount: 0},
          Note: {documents: [], requestedCount: 0},
        }),
        expected: null,
      },
    ])("$name", ({activeDocumentName, replacementCandidates, expected}) => {
      expect(api._clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates())).toEqual(expected);
    });

    it.each([
      {
        name: "uses token creation on the tokens layer by default",
        input: {
          activeDocumentName: "Token",
          emptyCanvasTarget: "active-layer",
          replacementCandidates: () => ({}),
          canCreateTokens: true,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Token",
          replacementTarget: null,
          replacementBlocked: false,
          canCreateDocument: true,
          shouldCreate: true,
        },
      },
      {
        name: "uses tile creation on the notes layer when following the active layer",
        input: {
          activeDocumentName: "Note",
          emptyCanvasTarget: "active-layer",
          replacementCandidates: () => ({}),
          canCreateTokens: true,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Tile",
          replacementTarget: null,
          replacementBlocked: false,
          canCreateDocument: true,
          shouldCreate: true,
        },
      },
      {
        name: "honors the explicit token empty-canvas target",
        input: {
          activeDocumentName: "Tile",
          emptyCanvasTarget: "token",
          replacementCandidates: () => ({}),
          canCreateTokens: true,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Token",
          replacementTarget: null,
          replacementBlocked: false,
          canCreateDocument: true,
          shouldCreate: true,
        },
      },
      {
        name: "disables creation when the chosen create type is not allowed",
        input: {
          activeDocumentName: "Token",
          emptyCanvasTarget: "active-layer",
          replacementCandidates: () => ({}),
          canCreateTokens: false,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Token",
          replacementTarget: null,
          replacementBlocked: false,
          canCreateDocument: false,
          shouldCreate: false,
        },
      },
      {
        name: "does not allow create fallback when a blocked replacement target exists",
        input: {
          activeDocumentName: "Token",
          emptyCanvasTarget: "active-layer",
          replacementCandidates: () => ({
            Token: {documents: [], requestedCount: 1},
          }),
          canCreateTokens: true,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Token",
          replacementTarget: {
            documentName: "Token",
            documents: [],
            requestedCount: 1,
            blocked: true,
          },
          replacementBlocked: true,
          canCreateDocument: true,
          shouldCreate: false,
        },
      },
      {
        name: "does not create when a successful replacement target exists",
        input: {
          activeDocumentName: "Tile",
          emptyCanvasTarget: "active-layer",
          replacementCandidates: () => ({
            Tile: {documents: [env.createPlaceableDocument("Tile", {id: "tile-replace"})], requestedCount: 1},
          }),
          canCreateTokens: true,
          canCreateTiles: true,
        },
        expected: {
          createDocumentName: "Tile",
          replacementTarget: {
            documentName: "Tile",
            documents: [expect.objectContaining({id: "tile-replace"})],
            requestedCount: 1,
            blocked: false,
          },
          replacementBlocked: false,
          canCreateDocument: true,
          shouldCreate: false,
        },
      },
    ])("resolves the canvas media plan: $name", ({input, expected}) => {
      expect(api._clipboardResolveCanvasMediaPlan({
        ...input,
        replacementCandidates: input.replacementCandidates(),
      })).toEqual({
        activeDocumentName: input.activeDocumentName,
        ...expected,
      });
    });

    it("reads controlled placeables from controlledObjects maps", () => {
      const note = env.createControlledPlaceable("Note", {id: "note-a"});
      globalThis.canvas.notes.controlled = [];
      globalThis.canvas.notes.controlledObjects.set(note.document.id, note);

      expect(api._clipboardGetControlledPlaceables(globalThis.canvas.notes)).toEqual([note]);
      expect(api._clipboardGetReplacementTarget("Note")).toMatchObject({
        documentName: "Note",
        documents: [note.document],
        requestedCount: 1,
        blocked: false,
      });
    });

    it("can read controlled placeables from iterable sets", () => {
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      globalThis.canvas.tiles.controlled = new Set([tile]);

      expect(api._clipboardGetControlledPlaceables(globalThis.canvas.tiles)).toEqual([tile]);
    });

    it("can read controlled placeables from maps and generic iterables", () => {
      const token = env.createControlledPlaceable("Token", {id: "token-a"});
      const tile = env.createControlledPlaceable("Tile", {id: "tile-a"});
      const note = env.createControlledPlaceable("Note", {id: "note-a"});
      globalThis.canvas.tokens.controlled = new Map([[token.document.id, token]]);
      globalThis.canvas.tiles.controlled = {
        values: () => [tile][Symbol.iterator](),
      };
      globalThis.canvas.notes.controlled = {
        [Symbol.iterator]: function* () {
          yield note;
        },
      };

      expect(api._clipboardGetControlledPlaceables(globalThis.canvas.tokens)).toEqual([token]);
      expect(api._clipboardGetControlledPlaceables(globalThis.canvas.tiles)).toEqual([tile]);
      expect(api._clipboardGetControlledPlaceables(globalThis.canvas.notes)).toEqual([note]);
    });

    it("returns an empty controlled placeable list for unsupported layer shapes", () => {
      expect(api._clipboardGetControlledPlaceables({controlled: {foo: "bar"}})).toEqual([]);
      expect(api._clipboardGetControlledPlaceables({controlled: null})).toEqual([]);
    });

    it("falls back to testUserPermission and isOwner when canUserModify is unavailable", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const viaPermission = {
        testUserPermission: vi.fn(() => true),
      };
      const viaOwner = {
        isOwner: true,
      };

      expect(api._clipboardCanUserModifyDocument(viaPermission, "update")).toBe(true);
      expect(viaPermission.testUserPermission).toHaveBeenCalledWith(globalThis.game.user, "OWNER");
      expect(api._clipboardCanUserModifyDocument(viaOwner, "update")).toBe(true);
    });

    it("returns false when no document ownership helpers are available", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      expect(api._clipboardCanUserModifyDocument({}, "update")).toBe(false);
      expect(api._clipboardCanUserModifyDocument(null, "update")).toBe(false);
    });

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

    it("prefers controlled notes when the notes layer is active", () => {
      const note = env.createControlledPlaceable("Note", {id: "note-a"});
      globalThis.canvas.notes.controlled = [note];
      globalThis.canvas.activeLayer = globalThis.canvas.notes;

      expect(api._clipboardGetReplacementTarget("Note")).toMatchObject({
        documentName: "Note",
        documents: [note.document],
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
      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "token");
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

    it("treats linked token actor-art replacement as eligible only for updatable base actors", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-linked",
        img: "portrait.png",
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-linked",
        actor,
        actorId: actor.id,
        actorLink: true,
        canUserModify: () => true,
      });

      expect(api._clipboardGetTokenActorArtEligibility({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 1,
      })).toMatchObject({
        eligible: true,
        actors: [actor],
      });
    });

    it("rejects actor-art replacement for mixed or unlinked token selections", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      const actor = env.createActor({
        id: "actor-unlinked",
        img: "portrait.png",
      });
      actor.canUserModify = () => true;
      const token = env.createControlledPlaceable("Token", {
        id: "token-unlinked",
        actor,
        actorId: actor.id,
        actorLink: false,
        canUserModify: () => true,
      });

      expect(api._clipboardGetTokenActorArtEligibility({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 1,
      })).toMatchObject({
        eligible: false,
        reason: expect.stringContaining("linked to a base Actor"),
      });

      expect(api._clipboardGetTokenActorArtEligibility({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 2,
      })).toMatchObject({
        eligible: false,
        reason: expect.stringContaining("every selected token to be editable"),
      });
    });

    it("treats video media as scene-only for actor-art eligibility", () => {
      const actor = env.createActor({id: "actor-video"});
      const token = env.createControlledPlaceable("Token", {
        id: "token-video",
        actor,
        actorId: actor.id,
        actorLink: true,
      });

      expect(api._clipboardGetTokenActorArtEligibility({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 1,
      }, {
        mediaKind: "video",
      })).toMatchObject({
        eligible: false,
        documents: [token.document],
        reason: expect.stringContaining("only supports pasted images"),
      });
    });

    it("rejects actor-art eligibility when token replacement is not the active target", () => {
      expect(api._clipboardGetTokenActorArtEligibility(null)).toMatchObject({
        eligible: false,
        documents: [],
        reason: expect.stringContaining("only applies when selected tokens"),
      });
    });

    it("allows replacing selected notes when the user can update them", () => {
      const note = env.createControlledPlaceable("Note", {
        id: "note-editable",
        isOwner: true,
      });
      globalThis.canvas.notes.controlled = [note];
      globalThis.canvas.activeLayer = globalThis.canvas.notes;

      expect(api._clipboardGetReplacementTarget("Note")).toMatchObject({
        documentName: "Note",
        documents: [note.document],
        blocked: false,
      });
    });

    it("blocks note replacement when the user cannot use canvas media", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = 1;
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "TRUSTED");
      const note = env.createControlledPlaceable("Note", {
        id: "note-blocked",
        isOwner: true,
      });
      globalThis.canvas.notes.controlled = [note];
      globalThis.canvas.activeLayer = globalThis.canvas.notes;

      expect(api._clipboardGetReplacementTarget("Note")).toMatchObject({
        documentName: "Note",
        documents: [],
        requestedCount: 1,
        blocked: true,
      });
    });

    it("checks direct note replacement eligibility and rejects unknown document types", () => {
      const note = {
        isOwner: true,
      };

      expect(api._clipboardCanReplaceDocument("Note", note)).toBe(true);
      expect(api._clipboardCanReplaceDocument("Unknown", note)).toBe(false);
    });

    it("filters base actor document types from the available actor type list", () => {
      globalThis.game.system.documentTypes.Actor = ["base", "character", "npc"];
      globalThis.CONST.BASE_DOCUMENT_TYPE = "base";
      expect(api._clipboardGetAvailableActorTypes()).toEqual(["character", "npc"]);
    });

    it("falls back to game documentTypes when system document types are unavailable", () => {
      globalThis.game.system.documentTypes.Actor = null;
      globalThis.game.documentTypes = {
        Actor: ["vehicle", "npc"],
      };

      expect(api._clipboardGetAvailableActorTypes()).toEqual(["vehicle", "npc"]);
    });

    it("falls back to the actor document class TYPES list when needed", () => {
      globalThis.game.system.documentTypes.Actor = null;
      globalThis.game.documentTypes = {
        Actor: null,
      };
      globalThis.foundry.documents.Actor.TYPES = ["group", "npc", CONST.BASE_DOCUMENT_TYPE];

      expect(api._clipboardGetAvailableActorTypes()).toEqual(["group", "npc"]);
    });

    it("returns an empty actor type list when every fallback source is unavailable", () => {
      globalThis.game.system.documentTypes.Actor = null;
      globalThis.game.documentTypes = {
        Actor: null,
      };
      globalThis.foundry.documents.Actor.TYPES = null;

      expect(api._clipboardGetAvailableActorTypes()).toEqual([]);
    });

    it("falls back to the Foundry default token icon when actor default icons are unavailable", () => {
      const originalDefaultIcon = globalThis.foundry.documents.Actor.DEFAULT_ICON;
      globalThis.foundry.documents.Actor.DEFAULT_ICON = "";
      globalThis.CONST.DEFAULT_TOKEN = "icons/svg/default-token.svg";
      try {
        expect(api._clipboardGetPastedTokenActorImage("movie.webm", "video")).toBe("icons/svg/default-token.svg");
      } finally {
        globalThis.foundry.documents.Actor.DEFAULT_ICON = originalDefaultIcon;
      }
    });

    it("allows gms to replace selected tokens regardless of ownership", () => {
      globalThis.game.user.isGM = true;
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
        documents: [token.document],
        requestedCount: 1,
        blocked: false,
      });
    });

    it("allows players to replace selected tokens they can update through actor ownership", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = 1;
      const token = env.createControlledPlaceable("Token", {
        id: "token-a",
        isOwner: false,
        canUserModify: () => false,
        actor: {isOwner: true, canUserModify: () => true},
      });
      globalThis.canvas.tokens.controlled = [token];
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      expect(api._clipboardGetReplacementTarget("Token")).toMatchObject({
        documentName: "Token",
        documents: [token.document],
        requestedCount: 1,
        blocked: false,
      });
    });

    it("blocks selected token replacement entirely when the feature toggle is disabled", () => {
      env.settingsValues.set("foundry-paste-eater.enable-token-replacement", false);
      const token = env.createControlledPlaceable("Token", {id: "token-a"});
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

  describe("actor-art replacement", () => {
    it("falls back to the active canvas scene when the world scene list is unavailable", () => {
      globalThis.game.scenes.contents = null;

      expect(api._clipboardGetAllScenesForLinkedTokenUpdates()).toEqual([globalThis.canvas.scene]);
    });

    it("returns an empty scene list when no world scenes or active scene are available", () => {
      globalThis.game.scenes.contents = [];
      globalThis.canvas.scene = null;

      expect(api._clipboardGetAllScenesForLinkedTokenUpdates()).toEqual([]);
    });

    it("updates linked token documents across scenes for the same actor", async () => {
      const actor = env.createActor({
        id: "actor-shared",
        img: "before.png",
      });
      actor.canUserModify = () => true;
      const selectedToken = env.createPlaceableDocument("Token", {
        id: "token-selected",
        actor,
        actorId: actor.id,
        actorLink: true,
      });
      const linkedToken = env.createPlaceableDocument("Token", {
        id: "token-linked",
        actor,
        actorId: actor.id,
        actorLink: true,
      });
      const otherToken = env.createPlaceableDocument("Token", {
        id: "token-other",
        actor,
        actorId: "other-actor",
        actorLink: true,
      });
      const secondaryScene = {
        tokens: {
          contents: [linkedToken, otherToken],
        },
        updateEmbeddedDocuments: vi.fn(async (_type, updates) => updates),
      };
      globalThis.game.scenes.contents = [globalThis.canvas.scene, secondaryScene];

      await expect(api._clipboardReplaceControlledTokenActorArt("updated.png", {
        documentName: "Token",
        documents: [selectedToken],
        requestedCount: 1,
      })).resolves.toBe(true);

      expect(actor.update).toHaveBeenCalledWith({
        img: "updated.png",
        "prototypeToken.texture.src": "updated.png",
      });
      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({_id: "token-selected", "texture.src": "updated.png"}),
      ]);
      expect(secondaryScene.updateEmbeddedDocuments).toHaveBeenCalledWith("Token", [
        expect.objectContaining({_id: "token-linked", "texture.src": "updated.png"}),
      ]);
    });
  });
});
