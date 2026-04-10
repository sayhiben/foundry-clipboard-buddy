# Foundry Paste Eater Handoff

## Objective
Carry forward the long-running implementation, validation, release, and support thread for `foundry-paste-eater` without relying on the full chat history. The next agent should treat this file plus `handoff/current.json` as canonical session state, then inspect the live repo before making changes.

## Current Snapshot
- Repo: current checkout root (`.`)
- Branch: `main`
- Package version: `1.3.1`
- Latest tag: `1.3.1`
- Released tag commit: `96868de` (`Foundry Paste Eater 1.3.1`)
- Snapshot base commit on `main`: `219eb0f` (`Add PDF paste support`)
- Manifest compatibility: Foundry minimum `13`, verified `14.359`, maximum `14`
- Latest CI run on `main`: `24157148547`
- Latest CI status: `success`
- Latest handoff validation: passed after the 30014 live-smoke handoff refresh
- Important release note: `1.3.1` is still the latest published release. No new release was created for PDF or audio work.
- Latest development note: PDF paste support is committed in `219eb0f`; audio paste support is implemented locally on top, passed live smoke against `http://127.0.0.1:30014`, and remains unreleased/uncommitted.

## Current Repo State
The non-handoff worktree is intentionally dirty on top of commit `219eb0f` with unreleased audio paste support. Handoff snapshot files under `handoff/` are intentionally excluded from repo-state parity so the handoff can be refreshed without creating a self-referential dirty-state loop.

### Modified Files
- `CHANGELOG.md`
- `README.md`
- `TESTING.md`
- `foundry-paste-eater.css`
- `foundry-paste-eater.js`
- `module.json`
- `package.json`
- `src/chat.js`
- `src/clipboard.js`
- `src/constants.js`
- `src/field-targets.js`
- `src/index.js`
- `src/media.js`
- `src/paste/chat-media.js`
- `src/paste/scene-tools.js`
- `src/settings/schema.js`
- `src/storage/destination.js`
- `src/storage/remote-url.js`
- `src/storage/upload.js`
- `src/support/media-audit.js`
- `src/support/readiness.js`
- `src/ui/chat.js`
- `src/ui/paste-events.js`
- `src/ui/scene-controls.js`
- `src/workflows.js`
- `test/playwright/helpers/core.js`
- `test/playwright/smoke.art-fields.spec.js`
- `test/playwright/smoke.canvas-media.spec.js`
- `test/playwright/smoke.chat.spec.js`
- `test/shared/behavior-scenarios.js`
- `test/unit/diagnostics.spec.js`
- `test/unit/field-targets.spec.js`
- `test/unit/journal-and-upload.spec.js`
- `test/unit/media-helpers.spec.js`
- `test/unit/runtime/core.js`
- `test/unit/runtime/documents.js`
- `test/unit/support.spec.js`
- `test/unit/ui-and-hooks.spec.js`
- `test/unit/workflows.spec.js`

### Untracked Paths
- `src/paste/audio-workflows.js`
- `test/assets/test-audio.wav`

## User Preferences And Working Norms
- Commit and push serially, never in parallel.
- Prefer strong verification before declaring work complete.
- Prefer behavior-preserving refactors and explicit reasoning about defaults.
- Keep docs, tests, and runtime aligned.
- Favor practical GM-facing UX and "just works" defaults where safe.
- Defer compatibility claims until validated against a real Foundry instance.
- Avoid brittle test helpers that mutate Foundry editor wrapper DOM; target the actual editable control instead.
- For this audio work specifically, do not treat the validation pass as a release; no new release has been created yet.

## Major Conversation Intent
This thread has been a long-running hardening, release, review, and development program for the module. The latest phase adds unreleased audio paste support on top of the committed PDF paste support:
- detect audio from files, async clipboard items, direct URLs, URI lists, HTML audio/source/link tags, and plain text URLs
- support Foundry runtime audio formats, including `.aac`, `.flac`, `.m4a`, `.mid`, `.mp3`, `.ogg`, `.opus`, `.wav`, and explicit audio-context `.webm`
- normalize `.midi` filenames to `.mid` when generating upload names
- upload audio under the `audio` context without image/video/PDF coercion
- create chat audio cards and optionally set `ChatMessage.sound`
- create canvas `AmbientSound` documents with default sound vs ambient-loop prompt behavior
- add/update `PlaylistSound` documents, with `Pasted Audio` playlist fallback when the playlist UI is known but no playlist is inferred
- support focused `PlaylistSound.path`, `AmbientSound.path`, and `ChatMessage.sound` fields without hijacking arbitrary `path`/`src` inputs
- include audio references in support/audit/readiness/docs and test coverage
- keep release state anchored to `1.3.1`; no new audio release yet

