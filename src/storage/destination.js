const legacy = require("./legacy");

module.exports = {
  _clipboardUsingTheForge: legacy._clipboardUsingTheForge,
  _clipboardGetStoredSource: legacy._clipboardGetStoredSource,
  _clipboardResolveSource: legacy._clipboardResolveSource,
  _clipboardGetSourceLabel: legacy._clipboardGetSourceLabel,
  _clipboardGetSourceChoices: legacy._clipboardGetSourceChoices,
  _clipboardCanSelectSource: legacy._clipboardCanSelectSource,
  _clipboardGetStoredBucket: legacy._clipboardGetStoredBucket,
  _clipboardGetConfiguredS3Endpoint: legacy._clipboardGetConfiguredS3Endpoint,
  _clipboardGetTargetFolder: legacy._clipboardGetTargetFolder,
  _clipboardGetUploadPathOrganizationSetting: legacy._clipboardGetUploadPathOrganizationSetting,
  _clipboardGetUploadContextSegment: legacy._clipboardGetUploadContextSegment,
  _clipboardNormalizeUploadPathSegment: legacy._clipboardNormalizeUploadPathSegment,
  _clipboardBuildOrganizedUploadTarget: legacy._clipboardBuildOrganizedUploadTarget,
  _clipboardGetUploadDestination: legacy._clipboardGetUploadDestination,
  _clipboardGetFilePickerOptions: legacy._clipboardGetFilePickerOptions,
  _clipboardDescribeDestination: legacy._clipboardDescribeDestination,
};
