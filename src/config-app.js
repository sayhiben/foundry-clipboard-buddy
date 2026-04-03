const {
  CLIPBOARD_IMAGE_MODULE_ID,
  CLIPBOARD_IMAGE_DEFAULT_FOLDER,
  CLIPBOARD_IMAGE_SOURCE_AUTO,
  CLIPBOARD_IMAGE_SOURCE_S3,
  CLIPBOARD_IMAGE_FILE_PICKER,
  CLIPBOARD_IMAGE_FORM_APPLICATION,
} = require("./constants");
const {
  _clipboardResolveSource,
  _clipboardCanSelectSource,
  _clipboardGetStoredSource,
  _clipboardGetTargetFolder,
  _clipboardGetStoredBucket,
  _clipboardGetConfiguredS3Endpoint,
  _clipboardGetConfiguredUploadRoot,
  _clipboardGetUploadDestination,
  _clipboardDescribeDestination,
  _clipboardGetSourceChoices,
} = require("./storage");
const {
  _clipboardCreateUploadRootKey,
  _clipboardRememberKnownUploadRoots,
} = require("./support/known-roots");

class FoundryPasteEaterDestinationConfig extends CLIPBOARD_IMAGE_FORM_APPLICATION {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "foundry-paste-eater-destination-config",
      title: "Foundry Paste Eater: Upload Destination",
      template: "modules/foundry-paste-eater/templates/upload-destination.hbs",
      width: 520,
      closeOnSubmit: true,
    });
  }

  getData() {
    const source = _clipboardGetStoredSource();
    const target = _clipboardGetTargetFolder();
    const bucket = _clipboardGetStoredBucket();
    const destination = _clipboardGetUploadDestination({storedSource: source, target, bucket});

    return {
      bucket,
      destinationSummary: _clipboardDescribeDestination(destination),
      isS3: destination.storedSource === CLIPBOARD_IMAGE_SOURCE_S3,
      s3Endpoint: _clipboardGetConfiguredS3Endpoint(),
      source,
      sourceChoices: _clipboardGetSourceChoices(source),
      target,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const sourceField = html.find('[name="source"]');
    const targetField = html.find('[name="target"]');
    const bucketField = html.find('[name="bucket"]');

    sourceField.on("change", () => this._refreshFormState());
    targetField.on("input", () => this._refreshFormState());
    bucketField.on("input", () => this._refreshFormState());
    html.find('[data-action="browse-destination"]').on("click", event => this._onBrowseDestination(event));

    this._refreshFormState();
  }

  _ensureSourceOption(source) {
    const sourceField = this.form?.elements?.source;
    if (!sourceField || !source) return;
    const choices = Array.from(sourceField.options).map(option => option.value);
    if (choices.includes(source)) return;

    const option = document.createElement("option");
    option.value = source;
    option.text = `Custom (${source})`;
    sourceField.add(option);
  }

  _refreshFormState() {
    const form = this.form;
    if (!form) return;

    const storedSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const target = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const bucket = storedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? form.elements.bucket.value?.trim() || "" : "";
    const destination = _clipboardGetUploadDestination({storedSource, target, bucket});
    const summaryField = form.querySelector('[data-role="destination-summary"]');
    const endpointField = form.querySelector('[data-role="s3-endpoint"]');
    const bucketGroup = this.element.find(".foundry-paste-eater-s3-bucket");
    const endpointGroup = this.element.find(".foundry-paste-eater-s3-endpoint");

    if (summaryField) summaryField.value = _clipboardDescribeDestination(destination);
    if (endpointField) endpointField.value = destination.endpoint || "";
    bucketGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
    endpointGroup.toggleClass("hidden", storedSource !== CLIPBOARD_IMAGE_SOURCE_S3);
  }

  _applyPickerSelection(path, picker, previousStoredSource) {
    const form = this.form;
    if (!form) return;

    const selectedSource = picker.activeSource || _clipboardResolveSource(previousStoredSource);
    if (!_clipboardCanSelectSource(selectedSource)) {
      ui.notifications.warn("Foundry Paste Eater: The selected file source does not support pasted uploads.");
      return;
    }

    const keepAutomatic = previousStoredSource === CLIPBOARD_IMAGE_SOURCE_AUTO &&
      selectedSource === _clipboardResolveSource(CLIPBOARD_IMAGE_SOURCE_AUTO);
    const bucket = selectedSource === CLIPBOARD_IMAGE_SOURCE_S3 ? picker.sources?.s3?.bucket || "" : "";

    this._ensureSourceOption(selectedSource);
    form.elements.source.value = keepAutomatic ? CLIPBOARD_IMAGE_SOURCE_AUTO : selectedSource;
    form.elements.target.value = path || picker.target || form.elements.target.value;
    form.elements.bucket.value = bucket;
    this._refreshFormState();
  }

  _onBrowseDestination(event) {
    event.preventDefault();

    const form = this.form;
    if (!form) return;

    const previousStoredSource = form.elements.source.value || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const activeSource = _clipboardResolveSource(previousStoredSource);
    const currentTarget = form.elements.target.value?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const currentBucket = form.elements.bucket.value?.trim() || "";
    const picker = new CLIPBOARD_IMAGE_FILE_PICKER({
      activeSource,
      button: event.currentTarget,
      callback: path => this._applyPickerSelection(path, picker, previousStoredSource),
      current: currentTarget,
      field: form.elements.target,
      type: "folder",
    });

    if (activeSource === CLIPBOARD_IMAGE_SOURCE_S3) {
      picker.sources.s3 = picker.sources.s3 || {target: currentTarget};
      picker.sources.s3.bucket = currentBucket || picker.sources.s3.bucket;
      picker.sources.s3.target = currentTarget;
    }

    void picker.render(true);
  }

  async _updateObject(_event, formData) {
    const previousRoot = _clipboardGetConfiguredUploadRoot();
    const source = formData.source?.trim() || CLIPBOARD_IMAGE_SOURCE_AUTO;
    const target = formData.target?.trim() || CLIPBOARD_IMAGE_DEFAULT_FOLDER;
    const bucket = source === CLIPBOARD_IMAGE_SOURCE_S3 ? formData.bucket?.trim() || "" : "";

    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-source", source);
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location", target);
    await game.settings.set(CLIPBOARD_IMAGE_MODULE_ID, "image-location-bucket", bucket);

    const nextRoot = _clipboardGetConfiguredUploadRoot({storedSource: source, target, bucket});
    const rootsToRemember = _clipboardCreateUploadRootKey(previousRoot) === _clipboardCreateUploadRootKey(nextRoot)
      ? [nextRoot]
      : [previousRoot, nextRoot];
    await _clipboardRememberKnownUploadRoots(rootsToRemember);
  }
}

module.exports = {
  FoundryPasteEaterDestinationConfig,
};
