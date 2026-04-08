const {_clipboardLog} = require("../diagnostics");
const {
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardScaleTokenDimensions,
} = require("../media");
const {_clipboardGetHiddenMode} = require("../state");
const {_clipboardShouldCreateBackingActors} = require("../settings");
const {_clipboardGetControlledPlaceables} = require("./selection");

function _clipboardGetTokenPosition(mousePos) {
  return canvas?.grid?.getTopLeftPoint?.(mousePos) || mousePos;
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
        tokenData.actorLink = true;
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

function _clipboardGetPlaceableStrategy(documentName = "Tile") {
  return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
}

module.exports = {
  CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES,
  _clipboardGetTokenPosition,
  _clipboardGetPastedDocumentName,
  _clipboardGetAvailableActorTypes,
  _clipboardGetActorDocumentClass,
  _clipboardGetDefaultActorType,
  _clipboardGetPastedTokenActorImage,
  _clipboardCreatePastedTokenActor,
  _clipboardGetPlaceableStrategy,
};
