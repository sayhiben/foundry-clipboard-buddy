const {
  _clipboardLog,
  _clipboardReportError,
} = require("../diagnostics");
const {_clipboardHasCopiedObjects} = require("../context");
const {_clipboardGetLocked, _clipboardSetLocked} = require("../state");

function _clipboardHasPasteConflict({respectCopiedObjects = true} = {}) {
  if (respectCopiedObjects && _clipboardHasCopiedObjects()) {
    _clipboardLog("warn", "Priority given to Foundry copied objects.");
    return true;
  }

  if (_clipboardGetLocked()) {
    _clipboardLog("info", "Skipping paste because the module is already handling another paste.");
    return true;
  }

  if (game.modules.get("vtta-tokenizer")?.active &&
      Object.values(ui.windows).some(windowApp => windowApp.id === "tokenizer-control")) {
    _clipboardLog("info", "Skipping paste because VTTA Tokenizer is active.");
    return true;
  }

  return false;
}

async function _clipboardExecutePasteWorkflow(workflow, options = {}) {
  const {notifyError = true, respectCopiedObjects = true} = options;
  if (_clipboardHasPasteConflict({respectCopiedObjects})) return false;

  _clipboardSetLocked(true);
  _clipboardLog("debug", "Starting paste workflow", {options});
  try {
    const result = await workflow();
    _clipboardLog("debug", "Finished paste workflow", {options, result});
    return result;
  } catch (error) {
    _clipboardReportError(error, {
      operation: "execute-paste-workflow",
      details: {options},
      notifyLocal: notifyError,
      logMessage: "Failed to handle media input",
    });
    return false;
  } finally {
    _clipboardSetLocked(false);
  }
}

module.exports = {
  _clipboardHasPasteConflict,
  _clipboardExecutePasteWorkflow,
};
