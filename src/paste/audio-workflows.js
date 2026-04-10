const {CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO} = require("../constants");
const {
  _clipboardDescribeDestinationForLog,
  _clipboardLog,
  _clipboardSerializeError,
} = require("../diagnostics");
const {
  _clipboardGetFilenameExtension,
  _clipboardGetFilenameFromUrl,
  _clipboardNormalizeAudioExtension,
  _clipboardNormalizeMimeType,
} = require("../media");
const {_clipboardLooksLikeAudioUrl} = require("../clipboard");
const {
  _clipboardGetUploadDestination,
  _clipboardCreateFolderIfMissing,
  _clipboardResolveAudioInputBlob,
  _clipboardUploadAudioBlob,
  _clipboardCreateFreshMediaPath,
} = require("../storage");
const {
  _clipboardCanUserModifyDocument,
  _clipboardHasCanvasFocus,
  _clipboardIsMouseWithinCanvas,
  _clipboardResolvePasteContext,
} = require("../context");
const {
  _clipboardCanUseCanvasMedia,
  _clipboardCanUseChatMedia,
} = require("../settings");
const {_clipboardGetHiddenMode} = require("../state");
const {_clipboardCreateAudioChatMessage} = require("../chat");
const {
  _clipboardGetFocusedAudioFieldTarget,
  _clipboardGetPlaylistTargetFromElement,
  _clipboardPopulateAudioFieldTarget,
} = require("../field-targets");
const {_clipboardAnnotateWorkflowError} = require("./helpers");

const CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME = "Pasted Audio";

function _clipboardDescribeAudioInput(audioInput) {
  if (!audioInput) return null;
  if (audioInput.blob) {
    return {
      source: "blob",
      name: audioInput.blob.name || null,
      type: audioInput.blob.type || null,
      size: audioInput.blob.size ?? null,
    };
  }
  return {
    source: "url",
    url: audioInput.url || null,
  };
}

