const CLIPBOARD_IMAGE_MODULE_ID = "clipboard-image"
const CLIPBOARD_IMAGE_DEFAULT_FOLDER = "pasted_images"
const CLIPBOARD_IMAGE_SOURCE_AUTO = "auto"
const CLIPBOARD_IMAGE_SOURCE_DATA = "data"
const CLIPBOARD_IMAGE_SOURCE_S3 = "s3"
const CLIPBOARD_IMAGE_SOURCE_FORGE = "forgevtt"
const CLIPBOARD_IMAGE_FILE_PICKER = foundry.applications.apps.FilePicker.implementation
const CLIPBOARD_IMAGE_KEYBOARD_MANAGER = foundry.helpers.interaction.KeyboardManager
const CLIPBOARD_IMAGE_FORM_APPLICATION = foundry.appv1.api.FormApplication
const CLIPBOARD_IMAGE_SCENE_CONTROLS = ["tiles", "tokens"]
const CLIPBOARD_IMAGE_TOOL_PASTE = "clipboard-image-paste"
const CLIPBOARD_IMAGE_TOOL_UPLOAD = "clipboard-image-upload"
const CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE = "data-clipboard-image-chat-root"
const CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION = "clipboard-image-chat-upload"
const CLIPBOARD_IMAGE_TEXT_NOTE_FLAG = "textNote"
const CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME = "Notes"
const CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX = "Pasted Note"
const CLIPBOARD_IMAGE_IMAGE_EXTENSIONS = new Set(["apng", "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"])
const CLIPBOARD_IMAGE_VIDEO_EXTENSIONS = new Set(["m4v", "mp4", "mpeg", "mpg", "ogg", "ogv", "webm"])
const CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS = new WeakSet()

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;

function _clipboardUsingTheForge() {
  return typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge;
}

function _clipboardGetStoredSource() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source")?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
}

function _clipboardResolveSource(source) {
  if (!source || source === CLIPBOARD_IMAGE_SOURCE_AUTO) {
    return _clipboardUsingTheForge() ? CLIPBOARD_IMAGE_SOURCE_FORGE : CLIPBOARD_IMAGE_SOURCE_DATA;
  }

  if (source === CLIPBOARD_IMAGE_SOURCE_FORGE && !_clipboardUsingTheForge()) {
    return CLIPBOARD_IMAGE_SOURCE_DATA;
  }

  return source;
}

function _clipboardGetSourceLabel(source) {
  switch (source) {
    case CLIPBOARD_IMAGE_SOURCE_AUTO:
      return "Automatic";
    case CLIPBOARD_IMAGE_SOURCE_DATA:
      return "User Data";
    case CLIPBOARD_IMAGE_SOURCE_S3:
      return "Amazon S3";
    case CLIPBOARD_IMAGE_SOURCE_FORGE:
      return "The Forge";
    default:
      return source;
  }
}

function _clipboardGetSourceChoices(currentSource = _clipboardGetStoredSource()) {
  const choices = {
    [CLIPBOARD_IMAGE_SOURCE_AUTO]: `Automatic (${_clipboardGetSourceLabel(_clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO))})`,
    [CLIPBOARD_IMAGE_SOURCE_DATA]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_DATA),
    [CLIPBOARD_IMAGE_SOURCE_S3]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_S3),
  };

  if (_clipboardUsingTheForge()) {
    choices[CLIPBOARD_IMAGE_SOURCE_FORGE] = _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_FORGE);
  }

  if (currentSource && !Object.hasOwn(choices, currentSource)) {
    choices[currentSource] = `Custom (${currentSource})`;
  }

  return choices;
}

function _clipboardCanSelectSource(source) {
  return source !== "public";
}

async function _clipboardCreateFolderIfMissing(destination) {
  const options = _clipboardGetFilePickerOptions(destination);
  _clipboardAssertUploadDestination(destination);
  try {
    await CLIPBOARD_IMAGE_FILE_PICKER.browse(destination.source, destination.target, options);
  } catch (error) {
    await CLIPBOARD_IMAGE_FILE_PICKER.createDirectory(destination.source, destination.target, options);
  }
}

function _clipboardGetStoredBucket() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket")?.trim() || "";
}

function _clipboardGetTargetFolder() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location")?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
}

function _clipboardGetUploadDestination(overrides = {}) {
  const storedSource = overrides.storedSource ?? overrides.source ?? _clipboardGetStoredSource();
  const resolvedSource = _clipboardResolveSource(storedSource);
  const target = Object.hasOwn(overrides, "target")
    ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER
    : _clipboardGetTargetFolder();
  const bucket = resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3
    ? (Object.hasOwn(overrides, "bucket") ? overrides.bucket?.trim() || "" : _clipboardGetStoredBucket())
    : "";

  return {
    storedSource,
    source: resolvedSource,
    target,
    bucket,
  };
}

function _clipboardGetFilePickerOptions(destination) {
  const options = {};
  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && destination.bucket) {
    options.bucket = destination.bucket;
  }
  return options;
}

function _clipboardDescribeDestination(destination) {
  if (destination.storedSource === CLIPBOARD_IMAGE_SOURCE_AUTO) {
    return `${_clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_AUTO)} (${_clipboardGetSourceLabel(destination.source)}) / ${destination.target}`;
  }

  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
    const bucket = destination.bucket || "(select a bucket)";
    return `${_clipboardGetSourceLabel(destination.source)} / ${bucket} / ${destination.target}`;
  }

  return `${_clipboardGetSourceLabel(destination.source)} / ${destination.target}`;
}

function _clipboardNormalizeMimeType(value) {
  return value?.split(";").shift()?.trim()?.toLowerCase() || "";
}

