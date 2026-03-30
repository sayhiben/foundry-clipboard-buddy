const {
  CLIPBOARD_IMAGE_SCENE_CONTROLS,
  CLIPBOARD_IMAGE_TOOL_PASTE,
  CLIPBOARD_IMAGE_TOOL_UPLOAD,
  CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
  CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
} = require("./constants");
const {CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS, _clipboardSetHiddenMode} = require("./state");
const {
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardDescribePasteContext,
  _clipboardLog,
  _clipboardSerializeError,
} = require("./diagnostics");
const {
  _clipboardExtractImageBlobFromDataTransfer,
  _clipboardExtractImageInput,
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardExtractTextInputFromDataTransfer,
  _clipboardGetChatRootFromTarget,
  _clipboardIsEditableTarget,
  _clipboardInsertTextAtTarget,
  _clipboardReadClipboardItems,
} = require("./clipboard");
const {
  _clipboardGetFocusedArtFieldTarget,
} = require("./field-targets");
const {
  _clipboardResolvePasteContext,
  _clipboardCanPasteToContext,
} = require("./context");
const {
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
} = require("./constants");
const {
  _clipboardCanUseChatMedia,
  _clipboardCanUseChatUploadButton,
  _clipboardCanUseScenePasteTool,
  _clipboardCanUseSceneUploadTool,
  _clipboardGetScenePastePromptMode,
} = require("./settings");
const {
  _clipboardExecutePasteWorkflow,
  _clipboardHandleImageInput,
  _clipboardHandleChatImageInput,
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleArtFieldImageInput,
  _clipboardHandleTextInput,
  _clipboardHasPasteConflict,
  _clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction,
  _clipboardHandleChatUploadAction,
} = require("./workflows");

const CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID = "foundry-paste-eater-scene-paste-prompt";
const CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID = "foundry-paste-eater-scene-paste-target";

function _clipboardUpsertSceneControlTool(control, toolName, toolData) {
  if (Array.isArray(control?.tools)) {
    const existingIndex = control.tools.findIndex(entry => entry?.name === toolName);
    if (existingIndex >= 0) {
      control.tools[existingIndex] = {
        ...control.tools[existingIndex],
        ...toolData,
      };
      return;
    }

    control.tools.push(toolData);
    return;
  }

  if (control?.tools) {
    control.tools[toolName] = toolData;
  }
}

function _clipboardAddSceneControlButtons(controls) {
  for (const controlName of CLIPBOARD_IMAGE_SCENE_CONTROLS) {
    const control = controls[controlName];
    if (!control?.tools) continue;

    const order = Array.isArray(control.tools)
      ? control.tools.length
      : Object.keys(control.tools).length;
    const onPasteClick = () => _clipboardHandleScenePasteToolClick();
    const onUploadClick = () => _clipboardHandleSceneUploadAction();
    _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_PASTE, {
      name: CLIPBOARD_IMAGE_TOOL_PASTE,
      title: "Paste Media",
      icon: "fa-solid fa-paste",
      order,
      button: true,
      visible: _clipboardCanUseScenePasteTool(),
      onClick: onPasteClick,
      onChange: onPasteClick,
    });
    _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_UPLOAD, {
      name: CLIPBOARD_IMAGE_TOOL_UPLOAD,
      title: "Upload Media",
      icon: "fa-solid fa-file-image",
      order: order + 1,
      button: true,
      visible: _clipboardCanUseSceneUploadTool(),
      onClick: onUploadClick,
      onChange: onUploadClick,
    });
  }
}

function _clipboardGetScenePastePrompt() {
  return document.getElementById(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID);
}

function _clipboardScenePastePromptIsOpen(prompt = _clipboardGetScenePastePrompt()) {
  return Boolean(prompt?.isConnected);
}

function _clipboardSetScenePastePromptMessage(prompt, message) {
  const messageElement = prompt?.querySelector?.("[data-role='message']");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

function _clipboardCloseScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
  prompt?.remove?.();
}

function _clipboardFocusScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
  const target = prompt?.querySelector?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
  if (!target) return;

  target.focus({preventScroll: true});
  target.select?.();
}

