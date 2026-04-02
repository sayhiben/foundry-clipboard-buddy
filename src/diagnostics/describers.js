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

  const {_clipboardHasCanvasFocus} = require("../context");

  return {
    mousePos: context.mousePos,
    activeDocumentName: context.activeDocumentName || null,
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

  const {_clipboardGetMediaKind} = require("../media");
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
    fallbackBlob: imageInput.fallbackBlob ? _clipboardDescribeFile(imageInput.fallbackBlob) : null,
  };
}

function _clipboardEscapeHtml(value) {
  return foundry?.utils?.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
}

module.exports = {
  _clipboardDescribeFile,
  _clipboardDescribeDestinationForLog,
  _clipboardDescribeReplacementTarget,
  _clipboardDescribePasteContext,
  _clipboardDescribeClipboardItems,
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardEscapeHtml,
};
