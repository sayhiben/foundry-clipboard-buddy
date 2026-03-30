# Playwright Smoke Tests

This repository now includes a Playwright smoke suite for the automatable subset of the module's Foundry workflows.

The unit suite lives separately under `test/unit/` and is organized by behavior domain rather than by one large catch-all spec file.

## Scope

The suite is designed to cover the browser-driven flows that can be validated against a running Foundry world:
- Canvas image paste into Tiles
- Canvas image paste into Tokens
- Selected token and tile replacement, including multi-selection updates
- Selected note icon replacement
- Canvas video paste into Tiles and Tokens
- Selected tile replacement with video media
- Mixed file-and-text paste payloads
- Contextual plain-text note creation, append, selected-tile note creation, selected-note append, and multi-placeable text application
- Focused Actor, Item, and token-config art-field routing
- Non-media URL fallback to contextual text notes
- HTML `img[src]` media URL extraction
- Hidden-mode paste with `Caps Lock`
- Chat media paste, video paste, drag/drop, and upload
- Chat plain-text and non-media URL fallback
- Direct media URL paste for creation and replacement
- Scene-control paste, upload, and manual-paste prompt fallbacks
- Multi-item async clipboard-read handling
- Copied-object priority handling
- Chat upload button flow
- Behavior-setting flows in `test/playwright/config.spec.js`, including empty-canvas targeting, backing-actor creation, chat display modes, canvas text mode, prompt mode, and upload-destination persistence
- Permissions and feature-toggle flows in `test/playwright/permissions.spec.js`, including non-GM scene controls, minimum-role gates, and owned-token replacement
- Error-reporting flows in `test/playwright/error-reporting.spec.js`, including player alerts, GM relay dialogs, and verbose logfile download behavior

It intentionally does not try to replace all manual QA. Browser permission prompts, real `navigator.clipboard.read()` behavior, Safari/iOS/Android specifics, remote-host CORS failures, Forge integration, and visual animation/video playback still belong in manual testing.

S3-compatible storage is covered separately by an opt-in smoke spec when you provide a live bucket and a Foundry server that is already configured for S3. The S3 smoke now tries to refresh the Foundry-side AWS session from your current AWS CLI credentials before it starts, and it can also inject a custom S3-compatible endpoint into Foundry's AWS JSON config before restart.

## Prerequisites

1. Install dependencies:
   `npm install`
2. Install the Playwright browser used by the suite:
   `npx playwright install chromium`
3. Start Foundry VTT and make sure:
   - the `foundry-paste-eater` module is enabled
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
  If the selected Foundry user has a blank password, make sure you unset any inherited `FOUNDRY_PASSWORD` environment variable instead of accidentally reusing a stale value.
- `FOUNDRY_STORAGE_STATE`
  Optional Playwright storage-state JSON path for a pre-authenticated session. If omitted, Playwright global setup logs in once as the default GM user and writes a reusable storage-state file under `test/playwright/.auth/`.
- `PW_BROWSER`
  Browser name for the Playwright project. Defaults to `chromium`.
- `PW_HEADLESS`
  Set to `true` to force headless. Local default is headed because Foundry and PIXI are more reliable there; CI still defaults to headless. The local Playwright config now runs headless Chromium through the full `chromium` channel with software-WebGL flags so Foundry can initialize without the PIXI `getExtension` crash or the `chrome-headless-shell` 90% loading stall.
- `FOUNDRY_S3_BUCKET`
  Optional bucket name for the opt-in S3-compatible storage smoke spec in `test/playwright/s3.spec.js`.
- `FOUNDRY_S3_REFRESH`
  Optional. Defaults to `true`. Set to `false` to disable the pre-test refresh of Foundry's S3 credentials from the AWS CLI session.
- `FOUNDRY_S3_AWS_CONFIG_PATH`
  Optional explicit path to the Foundry AWS JSON config file that should be refreshed before the S3 smoke runs.
- `FOUNDRY_DOCKER_CONTAINER`
  Optional Docker container name or id for the running Foundry server. If omitted, the S3 smoke tries to auto-detect a container that exposes the current Foundry port and a bind-mounted `/data` directory.
- `FOUNDRY_S3_RESTART_COMMAND`
  Optional shell command to restart Foundry after the S3 config file is refreshed. This is useful when your Foundry server is not running in Docker.
- `FOUNDRY_S3_ENDPOINT`
  Optional custom S3-compatible endpoint or base URL to write into Foundry's AWS JSON config before the S3 smoke runs. Useful for Cloudflare R2, MinIO, and similar providers.
