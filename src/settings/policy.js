const {
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
  CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
  CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
  CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
  CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
  CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
  CLIPBOARD_IMAGE_ROLE_PLAYER,
  CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
  CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
  CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK,
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
const {_clipboardGetRoleChoices, _clipboardGetSetting} = require("./schema");
const {_clipboardGetPastedTokenActorTypeChoices} = require("../canvas/actor-types");

function _clipboardGetRoleValue(roleKey) {
  return CONST?.USER_ROLES?.[roleKey] ?? CONST?.USER_ROLES?.PLAYER ?? 1;
}

function _clipboardGetCurrentUserRole() {
  if (typeof game?.user?.role === "number") return game.user.role;
  if (game?.user?.isGM) return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_GAMEMASTER);
  return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_PLAYER);
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

function _clipboardGetConfiguredPastedTokenActorType() {
  const configuredType = _clipboardGetSetting(CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING);
  const choices = _clipboardGetPastedTokenActorTypeChoices();

  if (typeof configuredType === "string" && Object.hasOwn(choices, configuredType)) {
    return configuredType;
  }

  return CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK;
}

function _clipboardShouldLockPastedTokenRotation() {
  const configuredValue = _clipboardGetSetting(CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING);
  if (typeof configuredValue === "boolean") return configuredValue;
  return true;
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

module.exports = {
  _clipboardGetRoleChoices,
  _clipboardGetRoleValue,
  _clipboardGetCurrentUserRole,
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
  _clipboardGetConfiguredPastedTokenActorType,
  _clipboardShouldLockPastedTokenRotation,
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
};
