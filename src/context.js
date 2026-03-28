const {_clipboardDescribeReplacementTarget, _clipboardLog} = require("./diagnostics");
const {
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardScaleTokenDimensions,
} = require("./media");
const {_clipboardGetHiddenMode} = require("./state");

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

const CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES = {
  Token: {
    documentName: "Token",
    getControlledDocuments: () => (canvas?.tokens?.controlled || []).map(token => token.document),
    getLayer: () => canvas?.tokens,
    createData: ({path, imgWidth, imgHeight, mousePos}) => {
      const snappedPosition = _clipboardGetTokenPosition(mousePos);
      const dimensions = _clipboardScaleTokenDimensions(imgWidth, imgHeight);

      return [{
        actorId: null,
        name: "Pasted Media",
        texture: {
          src: path,
        },
        width: dimensions.width,
        height: dimensions.height,
        x: snappedPosition.x,
        y: snappedPosition.y,
        hidden: _clipboardGetHiddenMode(),
        locked: false,
      }];
    },
  },
  Tile: {
    documentName: "Tile",
    getControlledDocuments: () => (canvas?.tiles?.controlled || []).map(tile => tile.document),
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
};

const CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
  Token: ["Token", "Tile"],
  Tile: ["Tile", "Token"],
};

function _clipboardGetActiveDocumentName() {
  return canvas?.activeLayer === canvas?.tokens ? "Token" : "Tile";
}

function _clipboardGetPlaceableStrategy(documentName = _clipboardGetActiveDocumentName()) {
  return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
}

function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
  for (const documentName of CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName]) {
    const strategy = _clipboardGetPlaceableStrategy(documentName);
    const documents = strategy.getControlledDocuments();
    if (!documents.length) continue;

    return {
      documentName: strategy.documentName,
      documents,
    };
  }

  return null;
}

function _clipboardResolvePasteContext({fallbackToCenter = false, requireCanvasFocus = true} = {}) {
  const activeDocumentName = _clipboardGetActiveDocumentName();
  const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);

  return {
    mousePos,
    createStrategy: _clipboardGetPlaceableStrategy(activeDocumentName),
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
  if (context.replacementTarget) return true;
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
  _clipboardGetActiveDocumentName,
  _clipboardGetPlaceableStrategy,
  _clipboardGetReplacementTarget,
  _clipboardResolvePasteContext,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
  _clipboardReplaceControlledMedia,
};
