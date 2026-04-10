import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createClipboardItem, createDataTransfer, withMockImage, withMockVideo} from "./spec-helpers.js";

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
      expect(api._clipboardGetFilenameExtension("https://example.com/file?x=1#hash")).toBe("");
      expect(api._clipboardGetFilenameExtension("filename")).toBe("");
      expect(api._clipboardGetFilenameExtension("")).toBe("");
    });

    it("gets file extensions from File and Blob inputs", () => {
      expect(api._clipboardGetFileExtension(new File(["x"], "portrait.JPG", {type: "image/jpeg"}))).toBe("jpg");
      expect(api._clipboardGetFileExtension(new Blob(["x"], {type: "image/svg+xml"}))).toBe("svg");
    });

    it("maps Foundry audio mime types and filenames", () => {
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/aac")).toBe("aac");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/x-flac")).toBe("flac");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/x-m4a")).toBe("m4a");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/x-midi")).toBe("mid");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/mp3")).toBe("mp3");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/ogg")).toBe("ogg");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/opus")).toBe("opus");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/x-wav")).toBe("wav");
      expect(api._clipboardGetAudioExtensionFromMimeType("audio/webm")).toBe("webm");
      expect(api._clipboardGetAudioExtensionFromMimeType("application/octet-stream")).toBe("");

      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.aac")).toBe("audio/aac");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.flac")).toBe("audio/flac");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.m4a")).toBe("audio/mp4");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.mid")).toBe("audio/midi");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.mp3")).toBe("audio/mpeg");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.ogg")).toBe("audio/ogg");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.opus")).toBe("audio/opus");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.wav")).toBe("audio/wav");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme.webm")).toBe("audio/webm");
      expect(api._clipboardGetAudioMimeTypeFromFilename("theme")).toBe("audio/mpeg");
      expect(api._clipboardGetMimeTypeFromFilename("clip.ogv")).toBe("video/ogg");
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

    it("detects supported audio filenames and keeps extension-only webm visual by default", () => {
      expect(api._clipboardLooksLikeAudioFilename("song.ogg")).toBe(true);
      expect(api._clipboardLooksLikeAudioFilename("song.midi")).toBe(true);
      expect(api._clipboardLooksLikeAudioFilename("song.webm")).toBe(false);
      expect(api._clipboardLooksLikeAudioFilename("song.webm", {explicitAudioContext: true})).toBe(true);
      globalThis.foundry.audio.AudioHelper.hasAudioExtension.mockReturnValueOnce(true);
      expect(api._clipboardLooksLikeAudioFilename("song.custom")).toBe(true);
    });

    it("classifies image and video mime types", () => {
      expect(api._clipboardIsImageMimeType("image/png")).toBe(true);
      expect(api._clipboardIsImageMimeType("video/mp4")).toBe(false);
      expect(api._clipboardIsVideoMimeType("video/mp4")).toBe(true);
      expect(api._clipboardIsVideoMimeType("image/png")).toBe(false);
      expect(api._clipboardIsPdfMimeType("application/pdf; charset=binary")).toBe(true);
      expect(api._clipboardIsPdfMimeType("application/x-pdf")).toBe(true);
      expect(api._clipboardIsAudioMimeType("audio/mpeg; charset=binary")).toBe(true);
      expect(api._clipboardIsMediaMimeType("video/mp4")).toBe(true);
      expect(api._clipboardIsMediaMimeType("text/plain")).toBe(false);
    });

    it("derives media kind from mime type, filename, and src", () => {
      expect(api._clipboardGetMediaKind({mimeType: "video/mp4"})).toBe("video");
      expect(api._clipboardGetMediaKind({mimeType: "image/png"})).toBe("image");
      expect(api._clipboardGetMediaKind({filename: "file.webm"})).toBe("video");
      expect(api._clipboardGetMediaKind({filename: "file.ogg"})).toBeNull();
      expect(api._clipboardGetMediaKind({mimeType: "video/ogg", filename: "file.ogg"})).toBe("video");
      expect(api._clipboardGetMediaKind({src: "https://example.com/file.gif"})).toBe("image");
      expect(api._clipboardGetMediaKind({filename: "file.txt"})).toBeNull();
    });

    it("derives audio kind from mime type, filename, and explicit audio context", () => {
      expect(api._clipboardGetAudioKind({mimeType: "audio/mpeg"})).toBe("audio");
      expect(api._clipboardGetAudioKind({filename: "track.ogg"})).toBe("audio");
      expect(api._clipboardGetAudioKind({filename: "track.webm"})).toBeNull();
      expect(api._clipboardGetAudioKind({filename: "track.webm", explicitAudioContext: true})).toBe("audio");
      expect(api._clipboardGetAudioKind({filename: "track.txt"})).toBeNull();
    });

    it("validates supported media blobs", () => {
      expect(api._clipboardIsSupportedMediaBlob(new File(["x"], "portrait.JPG", {type: "image/jpeg"}))).toBe(true);
      expect(api._clipboardIsSupportedMediaBlob(new File(["x"], "notes.txt", {type: "text/plain"}))).toBe(false);
    });

    it("detects and coerces PDF files separately from media files", () => {
      const untypedPdf = new File(["pdf"], "handout", {type: ""});
      const typedPdf = api._clipboardCoercePdfFile(untypedPdf, {mimeType: "application/pdf"});

      expect(api._clipboardLooksLikePdfFilename("handout.PDF")).toBe(true);
      expect(api._clipboardLooksLikePdfFilename("handout.png")).toBe(false);
      expect(api._clipboardIsPdfBlob(new File(["pdf"], "handout.pdf", {type: ""}))).toBe(true);
      expect(typedPdf).toBeInstanceOf(File);
      expect(typedPdf.name).toBe("handout.pdf");
      expect(typedPdf.type).toBe("application/pdf");
      expect(api._clipboardCoercePdfFile(new File(["x"], "notes.txt", {type: "text/plain"}))).toBeNull();
    });

    it("detects and coerces audio files separately from visual media files", () => {
      const untypedMidi = new File(["midi"], "theme.midi", {type: ""});
      const typedMidi = api._clipboardCoerceAudioFile(untypedMidi, {
        explicitAudioContext: true,
      });

      expect(api._clipboardIsAudioBlob(new File(["mp3"], "theme.mp3", {type: ""}))).toBe(true);
      expect(api._clipboardIsAudioBlob(new File(["webm"], "theme.webm", {type: ""}))).toBe(false);
      expect(api._clipboardIsAudioBlob(new File(["webm"], "theme.webm", {type: ""}), {explicitAudioContext: true})).toBe(true);
      expect(typedMidi).toBeInstanceOf(File);
      expect(typedMidi.name).toBe("theme.mid");
      expect(typedMidi.type).toBe("audio/midi");
      expect(api._clipboardCoerceAudioFile(new File(["x"], "notes.txt", {type: "text/plain"}))).toBeNull();
      expect(api._clipboardCoerceMediaFile(new File(["ogg"], "theme.ogg", {type: ""}))).toBeNull();
    });

    it("can coerce under-described media blobs into typed files", () => {
      const gifBlob = new File(["gif"], "copied-image", {type: ""});
      const typedGifFile = api._clipboardCoerceMediaFile(gifBlob, {mimeType: "image/gif"});

      expect(typedGifFile).toBeInstanceOf(File);
      expect(typedGifFile.name).toBe("copied-image.gif");
      expect(typedGifFile.type).toBe("image/gif");
      expect(api._clipboardGetMediaKind({blob: typedGifFile, filename: typedGifFile.name})).toBe("image");

      expect(api._clipboardCoerceMediaFile(new File(["x"], "notes.txt", {type: ""}), {
        mimeType: "text/plain",
      })).toBeNull();
    });

    it("detects gif media from mime types and filenames", () => {
      expect(api._clipboardIsGifMedia({mimeType: "image/gif"})).toBe(true);
      expect(api._clipboardIsGifMedia({filename: "animated.GIF"})).toBe(true);
      expect(api._clipboardIsGifMedia({src: "https://example.com/animated.gif?x=1"})).toBe(true);
      expect(api._clipboardIsGifMedia({filename: "static.png"})).toBe(false);
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
      expect(api._clipboardGetMimeTypeFromFilename("a.ogg")).toBe("audio/ogg");
      expect(api._clipboardGetMimeTypeFromFilename("a.webm")).toBe("video/webm");
      expect(api._clipboardGetMimeTypeFromFilename("a.pdf")).toBe("application/pdf");
      expect(api._clipboardGetMimeTypeFromFilename("a.mp3")).toBe("audio/mpeg");
      expect(api._clipboardGetMimeTypeFromFilename("a.midi")).toBe("audio/midi");
      expect(api._clipboardGetAudioMimeTypeFromFilename("a.webm")).toBe("audio/webm");
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

    it("rasterizes gif blobs into static png files", async () => {
      const originalCreateElement = document.createElement.bind(document);
      const drawImage = vi.fn();
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage})),
          toBlob: callback => callback(new Blob(["png"], {type: "image/png"})),
        };
      });

      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      const createObjectURL = vi.fn(() => "blob:gif-preview");
      const revokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURL;

      const restoreImage = withMockImage({width: 64, height: 32});
      try {
        const rasterized = await api._clipboardConvertGifToStaticPng(
          new File(["gif"], "animated.gif", {type: "image/gif"})
        );

        expect(rasterized).toBeInstanceOf(File);
        expect(rasterized.name).toBe("animated.png");
        expect(rasterized.type).toBe("image/png");
        expect(drawImage).toHaveBeenCalled();
        expect(createObjectURL).toHaveBeenCalled();
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:gif-preview");
      } finally {
        restoreImage();
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("continues rasterization when image decode rejects after a successful load", async () => {
      const originalCreateElement = document.createElement.bind(document);
      const drawImage = vi.fn();
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage})),
          toBlob: callback => callback(new Blob(["png"], {type: "image/png"})),
        };
      });

      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();

      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.naturalWidth = 48;
          this.naturalHeight = 24;
        }

        decode() {
          return Promise.reject(new Error("decode failed"));
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };

      try {
        const rasterized = await api._clipboardRasterizeImageBlob(
          new File(["gif"], "animated.gif", {type: "image/gif"})
        );
        expect(rasterized).toBeInstanceOf(File);
        expect(rasterized.name).toBe("animated.png");
        expect(drawImage).toHaveBeenCalled();
      } finally {
        globalThis.Image = OriginalImage;
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("fails rasterization cleanly when the image never loads", async () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();

      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onerror?.(new Error("load failed")));
        }
      };

      try {
        await expect(
          api._clipboardRasterizeImageBlob(new File(["gif"], "animated.gif", {type: "image/gif"}))
        ).rejects.toThrow("Failed to rasterize pasted media");
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:gif-preview");
      } finally {
        globalThis.Image = OriginalImage;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("fails rasterization when the loaded image has no usable dimensions", async () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();

      const OriginalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          this.naturalWidth = 0;
          this.naturalHeight = 0;
          this.width = 0;
          this.height = 0;
        }

        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
      };

      try {
        await expect(
          api._clipboardRasterizeImageBlob(new File(["gif"], "animated.gif", {type: "image/gif"}))
        ).rejects.toThrow("Failed to rasterize pasted media");
      } finally {
        globalThis.Image = OriginalImage;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("fails rasterization when canvas 2d rendering is unavailable", async () => {
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => null),
        };
      });

      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();

      const restoreImage = withMockImage({width: 64, height: 32});
      try {
        await expect(
          api._clipboardRasterizeImageBlob(new File(["gif"], "animated.gif", {type: "image/gif"}))
        ).rejects.toThrow("Canvas rasterization is unavailable");
      } finally {
        restoreImage();
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("fails rasterization when canvas export does not produce a blob", async () => {
      const originalCreateElement = document.createElement.bind(document);
      const drawImage = vi.fn();
      document.createElement = vi.fn(tagName => {
        if (tagName !== "canvas") return originalCreateElement(tagName);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({drawImage})),
          toBlob: callback => callback(null),
        };
      });

      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
      globalThis.URL.createObjectURL = vi.fn(() => "blob:gif-preview");
      globalThis.URL.revokeObjectURL = vi.fn();

      const restoreImage = withMockImage({width: 64, height: 32});
      try {
        await expect(
          api._clipboardRasterizeImageBlob(new File(["gif"], "animated.gif", {type: "image/gif"}))
        ).rejects.toThrow("Failed to rasterize pasted media");
        expect(drawImage).toHaveBeenCalled();
      } finally {
        restoreImage();
        document.createElement = originalCreateElement;
        globalThis.URL.createObjectURL = originalCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      }
    });

    it("leaves non-gif blobs unchanged when converting to static png", async () => {
      const pngFile = new File(["png"], "static.png", {type: "image/png"});
      await expect(api._clipboardConvertGifToStaticPng(pngFile)).resolves.toBe(pngFile);
    });

    it("versions existing File objects during upload creation", () => {
      const file = new File(["x"], "portrait.JPG", {type: "image/jpeg"});
      const uploadFile = api._clipboardCreateUploadFile(file, 456);
      expect(uploadFile).toBeInstanceOf(File);
      expect(uploadFile).not.toBe(file);
      expect(uploadFile.name).toBe("portrait-456.JPG");
      expect(uploadFile.type).toBe("image/jpeg");
    });

    it("infers upload mime types for under-described media files", () => {
      const file = new File(["gif"], "test-animated.gif", {type: ""});
      const uploadFile = api._clipboardCreateUploadFile(file, 789);

      expect(uploadFile).toBeInstanceOf(File);
      expect(uploadFile.name).toBe("test-animated-789.gif");
      expect(uploadFile.type).toBe("image/gif");
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

    it("parses direct PDF URLs from uri-list, HTML links, and plain text", () => {
      expect(api._clipboardLooksLikePdfUrl("https://example.com/handout.pdf?download=1")).toBe(true);
      expect(api._clipboardLooksLikePdfUrl("https://example.com/handout.png")).toBe(false);
      expect(api._clipboardExtractPdfUrlFromUriList("# comment\nhttps://example.com/handout.pdf")).toBe("https://example.com/handout.pdf");
      expect(api._clipboardExtractPdfUrlFromText("https://example.com/handout.pdf")).toBe("https://example.com/handout.pdf");
      expect(api._clipboardExtractPdfUrlFromText("https://example.com/handout one.pdf")).toBeNull();
      expect(api._clipboardExtractPdfUrlFromHtml('<a href="https://example.com/readme.txt">Text</a><a href="https://example.com/handout.pdf">PDF</a>')).toBe("https://example.com/handout.pdf");
      expect(api._clipboardExtractPdfUrlFromHtml('<object data="https://example.com/handout.pdf"></object>')).toBe("https://example.com/handout.pdf");
      expect(api._clipboardExtractPdfUrlFromHtml("")).toBeNull();
    });

    it("parses direct audio URLs from uri-list, HTML audio tags, and plain text", () => {
      expect(api._clipboardLooksLikeAudioUrl("https://example.com/theme.ogg?download=1")).toBe(true);
      expect(api._clipboardLooksLikeAudioUrl("https://example.com/theme.webm")).toBe(false);
      expect(api._clipboardLooksLikeAudioUrl("https://example.com/theme.webm", {explicitAudioContext: true})).toBe(true);
      expect(api._clipboardLooksLikeAudioUrl("https://example.com/theme.png")).toBe(false);
      expect(api._clipboardExtractAudioUrlFromUriList("# comment\nhttps://example.com/theme.ogg")).toBe("https://example.com/theme.ogg");
      expect(api._clipboardExtractAudioUrlFromText("https://example.com/theme.ogg")).toBe("https://example.com/theme.ogg");
      expect(api._clipboardExtractAudioUrlFromText("https://example.com/theme one.ogg")).toBeNull();
      expect(api._clipboardExtractAudioUrlFromHtml('<audio src="https://example.com/theme.ogg"></audio>')).toBe("https://example.com/theme.ogg");
      expect(api._clipboardExtractAudioUrlFromHtml('<audio><source src="https://example.com/theme.mp3"></audio>')).toBe("https://example.com/theme.mp3");
      expect(api._clipboardExtractAudioUrlFromHtml('<a href="https://example.com/theme.ogg">Audio</a>')).toBe("https://example.com/theme.ogg");
      expect(api._clipboardExtractAudioUrlFromHtml("")).toBeNull();
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

    it("extracts PDF input from blobs and PDF-like URL values", () => {
      const pdf = new File(["pdf"], "handout.pdf", {type: "application/pdf"});
      expect(api._clipboardExtractPdfInputFromValues({
        blob: pdf,
      }, {
        blobMessage: "blob",
      })).toEqual({blob: pdf});

      expect(api._clipboardExtractPdfInputFromValues({
        uriList: "https://example.com/handout.pdf",
      }, {
        uriListMessage: "uri",
      })).toEqual({
        url: "https://example.com/handout.pdf",
        text: "https://example.com/handout.pdf",
      });

      expect(api._clipboardExtractPdfInputFromValues({
        html: '<a href="https://example.com/handout.pdf">Handout</a>',
      }, {
        htmlMessage: "html",
      })).toEqual({
        url: "https://example.com/handout.pdf",
        text: "https://example.com/handout.pdf",
      });

      expect(api._clipboardExtractPdfInputFromValues({plainText: "not a url"})).toBeNull();
      expect(api._clipboardExtractPdfInputFromValues({plainText: "https://example.com/image.png"})).toBeNull();
    });

    it("extracts audio input from blobs and audio-like URL values", () => {
      const audio = new File(["audio"], "theme.mp3", {type: "audio/mpeg"});
      expect(api._clipboardExtractAudioInputFromValues({
        blob: audio,
      }, {
        blobMessage: "blob",
      })).toEqual({blob: audio});

      expect(api._clipboardExtractAudioInputFromValues({
        uriList: "https://example.com/theme.ogg",
      }, {
        uriListMessage: "uri",
      })).toEqual({
        url: "https://example.com/theme.ogg",
        text: "https://example.com/theme.ogg",
      });

      expect(api._clipboardExtractAudioInputFromValues({
        html: '<audio src="https://example.com/theme.mp3"></audio>',
      }, {
        htmlMessage: "html",
      })).toEqual({
        url: "https://example.com/theme.mp3",
        text: "https://example.com/theme.mp3",
      });

      expect(api._clipboardExtractAudioInputFromValues({
        plainText: "https://example.com/theme.webm",
      })).toBeNull();
      expect(api._clipboardExtractAudioInputFromValues({
        plainText: "https://example.com/theme.webm",
      }, {
        explicitAudioContext: true,
      })).toEqual({
        url: "https://example.com/theme.webm",
        text: "https://example.com/theme.webm",
      });
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

    it("prefers direct animated-media urls over rasterized pasted blobs", () => {
      const pngBlob = new File(["x"], "copied-image.png", {type: "image/png"});
      expect(api._clipboardExtractImageInputFromValues({
        blob: pngBlob,
        html: '<img src="https://example.com/dancing-cat.gif">',
      }, {
        blobMessage: "blob",
        htmlMessage: "html",
      })).toEqual({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: pngBlob,
      });
    });

    it("keeps animation-capable pasted blobs ahead of animated-media urls", () => {
      const gifBlob = new File(["gif"], "copied-image.gif", {type: "image/gif"});
      expect(api._clipboardExtractImageInputFromValues({
        blob: gifBlob,
        html: '<img src="https://example.com/dancing-cat.gif">',
      }, {
        blobMessage: "blob",
        htmlMessage: "html",
      })).toEqual({
        blob: gifBlob,
      });

      const webpBlob = new File(["webp"], "copied-image.webp", {type: "image/webp"});
      expect(api._clipboardExtractImageInputFromValues({
        blob: webpBlob,
        html: '<img src="https://example.com/dancing-cat.webp">',
      }, {
        blobMessage: "blob",
        htmlMessage: "html",
      })).toEqual({
        blob: webpBlob,
      });
    });

    it("detects rasterized fallback blobs by mime type or filename extension", () => {
      expect(api._clipboardIsLikelyRasterizedImageBlob(new File(["x"], "copied-image.png", {type: "image/png"}))).toBe(true);
      expect(api._clipboardIsLikelyRasterizedImageBlob(new File(["x"], "copied-image.jpg", {type: ""}))).toBe(true);
      expect(api._clipboardIsLikelyRasterizedImageBlob(new File(["gif"], "copied-image.gif", {type: "image/gif"}))).toBe(false);
      expect(api._clipboardIsLikelyRasterizedImageBlob(null)).toBe(false);
    });

    it("extracts image input from async clipboard values", async () => {
      await expect(api._clipboardExtractImageInput([
        createClipboardItem({"text/uri-list": "https://example.com/file.png"}),
      ])).resolves.toEqual({
        url: "https://example.com/file.png",
        text: "https://example.com/file.png",
      });
    });

    it("extracts PDF input from async clipboard file and text values", async () => {
      const pdf = new File(["pdf"], "handout.pdf", {type: "application/pdf"});
      await expect(api._clipboardExtractPdfInput([
        createClipboardItem({"application/pdf": pdf}),
      ])).resolves.toEqual({blob: pdf});

      await expect(api._clipboardExtractPdfInput([
        createClipboardItem({"text/plain": "https://example.com/handout.pdf"}),
      ])).resolves.toEqual({
        url: "https://example.com/handout.pdf",
        text: "https://example.com/handout.pdf",
      });
    });

    it("extracts audio input from async clipboard file and text values", async () => {
      const audio = new File(["audio"], "theme.mp3", {type: "audio/mpeg"});
      await expect(api._clipboardExtractAudioInput([
        createClipboardItem({"audio/mpeg": audio}),
      ])).resolves.toEqual({blob: audio});

      await expect(api._clipboardExtractAudioInput([
        createClipboardItem({"text/plain": "https://example.com/theme.ogg"}),
      ])).resolves.toEqual({
        url: "https://example.com/theme.ogg",
        text: "https://example.com/theme.ogg",
      });
    });

    it("prefers animated-media urls from async clipboard items over rasterized image blobs", async () => {
      const pngBlob = new File(["x"], "copied-image.png", {type: "image/png"});
      await expect(api._clipboardExtractImageInput([
        createClipboardItem({"image/png": pngBlob}),
        createClipboardItem({"text/html": '<img src="https://example.com/dancing-cat.gif">'}),
      ])).resolves.toEqual({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: pngBlob,
      });
    });

    it("keeps animation-capable async clipboard blobs ahead of animated-media urls", async () => {
      const gifBlob = new File(["gif"], "copied-image.gif", {type: "image/gif"});
      await expect(api._clipboardExtractImageInput([
        createClipboardItem({"image/gif": gifBlob}),
        createClipboardItem({"text/html": '<img src="https://example.com/dancing-cat.gif">'}),
      ])).resolves.toEqual({
        blob: gifBlob,
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

    it("extracts PDF blobs and inputs from dataTransfer payloads", () => {
      const pdf = new File(["pdf"], "handout", {type: ""});
      const pdfTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "application/pdf",
          getAsFile: () => pdf,
        }],
        files: [pdf],
      });
      const blob = api._clipboardExtractPdfBlobFromDataTransfer(pdfTransfer);
      expect(blob).toBeInstanceOf(File);
      expect(blob.name).toBe("handout.pdf");
      expect(blob.type).toBe("application/pdf");

      const urlTransfer = createDataTransfer({
        data: {
          "text/uri-list": "https://example.com/handout.pdf",
          "text/plain": "https://example.com/handout.pdf",
        },
      });
      expect(api._clipboardExtractPdfInputFromDataTransfer(urlTransfer)).toEqual({
        url: "https://example.com/handout.pdf",
        text: "https://example.com/handout.pdf",
      });
    });

    it("extracts audio blobs and inputs from dataTransfer payloads", () => {
      const audio = new File(["audio"], "theme", {type: ""});
      const audioTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "audio/mpeg",
          getAsFile: () => audio,
        }],
        files: [audio],
      });
      const blob = api._clipboardExtractAudioBlobFromDataTransfer(audioTransfer);
      expect(blob).toBeInstanceOf(File);
      expect(blob.name).toBe("theme.mp3");
      expect(blob.type).toBe("audio/mpeg");

      const filesOnly = createDataTransfer({
        files: [new File(["audio"], "files-only.wav", {type: "audio/wav"})],
      });
      expect(api._clipboardExtractAudioInputFromDataTransfer(filesOnly).blob.name).toBe("files-only.wav");

      const urlTransfer = createDataTransfer({
        data: {
          "text/uri-list": "https://example.com/theme.ogg",
          "text/plain": "https://example.com/theme.ogg",
        },
      });
      expect(api._clipboardExtractAudioInputFromDataTransfer(urlTransfer)).toEqual({
        url: "https://example.com/theme.ogg",
        text: "https://example.com/theme.ogg",
      });
    });

    it("uses dataTransfer item metadata to recover Finder-style gif files", () => {
      const gifBlob = new File(["gif"], "test-animated", {type: ""});
      const textTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "image/gif",
          getAsFile: () => gifBlob,
        }],
        files: [gifBlob],
      });

      const result = api._clipboardExtractImageBlobFromDataTransfer(textTransfer);
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe("test-animated.gif");
      expect(result.type).toBe("image/gif");
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

    it("prefers animated-media urls from dataTransfer html over rasterized image blobs", () => {
      const pngBlob = new File(["x"], "copied-image.png", {type: "image/png"});
      const textTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "image/png",
          getAsFile: () => pngBlob,
        }],
        files: [pngBlob],
        data: {
          "text/html": '<img src="https://example.com/dancing-cat.gif">',
          "text/plain": "https://example.com/dancing-cat.gif",
        },
      });

      expect(api._clipboardExtractImageInputFromDataTransfer(textTransfer)).toEqual({
        url: "https://example.com/dancing-cat.gif",
        text: "https://example.com/dancing-cat.gif",
        fallbackBlob: pngBlob,
      });
    });

    it("keeps animation-capable dataTransfer blobs ahead of animated-media urls", () => {
      const gifBlob = new File(["gif"], "copied-image.gif", {type: "image/gif"});
      const textTransfer = createDataTransfer({
        items: [{
          kind: "file",
          type: "image/gif",
          getAsFile: () => gifBlob,
        }],
        files: [gifBlob],
        data: {
          "text/html": '<img src="https://example.com/dancing-cat.gif">',
          "text/plain": "https://example.com/dancing-cat.gif",
        },
      });

      expect(api._clipboardExtractImageInputFromDataTransfer(textTransfer)).toEqual({
        blob: gifBlob,
      });
    });
  });
});
