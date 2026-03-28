const {defineConfig} = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/unit/**/*.spec.js"],
    restoreMocks: true,
    clearMocks: true,
  },
  coverage: {
    provider: "v8",
    all: false,
    include: ["clipboard-image.js"],
    exclude: ["coverage/**", "dist/**", "playwright.config.js", "test/**"],
    reporter: ["text", "json-summary", "html"],
    thresholds: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});
