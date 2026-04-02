const {
  _clipboardGetMediaKind,
  _clipboardNormalizeMimeType,
  _clipboardGetFilenameExtension,
} = {
  ...require("../media"),
  ...require("../text"),
};

function _clipboardIsBlockedDirectMediaUrlDownload(imageInput, error) {
  return Boolean(
    error?.clipboardBlockedDirectMediaUrl ||
    (
      imageInput?.url &&
      _clipboardGetMediaKind({src: imageInput.url}) &&
      error instanceof Error &&
      error.message.startsWith("Failed to download pasted media URL from ")
    )
  );
}

function _clipboardGetBlockedDirectMediaUrlError(imageInput, error) {
  if (!_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return null;

  const directMediaUrlError = new Error(
    "The pasted media URL points to a host that blocks browser-side downloads, so Foundry Paste Eater cannot download and re-upload it. Upload the file locally or use a CORS-enabled host."
  );
  directMediaUrlError.clipboardBlockedDirectMediaUrl = true;
  return directMediaUrlError;
}

function _clipboardShouldFallbackToText(imageInput, error) {
  if (_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return false;
  return true;
}

function _clipboardDescribeAttemptedMediaContent({blob, imageInput} = {}) {
  const candidateBlob = blob || imageInput?.blob || imageInput?.fallbackBlob || null;
  const candidateName = candidateBlob?.name || imageInput?.url || "";
  const candidateType = _clipboardNormalizeMimeType(candidateBlob?.type || "");
  const extension = _clipboardGetFilenameExtension(candidateName);
  const mediaKind = _clipboardGetMediaKind({
    blob: candidateBlob,
    filename: candidateName,
    mimeType: candidateType,
    src: imageInput?.url || null,
  });

  if (mediaKind === "video") return "a video";
  if (mediaKind === "image") {
    if (candidateType === "image/gif" || extension === "gif" || extension === "apng") return "an animation";
    return "an image";
  }

  return "some content";
}

function _clipboardAnnotateWorkflowError(error, metadata = {}) {
  if (!(error instanceof Error)) return error;

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null || value === "") continue;
    if (error[key] === undefined || error[key] === null || error[key] === "") {
      error[key] = value;
    }
  }

  return error;
}

module.exports = {
  _clipboardIsBlockedDirectMediaUrlDownload,
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardShouldFallbackToText,
  _clipboardDescribeAttemptedMediaContent,
  _clipboardAnnotateWorkflowError,
};
