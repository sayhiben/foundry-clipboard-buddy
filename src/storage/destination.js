const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_AUTO,
  CLIPBOARD_IMAGE_SOURCE_DATA,
  CLIPBOARD_IMAGE_SOURCE_S3,
  CLIPBOARD_IMAGE_SOURCE_FORGE,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT,
  CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT,
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
} = require("../constants");

/**
 * @typedef {import("../contracts").UploadDestination} UploadDestination
 */

function _clipboardUsingTheForge() {
  return typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge;
}

function _clipboardGetStoredSource() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source")?.trim() || CLIPBOARD_IMAGE_SOURCE_DATA;
}

function _clipboardResolveSource(source) {
  if (!source || source === CLIPBOARD_IMAGE_SOURCE_AUTO) {
    return _clipboardUsingTheForge() ? CLIPBOARD_IMAGE_SOURCE_FORGE : CLIPBOARD_IMAGE_SOURCE_DATA;
  }

  if (source === CLIPBOARD_IMAGE_SOURCE_FORGE && !_clipboardUsingTheForge()) {
    return CLIPBOARD_IMAGE_SOURCE_DATA;
  }

  return source;
}

function _clipboardGetSourceLabel(source) {
  switch (source) {
    case CLIPBOARD_IMAGE_SOURCE_AUTO:
      return "Automatic";
    case CLIPBOARD_IMAGE_SOURCE_DATA:
      return "User Data";
    case CLIPBOARD_IMAGE_SOURCE_S3:
      return "S3-Compatible Storage";
    case CLIPBOARD_IMAGE_SOURCE_FORGE:
      return "The Forge";
    default:
      return source;
  }
}

function _clipboardGetSourceChoices(currentSource = _clipboardGetStoredSource()) {
  const choices = {
    [CLIPBOARD_IMAGE_SOURCE_AUTO]: `Automatic (${_clipboardGetSourceLabel(_clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO))})`,
    [CLIPBOARD_IMAGE_SOURCE_DATA]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_DATA),
    [CLIPBOARD_IMAGE_SOURCE_S3]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_S3),
  };

  if (_clipboardUsingTheForge()) {
    choices[CLIPBOARD_IMAGE_SOURCE_FORGE] = _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_FORGE);
  }

  if (currentSource && !Object.hasOwn(choices, currentSource)) {
    choices[currentSource] = `Custom (${currentSource})`;
  }

  return choices;
}

function _clipboardCanSelectSource(source) {
  return source !== "public";
}

function _clipboardGetStoredBucket() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket")?.trim() || "";
}

function _clipboardGetConfiguredS3Endpoint() {
  const endpoint = game?.data?.files?.s3?.endpoint;
  if (!endpoint) return "";
  if (typeof endpoint === "string") return endpoint.trim();
  if (typeof endpoint?.href === "string") return endpoint.href.trim();
  if (typeof endpoint?.url === "string") return endpoint.url.trim();
  return `${endpoint}`.trim();
}

function _clipboardGetTargetFolder() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location")?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
}

function _clipboardGetUploadPathOrganizationSetting() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_SETTING)?.trim() ||
    CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_FLAT;
}

function _clipboardGetUploadContextSegment(uploadContext) {
  switch (uploadContext) {
    case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT:
      return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CHAT;
    case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART:
      return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART;
    case CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS:
    default:
      return CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS;
  }
}

function _clipboardNormalizeUploadPathSegment(value, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
  return normalized || fallback;
}

function _clipboardBuildOrganizedUploadTarget(baseTarget, {
  organizationMode = _clipboardGetUploadPathOrganizationSetting(),
  uploadContext = CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
  userId = game?.user?.id || "user",
  date = new Date(),
} = {}) {
  const normalizedBaseTarget = _clipboardNormalizeUploadPathSegment(baseTarget, CLIPBOARD_IMAGE_DEFAULT_FOLDER);
  if (organizationMode !== CLIPBOARD_IMAGE_UPLOAD_PATH_ORGANIZATION_CONTEXT_USER_MONTH) {
    return normalizedBaseTarget;
  }

  const resolvedDate = date instanceof Date && !Number.isNaN(date.valueOf()) ? date : new Date();
  const monthSegment = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, "0")}`;

  return [
    normalizedBaseTarget,
    _clipboardGetUploadContextSegment(uploadContext),
    _clipboardNormalizeUploadPathSegment(userId, "user"),
    monthSegment,
  ].join("/");
}

/**
 * @param {Partial<UploadDestination> & {source?: string, target?: string}} [overrides]
 * @returns {UploadDestination}
 */
function _clipboardGetConfiguredUploadRoot(overrides = {}) {
  const storedSource = overrides.storedSource ?? overrides.source ?? _clipboardGetStoredSource();
  const resolvedSource = _clipboardResolveSource(storedSource);
  const target = _clipboardNormalizeUploadPathSegment(
    Object.hasOwn(overrides, "target")
      ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER
      : _clipboardGetTargetFolder(),
    CLIPBOARD_IMAGE_DEFAULT_FOLDER
  );
  const bucket = resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3
    ? (Object.hasOwn(overrides, "bucket") ? overrides.bucket?.trim() || "" : _clipboardGetStoredBucket())
    : "";

  return {
    storedSource,
    source: resolvedSource,
    target,
    bucket,
    endpoint: resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? _clipboardGetConfiguredS3Endpoint() : "",
  };
}

function _clipboardGetUploadDestination(overrides = {}) {
  const configuredRoot = _clipboardGetConfiguredUploadRoot(overrides);
  const target = _clipboardBuildOrganizedUploadTarget(configuredRoot.target, {
    organizationMode: overrides.organizationMode ?? _clipboardGetUploadPathOrganizationSetting(),
    uploadContext: overrides.uploadContext ?? CLIPBOARD_IMAGE_UPLOAD_CONTEXT_CANVAS,
    userId: overrides.userId ?? game?.user?.id ?? "user",
    date: overrides.date,
  });

  return {
    storedSource: configuredRoot.storedSource,
    source: configuredRoot.source,
    target,
    bucket: configuredRoot.bucket,
    endpoint: configuredRoot.endpoint,
  };
}

function _clipboardGetFilePickerOptions(destination) {
  const options = {};
  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && destination.bucket) {
    options.bucket = destination.bucket;
  }
  return options;
}

function _clipboardDescribeDestination(destination) {
  if (destination.storedSource === CLIPBOARD_IMAGE_SOURCE_AUTO) {
    return `${_clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_AUTO)} (${_clipboardGetSourceLabel(destination.source)}) / ${destination.target}`;
  }

  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
    const bucket = destination.bucket || "(select a bucket)";
    return `${_clipboardGetSourceLabel(destination.source)} / ${bucket} / ${destination.target}`;
  }

  return `${_clipboardGetSourceLabel(destination.source)} / ${destination.target}`;
}

module.exports = {
  _clipboardUsingTheForge,
  _clipboardGetStoredSource,
  _clipboardResolveSource,
  _clipboardGetSourceLabel,
  _clipboardGetSourceChoices,
  _clipboardCanSelectSource,
  _clipboardGetStoredBucket,
  _clipboardGetConfiguredS3Endpoint,
  _clipboardGetTargetFolder,
  _clipboardGetUploadPathOrganizationSetting,
  _clipboardGetUploadContextSegment,
  _clipboardNormalizeUploadPathSegment,
  _clipboardBuildOrganizedUploadTarget,
  _clipboardGetConfiguredUploadRoot,
  _clipboardGetUploadDestination,
  _clipboardGetFilePickerOptions,
  _clipboardDescribeDestination,
};
