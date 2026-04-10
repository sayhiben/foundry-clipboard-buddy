// @ts-check

const {
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO,
  CLIPBOARD_IMAGE_MODULE_ID,
} = require("../constants");
const {_clipboardGetKnownUploadRoots} = require("./known-roots");

/**
 * @typedef {import("../contracts").MediaAuditReference} MediaAuditReference
 * @typedef {import("../contracts").MediaAuditReport} MediaAuditReport
 * @typedef {import("../contracts").UploadRoot} UploadRoot
 */

function _clipboardNormalizeAuditPath(path) {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";

  try {
    const parsedUrl = new URL(rawPath, globalThis.location?.origin || "http://localhost");
    return parsedUrl.pathname.replace(/^\/+/, "");
  } catch (_error) {
    return rawPath
      .replaceAll("\\", "/")
      .replace(/^\/+/, "")
      .replace(/[?#].*$/, "");
  }
}

/**
 * @param {string} path
 * @param {UploadRoot[]} uploadRoots
 * @returns {UploadRoot | null}
 */
function _clipboardMatchUploadRoot(path, uploadRoots) {
  const normalizedPath = _clipboardNormalizeAuditPath(path);
  if (!normalizedPath) return null;

  return uploadRoots.find(root => normalizedPath === root.target || normalizedPath.startsWith(`${root.target}/`)) || null;
}

function _clipboardInferAuditContext(path, uploadRoot, fallbackContext) {
  const normalizedPath = _clipboardNormalizeAuditPath(path);
  if (!normalizedPath || !uploadRoot) return fallbackContext;

  const relativePath = normalizedPath.slice(uploadRoot.target.length).replace(/^\/+/, "");
  const leadingSegment = relativePath.split("/")[0];
  if (
    leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS ||
    leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT ||
    leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART ||
    leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF ||
    leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO
  ) {
    return leadingSegment;
  }
  return fallbackContext;
}

function _clipboardCollectChatMessagePaths(message) {
  const content = String(message?.content || "");
  if (!content.includes("foundry-paste-eater-chat-message")) return [];

  const container = document.createElement("div");
  container.innerHTML = content;
  const elements = Array.from(container.querySelectorAll("img[src], video[src], audio[src], source[src], a[href]"));
  const paths = new Set();
  for (const element of elements) {
    const value = element.getAttribute("src") || element.getAttribute("href") || "";
    if (!value) continue;
    paths.add(value);
  }
  return Array.from(paths);
}

function _clipboardCreateAuditReference({
  path,
  documentType,
  documentId,
  documentName,
  field,
  uploadRoot,
  fallbackContext,
  sceneId = null,
  sceneName = null,
  messageId = null,
}) {
  if (!uploadRoot) return null;
  const normalizedPath = _clipboardNormalizeAuditPath(path);
  if (!normalizedPath) return null;

  return {
    context: _clipboardInferAuditContext(path, uploadRoot, fallbackContext),
    documentType,
    documentId,
    documentName,
    field,
    path,
    normalizedPath,
    uploadRootKey: uploadRoot.key,
    uploadRootLabel: uploadRoot.label,
    sceneId,
    sceneName,
    messageId,
  };
}

function _clipboardCollectDocumentMediaReferences(document, uploadRoots, options) {
  const path = document?.texture?.src || document?.img || "";
  const uploadRoot = _clipboardMatchUploadRoot(path, uploadRoots);
  const reference = _clipboardCreateAuditReference({
    path,
    uploadRoot,
    ...options,
  });
  return reference ? [reference] : [];
}

function _clipboardCollectJournalPdfPageReferences(entry, page, uploadRoots) {
  if (page?.type !== "pdf") return [];

  const references = [];
  const pdfPath = page.src || "";
  const pdfRoot = _clipboardMatchUploadRoot(pdfPath, uploadRoots);
  const pdfReference = _clipboardCreateAuditReference({
    path: pdfPath,
    documentType: "JournalEntryPage",
    documentId: page.id,
    documentName: page.name || entry?.name || page.id,
    field: "src",
    uploadRoot: pdfRoot,
    fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF,
  });
  if (pdfReference) references.push(pdfReference);

  const previewPath = page.flags?.[CLIPBOARD_IMAGE_MODULE_ID]?.pdfPreview || "";
  const previewRoot = _clipboardMatchUploadRoot(previewPath, uploadRoots);
  const previewReference = _clipboardCreateAuditReference({
    path: previewPath,
    documentType: "JournalEntryPage",
    documentId: page.id,
    documentName: page.name || entry?.name || page.id,
    field: "flags.foundry-paste-eater.pdfPreview",
    uploadRoot: previewRoot,
    fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_PDF,
  });
  if (previewReference) references.push(previewReference);

  return references;
}

/**
 * @returns {MediaAuditReport}
 */
function _clipboardCollectMediaAuditReport() {
  const uploadRoots = _clipboardGetKnownUploadRoots({includeCurrent: true});
  /** @type {MediaAuditReference[]} */
  const references = [];

  for (const actor of game?.actors?.contents || []) {
    references.push(..._clipboardCollectDocumentMediaReferences(actor, uploadRoots, {
      documentType: "Actor",
      documentId: actor.id,
      documentName: actor.name || actor.id,
      field: "img",
      fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
    }));

    const prototypePath = actor?.prototypeToken?.texture?.src || "";
    const prototypeRoot = _clipboardMatchUploadRoot(prototypePath, uploadRoots);
    const prototypeReference = _clipboardCreateAuditReference({
      path: prototypePath,
      documentType: "Actor",
      documentId: actor.id,
      documentName: actor.name || actor.id,
      field: "prototypeToken.texture.src",
      uploadRoot: prototypeRoot,
      fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
    });
    if (prototypeReference) references.push(prototypeReference);
  }

  for (const scene of game?.scenes?.contents || []) {
    for (const token of scene?.tokens?.contents || []) {
      references.push(..._clipboardCollectDocumentMediaReferences(token, uploadRoots, {
        documentType: "Token",
        documentId: token.id,
        documentName: token.name || token.id,
        field: "texture.src",
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        sceneId: scene.id || null,
        sceneName: scene.name || null,
      }));
    }

    for (const tile of scene?.tiles?.contents || []) {
      references.push(..._clipboardCollectDocumentMediaReferences(tile, uploadRoots, {
        documentType: "Tile",
        documentId: tile.id,
        documentName: tile.name || tile.id,
        field: "texture.src",
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        sceneId: scene.id || null,
        sceneName: scene.name || null,
      }));
    }

    for (const note of scene?.notes?.contents || []) {
      references.push(..._clipboardCollectDocumentMediaReferences(note, uploadRoots, {
        documentType: "Note",
        documentId: note.id,
        documentName: note.text || note.name || note.id,
        field: "texture.src",
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        sceneId: scene.id || null,
        sceneName: scene.name || null,
      }));
    }

    for (const sound of scene?.sounds?.contents || []) {
      const soundPath = sound?.path || "";
      const soundRoot = _clipboardMatchUploadRoot(soundPath, uploadRoots);
      const soundReference = _clipboardCreateAuditReference({
        path: soundPath,
        documentType: "AmbientSound",
        documentId: sound.id,
        documentName: sound.name || sound.id,
        field: "path",
        uploadRoot: soundRoot,
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO,
        sceneId: scene.id || null,
        sceneName: scene.name || null,
      });
      if (soundReference) references.push(soundReference);
    }
  }

  for (const playlist of game?.playlists?.contents || []) {
    for (const sound of playlist?.sounds?.contents || []) {
      const soundPath = sound?.path || "";
      const soundRoot = _clipboardMatchUploadRoot(soundPath, uploadRoots);
      const soundReference = _clipboardCreateAuditReference({
        path: soundPath,
        documentType: "PlaylistSound",
        documentId: sound.id,
        documentName: sound.name || playlist?.name || sound.id,
        field: "path",
        uploadRoot: soundRoot,
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO,
      });
      if (soundReference) references.push(soundReference);
    }
  }

  for (const entry of game?.journal?.contents || []) {
    for (const page of entry?.pages?.contents || []) {
      references.push(..._clipboardCollectJournalPdfPageReferences(entry, page, uploadRoots));
    }
  }

  for (const message of game?.messages?.contents || []) {
    const messageSound = message?.sound || "";
    const messageSoundRoot = _clipboardMatchUploadRoot(messageSound, uploadRoots);
    const messageSoundReference = _clipboardCreateAuditReference({
      path: messageSound,
      documentType: "ChatMessage",
      documentId: message.id,
      documentName: message.speaker?.alias || message.id,
      field: "sound",
      uploadRoot: messageSoundRoot,
      fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO,
      messageId: message.id,
    });
    if (messageSoundReference) references.push(messageSoundReference);

    for (const path of _clipboardCollectChatMessagePaths(message)) {
      const uploadRoot = _clipboardMatchUploadRoot(path, uploadRoots);
      const reference = _clipboardCreateAuditReference({
        path,
        documentType: "ChatMessage",
        documentId: message.id,
        documentName: message.speaker?.alias || message.id,
        field: "content",
        uploadRoot,
        fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
        messageId: message.id,
      });
      if (reference) references.push(reference);
    }
  }

  const groupsMap = new Map();
  for (const reference of references) {
    const groupKey = [reference.uploadRootKey, reference.context, reference.documentType].join("|");
    const existingGroup = groupsMap.get(groupKey) || {
      key: groupKey,
      context: reference.context,
      documentType: reference.documentType,
      uploadRootKey: reference.uploadRootKey,
      uploadRootLabel: reference.uploadRootLabel,
      references: [],
    };
    existingGroup.references.push(reference);
    groupsMap.set(groupKey, existingGroup);
  }

  const groups = Array.from(groupsMap.values())
    .map(group => ({
      ...group,
      references: group.references.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath)),
    }))
    .sort((left, right) => left.uploadRootLabel.localeCompare(right.uploadRootLabel) ||
      left.context.localeCompare(right.context) ||
      left.documentType.localeCompare(right.documentType));

  return {
    generatedAt: new Date().toISOString(),
    uploadRoots,
    references: references.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath)),
    groups,
    summary: {
      referenceCount: references.length,
      groupCount: groups.length,
      rootCount: uploadRoots.length,
    },
  };
}

