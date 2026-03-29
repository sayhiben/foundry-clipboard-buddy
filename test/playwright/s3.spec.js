const fs = require("fs");
const path = require("path");
const {execFileSync, spawnSync} = require("child_process");
const {test, expect} = require("@playwright/test");
const {
  beginClipboardRun,
  cleanupClipboardRun,
  dispatchFilePaste,
  focusCanvas,
  getSafeCanvasPoint,
  getStateSnapshot,
  getNewDocuments,
  loginToFoundry,
  restoreClipboardRead,
  setCanvasMousePosition,
} = require("./helpers/foundry");

const S3_BUCKET = process.env.FOUNDRY_S3_BUCKET || "";
const HAS_AWS_CLI = spawnSync("aws", ["--version"], {stdio: "ignore"}).status === 0;
const HAS_DOCKER_CLI = spawnSync("docker", ["ps"], {stdio: "ignore"}).status === 0;
const FOUNDRY_URL = process.env.FOUNDRY_URL || process.env.FOUNDRY_JOIN_URL || process.env.FOUNDRY_BASE_URL || "http://127.0.0.1:30000";
const S3_REFRESH_ENABLED = process.env.FOUNDRY_S3_REFRESH !== "false";
const S3_CONFIG_PATH = process.env.FOUNDRY_S3_AWS_CONFIG_PATH || "";
const FOUNDRY_DOCKER_CONTAINER = process.env.FOUNDRY_DOCKER_CONTAINER || "";
const FOUNDRY_S3_RESTART_COMMAND = process.env.FOUNDRY_S3_RESTART_COMMAND || "";
const FOUNDRY_S3_ENDPOINT = process.env.FOUNDRY_S3_ENDPOINT || "";
const HAS_FOUNDRY_S3_FORCE_PATH_STYLE = Object.hasOwn(process.env, "FOUNDRY_S3_FORCE_PATH_STYLE");
const FOUNDRY_S3_FORCE_PATH_STYLE = HAS_FOUNDRY_S3_FORCE_PATH_STYLE
  ? !/^(false|0|no)$/i.test(process.env.FOUNDRY_S3_FORCE_PATH_STYLE || "")
  : null;

function _clipboardAwsJson(args) {
  const output = execFileSync("aws", args, {
    encoding: "utf8",
    env: {
      ...process.env,
      AWS_PAGER: "",
    },
  }).trim();

  if (!output) return null;
  return JSON.parse(output);
}

function _clipboardWithAwsEndpoint(args) {
  if (!FOUNDRY_S3_ENDPOINT) return args;
  return [...args, "--endpoint-url", FOUNDRY_S3_ENDPOINT];
}

function _clipboardDockerText(args) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    env: process.env,
  }).trim();
}

function _clipboardGetFoundryPort() {
  try {
    const parsed = new URL(FOUNDRY_URL);
    return parsed.port || (parsed.protocol === "https:" ? "443" : "80");
  } catch {
    return "30000";
  }
}

function _clipboardResolveDockerContainerByPort() {
  if (!HAS_DOCKER_CLI) return "";

  const port = _clipboardGetFoundryPort();
  const rows = _clipboardDockerText(["ps", "--format", "{{.Names}}\t{{.Ports}}"])
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const row of rows) {
    const [name, ports = ""] = row.split("\t");
    if (ports.includes(`:${port}->`) || ports.includes(`:::${port}->`)) return name;
  }

  return "";
}

function _clipboardResolveFoundryS3ConfigLocation() {
  if (S3_CONFIG_PATH) {
    return {
      configPath: path.resolve(S3_CONFIG_PATH),
      containerName: FOUNDRY_DOCKER_CONTAINER,
    };
  }

  const containerName = FOUNDRY_DOCKER_CONTAINER || _clipboardResolveDockerContainerByPort();
  if (!containerName) return null;

  const mounts = JSON.parse(_clipboardDockerText(["inspect", containerName, "--format", "{{json .Mounts}}"]) || "[]");
  const dataMount = mounts.find(mount => mount.Type === "bind" && mount.Destination === "/data" && mount.Source);
  if (!dataMount?.Source) return null;

  const optionsPath = path.join(dataMount.Source, "Config", "options.json");
  if (!fs.existsSync(optionsPath)) return null;

  const options = JSON.parse(fs.readFileSync(optionsPath, "utf8"));
  if (!options.awsConfig) return null;

  return {
    configPath: path.isAbsolute(options.awsConfig)
      ? options.awsConfig
      : path.join(dataMount.Source, "Config", options.awsConfig),
    containerName,
  };
}

