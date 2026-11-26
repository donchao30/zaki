'use strict';
{
const $ = id => document.getElementById(id);
const T = THREE;

/* ---------- Données ---------- */
const CHARS = [
  ['BaseZaki', 'base', 0x6fd3ff, 'Commun'], ['ChatZaki', 'chat', 0xffa64d, 'Commun'], ['BananeZaki', 'banane', 0xffe14d, 'Commun'],
  ['DinoZaki', 'dino', 0x5cc96b, 'Rare'], ['PizzaZaki', 'pizza', 0xff9f1c, 'Rare'], ['PandaZaki', 'panda', 0xf4f4f4, 'Rare'],
  ['PirateZaki', 'pirate', 0xe24b4a, 'Rare'], ['FootZaki', 'foot', 0x3c7bd8, 'Rare'],
  ['NinjaZaki', 'ninja', 0x2b2b3a, 'Épique'], ['RoboZaki', 'robo', 0x4d8bff, 'Épique'], ['DragonZaki', 'dragon', 0xd8452c, 'Épique'],
  ['VampiZaki', 'vampi', 0x9b7fd4, 'Épique'], ['ZombiZaki', 'zombi', 0x8fd16a, 'Épique'], ['MagiZaki', 'magi', 0x3c5bd8, 'Épique'],
  ['AstroZaki', 'astro', 0xdfe8f0, 'Légendaire'], ['PhénixZaki', 'phenix', 0xff6a2c, 'Légendaire'], ['GlaceZaki', 'glace', 0x9fe8ff, 'Légendaire'],
  ['DiamantZaki', 'diamant', 0xe8f6ff, 'Premium'], ['RoiZaki', 'roi', 0xffd23f, 'Premium'], ['ReineZaki', 'reine', 0xff7ac8, 'Premium'],
  ['PèreNoëlZaki', 'perenoel', 0xd62828, 'Noël'], ['MèreNoëlZaki', 'merenoel', 0xc2185b, 'Noël'], ['LutinZaki', 'lutin', 0x2e9e4f, 'Noël'],
  ['RenneZaki', 'renne', 0x8b5a2b, 'Noël'], ['BonhommeNeigeZaki', 'bonhomme', 0xffffff, 'Noël']
];
const CLS = { 'Commun': '#8a8a99', 'Rare': '#3d7bff', 'Épique': '#9b4dff', 'Légendaire': '#ff8a1c', 'Premium': '#d4a000', 'Noël': '#d62828' };
const store = {
  get(k, d) { try { const v = localStorage.getItem('zaki_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('zaki_' + k, JSON.stringify(v)); } catch (e) { } }
};
let myChar = store.get('char', 18); if (!(myChar >= 0 && myChar < CHARS.length)) myChar = 18;
let coins = store.get('coins', 0);

/* ---------- Rendu ---------- */
const host = $('game');
const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
const SET = Object.assign({ mus: 60, sfx: 70, vib: true, gfx: 2, btn: 50 }, (() => { try { return JSON.parse(localStorage.getItem('zaki_set')) || {}; } catch (e) { return {}; } })());
// netteté : on vise la vraie résolution de l'écran, puis on baisse tout seul si le téléphone rame
let pxTarget = 1, pxCur = 1;
function applyGfx() { const d = window.devicePixelRatio || 1; pxTarget = SET.gfx === 0 ? Math.min(d, 1) : SET.gfx === 1 ? Math.min(d, 1.6) : Math.min(d, 2.2); pxCur = pxTarget; renderer.setPixelRatio(pxCur); }
let fpsAcc = 0, fpsN = 0;
function autoRes(dtReal) {
  if (state !== 'play') return; fpsAcc += dtReal; fpsN++;
  if (fpsAcc < 2) return; const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
  if (fps < 45 && pxCur > 1) { pxCur = Math.max(1, pxCur - 0.25); renderer.setPixelRatio(pxCur); }
  else if (fps > 57 && pxCur < pxTarget) { pxCur = Math.min(pxTarget, pxCur + 0.25); renderer.setPixelRatio(pxCur); }
}
applyGfx();
renderer.outputEncoding = T.sRGBEncoding;
host.appendChild(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color(0x5aa8ff).convertSRGBToLinear();
scene.fog = new T.Fog(new T.Color(0xffc8a8).convertSRGBToLinear(), 70, 210);
// ciel en dégradé (4 teintes), recoloré selon l'univers de chaque map
const skyGeo = new T.SphereGeometry(300, 32, 20);
skyGeo.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
function setSky(t, m, h, l) {
  const top = new T.Color(t).convertSRGBToLinear(), mid = new T.Color(m).convertSRGBToLinear(), hor = new T.Color(h).convertSRGBToLinear(), low = new T.Color(l).convertSRGBToLinear();
  const pa = skyGeo.attributes.position, ca = skyGeo.attributes.color, c = new T.Color();
  for (let i = 0; i < pa.count; i++) {
    const y = pa.getY(i) / 300;
    if (y > 0.25) c.copy(mid).lerp(top, Math.min(1, (y - 0.25) / 0.55));
    else if (y > 0) c.copy(hor).lerp(mid, y / 0.25);
    else c.copy(hor).lerp(low, Math.min(1, -y / 0.4));
    ca.setXYZ(i, c.r, c.g, c.b);
  }
  ca.needsUpdate = true;
}
{ const sky = new T.Mesh(skyGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -1; scene.add(sky); window.__sky = sky; }
const cam = new T.PerspectiveCamera(60, 1, 0.1, 400);
const hemi = new T.HemisphereLight(0xfff0dc, 0xb05a8a, 0.62); scene.add(hemi);
const sun = new T.DirectionalLight(0xffd9a8, 0.72); sun.position.set(14, 30, -12); scene.add(sun);
const rim = new T.DirectionalLight(0xff8fc8, 0.22); rim.position.set(-12, 8, 20); scene.add(rim);
/* ---- univers : chaque map a son monde (ciel, brume, lumière) ---- */
const UNIV = {
  def:      { cl: 0xffffff, gd: [0x7ad83f, 0xc04f9c, 0xa63d88], items: ['arbre', 'champignon', 'palmier', 'cadeau', 'arbre', 'champignon'], sky: [0x2f7dff, 0x8fc8ff, 0xffc49a, 0xff8fb0], fog: 0xffc8a8, fn: 70, ff: 210, hemi: [0xfff0dc, 0xb05a8a, 0.62], sun: [0xffd9a8, 0.72], rim: [0xff8fc8, 0.22] },
  // plage tropicale : grand ciel bleu, horizon sable, mer turquoise en bas
  toboggan: { cl: 0xffffff, gd: [0xffd98a, 0xe89a4a, 0xc87a3a], items: ['palmier', 'cadeau', 'palmier', 'champignon', 'palmier', 'cadeau'], sky: [0x0a6cff, 0x5ec8ff, 0xfff1c2, 0x18c8d0], fog: 0xbff0ff, fn: 80, ff: 230, hemi: [0xfff6e0, 0x2aa8b8, 0.66], sun: [0xfff0c8, 0.8], rim: [0x7fe8ff, 0.2] },
  // château au coucher du soleil : violet profond, horizon orange feu
  marteaux: { cl: 0xffc0b0, gd: [0x5cbf3a, 0x8f7fb0, 0x6a5a8a], items: ['tour', 'arbre', 'tour', 'champignon', 'arbre', 'tour'], sky: [0x2b1a6e, 0x9a3fa8, 0xff8a3c, 0x5a1f6a], fog: 0xd86a7a, fn: 60, ff: 200, hemi: [0xffd8b0, 0x5a2a7a, 0.6], sun: [0xffa860, 0.85], rim: [0xb07aff, 0.3] },
  // pays des bonbons : ciel rose barbe à papa
  bonbon:   { cl: 0xffe6f4, gd: [0xff8fd0, 0x8a4a2a, 0x6a321a], items: ['sucette', 'cupcake', 'sucette', 'cadeau', 'cupcake', 'sucette'], sky: [0xff4fa6, 0xff9fd2, 0xffe3f2, 0xffb0dc], fog: 0xffc4e4, fn: 70, ff: 210, hemi: [0xfff0f8, 0xff7ac8, 0.66], sun: [0xffe6f2, 0.72], rim: [0xffffff, 0.2] },
  // espace : nuit étoilée violette
  hexa:     { cl: null, gd: [0xb7a6ff, 0x5a3a9a, 0x3a2470], items: ['champignon', 'cadeau', 'champignon', 'cadeau', 'champignon', 'cadeau'], sky: [0x05031a, 0x1a0a4a, 0x5a1a8a, 0x0a0420], fog: 0x2a1258, fn: 80, ff: 260, hemi: [0xd8d0ff, 0x3a1a6a, 0.72], sun: [0xfff0ff, 0.78], rim: [0x5fd6ff, 0.45] },
  // royaume d'or : ciel doré
  // forêt enchantée la nuit : ciel bleu nuit, lune, lucioles
  nuit:     { cl: 0x4a5090, gd: [0x2f7a5a, 0x3a2a6a, 0x2a1a50], items: ['champignon', 'arbre', 'champignon', 'cadeau', 'champignon', 'arbre'], sky: [0x050828, 0x16246a, 0x5a3a96, 0x0a0f30], fog: 0x3a3a86, fn: 55, ff: 200, hemi: [0x9aaeff, 0x3a1a5a, 0.8], sun: [0xc8d8ff, 0.7], rim: [0xff7ad8, 0.4] },
  couronne: { cl: 0xfff2c8, gd: [0xffe066, 0xe0a020, 0xb07a10], items: ['tour', 'cadeau', 'arbre', 'tour', 'cadeau', 'palmier'], sky: [0xff9a00, 0xffc94a, 0xfff0b0, 0xffb040], fog: 0xffe08a, fn: 70, ff: 220, hemi: [0xfff4d0, 0xc07a20, 0.66], sun: [0xffe2a0, 0.8], rim: [0xffd23f, 0.28] }
};
let UKEY = 'def';
function applyUniverse(k) {
  const u = UNIV[k] || UNIV.def; UKEY = UNIV[k] ? k : 'def';
  setSky(...u.sky); clouds.visible = u.cl != null; if (u.cl != null) cloudMat.color.set(u.cl).convertSRGBToLinear(); scene.fog.color.set(u.fog).convertSRGBToLinear(); scene.fog.near = u.fn; scene.fog.far = u.ff;
  hemi.color.set(u.hemi[0]); hemi.groundColor.set(u.hemi[1]); hemi.intensity = u.hemi[2];
  sun.color.set(u.sun[0]); sun.intensity = u.sun[1]; rim.color.set(u.rim[0]); rim.intensity = u.rim[1];
}
// couleurs chaudes et vives : on ravive les teintes pastel des maps (plus saturées, moins délavées, un peu plus chaudes)
function warmColor(col) {
  const h = {}; col.getHSL(h);
  if (h.s < 0.08 && h.l > 0.85) { col.setHSL(0.11, 0.9, 0.9); return col; } // blanc pur -> crème chaude
  let s = Math.min(1, h.s * 1.35 + 0.18), l = h.l;
  if (l > 0.62) l = 0.62 + (l - 0.62) * 0.45; // les pastels deviennent des vraies couleurs
  let hh = h.h; if (hh > 0.45 && hh < 0.7) hh -= 0.015; // bleus un peu moins froids
  col.setHSL(hh, s, l); return col;
}
const showScene = new T.Scene(), showCam = new T.PerspectiveCamera(30, 1, 0.1, 100);
showCam.position.set(0, 0, 10); showCam.lookAt(0, 0, 0);
showScene.add(new T.HemisphereLight(0xffffff, 0xb0a0ff, 0.85));
{ const d = new T.DirectionalLight(0xffffff, 0.75); d.position.set(3, 5, 8); showScene.add(d); const f = new T.DirectionalLight(0xffe6f5, 0.3); f.position.set(-4, 2, 5); showScene.add(f); }
function resize() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w > h ? 58 : 72; cam.updateProjectionMatrix(); showCam.aspect = w / h; showCam.updateProjectionMatrix(); }
let lastW = 0, lastH = 0;
function checkSize() { const w = host.clientWidth, h = host.clientHeight; if (w && h && (w !== lastW || h !== lastH)) { lastW = w; lastH = h; resize(); } }
window.addEventListener('resize', checkSize); window.addEventListener('orientationchange', () => setTimeout(checkSize, 300));
if (window.visualViewport) window.visualViewport.addEventListener('resize', checkSize);
checkSize();
const matCache = {};
const LM = c => matCache[c] || (matCache[c] = new T.MeshLambertMaterial({ color: new T.Color(c).convertSRGBToLinear() }));
const pmCache = {};
const PM = (c, sh) => pmCache[c + '_' + (sh || 60)] || (pmCache[c + '_' + (sh || 60)] = new T.MeshPhongMaterial({ color: new T.Color(c).convertSRGBToLinear(), shininess: sh || 60, specular: 0x444444 }));
// boîte aux bords arrondis (look jouet)
function rbox(w, h, d, r, mat) {
  r = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
  const s = new T.Shape(), x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r;
  s.moveTo(x, y); s.lineTo(x + W, y); s.lineTo(x + W, y + H); s.lineTo(x, y + H); s.lineTo(x, y);
  const geo = new T.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
  geo.translate(0, 0, -(d - 2 * r) / 2);
  return new T.Mesh(geo, mat);
}
function starShape(ro, ri) { const st = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? ri : ro; i ? st.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : st.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); } return st; }
/* nuages : gros cumulus moelleux (fond plat, dessous ombré), teintés selon l'univers, absents dans l'espace */
const cloudMat = new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, emissive: 0x404040 }), clouds = new T.Group(); scene.add(clouds);
function cloudGeo(seed) {
  const R = rng(seed), parts = [], n = 7 + Math.floor(R() * 4), len = 5 + R() * 4;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = (t - 0.5) * len * 2, mid = 1 - Math.abs(t - 0.5) * 2;
    const r = 1.4 + mid * 1.8 + R() * 0.8, g = new T.SphereGeometry(r, 18, 12);
    g.translate(x + (R() - 0.5), r * 0.35 + mid * 0.9 + R() * 0.4, (R() - 0.5) * 2); parts.push(g);
  }
  for (let i = 0; i < 3; i++) { const r = 1.6 + R() * 1.2, g = new T.SphereGeometry(r, 18, 12); g.translate((R() - 0.5) * len, 2.4 + R() * 1.2, (R() - 0.5) * 1.5); parts.push(g); }
  let geo = T.BufferGeometryUtils ? T.BufferGeometryUtils.mergeBufferGeometries(parts.map(p => p.toNonIndexed()), false) : parts[0];
  const pa = geo.attributes.position, na = geo.attributes.normal, cols = new Float32Array(pa.count * 3), lo = new T.Color(0xc9cfee).convertSRGBToLinear(), hi = new T.Color(0xffffff), c = new T.Color();
  for (let i = 0; i < pa.count; i++) {
    let y = pa.getY(i); if (y < 0.2) { y = 0.2; pa.setY(i, y); na.setXYZ(i, na.getX(i) * 0.3, -1, na.getZ(i) * 0.3); }
    c.copy(lo).lerp(hi, Math.min(1, Math.max(0, (y - 0.2) / 2.6))); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new T.BufferAttribute(cols, 3));
  return geo;
}
{
  const geos = [1, 2, 3, 4, 5].map(cloudGeo), R = rng(77);
  for (let i = 0; i < 40; i++) {
    const side = R() < 0.5 ? -1 : 1, m = new T.Mesh(geos[i % 5], cloudMat);
    m.position.set(side * (20 + R() * 50), -18 + R() * 26, -40 + R() * 280); m.rotation.y = R() * 6.28; m.scale.setScalar(0.9 + R() * 1.1);
    clouds.add(m);
  }
}
applyUniverse('def');

/* ---------- Persos 3D ---------- */
const loader = T.GLTFLoader ? new T.GLTFLoader() : null;
const looks = {}, loading = {};
function bean(c) {
  const g = new T.Group();
  const b = new T.Mesh(new T.SphereGeometry(0.5, 20, 16), LM(c)); b.scale.set(1, 1.35, 1); b.position.y = 0.68; g.add(b);
  const v = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), LM(0x1b1b2f)); v.scale.set(1.15, 0.62, 0.6); v.position.set(0, 0.95, 0.33); g.add(v);
  [-0.11, 0.11].forEach(x => {
    const e = new T.Mesh(new T.SphereGeometry(0.06, 8, 8), new T.MeshBasicMaterial({ color: 0xffffff })); e.position.set(x, 0.98, 0.51); g.add(e);
    const f = new T.Mesh(new T.SphereGeometry(0.16, 10, 8), LM(0x1b1b2f)); f.position.set(x * 2, 0.1, 0); g.add(f);
  });
  g.userData.bones = null; return g;
}
const qTmp = new T.Quaternion(), axX = new T.Vector3(1, 0, 0);
function prepModel(root) {
  root.updateMatrixWorld(true);
  let sk = null;
  root.traverse(o => {
    if (o.isSkinnedMesh && !sk) sk = o;
    if (o.isMesh) {
      o.frustumCulled = false;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => { if (!m) return; if ('metalness' in m) m.metalness = Math.min(m.metalness, 0.05); if ('roughness' in m) m.roughness = Math.max(m.roughness, 0.6); });
    }
  });
  root.updateMatrixWorld(true);
  const box = new T.Box3(), v = new T.Vector3();
  if (sk && sk.boneTransform) {
    const pos = sk.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 500));
    for (let i = 0; i < pos.count; i += step) { sk.boneTransform(i, v); v.applyMatrix4(sk.matrixWorld); box.expandByPoint(v); }
  } else box.setFromObject(root);
  const size = new T.Vector3(); box.getSize(size);
  if (!(size.y > 0) || !isFinite(size.y)) throw new Error('taille');
  const s = 1.35 / size.y;
  const inner = new T.Group(); inner.add(root);
  inner.scale.setScalar(s);
  inner.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
  const holder = new T.Group(); holder.add(inner);
  const bones = {};
  ['LeftUpLeg', 'RightUpLeg', 'LeftArm', 'RightArm', 'Spine01'].forEach(n => { const o = root.getObjectByName(n); if (o) bones[n] = { o, q: o.quaternion.clone() }; });
  holder.userData.bones = Object.keys(bones).length ? bones : null;
  return holder;
}
function animLook(h, ph, amt) {
  const b = h.userData.bones; if (!b) return;
  const sw = Math.sin(ph) * amt;
  const set = (n, a) => { const e = b[n]; if (!e) return; qTmp.setFromAxisAngle(axX, a); e.o.quaternion.copy(e.q).multiply(qTmp); };
  set('LeftUpLeg', sw * 0.7); set('RightUpLeg', -sw * 0.7); set('LeftArm', -sw * 0.35); set('RightArm', sw * 0.35);
}
function loadChar(i) {
  if (looks[i]) return Promise.resolve(looks[i]);
  if (loading[i]) return loading[i];
  loading[i] = new Promise(res => {
    const fallback = () => { looks[i] = bean(CHARS[i][2]); res(looks[i]); };
    if (!loader) return fallback();
    const timer = setTimeout(fallback, 25000);
    try {
      loader.load('models/' + CHARS[i][1] + '.glb', g => {
        clearTimeout(timer); if (looks[i]) return;
        try { looks[i] = prepModel(g.scene); } catch (e) { looks[i] = bean(CHARS[i][2]); }
        res(looks[i]);
      }, undefined, () => { clearTimeout(timer); if (!looks[i]) fallback(); });
    } catch (e) { clearTimeout(timer); fallback(); }
  });
  return loading[i];
}

