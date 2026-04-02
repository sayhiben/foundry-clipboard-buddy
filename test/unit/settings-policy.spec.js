import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("settings and permission helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("role helpers", () => {
    it("defaults minimum-role helpers to player access", () => {
      expect(api._clipboardUserMeetsMinimumRole("minimum-role-canvas-media")).toBe(true);
      expect(api._clipboardCanUseCanvasMedia()).toBe(true);
      expect(api._clipboardCanUseCanvasText()).toBe(false);
      expect(api._clipboardCanUseChatMedia()).toBe(true);
    });

    it("blocks users below the configured minimum role", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "ASSISTANT");
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-text", "TRUSTED");
      env.settingsValues.set("foundry-paste-eater.minimum-role-chat-media", "TRUSTED");

      expect(api._clipboardCanUseCanvasMedia()).toBe(false);
      expect(api._clipboardCanUseCanvasText()).toBe(false);
      expect(api._clipboardCanUseChatMedia()).toBe(false);
    });

    it("falls back to derived player and gm roles when no numeric user role is present", () => {
      delete globalThis.game.user.role;
      globalThis.game.user.isGM = false;
      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.PLAYER);

      globalThis.game.user.isGM = true;
      expect(api._clipboardGetCurrentUserRole()).toBe(globalThis.CONST.USER_ROLES.GAMEMASTER);
    });

    it("falls back to player minimum-role defaults when a setting is blank", () => {
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "   ");
      expect(api._clipboardGetConfiguredMinimumRole("minimum-role-canvas-media")).toBe("PLAYER");
    });

    it("allows users who exactly meet the configured minimum role", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.TRUSTED;
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "TRUSTED");
      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-text", "TRUSTED");
      env.settingsValues.set("foundry-paste-eater.minimum-role-chat-media", "TRUSTED");
      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "scene-notes");

      expect(api._clipboardCanUseCanvasMedia()).toBe(true);
      expect(api._clipboardCanUseCanvasText()).toBe(true);
      expect(api._clipboardCanUseChatMedia()).toBe(true);
    });
  });

  describe("feature toggles", () => {
    it("disables chat media and the chat upload button independently", () => {
      env.settingsValues.set("foundry-paste-eater.enable-chat-media", false);
      expect(api._clipboardCanUseChatMedia()).toBe(false);
      expect(api._clipboardCanUseChatUploadButton()).toBe(false);

      env.settingsValues.set("foundry-paste-eater.enable-chat-media", true);
      env.settingsValues.set("foundry-paste-eater.enable-chat-upload-button", false);
      expect(api._clipboardCanUseChatMedia()).toBe(true);
      expect(api._clipboardCanUseChatUploadButton()).toBe(false);
    });

    it("gates scene controls behind gm policy and media permissions", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", false);
      expect(api._clipboardCanUseSceneControls()).toBe(false);

      env.settingsValues.set("foundry-paste-eater.allow-non-gm-scene-controls", true);
      expect(api._clipboardCanUseSceneControls()).toBe(true);

      env.settingsValues.set("foundry-paste-eater.minimum-role-canvas-media", "ASSISTANT");
      expect(api._clipboardCanUseSceneControls()).toBe(false);
    });

    it("respects token and tile create/replace toggles", () => {
      env.settingsValues.set("foundry-paste-eater.enable-token-creation", false);
      env.settingsValues.set("foundry-paste-eater.enable-tile-replacement", false);
      env.settingsValues.set("foundry-paste-eater.enable-scene-paste-tool", false);
      env.settingsValues.set("foundry-paste-eater.enable-scene-upload-tool", false);

      expect(api._clipboardCanCreateTokens()).toBe(false);
      expect(api._clipboardCanCreateTiles()).toBe(true);
      expect(api._clipboardCanReplaceTokens()).toBe(true);
      expect(api._clipboardCanReplaceTiles()).toBe(false);
      expect(api._clipboardCanUseScenePasteTool()).toBe(false);
      expect(api._clipboardCanUseSceneUploadTool()).toBe(false);
    });
  });

  describe("legacy migration", () => {
    it("falls back to legacy stored settings when the new namespace has not been persisted yet", () => {
      env.worldStorage.set("clipboard-image.enable-token-creation", {
        key: "clipboard-image.enable-token-creation",
        value: false,
      });

      expect(api._clipboardGetSetting("enable-token-creation")).toBe(false);
      expect(api._clipboardCanCreateTokens()).toBe(false);
    });

    it("migrates legacy stored settings into the new namespace", async () => {
      api._clipboardRegisterSettings();
      env.worldStorage.set("clipboard-image.enable-token-creation", {
        key: "clipboard-image.enable-token-creation",
        value: false,
      });
      env.clientStorage.set("clipboard-image.verbose-logging", {
        key: "clipboard-image.verbose-logging",
        value: true,
      });

      await expect(api._clipboardMigrateLegacySettings()).resolves.toEqual(expect.arrayContaining([
        "enable-token-creation",
        "verbose-logging",
      ]));
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "enable-token-creation", false);
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("foundry-paste-eater", "verbose-logging", true);
      expect(env.settingsValues.get("foundry-paste-eater.enable-token-creation")).toBe(false);
      expect(env.settingsValues.get("foundry-paste-eater.verbose-logging")).toBe(true);
    });

    it("does not migrate world settings for non-gm users", async () => {
      api._clipboardRegisterSettings();
      globalThis.game.user.isGM = false;
      env.worldStorage.set("clipboard-image.enable-token-creation", {
        key: "clipboard-image.enable-token-creation",
        value: false,
      });

      await expect(api._clipboardMigrateLegacySettings()).resolves.toEqual([]);
      expect(globalThis.game.settings.set).not.toHaveBeenCalledWith("foundry-paste-eater", "enable-token-creation", false);
    });

    it("does not overwrite already-stored settings during migration", async () => {
      api._clipboardRegisterSettings();
      env.worldStorage.set("clipboard-image.enable-token-creation", {
        key: "clipboard-image.enable-token-creation",
        value: false,
      });
      env.worldStorage.set("foundry-paste-eater.enable-token-creation", {
        key: "foundry-paste-eater.enable-token-creation",
        value: true,
      });

      await expect(api._clipboardMigrateLegacySettings()).resolves.toEqual([]);
      expect(globalThis.game.settings.set).not.toHaveBeenCalledWith("foundry-paste-eater", "enable-token-creation", false);
    });
  });

  describe("behavior settings", () => {
    it("exposes shipped defaults and configurable world-default filters", () => {
      expect(api._clipboardGetShippedDefaultSettings()).toMatchObject({
        "image-location-source": "data",
        "default-empty-canvas-target": "tile",
        "canvas-text-paste-mode": "disabled",
        "selected-token-paste-mode": "prompt",
        "upload-path-organization": "context-user-month",
      });

      expect(api._clipboardGetShippedDefaultSettings({scope: "world", config: true})).toMatchObject({
        "allow-non-gm-scene-controls": true,
        "default-empty-canvas-target": "tile",
        "create-backing-actors": false,
        "canvas-text-paste-mode": "disabled",
        "selected-token-paste-mode": "prompt",
      });
      expect(api._clipboardGetShippedDefaultSettings({scope: "world", config: true})).not.toHaveProperty("image-location-source");
      expect(api._clipboardGetShippedDefaultSettings({scope: "world", config: true})).not.toHaveProperty("verbose-logging");
    });

    it("reports only configurable world settings that differ from shipped defaults", () => {
      api._clipboardRegisterSettings();
      env.settingsValues.set("foundry-paste-eater.image-location-source", "s3");
      env.settingsValues.set("foundry-paste-eater.verbose-logging", true);
      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "active-layer");
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "scene-only");

      expect(api._clipboardGetSettingsThatDifferFromDefaults()).toEqual([
        expect.objectContaining({
          key: "default-empty-canvas-target",
          currentValue: "active-layer",
          defaultValue: "tile",
          displayName: "Default empty-canvas paste target",
        }),
        expect.objectContaining({
          key: "selected-token-paste-mode",
          currentValue: "scene-only",
          defaultValue: "prompt",
          displayName: "Selected token image paste mode",
        }),
      ]);
    });

    it("formats setting values for recommended-default review copy", () => {
      api._clipboardRegisterSettings();

      expect(api._clipboardDescribeSettingValue("allow-non-gm-scene-controls", true)).toBe("Enabled");
      expect(api._clipboardDescribeSettingValue("selected-token-paste-mode", "prompt")).toBe("Ask each time");
      expect(api._clipboardDescribeSettingValue("image-location-bucket", "")).toBe("(empty)");
      expect(api._clipboardDescribeSettingValue("image-location", undefined)).toBe("(unset)");
    });

    it("reapplies only configurable world defaults that differ", async () => {
      api._clipboardRegisterSettings();
      await globalThis.game.settings.set("foundry-paste-eater", "image-location-source", "s3");
      await globalThis.game.settings.set("foundry-paste-eater", "verbose-logging", true);
      await globalThis.game.settings.set("foundry-paste-eater", "default-empty-canvas-target", "active-layer");
      await globalThis.game.settings.set("foundry-paste-eater", "selected-token-paste-mode", "scene-only");

      await expect(api._clipboardApplyShippedDefaults()).resolves.toEqual([
        "default-empty-canvas-target",
        "selected-token-paste-mode",
      ]);

      expect(env.settingsValues.get("foundry-paste-eater.default-empty-canvas-target")).toBe("tile");
      expect(env.settingsValues.get("foundry-paste-eater.selected-token-paste-mode")).toBe("prompt");
      expect(env.settingsValues.get("foundry-paste-eater.image-location-source")).toBe("s3");
      expect(env.settingsValues.get("foundry-paste-eater.verbose-logging")).toBe(true);
    });

    it("reads behavior defaults and alternate modes", () => {
      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("tile");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("thumbnail");
      expect(api._clipboardGetCanvasTextPasteMode()).toBe("disabled");
      expect(api._clipboardGetScenePastePromptMode()).toBe("auto");
      expect(api._clipboardGetSelectedTokenPasteMode()).toBe("prompt");
      expect(api._clipboardGetUploadPathOrganizationMode()).toBe("context-user-month");
      expect(api._clipboardShouldCreateBackingActors()).toBe(false);

      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "token");
      env.settingsValues.set("foundry-paste-eater.chat-media-display", "link-only");
      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "scene-notes");
      env.settingsValues.set("foundry-paste-eater.scene-paste-prompt-mode", "always");
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "actor-art");
      env.settingsValues.set("foundry-paste-eater.upload-path-organization", "flat");
      env.settingsValues.set("foundry-paste-eater.create-backing-actors", true);

      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("token");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("link-only");
      expect(api._clipboardGetCanvasTextPasteMode()).toBe("scene-notes");
      expect(api._clipboardGetScenePastePromptMode()).toBe("always");
      expect(api._clipboardGetSelectedTokenPasteMode()).toBe("actor-art");
      expect(api._clipboardGetUploadPathOrganizationMode()).toBe("flat");
      expect(api._clipboardShouldCreateBackingActors()).toBe(true);
    });

    it("accepts the remaining explicit behavior modes", () => {
      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "active-layer");
      env.settingsValues.set("foundry-paste-eater.chat-media-display", "full-preview");
      env.settingsValues.set("foundry-paste-eater.scene-paste-prompt-mode", "never");
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "scene-only");

      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("active-layer");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("full-preview");
      expect(api._clipboardGetScenePastePromptMode()).toBe("never");
      expect(api._clipboardGetSelectedTokenPasteMode()).toBe("scene-only");
    });

    it("falls back to safe defaults for unsupported behavior values", () => {
      env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "weird");
      env.settingsValues.set("foundry-paste-eater.chat-media-display", "weird");
      env.settingsValues.set("foundry-paste-eater.canvas-text-paste-mode", "weird");
      env.settingsValues.set("foundry-paste-eater.scene-paste-prompt-mode", "weird");
      env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "weird");
      env.settingsValues.set("foundry-paste-eater.upload-path-organization", "weird");

      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("tile");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("thumbnail");
      expect(api._clipboardGetCanvasTextPasteMode()).toBe("disabled");
      expect(api._clipboardGetScenePastePromptMode()).toBe("auto");
      expect(api._clipboardGetSelectedTokenPasteMode()).toBe("prompt");
      expect(api._clipboardGetUploadPathOrganizationMode()).toBe("context-user-month");
    });

    it("refreshes scene controls using the active layer name when no current control is cached", () => {
      globalThis.ui.controls.control = null;
      globalThis.canvas.activeLayer = globalThis.canvas.tokens;

      api._clipboardRefreshSceneControlsUi();

      expect(globalThis.ui.controls.initialize).toHaveBeenCalledWith({control: "tokens"});
      expect(globalThis.ui.controls.render).toHaveBeenCalledWith(true);
    });
  });
});
