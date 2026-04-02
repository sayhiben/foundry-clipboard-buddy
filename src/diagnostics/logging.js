const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
} = require("../constants");

const CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT = 100;
const CLIPBOARD_IMAGE_LOG_HISTORY = [];

function _clipboardVerboseLoggingEnabled() {
  try {
    const settingKey = `${CLIPBOARD_IMAGE_MODULE_ID}.${CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING}`;
    if (!game?.settings?.settings?.has?.(settingKey)) return false;
    return Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING));
  } catch (error) {
    return false;
  }
}

function _clipboardSerializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function _clipboardSanitizeForReport(value, depth = 3, seen = new WeakSet()) {
  const {_clipboardDescribeFile} = require("./describers");

  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (value instanceof Error) return _clipboardSerializeError(value);
  if (typeof File !== "undefined" && value instanceof File) return _clipboardDescribeFile(value);
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return {
      type: value.type || null,
      size: value.size ?? null,
    };
  }
  if (value instanceof URL) return value.toString();
  if (depth <= 0) return "[MaxDepth]";
  if (Array.isArray(value)) return value.map(entry => _clipboardSanitizeForReport(entry, depth - 1, seen));
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = _clipboardSanitizeForReport(entry, depth - 1, seen);
  }
  seen.delete(value);
  return output;
}

function _clipboardRememberLogEntry(level, message, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  if (details !== undefined) entry.details = _clipboardSanitizeForReport(details);
  CLIPBOARD_IMAGE_LOG_HISTORY.push(entry);
  if (CLIPBOARD_IMAGE_LOG_HISTORY.length > CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT) {
    CLIPBOARD_IMAGE_LOG_HISTORY.splice(0, CLIPBOARD_IMAGE_LOG_HISTORY.length - CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT);
  }
  return entry;
}

function _clipboardGetLogHistory() {
  return CLIPBOARD_IMAGE_LOG_HISTORY.slice();
}

function _clipboardLog(level, message, details) {
  _clipboardRememberLogEntry(level, message, details);
  if ((level === "debug" || level === "info") && !_clipboardVerboseLoggingEnabled()) return;

  const logger = console[level] || console.log;
  const prefix = `Foundry Paste Eater [${level.toUpperCase()}]: ${message}`;
  if (details === undefined) {
    logger(prefix);
    return;
  }

  logger(prefix, details);
}

module.exports = {
  _clipboardVerboseLoggingEnabled,
  _clipboardSerializeError,
  _clipboardSanitizeForReport,
  _clipboardGetLogHistory,
  _clipboardLog,
};
