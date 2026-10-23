# SongVault Studio — Phase 5: Song Creation Studio

Free, offline-first, installable music library and song-drafting workspace, hosted at **https://tdudeman.github.io/songvault-studio/**.

## What's new in v5.0

- New creation studio view with six editable starting sounds (neon synth-pop, haunted carousel, dreamy electropop, Irish swing, cinematic ballad, melodic K-pop).
- Copy **Lyrics**, **Styles**, and **Voice** individually from the draft editor; speech drafts can copy **Script**, **Tone**, and **Backing Music** independently. Copying works without saving first.
- Copy an all-in-one creative brief, or download a plain-text brief file to keep outside the browser.
- Instrumental toggle (lyrics are preserved in the saved draft but excluded from the instrumental prompt).
- Optional BPM, musical key, time signature, and excluded styles.
- Lyric section insertion tools (Intro, Verse, Chorus, Bridge, etc.) and live character counts.
- Duplicate a draft without copying imported audio versions or modifying the source track.

## How to use

1. Launch **Create** and choose a preset or start a blank **Song** or **Speech** draft.
2. Add a title and edit lyrics/script, style, voice, tone, or backing-music instructions.
3. Use the individual **Copy** controls to paste into the corresponding fields of Suno's creation screen. This app does not directly generate music.
4. Save the draft. Imported audio versions can be attached to the saved track later from its editor.
5. In **Backup**, export a **full ZIP** after any important edits. Metadata-only JSON excludes audio files.

## Install / updates

Open the HTTPS website on Android Chrome. Chrome's menu offers **Install app** when supported. An existing installed version receives app updates after the service worker refreshes. The database persists at the *same origin* (`tdudeman.github.io` with `/songvault-studio/`). If moving browsers/devices or changing origin, use a ZIP backup.

## Data compatibility

This release keeps IndexedDB database **`songvault-studio-v1`**, its version **2**, and its existing `songs`, `albums`, `audio`, and `playlists` stores. New creation settings are optional fields on existing song records, and the original `songvault-v1` full ZIP/JSON formats remain compatible. Existing albums, playlists, songs, and imported audio should be retained on upgrades on the same origin. Make a backup before editing or using a new version.

## Privacy / security

- No Suno API access, Suno login, automatic song generation, account synchronization, or third-party scripts.
- Your songs and drafts are stored only in **your browser's IndexedDB**, not on GitHub. The public GitHub repository contains source code and app assets only.
- Browser storage can be cleared by your browser/device. **Backups are required** to protect your work.
- Installed app background music depends on device/browser support; this release does not modify the Phase 4 music player.
- No remote hosting of music/audio files, and no Google account sign-in.

## Source structure

`index.html` + Phase 3–5 CSS/JS + `sw.js` + static icons/manifest. No build tools required; published via GitHub Pages `main` branch root.