/* ReferenceKeys: a 9 ft concert grand built in three.js and drawn as a technical line drawing; the camera plays shots 1 to 3 of SHOTS.md.
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
const LID = .55; // fully open on the long stick
const lidPivot = new THREE.Group(); lidPivot.position.set((60 - 375) / 100, RIM + .004, 0); piano.add(lidPivot);
const lidGeo = flat(new THREE.ExtrudeGeometry(shape(OUTER.filter(([, y]) => y <= 840).concat([[690, 840], [60, 840]])), { depth: .05, bevelEnabled: false, curveSegments: 24 }));
lidGeo.translate(-(60 - 375) / 100, 0, 0);
solid(lidGeo, lidPivot, 30);
/* the prop stick stands on the rim and holds the lid at 78% of its width; it follows the lid as it opens */
const stickBase = W(560, 520, RIM), stickD = (560 - 60) / 100 * .78;
const stickGeo = new THREE.BufferGeometry().setFromPoints([stickBase, stickBase.clone()]);
const stick = new THREE.Line(stickGeo, ink); piano.add(stick);
function setLid(a) {
  lidPivot.rotation.z = a;
  const p = stickGeo.attributes.position;
  p.setXYZ(1, (60 - 375) / 100 + stickD * Math.cos(a), RIM + stickD * Math.sin(a), stickBase.z); p.needsUpdate = true;
  stick.visible = a > .06;
}
setLid(LID);
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


/* ---------- the spotlight: a faint cone of light from above, plus fog as the dark of the room ----------
   The cone is additive and brightest where you look through it (view-facing), so it reads as a volume of
   light, not a solid. Fog in the surface color hides what the light has not reached yet and softens the far
   side of the piano, which works as cheap depth of field on the close shots. */
const fog = new THREE.Fog(0x0e0e10, 1, 1000); scene.fog = fog;
const coneMat = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(0xf4f2ee) }, uOpacity: { value: 0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float a = uOpacity * pow(f, 2.0) * mix(1.0, .2, vUv.y); gl_FragColor = vec4(uColor, a); }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
});
const CONE_H = 10, CONE_FLOOR = FLOOR + .55; // world floor height (piano group is lifted .55)
const cone = new THREE.Mesh(new THREE.ConeGeometry(5.4, CONE_H, 64, 1, true), coneMat);
cone.position.set(0, CONE_FLOOR + CONE_H / 2, -.2); cone.renderOrder = 5; scene.add(cone);

/* ---------- theme: ink and fill follow the surface behind the piano ---------- */
let onStage = true, themeKey = '';
function applyTheme() {
  const lineC = onStage ? '#f4f2ee' : css('--ink'), fillC = onStage ? css('--stage') || '#0e0e10' : css('--bg');
  const key = lineC + fillC; if (key === themeKey) return; themeKey = key;
  [ink, inkSoft].forEach(m => m.color.set(lineC)); fill.color.set(fillC); fog.color.set(fillC);
  poolMat.color.set(lineC);
  shadowMat.color.set(onStage ? '#000000' : css('--ink')); shadowMat.opacity = onStage ? .9 : .22;
  keys.forEach(g => g.userData.mat.color.set(fillC));
  for (let k = 0; k < 88; k++) strCol.set(new THREE.Color(lineC).toArray().concat(new THREE.Color(lineC).toArray()), k * 6);
  strGeo.attributes.color.needsUpdate = true;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { themeKey = ''; });

let vw = 0, vh = 0;
function resize() {
  vw = innerWidth; vh = innerHeight;
  renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let tx = 0, ty = 0, cx = 0, cy = 0;
if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { tx = e.clientX / vw - .5; ty = e.clientY / vh - .5; }, { passive: true });

/* ---------- the film (SHOTS.md, shots 1 to 3) ----------
   T runs 0 to 1 through the hero (shot 1) and 1 to 2 through #film (shots 2 and 3, f = T - 1).
   Each key pose is a camera orbiting a look-at point: azimuth (0 = in front of the keyboard, +PI/2 = the
   curved side, PI = behind the tail), elevation, distance, and the lid angle.
     shot 1  in the dark: eye level from the tail side, lid closed, the spotlight comes on
     shot 2  the lid opens while the camera travels along the curved side toward the keyboard
     shot 3  the camera drops to the curved side, under the open lid (the music desk is edge-on from
             there), and tracks along the hammer line while the numbers play as subtitles
     cut     #film's black plate (CSS) covers the end; the canvas hides and comes back faint behind the page */
