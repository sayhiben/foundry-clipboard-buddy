# Repository Guidelines

## Project Structure & Module Organization
- `clipboard-image.js`: main runtime script loaded by Foundry.
- `module.json`: module manifest (id, compatibility, script entry, release URLs).
- `README.md`, `CHANGELOG.md`, `LICENSE.md`, `THANKS.txt`: user and release documentation.
- `example.gif`, `logo-small-black.png`, `jetbrains.svg`: documentation/media assets.
- `dist/` is generated for packaging via npm scripts; source of truth remains repository root files.

## Build, Test, and Development Commands
- `npm install`: installs dev tooling (`npm-build-zip`).
- `npm run copy`: creates `dist/` and copies module/runtime/docs files into it.
- `npm run zip`: zips `dist/` into a release archive in the repository root.
- `npm run copy && npm run zip`: standard local release packaging sequence.
- `npm test`: placeholder script that intentionally fails; use manual testing in Foundry VTT.

## Coding Style & Naming Conventions
- Use JavaScript with 2-space indentation and keep style consistent with `clipboard-image.js`.
- Keep module helpers prefixed with `_clipboard...` (for example, `_clipboardGetSource`).
- Prefer `const`/`let`, guard clauses, and small focused functions.
- Keep global mutable state limited and explicit (`CLIPBOARD_IMAGE_LOCKED`, `CLIPBOARD_HIDDEN_MODE`).
- When changing compatibility or metadata, update `module.json` and related docs together.

## Testing Guidelines
- There is no automated test suite in this repository.
- Validate changes manually in Foundry VTT 12.x as a GM:
1. Paste with `Ctrl+V`/`Cmd+V` on canvas and confirm tile creation.
2. Confirm upload path matches world setting (`pasted_images` by default).
3. Verify oversized images are scaled and CAPS LOCK toggles hidden tile mode.
4. Check interaction fallback when Foundry objects are already copied.

## Commit & Pull Request Guidelines
- Match existing history style: short, imperative commit subjects (for example, `Bump Foundry 12`, `Tokenizer compatibility`).
- Keep commits scoped to one concern (behavior, manifest/version, or docs).
- PRs should include: behavior summary, impacted Foundry version(s), linked issue (if any), and screenshot/GIF for canvas-visible changes.

## Security & Configuration Notes
- Clipboard API support depends on trusted browser context (HTTPS/domain trust).
- Firefox requires enabling clipboard-related `about:config` flags noted in `README.md`.
