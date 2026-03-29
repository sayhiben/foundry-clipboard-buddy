import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {vi} from "vitest";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_PATH = path.resolve(__dirname, "..", "..", "src", "index.js");
const SOURCE_ROOT = path.resolve(__dirname, "..", "..", "src") + path.sep;

let nextId = 1;

function makeId(prefix) {
  const id = `${prefix}-${nextId}`;
  nextId += 1;
  return id;
}

function createPage(data = {}) {
  const page = {
    id: data.id || makeId("page"),
    type: data.type || "text",
    name: data.name || "Page",
    text: {
      content: data.text?.content || "",
      format: data.text?.format ?? 1,
    },
    update: vi.fn(async updateData => {
      if (Object.hasOwn(updateData, "text.content")) page.text.content = updateData["text.content"];
      if (Object.hasOwn(updateData, "text.format")) page.text.format = updateData["text.format"];
      return page;
    }),
  };

  return page;
}

function createPagesCollection(pages) {
  const map = new Map(pages.map(page => [page.id, page]));
  return {
    contents: pages,
    get: id => map.get(id),
    set: (id, page) => map.set(id, page),
  };
}

function createJournalEntry(env, data = {}) {
  const pages = (data.pages || []).map(pageData => createPage(pageData));
  const entry = {
    id: data.id || makeId("entry"),
    name: data.name || "Journal Entry",
    pages: createPagesCollection(pages),
    createEmbeddedDocuments: vi.fn(async (_type, pageDataList) => {
      const createdPages = pageDataList.map(pageData => createPage(pageData));
      for (const page of createdPages) {
        entry.pages.contents.push(page);
        entry.pages.set(page.id, page);
      }
      return createdPages;
    }),
  };

  env.journalEntries.set(entry.id, entry);
  return entry;
}

function createActor(env, data = {}) {
  const actor = {
    id: data.id || makeId("actor"),
    name: data.name || "Actor",
    type: data.type || env.defaultActorType,
    img: data.img || "",
    prototypeToken: {
      name: data.prototypeToken?.name || data.name || "Actor",
      texture: {
        src: data.prototypeToken?.texture?.src || data.img || "",
      },
      width: data.prototypeToken?.width ?? 1,
      height: data.prototypeToken?.height ?? 1,
    },
    update: vi.fn(async updateData => {
      Object.assign(actor, updateData);
      return actor;
    }),
  };

  env.actors.set(actor.id, actor);
  return actor;
}

function createPlaceableDocument(documentName, data = {}) {
  const flags = new Map();
  if (data.flags) {
    for (const [scope, values] of Object.entries(data.flags)) {
      flags.set(scope, {...values});
    }
  }

  const document = {
    id: data.id || makeId(documentName.toLowerCase()),
    documentName,
    name: data.name || documentName,
    x: data.x ?? 0,
    y: data.y ?? 0,
    width: data.width ?? 1,
    height: data.height ?? 1,
    actor: data.actor || null,
    isOwner: data.isOwner ?? true,
    object: data.object || null,
    canUserModify: data.canUserModify || vi.fn(() => data.isOwner ?? true),
    testUserPermission: data.testUserPermission || vi.fn(() => data.isOwner ?? true),
    getFlag: vi.fn((scope, key) => flags.get(scope)?.[key] ?? null),
    setFlag: vi.fn(async (scope, key, value) => {
      const scopedFlags = flags.get(scope) || {};
      scopedFlags[key] = value;
      flags.set(scope, scopedFlags);
      return value;
    }),
  };

  return document;
}

function createControlledPlaceable(documentName, data = {}) {
  return {
    document: createPlaceableDocument(documentName, data),
  };
}

