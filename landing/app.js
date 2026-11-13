/* ReferenceKeys landing. Vanilla JS, no build step (GitHub Pages). */
(() => {
  const REPO = 'https://github.com/carloszaragoza/ReferenceKeys';
  const DOWNLOAD = REPO + '/releases/latest/download/ReferenceKeys.zip';
  const D = window.RK_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------- i18n: system language picks the default, the toggle overrides it ---------- */
  const T = window.RK_LOCALES; // UI strings live in locales/*.js
  const sys = (navigator.languages || [navigator.language || 'en']).some(l => /^es\b/i.test(l)) ? 'es' : 'en';
  let lang = store.get('rk-lang') || sys;
  const t = k => T[lang][k] ?? T.en[k] ?? k;
  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $('#langLabel').textContent = lang === 'es' ? 'EN' : 'ES';
    $('#lang').setAttribute('aria-label', t('lang'));
    document.title = 'ReferenceKeys';
    renderSet(currentSet, false);
    syncPlayLabels();
    setStep(step); drawLive(); hud();
  }
  $('#lang').addEventListener('click', () => { lang = lang === 'es' ? 'en' : 'es'; store.set('rk-lang', lang); applyLang(); });

  $$('.js-download').forEach(a => { a.href = DOWNLOAD; });
  $$('.js-repo').forEach(a => { a.href = REPO; });

  /* ---------- shared audio engine: one <audio>, many controls ---------- */
  const audio = $('#player');
  /* Each track is fetched once into a Blob URL: always seekable, so A/B switches keep their position on any host. */
  const blobs = {};
  function fetchTrack(n, onProgress) {
    if (blobs[n]) return blobs[n];
    return (blobs[n] = (async () => {
      const r = await fetch(`assets/audio/${n}.mp3`);
      const len = +r.headers.get('content-length') || 0, rd = onProgress && len && r.body && r.body.getReader();
      if (!rd) { const b = await r.blob(); onProgress && onProgress(1); return URL.createObjectURL(b); }
      const parts = []; let got = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProgress(got / len); }
      onProgress(1); return URL.createObjectURL(new Blob(parts, { type: 'audio/mpeg' }));
    })());
  }
  let current = null; // name of the track loaded in <audio>
  let owner = null; // 'hero' | 'ab' | take element
  async function load(name, at = 0, who, autoplay = true) {
    if (autoplay) ensureGraph();
    if (owner !== who && !audio.paused) audio.pause();
    owner = who;
    const go = () => { try { audio.currentTime = at; } catch {} if (autoplay) audio.play().catch(() => {}); tick(); };
    if (current === name && audio.readyState >= 1) { go(); return; }
    const url = await fetchTrack(name);
    if (owner !== who) return;
    current = name; audio.src = url;
    audio.addEventListener('loadedmetadata', go, { once: true }); audio.load();
  }
  function toggle(name, who) {
    ensureGraph();
    if (owner === who && !audio.paused) { audio.pause(); return; }
    if (owner === who && audio.paused && current === name) { audio.play().catch(() => {}); return; }
    load(name, 0, who);
  }
  const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  function setIcon(btn, playing) {
    const i = btn.querySelector('.icon'); i.classList.toggle('i-play', !playing); i.classList.toggle('i-pause', playing);
    const txt = btn.querySelector('.btn__txt');
    if (txt) txt.textContent = playing ? t('pause') : t('cta.play'); // visible label, no aria-label override
    else if (btn.classList.contains('hear')) btn.setAttribute('aria-pressed', String(playing));
    else btn.setAttribute('aria-label', playing ? t('pause') : t('play'));
  }
  function syncPlayLabels() {
    const p = !audio.paused;
    setIcon($('#heroPlay'), p && owner === 'hero');
    $$('.hear').forEach(b => setIcon(b, p && owner === b));
    setIcon($('#abPlay'), p && owner === 'ab');
    $$('.take').forEach(el => { const on = p && owner === el; setIcon($('.take__play', el), on); el.classList.toggle('is-playing', on); });
  }
  ['play', 'pause', 'ended'].forEach(e => audio.addEventListener(e, syncPlayLabels));

  /* rAF loop only while playing: drives playheads and waveform progress */
  let raf = 0;
  function tick() {
    const p = audio.duration ? audio.currentTime / audio.duration : 0;
    if (owner === 'hero') { $('#scopeHead').style.transform = `scaleX(${p})`; if (!audio.paused) measure('german-v2'); hud(); }
    listenKeys();
    if (owner === 'ab') { drawWave($('#abWave'), abName, p); $('#abTime').textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`; if (!audio.paused) measure(); drawLive(); }
    if (owner instanceof Element) { const c = $('canvas', owner); if (c) drawWave(c, owner.dataset.src, p); }
    if (!audio.paused || pianoBusy()) raf = requestAnimationFrame(tick); // let the keys settle after a pause
  }
  audio.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
  audio.addEventListener('pause', () => { cancelAnimationFrame(raf); tick(); });

  /* ---------- canvas helpers ---------- */
  function fit(c) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return [x, w, h];
  }
  const rgb = hex => { const m = hex.replace('#', ''); const n = parseInt(m.length === 3 ? m.replace(/./g, '$&$&') : m, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  /* hero spectrogram from real STFT data (German Concert V2 render) */
  const specBytes = Uint8Array.from(atob(D.spec.data), ch => ch.charCodeAt(0));
  function drawSpec(canvas, crop = 1) {
    const [x, w, h] = fit(canvas);
    const bg = rgb(css('--panel')), ink = rgb(css('--faint')), ac = rgb(css('--accent'));
    const W = Math.floor(D.spec.w * crop), H = D.spec.h;
    const img = x.createImageData(W, H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const v = specBytes[r * D.spec.w + c] / 255, o = (r * W + c) * 4;
      const a = Math.pow(v, 1.6), hot = Math.max(0, (v - .62) / .38);
      for (let k = 0; k < 3; k++) img.data[o + k] = bg[k] + (ink[k] - bg[k]) * a * (1 - hot) + (ac[k] - bg[k]) * hot;
      img.data[o + 3] = 255;
    }
    const off = document.createElement('canvas'); off.width = W; off.height = H; off.getContext('2d').putImageData(img, 0, 0);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.clearRect(0, 0, w, h); x.drawImage(off, 0, 0, w, h);
  }

  /* waveform from real peaks of the published mp3 */
  function drawWave(c, name, p = 0) {
    const peaks = D.wave[name]; if (!peaks) return;
    const [x, w, h] = fit(c); x.clearRect(0, 0, w, h);
    const n = peaks.length, bw = w / n, ac = css('--accent'), mu = css('--faint');
    for (let i = 0; i < n; i++) {
      const v = Math.max(.04, peaks[i]) * h * .92, X = i * bw;
      x.fillStyle = i / n < p ? ac : mu; x.globalAlpha = i / n < p ? 1 : .55;
      x.fillRect(X + bw * .18, (h - v) / 2, Math.max(1, bw * .64), v);
    }
    x.globalAlpha = 1;
  }
  function seekOn(c, nameOf, who) {
    c.addEventListener('click', e => {
      const name = typeof nameOf === 'function' ? nameOf() : nameOf;
      const r = c.getBoundingClientRect(), p = (e.clientX - r.left) / r.width;
      const go = () => { audio.currentTime = p * audio.duration; tick(); };
      if (owner === who && current === name && audio.duration) { go(); if (audio.paused) audio.play().catch(() => {}); }
      else load(name, 0, who).then(() => { if (audio.readyState >= 1) setTimeout(go, 30); else audio.addEventListener('loadedmetadata', () => setTimeout(go, 30), { once: true }); });
    });
  }

  /* ---------- hero ---------- */
  $('#heroPlay').addEventListener('click', () => toggle('german-v2', 'hero'));

  /* ---------- gate: one choice, sound or silence; preloads the demo meanwhile ---------- */
  const gate = $('#gate'), root = document.documentElement;
  if (root.classList.contains('gated')) {
    fetchTrack('german-v2', f => { const pc = Math.round(f * 100) + '%'; $('#gateBar').style.setProperty('--p', pc); $('#gatePct').textContent = pc; });
    const enter = sound => {
      try { sessionStorage.setItem('rk-gate', '1'); } catch {}
      gate.classList.add('is-out'); root.classList.remove('gated');
      setTimeout(() => { gate.hidden = true; }, reduce ? 0 : 900);
      if (sound) load('german-v2', 0, 'hero'); else $('#heroPlay').focus({ preventScroll: true });
    };
    $('#gateSound').addEventListener('click', () => enter(true));
    $('#gateQuiet').addEventListener('click', () => enter(false));
    gate.addEventListener('keydown', e => {
      if (e.key === 'Escape') enter(false);
      if (e.key === 'Tab') { const a = $('#gateSound'), b = $('#gateQuiet'); if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } }
    });
    setTimeout(() => $('#gateSound').focus({ preventScroll: true }), 50);
  } else gate.hidden = true;

  /* ---------- live keys: each of the 88 keys listens to its own fundamental ----------
     A key counts as sounding when its note is a local peak in the spectrum and rises above its own
     running level. piano3d.js reads window.RK.act to press keys, lift hammers and light strings. */
  const KEY_F = Array.from({ length: 88 }, (_, k) => 27.5 * Math.pow(2, k / 12));
  const act = new Float32Array(88), avgDb = new Float32Array(88).fill(-110), lvl = new Float32Array(88);
  window.RK = { act };
  function listenKeys() {
    if (audio.paused || !analyser) { for (let k = 0; k < 88; k++) act[k] *= .86; return; }
    analyser.getFloatFrequencyData(fbuf);
    const hz = actx.sampleRate / analyser.fftSize;
    for (let k = 0; k < 88; k++) {
      const f = KEY_F[k], lo = Math.max(1, Math.floor(f * .985 / hz)), hi = Math.max(lo, Math.ceil(f * 1.015 / hz));
      let m = -160; for (let j = lo; j <= hi; j++) m = Math.max(m, fbuf[j]); lvl[k] = m;
    }
    for (let k = 0; k < 88; k++) {
      const m = lvl[k], peak = m >= (lvl[k - 1] ?? -160) - .5 && m >= (lvl[k + 1] ?? -160) - .5;
      avgDb[k] = avgDb[k] * .97 + m * .03;
      const hit = peak ? Math.max(0, Math.min(1, (m - Math.max(avgDb[k], -88) - 2) / 12)) : 0;
      act[k] = Math.max(hit, act[k] * .86);
    }
  }
  const pianoBusy = () => act.some(v => v > .01);
  function hud() {
    const a = acc['german-v2'], rd = $('#scopeRead');
    if (a && a.n > 20) rd.innerHTML = `<strong>${gap(levels(a), D.sets.german.ref.bands).toFixed(1)} dB</strong> ${t('scope.live')}`;
    else rd.textContent = t('scope.idle');
  }

  /* ---------- story: hear V1 and V2 ---------- */
  function hearing() { return owner instanceof Element && owner.classList.contains('hear'); }
  $$('.hear').forEach(b => b.addEventListener('click', () => toggle(b.dataset.src, b)));

  /* ---------- A/B console: switching keeps the playback position ---------- */
  let abName = 'german-v2';
  $('#abPlay').addEventListener('click', () => toggle(abName, 'ab'));
  $$('.seg__btn').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.v === abName) return;
    const at = owner === 'ab' ? audio.currentTime : 0, playing = owner === 'ab' && !audio.paused;
    abName = b.dataset.v;
    $$('.seg__btn').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (owner === 'ab') load(abName, at, 'ab', playing); else drawWave($('#abWave'), abName, 0);
  }));
  seekOn($('#abWave'), () => abName, 'ab');
  if ('IntersectionObserver' in window) { const w = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { fetchTrack('german-v1'); fetchTrack('german-v2'); w.disconnect(); } }, { rootMargin: '400px' }); w.observe($('#ab')); }

  /* takes */
  $$('.take').forEach(el => {
    $('.take__play', el).addEventListener('click', () => toggle(el.dataset.src, el));
    seekOn($('canvas', el), el.dataset.src, el);
  });

  /* ---------- compare chart ---------- */
  const NAMES = { german: 'Roland German Concert', royal: 'Nord Royal Grand 3D', cfx: 'Yamaha CFX' };
  const LABELS = ['32', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
  const VB = { w: 760, h: 360, l: 44, r: 12, t: 14, b: 34 }, Y0 = 0, Y1 = -70;
  const xs = i => VB.l + i * (VB.w - VB.l - VB.r) / 9;
  const ys = v => VB.t + (Y0 - Math.max(Y1, Math.min(Y0, v))) / (Y0 - Y1) * (VB.h - VB.t - VB.b);
  function path(arr) {
    const p = arr.map((v, i) => [xs(i), ys(v)]);
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  const svg = $('#chart'), NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; };
  const g = el('g', { class: 'grid' }), ax = el('g', { class: 'axis' });
  for (let v = 0; v >= -70; v -= 10) { el('line', { x1: VB.l, x2: VB.w - VB.r, y1: ys(v), y2: ys(v) }, g); el('text', { x: VB.l - 10, y: ys(v) + 4, 'text-anchor': 'end' }, ax).textContent = v; }
  LABELS.forEach((l, i) => { el('text', { x: xs(i), y: VB.h - 10, 'text-anchor': 'middle' }, ax).textContent = l; });
  const gapP = el('path', { class: 'gap' }), before = el('path', { class: 'ln ln--before' }), ref = el('path', { class: 'ln ln--ref' }), after = el('path', { class: 'ln ln--after' });
  const dots = el('g', {});
  let currentSet = 'german';
  function band(a, b) { // area between calibrated and reference lines
    const top = path(a), bottom = path([...b].reverse().map(v => v));
    const pb = [...b].map((v, i) => [xs(i), ys(v)]).reverse();
    return top + ' L' + pb.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';
  }
  function renderSet(k, animate = true) {
    currentSet = k; const s = D.sets[k];
    ref.setAttribute('d', path(s.ref.bands)); before.setAttribute('d', path(s.before.bands)); after.setAttribute('d', path(s.after.bands));
    gapP.setAttribute('d', band(s.after.bands, s.ref.bands));
    dots.innerHTML = ''; s.after.bands.forEach((v, i) => el('circle', { class: 'dot', cx: xs(i), cy: ys(v), r: 3.2 }, dots));
    $('#refName').textContent = NAMES[k];
    const m = [
      ['m.tilt', 'tilt', v => `${v.toFixed(1)} dB/oct`],
      ['m.centroid', 'centroid', v => `${v} Hz`],
      ['m.width', 'width', v => v.toFixed(2)]
    ];
    $('#metrics').innerHTML = m.map(([lab, key, f]) => `<div class="metric"><dt>${t(lab)}</dt><dd><span class="v-after">${f(s.after[key])}</span><span class="v-before">${f(s.before[key])}</span><span class="v-ref">${t('m.ref')} ${f(s.ref[key])}</span></dd></div>`).join('');
    $('#setNote').textContent = t('note.' + k);
    if (animate && !reduce) { after.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' }); }
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => {
    $$('.tab').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    renderSet(b.dataset.set);
  }));
  $('.tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const tabs = $$('.tab'), i = tabs.findIndex(x => x.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
  });


  /* ---------- live analyzer: Web Audio octave bands, averaged per version, drawn over the reference ---------- */
  let actx = null, analyser = null, fbuf = null, bandBins = null, totBins = null;
  const acc = {}; // track name -> { sum: band power sums, tot: total power sum, n: frames }
  function ensureGraph() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const node = actx.createMediaElementSource(audio);
      analyser = actx.createAnalyser(); analyser.fftSize = 8192; analyser.smoothingTimeConstant = 0;
      node.connect(analyser); analyser.connect(actx.destination);
      fbuf = new Float32Array(analyser.frequencyBinCount);
      const hz = actx.sampleRate / analyser.fftSize;
      bandBins = D.bands.map(c => [Math.max(1, Math.ceil(c / Math.SQRT2 / hz)), Math.floor(c * Math.SQRT2 / hz)]);
      totBins = [Math.ceil(30 / hz), Math.floor(16000 / hz)];
    } catch { actx = null; }
  }
  function measure(name = abName) {
    if (!analyser) return;
    analyser.getFloatFrequencyData(fbuf);
    const pw = i => Math.pow(10, fbuf[i] / 10);
    let tot = 0; for (let i = totBins[0]; i <= totBins[1]; i++) tot += pw(i);
    if (!(tot > 1e-9)) return; // skip silence
    const a = acc[name] || (acc[name] = { sum: new Float64Array(10), tot: 0, n: 0 });
    bandBins.forEach(([lo, hi], b) => { let s2 = 0; for (let i = lo; i <= hi; i++) s2 += pw(i); a.sum[b] += s2; });
    a.tot += tot; a.n++;
  }
  const levels = a => Array.from(a.sum, v => 10 * Math.log10(v / a.tot + 1e-12));
  const gap = (lv, ref) => { let s2 = 0; for (let i = 1; i <= 8; i++) s2 += Math.abs(lv[i] - ref[i]); return s2 / 8; };
  function drawLive() {
    const c = $('#liveCanvas'); if (!c) return;
    const [x, w, h] = fit(c), padL = 34, padB = 22, ref = D.sets.german.ref.bands;
    const X = i => padL + i * (w - padL - 8) / 9, Y = v => 6 + (-Math.max(-70, Math.min(0, v))) / 70 * (h - padB - 6);
    x.clearRect(0, 0, w, h);
    x.strokeStyle = css('--line'); x.lineWidth = 1; x.fillStyle = css('--faint'); x.font = `10px ${css('--mono')}`;
    for (let v = 0; v >= -70; v -= 14) { x.beginPath(); x.moveTo(padL, Y(v)); x.lineTo(w - 8, Y(v)); x.stroke(); x.textAlign = 'right'; x.fillText(v, padL - 6, Y(v) + 3); }
    x.textAlign = 'center'; LABELS.forEach((l, i) => x.fillText(l, X(i), h - 6));
    const line = (arr, col, width, dash) => { x.setLineDash(dash || []); x.strokeStyle = col; x.lineWidth = width; x.beginPath(); x.moveTo(X(0), Y(arr[0])); for (let i = 1; i < arr.length; i++) { const mx = (X(i - 1) + X(i)) / 2; x.bezierCurveTo(mx, Y(arr[i - 1]), mx, Y(arr[i]), X(i), Y(arr[i])); } x.stroke(); x.setLineDash([]); };
    line(ref, css('--ink'), 2);
    const other = abName === 'german-v2' ? 'german-v1' : 'german-v2';
    if (acc[other] && acc[other].n > 20) line(levels(acc[other]), css('--faint'), 1.6, [4, 5]);
    const cur = acc[abName], sc = $('#liveScore');
    if (cur && cur.n > 20) {
      const lv = levels(cur); line(lv, css('--accent'), 3);
      x.fillStyle = css('--accent'); lv.forEach((v, i) => { x.beginPath(); x.arc(X(i), Y(v), 3, 0, 7); x.fill(); });
      const parts = [`<strong>${gap(lv, ref).toFixed(1)} dB</strong> ${t('live.gap')} (${abName === 'german-v2' ? 'V2' : 'V1'})`];
      if (acc[other] && acc[other].n > 20) parts.push(`${abName === 'german-v2' ? 'V1' : 'V2'}: ${gap(levels(acc[other]), ref).toFixed(1)} dB`);
      sc.innerHTML = parts.join('&nbsp;&nbsp;&nbsp;');
    } else sc.textContent = t('live.idle');
  }

  /* ---------- story: the German Concert case, steps drive a sticky visual ---------- */
  const sv = $('#storyChart');
  const sg = el('g', {}, sv);
  for (let v = 0; v >= -70; v -= 10) el('line', { x1: VB.l, x2: VB.w - VB.r, y1: ys(v), y2: ys(v), stroke: 'var(--line)' }, sg);
  const sax = el('g', {}, sv);
  LABELS.forEach((l, i) => { el('text', { x: xs(i), y: VB.h - 10, 'text-anchor': 'middle', fill: 'var(--faint)', 'font-size': 11, 'font-family': 'Geist Mono, monospace' }, sax).textContent = l; });
  const G = D.sets.german;
  el('path', { class: 'ln', d: path(G.ref.bands), stroke: 'var(--ink)', 'stroke-width': 2.2 }, sv);
  const sBefore = el('path', { class: 'ln', d: path(G.before.bands), stroke: 'var(--faint)', 'stroke-width': 2, 'stroke-dasharray': '4 5' }, sv);
  const sAfter = el('path', { class: 'ln', d: path(G.after.bands), stroke: 'var(--accent)', 'stroke-width': 3 }, sv);
  const STEPS = {
    1: { before: 1, after: 0, read: () => `${t('sr.center')} <b>${G.before.centroid} Hz</b>&nbsp;&nbsp;${t('sr.roland')} ${G.ref.centroid} Hz` },
    2: { before: .35, after: 1, read: () => `${t('sr.center')} <b>${G.after.centroid} Hz</b>&nbsp;&nbsp;${t('sr.roland')} ${G.ref.centroid} Hz` },
    3: { before: 0, after: 1, read: () => `${t('sr.width')} <b>${G.after.width}</b>&nbsp;&nbsp;${t('sr.roland')} ${G.ref.width}&nbsp;&nbsp;·&nbsp;&nbsp;${t('sr.center')} <b>${G.after.centroid} Hz</b>` }
  };
  let step = 1;
  function setStep(n) {
    step = n; const st = STEPS[n];
    sBefore.style.opacity = st.before; sAfter.style.opacity = st.after;
    $('#storyRead').innerHTML = st.read();
    $$('.step').forEach(s2 => s2.classList.toggle('is-active', +s2.dataset.step === n));
  }
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
    $$('.step').forEach(s2 => so.observe(s2));
  }

  /* ---------- MX88 velocity curve (measured) ---------- */
  function drawVel() {
    const c = $('#velChart'), [x, w, h] = fit(c), m = D.mx88, pad = 28;
    x.clearRect(0, 0, w, h);
    const X = v => pad + v * (w - pad * 2), Y = v => h - pad - v * (h - pad * 2);
    x.strokeStyle = css('--line'); x.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(X(i / 4), Y(0)); x.lineTo(X(i / 4), Y(1)); x.stroke(); x.beginPath(); x.moveTo(X(0), Y(i / 4)); x.lineTo(X(1), Y(i / 4)); x.stroke(); }
    x.setLineDash([4, 5]); x.strokeStyle = css('--faint'); x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(1), Y(1)); x.stroke(); x.setLineDash([]);
    x.strokeStyle = css('--accent'); x.lineWidth = 3; x.beginPath(); x.moveTo(X(0), Y(0)); x.quadraticCurveTo(X(m.vcx), Y(m.vcy), X(1), Y(1)); x.stroke();
    const out = v => { // y on quadratic Bezier for a given x
      let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const tt = (lo + hi) / 2, bx = 2 * (1 - tt) * tt * m.vcx + tt * tt; bx < v ? lo = tt : hi = tt; }
      const tt = (lo + hi) / 2; return 2 * (1 - tt) * tt * m.vcy + tt * tt;
    };
    x.font = `11px ${css('--mono')}`; x.textAlign = 'center';
    [['pp', m.pp], ['p', m.p], ['mf', m.mf], ['f', m.f]].forEach(([l, v]) => {
      const vx = v / 127, vy = out(vx);
      x.fillStyle = css('--ink'); x.beginPath(); x.arc(X(vx), Y(vy), 4, 0, 7); x.fill();
      x.fillStyle = css('--muted'); x.fillText(`${l} ${v}`, X(vx), Y(vy) - 12);
    });
    x.fillStyle = css('--faint'); x.textAlign = 'left'; x.fillText('MX88 Wide', X(0), Y(1) + 4);
  }

  /* ---------- reveal on scroll (IntersectionObserver, no scroll listeners) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((n, i) => { n.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(n); });
  } else $$('.reveal').forEach(n => n.classList.add('is-in'));

  /* ---------- copy path ---------- */
  $('#copyPath').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText($('#pathBlock').textContent.split('\n')[0].trim()); e.target.textContent = t('copied'); setTimeout(() => { e.target.textContent = t('copy'); }, 1600); } catch {}
  });

  /* ---------- paint everything; repaint on resize and theme change ---------- */
  function paint() {
    drawSpec($('#miniSpec'), .45); hud();
    drawWave($('#abWave'), abName, owner === 'ab' && audio.duration ? audio.currentTime / audio.duration : 0);
    $$('.take').forEach(t2 => drawWave($('canvas', t2), t2.dataset.src, 0));
    drawVel(); drawLive(); setStep(step);
  }
  applyLang();
  const ro = new ResizeObserver(() => paint()); ro.observe(document.body);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  document.fonts && document.fonts.ready.then(paint);
})();