function _clipboardGetFilenameExtension(filename) {
  return filename?.split(/[?#]/).shift()?.split(".").pop()?.trim()?.toLowerCase() || "";
}

function _clipboardGetFileExtension(blob) {
  if (blob instanceof File && blob.name.includes(".")) {
    return blob.name.split(".").pop().toLowerCase();
  }

  const mimeType = _clipboardNormalizeMimeType(blob.type).split("/").pop()?.toLowerCase() || "png";
  return mimeType
    .replace("jpeg", "jpg")
    .replace("svg+xml", "svg")
    .replace("x-icon", "ico")
    .split("+")[0];
}

function _clipboardGetFilenameFromUrl(url) {
  const parsedUrl = _clipboardParseSupportedUrl(url);
  if (!parsedUrl) return "";

  const urlObject = new URL(parsedUrl);
  if (!["http:", "https:"].includes(urlObject.protocol)) return "";

  let filename = urlObject.pathname.split("/").pop() || "";
  try {
    filename = decodeURIComponent(filename);
  } catch (error) {
    // Keep the raw path segment if decoding fails.
  }

  return filename === "/" ? "" : filename;
}

function _clipboardLooksLikeImageFilename(filename) {
  return CLIPBOARD_IMAGE_IMAGE_EXTENSIONS.has(_clipboardGetFilenameExtension(filename));
}

function _clipboardLooksLikeVideoFilename(filename) {
  const extension = _clipboardGetFilenameExtension(filename);
  if (!extension) return false;

  const foundryVideoHelper = globalThis.foundry?.helpers?.media?.VideoHelper;
  if (foundryVideoHelper?.hasVideoExtension?.(filename)) return true;
  return CLIPBOARD_IMAGE_VIDEO_EXTENSIONS.has(extension);
}

function _clipboardIsImageMimeType(mimeType) {
  return _clipboardNormalizeMimeType(mimeType).startsWith("image/");
}

function _clipboardIsVideoMimeType(mimeType) {
  return _clipboardNormalizeMimeType(mimeType).startsWith("video/");
}

function _clipboardIsMediaMimeType(mimeType) {
  return _clipboardIsImageMimeType(mimeType) || _clipboardIsVideoMimeType(mimeType);
}

function _clipboardGetMediaKind({blob, filename, mimeType, src} = {}) {
  const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
  if (_clipboardIsVideoMimeType(normalizedMimeType)) return "video";
  if (_clipboardIsImageMimeType(normalizedMimeType)) return "image";

  const candidate = filename || (src ? (_clipboardGetFilenameFromUrl(src) || src) : "");
  if (_clipboardLooksLikeVideoFilename(candidate)) return "video";
  if (_clipboardLooksLikeImageFilename(candidate)) return "image";
  return null;
}

function _clipboardIsSupportedMediaBlob(blob) {
  return Boolean(blob && _clipboardGetMediaKind({blob, filename: blob.name}));
}

function _clipboardGetMimeTypeFromFilename(filename) {
  switch (_clipboardGetFilenameExtension(filename)) {
    case "apng":
      return "image/apng";
    case "avif":
      return "image/avif";
    case "bmp":
      return "image/bmp";
    case "gif":
      return "image/gif";
    case "ico":
      return "image/x-icon";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "m4v":
    case "mp4":
      return "video/mp4";
    case "mpeg":
    case "mpg":
      return "video/mpeg";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "webm":
      return "video/webm";
    default:
      return "image/png";
  }
}

function _clipboardEnsureFilenameExtension(filename, blob) {
  const resolvedExtension = _clipboardGetFileExtension(blob);
  const currentExtension = _clipboardGetFilenameExtension(filename);
  if (currentExtension === resolvedExtension && filename) return filename;

  const baseName = filename?.replace(/\.[^./]+$/, "") || `pasted_image_${Date.now()}`;
  return `${baseName}.${resolvedExtension}`;
}

function _clipboardGetTileVideoData(mediaKind) {
  if (mediaKind !== "video") return undefined;

  // Autoplay looping videos but keep them muted by default to avoid noisy scene pastes.
  return {
    autoplay: true,
    loop: true,
    volume: 0,
  };
}

function _clipboardNormalizePastedText(text) {
  const normalized = text?.replace(/\r\n?/g, "\n") || "";
  if (!normalized.trim()) return "";
  return normalized.trimEnd();
}

function _clipboardEscapeHtml(text) {
  return foundry.utils.escapeHTML(text || "");
}

function _clipboardConvertTextToHtml(text) {
  const paragraphs = _clipboardNormalizePastedText(text)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.split("\n").map(_clipboardEscapeHtml).join("<br>"))
    .filter(Boolean);

  return paragraphs.map(paragraph => `<p>${paragraph}</p>`).join("");
}

function _clipboardGetTextPreview(text, maxLength = 48) {
  const normalized = _clipboardNormalizePastedText(text);
  if (!normalized) return CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX;

  const firstLine = normalized.split("\n").find(line => line.trim()) || normalized;
  if (firstLine.length <= maxLength) return firstLine;
  return `${firstLine.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

function _clipboardGetTextPageFormat() {
  return CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
}

function _clipboardGetDefaultNoteIcon() {
  return CONFIG?.JournalEntry?.noteIcons?.Book || Object.values(CONFIG?.JournalEntry?.noteIcons || {})[0] || "icons/svg/book.svg";
}

function _clipboardGetDocumentCenter(document) {
  const center = document?.object?.center;
  if (center) {
    return {
      x: center.x,
      y: center.y,
    };
  }

  if (document?.documentName === "Tile") {
    return {
      x: document.x + (document.width / 2),
      y: document.y + (document.height / 2),
    };
  }

  const gridSizeX = canvas?.grid?.sizeX || canvas?.dimensions?.size || 100;
  const gridSizeY = canvas?.grid?.sizeY || canvas?.dimensions?.size || 100;
  return {
    x: document.x + (((document.width || 1) * gridSizeX) / 2),
    y: document.y + (((document.height || 1) * gridSizeY) / 2),
  };
}

function _clipboardGetAssociatedNotePosition(document, fallbackPosition = null) {
  if (document) return _clipboardGetDocumentCenter(document);
  return fallbackPosition;
}

function _clipboardCreateTextPageData(text, name = CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME) {
  return {
    name,
    type: "text",
    title: {
      show: true,
      level: 1,
    },
    text: {
      content: _clipboardConvertTextToHtml(text),
      format: _clipboardGetTextPageFormat(),
    },
  };
}

function _clipboardAppendHtmlContent(existingContent, newContent) {
  if (!existingContent?.trim()) return newContent;
  if (!newContent?.trim()) return existingContent;
  return `${existingContent}<hr>${newContent}`;
}

function _clipboardCreateSceneNoteData({entryId, pageId, position, text}) {
  return {
    entryId,
    pageId,
    text,
    x: position.x,
    y: position.y,
    texture: {
      src: _clipboardGetDefaultNoteIcon(),
    },
  };
}

function _clipboardCreateUploadFile(blob) {
  if (blob instanceof File && blob.name) return blob;

  const extension = _clipboardGetFileExtension(blob);
  const filename = `pasted_image_${Date.now()}.${extension}`;
  return new File([blob], filename, {type: blob.type});
}

function _clipboardAssertUploadDestination(destination) {
  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && !destination.bucket) {
    throw new Error("Amazon S3 destinations require a bucket selection");
  }
}

function _clipboardHasCopiedObjects() {
  const layer = canvas?.activeLayer;
  return Boolean(layer?.clipboard?.objects?.length);
}

function _clipboardGetMousePosition() {
  if (!canvas?.mousePosition) return null;
  return {
    x: canvas.mousePosition.x,
    y: canvas.mousePosition.y,
  };
}

function _clipboardGetCanvasCenter() {
  return {
    x: canvas.dimensions.width / 2,
    y: canvas.dimensions.height / 2,
  };
}

function _clipboardScaleTileDimensions(imgWidth, imgHeight, sceneDimensions) {
  const scaledDimensions = {width: imgWidth, height: imgHeight};
  if (imgHeight > sceneDimensions.sceneHeight || imgWidth > sceneDimensions.sceneWidth) {
    scaledDimensions.width = sceneDimensions.sceneWidth / 3;
    scaledDimensions.height = scaledDimensions.width * imgHeight / imgWidth;
  }
  return scaledDimensions;
}

function _clipboardRoundDimension(value) {
  return Math.round(value * 100) / 100;
}

function _clipboardScaleTokenDimensions(imgWidth, imgHeight) {
  if (!imgWidth || !imgHeight) return {width: 1, height: 1};

  if (imgWidth >= imgHeight) {
    return {
      width: _clipboardRoundDimension(imgWidth / imgHeight),
      height: 1,
    };
  }

  return {
    width: 1,
    height: _clipboardRoundDimension(imgHeight / imgWidth),
  };
}

function _clipboardGetTokenPosition(mousePos) {
  return canvas?.grid?.getTopLeftPoint?.(mousePos) || mousePos;
}

const CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES = {
  Token: {
    documentName: "Token",
    getControlledDocuments: () => (canvas?.tokens?.controlled || []).map(token => token.document),
    getLayer: () => canvas?.tokens,
    createData: ({path, imgWidth, imgHeight, mousePos}) => {
      const snappedPosition = _clipboardGetTokenPosition(mousePos);
      const dimensions = _clipboardScaleTokenDimensions(imgWidth, imgHeight);

      return [{
        actorId: null,
        name: "Pasted Media",
        texture: {
          src: path,
        },
        width: dimensions.width,
        height: dimensions.height,
        x: snappedPosition.x,
        y: snappedPosition.y,
        hidden: CLIPBOARD_HIDDEN_MODE,
        locked: false,
      }];
    },
  },
  Tile: {
    documentName: "Tile",
    getControlledDocuments: () => (canvas?.tiles?.controlled || []).map(tile => tile.document),
    getLayer: () => canvas?.tiles,
    createData: ({path, imgWidth, imgHeight, mousePos, mediaKind}) => {
      const dimensions = _clipboardScaleTileDimensions(imgWidth, imgHeight, canvas.dimensions);

      const createData = {
        texture: {
          src: path,
        },
        width: dimensions.width,
        height: dimensions.height,
        x: mousePos.x,
        y: mousePos.y,
        sort: 0,
        rotation: 0,
        hidden: CLIPBOARD_HIDDEN_MODE,
        locked: false,
      };

      const video = _clipboardGetTileVideoData(mediaKind);
      if (video) createData.video = video;

      return [createData];
    },
  },
};

// Replacement checks the active layer first, then the other supported placeable type.
const CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
  Token: ["Token", "Tile"],
  Tile: ["Tile", "Token"],
};

function _clipboardGetActiveDocumentName() {
  return canvas?.activeLayer === canvas?.tokens ? "Token" : "Tile";
}

function _clipboardGetPlaceableStrategy(documentName = _clipboardGetActiveDocumentName()) {
  return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
}

function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
  for (const documentName of CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName]) {
    const strategy = _clipboardGetPlaceableStrategy(documentName);
    const documents = strategy.getControlledDocuments();
    if (!documents.length) continue;

    return {
      documentName: strategy.documentName,
      documents,
    };
  }

  return null;
}

function _clipboardResolvePasteContext({fallbackToCenter = false, requireCanvasFocus = true} = {}) {
  const activeDocumentName = _clipboardGetActiveDocumentName();
  const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);

  return {
    mousePos,
    createStrategy: _clipboardGetPlaceableStrategy(activeDocumentName),
    replacementTarget: _clipboardGetReplacementTarget(activeDocumentName),
    requireCanvasFocus,
  };
}

function _clipboardHasCanvasFocus() {
  const gameElement = document.querySelector(".game");
  return !gameElement || document.activeElement === gameElement;
}

function _clipboardIsMouseWithinCanvas(mousePos) {
  return Boolean(
    mousePos &&
    mousePos.x >= 0 &&
    mousePos.y >= 0 &&
    mousePos.x <= canvas.dimensions.width &&
    mousePos.y <= canvas.dimensions.height
  );
}

function _clipboardCanPasteToContext(context) {
  if (context.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
  if (context.replacementTarget) return true;
  return _clipboardIsMouseWithinCanvas(context.mousePos);
}

function _clipboardPrepareCreateLayer(context) {
  if (!context.replacementTarget) {
    context.createStrategy.getLayer()?.activate?.();
  }
}

async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind) {
  if (!replacementTarget) return false;

  const updates = replacementTarget.documents.map(document => {
    const update = {
      _id: document.id,
      "texture.src": path,
    };

    if (replacementTarget.documentName === "Tile" && mediaKind === "video") {
      update.video = _clipboardGetTileVideoData(mediaKind);
    }

    return update;
  });
  await canvas.scene.updateEmbeddedDocuments(replacementTarget.documentName, updates);
  return true;
}

async function _clipboardLoadImageDimensions(path) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Failed to determine pasted media size"));
    image.src = path;
  });

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch (error) {
      // Some browsers reject decode after a successful load. The image dimensions are still usable.
    }
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  image.src = "";
  if (!width || !height) {
    throw new Error("Failed to determine pasted media size");
  }

  return {width, height};
}

async function _clipboardLoadVideoDimensions(path) {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("Failed to determine pasted media size"));
    video.src = path;
  });

  const width = video.videoWidth;
  const height = video.videoHeight;
  video.pause();
  video.removeAttribute("src");
  video.load();
  if (!width || !height) {
    throw new Error("Failed to determine pasted media size");
  }

  return {width, height};
}

async function _clipboardLoadMediaDimensions(path) {
  return _clipboardGetMediaKind({src: path}) === "video"
    ? _clipboardLoadVideoDimensions(path)
    : _clipboardLoadImageDimensions(path);
}

async function _clipboardReadClipboardItems() {
  let clipItems;
  try {
    clipItems = await navigator.clipboard.read();
  } catch (error) {
    if (!error) {
      console.warn("Clipboard Image: Failed to parse clipboard. Make sure your browser supports navigator.clipboard.");
      return null;
    }

    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        console.info("Clipboard Image: Clipboard access was blocked or dismissed.");
        return null;
      }
      if (error.name === "NotFoundError") {
        console.info("Clipboard Image: Clipboard is empty.");
        return null;
      }
    }

    throw error;
  }
  return clipItems;
}

async function _clipboardExtractImageBlob(clipItems) {
  for (const clipItem of clipItems || []) {
    for (const fileType of clipItem.types) {
      if (_clipboardGetMediaKind({mimeType: fileType})) {
        return clipItem.getType(fileType);
      }
    }
  }

  return null;
}

async function _clipboardReadClipboardText(clipItems, mimeType) {
  for (const clipItem of clipItems || []) {
    if (!clipItem.types.includes(mimeType)) continue;

    const textBlob = await clipItem.getType(mimeType);
    const text = await textBlob.text();
    if (text?.trim()) return text;
  }

  return "";
}

async function _clipboardExtractTextInput(clipItems) {
  const plainText = _clipboardNormalizePastedText(await _clipboardReadClipboardText(clipItems, "text/plain"));
  if (plainText) return {text: plainText};

  const html = await _clipboardReadClipboardText(clipItems, "text/html");
  if (!html?.trim()) return null;

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const extractedText = _clipboardNormalizePastedText(documentFragment.body?.textContent || "");
  return extractedText ? {text: extractedText} : null;
}

function _clipboardParseSupportedUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) return null;
    return url.href;
  } catch (error) {
    return null;
  }
}

function _clipboardExtractImageUrlFromUriList(text) {
  for (const line of (text || "").split(/\r?\n/)) {
    const candidate = line.trim();
    if (!candidate || candidate.startsWith("#")) continue;

    const url = _clipboardParseSupportedUrl(candidate);
    if (url) return url;
  }

  return null;
}

function _clipboardExtractImageUrlFromText(text) {
  const candidate = text?.trim();
  if (!candidate || /\s/.test(candidate)) return null;
  return _clipboardParseSupportedUrl(candidate);
}

function _clipboardExtractImageUrlFromHtml(html) {
  if (!html?.trim()) return null;

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const mediaElement = documentFragment.querySelector("img[src], video[src], source[src]");
  return _clipboardParseSupportedUrl(mediaElement?.getAttribute("src")?.trim());
}

async function _clipboardExtractImageInput(clipItems) {
  const blob = await _clipboardExtractImageBlob(clipItems);
  if (blob) return {blob};

  const uriList = await _clipboardReadClipboardText(clipItems, "text/uri-list");
  const uriListUrl = _clipboardExtractImageUrlFromUriList(uriList);
  if (uriListUrl) return {url: uriListUrl};

  const html = await _clipboardReadClipboardText(clipItems, "text/html");
  const htmlUrl = _clipboardExtractImageUrlFromHtml(html);
  if (htmlUrl) return {url: htmlUrl};

  const plainText = await _clipboardReadClipboardText(clipItems, "text/plain");
  const textUrl = _clipboardExtractImageUrlFromText(plainText);
  if (textUrl) return {url: textUrl};

  return null;
}

function _clipboardExtractImageBlobFromDataTransfer(dataTransfer) {
  for (const item of dataTransfer?.items || []) {
    if (item.kind !== "file") continue;

    const file = item.getAsFile();
    if (_clipboardIsSupportedMediaBlob(file)) {
      return file;
    }
  }

  for (const file of dataTransfer?.files || []) {
    if (_clipboardIsSupportedMediaBlob(file)) return file;
  }

  return null;
}

function _clipboardReadDataTransferText(dataTransfer, mimeType) {
  return dataTransfer?.getData?.(mimeType) || "";
}

function _clipboardExtractTextInputFromDataTransfer(dataTransfer) {
  const plainText = _clipboardNormalizePastedText(_clipboardReadDataTransferText(dataTransfer, "text/plain"));
  if (plainText) return {text: plainText};

  const html = _clipboardReadDataTransferText(dataTransfer, "text/html");
  if (!html?.trim()) return null;

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const extractedText = _clipboardNormalizePastedText(documentFragment.body?.textContent || "");
  return extractedText ? {text: extractedText} : null;
}

function _clipboardExtractImageInputFromDataTransfer(dataTransfer) {
  const blob = _clipboardExtractImageBlobFromDataTransfer(dataTransfer);
  if (blob) return {blob};

  const plainText = _clipboardReadDataTransferText(dataTransfer, "text/plain").trim();
  const uriListUrl = _clipboardExtractImageUrlFromUriList(_clipboardReadDataTransferText(dataTransfer, "text/uri-list"));
  if (uriListUrl) return {url: uriListUrl, text: plainText || uriListUrl};

  const htmlUrl = _clipboardExtractImageUrlFromHtml(_clipboardReadDataTransferText(dataTransfer, "text/html"));
  if (htmlUrl) return {url: htmlUrl, text: plainText || htmlUrl};

  const textUrl = _clipboardExtractImageUrlFromText(plainText);
  if (textUrl) return {url: textUrl, text: plainText};

  return null;
}

function _clipboardGetChatRootFromTarget(target) {
  return target?.closest?.(`[${CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE}="true"]`) || null;
}

function _clipboardIsEditableTarget(target) {
  return Boolean(
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable ||
    target?.closest?.('[contenteditable="true"]')
  );
}

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
  return foundry.documents.ChatMessage.create({
    content: _clipboardCreateChatMediaContent(path),
    speaker: foundry.documents.ChatMessage.getSpeaker(),
    user: game.user.id,
  });
}

async function _clipboardCreateTextJournalEntry(text, name) {
  const journalEntry = await foundry.documents.JournalEntry.create({
    name: name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`,
    pages: [_clipboardCreateTextPageData(text, _clipboardGetTextPreview(text))],
  });

  return {
    entry: journalEntry,
    page: journalEntry?.pages?.contents?.[0] || null,
  };
}