## Key Decisions
- The module now supports Foundry V13 and is verified through Foundry V14.359 with manifest maximum `14`.
- Do not further loosen compatibility claims without another real validation pass.
- PDF paste support uses world Journal PDF pages as the canonical v1 artifact and is committed in `219eb0f`.
- Audio paste support is implemented as a separate content kind, not folded into image/video media helpers, to avoid `.ogg` and `.webm` regressions.
- Audio support follows Foundry runtime audio formats and normalizes `.midi` filenames to `.mid` when generating upload names.
- Audio workflows reuse existing chat media and canvas media role gates; playlist changes rely on actual Playlist/PlaylistSound permissions instead of a new setting.
- Blocked direct audio URL downloads may use the original URL only in explicit audio contexts such as chat audio, AmbientSound, PlaylistSound, or known audio fields.
- No audio Journal page type is added for this release path; canvas audio uses AmbientSound and playlist audio uses PlaylistSound.
- No new release has been created for the audio work; release state remains `1.3.1`.

## Latest Audio Development Summary
The unreleased audio implementation added:
- audio helper and detection logic in `src/media.js` and `src/clipboard.js`
- audio upload and remote URL resolution in `src/storage/upload.js` and `src/storage/remote-url.js`
- audio workflow routing in `src/paste/audio-workflows.js` and exports through `src/workflows.js`
- chat audio card rendering in `src/chat.js` and `foundry-paste-eater.css`
- UI routing for paste, drag/drop, chat upload, scene paste, and scene upload flows
- focused audio field and playlist target handling in `src/field-targets.js`
- support/readiness/audit updates and user-facing docs
- unit tests, Playwright smoke tests, and `test/assets/test-audio.wav`
- regenerated `foundry-paste-eater.js`

## Latest Validation
Audio development validation passed locally, and standalone live browser smoke now passed against `http://127.0.0.1:30014`. The earlier `npm run verify:release` release gate skipped smoke because no Foundry runtime was reachable at `http://127.0.0.1:30000`.

Commands/results:
- `npm run lint`: passed
- `npm test`: `641 passed`
- Runtime coverage: statements `99.61%`, functions `100.00%`, branches `85.42%`
- `npm run typecheck`: passed
- `npm run build:runtime`: passed
- `npm run verify:bundle`: passed
- `git diff --check`: passed
- `npm run verify:release`: passed local lint/unit/typecheck/bundle/copy gate and skipped smoke because Foundry was unreachable at `http://127.0.0.1:30000`
- First `FOUNDRY_URL=http://127.0.0.1:30014 npm run test:smoke`: surfaced a Playwright selector ambiguity in the new AmbientSound prompt smoke test; fixed by making the `Ambient sound` button selector exact in `test/playwright/smoke.canvas-media.spec.js`.
- `FOUNDRY_URL=http://127.0.0.1:30014 npx playwright test test/playwright/smoke.canvas-media.spec.js -g "pastes audio as an AmbientSound on the canvas"`: passed
- Final `FOUNDRY_URL=http://127.0.0.1:30014 npm run test:smoke`: `98 passed`, `1 skipped`
- `npm run handoff:validate`: passed after the 30014 live-smoke handoff refresh.

## Release And CI History
- `1.3.0` release published from commit `8ab2fc9`.
- Post-`1.3.0` CI coverage-margin fix landed in `f5ac610`.
- Handoff validator lint follow-up landed in `2dd3643`.
- `1.3.1` release published from commit `96868de`.
- `1.3.1` release URL: https://github.com/sayhiben/foundry-paste-eater/releases/tag/1.3.1
- `1.3.1` release assets: `module.json`, `foundry-paste-eater_1.3.1.zip`.
- `1.3.1` release CI run: `24157148547`, status `success`.
- PDF paste support committed in `219eb0f` as `Add PDF paste support` but remains unreleased.
- No audio release has been created yet.

## Numbers Worth Preserving
- Latest local full unit suite: `641 passed`
- Latest local runtime coverage: statements `99.61%`, functions `100.00%`, branches `85.42%`
- Latest smoke status for this audio work: `98 passed`, `1 skipped` against `http://127.0.0.1:30014`
- Published release version: `1.3.1`
- Foundry V14 compatibility target: `14.359`

