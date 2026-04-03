const {CLIPBOARD_IMAGE_MODULE_ID} = require("../constants");
const {_clipboardGetReadinessReport} = require("./readiness");
const {_clipboardCollectSupportBundle} = require("./bundle");
const {_clipboardCollectMediaAuditReport} = require("./media-audit");

function _clipboardCreateRuntimeApi() {
  return Object.freeze({
    getReadinessReport: () => _clipboardGetReadinessReport(),
    collectSupportBundle: () => _clipboardCollectSupportBundle(),
    collectMediaAuditReport: () => _clipboardCollectMediaAuditReport(),
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
  _clipboardRegisterRuntimeApi,
};
