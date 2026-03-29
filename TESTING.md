# Testing Guide

This module relies on manual QA in Foundry VTT. Use this guide as the working checklist for release validation and regression testing.

## Automated Coverage

This repository also ships a Playwright smoke suite under [test/README.md](./test/README.md) and [test/playwright/smoke.spec.js](./test/playwright/smoke.spec.js).

The automated suite is intended to cover stable browser-driven workflows such as:
- Canvas image paste into tiles and tokens
- Selected token and tile replacement, including multi-selection updates
- Canvas video paste and selected tile video replacement
- Mixed media-and-text clipboard payloads
- Contextual text note creation, append, tile-linked notes, and multi-placeable text paste
- Chat image and video paste, drag/drop, and upload
- Chat non-media URL fallback
- Direct media URL creation and replacement
- HTML media URL extraction, hidden-mode paste, scene-control fallbacks, and copied-object priority

Keep the manual checklist for:
- Real `navigator.clipboard.read()` permission behavior
- Cross-browser prompt differences
- Safari, iOS, and Android specific UX
- Forge or S3-compatible storage integrations
- Remote-host CORS or download failures
- Visual playback validation for animation and video

## Test Environment

Validate on Foundry VTT `13.351` as a GM with the module enabled.

Prepare a world with:
- One scene with a visible grid
- At least 2 tokens
- At least 2 tiles
- Notes enabled on the scene
- Chat docked and visible

Prepare these sample inputs:
- A static `.png` or `.jpg`
- A large image that exceeds normal token or tile sizes
- An animated `.gif`
- An animated `.webp`
- Browser-supported video media such as `.webm`, `.mp4`, `.m4v`, or `.ogg`
- A direct media URL
- A plain non-media URL
- One-line plain text
- Multi-line plain text with blank lines

If you support multiple browsers or hosts, test at least:
- Chrome or Edge desktop
- Firefox desktop
- Safari on macOS if available
- A mobile or touch browser if mobile support matters for the release

## Core Principles

These flows should stay true across the test matrix:

1. Chat-targeted paste should not also create scene content.
2. Canvas-targeted media paste should create or replace scene content, not chat content.
3. Canvas-targeted plain text should create or update Journal-backed scene notes.
4. Scene-control `Paste Media` and `Upload Media` actions are media-only tools.
5. Existing token or tile replacements must preserve position and dimensions.
6. New uploads should respect the configured upload destination.
7. Failed clipboard or remote-download paths should fail clearly without leaving partial scene state behind.
8. Settings and permission gates should disable features cleanly instead of rerouting paste into a different target unexpectedly.

## Release Checklist

### 1. Canvas Media Creation

1. Activate the Tiles layer, clear selection, and paste a static image.
   Expected: a new tile appears at the mouse position.
2. Activate the Tokens layer, clear selection, and paste a static image.
   Expected: a new token appears snapped to the grid, with its shortest side normalized to one grid square.
3. Double-click a newly pasted token.
   Expected: it opens normally for editing and does not warn about a missing Actor.
4. Paste a large image onto the Tiles layer.
   Expected: the created tile scales down to fit roughly one-third of the scene width while preserving aspect ratio.
5. Hold `Caps Lock` during media paste on the canvas.
   Expected: the newly created tile or token is hidden.
6. Copy a Foundry placeable, then paste media on the canvas with the normal keyboard or browser paste path.
   Expected: Foundry's copied-object buffer takes priority and the module does not create media.

### 2. Media Replacement

1. Select one token and paste a static image.
   Expected: only that token's texture updates; size and position stay unchanged.
2. Select one tile and paste a static image.
   Expected: only that tile's texture updates; size and position stay unchanged.
3. Select multiple tokens and paste media.
   Expected: every selected token updates in place.
4. Select multiple tiles and paste media.
   Expected: every selected tile updates in place.
5. Arrange a case where both tokens and tiles are selected on different layers, then paste once with Tokens active and once with Tiles active.
   Expected: the active layer's supported selection wins each time.

### 3. Animated And Video Media

1. Paste an animated `.gif` onto the canvas.
   Expected: it is accepted as image media without errors.
2. Paste an animated `.webp` onto the canvas.
   Expected: it is accepted as image media without errors.
3. Paste a supported video file onto the Tiles layer.
   Expected: a video tile is created with autoplay and loop enabled and muted volume.
4. Paste a supported video file onto the Tokens layer.
   Expected: a video-backed token is created, or a selected token is updated in place.
5. Replace a selected tile with video media.
   Expected: the tile keeps its size and position while the texture changes to the uploaded video.

### 4. Direct Media URL Handling

