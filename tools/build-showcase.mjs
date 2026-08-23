#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   THE FREQ — SHOWCASE BUILDER

   Scans /profiles for audio files and writes /showcase-data.js,
   the config the landing page loads with a plain <script> tag.
   Everything the showcase section displays is derived from the
   file itself, so adding a profile is: drop the file in, commit.

   Run it:
     npm i --no-save music-metadata
     node tools/build-showcase.mjs

   ── WHERE EACH FIELD COMES FROM ─────────────────────────────
   title        ID3 "Title"        → falls back to the filename
   inspiration  ID3 custom frame "INSPIRATION"
                → else "Album Artist" → else "Artist"
   mood         ID3 "Genre" (first value)
   mixNote      ID3 "Comment" → else custom frame "MIXNOTE"
   duration     decoded from the file, never typed by hand
   order        ID3 "Track number" → else alphabetical
   accent       ID3 custom frame "ACCENT" → else a stable colour
                derived from the filename, so it never changes
   artwork      embedded cover art, extracted to /profiles/covers

   Subdirectories are ignored, so /profiles/masters (the WAV
   originals) is never scanned or published.

   Anything a tag can't express goes in an optional sidecar:
   /profiles/<same-name>.json is merged over the derived values.
   ───────────────────────────────────────────────────────────── */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PROFILES_DIR = path.join(ROOT, 'profiles');
const COVERS_DIR = path.join(PROFILES_DIR, 'covers');
const OUT_FILE = path.join(ROOT, 'showcase-data.js');

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.flac', '.wav', '.webm']);

/* Relative, with no leading slash, so the same path works both on
   thefreq.in and when index.html is opened straight off disk. */
const BASE = 'profiles/';

/* Stable palette. Index is picked from a hash of the slug, so a
   given file always gets the same colour across rebuilds. */
const PALETTE = [
  '#F50CA0', '#5ec8d4', '#F5E663', '#ff7a45', '#c084fc',
  '#5eead4', '#7dd3fc', '#fbbf24', '#f472b6', '#a3e635'
];

let parseFile;
try {
  ({ parseFile } = await import('music-metadata'));
} catch {
  console.error(
    '\nmusic-metadata is not installed.\n' +
    'Run:  npm i --no-save music-metadata\n'
  );
  process.exit(1);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'profile';
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function fmtDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* Pull a custom TXXX / vorbis-style frame by description, across
   whichever tag format the file happens to use. */
function customTag(meta, wanted) {
  const target = wanted.toLowerCase();
  for (const frames of Object.values(meta.native || {})) {
    for (const frame of frames) {
      const v = frame.value;
      const id = typeof frame.id === 'string' ? frame.id.toLowerCase() : '';

      // ID3v2 as music-metadata flattens it: id = "TXXX:INSPIRATION"
      if (id === target || id.endsWith(':' + target)) {
        if (typeof v === 'string') return v.trim();
        if (v && typeof v.text === 'string') return String(v.text).trim();
      }
      // Older / vorbis shape: { description, text }
      if (v && typeof v === 'object' && typeof v.description === 'string') {
        if (v.description.toLowerCase() === target) return String(v.text || '').trim();
      }
    }
  }
  return '';
}

function firstComment(meta) {
  const c = (meta.common || {}).comment;
  if (Array.isArray(c) && c.length) {
    const entry = c[0];
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry.text === 'string') return entry.text.trim();
  }
  // Some taggers park the note in a custom frame instead of COMM.
  return customTag(meta, 'MIXNOTE') || customTag(meta, 'comment') || customTag(meta, 'description');
}

function isHexish(v) {
  return typeof v === 'string' && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\()/i.test(v.trim());
}

async function extractCover(meta, slug) {
  const pic = meta.common.picture && meta.common.picture[0];
  if (!pic || !pic.data) return '';
  const ext = (pic.format || '').includes('png') ? '.png' : '.jpg';
  await mkdir(COVERS_DIR, { recursive: true });
  const file = path.join(COVERS_DIR, slug + ext);
  await writeFile(file, Buffer.from(pic.data));
  return `${BASE}covers/${slug}${ext}`;
}

async function readSidecar(dir, base) {
  try {
    const raw = await readFile(path.join(dir, base + '.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function build() {
  let entries;
  try {
    entries = await readdir(PROFILES_DIR, { withFileTypes: true });
  } catch {
    console.error(`No /profiles directory at ${PROFILES_DIR}`);
    entries = [];
  }

  const audio = entries
    .filter((e) => e.isFile() && AUDIO_EXT.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  const profiles = [];
  const warnings = [];

  for (let i = 0; i < audio.length; i++) {
    const filename = audio[i];
    const base = path.basename(filename, path.extname(filename));
    const slug = slugify(base);
    const abs = path.join(PROFILES_DIR, filename);

    let meta;
    try {
      meta = await parseFile(abs, { duration: true });
    } catch (err) {
      warnings.push(`${filename}: could not be read (${err.message})`);
      continue;
    }

    const common = meta.common || {};
    const format = meta.format || {};

    const inspiration =
      customTag(meta, 'INSPIRATION') ||
      (common.albumartist || '').trim() ||
      (common.artist || '').trim();

    const accentTag = customTag(meta, 'ACCENT');

    const derived = {
      id: slug,
      title: (common.title || '').trim() || titleFromSlug(slug),
      inspiration,
      mood: (Array.isArray(common.genre) && common.genre[0] ? common.genre[0] : '').trim(),
      duration: fmtDuration(format.duration),
      mixNote: firstComment(meta),
      audio: BASE + encodeURIComponent(filename),
      artwork: await extractCover(meta, slug),
      accent: isHexish(accentTag) ? accentTag.trim() : PALETTE[hash(slug) % PALETTE.length],
      // Tagged track numbers lead. Untagged files fall in behind them,
      // alphabetically, instead of colliding with real track numbers.
      order: Number.isFinite(common.track && common.track.no)
        ? common.track.no
        : 10000 + i
    };

    const overrides = await readSidecar(PROFILES_DIR, base);
    const merged = { ...derived, ...overrides };

    // Warn on the merged result, not the raw tags: a sidecar is a
    // perfectly good way to supply these, and warning before the merge
    // just cries wolf on every correctly configured file.
    if (!merged.inspiration) warnings.push(`${filename}: no inspiration (tag it or add a sidecar)`);
    if (!merged.mood) warnings.push(`${filename}: no mood, card chip will be empty`);

    profiles.push(merged);
  }

  profiles.sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title, 'en'));

  const header = [
    '/* THE FREQ — SHOWCASE CONFIG',
    ' *',
    ' * GENERATED by tools/build-showcase.mjs — hand edits are lost on',
    ' * the next run. For one-off tweaks edit this file and stop running',
    ' * the generator, or put the change in a sidecar next to the audio',
    ' * (profiles/<name>.json) so it survives regeneration.',
    ' *',
    ` * ${profiles.length} profile(s), ${new Date().toISOString()}`,
    ' */',
    ''
  ].join('\n');

  const body = 'window.FREQ_SHOWCASE_PROFILES = ' +
    JSON.stringify(profiles, null, 2) + ';\n';

  await writeFile(OUT_FILE, header + body, 'utf8');

  console.log(`showcase-data.js written — ${profiles.length} profile(s)`);
  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (!profiles.length) {
    console.log('  (no audio files found in /profiles — the section will show its empty state)');
  }
}

await build();