const POSES = [
  { t: 0,    az: 2.45, el: .10, d: 27,   look: [0, -.25, 0],     lid: 0 },
  { t: 1,    az: 2.10, el: .16, d: 23,   look: [0, -.15, 0],     lid: 0 },
  { t: 1.36, az: 1.00, el: .30, d: 22, look: [0, .1, .4],      lid: LID },
  { t: 1.48, az: 1.15, el: .50, d: 10,   look: [0, .5, 2.4],      lid: LID },
  { t: 1.6,  az: 1.30, el: .38, d: 5.6,  look: [-1.7, 1.0, 2.88], lid: LID },
  { t: 1.93, az: 1.36, el: .40, d: 5.4,  look: [.8, 1.0, 2.88],   lid: LID },
];
const smooth = t => t * t * (3 - 2 * t);
function poseAt(T) {
  let i = 0; while (i < POSES.length - 2 && T > POSES[i + 1].t) i++;
  const a = POSES[i], b = POSES[i + 1], q = smooth(clamp((T - a.t) / (b.t - a.t)));
  return { az: lerp(a.az, b.az, q), el: lerp(a.el, b.el, q), d: lerp(a.d, b.d, q), lid: lerp(a.lid, b.lid, q), look: a.look.map((v, k) => lerp(v, b.look[k], q)) };
}

const root = document.documentElement;
const stage = document.getElementById('stage'), film = document.getElementById('film');
let introAt = null, Ts = null, last = '';
const keyCol = new THREE.Color(), look = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  const sy = scrollY, docMax = Math.max(1, root.scrollHeight - vh);
  const heroH = stage ? stage.offsetHeight : vh;
  const fr = film ? film.getBoundingClientRect() : { top: heroH - sy, bottom: heroH - sy, height: 0 };
  const filmLen = Math.max(1, fr.height - vh);
  const heroP = clamp(sy / Math.max(1, heroH));                         // shot 1
  const f = clamp(-fr.top / filmLen);                                   // shots 2 and 3
  const after = clamp(1 - fr.bottom / vh);                              // the film has left the screen
  const filmEnd = sy + fr.bottom;
  const rest = reduce ? 0 : clamp((sy - filmEnd) / Math.max(1, docMax - filmEnd));
  if (film) film.style.setProperty('--f', f.toFixed(4));

  /* the camera glides toward the scroll position instead of snapping to it */
  const T = reduce ? 1.36 : (fr.top > 0 ? heroP : 1 + f);
  Ts = Ts === null ? T : Ts + (T - Ts) * .1; if (Math.abs(T - Ts) < 1e-4) Ts = T;

  const wasStage = onStage; onStage = after < .5; if (wasStage !== onStage) themeKey = '';
  applyTheme();
  /* the cut: hidden under the black plate at the end of the film, back at 30% behind the page */
  const cut = !reduce && f > .93 && after < .5;
  host.style.opacity = (cut ? 0 : reduce ? lerp(1, .3, after) : after < .5 ? 1 : lerp(0, .3, clamp((after - .5) * 2))).toFixed(3);

  /* the spotlight comes on once the visitor is past the gate */
  if (introAt === null && !root.classList.contains('gated')) introAt = now;
  const intro = reduce ? 1 : introAt === null ? 0 : ease((now - introAt - 250) / 2600);

  cx += (tx - cx) * .05; cy += (ty - cy) * .05;
  const P = poseAt(Ts);
  const page = reduce ? clamp(after * 2) : after >= .5 ? 1 : 0;           // after the cut: slow turn behind the page
  const az = lerp(P.az, 2.1 + rest * Math.PI, page) + cx * .25;
  const el = lerp(P.el, .45, page) - cy * .08;
  const aspect = vw / vh, wide = aspect < 1 ? Math.min(2.1, 1.3 / aspect) : 1; // portrait screens step back on wide shots
  const d0 = lerp(P.d, 22, page), d = d0 * (1 + (wide - 1) * clamp((d0 - 4) / 12));
  look.set(...P.look).lerp(new THREE.Vector3(0, -.35, 0), page);
  camera.position.set(look.x + Math.sin(az) * Math.cos(el) * d, look.y + Math.sin(el) * d, look.z + Math.cos(az) * Math.cos(el) * d);
  camera.lookAt(look);
  setLid(lerp(P.lid, LID, page));
  /* hero framing: the piano sits right of the copy (below it on phones) and centers as shot 1 ends */
  const narrow = vw < 900, heroK = page ? 0 : 1 - smooth(clamp(Ts));
  /* wide film shots: lift the piano so the subtitles sit under it */
  const liftK = page ? 0 : smooth(clamp((Ts - 1) / .12)) * (1 - smooth(clamp((Ts - 1.44) / .12)));
  camera.setViewOffset(vw, vh, narrow ? 0 : -vw * .2 * heroK, (narrow ? -vh * .33 : -vh * .1) * heroK + vh * .09 * liftK, vw, vh);

  /* light and dark of the room */
  const lit = onStage ? intro : 1;
  fog.far = lerp(d - 5, d + 14, lit); fog.near = Math.max(.1, fog.far - lerp(3, 10, lit));
  poolMat.opacity = onStage ? .13 * intro : 0;
  coneMat.uniforms.uOpacity.value = onStage ? .06 * intro * clamp((d - 7) / 6) : 0;
  cone.visible = coneMat.uniforms.uOpacity.value > .001;

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
  const state = [sy, vw, vh, Ts.toFixed(4), cx.toFixed(3), cy.toFixed(3), intro < 1 ? now : 1, themeKey, busy ? now : 0].join();
  if (state === last) return; last = state;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
