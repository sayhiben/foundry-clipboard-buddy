### 1.3.0
* Add GM-only `Readiness & Support` and `Uploaded Media Audit` panels, plus a sanitized support-bundle export and read-only runtime support API for diagnosing storage, permissions, defaults drift, and referenced uploaded media
* Add release hardening with shared contracts, JSDoc typechecking, bundle parity checks, `verify:release`, and stronger CI/package verification so runtime, tests, and shipped artifacts stay aligned
* Finish the runtime and test architecture refactor into domain modules, split the Playwright and unit harnesses by behavior, and harden smoke isolation so stale scene artifacts do not leak between browser tests
* Improve native Finder/Explorer media handling by normalizing under-described pasted files earlier, restoring canvas targeting after chat paste, and rasterizing canvas-bound GIFs to reliable PNG uploads while keeping chat GIF behavior intact
* Polish GM-facing UX with improved recommended-defaults buttons, tighter selected-token `Ask` dialog layout, inline chat upload controls, and redesigned readiness/audit panels with clearer sections and scrollable audit tables
* Update shipped defaults and token creation behavior so empty-canvas media follows the active layer, canvas text creates scene notes, pasted tokens create backing Actors by default, and actor-backed pasted tokens link to their backing Actor by default
* Expand regression coverage for support flows, defaults drift, Finder-native PNG/JPG/GIF paste cases, GIF rasterization edge cases, linked backing-Actor token creation, and live release verification

### 1.2.0
* Add explicit selected-token image paste modes with `Scene token only`, `Actor portrait + linked token art`, and `Ask each time`; actor-wide updates now apply both portrait and linked-token defaults while video stays scene-local
* Improve storage-permission diagnostics so player upload failures tell GMs exactly where to fix Foundry core permissions: `Game Settings -> Configure Permissions`, including `Use File Browser` and `Upload Files`
* Add organized upload-path routing for `canvas`, `chat`, and `document-art` contexts so S3 and other storage backends can apply safer lifecycle rules without the module owning retention
* Ship safer first-run defaults for new worlds, including visible non-GM scene controls, tile-first empty-canvas media, disabled canvas text paste, prompted token-image behavior, and organized upload paths
* Add a GM-only `Apply recommended defaults` menu for existing worlds that want to adopt the current shipped behavior defaults without changing upload destinations or client-only diagnostics
* Rework the README and testing docs around real GM expectations, shipped defaults, permissions, storage, and case-by-case paste behavior
* Expand unit and Playwright coverage for routing, actor-art propagation, permission/error guidance, upload-path organization, default-profile behavior, and cross-browser stability; harden smoke assertions against stale document reads after successful replacement polls

### 1.1.0
* Add selected scene notes as first-class paste targets: media now replaces note icons in place and plain text appends to linked Journal content
* Route media paste into focused Actor, Item, and token-style art fields before canvas or chat handling, including direct media URL support and preview refresh
* Prefer direct animated or video URLs over rasterized clipboard blobs only when the blob is an obvious static fallback, preserving real animated clipboard media
* Apply scene-control and chat visibility setting changes live in the current session, including removal of stale chat upload buttons
* Rework the Playwright harness to reuse authenticated sessions for single-user specs, keep multi-user permission flows isolated, and improve local Foundry recovery
* Expand browser and unit coverage for note workflows, focused art fields, settings and permission behavior, diagnostics, scene-control prompt fallbacks, and direct media URL cases
* Improve S3 smoke preflight diagnostics so expired local AWS sessions fail with an actionable reauthentication message

### 1.0.0
* Route module errors through a shared reporting pipeline that alerts the acting user, relays richer details plus a logfile link to connected GMs, and auto-downloads verbose logfiles for debugging clients
* Add client-side verbose browser-console logging for clipboard parsing, upload, paste routing, and create vs replace diagnostics
* Expand the Playwright smoke suite with edge-case coverage for mixed clipboard payloads, non-media URL note fallback, HTML media URLs, hidden paste mode, scene-control paste, and copied-object priority
* Add a Playwright smoke suite for automatable Foundry workflows, plus setup docs for browser-driven regression testing
* Add a dedicated `TESTING.md` manual QA guide for release validation and regression coverage
* Support contextual plain-text paste by creating or updating Journal-backed scene notes for selected placeables and open map locations
* Support animated image formats and browser-supported video media for canvas paste, chat paste, uploads, and media URLs
* Download pasted media URLs before creating tiles, tokens, or chat media posts
* Post pasted media to chat when the chat input is focused
* Add chat drag/drop and upload-button support for image and video messages
* Format chat media posts as clickable thumbnails or inline video previews with an `Open full media` link
* Replace selected tile textures in place when pasting over controlled tiles
* Replace selected token textures in place when pasting over controlled tokens
* Paste into the active Tokens layer as media-backed tokens, while keeping Tiles as the default paste target
* Add browser `paste` event support alongside async clipboard reads
* Add scene control buttons for `Paste Media` and `Upload Media`
* Add file-picker media import as a fallback for mobile or restricted browsers
* Improve macOS support with a dedicated `Cmd+V` path
* Scan all clipboard items for media data instead of only the first clipboard entry
* Add an upload destination settings panel for choosing User Data, The Forge, S3-compatible storage, or another picker-provided source
* Route directory creation and uploads through the selected FilePicker source and S3 bucket

### 0.5.0
* Support Foundry V13
* Replace private canvas clipboard and pointer access with public APIs
* Replace deprecated global `KeyboardManager` and `FilePicker` access with V13 namespaces
* Clean up the manifest for Foundry V13 compatibility

### 0.4.0
* Support Foundry V12

### 0.3.2
* Won't paste if Tokenizer is open

### 0.3.1
* Support Foundry V11 (Fixed)

### 0.3.0
* Support Foundry V11

### 0.2.0
* Support Foundry V10

### 0.1.6
* Handle errors when server is not ssl encrypted

### 0.1.5
* Fixed some image sources not working at all on copy-paste (Thank you, @Opius for reporting)

### 0.1.4
* Handle errors when using a browser without clipboard api support

### 0.1.3
* Use a filepicker in settings to selected pasted folders location

### 0.1.2
* Updated compatibility version to V9.236

### 0.1.1
* Updated compatibility version to V9.235

### 0.1.0
* Support for V9 (Not backwards compatible)

### 0.0.8
* Given absolute priority to Clipboard in FoundryVTT

### 0.0.7
* Ignore paste events when focus is not on the scene canvas

### 0.0.6
* CapsLock ON will paste images hidden to players
* Slight improve in performance with large files and slow network connections
* Multiple times pasting will be ignored until previous paste finished
* Paste is cancelled once if there was a copied object from the canvas (notice given)

### 0.0.5
* Fixed pasting images that resulted in tiles of size 0 in certain cases (Thank you @vttom)

### 0.0.4
* Fixed path recognition of image (should work now on the Forge)

### 0.0.3
* Changed default dir to pasted_images

### 0.0.2
* Storage of images as files from the clipboard

### 0.0.1
* Initial Release
