const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
} = require("./constants");

const CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT = 100;
const CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE = "clipboard-error-report";

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

function _clipboardDescribeFile(file) {
  if (!file) return null;

  return {
    name: file.name || null,
    type: file.type || null,
    size: file.size ?? null,
  };
}

function _clipboardDescribeDestinationForLog(destination) {
  if (!destination) return null;

  return {
    storedSource: destination.storedSource,
    source: destination.source,
    target: destination.target,
    bucket: destination.bucket || null,
    endpoint: destination.endpoint || null,
  };
}

function _clipboardDescribeReplacementTarget(replacementTarget) {
  if (!replacementTarget) return null;

  return {
    documentName: replacementTarget.documentName,
    ids: replacementTarget.documents.map(document => document.id),
    requestedCount: replacementTarget.requestedCount ?? replacementTarget.documents.length,
    blocked: Boolean(replacementTarget.blocked),
  };
}

function _clipboardDescribePasteContext(context) {
  if (!context) return null;

  const {_clipboardHasCanvasFocus} = require("./context");

  return {
    mousePos: context.mousePos,
    createDocumentName: context.createStrategy?.documentName || context.createDocumentName || null,
    replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
    requireCanvasFocus: context.requireCanvasFocus,
    hasCanvasFocus: _clipboardHasCanvasFocus(),
  };
}

function _clipboardDescribeClipboardItems(clipItems) {
  return (clipItems || []).map((item, index) => ({
    index,
    types: Array.from(item.types || []),
  }));
}

function _clipboardDescribeDataTransfer(dataTransfer) {
  if (!dataTransfer) return null;

  return {
    types: Array.from(dataTransfer.types || []),
    files: Array.from(dataTransfer.files || []).map(_clipboardDescribeFile),
    items: Array.from(dataTransfer.items || []).map(item => ({
      kind: item.kind,
      type: item.type,
    })),
  };
}

function _clipboardDescribeImageInput(imageInput) {
  if (!imageInput) return null;

  const {_clipboardGetMediaKind} = require("./media");
  if (imageInput.blob) {
    return {
      source: "blob",
      ...(_clipboardDescribeFile(imageInput.blob) || {}),
      mediaKind: _clipboardGetMediaKind({blob: imageInput.blob, filename: imageInput.blob.name}),
    };
  }

  return {
    source: "url",
    url: imageInput.url || null,
    mediaKind: _clipboardGetMediaKind({src: imageInput.url}),
  };
}

function _clipboardEscapeHtml(value) {
  return foundry?.utils?.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
}

function _clipboardSanitizeForReport(value, depth = 3, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (value instanceof Error) return _clipboardSerializeError(value);
  if (typeof File !== "undefined" && value instanceof File) return _clipboardDescribeFile(value);
  if (typeof Blob !== "undefined" && value instanceof Blob) return {
    type: value.type || null,
    size: value.size ?? null,
  };
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
  const prefix = `Clipboard Image [${level.toUpperCase()}]: ${message}`;
  if (details === undefined) {
    logger(prefix);
    return;
  }

  logger(prefix, details);
}

function _clipboardGetSocketChannel() {
  return `module.${CLIPBOARD_IMAGE_MODULE_ID}`;
}

function _clipboardCreateReportId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function _clipboardDescribeCurrentUser() {
  return {
    id: game?.user?.id || null,
    name: game?.user?.name || game?.user?.character?.name || "Unknown User",
    role: game?.user?.role ?? null,
    isGM: Boolean(game?.user?.isGM),
  };
}

function _clipboardBuildErrorReport(error, options = {}) {
  const serializedError = _clipboardSerializeError(error);
  const timestamp = new Date().toISOString();
  const shortMessage = error instanceof Error && error.message
    ? error.message
    : "Failed to handle media input. Check the console.";
  const playerMessage = options.playerMessage || `Clipboard Image: ${shortMessage}`;
  const gmMessage = options.gmMessage || "Clipboard Image encountered an error. Review the attached logfile for full details.";

  return {
    id: _clipboardCreateReportId(),
    timestamp,
    title: options.title || "Clipboard Image Error",
    operation: options.operation || null,
    playerMessage,
    gmMessage,
    summary: shortMessage,
    user: _clipboardDescribeCurrentUser(),
    world: {
      id: game?.world?.id || null,
      title: game?.world?.title || null,
    },
    browser: {
      href: globalThis.location?.href || null,
      userAgent: globalThis.navigator?.userAgent || null,
    },
    details: _clipboardSanitizeForReport(options.details || null),
    error: serializedError,
    logs: _clipboardGetLogHistory(),
  };
}

