// @ts-nocheck

const {
  CLIPBOARD_IMAGE_AUDIO_EXTENSIONS,
  CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
  CLIPBOARD_IMAGE_VIDEO_EXTENSIONS,
} = require("./constants");
const {_clipboardLog} = require("./diagnostics");

function _clipboardNormalizeMimeType(value) {
  return value?.split(";").shift()?.trim()?.toLowerCase() || "";
}

function _clipboardGetFilenameExtension(filename) {
  const value = String(filename || "").split(/[?#]/).shift()?.trim() || "";
  const leaf = value.split("/").pop() || value;
  const dotIndex = leaf.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === leaf.length - 1) return "";
  return leaf.slice(dotIndex + 1).trim().toLowerCase();
}

function _clipboardNormalizeAudioExtension(extension) {
  const normalized = String(extension || "").trim().toLowerCase().replace(/^\./, "");
  if (normalized === "midi") return "mid";
  return normalized;
}

function _clipboardGetFileExtension(blob) {
  if (blob instanceof File && blob.name.includes(".")) {
    const extension = blob.name.split(".").pop().toLowerCase();
    return _clipboardNormalizeAudioExtension(extension) || extension;
  }

  const normalizedMimeType = _clipboardNormalizeMimeType(blob.type);
  const audioExtension = _clipboardGetAudioExtensionFromMimeType(normalizedMimeType);
  if (audioExtension) return audioExtension;

  const mimeType = normalizedMimeType.split("/").pop()?.toLowerCase() || "png";
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

function _clipboardGetFoundryAudioHelper() {
  return globalThis.foundry?.audio?.AudioHelper ||
    globalThis.AudioHelper ||
    null;
}

function _clipboardFoundryAudioHelperHasAudioExtension(filename) {
  const audioHelper = _clipboardGetFoundryAudioHelper();
  if (typeof audioHelper?.hasAudioExtension !== "function") return false;

  try {
    return Boolean(audioHelper.hasAudioExtension(filename));
  } catch {
    return false;
  }
}

function _clipboardGetRuntimeAudioExtensions() {
  const runtimeExtensions = globalThis.CONST?.AUDIO_FILE_EXTENSIONS;
  if (!runtimeExtensions) return CLIPBOARD_IMAGE_AUDIO_EXTENSIONS;

  const values = Array.isArray(runtimeExtensions)
    ? runtimeExtensions
    : Object.values(runtimeExtensions);
  const normalizedValues = values
    .map(value => _clipboardNormalizeAudioExtension(value))
    .filter(Boolean);
  return normalizedValues.length
    ? new Set([...normalizedValues, "midi"])
    : CLIPBOARD_IMAGE_AUDIO_EXTENSIONS;
}

function _clipboardLooksLikeAudioFilename(filename, {explicitAudioContext = false} = {}) {
  const extension = _clipboardNormalizeAudioExtension(_clipboardGetFilenameExtension(filename));
  if (!extension) return false;
  if (extension === "webm" && !explicitAudioContext) return false;

  if (_clipboardFoundryAudioHelperHasAudioExtension(filename)) return true;
  return _clipboardGetRuntimeAudioExtensions().has(extension) ||
    CLIPBOARD_IMAGE_AUDIO_EXTENSIONS.has(extension);
}

function _clipboardLooksLikePdfFilename(filename) {
  return _clipboardGetFilenameExtension(filename) === "pdf";
}

function _clipboardIsImageMimeType(mimeType) {
  return _clipboardNormalizeMimeType(mimeType).startsWith("image/");
}

function _clipboardIsVideoMimeType(mimeType) {
  return _clipboardNormalizeMimeType(mimeType).startsWith("video/");
}

function _clipboardIsPdfMimeType(mimeType) {
  const normalized = _clipboardNormalizeMimeType(mimeType);
  return normalized === "application/pdf" || normalized === "application/x-pdf";
}

function _clipboardIsAudioMimeType(mimeType) {
  return _clipboardNormalizeMimeType(mimeType).startsWith("audio/");
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

/**
 * @param {{blob?: Blob | File | null, filename?: string, mimeType?: string, src?: string, explicitAudioContext?: boolean}} [options]
 * @returns {"audio" | null}
 */
function _clipboardGetAudioKind({blob, filename, mimeType, src, explicitAudioContext = false} = {}) {
  const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
  if (_clipboardIsAudioMimeType(normalizedMimeType)) return "audio";

  const candidate = filename || blob?.name || (src ? (_clipboardGetFilenameFromUrl(src) || src) : "");
  if (_clipboardLooksLikeAudioFilename(candidate, {explicitAudioContext})) return "audio";
  return null;
}

function _clipboardIsSupportedMediaBlob(blob) {
  return Boolean(blob && _clipboardGetMediaKind({blob, filename: blob.name}));
}

function _clipboardIsPdfBlob(blob, {filename = "", mimeType = ""} = {}) {
  if (!blob) return false;
  return _clipboardIsPdfMimeType(mimeType || blob.type) ||
    _clipboardLooksLikePdfFilename(filename || blob.name);
}

function _clipboardIsAudioBlob(blob, {filename = "", mimeType = "", explicitAudioContext = false} = {}) {
  if (!blob) return false;
  return Boolean(_clipboardGetAudioKind({
    blob,
    filename: filename || blob.name,
    mimeType: mimeType || blob.type,
    explicitAudioContext,
  }));
}

function _clipboardIsGifMedia({blob, filename, mimeType, src} = {}) {
  const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
  if (normalizedMimeType === "image/gif") return true;

  const candidate = filename
    || blob?.name
    || (src ? (_clipboardGetFilenameFromUrl(src) || src) : "");
  return _clipboardGetFilenameExtension(candidate) === "gif";
}

function _clipboardCoerceMediaFile(blob, {filename = "", mimeType = ""} = {}) {
  if (!blob) return null;

  const candidateFilename = filename || (blob instanceof File ? blob.name : "") || "pasted_image";
  const resolvedMediaKind = _clipboardGetMediaKind({
    blob,
    filename: candidateFilename,
    mimeType,
  });
  if (!resolvedMediaKind) return null;

  const normalizedBlobType = _clipboardNormalizeMimeType(blob.type);
  let resolvedMimeType = normalizedBlobType || _clipboardNormalizeMimeType(mimeType);
  if (!_clipboardIsMediaMimeType(resolvedMimeType)) {
    resolvedMimeType = _clipboardGetMimeTypeFromFilename(candidateFilename);
  }

  const typedBlob = normalizedBlobType === resolvedMimeType
    ? blob
    : new Blob([blob], {type: resolvedMimeType});
  const resolvedFilename = _clipboardEnsureFilenameExtension(candidateFilename, typedBlob);

  if (blob instanceof File &&
      blob.name === resolvedFilename &&
      normalizedBlobType === resolvedMimeType) {
    return blob;
  }

  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

function _clipboardCoercePdfFile(blob, {filename = "", mimeType = ""} = {}) {
  if (!blob || !_clipboardIsPdfBlob(blob, {filename, mimeType})) return null;

  const candidateFilename = filename || (blob instanceof File ? blob.name : "") || "pasted_pdf.pdf";
  const resolvedFilename = _clipboardLooksLikePdfFilename(candidateFilename)
    ? candidateFilename
    : `${candidateFilename.replace(/\.[^./]+$/, "") || "pasted_pdf"}.pdf`;
  const normalizedBlobType = _clipboardNormalizeMimeType(blob.type);
  const resolvedMimeType = _clipboardIsPdfMimeType(normalizedBlobType)
    ? normalizedBlobType
    : "application/pdf";
  const typedBlob = normalizedBlobType === resolvedMimeType
    ? blob
    : new Blob([blob], {type: resolvedMimeType});

  if (blob instanceof File &&
      blob.name === resolvedFilename &&
      normalizedBlobType === resolvedMimeType) {
    return blob;
  }

  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

function _clipboardCoerceAudioFile(blob, {filename = "", mimeType = "", explicitAudioContext = false} = {}) {
  if (!blob || !_clipboardIsAudioBlob(blob, {filename, mimeType, explicitAudioContext})) return null;

  const candidateFilename = filename || (blob instanceof File ? blob.name : "") || "pasted_audio";
  const candidateExtension = _clipboardNormalizeAudioExtension(_clipboardGetFilenameExtension(candidateFilename));
  const resolvedFilename = CLIPBOARD_IMAGE_AUDIO_EXTENSIONS.has(candidateExtension)
    ? candidateFilename.replace(/\.(midi)(?=$|[?#])/i, ".mid")
    : `${candidateFilename.replace(/\.[^./]+$/, "") || "pasted_audio"}.mp3`;
  const normalizedBlobType = _clipboardNormalizeMimeType(blob.type);
  let resolvedMimeType = _clipboardIsAudioMimeType(normalizedBlobType)
    ? normalizedBlobType
    : _clipboardNormalizeMimeType(mimeType);
  if (!_clipboardIsAudioMimeType(resolvedMimeType)) {
    resolvedMimeType = _clipboardGetAudioMimeTypeFromFilename(resolvedFilename);
  }
  const typedBlob = normalizedBlobType === resolvedMimeType
    ? blob
    : new Blob([blob], {type: resolvedMimeType});

  if (blob instanceof File &&
      blob.name === resolvedFilename &&
      normalizedBlobType === resolvedMimeType) {
    return blob;
  }

  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

function _clipboardGetAudioExtensionFromMimeType(mimeType) {
  switch (_clipboardNormalizeMimeType(mimeType)) {
    case "audio/aac":
      return "aac";
    case "audio/flac":
    case "audio/x-flac":
      return "flac";
    case "audio/m4a":
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/mid":
    case "audio/midi":
    case "audio/x-midi":
      return "mid";
    case "audio/mp3":
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/opus":
      return "opus";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return "wav";
    case "audio/webm":
      return "webm";
    default:
      return "";
  }
}

function _clipboardGetAudioMimeTypeFromFilename(filename) {
  switch (_clipboardNormalizeAudioExtension(_clipboardGetFilenameExtension(filename))) {
    case "aac":
      return "audio/aac";
    case "flac":
      return "audio/flac";
    case "m4a":
      return "audio/mp4";
    case "mid":
      return "audio/midi";
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
    case "opus":
      return "audio/opus";
    case "wav":
      return "audio/wav";
    case "webm":
      return "audio/webm";
    default:
      return "audio/mpeg";
  }
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
    case "ogv":
      return "video/ogg";
    case "webm":
      return "video/webm";
    case "pdf":
      return "application/pdf";
    case "aac":
    case "flac":
    case "m4a":
    case "mid":
    case "midi":
    case "mp3":
    case "ogg":
    case "opus":
    case "wav":
      return _clipboardGetAudioMimeTypeFromFilename(filename);
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

function _clipboardParseSvgLength(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.endsWith("%")) return null;

  const match = normalized.match(/^([0-9]*\.?[0-9]+)(px)?$/i);
  if (!match) return null;

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function _clipboardGetSvgViewBoxDimensions(svgElement) {
  const viewBox = svgElement?.getAttribute?.("viewBox")?.trim();
  if (!viewBox) return null;

  const values = viewBox.split(/[\s,]+/).map(Number.parseFloat);
  if (values.length !== 4 || values.some(value => !Number.isFinite(value))) return null;

  const [, , width, height] = values;
  if (!(width > 0) || !(height > 0)) return null;
  return {width, height};
}

function _clipboardGetSvgElementFromText(svgText) {
  const documentFragment = new DOMParser().parseFromString(svgText, "image/svg+xml");
  return documentFragment.documentElement?.nodeName === "svg"
    ? documentFragment.documentElement
    : documentFragment.querySelector?.("svg");
}

function _clipboardGetSvgIntrinsicDimensionsFromText(svgText) {
  if (!svgText?.trim()) return null;

  const svgElement = _clipboardGetSvgElementFromText(svgText);
  if (!svgElement) return null;

  const width = _clipboardParseSvgLength(svgElement.getAttribute("width"));
  const height = _clipboardParseSvgLength(svgElement.getAttribute("height"));
  if (width && height) {
    return {width, height};
  }

  const viewBoxDimensions = _clipboardGetSvgViewBoxDimensions(svgElement);
  if (!viewBoxDimensions) return null;

  if (width) {
    return {
      width,
      height: _clipboardRoundDimension(width * (viewBoxDimensions.height / viewBoxDimensions.width)),
    };
  }

  if (height) {
    return {
      width: _clipboardRoundDimension(height * (viewBoxDimensions.width / viewBoxDimensions.height)),
      height,
    };
  }

  return viewBoxDimensions;
}

async function _clipboardReadBlobText(blob) {
  if (typeof blob?.text === "function") {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read pasted SVG content"));
    reader.readAsText(blob);
  });
}

async function _clipboardGetPreferredMediaDimensions(blob) {
  if (_clipboardGetMediaKind({blob, filename: blob?.name}) !== "image") return null;
  if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
    return null;
  }

  const svgText = await _clipboardReadBlobText(blob);
  const svgDimensions = _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
  if (!svgDimensions) return null;

  _clipboardLog("debug", "Resolved intrinsic SVG dimensions from uploaded media", {
    width: svgDimensions.width,
    height: svgDimensions.height,
    fileName: blob?.name || null,
    mimeType: _clipboardNormalizeMimeType(blob?.type) || null,
  });
  return svgDimensions;
}

async function _clipboardNormalizeSvgBlobForUpload(blob, svgDimensions = null) {
  if (_clipboardGetMediaKind({blob, filename: blob?.name}) !== "image") return blob;
  if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
    return blob;
  }

  const svgText = await _clipboardReadBlobText(blob);
  const svgElement = _clipboardGetSvgElementFromText(svgText);
  if (!svgElement) return blob;

  const resolvedDimensions = svgDimensions || _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
  if (!resolvedDimensions) return blob;

  const hasExplicitWidth = _clipboardParseSvgLength(svgElement.getAttribute("width"));
  const hasExplicitHeight = _clipboardParseSvgLength(svgElement.getAttribute("height"));
  if (hasExplicitWidth && hasExplicitHeight) return blob;

  svgElement.setAttribute("width", String(resolvedDimensions.width));
  svgElement.setAttribute("height", String(resolvedDimensions.height));

  _clipboardLog("debug", "Normalized uploaded SVG with explicit width and height", {
    width: resolvedDimensions.width,
    height: resolvedDimensions.height,
    fileName: blob?.name || null,
    mimeType: _clipboardNormalizeMimeType(blob?.type) || null,
  });

  return new File(
    [new XMLSerializer().serializeToString(svgElement)],
    blob?.name || `pasted_image.${_clipboardGetFileExtension(blob) || "svg"}`,
    {type: _clipboardNormalizeMimeType(blob?.type) || "image/svg+xml"}
  );
}

async function _clipboardRasterizeImageBlob(blob, {
  mimeType = "image/png",
  filename = "",
} = {}) {
  if (!blob) return null;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Failed to rasterize pasted media"));
      image.src = objectUrl;
    });

    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch (error) {
        // Some browsers reject decode after a successful load.
      }
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error("Failed to rasterize pasted media");
    }

    const canvasElement = document.createElement("canvas");
    canvasElement.width = width;
    canvasElement.height = height;

    const context = canvasElement.getContext("2d");
    if (!context) {
      throw new Error("Canvas rasterization is unavailable");
    }

    context.drawImage(image, 0, 0, width, height);

    const rasterizedBlob = await new Promise((resolve, reject) => {
      canvasElement.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error("Failed to rasterize pasted media"));
      }, mimeType);
    });

    const baseName = String(filename || blob?.name || "pasted_image").replace(/\.[^./]+$/, "") || "pasted_image";
    const rasterizedFile = new File([rasterizedBlob], `${baseName}.png`, {type: mimeType});

    _clipboardLog("info", "Rasterized pasted image for a canvas-compatible upload", {
      originalName: blob?.name || null,
      originalType: _clipboardNormalizeMimeType(blob?.type) || null,
      rasterizedName: rasterizedFile.name,
      rasterizedType: rasterizedFile.type,
      width,
      height,
    });

    return rasterizedFile;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function _clipboardConvertGifToStaticPng(blob) {
  if (!_clipboardIsGifMedia({blob, filename: blob?.name, mimeType: blob?.type})) return blob;
  return _clipboardRasterizeImageBlob(blob, {
    mimeType: "image/png",
    filename: blob?.name,
  });
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
  _clipboardNormalizeAudioExtension,
  _clipboardLooksLikeImageFilename,
  _clipboardLooksLikeVideoFilename,
  _clipboardGetFoundryAudioHelper,
  _clipboardFoundryAudioHelperHasAudioExtension,
  _clipboardGetRuntimeAudioExtensions,
  _clipboardLooksLikeAudioFilename,
  _clipboardLooksLikePdfFilename,
  _clipboardIsImageMimeType,
  _clipboardIsVideoMimeType,
  _clipboardIsPdfMimeType,
  _clipboardIsAudioMimeType,
  _clipboardIsMediaMimeType,
  _clipboardGetMediaKind,
  _clipboardGetAudioKind,
  _clipboardIsSupportedMediaBlob,
  _clipboardIsPdfBlob,
  _clipboardIsAudioBlob,
  _clipboardIsGifMedia,
  _clipboardCoerceMediaFile,
  _clipboardCoercePdfFile,
  _clipboardCoerceAudioFile,
  _clipboardGetAudioExtensionFromMimeType,
  _clipboardGetAudioMimeTypeFromFilename,
  _clipboardGetMimeTypeFromFilename,
  _clipboardEnsureFilenameExtension,
  _clipboardGetTileVideoData,
  _clipboardScaleTileDimensions,
  _clipboardRoundDimension,
  _clipboardScaleTokenDimensions,
  _clipboardParseSvgLength,
  _clipboardGetSvgViewBoxDimensions,
  _clipboardGetSvgElementFromText,
  _clipboardReadBlobText,
  _clipboardGetSvgIntrinsicDimensionsFromText,
  _clipboardGetPreferredMediaDimensions,
  _clipboardNormalizeSvgBlobForUpload,
  _clipboardRasterizeImageBlob,
  _clipboardConvertGifToStaticPng,
  _clipboardLoadImageDimensions,
  _clipboardLoadVideoDimensions,
  _clipboardLoadMediaDimensions,
};
