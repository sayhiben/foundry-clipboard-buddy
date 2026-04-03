const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_DATA,
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
  CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
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
  [CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING]: Object.freeze({scope: "world", config: false, value: "[]"}),
});

const CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS = Object.freeze([
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
  CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
]);

function _clipboardGetRoleChoices() {
  return {
    [CLIPBOARD_IMAGE_ROLE_PLAYER]: "Player",
    [CLIPBOARD_IMAGE_ROLE_TRUSTED]: "Trusted Player",
    [CLIPBOARD_IMAGE_ROLE_ASSISTANT]: "Assistant GM",
    [CLIPBOARD_IMAGE_ROLE_GAMEMASTER]: "Gamemaster",
  };
}

const CLIPBOARD_IMAGE_SETTINGS_SCHEMA = Object.freeze([
  {
    key: "image-location",
    name: "Pasted media location",
    hint: "Folder where pasted media is saved.",
    scope: "world",
    config: false,
    type: String,
  },
  {
    key: "image-location-source",
    name: "Pasted media source",
    hint: "File source where pasted media is saved.",
    scope: "world",
    config: false,
    type: String,
  },
  {
    key: "image-location-bucket",
    name: "Pasted media bucket",
    hint: "Bucket used when pasted media is saved to an S3-compatible provider configured in Foundry.",
    scope: "world",
    config: false,
    type: String,
  },
  {
    key: CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
    name: "Known upload roots",
    hint: "Internal support setting that records every configured upload root used by this world.",
    scope: "world",
    config: false,
    type: String,
  },
  {
    key: CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
    name: "Verbose logging",
    hint: "Log detailed foundry-paste-eater diagnostics to the browser console for debugging.",
    scope: "client",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
    name: "Minimum role for canvas media paste",
    hint: "Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices,
    refreshTargets: ["sceneControls"],
  },
  {
    key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
    name: "Minimum role for canvas text paste",
    hint: "Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices,
  },
  {
    key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
    name: "Minimum role for chat media paste",
    hint: "Lowest Foundry role allowed to post pasted/uploaded media into chat.",
    scope: "world",
    config: true,
    type: String,
    choices: _clipboardGetRoleChoices,
    refreshTargets: ["chat"],
  },
  {
    key: CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
    name: "Allow non-GMs to use scene controls",
    hint: "Show Foundry Paste Eater scene control buttons to non-GM users who meet the canvas media role requirement.",
    scope: "world",
    config: true,
    type: Boolean,
    refreshTargets: ["sceneControls"],
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
    name: "Enable chat media handling",
    hint: "Allow pasted, dropped, and uploaded media in chat.",
    scope: "world",
    config: true,
    type: Boolean,
    refreshTargets: ["chat"],
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
    name: "Enable chat upload button",
    hint: "Show the Upload Chat Media button next to the chat input when chat media handling is enabled.",
    scope: "world",
    config: true,
    type: Boolean,
    refreshTargets: ["chat"],
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
    name: "Allow token creation from pasted media",
    hint: "Create a new token when pasted media targets token creation.",
    scope: "world",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
    name: "Allow tile creation from pasted media",
    hint: "Create a new tile when pasted media targets tile creation.",
    scope: "world",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
    name: "Allow token art replacement",
    hint: "Allow pasted media to replace the selected tokens. Non-GMs are limited to tokens they can update.",
    scope: "world",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
    name: "Allow tile art replacement",
    hint: "Allow pasted media to replace the selected tiles.",
    scope: "world",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
    name: "Enable scene Paste Media tool",
    hint: "Show the Paste Media scene control button.",
    scope: "world",
    config: true,
    type: Boolean,
    refreshTargets: ["sceneControls"],
  },
  {
    key: CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
    name: "Enable scene Upload Media tool",
    hint: "Show the Upload Media scene control button.",
    scope: "world",
    config: true,
    type: Boolean,
    refreshTargets: ["sceneControls"],
  },
  {
    key: CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
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
  },
  {
    key: CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
    name: "Create backing Actors for pasted tokens",
    hint: "Generate an Actor for each newly pasted token so the token can be opened and edited normally.",
    scope: "world",
    config: true,
    type: Boolean,
  },
  {
    key: CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
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
  },
  {
    key: CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
    name: "Canvas text paste mode",
    hint: "Choose how pasted plain text behaves on the canvas.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES]: "Scene notes",
      [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED]: "Disabled",
    },
  },
  {
    key: CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
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
  },
  {
    key: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
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
  },
  {
    key: CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
    name: "Upload path organization",
    hint: "Optionally append context, user, and month folders under the configured base destination to separate chat, canvas, and document-art uploads.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT]: "Flat",
      [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH]: "Context / user / month",
    },
  },
]);

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

module.exports = {
  CLIPBOARD_IMAGE_SHIPPED_DEFAULTS,
  CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS,
  CLIPBOARD_IMAGE_SETTINGS_SCHEMA,
  _clipboardGetRoleChoices,
  _clipboardGetShippedDefaultValue,
  _clipboardGetShippedDefaultSettings,
  _clipboardDescribeSettingValue,
  _clipboardGetRegisteredSettingConfig,
  _clipboardGetSettingScope,
  _clipboardGetSettingsStorage,
  _clipboardGetStoredSettingDocument,
  _clipboardHasStoredSetting,
  _clipboardGetStoredSettingValue,
  _clipboardGetSetting,
};