async function _clipboardAppendTextToPage(page, text) {
  if (!page || page.type !== "text") {
    throw new Error("Cannot append pasted text to a non-text journal page");
  }

  const updatedContent = _clipboardAppendHtmlContent(page.text?.content || "", _clipboardConvertTextToHtml(text));
  await page.update({
    "text.content": updatedContent,
    "text.format": _clipboardGetTextPageFormat(),
  });
  return page;
}

function _clipboardGetAssociatedTextNoteData(document) {
  return document?.getFlag?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG) || null;
}

async function _clipboardEnsureAssociatedTextPage(document, text) {
  const noteData = _clipboardGetAssociatedTextNoteData(document);
  const existingEntry = noteData?.entryId ? game.journal?.get?.(noteData.entryId) : null;
  const existingPage = noteData?.pageId ? existingEntry?.pages?.get?.(noteData.pageId) : null;
  if (existingPage?.type === "text") {
    await _clipboardAppendTextToPage(existingPage, text);
    return {
      entry: existingEntry,
      page: existingPage,
      noteId: noteData?.noteId || null,
    };
  }

  const journalName = `${document.name || document.documentName} Notes`;
  if (existingEntry) {
    const createdPages = await existingEntry.createEmbeddedDocuments("JournalEntryPage", [
      _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME),
    ]);
    return {
      entry: existingEntry,
      page: createdPages[0],
      noteId: noteData?.noteId || null,
    };
  }

  return {
    ...(await _clipboardCreateTextJournalEntry(text, journalName)),
    noteId: null,
  };
}