function _clipboardGetScenePastePromptFallbackMessage(clipItems) {
  if (clipItems?.length && clipItems.every(item => !item?.types?.length)) {
    return "This clipboard content is not exposed to direct clipboard reads here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
  }

  return "Direct clipboard read did not return usable media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
}

async function _clipboardOnScenePastePromptPaste(event) {
  const prompt = event.currentTarget?.closest?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID}`);
  const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
  if (!imageInput) {
    ui.notifications.warn("Foundry Paste Eater: No supported media was found in that paste.");
    _clipboardSetScenePastePromptMessage(prompt, "No supported media was found in that paste. Try again, or use Upload Media.");
    return;
  }

  _clipboardConsumePasteEvent(event);
  const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
    contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  }), {
    respectCopiedObjects: false,
  });

  if (handled) {
    _clipboardCloseScenePastePrompt(prompt);
    return;
  }

  _clipboardSetScenePastePromptMessage(prompt, "Paste did not create media. Try again, or use Upload Media.");
  _clipboardFocusScenePastePrompt(prompt);
}

function _clipboardOpenScenePastePrompt() {
  const existingPrompt = _clipboardGetScenePastePrompt();
  if (existingPrompt) {
    _clipboardFocusScenePastePrompt(existingPrompt);
    return existingPrompt;
  }

  const prompt = document.createElement("div");
  prompt.id = CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID;
  prompt.className = "foundry-paste-eater-scene-paste-prompt";
  prompt.innerHTML = `
    <div class="foundry-paste-eater-scene-paste-panel" role="dialog" aria-modal="true" aria-labelledby="foundry-paste-eater-scene-paste-title">
      <h2 id="foundry-paste-eater-scene-paste-title">Paste Media</h2>
      <p data-role="message">Trying direct clipboard read. If nothing happens, press Cmd+V / Ctrl+V in the field below.</p>
      <textarea
        id="${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}"
        class="foundry-paste-eater-scene-paste-target"
        rows="4"
        placeholder="Press Cmd+V / Ctrl+V here if direct clipboard read does not complete."
      ></textarea>
      <div class="foundry-paste-eater-scene-paste-actions">
        ${_clipboardCanUseSceneUploadTool() ? '<button type="button" data-action="upload">Upload Media</button>' : ""}
        <button type="button" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;

  const target = prompt.querySelector(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
  const uploadButton = prompt.querySelector('[data-action="upload"]');
  const cancelButton = prompt.querySelector('[data-action="cancel"]');

  target?.addEventListener("paste", _clipboardOnScenePastePromptPaste, {capture: true});
  uploadButton?.addEventListener("click", () => {
    _clipboardCloseScenePastePrompt(prompt);
    _clipboardHandleSceneUploadAction();
  });
  cancelButton?.addEventListener("click", () => _clipboardCloseScenePastePrompt(prompt));
  prompt.addEventListener("click", event => {
    if (event.target === prompt) _clipboardCloseScenePastePrompt(prompt);
  });

  document.body.append(prompt);
  _clipboardFocusScenePastePrompt(prompt);
  _clipboardLog("info", "Opened scene paste prompt fallback.");
  return prompt;
}

async function _clipboardTryScenePastePromptDirectRead(prompt) {
  if (!navigator.clipboard?.read) {
    _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard reads are unavailable here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
    return false;
  }

  const clipItems = await _clipboardReadClipboardItems();
  if (!_clipboardScenePastePromptIsOpen(prompt)) return false;

  if (!clipItems?.length) {
    _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
    _clipboardFocusScenePastePrompt(prompt);
    return false;
  }

  const imageInput = await _clipboardExtractImageInput(clipItems);
  if (!_clipboardScenePastePromptIsOpen(prompt)) return false;

  if (!imageInput) {
    _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
    _clipboardFocusScenePastePrompt(prompt);
    return false;
  }

  const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
    contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  }), {
    respectCopiedObjects: false,
  });

  if (handled) {
    _clipboardCloseScenePastePrompt(prompt);
    return true;
  }

  if (_clipboardScenePastePromptIsOpen(prompt)) {
    _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard read did not create media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
    _clipboardFocusScenePastePrompt(prompt);
  }
  return false;
}

