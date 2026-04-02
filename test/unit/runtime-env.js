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
      for (const [key, value] of Object.entries(updateData || {})) {
        if (key === "prototypeToken.texture.src") {
          actor.prototypeToken.texture.src = value;
          continue;
        }
        actor[key] = value;
      }
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
    entryId: data.entryId ?? null,
    pageId: data.pageId ?? null,
    text: data.text ?? "",
    texture: {
      src: data.texture?.src || "",
    },
    actorId: data.actorId ?? data.actor?.id ?? null,
    actorLink: data.actorLink ?? false,
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
      document.flags[scope] = {...scopedFlags};
      document._source.flags[scope] = {...scopedFlags};
      return value;
    }),
    unsetFlag: vi.fn(async (scope, key) => {
      const scopedFlags = flags.get(scope);
      if (!scopedFlags) return null;
      delete scopedFlags[key];
      if (!Object.keys(scopedFlags).length) {
        flags.delete(scope);
        delete document.flags[scope];
        delete document._source.flags[scope];
      } else {
        document.flags[scope] = {...scopedFlags};
        document._source.flags[scope] = {...scopedFlags};
      }
      return null;
    }),
    update: vi.fn(async updateData => {
      for (const [key, value] of Object.entries(updateData || {})) {
        if (key === "texture.src") {
          document.texture.src = value;
          continue;
        }
        document[key] = value;
      }
      return document;
    }),
  };
  document.flags = Object.fromEntries(Array.from(flags.entries(), ([scope, value]) => [scope, {...value}]));
  document._source = {
    flags: Object.fromEntries(Array.from(flags.entries(), ([scope, value]) => [scope, {...value}])),
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
    ["foundry-paste-eater.image-location-source", "data"],
    ["foundry-paste-eater.image-location", "pasted_images"],
    ["foundry-paste-eater.image-location-bucket", ""],
    ["foundry-paste-eater.verbose-logging", false],
    ["core.permissions", {FILES_BROWSE: [1, 2, 3, 4], FILES_UPLOAD: [1, 2, 3, 4]}],
    ["foundry-paste-eater.minimum-role-canvas-media", "PLAYER"],
    ["foundry-paste-eater.minimum-role-canvas-text", "PLAYER"],
    ["foundry-paste-eater.minimum-role-chat-media", "PLAYER"],
    ["foundry-paste-eater.allow-non-gm-scene-controls", true],
    ["foundry-paste-eater.enable-chat-media", true],
    ["foundry-paste-eater.enable-chat-upload-button", true],
    ["foundry-paste-eater.enable-token-creation", true],
    ["foundry-paste-eater.enable-tile-creation", true],
    ["foundry-paste-eater.enable-token-replacement", true],
    ["foundry-paste-eater.enable-tile-replacement", true],
    ["foundry-paste-eater.enable-scene-paste-tool", true],
    ["foundry-paste-eater.enable-scene-upload-tool", true],
    ["foundry-paste-eater.default-empty-canvas-target", "tile"],
    ["foundry-paste-eater.create-backing-actors", false],
    ["foundry-paste-eater.chat-media-display", "thumbnail"],
    ["foundry-paste-eater.canvas-text-paste-mode", "disabled"],
    ["foundry-paste-eater.scene-paste-prompt-mode", "auto"],
    ["foundry-paste-eater.selected-token-paste-mode", "prompt"],
    ["foundry-paste-eater.upload-path-organization", "context-user-month"],
  ]);
  const settingsRegistry = new Map();
  const worldStorage = new Map();
  const clientStorage = new Map();
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
    worldStorage,
    clientStorage,
    journalEntries,
    sceneNotes,
    actors,
    defaultActorType: "character",
    MockFilePicker,
    MockFormApplication,
  };

  const scene = {
    tokens: {
      contents: [],
      get: id => scene.tokens.contents.find(token => token.id === id) || null,
    },
    tiles: {
      contents: [],
      get: id => scene.tiles.contents.find(tile => tile.id === id) || null,
    },
    notes: {
      contents: [],
      get: id => sceneNotes.get(id) || scene.notes.contents.find(note => note.id === id) || null,
    },
    updateEmbeddedDocuments: vi.fn(async (documentName, updates) => {
      const collection = documentName === "Token"
        ? scene.tokens.contents
        : documentName === "Tile"
          ? scene.tiles.contents
          : scene.notes.contents;
      for (const update of updates || []) {
        const document = collection.find(entry => entry.id === update._id);
        if (!document) continue;
        await document.update(update);
      }
      return updates;
    }),
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
          scene.notes.contents.push(note);
          return note;
        });
      }

      const documents = dataList.map(data => createPlaceableDocument(documentName, data));
      if (documentName === "Token") {
        scene.tokens.contents.push(...documents);
      } else if (documentName === "Tile") {
        scene.tiles.contents.push(...documents);
      }
      return documents;
    }),
  };

  globalThis.ui = {
    chat: {
      render: vi.fn(),
    },
    controls: {
      control: {name: "tiles"},
      controls: [
        {name: "tiles", tools: []},
        {name: "tokens", tools: []},
      ],
      initialize: vi.fn(({control} = {}) => {
        if (control) {
          globalThis.ui.controls.control = {name: control};
        }
      }),
      render: vi.fn(),
    },
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
      controlledObjects: new Map(),
      activate: vi.fn(),
      options: {name: "tokens"},
    },
    tiles: {
      controlled: [],
      controlledObjects: new Map(),
      activate: vi.fn(),
      options: {name: "tiles"},
    },
    notes: {
      controlled: [],
      controlledObjects: new Map(),
      activate: vi.fn(),
      options: {name: "notes"},
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
      storage: new Map([
        ["world", worldStorage],
        ["client", clientStorage],
      ]),
      get: vi.fn((moduleId, key) => settingsValues.get(`${moduleId}.${key}`)),
      set: vi.fn(async (moduleId, key, value) => {
        const settingsKey = `${moduleId}.${key}`;
        settingsValues.set(settingsKey, value);
        const config = settingsRegistry.get(settingsKey);
        const scope = config?.scope || "world";
        const storage = scope === "client" ? clientStorage : worldStorage;
        storage.set(settingsKey, {key: settingsKey, value});
        if (typeof config?.onChange === "function") {
          await config.onChange(value);
        }
        return value;
      }),
      register: vi.fn((moduleId, key, config) => {
        const settingsKey = `${moduleId}.${key}`;
        settingsRegistry.set(settingsKey, config);
        if (!settingsValues.has(settingsKey)) settingsValues.set(settingsKey, config.default);
        const storage = config.scope === "client" ? clientStorage : worldStorage;
        if (storage.has(settingsKey)) {
          settingsValues.set(settingsKey, storage.get(settingsKey).value);
        }
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
      get contents() {
        return Array.from(journalEntries.values());
      },
      get: id => journalEntries.get(id),
    },
    actors: {
      get contents() {
        return Array.from(actors.values());
      },
      get: id => actors.get(id),
    },
    scenes: {
      contents: [scene],
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
  globalThis.URL.createObjectURL = vi.fn(() => "blob:foundry-paste-eater-log");
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
