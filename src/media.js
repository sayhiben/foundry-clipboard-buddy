const {
  CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
  CLIPBOARD_IMAGE_VIDEO_EXTENSIONS,
} = require("./constants");
const {_clipboardLog} = require("./diagnostics");

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

  return {
    autoplay: true,
    loop: true,
    volume: 0,
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
  const mediaKind = _clipboardGetMediaKind({src: path}) === "video" ? "video" : "image";
  const dimensions = mediaKind === "video"
    ? await _clipboardLoadVideoDimensions(path)
    : await _clipboardLoadImageDimensions(path);

  _clipboardLog("debug", "Loaded pasted media dimensions", {
    path,
    mediaKind,
    width: dimensions.width,
    height: dimensions.height,
  });

  return dimensions;
}

module.exports = {
  _clipboardNormalizeMimeType,
  _clipboardGetFilenameExtension,
  _clipboardGetFileExtension,
  _clipboardParseSupportedUrl,
  _clipboardGetFilenameFromUrl,
  _clipboardLooksLikeImageFilename,
  _clipboardLooksLikeVideoFilename,
  _clipboardIsImageMimeType,
  _clipboardIsVideoMimeType,
  _clipboardIsMediaMimeType,
  _clipboardGetMediaKind,
  _clipboardIsSupportedMediaBlob,
  _clipboardGetMimeTypeFromFilename,
  _clipboardEnsureFilenameExtension,
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardRoundDimension,
  _clipboardScaleTokenDimensions,
  _clipboardLoadImageDimensions,
  _clipboardLoadVideoDimensions,
  _clipboardLoadMediaDimensions,
};
