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

function _clipboardListS3Keys(bucket, prefix) {
  const output = _clipboardAwsJson([
    "s3api",
    "list-objects-v2",
    "--bucket",
    bucket,
    "--prefix",
    prefix,
    "--output",
    "json",
  ]);

  return Array.isArray(output?.Contents)
    ? output.Contents.map(entry => entry.Key).filter(Boolean)
    : [];
}

function _clipboardHeadS3Object(bucket, key) {
  return _clipboardAwsJson([
    "s3api",
    "head-object",
    "--bucket",
    bucket,
    "--key",
    key,
    "--output",
    "json",
  ]);
}

function _clipboardDeleteS3Object(bucket, key) {
  execFileSync("aws", [
    "s3api",
    "delete-object",
    "--bucket",
    bucket,
    "--key",
    key,
  ], {
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

test.describe.configure({mode: "serial"});

test.describe("Amazon S3 integration", () => {
  test.skip(!S3_BUCKET, "FOUNDRY_S3_BUCKET must be set to run S3 smoke coverage.");
  test.skip(!HAS_AWS_CLI, "AWS CLI must be installed to run S3 smoke coverage.");

  test.beforeEach(async ({page}) => {
    await loginToFoundry(page);
  });

  test.afterEach(async ({page}) => {
    await restoreClipboardRead(page).catch(() => {});
  });

  test("uploads pasted media into the configured S3 bucket", async ({page}, testInfo) => {
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
