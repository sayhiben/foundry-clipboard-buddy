const {_clipboardLog} = require("./diagnostics");
const {_clipboardGetMediaKind} = require("./media");
const {
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
} = require("./constants");
const {_clipboardGetChatMediaDisplayMode} = require("./settings");
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

async function _clipboardCreateChatMessage(path) {
  if (!path) {
    throw new Error("Cannot create a chat media message without a usable media path");
  }
  _clipboardLog("info", "Creating chat media message", {
    path,
    mediaKind: _clipboardGetMediaKind({src: path}) || "image",
  });
  return foundry.documents.ChatMessage.create({
    content: _clipboardCreateChatMediaContent(path),
    speaker: foundry.documents.ChatMessage.getSpeaker(),
    user: game.user.id,
  });
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
  _clipboardCreateChatMessage,
  _clipboardPostChatImage,
};
