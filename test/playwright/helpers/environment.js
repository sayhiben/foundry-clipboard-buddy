const core = require("./core");

module.exports = {
  closeOwnedContext: core.closeOwnedContext,
  ensureFoundryUsers: core.ensureFoundryUsers,
  ensureUploadDirectory: core.ensureUploadDirectory,
  restoreCorePermissions: core.restoreCorePermissions,
  setCorePermissions: core.setCorePermissions,
};
