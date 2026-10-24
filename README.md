# SongVault Studio — v9.0 (Phases 7–9)

**Live app:** https://tdudeman.github.io/songvault-studio/

Offline-first personal music organizer. All imported audio, song metadata, album covers, lyrics, and drafts remain in the device's browser IndexedDB. No Suno API access or account sync is required or implemented.

## Phase 7 — Media metadata and alternate takes

- **Media** view shows imported audio versions and any measured durations.
- **Scan missing durations** checks files already stored locally, one at a time. Unsupported formats or files with unavailable metadata are skipped, not modified.
- Song editor lets you attach a separate per-song artwork image (cropped/compressed locally, with album artwork as fallback), rename takes, add version notes, and retain the original file and active version.
- Audio durations are also captured when possible during playback.

## Phase 8 — Discover and classify

- **Discover** view searches titles, artist, lyrics, styles, voice notes, album names, version notes and tags.
- Filter results by genre, tag, media type, favorites, available audio, or draft status; sort by date/title/artist.
- Favorite individual songs and add custom comma-separated tags in their editor. All metadata remains local.
- Search results update as you type. Audio playback and add-to-playlist/queue functions continue to use the Phase 4 player.

## Phase 9 — Library safety and portability

- **Health** view runs a non-destructive IndexedDB audit for missing audio referenced by a song and unreferenced audio blobs.
- Restore from ZIP or JSON now shows a **review screen** with song, album, playlist and audio counts and warns when matching song IDs would be overwritten. Restoring still merges by ID; keep a full backup first.
- New CSV catalog export (metadata only, no audio) in addition to existing full ZIP and JSON exports.
- `sv9Audit` reports approximate site-wide browser storage usage if the device exposes it.

## Updating and using on Android

1. Open the **Backup** tab and download a **full ZIP backup** before updating.
2. Open https://tdudeman.github.io/songvault-studio/, choose **Update app** if prompted, and confirm **v9.0** at the bottom of the sidebar.
3. Visit **Media**, **Discover**, and **Health**. Try a version rename, favorite a track, filter it in Discover, and run a health audit.
4. Test a **restore preview** with a recent ZIP, then **Cancel** rather than restoring during initial testing.

## Security and limitations

- No new IndexedDB schema version. New fields such as `tags`, `favorite`, `durationSec`, `artworkDataURL` and take notes are optional, preserving old records.
- Media duration extraction depends on browser codec support. This is not audio/music genre analysis.
- The ZIP backup format remains `songvault-v1`; JSON catalogs and CSV exports exclude audio files.
- A completed browser storage write is not a substitute for an external backup. Clearing site data deletes local music.
- This build does **not** sync libraries between devices or read/manage a Suno account.