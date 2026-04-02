const legacy = require("./legacy-foundry");

module.exports = {
  closeUploadDestinationConfig: legacy.closeUploadDestinationConfig,
  focusChatInput: legacy.focusChatInput,
  getSceneToolState: legacy.getSceneToolState,
  getUploadDestinationSummary: legacy.getUploadDestinationSummary,
  invokeSceneTool: legacy.invokeSceneTool,
  openUploadDestinationConfig: legacy.openUploadDestinationConfig,
  restoreModuleSettings: legacy.restoreModuleSettings,
  setModuleSettings: legacy.setModuleSettings,
};
