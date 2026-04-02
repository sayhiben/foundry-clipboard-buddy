const {
  CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
} = require("../constants");
const {_clipboardDescribeFile, _clipboardLog} = require("../diagnostics");
const {
  _clipboardReadClipboardItems,
  _clipboardExtractImageInput,
  _clipboardExtractTextInput,
} = require("../clipboard");
const {
  _clipboardCanUseScenePasteTool,
  _clipboardCanUseSceneUploadTool,
} = require("../settings");
const {
  _clipboardHandleImageInput,
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleImageBlob,
} = require("./canvas-media");
const {_clipboardHandleTextInput} = require("./text-workflows");
const {_clipboardExecutePasteWorkflow} = require("./workflow-runner");

async function _clipboardReadAndPasteImage(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No clipboard media was available.");
    return false;
  }

  const imageInput = await _clipboardExtractImageInput(clipItems);
  if (!imageInput) {
    if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No supported media or media URL was found in the clipboard.");
    return false;
  }

  if (options.handleImageInput) return options.handleImageInput(imageInput);
  if (options.handleImageBlob) {
    const blob = await require("../storage")._clipboardResolveImageInputBlob(imageInput);
    if (!blob) return false;
    return options.handleImageBlob(blob);
  }

  return _clipboardHandleImageInput(imageInput, options);
}

async function _clipboardReadAndPasteClipboardContent(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoContent) ui.notifications.warn("Foundry Paste Eater: No clipboard data was available.");
    return false;
  }

  const mediaInput = await _clipboardExtractImageInput(clipItems);
  if (mediaInput) {
    if (options.handleImageInput) return options.handleImageInput(mediaInput);
    return _clipboardHandleImageInputWithTextFallback(mediaInput, options);
  }

  const textInput = await _clipboardExtractTextInput(clipItems);
  if (textInput) {
    if (options.handleTextInput) return options.handleTextInput(textInput);
    return _clipboardHandleTextInput(textInput, options);
  }

  if (options.notifyNoContent) {
    ui.notifications.warn("Foundry Paste Eater: No supported media or text was found in the clipboard.");
  }
  return false;
}

function _clipboardChooseImageFile() {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT;
    input.style.display = "none";

    const cleanup = () => {
      input.removeEventListener("change", onChange);
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
    };

    const onChange = () => {
      const [file] = Array.from(input.files || []);
      cleanup();
      resolve(file || null);
    };

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (input.files?.length) return;
        cleanup();
        resolve(null);
      }, 0);
    };

    input.addEventListener("change", onChange, {once: true});
    window.addEventListener("focus", onWindowFocus, {once: true});
    document.body.appendChild(input);
    input.click();
  });
}

async function _clipboardChooseAndHandleMediaFile({emptyMessage, selectedMessage, handler}) {
  const file = await _clipboardChooseImageFile();
  if (!file) {
    _clipboardLog("info", emptyMessage);
    return false;
  }

  _clipboardLog("info", selectedMessage, _clipboardDescribeFile(file));
  return handler(file);
}

async function _clipboardOpenUploadPicker() {
  return _clipboardChooseAndHandleMediaFile({
    emptyMessage: "Upload picker closed without selecting a file.",
    selectedMessage: "Selected a media file from the upload picker",
    handler: file => _clipboardHandleImageBlob(file, {
      contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
    }),
  });
}

async function _clipboardOpenChatUploadPicker() {
  return _clipboardChooseAndHandleMediaFile({
    emptyMessage: "Chat upload picker closed without selecting a file.",
    selectedMessage: "Selected a media file from the chat upload picker",
    handler: file => require("./chat-media")._clipboardHandleChatImageBlob(file),
  });
}

function _clipboardHandleScenePasteAction() {
  if (!_clipboardCanUseScenePasteTool()) return false;
  if (!navigator.clipboard?.read) {
    ui.notifications.warn("Foundry Paste Eater: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
    return false;
  }

  _clipboardLog("info", "Invoked scene Paste Media action.", {
    activeLayer: canvas?.activeLayer?.options?.name || null,
  });
  void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteImage({
    notifyNoImage: true,
    contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  }), {
    respectCopiedObjects: false,
  });
  return true;
}

function _clipboardHandleSceneUploadAction() {
  if (!_clipboardCanUseSceneUploadTool()) return false;
  _clipboardLog("info", "Invoked scene Upload Media action.", {
    activeLayer: canvas?.activeLayer?.options?.name || null,
  });
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
    respectCopiedObjects: false,
  });
  return true;
}

module.exports = {
  _clipboardReadAndPasteImage,
  _clipboardReadAndPasteClipboardContent,
  _clipboardChooseImageFile,
  _clipboardChooseAndHandleMediaFile,
  _clipboardOpenUploadPicker,
  _clipboardOpenChatUploadPicker,
  _clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction,
};
