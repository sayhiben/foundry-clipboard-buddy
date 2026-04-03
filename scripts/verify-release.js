const {execFileSync} = require("node:child_process");

const rootDir = process.cwd();
const foundryUrl = process.env.FOUNDRY_URL ||
  process.env.FOUNDRY_JOIN_URL ||
  process.env.FOUNDRY_BASE_URL ||
  "http://127.0.0.1:30000";

function runNpmScript(scriptName) {
  execFileSync("npm", ["run", scriptName], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
}

async function canReachFoundry(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok || [301, 302, 303, 307, 308].includes(response.status);
  } catch (_error) {
    return false;
  }
}

(async () => {
  runNpmScript("lint");
  runNpmScript("test");
  runNpmScript("typecheck");
  runNpmScript("verify:bundle");
  runNpmScript("copy");

  if (await canReachFoundry(foundryUrl)) {
    runNpmScript("test:smoke");
  } else {
    console.log(`verify:release: skipping smoke tests because no reachable local Foundry runtime was found at ${foundryUrl}.`);
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
