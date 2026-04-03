const {CLIPBOARD_IMAGE_MODULE_ID} = require("../constants");
const {FoundryPasteEaterDestinationConfig} = require("../config-app");
const {FoundryPasteEaterRecommendedDefaultsConfig} = require("./recommended-defaults");
const {
  FoundryPasteEaterReadinessSupportConfig,
  FoundryPasteEaterUploadedMediaAuditConfig,
} = require("../support");
const {
  CLIPBOARD_IMAGE_SETTINGS_SCHEMA,
  _clipboardGetShippedDefaultValue,
} = require("./schema");
const {_clipboardRefreshUiForSettingsChange} = require("./policy");

function _clipboardRegisterSettings() {
  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
    name: "Upload destination",
    label: "Configure",
    hint: "Choose the file store and folder used for pasted media. Supports User Data, The Forge, and Foundry-configured S3-compatible storage through Foundry's native file picker.",
    icon: "fa-solid fa-folder-tree",
    type: FoundryPasteEaterDestinationConfig,
    restricted: true,
  });

  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "recommended-defaults", {
    name: "Apply recommended defaults",
    label: "Review",
    hint: "Review and apply the current recommended world behavior defaults without changing upload destination or client-only diagnostics.",
    icon: "fa-solid fa-wand-magic-sparkles",
    type: FoundryPasteEaterRecommendedDefaultsConfig,
    restricted: true,
  });

  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "readiness-support", {
    name: "Readiness & Support",
    label: "Open",
    hint: "Review clipboard/browser capability, storage readiness, player upload prerequisites, and a downloadable support bundle without changing world data.",
    icon: "fa-solid fa-shield-heart",
    type: FoundryPasteEaterReadinessSupportConfig,
    restricted: true,
  });

  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "uploaded-media-audit", {
    name: "Uploaded Media Audit",
    label: "Open",
    hint: "Review current world references to media under the module's configured upload roots and export the audit as JSON.",
    icon: "fa-solid fa-photo-film",
    type: FoundryPasteEaterUploadedMediaAuditConfig,
    restricted: true,
  });

  for (const setting of CLIPBOARD_IMAGE_SETTINGS_SCHEMA) {
    const choices = typeof setting.choices === "function" ? setting.choices() : setting.choices;
    const refreshTargets = Array.isArray(setting.refreshTargets) ? setting.refreshTargets : [];
    const onChange = refreshTargets.length
      ? () => _clipboardRefreshUiForSettingsChange({
        sceneControls: refreshTargets.includes("sceneControls"),
        chat: refreshTargets.includes("chat"),
      })
      : undefined;

    game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, setting.key, {
      name: setting.name,
      hint: setting.hint,
      scope: setting.scope,
      config: setting.config,
      type: setting.type,
      default: _clipboardGetShippedDefaultValue(setting.key),
      ...(choices ? {choices} : {}),
      ...(onChange ? {onChange} : {}),
    });
  }
}

module.exports = {
  _clipboardRegisterSettings,
};
