const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
  CLIPBOARD_IMAGE_TEXT_NOTE_FLAG,
  CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX,
  CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME,
} = require("./constants");
const {_clipboardLog} = require("./diagnostics");
const {
  _clipboardGetAssociatedNotePosition,
  _clipboardGetTextPreview,
  _clipboardCreateTextPageData,
  _clipboardAppendHtmlContent,
  _clipboardConvertTextToHtml,
  _clipboardGetTextPageFormat,
  _clipboardCreateSceneNoteData,
} = require("./text");

async function _clipboardCreateTextJournalEntry(text, name) {
  const journalEntry = await foundry.documents.JournalEntry.create({
    name: name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`,
    pages: [_clipboardCreateTextPageData(text, _clipboardGetTextPreview(text))],
  });

  return {
    entry: journalEntry,
    page: journalEntry?.pages?.contents?.[0] || null,
  };
}

async function _clipboardAppendTextToPage(page, text) {
  if (!page || page.type !== "text") {
    throw new Error("Cannot append pasted text to a non-text journal page");
  }

  const updatedContent = _clipboardAppendHtmlContent(page.text?.content || "", _clipboardConvertTextToHtml(text));
  await page.update({
    "text.content": updatedContent,
    "text.format": _clipboardGetTextPageFormat(),
  });
  return page;
}

function _clipboardGetAssociatedTextNoteData(document) {
  const currentValue = document?.getFlag?.(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG) || null;
  if (currentValue) return currentValue;

  return document?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] ||
    document?._source?.flags?.[CLIPBOARD_IMAGE_LEGACY_MODULE_ID]?.[CLIPBOARD_IMAGE_TEXT_NOTE_FLAG] ||
    null;
}

async function _clipboardEnsureAssociatedTextPage(document, text) {
  const noteData = _clipboardGetAssociatedTextNoteData(document);
  const existingEntry = noteData?.entryId ? game.journal?.get?.(noteData.entryId) : null;
  const existingPage = noteData?.pageId ? existingEntry?.pages?.get?.(noteData.pageId) : null;
  if (existingPage?.type === "text") {
    _clipboardLog("info", "Appending pasted text to existing placeable note page", {
      documentName: document.documentName,
      documentId: document.id,
      entryId: existingEntry.id,
      pageId: existingPage.id,
    });
    await _clipboardAppendTextToPage(existingPage, text);
    return {
      entry: existingEntry,
      page: existingPage,
      noteId: noteData?.noteId || null,
    };
  }

  const journalName = `${document.name || document.documentName} Notes`;
  if (existingEntry) {
    _clipboardLog("info", "Creating a new note page in an existing journal entry", {
      documentName: document.documentName,
      documentId: document.id,
      entryId: existingEntry.id,
    });
    const createdPages = await existingEntry.createEmbeddedDocuments("JournalEntryPage", [
      _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME),
    ]);
    return {
      entry: existingEntry,
      page: createdPages[0],
      noteId: noteData?.noteId || null,
    };
  }

  return {
    ...(await _clipboardCreateTextJournalEntry(text, journalName)),
    noteId: null,
  };
}

async function _clipboardEnsurePlaceableTextNote(document, text, fallbackPosition = null) {
  const position = _clipboardGetAssociatedNotePosition(document, fallbackPosition);
  const label = `${document.name || document.documentName} Notes`;
  const {entry, page, noteId} = await _clipboardEnsureAssociatedTextPage(document, text);
  if (!entry || !page || !position) {
    throw new Error("Failed to create or update a note journal for the selected placeable");
  }

  const existingNote = noteId ? canvas.scene?.notes?.get?.(noteId) : null;
  let note = existingNote;
  if (existingNote) {
    await existingNote.update({
      x: position.x,
      y: position.y,
      text: label,
      entryId: entry.id,
      pageId: page.id,
    });
  } else {
    const createdNotes = await canvas.scene.createEmbeddedDocuments("Note", [
      _clipboardCreateSceneNoteData({
        entryId: entry.id,
        pageId: page.id,
        position,
        text: label,
      }),
    ]);
    note = createdNotes[0];
  }

  await document.setFlag(CLIPBOARD_IMAGE_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG, {
    entryId: entry.id,
    pageId: page.id,
    noteId: note?.id || null,
  });
  const legacyModule = game?.modules?.get?.(CLIPBOARD_IMAGE_LEGACY_MODULE_ID);
  if (
    typeof document?.unsetFlag === "function" &&
    legacyModule?.active
  ) {
    try {
      await document.unsetFlag(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, CLIPBOARD_IMAGE_TEXT_NOTE_FLAG);
    } catch (error) {
      _clipboardLog("debug", "Unable to clear the legacy note flag scope after migration.", {
        documentName: document.documentName,
        documentId: document.id,
        legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
        error: error instanceof Error ? error.message : `${error}`,
      });
    }
  }

  _clipboardLog("info", "Created or updated a placeable text note", {
    documentName: document.documentName,
    documentId: document.id,
    entryId: entry.id,
    pageId: page.id,
    noteId: note?.id || null,
    position,
  });
  return true;
}

function _clipboardGetSceneNoteEntryAndPage(noteDocument) {
  const entry = noteDocument?.entryId ? game.journal?.get?.(noteDocument.entryId) : null;
  const page = noteDocument?.pageId ? entry?.pages?.get?.(noteDocument.pageId) : null;
  return {entry, page};
}

async function _clipboardEnsureSceneNoteTextPage(noteDocument, text) {
  const {entry, page} = _clipboardGetSceneNoteEntryAndPage(noteDocument);
  if (page?.type === "text") {
    _clipboardLog("info", "Appending pasted text to an existing selected scene note page", {
      noteId: noteDocument.id,
      entryId: entry.id,
      pageId: page.id,
    });
    await _clipboardAppendTextToPage(page, text);
    return {entry, page};
  }

  if (entry) {
    _clipboardLog("info", "Creating a new text page for a selected scene note", {
      noteId: noteDocument.id,
      entryId: entry.id,
    });
    const createdPages = await entry.createEmbeddedDocuments("JournalEntryPage", [
      _clipboardCreateTextPageData(text, CLIPBOARD_IMAGE_TEXT_NOTE_PAGE_NAME),
    ]);
    const createdPage = createdPages[0] || null;
    if (createdPage) {
      await noteDocument.update({
        pageId: createdPage.id,
      });
    }
    return {
      entry,
      page: createdPage,
    };
  }

  const noteName = noteDocument?.text || noteDocument?.name || `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${_clipboardGetTextPreview(text)}`;
  const created = await _clipboardCreateTextJournalEntry(text, noteName);
  if (created.entry?.id && created.page?.id) {
    await noteDocument.update({
      entryId: created.entry.id,
      pageId: created.page.id,
      text: noteName,
    });
  }
  return created;
}

async function _clipboardAppendTextToSceneNote(noteDocument, text) {
  const {entry, page} = await _clipboardEnsureSceneNoteTextPage(noteDocument, text);
  if (!entry || !page) {
    throw new Error("Failed to create or update a journal page for the selected scene note");
  }

  _clipboardLog("info", "Created or updated text for a selected scene note", {
    noteId: noteDocument?.id || null,
    entryId: entry.id,
    pageId: page.id,
  });
  return true;
}

async function _clipboardCreateStandaloneTextNote(text, context) {
  const position = context.mousePos;
  if (!position) return false;

  canvas?.notes?.activate?.();
  const preview = _clipboardGetTextPreview(text);
  const {entry, page} = await _clipboardCreateTextJournalEntry(text, `${CLIPBOARD_IMAGE_TEXT_NOTE_JOURNAL_PREFIX}: ${preview}`);
  await canvas.scene.createEmbeddedDocuments("Note", [
    _clipboardCreateSceneNoteData({
      entryId: entry.id,
      pageId: page.id,
      position,
      text: preview,
    }),
  ]);

  _clipboardLog("info", "Created standalone text note", {
    entryId: entry.id,
    pageId: page.id,
    position,
    preview,
  });
  return true;
}

module.exports = {
  _clipboardCreateTextJournalEntry,
  _clipboardAppendTextToPage,
  _clipboardGetAssociatedTextNoteData,
  _clipboardEnsureAssociatedTextPage,
  _clipboardEnsurePlaceableTextNote,
  _clipboardGetSceneNoteEntryAndPage,
  _clipboardEnsureSceneNoteTextPage,
  _clipboardAppendTextToSceneNote,
  _clipboardCreateStandaloneTextNote,
};
