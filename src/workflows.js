const {CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS, CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT} = require("./constants");
const {
  _clipboardDescribeImageInput,
  _clipboardDescribePasteContext,
  _clipboardDescribeReplacementTarget,
  _clipboardLog,
  _clipboardReportError,
  _clipboardSerializeError,
  _clipboardDescribeFile,
} = require("./diagnostics");
const {
  _clipboardGetMediaKind,
  _clipboardNormalizePastedText,
  _clipboardLoadMediaDimensions,
  _clipboardGetPreferredMediaDimensions,
  _clipboardNormalizeMimeType,
  _clipboardGetFilenameExtension,
} = {
  ...require("./media"),
  ...require("./text"),
};
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardResolveImageInputBlob,
  _clipboardUploadBlob,
  _clipboardCreateFreshMediaPath,
} = require("./storage");
const {
  _clipboardResolvePasteContext,
  _clipboardCanPasteToContext,
  _clipboardPrepareCreateLayer,
  _clipboardReplaceControlledMedia,
  _clipboardHasCopiedObjects,
} = require("./context");
const {
  _clipboardReadClipboardItems,
  _clipboardExtractImageInput,
  _clipboardExtractTextInput,
} = require("./clipboard");
const {
  _clipboardCanUseCanvasMedia,
  _clipboardCanUseCanvasText,
  _clipboardCanUseChatMedia,
  _clipboardCanUseScenePasteTool,
  _clipboardCanUseSceneUploadTool,
} = require("./settings");
const {
  _clipboardEnsurePlaceableTextNote,
  _clipboardCreateStandaloneTextNote,
  _clipboardAppendTextToSceneNote,
} = require("./notes");
const {
  _clipboardPostChatImage,
} = require("./chat");
const {
  _clipboardGetFocusedArtFieldTarget,
  _clipboardPopulateArtFieldTarget,
} = require("./field-targets");
const {_clipboardGetLocked, _clipboardSetLocked} = require("./state");

function _clipboardReplacementTargetSupportsMediaKind(replacementTarget, mediaKind) {
  if (!replacementTarget?.documentName) return true;
  if (replacementTarget.documentName === "Note") return mediaKind !== "video";
  return true;
}

