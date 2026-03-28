const {
  CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
  CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
} = require("./constants");

function _clipboardNormalizePastedText(text) {
  const normalized = text?.replace(/\r\n?/g, "\n") || "";
  if (!normalized.trim()) return "";
  return normalized.trimEnd();
}

function _clipboardEscapeHtml(text) {
  return foundry.utils.escapeHTML(text || "");
}

function _clipboardExtractTextFromHtml(html) {
  if (!html?.trim()) return "";

  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  const body = documentFragment.body;
  if (!body) return "";

  for (const lineBreak of body.querySelectorAll("br")) {
    lineBreak.replaceWith(documentFragment.createTextNode("\n"));
  }

  const blockTags = [
    "address", "article", "aside", "blockquote", "dd", "div", "dl", "dt", "fieldset",
    "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
    "header", "hr", "li", "main", "nav", "ol", "p", "pre", "section", "table", "tr", "ul",
  ];

  for (const block of body.querySelectorAll(blockTags.join(","))) {
    if (block.firstChild?.textContent?.startsWith("\n") !== true) {
      block.prepend(documentFragment.createTextNode("\n"));
    }
    if (block.lastChild?.textContent?.endsWith("\n") !== true) {
      block.append(documentFragment.createTextNode("\n"));
    }
  }

  const extractedText = body.textContent?.replace(/^\n+/, "") || "";
  return _clipboardNormalizePastedText(extractedText);
}

function _clipboardConvertTextToHtml(text) {
  const paragraphs = _clipboardNormalizePastedText(text)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.split("\n").map(_clipboardEscapeHtml).join("<br>"))
    .filter(Boolean);

  return paragraphs.map(paragraph => `<p>${paragraph}</p>`).join("");
}

function _clipboardGetTextPreview(text, maxLength = 48) {
  const normalized = _clipboardNormalizePastedText(text);
  if (!normalized) return CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX;

  const firstLine = normalized.split("\n").find(line => line.trim()) || normalized;
  if (firstLine.length <= maxLength) return firstLine;
  return `${firstLine.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

function _clipboardGetTextPageFormat() {
  return CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
}

function _clipboardGetDefaultNoteIcon() {
  return CONFIG?.JournalEntry?.noteIcons?.Book || Object.values(CONFIG?.JournalEntry?.noteIcons || {})[0] || "icons/svg/book.svg";
}

function _clipboardGetDocumentCenter(document) {
  const center = document?.object?.center;
  if (center) {
    return {
      x: center.x,
      y: center.y,
    };
  }

  if (document?.documentName === "Tile") {
    return {
      x: document.x + (document.width / 2),
      y: document.y + (document.height / 2),
    };
  }

  const gridSizeX = canvas?.grid?.sizeX || canvas?.dimensions?.size || 100;
  const gridSizeY = canvas?.grid?.sizeY || canvas?.dimensions?.size || 100;
  return {
    x: document.x + (((document.width || 1) * gridSizeX) / 2),
    y: document.y + (((document.height || 1) * gridSizeY) / 2),
  };
}

function _clipboardGetAssociatedNotePosition(document, fallbackPosition = null) {
  if (document) return _clipboardGetDocumentCenter(document);
  return fallbackPosition;
}

function _clipboardCreateTextPageData(text, name = CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME) {
  return {
    name,
    type: "text",
    title: {
      show: true,
      level: 1,
    },
    text: {
      content: _clipboardConvertTextToHtml(text),
      format: _clipboardGetTextPageFormat(),
    },
  };
}

function _clipboardAppendHtmlContent(existingContent, newContent) {
  if (!existingContent?.trim()) return newContent;
  if (!newContent?.trim()) return existingContent;
  return `${existingContent}<hr>${newContent}`;
}

function _clipboardCreateSceneNoteData({entryId, pageId, position, text}) {
  return {
    entryId,
    pageId,
    text,
    x: position.x,
    y: position.y,
    texture: {
      src: _clipboardGetDefaultNoteIcon(),
    },
  };
}

module.exports = {
  _clipboardNormalizePastedText,
  _clipboardEscapeHtml,
  _clipboardExtractTextFromHtml,
  _clipboardConvertTextToHtml,
  _clipboardGetTextPreview,
  _clipboardGetTextPageFormat,
  _clipboardGetDefaultNoteIcon,
  _clipboardGetDocumentCenter,
  _clipboardGetAssociatedNotePosition,
  _clipboardCreateTextPageData,
  _clipboardAppendHtmlContent,
  _clipboardCreateSceneNoteData,
};
