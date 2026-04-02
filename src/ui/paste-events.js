const {_clipboardSetHiddenMode} = require("../state");
const {
  _clipboardDescribeDataTransfer,
  _clipboardDescribePasteContext,
  _clipboardLog,
} = require("../diagnostics");
const {
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardExtractTextInputFromDataTransfer,
  _clipboardGetChatRootFromTarget,
  _clipboardIsEditableTarget,
} = require("../clipboard");
const {_clipboardGetFocusedArtFieldTarget} = require("../field-targets");
const {_clipboardResolvePasteContext, _clipboardCanPasteToContext} = require("../context");
const {
  _clipboardCanUseChatMedia,
} = require("../settings");
const {
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleArtFieldImageInput,
  _clipboardHandleTextInput,
  _clipboardHasPasteConflict,
  _clipboardExecutePasteWorkflow,
} = require("../workflows");
const {_clipboardHandleChatImageInputWithTextFallback} = require("./chat");

function _clipboardConsumePasteEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function _clipboardCanHandleCanvasPasteContext(context, rejectionMessage) {
  if (_clipboardCanPasteToContext(context)) return true;

  _clipboardLog("info", rejectionMessage, {
    context: _clipboardDescribePasteContext(context),
  });
  return false;
}

function _clipboardResolveNativePasteRoute({
  hasMediaInput = false,
  hasTextInput = false,
  hasArtFieldTarget = false,
  isChatTarget = false,
  isEditableTarget = false,
  canUseChatMedia = _clipboardCanUseChatMedia(),
  canvasContextEligible = false,
} = {}) {
  if (hasMediaInput) {
    if (hasArtFieldTarget) return {route: "art-field-media"};
    if (isChatTarget) {
      return {route: canUseChatMedia ? "chat-media" : "ignore-chat-media-disabled"};
    }
    if (isEditableTarget) return {route: "ignore-editable-media"};
    return {route: canvasContextEligible ? "canvas-media" : "ignore-media-ineligible"};
  }

  if (hasTextInput) {
    if (isChatTarget) return {route: "ignore-chat-text"};
    if (isEditableTarget) return {route: "ignore-editable-text"};
    return {route: canvasContextEligible ? "canvas-text" : "ignore-text-ineligible"};
  }

  return {route: "ignore-empty"};
}

function _clipboardOnPaste(event) {
  _clipboardLog("debug", "Received paste event.", {
    targetTagName: event.target?.tagName || null,
    isChatTarget: Boolean(_clipboardGetChatRootFromTarget(event.target)),
    isEditableTarget: _clipboardIsEditableTarget(event.target),
    dataTransfer: _clipboardDescribeDataTransfer(event.clipboardData),
  });

  const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
  const context = _clipboardResolvePasteContext();
  const isChatTarget = Boolean(_clipboardGetChatRootFromTarget(event.target));
  const isEditableTarget = _clipboardIsEditableTarget(event.target);
  if (imageInput) {
    const artFieldTarget = _clipboardGetFocusedArtFieldTarget(event.target);
    const route = _clipboardResolveNativePasteRoute({
      hasMediaInput: true,
      hasArtFieldTarget: Boolean(artFieldTarget),
      isChatTarget,
      isEditableTarget,
      canUseChatMedia: _clipboardCanUseChatMedia(),
      canvasContextEligible: _clipboardCanPasteToContext(context),
    });

    if (route.route === "art-field-media") {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleArtFieldImageInput(imageInput, artFieldTarget), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (route.route === "chat-media") {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (route.route === "ignore-chat-media-disabled") return;

    if (route.route === "ignore-editable-media") {
      _clipboardLog("info", "Ignoring pasted media in an unsupported editable target.", {
        targetTagName: event.target?.tagName || null,
        targetName: event.target?.name || event.target?.dataset?.edit || null,
      });
      return;
    }

    if (route.route === "ignore-media-ineligible") {
      if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted media because the canvas context is not eligible.")) return;
    }

    if (_clipboardHasPasteConflict()) return;

    _clipboardConsumePasteEvent(event);
    void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInputWithTextFallback(imageInput, {context}), {
      respectCopiedObjects: false,
    });
    return;
  }

  const textInput = _clipboardExtractTextInputFromDataTransfer(event.clipboardData);
  if (!textInput) return;
  const route = _clipboardResolveNativePasteRoute({
    hasTextInput: true,
    isChatTarget,
    isEditableTarget,
    canvasContextEligible: _clipboardCanPasteToContext(context),
  });
  if (route.route === "ignore-chat-text" || route.route === "ignore-editable-text") return;

  if (route.route === "ignore-text-ineligible") {
    if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted text because the canvas context is not eligible.")) return;
  }

  if (_clipboardHasPasteConflict()) return;

  _clipboardConsumePasteEvent(event);
  void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput, {context}), {
    respectCopiedObjects: false,
  });
}

function _clipboardOnKeydown(event) {
  const hiddenMode = (event.ctrlKey || event.metaKey) && event.getModifierState("CapsLock");
  if (hiddenMode !== require("../state")._clipboardGetHiddenMode()) {
    _clipboardLog("debug", "Updated hidden paste mode.", {
      hiddenMode,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      code: event.code,
    });
  }
  _clipboardSetHiddenMode(hiddenMode);
}

module.exports = {
  _clipboardConsumePasteEvent,
  _clipboardCanHandleCanvasPasteContext,
  _clipboardResolveNativePasteRoute,
  _clipboardOnPaste,
  _clipboardOnKeydown,
};
