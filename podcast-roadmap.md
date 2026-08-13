# FREQ Podcast — Solidified Roadmap
Built from a full scan of `freq-cms/blogs/` (109 files) and `freq-cms/topics/` (15 cluster pages), verified against `llms.txt`. Not reconstructed from memory.

## Corpus audit summary

- **108 numbered articles** (FREQ-001 through FREQ-108, no gaps in the ID sequence) + 1 onboarding page (`get-started`, excluded from podcast planning — not a blog article).
- **15 topic clusters**, verified by breadcrumb on every article page:

| Cluster | Count |
|---|---|
| Mixing Technique | 27 |
| Perception & Psychoacoustics | 16 |
| Business & Client Workflow | 8 |
| Translation & Playback | 6 |
| Hierarchy | 6 |
| Pre-Mix Prep & Tracking | 6 |
| Mindset & Practice | 5 |
| Recording & Tracking | 5 |
| Translation (Upstream) | 5 |
| Vocal Production | 4 |
| Sound Design & Synthesis | 4 |
| Identity, Modulation & Space | 4 |
| Performance Capture | 4 |
| Fusion, Independence & Density | 4 |
| Time, Register & Silence | 3 |

- **2 uncategorized articles** with no cluster breadcrumb: `when-did-clipping-become-a-problem` (FREQ-108) and `get-started`. The clipping article is a legitimate, fully-formed piece (referenced against AES sources) — it's just missing a topic-page assignment on the live site. Flagging for Kushal to fix in the CMS; it's used in Episode 35 below regardless since it's real content.
- **Zero invented slugs.** Every source article referenced in the original 40-episode draft exists in the corpus with the exact title I used.
- **6 articles were missing from the original draft** — not because they're weak, they just hadn't been placed. Folded into existing episodes rather than creating new ones (per the "don't force an episode per article" rule):
  - `bass-disappear-quietly` → Episode 2
  - `frequency-charts-misleading` → Episode 5
  - `missing-fundamental` → Episode 22
  - `mixes-feel-faster` → Episode 6
  - `snare-punch-through` → Episode 6
  - `why-do-multiple-mics-sometimes-sound-hollow` → Episode 16
- Result: **all 108 articles are now accounted for** across 40 episodes, either as a primary source or a linked/related article.

## Unified CTA standard (replaces draft Sections 19 & 20)

One CTA governs both the blogs and the podcast — no separate podcast-specific CTA exists.

**Standard close, first-person Kushal voice, no free-trial or pricing language:**

> **Two Ways I Can Help**
> Everything in this episode is how I actually think about mixing, not theory borrowed from somewhere else.
> If you'd rather hand your song to someone who'll treat it like their own, book a session with me on SoundBetter: https://www.soundbetter.com/profiles/69654-kushal-jaju
> If you'd rather learn the process and stay hands-on, try FREQ yourself: https://app.thefreq.in/login

For podcast pages specifically, this sits after the transcript, same position as the blog CTA. Positioning stays exactly as the standing project settings specify: FREQ is a cloud mixing/mastering platform, not an education company; the podcast demonstrates the thinking, FREQ is where it's applied. Publishing ownership (audio production, uploading to the site, CMS work) sits with Kushal/FREQ — my output is the script, transcript, and page copy, not the publish action itself.

---

## The 40-episode architecture

Progression: **Perception → Composition → Arrangement → Production → Mixing → Translation → Professional Practice**

Legend: **DD** = Deep Dive · **CE** = Connected Episode · **LE** = Listening Experiment

### Arc 1 — How Hearing Works (Episodes 1–6)

**1. Your Ears Are Not a Measurement System** — DD · ~25 min
Sources: `how-to-listen-as-a-mixing-engineer`, `just-noticeable-difference`, `why-0-5-db-matters`
Establishes the series premise: mixing is controlling perception, not just manipulating signal.

**2. Why Loudness Changes What You Hear** — CE · ~30 min
Sources: `equal-loudness-contours`, `why-does-loudness-change-what-we-notice`, `mix-at-80db-spl`, `why-does-a-mix-change-with-listening-level`, **`bass-disappear-quietly`**
The same mix reads differently at different levels — and why bass specifically vanishes at low volume.

**3. When the Ear Stops Hearing What You Put There** — DD · ~25 min
Sources: `auditory-fatigue`, `daily-hearing-training`, `good-mixing-habits`, `headphone-ear-care`

**4. How Your Brain Turns Noise Into Instruments** — DD · ~30 min
Sources: `auditory-scene-analysis`, `itd-ild`, `haas-effect`

**5. Why Sounds Mask Each Other** — DD · ~30 min
Sources: `critical-bands`, `frequency-masking`, `upward-spread-of-masking`, **`frequency-charts-misleading`**
Closes with why frequency charts are a poor mixing guide — perception, not a chart, decides what masks what.

**6. The Masking That Happens Before and After the Note** — LE · ~20 min
Sources: `temporal-masking`, `transients-matter`, `attack-and-release`, **`mixes-feel-faster`**, **`snare-punch-through`**
Listening experiment on transient preservation; snare punch and perceived tempo as worked examples.

