// 우주 지도: 태양계(실시간 행성 위치) → 은하수(Reid 2019 나선팔 모형) → 국부·원거리 우주.
// 세 개의 층을 각각 다른 길이 단위(AU, pc, Mpc)로 그리고 같은 방향의 카메라로 겹쳐 그린다.
// 좌표계: 태양 중심 은하좌표 (X: 은하중심 방향 l=0, Y: l=90°, Z: 북은하극).
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { AU, PC, KPC, MPC } from '../physics/constants.js';

const A = globalThis.Astronomy;
const DEG = Math.PI / 180;

// J2000 적도좌표 → 은하좌표 회전 (astronomy-engine)
const ROT_EQJ_GAL = A ? A.Rotation_EQJ_GAL() : null;
export function eqToGal(x, y, z) {
  const r = ROT_EQJ_GAL.rot; // v' = rot · v  (astronomy-engine: 행렬 rot[i][j] 와 RotateVector 의 규약을 그대로 사용)
  const v = A.RotateVector(ROT_EQJ_GAL, new A.Vector(x, y, z, A.MakeTime(new Date())));
  return [v.x, v.y, v.z];
}
export function radecToGalUnit(raDeg, decDeg) {
  const ra = raDeg * DEG, dec = decDeg * DEG;
  return eqToGal(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec));
}

