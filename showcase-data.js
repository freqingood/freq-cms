/* ─────────────────────────────────────────────────────────────
   THE FREQ — SHOWCASE CONFIG

   This is the file to edit when you want to change what the
   showcase section shows. Nothing else needs touching.

   Loaded by a plain <script> tag before showcase.js, so it works
   when you open index.html straight off your disk as well as on
   thefreq.in. No server, no build step, no fetch.

   ── FIELDS ──────────────────────────────────────────────────
   id           unique slug. Seeds the generated cover art and the
                waveform, so changing it changes the artwork.
   title        headline on the card. Required.
   inspiration  the artist whose sonics the mix is after. When it
                matches the title, the card quietly drops the
                redundant "After ..." line.
   mood         one-word chip on the card. Also drives the filter
                buttons once there are more than twelve profiles.
   duration     display only; the real duration replaces it as soon
                as the audio file loads.
   mixNote      one line on what was done. Omit for no note.
   audio        path relative to the site root. Keep it relative
                (no leading slash) so local preview works too.
   artwork      optional cover image. Omit for the generated one.
   accent       hex / rgb / hsl / oklch. Card glow, chip, waveform.
   order        position on the ring, ascending.

   ── RUNNING ORDER ───────────────────────────────────────────
   Deliberate, not alphabetical. Profiles sharing a mixing engineer
   or a mood sit as far apart as a nine-card ring allows, which is
   four positions:

     ABBA / Daft Punk .......... engineer .... 4 apart
     The Beatles / Pink Floyd .. engineer .... 4 apart
     Linkin Park / Nirvana ..... engineer .... 4 apart
     ABBA / Michael Jackson .... both Pop .... 4 apart

   Adding a tenth profile changes that arithmetic, so re-check the
   spacing if you do.
   ───────────────────────────────────────────────────────────── */

window.FREQ_SHOWCASE_PROFILES = [
  {
    id: 'abba',
    title: 'ABBA',
    inspiration: 'ABBA',
    mood: 'Pop',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/ABBA.mp3',
    accent: '#fbbf24',
    order: 1
  },
  {
    id: 'the-beatles',
    title: 'The Beatles',
    inspiration: 'The Beatles',
    mood: 'Rock',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/The Beatles.mp3',
    accent: '#5ec8d4',
    order: 2
  },
  {
    id: 'linkin-park',
    title: 'Linkin Park',
    inspiration: 'Linkin Park',
    mood: 'Nu Metal',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Linkin Park.mp3',
    accent: '#ff7a45',
    order: 3
  },
  {
    id: 'radiohead',
    title: 'Radiohead',
    inspiration: 'Radiohead',
    mood: 'Alt Rock',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Radiohead.mp3',
    accent: '#f472b6',
    order: 4
  },
  {
    id: 'daft-punk',
    title: 'Daft Punk',
    inspiration: 'Daft Punk',
    mood: 'Electronic',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Daft Punk.mp3',
    accent: '#7dd3fc',
    order: 5
  },
  {
    id: 'michael-jackson',
    title: 'Michael Jackson',
    inspiration: 'Michael Jackson',
    mood: 'Pop',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Michael Jackson.mp3',
    accent: '#F50CA0',
    order: 6
  },
  {
    id: 'pink-floyd',
    title: 'Pink Floyd',
    inspiration: 'Pink Floyd',
    mood: 'Prog Rock',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Pink Floyd.mp3',
    accent: '#c084fc',
    order: 7
  },
  {
    id: 'nirvana',
    title: 'Nirvana',
    inspiration: 'Nirvana',
    mood: 'Grunge',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Nirvana.mp3',
    accent: '#F5E663',
    order: 8
  },
  {
    id: 'red-hot-chili-peppers',
    title: 'Red Hot Chili Peppers',
    inspiration: 'Red Hot Chili Peppers',
    mood: 'Funk Rock',
    duration: '0:30',
    mixNote: '',
    audio: 'profiles/Red Hot Chilli Peppers.mp3',
    accent: '#5eead4',
    order: 9
  }
];
