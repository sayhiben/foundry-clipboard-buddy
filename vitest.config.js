const {defineConfig} = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/unit/**/*.spec.js"],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      all: false,
      include: ["src/**/*.js"],
      exclude: ["foundry-paste-eater.js", "coverage/**", "dist/**", "playwright.config.js", "test/**", "scripts/**"],
      reporter: ["text", "json", "json-summary", "html"],
    },
  },
});
