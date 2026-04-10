# Foundry Paste Eater Handoff

## Objective
Carry forward the long-running implementation, validation, release, and support thread for `foundry-paste-eater` without relying on the full chat history. The next agent should treat this file plus `handoff/current.json` as canonical session state, then inspect the live repo before making changes.

## Current Snapshot
- Repo: current checkout root (`.`)
- Branch: `main`
- Package version: `1.3.1`
- Latest tag: `1.3.1`
- Released tag commit: `96868de` (`Release 1.3.1`)
- Snapshot base commit on `main`: `96868de` (`Release 1.3.1`)
- Manifest compatibility: Foundry minimum `13`, verified `14.359`, maximum `14`
- Latest CI run on `main`: `24157148547`
- Latest CI status: `success`
- Latest handoff validation: `passed` after this PDF support refresh
- Important release note:
  `1.3.1` is still the latest published release. No new release was created for the PDF work.
- Latest development note:
  PDF paste support is implemented and fully validated locally, but remains unreleased and uncommitted.

## Current Repo State
The non-handoff worktree is intentionally dirty on top of commit `96868de` with unreleased PDF paste support. Handoff snapshot files under `handoff/` are intentionally excluded from repo-state parity so the handoff can be refreshed without creating a self-referential dirty-state loop.

### Modified Files
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
- `src/notes.js`
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
- `test/playwright/smoke.canvas-text.spec.js`
- `test/playwright/smoke.chat.spec.js`
- `test/shared/behavior-scenarios.js`
- `test/unit/field-targets.spec.js`
- `test/unit/journal-and-upload.spec.js`
- `test/unit/media-helpers.spec.js`
- `test/unit/runtime/core.js`
- `test/unit/support.spec.js`
- `test/unit/ui-and-hooks.spec.js`
- `test/unit/workflows.spec.js`

### Untracked Paths
- `src/paste/pdf-workflows.js`
- `test/assets/test-document.pdf`

## User Preferences And Working Norms
- Commit and push serially, never in parallel.
- Prefer strong verification before declaring work complete.
- Prefer behavior-preserving refactors and explicit reasoning about defaults.
- Keep docs, tests, and runtime aligned.
- Favor practical GM-facing UX and “just works” defaults where safe.
- Defer compatibility claims until validated against a real Foundry instance.
- Avoid brittle test helpers that mutate Foundry editor wrapper DOM; target the actual editable control instead.
- For this PDF work specifically, do not treat the validation pass as a release; no new release has been created yet.

## Major Conversation Intent
This thread has been a long-running hardening, release, review, and development program for the module. The latest phase added unreleased PDF paste support after a design and engineering review pass:
- detect PDFs from files, direct URLs, URI lists, HTML links, and plain text
- upload PDFs without image/video media coercion
- create world Journal PDF pages as canonical PDF artifacts
- post chat PDF cards linked by Journal UUID
- create canvas PDF scene Notes and append PDFs to selected scene Notes where safe
- support focused PDF Journal page `src` fields without hijacking arbitrary editable fields
- preserve selected-note Journal ownership and preflight Journal update rights before upload
- keep release state anchored to `1.3.1`; no new PDF release yet

## Key Decisions
- The module now supports Foundry V13 and is verified through Foundry V14.359 with manifest maximum `14`.
- Do not further loosen compatibility claims without another real validation pass.
- PDF paste support uses world Journal PDF pages as the canonical v1 artifact.
- Do not use compendium packs as the live paste target for v1; compendia remain possible future curation/export work.
- Do not use file-link-only as the canonical PDF model because it is harder to rediscover, permission, audit, or attach to canvas references.
- PDF Journal entries created from chat or empty-canvas paste are shared so players can open posted references immediately.
- Appending a PDF to an existing selected scene Note preserves that Journal entry's existing ownership rather than widening access to unrelated pages.
- Selected-note PDF append must preflight linked JournalEntry update rights before upload to avoid orphaned PDF uploads on blocked targets.
- External PDF URL fallback is allowed only for clearly PDF-like URLs when browser-side download is blocked.
- PDF preview generation is best effort and dependency-free in v1; thumbnail failure must not block PDF sharing.
- No new release has been created for the PDF work; release state remains `1.3.1`.

