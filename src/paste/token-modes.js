const {
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
} = require("../constants");
const {_clipboardGetTokenActorArtEligibility} = require("../context");
const {_clipboardGetSelectedTokenPasteMode} = require("../settings");

function _clipboardGetDefaultTokenReplacementBehavior() {
  return {
    mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
    uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
    eligibility: null,
  };
}

function _clipboardPromptSelectedTokenPasteMode() {
  return new Promise(resolve => {
    let settled = false;
    const settle = mode => {
      document.querySelector(".game")?.focus?.({preventScroll: true});
      if (settled) return;
      settled = true;
      resolve(mode);
    };

    const dialog = new globalThis.Dialog({
      title: "Replace Selected Token Art",
      content: `
        <p>The selected tokens can either update only this scene token, or update the Actor portrait and linked token art.</p>
        <p>Choose how this pasted image should be applied.</p>
      `,
      buttons: {
        sceneOnly: {
          label: "Scene token only",
          callback: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY),
        },
        actorArt: {
          label: "Actor portrait + linked token art",
          callback: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART),
        },
      },
      default: "sceneOnly",
      close: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY),
    }, {
      classes: ["foundry-paste-eater-token-mode-dialog"],
      width: 760,
    });
    dialog.render(true);
  });
}

async function _clipboardResolveTokenReplacementBehavior(context, mediaKind) {
  if (context?.replacementTarget?.documentName !== "Token" || !context?.replacementTarget?.documents?.length) {
    return _clipboardGetDefaultTokenReplacementBehavior();
  }

  if (mediaKind !== "image") {
    return _clipboardGetDefaultTokenReplacementBehavior();
  }

  const configuredMode = _clipboardGetSelectedTokenPasteMode();
  if (configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY) {
    return _clipboardGetDefaultTokenReplacementBehavior();
  }

  const eligibility = _clipboardGetTokenActorArtEligibility(context.replacementTarget, {mediaKind});
  if (configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART) {
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || "Actor portrait + linked token art is unavailable for the current token selection.");
    }

    return {
      mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
      uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
      eligibility,
    };
  }

  if (!eligibility.eligible) {
    return {
      ..._clipboardGetDefaultTokenReplacementBehavior(),
      eligibility,
    };
  }

  const selectedMode = await _clipboardPromptSelectedTokenPasteMode();
  if (selectedMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART) {
    return {
      mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
      uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
      eligibility,
    };
  }

  return {
    ..._clipboardGetDefaultTokenReplacementBehavior(),
    eligibility,
  };
}

module.exports = {
  _clipboardGetDefaultTokenReplacementBehavior,
  _clipboardPromptSelectedTokenPasteMode,
  _clipboardResolveTokenReplacementBehavior,
};
