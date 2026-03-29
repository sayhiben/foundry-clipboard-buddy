const constants = require("./constants");
const diagnostics = require("./diagnostics");
const storage = require("./storage");
const media = require("./media");
const text = require("./text");
const context = require("./context");
const clipboard = require("./clipboard");
const notes = require("./notes");
const chat = require("./chat");
const workflows = require("./workflows");
const uiHandlers = require("./ui");
const {ClipboardImageDestinationConfig} = require("./config-app");
const {_clipboardRegisterSettings} = require("./settings");
const state = require("./state");

document.addEventListener("keydown", uiHandlers._clipboardOnKeydown);
document.addEventListener("paste", uiHandlers._clipboardOnPaste);

Hooks.once("init", function() {
  _clipboardRegisterSettings();
  Hooks.on("getSceneControlButtons", uiHandlers._clipboardAddSceneControlButtons);
  Hooks.on("renderChatInput", uiHandlers._clipboardOnRenderChatInput);
  diagnostics._clipboardLog("info", "Initializing clipboard-image module.", {
    clipboardReadAvailable: Boolean(navigator.clipboard?.read),
    sceneControls: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS,
  });
});

Hooks.once("ready", function() {
  diagnostics._clipboardLog("info", "clipboard-image module is ready.", {
    clipboardReadAvailable: Boolean(navigator.clipboard?.read),
    verboseLogging: diagnostics._clipboardVerboseLoggingEnabled(),
  });
  if (game.user.isGM && !navigator.clipboard?.read) {
    ui.notifications.info("Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and Upload Media scene controls are still available.");
    diagnostics._clipboardLog("info", "Direct clipboard reads are unavailable; paste-event and upload fallbacks remain available.");
  }
});

module.exports = {
  ClipboardImageDestinationConfig,
  __testables: {
    ...diagnostics,
    ...storage,
    ...media,
    ...text,
    ...context,
    ...clipboard,
    ...notes,
    ...chat,
    ...workflows,
    ...uiHandlers,
    _clipboardRegisterSettings,
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
      CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT: constants.CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
      CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS: constants.CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
    },
  },
};