## Open Threads
- Audio support is implemented and has passed local validation plus live Foundry V14 smoke against `http://127.0.0.1:30014`.
- Audio support remains unreleased; review, commit, and release planning are still pending.
- PDF support is committed in `219eb0f` but remains unreleased as part of the next release train with audio support.
- Possible future PDF enhancements: compendium curation/export, deduplication, page-range links, stronger thumbnail generation through bundled PDF.js, and text extraction.
- Possible future Codex Skills or multi-agent review workflow for specialized review perspectives after the PDF/audio review path is closed.
- Possible future setting: "only allow token replacement for tokens owned by the user".
- Possible future feature: scene drag/drop from Finder/Explorer.
- Possible future experiment: GIF to WebM conversion on canvas, but only as an opt-in feature if ever implemented.
- Post-release watch: monitor `1.3.1` user feedback and CI/release asset health, but no known functional blocker is open from the `1.3.1` validation pass.

## Immediate Next Step For A New Agent
1. Read `AGENTS.md`.
2. Read this file and `handoff/current.json`.
3. Inspect the dirty non-handoff worktree with `git status --short -- . ':(exclude)handoff'`.
4. Review the audio implementation around `src/paste/audio-workflows.js`, `src/clipboard.js`, `src/media.js`, `src/chat.js`, `src/field-targets.js`, storage helpers, and audio tests.
5. Continue from the assumption that audio work is implemented, locally verified, and live-smoke-tested against `http://127.0.0.1:30014`, but not released or committed.
6. If you change the handoff files again, append to `handoff/history.ndjson` and run `npm run handoff:validate`.

## Files To Read First
- `AGENTS.md`
- `handoff/current.md`
- `handoff/current.json`
- `handoff/history.ndjson`
- `handoff/schema.json`
- `README.md`
- `TESTING.md`
- `module.json`
- `package.json`
- `scripts/validate-handoff.js`
- `src/clipboard.js`
- `src/media.js`
- `src/notes.js`
- `src/chat.js`
- `src/field-targets.js`
- `src/paste/pdf-workflows.js`
- `src/paste/chat-media.js`
- `src/paste/scene-tools.js`
- `src/storage/upload.js`
- `src/storage/remote-url.js`
- `src/ui/paste-events.js`
- `src/ui/chat.js`
- `test/unit/workflows.spec.js`
- `test/unit/journal-and-upload.spec.js`
- `test/unit/media-helpers.spec.js`
- `test/unit/ui-and-hooks.spec.js`
- `test/playwright/smoke.canvas-text.spec.js`
- `test/playwright/smoke.chat.spec.js`
- `test/assets/test-document.pdf`
- `src/paste/audio-workflows.js`
- `src/ui/scene-controls.js`
- `src/support/media-audit.js`
- `test/unit/field-targets.spec.js`
- `test/playwright/smoke.canvas-media.spec.js`
- `test/playwright/smoke.art-fields.spec.js`
- `test/assets/test-audio.wav`

## Compaction Protocol
When this handoff is refreshed:
- keep the most recent 5-10 user asks verbatim or near-verbatim in the JSON `recent_turns`
- summarize older turns into structured decisions and event entries
- append new milestones to `handoff/history.ndjson`
- never overwrite `summary_lineage`; append a new lineage node

Narrative fields like `recent_turns`, `summary_lineage`, and `compaction_protocol` are still strongly recommended, but the machine validator treats them as guidance-friendly rather than minimum release-blocking structure.

Recommended budgeting heuristics:
- compact when token usage exceeds `0.70 * context_window`
- reserve `0.20 * context_window` for recent turns
- reserve `0.10 * context_window` for summary state
- reserve `0.15 * context_window` as headroom

## Recursive Summary Lineage
- The thread accumulated many assistant close-out summaries during implementation and release work.
- A system carry-forward summary later captured the release-pass state and pending files.
- Canonical handoff files under `handoff/` became the compaction root for future agents.
- The protocol was refined so the validator checks non-handoff repo-state parity, append-only history, and repo-relative file references.
- The `1.3.1` refresh re-anchored the snapshot to the V14 compatibility release and recorded that the V14 ProseMirror chat reset review finding was addressed before handoff.
- The PDF support refresh recorded unreleased PDF paste support, its review fixes, and full local Foundry V14 validation while keeping release state anchored to published version `1.3.1`.
- The audio support refresh recorded unreleased audio paste support on top of committed PDF support, local release-gate validation, and the initial smoke-test limitation caused by no reachable local Foundry runtime.
- This refresh records the follow-up live Foundry smoke pass against `http://127.0.0.1:30014` and the exact-button selector fix for the AmbientSound prompt smoke test.
