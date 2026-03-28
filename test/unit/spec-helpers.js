import {vi} from "vitest";

export function createClipboardItem(entries) {
  return {
    types: Object.keys(entries),
    getType: vi.fn(async type => {
      const value = entries[type];
      if (value instanceof Blob) return value;
      return {
        text: async () => String(value),
        type,
      };
    }),
  };
}

export function createDataTransfer({items = [], files = [], data = {}} = {}) {
  return {
    items,
    files,
    types: Object.keys(data),
    getData: vi.fn(type => data[type] || ""),
  };
}

export function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function withMockImage(dimensions = {width: 320, height: 180}) {
  const OriginalImage = globalThis.Image;
  globalThis.Image = class {
    constructor() {
      this.naturalWidth = dimensions.width;
      this.naturalHeight = dimensions.height;
    }

    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
  };

  return () => {
    globalThis.Image = OriginalImage;
  };
}

export function withRejectingImage() {
  const OriginalImage = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onerror?.());
    }
  };

  return () => {
    globalThis.Image = OriginalImage;
  };
}

export function withMockVideo(dimensions = {width: 640, height: 360}) {
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn(tagName => {
    if (tagName !== "video") return originalCreateElement(tagName);
    return {
      preload: "",
      muted: false,
      playsInline: false,
      videoWidth: dimensions.width,
      videoHeight: dimensions.height,
      pause: vi.fn(),
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(value) {
        this._src = value;
        queueMicrotask(() => this.onloadedmetadata?.());
      },
    };
  });

  return () => {
    document.createElement = originalCreateElement;
  };
}

export function setInputClickBehavior(callback) {
  const originalClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function click() {
    callback(this);
  };
  return () => {
    HTMLInputElement.prototype.click = originalClick;
  };
}
