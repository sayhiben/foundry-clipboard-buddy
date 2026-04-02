const {CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY} = require("../constants");
const {
  _clipboardDescribeImageInput,
  _clipboardDescribePasteContext,
  _clipboardDescribeReplacementTarget,
  _clipboardDescribeDestinationForLog,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {
  _clipboardGetMediaKind,
  _clipboardNormalizePastedText,
  _clipboardLoadMediaDimensions,
  _clipboardGetPreferredMediaDimensions,
} = {
  ...require("../media"),
  ...require("../text"),
};
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardResolveImageInputBlob,
  _clipboardUploadBlob,
  _clipboardCreateFreshMediaPath,
} = require("../storage");
const {
  _clipboardResolvePasteContext,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
  _clipboardReplaceControlledMedia,
} = require("../context");
const {_clipboardCanUseCanvasMedia} = require("../settings");
const {_clipboardHandleTextInput} = require("./text-workflows");
const {
  _clipboardShouldFallbackToText,
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardIsBlockedDirectMediaUrlDownload,
  _clipboardDescribeAttemptedMediaContent,
  _clipboardAnnotateWorkflowError,
} = require("./helpers");
const {_clipboardResolveTokenReplacementBehavior} = require("./token-modes");

function _clipboardReplacementTargetSupportsMediaKind(replacementTarget, mediaKind) {
  if (!replacementTarget?.documentName) return true;
  if (replacementTarget.documentName === "Note") return mediaKind !== "video";
  return true;
}

async function _clipboardApplyPasteResult(path, context, preferredDimensions = null, options = {}) {
  const mediaKind = _clipboardGetMediaKind({src: path}) || "image";
  if (context.replacementTarget?.documents?.length &&
      !_clipboardReplacementTargetSupportsMediaKind(context.replacementTarget, mediaKind)) {
    throw new Error(`Selected ${context.replacementTarget.documentName.toLowerCase()} targets do not support pasted ${mediaKind} media.`);
  }

  if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind, options.replacementBehavior)) {
    _clipboardLog("info", "Applied pasted media by replacing controlled documents", {
      path,
      mediaKind,
      replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
      replacementMode: options.replacementBehavior?.mode || CLIPBOARD_IMAGE_SELECTED_TOKEN_PASTE_MODE_SCENE_ONLY,
    });
    return true;
  }

  const {width: imgWidth, height: imgHeight} = preferredDimensions || await _clipboardLoadMediaDimensions(path);
  const createData = await context.createStrategy.createData({
    path,
    imgWidth,
    imgHeight,
    mediaKind,
    mousePos: context.mousePos,
  });
  await canvas.scene.createEmbeddedDocuments(context.createStrategy.documentName, createData);
  _clipboardLog("info", "Applied pasted media by creating new documents", {
    path,
    mediaKind,
    documentName: context.createStrategy.documentName,
    createCount: createData.length,
    mousePos: context.mousePos,
  });
  return true;
}

async function _clipboardPasteBlob(blob, targetFolder, {contextOptions = {}, context = null, replacementBehavior = null} = {}) {
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasMedia()) return false;

  const resolvedContext = context || _clipboardResolvePasteContext(contextOptions);
  const mediaKind = _clipboardGetMediaKind({blob, filename: blob?.name}) || "image";
  const resolvedReplacementBehavior = replacementBehavior ||
    await _clipboardResolveTokenReplacementBehavior(resolvedContext, mediaKind);
  _clipboardLog("debug", "Resolved canvas paste context", {
    context: _clipboardDescribePasteContext(resolvedContext),
    destination: _clipboardDescribeDestinationForLog(targetFolder),
    blob: _clipboardDescribeImageInput({blob}),
    replacementMode: resolvedReplacementBehavior.mode,
  });
  if (!_clipboardCanPasteToContext(resolvedContext)) {
    _clipboardLog("info", "Skipping canvas paste because the current context is not eligible", {
      context: _clipboardDescribePasteContext(resolvedContext),
    });
    return false;
  }

  _clipboardPrepareCreateLayer(resolvedContext);
  const preferredDimensions = await _clipboardGetPreferredMediaDimensions(blob);
  const uploadPath = await _clipboardUploadBlob(blob, targetFolder);
  return _clipboardApplyPasteResult(_clipboardCreateFreshMediaPath(uploadPath), resolvedContext, preferredDimensions, {
    replacementBehavior: resolvedReplacementBehavior,
  });
}

