const legacy = require("./legacy-foundry");

module.exports = {
  buildSharedFoundryTest: legacy.buildSharedFoundryTest,
  createAuthenticatedPage: legacy.createAuthenticatedPage,
  loginToFoundry: legacy.loginToFoundry,
  resolveFoundryCredentials: legacy.resolveFoundryCredentials,
  resetFoundrySessions: legacy.resetFoundrySessions,
};
