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
      expect(api._clipboardCanUseCanvasText()).toBe(true);
      expect(api._clipboardCanUseChatMedia()).toBe(true);
    });

    it("blocks users below the configured minimum role", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("clipboard-image.minimum-role-canvas-media", "ASSISTANT");
      env.settingsValues.set("clipboard-image.minimum-role-canvas-text", "TRUSTED");
      env.settingsValues.set("clipboard-image.minimum-role-chat-media", "TRUSTED");

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
      env.settingsValues.set("clipboard-image.minimum-role-canvas-media", "   ");
      expect(api._clipboardGetConfiguredMinimumRole("minimum-role-canvas-media")).toBe("PLAYER");
    });
  });

  describe("feature toggles", () => {
    it("disables chat media and the chat upload button independently", () => {
      env.settingsValues.set("clipboard-image.enable-chat-media", false);
      expect(api._clipboardCanUseChatMedia()).toBe(false);
      expect(api._clipboardCanUseChatUploadButton()).toBe(false);

      env.settingsValues.set("clipboard-image.enable-chat-media", true);
      env.settingsValues.set("clipboard-image.enable-chat-upload-button", false);
      expect(api._clipboardCanUseChatMedia()).toBe(true);
      expect(api._clipboardCanUseChatUploadButton()).toBe(false);
    });

    it("gates scene controls behind gm policy and media permissions", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("clipboard-image.allow-non-gm-scene-controls", false);
      expect(api._clipboardCanUseSceneControls()).toBe(false);

      env.settingsValues.set("clipboard-image.allow-non-gm-scene-controls", true);
      expect(api._clipboardCanUseSceneControls()).toBe(true);

      env.settingsValues.set("clipboard-image.minimum-role-canvas-media", "ASSISTANT");
      expect(api._clipboardCanUseSceneControls()).toBe(false);
    });

    it("respects token and tile create/replace toggles", () => {
      env.settingsValues.set("clipboard-image.enable-token-creation", false);
      env.settingsValues.set("clipboard-image.enable-tile-replacement", false);

      expect(api._clipboardCanCreateTokens()).toBe(false);
      expect(api._clipboardCanCreateTiles()).toBe(true);
      expect(api._clipboardCanReplaceTokens()).toBe(true);
      expect(api._clipboardCanReplaceTiles()).toBe(false);
    });
  });

  describe("behavior settings", () => {
    it("reads behavior defaults and alternate modes", () => {
      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("active-layer");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("thumbnail");
      expect(api._clipboardGetCanvasTextPasteMode()).toBe("scene-notes");
      expect(api._clipboardGetScenePastePromptMode()).toBe("auto");
      expect(api._clipboardShouldCreateBackingActors()).toBe(true);

      env.settingsValues.set("clipboard-image.default-empty-canvas-target", "token");
      env.settingsValues.set("clipboard-image.chat-media-display", "link-only");
      env.settingsValues.set("clipboard-image.canvas-text-paste-mode", "disabled");
      env.settingsValues.set("clipboard-image.scene-paste-prompt-mode", "always");
      env.settingsValues.set("clipboard-image.create-backing-actors", false);

      expect(api._clipboardGetDefaultEmptyCanvasTarget()).toBe("token");
      expect(api._clipboardGetChatMediaDisplayMode()).toBe("link-only");
      expect(api._clipboardGetCanvasTextPasteMode()).toBe("disabled");
      expect(api._clipboardGetScenePastePromptMode()).toBe("always");
      expect(api._clipboardShouldCreateBackingActors()).toBe(false);
    });
  });
});