- `FOUNDRY_S3_FORCE_PATH_STYLE`
  Optional boolean override written into Foundry's AWS JSON config before the S3 smoke runs. Set this when your S3-compatible provider requires path-style URLs.

Examples:

```bash
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_USER=Gamemaster \
FOUNDRY_PASSWORD=secret \
npm run test:smoke
```

```bash
env -u FOUNDRY_PASSWORD \
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_USER=Gamemaster \
npm run test:smoke
```

```bash
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_STORAGE_STATE=test/.auth/gm.json \
npm run test:headed
```

```bash
FOUNDRY_URL=http://127.0.0.1:30000 \
FOUNDRY_USER=Gamemaster \
FOUNDRY_S3_BUCKET=foundry-store \
npm run test:smoke:s3
```

## Commands

- `npm run test:smoke`
  Run the Playwright smoke suite. This is headed by default in local development.
- `npm run test:headed`
  Run the smoke suite in a headed browser explicitly.
- `npm run test:smoke:s3`
  Run the opt-in S3-compatible storage smoke spec. By default it refreshes the Foundry-side AWS session from `aws configure export-credentials --format process`, updates the configured Foundry AWS JSON file, and restarts the Foundry server when it can auto-detect a Dockerized `/data` mount or when you provide an explicit restart command.
- `npm test`
  Run the unit suite and coverage checks without launching Foundry.
- `npm run test:install`
  Install the default Chromium browser for Playwright.
- `npm run test:list`
  List the discovered Playwright tests without executing them.

## Notes

- The main single-user browser specs (`smoke.spec.js`, `config.spec.js`, and `s3.spec.js`) reuse one authenticated Foundry page per spec worker instead of logging in again for every test. That shared page is reloaded in `beforeEach` so the DOM starts clean without paying the full login cost repeatedly.
- Multi-user specs still create separate authenticated contexts per user, but they reuse cached storage state where possible instead of rejoining from scratch on every session.
- The suite uses the active scene and creates temporary artifacts inside it, then cleans up the created scene documents and journals after each test.
- In this local setup, Foundry loads the live module from `/Users/sayhiben/dev/foundry-latest/userdata/Data/modules/foundry-paste-eater`, not directly from the repo root. After changing runtime files, sync the repo into that module directory before trusting browser smoke or manual validation.
- If the local world boots without an active scene, the Playwright harness now activates an existing scene or creates a temporary one before continuing so `canvas.ready` can succeed.
- The permissions smoke spec reseeds the local QA users from Foundry's world user store before it runs. The expected local roles are `Gamemaster` and `Clipboard QA 1` as GMs, with `Clipboard QA 2` and `Clipboard QA 3` as Players.
- Local Playwright runs default to headed Chromium because Foundry's graphics stack is not reliable under headless Chromium in this environment.
- When local headless Chromium is necessary, keep both parts of the workaround in `playwright.config.js`: use the full `chromium` channel and keep the software-WebGL launch flags. Removing either one reintroduces a Foundry bootstrap failure in this environment.
- Keyboard paste coverage follows the browser's native `paste` event. The module's explicit `Paste Media` scene tool is the only path that still depends on `navigator.clipboard.read()`.
- Uploaded media files remain in the configured `playwright` upload subfolders. They are isolated by test run id but are not automatically deleted from disk.
- Player media-upload smoke paths need an upload folder that already exists. The harness now pre-creates those folders as GM before player-upload tests run.
- The optional S3-compatible storage smoke spec deletes the uploaded S3 prefix after it verifies the object landed in the configured bucket.
- The S3-compatible storage smoke now checks browser render success as well as upload success. Your bucket needs CORS for media `GET` and `HEAD` requests or Foundry may create the tile document but fail to render the texture.
- The S3 smoke refresh only updates the Foundry-side AWS config file and restarts the Foundry server. It does not change repository files.
- The module itself does not override Foundry's server-side S3 endpoint. If you want a different base URL for a provider like R2, set it in Foundry's AWS config or provide `FOUNDRY_S3_ENDPOINT` for the smoke harness.
- The tests drive Foundry through real DOM `paste` and file-upload paths and assert against Foundry document state through `canvas.scene`, `game.messages`, and `game.journal`.
- Each test temporarily enables the module's `Verbose logging` setting and relays `Foundry Paste Eater [...]` browser-console lines into the Playwright output, which makes failures much easier to diagnose.
