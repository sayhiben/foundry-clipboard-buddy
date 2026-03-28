const {
  CLIPBOARD_IMAGE_SCENE_CONTROLS,
  CLIPBOARD_IMAGE_TOOL_PASTE,
  CLIPBOARD_IMAGE_TOOL_UPLOAD,
  CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
} = require("./constants");
const {CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS, _clipboardSetHiddenMode} = require("./state");
const {
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardDescribePasteContext,
  _clipboardLog,
} = require("./diagnostics");
const {
  _clipboardExtractImageBlobFromDataTransfer,
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardExtractTextInputFromDataTransfer,
  _clipboardGetChatRootFromTarget,
  _clipboardIsEditableTarget,
  _clipboardInsertTextAtTarget,
} = require("./clipboard");
const {
  _clipboardResolvePasteContext,
  _clipboardCanPasteToContext,
} = require("./context");
const {
  _clipboardExecutePasteWorkflow,
  _clipboardHandleChatImageInput,
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleTextInput,
  _clipboardReadAndPasteClipboardContent,
  _clipboardHasPasteConflict,
  _clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction,
  _clipboardHandleChatUploadAction,
} = require("./workflows");

function _clipboardAddSceneControlButtons(controls) {
  for (const controlName of CLIPBOARD_IMAGE_SCENE_CONTROLS) {
    const control = controls[controlName];
    if (!control?.tools) continue;

    const order = Object.keys(control.tools).length;
    control.tools[CLIPBOARD_IMAGE_TOOL_PASTE] = {
      name: CLIPBOARD_IMAGE_TOOL_PASTE,
      title: "Paste Media",
      icon: "fa-solid fa-paste",
      order,
      button: true,
      visible: game.user.isGM,
      onChange: () => _clipboardHandleScenePasteAction(),
    };
    control.tools[CLIPBOARD_IMAGE_TOOL_UPLOAD] = {
      name: CLIPBOARD_IMAGE_TOOL_UPLOAD,
      title: "Upload Media",
      icon: "fa-solid fa-file-image",
      order: order + 1,
      button: true,
      visible: game.user.isGM,
      onChange: () => _clipboardHandleSceneUploadAction(),
    };
  }
}

function _clipboardToggleChatDropTarget(root, active) {
  root.classList.toggle("clipboard-image-chat-drop-target", active);
}

function _clipboardOnChatDragOver(event) {
  const root = event.currentTarget;
  const blob = _clipboardExtractImageBlobFromDataTransfer(event.dataTransfer);
  if (!blob) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  _clipboardToggleChatDropTarget(root, true);
}

function _clipboardOnChatDragLeave(event) {
  const root = event.currentTarget;
  if (root.contains(event.relatedTarget)) return;
  _clipboardToggleChatDropTarget(root, false);
}

function _clipboardOnChatDrop(event) {
  const root = event.currentTarget;
  _clipboardToggleChatDropTarget(root, false);

  const mediaInput = _clipboardExtractImageInputFromDataTransfer(event.dataTransfer);
  if (!mediaInput) return;

  _clipboardLog("info", "Handling dropped media in chat.", {
    imageInput: _clipboardDescribeImageInput(mediaInput),
    dataTransfer: _clipboardDescribeDataTransfer(event.dataTransfer),
  });
  event.preventDefault();
  event.stopPropagation();
  void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInput(mediaInput), {
    respectCopiedObjects: false,
  });
}

