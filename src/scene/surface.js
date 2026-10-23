// 눈을 뜬 곳의 풍경: 캔버스 2D 로 그리는 지표·하늘·떠나는 그들의 배. 색은 실제 사진의 인상에서 (화성 하늘은 버터스카치색, 타이탄은 주황 안개, 유로파는 금 간 얼음).
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// 장소별 팔레트. sky: 위→지평선 색, ground: 가까운 땅→먼 땅, sun: {size, color}, big: 하늘의 큰 천체 {color, bands, ring, size}
const PLACES = {
  Moon:     { sky: ['#000', '#050505'], ground: ['#9a9a96', '#3a3a38'], sun: { size: 0.035, color: '#fff9ec' }, earth: true },
  Mercury:  { sky: ['#000', '#070605'], ground: ['#8a8078', '#332e2a'], sun: { size: 0.08, color: '#fffaf0' } },
  Venus:    { sky: ['#b89a4a', '#e0c070'], ground: ['#8c6a2e', '#3c2a10'], haze: 0.75, sun: null },
  Mars:     { sky: ['#b57a5a', '#e9b58f'], ground: ['#b4623a', '#5a2d18'], sun: { size: 0.022, color: '#dfe8ff' }, dust: true },
  Jupiter:  { sky: ['#6a5030', '#d9b07a'], ground: ['#c9a06a', '#6a4a2a'], cloud: true, sun: { size: 0.012, color: '#fff' } },
  Saturn:   { sky: ['#8a7a4a', '#e8d9a0'], ground: ['#d8c898', '#8a7a4a'], cloud: true, ringSky: true, sun: { size: 0.01, color: '#fff' } },
  Uranus:   { sky: ['#4a8a9a', '#bfe6ee'], ground: ['#a8d8e0', '#4a8a9a'], cloud: true, sun: { size: 0.006, color: '#fff' } },
  Neptune:  { sky: ['#1a3a8a', '#6a9ad8'], ground: ['#5a8ad0', '#1a3a8a'], cloud: true, sun: { size: 0.005, color: '#fff' } },
  Pluto:    { sky: ['#000', '#06080c'], ground: ['#d8c8b0', '#5a4a3a'], sun: { size: 0.006, color: '#fff' }, big: { color: '#8a7a6a', size: 0.09, x: 0.75, y: 0.3 } },
  Phobos:   { sky: ['#000', '#050505'], ground: ['#5a524c', '#221e1c'], sun: { size: 0.02, color: '#fff' }, big: { color: '#c0623a', size: 0.42, x: 0.6, y: 0.55, bands: false } },
  Io:       { sky: ['#000', '#050505'], ground: ['#d9c060', '#7a5a20'], sun: { size: 0.012, color: '#fff' }, big: { color: '#c9a06a', size: 0.33, x: 0.68, y: 0.38, bands: true }, volcano: true },
  Europa:   { sky: ['#000', '#050505'], ground: ['#e8ecf2', '#8a94a4'], sun: { size: 0.012, color: '#fff' }, big: { color: '#c9a06a', size: 0.26, x: 0.68, y: 0.4, bands: true }, cracks: true },
  Titan:    { sky: ['#8a5a20', '#d9a050'], ground: ['#6a4a2a', '#2a1a0a'], haze: 0.6, sun: null, lake: true },
  Enceladus:{ sky: ['#000', '#050505'], ground: ['#f0f4f8', '#9aa4b4'], sun: { size: 0.01, color: '#fff' }, big: { color: '#d8c898', size: 0.3, x: 0.65, y: 0.42, bands: true, ring: true } },
  Triton:   { sky: ['#000', '#050505'], ground: ['#e0c8c8', '#6a5050'], sun: { size: 0.005, color: '#fff' }, big: { color: '#3a5ad0', size: 0.22, x: 0.7, y: 0.4 } },
};
// 별 종류별 색 (스펙트럼형의 인상)
const STAR_COLOR = { M: ['#ff7a4a', '#ffb088'], K: ['#ffb060', '#ffd9a0'], G: ['#fff4d8', '#fffaf0'], F: ['#f4f8ff', '#ffffff'], A: ['#c8d8ff', '#eef3ff'], B: ['#9ab8ff', '#dde8ff'] };
const STAR_TYPE = { proxima: 'M', barnard: 'M', wolf359: 'M', lalande: 'M', luyten: 'M', ross128: 'M', teegarden: 'M', gl1061: 'M', gl581: 'M', gl667: 'M', trappist: 'M', lhs1140: 'M', toi700: 'M', k218: 'M', kepler186: 'M', betelgeuse: 'M', antares: 'M',
  '55cnc': 'K', tauceti: 'G', epseri: 'K', '40eri': 'K', alphacen: 'G', arcturus: 'K', aldebaran: 'K', hd189733: 'K', kepler22: 'G', kepler452: 'G',
  sirius: 'A', vega: 'A', altair: 'A', fomalhaut: 'A', deneb: 'A', polaris: 'F', wasp12: 'F', rigel: 'B', pleiades: 'B', etacar: 'B', psr1257: 'B' };