async function _clipboardApplyPasteResult(path, context, preferredDimensions = null) {
  const mediaKind = _clipboardGetMediaKind({src: path}) || "image";
  if (context.replacementTarget?.documents?.length &&
      !_clipboardReplacementTargetSupportsMediaKind(context.replacementTarget, mediaKind)) {
    throw new Error(`Selected ${context.replacementTarget.documentName.toLowerCase()} targets do not support pasted ${mediaKind} media.`);
  }

  if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind)) {
    _clipboardLog("info", "Applied pasted media by replacing controlled documents", {
      path,
      mediaKind,
      replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
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

async function _clipboardPasteBlob(blob, targetFolder, {contextOptions = {}, context = null} = {}) {
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasMedia()) return false;

  const resolvedContext = context || _clipboardResolvePasteContext(contextOptions);
  _clipboardLog("debug", "Resolved canvas paste context", {
    context: _clipboardDescribePasteContext(resolvedContext),
    destination: require("./diagnostics")._clipboardDescribeDestinationForLog(targetFolder),
    blob: _clipboardDescribeImageInput({blob}),
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
  return _clipboardApplyPasteResult(_clipboardCreateFreshMediaPath(uploadPath), resolvedContext, preferredDimensions);
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

function _clipboardIsBlockedDirectMediaUrlDownload(imageInput, error) {
  return Boolean(
    error?.clipboardBlockedDirectMediaUrl ||
    (
      imageInput?.url &&
      _clipboardGetMediaKind({src: imageInput.url}) &&
      error instanceof Error &&
      error.message.startsWith("Failed to download pasted media URL from ")
    )
  );
}

function _clipboardGetBlockedDirectMediaUrlError(imageInput, error) {
  if (!_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return null;

  const directMediaUrlError = new Error(
    "The pasted media URL points to a host that blocks browser-side downloads, so Foundry Paste Eater cannot download and re-upload it. Upload the file locally or use a CORS-enabled host."
  );
  directMediaUrlError.clipboardBlockedDirectMediaUrl = true;
  return directMediaUrlError;
}

function _clipboardShouldFallbackToText(imageInput, error) {
  if (_clipboardIsBlockedDirectMediaUrlDownload(imageInput, error)) return false;
  return true;
}

function _clipboardHasPasteConflict({respectCopiedObjects = true} = {}) {
  if (respectCopiedObjects && _clipboardHasCopiedObjects()) {
    _clipboardLog("warn", "Priority given to Foundry copied objects.");
    return true;
  }

  if (_clipboardGetLocked()) {
    _clipboardLog("info", "Skipping paste because the module is already handling another paste.");
    return true;
  }

  if (game.modules.get("vtta-tokenizer")?.active &&
      Object.values(ui.windows).some(windowApp => windowApp.id === "tokenizer-control")) {
    _clipboardLog("info", "Skipping paste because VTTA Tokenizer is active.");
    return true;
  }

  return false;
}

function _clipboardDescribeAttemptedMediaContent({blob, imageInput} = {}) {
  const candidateBlob = blob || imageInput?.blob || imageInput?.fallbackBlob || null;
  const candidateName = candidateBlob?.name || imageInput?.url || "";
  const candidateType = _clipboardNormalizeMimeType(candidateBlob?.type || "");
  const extension = _clipboardGetFilenameExtension(candidateName);
  const mediaKind = _clipboardGetMediaKind({
    blob: candidateBlob,
    filename: candidateName,
    mimeType: candidateType,
    src: imageInput?.url || null,
  });

  if (mediaKind === "video") return "a video";
  if (mediaKind === "image") {
    if (candidateType === "image/gif" || extension === "gif" || extension === "apng") return "an animation";
    return "an image";
  }

  return "some content";
}

function _clipboardAnnotateWorkflowError(error, metadata = {}) {
  if (!(error instanceof Error)) return error;

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null || value === "") continue;
    if (error[key] === undefined || error[key] === null || error[key] === "") {
      error[key] = value;
    }
  }

  return error;
}

async function _clipboardExecutePasteWorkflow(workflow, options = {}) {
  const {notifyError = true, respectCopiedObjects = true} = options;
  if (_clipboardHasPasteConflict({respectCopiedObjects})) return false;

  _clipboardSetLocked(true);
  _clipboardLog("debug", "Starting paste workflow", {
    options,
  });
  try {
    const result = await workflow();
    _clipboardLog("debug", "Finished paste workflow", {
      options,
      result,
    });
    return result;
  } catch (error) {
    _clipboardReportError(error, {
      operation: "execute-paste-workflow",
      details: {options},
      notifyLocal: notifyError,
      logMessage: "Failed to handle media input",
    });
    return false;
  } finally {
    _clipboardSetLocked(false);
  }
}

async function _clipboardHandleImageBlob(blob, options = {}) {
  if (!blob) return false;

  const destination = _clipboardGetUploadDestination();
  const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
  try {
    await _clipboardCreateFolderIfMissing(destination);
    return await _clipboardPasteBlob(blob, destination, {
      contextOptions: options.contextOptions,
      context,
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

async function _clipboardHandleChatImageBlob(blob) {
  if (!blob) return false;
  if (!_clipboardCanUseChatMedia()) return false;
  try {
    return await _clipboardPostChatImage(blob);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedMediaContent({blob}),
    });
  }
}

async function _clipboardHandleChatImageInput(imageInput) {
  let blob;
  try {
    blob = await _clipboardResolveImageInputBlob(imageInput);
  } catch (error) {
    const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
    if (directMediaUrlFailure) {
      if (imageInput?.fallbackBlob) {
        _clipboardLog("warn", "Direct media URL download failed; falling back to the pasted media blob for chat handling", {
          imageInput: _clipboardDescribeImageInput(imageInput),
          error: _clipboardSerializeError(error),
        });
        return _clipboardHandleChatImageBlob(imageInput.fallbackBlob);
      }

      _clipboardLog("warn", "Direct media URL cannot be posted as chat media after download failed", {
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
  return _clipboardHandleChatImageBlob(blob);
}

async function _clipboardHandleTextInput(textInput, options = {}) {
  const text = _clipboardNormalizePastedText(textInput?.text);
  if (!text) return false;
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasText()) return false;

  const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
  _clipboardLog("debug", "Handling pasted text", {
    textLength: text.length,
    context: _clipboardDescribePasteContext(context),
  });
  if (!_clipboardCanPasteToContext(context)) {
    _clipboardLog("info", "Skipping pasted text because the current context is not eligible", {
      context: _clipboardDescribePasteContext(context),
    });
    return false;
  }

  try {
    if (context.replacementTarget?.documents?.length) {
      _clipboardLog("info", "Applying pasted text to controlled placeables", {
        replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
        textLength: text.length,
      });
      for (const document of context.replacementTarget.documents) {
        if (context.replacementTarget.documentName === "Note") {
          await _clipboardAppendTextToSceneNote(document, text);
        } else {
          await _clipboardEnsurePlaceableTextNote(document, text, context.mousePos);
        }
      }
      return true;
    }

    _clipboardLog("info", "Creating a standalone text note from pasted text", {
      textLength: text.length,
      mousePos: context.mousePos,
    });
    return await _clipboardCreateStandaloneTextNote(text, context);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: "text",
    });
  }
}

async function _clipboardReadAndPasteImage(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No clipboard media was available.");
    return false;
  }

  const imageInput = await _clipboardExtractImageInput(clipItems);
  if (!imageInput) {
    if (options.notifyNoImage) ui.notifications.warn("Foundry Paste Eater: No supported media or media URL was found in the clipboard.");
    return false;
  }

  if (options.handleImageInput) return options.handleImageInput(imageInput);
  if (options.handleImageBlob) {
    const blob = await _clipboardResolveImageInputBlob(imageInput);
    if (!blob) return false;
    return options.handleImageBlob(blob);
  }

  return _clipboardHandleImageInput(imageInput, options);
}

async function _clipboardReadAndPasteClipboardContent(options = {}) {
  const clipItems = await _clipboardReadClipboardItems();
  if (!clipItems?.length) {
    if (options.notifyNoContent) ui.notifications.warn("Foundry Paste Eater: No clipboard data was available.");
    return false;
  }

  const mediaInput = await _clipboardExtractImageInput(clipItems);
  if (mediaInput) {
    if (options.handleImageInput) return options.handleImageInput(mediaInput);
    return _clipboardHandleImageInputWithTextFallback(mediaInput, options);
  }

  const textInput = await _clipboardExtractTextInput(clipItems);
  if (textInput) {
    if (options.handleTextInput) return options.handleTextInput(textInput);
    return _clipboardHandleTextInput(textInput, options);
  }

  if (options.notifyNoContent) {
    ui.notifications.warn("Foundry Paste Eater: No supported media or text was found in the clipboard.");
  }
  return false;
}

function _clipboardChooseImageFile() {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT;
    input.style.display = "none";

    const cleanup = () => {
      input.removeEventListener("change", onChange);
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
    };

    const onChange = () => {
      const [file] = Array.from(input.files || []);
      cleanup();
      resolve(file || null);
    };

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (input.files?.length) return;
        cleanup();
        resolve(null);
      }, 0);
    };

    input.addEventListener("change", onChange, {once: true});
    window.addEventListener("focus", onWindowFocus, {once: true});
    document.body.appendChild(input);
    input.click();
  });
}

async function _clipboardChooseAndHandleMediaFile({emptyMessage, selectedMessage, handler}) {
  const file = await _clipboardChooseImageFile();
  if (!file) {
    _clipboardLog("info", emptyMessage);
    return false;
  }

  _clipboardLog("info", selectedMessage, _clipboardDescribeFile(file));
  return handler(file);
}

async function _clipboardOpenUploadPicker() {
  return _clipboardChooseAndHandleMediaFile({
    emptyMessage: "Upload picker closed without selecting a file.",
    selectedMessage: "Selected a media file from the upload picker",
    handler: file => _clipboardHandleImageBlob(file, {
      contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
    }),
  });
}

async function _clipboardOpenChatUploadPicker() {
  return _clipboardChooseAndHandleMediaFile({
    emptyMessage: "Chat upload picker closed without selecting a file.",
    selectedMessage: "Selected a media file from the chat upload picker",
    handler: file => _clipboardHandleChatImageBlob(file),
  });
}

async function _clipboardHandleArtFieldImageInput(imageInput, target) {
  if (!_clipboardCanUseCanvasMedia()) return false;

  const artFieldTarget = target?.field ? target : _clipboardGetFocusedArtFieldTarget(target);
  if (!artFieldTarget) return false;

  const destination = _clipboardGetUploadDestination();
  let fieldValue = null;
  let mediaKind = _clipboardGetMediaKind({src: imageInput?.url, filename: imageInput?.blob?.name, mimeType: imageInput?.blob?.type});

  try {
    const blob = await _clipboardResolveImageInputBlob(imageInput);
    if (!blob) return false;

    mediaKind = _clipboardGetMediaKind({blob, filename: blob.name}) || mediaKind;
    if (mediaKind && !artFieldTarget.mediaKinds.includes(mediaKind)) {
      throw new Error(`The focused ${artFieldTarget.fieldName} field does not support pasted ${mediaKind} media.`);
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

function _clipboardHandleScenePasteAction() {
  if (!_clipboardCanUseScenePasteTool()) return false;
  if (!navigator.clipboard?.read) {
    ui.notifications.warn("Foundry Paste Eater: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
    return false;
  }

  _clipboardLog("info", "Invoked scene Paste Media action.", {
    activeLayer: canvas?.activeLayer?.options?.name || null,
  });
  void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteImage({
    notifyNoImage: true,
    contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS,
  }), {
    respectCopiedObjects: false,
  });
  return true;
}

function _clipboardHandleSceneUploadAction() {
  if (!_clipboardCanUseSceneUploadTool()) return false;
  _clipboardLog("info", "Invoked scene Upload Media action.", {
    activeLayer: canvas?.activeLayer?.options?.name || null,
  });
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
    respectCopiedObjects: false,
  });
  return true;
}

function _clipboardHandleChatUploadAction() {
  if (!_clipboardCanUseChatMedia()) return false;
  _clipboardLog("info", "Invoked chat Upload Media action.");
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
    respectCopiedObjects: false,
  });
  return true;
}

module.exports = {
  _clipboardApplyPasteResult,
  _clipboardPasteBlob,
  _clipboardPasteMediaPath,
  _clipboardIsBlockedDirectMediaUrlDownload,
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardShouldFallbackToText,
  _clipboardHasPasteConflict,
  _clipboardExecutePasteWorkflow,
  _clipboardHandleImageBlob,
  _clipboardHandleImageInput,
  _clipboardHandleImageInputWithTextFallback,
  _clipboardHandleChatImageBlob,
  _clipboardHandleChatImageInput,
  _clipboardHandleTextInput,
  _clipboardReadAndPasteImage,
  _clipboardReadAndPasteClipboardContent,
  _clipboardChooseImageFile,
  _clipboardChooseAndHandleMediaFile,
  _clipboardOpenUploadPicker,
  _clipboardOpenChatUploadPicker,
  _clipboardHandleArtFieldImageInput,
  _clipboardHandleScenePasteAction,
  _clipboardHandleSceneUploadAction,
  _clipboardHandleChatUploadAction,
};
