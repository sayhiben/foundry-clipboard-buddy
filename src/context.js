const {_clipboardDescribeReplacementTarget, _clipboardLog} = require("./diagnostics");
const {
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardScaleTokenDimensions,
} = require("./media");
const {_clipboardGetHiddenMode} = require("./state");
const {
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
} = require("./constants");
const {
  _clipboardCanUseCanvasMedia,
  _clipboardCanCreateTokens,
  _clipboardCanCreateTiles,
  _clipboardCanReplaceTokens,
  _clipboardCanReplaceTiles,
  _clipboardGetDefaultEmptyCanvasTarget,
  _clipboardShouldCreateBackingActors,
} = require("./settings");

function _clipboardHasCopiedObjects() {
  const layer = canvas?.activeLayer;
  return Boolean(layer?.clipboard?.objects?.length);
}

function _clipboardGetMousePosition() {
  if (!canvas?.mousePosition) return null;
  return {
    x: canvas.mousePosition.x,
    y: canvas.mousePosition.y,
  };
}

function _clipboardGetCanvasCenter() {
  return {
    x: canvas.dimensions.width / 2,
    y: canvas.dimensions.height / 2,
  };
}

function _clipboardGetTokenPosition(mousePos) {
  return canvas?.grid?.getTopLeftPoint?.(mousePos) || mousePos;
}

function _clipboardCanUserModifyDocument(document, action = "update") {
  if (!document) return false;
  if (game.user?.isGM) return true;

  if (typeof document.canUserModify === "function") {
    return Boolean(document.canUserModify(game.user, action));
  }

  if (typeof document.testUserPermission === "function") {
    return Boolean(document.testUserPermission(game.user, "OWNER"));
  }

  if (typeof document.isOwner === "boolean") {
    return document.isOwner;
  }

  return false;
}

function _clipboardGetControlledPlaceables(layer) {
  const controlledObjects = layer?.controlledObjects;
  if (controlledObjects?.size && typeof controlledObjects.values === "function") {
    return Array.from(controlledObjects.values()).filter(Boolean);
  }

  const controlled = layer?.controlled;
  if (Array.isArray(controlled)) return controlled.filter(Boolean);
  if (controlled instanceof Map) return Array.from(controlled.values()).filter(Boolean);
  if (controlled instanceof Set) return Array.from(controlled.values()).filter(Boolean);
  if (controlled && typeof controlled.values === "function") {
    return Array.from(controlled.values()).filter(Boolean);
  }
  if (controlled && typeof controlled[Symbol.iterator] === "function") {
    return Array.from(controlled).filter(Boolean);
  }

  return [];
}

function _clipboardCanReplaceDocument(documentName, document) {
  if (documentName === "Token") {
    if (!_clipboardCanReplaceTokens()) return false;
    if (game.user?.isGM) return true;

    return _clipboardCanUserModifyDocument(document, "update") ||
      _clipboardCanUserModifyDocument(document?.actor, "update");
  }

  if (documentName === "Tile") {
    return _clipboardCanReplaceTiles() &&
      _clipboardCanUserModifyDocument(document, "update");
  }

  if (documentName === "Note") {
    return _clipboardCanUseCanvasMedia() &&
      _clipboardCanUserModifyDocument(document, "update");
  }

  return false;
}

function _clipboardCanCreateDocument(documentName) {
  if (documentName === "Token") return _clipboardCanCreateTokens();
  return _clipboardCanCreateTiles();
}

function _clipboardGetPastedDocumentName(path) {
  const rawName = String(path || "").split("/").pop() || "";
  let decodedName = rawName;

  try {
    decodedName = decodeURIComponent(rawName);
  } catch (error) {
    decodedName = rawName;
  }

  const withoutQuery = decodedName.split(/[?#]/, 1)[0] || decodedName;
  const trimmedName = withoutQuery.replace(/\.[^.]+$/, "").trim();
  const normalizedName = trimmedName.replace(/-\d{10,}$/, "").trim();
  return normalizedName || trimmedName || "Pasted Media";
}

function _clipboardGetAvailableActorTypes() {
  const candidates = [
    game?.system?.documentTypes?.Actor,
    game?.documentTypes?.Actor,
    _clipboardGetActorDocumentClass()?.TYPES,
  ];
  const baseDocumentType = CONST?.BASE_DOCUMENT_TYPE;

  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || !candidate.length) continue;
    return candidate.filter(type => type && type !== baseDocumentType);
  }

  return [];
}

function _clipboardGetActorDocumentClass() {
  return foundry?.documents?.Actor || globalThis.Actor || null;
}

