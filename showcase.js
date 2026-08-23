/* ─────────────────────────────────────────────────────────────
   THE FREQ — SHOWCASE SECTION

   Renders the #fg-gal artist showcase. Loaded with `defer`, so it
   runs once the section markup exists.

   Content is NOT stored here. It is resolved at runtime, first
   source that returns anything wins:

     1. window.FREQ_SHOWCASE_PROFILES   inline override, for tests
     2. window.FREQ_SHOWCASE_API        remote endpoint, optional
     3. showcase.json                   built from /profiles by
                                        tools/build-showcase.mjs

   To move to a CMS later, set window.FREQ_SHOWCASE_API before this
   file loads. Nothing in here changes.

   The ring is virtualized: at most MAX_SLOTS cards exist in the DOM
   no matter how many profiles there are, so 9 profiles and 400
   profiles cost the same. See slotItem() for how recycling works.
   ───────────────────────────────────────────────────────────── */

(function () {
  var GALLERY_URL = 'https://app.thefreq.in/mixes';
  var DEFAULT_ACCENT = '#F50CA0';
  var MANIFEST_URL = 'showcase.json';
  var MAX_SLOTS = 9;          // cards alive in the DOM at once
  var STRIP_LIMIT = 12;       // show the per-name picker at or below this
  var JUMP_THRESHOLD = 3;     // spin this far, otherwise snap instantly

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function safeUrl(u) {
    if (!u || typeof u !== 'string') return '';
    try {
      var p = new URL(u, location.href);
      if (p.protocol === 'http:' || p.protocol === 'https:') return p.href;
    } catch (e) {}
    return '';
  }
  function mod(n, m) { return ((n % m) + m) % m; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function normalize(a) { return ((((a + 180) % 360) + 360) % 360) - 180; }
  function hash(str) {
    var h = 0, i;
    for (i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function hashSeed(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    var a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generatePeaks(id, kind, count) {
    count = count || 96;
    var rand = mulberry32(hashSeed(id + ':' + kind));
    var peaks = new Array(count);
    var envPhase = rand() * Math.PI * 2;
    var envSpeed = 1.4 + rand() * 1.2;
    var i, p, envelope, body;
    for (i = 0; i < count; i++) {
      p = i / (count - 1);
      envelope = 0.55 + 0.45 * Math.pow(Math.sin(envPhase + p * Math.PI * envSpeed), 2);
      body = 0.55 + 0.35 * rand();
      peaks[i] = Math.min(1, body * (0.85 + 0.25 * envelope));
    }
    var fade = Math.max(2, Math.floor(count * 0.04));
    for (i = 0; i < fade; i++) {
      var g = i / fade;
      peaks[i] *= g;
      peaks[count - 1 - i] *= g;
    }
    return peaks;
  }
  function coverHtml(accent, seed) {
    var angle = (hash(seed) % 360) + 'deg';
    return '<div class="fg-cover-gen" style="background:radial-gradient(120% 90% at 20% 15%,' +
      esc(accent) + ' 0%,transparent 55%),radial-gradient(90% 80% at 85% 80%,#3a2048 0%,transparent 60%),linear-gradient(' +
      angle + ',#1a1624,#0d0c12)"><i></i></div>';
  }
  function fmt(t) {
    if (!isFinite(t)) return '0:00';
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }
  function safeAccent(c) {
    if (!c || typeof c !== 'string') return DEFAULT_ACCENT;
    var s = c.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return s;
    if (/^oklch\([^)]+\)$/i.test(s)) return s;
    if (/^rgba?\([^)]+\)$/i.test(s)) return s;
    if (/^hsla?\([^)]+\)$/i.test(s)) return s;
    return DEFAULT_ACCENT;
  }

  /* ── DATA ADAPTER ──────────────────────────────────────── */

  function toProfile(d, i) {
    if (!d || !d.title) return null;
    return {
      id: String(d.id || ('profile-' + i)),
      title: String(d.title),
      inspiration: d.inspiration ? String(d.inspiration) : '',
      mood: d.mood ? String(d.mood) : '',
      duration: d.duration ? String(d.duration) : '',
      mixNote: d.mixNote ? String(d.mixNote) : '',
      audioUrl: safeUrl(d.audio || d.audioUrl),
      artwork: safeUrl(d.artwork),
      accent: safeAccent(d.accent),
      peaks: d.peaks,
      order: d.order == null ? i : Number(d.order)
    };
  }

  function shape(raw) {
    var arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.profiles) ? raw.profiles : null);
    if (!arr) return [];
    var rows = arr.map(toProfile).filter(Boolean);
    rows.sort(function (a, b) { return a.order - b.order; });
    return rows;
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error(url + ' -> ' + res.status);
      return res.json();
    });
  }

  function loadProfiles() {
    var inline = shape(window.FREQ_SHOWCASE_PROFILES);
    if (inline.length) return Promise.resolve(inline);

    var sources = [];
    if (window.FREQ_SHOWCASE_API) sources.push(String(window.FREQ_SHOWCASE_API));
    sources.push(MANIFEST_URL);

    return sources.reduce(function (chain, url) {
      return chain.then(function (rows) {
        if (rows && rows.length) return rows;
        return fetchJson(url).then(shape).catch(function () { return []; });
      });
    }, Promise.resolve([]));
  }

  /* ── STATE ─────────────────────────────────────────────── */

  var root = document.getElementById('fg-gal');
  var body = document.getElementById('fgBody');
  var glow = document.getElementById('fgGlow');
  if (!root || !body) return;

  var all = [];               // every profile loaded
  var view = [];              // after mood filter + search
  var moodFilter = '';        // '' means all
  var query = '';

  var index = 0;              // free-running position into `view`
  var rot = 0;
  var slots = 0;
  var step = 60;
  var dims = { w: 168, h: 215, r: 230 };
  var inView = false;
  var dragging = false;
  var pendingDrag = false;
  var moved = false;
  var dragStartX = 0, dragStartY = 0, dragStartRot = 0;
  var wheelLock = 0;
  var animId = 0;
  var vel = 0;
  var scene, ring, discs = [];
  var rendered = [];          // item index currently painted into each slot
  var player = null;

  /* ── RING GEOMETRY + VIRTUALIZATION ────────────────────── */

  function computeDims() {
    step = 360 / Math.max(slots, 1);
    var vw = window.innerWidth;
    var w = clamp(vw * 0.38, 132, 176);
    var h = Math.round(w * 1.28);
    var half = Math.min(step / 2, 89);
    var rad = (w * 0.62) / Math.tan(half * Math.PI / 180);
    dims = { w: w, h: h, r: clamp(rad, 190, 380) };
  }

  /* Which item does slot `s` currently show?

     Slot s is physically fixed on the ring, so it can only ever hold
     items whose position ≡ s (mod slots). Of that set we show the one
     nearest the current front position:

         item = s + slots * round((front - s) / slots)

     One rounding, computed from one continuous value. That matters:
     deriving the front and the offset from two separate Math.round
     calls disagrees at half-step rotations and swaps cards in full
     view. With this form the value only changes when (front - s)
     crosses slots/2 — exactly the back of the ring, where the card is
     hidden. That is the recycling trick, and it is why the DOM never
     grows past MAX_SLOTS however many profiles exist. */
  function slotItem(s) {
    if (!view.length) return 0;
    return mod(slotPosition(s), view.length);
  }

  /* Absolute (unwrapped) position the slot represents. */
  function slotPosition(s) {
    var front = -rot / step;
    return s + slots * Math.round((front - s) / slots);
  }

  function stopAnim() {
    if (animId) cancelAnimationFrame(animId);
    animId = 0;
  }

  function applyRot() {
    if (!ring) return;
    ring.style.transform = 'rotateY(' + rot + 'deg)';
    var i, rel, abs, scale, blur, bright, el, card;
    for (i = 0; i < discs.length; i++) {
      el = discs[i];
      syncSlot(i);
      rel = normalize(rot + i * step);
      abs = Math.min(Math.abs(rel), 90);
      scale = 1 - (abs / 90) * 0.38;
      blur = (abs / 90) * 5;
      bright = 1 - (abs / 90) * 0.5;
      el.style.opacity = String(clamp(1 - Math.abs(rel) / 110, 0, 1));
      el.style.zIndex = String(Math.round(20 - Math.abs(rel) / 20));
      el.style.pointerEvents = Math.abs(rel) < 55 ? 'auto' : 'none';
      card = el.querySelector('.fg-card');
      if (card) {
        card.style.transform = 'scale(' + scale.toFixed(4) + ')';
        card.style.filter = 'blur(' + blur.toFixed(2) + 'px) brightness(' + bright.toFixed(2) + ')';
      }
    }
  }

  function springTo(targetRot, then) {
    stopAnim();
    vel = 0;
    var last = performance.now();
    var stiffness = 120, damping = 22, mass = 0.9;
    function frame(now) {
      var dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      var a = (-stiffness * (rot - targetRot) - damping * vel) / mass;
      vel += a * dt;
      rot += vel * dt;
      applyRot();
      if (Math.abs(vel) < 0.12 && Math.abs(rot - targetRot) < 0.12) {
        rot = targetRot;
        applyRot();
        animId = 0;
        if (then) then();
        return;
      }
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);
  }

  function setIndex(next, fromDrag) {
    if (!view.length) return;
    if (!fromDrag) springTo(-next * step);
    if (next === index) return;
    index = next;
    updateFocus();
  }

  /* Snap without spinning. Used for filter changes and long jumps,
     where spinning through 30 cards would just be slow. */
  function jumpTo(next) {
    stopAnim();
    index = next;
    rot = -index * step;
    applyRot();
    updateFocus();
  }

  function focused() {
    return view.length ? view[mod(index, view.length)] : null;
  }

  function goToItem(target) {
    var n = view.length;
    if (!n) return;
    var cur = mod(index, n);
    var diff = target - cur;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    if (Math.abs(diff) > JUMP_THRESHOLD) jumpTo(index + diff);
    else setIndex(index + diff);
  }

  /* ── CARDS ─────────────────────────────────────────────── */

  /* When a profile is named after its reference artist, the title and
     the inspiration are the same string. Printing "ABBA / After ABBA"
     reads as a bug, so the subtitle falls back to a neutral label and
     the player drops its "Inspired by" line entirely. */
  function selfTitled(mix) {
    return !!mix.inspiration &&
      mix.title.trim().toLowerCase() === mix.inspiration.trim().toLowerCase();
  }

  function afterLine(mix) {
    if (selfTitled(mix)) return 'Sonic profile';
    return mix.inspiration ? 'After ' + mix.inspiration : 'Original';
  }

  function cardHtml(mix) {
    var bars = generatePeaks(mix.id, 'card', 28);
    var after = afterLine(mix);
    return '<button type="button" class="fg-card" style="--fg-accent:' + esc(mix.accent) + '" aria-label="' + esc(mix.title) + ', ' + esc(after) + '">' +
      '<div class="fg-card-inner">' +
        '<div class="fg-cover">' +
          (mix.artwork ? '<img src="' + esc(mix.artwork) + '" alt="" draggable="false">' : coverHtml(mix.accent, mix.id)) +
          '<div class="fg-cover-fade"></div>' +
          (mix.mood ? '<span class="fg-chip">' + esc(mix.mood) + '</span>' : '') +
        '</div>' +
        '<div class="fg-meta">' +
          '<div><div class="fg-title">' + esc(mix.title) + '</div><div class="fg-artist">' + esc(after) + '</div></div>' +
          '<div class="fg-bars" aria-hidden="true">' + bars.map(function (b) {
            return '<span style="height:' + Math.max(12, b * 100) + '%"></span>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>' +
    '</button>';
  }

  function syncSlot(s, force) {
    var item = slotItem(s);
    if (!force && rendered[s] === item) return;
    rendered[s] = item;
    var mix = view[item];
    if (!mix) return;
    discs[s].innerHTML = cardHtml(mix);
    discs[s].querySelector('.fg-card').addEventListener('click', function () {
      if (moved) return;
      setIndex(slotPosition(s));
    });
  }

  function buildSlots() {
    slots = Math.min(view.length, MAX_SLOTS);
    ring.innerHTML = '';
    discs = [];
    rendered = [];
    for (var i = 0; i < slots; i++) {
      var disc = document.createElement('div');
      disc.className = 'fg-disc';
      ring.appendChild(disc);
      discs.push(disc);
    }
    layoutScene();
    for (var j = 0; j < slots; j++) syncSlot(j, true);
  }

  function layoutScene() {
    if (!scene || !ring || !slots) return;
    computeDims();
    scene.style.height = (dims.h + 56) + 'px';
    ring.style.width = dims.w + 'px';
    ring.style.height = dims.h + 'px';
    ring.style.marginLeft = (-dims.w / 2) + 'px';
    ring.style.marginTop = (-dims.h / 2) + 'px';
    discs.forEach(function (el, i) {
      el.style.width = dims.w + 'px';
      el.style.height = dims.h + 'px';
      el.style.marginLeft = (-dims.w / 2) + 'px';
      el.style.marginTop = (-dims.h / 2) + 'px';
      el.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + dims.r + 'px)';
    });
    rot = -index * step;
    applyRot();
  }

  /* ── PLAYER ────────────────────────────────────────────── */

  var playSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var pauseSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var stopSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>';

  function destroyPlayer() {
    if (!player) return;
    if (player.audio) {
      player.audio.pause();
      player.audio.src = '';
    }
    if (player.raf) cancelAnimationFrame(player.raf);
    if (player.onResize) window.removeEventListener('resize', player.onResize);
    player = null;
  }
  function roundedBar(ctx, x, y, w, h, r) {
    var radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();
  }
  function drawWave(canvas, data, progress, accent) {
    if (!canvas || !data || !data.length) return;
    var parent = canvas.parentElement;
    var width = (parent && parent.clientWidth) || 400;
    var height = 64;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.floor(height * dpr);
    canvas.style.height = height + 'px';
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    var centerY = height / 2;
    var gap = 2;
    var barWidth = Math.max(1.5, width / data.length - gap);
    var maxAmp = centerY - 4;
    var playheadX = progress * width;
    var i, x, amp, played, radius;
    for (i = 0; i < data.length; i++) {
      x = i * (width / data.length);
      amp = Math.max(1.5, data[i] * maxAmp);
      played = x <= playheadX;
      radius = Math.min(barWidth / 2, amp);
      if (played) {
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.shadowBlur = 0;
      }
      roundedBar(ctx, x, centerY - amp, barWidth, amp * 2, radius);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.fillRect(playheadX - 1, 0, 2, height);
    ctx.shadowBlur = 0;
  }

  function mountPlayer(mix) {
    destroyPlayer();
    var wrap = document.getElementById('fgPlayer');
    if (!wrap || !mix) return;
    wrap.style.setProperty('--fg-accent', mix.accent);
    var art = mix.artwork
      ? '<img src="' + esc(mix.artwork) + '" alt="" draggable="false">'
      : coverHtml(mix.accent, mix.id);
    var hasAudio = !!mix.audioUrl;
    var insp = mix.inspiration || '—';
    wrap.innerHTML =
      '<div class="fg-art">' + art +
        '<div class="fg-face-shade"></div>' +
        '<div class="fg-face-copy"><span>Inspiration</span><p>' + esc(insp) + '</p></div>' +
      '</div>' +
      '<div class="fg-info">' +
        '<div class="fg-info-top">' +
          (mix.mood ? '<span class="fg-genre">' + esc(mix.mood) + '</span>' : '') +
          (mix.duration ? '<span class="fg-eng">' + esc(mix.duration) + '</span>' : '') +
        '</div>' +
        '<h3 class="fg-song">' + esc(mix.title) + '</h3>' +
        (selfTitled(mix) ? '' : '<p class="fg-insp">Inspired by <em>' + esc(insp) + '</em></p>') +
        '<div class="fg-wave" id="fgWave" role="slider" aria-label="Seek">' +
          '<canvas id="fgWaveA"></canvas>' +
        '</div>' +
        '<div class="fg-transport">' +
          '<button type="button" class="fg-play" id="fgPlay" aria-label="Play"' + (hasAudio ? '' : ' disabled') + '>' + playSvg + '</button>' +
          '<button type="button" class="fg-play fg-stop" id="fgStop" aria-label="Stop"' + (hasAudio ? '' : ' disabled') + '>' + stopSvg + '</button>' +
          '<div class="fg-time"><em id="fgCur">0:00</em> / <span id="fgDur">' + esc(mix.duration || '0:00') + '</span></div>' +
          '<div class="fg-vol"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>' +
            '<input type="range" min="0" max="100" value="100" step="5" id="fgVol" aria-label="Volume">' +
          '</div>' +
        '</div>' +
        (mix.mixNote ? '<p class="fg-note"><b>What we did</b>' + esc(mix.mixNote) + '</p>' : '') +
        (hasAudio ? '' : '<p class="fg-note"><b>Audio</b>This track has not been uploaded yet.</p>') +
      '</div>';

    var audio = hasAudio ? new Audio(mix.audioUrl) : null;
    if (audio) audio.preload = 'metadata';
    player = { audio: audio, playing: false, volume: 1, time: 0, duration: 0, raf: 0 };

    var peaks = (mix.peaks && (mix.peaks.main || mix.peaks.after)) || generatePeaks(mix.id, 'wave');
    var canvas = document.getElementById('fgWaveA');

    function progress() { return player.duration > 0 ? player.time / player.duration : 0; }
    function paint() { drawWave(canvas, peaks, progress(), mix.accent); }
    paint();

    function setTimeLabel() {
      var cur = document.getElementById('fgCur');
      if (cur) cur.textContent = fmt(player.time);
    }
    function tick() {
      if (!audio) return;
      player.time = audio.currentTime || 0;
      setTimeLabel();
      paint();
      player.raf = requestAnimationFrame(tick);
    }
    function pause() {
      if (audio) audio.pause();
      player.playing = false;
      if (player.raf) cancelAnimationFrame(player.raf);
      player.raf = 0;
      var btn = document.getElementById('fgPlay');
      if (btn) { btn.innerHTML = playSvg; btn.setAttribute('aria-label', 'Play'); }
    }
    function stop() {
      pause();
      if (audio) { try { audio.currentTime = 0; } catch (e) {} }
      player.time = 0;
      setTimeLabel();
      paint();
    }
    function play() {
      if (!audio) return;
      audio.volume = player.volume;
      audio.play().catch(function () {});
      player.playing = true;
      var btn = document.getElementById('fgPlay');
      if (btn) { btn.innerHTML = pauseSvg; btn.setAttribute('aria-label', 'Pause'); }
      if (!player.raf) player.raf = requestAnimationFrame(tick);
    }

    if (audio) {
      audio.addEventListener('loadedmetadata', function () {
        if (isFinite(audio.duration) && audio.duration > 0) {
          player.duration = audio.duration;
          var durEl = document.getElementById('fgDur');
          if (durEl) durEl.textContent = fmt(audio.duration);
          paint();
        }
      });
      audio.addEventListener('ended', function () { stop(); });
    }

    document.getElementById('fgPlay').addEventListener('click', function () {
      if (player.playing) pause(); else play();
    });
    document.getElementById('fgStop').addEventListener('click', stop);

    var vol = document.getElementById('fgVol');
    if (vol) vol.addEventListener('input', function (e) {
      var v = Number(e.target.value) / 100;
      player.volume = v;
      if (audio) audio.volume = v;
    });

    var wave = document.getElementById('fgWave');
    function seekAt(clientX) {
      if (!audio || !player.duration) return;
      var rect = wave.getBoundingClientRect();
      var ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      var t = ratio * player.duration;
      try { audio.currentTime = t; } catch (e) {}
      player.time = t;
      setTimeLabel();
      paint();
    }
    wave.addEventListener('pointerdown', function (e) {
      wave.setPointerCapture(e.pointerId);
      seekAt(e.clientX);
    });
    wave.addEventListener('pointermove', function (e) {
      if (e.buttons !== 1) return;
      seekAt(e.clientX);
    });

    player.pause = pause;
    player.stop = stop;
    player.togglePlay = function () { if (player.playing) pause(); else play(); };
    player.onResize = paint;
    window.addEventListener('resize', paint, { passive: true });
  }

  /* ── FILTERS ───────────────────────────────────────────── */

  function moods() {
    var seen = {}, out = [];
    all.forEach(function (m) {
      if (m.mood && !seen[m.mood]) { seen[m.mood] = 1; out.push(m.mood); }
    });
    return out.sort(function (a, b) { return a.localeCompare(b, 'en'); });
  }

  function matches(m) {
    if (moodFilter && m.mood !== moodFilter) return false;
    if (!query) return true;
    var q = query.toLowerCase();
    return (m.title + ' ' + m.inspiration + ' ' + m.mood).toLowerCase().indexOf(q) !== -1;
  }

  function applyFilters() {
    view = all.filter(matches);
    index = 0;
    rot = 0;

    var stage = document.getElementById('fgStage');
    var empty = document.getElementById('fgEmpty');
    var count = document.getElementById('fgCount');
    var wrap = document.getElementById('fgPlayer');

    if (count) {
      count.textContent = view.length === all.length
        ? all.length + (all.length === 1 ? ' profile' : ' profiles')
        : view.length + ' of ' + all.length;
    }
    if (empty) empty.hidden = view.length > 0;
    if (stage) stage.hidden = view.length === 0;

    if (!view.length) {
      destroyPlayer();
      if (wrap) { wrap.innerHTML = ''; wrap.hidden = true; }
      renderStrip();
      return;
    }
    if (wrap) wrap.hidden = false;

    buildSlots();
    renderStrip();
    updateFocus();
  }

  function renderStrip() {
    var strip = document.getElementById('fgStrip');
    if (!strip) return;
    strip.innerHTML = '';
    // Per-name picking only stays usable while the list is short.
    if (!view.length || view.length > STRIP_LIMIT) { strip.hidden = true; return; }
    strip.hidden = false;
    view.forEach(function (mix, i) {
      var pick = document.createElement('button');
      pick.type = 'button';
      pick.textContent = mix.title;
      pick.setAttribute('aria-label', 'Show ' + mix.title);
      pick.addEventListener('click', function () { goToItem(i); });
      strip.appendChild(pick);
    });
  }

  function renderFilters() {
    var bar = document.getElementById('fgFilters');
    if (!bar) return;
    var list = moods();
    // A single mood and a short list is not worth a filter row.
    if (list.length < 2 && all.length <= STRIP_LIMIT) { bar.hidden = true; return; }
    bar.hidden = false;

    var chips = document.getElementById('fgMoods');
    chips.innerHTML = '';
    if (list.length > 1) {
      [''].concat(list).forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = m || 'All';
        b.className = m === moodFilter ? 'is-on' : '';
        b.addEventListener('click', function () {
          moodFilter = m;
          Array.prototype.forEach.call(chips.children, function (c) {
            c.className = c.textContent === (moodFilter || 'All') ? 'is-on' : '';
          });
          applyFilters();
        });
        chips.appendChild(b);
      });
    }

    var search = document.getElementById('fgSearch');
    if (search) search.hidden = all.length <= STRIP_LIMIT;
  }

  /* ── FOCUS ─────────────────────────────────────────────── */

  function updateFocus() {
    var mix = focused();
    if (!mix) return;
    glow.style.background = 'radial-gradient(ellipse, ' + mix.accent + '44, transparent 65%)';
    var active = mod(index, view.length);
    discs.forEach(function (el, i) {
      var card = el.querySelector('.fg-card');
      if (card) card.classList.toggle('is-on', rendered[i] === active);
    });
    var strip = document.getElementById('fgStrip');
    if (strip && !strip.hidden) {
      strip.style.setProperty('--fg-strip-accent', mix.accent);
      Array.prototype.forEach.call(strip.children, function (btn, i) {
        btn.classList.toggle('is-on', i === active);
      });
    }
    mountPlayer(mix);
  }

  /* ── SHELL ─────────────────────────────────────────────── */

  function renderShell() {
    body.className = '';
    body.innerHTML =
      '<div class="fg-filters" id="fgFilters" hidden>' +
        '<div class="fg-moods" id="fgMoods" role="group" aria-label="Filter by mood"></div>' +
        '<input type="search" class="fg-search" id="fgSearch" placeholder="Search title or inspiration" aria-label="Search profiles">' +
        '<span class="fg-count" id="fgCount" aria-live="polite"></span>' +
      '</div>' +
      '<p class="fg-empty" id="fgEmpty" hidden>Nothing matches that. <button type="button" id="fgReset">Clear filters</button></p>' +
      '<div id="fgStage">' +
        '<div class="fg-stage-wrap">' +
          '<button type="button" class="fg-navbtn" id="fgPrev" aria-label="Previous profile">&#8249;</button>' +
          '<div class="fg-scene" id="fgScene"></div>' +
          '<button type="button" class="fg-navbtn" id="fgNext" aria-label="Next profile">&#8250;</button>' +
        '</div>' +
        '<p class="fg-hint"><span>Drag sideways</span><b>/</b><span>&#8592; &#8594;</span><b>/</b><span>Tap a card</span></p>' +
        '<div class="fg-strip" id="fgStrip" role="group" aria-label="Jump to a profile"></div>' +
      '</div>' +
      '<div class="fg-player" id="fgPlayer"></div>';

    scene = document.getElementById('fgScene');
    ring = document.createElement('div');
    ring.className = 'fg-ring';
    ring.id = 'fgRing';
    scene.appendChild(ring);

    document.getElementById('fgPrev').addEventListener('click', function () { setIndex(index - 1); });
    document.getElementById('fgNext').addEventListener('click', function () { setIndex(index + 1); });
    document.getElementById('fgReset').addEventListener('click', function () {
      moodFilter = '';
      query = '';
      var s = document.getElementById('fgSearch');
      if (s) s.value = '';
      renderFilters();
      applyFilters();
    });

    var searchEl = document.getElementById('fgSearch');
    var debounce = 0;
    searchEl.addEventListener('input', function (e) {
      clearTimeout(debounce);
      var v = e.target.value;
      debounce = setTimeout(function () { query = v.trim(); applyFilters(); }, 140);
    });

    scene.addEventListener('pointerdown', function (e) {
      pendingDrag = true;
      dragging = false;
      moved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartRot = rot;
    });
    scene.addEventListener('pointermove', function (e) {
      if (!pendingDrag && !dragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (!dragging) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) >= Math.abs(dx)) { pendingDrag = false; return; }
        dragging = true;
        pendingDrag = false;
        stopAnim();
        scene.classList.add('is-drag');
        if (scene.setPointerCapture) scene.setPointerCapture(e.pointerId);
      }
      if (Math.abs(dx) > 4) moved = true;
      rot = dragStartRot + dx * (step / 120);
      applyRot();
    });
    function endDrag() {
      pendingDrag = false;
      if (!dragging) return;
      dragging = false;
      scene.classList.remove('is-drag');
      var nearest = Math.round(-rot / step);
      springTo(-nearest * step);
      if (nearest !== index) setIndex(nearest, true);
    }
    scene.addEventListener('pointerup', endDrag);
    scene.addEventListener('pointercancel', endDrag);
    scene.addEventListener('wheel', function (e) {
      var absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
      if (absX <= absY) return;
      e.preventDefault();
      var now = Date.now();
      if (absX < 4 || now - wheelLock < 110) return;
      wheelLock = now;
      setIndex(index + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    renderFilters();
    applyFilters();
    if (typeof window.bindHover === 'function') window.bindHover();
  }

  /* ── BOOT ──────────────────────────────────────────────── */

  window.addEventListener('resize', function () { if (view.length) layoutScene(); }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (!inView) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (document.activeElement !== root) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(index + 1); }
    else if (e.code === 'Space') {
      e.preventDefault();
      if (player && player.togglePlay) player.togglePlay();
    }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (!inView && player && player.pause) player.pause();
    }, { threshold: 0.2 }).observe(root);
  } else {
    inView = true;
  }

  loadProfiles().then(function (rows) {
    all = rows;
    if (!all.length) {
      body.className = 'fg-load';
      body.textContent = 'No profiles published yet.';
      return;
    }
    renderShell();
  }).catch(function () {
    body.className = 'fg-load';
    body.textContent = 'Showcase unavailable right now.';
  });

  /* Escape hatch for anything else on the page. */
  window.FreqShowcase = {
    reload: function () {
      return loadProfiles().then(function (rows) {
        all = rows;
        renderFilters();
        applyFilters();
        return rows.length;
      });
    },
    galleryUrl: GALLERY_URL
  };
})();
