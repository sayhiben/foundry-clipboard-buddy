const {CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF} = require("../constants");
const {
  _clipboardDescribeDestinationForLog,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {
  _clipboardGetFilenameExtension,
  _clipboardGetFilenameFromUrl,
  _clipboardNormalizeMimeType,
} = require("../media");
const {
  _clipboardLooksLikePdfUrl,
} = require("../clipboard");
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardResolvePdfInputBlob,
  _clipboardUploadBlob,
  _clipboardUploadPdfBlob,
  _clipboardCreateFreshMediaPath,
} = require("../storage");
const {
  _clipboardCanUserModifyDocument,
  _clipboardGetControlledPlaceables,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardResolvePasteContext,
} = require("../context");
const {
  _clipboardCanUseCanvasText,
  _clipboardCanUseChatMedia,
} = require("../settings");
const {
  _clipboardAppendPdfPageToSceneNote,
  _clipboardCreatePdfJournalEntry,
  _clipboardCreateStandalonePdfNote,
} = require("../notes");
const {_clipboardCreatePdfChatMessage} = require("../chat");
const {
  _clipboardGetFocusedPdfFieldTarget,
  _clipboardPopulatePdfFieldTarget,
} = require("../field-targets");
const {
  _clipboardAnnotateWorkflowError,
} = require("./helpers");

function _clipboardDescribePdfInput(pdfInput) {
  if (!pdfInput) return null;
  if (pdfInput.blob) {
    return {
      source: "blob",
      name: pdfInput.blob.name || null,
      type: pdfInput.blob.type || null,
      size: pdfInput.blob.size ?? null,
    };
  }
  return {
    source: "url",
    url: pdfInput.url || null,
  };
}

function _clipboardGetPdfFilename(pdfInput = {}, blob = null) {
  const candidate = blob?.name ||
    pdfInput.blob?.name ||
    _clipboardGetFilenameFromUrl(pdfInput.url) ||
    "Pasted PDF.pdf";
  return _clipboardGetFilenameExtension(candidate) === "pdf"
    ? candidate
    : `${candidate.replace(/\.[^./]+$/, "") || "Pasted PDF"}.pdf`;
}

function _clipboardGetPdfDisplayName(pdfInput = {}, blob = null) {
  return _clipboardGetPdfFilename(pdfInput, blob).replace(/\.pdf$/i, "") || "Pasted PDF";
}

function _clipboardSanitizePdfPreviewBaseName(name) {
  return String(name || "pasted-pdf")
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "pasted-pdf";
}

function _clipboardIsBlockedDirectPdfUrlDownload(pdfInput, error) {
  return Boolean(
    pdfInput?.url &&
    error instanceof Error &&
    error.message.startsWith("Failed to download pasted PDF URL from ")
  );
}

function _clipboardCanUseExternalPdfUrlFallback(pdfInput, error) {
  return Boolean(
    _clipboardIsBlockedDirectPdfUrlDownload(pdfInput, error) &&
    _clipboardLooksLikePdfUrl(pdfInput.url)
  );
}

async function _clipboardRenderPdfPreviewBlobWithPdfJs(pdfInput, blob, name) {
  const pdfjs = globalThis.pdfjsLib || globalThis.PDFJS || null;
  if (!pdfjs?.getDocument || typeof document === "undefined" || typeof document.createElement !== "function") return null;

  const source = blob
    ? {data: new Uint8Array(await _clipboardReadPdfPreviewArrayBuffer(blob))}
    : pdfInput?.url || null;
  if (!source) return null;

  const loadingTask = pdfjs.getDocument(source);
  const pdfDocument = await (loadingTask?.promise || loadingTask);
  const firstPage = await pdfDocument.getPage(1);
  const baseViewport = firstPage.getViewport({scale: 1});
  const scale = Math.min(1, 360 / Math.max(baseViewport.width || 360, 1));
  const viewport = firstPage.getViewport({scale});
  const canvasElement = document.createElement("canvas");
  canvasElement.width = Math.ceil(viewport.width);
  canvasElement.height = Math.ceil(viewport.height);
  const context = canvasElement.getContext("2d");
  if (!context) return null;

  const renderTask = firstPage.render({canvasContext: context, viewport});
  await (renderTask?.promise || renderTask);

  const previewBlob = await new Promise(resolve => {
    canvasElement.toBlob(resolve, "image/png");
  });
  if (!previewBlob) return null;

  return new File(
    [previewBlob],
    `${_clipboardSanitizePdfPreviewBaseName(name)}-preview.png`,
    {type: "image/png"}
  );
}

