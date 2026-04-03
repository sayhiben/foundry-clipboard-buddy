// @ts-nocheck

const {CLIPBOARD_IMAGE_SOURCE_S3} = require("../constants");
const {
  _clipboardGetSourceLabel,
} = require("./destination");
const {_clipboardDescribeDestinationForLog} = require("../diagnostics");

function _clipboardIsStoragePermissionError(error) {
  const message = String(error?.message || error || "");
  return /(permission|forbidden|access denied|not authorized|not permitted|unauthorized|accessdenied|eacces)/i.test(message);
}

function _clipboardGetCurrentUserRole() {
  if (typeof game?.user?.role === "number") return game.user.role;
  if (game?.user?.isGM) return CONST?.USER_ROLES?.GAMEMASTER ?? 4;
  return CONST?.USER_ROLES?.PLAYER ?? 1;
}

function _clipboardGetCorePermissionRoles(permission) {
  const permissions = game?.settings?.get?.("core", "permissions") || {};
  const roles = permissions?.[permission];
  return Array.isArray(roles) ? roles : [];
}

function _clipboardUserHasCorePermission(permission) {
  if (game?.user?.isGM) return true;
  return _clipboardGetCorePermissionRoles(permission).includes(_clipboardGetCurrentUserRole());
}

function _clipboardHasCoreFileUploadPermissions() {
  return _clipboardUserHasCorePermission("FILES_BROWSE") &&
    _clipboardUserHasCorePermission("FILES_UPLOAD");
}

function _clipboardBuildStoragePermissionDestinationLabel(destination) {
  return destination.source === CLIPBOARD_IMAGE_SOURCE_S3
    ? `the active ${_clipboardGetSourceLabel(destination.source)} destination${destination.bucket ? ` (${destination.bucket})` : ""}`
    : `the active ${_clipboardGetSourceLabel(destination.source)} destination`;
}

function _clipboardBuildStoragePermissionResolution(destination) {
  const destinationLabel = _clipboardBuildStoragePermissionDestinationLabel(destination);
  if (!_clipboardHasCoreFileUploadPermissions()) {
    return `Have a GM open Game Settings -> Configure Permissions and enable Use File Browser plus Upload Files for this player's role. After that, verify ${destinationLabel} is writable for this player.`;
  }

  return `This user's role already has Use File Browser and Upload Files in Game Settings -> Configure Permissions. Verify backend write access for ${destinationLabel}, including any storage credentials, bucket policy, or filesystem permissions.`;
}

function _clipboardWrapStoragePermissionError(error, destination, phase) {
  if (!_clipboardIsStoragePermissionError(error)) return error;

  const wrappedError = new Error(`Foundry denied permission to ${phase} in the active storage destination.`);
  wrappedError.cause = error;
  wrappedError.clipboardSummary = `Foundry denied permission to ${phase} in the active storage destination.`;
  wrappedError.clipboardResolution = _clipboardBuildStoragePermissionResolution(destination);
  wrappedError.clipboardStoragePermission = true;
  wrappedError.clipboardStoragePermissionPhase = phase;
  wrappedError.clipboardDestination = _clipboardDescribeDestinationForLog(destination);
  return wrappedError;
}

function _clipboardAssertUploadDestination(destination) {
  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && !destination.bucket) {
    const error = new Error("S3-compatible destinations require a bucket selection.");
    error.clipboardSummary = "S3-compatible destinations require a bucket selection.";
    error.clipboardResolution = "A GM can fix this in Foundry Paste Eater's world settings by choosing a bucket for the active S3-compatible destination.";
    throw error;
  }
}

module.exports = {
  _clipboardIsStoragePermissionError,
  _clipboardGetCurrentUserRole,
  _clipboardGetCorePermissionRoles,
  _clipboardUserHasCorePermission,
  _clipboardHasCoreFileUploadPermissions,
  _clipboardBuildStoragePermissionDestinationLabel,
  _clipboardBuildStoragePermissionResolution,
  _clipboardAssertUploadDestination,
  _clipboardWrapStoragePermissionError,
};
