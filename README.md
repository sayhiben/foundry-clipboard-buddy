![GitHub all releases](https://img.shields.io/github/downloads/sayhiben/foundry-clipboard-buddy/total?logo=GitHub) ![GitHub release (latest by date)](https://img.shields.io/github/downloads/sayhiben/foundry-clipboard-buddy/latest/total) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/sayhiben/foundry-clipboard-buddy) ![GitHub issues](https://img.shields.io/github/issues-raw/sayhiben/foundry-clipboard-buddy) ![GitHub](https://img.shields.io/github/license/sayhiben/foundry-clipboard-buddy)
# Foundry Clipboard Buddy

Fork of JV's Clipboard Image for Foundry VTT.

Allows copy-pasting images, animations, browser-supported video media, and contextual text notes directly into Foundry VTT Tiles, Tokens, Notes, or Chat.

### _Created by: JeansenVaars_ - [Invite me a coffee if you like this module :D](https://ko-fi.com/jeansenvaars)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V14D3AH)

![example](example.gif)

### Compatibility

Verified on Foundry VTT 13.351. The module uses the public canvas clipboard and mouse APIs introduced in V13 together with the V13 `KeyboardManager` and `FilePicker` namespaces.

### Usage

1. Copy media or plain text from any source, including direct media URLs.
2. In desktop browsers, focus the canvas and press `Ctrl+V` or `Cmd+V`, or use your browser's normal Paste action.
3. When the chat input is focused, normal text paste stays normal text. Pasting media or a direct media URL uploads it and posts an inline preview message to chat instead of placing it on the canvas.
4. When one or more tokens or tiles are selected, plain text paste appends to an associated journal-backed note and keeps a linked note pin on the scene for that placeable.
5. When no supported placeable is selected, plain text paste on the canvas creates a standalone scene note at your mouse position, or the canvas center when a fallback is needed.
6. On Tiles and Tokens controls, use `Paste Media` for direct clipboard reads or `Upload Media` for a file-picker fallback that works better on touch devices and restricted browsers. These explicit scene tools remain media-only.
7. In chat, drag media onto the chat input or use the chat `Upload Chat Media` button to post uploaded media.
8. If selected tokens or tiles are present, media paste replaces the active layer's selection first, then falls back to the other supported selection type. Otherwise the media pastes into the active Tokens layer when Tokens are selected, or under your mouse as a Tile and switches you to the Tiles layer.
9. To change where pasted files are stored, open World Settings and configure Clipboard Image's `Upload destination`.

### Servers without HTTPS or Domain
Direct clipboard reads are stricter than browser paste events and uploads. If you are serving Foundry from an untrusted origin such as a raw IP address, the browser may block `navigator.clipboard.read()` even though `Paste Media` via browser paste gestures or `Upload Media` still work better as fallbacks. Remote media URLs can also fail if the source host blocks browser-side downloads.
![image](https://user-images.githubusercontent.com/27952699/156756889-7117a0de-43eb-434b-bdde-8c36798c3a37.png)

### Firefox Support

Modern Firefox supports clipboard media workflows much better than older releases did. Depending on browser version and security context, direct clipboard reads may still prompt or be unavailable, but browser paste events and `Upload Media` provide fallbacks without relying on deprecated APIs.

### Functionalities

1. Media uploads to `pasted_images` by default. In World Settings, `Upload destination` lets you choose the file store and folder using Foundry's native file picker.
   This supports User Data, The Forge, and Amazon S3 without the module implementing its own backend-specific upload logic.
   If you would like for example to store pasted media within your specific world, then you can set `worlds/<my-world>/pasted_images`
2. If the chat input is the active target, image paste, animated image paste, video paste, direct media URL paste, and drag/drop post a chat message with either an inline thumbnail or an inline video preview plus an `Open full media` link, while normal text still pastes as plain chat text.
3. Plain text paste on the canvas uses Foundry Journal/Note norms. Selected tokens or tiles get an associated journal-backed scene note that is reused on later pastes, while text pasted onto open map space creates a standalone scene note.
4. Keyboard and browser media paste priority on the canvas is: Foundry copied objects first, then selected tokens or tiles on the active layer, then selected tokens or tiles on the other supported layer, then new token creation on the Tokens layer or new tile creation elsewhere. The scene-control `Paste Media` and `Upload Media` actions are explicit media tools and do not defer to Foundry's copied-object buffer.
5. If one or more tokens or tiles are selected, media paste updates their current texture without moving or resizing them.
6. If you paste while the Tokens layer is active with no selected tokens or tiles, the media is created as a Token snapped to the grid and fit to one grid square on its shortest side while preserving aspect ratio.
7. If pasted media is larger than Canvas dimensions, then the Tile will be pasted as 1/3 the size of the canvas while holding proportions.
8. Video tiles are created with autoplay and loop enabled, with volume muted by default.
9. Scene controls now expose `Paste Media` and `Upload Media` actions for mouse, touch, and mobile-friendly workflows.
10. Chat input supports paste, drag/drop, and a file-picker upload button for image and video messages.
11. Animated GIF and animated WebP files are accepted as image media, while browser-supported video formats such as `.webm`, `.mp4`, `.m4v`, and `.ogg` are treated as video media.
12. Use CAPS LOCK to toggle between hidden or visible paste mode
13. Faster when using small files, keep it reasonable! (large media is not an issue but rather avoid problems with slow networks and bad internet)
14. The clipboard media scan checks all clipboard items, not just the first clipboard entry, listens for browser `paste` events as an additional fallback path, can download direct media URLs before creating the Tile, Token, or chat post, and falls back to contextual note creation when the pasted content is plain text.

## Testing

Use [TESTING.md](./TESTING.md) as the manual QA checklist for release validation, browser coverage, chat and canvas regressions, and upload-destination checks.

## Recommended With

[Minimal UI](https://github.com/saif-ellafi/foundryvtt-minimal-ui)
and [Super Select](https://github.com/saif-ellafi/foundryvtt-super-select)

## Known Issues

If you are using **Chat Images** module, it may happen that pasting an image on the chat, if the chat panel is located somewhere
on top of the scene canvas, it might paste the image also on the scene. I could not yet find a solution for this, but
the circumstances are rare enough, it should not be an issue on a regula basis. This is due **Chat Image** disabling the focus on the chat,
when pasting, making me think that the mouse is prioritized on the scene instead of the chat.

## Appreciations

* @theripper93 for proposing a much better way of achieving this. Without his help this module would have struggled!
* @vttom for an amazing helpful attitude to get this module working properly in **The Forge**

## By JeansenVaars

![JVLogo](logo-small-black.png)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V14D3AH)

## Check out my other modules!

* Minimal UI
* Scene Preview
* Super Select

# Appreciations

* Thanks to the FoundryVTT Discord community for the amazing issue reports and feedback.

# License

[MIT License](./LICENSE.md)

# Powered By

[![JetBrains](./jetbrains.svg)](https://www.jetbrains.com)

Thanks to JetBrains I can work on this project using **WebStorm**.