/* ---------- Monde (maps) ---------- */
let meteorT = 0;
let world = null, plats = [], sweepers = [], blocks = [], movers = [], spawners = [], balls = [], cps = [], finishZ = null, crown = null, hexes = [];
// la couronne se pose sur la tête du gagnant (et le suit jusqu'au podium)
function crownOnHead(r) {
  if (!crown || crown.head) return;
  const tgt = r.look || r.inner; tgt.updateMatrixWorld(true);
  const bb = new T.Box3().setFromObject(tgt), ws = tgt.getWorldScale(new T.Vector3()).y || 1;
  const top = tgt.worldToLocal(new T.Vector3(r.pos.x, bb.max.y, r.pos.z)), k = 0.3 / ws;
  if (crown.g.parent) crown.g.parent.remove(crown.g);
  crown.g.position.set(top.x, top.y - 0.12 / ws + 0.9 * k, top.z); crown.g.rotation.set(0, 0, 0); crown.g.scale.setScalar(k);
  tgt.add(crown.g); crown.head = true; burst(r.pos.x, r.pos.y + 2, r.pos.z, 30);
}
function clearWorld() {
  if (EL) { EL = null; show('elimTag', false); }
  if (crown && crown.head && crown.g.parent) crown.g.parent.remove(crown.g);
  if (world) scene.remove(world);
  world = new T.Group(); scene.add(world);
  plats = []; sweepers = []; blocks = []; movers = []; spawners = []; balls = []; cps = []; finishZ = null; crown = null; hexes = [];
  floaters = []; crowd = []; cannons = []; parts = []; doneSeen = 0; meteorT = 0; trailPool.length = 0;
}
function box(w, h, d, c, x, y, z) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), LM(c)); m.position.set(x, y, z); world.add(m); return m; }
function plat(x0, x1, z0, z1, top, c, o) {
  o = o || {};
  const m = box(x1 - x0, 1, z1 - z0, c, (x0 + x1) / 2, top - 0.5, (z0 + z1) / 2); m.visible = VIS;
  const p = { x0, x1, z0, z1, top, kind: o.kind || '', rail: !!o.rail, mesh: m, alive: true };
  plats.push(p);
  if (o.rail && VIS) [x0, x1].forEach(x => box(0.3, 0.35, z1 - z0, 0xffffff, x, top + 0.12, (z0 + z1) / 2));
  if (o.kind === 'pad') { // trampoline : cadre violet, toile élastique, ressorts — s'écrase quand on rebondit
    const w = x1 - x0, d = z1 - z0, g = new T.Group(); g.position.set((x0 + x1) / 2, top - 0.42, (z0 + z1) / 2); world.add(g);
    const fr = rbox(w, 0.3, d, 0.12, PM(0x8a4dff)); fr.position.y = 0.15; g.add(fr);
    const tr = new T.Group(); tr.position.y = 0.3; g.add(tr);
    const mem = rbox(w - 0.3, 0.14, d - 0.3, 0.06, PM(c, 90)); mem.position.y = 0.1; tr.add(mem);
    const ring = new T.Mesh(new T.TorusGeometry(Math.min(w, d) * 0.28, 0.06, 6, 24), PM(0xffffff)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.19; tr.add(ring);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { for (let k = 0; k < 3; k++) { const s = new T.Mesh(new T.TorusGeometry(0.11, 0.035, 5, 10), PM(0xffd23f)); s.rotation.x = Math.PI / 2; s.position.set(sx * (w / 2 - 0.3), 0.05 - k * 0.1, sz * (d / 2 - 0.3)); g.add(s); } });
    p.tramp = tr;
  }
  return p;
}
let VIS = true;
function discPlat(x, z, r, top, c) {
  const m = new T.Mesh(new T.CylinderGeometry(r, r, 0.9, 32), LM(c)); m.position.set(x, top - 0.45, z); m.visible = VIS; world.add(m);
  const p = { hex: true, cx: x, cz: z, rad: r, top, mesh: m, alive: true, t: -1, c, disc: true }; plats.push(p); return p;
}
const neonMats = {};
function hexTile(x, z, top, c, neon) {
  if (neon) { // espace : dalle de métal sombre, dessus lumineux néon
    const body = 0x2e2560, m = new T.Mesh(new T.CylinderGeometry(1.36, 1.2, 0.6, 6), PM(body, 90)); m.position.set(x, top - 0.3, z); world.add(m);
    const nm = neonMats[c] || (neonMats[c] = new T.MeshPhongMaterial({ color: new T.Color(c).convertSRGBToLinear(), emissive: new T.Color(c).convertSRGBToLinear().multiplyScalar(0.45), shininess: 100, specular: 0xffffff }));
    const capm = new T.Mesh(new T.CylinderGeometry(1.1, 1.24, 0.08, 6), nm); capm.position.y = 0.32; m.add(capm);
    const inner = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.02, 6), PM(body, 90)); inner.position.y = 0.37; m.add(inner);
    const p = { hex: true, cx: x, cz: z, rad: 1.45, top, mesh: m, alive: true, t: -1, c: body, vy: 0 };
    plats.push(p); hexes.push(p); return p;
  }
  const m = new T.Mesh(new T.CylinderGeometry(1.36, 1.2, 0.6, 6), PM(c, 50)); m.position.set(x, top - 0.3, z); world.add(m);
  const tc = new T.Color(c); tc.lerp(new T.Color(0xffffff), 0.35);
  const capm = new T.Mesh(new T.CylinderGeometry(1.16, 1.3, 0.08, 6), PM(tc.getHex(), 80)); capm.position.y = 0.32; m.add(capm);
  const p = { hex: true, cx: x, cz: z, rad: 1.45, top, mesh: m, alive: true, t: -1, c, vy: 0 };
  plats.push(p); hexes.push(p); return p;
}
function mover(x, w, z0, z1, top, amp, spd, ph, c) {
  const p = plat(x - w / 2, x + w / 2, z0, z1, top, c);
  if (p.mesh) {
    p.mesh.visible = true; p.mesh.material = PM(c || 0xffc21a, 50);
    const d = z1 - z0, tp = rbox(w - 0.35, 0.16, d - 0.35, 0.07, PM(0xffe58a, 70)); tp.position.y = 0.55; p.mesh.add(tp);
    for (let i = 0; i < 6; i++) { const hx = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.05, 6), PM(0xffd23f, 70)); hx.position.set(-w / 2 + 0.7 + (i % 3) * (w - 1.4) / 2, 0.66, (i < 3 ? -1 : 1) * d * 0.22); p.mesh.add(hx); }
    [-1, 1].forEach(sd => { const ar = new T.Mesh(new T.ConeGeometry(0.32, 0.6, 3), PM(0xffffff)); ar.rotation.z = sd * -Math.PI / 2; ar.rotation.y = Math.PI / 2; ar.position.set(sd * (w / 2 - 0.45), 0.7, 0); ar.scale.z = 0.3; p.mesh.add(ar); });
  }
  Object.assign(p, { mov: true, bx: x, hw: w / 2, amp, spd, ph, vx: 0, cx: x }); movers.push(p); return p;
}
function sweeper(z, w, y, L, cx) {
  y = y || 0; L = L || 5.8; cx = cx || 0;
  const g = new T.Group(); g.position.set(cx, y, z); world.add(g);
  const base = new T.Mesh(new T.CylinderGeometry(1.15, 1.25, 0.18, 28), PM(0x8a4dff)); base.position.y = 0.09; g.add(base);
  const rim = new T.Mesh(new T.TorusGeometry(1.2, 0.08, 8, 32), PM(0xffd23f)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.18; g.add(rim);
  const piv = new T.Group(); g.add(piv);
  for (let k = 0; k < 4; k++) { const s = new T.Mesh(new T.CylinderGeometry(0.58, 0.62, 0.34, 20), PM(k % 2 ? 0xffffff : 0xff4fa6)); s.position.y = 0.35 + k * 0.34; piv.add(s); }
  const cap = new T.Mesh(new T.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), PM(0xffd23f, 90)); cap.position.y = 1.7; piv.add(cap);
  const st = new T.Mesh(new T.ExtrudeGeometry(starShape(0.42, 0.18), { depth: 0.12, bevelEnabled: false }), PM(0xff4fa6)); st.rotation.x = -Math.PI / 2; st.position.y = 2.25; piv.add(st);
  for (let k = 0; k < 10; k++) { const seg = new T.Mesh(new T.CylinderGeometry(k % 2 ? 0.36 : 0.41, k % 2 ? 0.36 : 0.41, L * 2 / 10 - 0.02, 16), PM(k % 2 ? 0xffffff : 0xff6fbf)); seg.rotation.z = Math.PI / 2; seg.position.set(-L + L * 2 / 10 * (k + 0.5), 0.9, 0); piv.add(seg); }
  [-L, L].forEach(x => { const c = new T.Mesh(new T.SphereGeometry(0.56, 16, 12), PM(0xff3d9a, 90)); c.position.set(x, 0.9, 0); piv.add(c); const b = new T.Mesh(new T.TorusGeometry(0.5, 0.09, 8, 20), PM(0xffd23f)); b.position.set(x, 0.9, 0); b.rotation.y = Math.PI / 2; piv.add(b); });
  sweepers.push({ z, w, y, L, cx, a0: z * 0.37, a: z * 0.37, piv });
}
function block(z, bx, amp, spd, ph, o) {
  o = o || {};
  const y = o.y || 0, hammer = !!o.hammer, hw = hammer ? 0.75 : 1.5, hd = hammer ? 0.75 : 0.8, h = 1.6;
  let m;
  if (hammer) {
    // pendule : boule rose à étoile sous un portique violet/jaune
    m = new T.Group(); world.add(m);
    // marteau géant : tête rayée rose/blanc, bouts jaunes à étoile, manche violet (comme l'illustration)
    const head = new T.Group(); head.position.y = -6.3; m.add(head);
    for (let k = 0; k < 5; k++) { const s = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.46, 20), PM(k % 2 ? 0xffffff : 0xff4fa6, 80)); s.rotation.x = Math.PI / 2; s.position.z = -0.92 + k * 0.46; head.add(s); }
    [-1, 1].forEach(sd => {
      const cap = new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 0.2, 24), PM(0xffd23f, 90)); cap.rotation.x = Math.PI / 2; cap.position.z = sd * 1.25; head.add(cap);
      const disc = new T.Mesh(new T.CircleGeometry(0.62, 24), LM(0x8a4dff)); disc.position.z = sd * 1.36; disc.rotation.y = sd > 0 ? 0 : Math.PI; head.add(disc);
      const st = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 0.2 : 0.48; i ? st.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : st.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
      const star = new T.Mesh(new T.ShapeGeometry(st), LM(0xffd23f)); star.position.z = sd * 1.37; star.rotation.y = sd > 0 ? 0 : Math.PI; head.add(star);
    });
    const pole = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 5.6, 10), LM(0x8a4dff)); pole.position.y = -3.0; m.add(pole);
    [-1.2, -4.6].forEach(py => { const r2 = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.3, 12), LM(0xffd23f)); r2.position.y = py; m.add(r2); });
    m.position.set(bx, y + 7.6, z);
    const sp = o.span || 7;
    const beam = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, sp, 12), LM(0xffd23f)); beam.rotation.z = Math.PI / 2; beam.position.set(0, y + 7.6, z); world.add(beam);
    [-sp / 2, sp / 2].forEach(px => { const p = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 7.8, 12), LM(0x8a4dff)); p.position.set(px, y + 3.9, z); world.add(p); });
  } else {
    m = new T.Group(); m.position.set(bx, 0, z); world.add(m);
    if (o.c) { // guimauve moelleuse
      const b = rbox(3, h, 1.6, 0.45, PM(o.c, 20)); b.position.y = y + h / 2; m.add(b);
      const sw = new T.Mesh(new T.TorusGeometry(0.55, 0.09, 8, 24), PM(0xff9ed2)); sw.position.set(0, y + h / 2, -0.82); m.add(sw);
    } else { // double gant de boxe sur un cadre jaune
      const fr = rbox(3, 0.5, 1.2, 0.2, PM(0xffd23f)); fr.position.y = y + 0.25; m.add(fr);
      [-0.75, 0.75].forEach(gx => {
        const gl = new T.Mesh(new T.SphereGeometry(0.72, 20, 14), PM(0xe8213b, 80)); gl.scale.set(1, 0.95, 1.15); gl.position.set(gx, y + 1.05, -0.15); m.add(gl);
        const th = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), PM(0xe8213b, 80)); th.position.set(gx + (gx > 0 ? -0.55 : 0.55), y + 0.95, -0.35); m.add(th);
        const cuff = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.45, 16), PM(0xffffff)); cuff.rotation.x = Math.PI / 2; cuff.position.set(gx, y + 1.05, 0.62); m.add(cuff);
        const ln = new T.Mesh(new T.BoxGeometry(0.5, 0.06, 0.05), PM(0xffffff)); ln.position.set(gx, y + 1.35, -0.92); m.add(ln);
      });
    }
    // vrais objets 3D Higgsfield : guimauve en colère / gants de boxe
    const wm = world, mm = m, keep = o.c ? 0 : 1;
    loadProp(o.c ? 'guimauve' : 'gant').then(p => {
      if (!p || world !== wm) return;
      while (mm.children.length > keep) mm.remove(mm.children[mm.children.length - 1]);
      if (o.c) [-0.78, 0.78].forEach((gx, i) => { const c = p.clone(); c.scale.setScalar(1.62); c.rotation.y = Math.PI + (i ? -0.12 : 0.12); c.position.set(gx, y, 0); mm.add(c); });
      else [-1, 1].forEach(sd => { const c = p.clone(); c.scale.setScalar(1.5); c.rotation.z = -sd * Math.PI / 2; c.position.set(sd * 0.05, y + 1.05, 0); mm.add(c); });
    });
  }
  blocks.push({ z, bx, amp, spd, ph, x: bx, y, hw, hd, h, hammer, m, vx: 0 });
}
function ballZone(zs, ze, x0, x1, every, top) { spawners.push({ zs, ze, x0, x1, every, top: top || 0, t: 1 }); }
/* objets roulants Higgsfield : ballon de plage, donut, tonneau, pièce d'or, météorite (selon MAP.roll) */
const ROLL = {
  ballonplage: { s: 2.1 },
  donut: { s: 2.35, ry: -Math.PI / 2 + 0.6 },
  piece: { s: 2.35, ry: Math.PI / 2 - 0.6 },
  tonneau: { s: 2.25, rz: Math.PI / 2 }
};
const rollTpl = {};
function rollPrep(kind) {
  if (!kind || rollTpl[kind] || kind === 'meteorite' || kind === 'lune') return;
  const d = ROLL[kind]; if (!d) return;
  loadProp(kind).then(p => {
    if (!p) return;
    const o = new T.Group(), c = p.clone(); c.position.y = -0.5; o.add(c);
    if (d.ry) o.rotation.y = d.ry; if (d.rz) o.rotation.z = d.rz;
    o.scale.setScalar(d.s); rollTpl[kind] = o;
  });
}
let meteorMat = null;
function meteorMesh() {
  if (!meteorMat) {
    let map = null;
    try {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext && cv.getContext('2d');
      if (x && x.fillRect) {
        x.fillStyle = '#6a3fa0'; x.fillRect(0, 0, 256, 128);
        x.strokeStyle = '#ff7a1a'; x.lineWidth = 5; const R = rng(5);
        for (let i = 0; i < 26; i++) { x.beginPath(); let px = R() * 256, py = R() * 128; x.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (R() - 0.5) * 60; py += (R() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); }
        x.fillStyle = '#4a2a7a'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(R() * 256, R() * 128, 6 + R() * 10, 0, 6.3); x.fill(); }
        map = new T.CanvasTexture(cv); map.encoding = T.sRGBEncoding;
      }
    } catch (e) { map = null; }
    meteorMat = new T.MeshPhongMaterial({ color: map ? 0xffffff : 0x7a4ab0, map, emissive: 0xff5a00, emissiveIntensity: 0.25, emissiveMap: map, shininess: 20, flatShading: true });
  }
  const m = new T.Mesh(new T.IcosahedronGeometry(1.1, 1), meteorMat);
  const fire = new T.Mesh(new T.ConeGeometry(0.9, 3.2, 12, 1, true), new T.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.55, depthWrite: false }));
  fire.position.y = 2.0; m.add(fire);
  return m;
}
function meteorTick(dt) {
  meteorT -= dt; if (meteorT > 0) return;
  meteorT = 2.6 + Math.random() * 1.2;
  if (MAP.time - clock < 6) return;
  const live = field ? field.filter(r => !r.out) : []; if (!live.length) return;
  const r = live[(Math.random() * live.length) | 0];
  const cand = hexes.filter(p => p.alive && p.t < 0 && Math.abs(p.top - r.pos.y) < 3 && Math.hypot(p.cx - r.pos.x, p.cz - r.pos.z) < 6);
  if (!cand.length) return;
  const p = cand[(Math.random() * cand.length) | 0], b = rollMesh();
  b.m.position.set(p.cx, p.top + 30, p.cz); b.hex = p; balls.push(b);
}
let moonMat = null;
function moonRock() { // boule de lune lumineuse qui roule (map de nuit)
  if (!moonMat) {
    let map = null;
    try {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext && cv.getContext('2d');
      if (x && x.fillRect) { x.fillStyle = '#dfe8ff'; x.fillRect(0, 0, 256, 128); const R = rng(12); for (let i = 0; i < 22; i++) { const cx = R() * 256, cy = R() * 128, r = 5 + R() * 14; x.fillStyle = '#aeb8e8'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); x.fillStyle = '#c8d2f6'; x.beginPath(); x.arc(cx - r * 0.2, cy - r * 0.2, r * 0.7, 0, 6.3); x.fill(); } map = new T.CanvasTexture(cv); map.encoding = T.sRGBEncoding; }
    } catch (e) { map = null; }
    moonMat = new T.MeshPhongMaterial({ color: map ? 0xffffff : 0xdfe8ff, map, emissive: 0x8fa8ff, emissiveIntensity: 0.55, emissiveMap: map, shininess: 30 });
  }
  const m = new T.Mesh(new T.SphereGeometry(1.05, 24, 16), moonMat);
  const halo = new T.Mesh(new T.SphereGeometry(1.35, 16, 12), new T.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.18, depthWrite: false })); m.add(halo);
  return m;
}
function rollMesh() {
  const kind = MAP && MAP.roll, g = new T.Group();
  let spin;
  if (kind === 'meteorite') { spin = meteorMesh(); }
  else if (kind === 'lune') { spin = moonRock(); }
  else if (rollTpl[kind]) { spin = new T.Group(); spin.add(rollTpl[kind].clone()); }
  else spin = new T.Mesh(ballGeo, ballMats[(Math.random() * 4) | 0]);
  g.add(spin); world.add(g);
  return { m: g, spin };
}
const ballGeo = new T.SphereGeometry(1, 24, 16), ballCols = [0xff4fa6, 0x3fb4ff, 0xffd23f, 0x8a4dff];
const ballMats = ballCols.map(c => {
  let map = null;
  try {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext && cv.getContext('2d');
    if (x && x.fillRect) {
      x.fillStyle = '#' + c.toString(16).padStart(6, '0'); x.fillRect(0, 0, 256, 128);
      x.fillStyle = '#ffffff'; x.fillRect(0, 54, 256, 20);
      x.fillStyle = c === 0xffd23f ? '#ff4fa6' : '#ffd23f';
      for (let i = 0; i < 4; i++) { const cx = 32 + i * 64, cy = i % 2 ? 26 : 102; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 7 : 16; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
      map = new T.CanvasTexture(cv); map.encoding = T.sRGBEncoding;
    }
  } catch (e) { map = null; }
  return new T.MeshPhongMaterial({ color: map ? 0xffffff : new T.Color(c).convertSRGBToLinear(), map, shininess: 90, specular: 0x555555 });
});
function finishLine(z, top) {
  top = top || 0; finishZ = z;
  if (!VIS) return;
  for (let i = 0; i < 12; i++) for (let k = 0; k < 2; k++) box(1, 0.06, 1, (i + k) % 2 ? 0x1b1b2f : 0xffffff, -5.5 + i, top + 0.03, z + 0.5 + k);
  box(0.9, 6.5, 0.9, 0xff5ea8, -6.5, top + 3.25, z); box(0.9, 6.5, 0.9, 0xff5ea8, 6.5, top + 3.25, z); box(14, 1.1, 1.1, 0xffd23f, 0, top + 6.6, z);
}
function nightArch(z) { // arche de départ néon
  [-6.6, 6.6].forEach(x => { const p = new T.Mesh(new T.CylinderGeometry(0.3, 0.35, 7.5, 12), PM(0x2a2050)); p.position.set(x, 3.75, z); world.add(p); const n = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 6.5, 12, 1, true), GM(0x5fe8ff, 0.9)); n.scale.set(1.02, 1, 1.02); n.position.set(x, 3.75, z); world.add(n); });
  const bar = new T.Mesh(new T.TorusGeometry(6.6, 0.3, 10, 40, Math.PI), GM(0xff4fd8, 0.9)); bar.position.set(0, 7.5, z); world.add(bar);
}
function startArch(z) { box(0.6, 7.5, 0.6, 0x2ec4b6, -6.4, 3.75, z); box(0.6, 7.5, 0.6, 0x2ec4b6, 6.4, 3.75, z); box(13.4, 0.6, 0.6, 0x2ec4b6, 0, 7.6, z); }
function crownAt(x, y, z) {
  const g = new T.Group(); g.position.set(x, y, z); world.add(g);
  const gold = new T.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x553300 });
  const ring = new T.Mesh(new T.CylinderGeometry(0.75, 0.6, 0.5, 16, 1, true), gold); g.add(ring);
  for (let i = 0; i < 5; i++) { const c = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 6), gold); const a = i / 5 * Math.PI * 2; c.position.set(Math.cos(a) * 0.65, 0.45, Math.sin(a) * 0.65); g.add(c); }
  crown = { x, y, z, g };
  loadProp('couronne').then(p => { if (!p || crown.g !== g) return; while (g.children.length) g.remove(g.children[0]); const o = p.clone(); o.scale.setScalar(1.9); o.position.y = -0.9; g.add(o); });
}
const cp = (z, x0, x1, y, xs) => cps.push({ z, x0: x0 == null ? -3.5 : x0, x1: x1 == null ? 3.5 : x1, y: y || 0, xs });
const lanes = [-4.5, -1.5, 1.5, 4.5];
const nearest = (arr, v) => arr.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a, arr[0]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wander = (r, lo, hi) => { if (r.tt < 0) { r.tx = lo + Math.random() * (hi - lo); r.tt = 1 + Math.random() * 2; } return r.tx; };

