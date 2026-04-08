// @ts-nocheck

const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_TITLE,
  CLIPBOARD_IMAGE_FORM_APPLICATION,
} = require("../constants");
const {
  _clipboardGetShippedDefaultSettings,
  _clipboardDescribeSettingValue,
  _clipboardGetRegisteredSettingConfig,
  _clipboardGetSetting,
} = require("./schema");

function _clipboardGetSettingsThatDifferFromDefaults({scope = "world", config = true} = {}) {
  const defaults = _clipboardGetShippedDefaultSettings({scope, config});
  return Object.entries(defaults)
    .reduce((differences, [key, defaultValue]) => {
      const currentValue = _clipboardGetSetting(key);
      if (currentValue === defaultValue) return differences;

      differences.push({
        key,
        currentValue,
        defaultValue,
        displayName: _clipboardGetRegisteredSettingConfig(CLIPBOARD_IMAGE_MODULE_ID, key)?.name || key,
      });
      return differences;
    }, [])
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

function _clipboardCreateDialogButtonLabel(iconClassName, label) {
  const safeLabel = foundry.utils.escapeHTML(label || "");
  const safeIconClassName = foundry.utils.escapeHTML(iconClassName || "");
  return safeIconClassName
    ? `<i class="${safeIconClassName}"></i> ${safeLabel}`
    : safeLabel;
}

async function _clipboardApplyShippedDefaults({scope = "world", config = true} = {}) {
  const differences = _clipboardGetSettingsThatDifferFromDefaults({scope, config});
  for (const difference of differences) {
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, difference.key, difference.defaultValue);
  }
  return differences.map(difference => difference.key);
}

class FoundryPasteEaterRecommendedDefaultsConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  async render(force, options) {
    const differences = _clipboardGetSettingsThatDifferFromDefaults();
    const summary = differences.length
      ? `<p>This world differs from the current ${CLIPBOARD_IMAGE_TITLE} recommended behavior defaults in <strong>${differences.length}</strong> configurable world setting${differences.length === 1 ? "" : "s"}.</p>`
      : `<p>This world already matches the current ${CLIPBOARD_IMAGE_TITLE} configurable behavior defaults.</p>`;
    const details = differences.length
      ? `<ul>${differences.map(difference => `<li><strong>${foundry.utils.escapeHTML(difference.displayName)}</strong>: ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.currentValue))} -> ${foundry.utils.escapeHTML(_clipboardDescribeSettingValue(difference.key, difference.defaultValue))}</li>`).join("")}</ul>`
      : "";
    const scopeNote = "<p>Only configurable world behavior settings are changed here. Upload destination and client-only diagnostics stay untouched.</p>";

    const dialog = new globalThis.Dialog({
      title: `${CLIPBOARD_IMAGE_TITLE}: Apply Recommended Defaults`,
      content: `${summary}${scopeNote}${details}`,
      buttons: differences.length
        ? {
          apply: {
            label: _clipboardCreateDialogButtonLabel(
              "fa-solid fa-wand-magic-sparkles",
              `Apply ${differences.length} Change${differences.length === 1 ? "" : "s"}`
            ),
            callback: async () => {
              const updatedKeys = await _clipboardApplyShippedDefaults();
              if (!updatedKeys.length) return;
              ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Applied ${updatedKeys.length} recommended world setting${updatedKeys.length === 1 ? "" : "s"}.`);
            },
          },
          cancel: {
            label: _clipboardCreateDialogButtonLabel("fa-solid fa-xmark", "Cancel"),
          },
        }
        : {
          close: {
            label: _clipboardCreateDialogButtonLabel("fa-solid fa-check", "Close"),
          },
        },
      default: differences.length ? "apply" : "close",
    });

    return dialog.render(force, options);
  }
}

module.exports = {
  FoundryPasteEaterRecommendedDefaultsConfig,
  _clipboardCreateDialogButtonLabel,
  _clipboardGetSettingsThatDifferFromDefaults,
  _clipboardApplyShippedDefaults,
};