function _clipboardRefreshAwsCredentialsFile(configPath) {
  const exportedCredentials = _clipboardAwsJson(["configure", "export-credentials", "--format", "process"]);
  const existing = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf8"))
    : {};

  const nextConfig = {
    ...existing,
    region: existing.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2",
    credentials: {
      accessKeyId: exportedCredentials.AccessKeyId,
      secretAccessKey: exportedCredentials.SecretAccessKey,
      sessionToken: exportedCredentials.SessionToken,
    },
  };

  if (S3_BUCKET && !Array.isArray(nextConfig.buckets)) {
    nextConfig.buckets = [S3_BUCKET];
  }

  if (FOUNDRY_S3_ENDPOINT) {
    nextConfig.endpoint = FOUNDRY_S3_ENDPOINT;
  }

  if (HAS_FOUNDRY_S3_FORCE_PATH_STYLE) {
    nextConfig.forcePathStyle = FOUNDRY_S3_FORCE_PATH_STYLE;
  }

  fs.writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
  return {
    configPath,
    accessKeyId: exportedCredentials.AccessKeyId,
    expiration: exportedCredentials.Expiration || null,
    endpoint: nextConfig.endpoint || null,
    forcePathStyle: typeof nextConfig.forcePathStyle === "boolean" ? nextConfig.forcePathStyle : null,
  };
}

function _clipboardRestartFoundryForS3Refresh(containerName) {
  if (FOUNDRY_S3_RESTART_COMMAND) {
    execFileSync("sh", ["-lc", FOUNDRY_S3_RESTART_COMMAND], {
      env: process.env,
      stdio: "pipe",
    });
    return;
  }

  if (containerName) {
    _clipboardDockerText(["restart", containerName]);
  }
}

