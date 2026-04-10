// @ts-check

const {
  CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
  CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
  CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
  CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_SOURCE_S3,
} = require("../constants");
const {
  _clipboardGetConfiguredMinimumRole,
  _clipboardGetRoleChoices,
  _clipboardGetRoleValue,
} = require("../settings/policy");
const {
  _clipboardGetCorePermissionRoles,
  _clipboardGetConfiguredS3Endpoint,
  _clipboardGetConfiguredUploadRoot,
  _clipboardGetUploadPathOrganizationSetting,
} = require("../storage");
const {_clipboardGetSettingsThatDifferFromDefaults} = require("../settings/recommended-defaults");
const {_clipboardNormalizeUploadRoot} = require("./known-roots");

/**
 * @typedef {import("../contracts").ReadinessCheck} ReadinessCheck
 * @typedef {import("../contracts").ReadinessReport} ReadinessReport
 * @typedef {import("../contracts").ReadinessSection} ReadinessSection
 */

function _clipboardCreateReadinessItem(id, label, status, summary, remediation, details = null) {
  return {id, label, status, summary, remediation, details};
}

function _clipboardGetModuleVersion() {
  const activeModule = game?.modules?.get?.(CLIPBOARD_IMAGE_MODULE_ID);
  return activeModule?.version || activeModule?.manifest?.version || null;
}

function _clipboardGetBrowserContextSummary() {
  return {
    href: globalThis.location?.href || null,
    userAgent: globalThis.navigator?.userAgent || null,
    isSecureContext: Boolean(globalThis.isSecureContext),
    clipboardReadAvailable: Boolean(globalThis.navigator?.clipboard?.read),
  };
}

function _clipboardRoleHasPermission(roleKey, permission) {
  const minimumRoleValue = _clipboardGetRoleValue(roleKey);
  return _clipboardGetCorePermissionRoles(permission).some(roleValue => Number(roleValue) === minimumRoleValue);
}

function _clipboardGetRoleLabel(roleKey) {
  return _clipboardGetRoleChoices()[roleKey] || roleKey;
}

function _clipboardEvaluateClientCapabilitySection() {
  const browserContext = _clipboardGetBrowserContextSummary();
  /** @type {ReadinessSection} */
  const section = {
    id: "client-capability",
    title: "Client capability",
    items: [],
  };

  section.items.push(
    _clipboardCreateReadinessItem(
      "clipboard-read",
      "Direct clipboard reads",
      browserContext.clipboardReadAvailable ? "pass" : "warn",
      browserContext.clipboardReadAvailable
        ? "This browser exposes navigator.clipboard.read for richer scene-paste flows."
        : "This browser does not expose navigator.clipboard.read here. Native paste events and upload fallbacks still work where enabled.",
      "Use a Chromium-based browser on a secure/trusted origin if you want the scene Paste Media, PDF, or Audio tool to try direct clipboard reads first.",
      browserContext
    )
  );

  section.items.push(
    _clipboardCreateReadinessItem(
      "browser-context",
      "Current browser context",
      browserContext.isSecureContext ? "pass" : "warn",
      browserContext.isSecureContext
        ? "The current browser context is secure enough for modern clipboard APIs where the browser permits them."
        : "The current browser context is not marked secure, which can block direct clipboard APIs.",
      "Use the normal Foundry origin over HTTP localhost or HTTPS and avoid embedding the app in contexts that strip browser permissions.",
      browserContext
    )
  );

  return section;
}

