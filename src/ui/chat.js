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
  _clipboardExtractPdfBlobFromDataTransfer,
  _clipboardExtractPdfInputFromDataTransfer,
  _clipboardInsertTextAtTarget,
} = require("../clipboard");
const {
  _clipboardCanUseChatMedia,
  _clipboardCanUseChatUploadButton,
} = require("../settings");
const {
  _clipboardExecutePasteWorkflow,
  _clipboardDescribePdfInput,
  _clipboardHandleChatImageInput,
  _clipboardHandleChatPdfInput,
  _clipboardHandleChatUploadAction,
} = require("../workflows");

function _clipboardToggleChatDropTarget(root, active) {
  root.classList.toggle("foundry-paste-eater-chat-drop-target", active);
}

function _clipboardGetChatOwnerDocument(root) {
  return root?.ownerDocument || document;
}

function _clipboardGetChatControls(root, ownerDocument = _clipboardGetChatOwnerDocument(root)) {
  if (root?.id === "chat-controls") return root;

  return root?.querySelector?.("#chat-controls")
    || root?.closest?.("#chat-controls")
    || ownerDocument.getElementById?.("chat-controls")
    || null;
}

function _clipboardGetChatRoots(element) {
  if (!(element instanceof HTMLElement)) return [];

  const ownerDocument = _clipboardGetChatOwnerDocument(element);
  const roots = new Set([element]);
  const form = element.matches("form") ? element : (element.querySelector("form") || element.closest("form"));
  const chatControls = _clipboardGetChatControls(element, ownerDocument);
  const chatMessage = ownerDocument.getElementById?.("chat-message");
  const messageModes = ownerDocument.getElementById?.("message-modes");

  if (form instanceof HTMLElement) roots.add(form);
  if (chatControls instanceof HTMLElement) roots.add(chatControls);
  if (chatMessage instanceof HTMLElement) roots.add(chatMessage);
  if (messageModes instanceof HTMLElement) roots.add(messageModes);

  return Array.from(roots);
}

function _clipboardOnChatDragOver(event) {
  if (!_clipboardCanUseChatMedia()) return;
  const root = event.currentTarget;
  const blob = _clipboardExtractPdfBlobFromDataTransfer(event.dataTransfer) ||
    _clipboardExtractImageBlobFromDataTransfer(event.dataTransfer);
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

  const pdfInput = _clipboardExtractPdfInputFromDataTransfer(event.dataTransfer);
  if (pdfInput) {
    _clipboardLog("info", "Handling dropped PDF in chat.", {
      pdfInput: _clipboardDescribePdfInput(pdfInput),
      dataTransfer: _clipboardDescribeDataTransfer(event.dataTransfer),
    });
    event.preventDefault();
    event.stopPropagation();
    void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatPdfInput(pdfInput), {
      respectCopiedObjects: false,
    });
    return;
  }

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
  const ownerDocument = _clipboardGetChatOwnerDocument(root);
  const chatControls = _clipboardGetChatControls(root, ownerDocument);
  const form = root.matches("form") ? root : (root.querySelector("form") || root.closest("form"));
  const mountRoot = chatControls || form || root;
  const existingButtons = Array.from(mountRoot?.querySelectorAll?.(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`) || []);
  if (!_clipboardCanUseChatUploadButton()) {
    for (const button of ownerDocument.querySelectorAll(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`)) {
      button.remove();
    }
    const temporaryContainers = Array.from(ownerDocument.querySelectorAll(".foundry-paste-eater-chat-buttons"));
    for (const container of temporaryContainers) {
      if (!container.childElementCount) container.remove();
    }
    return;
  }

  if (existingButtons.length) return;

  let mount = mountRoot;
  if (chatControls) {
    mount = chatControls.querySelector(".foundry-paste-eater-chat-buttons, .control-buttons:not([hidden])");
    if (!mount) {
      mount = ownerDocument.createElement("div");
      mount.className = "control-buttons foundry-paste-eater-chat-buttons";
      chatControls.append(mount);
    }
  }

  const button = ownerDocument.createElement("button");
  button.type = "button";
  button.className = "ui-control icon fa-solid fa-file-arrow-up foundry-paste-eater-chat-upload";
  button.dataset.action = CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION;
  button.dataset.tooltip = "";
  button.title = "Upload Chat Media or PDF";
  button.ariaLabel = "Upload Chat Media or PDF";
  button.addEventListener("click", () => _clipboardHandleChatUploadAction());
  mount.append(button);
}

function _clipboardAttachChatUploadButton(root) {
  _clipboardSyncChatUploadButton(root);
}

function _clipboardBindChatRoot(root) {
  if (!root) return;

  require("./paste-events")._clipboardBindEventDocument(_clipboardGetChatOwnerDocument(root));
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
    for (const root of _clipboardGetChatRoots(element)) {
      _clipboardBindChatRoot(root);
    }
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