function _clipboardHandleScenePasteToolClick() {
  if (!_clipboardCanUseScenePasteTool()) return false;

  const promptMode = _clipboardGetScenePastePromptMode();
  if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
    return _clipboardHandleScenePasteAction();
  }

  const prompt = _clipboardOpenScenePastePrompt();
  if (promptMode !== CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS) {
    void _clipboardTryScenePastePromptDirectRead(prompt);
  }
  return true;
}

function _clipboardToggleChatDropTarget(root, active) {
  root.classList.toggle("foundry-paste-eater-chat-drop-target", active);
}

function _clipboardOnChatDragOver(event) {
  if (!_clipboardCanUseChatMedia()) return;
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
  if (!_clipboardCanUseChatMedia()) return;
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

function _clipboardSyncChatUploadButton(root) {
  const existingButtons = Array.from(root.querySelectorAll(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`));
  if (!_clipboardCanUseChatUploadButton()) {
    for (const button of existingButtons) button.remove();
    return;
  }

  if (existingButtons.length) return;

  const form = root.matches("form") ? root : (root.querySelector("form") || root.closest("form"));
  if (!form) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "foundry-paste-eater-chat-upload";
  button.dataset.action = CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION;
  button.title = "Upload Chat Media";
  button.ariaLabel = "Upload Chat Media";
  button.innerHTML = `<i class="fa-solid fa-file-image"></i>`;
  button.addEventListener("click", () => _clipboardHandleChatUploadAction());
  form.append(button);
}

function _clipboardAttachChatUploadButton(root) {
  _clipboardSyncChatUploadButton(root);
}

function _clipboardBindChatRoot(root) {
  if (!root) return;

  _clipboardSyncChatUploadButton(root);
  if (CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.has(root)) return;

  root.setAttribute(require("./constants").CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
  root.addEventListener("dragover", _clipboardOnChatDragOver);
  root.addEventListener("dragleave", _clipboardOnChatDragLeave);
  root.addEventListener("drop", _clipboardOnChatDrop);
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
    if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) {
      _clipboardLog("info", "Inserted the original URL into chat after media handling failed", {
        imageInput: _clipboardDescribeImageInput(imageInput),
        error: _clipboardSerializeError(error),
      });
      return false;
    }
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
    const artFieldTarget = _clipboardGetFocusedArtFieldTarget(event.target);
    if (artFieldTarget) {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleArtFieldImageInput(imageInput, artFieldTarget), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (_clipboardGetChatRootFromTarget(event.target)) {
      if (!_clipboardCanUseChatMedia()) return;
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      _clipboardConsumePasteEvent(event);
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
        respectCopiedObjects: false,
      });
      return;
    }

    if (_clipboardIsEditableTarget(event.target)) {
      _clipboardLog("info", "Ignoring pasted media in an unsupported editable target.", {
        targetTagName: event.target?.tagName || null,
        targetName: event.target?.name || event.target?.dataset?.edit || null,
      });
      return;
    }

    const context = _clipboardResolvePasteContext();
    if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted media because the canvas context is not eligible.")) return;
    if (_clipboardHasPasteConflict()) return;

    _clipboardConsumePasteEvent(event);
    void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInputWithTextFallback(imageInput, {context}), {
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
  void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput, {context}), {
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
}

module.exports = {
  _clipboardAddSceneControlButtons,
  _clipboardGetScenePastePrompt,
  _clipboardScenePastePromptIsOpen,
  _clipboardSetScenePastePromptMessage,
  _clipboardCloseScenePastePrompt,
  _clipboardFocusScenePastePrompt,
  _clipboardGetScenePastePromptFallbackMessage,
  _clipboardUpsertSceneControlTool,
  _clipboardOnScenePastePromptPaste,
  _clipboardOpenScenePastePrompt,
  _clipboardTryScenePastePromptDirectRead,
  _clipboardHandleScenePasteToolClick,
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
