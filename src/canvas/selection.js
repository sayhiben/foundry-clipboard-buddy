const legacy = require("./legacy");

module.exports = {
  _clipboardHasCopiedObjects: legacy._clipboardHasCopiedObjects,
  _clipboardGetControlledPlaceables: legacy._clipboardGetControlledPlaceables,
  _clipboardGetReplacementOrder: legacy._clipboardGetReplacementOrder,
  _clipboardResolveReplacementTargetFromCandidates: legacy._clipboardResolveReplacementTargetFromCandidates,
  _clipboardGetReplacementTarget: legacy._clipboardGetReplacementTarget,
};
