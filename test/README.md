# Playwright Smoke Tests

This repository now includes a Playwright smoke suite for the automatable subset of the module's Foundry workflows.

The unit suite lives separately under `test/unit/` and is organized by behavior domain rather than by one large catch-all spec file.

## Scope

The suite is designed to cover the browser-driven flows that can be validated against a running Foundry world:
- Canvas image paste into Tiles
- Canvas image paste into Tokens
- Selected token and tile replacement
- Mixed file-and-text paste payloads
- Contextual plain-text note creation and append
- Non-media URL fallback to contextual text notes
- HTML `img[src]` media URL extraction
- Hidden-mode paste with `Caps Lock`
- Chat media paste
- Chat non-media URL fallback
- Direct media URL paste
- Scene-control paste and upload fallbacks
- Multi-item async clipboard-read handling
- Copied-object priority handling
- Chat upload button flow

It intentionally does not try to replace all manual QA. Browser permission prompts, real `navigator.clipboard.read()` behavior, Safari/iOS/Android specifics, remote-host CORS failures, Forge/S3 integration, and visual animation/video playback still belong in manual testing.

## Prerequisites

1. Install dependencies:
   `npm install`
2. Install the Playwright browser used by the suite:
   `npx playwright install chromium`
3. Start Foundry VTT and make sure:
   - the `clipboard-image` module is enabled
   - you can log in as a GM
   - a scene is active and the canvas loads normally

## Configuration

The suite uses these environment variables:

- `FOUNDRY_URL`
  Full URL to the Foundry page you want Playwright to open. This can be a base Foundry URL or a direct join URL. Defaults to `http://127.0.0.1:30000`.
- `FOUNDRY_USER`
  GM user name or user id for login, when a saved storage state is not provided.
- `FOUNDRY_PASSWORD`
  Password for the selected user, when required by the world.
- `FOUNDRY_STORAGE_STATE`
  Optional Playwright storage-state JSON path for a pre-authenticated session.
- `PW_BROWSER`
  Browser name for the Playwright project. Defaults to `chromium`.
- `PW_HEADLESS`
  Set to `false` to run headed.

Examples:

```bash
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_USER=Gamemaster \
FOUNDRY_PASSWORD=secret \
npm run test:smoke
```

```bash
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_STORAGE_STATE=test/.auth/gm.json \
npm run test:headed
```

## Commands

- `npm run test:smoke`
  Run the Playwright smoke suite.
- `npm run test:headed`
  Run the smoke suite in a headed browser.
- `npm test`
  Run the unit suite and coverage checks without launching Foundry.
- `npm run test:install`
  Install the default Chromium browser for Playwright.
- `npm run test:list`
  List the discovered Playwright tests without executing them.

## Notes

- The suite uses the active scene and creates temporary artifacts inside it, then cleans up the created scene documents and journals after each test.
- Uploaded media files remain in the configured `playwright` upload subfolders. They are isolated by test run id but are not automatically deleted from disk.
- The tests drive Foundry through real DOM `paste` and file-upload paths and assert against Foundry document state through `canvas.scene`, `game.messages`, and `game.journal`.
- Each test temporarily enables the module's `Verbose logging` setting and relays `Clipboard Image [...]` browser-console lines into the Playwright output, which makes failures much easier to diagnose.
