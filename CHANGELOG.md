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
* Clean up the manifest for V13-only compatibility

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
