import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import behaviorScenarios from "../shared/behavior-scenarios.js";

const {
  NATIVE_PASTE_ROUTE_SCENARIOS,
  SCENE_PASTE_TOOL_PLAN_SCENARIOS,
} = behaviorScenarios;

describe("paste routing decision helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("_clipboardResolveScenePasteToolPlan", () => {
    it.each(SCENE_PASTE_TOOL_PLAN_SCENARIOS)("$name", ({input, expected}) => {
      expect(api._clipboardResolveScenePasteToolPlan(input)).toEqual(expected);
    });
  });

  describe("_clipboardResolveNativePasteRoute", () => {
    it.each(NATIVE_PASTE_ROUTE_SCENARIOS)("$name", ({input, expected}) => {
      expect(api._clipboardResolveNativePasteRoute(input)).toEqual({route: expected});
    });
  });
});