### Arc 2 — How the Ear Organises Music (Episodes 7–14)

**7. Why Some Sounds Feel Dense** — DD · ~30 min
Sources: `track-density`, `why-does-arrangement-density-sometimes-sound-smaller`, `why-does-loudness-change-what-we-notice` (link back to Ep. 2)

**8. One Sound or Several?** — CE · ~30 min
Sources: `when-should-instruments-fuse-or-stay-independent`, `why-does-doubling-make-an-orchestra-bigger`, `why-does-unison-sometimes-become-one-bigger-sound`, `why-does-voice-leading-change-perceived-separation`

**9. The Harmonic Relationships Your Mix Is Already Using** — DD · ~30 min
Sources: `why-does-voice-leading-change-perceived-separation`, `why-does-unison-sometimes-become-one-bigger-sound`, `when-should-instruments-fuse-or-stay-independent` (deepens Ep. 8, not a repeat — harmonic framing specifically)

**10. Fix the Arrangement Before You Reach for EQ** — DD · ~30 min
Sources: `how-does-register-solve-arrangement-problems-before-eq`, `why-does-arrangement-density-sometimes-sound-smaller`, `why-does-an-instrument-need-more-than-volume-to-cut-through`

**11. Why Everything Cannot Be the Lead** — CE · ~30 min
Sources: `why-cant-every-instrument-be-the-lead`, `how-does-arrangement-make-one-part-feel-more-important`, `how-does-vocal-depth-change-hierarchy`

**12. What Happens When Everything Changes at Once?** — DD · ~30 min
Sources: `how-does-an-arrangement-prioritize-when-several-parts-are-changing-at-once`, `how-does-listener-processing-load-change-an-arrangement`, `why-does-contrast-make-an-arrangement-easier-to-hear`

**13. Time Can Separate What Frequency Cannot** — LE · ~20 min
Sources: `why-do-staggered-entrances-make-an-arrangement-clearer`, `how-does-silence-make-an-arrangement-bigger`, `how-does-micro-timing-change-the-feel-of-a-performance`

**14. Why Repetition Makes Complex Music Easier to Hear** — DD · ~25 min
Sources: `how-does-repetition-give-the-listener-a-stable-reference`, `why-does-contrast-make-an-arrangement-easier-to-hear` (link back), `why-does-arrangement-density-sometimes-sound-smaller` (link back)

### Arc 3 — How We Create Musical Objects (Episodes 15–20)

**15. What Actually Makes an Instrument Sound Like Itself?** — CE · ~35 min
Sources: `how-does-articulation-change-an-instruments-identity`, `what-does-vibrato-add-to-an-instruments-identity`, `how-does-vocal-register-change-vocal-identity`, `what-does-lfo-modulation-add-to-sound-identity`

**16. The Sound You Capture Is the Sound You Have** — CE · ~30 min
Sources: `how-does-mic-placement-change-what-we-hear`, `what-does-the-proximity-effect-really-change`, `how-do-room-reflections-change-perceived-depth`, `why-some-recording-problems-cannot-be-mixed-away`, **`why-do-multiple-mics-sometimes-sound-hollow`**

**17. Capture the Performance Instead of Repairing It** — DD · ~30 min
Sources: `why-capture-dynamics-instead-of-fixing-them-later`, `how-should-you-capture-vibrato-and-articulation`, `is-comping-really-an-arrangement-decision`, `why-one-live-instrument-can-change-everything-in-a-mix`

**18. Why One Real Instrument Can Change the Whole Record** — CE · ~25 min
Sources: `why-one-live-instrument-can-change-everything-in-a-mix` (link back), `layering-live-and-programmed-instruments`, `midi-to-tone-before-mixing`

**19. Why Vocal Doubles Don't Just Make Vocals Louder** — DD · ~25 min
Sources: `how-do-vocal-doubles-change-what-we-hear`, `how-does-vocal-depth-change-hierarchy` (link back), `why-ride-a-vocal-before-compressing-it`

**20. Designing a Sound Before You Process It** — CE · ~30 min
Sources: `why-does-oscillator-choice-matter-before-processing`, `how-does-a-filter-envelope-shape-sound-identity`, `what-does-lfo-modulation-add-to-sound-identity` (link back), `why-does-unison-sometimes-become-one-bigger-sound` (link back)

### Arc 4 — How Mixing Controls Perception (Episodes 21–32)

**21. Why Your Mix Sounds Muddy** — DD · ~30 min
Sources: `mix-sounds-muddy`, `why-250hz-matters`, `upward-spread-of-masking` (link back)

**22. Why Kick and Bass Fight** — LE · ~25 min
Sources: `kick-bass-fight`, `kick-bass-separation`, `distort-kick-bass-differently`, **`missing-fundamental`**
The missing-fundamental phenomenon explains why filtering sub content doesn't necessarily remove perceived bass pitch — directly relevant to how much low end kick and bass actually need.

**23. Mixing Is Traffic Control** — DD · ~30 min
Sources: `what-is-traffic-control-in-mixing`, `why-does-an-instrument-need-more-than-volume-to-cut-through` (link back), `why-does-arrangement-density-sometimes-sound-smaller` (link back)

