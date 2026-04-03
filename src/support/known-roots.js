// @ts-check

const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING,
} = require("../constants");
const {
  _clipboardDescribeDestination,
  _clipboardGetConfiguredUploadRoot,
  _clipboardNormalizeUploadPathSegment,
} = require("../storage");

/**
 * @typedef {import("../contracts").UploadRoot} UploadRoot
 */

function _clipboardCreateUploadRootKey(root) {
  const storedSource = String(root?.storedSource || root?.source || "").trim() || "data";
  const bucket = String(root?.bucket || "").trim();
  const target = _clipboardNormalizeUploadPathSegment(root?.target || "", "");
  return [storedSource, bucket, target].join("|");
}

/**
 * @param {Partial<UploadRoot> | null | undefined} root
 * @returns {UploadRoot | null}
 */
function _clipboardNormalizeUploadRoot(root) {
  if (!root) return null;

  const normalizedTarget = _clipboardNormalizeUploadPathSegment(root.target || "", "");
  if (!normalizedTarget) return null;

  const normalizedRoot = {
    storedSource: String(root.storedSource || root.source || "data").trim() || "data",
    source: String(root.source || root.storedSource || "data").trim() || "data",
    target: normalizedTarget,
    bucket: String(root.bucket || "").trim(),
    endpoint: String(root.endpoint || "").trim(),
    key: "",
    label: "",
  };
  normalizedRoot.key = _clipboardCreateUploadRootKey(normalizedRoot);
  normalizedRoot.label = _clipboardDescribeDestination(normalizedRoot);
  return normalizedRoot;
}

function _clipboardParseKnownUploadRoots(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(String(rawValue));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(entry => _clipboardNormalizeUploadRoot(entry))
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function _clipboardSerializeKnownUploadRoots(roots) {
  return JSON.stringify(
    (roots || [])
      .map(entry => _clipboardNormalizeUploadRoot(entry))
      .filter(Boolean)
      .map(entry => ({
        storedSource: entry.storedSource,
        source: entry.source,
        target: entry.target,
        bucket: entry.bucket,
        endpoint: entry.endpoint,
      }))
  );
}

/**
 * @param {UploadRoot[]} roots
 * @param {Array<Partial<UploadRoot> | UploadRoot | null | undefined>} additions
 * @returns {UploadRoot[]}
 */
function _clipboardMergeKnownUploadRoots(roots, additions) {
  const merged = new Map();

  for (const root of [...(roots || []), ...(additions || [])]) {
    const normalizedRoot = _clipboardNormalizeUploadRoot(root);
    if (!normalizedRoot) continue;
    merged.set(normalizedRoot.key, normalizedRoot);
  }

  return Array.from(merged.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function _clipboardGetStoredKnownUploadRoots() {
  return _clipboardParseKnownUploadRoots(
    game?.settings?.get?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING) || "[]"
  );
}

function _clipboardGetKnownUploadRoots({includeCurrent = false} = {}) {
  const storedRoots = _clipboardGetStoredKnownUploadRoots();
  if (!includeCurrent) return storedRoots;
  return _clipboardMergeKnownUploadRoots(storedRoots, [_clipboardGetConfiguredUploadRoot()]);
}

async function _clipboardSetKnownUploadRoots(roots) {
  const serializedRoots = _clipboardSerializeKnownUploadRoots(roots);
  await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_KNOWN_UPLOAD_ROOTS_SETTING, serializedRoots);
  return _clipboardParseKnownUploadRoots(serializedRoots);
}

async function _clipboardRememberKnownUploadRoots(additions) {
  const nextRoots = _clipboardMergeKnownUploadRoots(_clipboardGetStoredKnownUploadRoots(), additions);
  const currentSerialized = _clipboardSerializeKnownUploadRoots(_clipboardGetStoredKnownUploadRoots());
  const nextSerialized = _clipboardSerializeKnownUploadRoots(nextRoots);
  if (currentSerialized === nextSerialized) return nextRoots;
  return _clipboardSetKnownUploadRoots(nextRoots);
}

async function _clipboardRememberKnownUploadRoot(root) {
  return _clipboardRememberKnownUploadRoots([root]);
}

module.exports = {
  _clipboardCreateUploadRootKey,
  _clipboardNormalizeUploadRoot,
  _clipboardParseKnownUploadRoots,
  _clipboardSerializeKnownUploadRoots,
  _clipboardMergeKnownUploadRoots,
  _clipboardGetStoredKnownUploadRoots,
  _clipboardGetKnownUploadRoots,
  _clipboardSetKnownUploadRoots,
  _clipboardRememberKnownUploadRoots,
  _clipboardRememberKnownUploadRoot,
};
