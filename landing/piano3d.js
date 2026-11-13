/* ReferenceKeys: a 9 ft concert grand built in three.js and drawn as a technical line drawing.
   It sits fixed behind the whole page and turns with the scroll, so the visitor walks around the
   piano while reading. Keys, hammers and strings light up from the live audio (window.RK.act, set by app.js).
   Same plan geometry as tools/landing/draw_art.py (units: drawing px / 100, keyboard toward +Z). */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const host = document.getElementById('bg3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - clamp(t), 3);

let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
catch { document.documentElement.classList.add('no-3d'); throw new Error('WebGL unavailable'); } // the SVG fallback stays
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
host.appendChild(renderer.domElement);
document.documentElement.classList.add('has-3d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, .1, 200);

/* ---------- materials: hidden-line look (fills in the surface color, lines in ink) ---------- */
const ink = new THREE.LineBasicMaterial({ color: 0xf4f2ee, transparent: true, opacity: .9 });
const inkSoft = new THREE.LineBasicMaterial({ color: 0xf4f2ee, transparent: true, opacity: .35 });
const fill = new THREE.MeshBasicMaterial({ color: 0x0e0e10, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const accent = new THREE.Color(0xff5d3d);
const accentMat = new THREE.MeshBasicMaterial({ color: accent });

const P = (x, y) => new THREE.Vector2((x - 375) / 100, -(y - 520) / 100); // plan px -> shape coords
const W = (x, y, h) => new THREE.Vector3((x - 375) / 100, h, (y - 520) / 100); // plan px -> world
const bez = (p0, p1, p2, p3, n = 32) => { const o = []; for (let i = 1; i <= n; i++) { const q = i / n, a = (1 - q) ** 3, b = 3 * (1 - q) ** 2 * q, c = 3 * (1 - q) * q * q, d = q ** 3; o.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]); } return o; };
const OUTER = [[60, 880], [60, 230], ...bez([60, 230], [60, 120], [140, 60], [230, 70]), ...bez([230, 70], [330, 82], [372, 170], [400, 300]), ...bez([400, 300], [430, 440], [500, 520], [600, 560]), ...bez([600, 560], [660, 585], [690, 620], [690, 690]), [690, 880]];
const INNER = [[78, 870], [78, 232], ...bez([78, 232], [78, 136], [148, 84], [230, 90]), ...bez([230, 90], [318, 100], [354, 184], [382, 306]), ...bez([382, 306], [412, 450], [486, 536], [588, 576]), ...bez([588, 576], [642, 598], [672, 632], [672, 690]), [672, 870]];
const topY = x => { let m = Infinity; for (let i = 0; i < INNER.length; i++) { const [x1, y1] = INNER[i], [x2, y2] = INNER[(i + 1) % INNER.length]; if ((x1 - x) * (x2 - x) <= 0 && x1 !== x2) m = Math.min(m, y1 + (y2 - y1) * (x - x1) / (x2 - x1)); } return m; };
const shape = pts => new THREE.Shape(pts.map(([x, y]) => P(x, y)));

const piano = new THREE.Group();
scene.add(piano);
function solid(geo, parent = piano, edgeAngle = 25, mat = fill, line = ink) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), line));
  parent.add(g); return g;
}
const flat = geo => { geo.rotateX(-Math.PI / 2); return geo; }; // shape plane -> horizontal, extrusion -> up

/* rim: outer wall with the inner opening, 0.9 high (about 30 cm on a 2.74 m piano) */
const RIM = .9;
const rimShape = shape(OUTER); rimShape.holes.push(new THREE.Path(INNER.slice().reverse().map(([x, y]) => P(x, y))));
solid(flat(new THREE.ExtrudeGeometry(rimShape, { depth: RIM, bevelEnabled: false, curveSegments: 24 })), piano, 30);
/* soundboard inside the rim */
const board = flat(new THREE.ShapeGeometry(shape(INNER), 24)); board.translate(0, .22, 0);
solid(board, piano, 30, fill, inkSoft);

