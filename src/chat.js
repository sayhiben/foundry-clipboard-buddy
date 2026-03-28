const {_clipboardLog} = require("./diagnostics");
const {_clipboardGetMediaKind} = require("./media");
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardUploadBlob,
} = require("./storage");

function _clipboardCreateChatMediaContent(path) {
  const mediaKind = _clipboardGetMediaKind({src: path}) || "image";
  const figure = document.createElement("figure");
  figure.className = "clipboard-image-chat-message";

  if (mediaKind === "video") {
    const video = document.createElement("video");
    video.className = "clipboard-image-chat-thumbnail";
    video.src = path;
    video.controls = true;
    video.loop = true;
    video.preload = "metadata";
    video.playsInline = true;
    figure.append(video);
  } else {
    const previewLink = document.createElement("a");
    previewLink.className = "clipboard-image-chat-link";
    previewLink.href = path;
    previewLink.target = "_blank";
    previewLink.rel = "noopener noreferrer";

    const image = document.createElement("img");
    image.className = "clipboard-image-chat-thumbnail";
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
  const destination = _clipboardGetUploadDestination();
  await _clipboardCreateFolderIfMissing(destination);
  const path = await _clipboardUploadBlob(blob, destination);
  await _clipboardCreateChatMessage(path);
  return true;
}

module.exports = {
  _clipboardCreateChatMediaContent,
  _clipboardCreateChatMessage,
  _clipboardPostChatImage,
};