// ---------- 은하수 모형 (Reid et al. 2019, ApJ 885, 131 표 2 의 꺾임점 모형; 막대: Wegg, Gerhard & Portail 2015) ----------
// R(β) = R_kink · exp(−(β − β_kink)·tan ψ), β 는 태양 방향을 0 으로 하고 은하 경도가 커지는 쪽으로 증가하는 은하중심 방위각.
const R0 = 8.277, ZSUN = 0.0208; // kpc (GRAVITY 2022; Bennett & Bovy 2019)
const ARMS = [
  { name: '3-kpc (근)', bk: 15, Rk: 3.52, pIn: -4.2, pOut: -4.2, b0: 15, b1: 18, w: 0.18, weight: 0.5 },
  { name: '노르마', bk: 18, Rk: 4.46, pIn: -1.0, pOut: 19.5, b0: 5, b1: 54, w: 0.14, weight: 0.9 },
  { name: '방패-센타우루스', bk: 23, Rk: 4.91, pIn: 14.1, pOut: 12.1, b0: 0, b1: 104, w: 0.23, weight: 1.3 },
  { name: '궁수-용골', bk: 24, Rk: 6.04, pIn: 17.1, pOut: 1.0, b0: 2, b1: 97, w: 0.27, weight: 1.1 },
  { name: '국부(오리온)', bk: 9, Rk: 8.26, pIn: 11.4, pOut: 11.4, b0: -8, b1: 34, w: 0.31, weight: 0.6 },
  { name: '페르세우스', bk: 40, Rk: 8.87, pIn: 10.3, pOut: 8.7, b0: -23, b1: 115, w: 0.35, weight: 1.2 },
  { name: '바깥', bk: 18, Rk: 12.24, pIn: 3.0, pOut: 9.4, b0: -16, b1: 71, w: 0.65, weight: 0.7 },
];
// 꺾임점 모형은 측정된 β 범위에서만 유효하다. 은하 반대편은 대칭(β+180°)으로 보완해 전체 원반 모습을 만든다 (근사).
function armRadius(arm, beta) {
  const psi = (beta < arm.bk ? arm.pIn : arm.pOut) * DEG;
  return arm.Rk * Math.exp(-(beta - arm.bk) * DEG * Math.tan(psi));
}
function gauss() { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// 은하중심좌표 (X_gc 는 태양→은하중심 방향, 태양은 (−R0, 0, +ZSUN)) → 태양중심 은하좌표 (kpc)
function gcToHelio(xg, yg, zg) { return [xg + R0, yg, zg - ZSUN]; }

export function buildGalaxyPoints(N = 160000) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
  let i = 0;
  const put = (xg, yg, zg, r, g, b, s) => {
    if (i >= N) return;
    const h = gcToHelio(xg, yg, zg);
    pos[3 * i] = h[0]; pos[3 * i + 1] = h[1]; pos[3 * i + 2] = h[2];
    col[3 * i] = r; col[3 * i + 1] = g; col[3 * i + 2] = b; size[i] = s; i++;
  };
  // 1) 지수 원반 (얇은 원반 h_R=2.6 kpc, h_z=0.3 kpc; 두꺼운 원반 2.0/0.9), 반지름 ~25 kpc 까지, 바깥은 휘고 퍼짐
  const nDisk = Math.floor(N * 0.42);
  for (let k = 0; k < nDisk; k++) {
    const thick = Math.random() < 0.15;
    const hR = thick ? 2.0 : 2.6, hz = thick ? 0.9 : 0.3;
    let R = -hR * Math.log(1 - Math.random() * (1 - Math.exp(-25 / hR)));
    if (R < 0.3) R = 0.3 + Math.random();
    const th = Math.random() * 2 * Math.PI;
    const flare = R > 12 ? 1 + (R - 12) * 0.12 : 1; // 플레어
    const warp = R > 10 ? 0.25 * ((R - 10) / 10) ** 2 * Math.sin(th - 1.9) : 0; // 휘어짐(대략)
    const z = gauss() * hz * flare + warp;
    const t = 0.55 + 0.25 * Math.random();
    put(R * Math.cos(th), R * Math.sin(th), z, 1.0 * t, 0.88 * t, 0.72 * t, thick ? 0.8 : 1.0);
  }
  // 2) 나선팔: 젊은 별·HII 영역 (푸른색/붉은 점)
  const nArm = Math.floor(N * 0.36);
  const wsum = ARMS.reduce((s, a) => s + a.weight, 0);
  for (let k = 0; k < nArm; k++) {
    let u = Math.random() * wsum, arm = ARMS[0];
    for (const a of ARMS) { if (u < a.weight) { arm = a; break; } u -= a.weight; }
    const mirror = Math.random() < 0.5; // 대칭 보완
    const beta = arm.b0 + Math.random() * (arm.b1 - arm.b0);
    const R = armRadius(arm, beta);
    if (R > 24) continue;
    const bRad = (beta + (mirror ? 180 : 0)) * DEG;
    // β=0 이 태양 방향(−X_gc), 은하 경도 증가 방향(+Y) 으로 증가
    const w = (arm.w + 0.036 * Math.max(0, R - 8.15)) * 1.0;
    const dx = gauss() * w, dy = gauss() * w;
    const xg = -R * Math.cos(bRad) + dx, yg = R * Math.sin(bRad) + dy;
    const z = gauss() * 0.12;
    const hii = Math.random() < 0.08;
    const dens = Math.exp(-R / 4.0);
    if (hii) put(xg, yg, z, 1.0, 0.45, 0.55, 1.6 + dens);
    else { const t = 0.7 + 0.3 * Math.random(); put(xg, yg, z, 0.72 * t, 0.82 * t, 1.0 * t, 1.1 + 0.6 * dens); }
  }
  // 3) 막대 + 상자형 벌지 (긴 막대 반길이 ≈4.5 kpc, 각도 27°; 벌지 ~2 kpc)
  const nBar = Math.floor(N * 0.16);
  const barAng = 27 * DEG; // 가까운 끝이 양의 은하 경도 쪽
  for (let k = 0; k < nBar; k++) {
    const inBulge = Math.random() < 0.55;
    let a, b, c;
    if (inBulge) { a = gauss() * 1.2; b = gauss() * 0.7; c = gauss() * 0.55; }
    else { a = (Math.random() * 2 - 1) * 4.5 * Math.cbrt(Math.random()); b = gauss() * 0.45; c = gauss() * 0.25; }
    // 막대 장축: 태양 방향(−X_gc)에서 +Y 쪽으로 27° 돌아간 방향
    const xg = -(a * Math.cos(barAng)) - b * Math.sin(barAng);
    const yg = a * Math.sin(barAng) - b * Math.cos(barAng);
    const t = 0.75 + 0.25 * Math.random();
    put(xg, yg, c, 1.0 * t, 0.82 * t, 0.58 * t, inBulge ? 1.3 : 1.0);
  }
  // 4) 헤일로 (희미)
  while (i < N) {
    const r = 3 + 30 * Math.pow(Math.random(), 2.5);
    const th = Math.random() * 2 * Math.PI, ph = Math.acos(2 * Math.random() - 1);
    put(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) * 0.8, 0.5, 0.48, 0.55, 0.6);
  }
  return { pos, col, size, count: N };
}

