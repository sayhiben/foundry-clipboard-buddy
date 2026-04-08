import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import defaultsContract from "../shared/defaults-contract.js";

const {
  CONFIGURABLE_WORLD_DEFAULT_SETTINGS,
  SHIPPED_DEFAULT_SETTINGS,
  USER_VISIBLE_SETTING_LABELS,
} = defaultsContract;

describe("settings schema contract", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  it("matches the shared shipped defaults contract", () => {
    expect(api._clipboardGetShippedDefaultSettings()).toMatchObject(SHIPPED_DEFAULT_SETTINGS);
    expect(api.CLIPBOARD_IMAGE_SHIPPED_DEFAULTS).toBeDefined();
  });

  it("matches the shared configurable world defaults contract", () => {
    expect(api._clipboardGetShippedDefaultSettings({scope: "world", config: true})).toMatchObject(CONFIGURABLE_WORLD_DEFAULT_SETTINGS);
  });

  it("keeps recommended-default differences aligned with the shared labels", () => {
    api._clipboardRegisterSettings();
    env.settingsValues.set("foundry-paste-eater.default-empty-canvas-target", "token");
    env.settingsValues.set("foundry-paste-eater.selected-token-paste-mode", "scene-only");

    expect(api._clipboardGetSettingsThatDifferFromDefaults()).toEqual([
      expect.objectContaining({
        key: "default-empty-canvas-target",
        displayName: USER_VISIBLE_SETTING_LABELS["default-empty-canvas-target"],
      }),
      expect.objectContaining({
        key: "selected-token-paste-mode",
        displayName: USER_VISIBLE_SETTING_LABELS["selected-token-paste-mode"],
      }),
    ]);
  });
});