function _clipboardEvaluateStorageReadinessSection() {
  const uploadRoot = _clipboardNormalizeUploadRoot(_clipboardGetConfiguredUploadRoot());
  const endpoint = _clipboardGetConfiguredS3Endpoint();
  const organizationMode = _clipboardGetUploadPathOrganizationSetting();
  const isS3 = uploadRoot.source === CLIPBOARD_IMAGE_SOURCE_S3;
  /** @type {ReadinessSection} */
  const section = {
    id: "storage-readiness",
    title: "Storage readiness",
    items: [],
  };

  section.items.push(
    _clipboardCreateReadinessItem(
      "destination",
      "Configured upload destination",
      isS3 && !uploadRoot.bucket ? "fail" : "pass",
      isS3
        ? `Uploads target ${uploadRoot.label}.`
        : `Uploads target ${uploadRoot.label}.`,
      isS3 && !uploadRoot.bucket
        ? "Open Upload destination and choose the S3-compatible bucket that Foundry should use for pasted media."
        : "Keep the configured base folder stable if you want uploads and audit reports to stay grouped under the same root.",
      uploadRoot
    )
  );

  section.items.push(
    _clipboardCreateReadinessItem(
      "endpoint-visibility",
      "S3 endpoint visibility",
      isS3 ? (endpoint ? "pass" : "warn") : "pass",
      isS3
        ? (endpoint
          ? `Foundry is exposing an S3 endpoint/base URL for this world: ${endpoint}.`
          : "Foundry is not exposing an S3 endpoint/base URL to the client right now.")
        : "Endpoint visibility only applies when the current source is S3-compatible storage.",
      isS3
        ? "If the endpoint is blank unexpectedly, verify Foundry's server-side S3 configuration and the active AWS/session credentials."
        : "No action is needed unless you switch this module to an S3-compatible destination.",
      {endpointVisible: Boolean(endpoint), endpoint}
    )
  );

  section.items.push(
    _clipboardCreateReadinessItem(
      "upload-organization",
      "Upload path organization",
      organizationMode === "context-user-month" ? "pass" : "warn",
      organizationMode === "context-user-month"
        ? "Uploads are organized by context, user, and month under the configured base folder."
        : "Uploads use a flat folder layout under the configured base destination.",
      "Use Context / user / month if you want clearer S3 lifecycle policies and easier audit grouping without changing what the module uploads.",
      {organizationMode}
    )
  );

  return section;
}

function _clipboardEvaluatePlayerUploadSection() {
  const canvasRole = _clipboardGetConfiguredMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING);
  const chatRole = _clipboardGetConfiguredMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING);
  const chatEnabled = Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING));
  const allowNonGmSceneControls = Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING));
  const scenePasteEnabled = Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING));
  const sceneUploadEnabled = Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING));
  const canvasRoleHasUploadPermissions = _clipboardRoleHasPermission(canvasRole, "FILES_BROWSE") && _clipboardRoleHasPermission(canvasRole, "FILES_UPLOAD");
  const chatRoleHasUploadPermissions = _clipboardRoleHasPermission(chatRole, "FILES_BROWSE") && _clipboardRoleHasPermission(chatRole, "FILES_UPLOAD");
  /** @type {ReadinessSection} */
  const section = {
    id: "player-upload-readiness",
    title: "Player upload readiness",
    items: [],
  };

  section.items.push(
    _clipboardCreateReadinessItem(
      "canvas-role-gate",
      "Canvas media role gate",
      canvasRoleHasUploadPermissions ? "pass" : "fail",
      `Canvas media requires ${_clipboardGetRoleLabel(canvasRole)} and above. That role ${canvasRoleHasUploadPermissions ? "has" : "does not have"} Use File Browser plus Upload Files in Foundry core permissions.`,
      `Open Game Settings -> Configure Permissions and enable Use File Browser plus Upload Files for ${_clipboardGetRoleLabel(canvasRole)} if players at that role should paste or replace canvas media.`,
      {
        role: canvasRole,
        browseRoles: _clipboardGetCorePermissionRoles("FILES_BROWSE"),
        uploadRoles: _clipboardGetCorePermissionRoles("FILES_UPLOAD"),
      }
    )
  );

  section.items.push(
    _clipboardCreateReadinessItem(
      "chat-role-gate",
      "Chat media, PDF, and audio role gate",
      chatEnabled ? (chatRoleHasUploadPermissions ? "pass" : "fail") : "warn",
      chatEnabled
        ? `Chat media, PDF, and audio posting requires ${_clipboardGetRoleLabel(chatRole)} and above. That role ${chatRoleHasUploadPermissions ? "has" : "does not have"} Use File Browser plus Upload Files in Foundry core permissions.`
        : "Chat media, PDF, and audio handling is disabled in this world, so players will keep normal chat text behavior only.",
      chatEnabled
        ? `Open Game Settings -> Configure Permissions and enable Use File Browser plus Upload Files for ${_clipboardGetRoleLabel(chatRole)} if players at that role should post pasted media, PDFs, or audio to chat.`
        : "Enable chat media, PDF, and audio handling if you want players to paste or upload media, PDFs, or audio into chat.",
      {
        role: chatRole,
        chatEnabled,
      }
    )
  );

  const sceneControlsEnabledForPlayers = allowNonGmSceneControls && (scenePasteEnabled || sceneUploadEnabled);
  section.items.push(
    _clipboardCreateReadinessItem(
      "scene-controls",
      "Scene control visibility",
      sceneControlsEnabledForPlayers ? (canvasRoleHasUploadPermissions ? "pass" : "fail") : "warn",
      sceneControlsEnabledForPlayers
        ? `Explicit scene tools are visible to non-GM users who meet the ${_clipboardGetRoleLabel(canvasRole)} canvas-media role gate.`
        : "Non-GM scene controls are hidden or disabled, so players must rely on native paste handling rather than explicit scene tools.",
      sceneControlsEnabledForPlayers
        ? `If the tools should work for players, make sure ${_clipboardGetRoleLabel(canvasRole)} still has Use File Browser and Upload Files in Game Settings -> Configure Permissions.`
        : "Enable Allow non-GMs to use scene controls and the scene Paste/Upload tools if players should have explicit fallback buttons on the canvas.",
      {
        allowNonGmSceneControls,
        scenePasteEnabled,
        sceneUploadEnabled,
        role: canvasRole,
      }
    )
  );

  return section;
}

