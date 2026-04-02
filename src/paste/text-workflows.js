const {
  _clipboardDescribePasteContext,
  _clipboardDescribeReplacementTarget,
  _clipboardLog,
} = require("../diagnostics");
const {_clipboardNormalizePastedText} = require("../text");
const {_clipboardResolvePasteContext, _clipboardCanPasteToContext} = require("../context");
const {_clipboardCanUseCanvasText} = require("../settings");
const {
  _clipboardEnsurePlaceableTextNote,
  _clipboardCreateStandaloneTextNote,
  _clipboardAppendTextToSceneNote,
} = require("../notes");
const {_clipboardAnnotateWorkflowError} = require("./helpers");

async function _clipboardHandleTextInput(textInput, options = {}) {
  const text = _clipboardNormalizePastedText(textInput?.text);
  if (!text) return false;
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasText()) return false;

  const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
  _clipboardLog("debug", "Handling pasted text", {
    textLength: text.length,
    context: _clipboardDescribePasteContext(context),
  });
  if (!_clipboardCanPasteToContext(context)) {
    _clipboardLog("info", "Skipping pasted text because the current context is not eligible", {
      context: _clipboardDescribePasteContext(context),
    });
    return false;
  }

  try {
    if (context.replacementTarget?.documents?.length) {
      _clipboardLog("info", "Applying pasted text to controlled placeables", {
        replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
        textLength: text.length,
      });
      for (const document of context.replacementTarget.documents) {
        if (context.replacementTarget.documentName === "Note") {
          await _clipboardAppendTextToSceneNote(document, text);
        } else {
          await _clipboardEnsurePlaceableTextNote(document, text, context.mousePos);
        }
      }
      return true;
    }

    _clipboardLog("info", "Creating a standalone text note from pasted text", {
      textLength: text.length,
      mousePos: context.mousePos,
    });
    return await _clipboardCreateStandaloneTextNote(text, context);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: "text",
    });
  }
}

module.exports = {
  _clipboardHandleTextInput,
};
