const {_clipboardDescribeReplacementTarget, _clipboardLog} = require("../diagnostics");
const {
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardScaleTokenDimensions,
} = require("../media");
const {_clipboardGetHiddenMode} = require("../state");
const {
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
} = require("../constants");
const {
  _clipboardCanUseCanvasMedia,
  _clipboardCanCreateTokens,
  _clipboardCanCreateTiles,
  _clipboardCanReplaceTokens,
  _clipboardCanReplaceTiles,
  _clipboardGetDefaultEmptyCanvasTarget,
  _clipboardShouldCreateBackingActors,
} = require("../settings");

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

function _clipboardGetTokenActorArtEligibility(replacementTarget, {mediaKind = "image"} = {}) {
  if (!replacementTarget?.documents?.length || replacementTarget.documentName !== "Token") {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art only applies when selected tokens are being replaced.",
      actors: [],
      documents: [],
    };
  }

  if (mediaKind !== "image") {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art only supports pasted images. Video pastes stay scene-only.",
      actors: [],
      documents: replacementTarget.documents,
    };
  }

  if ((replacementTarget.requestedCount ?? replacementTarget.documents.length) > replacementTarget.documents.length) {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art requires every selected token to be editable before anything is changed.",
      actors: [],
      documents: replacementTarget.documents,
    };
  }

  const actors = [];
  const seenActorIds = new Set();
  for (const document of replacementTarget.documents) {
    const actor = document?.actor || null;
    const actorId = actor?.id || document?.actorId || null;
    if (!document?.actorLink || !actor || !_clipboardCanUserModifyDocument(actor, "update")) {
      return {
        eligible: false,
        reason: "Actor portrait + linked token art requires every selected token to be linked to a base Actor you can update.",
        actors: [],
        documents: replacementTarget.documents,
      };
    }

    if (actorId && !seenActorIds.has(actorId)) {
      seenActorIds.add(actorId);
      actors.push(actor);
    }
  }

  return {
    eligible: true,
    reason: "",
    actors,
    documents: replacementTarget.documents,
  };
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

function _clipboardGetReplacementOrder(activeDocumentName = "Tile") {
  return CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName] || CLIPBOARD_IMAGE_REPLACEMENT_ORDER.Tile;
}

function _clipboardResolveReplacementTargetFromCandidates(activeDocumentName = _clipboardGetActiveDocumentName(), replacementCandidates = {}) {
  for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
    const candidate = replacementCandidates?.[documentName] || null;
    const requestedCount = candidate?.requestedCount ?? candidate?.documents?.length ?? 0;
    if (!requestedCount) continue;

    const documents = Array.isArray(candidate?.documents)
      ? candidate.documents.filter(Boolean)
      : [];

    return {
      documentName,
      documents,
      requestedCount,
      blocked: documents.length < 1,
    };
  }

  return null;
}

function _clipboardGetActiveDocumentName() {
  if (canvas?.activeLayer === canvas?.tokens) return "Token";
  if (canvas?.activeLayer === canvas?.notes) return "Note";
  return "Tile";
}

function _clipboardGetCreateDocumentName(
  activeDocumentName = _clipboardGetActiveDocumentName(),
  emptyCanvasTarget = _clipboardGetDefaultEmptyCanvasTarget()
) {
  switch (emptyCanvasTarget) {
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
  const replacementCandidates = {};
  for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
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
    replacementCandidates[strategy.documentName] = {
      documents: eligibleDocuments,
      requestedCount: documents.length,
    };
  }

  return _clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates);
}

function _clipboardResolveCanvasMediaPlan({
  activeDocumentName = _clipboardGetActiveDocumentName(),
  emptyCanvasTarget = _clipboardGetDefaultEmptyCanvasTarget(),
  replacementCandidates = null,
  canCreateTokens = _clipboardCanCreateTokens(),
  canCreateTiles = _clipboardCanCreateTiles(),
} = {}) {
  const createDocumentName = _clipboardGetCreateDocumentName(activeDocumentName, emptyCanvasTarget);
  const replacementTarget = replacementCandidates
    ? _clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates)
    : _clipboardGetReplacementTarget(activeDocumentName);
  const canCreateDocument = createDocumentName === "Token" ? canCreateTokens : canCreateTiles;

  return {
    activeDocumentName,
    createDocumentName,
    replacementTarget,
    replacementBlocked: Boolean(replacementTarget?.blocked),
    canCreateDocument,
    shouldCreate: !replacementTarget && canCreateDocument,
  };
}

