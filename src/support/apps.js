const {
  CLIPBOARD_IMAGE_FORM_APPLICATION,
  CLIPBOARD_IMAGE_TITLE,
} = require("../constants");
const {FoundryPasteEaterDestinationConfig} = require("../config-app");
const {FoundryPasteEaterRecommendedDefaultsConfig} = require("../settings/recommended-defaults");
const {_clipboardCollectSupportBundle, _clipboardDownloadSupportBundle} = require("./bundle");
const {_clipboardCollectMediaAuditReport, _clipboardDownloadMediaAuditReport} = require("./media-audit");
const {_clipboardGetReadinessReport} = require("./readiness");

class FoundryPasteEaterReadinessSupportConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "foundry-paste-eater-readiness-support",
      title: `${CLIPBOARD_IMAGE_TITLE}: Readiness & Support`,
      template: "modules/foundry-paste-eater/templates/readiness-support.hbs",
      width: 720,
      height: "auto",
      closeOnSubmit: false,
      submitOnChange: false,
    });
  }

  getData() {
    const report = _clipboardGetReadinessReport();
    return {
      report,
      statusCounts: report.statusCounts,
      sections: report.sections,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="open-upload-destination"]').on("click", event => this._onOpenUploadDestination(event));
    html.find('[data-action="open-recommended-defaults"]').on("click", event => this._onOpenRecommendedDefaults(event));
    html.find('[data-action="download-support-bundle"]').on("click", event => this._onDownloadSupportBundle(event));
  }

  async _onOpenUploadDestination(event) {
    event.preventDefault();
    const app = new FoundryPasteEaterDestinationConfig();
    await app.render(true);
  }

  async _onOpenRecommendedDefaults(event) {
    event.preventDefault();
    const app = new FoundryPasteEaterRecommendedDefaultsConfig();
    await app.render(true);
  }

  _onDownloadSupportBundle(event) {
    event.preventDefault();
    const bundle = _clipboardCollectSupportBundle();
    _clipboardDownloadSupportBundle(bundle);
    ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Downloaded a support bundle.`);
  }
}

class FoundryPasteEaterUploadedMediaAuditConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "foundry-paste-eater-uploaded-media-audit",
      title: `${CLIPBOARD_IMAGE_TITLE}: Uploaded Media Audit`,
      template: "modules/foundry-paste-eater/templates/uploaded-media-audit.hbs",
      width: 760,
      height: "auto",
      closeOnSubmit: false,
      submitOnChange: false,
    });
  }

  getData() {
    const report = _clipboardCollectMediaAuditReport();
    return {
      report,
      groups: report.groups,
      summary: report.summary,
      uploadRoots: report.uploadRoots,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="download-media-audit"]').on("click", event => this._onDownloadMediaAudit(event));
  }

  _onDownloadMediaAudit(event) {
    event.preventDefault();
    const report = _clipboardCollectMediaAuditReport();
    _clipboardDownloadMediaAuditReport(report);
    ui.notifications.info(`${CLIPBOARD_IMAGE_TITLE}: Downloaded the uploaded media audit report.`);
  }
}

module.exports = {
  FoundryPasteEaterReadinessSupportConfig,
  FoundryPasteEaterUploadedMediaAuditConfig,
};