const MAPS = {
  toboggan: {
    name: 'Toboggan Turbo', type: 'race', time: 120, tag: 'Course', col: '#ff7ac8', glb: 'maps/toboggan.glb', floor: 'bois', img: 'img/toboggan3d.jpg', roll: 'ballonplage',
    build() {
      plat(-6, 6, -9, 14, 0, 0xffb3e1, { rail: true });
      this.segs = [[14, 26, 0], [26, 38, -2.5], [38, 50, 0], [50, 60, 2.5]];
      this.segs.forEach(([a, b, cx]) => plat(cx - 6, cx + 6, a, b, 0, 0xffd6ec, { rail: true }));
      sweeper(32, 1.5, 0, 5.8, -2.5); sweeper(48, -1.8, 0, 5.8, 0);
      plat(-6, 6, 63, 98.3, 0, 0xff9ed2, { rail: true }); ballZone(97, 64, -4.8, 4.8, 1.3);
      lanes.forEach(x => plat(x - 1, x + 1, 98.3, 100, 0.2, 0x2ec4b6, { kind: 'pad' }));
      const holes = [[1], [2], [0], [3], [1], [2]]; this.rows = [];
      for (let i = 0; i < 6; i++) {
        const zc = 107.5 + i * 5, xs = [];
        for (let j = 0; j < 4; j++) { if (holes[i].includes(j)) continue; discPlat(lanes[j], zc, 2.2, 0, (i + j) % 2 ? 0xff9a2e : 0xff6fbf); xs.push(lanes[j]); }
        this.rows.push({ z0: zc - 2.2, z1: zc + 2.2, xs });
      }
      plat(-6, 6, 137, 175, 0, 0x7fd6ff, { rail: true }); sweeper(150, 2.0); sweeper(163, -2.3);
      plat(-6, 6, 175, 198, 0, 0xffe066, { rail: true }); finishLine(185);
      cp(-6); cp(15, -2, 2); cp(64); cp(107.5, 0, 0, 0, this.rows[0].xs); cp(138); cp(176);
    },
    botX(r) {
      const z = r.pos.z;
      if (z > 10 && z < 61) { const sg = this.segs.find(q => z < q[1] + 1.5) || this.segs[3]; return sg[2] + clamp(r.tx - sg[2], -2, 2) * 0.5; }
      if (z > 84 && z < 100.5) return nearest(lanes, r.tx) + (r.miss ? 1.5 : 0);
      const ri = this.rows.findIndex(w => w.z1 > z + 0.3);
      if (z >= 100.5 && z < 136 && ri >= 0) {
        if (r.miss2) return nearest(lanes, r.tx);
        const a = this.rows[ri].xs, b = this.rows[ri + 1] ? this.rows[ri + 1].xs : a, both = a.filter(x => b.includes(x));
        return nearest(both.length ? both : b, r.tx);
      }
      return wander(r, -4.5, 4.5);
    },
    noJump: z => z > 94 && z < 133
  },
  marteaux: {
    name: 'Marteaux Fous', type: 'race', time: 120, tag: 'Course', col: '#e24b4a', glb: 'maps/marteaux.glb', floor: 'pierre', img: 'img/marteaux3d.jpg', roll: 'tonneau',
    build() {
      plat(-6, 6, -9, 14, 0, 0xffb3e1, { rail: true });
      plat(-3, 3, 14, 26.5, 0, 0xffd23f, { rail: true });
      discPlat(0, 33, 7, 0, 0xff9ed2); sweeper(33, 1.5, 0, 6.4);
      plat(-2.5, 2.5, 39.5, 52, 0, 0xff6fbf); block(46, 0, 2.0, 1.6, 0, { hammer: true, span: 7 });
      plat(-6, 6, 52, 81.6, 0, 0xffd6ec, { rail: true });
      block(58, 0, 3.4, 1.4, 0); block(64, 0, 3.4, 1.7, 2); block(70, 0, 3.4, 1.5, 4); block(76, 0, 3.4, 1.9, 1);
      discPlat(0, 88, 7, 0, 0xffd6ec); sweeper(88, -1.9, 0, 6.4);
      plat(-6, 6, 93.5, 97, 0, 0xffd23f);
      plat(-5, -2, 95, 125, 0, 0xc77dff); plat(2, 5, 95, 125, 0, 0xc77dff);
      block(104, -3.5, 2.4, 1.8, 0, { hammer: true, span: 13 }); block(112, 3.5, 2.4, 1.6, 1, { hammer: true, span: 13 });
      block(121, -3.5, 2.4, 2.0, 2, { hammer: true, span: 13 }); block(121, 3.5, 2.4, 2.0, 0.5, { hammer: true, span: 13 });
      plat(-6, 6, 125, 162, 0, 0x7fd6ff, { rail: true }); ballZone(147.5, 126, -4.8, 4.8, 1.5); finishLine(150);
      cp(-6); cp(15, -1.5, 1.5); cp(27, -1.5, 1.5); cp(40.5, -1, 1); cp(53); cp(82.5, -1, 1); cp(96, 0, 0, 0, [-3.5, 3.5]); cp(126);
    },
    botX(r) {
      const z = r.pos.z;
      if (z > 8 && z < 27) return clamp(r.tx, -1.5, 1.5) * 0.5;
      if (z >= 27 && z < 40) return clamp(wander(r, -2.5, 2.5), -6.5 * Math.sqrt(Math.max(0, 1 - ((z - 33) / 7) ** 2)) * 0.6, 6.5 * Math.sqrt(Math.max(0, 1 - ((z - 33) / 7) ** 2)) * 0.6);
      if (z >= 40 && z < 52) return 0;
      if (z >= 76 && z < 95) return clamp(wander(r, -1.5, 1.5), -1.5, 1.5) * (z < 83 || z > 92 ? 0.4 : 1);
      if (z > 93 && z < 126) return nearest([-3.5, 3.5], r.tx);
      return wander(r, -4.5, 4.5);
    }
  },
  bonbon: {
    name: 'Bonbon Land', type: 'race', time: 120, tag: 'Course', col: '#2ec4b6', glb: 'maps/bonbon.glb', floor: 'chocolat', img: 'img/bonbon3d.jpg', roll: 'donut',
    build() {
      plat(-6, 6, -9, 15.2, 0, 0xffb3e1, { rail: true });
      const holes = [[2], [0], [3], [1], [2], [0], [3]]; this.rows = [];
      for (let i = 0; i < 7; i++) {
        const zc = 16.8 + i * 3.3, xs = [];
        for (let j = 0; j < 4; j++) { if (holes[i].includes(j)) continue; discPlat(lanes[j], zc, 1.95, 0, (i + j) % 2 ? 0xffc21a : 0xffdb4d); xs.push(lanes[j]); }
        this.rows.push({ z0: zc - 1.95, z1: zc + 1.95, xs });
      }
      plat(-6, 6, 38, 56, 0, 0xff9ed2, { rail: true }); sweeper(48, 1.7);
      [-4, 0, 4].forEach(x => plat(x - 1.3, x + 1.3, 56, 58.5, 0.2, 0xff6fbf, { kind: 'pad' }));
      plat(-5, 5, 64, 100, 0, 0xff9ed2, { rail: true });
      [[72, 2, 1.4, 0], [80, -2.5, 1.7, 2], [88, 1, 1.5, 4], [96, -1.5, 1.9, 1]].forEach(([z, x, s, p]) => block(z, 0, 3.2, s, p, { c: 0xfff3f8 }));
      this.m1 = mover(0, 4.5, 101.8, 107.8, 0, 2.2, 1.0, 0, 0xff9a2e); this.m2 = mover(0, 4.5, 109.6, 115.6, 0, 2.2, -1.2, 2, 0x3fb4ff);
      plat(-6, 6, 117.4, 158, 0, 0xb8f0ff, { rail: true }); ballZone(147.5, 118.5, -4.8, 4.8, 1.3); finishLine(150);
      cp(-6); cp(16.8, 0, 0, 0, this.rows[0].xs); cp(39); cp(65); cp(98.5, -1, 1); cp(118);
    },
    botX(r) {
      const z = r.pos.z;
      const ri = this.rows.findIndex(w => w.z1 > z + 0.3);
      if (z > 13 && z < 38.5 && ri >= 0) {
        if (r.miss2) return nearest(lanes, r.tx);
        const a = this.rows[ri].xs, b = this.rows[ri + 1] ? this.rows[ri + 1].xs : a, both = a.filter(x => b.includes(x));
        return nearest(both.length ? both : b, r.tx);
      }
      if (z > 50 && z < 59) return nearest([-4, 0, 4], r.tx) + (r.miss ? 1.8 : 0);
      if (z >= 98 && z < 108.4) return this.m1.cx;
      if (z >= 108.4 && z < 116.5) return this.m2.cx;
      if (z > 59 && z < 100) return clamp(wander(r, -3.5, 3.5), -3.8, 3.8);
      return wander(r, -4.5, 4.5);
    },
    noJump: z => (z > 13 && z < 39) || (z > 52 && z < 60)
  },
  nuit: {
    name: 'Nuit Magique', type: 'race', time: 120, tag: 'Course', col: '#4a3aff', img: 'img/nuit3d.jpg', roll: 'lune',
    build() {
      nplat(-6, 6, -9, 14, 0, { rail: true }); nightArch(11);
      nplat(-6, 6, 14, 40, 0, { rail: true }); sweeper(21, 1.6); sweeper(33, -1.9);
      const holes = [[2], [0], [3], [1]], cols = [0xff4fd8, 0x2ee6ff, 0x8aff4a, 0xffb020]; this.rows = [];
      for (let i = 0; i < 4; i++) {
        const zc = 42.2 + i * 4.4, xs = [];
        for (let j = 0; j < 4; j++) { if (holes[i].includes(j)) continue; mushroomDisc(lanes[j], zc, 2.2, 0, cols[(i + j) % 4]); xs.push(lanes[j]); }
        this.rows.push({ z0: zc - 2.2, z1: zc + 2.2, xs });
      }
      nplat(-6, 6, 57.4, 96, 0, { rail: true }); ballZone(88, 59, -4.8, 4.8, 1.4);
      [-4, 0, 4].forEach(x => { const p = plat(x - 1.3, x + 1.3, 96, 98.5, 0.2, 0x2ee6ff, { kind: 'pad' }); if (p.mesh) p.mesh.visible = false; });
      nplat(-6, 6, 101.5, 166, 0, { rail: true });
      block(112, 0, 3.4, 1.5, 0); block(120, 0, 3.4, 1.8, 2); block(128, 0, 3.4, 1.6, 4);
      sweeper(141, 2.0); finishLine(156);
      cp(-6); cp(15); cp(42.2, 0, 0, 0, this.rows[0].xs); cp(58.5); cp(103); cp(134);
    },
    botX(r) {
      const z = r.pos.z;
      const ri = this.rows.findIndex(w => w.z1 > z + 0.3);
      if (z > 37 && z < 58 && ri >= 0) {
        if (r.miss2) return nearest(lanes, r.tx);
        const a = this.rows[ri].xs, b = this.rows[ri + 1] ? this.rows[ri + 1].xs : a, both = a.filter(x => b.includes(x));
        return nearest(both.length ? both : b, r.tx);
      }
      if (z > 90 && z < 99) return nearest([-4, 0, 4], r.tx) + (r.miss ? 1.8 : 0);
      return wander(r, -4.5, 4.5);
    },
    noJump: z => (z > 37 && z < 58) || (z > 90 && z < 99)
  },
  hexa: {
    name: 'Hexa Chute', type: 'survival', time: 90, tag: 'Survie', col: '#9b4dff', glb: 'maps/hexa.glb', img: 'img/hexa3d.jpg', roll: 'meteorite', meteors: true, hide: /^(CLD\d+_|ISL\d+_)/,
    build() {
      const layers = [0, -6, -12, -18], cols = [[0x2ee6ff, 0x18b8ff], [0xff4fd8, 0xd63ad0], [0x8aff4a, 0x4fe060], [0xffb020, 0xff7a1a]];
      layers.forEach((y, li) => {
        for (let q = -5; q <= 5; q++) for (let rr = -5; rr <= 5; rr++) {
          if (Math.abs(q + rr) > 5) continue;
          hexTile(2.4 * (q + rr / 2), 2.08 * rr + 10, y, cols[li][(q + rr + 8) % 2], true);
        }
      });
    },
    spawn(i, n) { const a = i / n * Math.PI * 2 + (i % 2) * 0.4, d = 3 + (i % 3) * 2.6; return [Math.cos(a) * d, 1, 10 + Math.sin(a) * d]; }
  },
  couronne: {
    name: 'Tour Dorée', type: 'final', type0: 'final', finY: 4.5, time: 130, tag: 'Course', col: '#d4a000', glb: 'maps/couronne.glb', floor: 'marbre', img: 'img/couronne3d.jpg', roll: 'piece',
    build() {
      plat(-6, 6, -9, 10, 0, 0xffb3e1, { rail: true });
      plat(-4, 4, 12, 18, 1.3, 0xffd23f); plat(-4, 4, 19.6, 25.6, 2.6, 0xff9ed2); plat(-4, 4, 27.2, 33, 3.9, 0xa7e04a);
      plat(-6, 6, 33, 55, 3.9, 0x9be37a, { rail: true }); sweeper(41, 2.0, 3.9); ballZone(54.5, 34, -4.8, 4.8, 1.7, 3.9);
      this.m1 = mover(0, 4, 58, 62, 3.9, 3, 1.3, 0, 0xc77dff); this.m2 = mover(0, 4, 65, 69, 3.9, 3, -1.6, 1.5, 0x4d8bff);
      plat(-5, 5, 71, 86, 4.7, 0xff9f1c, { rail: true }); block(77, 0, 2.6, 1.5, 0, { y: 4.7 }); block(82, 0, 2.6, 1.8, 2, { y: 4.7 });
      discPlat(0, 93, 6.5, 6.0, 0xffe9a0);
      // suite du parcours : pont doré, disques qui montent, terrasse d'arrivée
      gplat(-5, 5, 99.3, 126, 6.0, { rail: true }); sweeper(113, 1.9, 6.0);
      this.steps = [[-1.6, 128.6, 6.6], [1.6, 132.6, 7.2], [-1.6, 136.6, 7.8]];
      this.steps.forEach(([x, z, y]) => gdisc(x, z, 2.5, y));
      gplat(-5, 5, 138.8, 166, 7.8, { rail: true }); ballZone(160, 143.5, -3.8, 3.8, 1.9, 7.8);
      if (FINAL) crownAt(0, 9.3, 154); else { finishLine(154, 7.8); goldArch(154, 7.8); }
      cp(-6); cp(12, -2, 2, 1.3); cp(34, -3, 3, 3.9); cp(72, -3, 3, 4.7); cp(88, -1.5, 1.5, 6.0); cp(100, -3, 3, 6.0); cp(140, -3, 3, 7.8);
    },
    botX(r) {
      const z = r.pos.z;
      if (z > 6 && z < 34) return 0;
      if (z >= 55 && z < 63) return this.m1.cx;
      if (z >= 63 && z < 70) return this.m2.cx;
      if (z >= 86 && z < 99) return 0;
      if (z >= 125 && z < 138.8) { const s = this.steps.find(q => q[1] + 2.2 > z) || this.steps[2]; return s[0]; }
      return wander(r, -3.5, 3.5);
    }
  }
};
/* ---- pièces dorées (suite de la Tour Dorée) : marbre et or, toujours visibles ---- */
function gplat(x0, x1, z0, z1, top, o) {
  o = o || {}; const p = plat(x0, x1, z0, z1, top, 0xfff4e0, {});
  const geo = new T.BoxGeometry(x1 - x0, 1.2, z1 - z0); geo.translate((x0 + x1) / 2, top - 0.6, (z0 + z1) / 2); worldUV(geo, 6);
  world.add(new T.Mesh(geo, floorMat('marbre')));
  const under = new T.Mesh(new T.BoxGeometry(x1 - x0 - 0.6, 0.6, z1 - z0 - 0.6), PM(0xe0a020)); under.position.set((x0 + x1) / 2, top - 1.45, (z0 + z1) / 2); world.add(under);
  if (o.rail) {
    p.rail = true;
    [x0, x1].forEach(x => {
      const bar = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, z1 - z0, 10), PM(0xffd23f, 90)); bar.rotation.x = Math.PI / 2; bar.position.set(x, top + 0.85, (z0 + z1) / 2); world.add(bar);
      for (let z = z0 + 0.5; z <= z1; z += 3) { const post = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 0.9, 8), PM(0xffd23f, 90)); post.position.set(x, top + 0.42, z); world.add(post); }
    });
  }
  return p;
}
function gdisc(x, z, r, top) {
  const p = discPlat(x, z, r, top, 0xfff4e0);
  const geo = new T.CylinderGeometry(r, r, 0.9, 40); geo.translate(x, top - 0.45, z); worldUV(geo, 6); world.add(new T.Mesh(geo, floorMat('marbre')));
  const rim = new T.Mesh(new T.TorusGeometry(r, 0.14, 8, 40), PM(0xffd23f, 90)); rim.rotation.x = Math.PI / 2; rim.position.set(x, top - 0.02, z); world.add(rim);
  const stem = new T.Mesh(new T.CylinderGeometry(r * 0.35, r * 0.5, 14, 16), PM(0xffe9a0)); stem.position.set(x, top - 7.9, z); world.add(stem);
  return p;
}
function goldArch(z, top) {
  const gm = PM(0xffd23f, 90);
  [-5.6, 5.6].forEach(x => { const c = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 6.6, 14), gm); c.position.set(x, top + 3.3, z); world.add(c); const b = new T.Mesh(new T.SphereGeometry(0.62, 16, 12), PM(0xff4fa6, 70)); b.position.set(x, top + 6.9, z); world.add(b); });
  const bar = new T.Mesh(new T.TorusGeometry(5.6, 0.36, 10, 40, Math.PI), gm); bar.position.set(0, top + 6.6, z); world.add(bar);
  for (let i = 0; i < 12; i++) for (let k = 0; k < 2; k++) { const t = new T.Mesh(new T.BoxGeometry(0.92, 0.05, 0.92), PM((i + k) % 2 ? 0x1b1b2f : 0xffffff)); t.position.set(-5.06 + i * 0.92, top + 0.03, z + 0.46 + k * 0.92); world.add(t); }
}
/* ---- pièces de la map de nuit : dalles bleu nuit, rambardes néon, lanternes, champignons lumineux ---- */
const glowMats = {};
const GM = (c, k) => glowMats[c + '_' + k] || (glowMats[c + '_' + k] = new T.MeshPhongMaterial({ color: new T.Color(c).convertSRGBToLinear(), emissive: new T.Color(c).convertSRGBToLinear().multiplyScalar(k == null ? 0.6 : k), shininess: 80 }));
function nplat(x0, x1, z0, z1, top, o) {
  o = o || {};
  const p = plat(x0, x1, z0, z1, top, 0x33377a, { kind: o.kind });
  if (p.mesh) { const g = p.mesh.geometry.clone(); g.translate(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z); worldUV(g, 6); p.mesh.geometry = g; p.mesh.position.set(0, 0, 0); p.mesh.material = floorMat('nuit'); }
  if (o.rail) {
    p.rail = true;
    [x0, x1].forEach(x => {
      const tube = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, z1 - z0, 8), GM(0xb06cff, 0.9)); tube.rotation.x = Math.PI / 2; tube.position.set(x, top + 0.75, (z0 + z1) / 2); world.add(tube);
      const edge = new T.Mesh(new T.BoxGeometry(0.16, 0.08, z1 - z0), GM(0x5fe8ff, 1)); edge.position.set(x + (x < 0 ? 0.1 : -0.1), top + 0.04, (z0 + z1) / 2); world.add(edge);
      for (let z = z0 + 1; z < z1; z += 6) {
        const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 1.6, 8), PM(0x2a2050)); post.position.set(x, top + 0.8, z); world.add(post);
        const lamp = new T.Mesh(new T.SphereGeometry(0.24, 14, 10), GM(0xffc86a, 1)); lamp.position.set(x, top + 1.7, z); world.add(lamp);
        const glow = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), new T.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.22, depthWrite: false })); glow.position.copy(lamp.position); world.add(glow);
      }
    });
  }
  return p;
}
function mushroomDisc(x, z, r, top, c) {
  const p = discPlat(x, z, r, top, c); if (p.mesh) p.mesh.visible = false;
  const g = new T.Group(); g.position.set(x, top, z); world.add(g);
  const cap = new T.Mesh(new T.CylinderGeometry(r, r * 0.92, 0.5, 32), GM(c, 0.35)); cap.position.y = -0.25; g.add(cap);
  const dome = new T.Mesh(new T.SphereGeometry(r, 32, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), GM(c, 0.35)); dome.scale.y = 0.45; dome.position.y = -0.5; g.add(dome);
  const top2 = new T.Mesh(new T.CircleGeometry(r * 0.98, 32), GM(c, 0.45)); top2.rotation.x = -Math.PI / 2; top2.position.y = 0.005; g.add(top2);
  const R = rng(Math.round(x * 13 + z * 7));
  for (let k = 0; k < 6; k++) { const a = R() * 6.28, d = R() * r * 0.7; const dot = new T.Mesh(new T.CircleGeometry(0.18 + R() * 0.16, 14), GM(0xffffff, 0.5)); dot.rotation.x = -Math.PI / 2; dot.position.set(Math.cos(a) * d, 0.012, Math.sin(a) * d); g.add(dot); }
  const stem = new T.Mesh(new T.CylinderGeometry(r * 0.28, r * 0.36, 9, 16), GM(0xf4e8d0, 0.25)); stem.position.y = -5; g.add(stem);
  return p;
}
const RACES = ['toboggan', 'marteaux', 'bonbon', 'nuit'];
/* ---- objets 3D Higgsfield (props) : remplacent les formes simples du décor ---- */
const PROP_HIDE = /^(CLD\d+_|ISL\d+_|ISN\d+_|BLP_|DEC_donut|DEC_spr\d|DEC_l(stick|pop|sw)\d|DEC_gum\d|ENV_pad\d|ENV_bear)/;
const PROP_FIX = { donut: [Math.PI / 2, 0, 0], sucette: [Math.PI / 2, 0, 0] };
const propCache = {};
function loadProp(name) {
  if (!propCache[name]) propCache[name] = new Promise(res => {
    if (!loader) return res(null);
    loader.load('props/' + name + '.glb', gl => {
      try {
        const inner = gl.scene, fx = PROP_FIX[name]; if (fx) inner.rotation.set(fx[0], fx[1], fx[2]);
        inner.traverse(o => { if (o.isMesh) { if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); const map = o.material && o.material.map; if (map) map.encoding = T.sRGBEncoding; o.material = new T.MeshLambertMaterial({ map: map || null, color: map ? 0xffffff : 0xff6fbf, emissive: map ? 0xffffff : 0x000000, emissiveMap: map || null, emissiveIntensity: 0.16 }); } });
        const wrap = new T.Group(); wrap.add(inner); wrap.updateMatrixWorld(true);
        const b = new T.Box3().setFromObject(wrap), c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3());
        inner.position.set(-c.x, -b.min.y, -c.z);
        const k = 1 / (s.y || 1); const norm = new T.Group(); norm.add(wrap); wrap.scale.setScalar(k); norm.userData.aspect = s.x / (s.y || 1);
        res(norm);
      } catch (e) { res(null); }
    }, undefined, () => res(null));
  });
  return propCache[name];
}
// pose un objet : base au sol en (x, y, z), hauteur h, tourné de ry (0 = face vers le joueur qui arrive)
function prop(name, x, y, z, h, ry, w) {
  w = w || world;
  return loadProp(name).then(p => { if (!p || world !== w) return null; const o = p.clone(); o.position.set(x, y, z); o.scale.setScalar(h); o.rotation.y = Math.PI + (ry || 0); w.add(o); return o; });
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function propIslands(z0, z1, seed, w, yb) {
  const R = rng(seed);
  for (let z = z0; z < z1; z += 13) for (const side of [-1, 1]) {
    if (R() < 0.18) continue;
    const o = prop('ile', side * (19 + R() * 12), yb != null ? yb - R() * 2 : -9 - R() * 7, z + R() * 6, 7 + R() * 5, R() * 6.28, w);
    o.then(m => { if (m) floaters.push({ o: m, by: m.position.y, amp: 0.35 + R() * 0.3, sp: 0.5 + R() * 0.4, ph: R() * 6 }); });
  }
}
function ringIslands(cx, cz, w) { const R = rng(7); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28 + R() * 0.2, d = 27 + R() * 12; prop('ile', cx + Math.cos(a) * d, -16 + R() * 12, cz + Math.sin(a) * d, 8 + R() * 5, R() * 6.28, w).then(m => { if (m) floaters.push({ o: m, by: m.position.y, amp: 0.4, sp: 0.5 + R() * 0.3, ph: R() * 6 }); }); } }
/* ---- décor vivant : jardins, spectateurs, ballons, montgolfières, canons à confettis ---- */
let floaters = [], crowd = [], cannons = [], parts = [], doneSeen = 0;
// jardin flottant hors piste (plus bas que la piste, on ne peut pas marcher dessus)
function garden(w, x, z, wd, dp, y) {
  const g = new T.Group(); g.position.set(x, y, z); w.add(g);
  const gd = (UNIV[UKEY] || UNIV.def).gd;
  const top = new T.Mesh(new T.CylinderGeometry(1, 1, 0.7, 28), LM(gd[0])); top.scale.set(wd / 2, 1, dp / 2); top.position.y = -0.35; g.add(top);
  const rim = new T.Mesh(new T.CylinderGeometry(1, 0.55, 2.6, 28), LM(gd[1])); rim.scale.set(wd / 2 * 0.97, 1, dp / 2 * 0.97); rim.position.y = -1.95; g.add(rim);
  const tip = new T.Mesh(new T.ConeGeometry(1, 2.2, 20), LM(gd[2])); tip.scale.set(wd / 2 * 0.53, 1, dp / 2 * 0.53); tip.rotation.x = Math.PI; tip.position.y = -4.35; g.add(tip);
  floaters.push({ o: g, by: y, amp: 0.12, sp: 0.6, ph: x + z });
  return g;
}
function onGarden(g, name, dx, dz, h, ry) { return loadProp(name).then(p => { if (!p) return; const o = p.clone(); o.position.set(dx, 0, dz); o.scale.setScalar(h); o.rotation.y = Math.PI + (ry || 0); g.add(o); return o; }); }
function balloons(w, x, y, z, s) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s || 1); w.add(g);
  const cols = [0xff4fa6, 0xffd23f, 0x8a4dff, 0x3fb4ff, 0xff9a2e, 0x7bff8a];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * 6.28, bx = Math.cos(a) * 0.55, bz = Math.sin(a) * 0.55, by = 2.6 + (i % 2) * 0.5;
    const b = new T.Mesh(new T.SphereGeometry(0.48, 16, 12), new T.MeshPhongMaterial({ color: new T.Color(cols[i]).convertSRGBToLinear(), shininess: 80, specular: 0x666666 }));
    b.scale.y = 1.18; b.position.set(bx, by, bz); g.add(b);
    const st = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, by - 0.45, 4), LM(0xffffff)); st.position.set(bx / 2, (by - 0.45) / 2, bz / 2); st.rotation.z = -bx * 0.3; st.rotation.x = bz * 0.3; g.add(st);
  }
  floaters.push({ o: g, by: y, amp: 0.15, sp: 1.6, ph: x * 0.3 + z, sway: 0.08 });
  return g;
}
function hotAir(w, x, y, z, h) { const R = rng(Math.round(x * 7 + z)); prop('montgolfiere', x, y, z, h, R() * 6, w).then(m => { if (m) floaters.push({ o: m, by: y, amp: 1.2, sp: 0.35, ph: R() * 6 }); }); }
function cloneLook(i) {
  return loadChar(i).then(l => {
    if (!l || !T.SkeletonUtils) return null;
    const ud = l.userData; l.userData = {};
    let c; try { c = T.SkeletonUtils.clone(l); } catch (e) { c = null; } finally { l.userData = ud; }
    if (!c) return null;
    if (ud.bones) { const b = {}; for (const n in ud.bones) { const o = c.getObjectByName(n); if (o) { o.quaternion.copy(ud.bones[n].q); b[n] = { o, q: ud.bones[n].q.clone() }; } } c.userData.bones = b; }
    c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(1);
    return c;
  });
}
// spectateurs : persos de la partie qui sautent et applaudissent au bord
function fans(g, spots, w) {
  const ids = (field && field.length ? field : runners).map(r => r.ci);
  spots.forEach(([dx, dz, ry], k) => {
    const ci = ids[(k * 5 + 3) % Math.max(1, ids.length)];
    if (ci == null) return;
    cloneLook(ci).then(c => { if (!c || world !== w) return; c.position.set(dx, 0, dz); c.rotation.y = ry; c.scale.setScalar(1.15); g.add(c); crowd.push({ o: c, ph: k * 1.7 }); });
  });
}
function cannon(g, dx, dz, ry) { onGarden(g, 'canon', dx, dz, 2.4, ry).then(o => { if (o) cannons.push(o); }); }
// confettis 3D
/* ---- emotes en course (bulle au-dessus du perso, vue aussi en ligne) ---- */
const emoTex = {};
function emoSprite(e) {
  if (!emoTex[e]) {
    let tex = null;
    try { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext && cv.getContext('2d'); if (x && x.fillText) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(64, 60, 56, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(50, 110); x.lineTo(64, 126); x.lineTo(78, 110); x.fill(); x.font = '76px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 64); tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; } } catch (er) { tex = null; }
    emoTex[e] = new T.SpriteMaterial({ map: tex, color: tex ? 0xffffff : 0xffd23f, depthTest: false, fog: false });
  }
  const s = new T.Sprite(emoTex[e]); s.renderOrder = 10; return s;
}
function showEmote(r, e) {
  if (!r || !r.mesh) return;
  if (r.emo) r.mesh.remove(r.emo.s);
  const s = emoSprite(e); s.position.y = 2.7; s.scale.setScalar(0.01); r.mesh.add(s); r.emo = { s, t: 0 };
  if (r === me) sfx('tap');
}
function myEmote(k) {
  const id = myEmotes[k], e = EMOTES.find(x => x.id === id); if (!e || !me) return;
  showEmote(me, e.e); show('emoWheel', false);
  if (NET.role === 'host') netSend({ t: 'emo', i: runners.indexOf(me), e: e.e }); else if (NET.role === 'guest') netSend({ t: 'emo', e: e.e });
}
function emoUpdate(dt) {
  for (const r of runners) {
    if (!r.emo) continue; const o = r.emo; o.t += dt;
    const k = o.t < 0.25 ? o.t / 0.25 * 1.25 : o.t < 0.4 ? 1.25 - (o.t - 0.25) / 0.15 * 0.25 : o.t > 2.2 ? Math.max(0, 1 - (o.t - 2.2) / 0.3) : 1;
    o.s.scale.setScalar(1.3 * k); o.s.position.y = 2.7 + Math.sin(o.t * 6) * 0.06;
    if (o.t > 2.5) { r.mesh.remove(o.s); r.emo = null; }
  }
}
/* ---- traînées derrière le perso ---- */
const trailPool = []; let trailT = 0;
function trailOf(r) { const id = r === me ? myTrail : (NET.role === 'host' && r.remote) ? NET.peerTrail : (NET.role === 'guest' && r === runners[0]) ? NET.hostTrail : null; return id && id !== 'none' ? TRAILS.find(t => t.id === id) : null; }
function trailUpdate(dt) {
  trailT -= dt;
  if (trailT <= 0 && (state === 'play' || state === 'count' || state === 'end')) {
    trailT = 0.03;
    for (const r of runners) {
      const t = trailOf(r); if (!t || r.out || !r.mesh.visible) continue;
      const lp = r._tp || (r._tp = r.pos.clone()), mv = Math.hypot(r.pos.x - lp.x, r.pos.z - lp.z) + Math.abs(r.pos.y - lp.y); lp.copy(r.pos);
      if (mv < 0.04) continue;
      let p = trailPool.find(q => q.life <= 0);
      if (!p) { if (trailPool.length > 140) continue; const m = new T.Mesh(new T.OctahedronGeometry(0.26, 0), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false })); p = { m, life: 0 }; trailPool.push(p); }
      if (p.m.parent !== world) world.add(p.m);
      p.m.material.color.setHex(t.c[(Math.random() * t.c.length) | 0]); p.life = 0.7; p.m.visible = true;
      p.m.position.set(r.pos.x + (Math.random() - 0.5) * 0.7, r.pos.y + 0.25 + Math.random() * 0.9, r.pos.z + (Math.random() - 0.5) * 0.7);
    }
  }
  for (const p of trailPool) { if (p.life <= 0) continue; p.life -= dt; p.m.material.opacity = Math.max(0, p.life / 0.7); p.m.scale.setScalar(0.4 + p.life); p.m.rotation.y += dt * 4; p.m.position.y += dt * 0.4; if (p.life <= 0) p.m.visible = false; }
}
function burst(x, y, z, n) {
  const cols = [0xffd23f, 0xff4fa6, 0x5fd6ff, 0x7bff8a, 0xb06cff, 0xffffff];
  for (let i = 0; i < n; i++) {
    let p = parts.find(q => q.life <= 0);
    if (!p) { if (parts.length > 220) break; const m = new T.Mesh(new T.PlaneGeometry(0.22, 0.14), new T.MeshBasicMaterial({ color: cols[parts.length % cols.length], side: T.DoubleSide })); world.add(m); p = { m, v: new T.Vector3(), life: 0 }; parts.push(p); }
    if (p.m.parent !== world) world.add(p.m);
    p.m.visible = true; p.m.position.set(x, y, z); p.life = 2.2 + Math.random();
    p.v.set((Math.random() - 0.5) * 7, 9 + Math.random() * 7, (Math.random() - 0.5) * 7); p.rs = (Math.random() - 0.5) * 12;
  }
}
let playAcc = 0;
function livingUpdate(dt) {
  emoUpdate(dt); trailUpdate(dt);
  if (state === 'play') { playAcc += dt; if (playAcc >= 10) { addPlay(Math.round(playAcc)); playAcc = 0; } }
  for (const f of floaters) { if (!f.o.parent) continue; f.o.position.y = f.by + Math.sin(time * f.sp + f.ph) * f.amp; if (f.sway) f.o.rotation.z = Math.sin(time * f.sp * 0.8 + f.ph) * f.sway; if (f.spin) f.o.rotation.y += f.spin * dt; }
  for (const c of crowd) { if (!c.o.parent) continue; c.o.position.y = Math.abs(Math.sin(time * 5.5 + c.ph)) * 0.45; animLook(c.o, time * 11 + c.ph, 1.0); }
  for (const p of parts) { if (p.life <= 0) continue; p.life -= dt; p.v.y -= 14 * dt; p.v.multiplyScalar(1 - 0.9 * dt); p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.rs * dt; p.m.rotation.y += p.rs * 0.7 * dt; if (p.life <= 0) p.m.visible = false; }
  // un joueur passe l'arrivée -> les canons tirent
  if (field && (state === 'play' || state === 'end' || state === 'result')) {
    const d = field.reduce((a, r) => a + (r.done ? 1 : 0), 0);
    if (d > doneSeen) { doneSeen = d; for (const c of cannons) { const v = new T.Vector3(); c.getWorldPosition(v); burst(v.x, v.y + 2.2, v.z, 26); } }
  }
}
function finishDeco(w, fz, y, half) {
  const L = garden(w, -(half + 6), fz - 2, 8, 12, y - 1.6), Rg = garden(w, half + 6, fz - 2, 8, 12, y - 1.6);
  fans(L, [[1.2, -4, Math.PI / 2], [2.6, -1.5, Math.PI / 2], [1.2, 1, Math.PI / 2], [2.6, 3.5, Math.PI / 2]], w);
  fans(Rg, [[-1.2, -4, -Math.PI / 2], [-2.6, -1.5, -Math.PI / 2], [-1.2, 1, -Math.PI / 2], [-2.6, 3.5, -Math.PI / 2]], w);
  cannon(L, 1.5, 5.2, -Math.PI / 2 + 0.3); cannon(Rg, -1.5, 5.2, Math.PI / 2 - 0.3);
  onGarden(L, 'arbre', -2.2, -3, 5.5, 0.4); onGarden(Rg, 'palmier', 2.2, -3, 5.8, -0.4);
  balloons(w, -(half + 2.3), y, fz - 1, 1.1); balloons(w, half + 2.3, y, fz - 1, 1.1);
}
function startDeco(w, az, half) { balloons(w, -(half + 2.4), 0, az, 1.1); balloons(w, half + 2.4, 0, az, 1.1); }
// jardins décorés le long du parcours
function sideGardens(w, list, half) {
  const items = (UNIV[UKEY] || UNIV.def).items, hOf = n => n === 'cadeau' ? 1.8 : n === 'champignon' ? 3.4 : n === 'cupcake' ? 2.4 : n === 'tour' ? 6.2 : n === 'sucette' ? 6.5 : 5.6;
  const R = rng(half * 13 + list.length);
  list.forEach(([side, z], i) => {
    const g = garden(w, side * (half + 6.5), z, 8, 9, -2.4 - R() * 1.2);
    const a = items[i % items.length], b = items[(i + 3) % items.length];
    onGarden(g, a, side * -0.8, -1.6, hOf(a), R() * 6);
    onGarden(g, b, side * 1.6, 2.0, hOf(b) * 0.9, R() * 6);
    if (i % 2) onGarden(g, 'cadeau', side * -2.2, 2.6, 1.5, R() * 6);
  });
}
const MAP_PROPS = {
  nuit(w) {
    startDeco(w, 11, 6); finishDeco(w, 156, 0, 6);
    sideGardens(w, [[-1, 20], [1, 30], [-1, 50], [1, 46], [-1, 76], [1, 86], [-1, 112], [1, 124], [-1, 140]], 6);
    [[-1, 60, 9], [1, 100, 11], [-1, 130, 10], [1, 20, 8]].forEach(([sd, z, h], i) => prop('champignon', sd * (24 + i * 3), -12, z, h, i, w));
  },
  toboggan(w) {
    propIslands(-12, 210, 11, w, -19.5); prop('dirigeable', -30, 18, 70, 7, -0.6, w);
    startDeco(w, 11, 6); finishDeco(w, 185, 0, 6);
    sideGardens(w, [[-1, 22], [1, 34], [-1, 78], [1, 90], [-1, 120], [1, 128], [-1, 150], [1, 162]], 6);
    hotAir(w, -26, 14, 40, 7); hotAir(w, 28, 18, 110, 8); hotAir(w, -24, 20, 160, 7);
  },
  marteaux(w) {
    propIslands(-10, 170, 21, w); prop('dirigeable', -28, 18, 60, 7, -0.6, w);
    [[-1, 30, 16], [1, 55, 20], [-1, 95, 18], [1, 130, 22], [-1, 160, 17]].forEach(([sd, z, h]) => prop('tour', sd * (32 + h * 0.4), -14, z, h, sd * 0.4, w));
    startDeco(w, 11, 6); finishDeco(w, 150, 0, 6);
    sideGardens(w, [[-1, 18], [1, 24], [-1, 60], [1, 72], [-1, 132], [1, 140]], 6);
    hotAir(w, 26, 16, 50, 7); hotAir(w, -27, 19, 115, 8);
  },
  bonbon(w) {
    propIslands(-10, 165, 31, w); prop('dirigeable', -26, 18, 40, 7, -0.6, w);
    startDeco(w, 11, 6); finishDeco(w, 150, 0, 6);
    [[-7.6, 56.5, -0.5], [7.6, 58.5, 0.5]].forEach(([x, z, r]) => prop('ourson', x, 0, z, 3.2, r, w));
    prop('donut', 11, 0.4, 92, 8.4, -0.35, w);
    [[-1, 4], [1, 30], [-1, 46], [1, 76], [-1, 108], [1, 126]].forEach(([s, z], i) => { const g = garden(w, s * 12, z, 7, 7, -2.6); onGarden(g, 'sucette', 0, 0, 6.5 + (i % 3), s * 0.5); onGarden(g, 'cupcake', s * -1.8, 2.2, 2.2, i); });
    [[1, 20], [-1, 85], [1, 140]].forEach(([s, z]) => { const g = garden(w, s * 12.5, z, 7, 7, -2.8); onGarden(g, 'arbre', 0, 0, 5.5, z); onGarden(g, 'cadeau', s * -1.8, 2, 1.6, z); });
    hotAir(w, 27, 15, 60, 7); hotAir(w, -28, 19, 120, 8);
  },
  hexa(w) {
    [[-70, 18, 90, 34, 0.12], [80, -4, -40, 22, -0.1], [-55, 30, -70, 12, 0.3], [60, 26, 70, 9, 0.2]].forEach(([x, y, z, h, sp], i) => prop('planete', x, y, z, h, 2.6 + i, w).then(m => {
      if (!m) return; floaters.push({ o: m, by: y, amp: 0.6, sp: 0.2, ph: i, spin: sp });
      if (i % 2 === 0) { const ring = new T.Mesh(new T.TorusGeometry(0.62, 0.05, 8, 48), new T.MeshLambertMaterial({ color: new T.Color(0xb36bff).convertSRGBToLinear(), emissive: 0x3a1060 })); ring.position.y = 0.5; ring.rotation.x = Math.PI / 2 - 0.35; m.add(ring); }
    }));
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * 6.28 + 0.785 * 0 + 0.4, x = Math.cos(a) * 21, z = 10 + Math.sin(a) * 21, face = Math.atan2(-Math.cos(a), -Math.sin(a));
      const g = garden(w, x, z, 7, 7, -1.2);
      const ca = Math.cos(face), sa = Math.sin(face);
      fans(g, [[-1.5 * ca, 1.5 * sa, face], [1.5 * ca, -1.5 * sa, face]], w);
      onGarden(g, 'champignon', -2 * Math.sin(a), 0, 3.4, k);
      if (k % 2 === 0) cannon(g, 2 * Math.cos(a), 2 * Math.sin(a), face);
    }
  },
  couronne(w) {
    propIslands(-10, 175, 41, w); prop('dirigeable', 22, 20, 70, 7, 2.4, w);
    startDeco(w, 7, 6);
    const L = garden(w, -12, 154, 8, 12, 6.2), Rg = garden(w, 12, 154, 8, 12, 6.2);
    fans(L, [[1.5, -3, Math.PI / 2], [2.4, 0, Math.PI / 2], [1.5, 3, Math.PI / 2]], w);
    fans(Rg, [[-1.5, -3, -Math.PI / 2], [-2.4, 0, -Math.PI / 2], [-1.5, 3, -Math.PI / 2]], w);
    cannon(L, 1.5, 5, -Math.PI / 2 + 0.3); cannon(Rg, -1.5, 5, Math.PI / 2 - 0.3);
    onGarden(L, 'arbre', -2.4, -3, 5.5, 0); onGarden(Rg, 'palmier', 2.4, -3, 5.8, 0);
    sideGardens(w, [[-1, 20], [1, 44], [-1, 62], [1, 76]], 6);
    hotAir(w, -26, 18, 45, 8); hotAir(w, 28, 22, 100, 7);
  }
};
/* décor propre à chaque univers (immédiat, sans chargement) */
let seaMat = null;
const UDECO = {
  toboggan(w) { // mer turquoise sous la piste
    if (!seaMat) seaMat = new T.MeshPhongMaterial({ color: new T.Color(0x14c4d4).convertSRGBToLinear(), emissive: new T.Color(0x0a5a7a).convertSRGBToLinear(), shininess: 120, specular: 0xffffff });
    const sea = new T.Mesh(new T.PlaneGeometry(900, 900), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -15, 90); w.add(sea);
    const foam = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    const R = rng(3);
    for (let i = 0; i < 40; i++) { const r = new T.Mesh(new T.RingGeometry(1.6, 2.1, 24), foam); r.rotation.x = -Math.PI / 2; const s = 2 + R() * 5; r.scale.setScalar(s); r.position.set((R() < 0.5 ? -1 : 1) * (16 + R() * 70), -14.95, -30 + R() * 260); w.add(r); }
  },
  hexa(w) { // espace : étoiles, planètes, astéroïdes
    const n = 700, pos = new Float32Array(n * 3), R = rng(9);
    for (let i = 0; i < n; i++) { const a = R() * 6.283, b = Math.acos(R() * 1.6 - 0.6), r = 240; pos[i * 3] = Math.sin(b) * Math.cos(a) * r; pos[i * 3 + 1] = Math.cos(b) * r; pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r + 10; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    w.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: true, fog: false })));
    for (let i = 0; i < 12; i++) { const m = meteorMesh(); m.remove(m.children[0]); const a = i / 12 * 6.28 + R() * 0.3, d = 30 + R() * 25; m.position.set(Math.cos(a) * d, -6 + R() * 18, 10 + Math.sin(a) * d); m.scale.setScalar(1.5 + R() * 3); m.rotation.set(R() * 6, R() * 6, 0); w.add(m); floaters.push({ o: m, by: m.position.y, amp: 0.8, sp: 0.3 + R() * 0.3, ph: R() * 6, spin: (R() - 0.5) * 0.6 }); }
  },
  nuit(w) { // grande lune, étoiles, lac sombre, lucioles
    const n = 600, pos = new Float32Array(n * 3), R = rng(21);
    for (let i = 0; i < n; i++) { const a = R() * 6.283, b = Math.acos(R() * 0.95), r = 250; pos[i * 3] = Math.sin(b) * Math.cos(a) * r; pos[i * 3 + 1] = Math.cos(b) * r; pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r + 80; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); w.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.5, fog: false })));
    const moon = new T.Mesh(new T.SphereGeometry(16, 32, 20), new T.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); moon.position.set(-70, 75, 230); w.add(moon);
    [26, 38].forEach((r, i) => { const h = new T.Mesh(new T.SphereGeometry(r, 24, 16), new T.MeshBasicMaterial({ color: 0xbfd0ff, transparent: true, opacity: i ? 0.07 : 0.14, fog: false, depthWrite: false })); h.position.copy(moon.position); w.add(h); });
    const lake = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshPhongMaterial({ color: new T.Color(0x0d1440).convertSRGBToLinear(), emissive: new T.Color(0x0a1030).convertSRGBToLinear(), shininess: 140, specular: 0x8fa8ff })); lake.rotation.x = -Math.PI / 2; lake.position.set(0, -16, 90); w.add(lake);
    const fn = 160, fp = new Float32Array(fn * 3);
    for (let i = 0; i < fn; i++) { fp[i * 3] = (R() < 0.5 ? -1 : 1) * (5 + R() * 22); fp[i * 3 + 1] = -3 + R() * 9; fp[i * 3 + 2] = -10 + R() * 180; }
    const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.BufferAttribute(fp, 3));
    const ff = new T.Points(fg, new T.PointsMaterial({ color: 0xd8ff6a, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false })); w.add(ff);
    floaters.push({ o: ff, by: 0, amp: 0.6, sp: 0.7, ph: 0, sway: 0.01 });
  },
  couronne(w) { // pièces d'or géantes qui tournent dans le ciel
    const R = rng(4);
    for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1; prop('piece', side * (18 + R() * 16), 4 + R() * 18, -5 + i * 12, 4 + R() * 4, 0, w).then(m => { if (m) floaters.push({ o: m, by: m.position.y, amp: 0.8, sp: 0.6, ph: i, spin: 0.9 + R() }); }); }
  }
};
/* ---- sols par univers : vraie matière (bois, pierre, chocolat, marbre) au lieu des tapis rayés ---- */
const FLOOR_MARK = /^(ENV_\w+?_(s|st|lane)\d+|ENV_\w*ch\d*_|ENV_start_(ck)?\d|ENV_\w+_h\d+_|ENV_disc\d+_(ray|star|top)|ENV_disctop|ENV_star\d|ENV_hxt|ENV_towertop|ENV_circ|DEC_chev|ENV_bridge_s)/;
const FLOOR_KEEP = /(bear|cane|jelly|wave|falls|hoop|tray|tunnel|pad|fin_ck|rim|pil|ring|pban|px)/;
const floorTex = {};
function floorMat(kind) {
  if (floorTex[kind]) return floorTex[kind];
  let map = null;
  try {
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext && cv.getContext('2d');
    if (x && x.fillRect) {
      const R = rng(kind.length * 31 + 7), sh = (c, k) => { const v = parseInt(c.slice(1), 16), f = q => Math.max(0, Math.min(255, Math.round(q * k))); return 'rgb(' + f(v >> 16) + ',' + f((v >> 8) & 255) + ',' + f(v & 255) + ')'; };
      if (kind === 'bois') { // ponton : planches dans le sens de la course, joints sombres, clous
        const cols = ['#f2c27e', '#e8b36c', '#f6cf92', '#e0a862'];
        for (let i = 0; i < 4; i++) {
          const x0 = i * 128; x.fillStyle = cols[i]; x.fillRect(x0, 0, 128, N);
          for (let k = 0; k < 14; k++) { x.strokeStyle = sh(cols[i], 0.86 + R() * 0.08); x.lineWidth = 2 + R() * 3; x.beginPath(); const yy = R() * N; x.moveTo(x0 + 6, yy); x.bezierCurveTo(x0 + 40, yy + 10 * (R() - 0.5) + 30, x0 + 80, yy - 30, x0 + 122, yy + (R() - 0.5) * 20); x.stroke(); }
          const cut = (R() * N) | 0; x.fillStyle = '#8a5a2a'; x.fillRect(x0, cut, 128, 5);
          x.fillStyle = '#6a4220'; [cut - 14, cut + 18].forEach(yy => { x.beginPath(); x.arc(x0 + 22, (yy + N) % N, 4, 0, 6.3); x.arc(x0 + 106, (yy + N) % N, 4, 0, 6.3); x.fill(); });
          x.fillStyle = '#7a4c22'; x.fillRect(x0, 0, 6, N); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(x0 + 6, 0, 4, N);
        }
      } else if (kind === 'pierre') { // dalles de château, joints foncés
        x.fillStyle = '#5a4a62'; x.fillRect(0, 0, N, N);
        const pal = ['#d9c7a8', '#c9b48f', '#e3d3b6', '#b9b3c4', '#cfc0a2'];
        for (let row = 0; row < 4; row++) { let cx = row % 2 ? -64 : 0; while (cx < N) { const w = 96 + ((R() * 3) | 0) * 32, c = pal[(R() * pal.length) | 0]; x.fillStyle = c; x.beginPath(); x.roundRect ? x.roundRect(cx + 5, row * 128 + 5, w - 10, 118, 14) : x.rect(cx + 5, row * 128 + 5, w - 10, 118); x.fill(); x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(cx + 12, row * 128 + 10, w - 24, 6); x.fillStyle = 'rgba(60,40,60,.12)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(cx + 10 + R() * (w - 20), row * 128 + 14 + R() * 100, 3 + R() * 8, 0, 6.3); x.fill(); } cx += w; } }
      } else if (kind === 'chocolat') { // tablette de chocolat
        x.fillStyle = '#5a2a12'; x.fillRect(0, 0, N, N);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const px = i * 128, py = j * 128; x.fillStyle = '#7a3a18'; x.fillRect(px + 8, py + 8, 112, 112); x.fillStyle = '#9a5228'; x.fillRect(px + 8, py + 8, 112, 10); x.fillRect(px + 8, py + 8, 10, 112); x.fillStyle = '#4a200c'; x.fillRect(px + 8, py + 110, 112, 10); x.fillRect(px + 110, py + 8, 10, 112); x.fillStyle = '#8a4520'; x.fillRect(px + 26, py + 26, 76, 76); }
      } else if (kind === 'nuit') { // dalles bleu nuit, joints de mousse lumineuse
        x.fillStyle = '#1f6f96'; x.fillRect(0, 0, N, N);
        const pal = ['#33377a', '#2c3070', '#3a3f88', '#2a2c66'];
        for (let row = 0; row < 4; row++) { let cx = row % 2 ? -64 : 0; while (cx < N) { const w = 128, c = pal[(R() * pal.length) | 0]; x.fillStyle = c; x.fillRect(cx + 4, row * 128 + 4, w - 8, 120); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(cx + 10, row * 128 + 10, w - 20, 6); x.fillStyle = 'rgba(140,255,200,.18)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(cx + 10 + R() * (w - 20), row * 128 + 14 + R() * 100, 2 + R() * 5, 0, 6.3); x.fill(); } cx += w; } }
      } else { // marbre blanc et or
        x.fillStyle = '#fff6e6'; x.fillRect(0, 0, N, N);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#fff1d6' : '#fffaf0'; x.fillRect(i * 256, j * 256, 256, 256); }
        x.strokeStyle = 'rgba(170,150,190,.35)'; for (let k = 0; k < 16; k++) { x.lineWidth = 1 + R() * 2; x.beginPath(); let px = R() * N, py = R() * N; x.moveTo(px, py); for (let q = 0; q < 5; q++) { px += (R() - 0.5) * 90; py += (R() - 0.5) * 90; x.lineTo(px, py); } x.stroke(); }
        x.fillStyle = '#e8a910'; x.fillRect(0, 0, N, 10); x.fillRect(0, 251, N, 10); x.fillRect(0, 0, 10, N); x.fillRect(251, 0, 10, N);
        x.fillStyle = '#ffd23f'; x.fillRect(0, 2, N, 4); x.fillRect(0, 253, N, 4); x.fillRect(2, 0, 4, N); x.fillRect(253, 0, 4, N);
        x.fillStyle = '#ffc21a'; [[128, 128], [384, 384], [128, 384], [384, 128]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b - 26); x.lineTo(a + 26, b); x.lineTo(a, b + 26); x.lineTo(a - 26, b); x.closePath(); x.fill(); });
      }
      map = new T.CanvasTexture(cv); map.encoding = T.sRGBEncoding; map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
    }
  } catch (e) { map = null; }
  const base = { bois: 0xf0c080, pierre: 0xd0c0a0, chocolat: 0x7a3a18, marbre: 0xfff4e0, nuit: 0x33377a }[kind];
  floorTex[kind] = new T.MeshPhongMaterial({ color: map ? 0xffffff : new T.Color(base).convertSRGBToLinear(), map, emissive: kind === 'nuit' ? 0x23233a : 0x000000, emissiveMap: kind === 'nuit' ? map : null, shininess: kind === 'marbre' ? 90 : kind === 'chocolat' ? 60 : 12, specular: kind === 'marbre' || kind === 'chocolat' ? 0x555555 : 0x111111 });
  return floorTex[kind];
}
// coordonnées de texture d'après la position (projection selon la face) : 1 motif = 6 m
function worldUV(geo, sz) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / sz; uv[i * 2 + 1] = v / sz;
  }
  geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
}
const mapGlb = {};
function loadMapGlb(url, hide, floor) {
  if (mapGlb[url]) return mapGlb[url];
  mapGlb[url] = new Promise(res => {
    if (!loader) return res(null);
    loader.load(url, g => {
      try {
        const root = g.scene; root.updateMatrixWorld(true);
        const groups = new Map();
        root.traverse(o => {
          if (!o.isMesh || /^OBS_/.test(o.name) || (o.parent && /^OBS_/.test(o.parent.name)) || PROP_HIDE.test(o.name) || (hide && hide.test(o.name))) return;
          if (floor && FLOOR_MARK.test(o.name)) return; // marquages au sol retirés
          let geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld);
          for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
          if (!geo.attributes.normal) geo.computeVertexNormals();
          if (geo.index) geo = geo.toNonIndexed();
          const m = Array.isArray(o.material) ? o.material[0] : o.material;
          const key = floor && /^ENV_/.test(o.name) && !FLOOR_KEEP.test(o.name) ? 'floor' : m.uuid; if (!groups.has(key)) groups.set(key, { m, list: [], floor: key === 'floor' }); groups.get(key).list.push(geo);
        });
        const out = new T.Group();
        groups.forEach(({ m, list, floor: fl }) => {
          if (fl) { const g2 = T.BufferGeometryUtils.mergeBufferGeometries(list, false); worldUV(g2, 6); out.add(new T.Mesh(g2, floorMat(floor))); return; }
          const merged = T.BufferGeometryUtils ? T.BufferGeometryUtils.mergeBufferGeometries(list, false) : null;
          const wc = m.color ? warmColor(m.color.clone().convertLinearToSRGB()).convertSRGBToLinear() : new T.Color(0xffffff);
          const mat = new T.MeshPhongMaterial({ color: wc, emissive: m.emissive ? m.emissive.clone() : 0x000000, side: m.side, shininess: 45, specular: 0x332222 });
          if (merged) out.add(new T.Mesh(merged, mat)); else list.forEach(gg => out.add(new T.Mesh(gg, mat)));
        });
        res(out);
      } catch (e) { res(null); }
    }, undefined, () => res(null));
  });
  return mapGlb[url];
}
function buildMap(M) {
  const key = Object.keys(MAPS).find(k => MAPS[k] === M);
  clearWorld(); applyUniverse(key); rollPrep(M.roll); VIS = !M.glb; M.build(); VIS = true;
  if (UDECO[key]) UDECO[key](world);
  if (!M.glb && MAP_PROPS[key]) MAP_PROPS[key](world);
  if (M.glb) {
    const w = world;
    loadMapGlb(M.glb, M.hide, M.floor).then(g => {
      if (world !== w) return;
      if (g) { w.add(g); if (MAP_PROPS[key]) MAP_PROPS[key](w); }
      else { for (const p of plats) if (p.mesh) p.mesh.visible = true; }
    });
  }
}

