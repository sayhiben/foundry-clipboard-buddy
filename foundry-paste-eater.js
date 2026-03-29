// Generated from src/. Do not edit foundry-paste-eater.js directly.

var FoundryPasteEaterRuntime = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/constants.js
  var require_constants = __commonJS({
    "src/constants.js"(exports, module) {
      var CLIPBOARD_IMAGE_MODULE_ID = "foundry-paste-eater";
      var CLIPBOARD_IMAGE_LEGACY_MODULE_ID = "clipboard-image";
      var CLIPBOARD_IMAGE_TITLE = "Foundry Paste Eater";
      var CLIPBOARD_IMAGE_DEFAULT_FOLDER = "pasted_images";
      var CLIPBOARD_IMAGE_SOURCE_AUTO = "auto";
      var CLIPBOARD_IMAGE_SOURCE_DATA = "data";
      var CLIPBOARD_IMAGE_SOURCE_S3 = "s3";
      var CLIPBOARD_IMAGE_SOURCE_FORGE = "forgevtt";
      var CLIPBOARD_IMAGE_FILE_PICKER = foundry.applications.apps.FilePicker.implementation;
      var CLIPBOARD_IMAGE_KEYBOARD_MANAGER = foundry.helpers.interaction.KeyboardManager;
      var CLIPBOARD_IMAGE_FORM_APPLICATION = foundry.appv1.api.FormApplication;
      var CLIPBOARD_IMAGE_SCENE_CONTROLS = ["tiles", "tokens"];
      var CLIPBOARD_IMAGE_TOOL_PASTE = "foundry-paste-eater-paste";
      var CLIPBOARD_IMAGE_TOOL_UPLOAD = "foundry-paste-eater-upload";
      var CLIPBOARD_IMAGE_CHAT_ROOT_ATTRIBUTE = "data-foundry-paste-eater-chat-root";
      var CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION = "foundry-paste-eater-chat-upload";
      var CLIPBOARD_IMAGE_TEXT_NOTE_FLAG = "textNote";
      var CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME = "Notes";
      var CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX = "Pasted Note";
      var CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING = "verbose-logging";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING = "minimum-role-canvas-media";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING = "minimum-role-canvas-text";
      var CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING = "minimum-role-chat-media";
      var CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING = "allow-non-gm-scene-controls";
      var CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING = "enable-chat-media";
      var CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING = "enable-chat-upload-button";
      var CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING = "enable-token-creation";
      var CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING = "enable-tile-creation";
      var CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING = "enable-token-replacement";
      var CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING = "enable-tile-replacement";
      var CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING = "enable-scene-paste-tool";
      var CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING = "enable-scene-upload-tool";
      var CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING = "default-empty-canvas-target";
      var CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING = "create-backing-actors";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING = "chat-media-display";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING = "canvas-text-paste-mode";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING = "scene-paste-prompt-mode";
      var CLIPBOARD_IMAGE_ROLE_PLAYER = "PLAYER";
      var CLIPBOARD_IMAGE_ROLE_TRUSTED = "TRUSTED";
      var CLIPBOARD_IMAGE_ROLE_ASSISTANT = "ASSISTANT";
      var CLIPBOARD_IMAGE_ROLE_GAMEMASTER = "GAMEMASTER";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER = "active-layer";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE = "tile";
      var CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN = "token";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW = "full-preview";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL = "thumbnail";
      var CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY = "link-only";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES = "scene-notes";
      var CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED = "disabled";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO = "auto";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS = "always";
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER = "never";
      var CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT = "image/*,video/*";
      var CLIPBOARD_IMAGE_IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["apng", "avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"]);
      var CLIPBOARD_IMAGE_VIDEO_EXTENSIONS = /* @__PURE__ */ new Set(["m4v", "mp4", "mpeg", "mpg", "ogg", "ogv", "webm"]);
      var CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS = Object.freeze({
        fallbackToCenter: true,
        requireCanvasFocus: false
      });
      module.exports = {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
        CLIPBOARD_IMAGE_TITLE,
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
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
        CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
        CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
        CLIPBOARD_IMAGE_ROLE_PLAYER,
        CLIPBOARD_IMAGE_ROLE_TRUSTED,
        CLIPBOARD_IMAGE_ROLE_ASSISTANT,
        CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
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
      function _clipboardParseSvgLength(value) {
        const normalized = String(value || "").trim();
        if (!normalized || normalized.endsWith("%")) return null;
        const match = normalized.match(/^([0-9]*\.?[0-9]+)(px)?$/i);
        if (!match) return null;
        const parsed = Number.parseFloat(match[1]);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      }
      function _clipboardGetSvgViewBoxDimensions(svgElement) {
        const viewBox = svgElement?.getAttribute?.("viewBox")?.trim();
        if (!viewBox) return null;
        const values = viewBox.split(/[\s,]+/).map(Number.parseFloat);
        if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
        const [, , width, height] = values;
        if (!(width > 0) || !(height > 0)) return null;
        return { width, height };
      }
      function _clipboardGetSvgElementFromText(svgText) {
        const documentFragment = new DOMParser().parseFromString(svgText, "image/svg+xml");
        return documentFragment.documentElement?.nodeName === "svg" ? documentFragment.documentElement : documentFragment.querySelector?.("svg");
      }
      function _clipboardGetSvgIntrinsicDimensionsFromText(svgText) {
        if (!svgText?.trim()) return null;
        const svgElement = _clipboardGetSvgElementFromText(svgText);
        if (!svgElement) return null;
        const width = _clipboardParseSvgLength(svgElement.getAttribute("width"));
        const height = _clipboardParseSvgLength(svgElement.getAttribute("height"));
        if (width && height) {
          return { width, height };
        }
        const viewBoxDimensions = _clipboardGetSvgViewBoxDimensions(svgElement);
        if (!viewBoxDimensions) return null;
        if (width) {
          return {
            width,
            height: _clipboardRoundDimension(width * (viewBoxDimensions.height / viewBoxDimensions.width))
          };
        }
        if (height) {
          return {
            width: _clipboardRoundDimension(height * (viewBoxDimensions.width / viewBoxDimensions.height)),
            height
          };
        }
        return viewBoxDimensions;
      }
      async function _clipboardReadBlobText(blob) {
        if (typeof blob?.text === "function") {
          return blob.text();
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(reader.error || new Error("Failed to read pasted SVG content"));
          reader.readAsText(blob);
        });
      }
      async function _clipboardGetPreferredMediaDimensions(blob) {
        if (_clipboardGetMediaKind({ blob, filename: blob?.name }) !== "image") return null;
        if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
          return null;
        }
        const svgText = await _clipboardReadBlobText(blob);
        const svgDimensions = _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
        if (!svgDimensions) return null;
        _clipboardLog("debug", "Resolved intrinsic SVG dimensions from uploaded media", {
          width: svgDimensions.width,
          height: svgDimensions.height,
          fileName: blob?.name || null,
          mimeType: _clipboardNormalizeMimeType(blob?.type) || null
        });
        return svgDimensions;
      }
      async function _clipboardNormalizeSvgBlobForUpload(blob, svgDimensions = null) {
        if (_clipboardGetMediaKind({ blob, filename: blob?.name }) !== "image") return blob;
        if (_clipboardNormalizeMimeType(blob?.type) !== "image/svg+xml" && _clipboardGetFileExtension(blob) !== "svg") {
          return blob;
        }
        const svgText = await _clipboardReadBlobText(blob);
        const svgElement = _clipboardGetSvgElementFromText(svgText);
        if (!svgElement) return blob;
        const resolvedDimensions = svgDimensions || _clipboardGetSvgIntrinsicDimensionsFromText(svgText);
        if (!resolvedDimensions) return blob;
        const hasExplicitWidth = _clipboardParseSvgLength(svgElement.getAttribute("width"));
        const hasExplicitHeight = _clipboardParseSvgLength(svgElement.getAttribute("height"));
        if (hasExplicitWidth && hasExplicitHeight) return blob;
        svgElement.setAttribute("width", String(resolvedDimensions.width));
        svgElement.setAttribute("height", String(resolvedDimensions.height));
        _clipboardLog("debug", "Normalized uploaded SVG with explicit width and height", {
          width: resolvedDimensions.width,
          height: resolvedDimensions.height,
          fileName: blob?.name || null,
          mimeType: _clipboardNormalizeMimeType(blob?.type) || null
        });
        return new File(
          [new XMLSerializer().serializeToString(svgElement)],
          blob?.name || `pasted_image.${_clipboardGetFileExtension(blob) || "svg"}`,
          { type: _clipboardNormalizeMimeType(blob?.type) || "image/svg+xml" }
        );
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
        _clipboardParseSvgLength,
        _clipboardGetSvgViewBoxDimensions,
        _clipboardGetSvgElementFromText,
        _clipboardReadBlobText,
        _clipboardGetSvgIntrinsicDimensionsFromText,
        _clipboardGetPreferredMediaDimensions,
        _clipboardNormalizeSvgBlobForUpload,
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
        _clipboardGetFileExtension,
        _clipboardNormalizeSvgBlobForUpload
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
        const target = Object.hasOwn(overrides, "target") ? overrides.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER : _clipboardGetTargetFolder();
        const bucket = resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? Object.hasOwn(overrides, "bucket") ? overrides.bucket?.trim() || "" : _clipboardGetStoredBucket() : "";
        return {
          storedSource,
          source: resolvedSource,
          target,
          bucket,
          endpoint: resolvedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? _clipboardGetConfiguredS3Endpoint() : ""
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
          destination: _clipboardDescribeDestinationForLog(destination)
        });
        if (destination.source === CLIPBOARD_IMAGE_SOURCE_S3) {
          _clipboardLog("debug", "Skipping directory creation for S3-compatible destination", {
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
      function _clipboardCreateVersionedFilename(filename, version = Date.now()) {
        const normalizedFilename = String(filename || "").trim() || "pasted_image";
        const extensionMatch = normalizedFilename.match(/\.([^./]+)$/);
        const extension = extensionMatch?.[1] || "";
        const baseName = extension ? normalizedFilename.slice(0, -(extension.length + 1)) : normalizedFilename;
        const suffix = encodeURIComponent(String(version));
        return extension ? `${baseName}-${suffix}.${extension}` : `${baseName}-${suffix}`;
      }
      function _clipboardCreateUploadFile(blob, version = Date.now()) {
        const sourceName = blob instanceof File && blob.name ? blob.name : `pasted_image.${_clipboardGetFileExtension(blob)}`;
        const filename = _clipboardCreateVersionedFilename(
          _clipboardEnsureFilenameExtension(sourceName, blob),
          version
        );
        return new File([blob], filename, { type: blob.type });
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
        _clipboardResolveImageInputBlob
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
        _clipboardGetConfiguredS3Endpoint,
        _clipboardGetUploadDestination,
        _clipboardDescribeDestination,
        _clipboardGetSourceChoices
      } = require_storage();
      var FoundryPasteEaterDestinationConfig = class extends CLIPBOARD_IMAGE_FORM_APPLICATION {
        static get defaultOptions() {
          return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-paste-eater-destination-config",
            title: "Foundry Paste Eater: Upload Destination",
            template: "modules/foundry-paste-eater/templates/upload-destination.hbs",
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
            s3Endpoint: _clipboardGetConfiguredS3Endpoint(),
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
          const endpointField = form.querySelector('[data-role="s3-endpoint"]');
          const bucketGroup = this.element.find(".foundry-paste-eater-s3-bucket");
          const endpointGroup = this.element.find(".foundry-paste-eater-s3-endpoint");
          if (summaryField) summaryField.value = _clipboardDescribeDestination(destination);
          if (endpointField) endpointField.value = destination.endpoint || "";
          bucketGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
          endpointGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
        }
        _applyPickerSelection(path, picker, previousStoredSource) {
          const form = this.form;
          if (!form) return;
          const selectedSource = picker.activeSource || _clipboardResolveSource(previousStoredSource);
          if (!_clipboardCanSelectSource(selectedSource)) {
            ui.notifications.warn("Foundry Paste Eater: The selected file source does not support pasted uploads.");
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
        FoundryPasteEaterDestinationConfig
      };
    }
  });

  // src/settings.js
  var require_settings = __commonJS({
    "src/settings.js"(exports, module) {
      var {
        CLIPBOARD_IMAGE_MODULE_ID,
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
        CLIPBOARD_IMAGE_DEFAULT_FOLDER,
        CLIPBOARD_IMAGE_SOURCE_AUTO,
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
        CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
        CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
        CLIPBOARD_IMAGE_ROLE_PLAYER,
        CLIPBOARD_IMAGE_ROLE_TRUSTED,
        CLIPBOARD_IMAGE_ROLE_ASSISTANT,
        CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER
      } = require_constants();
      var { _clipboardLog } = require_diagnostics();
      var { FoundryPasteEaterDestinationConfig } = require_config_app();
      var CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS = [
        "image-location",
        "image-location-source",
        "image-location-bucket",
        CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
        CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
        CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
        CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
        CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
        CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
        CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING
      ];
      function _clipboardGetRoleChoices() {
        return {
          [CLIPBOARD_IMAGE_ROLE_PLAYER]: "Player",
          [CLIPBOARD_IMAGE_ROLE_TRUSTED]: "Trusted Player",
          [CLIPBOARD_IMAGE_ROLE_ASSISTANT]: "Assistant GM",
          [CLIPBOARD_IMAGE_ROLE_GAMEMASTER]: "Gamemaster"
        };
      }
      function _clipboardGetRoleValue(roleKey) {
        return CONST?.USER_ROLES?.[roleKey] ?? CONST?.USER_ROLES?.PLAYER ?? 1;
      }
      function _clipboardGetCurrentUserRole() {
        if (typeof game?.user?.role === "number") return game.user.role;
        if (game?.user?.isGM) return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_GAMEMASTER);
        return _clipboardGetRoleValue(CLIPBOARD_IMAGE_ROLE_PLAYER);
      }
      function _clipboardGetRegisteredSettingConfig(moduleId, key) {
        return game?.settings?.settings?.get?.(`${moduleId}.${key}`) || null;
      }
      function _clipboardGetSettingScope(key) {
        return _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.scope || _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key)?.scope || "world";
      }
      function _clipboardGetSettingsStorage(scope) {
        return game?.settings?.storage?.get?.(scope) || null;
      }
      function _clipboardGetStoredSettingDocument(moduleId, key) {
        const scope = _clipboardGetSettingScope(key);
        return _clipboardGetSettingsStorage(scope)?.get?.(`${moduleId}.${key}`) || null;
      }
      function _clipboardHasStoredSetting(moduleId, key) {
        return Boolean(_clipboardGetStoredSettingDocument(moduleId, key));
      }
      function _clipboardGetStoredSettingValue(moduleId, key) {
        const document2 = _clipboardGetStoredSettingDocument(moduleId, key);
        if (!document2 || !Object.hasOwn(document2, "value")) return void 0;
        return document2.value;
      }
      function _clipboardGetSetting(key) {
        const hasCurrentValue = _clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key);
        const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
        if (!hasCurrentValue && legacyValue !== void 0) return legacyValue;
        return game.settings.get(CLIPBOARD_IMAGE_MODULE_ID, key);
      }
      function _clipboardSettingEnabled(key) {
        return Boolean(_clipboardGetSetting(key));
      }
      function _clipboardGetConfiguredMinimumRole(settingKey) {
        const configuredRole = _clipboardGetSetting(settingKey);
        if (typeof configuredRole === "string" && configuredRole.trim()) return configuredRole;
        return CLIPBOARD_IMAGE_ROLE_PLAYER;
      }
      function _clipboardUserMeetsMinimumRole(settingKey) {
        return _clipboardGetCurrentUserRole() >= _clipboardGetRoleValue(_clipboardGetConfiguredMinimumRole(settingKey));
      }
      function _clipboardCanUseCanvasMedia() {
        return _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING);
      }
      function _clipboardCanUseCanvasText() {
        return _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING) && _clipboardGetCanvasTextPasteMode() !== CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED;
      }
      function _clipboardCanUseChatMedia() {
        return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING) && _clipboardUserMeetsMinimumRole(CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING);
      }
      function _clipboardCanUseChatUploadButton() {
        return _clipboardCanUseChatMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING);
      }
      function _clipboardCanUseSceneControls() {
        if (game.user?.isGM) return true;
        return _clipboardSettingEnabled(CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING) && _clipboardCanUseCanvasMedia();
      }
      function _clipboardCanUseScenePasteTool() {
        return _clipboardCanUseSceneControls() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING);
      }
      function _clipboardCanUseSceneUploadTool() {
        return _clipboardCanUseSceneControls() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING);
      }
      function _clipboardGetDefaultEmptyCanvasTarget() {
        const configuredTarget = _clipboardGetSetting(CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING);
        if (configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE || configuredTarget === CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN) {
          return configuredTarget;
        }
        return CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER;
      }
      function _clipboardShouldCreateBackingActors() {
        return _clipboardSettingEnabled(CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING);
      }
      function _clipboardGetChatMediaDisplayMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW || configuredMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL;
      }
      function _clipboardGetCanvasTextPasteMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES;
      }
      function _clipboardGetScenePastePromptMode() {
        const configuredMode = _clipboardGetSetting(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING);
        if (configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS || configuredMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
          return configuredMode;
        }
        return CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO;
      }
      function _clipboardCanCreateTokens() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING);
      }
      function _clipboardCanCreateTiles() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING);
      }
      function _clipboardCanReplaceTokens() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING);
      }
      function _clipboardCanReplaceTiles() {
        return _clipboardCanUseCanvasMedia() && _clipboardSettingEnabled(CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING);
      }
      async function _clipboardMigrateLegacySettings() {
        if (CLIPBOARD_IMAGE_MODULE_ID === CLIPBOARD_IMAGE_LEGACY_MODULE_ID) return [];
        const migrated = [];
        for (const key of CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS) {
          const scope = _clipboardGetSettingScope(key);
          if (scope === "world" && !game?.user?.isGM) continue;
          if (_clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key)) continue;
          const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
          if (legacyValue === void 0) continue;
          await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, key, legacyValue);
          migrated.push(key);
        }
        if (migrated.length) {
          _clipboardLog("info", "Migrated legacy module settings to the new namespace.", {
            legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
            moduleId: CLIPBOARD_IMAGE_MODULE_ID,
            settings: migrated
          });
        }
        return migrated;
      }
      function _clipboardRegisterSettings() {
        game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
          name: "Upload destination",
          label: "Configure",
          hint: "Choose the file store and folder used for pasted media. Supports User Data, The Forge, and Foundry-configured S3-compatible storage through Foundry's native file picker.",
          icon: "fa-solid fa-folder-tree",
          type: FoundryPasteEaterDestinationConfig,
          restricted: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
          name: "Pasted media location",
          hint: "Folder where pasted media is saved.",
          scope: "world",
          config: false,
          type: String,
          default: CLIPBOARD_IMAGE_DEFAULT_FOLDER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
          name: "Pasted media source",
          hint: "File source where pasted media is saved.",
          scope: "world",
          config: false,
          type: String,
          default: CLIPBOARD_IMAGE_SOURCE_AUTO
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
          name: "Pasted media bucket",
          hint: "Bucket used when pasted media is saved to an S3-compatible provider configured in Foundry.",
          scope: "world",
          config: false,
          type: String,
          default: ""
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_VERBOSE_LOGGING_SETTING, {
          name: "Verbose logging",
          hint: "Log detailed foundry-paste-eater diagnostics to the browser console for debugging.",
          scope: "client",
          config: true,
          type: Boolean,
          default: false
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING, {
          name: "Minimum role for canvas media paste",
          hint: "Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices(),
          default: CLIPBOARD_IMAGE_ROLE_PLAYER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING, {
          name: "Minimum role for canvas text paste",
          hint: "Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices(),
          default: CLIPBOARD_IMAGE_ROLE_PLAYER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING, {
          name: "Minimum role for chat media paste",
          hint: "Lowest Foundry role allowed to post pasted/uploaded media into chat.",
          scope: "world",
          config: true,
          type: String,
          choices: _clipboardGetRoleChoices(),
          default: CLIPBOARD_IMAGE_ROLE_PLAYER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING, {
          name: "Allow non-GMs to use scene controls",
          hint: "Show Foundry Paste Eater scene control buttons to non-GM users who meet the canvas media role requirement.",
          scope: "world",
          config: true,
          type: Boolean,
          default: false
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING, {
          name: "Enable chat media handling",
          hint: "Allow pasted, dropped, and uploaded media in chat.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING, {
          name: "Enable chat upload button",
          hint: "Show the Upload Chat Media button next to the chat input when chat media handling is enabled.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING, {
          name: "Allow token creation from pasted media",
          hint: "Create a new token when pasted media targets token creation.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING, {
          name: "Allow tile creation from pasted media",
          hint: "Create a new tile when pasted media targets tile creation.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING, {
          name: "Allow token art replacement",
          hint: "Allow pasted media to replace the selected tokens. Non-GMs are limited to tokens they can update.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING, {
          name: "Allow tile art replacement",
          hint: "Allow pasted media to replace the selected tiles.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING, {
          name: "Enable scene Paste Media tool",
          hint: "Show the Paste Media scene control button.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING, {
          name: "Enable scene Upload Media tool",
          hint: "Show the Upload Media scene control button.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING, {
          name: "Default empty-canvas paste target",
          hint: "Choose which placeable type should be created when pasted media is not replacing an existing tile or token.",
          scope: "world",
          config: true,
          type: String,
          choices: {
            [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER]: "Active layer",
            [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE]: "Tile",
            [CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN]: "Token"
          },
          default: CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING, {
          name: "Create backing Actors for pasted tokens",
          hint: "Generate an Actor for each newly pasted token so the token can be opened and edited normally.",
          scope: "world",
          config: true,
          type: Boolean,
          default: true
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING, {
          name: "Chat media display",
          hint: "Choose how pasted media is rendered in chat messages.",
          scope: "world",
          config: true,
          type: String,
          choices: {
            [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW]: "Full preview",
            [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL]: "Thumbnail",
            [CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY]: "Link only"
          },
          default: CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING, {
          name: "Canvas text paste mode",
          hint: "Choose how pasted plain text behaves on the canvas.",
          scope: "world",
          config: true,
          type: String,
          choices: {
            [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES]: "Scene notes",
            [CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED]: "Disabled"
          },
          default: CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES
        });
        game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING, {
          name: "Scene Paste Media prompt mode",
          hint: "Control whether the scene Paste Media tool uses direct clipboard reads, the manual paste prompt, or the current browser-dependent auto behavior.",
          scope: "world",
          config: true,
          type: String,
          choices: {
            [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO]: "Auto",
            [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS]: "Always show prompt",
            [CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER]: "Never show prompt"
          },
          default: CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO
        });
      }
      module.exports = {
        _clipboardGetRoleChoices,
        _clipboardGetRoleValue,
        _clipboardGetCurrentUserRole,
        _clipboardGetRegisteredSettingConfig,
        _clipboardGetSettingScope,
        _clipboardGetSettingsStorage,
        _clipboardGetStoredSettingDocument,
        _clipboardHasStoredSetting,
        _clipboardGetStoredSettingValue,
        _clipboardGetSetting,
        _clipboardSettingEnabled,
        _clipboardGetConfiguredMinimumRole,
        _clipboardUserMeetsMinimumRole,
        _clipboardCanUseCanvasMedia,
        _clipboardCanUseCanvasText,
        _clipboardCanUseChatMedia,
        _clipboardCanUseChatUploadButton,
        _clipboardCanUseSceneControls,
        _clipboardCanUseScenePasteTool,
        _clipboardCanUseSceneUploadTool,
        _clipboardGetDefaultEmptyCanvasTarget,
        _clipboardShouldCreateBackingActors,
        _clipboardGetChatMediaDisplayMode,
        _clipboardGetCanvasTextPasteMode,
        _clipboardGetScenePastePromptMode,
        _clipboardCanCreateTokens,
        _clipboardCanCreateTiles,
        _clipboardCanReplaceTokens,
        _clipboardCanReplaceTiles,
        _clipboardMigrateLegacySettings,
        _clipboardRegisterSettings
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
      var {
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
        CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN
      } = require_constants();
      var {
        _clipboardCanCreateTokens,
        _clipboardCanCreateTiles,
        _clipboardCanReplaceTokens,
        _clipboardCanReplaceTiles,
        _clipboardGetDefaultEmptyCanvasTarget,
        _clipboardShouldCreateBackingActors
      } = require_settings();
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
      function _clipboardCanUserModifyDocument(document2, action = "update") {
        if (!document2) return false;
        if (game.user?.isGM) return true;
        if (typeof document2.canUserModify === "function") {
          return Boolean(document2.canUserModify(game.user, action));
        }
        if (typeof document2.testUserPermission === "function") {
          return Boolean(document2.testUserPermission(game.user, "OWNER"));
        }
        if (typeof document2.isOwner === "boolean") {
          return document2.isOwner;
        }
        return false;
      }
      function _clipboardCanReplaceDocument(documentName, document2) {
        if (documentName === "Token") {
          if (!_clipboardCanReplaceTokens()) return false;
          if (game.user?.isGM) return true;
          return _clipboardCanUserModifyDocument(document2, "update") || _clipboardCanUserModifyDocument(document2?.actor, "update");
        }
        if (documentName === "Tile") {
          return _clipboardCanReplaceTiles() && _clipboardCanUserModifyDocument(document2, "update");
        }
        return false;
      }
      function _clipboardCanCreateDocument(documentName) {
        if (documentName === "Token") return _clipboardCanCreateTokens();
        return _clipboardCanCreateTiles();
      }
      function _clipboardGetPastedDocumentName(path) {
        const rawName = String(path || "").split("/").pop() || "";
        let decodedName = rawName;
        try {
          decodedName = decodeURIComponent(rawName);
        } catch (error) {
          decodedName = rawName;
        }
        const withoutQuery = decodedName.split(/[?#]/, 1)[0] || decodedName;
        const trimmedName = withoutQuery.replace(/\.[^.]+$/, "").trim();
        const normalizedName = trimmedName.replace(/-\d{10,}$/, "").trim();
        return normalizedName || trimmedName || "Pasted Media";
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
      function _clipboardGetPastedTokenActorImage(path, mediaKind) {
        if (mediaKind !== "video") return path;
        return _clipboardGetActorDocumentClass()?.DEFAULT_ICON || CONST?.DEFAULT_TOKEN || "icons/svg/mystery-man.svg";
      }
      async function _clipboardCreatePastedTokenActor({ path, mediaKind, width, height }) {
        const ActorDocument = _clipboardGetActorDocumentClass();
        if (!ActorDocument?.create) {
          throw new Error("Actor creation is unavailable for pasted tokens.");
        }
        const name = _clipboardGetPastedDocumentName(path);
        const actorType = _clipboardGetDefaultActorType();
        const actorImage = _clipboardGetPastedTokenActorImage(path, mediaKind);
        const actorData = {
          name,
          img: actorImage,
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
          actorImage,
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
          actorImage,
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
            const createBackingActors = _clipboardShouldCreateBackingActors();
            let actor = null;
            if (createBackingActors) {
              actor = await _clipboardCreatePastedTokenActor({
                path,
                mediaKind,
                width: dimensions.width,
                height: dimensions.height
              });
            }
            const tokenData = {
              name: actor?.name || _clipboardGetPastedDocumentName(path),
              texture: {
                src: path
              },
              width: dimensions.width,
              height: dimensions.height,
              x: snappedPosition.x,
              y: snappedPosition.y,
              hidden: _clipboardGetHiddenMode(),
              locked: false
            };
            if (actor?.id) {
              tokenData.actorId = actor.id;
              tokenData.actorLink = false;
            }
            return [tokenData];
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
      function _clipboardGetCreateDocumentName(activeDocumentName = _clipboardGetActiveDocumentName()) {
        switch (_clipboardGetDefaultEmptyCanvasTarget()) {
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN:
            return "Token";
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE:
            return "Tile";
          case CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER:
          default:
            return activeDocumentName;
        }
      }
      function _clipboardGetPlaceableStrategy(documentName = _clipboardGetCreateDocumentName()) {
        return CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES[documentName] || CLIPBOARD_IMAGE_PLACEABLE_STRATEGIES.Tile;
      }
      function _clipboardGetReplacementTarget(activeDocumentName = _clipboardGetActiveDocumentName()) {
        for (const documentName of CLIPBOARD_IMAGE_REPLACEMENT_ORDER[activeDocumentName]) {
          const strategy = _clipboardGetPlaceableStrategy(documentName);
          const documents = strategy.getControlledDocuments();
          if (!documents.length) continue;
          const eligibleDocuments = documents.filter((document2) => _clipboardCanReplaceDocument(strategy.documentName, document2));
          return {
            documentName: strategy.documentName,
            documents: eligibleDocuments,
            requestedCount: documents.length,
            blocked: eligibleDocuments.length < 1
          };
        }
        return null;
      }
      function _clipboardResolvePasteContext({ fallbackToCenter = false, requireCanvasFocus = true } = {}) {
        const activeDocumentName = _clipboardGetActiveDocumentName();
        const createDocumentName = _clipboardGetCreateDocumentName(activeDocumentName);
        const mousePos = _clipboardGetMousePosition() || (fallbackToCenter ? _clipboardGetCanvasCenter() : null);
        return {
          mousePos,
          activeDocumentName,
          createDocumentName,
          createStrategy: _clipboardCanCreateDocument(createDocumentName) ? _clipboardGetPlaceableStrategy(createDocumentName) : null,
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
        if (context.replacementTarget?.documents?.length) return true;
        if (context.replacementTarget?.blocked) return false;
        if (Object.hasOwn(context, "createStrategy") && !context.createStrategy) return false;
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
        _clipboardCanUserModifyDocument,
        _clipboardCanReplaceDocument,
        _clipboardCanCreateDocument,
        _clipboardGetPastedDocumentName,
        _clipboardGetAvailableActorTypes,
        _clipboardGetActorDocumentClass,
        _clipboardGetDefaultActorType,
        _clipboardGetPastedTokenActorImage,
        _clipboardCreatePastedTokenActor,
        _clipboardGetActiveDocumentName,
        _clipboardGetCreateDocumentName,
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
      var CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT = 100;
      var CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE = "clipboard-error-report";
      var CLIPBOARD_IMAGE_LOG_HISTORY = [];
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
          bucket: destination.bucket || null,
          endpoint: destination.endpoint || null
        };
      }
      function _clipboardDescribeReplacementTarget(replacementTarget) {
        if (!replacementTarget) return null;
        return {
          documentName: replacementTarget.documentName,
          ids: replacementTarget.documents.map((document2) => document2.id),
          requestedCount: replacementTarget.requestedCount ?? replacementTarget.documents.length,
          blocked: Boolean(replacementTarget.blocked)
        };
      }
      function _clipboardDescribePasteContext(context) {
        if (!context) return null;
        const { _clipboardHasCanvasFocus } = require_context();
        return {
          mousePos: context.mousePos,
          createDocumentName: context.createStrategy?.documentName || context.createDocumentName || null,
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
      function _clipboardEscapeHtml(value) {
        return foundry?.utils?.escapeHTML?.(String(value ?? "")) ?? String(value ?? "");
      }
      function _clipboardSanitizeForReport(value, depth = 3, seen = /* @__PURE__ */ new WeakSet()) {
        if (value === null || value === void 0) return value;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
        if (typeof value === "bigint") return value.toString();
        if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
        if (value instanceof Error) return _clipboardSerializeError(value);
        if (typeof File !== "undefined" && value instanceof File) return _clipboardDescribeFile(value);
        if (typeof Blob !== "undefined" && value instanceof Blob) return {
          type: value.type || null,
          size: value.size ?? null
        };
        if (value instanceof URL) return value.toString();
        if (depth <= 0) return "[MaxDepth]";
        if (Array.isArray(value)) return value.map((entry) => _clipboardSanitizeForReport(entry, depth - 1, seen));
        if (typeof value !== "object") return String(value);
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
        const output = {};
        for (const [key, entry] of Object.entries(value)) {
          output[key] = _clipboardSanitizeForReport(entry, depth - 1, seen);
        }
        seen.delete(value);
        return output;
      }
      function _clipboardRememberLogEntry(level, message, details) {
        const entry = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message
        };
        if (details !== void 0) entry.details = _clipboardSanitizeForReport(details);
        CLIPBOARD_IMAGE_LOG_HISTORY.push(entry);
        if (CLIPBOARD_IMAGE_LOG_HISTORY.length > CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT) {
          CLIPBOARD_IMAGE_LOG_HISTORY.splice(0, CLIPBOARD_IMAGE_LOG_HISTORY.length - CLIPBOARD_IMAGE_LOG_HISTORY_LIMIT);
        }
        return entry;
      }
      function _clipboardGetLogHistory() {
        return CLIPBOARD_IMAGE_LOG_HISTORY.slice();
      }
      function _clipboardLog(level, message, details) {
        _clipboardRememberLogEntry(level, message, details);
        if ((level === "debug" || level === "info") && !_clipboardVerboseLoggingEnabled()) return;
        const logger = console[level] || console.log;
        const prefix = `Foundry Paste Eater [${level.toUpperCase()}]: ${message}`;
        if (details === void 0) {
          logger(prefix);
          return;
        }
        logger(prefix, details);
      }
      function _clipboardGetSocketChannel() {
        return `module.${CLIPBOARD_IMAGE_MODULE_ID}`;
      }
      function _clipboardCreateReportId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return uuid;
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      function _clipboardDescribeCurrentUser() {
        return {
          id: game?.user?.id || null,
          name: game?.user?.name || game?.user?.character?.name || "Unknown User",
          role: game?.user?.role ?? null,
          isGM: Boolean(game?.user?.isGM)
        };
      }
      function _clipboardBuildErrorReport(error, options = {}) {
        const serializedError = _clipboardSerializeError(error);
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const shortMessage = error instanceof Error && error.message ? error.message : "Failed to handle media input. Check the console.";
        const playerMessage = options.playerMessage || `Foundry Paste Eater: ${shortMessage}`;
        const gmMessage = options.gmMessage || "Foundry Paste Eater encountered an error. Review the attached logfile for full details.";
        return {
          id: _clipboardCreateReportId(),
          timestamp,
          title: options.title || "Foundry Paste Eater Error",
          operation: options.operation || null,
          playerMessage,
          gmMessage,
          summary: shortMessage,
          user: _clipboardDescribeCurrentUser(),
          world: {
            id: game?.world?.id || null,
            title: game?.world?.title || null
          },
          browser: {
            href: globalThis.location?.href || null,
            userAgent: globalThis.navigator?.userAgent || null
          },
          details: _clipboardSanitizeForReport(options.details || null),
          error: serializedError,
          logs: _clipboardGetLogHistory()
        };
      }
      function _clipboardFormatErrorReport(report) {
        const parts = [
          "Foundry Paste Eater Error Report",
          `Report ID: ${report.id}`,
          `Timestamp: ${report.timestamp}`,
          `Title: ${report.title}`,
          `Summary: ${report.summary}`,
          `Player Message: ${report.playerMessage}`,
          `GM Message: ${report.gmMessage}`,
          "",
          "User",
          JSON.stringify(report.user, null, 2),
          "",
          "World",
          JSON.stringify(report.world, null, 2),
          "",
          "Browser",
          JSON.stringify(report.browser, null, 2),
          "",
          "Context",
          JSON.stringify({
            operation: report.operation,
            details: report.details
          }, null, 2),
          "",
          "Error",
          JSON.stringify(report.error, null, 2),
          "",
          "Recent Log History",
          JSON.stringify(report.logs, null, 2)
        ];
        return parts.join("\n");
      }
      function _clipboardCreateReportFile(report) {
        const safeTimestamp = report.timestamp.replaceAll(":", "-");
        const filename = `foundry-paste-eater-error-${safeTimestamp}.log`;
        const content = _clipboardFormatErrorReport(report);
        const url = globalThis.URL?.createObjectURL?.(new Blob([content], { type: "text/plain" })) || "";
        return { filename, content, url };
      }
      function _clipboardDownloadReportFile(report) {
        const file = _clipboardCreateReportFile(report);
        if (!file.content) return file;
        if (typeof globalThis.saveDataToFile === "function") {
          globalThis.saveDataToFile(file.content, "text/plain", file.filename);
          return file;
        }
        if (file.url && globalThis.document?.body) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          link.rel = "noopener";
          document.body.append(link);
          link.click();
          link.remove();
        }
        return file;
      }
      function _clipboardOpenGmErrorDialog(report, options = {}) {
        const file = _clipboardCreateReportFile(report);
        const userName = _clipboardEscapeHtml(report.user?.name || "Unknown User");
        const summary = _clipboardEscapeHtml(report.summary || "Unknown error");
        const playerMessage = _clipboardEscapeHtml(report.playerMessage || "Foundry Paste Eater encountered an error.");
        const linkMarkup = file.url ? `<p><a href="${_clipboardEscapeHtml(file.url)}" download="${_clipboardEscapeHtml(file.filename)}" target="_blank" rel="noopener">Download module logfile</a></p>` : "";
        const origin = options.receivedFromSocket ? "Another user encountered a Foundry Paste Eater error." : "This client encountered a Foundry Paste Eater error.";
        const content = `
    <div class="foundry-paste-eater-error-dialog">
      <p>${_clipboardEscapeHtml(origin)}</p>
      <p><strong>User:</strong> ${userName}</p>
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Player-facing message:</strong> ${playerMessage}</p>
      ${linkMarkup}
    </div>
  `;
        if (typeof globalThis.Dialog === "function") {
          new globalThis.Dialog({
            title: report.title || "Foundry Paste Eater Error",
            content,
            buttons: {
              close: {
                label: "Close"
              }
            },
            default: "close"
          }).render(true);
        }
        return file;
      }
      function _clipboardEmitErrorReport(report) {
        if (game?.user?.isGM) return false;
        if (typeof game?.socket?.emit !== "function") return false;
        game.socket.emit(_clipboardGetSocketChannel(), {
          type: CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE,
          report
        });
        return true;
      }
      function _clipboardHandleSocketReport(payload) {
        if (!payload || payload.type !== CLIPBOARD_IMAGE_ERROR_SOCKET_TYPE) return false;
        if (!game?.user?.isGM) return false;
        if (!payload.report) return false;
        ui.notifications.error(`Foundry Paste Eater: ${payload.report.summary}`);
        _clipboardOpenGmErrorDialog(payload.report, { receivedFromSocket: true });
        return true;
      }
      function _clipboardRegisterErrorReporting() {
        if (typeof game?.socket?.on !== "function") return;
        game.socket.on(_clipboardGetSocketChannel(), _clipboardHandleSocketReport);
      }
      function _clipboardReportError(error, options = {}) {
        _clipboardLog("error", options.logMessage || "Failed to handle media input", {
          operation: options.operation || null,
          details: options.details || null,
          error: _clipboardSerializeError(error)
        });
        const report = _clipboardBuildErrorReport(error, options);
        if (options.notifyLocal !== false) {
          ui.notifications.error(report.playerMessage);
        }
        if (game?.user?.isGM) {
          if (options.notifyLocal !== false) _clipboardOpenGmErrorDialog(report);
        } else {
          _clipboardEmitErrorReport(report);
        }
        if (options.autoDownload !== false && _clipboardVerboseLoggingEnabled()) {
          _clipboardDownloadReportFile(report);
        }
        return report;
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
        _clipboardGetLogHistory,
        _clipboardBuildErrorReport,
        _clipboardFormatErrorReport,
        _clipboardCreateReportFile,
        _clipboardDownloadReportFile,
        _clipboardHandleSocketReport,
        _clipboardRegisterErrorReporting,
        _clipboardReportError,
        _clipboardLog
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
        CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
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
        const currentValue = document2?.getFlag?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG) || null;
        if (currentValue) return currentValue;
        return document2?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] || document2?._source?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] || null;
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
        const legacyModule = game?.modules?.get?.(CLIPBOARD_IMAGE_LEGACY_MODULE_ID);
        if (typeof document2?.unsetFlag === "function" && legacyModule?.active) {
          try {
            await document2.unsetFlag(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG);
          } catch (error) {
            _clipboardLog("debug", "Unable to clear the legacy note flag scope after migration.", {
              documentName: document2.documentName,
              documentId: document2.id,
              legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
              error: error instanceof Error ? error.message : `${error}`
            });
          }
        }
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
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
        CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY
      } = require_constants();
      var { _clipboardGetChatMediaDisplayMode } = require_settings();
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardUploadBlob,
        _clipboardCreateFreshMediaPath
      } = require_storage();
      function _clipboardCreateChatMediaContent(path) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        const displayMode = _clipboardGetChatMediaDisplayMode();
        const figure = document.createElement("figure");
        figure.className = "foundry-paste-eater-chat-message";
        const previewClassName = displayMode === CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW ? "foundry-paste-eater-chat-full-preview" : "foundry-paste-eater-chat-thumbnail";
        if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY && mediaKind === "video") {
          const video = document.createElement("video");
          video.className = previewClassName;
          video.src = path;
          video.controls = true;
          video.loop = true;
          video.preload = "metadata";
          video.playsInline = true;
          figure.append(video);
        } else if (displayMode !== CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY) {
          const previewLink = document.createElement("a");
          previewLink.className = "foundry-paste-eater-chat-link";
          previewLink.href = path;
          previewLink.target = "_blank";
          previewLink.rel = "noopener noreferrer";
          const image = document.createElement("img");
          image.className = previewClassName;
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
        if (!path) {
          throw new Error("Cannot create a chat media message without a usable media path");
        }
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
        const path = _clipboardCreateFreshMediaPath(await _clipboardUploadBlob(blob, destination));
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
        _clipboardReportError,
        _clipboardSerializeError,
        _clipboardDescribeFile
      } = require_diagnostics();
      var {
        _clipboardGetMediaKind,
        _clipboardNormalizePastedText,
        _clipboardLoadMediaDimensions,
        _clipboardGetPreferredMediaDimensions
      } = {
        ...require_media(),
        ...require_text()
      };
      var {
        _clipboardGetUploadDestination,
        _clipboardCreateFolderIfMissing,
        _clipboardResolveImageInputBlob,
        _clipboardUploadBlob,
        _clipboardCreateFreshMediaPath
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
        _clipboardCanUseCanvasMedia,
        _clipboardCanUseCanvasText,
        _clipboardCanUseChatMedia,
        _clipboardCanUseScenePasteTool,
        _clipboardCanUseSceneUploadTool
      } = require_settings();
      var {
        _clipboardEnsurePlaceableTextNote,
        _clipboardCreateStandaloneTextNote
      } = require_notes();
      var {
        _clipboardPostChatImage
      } = require_chat();
      var { _clipboardGetLocked, _clipboardSetLocked } = require_state();
      async function _clipboardApplyPasteResult(path, context, preferredDimensions = null) {
        const mediaKind = _clipboardGetMediaKind({ src: path }) || "image";
        if (await _clipboardReplaceControlledMedia(path, context.replacementTarget, mediaKind)) {
          _clipboardLog("info", "Applied pasted media by replacing controlled documents", {
            path,
            mediaKind,
            replacementTarget: _clipboardDescribeReplacementTarget(context.replacementTarget)
          });
          return true;
        }
        const { width: imgWidth, height: imgHeight } = preferredDimensions || await _clipboardLoadMediaDimensions(path);
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
        if (!_clipboardCanUseCanvasMedia()) return false;
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
        const preferredDimensions = await _clipboardGetPreferredMediaDimensions(blob);
        const uploadPath = await _clipboardUploadBlob(blob, targetFolder);
        return _clipboardApplyPasteResult(_clipboardCreateFreshMediaPath(uploadPath), context, preferredDimensions);
      }
      async function _clipboardPasteMediaPath(path, contextOptions = {}) {
        if (!canvas?.ready || !canvas.scene) return false;
        if (!_clipboardCanUseCanvasMedia()) return false;
        const context = _clipboardResolvePasteContext(contextOptions);
        _clipboardLog("debug", "Resolved direct media URL paste context", {
          context: _clipboardDescribePasteContext(context),
          path,
          mediaKind: _clipboardGetMediaKind({ src: path }) || null
        });
        if (!_clipboardCanPasteToContext(context)) {
          _clipboardLog("info", "Skipping direct media URL paste because the current context is not eligible", {
            context: _clipboardDescribePasteContext(context),
            path
          });
          return false;
        }
        _clipboardPrepareCreateLayer(context);
        return _clipboardApplyPasteResult(path, context);
      }
      function _clipboardIsBlockedDirectMediaUrlDownload(imageInput, error) {
        return Boolean(
          error?.clipboardBlockedDirectMediaUrl || imageInput?.url && _clipboardGetMediaKind({ src: imageInput.url }) && error instanceof Error && error.message.startsWith("Failed to download pasted media URL from ")
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
          _clipboardReportError(error, {
            operation: "execute-paste-workflow",
            details: { options },
            notifyLocal: notifyError,
            logMessage: "Failed to handle media input"
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
        let blob;
        try {
          blob = await _clipboardResolveImageInputBlob(imageInput);
        } catch (error) {
          const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
          if (directMediaUrlFailure) {
            _clipboardLog("warn", "Direct media URL cannot be used on the canvas after download failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            throw directMediaUrlFailure;
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
            error: _clipboardSerializeError(error)
          });
          return _clipboardHandleTextInput({ text: fallbackText }, options);
        }
      }
      async function _clipboardHandleChatImageBlob(blob) {
        if (!blob) return false;
        if (!_clipboardCanUseChatMedia()) return false;
        return _clipboardPostChatImage(blob);
      }
      async function _clipboardHandleChatImageInput(imageInput) {
        let blob;
        try {
          blob = await _clipboardResolveImageInputBlob(imageInput);
        } catch (error) {
          const directMediaUrlFailure = _clipboardGetBlockedDirectMediaUrlError(imageInput, error);
          if (directMediaUrlFailure) {
            _clipboardLog("warn", "Direct media URL cannot be posted as chat media after download failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            throw directMediaUrlFailure;
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
        if (!_clipboardCanUseScenePasteTool()) return false;
        if (!navigator.clipboard?.read) {
          ui.notifications.warn("Foundry Paste Eater: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead.");
          return false;
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
        return true;
      }
      function _clipboardHandleSceneUploadAction() {
        if (!_clipboardCanUseSceneUploadTool()) return false;
        _clipboardLog("info", "Invoked scene Upload Media action.", {
          activeLayer: canvas?.activeLayer?.options?.name || null
        });
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenUploadPicker(), {
          respectCopiedObjects: false
        });
        return true;
      }
      function _clipboardHandleChatUploadAction() {
        if (!_clipboardCanUseChatMedia()) return false;
        _clipboardLog("info", "Invoked chat Upload Media action.");
        void _clipboardExecutePasteWorkflow(() => _clipboardOpenChatUploadPicker(), {
          respectCopiedObjects: false
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
        CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION,
        CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
      } = require_constants();
      var { CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS, _clipboardSetHiddenMode } = require_state();
      var {
        _clipboardDescribeDataTransfer,
        _clipboardDescribeImageInput,
        _clipboardDescribePasteContext,
        _clipboardLog,
        _clipboardSerializeError
      } = require_diagnostics();
      var {
        _clipboardExtractImageBlobFromDataTransfer,
        _clipboardExtractImageInput,
        _clipboardExtractImageInputFromDataTransfer,
        _clipboardExtractTextInputFromDataTransfer,
        _clipboardGetChatRootFromTarget,
        _clipboardIsEditableTarget,
        _clipboardInsertTextAtTarget,
        _clipboardReadClipboardItems
      } = require_clipboard();
      var {
        _clipboardResolvePasteContext,
        _clipboardCanPasteToContext
      } = require_context();
      var {
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
        CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER
      } = require_constants();
      var {
        _clipboardCanUseChatMedia,
        _clipboardCanUseChatUploadButton,
        _clipboardCanUseScenePasteTool,
        _clipboardCanUseSceneUploadTool,
        _clipboardGetScenePastePromptMode
      } = require_settings();
      var {
        _clipboardExecutePasteWorkflow,
        _clipboardHandleImageInput,
        _clipboardHandleChatImageInput,
        _clipboardHandleImageInputWithTextFallback,
        _clipboardHandleTextInput,
        _clipboardHasPasteConflict,
        _clipboardHandleScenePasteAction,
        _clipboardHandleSceneUploadAction,
        _clipboardHandleChatUploadAction
      } = require_workflows();
      var CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID = "foundry-paste-eater-scene-paste-prompt";
      var CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID = "foundry-paste-eater-scene-paste-target";
      function _clipboardUpsertSceneControlTool(control, toolName, toolData) {
        if (Array.isArray(control?.tools)) {
          const existingIndex = control.tools.findIndex((entry) => entry?.name === toolName);
          if (existingIndex >= 0) {
            control.tools[existingIndex] = {
              ...control.tools[existingIndex],
              ...toolData
            };
            return;
          }
          control.tools.push(toolData);
          return;
        }
        if (control?.tools) {
          control.tools[toolName] = toolData;
        }
      }
      function _clipboardAddSceneControlButtons(controls) {
        for (const controlName of CLIPBOARD_IMAGE_SCENE_CONTROLS) {
          const control = controls[controlName];
          if (!control?.tools) continue;
          const order = Array.isArray(control.tools) ? control.tools.length : Object.keys(control.tools).length;
          const onPasteClick = () => _clipboardHandleScenePasteToolClick();
          const onUploadClick = () => _clipboardHandleSceneUploadAction();
          _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_PASTE, {
            name: CLIPBOARD_IMAGE_TOOL_PASTE,
            title: "Paste Media",
            icon: "fa-solid fa-paste",
            order,
            button: true,
            visible: _clipboardCanUseScenePasteTool(),
            onClick: onPasteClick,
            onChange: onPasteClick
          });
          _clipboardUpsertSceneControlTool(control, CLIPBOARD_IMAGE_TOOL_UPLOAD, {
            name: CLIPBOARD_IMAGE_TOOL_UPLOAD,
            title: "Upload Media",
            icon: "fa-solid fa-file-image",
            order: order + 1,
            button: true,
            visible: _clipboardCanUseSceneUploadTool(),
            onClick: onUploadClick,
            onChange: onUploadClick
          });
        }
      }
      function _clipboardGetScenePastePrompt() {
        return document.getElementById(CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID);
      }
      function _clipboardScenePastePromptIsOpen(prompt = _clipboardGetScenePastePrompt()) {
        return Boolean(prompt?.isConnected);
      }
      function _clipboardSetScenePastePromptMessage(prompt, message) {
        const messageElement = prompt?.querySelector?.("[data-role='message']");
        if (messageElement) {
          messageElement.textContent = message;
        }
      }
      function _clipboardCloseScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
        prompt?.remove?.();
      }
      function _clipboardFocusScenePastePrompt(prompt = _clipboardGetScenePastePrompt()) {
        const target = prompt?.querySelector?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
        if (!target) return;
        target.focus({ preventScroll: true });
        target.select?.();
      }
      function _clipboardGetScenePastePromptFallbackMessage(clipItems) {
        if (clipItems?.length && clipItems.every((item) => !item?.types?.length)) {
          return "This clipboard content is not exposed to direct clipboard reads here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
        }
        return "Direct clipboard read did not return usable media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.";
      }
      async function _clipboardOnScenePastePromptPaste(event) {
        const prompt = event.currentTarget?.closest?.(`#${CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID}`);
        const imageInput = _clipboardExtractImageInputFromDataTransfer(event.clipboardData);
        if (!imageInput) {
          ui.notifications.warn("Foundry Paste Eater: No supported media was found in that paste.");
          _clipboardSetScenePastePromptMessage(prompt, "No supported media was found in that paste. Try again, or use Upload Media.");
          return;
        }
        _clipboardConsumePasteEvent(event);
        const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
        if (handled) {
          _clipboardCloseScenePastePrompt(prompt);
          return;
        }
        _clipboardSetScenePastePromptMessage(prompt, "Paste did not create media. Try again, or use Upload Media.");
        _clipboardFocusScenePastePrompt(prompt);
      }
      function _clipboardOpenScenePastePrompt() {
        const existingPrompt = _clipboardGetScenePastePrompt();
        if (existingPrompt) {
          _clipboardFocusScenePastePrompt(existingPrompt);
          return existingPrompt;
        }
        const prompt = document.createElement("div");
        prompt.id = CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_ID;
        prompt.className = "foundry-paste-eater-scene-paste-prompt";
        prompt.innerHTML = `
    <div class="foundry-paste-eater-scene-paste-panel" role="dialog" aria-modal="true" aria-labelledby="foundry-paste-eater-scene-paste-title">
      <h2 id="foundry-paste-eater-scene-paste-title">Paste Media</h2>
      <p data-role="message">Trying direct clipboard read. If nothing happens, press Cmd+V / Ctrl+V in the field below.</p>
      <textarea
        id="${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}"
        class="foundry-paste-eater-scene-paste-target"
        rows="4"
        placeholder="Press Cmd+V / Ctrl+V here if direct clipboard read does not complete."
      ></textarea>
      <div class="foundry-paste-eater-scene-paste-actions">
        ${_clipboardCanUseSceneUploadTool() ? '<button type="button" data-action="upload">Upload Media</button>' : ""}
        <button type="button" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;
        const target = prompt.querySelector(`#${CLIPBOARD_IMAGE_SCENE_PASTE_TARGET_ID}`);
        const uploadButton = prompt.querySelector('[data-action="upload"]');
        const cancelButton = prompt.querySelector('[data-action="cancel"]');
        target?.addEventListener("paste", _clipboardOnScenePastePromptPaste, { capture: true });
        uploadButton?.addEventListener("click", () => {
          _clipboardCloseScenePastePrompt(prompt);
          _clipboardHandleSceneUploadAction();
        });
        cancelButton?.addEventListener("click", () => _clipboardCloseScenePastePrompt(prompt));
        prompt.addEventListener("click", (event) => {
          if (event.target === prompt) _clipboardCloseScenePastePrompt(prompt);
        });
        document.body.append(prompt);
        _clipboardFocusScenePastePrompt(prompt);
        _clipboardLog("info", "Opened scene paste prompt fallback.");
        return prompt;
      }
      async function _clipboardTryScenePastePromptDirectRead(prompt) {
        if (!navigator.clipboard?.read) {
          _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard reads are unavailable here. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
          return false;
        }
        const clipItems = await _clipboardReadClipboardItems();
        if (!_clipboardScenePastePromptIsOpen(prompt)) return false;
        if (!clipItems?.length) {
          _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
          _clipboardFocusScenePastePrompt(prompt);
          return false;
        }
        const imageInput = await _clipboardExtractImageInput(clipItems);
        if (!_clipboardScenePastePromptIsOpen(prompt)) return false;
        if (!imageInput) {
          _clipboardSetScenePastePromptMessage(prompt, _clipboardGetScenePastePromptFallbackMessage(clipItems));
          _clipboardFocusScenePastePrompt(prompt);
          return false;
        }
        const handled = await _clipboardExecutePasteWorkflow(() => _clipboardHandleImageInput(imageInput, {
          contextOptions: CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
        }), {
          respectCopiedObjects: false
        });
        if (handled) {
          _clipboardCloseScenePastePrompt(prompt);
          return true;
        }
        if (_clipboardScenePastePromptIsOpen(prompt)) {
          _clipboardSetScenePastePromptMessage(prompt, "Direct clipboard read did not create media. Press Cmd+V / Ctrl+V in this prompt, or use Upload Media.");
          _clipboardFocusScenePastePrompt(prompt);
        }
        return false;
      }
      function _clipboardHandleScenePasteToolClick() {
        if (!_clipboardCanUseScenePasteTool()) return false;
        const promptMode = _clipboardGetScenePastePromptMode();
        if (promptMode === CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER) {
          return _clipboardHandleScenePasteAction();
        }
        const prompt = _clipboardOpenScenePastePrompt();
        if (promptMode !== CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS) {
          void _clipboardTryScenePastePromptDirectRead(prompt);
        }
        return true;
      }
      function _clipboardToggleChatDropTarget(root, active) {
        root.classList.toggle("foundry-paste-eater-chat-drop-target", active);
      }
      function _clipboardOnChatDragOver(event) {
        if (!_clipboardCanUseChatMedia()) return;
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
        if (!_clipboardCanUseChatMedia()) return;
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
        if (!_clipboardCanUseChatUploadButton()) return;
        if (root.querySelector(`[data-action="${CLIPBOARD_IMAGE_CHAT_UPLOAD_ACTION}"]`)) return;
        const form = root.matches("form") ? root : root.querySelector("form") || root.closest("form");
        if (!form) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "foundry-paste-eater-chat-upload";
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
          if (imageInput?.url && _clipboardInsertTextAtTarget(target, imageInput.text || imageInput.url)) {
            _clipboardLog("info", "Inserted the original URL into chat after media handling failed", {
              imageInput: _clipboardDescribeImageInput(imageInput),
              error: _clipboardSerializeError(error)
            });
            return false;
          }
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
            if (!_clipboardCanUseChatMedia()) return;
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
      }
      module.exports = {
        _clipboardAddSceneControlButtons,
        _clipboardGetScenePastePrompt,
        _clipboardScenePastePromptIsOpen,
        _clipboardSetScenePastePromptMessage,
        _clipboardCloseScenePastePrompt,
        _clipboardFocusScenePastePrompt,
        _clipboardGetScenePastePromptFallbackMessage,
        _clipboardUpsertSceneControlTool,
        _clipboardOnScenePastePromptPaste,
        _clipboardOpenScenePastePrompt,
        _clipboardTryScenePastePromptDirectRead,
        _clipboardHandleScenePasteToolClick,
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
      var { FoundryPasteEaterDestinationConfig } = require_config_app();
      var settings = require_settings();
      var state = require_state();
      document.addEventListener("keydown", uiHandlers._clipboardOnKeydown);
      document.addEventListener("paste", uiHandlers._clipboardOnPaste);
      Hooks.once("init", function() {
        settings._clipboardRegisterSettings();
        Hooks.on("getSceneControlButtons", uiHandlers._clipboardAddSceneControlButtons);
        Hooks.on("renderChatInput", uiHandlers._clipboardOnRenderChatInput);
        diagnostics._clipboardLog("info", "Initializing foundry-paste-eater module.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          sceneControls: constants.CLIPBOARD_IMAGE_SCENE_CONTROLS
        });
      });
      Hooks.once("ready", async function() {
        await settings._clipboardMigrateLegacySettings();
        diagnostics._clipboardRegisterErrorReporting();
        diagnostics._clipboardLog("info", "foundry-paste-eater module is ready.", {
          clipboardReadAvailable: Boolean(navigator.clipboard?.read),
          verboseLogging: diagnostics._clipboardVerboseLoggingEnabled()
        });
        if (game.user.isGM && !navigator.clipboard?.read) {
          ui.notifications.info("Foundry Paste Eater: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled.");
          diagnostics._clipboardLog("info", "Direct clipboard reads are unavailable; paste-event and upload fallbacks remain available where enabled.");
        }
      });
      module.exports = {
        FoundryPasteEaterDestinationConfig,
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
          ...settings,
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
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_MEDIA_SETTING,
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CANVAS_TEXT_SETTING,
            CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_MINIMUM_ROLE_CHAT_MEDIA_SETTING,
            CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING: constants.CLIPBOARD_IMAGE_ALLOW_NON_GM_SCENE_CONTROLS_SETTING,
            CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_CHAT_MEDIA_SETTING,
            CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_CHAT_UPLOAD_BUTTON_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TOKEN_CREATION_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TILE_CREATION_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TOKEN_REPLACEMENT_SETTING,
            CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_TILE_REPLACEMENT_SETTING,
            CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_SCENE_PASTE_TOOL_SETTING,
            CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING: constants.CLIPBOARD_IMAGE_ENABLE_SCENE_UPLOAD_TOOL_SETTING,
            CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING: constants.CLIPBOARD_IMAGE_DEFAULT_EMPTY_CANVAS_TARGET_SETTING,
            CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING: constants.CLIPBOARD_IMAGE_CREATE_BACKING_ACTORS_SETTING,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_SETTING,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SETTING,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_SETTING,
            CLIPBOARD_IMAGE_ROLE_PLAYER: constants.CLIPBOARD_IMAGE_ROLE_PLAYER,
            CLIPBOARD_IMAGE_ROLE_TRUSTED: constants.CLIPBOARD_IMAGE_ROLE_TRUSTED,
            CLIPBOARD_IMAGE_ROLE_ASSISTANT: constants.CLIPBOARD_IMAGE_ROLE_ASSISTANT,
            CLIPBOARD_IMAGE_ROLE_GAMEMASTER: constants.CLIPBOARD_IMAGE_ROLE_GAMEMASTER,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_ACTIVE_LAYER,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TILE,
            CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN: constants.CLIPBOARD_IMAGE_EMPTY_CANVAS_TARGET_TOKEN,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_FULL_PREVIEW,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_THUMBNAIL,
            CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY: constants.CLIPBOARD_IMAGE_CHAT_MEDIA_DISPLAY_LINK_ONLY,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_SCENE_NOTES,
            CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED: constants.CLIPBOARD_IMAGE_CANVAS_TEXT_PASTE_MODE_DISABLED,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_AUTO,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_ALWAYS,
            CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER: constants.CLIPBOARD_IMAGE_SCENE_PASTE_PROMPT_MODE_NEVER,
            CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT: constants.CLIPBOARD_IMAGE_MEDIA_FILE_ACCEPT,
            CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS: constants.CLIPBOARD_IMAGE_SCENE_ACTION_CONTEXT_OPTIONS
          }
        }
      };
    }
  });
  return require_index();
})();
if (typeof module !== 'undefined' && module.exports) module.exports = FoundryPasteEaterRuntime;
