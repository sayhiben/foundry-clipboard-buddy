import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createClipboardItem, createDataTransfer, withMockVideo} from "./spec-helpers.js";

describe("media helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("filename and mime helpers", () => {
    it("normalizes mime types", () => {
      expect(api._clipboardNormalizeMimeType("IMAGE/PNG; charset=utf-8")).toBe("image/png");
      expect(api._clipboardNormalizeMimeType("")).toBe("");
    });

    it("extracts filename extensions", () => {
      expect(api._clipboardGetFilenameExtension("https://example.com/file.webp?x=1#hash")).toBe("webp");
      expect(api._clipboardGetFilenameExtension("")).toBe("");
    });

    it("gets file extensions from File and Blob inputs", () => {
      expect(api._clipboardGetFileExtension(new File(["x"], "portrait.JPG", {type: "image/jpeg"}))).toBe("jpg");
      expect(api._clipboardGetFileExtension(new Blob(["x"], {type: "image/svg+xml"}))).toBe("svg");
    });

    it("extracts decoded filenames from supported urls", () => {
      expect(api._clipboardGetFilenameFromUrl("https://example.com/media%20file.gif")).toBe("media file.gif");
    });

    it("falls back to the raw filename when decodeURIComponent throws", () => {
      const originalDecodeURIComponent = globalThis.decodeURIComponent;
      globalThis.decodeURIComponent = vi.fn(() => {
        throw new Error("bad decode");
      });

      expect(api._clipboardGetFilenameFromUrl("https://example.com/%E0%A4%A.png")).toBe("%E0%A4%A.png");
      globalThis.decodeURIComponent = originalDecodeURIComponent;
    });

    it("rejects unsupported filename urls", () => {
      expect(api._clipboardGetFilenameFromUrl("ftp://example.com/file.png")).toBe("");
      expect(api._clipboardGetFilenameFromUrl("notaurl")).toBe("");
    });
  });

  describe("media-kind detection", () => {
    it("detects image filenames", () => {
      expect(api._clipboardLooksLikeImageFilename("map.tiff")).toBe(true);
      expect(api._clipboardLooksLikeImageFilename("map.txt")).toBe(false);
    });

    it("detects video filenames from extensions and Foundry helper", () => {
      expect(api._clipboardLooksLikeVideoFilename("clip.webm")).toBe(true);
      globalThis.foundry.helpers.media.VideoHelper.hasVideoExtension.mockReturnValueOnce(true);
      expect(api._clipboardLooksLikeVideoFilename("clip.custom")).toBe(true);
      expect(api._clipboardLooksLikeVideoFilename("clip.txt")).toBe(false);
    });

    it("classifies image and video mime types", () => {
      expect(api._clipboardIsImageMimeType("image/png")).toBe(true);
      expect(api._clipboardIsImageMimeType("video/mp4")).toBe(false);
      expect(api._clipboardIsVideoMimeType("video/mp4")).toBe(true);
      expect(api._clipboardIsVideoMimeType("image/png")).toBe(false);
      expect(api._clipboardIsMediaMimeType("video/mp4")).toBe(true);
      expect(api._clipboardIsMediaMimeType("text/plain")).toBe(false);
    });

    it("derives media kind from mime type, filename, and src", () => {
      expect(api._clipboardGetMediaKind({mimeType: "video/mp4"})).toBe("video");
      expect(api._clipboardGetMediaKind({mimeType: "image/png"})).toBe("image");
      expect(api._clipboardGetMediaKind({filename: "file.webm"})).toBe("video");
      expect(api._clipboardGetMediaKind({src: "https://example.com/file.gif"})).toBe("image");
      expect(api._clipboardGetMediaKind({filename: "file.txt"})).toBeNull();
    });

    it("validates supported media blobs", () => {
      expect(api._clipboardIsSupportedMediaBlob(new File(["x"], "portrait.JPG", {type: "image/jpeg"}))).toBe(true);
      expect(api._clipboardIsSupportedMediaBlob(new File(["x"], "notes.txt", {type: "text/plain"}))).toBe(false);
    });
  });

  describe("mime mapping and filenames", () => {
    it("maps known extensions to mime types", () => {
      expect(api._clipboardGetMimeTypeFromFilename("a.apng")).toBe("image/apng");
      expect(api._clipboardGetMimeTypeFromFilename("a.avif")).toBe("image/avif");
      expect(api._clipboardGetMimeTypeFromFilename("a.bmp")).toBe("image/bmp");
      expect(api._clipboardGetMimeTypeFromFilename("a.gif")).toBe("image/gif");
      expect(api._clipboardGetMimeTypeFromFilename("a.ico")).toBe("image/x-icon");
      expect(api._clipboardGetMimeTypeFromFilename("a.jpeg")).toBe("image/jpeg");
      expect(api._clipboardGetMimeTypeFromFilename("a.png")).toBe("image/png");
      expect(api._clipboardGetMimeTypeFromFilename("a.tiff")).toBe("image/tiff");
      expect(api._clipboardGetMimeTypeFromFilename("a.svg")).toBe("image/svg+xml");
      expect(api._clipboardGetMimeTypeFromFilename("a.webp")).toBe("image/webp");
      expect(api._clipboardGetMimeTypeFromFilename("a.m4v")).toBe("video/mp4");
      expect(api._clipboardGetMimeTypeFromFilename("a.mpg")).toBe("video/mpeg");
      expect(api._clipboardGetMimeTypeFromFilename("a.ogg")).toBe("video/ogg");
      expect(api._clipboardGetMimeTypeFromFilename("a.webm")).toBe("video/webm");
      expect(api._clipboardGetMimeTypeFromFilename("a.unknown")).toBe("image/png");
    });

    it("preserves an existing matching filename extension", () => {
      expect(api._clipboardEnsureFilenameExtension("media.png", new File(["x"], "media.png", {type: "image/png"}))).toBe("media.png");
    });

    it("appends or generates filename extensions when needed", () => {
      expect(api._clipboardEnsureFilenameExtension("media", new Blob(["x"], {type: "image/png"}))).toMatch(/^media\.png$/);
      expect(api._clipboardEnsureFilenameExtension("", new Blob(["x"], {type: "video/webm"}))).toMatch(/^pasted_image_\d+\.webm$/);
    });
  });

  describe("geometry and media metadata", () => {
    it("returns tile video defaults for videos only", () => {
      expect(api._clipboardGetTileVideoData("video")).toEqual({autoplay: true, loop: true, volume: 0});
      expect(api._clipboardGetTileVideoData("image")).toBeUndefined();
    });

    it("creates upload files from blobs when necessary", () => {
      const uploadFile = api._clipboardCreateUploadFile(new Blob(["x"], {type: "image/png"}), 123);
      expect(uploadFile).toBeInstanceOf(File);
      expect(uploadFile.name).toBe("pasted_image-123.png");
    });

    it("versions existing File objects during upload creation", () => {
      const file = new File(["x"], "portrait.JPG", {type: "image/jpeg"});
      const uploadFile = api._clipboardCreateUploadFile(file, 456);
      expect(uploadFile).toBeInstanceOf(File);
      expect(uploadFile).not.toBe(file);
      expect(uploadFile.name).toBe("portrait-456.JPG");
      expect(uploadFile.type).toBe("image/jpeg");
    });

    it("reads copied-object state from the active layer", () => {
      globalThis.canvas.activeLayer.clipboard = {objects: [1]};
      expect(api._clipboardHasCopiedObjects()).toBe(true);
      globalThis.canvas.activeLayer.clipboard = {objects: []};
      expect(api._clipboardHasCopiedObjects()).toBe(false);
    });

    it("returns mouse position and canvas center", () => {
      expect(api._clipboardGetMousePosition()).toEqual({x: 150, y: 250});
      globalThis.canvas.mousePosition = null;
      expect(api._clipboardGetMousePosition()).toBeNull();
      globalThis.canvas.mousePosition = {x: 150, y: 250};
      expect(api._clipboardGetCanvasCenter()).toEqual({x: 500, y: 400});
    });

    it("scales tile dimensions to fit the scene", () => {
      expect(api._clipboardScaleTileDimensions(1200, 600, {sceneWidth: 900, sceneHeight: 700})).toEqual({
        width: 300,
        height: 150,
      });
    });

    it("leaves smaller tile dimensions unchanged", () => {
      expect(api._clipboardScaleTileDimensions(300, 200, {sceneWidth: 900, sceneHeight: 700})).toEqual({
        width: 300,
        height: 200,
      });
    });

    it("rounds and scales token dimensions", () => {
      expect(api._clipboardRoundDimension(1.2345)).toBe(1.23);
      expect(api._clipboardScaleTokenDimensions(400, 200)).toEqual({width: 2, height: 1});
      expect(api._clipboardScaleTokenDimensions(200, 400)).toEqual({width: 1, height: 2});
      expect(api._clipboardScaleTokenDimensions(0, 0)).toEqual({width: 1, height: 1});
    });

    it("parses SVG intrinsic dimensions from width/height or viewBox", async () => {
      expect(api._clipboardParseSvgLength("512")).toBe(512);
      expect(api._clipboardParseSvgLength("512px")).toBe(512);
      expect(api._clipboardParseSvgLength("100%")).toBeNull();
      expect(api._clipboardGetSvgElementFromText('<svg viewBox="0 0 1 1"></svg>')?.nodeName).toBe("svg");
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText(
        '<svg width="200" height="400" viewBox="0 0 200 400"></svg>'
      )).toEqual({width: 200, height: 400});
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText(
        '<svg width="256" viewBox="0 0 512 256"></svg>'
      )).toEqual({width: 256, height: 128});
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText(
        '<svg height="300" viewBox="0 0 150 300"></svg>'
      )).toEqual({width: 150, height: 300});
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText(
        '<svg viewBox="0 0 512 512"></svg>'
      )).toEqual({width: 512, height: 512});
      expect(await api._clipboardGetPreferredMediaDimensions(
        new File(['<svg viewBox="0 0 512 512"></svg>'], "test-token.svg", {type: "image/svg+xml"})
      )).toEqual({width: 512, height: 512});

      const blob = new Blob(['<svg viewBox="0 0 512 512"></svg>'], {type: "image/svg+xml"});
      blob.name = "fallback.svg";
      blob.text = undefined;
      expect(await api._clipboardGetPreferredMediaDimensions(blob)).toEqual({width: 512, height: 512});
    });

    it("normalizes uploaded SVG blobs to include explicit dimensions", async () => {
      const normalized = await api._clipboardNormalizeSvgBlobForUpload(
        new File(['<svg style="width: 512px; height: 512px;" viewBox="0 0 512 512"></svg>'], "test-token.svg", {
          type: "image/svg+xml",
        }),
        {width: 512, height: 512}
      );

      expect(normalized).toBeInstanceOf(File);
      expect(normalized.name).toBe("test-token.svg");
      await expect(api._clipboardReadBlobText(normalized)).resolves.toContain('width="512"');
      await expect(api._clipboardReadBlobText(normalized)).resolves.toContain('height="512"');
    });

    it("leaves already explicit SVG blobs unchanged during upload normalization", async () => {
      const file = new File(['<svg width="200" height="400" viewBox="0 0 200 400"></svg>'], "portrait.svg", {
        type: "image/svg+xml",
      });
      await expect(api._clipboardNormalizeSvgBlobForUpload(file, {width: 200, height: 400})).resolves.toBe(file);
    });

    it("returns null for unsupported or invalid SVG metadata", async () => {
      expect(api._clipboardParseSvgLength("0")).toBeNull();
      expect(api._clipboardParseSvgLength("12em")).toBeNull();

      const invalidViewBoxSvg = new DOMParser().parseFromString(
        '<svg viewBox="0 0 nope 512"></svg>',
        "image/svg+xml"
      ).documentElement;
      expect(api._clipboardGetSvgViewBoxDimensions(invalidViewBoxSvg)).toBeNull();
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText('<svg width="100%"></svg>')).toBeNull();
      expect(api._clipboardGetSvgIntrinsicDimensionsFromText("")).toBeNull();

      await expect(api._clipboardGetPreferredMediaDimensions(
        new File(["plain text"], "notes.txt", {type: "text/plain"})
      )).resolves.toBeNull();
      await expect(api._clipboardGetPreferredMediaDimensions(
        new File(["raster"], "image.png", {type: "image/png"})
      )).resolves.toBeNull();
      await expect(api._clipboardGetPreferredMediaDimensions(
        new File(["<svg></svg>"], "broken.svg", {type: "image/svg+xml"})
      )).resolves.toBeNull();
      await expect(api._clipboardNormalizeSvgBlobForUpload(
        new File(["<svg></svg>"], "broken.svg", {type: "image/svg+xml"})
      )).resolves.toBeInstanceOf(File);
    });

    it("rejects when the SVG FileReader fallback cannot read the blob", async () => {
      const OriginalFileReader = globalThis.FileReader;
      globalThis.FileReader = class {
        constructor() {
          this.error = new Error("reader failed");
        }

        readAsText() {
          this.onerror();
        }
      };

      const blob = new Blob(['<svg viewBox="0 0 512 512"></svg>'], {type: "image/svg+xml"});
      blob.name = "broken.svg";
      blob.text = undefined;

      await expect(api._clipboardGetPreferredMediaDimensions(blob)).rejects.toThrow("reader failed");
      globalThis.FileReader = OriginalFileReader;
    });

    it("loads image dimensions when decode is unavailable", async () => {
      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.width = 320;
          this.height = 180;
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };

      await expect(api._clipboardLoadImageDimensions("nodecode.png")).resolves.toEqual({width: 320, height: 180});
      globalThis.Image = OriginalImage;
    });

    it("snaps token positions through the grid helper", () => {
      expect(api._clipboardGetTokenPosition({x: 155, y: 245})).toEqual({x: 100, y: 200});
    });
  });

  describe("media loading", () => {
    it("returns false when there is no replacement target", async () => {
      await expect(api._clipboardReplaceControlledMedia("path.png", null, "image")).resolves.toBe(false);
    });

    it("updates token texture sources during replacement", async () => {
      await api._clipboardReplaceControlledMedia("path.png", {
        documentName: "Token",
        documents: [env.createPlaceableDocument("Token", {id: "token-1"})],
      }, "image");

      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenLastCalledWith("Token", [{
        _id: "token-1",
        "texture.src": "path.png",
      }]);
    });

    it("adds tile video data during video replacement", async () => {
      await api._clipboardReplaceControlledMedia("path.webm", {
        documentName: "Tile",
        documents: [env.createPlaceableDocument("Tile", {id: "tile-1"})],
      }, "video");

      expect(globalThis.canvas.scene.updateEmbeddedDocuments).toHaveBeenLastCalledWith("Tile", [{
        _id: "tile-1",
        "texture.src": "path.webm",
        video: {autoplay: true, loop: true, volume: 0},
      }]);
    });

    it("loads image dimensions after successful load even if decode rejects", async () => {
      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.naturalWidth = 640;
          this.naturalHeight = 480;
          this.decode = vi.fn(async () => {
            throw new Error("decode failed");
          });
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };

      await expect(api._clipboardLoadImageDimensions("path.png")).resolves.toEqual({width: 640, height: 480});
      globalThis.Image = OriginalImage;
    });

    it("rejects image loads with zero dimensions", async () => {
      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.naturalWidth = 0;
          this.naturalHeight = 0;
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };

      await expect(api._clipboardLoadImageDimensions("bad.png")).rejects.toThrow("Failed to determine pasted media size");
      globalThis.Image = OriginalImage;
    });

    it("rejects image load errors", async () => {
      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onerror?.());
        }
      };

      await expect(api._clipboardLoadImageDimensions("bad.png")).rejects.toThrow("Failed to determine pasted media size");
      globalThis.Image = OriginalImage;
    });

    it("loads video dimensions", async () => {
      const restoreVideo = withMockVideo({width: 800, height: 450});
      await expect(api._clipboardLoadVideoDimensions("video.webm")).resolves.toEqual({width: 800, height: 450});
      restoreVideo();
    });

    it("rejects videos with zero dimensions", async () => {
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn(() => ({
        preload: "",
        muted: false,
        playsInline: false,
        videoWidth: 0,
        videoHeight: 0,
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onloadedmetadata?.());
        },
      }));

      await expect(api._clipboardLoadVideoDimensions("video.webm")).rejects.toThrow("Failed to determine pasted media size");
      document.createElement = originalCreateElement;
    });

    it("rejects video load errors", async () => {
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn(() => ({
        preload: "",
        muted: false,
        playsInline: false,
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onerror?.());
        },
      }));

      await expect(api._clipboardLoadVideoDimensions("video.webm")).rejects.toThrow("Failed to determine pasted media size");
      document.createElement = originalCreateElement;
    });

    it("dispatches media dimension loading based on the src kind", async () => {
      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.naturalWidth = 10;
          this.naturalHeight = 20;
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };
      await expect(api._clipboardLoadMediaDimensions("image.png")).resolves.toEqual({width: 10, height: 20});
      globalThis.Image = OriginalImage;

      const restoreVideo = withMockVideo({width: 20, height: 10});
      await expect(api._clipboardLoadMediaDimensions("video.webm")).resolves.toEqual({width: 20, height: 10});
      restoreVideo();
    });
  });

  describe("clipboard extraction helpers", () => {
    it("reads clipboard items successfully", async () => {
      const clipItems = [
        createClipboardItem({"image/png": new Blob(["x"], {type: "image/png"})}),
        createClipboardItem({"text/plain": "hello"}),
      ];
      window.navigator.clipboard.read.mockResolvedValueOnce(clipItems);
      await expect(api._clipboardReadClipboardItems()).resolves.toEqual(clipItems);
    });

    it("returns null when clipboard read rejects without an error", async () => {
      window.navigator.clipboard.read.mockRejectedValueOnce(undefined);
      await expect(api._clipboardReadClipboardItems()).resolves.toBeNull();
    });

    it("returns null for not-allowed and not-found clipboard errors", async () => {
      window.navigator.clipboard.read.mockRejectedValueOnce(new DOMException("no", "NotAllowedError"));
      await expect(api._clipboardReadClipboardItems()).resolves.toBeNull();
      window.navigator.clipboard.read.mockRejectedValueOnce(new DOMException("no", "NotFoundError"));
      await expect(api._clipboardReadClipboardItems()).resolves.toBeNull();
    });

    it("rethrows unexpected clipboard read errors", async () => {
      window.navigator.clipboard.read.mockRejectedValueOnce(new Error("fatal"));
      await expect(api._clipboardReadClipboardItems()).rejects.toThrow("fatal");
    });

    it("extracts image blobs and text values from clipboard items", async () => {
      const clipItems = [
        createClipboardItem({"image/png": new Blob(["x"], {type: "image/png"})}),
        createClipboardItem({"text/plain": "hello"}),
      ];

      await expect(api._clipboardExtractImageBlob(clipItems)).resolves.toBeInstanceOf(Blob);
      await expect(api._clipboardReadClipboardText(clipItems, "text/plain")).resolves.toBe("hello");
      await expect(api._clipboardReadClipboardText(clipItems, "text/html")).resolves.toBe("");
    });

    it("prefers plain text when extracting text input", async () => {
      await expect(api._clipboardExtractTextInput([
        createClipboardItem({"text/plain": "alpha"}),
        createClipboardItem({"text/html": "<p>beta</p>"}),
      ])).resolves.toEqual({text: "alpha"});
    });

    it("parses supported urls and media urls from text sources", () => {
      expect(api._clipboardParseSupportedUrl("https://example.com/file.png")).toBe("https://example.com/file.png");
      expect(api._clipboardParseSupportedUrl("javascript:alert(1)")).toBeNull();
      expect(api._clipboardExtractImageUrlFromUriList("# comment\nhttps://example.com/file.png")).toBe("https://example.com/file.png");
      expect(api._clipboardExtractImageUrlFromUriList("")).toBeNull();
      expect(api._clipboardExtractImageUrlFromText("https://example.com/file.png")).toBe("https://example.com/file.png");
      expect(api._clipboardExtractImageUrlFromText("https://example.com/file one.png")).toBeNull();
      expect(api._clipboardExtractImageUrlFromHtml('<div><img src="https://example.com/file.png"></div>')).toBe("https://example.com/file.png");
      expect(api._clipboardExtractImageUrlFromHtml("")).toBeNull();
    });

    it("creates logged image input wrappers", () => {
      expect(api._clipboardCreateLoggedImageInput({url: "https://example.com/file.png"}, "message", {a: 1})).toEqual({
        url: "https://example.com/file.png",
      });
    });

    it("extracts text input from plain text and html", () => {
      expect(api._clipboardExtractTextInputFromValues({plainText: "hello"})).toEqual({text: "hello"});
      expect(api._clipboardExtractTextInputFromValues({html: "<p>hello</p>"})).toEqual({text: "hello"});
      expect(api._clipboardExtractTextInputFromValues({plainText: " \n", html: ""})).toBeNull();
    });

    it("extracts image input from blobs and url-like text values", () => {
      expect(api._clipboardExtractImageInputFromValues({
        blob: new File(["x"], "media.png", {type: "image/png"}),
      }, {
        blobMessage: "blob",
      }).blob).toBeInstanceOf(File);

      expect(api._clipboardExtractImageInputFromValues({
        uriList: "https://example.com/file.png",
      }, {
        uriListMessage: "uri",
      })).toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });

      expect(api._clipboardExtractImageInputFromValues({plainText: "not a url"})).toBeNull();
    });

    it("extracts image input from html media sources", () => {
      expect(api._clipboardExtractImageInputFromValues({
        html: '<img src="https://example.com/file.png">',
      }, {
        htmlMessage: "html",
      })).toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });
    });

    it("extracts image input from async clipboard values", async () => {
      await expect(api._clipboardExtractImageInput([
        createClipboardItem({"text/uri-list": "https://example.com/file.png"}),
      ])).resolves.toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });
    });

    it("extracts media blobs from dataTransfer items and file fallbacks", () => {
      const textTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "image/png",
          getAsFile: () => new File(["x"], "media.png", {type: "image/png"}),
        }],
        files: [new File(["y"], "fallback.png", {type: "image/png"})],
      });
      expect(api._clipboardExtractImageBlobFromDataTransfer(textTransfer)).toBeInstanceOf(File);

      const fallbackFileTransfer = createDataTransfer({
        items: [{
          kind: "string",
          getAsFile: () => null,
        }],
        files: [new File(["x"], "fallback.png", {type: "image/png"})],
      });
      expect(api._clipboardExtractImageBlobFromDataTransfer(fallbackFileTransfer)).toBeInstanceOf(File);
    });

    it("extracts text and image input from dataTransfer payloads", () => {
      const textTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "image/png",
          getAsFile: () => new File(["x"], "media.png", {type: "image/png"}),
        }],
        files: [new File(["y"], "fallback.png", {type: "image/png"})],
        data: {
          "text/plain": "https://example.com/file.png",
          "text/html": '<img src="https://example.com/file.png">',
        },
      });

      expect(api._clipboardReadDataTransferText(textTransfer, "text/plain")).toBe("https://example.com/file.png");
      expect(api._clipboardExtractTextInputFromDataTransfer(textTransfer)).toEqual({text: "https://example.com/file.png"});
      expect(api._clipboardExtractImageInputFromDataTransfer(textTransfer)).toEqual({
        blob: expect.any(File),
      });
    });
  });
});
