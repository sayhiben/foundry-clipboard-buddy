const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
} = require("../constants");
const {_clipboardLog} = require("../diagnostics");
const {
  CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS,
  _clipboardGetSettingScope,
  _clipboardHasStoredSetting,
  _clipboardGetStoredSettingValue,
} = require("./schema");

async function _clipboardMigrateLegacySettings() {
  if (CLIPBOARD_IMAGE_MODULE_ID === CLIPBOARD_IMAGE_LEGACY_MODULE_ID) return [];

  const migrated = [];
  for (const key of CLIPBOARD_IMAGE_SETTINGS_MIGRATION_KEYS) {
    const scope = _clipboardGetSettingScope(key);
    if (scope === "world" && !game?.user?.isGM) continue;
    if (_clipboardHasStoredSetting(CLIPBOARD_IMAGE_MODULE_ID, key)) continue;

    const legacyValue = _clipboardGetStoredSettingValue(CLIPBOARD_IMAGE_LEGACY_MODULE_ID, key);
    if (legacyValue === undefined) continue;

    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, key, legacyValue);
    migrated.push(key);
  }

  if (migrated.length) {
    _clipboardLog("info", "Migrated legacy module settings to the new namespace.", {
      legacyModuleId: CLIPBOARD_IMAGE_LEGACY_MODULE_ID,
      moduleId: CLIPBOARD_IMAGE_MODULE_ID,
      settings: migrated,
    });
  }

  return migrated;
}

module.exports = {
  _clipboardMigrateLegacySettings,
};
