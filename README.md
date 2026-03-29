![GitHub all releases](https://img.shields.io/github/downloads/sayhiben/foundry-paste-eater/total?logo=GitHub) ![GitHub release](https://img.shields.io/github/v/release/sayhiben/foundry-paste-eater) ![GitHub license](https://img.shields.io/github/license/sayhiben/foundry-paste-eater)

# Foundry Paste Eater

Foundry Paste Eater lets you paste or upload media and contextual text into:
- Tiles
- Tokens
- Scene notes
- Chat

The Foundry manifest title is `Foundry Paste Eater`.

![Foundry Paste Eater demo](example.gif)

## Compatibility

- Foundry VTT `13.x`
- Verified on `13.351`

This fork uses Foundry V13 public clipboard, canvas, `KeyboardManager`, and `FilePicker` APIs. It is not intended for V12 or earlier.

## Installation

Install from this manifest URL:

```text
https://github.com/sayhiben/foundry-paste-eater/releases/latest/download/module.json
```

Repository:
- [GitHub](https://github.com/sayhiben/foundry-paste-eater)

## What It Does

### Media on the canvas

- If one or more tokens are selected, pasted media replaces their texture in place.
- If one or more tiles are selected, pasted media replaces their texture in place.
- If nothing is selected, new media uses the configured empty-canvas target. By default that is the active layer, which means the Tokens layer creates a token and other layers create a tile.
- New pasted tokens create a backing world Actor by default so they can be opened and edited normally afterward.
- On a fresh scene, Foundry usually opens on the Tokens layer, so default settings will create a token until you switch to Tile Controls or change the module target setting.
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
- Direct media URLs pasted into chat are downloaded and uploaded when the browser allows it.
- If a direct media URL cannot be downloaded because the remote host blocks browser-side access, the original URL text is inserted into chat instead of creating a broken or empty media message.
- Non-media URLs pasted into chat stay as normal text.
- Chat also supports drag and drop plus an `Upload Chat Media` button.

## Suggested README GIFs

These placeholder callouts are grouped by feature area so recorded media can be dropped into the README without re-planning the structure later.

### Canvas creation

> INSERT `01-tile-create-large-image.gif` HERE
> Show an empty Tiles layer, paste a large panorama or animated image, and make the mouse-position placement plus automatic tile downscaling obvious.

> INSERT `02-token-create-backed-actor.gif` HERE
> Show an empty Tokens layer, paste a portrait asset, then open the created token or actor sheet to prove the pasted token is grid-snapped and has a backing Actor.

> INSERT `03-video-on-canvas.gif` HERE
> Show a `.webm` pasted onto the canvas, ideally first on Tiles and optionally then on Tokens, so autoplaying muted video support is visible.

### Canvas replacement

> INSERT `04-token-replace-in-place.gif` HERE
> Start with an existing token selected, paste very different art, and make it obvious that only the texture changes while size and position stay the same.

> INSERT `05-tile-replace-multi.gif` HERE
> Select two tiles and paste once so the README shows multi-selection replacement and in-place preservation clearly.

> INSERT `06-direct-media-url-canvas.gif` HERE
> Paste a direct media URL onto the canvas to show URL download plus normal create or replace behavior.

### Text notes

> INSERT `07-standalone-note-from-text.gif` HERE
> Paste plain text onto open map space to show standalone Journal-backed note creation.

> INSERT `08-linked-note-append.gif` HERE
> Select a token or tile, paste text twice, and show the same linked note being reused with appended content.

### Chat

> INSERT `09-chat-image-and-video.gif` HERE
> Focus chat, paste an image, then paste a video, so the README shows chat-only routing and inline media previews.

> INSERT `10-chat-drag-drop-and-upload.gif` HERE
> Drag media into chat, then use the `Upload Chat Media` button to show the non-clipboard chat entry points.

> INSERT `11-direct-media-url-chat.gif` HERE
> Paste a direct media URL into chat so readers can see that remote media can become a normal uploaded chat post.

### Scene controls and fallbacks

> INSERT `12-scene-paste-prompt-fallback.gif` HERE
> Click `Paste Media`, let the manual paste prompt appear, paste into it, and show the prompt closing after successful creation.

> INSERT `13-scene-upload-tool.gif` HERE
> Use the scene `Upload Media` button so the fallback path is visible without relying on clipboard permissions.

> INSERT `14-hidden-mode.gif` HERE
> Hold `Ctrl` or `Cmd` with `Caps Lock`, paste new canvas media, and show the created tile or token as hidden.

### Admin and configuration

> INSERT `15-upload-destination-config.gif` HERE
> Open the Upload destination settings, change the target folder or source, then paste media so the README captures the storage configuration workflow.

## Supported Input Types

- Images, including animated formats such as `.gif` and `.webp`
- Browser-supported video formats such as `.webm`, `.mp4`, `.m4v`, `.mpeg`, `.mpg`, `.ogg`, and `.ogv`
- Direct media URLs
- Clipboard payloads that expose media through `text/uri-list`, `text/plain`, or HTML media tags
- Plain text for contextual note creation

When the browser exposes multiple `ClipboardItem` entries through `navigator.clipboard.read()`, the module scans all of them instead of assuming the first entry is the useful one.

That means:
- it can find media in a later clipboard item even if an earlier one only contains text or another unsupported payload
- it checks the current clipboard snapshot, not clipboard history
- it stops at the first usable media or text result and does not paste multiple clipboard items at once

## Quick Start

### Desktop paste

1. Copy media or text.
2. Focus the canvas and use your normal paste gesture:
   `Ctrl+V` on Windows/Linux, `Cmd+V` on macOS, or your browser's Paste action.
3. Focus the chat input first if you want media to go to chat instead of the scene.

Keyboard paste follows the browser's native `paste` event rather than a custom module shortcut. That matters for cases like Finder-copied files on macOS, where the browser paste event can expose the real file payload even when direct clipboard reads only expose a filename.

### Scene controls

The Tiles and Tokens controls add:
- `Paste Media`
- `Upload Media`

Use these when:
- you want an explicit scene action
- direct paste is blocked by browser restrictions
- you are on a touch-oriented device

`Paste Media` first tries a direct clipboard read. If the browser cannot expose usable media through that API, the module now opens a focused paste prompt so you can finish with the browser's native paste event. This is especially useful for local files copied from Finder on macOS.
`Upload Media` works as a file-picker fallback.
Unlike normal canvas paste, these explicit scene tools do not defer to Foundry's copied-object buffer.

The "scan all clipboard items" behavior matters most for the direct-read path used by `Paste Media`. Normal keyboard paste still follows the browser's native `paste` event and uses whatever the browser exposes through `event.clipboardData`.

### Hidden mode

When pasting media from the keyboard, Caps Lock can be used to create newly pasted tiles or tokens as hidden.

## Settings

Open Foundry's Game Settings and look for the module settings/menu:

- `Upload destination`
  World-level storage target for pasted media. Supports User Data, The Forge, Foundry-configured S3-compatible storage, and other picker-provided sources.
  The module reads the live endpoint or base URL from Foundry's server-side S3 configuration, so providers like Cloudflare R2 or MinIO work as long as Foundry itself is configured for them.
- `Minimum role for canvas media paste`
  Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.
- `Minimum role for canvas text paste`
  Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text.
- `Minimum role for chat media paste`
  Lowest Foundry role allowed to post pasted or uploaded media into chat.
- `Allow non-GMs to use scene controls`
  Lets non-GM users who meet the canvas-media role requirement see the Foundry Paste Eater scene-control buttons.
- `Enable chat media handling`
  Master toggle for chat media paste, drag/drop, and upload behavior.
- `Enable chat upload button`
  Controls whether the explicit `Upload Chat Media` button appears.
- `Allow token creation from pasted media`
  Allows new token creation when media targets token placement.
- `Allow tile creation from pasted media`
  Allows new tile creation when media targets tile placement.
- `Allow token art replacement`
  Allows pasted media to replace selected token art. Non-GMs are limited to tokens they can actually update, which is typically actor ownership.
- `Allow tile art replacement`
  Allows pasted media to replace selected tile art.
- `Enable scene Paste Media tool`
  Controls whether the explicit scene-control paste button is shown.
- `Enable scene Upload Media tool`
  Controls whether the explicit scene-control upload button is shown.
- `Default empty-canvas paste target`
  Chooses whether new canvas media follows the active layer, always creates tiles, or always creates tokens.
- `Create backing Actors for pasted tokens`
  Keeps newly pasted tokens editable through a normal token sheet.
- `Chat media display`
  Chooses between full preview, thumbnail preview, or link-only chat posts.
- `Canvas text paste mode`
  Currently supports Journal-backed scene notes or fully disabling canvas text paste.
- `Scene Paste Media prompt mode`
  Chooses whether the explicit scene-control paste button uses automatic browser behavior, always opens the manual paste prompt, or only uses direct clipboard reads.
- `Verbose logging`
  Client-level debugging setting that writes detailed foundry-paste-eater diagnostics to the browser console.
  When enabled, client-side error reports also download a full module logfile automatically for that client.

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

Direct media URLs are downloaded in the browser before upload when possible. If a remote host blocks that browser-side download:
- canvas paste will warn instead of creating broken tiles or tokens
- chat paste will leave the original URL text in the input instead of creating a broken or empty media message
- the safest workaround is to upload the file locally or use a host that allows browser-side downloads

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

When an actual module error is raised:
- the acting user gets a short popup notification
- connected GM clients get a richer error dialog with a downloadable module logfile
- clients with `Verbose logging` enabled automatically get the full verbose logfile as a download

## Credits

This fork builds on the original Foundry Paste Eater work and the people who helped shape it.

- Original Foundry Paste Eater concept and upstream work by JeansenVaars
- Thanks to @theripper93 for early design guidance
- Thanks to @vttom for help with Forge-related behavior
- Thanks to the Foundry VTT Discord community for issue reports and feedback

## License

[MIT License](./LICENSE.md)
