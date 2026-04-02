const legacy = require("./legacy");

module.exports = {
  _clipboardApplyPasteResult: legacy._clipboardApplyPasteResult,
  _clipboardPasteBlob: legacy._clipboardPasteBlob,
  _clipboardPasteMediaPath: legacy._clipboardPasteMediaPath,
  _clipboardIsBlockedDirectMediaUrlDownload: legacy._clipboardIsBlockedDirectMediaUrlDownload,
  _clipboardGetBlockedDirectMediaUrlError: legacy._clipboardGetBlockedDirectMediaUrlError,
  _clipboardShouldFallbackToText: legacy._clipboardShouldFallbackToText,
  _clipboardHandleImageBlob: legacy._clipboardHandleImageBlob,
  _clipboardHandleImageInput: legacy._clipboardHandleImageInput,
  _clipboardHandleImageInputWithTextFallback: legacy._clipboardHandleImageInputWithTextFallback,
};