function _clipboardResolvePasteContext({fallbackToCenter = false, requireCanvasFocus = true} = {}) {
  const activeDocumentName = _clipboardGetActiveDocumentName();
  const mediaPlan = _clipboardResolveCanvasMediaPlan({activeDocumentName});
  const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);

  return {
    mousePos,
    activeDocumentName,
    createDocumentName: mediaPlan.createDocumentName,
    createStrategy: mediaPlan.canCreateDocument ? _clipboardGetPlaceableStrategy(mediaPlan.createDocumentName) : null,
    replacementTarget: mediaPlan.replacementTarget,
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

function _clipboardGetAllScenesForLinkedTokenUpdates() {
  if (Array.isArray(game?.scenes?.contents) && game.scenes.contents.length) {
    return game.scenes.contents.filter(Boolean);
  }

  return canvas?.scene ? [canvas.scene] : [];
}

async function _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options = {}) {
  const eligibility = options.eligibility || _clipboardGetTokenActorArtEligibility(replacementTarget, {mediaKind: "image"});
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "Actor portrait + linked token art is unavailable for the current token selection.");
  }

  _clipboardLog("info", "Replacing actor portrait and linked token art", {
    actorIds: eligibility.actors.map(actor => actor.id || null),
    replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
    path,
  });

  for (const actor of eligibility.actors) {
    await actor.update({
      img: path,
      "prototypeToken.texture.src": path,
    });
  }

  const updatesByScene = new Map();
  const trackSceneUpdate = (scene, tokenDocument) => {
    if (!scene?.updateEmbeddedDocuments || !tokenDocument?.id) return;
    const existing = updatesByScene.get(scene) || new Map();
    existing.set(tokenDocument.id, {
      _id: tokenDocument.id,
      "texture.src": path,
    });
    updatesByScene.set(scene, existing);
  };

  for (const scene of _clipboardGetAllScenesForLinkedTokenUpdates()) {
    const tokenDocuments = scene?.tokens?.contents || [];
    for (const tokenDocument of tokenDocuments) {
      if (!tokenDocument?.actorLink || !tokenDocument?.actorId) continue;
      if (!eligibility.actors.some(actor => actor.id === tokenDocument.actorId)) continue;
      trackSceneUpdate(scene, tokenDocument);
    }
  }

  for (const document of replacementTarget.documents) {
    trackSceneUpdate(canvas?.scene, document);
  }

  for (const [scene, sceneUpdates] of updatesByScene.entries()) {
    if (!sceneUpdates.size) continue;
    await scene.updateEmbeddedDocuments("Token", Array.from(sceneUpdates.values()));
  }

  return true;
}

async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind, options = {}) {
  if (!replacementTarget) return false;

  if (
    options.mode === "actor-art" &&
    replacementTarget.documentName === "Token" &&
    mediaKind === "image"
  ) {
    return _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options);
  }

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
  _clipboardGetTokenActorArtEligibility,
  _clipboardCanCreateDocument,
  _clipboardGetPastedDocumentName,
  _clipboardGetAvailableActorTypes,
  _clipboardGetActorDocumentClass,
  _clipboardGetDefaultActorType,
  _clipboardGetPastedTokenActorImage,
  _clipboardCreatePastedTokenActor,
  _clipboardGetReplacementOrder,
  _clipboardGetActiveDocumentName,
  _clipboardGetCreateDocumentName,
  _clipboardGetPlaceableStrategy,
  _clipboardResolveReplacementTargetFromCandidates,
  _clipboardGetReplacementTarget,
  _clipboardResolveCanvasMediaPlan,
  _clipboardResolvePasteContext,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
  _clipboardGetAllScenesForLinkedTokenUpdates,
  _clipboardReplaceControlledTokenActorArt,
  _clipboardReplaceControlledMedia,
};
