// @ts-nocheck

const CLIPBOARD_IMAGE_BOUND_CHAT_ROOTS = new WeakSet();
const CLIPBOARD_IMAGE_BOUND_EVENT_DOCUMENTS = new WeakSet();

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;
let CLIPBOARD_IMAGE_LAST_POINTER_TARGET = null;

function _clipboardGetRuntimeState() {
  return {
    locked: CLIPBOARD_IMAGE_LOCKED,
    hiddenMode: CLIPBOARD_HIDDEN_MODE,
    lastPointerTarget: CLIPBOARD_IMAGE_LAST_POINTER_TARGET,
  };
}

function _clipboardSetRuntimeState({locked, hiddenMode, lastPointerTarget} = {}) {
  if (typeof locked === "boolean") CLIPBOARD_IMAGE_LOCKED = locked;
  if (typeof hiddenMode === "boolean") CLIPBOARD_HIDDEN_MODE = hiddenMode;
  if (Object.hasOwn(arguments[0] || {}, "lastPointerTarget")) {
    CLIPBOARD_IMAGE_LAST_POINTER_TARGET = lastPointerTarget || null;
  }
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

function _clipboardGetLastPointerTarget() {
  return CLIPBOARD_IMAGE_LAST_POINTER_TARGET;
}

function _clipboardSetLastPointerTarget(target) {
  CLIPBOARD_IMAGE_LAST_POINTER_TARGET = target || null;
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
  _clipboardGetLastPointerTarget,
  _clipboardSetLastPointerTarget,
};
