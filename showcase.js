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

   LAYOUT: a single horizontally-scrolling row of self-contained
   cards. Each card has its own play/stop directly on it — there is
   no separate "now playing" panel, and no 3D ring. Native scroll +
   snap does the browsing; the prev/next buttons are a click-target
   alternative to swiping. Only one card plays at a time.
   ───────────────────────────────────────────────────────────── */

(function () {
  var GALLERY_URL = 'https://app.thefreq.in/mixes';
  var DEFAULT_ACCENT = '#F50CA0';
  var MANIFEST_URL = 'showcase.json';
  var SEARCH_LIMIT = 12;      // below this, a mood filter/search isn't worth showing

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function safeUrl(u) {
    if (!u || typeof u !== 'string') return '';
    try {
      var p = new URL(u, location.href);
      // file: is allowed so the page works when opened straight off
      // disk. Everything else stays blocked.
      if (p.protocol === 'http:' || p.protocol === 'https:' || p.protocol === 'file:') return p.href;
    } catch (e) {}
    return '';
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
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
  // Decorative only, same as everywhere else in this file: bar height is
  // a function of position, not of any real audio analysis. Position
  // also stands in for playback time, which is what lets the bars
  // double as a (fabricated but proportional) progress display.
  function generatePeaks(id, count) {
    count = count || 28;
    var rand = mulberry32(hashSeed(id));
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
  var view = [];               // after mood filter + search
  var moodFilter = '';        // '' means all
  var query = '';
  var inView = false;

  var track;                  // .fg-track element, holds one .fg-card per item
  var players = {};           // profile id -> per-card playback state
  var activeId = null;        // id of the one card currently playing

  var playSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var pauseSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var stopSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>';

  /* ── CARDS ─────────────────────────────────────────────── */

  function selfTitled(mix) {
    return !!mix.inspiration &&
      mix.title.trim().toLowerCase() === mix.inspiration.trim().toLowerCase();
  }
  function afterLine(mix) {
    if (selfTitled(mix)) return 'Sonic profile';
    return mix.inspiration ? 'After ' + mix.inspiration : 'Original';
  }

  function cardHtml(mix) {
    var after = afterLine(mix);
    var hasAudio = !!mix.audioUrl;
    var bars = generatePeaks(mix.id).map(function (b) {
      return '<span style="height:' + Math.max(12, b * 100) + '%"></span>';
    }).join('');
    return (
      '<div class="fg-card" style="--fg-accent:' + esc(mix.accent) + '" data-id="' + esc(mix.id) + '">' +
        '<div class="fg-card-inner">' +
          '<div class="fg-cover">' +
            (mix.artwork ? '<img src="' + esc(mix.artwork) + '" alt="" draggable="false">' : coverHtml(mix.accent, mix.id)) +
            '<div class="fg-cover-fade"></div>' +
            (mix.mood ? '<span class="fg-chip">' + esc(mix.mood) + '</span>' : '') +
            '<button type="button" class="fg-cardplay" data-role="play" aria-label="Play ' + esc(mix.title) + '"' + (hasAudio ? '' : ' disabled') + '>' + playSvg + '</button>' +
          '</div>' +
          '<div class="fg-meta">' +
            '<div class="fg-title">' + esc(mix.title) + '</div>' +
            '<div class="fg-artist">' + esc(after) + '</div>' +
            '<div class="fg-bars-wrap" data-role="seek" role="slider" aria-label="Seek ' + esc(mix.title) + '" tabindex="-1">' +
              '<div class="fg-bars">' + bars + '</div>' +
            '</div>' +
            '<div class="fg-cardfoot">' +
              '<span class="fg-mini-time" data-role="time">0:00 / ' + esc(mix.duration || '0:00') + '</span>' +
              '<button type="button" class="fg-mini-stop" data-role="stop" aria-label="Stop ' + esc(mix.title) + '"' + (hasAudio ? '' : ' disabled') + '>' + stopSvg + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── PER-CARD PLAYBACK ─────────────────────────────────── */

  function stateFor(mix) {
    var st = players[mix.id];
    if (!st) st = players[mix.id] = { mix: mix, audio: null, playing: false, time: 0, duration: 0, raf: 0, bars: generatePeaks(mix.id) };
    return st;
  }

  function cardEl(id) {
    return track ? track.querySelector('.fg-card[data-id="' + id.replace(/"/g, '') + '"]') : null;
  }

  function setIcon(id, playing) {
    var el = cardEl(id);
    if (!el) return;
    var btn = el.querySelector('[data-role="play"]');
    if (btn) { btn.innerHTML = playing ? pauseSvg : playSvg; btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + el.querySelector('.fg-title').textContent); }
    el.classList.toggle('is-playing', playing);
  }

  function paintBars(id) {
    var st = players[id], el = cardEl(id);
    if (!st || !el) return;
    var progress = st.duration > 0 ? st.time / st.duration : 0;
    var spans = el.querySelectorAll('.fg-bars span');
    var played = Math.round(progress * spans.length);
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.toggle('is-played', i < played);
    }
  }

  function paintTime(id) {
    var st = players[id], el = cardEl(id);
    if (!st || !el) return;
    var t = el.querySelector('[data-role="time"]');
    if (t) t.textContent = fmt(st.time) + ' / ' + (st.duration ? fmt(st.duration) : (st.mix.duration || '0:00'));
  }

  function pauseCard(id) {
    var st = players[id];
    if (!st) return;
    if (st.audio) st.audio.pause();
    st.playing = false;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    setIcon(id, false);
  }

  function stopCard(id) {
    var st = players[id];
    pauseCard(id);
    if (!st) return;
    if (st.audio) { try { st.audio.currentTime = 0; } catch (e) {} }
    st.time = 0;
    paintTime(id);
    paintBars(id);
    if (activeId === id) activeId = null;
  }

  function stopAll() {
    Object.keys(players).forEach(function (id) { if (players[id].playing) pauseCard(id); });
  }

  function tick(id) {
    var st = players[id];
    if (!st || !st.audio) return;
    st.time = st.audio.currentTime || 0;
    paintTime(id);
    paintBars(id);
    if (st.playing) st.raf = requestAnimationFrame(function () { tick(id); });
  }

  function ensureAudio(mix) {
    var st = stateFor(mix);
    if (st.audio || !mix.audioUrl) return st;
    var audio = new Audio(mix.audioUrl);
    audio.preload = 'none';
    audio.addEventListener('loadedmetadata', function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        st.duration = audio.duration;
        paintTime(mix.id);
      }
    });
    audio.addEventListener('ended', function () { stopCard(mix.id); });
    st.audio = audio;
    return st;
  }

  function playCard(mix) {
    if (!mix.audioUrl) return;
    var st = ensureAudio(mix);
    if (!st.audio) return;
    if (activeId && activeId !== mix.id) pauseCard(activeId);
    st.audio.play().catch(function () {});
    st.playing = true;
    activeId = mix.id;
    setIcon(mix.id, true);
    if (!st.raf) st.raf = requestAnimationFrame(function () { tick(mix.id); });
    if (glow) glow.style.background = 'radial-gradient(ellipse, ' + mix.accent + '44, transparent 65%)';
  }

  function toggleCard(mix) {
    var st = players[mix.id];
    if (st && st.playing) pauseCard(mix.id); else playCard(mix);
  }

  function seekCard(mix, ratio) {
    var st = ensureAudio(mix);
    if (!st.audio) return;
    var d = st.duration || (st.audio.duration && isFinite(st.audio.duration) ? st.audio.duration : 0);
    if (!d) return;
    var t = clamp(ratio, 0, 1) * d;
    try { st.audio.currentTime = t; } catch (e) {}
    st.time = t;
    paintTime(mix.id);
    paintBars(mix.id);
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

  function renderFilters() {
    var bar = document.getElementById('fgFilters');
    if (!bar) return;
    var list = moods();
    if (list.length < 2 && all.length <= SEARCH_LIMIT) { bar.hidden = true; return; }
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
    if (search) search.hidden = all.length <= SEARCH_LIMIT;
  }

  function renderTrack() {
    track.innerHTML = view.map(cardHtml).join('');
    view.forEach(function (mix) {
      var el = cardEl(mix.id);
      if (!el) return;
      el.querySelector('[data-role="play"]').addEventListener('click', function () { toggleCard(mix); });
      el.querySelector('[data-role="stop"]').addEventListener('click', function () { stopCard(mix.id); });

      var wrap = el.querySelector('[data-role="seek"]');
      function seekAt(clientX) {
        var rect = wrap.getBoundingClientRect();
        seekCard(mix, (clientX - rect.left) / rect.width);
      }
      wrap.addEventListener('pointerdown', function (e) {
        if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId);
        seekAt(e.clientX);
      });
      wrap.addEventListener('pointermove', function (e) {
        if (e.buttons !== 1) return;
        seekAt(e.clientX);
      });
    });
  }

  function applyFilters() {
    view = all.filter(matches);

    var rowWrap = document.getElementById('fgRowWrap');
    var empty = document.getElementById('fgEmpty');
    var count = document.getElementById('fgCount');

    if (count) {
      count.textContent = view.length === all.length
        ? all.length + (all.length === 1 ? ' profile' : ' profiles')
        : view.length + ' of ' + all.length;
    }
    if (empty) empty.hidden = view.length > 0;
    if (rowWrap) rowWrap.hidden = view.length === 0;

    stopAll();
    if (!view.length) { track.innerHTML = ''; return; }
    renderTrack();
  }

  /* ── SHELL ─────────────────────────────────────────────── */

  function renderShell() {
    body.className = '';
    body.innerHTML =
      '<div class="fg-filters" id="fgFilters" hidden>' +
        '<div class="fg-moods" id="fgMoods" role="group" aria-label="Filter by mood"></div>' +
        '<input type="search" class="fg-search" id="fgSearch" placeholder="Search…" aria-label="Search profiles">' +
        '<span class="fg-count" id="fgCount" aria-live="polite"></span>' +
      '</div>' +
      '<p class="fg-empty" id="fgEmpty" hidden>Nothing matches that. <button type="button" id="fgReset">Clear filter</button></p>' +
      '<div class="fg-row-wrap" id="fgRowWrap">' +
        '<button type="button" class="fg-navbtn" id="fgPrev" aria-label="Scroll left">&#8249;</button>' +
        '<div class="fg-row" id="fgRow"><div class="fg-track" id="fgTrack"></div></div>' +
        '<button type="button" class="fg-navbtn" id="fgNext" aria-label="Scroll right">&#8250;</button>' +
      '</div>';

    track = document.getElementById('fgTrack');
    var rowEl = document.getElementById('fgRow');

    function scrollBy(dir) {
      var card = track.querySelector('.fg-card');
      var step = (card ? card.getBoundingClientRect().width : 160) + 14;
      rowEl.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
    }
    document.getElementById('fgPrev').addEventListener('click', function () { scrollBy(-1); });
    document.getElementById('fgNext').addEventListener('click', function () { scrollBy(1); });

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

    renderFilters();
    applyFilters();
    if (typeof window.bindHover === 'function') window.bindHover();
  }

  /* ── BOOT ──────────────────────────────────────────────── */

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (!inView) stopAll();
    }, { threshold: 0.15 }).observe(root);
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
