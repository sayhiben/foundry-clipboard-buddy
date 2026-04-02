const {
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
} = require("../constants");
const {
  _clipboardCanCreateTokens,
  _clipboardCanCreateTiles,
  _clipboardGetDefaultEmptyCanvasTarget,
} = require("../settings");
const {
  _clipboardGetActiveDocumentName,
  _clipboardResolveReplacementTargetFromCandidates,
  _clipboardGetReplacementTarget,
} = require("./selection");
const {_clipboardGetPlaceableStrategy} = require("./create-strategies");

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

module.exports = {
  _clipboardGetMousePosition,
  _clipboardGetCanvasCenter,
  _clipboardGetCreateDocumentName,
  _clipboardResolveCanvasMediaPlan,
  _clipboardResolvePasteContext,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
};
