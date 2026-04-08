// Generated from src/. Do not edit foundry-paste-eater.js directly.

var FoundryPasteEaterRuntime = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/constants.js
  var require_constants = __commonJS({
    "src/constants.js"(exports, module) {
      var CLIPBOARD_IMAGE_MODULE_ID = "foundry-paste-eater";
      var CLIPBOARD_IMAGE_LEGACY_MODULE_ID = "clipboard-image";
      var CLIPBOARD_IMAGE_TITLE = "Foundry Paste Eater";
      var CLIPBOARD_IMAGE_DEFAULT_FOLDER = "pasted_images";
      var CLIPBOARD_IMAGE_SOURCE_AUTO = "auto";
      var CLIPBOARD_IMAGE_SOURCE_DATA = "data";
      var CLIPBOARD_IMAGE_SOURCE_S3 = "s3";
      var CLIPBOARD_IMAGE_SOURCE_FORGE = "forgevtt";
      var CLIPBOARD_IMAGE_FILE_PICKER = foundry.applications.apps.FilePicker.implementation;
      var CLIPBOARD_IMAGE_KEYBOARD_MANAGER = foundry.helpers.interaction.KeyboardManager;
      var CLIPBOARD_IMAGE_FORM_APPLICATION = foundry.appv1.api.FormApplication;
      var CLIPBOARD_IMAGE_SCENE_CONTROLS = ["tiles", "tokens"];
      var CLIPBOARD_IMAGE_TOOL_PASTE = "foundry-paste-eater-paste";
      var CLIPBOARD_IMAGE_TOOL_UPLOAD = "foundry-paste-eater-upload";
      var CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE = "data-foundry-paste-eater-chat-root";
      var CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION = "foundry-paste-eater-chat-upload";
      var CLIPBOARD_IMAGE_TEXT_NOTE_FLAG = "textNote";
      var CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME = "Notes";
      var CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX = "Pasted Note";
      var CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING = "verbose-logging";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING = "minimum-role-canvas-media";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING = "minimum-role-canvas-text";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING = "minimum-role-chat-media";
      var CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING = "allow-non-gm-scene-controls";
      var CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING = "enable-chat-media";
      var CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING = "enable-chat-upload-button";
      var CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING = "enable-token-creation";
      var CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING = "enable-tile-creation";
      var CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING = "enable-token-replacement";
      var CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING = "enable-tile-replacement";
      var CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING = "enable-scene-paste-tool";
      var CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING = "enable-scene-upload-tool";
      var CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING = "default-empty-canvas-target";
      var CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING = "create-backing-actors";
      var CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING = "pasted-token-actor-type";
      var CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING = "lock-pasted-token-rotation";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING = "chat-media-display";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING = "canvas-text-paste-mode";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING = "scene-paste-prompt-mode";
      var CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING = "selected-token-paste-mode";
      var CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING = "upload-path-organization";
      var CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING = "known-upload-roots";
      var CLIPBOARD_IMAGE_ROLE_PLAYER = "PLAYER";
      var CLIPBOARD_IMAGE_ROLE_TRUSTED = "TRUSTED";
      var CLIPBOARD_IMAGE_ROLE_ASSISTANT = "ASSISTANT";
      var CLIPBOARD_IMAGE_ROLE_GAMEMASTER = "GAMEMASTER";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER = "active-layer";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE = "tile";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN = "token";
      var CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK = "ask";
      var CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT = "system-default";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW = "full-preview";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL = "thumbnail";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY = "link-only";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES = "scene-notes";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED = "disabled";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO = "auto";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS = "always";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER = "never";
      var CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY = "scene-only";
      var CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART = "actor-art";
      var CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT = "prompt";
      var CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT = "flat";
      var CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH = "context-user-month";
      var CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS = "canvas";
      var CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT = "chat";
      var CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART = "document-art";
      var CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT = "image/*,video/*";
      var CLIPBOARD_IMAGE_IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["apng", "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"]);
      var CLIPBOARD_IMAGE_VIDEO_EXTENSIONS = /* @__PURE__ */ new Set(["m4v", "mp4", "mpeg", "mpg", "ogg", "ogv", "webm"]);
      var CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS = Object.freeze({
        fallbackToCenter: true,
        requireCanvasFocus: false
      });
      module.exports = {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
        CLIPBOARD_IMAGE_TITLE,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_DATA,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_SOURCE_FORGE,
        CLIPBOARD_IMAGE_FILE_PICKER,
        CLIPBOARD_IMAGE_KEYBOARD_MANAGER,
        CLIPBOARD_IMAGE_FORM_APPLICATION,
        CLIPBOARD_IMAGE_SCENE_CONTROLS,
        CLIPBOARD_IMAGE_TOOL_PASTE,
        CLIPBOARD_IMAGE_TOOL_UPLOAD,
        CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE,
        CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
        CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
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
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
        CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
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
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK,
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT,
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
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
        CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
        CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
        CLIPBOARD_IMAGE_VIDEO_EXTENSIONS,
        CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
      };
    }
  });

  // src/canvas/actor-types.js
  var require_actor_types = __commonJS({
    "src/canvas/actor-types.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK,
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT
      } = require_constants();
      function _clipboardGetAvailableActorTypes() {
        const candidates = [
          game?.system?.documentTypes?.Actor,
          game?.documentTypes?.Actor,
          _clipboardGetActorDocumentClass()?.TYPES
        ];
        const baseDocumentType = CONST?.BASE_DOCUMENT_TYPE;
        for (const candidate of candidates) {
          if (!Array.isArray(candidate) || !candidate.length) continue;
          return candidate.filter((type) => type && type !== baseDocumentType);
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
        return String(type || "").split(/[-_]+/).filter(Boolean).map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" ") || "Actor";
      }
      function _clipboardGetPastedTokenActorTypeChoices() {
        const choices = {
          [CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK]: "Ask each time",
          [CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT]: "System default"
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
        return new Promise((resolve) => {
          let settled = false;
          const settle = (selection) => {
            const gameRoot = document.querySelector(".game");
            if (gameRoot instanceof HTMLElement) {
              gameRoot.focus({ preventScroll: true });
            }
            if (settled) return;
            settled = true;
            resolve(selection);
          };
          const availableTypes = _clipboardGetAvailableActorTypes();
          const resolvedDefaultType = _clipboardResolvePastedTokenActorType(CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT);
          const defaultSelection = {
            createBackingActor: true,
            actorType: resolvedDefaultType
          };
          const buttons = {
            actorless: {
              label: "Scene token only",
              callback: () => settle({ createBackingActor: false, actorType: null })
            },
            systemDefault: {
              label: _clipboardGetSystemDefaultActorTypeLabel(),
              callback: () => settle(defaultSelection)
            }
          };
          for (const type of availableTypes) {
            if (type === resolvedDefaultType) continue;
            buttons[`type-${type}`] = {
              label: `Create ${_clipboardGetActorTypeDisplayLabel(type)} Actor`,
              callback: () => settle({ createBackingActor: true, actorType: type })
            };
          }
          const DialogConstructor = (
            /** @type {any} */
            globalThis.Dialog
          );
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
            close: () => settle(defaultSelection)
          }, {
            classes: ["foundry-paste-eater-token-create-dialog"],
            width: 760
          });
          dialog.render(true);
        });
      }
      function _clipboardResolvePastedTokenActorType(configuredType = CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT) {
        const availableTypes = _clipboardGetAvailableActorTypes();
        const defaultType = CONFIG?.Actor?.defaultType || null;
        const normalizedConfiguredType = typeof configuredType === "string" ? configuredType.trim() : "";
        if (normalizedConfiguredType && normalizedConfiguredType !== CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK && normalizedConfiguredType !== CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT && (!availableTypes.length || availableTypes.includes(normalizedConfiguredType))) {
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
        _clipboardResolvePastedTokenActorType
      };
    }
  });

  // src/settings/schema.js
  var require_schema = __commonJS({
    "src/settings/schema.js"(exports, module) {
      var {
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
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
        CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
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
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH
      } = require_constants();
      var { _clipboardGetPastedTokenActorTypeChoices } = require_actor_types();
      var CLIPBOARD_IMAGE_SHIPPED_DEFAULTS = Object.freeze({
        "image-location": Object.freeze({ scope: "world", config: false, value: CLIPBOARD_IMAGE_DEFAULT_FOLDER }),
        "image-location-source": Object.freeze({ scope: "world", config: false, value: CLIPBOARD_IMAGE_SOURCE_DATA }),
        "image-location-bucket": Object.freeze({ scope: "world", config: false, value: "" }),
        [CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING]: Object.freeze({ scope: "client", config: true, value: false }),
        [CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER }),
        [CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER }),
        [CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_ROLE_PLAYER }),
        [CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER }),
        [CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK }),
        [CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING]: Object.freeze({ scope: "world", config: true, value: true }),
        [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL }),
        [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES }),
        [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO }),
        [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT }),
        [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING]: Object.freeze({ scope: "world", config: true, value: CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH }),
        [CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING]: Object.freeze({ scope: "world", config: false, value: "[]" })
      });
      var CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS = Object.freeze([
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
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
        CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
        CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
        CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING
      ]);
      function _clipboardGetRoleChoices() {
        return {
          [CLIPBOARD_IMAGE_ROLE_PLAYER]: "Player",
          [CLIPBOARD_IMAGE_ROLE_TRUSTED]: "Trusted Player",
          [CLIPBOARD_IMAGE_ROLE_ASSISTANT]: "Assistant GM",
          [CLIPBOARD_IMAGE_ROLE_GAMEMASTER]: "Gamemaster"
        };
      }
      var CLIPBOARD_IMAGE_SETTINGS_SCHEMA = Object.freeze([
        {
          key: "image-location",
          name: "Pasted media location",
          hint: "Folder where pasted media is saved.",
          scope: "world",
          config: false,
          type: String
        },
        {
          key: "image-location-source",
          name: "Pasted media source",
          hint: "File source where pasted media is saved.",
          scope: "world",
          config: false,
          type: String
        },
        {
          key: "image-location-bucket",
          name: "Pasted media bucket",
          hint: "Bucket used when pasted media is saved to an S3-compatible provider configured in Foundry.",
          scope: "world",
          config: false,
          type: String
        },
        {
          key: CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
          name: "Known upload roots",
          hint: "Internal support setting that records every configured upload root used by this world.",
          scope: "world",
          config: false,
          type: String
        },
        {
          key: CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
          name: "Verbose logging",
          hint: "Log detailed foundry-paste-eater diagnostics to the browser console for debugging.",
          scope: "client",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
          name: "Minimum role for canvas media paste",
          hint: "Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices,
          refreshTargets: ["sceneControls"]
        },
        {
          key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
          name: "Minimum role for canvas text paste",
          hint: "Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices
        },
        {
          key: CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
          name: "Minimum role for chat media paste",
          hint: "Lowest Foundry role allowed to post pasted/uploaded media into chat.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices,
          refreshTargets: ["chat"]
        },
        {
          key: CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
          name: "Allow non-GMs to use scene controls",
          hint: "Show Foundry Paste Eater scene control buttons to non-GM users who meet the canvas media role requirement.",
          scope: "world",
          config: true,
          type: Boolean,
          refreshTargets: ["sceneControls"]
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
          name: "Enable chat media handling",
          hint: "Allow pasted, dropped, and uploaded media in chat.",
          scope: "world",
          config: true,
          type: Boolean,
          refreshTargets: ["chat"]
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
          name: "Enable chat upload button",
          hint: "Show the Upload Chat Media button next to the chat input when chat media handling is enabled.",
          scope: "world",
          config: true,
          type: Boolean,
          refreshTargets: ["chat"]
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
          name: "Allow token creation from pasted media",
          hint: "Create a new token when pasted media targets token creation.",
          scope: "world",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
          name: "Allow tile creation from pasted media",
          hint: "Create a new tile when pasted media targets tile creation.",
          scope: "world",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
          name: "Allow token art replacement",
          hint: "Allow pasted media to replace the selected tokens. Non-GMs are limited to tokens they can update.",
          scope: "world",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
          name: "Allow tile art replacement",
          hint: "Allow pasted media to replace the selected tiles.",
          scope: "world",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
          name: "Enable scene Paste Media tool",
          hint: "Show the Paste Media scene control button.",
          scope: "world",
          config: true,
          type: Boolean,
          refreshTargets: ["sceneControls"]
        },
        {
          key: CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
          name: "Enable scene Upload Media tool",
          hint: "Show the Upload Media scene control button.",
          scope: "world",
          config: true,
          type: Boolean,
          refreshTargets: ["sceneControls"]
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
            [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN]: "Token"
          }
        },
        {
          key: CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
          name: "Create backing Actors for pasted tokens",
          hint: "Generate an Actor for each newly pasted token so the token can be opened and edited normally.",
          scope: "world",
          config: true,
          type: Boolean
        },
        {
          key: CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
          name: "Backing Actor type for pasted tokens",
          hint: "Choose whether new pasted tokens ask each time, use the system default Actor type, or always create a specific Actor type when backing Actors are enabled.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetPastedTokenActorTypeChoices
        },
        {
          key: CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
          name: "Lock pasted token rotation by default",
          hint: "When enabled, newly pasted tokens and their backing Actor prototype tokens start with visual rotation locked.",
          scope: "world",
          config: true,
          type: Boolean
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
            [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY]: "Link only"
          }
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
            [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED]: "Disabled"
          }
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
            [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER]: "Never show prompt"
          }
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
            [CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT]: "Ask each time"
          }
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
            [CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH]: "Context / user / month"
          }
        }
      ]);
      function _clipboardGetShippedDefaultValue(key) {
        return CLIPBOARD_IMAGE_SHIPPED_DEFAULTS[key]?.value;
      }
      function _clipboardGetShippedDefaultSettings({ scope = null, config = null } = {}) {
        return Object.fromEntries(
          Object.entries(CLIPBOARD_IMAGE_SHIPPED_DEFAULTS).filter(([, entry]) => {
            if (scope !== null && entry.scope !== scope) return false;
            if (config !== null && entry.config !== config) return false;
            return true;
          }).map(([key, entry]) => [key, entry.value])
        );
      }
      function _clipboardGetRegisteredSettingConfig(moduleId, key) {
        return game?.settings?.settings?.get?.(`${moduleId}.${key}`) || null;
      }
      function _clipboardGetSettingScope(key) {
        return _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.scope || _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key)?.scope || "world";
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
        const document2 = _clipboardGetStoredSettingDocument(moduleId, key);
        if (!document2 || !Object.hasOwn(document2, "value")) return void 0;
        return document2.value;
      }
      function _clipboardGetSetting(key) {
        const hasCurrentValue = _clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key);
        const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
        if (!hasCurrentValue && legacyValue !== void 0) return legacyValue;
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, key);
      }
      function _clipboardDescribeSettingValue(key, value) {
        const registeredConfig = _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key) || _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key) || null;
        if (registeredConfig?.choices && Object.hasOwn(registeredConfig.choices, value)) {
          return String(registeredConfig.choices[value]);
        }
        if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
        if (value === "") return "(empty)";
        if (value === null || value === void 0) return "(unset)";
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
        _clipboardGetSetting
      };
    }
  });

  // src/settings/recommended-defaults.js
  var require_recommended_defaults = __commonJS({
    "src/settings/recommended-defaults.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_TITLE,
        CLIPBOARD_IMAGE_FORM_APPLICATION
      } = require_constants();
      var {
        _clipboardGetShippedDefaultSettings,
        _clipboardDescribeSettingValue,
        _clipboardGetRegisteredSettingConfig,
        _clipboardGetSetting
      } = require_schema();
      function _clipboardGetSettingsThatDifferFromDefaults({ scope = "world", config = true } = {}) {
        const defaults = _clipboardGetShippedDefaultSettings({ scope, config });
        return Object.entries(defaults).reduce((differences, [key, defaultValue]) => {
          const currentValue = _clipboardGetSetting(key);
          if (currentValue === defaultValue) return differences;
          differences.push({
            key,
            currentValue,
            defaultValue,
            displayName: _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.name || key
          });
          return differences;
        }, []).sort((left, right) => left.displayName.localeCompare(right.displayName));
      }
      function _clipboardCreateDialogButtonLabel(iconClassName, label) {
        const safeLabel = foundry.utils.escapeHTML(label || "");
        const safeIconClassName = foundry.utils.escapeHTML(iconClassName || "");
        return safeIconClassName ? `<i class="${safeIconClassName}"></i> ${safeLabel}` : safeLabel;
      }
      async function _clipboardApplyShippedDefaults({ scope = "world", config = true } = {}) {
        const differences = _clipboardGetSettingsThatDifferFromDefaults({ scope, config });
        for (const difference of differences) {
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, difference.key, difference.defaultValue);
        }
        return differences.map((difference) => difference.key);
      }
      var FoundryPasteEaterRecommendedDefaultsConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        async render(force, options) {
          const differences = _clipboardGetSettingsThatDifferFromDefaults();
          const summary = differences.length ? `<p>This world differs from the current ${CLIPBOARD_IMAGE_TITLE} recommended behavior defaults in <strong>${differences.length}</strong> configurable world setting${differences.length === 1 ? "" : "s"}.</p>` : `<p>This world already matches the current ${CLIPBOARD_IMAGE_TITLE} configurable behavior defaults.</p>`;
          const details = differences.length ? `<ul>${differences.map((difference) => `<li><strong>${foundry.utils.escapeHTML(difference.displayName)}</strong>: ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.currentValue))} -> ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.defaultValue))}</li>`).join("")}</ul>` : "";
          const scopeNote = "<p>Only configurable world behavior settings are changed here. Upload destination and client-only diagnostics stay untouched.</p>";
          const dialog = new globalThis.Dialog({
            title: `${CLIPBOARD_IMAGE_TITLE}: Apply Recommended Defaults`,
            content: `${summary}${scopeNote}${details}`,
            buttons: differences.length ? {
              apply: {
                label: _clipboardCreateDialogButtonLabel(
                  "fa-solid fa-wand-magic-sparkles",
                  `Apply ${differences.length} Change${differences.length === 1 ? "" : "s"}`
                ),
                callback: async () => {
                  const updatedKeys = await _clipboardApplyShippedDefaults();
                  if (!updatedKeys.length) return;
                  ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Applied ${updatedKeys.length} recommended world setting${updatedKeys.length === 1 ? "" : "s"}.`);
                }
              },
              cancel: {
                label: _clipboardCreateDialogButtonLabel("fa-solid fa-xmark", "Cancel")
              }
            } : {
              close: {
                label: _clipboardCreateDialogButtonLabel("fa-solid fa-check", "Close")
              }
            },
            default: differences.length ? "apply" : "close"
          });
          return dialog.render(force, options);
        }
      };
      module.exports = {
        FoundryPasteEaterRecommendedDefaultsConfig,
        _clipboardCreateDialogButtonLabel,
        _clipboardGetSettingsThatDifferFromDefaults,
        _clipboardApplyShippedDefaults
      };
    }
  });

  // src/settings/policy.js
  var require_policy = __commonJS({
    "src/settings/policy.js"(exports, module) {
      var {
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
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH
      } = require_constants();
      var { _clipboardGetRoleChoices, _clipboardGetSetting } = require_schema();
      var { _clipboardGetPastedTokenActorTypeChoices } = require_actor_types();
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
        if (configuredMode === CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES || configuredMode === CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED;
      }
      function _clipboardCanUseCanvasText() {
        return _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING) && _clipboardGetCanvasTextPasteMode() !== CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED;
      }
      function _clipboardCanUseChatMedia() {
        return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING) && _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING);
      }
      function _clipboardCanUseChatUploadButton() {
        return _clipboardCanUseChatMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING);
      }
      function _clipboardCanUseSceneControls() {
        if (game.user?.isGM) return true;
        return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING) && _clipboardCanUseCanvasMedia();
      }
      function _clipboardCanUseScenePasteTool() {
        return _clipboardCanUseSceneControls() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING);
      }
      function _clipboardCanUseSceneUploadTool() {
        return _clipboardCanUseSceneControls() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING);
      }
      function _clipboardGetDefaultEmptyCanvasTarget() {
        const configuredTarget = _clipboardGetSetting(CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING);
        if (configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE || configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER || configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN) {
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
        if (configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW || configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL;
      }
      function _clipboardGetScenePastePromptMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS || configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO;
      }
      function _clipboardGetSelectedTokenPasteMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY || configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART || configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT;
      }
      function _clipboardGetUploadPathOrganizationMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT || configuredMode === CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH;
      }
      function _clipboardCanCreateTokens() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING);
      }
      function _clipboardCanCreateTiles() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING);
      }
      function _clipboardCanReplaceTokens() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING);
      }
      function _clipboardCanReplaceTiles() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING);
      }
      function _clipboardRefreshSceneControlsUi() {
        const activeControl = ui?.controls?.control?.name || canvas?.activeLayer?.options?.name || "tiles";
        ui?.controls?.initialize?.({ control: activeControl });
        ui?.controls?.render?.(true);
      }
      function _clipboardRefreshChatUi() {
        ui?.chat?.render?.(true);
      }
      function _clipboardRefreshUiForSettingsChange({ sceneControls = false, chat = false } = {}) {
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
        _clipboardRefreshUiForSettingsChange
      };
    }
  });

  // src/settings/migrations.js
  var require_migrations = __commonJS({
    "src/settings/migrations.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      var {
        CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS,
        _clipboardGetSettingScope,
        _clipboardHasStoredSetting,
        _clipboardGetStoredSettingValue
      } = require_schema();
      async function _clipboardMigrateLegacySettings() {
        if (CLIPBOARD_IMAGE_MODULE_ID === CLIPBOARD_IMAGE_LEGACY_MODULE_ID) return [];
        const migrated = [];
        for (const key of CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS) {
          const scope = _clipboardGetSettingScope(key);
          if (scope === "world" && !game?.user?.isGM) continue;
          if (_clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key)) continue;
          const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
          if (legacyValue === void 0) continue;
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, key, legacyValue);
          migrated.push(key);
        }
        if (migrated.length) {
          _clipboardLog("info", "Migrated legacy module settings to the new namespace.", {
            legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
            moduleId: CLIPBOARD_IMAGE_MODULE_ID,
            settings: migrated
          });
        }
        return migrated;
      }
      module.exports = {
        _clipboardMigrateLegacySettings
      };
    }
  });

  // src/storage/destination.js
  var require_destination = __commonJS({
    "src/storage/destination.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_DATA,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_SOURCE_FORGE,
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT,
        CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
      } = require_constants();
      function _clipboardUsingTheForge() {
        return typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge;
      }
      function _clipboardGetStoredSource() {
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source")?.trim() || CLIPBOARD_IMAGE_SOURCE_DATA;
      }
      function _clipboardResolveSource(source) {
        if (!source || source === CLIPBOARD_IMAGE_SOURCE_AUTO) {
          return _clipboardUsingTheForge() ? CLIPBOARD_IMAGE_SOURCE_FORGE : CLIPBOARD_IMAGE_SOURCE_DATA;
        }
        if (source === CLIPBOARD_IMAGE_SOURCE_FORGE && !_clipboardUsingTheForge()) {
          return CLIPBOARD_IMAGE_SOURCE_DATA;
        }
        return source;
      }
      function _clipboardGetSourceLabel(source) {
        switch (source) {
          case CLIPBOARD_IMAGE_SOURCE_AUTO:
            return "Automatic";
          case CLIPBOARD_IMAGE_SOURCE_DATA:
            return "User Data";
          case CLIPBOARD_IMAGE_SOURCE_S3:
            return "S3-Compatible Storage";
          case CLIPBOARD_IMAGE_SOURCE_FORGE:
            return "The Forge";
          default:
            return source;
        }
      }
      function _clipboardGetSourceChoices(currentSource = _clipboardGetStoredSource()) {
        const choices = {
          [CLIPBOARD_IMAGE_SOURCE_AUTO]: `Automatic (${_clipboardGetSourceLabel(_clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO))})`,
          [CLIPBOARD_IMAGE_SOURCE_DATA]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_DATA),
          [CLIPBOARD_IMAGE_SOURCE_S3]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_S3)
        };
        if (_clipboardUsingTheForge()) {
          choices[CLIPBOARD_IMAGE_SOURCE_FORGE] = _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_FORGE);
        }
        if (currentSource && !Object.hasOwn(choices, currentSource)) {
          choices[currentSource] = `Custom (${currentSource})`;
        }
        return choices;
      }
      function _clipboardCanSelectSource(source) {
        return source !== "public";
      }
      function _clipboardGetStoredBucket() {
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket")?.trim() || "";
      }
      function _clipboardGetConfiguredS3Endpoint() {
        const endpoint = game?.data?.files?.s3?.endpoint;
        if (!endpoint) return "";
        if (typeof endpoint === "string") return endpoint.trim();
        if (typeof endpoint?.href === "string") return endpoint.href.trim();
        if (typeof endpoint?.url === "string") return endpoint.url.trim();
        return `${endpoint}`.trim();
      }
      function _clipboardGetTargetFolder() {
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location")?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
      }
      function _clipboardGetUploadPathOrganizationSetting() {
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING)?.trim() || CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT;
      }
      function _clipboardGetUploadContextSegment(uploadContext) {
        switch (uploadContext) {
          case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT:
            return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT;
          case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART:
            return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART;
          case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS:
          default:
            return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS;
        }
      }
      function _clipboardNormalizeUploadPathSegment(value, fallback = "") {
        const normalized = String(value || "").trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
        return normalized || fallback;
      }
      function _clipboardBuildOrganizedUploadTarget(baseTarget, {
        organizationMode = _clipboardGetUploadPathOrganizationSetting(),
        uploadContext = CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        userId = game?.user?.id || "user",
        date = /* @__PURE__ */ new Date()
      } = {}) {
        const normalizedBaseTarget = _clipboardNormalizeUploadPathSegment(baseTarget, CLIPBOARD_IMAGE_DEFAULT_FOLDER);
        if (organizationMode !== CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH) {
          return normalizedBaseTarget;
        }
        const resolvedDate = date instanceof Date && !Number.isNaN(date.valueOf()) ? date : /* @__PURE__ */ new Date();
        const monthSegment = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, "0")}`;
        return [
          normalizedBaseTarget,
          _clipboardGetUploadContextSegment(uploadContext),
          _clipboardNormalizeUploadPathSegment(userId, "user"),
          monthSegment
        ].join("/");
      }
      function _clipboardGetConfiguredUploadRoot(overrides = {}) {
        const storedSource = overrides.storedSource ?? overrides.source ?? _clipboardGetStoredSource();
        const resolvedSource = _clipboardResolveSource(storedSource);
        const target = _clipboardNormalizeUploadPathSegment(
          Object.hasOwn(overrides, "target") ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER : _clipboardGetTargetFolder(),
          CLIPBOARD_IMAGE_DEFAULT_FOLDER
        );
        const bucket = resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? Object.hasOwn(overrides, "bucket") ? overrides.bucket?.trim() || "" : _clipboardGetStoredBucket() : "";
        return {
          storedSource,
          source: resolvedSource,
          target,
          bucket,
          endpoint: resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? _clipboardGetConfiguredS3Endpoint() : ""
        };
      }
      function _clipboardGetUploadDestination(overrides = {}) {
        const configuredRoot = _clipboardGetConfiguredUploadRoot(overrides);
        const target = _clipboardBuildOrganizedUploadTarget(configuredRoot.target, {
          organizationMode: overrides.organizationMode ?? _clipboardGetUploadPathOrganizationSetting(),
          uploadContext: overrides.uploadContext ?? CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
          userId: overrides.userId ?? game?.user?.id ?? "user",
          date: overrides.date
        });
        return {
          storedSource: configuredRoot.storedSource,
          source: configuredRoot.source,
          target,
          bucket: configuredRoot.bucket,
          endpoint: configuredRoot.endpoint
        };
      }
      function _clipboardGetFilePickerOptions(destination) {
        const options = {};
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && destination.bucket) {
          options.bucket = destination.bucket;
        }
        return options;
      }
      function _clipboardDescribeDestination(destination) {
        if (destination.storedSource === CLIPBOARD_IMAGE_SOURCE_AUTO) {
          return `${_clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_AUTO)} (${_clipboardGetSourceLabel(destination.source)}) / ${destination.target}`;
        }
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
          const bucket = destination.bucket || "(select a bucket)";
          return `${_clipboardGetSourceLabel(destination.source)} / ${bucket} / ${destination.target}`;
        }
        return `${_clipboardGetSourceLabel(destination.source)} / ${destination.target}`;
      }
      module.exports = {
        _clipboardUsingTheForge,
        _clipboardGetStoredSource,
        _clipboardResolveSource,
        _clipboardGetSourceLabel,
        _clipboardGetSourceChoices,
        _clipboardCanSelectSource,
        _clipboardGetStoredBucket,
        _clipboardGetConfiguredS3Endpoint,
        _clipboardGetTargetFolder,
        _clipboardGetUploadPathOrganizationSetting,
        _clipboardGetUploadContextSegment,
        _clipboardNormalizeUploadPathSegment,
        _clipboardBuildOrganizedUploadTarget,
        _clipboardGetConfiguredUploadRoot,
        _clipboardGetUploadDestination,
        _clipboardGetFilePickerOptions,
        _clipboardDescribeDestination
      };
    }
  });

  // src/storage/permissions.js
  var require_permissions = __commonJS({
    "src/storage/permissions.js"(exports, module) {
      var { CLIPBOARD_IMAGE_SOURCE_S3 } = require_constants();
      var {
        _clipboardGetSourceLabel
      } = require_destination();
      var { _clipboardDescribeDestinationForLog } = require_diagnostics();
      function _clipboardIsStoragePermissionError(error) {
        const message = String(error?.message || error || "");
        return /(permission|forbidden|access denied|not authorized|not permitted|unauthorized|accessdenied|eacces)/i.test(message);
      }
      function _clipboardGetCurrentUserRole() {
        if (typeof game?.user?.role === "number") return game.user.role;
        if (game?.user?.isGM) return CONST?.USER_ROLES?.GAMEMASTER ?? 4;
        return CONST?.USER_ROLES?.PLAYER ?? 1;
      }
      function _clipboardGetCorePermissionRoles(permission) {
        const permissions = game?.settings?.get?.("core", "permissions") || {};
        const roles = permissions?.[permission];
        return Array.isArray(roles) ? roles : [];
      }
      function _clipboardUserHasCorePermission(permission) {
        if (game?.user?.isGM) return true;
        return _clipboardGetCorePermissionRoles(permission).includes(_clipboardGetCurrentUserRole());
      }
      function _clipboardHasCoreFileUploadPermissions() {
        return _clipboardUserHasCorePermission("FILES_BROWSE") && _clipboardUserHasCorePermission("FILES_UPLOAD");
      }
      function _clipboardBuildStoragePermissionDestinationLabel(destination) {
        return destination.source === CLIPBOARD_IMAGE_SOURCE_S3 ? `the active ${_clipboardGetSourceLabel(destination.source)} destination${destination.bucket ? ` (${destination.bucket})` : ""}` : `the active ${_clipboardGetSourceLabel(destination.source)} destination`;
      }
      function _clipboardBuildStoragePermissionResolution(destination) {
        const destinationLabel = _clipboardBuildStoragePermissionDestinationLabel(destination);
        if (!_clipboardHasCoreFileUploadPermissions()) {
          return `Have a GM open Game Settings -> Configure Permissions and enable Use File Browser plus Upload Files for this player's role. After that, verify ${destinationLabel} is writable for this player.`;
        }
        return `This user's role already has Use File Browser and Upload Files in Game Settings -> Configure Permissions. Verify backend write access for ${destinationLabel}, including any storage credentials, bucket policy, or filesystem permissions.`;
      }
      function _clipboardWrapStoragePermissionError(error, destination, phase) {
        if (!_clipboardIsStoragePermissionError(error)) return error;
        const wrappedError = new Error(`Foundry denied permission to ${phase} in the active storage destination.`);
        wrappedError.cause = error;
        wrappedError.clipboardSummary = `Foundry denied permission to ${phase} in the active storage destination.`;
        wrappedError.clipboardResolution = _clipboardBuildStoragePermissionResolution(destination);
        wrappedError.clipboardStoragePermission = true;
        wrappedError.clipboardStoragePermissionPhase = phase;
        wrappedError.clipboardDestination = _clipboardDescribeDestinationForLog(destination);
        return wrappedError;
      }
      function _clipboardAssertUploadDestination(destination) {
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && !destination.bucket) {
          const error = new Error("S3-compatible destinations require a bucket selection.");
          error.clipboardSummary = "S3-compatible destinations require a bucket selection.";
          error.clipboardResolution = "A GM can fix this in Foundry Paste Eater's world settings by choosing a bucket for the active S3-compatible destination.";
          throw error;
        }
      }
      module.exports = {
        _clipboardIsStoragePermissionError,
        _clipboardGetCurrentUserRole,
        _clipboardGetCorePermissionRoles,
        _clipboardUserHasCorePermission,
        _clipboardHasCoreFileUploadPermissions,
        _clipboardBuildStoragePermissionDestinationLabel,
        _clipboardBuildStoragePermissionResolution,
        _clipboardAssertUploadDestination,
        _clipboardWrapStoragePermissionError
      };
    }
  });

  // src/media.js
  var require_media = __commonJS({
    "src/media.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
        CLIPBOARD_IMAGE_VIDEO_EXTENSIONS
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      function _clipboardNormalizeMimeType(value) {
        return value?.split(";").shift()?.trim()?.toLowerCase() || "";
      }
      function _clipboardGetFilenameExtension(filename) {
        return filename?.split(/[?#]/).shift()?.split(".").pop()?.trim()?.toLowerCase() || "";
      }
      function _clipboardGetFileExtension(blob) {
        if (blob instanceof File && blob.name.includes(".")) {
          return blob.name.split(".").pop().toLowerCase();
        }
        const mimeType = _clipboardNormalizeMimeType(blob.type).split("/").pop()?.toLowerCase() || "png";
        return mimeType.replace("jpeg", "jpg").replace("svg+xml", "svg").replace("x-icon", "ico").split("+")[0];
      }
      function _clipboardParseSupportedUrl(value) {
        if (!value) return null;
        try {
          const url = new URL(value);
          if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) return null;
          return url.href;
        } catch (error) {
          return null;
        }
      }
      function _clipboardGetFilenameFromUrl(url) {
        const parsedUrl = _clipboardParseSupportedUrl(url);
        if (!parsedUrl) return "";
        const urlObject = new URL(parsedUrl);
        if (!["http:", "https:"].includes(urlObject.protocol)) return "";
        let filename = urlObject.pathname.split("/").pop() || "";
        try {
          filename = decodeURIComponent(filename);
        } catch (error) {
        }
        return filename === "/" ? "" : filename;
      }
      function _clipboardLooksLikeImageFilename(filename) {
        return CLIPBOARD_IMAGE_IMAGE_EXTENSIONS.has(_clipboardGetFilenameExtension(filename));
      }
      function _clipboardLooksLikeVideoFilename(filename) {
        const extension = _clipboardGetFilenameExtension(filename);
        if (!extension) return false;
        const foundryVideoHelper = globalThis.foundry?.helpers?.media?.VideoHelper;
        if (foundryVideoHelper?.hasVideoExtension?.(filename)) return true;
        return CLIPBOARD_IMAGE_VIDEO_EXTENSIONS.has(extension);
      }
      function _clipboardIsImageMimeType(mimeType) {
        return _clipboardNormalizeMimeType(mimeType).startsWith("image/");
      }
      function _clipboardIsVideoMimeType(mimeType) {
        return _clipboardNormalizeMimeType(mimeType).startsWith("video/");
      }
      function _clipboardIsMediaMimeType(mimeType) {
        return _clipboardIsImageMimeType(mimeType) || _clipboardIsVideoMimeType(mimeType);
      }
      function _clipboardGetMediaKind({ blob, filename, mimeType, src } = {}) {
        const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
        if (_clipboardIsVideoMimeType(normalizedMimeType)) return "video";
        if (_clipboardIsImageMimeType(normalizedMimeType)) return "image";
        const candidate = filename || (src ? _clipboardGetFilenameFromUrl(src) || src : "");
        if (_clipboardLooksLikeVideoFilename(candidate)) return "video";
        if (_clipboardLooksLikeImageFilename(candidate)) return "image";
        return null;
      }
      function _clipboardIsSupportedMediaBlob(blob) {
        return Boolean(blob && _clipboardGetMediaKind({ blob, filename: blob.name }));
      }
      function _clipboardIsGifMedia({ blob, filename, mimeType, src } = {}) {
        const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
        if (normalizedMimeType === "image/gif") return true;
        const candidate = filename || blob?.name || (src ? _clipboardGetFilenameFromUrl(src) || src : "");
        return _clipboardGetFilenameExtension(candidate) === "gif";
      }
      function _clipboardCoerceMediaFile(blob, { filename = "", mimeType = "" } = {}) {
        if (!blob) return null;
        const candidateFilename = filename || (blob instanceof File ? blob.name : "") || "pasted_image";
        const resolvedMediaKind = _clipboardGetMediaKind({
          blob,
          filename: candidateFilename,
          mimeType
        });
        if (!resolvedMediaKind) return null;
        const normalizedBlobType = _clipboardNormalizeMimeType(blob.type);
        let resolvedMimeType = normalizedBlobType || _clipboardNormalizeMimeType(mimeType);
        if (!_clipboardIsMediaMimeType(resolvedMimeType)) {
          resolvedMimeType = _clipboardGetMimeTypeFromFilename(candidateFilename);
        }
        const typedBlob = normalizedBlobType === resolvedMimeType ? blob : new Blob([blob], { type: resolvedMimeType });
        const resolvedFilename = _clipboardEnsureFilenameExtension(candidateFilename, typedBlob);
        if (blob instanceof File && blob.name === resolvedFilename && normalizedBlobType === resolvedMimeType) {
          return blob;
        }
        return new File([typedBlob], resolvedFilename, { type: resolvedMimeType });
      }
      function _clipboardGetMimeTypeFromFilename(filename) {
        switch (_clipboardGetFilenameExtension(filename)) {
          case "apng":
            return "image/apng";
          case "avif":
            return "image/avif";
          case "bmp":
            return "image/bmp";
          case "gif":
            return "image/gif";
          case "ico":
            return "image/x-icon";
          case "jpg":
          case "jpeg":
            return "image/jpeg";
          case "png":
            return "image/png";
          case "tif":
          case "tiff":
            return "image/tiff";
          case "svg":
            return "image/svg+xml";
          case "webp":
            return "image/webp";
          case "m4v":
          case "mp4":
            return "video/mp4";
          case "mpeg":
          case "mpg":
            return "video/mpeg";
          case "ogg":
          case "ogv":
            return "video/ogg";
          case "webm":
            return "video/webm";
          default:
            return "image/png";
        }
      }
      function _clipboardEnsureFilenameExtension(filename, blob) {
        const resolvedExtension = _clipboardGetFileExtension(blob);
        const currentExtension = _clipboardGetFilenameExtension(filename);
        if (currentExtension === resolvedExtension && filename) return filename;
        const baseName = filename?.replace(/\.[^./]+$/, "") || `pasted_image_${Date.now()}`;
        return `${baseName}.${resolvedExtension}`;
      }
      function _clipboardGetTileVideoData(mediaKind) {
        if (mediaKind !== "video") return void 0;
        return {
          autoplay: true,
          loop: true,
          volume: 0
        };
      }
      function _clipboardScaleTileDimensions(imgWidth, imgHeight, sceneDimensions) {
        const scaledDimensions = { width: imgWidth, height: imgHeight };
        if (imgHeight > sceneDimensions.sceneHeight || imgWidth > sceneDimensions.sceneWidth) {
          scaledDimensions.width = sceneDimensions.sceneWidth / 3;
          scaledDimensions.height = scaledDimensions.width * imgHeight / imgWidth;
        }
        return scaledDimensions;
      }
      function _clipboardRoundDimension(value) {
        return Math.round(value * 100) / 100;
      }
      function _clipboardScaleTokenDimensions(imgWidth, imgHeight) {
        if (!imgWidth || !imgHeight) return { width: 1, height: 1 };
        if (imgWidth >= imgHeight) {
          return {
            width: _clipboardRoundDimension(imgWidth / imgHeight),
            height: 1
          };
        }
        return {
          width: 1,
          height: _clipboardRoundDimension(imgHeight / imgWidth)
        };
      }
      function _clipboardParseSvgLength(value) {
        const normalized = String(value || "").trim();
        if (!normalized || normalized.endsWith("%")) return null;
        const match = normalized.match(/^([0-9]*\.?[0-9]+)(px)?$/i);
        if (!match) return null;
        const parsed = Number.parseFloat(match[1]);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      }
      function _clipboardGetSvgViewBoxDimensions(svgElement) {
        const viewBox = svgElement?.getAttribute?.("viewBox")?.trim();
        if (!viewBox) return null;
        const values = viewBox.split(/[\s,]+/).map(Number.parseFloat);
        if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
        const [, , width, height] = values;
        if (!(width > 0) || !(height > 0)) return null;
        return { width, height };
      }
      function _clipboardGetSvgElementFromText(svgText) {
        const documentFragment = new DOMParser().parseFromString(svgText, "image/svg+xml");
        return documentFragment.documentElement?.nodeName === "svg" ? documentFragment.documentElement : documentFragment.querySelector?.("svg");
      }
      function _clipboardGetSvgIntrinsicDimensionsFromText(svgText) {
        if (!svgText?.trim()) return null;
        const svgElement = _clipboardGetSvgElementFromText(svgText);
        if (!svgElement) return null;
        const width = _clipboardParseSvgLength(svgElement.getAttribute("width"));
        const height = _clipboardParseSvgLength(svgElement.getAttribute("height"));
        if (width && height) {
          return { width, height };
        }
        const viewBoxDimensions = _clipboardGetSvgViewBoxDimensions(svgElement);
        if (!viewBoxDimensions) return null;
        if (width) {
          return {
            width,
            height: _clipboardRoundDimension(width * (viewBoxDimensions.height / viewBoxDimensions.width))
          };
        }
        if (height) {
          return {
            width: _clipboardRoundDimension(height * (viewBoxDimensions.width / viewBoxDimensions.height)),
            height
          };
        }
        return viewBoxDimensions;
      }
      async function _clipboardReadBlobText(blob) {
        if (typeof blob?.text === "function") {
          return blob.text();
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(reader.error || new Error("Failed to read pasted SVG content"));
          reader.readAsText(blob);
        });
      }
      async function _clipboardGetPreferredMediaDimensions(blob) {
        if (_clipboardGetMediaKind({ blob, filename: blob?.name }) !== "image") return null;
        if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
          return null;
        }
        const svgText = await _clipboardReadBlobText(blob);
        const svgDimensions = _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
        if (!svgDimensions) return null;
        _clipboardLog("debug", "Resolved intrinsic SVG dimensions from uploaded media", {
          width: svgDimensions.width,
          height: svgDimensions.height,
          fileName: blob?.name || null,
          mimeType: _clipboardNormalizeMimeType(blob?.type) || null
        });
        return svgDimensions;
      }
      async function _clipboardNormalizeSvgBlobForUpload(blob, svgDimensions = null) {
        if (_clipboardGetMediaKind({ blob, filename: blob?.name }) !== "image") return blob;
        if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
          return blob;
        }
        const svgText = await _clipboardReadBlobText(blob);
        const svgElement = _clipboardGetSvgElementFromText(svgText);
        if (!svgElement) return blob;
        const resolvedDimensions = svgDimensions || _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
        if (!resolvedDimensions) return blob;
        const hasExplicitWidth = _clipboardParseSvgLength(svgElement.getAttribute("width"));
        const hasExplicitHeight = _clipboardParseSvgLength(svgElement.getAttribute("height"));
        if (hasExplicitWidth && hasExplicitHeight) return blob;
        svgElement.setAttribute("width", String(resolvedDimensions.width));
        svgElement.setAttribute("height", String(resolvedDimensions.height));
        _clipboardLog("debug", "Normalized uploaded SVG with explicit width and height", {
          width: resolvedDimensions.width,
          height: resolvedDimensions.height,
          fileName: blob?.name || null,
          mimeType: _clipboardNormalizeMimeType(blob?.type) || null
        });
        return new File(
          [new XMLSerializer().serializeToString(svgElement)],
          blob?.name || `pasted_image.${_clipboardGetFileExtension(blob) || "svg"}`,
          { type: _clipboardNormalizeMimeType(blob?.type) || "image/svg+xml" }
        );
      }
      async function _clipboardRasterizeImageBlob(blob, {
        mimeType = "image/png",
        filename = ""
      } = {}) {
        if (!blob) return null;
        const objectUrl = URL.createObjectURL(blob);
        try {
          const image = new Image();
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error("Failed to rasterize pasted media"));
            image.src = objectUrl;
          });
          if (typeof image.decode === "function") {
            try {
              await image.decode();
            } catch (error) {
            }
          }
          const width = image.naturalWidth || image.width;
          const height = image.naturalHeight || image.height;
          if (!width || !height) {
            throw new Error("Failed to rasterize pasted media");
          }
          const canvasElement = document.createElement("canvas");
          canvasElement.width = width;
          canvasElement.height = height;
          const context = canvasElement.getContext("2d");
          if (!context) {
            throw new Error("Canvas rasterization is unavailable");
          }
          context.drawImage(image, 0, 0, width, height);
          const rasterizedBlob = await new Promise((resolve, reject) => {
            canvasElement.toBlob((result) => {
              if (result) resolve(result);
              else reject(new Error("Failed to rasterize pasted media"));
            }, mimeType);
          });
          const baseName = String(filename || blob?.name || "pasted_image").replace(/\.[^./]+$/, "") || "pasted_image";
          const rasterizedFile = new File([rasterizedBlob], `${baseName}.png`, { type: mimeType });
          _clipboardLog("info", "Rasterized pasted image for a canvas-compatible upload", {
            originalName: blob?.name || null,
            originalType: _clipboardNormalizeMimeType(blob?.type) || null,
            rasterizedName: rasterizedFile.name,
            rasterizedType: rasterizedFile.type,
            width,
            height
          });
          return rasterizedFile;
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }
      async function _clipboardConvertGifToStaticPng(blob) {
        if (!_clipboardIsGifMedia({ blob, filename: blob?.name, mimeType: blob?.type })) return blob;
        return _clipboardRasterizeImageBlob(blob, {
          mimeType: "image/png",
          filename: blob?.name
        });
      }
      async function _clipboardLoadImageDimensions(path) {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error("Failed to determine pasted media size"));
          image.src = path;
        });
        if (typeof image.decode === "function") {
          try {
            await image.decode();
          } catch (error) {
          }
        }
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        image.src = "";
        if (!width || !height) {
          throw new Error("Failed to determine pasted media size");
        }
        return { width, height };
      }
      async function _clipboardLoadVideoDimensions(path) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = () => reject(new Error("Failed to determine pasted media size"));
          video.src = path;
        });
        const width = video.videoWidth;
        const height = video.videoHeight;
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (!width || !height) {
          throw new Error("Failed to determine pasted media size");
        }
        return { width, height };
      }
      async function _clipboardLoadMediaDimensions(path) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) === "video" ? "video" : "image";
        const dimensions = mediaKind === "video" ? await _clipboardLoadVideoDimensions(path) : await _clipboardLoadImageDimensions(path);
        _clipboardLog("debug", "Loaded pasted media dimensions", {
          path,
          mediaKind,
          width: dimensions.width,
          height: dimensions.height
        });
        return dimensions;
      }
      module.exports = {
        _clipboardNormalizeMimeType,
        _clipboardGetFilenameExtension,
        _clipboardGetFileExtension,
        _clipboardParseSupportedUrl,
        _clipboardGetFilenameFromUrl,
        _clipboardLooksLikeImageFilename,
        _clipboardLooksLikeVideoFilename,
        _clipboardIsImageMimeType,
        _clipboardIsVideoMimeType,
        _clipboardIsMediaMimeType,
        _clipboardGetMediaKind,
        _clipboardIsSupportedMediaBlob,
        _clipboardIsGifMedia,
        _clipboardCoerceMediaFile,
        _clipboardGetMimeTypeFromFilename,
        _clipboardEnsureFilenameExtension,
        _clipboardGetTileVideoData,
        _clipboardScaleTileDimensions,
        _clipboardRoundDimension,
        _clipboardScaleTokenDimensions,
        _clipboardParseSvgLength,
        _clipboardGetSvgViewBoxDimensions,
        _clipboardGetSvgElementFromText,
        _clipboardReadBlobText,
        _clipboardGetSvgIntrinsicDimensionsFromText,
        _clipboardGetPreferredMediaDimensions,
        _clipboardNormalizeSvgBlobForUpload,
        _clipboardRasterizeImageBlob,
        _clipboardConvertGifToStaticPng,
        _clipboardLoadImageDimensions,
        _clipboardLoadVideoDimensions,
        _clipboardLoadMediaDimensions
      };
    }
  });

  // src/storage/upload.js
  var require_upload = __commonJS({
    "src/storage/upload.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_FILE_PICKER
      } = require_constants();
      var {
        _clipboardDescribeDestinationForLog,
        _clipboardDescribeFile,
        _clipboardLog
      } = require_diagnostics();
      var {
        _clipboardCoerceMediaFile,
        _clipboardEnsureFilenameExtension,
        _clipboardGetFileExtension,
        _clipboardGetMimeTypeFromFilename,
        _clipboardNormalizeMimeType,
        _clipboardNormalizeSvgBlobForUpload
      } = require_media();
      var { _clipboardGetFilePickerOptions } = require_destination();
      var {
        _clipboardAssertUploadDestination,
        _clipboardIsStoragePermissionError,
        _clipboardWrapStoragePermissionError
      } = require_permissions();
      async function _clipboardCreateFolderIfMissing(destination) {
        const options = _clipboardGetFilePickerOptions(destination);
        _clipboardAssertUploadDestination(destination);
        _clipboardLog("debug", "Ensuring upload destination exists", {
          destination: _clipboardDescribeDestinationForLog(destination)
        });
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
          _clipboardLog("debug", "Skipping directory creation for S3-compatible destination", {
            destination: _clipboardDescribeDestinationForLog(destination)
          });
          return;
        }
        try {
          await CLIPBOARD_IMAGE_FILE_PICKER.browse(destination.source, destination.target, options);
        } catch (error) {
          if (_clipboardIsStoragePermissionError(error)) {
            throw _clipboardWrapStoragePermissionError(error, destination, "create or access the upload folder");
          }
          const segments = destination.target.split("/").filter(Boolean);
          let currentPath = "";
          try {
            for (const segment of segments) {
              currentPath = currentPath ? `${currentPath}/${segment}` : segment;
              try {
                await CLIPBOARD_IMAGE_FILE_PICKER.browse(destination.source, currentPath, options);
              } catch (browseError) {
                try {
                  _clipboardLog("debug", "Creating missing upload directory segment", {
                    destination: _clipboardDescribeDestinationForLog(destination),
                    currentPath
                  });
                  await CLIPBOARD_IMAGE_FILE_PICKER.createDirectory(destination.source, currentPath, options);
                } catch (createError) {
                  const message = createError instanceof Error ? createError.message : `${createError}`;
                  if (!/already exists|EEXIST/i.test(message)) throw createError;
                }
              }
            }
          } catch (nestedError) {
            throw _clipboardWrapStoragePermissionError(nestedError, destination, "create or access the upload folder");
          }
        }
        _clipboardLog("debug", "Upload destination is ready", {
          destination: _clipboardDescribeDestinationForLog(destination)
        });
      }
      function _clipboardCreateVersionedFilename(filename, version = Date.now()) {
        const normalizedFilename = String(filename || "").trim() || "pasted_image";
        const extensionMatch = normalizedFilename.match(/\.([^./]+)$/);
        const extension = extensionMatch?.[1] || "";
        const baseName = extension ? normalizedFilename.slice(0, -(extension.length + 1)) : normalizedFilename;
        const suffix = encodeURIComponent(String(version));
        return extension ? `${baseName}-${suffix}.${extension}` : `${baseName}-${suffix}`;
      }
      function _clipboardCreateUploadFile(blob, version = Date.now()) {
        const sourceName = blob instanceof File && blob.name ? blob.name : `pasted_image.${_clipboardGetFileExtension(blob)}`;
        const normalizedFile = _clipboardCoerceMediaFile(blob, {
          filename: sourceName,
          mimeType: blob?.type
        });
        const resolvedName = normalizedFile?.name || _clipboardEnsureFilenameExtension(sourceName, blob);
        const resolvedType = _clipboardNormalizeMimeType(normalizedFile?.type || blob?.type) || _clipboardGetMimeTypeFromFilename(resolvedName);
        const filename = _clipboardCreateVersionedFilename(resolvedName, version);
        return new File([normalizedFile || blob], filename, { type: resolvedType });
      }
      function _clipboardCreateFreshMediaPath(path, version = Date.now()) {
        if (!path || /^(data:|blob:)/i.test(path)) return path;
        const [basePath, hash = ""] = String(path).split("#", 2);
        const separator = basePath.includes("?") ? "&" : "?";
        const freshPath = `${basePath}${separator}${encodeURIComponent(CLIPBOARD_IMAGE_MODULE_ID)}=${encodeURIComponent(String(version))}`;
        return hash ? `${freshPath}#${hash}` : freshPath;
      }
      async function _clipboardUploadBlob(blob, targetFolder) {
        _clipboardAssertUploadDestination(targetFolder);
        const normalizedBlob = await _clipboardNormalizeSvgBlobForUpload(blob);
        const file = _clipboardCreateUploadFile(normalizedBlob);
        const fileDetails = _clipboardDescribeFile(file);
        _clipboardLog("info", "Uploading pasted media", {
          destination: _clipboardDescribeDestinationForLog(targetFolder),
          ...fileDetails
        });
        const uploadResponse = await CLIPBOARD_IMAGE_FILE_PICKER.upload(
          targetFolder.source,
          targetFolder.target,
          file,
          _clipboardGetFilePickerOptions(targetFolder)
        ).catch((error) => {
          throw _clipboardWrapStoragePermissionError(error, targetFolder, "upload pasted media");
        });
        const uploadPath = uploadResponse?.path;
        if (!uploadPath) {
          _clipboardLog("error", "Upload did not return a usable path", {
            destination: _clipboardDescribeDestinationForLog(targetFolder),
            response: uploadResponse || null,
            ...fileDetails
          });
          throw new Error("Upload failed before a usable media path was returned");
        }
        _clipboardLog("info", "Uploaded pasted media", {
          destination: _clipboardDescribeDestinationForLog(targetFolder),
          path: uploadPath
        });
        return uploadPath;
      }
      module.exports = {
        _clipboardCreateFolderIfMissing,
        _clipboardCreateVersionedFilename,
        _clipboardCreateUploadFile,
        _clipboardCreateFreshMediaPath,
        _clipboardUploadBlob
      };
    }
  });

  // src/storage/remote-url.js
  var require_remote_url = __commonJS({
    "src/storage/remote-url.js"(exports, module) {
      var { _clipboardLog } = require_diagnostics();
      var {
        _clipboardNormalizeMimeType,
        _clipboardGetMimeTypeFromFilename,
        _clipboardGetMediaKind,
        _clipboardIsMediaMimeType,
        _clipboardGetFilenameFromUrl,
        _clipboardEnsureFilenameExtension
      } = require_media();
      async function _clipboardFetchImageUrl(url) {
        let response;
        try {
          _clipboardLog("info", "Downloading pasted media URL", { url });
          response = await fetch(url);
        } catch (error) {
          throw new Error(`Failed to download pasted media URL from ${url}`);
        }
        if (!response.ok) {
          throw new Error(`Failed to download pasted media URL (${response.status} ${response.statusText})`);
        }
        const blob = await response.blob();
        const filename = _clipboardGetFilenameFromUrl(url);
        const contentType = _clipboardNormalizeMimeType(response.headers.get("content-type"));
        const blobType = _clipboardNormalizeMimeType(blob.type);
        const mediaKind = _clipboardGetMediaKind({ mimeType: contentType }) || _clipboardGetMediaKind({ mimeType: blobType }) || _clipboardGetMediaKind({ filename });
        if (!mediaKind) {
          throw new Error("Pasted URL did not resolve to supported media content");
        }
        const typedBlob = _clipboardIsMediaMimeType(contentType) || _clipboardIsMediaMimeType(blobType) ? blob : new Blob([blob], { type: _clipboardGetMimeTypeFromFilename(filename) });
        const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
        const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || _clipboardGetMimeTypeFromFilename(resolvedFilename);
        _clipboardLog("info", "Downloaded pasted media URL", {
          url,
          responseContentType: contentType || null,
          blobType: blobType || null,
          resolvedFilename,
          resolvedMimeType,
          size: typedBlob.size
        });
        return new File([typedBlob], resolvedFilename, { type: resolvedMimeType });
      }
      async function _clipboardResolveImageInputBlob(imageInput) {
        if (!imageInput) return null;
        if (imageInput.blob) return imageInput.blob;
        if (imageInput.url) return _clipboardFetchImageUrl(imageInput.url);
        return null;
      }
      module.exports = {
        _clipboardFetchImageUrl,
        _clipboardResolveImageInputBlob
      };
    }
  });

  // src/storage.js
  var require_storage = __commonJS({
    "src/storage.js"(exports, module) {
      module.exports = {
        ...require_destination(),
        ...require_permissions(),
        ...require_upload(),
        ...require_remote_url()
      };
    }
  });

  // src/support/known-roots.js
  var require_known_roots = __commonJS({
    "src/support/known-roots.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING
      } = require_constants();
      var {
        _clipboardDescribeDestination,
        _clipboardGetConfiguredUploadRoot,
        _clipboardNormalizeUploadPathSegment
      } = require_storage();
      function _clipboardCreateUploadRootKey(root) {
        const storedSource = String(root?.storedSource || root?.source || "").trim() || "data";
        const bucket = String(root?.bucket || "").trim();
        const target = _clipboardNormalizeUploadPathSegment(root?.target || "", "");
        return [storedSource, bucket, target].join("|");
      }
      function _clipboardNormalizeUploadRoot(root) {
        if (!root) return null;
        const normalizedTarget = _clipboardNormalizeUploadPathSegment(root.target || "", "");
        if (!normalizedTarget) return null;
        const normalizedRoot = {
          storedSource: String(root.storedSource || root.source || "data").trim() || "data",
          source: String(root.source || root.storedSource || "data").trim() || "data",
          target: normalizedTarget,
          bucket: String(root.bucket || "").trim(),
          endpoint: String(root.endpoint || "").trim(),
          key: "",
          label: ""
        };
        normalizedRoot.key = _clipboardCreateUploadRootKey(normalizedRoot);
        normalizedRoot.label = _clipboardDescribeDestination(normalizedRoot);
        return normalizedRoot;
      }
      function _clipboardParseKnownUploadRoots(rawValue) {
        if (!rawValue) return [];
        try {
          const parsed = JSON.parse(String(rawValue));
          if (!Array.isArray(parsed)) return [];
          return parsed.map((entry) => _clipboardNormalizeUploadRoot(entry)).filter(Boolean);
        } catch (_error) {
          return [];
        }
      }
      function _clipboardSerializeKnownUploadRoots(roots) {
        return JSON.stringify(
          (roots || []).map((entry) => _clipboardNormalizeUploadRoot(entry)).filter(Boolean).map((entry) => ({
            storedSource: entry.storedSource,
            source: entry.source,
            target: entry.target,
            bucket: entry.bucket,
            endpoint: entry.endpoint
          }))
        );
      }
      function _clipboardMergeKnownUploadRoots(roots, additions) {
        const merged = /* @__PURE__ */ new Map();
        for (const root of [...roots || [], ...additions || []]) {
          const normalizedRoot = _clipboardNormalizeUploadRoot(root);
          if (!normalizedRoot) continue;
          merged.set(normalizedRoot.key, normalizedRoot);
        }
        return Array.from(merged.values()).sort((left, right) => left.label.localeCompare(right.label));
      }
      function _clipboardGetStoredKnownUploadRoots() {
        return _clipboardParseKnownUploadRoots(
          game?.settings?.get?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING) || "[]"
        );
      }
      function _clipboardGetKnownUploadRoots({ includeCurrent = false } = {}) {
        const storedRoots = _clipboardGetStoredKnownUploadRoots();
        if (!includeCurrent) return storedRoots;
        return _clipboardMergeKnownUploadRoots(storedRoots, [_clipboardGetConfiguredUploadRoot()]);
      }
      async function _clipboardSetKnownUploadRoots(roots) {
        const serializedRoots = _clipboardSerializeKnownUploadRoots(roots);
        await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING, serializedRoots);
        return _clipboardParseKnownUploadRoots(serializedRoots);
      }
      async function _clipboardRememberKnownUploadRoots(additions) {
        const nextRoots = _clipboardMergeKnownUploadRoots(_clipboardGetStoredKnownUploadRoots(), additions);
        const currentSerialized = _clipboardSerializeKnownUploadRoots(_clipboardGetStoredKnownUploadRoots());
        const nextSerialized = _clipboardSerializeKnownUploadRoots(nextRoots);
        if (currentSerialized === nextSerialized) return nextRoots;
        return _clipboardSetKnownUploadRoots(nextRoots);
      }
      async function _clipboardRememberKnownUploadRoot(root) {
        return _clipboardRememberKnownUploadRoots([root]);
      }
      module.exports = {
        _clipboardCreateUploadRootKey,
        _clipboardNormalizeUploadRoot,
        _clipboardParseKnownUploadRoots,
        _clipboardSerializeKnownUploadRoots,
        _clipboardMergeKnownUploadRoots,
        _clipboardGetStoredKnownUploadRoots,
        _clipboardGetKnownUploadRoots,
        _clipboardSetKnownUploadRoots,
        _clipboardRememberKnownUploadRoots,
        _clipboardRememberKnownUploadRoot
      };
    }
  });

  // src/config-app.js
  var require_config_app = __commonJS({
    "src/config-app.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_FILE_PICKER,
        CLIPBOARD_IMAGE_FORM_APPLICATION
      } = require_constants();
      var {
        _clipboardResolveSource,
        _clipboardCanSelectSource,
        _clipboardGetStoredSource,
        _clipboardGetTargetFolder,
        _clipboardGetStoredBucket,
        _clipboardGetConfiguredS3Endpoint,
        _clipboardGetConfiguredUploadRoot,
        _clipboardGetUploadDestination,
        _clipboardDescribeDestination,
        _clipboardGetSourceChoices
      } = require_storage();
      var {
        _clipboardCreateUploadRootKey,
        _clipboardRememberKnownUploadRoots
      } = require_known_roots();
      var FoundryPasteEaterDestinationConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-paste-eater-destination-config",
            title: "Foundry Paste Eater: Upload Destination",
            template: "modules/foundry-paste-eater/templates/upload-destination.hbs",
            width: 520,
            closeOnSubmit: true
          });
        }
        getData() {
          const source = _clipboardGetStoredSource();
          const target = _clipboardGetTargetFolder();
          const bucket = _clipboardGetStoredBucket();
          const destination = _clipboardGetUploadDestination({ storedSource: source, target, bucket });
          return {
            bucket,
            destinationSummary: _clipboardDescribeDestination(destination),
            isS3: destination.storedSource === CLIPBOARD_IMAGE_SOURCE_S3,
            s3Endpoint: _clipboardGetConfiguredS3Endpoint(),
            source,
            sourceChoices: _clipboardGetSourceChoices(source),
            target
          };
        }
        activateListeners(html) {
          super.activateListeners(html);
          const sourceField = html.find('[name="source"]');
          const targetField = html.find('[name="target"]');
          const bucketField = html.find('[name="bucket"]');
          sourceField.on("change", () => this._refreshFormState());
          targetField.on("input", () => this._refreshFormState());
          bucketField.on("input", () => this._refreshFormState());
          html.find('[data-action="browse-destination"]').on("click", (event) => this._onBrowseDestination(event));
          this._refreshFormState();
        }
        _ensureSourceOption(source) {
          const sourceField = this.form?.elements?.source;
          if (!sourceField || !source) return;
          const choices = Array.from(sourceField.options).map((option2) => option2.value);
          if (choices.includes(source)) return;
          const option = document.createElement("option");
          option.value = source;
          option.text = `Custom (${source})`;
          sourceField.add(option);
        }
        _refreshFormState() {
          const form = this.form;
          if (!form) return;
          const storedSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const target = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const bucket = storedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? form.elements.bucket.value?.trim() || "" : "";
          const destination = _clipboardGetUploadDestination({ storedSource, target, bucket });
          const summaryField = form.querySelector('[data-role="destination-summary"]');
          const endpointField = form.querySelector('[data-role="s3-endpoint"]');
          const bucketGroup = this.element.find(".foundry-paste-eater-s3-bucket");
          const endpointGroup = this.element.find(".foundry-paste-eater-s3-endpoint");
          if (summaryField) summaryField.value = _clipboardDescribeDestination(destination);
          if (endpointField) endpointField.value = destination.endpoint || "";
          bucketGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
          endpointGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
        }
        _applyPickerSelection(path, picker, previousStoredSource) {
          const form = this.form;
          if (!form) return;
          const selectedSource = picker.activeSource || _clipboardResolveSource(previousStoredSource);
          if (!_clipboardCanSelectSource(selectedSource)) {
            ui.notifications.warn("Foundry Paste Eater: The selected file source does not support pasted uploads.");
            return;
          }
          const keepAutomatic = previousStoredSource === CLIPBOARD_IMAGE_SOURCE_AUTO && selectedSource === _clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO);
          const bucket = selectedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? picker.sources?.s3?.bucket || "" : "";
          this._ensureSourceOption(selectedSource);
          form.elements.source.value = keepAutomatic ? CLIPBOARD_IMAGE_SOURCE_AUTO : selectedSource;
          form.elements.target.value = path || picker.target || form.elements.target.value;
          form.elements.bucket.value = bucket;
          this._refreshFormState();
        }
        _onBrowseDestination(event) {
          event.preventDefault();
          const form = this.form;
          if (!form) return;
          const previousStoredSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const activeSource = _clipboardResolveSource(previousStoredSource);
          const currentTarget = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const currentBucket = form.elements.bucket.value?.trim() || "";
          const picker = new CLIPBOARD_IMAGE_FILE_PICKER({
            activeSource,
            button: event.currentTarget,
            callback: (path) => this._applyPickerSelection(path, picker, previousStoredSource),
            current: currentTarget,
            field: form.elements.target,
            type: "folder"
          });
          if (activeSource === CLIPBOARD_IMAGE_SOURCE_S3) {
            picker.sources.s3 = picker.sources.s3 || { target: currentTarget };
            picker.sources.s3.bucket = currentBucket || picker.sources.s3.bucket;
            picker.sources.s3.target = currentTarget;
          }
          void picker.render(true);
        }
        async _updateObject(_event, formData) {
          const previousRoot = _clipboardGetConfiguredUploadRoot();
          const source = formData.source?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const target = formData.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const bucket = source === CLIPBOARD_IMAGE_SOURCE_S3 ? formData.bucket?.trim() || "" : "";
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", source);
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location", target);
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", bucket);
          const nextRoot = _clipboardGetConfiguredUploadRoot({ storedSource: source, target, bucket });
          const rootsToRemember = _clipboardCreateUploadRootKey(previousRoot) === _clipboardCreateUploadRootKey(nextRoot) ? [nextRoot] : [previousRoot, nextRoot];
          await _clipboardRememberKnownUploadRoots(rootsToRemember);
        }
      };
      module.exports = {
        FoundryPasteEaterDestinationConfig
      };
    }
  });

  // src/support/readiness.js
  var require_readiness = __commonJS({
    "src/support/readiness.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_SOURCE_S3
      } = require_constants();
      var {
        _clipboardGetConfiguredMinimumRole,
        _clipboardGetRoleChoices,
        _clipboardGetRoleValue
      } = require_policy();
      var {
        _clipboardGetCorePermissionRoles,
        _clipboardGetConfiguredS3Endpoint,
        _clipboardGetConfiguredUploadRoot,
        _clipboardGetUploadPathOrganizationSetting
      } = require_storage();
      var { _clipboardGetSettingsThatDifferFromDefaults } = require_recommended_defaults();
      var { _clipboardNormalizeUploadRoot } = require_known_roots();
      function _clipboardCreateReadinessItem(id, label, status, summary, remediation, details = null) {
        return { id, label, status, summary, remediation, details };
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
          clipboardReadAvailable: Boolean(globalThis.navigator?.clipboard?.read)
        };
      }
      function _clipboardRoleHasPermission(roleKey, permission) {
        const minimumRoleValue = _clipboardGetRoleValue(roleKey);
        return _clipboardGetCorePermissionRoles(permission).some((roleValue) => Number(roleValue) === minimumRoleValue);
      }
      function _clipboardGetRoleLabel(roleKey) {
        return _clipboardGetRoleChoices()[roleKey] || roleKey;
      }
      function _clipboardEvaluateClientCapabilitySection() {
        const browserContext = _clipboardGetBrowserContextSummary();
        const section = {
          id: "client-capability",
          title: "Client capability",
          items: []
        };
        section.items.push(
          _clipboardCreateReadinessItem(
            "clipboard-read",
            "Direct clipboard reads",
            browserContext.clipboardReadAvailable ? "pass" : "warn",
            browserContext.clipboardReadAvailable ? "This browser exposes navigator.clipboard.read for richer scene-paste flows." : "This browser does not expose navigator.clipboard.read here. Native paste events and upload fallbacks still work where enabled.",
            "Use a Chromium-based browser on a secure/trusted origin if you want the scene Paste Media tool to try direct clipboard reads first.",
            browserContext
          )
        );
        section.items.push(
          _clipboardCreateReadinessItem(
            "browser-context",
            "Current browser context",
            browserContext.isSecureContext ? "pass" : "warn",
            browserContext.isSecureContext ? "The current browser context is secure enough for modern clipboard APIs where the browser permits them." : "The current browser context is not marked secure, which can block direct clipboard APIs.",
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
        const section = {
          id: "storage-readiness",
          title: "Storage readiness",
          items: []
        };
        section.items.push(
          _clipboardCreateReadinessItem(
            "destination",
            "Configured upload destination",
            isS3 && !uploadRoot.bucket ? "fail" : "pass",
            isS3 ? `Uploads target ${uploadRoot.label}.` : `Uploads target ${uploadRoot.label}.`,
            isS3 && !uploadRoot.bucket ? "Open Upload destination and choose the S3-compatible bucket that Foundry should use for pasted media." : "Keep the configured base folder stable if you want uploads and audit reports to stay grouped under the same root.",
            uploadRoot
          )
        );
        section.items.push(
          _clipboardCreateReadinessItem(
            "endpoint-visibility",
            "S3 endpoint visibility",
            isS3 ? endpoint ? "pass" : "warn" : "pass",
            isS3 ? endpoint ? `Foundry is exposing an S3 endpoint/base URL for this world: ${endpoint}.` : "Foundry is not exposing an S3 endpoint/base URL to the client right now." : "Endpoint visibility only applies when the current source is S3-compatible storage.",
            isS3 ? "If the endpoint is blank unexpectedly, verify Foundry's server-side S3 configuration and the active AWS/session credentials." : "No action is needed unless you switch this module to an S3-compatible destination.",
            { endpointVisible: Boolean(endpoint), endpoint }
          )
        );
        section.items.push(
          _clipboardCreateReadinessItem(
            "upload-organization",
            "Upload path organization",
            organizationMode === "context-user-month" ? "pass" : "warn",
            organizationMode === "context-user-month" ? "Uploads are organized by context, user, and month under the configured base folder." : "Uploads use a flat folder layout under the configured base destination.",
            "Use Context / user / month if you want clearer S3 lifecycle policies and easier audit grouping without changing what the module uploads.",
            { organizationMode }
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
        const section = {
          id: "player-upload-readiness",
          title: "Player upload readiness",
          items: []
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
              uploadRoles: _clipboardGetCorePermissionRoles("FILES_UPLOAD")
            }
          )
        );
        section.items.push(
          _clipboardCreateReadinessItem(
            "chat-role-gate",
            "Chat media role gate",
            chatEnabled ? chatRoleHasUploadPermissions ? "pass" : "fail" : "warn",
            chatEnabled ? `Chat media requires ${_clipboardGetRoleLabel(chatRole)} and above. That role ${chatRoleHasUploadPermissions ? "has" : "does not have"} Use File Browser plus Upload Files in Foundry core permissions.` : "Chat media handling is disabled in this world, so players will keep normal chat text behavior only.",
            chatEnabled ? `Open Game Settings -> Configure Permissions and enable Use File Browser plus Upload Files for ${_clipboardGetRoleLabel(chatRole)} if players at that role should post pasted media to chat.` : "Enable chat media handling if you want players to paste or upload media into chat.",
            {
              role: chatRole,
              chatEnabled
            }
          )
        );
        const sceneControlsEnabledForPlayers = allowNonGmSceneControls && (scenePasteEnabled || sceneUploadEnabled);
        section.items.push(
          _clipboardCreateReadinessItem(
            "scene-controls",
            "Scene control visibility",
            sceneControlsEnabledForPlayers ? canvasRoleHasUploadPermissions ? "pass" : "fail" : "warn",
            sceneControlsEnabledForPlayers ? `Explicit scene tools are visible to non-GM users who meet the ${_clipboardGetRoleLabel(canvasRole)} canvas-media role gate.` : "Non-GM scene controls are hidden or disabled, so players must rely on native paste handling rather than explicit scene tools.",
            sceneControlsEnabledForPlayers ? `If the tools should work for players, make sure ${_clipboardGetRoleLabel(canvasRole)} still has Use File Browser and Upload Files in Game Settings -> Configure Permissions.` : "Enable Allow non-GMs to use scene controls and the scene Paste/Upload tools if players should have explicit fallback buttons on the canvas.",
            {
              allowNonGmSceneControls,
              scenePasteEnabled,
              sceneUploadEnabled,
              role: canvasRole
            }
          )
        );
        return section;
      }
      function _clipboardEvaluateDefaultProfileSection() {
        const differences = _clipboardGetSettingsThatDifferFromDefaults();
        const section = {
          id: "default-profile-drift",
          title: "Default-profile drift",
          items: [
            _clipboardCreateReadinessItem(
              "recommended-defaults",
              "Recommended defaults drift",
              differences.length ? "warn" : "pass",
              differences.length ? `This world differs from the shipped recommended behavior defaults in ${differences.length} configurable world setting${differences.length === 1 ? "" : "s"}.` : "This world matches the shipped recommended configurable behavior defaults.",
              differences.length ? "Use Apply recommended defaults if you want this world to match the currently documented first-run behavior profile." : "No action is needed unless you intentionally want a different world behavior profile.",
              {
                differences: differences.map((difference) => ({
                  key: difference.key,
                  displayName: difference.displayName,
                  currentValue: difference.currentValue,
                  defaultValue: difference.defaultValue
                }))
              }
            )
          ]
        };
        return section;
      }
      function _clipboardGetReadinessReport() {
        const sections = [
          _clipboardEvaluateClientCapabilitySection(),
          _clipboardEvaluateStorageReadinessSection(),
          _clipboardEvaluatePlayerUploadSection(),
          _clipboardEvaluateDefaultProfileSection()
        ];
        const statusCounts = { pass: 0, warn: 0, fail: 0 };
        for (const section of sections) {
          for (const item of section.items) {
            statusCounts[item.status] += 1;
          }
        }
        return {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          statusCounts,
          sections
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
        _clipboardGetReadinessReport
      };
    }
  });

  // src/support/bundle.js
  var require_bundle = __commonJS({
    "src/support/bundle.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_TITLE
      } = require_constants();
      var {
        CLIPBOARD_IMAGE_SETTINGS_SCHEMA,
        _clipboardGetSetting,
        _clipboardGetShippedDefaultValue
      } = require_schema();
      var { _clipboardGetLogHistory } = require_diagnostics();
      var { _clipboardGetKnownUploadRoots } = require_known_roots();
      var {
        _clipboardGetBrowserContextSummary,
        _clipboardGetModuleVersion,
        _clipboardGetReadinessReport
      } = require_readiness();
      var { _clipboardGetConfiguredUploadRoot } = require_storage();
      var { _clipboardNormalizeUploadRoot } = require_known_roots();
      var CLIPBOARD_IMAGE_SUPPORT_REDACTED_KEYS = /* @__PURE__ */ new Set([
        "authorization",
        "cookie",
        "cookies",
        "password",
        "sessiontoken",
        "secretaccesskey",
        "storagestate",
        "token"
      ]);
      function _clipboardStripUrlSecrets(value) {
        if (typeof value !== "string") return value;
        if (!/^https?:\/\//i.test(value)) return value;
        try {
          const parsedUrl = new URL(value);
          parsedUrl.username = "";
          parsedUrl.password = "";
          parsedUrl.search = "";
          parsedUrl.hash = "";
          return parsedUrl.toString();
        } catch (_error) {
          return value;
        }
      }
      function _clipboardRedactSupportSecrets(value, seen = /* @__PURE__ */ new WeakSet()) {
        if (value === null || value === void 0) return value;
        if (typeof value === "string") {
          if (/^https?:\/\//i.test(value)) return _clipboardStripUrlSecrets(value);
          return value.replace(/https?:\/\/[^\s"'\\]+/gi, (match) => _clipboardStripUrlSecrets(match));
        }
        if (typeof value === "number" || typeof value === "boolean") return value;
        if (typeof value === "bigint") return value.toString();
        if (Array.isArray(value)) return value.map((entry) => _clipboardRedactSupportSecrets(entry, seen));
        if (typeof value !== "object") return String(value);
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
        const output = {};
        for (const [key, entry] of Object.entries(value)) {
          const normalizedKey = String(key || "").replace(/[^a-z]/gi, "").toLowerCase();
          if (CLIPBOARD_IMAGE_SUPPORT_REDACTED_KEYS.has(normalizedKey)) {
            output[key] = "[Redacted]";
            continue;
          }
          output[key] = _clipboardRedactSupportSecrets(entry, seen);
        }
        seen.delete(value);
        return output;
      }
      function _clipboardGetSupportSettingsSnapshot() {
        return CLIPBOARD_IMAGE_SETTINGS_SCHEMA.map((setting) => {
          const value = _clipboardGetSetting(setting.key);
          const defaultValue = _clipboardGetShippedDefaultValue(setting.key);
          return {
            key: setting.key,
            name: setting.name,
            scope: setting.scope,
            config: setting.config,
            value: _clipboardRedactSupportSecrets(value),
            defaultValue: _clipboardRedactSupportSecrets(defaultValue),
            differsFromDefault: value !== defaultValue
          };
        });
      }
      function _clipboardCollectSupportBundle() {
        const browser = _clipboardGetBrowserContextSummary();
        return {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          module: {
            id: CLIPBOARD_IMAGE_MODULE_ID,
            title: CLIPBOARD_IMAGE_TITLE,
            version: _clipboardGetModuleVersion()
          },
          foundry: {
            version: game?.release?.version || game?.version || null
          },
          world: {
            id: game?.world?.id || null,
            title: game?.world?.title || null
          },
          browser: {
            href: _clipboardStripUrlSecrets(browser.href || ""),
            userAgent: browser.userAgent,
            isSecureContext: browser.isSecureContext,
            clipboardReadAvailable: browser.clipboardReadAvailable
          },
          readiness: _clipboardRedactSupportSecrets(_clipboardGetReadinessReport()),
          storage: {
            currentDestination: _clipboardRedactSupportSecrets(_clipboardNormalizeUploadRoot(_clipboardGetConfiguredUploadRoot())),
            knownUploadRoots: _clipboardRedactSupportSecrets(_clipboardGetKnownUploadRoots({ includeCurrent: true }))
          },
          settings: _clipboardGetSupportSettingsSnapshot(),
          logs: _clipboardRedactSupportSecrets(_clipboardGetLogHistory())
        };
      }
      function _clipboardCreateSupportBundleFile(bundle = _clipboardCollectSupportBundle()) {
        const safeTimestamp = bundle.generatedAt.replaceAll(":", "-");
        const filename = `foundry-paste-eater-support-${safeTimestamp}.json`;
        const content = JSON.stringify(bundle, null, 2);
        const url = globalThis.URL?.createObjectURL?.(new Blob([content], { type: "application/json" })) || "";
        return { filename, content, url };
      }
      function _clipboardDownloadSupportBundle(bundle = _clipboardCollectSupportBundle()) {
        const file = _clipboardCreateSupportBundleFile(bundle);
        if (!file.content) return file;
        if (typeof globalThis.saveDataToFile === "function") {
          globalThis.saveDataToFile(file.content, "application/json", file.filename);
          return file;
        }
        if (file.url && globalThis.document?.body) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          link.rel = "noopener";
          document.body.append(link);
          link.click();
          link.remove();
        }
        return file;
      }
      module.exports = {
        _clipboardStripUrlSecrets,
        _clipboardRedactSupportSecrets,
        _clipboardGetSupportSettingsSnapshot,
        _clipboardCollectSupportBundle,
        _clipboardCreateSupportBundleFile,
        _clipboardDownloadSupportBundle
      };
    }
  });

  // src/support/media-audit.js
  var require_media_audit = __commonJS({
    "src/support/media-audit.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
      } = require_constants();
      var { _clipboardGetKnownUploadRoots } = require_known_roots();
      function _clipboardNormalizeAuditPath(path) {
        const rawPath = String(path || "").trim();
        if (!rawPath) return "";
        try {
          const parsedUrl = new URL(rawPath, globalThis.location?.origin || "http://localhost");
          return parsedUrl.pathname.replace(/^\/+/, "");
        } catch (_error) {
          return rawPath.replaceAll("\\", "/").replace(/^\/+/, "").replace(/[?#].*$/, "");
        }
      }
      function _clipboardMatchUploadRoot(path, uploadRoots) {
        const normalizedPath = _clipboardNormalizeAuditPath(path);
        if (!normalizedPath) return null;
        return uploadRoots.find((root) => normalizedPath === root.target || normalizedPath.startsWith(`${root.target}/`)) || null;
      }
      function _clipboardInferAuditContext(path, uploadRoot, fallbackContext) {
        const normalizedPath = _clipboardNormalizeAuditPath(path);
        if (!normalizedPath || !uploadRoot) return fallbackContext;
        const relativePath = normalizedPath.slice(uploadRoot.target.length).replace(/^\/+/, "");
        const leadingSegment = relativePath.split("/")[0];
        if (leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS || leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT || leadingSegment === CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART) {
          return leadingSegment;
        }
        return fallbackContext;
      }
      function _clipboardCollectChatMessagePaths(message) {
        const content = String(message?.content || "");
        if (!content.includes("foundry-paste-eater-chat-message")) return [];
        const container = document.createElement("div");
        container.innerHTML = content;
        const elements = Array.from(container.querySelectorAll("img[src], video[src], a[href]"));
        const paths = /* @__PURE__ */ new Set();
        for (const element of elements) {
          const value = element.getAttribute("src") || element.getAttribute("href") || "";
          if (!value) continue;
          paths.add(value);
        }
        return Array.from(paths);
      }
      function _clipboardCreateAuditReference({
        path,
        documentType,
        documentId,
        documentName,
        field,
        uploadRoot,
        fallbackContext,
        sceneId = null,
        sceneName = null,
        messageId = null
      }) {
        if (!uploadRoot) return null;
        const normalizedPath = _clipboardNormalizeAuditPath(path);
        if (!normalizedPath) return null;
        return {
          context: _clipboardInferAuditContext(path, uploadRoot, fallbackContext),
          documentType,
          documentId,
          documentName,
          field,
          path,
          normalizedPath,
          uploadRootKey: uploadRoot.key,
          uploadRootLabel: uploadRoot.label,
          sceneId,
          sceneName,
          messageId
        };
      }
      function _clipboardCollectDocumentMediaReferences(document2, uploadRoots, options) {
        const path = document2?.texture?.src || document2?.img || "";
        const uploadRoot = _clipboardMatchUploadRoot(path, uploadRoots);
        const reference = _clipboardCreateAuditReference({
          path,
          uploadRoot,
          ...options
        });
        return reference ? [reference] : [];
      }
      function _clipboardCollectMediaAuditReport() {
        const uploadRoots = _clipboardGetKnownUploadRoots({ includeCurrent: true });
        const references = [];
        for (const actor of game?.actors?.contents || []) {
          references.push(..._clipboardCollectDocumentMediaReferences(actor, uploadRoots, {
            documentType: "Actor",
            documentId: actor.id,
            documentName: actor.name || actor.id,
            field: "img",
            fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
          }));
          const prototypePath = actor?.prototypeToken?.texture?.src || "";
          const prototypeRoot = _clipboardMatchUploadRoot(prototypePath, uploadRoots);
          const prototypeReference = _clipboardCreateAuditReference({
            path: prototypePath,
            documentType: "Actor",
            documentId: actor.id,
            documentName: actor.name || actor.id,
            field: "prototypeToken.texture.src",
            uploadRoot: prototypeRoot,
            fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
          });
          if (prototypeReference) references.push(prototypeReference);
        }
        for (const scene of game?.scenes?.contents || []) {
          for (const token of scene?.tokens?.contents || []) {
            references.push(..._clipboardCollectDocumentMediaReferences(token, uploadRoots, {
              documentType: "Token",
              documentId: token.id,
              documentName: token.name || token.id,
              field: "texture.src",
              fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
              sceneId: scene.id || null,
              sceneName: scene.name || null
            }));
          }
          for (const tile of scene?.tiles?.contents || []) {
            references.push(..._clipboardCollectDocumentMediaReferences(tile, uploadRoots, {
              documentType: "Tile",
              documentId: tile.id,
              documentName: tile.name || tile.id,
              field: "texture.src",
              fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
              sceneId: scene.id || null,
              sceneName: scene.name || null
            }));
          }
          for (const note of scene?.notes?.contents || []) {
            references.push(..._clipboardCollectDocumentMediaReferences(note, uploadRoots, {
              documentType: "Note",
              documentId: note.id,
              documentName: note.text || note.name || note.id,
              field: "texture.src",
              fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
              sceneId: scene.id || null,
              sceneName: scene.name || null
            }));
          }
        }
        for (const message of game?.messages?.contents || []) {
          for (const path of _clipboardCollectChatMessagePaths(message)) {
            const uploadRoot = _clipboardMatchUploadRoot(path, uploadRoots);
            const reference = _clipboardCreateAuditReference({
              path,
              documentType: "ChatMessage",
              documentId: message.id,
              documentName: message.speaker?.alias || message.id,
              field: "content",
              uploadRoot,
              fallbackContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
              messageId: message.id
            });
            if (reference) references.push(reference);
          }
        }
        const groupsMap = /* @__PURE__ */ new Map();
        for (const reference of references) {
          const groupKey = [reference.uploadRootKey, reference.context, reference.documentType].join("|");
          const existingGroup = groupsMap.get(groupKey) || {
            key: groupKey,
            context: reference.context,
            documentType: reference.documentType,
            uploadRootKey: reference.uploadRootKey,
            uploadRootLabel: reference.uploadRootLabel,
            references: []
          };
          existingGroup.references.push(reference);
          groupsMap.set(groupKey, existingGroup);
        }
        const groups = Array.from(groupsMap.values()).map((group) => ({
          ...group,
          references: group.references.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath))
        })).sort((left, right) => left.uploadRootLabel.localeCompare(right.uploadRootLabel) || left.context.localeCompare(right.context) || left.documentType.localeCompare(right.documentType));
        return {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          uploadRoots,
          references: references.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath)),
          groups,
          summary: {
            referenceCount: references.length,
            groupCount: groups.length,
            rootCount: uploadRoots.length
          }
        };
      }
      function _clipboardCreateMediaAuditFile(report = _clipboardCollectMediaAuditReport()) {
        const safeTimestamp = report.generatedAt.replaceAll(":", "-");
        const filename = `foundry-paste-eater-media-audit-${safeTimestamp}.json`;
        const content = JSON.stringify(report, null, 2);
        const url = globalThis.URL?.createObjectURL?.(new Blob([content], { type: "application/json" })) || "";
        return { filename, content, url };
      }
      function _clipboardDownloadMediaAuditReport(report = _clipboardCollectMediaAuditReport()) {
        const file = _clipboardCreateMediaAuditFile(report);
        if (!file.content) return file;
        if (typeof globalThis.saveDataToFile === "function") {
          globalThis.saveDataToFile(file.content, "application/json", file.filename);
          return file;
        }
        if (file.url && globalThis.document?.body) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          link.rel = "noopener";
          document.body.append(link);
          link.click();
          link.remove();
        }
        return file;
      }
      module.exports = {
        _clipboardNormalizeAuditPath,
        _clipboardMatchUploadRoot,
        _clipboardInferAuditContext,
        _clipboardCollectChatMessagePaths,
        _clipboardCreateAuditReference,
        _clipboardCollectDocumentMediaReferences,
        _clipboardCollectMediaAuditReport,
        _clipboardCreateMediaAuditFile,
        _clipboardDownloadMediaAuditReport
      };
    }
  });

  // src/support/api.js
  var require_api = __commonJS({
    "src/support/api.js"(exports, module) {
      var { CLIPBOARD_IMAGE_MODULE_ID } = require_constants();
      var { _clipboardGetReadinessReport } = require_readiness();
      var { _clipboardCollectSupportBundle } = require_bundle();
      var { _clipboardCollectMediaAuditReport } = require_media_audit();
      function _clipboardCreateRuntimeApi() {
        return Object.freeze({
          getReadinessReport: () => _clipboardGetReadinessReport(),
          collectSupportBundle: () => _clipboardCollectSupportBundle(),
          collectMediaAuditReport: () => _clipboardCollectMediaAuditReport()
        });
      }
      function _clipboardRegisterRuntimeApi() {
        const moduleRecord = game?.modules?.get?.(CLIPBOARD_IMAGE_MODULE_ID);
        if (!moduleRecord) return null;
        const api = _clipboardCreateRuntimeApi();
        moduleRecord.api = api;
        return api;
      }
      module.exports = {
        _clipboardCreateRuntimeApi,
        _clipboardRegisterRuntimeApi
      };
    }
  });

  // src/support/apps.js
  var require_apps = __commonJS({
    "src/support/apps.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_FORM_APPLICATION,
        CLIPBOARD_IMAGE_TITLE
      } = require_constants();
      var { FoundryPasteEaterDestinationConfig } = require_config_app();
      var { FoundryPasteEaterRecommendedDefaultsConfig } = require_recommended_defaults();
      var { _clipboardCollectSupportBundle, _clipboardDownloadSupportBundle } = require_bundle();
      var { _clipboardCollectMediaAuditReport, _clipboardDownloadMediaAuditReport } = require_media_audit();
      var { _clipboardGetReadinessReport } = require_readiness();
      var FoundryPasteEaterReadinessSupportConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-paste-eater-readiness-support",
            title: `${CLIPBOARD_IMAGE_TITLE}: Readiness & Support`,
            template: "modules/foundry-paste-eater/templates/readiness-support.hbs",
            width: 720,
            height: "auto",
            closeOnSubmit: false,
            submitOnChange: false
          });
        }
        getData() {
          const report = _clipboardGetReadinessReport();
          return {
            report,
            statusCounts: report.statusCounts,
            sections: report.sections
          };
        }
        activateListeners(html) {
          super.activateListeners(html);
          html.find('[data-action="open-upload-destination"]').on("click", (event) => this._onOpenUploadDestination(event));
          html.find('[data-action="open-recommended-defaults"]').on("click", (event) => this._onOpenRecommendedDefaults(event));
          html.find('[data-action="download-support-bundle"]').on("click", (event) => this._onDownloadSupportBundle(event));
        }
        async _onOpenUploadDestination(event) {
          event.preventDefault();
          const app = new FoundryPasteEaterDestinationConfig();
          await app.render(true);
        }
        async _onOpenRecommendedDefaults(event) {
          event.preventDefault();
          const app = new FoundryPasteEaterRecommendedDefaultsConfig();
          await app.render(true);
        }
        _onDownloadSupportBundle(event) {
          event.preventDefault();
          const bundle = _clipboardCollectSupportBundle();
          _clipboardDownloadSupportBundle(bundle);
          ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Downloaded a support bundle.`);
        }
      };
      var FoundryPasteEaterUploadedMediaAuditConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-paste-eater-uploaded-media-audit",
            title: `${CLIPBOARD_IMAGE_TITLE}: Uploaded Media Audit`,
            template: "modules/foundry-paste-eater/templates/uploaded-media-audit.hbs",
            width: 760,
            height: "auto",
            closeOnSubmit: false,
            submitOnChange: false
          });
        }
        getData() {
          const report = _clipboardCollectMediaAuditReport();
          return {
            report,
            groups: report.groups,
            summary: report.summary,
            uploadRoots: report.uploadRoots
          };
        }
        activateListeners(html) {
          super.activateListeners(html);
          html.find('[data-action="download-media-audit"]').on("click", (event) => this._onDownloadMediaAudit(event));
        }
        _onDownloadMediaAudit(event) {
          event.preventDefault();
          const report = _clipboardCollectMediaAuditReport();
          _clipboardDownloadMediaAuditReport(report);
          ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Downloaded the uploaded media audit report.`);
        }
      };
      module.exports = {
        FoundryPasteEaterReadinessSupportConfig,
        FoundryPasteEaterUploadedMediaAuditConfig
      };
    }
  });

  // src/support.js
  var require_support = __commonJS({
    "src/support.js"(exports, module) {
      module.exports = {
        ...require_known_roots(),
        ...require_readiness(),
        ...require_bundle(),
        ...require_media_audit(),
        ...require_api(),
        ...require_apps()
      };
    }
  });

  // src/settings/register.js
  var require_register = __commonJS({
    "src/settings/register.js"(exports, module) {
      var { CLIPBOARD_IMAGE_MODULE_ID } = require_constants();
      var { FoundryPasteEaterDestinationConfig } = require_config_app();
      var { FoundryPasteEaterRecommendedDefaultsConfig } = require_recommended_defaults();
      var {
        FoundryPasteEaterReadinessSupportConfig,
        FoundryPasteEaterUploadedMediaAuditConfig
      } = require_support();
      var {
        CLIPBOARD_IMAGE_SETTINGS_SCHEMA,
        _clipboardGetShippedDefaultValue
      } = require_schema();
      var { _clipboardRefreshUiForSettingsChange } = require_policy();
      function _clipboardRegisterSettings() {
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
          name: "Upload destination",
          label: "Configure",
          hint: "Choose the file store and folder used for pasted media. Supports User Data, The Forge, and Foundry-configured S3-compatible storage through Foundry's native file picker.",
          icon: "fa-solid fa-folder-tree",
          type: FoundryPasteEaterDestinationConfig,
          restricted: true
        });
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "recommended-defaults", {
          name: "Apply recommended defaults",
          label: "Review",
          hint: "Review and apply the current recommended world behavior defaults without changing upload destination or client-only diagnostics.",
          icon: "fa-solid fa-wand-magic-sparkles",
          type: FoundryPasteEaterRecommendedDefaultsConfig,
          restricted: true
        });
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "readiness-support", {
          name: "Readiness & Support",
          label: "Open",
          hint: "Review clipboard/browser capability, storage readiness, player upload prerequisites, and a downloadable support bundle without changing world data.",
          icon: "fa-solid fa-shield-heart",
          type: FoundryPasteEaterReadinessSupportConfig,
          restricted: true
        });
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "uploaded-media-audit", {
          name: "Uploaded Media Audit",
          label: "Open",
          hint: "Review current world references to media under the module's configured upload roots and export the audit as JSON.",
          icon: "fa-solid fa-photo-film",
          type: FoundryPasteEaterUploadedMediaAuditConfig,
          restricted: true
        });
        for (const setting of CLIPBOARD_IMAGE_SETTINGS_SCHEMA) {
          const choices = typeof setting.choices === "function" ? setting.choices() : setting.choices;
          const refreshTargets = Array.isArray(setting.refreshTargets) ? setting.refreshTargets : [];
          const onChange = refreshTargets.length ? () => _clipboardRefreshUiForSettingsChange({
            sceneControls: refreshTargets.includes("sceneControls"),
            chat: refreshTargets.includes("chat")
          }) : void 0;
          game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, setting.key, {
            name: setting.name,
            hint: setting.hint,
            scope: setting.scope,
            config: setting.config,
            type: setting.type,
            default: _clipboardGetShippedDefaultValue(setting.key),
            ...choices ? { choices } : {},
            ...onChange ? { onChange } : {}
          });
        }
      }
      module.exports = {
        _clipboardRegisterSettings
      };
    }
  });

  // src/settings.js
  var require_settings = __commonJS({
    "src/settings.js"(exports, module) {
      module.exports = {
        ...require_schema(),
        ...require_recommended_defaults(),
        ...require_policy(),
        ...require_migrations(),
        ...require_register()
      };
    }
  });

  // src/canvas/eligibility.js
  var require_eligibility = __commonJS({
    "src/canvas/eligibility.js"(exports, module) {
      var {
        _clipboardCanUseCanvasMedia,
        _clipboardCanCreateTokens,
        _clipboardCanCreateTiles,
        _clipboardCanReplaceTokens,
        _clipboardCanReplaceTiles
      } = require_settings();
      function _clipboardCanUserModifyDocument(document2, action = "update") {
        if (!document2) return false;
        if (game.user?.isGM) return true;
        if (typeof document2.canUserModify === "function") {
          return Boolean(document2.canUserModify(game.user, action));
        }
        if (typeof document2.testUserPermission === "function") {
          return Boolean(document2.testUserPermission(game.user, "OWNER"));
        }
        if (typeof document2.isOwner === "boolean") {
          return document2.isOwner;
        }
        return false;
      }
      function _clipboardCanReplaceDocument(documentName, document2) {
        if (documentName === "Token") {
          if (!_clipboardCanReplaceTokens()) return false;
          if (game.user?.isGM) return true;
          return _clipboardCanUserModifyDocument(document2, "update") || _clipboardCanUserModifyDocument(document2?.actor, "update");
        }
        if (documentName === "Tile") {
          return _clipboardCanReplaceTiles() && _clipboardCanUserModifyDocument(document2, "update");
        }
        if (documentName === "Note") {
          return _clipboardCanUseCanvasMedia() && _clipboardCanUserModifyDocument(document2, "update");
        }
        return false;
      }
      function _clipboardGetTokenActorArtEligibility(replacementTarget, { mediaKind = "image" } = {}) {
        if (!replacementTarget?.documents?.length || replacementTarget.documentName !== "Token") {
          return {
            eligible: false,
            reason: "Actor portrait + linked token art only applies when selected tokens are being replaced.",
            actors: [],
            documents: []
          };
        }
        if (mediaKind !== "image") {
          return {
            eligible: false,
            reason: "Actor portrait + linked token art only supports pasted images. Video pastes stay scene-only.",
            actors: [],
            documents: replacementTarget.documents
          };
        }
        if ((replacementTarget.requestedCount ?? replacementTarget.documents.length) > replacementTarget.documents.length) {
          return {
            eligible: false,
            reason: "Actor portrait + linked token art requires every selected token to be editable before anything is changed.",
            actors: [],
            documents: replacementTarget.documents
          };
        }
        const actors = [];
        const seenActorIds = /* @__PURE__ */ new Set();
        for (const document2 of replacementTarget.documents) {
          const actor = document2?.actor || null;
          const actorId = actor?.id || document2?.actorId || null;
          if (!document2?.actorLink || !actor || !_clipboardCanUserModifyDocument(actor, "update")) {
            return {
              eligible: false,
              reason: "Actor portrait + linked token art requires every selected token to be linked to a base Actor you can update.",
              actors: [],
              documents: replacementTarget.documents
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
          documents: replacementTarget.documents
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
        _clipboardCanCreateDocument
      };
    }
  });

  // src/canvas/selection.js
  var require_selection = __commonJS({
    "src/canvas/selection.js"(exports, module) {
      var { _clipboardLog } = require_diagnostics();
      var { _clipboardCanReplaceDocument } = require_eligibility();
      function _clipboardHasCopiedObjects() {
        const layer = canvas?.activeLayer;
        return Boolean(layer?.clipboard?.objects?.length);
      }
      function _clipboardGetControlledPlaceables(layer) {
        const controlledObjects = layer?.controlledObjects;
        if (controlledObjects?.size && typeof controlledObjects.values === "function") {
          return Array.from(controlledObjects.values()).filter(Boolean);
        }
        const controlled = layer?.controlled;
        if (Array.isArray(controlled)) return controlled.filter(Boolean);
        if (controlled instanceof Map) return Array.from(controlled.values()).filter(Boolean);
        if (controlled instanceof Set) return Array.from(controlled.values()).filter(Boolean);
        if (controlled && typeof controlled.values === "function") {
          return Array.from(controlled.values()).filter(Boolean);
        }
        if (controlled && typeof controlled[Symbol.iterator] === "function") {
          return Array.from(controlled).filter(Boolean);
        }
        return [];
      }
      var CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
        Token: ["Token", "Tile", "Note"],
        Tile: ["Tile", "Token", "Note"],
        Note: ["Note", "Token", "Tile"]
      };
      function _clipboardGetReplacementOrder(activeDocumentName = "Tile") {
        return CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName] || CLIPBOARD_IMAGE_REPLACEMENT_ORDER.Tile;
      }
      function _clipboardGetActiveDocumentName() {
        if (canvas?.activeLayer === canvas?.tokens) return "Token";
        if (canvas?.activeLayer === canvas?.notes) return "Note";
        return "Tile";
      }
      function _clipboardResolveReplacementTargetFromCandidates(activeDocumentName = _clipboardGetActiveDocumentName(), replacementCandidates = {}) {
        for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
          const candidate = replacementCandidates?.[documentName] || null;
          const requestedCount = candidate?.requestedCount ?? candidate?.documents?.length ?? 0;
          if (!requestedCount) continue;
          const documents = Array.isArray(candidate?.documents) ? candidate.documents.filter(Boolean) : [];
          return {
            documentName,
            documents,
            requestedCount,
            blocked: documents.length < 1
          };
        }
        return null;
      }
      function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
        const layerLookup = {
          Token: canvas?.tokens,
          Tile: canvas?.tiles,
          Note: canvas?.notes
        };
        const replacementCandidates = {};
        for (const documentName of _clipboardGetReplacementOrder(activeDocumentName)) {
          const layer = layerLookup[documentName];
          const controlledPlaceables = _clipboardGetControlledPlaceables(layer);
          const documents = controlledPlaceables.map((placeable) => placeable.document).filter(Boolean);
          _clipboardLog("debug", "Evaluating controlled placeables for replacement", {
            activeDocumentName,
            candidateDocumentName: documentName,
            layerName: layer?.options?.name || layer?.name || null,
            controlledType: layer?.controlled?.constructor?.name || typeof layer?.controlled,
            controlledCount: controlledPlaceables.length,
            controlledIds: controlledPlaceables.map((placeable) => placeable.document?.id || placeable.id || null),
            controlledObjectsSize: layer?.controlledObjects?.size ?? null
          });
          if (!documents.length) continue;
          const eligibleDocuments = documents.filter((document2) => _clipboardCanReplaceDocument(documentName, document2));
          _clipboardLog("debug", "Resolved eligible replacement documents", {
            activeDocumentName,
            candidateDocumentName: documentName,
            requestedCount: documents.length,
            eligibleIds: eligibleDocuments.map((document2) => document2.id),
            blocked: eligibleDocuments.length < 1
          });
          replacementCandidates[documentName] = {
            documents: eligibleDocuments,
            requestedCount: documents.length
          };
        }
        return _clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates);
      }
      module.exports = {
        _clipboardHasCopiedObjects,
        _clipboardGetControlledPlaceables,
        _clipboardGetReplacementOrder,
        _clipboardGetActiveDocumentName,
        _clipboardResolveReplacementTargetFromCandidates,
        _clipboardGetReplacementTarget
      };
    }
  });

  // src/state.js
  var require_state = __commonJS({
    "src/state.js"(exports, module) {
      var CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS = /* @__PURE__ */ new WeakSet();
      var CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS = /* @__PURE__ */ new WeakSet();
      var CLIPBOARD_IMAGE_LOCKED = false;
      var CLIPBOARD_HIDDEN_MODE = false;
      function _clipboardGetRuntimeState() {
        return {
          locked: CLIPBOARD_IMAGE_LOCKED,
          hiddenMode: CLIPBOARD_HIDDEN_MODE
        };
      }
      function _clipboardSetRuntimeState({ locked, hiddenMode } = {}) {
        if (typeof locked === "boolean") CLIPBOARD_IMAGE_LOCKED = locked;
        if (typeof hiddenMode === "boolean") CLIPBOARD_HIDDEN_MODE = hiddenMode;
      }
      function _clipboardGetLocked() {
        return CLIPBOARD_IMAGE_LOCKED;
      }
      function _clipboardSetLocked(locked) {
        if (typeof locked === "boolean") CLIPBOARD_IMAGE_LOCKED = locked;
      }
      function _clipboardGetHiddenMode() {
        return CLIPBOARD_HIDDEN_MODE;
      }
      function _clipboardSetHiddenMode(hiddenMode) {
        if (typeof hiddenMode === "boolean") CLIPBOARD_HIDDEN_MODE = hiddenMode;
      }
      module.exports = {
        CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS,
        CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS,
        _clipboardGetRuntimeState,
        _clipboardSetRuntimeState,
        _clipboardGetLocked,
        _clipboardSetLocked,
        _clipboardGetHiddenMode,
        _clipboardSetHiddenMode
      };
    }
  });

  // src/canvas/create-strategies.js
  var require_create_strategies = __commonJS({
    "src/canvas/create-strategies.js"(exports, module) {
      var { _clipboardLog } = require_diagnostics();
      var {
        _clipboardGetTileVideoData,
        _clipboardScaleTileDimensions,
        _clipboardScaleTokenDimensions
      } = require_media();
      var { _clipboardGetHiddenMode } = require_state();
      var {
        _clipboardShouldCreateBackingActors,
        _clipboardGetConfiguredPastedTokenActorType,
        _clipboardShouldLockPastedTokenRotation
      } = require_settings();
      var {
        CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK
      } = require_constants();
      var { _clipboardGetControlledPlaceables } = require_selection();
      var {
        _clipboardGetActorDocumentClass,
        _clipboardPromptPastedTokenActorType,
        _clipboardResolvePastedTokenActorType
      } = require_actor_types();
      function _clipboardGetDefaultActorType() {
        return _clipboardResolvePastedTokenActorType(_clipboardGetConfiguredPastedTokenActorType());
      }
      function _clipboardGetTokenPosition(mousePos) {
        return canvas?.grid?.getTopLeftPoint?.(mousePos) || mousePos;
      }
      function _clipboardGetPastedDocumentName(path) {
        const rawName = String(path || "").split("/").pop() || "";
        let decodedName = rawName;
        try {
          decodedName = decodeURIComponent(rawName);
        } catch (error) {
          decodedName = rawName;
        }
        const withoutQuery = decodedName.split(/[?#]/, 1)[0] || decodedName;
        const trimmedName = withoutQuery.replace(/\.[^.]+$/, "").trim();
        const normalizedName = trimmedName.replace(/-\d{10,}$/, "").trim();
        return normalizedName || trimmedName || "Pasted Media";
      }
      function _clipboardGetPastedTokenActorImage(path, mediaKind) {
        if (mediaKind !== "video") return path;
        return _clipboardGetActorDocumentClass()?.DEFAULT_ICON || CONST?.DEFAULT_TOKEN || "icons/svg/mystery-man.svg";
      }
      async function _clipboardCreatePastedTokenActor({ path, mediaKind, width, height }) {
        return _clipboardCreatePastedTokenActorWithType({
          path,
          mediaKind,
          width,
          height,
          actorType: _clipboardGetDefaultActorType()
        });
      }
      async function _clipboardCreatePastedTokenActorWithType({ path, mediaKind, width, height, actorType = null }) {
        const ActorDocument = _clipboardGetActorDocumentClass();
        if (!ActorDocument?.create) {
          throw new Error("Actor creation is unavailable for pasted tokens.");
        }
        const name = _clipboardGetPastedDocumentName(path);
        const actorImage = _clipboardGetPastedTokenActorImage(path, mediaKind);
        const lockRotation = _clipboardShouldLockPastedTokenRotation();
        const actorData = {
          name,
          img: actorImage,
          prototypeToken: {
            name,
            texture: {
              src: path
            },
            width,
            height,
            lockRotation
          }
        };
        if (actorType) actorData.type = actorType;
        _clipboardLog("debug", "Creating backing actor for pasted token", {
          actorType,
          actorImage,
          mediaKind,
          name,
          path,
          width,
          height
        });
        const actor = await ActorDocument.create(actorData);
        if (!actor?.id) {
          throw new Error("Failed to create a backing Actor for the pasted token.");
        }
        _clipboardLog("info", "Created backing actor for pasted token", {
          actorId: actor.id,
          actorType,
          actorImage,
          mediaKind,
          name,
          path,
          width,
          height
        });
        return actor;
      }
      async function _clipboardResolvePastedTokenCreationChoice() {
        const configuredType = _clipboardGetConfiguredPastedTokenActorType();
        if (configuredType === CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK) {
          return _clipboardPromptPastedTokenActorType();
        }
        return {
          createBackingActor: true,
          actorType: _clipboardResolvePastedTokenActorType(configuredType)
        };
      }
      var CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES = {
        Token: {
          documentName: "Token",
          getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.tokens).map((token) => token.document),
          getLayer: () => canvas?.tokens,
          createData: async ({ path, imgWidth, imgHeight, mousePos, mediaKind }) => {
            const snappedPosition = _clipboardGetTokenPosition(mousePos);
            const dimensions = _clipboardScaleTokenDimensions(imgWidth, imgHeight);
            const createBackingActors = _clipboardShouldCreateBackingActors();
            const lockRotation = _clipboardShouldLockPastedTokenRotation();
            let actor = null;
            if (createBackingActors) {
              const tokenCreationChoice = await _clipboardResolvePastedTokenCreationChoice();
              if (tokenCreationChoice?.createBackingActor) {
                actor = await _clipboardCreatePastedTokenActorWithType({
                  path,
                  mediaKind,
                  width: dimensions.width,
                  height: dimensions.height,
                  actorType: tokenCreationChoice.actorType
                });
              }
            }
            const tokenData = {
              name: actor?.name || _clipboardGetPastedDocumentName(path),
              texture: {
                src: path
              },
              width: dimensions.width,
              height: dimensions.height,
              x: snappedPosition.x,
              y: snappedPosition.y,
              hidden: _clipboardGetHiddenMode(),
              locked: false,
              lockRotation
            };
            if (actor?.id) {
              tokenData.actorId = actor.id;
              tokenData.actorLink = true;
            }
            return [tokenData];
          }
        },
        Tile: {
          documentName: "Tile",
          getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.tiles).map((tile) => tile.document),
          getLayer: () => canvas?.tiles,
          createData: ({ path, imgWidth, imgHeight, mousePos, mediaKind }) => {
            const dimensions = _clipboardScaleTileDimensions(imgWidth, imgHeight, canvas.dimensions);
            const createData = {
              texture: {
                src: path
              },
              width: dimensions.width,
              height: dimensions.height,
              x: mousePos.x,
              y: mousePos.y,
              sort: 0,
              rotation: 0,
              hidden: _clipboardGetHiddenMode(),
              locked: false
            };
            const video = _clipboardGetTileVideoData(mediaKind);
            if (video) createData.video = video;
            return [createData];
          }
        },
        Note: {
          documentName: "Note",
          getControlledDocuments: () => _clipboardGetControlledPlaceables(canvas?.notes).map((note) => note.document),
          getLayer: () => canvas?.notes
        }
      };
      function _clipboardGetPlaceableStrategy(documentName = "Tile") {
        return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
      }
      module.exports = {
        CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES,
        _clipboardGetTokenPosition,
        _clipboardGetPastedDocumentName,
        _clipboardGetActorDocumentClass,
        _clipboardGetDefaultActorType,
        _clipboardGetPastedTokenActorImage,
        _clipboardCreatePastedTokenActor,
        _clipboardCreatePastedTokenActorWithType,
        _clipboardResolvePastedTokenCreationChoice,
        _clipboardGetPlaceableStrategy
      };
    }
  });

  // src/canvas/plan.js
  var require_plan = __commonJS({
    "src/canvas/plan.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN
      } = require_constants();
      var {
        _clipboardCanCreateTokens,
        _clipboardCanCreateTiles,
        _clipboardGetDefaultEmptyCanvasTarget
      } = require_settings();
      var {
        _clipboardGetActiveDocumentName,
        _clipboardResolveReplacementTargetFromCandidates,
        _clipboardGetReplacementTarget
      } = require_selection();
      var { _clipboardGetPlaceableStrategy } = require_create_strategies();
      function _clipboardGetMousePosition() {
        if (!canvas?.mousePosition) return null;
        return {
          x: canvas.mousePosition.x,
          y: canvas.mousePosition.y
        };
      }
      function _clipboardGetCanvasCenter() {
        return {
          x: canvas.dimensions.width / 2,
          y: canvas.dimensions.height / 2
        };
      }
      function _clipboardGetCreateDocumentName(activeDocumentName = _clipboardGetActiveDocumentName(), emptyCanvasTarget = _clipboardGetDefaultEmptyCanvasTarget()) {
        switch (emptyCanvasTarget) {
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN:
            return "Token";
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE:
            return "Tile";
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER:
          default:
            return activeDocumentName === "Note" ? "Tile" : activeDocumentName;
        }
      }
      function _clipboardResolveCanvasMediaPlan({
        activeDocumentName = _clipboardGetActiveDocumentName(),
        emptyCanvasTarget = _clipboardGetDefaultEmptyCanvasTarget(),
        replacementCandidates = null,
        canCreateTokens = _clipboardCanCreateTokens(),
        canCreateTiles = _clipboardCanCreateTiles()
      } = {}) {
        const createDocumentName = _clipboardGetCreateDocumentName(activeDocumentName, emptyCanvasTarget);
        const replacementTarget = replacementCandidates ? _clipboardResolveReplacementTargetFromCandidates(activeDocumentName, replacementCandidates) : _clipboardGetReplacementTarget(activeDocumentName);
        const canCreateDocument = createDocumentName === "Token" ? canCreateTokens : canCreateTiles;
        return {
          activeDocumentName,
          createDocumentName,
          replacementTarget,
          replacementBlocked: Boolean(replacementTarget?.blocked),
          canCreateDocument,
          shouldCreate: !replacementTarget && canCreateDocument
        };
      }
      function _clipboardResolvePasteContext({ fallbackToCenter = false, requireCanvasFocus = true } = {}) {
        const activeDocumentName = _clipboardGetActiveDocumentName();
        const mediaPlan = _clipboardResolveCanvasMediaPlan({ activeDocumentName });
        const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);
        return {
          mousePos,
          activeDocumentName,
          createDocumentName: mediaPlan.createDocumentName,
          createStrategy: mediaPlan.canCreateDocument ? _clipboardGetPlaceableStrategy(mediaPlan.createDocumentName) : null,
          replacementTarget: mediaPlan.replacementTarget,
          requireCanvasFocus
        };
      }
      function _clipboardHasCanvasFocus() {
        const gameElement = document.querySelector(".game");
        return !gameElement || document.activeElement === gameElement;
      }
      function _clipboardIsMouseWithinCanvas(mousePos) {
        return Boolean(
          mousePos && mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x <= canvas.dimensions.width && mousePos.y <= canvas.dimensions.height
        );
      }
      function _clipboardCanPasteToContext(context) {
        if (context.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
        if (context.replacementTarget?.documents?.length) return true;
        if (context.replacementTarget?.blocked) return false;
        if (Object.hasOwn(context, "createStrategy") && !context.createStrategy) return false;
        return _clipboardIsMouseWithinCanvas(context.mousePos);
      }
      function _clipboardPrepareCreateLayer(context) {
        if (!context.replacementTarget) {
          context.createStrategy.getLayer()?.activate?.();
        }
      }
      module.exports = {
        _clipboardGetMousePosition,
        _clipboardGetCanvasCenter,
        _clipboardGetCreateDocumentName,
        _clipboardResolveCanvasMediaPlan,
        _clipboardResolvePasteContext,
        _clipboardHasCanvasFocus,
        _clipboardIsMouseWithinCanvas,
        _clipboardCanPasteToContext,
        _clipboardPrepareCreateLayer
      };
    }
  });

  // src/canvas/actor-art.js
  var require_actor_art = __commonJS({
    "src/canvas/actor-art.js"(exports, module) {
      var { _clipboardDescribeReplacementTarget, _clipboardLog } = require_diagnostics();
      var { _clipboardGetTileVideoData } = require_media();
      var { _clipboardGetTokenActorArtEligibility } = require_eligibility();
      function _clipboardGetAllScenesForLinkedTokenUpdates() {
        if (Array.isArray(game?.scenes?.contents) && game.scenes.contents.length) {
          return game.scenes.contents.filter(Boolean);
        }
        return canvas?.scene ? [canvas.scene] : [];
      }
      async function _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options = {}) {
        const eligibility = options.eligibility || _clipboardGetTokenActorArtEligibility(replacementTarget, { mediaKind: "image" });
        if (!eligibility.eligible) {
          throw new Error(eligibility.reason || "Actor portrait + linked token art is unavailable for the current token selection.");
        }
        _clipboardLog("info", "Replacing actor portrait and linked token art", {
          actorIds: eligibility.actors.map((actor) => actor.id || null),
          replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
          path
        });
        for (const actor of eligibility.actors) {
          await actor.update({
            img: path,
            "prototypeToken.texture.src": path
          });
        }
        const updatesByScene = /* @__PURE__ */ new Map();
        const trackSceneUpdate = (scene, tokenDocument) => {
          if (!scene?.updateEmbeddedDocuments || !tokenDocument?.id) return;
          const existing = updatesByScene.get(scene) || /* @__PURE__ */ new Map();
          existing.set(tokenDocument.id, {
            _id: tokenDocument.id,
            "texture.src": path
          });
          updatesByScene.set(scene, existing);
        };
        for (const scene of _clipboardGetAllScenesForLinkedTokenUpdates()) {
          const tokenDocuments = scene?.tokens?.contents || [];
          for (const tokenDocument of tokenDocuments) {
            if (!tokenDocument?.actorLink || !tokenDocument?.actorId) continue;
            if (!eligibility.actors.some((actor) => actor.id === tokenDocument.actorId)) continue;
            trackSceneUpdate(scene, tokenDocument);
          }
        }
        for (const document2 of replacementTarget.documents) {
          trackSceneUpdate(canvas?.scene, document2);
        }
        for (const [scene, sceneUpdates] of updatesByScene.entries()) {
          if (!sceneUpdates.size) continue;
          await scene.updateEmbeddedDocuments("Token", Array.from(sceneUpdates.values()));
        }
        return true;
      }
      async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind, options = {}) {
        if (!replacementTarget) return false;
        if (options.mode === "actor-art" && replacementTarget.documentName === "Token" && mediaKind === "image") {
          return _clipboardReplaceControlledTokenActorArt(path, replacementTarget, options);
        }
        const updates = replacementTarget.documents.map((document2) => {
          const update = {
            _id: document2.id,
            "texture.src": path
          };
          if (replacementTarget.documentName === "Tile" && mediaKind === "video") {
            update.video = _clipboardGetTileVideoData(mediaKind);
          }
          return update;
        });
        _clipboardLog("info", "Replacing controlled media", {
          replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
          mediaKind,
          path
        });
        await canvas.scene.updateEmbeddedDocuments(replacementTarget.documentName, updates);
        return true;
      }
      module.exports = {
        _clipboardGetAllScenesForLinkedTokenUpdates,
        _clipboardReplaceControlledTokenActorArt,
        _clipboardReplaceControlledMedia
      };
    }
  });

  // src/context.js
  var require_context = __commonJS({
    "src/context.js"(exports, module) {
      module.exports = {
        ...require_selection(),
        ...require_eligibility(),
        ...require_actor_types(),
        ...require_create_strategies(),
        ...require_plan(),
        ...require_actor_art()
      };
    }
  });

  // src/diagnostics/describers.js
  var require_describers = __commonJS({
    "src/diagnostics/describers.js"(exports, module) {
      function _clipboardDescribeFile(file) {
        if (!file) return null;
        return {
          name: file.name || null,
          type: file.type || null,
          size: file.size ?? null
        };
      }
      function _clipboardDescribeDestinationForLog(destination) {
        if (!destination) return null;
        return {
          storedSource: destination.storedSource,
          source: destination.source,
          target: destination.target,
          bucket: destination.bucket || null,
          endpoint: destination.endpoint || null
        };
      }
      function _clipboardDescribeReplacementTarget(replacementTarget) {
        if (!replacementTarget) return null;
        return {
          documentName: replacementTarget.documentName,
          ids: replacementTarget.documents.map((document2) => document2.id),
          requestedCount: replacementTarget.requestedCount ?? replacementTarget.documents.length,
          blocked: Boolean(replacementTarget.blocked)
        };
      }
      function _clipboardDescribePasteContext(context) {
        if (!context) return null;
        const { _clipboardHasCanvasFocus } = require_context();
        return {
          mousePos: context.mousePos,
          activeDocumentName: context.activeDocumentName || null,
          createDocumentName: context.createStrategy?.documentName || context.createDocumentName || null,
          replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
          requireCanvasFocus: context.requireCanvasFocus,
          hasCanvasFocus: _clipboardHasCanvasFocus()
        };
      }
      function _clipboardDescribeClipboardItems(clipItems) {
        return (clipItems || []).map((item, index) => ({
          index,
          types: Array.from(item.types || [])
        }));
      }
      function _clipboardDescribeDataTransfer(dataTransfer) {
        if (!dataTransfer) return null;
        return {
          types: Array.from(dataTransfer.types || []),
          files: Array.from(dataTransfer.files || []).map(_clipboardDescribeFile),
          items: Array.from(dataTransfer.items || []).map((item) => ({
            kind: item.kind,
            type: item.type
          }))
        };
      }
      function _clipboardDescribeImageInput(imageInput) {
        if (!imageInput) return null;
        const { _clipboardGetMediaKind } = require_media();
        if (imageInput.blob) {
          return {
            source: "blob",
            ..._clipboardDescribeFile(imageInput.blob) || {},
            mediaKind: _clipboardGetMediaKind({ blob: imageInput.blob, filename: imageInput.blob.name })
          };
        }
        return {
          source: "url",
          url: imageInput.url || null,
          mediaKind: _clipboardGetMediaKind({ src: imageInput.url }),
          fallbackBlob: imageInput.fallbackBlob ? _clipboardDescribeFile(imageInput.fallbackBlob) : null
        };
      }
      function _clipboardEscapeHtml(value) {
        return foundry?.utils?.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
      }
      module.exports = {
        _clipboardDescribeFile,
        _clipboardDescribeDestinationForLog,
        _clipboardDescribeReplacementTarget,
        _clipboardDescribePasteContext,
        _clipboardDescribeClipboardItems,
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardEscapeHtml
      };
    }
  });

  // src/diagnostics/logging.js
  var require_logging = __commonJS({
    "src/diagnostics/logging.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING
      } = require_constants();
      var CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT = 100;
      var CLIPBOARD_IMAGE_LOG_HISTORY = [];
      function _clipboardVerboseLoggingEnabled() {
        try {
          const settingKey = `${CLIPBOARD_IMAGE_MODULE_ID}.${CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING}`;
          if (!game?.settings?.settings?.has?.(settingKey)) return false;
          return Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING));
        } catch (error) {
          return false;
        }
      }
      function _clipboardSerializeError(error) {
        if (error instanceof Error) {
          return {
            name: error.name,
            message: error.message,
            stack: error.stack
          };
        }
        return error;
      }
      function _clipboardSanitizeForReport(value, depth = 3, seen = /* @__PURE__ */ new WeakSet()) {
        const { _clipboardDescribeFile } = require_describers();
        if (value === null || value === void 0) return value;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
        if (typeof value === "bigint") return value.toString();
        if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
        if (value instanceof Error) return _clipboardSerializeError(value);
        if (typeof File !== "undefined" && value instanceof File) return _clipboardDescribeFile(value);
        if (typeof Blob !== "undefined" && value instanceof Blob) {
          return {
            type: value.type || null,
            size: value.size ?? null
          };
        }
        if (value instanceof URL) return value.toString();
        if (depth <= 0) return "[MaxDepth]";
        if (Array.isArray(value)) return value.map((entry) => _clipboardSanitizeForReport(entry, depth - 1, seen));
        if (typeof value !== "object") return String(value);
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
        const output = {};
        for (const [key, entry] of Object.entries(value)) {
          output[key] = _clipboardSanitizeForReport(entry, depth - 1, seen);
        }
        seen.delete(value);
        return output;
      }
      function _clipboardRememberLogEntry(level, message, details) {
        const entry = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message
        };
        if (details !== void 0) entry.details = _clipboardSanitizeForReport(details);
        CLIPBOARD_IMAGE_LOG_HISTORY.push(entry);
        if (CLIPBOARD_IMAGE_LOG_HISTORY.length > CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT) {
          CLIPBOARD_IMAGE_LOG_HISTORY.splice(0, CLIPBOARD_IMAGE_LOG_HISTORY.length - CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT);
        }
        return entry;
      }
      function _clipboardGetLogHistory() {
        return CLIPBOARD_IMAGE_LOG_HISTORY.slice();
      }
      function _clipboardLog(level, message, details) {
        _clipboardRememberLogEntry(level, message, details);
        if ((level === "debug" || level === "info") && !_clipboardVerboseLoggingEnabled()) return;
        const logger = console[level] || console.log;
        const prefix = `Foundry Paste Eater [${level.toUpperCase()}]: ${message}`;
        if (details === void 0) {
          logger(prefix);
          return;
        }
        logger(prefix, details);
      }
      module.exports = {
        _clipboardVerboseLoggingEnabled,
        _clipboardSerializeError,
        _clipboardSanitizeForReport,
        _clipboardGetLogHistory,
        _clipboardLog
      };
    }
  });

  // src/diagnostics/reporting.js
  var require_reporting = __commonJS({
    "src/diagnostics/reporting.js"(exports, module) {
      var { CLIPBOARD_IMAGE_MODULE_ID } = require_constants();
      var {
        _clipboardVerboseLoggingEnabled,
        _clipboardSerializeError,
        _clipboardSanitizeForReport,
        _clipboardGetLogHistory,
        _clipboardLog
      } = require_logging();
      var { _clipboardEscapeHtml } = require_describers();
      var CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE = "clipboard-error-report";
      function _clipboardGetSocketChannel() {
        return `module.${CLIPBOARD_IMAGE_MODULE_ID}`;
      }
      function _clipboardCreateReportId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return uuid;
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      function _clipboardDescribeCurrentUser() {
        return {
          id: game?.user?.id || null,
          name: game?.user?.name || game?.user?.character?.name || "Unknown User",
          role: game?.user?.role ?? null,
          isGM: Boolean(game?.user?.isGM)
        };
      }
      function _clipboardGetAttemptedContentSummary(error, options = {}) {
        return options.contentSummary || error?.clipboardContentSummary || "some content";
      }
      function _clipboardGetErrorResolution(error, options = {}) {
        const resolution = options.resolution || error?.clipboardResolution || "";
        return String(resolution || "").trim();
      }
      function _clipboardGetErrorSummary(error) {
        if (typeof error?.clipboardSummary === "string" && error.clipboardSummary.trim()) {
          return error.clipboardSummary.trim();
        }
        if (error instanceof Error && error.message) {
          return error.message;
        }
        return "Failed to handle media input. Check the console.";
      }
      function _clipboardBuildAttemptDescription(userName, contentSummary) {
        return `${userName || "Someone"} attempted to paste ${contentSummary || "some content"}`;
      }
      function _clipboardBuildErrorReport(error, options = {}) {
        const serializedError = _clipboardSerializeError(error);
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const shortMessage = _clipboardGetErrorSummary(error);
        const user = _clipboardDescribeCurrentUser();
        const contentSummary = _clipboardGetAttemptedContentSummary(error, options);
        const attemptDescription = _clipboardBuildAttemptDescription(user.name, contentSummary);
        const resolution = _clipboardGetErrorResolution(error, options);
        const broadcastMessage = `${attemptDescription} but encountered an error: ${shortMessage}`;
        const playerMessage = options.playerMessage || (resolution ? `${broadcastMessage} ${resolution}` : broadcastMessage);
        const gmMessage = options.gmMessage || (resolution ? `${attemptDescription}. ${resolution}` : "Foundry Paste Eater encountered an error. Review the attached logfile for full details.");
        return {
          id: _clipboardCreateReportId(),
          timestamp,
          title: options.title || "Foundry Paste Eater Error",
          operation: options.operation || null,
          contentSummary,
          attemptDescription,
          broadcastMessage,
          playerMessage,
          gmMessage,
          resolution,
          summary: shortMessage,
          user,
          world: {
            id: game?.world?.id || null,
            title: game?.world?.title || null
          },
          browser: {
            href: globalThis.location?.href || null,
            userAgent: globalThis.navigator?.userAgent || null
          },
          details: _clipboardSanitizeForReport(options.details || null),
          error: serializedError,
          logs: _clipboardGetLogHistory()
        };
      }
      function _clipboardFormatErrorReport(report) {
        const parts = [
          "Foundry Paste Eater Error Report",
          `Report ID: ${report.id}`,
          `Timestamp: ${report.timestamp}`,
          `Title: ${report.title}`,
          `Summary: ${report.summary}`,
          `Attempt: ${report.attemptDescription}`,
          `Content: ${report.contentSummary}`,
          `Broadcast Message: ${report.broadcastMessage}`,
          `Player Message: ${report.playerMessage}`,
          `GM Message: ${report.gmMessage}`,
          `Resolution: ${report.resolution}`,
          "",
          "User",
          JSON.stringify(report.user, null, 2),
          "",
          "World",
          JSON.stringify(report.world, null, 2),
          "",
          "Browser",
          JSON.stringify(report.browser, null, 2),
          "",
          "Context",
          JSON.stringify({
            operation: report.operation,
            details: report.details
          }, null, 2),
          "",
          "Error",
          JSON.stringify(report.error, null, 2),
          "",
          "Recent Log History",
          JSON.stringify(report.logs, null, 2)
        ];
        return parts.join("\n");
      }
      function _clipboardCreateReportFile(report) {
        const safeTimestamp = report.timestamp.replaceAll(":", "-");
        const filename = `foundry-paste-eater-error-${safeTimestamp}.log`;
        const content = _clipboardFormatErrorReport(report);
        const url = globalThis.URL?.createObjectURL?.(new Blob([content], { type: "text/plain" })) || "";
        return { filename, content, url };
      }
      function _clipboardDownloadReportFile(report) {
        const file = _clipboardCreateReportFile(report);
        if (!file.content) return file;
        if (typeof globalThis.saveDataToFile === "function") {
          globalThis.saveDataToFile(file.content, "text/plain", file.filename);
          return file;
        }
        if (file.url && globalThis.document?.body) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          link.rel = "noopener";
          document.body.append(link);
          link.click();
          link.remove();
        }
        return file;
      }
      function _clipboardOpenGmErrorDialog(report, options = {}) {
        const file = _clipboardCreateReportFile(report);
        const userName = _clipboardEscapeHtml(report.user?.name || "Unknown User");
        const summary = _clipboardEscapeHtml(report.summary || "Unknown error");
        const attemptDescription = _clipboardEscapeHtml(report.attemptDescription || `${userName} attempted to paste some content`);
        const playerMessage = _clipboardEscapeHtml(report.playerMessage || "Foundry Paste Eater encountered an error.");
        const gmMessage = _clipboardEscapeHtml(report.gmMessage || "Review the attached logfile for full details.");
        const linkMarkup = file.url ? `<p><a href="${_clipboardEscapeHtml(file.url)}" download="${_clipboardEscapeHtml(file.filename)}" target="_blank" rel="noopener">Download module logfile</a></p>` : "";
        const origin = options.receivedFromSocket ? "Another user encountered a Foundry Paste Eater error." : "This client encountered a Foundry Paste Eater error.";
        const content = `
    <div class="foundry-paste-eater-error-dialog">
      <p>${_clipboardEscapeHtml(origin)}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Attempt:</strong> ${attemptDescription}</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Player-facing message:</strong> ${playerMessage}</p>
      <p><strong>GM guidance:</strong> ${gmMessage}</p>
      ${linkMarkup}
    </div>
  `;
        if (typeof globalThis.Dialog === "function") {
          new globalThis.Dialog({
            title: report.title || "Foundry Paste Eater Error",
            content,
            buttons: {
              close: {
                label: "Close"
              }
            },
            default: "close"
          }).render(true);
        }
        return file;
      }
      function _clipboardEmitErrorReport(report) {
        if (game?.user?.isGM) return false;
        if (typeof game?.socket?.emit !== "function") return false;
        game.socket.emit(_clipboardGetSocketChannel(), {
          type: CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE,
          report
        });
        return true;
      }
      function _clipboardHandleSocketReport(payload) {
        if (!payload || payload.type !== CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE) return false;
        if (!game?.user?.isGM) return false;
        if (!payload.report) return false;
        ui.notifications.error(payload.report.playerMessage || payload.report.broadcastMessage || payload.report.summary);
        _clipboardOpenGmErrorDialog(payload.report, { receivedFromSocket: true });
        return true;
      }
      function _clipboardRegisterErrorReporting() {
        if (typeof game?.socket?.on !== "function") return;
        const channel = _clipboardGetSocketChannel();
        const registeredChannels = game.socket.__clipboardRegisteredChannels instanceof Set ? game.socket.__clipboardRegisteredChannels : /* @__PURE__ */ new Set();
        if (registeredChannels.has(channel)) return;
        game.socket.on(channel, _clipboardHandleSocketReport);
        registeredChannels.add(channel);
        game.socket.__clipboardRegisteredChannels = registeredChannels;
      }
      function _clipboardReportError(error, options = {}) {
        _clipboardLog("error", options.logMessage || "Failed to handle media input", {
          operation: options.operation || null,
          details: options.details || null,
          error: _clipboardSerializeError(error)
        });
        const report = _clipboardBuildErrorReport(error, options);
        if (options.notifyLocal !== false) {
          ui.notifications.error(report.playerMessage);
        }
        if (game?.user?.isGM) {
          if (options.notifyLocal !== false) _clipboardOpenGmErrorDialog(report);
        } else {
          _clipboardEmitErrorReport(report);
        }
        if (options.autoDownload !== false && _clipboardVerboseLoggingEnabled()) {
          _clipboardDownloadReportFile(report);
        }
        return report;
      }
      module.exports = {
        _clipboardBuildErrorReport,
        _clipboardFormatErrorReport,
        _clipboardCreateReportFile,
        _clipboardDownloadReportFile,
        _clipboardOpenGmErrorDialog,
        _clipboardEmitErrorReport,
        _clipboardHandleSocketReport,
        _clipboardRegisterErrorReporting,
        _clipboardReportError
      };
    }
  });

  // src/diagnostics.js
  var require_diagnostics = __commonJS({
    "src/diagnostics.js"(exports, module) {
      module.exports = {
        ...require_logging(),
        ...require_describers(),
        ...require_reporting()
      };
    }
  });

  // src/text.js
  var require_text = __commonJS({
    "src/text.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX
      } = require_constants();
      function _clipboardNormalizePastedText(text) {
        const normalized = text?.replace(/\r\n?/g, "\n") || "";
        if (!normalized.trim()) return "";
        return normalized.trimEnd();
      }
      function _clipboardEscapeHtml(text) {
        return foundry.utils.escapeHTML(text || "");
      }
      function _clipboardExtractTextFromHtml(html) {
        if (!html?.trim()) return "";
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const body = documentFragment.body;
        if (!body) return "";
        for (const lineBreak of body.querySelectorAll("br")) {
          lineBreak.replaceWith(documentFragment.createTextNode("\n"));
        }
        const blockTags = [
          "address",
          "article",
          "aside",
          "blockquote",
          "dd",
          "div",
          "dl",
          "dt",
          "fieldset",
          "figcaption",
          "figure",
          "footer",
          "form",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "header",
          "hr",
          "li",
          "main",
          "nav",
          "ol",
          "p",
          "pre",
          "section",
          "table",
          "tr",
          "ul"
        ];
        for (const block of body.querySelectorAll(blockTags.join(","))) {
          if (block.firstChild?.textContent?.startsWith("\n") !== true) {
            block.prepend(documentFragment.createTextNode("\n"));
          }
          if (block.lastChild?.textContent?.endsWith("\n") !== true) {
            block.append(documentFragment.createTextNode("\n"));
          }
        }
        const extractedText = body.textContent?.replace(/^\n+/, "") || "";
        return _clipboardNormalizePastedText(extractedText);
      }
      function _clipboardConvertTextToHtml(text) {
        const paragraphs = _clipboardNormalizePastedText(text).split(/\n{2,}/).map((paragraph) => paragraph.split("\n").map(_clipboardEscapeHtml).join("<br>")).filter(Boolean);
        return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
      }
      function _clipboardGetTextPreview(text, maxLength = 48) {
        const normalized = _clipboardNormalizePastedText(text);
        if (!normalized) return CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX;
        const firstLine = normalized.split("\n").find((line) => line.trim()) || normalized;
        if (firstLine.length <= maxLength) return firstLine;
        return `${firstLine.slice(0, maxLength - 1).trimEnd()}\u2026`;
      }
      function _clipboardGetTextPageFormat() {
        return CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
      }
      function _clipboardGetDefaultNoteIcon() {
        return CONFIG?.JournalEntry?.noteIcons?.Book || Object.values(CONFIG?.JournalEntry?.noteIcons || {})[0] || "icons/svg/book.svg";
      }
      function _clipboardGetDocumentCenter(document2) {
        const center = document2?.object?.center;
        if (center) {
          return {
            x: center.x,
            y: center.y
          };
        }
        if (document2?.documentName === "Tile") {
          return {
            x: document2.x + document2.width / 2,
            y: document2.y + document2.height / 2
          };
        }
        const gridSizeX = canvas?.grid?.sizeX || canvas?.dimensions?.size || 100;
        const gridSizeY = canvas?.grid?.sizeY || canvas?.dimensions?.size || 100;
        return {
          x: document2.x + (document2.width || 1) * gridSizeX / 2,
          y: document2.y + (document2.height || 1) * gridSizeY / 2
        };
      }
      function _clipboardGetAssociatedNotePosition(document2, fallbackPosition = null) {
        if (document2) return _clipboardGetDocumentCenter(document2);
        return fallbackPosition;
      }
      function _clipboardCreateTextPageData(text, name = CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME) {
        return {
          name,
          type: "text",
          title: {
            show: true,
            level: 1
          },
          text: {
            content: _clipboardConvertTextToHtml(text),
            format: _clipboardGetTextPageFormat()
          }
        };
      }
      function _clipboardAppendHtmlContent(existingContent, newContent) {
        if (!existingContent?.trim()) return newContent;
        if (!newContent?.trim()) return existingContent;
        return `${existingContent}<hr>${newContent}`;
      }
      function _clipboardCreateSceneNoteData({ entryId, pageId, position, text }) {
        return {
          entryId,
          pageId,
          text,
          x: position.x,
          y: position.y,
          texture: {
            src: _clipboardGetDefaultNoteIcon()
          }
        };
      }
      module.exports = {
        _clipboardNormalizePastedText,
        _clipboardEscapeHtml,
        _clipboardExtractTextFromHtml,
        _clipboardConvertTextToHtml,
        _clipboardGetTextPreview,
        _clipboardGetTextPageFormat,
        _clipboardGetDefaultNoteIcon,
        _clipboardGetDocumentCenter,
        _clipboardGetAssociatedNotePosition,
        _clipboardCreateTextPageData,
        _clipboardAppendHtmlContent,
        _clipboardCreateSceneNoteData
      };
    }
  });

  // src/clipboard.js
  var require_clipboard = __commonJS({
    "src/clipboard.js"(exports, module) {
      var { CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE } = require_constants();
      var {
        _clipboardDescribeClipboardItems,
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardCoerceMediaFile,
        _clipboardGetMediaKind,
        _clipboardIsSupportedMediaBlob,
        _clipboardParseSupportedUrl
      } = require_media();
      var {
        _clipboardNormalizePastedText,
        _clipboardExtractTextFromHtml
      } = require_text();
      async function _clipboardReadClipboardItems() {
        let clipItems;
        try {
          _clipboardLog("debug", "Reading clipboard items via navigator.clipboard.read()");
          clipItems = await navigator.clipboard.read();
        } catch (error) {
          if (!error) {
            _clipboardLog("warn", "Failed to parse clipboard. Make sure your browser supports navigator.clipboard.");
            return null;
          }
          if (error instanceof DOMException) {
            if (error.name === "NotAllowedError") {
              _clipboardLog("info", "Clipboard access was blocked or dismissed.");
              return null;
            }
            if (error.name === "NotFoundError") {
              _clipboardLog("info", "Clipboard is empty.");
              return null;
            }
          }
          _clipboardLog("error", "Clipboard read failed", { error: _clipboardSerializeError(error) });
          throw error;
        }
        _clipboardLog("debug", "Read clipboard items", {
          itemCount: clipItems?.length || 0,
          items: _clipboardDescribeClipboardItems(clipItems)
        });
        return clipItems;
      }
      async function _clipboardExtractImageBlob(clipItems) {
        for (const clipItem of clipItems || []) {
          for (const fileType of clipItem.types) {
            if (_clipboardGetMediaKind({ mimeType: fileType })) {
              const blob = await clipItem.getType(fileType);
              const file = _clipboardCoerceMediaFile(blob, { mimeType: fileType });
              if (file) return file;
            }
          }
        }
        return null;
      }
      async function _clipboardReadClipboardText(clipItems, mimeType) {
        for (const clipItem of clipItems || []) {
          if (!clipItem.types.includes(mimeType)) continue;
          const textBlob = await clipItem.getType(mimeType);
          const text = await textBlob.text();
          if (text?.trim()) return text;
        }
        return "";
      }
      async function _clipboardExtractTextInput(clipItems) {
        return _clipboardExtractTextInputFromValues({
          plainText: await _clipboardReadClipboardText(clipItems, "text/plain"),
          html: await _clipboardReadClipboardText(clipItems, "text/html")
        });
      }
      function _clipboardExtractImageUrlFromUriList(text) {
        for (const line of (text || "").split(/\r?\n/)) {
          const candidate = line.trim();
          if (!candidate || candidate.startsWith("#")) continue;
          const url = _clipboardParseSupportedUrl(candidate);
          if (url) return url;
        }
        return null;
      }
      function _clipboardExtractImageUrlFromText(text) {
        const candidate = text?.trim();
        if (!candidate || /\s/.test(candidate)) return null;
        return _clipboardParseSupportedUrl(candidate);
      }
      function _clipboardExtractImageUrlFromHtml(html) {
        if (!html?.trim()) return null;
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const mediaElement = documentFragment.querySelector("img[src], video[src], source[src]");
        return _clipboardParseSupportedUrl(mediaElement?.getAttribute("src")?.trim());
      }
      function _clipboardGetUrlBackedImageInputCandidate({ uriList = "", html = "", plainText = "" } = {}, {
        uriListMessage,
        htmlMessage,
        plainTextMessage
      } = {}) {
        const fallbackText = plainText || "";
        const trimmedPlainText = fallbackText.trim();
        const uriListUrl = _clipboardExtractImageUrlFromUriList(uriList);
        if (uriListUrl) {
          return {
            imageInput: {
              url: uriListUrl,
              text: fallbackText || uriListUrl
            },
            message: uriListMessage
          };
        }
        const htmlUrl = _clipboardExtractImageUrlFromHtml(html);
        if (htmlUrl) {
          return {
            imageInput: {
              url: htmlUrl,
              text: fallbackText || htmlUrl
            },
            message: htmlMessage
          };
        }
        const textUrl = _clipboardExtractImageUrlFromText(trimmedPlainText);
        if (textUrl) {
          return {
            imageInput: {
              url: textUrl,
              text: fallbackText || textUrl
            },
            message: plainTextMessage
          };
        }
        return null;
      }
      function _clipboardIsAnimationCapableUrl(url) {
        return Boolean(url && /\.(?:apng|avif|gif|webp|m4v|mp4|mpeg|mpg|ogg|ogv|webm)(?:$|[?#])/i.test(url));
      }
      function _clipboardIsLikelyRasterizedImageBlob(blob) {
        if (!blob) return false;
        const mimeType = blob.type?.split(";").shift()?.trim()?.toLowerCase() || "";
        if ([
          "image/bmp",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/tif",
          "image/tiff",
          "image/x-icon"
        ].includes(mimeType)) {
          return true;
        }
        const extension = blob.name?.split(".").pop()?.trim()?.toLowerCase() || "";
        return ["bmp", "ico", "jpeg", "jpg", "png", "tif", "tiff"].includes(extension);
      }
      function _clipboardShouldPreferUrlCandidateOverBlob(blob, imageInput) {
        if (!blob || !imageInput?.url) return false;
        const blobMediaKind = _clipboardGetMediaKind({ blob, filename: blob.name });
        const urlMediaKind = _clipboardGetMediaKind({ src: imageInput.url });
        if (!urlMediaKind) return false;
        if (urlMediaKind === "video") return true;
        if (blobMediaKind !== "image") return false;
        if (!_clipboardIsAnimationCapableUrl(imageInput.url)) return false;
        return _clipboardIsLikelyRasterizedImageBlob(blob);
      }
      function _clipboardCreateLoggedImageInput(imageInput, message, details = void 0) {
        const logDetails = {
          imageInput: _clipboardDescribeImageInput(imageInput)
        };
        if (details) Object.assign(logDetails, details);
        _clipboardLog("debug", message, logDetails);
        return imageInput;
      }
      function _clipboardExtractTextInputFromValues({ plainText = "", html = "" } = {}) {
        const normalizedPlainText = _clipboardNormalizePastedText(plainText);
        if (normalizedPlainText) return { text: normalizedPlainText };
        if (!html?.trim()) return null;
        const extractedText = _clipboardExtractTextFromHtml(html);
        return extractedText ? { text: extractedText } : null;
      }
      function _clipboardExtractImageInputFromValues({ blob = null, uriList = "", html = "", plainText = "" } = {}, {
        blobMessage,
        uriListMessage,
        htmlMessage,
        plainTextMessage,
        details
      } = {}) {
        const urlCandidate = _clipboardGetUrlBackedImageInputCandidate({
          uriList,
          html,
          plainText
        }, {
          uriListMessage,
          htmlMessage,
          plainTextMessage
        });
        if (blob && urlCandidate && _clipboardShouldPreferUrlCandidateOverBlob(blob, urlCandidate.imageInput)) {
          return _clipboardCreateLoggedImageInput({
            ...urlCandidate.imageInput,
            fallbackBlob: blob
          }, "Preferred a direct animated-media URL over a rasterized pasted blob", details);
        }
        if (blob) return _clipboardCreateLoggedImageInput({ blob }, blobMessage, details);
        if (urlCandidate) return _clipboardCreateLoggedImageInput(urlCandidate.imageInput, urlCandidate.message, details);
        return null;
      }
      async function _clipboardExtractImageInput(clipItems) {
        return _clipboardExtractImageInputFromValues({
          blob: await _clipboardExtractImageBlob(clipItems),
          uriList: await _clipboardReadClipboardText(clipItems, "text/uri-list"),
          html: await _clipboardReadClipboardText(clipItems, "text/html"),
          plainText: await _clipboardReadClipboardText(clipItems, "text/plain")
        }, {
          blobMessage: "Resolved media input from async clipboard file data",
          uriListMessage: "Resolved media input from async clipboard uri-list",
          htmlMessage: "Resolved media input from async clipboard HTML",
          plainTextMessage: "Resolved media input from async clipboard plain text"
        });
      }
      function _clipboardExtractImageBlobFromDataTransfer(dataTransfer) {
        for (const item of dataTransfer?.items || []) {
          if (item.kind !== "file") continue;
          const file = item.getAsFile();
          const typedFile = _clipboardCoerceMediaFile(file, {
            filename: file?.name,
            mimeType: item.type
          });
          if (typedFile && _clipboardIsSupportedMediaBlob(typedFile)) return typedFile;
        }
        for (const file of dataTransfer?.files || []) {
          const typedFile = _clipboardCoerceMediaFile(file, {
            filename: file?.name,
            mimeType: file?.type
          });
          if (typedFile && _clipboardIsSupportedMediaBlob(typedFile)) return typedFile;
        }
        return null;
      }
      function _clipboardReadDataTransferText(dataTransfer, mimeType) {
        return dataTransfer?.getData?.(mimeType) || "";
      }
      function _clipboardExtractTextInputFromDataTransfer(dataTransfer) {
        return _clipboardExtractTextInputFromValues({
          plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain"),
          html: _clipboardReadDataTransferText(dataTransfer, "text/html")
        });
      }
      function _clipboardExtractImageInputFromDataTransfer(dataTransfer) {
        return _clipboardExtractImageInputFromValues({
          blob: _clipboardExtractImageBlobFromDataTransfer(dataTransfer),
          uriList: _clipboardReadDataTransferText(dataTransfer, "text/uri-list"),
          html: _clipboardReadDataTransferText(dataTransfer, "text/html"),
          plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain")
        }, {
          blobMessage: "Resolved media input from paste/drop file data",
          uriListMessage: "Resolved media input from paste/drop uri-list",
          htmlMessage: "Resolved media input from paste/drop HTML",
          plainTextMessage: "Resolved media input from paste/drop plain text URL",
          details: {
            dataTransfer: _clipboardDescribeDataTransfer(dataTransfer)
          }
        });
      }
      function _clipboardGetChatRootFromTarget(target) {
        return target?.closest?.(`[${CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE}="true"]`) || null;
      }
      function _clipboardIsEditableTarget(target) {
        return Boolean(
          target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable || target?.closest?.('[contenteditable="true"]')
        );
      }
      function _clipboardInsertTextAtTarget(target, text) {
        if (!text) return false;
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
          const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
          const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
          target.focus();
          target.setRangeText(text, start, end, "end");
          target.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        if (target?.isContentEditable) {
          target.focus();
          const selection = window.getSelection();
          if (!selection) return false;
          if (!selection.rangeCount) {
            const range2 = document.createRange();
            range2.selectNodeContents(target);
            range2.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range2);
          }
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          target.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      }
      module.exports = {
        _clipboardReadClipboardItems,
        _clipboardExtractImageBlob,
        _clipboardReadClipboardText,
        _clipboardExtractTextInput,
        _clipboardExtractImageUrlFromUriList,
        _clipboardExtractImageUrlFromText,
        _clipboardExtractImageUrlFromHtml,
        _clipboardGetUrlBackedImageInputCandidate,
        _clipboardIsAnimationCapableUrl,
        _clipboardIsLikelyRasterizedImageBlob,
        _clipboardShouldPreferUrlCandidateOverBlob,
        _clipboardCreateLoggedImageInput,
        _clipboardExtractTextInputFromValues,
        _clipboardExtractImageInputFromValues,
        _clipboardExtractImageInput,
        _clipboardExtractImageBlobFromDataTransfer,
        _clipboardReadDataTransferText,
        _clipboardExtractTextInputFromDataTransfer,
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardGetChatRootFromTarget,
        _clipboardIsEditableTarget,
        _clipboardInsertTextAtTarget
      };
    }
  });

  // src/field-targets.js
  var require_field_targets = __commonJS({
    "src/field-targets.js"(exports, module) {
      var {
        _clipboardDescribeImageInput,
        _clipboardLog
      } = require_diagnostics();
      var CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES = /* @__PURE__ */ new Set([
        "img",
        "texture.src",
        "prototypeToken.texture.src"
      ]);
      var CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS = {
        img: /* @__PURE__ */ new Set(["Actor", "Item"]),
        "texture.src": /* @__PURE__ */ new Set(["Token"]),
        "prototypeToken.texture.src": /* @__PURE__ */ new Set(["Actor", "Token"])
      };
      function _clipboardGetApplicationRoot(target) {
        return target?.closest?.("[data-appid], .window-app[id], .app[id], .application[id]") || null;
      }
      function _clipboardIterateApplicationInstances() {
        const candidates = [
          ui?.activeWindow || null,
          ...Object.values(ui?.windows || {})
        ];
        const instances = foundry?.applications?.instances;
        if (instances?.values) {
          candidates.push(...instances.values());
        }
        const seen = /* @__PURE__ */ new Set();
        return candidates.filter((candidate) => {
          if (!candidate || seen.has(candidate)) return false;
          seen.add(candidate);
          return true;
        });
      }
      function _clipboardResolveApplicationForRoot(appRoot) {
        if (!appRoot) return null;
        const appId = appRoot.dataset?.appid || null;
        const rootId = appRoot.id || null;
        if (appId && ui?.windows?.[appId]) {
          return ui.windows[appId];
        }
        for (const candidate of _clipboardIterateApplicationInstances()) {
          if (appId && String(candidate?.appId || "") === appId) return candidate;
          if (rootId && candidate?.id === rootId) return candidate;
        }
        return null;
      }
      function _clipboardGetAppFromElement(target) {
        const appRoot = _clipboardGetApplicationRoot(target);
        return {
          app: _clipboardResolveApplicationForRoot(appRoot),
          appRoot
        };
      }
      function _clipboardGetArtFieldName(target) {
        const picker = target?.closest?.("file-picker[name]") || null;
        const candidates = [
          target?.name,
          target?.dataset?.edit,
          picker?.getAttribute?.("name")
        ];
        for (const candidate of candidates) {
          if (typeof candidate !== "string") continue;
          const normalized = candidate.trim();
          if (!normalized) continue;
          if (CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES.has(normalized)) return normalized;
        }
        return null;
      }
      function _clipboardGetArtFieldMediaKinds(fieldName) {
        if (fieldName === "img") return ["image"];
        return ["image", "video"];
      }
      function _clipboardCanPopulateArtField(documentName, fieldName) {
        const allowedDocuments = CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS[fieldName];
        if (!allowedDocuments) return false;
        return allowedDocuments.has(documentName);
      }
      function _clipboardGetFocusedArtFieldTarget(target = document.activeElement) {
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return null;
        const fieldName = _clipboardGetArtFieldName(target);
        if (!fieldName) return null;
        const { app, appRoot } = _clipboardGetAppFromElement(target);
        const documentName = app?.document?.documentName || app?.object?.documentName || null;
        if (!_clipboardCanPopulateArtField(documentName, fieldName)) return null;
        return {
          field: target,
          fieldName,
          mediaKinds: _clipboardGetArtFieldMediaKinds(fieldName),
          picker: target.closest?.("file-picker[name]") || null,
          app,
          appRoot,
          documentName
        };
      }
      function _clipboardReloadMediaPreview(element) {
        if (!element?.load) return;
        if (/jsdom/i.test(globalThis.navigator?.userAgent || "") && element.load === globalThis.HTMLMediaElement?.prototype?.load) {
          return;
        }
        try {
          element.load();
        } catch {
        }
      }
      function _clipboardSetFormFieldValue(field, value) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return false;
        const picker = field.closest?.("file-picker[name]") || null;
        field.focus({ preventScroll: true });
        field.value = value;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
        if (picker) {
          picker.value = value;
          picker.dispatchEvent(new Event("input", { bubbles: true }));
          picker.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return true;
      }
      function _clipboardUpdateArtFieldPreview(targetInfo, value) {
        const previewSelector = `[data-edit="${targetInfo.fieldName}"]`;
        for (const element of targetInfo.appRoot?.querySelectorAll?.(previewSelector) || []) {
          if (element === targetInfo.field) continue;
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = value;
            continue;
          }
          if (element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLSourceElement) {
            element.src = value;
            if (element instanceof HTMLVideoElement) {
              _clipboardReloadMediaPreview(element);
              continue;
            }
            if (element instanceof HTMLSourceElement) {
              _clipboardReloadMediaPreview(element.parentElement);
            }
          }
        }
      }
      function _clipboardPopulateArtFieldTarget(targetInfo, value, imageInput = null) {
        if (!targetInfo || !value) return false;
        const updated = _clipboardSetFormFieldValue(targetInfo.field, value);
        if (!updated) return false;
        _clipboardUpdateArtFieldPreview(targetInfo, value);
        _clipboardLog("info", "Populated a focused document art field from pasted media", {
          documentName: targetInfo.documentName,
          fieldName: targetInfo.fieldName,
          value,
          imageInput: _clipboardDescribeImageInput(imageInput)
        });
        return true;
      }
      module.exports = {
        CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_NAMES,
        CLIPBOARD_IMAGE_SUPPORTED_ART_FIELD_DOCUMENTS,
        _clipboardGetApplicationRoot,
        _clipboardIterateApplicationInstances,
        _clipboardResolveApplicationForRoot,
        _clipboardGetAppFromElement,
        _clipboardGetArtFieldName,
        _clipboardGetArtFieldMediaKinds,
        _clipboardCanPopulateArtField,
        _clipboardGetFocusedArtFieldTarget,
        _clipboardReloadMediaPreview,
        _clipboardSetFormFieldValue,
        _clipboardUpdateArtFieldPreview,
        _clipboardPopulateArtFieldTarget
      };
    }
  });

  // src/notes.js
  var require_notes = __commonJS({
    "src/notes.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
        CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      var {
        _clipboardGetAssociatedNotePosition,
        _clipboardGetTextPreview,
        _clipboardCreateTextPageData,
        _clipboardAppendHtmlContent,
        _clipboardConvertTextToHtml,
        _clipboardGetTextPageFormat,
        _clipboardCreateSceneNoteData
      } = require_text();
      async function _clipboardCreateTextJournalEntry(text, name) {
        const journalEntry = await foundry.documents.JournalEntry.create({
          name: name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`,
          pages: [_clipboardCreateTextPageData(text, _clipboardGetTextPreview(text))]
        });
        return {
          entry: journalEntry,
          page: journalEntry?.pages?.contents?.[0] || null
        };
      }
      async function _clipboardAppendTextToPage(page, text) {
        if (!page || page.type !== "text") {
          throw new Error("Cannot append pasted text to a non-text journal page");
        }
        const updatedContent = _clipboardAppendHtmlContent(page.text?.content || "", _clipboardConvertTextToHtml(text));
        await page.update({
          "text.content": updatedContent,
          "text.format": _clipboardGetTextPageFormat()
        });
        return page;
      }
      function _clipboardGetAssociatedTextNoteData(document2) {
        const currentValue = document2?.getFlag?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG) || null;
        if (currentValue) return currentValue;
        return document2?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] || document2?._source?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] || null;
      }
      async function _clipboardEnsureAssociatedTextPage(document2, text) {
        const noteData = _clipboardGetAssociatedTextNoteData(document2);
        const existingEntry = noteData?.entryId ? game.journal?.get?.(noteData.entryId) : null;
        const existingPage = noteData?.pageId ? existingEntry?.pages?.get?.(noteData.pageId) : null;
        if (existingPage?.type === "text") {
          _clipboardLog("info", "Appending pasted text to existing placeable note page", {
            documentName: document2.documentName,
            documentId: document2.id,
            entryId: existingEntry.id,
            pageId: existingPage.id
          });
          await _clipboardAppendTextToPage(existingPage, text);
          return {
            entry: existingEntry,
            page: existingPage,
            noteId: noteData?.noteId || null
          };
        }
        const journalName = `${document2.name || document2.documentName} Notes`;
        if (existingEntry) {
          _clipboardLog("info", "Creating a new note page in an existing journal entry", {
            documentName: document2.documentName,
            documentId: document2.id,
            entryId: existingEntry.id
          });
          const createdPages = await existingEntry.createEmbeddedDocuments("JournalEntryPage", [
            _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME)
          ]);
          return {
            entry: existingEntry,
            page: createdPages[0],
            noteId: noteData?.noteId || null
          };
        }
        return {
          ...await _clipboardCreateTextJournalEntry(text, journalName),
          noteId: null
        };
      }
      async function _clipboardEnsurePlaceableTextNote(document2, text, fallbackPosition = null) {
        const position = _clipboardGetAssociatedNotePosition(document2, fallbackPosition);
        const label = `${document2.name || document2.documentName} Notes`;
        const { entry, page, noteId } = await _clipboardEnsureAssociatedTextPage(document2, text);
        if (!entry || !page || !position) {
          throw new Error("Failed to create or update a note journal for the selected placeable");
        }
        const existingNote = noteId ? canvas.scene?.notes?.get?.(noteId) : null;
        let note = existingNote;
        if (existingNote) {
          await existingNote.update({
            x: position.x,
            y: position.y,
            text: label,
            entryId: entry.id,
            pageId: page.id
          });
        } else {
          const createdNotes = await canvas.scene.createEmbeddedDocuments("Note", [
            _clipboardCreateSceneNoteData({
              entryId: entry.id,
              pageId: page.id,
              position,
              text: label
            })
          ]);
          note = createdNotes[0];
        }
        await document2.setFlag(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG, {
          entryId: entry.id,
          pageId: page.id,
          noteId: note?.id || null
        });
        const legacyModule = game?.modules?.get?.(CLIPBOARD_IMAGE_LEGACY_MODULE_ID);
        if (typeof document2?.unsetFlag === "function" && legacyModule?.active) {
          try {
            await document2.unsetFlag(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG);
          } catch (error) {
            _clipboardLog("debug", "Unable to clear the legacy note flag scope after migration.", {
              documentName: document2.documentName,
              documentId: document2.id,
              legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
              error: error instanceof Error ? error.message : `${error}`
            });
          }
        }
        _clipboardLog("info", "Created or updated a placeable text note", {
          documentName: document2.documentName,
          documentId: document2.id,
          entryId: entry.id,
          pageId: page.id,
          noteId: note?.id || null,
          position
        });
        return true;
      }
      function _clipboardGetSceneNoteEntryAndPage(noteDocument) {
        const entry = noteDocument?.entryId ? game.journal?.get?.(noteDocument.entryId) : null;
        const page = noteDocument?.pageId ? entry?.pages?.get?.(noteDocument.pageId) : null;
        return { entry, page };
      }
      async function _clipboardEnsureSceneNoteTextPage(noteDocument, text) {
        const { entry, page } = _clipboardGetSceneNoteEntryAndPage(noteDocument);
        if (page?.type === "text") {
          _clipboardLog("info", "Appending pasted text to an existing selected scene note page", {
            noteId: noteDocument.id,
            entryId: entry.id,
            pageId: page.id
          });
          await _clipboardAppendTextToPage(page, text);
          return { entry, page };
        }
        if (entry) {
          _clipboardLog("info", "Creating a new text page for a selected scene note", {
            noteId: noteDocument.id,
            entryId: entry.id
          });
          const createdPages = await entry.createEmbeddedDocuments("JournalEntryPage", [
            _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME)
          ]);
          const createdPage = createdPages[0] || null;
          if (createdPage) {
            await noteDocument.update({
              pageId: createdPage.id
            });
          }
          return {
            entry,
            page: createdPage
          };
        }
        const noteName = noteDocument?.text || noteDocument?.name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`;
        const created = await _clipboardCreateTextJournalEntry(text, noteName);
        if (created.entry?.id && created.page?.id) {
          await noteDocument.update({
            entryId: created.entry.id,
            pageId: created.page.id,
            text: noteName
          });
        }
        return created;
      }
      async function _clipboardAppendTextToSceneNote(noteDocument, text) {
        const { entry, page } = await _clipboardEnsureSceneNoteTextPage(noteDocument, text);
        if (!entry || !page) {
          throw new Error("Failed to create or update a journal page for the selected scene note");
        }
        _clipboardLog("info", "Created or updated text for a selected scene note", {
          noteId: noteDocument?.id || null,
          entryId: entry.id,
          pageId: page.id
        });
        return true;
      }
      async function _clipboardCreateStandaloneTextNote(text, context) {
        const position = context.mousePos;
        if (!position) return false;
        canvas?.notes?.activate?.();
        const preview = _clipboardGetTextPreview(text);
        const { entry, page } = await _clipboardCreateTextJournalEntry(text, `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${preview}`);
        await canvas.scene.createEmbeddedDocuments("Note", [
          _clipboardCreateSceneNoteData({
            entryId: entry.id,
            pageId: page.id,
            position,
            text: preview
          })
        ]);
        _clipboardLog("info", "Created standalone text note", {
          entryId: entry.id,
          pageId: page.id,
          position,
          preview
        });
        return true;
      }
      module.exports = {
        _clipboardCreateTextJournalEntry,
        _clipboardAppendTextToPage,
        _clipboardGetAssociatedTextNoteData,
        _clipboardEnsureAssociatedTextPage,
        _clipboardEnsurePlaceableTextNote,
        _clipboardGetSceneNoteEntryAndPage,
        _clipboardEnsureSceneNoteTextPage,
        _clipboardAppendTextToSceneNote,
        _clipboardCreateStandaloneTextNote
      };
    }
  });

  // src/chat.js
  var require_chat = __commonJS({
    "src/chat.js"(exports, module) {
      var { _clipboardLog } = require_diagnostics();
      var { _clipboardGetMediaKind } = require_media();
      var {
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT
      } = require_constants();
      var { _clipboardGetChatMediaDisplayMode } = require_settings();
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardUploadBlob,
        _clipboardCreateFreshMediaPath
      } = require_storage();
      function _clipboardCreateChatMediaContent(path) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        const displayMode = _clipboardGetChatMediaDisplayMode();
        const figure = document.createElement("figure");
        figure.className = "foundry-paste-eater-chat-message";
        const previewClassName = displayMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW ? "foundry-paste-eater-chat-full-preview" : "foundry-paste-eater-chat-thumbnail";
        if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY && mediaKind === "video") {
          const video = document.createElement("video");
          video.className = previewClassName;
          video.src = path;
          video.controls = true;
          video.loop = true;
          video.preload = "metadata";
          video.playsInline = true;
          figure.append(video);
        } else if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
          const previewLink = document.createElement("a");
          previewLink.className = "foundry-paste-eater-chat-link";
          previewLink.href = path;
          previewLink.target = "_blank";
          previewLink.rel = "noopener noreferrer";
          const image = document.createElement("img");
          image.className = previewClassName;
          image.src = path;
          image.alt = "Pasted chat media";
          previewLink.append(image);
          figure.append(previewLink);
        }
        const caption = document.createElement("figcaption");
        const openLink = document.createElement("a");
        openLink.href = path;
        openLink.target = "_blank";
        openLink.rel = "noopener noreferrer";
        openLink.textContent = "Open full media";
        caption.append(openLink);
        figure.append(caption);
        return figure.outerHTML;
      }
      function _clipboardGetFoundryGeneration() {
        const version = String(game?.release?.version || game?.version || "");
        const generation = Number.parseInt(version.split(".")[0], 10);
        return Number.isNaN(generation) ? null : generation;
      }
      function _clipboardGetChatMessageVisibilityOptions() {
        const settings = game?.settings;
        if (typeof settings?.get !== "function") {
          return null;
        }
        const generation = _clipboardGetFoundryGeneration();
        if ((generation || 0) >= 14) {
          const messageMode = settings.get("core", "messageMode");
          if (typeof messageMode === "string" && messageMode.trim()) {
            return { messageMode };
          }
          const legacyRollMode = settings.get("core", "rollMode");
          if (typeof legacyRollMode === "string" && legacyRollMode.trim()) {
            return { rollMode: legacyRollMode };
          }
          return null;
        }
        const rollMode = settings.get("core", "rollMode");
        if (typeof rollMode === "string" && rollMode.trim()) {
          return { rollMode };
        }
        return null;
      }
      async function _clipboardCreateChatMessage(path) {
        if (!path) {
          throw new Error("Cannot create a chat media message without a usable media path");
        }
        _clipboardLog("info", "Creating chat media message", {
          path,
          mediaKind: _clipboardGetMediaKind({ src: path }) || "image"
        });
        const messageData = {
          content: _clipboardCreateChatMediaContent(path),
          speaker: foundry.documents.ChatMessage.getSpeaker(),
          user: game.user.id
        };
        const visibilityOptions = _clipboardGetChatMessageVisibilityOptions();
        return visibilityOptions ? foundry.documents.ChatMessage.create(messageData, visibilityOptions) : foundry.documents.ChatMessage.create(messageData);
      }
      async function _clipboardPostChatImage(blob) {
        const destination = _clipboardGetUploadDestination({
          uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT
        });
        await _clipboardCreateFolderIfMissing(destination);
        const path = _clipboardCreateFreshMediaPath(await _clipboardUploadBlob(blob, destination));
        await _clipboardCreateChatMessage(path);
        return true;
      }
      module.exports = {
        _clipboardCreateChatMediaContent,
        _clipboardCreateChatMessage,
        _clipboardPostChatImage
      };
    }
  });

  // src/paste/workflow-runner.js
  var require_workflow_runner = __commonJS({
    "src/paste/workflow-runner.js"(exports, module) {
      var {
        _clipboardLog,
        _clipboardReportError
      } = require_diagnostics();
      var { _clipboardHasCopiedObjects } = require_context();
      var { _clipboardGetLocked, _clipboardSetLocked } = require_state();
      function _clipboardHasPasteConflict({ respectCopiedObjects = true } = {}) {
        if (respectCopiedObjects && _clipboardHasCopiedObjects()) {
          _clipboardLog("warn", "Priority given to Foundry copied objects.");
          return true;
        }
        if (_clipboardGetLocked()) {
          _clipboardLog("info", "Skipping paste because the module is already handling another paste.");
          return true;
        }
        if (game.modules.get("vtta-tokenizer")?.active && Object.values(ui.windows).some((windowApp) => windowApp.id === "tokenizer-control")) {
          _clipboardLog("info", "Skipping paste because VTTA Tokenizer is active.");
          return true;
        }
        return false;
      }
      async function _clipboardExecutePasteWorkflow(workflow, options = {}) {
        const { notifyError = true, respectCopiedObjects = true } = options;
        if (_clipboardHasPasteConflict({ respectCopiedObjects })) return false;
        _clipboardSetLocked(true);
        _clipboardLog("debug", "Starting paste workflow", { options });
        try {
          const result = await workflow();
          _clipboardLog("debug", "Finished paste workflow", { options, result });
          return result;
        } catch (error) {
          _clipboardReportError(error, {
            operation: "execute-paste-workflow",
            details: { options },
            notifyLocal: notifyError,
            logMessage: "Failed to handle media input"
          });
          return false;
        } finally {
          _clipboardSetLocked(false);
        }
      }
      module.exports = {
        _clipboardHasPasteConflict,
        _clipboardExecutePasteWorkflow
      };
    }
  });

  // src/paste/token-modes.js
  var require_token_modes = __commonJS({
    "src/paste/token-modes.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
        CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
      } = require_constants();
      var { _clipboardGetTokenActorArtEligibility } = require_context();
      var { _clipboardGetSelectedTokenPasteMode } = require_settings();
      function _clipboardGetDefaultTokenReplacementBehavior() {
        return {
          mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
          uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
          eligibility: null
        };
      }
      function _clipboardPromptSelectedTokenPasteMode() {
        return new Promise((resolve) => {
          let settled = false;
          const settle = (mode) => {
            document.querySelector(".game")?.focus?.({ preventScroll: true });
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
                callback: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY)
              },
              actorArt: {
                label: "Actor portrait + linked token art",
                callback: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART)
              }
            },
            default: "sceneOnly",
            close: () => settle(CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY)
          }, {
            classes: ["foundry-paste-eater-token-mode-dialog"],
            width: 760
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
        const eligibility = _clipboardGetTokenActorArtEligibility(context.replacementTarget, { mediaKind });
        if (configuredMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART) {
          if (!eligibility.eligible) {
            throw new Error(eligibility.reason || "Actor portrait + linked token art is unavailable for the current token selection.");
          }
          return {
            mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
            uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
            eligibility
          };
        }
        if (!eligibility.eligible) {
          return {
            ..._clipboardGetDefaultTokenReplacementBehavior(),
            eligibility
          };
        }
        const selectedMode = await _clipboardPromptSelectedTokenPasteMode();
        if (selectedMode === CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART) {
          return {
            mode: CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
            uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
            eligibility
          };
        }
        return {
          ..._clipboardGetDefaultTokenReplacementBehavior(),
          eligibility
        };
      }
      module.exports = {
        _clipboardGetDefaultTokenReplacementBehavior,
        _clipboardPromptSelectedTokenPasteMode,
        _clipboardResolveTokenReplacementBehavior
      };
    }
  });

  // src/paste/helpers.js
  var require_helpers = __commonJS({
    "src/paste/helpers.js"(exports, module) {
      var {
        _clipboardGetMediaKind,
        _clipboardNormalizeMimeType,
        _clipboardGetFilenameExtension
      } = {
        ...require_media(),
        ...require_text()
      };
      function _clipboardIsBlockedDirectMediaUrlDownload(imageInput, error) {
        return Boolean(
          error?.clipboardBlockedDirectMediaUrl || imageInput?.url && _clipboardGetMediaKind({ src: imageInput.url }) && error instanceof Error && error.message.startsWith("Failed to download pasted media URL from ")
        );
      }
      function _clipboardGetBlockedDirectMediaUrlError(imageInput, error) {
        if (!_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return null;
        const directMediaUrlError = new Error(
          "The pasted media URL points to a host that blocks browser-side downloads, so Foundry Paste Eater cannot download and re-upload it. Upload the file locally or use a CORS-enabled host."
        );
        directMediaUrlError.clipboardBlockedDirectMediaUrl = true;
        return directMediaUrlError;
      }
      function _clipboardShouldFallbackToText(imageInput, error) {
        if (_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return false;
        return true;
      }
      function _clipboardDescribeAttemptedMediaContent({ blob, imageInput } = {}) {
        const candidateBlob = blob || imageInput?.blob || imageInput?.fallbackBlob || null;
        const candidateName = candidateBlob?.name || imageInput?.url || "";
        const candidateType = _clipboardNormalizeMimeType(candidateBlob?.type || "");
        const extension = _clipboardGetFilenameExtension(candidateName);
        const mediaKind = _clipboardGetMediaKind({
          blob: candidateBlob,
          filename: candidateName,
          mimeType: candidateType,
          src: imageInput?.url || null
        });
        if (mediaKind === "video") return "a video";
        if (mediaKind === "image") {
          if (candidateType === "image/gif" || extension === "gif" || extension === "apng") return "an animation";
          return "an image";
        }
        return "some content";
      }
      function _clipboardAnnotateWorkflowError(error, metadata = {}) {
        if (!(error instanceof Error)) return error;
        for (const [key, value] of Object.entries(metadata)) {
          if (value === void 0 || value === null || value === "") continue;
          if (error[key] === void 0 || error[key] === null || error[key] === "") {
            error[key] = value;
          }
        }
        return error;
      }
      module.exports = {
        _clipboardIsBlockedDirectMediaUrlDownload,
        _clipboardGetBlockedDirectMediaUrlError,
        _clipboardShouldFallbackToText,
        _clipboardDescribeAttemptedMediaContent,
        _clipboardAnnotateWorkflowError
      };
    }
  });

  // src/paste/text-workflows.js
  var require_text_workflows = __commonJS({
    "src/paste/text-workflows.js"(exports, module) {
      var {
        _clipboardDescribePasteContext,
        _clipboardDescribeReplacementTarget,
        _clipboardLog
      } = require_diagnostics();
      var { _clipboardNormalizePastedText } = require_text();
      var { _clipboardResolvePasteContext, _clipboardCanPasteToContext } = require_context();
      var { _clipboardCanUseCanvasText } = require_settings();
      var {
        _clipboardEnsurePlaceableTextNote,
        _clipboardCreateStandaloneTextNote,
        _clipboardAppendTextToSceneNote
      } = require_notes();
      var { _clipboardAnnotateWorkflowError } = require_helpers();
      async function _clipboardHandleTextInput(textInput, options = {}) {
        const text = _clipboardNormalizePastedText(textInput?.text);
        if (!text) return false;
        if (!canvas?.ready || !canvas.scene) return false;
        if (!_clipboardCanUseCanvasText()) return false;
        const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
        _clipboardLog("debug", "Handling pasted text", {
          textLength: text.length,
          context: _clipboardDescribePasteContext(context)
        });
        if (!_clipboardCanPasteToContext(context)) {
          _clipboardLog("info", "Skipping pasted text because the current context is not eligible", {
            context: _clipboardDescribePasteContext(context)
          });
          return false;
        }
        try {
          if (context.replacementTarget?.documents?.length) {
            _clipboardLog("info", "Applying pasted text to controlled placeables", {
              replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
              textLength: text.length
            });
            for (const document2 of context.replacementTarget.documents) {
              if (context.replacementTarget.documentName === "Note") {
                await _clipboardAppendTextToSceneNote(document2, text);
              } else {
                await _clipboardEnsurePlaceableTextNote(document2, text, context.mousePos);
              }
            }
            return true;
          }
          _clipboardLog("info", "Creating a standalone text note from pasted text", {
            textLength: text.length,
            mousePos: context.mousePos
          });
          return await _clipboardCreateStandaloneTextNote(text, context);
        } catch (error) {
          throw _clipboardAnnotateWorkflowError(error, {
            clipboardContentSummary: "text"
          });
        }
      }
      module.exports = {
        _clipboardHandleTextInput
      };
    }
  });

  // src/paste/canvas-media.js
  var require_canvas_media = __commonJS({
    "src/paste/canvas-media.js"(exports, module) {
      var { CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY } = require_constants();
      var {
        _clipboardDescribeImageInput,
        _clipboardDescribePasteContext,
        _clipboardDescribeReplacementTarget,
        _clipboardDescribeDestinationForLog,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardGetMediaKind,
        _clipboardIsGifMedia,
        _clipboardNormalizePastedText,
        _clipboardLoadMediaDimensions,
        _clipboardGetPreferredMediaDimensions,
        _clipboardConvertGifToStaticPng
      } = {
        ...require_media(),
        ...require_text()
      };
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardResolveImageInputBlob,
        _clipboardUploadBlob,
        _clipboardCreateFreshMediaPath
      } = require_storage();
      var {
        _clipboardResolvePasteContext,
        _clipboardCanPasteToContext,
        _clipboardPrepareCreateLayer,
        _clipboardReplaceControlledMedia
      } = require_context();
      var { _clipboardCanUseCanvasMedia } = require_settings();
      var { _clipboardHandleTextInput } = require_text_workflows();
      var {
        _clipboardShouldFallbackToText,
        _clipboardGetBlockedDirectMediaUrlError,
        _clipboardIsBlockedDirectMediaUrlDownload,
        _clipboardDescribeAttemptedMediaContent,
        _clipboardAnnotateWorkflowError
      } = require_helpers();
      var { _clipboardResolveTokenReplacementBehavior } = require_token_modes();
      function _clipboardReplacementTargetSupportsMediaKind(replacementTarget, mediaKind) {
        if (!replacementTarget?.documentName) return true;
        if (replacementTarget.documentName === "Note") return mediaKind !== "video";
        return true;
      }
      async function _clipboardNormalizeCanvasBlob(blob) {
        if (!_clipboardIsGifMedia({ blob, filename: blob?.name, mimeType: blob?.type })) return blob;
        return _clipboardConvertGifToStaticPng(blob);
      }
      async function _clipboardApplyPasteResult(path, context, preferredDimensions = null, options = {}) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        if (context.replacementTarget?.documents?.length && !_clipboardReplacementTargetSupportsMediaKind(context.replacementTarget, mediaKind)) {
          throw new Error(`Selected ${context.replacementTarget.documentName.toLowerCase()} targets do not support pasted ${mediaKind} media.`);
        }
        if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind, options.replacementBehavior)) {
          _clipboardLog("info", "Applied pasted media by replacing controlled documents", {
            path,
            mediaKind,
            replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
            replacementMode: options.replacementBehavior?.mode || CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY
          });
          return true;
        }
        const { width: imgWidth, height: imgHeight } = preferredDimensions || await _clipboardLoadMediaDimensions(path);
        const createData = await context.createStrategy.createData({
          path,
          imgWidth,
          imgHeight,
          mediaKind,
          mousePos: context.mousePos
        });
        await canvas.scene.createEmbeddedDocuments(context.createStrategy.documentName, createData);
        _clipboardLog("info", "Applied pasted media by creating new documents", {
          path,
          mediaKind,
          documentName: context.createStrategy.documentName,
          createCount: createData.length,
          mousePos: context.mousePos
        });
        return true;
      }
      async function _clipboardPasteBlob(blob, targetFolder, { contextOptions = {}, context = null, replacementBehavior = null } = {}) {
        if (!canvas?.ready || !canvas.scene) return false;
        if (!_clipboardCanUseCanvasMedia()) return false;
        const resolvedContext = context || _clipboardResolvePasteContext(contextOptions);
        const mediaKind = _clipboardGetMediaKind({ blob, filename: blob?.name }) || "image";
        const resolvedReplacementBehavior = replacementBehavior || await _clipboardResolveTokenReplacementBehavior(resolvedContext, mediaKind);
        _clipboardLog("debug", "Resolved canvas paste context", {
          context: _clipboardDescribePasteContext(resolvedContext),
          destination: _clipboardDescribeDestinationForLog(targetFolder),
          blob: _clipboardDescribeImageInput({ blob }),
          replacementMode: resolvedReplacementBehavior.mode
        });
        if (!_clipboardCanPasteToContext(resolvedContext)) {
          _clipboardLog("info", "Skipping canvas paste because the current context is not eligible", {
            context: _clipboardDescribePasteContext(resolvedContext)
          });
          return false;
        }
        _clipboardPrepareCreateLayer(resolvedContext);
        const preferredDimensions = await _clipboardGetPreferredMediaDimensions(blob);
        const uploadPath = await _clipboardUploadBlob(blob, targetFolder);
        return _clipboardApplyPasteResult(_clipboardCreateFreshMediaPath(uploadPath), resolvedContext, preferredDimensions, {
          replacementBehavior: resolvedReplacementBehavior
        });
      }
      async function _clipboardPasteMediaPath(path, contextOptions = {}) {
        if (!canvas?.ready || !canvas.scene) return false;
        if (!_clipboardCanUseCanvasMedia()) return false;
        const context = _clipboardResolvePasteContext(contextOptions);
        _clipboardLog("debug", "Resolved direct media URL paste context", {
          context: _clipboardDescribePasteContext(context),
          path,
          mediaKind: _clipboardGetMediaKind({ src: path }) || null
        });
        if (!_clipboardCanPasteToContext(context)) {
          _clipboardLog("info", "Skipping direct media URL paste because the current context is not eligible", {
            context: _clipboardDescribePasteContext(context),
            path
          });
          return false;
        }
        _clipboardPrepareCreateLayer(context);
        return _clipboardApplyPasteResult(path, context);
      }
      async function _clipboardHandleImageBlob(blob, options = {}) {
        if (!blob) return false;
        const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
        const mediaKind = _clipboardGetMediaKind({ blob, filename: blob?.name }) || "image";
        const replacementBehavior = options.replacementBehavior || await _clipboardResolveTokenReplacementBehavior(context, mediaKind);
        const destination = _clipboardGetUploadDestination({
          uploadContext: replacementBehavior.uploadContext
        });
        try {
          const normalizedBlob = mediaKind === "image" ? await _clipboardNormalizeCanvasBlob(blob) : blob;
          await _clipboardCreateFolderIfMissing(destination);
          return await _clipboardPasteBlob(normalizedBlob, destination, {
            contextOptions: options.contextOptions,
            context,
            replacementBehavior
          });
        } catch (error) {
          throw _clipboardAnnotateWorkflowError(error, {
            clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ blob })
          });
        }
      }
      async function _clipboardHandleImageInput(imageInput, options = {}) {
        _clipboardLog("debug", "Handling media input", {
          imageInput: _clipboardDescribeImageInput(imageInput)
        });
        let blob;
        try {
          blob = await _clipboardResolveImageInputBlob(imageInput);
        } catch (error) {
          const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
          if (directMediaUrlFailure) {
            if (imageInput?.fallbackBlob) {
              _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for canvas handling", {
                imageInput: _clipboardDescribeImageInput(imageInput),
                error: _clipboardSerializeError(error)
              });
              return _clipboardHandleImageBlob(imageInput.fallbackBlob, options);
            }
            _clipboardLog("warn", "Direct media URL cannot be used on the canvas after download failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            throw _clipboardAnnotateWorkflowError(directMediaUrlFailure, {
              clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ imageInput })
            });
          }
          throw error;
        }
        if (!blob) return false;
        return _clipboardHandleImageBlob(blob, options);
      }
      async function _clipboardHandleImageInputWithTextFallback(imageInput, options = {}) {
        try {
          return await _clipboardHandleImageInput(imageInput, options);
        } catch (error) {
          if (!_clipboardShouldFallbackToText(imageInput, error)) throw error;
          const fallbackText = _clipboardNormalizePastedText(imageInput?.text || imageInput?.url || "");
          if (!fallbackText) throw error;
          _clipboardLog("info", "Falling back to pasted text after media handling failed.", {
            imageInput: _clipboardDescribeImageInput(imageInput),
            error: _clipboardSerializeError(error)
          });
          return _clipboardHandleTextInput({ text: fallbackText }, options);
        }
      }
      module.exports = {
        _clipboardApplyPasteResult,
        _clipboardPasteBlob,
        _clipboardPasteMediaPath,
        _clipboardIsBlockedDirectMediaUrlDownload,
        _clipboardGetBlockedDirectMediaUrlError,
        _clipboardShouldFallbackToText,
        _clipboardHandleImageBlob,
        _clipboardHandleImageInput,
        _clipboardHandleImageInputWithTextFallback
      };
    }
  });

  // src/paste/scene-tools.js
  var require_scene_tools = __commonJS({
    "src/paste/scene-tools.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
        CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT
      } = require_constants();
      var { _clipboardDescribeFile, _clipboardLog } = require_diagnostics();
      var {
        _clipboardReadClipboardItems,
        _clipboardExtractImageInput,
        _clipboardExtractTextInput
      } = require_clipboard();
      var {
        _clipboardCanUseScenePasteTool,
        _clipboardCanUseSceneUploadTool
      } = require_settings();
      var {
        _clipboardHandleImageInput,
        _clipboardHandleImageInputWithTextFallback,
        _clipboardHandleImageBlob
      } = require_canvas_media();
      var { _clipboardHandleTextInput } = require_text_workflows();
      var { _clipboardExecutePasteWorkflow } = require_workflow_runner();
      async function _clipboardReadAndPasteImage(options = {}) {
        const clipItems = await _clipboardReadClipboardItems();
        if (!clipItems?.length) {
          if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No clipboard media was available.");
          return false;
        }
        const imageInput = await _clipboardExtractImageInput(clipItems);
        if (!imageInput) {
          if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No supported media or media URL was found in the clipboard.");
          return false;
        }
        if (options.handleImageInput) return options.handleImageInput(imageInput);
        if (options.handleImageBlob) {
          const blob = await require_storage()._clipboardResolveImageInputBlob(imageInput);
          if (!blob) return false;
          return options.handleImageBlob(blob);
        }
        return _clipboardHandleImageInput(imageInput, options);
      }
      async function _clipboardReadAndPasteClipboardContent(options = {}) {
        const clipItems = await _clipboardReadClipboardItems();
        if (!clipItems?.length) {
          if (options.notifyNoContent) ui.notifications.warn("Foundry Paste Eater: No clipboard data was available.");
          return false;
        }
        const mediaInput = await _clipboardExtractImageInput(clipItems);
        if (mediaInput) {
          if (options.handleImageInput) return options.handleImageInput(mediaInput);
          return _clipboardHandleImageInputWithTextFallback(mediaInput, options);
        }
        const textInput = await _clipboardExtractTextInput(clipItems);
        if (textInput) {
          if (options.handleTextInput) return options.handleTextInput(textInput);
          return _clipboardHandleTextInput(textInput, options);
        }
        if (options.notifyNoContent) {
          ui.notifications.warn("Foundry Paste Eater: No supported media or text was found in the clipboard.");
        }
        return false;
      }
      function _clipboardChooseImageFile() {
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT;
          input.style.display = "none";
          const cleanup = () => {
            input.removeEventListener("change", onChange);
            window.removeEventListener("focus", onWindowFocus);
            input.remove();
          };
          const onChange = () => {
            const [file] = Array.from(input.files || []);
            cleanup();
            resolve(file || null);
          };
          const onWindowFocus = () => {
            window.setTimeout(() => {
              if (input.files?.length) return;
              cleanup();
              resolve(null);
            }, 0);
          };
          input.addEventListener("change", onChange, { once: true });
          window.addEventListener("focus", onWindowFocus, { once: true });
          document.body.appendChild(input);
          input.click();
        });
      }
      async function _clipboardChooseAndHandleMediaFile({ emptyMessage, selectedMessage, handler }) {
        const file = await _clipboardChooseImageFile();
        if (!file) {
          _clipboardLog("info", emptyMessage);
          return false;
        }
        _clipboardLog("info", selectedMessage, _clipboardDescribeFile(file));
        return handler(file);
      }
      async function _clipboardOpenUploadPicker() {
        return _clipboardChooseAndHandleMediaFile({
          emptyMessage: "Upload picker closed without selecting a file.",
          selectedMessage: "Selected a media file from the upload picker",
          handler: (file) => _clipboardHandleImageBlob(file, {
            contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
          })
        });
      }
      async function _clipboardOpenChatUploadPicker() {
        return _clipboardChooseAndHandleMediaFile({
          emptyMessage: "Chat upload picker closed without selecting a file.",
          selectedMessage: "Selected a media file from the chat upload picker",
          handler: (file) => require_chat_media()._clipboardHandleChatImageBlob(file)
        });
      }
      function _clipboardHandleScenePasteAction() {
        if (!_clipboardCanUseScenePasteTool()) return false;
        if (!navigator.clipboard?.read) {
          ui.notifications.warn("Foundry Paste Eater: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
          return false;
        }
        _clipboardLog("info", "Invoked scene Paste Media action.", {
          activeLayer: canvas?.activeLayer?.options?.name || null
        });
        void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteImage({
          notifyNoImage: true,
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
        return true;
      }
      function _clipboardHandleSceneUploadAction() {
        if (!_clipboardCanUseSceneUploadTool()) return false;
        _clipboardLog("info", "Invoked scene Upload Media action.", {
          activeLayer: canvas?.activeLayer?.options?.name || null
        });
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
          respectCopiedObjects: false
        });
        return true;
      }
      module.exports = {
        _clipboardReadAndPasteImage,
        _clipboardReadAndPasteClipboardContent,
        _clipboardChooseImageFile,
        _clipboardChooseAndHandleMediaFile,
        _clipboardOpenUploadPicker,
        _clipboardOpenChatUploadPicker,
        _clipboardHandleScenePasteAction,
        _clipboardHandleSceneUploadAction
      };
    }
  });

  // src/paste/chat-media.js
  var require_chat_media = __commonJS({
    "src/paste/chat-media.js"(exports, module) {
      var {
        _clipboardDescribeImageInput,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var { _clipboardResolveImageInputBlob } = require_storage();
      var { _clipboardCanUseChatMedia } = require_settings();
      var { _clipboardPostChatImage } = require_chat();
      var {
        _clipboardGetBlockedDirectMediaUrlError,
        _clipboardDescribeAttemptedMediaContent,
        _clipboardAnnotateWorkflowError
      } = require_helpers();
      var { _clipboardExecutePasteWorkflow } = require_workflow_runner();
      var { _clipboardOpenChatUploadPicker } = require_scene_tools();
      async function _clipboardHandleChatImageBlob(blob) {
        if (!blob) return false;
        if (!_clipboardCanUseChatMedia()) return false;
        try {
          return await _clipboardPostChatImage(blob);
        } catch (error) {
          throw _clipboardAnnotateWorkflowError(error, {
            clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ blob })
          });
        }
      }
      async function _clipboardHandleChatImageInput(imageInput) {
        let blob;
        try {
          blob = await _clipboardResolveImageInputBlob(imageInput);
        } catch (error) {
          const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
          if (directMediaUrlFailure) {
            if (imageInput?.fallbackBlob) {
              _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for chat handling", {
                imageInput: _clipboardDescribeImageInput(imageInput),
                error: _clipboardSerializeError(error)
              });
              return _clipboardHandleChatImageBlob(imageInput.fallbackBlob);
            }
            _clipboardLog("warn", "Direct media URL cannot be posted as chat media after download failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            throw _clipboardAnnotateWorkflowError(directMediaUrlFailure, {
              clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ imageInput })
            });
          }
          throw error;
        }
        if (!blob) return false;
        return _clipboardHandleChatImageBlob(blob);
      }
      function _clipboardHandleChatUploadAction() {
        if (!_clipboardCanUseChatMedia()) return false;
        _clipboardLog("info", "Invoked chat Upload Media action.");
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
          respectCopiedObjects: false
        });
        return true;
      }
      module.exports = {
        _clipboardHandleChatImageBlob,
        _clipboardHandleChatImageInput,
        _clipboardHandleChatUploadAction
      };
    }
  });

  // src/paste/art-fields.js
  var require_art_fields = __commonJS({
    "src/paste/art-fields.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
      } = require_constants();
      var {
        _clipboardDescribeImageInput,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardGetMediaKind,
        _clipboardIsGifMedia,
        _clipboardConvertGifToStaticPng
      } = require_media();
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardResolveImageInputBlob,
        _clipboardUploadBlob,
        _clipboardCreateFreshMediaPath
      } = require_storage();
      var { _clipboardCanUseCanvasMedia } = require_settings();
      var {
        _clipboardGetFocusedArtFieldTarget,
        _clipboardPopulateArtFieldTarget
      } = require_field_targets();
      var {
        _clipboardGetBlockedDirectMediaUrlError,
        _clipboardDescribeAttemptedMediaContent,
        _clipboardAnnotateWorkflowError
      } = require_helpers();
      function _clipboardFieldRequiresStaticTexture(fieldName = "") {
        return /(?:^|[.])texture\.src$/i.test(String(fieldName || "").trim());
      }
      async function _clipboardHandleArtFieldImageInput(imageInput, target) {
        if (!_clipboardCanUseCanvasMedia()) return false;
        const artFieldTarget = target?.field ? target : _clipboardGetFocusedArtFieldTarget(target);
        if (!artFieldTarget) return false;
        const destination = _clipboardGetUploadDestination({
          uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART
        });
        let fieldValue = null;
        let mediaKind = _clipboardGetMediaKind({ src: imageInput?.url, filename: imageInput?.blob?.name, mimeType: imageInput?.blob?.type });
        try {
          let blob = await _clipboardResolveImageInputBlob(imageInput);
          if (!blob) return false;
          mediaKind = _clipboardGetMediaKind({ blob, filename: blob.name }) || mediaKind;
          if (mediaKind && !artFieldTarget.mediaKinds.includes(mediaKind)) {
            throw new Error(`The focused ${artFieldTarget.fieldName} field does not support pasted ${mediaKind} media.`);
          }
          if (_clipboardFieldRequiresStaticTexture(artFieldTarget.fieldName) && _clipboardIsGifMedia({ blob, filename: blob?.name, mimeType: blob?.type })) {
            blob = await _clipboardConvertGifToStaticPng(blob);
            mediaKind = _clipboardGetMediaKind({ blob, filename: blob.name }) || mediaKind;
          }
          await _clipboardCreateFolderIfMissing(destination);
          const uploadPath = await _clipboardUploadBlob(blob, destination);
          fieldValue = _clipboardCreateFreshMediaPath(uploadPath);
        } catch (error) {
          const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
          if (!directMediaUrlFailure || !imageInput?.url) {
            throw _clipboardAnnotateWorkflowError(error, {
              clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ imageInput })
            });
          }
          if (imageInput?.fallbackBlob) {
            _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for a focused art field", {
              fieldName: artFieldTarget.fieldName,
              documentName: artFieldTarget.documentName,
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            await _clipboardCreateFolderIfMissing(destination);
            const uploadPath = await _clipboardUploadBlob(imageInput.fallbackBlob, destination);
            fieldValue = _clipboardCreateFreshMediaPath(uploadPath);
            return _clipboardPopulateArtFieldTarget(artFieldTarget, fieldValue, imageInput);
          }
          mediaKind = _clipboardGetMediaKind({ src: imageInput.url }) || mediaKind;
          if (mediaKind && !artFieldTarget.mediaKinds.includes(mediaKind)) {
            throw _clipboardAnnotateWorkflowError(
              new Error(`The focused ${artFieldTarget.fieldName} field does not support pasted ${mediaKind} media.`),
              {
                clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ imageInput })
              }
            );
          }
          fieldValue = imageInput.url;
          _clipboardLog("warn", "Falling back to the original direct media URL for a focused art field after download failed", {
            fieldName: artFieldTarget.fieldName,
            documentName: artFieldTarget.documentName,
            imageInput: _clipboardDescribeImageInput(imageInput),
            error: _clipboardSerializeError(error)
          });
        }
        try {
          return await _clipboardPopulateArtFieldTarget(artFieldTarget, fieldValue, imageInput);
        } catch (error) {
          throw _clipboardAnnotateWorkflowError(error, {
            clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({ imageInput })
          });
        }
      }
      module.exports = {
        _clipboardHandleArtFieldImageInput
      };
    }
  });

  // src/workflows.js
  var require_workflows = __commonJS({
    "src/workflows.js"(exports, module) {
      module.exports = {
        ...require_workflow_runner(),
        ...require_token_modes(),
        ...require_canvas_media(),
        ...require_chat_media(),
        ...require_art_fields(),
        ...require_text_workflows(),
        ...require_scene_tools()
      };
    }
  });

  // src/ui/chat.js
  var require_chat2 = __commonJS({
    "src/ui/chat.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
        CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE
      } = require_constants();
      var { CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS } = require_state();
      var {
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardExtractImageBlobFromDataTransfer,
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardInsertTextAtTarget
      } = require_clipboard();
      var {
        _clipboardCanUseChatMedia,
        _clipboardCanUseChatUploadButton
      } = require_settings();
      var {
        _clipboardExecutePasteWorkflow,
        _clipboardHandleChatImageInput,
        _clipboardHandleChatUploadAction
      } = require_workflows();
      function _clipboardToggleChatDropTarget(root, active) {
        root.classList.toggle("foundry-paste-eater-chat-drop-target", active);
      }
      function _clipboardGetChatOwnerDocument(root) {
        return root?.ownerDocument || document;
      }
      function _clipboardGetChatControls(root, ownerDocument = _clipboardGetChatOwnerDocument(root)) {
        if (root?.id === "chat-controls") return root;
        return root?.querySelector?.("#chat-controls") || root?.closest?.("#chat-controls") || ownerDocument.getElementById?.("chat-controls") || null;
      }
      function _clipboardGetChatRoots(element) {
        if (!(element instanceof HTMLElement)) return [];
        const ownerDocument = _clipboardGetChatOwnerDocument(element);
        const roots = /* @__PURE__ */ new Set([element]);
        const form = element.matches("form") ? element : element.querySelector("form") || element.closest("form");
        const chatControls = _clipboardGetChatControls(element, ownerDocument);
        const chatMessage = ownerDocument.getElementById?.("chat-message");
        const messageModes = ownerDocument.getElementById?.("message-modes");
        if (form instanceof HTMLElement) roots.add(form);
        if (chatControls instanceof HTMLElement) roots.add(chatControls);
        if (chatMessage instanceof HTMLElement) roots.add(chatMessage);
        if (messageModes instanceof HTMLElement) roots.add(messageModes);
        return Array.from(roots);
      }
      function _clipboardOnChatDragOver(event) {
        if (!_clipboardCanUseChatMedia()) return;
        const root = event.currentTarget;
        const blob = _clipboardExtractImageBlobFromDataTransfer(event.dataTransfer);
        if (!blob) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        _clipboardToggleChatDropTarget(root, true);
      }
      function _clipboardOnChatDragLeave(event) {
        const root = event.currentTarget;
        if (root.contains(event.relatedTarget)) return;
        _clipboardToggleChatDropTarget(root, false);
      }
      function _clipboardOnChatDrop(event) {
        if (!_clipboardCanUseChatMedia()) return;
        const root = event.currentTarget;
        _clipboardToggleChatDropTarget(root, false);
        const mediaInput = _clipboardExtractImageInputFromDataTransfer(event.dataTransfer);
        if (!mediaInput) return;
        _clipboardLog("info", "Handling dropped media in chat.", {
          imageInput: _clipboardDescribeImageInput(mediaInput),
          dataTransfer: _clipboardDescribeDataTransfer(event.dataTransfer)
        });
        event.preventDefault();
        event.stopPropagation();
        void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInput(mediaInput), {
          respectCopiedObjects: false
        });
      }
      function _clipboardSyncChatUploadButton(root) {
        const ownerDocument = _clipboardGetChatOwnerDocument(root);
        const chatControls = _clipboardGetChatControls(root, ownerDocument);
        const form = root.matches("form") ? root : root.querySelector("form") || root.closest("form");
        const mountRoot = chatControls || form || root;
        const existingButtons = Array.from(mountRoot?.querySelectorAll?.(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`) || []);
        if (!_clipboardCanUseChatUploadButton()) {
          for (const button2 of ownerDocument.querySelectorAll(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`)) {
            button2.remove();
          }
          const temporaryContainers = Array.from(ownerDocument.querySelectorAll(".foundry-paste-eater-chat-buttons"));
          for (const container of temporaryContainers) {
            if (!container.childElementCount) container.remove();
          }
          return;
        }
        if (existingButtons.length) return;
        let mount = mountRoot;
        if (chatControls) {
          mount = chatControls.querySelector(".foundry-paste-eater-chat-buttons, .control-buttons:not([hidden])");
          if (!mount) {
            mount = ownerDocument.createElement("div");
            mount.className = "control-buttons foundry-paste-eater-chat-buttons";
            chatControls.append(mount);
          }
        }
        const button = ownerDocument.createElement("button");
        button.type = "button";
        button.className = "ui-control icon fa-solid fa-file-image foundry-paste-eater-chat-upload";
        button.dataset.action = CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION;
        button.dataset.tooltip = "";
        button.title = "Upload Chat Media";
        button.ariaLabel = "Upload Chat Media";
        button.addEventListener("click", () => _clipboardHandleChatUploadAction());
        mount.append(button);
      }
      function _clipboardAttachChatUploadButton(root) {
        _clipboardSyncChatUploadButton(root);
      }
      function _clipboardBindChatRoot(root) {
        if (!root) return;
        require_paste_events()._clipboardBindEventDocument(_clipboardGetChatOwnerDocument(root));
        _clipboardSyncChatUploadButton(root);
        if (CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.has(root)) return;
        root.setAttribute(CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
        root.addEventListener("dragover", _clipboardOnChatDragOver);
        root.addEventListener("dragleave", _clipboardOnChatDragLeave);
        root.addEventListener("drop", _clipboardOnChatDrop);
        CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.add(root);
      }
      function _clipboardOnRenderChatInput(_app, elements) {
        for (const element of Object.values(elements || {})) {
          for (const root of _clipboardGetChatRoots(element)) {
            _clipboardBindChatRoot(root);
          }
        }
      }
      async function _clipboardHandleChatImageInputWithTextFallback(imageInput, target) {
        try {
          return await _clipboardHandleChatImageInput(imageInput);
        } catch (error) {
          if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) {
            _clipboardLog("info", "Inserted the original URL into chat after media handling failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            return false;
          }
          throw error;
        }
      }
      module.exports = {
        _clipboardToggleChatDropTarget,
        _clipboardOnChatDragOver,
        _clipboardOnChatDragLeave,
        _clipboardOnChatDrop,
        _clipboardAttachChatUploadButton,
        _clipboardBindChatRoot,
        _clipboardOnRenderChatInput,
        _clipboardHandleChatImageInputWithTextFallback
      };
    }
  });

  // src/ui/paste-events.js
  var require_paste_events = __commonJS({
    "src/ui/paste-events.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS,
        _clipboardSetHiddenMode
      } = require_state();
      var {
        _clipboardDescribeDataTransfer,
        _clipboardDescribePasteContext,
        _clipboardLog
      } = require_diagnostics();
      var {
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardExtractTextInputFromDataTransfer,
        _clipboardGetChatRootFromTarget,
        _clipboardIsEditableTarget
      } = require_clipboard();
      var { _clipboardGetFocusedArtFieldTarget } = require_field_targets();
      var { _clipboardResolvePasteContext, _clipboardCanPasteToContext } = require_context();
      var {
        _clipboardCanUseChatMedia
      } = require_settings();
      var {
        _clipboardHandleImageInputWithTextFallback,
        _clipboardHandleArtFieldImageInput,
        _clipboardHandleTextInput,
        _clipboardHasPasteConflict,
        _clipboardExecutePasteWorkflow
      } = require_workflows();
      var { _clipboardHandleChatImageInputWithTextFallback } = require_chat2();
      function _clipboardConsumePasteEvent(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      function _clipboardCanHandleCanvasPasteContext(context, rejectionMessage) {
        if (_clipboardCanPasteToContext(context)) return true;
        _clipboardLog("info", rejectionMessage, {
          context: _clipboardDescribePasteContext(context)
        });
        return false;
      }
      function _clipboardGetGameRoot() {
        return document.querySelector(".game");
      }
      function _clipboardFocusGameRoot() {
        const root = _clipboardGetGameRoot();
        if (!root) return false;
        if (!root.hasAttribute("tabindex")) {
          root.tabIndex = 0;
        }
        document.activeElement?.blur?.();
        root.focus({ preventScroll: true });
        return document.activeElement === root;
      }
      function _clipboardShouldRestoreGameFocus(target) {
        if (!(target instanceof HTMLElement)) return false;
        if (_clipboardGetChatRootFromTarget(target)) return false;
        if (_clipboardIsEditableTarget(target)) return false;
        if (_clipboardGetFocusedArtFieldTarget(target)) return false;
        return Boolean(target.closest("#board, #scene-controls"));
      }
      function _clipboardOnMouseDown(event) {
        if (!_clipboardShouldRestoreGameFocus(event.target)) return;
        _clipboardFocusGameRoot();
      }
      function _clipboardBindEventDocument(eventDocument = document) {
        if (!eventDocument?.addEventListener) return;
        if (CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS.has(eventDocument)) return;
        eventDocument.addEventListener("keydown", _clipboardOnKeydown);
        eventDocument.addEventListener("mousedown", _clipboardOnMouseDown, true);
        eventDocument.addEventListener("paste", _clipboardOnPaste);
        CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS.add(eventDocument);
      }
      function _clipboardResolveNativePasteRoute({
        hasMediaInput = false,
        hasTextInput = false,
        hasArtFieldTarget = false,
        isChatTarget = false,
        isEditableTarget = false,
        canUseChatMedia = _clipboardCanUseChatMedia(),
        canvasContextEligible = false
      } = {}) {
        if (hasMediaInput) {
          if (hasArtFieldTarget) return { route: "art-field-media" };
          if (isChatTarget) {
            return { route: canUseChatMedia ? "chat-media" : "ignore-chat-media-disabled" };
          }
          if (isEditableTarget) return { route: "ignore-editable-media" };
          return { route: canvasContextEligible ? "canvas-media" : "ignore-media-ineligible" };
        }
        if (hasTextInput) {
          if (isChatTarget) return { route: "ignore-chat-text" };
          if (isEditableTarget) return { route: "ignore-editable-text" };
          return { route: canvasContextEligible ? "canvas-text" : "ignore-text-ineligible" };
        }
        return { route: "ignore-empty" };
      }
      function _clipboardOnPaste(event) {
        if (event.defaultPrevented) return;
        _clipboardLog("debug", "Received paste event.", {
          targetTagName: event.target?.tagName || null,
          isChatTarget: Boolean(_clipboardGetChatRootFromTarget(event.target)),
          isEditableTarget: _clipboardIsEditableTarget(event.target),
          dataTransfer: _clipboardDescribeDataTransfer(event.clipboardData)
        });
        const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
        const context = _clipboardResolvePasteContext();
        const isChatTarget = Boolean(_clipboardGetChatRootFromTarget(event.target));
        const isEditableTarget = _clipboardIsEditableTarget(event.target);
        if (imageInput) {
          const artFieldTarget = _clipboardGetFocusedArtFieldTarget(event.target);
          const route2 = _clipboardResolveNativePasteRoute({
            hasMediaInput: true,
            hasArtFieldTarget: Boolean(artFieldTarget),
            isChatTarget,
            isEditableTarget,
            canUseChatMedia: _clipboardCanUseChatMedia(),
            canvasContextEligible: _clipboardCanPasteToContext(context)
          });
          if (route2.route === "art-field-media") {
            if (_clipboardHasPasteConflict({ respectCopiedObjects: false })) return;
            _clipboardConsumePasteEvent(event);
            void _clipboardExecutePasteWorkflow(() => _clipboardHandleArtFieldImageInput(imageInput, artFieldTarget), {
              respectCopiedObjects: false
            });
            return;
          }
          if (route2.route === "chat-media") {
            if (_clipboardHasPasteConflict({ respectCopiedObjects: false })) return;
            _clipboardConsumePasteEvent(event);
            void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
              respectCopiedObjects: false
            });
            return;
          }
          if (route2.route === "ignore-chat-media-disabled") return;
          if (route2.route === "ignore-editable-media") {
            _clipboardLog("info", "Ignoring pasted media in an unsupported editable target.", {
              targetTagName: event.target?.tagName || null,
              targetName: event.target?.name || event.target?.dataset?.edit || null
            });
            return;
          }
          if (route2.route === "ignore-media-ineligible") {
            if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted media because the canvas context is not eligible.")) return;
          }
          if (_clipboardHasPasteConflict()) return;
          _clipboardConsumePasteEvent(event);
          void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInputWithTextFallback(imageInput, { context }), {
            respectCopiedObjects: false
          });
          return;
        }
        const textInput = _clipboardExtractTextInputFromDataTransfer(event.clipboardData);
        if (!textInput) return;
        const route = _clipboardResolveNativePasteRoute({
          hasTextInput: true,
          isChatTarget,
          isEditableTarget,
          canvasContextEligible: _clipboardCanPasteToContext(context)
        });
        if (route.route === "ignore-chat-text" || route.route === "ignore-editable-text") return;
        if (route.route === "ignore-text-ineligible") {
          if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted text because the canvas context is not eligible.")) return;
        }
        if (_clipboardHasPasteConflict()) return;
        _clipboardConsumePasteEvent(event);
        void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput, { context }), {
          respectCopiedObjects: false
        });
      }
      function _clipboardOnKeydown(event) {
        const hiddenMode = (event.ctrlKey || event.metaKey) && event.getModifierState("CapsLock");
        if (hiddenMode !== require_state()._clipboardGetHiddenMode()) {
          _clipboardLog("debug", "Updated hidden paste mode.", {
            hiddenMode,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            code: event.code
          });
        }
        _clipboardSetHiddenMode(hiddenMode);
      }
      module.exports = {
        _clipboardConsumePasteEvent,
        _clipboardCanHandleCanvasPasteContext,
        _clipboardGetGameRoot,
        _clipboardFocusGameRoot,
        _clipboardShouldRestoreGameFocus,
        _clipboardBindEventDocument,
        _clipboardOnMouseDown,
        _clipboardResolveNativePasteRoute,
        _clipboardOnPaste,
        _clipboardOnKeydown
      };
    }
  });

  // src/ui/scene-controls.js
  var require_scene_controls = __commonJS({
    "src/ui/scene-controls.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_SCENE_CONTROLS,
        CLIPBOARD_IMAGE_TOOL_PASTE,
        CLIPBOARD_IMAGE_TOOL_UPLOAD,
        CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER
      } = require_constants();
      var { _clipboardExtractImageInput, _clipboardExtractImageInputFromDataTransfer, _clipboardReadClipboardItems } = require_clipboard();
      var { _clipboardLog } = require_diagnostics();
      var {
        _clipboardCanUseScenePasteTool,
        _clipboardCanUseSceneUploadTool,
        _clipboardGetScenePastePromptMode
      } = require_settings();
      var {
        _clipboardExecutePasteWorkflow,
        _clipboardHandleImageInput,
        _clipboardHandleScenePasteAction,
        _clipboardHandleSceneUploadAction
      } = require_workflows();
      var { _clipboardConsumePasteEvent } = require_paste_events();
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID = "foundry-paste-eater-scene-paste-prompt";
      var CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID = "foundry-paste-eater-scene-paste-target";
      function _clipboardUpsertSceneControlTool(control, toolName, toolData) {
        if (Array.isArray(control?.tools)) {
          const existingIndex = control.tools.findIndex((entry) => entry?.name === toolName);
          if (existingIndex >= 0) {
            control.tools[existingIndex] = {
              ...control.tools[existingIndex],
              ...toolData
            };
            return;
          }
          control.tools.push(toolData);
          return;
        }
        if (control?.tools) {
          control.tools[toolName] = toolData;
        }
      }
      function _clipboardAddSceneControlButtons(controls) {
        for (const controlName of CLIPBOARD_IMAGE_SCENE_CONTROLS) {
          const control = controls[controlName];
          if (!control?.tools) continue;
          const order = Array.isArray(control.tools) ? control.tools.length : Object.keys(control.tools).length;
          const onPasteClick = () => _clipboardHandleScenePasteToolClick();
          const onUploadClick = () => _clipboardHandleSceneUploadAction();
          _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_PASTE, {
            name: CLIPBOARD_IMAGE_TOOL_PASTE,
            title: "Paste Media",
            icon: "fa-solid fa-paste",
            order,
            button: true,
            visible: _clipboardCanUseScenePasteTool(),
            onClick: onPasteClick,
            onChange: onPasteClick
          });
          _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_UPLOAD, {
            name: CLIPBOARD_IMAGE_TOOL_UPLOAD,
            title: "Upload Media",
            icon: "fa-solid fa-file-image",
            order: order + 1,
            button: true,
            visible: _clipboardCanUseSceneUploadTool(),
            onClick: onUploadClick,
            onChange: onUploadClick
          });
        }
      }
      function _clipboardGetScenePastePrompt() {
        return document.getElementById(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID);
      }
      function _clipboardScenePastePromptIsOpen(prompt = _clipboardGetScenePastePrompt()) {
        return Boolean(prompt?.isConnected);
      }
      function _clipboardSetScenePastePromptMessage(prompt, message) {
        const messageElement = prompt?.querySelector?.("[data-role='message']");
        if (messageElement) {
          messageElement.textContent = message;
        }
      }
      function _clipboardCloseScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
        prompt?.remove?.();
      }
      function _clipboardFocusScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
        const target = prompt?.querySelector?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
        if (!target) return;
        target.focus({ preventScroll: true });
        target.select?.();
      }
      function _clipboardGetScenePastePromptFallbackMessage(clipItems) {
        if (clipItems?.length && clipItems.every((item) => !item?.types?.length)) {
          return "This clipboard content is not exposed to direct clipboard reads here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
        }
        return "Direct clipboard read did not return usable media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
      }
      async function _clipboardOnScenePastePromptPaste(event) {
        const prompt = event.currentTarget?.closest?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID}`);
        const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
        if (!imageInput) {
          ui.notifications.warn("Foundry Paste Eater: No supported media was found in that paste.");
          _clipboardSetScenePastePromptMessage(prompt, "No supported media was found in that paste. Try again, or use Upload Media.");
          return;
        }
        _clipboardConsumePasteEvent(event);
        const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
        if (handled) {
          _clipboardCloseScenePastePrompt(prompt);
          return;
        }
        _clipboardSetScenePastePromptMessage(prompt, "Paste did not create media. Try again, or use Upload Media.");
        _clipboardFocusScenePastePrompt(prompt);
      }
      function _clipboardOpenScenePastePrompt() {
        const existingPrompt = _clipboardGetScenePastePrompt();
        if (existingPrompt) {
          _clipboardFocusScenePastePrompt(existingPrompt);
          return existingPrompt;
        }
        const prompt = document.createElement("div");
        prompt.id = CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID;
        prompt.className = "foundry-paste-eater-scene-paste-prompt";
        prompt.innerHTML = `
    <div class="foundry-paste-eater-scene-paste-panel" role="dialog" aria-modal="true" aria-labelledby="foundry-paste-eater-scene-paste-title">
      <h2 id="foundry-paste-eater-scene-paste-title">Paste Media</h2>
      <p data-role="message">Trying direct clipboard read. If nothing happens, press Cmd+V / Ctrl+V in the field below.</p>
      <textarea
        id="${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}"
        class="foundry-paste-eater-scene-paste-target"
        rows="4"
        placeholder="Press Cmd+V / Ctrl+V here if direct clipboard read does not complete."
      ></textarea>
      <div class="foundry-paste-eater-scene-paste-actions">
        ${_clipboardCanUseSceneUploadTool() ? '<button type="button" data-action="upload">Upload Media</button>' : ""}
        <button type="button" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;
        const target = prompt.querySelector(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
        const uploadButton = prompt.querySelector('[data-action="upload"]');
        const cancelButton = prompt.querySelector('[data-action="cancel"]');
        target?.addEventListener("paste", _clipboardOnScenePastePromptPaste, { capture: true });
        uploadButton?.addEventListener("click", () => {
          _clipboardCloseScenePastePrompt(prompt);
          _clipboardHandleSceneUploadAction();
        });
        cancelButton?.addEventListener("click", () => _clipboardCloseScenePastePrompt(prompt));
        prompt.addEventListener("click", (event) => {
          if (event.target === prompt) _clipboardCloseScenePastePrompt(prompt);
        });
        document.body.append(prompt);
        _clipboardFocusScenePastePrompt(prompt);
        _clipboardLog("info", "Opened scene paste prompt fallback.");
        return prompt;
      }
      function _clipboardResolveScenePasteToolPlan({
        canUseScenePasteTool = _clipboardCanUseScenePasteTool(),
        promptMode = _clipboardGetScenePastePromptMode()
      } = {}) {
        if (!canUseScenePasteTool) {
          return {
            action: "disabled",
            openPrompt: false,
            tryDirectReadInPrompt: false,
            useDirectSceneAction: false
          };
        }
        if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
          return {
            action: "direct-read-only",
            openPrompt: false,
            tryDirectReadInPrompt: false,
            useDirectSceneAction: true
          };
        }
        if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS) {
          return {
            action: "prompt-only",
            openPrompt: true,
            tryDirectReadInPrompt: false,
            useDirectSceneAction: false
          };
        }
        return {
          action: "prompt-then-direct-read",
          openPrompt: true,
          tryDirectReadInPrompt: true,
          useDirectSceneAction: false
        };
      }
      async function _clipboardTryScenePastePromptDirectRead(prompt) {
        if (!navigator.clipboard?.read) {
          _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard reads are unavailable here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
          return false;
        }
        const clipItems = await _clipboardReadClipboardItems();
        if (!_clipboardScenePastePromptIsOpen(prompt)) return false;
        if (!clipItems?.length) {
          _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
          _clipboardFocusScenePastePrompt(prompt);
          return false;
        }
        const imageInput = await _clipboardExtractImageInput(clipItems);
        if (!_clipboardScenePastePromptIsOpen(prompt)) return false;
        if (!imageInput) {
          _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
          _clipboardFocusScenePastePrompt(prompt);
          return false;
        }
        const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
        if (handled) {
          _clipboardCloseScenePastePrompt(prompt);
          return true;
        }
        if (_clipboardScenePastePromptIsOpen(prompt)) {
          _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard read did not create media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
          _clipboardFocusScenePastePrompt(prompt);
        }
        return false;
      }
      function _clipboardHandleScenePasteToolClick() {
        const plan = _clipboardResolveScenePasteToolPlan();
        if (plan.action === "disabled") return false;
        if (plan.useDirectSceneAction) {
          return _clipboardHandleScenePasteAction();
        }
        const prompt = _clipboardOpenScenePastePrompt();
        if (plan.tryDirectReadInPrompt) {
          void _clipboardTryScenePastePromptDirectRead(prompt);
        }
        return true;
      }
      module.exports = {
        _clipboardAddSceneControlButtons,
        _clipboardGetScenePastePrompt,
        _clipboardScenePastePromptIsOpen,
        _clipboardSetScenePastePromptMessage,
        _clipboardCloseScenePastePrompt,
        _clipboardFocusScenePastePrompt,
        _clipboardGetScenePastePromptFallbackMessage,
        _clipboardUpsertSceneControlTool,
        _clipboardOnScenePastePromptPaste,
        _clipboardOpenScenePastePrompt,
        _clipboardTryScenePastePromptDirectRead,
        _clipboardResolveScenePasteToolPlan,
        _clipboardHandleScenePasteToolClick
      };
    }
  });

  // src/ui.js
  var require_ui = __commonJS({
    "src/ui.js"(exports, module) {
      module.exports = {
        ...require_scene_controls(),
        ...require_chat2(),
        ...require_paste_events()
      };
    }
  });

  // src/index.js
  var require_index = __commonJS({
    "src/index.js"(exports, module) {
      var constants = require_constants();
      var diagnostics = require_diagnostics();
      var storage = require_storage();
      var media = require_media();
      var text = require_text();
      var context = require_context();
      var clipboard = require_clipboard();
      var fieldTargets = require_field_targets();
      var notes = require_notes();
      var chat = require_chat();
      var workflows = require_workflows();
      var uiHandlers = require_ui();
      var { FoundryPasteEaterDestinationConfig } = require_config_app();
      var settings = require_settings();
      var support = require_support();
      var state = require_state();
      uiHandlers._clipboardBindEventDocument(document);
      Hooks.once("init", function() {
        settings._clipboardRegisterSettings();
        Hooks.on("getSceneControlButtons", uiHandlers._clipboardAddSceneControlButtons);
        Hooks.on("renderChatInput", uiHandlers._clipboardOnRenderChatInput);
        diagnostics._clipboardLog("info", "Initializing foundry-paste-eater module.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          sceneControls: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS
        });
      });
      Hooks.once("ready", async function() {
        await settings._clipboardMigrateLegacySettings();
        diagnostics._clipboardRegisterErrorReporting();
        support._clipboardRegisterRuntimeApi();
        diagnostics._clipboardLog("info", "foundry-paste-eater module is ready.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          verboseLogging: diagnostics._clipboardVerboseLoggingEnabled()
        });
        if (game.user.isGM && !navigator.clipboard?.read) {
          ui.notifications.info("Foundry Paste Eater: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled.");
          diagnostics._clipboardLog("info", "Direct clipboard reads are unavailable; paste-event and upload fallbacks remain available where enabled.");
        }
      });
      module.exports = {
        FoundryPasteEaterDestinationConfig,
        __testables: {
          ...diagnostics,
          ...storage,
          ...media,
          ...text,
          ...context,
          ...clipboard,
          ...fieldTargets,
          ...notes,
          ...chat,
          ...workflows,
          ...uiHandlers,
          ...settings,
          ...support,
          ...state,
          constants: {
            CLIPBOARD_IMAGE_MODULE_ID: constants.CLIPBOARD_IMAGE_MODULE_ID,
            CLIPBOARD_IMAGE_DEFAULT_FOLDER: constants.CLIPBOARD_IMAGE_DEFAULT_FOLDER,
            CLIPBOARD_IMAGE_SOURCE_AUTO: constants.CLIPBOARD_IMAGE_SOURCE_AUTO,
            CLIPBOARD_IMAGE_SOURCE_DATA: constants.CLIPBOARD_IMAGE_SOURCE_DATA,
            CLIPBOARD_IMAGE_SOURCE_S3: constants.CLIPBOARD_IMAGE_SOURCE_S3,
            CLIPBOARD_IMAGE_SOURCE_FORGE: constants.CLIPBOARD_IMAGE_SOURCE_FORGE,
            CLIPBOARD_IMAGE_SCENE_CONTROLS: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS,
            CLIPBOARD_IMAGE_TOOL_PASTE: constants.CLIPBOARD_IMAGE_TOOL_PASTE,
            CLIPBOARD_IMAGE_TOOL_UPLOAD: constants.CLIPBOARD_IMAGE_TOOL_UPLOAD,
            CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE: constants.CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE,
            CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION: constants.CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
            CLIPBOARD_IMAGE_TEXT_NOTE_FLAG: constants.CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
            CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME: constants.CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
            CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX: constants.CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
            CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING: constants.CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
            CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING: constants.CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
            CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
            CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
            CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
            CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
            CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING: constants.CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
            CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING: constants.CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
            CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING: constants.CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SETTING,
            CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING: constants.CLIPBOARD_IMAGE_LOCK_PASTED_TOKEN_ROTATION_SETTING,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
            CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING: constants.CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SETTING,
            CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING: constants.CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
            CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING: constants.CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
            CLIPBOARD_IMAGE_ROLE_PLAYER: constants.CLIPBOARD_IMAGE_ROLE_PLAYER,
            CLIPBOARD_IMAGE_ROLE_TRUSTED: constants.CLIPBOARD_IMAGE_ROLE_TRUSTED,
            CLIPBOARD_IMAGE_ROLE_ASSISTANT: constants.CLIPBOARD_IMAGE_ROLE_ASSISTANT,
            CLIPBOARD_IMAGE_ROLE_GAMEMASTER: constants.CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
            CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK: constants.CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_ASK,
            CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT: constants.CLIPBOARD_IMAGE_PASTED_TOKEN_ACTOR_TYPE_SYSTEM_DEFAULT,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
            CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY: constants.CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
            CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART: constants.CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_ACTOR_ART,
            CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT: constants.CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_PROMPT,
            CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT: constants.CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT,
            CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH: constants.CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH,
            CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS: constants.CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
            CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT: constants.CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
            CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART: constants.CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
            CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT: constants.CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
            CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS: constants.CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
          }
        }
      };
    }
  });
  return require_index();
})();
if (typeof module !== 'undefined' && module.exports) module.exports = FoundryPasteEaterRuntime;
