/* ─────────────────────────────────────────────────────────────
   THE FREQ — SHARED BEHAVIOUR

   Loaded with `defer` on every content page. Pure progressive
   enhancement: the pages read fine with this file missing, and
   every feature checks that its element exists before binding.

   Four things:
     1. mobile nav toggle
     2. header shadow once you scroll off the top
     3. reading progress bar
     4. back to top button

   Scroll work is batched into a single rAF-throttled handler, so
   this costs one listener rather than three competing ones.
   ───────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. mobile nav ──────────────────────────────────────── */

  var burger = document.querySelector('.sh-burger');
  var nav = document.querySelector('.sh-nav');

  if (burger && nav) {
    var setNav = function (open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      // stop the page scrolling behind the open panel
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });

    // any nav choice closes the panel
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        burger.focus();
      }
    });

    // returning to desktop width must not strand the panel open
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 720) setNav(false);
    }, { passive: true });
  }

  /* ── 2-4. scroll-driven bits, one handler ───────────────── */

  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.rp-bar');
  var toTop = document.querySelector('.to-top');
  var article = document.querySelector('main');

  if (header || bar || toTop) {
    var ticking = false;

    var measure = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;

      if (header) header.classList.toggle('is-stuck', y > 4);
      if (toTop) toTop.classList.toggle('is-on', y > 700);

      if (bar && article) {
        // progress through the article body, not the whole document,
        // so the bar hits 100% at the end of the reading, not the footer
        var top = article.offsetTop;
        var span = article.offsetHeight - window.innerHeight + 120;
        var pct = span > 0 ? (y - top + 120) / span : 0;
        bar.style.width = Math.max(0, Math.min(1, pct)) * 100 + '%';
      }

      ticking = false;
    };

    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(measure);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    measure();
  }

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ── wide tables get their own scroll container ─────────── */

  var tables = document.querySelectorAll('main table');
  Array.prototype.forEach.call(tables, function (t) {
    if (t.parentNode && t.parentNode.classList.contains('table-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });
})();
