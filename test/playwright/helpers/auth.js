const core = require("./core");

module.exports = {
  buildSharedFoundryTest: core.buildSharedFoundryTest,
  createAuthenticatedPage: core.createAuthenticatedPage,
  loginToFoundry: core.loginToFoundry,
  resolveFoundryCredentials: core.resolveFoundryCredentials,
  resetFoundrySessions: core.resetFoundrySessions,
};