function _clipboardGetAudioFilename(audioInput = {}, blob = null) {
  const candidate = blob?.name ||
    audioInput.blob?.name ||
    _clipboardGetFilenameFromUrl(audioInput.url) ||
    "Pasted Audio.mp3";
  const extension = _clipboardNormalizeAudioExtension(_clipboardGetFilenameExtension(candidate));
  if (extension) return candidate.replace(/\.(midi)(?=$|[?#])/i, ".mid");
  return `${candidate.replace(/\.[^./]+$/, "") || "Pasted Audio"}.mp3`;
}

function _clipboardGetAudioDisplayName(audioInput = {}, blob = null) {
  return _clipboardGetAudioFilename(audioInput, blob).replace(/\.[^./]+$/i, "") || "Pasted Audio";
}

function _clipboardIsBlockedDirectAudioUrlDownload(audioInput, error) {
  return Boolean(
    error?.clipboardBlockedDirectAudioUrl ||
    (
      audioInput?.url &&
      error instanceof Error &&
      error.message.startsWith("Failed to download pasted audio URL from ")
    )
  );
}

function _clipboardCanUseExternalAudioUrlFallback(audioInput, error) {
  return Boolean(
    _clipboardIsBlockedDirectAudioUrlDownload(audioInput, error) &&
    _clipboardLooksLikeAudioUrl(audioInput.url, {explicitAudioContext: true})
  );
}

function _clipboardDescribeAttemptedAudioContent({blob, audioInput} = {}) {
  const candidateBlob = blob || audioInput?.blob || null;
  const candidateType = _clipboardNormalizeMimeType(candidateBlob?.type || "");
  if (candidateType) return `audio (${candidateType})`;
  return "audio";
}

async function _clipboardResolveAudioResource(audioInput) {
  if (!audioInput) return null;

  let blob = audioInput.blob || null;
  let external = false;
  let src = "";

  try {
    blob = blob || await _clipboardResolveAudioInputBlob(audioInput, {
      explicitAudioContext: true,
    });
  } catch (error) {
    if (!_clipboardCanUseExternalAudioUrlFallback(audioInput, error)) throw error;

    external = true;
    src = audioInput.url;
    _clipboardLog("warn", "Direct audio URL download failed; falling back to the original audio URL", {
      audioInput: _clipboardDescribeAudioInput(audioInput),
      error: _clipboardSerializeError(error),
    });
  }

  const name = _clipboardGetAudioDisplayName(audioInput, blob);
  if (external) {
    return {
      src,
      name,
      external: true,
    };
  }

  if (!blob) return null;

  const destination = _clipboardGetUploadDestination({
    uploadContext: CLIPBOARD_IMAGE_UPLOAD_CONTEXT_AUDIO,
  });
  await _clipboardCreateFolderIfMissing(destination);
  const uploadPath = await _clipboardUploadAudioBlob(blob, destination);

  _clipboardLog("info", "Resolved pasted audio resource", {
    name,
    src: uploadPath,
    destination: _clipboardDescribeDestinationForLog(destination),
    audioInput: _clipboardDescribeAudioInput(audioInput),
    mimeType: _clipboardNormalizeMimeType(blob.type) || null,
  });
  return {
    src: _clipboardCreateFreshMediaPath(uploadPath),
    name,
    external: false,
  };
}

function _clipboardPromptChatAudioBehavior() {
  return new Promise(resolve => {
    let settled = false;
    const settle = behavior => {
      if (settled) return;
      settled = true;
      resolve(behavior);
    };

    const defaultBehavior = {playAsMessageSound: false};
    const DialogConstructor = globalThis.Dialog;
    if (typeof DialogConstructor !== "function") {
      settle(defaultBehavior);
      return;
    }

    new DialogConstructor({
      title: "Post Audio to Chat",
      content: "<p>Choose how this pasted audio should be posted to chat.</p>",
      buttons: {
        card: {
          label: "Audio card only",
          callback: () => settle(defaultBehavior),
        },
        sound: {
          label: "Audio card + message sound",
          callback: () => settle({playAsMessageSound: true}),
        },
      },
      default: "card",
      close: () => settle(defaultBehavior),
    }).render(true);
  });
}

async function _clipboardHandleChatAudioInput(audioInput) {
  if (!_clipboardCanUseChatMedia()) return false;

  try {
    const behavior = await _clipboardPromptChatAudioBehavior();
    const audioData = await _clipboardResolveAudioResource(audioInput);
    if (!audioData?.src) return false;

    await _clipboardCreateAudioChatMessage({
      audioData,
      playAsMessageSound: Boolean(behavior?.playAsMessageSound),
    });
    return true;
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedAudioContent({audioInput}),
    });
  }
}

function _clipboardCanPasteAudioToCanvasContext(context) {
  if (context?.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
  return _clipboardIsMouseWithinCanvas(context?.mousePos);
}

function _clipboardPromptCanvasAudioBehavior() {
  return new Promise(resolve => {
    let settled = false;
    const settle = behavior => {
      if (settled) return;
      settled = true;
      resolve(behavior);
    };

    const defaultBehavior = {repeat: false};
    const DialogConstructor = globalThis.Dialog;
    if (typeof DialogConstructor !== "function") {
      settle(defaultBehavior);
      return;
    }

    new DialogConstructor({
      title: "Create Ambient Sound",
      content: "<p>Choose how this pasted audio should be added to the scene.</p>",
      buttons: {
        sound: {
          label: "Ambient sound",
          callback: () => settle(defaultBehavior),
        },
        loop: {
          label: "Ambient loop",
          callback: () => settle({repeat: true}),
        },
      },
      default: "sound",
      close: () => settle(defaultBehavior),
    }).render(true);
  });
}

function _clipboardGetAmbientSoundFallbackRadius() {
  const gridDistance = Number(canvas?.scene?.grid?.distance || canvas?.dimensions?.distance || canvas?.grid?.distance || 5);
  return Number.isFinite(gridDistance) && gridDistance > 0 ? gridDistance * 3 : 15;
}

function _clipboardClonePaletteData(data) {
  if (!data || typeof data !== "object") return {};
  if (typeof foundry?.utils?.deepClone === "function") return foundry.utils.deepClone(data);
  return {...data};
}

function _clipboardGetAmbientSoundPaletteData(context) {
  const paletteCreateData = canvas?.sounds?.paletteCreateData;
  if (typeof paletteCreateData === "function") {
    try {
      return _clipboardClonePaletteData(paletteCreateData({
        x: context?.mousePos?.x,
        y: context?.mousePos?.y,
      }));
    } catch (error) {
      _clipboardLog("debug", "Failed to read Foundry AmbientSound palette defaults; using module defaults", {
        error: _clipboardSerializeError(error),
      });
      return {};
    }
  }
  return _clipboardClonePaletteData(paletteCreateData);
}

function _clipboardCreateAmbientSoundData(audioData, behavior, context) {
  const fallbackData = {
    radius: _clipboardGetAmbientSoundFallbackRadius(),
    volume: 0.5,
    easing: true,
    walls: true,
  };
  const paletteData = _clipboardGetAmbientSoundPaletteData(context);
  return {
    ...fallbackData,
    ...paletteData,
    name: audioData.name || "Pasted Audio",
    path: audioData.src,
    x: context.mousePos.x,
    y: context.mousePos.y,
    repeat: Boolean(behavior?.repeat),
    hidden: _clipboardGetHiddenMode(),
  };
}

async function _clipboardCreateAmbientSound(audioData, behavior, context) {
  const createData = [_clipboardCreateAmbientSoundData(audioData, behavior, context)];
  await canvas.scene.createEmbeddedDocuments("AmbientSound", createData);
  _clipboardLog("info", "Created AmbientSound from pasted audio", {
    src: audioData.src || null,
    name: audioData.name || null,
    repeat: Boolean(behavior?.repeat),
    mousePos: context.mousePos,
  });
  return true;
}

async function _clipboardHandleCanvasAudioInput(audioInput, options = {}) {
  if (!canvas?.ready || !canvas.scene) return false;
  if (!_clipboardCanUseCanvasMedia()) return false;

  try {
    const context = options.context || _clipboardResolvePasteContext(options.contextOptions);
    if (!_clipboardCanPasteAudioToCanvasContext(context)) {
      _clipboardLog("info", "Skipping canvas audio paste because the current context is not eligible", {
        context,
      });
      return false;
    }

    const behavior = await _clipboardPromptCanvasAudioBehavior();
    const audioData = await _clipboardResolveAudioResource(audioInput);
    if (!audioData?.src) return false;
    return _clipboardCreateAmbientSound(audioData, behavior, context);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedAudioContent({audioInput}),
    });
  }
}