/* ---------- Joueurs ---------- */
const runners = [];
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext && c.getContext('2d'); if (x && x.createRadialGradient) { const gr = x.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(40,20,80,0.55)'); gr.addColorStop(1, 'rgba(40,20,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); } try { return new T.CanvasTexture(c); } catch (e) { return null; } })();
const shadowMat = new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
function mkRunner(ci, bot) {
  const g = new T.Group(), inner = new T.Group(); g.add(inner); scene.add(g);
  const sh = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), shadowMat); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1; scene.add(sh); g.userData.shadow = sh;
  const fist = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), LM(0xffd23f)); fist.position.set(0, 0.75, 0.75); fist.visible = false; g.add(fist);
  let arrow = null;
  const r = { ci, bot, mesh: g, inner, fist, arrow, look: null, pos: new T.Vector3(), vel: new T.Vector3(), grounded: true, gp: null, stun: 0, dive: 0, inv: 0, punch: 0, pcd: 0, cpi: 0, done: false, out: false, skill: 1, react: 0.6, tx: 0, tt: 0, yaw: 0, ph: Math.random() * 6, goal: null, name: CHARS[ci][0] };
  return r;
}
function attachLook(r) {
  const l = looks[r.ci] || bean(CHARS[r.ci][2]);
  if (!looks[r.ci]) looks[r.ci] = l;
  r.look = l; r.inner.add(l); l.position.set(0, 0, 0); l.rotation.set(0, 0, 0);
}
function groundAt(x, z, y) {
  let best = null;
  for (const p of plats) {
    if (!p.alive || p.top > y + 0.35) continue;
    if (p.hex) { const dx = x - p.cx, dz = z - p.cz; if (dx * dx + dz * dz > p.rad * p.rad) continue; }
    else if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    if (!best || p.top > best.top) best = p;
  }
  return best;
}
function barHit(s, x, z) {
  const dx = Math.cos(s.a), dz = -Math.sin(s.a), pz = z - s.z, px = x - (s.cx || 0);
  let t = px * dx + pz * dz; t = Math.max(-s.L, Math.min(s.L, t));
  return { d: Math.hypot(px - dx * t, pz - dz * t), t, dx, dz };
}
function respawn(r) {
  const c = cps[Math.min(r.cpi, cps.length - 1)] || { z: 0, x0: -2, x1: 2, y: 0 };
  const x = c.xs ? c.xs[(Math.random() * c.xs.length) | 0] : c.x0 + Math.random() * (c.x1 - c.x0);
  r.fallT = null; r.pos.set(x, c.y + 2.5, c.z + 1.2); r.vel.set(0, 0, 0); r.stun = 0; r.dive = 0; r.inv = 1; r.yaw = 0; r.gp = null;
}
const PUNCH_PRICE = 1000;
let hasPunch = store.get('punch', false);
function doPunch(r) {
  if (!r.canPunch || r.pcd > 0 || r.stun > 0 || r.out) return;
  r.pcd = 8; r.punch = 0.3;
  const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
  for (const o of runners) {
    if (o === r || o.out || o.done) continue;
    const dx = o.pos.x - r.pos.x, dz = o.pos.z - r.pos.z, d = Math.hypot(dx, dz);
    if (d > 1.9 || d < 0.01 || Math.abs(o.pos.y - r.pos.y) > 1.2) continue;
    if ((dx * fx + dz * fz) / d < 0.45) continue;
    o.vel.set(dx / d * 11, 5, dz / d * 11); o.stun = 0.75; o.grounded = false; o.inv = 0.3;
    if (o.remote && NET.role === 'host') netSend({ t: 'kb', vx: Math.round(dx / d * 1100) / 100, vy: 5, vz: Math.round(dz / d * 1100) / 100 });
  }
}