async function _clipboardReadPdfPreviewArrayBuffer(blob) {
  if (typeof blob?.arrayBuffer === "function") return blob.arrayBuffer();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read PDF preview data"));
    reader.readAsArrayBuffer(blob);
  });
}

async function _clipboardTryCreatePdfPreviewBlob(pdfInput, blob = pdfInput?.blob || null, name = "") {
  try {
    return await _clipboardRenderPdfPreviewBlobWithPdfJs(pdfInput, blob, name);
  } catch (error) {
    _clipboardLog("debug", "PDF preview generation failed; continuing with the generic PDF icon fallback", {
      pdfInput: _clipboardDescribePdfInput(pdfInput),
      error: _clipboardSerializeError(error),
    });
    return null;
  }
}

async function _clipboardTryUploadPdfPreviewBlob(previewBlob, destination) {
  if (!previewBlob) return "";

  try {
    const previewPath = await _clipboardUploadBlob(previewBlob, destination);
    return _clipboardCreateFreshMediaPath(previewPath);
  } catch (error) {
    _clipboardLog("warn", "PDF preview upload failed; continuing with the generic PDF icon fallback", {
      destination: _clipboardDescribeDestinationForLog(destination),
      error: _clipboardSerializeError(error),
    });
    return "";
  }
}

async function _clipboardResolvePdfResource(pdfInput) {
  if (!pdfInput) return null;

  let blob = pdfInput.blob || null;
  let external = false;
  let src = "";

  try {
    blob = blob || await _clipboardResolvePdfInputBlob(pdfInput);
  } catch (error) {
    if (!_clipboardCanUseExternalPdfUrlFallback(pdfInput, error)) throw error;

    external = true;
    src = pdfInput.url;
    _clipboardLog("warn", "Direct PDF URL download failed; falling back to the original PDF URL", {
      pdfInput: _clipboardDescribePdfInput(pdfInput),
      error: _clipboardSerializeError(error),
    });
  }

  const name = _clipboardGetPdfDisplayName(pdfInput, blob);
  if (external) {
    return {
      src,
      name,
      previewSrc: "",
      external: true,
    };
  }

  if (!blob) return null;

  const destination = _clipboardGetUploadDestination({
    uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF,
  });
  await _clipboardCreateFolderIfMissing(destination);
  const uploadPath = await _clipboardUploadPdfBlob(blob, destination);
  const previewBlob = await _clipboardTryCreatePdfPreviewBlob(pdfInput, blob, name);
  const previewSrc = await _clipboardTryUploadPdfPreviewBlob(previewBlob, destination);

  _clipboardLog("info", "Resolved pasted PDF resource", {
    name,
    src: uploadPath,
    previewSrc: previewSrc || null,
    destination: _clipboardDescribeDestinationForLog(destination),
    pdfInput: _clipboardDescribePdfInput(pdfInput),
    mimeType: _clipboardNormalizeMimeType(blob.type) || null,
  });
  return {
    src: _clipboardCreateFreshMediaPath(uploadPath),
    name,
    previewSrc,
    external: false,
  };
}

function _clipboardGetControlledSceneNoteDocuments() {
  return _clipboardGetControlledPlaceables(canvas?.notes)
    .map(placeable => placeable.document)
    .filter(Boolean);
}

