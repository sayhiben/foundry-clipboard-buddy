const fs = require("fs");
const path = require("path");
const {execFileSync} = require("child_process");
const {expect} = require("@playwright/test");
const {getDefaultFoundryStorageStatePath} = require("./browser");

const MODULE_ID = "foundry-paste-eater";
const DEFAULT_TIMEOUT = 120_000;
const AUTH_STATE_CACHE = new Map();
const CHAT_INPUT_SELECTORS = [
  "form textarea[name='content']",
  "#chat-form textarea",
  ".chat-form textarea",
  "textarea[name='content']",
];
const CLIPBOARD_LOG_PREFIX = "Foundry Paste Eater [";
const FOUNDRY_DOCKER_CONTAINER = process.env.FOUNDRY_DOCKER_CONTAINER || "";
const FOUNDRY_CLASSIC_LEVEL_PATH = process.env.FOUNDRY_CLASSIC_LEVEL_PATH || "";
const FOUNDRY_DATA_PATH = process.env.FOUNDRY_DATA_PATH || "";
const FOUNDRY_WORLD_ID = process.env.FOUNDRY_WORLD_ID || "";

function getFoundryUrl() {
  return process.env.FOUNDRY_URL || process.env.FOUNDRY_JOIN_URL || process.env.FOUNDRY_BASE_URL || "http://127.0.0.1:30000";
}

function getDefaultFoundryGmUser() {
  return process.env.FOUNDRY_GM_USER || "Clipboard QA 1";
}

function getDefaultFoundryTestUser() {
  return process.env.FOUNDRY_TEST_USER || process.env.FOUNDRY_PLAYER_USER || "Clipboard QA 1";
}

function resolveFoundryCredentials(credentials = {}, {gm = false} = {}) {
  return {
    user: credentials.user ?? (
      gm
        ? getDefaultFoundryGmUser()
        : getDefaultFoundryTestUser()
    ),
    password: credentials.password ?? (
      gm
        ? (process.env.FOUNDRY_GM_PASSWORD ?? "")
        : (process.env.FOUNDRY_TEST_PASSWORD ?? process.env.FOUNDRY_PLAYER_PASSWORD ?? "")
    ),
  };
}

function _clipboardGetAuthCacheKey(credentials) {
  return JSON.stringify({
    url: getFoundryUrl(),
    user: credentials.user || "",
    password: credentials.password || "",
  });
}

function _clipboardCanUseDefaultAuthState(credentials, options = {}) {
  if (!options.gm) return false;

  const defaultCredentials = resolveFoundryCredentials({}, {gm: true});
  return credentials.user === defaultCredentials.user && credentials.password === defaultCredentials.password;
}

function _clipboardReadDefaultAuthState(credentials, options = {}) {
  if (!_clipboardCanUseDefaultAuthState(credentials, options)) return null;

  const storageStatePath = process.env.FOUNDRY_STORAGE_STATE || getDefaultFoundryStorageStatePath();
  if (!storageStatePath || !fs.existsSync(storageStatePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(storageStatePath, "utf8"));
  } catch {
    return null;
  }
}

function getCachedFoundryAuthState(credentials = {}, options = {}) {
  const resolvedCredentials = resolveFoundryCredentials(credentials, options);
  const cacheKey = _clipboardGetAuthCacheKey(resolvedCredentials);
  const cachedState = AUTH_STATE_CACHE.get(cacheKey);
  if (cachedState) {
    return {
      credentials: resolvedCredentials,
      storageState: cachedState,
    };
  }

  const storedState = _clipboardReadDefaultAuthState(resolvedCredentials, options);
  if (storedState) {
    AUTH_STATE_CACHE.set(cacheKey, storedState);
    return {
      credentials: resolvedCredentials,
      storageState: storedState,
    };
  }

  return {
    credentials: resolvedCredentials,
    storageState: null,
  };
}

async function createAuthenticatedPage(browser, credentials = {}, options = {}) {
  const cached = options.reuseAuth === false
    ? {
      credentials: resolveFoundryCredentials(credentials, options),
      storageState: null,
    }
    : getCachedFoundryAuthState(credentials, options);
  const contextOptions = {
    acceptDownloads: Boolean(options.acceptDownloads),
  };
  if (cached.storageState) {
    contextOptions.storageState = cached.storageState;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    await loginToFoundry(page, cached.credentials);
    await stabilizeFoundryUiState(page);
    if (options.reuseAuth !== false) {
      AUTH_STATE_CACHE.set(_clipboardGetAuthCacheKey(cached.credentials), await context.storageState());
    }
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }

  return {
    context,
    page,
    credentials: cached.credentials,
  };
}

function buildSharedFoundryTest(baseTest, credentials = {}, options = {}) {
  return baseTest.extend({
    foundryPage: [async ({browser}, use) => {
      const session = await createAuthenticatedPage(browser, credentials, {gm: true, ...options});
      try {
        await use(session.page);
      } finally {
        await session.context.close().catch(() => {});
      }
    }, {scope: "worker"}],
  });
}

function getLoginAttemptTimeout() {
  return Number(process.env.FOUNDRY_LOGIN_TIMEOUT_MS || 60_000);
}

function _clipboardDockerText(args) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    env: process.env,
  }).trim();
}

function _clipboardGetFoundryPort() {
  try {
    const parsed = new URL(getFoundryUrl());
    return parsed.port || (parsed.protocol === "https:" ? "443" : "80");
  } catch {
    return "30000";
  }
}

