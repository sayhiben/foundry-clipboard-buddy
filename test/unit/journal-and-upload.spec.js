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
          "foundry-paste-eater": {
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

    it("falls back to legacy note flag data from the old module namespace", () => {
      const document = env.createPlaceableDocument("Token", {
        flags: {
          "clipboard-image": {
            textNote: {
              entryId: "entry-legacy",
              pageId: "page-legacy",
              noteId: "note-legacy",
            },
          },
        },
      });

      expect(api._clipboardGetAssociatedTextNoteData(document)).toEqual({
        entryId: "entry-legacy",
        pageId: "page-legacy",
        noteId: "note-legacy",
      });
    });
  });

  describe("_clipboardEnsureAssociatedTextPage", () => {
    it("appends to an existing text page", async () => {
      const document = env.createPlaceableDocument("Token", {
        flags: {
          "foundry-paste-eater": {
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
          "foundry-paste-eater": {
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
      globalThis.game.modules.set("clipboard-image", {active: true});
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
      expect(document.unsetFlag).toHaveBeenCalledWith("clipboard-image", "textNote");
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
          "foundry-paste-eater": {
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

    it("creates a new scene note when the stored note id no longer resolves", async () => {
      const createdPage = await api._clipboardEnsureAssociatedTextPage(
        env.createPlaceableDocument("Token", {name: "Stale Note"}),
        "seed"
      );
      env.journalEntries.set(createdPage.entry.id, createdPage.entry);
      const document = env.createPlaceableDocument("Token", {
        id: "token-stale-note",
        name: "Stale Note",
        flags: {
          "foundry-paste-eater": {
            textNote: {
              entryId: createdPage.entry.id,
              pageId: createdPage.page.id,
              noteId: "missing-note-id",
            },
          },
        },
      });

      await expect(api._clipboardEnsurePlaceableTextNote(document, "More text", {x: 30, y: 40})).resolves.toBe(true);
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          entryId: createdPage.entry.id,
          pageId: createdPage.page.id,
          text: "Stale Note Notes",
        }),
      ]);
      expect(document.setFlag).toHaveBeenCalledWith("foundry-paste-eater", "textNote", expect.objectContaining({
        entryId: createdPage.entry.id,
        pageId: createdPage.page.id,
        noteId: expect.any(String),
      }));
    });

    it("ignores legacy scope cleanup errors after storing the new note flag", async () => {
      globalThis.game.modules.set("clipboard-image", {active: true});
      const document = env.createPlaceableDocument("Token", {
        id: "token-legacy-cleanup",
        name: "Legacy Cleanup",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
      document.unsetFlag.mockImplementation(() => {
        throw new Error("invalid scope");
      });

      await expect(api._clipboardEnsurePlaceableTextNote(document, "Some text", {x: 10, y: 20})).resolves.toBe(true);
      expect(document.setFlag).toHaveBeenCalled();
      expect(document.unsetFlag).toHaveBeenCalledWith("clipboard-image", "textNote");
    });

    it("stores the new note flag even when legacy cleanup is unavailable", async () => {
      globalThis.game.modules.set("clipboard-image", {active: true});
      const document = env.createPlaceableDocument("Token", {
        id: "token-no-cleanup",
        name: "No Cleanup",
      });
      document.unsetFlag = undefined;

      await expect(api._clipboardEnsurePlaceableTextNote(document, "Some text", {x: 10, y: 20})).resolves.toBe(true);
      expect(document.setFlag).toHaveBeenCalled();
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

  describe("selected scene note helpers", () => {
    it("appends pasted text to an existing selected scene note page", async () => {
      const entry = env.createJournalEntry({
        id: "entry-note",
        name: "Scene Note",
        pages: [{
          id: "page-note",
          type: "text",
          text: {content: "<p>Existing</p>", format: 1},
        }],
      });
      const note = env.createPlaceableDocument("Note", {
        id: "note-1",
        entryId: entry.id,
        pageId: "page-note",
        text: "Target Note",
      });

      await expect(api._clipboardAppendTextToSceneNote(note, "Appended")).resolves.toBe(true);
      expect(entry.pages.get("page-note").update).toHaveBeenCalledWith({
        "text.content": "<p>Existing</p><hr><p>Appended</p>",
        "text.format": 9,
      });
    });

    it("creates a new text page when a selected scene note points at a missing page", async () => {
      const entry = env.createJournalEntry({
        id: "entry-note-missing",
        name: "Scene Note",
        pages: [],
      });
      const note = env.createPlaceableDocument("Note", {
        id: "note-2",
        entryId: entry.id,
        pageId: "missing-page",
        text: "Target Note",
      });

      await expect(api._clipboardAppendTextToSceneNote(note, "New page")).resolves.toBe(true);
      expect(entry.createEmbeddedDocuments).toHaveBeenCalled();
      expect(note.update).toHaveBeenCalledWith({
        pageId: expect.any(String),
      });
    });

    it("creates a new text page when a selected scene note points at a non-text page", async () => {
      const entry = env.createJournalEntry({
        id: "entry-note-image",
        name: "Scene Note",
        pages: [{
          id: "page-image",
          type: "image",
        }],
      });
      const note = env.createPlaceableDocument("Note", {
        id: "note-image",
        entryId: entry.id,
        pageId: "page-image",
        text: "Target Note",
      });

      await expect(api._clipboardAppendTextToSceneNote(note, "Converted page")).resolves.toBe(true);
      expect(entry.createEmbeddedDocuments).toHaveBeenCalledWith("JournalEntryPage", [
        expect.objectContaining({
          name: "Notes",
          type: "text",
        }),
      ]);
      expect(note.update).toHaveBeenCalledWith({
        pageId: expect.any(String),
      });
    });

    it("creates a journal entry for a selected scene note that is not linked yet", async () => {
      const note = env.createPlaceableDocument("Note", {
        id: "note-unlinked",
        text: "Loose Note",
      });

      await expect(api._clipboardAppendTextToSceneNote(note, "Seed text")).resolves.toBe(true);
      expect(note.update).toHaveBeenCalledWith({
        entryId: expect.any(String),
        pageId: expect.any(String),
        text: "Loose Note",
      });
    });

    it("creates shared PDF journal entries and PDF page data", async () => {
      const created = await api._clipboardCreatePdfJournalEntry({
        src: "pasted_images/pdf/user-1/2026-04/handout.pdf",
        name: "Handout",
        previewSrc: "pasted_images/pdf/user-1/2026-04/handout-preview.png",
      });

      expect(created.entry.ownership).toMatchObject({
        default: 2,
        "user-1": 3,
      });
      expect(created.page).toMatchObject({
        type: "pdf",
        name: "Handout",
        src: "pasted_images/pdf/user-1/2026-04/handout.pdf",
      });
      expect(created.page.flags["foundry-paste-eater"]).toMatchObject({
        pdfPreview: "pasted_images/pdf/user-1/2026-04/handout-preview.png",
        pdfExternal: false,
      });
      expect(api._clipboardGetJournalPageUuid(created.entry, created.page)).toBe(`${created.entry.uuid}.JournalEntryPage.${created.page.id}`);
    });

    it("keeps shared Journal ownership helpers explicit and non-destructive", async () => {
      expect(api._clipboardMergeSharedJournalOwnership({
        default: 1,
        "user-1": 0,
        "other-user": 3,
      })).toEqual({
        default: 2,
        "user-1": 3,
        "other-user": 3,
      });

      const widened = env.createJournalEntry({
        id: "entry-share-helper",
        ownership: {
          default: 3,
          "user-1": 1,
        },
      });
      await expect(api._clipboardEnsureSharedJournalOwnership(widened)).resolves.toBe(widened);
      expect(widened.update).toHaveBeenCalledWith({
        ownership: {
          default: 3,
          "user-1": 3,
        },
      });

      const unchanged = env.createJournalEntry({
        id: "entry-share-helper-unchanged",
        ownership: {
          default: 2,
          "user-1": 3,
        },
      });
      await expect(api._clipboardEnsureSharedJournalOwnership(unchanged)).resolves.toBe(unchanged);
      expect(unchanged.update).not.toHaveBeenCalled();

      const entryWithoutUpdate = {
        ownership: {
          default: 0,
        },
      };
      await expect(api._clipboardEnsureSharedJournalOwnership(entryWithoutUpdate)).resolves.toBe(entryWithoutUpdate);
      expect(entryWithoutUpdate.ownership).toEqual({
        default: 2,
        "user-1": 3,
      });
      await expect(api._clipboardEnsureSharedJournalOwnership(null)).resolves.toBeNull();
    });

    it("appends a PDF page to a selected scene note and repoints the note", async () => {
      const entry = env.createJournalEntry({
        id: "entry-note-pdf",
        name: "Scene Note",
        ownership: {default: 0},
        pages: [],
      });
      const note = env.createPlaceableDocument("Note", {
        id: "note-pdf",
        entryId: entry.id,
        text: "Target Note",
      });

      const result = await api._clipboardAppendPdfPageToSceneNote(note, {
        src: "folder/handout.pdf",
        name: "Handout",
        previewSrc: "folder/handout-preview.png",
        external: false,
      });

      expect(entry.update).not.toHaveBeenCalledWith(expect.objectContaining({
        ownership: expect.any(Object),
      }));
      expect(entry.ownership).toEqual({default: 0});
      expect(entry.createEmbeddedDocuments).toHaveBeenCalledWith("JournalEntryPage", [
        expect.objectContaining({
          type: "pdf",
          src: "folder/handout.pdf",
          name: "Handout",
        }),
      ]);
      expect(note.update).toHaveBeenCalledWith(expect.objectContaining({
        entryId: entry.id,
        pageId: result.page.id,
        text: "Handout",
        "texture.src": "folder/handout-preview.png",
      }));
    });

    it("creates a standalone PDF note with a Journal PDF page", async () => {
      await expect(api._clipboardCreateStandalonePdfNote({
        src: "folder/handout.pdf",
        name: "Handout",
        previewSrc: "",
        external: false,
      }, {
        mousePos: {x: 100, y: 200},
      })).resolves.toMatchObject({
        entry: expect.any(Object),
        page: expect.objectContaining({
          type: "pdf",
          src: "folder/handout.pdf",
        }),
      });

      expect(globalThis.canvas.notes.activate).toHaveBeenCalled();
      expect(globalThis.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledWith("Note", [
        expect.objectContaining({
          text: "Handout",
          x: 100,
          y: 200,
          texture: {
            src: "icons/svg/book.svg",
          },
        }),
      ]);
    });
  });

  describe("upload and fetch helpers", () => {
    it("adds a unique suffix to uploaded filenames", () => {
      expect(api._clipboardCreateVersionedFilename("upload.png", 123)).toBe("upload-123.png");
      expect(api._clipboardCreateVersionedFilename("upload", 123)).toBe("upload-123");
    });

    it("adds a cache-busting query to uploaded media paths", () => {
      expect(api._clipboardCreateFreshMediaPath("folder/upload.png", 123)).toBe("folder/upload.png?foundry-paste-eater=123");
      expect(api._clipboardCreateFreshMediaPath("folder/upload.png?x=1", 123)).toBe("folder/upload.png?x=1&foundry-paste-eater=123");
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

    it("creates and uploads PDF files without media coercion", async () => {
      const uploadFile = api._clipboardCreatePdfUploadFile(
        new File(["pdf"], "handout.pdf", {type: "application/pdf"}),
        123
      );
      expect(uploadFile.name).toBe("handout-123.pdf");
      expect(uploadFile.type).toBe("application/pdf");

      const uploadPath = await api._clipboardUploadPdfBlob(new File(["pdf"], "handout.pdf", {type: "application/pdf"}), {
        source: "data",
        target: "folder",
        bucket: "",
      });
      expect(uploadPath).toMatch(/^folder\/handout-\d+\.pdf$/);
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

    it("wraps storage permission failures with gm-facing guidance", async () => {
      globalThis.game.user.isGM = false;
      globalThis.game.user.role = globalThis.CONST.USER_ROLES.PLAYER;
      env.settingsValues.set("core.permissions", {
        FILES_BROWSE: [4],
        FILES_UPLOAD: [4],
      });
      env.MockFilePicker.upload.mockRejectedValueOnce(new Error("You do not have permission to upload files to this location"));

      await expect(api._clipboardUploadBlob(new File(["x"], "upload.png", {type: "image/png"}), {
        source: "s3",
        target: "folder",
        bucket: "shared-bucket",
        endpoint: "https://storage.example.com",
      })).rejects.toMatchObject({
        clipboardSummary: "Foundry denied permission to upload pasted media in the active storage destination.",
        clipboardResolution: expect.stringContaining("Game Settings -> Configure Permissions"),
      });
    });

    it("preserves non-permission upload failures without rewriting them", async () => {
      env.MockFilePicker.upload.mockRejectedValueOnce(new Error("upload transport failed"));

      await expect(api._clipboardUploadBlob(new File(["x"], "upload.png", {type: "image/png"}), {
        source: "data",
        target: "folder",
        bucket: "",
      })).rejects.toThrow("upload transport failed");
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

    it("downloads and wraps PDF urls", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "application/pdf",
        },
        blob: async () => new Blob(["pdf"], {type: "application/pdf"}),
      });

      const fetched = await api._clipboardFetchPdfUrl("https://example.com/handout.pdf");
      expect(fetched).toBeInstanceOf(File);
      expect(fetched.name).toBe("handout.pdf");
      expect(fetched.type).toBe("application/pdf");
    });

    it("rejects downloaded direct PDF URLs that do not resolve to PDF content", async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => "text/plain",
        },
        blob: async () => new Blob(["x"], {type: "text/plain"}),
      });

      await expect(api._clipboardFetchPdfUrl("https://example.com/handout.txt")).rejects.toMatchObject({
        clipboardPdfUrlNotPdf: true,
      });
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