function _clipboardFormatErrorReport(report) {
  const parts = [
    "Clipboard Image Error Report",
    `Report ID: ${report.id}`,
    `Timestamp: ${report.timestamp}`,
    `Title: ${report.title}`,
    `Summary: ${report.summary}`,
    `Player Message: ${report.playerMessage}`,
    `GM Message: ${report.gmMessage}`,
    "",
    "User",
    JSON.stringify(report.user, null, 2),
    "",
    "World",
    JSON.stringify(report.world, null, 2),
    "",
    "Browser",
    JSON.stringify(report.browser, null, 2),
    "",
    "Context",
    JSON.stringify({
      operation: report.operation,
      details: report.details,
    }, null, 2),
    "",
    "Error",
    JSON.stringify(report.error, null, 2),
    "",
    "Recent Log History",
    JSON.stringify(report.logs, null, 2),
  ];

  return parts.join("\n");
}

function _clipboardCreateReportFile(report) {
  const safeTimestamp = report.timestamp.replaceAll(":", "-");
  const filename = `clipboard-image-error-${safeTimestamp}.log`;
  const content = _clipboardFormatErrorReport(report);
  const url = globalThis.URL?.createObjectURL?.(new Blob([content], {type: "text/plain"})) || "";
  return {filename, content, url};
}

function _clipboardDownloadReportFile(report) {
  const file = _clipboardCreateReportFile(report);
  if (!file.content) return file;

  if (typeof globalThis.saveDataToFile === "function") {
    globalThis.saveDataToFile(file.content, "text/plain", file.filename);
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

function _clipboardOpenGmErrorDialog(report, options = {}) {
  const file = _clipboardCreateReportFile(report);
  const userName = _clipboardEscapeHtml(report.user?.name || "Unknown User");
  const summary = _clipboardEscapeHtml(report.summary || "Unknown error");
  const playerMessage = _clipboardEscapeHtml(report.playerMessage || "Clipboard Image encountered an error.");
  const linkMarkup = file.url
    ? `<p><a href="${_clipboardEscapeHtml(file.url)}" download="${_clipboardEscapeHtml(file.filename)}" target="_blank" rel="noopener">Download module logfile</a></p>`
    : "";
  const origin = options.receivedFromSocket
    ? "Another user encountered a Clipboard Image error."
    : "This client encountered a Clipboard Image error.";
  const content = `
    <div class="clipboard-image-error-dialog">
      <p>${_clipboardEscapeHtml(origin)}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Player-facing message:</strong> ${playerMessage}</p>
      ${linkMarkup}
    </div>
  `;

  if (typeof globalThis.Dialog === "function") {
    new globalThis.Dialog({
      title: report.title || "Clipboard Image Error",
      content,
      buttons: {
        close: {
          label: "Close",
        },
      },
      default: "close",
    }).render(true);
  }

  return file;
}

function _clipboardEmitErrorReport(report) {
  if (game?.user?.isGM) return false;
  if (typeof game?.socket?.emit !== "function") return false;

  game.socket.emit(_clipboardGetSocketChannel(), {
    type: CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE,
    report,
  });
  return true;
}

function _clipboardHandleSocketReport(payload) {
  if (!payload || payload.type !== CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE) return false;
  if (!game?.user?.isGM) return false;
  if (!payload.report) return false;

  ui.notifications.error(`Clipboard Image: ${payload.report.summary}`);
  _clipboardOpenGmErrorDialog(payload.report, {receivedFromSocket: true});
  return true;
}

function _clipboardRegisterErrorReporting() {
  if (typeof game?.socket?.on !== "function") return;
  game.socket.on(_clipboardGetSocketChannel(), _clipboardHandleSocketReport);
}

function _clipboardReportError(error, options = {}) {
  _clipboardLog("error", options.logMessage || "Failed to handle media input", {
    operation: options.operation || null,
    details: options.details || null,
    error: _clipboardSerializeError(error),
  });
  const report = _clipboardBuildErrorReport(error, options);

  if (options.notifyLocal !== false) {
    ui.notifications.error(report.playerMessage);
  }

  if (game?.user?.isGM) {
    if (options.notifyLocal !== false) _clipboardOpenGmErrorDialog(report);
  } else {
    _clipboardEmitErrorReport(report);
  }

  if (options.autoDownload !== false && _clipboardVerboseLoggingEnabled()) {
    _clipboardDownloadReportFile(report);
  }

  return report;
}

module.exports = {
  _clipboardVerboseLoggingEnabled,
  _clipboardSerializeError,
  _clipboardDescribeFile,
  _clipboardDescribeDestinationForLog,
  _clipboardDescribeReplacementTarget,
  _clipboardDescribePasteContext,
  _clipboardDescribeClipboardItems,
  _clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput,
  _clipboardGetLogHistory,
  _clipboardBuildErrorReport,
  _clipboardFormatErrorReport,
  _clipboardCreateReportFile,
  _clipboardDownloadReportFile,
  _clipboardHandleSocketReport,
  _clipboardRegisterErrorReporting,
  _clipboardReportError,
  _clipboardLog,
};
