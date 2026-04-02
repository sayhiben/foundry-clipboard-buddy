module.exports = {
  ...require("./settings/schema"),
  ...require("./settings/recommended-defaults"),
  ...require("./settings/policy"),
  ...require("./settings/migrations"),
  ...require("./settings/register"),
};