function _clipboardResolveDockerContainerByPort() {
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

function _clipboardResolveFoundryTestEnvironment() {
  if (FOUNDRY_DATA_PATH && FOUNDRY_WORLD_ID) {
    const foundryRoot = path.dirname(path.resolve(FOUNDRY_DATA_PATH));
    const classicLevelPath = FOUNDRY_CLASSIC_LEVEL_PATH || path.join(foundryRoot, "resources", "app", "node_modules", "classic-level");
    return {
      containerName: FOUNDRY_DOCKER_CONTAINER,
      dataPath: path.resolve(FOUNDRY_DATA_PATH),
      worldId: FOUNDRY_WORLD_ID,
      classicLevelPath,
    };
  }

  const containerName = FOUNDRY_DOCKER_CONTAINER || _clipboardResolveDockerContainerByPort();
  if (!containerName) {
    throw new Error("Could not resolve a running Foundry container. Set FOUNDRY_DOCKER_CONTAINER or provide FOUNDRY_DATA_PATH and FOUNDRY_WORLD_ID.");
  }

  const mounts = JSON.parse(_clipboardDockerText(["inspect", containerName, "--format", "{{json .Mounts}}"]) || "[]");
  const dataMount = mounts.find(mount => mount.Type === "bind" && mount.Destination === "/data" && mount.Source);
  if (!dataMount?.Source) {
    throw new Error(`Could not resolve the /data bind mount for Foundry container ${containerName}.`);
  }

  const dataPath = dataMount.Source;
  const optionsPath = path.join(dataPath, "Config", "options.json");
  if (!fs.existsSync(optionsPath)) {
    throw new Error(`Could not find Foundry options.json at ${optionsPath}.`);
  }

  const options = JSON.parse(fs.readFileSync(optionsPath, "utf8"));
  const foundryRoot = path.dirname(dataPath);
  const classicLevelPath = FOUNDRY_CLASSIC_LEVEL_PATH || path.join(foundryRoot, "resources", "app", "node_modules", "classic-level");

  return {
    containerName,
    dataPath,
    worldId: options.world,
    classicLevelPath,
  };
}

function _clipboardRestartFoundry(containerName) {
  if (!containerName) return;
  _clipboardDockerText(["restart", containerName]);
}

async function _clipboardWaitForFoundryServer() {
  const joinUrl = new URL(getFoundryUrl());
  joinUrl.pathname = "/join";
  joinUrl.search = "";
  joinUrl.hash = "";

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(joinUrl, {redirect: "manual"});
      if (response.ok || [301, 302, 303, 307, 308].includes(response.status)) return;
    } catch {
      // Foundry is still restarting.
    }
    await new Promise(resolve => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for Foundry to restart at ${joinUrl.href}.`);
}

function getFixturePath(filename) {
  return path.resolve(__dirname, "..", "..", "assets", filename);
}

function getFixtureUrl(filename) {
  return new URL(`/modules/${MODULE_ID}/test/assets/${filename}`, getFoundryUrl()).href;
}

function sanitizeId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "run";
}

async function waitForFoundryReady(page, options = {}) {
  await waitForFoundryCoreReady(page, options);
  await ensureModuleActive(page);
  await expect.poll(() => page.evaluate(moduleId => game.modules.get(moduleId)?.active ?? false, MODULE_ID), {
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    message: `${MODULE_ID} module is not active in the loaded Foundry world`,
  }).toBe(true);
}

async function waitForFoundryCoreReady(page, options = {}) {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  await page.waitForFunction(() => globalThis.game?.ready, null, {
    timeout,
  });
  await ensureActiveScene(page);
  await page.waitForFunction(() => globalThis.game?.ready && globalThis.canvas?.ready && Boolean(globalThis.canvas?.scene), null, {
    timeout,
  });
}

async function ensureModuleActive(page) {
  const moduleState = await page.evaluate(moduleId => {
    const module = game?.modules?.get?.(moduleId);
    return {
      exists: Boolean(module),
      active: Boolean(module?.active),
      isGM: Boolean(game?.user?.isGM),
    };
  }, MODULE_ID);

  if (!moduleState.exists) {
    throw new Error(`${MODULE_ID} module is not installed in the loaded Foundry world.`);
  }

  if (moduleState.active || !moduleState.isGM) return;

  const enabled = await page.evaluate(async moduleId => {
    const configuration = foundry.utils.deepClone(game.settings.get("core", "moduleConfiguration") || {});
    if (configuration[moduleId]) return false;

    configuration[moduleId] = true;
    await game.settings.set("core", "moduleConfiguration", configuration);
    return true;
  }, MODULE_ID);

  if (!enabled) return;

  await page.reload({waitUntil: "domcontentloaded"});
  await waitForFoundryCoreReady(page);
}

async function ensureActiveScene(page) {
  await page.evaluate(async () => {
    if (globalThis.canvas?.ready && globalThis.canvas?.scene) return;
    const sceneCollection = game?.scenes;
    if (!sceneCollection) return;

    let scene = sceneCollection.current ||
      sceneCollection.active ||
      sceneCollection.viewed ||
      sceneCollection.contents?.find?.(entry => entry.active) ||
      sceneCollection.contents?.[0] ||
      null;

    if (!scene) {
      const SceneDocument = foundry?.documents?.Scene ||
        CONFIG?.Scene?.documentClass ||
        globalThis.Scene ||
        null;
      if (!SceneDocument?.create) return;

      scene = await SceneDocument.create({
        name: "Foundry Paste Eater Smoke Scene",
        active: true,
        navigation: true,
        width: 4096,
        height: 4096,
        grid: {
          size: 100,
          distance: 5,
          units: "ft",
        },
      });
    }

    if (!scene) return;
    if (!scene.navigation) await scene.update({navigation: true});
    if (!scene.active) {
      await scene.update({active: true});
    } else if (typeof scene.activate === "function") {
      await scene.activate();
    }

    if (typeof scene.view === "function") {
      await scene.view();
    }
  });
}

async function isJoinPromptVisible(page) {
  return page.evaluate(() => Boolean(
    document.querySelector("button[type='submit'], button[name='join']") ||
    document.querySelector("select[name='userid']") ||
    document.querySelector("input[name='userid'], input[name='username'], input[type='password']")
  )).catch(() => false);
}

async function populateFoundryJoinForm(page, credentials) {
  const user = credentials.user || "";
  const password = credentials.password ?? "";

  const userSelect = page.locator("select[name='userid']").first();
  if (await userSelect.count()) {
    if (!user) {
      throw new Error("FOUNDRY_USER is required when Foundry shows a user selection prompt.");
    }

    const options = await userSelect.locator("option").evaluateAll(selectOptions => selectOptions.map(option => ({
      value: option.value,
      label: option.textContent?.trim() || "",
      disabled: Boolean(option.disabled),
    })));
    const matchedOption = options.find(option => option.value === user || option.label === user);
    if (!matchedOption) {
      throw new Error(`Could not find a Foundry user option matching "${user}".`);
    }
    if (matchedOption.disabled) {
      throw new Error(`Foundry user "${user}" is already connected or otherwise unavailable on the join screen.`);
    }

    await userSelect.evaluate((select, value) => {
      select.value = value;
      const option = Array.from(select.options).find(entry => entry.value === value);
      if (option) option.selected = true;
      select.dispatchEvent(new Event("input", {bubbles: true}));
      select.dispatchEvent(new Event("change", {bubbles: true}));
    }, matchedOption.value);
  }

  const userInput = page.locator("input[name='userid'], input[name='username']").first();
  if (await userInput.count()) {
    if (!user) {
      throw new Error("FOUNDRY_USER is required when Foundry shows a user input field.");
    }
    await userInput.fill(user);
  }

  const passwordInput = page.locator("input[type='password']").first();
  if (await passwordInput.count()) {
    await passwordInput.fill(password);
  }
}

async function resetFoundrySessions() {
  const environment = _clipboardResolveFoundryTestEnvironment();
  _clipboardRestartFoundry(environment.containerName);
  if (environment.containerName) {
    await _clipboardWaitForFoundryServer();
  }
}

async function loginToFoundry(page, credentials = {}) {
  attachClipboardConsoleLogging(page);
  await page.goto(getFoundryUrl(), {waitUntil: "domcontentloaded"});
  await waitForFoundryShell(page);
  await page.waitForFunction(() => {
    if (globalThis.game?.ready && globalThis.canvas?.ready) return true;
    return Boolean(
      document.querySelector("button[type='submit'], button[name='join']") ||
      document.querySelector("select[name='userid']") ||
      document.querySelector("input[name='userid'], input[name='username'], input[type='password']")
    );
  }, null, {
    timeout: DEFAULT_TIMEOUT,
  });

  if (await isFoundryReady(page)) {
    await waitForFoundryReady(page);
    return;
  }

  const resolvedCredentials = resolveFoundryCredentials(credentials, {
    gm: !credentials.user || credentials.user === getDefaultFoundryGmUser(),
  });

  const joinButton = await findFirstVisibleLocator(page, [
    "button[type='submit']",
    "button[name='join']",
    "button:has-text('Join Game')",
    "button:has-text('Join')",
  ]);

  if (!joinButton) {
    throw new Error("Could not find a Foundry login or join button. Set FOUNDRY_STORAGE_STATE or verify FOUNDRY_URL.");
  }

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await populateFoundryJoinForm(page, resolvedCredentials);
    await Promise.all([
      page.waitForLoadState("networkidle").catch(() => {}),
      joinButton.click(),
    ]);

    try {
      await waitForFoundryReady(page, {timeout: getLoginAttemptTimeout()});
      return;
    } catch (error) {
      lastError = error;
      const joinPromptVisible = await isJoinPromptVisible(page);
      if (!joinPromptVisible || attempt === 3) break;
      await page.waitForTimeout(500);
    }
  }

  throw lastError || new Error("Timed out logging into Foundry.");
}

function attachClipboardConsoleLogging(page) {
  if (page.__clipboardConsoleLoggingAttached) return;

  page.__clipboardConsoleLoggingAttached = true;
  page.on("console", async message => {
    const text = message.text();
    if (!text.includes(CLIPBOARD_LOG_PREFIX)) return;

    const values = [];
    for (const argument of message.args()) {
      try {
        values.push(await argument.jsonValue());
      } catch {
        values.push(await argument.evaluate(value => String(value)).catch(() => "[Unserializable]"));
      }
    }

    if (values.length > 1) {
      console.log(`[browser:${message.type()}]`, ...values);
      return;
    }

    console.log(`[browser:${message.type()}] ${text}`);
  });
}

async function waitForFoundryShell(page) {
  await page.waitForFunction(() => document.readyState === "complete" || document.readyState === "interactive", null, {
    timeout: DEFAULT_TIMEOUT,
  });
}

async function isFoundryReady(page) {
  return page.evaluate(() => Boolean(globalThis.game?.ready && globalThis.canvas?.ready)).catch(() => false);
}

async function findFirstVisibleLocator(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count()) return locator;
  }
  return null;
}

async function beginClipboardRun(page, testInfo, options = {}) {
  await waitForFoundryReady(page);

  const runId = `${Date.now()}-${sanitizeId(testInfo.title)}`;
  const prefix = `[PW ${runId}]`;
  const uploadFolder = await page.evaluate(({runId, overrideTarget}) => {
    const worldId = game.world?.id || "world";
    return overrideTarget || `worlds/${worldId}/pasted_images/playwright/${runId}`;
  }, {runId, overrideTarget: options.target || ""});
  const source = options.source || "data";
  const bucket = source === "s3" ? (options.bucket || "") : "";
  const verboseLogging = Object.hasOwn(options, "verboseLogging") ? Boolean(options.verboseLogging) : true;

  async function applyRunSettings() {
    return page.evaluate(async ({moduleId, uploadFolder, source, bucket, verboseLogging}) => {
      const previousSource = await game.settings.get(moduleId, "image-location-source");
      const previousTarget = await game.settings.get(moduleId, "image-location");
      const previousBucket = await game.settings.get(moduleId, "image-location-bucket");
      const previousVerboseLogging = await game.settings.get(moduleId, "verbose-logging");

      await game.settings.set(moduleId, "image-location-source", source);
      await game.settings.set(moduleId, "image-location", uploadFolder);
      await game.settings.set(moduleId, "image-location-bucket", bucket);
      await game.settings.set(moduleId, "verbose-logging", verboseLogging);

      return {
        source: previousSource,
        target: previousTarget,
        bucket: previousBucket,
        verboseLogging: previousVerboseLogging,
      };
    }, {moduleId: MODULE_ID, uploadFolder, source, bucket, verboseLogging});
  }

  let previousSettings;
  try {
    previousSettings = await applyRunSettings();
  } catch (error) {
    const message = String(error?.message || error);
    if (!/not a registered game setting/i.test(message)) throw error;

    await page.reload({waitUntil: "domcontentloaded"});
    await waitForFoundryReady(page);
    previousSettings = await applyRunSettings();
  }

  if (options.cleanScenePlaceables !== false) {
    await clearCurrentScenePlaceables(page);
  } else {
    await releaseAllControlledPlaceables(page);
  }

  return {
    runId,
    prefix,
    uploadFolder,
    source,
    bucket,
    previousSettings,
  };
}

async function clearCurrentScenePlaceables(page) {
  await page.evaluate(async () => {
    const scene = canvas?.scene;
    if (!scene) return;

    const deleteEmbedded = async (documentName, collection) => {
      const ids = (collection?.contents || [])
        .map(document => document?.id)
        .filter(Boolean);
      if (ids.length) {
        await scene.deleteEmbeddedDocuments(documentName, ids);
      }
    };

    await deleteEmbedded("Note", scene.notes);
    await deleteEmbedded("Token", scene.tokens);
    await deleteEmbedded("Tile", scene.tiles);
  });

  await releaseAllControlledPlaceables(page);
  await expect.poll(() => page.evaluate(() => ({
    tokens: canvas?.scene?.tokens?.contents?.length || 0,
    tiles: canvas?.scene?.tiles?.contents?.length || 0,
    notes: canvas?.scene?.notes?.contents?.length || 0,
  })), {
    timeout: 10_000,
    message: "Expected beginClipboardRun to start from an empty scene for tokens, tiles, and notes.",
  }).toEqual({tokens: 0, tiles: 0, notes: 0});
}

async function setModuleSettings(page, updates, {moduleId = MODULE_ID} = {}) {
  return page.evaluate(async ({moduleId, updates}) => {
    const previous = {};
    for (const [key, value] of Object.entries(updates)) {
      previous[key] = await game.settings.get(moduleId, key);
      await game.settings.set(moduleId, key, value);
    }
    ui.controls.initialize({control: canvas.activeLayer?.options?.name || "tiles"});
    ui.controls.render(true);
    return previous;
  }, {moduleId, updates});
}

async function restoreModuleSettings(page, previous, {moduleId = MODULE_ID} = {}) {
  if (!previous || !Object.keys(previous).length) return;
  if (page?.isClosed?.()) return;

  try {
    await page.evaluate(async ({moduleId, previous}) => {
      for (const [key, value] of Object.entries(previous)) {
        await game.settings.set(moduleId, key, value);
      }
      ui.controls.initialize({control: canvas.activeLayer?.options?.name || "tiles"});
      ui.controls.render(true);
    }, {moduleId, previous});
  } catch (error) {
    if (/Execution context was destroyed|Cannot find context/i.test(String(error?.message || error))) {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.evaluate(async ({moduleId, previous}) => {
        for (const [key, value] of Object.entries(previous)) {
          await game.settings.set(moduleId, key, value);
        }
        ui.controls.initialize({control: canvas.activeLayer?.options?.name || "tiles"});
        ui.controls.render(true);
      }, {moduleId, previous});
      return;
    }
    if (/Target page, context or browser has been closed|Test ended/i.test(String(error?.message || error))) return;
    throw error;
  }
}

async function setCorePermissions(page, updates) {
  return page.evaluate(async updates => {
    const previous = await game.settings.get("core", "permissions");
    const next = foundry.utils.deepClone(previous);

    for (const [permission, roles] of Object.entries(updates)) {
      next[permission] = roles;
    }

    await game.settings.set("core", "permissions", next);
    return previous;
  }, updates);
}

async function restoreCorePermissions(page, previous) {
  if (!previous) return;
  if (page?.isClosed?.()) return;

  try {
    await page.evaluate(async previous => {
      await game.settings.set("core", "permissions", previous);
    }, previous);
  } catch (error) {
    if (/Execution context was destroyed|Cannot find context/i.test(String(error?.message || error))) {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.evaluate(async previous => {
        await game.settings.set("core", "permissions", previous);
      }, previous);
      return;
    }
    if (/Target page, context or browser has been closed|Test ended/i.test(String(error?.message || error))) return;
    throw error;
  }
}

async function cleanupClipboardRun(page, run) {
  if (!run) return;
  if (page?.isClosed?.()) return;

  try {
    await page.evaluate(async ({moduleId, run}) => {
      const messageIds = game.messages.contents
        .filter(message => (message.content || "").includes(run.uploadFolder) || (message.content || "").includes(run.prefix))
        .map(message => message.id);
      for (const id of messageIds) {
        await game.messages.get(id)?.delete();
      }

      const journalIds = game.journal.contents
        .filter(entry => (entry.name || "").includes(run.prefix))
        .map(entry => entry.id);

      const noteIds = canvas.scene.notes.contents
        .filter(note => journalIds.includes(note.entryId) || (note.text || "").includes(run.prefix))
        .map(note => note.id);
      if (noteIds.length) {
        await canvas.scene.deleteEmbeddedDocuments("Note", noteIds);
      }

      const tokenIds = canvas.scene.tokens.contents
        .filter(token =>
          (token.name || "").includes(run.prefix) ||
          (token.texture?.src || "").includes(run.uploadFolder)
        )
        .map(token => token.id);
      if (tokenIds.length) {
        await canvas.scene.deleteEmbeddedDocuments("Token", tokenIds);
      }

      const tileIds = canvas.scene.tiles.contents
        .filter(tile => (tile.texture?.src || "").includes(run.uploadFolder))
        .map(tile => tile.id);
      if (tileIds.length) {
        await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
      }

      const actorIds = game.actors.contents
        .filter(actor =>
          (actor.name || "").includes(run.prefix) ||
          (actor.img || "").includes(run.uploadFolder) ||
          (actor.prototypeToken?.texture?.src || "").includes(run.uploadFolder)
        )
        .map(actor => actor.id);
      for (const id of actorIds) {
        await game.actors.get(id)?.delete();
      }

      for (const id of journalIds) {
        await game.journal.get(id)?.delete();
      }

      await game.settings.set(moduleId, "image-location-source", run.previousSettings.source);
      await game.settings.set(moduleId, "image-location", run.previousSettings.target);
      await game.settings.set(moduleId, "image-location-bucket", run.previousSettings.bucket);
      await game.settings.set(moduleId, "verbose-logging", run.previousSettings.verboseLogging);
    }, {moduleId: MODULE_ID, run});

    await releaseAllControlledPlaceables(page);
  } catch (error) {
    const message = String(error?.message || error || "");
    if (/ENOENT|Execution context was destroyed|Cannot find context|Target page, context or browser has been closed|Test ended/i.test(message)) {
      return;
    }
    throw error;
  }
}

async function ensureUploadDirectory(page, directoryPath, {source = "data", bucket = ""} = {}) {
  if (!directoryPath) return "";

  return page.evaluate(async ({directoryPath, source, bucket}) => {
    const FilePickerImplementation = foundry.applications.apps.FilePicker.implementation;
    const segments = String(directoryPath)
      .split("/")
      .map(segment => segment.trim())
      .filter(Boolean);

    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      try {
        await FilePickerImplementation.createDirectory(source, current, {bucket});
      } catch (error) {
        const message = String(error?.message || error || "");
        if (/already exists|EEXIST/i.test(message)) continue;

        const parent = current.includes("/") ? current.replace(/\/[^/]+$/, "") : "";
        const listing = await FilePickerImplementation.browse(source, parent, {bucket});
        const exists = Array.isArray(listing?.dirs)
          ? listing.dirs.some(entry => {
            const candidate = String(entry || "");
            return candidate === current || candidate.endsWith(`/${segment}`);
          })
          : false;
        if (!exists) throw error;
      }
    }

    return current;
  }, {directoryPath, source, bucket});
}

async function focusCanvas(page) {
  await page.evaluate(() => {
    const root = document.querySelector(".game");
    if (!root) throw new Error("Could not find the Foundry game root.");
    root.tabIndex = 0;
    root.focus({preventScroll: true});
  });
  await page.waitForFunction(() => document.activeElement === document.querySelector(".game"));
}

async function releaseAllControlledPlaceables(page) {
  await page.evaluate(() => {
    const layers = [canvas.tokens, canvas.tiles, canvas.notes].filter(Boolean);
    for (const layer of layers) {
      layer.releaseAll?.();
      for (const placeable of layer.placeables || []) {
        if (placeable.controlled) {
          placeable.release?.();
        }
      }
    }
  });

  await expect.poll(() => page.evaluate(() => ({
    tokens: canvas.tokens?.controlled?.length || 0,
    tiles: canvas.tiles?.controlled?.length || 0,
    notes: canvas.notes?.controlled?.length || 0,
  })), {
    timeout: 5_000,
    message: "Expected all controlled placeables to be released before continuing",
  }).toEqual({tokens: 0, tiles: 0, notes: 0});
}

async function focusChatInput(page) {
  await page.evaluate(() => {
    ui.sidebar?.expand?.();
    ui.sidebar?.activateTab?.("chat");
  });
  await page.waitForFunction(selectors => selectors.some(selector => document.querySelector(selector)), CHAT_INPUT_SELECTORS, {
    timeout: DEFAULT_TIMEOUT,
  });

  const selector = await page.evaluate(selectors => {
    for (const candidate of selectors) {
      const element = document.querySelector(candidate);
      if (!element) continue;
      element.focus();
      return candidate;
    }
    return null;
  }, CHAT_INPUT_SELECTORS);

  if (!selector) {
    throw new Error("Could not find a Foundry chat input.");
  }

  return selector;
}

async function setCanvasMousePosition(page, position) {
  await page.evaluate(({x, y}) => {
    const point = canvas.mousePosition;
    if (point && typeof point.copyFrom === "function" && globalThis.PIXI?.Point) {
      point.copyFrom(new PIXI.Point(x, y));
      return;
    }

    if (point) {
      point.x = x;
      point.y = y;
      return;
    }

    canvas.mousePosition = globalThis.PIXI?.Point ? new PIXI.Point(x, y) : {x, y};
  }, position);
}

async function getSafeCanvasPoint(page, offset = 0) {
  return page.evaluate(index => {
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const baseX = Math.min(Math.max(160 + (index * 120), 160), Math.max(width - 220, 160));
    const baseY = Math.min(Math.max(180 + (index * 100), 180), Math.max(height - 220, 180));
    return {x: baseX, y: baseY};
  }, offset);
}

async function getCanvasDimensions(page) {
  return page.evaluate(() => ({
    width: canvas.dimensions.width,
    height: canvas.dimensions.height,
    sceneWidth: canvas.dimensions.sceneWidth,
    sceneHeight: canvas.dimensions.sceneHeight,
    gridSize: canvas.grid.size,
  }));
}

async function createToken(page, {name, textureSrc, x, y, width = 1, height = 1}) {
  return page.evaluate(async data => {
    const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
      actorId: null,
      name: data.name,
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
    }]);
    return {
      id: token.id,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      name: token.name,
    };
  }, {name, textureSrc, x, y, width, height});
}

async function createTile(page, {textureSrc, x, y, width = 120, height = 120}) {
  return page.evaluate(async data => {
    const [tile] = await canvas.scene.createEmbeddedDocuments("Tile", [{
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
      rotation: 0,
      sort: 0,
    }]);
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
    };
  }, {textureSrc, x, y, width, height});
}

async function controlPlaceable(page, documentName, id) {
  await page.evaluate(({documentName, id}) => {
    canvas.tokens?.releaseAll?.();
    canvas.tiles?.releaseAll?.();
    canvas.notes?.releaseAll?.();

    const layer = documentName === "Token"
      ? canvas.tokens
      : documentName === "Note"
        ? canvas.notes
        : canvas.tiles;
    const object = layer.placeables.find(placeable => placeable.document.id === id);
    if (!object) {
      throw new Error(`Could not find ${documentName} ${id} to control.`);
    }
    layer.activate?.();
    canvas.activeLayer = layer;
    object.control({releaseOthers: true});
    layer.controlledObjects?.set?.(object.id, object);
    object.controlled = true;
    if (!Array.isArray(layer.controlled) || !layer.controlled.some(placeable => placeable.document.id === id)) {
      layer.controlled = [object];
    }
  }, {documentName, id});
}

async function controlPlaceables(page, placeables) {
  await page.evaluate(items => {
    canvas.tokens?.releaseAll?.();
    canvas.tiles?.releaseAll?.();
    canvas.notes?.releaseAll?.();

    for (const item of items) {
      const layer = item.documentName === "Token"
        ? canvas.tokens
        : item.documentName === "Note"
          ? canvas.notes
          : canvas.tiles;
      const object = layer.placeables.find(placeable => placeable.document.id === item.id);
      if (!object) {
        throw new Error(`Could not find ${item.documentName} ${item.id} to control.`);
      }
      layer.activate?.();
      canvas.activeLayer = layer;
      object.control({releaseOthers: false});
      layer.controlledObjects?.set?.(object.id, object);
      object.controlled = true;
      if (!Array.isArray(layer.controlled)) {
        layer.controlled = [];
      }
      if (!layer.controlled.some(placeable => placeable.document.id === item.id)) {
        layer.controlled.push(object);
      }
    }
  }, placeables);
}

async function setActiveLayerClipboardObjects(page, documentName, count = 1) {
  await page.evaluate(({documentName, count}) => {
    const layer = documentName === "Token" ? canvas.tokens : canvas.tiles;
    layer.clipboard = layer.clipboard || {};
    layer.clipboard.objects = Array.from({length: count}, (_, index) => ({id: `pw-${documentName}-${index}`}));
  }, {documentName, count});
}

async function clearActiveLayerClipboardObjects(page, documentName) {
  await page.evaluate(documentName => {
    const layer = documentName === "Token" ? canvas.tokens : canvas.tiles;
    if (!layer.clipboard) return;
    layer.clipboard.objects = [];
  }, documentName);
}

async function clearCanvasMousePosition(page) {
  await page.evaluate(() => {
    canvas.mousePosition = null;
  });
}

async function closeOwnedContext(target) {
  const context = typeof target?.newPage === "function"
    ? target
    : target?.context?.();
  if (!context) return;

  try {
    await context.close();
  } catch (error) {
    const message = String(error?.message || error || "");
    if (/ENOENT|Target page, context or browser has been closed|Test ended/i.test(message)) return;
    throw error;
  }
}

async function clearChatInputs(page) {
  await page.evaluate(selectors => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        element.value = "";
      }
    }
  }, CHAT_INPUT_SELECTORS);
}

async function stabilizeFoundryUiState(page) {
  await releaseAllControlledPlaceables(page);
  await clearActiveLayerClipboardObjects(page, "Token");
  await clearActiveLayerClipboardObjects(page, "Tile");
  await clearCanvasMousePosition(page);
  await page.evaluate(() => {
    document.getElementById("foundry-paste-eater-scene-paste-prompt")?.remove?.();
    document.activeElement?.blur?.();

    for (const windowApp of Object.values(ui.windows || {})) {
      windowApp?.close?.();
    }

    canvas.tiles?.activate?.();
    ui.controls?.initialize?.({control: canvas.activeLayer?.options?.name || "tiles"});
    ui.controls?.render?.(true);
    ui.chat?.render?.(true);
  });
  await clearChatInputs(page);
}

async function resetFoundryUiState(page) {
  await page.reload({waitUntil: "domcontentloaded"});
  await waitForFoundryReady(page);
  await stabilizeFoundryUiState(page);
}

async function invokeSceneTool(page, controlName, toolName) {
  const controlButton = page.locator(`#scene-controls-layers [data-control="${controlName}"]`).first();
  if (await controlButton.count()) {
    await controlButton.click();
  }

  const toolButton = page.locator(`#scene-controls-tools [data-tool="${toolName}"]`).first();
  if (await toolButton.count()) {
    await toolButton.click();
    return;
  }

  const debugState = await page.evaluate(({controlName, moduleId}) => {
    const controls = Array.isArray(ui.controls.controls)
      ? ui.controls.controls
      : Object.values(ui.controls.controls || {});
    const control = controls.find(entry => entry.name === controlName);
    const tools = Array.isArray(control?.tools)
      ? control.tools
      : Object.values(control?.tools || {});
    return {
      activeControl: ui.controls.control?.name || null,
      configuredPaste: game.settings.get(moduleId, "enable-scene-paste-tool"),
      configuredUpload: game.settings.get(moduleId, "enable-scene-upload-tool"),
      availableTools: tools.map(entry => ({
        name: entry?.name || null,
        visible: entry?.visible ?? null,
        title: entry?.title || null,
      })),
    };
  }, {controlName, moduleId: MODULE_ID});

  throw new Error(`Could not find tool ${toolName} on control ${controlName}. Debug: ${JSON.stringify(debugState)}`);
}

async function getSceneToolState(page, controlName, toolName) {
  const controlButton = page.locator(`#scene-controls-layers [data-control="${controlName}"]`).first();
  if (await controlButton.count()) {
    await controlButton.click();
  }

  return page.evaluate(({controlName, toolName}) => {
    const controls = Array.isArray(ui.controls.controls)
      ? ui.controls.controls
      : Object.values(ui.controls.controls || {});
    const control = controls.find(entry => entry.name === controlName);
    const tools = Array.isArray(control?.tools)
      ? control.tools
      : Object.values(control?.tools || {});
    const tool = tools.find(entry => entry.name === toolName) || null;
    const domTool = document.querySelector(`li.scene-control[data-control="${controlName}"] [data-tool="${toolName}"]`);

    return {
      exists: Boolean(tool),
      visible: Boolean(tool?.visible),
      title: tool?.title || null,
      domVisible: Boolean(domTool),
    };
  }, {controlName, toolName});
}

async function openUploadDestinationConfig(page) {
  await page.evaluate(async moduleId => {
    const menu = game.settings.menus.get(`${moduleId}.upload-destination`);
    if (!menu?.type) throw new Error("Could not find the Foundry Paste Eater upload-destination settings menu.");

    const existing = Object.values(ui.windows).find(windowApp => windowApp.id === "foundry-paste-eater-destination-config");
    if (existing) {
      existing.bringToFront?.();
      return;
    }

    const app = new menu.type();
    await app.render(true);
  }, MODULE_ID);

  await page.waitForSelector("#foundry-paste-eater-destination-config", {state: "visible", timeout: DEFAULT_TIMEOUT});
}

async function closeUploadDestinationConfig(page) {
  await page.evaluate(() => {
    const app = Object.values(ui.windows).find(windowApp => windowApp.id === "foundry-paste-eater-destination-config");
    app?.close?.();
  });

  await page.waitForSelector("#foundry-paste-eater-destination-config", {state: "hidden", timeout: DEFAULT_TIMEOUT}).catch(() => {});
}

async function getUploadDestinationSummary(page) {
  return page.locator("#foundry-paste-eater-destination-config [data-role='destination-summary']").inputValue();
}

async function ensureFoundryUsers(users) {
  const environment = _clipboardResolveFoundryTestEnvironment();
  const usersDbPath = path.join(environment.dataPath, "Data", "worlds", environment.worldId, "data", "users");
  const {ClassicLevel} = require(environment.classicLevelPath);
  const database = new ClassicLevel(usersDbPath, {valueEncoding: "json"});
  const results = [];
  let didChange = false;

  await database.open();

  try {
    const keyedUsers = new Map();
    for await (const [key, value] of database.iterator()) {
      keyedUsers.set(value?.name || key, {key, value});
    }

    for (const spec of users) {
      const entry = keyedUsers.get(spec.name) || null;
      if (!entry) {
        throw new Error(`Could not find Foundry user "${spec.name}" in ${usersDbPath}. Seed the QA users in the test world first.`);
      }

      const next = {
        ...entry.value,
        name: spec.name,
        role: spec.role ?? entry.value.role,
        pronouns: spec.pronouns ?? entry.value.pronouns ?? "",
      };

      if (typeof spec.color === "string") {
        next.color = spec.color;
      }

      if (
        next.name !== entry.value.name ||
        next.role !== entry.value.role ||
        next.pronouns !== entry.value.pronouns ||
        next.color !== entry.value.color
      ) {
        next._stats = {
          ...entry.value._stats,
          modifiedTime: Date.now(),
        };
        await database.put(entry.key, next);
        didChange = true;
      }

      results.push({
        id: next._id,
        name: next.name,
        role: next.role,
      });
    }
  } finally {
    await database.close();
  }

  if (didChange) {
    _clipboardRestartFoundry(environment.containerName);
    if (environment.containerName) {
      await _clipboardWaitForFoundryServer();
    }
  }

  return results;
}

async function createActorBackedToken(page, {
  actorName,
  tokenName,
  textureSrc,
  x,
  y,
  width = 1,
  height = 1,
  ownerUserName = "",
  defaultOwnership = 0,
}) {
  return page.evaluate(async data => {
    const owner = data.ownerUserName
      ? game.users.find(user => user.name === data.ownerUserName) || null
      : null;
    const ownership = {default: data.defaultOwnership};
    if (owner) {
      ownership[owner.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    }

    const ActorDocument = globalThis.Actor || foundry.documents.Actor;
    const actor = await ActorDocument.create({
      name: data.actorName,
      type: CONFIG.Actor.defaultType || game.system.documentTypes.Actor?.[0] || "character",
      img: data.textureSrc,
      ownership,
      prototypeToken: {
        name: data.tokenName,
        texture: {src: data.textureSrc},
        width: data.width,
        height: data.height,
      },
    });

    const [token] = await canvas.scene.createEmbeddedDocuments("Token", [{
      actorId: actor.id,
      actorLink: false,
      name: data.tokenName,
      texture: {src: data.textureSrc},
      width: data.width,
      height: data.height,
      x: data.x,
      y: data.y,
      hidden: false,
      locked: false,
    }]);

    return {
      actorId: actor.id,
      actorName: actor.name,
      tokenId: token.id,
      ownerUserId: owner?.id || null,
    };
  }, {actorName, tokenName, textureSrc, x, y, width, height, ownerUserName, defaultOwnership});
}

async function readFixtureBytes(filename) {
  return Array.from(await fs.promises.readFile(getFixturePath(filename)));
}

async function dispatchFilePaste(page, {targetSelector, filename, mimeType}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, bytes, filename, mimeType});
}

