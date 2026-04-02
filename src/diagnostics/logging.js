const legacy = require("./legacy");

module.exports = {
  _clipboardVerboseLoggingEnabled: legacy._clipboardVerboseLoggingEnabled,
  _clipboardSerializeError: legacy._clipboardSerializeError,
  _clipboardGetLogHistory: legacy._clipboardGetLogHistory,
  _clipboardLog: legacy._clipboardLog,
};
