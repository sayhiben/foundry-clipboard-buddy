const legacy = require("../paste/ui-legacy");

module.exports = {
  _clipboardConsumePasteEvent: legacy._clipboardConsumePasteEvent,
  _clipboardCanHandleCanvasPasteContext: legacy._clipboardCanHandleCanvasPasteContext,
  _clipboardResolveNativePasteRoute: legacy._clipboardResolveNativePasteRoute,
  _clipboardOnPaste: legacy._clipboardOnPaste,
  _clipboardOnKeydown: legacy._clipboardOnKeydown,
};
