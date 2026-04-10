const {_clipboardLog} = require("../diagnostics");
const {
  _clipboardNormalizeMimeType,
  _clipboardCoerceAudioFile,
  _clipboardGetMimeTypeFromFilename,
  _clipboardGetAudioKind,
  _clipboardGetAudioMimeTypeFromFilename,
  _clipboardGetMediaKind,
  _clipboardIsAudioMimeType,
  _clipboardIsMediaMimeType,
  _clipboardIsPdfMimeType,
  _clipboardLooksLikePdfFilename,
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

async function _clipboardFetchPdfUrl(url) {
  let response;
  try {
    _clipboardLog("info", "Downloading pasted PDF URL", {url});
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Failed to download pasted PDF URL from ${url}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to download pasted PDF URL (${response.status} ${response.statusText})`);
  }

  const blob = await response.blob();
  const filename = _clipboardGetFilenameFromUrl(url) || "pasted_pdf.pdf";
  const contentType = _clipboardNormalizeMimeType(response.headers.get("content-type"));
  const blobType = _clipboardNormalizeMimeType(blob.type);
  const isPdf = _clipboardIsPdfMimeType(contentType) ||
    _clipboardIsPdfMimeType(blobType) ||
    _clipboardLooksLikePdfFilename(filename);
  if (!isPdf) {
    throw Object.assign(new Error("Pasted URL did not resolve to PDF content"), {
      clipboardPdfUrlNotPdf: true,
    });
  }

  const typedBlob = _clipboardIsPdfMimeType(contentType) || _clipboardIsPdfMimeType(blobType)
    ? blob
    : new Blob([blob], {type: _clipboardGetMimeTypeFromFilename(filename)});
  const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
  const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || "application/pdf";
  _clipboardLog("info", "Downloaded pasted PDF URL", {
    url,
    responseContentType: contentType || null,
    blobType: blobType || null,
    resolvedFilename,
    resolvedMimeType,
    size: typedBlob.size,
  });
  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

async function _clipboardResolvePdfInputBlob(pdfInput) {
  if (!pdfInput) return null;
  if (pdfInput.blob) return pdfInput.blob;
  if (pdfInput.url) return _clipboardFetchPdfUrl(pdfInput.url);
  return null;
}

async function _clipboardFetchAudioUrl(url, {explicitAudioContext = false} = {}) {
  let response;
  try {
    _clipboardLog("info", "Downloading pasted audio URL", {url});
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Failed to download pasted audio URL from ${url}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to download pasted audio URL (${response.status} ${response.statusText})`);
  }

  const blob = await response.blob();
  const filename = _clipboardGetFilenameFromUrl(url) || "pasted_audio.mp3";
  const contentType = _clipboardNormalizeMimeType(response.headers.get("content-type"));
  const blobType = _clipboardNormalizeMimeType(blob.type);
  const audioKind = _clipboardGetAudioKind({mimeType: contentType, explicitAudioContext}) ||
    _clipboardGetAudioKind({mimeType: blobType, explicitAudioContext}) ||
    _clipboardGetAudioKind({filename, explicitAudioContext});
  if (!audioKind) {
    throw Object.assign(new Error("Pasted URL did not resolve to supported audio content"), {
      clipboardAudioUrlNotAudio: true,
    });
  }

  const typedBlob = _clipboardIsAudioMimeType(contentType) || _clipboardIsAudioMimeType(blobType)
    ? blob
    : new Blob([blob], {type: _clipboardGetAudioMimeTypeFromFilename(filename)});
  const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
  const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || _clipboardGetAudioMimeTypeFromFilename(resolvedFilename);
  const file = _clipboardCoerceAudioFile(new File([typedBlob], resolvedFilename, {type: resolvedMimeType}), {
    filename: resolvedFilename,
    mimeType: resolvedMimeType,
    explicitAudioContext: true,
  });

  _clipboardLog("info", "Downloaded pasted audio URL", {
    url,
    responseContentType: contentType || null,
    blobType: blobType || null,
    resolvedFilename: file?.name || resolvedFilename,
    resolvedMimeType: file?.type || resolvedMimeType,
    size: typedBlob.size,
  });
  return file || new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

async function _clipboardResolveAudioInputBlob(audioInput, options = {}) {
  if (!audioInput) return null;
  if (audioInput.blob) return audioInput.blob;
  if (audioInput.url) return _clipboardFetchAudioUrl(audioInput.url, options);
  return null;
}

module.exports = {
  _clipboardFetchImageUrl,
  _clipboardResolveImageInputBlob,
  _clipboardFetchPdfUrl,
  _clipboardResolvePdfInputBlob,
  _clipboardFetchAudioUrl,
  _clipboardResolveAudioInputBlob,
};
