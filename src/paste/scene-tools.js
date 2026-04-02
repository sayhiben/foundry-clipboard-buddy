const legacy = require("./legacy");

module.exports = {
  _clipboardReadAndPasteImage: legacy._clipboardReadAndPasteImage,
  _clipboardReadAndPasteClipboardContent: legacy._clipboardReadAndPasteClipboardContent,
  _clipboardChooseImageFile: legacy._clipboardChooseImageFile,
  _clipboardChooseAndHandleMediaFile: legacy._clipboardChooseAndHandleMediaFile,
  _clipboardOpenUploadPicker: legacy._clipboardOpenUploadPicker,
  _clipboardOpenChatUploadPicker: legacy._clipboardOpenChatUploadPicker,
  _clipboardHandleScenePasteAction: legacy._clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction: legacy._clipboardHandleSceneUploadAction,
};
