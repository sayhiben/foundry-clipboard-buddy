const {CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE} = require("./constants");
const {
  _clipboardDescribeClipboardItems,
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardLog,
  _clipboardSerializeError,
} = require("./diagnostics");
const {
  _clipboardCoerceMediaFile,
  _clipboardCoercePdfFile,
  _clipboardGetFilenameFromUrl,
  _clipboardGetMediaKind,
  _clipboardIsPdfMimeType,
  _clipboardIsSupportedMediaBlob,
  _clipboardLooksLikePdfFilename,
  _clipboardParseSupportedUrl,
} = require("./media");
const {
  _clipboardNormalizePastedText,
  _clipboardExtractTextFromHtml,
} = require("./text");

async function _clipboardReadClipboardItems() {
  let clipItems;
  try {
    _clipboardLog("debug", "Reading clipboard items via navigator.clipboard.read()");
    clipItems = await navigator.clipboard.read();
  } catch (error) {
    if (!error) {
      _clipboardLog("warn", "Failed to parse clipboard. Make sure your browser supports navigator.clipboard.");
      return null;
    }

    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        _clipboardLog("info", "Clipboard access was blocked or dismissed.");
        return null;
      }
      if (error.name === "NotFoundError") {
        _clipboardLog("info", "Clipboard is empty.");
        return null;
      }
    }

    _clipboardLog("error", "Clipboard read failed", {error: _clipboardSerializeError(error)});
    throw error;
  }

  _clipboardLog("debug", "Read clipboard items", {
    itemCount: clipItems?.length || 0,
    items: _clipboardDescribeClipboardItems(clipItems),
  });
  return clipItems;
}

async function _clipboardExtractImageBlob(clipItems) {
  for (const clipItem of clipItems || []) {
    for (const fileType of clipItem.types) {
      if (_clipboardGetMediaKind({mimeType: fileType})) {
        const blob = await clipItem.getType(fileType);
        const file = _clipboardCoerceMediaFile(blob, {mimeType: fileType});
        if (file) return file;
      }
    }
  }

  return null;
}