const NEBULA = { orion: ['#c05070', '#5a7ad0', '#f0d0a0'], helix: ['#50a0c0', '#e07050', '#ffffff'], crab: ['#e0a050', '#70a0e0', '#f0f0f0'], etacar: ['#e06040', '#9060c0', '#ffffff'], pleiades: ['#6080e0', '#a0c0ff', '#ffffff'] };
const GIANT = new Set(['betelgeuse', 'antares', 'arcturus', 'aldebaran', 'rigel', 'deneb', 'wasp12']);

export function drawSurface(canvas, place, t = 0) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d');
  seed = hash(place.id);
  g.clearRect(0, 0, W, H);
  const kind = place.kind;
  const horizon = kind === 'probe' || kind === 'galaxy' ? H * 1.2 : H * 0.66;
  const P = kind === 'solar' ? (PLACES[place.id] || PLACES.Mars) : kind === 'star' ? starPlace(place) : kind === 'galaxy' ? { sky: ['#000', '#000'], galaxy: true } : { sky: ['#000', '#000'] };
  // 하늘
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, Math.min(H, horizon));
  // 별 (어두운 하늘일 때)
  if (!P.haze && !P.cloud) { const n = 260; for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * Math.min(H, horizon), r = rnd() * 1.4 + 0.2, a = 0.3 + rnd() * 0.7; g.fillStyle = `rgba(255,255,255,${a * (P.sky[0] === '#000' ? 1 : 0.35)})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
  // 성운·은하
  if (P.nebula) for (let i = 0; i < 3; i++) blob(g, W * (0.3 + 0.2 * i + rnd() * 0.2), horizon * (0.25 + rnd() * 0.3), W * (0.18 + rnd() * 0.12), P.nebula[i], 0.55);
  if (P.galaxy) { galaxy(g, W * 0.55, H * 0.42, W * 0.32, t); }
  // 하늘의 큰 천체
  if (P.big) bigBody(g, W * P.big.x, horizon * P.big.y, W * P.big.size / 2, P.big);
  if (P.ringSky) { g.strokeStyle = 'rgba(255,245,220,.35)'; g.lineWidth = W * 0.02; g.beginPath(); g.ellipse(W * 0.5, -H * 0.4, W * 0.9, H * 0.8, 0.1, 0.35, 2.8); g.stroke(); }
  // 태양·항성
  if (P.sun) { const sx = W * (P.sun.x ?? 0.3), sy = horizon * (P.sun.y ?? 0.32), r = W * P.sun.size; blob(g, sx, sy, r * 6, P.sun.glow || P.sun.color, 0.35); g.fillStyle = P.sun.color; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill(); }
  if (P.earth) { const ex = W * 0.72, ey = horizon * 0.3, r = W * 0.028; blob(g, ex, ey, r * 3, '#6fa8ff', 0.25); g.fillStyle = '#3f7fe0'; g.beginPath(); g.arc(ex, ey, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(ex - r * 0.3, ey - r * 0.2, r * 0.5, 0, 7); g.fill(); }
  // 안개
  if (P.haze) { const h = g.createLinearGradient(0, horizon * 0.3, 0, horizon); h.addColorStop(0, 'rgba(255,220,160,0)'); h.addColorStop(1, `rgba(255,210,140,${P.haze})`); g.fillStyle = h; g.fillRect(0, 0, W, horizon); }
  // 땅
  if (horizon < H) {
    const gg = g.createLinearGradient(0, horizon, 0, H); gg.addColorStop(0, P.ground[1]); gg.addColorStop(1, P.ground[0]);
    g.fillStyle = gg; g.fillRect(0, horizon, W, H - horizon);
    // 먼 산등성이
    g.fillStyle = P.ground[1]; g.beginPath(); g.moveTo(0, horizon);
    for (let x = 0; x <= W; x += W / 40) g.lineTo(x, horizon - Math.abs(Math.sin(x / W * 9 + seed % 7) * 18 + Math.sin(x / W * 23) * 8) * (H / 900));
    g.lineTo(W, horizon); g.fill();
    // 돌·금·호수
    if (P.cracks) { g.strokeStyle = 'rgba(120,70,60,.45)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); let x = rnd() * W, y = horizon + rnd() * (H - horizon); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * W * 0.12; y += (rnd() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); } }
    if (P.lake) { g.fillStyle = 'rgba(40,25,10,.8)'; g.beginPath(); g.ellipse(W * 0.35, H * 0.9, W * 0.3, H * 0.05, 0, 0, 7); g.fill(); }
    if (P.volcano) { blob(g, W * 0.15, horizon - 10, W * 0.08, '#ffb040', 0.5); }
    if (!P.cloud) for (let i = 0; i < 70; i++) { const d = rnd(); const y = horizon + d * d * (H - horizon); const s = (1 + d * 5) * (H / 900) * (1 + rnd()); g.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.3})`; g.beginPath(); g.ellipse(rnd() * W, y, s * 1.6, s, 0, 0, 7); g.fill(); }
    if (P.cloud) for (let i = 0; i < 18; i++) { const y = horizon + rnd() * (H - horizon); g.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.12})`; g.beginPath(); g.ellipse(rnd() * W, y, W * (0.08 + rnd() * 0.2), (H - horizon) * 0.05, 0, 0, 7); g.fill(); }
    // 그들의 배: 멀리, 떠오르는 중. 아래로 빛기둥이 땅을 비추다 희미해진다
    const sy = horizon - H * (0.06 + 0.02 * Math.sin(t)) - Math.min(H * 0.25, t * H * 0.01);
    beam(g, W * 0.78, sy, horizon, W * 0.09, Math.max(0, 0.35 - t * 0.01));
    theirShip(g, W * 0.78, sy, W * 0.09, t);
    // 그들: 등성이 위에 선 그림자 셋. 눈이 희미하게 빛난다
    aliens(g, W, horizon, H, t);
    // 지표 현상
    if (P.dust) dustDevil(g, W * 0.55, horizon, H, t);
    if (P.volcano) plume(g, W * 0.15, horizon - 10, H, t, '#ffb040');
    if (place.id === 'Enceladus' || place.id === 'Triton') plume(g, W * 0.5, horizon, H, t, '#e8f4ff');
    if (P.cloud && Math.sin(t * 7.3) > 0.985) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, W, H); }
    // 내 캡슐: 가까이, 땅 위
    myShip(g, W * 0.22, horizon + (H - horizon) * 0.35, W * 0.07, P.ground[1]);
    // 땅의 그림자 (아래쪽 어둡게)
    const sh = g.createLinearGradient(0, horizon, 0, H); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = sh; g.fillRect(0, horizon, W, H - horizon);
  } else if (kind === 'probe') {
    probe(g, W * 0.62, H * 0.5, W * 0.16, t);
    theirShip(g, W * 0.2, H * 0.3, W * 0.1, t);
  } else if (kind === 'galaxy') {
    theirShip(g, W * 0.2, H * 0.72, W * 0.1, t);
  }
  // 유성: 몇 초마다 하나
  meteor(g, W, Math.min(H, horizon), t);
  // 비네트
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}

function starPlace(place) {
  const type = STAR_TYPE[place.id] || 'G';
  const [core, glow] = STAR_COLOR[type];
  const P = { sky: ['#000', type === 'M' ? '#1a0806' : '#06080c'], ground: type === 'M' ? ['#6a3a2a', '#2a1410'] : ['#7a7a7a', '#2a2a2a'], sun: { size: GIANT.has(place.id) ? 0.16 : type === 'M' ? 0.09 : 0.03, color: core, glow, x: 0.32, y: 0.35 } };
  if (NEBULA[place.id]) { P.nebula = NEBULA[place.id]; P.sun = null; P.ground = ['#4a4a5a', '#1a1a24']; }
  if (place.id === 'psr1257') P.sun = { size: 0.004, color: '#dff', glow: '#8cf', x: 0.32, y: 0.35 };
  if (place.id === 'trappist') P.sky[1] = '#2a0c08';
  return P;
}
function hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483647; return h || 1; }
function blob(g, x, y, r, color, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(color, a)); gr.addColorStop(1, hexA(color, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255; return `rgba(${r},${gg},${b},${a})`; }
function bigBody(g, x, y, r, b) {
  blob(g, x, y, r * 1.5, b.color, 0.12);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
  g.fillStyle = b.color; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  if (b.bands) for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${i % 2 ? '120,80,40' : '255,240,210'},${0.18 + rnd() * 0.1})`; g.fillRect(x - r, y - r + (2 * r) * (i / 9), 2 * r, (2 * r) / 9 * (0.5 + rnd() * 0.5)); }
  const sh = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.2, x, y, r * 1.1); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = sh; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
  if (b.ring) { g.strokeStyle = 'rgba(255,245,220,.5)'; g.lineWidth = r * 0.12; g.beginPath(); g.ellipse(x, y, r * 1.9, r * 0.35, -0.2, 0, 7); g.stroke(); }
}
function theirShip(g, x, y, w, t) {
  // 납작한 어두운 원반. 아래쪽에 희미한 빛 몇 점. 정체는 보이지 않는다.
  blob(g, x, y + w * 0.1, w * 0.9, '#9ad0ff', 0.12);
  g.fillStyle = '#0b0d12'; g.beginPath(); g.ellipse(x, y, w, w * 0.22, 0, 0, 7); g.fill();
  g.fillStyle = '#14171f'; g.beginPath(); g.ellipse(x, y - w * 0.12, w * 0.45, w * 0.18, 0, Math.PI, 0); g.fill();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; const lx = x + Math.cos(a) * w * 0.8, ly = y + w * 0.1 + Math.sin(a) * w * 0.05; g.fillStyle = `rgba(160,220,255,${0.5 + 0.5 * Math.sin(t * 3 + i)})`; g.beginPath(); g.arc(lx, ly, w * 0.02, 0, 7); g.fill(); }
}
function myShip(g, x, y, w, shadow) {
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + w * 0.9, w * 1.2, w * 0.18, 0, 0, 7); g.fill();
  g.fillStyle = '#c9ccd3'; g.beginPath(); g.moveTo(x - w * 0.5, y + w * 0.8); g.lineTo(x - w * 0.4, y - w * 0.2); g.quadraticCurveTo(x, y - w * 1.1, x + w * 0.4, y - w * 0.2); g.lineTo(x + w * 0.5, y + w * 0.8); g.closePath(); g.fill();
  g.fillStyle = '#2a3140'; g.beginPath(); g.arc(x, y - w * 0.1, w * 0.14, 0, 7); g.fill();
  g.strokeStyle = '#8a8f99'; g.lineWidth = Math.max(1, w * 0.04); g.beginPath(); g.moveTo(x - w * 0.5, y + w * 0.8); g.lineTo(x - w * 0.75, y + w * 0.95); g.moveTo(x + w * 0.5, y + w * 0.8); g.lineTo(x + w * 0.75, y + w * 0.95); g.stroke();
}
function probe(g, x, y, w, t) {
  g.strokeStyle = '#c9ccd3'; g.lineWidth = Math.max(1, w * 0.015);
  g.fillStyle = '#d8dbe0'; g.beginPath(); g.ellipse(x, y, w * 0.5, w * 0.5, 0, 0, 7); g.fill();
  g.fillStyle = '#9aa0aa'; g.beginPath(); g.ellipse(x, y, w * 0.5, w * 0.12, 0, 0, Math.PI); g.fill();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 1.6, y + w * 0.4); g.moveTo(x, y); g.lineTo(x - w * 1.2, y - w * 0.3); g.stroke();
  g.fillStyle = '#5a5f6a'; g.fillRect(x - w * 0.25, y + w * 0.4, w * 0.5, w * 0.3);
  g.fillStyle = '#ffd37a'; g.beginPath(); g.arc(x - w * 0.1, y + w * 0.55, w * 0.06, 0, 7); g.fill();  // 금제 음반
}
function galaxy(g, x, y, r, t) {
  g.save(); g.translate(x, y); g.rotate(-0.5); g.scale(1, 0.45);
  blob(g, 0, 0, r, '#ffe9c8', 0.35);
  for (let i = 0; i < 1200; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r; const arm = Math.sin(a * 2 + d / r * 6) > 0.3 ? 1 : 0.4; g.fillStyle = `rgba(220,230,255,${(0.15 + rnd() * 0.5) * arm})`; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 0.6 + rnd() * 1.2, 0, 7); g.fill(); }
  g.restore();
}

