const {
  _clipboardDescribeImageInput,
  _clipboardLog,
} = require("./diagnostics");

const CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES = new Set([
  "img",
  "texture.src",
  "prototypeToken.texture.src",
]);
const CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS = {
  img: new Set(["Actor", "Item"]),
  "texture.src": new Set(["Token"]),
  "prototypeToken.texture.src": new Set(["Actor", "Token"]),
};
const CLIPBOARD_IMAGE_SUPPORTED_PDF_FIELD_NAMES = new Set(["src"]);

function _clipboardGetApplicationRoot(target) {
  return target?.closest?.("[data-appid], .window-app[id], .app[id], .application[id]") || null;
}

function _clipboardIterateApplicationInstances() {
  const candidates = [
    ui?.activeWindow || null,
    ...Object.values(ui?.windows || {}),
  ];
  const instances = foundry?.applications?.instances;
  if (instances?.values) {
    candidates.push(...instances.values());
  }

  const seen = new Set();
  return candidates.filter(candidate => {
    if (!candidate || seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });
}

function _clipboardResolveApplicationForRoot(appRoot) {
  if (!appRoot) return null;

  const appId = appRoot.dataset?.appid || null;
  const rootId = appRoot.id || null;

  if (appId && ui?.windows?.[appId]) {
    return ui.windows[appId];
  }

  for (const candidate of _clipboardIterateApplicationInstances()) {
    if (appId && String(candidate?.appId || "") === appId) return candidate;
    if (rootId && candidate?.id === rootId) return candidate;
  }

  return null;
}

function _clipboardGetAppFromElement(target) {
  const appRoot = _clipboardGetApplicationRoot(target);
  return {
    app: _clipboardResolveApplicationForRoot(appRoot),
    appRoot,
  };
}

function _clipboardGetArtFieldName(target) {
  const picker = target?.closest?.("file-picker[name]") || null;
  const candidates = [
    target?.name,
    target?.dataset?.edit,
    picker?.getAttribute?.("name"),
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    if (CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES.has(normalized)) return normalized;
  }

  return null;
}

function _clipboardGetPdfFieldName(target) {
  const picker = target?.closest?.("file-picker[name]") || null;
  const candidates = [
    target?.name,
    target?.dataset?.edit,
    picker?.getAttribute?.("name"),
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    if (CLIPBOARD_IMAGE_SUPPORTED_PDF_FIELD_NAMES.has(normalized)) return normalized;
  }

  return null;
}

function _clipboardGetArtFieldMediaKinds(fieldName) {
  if (fieldName === "img") return ["image"];
  return ["image", "video"];
}

function _clipboardCanPopulateArtField(documentName, fieldName) {
  const allowedDocuments = CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS[fieldName];
  if (!allowedDocuments) return false;
  return allowedDocuments.has(documentName);
}

function _clipboardGetFocusedArtFieldTarget(target = document.activeElement) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return null;

  const fieldName = _clipboardGetArtFieldName(target);
  if (!fieldName) return null;

  const {app, appRoot} = _clipboardGetAppFromElement(target);
  const documentName = app?.document?.documentName || app?.object?.documentName || null;

  if (!_clipboardCanPopulateArtField(documentName, fieldName)) return null;

  return {
    field: target,
    fieldName,
    mediaKinds: _clipboardGetArtFieldMediaKinds(fieldName),
    picker: target.closest?.("file-picker[name]") || null,
    app,
    appRoot,
    documentName,
  };
}

function _clipboardGetFocusedPdfFieldTarget(target = document.activeElement) {
  const field = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    ? target
    : target?.closest?.("file-picker[name]")?.querySelector?.("input, textarea") || null;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return null;

  const fieldName = _clipboardGetPdfFieldName(field) || _clipboardGetPdfFieldName(target);
  if (!fieldName) return null;

  const {app, appRoot} = _clipboardGetAppFromElement(field);
  const pageDocument = app?.document || app?.object || null;
  const documentName = pageDocument?.documentName || null;
  if (documentName !== "JournalEntryPage" || pageDocument?.type !== "pdf") return null;

  return {
    field,
    fieldName,
    picker: field.closest?.("file-picker[name]") || null,
    app,
    appRoot,
    document: pageDocument,
    documentName,
  };
}