function _clipboardGetPlaylistDocumentClass() {
  return foundry?.documents?.Playlist || globalThis.Playlist || CONFIG?.Playlist?.documentClass || null;
}

function _clipboardGetAllPlaylists() {
  const playlists = game?.playlists;
  if (Array.isArray(playlists?.contents)) return playlists.contents.filter(Boolean);
  if (typeof playlists?.values === "function") return Array.from(playlists.values()).filter(Boolean);
  return [];
}

function _clipboardFindDefaultAudioPlaylist() {
  return _clipboardGetAllPlaylists().find(playlist => playlist?.name === CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME) || null;
}

function _clipboardCanCreatePlaylist() {
  if (game.user?.isGM) return true;
  const PlaylistDocument = _clipboardGetPlaylistDocumentClass();
  if (typeof PlaylistDocument?.canUserCreate === "function") {
    return Boolean(PlaylistDocument.canUserCreate(game.user));
  }
  return false;
}

async function _clipboardGetOrCreateDefaultAudioPlaylist() {
  const existingPlaylist = _clipboardFindDefaultAudioPlaylist();
  if (existingPlaylist) {
    if (!_clipboardCanUserModifyDocument(existingPlaylist, "update")) {
      throw new Error(`You do not have permission to add sounds to the ${CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME} playlist.`);
    }
    return existingPlaylist;
  }

  if (!_clipboardCanCreatePlaylist()) {
    throw new Error("You do not have permission to create a playlist for pasted audio.");
  }

  const PlaylistDocument = _clipboardGetPlaylistDocumentClass();
  if (!PlaylistDocument?.create) {
    throw new Error("Playlist creation is unavailable for pasted audio.");
  }

  return PlaylistDocument.create({
    name: CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME,
    mode: CONST?.PLAYLIST_MODES?.DISABLED ?? -1,
  });
}

function _clipboardCanUpdatePlaylistSound(playlistSound) {
  return _clipboardCanUserModifyDocument(playlistSound, "update") ||
    _clipboardCanUserModifyDocument(playlistSound?.parent, "update");
}

async function _clipboardPopulatePlaylistSound(playlistSound, audioData) {
  if (!_clipboardCanUpdatePlaylistSound(playlistSound)) {
    throw new Error("You do not have permission to update that playlist sound.");
  }

  const updateData = {
    path: audioData.src,
  };
  if (!playlistSound.name) updateData.name = audioData.name || "Pasted Audio";
  await playlistSound.update(updateData);
  _clipboardLog("info", "Updated PlaylistSound from pasted audio", {
    playlistSoundId: playlistSound.id || null,
    playlistId: playlistSound.parent?.id || null,
    src: audioData.src || null,
  });
  return true;
}

async function _clipboardAddAudioToPlaylist(playlist, audioData) {
  if (!_clipboardCanUserModifyDocument(playlist, "update")) {
    throw new Error("You do not have permission to add sounds to that playlist.");
  }
  if (typeof playlist?.createEmbeddedDocuments !== "function") {
    throw new Error("Playlist sound creation is unavailable for pasted audio.");
  }

  await playlist.createEmbeddedDocuments("PlaylistSound", [{
    name: audioData.name || "Pasted Audio",
    path: audioData.src,
  }]);
  _clipboardLog("info", "Added PlaylistSound from pasted audio", {
    playlistId: playlist.id || null,
    src: audioData.src || null,
    name: audioData.name || null,
  });
  return true;
}