// ---- 추가 요소 ----
function beam(g, x, y, ground, w, a) {
  if (a <= 0) return;
  const gr = g.createLinearGradient(0, y, 0, ground); gr.addColorStop(0, `rgba(160,220,255,${a})`); gr.addColorStop(1, 'rgba(160,220,255,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - w * 0.35, y); g.lineTo(x + w * 0.35, y); g.lineTo(x + w * 1.4, ground); g.lineTo(x - w * 1.4, ground); g.closePath(); g.fill();
  g.fillStyle = `rgba(160,220,255,${a * 0.5})`; g.beginPath(); g.ellipse(x, ground, w * 1.4, w * 0.25, 0, 0, 7); g.fill();
}
function aliens(g, W, horizon, H, t) {
  const n = 3, base = W * 0.5;
  for (let i = 0; i < n; i++) {
    const x = base + (i - 1) * W * 0.035, h = H * (0.075 + (i % 2) * 0.012), y = horizon - h * 0.02;
    g.fillStyle = '#05060a';
    g.beginPath(); g.ellipse(x, y - h * 0.82, h * 0.13, h * 0.17, 0, 0, 7); g.fill();          // 큰 머리
    g.beginPath(); g.moveTo(x - h * 0.06, y - h * 0.66); g.lineTo(x + h * 0.06, y - h * 0.66); g.lineTo(x + h * 0.09, y); g.lineTo(x - h * 0.09, y); g.closePath(); g.fill();   // 가는 몸
    const blink = Math.sin(t * 1.3 + i * 2) > 0.92 ? 0 : 1;
    g.fillStyle = `rgba(190,230,255,${0.55 * blink})`;
    g.beginPath(); g.ellipse(x - h * 0.05, y - h * 0.83, h * 0.035, h * 0.02, -0.4, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x + h * 0.05, y - h * 0.83, h * 0.035, h * 0.02, 0.4, 0, 7); g.fill();
  }
}
function meteor(g, W, skyH, t) {
  const period = 5.5, ph = (t % period) / period; if (ph > 0.12) return;
  const k = Math.floor(t / period); const sx = ((k * 7919) % 1000) / 1000 * W, sy = ((k * 104729) % 1000) / 1000 * skyH * 0.6;
  const len = W * 0.12, p = ph / 0.12; const x = sx + len * p, y = sy + len * 0.45 * p;
  const gr = g.createLinearGradient(x - len * 0.5, y - len * 0.22, x, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - p)})`);
  g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(x - len * 0.5, y - len * 0.22); g.lineTo(x, y); g.stroke();
}
function dustDevil(g, x, horizon, H, t) {
  const h = H * 0.18, drift = Math.sin(t * 0.3) * 30;
  g.fillStyle = 'rgba(230,190,150,.18)';
  g.beginPath(); g.moveTo(x - 6 + drift, horizon); g.quadraticCurveTo(x + 20 + drift, horizon - h * 0.5, x + 4 + drift * 1.5, horizon - h); g.lineTo(x + 30 + drift * 1.5, horizon - h); g.quadraticCurveTo(x + 50 + drift, horizon - h * 0.5, x + 14 + drift, horizon); g.closePath(); g.fill();
}
function plume(g, x, y, H, t, color) {
  for (let i = 0; i < 40; i++) { const u = (i / 40 + t * 0.08) % 1; const px = x + Math.sin(i * 1.7) * u * H * 0.06, py = y - u * H * 0.22 + u * u * H * 0.05; g.fillStyle = hexA(color, 0.5 * (1 - u)); g.beginPath(); g.arc(px, py, 1.5 + u * 2.5, 0, 7); g.fill(); }
}
// 프롤로그: 하늘에서 내려온 빛, 그리고 그 안에서 떠오르는 얼굴
export function drawAbduction(canvas, t) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d');
  g.clearRect(0, 0, W, H);
  seed = 99;
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 1.2 + 0.3, 0, 7); g.fill(); }
  const cx = W * 0.5, a = Math.min(1, t / 2.5);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(170,225,255,${0.32 * a})`); gr.addColorStop(1, 'rgba(170,225,255,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - W * 0.05, 0); g.lineTo(cx + W * 0.05, 0); g.lineTo(cx + W * 0.42, H); g.lineTo(cx - W * 0.42, H); g.closePath(); g.fill();
  for (let i = 0; i < 70; i++) { const u = (i / 70 + t * 0.05) % 1; const x = cx + (rnd() - 0.5) * W * (0.1 + 0.6 * u), y = H * (1 - u); g.fillStyle = `rgba(200,235,255,${0.5 * a * (1 - u)})`; g.beginPath(); g.arc(x, y, 1 + rnd() * 1.5, 0, 7); g.fill(); }
  // 얼굴: 천천히 나타나고, 가끔 눈을 깜빡인다
  const fa = Math.max(0, Math.min(0.85, (t - 3) / 4)); if (fa <= 0) return;
  const fx = cx, fy = H * 0.17, r = Math.min(W, H) * 0.115;
  g.globalAlpha = fa;
  blob(g, fx, fy, r * 2.2, '#9ad0ff', 0.18);
  g.fillStyle = '#171c25'; g.beginPath(); g.moveTo(fx, fy - r); g.bezierCurveTo(fx + r * 1.05, fy - r, fx + r * 1.0, fy + r * 0.5, fx, fy + r * 1.3); g.bezierCurveTo(fx - r * 1.0, fy + r * 0.5, fx - r * 1.05, fy - r, fx, fy - r); g.fill();
  const blink = Math.sin(t * 0.9) > 0.985 ? 0.1 : 1;
  for (const sgn of [-1, 1]) { g.save(); g.translate(fx + sgn * r * 0.42, fy + r * 0.05); g.rotate(sgn * 0.45); g.fillStyle = '#03040a'; g.beginPath(); g.ellipse(0, 0, r * 0.36, r * 0.17 * blink, 0, 0, 7); g.fill(); g.fillStyle = `rgba(190,230,255,${0.7 * blink})`; g.beginPath(); g.arc(-r * 0.12, -r * 0.05, r * 0.035, 0, 7); g.fill(); g.restore(); }
  g.globalAlpha = 1;
}
// 항해 중 창밖 연출. true 를 돌려주는 동안 계속 그린다
export function drawFx(canvas, name, t) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d');
  g.clearRect(0, 0, W, H);
  const fade = (dur) => Math.max(0, Math.min(1, Math.min(t * 2, (dur - t) * 1.5)));
  switch (name) {
    case 'meteor': { if (t > 1.6) return false; const p = t / 1.6, x = W * (0.2 + 0.6 * p), y = H * (0.2 + 0.25 * p); const gr = g.createLinearGradient(x - W * 0.15, y - H * 0.06, x, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${0.95 * (1 - p)})`); g.strokeStyle = gr; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - W * 0.15, y - H * 0.06); g.lineTo(x, y); g.stroke(); return true; }
    case 'aurora': { if (t > 7) return false; const a = fade(7); for (let i = 0; i < 5; i++) { const gr = g.createLinearGradient(0, H * 0.1, 0, H * 0.55); gr.addColorStop(0, `rgba(120,255,170,0)`); gr.addColorStop(0.5, `rgba(120,255,170,${0.14 * a})`); gr.addColorStop(1, `rgba(170,120,255,0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(0, H * 0.1); for (let x = 0; x <= W; x += W / 30) g.lineTo(x, H * (0.1 + 0.05 * Math.sin(x / W * 6 + t * 0.7 + i))); g.lineTo(W, H * 0.55); g.lineTo(0, H * 0.55); g.closePath(); g.save(); g.translate(Math.sin(t * 0.3 + i) * W * 0.05, 0); g.fill(); g.restore(); } return true; }
    case 'flash': { if (t > 1.2) return false; g.fillStyle = `rgba(255,240,210,${0.5 * (1 - t / 1.2)})`; g.fillRect(0, 0, W, H); return true; }
    case 'lightning': { if (t > 1) return false; if (Math.sin(t * 40) > 0.3) { g.fillStyle = `rgba(200,220,255,${0.25 * (1 - t)})`; g.fillRect(0, 0, W, H); } return true; }
    case 'dim': { if (t > 4) return false; g.fillStyle = `rgba(0,0,0,${0.55 * fade(4)})`; g.fillRect(0, 0, W, H); return true; }
    case 'comet': { if (t > 6) return false; const a = fade(6), x = W * (0.15 + 0.7 * t / 6), y = H * (0.3 - 0.1 * t / 6); const gr = g.createLinearGradient(x, y, x - W * 0.3, y + H * 0.08); gr.addColorStop(0, `rgba(220,240,255,${0.6 * a})`); gr.addColorStop(1, 'rgba(220,240,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x - W * 0.3, y + H * 0.02); g.lineTo(x - W * 0.3, y + H * 0.14); g.lineTo(x, y + 4); g.closePath(); g.fill(); g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); return true; }
    case 'glow': { if (t > 5) return false; const a = fade(5); blob(g, W * 0.7, H * 0.4, H * 0.3, '#9ad0ff', 0.22 * a); return true; }
    case 'stars': { if (t > 6) return false; const a = fade(6); seed = 5; for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${a * (0.2 + rnd() * 0.7)})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 1.3 + 0.2, 0, 7); g.fill(); } return true; }
    case 'earth': { if (t > 8) return false; const a = fade(8), r = W * 0.6, cy = H * 1.25 - H * 0.15 * Math.min(1, t / 4); blob(g, W * 0.5, cy, r * 1.15, '#6fa8ff', 0.3 * a); g.globalAlpha = a; g.fillStyle = '#3f7fe0'; g.beginPath(); g.arc(W * 0.5, cy, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(W * (0.2 + i * 0.12), cy - r * (0.7 + 0.1 * Math.sin(i)), r * 0.12, r * 0.04, 0.3, 0, 7); g.fill(); } g.globalAlpha = 1; return true; }
    case 'eyes': { if (t > 4) return false; const a = fade(4) * (Math.sin(t * 1.1) > 0.95 ? 0.1 : 1); const x = W * 0.72, y = H * 0.42, r = W * 0.012; for (const sgn of [-1, 1]) { blob(g, x + sgn * r * 3, y, r * 4, '#bfe6ff', 0.2 * a); g.fillStyle = `rgba(200,235,255,${0.85 * a})`; g.beginPath(); g.ellipse(x + sgn * r * 3, y, r * 1.4, r * 0.7, sgn * 0.35, 0, 7); g.fill(); } return true; }
    case 'saucer': { if (t > 7) return false; const a = fade(7), x = W * (0.25 + 0.5 * t / 7), y = H * 0.35 + Math.sin(t) * H * 0.02, w = W * 0.06; g.globalAlpha = a; blob(g, x, y + w * 0.1, w * 1.5, '#9ad0ff', 0.2); g.fillStyle = '#0b0d12'; g.beginPath(); g.ellipse(x, y, w, w * 0.22, 0, 0, 7); g.fill(); g.fillStyle = '#14171f'; g.beginPath(); g.ellipse(x, y - w * 0.12, w * 0.45, w * 0.18, 0, Math.PI, 0); g.fill(); for (let i = 0; i < 7; i++) { const an = (i / 7) * Math.PI; g.fillStyle = `rgba(160,220,255,${0.5 + 0.5 * Math.sin(t * 4 + i)})`; g.beginPath(); g.arc(x + Math.cos(an) * w * 0.8, y + w * 0.1 + Math.sin(an) * w * 0.05, w * 0.03, 0, 7); g.fill(); } g.globalAlpha = 1; return true; }
    default: return false;
  }
}
