const core = require("./core");

module.exports = {
  dispatchClipboardModeKeydown: core.dispatchClipboardModeKeydown,
  dispatchFileDrop: core.dispatchFileDrop,
  dispatchFilePaste: core.dispatchFilePaste,
  dispatchMixedPaste: core.dispatchMixedPaste,
  dispatchTextPaste: core.dispatchTextPaste,
  getFixturePath: core.getFixturePath,
  getFixtureUrl: core.getFixtureUrl,
  restoreClipboardRead: core.restoreClipboardRead,
  stubClipboardRead: core.stubClipboardRead,
};