async function _clipboardExtractPdfBlob(clipItems) {
  for (const clipItem of clipItems || []) {
    for (const fileType of clipItem.types) {
      if (!_clipboardIsPdfMimeType(fileType)) continue;

      const blob = await clipItem.getType(fileType);
      const file = _clipboardCoercePdfFile(blob, {mimeType: fileType});
      if (file) return file;
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
  return _clipboardExtractTextInputFromValues({
    plainText: await _clipboardReadClipboardText(clipItems, "text/plain"),
    html: await _clipboardReadClipboardText(clipItems, "text/html"),
  });
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

function _clipboardLooksLikePdfUrl(value) {
  const url = _clipboardParseSupportedUrl(value);
  if (!url) return false;
  if (/^data:application\/(?:x-)?pdf\b/i.test(url)) return true;
  return _clipboardLooksLikePdfFilename(_clipboardGetFilenameFromUrl(url) || url);
}

function _clipboardExtractPdfUrlFromUriList(text) {
  for (const line of (text || "").split(/\r?\n/)) {
    const candidate = line.trim();
    if (!candidate || candidate.startsWith("#")) continue;

    const url = _clipboardParseSupportedUrl(candidate);
    if (url && _clipboardLooksLikePdfUrl(url)) return url;
  }

  return null;
}

function _clipboardExtractPdfUrlFromText(text) {
  const candidate = text?.trim();
  if (!candidate || /\s/.test(candidate)) return null;
  const url = _clipboardParseSupportedUrl(candidate);
  return url && _clipboardLooksLikePdfUrl(url) ? url : null;
}

function _clipboardExtractImageUrlFromHtml(html) {
  if (!html?.trim()) return null;

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const mediaElement = documentFragment.querySelector("img[src], video[src], source[src]");
  return _clipboardParseSupportedUrl(mediaElement?.getAttribute("src")?.trim());
}

function _clipboardExtractPdfUrlFromHtml(html) {
  if (!html?.trim()) return null;

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  for (const pdfElement of documentFragment.querySelectorAll("a[href], iframe[src], embed[src], object[data]")) {
    const candidate = pdfElement.getAttribute("href") ||
      pdfElement.getAttribute("src") ||
      pdfElement.getAttribute("data") ||
      "";
    const url = _clipboardParseSupportedUrl(candidate.trim());
    if (url && _clipboardLooksLikePdfUrl(url)) return url;
  }

  return null;
}

function _clipboardGetUrlBackedImageInputCandidate(
  {uriList = "", html = "", plainText = ""} = {},
  {
    uriListMessage,
    htmlMessage,
    plainTextMessage,
  } = {}
) {
  const fallbackText = plainText || "";
  const trimmedPlainText = fallbackText.trim();
  const uriListUrl = _clipboardExtractImageUrlFromUriList(uriList);
  if (uriListUrl) {
    return {
      imageInput: {
        url: uriListUrl,
        text: fallbackText || uriListUrl,
      },
      message: uriListMessage,
    };
  }

  const htmlUrl = _clipboardExtractImageUrlFromHtml(html);
  if (htmlUrl) {
    return {
      imageInput: {
        url: htmlUrl,
        text: fallbackText || htmlUrl,
      },
      message: htmlMessage,
    };
  }

  const textUrl = _clipboardExtractImageUrlFromText(trimmedPlainText);
  if (textUrl) {
    return {
      imageInput: {
        url: textUrl,
        text: fallbackText || textUrl,
      },
      message: plainTextMessage,
    };
  }

  return null;
}

function _clipboardGetUrlBackedPdfInputCandidate(
  {uriList = "", html = "", plainText = ""} = {},
  {
    uriListMessage,
    htmlMessage,
    plainTextMessage,
  } = {}
) {
  const fallbackText = plainText || "";
  const uriListUrl = _clipboardExtractPdfUrlFromUriList(uriList);
  if (uriListUrl) {
    return {
      pdfInput: {
        url: uriListUrl,
        text: fallbackText || uriListUrl,
      },
      message: uriListMessage,
    };
  }

  const htmlUrl = _clipboardExtractPdfUrlFromHtml(html);
  if (htmlUrl) {
    return {
      pdfInput: {
        url: htmlUrl,
        text: fallbackText || htmlUrl,
      },
      message: htmlMessage,
    };
  }

  const textUrl = _clipboardExtractPdfUrlFromText(fallbackText);
  if (textUrl) {
    return {
      pdfInput: {
        url: textUrl,
        text: fallbackText || textUrl,
      },
      message: plainTextMessage,
    };
  }

  return null;
}

function _clipboardIsAnimationCapableUrl(url) {
  return Boolean(url && /\.(?:apng|avif|gif|webp|m4v|mp4|mpeg|mpg|ogg|ogv|webm)(?:$|[?#])/i.test(url));
}

function _clipboardIsLikelyRasterizedImageBlob(blob) {
  if (!blob) return false;

  const mimeType = blob.type?.split(";").shift()?.trim()?.toLowerCase() || "";
  if ([
    "image/bmp",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tif",
    "image/tiff",
    "image/x-icon",
  ].includes(mimeType)) {
    return true;
  }

  const extension = blob.name?.split(".").pop()?.trim()?.toLowerCase() || "";
  return ["bmp", "ico", "jpeg", "jpg", "png", "tif", "tiff"].includes(extension);
}

function _clipboardShouldPreferUrlCandidateOverBlob(blob, imageInput) {
  if (!blob || !imageInput?.url) return false;

  const blobMediaKind = _clipboardGetMediaKind({blob, filename: blob.name});
  const urlMediaKind = _clipboardGetMediaKind({src: imageInput.url});
  if (!urlMediaKind) return false;
  if (urlMediaKind === "video") return true;
  if (blobMediaKind !== "image") return false;
  if (!_clipboardIsAnimationCapableUrl(imageInput.url)) return false;
  return _clipboardIsLikelyRasterizedImageBlob(blob);
}

function _clipboardCreateLoggedImageInput(imageInput, message, details = undefined) {
  const logDetails = {
    imageInput: _clipboardDescribeImageInput(imageInput),
  };

  if (details) Object.assign(logDetails, details);
  _clipboardLog("debug", message, logDetails);
  return imageInput;
}

function _clipboardCreateLoggedPdfInput(pdfInput, message, details = undefined) {
  const logDetails = {
    pdfInput: pdfInput
      ? {
        source: pdfInput.blob ? "blob" : "url",
        name: pdfInput.blob?.name || null,
        type: pdfInput.blob?.type || null,
        size: pdfInput.blob?.size ?? null,
        url: pdfInput.url || null,
      }
      : null,
  };

  if (details) Object.assign(logDetails, details);
  _clipboardLog("debug", message, logDetails);
  return pdfInput;
}

function _clipboardExtractTextInputFromValues({plainText = "", html = ""} = {}) {
  const normalizedPlainText = _clipboardNormalizePastedText(plainText);
  if (normalizedPlainText) return {text: normalizedPlainText};
  if (!html?.trim()) return null;

  const extractedText = _clipboardExtractTextFromHtml(html);
  return extractedText ? {text: extractedText} : null;
}

function _clipboardExtractImageInputFromValues(
  {blob = null, uriList = "", html = "", plainText = ""} = {},
  {
    blobMessage,
    uriListMessage,
    htmlMessage,
    plainTextMessage,
    details,
  } = {}
) {
  const urlCandidate = _clipboardGetUrlBackedImageInputCandidate({
    uriList,
    html,
    plainText,
  }, {
    uriListMessage,
    htmlMessage,
    plainTextMessage,
  });

  if (blob && urlCandidate && _clipboardShouldPreferUrlCandidateOverBlob(blob, urlCandidate.imageInput)) {
    return _clipboardCreateLoggedImageInput({
      ...urlCandidate.imageInput,
      fallbackBlob: blob,
    }, "Preferred a direct animated-media URL over a rasterized pasted blob", details);
  }

  if (blob) return _clipboardCreateLoggedImageInput({blob}, blobMessage, details);

  if (urlCandidate) return _clipboardCreateLoggedImageInput(urlCandidate.imageInput, urlCandidate.message, details);

  return null;
}

function _clipboardExtractPdfInputFromValues(
  {blob = null, uriList = "", html = "", plainText = ""} = {},
  {
    blobMessage,
    uriListMessage,
    htmlMessage,
    plainTextMessage,
    details,
  } = {}
) {
  const pdfBlob = _clipboardCoercePdfFile(blob, {
    filename: blob?.name,
    mimeType: blob?.type,
  });
  if (pdfBlob) return _clipboardCreateLoggedPdfInput({blob: pdfBlob}, blobMessage, details);

  const urlCandidate = _clipboardGetUrlBackedPdfInputCandidate({
    uriList,
    html,
    plainText,
  }, {
    uriListMessage,
    htmlMessage,
    plainTextMessage,
  });
  if (urlCandidate) return _clipboardCreateLoggedPdfInput(urlCandidate.pdfInput, urlCandidate.message, details);

  return null;
}

async function _clipboardExtractImageInput(clipItems) {
  return _clipboardExtractImageInputFromValues({
    blob: await _clipboardExtractImageBlob(clipItems),
    uriList: await _clipboardReadClipboardText(clipItems, "text/uri-list"),
    html: await _clipboardReadClipboardText(clipItems, "text/html"),
    plainText: await _clipboardReadClipboardText(clipItems, "text/plain"),
  }, {
    blobMessage: "Resolved media input from async clipboard file data",
    uriListMessage: "Resolved media input from async clipboard uri-list",
    htmlMessage: "Resolved media input from async clipboard HTML",
    plainTextMessage: "Resolved media input from async clipboard plain text",
  });
}

async function _clipboardExtractPdfInput(clipItems) {
  return _clipboardExtractPdfInputFromValues({
    blob: await _clipboardExtractPdfBlob(clipItems),
    uriList: await _clipboardReadClipboardText(clipItems, "text/uri-list"),
    html: await _clipboardReadClipboardText(clipItems, "text/html"),
    plainText: await _clipboardReadClipboardText(clipItems, "text/plain"),
  }, {
    blobMessage: "Resolved PDF input from async clipboard file data",
    uriListMessage: "Resolved PDF input from async clipboard uri-list",
    htmlMessage: "Resolved PDF input from async clipboard HTML",
    plainTextMessage: "Resolved PDF input from async clipboard plain text",
  });
}

function _clipboardExtractImageBlobFromDataTransfer(dataTransfer) {
  for (const item of dataTransfer?.items || []) {
    if (item.kind !== "file") continue;

    const file = item.getAsFile();
    const typedFile = _clipboardCoerceMediaFile(file, {
      filename: file?.name,
      mimeType: item.type,
    });
    if (typedFile && _clipboardIsSupportedMediaBlob(typedFile)) return typedFile;
  }

  for (const file of dataTransfer?.files || []) {
    const typedFile = _clipboardCoerceMediaFile(file, {
      filename: file?.name,
      mimeType: file?.type,
    });
    if (typedFile && _clipboardIsSupportedMediaBlob(typedFile)) return typedFile;
  }

  return null;
}

function _clipboardExtractPdfBlobFromDataTransfer(dataTransfer) {
  for (const item of dataTransfer?.items || []) {
    if (item.kind !== "file") continue;

    const file = item.getAsFile();
    const typedFile = _clipboardCoercePdfFile(file, {
      filename: file?.name,
      mimeType: item.type,
    });
    if (typedFile) return typedFile;
  }

  for (const file of dataTransfer?.files || []) {
    const typedFile = _clipboardCoercePdfFile(file, {
      filename: file?.name,
      mimeType: file?.type,
    });
    if (typedFile) return typedFile;
  }

  return null;
}

function _clipboardReadDataTransferText(dataTransfer, mimeType) {
  return dataTransfer?.getData?.(mimeType) || "";
}

function _clipboardExtractTextInputFromDataTransfer(dataTransfer) {
  return _clipboardExtractTextInputFromValues({
    plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain"),
    html: _clipboardReadDataTransferText(dataTransfer, "text/html"),
  });
}

function _clipboardExtractImageInputFromDataTransfer(dataTransfer) {
  return _clipboardExtractImageInputFromValues({
    blob: _clipboardExtractImageBlobFromDataTransfer(dataTransfer),
    uriList: _clipboardReadDataTransferText(dataTransfer, "text/uri-list"),
    html: _clipboardReadDataTransferText(dataTransfer, "text/html"),
    plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain"),
  }, {
    blobMessage: "Resolved media input from paste/drop file data",
    uriListMessage: "Resolved media input from paste/drop uri-list",
    htmlMessage: "Resolved media input from paste/drop HTML",
    plainTextMessage: "Resolved media input from paste/drop plain text URL",
    details: {
      dataTransfer: _clipboardDescribeDataTransfer(dataTransfer),
    },
  });
}

function _clipboardExtractPdfInputFromDataTransfer(dataTransfer) {
  return _clipboardExtractPdfInputFromValues({
    blob: _clipboardExtractPdfBlobFromDataTransfer(dataTransfer),
    uriList: _clipboardReadDataTransferText(dataTransfer, "text/uri-list"),
    html: _clipboardReadDataTransferText(dataTransfer, "text/html"),
    plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain"),
  }, {
    blobMessage: "Resolved PDF input from paste/drop file data",
    uriListMessage: "Resolved PDF input from paste/drop uri-list",
    htmlMessage: "Resolved PDF input from paste/drop HTML",
    plainTextMessage: "Resolved PDF input from paste/drop plain text URL",
    details: {
      dataTransfer: _clipboardDescribeDataTransfer(dataTransfer),
    },
  });
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

function _clipboardResolveInsertionTarget(target) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    return target;
  }

  if (target?.isContentEditable) {
    return target;
  }

  if (target?.querySelector) {
    const editableDescendant = target.querySelector('[contenteditable="true"]');
    if (editableDescendant) return editableDescendant;
  }

  if (target?.closest) {
    return target.closest('[contenteditable="true"]');
  }

  return null;
}

function _clipboardSelectionBelongsToTarget(selection, target) {
  if (!selection?.rangeCount) return false;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  return container === target || target?.contains?.(container);
}

function _clipboardCreateCollapsedRangeAtTargetEnd(target) {
  const range = document.createRange();
  range.setStart(target, target.childNodes.length);
  range.collapse(true);
  return range;
}

function _clipboardInsertTextAtTarget(target, text) {
  if (!text) return false;

  const insertionTarget = _clipboardResolveInsertionTarget(target);

  if (insertionTarget instanceof HTMLTextAreaElement || insertionTarget instanceof HTMLInputElement) {
    const start = Number.isInteger(insertionTarget.selectionStart) ? insertionTarget.selectionStart : insertionTarget.value.length;
    const end = Number.isInteger(insertionTarget.selectionEnd) ? insertionTarget.selectionEnd : start;
    insertionTarget.focus();
    insertionTarget.setRangeText(text, start, end, "end");
    insertionTarget.dispatchEvent(new Event("input", {bubbles: true}));
    return true;
  }

  if (insertionTarget?.isContentEditable) {
    insertionTarget.focus();
    const selection = window.getSelection();
    if (!selection) return false;

    if (!_clipboardSelectionBelongsToTarget(selection, insertionTarget)) {
      const range = _clipboardCreateCollapsedRangeAtTargetEnd(insertionTarget);
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
    insertionTarget.dispatchEvent(new Event("input", {bubbles: true}));
    return true;
  }

  return false;
}

module.exports = {
  _clipboardReadClipboardItems,
  _clipboardExtractImageBlob,
  _clipboardExtractPdfBlob,
  _clipboardReadClipboardText,
  _clipboardExtractTextInput,
  _clipboardExtractImageUrlFromUriList,
  _clipboardExtractImageUrlFromText,
  _clipboardExtractImageUrlFromHtml,
  _clipboardLooksLikePdfUrl,
  _clipboardExtractPdfUrlFromUriList,
  _clipboardExtractPdfUrlFromText,
  _clipboardExtractPdfUrlFromHtml,
  _clipboardGetUrlBackedImageInputCandidate,
  _clipboardGetUrlBackedPdfInputCandidate,
  _clipboardIsAnimationCapableUrl,
  _clipboardIsLikelyRasterizedImageBlob,
  _clipboardShouldPreferUrlCandidateOverBlob,
  _clipboardCreateLoggedImageInput,
  _clipboardCreateLoggedPdfInput,
  _clipboardExtractTextInputFromValues,
  _clipboardExtractImageInputFromValues,
  _clipboardExtractPdfInputFromValues,
  _clipboardExtractImageInput,
  _clipboardExtractPdfInput,
  _clipboardExtractImageBlobFromDataTransfer,
  _clipboardExtractPdfBlobFromDataTransfer,
  _clipboardReadDataTransferText,
  _clipboardExtractTextInputFromDataTransfer,
  _clipboardExtractImageInputFromDataTransfer,
  _clipboardExtractPdfInputFromDataTransfer,
  _clipboardGetChatRootFromTarget,
  _clipboardIsEditableTarget,
  _clipboardInsertTextAtTarget,
};