/* plate: portholes and struts, just above the soundboard */
const plate = [];
[[186, 300, 30], [312, 470, 28], [430, 640, 24], [186, 520, 22]].forEach(([cx, cy, r]) => {
  const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(W(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.25, .42)); }
  piano.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkSoft));
});
[[210, 846, 224, 620, 262, 360, 236, 120], [420, 846, 426, 700, 470, 590, 540, 548], [130, 846, 140, 600, 150, 300, 150, 140]].forEach(c => {
  const pts = bez([c[0], c[1]], [c[2], c[3]], [c[4], c[5]], [c[6], c[7]], 30).map(([x, y]) => W(x, y, .44));
  piano.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([W(c[0], c[1], .44), ...pts]), inkSoft));
});
/* bridge */
{ const pts = []; for (let x = 180; x <= 664; x += 6) pts.push(W(x, topY(x) + 34, .5)); piano.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ink)); }

/* 88 keys, strings and hammers */
const KX0 = 72, KW = (678 - 72) / 52, KEYS = [];
{ let w = 0;
  for (let k = 0; k < 88; k++) {
    const black = [1, 3, 6, 8, 10].includes((k + 9) % 12), sx = 92 + k * (568 / 87);
    const ex = k < 20 ? sx + 70 - k * 1.3 : sx, ey = topY(ex) + (k < 20 ? 16 : 14);
    KEYS.push({ black, kx: black ? KX0 + w * KW : KX0 + (w + .5) * KW, sx, ex, ey });
    if (!black) w++;
  } }
const strPos = new Float32Array(88 * 6), strCol = new Float32Array(88 * 6);
KEYS.forEach((K, k) => { const a = W(K.sx, 842, .58), b = W(K.ex, K.ey, k < 20 ? .66 : .58); strPos.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6); });
const strGeo = new THREE.BufferGeometry(); strGeo.setAttribute('position', new THREE.BufferAttribute(strPos, 3)); strGeo.setAttribute('color', new THREE.BufferAttribute(strCol, 3));
const strMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .8 });
piano.add(new THREE.LineSegments(strGeo, strMat));
const hammerGeo = new THREE.BoxGeometry(.035, .1, .1);
const hammers = KEYS.map(K => { const m = new THREE.Mesh(hammerGeo, accentMat); m.position.copy(W(K.sx, 828, .46)); piano.add(m); return m; });

/* keyboard: key bed, cheeks, white and black keys (each key keeps its own fill so it can light) */
const KEY_Y = .62;
solid(new THREE.BoxGeometry(6.54, .22, 1.08).translate(0, .42, (932 - 520) / 100));
solid(new THREE.BoxGeometry(.24, .5, 1.12).translate((60 - 375) / 100, .55, (930 - 520) / 100));
solid(new THREE.BoxGeometry(.24, .5, 1.12).translate((690 - 375) / 100, .55, (930 - 520) / 100));
const whiteGeo = new THREE.BoxGeometry(KW / 100 * .94, .08, .92), blackGeo = new THREE.BoxGeometry(.075, .1, .54);
const keys = KEYS.map(K => {
  const mat = fill.clone(), g = solid(K.black ? blackGeo : whiteGeo, piano, 25, mat);
  g.position.copy(K.black ? W(K.kx, 908, KEY_Y + .09) : W(K.kx, 930, KEY_Y));
  g.userData = { mat, y: g.position.y, black: K.black }; return g;
});

/* lid open on its hinge along the straight side, prop stick, music desk */
const LID = .55;
const lidPivot = new THREE.Group(); lidPivot.position.set((60 - 375) / 100, RIM, 0); piano.add(lidPivot);
const lidGeo = flat(new THREE.ExtrudeGeometry(shape(OUTER.filter(([, y]) => y <= 840).concat([[690, 840], [60, 840]])), { depth: .05, bevelEnabled: false, curveSegments: 24 }));
lidGeo.translate(-(60 - 375) / 100, 0, 0);
const lid = solid(lidGeo, lidPivot, 30); lidPivot.rotation.z = LID;
{ const base = W(560, 520, RIM), d = (560 - 60) / 100 * .78, top = new THREE.Vector3((60 - 375) / 100 + d * Math.cos(LID), RIM + d * Math.sin(LID), base.z);
  piano.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([base, top]), ink)); }
const desk = solid(new THREE.BoxGeometry(2.8, .62, .04)); desk.position.copy(W(375, 820, RIM + .34)); desk.rotation.x = -.26;