1. Paste a direct media URL onto the Tiles layer.
   Expected: the remote file is downloaded, uploaded into the configured destination, and created as a tile.
2. Paste a direct media URL onto the Tokens layer.
   Expected: the remote file is downloaded, uploaded, and created as a token or used for replacement if tokens are selected.
3. Paste a direct media URL that resolves to video.
   Expected: it follows the same create or replace rules as uploaded video media.
4. Paste a remote URL from a host that blocks browser-side downloads.
   Expected: canvas paste warns and does not create broken scene content; chat paste does not create an empty media message and instead leaves the original URL text in the chat input.

### 5. Contextual Plain-Text Notes

1. Select one token and paste one line of plain text onto the canvas.
   Expected: a Journal-backed scene note is created or reused for that token.
2. Paste more plain text onto the same token.
   Expected: the same linked note is reused and the Journal page content is appended.
3. Select one tile and paste plain text.
   Expected: the tile receives the same Journal-backed note behavior.
4. Select multiple supported placeables on the active layer and paste plain text.
   Expected: each selected placeable receives the pasted text in its linked note.
5. Clear selection and paste plain text onto open map space.
   Expected: a standalone scene note is created at the mouse position.
6. Paste multi-line text with blank lines onto open map space.
   Expected: paragraph breaks and line breaks are preserved in the created Journal page.
7. Move a token or tile that already has a linked note, then paste more text onto it.
   Expected: the same linked note is reused and its scene note position stays in sync with the placeable update flow.
8. Paste a plain non-media URL onto the canvas.
   Expected: it is treated as text for note creation rather than media.

### 6. Chat Media

1. Focus the chat input and paste a static image.
   Expected: chat posts a media message with a clickable thumbnail and an `Open full media` link.
2. Focus the chat input and paste an animated `.gif` or `.webp`.
   Expected: chat posts the uploaded media without creating canvas content.
3. Focus the chat input and paste supported video media.
   Expected: chat posts an inline video preview with an `Open full media` link.
4. Paste a direct media URL into chat.
   Expected: the remote file is downloaded, uploaded, and posted as chat media.
5. Paste a direct media URL into chat from a host that blocks browser-side downloads.
   Expected: no broken or empty media message is created, and the original URL text remains in the chat input.
6. Drag and drop image or video media onto the chat input.
   Expected: the dropped file is uploaded and posted as chat media.
7. Use the chat `Upload Chat Media` button.
   Expected: the file picker accepts image and video files and posts the selected media.

### 7. Chat Plain Text

1. Focus the chat input and paste plain text.
   Expected: it remains normal chat text.
2. Focus the chat input and paste a plain non-media URL.
   Expected: it remains normal chat text instead of being intercepted as media.
3. Focus the chat input and paste text that contains a non-direct media page URL.
   Expected: the module does not swallow the text or create broken chat media output.

### 8. Scene Controls And Fallback Paths

1. Use the scene-control `Paste Media` button with image data in the clipboard.
   Expected: it creates or replaces media without depending on keyboard shortcuts.
2. Use the scene-control `Paste Media` button when direct clipboard reads cannot expose the media payload.
   Expected: a focused paste prompt opens instead of creating broken content.
3. With that prompt open, use `Cmd+V` or `Ctrl+V` with copied local media.
   Expected: the prompt captures the native paste event, creates or replaces media, and closes itself.
4. Use the scene-control `Paste Media` button when no reliable mouse position is available.
   Expected: fallback placement uses canvas center when appropriate.
5. Use the scene-control `Upload Media` button.
   Expected: the selected file is uploaded and created with the same placement logic as pasted media.
6. Confirm that scene-control `Paste Media` and `Upload Media` do not create Journal notes from plain text.
   Expected: those tools stay media-only.

### 9. Upload Destination

1. Leave the upload destination at its default value and paste media.
   Expected: uploads land in `pasted_images`.
2. Change the upload destination to a world-scoped folder such as `worlds/<world-name>/pasted_images`.
   Expected: new uploads are created in that folder.
3. If your deployment uses The Forge or S3, switch to that source and paste media.
   Expected: directory creation and upload respect the configured FilePicker source.
4. For S3-compatible storage, confirm the upload-destination config shows the expected endpoint or base URL from Foundry's server configuration.
   Expected: the displayed endpoint matches the current provider configuration.
5. For S3-compatible storage, test a missing or invalid bucket selection.
   Expected: the module reports a clear upload error and does not create broken content.

### 10A. Error Reporting

1. Force a real module failure, such as selecting S3-compatible storage without a bucket and then pasting media.
   Expected: the acting user gets a short popup notification.
