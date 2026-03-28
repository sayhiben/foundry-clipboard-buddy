import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createDataTransfer} from "./spec-helpers.js";

describe("diagnostics and settings helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("_clipboardVerboseLoggingEnabled", () => {
    it("returns false when the setting is not registered", () => {
      expect(api._clipboardVerboseLoggingEnabled()).toBe(false);
    });

    it("returns true when the client setting is enabled", () => {
      env.settingsRegistry.set("clipboard-image.verbose-logging", {});
      env.settingsValues.set("clipboard-image.verbose-logging", true);
      expect(api._clipboardVerboseLoggingEnabled()).toBe(true);
    });
  });

  describe("_clipboardSerializeError", () => {
    it("serializes Error instances", () => {
      expect(api._clipboardSerializeError(new Error("boom"))).toMatchObject({
        name: "Error",
        message: "boom",
      });
    });

    it("passes through non-error values", () => {
      expect(api._clipboardSerializeError("nope")).toBe("nope");
    });
  });

  describe("describe helpers", () => {
    it("describes files", () => {
      expect(api._clipboardDescribeFile(new File(["x"], "media.png", {type: "image/png"}))).toMatchObject({
        name: "media.png",
        type: "image/png",
        size: 1,
      });
    });

    it("returns null for missing file descriptions", () => {
      expect(api._clipboardDescribeFile(null)).toBeNull();
      expect(api._clipboardDescribeDestinationForLog(null)).toBeNull();
      expect(api._clipboardDescribeReplacementTarget(null)).toBeNull();
      expect(api._clipboardDescribePasteContext(null)).toBeNull();
      expect(api._clipboardDescribeDataTransfer(null)).toBeNull();
      expect(api._clipboardDescribeImageInput(null)).toBeNull();
    });

    it("describes replacement targets and paste context", () => {
      const replacementTarget = {
        documentName: "Tile",
        documents: [{id: "a"}, {id: "b"}],
      };

      expect(api._clipboardDescribeReplacementTarget(replacementTarget)).toEqual({
        documentName: "Tile",
        ids: ["a", "b"],
      });

      expect(api._clipboardDescribePasteContext({
        mousePos: {x: 1, y: 2},
        createStrategy: {documentName: "Token"},
        replacementTarget,
        requireCanvasFocus: true,
      })).toMatchObject({
        mousePos: {x: 1, y: 2},
        createDocumentName: "Token",
        requireCanvasFocus: true,
      });
    });

    it("describes clipboard items and data transfer payloads", () => {
      expect(api._clipboardDescribeClipboardItems([
        {types: ["image/png"]},
        {types: ["text/plain", "text/html"]},
      ])).toEqual([
        {index: 0, types: ["image/png"]},
        {index: 1, types: ["text/plain", "text/html"]},
      ]);

      const file = new File(["x"], "media.png", {type: "image/png"});
      expect(api._clipboardDescribeDataTransfer(createDataTransfer({
        files: [file],
        items: [{kind: "file", type: "image/png"}],
        data: {"text/plain": "hello"},
      }))).toEqual({
        types: ["text/plain"],
        files: [{name: "media.png", type: "image/png", size: 1}],
        items: [{kind: "file", type: "image/png"}],
      });
    });

    it("describes blob and url image inputs", () => {
      const file = new File(["x"], "media.png", {type: "image/png"});
      expect(api._clipboardDescribeImageInput({blob: file})).toMatchObject({
        source: "blob",
        name: "media.png",
        mediaKind: "image",
      });

      expect(api._clipboardDescribeImageInput({url: "https://example.com/video.webm"})).toMatchObject({
        source: "url",
        url: "https://example.com/video.webm",
        mediaKind: "video",
      });
    });
  });

  describe("_clipboardLog", () => {
    it("emits debug logs when verbose logging is enabled", () => {
      env.settingsRegistry.set("clipboard-image.verbose-logging", {});
      env.settingsValues.set("clipboard-image.verbose-logging", true);
      api._clipboardLog("debug", "debug message", {ok: true});
      expect(console.debug).toHaveBeenCalled();
    });

    it("suppresses info logs when verbose logging is disabled", () => {
      api._clipboardLog("info", "hidden info");
      expect(console.info).not.toHaveBeenCalled();
    });

    it("always emits warn and error logs", () => {
      api._clipboardLog("warn", "warn");
      api._clipboardLog("error", "error", {ok: false});
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("source and destination helpers", () => {
    it("detects forge usage", () => {
      expect(api._clipboardUsingTheForge()).toBe(false);
      globalThis.ForgeVTT = {usingTheForge: true};
      expect(api._clipboardUsingTheForge()).toBe(true);
    });

    it("reads stored source, target, and bucket settings", () => {
      env.settingsValues.set("clipboard-image.image-location-source", "  s3 ");
      env.settingsValues.set("clipboard-image.image-location", "  custom/folder ");
      env.settingsValues.set("clipboard-image.image-location-bucket", "  bucket-name ");

      expect(api._clipboardGetStoredSource()).toBe("s3");
      expect(api._clipboardGetTargetFolder()).toBe("custom/folder");
      expect(api._clipboardGetStoredBucket()).toBe("bucket-name");
    });

    it("resolves source fallbacks", () => {
      expect(api._clipboardResolveSource(null)).toBe("data");
      globalThis.ForgeVTT = {usingTheForge: true};
      expect(api._clipboardResolveSource("auto")).toBe("forgevtt");
      globalThis.ForgeVTT = undefined;
      expect(api._clipboardResolveSource("forgevtt")).toBe("data");
      expect(api._clipboardResolveSource("s3")).toBe("s3");
    });

    it("returns source labels and choices", () => {
      expect(api._clipboardGetSourceLabel("auto")).toBe("Automatic");
      expect(api._clipboardGetSourceLabel("data")).toBe("User Data");
      expect(api._clipboardGetSourceLabel("s3")).toBe("Amazon S3");
      expect(api._clipboardGetSourceLabel("forgevtt")).toBe("The Forge");
      expect(api._clipboardGetSourceLabel("custom")).toBe("custom");

      expect(api._clipboardGetSourceChoices("custom").custom).toBe("Custom (custom)");
      globalThis.ForgeVTT = {usingTheForge: true};
      expect(api._clipboardGetSourceChoices("auto").forgevtt).toBe("The Forge");
    });

    it("rejects public file sources", () => {
      expect(api._clipboardCanSelectSource("data")).toBe(true);
      expect(api._clipboardCanSelectSource("public")).toBe(false);
    });

    it("builds upload destinations and picker options", () => {
      const destination = api._clipboardGetUploadDestination({
        storedSource: "s3",
        target: "nested/folder",
        bucket: "bucket-a",
      });

      expect(destination).toEqual({
        storedSource: "s3",
        source: "s3",
        target: "nested/folder",
        bucket: "bucket-a",
      });
      expect(api._clipboardGetFilePickerOptions(destination)).toEqual({bucket: "bucket-a"});
    });

    it("describes upload destinations", () => {
      expect(api._clipboardDescribeDestination({
        storedSource: "auto",
        source: "data",
        target: "folder",
        bucket: "",
      })).toBe("Automatic (User Data) / folder");

      expect(api._clipboardDescribeDestination({
        storedSource: "s3",
        source: "s3",
        target: "folder",
        bucket: "",
      })).toBe("Amazon S3 / (select a bucket) / folder");

      expect(api._clipboardDescribeDestination({
        storedSource: "data",
        source: "data",
        target: "folder",
        bucket: "",
      })).toBe("User Data / folder");
    });
  });

  describe("_clipboardCreateFolderIfMissing", () => {
    it("returns when the target folder already exists", async () => {
      env.MockFilePicker.browse.mockResolvedValueOnce({});
      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "folder",
        bucket: "",
      })).resolves.toBeUndefined();
    });

    it("creates nested segments when browse fails", async () => {
      env.MockFilePicker.browse
        .mockRejectedValueOnce(new Error("missing"))
        .mockRejectedValueOnce(new Error("missing"))
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("missing"));
      env.MockFilePicker.createDirectory
        .mockRejectedValueOnce(new Error("already exists"))
        .mockResolvedValueOnce({});

      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "alpha/beta",
        bucket: "",
      })).resolves.toBeUndefined();
    });

    it("rethrows create-directory errors that are not already-exists", async () => {
      env.MockFilePicker.createDirectory.mockRejectedValueOnce(new Error("nope"));
      env.MockFilePicker.browse.mockRejectedValueOnce(new Error("missing")).mockRejectedValueOnce(new Error("missing"));

      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "fail/path",
        bucket: "",
      })).rejects.toThrow("nope");
    });
  });

  describe("_clipboardAssertUploadDestination", () => {
    it("throws when s3 is missing a bucket", () => {
      expect(() => api._clipboardAssertUploadDestination({source: "s3", bucket: ""})).toThrow("bucket");
    });

    it("allows non-s3 destinations without a bucket", () => {
      expect(() => api._clipboardAssertUploadDestination({source: "data", bucket: ""})).not.toThrow();
    });
  });
});
