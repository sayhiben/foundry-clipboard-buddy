const {_clipboardEscapeHtml, _clipboardLog} = require("./diagnostics");
const {_clipboardGetMediaKind} = require("./media");
const {
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
} = require("./constants");
const {_clipboardGetChatMediaDisplayMode} = require("./settings");
const {_clipboardGetJournalPageUuid} = require("./notes");
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardUploadBlob,
  _clipboardCreateFreshMediaPath,
} = require("./storage");

function _clipboardCreateChatMediaContent(path) {
  const mediaKind = _clipboardGetMediaKind({src: path}) || "image";
  const displayMode = _clipboardGetChatMediaDisplayMode();
  const figure = document.createElement("figure");
  figure.className = "foundry-paste-eater-chat-message";

  const previewClassName = displayMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW
    ? "foundry-paste-eater-chat-full-preview"
    : "foundry-paste-eater-chat-thumbnail";

  if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY && mediaKind === "video") {
    const video = document.createElement("video");
    video.className = previewClassName;
    video.src = path;
    video.controls = true;
    video.loop = true;
    video.preload = "metadata";
    video.playsInline = true;
    figure.append(video);
  } else if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
    const previewLink = document.createElement("a");
    previewLink.className = "foundry-paste-eater-chat-link";
    previewLink.href = path;
    previewLink.target = "_blank";
    previewLink.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.className = previewClassName;
    image.src = path;
    image.alt = "Pasted chat media";
    previewLink.append(image);
    figure.append(previewLink);
  }

  const caption = document.createElement("figcaption");
  const openLink = document.createElement("a");
  openLink.href = path;
  openLink.target = "_blank";
  openLink.rel = "noopener noreferrer";
  openLink.textContent = "Open full media";
  caption.append(openLink);

  figure.append(caption);
  return figure.outerHTML;
}

function _clipboardCreateJournalPageContentLink({entry, page, label = "Open PDF"} = {}) {
  const uuid = _clipboardGetJournalPageUuid(entry, page);
  if (!uuid) return "";

  return [
    '<a class="content-link" draggable="true" data-link=""',
    ` data-uuid="${_clipboardEscapeHtml(uuid)}"`,
    page?.id ? ` data-id="${_clipboardEscapeHtml(page.id)}"` : "",
    ' data-type="JournalEntryPage">',
    '<i class="fas fa-file-pdf" aria-hidden="true"></i>',
    _clipboardEscapeHtml(label),
    "</a>",
  ].join("");
}

function _clipboardCreateChatPdfContent({entry, page, pdfData = {}} = {}) {
  const displayMode = _clipboardGetChatMediaDisplayMode();
  const figure = document.createElement("figure");
  figure.className = "foundry-paste-eater-chat-message foundry-paste-eater-chat-pdf-message";

  if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
    const preview = document.createElement("div");
    preview.className = displayMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW
      ? "foundry-paste-eater-chat-pdf-full-preview"
      : "foundry-paste-eater-chat-pdf-thumbnail";

    if (pdfData.previewSrc) {
      const image = document.createElement("img");
      image.src = pdfData.previewSrc;
      image.alt = `PDF preview: ${pdfData.name || "Pasted PDF"}`;
      preview.append(image);
    } else {
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-file-pdf foundry-paste-eater-chat-pdf-icon";
      icon.setAttribute("aria-hidden", "true");
      preview.append(icon);
    }
    figure.append(preview);
  }

  const caption = document.createElement("figcaption");
  caption.className = "foundry-paste-eater-chat-pdf-caption";

  const title = document.createElement("strong");
  title.textContent = pdfData.name || "Pasted PDF";
  caption.append(title);

  const linkContainer = document.createElement("div");
  linkContainer.innerHTML = _clipboardCreateJournalPageContentLink({
    entry,
    page,
    label: "Open PDF",
  });
  caption.append(linkContainer);

  if (pdfData.external) {
    const source = document.createElement("small");
    source.textContent = "External PDF URL";
    caption.append(source);
  }

  figure.append(caption);
  return figure.outerHTML;
}

function _clipboardGetFoundryGeneration() {
  const version = String(game?.release?.version || game?.version || "");
  const generation = Number.parseInt(version.split(".")[0], 10);
  return Number.isNaN(generation) ? null : generation;
}

function _clipboardGetChatMessageVisibilityOptions() {
  const settings = game?.settings;
  if (typeof settings?.get !== "function") {
    return null;
  }

  const generation = _clipboardGetFoundryGeneration();
  if ((generation || 0) >= 14) {
    const messageMode = settings.get("core", "messageMode");
    if (typeof messageMode === "string" && messageMode.trim()) {
      return {messageMode};
    }

    const legacyRollMode = settings.get("core", "rollMode");
    if (typeof legacyRollMode === "string" && legacyRollMode.trim()) {
      return {rollMode: legacyRollMode};
    }
    return null;
  }

  const rollMode = settings.get("core", "rollMode");
  if (typeof rollMode === "string" && rollMode.trim()) {
    return {rollMode};
  }
  return null;
}

async function _clipboardCreateChatMessage(path) {
  if (!path) {
    throw new Error("Cannot create a chat media message without a usable media path");
  }
  _clipboardLog("info", "Creating chat media message", {
    path,
    mediaKind: _clipboardGetMediaKind({src: path}) || "image",
  });
  const messageData = {
    content: _clipboardCreateChatMediaContent(path),
    speaker: foundry.documents.ChatMessage.getSpeaker(),
    user: game.user.id,
  };
  const visibilityOptions = _clipboardGetChatMessageVisibilityOptions();
  return visibilityOptions
    ? foundry.documents.ChatMessage.create(messageData, visibilityOptions)
    : foundry.documents.ChatMessage.create(messageData);
}

async function _clipboardCreatePdfChatMessage({entry, page, pdfData = {}} = {}) {
  if (!entry || !page) {
    throw new Error("Cannot create a chat PDF message without a journal PDF page");
  }

  _clipboardLog("info", "Creating chat PDF message", {
    entryId: entry.id || null,
    pageId: page.id || null,
    src: pdfData.src || null,
    external: Boolean(pdfData.external),
  });
  const messageData = {
    content: _clipboardCreateChatPdfContent({entry, page, pdfData}),
    speaker: foundry.documents.ChatMessage.getSpeaker(),
    user: game.user.id,
  };
  const visibilityOptions = _clipboardGetChatMessageVisibilityOptions();
  return visibilityOptions
    ? foundry.documents.ChatMessage.create(messageData, visibilityOptions)
    : foundry.documents.ChatMessage.create(messageData);
}

async function _clipboardPostChatImage(blob) {
  const destination = _clipboardGetUploadDestination({
    uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
  });
  await _clipboardCreateFolderIfMissing(destination);
  const path = _clipboardCreateFreshMediaPath(await _clipboardUploadBlob(blob, destination));
  await _clipboardCreateChatMessage(path);
  return true;
}

module.exports = {
  _clipboardCreateChatMediaContent,
  _clipboardCreateJournalPageContentLink,
  _clipboardCreateChatPdfContent,
  _clipboardCreateChatMessage,
  _clipboardCreatePdfChatMessage,
  _clipboardPostChatImage,
};
