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

    it("adds scene control buttons to tiles and tokens", () => {
      const controls = {
        tiles: {tools: {}},
        tokens: {tools: {}},
        walls: {tools: {}},
      };

      api._clipboardAddSceneControlButtons(controls);
      expect(controls.tiles.tools["clipboard-image-paste"]).toMatchObject({title: "Paste Media", button: true});
      expect(controls.tokens.tools["clipboard-image-upload"]).toMatchObject({title: "Upload Media", button: true});
      expect(controls.walls.tools["clipboard-image-paste"]).toBeUndefined();
    });

    it("invokes scene control callbacks", async () => {
      const controls = {tiles: {tools: {}}, tokens: {tools: {}}};
      api._clipboardAddSceneControlButtons(controls);
      controls.tiles.tools["clipboard-image-paste"].onChange();
      controls.tokens.tools["clipboard-image-upload"].onChange();
      await flush();
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
    it("handles the macOS meta+v paste shortcut", async () => {
      document.body.innerHTML = '<div class="game" tabindex="0"></div>';
      document.querySelector(".game").focus();
      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);

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
      await flush();
      restoreImage();
      expect(api._clipboardGetRuntimeState().hiddenMode).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
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
      env.settingsValues.set("clipboard-image.image-location-source", "s3");
      env.settingsValues.set("clipboard-image.image-location", "folder");
      env.settingsValues.set("clipboard-image.image-location-bucket", "bucket");
      expect(app.getData()).toMatchObject({
        bucket: "bucket",
        isS3: true,
        target: "folder",
        source: "s3",
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
        querySelector: vi.fn(() => ({value: ""})),
      };
      app.element = {find: vi.fn(() => bucketGroup)};

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
      expect(clickHandlers.click).toBeTypeOf("function");
    });

    it("ensures custom source options exist and refreshes summary text", () => {
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
        querySelector: vi.fn(() => ({value: ""})),
      };
      app.element = {find: vi.fn(() => ({toggleClass: vi.fn()}))};

      app._ensureSourceOption("custom");
      app._refreshFormState();
      expect(app.form.elements.source.add).toHaveBeenCalled();
      expect(app.form.querySelector).toHaveBeenCalledWith('[data-role="destination-summary"]');
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
  });

  describe("settings registration and hook wiring", () => {
    it("registers settings and menus", () => {
      api._clipboardRegisterSettings();
      expect(globalThis.game.settings.registerMenu).toHaveBeenCalled();
      expect(globalThis.game.settings.register).toHaveBeenCalled();
    });

    it("wires init hooks and keybindings", async () => {
      expect(env.onceHandlers.init).toBeTypeOf("function");
      env.onceHandlers.init();
      expect(globalThis.Hooks.on).toHaveBeenCalledWith("getSceneControlButtons", api._clipboardAddSceneControlButtons);
      expect(globalThis.game.keybindings.register).toHaveBeenCalled();

      const keybinding = globalThis.game.keybindings.register.mock.calls.at(-1)[2];
      api._clipboardSetRuntimeState({locked: true});
      expect(keybinding.onDown()).toBe(true);

      api._clipboardSetRuntimeState({locked: false});
      document.body.innerHTML = '<div class="game" tabindex="0"></div><input id="field">';
      document.getElementById("field").focus();
      expect(keybinding.onDown()).toBe(false);

      document.querySelector(".game").focus();
      globalThis.canvas.activeLayer.clipboard = {objects: [1]};
      expect(keybinding.onDown()).toBe(false);
      globalThis.canvas.activeLayer.clipboard = {objects: []};

      const restoreImage = withMockImage();
      window.navigator.clipboard.read.mockResolvedValueOnce([
        {types: ["image/png"], getType: async () => new Blob(["x"], {type: "image/png"})},
      ]);
      expect(keybinding.onDown()).toBe(true);
      await flush();
      restoreImage();
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
      expect(globalThis.ui.notifications.info).toHaveBeenCalledWith(
        "Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and Upload Media scene controls are still available."
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
        "Clipboard Image: Direct clipboard reads are unavailable here. Browser paste events and Upload Media scene controls are still available."
      );
    });
  });
});
