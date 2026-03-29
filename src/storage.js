const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_AUTO,
  CLIPBOARD_IMAGE_SOURCE_DATA,
  CLIPBOARD_IMAGE_SOURCE_S3,
  CLIPBOARD_IMAGE_SOURCE_FORGE,
  CLIPBOARD_IMAGE_FILE_PICKER,
} = require("./constants");
const {
  _clipboardDescribeDestinationForLog,
  _clipboardDescribeFile,
  _clipboardLog,
} = require("./diagnostics");
const {
  _clipboardNormalizeMimeType,
  _clipboardGetMimeTypeFromFilename,
  _clipboardGetMediaKind,
  _clipboardIsMediaMimeType,
  _clipboardGetFilenameFromUrl,
  _clipboardEnsureFilenameExtension,
  _clipboardGetFileExtension,
  _clipboardNormalizeSvgBlobForUpload,
} = require("./media");

function _clipboardUsingTheForge() {
  return typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge;
}

function _clipboardGetStoredSource() {
  return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source")?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
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

function _clipboardGetUploadDestination(overrides = {}) {
  const storedSource = overrides.storedSource ?? overrides.source ?? _clipboardGetStoredSource();
  const resolvedSource = _clipboardResolveSource(storedSource);
  const target = Object.hasOwn(overrides, "target")
    ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER
    : _clipboardGetTargetFolder();
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

function _clipboardAssertUploadDestination(destination) {
  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3 && !destination.bucket) {
    throw new Error("S3-compatible destinations require a bucket selection");
  }
}

async function _clipboardCreateFolderIfMissing(destination) {
  const options = _clipboardGetFilePickerOptions(destination);
  _clipboardAssertUploadDestination(destination);
  _clipboardLog("debug", "Ensuring upload destination exists", {
    destination: _clipboardDescribeDestinationForLog(destination),
  });

  if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
    _clipboardLog("debug", "Skipping directory creation for S3-compatible destination", {
      destination: _clipboardDescribeDestinationForLog(destination),
    });
    return;
  }

  try {
    await CLIPBOARD_IMAGE_FILE_PICKER.browse(destination.source, destination.target, options);
  } catch (error) {
    const segments = destination.target.split("/").filter(Boolean);
    let currentPath = "";

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      try {
        await CLIPBOARD_IMAGE_FILE_PICKER.browse(destination.source, currentPath, options);
      } catch (browseError) {
        try {
          _clipboardLog("debug", "Creating missing upload directory segment", {
            destination: _clipboardDescribeDestinationForLog(destination),
            currentPath,
          });
          await CLIPBOARD_IMAGE_FILE_PICKER.createDirectory(destination.source, currentPath, options);
        } catch (createError) {
          const message = createError instanceof Error ? createError.message : `${createError}`;
          if (!/already exists|EEXIST/i.test(message)) throw createError;
        }
      }
    }
  }

  _clipboardLog("debug", "Upload destination is ready", {
    destination: _clipboardDescribeDestinationForLog(destination),
  });
}

function _clipboardCreateVersionedFilename(filename, version = Date.now()) {
  const normalizedFilename = String(filename || "").trim() || "pasted_image";
  const extensionMatch = normalizedFilename.match(/\.([^./]+)$/);
  const extension = extensionMatch?.[1] || "";
  const baseName = extension ? normalizedFilename.slice(0, -(extension.length + 1)) : normalizedFilename;
  const suffix = encodeURIComponent(String(version));
  return extension ? `${baseName}-${suffix}.${extension}` : `${baseName}-${suffix}`;
}

function _clipboardCreateUploadFile(blob, version = Date.now()) {
  const sourceName = blob instanceof File && blob.name
    ? blob.name
    : `pasted_image.${_clipboardGetFileExtension(blob)}`;
  const filename = _clipboardCreateVersionedFilename(
    _clipboardEnsureFilenameExtension(sourceName, blob),
    version
  );
  return new File([blob], filename, {type: blob.type});
}

