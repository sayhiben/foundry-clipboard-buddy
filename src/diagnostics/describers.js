const legacy = require("./legacy");

module.exports = {
  _clipboardDescribeFile: legacy._clipboardDescribeFile,
  _clipboardDescribeDestinationForLog: legacy._clipboardDescribeDestinationForLog,
  _clipboardDescribeReplacementTarget: legacy._clipboardDescribeReplacementTarget,
  _clipboardDescribePasteContext: legacy._clipboardDescribePasteContext,
  _clipboardDescribeClipboardItems: legacy._clipboardDescribeClipboardItems,
  _clipboardDescribeDataTransfer: legacy._clipboardDescribeDataTransfer,
  _clipboardDescribeImageInput: legacy._clipboardDescribeImageInput,
};
