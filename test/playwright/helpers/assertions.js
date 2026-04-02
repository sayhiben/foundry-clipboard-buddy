const legacy = require("./legacy-foundry");

module.exports = {
  getCanvasDimensions: legacy.getCanvasDimensions,
  getJournalEntry: legacy.getJournalEntry,
  getNewDocuments: legacy.getNewDocuments,
  getNoteDocument: legacy.getNoteDocument,
  getStateSnapshot: legacy.getStateSnapshot,
  getTileDocument: legacy.getTileDocument,
  getTokenDocument: legacy.getTokenDocument,
};
