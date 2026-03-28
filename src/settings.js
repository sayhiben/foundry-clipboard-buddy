const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_AUTO,
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
} = require("./constants");
const {ClipboardImageDestinationConfig} = require("./config-app");

function _clipboardRegisterSettings() {
  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
    name: "Upload destination",
    label: "Configure",
    hint: "Choose the file store and folder used for pasted images. Supports User Data, The Forge, and Amazon S3 through Foundry's native file picker.",
    icon: "fa-solid fa-folder-tree",
    type: ClipboardImageDestinationConfig,
    restricted: true,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
    name: "Pasted image location",
    hint: "Folder where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
    name: "Pasted image source",
    hint: "File source where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_SOURCE_AUTO,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
    name: "Pasted image S3 bucket",
    hint: "S3 bucket used when clipboard images are saved to Amazon S3.",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING, {
    name: "Verbose logging",
    hint: "Log detailed clipboard-image diagnostics to the browser console for debugging.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
}

module.exports = {
  _clipboardRegisterSettings,
};
