const legacy = require("./legacy-foundry");

module.exports = {
  closeOwnedContext: legacy.closeOwnedContext,
  ensureFoundryUsers: legacy.ensureFoundryUsers,
  ensureUploadDirectory: legacy.ensureUploadDirectory,
  restoreCorePermissions: legacy.restoreCorePermissions,
  setCorePermissions: legacy.setCorePermissions,
};
