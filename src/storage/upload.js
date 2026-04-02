const legacy = require("./legacy");

module.exports = {
  _clipboardCreateFolderIfMissing: legacy._clipboardCreateFolderIfMissing,
  _clipboardCreateVersionedFilename: legacy._clipboardCreateVersionedFilename,
  _clipboardCreateUploadFile: legacy._clipboardCreateUploadFile,
  _clipboardCreateFreshMediaPath: legacy._clipboardCreateFreshMediaPath,
  _clipboardUploadBlob: legacy._clipboardUploadBlob,
};