async function _clipboardWaitForFoundryServer() {
  const joinUrl = new URL(FOUNDRY_URL);
  joinUrl.pathname = "/join";
  joinUrl.search = "";
  joinUrl.hash = "";

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(joinUrl, {redirect: "manual"});
      if (response.ok || [301, 302, 303, 307, 308].includes(response.status)) return;
    } catch (error) {
      void error;
    }
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for Foundry to come back after S3 credential refresh: ${joinUrl.href}`);
}

async function _clipboardRefreshFoundryS3Credentials() {
  if (!S3_REFRESH_ENABLED) {
    console.log("[s3-smoke] Skipping Foundry S3 credential refresh because FOUNDRY_S3_REFRESH=false.");
    return;
  }

  const location = _clipboardResolveFoundryS3ConfigLocation();
  if (!location?.configPath) {
    console.log("[s3-smoke] Could not resolve a Foundry S3 config file automatically. Set FOUNDRY_S3_AWS_CONFIG_PATH if your setup is not auto-detectable.");
    return;
  }

  const refreshed = _clipboardRefreshAwsCredentialsFile(location.configPath);
  console.log(`[s3-smoke] Refreshed Foundry S3 credentials in ${refreshed.configPath} using access key ${refreshed.accessKeyId}.`);
  if (refreshed.expiration) {
    console.log(`[s3-smoke] Refreshed AWS session expires at ${refreshed.expiration}.`);
  }
  if (refreshed.endpoint) {
    console.log(`[s3-smoke] Using S3-compatible endpoint ${refreshed.endpoint}${refreshed.forcePathStyle === null ? "" : ` (forcePathStyle=${refreshed.forcePathStyle})`}.`);
  }

  _clipboardRestartFoundryForS3Refresh(location.containerName);
  if (location.containerName || FOUNDRY_S3_RESTART_COMMAND) {
    await _clipboardWaitForFoundryServer();
  }
}

function _clipboardListS3Keys(bucket, prefix) {
  const output = _clipboardAwsJson(_clipboardWithAwsEndpoint([
    "s3api",
    "list-objects-v2",
    "--bucket",
    bucket,
    "--prefix",
    prefix,
    "--output",
    "json",
  ]));

  return Array.isArray(output?.Contents)
    ? output.Contents.map(entry => entry.Key).filter(Boolean)
    : [];
}

function _clipboardHeadS3Object(bucket, key) {
  return _clipboardAwsJson(_clipboardWithAwsEndpoint([
    "s3api",
    "head-object",
    "--bucket",
    bucket,
    "--key",
    key,
    "--output",
    "json",
  ]));
}

function _clipboardDeleteS3Object(bucket, key) {
  execFileSync("aws", _clipboardWithAwsEndpoint([
    "s3api",
    "delete-object",
    "--bucket",
    bucket,
    "--key",
    key,
  ]), {
    env: {
      ...process.env,
      AWS_PAGER: "",
    },
    stdio: "pipe",
  });
}

function _clipboardDeleteS3Prefix(bucket, prefix) {
  if (!bucket || !prefix) return;

  const keys = _clipboardListS3Keys(bucket, prefix);
  for (const key of keys) {
    _clipboardDeleteS3Object(bucket, key);
  }
}

async function _clipboardGetRenderedTileInfo(page, tileId) {
  return page.evaluate(id => {
    const placeable = canvas.tiles.placeables.find(entry => entry.document.id === id);
    const texture = placeable?.texture || placeable?.mesh?.texture || null;
    const baseTexture = texture?.baseTexture || texture?.source || null;
    return {
      documentWidth: placeable?.document?.width ?? null,
      documentHeight: placeable?.document?.height ?? null,
      textureWidth: texture?.width ?? null,
      textureHeight: texture?.height ?? null,
      baseValid: baseTexture?.valid ?? null,
      destroyed: baseTexture?.destroyed ?? null,
      isVideo: placeable?.isVideo ?? null,
      textureSrc: placeable?.document?.texture?.src ?? null,
    };
  }, tileId);
}

test.describe.configure({mode: "serial"});

test.describe("S3-compatible storage integration", () => {
  test.skip(!S3_BUCKET, "FOUNDRY_S3_BUCKET must be set to run S3 smoke coverage.");
  test.skip(!HAS_AWS_CLI, "AWS CLI must be installed to run S3 smoke coverage.");

  test.beforeAll(async () => {
    await _clipboardRefreshFoundryS3Credentials();
  });

  test.beforeEach(async ({page}) => {
    await loginToFoundry(page);
  });

  test.afterEach(async ({page}) => {
    await restoreClipboardRead(page).catch(() => {});
  });

  test("uploads pasted media into the configured storage bucket", async ({page}, testInfo) => {
    const run = await beginClipboardRun(page, testInfo, {
      source: "s3",
      bucket: S3_BUCKET,
    });

    try {
      _clipboardDeleteS3Prefix(S3_BUCKET, run.uploadFolder);

      const mouse = await getSafeCanvasPoint(page, 0);
      await focusCanvas(page);
      await setCanvasMousePosition(page, mouse);
      await page.evaluate(() => canvas.tiles.activate());

      const before = await getStateSnapshot(page);
      await dispatchFilePaste(page, {
        targetSelector: ".game",
        filename: "test-token.png",
        mimeType: "image/png",
      });

      await expect.poll(async () => (await getStateSnapshot(page)).tiles.length, {
        message: "Expected a new tile to be created from the pasted media.",
      }).toBe(before.tiles.length + 1);

      const after = await getStateSnapshot(page);
      const [tile] = getNewDocuments(before, after, "tiles");
      expect(tile.textureSrc).toContain(run.uploadFolder);

      await expect.poll(async () => _clipboardGetRenderedTileInfo(page, tile.id), {
        timeout: 30_000,
        message: "Expected the S3-backed tile texture to load successfully in the browser.",
      }).toMatchObject({
        documentWidth: tile.width,
        documentHeight: tile.height,
        textureWidth: tile.width,
        textureHeight: tile.height,
        baseValid: true,
        destroyed: false,
      });

      await expect.poll(() => _clipboardListS3Keys(S3_BUCKET, run.uploadFolder).length, {
        timeout: 60_000,
        message: `Expected Foundry to upload at least one object under s3://${S3_BUCKET}/${run.uploadFolder}`,
      }).toBeGreaterThan(0);

      const keys = _clipboardListS3Keys(S3_BUCKET, run.uploadFolder);
      const [uploadedKey] = keys;
      expect(uploadedKey).toContain(run.uploadFolder);
      expect(uploadedKey).toMatch(/\.png$/i);

      const object = _clipboardHeadS3Object(S3_BUCKET, uploadedKey);
      expect(object.ContentLength).toBeGreaterThan(0);
      expect((object.ContentType || "").toLowerCase()).toBe("image/png");
    } finally {
      await cleanupClipboardRun(page, run);
      _clipboardDeleteS3Prefix(S3_BUCKET, run.uploadFolder);
    }
  });
});
