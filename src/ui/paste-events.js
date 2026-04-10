const {
  CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS,
  _clipboardSetHiddenMode,
} = require("../state");
const {
  _clipboardDescribeDataTransfer,
  _clipboardDescribePasteContext,
  _clipboardLog,
} = require("../diagnostics");
const {
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardExtractPdfInputFromDataTransfer,
  _clipboardExtractTextInputFromDataTransfer,
  _clipboardGetChatRootFromTarget,
  _clipboardIsEditableTarget,
} = require("../clipboard");
const {
  _clipboardGetFocusedArtFieldTarget,
  _clipboardGetFocusedPdfFieldTarget,
} = require("../field-targets");
const {_clipboardResolvePasteContext, _clipboardCanPasteToContext} = require("../context");
const {
  _clipboardCanUseChatMedia,
} = require("../settings");
const {
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleArtFieldImageInput,
  _clipboardHandleCanvasPdfInput,
  _clipboardHandleChatPdfInput,
  _clipboardHandlePdfFieldInput,
  _clipboardCanPastePdfToCanvasContext,
  _clipboardGetControlledSceneNoteDocuments,
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

function _clipboardGetGameRoot() {
  return document.querySelector(".game");
}

function _clipboardFocusGameRoot() {
  const root = _clipboardGetGameRoot();
  if (!root) return false;

  if (!root.hasAttribute("tabindex")) {
    root.tabIndex = 0;
  }

  document.activeElement?.blur?.();
  root.focus({preventScroll: true});
  return document.activeElement === root;
}

function _clipboardShouldRestoreGameFocus(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (_clipboardGetChatRootFromTarget(target)) return false;
  if (_clipboardGetFocusedPdfFieldTarget(target)) return false;
  if (_clipboardIsEditableTarget(target)) return false;
  if (_clipboardGetFocusedArtFieldTarget(target)) return false;
  return Boolean(target.closest("#board, #scene-controls"));
}

function _clipboardOnMouseDown(event) {
  if (!_clipboardShouldRestoreGameFocus(event.target)) return;
  _clipboardFocusGameRoot();
}

function _clipboardBindEventDocument(eventDocument = document) {
  if (!eventDocument?.addEventListener) return;
  if (CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS.has(eventDocument)) return;

  eventDocument.addEventListener("keydown", _clipboardOnKeydown);
  eventDocument.addEventListener("mousedown", _clipboardOnMouseDown, true);
  eventDocument.addEventListener("paste", _clipboardOnPaste);
  CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS.add(eventDocument);
}

function _clipboardResolveNativePasteRoute({
  hasPdfInput = false,
  hasMediaInput = false,
  hasTextInput = false,
  hasPdfFieldTarget = false,
  hasArtFieldTarget = false,
  isChatTarget = false,
  isEditableTarget = false,
  canUseChatMedia = _clipboardCanUseChatMedia(),
  canvasContextEligible = false,
} = {}) {
  if (hasPdfInput) {
    if (hasPdfFieldTarget) return {route: "pdf-field"};
    if (isChatTarget) {
      return {route: canUseChatMedia ? "chat-pdf" : "ignore-chat-media-disabled"};
    }
    if (isEditableTarget) return {route: "ignore-editable-pdf"};
    return {route: canvasContextEligible ? "canvas-pdf" : "ignore-pdf-ineligible"};
  }

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
  if (event.defaultPrevented) return;

  _clipboardLog("debug", "Received paste event.", {
    targetTagName: event.target?.tagName || null,
    isChatTarget: Boolean(_clipboardGetChatRootFromTarget(event.target)),
    isEditableTarget: _clipboardIsEditableTarget(event.target),
    dataTransfer: _clipboardDescribeDataTransfer(event.clipboardData),
  });

  const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
  const pdfInput = _clipboardExtractPdfInputFromDataTransfer(event.clipboardData);
  const context = _clipboardResolvePasteContext();
  const isChatTarget = Boolean(_clipboardGetChatRootFromTarget(event.target));
  const isEditableTarget = _clipboardIsEditableTarget(event.target);
  if (pdfInput) {
    const pdfFieldTarget = _clipboardGetFocusedPdfFieldTarget(event.target);
    const route = _clipboardResolveNativePasteRoute({
      hasPdfInput: true,
      hasPdfFieldTarget: Boolean(pdfFieldTarget),
      isChatTarget,
      isEditableTarget,
      canUseChatMedia: _clipboardCanUseChatMedia(),
      canvasContextEligible: _clipboardCanPastePdfToCanvasContext(context, _clipboardGetControlledSceneNoteDocuments()),
    });

    if (route.route === "pdf-field") {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandlePdfFieldInput(pdfInput, pdfFieldTarget), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (route.route === "chat-pdf") {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatPdfInput(pdfInput), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (route.route === "ignore-chat-media-disabled") return;

    if (route.route === "ignore-editable-pdf") {
      _clipboardLog("info", "Ignoring pasted PDF in an unsupported editable target.", {
        targetTagName: event.target?.tagName || null,
        targetName: event.target?.name || event.target?.dataset?.edit || null,
      });
      return;
    }

    if (route.route === "ignore-pdf-ineligible") {
      if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted PDF because the canvas context is not eligible.")) return;
    }

    if (_clipboardHasPasteConflict()) return;

    _clipboardConsumePasteEvent(event);
    void _clipboardExecutePasteWorkflow(() => _clipboardHandleCanvasPdfInput(pdfInput, {context}), {
      respectCopiedObjects: false,
    });
    return;
  }

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
  _clipboardGetGameRoot,
  _clipboardFocusGameRoot,
  _clipboardShouldRestoreGameFocus,
  _clipboardBindEventDocument,
  _clipboardOnMouseDown,
  _clipboardResolveNativePasteRoute,
  _clipboardOnPaste,
  _clipboardOnKeydown,
};
