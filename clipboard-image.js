// Generated from src/. Do not edit clipboard-image.js directly.

var ClipboardImageRuntime = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/constants.js
  var require_constants = __commonJS({
    "src/constants.js"(exports, module) {
      var CLIPBOARD_IMAGE_MODULE_ID = "clipboard-image";
      var CLIPBOARD_IMAGE_DEFAULT_FOLDER = "pasted_images";
      var CLIPBOARD_IMAGE_SOURCE_AUTO = "auto";
      var CLIPBOARD_IMAGE_SOURCE_DATA = "data";
      var CLIPBOARD_IMAGE_SOURCE_S3 = "s3";
      var CLIPBOARD_IMAGE_SOURCE_FORGE = "forgevtt";
      var CLIPBOARD_IMAGE_FILE_PICKER = foundry.applications.apps.FilePicker.implementation;
      var CLIPBOARD_IMAGE_KEYBOARD_MANAGER = foundry.helpers.interaction.KeyboardManager;
      var CLIPBOARD_IMAGE_FORM_APPLICATION = foundry.appv1.api.FormApplication;
      var CLIPBOARD_IMAGE_SCENE_CONTROLS = ["tiles", "tokens"];
      var CLIPBOARD_IMAGE_TOOL_PASTE = "clipboard-image-paste";
      var CLIPBOARD_IMAGE_TOOL_UPLOAD = "clipboard-image-upload";
      var CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE = "data-clipboard-image-chat-root";
      var CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION = "clipboard-image-chat-upload";
      var CLIPBOARD_IMAGE_TEXT_NOTE_FLAG = "textNote";
      var CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME = "Notes";
      var CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX = "Pasted Note";
      var CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING = "verbose-logging";
      var CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT = "image/*,video/*";
      var CLIPBOARD_IMAGE_IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["apng", "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"]);
      var CLIPBOARD_IMAGE_VIDEO_EXTENSIONS = /* @__PURE__ */ new Set(["m4v", "mp4", "mpeg", "mpg", "ogg", "ogv", "webm"]);
      var CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS = Object.freeze({
        fallbackToCenter: true,
        requireCanvasFocus: false
      });
      module.exports = {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_DATA,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_SOURCE_FORGE,
        CLIPBOARD_IMAGE_FILE_PICKER,
        CLIPBOARD_IMAGE_KEYBOARD_MANAGER,
        CLIPBOARD_IMAGE_FORM_APPLICATION,
        CLIPBOARD_IMAGE_SCENE_CONTROLS,
        CLIPBOARD_IMAGE_TOOL_PASTE,
        CLIPBOARD_IMAGE_TOOL_UPLOAD,
        CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE,
        CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
        CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
        CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
        CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
        CLIPBOARD_IMAGE_VIDEO_EXTENSIONS,
        CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
      };
    }
  });

  // src/media.js
  var require_media = __commonJS({
    "src/media.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_IMAGE_EXTENSIONS,
        CLIPBOARD_IMAGE_VIDEO_EXTENSIONS
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      function _clipboardNormalizeMimeType(value) {
        return value?.split(";").shift()?.trim()?.toLowerCase() || "";
      }
      function _clipboardGetFilenameExtension(filename) {
        return filename?.split(/[?#]/).shift()?.split(".").pop()?.trim()?.toLowerCase() || "";
      }
      function _clipboardGetFileExtension(blob) {
        if (blob instanceof File && blob.name.includes(".")) {
          return blob.name.split(".").pop().toLowerCase();
        }
        const mimeType = _clipboardNormalizeMimeType(blob.type).split("/").pop()?.toLowerCase() || "png";
        return mimeType.replace("jpeg", "jpg").replace("svg+xml", "svg").replace("x-icon", "ico").split("+")[0];
      }
      function _clipboardParseSupportedUrl(value) {
        if (!value) return null;
        try {
          const url = new URL(value);
          if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) return null;
          return url.href;
        } catch (error) {
          return null;
        }
      }
      function _clipboardGetFilenameFromUrl(url) {
        const parsedUrl = _clipboardParseSupportedUrl(url);
        if (!parsedUrl) return "";
        const urlObject = new URL(parsedUrl);
        if (!["http:", "https:"].includes(urlObject.protocol)) return "";
        let filename = urlObject.pathname.split("/").pop() || "";
        try {
          filename = decodeURIComponent(filename);
        } catch (error) {
        }
        return filename === "/" ? "" : filename;
      }
      function _clipboardLooksLikeImageFilename(filename) {
        return CLIPBOARD_IMAGE_IMAGE_EXTENSIONS.has(_clipboardGetFilenameExtension(filename));
      }
      function _clipboardLooksLikeVideoFilename(filename) {
        const extension = _clipboardGetFilenameExtension(filename);
        if (!extension) return false;
        const foundryVideoHelper = globalThis.foundry?.helpers?.media?.VideoHelper;
        if (foundryVideoHelper?.hasVideoExtension?.(filename)) return true;
        return CLIPBOARD_IMAGE_VIDEO_EXTENSIONS.has(extension);
      }
      function _clipboardIsImageMimeType(mimeType) {
        return _clipboardNormalizeMimeType(mimeType).startsWith("image/");
      }
      function _clipboardIsVideoMimeType(mimeType) {
        return _clipboardNormalizeMimeType(mimeType).startsWith("video/");
      }
      function _clipboardIsMediaMimeType(mimeType) {
        return _clipboardIsImageMimeType(mimeType) || _clipboardIsVideoMimeType(mimeType);
      }
      function _clipboardGetMediaKind({ blob, filename, mimeType, src } = {}) {
        const normalizedMimeType = _clipboardNormalizeMimeType(mimeType || blob?.type);
        if (_clipboardIsVideoMimeType(normalizedMimeType)) return "video";
        if (_clipboardIsImageMimeType(normalizedMimeType)) return "image";
        const candidate = filename || (src ? _clipboardGetFilenameFromUrl(src) || src : "");
        if (_clipboardLooksLikeVideoFilename(candidate)) return "video";
        if (_clipboardLooksLikeImageFilename(candidate)) return "image";
        return null;
      }
      function _clipboardIsSupportedMediaBlob(blob) {
        return Boolean(blob && _clipboardGetMediaKind({ blob, filename: blob.name }));
      }
      function _clipboardGetMimeTypeFromFilename(filename) {
        switch (_clipboardGetFilenameExtension(filename)) {
          case "apng":
            return "image/apng";
          case "avif":
            return "image/avif";
          case "bmp":
            return "image/bmp";
          case "gif":
            return "image/gif";
          case "ico":
            return "image/x-icon";
          case "jpg":
          case "jpeg":
            return "image/jpeg";
          case "png":
            return "image/png";
          case "tif":
          case "tiff":
            return "image/tiff";
          case "svg":
            return "image/svg+xml";
          case "webp":
            return "image/webp";
          case "m4v":
          case "mp4":
            return "video/mp4";
          case "mpeg":
          case "mpg":
            return "video/mpeg";
          case "ogg":
          case "ogv":
            return "video/ogg";
          case "webm":
            return "video/webm";
          default:
            return "image/png";
        }
      }
      function _clipboardEnsureFilenameExtension(filename, blob) {
        const resolvedExtension = _clipboardGetFileExtension(blob);
        const currentExtension = _clipboardGetFilenameExtension(filename);
        if (currentExtension === resolvedExtension && filename) return filename;
        const baseName = filename?.replace(/\.[^./]+$/, "") || `pasted_image_${Date.now()}`;
        return `${baseName}.${resolvedExtension}`;
      }
      function _clipboardGetTileVideoData(mediaKind) {
        if (mediaKind !== "video") return void 0;
        return {
          autoplay: true,
          loop: true,
          volume: 0
        };
      }
      function _clipboardScaleTileDimensions(imgWidth, imgHeight, sceneDimensions) {
        const scaledDimensions = { width: imgWidth, height: imgHeight };
        if (imgHeight > sceneDimensions.sceneHeight || imgWidth > sceneDimensions.sceneWidth) {
          scaledDimensions.width = sceneDimensions.sceneWidth / 3;
          scaledDimensions.height = scaledDimensions.width * imgHeight / imgWidth;
        }
        return scaledDimensions;
      }
      function _clipboardRoundDimension(value) {
        return Math.round(value * 100) / 100;
      }
      function _clipboardScaleTokenDimensions(imgWidth, imgHeight) {
        if (!imgWidth || !imgHeight) return { width: 1, height: 1 };
        if (imgWidth >= imgHeight) {
          return {
            width: _clipboardRoundDimension(imgWidth / imgHeight),
            height: 1
          };
        }
        return {
          width: 1,
          height: _clipboardRoundDimension(imgHeight / imgWidth)
        };
      }
      async function _clipboardLoadImageDimensions(path) {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error("Failed to determine pasted media size"));
          image.src = path;
        });
        if (typeof image.decode === "function") {
          try {
            await image.decode();
          } catch (error) {
          }
        }
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        image.src = "";
        if (!width || !height) {
          throw new Error("Failed to determine pasted media size");
        }
        return { width, height };
      }
      async function _clipboardLoadVideoDimensions(path) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = () => reject(new Error("Failed to determine pasted media size"));
          video.src = path;
        });
        const width = video.videoWidth;
        const height = video.videoHeight;
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (!width || !height) {
          throw new Error("Failed to determine pasted media size");
        }
        return { width, height };
      }
      async function _clipboardLoadMediaDimensions(path) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) === "video" ? "video" : "image";
        const dimensions = mediaKind === "video" ? await _clipboardLoadVideoDimensions(path) : await _clipboardLoadImageDimensions(path);
        _clipboardLog("debug", "Loaded pasted media dimensions", {
          path,
          mediaKind,
          width: dimensions.width,
          height: dimensions.height
        });
        return dimensions;
      }
      module.exports = {
        _clipboardNormalizeMimeType,
        _clipboardGetFilenameExtension,
        _clipboardGetFileExtension,
        _clipboardParseSupportedUrl,
        _clipboardGetFilenameFromUrl,
        _clipboardLooksLikeImageFilename,
        _clipboardLooksLikeVideoFilename,
        _clipboardIsImageMimeType,
        _clipboardIsVideoMimeType,
        _clipboardIsMediaMimeType,
        _clipboardGetMediaKind,
        _clipboardIsSupportedMediaBlob,
        _clipboardGetMimeTypeFromFilename,
        _clipboardEnsureFilenameExtension,
        _clipboardGetTileVideoData,
        _clipboardScaleTileDimensions,
        _clipboardRoundDimension,
        _clipboardScaleTokenDimensions,
        _clipboardLoadImageDimensions,
        _clipboardLoadVideoDimensions,
        _clipboardLoadMediaDimensions
      };
    }
  });

  // src/state.js
  var require_state = __commonJS({
    "src/state.js"(exports, module) {
      var CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS = /* @__PURE__ */ new WeakSet();
      var CLIPBOARD_IMAGE_LOCKED = false;
      var CLIPBOARD_HIDDEN_MODE = false;
      function _clipboardGetRuntimeState() {
        return {
          locked: CLIPBOARD_IMAGE_LOCKED,
          hiddenMode: CLIPBOARD_HIDDEN_MODE
        };
      }
      function _clipboardSetRuntimeState({ locked, hiddenMode } = {}) {
        if (typeof locked === "boolean") CLIPBOARD_IMAGE_LOCKED = locked;
        if (typeof hiddenMode === "boolean") CLIPBOARD_HIDDEN_MODE = hiddenMode;
      }
      function _clipboardGetLocked() {
        return CLIPBOARD_IMAGE_LOCKED;
      }
      function _clipboardSetLocked(locked) {
        if (typeof locked === "boolean") CLIPBOARD_IMAGE_LOCKED = locked;
      }
      function _clipboardGetHiddenMode() {
        return CLIPBOARD_HIDDEN_MODE;
      }
      function _clipboardSetHiddenMode(hiddenMode) {
        if (typeof hiddenMode === "boolean") CLIPBOARD_HIDDEN_MODE = hiddenMode;
      }
      module.exports = {
        CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS,
        _clipboardGetRuntimeState,
        _clipboardSetRuntimeState,
        _clipboardGetLocked,
        _clipboardSetLocked,
        _clipboardGetHiddenMode,
        _clipboardSetHiddenMode
      };
    }
  });

  // src/context.js
  var require_context = __commonJS({
    "src/context.js"(exports, module) {
      var { _clipboardDescribeReplacementTarget, _clipboardLog } = require_diagnostics();
      var {
        _clipboardGetTileVideoData,
        _clipboardScaleTileDimensions,
        _clipboardScaleTokenDimensions
      } = require_media();
      var { _clipboardGetHiddenMode } = require_state();
      function _clipboardHasCopiedObjects() {
        const layer = canvas?.activeLayer;
        return Boolean(layer?.clipboard?.objects?.length);
      }
      function _clipboardGetMousePosition() {
        if (!canvas?.mousePosition) return null;
        return {
          x: canvas.mousePosition.x,
          y: canvas.mousePosition.y
        };
      }
      function _clipboardGetCanvasCenter() {
        return {
          x: canvas.dimensions.width / 2,
          y: canvas.dimensions.height / 2
        };
      }
      function _clipboardGetTokenPosition(mousePos) {
        return canvas?.grid?.getTopLeftPoint?.(mousePos) || mousePos;
      }
      function _clipboardGetPastedDocumentName(path) {
        const rawName = String(path || "").split("/").pop() || "";
        let decodedName = rawName;
        try {
          decodedName = decodeURIComponent(rawName);
        } catch (error) {
          decodedName = rawName;
        }
        const trimmedName = decodedName.replace(/\.[^.]+$/, "").trim();
        return trimmedName || "Pasted Media";
      }
      function _clipboardGetAvailableActorTypes() {
        const candidates = [
          game?.system?.documentTypes?.Actor,
          game?.documentTypes?.Actor,
          _clipboardGetActorDocumentClass()?.TYPES
        ];
        const baseDocumentType = CONST?.BASE_DOCUMENT_TYPE;
        for (const candidate of candidates) {
          if (!Array.isArray(candidate) || !candidate.length) continue;
          return candidate.filter((type) => type && type !== baseDocumentType);
        }
        return [];
      }
      function _clipboardGetActorDocumentClass() {
        return foundry?.documents?.Actor || globalThis.Actor || null;
      }
      function _clipboardGetDefaultActorType() {
        const defaultType = CONFIG?.Actor?.defaultType || null;
        const availableTypes = _clipboardGetAvailableActorTypes();
        if (defaultType && (!availableTypes.length || availableTypes.includes(defaultType))) {
          return defaultType;
        }
        return availableTypes[0] || defaultType || null;
      }
      async function _clipboardCreatePastedTokenActor({ path, mediaKind, width, height }) {
        const ActorDocument = _clipboardGetActorDocumentClass();
        if (!ActorDocument?.create) {
          throw new Error("Actor creation is unavailable for pasted tokens.");
        }
        const name = _clipboardGetPastedDocumentName(path);
        const actorType = _clipboardGetDefaultActorType();
        const actorData = {
          name,
          img: path,
          prototypeToken: {
            name,
            texture: {
              src: path
            },
            width,
            height
          }
        };
        if (actorType) actorData.type = actorType;
        _clipboardLog("debug", "Creating backing actor for pasted token", {
          actorType,
          mediaKind,
          name,
          path,
          width,
          height
        });
        const actor = await ActorDocument.create(actorData);
        if (!actor?.id) {
          throw new Error("Failed to create a backing Actor for the pasted token.");
        }
        _clipboardLog("info", "Created backing actor for pasted token", {
          actorId: actor.id,
          actorType,
          mediaKind,
          name,
          path,
          width,
          height
        });
        return actor;
      }
      var CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES = {
        Token: {
          documentName: "Token",
          getControlledDocuments: () => (canvas?.tokens?.controlled || []).map((token) => token.document),
          getLayer: () => canvas?.tokens,
          createData: async ({ path, imgWidth, imgHeight, mousePos, mediaKind }) => {
            const snappedPosition = _clipboardGetTokenPosition(mousePos);
            const dimensions = _clipboardScaleTokenDimensions(imgWidth, imgHeight);
            const actor = await _clipboardCreatePastedTokenActor({
              path,
              mediaKind,
              width: dimensions.width,
              height: dimensions.height
            });
            return [{
              actorId: actor.id,
              actorLink: false,
              name: actor.name || _clipboardGetPastedDocumentName(path),
              texture: {
                src: path
              },
              width: dimensions.width,
              height: dimensions.height,
              x: snappedPosition.x,
              y: snappedPosition.y,
              hidden: _clipboardGetHiddenMode(),
              locked: false
            }];
          }
        },
        Tile: {
          documentName: "Tile",
          getControlledDocuments: () => (canvas?.tiles?.controlled || []).map((tile) => tile.document),
          getLayer: () => canvas?.tiles,
          createData: ({ path, imgWidth, imgHeight, mousePos, mediaKind }) => {
            const dimensions = _clipboardScaleTileDimensions(imgWidth, imgHeight, canvas.dimensions);
            const createData = {
              texture: {
                src: path
              },
              width: dimensions.width,
              height: dimensions.height,
              x: mousePos.x,
              y: mousePos.y,
              sort: 0,
              rotation: 0,
              hidden: _clipboardGetHiddenMode(),
              locked: false
            };
            const video = _clipboardGetTileVideoData(mediaKind);
            if (video) createData.video = video;
            return [createData];
          }
        }
      };
      var CLIPBOARD_IMAGE_REPLACEMENT_ORDER = {
        Token: ["Token", "Tile"],
        Tile: ["Tile", "Token"]
      };
      function _clipboardGetActiveDocumentName() {
        return canvas?.activeLayer === canvas?.tokens ? "Token" : "Tile";
      }
      function _clipboardGetPlaceableStrategy(documentName = _clipboardGetActiveDocumentName()) {
        return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
      }
      function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
        for (const documentName of CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName]) {
          const strategy = _clipboardGetPlaceableStrategy(documentName);
          const documents = strategy.getControlledDocuments();
          if (!documents.length) continue;
          return {
            documentName: strategy.documentName,
            documents
          };
        }
        return null;
      }
      function _clipboardResolvePasteContext({ fallbackToCenter = false, requireCanvasFocus = true } = {}) {
        const activeDocumentName = _clipboardGetActiveDocumentName();
        const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);
        return {
          mousePos,
          createStrategy: _clipboardGetPlaceableStrategy(activeDocumentName),
          replacementTarget: _clipboardGetReplacementTarget(activeDocumentName),
          requireCanvasFocus
        };
      }
      function _clipboardHasCanvasFocus() {
        const gameElement = document.querySelector(".game");
        return !gameElement || document.activeElement === gameElement;
      }
      function _clipboardIsMouseWithinCanvas(mousePos) {
        return Boolean(
          mousePos && mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x <= canvas.dimensions.width && mousePos.y <= canvas.dimensions.height
        );
      }
      function _clipboardCanPasteToContext(context) {
        if (context.requireCanvasFocus && !_clipboardHasCanvasFocus()) return false;
        if (context.replacementTarget) return true;
        return _clipboardIsMouseWithinCanvas(context.mousePos);
      }
      function _clipboardPrepareCreateLayer(context) {
        if (!context.replacementTarget) {
          context.createStrategy.getLayer()?.activate?.();
        }
      }
      async function _clipboardReplaceControlledMedia(path, replacementTarget, mediaKind) {
        if (!replacementTarget) return false;
        const updates = replacementTarget.documents.map((document2) => {
          const update = {
            _id: document2.id,
            "texture.src": path
          };
          if (replacementTarget.documentName === "Tile" && mediaKind === "video") {
            update.video = _clipboardGetTileVideoData(mediaKind);
          }
          return update;
        });
        _clipboardLog("info", "Replacing controlled media", {
          replacementTarget: _clipboardDescribeReplacementTarget(replacementTarget),
          mediaKind,
          path
        });
        await canvas.scene.updateEmbeddedDocuments(replacementTarget.documentName, updates);
        return true;
      }
      module.exports = {
        CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES,
        _clipboardHasCopiedObjects,
        _clipboardGetMousePosition,
        _clipboardGetCanvasCenter,
        _clipboardGetTokenPosition,
        _clipboardGetPastedDocumentName,
        _clipboardGetAvailableActorTypes,
        _clipboardGetActorDocumentClass,
        _clipboardGetDefaultActorType,
        _clipboardCreatePastedTokenActor,
        _clipboardGetActiveDocumentName,
        _clipboardGetPlaceableStrategy,
        _clipboardGetReplacementTarget,
        _clipboardResolvePasteContext,
        _clipboardHasCanvasFocus,
        _clipboardIsMouseWithinCanvas,
        _clipboardCanPasteToContext,
        _clipboardPrepareCreateLayer,
        _clipboardReplaceControlledMedia
      };
    }
  });

  // src/diagnostics.js
  var require_diagnostics = __commonJS({
    "src/diagnostics.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING
      } = require_constants();
      function _clipboardVerboseLoggingEnabled() {
        try {
          const settingKey = `${CLIPBOARD_IMAGE_MODULE_ID}.${CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING}`;
          if (!game?.settings?.settings?.has?.(settingKey)) return false;
          return Boolean(game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING));
        } catch (error) {
          return false;
        }
      }
      function _clipboardSerializeError(error) {
        if (error instanceof Error) {
          return {
            name: error.name,
            message: error.message,
            stack: error.stack
          };
        }
        return error;
      }
      function _clipboardDescribeFile(file) {
        if (!file) return null;
        return {
          name: file.name || null,
          type: file.type || null,
          size: file.size ?? null
        };
      }
      function _clipboardDescribeDestinationForLog(destination) {
        if (!destination) return null;
        return {
          storedSource: destination.storedSource,
          source: destination.source,
          target: destination.target,
          bucket: destination.bucket || null
        };
      }
      function _clipboardDescribeReplacementTarget(replacementTarget) {
        if (!replacementTarget) return null;
        return {
          documentName: replacementTarget.documentName,
          ids: replacementTarget.documents.map((document2) => document2.id)
        };
      }
      function _clipboardDescribePasteContext(context) {
        if (!context) return null;
        const { _clipboardHasCanvasFocus } = require_context();
        return {
          mousePos: context.mousePos,
          createDocumentName: context.createStrategy?.documentName || null,
          replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
          requireCanvasFocus: context.requireCanvasFocus,
          hasCanvasFocus: _clipboardHasCanvasFocus()
        };
      }
      function _clipboardDescribeClipboardItems(clipItems) {
        return (clipItems || []).map((item, index) => ({
          index,
          types: Array.from(item.types || [])
        }));
      }
      function _clipboardDescribeDataTransfer(dataTransfer) {
        if (!dataTransfer) return null;
        return {
          types: Array.from(dataTransfer.types || []),
          files: Array.from(dataTransfer.files || []).map(_clipboardDescribeFile),
          items: Array.from(dataTransfer.items || []).map((item) => ({
            kind: item.kind,
            type: item.type
          }))
        };
      }
      function _clipboardDescribeImageInput(imageInput) {
        if (!imageInput) return null;
        const { _clipboardGetMediaKind } = require_media();
        if (imageInput.blob) {
          return {
            source: "blob",
            ..._clipboardDescribeFile(imageInput.blob) || {},
            mediaKind: _clipboardGetMediaKind({ blob: imageInput.blob, filename: imageInput.blob.name })
          };
        }
        return {
          source: "url",
          url: imageInput.url || null,
          mediaKind: _clipboardGetMediaKind({ src: imageInput.url })
        };
      }
      function _clipboardLog(level, message, details) {
        if ((level === "debug" || level === "info") && !_clipboardVerboseLoggingEnabled()) return;
        const logger = console[level] || console.log;
        const prefix = `Clipboard Image [${level.toUpperCase()}]: ${message}`;
        if (details === void 0) {
          logger(prefix);
          return;
        }
        logger(prefix, details);
      }
      module.exports = {
        _clipboardVerboseLoggingEnabled,
        _clipboardSerializeError,
        _clipboardDescribeFile,
        _clipboardDescribeDestinationForLog,
        _clipboardDescribeReplacementTarget,
        _clipboardDescribePasteContext,
        _clipboardDescribeClipboardItems,
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardLog
      };
    }
  });

  // src/storage.js
  var require_storage = __commonJS({
    "src/storage.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_DATA,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_SOURCE_FORGE,
        CLIPBOARD_IMAGE_FILE_PICKER
      } = require_constants();
      var {
        _clipboardDescribeDestinationForLog,
        _clipboardDescribeFile,
        _clipboardLog
      } = require_diagnostics();
      var {
        _clipboardNormalizeMimeType,
        _clipboardGetMimeTypeFromFilename,
        _clipboardGetMediaKind,
        _clipboardIsMediaMimeType,
        _clipboardGetFilenameFromUrl,
        _clipboardEnsureFilenameExtension,
        _clipboardGetFileExtension
      } = require_media();
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
            return "Amazon S3";
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
          [CLIPBOARD_IMAGE_SOURCE_S3]: _clipboardGetSourceLabel(CLIPBOARD_IMAGE_SOURCE_S3)
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
      function _clipboardGetTargetFolder() {
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, "image-location")?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
      }
      function _clipboardGetUploadDestination(overrides = {}) {
        const storedSource = overrides.storedSource ?? overrides.source ?? _clipboardGetStoredSource();
        const resolvedSource = _clipboardResolveSource(storedSource);
        const target = Object.hasOwn(overrides, "target") ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER : _clipboardGetTargetFolder();
        const bucket = resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? Object.hasOwn(overrides, "bucket") ? overrides.bucket?.trim() || "" : _clipboardGetStoredBucket() : "";
        return {
          storedSource,
          source: resolvedSource,
          target,
          bucket
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
          throw new Error("Amazon S3 destinations require a bucket selection");
        }
      }
      async function _clipboardCreateFolderIfMissing(destination) {
        const options = _clipboardGetFilePickerOptions(destination);
        _clipboardAssertUploadDestination(destination);
        _clipboardLog("debug", "Ensuring upload destination exists", {
          destination: _clipboardDescribeDestinationForLog(destination)
        });
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
          _clipboardLog("debug", "Skipping directory creation for S3 destination", {
            destination: _clipboardDescribeDestinationForLog(destination)
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
                  currentPath
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
          destination: _clipboardDescribeDestinationForLog(destination)
        });
      }
      function _clipboardCreateUploadFile(blob) {
        if (blob instanceof File && blob.name) return blob;
        const extension = _clipboardGetFileExtension(blob);
        const filename = `pasted_image_${Date.now()}.${extension}`;
        return new File([blob], filename, { type: blob.type });
      }
      async function _clipboardUploadBlob(blob, targetFolder) {
        _clipboardAssertUploadDestination(targetFolder);
        const file = _clipboardCreateUploadFile(blob);
        const fileDetails = _clipboardDescribeFile(file);
        _clipboardLog("info", "Uploading pasted media", {
          destination: _clipboardDescribeDestinationForLog(targetFolder),
          ...fileDetails
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
            ...fileDetails
          });
          throw new Error("Upload failed before a usable media path was returned");
        }
        _clipboardLog("info", "Uploaded pasted media", {
          destination: _clipboardDescribeDestinationForLog(targetFolder),
          path: uploadPath
        });
        return uploadPath;
      }
      async function _clipboardFetchImageUrl(url) {
        let response;
        try {
          _clipboardLog("info", "Downloading pasted media URL", { url });
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
        const mediaKind = _clipboardGetMediaKind({ mimeType: contentType }) || _clipboardGetMediaKind({ mimeType: blobType }) || _clipboardGetMediaKind({ filename });
        if (!mediaKind) {
          throw new Error("Pasted URL did not resolve to supported media content");
        }
        const typedBlob = _clipboardIsMediaMimeType(contentType) || _clipboardIsMediaMimeType(blobType) ? blob : new Blob([blob], { type: _clipboardGetMimeTypeFromFilename(filename) });
        const resolvedFilename = _clipboardEnsureFilenameExtension(filename, typedBlob);
        const resolvedMimeType = _clipboardNormalizeMimeType(typedBlob.type) || _clipboardGetMimeTypeFromFilename(resolvedFilename);
        _clipboardLog("info", "Downloaded pasted media URL", {
          url,
          responseContentType: contentType || null,
          blobType: blobType || null,
          resolvedFilename,
          resolvedMimeType,
          size: typedBlob.size
        });
        return new File([typedBlob], resolvedFilename, { type: resolvedMimeType });
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
        _clipboardGetTargetFolder,
        _clipboardGetUploadDestination,
        _clipboardGetFilePickerOptions,
        _clipboardDescribeDestination,
        _clipboardAssertUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardCreateUploadFile,
        _clipboardUploadBlob,
        _clipboardFetchImageUrl,
        _clipboardResolveImageInputBlob
      };
    }
  });

  // src/text.js
  var require_text = __commonJS({
    "src/text.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX
      } = require_constants();
      function _clipboardNormalizePastedText(text) {
        const normalized = text?.replace(/\r\n?/g, "\n") || "";
        if (!normalized.trim()) return "";
        return normalized.trimEnd();
      }
      function _clipboardEscapeHtml(text) {
        return foundry.utils.escapeHTML(text || "");
      }
      function _clipboardExtractTextFromHtml(html) {
        if (!html?.trim()) return "";
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const body = documentFragment.body;
        if (!body) return "";
        for (const lineBreak of body.querySelectorAll("br")) {
          lineBreak.replaceWith(documentFragment.createTextNode("\n"));
        }
        const blockTags = [
          "address",
          "article",
          "aside",
          "blockquote",
          "dd",
          "div",
          "dl",
          "dt",
          "fieldset",
          "figcaption",
          "figure",
          "footer",
          "form",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "header",
          "hr",
          "li",
          "main",
          "nav",
          "ol",
          "p",
          "pre",
          "section",
          "table",
          "tr",
          "ul"
        ];
        for (const block of body.querySelectorAll(blockTags.join(","))) {
          if (block.firstChild?.textContent?.startsWith("\n") !== true) {
            block.prepend(documentFragment.createTextNode("\n"));
          }
          if (block.lastChild?.textContent?.endsWith("\n") !== true) {
            block.append(documentFragment.createTextNode("\n"));
          }
        }
        const extractedText = body.textContent?.replace(/^\n+/, "") || "";
        return _clipboardNormalizePastedText(extractedText);
      }
      function _clipboardConvertTextToHtml(text) {
        const paragraphs = _clipboardNormalizePastedText(text).split(/\n{2,}/).map((paragraph) => paragraph.split("\n").map(_clipboardEscapeHtml).join("<br>")).filter(Boolean);
        return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
      }
      function _clipboardGetTextPreview(text, maxLength = 48) {
        const normalized = _clipboardNormalizePastedText(text);
        if (!normalized) return CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX;
        const firstLine = normalized.split("\n").find((line) => line.trim()) || normalized;
        if (firstLine.length <= maxLength) return firstLine;
        return `${firstLine.slice(0, maxLength - 1).trimEnd()}\u2026`;
      }
      function _clipboardGetTextPageFormat() {
        return CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
      }
      function _clipboardGetDefaultNoteIcon() {
        return CONFIG?.JournalEntry?.noteIcons?.Book || Object.values(CONFIG?.JournalEntry?.noteIcons || {})[0] || "icons/svg/book.svg";
      }
      function _clipboardGetDocumentCenter(document2) {
        const center = document2?.object?.center;
        if (center) {
          return {
            x: center.x,
            y: center.y
          };
        }
        if (document2?.documentName === "Tile") {
          return {
            x: document2.x + document2.width / 2,
            y: document2.y + document2.height / 2
          };
        }
        const gridSizeX = canvas?.grid?.sizeX || canvas?.dimensions?.size || 100;
        const gridSizeY = canvas?.grid?.sizeY || canvas?.dimensions?.size || 100;
        return {
          x: document2.x + (document2.width || 1) * gridSizeX / 2,
          y: document2.y + (document2.height || 1) * gridSizeY / 2
        };
      }
      function _clipboardGetAssociatedNotePosition(document2, fallbackPosition = null) {
        if (document2) return _clipboardGetDocumentCenter(document2);
        return fallbackPosition;
      }
      function _clipboardCreateTextPageData(text, name = CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME) {
        return {
          name,
          type: "text",
          title: {
            show: true,
            level: 1
          },
          text: {
            content: _clipboardConvertTextToHtml(text),
            format: _clipboardGetTextPageFormat()
          }
        };
      }
      function _clipboardAppendHtmlContent(existingContent, newContent) {
        if (!existingContent?.trim()) return newContent;
        if (!newContent?.trim()) return existingContent;
        return `${existingContent}<hr>${newContent}`;
      }
      function _clipboardCreateSceneNoteData({ entryId, pageId, position, text }) {
        return {
          entryId,
          pageId,
          text,
          x: position.x,
          y: position.y,
          texture: {
            src: _clipboardGetDefaultNoteIcon()
          }
        };
      }
      module.exports = {
        _clipboardNormalizePastedText,
        _clipboardEscapeHtml,
        _clipboardExtractTextFromHtml,
        _clipboardConvertTextToHtml,
        _clipboardGetTextPreview,
        _clipboardGetTextPageFormat,
        _clipboardGetDefaultNoteIcon,
        _clipboardGetDocumentCenter,
        _clipboardGetAssociatedNotePosition,
        _clipboardCreateTextPageData,
        _clipboardAppendHtmlContent,
        _clipboardCreateSceneNoteData
      };
    }
  });

  // src/clipboard.js
  var require_clipboard = __commonJS({
    "src/clipboard.js"(exports, module) {
      var { CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE } = require_constants();
      var {
        _clipboardDescribeClipboardItems,
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardGetMediaKind,
        _clipboardIsSupportedMediaBlob,
        _clipboardParseSupportedUrl
      } = require_media();
      var {
        _clipboardNormalizePastedText,
        _clipboardExtractTextFromHtml
      } = require_text();
      async function _clipboardReadClipboardItems() {
        let clipItems;
        try {
          _clipboardLog("debug", "Reading clipboard items via navigator.clipboard.read()");
          clipItems = await navigator.clipboard.read();
        } catch (error) {
          if (!error) {
            _clipboardLog("warn", "Failed to parse clipboard. Make sure your browser supports navigator.clipboard.");
            return null;
          }
          if (error instanceof DOMException) {
            if (error.name === "NotAllowedError") {
              _clipboardLog("info", "Clipboard access was blocked or dismissed.");
              return null;
            }
            if (error.name === "NotFoundError") {
              _clipboardLog("info", "Clipboard is empty.");
              return null;
            }
          }
          _clipboardLog("error", "Clipboard read failed", { error: _clipboardSerializeError(error) });
          throw error;
        }
        _clipboardLog("debug", "Read clipboard items", {
          itemCount: clipItems?.length || 0,
          items: _clipboardDescribeClipboardItems(clipItems)
        });
        return clipItems;
      }
      async function _clipboardExtractImageBlob(clipItems) {
        for (const clipItem of clipItems || []) {
          for (const fileType of clipItem.types) {
            if (_clipboardGetMediaKind({ mimeType: fileType })) {
              return clipItem.getType(fileType);
            }
          }
        }
        return null;
      }
      async function _clipboardReadClipboardText(clipItems, mimeType) {
        for (const clipItem of clipItems || []) {
          if (!clipItem.types.includes(mimeType)) continue;
          const textBlob = await clipItem.getType(mimeType);
          const text = await textBlob.text();
          if (text?.trim()) return text;
        }
        return "";
      }
      async function _clipboardExtractTextInput(clipItems) {
        return _clipboardExtractTextInputFromValues({
          plainText: await _clipboardReadClipboardText(clipItems, "text/plain"),
          html: await _clipboardReadClipboardText(clipItems, "text/html")
        });
      }
      function _clipboardExtractImageUrlFromUriList(text) {
        for (const line of (text || "").split(/\r?\n/)) {
          const candidate = line.trim();
          if (!candidate || candidate.startsWith("#")) continue;
          const url = _clipboardParseSupportedUrl(candidate);
          if (url) return url;
        }
        return null;
      }
      function _clipboardExtractImageUrlFromText(text) {
        const candidate = text?.trim();
        if (!candidate || /\s/.test(candidate)) return null;
        return _clipboardParseSupportedUrl(candidate);
      }
      function _clipboardExtractImageUrlFromHtml(html) {
        if (!html?.trim()) return null;
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const mediaElement = documentFragment.querySelector("img[src], video[src], source[src]");
        return _clipboardParseSupportedUrl(mediaElement?.getAttribute("src")?.trim());
      }
      function _clipboardCreateLoggedImageInput(imageInput, message, details = void 0) {
        const logDetails = {
          imageInput: _clipboardDescribeImageInput(imageInput)
        };
        if (details) Object.assign(logDetails, details);
        _clipboardLog("debug", message, logDetails);
        return imageInput;
      }
      function _clipboardExtractTextInputFromValues({ plainText = "", html = "" } = {}) {
        const normalizedPlainText = _clipboardNormalizePastedText(plainText);
        if (normalizedPlainText) return { text: normalizedPlainText };
        if (!html?.trim()) return null;
        const extractedText = _clipboardExtractTextFromHtml(html);
        return extractedText ? { text: extractedText } : null;
      }
      function _clipboardExtractImageInputFromValues({ blob = null, uriList = "", html = "", plainText = "" } = {}, {
        blobMessage,
        uriListMessage,
        htmlMessage,
        plainTextMessage,
        details
      } = {}) {
        if (blob) return _clipboardCreateLoggedImageInput({ blob }, blobMessage, details);
        const fallbackText = plainText || "";
        const trimmedPlainText = fallbackText.trim();
        const uriListUrl = _clipboardExtractImageUrlFromUriList(uriList);
        if (uriListUrl) {
          return _clipboardCreateLoggedImageInput({
            url: uriListUrl,
            text: fallbackText || uriListUrl
          }, uriListMessage, details);
        }
        const htmlUrl = _clipboardExtractImageUrlFromHtml(html);
        if (htmlUrl) {
          return _clipboardCreateLoggedImageInput({
            url: htmlUrl,
            text: fallbackText || htmlUrl
          }, htmlMessage, details);
        }
        const textUrl = _clipboardExtractImageUrlFromText(trimmedPlainText);
        if (textUrl) {
          return _clipboardCreateLoggedImageInput({
            url: textUrl,
            text: fallbackText || textUrl
          }, plainTextMessage, details);
        }
        return null;
      }
      async function _clipboardExtractImageInput(clipItems) {
        const blob = await _clipboardExtractImageBlob(clipItems);
        if (blob) {
          return _clipboardExtractImageInputFromValues({ blob }, {
            blobMessage: "Resolved media input from async clipboard blob"
          });
        }
        return _clipboardExtractImageInputFromValues({
          uriList: await _clipboardReadClipboardText(clipItems, "text/uri-list"),
          html: await _clipboardReadClipboardText(clipItems, "text/html"),
          plainText: await _clipboardReadClipboardText(clipItems, "text/plain")
        }, {
          uriListMessage: "Resolved media input from async clipboard uri-list",
          htmlMessage: "Resolved media input from async clipboard HTML",
          plainTextMessage: "Resolved media input from async clipboard plain text"
        });
      }
      function _clipboardExtractImageBlobFromDataTransfer(dataTransfer) {
        for (const item of dataTransfer?.items || []) {
          if (item.kind !== "file") continue;
          const file = item.getAsFile();
          if (_clipboardIsSupportedMediaBlob(file)) {
            return file;
          }
        }
        for (const file of dataTransfer?.files || []) {
          if (_clipboardIsSupportedMediaBlob(file)) return file;
        }
        return null;
      }
      function _clipboardReadDataTransferText(dataTransfer, mimeType) {
        return dataTransfer?.getData?.(mimeType) || "";
      }
      function _clipboardExtractTextInputFromDataTransfer(dataTransfer) {
        return _clipboardExtractTextInputFromValues({
          plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain"),
          html: _clipboardReadDataTransferText(dataTransfer, "text/html")
        });
      }
      function _clipboardExtractImageInputFromDataTransfer(dataTransfer) {
        return _clipboardExtractImageInputFromValues({
          blob: _clipboardExtractImageBlobFromDataTransfer(dataTransfer),
          uriList: _clipboardReadDataTransferText(dataTransfer, "text/uri-list"),
          html: _clipboardReadDataTransferText(dataTransfer, "text/html"),
          plainText: _clipboardReadDataTransferText(dataTransfer, "text/plain")
        }, {
          blobMessage: "Resolved media input from paste/drop file data",
          uriListMessage: "Resolved media input from paste/drop uri-list",
          htmlMessage: "Resolved media input from paste/drop HTML",
          plainTextMessage: "Resolved media input from paste/drop plain text URL",
          details: {
            dataTransfer: _clipboardDescribeDataTransfer(dataTransfer)
          }
        });
      }
      function _clipboardGetChatRootFromTarget(target) {
        return target?.closest?.(`[${CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE}="true"]`) || null;
      }
      function _clipboardIsEditableTarget(target) {
        return Boolean(
          target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable || target?.closest?.('[contenteditable="true"]')
        );
      }
      function _clipboardInsertTextAtTarget(target, text) {
        if (!text) return false;
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
          const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
          const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
          target.focus();
          target.setRangeText(text, start, end, "end");
          target.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        if (target?.isContentEditable) {
          target.focus();
          const selection = window.getSelection();
          if (!selection) return false;
          if (!selection.rangeCount) {
            const range2 = document.createRange();
            range2.selectNodeContents(target);
            range2.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range2);
          }
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          target.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      }
      module.exports = {
        _clipboardReadClipboardItems,
        _clipboardExtractImageBlob,
        _clipboardReadClipboardText,
        _clipboardExtractTextInput,
        _clipboardExtractImageUrlFromUriList,
        _clipboardExtractImageUrlFromText,
        _clipboardExtractImageUrlFromHtml,
        _clipboardCreateLoggedImageInput,
        _clipboardExtractTextInputFromValues,
        _clipboardExtractImageInputFromValues,
        _clipboardExtractImageInput,
        _clipboardExtractImageBlobFromDataTransfer,
        _clipboardReadDataTransferText,
        _clipboardExtractTextInputFromDataTransfer,
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardGetChatRootFromTarget,
        _clipboardIsEditableTarget,
        _clipboardInsertTextAtTarget
      };
    }
  });

  // src/notes.js
  var require_notes = __commonJS({
    "src/notes.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
        CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
        CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      var {
        _clipboardGetAssociatedNotePosition,
        _clipboardGetTextPreview,
        _clipboardCreateTextPageData,
        _clipboardAppendHtmlContent,
        _clipboardConvertTextToHtml,
        _clipboardGetTextPageFormat,
        _clipboardCreateSceneNoteData
      } = require_text();
      async function _clipboardCreateTextJournalEntry(text, name) {
        const journalEntry = await foundry.documents.JournalEntry.create({
          name: name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`,
          pages: [_clipboardCreateTextPageData(text, _clipboardGetTextPreview(text))]
        });
        return {
          entry: journalEntry,
          page: journalEntry?.pages?.contents?.[0] || null
        };
      }
      async function _clipboardAppendTextToPage(page, text) {
        if (!page || page.type !== "text") {
          throw new Error("Cannot append pasted text to a non-text journal page");
        }
        const updatedContent = _clipboardAppendHtmlContent(page.text?.content || "", _clipboardConvertTextToHtml(text));
        await page.update({
          "text.content": updatedContent,
          "text.format": _clipboardGetTextPageFormat()
        });
        return page;
      }
      function _clipboardGetAssociatedTextNoteData(document2) {
        return document2?.getFlag?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG) || null;
      }
      async function _clipboardEnsureAssociatedTextPage(document2, text) {
        const noteData = _clipboardGetAssociatedTextNoteData(document2);
        const existingEntry = noteData?.entryId ? game.journal?.get?.(noteData.entryId) : null;
        const existingPage = noteData?.pageId ? existingEntry?.pages?.get?.(noteData.pageId) : null;
        if (existingPage?.type === "text") {
          _clipboardLog("info", "Appending pasted text to existing placeable note page", {
            documentName: document2.documentName,
            documentId: document2.id,
            entryId: existingEntry.id,
            pageId: existingPage.id
          });
          await _clipboardAppendTextToPage(existingPage, text);
          return {
            entry: existingEntry,
            page: existingPage,
            noteId: noteData?.noteId || null
          };
        }
        const journalName = `${document2.name || document2.documentName} Notes`;
        if (existingEntry) {
          _clipboardLog("info", "Creating a new note page in an existing journal entry", {
            documentName: document2.documentName,
            documentId: document2.id,
            entryId: existingEntry.id
          });
          const createdPages = await existingEntry.createEmbeddedDocuments("JournalEntryPage", [
            _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME)
          ]);
          return {
            entry: existingEntry,
            page: createdPages[0],
            noteId: noteData?.noteId || null
          };
        }
        return {
          ...await _clipboardCreateTextJournalEntry(text, journalName),
          noteId: null
        };
      }
      async function _clipboardEnsurePlaceableTextNote(document2, text, fallbackPosition = null) {
        const position = _clipboardGetAssociatedNotePosition(document2, fallbackPosition);
        const label = `${document2.name || document2.documentName} Notes`;
        const { entry, page, noteId } = await _clipboardEnsureAssociatedTextPage(document2, text);
        if (!entry || !page || !position) {
          throw new Error("Failed to create or update a note journal for the selected placeable");
        }
        const existingNote = noteId ? canvas.scene?.notes?.get?.(noteId) : null;
        let note = existingNote;
        if (existingNote) {
          await existingNote.update({
            x: position.x,
            y: position.y,
            text: label,
            entryId: entry.id,
            pageId: page.id
          });
        } else {
          const createdNotes = await canvas.scene.createEmbeddedDocuments("Note", [
            _clipboardCreateSceneNoteData({
              entryId: entry.id,
              pageId: page.id,
              position,
              text: label
            })
          ]);
          note = createdNotes[0];
        }
        await document2.setFlag(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG, {
          entryId: entry.id,
          pageId: page.id,
          noteId: note?.id || null
        });
        _clipboardLog("info", "Created or updated a placeable text note", {
          documentName: document2.documentName,
          documentId: document2.id,
          entryId: entry.id,
          pageId: page.id,
          noteId: note?.id || null,
          position
        });
        return true;
      }
      async function _clipboardCreateStandaloneTextNote(text, context) {
        const position = context.mousePos;
        if (!position) return false;
        canvas?.notes?.activate?.();
        const preview = _clipboardGetTextPreview(text);
        const { entry, page } = await _clipboardCreateTextJournalEntry(text, `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${preview}`);
        await canvas.scene.createEmbeddedDocuments("Note", [
          _clipboardCreateSceneNoteData({
            entryId: entry.id,
            pageId: page.id,
            position,
            text: preview
          })
        ]);
        _clipboardLog("info", "Created standalone text note", {
          entryId: entry.id,
          pageId: page.id,
          position,
          preview
        });
        return true;
      }
      module.exports = {
        _clipboardCreateTextJournalEntry,
        _clipboardAppendTextToPage,
        _clipboardGetAssociatedTextNoteData,
        _clipboardEnsureAssociatedTextPage,
        _clipboardEnsurePlaceableTextNote,
        _clipboardCreateStandaloneTextNote
      };
    }
  });

  // src/chat.js
  var require_chat = __commonJS({
    "src/chat.js"(exports, module) {
      var { _clipboardLog } = require_diagnostics();
      var { _clipboardGetMediaKind } = require_media();
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardUploadBlob
      } = require_storage();
      function _clipboardCreateChatMediaContent(path) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        const figure = document.createElement("figure");
        figure.className = "clipboard-image-chat-message";
        if (mediaKind === "video") {
          const video = document.createElement("video");
          video.className = "clipboard-image-chat-thumbnail";
          video.src = path;
          video.controls = true;
          video.loop = true;
          video.preload = "metadata";
          video.playsInline = true;
          figure.append(video);
        } else {
          const previewLink = document.createElement("a");
          previewLink.className = "clipboard-image-chat-link";
          previewLink.href = path;
          previewLink.target = "_blank";
          previewLink.rel = "noopener noreferrer";
          const image = document.createElement("img");
          image.className = "clipboard-image-chat-thumbnail";
          image.src = path;
          image.alt = "Pasted chat media";
          previewLink.append(image);
          figure.append(previewLink);
        }
        const caption = document.createElement("figcaption");
        const openLink = document.createElement("a");
        openLink.href = path;
        openLink.target = "_blank";
        openLink.rel = "noopener noreferrer";
        openLink.textContent = "Open full media";
        caption.append(openLink);
        figure.append(caption);
        return figure.outerHTML;
      }
      async function _clipboardCreateChatMessage(path) {
        _clipboardLog("info", "Creating chat media message", {
          path,
          mediaKind: _clipboardGetMediaKind({ src: path }) || "image"
        });
        return foundry.documents.ChatMessage.create({
          content: _clipboardCreateChatMediaContent(path),
          speaker: foundry.documents.ChatMessage.getSpeaker(),
          user: game.user.id
        });
      }
      async function _clipboardPostChatImage(blob) {
        const destination = _clipboardGetUploadDestination();
        await _clipboardCreateFolderIfMissing(destination);
        const path = await _clipboardUploadBlob(blob, destination);
        await _clipboardCreateChatMessage(path);
        return true;
      }
      module.exports = {
        _clipboardCreateChatMediaContent,
        _clipboardCreateChatMessage,
        _clipboardPostChatImage
      };
    }
  });

  // src/workflows.js
  var require_workflows = __commonJS({
    "src/workflows.js"(exports, module) {
      var { CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS, CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT } = require_constants();
      var {
        _clipboardDescribeImageInput,
        _clipboardDescribePasteContext,
        _clipboardDescribeReplacementTarget,
        _clipboardLog,
        _clipboardSerializeError,
        _clipboardDescribeFile
      } = require_diagnostics();
      var {
        _clipboardGetMediaKind,
        _clipboardNormalizePastedText,
        _clipboardLoadMediaDimensions
      } = {
        ...require_media(),
        ...require_text()
      };
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardResolveImageInputBlob,
        _clipboardUploadBlob
      } = require_storage();
      var {
        _clipboardResolvePasteContext,
        _clipboardCanPasteToContext,
        _clipboardPrepareCreateLayer,
        _clipboardReplaceControlledMedia,
        _clipboardHasCopiedObjects
      } = require_context();
      var {
        _clipboardReadClipboardItems,
        _clipboardExtractImageInput,
        _clipboardExtractTextInput
      } = require_clipboard();
      var {
        _clipboardEnsurePlaceableTextNote,
        _clipboardCreateStandaloneTextNote
      } = require_notes();
      var { _clipboardPostChatImage } = require_chat();
      var { _clipboardGetLocked, _clipboardSetLocked } = require_state();
      async function _clipboardApplyPasteResult(path, context) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind)) {
          _clipboardLog("info", "Applied pasted media by replacing controlled documents", {
            path,
            mediaKind,
            replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget)
          });
          return true;
        }
        const { width: imgWidth, height: imgHeight } = await _clipboardLoadMediaDimensions(path);
        const createData = await context.createStrategy.createData({
          path,
          imgWidth,
          imgHeight,
          mediaKind,
          mousePos: context.mousePos
        });
        await canvas.scene.createEmbeddedDocuments(context.createStrategy.documentName, createData);
        _clipboardLog("info", "Applied pasted media by creating new documents", {
          path,
          mediaKind,
          documentName: context.createStrategy.documentName,
          createCount: createData.length,
          mousePos: context.mousePos
        });
        return true;
      }
      async function _clipboardPasteBlob(blob, targetFolder, contextOptions = {}) {
        if (!canvas?.ready || !canvas.scene) return false;
        const context = _clipboardResolvePasteContext(contextOptions);
        _clipboardLog("debug", "Resolved canvas paste context", {
          context: _clipboardDescribePasteContext(context),
          destination: require_diagnostics()._clipboardDescribeDestinationForLog(targetFolder),
          blob: _clipboardDescribeImageInput({ blob })
        });
        if (!_clipboardCanPasteToContext(context)) {
          _clipboardLog("info", "Skipping canvas paste because the current context is not eligible", {
            context: _clipboardDescribePasteContext(context)
          });
          return false;
        }
        _clipboardPrepareCreateLayer(context);
        const path = await _clipboardUploadBlob(blob, targetFolder);
        return _clipboardApplyPasteResult(path, context);
      }
      function _clipboardHasPasteConflict({ respectCopiedObjects = true } = {}) {
        if (respectCopiedObjects && _clipboardHasCopiedObjects()) {
          _clipboardLog("warn", "Priority given to Foundry copied objects.");
          return true;
        }
        if (_clipboardGetLocked()) {
          _clipboardLog("info", "Skipping paste because the module is already handling another paste.");
          return true;
        }
        if (game.modules.get("vtta-tokenizer")?.active && Object.values(ui.windows).some((windowApp) => windowApp.id === "tokenizer-control")) {
          _clipboardLog("info", "Skipping paste because VTTA Tokenizer is active.");
          return true;
        }
        return false;
      }
      async function _clipboardExecutePasteWorkflow(workflow, options = {}) {
        const { notifyError = true, respectCopiedObjects = true } = options;
        if (_clipboardHasPasteConflict({ respectCopiedObjects })) return false;
        _clipboardSetLocked(true);
        _clipboardLog("debug", "Starting paste workflow", {
          options
        });
        try {
          const result = await workflow();
          _clipboardLog("debug", "Finished paste workflow", {
            options,
            result
          });
          return result;
        } catch (error) {
          if (notifyError) {
            const message = error instanceof Error && error.message ? `Clipboard Image: ${error.message}` : "Clipboard Image: Failed to handle media input. Check the console.";
            ui.notifications.error(message);
          }
          _clipboardLog("error", "Failed to handle media input", {
            options,
            error: _clipboardSerializeError(error)
          });
          return false;
        } finally {
          _clipboardSetLocked(false);
        }
      }
      async function _clipboardHandleImageBlob(blob, options = {}) {
        if (!blob) return false;
        const destination = _clipboardGetUploadDestination();
        await _clipboardCreateFolderIfMissing(destination);
        return _clipboardPasteBlob(blob, destination, options.contextOptions);
      }
      async function _clipboardHandleImageInput(imageInput, options = {}) {
        _clipboardLog("debug", "Handling media input", {
          imageInput: _clipboardDescribeImageInput(imageInput)
        });
        const blob = await _clipboardResolveImageInputBlob(imageInput);
        if (!blob) return false;
        return _clipboardHandleImageBlob(blob, options);
      }
      async function _clipboardHandleImageInputWithTextFallback(imageInput, options = {}) {
        try {
          return await _clipboardHandleImageInput(imageInput, options);
        } catch (error) {
          const fallbackText = _clipboardNormalizePastedText(imageInput?.text || imageInput?.url || "");
          if (!fallbackText) throw error;
          _clipboardLog("info", "Falling back to pasted text after media handling failed.", {
            imageInput: _clipboardDescribeImageInput(imageInput),
            error: _clipboardSerializeError(error)
          });
          return _clipboardHandleTextInput({ text: fallbackText }, options);
        }
      }
      async function _clipboardHandleChatImageBlob(blob) {
        if (!blob) return false;
        return _clipboardPostChatImage(blob);
      }
      async function _clipboardHandleChatImageInput(imageInput) {
        const blob = await _clipboardResolveImageInputBlob(imageInput);
        if (!blob) return false;
        return _clipboardHandleChatImageBlob(blob);
      }
      async function _clipboardHandleTextInput(textInput, options = {}) {
        const text = _clipboardNormalizePastedText(textInput?.text);
        if (!text) return false;
        if (!canvas?.ready || !canvas.scene) return false;
        const context = _clipboardResolvePasteContext(options.contextOptions);
        _clipboardLog("debug", "Handling pasted text", {
          textLength: text.length,
          context: _clipboardDescribePasteContext(context)
        });
        if (!_clipboardCanPasteToContext(context)) {
          _clipboardLog("info", "Skipping pasted text because the current context is not eligible", {
            context: _clipboardDescribePasteContext(context)
          });
          return false;
        }
        if (context.replacementTarget?.documents?.length) {
          _clipboardLog("info", "Applying pasted text to controlled placeables", {
            replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget),
            textLength: text.length
          });
          for (const document2 of context.replacementTarget.documents) {
            await _clipboardEnsurePlaceableTextNote(document2, text, context.mousePos);
          }
          return true;
        }
        _clipboardLog("info", "Creating a standalone text note from pasted text", {
          textLength: text.length,
          mousePos: context.mousePos
        });
        return _clipboardCreateStandaloneTextNote(text, context);
      }
      async function _clipboardReadAndPasteImage(options = {}) {
        const clipItems = await _clipboardReadClipboardItems();
        if (!clipItems?.length) {
          if (options.notifyNoImage) ui.notifications.warn("Clipboard Image: No clipboard media was available.");
          return false;
        }
        const imageInput = await _clipboardExtractImageInput(clipItems);
        if (!imageInput) {
          if (options.notifyNoImage) ui.notifications.warn("Clipboard Image: No supported media or media URL was found in the clipboard.");
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
          if (options.notifyNoContent) ui.notifications.warn("Clipboard Image: No clipboard data was available.");
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
          ui.notifications.warn("Clipboard Image: No supported media or text was found in the clipboard.");
        }
        return false;
      }
      function _clipboardChooseImageFile() {
        return new Promise((resolve) => {
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
          input.addEventListener("change", onChange, { once: true });
          window.addEventListener("focus", onWindowFocus, { once: true });
          document.body.appendChild(input);
          input.click();
        });
      }
      async function _clipboardChooseAndHandleMediaFile({ emptyMessage, selectedMessage, handler }) {
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
          handler: (file) => _clipboardHandleImageBlob(file, {
            contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
          })
        });
      }
      async function _clipboardOpenChatUploadPicker() {
        return _clipboardChooseAndHandleMediaFile({
          emptyMessage: "Chat upload picker closed without selecting a file.",
          selectedMessage: "Selected a media file from the chat upload picker",
          handler: (file) => _clipboardHandleChatImageBlob(file)
        });
      }
      function _clipboardHandleScenePasteAction() {
        if (!navigator.clipboard?.read) {
          ui.notifications.warn("Clipboard Image: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
          return;
        }
        _clipboardLog("info", "Invoked scene Paste Media action.", {
          activeLayer: canvas?.activeLayer?.options?.name || null
        });
        void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteImage({
          notifyNoImage: true,
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
      }
      function _clipboardHandleSceneUploadAction() {
        _clipboardLog("info", "Invoked scene Upload Media action.", {
          activeLayer: canvas?.activeLayer?.options?.name || null
        });
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
          respectCopiedObjects: false
        });
      }
      function _clipboardHandleChatUploadAction() {
        _clipboardLog("info", "Invoked chat Upload Media action.");
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
          respectCopiedObjects: false
        });
      }
      module.exports = {
        _clipboardApplyPasteResult,
        _clipboardPasteBlob,
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
        _clipboardHandleScenePasteAction,
        _clipboardHandleSceneUploadAction,
        _clipboardHandleChatUploadAction
      };
    }
  });

  // src/ui.js
  var require_ui = __commonJS({
    "src/ui.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_SCENE_CONTROLS,
        CLIPBOARD_IMAGE_TOOL_PASTE,
        CLIPBOARD_IMAGE_TOOL_UPLOAD,
        CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION
      } = require_constants();
      var { CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS, _clipboardSetHiddenMode } = require_state();
      var {
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardDescribePasteContext,
        _clipboardLog
      } = require_diagnostics();
      var {
        _clipboardExtractImageBlobFromDataTransfer,
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardExtractTextInputFromDataTransfer,
        _clipboardGetChatRootFromTarget,
        _clipboardIsEditableTarget,
        _clipboardInsertTextAtTarget
      } = require_clipboard();
      var {
        _clipboardResolvePasteContext,
        _clipboardCanPasteToContext
      } = require_context();
      var {
        _clipboardExecutePasteWorkflow,
        _clipboardHandleChatImageInput,
        _clipboardHandleImageInputWithTextFallback,
        _clipboardHandleTextInput,
        _clipboardReadAndPasteClipboardContent,
        _clipboardHasPasteConflict,
        _clipboardHandleScenePasteAction,
        _clipboardHandleSceneUploadAction,
        _clipboardHandleChatUploadAction
      } = require_workflows();
      function _clipboardAddSceneControlButtons(controls) {
        for (const controlName of CLIPBOARD_IMAGE_SCENE_CONTROLS) {
          const control = controls[controlName];
          if (!control?.tools) continue;
          const order = Object.keys(control.tools).length;
          control.tools[CLIPBOARD_IMAGE_TOOL_PASTE] = {
            name: CLIPBOARD_IMAGE_TOOL_PASTE,
            title: "Paste Media",
            icon: "fa-solid fa-paste",
            order,
            button: true,
            visible: game.user.isGM,
            onChange: () => _clipboardHandleScenePasteAction()
          };
          control.tools[CLIPBOARD_IMAGE_TOOL_UPLOAD] = {
            name: CLIPBOARD_IMAGE_TOOL_UPLOAD,
            title: "Upload Media",
            icon: "fa-solid fa-file-image",
            order: order + 1,
            button: true,
            visible: game.user.isGM,
            onChange: () => _clipboardHandleSceneUploadAction()
          };
        }
      }
      function _clipboardToggleChatDropTarget(root, active) {
        root.classList.toggle("clipboard-image-chat-drop-target", active);
      }
      function _clipboardOnChatDragOver(event) {
        const root = event.currentTarget;
        const blob = _clipboardExtractImageBlobFromDataTransfer(event.dataTransfer);
        if (!blob) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        _clipboardToggleChatDropTarget(root, true);
      }
      function _clipboardOnChatDragLeave(event) {
        const root = event.currentTarget;
        if (root.contains(event.relatedTarget)) return;
        _clipboardToggleChatDropTarget(root, false);
      }
      function _clipboardOnChatDrop(event) {
        const root = event.currentTarget;
        _clipboardToggleChatDropTarget(root, false);
        const mediaInput = _clipboardExtractImageInputFromDataTransfer(event.dataTransfer);
        if (!mediaInput) return;
        _clipboardLog("info", "Handling dropped media in chat.", {
          imageInput: _clipboardDescribeImageInput(mediaInput),
          dataTransfer: _clipboardDescribeDataTransfer(event.dataTransfer)
        });
        event.preventDefault();
        event.stopPropagation();
        void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInput(mediaInput), {
          respectCopiedObjects: false
        });
      }
      function _clipboardAttachChatUploadButton(root) {
        if (root.querySelector(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`)) return;
        const form = root.matches("form") ? root : root.querySelector("form") || root.closest("form");
        if (!form) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "clipboard-image-chat-upload";
        button.dataset.action = CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION;
        button.title = "Upload Chat Media";
        button.ariaLabel = "Upload Chat Media";
        button.innerHTML = `<i class="fa-solid fa-file-image"></i>`;
        button.addEventListener("click", () => _clipboardHandleChatUploadAction());
        form.append(button);
      }
      function _clipboardBindChatRoot(root) {
        if (!root || CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.has(root)) return;
        root.setAttribute(require_constants().CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE, "true");
        root.addEventListener("dragover", _clipboardOnChatDragOver);
        root.addEventListener("dragleave", _clipboardOnChatDragLeave);
        root.addEventListener("drop", _clipboardOnChatDrop);
        _clipboardAttachChatUploadButton(root);
        CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS.add(root);
      }
      function _clipboardOnRenderChatInput(_app, elements) {
        for (const element of Object.values(elements || {})) {
          if (!(element instanceof HTMLElement)) continue;
          const root = element.matches("form") ? element : element.closest("form") || element;
          _clipboardBindChatRoot(root);
        }
      }
      async function _clipboardHandleChatImageInputWithTextFallback(imageInput, target) {
        try {
          return await _clipboardHandleChatImageInput(imageInput);
        } catch (error) {
          if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) return false;
          throw error;
        }
      }
      function _clipboardConsumePasteEvent(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      function _clipboardCanHandleCanvasPasteContext(context, rejectionMessage) {
        if (_clipboardCanPasteToContext(context)) return true;
        _clipboardLog("info", rejectionMessage, {
          context: _clipboardDescribePasteContext(context)
        });
        return false;
      }
      function _clipboardOnPaste(event) {
        _clipboardLog("debug", "Received paste event.", {
          targetTagName: event.target?.tagName || null,
          isChatTarget: Boolean(_clipboardGetChatRootFromTarget(event.target)),
          isEditableTarget: _clipboardIsEditableTarget(event.target),
          dataTransfer: _clipboardDescribeDataTransfer(event.clipboardData)
        });
        const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
        if (imageInput) {
          if (_clipboardGetChatRootFromTarget(event.target)) {
            if (_clipboardHasPasteConflict({ respectCopiedObjects: false })) return;
            _clipboardConsumePasteEvent(event);
            void _clipboardExecutePasteWorkflow(() => _clipboardHandleChatImageInputWithTextFallback(imageInput, event.target), {
              respectCopiedObjects: false
            });
            return;
          }
          const context2 = _clipboardResolvePasteContext();
          if (!_clipboardCanHandleCanvasPasteContext(context2, "Ignoring pasted media because the canvas context is not eligible.")) return;
          if (_clipboardHasPasteConflict()) return;
          _clipboardConsumePasteEvent(event);
          void _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInputWithTextFallback(imageInput), {
            respectCopiedObjects: false
          });
          return;
        }
        const textInput = _clipboardExtractTextInputFromDataTransfer(event.clipboardData);
        if (!textInput) return;
        if (_clipboardGetChatRootFromTarget(event.target) || _clipboardIsEditableTarget(event.target)) return;
        const context = _clipboardResolvePasteContext();
        if (!_clipboardCanHandleCanvasPasteContext(context, "Ignoring pasted text because the canvas context is not eligible.")) return;
        if (_clipboardHasPasteConflict()) return;
        _clipboardConsumePasteEvent(event);
        void _clipboardExecutePasteWorkflow(() => _clipboardHandleTextInput(textInput), {
          respectCopiedObjects: false
        });
      }
      function _clipboardOnKeydown(event) {
        const hiddenMode = (event.ctrlKey || event.metaKey) && event.getModifierState("CapsLock");
        if (hiddenMode !== require_state()._clipboardGetHiddenMode()) {
          _clipboardLog("debug", "Updated hidden paste mode.", {
            hiddenMode,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            code: event.code
          });
        }
        _clipboardSetHiddenMode(hiddenMode);
        if (event.defaultPrevented || event.repeat) return;
        if (event.code !== "KeyV" || !event.metaKey || event.ctrlKey || event.altKey) return;
        if (!navigator.clipboard?.read) return;
        const context = _clipboardResolvePasteContext();
        if (!_clipboardCanPasteToContext(context)) return;
        if (_clipboardHasPasteConflict()) return;
        event.preventDefault();
        void _clipboardExecutePasteWorkflow(() => _clipboardReadAndPasteClipboardContent(), {
          respectCopiedObjects: false
        });
      }
      module.exports = {
        _clipboardAddSceneControlButtons,
        _clipboardToggleChatDropTarget,
        _clipboardOnChatDragOver,
        _clipboardOnChatDragLeave,
        _clipboardOnChatDrop,
        _clipboardAttachChatUploadButton,
        _clipboardBindChatRoot,
        _clipboardOnRenderChatInput,
        _clipboardHandleChatImageInputWithTextFallback,
        _clipboardConsumePasteEvent,
        _clipboardCanHandleCanvasPasteContext,
        _clipboardOnPaste,
        _clipboardOnKeydown
      };
    }
  });

  // src/config-app.js
  var require_config_app = __commonJS({
    "src/config-app.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_SOURCE_S3,
        CLIPBOARD_IMAGE_FILE_PICKER,
        CLIPBOARD_IMAGE_FORM_APPLICATION
      } = require_constants();
      var {
        _clipboardResolveSource,
        _clipboardCanSelectSource,
        _clipboardGetStoredSource,
        _clipboardGetTargetFolder,
        _clipboardGetStoredBucket,
        _clipboardGetUploadDestination,
        _clipboardDescribeDestination,
        _clipboardGetSourceChoices
      } = require_storage();
      var ClipboardImageDestinationConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            id: "clipboard-image-destination-config",
            title: "Clipboard Image: Upload Destination",
            template: "modules/clipboard-image/templates/upload-destination.hbs",
            width: 520,
            closeOnSubmit: true
          });
        }
        getData() {
          const source = _clipboardGetStoredSource();
          const target = _clipboardGetTargetFolder();
          const bucket = _clipboardGetStoredBucket();
          const destination = _clipboardGetUploadDestination({ storedSource: source, target, bucket });
          return {
            bucket,
            destinationSummary: _clipboardDescribeDestination(destination),
            isS3: destination.storedSource === CLIPBOARD_IMAGE_SOURCE_S3,
            source,
            sourceChoices: _clipboardGetSourceChoices(source),
            target
          };
        }
        activateListeners(html) {
          super.activateListeners(html);
          const sourceField = html.find('[name="source"]');
          const targetField = html.find('[name="target"]');
          const bucketField = html.find('[name="bucket"]');
          sourceField.on("change", () => this._refreshFormState());
          targetField.on("input", () => this._refreshFormState());
          bucketField.on("input", () => this._refreshFormState());
          html.find('[data-action="browse-destination"]').on("click", (event) => this._onBrowseDestination(event));
          this._refreshFormState();
        }
        _ensureSourceOption(source) {
          const sourceField = this.form?.elements?.source;
          if (!sourceField || !source) return;
          const choices = Array.from(sourceField.options).map((option2) => option2.value);
          if (choices.includes(source)) return;
          const option = document.createElement("option");
          option.value = source;
          option.text = `Custom (${source})`;
          sourceField.add(option);
        }
        _refreshFormState() {
          const form = this.form;
          if (!form) return;
          const storedSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const target = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const bucket = storedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? form.elements.bucket.value?.trim() || "" : "";
          const destination = _clipboardGetUploadDestination({ storedSource, target, bucket });
          const summaryField = form.querySelector('[data-role="destination-summary"]');
          const bucketGroup = this.element.find(".clipboard-image-s3-bucket");
          if (summaryField) summaryField.value = _clipboardDescribeDestination(destination);
          bucketGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
        }
        _applyPickerSelection(path, picker, previousStoredSource) {
          const form = this.form;
          if (!form) return;
          const selectedSource = picker.activeSource || _clipboardResolveSource(previousStoredSource);
          if (!_clipboardCanSelectSource(selectedSource)) {
            ui.notifications.warn("Clipboard Image: The selected file source does not support pasted uploads.");
            return;
          }
          const keepAutomatic = previousStoredSource === CLIPBOARD_IMAGE_SOURCE_AUTO && selectedSource === _clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO);
          const bucket = selectedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? picker.sources?.s3?.bucket || "" : "";
          this._ensureSourceOption(selectedSource);
          form.elements.source.value = keepAutomatic ? CLIPBOARD_IMAGE_SOURCE_AUTO : selectedSource;
          form.elements.target.value = path || picker.target || form.elements.target.value;
          form.elements.bucket.value = bucket;
          this._refreshFormState();
        }
        _onBrowseDestination(event) {
          event.preventDefault();
          const form = this.form;
          if (!form) return;
          const previousStoredSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const activeSource = _clipboardResolveSource(previousStoredSource);
          const currentTarget = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const currentBucket = form.elements.bucket.value?.trim() || "";
          const picker = new CLIPBOARD_IMAGE_FILE_PICKER({
            activeSource,
            button: event.currentTarget,
            callback: (path) => this._applyPickerSelection(path, picker, previousStoredSource),
            current: currentTarget,
            field: form.elements.target,
            type: "folder"
          });
          if (activeSource === CLIPBOARD_IMAGE_SOURCE_S3) {
            picker.sources.s3 = picker.sources.s3 || { target: currentTarget };
            picker.sources.s3.bucket = currentBucket || picker.sources.s3.bucket;
            picker.sources.s3.target = currentTarget;
          }
          void picker.render(true);
        }
        async _updateObject(_event, formData) {
          const source = formData.source?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
          const target = formData.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
          const bucket = source === CLIPBOARD_IMAGE_SOURCE_S3 ? formData.bucket?.trim() || "" : "";
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", source);
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location", target);
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", bucket);
        }
      };
      module.exports = {
        ClipboardImageDestinationConfig
      };
    }
  });

  // src/settings.js
  var require_settings = __commonJS({
    "src/settings.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING
      } = require_constants();
      var { ClipboardImageDestinationConfig } = require_config_app();
      function _clipboardRegisterSettings() {
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
          name: "Upload destination",
          label: "Configure",
          hint: "Choose the file store and folder used for pasted images. Supports User Data, The Forge, and Amazon S3 through Foundry's native file picker.",
          icon: "fa-solid fa-folder-tree",
          type: ClipboardImageDestinationConfig,
          restricted: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
          name: "Pasted image location",
          hint: "Folder where clipboard images are saved.",
          scope: "world",
          config: false,
          type: String,
          default: CLIPBOARD_IMAGE_DEFAULT_FOLDER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
          name: "Pasted image source",
          hint: "File source where clipboard images are saved.",
          scope: "world",
          config: false,
          type: String,
          default: CLIPBOARD_IMAGE_SOURCE_AUTO
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
          name: "Pasted image S3 bucket",
          hint: "S3 bucket used when clipboard images are saved to Amazon S3.",
          scope: "world",
          config: false,
          type: String,
          default: ""
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING, {
          name: "Verbose logging",
          hint: "Log detailed clipboard-image diagnostics to the browser console for debugging.",
          scope: "client",
          config: true,
          type: Boolean,
          default: false
        });
      }
      module.exports = {
        _clipboardRegisterSettings
      };
    }
  });

  // src/index.js
  var require_index = __commonJS({
    "src/index.js"(exports, module) {
      var constants = require_constants();
      var diagnostics = require_diagnostics();
      var storage = require_storage();
      var media = require_media();
      var text = require_text();
      var context = require_context();
      var clipboard = require_clipboard();
      var notes = require_notes();
      var chat = require_chat();
      var workflows = require_workflows();
      var uiHandlers = require_ui();
      var { ClipboardImageDestinationConfig } = require_config_app();
      var { _clipboardRegisterSettings } = require_settings();
      var state = require_state();
      document.addEventListener("keydown", uiHandlers._clipboardOnKeydown);
      document.addEventListener("paste", uiHandlers._clipboardOnPaste);
      Hooks.once("init", function() {
        _clipboardRegisterSettings();
        Hooks.on("getSceneControlButtons", uiHandlers._clipboardAddSceneControlButtons);
        Hooks.on("renderChatInput", uiHandlers._clipboardOnRenderChatInput);
        diagnostics._clipboardLog("info", "Initializing clipboard-image module.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          sceneControls: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS
        });
        if (navigator.clipboard?.read) {
          game.keybindings.register("clipboard-image", "paste-image", {
            name: "Paste Clipboard Content",
            restricted: true,
            uneditable: [
              { key: "KeyV", modifiers: [constants.CLIPBOARD_IMAGE_KEYBOARD_MANAGER.MODIFIER_KEYS.CONTROL] }
            ],
            onDown: () => {
              if (state._clipboardGetLocked()) return true;
              const runtimeContext = context._clipboardResolvePasteContext();
              if (!context._clipboardCanPasteToContext(runtimeContext)) return false;
              if (workflows._clipboardHasPasteConflict()) return false;
              void workflows._clipboardExecutePasteWorkflow(() => workflows._clipboardReadAndPasteClipboardContent(), {
                respectCopiedObjects: false
              });
              return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY
          });
        }
      });
      Hooks.once("ready", function() {
        diagnostics._clipboardLog("info", "clipboard-image module is ready.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          verboseLogging: diagnostics._clipboardVerboseLoggingEnabled()
        });
        if (game.user.isGM && !navigator.clipboard?.read) {
          ui.notifications.info("Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and Upload Media scene controls are still available.");
          diagnostics._clipboardLog("info", "Direct clipboard reads are unavailable; paste-event and upload fallbacks remain available.");
        }
      });
      module.exports = {
        ClipboardImageDestinationConfig,
        __testables: {
          ...diagnostics,
          ...storage,
          ...media,
          ...text,
          ...context,
          ...clipboard,
          ...notes,
          ...chat,
          ...workflows,
          ...uiHandlers,
          _clipboardRegisterSettings,
          ...state,
          constants: {
            CLIPBOARD_IMAGE_MODULE_ID: constants.CLIPBOARD_IMAGE_MODULE_ID,
            CLIPBOARD_IMAGE_DEFAULT_FOLDER: constants.CLIPBOARD_IMAGE_DEFAULT_FOLDER,
            CLIPBOARD_IMAGE_SOURCE_AUTO: constants.CLIPBOARD_IMAGE_SOURCE_AUTO,
            CLIPBOARD_IMAGE_SOURCE_DATA: constants.CLIPBOARD_IMAGE_SOURCE_DATA,
            CLIPBOARD_IMAGE_SOURCE_S3: constants.CLIPBOARD_IMAGE_SOURCE_S3,
            CLIPBOARD_IMAGE_SOURCE_FORGE: constants.CLIPBOARD_IMAGE_SOURCE_FORGE,
            CLIPBOARD_IMAGE_SCENE_CONTROLS: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS,
            CLIPBOARD_IMAGE_TOOL_PASTE: constants.CLIPBOARD_IMAGE_TOOL_PASTE,
            CLIPBOARD_IMAGE_TOOL_UPLOAD: constants.CLIPBOARD_IMAGE_TOOL_UPLOAD,
            CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE: constants.CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE,
            CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION: constants.CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
            CLIPBOARD_IMAGE_TEXT_NOTE_FLAG: constants.CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
            CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME: constants.CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
            CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX: constants.CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
            CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING: constants.CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
            CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT: constants.CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
            CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS: constants.CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
          }
        }
      };
    }
  });
  return require_index();
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ClipboardImageRuntime;
