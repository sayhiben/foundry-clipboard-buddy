const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const bundlePath = path.join(rootDir, "foundry-paste-eater.js");

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return nodeCrypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const beforeHash = hashFile(bundlePath);
execFileSync(process.execPath, [path.join(rootDir, "scripts", "build-runtime.js")], {
  cwd: rootDir,
  stdio: "inherit",
});
const afterHash = hashFile(bundlePath);

if (!beforeHash || !afterHash || beforeHash !== afterHash) {
  console.error("verify:bundle failed: foundry-paste-eater.js differs from the committed artifact. Run `npm run build:runtime` and commit the result.");
  process.exit(1);
}

console.log("verify:bundle passed: foundry-paste-eater.js matches the committed artifact.");
