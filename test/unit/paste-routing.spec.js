import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("paste routing decision helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("_clipboardResolveScenePasteToolPlan", () => {
    it.each([
      {
        name: "disables the scene paste tool cleanly",
        input: {canUseScenePasteTool: false, promptMode: "auto"},
        expected: {
          action: "disabled",
          openPrompt: false,
          tryDirectReadInPrompt: false,
          useDirectSceneAction: false,
        },
      },
      {
        name: "uses prompt and direct read in auto mode",
        input: {canUseScenePasteTool: true, promptMode: "auto"},
        expected: {
          action: "prompt-then-direct-read",
          openPrompt: true,
          tryDirectReadInPrompt: true,
          useDirectSceneAction: false,
        },
      },
      {
        name: "uses only the prompt in always mode",
        input: {canUseScenePasteTool: true, promptMode: "always"},
        expected: {
          action: "prompt-only",
          openPrompt: true,
          tryDirectReadInPrompt: false,
          useDirectSceneAction: false,
        },
      },
      {
        name: "uses only the direct scene action in never mode",
        input: {canUseScenePasteTool: true, promptMode: "never"},
        expected: {
          action: "direct-read-only",
          openPrompt: false,
          tryDirectReadInPrompt: false,
          useDirectSceneAction: true,
        },
      },
      {
        name: "treats unknown modes like auto for test safety",
        input: {canUseScenePasteTool: true, promptMode: "weird"},
        expected: {
          action: "prompt-then-direct-read",
          openPrompt: true,
          tryDirectReadInPrompt: true,
          useDirectSceneAction: false,
        },
      },
    ])("$name", ({input, expected}) => {
      expect(api._clipboardResolveScenePasteToolPlan(input)).toEqual(expected);
    });
  });

  describe("_clipboardResolveNativePasteRoute", () => {
    it.each([
      {
        name: "prefers focused art fields over all other media routes",
        input: {
          hasMediaInput: true,
          hasArtFieldTarget: true,
          isChatTarget: true,
          isEditableTarget: true,
          canUseChatMedia: false,
          canvasContextEligible: false,
        },
        expected: "art-field-media",
      },
      {
        name: "routes media into chat when chat is focused and enabled",
        input: {
          hasMediaInput: true,
          isChatTarget: true,
          canUseChatMedia: true,
          canvasContextEligible: true,
        },
        expected: "chat-media",
      },
      {
        name: "leaves media alone when chat is focused but chat media is disabled",
        input: {
          hasMediaInput: true,
          isChatTarget: true,
          canUseChatMedia: false,
          canvasContextEligible: true,
        },
        expected: "ignore-chat-media-disabled",
      },
      {
        name: "ignores media in unsupported editable targets",
        input: {
          hasMediaInput: true,
          isEditableTarget: true,
          canvasContextEligible: true,
        },
        expected: "ignore-editable-media",
      },
      {
        name: "routes media to the canvas when no higher-priority target exists",
        input: {
          hasMediaInput: true,
          canvasContextEligible: true,
        },
        expected: "canvas-media",
      },
      {
        name: "does not route media to canvas when the context is ineligible",
        input: {
          hasMediaInput: true,
          canvasContextEligible: false,
        },
        expected: "ignore-media-ineligible",
      },
      {
        name: "prefers media routing when both media and text are present",
        input: {
          hasMediaInput: true,
          hasTextInput: true,
          canvasContextEligible: true,
        },
        expected: "canvas-media",
      },
      {
        name: "leaves chat text alone",
        input: {
          hasTextInput: true,
          isChatTarget: true,
          canvasContextEligible: true,
        },
        expected: "ignore-chat-text",
      },
      {
        name: "leaves editable text alone",
        input: {
          hasTextInput: true,
          isEditableTarget: true,
          canvasContextEligible: true,
        },
        expected: "ignore-editable-text",
      },
      {
        name: "routes text to the canvas note workflow when eligible",
        input: {
          hasTextInput: true,
          canvasContextEligible: true,
        },
        expected: "canvas-text",
      },
      {
        name: "does not route text to canvas when the context is ineligible",
        input: {
          hasTextInput: true,
          canvasContextEligible: false,
        },
        expected: "ignore-text-ineligible",
      },
      {
        name: "ignores empty payloads",
        input: {},
        expected: "ignore-empty",
      },
    ])("$name", ({input, expected}) => {
      expect(api._clipboardResolveNativePasteRoute(input)).toEqual({route: expected});
    });
  });
});
