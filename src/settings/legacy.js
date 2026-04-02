const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
  CLIPBOARD_IMAGE_TITLE,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_DATA,
  CLIPBOARD_IMAGE_FORM_APPLICATION,
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
  CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
  CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
  CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
  CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
  CLIPBOARD_IMAGE_ROLE_PLAYER,
  CLIPBOARD_IMAGE_ROLE_TRUSTED,
  CLIPBOARD_IMAGE_ROLE_ASSISTANT,
  CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
  CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES,
  CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH,
} = require("../constants");
const {_clipboardLog} = require("../diagnostics");
const {FoundryPasteEaterDestinationConfig} = require("../config-app");

const CLIPBOARD_IMAGE_SHIPPED_DEFAULTS = Object.freeze({
  "image-location": Object.freeze({scope: "world", config: false, value: CLIPBOARD_IMAGE_DEFAULT_FOLDER}),
  "image-location-source": Object.freeze({scope: "world", config: false, value: CLIPBOARD_IMAGE_SOURCE_DATA}),
  "image-location-bucket": Object.freeze({scope: "world", config: false, value: ""}),
  [CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING]: Object.freeze({scope: "client", config: true, value: false}),
  [CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER}),
  [CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER}),
  [CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER}),
  [CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING]: Object.freeze({scope: "world", config: true, value: true}),
  [CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE}),
  [CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING]: Object.freeze({scope: "world", config: true, value: false}),
  [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL}),
  [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED}),
  [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO}),
  [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT}),
  [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING]: Object.freeze({scope: "world", config: true, value: CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH}),
});

const CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS = [
  "image-location",
  "image-location-source",
  "image-location-bucket",
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
  CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
  CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
  CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
  CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
  CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
];

function _clipboardGetShippedDefaultValue(key) {
  return CLIPBOARD_IMAGE_SHIPPED_DEFAULTS[key]?.value;
}

function _clipboardGetShippedDefaultSettings({scope = null, config = null} = {}) {
  return Object.fromEntries(
    Object.entries(CLIPBOARD_IMAGE_SHIPPED_DEFAULTS)
      .filter(([, entry]) => {
        if (scope !== null && entry.scope !== scope) return false;
        if (config !== null && entry.config !== config) return false;
        return true;
      })
      .map(([key, entry]) => [key, entry.value])
  );
}

function _clipboardDescribeSettingValue(key, value) {
  const registeredConfig = _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key) ||
    _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key) ||
    null;

  if (registeredConfig?.choices && Object.hasOwn(registeredConfig.choices, value)) {
    return String(registeredConfig.choices[value]);
  }
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (value === "") return "(empty)";
  if (value === null || value === undefined) return "(unset)";
  return String(value);
}

function _clipboardGetSettingsThatDifferFromDefaults({scope = "world", config = true} = {}) {
  const defaults = _clipboardGetShippedDefaultSettings({scope, config});
  return Object.entries(defaults)
    .reduce((differences, [key, defaultValue]) => {
      const currentValue = _clipboardGetSetting(key);
      if (currentValue === defaultValue) return differences;

      differences.push({
        key,
        currentValue,
        defaultValue,
        displayName: _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.name || key,
      });
      return differences;
    }, [])
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

async function _clipboardApplyShippedDefaults({scope = "world", config = true} = {}) {
  const differences = _clipboardGetSettingsThatDifferFromDefaults({scope, config});
  for (const difference of differences) {
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, difference.key, difference.defaultValue);
  }
  return differences.map(difference => difference.key);
}

