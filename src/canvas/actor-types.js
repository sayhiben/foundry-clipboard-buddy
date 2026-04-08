const {
  CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK,
  CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT,
} = require("../constants");

function _clipboardGetAvailableActorTypes() {
  const candidates = [
    game?.system?.documentTypes?.Actor,
    game?.documentTypes?.Actor,
    _clipboardGetActorDocumentClass()?.TYPES,
  ];
  const baseDocumentType = CONST?.BASE_DOCUMENT_TYPE;

  for (const candidate of candidates) {
    if (!Array.isArray(candidate) || !candidate.length) continue;
    return candidate.filter(type => type && type !== baseDocumentType);
  }

  return [];
}

function _clipboardGetActorDocumentClass() {
  return foundry?.documents?.Actor || globalThis.Actor || null;
}

function _clipboardGetActorTypeDisplayLabel(type) {
  const configuredLabel = CONFIG?.Actor?.typeLabels?.[type];
  if (typeof configuredLabel === "string" && configuredLabel.trim()) {
    const localized = game?.i18n?.localize?.(configuredLabel);
    if (typeof localized === "string" && localized.trim()) return localized;
    return configuredLabel;
  }

  return String(type || "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Actor";
}

function _clipboardGetPastedTokenActorTypeChoices() {
  const choices = {
    [CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK]: "Ask each time",
    [CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT]: "System default",
  };

  for (const type of _clipboardGetAvailableActorTypes()) {
    choices[type] = _clipboardGetActorTypeDisplayLabel(type);
  }

  return choices;
}

function _clipboardGetSystemDefaultActorTypeLabel() {
  const resolvedType = _clipboardResolvePastedTokenActorType(CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT);
  if (!resolvedType) return "System default";
  return `System default (${_clipboardGetActorTypeDisplayLabel(resolvedType)})`;
}

function _clipboardPromptPastedTokenActorType() {
  return new Promise(resolve => {
    let settled = false;
    const settle = selection => {
      const gameRoot = document.querySelector(".game");
      if (gameRoot instanceof HTMLElement) {
        gameRoot.focus({preventScroll: true});
      }
      if (settled) return;
      settled = true;
      resolve(selection);
    };

    const availableTypes = _clipboardGetAvailableActorTypes();
    const resolvedDefaultType = _clipboardResolvePastedTokenActorType(CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT);
    const defaultSelection = {
      createBackingActor: true,
      actorType: resolvedDefaultType,
    };
    const buttons = {
      actorless: {
        label: "Scene token only",
        callback: () => settle({createBackingActor: false, actorType: null}),
      },
      systemDefault: {
        label: _clipboardGetSystemDefaultActorTypeLabel(),
        callback: () => settle(defaultSelection),
      },
    };

    for (const type of availableTypes) {
      if (type === resolvedDefaultType) continue;
      buttons[`type-${type}`] = {
        label: `Create ${_clipboardGetActorTypeDisplayLabel(type)} Actor`,
        callback: () => settle({createBackingActor: true, actorType: type}),
      };
    }

    const DialogConstructor = /** @type {any} */ (globalThis).Dialog;
    if (typeof DialogConstructor !== "function") {
      settle(defaultSelection);
      return;
    }

    const dialog = new DialogConstructor({
      title: "Create New Token",
      content: `
        <p>Choose how this new pasted token should be created.</p>
        <p>You can keep it as a scene-only token, or create a linked backing Actor for it.</p>
      `,
      buttons,
      default: "systemDefault",
      close: () => settle(defaultSelection),
    }, {
      classes: ["foundry-paste-eater-token-create-dialog"],
      width: 760,
    });
    dialog.render(true);
  });
}

function _clipboardResolvePastedTokenActorType(configuredType = CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT) {
  const availableTypes = _clipboardGetAvailableActorTypes();
  const defaultType = CONFIG?.Actor?.defaultType || null;
  const normalizedConfiguredType = typeof configuredType === "string" ? configuredType.trim() : "";

  if (
    normalizedConfiguredType &&
    normalizedConfiguredType !== CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK &&
    normalizedConfiguredType !== CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT &&
    (!availableTypes.length || availableTypes.includes(normalizedConfiguredType))
  ) {
    return normalizedConfiguredType;
  }

  if (defaultType && (!availableTypes.length || availableTypes.includes(defaultType))) {
    return defaultType;
  }

  return availableTypes[0] || defaultType || null;
}

module.exports = {
  _clipboardGetAvailableActorTypes,
  _clipboardGetActorDocumentClass,
  _clipboardGetActorTypeDisplayLabel,
  _clipboardGetPastedTokenActorTypeChoices,
  _clipboardGetSystemDefaultActorTypeLabel,
  _clipboardPromptPastedTokenActorType,
  _clipboardResolvePastedTokenActorType,
};
