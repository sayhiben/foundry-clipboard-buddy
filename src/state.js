// @ts-nocheck

const CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS = new WeakSet();
const CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS = new WeakSet();

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;

function _clipboardGetRuntimeState() {
  return {
    locked: CLIPBOARD_IMAGE_LOCKED,
    hiddenMode: CLIPBOARD_HIDDEN_MODE,
  };
}

function _clipboardSetRuntimeState({locked, hiddenMode} = {}) {
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
  CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS,
  _clipboardGetRuntimeState,
  _clipboardSetRuntimeState,
  _clipboardGetLocked,
  _clipboardSetLocked,
  _clipboardGetHiddenMode,
  _clipboardSetHiddenMode,
};