/* ---------- IA ---------- */
function hexAlive(p) { let n = 0; for (const q of hexes) if (q.alive && q.t < 0 && q.top === p.top && Math.abs(q.cx - p.cx) < 4 && Math.abs(q.cz - p.cz) < 4) n++; return n; }
function botInput(r, dt) {
  const inp = { x: 0, z: 1, jump: false, dive: false, punch: false };
  if (r.done || r.out) { inp.z = 0; return inp; }
  r.tt -= dt;
  const z = r.pos.z;
  if (MAP.type === 'survival') {
    const layerTop = r.gp ? r.gp.top : r.pos.y;
    const dGoal = r.goal ? Math.hypot(r.goal.cx - r.pos.x, r.goal.cz - z) : 0;
    if (!r.goal || !r.goal.alive || r.goal.t >= 0 || dGoal < 0.5 || r.tt < 0 || Math.abs(r.goal.top - layerTop) > 0.5) {
      const c = hexes.filter(p => p.alive && p.t < 0 && Math.abs(p.top - layerTop) < 0.5);
      const near = c.filter(p => { const d = Math.hypot(p.cx - r.pos.x, p.cz - z); return d > 2 && d < 6; });
      near.sort((a, b) => (hexAlive(b) - hexAlive(a))); near.length = Math.min(near.length, 6);
      const pool = near.length ? near : c;
      r.goal = pool.length ? pool[(Math.random() * pool.length) | 0] : null; r.tt = 1.2 + Math.random() * 1.5;
    }
    if (r.goal) {
      const dx = r.goal.cx - r.pos.x, dz = r.goal.cz - z, d = Math.hypot(dx, dz) || 1;
      inp.x = dx / d; inp.z = dz / d;
      if (r.grounded && !groundAt(r.pos.x + inp.x * 1.1, z + inp.z * 1.1, r.pos.y) && groundAt(r.pos.x + inp.x * 3, z + inp.z * 3, r.pos.y) && Math.random() < 0.5 + r.react * 0.5) inp.jump = true;
    } else inp.z = 0;
  } else {
    let tx = MAP.botX ? MAP.botX(r) : wander(r, -4, 4);
    if (MAP.roll && MAP.roll !== 'meteorite' && r.react > 0.45) for (const b of balls) { const bz = b.m.position.z, bx = b.m.position.x; if (bz > z && bz - z < 8 && Math.abs(b.m.position.y - r.pos.y - 1) < 1.5 && Math.abs(bx - tx) < 2.4) { tx = clamp(bx + (bx > 0 ? -3 : 3), -4.6, 4.6); break; } }
    r.tx = tx;
    inp.x = clamp((tx - r.pos.x) * 0.7, -1, 1);
    if (r.grounded) {
      const noJ = MAP.noJump && MAP.noJump(z);
      if (!noJ && !groundAt(r.pos.x + r.vel.x * 0.2, z + 1.4, r.pos.y) && !groundAt(r.pos.x, z + 0.9, r.pos.y)) inp.jump = true;
      const up = groundAt(r.pos.x, z + 1.3, r.pos.y + 1.6); if (up && up.top > r.pos.y + 0.3) inp.jump = true;
      for (const s of sweepers) if (Math.abs(z - s.z) < 4 && Math.abs(r.pos.y - s.y) < 1 && barHit(s, r.pos.x, z).d < 2.2 && Math.random() < r.react * dt * 10) inp.jump = true;
    }
    for (const b of blocks) if (b.hammer && b.z - z > 0 && b.z - z < 3.2 && Math.abs(b.x - r.pos.x) < 1.4 && r.react > 0.4) inp.z = 0.08;
  }
  if (r.canPunch && r.pcd <= 0) for (const o of runners) {
    if (o === r || o.out || o.done) continue;
    const dx = o.pos.x - r.pos.x, dz = o.pos.z - z, d = Math.hypot(dx, dz);
    if (d < 1.6 && Math.abs(o.pos.y - r.pos.y) < 1 && (dx * Math.sin(r.yaw) + dz * Math.cos(r.yaw)) / (d || 1) > 0.5 && Math.random() < r.react * dt * 3) { inp.punch = true; break; }
  }
  return inp;
}

/* ---------- Physique ---------- */
let outList = [], survivors = [], state = 'lobby', MAP = null, mapKey = '', clock = 0, count = 0, qual = [], endT = 0, roundIdx = 0, tour = false, field = [], target = 8, winner = null, time = 0;
function blockHit(b, r) {
  b.hitT = 0.45;
  if (r === me) { buzz(35); sfx('punch'); }
}
function step(r, inp, dt) {
  if (r.out) return;
  if (inp.punch) doPunch(r);
  if (r.gp && r.gp.mov && r.grounded) r.pos.x += r.gp.vx * dt;
  const sp = (MAP.type === 'survival' ? 4.3 : 6.4) * r.skill;
  let c = r.stun > 0 ? 0.08 : (r.grounded ? 1 : 0.55); if (r.dive > 0) c = 0.05;
  const k = Math.min(1, 12 * c * dt);
  r.vel.x += (inp.x * sp - r.vel.x) * k; r.vel.z += (inp.z * sp - r.vel.z) * k;
  if (inp.jump && r.grounded && r.stun <= 0) { r.vel.y = 8.6; r.grounded = false; }
  if (inp.dive && r.dive <= 0 && r.stun <= 0) {
    // astuce : plonger en plein saut relance vers le haut et plus loin (permet de passer par-dessus un cube)
    const air = !r.grounded, hv = air ? 12.5 : 11;
    r.vel.x = Math.sin(r.yaw) * hv; r.vel.z = Math.cos(r.yaw) * hv; r.vel.y = air ? Math.max(r.vel.y, 0) + 4.2 : 4.5; r.grounded = false; r.dive = 0.75;
  }
  r.vel.y -= 24 * dt;
  r.pos.addScaledVector(r.vel, dt);
  const g = groundAt(r.pos.x, r.pos.z, r.pos.y);
  if (g && r.vel.y <= 0 && r.pos.y <= g.top + 0.02 && r.pos.y >= g.top - 0.8) {
    r.pos.y = g.top; r.gp = g;
    if (g.kind === 'pad') { r.vel.y = 16.5; r.grounded = false; g.squash = 1; } else { r.vel.y = 0; r.grounded = true; }
    if (g.hex && !g.disc && g.t < 0) g.t = 1.5;
  } else r.grounded = false;
  if (r.gp && r.gp.rail && r.pos.y > r.gp.top - 0.5 && r.pos.z >= r.gp.z0 - 0.5 && r.pos.z <= r.gp.z1 + 0.5) r.pos.x = clamp(r.pos.x, r.gp.x0 + 0.45, r.gp.x1 - 0.45);
  if (r.grounded) for (let i = r.cpi + 1; i < cps.length; i++) if (r.pos.z >= cps[i].z && r.pos.y >= cps[i].y - 0.3) r.cpi = i;
  if (r.inv <= 0) {
    for (const s of sweepers) {
      if (Math.abs(r.pos.z - s.z) > s.L + 0.7 || Math.abs(r.pos.y - s.y) > 1.6) continue;
      const h = barHit(s, r.pos.x, r.pos.z);
      if (h.d < 0.8 && r.pos.y - s.y < 1.15 && r.pos.y - s.y > -0.6) { const sg = Math.sign(h.t * s.w) || 1; r.vel.set(h.dz * sg * 10, 5, -h.dx * sg * 10); r.stun = 0.7; r.inv = 0.4; r.grounded = false; }
      const scx = s.cx || 0, pd = Math.hypot(r.pos.x - scx, r.pos.z - s.z);
      if (pd < 1 && pd > 0.001 && r.pos.y - s.y < 1.7) { r.pos.x = scx + (r.pos.x - scx) / pd; r.pos.z = s.z + (r.pos.z - s.z) / pd; }
    }
    for (const b of balls) {
      const p = b.m.position, dx = r.pos.x - p.x, dy = r.pos.y + 0.7 - p.y, dz = r.pos.z - p.z, d = Math.hypot(dx, dy, dz);
      if (d < 1.5 && d > 0) { r.vel.set(dx / d * 6, 5, -4); r.stun = 0.6; r.inv = 0.6; r.grounded = false; }
    }
  }
  for (const b of blocks) {
    const dx = r.pos.x - b.x, dz = r.pos.z - b.z, ry = r.pos.y - b.y, ex = b.hw + 0.45, ez = b.hd + 0.45;
    if (ry < b.h && ry > -0.6 && Math.abs(dx) < ex && Math.abs(dz) < ez) {
      // astuce : on peut atterrir et rester debout sur un cube / un gant
      if (!b.hammer && ry > b.h - 0.45 && r.vel.y <= 0 && Math.abs(dx) < b.hw + 0.2 && Math.abs(dz) < b.hd + 0.2) { r.pos.y = b.y + b.h; r.vel.y = 0; r.grounded = true; r.pos.x += b.vx * dt; continue; }
      if (b.hammer) { if (r.inv <= 0) { const sg = Math.sign(b.vx) || Math.sign(dx) || 1; r.vel.set(sg * 12, 5, -1); r.stun = 0.8; r.inv = 0.5; r.grounded = false; r.pos.x = b.x + sg * ex; } }
      else {
        // guimauve ou gants : de face comme de côté, on est repoussé, on tremble, et l'obstacle se moque
        const side = ex - Math.abs(dx) < ez - Math.abs(dz);
        if (side) { const sg = Math.sign(dx) || 1; r.pos.x = b.x + sg * ex; if (r.inv <= 0) r.vel.set(sg * 10, 4, r.vel.z * 0.3); }
        else { const sg = Math.sign(dz) || 1; r.pos.z = b.z + sg * ez; if (r.inv <= 0) r.vel.set((Math.sign(dx) || 1) * 2.5, 4.5, sg * 9); else r.vel.z = 0; }
        if (r.inv <= 0) { r.stun = 0.55; r.inv = 0.45; r.grounded = false; blockHit(b, r); }
      }
    }
  }
  if (MAP.type === 'survival') { if (r.pos.y < -28) { r.out = true; outList.push(r); r.mesh.visible = false; if (r === me) { bannerShow('ÉLIMINÉ', 'tu regardes les autres', 2000); sfx('lose'); } } }
  else if (r.pos.y < -9 + (cps[r.cpi] ? cps[r.cpi].y : 0)) { // on suit la chute un moment avant de réapparaître
    r.fallT = (r.fallT == null ? 1.1 : r.fallT) - dt; if (r.fallT <= 0) { r.fallT = null; respawn(r); }
  }
  r.stun -= dt; r.dive -= dt; r.inv -= dt; r.punch -= dt; r.pcd -= dt;
  if (state === 'play' && !r.done) {
    if (MAP.type === 'race' && r.pos.z > finishZ && r.pos.y > (MAP.finY != null && MAP.type0 === 'final' ? MAP.finY : -1)) { r.done = true; qual.push(r); if (FINAL && !winner) { winner = r; crownOnHead(r); toast(r === me ? 'COURONNE !' : r.name + ' a la couronne'); } if (r.bot && Math.random() < 0.45) showEmote(r, ['👋', '👍', '🕺', '😂', '😎', '🏆'][(Math.random() * 6) | 0]); if (r === me) { bannerShow('QUALIFIÉ !', qual.length + (qual.length === 1 ? 'er' : 'e') + ' · tu regardes les autres', 2200); sfx('win'); buzz(60); } }
    if (MAP.type === 'final' && crown && !winner && Math.hypot(r.pos.x - crown.x, r.pos.y + 0.7 - crown.y, r.pos.z - crown.z) < 1.4) { winner = r; r.done = true; qual = [r]; crownOnHead(r); toast(r === me ? 'COURONNE !' : r.name + ' a la couronne'); }
  }
}

/* ---------- Commandes ---------- */
// joystick flottant (comme Stumble) : il apparaît là où le pouce gauche se pose
const joy = { x: 0, y: 0, id: null, cx: 0, cy: 0 }, joyEl = $('joy'), knob = $('knob'), joyZone = $('joyZone');
function joyMove(e) {
  const R = joyEl.offsetWidth / 2 || 66;
  let x = (e.clientX - joy.cx) / R, y = -(e.clientY - joy.cy) / R;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  joy.x = x; joy.y = y; knob.style.transform = `translate(${x * R * 0.62}px,${-y * R * 0.62}px)`;
}
function joyHome() { joyEl.style.left = ''; joyEl.style.top = ''; joyEl.style.bottom = ''; joyEl.classList.remove('act'); }
joyZone.addEventListener('pointerdown', e => {
  if (joy.id !== null) return; joy.id = e.pointerId; try { joyZone.setPointerCapture(e.pointerId); } catch (_) { }
  const R = joyEl.offsetWidth / 2 || 66, W = window.innerWidth, H = window.innerHeight;
  joy.cx = Math.max(R + 6, Math.min(W * 0.46 - R, e.clientX)); joy.cy = Math.max(R + 70, Math.min(H - R - 6, e.clientY));
  const z = parseFloat(joyEl.style.zoom) || 1;
  joyEl.style.left = (joy.cx / z - R) + 'px'; joyEl.style.top = (joy.cy / z - R) + 'px'; joyEl.style.bottom = 'auto'; joyEl.classList.add('act');
  joyMove(e); e.preventDefault();
});
joyZone.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = 0; joy.y = 0; knob.style.transform = ''; joyHome(); } };
joyZone.addEventListener('pointerup', joyEnd); joyZone.addEventListener('pointercancel', joyEnd);
let jumpQ = false, diveQ = false, punchQ = false;
const bindBtn = (el, f) => { el.addEventListener('pointerdown', e => { e.preventDefault(); f(); el.classList.add('on'); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => el.addEventListener(n, () => el.classList.remove('on'))); };
// Saut : 1 appui = sauter, 2e appui en l'air = plongeon
bindBtn($('bJump'), () => { if (me && !me.grounded && me.dive <= 0) diveQ = true; else { jumpQ = true; sfx('jump'); } }); bindBtn($('bPunch'), () => { if (me && me.pcd <= 0) { sfx('punch'); buzz(30); } punchQ = true; });
// swipe camera: drag anywhere on the 3D view to turn the camera around your character
let camYaw = 0, camPitch = 0; const camDrag = { id: null, x: 0, y: 0, lastTap: 0 };
{
  const cv = renderer.domElement; cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    if (camDrag.id !== null) return; camDrag.id = e.pointerId; camDrag.x = e.clientX; camDrag.y = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    const t = performance.now(); if (t - camDrag.lastTap < 300) { camYaw = 0; camPitch = 0; } camDrag.lastTap = t;
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== camDrag.id) return;
    const k = 4.2 / Math.max(300, window.innerWidth || 900);
    camYaw -= (e.clientX - camDrag.x) * k; camPitch = Math.max(-0.5, Math.min(0.8, camPitch + (e.clientY - camDrag.y) * k * 0.8));
    camDrag.x = e.clientX; camDrag.y = e.clientY;
  });
  const end = e => { if (e.pointerId === camDrag.id) camDrag.id = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}
const keys = {};
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); keys[k] = true; if (k === ' ') { jumpQ = true; e.preventDefault(); } if (k === 'shift') diveQ = true; if (k === 'e' || k === 'f') punchQ = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function playerInput() {
  let x = joy.x, y = joy.y;
  if (keys.arrowleft || keys.q || keys.a) x -= 1; if (keys.arrowright || keys.d) x += 1;
  if (keys.arrowup || keys.z || keys.w) y += 1; if (keys.arrowdown || keys.s) y -= 1;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  const cy = Math.cos(camYaw), sy = Math.sin(camYaw);
  const inp = { x: -x * cy + y * sy, z: x * sy + y * cy, jump: jumpQ, dive: diveQ, punch: punchQ }; jumpQ = diveQ = punchQ = false; return inp;
}
function playerInputRaw() {
  const i = playerInput();
  if (i.jump) NET.out.j++; if (i.dive) NET.out.d++; if (i.punch) NET.out.p++;
  if (state !== 'play') { i.x = 0; i.z = 0; }
  return i;
}

