const {
  _clipboardDescribeImageInput,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {_clipboardResolveImageInputBlob} = require("../storage");
const {_clipboardCanUseChatMedia} = require("../settings");
const {_clipboardPostChatImage} = require("../chat");
const {
  _clipboardGetBlockedDirectMediaUrlError,
  _clipboardDescribeAttemptedMediaContent,
  _clipboardAnnotateWorkflowError,
} = require("./helpers");
const {_clipboardExecutePasteWorkflow} = require("./workflow-runner");
const {_clipboardOpenChatUploadPicker} = require("./scene-tools");

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

function _clipboardHandleChatUploadAction() {
  if (!_clipboardCanUseChatMedia()) return false;
  _clipboardLog("info", "Invoked chat Upload Media/PDF action.");
  void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
    respectCopiedObjects: false,
  });
  return true;
}

module.exports = {
  _clipboardHandleChatImageBlob,
  _clipboardHandleChatImageInput,
  _clipboardHandleChatUploadAction,
};
