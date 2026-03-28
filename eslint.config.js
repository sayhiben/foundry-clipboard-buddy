const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["clipboard-image.js", "playwright.config.js", "vitest.config.js", "eslint.config.js", "scripts/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        canvas: "readonly",
        CONFIG: "readonly",
        CONST: "readonly",
        ForgeVTT: "readonly",
        foundry: "readonly",
        game: "readonly",
        Hooks: "readonly",
        PIXI: "readonly",
        ui: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        caughtErrors: "none",
      }],
    },
  },
  {
    files: ["test/unit/**/*.js"],
    languageOptions: {
      sourceType: "module",
    },
  },
];