async function _clipboardResolvePlaylistAudioTarget(target) {
  const playlistTarget = target?.inPlaylistUi || target?.playlist || target?.playlistSound
    ? target
    : _clipboardGetPlaylistTargetFromElement(target);
  if (!playlistTarget?.inPlaylistUi && !playlistTarget?.playlist && !playlistTarget?.playlistSound) return null;
  return playlistTarget;
}

async function _clipboardHandlePlaylistAudioInput(audioInput, target) {
  const playlistTarget = await _clipboardResolvePlaylistAudioTarget(target);
  if (!playlistTarget) return false;

  try {
    if (playlistTarget.playlistSound && !_clipboardCanUpdatePlaylistSound(playlistTarget.playlistSound)) {
      throw new Error("You do not have permission to update that playlist sound.");
    }
    if (playlistTarget.playlist && !_clipboardCanUserModifyDocument(playlistTarget.playlist, "update")) {
      throw new Error("You do not have permission to add sounds to that playlist.");
    }
    if (!playlistTarget.playlist && !playlistTarget.playlistSound) {
      const existingPlaylist = _clipboardFindDefaultAudioPlaylist();
      if (existingPlaylist && !_clipboardCanUserModifyDocument(existingPlaylist, "update")) {
        throw new Error(`You do not have permission to add sounds to the ${CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME} playlist.`);
      }
      if (!existingPlaylist && !_clipboardCanCreatePlaylist()) {
        throw new Error("You do not have permission to create a playlist for pasted audio.");
      }
    }

    const audioData = await _clipboardResolveAudioResource(audioInput);
    if (!audioData?.src) return false;

    if (playlistTarget.playlistSound) {
      return _clipboardPopulatePlaylistSound(playlistTarget.playlistSound, audioData);
    }

    const playlist = playlistTarget.playlist || await _clipboardGetOrCreateDefaultAudioPlaylist();
    return _clipboardAddAudioToPlaylist(playlist, audioData);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedAudioContent({audioInput}),
    });
  }
}

function _clipboardCanPopulateAudioFieldTarget(target) {
  if (!target?.documentName) return false;
  if (target.documentName === "ChatMessage") {
    return _clipboardCanUseChatMedia() && _clipboardCanUserModifyDocument(target.document, "update");
  }
  if (target.documentName === "AmbientSound") {
    return _clipboardCanUseCanvasMedia() && _clipboardCanUserModifyDocument(target.document, "update");
  }
  if (target.documentName === "PlaylistSound") {
    return _clipboardCanUpdatePlaylistSound(target.document);
  }
  return false;
}

async function _clipboardHandleAudioFieldInput(audioInput, target) {
  const audioFieldTarget = target?.field ? target : _clipboardGetFocusedAudioFieldTarget(target);
  if (!audioFieldTarget) return false;
  if (!_clipboardCanPopulateAudioFieldTarget(audioFieldTarget)) return false;

  try {
    const audioData = await _clipboardResolveAudioResource(audioInput);
    if (!audioData?.src) return false;
    return _clipboardPopulateAudioFieldTarget(audioFieldTarget, audioData.src, audioInput);
  } catch (error) {
    throw _clipboardAnnotateWorkflowError(error, {
      clipboardContentSummary: _clipboardDescribeAttemptedAudioContent({audioInput}),
    });
  }
}

module.exports = {
  CLIPBOARD_IMAGE_DEFAULT_AUDIO_PLAYLIST_NAME,
  _clipboardDescribeAudioInput,
  _clipboardGetAudioFilename,
  _clipboardGetAudioDisplayName,
  _clipboardIsBlockedDirectAudioUrlDownload,
  _clipboardCanUseExternalAudioUrlFallback,
  _clipboardDescribeAttemptedAudioContent,
  _clipboardResolveAudioResource,
  _clipboardPromptChatAudioBehavior,
  _clipboardHandleChatAudioInput,
  _clipboardCanPasteAudioToCanvasContext,
  _clipboardPromptCanvasAudioBehavior,
  _clipboardGetAmbientSoundFallbackRadius,
  _clipboardGetAmbientSoundPaletteData,
  _clipboardCreateAmbientSoundData,
  _clipboardCreateAmbientSound,
  _clipboardHandleCanvasAudioInput,
  _clipboardGetPlaylistDocumentClass,
  _clipboardGetAllPlaylists,
  _clipboardFindDefaultAudioPlaylist,
  _clipboardCanCreatePlaylist,
  _clipboardGetOrCreateDefaultAudioPlaylist,
  _clipboardCanUpdatePlaylistSound,
  _clipboardPopulatePlaylistSound,
  _clipboardAddAudioToPlaylist,
  _clipboardResolvePlaylistAudioTarget,
  _clipboardHandlePlaylistAudioInput,
  _clipboardCanPopulateAudioFieldTarget,
  _clipboardHandleAudioFieldInput,
};