/* legs, lyre and pedals, and a floor ring to ground it */
const FLOOR = -2.05;
[[100, 850], [650, 850], [235, 160]].forEach(([x, y]) => {
  const leg = solid(new THREE.CylinderGeometry(.13, .09, 2.05, 8, 1), piano, 50); leg.position.copy(W(x, y, -1.02));
  const cast = solid(new THREE.CylinderGeometry(.11, .11, .08, 12), piano, 50); cast.position.copy(W(x, y, FLOOR + .04));
});
solid(new THREE.BoxGeometry(.6, 1.7, .12).translate(0, -1.05, (840 - 520) / 100));
[-.16, 0, .16].forEach(dx => solid(new THREE.BoxGeometry(.07, .03, .36).translate(dx, FLOOR + .18, (870 - 520) / 100)));
{ const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 5, FLOOR, Math.sin(a) * 5 + .2)); }
  piano.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkSoft)); }

/* ---------- grounding: a pool of light on the floor and the piano's soft shadow inside it ----------
   Without a shadow the piano floats. The light comes from straight above and slightly in front, so the
   shadow stays fixed under the case while the camera walks around it. Both are baked once into canvas
   textures (no real-time shadow maps): an ambient blur of the case outline plus tight contact spots
   under the casters, pedals and lyre. Blur uses canvas shadowBlur, which every browser supports. */
