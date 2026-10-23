# SongVault Studio — Phase 2 / Installable Web App

SongVault is a **local-first song library** with album/genre organization, playback, multiple versions, lyrics, style/voice drafts, Song/Speech workbench, and backup/restore. Official Suno integration is **not yet available**.

## What is new in Phase 2

- Complete installable PWA files: `manifest.webmanifest`, icons for Android and desktop, and `sw.js` offline caching.
- Works under a project subdirectory such as `/SongVault-Studio/` on GitHub Pages. All application resources use relative URLs.
- App-install button with platform-specific instructions.
- Browser storage estimate, request for persistent storage, online/offline connection status, and update notice.
- Preserves Phase 1's IndexedDB database name `songvault-studio-v1` **on the same origin**, so existing data remains.
- No API keys, authentication, server-side code, analytics, trackers or remote music access.

## Publish for free on GitHub Pages

1. Sign in to **github.com** and create a **new PUBLIC repository** called `songvault-studio` (you can pick another repository name). GitHub Free Pages requires public source code. Do **not** upload any downloaded music, backups, private lyrics, credentials or API tokens.
2. Select **Add file → Upload files**, then upload **the CONTENTS of this extracted folder** to the repository root: `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll`, `icons/` and `README.md`. Keep the `icons` subfolder intact. If browser upload won't select a folder, use GitHub Desktop or upload the ZIP contents through your computer. Do NOT upload just the ZIP.
3. In the repo go to **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main, folder: /(root) → Save**.
4. GitHub will provide your site URL, usually `https://YOUR-USERNAME.github.io/songvault-studio/`. Open that URL on Android Chrome.
5. Tap ⋮ → **Install app** / **Add to Home screen**. The app is usable offline after its first successful online load.
6. In SongVault, open **Backup** and run **Download full backup** after adding audio or drafts.

**Important:** The Pages site is publicly reachable. Only the code is served by GitHub; your songs, lyrics, albums and imported audio stay in IndexedDB on the device and browser origin. There is **no cloud sync**.

## Migrating your existing Phase 1 library

- If updating the existing files on the **same browser origin and URL**, the same IndexedDB database is reused.
- If moving from `file://` or `localhost` to GitHub Pages, those are different origins, so the old library will NOT appear automatically. At the old location, choose **Backup → Download full backup** to get a ZIP. At the new hosted site, **Backup → Restore from file** and select the ZIP.
- If switching phones or browsers, transfer the ZIP yourself and restore. Audio is included in a full ZIP, **not** in a metadata-only JSON.

## Test locally on desktop

Run `python -m http.server 8000` in the unzipped directory and visit `http://localhost:8000/`. Most modern browsers allow service workers on localhost even without HTTPS.

## Limitations / safety

- **No direct Suno API access**, song generation, account library imports, cloud backups, user login, payment integration, or remote syncing.
- Genre/album assignments are only inside SongVault; they do not edit Suno albums or folders.
- Offline mode requires an initial online load on a stable hosted address.
- Browser storage can be removed by user action or device policies. Persistent storage permission is not a guarantee. Back up frequently.
- Full ZIPs are uncompressed with standard ZIP limitations and can use significant memory/storage for large collections. Archive very large music collections in batches.
- Restores merge on internal song IDs and don't deduplicate by title.
- Not an official Suno application. Do not paste Suno auth cookies or private API keys into any front-end code.
- Store sensitive unpublished material only if you are comfortable with device/browser-local storage.