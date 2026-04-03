// @ts-nocheck

const {CLIPBOARD_IMAGE_MODULE_ID} = require("../constants");
const {
  _clipboardVerboseLoggingEnabled,
  _clipboardSerializeError,
  _clipboardSanitizeForReport,
  _clipboardGetLogHistory,
  _clipboardLog,
} = require("./logging");
const {_clipboardEscapeHtml} = require("./describers");

const CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE = "clipboard-error-report";

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

function _clipboardGetAttemptedContentSummary(error, options = {}) {
  return options.contentSummary ||
    error?.clipboardContentSummary ||
    "some content";
}

function _clipboardGetErrorResolution(error, options = {}) {
  const resolution = options.resolution || error?.clipboardResolution || "";
  return String(resolution || "").trim();
}

function _clipboardGetErrorSummary(error) {
  if (typeof error?.clipboardSummary === "string" && error.clipboardSummary.trim()) {
    return error.clipboardSummary.trim();
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to handle media input. Check the console.";
}

function _clipboardBuildAttemptDescription(userName, contentSummary) {
  return `${userName || "Someone"} attempted to paste ${contentSummary || "some content"}`;
}

function _clipboardBuildErrorReport(error, options = {}) {
  const serializedError = _clipboardSerializeError(error);
  const timestamp = new Date().toISOString();
  const shortMessage = _clipboardGetErrorSummary(error);
  const user = _clipboardDescribeCurrentUser();
  const contentSummary = _clipboardGetAttemptedContentSummary(error, options);
  const attemptDescription = _clipboardBuildAttemptDescription(user.name, contentSummary);
  const resolution = _clipboardGetErrorResolution(error, options);
  const broadcastMessage = `${attemptDescription} but encountered an error: ${shortMessage}`;
  const playerMessage = options.playerMessage || (resolution ? `${broadcastMessage} ${resolution}` : broadcastMessage);
  const gmMessage = options.gmMessage || (
    resolution
      ? `${attemptDescription}. ${resolution}`
      : "Foundry Paste Eater encountered an error. Review the attached logfile for full details."
  );

  return {
    id: _clipboardCreateReportId(),
    timestamp,
    title: options.title || "Foundry Paste Eater Error",
    operation: options.operation || null,
    contentSummary,
    attemptDescription,
    broadcastMessage,
    playerMessage,
    gmMessage,
    resolution,
    summary: shortMessage,
    user,
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
    "Foundry Paste Eater Error Report",
    `Report ID: ${report.id}`,
    `Timestamp: ${report.timestamp}`,
    `Title: ${report.title}`,
    `Summary: ${report.summary}`,
    `Attempt: ${report.attemptDescription}`,
    `Content: ${report.contentSummary}`,
    `Broadcast Message: ${report.broadcastMessage}`,
    `Player Message: ${report.playerMessage}`,
    `GM Message: ${report.gmMessage}`,
    `Resolution: ${report.resolution}`,
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
  const filename = `foundry-paste-eater-error-${safeTimestamp}.log`;
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
  const attemptDescription = _clipboardEscapeHtml(report.attemptDescription || `${userName} attempted to paste some content`);
  const playerMessage = _clipboardEscapeHtml(report.playerMessage || "Foundry Paste Eater encountered an error.");
  const gmMessage = _clipboardEscapeHtml(report.gmMessage || "Review the attached logfile for full details.");
  const linkMarkup = file.url
    ? `<p><a href="${_clipboardEscapeHtml(file.url)}" download="${_clipboardEscapeHtml(file.filename)}" target="_blank" rel="noopener">Download module logfile</a></p>`
    : "";
  const origin = options.receivedFromSocket
    ? "Another user encountered a Foundry Paste Eater error."
    : "This client encountered a Foundry Paste Eater error.";
  const content = `
    <div class="foundry-paste-eater-error-dialog">
      <p>${_clipboardEscapeHtml(origin)}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Attempt:</strong> ${attemptDescription}</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Player-facing message:</strong> ${playerMessage}</p>
      <p><strong>GM guidance:</strong> ${gmMessage}</p>
      ${linkMarkup}
    </div>
  `;

  if (typeof globalThis.Dialog === "function") {
    new globalThis.Dialog({
      title: report.title || "Foundry Paste Eater Error",
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

  ui.notifications.error(payload.report.playerMessage || payload.report.broadcastMessage || payload.report.summary);
  _clipboardOpenGmErrorDialog(payload.report, {receivedFromSocket: true});
  return true;
}

function _clipboardRegisterErrorReporting() {
  if (typeof game?.socket?.on !== "function") return;
  const channel = _clipboardGetSocketChannel();
  const registeredChannels = game.socket.__clipboardRegisteredChannels instanceof Set
    ? game.socket.__clipboardRegisteredChannels
    : new Set();
  if (registeredChannels.has(channel)) return;

  game.socket.on(channel, _clipboardHandleSocketReport);
  registeredChannels.add(channel);
  game.socket.__clipboardRegisteredChannels = registeredChannels;
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
  _clipboardBuildErrorReport,
  _clipboardFormatErrorReport,
  _clipboardCreateReportFile,
  _clipboardDownloadReportFile,
  _clipboardOpenGmErrorDialog,
  _clipboardEmitErrorReport,
  _clipboardHandleSocketReport,
  _clipboardRegisterErrorReporting,
  _clipboardReportError,
};