async function _clipboardEnsurePlaceableTextNote(document, text, fallbackPosition = null) {
  const position = _clipboardGetAssociatedNotePosition(document, fallbackPosition);
  const label = `${document.name || document.documentName} Notes`;
  const {entry, page, noteId} = await _clipboardEnsureAssociatedTextPage(document, text);
  if (!entry || !page || !position) {
    throw new Error("Failed to create or update a note journal for the selected placeable");
  }

  const existingNote = noteId ? canvas.scene?.notes?.get?.(noteId) : null;
  let note = existingNote;
  if (existingNote) {
    await existingNote.update({
      x: position.x,
      y: position.y,
      text: label,
      entryId: entry.id,
      pageId: page.id,
    });
  } else {
    const createdNotes = await canvas.scene.createEmbeddedDocuments("Note", [
      _clipboardCreateSceneNoteData({
        entryId: entry.id,
        pageId: page.id,
        position,
        text: label,
      }),
    ]);
    note = createdNotes[0];
  }

  await document.setFlag(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG, {
    entryId: entry.id,
    pageId: page.id,
    noteId: note?.id || null,
  });
  return true;
}

async function _clipboardCreateStandaloneTextNote(text, context) {
  const position = context.mousePos;
  if (!position) return false;

  canvas?.notes?.activate?.();
  const preview = _clipboardGetTextPreview(text);
  const {entry, page} = await _clipboardCreateTextJournalEntry(text, `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${preview}`);
  await canvas.scene.createEmbeddedDocuments("Note", [
    _clipboardCreateSceneNoteData({
      entryId: entry.id,
      pageId: page.id,
      position,
      text: preview,
    }),
  ]);
  return true;
}