function loadRuntime(options = {}) {
  nextId = 1;
  document.body.innerHTML = '<div class="game" tabindex="0"></div><div id="fixtures"></div>';
  document.querySelector(".game")?.focus();

  const onceHandlers = {};
  const onHandlers = {};
  const registeredSettings = [];
  const registeredMenus = [];
  const socketHandlers = new Map();
  const dialogInstances = [];
  const settingsValues = new Map([
    ["clipboard-image.image-location-source", "auto"],
    ["clipboard-image.image-location", "pasted_images"],
    ["clipboard-image.image-location-bucket", ""],
    ["clipboard-image.verbose-logging", false],
    ["clipboard-image.minimum-role-canvas-media", "PLAYER"],
    ["clipboard-image.minimum-role-canvas-text", "PLAYER"],
    ["clipboard-image.minimum-role-chat-media", "PLAYER"],
    ["clipboard-image.allow-non-gm-scene-controls", false],
    ["clipboard-image.enable-chat-media", true],
    ["clipboard-image.enable-chat-upload-button", true],
    ["clipboard-image.enable-token-creation", true],
    ["clipboard-image.enable-tile-creation", true],
    ["clipboard-image.enable-token-replacement", true],
    ["clipboard-image.enable-tile-replacement", true],
    ["clipboard-image.enable-scene-paste-tool", true],
    ["clipboard-image.enable-scene-upload-tool", true],
    ["clipboard-image.default-empty-canvas-target", "active-layer"],
    ["clipboard-image.create-backing-actors", true],
    ["clipboard-image.chat-media-display", "thumbnail"],
    ["clipboard-image.canvas-text-paste-mode", "scene-notes"],
    ["clipboard-image.scene-paste-prompt-mode", "auto"],
  ]);
  const settingsRegistry = new Map();
  const journalEntries = new Map();
  const sceneNotes = new Map();
  const actors = new Map();

  class MockFilePicker {
    static browse = vi.fn(async () => ({}));
    static createDirectory = vi.fn(async () => ({}));
    static upload = vi.fn(async (_source, target, file) => ({path: `${target}/${file.name}`}));
    static instances = [];

    constructor(options = {}) {
      Object.assign(this, options);
      this.sources = {
        s3: {
          bucket: "",
          target: options.current || "",
        },
      };
      this.render = vi.fn(() => this);
      MockFilePicker.instances.push(this);
    }
  }

  class MockFormApplication {
    static get defaultOptions() {
      return {base: true};
    }

    constructor() {
      this.form = null;
      this.element = {
        find: vi.fn(() => ({
          toggleClass: vi.fn(),
        })),
      };
    }

    activateListeners() {}
  }

  const env = {
    onceHandlers,
    onHandlers,
    registeredSettings,
    registeredMenus,
    socketHandlers,
    dialogInstances,
    settingsValues,
    settingsRegistry,
    journalEntries,
    sceneNotes,
    actors,
    defaultActorType: "character",
    MockFilePicker,
    MockFormApplication,
  };

  const scene = {
    notes: {
      get: id => sceneNotes.get(id),
    },
    updateEmbeddedDocuments: vi.fn(async (_documentName, updates) => updates),
    createEmbeddedDocuments: vi.fn(async (documentName, dataList) => {
      if (documentName === "Note") {
        return dataList.map(data => {
          const note = {
            id: data.id || makeId("note"),
            ...data,
            update: vi.fn(async updateData => {
              Object.assign(note, updateData);
              return note;
            }),
          };
          sceneNotes.set(note.id, note);
          return note;
        });
      }

      return dataList.map(data => ({
        id: data.id || makeId(documentName.toLowerCase()),
        ...data,
      }));
    }),
  };

  globalThis.ui = {
    notifications: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    windows: {},
  };

  globalThis.canvas = {
    ready: true,
    scene,
    dimensions: {
      width: 1000,
      height: 800,
      sceneWidth: 900,
      sceneHeight: 700,
      size: 100,
    },
    mousePosition: {x: 150, y: 250},
    grid: {
      sizeX: 100,
      sizeY: 100,
      getTopLeftPoint: vi.fn(point => ({
        x: Math.floor(point.x / 100) * 100,
        y: Math.floor(point.y / 100) * 100,
      })),
    },
    tokens: {
      controlled: [],
      activate: vi.fn(),
      options: {name: "tokens"},
    },
    tiles: {
      controlled: [],
      activate: vi.fn(),
      options: {name: "tiles"},
    },
    notes: {
      activate: vi.fn(),
    },
  };
  globalThis.canvas.activeLayer = globalThis.canvas.tiles;

  globalThis.game = {
    user: {
      id: "user-1",
      name: "Gamemaster",
      isGM: true,
      role: 4,
    },
    settings: {
      settings: settingsRegistry,
      get: vi.fn((moduleId, key) => settingsValues.get(`${moduleId}.${key}`)),
      set: vi.fn(async (moduleId, key, value) => {
        settingsValues.set(`${moduleId}.${key}`, value);
        return value;
      }),
      register: vi.fn((moduleId, key, config) => {
        const settingsKey = `${moduleId}.${key}`;
        settingsRegistry.set(settingsKey, config);
        if (!settingsValues.has(settingsKey)) settingsValues.set(settingsKey, config.default);
        registeredSettings.push({moduleId, key, config});
      }),
      registerMenu: vi.fn((moduleId, key, config) => {
        registeredMenus.push({moduleId, key, config});
      }),
    },
    keybindings: {
      register: vi.fn(),
    },
    modules: new Map(),
    system: {
      documentTypes: {
        Actor: ["character", "npc"],
      },
    },
    documentTypes: {
      Actor: ["character", "npc"],
    },
    data: {
      files: {
        s3: {
          endpoint: "",
        },
      },
    },
    journal: {
      get: id => journalEntries.get(id),
    },
    actors: {
      get: id => actors.get(id),
    },
    world: {
      id: "world-1",
      title: "Test World",
    },
    socket: {
      on: vi.fn((channel, callback) => {
        socketHandlers.set(channel, callback);
      }),
      emit: vi.fn(),
    },
  };

  globalThis.CONST = {
    DEFAULT_TOKEN: "icons/svg/mystery-man.svg",
    BASE_DOCUMENT_TYPE: "base",
    USER_ROLES: {
      NONE: 0,
      PLAYER: 1,
      TRUSTED: 2,
      ASSISTANT: 3,
      GAMEMASTER: 4,
    },
    JOURNAL_ENTRY_PAGE_FORMATS: {
      HTML: 9,
    },
    KEYBINDING_PRECEDENCE: {
      PRIORITY: 42,
    },
  };

  globalThis.CONFIG = {
    Actor: {
      defaultType: "character",
    },
    JournalEntry: {
      noteIcons: {
        Book: "icons/svg/book.svg",
        Candle: "icons/svg/candle.svg",
      },
    },
  };

  globalThis.foundry = {
    applications: {
      apps: {
        FilePicker: {
          implementation: MockFilePicker,
        },
      },
    },
    helpers: {
      interaction: {
        KeyboardManager: {
          MODIFIER_KEYS: {
            CONTROL: "Control",
          },
        },
      },
      media: {
        VideoHelper: {
          hasVideoExtension: vi.fn(() => false),
        },
      },
    },
    appv1: {
      api: {
        FormApplication: MockFormApplication,
      },
    },
    utils: {
      escapeHTML: vi.fn(value => String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")),
      mergeObject: vi.fn((target, source) => ({...target, ...source})),
    },
    documents: {
      ChatMessage: {
        create: vi.fn(async data => data),
        getSpeaker: vi.fn(() => ({alias: "GM"})),
      },
      JournalEntry: {
        create: vi.fn(async data => {
          const entry = createJournalEntry(env, data);
          return entry;
        }),
      },
      Actor: {
        DEFAULT_ICON: "icons/svg/mystery-man.svg",
        create: vi.fn(async data => createActor(env, data)),
      },
    },
  };
  globalThis.Actor = globalThis.foundry.documents.Actor;

  globalThis.Hooks = {
    once: vi.fn((hook, callback) => {
      onceHandlers[hook] = callback;
    }),
    on: vi.fn((hook, callback) => {
      onHandlers[hook] = callback;
    }),
  };

  globalThis.fetch = vi.fn();
  globalThis.saveDataToFile = vi.fn();
  globalThis.console = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
  };
  globalThis.ForgeVTT = undefined;
  globalThis.Dialog = class MockDialog {
    constructor(data) {
      this.data = data;
      this.render = vi.fn(() => this);
      dialogInstances.push(this);
    }
  };
  globalThis.URL.createObjectURL = vi.fn(() => "blob:clipboard-image-log");
  globalThis.URL.revokeObjectURL = vi.fn();

  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: {
      read: vi.fn(async () => []),
    },
  });

  if (options.customize) options.customize(env);

  for (const cacheKey of Object.keys(require.cache)) {
    if (cacheKey.startsWith(SOURCE_ROOT)) delete require.cache[cacheKey];
  }
  const runtime = require(RUNTIME_PATH);

  env.runtime = runtime;
  env.api = runtime.__testables;
  env.createJournalEntry = data => createJournalEntry(env, data);
  env.createActor = data => createActor(env, data);
  env.createPage = data => createPage(data);
  env.createPlaceableDocument = (documentName, data) => createPlaceableDocument(documentName, data);
  env.createControlledPlaceable = (documentName, data) => createControlledPlaceable(documentName, data);
  env.emitSocket = (channel, payload) => socketHandlers.get(channel)?.(payload);

  return env;
}

export {
  loadRuntime,
};