function _clipboardGetDefaultActorType() {
  const defaultType = CONFIG?.Actor?.defaultType || null;
  const availableTypes = _clipboardGetAvailableActorTypes();

  if (defaultType && (!availableTypes.length || availableTypes.includes(defaultType))) {
    return defaultType;
  }

  return availableTypes[0] || defaultType || null;
}

function _clipboardGetPastedTokenActorImage(path, mediaKind) {
  if (mediaKind !== "video") return path;

  return _clipboardGetActorDocumentClass()?.DEFAULT_ICON
    || CONST?.DEFAULT_TOKEN
    || "icons/svg/mystery-man.svg";
}

async function _clipboardCreatePastedTokenActor({path, mediaKind, width, height}) {
  const ActorDocument = _clipboardGetActorDocumentClass();
  if (!ActorDocument?.create) {
    throw new Error("Actor creation is unavailable for pasted tokens.");
  }

  const name = _clipboardGetPastedDocumentName(path);
  const actorType = _clipboardGetDefaultActorType();
  const actorImage = _clipboardGetPastedTokenActorImage(path, mediaKind);
  const actorData = {
    name,
    img: actorImage,
    prototypeToken: {
      name,
      texture: {
        src: path,
      },
      width,
      height,
    },
  };

  if (actorType) actorData.type = actorType;

  _clipboardLog("debug", "Creating backing actor for pasted token", {
    actorType,
    actorImage,
    mediaKind,
    name,
    path,
    width,
    height,
  });

  const actor = await ActorDocument.create(actorData);
  if (!actor?.id) {
    throw new Error("Failed to create a backing Actor for the pasted token.");
  }

  _clipboardLog("info", "Created backing actor for pasted token", {
    actorId: actor.id,
    actorType,
    actorImage,
    mediaKind,
    name,
    path,
    width,
    height,
  });

  return actor;
}

const CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES = {
  Token: {
    documentName: "Token",
    getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.tokens).map(token => token.document),
    getLayer: () => canvas?.tokens,
    createData: async ({path, imgWidth, imgHeight, mousePos, mediaKind}) => {
      const snappedPosition = _clipboardGetTokenPosition(mousePos);
      const dimensions = _clipboardScaleTokenDimensions(imgWidth, imgHeight);
      const createBackingActors = _clipboardShouldCreateBackingActors();
      let actor = null;
      if (createBackingActors) {
        actor = await _clipboardCreatePastedTokenActor({
          path,
          mediaKind,
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      const tokenData = {
        name: actor?.name || _clipboardGetPastedDocumentName(path),
        texture: {
          src: path,
        },
        width: dimensions.width,
        height: dimensions.height,
        x: snappedPosition.x,
        y: snappedPosition.y,
        hidden: _clipboardGetHiddenMode(),
        locked: false,
      };
      if (actor?.id) {
        tokenData.actorId = actor.id;
        tokenData.actorLink = false;
      }

      return [tokenData];
    },
  },
  Tile: {
    documentName: "Tile",
    getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.tiles).map(tile => tile.document),
    getLayer: () => canvas?.tiles,
    createData: ({path, imgWidth, imgHeight, mousePos, mediaKind}) => {
      const dimensions = _clipboardScaleTileDimensions(imgWidth, imgHeight, canvas.dimensions);

      const createData = {
        texture: {
          src: path,
        },
        width: dimensions.width,
        height: dimensions.height,
        x: mousePos.x,
        y: mousePos.y,
        sort: 0,
        rotation: 0,
        hidden: _clipboardGetHiddenMode(),
        locked: false,
      };

      const video = _clipboardGetTileVideoData(mediaKind);
      if (video) createData.video = video;

      return [createData];
    },
  },
  Note: {
    documentName: "Note",
    getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.notes).map(note => note.document),
    getLayer: () => canvas?.notes,
  },
};

const CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
  Token: ["Token", "Tile", "Note"],
  Tile: ["Tile", "Token", "Note"],
  Note: ["Note", "Token", "Tile"],
};

function _clipboardGetActiveDocumentName() {
  if (canvas?.activeLayer === canvas?.tokens) return "Token";
  if (canvas?.activeLayer === canvas?.notes) return "Note";
  return "Tile";
}

function _clipboardGetCreateDocumentName(activeDocumentName = _clipboardGetActiveDocumentName()) {
  switch (_clipboardGetDefaultEmptyCanvasTarget()) {
    case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN:
      return "Token";
    case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE:
      return "Tile";
    case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER:
    default:
      return activeDocumentName === "Note" ? "Tile" : activeDocumentName;
  }
}

