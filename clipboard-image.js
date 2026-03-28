const CLIPBOARD_IMAGE_MODULE_ID = "clipboard-image"
const CLIPBOARD_IMAGE_DEFAULT_FOLDER = "pasted_images"
const CLIPBOARD_IMAGE_SOURCE_AUTO = "auto"
const CLIPBOARD_IMAGE_SOURCE_DATA = "data"
const CLIPBOARD_IMAGE_SOURCE_S3 = "s3"
const CLIPBOARD_IMAGE_SOURCE_FORGE = "forgevtt"

function _clipboardGetFilePicker() {
  return foundry?.applications?.apps?.FilePicker?.implementation || FilePicker;
}

function _clipboardGetKeyboardManager() {
  return foundry?.helpers?.interaction?.KeyboardManager || KeyboardManager;
}

function _clipboardGetFormApplication() {
  return foundry?.appv1?.api?.FormApplication || FormApplication;
}

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

async function _clipboardCreateFolderIfMissing(destination) {
  const FilePickerImpl = _clipboardGetFilePicker();
  const options = _clipboardGetFilePickerOptions(destination);
  _clipboardAssertUploadDestination(destination);
  try {
    await FilePickerImpl.browse(destination.source, destination.target, options);
  } catch (error) {
    await FilePickerImpl.createDirectory(destination.source, destination.target, options);
  }
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

function _clipboardHasCopiedObjects() {
  const layer = canvas?.activeLayer;
  if (!layer) return false;

  // Foundry V13+ exposes a public clipboard object. Keep the legacy fallback for older cores.
  return Boolean(layer.clipboard?.objects?.length || layer._copy?.length);
}

function _clipboardGetMousePosition() {
  if (canvas?.mousePosition) {
    return {
      x: canvas.mousePosition.x,
      y: canvas.mousePosition.y,
    };
  }

  const pointer = canvas?.app?.renderer?.events?.pointer;
  if (!pointer) return null;
  const point = pointer.getLocalPosition(canvas.stage);
  return {x: point.x, y: point.y};
}

function _clipboardGetImageSizeFast(img) {
  return new Promise((resolve, reject) => {
    const wait = setInterval(() => {
      const w = img.width;
      const h = img.height;
      if (w && h) {
        clearInterval(wait);
        img.src = "";
        resolve({width: w, height: h});
      }
    }, 10);

    img.onerror = () => {
      clearInterval(wait);
      img.src = "";
      reject(new Error("Failed to determine pasted image size"));
    };
  });
}

async function _extractFromClipboard() {
  let clipItems;
  try {
    clipItems = await navigator.clipboard.read();
  } catch (error) {
    if (!error) {
      console.warn('Failed to parse clipboard. Make sure your browser supports the navigator API');
    } else if (error instanceof DOMException) {
      console.log('image-clipboard: Clipboard is empty');
    } else
      throw error;
  }
  return clipItems;
}

async function _extractBlob(clipItems) {
  if (!clipItems?.[0]) return null;
  let blob;
  for (let idx = 0; idx < clipItems[0].types.length; idx++) {
    const ftype = clipItems[0].types[idx];
    if (ftype.startsWith("image/")) {
      blob = await clipItems[0].getType(ftype);
      break;
    }
  }
  return blob;
}

async function _pasteBlob(blob, targetFolder) {
  if (!canvas?.ready || !canvas.scene) return false;

  const FilePickerImpl = _clipboardGetFilePicker();
  canvas.tiles.activate();
  const mousePos = _clipboardGetMousePosition();
  const gameElement = document.querySelector(".game");

  if (!mousePos ||
    (gameElement && document.activeElement !== gameElement) ||
    mousePos.x < 0 || mousePos.y < 0 ||
    mousePos.x > canvas.dimensions.width || mousePos.y > canvas.dimensions.height) return false;

  _clipboardAssertUploadDestination(targetFolder);
  const filename = "pasted_image_" + Date.now() + ".png";
  const file = new File([blob], filename, {type: blob.type});
  const path = (await FilePickerImpl.upload(
    targetFolder.source,
    targetFolder.target,
    file,
    _clipboardGetFilePickerOptions(targetFolder)
  )).path;

  const curDims = game.scenes.active.dimensions;
  const image = new Image();
  image.src = path;
  let {width: imgWidth, height: imgHeight} = await _clipboardGetImageSizeFast(image);
  const origWidth = imgWidth;

  if (imgHeight > curDims.sceneHeight || imgWidth > curDims.sceneWidth) {
    imgWidth = curDims.sceneWidth / 3;
    imgHeight = imgWidth * imgHeight / origWidth;
  }

  const newTile = [{
    texture: {
      src: path,
    },
    width: imgWidth,
    height: imgHeight,
    x: mousePos.x,
    y: mousePos.y,
    sort: 0,
    rotation: 0,
    hidden: CLIPBOARD_HIDDEN_MODE,
    locked: false,
  }];
  await canvas.scene.createEmbeddedDocuments("Tile", newTile);
  return true;
}

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;

class ClipboardImageDestinationConfig extends _clipboardGetFormApplication() {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "clipboard-image-destination-config",
      title: "Clipboard Image: Upload Destination",
      template: "modules/clipboard-image/templates/upload-destination.hbs",
      width: 520,
      closeOnSubmit: true,
    });
  }

  getData() {
    const source = _clipboardGetStoredSource();
    const target = _clipboardGetTargetFolder();
    const bucket = _clipboardGetStoredBucket();
    const destination = _clipboardGetUploadDestination({storedSource: source, target, bucket});

    return {
      bucket,
      destinationSummary: _clipboardDescribeDestination(destination),
      isS3: destination.storedSource === CLIPBOARD_IMAGE_SOURCE_S3,
      source,
      sourceChoices: _clipboardGetSourceChoices(source),
      target,
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
    html.find('[data-action="browse-destination"]').on("click", event => this._onBrowseDestination(event));

    this._refreshFormState();
  }

  _ensureSourceOption(source) {
    const sourceField = this.form?.elements?.source;
    if (!sourceField || !source) return;
    const choices = Array.from(sourceField.options).map(option => option.value);
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
    const destination = _clipboardGetUploadDestination({storedSource, target, bucket});
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

    const keepAutomatic = previousStoredSource === CLIPBOARD_IMAGE_SOURCE_AUTO &&
      selectedSource === _clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO);
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
    const FilePickerImpl = _clipboardGetFilePicker();
    const picker = new FilePickerImpl({
      activeSource,
      button: event.currentTarget,
      callback: path => this._applyPickerSelection(path, picker, previousStoredSource),
      current: currentTarget,
      field: form.elements.target,
      type: "folder",
    });

    if (activeSource === CLIPBOARD_IMAGE_SOURCE_S3) {
      picker.sources.s3 = picker.sources.s3 || {target: currentTarget};
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
}

function _clipboardRegisterSettings() {
  game.settings.registerMenu(CLIPBOARD_IMAGE_MODULE_ID, "upload-destination", {
    name: "Upload destination",
    label: "Configure",
    hint: "Choose the file store and folder used for pasted images. Supports User Data, The Forge, and Amazon S3 through Foundry's native file picker.",
    icon: "fa-solid fa-folder-tree",
    type: ClipboardImageDestinationConfig,
    restricted: true,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location", {
    name: "Pasted image location",
    hint: "Folder where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", {
    name: "Pasted image source",
    hint: "File source where clipboard images are saved.",
    scope: "world",
    config: false,
    type: String,
    default: CLIPBOARD_IMAGE_SOURCE_AUTO,
  });

  game.settings.register(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", {
    name: "Pasted image S3 bucket",
    hint: "S3 bucket used when clipboard images are saved to Amazon S3.",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });
}

document.addEventListener("keydown", event => {
  CLIPBOARD_HIDDEN_MODE = (event.ctrlKey || event.metaKey) && event.getModifierState('CapsLock');
});

Hooks.once('init', function() {
  _clipboardRegisterSettings();

  if (navigator.clipboard?.read) {
    const KeyboardManagerImpl = _clipboardGetKeyboardManager();
    game.keybindings.register("clipboard-image", "paste-image", {
      name: "Paste Image from Clipboard",
      restricted: true,
      uneditable: [
        {key: "KeyV", modifiers: [ KeyboardManagerImpl.MODIFIER_KEYS.CONTROL ]}
      ],
      onDown: () => {
        if (_clipboardHasCopiedObjects()) {
          console.warn("Image Clipboard: Priority given to Foundry copied objects.");
          return false;
        }
        if (CLIPBOARD_IMAGE_LOCKED) return true;
        if (game.modules.get('vtta-tokenizer')?.active &&
            Object.values(ui.windows).filter(w => w.id === 'tokenizer-control').length)
              return false;

        CLIPBOARD_IMAGE_LOCKED = true;
        void (async () => {
          try {
            const clipItems = await _extractFromClipboard();
            if (!clipItems?.length) return;

            const blob = await _extractBlob(clipItems);
            if (!blob) return;

            const destination = _clipboardGetUploadDestination();
            await _clipboardCreateFolderIfMissing(destination);
            await _pasteBlob(blob, destination);
          } catch (error) {
            ui.notifications.error("Clipboard Image: Failed to paste clipboard image. Check the console.");
            console.error("Clipboard Image: Failed to paste clipboard image", error);
          } finally {
            CLIPBOARD_IMAGE_LOCKED = false;
          }
        })();

        return true;
      },
      precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY
    });
  }

});

Hooks.once('ready', function() {
  if (game.user.isGM && !navigator.clipboard?.read) {
    ui.notifications.warn("Clipboard Image: Disabled - Your browser does not support clipboard functions. Please check the console");
    console.warn("Clipboard Image was not initialized. Either this hostname is missing certificates or if you are on Firefox: I need dom.events.asyncClipboard.read and dom.events.testing.asyncClipboard browser functions enabled. Or try with any Chromium based browser");
  }
});