function _clipboardAttachChatUploadButton(root) {
  if (root.querySelector(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`)) return;

  const form = root.matches("form") ? root : (root.querySelector("form") || root.closest("form"));
  if (!form) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "clipboard-image-chat-upload";
  button.dataset.action = CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION;
  button.title = "Upload Chat Media";
  button.ariaLabel = "Upload Chat Media";
  button.innerHTML = `<i class="fa-solid fa-file-image"></i>`;
  button.addEventListener("click", () => _clipboardHandleChatUploadAction());
  form.append(button);
}

function _clipboardBindChatRoot(root) {
  if (!root || CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.has(root)) return;

  root.setAttribute(require("./constants").CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
  root.addEventListener("dragover", _clipboardOnChatDragOver);
  root.addEventListener("dragleave", _clipboardOnChatDragLeave);
  root.addEventListener("drop", _clipboardOnChatDrop);
  _clipboardAttachChatUploadButton(root);
  CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.add(root);
}

function _clipboardOnRenderChatInput(_app, elements) {
  for (const element of Object.values(elements || {})) {
    if (!(element instanceof HTMLElement)) continue;
    const root = element.matches("form") ? element : (element.closest("form") || element);
    _clipboardBindChatRoot(root);
  }
}

async function _clipboardHandleChatImageInputWithTextFallback(imageInput, target) {
  try {
    return await _clipboardHandleChatImageInput(imageInput);
  } catch (error) {
    if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) return false;
    throw error;
  }
}

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

function _clipboardOnPaste(event) {
  _clipboardLog("debug", "Received paste event.", {
    targetTagName: event.target?.tagName || null,
    isChatTarget: Boolean(_clipboardGetChatRootFromTarget(event.target)),
    isEditableTarget: _clipboardIsEditableTarget(event.target),
    dataTransfer: _clipboardDescribeDataTransfer(event.clipboardData),
  });

  const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
  if (imageInput) {
    if (_clipboardGetChatRootFromTarget(event.target)) {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
        respectCopiedObjects: false,
      });
      return;
    }

    const context = _clipboardResolvePasteContext();
    if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted media because the canvas context is not eligible.")) return;
    if (_clipboardHasPasteConflict()) return;

    _clipboardConsumePasteEvent(event);
    void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInputWithTextFallback(imageInput), {
      respectCopiedObjects: false,
    });
    return;
  }

  const textInput = _clipboardExtractTextInputFromDataTransfer(event.clipboardData);
  if (!textInput) return;
  if (_clipboardGetChatRootFromTarget(event.target) || _clipboardIsEditableTarget(event.target)) return;

  const context = _clipboardResolvePasteContext();
  if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted text because the canvas context is not eligible.")) return;
  if (_clipboardHasPasteConflict()) return;

  _clipboardConsumePasteEvent(event);
  void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput), {
    respectCopiedObjects: false,
  });
}

function _clipboardOnKeydown(event) {
  const hiddenMode = (event.ctrlKey || event.metaKey) && event.getModifierState("CapsLock");
  if (hiddenMode !== require("./state")._clipboardGetHiddenMode()) {
    _clipboardLog("debug", "Updated hidden paste mode.", {
      hiddenMode,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      code: event.code,
    });
  }
  _clipboardSetHiddenMode(hiddenMode);

  if (event.defaultPrevented || event.repeat) return;
  if (event.code !== "KeyV" || !event.metaKey || event.ctrlKey || event.altKey) return;
  if (!navigator.clipboard?.read) return;

  const context = _clipboardResolvePasteContext();
  if (!_clipboardCanPasteToContext(context)) return;
  if (_clipboardHasPasteConflict()) return;

  event.preventDefault();
  void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteClipboardContent(), {
    respectCopiedObjects: false,
  });
}

module.exports = {
  _clipboardAddSceneControlButtons,
  _clipboardToggleChatDropTarget,
  _clipboardOnChatDragOver,
  _clipboardOnChatDragLeave,
  _clipboardOnChatDrop,
  _clipboardAttachChatUploadButton,
  _clipboardBindChatRoot,
  _clipboardOnRenderChatInput,
  _clipboardHandleChatImageInputWithTextFallback,
  _clipboardConsumePasteEvent,
  _clipboardCanHandleCanvasPasteContext,
  _clipboardOnPaste,
  _clipboardOnKeydown,
};