function _clipboardCanPastePdfToCanvasContext(context, selectedNoteDocuments) {
  if (context?.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
  if (selectedNoteDocuments.length) return true;
  return _clipboardIsMouseWithinCanvas(context?.mousePos);
}

function _clipboardGetEligiblePdfSceneNoteDocuments(selectedNoteDocuments) {
  if (!selectedNoteDocuments.length) return [];
  const ineligible = selectedNoteDocuments.filter(document => !_clipboardCanUserModifyDocument(document, "update"));
  if (ineligible.length) {
    throw new Error("Selected scene notes must be editable before a pasted PDF can be attached to them.");
  }

  const linkedEntryIneligible = selectedNoteDocuments.some(document => {
    const entry = document?.entryId ? game.journal?.get?.(document.entryId) : null;
    return entry && !_clipboardCanUserModifyDocument(entry, "update");
  });
  if (linkedEntryIneligible) {
    throw new Error("Selected scene notes must be linked to Journal entries you can update before a pasted PDF can be attached to them.");
  }

  return selectedNoteDocuments;
}

async function _clipboardHandleCanvasPdfInput(pdfInput, options = {}) {
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasText()) return false;

  try {
    const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
    const selectedNoteDocuments = _clipboardGetEligiblePdfSceneNoteDocuments(_clipboardGetControlledSceneNoteDocuments());
    if (!_clipboardCanPastePdfToCanvasContext(context, selectedNoteDocuments)) {
      _clipboardLog("info", "Skipping canvas PDF paste because the current context is not eligible", {
        context,
        selectedNoteCount: selectedNoteDocuments.length,
      });
      return false;
    }

    const pdfData = await _clipboardResolvePdfResource(pdfInput);
    if (!pdfData?.src) return false;

    if (selectedNoteDocuments.length) {
      for (const noteDocument of selectedNoteDocuments) {
        await _clipboardAppendPdfPageToSceneNote(noteDocument, pdfData);
      }
      return true;
    }

    await _clipboardCreateStandalonePdfNote(pdfData, context);
    return true;
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: "a PDF",
    });
  }
}

async function _clipboardHandleChatPdfInput(pdfInput) {
  if (!_clipboardCanUseChatMedia()) return false;

  try {
    const pdfData = await _clipboardResolvePdfResource(pdfInput);
    if (!pdfData?.src) return false;

    const {entry, page} = await _clipboardCreatePdfJournalEntry(pdfData);
    await _clipboardCreatePdfChatMessage({entry, page, pdfData});
    return true;
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: "a PDF",
    });
  }
}

async function _clipboardHandlePdfFieldInput(pdfInput, target) {
  if (!_clipboardCanUseCanvasText()) return false;

  const pdfFieldTarget = target?.field ? target : _clipboardGetFocusedPdfFieldTarget(target);
  if (!pdfFieldTarget) return false;

  try {
    const pdfData = await _clipboardResolvePdfResource(pdfInput);
    if (!pdfData?.src) return false;
    return _clipboardPopulatePdfFieldTarget(pdfFieldTarget, pdfData.src, pdfInput);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: "a PDF",
    });
  }
}

module.exports = {
  _clipboardDescribePdfInput,
  _clipboardGetPdfFilename,
  _clipboardGetPdfDisplayName,
  _clipboardSanitizePdfPreviewBaseName,
  _clipboardIsBlockedDirectPdfUrlDownload,
  _clipboardCanUseExternalPdfUrlFallback,
  _clipboardTryCreatePdfPreviewBlob,
  _clipboardResolvePdfResource,
  _clipboardGetControlledSceneNoteDocuments,
  _clipboardCanPastePdfToCanvasContext,
  _clipboardGetEligiblePdfSceneNoteDocuments,
  _clipboardHandleCanvasPdfInput,
  _clipboardHandleChatPdfInput,
  _clipboardHandlePdfFieldInput,
};
