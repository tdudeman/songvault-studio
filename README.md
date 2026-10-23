# SongVault Studio v6.0

Offline-first, installable music library and songwriting workspace. [Open the app](https://tdudeman.github.io/songvault-studio/).

## Phase 6: Bulk import and organize

- **Organize** tab: import multiple local audio files with a review step.
- Parse `Artist - Title` filenames and let the user edit title, artist, genre, subgenre and album before importing.
- Suggest genre/subgenre from explicitly named folders and saved descriptive text only; **no audio listening or AI music analysis**.
- Warn about likely duplicates by filename and size. Flags are advisory; duplicate candidates are deselected by default and can be manually selected.
- Review and apply suggested missing categories to existing songs without overwriting set values.
- Song metadata and audio are saved atomically per imported track into the existing IndexedDB stores.

## Use

1. **Export a full ZIP backup** in Backup first.
2. Open **Organize → Select audio files** (or folder if supported).
3. Review track information and duplicate warnings. Select **Import**.
4. Browse genres/albums or review additional suggested metadata.

## Limitations

- Suno integration is not currently authorized. This app cannot download your Suno library directly.
- Everything you import stays in this browser/device. Nothing is uploaded to GitHub. Clearing application/site data can erase the library.
- Keep off-device full ZIP backups. Web storage quotas and codec playback support depend on browser/device.
- Filename and file size comparisons are **not** a definitive or exhaustive duplicate scan.
- Folder import and background playback support vary by browser.
- The app reviews up to 500 supported audio files per batch; select more in additional batches.

## Technical

Static HTML, CSS and JavaScript, IndexedDB database `songvault-studio-v1` version 2, PWA manifest, cache-versioned service worker. Source assets `phase3.js` through `phase6.js` build progressively; no framework/server required for local functionality.