async function dispatchFileDrop(page, {targetSelector, filename, mimeType}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find drop target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    for (const eventName of ["dragover", "drop"]) {
      const event = new Event(eventName, {bubbles: true, cancelable: true, composed: true});
      Object.defineProperty(event, "dataTransfer", {
        configurable: true,
        value: dataTransfer,
      });
      target.dispatchEvent(event);
    }
  }, {targetSelector, bytes, filename, mimeType});
}

async function dispatchMixedPaste(page, {
  targetSelector,
  filename,
  mimeType,
  text,
  textMimeType = "text/plain",
  html,
}) {
  const bytes = await readFixtureBytes(filename);
  await page.evaluate(({targetSelector, bytes, filename, mimeType, text, textMimeType, html}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const file = new File([new Uint8Array(bytes)], filename, {type: mimeType});
    const dataTransfer = new DataTransfer();
    if (text != null) dataTransfer.setData(textMimeType, text);
    if (html != null) dataTransfer.setData("text/html", html);
    dataTransfer.items.add(file);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, bytes, filename, mimeType, text, textMimeType, html});
}

async function dispatchTextPaste(page, {targetSelector, text, mimeType = "text/plain", html}) {
  await page.evaluate(({targetSelector, text, mimeType, html}) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Could not find paste target ${targetSelector}.`);

    const dataTransfer = new DataTransfer();
    if (text != null) dataTransfer.setData(mimeType, text);
    if (html != null) dataTransfer.setData("text/html", html);

    const event = new Event("paste", {bubbles: true, cancelable: true, composed: true});
    Object.defineProperty(event, "clipboardData", {
      configurable: true,
      value: dataTransfer,
    });
    target.dispatchEvent(event);
  }, {targetSelector, text, mimeType, html});
}

async function dispatchClipboardModeKeydown(page, {
  code = "KeyV",
  ctrlKey = false,
  metaKey = false,
  altKey = false,
  capsLock = false,
}) {
  await page.evaluate(({code, ctrlKey, metaKey, altKey, capsLock}) => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code,
      ctrlKey,
      metaKey,
      altKey,
    });
    Object.defineProperty(event, "getModifierState", {
      configurable: true,
      value: key => key === "CapsLock" ? capsLock : false,
    });
    document.dispatchEvent(event);
  }, {code, ctrlKey, metaKey, altKey, capsLock});
}

async function stubClipboardRead(page, items) {
  const payloads = [];

  for (const item of items) {
    const payload = {texts: item.texts || {}};
    if (item.text != null) {
      payload.texts[item.mimeType || "text/plain"] = item.text;
    }
    if (item.html != null) {
      payload.texts["text/html"] = item.html;
    }
    if (item.filename) {
      payload.file = {
        bytes: await readFixtureBytes(item.filename),
        filename: item.filename,
        mimeType: item.mimeType,
      };
    }
    payloads.push(payload);
  }

  await page.evaluate(payloads => {
    const originalClipboard = navigator.clipboard || null;
    globalThis.__clipboardImageOriginalClipboard ??= originalClipboard;

    const stubbedClipboard = Object.create(originalClipboard);
    stubbedClipboard.read = async () => payloads.map(payload => ({
      types: [
        ...Object.keys(payload.texts || {}),
        ...(payload.file ? [payload.file.mimeType] : []),
      ],
      getType: async type => {
        if (payload.texts && Object.hasOwn(payload.texts, type)) {
          return new Blob([payload.texts[type]], {type});
        }

        if (payload.file && payload.file.mimeType === type) {
          return new File([new Uint8Array(payload.file.bytes)], payload.file.filename, {
            type: payload.file.mimeType,
          });
        }

        throw new DOMException(`No clipboard item for ${type}`, "NotFoundError");
      },
    }));

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: stubbedClipboard,
    });
  }, payloads);
}

async function restoreClipboardRead(page) {
  await page.evaluate(() => {
    if (!Object.hasOwn(globalThis, "__clipboardImageOriginalClipboard")) return;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: globalThis.__clipboardImageOriginalClipboard,
    });
  });
}

async function getStateSnapshot(page) {
  return page.evaluate(() => ({
    tokens: canvas.scene.tokens.contents.map(token => ({
      id: token.id,
      name: token.name,
      actorId: token.actorId,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      hidden: token.hidden,
      flags: token.flags,
    })),
    tiles: canvas.scene.tiles.contents.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
      hidden: tile.hidden,
      video: tile.video,
    })),
    notes: canvas.scene.notes.contents.map(note => ({
      id: note.id,
      entryId: note.entryId,
      pageId: note.pageId,
      text: note.text,
      textureSrc: note.texture?.src || "",
      x: note.x,
      y: note.y,
    })),
    journals: game.journal.contents.map(entry => ({
      id: entry.id,
      name: entry.name,
      pages: entry.pages.contents.map(page => ({
        id: page.id,
        name: page.name,
        type: page.type,
        content: page.text?.content || "",
      })),
    })),
    messages: game.messages.contents.map(message => ({
      id: message.id,
      content: message.content || "",
    })),
  }));
}

async function getTokenDocument(page, id) {
  return page.evaluate(tokenId => {
    const token = canvas.scene.tokens.get(tokenId);
    if (!token) return null;
    return {
      id: token.id,
      actorId: token.actorId,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      textureSrc: token.texture.src,
      flags: token.flags,
    };
  }, id);
}

async function getTileDocument(page, id) {
  return page.evaluate(tileId => {
    const tile = canvas.scene.tiles.get(tileId);
    if (!tile) return null;
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      textureSrc: tile.texture.src,
      video: tile.video,
    };
  }, id);
}

async function getJournalEntry(page, id) {
  return page.evaluate(entryId => {
    const entry = game.journal.get(entryId);
    if (!entry) return null;
    return {
      id: entry.id,
      name: entry.name,
      pages: entry.pages.contents.map(page => ({
        id: page.id,
        name: page.name,
        type: page.type,
        content: page.text?.content || "",
      })),
    };
  }, id);
}

async function getNoteDocument(page, id) {
  return page.evaluate(noteId => {
    const note = canvas.scene.notes.get(noteId);
    if (!note) return null;
    return {
      id: note.id,
      entryId: note.entryId,
      pageId: note.pageId,
      text: note.text,
      textureSrc: note.texture?.src || "",
      x: note.x,
      y: note.y,
    };
  }, id);
}

function getNewDocuments(before, after, key) {
  const beforeIds = new Set(before[key].map(document => document.id));
  return after[key].filter(document => !beforeIds.has(document.id));
}

module.exports = {
  beginClipboardRun,
  buildSharedFoundryTest,
  clearActiveLayerClipboardObjects,
  clearCanvasMousePosition,
  cleanupClipboardRun,
  closeOwnedContext,
  closeUploadDestinationConfig,
  controlPlaceable,
  controlPlaceables,
  createAuthenticatedPage,
  createActorBackedToken,
  createTile,
  createToken,
  dispatchClipboardModeKeydown,
  dispatchFileDrop,
  dispatchFilePaste,
  dispatchMixedPaste,
  dispatchTextPaste,
  ensureUploadDirectory,
  ensureFoundryUsers,
  focusCanvas,
  focusChatInput,
  getCanvasDimensions,
  getFixturePath,
  getFixtureUrl,
  getJournalEntry,
  getNewDocuments,
  getNoteDocument,
  getSafeCanvasPoint,
  getStateSnapshot,
  getUploadDestinationSummary,
  getTileDocument,
  getTokenDocument,
  getSceneToolState,
  invokeSceneTool,
  loginToFoundry,
  openUploadDestinationConfig,
  resolveFoundryCredentials,
  resetFoundrySessions,
  resetFoundryUiState,
  restoreClipboardRead,
  restoreCorePermissions,
  releaseAllControlledPlaceables,
  restoreModuleSettings,
  setCorePermissions,
  setModuleSettings,
  setActiveLayerClipboardObjects,
  setCanvasMousePosition,
  stubClipboardRead,
};
