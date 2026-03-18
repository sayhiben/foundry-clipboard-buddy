function _clipboardGetFilePicker() {
  return foundry?.applications?.apps?.FilePicker?.implementation || FilePicker;
}

function _clipboardGetKeyboardManager() {
  return foundry?.helpers?.interaction?.KeyboardManager || KeyboardManager;
}

async function _clipboardCreateFolderIfMissing(folderPath) {
  const FilePickerImpl = _clipboardGetFilePicker();
  let source = "data";
  if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
    source = "forgevtt";
  }
  try {
    await FilePickerImpl.browse(source, folderPath);
  } catch (error) {
    await FilePickerImpl.createDirectory(source, folderPath);
  }
}

function _clipboardGetSource() {
  let source = "data";
  if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
    source = "forgevtt";
  }
  return source;
}

function _clipboardGetTargetFolder() {
  return game.settings.get("clipboard-image", "image-location")?.trim() || "pasted_images";
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

  const filename = "pasted_image_" + Date.now() + ".png";
  const file = new File([blob], filename, {type: blob.type});
  const path = (await FilePickerImpl.upload(_clipboardGetSource(), targetFolder, file, {})).path;

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

document.addEventListener("keydown", event => {
  CLIPBOARD_HIDDEN_MODE = (event.ctrlKey || event.metaKey) && event.getModifierState('CapsLock');
});

Hooks.once('init', function() {
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

            const targetFolder = _clipboardGetTargetFolder();
            await _clipboardCreateFolderIfMissing(targetFolder);
            await _pasteBlob(blob, targetFolder);
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

    game.settings.register('clipboard-image', 'image-location', {
      name: 'Pasted image location',
      hint: 'Folder where to save copy-pasted images. Default: pasted_images',
      scope: 'world',
      config: true,
      type: String,
      default: "pasted_images",
      filePicker: 'folder'
    });
  }

});

Hooks.once('ready', function() {
  if (game.user.isGM && !navigator.clipboard?.read) {
    ui.notifications.warn("Clipboard Image: Disabled - Your browser does not support clipboard functions. Please check the console");
    console.warn("Clipboard Image was not initialized. Either this hostname is missing certificates or if you are on Firefox: I need dom.events.asyncClipboard.read and dom.events.testing.asyncClipboard browser functions enabled. Or try with any Chromium based browser");
  }
});
