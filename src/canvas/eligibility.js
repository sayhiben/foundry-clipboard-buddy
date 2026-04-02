const legacy = require("./legacy");

module.exports = {
  _clipboardCanUserModifyDocument: legacy._clipboardCanUserModifyDocument,
  _clipboardCanReplaceDocument: legacy._clipboardCanReplaceDocument,
  _clipboardGetTokenActorArtEligibility: legacy._clipboardGetTokenActorArtEligibility,
  _clipboardCanCreateDocument: legacy._clipboardCanCreateDocument,
  _clipboardHasCanvasFocus: legacy._clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas: legacy._clipboardIsMouseWithinCanvas,
  _clipboardCanPasteToContext: legacy._clipboardCanPasteToContext,
};
