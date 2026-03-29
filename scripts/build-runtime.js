const path = require("node:path");
const esbuild = require("esbuild");

async function buildRuntime() {
  const rootDir = path.resolve(__dirname, "..");
  await esbuild.build({
    entryPoints: [path.join(rootDir, "src", "index.js")],
    bundle: true,
    format: "iife",
    globalName: "FoundryPasteEaterRuntime",
    outfile: path.join(rootDir, "foundry-paste-eater.js"),
    platform: "browser",
    target: ["es2022"],
    logLevel: "silent",
    banner: {
      js: "// Generated from src/. Do not edit foundry-paste-eater.js directly.\n",
    },
    footer: {
      js: "if (typeof module !== 'undefined' && module.exports) module.exports = FoundryPasteEaterRuntime;",
    },
  });
}

buildRuntime().catch(error => {
  console.error(error);
  process.exit(1);
});