## Latest PDF Development Summary
The unreleased PDF implementation added:
- PDF detection/extraction in `src/clipboard.js`
- PDF helper logic in `src/media.js`, `src/storage/upload.js`, and `src/storage/remote-url.js`
- PDF workflow routing in `src/paste/pdf-workflows.js` and exports through `src/workflows.js`
- Journal PDF page and scene Note helpers in `src/notes.js`
- chat PDF card rendering in `src/chat.js` and `foundry-paste-eater.css`
- UI routing for paste, drag/drop, chat upload, scene paste, and scene upload flows
- focused PDF Journal page field handling in `src/field-targets.js`
- support/readiness/audit updates and user-facing docs
- unit tests, Playwright smoke tests, and `test/assets/test-document.pdf`
- regenerated `foundry-paste-eater.js`

## Latest Validation
PDF development validation passed locally on the existing `foundry-v14-dev` container at `http://127.0.0.1:30014`.

Commands/results:
- `npm run lint`: passed
- `npm test`: `598 passed`
- Runtime coverage: statements `99.69%`, functions `100.00%`, branches `86.35%`
- `npm run typecheck`: passed
- `npm run build:runtime`: passed
- `npm run verify:bundle`: passed
- `git diff --check`: passed
- `env -u FOUNDRY_PASSWORD FOUNDRY_URL=http://127.0.0.1:30014 FOUNDRY_DOCKER_CONTAINER=foundry-v14-dev npm run verify:release`: passed
- Playwright smoke result during `verify:release`: `94 passed`, `1 skipped` (opt-in S3 bucket integration skipped because S3 env was not configured)
- `npm run handoff:validate`: passed after this refresh

## Release And CI History
- `1.3.0` release published from commit `8ab2fc9`
- Post-`1.3.0` CI coverage-margin fix landed in `f5ac610`
- Handoff validator lint follow-up landed in `2dd3643`
- `1.3.1` release published from commit `96868de`
- `1.3.1` release URL:
  `https://github.com/sayhiben/foundry-paste-eater/releases/tag/1.3.1`
- `1.3.1` release assets:
  - `module.json`
  - `foundry-paste-eater_1.3.1.zip`
- `1.3.1` release CI run:
  - run id: `24157148547`
  - status: `success`
- No PDF release has been created yet.

## Numbers Worth Preserving
- Latest local full unit suite:
  - `598 passed`
- Latest local runtime coverage:
  - statements: `99.69%`
  - functions: `100.00%`
  - branches: `86.35%`
- Latest full local smoke suite:
  - `94 passed`
  - `1 skipped`
- Published release version:
  - `1.3.1`
- Foundry V14 validation target:
  - `14.359`

## Open Threads
- PDF support is implemented and fully validated locally but remains unreleased; review, commit, and release planning are still pending.
- Possible future PDF enhancements:
  compendium curation/export, deduplication, page-range links, stronger thumbnail generation through bundled PDF.js, and text extraction.
- Possible future Codex Skills or multi-agent review workflow for specialized review perspectives after the PDF review path is closed.
- Possible future setting:
  “only allow token replacement for tokens owned by the user”
- Possible future feature:
  scene drag/drop from Finder/Explorer
- Possible future experiment:
  GIF to WebM conversion on canvas, but only as an opt-in feature if ever implemented
- Post-release watch:
  monitor `1.3.1` user feedback and CI/release asset health, but no known functional blocker is open from the `1.3.1` validation pass.

## Immediate Next Step For A New Agent
1. Read `AGENTS.md`.
2. Read this file and `handoff/current.json`.
3. Inspect the dirty non-handoff worktree with `git status --short -- . ':(exclude)handoff'`.
4. Review the PDF implementation around `src/paste/pdf-workflows.js`, `src/notes.js`, `src/clipboard.js`, `src/chat.js`, and the PDF tests.
5. Continue from the assumption that the PDF work is implemented and fully validated locally, but not released.
6. If you change the handoff files again, append to `handoff/history.ndjson` and run `npm run handoff:validate`.

## Files To Read First
- `AGENTS.md`
- `handoff/current.json`
- `handoff/history.ndjson`
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
- This refresh records the unreleased PDF paste support implementation, its review fixes, and full local Foundry V14 validation while keeping release state anchored to published version `1.3.1`.