async function _clipboardUploadBlob(blob, targetFolder) {
  _clipboardAssertUploadDestination(targetFolder);
  const file = _clipboardCreateUploadFile(blob);

  return (await CLIPBOARD_IMAGE_FILE_PICKER.upload(
    targetFolder.source,
    targetFolder.target,
    file,
    _clipboardGetFilePickerOptions(targetFolder)
  )).path;
}

async function _clipboardFetchImageUrl(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Failed to download pasted media URL from ${url}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to download pasted media URL (${response.status} ${response.statusText})`);
  }

  const blob = await response.blob();
  const filename = _clipboardGetFilenameFromUrl(url);
  const contentType = _clipboardNormalizeMimeType(response.headers.get("content-type"));
  const blobType = _clipboardNormalizeMimeType(blob.type);
  const mediaKind = _clipboardGetMediaKind({mimeType: contentType})
    || _clipboardGetMediaKind({mimeType: blobType})
    || _clipboardGetMediaKind({filename});
  if (!mediaKind) {
    throw new Error("Pasted URL did not resolve to supported media content");
  }

  const typedBlob = _clipboardIsMediaMimeType(contentType) || _clipboardIsMediaMimeType(blobType)
    ? blob
    : new Blob([blob], {type: _clipboardGetMimeTypeFromFilename(filename)});
  const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
  const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || _clipboardGetMimeTypeFromFilename(resolvedFilename);
  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

async function _clipboardResolveImageInputBlob(imageInput) {
  if (!imageInput) return null;
  if (imageInput.blob) return imageInput.blob;
  if (imageInput.url) return _clipboardFetchImageUrl(imageInput.url);
  return null;
}

async function _clipboardApplyPasteResult(path, context) {
  const mediaKind = _clipboardGetMediaKind({src: path}) || "image";
  if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind)) return true;

  const {width: imgWidth, height: imgHeight} = await _clipboardLoadMediaDimensions(path);
  const createData = context.createStrategy.createData({
    path,
    imgWidth,
    imgHeight,
    mediaKind,
    mousePos: context.mousePos,
  });
  await canvas.scene.createEmbeddedDocuments(context.createStrategy.documentName, createData);
  return true;
}

async function _clipboardPostChatImage(blob) {
  const destination = _clipboardGetUploadDestination();
  await _clipboardCreateFolderIfMissing(destination);
  const path = await _clipboardUploadBlob(blob, destination);
  await _clipboardCreateChatMessage(path);
  return true;
}

async function _clipboardPasteBlob(blob, targetFolder, contextOptions = {}) {
  if (!canvas?.ready || !canvas.scene) return false;

  const context = _clipboardResolvePasteContext(contextOptions);
  if (!_clipboardCanPasteToContext(context)) return false;

  _clipboardPrepareCreateLayer(context);
  const path = await _clipboardUploadBlob(blob, targetFolder);
  return _clipboardApplyPasteResult(path, context);
}

function _clipboardHasPasteConflict({respectCopiedObjects = true} = {}) {
  if (respectCopiedObjects && _clipboardHasCopiedObjects()) {
    console.warn("Image Clipboard: Priority given to Foundry copied objects.");
    return true;
  }

  if (CLIPBOARD_IMAGE_LOCKED) return true;
  if (game.modules.get("vtta-tokenizer")?.active &&
      Object.values(ui.windows).some(windowApp => windowApp.id === "tokenizer-control")) return true;
  return false;
}

async function _clipboardExecutePasteWorkflow(workflow, options = {}) {
  const {notifyError = true, respectCopiedObjects = true} = options;
  if (_clipboardHasPasteConflict({respectCopiedObjects})) return false;

  CLIPBOARD_IMAGE_LOCKED = true;
  try {
    return await workflow();
  } catch (error) {
    if (notifyError) {
      const message = error instanceof Error && error.message
        ? `Clipboard Image: ${error.message}`
        : "Clipboard Image: Failed to handle media input. Check the console.";
      ui.notifications.error(message);
    }
    console.error("Clipboard Image: Failed to handle media input", error);
    return false;
  } finally {
    CLIPBOARD_IMAGE_LOCKED = false;
  }
}

async function _clipboardHandleImageBlob(blob, options = {}) {
  if (!blob) return false;

  const destination = _clipboardGetUploadDestination();
  await _clipboardCreateFolderIfMissing(destination);
  return _clipboardPasteBlob(blob, destination, options.contextOptions);
}

async function _clipboardHandleImageInput(imageInput, options = {}) {
  const blob = await _clipboardResolveImageInputBlob(imageInput);
  if (!blob) return false;
  return _clipboardHandleImageBlob(blob, options);
}

async function _clipboardHandleChatImageBlob(blob) {
  if (!blob) return false;
  return _clipboardPostChatImage(blob);
}

async function _clipboardHandleChatImageInput(imageInput) {
  const blob = await _clipboardResolveImageInputBlob(imageInput);
  if (!blob) return false;
  return _clipboardHandleChatImageBlob(blob);
}

async function _clipboardHandleTextInput(textInput, options = {}) {
  const text = _clipboardNormalizePastedText(textInput?.text);
  if (!text) return false;
  if (!canvas?.ready || !canvas.scene) return false;

  const context = _clipboardResolvePasteContext(options.contextOptions);
  if (!_clipboardCanPasteToContext(context)) return false;

  if (context.replacementTarget?.documents?.length) {
    for (const document of context.replacementTarget.documents) {
      await _clipboardEnsurePlaceableTextNote(document, text, context.mousePos);
    }
    return true;
  }

  return _clipboardCreateStandaloneTextNote(text, context);
}

async function _clipboardReadAndPasteImage(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoImage) ui.notifications.warn("Clipboard Image: No clipboard media was available.");
    return false;
  }

  const imageInput = await _clipboardExtractImageInput(clipItems);
  if (!imageInput) {
    if (options.notifyNoImage) ui.notifications.warn("Clipboard Image: No supported media or media URL was found in the clipboard.");
    return false;
  }

  if (options.handleImageInput) return options.handleImageInput(imageInput);
  if (options.handleImageBlob) {
    const blob = await _clipboardResolveImageInputBlob(imageInput);
    if (!blob) return false;
    return options.handleImageBlob(blob);
  }

  return _clipboardHandleImageInput(imageInput, options);
}

async function _clipboardReadAndPasteClipboardContent(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoContent) ui.notifications.warn("Clipboard Image: No clipboard data was available.");
    return false;
  }

  const mediaInput = await _clipboardExtractImageInput(clipItems);
  if (mediaInput) {
    if (options.handleImageInput) return options.handleImageInput(mediaInput);
    return _clipboardHandleImageInput(mediaInput, options);
  }

  const textInput = await _clipboardExtractTextInput(clipItems);
  if (textInput) {
    if (options.handleTextInput) return options.handleTextInput(textInput);
    return _clipboardHandleTextInput(textInput, options);
  }

  if (options.notifyNoContent) {
    ui.notifications.warn("Clipboard Image: No supported media or text was found in the clipboard.");
  }
  return false;
}

function _clipboardChooseImageFile() {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
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

async function _clipboardOpenUploadPicker() {
  const file = await _clipboardChooseImageFile();
  if (!file) return false;
  return _clipboardHandleImageBlob(file, {
    contextOptions: {
      fallbackToCenter: true,
      requireCanvasFocus: false,
    },
  });
}

async function _clipboardOpenChatUploadPicker() {
  const file = await _clipboardChooseImageFile();
  if (!file) return false;
  return _clipboardHandleChatImageBlob(file);
}

function _clipboardHandleScenePasteAction() {
  if (!navigator.clipboard?.read) {
    ui.notifications.warn("Clipboard Image: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
    return;
  }

  void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteImage({
    notifyNoImage: true,
    contextOptions: {
      fallbackToCenter: true,
      requireCanvasFocus: false,
    },
  }), {
    respectCopiedObjects: false,
  });
}

function _clipboardHandleSceneUploadAction() {
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
    respectCopiedObjects: false,
  });
}

function _clipboardHandleChatUploadAction() {
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
    respectCopiedObjects: false,
  });
}

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

  root.setAttribute(CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
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

function _clipboardInsertTextAtTarget(target, text) {
  if (!text) return false;

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
    const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
    target.focus();
    target.setRangeText(text, start, end, "end");
    target.dispatchEvent(new Event("input", {bubbles: true}));
    return true;
  }

  if (target?.isContentEditable) {
    target.focus();
    const selection = window.getSelection();
    if (!selection) return false;

    if (!selection.rangeCount) {
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
    target.dispatchEvent(new Event("input", {bubbles: true}));
    return true;
  }

  return false;
}

async function _clipboardHandleChatImageInputWithTextFallback(imageInput, target) {
  try {
    return await _clipboardHandleChatImageInput(imageInput);
  } catch (error) {
    if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) return false;
    throw error;
  }
}

function _clipboardOnPaste(event) {
  const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
  if (imageInput) {
    if (_clipboardGetChatRootFromTarget(event.target)) {
      if (_clipboardHasPasteConflict({respectCopiedObjects: false})) return;

      event.preventDefault();
      event.stopPropagation();
      void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
        respectCopiedObjects: false,
      });
      return;
    }

    const context = _clipboardResolvePasteContext();
    if (!_clipboardCanPasteToContext(context)) return;
    if (_clipboardHasPasteConflict()) return;

    event.preventDefault();
    event.stopPropagation();

    void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput), {
      respectCopiedObjects: false,
    });
    return;
  }

  const textInput = _clipboardExtractTextInputFromDataTransfer(event.clipboardData);
  if (!textInput) return;
  if (_clipboardGetChatRootFromTarget(event.target) || _clipboardIsEditableTarget(event.target)) return;

  const context = _clipboardResolvePasteContext();
  if (!_clipboardCanPasteToContext(context)) return;
  if (_clipboardHasPasteConflict()) return;

  event.preventDefault();
  event.stopPropagation();
  void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput), {
    respectCopiedObjects: false,
  });
}

function _clipboardOnKeydown(event) {
  CLIPBOARD_HIDDEN_MODE = (event.ctrlKey || event.metaKey) && event.getModifierState("CapsLock");

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

class ClipboardImageDestinationConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "clipboard-image-destination-config",
      title: "Clipboard Image: Upload Destination",
      template: "modules/clipboard-image/templates/upload-destination.hbs",
      width: 520,
      closeOnSubmit: true,
    });
  }

  getData() {
    const source = _clipboardGetStoredSource();
    const target = _clipboardGetTargetFolder();
    const bucket = _clipboardGetStoredBucket();
    const destination = _clipboardGetUploadDestination({storedSource: source, target, bucket});

    return {
      bucket,
      destinationSummary: _clipboardDescribeDestination(destination),
      isS3: destination.storedSource === CLIPBOARD_IMAGE_SOURCE_S3,
      source,
      sourceChoices: _clipboardGetSourceChoices(source),
      target,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const sourceField = html.find('[name="source"]');
    const targetField = html.find('[name="target"]');
    const bucketField = html.find('[name="bucket"]');

    sourceField.on("change", () => this._refreshFormState());
    targetField.on("input", () => this._refreshFormState());
    bucketField.on("input", () => this._refreshFormState());
    html.find('[data-action="browse-destination"]').on("click", event => this._onBrowseDestination(event));

    this._refreshFormState();
  }

  _ensureSourceOption(source) {
    const sourceField = this.form?.elements?.source;
    if (!sourceField || !source) return;
    const choices = Array.from(sourceField.options).map(option => option.value);
    if (choices.includes(source)) return;

    const option = document.createElement("option");
    option.value = source;
    option.text = `Custom (${source})`;
    sourceField.add(option);
  }

  _refreshFormState() {
    const form = this.form;
    if (!form) return;

    const storedSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const target = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const bucket = storedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? form.elements.bucket.value?.trim() || "" : "";
    const destination = _clipboardGetUploadDestination({storedSource, target, bucket});
    const summaryField = form.querySelector('[data-role="destination-summary"]');
    const bucketGroup = this.element.find(".clipboard-image-s3-bucket");

    if (summaryField) summaryField.value = _clipboardDescribeDestination(destination);
    bucketGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
  }

  _applyPickerSelection(path, picker, previousStoredSource) {
    const form = this.form;
    if (!form) return;

    const selectedSource = picker.activeSource || _clipboardResolveSource(previousStoredSource);
    if (!_clipboardCanSelectSource(selectedSource)) {
      ui.notifications.warn("Clipboard Image: The selected file source does not support pasted uploads.");
      return;
    }

    const keepAutomatic = previousStoredSource === CLIPBOARD_IMAGE_SOURCE_AUTO &&
      selectedSource === _clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO);
    const bucket = selectedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? picker.sources?.s3?.bucket || "" : "";

    this._ensureSourceOption(selectedSource);
    form.elements.source.value = keepAutomatic ? CLIPBOARD_IMAGE_SOURCE_AUTO : selectedSource;
    form.elements.target.value = path || picker.target || form.elements.target.value;
    form.elements.bucket.value = bucket;
    this._refreshFormState();
  }

  _onBrowseDestination(event) {
    event.preventDefault();

    const form = this.form;
    if (!form) return;

    const previousStoredSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const activeSource = _clipboardResolveSource(previousStoredSource);
    const currentTarget = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const currentBucket = form.elements.bucket.value?.trim() || "";
    const picker = new CLIPBOARD_IMAGE_FILE_PICKER({
      activeSource,
      button: event.currentTarget,
      callback: path => this._applyPickerSelection(path, picker, previousStoredSource),
      current: currentTarget,
      field: form.elements.target,
      type: "folder",
    });

    if (activeSource === CLIPBOARD_IMAGE_SOURCE_S3) {
      picker.sources.s3 = picker.sources.s3 || {target: currentTarget};
      picker.sources.s3.bucket = currentBucket || picker.sources.s3.bucket;
      picker.sources.s3.target = currentTarget;
    }

    void picker.render(true);
  }

  async _updateObject(_event, formData) {
    const source = formData.source?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const target = formData.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const bucket = source === CLIPBOARD_IMAGE_SOURCE_S3 ? formData.bucket?.trim() || "" : "";

    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", source);
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location", target);
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", bucket);
  }
}

function _clipboardRegisterSettings() {
  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
    name: "Upload destination",
    label: "Configure",
    hint: "Choose the file store and folder used for pasted images. Supports User Data, The Forge, and Amazon S3 through Foundry's native file picker.",
    icon: "fa-solid fa-folder-tree",
    type: ClipboardImageDestinationConfig,
    restricted: true,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
    name: "Pasted image location",
    hint: "Folder where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
    name: "Pasted image source",
    hint: "File source where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_SOURCE_AUTO,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
    name: "Pasted image S3 bucket",
    hint: "S3 bucket used when clipboard images are saved to Amazon S3.",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });
}

document.addEventListener("keydown", _clipboardOnKeydown);
document.addEventListener("paste", _clipboardOnPaste);

Hooks.once('init', function() {
  _clipboardRegisterSettings();
  Hooks.on("getSceneControlButtons", _clipboardAddSceneControlButtons);
  Hooks.on("renderChatInput", _clipboardOnRenderChatInput);

  if (navigator.clipboard?.read) {
    game.keybindings.register("clipboard-image", "paste-image", {
      name: "Paste Clipboard Content",
      restricted: true,
      uneditable: [
        {key: "KeyV", modifiers: [ CLIPBOARD_IMAGE_KEYBOARD_MANAGER.MODIFIER_KEYS.CONTROL ]}
      ],
      onDown: () => {
        if (CLIPBOARD_IMAGE_LOCKED) return true;
        const context = _clipboardResolvePasteContext();
        if (!_clipboardCanPasteToContext(context)) return false;
        if (_clipboardHasPasteConflict()) return false;

        void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteClipboardContent(), {
          respectCopiedObjects: false,
        });

        return true;
      },
      precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY
    });
  }

});

Hooks.once('ready', function() {
  if (game.user.isGM && !navigator.clipboard?.read) {
    ui.notifications.info("Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and Upload Media scene controls are still available.");
  }
});
