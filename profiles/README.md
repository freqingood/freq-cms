# Showcase audio

Drop an audio file in this folder, commit, done. The deploy workflow
regenerates `/showcase.json` from whatever is here, so there is no list
to keep in sync.

Accepted: `.mp3` `.m4a` `.aac` `.ogg` `.opus` `.flac` `.wav` `.webm`.
Subfolders are ignored, so keep masters or working files in one if you
want them in git without publishing them.

## Where each card field comes from

The builder reads the file's own tags first:

| Card shows      | Tag                                             |
| --------------- | ----------------------------------------------- |
| Title           | Title — falls back to the filename              |
| "Inspired by …" | Custom field `INSPIRATION`, else Album Artist    |
| Mood chip       | Genre                                            |
| Duration        | Decoded from the file, never typed               |
| "What we did"   | Comment, else custom field `MIXNOTE`             |
| Ring order      | Track number — untagged files sort to the back   |
| Accent colour   | Custom field `ACCENT`, else a stable auto colour |
| Artwork         | Embedded cover art, extracted to `covers/`       |

## Sidecars

The current files carry no tags, so each one has a sidecar instead: a
JSON file with the same base name, merged over anything read from the
file. This is also how you fix a name without renaming the audio.

```
profiles/The Bealtes.mp3
profiles/The Bealtes.json   ->  { "title": "The Beatles", ... }
```

Either approach works. Tags travel with the file; sidecars are easier to
diff and edit. Sidecar values always win.

## Running order

`order` is set deliberately, not alphabetically. Two rules:

- profiles by the same mixing engineer sit as far apart as the ring
  allows, so consecutive plays never sound like one person's habits
- profiles sharing a mood chip do the same

On a nine-card ring the furthest two cards can ever be is 4 positions.
All four constrained pairs currently sit at exactly 4:

| Order | Profile               | Mood       |
| ----- | --------------------- | ---------- |
| 1     | ABBA                  | Pop        |
| 2     | The Beatles           | Rock       |
| 3     | Linkin Park           | Nu Metal   |
| 4     | Radiohead             | Alt Rock   |
| 5     | Daft Punk             | Electronic |
| 6     | Michael Jackson       | Pop        |
| 7     | Pink Floyd            | Prog Rock  |
| 8     | Nirvana               | Grunge     |
| 9     | Red Hot Chili Peppers | Funk Rock  |

ABBA/Daft Punk, The Beatles/Pink Floyd and Linkin Park/Nirvana share an
engineer; ABBA/Michael Jackson share a mood. Adding a tenth profile
changes the arithmetic, so re-check the spacing when you do.

## Loudness

All nine sit at -18.0 LUFS integrated with true peaks at or below
-1.5 dBFS, so no profile sounds better simply for being louder. Match
that when you add one:

```
ffmpeg -i in.wav -af loudnorm=I=-18:TP=-1.0:LRA=11 -b:a 320k out.mp3
```

Two-pass loudnorm is more accurate than the single pass above if you
care about landing exactly on target.

## Running the builder locally

`showcase.json` is rebuilt on every deploy, so you only need this to
preview changes before pushing:

```
npm i --no-save music-metadata
node tools/build-showcase.mjs
```

It warns about any profile missing an inspiration or mood, which is the
quickest way to spot a half-configured upload.

## Not this folder

`/Showcase` (before/after WAVs) belongs to a different page and is not
read by any of this.
