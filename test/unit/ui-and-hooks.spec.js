import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";
import {createDataTransfer, flush, setInputClickBehavior, withMockImage} from "./spec-helpers.js";

describe("ui and hook integration helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("file chooser helpers", () => {
    it("resolves with a selected file", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardChooseImageFile()).resolves.toBeInstanceOf(File);
      restoreClick();
    });

    it("returns null when the picker closes without a selection", async () => {
      const restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("focus"));
      });

      await expect(api._clipboardChooseImageFile()).resolves.toBeNull();
      restoreClick();
    });

    it("delegates selected files to a custom media handler", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      const handler = vi.fn(async file => file.name);
      await expect(api._clipboardChooseAndHandleMediaFile({
        emptyMessage: "no file",
        selectedMessage: "selected",
        handler,
      })).resolves.toBe("picked.png");
      restoreClick();
    });

    it("returns false when the media chooser closes without a selection", async () => {
      const restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("focus"));
      });

      await expect(api._clipboardChooseAndHandleMediaFile({
        emptyMessage: "no file",
        selectedMessage: "selected",
        handler: vi.fn(),
      })).resolves.toBe(false);
      restoreClick();
    });
  });

  describe("scene and chat actions", () => {
    it("opens the scene upload picker", async () => {
      const restoreImage = withMockImage();
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardOpenUploadPicker()).resolves.toBe(true);
      restoreClick();
      restoreImage();
    });

    it("opens the chat upload picker", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      await expect(api._clipboardOpenChatUploadPicker()).resolves.toBe(true);
      restoreClick();
    });

    it("warns when direct scene paste is unavailable", () => {
      const originalClipboard = window.navigator.clipboard;
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {},
      });

      api._clipboardHandleScenePasteAction();
      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Clipboard Image: Direct clipboard reads are unavailable here. Use your browser's Paste action or the Upload Media tool instead."
      );
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });
    });

    it("runs the direct scene paste action", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      api._clipboardHandleScenePasteAction();
      await flush();
      restoreImage();
    });

    it("opens the scene paste prompt when direct reads cannot return media", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([{types: []}]);

      api._clipboardHandleScenePasteToolClick();
      await flush();

      const prompt = api._clipboardGetScenePastePrompt();
      expect(prompt).toBeTruthy();
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("not exposed to direct clipboard reads");
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("supports always-show prompt mode for the scene paste tool", async () => {
      env.settingsValues.set("clipboard-image.scene-paste-prompt-mode", "always");
      api._clipboardHandleScenePasteToolClick();
      await flush();

      expect(window.navigator.clipboard.read).not.toHaveBeenCalled();
      expect(api._clipboardGetScenePastePrompt()).toBeTruthy();
      api._clipboardCloseScenePastePrompt();
    });

    it("supports direct-read-only scene paste tool mode", async () => {
      env.settingsValues.set("clipboard-image.scene-paste-prompt-mode", "never");
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      expect(api._clipboardHandleScenePasteToolClick()).toBe(true);
      await flush();

      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("handles media pasted into the scene paste prompt", async () => {
      const restoreImage = withMockImage();
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#clipboard-image-scene-paste-target");
      const file = new File(["x"], "prompt.png", {type: "image/png"});
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalled();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("keeps the scene paste prompt open for unsupported pasted content", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#clipboard-image-scene-paste-target");
      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          data: {"text/plain": "not-media"},
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith(
        "Clipboard Image: No supported media was found in that paste."
      );
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("closes the scene paste prompt when paste handling returns false", async () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      const target = prompt.querySelector("#clipboard-image-scene-paste-target");
      const file = new File(["x"], "prompt.png", {type: "image/png"});
      api._clipboardSetRuntimeState({locked: true});

      const event = new Event("paste", {bubbles: true, cancelable: true});
      Object.defineProperty(event, "clipboardData", {
        configurable: true,
        value: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => file,
          }],
          files: [file],
        }),
      });

      target.dispatchEvent(event);
      await flush();

      expect(prompt.querySelector("[data-role='message']").textContent).toContain("Paste did not create media");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);
      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("updates the scene paste prompt when direct reads are unavailable", async () => {
      const originalClipboard = window.navigator.clipboard;
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: {},
      });

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("Direct clipboard reads are unavailable");

      api._clipboardCloseScenePastePrompt(prompt);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
      });
    });

    it("keeps the scene paste prompt open when direct reads return no clipboard items", async () => {
      window.navigator.clipboard.read.mockResolvedValueOnce([]);

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not return usable media");
      api._clipboardCloseScenePastePrompt(prompt);
    });

    it("closes the scene paste prompt when direct read media succeeds", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(true);
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
      restoreImage();
    });

    it("keeps the scene paste prompt open when direct read media cannot be applied", async () => {
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);
      api._clipboardSetRuntimeState({locked: true});

      const prompt = api._clipboardOpenScenePastePrompt();
      await expect(api._clipboardTryScenePastePromptDirectRead(prompt)).resolves.toBe(false);
      expect(prompt.querySelector("[data-role='message']").textContent).toContain("did not create media");
      expect(api._clipboardGetScenePastePrompt()).toBe(prompt);

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardCloseScenePastePrompt(prompt);
      restoreImage();
    });

    it("allows the scene paste prompt buttons to upload or cancel", async () => {
      let restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      const restoreImage = withMockImage();
      const prompt = api._clipboardOpenScenePastePrompt();
      prompt.querySelector('[data-action="upload"]').click();
      await flush();
      restoreClick();
      restoreImage();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();

      restoreClick = setInputClickBehavior(() => {
        window.dispatchEvent(new Event("focus"));
      });
      const secondPrompt = api._clipboardOpenScenePastePrompt();
      secondPrompt.querySelector('[data-action="cancel"]').click();
      await flush();
      restoreClick();
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("reuses the existing scene paste prompt and supports overlay dismissal", () => {
      const prompt = api._clipboardOpenScenePastePrompt();
      expect(api._clipboardOpenScenePastePrompt()).toBe(prompt);

      prompt.dispatchEvent(new MouseEvent("click", {bubbles: true}));
      expect(api._clipboardGetScenePastePrompt()).toBeNull();
    });

    it("runs the scene and chat upload actions", async () => {
      let restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      api._clipboardHandleSceneUploadAction();
      await flush();
      restoreClick();

      restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });
      api._clipboardHandleChatUploadAction();
      await flush();
      restoreClick();
    });

    it("runs the chat upload action in isolation", async () => {
      const restoreClick = setInputClickBehavior(input => {
        Object.defineProperty(input, "files", {
          configurable: true,
          value: [new File(["x"], "picked.png", {type: "image/png"})],
        });
        input.dispatchEvent(new Event("change"));
      });

      api._clipboardSetRuntimeState({locked: false});
      api._clipboardHandleChatUploadAction();
      await flush();
      restoreClick();
    });
  });

  describe("scene control and chat DOM helpers", () => {
    it("builds video chat preview content", () => {
      expect(api._clipboardCreateChatMediaContent("https://example.com/file.webm")).toContain("video");
    });

    it("supports link-only chat media display", () => {
      env.settingsValues.set("clipboard-image.chat-media-display", "link-only");
      const content = api._clipboardCreateChatMediaContent("https://example.com/file.png");
      expect(content).not.toContain("<img");
      expect(content).toContain("Open full media");
    });

    it("supports full-preview chat media display", () => {
      env.settingsValues.set("clipboard-image.chat-media-display", "full-preview");
      expect(api._clipboardCreateChatMediaContent("https://example.com/file.png"))
        .toContain("clipboard-image-chat-full-preview");
    });

    it("creates chat messages directly", async () => {
      env.settingsRegistry.set("clipboard-image.verbose-logging", {});
      env.settingsValues.set("clipboard-image.verbose-logging", true);
      await api._clipboardCreateChatMessage("folder/file.png");
      expect(globalThis.foundry.documents.ChatMessage.create).toHaveBeenCalledWith({
        content: expect.stringContaining("folder/file.png"),
        speaker: {alias: "GM"},
        user: "user-1",
      });
    });

    it("rejects chat messages without a usable media path", async () => {
      await expect(api._clipboardCreateChatMessage("")).rejects.toThrow("usable media path");
    });

    it("adds scene control buttons to tiles and tokens", () => {
      const controls = {
        tiles: {tools: {}},
        tokens: {tools: {}},
        walls: {tools: {}},
      };

      api._clipboardAddSceneControlButtons(controls);
      expect(controls.tiles.tools["clipboard-image-paste"]).toMatchObject({title: "Paste Media", button: true});
      expect(controls.tiles.tools["clipboard-image-paste"].onClick).toBeTypeOf("function");
      expect(controls.tiles.tools["clipboard-image-paste"].onChange).toBe(controls.tiles.tools["clipboard-image-paste"].onClick);
      expect(controls.tokens.tools["clipboard-image-upload"]).toMatchObject({title: "Upload Media", button: true});
      expect(controls.tokens.tools["clipboard-image-upload"].onClick).toBeTypeOf("function");
      expect(controls.tokens.tools["clipboard-image-upload"].onChange).toBe(controls.tokens.tools["clipboard-image-upload"].onClick);
      expect(controls.walls.tools["clipboard-image-paste"]).toBeUndefined();
    });

    it("respects scene control visibility settings for non-gm users", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("clipboard-image.allow-non-gm-scene-controls", true);
      env.settingsValues.set("clipboard-image.enable-scene-paste-tool", false);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["clipboard-image-paste"].visible).toBe(false);
      expect(controls.tiles.tools["clipboard-image-upload"].visible).toBe(true);
    });

    it("hides scene controls from non-gms when the world setting disallows them", () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("clipboard-image.allow-non-gm-scene-controls", false);

      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);

      expect(controls.tiles.tools["clipboard-image-paste"].visible).toBe(false);
      expect(controls.tiles.tools["clipboard-image-upload"].visible).toBe(false);
    });

    it("invokes scene control callbacks", async () => {
      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);
      controls.tiles.tools["clipboard-image-paste"].onClick();
      controls.tokens.tools["clipboard-image-upload"].onClick();
      await flush();
      api._clipboardCloseScenePastePrompt();
    });

    it("toggles chat drop-target styling", () => {
      const root = document.createElement("form");
      api._clipboardToggleChatDropTarget(root, true);
      expect(root.classList.contains("clipboard-image-chat-drop-target")).toBe(true);
      api._clipboardToggleChatDropTarget(root, false);
      expect(root.classList.contains("clipboard-image-chat-drop-target")).toBe(false);
    });

    it("prevents dragover for supported media", () => {
      const root = document.createElement("form");
      const event = {
        currentTarget: root,
        dataTransfer: {
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
          files: [],
        },
        preventDefault: vi.fn(),
      };

      api._clipboardOnChatDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("clears dragover styling when leaving the chat root", () => {
      const root = document.createElement("form");
      api._clipboardOnChatDragLeave({currentTarget: root, relatedTarget: null});
      expect(root.classList.contains("clipboard-image-chat-drop-target")).toBe(false);
    });

    it("handles dropped chat media", async () => {
      const root = document.createElement("form");
      const event = {
        currentTarget: root,
        target: root,
        dataTransfer: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "drag.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnChatDrop(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("adds and binds the chat upload button once", () => {
      const root = document.createElement("form");
      const input = document.createElement("textarea");
      root.append(input);
      document.body.append(root);

      api._clipboardAttachChatUploadButton(root);
      expect(root.querySelector('[data-action="clipboard-image-chat-upload"]')).toBeTruthy();
      api._clipboardBindChatRoot(root);
      api._clipboardBindChatRoot(root);
      expect(root.getAttribute("data-clipboard-image-chat-root")).toBe("true");
    });

    it("omits the chat upload button when that feature is disabled", () => {
      env.settingsValues.set("clipboard-image.enable-chat-upload-button", false);
      const root = document.createElement("form");
      document.body.append(root);

      api._clipboardAttachChatUploadButton(root);
      expect(root.querySelector('[data-action="clipboard-image-chat-upload"]')).toBeNull();
    });

    it("binds chat roots from rendered chat input elements", () => {
      const root = document.createElement("form");
      const input = document.createElement("textarea");
      root.append(input);
      document.body.append(root);

      api._clipboardOnRenderChatInput(null, {
        form: root,
        ignored: document.createElement("div"),
        text: "not-element",
      });
      expect(root.querySelector('[data-action="clipboard-image-chat-upload"]')).toBeTruthy();
    });
  });

  describe("_clipboardInsertTextAtTarget", () => {
    it("inserts text into text inputs", () => {
      const input = document.createElement("textarea");
      input.value = "hello";
      input.selectionStart = 5;
      input.selectionEnd = 5;

      expect(api._clipboardInsertTextAtTarget(input, " world")).toBe(true);
      expect(input.value).toBe("hello world");
    });

    it("inserts text into contenteditable elements", () => {
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      document.body.append(editable);

      expect(api._clipboardInsertTextAtTarget(editable, "editable")).toBe(true);
      expect(editable.textContent).toBe("editable");
    });

    it("creates a collapsed range when contenteditable has no selection", () => {
      const selection = {
        rangeCount: 0,
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
        getRangeAt: vi.fn(() => ({
          deleteContents: vi.fn(),
          insertNode: vi.fn(),
          setStartAfter: vi.fn(),
          collapse: vi.fn(),
        })),
      };
      const originalGetSelection = window.getSelection;
      window.getSelection = vi.fn(() => selection);

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});
      document.body.append(editable);

      expect(api._clipboardInsertTextAtTarget(editable, "range")).toBe(true);
      window.getSelection = originalGetSelection;
    });

    it("returns false when there is no selection object", () => {
      const originalGetSelection = window.getSelection;
      window.getSelection = vi.fn(() => null);

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      Object.defineProperty(editable, "isContentEditable", {configurable: true, value: true});

      expect(api._clipboardInsertTextAtTarget(editable, "range")).toBe(false);
      window.getSelection = originalGetSelection;
    });

    it("returns false for unsupported targets", () => {
      expect(api._clipboardInsertTextAtTarget(document.createElement("div"), "nope")).toBe(false);
    });
  });

  describe("paste event helpers", () => {
    it("falls back to raw text when chat media handling fails", async () => {
      const input = document.createElement("textarea");
      input.value = "";
      globalThis.fetch.mockRejectedValueOnce(new Error("bad"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        url: "https://example.com/not-media.txt",
        text: "https://example.com/not-media.txt",
      }, input)).resolves.toBe(false);

      expect(input.value).toContain("https://example.com/not-media.txt");
    });

    it("falls back to the original url text when a direct media url download is blocked in chat", async () => {
      const input = document.createElement("textarea");
      input.value = "";
      globalThis.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        url: "https://example.com/file.svg",
        text: "https://example.com/file.svg",
      }, input)).resolves.toBe(false);

      expect(input.value).toBe("https://example.com/file.svg");
      expect(globalThis.foundry.documents.ChatMessage.create).not.toHaveBeenCalled();
    });

    it("rethrows chat media failures when the original URL cannot be inserted", async () => {
      const target = document.createElement("div");
      globalThis.foundry.documents.ChatMessage.create.mockRejectedValueOnce(new Error("bad"));

      await expect(api._clipboardHandleChatImageInputWithTextFallback({
        blob: new Blob(["x"], {type: "image/png"}),
      }, target)).rejects.toThrow("bad");
    });

    it("consumes paste events", () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      api._clipboardConsumePasteEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("reports whether a canvas paste context is eligible", () => {
      expect(api._clipboardCanHandleCanvasPasteContext({
        requireCanvasFocus: false,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      }, "ignored")).toBe(true);
    });

    it("returns false for ineligible canvas paste contexts", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      expect(api._clipboardCanHandleCanvasPasteContext({
        requireCanvasFocus: true,
        replacementTarget: null,
        mousePos: {x: 10, y: 10},
      }, "ignored")).toBe(false);
    });

    it("routes canvas media paste events through the media pipeline", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      api._clipboardSetRuntimeState({locked: false, hiddenMode: false});
      const restoreImage = withMockImage();
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "paste.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      restoreImage();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("routes chat media paste events through the chat pipeline", async () => {
      const root = document.createElement("form");
      root.setAttribute("data-clipboard-image-chat-root", "true");
      const input = document.createElement("textarea");
      root.append(input);

      const event = {
        target: input,
        clipboardData: createDataTransfer({
          items: [{
            kind: "file",
            getAsFile: () => new File(["x"], "chat.png", {type: "image/png"}),
          }],
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("routes canvas text paste events through the note pipeline", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      const event = {
        target: document.querySelector(".game"),
        clipboardData: createDataTransfer({
          data: {"text/plain": "Text note"},
        }),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      api._clipboardOnPaste(event);
      await flush();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("leaves editable text paste alone", () => {
      const input = document.createElement("textarea");
      const event = {
        target: input,
        clipboardData: createDataTransfer({
          data: {"text/plain": "Chat text"},
        }),
        preventDefault: vi.fn(),
      };

      api._clipboardOnPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("keydown handling and config ui", () => {
    it("tracks hidden paste mode without intercepting the browser paste shortcut", () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();

      const event = {
        ctrlKey: false,
        metaKey: true,
        altKey: false,
        code: "KeyV",
        defaultPrevented: false,
        repeat: false,
        getModifierState: vi.fn(() => true),
        preventDefault: vi.fn(),
      };

      api._clipboardOnKeydown(event);
      expect(api._clipboardGetRuntimeState().hiddenMode).toBe(true);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(window.navigator.clipboard.read).not.toHaveBeenCalled();
    });

    it("ignores keydowns that should not trigger clipboard handling", () => {
      api._clipboardOnKeydown({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        code: "KeyV",
        defaultPrevented: true,
        repeat: false,
        getModifierState: () => false,
      });

      api._clipboardOnKeydown({
        ctrlKey: false,
        metaKey: true,
        altKey: true,
        code: "KeyV",
        defaultPrevented: false,
        repeat: false,
        getModifierState: () => false,
      });
    });

    it("exposes destination-config default options and data", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      expect(ClipboardImageDestinationConfig.defaultOptions).toMatchObject({
        id: "clipboard-image-destination-config",
        width: 520,
      });

      const app = new ClipboardImageDestinationConfig();
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
      env.settingsValues.set("clipboard-image.image-location-source", "s3");
      env.settingsValues.set("clipboard-image.image-location", "folder");
      env.settingsValues.set("clipboard-image.image-location-bucket", "bucket");
      expect(app.getData()).toMatchObject({
        bucket: "bucket",
        isS3: true,
        s3Endpoint: "https://r2.example.com",
        target: "folder",
        source: "s3",
      });
    });

    it("keeps the s3 endpoint hidden and empty for non-s3 sources", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      env.settingsValues.set("clipboard-image.image-location-source", "data");
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";

      expect(app.getData()).toMatchObject({
        isS3: false,
        s3Endpoint: "https://r2.example.com",
        source: "data",
      });
    });

    it("binds config form listeners and refreshes form state", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      const sourceHandlers = {};
      const targetHandlers = {};
      const bucketHandlers = {};
      const clickHandlers = {};
      const bucketGroup = {toggleClass: vi.fn()};
      const endpointGroup = {toggleClass: vi.fn()};

      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
        querySelector: vi.fn(selector => {
          if (selector === '[data-role="destination-summary"]') return {value: ""};
          if (selector === '[data-role="s3-endpoint"]') return {value: ""};
          return {value: ""};
        }),
      };
      app.element = {find: vi.fn(selector => {
        if (selector === ".clipboard-image-s3-endpoint") return endpointGroup;
        return bucketGroup;
      })};

      app.activateListeners({
        find: vi.fn(selector => {
          if (selector === '[name="source"]') return {on: vi.fn((event, handler) => { sourceHandlers[event] = handler; })};
          if (selector === '[name="target"]') return {on: vi.fn((event, handler) => { targetHandlers[event] = handler; })};
          if (selector === '[name="bucket"]') return {on: vi.fn((event, handler) => { bucketHandlers[event] = handler; })};
          if (selector === '[data-action="browse-destination"]') return {on: vi.fn((event, handler) => { clickHandlers[event] = handler; })};
          return {toggleClass: vi.fn()};
        }),
      });

      sourceHandlers.change();
      targetHandlers.input();
      bucketHandlers.input();
      expect(bucketGroup.toggleClass).toHaveBeenCalled();
      expect(endpointGroup.toggleClass).toHaveBeenCalled();
      expect(clickHandlers.click).toBeTypeOf("function");
    });

    it("ensures custom source options exist and refreshes summary text", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      globalThis.game.data.files.s3.endpoint = "https://r2.example.com";
      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
        querySelector: vi.fn(selector => {
          if (selector === '[data-role="destination-summary"]') return {value: ""};
          if (selector === '[data-role="s3-endpoint"]') return {value: ""};
          return {value: ""};
        }),
      };
      app.element = {find: vi.fn(() => ({toggleClass: vi.fn()}))};

      app._ensureSourceOption("custom");
      app._refreshFormState();
      expect(app.form.elements.source.add).toHaveBeenCalled();
      expect(app.form.querySelector).toHaveBeenCalledWith('[data-role="destination-summary"]');
      expect(app.form.querySelector).toHaveBeenCalledWith('[data-role="s3-endpoint"]');
    });

    it("returns early from config refresh helpers when no form or source field exists", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();

      app.form = null;
      expect(() => app._refreshFormState()).not.toThrow();
      expect(() => app._ensureSourceOption("custom")).not.toThrow();

      app.form = {elements: {}};
      expect(() => app._ensureSourceOption("custom")).not.toThrow();
    });

    it("skips adding duplicate source options", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      const add = vi.fn();
      app.form = {
        elements: {
          source: {
            options: [{value: "data"}, {value: "custom"}],
            add,
          },
        },
      };

      app._ensureSourceOption("custom");
      expect(add).not.toHaveBeenCalled();
    });

    it("applies picker selections and rejects unsupported sources", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      app.form = {
        elements: {
          source: {
            value: "auto",
            options: [{value: "auto"}, {value: "data"}],
            add: vi.fn(function add(option) {
              this.options.push(option);
            }),
          },
          target: {value: "folder"},
          bucket: {value: ""},
        },
      };
      app.element = {find: vi.fn(() => ({toggleClass: vi.fn()}))};
      app._refreshFormState = vi.fn();

      app._applyPickerSelection("new-folder", {
        activeSource: "public",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "auto");
      expect(globalThis.ui.notifications.warn).toHaveBeenCalled();

      app._applyPickerSelection("new-folder", {
        activeSource: "data",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "auto");
      expect(app.form.elements.source.value).toBe("auto");

      app._applyPickerSelection("new-folder", {
        activeSource: "s3",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "s3");
      expect(app.form.elements.bucket.value).toBe("bucket-x");
    });

    it("returns early when applyPickerSelection has no form", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      app.form = null;
      app._applyPickerSelection("ignored", {
        activeSource: "data",
        sources: {s3: {bucket: "bucket-x"}},
        target: "picker-folder",
      }, "data");
    });

    it("opens a destination browser and configures s3 pickers", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      app.form = {
        elements: {
          source: {value: "s3"},
          target: {value: "s3-folder"},
          bucket: {value: "bucket-a"},
        },
      };

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });

      expect(env.MockFilePicker.instances.at(-1).sources.s3.target).toBe("s3-folder");
    });

    it("invokes the picker callback through _onBrowseDestination", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      app.form = {
        elements: {
          source: {value: "data"},
          target: {value: "folder"},
          bucket: {value: ""},
        },
      };
      app._applyPickerSelection = vi.fn();

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });

      env.MockFilePicker.instances.at(-1).callback("callback-folder");
      expect(app._applyPickerSelection).toHaveBeenCalledWith(
        "callback-folder",
        expect.any(env.MockFilePicker),
        "data"
      );
    });

    it("returns early from browse when there is no form", () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      app.form = null;

      app._onBrowseDestination({
        preventDefault: vi.fn(),
        currentTarget: document.createElement("button"),
      });
    });

    it("writes destination settings on submit", async () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      await app._updateObject(null, {
        source: "s3",
        target: "final-folder",
        bucket: "bucket-z",
      });
      expect(globalThis.game.settings.set).toHaveBeenCalledTimes(3);
    });

    it("does not persist any endpoint override from the destination form", async () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      await app._updateObject(null, {
        source: "s3",
        target: "final-folder",
        bucket: "bucket-z",
        endpoint: "https://should-not-save.example.com",
      });

      expect(globalThis.game.settings.set).not.toHaveBeenCalledWith(
        "clipboard-image",
        expect.stringContaining("endpoint"),
        expect.anything()
      );
    });

    it("clears the stored bucket when the destination source is not s3", async () => {
      const {ClipboardImageDestinationConfig} = env.runtime;
      const app = new ClipboardImageDestinationConfig();
      await app._updateObject(null, {
        source: "data",
        target: "final-folder",
        bucket: "should-be-cleared",
      });

      expect(globalThis.game.settings.set).toHaveBeenCalledWith("clipboard-image", "image-location-source", "data");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("clipboard-image", "image-location", "final-folder");
      expect(globalThis.game.settings.set).toHaveBeenCalledWith("clipboard-image", "image-location-bucket", "");
    });
  });

  describe("settings registration and hook wiring", () => {
    it("registers settings and menus", () => {
      api._clipboardRegisterSettings();
      expect(globalThis.game.settings.registerMenu).toHaveBeenCalled();
      expect(globalThis.game.settings.register).toHaveBeenCalled();
    });

    it("registers every module setting with the expected defaults and scopes", () => {
      api._clipboardRegisterSettings();

      expect(env.registeredMenus).toHaveLength(1);
      expect(env.registeredMenus[0]).toMatchObject({
        moduleId: "clipboard-image",
        key: "upload-destination",
        config: {
          restricted: true,
          type: env.runtime.ClipboardImageDestinationConfig,
        },
      });

      const registeredByKey = new Map(env.registeredSettings.map(entry => [entry.key, entry.config]));
      const expectedSettings = {
        "image-location": {scope: "world", config: false, default: "pasted_images", type: String},
        "image-location-source": {scope: "world", config: false, default: "auto", type: String},
        "image-location-bucket": {scope: "world", config: false, default: "", type: String},
        "verbose-logging": {scope: "client", config: true, default: false, type: Boolean},
        "minimum-role-canvas-media": {scope: "world", config: true, default: "PLAYER", type: String},
        "minimum-role-canvas-text": {scope: "world", config: true, default: "PLAYER", type: String},
        "minimum-role-chat-media": {scope: "world", config: true, default: "PLAYER", type: String},
        "allow-non-gm-scene-controls": {scope: "world", config: true, default: false, type: Boolean},
        "enable-chat-media": {scope: "world", config: true, default: true, type: Boolean},
        "enable-chat-upload-button": {scope: "world", config: true, default: true, type: Boolean},
        "enable-token-creation": {scope: "world", config: true, default: true, type: Boolean},
        "enable-tile-creation": {scope: "world", config: true, default: true, type: Boolean},
        "enable-token-replacement": {scope: "world", config: true, default: true, type: Boolean},
        "enable-tile-replacement": {scope: "world", config: true, default: true, type: Boolean},
        "enable-scene-paste-tool": {scope: "world", config: true, default: true, type: Boolean},
        "enable-scene-upload-tool": {scope: "world", config: true, default: true, type: Boolean},
        "default-empty-canvas-target": {scope: "world", config: true, default: "active-layer", type: String},
        "create-backing-actors": {scope: "world", config: true, default: true, type: Boolean},
        "chat-media-display": {scope: "world", config: true, default: "thumbnail", type: String},
        "canvas-text-paste-mode": {scope: "world", config: true, default: "scene-notes", type: String},
        "scene-paste-prompt-mode": {scope: "world", config: true, default: "auto", type: String},
      };

      expect(registeredByKey.size).toBe(Object.keys(expectedSettings).length);
      for (const [key, expected] of Object.entries(expectedSettings)) {
        expect(registeredByKey.get(key)).toMatchObject(expected);
      }

      expect(registeredByKey.get("minimum-role-canvas-media").choices).toMatchObject({
        PLAYER: "Player",
        TRUSTED: "Trusted Player",
        ASSISTANT: "Assistant GM",
        GAMEMASTER: "Gamemaster",
      });
      expect(env.settingsRegistry.size).toBe(Object.keys(expectedSettings).length);
    });

    it("wires init hooks without registering a custom paste keybinding", () => {
      expect(env.onceHandlers.init).toBeTypeOf("function");
      env.onceHandlers.init();
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("getSceneControlButtons", api._clipboardAddSceneControlButtons);
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("renderChatInput", api._clipboardOnRenderChatInput);
      expect(globalThis.game.keybindings.register).not.toHaveBeenCalled();
    });

    it("shows the ready notification for gms when direct clipboard reads are unavailable", () => {
      const secondEnv = loadRuntime({
        customize() {
          Object.defineProperty(window.navigator, "clipboard", {
            configurable: true,
            value: {},
          });
          globalThis.game.user.isGM = true;
        },
      });

      secondEnv.onceHandlers.ready();
      expect(globalThis.game.socket.on).toHaveBeenCalledWith("module.clipboard-image", secondEnv.api._clipboardHandleSocketReport);
      expect(globalThis.ui.notifications.info).toHaveBeenCalledWith(
        "Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled."
      );
    });

    it("skips the ready notification for non-gms", () => {
      const thirdEnv = loadRuntime({
        customize() {
          Object.defineProperty(window.navigator, "clipboard", {
            configurable: true,
            value: {},
          });
          globalThis.game.user.isGM = false;
        },
      });

      thirdEnv.onceHandlers.ready();
      expect(globalThis.ui.notifications.info).not.toHaveBeenCalledWith(
        "Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and upload fallbacks are still available where enabled."
      );
    });
  });
});
