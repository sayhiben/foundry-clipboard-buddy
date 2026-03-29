import {beforeEach, describe, expect, it, vi} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("journal, note, and upload workflows", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("journal entry helpers", () => {
    it("creates a text journal entry with a default preview name", async () => {
      const createdJournal = await api._clipboardCreateTextJournalEntry("Hello world");
      expect(createdJournal.entry.name).toContain("Pasted Note:");
      expect(createdJournal.page.text.content).toBe("<p>Hello world</p>");
    });

    it("appends text to an existing text page", async () => {
      const page = env.createPage({text: {content: "<p>Old</p>", format: 9}});
      await api._clipboardAppendTextToPage(page, "New text");
      expect(page.update).toHaveBeenCalledWith({
        "text.content": "<p>Old</p><hr><p>New text</p>",
        "text.format": 9,
      });
    });

    it("rejects appending text to non-text pages", async () => {
      await expect(api._clipboardAppendTextToPage({type: "image"}, "bad")).rejects.toThrow("non-text");
    });

    it("reads associated note flag data from a document", () => {
      const document = env.createPlaceableDocument("Token", {
        flags: {
          "clipboard-image": {
            textNote: {
              entryId: "entry-1",
              pageId: "page-1",
              noteId: "note-1",
            },
          },
        },
      });

      expect(api._clipboardGetAssociatedTextNoteData(document)).toEqual({
        entryId: "entry-1",
        pageId: "page-1",
        noteId: "note-1",
      });
    });
  });

  describe("_clipboardEnsureAssociatedTextPage", () => {
    it("appends to an existing text page", async () => {
      const document = env.createPlaceableDocument("Token", {
        flags: {
          "clipboard-image": {
            textNote: {
              entryId: "entry-1",
              pageId: "page-1",
              noteId: "note-1",
            },
          },
        },
      });
      const existingEntry = env.createJournalEntry({
        id: "entry-1",
        name: "Existing",
        pages: [{
          id: "page-1",
          type: "text",
          text: {content: "<p>Old</p>", format: 9},
        }],
      });

      const result = await api._clipboardEnsureAssociatedTextPage(document, "Append me");
      expect(result.entry).toBe(existingEntry);
      expect(result.page.id).toBe("page-1");
      expect(result.page.update).toHaveBeenCalled();
    });

    it("creates a new page inside an existing journal when the flagged page is missing", async () => {
      const document = env.createPlaceableDocument("Tile", {
        flags: {
          "clipboard-image": {
            textNote: {
              entryId: "entry-2",
              pageId: "page-missing",
              noteId: null,
            },
          },
        },
      });
      const entry = env.createJournalEntry({
        id: "entry-2",
        name: "Existing Two",
        pages: [],
      });

      const result = await api._clipboardEnsureAssociatedTextPage(document, "Create page");
      expect(result.entry).toBe(entry);
      expect(entry.createEmbeddedDocuments).toHaveBeenCalled();
    });

    it("creates a new journal when no associated journal exists", async () => {
      const result = await api._clipboardEnsureAssociatedTextPage(
        env.createPlaceableDocument("Token", {name: "Hero"}),
        "Brand new"
      );
      expect(result.entry.name).toBe("Hero Notes");
    });
  });

  describe("_clipboardEnsurePlaceableTextNote", () => {
    it("creates a new scene note and stores flags", async () => {
      const document = env.createPlaceableDocument("Token", {
        id: "token-1",
        name: "Hero",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });

      await api._clipboardEnsurePlaceableTextNote(document, "Some text", {x: 10, y: 20});
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          entryId: expect.any(String),
          pageId: expect.any(String),
          text: "Hero Notes",
        }),
      ]);
      expect(document.setFlag).toHaveBeenCalled();
    });

    it("updates an existing note when a noteId is already stored", async () => {
      const createdPage = await api._clipboardEnsureAssociatedTextPage(
        env.createPlaceableDocument("Token", {name: "Noted"}),
        "seed"
      );
      const note = {
        id: "note-1",
        update: vi.fn(async () => note),
      };
      env.sceneNotes.set("note-1", note);

      const document = env.createPlaceableDocument("Token", {
        id: "token-2",
        name: "Noted",
        flags: {
          "clipboard-image": {
            textNote: {
              entryId: createdPage.entry.id,
              pageId: createdPage.page.id,
              noteId: "note-1",
            },
          },
        },
      });
      env.journalEntries.set(createdPage.entry.id, createdPage.entry);

      await api._clipboardEnsurePlaceableTextNote(document, "More text", {x: 30, y: 40});
      expect(note.update).toHaveBeenCalled();
    });

    it("throws when it cannot produce a valid note target", async () => {
      globalThis.foundry.documents.JournalEntry.create.mockResolvedValueOnce(null);
      await expect(api._clipboardEnsurePlaceableTextNote(
        env.createPlaceableDocument("Token", {name: "Broken"}),
        "broken"
      )).rejects.toThrow("Failed to create or update");
    });
  });

  describe("_clipboardCreateStandaloneTextNote", () => {
    it("returns false when there is no cursor position", async () => {
      await expect(api._clipboardCreateStandaloneTextNote("No position", {mousePos: null})).resolves.toBe(false);
    });

    it("creates a standalone note and activates the notes layer", async () => {
      await expect(api._clipboardCreateStandaloneTextNote("Standalone", {
        mousePos: {x: 100, y: 200},
      })).resolves.toBe(true);
      expect(globalThis.canvas.notes.activate).toHaveBeenCalled();
    });
  });

  describe("upload and fetch helpers", () => {
    it("adds a unique suffix to uploaded filenames", () => {
      expect(api._clipboardCreateVersionedFilename("upload.png", 123)).toBe("upload-123.png");
      expect(api._clipboardCreateVersionedFilename("upload", 123)).toBe("upload-123");
    });

    it("adds a cache-busting query to uploaded media paths", () => {
      expect(api._clipboardCreateFreshMediaPath("folder/upload.png", 123)).toBe("folder/upload.png?clipboard-image=123");
      expect(api._clipboardCreateFreshMediaPath("folder/upload.png?x=1", 123)).toBe("folder/upload.png?x=1&clipboard-image=123");
      expect(api._clipboardCreateFreshMediaPath("blob:abc", 123)).toBe("blob:abc");
    });

    it("uploads a blob through the FilePicker", async () => {
      const uploadPath = await api._clipboardUploadBlob(new File(["x"], "upload.png", {type: "image/png"}), {
        source: "data",
        target: "folder",
        bucket: "",
      });
      expect(uploadPath).toMatch(/^folder\/upload-\d+\.png$/);
    });

    it("normalizes uploaded SVG files before sending them to the FilePicker", async () => {
      await api._clipboardUploadBlob(
        new File(['<svg style="width: 512px; height: 512px;" viewBox="0 0 512 512"></svg>'], "token.svg", {
          type: "image/svg+xml",
        }),
        {
          source: "data",
          target: "folder",
          bucket: "",
        }
      );

      const uploadedFile = env.MockFilePicker.upload.mock.calls.at(-1)[2];
      expect(uploadedFile.name).toMatch(/^token-\d+\.svg$/);
      await expect(api._clipboardReadBlobText(uploadedFile)).resolves.toContain('width="512"');
      await expect(api._clipboardReadBlobText(uploadedFile)).resolves.toContain('height="512"');
    });

    it("throws when upload does not return a usable path", async () => {
      env.MockFilePicker.upload.mockResolvedValueOnce({});
      await expect(api._clipboardUploadBlob(new File(["x"], "upload.png", {type: "image/png"}), {
        source: "data",
        target: "folder",
        bucket: "",
      })).rejects.toThrow("usable media path");
    });

    it("downloads and wraps supported media urls", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "image/png",
        },
        blob: async () => new Blob(["x"], {type: "image/png"}),
      });

      const fetched = await api._clipboardFetchImageUrl("https://example.com/file.png");
      expect(fetched).toBeInstanceOf(File);
      expect(fetched.name).toBe("file.png");
    });

    it("throws when a download cannot be started", async () => {
      globalThis.fetch.mockRejectedValueOnce(new Error("network"));
      await expect(api._clipboardFetchImageUrl("https://example.com/file.png")).rejects.toThrow("Failed to download");
    });

    it("throws when the download returns a non-ok response", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });
      await expect(api._clipboardFetchImageUrl("https://example.com/file.png")).rejects.toThrow("404 Not Found");
    });

    it("throws when the downloaded content is not supported media", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "text/plain",
        },
        blob: async () => new Blob(["x"], {type: "text/plain"}),
      });
      await expect(api._clipboardFetchImageUrl("https://example.com/file.txt")).rejects.toThrow("supported media");
    });

    it("wraps untyped media blobs using the filename extension", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "text/plain",
        },
        blob: async () => new Blob(["x"], {type: "text/plain"}),
      });
      const wrapped = await api._clipboardFetchImageUrl("https://example.com/file.png");
      expect(wrapped.type).toBe("image/png");
    });

    it("resolves blob image input directly", async () => {
      const blob = new File(["x"], "local.png", {type: "image/png"});
      await expect(api._clipboardResolveImageInputBlob({blob})).resolves.toBe(blob);
    });

    it("resolves url image input via download", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "image/png",
        },
        blob: async () => new Blob(["x"], {type: "image/png"}),
      });
      await expect(api._clipboardResolveImageInputBlob({url: "https://example.com/file.png"})).resolves.toBeInstanceOf(File);
    });

    it("returns null when image input is empty", async () => {
      await expect(api._clipboardResolveImageInputBlob(null)).resolves.toBeNull();
    });
  });
});
