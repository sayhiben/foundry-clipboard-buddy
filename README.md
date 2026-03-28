![GitHub all releases](https://img.shields.io/github/downloads/sayhiben/foundry-clipboard-buddy/total?logo=GitHub) ![GitHub release](https://img.shields.io/github/v/release/sayhiben/foundry-clipboard-buddy) ![GitHub license](https://img.shields.io/github/license/sayhiben/foundry-clipboard-buddy)

# Foundry Clipboard Buddy

Foundry Clipboard Buddy is an independently maintained fork of Clipboard Image for Foundry VTT.

It lets you paste or upload media and contextual text into:
- Tiles
- Tokens
- Scene notes
- Chat

The Foundry manifest title is currently `Clipboard Image`.

Maintained in this fork by Saif Addin Ellafi.

![Clipboard Image demo](example.gif)

## Compatibility

- Foundry VTT `13.x`
- Verified on `13.351`

This fork uses Foundry V13 public clipboard, canvas, `KeyboardManager`, and `FilePicker` APIs. It is not intended for V12 or earlier.

## Installation

Install from this manifest URL:

```text
https://github.com/sayhiben/foundry-clipboard-buddy/releases/latest/download/module.json
```

Repository:
- [GitHub](https://github.com/sayhiben/foundry-clipboard-buddy)

## What It Does

### Media on the canvas

- If one or more tokens are selected, pasted media replaces their texture in place.
- If one or more tiles are selected, pasted media replaces their texture in place.
- If nothing is selected and the Tokens layer is active, pasted media creates a new actorless token snapped to the grid.
- If nothing is selected on other canvas layers, pasted media creates a new tile at the mouse position.
- Normal keyboard or browser canvas paste respects Foundry's copied-object buffer before creating module content.
- Large pasted images are scaled down for tile creation.
- Video tiles are created muted, looping, and autoplaying.

### Text on the canvas

- If a token or tile is selected, pasted text appends to a Journal-backed note associated with that placeable.
- If no supported placeable is selected, pasted text creates a standalone scene note at the mouse position.
- If pasted content looks like a media URL but does not resolve to supported media, canvas paste falls back to note creation instead of failing silently.

### Chat behavior

- When the chat input is focused, normal text paste stays normal chat text.
- Media paste uploads the media and posts a chat message with an inline preview.
- Direct media URLs pasted into chat are downloaded, uploaded, and posted as chat media.
- Non-media URLs pasted into chat stay as normal text.
- Chat also supports drag and drop plus an `Upload Chat Media` button.

## Supported Input Types

- Images, including animated formats such as `.gif` and `.webp`
- Browser-supported video formats such as `.webm`, `.mp4`, `.m4v`, `.mpeg`, `.mpg`, `.ogg`, and `.ogv`
- Direct media URLs
- Clipboard payloads that expose media through `text/uri-list`, `text/plain`, or HTML media tags
- Plain text for contextual note creation

The module scans all available clipboard items, not just the first one.

## Quick Start

### Desktop paste

1. Copy media or text.
2. Focus the canvas and use your normal paste gesture:
   `Ctrl+V` on Windows/Linux, `Cmd+V` on macOS, or your browser's Paste action.
3. Focus the chat input first if you want media to go to chat instead of the scene.

### Scene controls

The Tiles and Tokens controls add:
- `Paste Media`
- `Upload Media`

Use these when:
- you want an explicit scene action
- direct paste is blocked by browser restrictions
- you are on a touch-oriented device

`Paste Media` relies on direct clipboard reads and may be unavailable in stricter browser contexts. `Upload Media` works as a file-picker fallback.
Unlike normal canvas paste, these explicit scene tools do not defer to Foundry's copied-object buffer.

### Hidden mode

When pasting media from the keyboard, Caps Lock can be used to create newly pasted tiles or tokens as hidden.

## Settings

Open Foundry's Game Settings and look for the module settings/menu:

- `Upload destination`
  World-level storage target for pasted media. Supports User Data, The Forge, Amazon S3, and other picker-provided sources.
- `Verbose logging`
  Client-level debugging setting that writes detailed clipboard-image diagnostics to the browser console.

By default, pasted media is uploaded under:

```text
pasted_images
```

If you want world-local storage, a typical example is:

```text
worlds/<your-world>/pasted_images
```

## Browser Notes

### Secure-context restrictions

Direct clipboard reads are stricter than normal browser paste events. On raw IP addresses, insecure origins, or other untrusted contexts:

- `navigator.clipboard.read()` may be blocked
- the scene-control `Paste Media` action may warn and do nothing
- normal browser paste events may still work
- `Upload Media` and chat upload remain the safest fallback

### Firefox

Modern Firefox is much more usable than older versions for clipboard media workflows, but clipboard permission behavior can still differ from Chromium browsers. If direct clipboard reads prompt or fail, browser paste events and upload fallbacks should still cover the main workflows.

### Remote media URLs

Direct media URLs are downloaded in the browser before upload. If the remote host blocks that request, the module will surface an error and skip creating broken content.

## Testing And Debugging

- Unit suite: `npm test`
- Manual QA guide: [TESTING.md](./TESTING.md)
- Playwright smoke suite: [test/README.md](./test/README.md)
- Pre-commit hooks: `pre-commit install`

Contributor workflows:
- `npm test` runs the jsdom/Vitest unit suite with coverage enforcement.
- `npm run test:smoke` runs the Playwright smoke suite against a live Foundry instance.
- `npm run lint` runs ESLint across the runtime and tests.

If you need to debug a broken paste flow:

1. Enable `Verbose logging`.
2. Open the browser console.
3. Reproduce the issue.

The logs include:
- clipboard parsing details
- media URL download attempts
- upload destination resolution
- paste-context decisions
- create vs replace behavior

## Credits

This fork builds on the original Clipboard Image work and the people who helped shape it.

- Original Clipboard Image concept and upstream work by JeansenVaars
- Thanks to @theripper93 for early design guidance
- Thanks to @vttom for help with Forge-related behavior
- Thanks to the Foundry VTT Discord community for issue reports and feedback

## License

[MIT License](./LICENSE.md)
