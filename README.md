![GitHub all releases](https://img.shields.io/github/downloads/sayhiben/foundry-paste-eater/total?logo=GitHub) ![GitHub release](https://img.shields.io/github/v/release/sayhiben/foundry-paste-eater) ![GitHub license](https://img.shields.io/github/license/sayhiben/foundry-paste-eater)

# Foundry Paste Eater

Foundry Paste Eater lets GMs and players paste or upload media and contextual text into:
- Tiles
- Tokens
- Scene notes
- Focused document art fields
- Chat

The Foundry manifest title is `Foundry Paste Eater`.

![Foundry Paste Eater demo](example.gif)

## Compatibility

- Foundry VTT `v13+`
- Currently verified through `14.359`

This fork uses the public clipboard, canvas, `KeyboardManager`, and `FilePicker` APIs introduced in Foundry V13 and kept compatible with current v14 releases. It is not intended for V12 or earlier.

## Installation

Install from this manifest URL:

```text
https://github.com/sayhiben/foundry-paste-eater/releases/latest/download/module.json
```

Repository:
- [GitHub](https://github.com/sayhiben/foundry-paste-eater)

## Table Of Contents

- [Quick Start](#quick-start)
- [Shipped Defaults](#shipped-defaults)
- [How Paste Routing Works](#how-paste-routing-works)
- [Default Behavior Cheat Sheet](#default-behavior-cheat-sheet)
- [Media Behavior By Context](#media-behavior-by-context)
- [Text Behavior By Context](#text-behavior-by-context)
- [Chat Behavior](#chat-behavior)
- [Scene Tools And Upload Fallbacks](#scene-tools-and-upload-fallbacks)
- [Access, Ownership, And Permission Rules](#access-ownership-and-permission-rules)
- [Settings That Change Default Behavior](#settings-that-change-default-behavior)
- [Settings Reference](#settings-reference)
- [Readiness And Support](#readiness-and-support)
- [Permissions And Storage](#permissions-and-storage)
- [Troubleshooting By Symptom](#troubleshooting-by-symptom)
- [Browser Notes](#browser-notes)
- [Supported Input Types](#supported-input-types)
- [Suggested README GIFs](#suggested-readme-gifs)
- [Testing And Debugging](#testing-and-debugging)

## Quick Start

1. Copy an image, video, direct media URL, or plain text.
2. Choose where the paste should go:
   - Focus a supported art field to update that field.
   - Focus the chat input to post media to chat or keep text as chat text.
   - Focus the canvas to replace selected content or create new scene content.
   - Use `Paste Media` or `Upload Media` from scene controls if you want an explicit scene action.
3. Paste with your normal browser gesture:
   `Ctrl+V` on Windows/Linux, `Cmd+V` on macOS, or your browser's Paste action.
4. On a fresh install:
   - empty-canvas media creates a tile
   - selected-token image paste prompts before actor-wide changes when that choice is valid
   - canvas plain text is disabled until you enable `Canvas text paste mode`

## Shipped Defaults

These are the first-run defaults the module ships with.

| Setting | Default |
| --- | --- |
| Upload source | `User Data` |
| Upload base folder | `pasted_images` |
| Upload path organization | `Context / user / month` |
| Verbose logging | Disabled |
| Minimum role for canvas media paste | `Player` |
| Minimum role for canvas text paste | `Player` |
| Minimum role for chat media paste | `Player` |
| Allow non-GMs to use scene controls | Enabled |
| Enable chat media handling | Enabled |
| Enable chat upload button | Enabled |
| Allow token creation from pasted media | Enabled |
| Allow tile creation from pasted media | Enabled |
| Allow token art replacement | Enabled |
| Allow tile art replacement | Enabled |
| Enable scene `Paste Media` tool | Enabled |
| Enable scene `Upload Media` tool | Enabled |
| Default empty-canvas paste target | `Active layer` |
| Create backing Actors for pasted tokens | Enabled |
| Backing Actor type for pasted tokens | `Ask each time` |
| Lock pasted token rotation by default | Enabled |
| Chat media display | `Thumbnail` |
| Canvas text paste mode | `Scene notes` |
| Scene `Paste Media` prompt mode | `Auto` |
| Selected token image paste mode | `Ask each time` |

In practice, that means a fresh install favors active-layer canvas placement, Journal-backed scene notes for plain text, explicit token-image choices, rotation-locked token defaults, organized storage paths, and a short prompt when new tokens are created so the user can choose between a scene-only token and a sensible backing-Actor option.

Existing worlds keep whatever settings were already saved. If you want an older world to match the current recommended behavior profile, open `Game Settings -> Configure Settings -> Module Settings -> Foundry Paste Eater -> Apply recommended defaults` and review the changes before applying them. That review only touches configurable world behavior settings. It does not change the upload destination or client-only verbose logging.

## How Paste Routing Works

Foundry Paste Eater follows a simple routing model:

1. Focus wins first.
   If a supported art field is focused, pasted media goes there before chat or canvas handling.
2. Chat wins next.
   If chat is focused, media goes to chat and plain text stays plain chat text.
3. Canvas uses selection before creation.
   On the canvas, selected placeables are replaced before new scene content is created.
4. Plain text on the canvas is opt-in.
   When `Canvas text paste mode` is enabled, text creates or updates Journal-backed scene notes instead of chat content.
5. Settings and permissions can change the defaults.
   Role minimums, feature toggles, selected-token image mode, and empty-canvas targeting all change what players experience.

Normal keyboard canvas paste respects Foundry's copied-object buffer before this module creates anything. The explicit scene-control tools do not.

## Default Behavior Cheat Sheet

| If you do this | Default result | Notes |
| --- | --- | --- |
| Focus an Actor or Item portrait field and paste an image | Update that field | No canvas or chat content is created |
| Focus a token-style art field and paste an image or video | Update that field | Works for `texture.src` and `prototypeToken.texture.src` |
| Focus chat and paste an image or video | Upload and post media to chat | Chat display mode controls preview style |
| Focus chat and paste plain text or a non-media URL | Keep normal chat text | The module does not swallow normal chat text |
| Select a token and paste an image | Prompt for scene-only or actor-wide replacement when eligible; otherwise replace selected scene token art | Ineligible selections skip the prompt and stay scene-local |
| Select a token and paste a video | Replace selected scene token art | Video always stays scene-local |
| Select a tile and paste an image or video | Replace selected tile art | Size and position stay unchanged |
| Select a scene note and paste an image | Replace the note icon | No new tile is created |
| Select a token, tile, or note and paste plain text | No module action by default | Enable `Canvas text paste mode` for note workflows |
| Paste image or video on an empty canvas | Follow the active layer | Tokens create tokens; Tiles and Notes create tiles unless you override the setting |
| Paste plain text on an empty canvas | No module action by default | Enable `Canvas text paste mode` for standalone notes |
| Use scene `Paste Media` | Run an explicit scene media workflow | Media only, never text-note creation |
| Use scene `Upload Media` | Pick a local file and apply normal scene media rules | Media only, never text-note creation |

## Media Behavior By Context

### Focused document art fields

If a supported art field is focused, media goes there before canvas or chat handling.

| Focused field | Supported media | Result |
| --- | --- | --- |
| Actor or Item `img` | Images | Upload the media and update the field plus visible preview |
| Token `texture.src` | Images and video | Upload the media and update the field plus visible preview |
| Actor `prototypeToken.texture.src` | Images and video | Upload the media and update the field plus visible preview |

Direct media URLs in focused art fields are downloaded and uploaded when the browser allows it. If the remote host blocks browser-side download, the original URL can still be written into a supported field instead of creating broken canvas content.

### Canvas media

On the canvas, replacement happens before creation.

| Current situation | Default result | Notes |
| --- | --- | --- |
| One or more selected tokens | Replace selected token art | Eligible image pastes prompt by default; video is always scene-only |
| One or more selected tiles | Replace selected tile art | Preserves size and position |
| One or more selected scene notes | Replace selected note icon | Image only |
| No selection on Tokens layer | Create a token | Shipped default empty-canvas targeting follows the active layer |
| No selection on Tiles layer | Create a tile | Large images are scaled down for tiles |
| No selection on Notes layer | Create a tile | Notes layer does not create notes from media |

Additional canvas rules:
- New pasted tokens can create linked backing world Actors. When `Backing Actor type for pasted tokens` is set to `Ask each time`, users get a prompt with `Scene token only`, `System default`, and any additional system Actor types.
- Large pasted images are scaled down for tile creation.
- Video tiles are created muted, looping, and autoplaying.
- `Caps Lock` hidden mode affects newly created canvas media, not replacement updates.
- Normal keyboard or browser canvas paste respects Foundry's copied-object buffer before creating module content.

### Canvas media selection priority

Foundry layer behavior matters. If selected placeables exist on multiple layers, the active layer decides which type is preferred first.

| Active layer | Replacement priority |
| --- | --- |
| Tokens | Selected tokens, then selected tiles, then selected notes |
| Tiles | Selected tiles, then selected tokens, then selected notes |
| Notes | Selected notes, then selected tokens, then selected tiles |

If the first matching replacement type is present but blocked by role, ownership, or feature settings, the module stops cleanly instead of silently creating a different kind of placeable.

### Selected token image modes

The default image behavior for selected tokens is prompt-based so users can decide whether a paste should stay scene-local or become actor-wide.

| Setting | Intended behavior |
| --- | --- |
| `Ask each time` | Prompt with `Scene token only` and `Actor portrait + linked token art` when the selected token set is eligible for actor-wide updates. This is the default. |
| `Scene token only` | Replace only `Token.texture.src` for the selected scene token. |
| `Actor portrait + linked token art` | Update `Actor.img`, update linked-token default art, and update linked placed tokens for eligible linked Actors. Image only. |

Important limits:
- `Actor portrait + linked token art` requires every selected token to be linked to a base Actor the current user can update.
- If any selected token is ineligible, actor-wide mode fails closed instead of partially changing the scene.
- Video pastes never become actor-wide portrait or linked-token updates. They stay scene-local.

### Empty-canvas media targeting

| Setting | Result when nothing is selected |
| --- | --- |
| `Active layer` | Tokens layer creates tokens. Tiles and Notes layers create tiles. |
| `Token` | Always create a token |
| `Tile` | Always create a tile |

## Text Behavior By Context

When `Canvas text paste mode` is enabled, plain text and non-media URLs stay useful on the canvas.

| Canvas situation | Result |
| --- | --- |
| Selected token | Create or reuse a Journal-backed note associated with that token, then append text |
| Selected tile | Create or reuse a Journal-backed note associated with that tile, then append text |
| Selected scene note | Append text to the linked Journal page, creating a text page when needed |
| No supported selection | Create a standalone scene note at the current mouse position |
| `Canvas text paste mode` disabled | Do nothing. This is the default. |

If pasted content looks like a media URL but does not resolve to supported media, canvas paste falls back to note creation instead of failing silently.

## Chat Behavior

| Chat action | Result |
| --- | --- |
| Paste an image or video | Upload and post a chat media message |
| Paste a direct media URL | Download, upload, and post media when the browser allows it |
| Paste a direct media URL from a host that blocks browser-side download | Leave the original URL text in chat instead of creating a broken or empty message |
| Paste plain text or a non-media URL | Keep normal chat text |
| Drag and drop media into chat | Upload and post chat media |
| Use `Upload Chat Media` | Pick a local file and post it to chat |

Chat also supports three display modes:
- `Full preview`
- `Thumbnail`
- `Link only`

## Scene Tools And Upload Fallbacks

The Tiles and Tokens controls add:
- `Paste Media`
- `Upload Media`

Use these when:
- you want an explicit scene action
- browser restrictions make normal clipboard reads unreliable
- you are on a touch-oriented device
- you want a file-picker fallback instead of clipboard paste

| Tool | Intended behavior |
| --- | --- |
| `Paste Media` | Media only. Uses direct clipboard read, the manual paste prompt, or both depending on `Scene Paste Media prompt mode`. |
| `Upload Media` | Media only. Opens a file picker and then applies normal scene create-or-replace rules. |

Additional scene-tool rules:
- These tools do not create Journal notes from plain text.
- These tools do not defer to Foundry's copied-object buffer.
- These tools can still work when normal canvas focus is not active.
- `Paste Media` can fall back to a manual paste prompt so the browser's native `paste` event can finish the workflow.

## Access, Ownership, And Permission Rules

Foundry Paste Eater has both role-based and real document-permission checks.

| Concern | Expected behavior |
| --- | --- |
| Canvas media role minimum | Controls who can create or replace canvas media |
| Canvas text role minimum | Controls who can create or update scene notes from pasted text |
| Chat media role minimum | Controls who can post pasted or uploaded media into chat |
| Non-GM scene controls | Non-GMs only see scene buttons when enabled and when they already meet the canvas-media role requirement |
| Token replacement | Non-GMs must be able to update the token or its Actor |
| Tile replacement | Non-GMs must be able to update the tile |
| Actor-wide token image mode | Every selected token must be linked to a base Actor the user can update |

Player uploads also depend on Foundry core file permissions. See [Permissions And Storage](#permissions-and-storage).

## Settings That Change Default Behavior

These are the settings most likely to change what your players expect.

| Setting | Default | What it changes |
| --- | --- | --- |
| `Selected token image paste mode` | `Ask each time` | Whether selected-token image paste stays scene-local, becomes actor-wide for eligible linked tokens, or prompts each time |
| `Default empty-canvas paste target` | `Active layer` | Whether new canvas media follows the active layer, always creates tiles, or always creates tokens |
| `Create backing Actors for pasted tokens` | Enabled | Whether new pasted tokens get linked world Actors or remain actorless scene tokens |
| `Backing Actor type for pasted tokens` | `Ask each time` | Whether new pasted tokens prompt for `Scene token only` vs backing-Actor creation, or use a fixed Actor type |
| `Lock pasted token rotation by default` | Enabled | Whether newly created pasted tokens start with `lockRotation` enabled on the scene token and any generated prototype token |
| `Canvas text paste mode` | `Scene notes` | Whether plain text on the canvas creates notes or is disabled |
| `Scene Paste Media prompt mode` | `Auto` | Whether the explicit scene paste button uses direct read, always opens the prompt, or never opens the prompt |
| `Chat media display` | `Thumbnail` | How uploaded chat media is rendered |
| `Upload path organization` | `Context / user / month` | Whether uploads stay in one folder or are separated into `canvas`, `chat`, and `document-art` subfolders |
| `Allow token creation from pasted media` | Enabled | Whether empty-canvas token-targeted media can create new tokens |
| `Allow tile creation from pasted media` | Enabled | Whether empty-canvas tile-targeted media can create new tiles |
| `Allow token art replacement` | Enabled | Whether pasted media may replace selected token art |
| `Allow tile art replacement` | Enabled | Whether pasted media may replace selected tile art |
| `Enable chat media handling` | Enabled | Whether chat media paste, drag/drop, and upload are active |
| `Enable chat upload button` | Enabled | Whether the explicit `Upload Chat Media` button is shown |
| `Allow non-GMs to use scene controls` | Enabled | Whether non-GMs can see the scene control buttons when they otherwise qualify |

## Settings Reference

Open Foundry's Game Settings and look for the module settings and menu.

### Storage and diagnostics

- `Upload destination`
  World-level storage target for pasted media. Supports User Data, The Forge, Foundry-configured S3-compatible storage, and other picker-provided sources.
  The module reads the live endpoint or base URL from Foundry's server-side S3 configuration, so providers like Cloudflare R2 or MinIO work as long as Foundry itself is configured for them.
- `Apply recommended defaults`
  GM-only review action for existing worlds that predate the current shipped defaults.
  It shows which configurable world behavior settings differ from the current recommended profile, then reapplies only those settings if you confirm.
  It does not touch the upload destination or client-only verbose logging.
- `Readiness & Support`
  GM-only read-only status panel for clipboard capability, storage readiness, player upload prerequisites, default-profile drift, and support-bundle download.
- `Uploaded Media Audit`
  GM-only read-only report for current world references under the module's known upload roots.
- `Upload path organization`
  Keeps the configured base upload destination, then optionally appends context, user, and month subfolders such as `canvas/<user-id>/<YYYY-MM>/`, `chat/<user-id>/<YYYY-MM>/`, and `document-art/<user-id>/<YYYY-MM>/`.
- `Verbose logging`
  Client-level debugging setting that writes detailed foundry-paste-eater diagnostics to the browser console.
  When enabled, client-side error reports also download a full module logfile automatically for that client.

### Access control

- `Minimum role for canvas media paste`
  Lowest Foundry role allowed to create or replace tiles and tokens from pasted media.
- `Minimum role for canvas text paste`
  Lowest Foundry role allowed to create or update Journal-backed scene notes from pasted text when `Canvas text paste mode` is enabled.
- `Minimum role for chat media paste`
  Lowest Foundry role allowed to post pasted or uploaded media into chat.
- `Allow non-GMs to use scene controls`
  Lets non-GM users who meet the canvas-media role requirement see the Foundry Paste Eater scene-control buttons.

### Canvas media

- `Allow token creation from pasted media`
  Allows new token creation when media targets token placement.
- `Allow tile creation from pasted media`
  Allows new tile creation when media targets tile placement.
- `Allow token art replacement`
  Allows pasted media to replace selected token art. Non-GMs are limited to tokens they can actually update, which is typically actor ownership.
- `Selected token image paste mode`
  Chooses between `Scene token only`, `Actor portrait + linked token art`, and `Ask each time`.
  `Actor portrait + linked token art` is image-only and requires every selected token to be linked to a base Actor the current user can update.
- `Allow tile art replacement`
  Allows pasted media to replace selected tile art.
- `Default empty-canvas paste target`
  Chooses whether new canvas media follows the active layer, always creates tiles, or always creates tokens.
- `Create backing Actors for pasted tokens`
  When enabled, newly pasted tokens also get world Actor documents and start linked to them. When disabled, pasted tokens remain actorless scene tokens.
- `Backing Actor type for pasted tokens`
  Chooses how the module handles backing Actors for new pasted tokens when backing Actors are enabled.
  `Ask each time` opens a prompt with `Scene token only`, `System default`, and any additional system Actor types. `System default` follows the current game system's configured default Actor type.
- `Lock pasted token rotation by default`
  When enabled, newly pasted scene tokens start with `lockRotation` enabled, and any generated backing Actor prototype token keeps that same default.

### Canvas text

- `Canvas text paste mode`
  Supports Journal-backed scene notes or fully disabling canvas text paste. The shipped default is `Scene notes`.

### Chat

- `Enable chat media handling`
  Master toggle for chat media paste, drag/drop, and upload behavior.
- `Enable chat upload button`
  Controls whether the explicit `Upload Chat Media` button appears.
- `Chat media display`
  Chooses between full preview, thumbnail preview, or link-only chat posts.

### Scene tools

- `Enable scene Paste Media tool`
  Controls whether the explicit scene-control paste button is shown.
- `Enable scene Upload Media tool`
  Controls whether the explicit scene-control upload button is shown.
- `Scene Paste Media prompt mode`
  Chooses whether the explicit scene-control paste button uses automatic browser behavior, always opens the manual paste prompt, or only uses direct clipboard reads.

## Readiness And Support

Foundry Paste Eater includes two GM-only read-only admin panels under:

```text
Game Settings -> Configure Settings -> Module Settings -> Foundry Paste Eater
```

### Readiness & Support

`Readiness & Support` is a status panel, not a setup wizard. It does not create folders, upload probe files, or change world settings directly.

It summarizes four areas:
- `Client capability`
  Whether the current browser exposes `navigator.clipboard.read`, whether the current context is secure, and what that means for explicit scene paste.
- `Storage readiness`
  The current upload source, base folder, bucket, visible S3 endpoint or base URL, and upload-path organization mode.
- `Player upload readiness`
  The module's role gates plus whether the required Foundry core permissions `Use File Browser` and `Upload Files` are present for the needed roles.
- `Default-profile drift`
  Whether the world still matches the shipped recommended defaults, with a summary of differences.

Each readiness item reports:
- `Pass`
- `Warn`
- `Fail`

and includes both a short explanation and a fixed remediation string.

The panel exposes these actions:
- `Open Upload destination`
- `Open Apply recommended defaults`
- `Download Support bundle`

### Support bundle

The support bundle downloads a JSON file named like:

```text
foundry-paste-eater-support-<timestamp>.json
```

It includes:
- module version
- Foundry version
- world id and title
- browser and clipboard capability summary
- current module settings and whether each differs from shipped defaults
- storage destination summary and known upload roots
- readiness results
- recent module log history

The bundle is sanitized before download:
- no cookies
- no passwords
- no auth tokens
- no storage-state payloads
- no raw AWS credential material
- signed URLs and URLs embedded inside longer strings are stripped down to safe URL forms

### Uploaded Media Audit

`Uploaded Media Audit` is a reference report, not a storage inventory and not a cleanup tool.

It scans current world references beneath all known upload roots and groups them by:
- upload root
- upload context: `canvas`, `chat`, or `document-art`
- document type

The report includes references from:
- Actor portraits
- Actor prototype token art
- placed token textures
- placed tile textures
- note icon textures
- chat media messages created by the module

Important limits:
- it only reports current world references
- it does not browse storage backends directly
- it does not tell you whether an unreferenced file still exists on disk or in S3
- it does not delete, expire, or clean up anything

### Runtime API

For GM-side automation or debugging, the module also exposes a read-only runtime API on:

```js
game.modules.get("foundry-paste-eater").api
```

Available methods:
- `getReadinessReport()`
- `collectSupportBundle()`
- `collectMediaAuditReport()`

## Permissions And Storage

### Player upload fix

When a player hits a storage permission error, the GM fix is in Foundry core permissions, not the module destination form:
- Open `Game Settings -> Configure Permissions`.
- Enable `Use File Browser`.
- Enable `Upload Files`.
- Apply those permissions to the affected player role, then retry the paste or upload.

If those permissions are already enabled, the problem is usually backend write access instead, such as filesystem permissions, S3 credentials, or bucket policy.

### Default upload location

By default, the module uploads into Foundry User Data under the base folder:

```text
pasted_images
```

With the default `Upload path organization`, actual uploads continue under context-specific subfolders such as:

```text
pasted_images/canvas/<user-id>/<YYYY-MM>/
pasted_images/chat/<user-id>/<YYYY-MM>/
pasted_images/document-art/<user-id>/<YYYY-MM>/
```

If you want world-local storage, a typical example is:

```text
worlds/<your-world>/pasted_images
```

### Storage governance and S3-friendly organization

If you use S3-compatible storage and want lower retention costs, a sensible pattern is:
- Keep a durable base prefix for long-lived Actor and sheet art.
- Enable `Upload path organization` so chat, canvas, and document-art uploads land in separate subfolders.
- Apply backend lifecycle rules only to clearly ephemeral prefixes such as `chat/` or temporary canvas scratch uploads.

Foundry Paste Eater does not delete uploads or manage retention policies itself. Storage cleanup remains a GM or storage-backend responsibility.

When the upload destination changes, the module records the old and new configured roots in a hidden world setting so the readiness panel, support bundle, and uploaded-media audit can continue reasoning across destination changes. That tracking is reference-only. It is not a retention or deletion feature.

## Troubleshooting By Symptom

| Symptom | What to check |
| --- | --- |
| Nothing happened when a player pasted on the canvas | Check canvas-media role minimums, feature toggles, actual document ownership or update rights, canvas focus, and whether Foundry copied objects were already waiting to paste |
| A player could paste to chat but not replace token or tile art | Check token or tile replacement settings, real update rights, and player file permissions |
| Pasting changed only the token in this scene | The user probably chose `Scene token only` in the prompt, or the selected token was ineligible for actor-wide updates. Change `Selected token image paste mode` if you want a different default |
| Actor-wide selected-token image paste failed | At least one selected token was probably unlinked, actorless, or tied to an Actor the user could not update |
| A direct media URL turned into normal text in chat | The remote host probably blocked browser-side download. Upload locally or use a CORS-friendly host |
| A direct media URL did not create canvas content | The remote host probably blocked browser-side download, so the module failed cleanly instead of creating broken scene content |
| The scene `Paste Media` button opened a prompt | This is expected when the prompt mode is `Always show prompt` or when direct clipboard reads could not provide usable media in `Auto` mode |
| Players can browse or upload nowhere | Check `Game Settings -> Configure Permissions` for `Use File Browser` and `Upload Files`, then check backend storage credentials or filesystem access |
| New media became a token when you expected a tile | `Default empty-canvas paste target` is probably set to `Active layer` or `Token`. With the shipped default, empty-canvas paste on the Tokens layer creates tokens |

## Browser Notes

### Secure-context restrictions

Direct clipboard reads are stricter than normal browser paste events. On raw IP addresses, insecure origins, or other untrusted contexts:

- `navigator.clipboard.read()` may be blocked
- the scene-control `Paste Media` action may warn or fall back to its manual prompt
- normal browser paste events may still work
- `Upload Media` and chat upload remain the safest fallback

### Firefox

Modern Firefox is much more usable than older versions for clipboard media workflows, but clipboard permission behavior can still differ from Chromium browsers. If direct clipboard reads prompt or fail, browser paste events and upload fallbacks should still cover the main workflows.

### Remote media URLs

Direct media URLs are downloaded in the browser before upload when possible. If a remote host blocks that browser-side download:
- canvas paste will warn instead of creating broken tiles or tokens
- chat paste will leave the original URL text in the input instead of creating a broken or empty media message
- focused art fields may fall back to the original URL when that media kind is supported there
- the safest workaround is to upload the file locally or use a host that allows browser-side downloads

## Supported Input Types

- Images, including animated formats such as `.gif` and `.webp`
- Browser-supported video formats such as `.webm`, `.mp4`, `.m4v`, `.mpeg`, `.mpg`, `.ogg`, and `.ogv`
- Direct media URLs
- Clipboard payloads that expose media through `text/uri-list`, `text/plain`, or HTML media tags
- Plain text for contextual note creation when `Canvas text paste mode` is enabled

When the browser exposes multiple `ClipboardItem` entries through `navigator.clipboard.read()`, the module scans all of them instead of assuming the first entry is the useful one.

That means:
- it can find media in a later clipboard item even if an earlier one only contains text or another unsupported payload
- it checks the current clipboard snapshot, not clipboard history
- it stops at the first usable media or text result and does not paste multiple clipboard items at once

## Suggested README GIFs

These placeholder callouts are grouped by feature area so recorded media can be dropped into the README without re-planning the structure later.

### Canvas creation

> INSERT `01-tile-create-large-image.gif` HERE
> Show an empty Tiles layer, paste a large panorama or animated image, and make the mouse-position placement plus automatic tile downscaling obvious.

> INSERT `02-token-create-backed-actor.gif` HERE
> Turn on `Create backing Actors for pasted tokens`, paste a portrait asset, then open the created token or actor sheet to prove the pasted token is grid-snapped and creates a linked backing Actor.

> INSERT `03-video-on-canvas.gif` HERE
> Show a `.webm` pasted onto the canvas, ideally first on Tiles and optionally then on Tokens, so autoplaying muted video support is visible.

### Canvas replacement

> INSERT `04-token-replace-in-place.gif` HERE
> Start with an existing token selected, paste very different art, and make it obvious that only the texture changes while size and position stay the same.

> INSERT `05-tile-replace-multi.gif` HERE
> Select two tiles and paste once so the README shows multi-selection replacement and in-place preservation clearly.

> INSERT `06-note-replace-in-place.gif` HERE
> Select an existing scene note, paste media once, and make it obvious that the note icon changes in place without creating a new tile.

> INSERT `07-direct-media-url-canvas.gif` HERE
> Paste a direct media URL onto the canvas to show URL download plus normal create or replace behavior.

### Text notes

> INSERT `08-standalone-note-from-text.gif` HERE
> Paste plain text onto open map space to show standalone Journal-backed note creation.

> INSERT `09-linked-note-append.gif` HERE
> Select a token, tile, or scene note, paste text twice, and show the same linked note or journal page being reused with appended content.

### Document art fields

> INSERT `10-actor-portrait-paste.gif` HERE
> Focus an Actor portrait field, Item portrait field, or token-config texture field, paste media, and show that the field preview updates without creating canvas or chat content.

### Chat

> INSERT `11-chat-image-and-video.gif` HERE
> Focus chat, paste an image, then paste a video, so the README shows chat-only routing and inline media previews.

> INSERT `12-chat-drag-drop-and-upload.gif` HERE
> Drag media into chat, then use the `Upload Chat Media` button to show the non-clipboard chat entry points.

> INSERT `13-direct-media-url-chat.gif` HERE
> Paste a direct media URL into chat so readers can see that remote media can become a normal uploaded chat post.

### Scene controls and fallbacks

> INSERT `14-scene-paste-prompt-fallback.gif` HERE
> Click `Paste Media`, let the manual paste prompt appear, paste into it, and show the prompt closing after successful creation.

> INSERT `15-scene-upload-tool.gif` HERE
> Use the scene `Upload Media` button so the fallback path is visible without relying on clipboard permissions.

> INSERT `16-hidden-mode.gif` HERE
> Hold `Ctrl` or `Cmd` with `Caps Lock`, paste new canvas media, and show the created tile or token as hidden.

### Admin and configuration

> INSERT `17-upload-destination-config.gif` HERE
> Open the Upload destination settings, change the target folder or source, then paste media so the README captures the storage configuration workflow.

## Testing And Debugging

- Unit suite: `npm test`
- Contract typecheck: `npm run typecheck`
- Bundle parity gate: `npm run verify:bundle`
- Full local release gate: `npm run verify:release`
- Manual QA guide: [TESTING.md](./TESTING.md)
- Playwright smoke suite: [test/README.md](./test/README.md)
- Pre-commit hooks: `pre-commit install`

Contributor workflows:
- `npm test` runs the jsdom/Vitest unit suite with coverage enforcement.
- `npm run typecheck` checks the shared support/report contracts and JSDoc-typed support surface.
- `npm run verify:bundle` rebuilds the runtime and fails if `foundry-paste-eater.js` does not match the committed artifact.
- `npm run verify:release` runs lint, unit tests, typecheck, bundle parity, packaging, and smoke tests when a local Foundry instance is reachable.
- `npm run test:smoke` runs the Playwright smoke suite against a live Foundry instance.
- `npm run lint` runs ESLint across the runtime and tests.

For manual repros, prefer a disposable scene or clear existing tokens, tiles, and notes before each scenario. Replacement-vs-create behavior depends on current scene state.

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

This fork builds on the original upstream project, `foundryvtt-clipboard-image`, and the people who helped shape it.

- Original upstream project, `foundryvtt-clipboard-image`, and early clipboard-media workflow work by JeansenVaars
- Thanks to @theripper93 for early design guidance
- Thanks to @vttom for help with Forge-related behavior
- Thanks to the Foundry VTT Discord community for issue reports and feedback

## License

[MIT License](./LICENSE.md)
