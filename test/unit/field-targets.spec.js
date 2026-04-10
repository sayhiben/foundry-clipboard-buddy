import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("focused art field helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  it("resolves app roots from data-appid elements", () => {
    const root = document.createElement("section");
    root.dataset.appid = "actor-app";
    root.innerHTML = '<input type="text" name="img">';
    document.body.append(root);
    globalThis.ui.windows["actor-app"] = {object: {documentName: "Actor"}};

    expect(api._clipboardGetAppFromElement(root.querySelector("input"))).toEqual({
      app: globalThis.ui.windows["actor-app"],
      appRoot: root,
    });
    expect(api._clipboardGetAppFromElement(document.createElement("div"))).toEqual({
      app: null,
      appRoot: null,
    });
  });

  it("resolves modern application roots and instances by DOM id", () => {
    const root = document.createElement("form");
    root.id = "TokenConfig-1";
    root.className = "application sheet token-config";
    root.innerHTML = '<file-picker name="texture.src"><input type="text" class="image"></file-picker>';
    document.body.append(root);

    const app = {
      id: root.id,
      object: {documentName: "Token"},
    };
    globalThis.foundry.applications.instances = new Map([[root.id, app]]);
    globalThis.ui.activeWindow = app;

    expect(api._clipboardGetAppFromElement(root.querySelector("input"))).toEqual({
      app,
      appRoot: root,
    });
  });

  it("prefers the legacy ui.windows lookup when both app registries match the same root", () => {
    const root = document.createElement("section");
    root.dataset.appid = "actor-app";
    root.innerHTML = '<input type="text" name="img">';
    document.body.append(root);

    const windowApp = {object: {documentName: "Actor"}, source: "ui.windows"};
    const instanceApp = {appId: "actor-app", object: {documentName: "Tile"}, source: "instances"};
    globalThis.ui.windows["actor-app"] = windowApp;
    globalThis.foundry.applications.instances = new Map([["other", instanceApp]]);

    expect(api._clipboardGetAppFromElement(root.querySelector("input"))).toEqual({
      app: windowApp,
      appRoot: root,
    });
  });

  it("detects supported art field names from input names, data-edit attributes, and file-picker wrappers", () => {
    const namedInput = document.createElement("input");
    namedInput.name = "img";
    expect(api._clipboardGetArtFieldName(namedInput)).toBe("img");

    const editableInput = document.createElement("input");
    editableInput.dataset.edit = "texture.src";
    expect(api._clipboardGetArtFieldName(editableInput)).toBe("texture.src");

    const picker = document.createElement("file-picker");
    picker.setAttribute("name", "prototypeToken.texture.src");
    picker.innerHTML = '<input type="text" class="image">';
    document.body.append(picker);
    expect(api._clipboardGetArtFieldName(picker.querySelector("input"))).toBe("prototypeToken.texture.src");

    const unsupportedInput = document.createElement("input");
    unsupportedInput.name = "name";
    expect(api._clipboardGetArtFieldName(unsupportedInput)).toBeNull();
  });

  it("reports allowed media kinds for supported art fields", () => {
    expect(api._clipboardGetArtFieldMediaKinds("img")).toEqual(["image"]);
    expect(api._clipboardGetArtFieldMediaKinds("texture.src")).toEqual(["image", "video"]);
  });

  it("limits supported art fields to the document types in the product contract", () => {
    expect(api._clipboardCanPopulateArtField("Actor", "img")).toBe(true);
    expect(api._clipboardCanPopulateArtField("Item", "img")).toBe(true);
    expect(api._clipboardCanPopulateArtField("Token", "texture.src")).toBe(true);
    expect(api._clipboardCanPopulateArtField("Actor", "prototypeToken.texture.src")).toBe(true);

    expect(api._clipboardCanPopulateArtField("Tile", "texture.src")).toBe(false);
    expect(api._clipboardCanPopulateArtField("Note", "texture.src")).toBe(false);
    expect(api._clipboardCanPopulateArtField("Item", "prototypeToken.texture.src")).toBe(false);
  });

  it("ignores unsupported img fields outside actor and item apps", () => {
    const root = document.createElement("section");
    root.dataset.appid = "journal-app";
    root.innerHTML = '<input type="text" name="img">';
    document.body.append(root);
    globalThis.ui.windows["journal-app"] = {object: {documentName: "JournalEntry"}};

    expect(api._clipboardGetFocusedArtFieldTarget(root.querySelector("input"))).toBeNull();
    expect(api._clipboardGetFocusedArtFieldTarget(document.createElement("div"))).toBeNull();
  });

  it("ignores texture fields outside token-style apps", () => {
    const tileRoot = document.createElement("section");
    tileRoot.dataset.appid = "tile-app";
    tileRoot.innerHTML = '<input type="text" name="texture.src">';
    document.body.append(tileRoot);
    globalThis.ui.windows["tile-app"] = {object: {documentName: "Tile"}};

    expect(api._clipboardGetFocusedArtFieldTarget(tileRoot.querySelector("input"))).toBeNull();
  });

  it("supports prototype token texture fields on actor sheets", () => {
    const actorRoot = document.createElement("section");
    actorRoot.dataset.appid = "actor-app";
    actorRoot.innerHTML = '<input type="text" name="prototypeToken.texture.src">';
    document.body.append(actorRoot);
    globalThis.ui.windows["actor-app"] = {object: {documentName: "Actor"}};

    expect(api._clipboardGetFocusedArtFieldTarget(actorRoot.querySelector("input"))).toMatchObject({
      fieldName: "prototypeToken.texture.src",
      documentName: "Actor",
      mediaKinds: ["image", "video"],
    });
  });

  it("ignores token-style file-picker wrappers inside unsupported apps", () => {
    const root = document.createElement("section");
    root.dataset.appid = "journal-app";
    root.innerHTML = '<file-picker name="texture.src"><input type="text" class="image"></file-picker>';
    document.body.append(root);
    globalThis.ui.windows["journal-app"] = {object: {documentName: "JournalEntry"}};

    expect(api._clipboardGetFocusedArtFieldTarget(root.querySelector("input"))).toBeNull();
  });

  it("updates both field values and matching previews", () => {
    const root = document.createElement("section");
    root.dataset.appid = "actor-app";
    root.innerHTML = `
      <input type="text" name="img" value="">
      <input type="text" data-edit="img" value="">
      <img data-edit="img" src="">
    `;
    document.body.append(root);
    globalThis.ui.windows["actor-app"] = {object: {documentName: "Actor"}};
    const target = api._clipboardGetFocusedArtFieldTarget(root.querySelector('input[name="img"]'));

    expect(api._clipboardPopulateArtFieldTarget(target, "folder/image.png", {url: "https://example.com/file.png"})).toBe(true);
    expect(root.querySelector('input[name="img"]').value).toBe("folder/image.png");
    expect(root.querySelector('input[data-edit="img"]').value).toBe("folder/image.png");
    expect(root.querySelector('img[data-edit="img"]').src).toContain("folder/image.png");
  });

  it("reloads video previews after updating token-style art fields", () => {
    const root = document.createElement("section");
    root.dataset.appid = "token-app";
    root.innerHTML = `
      <input type="text" name="texture.src" value="">
      <video data-edit="texture.src" src=""></video>
      <video><source data-edit="texture.src" src=""></video>
    `;
    document.body.append(root);
    globalThis.ui.windows["token-app"] = {object: {documentName: "Token"}};

    const directPreview = root.querySelector('video[data-edit="texture.src"]');
    const sourcePreview = root.querySelector('source[data-edit="texture.src"]');
    const sourceParent = sourcePreview.parentElement;
    let directPreviewLoads = 0;
    let sourceParentLoads = 0;
    directPreview.load = () => {
      directPreviewLoads += 1;
    };
    sourceParent.load = () => {
      sourceParentLoads += 1;
    };

    const target = api._clipboardGetFocusedArtFieldTarget(root.querySelector('input[name="texture.src"]'));
    expect(api._clipboardPopulateArtFieldTarget(target, "folder/clip.webm")).toBe(true);

    expect(directPreviewLoads).toBe(1);
    expect(sourceParentLoads).toBe(1);
  });

  it("supports real token-config file-picker fields from application v2 sheets", () => {
    const root = document.createElement("form");
    root.id = "TokenConfig-1";
    root.className = "application sheet token-config";
    root.innerHTML = `
      <div class="form-group">
        <file-picker name="texture.src">
          <input type="text" class="image" value="">
        </file-picker>
      </div>
      <video data-edit="texture.src" src=""></video>
    `;
    document.body.append(root);

    const app = {
      id: root.id,
      object: {documentName: "Token"},
    };
    globalThis.foundry.applications.instances = new Map([[root.id, app]]);
    globalThis.ui.activeWindow = app;

    const picker = root.querySelector("file-picker");
    const field = picker.querySelector("input");
    const preview = root.querySelector('video[data-edit="texture.src"]');
    let previewLoads = 0;
    preview.load = () => {
      previewLoads += 1;
    };

    const target = api._clipboardGetFocusedArtFieldTarget(field);
    expect(target).toMatchObject({
      app,
      appRoot: root,
      documentName: "Token",
      fieldName: "texture.src",
      field,
      picker,
    });

    expect(api._clipboardPopulateArtFieldTarget(target, "folder/clip.webm")).toBe(true);
    expect(field.value).toBe("folder/clip.webm");
    expect(picker.value).toBe("folder/clip.webm");
    expect(preview.src).toContain("folder/clip.webm");
    expect(previewLoads).toBe(1);
  });

  it("detects PDF Journal page src fields and ignores other src fields", () => {
    const root = document.createElement("form");
    root.id = "JournalEntryPageConfig-1";
    root.className = "application sheet journal-page";
    root.innerHTML = `
      <file-picker name="src">
        <input type="text" value="">
      </file-picker>
    `;
    document.body.append(root);

    const pdfPage = env.createPage({
      id: "page-pdf",
      type: "pdf",
      src: "",
    });
    pdfPage.documentName = "JournalEntryPage";
    const app = {
      id: root.id,
      object: pdfPage,
    };
    globalThis.foundry.applications.instances = new Map([[root.id, app]]);
    globalThis.ui.activeWindow = app;

    const picker = root.querySelector("file-picker");
    const field = picker.querySelector("input");
    const target = api._clipboardGetFocusedPdfFieldTarget(picker);

    expect(target).toMatchObject({
      app,
      appRoot: root,
      documentName: "JournalEntryPage",
      fieldName: "src",
      field,
      picker,
    });
    expect(api._clipboardPopulatePdfFieldTarget(target, "folder/handout.pdf")).toBe(true);
    expect(field.value).toBe("folder/handout.pdf");
    expect(picker.value).toBe("folder/handout.pdf");

    pdfPage.type = "text";
    expect(api._clipboardGetFocusedPdfFieldTarget(field)).toBeNull();
  });

  it("detects focused audio document fields without hijacking arbitrary path fields", () => {
    const root = document.createElement("form");
    root.id = "AmbientSoundConfig-1";
    root.className = "application sheet ambient-sound";
    root.innerHTML = `
      <file-picker name="path">
        <input type="text" value="">
      </file-picker>
      <audio data-edit="path" src=""></audio>
    `;
    document.body.append(root);

    const ambientSound = env.createPlaceableDocument("AmbientSound", {id: "sound-1", path: ""});
    const app = {
      id: root.id,
      object: ambientSound,
    };
    globalThis.foundry.applications.instances = new Map([[root.id, app]]);
    globalThis.ui.activeWindow = app;

    const picker = root.querySelector("file-picker");
    const field = picker.querySelector("input");
    const preview = root.querySelector("audio");
    let previewLoads = 0;
    preview.load = () => {
      previewLoads += 1;
    };

    const target = api._clipboardGetFocusedAudioFieldTarget(picker);
    expect(target).toMatchObject({
      app,
      appRoot: root,
      documentName: "AmbientSound",
      fieldName: "path",
      field,
      picker,
    });
    expect(api._clipboardPopulateAudioFieldTarget(target, "folder/theme.mp3")).toBe(true);
    expect(field.value).toBe("folder/theme.mp3");
    expect(picker.value).toBe("folder/theme.mp3");
    expect(preview.src).toContain("folder/theme.mp3");
    expect(previewLoads).toBe(1);

    const sourceRoot = document.createElement("form");
    sourceRoot.id = "AmbientSoundConfig-source";
    sourceRoot.className = "application sheet ambient-sound";
    sourceRoot.innerHTML = `
      <input type="text" name="path" value="">
      <audio data-edit="path"><source data-edit="path" src=""></audio>
    `;
    document.body.append(sourceRoot);
    const sourceAmbientSound = env.createPlaceableDocument("AmbientSound", {id: "sound-source", path: ""});
    globalThis.foundry.applications.instances.set(sourceRoot.id, {
      id: sourceRoot.id,
      object: sourceAmbientSound,
    });
    const sourceTarget = api._clipboardGetFocusedAudioFieldTarget(sourceRoot.querySelector("input"));
    expect(api._clipboardPopulateAudioFieldTarget(sourceTarget, "folder/source.ogg")).toBe(true);
    expect(sourceRoot.querySelector("source").src).toContain("folder/source.ogg");

    globalThis.ui.windows["actor-path"] = {object: {documentName: "Actor"}};
    const unsupportedRoot = document.createElement("section");
    unsupportedRoot.dataset.appid = "actor-path";
    unsupportedRoot.innerHTML = '<input type="text" name="path">';
    document.body.append(unsupportedRoot);
    expect(api._clipboardGetFocusedAudioFieldTarget(unsupportedRoot.querySelector("input"))).toBeNull();
  });

  it("resolves playlist targets from playlist documents and playlist UI elements", () => {
    const playlist = env.createPlaylist({id: "playlist-audio", name: "Audio"});
    const root = document.createElement("section");
    root.dataset.appid = "playlist-app";
    root.innerHTML = '<input type="text" name="path">';
    document.body.append(root);
    globalThis.ui.windows["playlist-app"] = {object: playlist};

    expect(api._clipboardGetPlaylistTargetFromElement(root.querySelector("input"))).toMatchObject({
      playlist,
      inPlaylistUi: true,
    });

    const directoryRow = document.createElement("div");
    directoryRow.id = "playlists";
    directoryRow.innerHTML = '<div data-playlist-id="playlist-audio"><span>Audio</span></div>';
    document.body.append(directoryRow);
    expect(api._clipboardGetPlaylistTargetFromElement(directoryRow.querySelector("span"))).toMatchObject({
      playlist,
      inPlaylistUi: true,
    });

    const playlistFromContents = env.createPlaylist({id: "playlist-contents", name: "Contents Playlist"});
    const savedPlaylists = globalThis.game.playlists;
    globalThis.game.playlists = {
      contents: [playlistFromContents],
    };
    const contentsRow = document.createElement("div");
    contentsRow.innerHTML = '<div data-id="playlist-contents"><span>Contents</span></div>';
    document.body.append(contentsRow);
    expect(api._clipboardGetPlaylistTargetFromElement(contentsRow.querySelector("span"))).toMatchObject({
      playlist: playlistFromContents,
      inPlaylistUi: true,
    });
    globalThis.game.playlists = savedPlaylists;

    const orphanSound = env.createPlaylistSound({
      id: "orphan-sound",
    });
    orphanSound.playlistId = "playlist-audio";
    const soundRoot = document.createElement("section");
    soundRoot.dataset.appid = "playlist-sound-app";
    soundRoot.innerHTML = '<input type="text" name="path">';
    document.body.append(soundRoot);
    globalThis.ui.windows["playlist-sound-app"] = {object: orphanSound};
    expect(api._clipboardGetPlaylistTargetFromElement(soundRoot.querySelector("input"))).toMatchObject({
      playlist,
      playlistSound: orphanSound,
      inPlaylistUi: true,
    });

    const genericPlaylistUi = document.createElement("div");
    genericPlaylistUi.id = "playlists";
    genericPlaylistUi.innerHTML = "<span>No specific playlist</span>";
    document.body.append(genericPlaylistUi);
    expect(api._clipboardGetPlaylistTargetFromElement(genericPlaylistUi.querySelector("span"))).toMatchObject({
      playlist: null,
      playlistSound: null,
      inPlaylistUi: true,
    });
  });

  it("skips jsdom's unimplemented native media reload helper", () => {
    const video = document.createElement("video");
    expect(() => api._clipboardReloadMediaPreview(video)).not.toThrow();
  });

  it("ignores preview reload errors from custom media elements", () => {
    expect(() => api._clipboardReloadMediaPreview({
      load: () => {
        throw new Error("reload failed");
      },
    })).not.toThrow();
  });

  it("returns false when there is no target or value to populate", () => {
    expect(api._clipboardPopulateArtFieldTarget(null, "value")).toBe(false);
    expect(api._clipboardPopulateArtFieldTarget({
      field: document.createElement("div"),
    }, "value")).toBe(false);
    expect(api._clipboardPopulateArtFieldTarget({
      field: document.createElement("input"),
      fieldName: "img",
      appRoot: document.createElement("section"),
      documentName: "Actor",
    }, "")).toBe(false);
  });
});
