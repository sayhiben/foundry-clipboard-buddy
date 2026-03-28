import {beforeEach, describe, expect, it} from "vitest";

import {loadRuntime} from "./runtime-env.js";

describe("text helpers", () => {
  let env;
  let api;

  beforeEach(() => {
    env = loadRuntime();
    api = env.api;
  });

  describe("text normalization and conversion", () => {
    it("normalizes pasted text and strips trailing blank lines", () => {
      expect(api._clipboardNormalizePastedText(" alpha\r\nbeta\r\n")).toBe(" alpha\nbeta");
    });

    it("returns an empty string for whitespace-only text", () => {
      expect(api._clipboardNormalizePastedText(" \n\t")).toBe("");
    });

    it("escapes html using the Foundry helper", () => {
      expect(api._clipboardEscapeHtml('<tag>"')).toBe("&lt;tag&gt;&quot;");
    });

    it("extracts normalized text from html content", () => {
      expect(api._clipboardExtractTextFromHtml("<div>Hello<br>world</div><p>Next</p>")).toBe("Hello\nworld\n\nNext");
    });

    it("returns an empty string for empty html", () => {
      expect(api._clipboardExtractTextFromHtml("")).toBe("");
    });

    it("converts paragraphs and line breaks to html", () => {
      expect(api._clipboardConvertTextToHtml("Hello\nworld\n\nNext")).toBe("<p>Hello<br>world</p><p>Next</p>");
    });
  });

  describe("text preview and note metadata", () => {
    it("uses the default journal prefix when preview text is empty", () => {
      expect(api._clipboardGetTextPreview("")).toBe("Pasted Note");
    });

    it("returns the first line when it fits", () => {
      expect(api._clipboardGetTextPreview("Hello world")).toBe("Hello world");
    });

    it("truncates long previews", () => {
      expect(api._clipboardGetTextPreview("A".repeat(60), 10)).toBe("AAAAAAAAA…");
    });

    it("returns the configured html page format", () => {
      expect(api._clipboardGetTextPageFormat()).toBe(9);
    });

    it("prefers the configured Book icon", () => {
      expect(api._clipboardGetDefaultNoteIcon()).toBe("icons/svg/book.svg");
    });

    it("falls back to the first configured icon when Book is unavailable", () => {
      globalThis.CONFIG.JournalEntry.noteIcons = {Other: "icons/svg/other.svg"};
      expect(api._clipboardGetDefaultNoteIcon()).toBe("icons/svg/other.svg");
    });

    it("falls back to the core book svg when no icons are configured", () => {
      globalThis.CONFIG.JournalEntry.noteIcons = {};
      expect(api._clipboardGetDefaultNoteIcon()).toBe("icons/svg/book.svg");
    });
  });

  describe("note payload helpers", () => {
    it("uses the object center when available", () => {
      expect(api._clipboardGetDocumentCenter({
        object: {
          center: {x: 8, y: 9},
        },
      })).toEqual({x: 8, y: 9});
    });

    it("calculates tile centers from pixel dimensions", () => {
      expect(api._clipboardGetDocumentCenter({
        documentName: "Tile",
        x: 10,
        y: 20,
        width: 100,
        height: 40,
      })).toEqual({x: 60, y: 40});
    });

    it("calculates token centers from grid units", () => {
      expect(api._clipboardGetDocumentCenter({
        documentName: "Token",
        x: 0,
        y: 0,
        width: 2,
        height: 3,
      })).toEqual({x: 100, y: 150});
    });

    it("falls back to the provided note position when no document exists", () => {
      expect(api._clipboardGetAssociatedNotePosition(null, {x: 1, y: 2})).toEqual({x: 1, y: 2});
    });

    it("builds text journal page data", () => {
      expect(api._clipboardCreateTextPageData("Hello", "Notes")).toEqual({
        name: "Notes",
        type: "text",
        title: {show: true, level: 1},
        text: {
          content: "<p>Hello</p>",
          format: 9,
        },
      });
    });

    it("appends html content with a divider", () => {
      expect(api._clipboardAppendHtmlContent("<p>Old</p>", "<p>New</p>")).toBe("<p>Old</p><hr><p>New</p>");
    });

    it("returns unchanged content when one side is empty", () => {
      expect(api._clipboardAppendHtmlContent("", "<p>New</p>")).toBe("<p>New</p>");
      expect(api._clipboardAppendHtmlContent("<p>Old</p>", "")).toBe("<p>Old</p>");
    });

    it("builds scene note create data", () => {
      expect(api._clipboardCreateSceneNoteData({
        entryId: "entry-1",
        pageId: "page-1",
        position: {x: 10, y: 20},
        text: "Label",
      })).toEqual({
        entryId: "entry-1",
        pageId: "page-1",
        text: "Label",
        x: 10,
        y: 20,
        texture: {
          src: "icons/svg/book.svg",
        },
      });
    });
  });
});