/* ---------- Écrans ---------- */
const show = (id, on) => { if (UI.PAGES[id]) { if (on) openPage(id); else if (UI.cur === id) UI.open(null); return; } $(id).classList.toggle('hide', !on); };
const toastEl = $('toast'), countEl = $('count'); let toastT = 0;
function toast(s) { toastEl.textContent = s; toastEl.style.opacity = 1; toastT = 2; }
let xp = store.get('xp', 0), crowns = store.get('crowns', 0), pname = store.get('name', 'Zak');
const thumb = i => 'thumbs/' + CHARS[i][1] + '.png';
const clsCol = c => ({ 'Commun': ['#b9c2d0', '#8a93a8'], 'Rare': ['#5fb6ff', '#2a6fe0'], 'Épique': ['#c27cff', '#7b3fe4'], 'Légendaire': ['#ffb347', '#ff7a1a'], 'Premium': ['#ffe066', '#e0a800'], 'Noël': ['#ff6b6b', '#c81d25'] }[c] || ['#ccc', '#999']);
function refreshLobby() {
  const c = coins.toLocaleString('fr-FR');
  ['coins', 'chCoins', 'mapsCoins', 'shCoins', 'passCoins'].forEach(id => { const e = $(id); if (e) e.textContent = c; });
  $('lname').textContent = CHARS[myChar][0];
  $('lcls').textContent = CHARS[myChar][3];
  $('lbName').textContent = pname; $('lbAvatar').src = thumb(myChar);
  $('lbLvl').textContent = 'Niv. ' + (Math.floor(xp / 100) + 1);
  $('lbXp').querySelector('i').style.width = (xp % 100) + '%'; $('lbXp').querySelector('span').textContent = (xp % 100) + ' / 100 XP';
  $('sh1').textContent = hasPunch ? 'Débloqué ✓' : PUNCH_PRICE.toLocaleString('fr-FR') + ' pièces';
  const today = new Date().toDateString(); $('sh3').textContent = store.get('gift', '') === today ? 'Demain !' : '+50 pièces';
}
let lobbyLook = null, podium = null, showLooks = [];
// list: [[charIndex ou objet 3D, numéro d'ancre]]
function setShow(list) {
  for (const o of showLooks) if (o.look.parent === showScene) showScene.remove(o.look);
  showLooks = [];
  const page = UI.cur;
  list.forEach(([w, k]) => {
    const add = l => { if (UI.cur !== page) return; const o = { look: l, k, spin: 0 }; showLooks.push(o); showScene.add(l); l.position.set(0, -50, 0); };
    if (typeof w === 'number') {
      const want = w;
      loadChar(want).then(l => { if (page === 'chars' && want !== chPick) return; if (page === 'lobby' && want !== myChar) return; add(l); });
    } else if (w) add(w);
  });
}
function placeShow() {
  const A = UI.ANCHORS[UI.cur]; if (!A) return;
  const W = host.clientWidth || 1, H = host.clientHeight || 1, V = 2 * 10 * Math.tan(15 * Math.PI / 180), k = V / H;
  const vic = UI.cur === 'victory';
  for (const o of showLooks) {
    const a = A[o.k]; if (!a) continue;
    const [sx, sy, sc] = UI.toScreen(UI.cur, a[0], a[1]);
    o.look.position.set((sx - W / 2) * k, -(sy - H / 2) * k, 0);
    o.look.scale.setScalar(a[2] * sc * k / 1.35);
    o.spin += 0.016;
    o.look.rotation.set(0, vic ? Math.sin(o.spin * 1.5) * 0.35 : (window.__norot ? 0 : o.spin * 0.8), 0);
    if (vic) o.look.position.y += Math.abs(Math.sin(time * 5 + o.k)) * a[2] * sc * k * 0.06;
    animLook(o.look, time * (vic ? 9 : 3), vic ? 0.6 : 0.25);
  }
}
/* ---- Passe de saison (gratuit, utilisable pour tester) : 1 palier = 100 XP ---- */
const PASS_FREE = [['coins', 200], ['gems', 10], ['emote', 'Rire'], ['coins', 300], ['gems', 15], ['emote', 'Lunettes'], ['coins', 400], ['gems', 20], ['emote', 'Cœur']];
let gems = store.get('gems', 0), passGot = store.get('passGot', []), emotes = store.get('emotes', []);
function renderPass() {
  const lvl = Math.floor(xp / 100), into = xp % 100;
  const hd = $('passHead'); hd.querySelector('.pl').textContent = 'Niv. ' + (lvl + 1); hd.querySelector('.pr').textContent = 'Niv. ' + (lvl + 2);
  hd.querySelector('i').style.width = into + '%'; hd.querySelector('span').textContent = into + ' / 100 XP';
  const tr = $('passTrack'); tr.textContent = '';
  const cx = i => i < 9 ? ((214 + i * 108 - 158) / (1252 - 158) * 100) : ((1222 - 158) / (1252 - 158) * 100);
  const tl = document.createElement('div'); tl.className = 'tl'; tr.appendChild(tl);
  const tf = document.createElement('div'); tf.className = 'tf'; const a = lvl <= 0 ? 4 : cx(Math.min(9, lvl - 1)), bnd = lvl >= 10 ? a : (lvl <= 0 ? cx(0) : cx(lvl)); tf.style.width = Math.max(0, a + (bnd - a) * (lvl >= 10 ? 0 : into / 100) - 4) + '%'; tr.appendChild(tf);
  for (let i = 0; i < 10; i++) { const c = document.createElement('div'); c.className = 'tc' + (lvl >= i + 1 ? ' on' : '') + (lvl === i ? ' cur' : ''); c.style.left = cx(i) + '%'; c.textContent = i + 1; tr.appendChild(c); }
  for (let i = 0; i < 9; i++) {
    const got = passGot.includes(i), open = lvl >= i + 1, b = $('passB' + i), c = $('passF' + i);
    c.className = 'hs pcell' + (got ? '' : open ? ' get' : ' lock');
    b.className = 'pbadge ' + (got ? 'ok' : open ? 'get' : 'lock'); b.textContent = got ? '✓' : open ? '!' : '🔒';
  }
  $('passGems').textContent = gems;
}
for (let i = 0; i < 9; i++) $('passF' + i).addEventListener('click', () => {
  const lvl = Math.floor(xp / 100), [kind, v] = PASS_FREE[i];
  if (passGot.includes(i)) { toast('Déjà récupéré'); return; }
  if (lvl < i + 1) { toast('Palier ' + (i + 1) + ' : encore ' + ((i + 1) * 100 - xp) + ' XP'); sfx('tap'); return; }
  passGot.push(i); store.set('passGot', passGot);
  if (kind === 'coins') { coins += v; store.set('coins', coins); toast('+' + v + ' pièces !'); }
  else if (kind === 'gems') { gems += v; store.set('gems', gems); toast('+' + v + ' gemmes !'); }
  else { emotes.push(v); store.set('emotes', emotes); toast('Nouvelle emote : ' + v + ' !'); }
  sfx('win'); buzz(40); refreshLobby(); renderPass();
});
$('passPrem').addEventListener('click', () => panel('Passe Premium', b => {
  prow(b, 'Toute la ligne Premium', pval('Gemmes, emotes, persos'));
  prow(b, 'Récompense finale', pval('PhénixZaki légendaire'));
  if (window.ZakiBilling && window.ZakiBilling.buy) prow(b, 'Prix', pbtn('Acheter 4,99 €', '', () => window.ZakiBilling.buy('pass_premium')));
  else prow(b, 'Achat', pval("Dans l'appli Google Play"));
}));
function openPage(id) {
  UI.open(id); refreshLobby();
  if (id === 'lobby') setShow([[myChar, 0]]);
  else if (id === 'chars') { chPick = myChar; tab = 'chars'; setTab('chars'); setShow([[chPick, 0]]); }
  else if (id === 'maps') { buildMaps(); setShow([]); }
  else if (id !== 'victory') setShow([]);
  if (id === 'settings') syncSettings();
  if (id === 'pass') renderPass();
  if (id === 'online') netStatus($('onStatus').textContent);
}
function enterLobby() {
  if (crown && crown.head && crown.g.parent) crown.g.parent.remove(crown.g);
  if (window.__pendingReload) { location.reload(); return; }
  state = 'lobby'; tour = false; stopConfetti();
  restoreVictoryLooks();
  for (const r of runners) { if (r.look && r.look.parent) r.look.parent.remove(r.look); scene.remove(r.mesh); if (r.mesh.userData.shadow) scene.remove(r.mesh.userData.shadow); }
  runners.length = 0; me = null;
  clearWorld();
  show('playui', false); show('result', false); show('intro', false); show('loading', false); countEl.textContent = '';
  openPage('lobby');
}
function setLobbyLook() { if (UI.cur === 'lobby') setShow([[myChar, 0]]); }
let chPick = 18;
/* ---- Emotes et traînées (Casier) ---- */
const EMOTES = [
  { id: 'salut', n: 'Salut', e: '👋' }, { id: 'bravo', n: 'Bravo', e: '👍' }, { id: 'danse', n: 'Danse', e: '🕺' }, { id: 'colere', n: 'Grr', e: '😡' },
  { id: 'Rire', n: 'Rire', e: '😂', pass: 3 }, { id: 'Lunettes', n: 'Stylé', e: '😎', pass: 6 }, { id: 'Cœur', n: 'Cœur', e: '😍', pass: 9 },
  { id: 'couronne', n: 'Roi', e: '👑', price: 300 }, { id: 'feu', n: 'En feu', e: '🔥', price: 300 }, { id: 'fantome', n: 'Bouh', e: '👻', price: 300 },
  { id: 'gg', n: 'GG', e: '🏆', price: 400 }, { id: 'dodo', n: 'Dodo', e: '😴', price: 400 }
];
const TRAILS = [
  { id: 'none', n: 'Aucune', e: '🚫', c: [] }, { id: 'arc', n: 'Arc-en-ciel', e: '🌈', c: [0xff4f4f, 0xffa020, 0xffe040, 0x5fe05f, 0x4fb0ff, 0xb06cff], price: 500 },
  { id: 'etoiles', n: 'Étoiles', e: '⭐', c: [0xffd23f, 0xfff2a0, 0xffffff], price: 500 }, { id: 'feu', n: 'Feu', e: '🔥', c: [0xff3b1a, 0xff8a1a, 0xffd23f], price: 500 },
  { id: 'neige', n: 'Neige', e: '❄️', c: [0xffffff, 0xbfe8ff, 0x8fd0ff], price: 500 }, { id: 'coeurs', n: 'Cœurs', e: '💖', c: [0xff4fa6, 0xff8fd0, 0xffffff], price: 500 },
  { id: 'or', n: 'Or royal', e: '✨', c: [0xffd23f, 0xffb300, 0xfff6c0], gems: 30 }
];
let tab = 'chars', emPick = null, trPick = null;
let myEmotes = store.get('emoteEq', ['salut', 'bravo', 'danse', 'colere']), owned = store.get('owned', []), myTrail = store.get('trail', 'none');
const hasEmote = e => !e.pass && !e.price || emotes.includes(e.id) || owned.includes('e_' + e.id);
const hasTrail = t => (!t.price && !t.gems) || owned.includes('t_' + t.id);
function setTab(t) {
  tab = t; sfx('tap');
  ['tabEmotes', 'tabTrails', 'tabChars'].forEach(id => $(id).classList.toggle('tabon', (id === 'tabEmotes' && t === 'emotes') || (id === 'tabTrails' && t === 'trails') || (id === 'tabChars' && t === 'chars')));
  if (t === 'emotes') emPick = emPick || EMOTES[0]; if (t === 'trails') trPick = trPick || TRAILS.find(x => x.id === myTrail) || TRAILS[0];
  buildGrid();
}
function itemTile(it, picked, eq, locked, sub) {
  const b = document.createElement('button'); b.className = 'ctile itile' + (picked ? ' pick' : '') + (eq ? ' eq' : '') + (locked ? ' locked' : '');
  const em = document.createElement('i'); em.textContent = it.e; const n = document.createElement('b'); n.textContent = sub || it.n;
  b.append(em, n); b.setAttribute('aria-label', it.n); return b;
}
function lockText(it) { return it.pass ? 'Passe niv. ' + it.pass : it.gems ? it.gems + ' 💎' : it.price + ' 🪙'; }
function buildGrid() {
  const g = $('charGrid'), keep = g.scrollTop; g.textContent = '';
  if (tab === 'emotes') {
    EMOTES.forEach(e => { const own = hasEmote(e), b = itemTile(e, emPick === e, myEmotes.includes(e.id), !own, own ? e.n : lockText(e)); b.addEventListener('click', () => { emPick = e; sfx('tap'); emotePreview(e.e); buildGrid(); }); g.appendChild(b); });
    $('chName').textContent = emPick.e + ' ' + emPick.n; $('chCls').textContent = hasEmote(emPick) ? (myEmotes.includes(emPick.id) ? 'Équipée' : 'Touche Équiper') : lockText(emPick);
    $('charsOkTxt').textContent = !hasEmote(emPick) && emPick.price ? 'Acheter' : myEmotes.includes(emPick.id) ? 'Retirer' : 'Équiper';
    return;
  }
  if (tab === 'trails') {
    TRAILS.forEach(t => { const own = hasTrail(t), b = itemTile(t, trPick === t, myTrail === t.id, !own, own ? t.n : lockText(t)); b.addEventListener('click', () => { trPick = t; sfx('tap'); buildGrid(); }); g.appendChild(b); });
    $('chName').textContent = trPick.e + ' ' + trPick.n; $('chCls').textContent = hasTrail(trPick) ? (myTrail === trPick.id ? 'Équipée' : 'Touche Équiper') : lockText(trPick);
    $('charsOkTxt').textContent = hasTrail(trPick) ? 'Équiper' : 'Acheter';
    return;
  }
  $('charsOkTxt').textContent = 'Équiper';
  CHARS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'ctile' + (i === chPick ? ' pick' : '') + (i === myChar ? ' eq' : '');
    const [c1, c2] = clsCol(c[3]); b.style.background = `linear-gradient(${c1},${c2})`;
    const im = document.createElement('img'); im.src = thumb(i); im.alt = '';
    const n = document.createElement('b'); n.textContent = c[0];
    b.append(im, n); b.setAttribute('aria-label', c[0]);
    b.addEventListener('click', () => { chPick = i; buildGrid(); setShow([[i, 0]]); sfx('tap'); });
    g.appendChild(b);
  });
  g.scrollTop = keep;
  $('chName').textContent = CHARS[chPick][0]; $('chCls').textContent = CHARS[chPick][3];
}
const MAP_ORDER = ['toboggan', 'marteaux', 'hexa', 'nuit', 'bonbon', 'couronne'];
let mapSel = 0;
function buildMaps() {
  for (let k = 0; k < 5; k++) {
    const key = MAP_ORDER[(mapSel + k - 2 + 60) % MAP_ORDER.length], m = MAPS[key], b = $('mslot' + k);
    b.textContent = '';
    const im = document.createElement('img'); im.alt = ''; im.src = m.img || ('img/' + key + '.jpg');
    const n = document.createElement('b'); n.textContent = m.name;
    const sp = document.createElement('span');
    const e1 = document.createElement('em'); e1.textContent = m.tag; e1.style.background = m.col;
    const e2 = document.createElement('em'); e2.textContent = '⏱ ' + Math.round(m.time / 60) + ' min';
    sp.append(e1, e2); b.append(im, n, sp); b.setAttribute('aria-label', m.name);
  }
}
for (let k = 0; k < 5; k++) $('mslot' + k).addEventListener('click', () => { if (k === 2) { playSel(); return; } mapSel = (mapSel + k - 2 + 60) % MAP_ORDER.length; buildMaps(); sfx('tap'); });
function playSel() { const key = MAP_ORDER[mapSel]; sfx('tap'); if (NET.role === 'guest') { openPage('online'); return; } UI.open(null); startGame(false, key); }
$('mapsPrev').addEventListener('click', () => { mapSel = (mapSel + MAP_ORDER.length - 1) % MAP_ORDER.length; buildMaps(); sfx('tap'); });
$('mapsNext').addEventListener('click', () => { mapSel = (mapSel + 1) % MAP_ORDER.length; buildMaps(); sfx('tap'); });
$('mapsRandom').addEventListener('click', () => { mapSel = (Math.random() * MAP_ORDER.length) | 0; sfx('tap'); UI.open(null); setShow([]); roulette(MAP_ORDER[mapSel], 0, () => { buildMaps(); playSel(); }, 'MAP AU HASARD'); });
$('mapsPlay').addEventListener('click', playSel);
const go = (id, page) => $(id).addEventListener('click', () => { sfx('tap'); openPage(page); });
go('bChars', 'chars'); go('lbPed', 'chars'); go('bMaps', 'maps'); go('lbShop', 'shop'); go('lbPass', 'pass'); go('lbGear', 'settings');
$('bOnline').addEventListener('click', () => { if (!parent.online) { toast('Jeu en ligne bloqué par le contrôle parental'); sfx('tap'); return; } openPage('online'); });
['charsBack', 'mapsBack', 'shopBack', 'passBack', 'setClose'].forEach(id => go(id, 'lobby'));
$('charsOk').addEventListener('click', () => {
  if (tab === 'emotes') {
    const e = emPick;
    if (!hasEmote(e)) {
      if (e.pass) { toast('Se débloque au niveau ' + e.pass + ' du Passe'); sfx('tap'); return; }
      if (coins < e.price) { toast('Il te manque ' + (e.price - coins) + ' pièces'); sfx('tap'); return; }
      coins -= e.price; store.set('coins', coins); owned.push('e_' + e.id); store.set('owned', owned); toast('Emote ' + e.n + ' achetée !'); sfx('win'); refreshLobby(); buildGrid(); return;
    }
    if (myEmotes.includes(e.id)) { if (myEmotes.length <= 1) { toast('Garde au moins une emote'); return; } myEmotes = myEmotes.filter(x => x !== e.id); toast(e.n + ' retirée'); }
    else { if (myEmotes.length >= 4) myEmotes.shift(); myEmotes.push(e.id); toast(e.n + ' équipée !'); }
    store.set('emoteEq', myEmotes); sfx('win'); buildGrid(); return;
  }
  if (tab === 'trails') {
    const t = trPick;
    if (!hasTrail(t)) {
      if (t.gems) { if (gems < t.gems) { toast('Il te manque ' + (t.gems - gems) + ' gemmes'); return; } gems -= t.gems; store.set('gems', gems); }
      else { if (coins < t.price) { toast('Il te manque ' + (t.price - coins) + ' pièces'); sfx('tap'); return; } coins -= t.price; store.set('coins', coins); }
      owned.push('t_' + t.id); store.set('owned', owned); toast('Traînée ' + t.n + ' achetée !'); sfx('win'); refreshLobby(); buildGrid(); return;
    }
    myTrail = t.id; store.set('trail', myTrail); toast(t.n + ' équipée !'); sfx('win'); buildGrid(); return;
  }
  myChar = chPick; store.set('char', myChar); sfx('win'); toast(CHARS[myChar][0] + ' équipé !'); openPage('lobby');
});
$('tabChars').addEventListener('click', () => setTab('chars'));
$('tabEmotes').addEventListener('click', () => setTab('emotes'));
$('tabTrails').addEventListener('click', () => setTab('trails'));
// aperçu d'emote au-dessus du perso du Casier
function emotePreview(e) { const b = $('emoPrev'); b.textContent = e; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
$('sh1').addEventListener('click', () => {
  if (hasPunch) { toast('Déjà à toi !'); return; }
  if (coins < PUNCH_PRICE) { sfx('lose'); toast('Il te faut ' + PUNCH_PRICE.toLocaleString('fr-FR') + ' pièces'); return; }
  coins -= PUNCH_PRICE; store.set('coins', coins); hasPunch = true; store.set('punch', true); refreshLobby(); sfx('win'); buzz(80); toast('Coup de poing débloqué !');
});
function shopCoins() { if (gems < 10) { toast('Il te faut 10 gemmes (gagne-les dans le Passe)'); sfx('tap'); return; } gems -= 10; store.set('gems', gems); coins += 500; store.set('coins', coins); refreshLobby(); sfx('win'); buzz(40); toast('+500 pièces !'); }
$('sh0').addEventListener('click', shopCoins); $('sh0b').addEventListener('click', shopCoins);
function openChest() {
  const pool = EMOTES.filter(e => e.price && !hasEmote(e)).map(e => ['e', e]).concat(TRAILS.filter(t => t.price && !hasTrail(t)).map(t => ['t', t]));
  if (!pool.length) { toast('Tu as déjà tout !'); return; }
  if (coins < 800) { toast('Il te manque ' + (800 - coins) + ' pièces'); sfx('tap'); return; }
  coins -= 800; store.set('coins', coins); refreshLobby();
  const [k, it] = pool[(Math.random() * pool.length) | 0]; owned.push(k + '_' + it.id); store.set('owned', owned);
  const bx = $('cbx'); bx.textContent = '🎁'; bx.className = 'cbx'; $('cres').textContent = ''; show('cOk', false); show('chest', true); sfx('tap');
  setTimeout(() => { bx.textContent = it.e; bx.className = 'cbx open'; $('cres').textContent = (k === 'e' ? 'Emote ' : 'Traînée ') + it.n + ' !'; show('cOk', true); sfx('win'); buzz(80); }, 1550);
}
$('sh2').addEventListener('click', openChest); $('sh2b').addEventListener('click', openChest);
$('cOk').addEventListener('click', () => { show('chest', false); sfx('tap'); });
$('lbPlus').addEventListener('click', () => openPage('shop')); $('chPlus').addEventListener('click', () => openPage('shop'));
$('sh3').addEventListener('click', () => { const t = new Date().toDateString(); if (store.get('gift', '') === t) { toast('Reviens demain !'); return; } store.set('gift', t); coins += 50; store.set('coins', coins); refreshLobby(); sfx('win'); toast('+50 pièces !'); });
/* ---- fenêtre générique ---- */
function panel(title, build) { $('pnT').textContent = title; const b = $('pnB'); b.textContent = ''; build(b); show('panel', true); sfx('tap'); }
$('pnX').addEventListener('click', () => { show('panel', false); sfx('tap'); });
function prow(b, label, right) { const r = document.createElement('div'); r.className = 'prow'; const l = document.createElement('span'); l.textContent = label; r.appendChild(l); if (right) r.appendChild(right); b.appendChild(r); return r; }
function pbtn(txt, cls, fn) { const x = document.createElement('button'); x.className = 'pbtn ' + (cls || ''); x.textContent = txt; x.addEventListener('click', fn); return x; }
function pval(txt) { const s = document.createElement('span'); s.textContent = txt; s.style.color = '#ffd23f'; return s; }
/* ---- contrôle parental : code à 4 chiffres, jeu en ligne, temps de jeu ---- */
let parent = store.get('parent', { pin: null, online: true, limit: 0 });
function playedToday() { const d = store.get('ptime', { day: '', s: 0 }); return d.day === new Date().toDateString() ? d.s : 0; }
function addPlay(sec) { const day = new Date().toDateString(), d = store.get('ptime', { day: '', s: 0 }); store.set('ptime', { day, s: (d.day === day ? d.s : 0) + sec }); }
function timeLeftOk() { if (!parent.limit) return true; if (playedToday() < parent.limit * 60) return true; toast('Temps de jeu du jour terminé'); return false; }
function askPin(cb) {
  panel('Code parent', b => {
    const inp = document.createElement('input'); inp.type = 'password'; inp.inputMode = 'numeric'; inp.maxLength = 4; inp.placeholder = '••••';
    prow(b, parent.pin ? 'Entre le code' : 'Choisis un code', inp);
    prow(b, '', pbtn('Valider', '', () => { const v = inp.value.trim(); if (!/^\d{4}$/.test(v)) { toast('4 chiffres'); return; } if (!parent.pin) { parent.pin = v; store.set('parent', parent); cb(); return; } if (v !== parent.pin) { toast('Code incorrect'); inp.value = ''; return; } cb(); }));
    setTimeout(() => inp.focus(), 50);
  });
}
function parentPanel() {
  panel('Contrôle parental', b => {
    const on = pbtn(parent.online ? 'Autorisé' : 'Bloqué', parent.online ? 'on' : 'off', () => { parent.online = !parent.online; store.set('parent', parent); parentPanel(); });
    prow(b, 'Jeu en ligne', on);
    const seg = document.createElement('div'); seg.className = 'pseg';
    [[0, 'Illimité'], [30, '30 min'], [60, '1 h'], [120, '2 h']].forEach(([m, t]) => seg.appendChild(pbtn(t, parent.limit === m ? 'sel' : '', () => { parent.limit = m; store.set('parent', parent); parentPanel(); })));
    prow(b, 'Temps par jour', seg);
    prow(b, "Joué aujourd'hui", pval(Math.floor(playedToday() / 60) + ' min'));
    prow(b, 'Code parent', pbtn('Changer', '', () => { parent.pin = null; store.set('parent', parent); askPin(parentPanel); }));
  });
}
$('setParent').addEventListener('click', () => askPin(parentPanel));
/* ---- langue ---- */
$('setLang').addEventListener('click', () => panel('Langue', b => prow(b, '🇫🇷 Français', pval('✓'))));
/* ---- compte ---- */
function accountPanel() {
  panel('Mon compte', b => {
    const inp = document.createElement('input'); inp.value = pname; inp.maxLength = 14;
    inp.addEventListener('change', () => { const n = inp.value.trim().slice(0, 14); if (n) { pname = n; store.set('name', n); refreshLobby(); toast('Pseudo enregistré'); } });
    prow(b, 'Pseudo', inp);
    prow(b, 'Niveau', pval('Niv. ' + (Math.floor(xp / 100) + 1) + ' · ' + xp + ' XP'));
    prow(b, 'Parties jouées', pval(String(store.get('games', 0))));
    prow(b, 'Manches qualifiées', pval(String(store.get('quals', 0))));
    prow(b, 'Couronnes gagnées', pval(String(crowns)));
    prow(b, 'Pièces / gemmes', pval(coins + ' 🪙 · ' + gems + ' 💎'));
    let sure = false;
    prow(b, 'Tout remettre à zéro', pbtn('Effacer', 'off', e => { if (!sure) { sure = true; e.target.textContent = 'Sûr ? Touche encore'; return; } try { Object.keys(localStorage).filter(k => k.indexOf('zaki_') === 0).forEach(k => localStorage.removeItem(k)); } catch (er) { } location.reload(); }));
  });
}
$('setAccount').addEventListener('click', accountPanel);
let fsTried = false;
function goFull() {
  if (fsTried) return; fsTried = true;
  try { const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; if (f && !document.fullscreenElement) { const p = f.call(d); if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (_) { } }).catch(() => { }); } } catch (_) { }
}
$('bPlay').addEventListener('click', () => { sfx('tap'); if (NET.role === 'guest') { openPage('online'); return; } UI.open(null); startGame(true); });
/* ---- réglages ---- */
function saveSet() { try { localStorage.setItem('zaki_set', JSON.stringify(SET)); } catch (e) { } }
function applyBtn() { const z = 0.75 + SET.btn / 100 * 0.6; ['joy', 'bJump', 'bPunch', 'bEmo'].forEach(id => { $(id).style.zoom = z; }); }
function syncSettings() {
  [['setMus', 'mus'], ['setSfx', 'sfx'], ['setBtn', 'btn']].forEach(([id, k]) => { const e = $(id); e.value = SET[k]; e.style.setProperty('--v', SET[k] + '%'); });
  $('setVib').classList.toggle('on', !!SET.vib); $('setVib').querySelector('span').textContent = SET.vib ? 'On' : 'Off';
  $('setGfx').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.g === SET.gfx));
}
[['setMus', 'mus'], ['setSfx', 'sfx'], ['setBtn', 'btn']].forEach(([id, k]) => $(id).addEventListener('input', e => {
  SET[k] = +e.target.value; e.target.style.setProperty('--v', SET[k] + '%'); saveSet();
  if (k === 'mus') { music.volume = SET.mus / 100 * 0.7; if (SET.mus > 0 && music.paused) music.play().catch(() => { }); }
  if (k === 'btn') applyBtn();
}));
$('setVib').addEventListener('click', () => { SET.vib = !SET.vib; saveSet(); syncSettings(); buzz(40); });
$('setGfx').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.gfx = +b.dataset.g; saveSet(); syncSettings(); applyGfx(); resize(); }));
applyBtn();
/* ---- musique + effets ---- */
const music = new Audio('audio/zaki.mp3'); music.loop = true; music.preload = 'auto'; music.volume = SET.mus / 100 * 0.7;
let actx = null;
window.addEventListener('pointerdown', () => {
  if (music.paused && SET.mus > 0) music.play().catch(() => { });
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (state === 'lobby') goFull();
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) music.pause(); else if (SET.mus > 0 && actx) music.play().catch(() => { }); });
function buzz(ms) { if (SET.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
function sfx(kind) {
  if (!actx || SET.sfx <= 0) return;
  const v = SET.sfx / 100 * 0.22, t0 = actx.currentTime;
  const tone = (f1, f2, d, type, at) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t0 + at); o.frequency.exponentialRampToValueAtTime(f2, t0 + at + d); g.gain.setValueAtTime(v, t0 + at); g.gain.exponentialRampToValueAtTime(0.001, t0 + at + d); o.connect(g); g.connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + d + 0.02); };
  if (kind === 'tap') tone(660, 990, 0.07, 'triangle', 0);
  else if (kind === 'jump') tone(320, 720, 0.16, 'square', 0);
  else if (kind === 'punch') tone(180, 60, 0.18, 'sawtooth', 0);
  else if (kind === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.16, 'triangle', i * 0.09));
  else if (kind === 'lose') [392, 330, 262].forEach((f, i) => tone(f, f * 0.97, 0.2, 'triangle', i * 0.14));
}
function quitGame() { clearTimeout(autoT); nextPassed = null; show('pmenu', false); show('roul', false); if (NET.role === 'host') netSend({ t: 'home' }); if (NET.role === 'guest') netLeave(); enterLobby(); }
$('resHome').addEventListener('click', quitGame);
// menu pendant la partie (comme Stumble) : continuer ou quitter
$('bMenu').addEventListener('click', () => { sfx('tap'); show('pmenu', true); });
bindBtn($('bEmo'), () => {
  const w = $('emoWheel'), open = w.classList.contains('hide');
  if (open) w.querySelectorAll('button').forEach((b, k) => { const e = EMOTES.find(x => x.id === myEmotes[k]); b.textContent = e ? e.e : ''; b.style.visibility = e ? 'visible' : 'hidden'; });
  show('emoWheel', open); sfx('tap');
});
$('emoWheel').querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); myEmote(+b.dataset.k); }));
$('pmGo').addEventListener('click', () => { sfx('tap'); show('pmenu', false); });
$('pmQuit').addEventListener('click', () => { sfx('tap'); quitGame(); });
/* ---- enchaînement automatique des manches : roue des maps au hasard ---- */
let autoT = null, played = [];
let FORCEK = null;
function nextKey() {
  if (FORCEK) return FORCEK;
  const pool = MAP_ORDER.filter(k => !played.includes(k));
  return pool[(Math.random() * pool.length) | 0];
}
function roulette(key, ri, cb, title) {
  const S = $('roulS'); S.textContent = ''; S.style.transition = 'none'; S.style.transform = 'translateX(0)';
  $('roulT').textContent = title || (ri >= 2 ? 'FINALE !' : 'MANCHE ' + (ri + 1));
  $('roulN').textContent = '';
  const keys = MAP_ORDER.slice(), seq = [];
  for (let i = 0; i < 14; i++) seq.push(keys[(Math.random() * keys.length) | 0]);
  seq.push(key); seq.push(keys[(Math.random() * keys.length) | 0]); seq.push(keys[0]);
  const cards = seq.map(k => { const c = document.createElement('div'); c.className = 'rc'; const im = document.createElement('img'); im.alt = ''; im.src = MAPS[k].img; const b = document.createElement('b'); b.textContent = MAPS[k].name; c.append(im, b); S.appendChild(c); return c; });
  show('roul', true);
  setTimeout(() => {
    const c = cards[14], off = c.offsetLeft + c.offsetWidth / 2;
    S.style.transform = 'translateX(0)'; void S.offsetWidth;
    S.style.transition = 'transform 2.6s cubic-bezier(.12,.75,.18,1)'; S.style.transform = 'translateX(' + (-off) + 'px)';
    let tk = 0; const tick = setInterval(() => { if (++tk > 18) clearInterval(tick); else sfx('tap'); }, 140);
    autoT = setTimeout(() => { c.classList.add('win'); $('roulN').textContent = MAPS[key].name; sfx('win'); buzz(40); autoT = setTimeout(() => fadeTo(() => { show('roul', false); cb(); }), 1100); }, 2700);
  }, 40);
}
let nextPassed = null;
// la suite part dès que la scène des éliminés est finie (et jamais avant)
function autoNext(passed) { nextPassed = passed; }
function goNext(passed) {
  clearTimeout(autoT);
  autoT = setTimeout(() => {
    if (state !== 'result') return;
    roundIdx++; field = passed.slice(); const k = nextKey(); played.push(k);
    if (NET.role === 'host') netSend({ t: 'roul', key: k, ri: roundIdx });
    fadeTo(() => { show('result', false); roulette(k, roundIdx, () => setupRound(k)); });
  }, 900);
}
$('introGo').addEventListener('click', () => beginCount());
$('resNext').addEventListener('click', () => { if (nextAction) nextAction(); });

