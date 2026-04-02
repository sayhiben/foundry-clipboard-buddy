const legacy = require("./legacy");

module.exports = {
  CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES: legacy.CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES,
  _clipboardGetMousePosition: legacy._clipboardGetMousePosition,
  _clipboardGetCanvasCenter: legacy._clipboardGetCanvasCenter,
  _clipboardGetTokenPosition: legacy._clipboardGetTokenPosition,
  _clipboardGetPastedDocumentName: legacy._clipboardGetPastedDocumentName,
  _clipboardGetAvailableActorTypes: legacy._clipboardGetAvailableActorTypes,
  _clipboardGetActorDocumentClass: legacy._clipboardGetActorDocumentClass,
  _clipboardGetDefaultActorType: legacy._clipboardGetDefaultActorType,
  _clipboardGetPastedTokenActorImage: legacy._clipboardGetPastedTokenActorImage,
  _clipboardCreatePastedTokenActor: legacy._clipboardCreatePastedTokenActor,
  _clipboardGetActiveDocumentName: legacy._clipboardGetActiveDocumentName,
  _clipboardGetCreateDocumentName: legacy._clipboardGetCreateDocumentName,
  _clipboardGetPlaceableStrategy: legacy._clipboardGetPlaceableStrategy,
  _clipboardPrepareCreateLayer: legacy._clipboardPrepareCreateLayer,
};
