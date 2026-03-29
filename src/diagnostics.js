const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
} = require("./constants");

function _clipboardVerboseLoggingEnabled() {
  try {
    const settingKey = `${CLIPBOARD_IMAGE_MODULE_ID}.${CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING}`;
    if (!game?.settings?.settings?.has?.(settingKey)) return false;
    return Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING));
  } catch (error) {
    return false;
  }
}

function _clipboardSerializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function _clipboardDescribeFile(file) {
  if (!file) return null;

  return {
    name: file.name || null,
    type: file.type || null,
    size: file.size ?? null,
  };
}

function _clipboardDescribeDestinationForLog(destination) {
  if (!destination) return null;

  return {
    storedSource: destination.storedSource,
    source: destination.source,
    target: destination.target,
    bucket: destination.bucket || null,
    endpoint: destination.endpoint || null,
  };
}

function _clipboardDescribeReplacementTarget(replacementTarget) {
  if (!replacementTarget) return null;

  return {
    documentName: replacementTarget.documentName,
    ids: replacementTarget.documents.map(document => document.id),
    requestedCount: replacementTarget.requestedCount ?? replacementTarget.documents.length,
    blocked: Boolean(replacementTarget.blocked),
  };
}

function _clipboardDescribePasteContext(context) {
  if (!context) return null;

  const {_clipboardHasCanvasFocus} = require("./context");

  return {
    mousePos: context.mousePos,
    createDocumentName: context.createStrategy?.documentName || context.createDocumentName || null,
    replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
    requireCanvasFocus: context.requireCanvasFocus,
    hasCanvasFocus: _clipboardHasCanvasFocus(),
  };
}

function _clipboardDescribeClipboardItems(clipItems) {
  return (clipItems || []).map((item, index) => ({
    index,
    types: Array.from(item.types || []),
  }));
}

function _clipboardDescribeDataTransfer(dataTransfer) {
  if (!dataTransfer) return null;

  return {
    types: Array.from(dataTransfer.types || []),
    files: Array.from(dataTransfer.files || []).map(_clipboardDescribeFile),
    items: Array.from(dataTransfer.items || []).map(item => ({
      kind: item.kind,
      type: item.type,
    })),
  };
}

function _clipboardDescribeImageInput(imageInput) {
  if (!imageInput) return null;

  const {_clipboardGetMediaKind} = require("./media");
  if (imageInput.blob) {
    return {
      source: "blob",
      ...(_clipboardDescribeFile(imageInput.blob) || {}),
      mediaKind: _clipboardGetMediaKind({blob: imageInput.blob, filename: imageInput.blob.name}),
    };
  }

  return {
    source: "url",
    url: imageInput.url || null,
    mediaKind: _clipboardGetMediaKind({src: imageInput.url}),
  };
}

function _clipboardLog(level, message, details) {
  if ((level === "debug" || level === "info") && !_clipboardVerboseLoggingEnabled()) return;

  const logger = console[level] || console.log;
  const prefix = `Clipboard Image [${level.toUpperCase()}]: ${message}`;
  if (details === undefined) {
    logger(prefix);
    return;
  }

  logger(prefix, details);
}

module.exports = {
  _clipboardVerboseLoggingEnabled,
  _clipboardSerializeError,
  _clipboardDescribeFile,
  _clipboardDescribeDestinationForLog,
  _clipboardDescribeReplacementTarget,
  _clipboardDescribePasteContext,
  _clipboardDescribeClipboardItems,
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardLog,
};
