const {_clipboardLog} = require("../diagnostics");
const {
  _clipboardNormalizeMimeType,
  _clipboardGetMimeTypeFromFilename,
  _clipboardGetMediaKind,
  _clipboardIsMediaMimeType,
  _clipboardGetFilenameFromUrl,
  _clipboardEnsureFilenameExtension,
} = require("../media");

async function _clipboardFetchImageUrl(url) {
  let response;
  try {
    _clipboardLog("info", "Downloading pasted media URL", {url});
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
  _clipboardLog("info", "Downloaded pasted media URL", {
    url,
    responseContentType: contentType || null,
    blobType: blobType || null,
    resolvedFilename,
    resolvedMimeType,
    size: typedBlob.size,
  });
  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

async function _clipboardResolveImageInputBlob(imageInput) {
  if (!imageInput) return null;
  if (imageInput.blob) return imageInput.blob;
  if (imageInput.url) return _clipboardFetchImageUrl(imageInput.url);
  return null;
}

module.exports = {
  _clipboardFetchImageUrl,
  _clipboardResolveImageInputBlob,
};