// 점 재질 (부드러운 원형 스프라이트, 크기 감쇠)
function pointsMaterial(baseSize, opacity = 1, additive = true) {
  return new THREE.ShaderMaterial({
    uniforms: { uSize: { value: baseSize }, uOpacity: { value: opacity }, uScale: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute vec3 aColor; varying vec3 vColor; varying float vAlpha;
      uniform float uSize; uniform float uScale;
      void main(){ vColor = aColor; vec4 mv = modelViewMatrix*vec4(position,1.0);
        float d = -mv.z; float ps = uSize*aSize*uScale/d; ps = clamp(ps, 1.0, 40.0);
        vAlpha = clamp(uSize*aSize*uScale/d/1.5, 0.08, 1.0);
        gl_PointSize = ps; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha; uniform float uOpacity;
      void main(){ vec2 c = gl_PointCoord-0.5; float r2 = dot(c,c); if (r2>0.25) discard;
        float a = exp(-r2*9.0); gl_FragColor = vec4(vColor*a, a*vAlpha*uOpacity); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

// 글로우 스프라이트 텍스처
function glowTexture(size = 128, inner = 0.1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(inner, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function ringTexture(size = 128) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,1)'; ctx.lineWidth = size * 0.07;
  ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2); ctx.stroke();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.3);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2); ctx.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const PLANETS = [
  { body: 'Mercury', name: '수성', color: 0xb5b0a8, period: 87.969, radiusKm: 2439.7 },
  { body: 'Venus', name: '금성', color: 0xe6d4a8, period: 224.701, radiusKm: 6051.8 },
  { body: 'Earth', name: '지구', color: 0x6fa0e8, period: 365.256, radiusKm: 6371 },
  { body: 'Mars', name: '화성', color: 0xd3764a, period: 686.98, radiusKm: 3389.5 },
  { body: 'Jupiter', name: '목성', color: 0xd9b48c, period: 4332.59, radiusKm: 69911 },
  { body: 'Saturn', name: '토성', color: 0xe8d6a0, period: 10759.22, radiusKm: 58232 },
  { body: 'Uranus', name: '천왕성', color: 0x9fd8e0, period: 30688.5, radiusKm: 25362 },
  { body: 'Neptune', name: '해왕성', color: 0x5c7fe0, period: 60182, radiusKm: 24622 },
  { body: 'Pluto', name: '명왕성', color: 0xc8b8a8, period: 90560, radiusKm: 1188 },
];

export class UniverseMap {
  constructor(canvas, catalog, opts = {}) {
    this.canvas = canvas;
    this.catalog = catalog;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.camera = new THREE.PerspectiveCamera(50, 1, 1e-4, 1e8);
    // 조작은 '태양계 단위' 더미 카메라로 받고, 거리는 로그 스케일 줌으로 따로 관리
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableZoom = false; this.controls.enablePan = false;
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.logDist = 12.2;            // log10(카메라 거리 / m) ; 12.2 ≈ 10.6 AU
    this.targetLogDist = this.logDist;
    this.minLog = 10.6; this.maxLog = 27.2;
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0.6, -1.4, 0.9).normalize();
    this.layers = {};
    this.labels = [];
    this.pick = [];
    this.selected = null;
    this.now = new Date();
    this._build();
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.targetLogDist = THREE.MathUtils.clamp(this.targetLogDist + Math.sign(e.deltaY) * 0.12, this.minLog, this.maxLog); }, { passive: false });
    // 터치 핀치 줌
    let pinch = null;
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinch) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); this.targetLogDist = THREE.MathUtils.clamp(this.targetLogDist - Math.log10(d / pinch) * 2.2, this.minLog, this.maxLog); pinch = d; }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { pinch = null; });
  }

  _build() {
    const glow = glowTexture(), ring = ringTexture();
    this.tex = { glow, ring };
    // ===== 별하늘 배경 (히파르코스 별 + 은하수 윤곽; 적도좌표 텍스처를 은하좌표 방향으로 샘플링) =====
    if (this.opts.skyCanvas) {
      const tex = new THREE.CanvasTexture(this.opts.skyCanvas);
      tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
      const inv = A.InverseRotation(ROT_EQJ_GAL).rot; // 은하 → 적도
      const m = new THREE.Matrix3().set(inv[0][0], inv[1][0], inv[2][0], inv[0][1], inv[1][1], inv[2][1], inv[0][2], inv[1][2], inv[2][2]);
      this.skyMat = new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tex }, uRot: { value: m }, uGain: { value: 0.75 } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform sampler2D uTex; uniform mat3 uRot; uniform float uGain; varying vec3 vDir;
          void main(){ vec3 d = normalize(uRot*normalize(vDir)); float ra = atan(d.y, d.x); float dec = asin(clamp(d.z,-1.0,1.0));
            vec2 uv = vec2(ra/6.28318530718+0.5, 0.5 - dec/3.14159265359); vec3 c = texture2D(uTex, uv).rgb; gl_FragColor = vec4(c*uGain, 1.0); }`,
        side: THREE.BackSide, depthWrite: false, depthTest: false,
      });
      const sky = new THREE.Scene();
      sky.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), this.skyMat));
      this.skyScene = sky;
      this.skyCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    }
    // ===== 태양계 층 (단위 AU) =====
    const solar = new THREE.Scene();
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff1c8, blending: THREE.AdditiveBlending, depthWrite: false }));
    sun.scale.setScalar(0.25); solar.add(sun);
    this.sunSprite = sun;
    this.planetSprites = [];
    for (const p of PLANETS) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: p.color, depthWrite: false }));
      s.scale.setScalar(0.08); s.userData = p; solar.add(s); this.planetSprites.push(s);
      // 궤도: 한 공전주기를 256 점으로
      const pts = [];
      const T0 = this.now.getTime();
      for (let k = 0; k <= 256; k++) {
        const d = new Date(T0 + (k / 256) * p.period * 86400e3);
        pts.push(new THREE.Vector3(...this._helioGal(p.body, d)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.35 }));
      solar.add(line);
      this.labels.push({ kind: 'planet', obj: s, text: p.name, layer: 'solar' });
      this.pick.push({ kind: 'planet', obj: s, data: p, layer: 'solar' });
    }
    this.labels.push({ kind: 'sun', obj: sun, text: '태양', layer: 'solar' });
    this.layers.solar = { scene: solar, unit: AU, opacity: 1 };

    // ===== 은하 층 (단위 kpc; 1 kpc = 1000 pc) =====
    const gal = new THREE.Scene();
    const g = buildGalaxyPoints();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(g.pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(g.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(g.size, 1));
    this.galMat = pointsMaterial(0.55, 0.9);
    gal.add(new THREE.Points(geo, this.galMat));
    // 태양 표시 + 블랙홀 마커
    const sunMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff6d8, depthWrite: false }));
    sunMark.scale.setScalar(0.08); gal.add(sunMark);
    this.labels.push({ kind: 'sun', obj: sunMark, text: '태양 (우리)', layer: 'gal' });
    this.bhSprites = [];
    for (const bh of this.catalog) {
      if (bh.ra == null || bh.distPc == null) continue;
      const u = radecToGalUnit(bh.ra, bh.dec);
      const far = bh.distPc > 3e5; // 은하 밖
      const d = far ? bh.distPc / 1e6 : bh.distPc / 1e3; // Mpc 또는 kpc
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ring, color: 0xffffff, depthWrite: false, depthTest: false }));
      sp.position.set(u[0] * d, u[1] * d, u[2] * d);
      sp.userData = bh;
      sp.renderOrder = 10;
      this.bhSprites.push({ sprite: sp, bh, layer: far ? 'cosmic' : 'gal' });
      this.labels.push({ kind: 'bh', obj: sp, text: bh.short, layer: far ? 'cosmic' : 'gal', bh });
      this.pick.push({ kind: 'bh', obj: sp, data: bh, layer: far ? 'cosmic' : 'gal' });
      if (!far) gal.add(sp);
    }
    this.layers.gal = { scene: gal, unit: KPC, opacity: 1 };

    // ===== 원거리 층 (단위 Mpc) =====
    const cos = new THREE.Scene();
    const mw = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xd8dcff, depthWrite: false }));
    mw.scale.setScalar(0.06); cos.add(mw);
    this.labels.push({ kind: 'galaxy', obj: mw, text: '우리은하', layer: 'cosmic' });
    // 안드로메다 (761 kpc), M87 (16.8 Mpc) 등 은하 자체도 표시
    const GALAXIES = [
      { name: '안드로메다 (M31)', ra: 10.68471, dec: 41.26875, dMpc: 0.761, size: 0.06, color: 0xe8e0ff },
      { name: '삼각형자리 (M33)', ra: 23.4621, dec: 30.6599, dMpc: 0.84, size: 0.03, color: 0xd8e8ff },
      { name: '대마젤란은하', ra: 80.8942, dec: -69.7561, dMpc: 0.05, size: 0.02, color: 0xffffff },
      { name: 'M87 (처녀자리 A)', ra: 187.705931, dec: 12.391123, dMpc: 16.8, size: 0.4, color: 0xffeedd },
      { name: '처녀자리 은하단', ra: 186.63, dec: 12.72, dMpc: 16.5, size: 1.5, color: 0xffeedd, faint: true },
    ];
    for (const gx of GALAXIES) {
      const u = radecToGalUnit(gx.ra, gx.dec);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: gx.color, depthWrite: false, opacity: gx.faint ? 0.25 : 0.9, transparent: true }));
      s.position.set(u[0] * gx.dMpc, u[1] * gx.dMpc, u[2] * gx.dMpc); s.scale.setScalar(gx.size);
      cos.add(s);
      this.labels.push({ kind: 'galaxy', obj: s, text: gx.name, layer: 'cosmic' });
    }
    for (const b of this.bhSprites) if (b.layer === 'cosmic') cos.add(b.sprite);
    this.layers.cosmic = { scene: cos, unit: MPC, opacity: 1 };
  }

  _helioGal(body, date) {
    const v = A.HelioVector(A.Body[body], date);
    const r = A.RotateVector(ROT_EQJ_GAL, v);
    return [r.x, r.y, r.z];
  }

  // 실시간 행성 위치 갱신 (astronomy-engine; JPL Horizons 벡터가 주어지면 그것을 우선 사용)
  updatePlanets(date = new Date(), horizons = null) {
    this.now = date;
    for (const s of this.planetSprites) {
      const p = s.userData;
      let xyz;
      if (horizons && horizons[p.body]) { const h = horizons[p.body]; const r = A.RotateVector(ROT_EQJ_GAL, new A.Vector(h[0], h[1], h[2], A.MakeTime(date))); xyz = [r.x, r.y, r.z]; }
      else xyz = this._helioGal(p.body, date);
      s.position.set(xyz[0], xyz[1], xyz[2]);
      p.helio = xyz; p.distAU = Math.hypot(...xyz);
    }
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  }

  // 레이어별 불투명도: 로그 거리에 따라 교차 페이드
  _layerAlpha(L) {
    const d = this.logDist;
    const fade = (x0, x1) => THREE.MathUtils.smoothstep(d, x0, x1);
    if (L === 'solar') return 1 - fade(14.3, 15.6);
    if (L === 'gal') return fade(13.0, 14.3) * (1 - fade(22.6, 23.6));
    if (L === 'cosmic') return fade(21.6, 22.6);
    return 1;
  }

  zoomTo(logDist) { this.targetLogDist = THREE.MathUtils.clamp(logDist, this.minLog, this.maxLog); }
  // 카메라 방향(단위 벡터)과 로그 거리로 이동. OrbitControls 는 카메라 위치의 방향만 쓰므로 위치를 직접 바꾼다.
  flyTo(dir, logDist, instant = false) {
    this.zoomTo(logDist);
    this._flyDir = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    if (instant) { this.camera.position.copy(this._flyDir); this.logDist = this.targetLogDist; this._flyDir = null; }
  }
  get distanceMeters() { return Math.pow(10, this.logDist); }

  render(dt) {
    this.logDist += (this.targetLogDist - this.logDist) * Math.min(1, dt * 6);
    if (this._flyDir) {
      const cur = this.camera.position.clone().normalize();
      const nd = cur.lerp(this._flyDir, Math.min(1, dt * 5)).normalize();
      this.camera.position.copy(nd);
      if (nd.distanceTo(this._flyDir) < 0.002) this._flyDir = null;
    } else this.controls.update();
    const dir = this.camera.position.clone().normalize();
    const D = Math.pow(10, this.logDist);
    const r = this.renderer;
    r.clear(true, true, true);
    if (this.skyScene) {
      const skyAlpha = 1 - THREE.MathUtils.smoothstep(this.logDist, 17.6, 19.6);
      if (skyAlpha > 0.003) {
        this.skyMat.uniforms.uGain.value = 0.75 * skyAlpha;
        this.skyCam.aspect = this.camera.aspect; this.skyCam.fov = this.camera.fov; this.skyCam.updateProjectionMatrix();
        this.skyCam.position.set(0, 0, 0); this.skyCam.lookAt(-dir.x, -dir.y, -dir.z); this.skyCam.up.copy(this.camera.up);
        r.render(this.skyScene, this.skyCam);
      }
    }
    const order = ['cosmic', 'gal', 'solar'];
    for (const key of order) {
      const L = this.layers[key];
      const alpha = this._layerAlpha(key);
      L.alpha = alpha;
      if (alpha <= 0.002) continue;
      const dUnits = D / L.unit;
      this.camera.position.copy(dir).multiplyScalar(dUnits);
      this.camera.near = dUnits * 1e-4; this.camera.far = dUnits * 1e5;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0, 0, 0);
      // 스프라이트 크기: 화면에서 일정한 픽셀 크기가 되도록 거리 비례
      const px = dUnits * 0.018;
      L.scene.traverse((o) => {
        if (o.isSprite) {
          const ud = o.userData || {};
          if (ud.body) o.scale.setScalar(Math.max(px * 0.55, 0.00001));
          else if (ud.id) o.scale.setScalar(px * 1.1);
          else if (o === this.sunSprite) o.scale.setScalar(Math.max(px * 1.4, 0.0093 * 2));
          if (o.material) o.material.opacity = (o.material.userData?.baseOpacity ?? 1) * alpha;
        }
        if (o.isLine && o.material) o.material.opacity = 0.35 * alpha;
      });
      if (key === 'gal') this.galMat.uniforms.uOpacity.value = 0.9 * alpha * (this.logDist < 19 ? THREE.MathUtils.smoothstep(this.logDist, 15, 19) : 1);
      r.clearDepth();
      r.render(L.scene, this.camera);
    }
    // 카메라를 실제 '미터' 기준으로 되돌려 둔다(라벨 투영용으로 레이어별 재계산)
    this._dir = dir; this._D = D;
  }

  // 화면 라벨 위치 계산: [{x,y,text,kind,alpha,data}]
  projectLabels() {
    const out = [];
    const dir = this._dir; if (!dir) return out;
    const v = new THREE.Vector3();
    for (const lb of this.labels) {
      const L = this.layers[lb.layer];
      const alpha = this._layerAlpha(lb.layer);
      if (alpha < 0.05) continue;
      const dUnits = this._D / L.unit;
      this.camera.position.copy(dir).multiplyScalar(dUnits);
      this.camera.near = dUnits * 1e-4; this.camera.far = dUnits * 1e5;
      this.camera.updateProjectionMatrix(); this.camera.lookAt(0, 0, 0);
      this.camera.updateMatrixWorld();
      v.copy(lb.obj.position).project(this.camera);
      if (v.z > 1 || v.z < -1) continue;
      const x = (v.x * 0.5 + 0.5) * this.w, y = (-v.y * 0.5 + 0.5) * this.h;
      // 너무 멀어서 화면 중앙 한 점에 뭉치는 라벨은 숨김 (태양계 행성은 궤도가 안 보이면 숨김)
      const distUnits = lb.obj.position.length();
      const angular = distUnits / dUnits;
      if (lb.kind === 'planet' && angular < 0.004) continue;
      if (lb.kind === 'bh' && lb.layer === 'gal' && angular < 0.003 && lb.bh.id !== 'sgr-a-star') continue;
      out.push({ x, y, text: lb.text, kind: lb.kind, alpha, data: lb.bh || lb.obj.userData, angular });
    }
    return out;
  }

  // 클릭 선택 (화면 좌표 → 가장 가까운 마커)
  pickAt(px, py, maxPx = 22) {
    let best = null, bd = maxPx;
    for (const lb of this.projectLabels()) {
      if (lb.kind !== 'bh' && lb.kind !== 'planet') continue;
      const d = Math.hypot(lb.x - px, lb.y - py);
      if (d < bd) { bd = d; best = lb; }
    }
    return best;
  }
}