function _clipboardCreateMediaAuditFile(report = _clipboardCollectMediaAuditReport()) {
  const safeTimestamp = report.generatedAt.replaceAll(":", "-");
  const filename = `foundry-paste-eater-media-audit-${safeTimestamp}.json`;
  const content = JSON.stringify(report, null, 2);
  const url = globalThis.URL?.createObjectURL?.(new Blob([content], {type: "application/json"})) || "";
  return {filename, content, url};
}

function _clipboardDownloadMediaAuditReport(report = _clipboardCollectMediaAuditReport()) {
  const file = _clipboardCreateMediaAuditFile(report);
  if (!file.content) return file;

  if (typeof globalThis.saveDataToFile === "function") {
    globalThis.saveDataToFile(file.content, "application/json", file.filename);
    return file;
  }

  if (file.url && globalThis.document?.body) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  return file;
}

module.exports = {
  _clipboardNormalizeAuditPath,
  _clipboardMatchUploadRoot,
  _clipboardInferAuditContext,
  _clipboardCollectChatMessagePaths,
  _clipboardCreateAuditReference,
  _clipboardCollectDocumentMediaReferences,
  _clipboardCollectJournalPdfPageReferences,
  _clipboardCollectMediaAuditReport,
  _clipboardCreateMediaAuditFile,
  _clipboardDownloadMediaAuditReport,
};
