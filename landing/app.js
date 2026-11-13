/* ReferenceKeys landing. Vanilla JS, no build step (GitHub Pages). */
(() => {
  const REPO = 'https://github.com/carloszaragoza/ReferenceKeys';
  const DOWNLOAD = REPO + '/archive/refs/heads/main.zip';
  const D = window.RK_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------- i18n: system language picks the default, toggle overrides ---------- */
  const T = {
    en: {
      skip: 'Skip to content', 'nav.compare': 'Compare', 'nav.listen': 'Listen', 'nav.method': 'Method', 'nav.presets': 'Presets',
      'cta.download': 'Download presets', 'cta.listen': 'Listen',
      'hero.title': 'Piano presets, calibrated against <em>the real thing.</em>',
      'hero.sub': 'Keyscape and Omnisphere patches tuned by measurement, matched band by band to recordings of real concert grands.',
      'hero.cap': 'CZ German Concert V2, rendered from my own performance. Tap to play.',
      'proof.1': 'Royal 3D vs the Nord, every octave from 32 Hz to 8 kHz', 'proof.2': 'German Concert V2 brightness center vs the Roland',
      'proof.3': 'Left and right balance after the fix', 'proof.4': 'Velocities measured on a Yamaha MX88',
      'compare.eyebrow': 'Measured, not guessed', 'compare.title': 'Watch the gap close.',
      'compare.lead': 'Each line is the tonal balance of a recording, octave by octave. The goal is the reference line.',
      'legend.before': 'First version', 'legend.after': 'Calibrated',
      'm.tilt': 'Tilt, 250 Hz to 8 kHz', 'm.centroid': 'Brightness center', 'm.width': 'Stereo width', 'm.balance': 'Left and right balance', 'm.ref': 'ref',
      'note.german': 'Both versions render the same MIDI performance, so the patch is the only difference. Reference: Roland RD-2000 V-Piano expansion demo.',
      'note.royal': 'Live takes on my MX88, compared with the Nord Grand Royal Grand 3D demo. The shipped preset is the third pass.',
      'note.cfx': 'Live takes compared with the official Yamaha CFX demo. The shipped preset adds a third pass on the highs, not yet re-measured.',
      'listen.title': 'Same performance. Two patches.',
      'listen.lead': 'One MIDI take rendered through both versions of German Concert. Switch while it plays: only the patch changes.',
      'takes.title': 'Live takes on my MX88', 'takes.lead': 'Different performances, so listen for the tone, not the notes.',
      'take.before': 'Before', 'take.after': 'Calibrated', 'take.mid': 'Second pass',
      'method.title': 'How a preset gets calibrated',
      'm1.t': 'Measure the player', 'm1.p': 'Four rounds of pp to ff on the MX88 set the velocity curve, so soft really means soft.',
      'm2.t': 'Render the same take', 'm2.p': 'MIDI goes through the Keyscape plugin offline. Every render is bit-identical, so any change you hear is the patch.',
      'm3.t': 'Compare against the reference', 'm3.p': 'Ten octave bands, tilt, stereo width and left and right balance.',
      'm4.t': 'Tune, then check again', 'm4.p': 'Nine render passes for German Concert V2. One of them caught a 7 dB lean to the left before it shipped.',
      'presets.title': "What's in the pack", g1: 'Calibrated against a reference', g2: 'Keyscape', g3: 'Omnisphere', g4: 'Velocity curves',
      'install.title': 'Installed in a minute', 's1.t': 'Download', 's1.p': 'Grab the zip from GitHub and unpack it.',
      's2.t': 'Copy', 's2.p': 'Drop each folder into your Spectrasonics user library.', 's3.t': 'Refresh', 's3.p': 'Hit Refresh Library in the plugin browser.',
      copy: 'Copy path', copied: 'Copied',
      'foot.req': 'Requires licensed copies of Spectrasonics Keyscape and/or Omnisphere. These are settings only, no samples.',
      'foot.tm': 'Not affiliated with Spectrasonics, Yamaha, Nord or Roland. Product names belong to their owners and are used only to describe the reference recordings.',
      play: 'Play', pause: 'Pause', lang: 'Cambiar a español'
    },
    es: {
      skip: 'Saltar al contenido', 'nav.compare': 'Comparar', 'nav.listen': 'Escuchar', 'nav.method': 'Método', 'nav.presets': 'Presets',
      'cta.download': 'Descargar presets', 'cta.listen': 'Escuchar',
      'hero.title': 'Presets de piano calibrados contra <em>el original.</em>',
      'hero.sub': 'Patches para Keyscape y Omnisphere ajustados midiendo, banda por banda, contra grabaciones de pianos de concierto reales.',
      'hero.cap': 'CZ German Concert V2, renderizado desde mi propia interpretación. Toca para escuchar.',
      'proof.1': 'Royal 3D contra el Nord, cada octava de 32 Hz a 8 kHz', 'proof.2': 'Centro de brillo de German Concert V2 contra el Roland',
      'proof.3': 'Balance izquierda y derecha después de la corrección', 'proof.4': 'Velocidades medidas en un Yamaha MX88',
      'compare.eyebrow': 'Medido, no adivinado', 'compare.title': 'Mira cómo se cierra la distancia.',
      'compare.lead': 'Cada línea es el balance tonal de una grabación, octava por octava. La meta es la línea de referencia.',
      'legend.before': 'Primera versión', 'legend.after': 'Calibrado',
      'm.tilt': 'Inclinación, 250 Hz a 8 kHz', 'm.centroid': 'Centro de brillo', 'm.width': 'Amplitud estéreo', 'm.balance': 'Balance izquierda y derecha', 'm.ref': 'ref',
      'note.german': 'Las dos versiones renderizan la misma interpretación MIDI, así que el patch es la única diferencia. Referencia: demo de la expansión V-Piano del Roland RD-2000.',
      'note.royal': 'Tomas en vivo en mi MX88, comparadas con el demo del Nord Grand Royal Grand 3D. El preset publicado es la tercera pasada.',
      'note.cfx': 'Tomas en vivo comparadas con el demo oficial del Yamaha CFX. El preset publicado agrega una tercera pasada en los agudos, aún sin volver a medir.',
      'listen.title': 'La misma interpretación. Dos patches.',
      'listen.lead': 'Una toma MIDI renderizada con las dos versiones de German Concert. Cambia mientras suena: solo cambia el patch.',
      'takes.title': 'Tomas en vivo en mi MX88', 'takes.lead': 'Son interpretaciones distintas: escucha el tono, no las notas.',
      'take.before': 'Antes', 'take.after': 'Calibrado', 'take.mid': 'Segunda pasada',
      'method.title': 'Cómo se calibra un preset',
      'm1.t': 'Medir al pianista', 'm1.p': 'Cuatro rondas de pp a ff en el MX88 definen la curva de velocidad, para que suave de verdad suene suave.',
      'm2.t': 'Renderizar la misma toma', 'm2.p': 'El MIDI pasa por el plugin de Keyscape sin tiempo real. Cada render es idéntico, así que lo que cambia es el patch.',
      'm3.t': 'Comparar contra la referencia', 'm3.p': 'Diez bandas de octava, inclinación, amplitud estéreo y balance izquierda y derecha.',
      'm4.t': 'Ajustar y volver a medir', 'm4.p': 'Nueve pasadas de render para German Concert V2. Una detectó un desbalance de 7 dB a la izquierda antes de publicarlo.',
      'presets.title': 'Qué incluye el paquete', g1: 'Calibrados contra una referencia', g2: 'Keyscape', g3: 'Omnisphere', g4: 'Curvas de velocidad',
      'install.title': 'Instalado en un minuto', 's1.t': 'Descargar', 's1.p': 'Baja el zip desde GitHub y descomprímelo.',
      's2.t': 'Copiar', 's2.p': 'Pon cada carpeta en tu librería de usuario de Spectrasonics.', 's3.t': 'Actualizar', 's3.p': 'Dale Refresh Library en el navegador del plugin.',
      copy: 'Copiar ruta', copied: 'Copiado',
      'foot.req': 'Requiere copias con licencia de Spectrasonics Keyscape y/u Omnisphere. Son solo ajustes, sin muestras.',
      'foot.tm': 'Sin afiliación con Spectrasonics, Yamaha, Nord ni Roland. Los nombres de producto pertenecen a sus dueños y solo se usan para describir las grabaciones de referencia.',
      play: 'Reproducir', pause: 'Pausar', lang: 'Switch to English'
    }
  };
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
  }
  $('#lang').addEventListener('click', () => { lang = lang === 'es' ? 'en' : 'es'; store.set('rk-lang', lang); applyLang(); });

  $$('.js-download').forEach(a => { a.href = DOWNLOAD; });
  $$('.js-repo').forEach(a => { a.href = REPO; });

  /* ---------- shared audio engine: one <audio>, many controls ---------- */
  const audio = $('#player');
  /* Each track is fetched once into a Blob URL: always seekable, so A/B switches keep their position on any host. */
  const blobs = {};
  const fetchTrack = n => blobs[n] || (blobs[n] = fetch(`assets/audio/${n}.mp3`).then(r => r.blob()).then(b => URL.createObjectURL(b)));
  let current = null; // name of the track loaded in <audio>
  let owner = null; // 'hero' | 'ab' | take element
  async function load(name, at = 0, who, autoplay = true) {
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
    if (owner === who && !audio.paused) { audio.pause(); return; }
    if (owner === who && audio.paused && current === name) { audio.play().catch(() => {}); return; }
    load(name, 0, who);
  }
  const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  function setIcon(btn, playing) {
    const i = btn.querySelector('.icon'); i.classList.toggle('i-play', !playing); i.classList.toggle('i-pause', playing);
    btn.setAttribute('aria-label', playing ? t('pause') : t('play'));
  }
  function syncPlayLabels() {
    const p = !audio.paused;
    setIcon($('#specPlay'), p && owner === 'hero');
    $('#spec').classList.toggle('is-playing', p && owner === 'hero');
    setIcon($('#abPlay'), p && owner === 'ab');
    $$('.take').forEach(el => { const on = p && owner === el; setIcon($('.take__play', el), on); el.classList.toggle('is-playing', on); });
  }
  ['play', 'pause', 'ended'].forEach(e => audio.addEventListener(e, syncPlayLabels));

  /* rAF loop only while playing: drives playheads and waveform progress */
  let raf = 0;
  function tick() {
    const p = audio.duration ? audio.currentTime / audio.duration : 0;
    if (owner === 'hero') { const s = $('#spec'); $('#specHead').style.transform = `translateX(${p * s.clientWidth}px)`; }
    if (owner === 'ab') { drawWave($('#abWave'), abName, p); $('#abTime').textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`; }
    if (owner instanceof Element) { const c = $('canvas', owner); drawWave(c, owner.dataset.src, p); }
    if (!audio.paused) raf = requestAnimationFrame(tick);
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
  $('#specPlay').addEventListener('click', () => toggle('german-v2', 'hero'));

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
      ['m.width', 'width', v => v.toFixed(2)],
      ['m.balance', 'balance', v => `${v > 0 ? '+' : ''}${v.toFixed(2)} dB`]
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
    drawSpec($('#specCanvas')); drawSpec($('#miniSpec'), .45);
    drawWave($('#abWave'), abName, owner === 'ab' && audio.duration ? audio.currentTime / audio.duration : 0);
    $$('.take').forEach(t2 => drawWave($('canvas', t2), t2.dataset.src, 0));
    drawVel();
  }
  applyLang();
  const ro = new ResizeObserver(() => paint()); ro.observe(document.body);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  document.fonts && document.fonts.ready.then(paint);
})();