function _clipboardGetPlaceableStrategy(documentName = _clipboardGetCreateDocumentName()) {
  return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
}

function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
  for (const documentName of CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName]) {
    const strategy = _clipboardGetPlaceableStrategy(documentName);
    const layer = strategy.getLayer?.();
    const controlledPlaceables = _clipboardGetControlledPlaceables(layer);
    const documents = controlledPlaceables.map(placeable => placeable.document).filter(Boolean);
    _clipboardLog("debug", "Evaluating controlled placeables for replacement", {
      activeDocumentName,
      candidateDocumentName: strategy.documentName,
      layerName: layer?.options?.name || layer?.name || null,
      controlledType: layer?.controlled?.constructor?.name || typeof layer?.controlled,
      controlledCount: controlledPlaceables.length,
      controlledIds: controlledPlaceables.map(placeable => placeable.document?.id || placeable.id || null),
      controlledObjectsSize: layer?.controlledObjects?.size ?? null,
    });
    if (!documents.length) continue;

    const eligibleDocuments = documents.filter(document => _clipboardCanReplaceDocument(strategy.documentName, document));
    _clipboardLog("debug", "Resolved eligible replacement documents", {
      activeDocumentName,
      candidateDocumentName: strategy.documentName,
      requestedCount: documents.length,
      eligibleIds: eligibleDocuments.map(document => document.id),
      blocked: eligibleDocuments.length < 1,
    });

    return {
      documentName: strategy.documentName,
      documents: eligibleDocuments,
      requestedCount: documents.length,
      blocked: eligibleDocuments.length < 1,
    };
  }

  return null;
}

function _clipboardResolvePasteContext({fallbackToCenter = false, requireCanvasFocus = true} = {}) {
  const activeDocumentName = _clipboardGetActiveDocumentName();
  const createDocumentName = _clipboardGetCreateDocumentName(activeDocumentName);
  const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);

  return {
    mousePos,
    activeDocumentName,
    createDocumentName,
    createStrategy: _clipboardCanCreateDocument(createDocumentName) ? _clipboardGetPlaceableStrategy(createDocumentName) : null,
    replacementTarget: _clipboardGetReplacementTarget(activeDocumentName),
    requireCanvasFocus,
  };
}

function _clipboardHasCanvasFocus() {
  const gameElement = document.querySelector(".game");
  return !gameElement || document.activeElement === gameElement;
}

function _clipboardIsMouseWithinCanvas(mousePos) {
  return Boolean(
    mousePos &&
    mousePos.x >= 0 &&
    mousePos.y >= 0 &&
    mousePos.x <= canvas.dimensions.width &&
    mousePos.y <= canvas.dimensions.height
  );
}

function _clipboardCanPasteToContext(context) {
  if (context.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
  if (context.replacementTarget?.documents?.length) return true;
  if (context.replacementTarget?.blocked) return false;
  if (Object.hasOwn(context, "createStrategy") && !context.createStrategy) return false;
  return _clipboardIsMouseWithinCanvas(context.mousePos);
}

function _clipboardPrepareCreateLayer(context) {
  if (!context.replacementTarget) {
    context.createStrategy.getLayer()?.activate?.();
  }
}

async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind) {
  if (!replacementTarget) return false;

  const updates = replacementTarget.documents.map(document => {
    const update = {
      _id: document.id,
      "texture.src": path,
    };

    if (replacementTarget.documentName === "Tile" && mediaKind === "video") {
      update.video = _clipboardGetTileVideoData(mediaKind);
    }

    return update;
  });
  _clipboardLog("info", "Replacing controlled media", {
    replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
    mediaKind,
    path,
  });
  await canvas.scene.updateEmbeddedDocuments(replacementTarget.documentName, updates);
  return true;
}

module.exports = {
  CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES,
  _clipboardHasCopiedObjects,
  _clipboardGetMousePosition,
  _clipboardGetCanvasCenter,
  _clipboardGetTokenPosition,
  _clipboardCanUserModifyDocument,
  _clipboardGetControlledPlaceables,
  _clipboardCanReplaceDocument,
  _clipboardCanCreateDocument,
  _clipboardGetPastedDocumentName,
  _clipboardGetAvailableActorTypes,
  _clipboardGetActorDocumentClass,
  _clipboardGetDefaultActorType,
  _clipboardGetPastedTokenActorImage,
  _clipboardCreatePastedTokenActor,
  _clipboardGetActiveDocumentName,
  _clipboardGetCreateDocumentName,
  _clipboardGetPlaceableStrategy,
  _clipboardGetReplacementTarget,
  _clipboardResolvePasteContext,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
  _clipboardReplaceControlledMedia,
};
