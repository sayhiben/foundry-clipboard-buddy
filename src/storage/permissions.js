const legacy = require("./legacy");

module.exports = {
  _clipboardIsStoragePermissionError: legacy._clipboardIsStoragePermissionError,
  _clipboardGetCurrentUserRole: legacy._clipboardGetCurrentUserRole,
  _clipboardGetCorePermissionRoles: legacy._clipboardGetCorePermissionRoles,
  _clipboardUserHasCorePermission: legacy._clipboardUserHasCorePermission,
  _clipboardHasCoreFileUploadPermissions: legacy._clipboardHasCoreFileUploadPermissions,
  _clipboardBuildStoragePermissionDestinationLabel: legacy._clipboardBuildStoragePermissionDestinationLabel,
  _clipboardBuildStoragePermissionResolution: legacy._clipboardBuildStoragePermissionResolution,
  _clipboardAssertUploadDestination: legacy._clipboardAssertUploadDestination,
  _clipboardWrapStoragePermissionError: legacy._clipboardWrapStoragePermissionError,
};
