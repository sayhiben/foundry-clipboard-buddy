const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_SOURCE_S3,
  CLIPBOARD_IMAGE_FILE_PICKER,
} = require("../constants");
const {
  _clipboardDescribeDestinationForLog,
  _clipboardDescribeFile,
  _clipboardLog,
} = require("../diagnostics");
const {
  _clipboardCoerceMediaFile,
  _clipboardCoerceAudioFile,
  _clipboardEnsureFilenameExtension,
  _clipboardGetFileExtension,
  _clipboardGetMimeTypeFromFilename,
  _clipboardNormalizeMimeType,
  _clipboardNormalizeSvgBlobForUpload,
} = require("../media");
const {_clipboardGetFilePickerOptions} = require("./destination");
const {
  _clipboardAssertUploadDestination,
  _clipboardIsStoragePermissionError,
  _clipboardWrapStoragePermissionError,
} = require("./permissions");

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
    if (_clipboardIsStoragePermissionError(error)) {
      throw _clipboardWrapStoragePermissionError(error, destination, "create or access the upload folder");
    }

    const segments = destination.target.split("/").filter(Boolean);
    let currentPath = "";

    try {
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
    } catch (nestedError) {
      throw _clipboardWrapStoragePermissionError(nestedError, destination, "create or access the upload folder");
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

function _clipboardCreateUploadFile(blob, version = Date.now(), {coerceMedia = true, fallbackBaseName = "pasted_image"} = {}) {
  const sourceName = blob instanceof File && blob.name
    ? blob.name
    : `${fallbackBaseName}.${_clipboardGetFileExtension(blob)}`;
  const normalizedFile = coerceMedia ? _clipboardCoerceMediaFile(blob, {
    filename: sourceName,
    mimeType: blob?.type,
  }) : null;
  const resolvedName = normalizedFile?.name || _clipboardEnsureFilenameExtension(sourceName, blob);
  const resolvedType = _clipboardNormalizeMimeType(normalizedFile?.type || blob?.type)
    || _clipboardGetMimeTypeFromFilename(resolvedName);
  const filename = _clipboardCreateVersionedFilename(resolvedName, version);
  return new File([normalizedFile || blob], filename, {type: resolvedType});
}

function _clipboardCreateFreshMediaPath(path, version = Date.now()) {
  if (!path || /^(data:|blob:)/i.test(path)) return path;

  const [basePath, hash = ""] = String(path).split("#", 2);
  const separator = basePath.includes("?") ? "&" : "?";
  const freshPath = `${basePath}${separator}${encodeURIComponent(CLIPBOARD_IMAGE_MODULE_ID)}=${encodeURIComponent(String(version))}`;
  return hash ? `${freshPath}#${hash}` : freshPath;
}

async function _clipboardUploadBlob(blob, targetFolder, options = {}) {
  _clipboardAssertUploadDestination(targetFolder);
  const normalizedBlob = await _clipboardNormalizeSvgBlobForUpload(blob);
  const file = _clipboardCreateUploadFile(normalizedBlob, Date.now(), options);
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
  ).catch(error => {
    throw _clipboardWrapStoragePermissionError(error, targetFolder, "upload pasted media");
  });
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

function _clipboardCreatePdfUploadFile(blob, version = Date.now()) {
  return _clipboardCreateUploadFile(blob, version, {
    coerceMedia: false,
    fallbackBaseName: "pasted_pdf",
  });
}

function _clipboardCreateAudioUploadFile(blob, version = Date.now()) {
  const normalizedFile = _clipboardCoerceAudioFile(blob, {
    filename: blob instanceof File ? blob.name : "",
    mimeType: blob?.type,
    explicitAudioContext: true,
  });
  return _clipboardCreateUploadFile(normalizedFile || blob, version, {
    coerceMedia: false,
    fallbackBaseName: "pasted_audio",
  });
}

async function _clipboardUploadPdfBlob(blob, targetFolder) {
  return _clipboardUploadBlob(blob, targetFolder, {
    coerceMedia: false,
    fallbackBaseName: "pasted_pdf",
  });
}

async function _clipboardUploadAudioBlob(blob, targetFolder) {
  const normalizedFile = _clipboardCoerceAudioFile(blob, {
    filename: blob instanceof File ? blob.name : "",
    mimeType: blob?.type,
    explicitAudioContext: true,
  });
  return _clipboardUploadBlob(normalizedFile || blob, targetFolder, {
    coerceMedia: false,
    fallbackBaseName: "pasted_audio",
  });
}

module.exports = {
  _clipboardCreateFolderIfMissing,
  _clipboardCreateVersionedFilename,
  _clipboardCreateUploadFile,
  _clipboardCreatePdfUploadFile,
  _clipboardCreateAudioUploadFile,
  _clipboardCreateFreshMediaPath,
  _clipboardUploadBlob,
  _clipboardUploadPdfBlob,
  _clipboardUploadAudioBlob,
};
