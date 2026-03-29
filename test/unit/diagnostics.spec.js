import {beforeEach, describe, expect, it, vi} from "vitest";

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

    it("returns false when reading the setting throws", () => {
      env.settingsRegistry.set("clipboard-image.verbose-logging", {});
      globalThis.game.settings.get.mockImplementationOnce(() => {
        throw new Error("settings failure");
      });

      expect(api._clipboardVerboseLoggingEnabled()).toBe(false);
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
        requestedCount: 2,
        blocked: false,
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
      expect(api._clipboardGetLogHistory()).toEqual([
        expect.objectContaining({
          level: "info",
          message: "hidden info",
        }),
      ]);
    });

    it("always emits warn and error logs", () => {
      api._clipboardLog("warn", "warn");
      api._clipboardLog("error", "error", {ok: false});
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("sanitizes complex log payloads for report output", () => {
      const circular = {};
      circular.self = circular;

      api._clipboardLog("error", "complex", {
        count: 1n,
        handler() {},
        blob: new Blob(["x"], {type: "text/plain"}),
        url: new URL("https://example.com/path"),
        circular,
        deep: {
          one: {
            two: {
              three: {
                four: true,
              },
            },
          },
        },
      });

      expect(api._clipboardGetLogHistory().at(-1)).toMatchObject({
        details: {
          count: "1",
          handler: "[Function handler]",
          blob: {type: "text/plain", size: 1},
          url: "https://example.com/path",
          circular: {self: "[Circular]"},
          deep: {
            one: {
              two: "[MaxDepth]",
            },
          },
        },
      });
    });

    it("keeps only the most recent bounded log history", () => {
      for (let index = 0; index < 105; index += 1) {
        api._clipboardLog("warn", `entry-${index}`);
      }

      expect(api._clipboardGetLogHistory()).toHaveLength(100);
      expect(api._clipboardGetLogHistory()[0]).toMatchObject({message: "entry-5"});
      expect(api._clipboardGetLogHistory().at(-1)).toMatchObject({message: "entry-104"});
    });
  });

  describe("error reporting", () => {
    it("builds formatted error reports with recent log history", () => {
      api._clipboardLog("warn", "warn before error", {ok: true});
      const report = api._clipboardBuildErrorReport(new Error("boom"), {
        operation: "unit-test",
        details: {
          nested: {
            value: 1,
          },
        },
      });

      expect(report).toMatchObject({
        operation: "unit-test",
        summary: "boom",
        user: {
          id: "user-1",
          name: "Gamemaster",
        },
      });
      expect(report.logs.at(-1)).toMatchObject({
        level: "warn",
        message: "warn before error",
      });
      expect(api._clipboardFormatErrorReport(report)).toContain("Clipboard Image Error Report");
      expect(api._clipboardFormatErrorReport(report)).toContain("\"nested\"");
    });

    it("reports errors locally to GMs with a logfile link", () => {
      const report = api._clipboardReportError(new Error("gm failed"), {
        operation: "gm-test",
        details: {foo: "bar"},
      });

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: gm failed");
      expect(env.dialogInstances).toHaveLength(1);
      expect(env.dialogInstances[0].data.content).toContain("Download module logfile");
      expect(report.operation).toBe("gm-test");
      expect(globalThis.game.socket.emit).not.toHaveBeenCalled();
    });

    it("can suppress local gm notifications while still returning a report", () => {
      const report = api._clipboardReportError(new Error("silent gm"), {
        notifyLocal: false,
      });

      expect(report.summary).toBe("silent gm");
      expect(globalThis.ui.notifications.error).not.toHaveBeenCalled();
      expect(env.dialogInstances).toHaveLength(0);
    });

    it("relays player-side errors to GMs over the module socket", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      globalThis.game.user.name = "Player One";

      api._clipboardReportError(new Error("player failed"), {
        operation: "player-test",
      });

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: player failed");
      expect(globalThis.game.socket.emit).toHaveBeenCalledWith("module.clipboard-image", expect.objectContaining({
        type: "clipboard-error-report",
        report: expect.objectContaining({
          operation: "player-test",
          user: expect.objectContaining({
            name: "Player One",
            isGM: false,
          }),
        }),
      }));
      expect(env.dialogInstances).toHaveLength(0);
    });

    it("downloads a verbose logfile when verbose logging is enabled", () => {
      env.settingsRegistry.set("clipboard-image.verbose-logging", {});
      env.settingsValues.set("clipboard-image.verbose-logging", true);

      api._clipboardReportError(new Error("download me"));

      expect(globalThis.saveDataToFile).toHaveBeenCalledWith(
        expect.stringContaining("Clipboard Image Error Report"),
        "text/plain",
        expect.stringMatching(/^clipboard-image-error-/)
      );
    });

    it("creates report files even when object urls are unavailable", () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      globalThis.URL.createObjectURL = undefined;

      const file = api._clipboardCreateReportFile(api._clipboardBuildErrorReport(new Error("no object url")));

      expect(file).toMatchObject({
        filename: expect.stringMatching(/^clipboard-image-error-/),
        url: "",
      });
      globalThis.URL.createObjectURL = originalCreateObjectURL;
    });

    it("falls back to an anchor download when saveDataToFile is unavailable", () => {
      const report = api._clipboardBuildErrorReport(new Error("anchor download"));
      const createElement = document.createElement.bind(document);
      const click = vi.fn();
      globalThis.saveDataToFile = undefined;
      const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(tagName => {
        const element = createElement(tagName);
        if (tagName === "a") element.click = click;
        return element;
      });

      api._clipboardDownloadReportFile(report);

      expect(click).toHaveBeenCalled();
      createElementSpy.mockRestore();
    });

    it("handles relayed socket reports for GMs", () => {
      const handled = api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report: api._clipboardBuildErrorReport(new Error("remote boom"), {
          operation: "remote-test",
        }),
      });

      expect(handled).toBe(true);
      expect(env.dialogInstances).toHaveLength(1);
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: remote boom");
    });

    it("tolerates missing dialog support on GM clients", () => {
      globalThis.Dialog = undefined;

      expect(() => api._clipboardReportError(new Error("no dialog"))).not.toThrow();
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: no dialog");
      expect(env.dialogInstances).toHaveLength(0);
    });

    it("ignores invalid or non-gm socket reports", () => {
      expect(api._clipboardHandleSocketReport(null)).toBe(false);
      expect(api._clipboardHandleSocketReport({type: "other"})).toBe(false);
      expect(api._clipboardHandleSocketReport({type: "clipboard-error-report"})).toBe(false);

      globalThis.game.user.isGM = false;
      expect(api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report: api._clipboardBuildErrorReport(new Error("ignored")),
      })).toBe(false);
    });

    it("can build a generic report for non-Error failures", () => {
      const report = api._clipboardBuildErrorReport("plain failure");
      expect(report.summary).toBe("Failed to handle media input. Check the console.");
      expect(report.playerMessage).toBe("Clipboard Image: Failed to handle media input. Check the console.");
    });

    it("tolerates missing socket emit support for player relays", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      globalThis.game.socket.emit = undefined;

      expect(() => api._clipboardReportError(new Error("no socket"))).not.toThrow();
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("Clipboard Image: no socket");
    });

    it("registers the socket listener only when sockets are available", () => {
      api._clipboardRegisterErrorReporting();
      expect(globalThis.game.socket.on).toHaveBeenCalledWith("module.clipboard-image", api._clipboardHandleSocketReport);

      globalThis.game.socket.on = undefined;
      expect(() => api._clipboardRegisterErrorReporting()).not.toThrow();
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

    it("reads the configured s3-compatible endpoint from Foundry", () => {
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
      expect(api._clipboardGetConfiguredS3Endpoint()).toBe("https://r2.example.com");

      globalThis.game.data.files.s3.endpoint = {href: "https://cdn.example.com/base/"};
      expect(api._clipboardGetConfiguredS3Endpoint()).toBe("https://cdn.example.com/base/");

      globalThis.game.data.files.s3.endpoint = {url: "https://storage.example.com"};
      expect(api._clipboardGetConfiguredS3Endpoint()).toBe("https://storage.example.com");

      globalThis.game.data.files.s3.endpoint = "";
      expect(api._clipboardGetConfiguredS3Endpoint()).toBe("");

      globalThis.game.data.files.s3.endpoint = {host: "r2.example.com"};
      expect(api._clipboardGetConfiguredS3Endpoint()).toBe("[object Object]");
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
      expect(api._clipboardGetSourceLabel("s3")).toBe("S3-Compatible Storage");
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
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
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
        endpoint: "https://r2.example.com",
      });
      expect(api._clipboardGetFilePickerOptions(destination)).toEqual({bucket: "bucket-a"});

      expect(api._clipboardGetUploadDestination({
        storedSource: "data",
        target: "nested/folder",
        bucket: "ignored",
      })).toEqual({
        storedSource: "data",
        source: "data",
        target: "nested/folder",
        bucket: "",
        endpoint: "",
      });
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
        endpoint: "https://r2.example.com",
      })).toBe("S3-Compatible Storage / (select a bucket) / folder");

      expect(api._clipboardDescribeDestination({
        storedSource: "data",
        source: "data",
        target: "folder",
        bucket: "",
      })).toBe("User Data / folder");
    });

    it("includes the configured endpoint in destination logs", () => {
      expect(api._clipboardDescribeDestinationForLog({
        storedSource: "s3",
        source: "s3",
        target: "folder",
        bucket: "bucket-a",
        endpoint: "https://r2.example.com",
      })).toEqual({
        storedSource: "s3",
        source: "s3",
        target: "folder",
        bucket: "bucket-a",
        endpoint: "https://r2.example.com",
      });
    });
  });

  describe("_clipboardCreateFolderIfMissing", () => {
    it("skips directory creation for s3 destinations", async () => {
      await expect(api._clipboardCreateFolderIfMissing({
        source: "s3",
        target: "worlds/example/pasted_images",
        bucket: "foundry-store",
      })).resolves.toBeUndefined();

      expect(env.MockFilePicker.browse).not.toHaveBeenCalled();
      expect(env.MockFilePicker.createDirectory).not.toHaveBeenCalled();
    });

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
      expect(() => api._clipboardAssertUploadDestination({
        source: "s3",
        bucket: "",
        endpoint: "https://r2.example.com",
      })).toThrow("bucket");
    });

    it("allows non-s3 destinations without a bucket", () => {
      expect(() => api._clipboardAssertUploadDestination({source: "data", bucket: ""})).not.toThrow();
    });
  });
});
