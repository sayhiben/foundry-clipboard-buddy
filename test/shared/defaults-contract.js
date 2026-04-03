const SHIPPED_DEFAULT_SETTINGS = Object.freeze({
  "image-location-source": "data",
  "default-empty-canvas-target": "tile",
  "create-backing-actors": false,
  "chat-media-display": "thumbnail",
  "canvas-text-paste-mode": "disabled",
  "scene-paste-prompt-mode": "auto",
  "selected-token-paste-mode": "prompt",
  "upload-path-organization": "context-user-month",
  "allow-non-gm-scene-controls": true,
});

const CONFIGURABLE_WORLD_DEFAULT_SETTINGS = Object.freeze({
  "minimum-role-canvas-media": "PLAYER",
  "minimum-role-canvas-text": "PLAYER",
  "minimum-role-chat-media": "PLAYER",
  "allow-non-gm-scene-controls": true,
  "enable-chat-media": true,
  "enable-chat-upload-button": true,
  "enable-token-creation": true,
  "enable-tile-creation": true,
  "enable-token-replacement": true,
  "enable-tile-replacement": true,
  "enable-scene-paste-tool": true,
  "enable-scene-upload-tool": true,
  "default-empty-canvas-target": "tile",
  "create-backing-actors": false,
  "chat-media-display": "thumbnail",
  "canvas-text-paste-mode": "disabled",
  "scene-paste-prompt-mode": "auto",
  "selected-token-paste-mode": "prompt",
  "upload-path-organization": "context-user-month",
});

const USER_VISIBLE_SETTING_LABELS = Object.freeze({
  "default-empty-canvas-target": "Default empty-canvas paste target",
  "selected-token-paste-mode": "Selected token image paste mode",
});

const SUPPORT_CONTRACT = Object.freeze({
  readinessSectionIds: [
    "client-capability",
    "storage-readiness",
    "player-upload-readiness",
    "default-profile-drift",
  ],
  supportBundleKeys: [
    "generatedAt",
    "module",
    "foundry",
    "world",
    "browser",
    "readiness",
    "storage",
    "settings",
    "logs",
  ],
  runtimeApiMethods: [
    "getReadinessReport",
    "collectSupportBundle",
    "collectMediaAuditReport",
  ],
});

const REQUIRED_TESTABLE_EXPORTS = Object.freeze([
  "_clipboardGetShippedDefaultSettings",
  "_clipboardGetSettingsThatDifferFromDefaults",
  "_clipboardApplyShippedDefaults",
  "_clipboardResolveNativePasteRoute",
  "_clipboardResolveScenePasteToolPlan",
  "_clipboardResolveCanvasMediaPlan",
  "_clipboardReplaceControlledTokenActorArt",
  "_clipboardHandleImageInput",
  "_clipboardOnPaste",
  "_clipboardGetReadinessReport",
  "_clipboardCollectSupportBundle",
  "_clipboardCollectMediaAuditReport",
  "_clipboardRegisterRuntimeApi",
]);
module.exports = {
  CONFIGURABLE_WORLD_DEFAULT_SETTINGS,
  REQUIRED_TESTABLE_EXPORTS,
  SHIPPED_DEFAULT_SETTINGS,
  SUPPORT_CONTRACT,
  USER_VISIBLE_SETTING_LABELS,
};
