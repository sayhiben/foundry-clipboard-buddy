const {
  CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
} = require("../constants");
const {
  _clipboardDescribeImageInput,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {
  _clipboardGetMediaKind,
  _clipboardIsGifMedia,
  _clipboardConvertGifToStaticPng,
} = require("../media");
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardResolveImageInputBlob,
  _clipboardUploadBlob,
  _clipboardCreateFreshMediaPath,
} = require("../storage");
const {_clipboardCanUseCanvasMedia} = require("../settings");
const {
  _clipboardGetFocusedArtFieldTarget,
  _clipboardPopulateArtFieldTarget,
} = require("../field-targets");
const {
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardDescribeAttemptedMediaContent,
  _clipboardAnnotateWorkflowError,
} = require("./helpers");

function _clipboardFieldRequiresStaticTexture(fieldName = "") {
  return /(?:^|[.])texture\.src$/i.test(String(fieldName || "").trim());
}

async function _clipboardHandleArtFieldImageInput(imageInput, target) {
  if (!_clipboardCanUseCanvasMedia()) return false;

  const artFieldTarget = target?.field ? target : _clipboardGetFocusedArtFieldTarget(target);
  if (!artFieldTarget) return false;

  const destination = _clipboardGetUploadDestination({
    uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_DOCUMENT_ART,
  });
  let fieldValue = null;
  let mediaKind = _clipboardGetMediaKind({src: imageInput?.url, filename: imageInput?.blob?.name, mimeType: imageInput?.blob?.type});

  try {
    let blob = await _clipboardResolveImageInputBlob(imageInput);
    if (!blob) return false;

    mediaKind = _clipboardGetMediaKind({blob, filename: blob.name}) || mediaKind;
    if (mediaKind && !artFieldTarget.mediaKinds.includes(mediaKind)) {
      throw new Error(`The focused ${artFieldTarget.fieldName} field does not support pasted ${mediaKind} media.`);
    }

    if (_clipboardFieldRequiresStaticTexture(artFieldTarget.fieldName) &&
        _clipboardIsGifMedia({blob, filename: blob?.name, mimeType: blob?.type})) {
      blob = await _clipboardConvertGifToStaticPng(blob);
      mediaKind = _clipboardGetMediaKind({blob, filename: blob.name}) || mediaKind;
    }

    await _clipboardCreateFolderIfMissing(destination);
    const uploadPath = await _clipboardUploadBlob(blob, destination);
    fieldValue = _clipboardCreateFreshMediaPath(uploadPath);
  } catch (error) {
    const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
    if (!directMediaUrlFailure || !imageInput?.url) {
      throw _clipboardAnnotateWorkflowError(error, {
        clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({imageInput}),
      });
    }

    if (imageInput?.fallbackBlob) {
      _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for a focused art field", {
        fieldName: artFieldTarget.fieldName,
        documentName: artFieldTarget.documentName,
        imageInput: _clipboardDescribeImageInput(imageInput),
        error: _clipboardSerializeError(error),
      });

      await _clipboardCreateFolderIfMissing(destination);
      const uploadPath = await _clipboardUploadBlob(imageInput.fallbackBlob, destination);
      fieldValue = _clipboardCreateFreshMediaPath(uploadPath);
      return _clipboardPopulateArtFieldTarget(artFieldTarget, fieldValue, imageInput);
    }

    mediaKind = _clipboardGetMediaKind({src: imageInput.url}) || mediaKind;
    if (mediaKind && !artFieldTarget.mediaKinds.includes(mediaKind)) {
      throw _clipboardAnnotateWorkflowError(
        new Error(`The focused ${artFieldTarget.fieldName} field does not support pasted ${mediaKind} media.`),
        {
          clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({imageInput}),
        }
      );
    }

    fieldValue = imageInput.url;
    _clipboardLog("warn", "Falling back to the original direct media URL for a focused art field after download failed", {
      fieldName: artFieldTarget.fieldName,
      documentName: artFieldTarget.documentName,
      imageInput: _clipboardDescribeImageInput(imageInput),
      error: _clipboardSerializeError(error),
    });
  }

  try {
    return await _clipboardPopulateArtFieldTarget(artFieldTarget, fieldValue, imageInput);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({imageInput}),
    });
  }
}

module.exports = {
  _clipboardHandleArtFieldImageInput,
};
