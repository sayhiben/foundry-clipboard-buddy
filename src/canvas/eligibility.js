const {
  _clipboardCanUseCanvasMedia,
  _clipboardCanCreateTokens,
  _clipboardCanCreateTiles,
  _clipboardCanReplaceTokens,
  _clipboardCanReplaceTiles,
} = require("../settings");

function _clipboardCanUserModifyDocument(document, action = "update") {
  if (!document) return false;
  if (game.user?.isGM) return true;

  if (typeof document.canUserModify === "function") {
    return Boolean(document.canUserModify(game.user, action));
  }

  if (typeof document.testUserPermission === "function") {
    return Boolean(document.testUserPermission(game.user, "OWNER"));
  }

  if (typeof document.isOwner === "boolean") {
    return document.isOwner;
  }

  return false;
}

function _clipboardCanReplaceDocument(documentName, document) {
  if (documentName === "Token") {
    if (!_clipboardCanReplaceTokens()) return false;
    if (game.user?.isGM) return true;

    return _clipboardCanUserModifyDocument(document, "update") ||
      _clipboardCanUserModifyDocument(document?.actor, "update");
  }

  if (documentName === "Tile") {
    return _clipboardCanReplaceTiles() &&
      _clipboardCanUserModifyDocument(document, "update");
  }

  if (documentName === "Note") {
    return _clipboardCanUseCanvasMedia() &&
      _clipboardCanUserModifyDocument(document, "update");
  }

  return false;
}

function _clipboardGetTokenActorArtEligibility(replacementTarget, {mediaKind = "image"} = {}) {
  if (!replacementTarget?.documents?.length || replacementTarget.documentName !== "Token") {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art only applies when selected tokens are being replaced.",
      actors: [],
      documents: [],
    };
  }

  if (mediaKind !== "image") {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art only supports pasted images. Video pastes stay scene-only.",
      actors: [],
      documents: replacementTarget.documents,
    };
  }

  if ((replacementTarget.requestedCount ?? replacementTarget.documents.length) > replacementTarget.documents.length) {
    return {
      eligible: false,
      reason: "Actor portrait + linked token art requires every selected token to be editable before anything is changed.",
      actors: [],
      documents: replacementTarget.documents,
    };
  }

  const actors = [];
  const seenActorIds = new Set();
  for (const document of replacementTarget.documents) {
    const actor = document?.actor || null;
    const actorId = actor?.id || document?.actorId || null;
    if (!document?.actorLink || !actor || !_clipboardCanUserModifyDocument(actor, "update")) {
      return {
        eligible: false,
        reason: "Actor portrait + linked token art requires every selected token to be linked to a base Actor you can update.",
        actors: [],
        documents: replacementTarget.documents,
      };
    }

    if (actorId && !seenActorIds.has(actorId)) {
      seenActorIds.add(actorId);
      actors.push(actor);
    }
  }

  return {
    eligible: true,
    reason: "",
    actors,
    documents: replacementTarget.documents,
  };
}

function _clipboardCanCreateDocument(documentName) {
  if (documentName === "Token") return _clipboardCanCreateTokens();
  return _clipboardCanCreateTiles();
}

module.exports = {
  _clipboardCanUserModifyDocument,
  _clipboardCanReplaceDocument,
  _clipboardGetTokenActorArtEligibility,
  _clipboardCanCreateDocument,
};