async function _clipboardPasteMediaPath(path, contextOptions = {}) {
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasMedia()) return false;

  const context = _clipboardResolvePasteContext(contextOptions);
  _clipboardLog("debug", "Resolved direct media URL paste context", {
    context: _clipboardDescribePasteContext(context),
    path,
    mediaKind: _clipboardGetMediaKind({src: path}) || null,
  });
  if (!_clipboardCanPasteToContext(context)) {
    _clipboardLog("info", "Skipping direct media URL paste because the current context is not eligible", {
      context: _clipboardDescribePasteContext(context),
      path,
    });
    return false;
  }

  _clipboardPrepareCreateLayer(context);
  return _clipboardApplyPasteResult(path, context);
}

async function _clipboardHandleImageBlob(blob, options = {}) {
  if (!blob) return false;

  const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
  const mediaKind = _clipboardGetMediaKind({blob, filename: blob?.name}) || "image";
  const replacementBehavior = options.replacementBehavior ||
    await _clipboardResolveTokenReplacementBehavior(context, mediaKind);
  const destination = _clipboardGetUploadDestination({
    uploadContext: replacementBehavior.uploadContext,
  });
  try {
    await _clipboardCreateFolderIfMissing(destination);
    return await _clipboardPasteBlob(blob, destination, {
      contextOptions: options.contextOptions,
      context,
      replacementBehavior,
    });
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({blob}),
    });
  }
}

async function _clipboardHandleImageInput(imageInput, options = {}) {
  _clipboardLog("debug", "Handling media input", {
    imageInput: _clipboardDescribeImageInput(imageInput),
  });
  let blob;
  try {
    blob = await _clipboardResolveImageInputBlob(imageInput);
  } catch (error) {
    const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
    if (directMediaUrlFailure) {
      if (imageInput?.fallbackBlob) {
        _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for canvas handling", {
          imageInput: _clipboardDescribeImageInput(imageInput),
          error: _clipboardSerializeError(error),
        });
        return _clipboardHandleImageBlob(imageInput.fallbackBlob, options);
      }

      _clipboardLog("warn", "Direct media URL cannot be used on the canvas after download failed", {
        imageInput: _clipboardDescribeImageInput(imageInput),
        error: _clipboardSerializeError(error),
      });
      throw _clipboardAnnotateWorkflowError(directMediaUrlFailure, {
        clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({imageInput}),
      });
    }
    throw error;
  }
  if (!blob) return false;
  return _clipboardHandleImageBlob(blob, options);
}

async function _clipboardHandleImageInputWithTextFallback(imageInput, options = {}) {
  try {
    return await _clipboardHandleImageInput(imageInput, options);
  } catch (error) {
    if (!_clipboardShouldFallbackToText(imageInput, error)) throw error;

    const fallbackText = _clipboardNormalizePastedText(imageInput?.text || imageInput?.url || "");
    if (!fallbackText) throw error;

    _clipboardLog("info", "Falling back to pasted text after media handling failed.", {
      imageInput: _clipboardDescribeImageInput(imageInput),
      error: _clipboardSerializeError(error),
    });
    return _clipboardHandleTextInput({text: fallbackText}, options);
  }
}

module.exports = {
  _clipboardApplyPasteResult,
  _clipboardPasteBlob,
  _clipboardPasteMediaPath,
  _clipboardIsBlockedDirectMediaUrlDownload,
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardShouldFallbackToText,
  _clipboardHandleImageBlob,
  _clipboardHandleImageInput,
  _clipboardHandleImageInputWithTextFallback,
};
