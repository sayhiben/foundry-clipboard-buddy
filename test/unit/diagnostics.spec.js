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
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);
      expect(api._clipboardVerboseLoggingEnabled()).toBe(true);
    });

    it("returns false when reading the setting throws", () => {
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
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
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);
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
        contentSummary: "some content",
        attemptDescription: "Gamemaster attempted to paste some content",
        user: {
          id: "user-1",
          name: "Gamemaster",
        },
      });
      expect(report.logs.at(-1)).toMatchObject({
        level: "warn",
        message: "warn before error",
      });
      expect(api._clipboardFormatErrorReport(report)).toContain("Foundry Paste Eater Error Report");
      expect(api._clipboardFormatErrorReport(report)).toContain("\"nested\"");
    });

    it("reports errors locally to GMs with a logfile link", () => {
      const report = api._clipboardReportError(new Error("gm failed"), {
        operation: "gm-test",
        details: {foo: "bar"},
      });

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: gm failed"
      );
      expect(env.dialogInstances).toHaveLength(1);
      expect(env.dialogInstances[0].data.content).toContain("Download module logfile");
      expect(env.dialogInstances[0].data.content).toContain("GM guidance:");
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

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Player One attempted to paste some content but encountered an error: player failed"
      );
      expect(globalThis.game.socket.emit).toHaveBeenCalledWith("module.foundry-paste-eater", expect.objectContaining({
        type: "clipboard-error-report",
        report: expect.objectContaining({
          operation: "player-test",
          attemptDescription: "Player One attempted to paste some content",
          user: expect.objectContaining({
            name: "Player One",
            isGM: false,
          }),
        }),
      }));
      expect(env.dialogInstances).toHaveLength(0);
    });

    it("downloads a verbose logfile when verbose logging is enabled", () => {
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);

      api._clipboardReportError(new Error("download me"));

      expect(globalThis.saveDataToFile).toHaveBeenCalledWith(
        expect.stringContaining("Foundry Paste Eater Error Report"),
        "text/plain",
        expect.stringMatching(/^foundry-paste-eater-error-/)
      );
    });

    it("can disable automatic logfile downloads even when verbose logging is enabled", () => {
      env.settingsRegistry.set("foundry-paste-eater.verbose-logging", {});
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);

      api._clipboardReportError(new Error("do not download"), {
        autoDownload: false,
      });

      expect(globalThis.saveDataToFile).not.toHaveBeenCalled();
    });

    it("creates report files even when object urls are unavailable", () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      globalThis.URL.createObjectURL = undefined;

      const file = api._clipboardCreateReportFile(api._clipboardBuildErrorReport(new Error("no object url")));

      expect(file).toMatchObject({
        filename: expect.stringMatching(/^foundry-paste-eater-error-/),
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

    it("returns a report file without attempting a download when no download path is available", () => {
      const report = api._clipboardBuildErrorReport(new Error("no download path"));
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      const createElementSpy = vi.spyOn(document, "createElement");
      globalThis.saveDataToFile = undefined;
      globalThis.URL.createObjectURL = undefined;

      const file = api._clipboardDownloadReportFile(report);

      expect(file).toMatchObject({
        filename: expect.stringMatching(/^foundry-paste-eater-error-/),
        url: "",
      });
      expect(createElementSpy).not.toHaveBeenCalled();
      globalThis.URL.createObjectURL = originalCreateObjectURL;
      createElementSpy.mockRestore();
    });

    it("omits the gm logfile link when object urls are unavailable", () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      globalThis.URL.createObjectURL = undefined;

      api._clipboardReportError(new Error("no dialog link"));

      expect(env.dialogInstances[0].data.content).not.toContain("Download module logfile");
      globalThis.URL.createObjectURL = originalCreateObjectURL;
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
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: remote boom"
      );
    });

    it("registers the socket error handler only once per page", () => {
      api._clipboardRegisterErrorReporting();
      api._clipboardRegisterErrorReporting();

      expect(globalThis.game.socket.on).toHaveBeenCalledTimes(1);
      expect(globalThis.game.socket.on).toHaveBeenCalledWith(
        "module.foundry-paste-eater",
        api._clipboardHandleSocketReport
      );
      expect(globalThis.game.socket.__clipboardRegisteredChannels).toBeInstanceOf(Set);
      expect(globalThis.game.socket.__clipboardRegisteredChannels.has("module.foundry-paste-eater")).toBe(true);
    });

    it("falls back to broadcast messages for relayed gm notifications", () => {
      const report = api._clipboardBuildErrorReport(new Error("remote boom"));
      report.playerMessage = "";
      report.broadcastMessage = "Player One attempted to paste an image but encountered an error: remote boom";

      expect(api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report,
      })).toBe(true);

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(report.broadcastMessage);
    });

    it("falls back to summaries for relayed gm notifications when no other copy is available", () => {
      const report = api._clipboardBuildErrorReport(new Error("remote boom"));
      report.playerMessage = "";
      report.broadcastMessage = "";

      expect(api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report,
      })).toBe(true);

      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith("remote boom");
    });

    it("fills sparse relayed gm reports with default dialog copy", () => {
      expect(api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report: {
          id: "report-1",
          timestamp: new Date().toISOString(),
          summary: "remote boom",
          playerMessage: "",
          broadcastMessage: "",
          user: {},
          world: {},
          browser: {},
          logs: [],
        },
      })).toBe(true);

      expect(env.dialogInstances[0].data.title).toBe("Foundry Paste Eater Error");
      expect(env.dialogInstances[0].data.content).toContain("Unknown User");
      expect(env.dialogInstances[0].data.content).toContain("remote boom");
      expect(env.dialogInstances[0].data.content).toContain("Review the attached logfile for full details.");
    });

    it("can relay gm dialogs without a logfile link when object urls are unavailable", () => {
      const originalCreateObjectURL = globalThis.URL.createObjectURL;
      globalThis.URL.createObjectURL = undefined;

      const handled = api._clipboardHandleSocketReport({
        type: "clipboard-error-report",
        report: api._clipboardBuildErrorReport(new Error("socket boom")),
      });

      expect(handled).toBe(true);
      expect(env.dialogInstances[0].data.content).toContain("Another user encountered a Foundry Paste Eater error.");
      expect(env.dialogInstances[0].data.content).not.toContain("Download module logfile");
      globalThis.URL.createObjectURL = originalCreateObjectURL;
    });

    it("tolerates missing dialog support on GM clients", () => {
      globalThis.Dialog = undefined;

      expect(() => api._clipboardReportError(new Error("no dialog"))).not.toThrow();
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: no dialog"
      );
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
      expect(report.playerMessage).toBe(
        "Gamemaster attempted to paste some content but encountered an error: Failed to handle media input. Check the console."
      );
    });

    it("tolerates missing socket emit support for player relays", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      globalThis.game.socket.emit = undefined;

      expect(() => api._clipboardReportError(new Error("no socket"))).not.toThrow();
      expect(globalThis.ui.notifications.error).toHaveBeenCalledWith(
        "Gamemaster attempted to paste some content but encountered an error: no socket"
      );
    });

    it("can relay player errors without showing a local toast", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      globalThis.game.user.name = "Player One";

      api._clipboardReportError(new Error("relay only"), {
        notifyLocal: false,
      });

      expect(globalThis.ui.notifications.error).not.toHaveBeenCalled();
      expect(globalThis.game.socket.emit).toHaveBeenCalledWith("module.foundry-paste-eater", expect.objectContaining({
        type: "clipboard-error-report",
      }));
    });

    it("does not emit socket relays for gm-local errors", () => {
      api._clipboardReportError(new Error("gm emit skip"));
      expect(globalThis.game.socket.emit).not.toHaveBeenCalled();
    });

    it("returns a report and skips relays when socket support is unavailable", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      globalThis.game.socket.emit = undefined;
      const report = api._clipboardReportError(new Error("no emit"), {
        notifyLocal: false,
      });

      expect(report.summary).toBe("no emit");
      expect(globalThis.ui.notifications.error).not.toHaveBeenCalled();
    });

    it("uses content summaries and explicit resolutions when available", () => {
      const error = new Error("permission denied");
      error.clipboardContentSummary = "an image";
      error.clipboardResolution = "A GM can fix this in Foundry's core settings.";

      const report = api._clipboardBuildErrorReport(error);
      expect(report.playerMessage).toBe(
        "Gamemaster attempted to paste an image but encountered an error: permission denied A GM can fix this in Foundry's core settings."
      );
      expect(report.gmMessage).toBe(
        "Gamemaster attempted to paste an image. A GM can fix this in Foundry's core settings."
      );
    });

    it("allows report copy overrides to replace the default player and gm guidance", () => {
      const report = api._clipboardBuildErrorReport(new Error("permission denied"), {
        contentSummary: "a video",
        resolution: "Ask a GM to review storage access.",
        playerMessage: "Custom player copy",
        gmMessage: "Custom gm copy",
      });

      expect(report.broadcastMessage).toBe(
        "Gamemaster attempted to paste a video but encountered an error: permission denied"
      );
      expect(report.playerMessage).toBe("Custom player copy");
      expect(report.gmMessage).toBe("Custom gm copy");
      expect(report.resolution).toBe("Ask a GM to review storage access.");
    });

    it("registers the socket listener only when sockets are available", () => {
      api._clipboardRegisterErrorReporting();
      expect(globalThis.game.socket.on).toHaveBeenCalledWith("module.foundry-paste-eater", api._clipboardHandleSocketReport);

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
      env.settingsValues.set("foundry-paste-eater.image-location-source", "  s3 ");
      env.settingsValues.set("foundry-paste-eater.image-location", "  custom/folder ");
      env.settingsValues.set("foundry-paste-eater.image-location-bucket", "  bucket-name ");

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
      env.settingsValues.set("foundry-paste-eater.upload-path-organization", "flat");
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

    it("can organize upload destinations by context, user, and month", () => {
      const destination = api._clipboardGetUploadDestination({
        storedSource: "data",
        target: "nested/folder",
        uploadContext: "document-art",
        organizationMode: "context-user-month",
        userId: "player-2",
        date: new Date("2026-04-01T10:00:00Z"),
      });

      expect(destination).toEqual({
        storedSource: "data",
        source: "data",
        target: "nested/folder/document-art/player-2/2026-04",
        bucket: "",
        endpoint: "",
      });
    });

    it("normalizes organized upload path helpers", () => {
      expect(api._clipboardGetUploadContextSegment("chat")).toBe("chat");
      expect(api._clipboardGetUploadContextSegment("document-art")).toBe("document-art");
      expect(api._clipboardGetUploadContextSegment("audio")).toBe("audio");
      expect(api._clipboardGetUploadContextSegment("weird")).toBe("canvas");
      expect(api._clipboardNormalizeUploadPathSegment("\\nested//folder\\", "fallback")).toBe("nested/folder");
      expect(api._clipboardNormalizeUploadPathSegment("", "fallback")).toBe("fallback");
      expect(api._clipboardBuildOrganizedUploadTarget("base", {
        organizationMode: "context-user-month",
        uploadContext: "chat",
        userId: "user/with/slash",
        date: "bad-date",
      })).toMatch(/^base\/chat\/user\/with\/slash\/\d{4}-\d{2}$/);
    });

    it("inspects core file permissions when building storage guidance", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: [4],
        FILES_UPLOAD: [4],
      });

      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.PLAYER);
      expect(api._clipboardGetCorePermissionRoles("FILES_UPLOAD")).toEqual([4]);
      expect(api._clipboardUserHasCorePermission("FILES_UPLOAD")).toBe(false);
      expect(api._clipboardHasCoreFileUploadPermissions()).toBe(false);
      expect(api._clipboardBuildStoragePermissionDestinationLabel({
        source: "s3",
        bucket: "bucket-a",
      })).toBe("the active S3-Compatible Storage destination (bucket-a)");
    });

    it("covers storage-permission helper fallbacks and assertions", () => {
      expect(api._clipboardIsStoragePermissionError("AccessDenied from backend")).toBe(true);
      expect(api._clipboardIsStoragePermissionError("transport failed")).toBe(false);

      globalThis.game.user.isGM = true;
      globalThis.game.user.role = undefined;
      expect(api._clipboardUserHasCorePermission("FILES_UPLOAD")).toBe(true);

      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.TRUSTED;
      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: "invalid",
        FILES_UPLOAD: [2],
      });
      expect(api._clipboardGetCorePermissionRoles("FILES_BROWSE")).toEqual([]);
      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.TRUSTED);

      expect(api._clipboardBuildStoragePermissionDestinationLabel({
        source: "data",
        bucket: "",
      })).toBe("the active User Data destination");

      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: [2],
        FILES_UPLOAD: [2],
      });
      expect(api._clipboardBuildStoragePermissionResolution({
        source: "data",
        bucket: "",
      })).toContain("backend write access");

      const transportError = new Error("transport failed");
      expect(api._clipboardWrapStoragePermissionError(transportError, {
        source: "data",
        target: "folder",
        bucket: "",
      }, "upload pasted media")).toBe(transportError);

      expect(() => api._clipboardAssertUploadDestination({
        source: "data",
        bucket: "",
      })).not.toThrow();
      expect(() => api._clipboardAssertUploadDestination({
        source: "s3",
        bucket: "",
      })).toThrow("bucket selection");
    });

    it("falls back cleanly when game user or settings data is missing", () => {
      const originalGame = globalThis.game;
      globalThis.game = {};
      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.PLAYER);
      expect(api._clipboardGetCorePermissionRoles("FILES_UPLOAD")).toEqual([]);

      globalThis.game = {
        user: {isGM: true},
        settings: {},
      };
      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.GAMEMASTER);

      globalThis.game = originalGame;
      expect(api._clipboardBuildStoragePermissionDestinationLabel({
        source: "s3",
        bucket: "",
      })).toBe("the active S3-Compatible Storage destination");
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

    it("resolves image-input blobs directly from blob and url payloads", async () => {
      const directBlob = new Blob(["x"], {type: "image/png"});
      expect(await api._clipboardResolveImageInputBlob({blob: directBlob})).toBe(directBlob);

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "image/png",
        },
        blob: async () => new Blob(["x"], {type: ""}),
      });
      await expect(api._clipboardResolveImageInputBlob({url: "https://example.com/file.png"})).resolves.toBeInstanceOf(File);
      await expect(api._clipboardResolveImageInputBlob(null)).resolves.toBeNull();
    });
  });

  describe("_clipboardCreateFolderIfMissing", () => {
    it("rethrows missing-bucket validation instead of falling through to directory creation", async () => {
      await expect(api._clipboardCreateFolderIfMissing({
        source: "s3",
        target: "worlds/example/pasted_images",
        bucket: "",
        endpoint: "https://r2.example.com",
      })).rejects.toMatchObject({
        clipboardSummary: "S3-compatible destinations require a bucket selection.",
      });

      expect(env.MockFilePicker.browse).not.toHaveBeenCalled();
      expect(env.MockFilePicker.createDirectory).not.toHaveBeenCalled();
    });

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

    it("normalizes odd slash patterns while creating only missing directory segments", async () => {
      env.MockFilePicker.browse
        .mockRejectedValueOnce(new Error("missing"))
        .mockRejectedValueOnce(new Error("missing"))
        .mockResolvedValueOnce({});
      env.MockFilePicker.createDirectory.mockResolvedValueOnce({});

      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "/alpha//beta/",
        bucket: "",
      })).resolves.toBeUndefined();

      expect(env.MockFilePicker.browse.mock.calls).toEqual([
        ["data", "/alpha//beta/", {}],
        ["data", "alpha", {}],
        ["data", "alpha/beta", {}],
      ]);
      expect(env.MockFilePicker.createDirectory).toHaveBeenCalledWith("data", "alpha", {});
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

    it("wraps upload-folder permission errors with exact Foundry permission guidance when the player lacks file permissions", async () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: [4],
        FILES_UPLOAD: [4],
      });
      env.MockFilePicker.browse.mockRejectedValueOnce(new Error("You do not have permission to browse this location"));

      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "fail/path",
        bucket: "",
      })).rejects.toMatchObject({
        clipboardSummary: "Foundry denied permission to create or access the upload folder in the active storage destination.",
        clipboardResolution: expect.stringContaining("Game Settings -> Configure Permissions"),
      });
    });

    it("falls back to backend write guidance when core file permissions are already present", async () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: [1, 2, 3, 4],
        FILES_UPLOAD: [1, 2, 3, 4],
      });
      env.MockFilePicker.browse
        .mockRejectedValueOnce(new Error("missing"))
        .mockRejectedValueOnce(new Error("missing"));
      env.MockFilePicker.createDirectory.mockRejectedValueOnce(new Error("permission denied"));

      await expect(api._clipboardCreateFolderIfMissing({
        source: "data",
        target: "fail/path",
        bucket: "",
      })).rejects.toMatchObject({
        clipboardSummary: "Foundry denied permission to create or access the upload folder in the active storage destination.",
        clipboardResolution: expect.stringContaining("backend write access"),
      });
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
