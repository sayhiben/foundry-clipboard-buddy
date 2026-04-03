// @ts-check

const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_TITLE,
} = require("../constants");
const {
  CLIPBOARD_IMAGE_SETTINGS_SCHEMA,
  _clipboardGetSetting,
  _clipboardGetShippedDefaultValue,
} = require("../settings/schema");
const {_clipboardGetLogHistory} = require("../diagnostics");
const {_clipboardGetKnownUploadRoots} = require("./known-roots");
const {
  _clipboardGetBrowserContextSummary,
  _clipboardGetModuleVersion,
  _clipboardGetReadinessReport,
} = require("./readiness");
const {_clipboardGetConfiguredUploadRoot} = require("../storage");
const {_clipboardNormalizeUploadRoot} = require("./known-roots");

/**
 * @typedef {import("../contracts").SupportBundle} SupportBundle
 */

const CLIPBOARD_IMAGE_SUPPORT_REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "cookies",
  "password",
  "sessiontoken",
  "secretaccesskey",
  "storagestate",
  "token",
]);

function _clipboardStripUrlSecrets(value) {
  if (typeof value !== "string") return value;
  if (!/^https?:\/\//i.test(value)) return value;

  try {
    const parsedUrl = new URL(value);
    parsedUrl.username = "";
    parsedUrl.password = "";
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch (_error) {
    return value;
  }
}

function _clipboardRedactSupportSecrets(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) return _clipboardStripUrlSecrets(value);
    return value.replace(/https?:\/\/[^\s"'\\]+/gi, match => _clipboardStripUrlSecrets(match));
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(entry => _clipboardRedactSupportSecrets(entry, seen));
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = String(key || "").replace(/[^a-z]/gi, "").toLowerCase();
    if (CLIPBOARD_IMAGE_SUPPORT_REDACTED_KEYS.has(normalizedKey)) {
      output[key] = "[Redacted]";
      continue;
    }
    output[key] = _clipboardRedactSupportSecrets(entry, seen);
  }
  seen.delete(value);
  return output;
}

function _clipboardGetSupportSettingsSnapshot() {
  return CLIPBOARD_IMAGE_SETTINGS_SCHEMA.map(setting => {
    const value = _clipboardGetSetting(setting.key);
    const defaultValue = _clipboardGetShippedDefaultValue(setting.key);
    return {
      key: setting.key,
      name: setting.name,
      scope: setting.scope,
      config: setting.config,
      value: _clipboardRedactSupportSecrets(value),
      defaultValue: _clipboardRedactSupportSecrets(defaultValue),
      differsFromDefault: value !== defaultValue,
    };
  });
}

/**
 * @returns {SupportBundle}
 */
function _clipboardCollectSupportBundle() {
  const browser = _clipboardGetBrowserContextSummary();
  return {
    generatedAt: new Date().toISOString(),
    module: {
      id: CLIPBOARD_IMAGE_MODULE_ID,
      title: CLIPBOARD_IMAGE_TITLE,
      version: _clipboardGetModuleVersion(),
    },
    foundry: {
      version: game?.release?.version || game?.version || null,
    },
    world: {
      id: game?.world?.id || null,
      title: game?.world?.title || null,
    },
    browser: {
      href: _clipboardStripUrlSecrets(browser.href || ""),
      userAgent: browser.userAgent,
      isSecureContext: browser.isSecureContext,
      clipboardReadAvailable: browser.clipboardReadAvailable,
    },
    readiness: _clipboardRedactSupportSecrets(_clipboardGetReadinessReport()),
    storage: {
      currentDestination: _clipboardRedactSupportSecrets(_clipboardNormalizeUploadRoot(_clipboardGetConfiguredUploadRoot())),
      knownUploadRoots: _clipboardRedactSupportSecrets(_clipboardGetKnownUploadRoots({includeCurrent: true})),
    },
    settings: _clipboardGetSupportSettingsSnapshot(),
    logs: _clipboardRedactSupportSecrets(_clipboardGetLogHistory()),
  };
}

function _clipboardCreateSupportBundleFile(bundle = _clipboardCollectSupportBundle()) {
  const safeTimestamp = bundle.generatedAt.replaceAll(":", "-");
  const filename = `foundry-paste-eater-support-${safeTimestamp}.json`;
  const content = JSON.stringify(bundle, null, 2);
  const url = globalThis.URL?.createObjectURL?.(new Blob([content], {type: "application/json"})) || "";
  return {filename, content, url};
}

function _clipboardDownloadSupportBundle(bundle = _clipboardCollectSupportBundle()) {
  const file = _clipboardCreateSupportBundleFile(bundle);
  if (!file.content) return file;

  if (typeof globalThis.saveDataToFile === "function") {
    globalThis.saveDataToFile(file.content, "application/json", file.filename);
    return file;
  }

  if (file.url && globalThis.document?.body) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  return file;
}

module.exports = {
  _clipboardStripUrlSecrets,
  _clipboardRedactSupportSecrets,
  _clipboardGetSupportSettingsSnapshot,
  _clipboardCollectSupportBundle,
  _clipboardCreateSupportBundleFile,
  _clipboardDownloadSupportBundle,
};
