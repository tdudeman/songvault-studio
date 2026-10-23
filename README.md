# SongVault Studio v4.0 — Playlists & Music Player

**Website:** https://tdudeman.github.io/songvault-studio/

SongVault is an offline-first personal music library that stores local song metadata and imported audio in your browser's IndexedDB. **It has no Suno API connection, account sync, or cloud backup.** Its source code is public but your library is not uploaded to GitHub.

## What's new in v4.0

- Create, rename, and delete **playlists** without deleting their songs.
- Add and remove tracks, including drafts without audio; reorder playlist songs.
- Play a playlist or album, or start a filtered library queue. Playback defaults to the current selection and proceeds to later tracks with imported audio.
- Player now has **Previous**, **Next**, **Shuffle upcoming**, **Repeat off/all/one**, and **Queue** controls.
- Queue panel supports playing a specific queued track, moving tracks, removing tracks, and clearing the queue.
- Add an individual song to any playlist or to the current queue from the Library.
- Mobile background playback uses the browser audio element and Media Session controls when supported by Android Chrome. The operating system may interrupt playback; screen-off/background playback requires device testing.
- Playlists are stored in a new IndexedDB object store. Existing song, album, and audio stores are preserved by an automatic database upgrade from v1 to v2, under the same database name `songvault-studio-v1`.
- Complete ZIP and metadata JSON backups **include playlists**. Previous backup files (without a playlists field) can still be restored.
- Version 4 service worker pre-caches the new player assets for offline UI use.

## First run after updating

1. Open the existing app at https://tdudeman.github.io/songvault-studio/ and choose **Update app** if prompted. Verify that the app footer says `v4.0`.
2. **Before importing or reorganizing anything, download a full ZIP backup** from Backup.
3. Tap Playlists → New playlist, add some imported tracks, and press Play all.
4. Test next/previous, repeat, shuffle, and the queue. Close and reopen the app to confirm the playlist persists.
5. Check Android's system media controls while the app runs in the background. This varies by Android/browser power management.

## Important storage and backup details

- Audio and metadata are stored **per device and browser origin**. SongVault doesn't sync across phones, computers, or Suno.
- Do not clear Chrome site data for this app before making a ZIP backup.
- A metadata-only JSON export includes playlists and library catalog information, **not audio**.
- The full ZIP includes audio blobs alongside metadata. Large backups may consume substantial RAM/storage and should be tested with small sets first.
- Your Suno songs need to be downloaded and imported manually until an authorized integration exists.
- Existing songs, album artwork, album track ordering, lyrics, descriptions, and genre organization are retained.

## Deployment

Commit `index.html`, `phase3.js`, `phase3.css`, `phase4.js`, `phase4.css`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, and the `icons/` folder to a GitHub repository. Enable Pages from the default branch/root. The site is a static PWA; no paid server is needed.

## Validation

The inline app JavaScript and all standalone scripts pass `node --check`; PWA paths and ZIP structure were checked. Local browser navigation was blocked by the testing environment's administrator policy, so Android device behavior still requires real-world testing. GitHub Pages availability can be independently verified after deployment.