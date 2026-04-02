const {
  CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
  CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE,
} = require("../constants");
const {CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS} = require("../state");
const {
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {
  _clipboardExtractImageBlobFromDataTransfer,
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardInsertTextAtTarget,
} = require("../clipboard");
const {
  _clipboardCanUseChatMedia,
  _clipboardCanUseChatUploadButton,
} = require("../settings");
const {
  _clipboardExecutePasteWorkflow,
  _clipboardHandleChatImageInput,
  _clipboardHandleChatUploadAction,
} = require("../workflows");

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

  root.setAttribute(CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
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

module.exports = {
  _clipboardToggleChatDropTarget,
  _clipboardOnChatDragOver,
  _clipboardOnChatDragLeave,
  _clipboardOnChatDrop,
  _clipboardAttachChatUploadButton,
  _clipboardBindChatRoot,
  _clipboardOnRenderChatInput,
  _clipboardHandleChatImageInputWithTextFallback,
};
