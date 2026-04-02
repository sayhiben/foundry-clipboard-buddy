const {_clipboardDescribeReplacementTarget, _clipboardLog} = require("../diagnostics");
const {_clipboardGetTileVideoData} = require("../media");
const {_clipboardGetTokenActorArtEligibility} = require("./eligibility");

function _clipboardGetAllScenesForLinkedTokenUpdates() {
  if (Array.isArray(game?.scenes?.contents) && game.scenes.contents.length) {
    return game.scenes.contents.filter(Boolean);
  }

  return canvas?.scene ? [canvas.scene] : [];
}

async function _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options = {}) {
  const eligibility = options.eligibility || _clipboardGetTokenActorArtEligibility(replacementTarget, {mediaKind: "image"});
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "Actor portrait + linked token art is unavailable for the current token selection.");
  }

  _clipboardLog("info", "Replacing actor portrait and linked token art", {
    actorIds: eligibility.actors.map(actor => actor.id || null),
    replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
    path,
  });

  for (const actor of eligibility.actors) {
    await actor.update({
      img: path,
      "prototypeToken.texture.src": path,
    });
  }

  const updatesByScene = new Map();
  const trackSceneUpdate = (scene, tokenDocument) => {
    if (!scene?.updateEmbeddedDocuments || !tokenDocument?.id) return;
    const existing = updatesByScene.get(scene) || new Map();
    existing.set(tokenDocument.id, {
      _id: tokenDocument.id,
      "texture.src": path,
    });
    updatesByScene.set(scene, existing);
  };

  for (const scene of _clipboardGetAllScenesForLinkedTokenUpdates()) {
    const tokenDocuments = scene?.tokens?.contents || [];
    for (const tokenDocument of tokenDocuments) {
      if (!tokenDocument?.actorLink || !tokenDocument?.actorId) continue;
      if (!eligibility.actors.some(actor => actor.id === tokenDocument.actorId)) continue;
      trackSceneUpdate(scene, tokenDocument);
    }
  }

  for (const document of replacementTarget.documents) {
    trackSceneUpdate(canvas?.scene, document);
  }

  for (const [scene, sceneUpdates] of updatesByScene.entries()) {
    if (!sceneUpdates.size) continue;
    await scene.updateEmbeddedDocuments("Token", Array.from(sceneUpdates.values()));
  }

  return true;
}

async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind, options = {}) {
  if (!replacementTarget) return false;

  if (
    options.mode === "actor-art" &&
    replacementTarget.documentName === "Token" &&
    mediaKind === "image"
  ) {
    return _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options);
  }

  const updates = replacementTarget.documents.map(document => {
    const update = {
      _id: document.id,
      "texture.src": path,
    };

    if (replacementTarget.documentName === "Tile" && mediaKind === "video") {
      update.video = _clipboardGetTileVideoData(mediaKind);
    }

    return update;
  });
  _clipboardLog("info", "Replacing controlled media", {
    replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
    mediaKind,
    path,
  });
  await canvas.scene.updateEmbeddedDocuments(replacementTarget.documentName, updates);
  return true;
}

module.exports = {
  _clipboardGetAllScenesForLinkedTokenUpdates,
  _clipboardReplaceControlledTokenActorArt,
  _clipboardReplaceControlledMedia,
};