function _clipboardCreateFreshMediaPath(path, version = Date.now()) {
  if (!path || /^(data:|blob:)/i.test(path)) return path;

  const [basePath, hash = ""] = String(path).split("#", 2);
  const separator = basePath.includes("?") ? "&" : "?";
  const freshPath = `${basePath}${separator}${encodeURIComponent(CLIPBOARD_IMAGE_MODULE_ID)}=${encodeURIComponent(String(version))}`;
  return hash ? `${freshPath}#${hash}` : freshPath;
}

async function _clipboardUploadBlob(blob, targetFolder) {
  _clipboardAssertUploadDestination(targetFolder);
  const normalizedBlob = await _clipboardNormalizeSvgBlobForUpload(blob);
  const file = _clipboardCreateUploadFile(normalizedBlob);
  const fileDetails = _clipboardDescribeFile(file);
  _clipboardLog("info", "Uploading pasted media", {
    destination: _clipboardDescribeDestinationForLog(targetFolder),
    ...fileDetails,
  });

  const uploadResponse = await CLIPBOARD_IMAGE_FILE_PICKER.upload(
    targetFolder.source,
    targetFolder.target,
    file,
    _clipboardGetFilePickerOptions(targetFolder)
  );
  const uploadPath = uploadResponse?.path;

  if (!uploadPath) {
    _clipboardLog("error", "Upload did not return a usable path", {
      destination: _clipboardDescribeDestinationForLog(targetFolder),
      response: uploadResponse || null,
      ...fileDetails,
    });
    throw new Error("Upload failed before a usable media path was returned");
  }

  _clipboardLog("info", "Uploaded pasted media", {
    destination: _clipboardDescribeDestinationForLog(targetFolder),
    path: uploadPath,
  });

  return uploadPath;
}

async function _clipboardFetchImageUrl(url) {
  let response;
  try {
    _clipboardLog("info", "Downloading pasted media URL", {url});
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Failed to download pasted media URL from ${url}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to download pasted media URL (${response.status} ${response.statusText})`);
  }

  const blob = await response.blob();
  const filename = _clipboardGetFilenameFromUrl(url);
  const contentType = _clipboardNormalizeMimeType(response.headers.get("content-type"));
  const blobType = _clipboardNormalizeMimeType(blob.type);
  const mediaKind = _clipboardGetMediaKind({mimeType: contentType})
    || _clipboardGetMediaKind({mimeType: blobType})
    || _clipboardGetMediaKind({filename});
  if (!mediaKind) {
    throw new Error("Pasted URL did not resolve to supported media content");
  }

  const typedBlob = _clipboardIsMediaMimeType(contentType) || _clipboardIsMediaMimeType(blobType)
    ? blob
    : new Blob([blob], {type: _clipboardGetMimeTypeFromFilename(filename)});
  const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
  const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || _clipboardGetMimeTypeFromFilename(resolvedFilename);
  _clipboardLog("info", "Downloaded pasted media URL", {
    url,
    responseContentType: contentType || null,
    blobType: blobType || null,
    resolvedFilename,
    resolvedMimeType,
    size: typedBlob.size,
  });
  return new File([typedBlob], resolvedFilename, {type: resolvedMimeType});
}

async function _clipboardResolveImageInputBlob(imageInput) {
  if (!imageInput) return null;
  if (imageInput.blob) return imageInput.blob;
  if (imageInput.url) return _clipboardFetchImageUrl(imageInput.url);
  return null;
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
  _clipboardGetUploadDestination,
  _clipboardGetFilePickerOptions,
  _clipboardDescribeDestination,
  _clipboardAssertUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardCreateVersionedFilename,
  _clipboardCreateUploadFile,
  _clipboardCreateFreshMediaPath,
  _clipboardUploadBlob,
  _clipboardFetchImageUrl,
  _clipboardResolveImageInputBlob,
};