class FoundryPasteEaterRecommendedDefaultsConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  async render(force, options) {
    const differences = _clipboardGetSettingsThatDifferFromDefaults();
    const summary = differences.length
      ? `<p>This world differs from the current ${CLIPBOARD_IMAGE_TITLE} recommended behavior defaults in <strong>${differences.length}</strong> configurable world setting${differences.length === 1 ? "" : "s"}.</p>`
      : `<p>This world already matches the current ${CLIPBOARD_IMAGE_TITLE} configurable behavior defaults.</p>`;
    const details = differences.length
      ? `<ul>${differences.map(difference => `<li><strong>${foundry.utils.escapeHTML(difference.displayName)}</strong>: ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.currentValue))} -> ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.defaultValue))}</li>`).join("")}</ul>`
      : "";
    const scopeNote = "<p>Only configurable world behavior settings are changed here. Upload destination and client-only diagnostics stay untouched.</p>";

    const dialog = new globalThis.Dialog({
      title: `${CLIPBOARD_IMAGE_TITLE}: Apply Recommended Defaults`,
      content: `${summary}${scopeNote}${details}`,
      buttons: differences.length
        ? {
          apply: {
            icon: "fa-solid fa-wand-magic-sparkles",
            label: `Apply ${differences.length} Change${differences.length === 1 ? "" : "s"}`,
            callback: async () => {
              const updatedKeys = await _clipboardApplyShippedDefaults();
              if (!updatedKeys.length) return;
              ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Applied ${updatedKeys.length} recommended world setting${updatedKeys.length === 1 ? "" : "s"}.`);
            },
          },
          cancel: {
            icon: "fa-solid fa-xmark",
            label: "Cancel",
          },
        }
        : {
          close: {
            icon: "fa-solid fa-check",
            label: "Close",
          },
        },
      default: differences.length ? "apply" : "close",
    });

    return dialog.render(force, options);
  }
}

function _clipboardGetRoleChoices() {
  return {
    [CLIPBOARD_IMAGE_ROLE_PLAYER]: "Player",
    [CLIPBOARD_IMAGE_ROLE_TRUSTED]: "Trusted Player",
    [CLIPBOARD_IMAGE_ROLE_ASSISTANT]: "Assistant GM",
    [CLIPBOARD_IMAGE_ROLE_GAMEMASTER]: "Gamemaster",
  };
}

function _clipboardGetRoleValue(roleKey) {
  return CONST?.USER_ROLES?.[roleKey] ?? CONST?.USER_ROLES?.PLAYER ?? 1;
}

function _clipboardGetCurrentUserRole() {
  if (typeof game?.user?.role === "number") return game.user.role;
  if (game?.user?.isGM) return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_GAMEMASTER);
  return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_PLAYER);
}

function _clipboardGetRegisteredSettingConfig(moduleId, key) {
  return game?.settings?.settings?.get?.(`${moduleId}.${key}`) || null;
}

function _clipboardGetSettingScope(key) {
  return _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.scope ||
    _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key)?.scope ||
    "world";
}

function _clipboardGetSettingsStorage(scope) {
  return game?.settings?.storage?.get?.(scope) || null;
}

function _clipboardGetStoredSettingDocument(moduleId, key) {
  const scope = _clipboardGetSettingScope(key);
  return _clipboardGetSettingsStorage(scope)?.get?.(`${moduleId}.${key}`) || null;
}

function _clipboardHasStoredSetting(moduleId, key) {
  return Boolean(_clipboardGetStoredSettingDocument(moduleId, key));
}

function _clipboardGetStoredSettingValue(moduleId, key) {
  const document = _clipboardGetStoredSettingDocument(moduleId, key);
  if (!document || !Object.hasOwn(document, "value")) return undefined;
  return document.value;
}

function _clipboardGetSetting(key) {
  const hasCurrentValue = _clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key);
  const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
  if (!hasCurrentValue && legacyValue !== undefined) return legacyValue;
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, key);
}

function _clipboardSettingEnabled(key) {
  return Boolean(_clipboardGetSetting(key));
}

function _clipboardGetConfiguredMinimumRole(settingKey) {
  const configuredRole = _clipboardGetSetting(settingKey);
  if (typeof configuredRole === "string" && configuredRole.trim()) return configuredRole;
  return CLIPBOARD_IMAGE_ROLE_PLAYER;
}

function _clipboardUserMeetsMinimumRole(settingKey) {
  return _clipboardGetCurrentUserRole() >= _clipboardGetRoleValue(_clipboardGetConfiguredMinimumRole(settingKey));
}

function _clipboardCanUseCanvasMedia() {
  return _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING);
}

function _clipboardCanUseCanvasText() {
  return _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING) &&
    _clipboardGetCanvasTextPasteMode() !== CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED;
}

function _clipboardCanUseChatMedia() {
  return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING) &&
    _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING);
}

function _clipboardCanUseChatUploadButton() {
  return _clipboardCanUseChatMedia() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING);
}

function _clipboardCanUseSceneControls() {
  if (game.user?.isGM) return true;
  return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING) &&
    _clipboardCanUseCanvasMedia();
}

function _clipboardCanUseScenePasteTool() {
  return _clipboardCanUseSceneControls() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING);
}

function _clipboardCanUseSceneUploadTool() {
  return _clipboardCanUseSceneControls() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING);
}

function _clipboardGetDefaultEmptyCanvasTarget() {
  const configuredTarget = _clipboardGetSetting(CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING);
  if (
    configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE ||
    configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER ||
    configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN
  ) {
    return configuredTarget;
  }

  return CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE;
}

function _clipboardShouldCreateBackingActors() {
  return _clipboardSettingEnabled(CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING);
}

function _clipboardGetChatMediaDisplayMode() {
  const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING);
  if (
    configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW ||
    configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY
  ) {
    return configuredMode;
  }

  return CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL;
}

function _clipboardGetCanvasTextPasteMode() {
  const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING);
  if (
    configuredMode === CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES ||
    configuredMode === CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED
  ) {
    return configuredMode;
  }

  return CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED;
}

function _clipboardGetScenePastePromptMode() {
  const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING);
  if (
    configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS ||
    configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER
  ) {
    return configuredMode;
  }

  return CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO;
}

function _clipboardGetSelectedTokenPasteMode() {
  const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING);
  if (
    configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY ||
    configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART ||
    configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT
  ) {
    return configuredMode;
  }

  return CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT;
}

function _clipboardGetUploadPathOrganizationMode() {
  const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING);
  if (
    configuredMode === CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT ||
    configuredMode === CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH
  ) {
    return configuredMode;
  }

  return CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH;
}

function _clipboardCanCreateTokens() {
  return _clipboardCanUseCanvasMedia() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING);
}

function _clipboardCanCreateTiles() {
  return _clipboardCanUseCanvasMedia() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING);
}

function _clipboardCanReplaceTokens() {
  return _clipboardCanUseCanvasMedia() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING);
}

function _clipboardCanReplaceTiles() {
  return _clipboardCanUseCanvasMedia() &&
    _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING);
}

function _clipboardRefreshSceneControlsUi() {
  const activeControl = ui?.controls?.control?.name ||
    canvas?.activeLayer?.options?.name ||
    "tiles";

  ui?.controls?.initialize?.({control: activeControl});
  ui?.controls?.render?.(true);
}

function _clipboardRefreshChatUi() {
  ui?.chat?.render?.(true);
}

function _clipboardRefreshUiForSettingsChange({sceneControls = false, chat = false} = {}) {
  if (sceneControls) _clipboardRefreshSceneControlsUi();
  if (chat) _clipboardRefreshChatUi();
}

async function _clipboardMigrateLegacySettings() {
  if (CLIPBOARD_IMAGE_MODULE_ID === CLIPBOARD_IMAGE_LEGACY_MODULE_ID) return [];

  const migrated = [];
  for (const key of CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS) {
    const scope = _clipboardGetSettingScope(key);
    if (scope === "world" && !game?.user?.isGM) continue;
    if (_clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key)) continue;

    const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
    if (legacyValue === undefined) continue;

    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, key, legacyValue);
    migrated.push(key);
  }

  if (migrated.length) {
    _clipboardLog("info", "Migrated legacy module settings to the new namespace.", {
      legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
      moduleId: CLIPBOARD_IMAGE_MODULE_ID,
      settings: migrated,
    });
  }

  return migrated;
}

function _clipboardRegisterSettings() {
  const refreshSceneControls = () => _clipboardRefreshUiForSettingsChange({sceneControls: true});
  const refreshChatUi = () => _clipboardRefreshUiForSettingsChange({chat: true});

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

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
    name: "Pasted media location",
    hint: "Folder where pasted media is saved.",
    scope: "world",
    config: false,
    type: String,
    default: _clipboardGetShippedDefaultValue("image-location"),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
    name: "Pasted media source",
    hint: "File source where pasted media is saved.",
    scope: "world",
    config: false,
    type: String,
    default: _clipboardGetShippedDefaultValue("image-location-source"),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
    name: "Pasted media bucket",
    hint: "Bucket used when pasted media is saved to an S3-compatible provider configured in Foundry.",
    scope: "world",
    config: false,
    type: String,
    default: _clipboardGetShippedDefaultValue("image-location-bucket"),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING, {
    name: "Verbose logging",
    hint: "Log detailed foundry-paste-eater diagnostics to the browser console for debugging.",
    scope: "client",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING, {
    name: "Minimum role for canvas media paste",
    hint: "Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices(),
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING),
    onChange: refreshSceneControls,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING, {
    name: "Minimum role for canvas text paste",
    hint: "Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices(),
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING, {
    name: "Minimum role for chat media paste",
    hint: "Lowest Foundry role allowed to post pasted/uploaded media into chat.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices(),
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING),
    onChange: refreshChatUi,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING, {
    name: "Allow non-GMs to use scene controls",
    hint: "Show Foundry Paste Eater scene control buttons to non-GM users who meet the canvas media role requirement.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING),
    onChange: refreshSceneControls,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING, {
    name: "Enable chat media handling",
    hint: "Allow pasted, dropped, and uploaded media in chat.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING),
    onChange: refreshChatUi,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING, {
    name: "Enable chat upload button",
    hint: "Show the Upload Chat Media button next to the chat input when chat media handling is enabled.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING),
    onChange: refreshChatUi,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING, {
    name: "Allow token creation from pasted media",
    hint: "Create a new token when pasted media targets token creation.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING, {
    name: "Allow tile creation from pasted media",
    hint: "Create a new tile when pasted media targets tile creation.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING, {
    name: "Allow token art replacement",
    hint: "Allow pasted media to replace the selected tokens. Non-GMs are limited to tokens they can update.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING, {
    name: "Allow tile art replacement",
    hint: "Allow pasted media to replace the selected tiles.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING, {
    name: "Enable scene Paste Media tool",
    hint: "Show the Paste Media scene control button.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING),
    onChange: refreshSceneControls,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING, {
    name: "Enable scene Upload Media tool",
    hint: "Show the Upload Media scene control button.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING),
    onChange: refreshSceneControls,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING, {
    name: "Default empty-canvas paste target",
    hint: "Choose which placeable type should be created when pasted media is not replacing an existing tile or token.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER]: "Active layer",
      [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE]: "Tile",
      [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN]: "Token",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING, {
    name: "Create backing Actors for pasted tokens",
    hint: "Generate an Actor for each newly pasted token so the token can be opened and edited normally.",
    scope: "world",
    config: true,
    type: Boolean,
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING, {
    name: "Chat media display",
    hint: "Choose how pasted media is rendered in chat messages.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW]: "Full preview",
      [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL]: "Thumbnail",
      [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY]: "Link only",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING, {
    name: "Canvas text paste mode",
    hint: "Choose how pasted plain text behaves on the canvas.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES]: "Scene notes",
      [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED]: "Disabled",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING, {
    name: "Scene Paste Media prompt mode",
    hint: "Control whether the scene Paste Media tool uses direct clipboard reads, the manual paste prompt, or the current browser-dependent auto behavior.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO]: "Auto",
      [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS]: "Always show prompt",
      [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER]: "Never show prompt",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING, {
    name: "Selected token image paste mode",
    hint: "Choose whether pasted images replace only the selected scene token, update the Actor portrait and linked token art, or ask each time for eligible linked tokens.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY]: "Scene token only",
      [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART]: "Actor portrait + linked token art",
      [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT]: "Ask each time",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING),
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING, {
    name: "Upload path organization",
    hint: "Optionally append context, user, and month folders under the configured base destination to separate chat, canvas, and document-art uploads.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT]: "Flat",
      [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH]: "Context / user / month",
    },
    default: _clipboardGetShippedDefaultValue(CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING),
  });
}

module.exports = {
  FoundryPasteEaterRecommendedDefaultsConfig,
  _clipboardGetShippedDefaultValue,
  _clipboardGetShippedDefaultSettings,
  _clipboardDescribeSettingValue,
  _clipboardGetSettingsThatDifferFromDefaults,
  _clipboardApplyShippedDefaults,
  _clipboardGetRoleChoices,
  _clipboardGetRoleValue,
  _clipboardGetCurrentUserRole,
  _clipboardGetRegisteredSettingConfig,
  _clipboardGetSettingScope,
  _clipboardGetSettingsStorage,
  _clipboardGetStoredSettingDocument,
  _clipboardHasStoredSetting,
  _clipboardGetStoredSettingValue,
  _clipboardGetSetting,
  _clipboardSettingEnabled,
  _clipboardGetConfiguredMinimumRole,
  _clipboardUserMeetsMinimumRole,
  _clipboardCanUseCanvasMedia,
  _clipboardCanUseCanvasText,
  _clipboardCanUseChatMedia,
  _clipboardCanUseChatUploadButton,
  _clipboardCanUseSceneControls,
  _clipboardCanUseScenePasteTool,
  _clipboardCanUseSceneUploadTool,
  _clipboardGetDefaultEmptyCanvasTarget,
  _clipboardShouldCreateBackingActors,
  _clipboardGetChatMediaDisplayMode,
  _clipboardGetCanvasTextPasteMode,
  _clipboardGetScenePastePromptMode,
  _clipboardGetSelectedTokenPasteMode,
  _clipboardGetUploadPathOrganizationMode,
  _clipboardCanCreateTokens,
  _clipboardCanCreateTiles,
  _clipboardCanReplaceTokens,
  _clipboardCanReplaceTiles,
  _clipboardRefreshSceneControlsUi,
  _clipboardRefreshChatUi,
  _clipboardRefreshUiForSettingsChange,
  _clipboardMigrateLegacySettings,
  _clipboardRegisterSettings,
  CLIPBOARD_IMAGE_SHIPPED_DEFAULTS,
  CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS,
};
