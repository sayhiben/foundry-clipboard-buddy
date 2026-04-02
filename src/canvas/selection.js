const {_clipboardLog} = require("../diagnostics");
const {_clipboardCanReplaceDocument} = require("./eligibility");

function _clipboardHasCopiedObjects() {
  const layer = canvas?.activeLayer;
  return Boolean(layer?.clipboard?.objects?.length);
}

function _clipboardGetControlledPlaceables(layer) {
  const controlledObjects = layer?.controlledObjects;
  if (controlledObjects?.size && typeof controlledObjects.values === "function") {
    return Array.from(controlledObjects.values()).filter(Boolean);
  }

  const controlled = layer?.controlled;
  if (Array.isArray(controlled)) return controlled.filter(Boolean);
  if (controlled instanceof Map) return Array.from(controlled.values()).filter(Boolean);
  if (controlled instanceof Set) return Array.from(controlled.values()).filter(Boolean);
  if (controlled && typeof controlled.values === "function") {
    return Array.from(controlled.values()).filter(Boolean);
  }
  if (controlled && typeof controlled[Symbol.iterator] === "function") {
    return Array.from(controlled).filter(Boolean);
  }

  return [];
}

const CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
  Token: ["Token", "Tile", "Note"],
  Tile: ["Tile", "Token", "Note"],
  Note: ["Note", "Token", "Tile"],
};

function _clipboardGetReplacementOrder(activeDocumentName = "Tile") {
  return CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName] || CLIPBOARD_IMAGE_REPLACEMENT_ORDER.Tile;
}

function _clipboardGetActiveDocumentName() {
  if (canvas?.activeLayer === canvas?.tokens) return "Token";
  if (canvas?.activeLayer === canvas?.notes) return "Note";
  return "Tile";
}

function _clipboardResolveReplacementTargetFromCandidates(activeDocumentName = _clipboardGetActiveDocumentName(), replacementCandidates = {}) {
  for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
    const candidate = replacementCandidates?.[documentName] || null;
    const requestedCount = candidate?.requestedCount ?? candidate?.documents?.length ?? 0;
    if (!requestedCount) continue;

    const documents = Array.isArray(candidate?.documents)
      ? candidate.documents.filter(Boolean)
      : [];

    return {
      documentName,
      documents,
      requestedCount,
      blocked: documents.length < 1,
    };
  }

  return null;
}

function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
  const layerLookup = {
    Token: canvas?.tokens,
    Tile: canvas?.tiles,
    Note: canvas?.notes,
  };
  const replacementCandidates = {};

  for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
    const layer = layerLookup[documentName];
    const controlledPlaceables = _clipboardGetControlledPlaceables(layer);
    const documents = controlledPlaceables.map(placeable => placeable.document).filter(Boolean);
    _clipboardLog("debug", "Evaluating controlled placeables for replacement", {
      activeDocumentName,
      candidateDocumentName: documentName,
      layerName: layer?.options?.name || layer?.name || null,
      controlledType: layer?.controlled?.constructor?.name || typeof layer?.controlled,
      controlledCount: controlledPlaceables.length,
      controlledIds: controlledPlaceables.map(placeable => placeable.document?.id || placeable.id || null),
      controlledObjectsSize: layer?.controlledObjects?.size ?? null,
    });
    if (!documents.length) continue;

    const eligibleDocuments = documents.filter(document => _clipboardCanReplaceDocument(documentName, document));
    _clipboardLog("debug", "Resolved eligible replacement documents", {
      activeDocumentName,
      candidateDocumentName: documentName,
      requestedCount: documents.length,
      eligibleIds: eligibleDocuments.map(document => document.id),
      blocked: eligibleDocuments.length < 1,
    });
    replacementCandidates[documentName] = {
      documents: eligibleDocuments,
      requestedCount: documents.length,
    };
  }

  return _clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates);
}

module.exports = {
  _clipboardHasCopiedObjects,
  _clipboardGetControlledPlaceables,
  _clipboardGetReplacementOrder,
  _clipboardGetActiveDocumentName,
  _clipboardResolveReplacementTargetFromCandidates,
  _clipboardGetReplacementTarget,
};