/* ---------- Partie ---------- */
let me = null, nextAction = null;
async function startGame(isTour, key) {
  if (!timeLeftOk()) { openPage('lobby'); return; }
  store.set('games', store.get('games', 0) + 1);
  tour = isTour; roundIdx = 0;
  const two = NET.role === 'host' && NET.peerCi != null;
  const base = two ? [myChar, NET.peerCi] : [myChar];
  const others = CHARS.map((_, i) => i).filter(i => !base.includes(i)).sort(() => Math.random() - 0.5).slice(0, 16 - base.length);
  const ids = base.concat(others);
  if (two) netSend({ t: 'start', ids, tour: isTour });
  await prepRunners(ids, 0);
  if (two) { runners[1].canPunch = !!NET.peerPunch; runners[1].bot = false; runners[1].remote = true; runners[1].name = 'Joueur 2 (' + CHARS[ids[1]][0] + ')'; }
  const k0 = isTour ? MAP_ORDER[(Math.random() * MAP_ORDER.length) | 0] : key; played = [k0];
  if (isTour) {
    if (two) netSend({ t: 'roul', key: k0, ri: 0 });
    show('loading', false); roulette(k0, 0, () => setupRound(k0));
  } else setupRound(k0);
}
async function prepRunners(ids, meIdx) {
  UI.open(null); setShow([]); show('loading', true);
  let done = 0; $('loadBar').style.width = '0%'; $('loadTxt').textContent = 'Chargement des persos… 0/16';
  await Promise.all(ids.map(i => loadChar(i).then(() => { done++; $('loadBar').style.width = (done / ids.length * 100) + '%'; $('loadTxt').textContent = 'Chargement des persos… ' + done + '/16'; })));
  for (const r of runners) { scene.remove(r.mesh); if (r.mesh.userData.shadow) scene.remove(r.mesh.userData.shadow); }
  runners.length = 0;
  ids.forEach((ci, i) => { const r = mkRunner(ci, i !== meIdx); if (ids.indexOf(ci) !== i) { r.look = bean(CHARS[ci][2]); r.inner.add(r.look); } else attachLook(r); r.look.scale.setScalar(1); runners.push(r); });
  runners.forEach(r => { r.canPunch = Math.random() < 0.35; });
  me = runners[meIdx]; me.name = 'Toi (' + CHARS[ids[meIdx]][0] + ')'; me.canPunch = hasPunch;
  field = runners.slice();
  show('loading', false);
}
function setupRound(key) {
  mapKey = key; MAP = MAPS[key];
  applyMode(key, tour ? roundIdx === 2 : (MAP.type0 || MAP.type) === 'final');
  buildMap(MAP);
  if (FINAL && MAP.type !== 'final') { const fz = MAP.type === 'survival' ? 10 : (finishZ || 0) + 1, gp = groundAt(0, fz, 300); crownAt(0, (gp ? gp.top : 0) + (MAP.type === 'survival' ? 6 : 6.5), fz); }
  const n = field.length;
  // tournoi : 16 -> 10 qualifiés -> 6 en finale -> 1 gagnant ; partie rapide : la moitié
  target = FINAL ? 1 : tour ? (roundIdx === 0 ? Math.min(10, n - 1) : Math.min(6, n - 1)) : Math.max(1, Math.ceil(n / 2));
  qual = []; winner = null; clock = MAP.time; outList = []; NET.rst = null;
  for (const r of runners) { r.mesh.visible = field.includes(r); r.out = !field.includes(r); }
  camYaw = 0; camPitch = 0;
  const slots = field.map((_, i) => i).sort(() => Math.random() - 0.5);
  field.forEach((r, i) => {
    const s = slots[i];
    if (MAP.spawn) { const p = MAP.spawn(s, n); r.pos.set(p[0], p[1], p[2]); }
    else { const row = Math.floor(s / 6), col = s % 6; r.pos.set(-5 + col * 2, 0, -1.5 - row * 2); }
    r.vel.set(0, 0, 0);
    Object.assign(r, { done: false, out: false, cpi: 0, stun: 0, dive: 0, inv: 0, punch: 0, pcd: 2, yaw: 0, grounded: true, gp: null, tx: r.pos.x, tt: 0, goal: null });
    if (r.bot) { r.skill = 0.84 + Math.random() * 0.13; r.react = 0.35 + Math.random() * 0.55; r.miss = Math.random() < (1 - r.react) * 0.5; r.miss2 = Math.random() < (1 - r.react) * 0.6; }
    r.mesh.visible = true;
  });
  if (NET.role === 'host') netSend({ t: 'round', key, f: field.map(r => runners.indexOf(r)), ri: roundIdx, tg: target, tour, fin: FINAL ? 1 : 0 });
  introUI(n);
}
function introUI(n) {
  show('bPunch', hasPunch);
  if (UI.cur) { stopConfetti(); setShow([]); restoreVictoryLooks(); UI.open(null); }
  $('hmap').textContent = MAP.name;
  const total = tour ? 3 : 1;
  $('introRound').textContent = tour ? (FINAL ? 'FINALE' : 'Manche ' + (roundIdx + 1) + ' sur ' + total) : 'Partie rapide';
  const ii = $('introImg'); if (MAP.img) { ii.src = MAP.img; ii.style.display = ''; } else ii.style.display = 'none';
  $('introName').textContent = MAP.name; $('introTag').textContent = MAP.tag; $('introTag').style.background = MAP.col;
  $('introGoal').textContent = FINAL && MAP.type === 'race' ? 'FINALE ! Le premier à passer l\'arche gagne la couronne !' : FINAL && MAP.type === 'survival' ? 'FINALE ! Le dernier debout gagne la couronne !' : MAP.type0 === 'final' && MAP.type === 'race' ? `Grimpe la tour et passe l'arche dorée : ${target} places sur ${n}.` : MAP.type === 'race' ? `Passe l'arche dans les ${target} premiers sur ${n}.` : MAP.type === 'survival' ? `Les dalles tombent sous tes pieds. Reste en vie : ${target} places sur ${n}.` : 'Grimpe la tour et attrape la couronne en premier !';
  // comme Stumble : survol de la caméra de l'arrivée jusqu'au départ, puis 3, 2, 1, Go
  state = 'intro'; show('result', false); show('intro', false); show('playui', false);
  show('roul', false); show('pmenu', false); clearTimeout(autoT);
  $('flyR').textContent = $('introRound').textContent; $('flyN').textContent = MAP.name; $('flyG').textContent = $('introGoal').textContent;
  show('flyS', NET.role !== 'guest'); show('fly', true);
  FLY = { t: 0, d: MAP.type === 'survival' ? 4.0 : 4.6 };
}
let FLY = null, specR = null, specOn = false, FINAL = false;
// la finale peut tomber sur n'importe quelle map : le gagnant prend la couronne
function applyMode(key, isFinal) {
  const M = MAPS[key]; if (!M.type0) M.type0 = M.type;
  FINAL = isFinal;
  M.type = M.type0 === 'final' ? (isFinal ? 'final' : 'race') : M.type0;
}
function specCycle(d) { const pool = field.filter(r => !r.out && !r.done); if (!pool.length) return; let i = pool.indexOf(specR); i = (i + d + pool.length) % pool.length; specR = pool[i]; sfx('tap'); }
bindBtn($('spPrev'), () => specCycle(-1)); bindBtn($('spNext'), () => specCycle(1));
function flyCam(dt) {
  const f = FLY; f.t = Math.min(f.d, f.t + dt);
  const u = f.t / f.d, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  if (MAP.type === 'survival') {
    const a = Math.PI * 0.9 * (1 - e) - 0.15, R = 26 - 12 * e;
    cam.position.set(Math.sin(a) * R * 0.9, 14 - 6 * e, 10 - Math.cos(a) * R);
    cam.lookAt(0, -4 + 3 * e, 10);
  } else {
    const pts = cps.map(c => [c.z, c.y || 0]).sort((a, b) => a[0] - b[0]);
    const zs = pts.length ? pts[0][0] : -6, ze = MAP.type === 'final' && crown ? crown.z : (finishZ != null ? finishZ : zs + 60);
    if (MAP.type === 'final' && crown) pts.push([crown.z, crown.y - 1.5]); else if (pts.length) pts.push([ze, pts[pts.length - 1][1]]);
    const yAt = z => { if (!pts.length) return 0; if (z <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (z <= pts[i][0]) { const a = pts[i - 1], b = pts[i], k = (z - a[0]) / Math.max(0.01, b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; } return pts[pts.length - 1][1]; };
    const tower = MAP.type0 === 'final', z = ze + 4 - (ze + 4 - (zs - 8)) * e, h = (tower ? 13 : 10) - (tower ? 7.8 : 4.8) * e;
    cam.position.set(Math.sin(u * Math.PI) * (tower ? 16 : 4.5), yAt(z) + h, z);
    cam.lookAt(0, yAt(z + 12) + 1, z + 12);
  }
  if (f.t >= f.d && NET.role !== 'guest' && state === 'intro') beginCount();
}
function flySkip() { if (state === 'intro' && FLY && NET.role !== 'guest') FLY.t = FLY.d; }
$('fly').addEventListener('pointerdown', flySkip);
renderer.domElement.addEventListener('pointerdown', flySkip);
function beginCount() { specR = null; specOn = false; show('spec', false); show('joy', true); show('bJump', true); clearTimeout(autoT); show('intro', false); show('fly', false); FLY = null; show('playui', true); state = 'count'; count = 3.2; if (NET.role === 'host') netSend({ t: 'count' }); }
function finishRound() {
  state = 'result';
  const alive = field.filter(r => !r.out);
  let passed;
  if (MAP.type === 'race') passed = qual.slice(0, target);
  else if (MAP.type === 'survival') passed = FINAL ? (winner ? [winner] : survivors.slice(0, 1)) : survivors.slice();
  else passed = winner ? [winner] : field.filter(r => !r.out).sort((a, b) => (b.pos.y + b.pos.z * 0.1) - (a.pos.y + a.pos.z * 0.1)).slice(0, 1);
  if (passed.includes(me)) store.set('quals', store.get('quals', 0) + 1);
  const last = !tour || roundIdx === 2 || FINAL;
  if (NET.role === 'host') netSend({ t: 'res', p: passed.map(r => runners.indexOf(r)), last });
  showResult(passed, last);
  if (!last && (passed.includes(me) || (NET.role === 'host' && passed.some(r => r.remote)))) {
    // comme Stumble : ça enchaîne tout seul sur la manche suivante (map tirée au hasard)
    show('resNext', false); nextAction = null;
    $('resSub').textContent += passed.includes(me) ? '' : ' Tu regardes la suite.';
    autoNext(passed);
  } else {
    $('resNext').textContent = 'Rejouer'; show('resNext', true);
    nextAction = () => startGame(tour, mapKey);
  }
}
let vicLooks = [];
function restoreVictoryLooks() {
  for (const v of vicLooks) { const l = v.r.look; if (!l) continue; if (l.parent) l.parent.remove(l); v.r.inner.add(l); l.position.set(0, 0, 0); l.rotation.set(0, 0, 0); l.scale.setScalar(1); }
  vicLooks = [];
}
function celebrate(passed, won, gain, xpGain) {
  const rest = field.filter(r => !passed.includes(r)).sort((a, b) => (b.pos.z + b.pos.y * 3) - (a.pos.z + a.pos.y * 3));
  const top = passed.concat(rest).slice(0, 3);
  restoreVictoryLooks();
  UI.open('victory'); setShow([]);
  top.forEach((r, i) => {
    if (!r.look) return; vicLooks.push({ r });
    if (r.look.parent) r.look.parent.remove(r.look);
    showLooks.push({ look: r.look, k: i, spin: i }); showScene.add(r.look);
  });
  const nm = r => r ? (r === me ? 'Toi' : r.name) : '';
  $('vName1').textContent = nm(top[0]); $('vName2').textContent = nm(top[1]); $('vName3').textContent = nm(top[2]);
  const st = $('vStatus');
  if (FINAL) { st.textContent = won ? 'CHAMPION !' : (top[0] ? nm(top[0]) + ' gagne !' : 'Fin !'); st.style.background = won ? 'linear-gradient(#ffe36a,#ffb300)' : '#e24b4a'; }
  else { st.textContent = won ? 'QUALIFIÉ !' : 'ÉLIMINÉ'; st.style.background = won ? 'linear-gradient(#5fe07a,#22b04a)' : '#e24b4a'; }
  $('vR0').textContent = '+' + gain + ' pièces'; $('vR1').textContent = '+' + xpGain + ' XP'; $('vR2').textContent = 'Couronnes : ' + crowns;
  const inTour = tour && !FINAL;
  show('vReplayTxt', inTour || NET.role === 'guest');
  show('playui', false); show('result', false); countEl.textContent = '';
  startConfetti(); sfx(won ? 'win' : 'lose'); buzz(won ? 80 : 30);
}
$('vNext').addEventListener('click', () => { sfx('tap'); stopConfetti(); setShow([]); restoreVictoryLooks(); UI.open(null); show('result', true); });
$('vReplay').addEventListener('click', () => {
  sfx('tap'); stopConfetti();
  const inTour = tour && !FINAL;
  setShow([]); restoreVictoryLooks(); UI.open(null);
  if (inTour || NET.role === 'guest') { $('resHome').click(); return; }
  if (nextAction) nextAction();
});
/* confettis */
const cfx = $('confetti'), cctx = cfx.getContext('2d'); let conf = [], confOn = false;
function startConfetti() {
  cfx.classList.remove('hide'); confOn = true; conf = [];
  const W = cfx.width = innerWidth, H = cfx.height = innerHeight, cols = ['#ffd23f', '#ff4fa6', '#5fd6ff', '#7bff8a', '#b06cff', '#ffffff'];
  for (let i = 0; i < 150; i++) conf.push({ x: Math.random() * W, y: -Math.random() * H, vx: (Math.random() - .5) * 60, vy: 80 + Math.random() * 140, r: Math.random() * 6, vr: (Math.random() - .5) * 8, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] });
}
function stopConfetti() { confOn = false; cfx.classList.add('hide'); }
function drawConfetti(dt) {
  if (!confOn) return; const W = cfx.width, H = cfx.height; cctx.clearRect(0, 0, W, H);
  for (const p of conf) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r); cctx.fillStyle = p.c; cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r))); cctx.restore(); }
}
function showResult(passed, last) {
  state = 'result';
  const won = passed.includes(me);
  let gain = 0;
  if (won) gain = FINAL ? 100 : 20;
  coins += gain; store.set('coins', coins);
  const xpGain = 10 + (won ? (FINAL ? 60 : 25) : 0); xp += xpGain; store.set('xp', xp);
  if (won && FINAL) { crowns++; store.set('crowns', crowns); }

  const list = $('resList'); list.textContent = '';
  passed.slice(0, 8).forEach(r => { const li = document.createElement('li'); li.textContent = r.name; if (r === me) li.className = 'me'; list.appendChild(li); });
  if (FINAL) {
    $('resTitle').textContent = won ? 'VICTOIRE !' : 'Perdu de peu';
    $('resSub').textContent = won ? 'Tu as attrapé la couronne. +100 pièces.' : (passed[0] ? passed[0].name + ' a attrapé la couronne.' : 'Personne n\'a attrapé la couronne.');
  } else {
    $('resTitle').textContent = won ? 'Qualifié !' : 'Éliminé';
    $('resSub').textContent = won ? (last ? 'Bravo ! +20 pièces.' : '+20 pièces. Prochaine manche dans un instant…') : (MAP.type === 'race' ? 'Les places sont prises. Retente ta chance !' : 'Tu es tombé tout en bas. Retente ta chance !');
  }
  $('resTitle').style.color = won ? '#1d9e75' : '#e24b4a';
  if (NET.role === 'guest') { show('resNext', false); $('resSub').textContent += ' En attente de l\'hôte…'; }
  show('playui', false); show('bPunch', false);
  // comme Stumble Guys : bannière de fin sur le jeu, fondu, puis classement ; podium seulement à la toute fin
  const seq = ++resSeq;
  bannerShow(FINAL ? (won ? 'COURONNE !' : 'FIN DE LA FINALE !') : 'FIN DE LA MANCHE !', won ? (FINAL ? '' : 'Qualifié ✔') : 'Éliminé', 2200);
  setTimeout(() => {
    if (seq !== resSeq || state !== 'result') return;
    fadeTo(() => {
      if (last) { celebrate(passed, won, gain, xpGain); return; }
      // comme Stumble : tout le monde sur la plateforme, le sol s'ouvre sous les éliminés
      elimScene(passed, () => { if (seq !== resSeq || state !== 'result') return; const np = nextPassed; nextPassed = null; if (np) { if (!won) show('result', true); goNext(np); } else if (!won) fadeTo(() => { sfx('lose'); show('result', true); }); });
    });
  }, 2300);
}
/* ---- scène des éliminés entre les manches ---- */
let EL = null;
const ELIM_D = 6.4;
function elimScene(passed, done) {
  const g = new T.Group(), base = new T.Vector3(0, 85, -90); g.position.copy(base); world.add(g);
  const list = field.slice().sort(() => Math.random() - 0.5);
  const n = list.length, cols = Math.min(8, n), rows = Math.ceil(n / cols), sp = 1.7;
  const W = cols * sp + 2, Dp = rows * sp + 2;
  // plateforme faite case par case : sous chaque éliminé, un vrai trou ouvert sur le vide
  const fm = MAP.floor ? floorMat(MAP.floor) : PM(0x7f4dff), holes = new Set();
  list.forEach((r, i) => { if (!passed.includes(r)) holes.add(i); });
  const cellAt = (row, col) => { const inRow = Math.min(cols, n - row * cols); const c = col - Math.floor((cols - inRow) / 2); return c >= 0 && c < inRow ? row * cols + c : -1; };
  for (let row = -1; row <= rows; row++) for (let col = -1; col <= cols; col++) {
    const idx = row >= 0 && row < rows && col >= 0 && col < cols ? cellAt(row, col) : -1;
    if (idx >= 0 && idx < n && holes.has(idx)) {
      const pit = new T.Mesh(new T.BoxGeometry(sp - 0.05, 1.2, sp - 0.05), new T.MeshBasicMaterial({ color: 0x120826, side: T.BackSide }));
      pit.position.set((col - (cols - 1) / 2) * sp, -0.62, (row - (rows - 1) / 2) * sp); pit.scale.set(1, 1, 1); g.add(pit);
      continue;
    }
    const b = new T.Mesh(new T.BoxGeometry(sp, 1.2, sp), fm); b.position.set((col - (cols - 1) / 2) * sp, -0.6, (row - (rows - 1) / 2) * sp); g.add(b);
  }
  const rimM = PM(0xffd23f), RW = (cols + 2) * sp, RD = (rows + 2) * sp;
  [[0, -RD / 2, RW, 0.3], [0, RD / 2, RW, 0.3], [-RW / 2, 0, 0.3, RD], [RW / 2, 0, 0.3, RD]].forEach(([x, z, w, d]) => { const m = new T.Mesh(new T.BoxGeometry(w + 0.3, 0.5, d + 0.3), rimM); m.position.set(x, 0.05, z); g.add(m); });
  const items = list.map((r, i) => {
    const row = Math.floor(i / cols), col0 = i % cols, inRow = Math.min(cols, n - row * cols), col = col0 + Math.floor((cols - inRow) / 2);
    const x = (col - (cols - 1) / 2) * sp, z = (row - (rows - 1) / 2) * sp;
    const ok = passed.includes(r);
    const door = new T.Group(); door.position.set(x - (sp - 0.04) / 2, 0.02, z); g.add(door);
    const tile = new T.Mesh(new T.BoxGeometry(sp - 0.04, 0.08, sp - 0.04), PM(ok ? 0x5be36a : 0xff4f6a)); tile.position.x = (sp - 0.04) / 2; door.add(tile);
    tile.material = PM(0xb48aff);
    r.mesh.visible = true; r.out = false; r.pos.set(base.x + x, base.y, base.z + z); r.yaw = 0; r.inner.rotation.set(0, 0, 0); r.inner.position.y = 0;
    return { r, ok, door, tile, x, z, vy: 0, fall: false, y: 0, at: 1.3 + Math.random() * 0.3 };
  });
  // les trappes s'ouvrent une par une
  const outs = items.filter(o => !o.ok); outs.forEach((o, k) => { o.at = 1.4 + k * Math.min(0.28, 2.4 / Math.max(1, outs.length)); });
  if (me && field.includes(me)) { const ring = new T.Mesh(new T.TorusGeometry(0.62, 0.08, 8, 32), new T.MeshBasicMaterial({ color: 0xffd23f })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; const it = items.find(o => o.r === me); it.door.add(ring); ring.position.x = (sp - 0.04) / 2; }
  EL = { g, base, items, t: 0, done, cheered: false };
  show('playui', false); show('elimTag', false);
}
function elimUpdate(dt) {
  const E = EL; E.t += dt;
  for (const o of E.items) {
    const r = o.r;
    if (!o.ok && E.t >= o.at) {
      if (!o.fall) { o.fall = true; o.tile.material = PM(0xff4f6a); if (r === me || Math.random() < 0.4) sfx('punch'); }
      o.door.rotation.z = Math.max(-1.9, o.door.rotation.z - dt * 9);
      o.vy -= 22 * dt; o.y += o.vy * dt; r.inner.rotation.z += dt * 6; r.inner.rotation.x += dt * 3;
    }
    if (o.ok && E.t > 3.6) { o.y = Math.abs(Math.sin((E.t - 3.6) * 7 + o.x)) * 0.7; if (!o.cheer) { o.cheer = true; o.tile.material = PM(0x5be36a); if (Math.random() < 0.6 || r === me) showEmote(r, ['👋', '👍', '🕺', '😂', '😎', '🏆'][(Math.random() * 6) | 0]); } }
    r.pos.set(E.base.x + o.x, E.base.y + o.y, E.base.z + o.z);
    r.mesh.position.copy(r.pos); r.mesh.rotation.y = 0;
    if (r.look) animLook(r.look, time * 10 + r.ph, o.fall ? 0.6 : 0);
    if (o.y < -40) r.mesh.visible = false;
  }
  if (!E.cheered && E.t > 3.6) { E.cheered = true; burst(E.base.x, E.base.y + 2, E.base.z, 40); const won = E.items.some(o => o.ok && o.r === me); if (me && field.includes(me)) { const t = $('elimTag'); t.textContent = won ? 'QUALIFIÉ ! ✔' : 'ÉLIMINÉ'; t.style.background = won ? 'rgba(29,158,117,.9)' : 'rgba(200,40,60,.9)'; show('elimTag', true); sfx(won ? 'win' : 'lose'); } }
  cam.position.set(E.base.x + Math.sin(E.t * 0.25) * 1.5, E.base.y + 4.2, E.base.z + 10.5 - E.t * 0.25);
  cam.lookAt(E.base.x, E.base.y + 0.6, E.base.z);
  if (E.t >= ELIM_D) elimEnd();
}
function elimEnd() {
  const E = EL; if (!E) return; EL = null; show('elimTag', false);
  if (E.g.parent) E.g.parent.remove(E.g);
  for (const o of E.items) { o.r.inner.rotation.set(0, 0, 0); if (!o.ok) { o.r.mesh.visible = false; o.r.out = true; } }
  E.done();
}
let resSeq = 0, bannerT = null;
function bannerShow(big, small, ms) {
  const b = $('banner'); b.textContent = big;
  if (small) { const s = document.createElement('small'); s.textContent = small; b.appendChild(s); }
  b.classList.remove('hide', 'bpop'); void b.offsetWidth; b.classList.add('bpop');
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.add('hide'), ms || 1800);
}
function fadeTo(cb) {
  const f = $('fade'); f.style.opacity = 1;
  setTimeout(() => { $('banner').classList.add('hide'); try { cb(); } finally { setTimeout(() => { f.style.opacity = 0; }, 60); } }, 340);
}

