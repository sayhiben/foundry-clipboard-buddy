const {
  CLIPBOARD_IMAGE_SCENE_CONTROLS,
  CLIPBOARD_IMAGE_TOOL_PASTE,
  CLIPBOARD_IMAGE_TOOL_UPLOAD,
  CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
} = require("../constants");
const {_clipboardExtractImageInput, _clipboardExtractImageInputFromDataTransfer, _clipboardReadClipboardItems} = require("../clipboard");
const {_clipboardLog} = require("../diagnostics");
const {
  _clipboardCanUseScenePasteTool,
  _clipboardCanUseSceneUploadTool,
  _clipboardGetScenePastePromptMode,
} = require("../settings");
const {
  _clipboardExecutePasteWorkflow,
  _clipboardHandleImageInput,
  _clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction,
} = require("../workflows");
const {_clipboardConsumePasteEvent} = require("./paste-events");

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

function _clipboardResolveScenePasteToolPlan({
  canUseScenePasteTool = _clipboardCanUseScenePasteTool(),
  promptMode = _clipboardGetScenePastePromptMode(),
} = {}) {
  if (!canUseScenePasteTool) {
    return {
      action: "disabled",
      openPrompt: false,
      tryDirectReadInPrompt: false,
      useDirectSceneAction: false,
    };
  }

  if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
    return {
      action: "direct-read-only",
      openPrompt: false,
      tryDirectReadInPrompt: false,
      useDirectSceneAction: true,
    };
  }

  if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS) {
    return {
      action: "prompt-only",
      openPrompt: true,
      tryDirectReadInPrompt: false,
      useDirectSceneAction: false,
    };
  }

  return {
    action: "prompt-then-direct-read",
    openPrompt: true,
    tryDirectReadInPrompt: true,
    useDirectSceneAction: false,
  };
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
  const plan = _clipboardResolveScenePasteToolPlan();
  if (plan.action === "disabled") return false;
  if (plan.useDirectSceneAction) {
    return _clipboardHandleScenePasteAction();
  }

  const prompt = _clipboardOpenScenePastePrompt();
  if (plan.tryDirectReadInPrompt) {
    void _clipboardTryScenePastePromptDirectRead(prompt);
  }
  return true;
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
  _clipboardResolveScenePasteToolPlan,
  _clipboardHandleScenePasteToolClick,
};
