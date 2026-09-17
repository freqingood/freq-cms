/* FREQ for Labels — shared behaviour for the product detail pages.
   Reveals + the static fingerprint / depth-stage drawings. No GSAP needed here. */
(function () {
    document.documentElement.classList.remove('no-js');
    document.body && document.body.classList.remove('no-js');

    /* ambient light: spot follows the pointer */
    var aura = document.querySelector('.aura');
    if (aura && window.matchMedia('(pointer: fine)').matches) {
        var px = 0, py = 0, raf = 0;
        window.addEventListener('pointermove', function (e) {
            px = e.clientX; py = e.clientY;
            if (!raf) raf = requestAnimationFrame(function () { raf = 0; aura.style.setProperty('--mx', px + 'px'); aura.style.setProperty('--my', py + 'px'); document.body.classList.add('has-pointer'); });
        }, { passive: true });
    }

    /* reveals */
    var els = [].slice.call(document.querySelectorAll('[data-rv]'));
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var d = +e.target.getAttribute('data-rv') || 0;
                setTimeout(function () { e.target.classList.add('is-in'); }, d);
                io.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -12% 0px' });
        els.forEach(function (el) { io.observe(el); });
    } else {
        els.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* fingerprint geometry — same maths as v2.html */
    var N = 96, R = 7;
    var DIMS_A = [.62, .48, .74, .70, .44, .58, .52, .80];
    var DIMS_B = [.52, .58, .92, .66, .28, .56, .60, .74];
    function anchors(vals, u) {
        var K = vals.length, p = u * K, k = Math.floor(p), f = p - k, ff = (1 - Math.cos(f * Math.PI)) / 2;
        return vals[k % K] * (1 - ff) + vals[(k + 1) % K] * ff;
    }
    function printPts(vals, scale, k) {
        var pts = [];
        for (var i = 0; i <= N; i++) {
            var u = (i % N) / N, a = u * Math.PI * 2 - Math.PI / 2;
            var base = 12 + 32 * anchors(vals, u);
            var drift = k == null ? 0 : Math.sin(u * Math.PI * 2 * 3 + k * 1.7) * .7 * (k / (R - 1)) + Math.sin(u * Math.PI * 2 * 7 - k) * .25;
            var r = base * scale + drift;
            pts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        return pts;
    }
    function toD(pts) {
        var s = '';
        for (var i = 0; i < pts.length; i++) s += (i ? 'L' : 'M') + pts[i][0].toFixed(2) + ' ' + pts[i][1].toFixed(2);
        return s;
    }
    function print(svg, opts) {
        opts = opts || {};
        var html = '';
        if (opts.grid) {
            html += '<g fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".18"><circle r="16"/><circle r="30"/><circle r="44"/><line x1="0" y1="-46" x2="0" y2="46"/><line x1="-46" y1="0" x2="46" y2="0"/><line x1="-32.5" y1="-32.5" x2="32.5" y2="32.5"/><line x1="32.5" y1="-32.5" x2="-32.5" y2="32.5"/></g>';
        }
        for (var k = 0; k < R; k++) {
            var f = .3 + .7 * k / (R - 1);
            html += '<path class="ring" d="' + toD(printPts(DIMS_A, f, k)) + '" fill="' + (k === R - 1 ? 'rgba(0,206,209,.05)' : k === 3 ? 'rgba(0,206,209,.045)' : k === 0 ? 'rgba(255,255,255,.05)' : 'none') + '" stroke="#ffffff" stroke-width="' + (k === R - 1 ? .6 : .32) + '" opacity="' + (.28 + .72 * k / (R - 1)).toFixed(2) + '" pathLength="1" style="animation-delay:' + (k * 90) + 'ms"/>';
        }
        if (opts.mix) html += '<path class="mix" d="' + toD(printPts(DIMS_B, 1)) + '" fill="none" stroke="#F50CA0" stroke-width=".5" stroke-dasharray=".012 .009" pathLength="1"/>';
        if (opts.labels) {
            html += '<g fill="rgba(255,255,255,.3)" font-family="Space Mono, monospace" font-size="2.9" letter-spacing=".32" style="text-transform:uppercase">'
                + '<text x="0" y="-51" text-anchor="middle">TONAL</text><text x="37" y="-36">DYNAMICS</text><text x="52" y="1">LOW-END</text><text x="37" y="38">VOCAL</text>'
                + '<text x="0" y="53" text-anchor="middle">STEREO</text><text x="-37" y="38" text-anchor="end">TRANSIENTS</text><text x="-52" y="1" text-anchor="end">LOUDNESS</text><text x="-37" y="-36" text-anchor="end">DEPTH</text></g>';
        }
        svg.setAttribute('viewBox', '-60 -60 120 120');
        svg.innerHTML = html;
    }
    [].forEach.call(document.querySelectorAll('svg[data-print]'), function (svg) {
        var v = svg.getAttribute('data-print') || '';
        print(svg, { grid: v.indexOf('grid') > -1, labels: v.indexOf('labels') > -1, mix: v.indexOf('mix') > -1 });
    });

    /* depth stage: stems settle from a flat wall into depth when scrolled into view */
    [].forEach.call(document.querySelectorAll('svg.stage-svg'), function (svg) {
        var stems = [].slice.call(svg.querySelectorAll('.stem'));
        function place(t) {
            stems.forEach(function (g, i) {
                var f = g.getAttribute('data-flat').split(','), d = g.getAttribute('data-deep').split(',');
                var tt = Math.min(1, Math.max(0, t * 1.4 - i * .06)); tt = tt * tt * (3 - 2 * tt);
                var x = +f[0] + (+d[0] - +f[0]) * tt, y = +f[1] + (+d[1] - +f[1]) * tt;
                g.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')');
            });
        }
        place(0);
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) { place(1); return; }
        var io2 = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            io2.disconnect();
            var t0 = null;
            function frame(ts) {
                if (t0 === null) t0 = ts;
                var t = Math.min(1, (ts - t0) / 1800);
                place(t);
                if (t < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }, { threshold: .4 });
        io2.observe(svg);
    });
})();
