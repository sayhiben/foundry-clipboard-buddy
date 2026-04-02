const legacy = require("./legacy-foundry");

module.exports = {
  dispatchClipboardModeKeydown: legacy.dispatchClipboardModeKeydown,
  dispatchFileDrop: legacy.dispatchFileDrop,
  dispatchFilePaste: legacy.dispatchFilePaste,
  dispatchMixedPaste: legacy.dispatchMixedPaste,
  dispatchTextPaste: legacy.dispatchTextPaste,
  getFixturePath: legacy.getFixturePath,
  getFixtureUrl: legacy.getFixtureUrl,
  restoreClipboardRead: legacy.restoreClipboardRead,
  stubClipboardRead: legacy.stubClipboardRead,
};