function _clipboardReloadMediaPreview(element) {
  if (!element?.load) return;
  if (/jsdom/i.test(globalThis.navigator?.userAgent || "") &&
      element.load === globalThis.HTMLMediaElement?.prototype?.load) {
    return;
  }

  try {
    element.load();
  } catch {
    // jsdom does not implement HTMLMediaElement.load(); browsers do.
  }
}

function _clipboardSetFormFieldValue(field, value) {
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return false;

  const picker = field.closest?.("file-picker[name]") || null;
  field.focus({preventScroll: true});
  field.value = value;
  field.dispatchEvent(new Event("input", {bubbles: true}));
  field.dispatchEvent(new Event("change", {bubbles: true}));

  if (picker) {
    picker.value = value;
    picker.dispatchEvent(new Event("input", {bubbles: true}));
    picker.dispatchEvent(new Event("change", {bubbles: true}));
  }
  return true;
}

function _clipboardUpdateArtFieldPreview(targetInfo, value) {
  const previewSelector = `[data-edit="${targetInfo.fieldName}"]`;
  for (const element of targetInfo.appRoot?.querySelectorAll?.(previewSelector) || []) {
    if (element === targetInfo.field) continue;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
      continue;
    }

    if (element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLSourceElement) {
      element.src = value;
      if (element instanceof HTMLVideoElement) {
        _clipboardReloadMediaPreview(element);
        continue;
      }
      if (element instanceof HTMLSourceElement) {
        _clipboardReloadMediaPreview(element.parentElement);
      }
    }
  }
}

function _clipboardPopulateArtFieldTarget(targetInfo, value, imageInput = null) {
  if (!targetInfo || !value) return false;

  const updated = _clipboardSetFormFieldValue(targetInfo.field, value);
  if (!updated) return false;

  _clipboardUpdateArtFieldPreview(targetInfo, value);
  _clipboardLog("info", "Populated a focused document art field from pasted media", {
    documentName: targetInfo.documentName,
    fieldName: targetInfo.fieldName,
    value,
    imageInput: _clipboardDescribeImageInput(imageInput),
  });
  return true;
}

function _clipboardPopulatePdfFieldTarget(targetInfo, value, pdfInput = null) {
  if (!targetInfo || !value) return false;

  const updated = _clipboardSetFormFieldValue(targetInfo.field, value);
  if (!updated) return false;

  _clipboardLog("info", "Populated a focused PDF journal page source field", {
    documentName: targetInfo.documentName,
    fieldName: targetInfo.fieldName,
    value,
    pdfInput: pdfInput
      ? {
        source: pdfInput.blob ? "blob" : "url",
        name: pdfInput.blob?.name || null,
        type: pdfInput.blob?.type || null,
        size: pdfInput.blob?.size ?? null,
        url: pdfInput.url || null,
      }
      : null,
  });
  return true;
}

module.exports = {
  CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES,
  CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS,
  CLIPBOARD_IMAGE_SUPPORTED_PDF_FIELD_NAMES,
  _clipboardGetApplicationRoot,
  _clipboardIterateApplicationInstances,
  _clipboardResolveApplicationForRoot,
  _clipboardGetAppFromElement,
  _clipboardGetArtFieldName,
  _clipboardGetPdfFieldName,
  _clipboardGetArtFieldMediaKinds,
  _clipboardCanPopulateArtField,
  _clipboardGetFocusedArtFieldTarget,
  _clipboardGetFocusedPdfFieldTarget,
  _clipboardReloadMediaPreview,
  _clipboardSetFormFieldValue,
  _clipboardUpdateArtFieldPreview,
  _clipboardPopulateArtFieldTarget,
  _clipboardPopulatePdfFieldTarget,
};