const FS = 12, FPX = 512, fpx = v => (v + FS / 2) / FS * FPX;                 // floor units -> canvas px
const planX = x => fpx((x - 375) / 100), planZ = y => fpx((y - 520) / 100 - .12); // nudged back: light is in front
function floorTex(draw) {
  const c = document.createElement('canvas'); c.width = c.height = FPX;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
const blurred = (ctx, blur, alpha, path) => { // draw a shape off canvas and keep only its blurred shadow
  ctx.save(); ctx.shadowColor = `rgba(255,255,255,${alpha})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = 4 * FPX;
  ctx.translate(-4 * FPX, 0); ctx.fillStyle = '#fff'; ctx.beginPath(); path(); ctx.fill(); ctx.restore();
};
const caseOutline = (ctx, grow = 1) => {
  const mx = planX(375), mz = planZ(520);
  OUTER.forEach(([x, y], i) => { const px = mx + (planX(x) - mx) * grow, pz = mz + (planZ(y) - mz) * grow; i ? ctx.lineTo(px, pz) : ctx.moveTo(px, pz); });
  ctx.closePath();
};
const shadowTex = floorTex(ctx => {
  blurred(ctx, 46, .45, () => caseOutline(ctx, 1.08));                       // wide, soft ambient shadow
  blurred(ctx, 16, .55, () => caseOutline(ctx, .96));                        // core under the case
  const spot = (x, y, r) => () => ctx.ellipse(planX(x), planZ(y), r, r * .8, 0, 0, Math.PI * 2);
  [[100, 850], [650, 850], [235, 160]].forEach(([x, y]) => blurred(ctx, 7, .95, spot(x, y, 7)));   // casters
  blurred(ctx, 8, .8, () => ctx.rect(planX(345), planZ(866), planX(405) - planX(345), 10));          // lyre and pedals
});
const poolTex = floorTex(ctx => {
  const g = ctx.createRadialGradient(FPX / 2, FPX / 2, 0, FPX / 2, FPX / 2, FPX / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FPX, FPX);
});
const floorMat = (map, opacity) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false });
const poolMat = floorMat(poolTex, .13), shadowMat = floorMat(shadowTex, .9);
[[poolMat, .002], [shadowMat, .004]].forEach(([m, lift], i) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(FS, FS).rotateX(-Math.PI / 2), m);
  p.position.y = FLOOR + lift; p.renderOrder = -2 + i; piano.add(p);
});

piano.position.set(0, .55, -.2); // center of mass of piano + legs near the origin

/* ---------- theme: ink and fill follow the surface behind the piano ---------- */
let onStage = true, themeKey = '';
function applyTheme() {
  const lineC = onStage ? '#f4f2ee' : css('--ink'), fillC = onStage ? css('--stage') || '#0e0e10' : css('--bg');
  const key = lineC + fillC; if (key === themeKey) return; themeKey = key;
  [ink, inkSoft].forEach(m => m.color.set(lineC)); fill.color.set(fillC);
  /* on stage the light pool brightens the dark floor and the shadow is black; on the page there is no pool and the shadow is ink */
  poolMat.color.set(lineC); poolMat.opacity = onStage ? .13 : 0;
  shadowMat.color.set(onStage ? '#000000' : css('--ink')); shadowMat.opacity = onStage ? .9 : .22;
  keys.forEach(g => g.userData.mat.color.set(fillC));
  for (let k = 0; k < 88; k++) strCol.set(new THREE.Color(lineC).toArray().concat(new THREE.Color(lineC).toArray()), k * 6);
  strGeo.attributes.color.needsUpdate = true;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { themeKey = ''; });

/* ---------- camera path: scroll turns the piano a full circle ---------- */
let vw = 0, vh = 0;
function resize() {
  vw = innerWidth; vh = innerHeight;
  renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let tx = 0, ty = 0, cx = 0, cy = 0;
if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { tx = e.clientX / vw - .5; ty = e.clientY / vh - .5; }, { passive: true });

/* Three acts, all driven by scroll position:
   1. hero: the piano rests to the right of the copy (below it on phones), seen from above the keyboard;
   2. #spin: a pinned section where the piano is alone on screen and the camera walks a full circle,
      dipping low to show the legs and lyre, then rising over the open lid;
   3. the rest of the page: the piano keeps turning slowly, faint, behind the content. */
const stage = document.getElementById('stage'), spin = document.getElementById('spin');
const t0 = performance.now();
let last = '';
const keyCol = new THREE.Color();
const TAU = Math.PI * 2, AZ0 = -.55;
function frame(now) {
  requestAnimationFrame(frame);
  const sy = scrollY, docMax = Math.max(1, document.documentElement.scrollHeight - vh);
  const heroH = stage ? stage.offsetHeight : vh;
  const sr = spin ? spin.getBoundingClientRect() : { top: heroH - sy, height: vh };
  const spinLen = Math.max(1, sr.height - vh);
  const s = reduce ? 0 : clamp(-sr.top / spinLen);                    // progress inside the spin section
  const enter = clamp(1 - sr.top / vh);                                 // spin section sliding in (0 to 1)
  const after = clamp((-sr.top - spinLen) / vh);                        // spin section leaving (0 to 1)
  const spinEnd = sy + sr.top + spinLen;                                // scroll position where the turn completes
  const rest = reduce ? 0 : clamp((sy - spinEnd) / Math.max(1, docMax - spinEnd)); // the rest of the page
  if (spin) spin.style.setProperty('--s', s.toFixed(3));

  const wasStage = onStage; onStage = after < .5; if (wasStage !== onStage) themeKey = '';
  applyTheme();
  host.style.opacity = lerp(1, .3, after).toFixed(3);

  const intro = reduce ? 1 : ease((now - t0 - 300) / 2200);
  cx += (tx - cx) * .05; cy += (ty - cy) * .05;
  const narrow = vw < 900;
  const az = AZ0 + s * TAU + rest * Math.PI + cx * .35;
  const elHero = .62, elSpin = .5 - .32 * Math.sin(s * Math.PI) + .25 * s * s;  // dips low mid-turn, ends high
  const el = lerp(1.25, lerp(elHero, after > 0 ? lerp(elSpin, .45, after) : elSpin, enter), intro) - cy * .12;
  const dist = lerp((narrow ? 40 : 25), (narrow ? 42 : 21), enter) - intro * 1.5;
  camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
  camera.lookAt(0, -.35, 0);
  const off = 1 - enter; // hero offset fades out as the spin section arrives
  const ox = narrow ? 0 : -vw * lerp(lerp(.2, .13, enter), 0, after);       // keep the piano clear of the copy
  const oy = narrow ? -vh * lerp(lerp(.2, .16, enter), 0, after) : -vh * lerp(.04, .1, enter) * (1 - after);
  camera.setViewOffset(vw, vh, ox, oy, vw, vh);

  /* live keys */
  const act = (window.RK && window.RK.act) || null; let busy = false;
  if (act) {
    const lineC = new THREE.Color(onStage ? '#f4f2ee' : css('--ink')), fillC = new THREE.Color(onStage ? '#0e0e10' : css('--bg'));
    for (let k = 0; k < 88; k++) {
      const a = act[k]; if (a > .01) busy = true;
      const g = keys[k]; g.position.y = g.userData.y - a * .05;
      g.userData.mat.color.copy(keyCol.copy(fillC).lerp(accent, clamp(a * 1.2)));
      hammers[k].position.y = .46 + a * .12;
      const c = keyCol.copy(lineC).lerp(accent, clamp(a * 1.3)); strCol.set([c.r, c.g, c.b, c.r, c.g, c.b], k * 6);
    }
    strGeo.attributes.color.needsUpdate = true;
  }
  const state = [sy, vw, vh, cx.toFixed(3), cy.toFixed(3), intro < 1 ? now : 1, themeKey, busy ? now : 0].join();
  if (state === last) return; last = state;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
