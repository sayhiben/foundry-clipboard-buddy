const legacy = require("../paste/ui-legacy");

module.exports = {
  _clipboardAddSceneControlButtons: legacy._clipboardAddSceneControlButtons,
  _clipboardGetScenePastePrompt: legacy._clipboardGetScenePastePrompt,
  _clipboardScenePastePromptIsOpen: legacy._clipboardScenePastePromptIsOpen,
  _clipboardSetScenePastePromptMessage: legacy._clipboardSetScenePastePromptMessage,
  _clipboardCloseScenePastePrompt: legacy._clipboardCloseScenePastePrompt,
  _clipboardFocusScenePastePrompt: legacy._clipboardFocusScenePastePrompt,
  _clipboardGetScenePastePromptFallbackMessage: legacy._clipboardGetScenePastePromptFallbackMessage,
  _clipboardUpsertSceneControlTool: legacy._clipboardUpsertSceneControlTool,
  _clipboardOnScenePastePromptPaste: legacy._clipboardOnScenePastePromptPaste,
  _clipboardOpenScenePastePrompt: legacy._clipboardOpenScenePastePrompt,
  _clipboardTryScenePastePromptDirectRead: legacy._clipboardTryScenePastePromptDirectRead,
  _clipboardResolveScenePasteToolPlan: legacy._clipboardResolveScenePasteToolPlan,
  _clipboardHandleScenePasteToolClick: legacy._clipboardHandleScenePasteToolClick,
};
