const legacy = require("./legacy");

module.exports = {
  CLIPBOARD_IMAGE_SHIPPED_DEFAULTS: legacy.CLIPBOARD_IMAGE_SHIPPED_DEFAULTS,
  CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS: legacy.CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS,
  _clipboardGetShippedDefaultValue: legacy._clipboardGetShippedDefaultValue,
  _clipboardGetShippedDefaultSettings: legacy._clipboardGetShippedDefaultSettings,
  _clipboardDescribeSettingValue: legacy._clipboardDescribeSettingValue,
  _clipboardGetRegisteredSettingConfig: legacy._clipboardGetRegisteredSettingConfig,
  _clipboardGetSettingScope: legacy._clipboardGetSettingScope,
  _clipboardGetSettingsStorage: legacy._clipboardGetSettingsStorage,
  _clipboardGetStoredSettingDocument: legacy._clipboardGetStoredSettingDocument,
  _clipboardHasStoredSetting: legacy._clipboardHasStoredSetting,
  _clipboardGetStoredSettingValue: legacy._clipboardGetStoredSettingValue,
  _clipboardGetSetting: legacy._clipboardGetSetting,
};