function _clipboardEvaluateDefaultProfileSection() {
  const differences = _clipboardGetSettingsThatDifferFromDefaults();
  /** @type {ReadinessSection} */
  const section = {
    id: "default-profile-drift",
    title: "Default-profile drift",
    items: [
      _clipboardCreateReadinessItem(
        "recommended-defaults",
        "Recommended defaults drift",
        differences.length ? "warn" : "pass",
        differences.length
          ? `This world differs from the shipped recommended behavior defaults in ${differences.length} configurable world setting${differences.length === 1 ? "" : "s"}.`
          : "This world matches the shipped recommended configurable behavior defaults.",
        differences.length
          ? "Use Apply recommended defaults if you want this world to match the currently documented first-run behavior profile."
          : "No action is needed unless you intentionally want a different world behavior profile.",
        {
          differences: differences.map(difference => ({
            key: difference.key,
            displayName: difference.displayName,
            currentValue: difference.currentValue,
            defaultValue: difference.defaultValue,
          })),
        }
      ),
    ],
  };

  return section;
}

/**
 * @returns {ReadinessReport}
 */
function _clipboardGetReadinessReport() {
  /** @type {ReadinessSection[]} */
  const sections = [
    _clipboardEvaluateClientCapabilitySection(),
    _clipboardEvaluateStorageReadinessSection(),
    _clipboardEvaluatePlayerUploadSection(),
    _clipboardEvaluateDefaultProfileSection(),
  ];
  const statusCounts = {pass: 0, warn: 0, fail: 0};
  for (const section of sections) {
    for (const item of section.items) {
      statusCounts[item.status] += 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    statusCounts,
    sections,
  };
}

module.exports = {
  _clipboardCreateReadinessItem,
  _clipboardGetModuleVersion,
  _clipboardGetBrowserContextSummary,
  _clipboardRoleHasPermission,
  _clipboardGetRoleLabel,
  _clipboardEvaluateClientCapabilitySection,
  _clipboardEvaluateStorageReadinessSection,
  _clipboardEvaluatePlayerUploadSection,
  _clipboardEvaluateDefaultProfileSection,
  _clipboardGetReadinessReport,
};