**24. Compression Changes What the Listener Notices** — DD · ~35 min
Sources: `attack-and-release` (link back), `compression-changes-clarity`, `why-ride-a-vocal-before-compressing-it` (link back), `1176-into-la2a`

**25. Saturation Starts With the Source** — DD · ~25 min
Sources: `emphasis-de-emphasis-eq`, `smoothing-the-source-before-parallel-nonlinear-processing`, `distort-kick-bass-differently` (link back)

**26. Why the Pultec Mud Dip Can Work** — LE · ~20 min
Sources: `pultec-mud-dip`, `why-250hz-matters` (link back), `why-0-5-db-matters` (link back)

**27. Depth Is Not Volume** — DD · ~30 min
Sources: `depth-vs-volume`, `stereo-width-vs-depth`, `how-do-room-reflections-change-perceived-depth` (link back), `how-does-spatial-position-give-an-instrument-its-identity`

**28. Width Can Become Depth — and Width Can Disappear** — LE · ~25 min
Sources: `haas-effect` (link back), `itd-ild` (link back), `what-happens-to-stereo-width-in-mono`, `wideners-sound-hollow`

**29. Why Your Mix Sounds Flat** — DD · ~30 min
Sources: `mix-sounds-flat`, `stereo-width-vs-depth` (link back), `how-does-vocal-depth-change-hierarchy` (link back), `what-is-traffic-control-in-mixing` (link back)

**30. Why Mixing Order Matters More Than Plugins** — DD · ~30 min
Sources: `mixing-order-matters`, `organise-tracks-before-mixing`, `pitch-timing-edits-before-mixing`, `prepare-multitrack-files`

**31. How to Know What Actually Needs Fixing** — CE · ~25 min
Sources: `why-0-5-db-matters` (link back), `compression-changes-clarity` (link back), `mix-sounds-muddy` (link back), `mix-sounds-flat` (link back)
Diagnostic episode — deliberately all backward links, no new primary source. Teaches triage using concepts already built.

**32. Reference Tracks Are Not a Cheat Code** — DD · ~30 min
Sources: `reference-tracks-work`, `why-does-a-mix-change-with-listening-level` (link back), `mix-falls-apart-low-volume`, `why-does-loudness-change-what-we-notice` (link back)

### Arc 5 — How the Mix Survives the Real World (Episodes 33–38)

**33. The Mix You Make Is Not the Mix Everyone Hears** — DD · ~30 min
Sources: `why-does-a-mix-change-with-listening-level` (link back), `how-does-a-mix-survive-different-playback-systems`, `mix-falls-apart-low-volume` (link back)

**34. The Hardest Mix Test Is Often Mono** — LE · ~20 min
Sources: `mono-compatibility`, `what-happens-to-stereo-width-in-mono` (link back), `wideners-sound-hollow` (link back)

**35. Peak Meters Don't Tell You How Loud Music Feels** — DD · ~30 min
Sources: `lufs-vs-peak-meters`, `why-does-loudness-change-what-we-notice` (link back), `when-did-clipping-become-a-problem`
Note: this last article has no cluster page on the live site — flagged above for a CMS fix.

**36. What Mastering Is Actually Checking** — DD · ~30 min
Sources: `what-is-mastering-actually-checking`, `balance-master-translation`, `mixes-translate-everywhere`

**37. From Rough Balance to Finished Master** — CE · ~40 min
Sources: `balance-master-translation` (link back), `mix-song-online-guide`, `mixing-order-matters` (link back), `mixes-translate-everywhere` (link back)
Practical synthesis episode — the full FREQ workflow applied to one mix.

**38. The Final Listening Destination Should Shape the Mix** — DD · ~25 min
Sources: `final-listening-destination-shapes-mix`, `why-alternate-mixes-matter`, `how-does-a-mix-survive-different-playback-systems` (link back)

### Arc 6 — The Engineer (Episodes 39–40)

**39. Technical Perfection Is Not the Goal** — DD · ~30 min
Sources: `feel-vs-technical-perfection`, `pre-modern-mixing-records`, `joy-of-discovery-while-mixing`

**40. The Mix Is a Conversation** — CE · ~40 min
Sources: `talking-to-a-mixing-client`, `producers-notes-for-communication`, `honouring-everyones-vision`, `requesting-revisions-without-endless-loop`, `mix-yourself-or-hire-engineer`, `mixing-project-management`, `hourly-vs-project-pricing`, `calculating-your-mixing-fee`, `should-you-work-in-teams`, `slow-days-as-training`
Closes both the Business & Client Workflow cluster (8/8 articles) and the Mindset & Practice cluster (5/5, split with Episode 39).

---

## Open items before Phase 5 sign-off

1. Confirm the `when-did-clipping-become-a-problem` cluster gap gets fixed on the live site (or leave uncategorized — doesn't block scripting).
2. Confirm episode durations are targets, not hard limits — some (Ep. 31, 40) are naturally link-heavy and may run shorter.
3. Once approved, Episode 1 or Episode 21 ("Why Your Mix Sounds Muddy," your working example) — your call on which gets scripted first.