/* ---------- En ligne (2 joueurs, relais public) ---------- */
const NET = { role: 'solo', code: '', client: null, base: '', peerCi: null, rin: { x: 0, z: 0, j: 0, d: 0, p: 0 }, seen: { j: 0, d: 0, p: 0 }, out: { j: 0, d: 0, p: 0 }, sendT: 0, snap: null, hostCi: null, joined: false, pendingRound: null, busy: false };
const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
function netStatus(t) { $('onStatus').textContent = t || 'Crée un salon ou tape le code de ton ami'; const c = $('onCode'); if (!NET.code) c.textContent = ''; c.classList.toggle('empty', !NET.code); c.dataset.hint = 'Appuie sur CRÉER'; }
function netSend(o) { if (!NET.client || !NET.client.connected) return; try { NET.client.publish(NET.base + (NET.role === 'host' ? 'h' : 'g'), JSON.stringify(o)); } catch (e) { } }
function netConnect(onReady) {
  if (typeof mqtt === 'undefined') { netStatus('Le module en ligne ne s\'est pas chargé. Recharge la page.'); return; }
  let i = 0, ready = false;
  const fail = () => { i++; if (i < BROKERS.length) tryOne(); else netStatus('Connexion impossible. Vérifie Internet et réessaie.'); };
  const tryOne = () => {
    let c = null;
    try { c = mqtt.connect(BROKERS[i], { clientId: 'zaki_' + Math.random().toString(36).slice(2, 10), connectTimeout: 7000, reconnectPeriod: 2000, clean: true, keepalive: 30 }); } catch (e) { c = null; }
    if (!c) { fail(); return; }
    const timer = setTimeout(() => { if (!ready) { try { c.end(true); } catch (e) { } fail(); } }, 8000);
    c.on('connect', () => {
      clearTimeout(timer);
      c.subscribe(NET.base + (NET.role === 'host' ? 'g' : 'h'));
      if (!ready) { ready = true; NET.client = c; onReady(); }
    });
    c.on('message', (t, m) => { let o; try { o = JSON.parse(m.toString()); } catch (e) { return; } onNet(o); });
    c.on('offline', () => { if (ready) toast('Connexion perdue…'); });
    c.on('error', () => { });
  };
  tryOne();
}
function netLeave() { try { if (NET.client) NET.client.end(true); } catch (e) { } Object.assign(NET, { client: null, role: 'solo', peerCi: null, code: '', joined: false, snap: null, pendingRound: null }); $('onCode').textContent = ''; show('onStart', false); show('onQuick', false); netStatus(''); }
function newCode() { const L = 'ABCDEFGHJKMNPRSTUVWXYZ'; let c = ''; for (let i = 0; i < 4; i++) c += L[(Math.random() * L.length) | 0]; return c; }
$('onClose').addEventListener('click', () => openPage('lobby'));
$('onCreate').addEventListener('click', () => {
  netLeave(); NET.role = 'host'; NET.code = newCode(); NET.base = 'zakigame7/' + NET.code + '/';
  $('onCode').textContent = NET.code; netStatus('Connexion…');
  netConnect(() => netStatus('Donne ce code à ton ami ✔'));
});
$('onJoin').addEventListener('click', () => {
  const code = ($('onInput').value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (code.length !== 4) { netStatus('Code de 4 lettres'); return; }
  netLeave(); NET.role = 'guest'; NET.code = code; NET.base = 'zakigame7/' + code + '/';
  $('onCode').textContent = code; netStatus('Connexion…');
  netConnect(() => {
    netStatus('Recherche du salon…');
    const knock = () => { if (NET.role !== 'guest' || NET.joined) return; netSend({ t: 'join', ci: myChar, pu: hasPunch ? 1 : 0, tr: myTrail }); setTimeout(knock, 2000); };
    knock();
  });
});
$('onStart').addEventListener('click', () => { UI.open(null); startGame(true); });
$('onQuick').addEventListener('click', () => openPage('maps'));
function onNet(o) {
  if (NET.role === 'host') {
    if (o.t === 'emo') { const r = runners.find(x => x.remote); if (r) showEmote(r, o.e); }
    if (o.t === 'join') { NET.peerPunch = !!o.pu; NET.peerTrail = o.tr || 'none'; NET.peerCi = o.ci === myChar ? (myChar === 19 ? 18 : 19) : o.ci; netSend({ t: 'welcome', ci: myChar, tr: myTrail }); netStatus(CHARS[NET.peerCi][0] + ' est là !'); show('onStart', true); show('onQuick', true); }
    else if (o.t === 'in') NET.rin = o;
    else if (o.t === 'me') NET.rst = o;
    return;
  }
  if (NET.role !== 'guest') return;
  if (o.t === 'emo' && runners[o.i]) showEmote(runners[o.i], o.e);
  if (o.t === 'welcome') { NET.hostCi = o.ci; NET.hostTrail = o.tr || 'none'; if (!NET.joined) { NET.joined = true; netStatus('Connecté ! Attends le lancement…'); } }
  else if (o.t === 'start') guestStart(o);
  else if (o.t === 'roul') { roundIdx = o.ri; fadeTo(() => { show('result', false); roulette(o.key, o.ri, () => {}); }); }
  else if (o.t === 'round') guestRound(o);
  else if (o.t === 'count') { if (MAP && state === 'intro') { show('intro', false); show('fly', false); FLY = null; show('playui', true); state = 'count'; count = 3.2; } }
  else if (o.t === 's') { NET.snap = o; NET.snapNew = true; }
  else if (o.t === 'kb') { if (me && !me.out) { me.vel.set(o.vx, o.vy, o.vz); me.stun = 0.75; me.grounded = false; me.inv = 0.3; } }
  else if (o.t === 'res') { if (MAP && runners.length) { const passed = o.p.map(i => runners[i]).filter(Boolean); showResult(passed, o.last); } }
  else if (o.t === 'home') { enterLobby(); show('online', true); netStatus('L\'hôte prépare la suite…'); }
}
async function guestStart(o) {
  NET.joined = true; NET.busy = true; tour = o.tour;
  show('online', false); show('lobby', false); show('result', false); show('intro', false); show('loading', true);
  let done = 0; $('loadBar').style.width = '0%';
  await Promise.all(o.ids.map(i => loadChar(i).then(() => { done++; $('loadBar').style.width = (done / o.ids.length * 100) + '%'; $('loadTxt').textContent = 'Chargement des persos… ' + done + '/' + o.ids.length; })));
  await prepRunners(o.ids, 1);
  runners[0].name = 'Hôte (' + CHARS[o.ids[0]][0] + ')';
  NET.busy = false;
  if (NET.pendingRound) { const r = NET.pendingRound; NET.pendingRound = null; guestRound(r); }
}
function guestRound(o) {
  if (NET.busy || !runners.length) { NET.pendingRound = o; return; }
  mapKey = o.key; MAP = MAPS[o.key]; roundIdx = o.ri; target = o.tg; tour = o.tour;
  applyMode(o.key, !!o.fin);
  buildMap(MAP);
  if (FINAL && MAP.type !== 'final') { const fz = MAP.type === 'survival' ? 10 : (finishZ || 0) + 1, gp = groundAt(0, fz, 300); crownAt(0, (gp ? gp.top : 0) + (MAP.type === 'survival' ? 6 : 6.5), fz); }
  field = o.f.map(i => runners[i]).filter(Boolean);
  qual = []; winner = null; clock = MAP.time; NET.snap = null;
  for (const r of runners) { const inF = field.includes(r); r.mesh.visible = inF; r.out = !inF; r.done = false; r.pos.set(0, -50, 0); r.tgt = null; r.vel.set(0, 0, 0); r.cpi = 0; r.stun = 0; r.dive = 0; }
  NET.snapNew = false; NET.sendT = 0;
  introUI(field.length);
}
function remoteInput() {
  const o = NET.rin, s = NET.seen;
  const inp = { x: +o.x || 0, z: +o.z || 0, jump: o.j !== s.j, dive: o.d !== s.d, punch: o.p !== s.p };
  s.j = o.j; s.d = o.d; s.p = o.p;
  if (state !== 'play') { inp.x = 0; inp.z = 0; }
  return inp;
}
function hostSend(dt) {
  if (!NET.client || !runners.length || state === 'result') return;
  NET.sendT -= dt; if (NET.sendT > 0) return; NET.sendT = 1 / 20;
  const R = v => Math.round(v * 100) / 100;
  const o = { t: 's', tm: R(time), st: state, ck: R(clock), q: qual.map(r => runners.indexOf(r)) };
  o.r = field.map(r => [runners.indexOf(r), R(r.pos.x), R(r.pos.y), R(r.pos.z), R(r.yaw), (r.stun > 0 ? 1 : 0) | (r.dive > 0 ? 2 : 0) | (r.punch > 0 ? 4 : 0) | (r.out ? 8 : 0) | (r.done ? 16 : 0) | (r.grounded ? 32 : 0), R(Math.hypot(r.vel.x, r.vel.z)), R(Math.max(0, r.pcd))]);
  o.b = balls.map(b => [R(b.m.position.x), R(b.m.position.y), R(b.m.position.z)]);
  if (hexes.length) o.hx = hexes.map(p => p.alive ? (p.t >= 0 ? 1 : 0) : 2).join('');
  netSend(o);
}
/* ---- en ligne : chaque téléphone calcule son propre perso (zéro latence), l'hôte gère le reste ---- */
function remoteApply(r, dt) {
  const s = NET.rst; if (!s || r.out) return;
  if (s.p !== NET.seen.p) { NET.seen.p = s.p; doPunch(r); }
  const far = Math.hypot(s.x - r.pos.x, s.y - r.pos.y, s.z - r.pos.z) > 4, k = far ? 1 : 1 - Math.exp(-18 * dt);
  r.pos.x += (s.x - r.pos.x) * k; r.pos.y += (s.y - r.pos.y) * k; r.pos.z += (s.z - r.pos.z) * k;
  r.vel.set(s.vx, s.vy, s.vz); r.yaw = lerpAngle(r.yaw, s.yw, k);
  r.grounded = !!(s.f & 1); r.dive = s.f & 2 ? 0.1 : 0; r.stun = s.f & 4 ? 0.1 : 0; r.cpi = Math.max(r.cpi, s.c | 0);
  r.pcd -= dt; r.punch -= dt; r.inv -= dt;
  if (r.grounded) { const gp = groundAt(r.pos.x, r.pos.z, r.pos.y + 0.05); if (gp && gp.hex && !gp.disc && gp.t < 0) gp.t = 1.5; }
  if (MAP.type === 'survival' && r.pos.y < -28) { r.out = true; outList.push(r); r.mesh.visible = false; return; }
  if (state === 'play' && !r.done) {
    if (MAP.type === 'race' && r.pos.z > finishZ && r.pos.y > (MAP.finY != null && MAP.type0 === 'final' ? MAP.finY : -1)) { r.done = true; qual.push(r); if (FINAL && !winner) { winner = r; crownOnHead(r); } }
    if (MAP.type === 'final' && crown && !winner && Math.hypot(r.pos.x - crown.x, r.pos.y + 0.7 - crown.y, r.pos.z - crown.z) < 1.4) { winner = r; r.done = true; qual = [r]; crownOnHead(r); toast(r.name + ' a la couronne'); }
  }
}
function guestLocal(dt) {
  if (!me || !field.includes(me) || me.out) return;
  if (state === 'play' || state === 'end') {
    let inp = state === 'play' ? playerInput() : { x: 0, z: 0 };
    if (me.done) inp = { x: 0, z: 0 };
    if (inp.punch) { NET.out.p++; inp.punch = false; }
    if (me.done && state === 'end') { inp.x = 0; inp.z = 0; }
    step(me, inp, dt);
    for (const o of field) { if (o === me || o.out) continue; const dx = me.pos.x - o.pos.x, dz = me.pos.z - o.pos.z, d = Math.hypot(dx, dz); if (d < 0.9 && d > 0.001 && Math.abs(me.pos.y - o.pos.y) < 1) { me.pos.x += dx / d * (0.9 - d); me.pos.z += dz / d * (0.9 - d); } }
    const hs = Math.hypot(me.vel.x, me.vel.z); if (hs > 0.6 && me.stun <= 0 && me.dive <= 0) me.yaw = lerpAngle(me.yaw, Math.atan2(me.vel.x, me.vel.z), 1 - Math.exp(-12 * dt));
  } else { jumpQ = diveQ = punchQ = false; }
  if (NET.client && state !== 'result') {
    NET.sendT -= dt;
    if (NET.sendT <= 0) {
      NET.sendT = 1 / 20; const R = v => Math.round(v * 100) / 100;
      netSend({ t: 'me', x: R(me.pos.x), y: R(me.pos.y), z: R(me.pos.z), vx: R(me.vel.x), vy: R(me.vel.y), vz: R(me.vel.z), yw: R(me.yaw), f: (me.grounded ? 1 : 0) | (me.dive > 0 ? 2 : 0) | (me.stun > 0 ? 4 : 0), c: me.cpi, p: NET.out.p });
    }
  }
}
function guestFrame(dt) {
  const o = NET.snap; if (!o) return;
  if (NET.snapNew) {
    NET.snapNew = false;
    // horloge douce : les obstacles avancent tout seuls, on se recale petit à petit sur l'hôte
    if (Math.abs(o.tm - time) > 1) time = o.tm; else time += (o.tm + 0.06 - time) * 0.25;
    clock = o.ck;
    if (o.st === 'play' && state === 'count' && count < 0.6) { state = 'play'; setTimeout(() => { if (state !== 'count') countEl.textContent = ''; }, 700); }
    if ((o.st === 'play' || o.st === 'count') && state === 'intro') { show('intro', false); show('fly', false); FLY = null; show('playui', true); state = o.st === 'play' ? 'play' : 'count'; count = o.st === 'play' ? 0 : 3.2; if (state === 'play') countEl.textContent = ''; }
    if (o.st === 'end' && (state === 'play' || state === 'count')) { state = 'end'; countEl.textContent = ''; }
    qual = o.q.map(i => runners[i]).filter(Boolean);
    if (MAP && FINAL && qual[0] && crown && !crown.head) crownOnHead(qual[0]);
    while (balls.length < o.b.length) balls.push(rollMesh());
    while (balls.length > o.b.length) { const b = balls.pop(); world.remove(b.m); }
    o.b.forEach((p, i) => balls[i].m.position.set(p[0], p[1], p[2]));
    if (o.hx && o.hx.length === hexes.length) for (let i = 0; i < hexes.length; i++) {
      const p = hexes[i], c = o.hx[i];
      if (c === '1' && p.alive && p.t < 0) p.t = 1.5;
      if (c === '2' && p.alive) { p.alive = false; p.vy = 0; }
    }
    for (const a of o.r) {
      const r = runners[a[0]]; if (!r) continue;
      if (r === me) { if (r.pos.y < -40 || state === 'count' || state === 'intro') { r.pos.set(a[1], a[2], a[3]); r.yaw = a[4]; } if (a[5] & 16) r.done = true; if (a[5] & 8 && !r.out) { r.out = true; r.mesh.visible = false; } r.pcd = a[7]; if (a[5] & 4) r.punch = 0.1; continue; }
      r.tgt = a;
    }
  }
  // les autres joueurs glissent en douceur vers leur dernière position connue
  const k = 1 - Math.exp(-12 * dt);
  for (const r of runners) {
    const a = r.tgt; if (!a || r === me) continue;
    if (r.pos.y < -40) r.pos.set(a[1], a[2], a[3]); else { r.pos.x += (a[1] - r.pos.x) * k; r.pos.y += (a[2] - r.pos.y) * k; r.pos.z += (a[3] - r.pos.z) * k; }
    r.yaw = lerpAngle(r.yaw, a[4], k);
    r.stun = a[5] & 1 ? 0.1 : 0; r.dive = a[5] & 2 ? 0.1 : 0; r.punch = a[5] & 4 ? 0.1 : 0; r.out = !!(a[5] & 8); r.done = !!(a[5] & 16); r.grounded = !!(a[5] & 32);
    r.vel.set(0, 0, a[6]); r.pcd = a[7]; r.mesh.visible = !r.out;
  }
  // objets qui roulent : ils continuent d'avancer entre deux nouvelles de l'hôte
  for (const b of balls) { if (MAP.roll === 'meteorite') { b.m.position.y -= 26 * dt; b.spin.rotation.y += 2 * dt; } else { b.m.position.z -= 7 * dt; b.spin.rotation.x -= 3.2 * dt; } }
}

/* ---------- Boucle ---------- */
const lerpAngle = (a, b, k) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * k; };
const camT = new T.Vector3(), look = new T.Vector3();
let last = performance.now();
function updateWorld(dt) {
  for (const s of sweepers) { s.a = s.a0 + s.w * time; s.piv.rotation.y = s.a; }
  for (const b of blocks) {
    if (b.hitT > 0) { b.hitT -= dt; const k = Math.sin((0.45 - b.hitT) / 0.45 * Math.PI * 3) * Math.max(0, b.hitT) * 0.5; b.m.scale.set(1 + k, 1 - k, 1 + k); b.m.position.y = b.y * k; } else if (b.m.scale.y !== 1) { b.m.scale.set(1, 1, 1); b.m.position.y = 0; }
    if (b.laugh) { b.laughT -= dt; const t = 1.3 - b.laughT, k = t < 0.2 ? t / 0.2 * 1.2 : b.laughT < 0.25 ? Math.max(0, b.laughT / 0.25) : 1.1; b.laugh.scale.setScalar(1.2 * k); b.laugh.position.set(b.x, b.y + 3.1 + Math.sin(t * 8) * 0.08, b.z); if (b.laughT <= 0) { world.remove(b.laugh); b.laugh = null; } }
  }
  for (const b of blocks) { const nx = b.bx + b.amp * Math.sin(time * b.spd + b.ph); b.vx = (nx - b.x) / Math.max(dt, 1e-4); b.x = nx; if (b.hammer) { b.m.position.x = nx; b.m.rotation.z = -Math.cos(time * b.spd + b.ph) * 0.12; } else b.m.position.x = nx; }
  for (const p of movers) { const nx = p.bx + p.amp * Math.sin(time * p.spd + p.ph); p.vx = (nx - p.cx) / Math.max(dt, 1e-4); p.cx = nx; p.x0 = nx - p.hw; p.x1 = nx + p.hw; p.mesh.position.x = nx; }
  for (const p of plats) if (p.tramp) { p.squash = Math.max(0, (p.squash || 0) - dt * 4); const k = p.squash; p.tramp.scale.set(1 + k * 0.12, 1 - k * 0.45, 1 + k * 0.12); }
  for (const p of hexes) {
    if (p.alive && p.t >= 0) { if (NET.role !== 'guest') p.t -= dt; else p.t = Math.max(0.05, p.t - dt); p.mesh.material = PM(Math.floor(p.t * 20) % 2 ? 0xffffff : p.c, 50); p.mesh.position.x = p.cx + (Math.random() - 0.5) * 0.12; p.mesh.position.z = p.cz + (Math.random() - 0.5) * 0.12; if (p.t <= 0 && NET.role !== 'guest') { p.alive = false; p.vy = 0; } }
    else if (!p.alive && p.mesh.visible) { p.vy -= 20 * dt; p.mesh.position.y += p.vy * dt; if (p.mesh.position.y < -40) p.mesh.visible = false; }
  }
  if (crown && !crown.head) { crown.g.rotation.y += dt * 1.5; crown.g.position.y = crown.y + Math.sin(time * 2) * 0.15; }
  if (state === 'play' && NET.role !== 'guest') for (const s of spawners) { s.t -= dt; if (s.t <= 0) { s.t = s.every; const b = rollMesh(); b.m.position.set(s.x0 + Math.random() * (s.x1 - s.x0), s.top + 1, s.zs); b.ze = s.ze; balls.push(b); } }
  if (state === 'play' && NET.role !== 'guest' && MAP.meteors) meteorTick(dt);
  if (NET.role !== 'guest') for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i], m = b.m;
    if (b.hex) { // météorite qui tombe sur une case
      m.position.y -= 26 * dt; b.spin.rotation.y += 2 * dt; b.spin.rotation.x += 1.3 * dt;
      if (m.position.y <= b.hex.top + 1.1) { const p = b.hex; if (p.alive && p.t < 0) p.t = 0.45; burst(m.position.x, m.position.y, m.position.z, 14); if (me && m.position.distanceTo(me.pos) < 14) sfx('punch'); world.remove(m); balls.splice(i, 1); }
      continue;
    }
    m.position.z -= 7 * dt; b.spin.rotation.x -= 3.2 * dt; if (m.position.z < b.ze) { world.remove(m); balls.splice(i, 1); }
  }
}
function loop(now) {
  checkSize(); // l'iPhone change la taille de l'écran après coup (barre Safari, rotation) : on recale à chaque image
  const dtR = (now - last) / 1000; if (dtR > 0 && dtR < 0.5) autoRes(dtR);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  if (EL && !UI.cur) { elimUpdate(dt); }
  else if (state === 'lobby') {
  } else if (MAP && me && UI.cur !== 'victory') {
    updateWorld(dt);
    if (state === 'count') {
      count -= dt; { const cv = count > 0.2 ? String(Math.ceil(count - 0.2)) : 'GO !'; if (countEl.textContent !== cv) { countEl.textContent = cv; countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop'); if (cv === 'GO !') sfx('win'); else sfx('tap'); } }
      if (count <= 0 && NET.role !== 'guest') { state = 'play'; setTimeout(() => { if (state !== 'count') countEl.textContent = ''; }, 700); }
    }
    if (NET.role === 'guest') { guestLocal(dt); guestFrame(dt); }
    else if (state === 'play' || state === 'end') {
      for (const r of field) { if (r.remote) remoteApply(r, dt); else step(r, r.bot ? botInput(r, dt) : (state === 'play' && !r.done ? playerInput() : (r === me && playerInput(), { x: 0, z: 0 })), dt); }
      for (let i = 0; i < field.length; i++) for (let j = i + 1; j < field.length; j++) {
        const a = field[i], b = field[j]; if (a.out || b.out) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.9 && d > 0.001 && Math.abs(a.pos.y - b.pos.y) < 1) { const o = (0.9 - d) / 2, nx = dx / d, nz = dz / d; a.pos.x -= nx * o; a.pos.z -= nz * o; b.pos.x += nx * o; b.pos.z += nz * o; }
      }
    }
    if (state === 'play' && NET.role !== 'guest') {
      clock -= dt;
      const alive = field.filter(r => !r.out).length;
      const over = clock <= 0 || (FINAL && winner) || (MAP.type === 'race' && qual.length >= target) || (MAP.type === 'survival' && (alive <= target || (me.out && !me.bot && !field.some(r => r.remote && !r.out)))) || (MAP.type === 'final' && winner);
      if (over) { clock = Math.max(0, clock); state = 'end'; endT = FINAL && winner ? 3.2 : 1.4; if (FINAL && !winner && MAP.type === 'survival') { const last1 = field.filter(r => !r.out)[0] || outList[outList.length - 1]; if (last1) { winner = last1; crownOnHead(last1); } } survivors = field.filter(r => !r.out); if (MAP.type === 'survival') for (let i = outList.length - 1; i >= 0 && survivors.length < target; i--) survivors.push(outList[i]); }
    }
    if (state === 'end' && NET.role !== 'guest') { endT -= dt; if (endT <= 0) finishRound(); }
    if (NET.role === 'host') hostSend(dt);
    for (const r of field) {
      const hs = Math.hypot(r.vel.x, r.vel.z);
      if (NET.role !== 'guest' && hs > 0.6 && r.stun <= 0 && r.dive <= 0) r.yaw = lerpAngle(r.yaw, Math.atan2(r.vel.x, r.vel.z), 1 - Math.exp(-12 * dt));
      r.mesh.position.copy(r.pos); r.mesh.rotation.y = r.yaw;
      { const sh = r.mesh.userData.shadow; if (sh) { const gp = r.mesh.visible && !r.out ? groundAt(r.pos.x, r.pos.z, r.pos.y + 0.05) : null; sh.visible = !!gp && r.pos.y - gp.top < 6; if (gp) { sh.position.set(r.pos.x, gp.top + 0.03, r.pos.z); const k = Math.max(0.35, 1 - (r.pos.y - gp.top) * 0.15); sh.scale.setScalar(k); } } }
      r.inner.rotation.x = r.dive > 0 ? 1.25 : 0;
      r.inner.rotation.z = r.stun > 0 ? Math.sin(time * 30) * 0.35 : 0;
      r.inner.position.y = r.grounded && hs > 1 ? Math.abs(Math.sin(time * 14 + r.ph)) * 0.08 : 0;
      if (r.look) animLook(r.look, time * 13 + r.ph, r.grounded ? Math.min(1, hs / 5) * 0.9 : 0.35);
      r.fist.visible = r.punch > 0;
      if (r.arrow) r.arrow.position.y = 2.2 + Math.sin(time * 4) * 0.12;
    }
    const surv = MAP.type === 'survival';
    const live = field.filter(r => !r.out && !r.done).sort((a, b) => (b.pos.z + b.pos.y) - (a.pos.z + a.pos.y));
    const spectating = !(field.includes(me) && !me.out && !(me.done && state === 'play'));
    let cs = me;
    if (spectating) { const pool = live.length ? live : field.filter(r => !r.out); if (!pool.includes(specR)) specR = pool.find(r => r.remote) || pool[0] || me; cs = specR || me; }
    const showSpec = spectating && (state === 'play') && live.length > 0;
    if (showSpec !== specOn) { specOn = showSpec; show('spec', showSpec); show('joy', !showSpec); show('bJump', !showSpec); show('bPunch', !showSpec && hasPunch); show('bEmo', !showSpec || true); }
    if (showSpec && cs) { const nm = 'Tu regardes : ' + cs.name; if ($('spName').textContent !== nm) $('spName').textContent = nm; }
    const py = Math.max(cs.pos.y, surv ? -22 : -40);
    const D = surv ? 8.5 : 8, H = (surv ? 7 : 5.2) + camPitch * 6, fx = Math.sin(camYaw), fz = Math.cos(camYaw), free = Math.abs(camYaw) > 0.05;
    const bx = free ? cs.pos.x : cs.pos.x * (surv ? 0.9 : 0.6), lx = free ? cs.pos.x : cs.pos.x * (surv ? 0.95 : 0.8);
    camT.set(bx - fx * D, py + H, cs.pos.z - fz * D);
    cam.position.lerp(camT, 1 - Math.exp(-(camDrag.id !== null ? 14 : 6) * dt));
    look.set(lx + fx * 6, py + 1, cs.pos.z + fz * 6); cam.lookAt(look);
    if (state === 'intro' && FLY) flyCam(dt);
    if (window.__freeCam) { const c = window.__freeCam; cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); if (c[6]) { cam.fov = c[6]; cam.updateProjectionMatrix(); } }
    const n = field.length;
    const hqT = MAP.type === 'race' ? `Qualifiés ${Math.min(qual.length, target)}/${target}` : MAP.type === 'survival' ? `En vie ${field.filter(r => !r.out).length} · ${target} places` : 'Attrape la couronne !';
    const hq = $('hq'); if (hq.textContent !== hqT) { hq.textContent = hqT; hq.classList.remove('bump'); void hq.offsetWidth; hq.classList.add('bump'); }
    const c = Math.ceil(Math.max(0, clock)); $('ht').textContent = `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}`;
    const pb = $('bPunch'), cd = Math.max(0, me.pcd);
    pb.dataset.cd = cd > 0 ? Math.ceil(cd) : ''; pb.style.setProperty('--p', (cd / 8 * 100) + '%');
  }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.style.opacity = 0; }
  drawConfetti(dt);
  if (!UI.cur && world) livingUpdate(dt);
  if (UI.cur) { placeShow(); renderer.render(showScene, showCam); } else renderer.render(scene, cam);
  requestAnimationFrame(loop);
}
enterLobby();
requestAnimationFrame(loop);
window.__zaki = { walk(n) { for (let i = 0; i < n; i++) { time += 1 / 30; updateWorld(1 / 30); step(me, { x: 0, z: 1 }, 1 / 30); if (me.stun > 0.3) return i; } return -1; }, force(k) { FORCEK = k; }, probe(x, z) { const rc = new T.Raycaster(new T.Vector3(x, 30, z), new T.Vector3(0, -1, 0)); const objs = []; world.traverse(o => { if (o.isMesh && o.visible) objs.push(o); }); return rc.intersectObjects(objs, false).slice(0, 4).map(h => [Math.round(h.point.y * 100) / 100, h.object.name || h.object.material.type]); }, audit() {
    const rc = new T.Raycaster(), out = [], objs = [];
    world.traverse(o => { if (o.isMesh && o.visible) { let p = o, isR = false; while (p) { if (runners.some(r => r.mesh === p)) { isR = true; break; } p = p.parent; } if (!isR) objs.push(o); } });
    for (const p of plats) {
      if (p.mov || p.kind === 'pad' || (p.hex && !p.disc)) continue;
      if (p.hex) { p.x0 = p.cx - p.rad; p.x1 = p.cx + p.rad; p.z0 = p.cz - p.rad; p.z1 = p.cz + p.rad; }
      let miss = 0, tot = 0, mx0 = 1e9, mx1 = -1e9, mz0 = 1e9, mz1 = -1e9;
      for (let x = p.x0 + 0.25; x < p.x1; x += 0.5) for (let z = p.z0 + 0.25; z < p.z1; z += 0.5) {
        if (p.hex && (x - p.cx) ** 2 + (z - p.cz) ** 2 > p.rad * p.rad) continue;
        tot++; rc.set(new T.Vector3(x, p.top + 2.5, z), new T.Vector3(0, -1, 0)); rc.far = 3.3;
        const hs = rc.intersectObjects(objs, false);
        if (!hs.some(h => Math.abs(h.point.y - p.top) < 0.6)) { const kx = Math.round(x * 2) / 2; (p._mx = p._mx || {})[kx] = ((p._mx || {})[kx] || 0) + 1; miss++; mx0 = Math.min(mx0, x); mx1 = Math.max(mx1, x); mz0 = Math.min(mz0, z); mz1 = Math.max(mz1, z); }
      }
      if (miss / tot > 0.01) out.push({ x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, top: p.top, pct: Math.round(miss / tot * 100), byX: p._mx, miss: [mx0, mx1, mz0, mz1].map(v => Math.round(v * 10) / 10) });
    }
    return out;
  }, endTest() { qual = field.filter((r, i) => i % 2 === 0 || r === me).slice(0, target); qual.forEach(r => { r.done = true; }); clock = 0.01; }, flyT: () => FLY && FLY.t, elT: () => EL && EL.t, trailN: () => [trailPool.length, trailPool.filter(p => p.life > 0).length, !!trailOf(me), state, trailT.toFixed(3)].join(','), ff(sec) { count = 0.01; state = 'play'; countEl.textContent = ''; for (let i = 0; i < sec * 30; i++) { time += 1 / 30; updateWorld(1 / 30); } }, openPage, celebrate: (...a) => celebrate(...a), get state() { return state; }, get field() { return field; }, get qual() { return qual; }, get me() { return me; }, get clock() { return clock; }, get MAP() { return MAP; }, startGame, finishRound, beginCount, get winner() { return winner; }, get nextAction() { return nextAction; }, botInput, set meBot(v) { if (me) me.bot = v; }, setJoy(x, y) { joy.x = x; joy.y = y; }, jump() { jumpQ = true; } };
}
