const legacy = require("./legacy");

module.exports = {
  _clipboardBuildErrorReport: legacy._clipboardBuildErrorReport,
  _clipboardFormatErrorReport: legacy._clipboardFormatErrorReport,
  _clipboardCreateReportFile: legacy._clipboardCreateReportFile,
  _clipboardDownloadReportFile: legacy._clipboardDownloadReportFile,
  _clipboardOpenGmErrorDialog: legacy._clipboardOpenGmErrorDialog,
  _clipboardEmitErrorReport: legacy._clipboardEmitErrorReport,
  _clipboardHandleSocketReport: legacy._clipboardHandleSocketReport,
  _clipboardRegisterErrorReporting: legacy._clipboardRegisterErrorReporting,
  _clipboardReportError: legacy._clipboardReportError,
};
