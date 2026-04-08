# Foundry Paste Eater Handoff

## Objective
Carry forward a long-running implementation, testing, release, and support thread for `foundry-paste-eater` without relying on the full chat history. The next agent should use this file and `handoff/current.json` as canonical session state, then inspect the live repo state before making changes.

## Current Snapshot
- Repo: current checkout root (`.`)
- Branch: `main`
- Package version: `1.3.0`
- Latest tag: `1.3.0`
- Released tag commit: `8ab2fc9` (`Release 1.3.0`)
- Snapshot base commit on `main`: `0f03226` (`Refine defaults and support tooling`)
- Latest CI run on `main`: `24111495040`
- Latest CI status: `success`
- Latest handoff validation: `passed`
- Important release note:
  `1.3.0` is published and functionally fine, but the tag does not include the post-release CI-only coverage commit `f5ac610`.
- Latest handoff-maintenance note:
  the handoff protocol was tightened after strict review so it is repo-relative, non-release-gating, and append-only for `history.ndjson` once tracked.

## Current Repo State
The local non-handoff worktree was clean at the snapshot base commit `0f03226`. Handoff snapshot files under `handoff/` are intentionally excluded from repo-state parity so the handoff can be refreshed without creating a self-referential dirty-state loop.

### Modified Files
- None outside the handoff snapshot files.

### Untracked Paths
- None outside the handoff snapshot files.

## User Preferences And Working Norms
- Commit and push serially, never in parallel.
- Prefer strong verification before declaring work complete.
- Prefer behavior-preserving refactors and explicit reasoning about defaults.
- Keep docs, tests, and runtime aligned.
- Favor practical GM-facing UX and “just works” defaults where safe.
- Defer risky compatibility claims until validated.

## Major Conversation Intent
This thread has been a long-running hardening and release program for the module:
- tighten permissions, storage guidance, and token replacement behavior
- improve defaults and the “just works” first-run experience
- expand unit and smoke coverage
- refactor runtime and test architecture
- add GM support/readiness surfaces
- ship `1.3.0`
- repair post-release CI threshold drift

## Key Decisions
- Keep the module V13-only for now.
- Do not remove the manifest `maximum` compatibility without real V14 validation.
- Chat-targeted media remains chat-only; canvas-targeted text remains note/journal-oriented.
- Selected token image paste supports `Scene token only`, `Actor portrait + linked token art`, and `Ask each time`.
- Canvas-bound GIFs are rasterized to PNG for reliable Foundry rendering.
- Chat GIFs remain animated.
- New pasted tokens create backing Actors by default.
- New actor-backed pasted tokens now default to `actorLink: true`.
- Empty-canvas media defaults to `active-layer`.
- Canvas text paste now defaults to `scene-notes`.
- Selected token image paste defaults to `prompt`.
- Upload path organization defaults to `context-user-month`.
- The release is valid even though CI failed afterward, because the failure was coverage margin only.

## Shipped 1.3.0 Summary
`1.3.0` added and/or finalized:
- GM-only `Readiness & Support`
- GM-only `Uploaded Media Audit`
- support bundle export and read-only support API
- release hardening with `typecheck`, `verify:bundle`, and `verify:release`
- runtime/test architecture refactor
- smoke scene isolation
- Finder-native media paste hardening
- chat focus restoration after chat paste
- improved recommended-defaults, support, and audit UX
- actor-linked token creation by default for actor-backed pasted tokens
- configurable pasted-token actor types and token-creation dialog
- post-release CI coverage-margin fix in `f5ac610`

See:
- `CHANGELOG.md`
- `README.md`
- `TESTING.md`

## Release And CI History
- `1.3.0` release published from commit `8ab2fc9`
- Release URL:
  `https://github.com/sayhiben/foundry-paste-eater/releases/tag/1.3.0`
- Release assets:
  - `module.json`
  - `foundry-paste-eater_1.3.0.zip`
- Release verification passed locally:
  - `npm run lint`
  - `npm test`
  - `npm run typecheck`
  - `npm run build:runtime`
  - `npm run verify:bundle`
  - `npm run test:smoke`
  - `npm run verify:release`
- Final local release smoke result:
  - `92 passed`
  - `1 skipped` (opt-in live S3 smoke)

### Post-release CI incident
- Failing run:
  `24111192623`
- Failure:
  branch coverage was `84.99%`, below the `85.00%` threshold
- No functional tests failed
- Fix commit:
  `f5ac610` (`Add unit coverage margin for CI`)
- Latest successful CI run:
  `24111495040`

## Numbers Worth Preserving
- Latest local full unit suite after CI fix:
  - `506 passed`
- Latest local runtime coverage after CI fix:
  - statements: `99.86%`
  - functions: `100.00%`
  - branches: `85.28%`
- Published release version:
  - `1.3.0`

## Open Threads
- Possible future setting:
  “only allow token replacement for tokens owned by the user”
- Possible future feature:
  scene drag/drop from Finder/Explorer
- Possible future experiment:
  GIF to WebM conversion on canvas, but only as an opt-in feature if ever implemented
- Possible future validation:
  real Foundry V14 smoke pass before loosening manifest compatibility policy

## Immediate Next Step For A New Agent
1. Read `AGENTS.md`.
2. Read this file and `handoff/current.json`.
3. Inspect whether any new post-snapshot changes exist beyond the handoff refresh commit.
4. Run `npm run handoff:validate` after refreshing the handoff snapshot again if you change the handoff files.
5. Do not cut a new release until new post-snapshot work is understood and verified.

## Files To Read First
- `AGENTS.md`
- `handoff/current.json`
- `README.md`
- `TESTING.md`
- `CHANGELOG.md`
- `scripts/validate-handoff.js`
- `src/settings/schema.js`
- `src/canvas/create-strategies.js`
- `src/ui/chat.js`
- `src/ui/paste-events.js`
- `test/unit/ui-and-hooks.spec.js`
- `test/unit/support.spec.js`
- `test/playwright/config.spec.js`
- `test/playwright/smoke.canvas-media.spec.js`

## Compaction Protocol
When this handoff is refreshed:
- keep the most recent 5-10 user asks verbatim in the JSON `recent_turns`
- summarize older turns into structured decisions and event entries
- append new milestones to `handoff/history.ndjson`
- never overwrite `summary_lineage`; append a new lineage node

Narrative fields like `recent_turns`, `summary_lineage`, and `compaction_protocol` are still strongly recommended, but the machine validator now treats them as guidance-friendly rather than minimum release-blocking structure.

Recommended budgeting heuristics:
- compact when token usage exceeds `0.70 * context_window`
- reserve `0.20 * context_window` for recent turns
- reserve `0.10 * context_window` for summary state
- reserve `0.15 * context_window` as headroom

## Recursive Summary Lineage
- The thread accumulated many assistant close-out summaries during implementation and release work.
- A system carry-forward summary later captured the release-pass state and pending files.
- This handoff is intended to become the new canonical compaction root for future agents.