2. Repeat that failure while a GM is connected from another client.
   Expected: the GM receives a richer Clipboard Image error dialog with a downloadable module logfile link.
3. Enable `Verbose logging` on a client, then trigger the same failure again.
   Expected: that client automatically downloads a verbose Clipboard Image logfile in addition to the normal alert.

### 10. Browser And Platform Validation

1. In Chrome or Edge, test `Ctrl+V`, browser paste, direct media URLs, text-note creation, and upload fallback.
2. On macOS, test `Cmd+V` for both media and contextual text paste.
   Expected: native keyboard paste works through the browser `paste` event, including Finder-copied local media files.
3. In Firefox, test browser paste events plus the upload fallback.
   Expected: if direct clipboard reads are unavailable or prompt-gated, browser paste and upload still cover the workflow.
4. On Safari or a touch-oriented browser, test the explicit scene-control buttons and chat upload path.
   Expected: touch-friendly controls remain usable even when async clipboard reads are restricted.
5. On an untrusted origin or raw IP address, test explicit paste and upload actions.
   Expected: clipboard-read restrictions fail gracefully while browser paste gestures or uploads still work where supported.

### 11. Settings And Permission Gates

1. Raise `Minimum role for canvas media paste` above the current user's role and try canvas media paste.
   Expected: no token or tile is created or replaced.
2. Raise `Minimum role for canvas text paste` above the current user's role and try canvas text paste.
   Expected: no Journal note is created or updated.
3. Raise `Minimum role for chat media paste` above the current user's role and try chat media paste and chat upload.
   Expected: no chat media post is created and the chat upload button is hidden if chat media handling is disabled.
4. Disable token creation and paste media with no selection while token creation would otherwise be targeted.
   Expected: the paste is ignored rather than silently creating a tile.
5. Disable tile creation and paste media with no selection while tile creation would otherwise be targeted.
   Expected: the paste is ignored rather than silently creating a token.
6. Disable token replacement and paste onto selected tokens.
   Expected: selected tokens are not changed.
7. Disable tile replacement and paste onto selected tiles.
   Expected: selected tiles are not changed.
8. Log in as a player who owns one token and try selected-token replacement.
   Expected: owned tokens can still be replaced when token replacement is enabled.
9. As that same player, try replacing a token or tile the player does not own.
   Expected: the paste does not replace that placeable.
10. Toggle `Allow non-GMs to use scene controls`.
   Expected: scene-control buttons hide or appear accordingly for eligible non-GM users.
11. Toggle `Default empty-canvas paste target` between active layer, tile, and token.
   Expected: new pasted media follows the configured target consistently.
12. Toggle `Create backing Actors for pasted tokens`.
   Expected: when enabled, newly pasted tokens open normally for editing; when disabled, pasted tokens are actorless.
13. Toggle `Chat media display`.
   Expected: chat posts switch between full preview, thumbnail preview, and link-only output.
14. Toggle `Canvas text paste mode` to `Disabled`.
   Expected: plain text canvas paste no longer creates scene notes.
15. Toggle `Scene Paste Media prompt mode` between `Auto`, `Always show prompt`, and `Never show prompt`.
   Expected: the explicit scene-control paste button follows the configured behavior.

### 12. Regression Watchlist

Review the browser console while testing and confirm:
- With `Verbose logging` enabled, clipboard-image logs clearly describe clipboard parsing, upload destination, media download, paste routing, and create vs replace outcomes
- No unhandled exceptions are emitted in successful flows
- Expected failures show clear notifications
- Expected failures reach the acting user, connected GMs, and verbose-debug clients through the new error-reporting flow
- Chat-targeted paste never duplicates onto the canvas
- Selected-placeable replacement never resizes or repositions existing tokens or tiles
- Contextual text paste never creates duplicate note pins for the same linked placeable unless intended
- Upload destination changes apply to new uploads without breaking prior assets
- Feature toggles disable the intended workflow without redirecting paste into some other create path
- If `vtta-tokenizer` is open, media paste is still suppressed as intended

## Suggested Test Passes

For a quick sanity pass before a small release:
- One browser on desktop
- Canvas image create and replace
- Canvas video create
- Chat image and video paste
- Text note create and append
- Upload destination override

For a fuller release pass:
- Chrome or Edge
- Firefox
- macOS `Cmd+V`, including Finder-copied local media files
- Explicit scene-control paste and upload
- Direct media URL success and failure cases
- Mobile or touch-friendly upload flow

## Notes For Contributors

When adding a new paste target, media type, or browser fallback:
- Add at least one happy-path case to this guide
- Add at least one failure-mode or regression case if the new path can fail due to browser permissions, remote hosts, or destination configuration
- Update the README if the user-facing workflow changes
