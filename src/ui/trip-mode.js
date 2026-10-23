// 지구로 돌아가기: 무작위 출발지에서 눈을 뜨고, 배를 고르고, 시간이 흐르는 1인칭 항해 속에서 사건마다 선택한다.
import * as THREE from 'three';
import { SOLAR, STARS, GALAXIES, PROBES, SHIPS } from '../data/destinations.js';
import { Voyage } from '../sim/voyage.js';
import { planReturn, blackHoleSurvival, HUMAN_K } from '../physics/trip.js';
import { AU, PC, LY, KPC, MPC, YEAR, DAY, M_SUN, rs } from '../physics/constants.js';
import { horizons } from '../physics/gr.js';
import { fmtSolar, fmtKm, fmtSci, esc, el } from './format.js';
import { tiltDir, radecToGalUnit } from '../scene/map.js';
import { drawSurface, drawAbduction, drawFx } from '../scene/surface.js';

const TICKS = [
  [7, '10,000 km'], [Math.log10(3.844e8), '달 궤도'], [Math.log10(AU), '1 AU'], [Math.log10(30 * AU), '해왕성 궤도'],
  [Math.log10(1000 * AU), '1,000 AU'], [Math.log10(LY), '1 광년'], [Math.log10(10 * LY), '10 광년'], [Math.log10(100 * LY), '100 광년'],
  [Math.log10(1000 * LY), '1,000 광년'], [Math.log10(8.277 * KPC), '은하 중심'], [Math.log10(30 * KPC), '우리은하'],
  [Math.log10(761 * KPC), '안드로메다'], [Math.log10(16.8 * MPC), 'M87'], [Math.log10(1000 * MPC), '1 Gpc'],
];
const HUMAN_HEIGHT = 1.75;
const BH_STARTS = [[3, '멀찍이'], [1, '가까이'], [0.18, '지평선 바로 앞']]; // log10(r/r_s)
const PLAY_SECONDS = 110;        // 한 항해(또는 한 인생)가 흐르는 실제 시간
const MAX_LIFE_YEARS = 70;       // 이보다 긴 항해는 어차피 수명 안에서 끝난다
const EVENTS_PER_LIFE = 18;      // 한 항해에 사건이 이보다 촘촘히 오지 않게 (배 시계 기준 최소 간격)
const SPEEDS = [1, 3, 10];
const HINTS_PER_VOYAGE = 2;      // 힌트는 한 항해에 두 번
const CAT = {
  sun: ['태양', '#f2b25c'], fire: ['불', '#ff7a5c'], air: ['공기', '#8fd3ff'], water: ['물', '#7fb3ff'], med: ['몸', '#ff8fa3'], crew: ['동료', '#d9c3ff'],
  mind: ['마음', '#c3b5ff'], comp: ['컴퓨터', '#9ad0c2'], rock: ['충돌', '#e0b48a'], nav: ['항로', '#e9a65b'], power: ['전력', '#ffd56b'], body: ['몸', '#ff8fa3'],
  signal: ['바깥', '#b48cff'], sf: ['시나리오', '#c7a2ff'], bh: ['블랙홀', '#e9a65b'], earth: ['지구', '#7fd1a8'], end: ['끝', '#9aa3b2'],
};
const ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  fire: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 11 0 4 3 8 7 8z"/>',
  air: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8a2 2 0 1 1-2 2"/>',
  water: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
  med: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  crew: '<circle cx="8" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2 21c0-4 3-6 6-6s6 2 6 6M14 21c0-3 1.5-5 3.5-5s4 2 4 5"/>',
  mind: '<path d="M8 21v-4a7 7 0 1 1 10-6.5V13l2 2-2 1v2a2 2 0 0 1-2 2h-2v1"/>',
  comp: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  rock: '<path d="M8 3l8 1 5 7-3 9-9 2-6-6 1-9z"/>',
  nav: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  power: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  body: '<circle cx="12" cy="4.5" r="2.5"/><path d="M12 7v7M12 14l-4 7M12 14l4 7M7 10l5-2 5 2"/>',
  signal: '<circle cx="12" cy="13" r="2"/><path d="M8 9a5.7 5.7 0 0 0 0 8M16 9a5.7 5.7 0 0 1 0 8M5 6a10 10 0 0 0 0 14M19 6a10 10 0 0 1 0 14"/>',
  bh: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="3.5"/>',
  earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  end: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  sf: '<path d="M12 3l2.2 5.6L20 9.3l-4.5 3.9 1.4 5.8L12 16l-4.9 3 1.4-5.8L4 9.3l5.8-.7z"/>',
};
const PIC = {
  alien: '<svg viewBox="0 0 120 100"><defs><radialGradient id="pg" cx="50%" cy="40%"><stop offset="0" stop-color="#9ad0ff" stop-opacity=".35"/><stop offset="1" stop-color="#9ad0ff" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="48" r="48" fill="url(#pg)"/><path d="M60 8c24 0 38 16 38 36 0 24-22 50-38 50S22 68 22 44C22 24 36 8 60 8z" fill="#1c222c"/><ellipse cx="44" cy="46" rx="13" ry="7" transform="rotate(-18 44 46)" fill="#050608"/><ellipse cx="76" cy="46" rx="13" ry="7" transform="rotate(18 76 46)" fill="#050608"/><circle cx="40" cy="43" r="2" fill="#bfe6ff"/><circle cx="72" cy="43" r="2" fill="#bfe6ff"/></svg>',
  saucer: '<svg viewBox="0 0 160 100"><ellipse cx="80" cy="70" rx="70" ry="14" fill="#9ad0ff" opacity=".15"/><ellipse cx="80" cy="52" rx="60" ry="12" fill="#0b0d12"/><path d="M50 50q30-28 60 0z" fill="#161a22"/><g fill="#bfe6ff"><circle cx="35" cy="56" r="2.5" class="bl"/><circle cx="55" cy="60" r="2.5" class="bl"/><circle cx="80" cy="62" r="2.5" class="bl"/><circle cx="105" cy="60" r="2.5" class="bl"/><circle cx="125" cy="56" r="2.5" class="bl"/></g><path d="M62 60L40 100h80L98 60z" fill="#9ad0ff" opacity=".12"/></svg>',
  comet: '<svg viewBox="0 0 160 100"><defs><linearGradient id="ct" x1="0" x2="1"><stop offset="0" stop-color="#bfe6ff" stop-opacity="0"/><stop offset="1" stop-color="#e0f0ff" stop-opacity=".7"/></linearGradient></defs><path d="M0 20Q80 30 128 60L130 70Q70 55 0 40z" fill="url(#ct)"/><circle cx="130" cy="64" r="7" fill="#fff"/></svg>',
  pod: '<svg viewBox="0 0 160 100"><rect x="50" y="20" width="60" height="70" rx="26" fill="#1a1f29" stroke="#3a4250" stroke-width="2"/><rect x="60" y="30" width="40" height="40" rx="18" fill="#9ad0ff" opacity=".18"/><path d="M80 40a6 6 0 1 0 .1 0M72 54q8-6 16 0" stroke="#bfe6ff" stroke-width="2" fill="none" opacity=".6"/></svg>',
  crew: '<svg viewBox="0 0 160 100"><circle cx="60" cy="50" r="22" fill="#1c222c"/><circle cx="104" cy="56" r="18" fill="#1c222c"/><rect x="48" y="42" width="24" height="12" rx="6" fill="#9ad0ff" opacity=".35"/><rect x="94" y="50" width="20" height="10" rx="5" fill="#9ad0ff" opacity=".35"/></svg>',
  rock: '<svg viewBox="0 0 160 100"><path d="M40 60l18-30 34-6 28 22-10 32-40 10z" fill="#2a2420"/><path d="M58 30l8 22-20 10z" fill="#3a332c"/><circle cx="100" cy="56" r="6" fill="#1a1612"/></svg>',
  earth: '<svg viewBox="0 0 160 100"><circle cx="80" cy="110" r="70" fill="#3f7fe0"/><path d="M30 80q30-30 60-10t50-10" stroke="#8fd1a8" stroke-width="10" fill="none" opacity=".6"/><circle cx="80" cy="110" r="70" fill="none" stroke="#bfe6ff" stroke-width="3" opacity=".5"/></svg>',
  plant: '<svg viewBox="0 0 160 100"><path d="M80 95V50" stroke="#7fd1a8" stroke-width="3"/><path d="M80 70q-30-10-28-40 28 6 28 40zM80 60q30-14 30-42-30 8-30 42z" fill="#2c6b50"/><circle cx="80" cy="48" r="5" fill="#bfe6ff" opacity=".6"/></svg>',
  bh: '<svg viewBox="0 0 160 100"><defs><radialGradient id="bhg"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs><ellipse cx="90" cy="60" rx="62" ry="10" fill="none" stroke="url(#bhg)" stroke-width="6"/><circle cx="90" cy="60" r="26" fill="#000" stroke="#ffd9a0" stroke-width="2"/><path d="M28 60a62 10 0 0 0 124 0" fill="none" stroke="#ffe9c8" stroke-width="3"/></svg>',
  sun: '<svg viewBox="0 0 160 100"><circle cx="40" cy="100" r="60" fill="#ffb347"/><circle cx="40" cy="100" r="70" fill="none" stroke="#ffd56b" stroke-width="2" opacity=".5"/><path d="M90 60q20-30 40-10" stroke="#ffd56b" stroke-width="3" fill="none"/></svg>',
};
const PIC_BY_ID = { wormhole: 'bh', gargantua: 'bh', miller: 'bh', 'ghost-ship': 'saucer', mann: 'pod', 'future-self': 'saucer', abductors: 'saucer', traders: 'saucer', bigship: 'saucer', twin: 'saucer', 'window-face': 'alien', 'mate-memory': 'alien', dream: 'alien', stowaway: 'crew', pod: 'pod', derelict: 'pod', whale: 'alien', comet: 'comet', 's-comet': 'comet', oumuamua: 'rock', belt: 'rock', micro: 'rock', debris: 'rock', dust: 'rock', reentry: 'earth', seeds: 'plant', eco: 'plant', spider: 'plant', spe: 'sun', 'solar-ship': 'sun', artifact: 'alien', beacon: 'saucer', dyson: 'saucer' };
const ALERT = new Set(['fire', 'air', 'water', 'power', 'rock']);
const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const PIC_BY_CAT = { crew: 'crew', rock: 'rock', earth: 'earth', sun: 'sun', sf: 'alien' };
const art = (cat, id = '') => `<div class="art"><div class="bg"></div>${PIC[PIC_BY_ID[id] || PIC_BY_CAT[cat]] ? `<div class="pic">${PIC[PIC_BY_ID[id] || PIC_BY_CAT[cat]]}</div>` : icon(cat)}<div class="dots">${Array.from({ length: 6 }, (_, i) => `<i style="left:${10 + i * 15}%;bottom:${5 + (i * 37) % 40}px;animation-delay:${-i * 1.1}s"></i>`).join('')}</div></div>`;
const icon = (cat) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICON[cat] || ICON.nav}</svg>`;

export class TripMode {
  constructor(ctx) {
    this.ctx = ctx; this.map = ctx.map;
    this.age = 30; this.state = 'setup'; this.speed = 1; this.paused = false; this.auto = false;
    this._buildScale();
    this.card = document.getElementById('card');
    this.cockpit = document.getElementById('cockpit');
    this.top = document.getElementById('voy-top');
    this.toast = document.getElementById('toast');
    this.landing = document.getElementById('landing');
    this.ctl = document.getElementById('voy-ctl');
    this.scene = document.getElementById('scene'); this.fx = document.getElementById('fx'); this.amb = document.getElementById('amb'); this.interior = document.getElementById('interior'); this.prologue = document.getElementById('prologue');
    this._wireCtl();
    window.addEventListener('resize', () => { if (this.sceneOn) this._drawScene(); });
  }
  starts() {
    if (this._starts) return this._starts;
    const bhs = this.ctx.catalog.filter((b) => !b.infoOnly && b.ra != null && b.distPc != null);
    this._starts = [
      ...SOLAR.map((d) => ({ ...d, kind: 'solar', group: '태양계' })),
      ...PROBES.map((d) => ({ ...d, kind: 'probe', group: '탐사선 곁', distPc: d.distAU * AU / PC })),
      ...STARS.map((d) => ({ ...d, kind: 'star', group: '가까운 별' })),
      ...bhs.map((b) => ({ id: b.id, name: b.short, kind: 'bh', group: '블랙홀 곁', bh: b, ra: b.ra, dec: b.dec, distPc: b.distPc })),
      ...GALAXIES.map((d) => ({ ...d, kind: 'galaxy', group: '다른 은하' })),
    ];
    return this._starts;
  }
  start(id) { return this.starts().find((d) => d.id === id); }
  posOf(d, date) {
    if (d.kind === 'solar') { const h = this.map._helioGal(d.body, date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }
    const u = radecToGalUnit(d.ra, d.dec);
    return new THREE.Vector3(u[0], u[1], u[2]).multiplyScalar(d.distPc * PC);
  }
  earthPos(date) { const h = this.map._helioGal('Earth', date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }

  // ================= 준비 =================
  enter() { this._setup(true); }
  _setup(fly) {
    this.state = 'setup'; this.voy = null; this.from = null; this.route = null; this.ship = null; this.bhLogR = 3;
    this.map.exitFirstPerson();
    for (const e of [this.card, this.cockpit, this.top, this.ctl, this.landing, this.scene, this.amb]) e.classList.add('hidden');
    this.cockpit.classList.remove('alert'); delete this.card.dataset.cat;
    this.landing.classList.remove('on'); this.scene.classList.remove('lift'); this.interior.classList.remove('on'); this.interior.classList.add('hidden'); this.sceneOn = false;
    this._prologue();
    this.ctx.els.scale.classList.remove('hidden');
    this.ctx.els.panel.classList.remove('collapsed');
    if (this.ctx.bhOn) this.ctx.showBH(false);
    const b = this.ctx.els.body;
    b.innerHTML = '';
    const n = this.starts().length;
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">지금 이 순간의 우주</div><div class="title-lg">외계인에게 납치됐다</div>
        <p class="note" style="margin-top:6px">납치된 뒤 우주 어딘가에 버려진다. 장소는 무작위. 배에 오르면 시간이 흐르고 나이가 들고 사건이 끼어든다. 그때마다 고른다. 거리·속도·위험은 전부 실제 측정값.</p></div>
      <div class="section">
        <div class="row"><button class="btn primary block" id="t-go">처음부터</button></div>
        <p class="note tiny" style="margin-top:8px">출발지 ${n}곳 중 하나: 달·행성·위성, 탐사선 곁, 가까운 별, 성운, 블랙홀 곁, 다른 은하.</p>
      </div>
      <div class="section"><details class="refs"><summary>무엇이 실제인가요</summary><ul>
        <li>거리는 지금 이 순간의 위치 (행성 VSOP87, 별 Gaia 시차, 블랙홀 각 논문). 빛에 가까우면 배 안의 시간이 느리게 가요.</li>
        <li>우주 방사선 1.84 mSv/일 (큐리오시티 RAD, Zeitlin 2013), 암 위험 1 Sv 당 5.5 % (ICRP 103), 5–20년 뒤에 나타나요.</li>
        <li>식량 1.83 kg/인·일, 물 회수 98 % (ISS 2023), 플루토늄 전지 반감기 87.7년, 햇빛은 거리 제곱으로 약해져요.</li>
        <li>사건은 실제 기록의 빈도로 와요: 1972년급 태양 폭풍, 1997년 미르 화재, ISS 산소·물 장치 고장, 보이저 비트 뒤집힘, Wow! 신호. 결과는 그 확률대로 굴려요.</li>
        <li>수명은 기대수명 약 81세의 Gompertz 곡선, 재진입은 우주왕복선 위험 평가 1/180.</li>
      </ul></details></div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#t-go').addEventListener('click', () => this._setup(false));
    this.ctx.setHint('끌기 회전 · 휠/핀치 거리');
    this.map.clearRoute(); this.map.focusSun();
    if (fly) this.map.flyTo(tiltDir(new THREE.Vector3(0.6, -1.4, 0).normalize(), 0.55), 12.2, false);
  }
  _prologue() {
    const pr = this.prologue;
    pr.querySelector('.lines').innerHTML = `<p>집 앞 골목에서 빛을 본 것이 마지막 기억이었다.</p><p class="faint">깨어 보니 바닥은 차가운 바위였고, 하늘 색이 달랐다.</p><p>그들은 떠나고 없었다.</p><p class="faint">바위 사이에 작은 우주선 한 척, 그 옆에 식량 상자가 쌓여 있었다.</p><p>지구까지의 거리는 조종석 화면에 적혀 있었다.</p>`;
    pr.classList.remove('hidden');
    const pc = pr.querySelector('canvas'); const t0 = performance.now(); cancelAnimationFrame(this._prRaf);
    const loop = () => { if (pr.classList.contains('hidden')) return; const dpr = Math.min(devicePixelRatio || 1, 1.5); if (pc.width !== Math.round(innerWidth * dpr)) { pc.width = Math.round(innerWidth * dpr); pc.height = Math.round(innerHeight * dpr); } drawAbduction(pc, (performance.now() - t0) / 1000); this._prRaf = requestAnimationFrame(loop); };
    this._prRaf = requestAnimationFrame(loop);
    this.ctx.els.panel.classList.add('collapsed');
    const ageEl = pr.querySelector('#p-age'); ageEl.value = this.age;
    ageEl.oninput = (e) => { this.age = Math.min(100, Math.max(1, +e.target.value || 30)); };
    pr.querySelector('#p-go').onclick = () => { pr.classList.add('hidden'); this._wake(); };
  }
  // 창밖 연출: 유성·오로라·플레어·그들의 배… 몇 초 동안 fx 캔버스에 그린다
  _fx(name) {
    const cv = this.fx; cv.classList.remove('hidden');
    const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    const t0 = performance.now(); cancelAnimationFrame(this._fxRaf);
    const loop = () => { const t = (performance.now() - t0) / 1000; const alive = drawFx(cv, name, t); if (alive) this._fxRaf = requestAnimationFrame(loop); else { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); cv.classList.add('hidden'); } };
    this._fxRaf = requestAnimationFrame(loop);
  }
  // 창밖: 앞으로 흐르는 먼지·별. 속도가 빠를수록 길게 흐른다 (가벼운 입자 60개)
  _ambient() {
    const cv = this.amb; if (!cv) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.25); const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; this._parts = null; }
    cv.classList.remove('hidden');
    const g = cv.getContext('2d'); g.clearRect(0, 0, W, H);
    const v = this.voy, sp = this.paused ? 0 : (0.002 + Math.min(0.05, v.beta * 0.25)) * this.speed;
    if (!this._parts) this._parts = Array.from({ length: 60 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));
    for (const p of this._parts) {
      p.z -= sp; if (p.z <= 0.02) { p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; p.z = 1; }
      const k = 0.5 / p.z, x = W / 2 + p.x * k * W * 0.6, y = H / 2 + p.y * k * H * 0.6;
      const k2 = 0.5 / (p.z + sp * 3), x2 = W / 2 + p.x * k2 * W * 0.6, y2 = H / 2 + p.y * k2 * H * 0.6;
      g.strokeStyle = `rgba(220,230,255,${0.12 + 0.5 * (1 - p.z)})`; g.lineWidth = 1 + (1 - p.z) * 1.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    }
  }
  _drawScene() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.scene.width = Math.round(innerWidth * dpr); this.scene.height = Math.round(innerHeight * dpr);
    drawSurface(this.scene, this.route.from, performance.now() / 1000);
  }
  // 실제 우주 날씨 (NOAA SWPC): 지금 태양이 활발하면 출발 직후 태양 폭풍 확률이 오른다
  _weather() {
    if (this._weatherP) return this._weatherP;
    const get = (u) => fetch(u, { mode: 'cors' }).then((r) => r.json());
    this._weatherP = Promise.all([get('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json'), get('https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json')])
      .then(([kp, xr]) => { const k = +kp[kp.length - 1].kp_index; const fl = xr.filter((x) => x.energy === '0.1-0.8nm'); const f = fl.length ? fl[fl.length - 1].flux : 1e-7; const cls = f >= 1e-4 ? 'X' : f >= 1e-5 ? 'M' : f >= 1e-6 ? 'C' : f >= 1e-7 ? 'B' : 'A'; return { kp: k, xray: f, cls, mult: cls === 'X' ? 4 : cls === 'M' ? 2.5 : cls === 'C' ? 1.3 : 0.8, text: `지금 태양: X선 ${cls}급 · 지자기 Kp ${k}` }; })
      .catch(() => null);
    return this._weatherP;
  }
  _wake() {
    this._weather().then((w) => { if (w && this.voy) this.voy.weather = w; });
    const list = this.starts();
    // 출발지 추첨: 닿을 수 있는 곳이 더 자주 (태양계 55 %, 탐사선 곁 10 %, 별 27 %(가까운 별 위주), 블랙홀 4 %, 다른 은하 4 %)
    const r = Math.random(), kind = r < 0.55 ? 'solar' : r < 0.65 ? 'probe' : r < 0.92 ? 'star' : r < 0.96 ? 'bh' : 'galaxy';
    let pool = list.filter((d) => d.kind === kind);
    if (kind === 'star' && Math.random() < 0.8) pool = pool.filter((d) => d.distPc < 8);
    this.from = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length ? pool : list).length)].id;
    this._setupRoute();
    const { from, distM } = this.route;
    if (from.kind !== 'bh') { this.scene.classList.remove('hidden', 'lift'); this.sceneOn = true; this._drawScene(); }
    const kindText = { solar: '태양계', probe: '태양계 바깥', star: '별', bh: '블랙홀 곁', galaxy: '다른 은하' }[from.kind];
    this._card(`<div class="step">${icon('nav')} 현재 위치 · ${kindText}</div><div class="t">${esc(from.name)}</div>
      <div class="d">${from.note ? esc(from.note) + '. ' : ''}${{ solar: '지평선 위로 그들의 배가 멀어지고 있었다. 바위 사이에 캡슐 한 척이 서 있었다.', probe: '우주복 안이었다. 옆에서 1977년에 떠난 탐사선이 조용히 돌고 있었고, 조금 떨어진 곳에 배가 있었다.', star: '낯선 별 아래 바위 벌판이었다. 바위 사이에 캡슐 한 척이 서 있었다.', galaxy: '별도 땅도 없는 어둠이었다. 창밖에 은하 하나가 하늘을 채우고 있었고, 배는 등 뒤에 있었다.', bh: '블랙홀의 빛 고리가 하늘을 채우고 있었다. 배는 지평선 바깥에 떠 있었다.' }[from.kind]}<br>지구까지 ${fmtDist(distM)}. 빛으로도 ${fmtDur(distM / 299792458)}.${from.kind === 'bh' ? ` 블랙홀 질량 ${fmtSolar(from.bh.mass)}.` : ''}</div>
      <div class="opts">${opt(0, '우주선으로', '배 세 척 중 하나를 고른다')}</div>`, () => this._hangar());
    this.ctx.els.panel.classList.add('collapsed');
    this.ctx.els.scale.classList.add('hidden');
    this.ctx.setHint('');
    this.state = 'woke';
  }
  _setupRoute() {
    const now = new Date();
    const from = this.start(this.from);
    const A = this.posOf(from, now), B = this.earthPos(now);
    this.route = { from, A, B, distM: A.distanceTo(B) };
    const map = this.map;
    map.setRoute(A, B); map.setShip(0);
    map.setFocus(A.clone().add(B).multiplyScalar(0.5));
    const ab = B.clone().sub(A).normalize();
    let perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(0, 0, 1));
    if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(1, 0, 0));
    map.flyTo(tiltDir(perp.normalize(), 0.5), Math.log10(Math.max(this.route.distM * 1.6, 2e8)), false);
  }
  // 격납고: 블랙홀 곁이면 출발 거리부터, 그다음 배
  _hangar() {
    const { from, distM } = this.route;
    this.state = 'hangar';
    this.map.setFirstPerson(this.route.A, this.route.B, true);
    if (from.kind === 'bh' && this.bhLogR === 3 && !this._bhChosen) {
      const bh = from.bh, Mkg = bh.mass * M_SUN, chi = Math.min(0.998, bh.spin ?? 0);
      const opts = BH_STARTS.map(([lg, name], i) => {
        const r = Math.pow(10, lg);
        const res = blackHoleSurvival(bh.mass, chi, r * 2);
        const dg = res.inside ? null : res.k * HUMAN_HEIGHT / 9.80665;
        const hint = res.inside ? '사건의 지평선 안이에요. 빛도 못 나오니 어떤 배도 못 나와요.' : `머리와 발이 받는 중력이 ${dg < 1e-3 ? '거의 같아요' : `${dg >= 1e4 ? fmtSci(dg, 2) : dg.toPrecision(3)} g 만큼 달라요`}. 사람은 50 s⁻² 쯤에서 의식을 잃고 1000 s⁻² 에서 몸이 둘로 갈라져요. 무거운 블랙홀일수록 지평선 가까이가 오히려 부드러워요.`;
        return opt(i, `${name} · ${fmtKm(r * rs(Mkg))}`, `${r.toFixed(2).replace(/\.?0+$/, '')} r_s`, hint);
      }).join('');
      this._card(`<div class="step">${icon('bh')} 출발 · ${esc(bh.short)}</div><div class="t">어디서 엔진을 켤 것인가</div>
        <div class="d">질량 ${fmtSolar(bh.mass)}, 지평선 지름 ${fmtKm(2 * horizons(chi).rPlus * rs(Mkg) / 2)}. 가까울수록 머리와 발에 걸리는 중력이 달라요.</div>
        <div class="opts">${opts}</div><div class="src">조석 기울기 2GM/r³ (커 축 위 정확식)</div>`, (i) => { this.bhLogR = BH_STARTS[i][0]; this._bhChosen = true; this.ctx.showBH(false); this._hangar(); });
      if (!this.ctx.bhOn) { this.ctx.showBH(true); this.ctx.bh.setBH(bh, { inc: bh.inc ?? 75, dist: 'auto' }); this.ctx.bh.animate = true; this.ctx.bh.clearFall(); }
      return;
    }
    const ships = SHIPS.map((s, i) => { const t = planReturn({ distM, v: s.v, age: this.age }); return opt(i, `${s.name} · ${fmtDur(t.tau)}${t.gamma > 1.02 ? ` (지구 시계 ${fmtDur(t.tEarth)})` : ''}`, `${s.tag} · ${s.spec}`, s.desc); }).join('');
    this._card(`<div class="step">${icon('nav')} 출발</div><div class="t">무엇을 타고 갈 것인가</div>
      <div class="d">지구까지 ${fmtDist(distM)}. 빛으로도 ${fmtDur(distM / 299792458)} 걸려요.</div>
      <div class="opts">${ships}</div>`, (i) => this._board(SHIPS[i]));
  }
  // ================= 항해 =================
  _board(ship) {
    const { from, A, B } = this.route;
    this.ship = ship;
    const bh = from.kind === 'bh' ? { massSolar: from.bh.mass, chi: Math.min(0.998, from.bh.spin ?? 0), rOverRg: Math.pow(10, this.bhLogR) * 2 } : null;
    this.voy = new Voyage({ from, A, B, ship, age: this.age, bh });
    this._weather().then((w) => { if (w && this.voy) { this.voy.weather = w; this.voy.s.log.splice(1, 0, { tau: 0, cat: 'sun', text: `${w.text} (NOAA 실시간)` }); this.shownLog++; this._panelLog(); } });
    const total = this.voy.remaining();
    const horizon = Math.min(total, MAX_LIFE_YEARS * YEAR);
    this.simRate = Math.max(60, horizon / PLAY_SECONDS);   // 배 시계 초 / 실제 초
    this.eventGap = horizon / EVENTS_PER_LIFE;
    this.state = 'voyage'; this.paused = false; this.shownLog = this.voy.s.log.length; this.resultWait = 0; this.hints = HINTS_PER_VOYAGE;
    this.card.classList.add('hidden');
    if (this.sceneOn) { this.scene.classList.add('lift'); this.sceneOn = false; setTimeout(() => this.scene.classList.add('hidden'), 1700); }
    this.interior.classList.remove('hidden'); requestAnimationFrame(() => this.interior.classList.add('on'));
    this.cockpit.classList.remove('hidden'); this.top.classList.remove('hidden'); this.ctl.classList.remove('hidden');
    this.ctx.els.panel.classList.add('collapsed');
    this._panelLog();
    this._hud();
    this._toast('nav', this.voy.s.log[0].text);
    if (this.voy.done) this._end();
  }
  _wireCtl() {
    const c = this.ctl;
    c.innerHTML = `<button class="cb" id="v-pause" title="멈춤/계속">${PAUSE}</button><div class="seg">${SPEEDS.map((s) => `<button class="cb sp${s === 1 ? ' on' : ''}" data-s="${s}">${s}×</button>`).join('')}</div><button class="cb tog" id="v-auto">자동 결정</button>`;
    c.querySelector('#v-pause').addEventListener('click', () => { this.paused = !this.paused; c.querySelector('#v-pause').innerHTML = this.paused ? PLAY : PAUSE; });
    c.querySelectorAll('.sp').forEach((b) => b.addEventListener('click', () => { this.speed = +b.dataset.s; c.querySelectorAll('.sp').forEach((x) => x.classList.toggle('on', x === b)); }));
    c.querySelector('#v-auto').addEventListener('click', () => { this.auto = !this.auto; c.querySelector('#v-auto').classList.toggle('on', this.auto); });
  }
  _card(html, onPick, onHint = null) {
    clearTimeout(this._resumeT); this.card.onclick = null;
    this.card.innerHTML = html;
    this.card.classList.remove('hidden');
    this.card.scrollTop = 0;
    bindOpts(this.card, onPick, onHint);
  }
  _eventCard() {
    const v = this.voy, p = v.pending, s = v.s;
    const [catName, color] = CAT[p.ev.cat] || CAT.nav;
    this.card.style.setProperty('--cat', color);
    if (p.ev.fx) this._fx(p.ev.fx);
    this.card.dataset.cat = p.ev.cat; this.card.dataset.ev = p.ev.id;
    this.cockpit.classList.toggle('alert', ALERT.has(p.ev.cat));
    const m = v._m && v._m.alive && ['crew', 'mind', 'med', 'rock', 'sf'].includes(p.ev.cat) && (p.title.includes(v._m.name) || p.desc.includes(v._m.name)) ? v._m : null;
    const who = m ? `<div class="who"><i style="--h:${hue(m.name)}">${esc(m.name[0])}</i><span>${esc(m.name)}<em>${esc(m.role)}</em></span></div>` : '';
    const html = `${art(p.ev.cat, p.ev.id)}<div class="step">${icon(p.ev.cat)} ${catName} · ${fmtAgo(s.tau)} · ${Math.floor(s.age)}세</div><div class="t">${esc(p.title)}</div>${who}<div class="d">${esc(p.desc)}</div>
      <div class="opts">${p.options.map((o, i) => opt(i, o.label, '', o.hint, '', this.hints)).join('')}</div><div class="src">${esc(p.ev.src)}</div>`;
    this._card(html, (i) => this._pick(i), () => { if (this.hints <= 0) return false; this.hints--; this.card.querySelectorAll('.q').forEach((q) => { if (!q.classList.contains('open')) { q.textContent = this.hints > 0 ? `힌트 ${this.hints}` : '힌트 없음'; q.disabled = this.hints <= 0; } }); return true; });
  }
  _pick(i) {
    const v = this.voy;
    this._lastEvId = v.pending?.ev.id;
    const r = v.choose(i);
    if (!r) return;
    if (v.s.hintBonus) { this.hints += v.s.hintBonus; v.s.hintBonus = 0; }
    this._panelLog();
    // 결과 문장을 잠깐 보여주고 저절로 이어진다 (누르면 바로)
    const [catName] = CAT[r.cat] || CAT.nav;
    if (r.fx) this._fx(r.fx);
    this.card.dataset.cat = r.cat; this.cockpit.classList.remove('alert');
    this.card.innerHTML = `${art(r.cat, this._lastEvId)}<div class="step">${icon(r.cat)} ${catName}</div><div class="t">${esc(r.choice)}</div><div class="d result">${esc(r.text)}</div><div class="timer"><i></i></div>`;
    this.card.classList.remove('hidden');
    const hold = Math.min(5200, 1600 + r.text.length * 45);
    this.card.querySelector('.timer i').style.transitionDuration = `${hold}ms`;
    requestAnimationFrame(() => { const t = this.card.querySelector('.timer i'); if (t) t.style.width = '100%'; });
    clearTimeout(this._resumeT);
    this._resumeT = setTimeout(() => this._resume(), hold);
    this.card.onclick = () => { clearTimeout(this._resumeT); this.card.onclick = null; this._resume(); };
    this._hud();
  }
  _resume() {
    this.card.onclick = null;
    if (this.voy.done) return this._end();
    this.card.classList.add('hidden');
  }
  _end() {
    const v = this.voy, s = v.s;
    this.state = s.arrived ? 'arrived' : 'dead';
    this.ctl.classList.add('hidden');
    if (s.arrived) { this.landing.classList.remove('hidden'); requestAnimationFrame(() => this.landing.classList.add('on')); }
    const rows = s.log.map((e) => `<li class="${e.cat}"><i style="--cat:${(CAT[e.cat] || CAT.nav)[1]}">${icon(e.cat)}</i><div><div class="w">${fmtAgo(e.tau)}</div>${esc(e.text)}</div></li>`).join('');
    const dist = v.distM * (1 - s.f);
    this.interior.classList.remove('on'); this.amb.classList.add('hidden'); this.cockpit.classList.remove('alert'); this.card.dataset.cat = s.arrived ? 'earth' : 'end';
    const head = (s.arrived ? art('earth') : art('end')) + (s.arrived
      ? `<div class="step">${icon('earth')} 지구</div><div class="t">돌아왔다</div><div class="d">${esc(v.from.name)}에서 ${fmtDur(s.tau)}. ${v.tEarth() - s.tau > YEAR ? `지구는 ${fmtDur(v.tEarth())}이 지났어요. ` : ''}${Math.floor(s.age)}세, 지구 날짜로 ${v.earthDate()}.</div>`
      : `<div class="step">${icon('end')} 인생 요약</div><div class="t">${Math.floor(s.age)}세, ${fmtDist(dist)} 남은 곳에서</div><div class="d">${esc(s.death.text)}</div>`);
    const kv = `<div class="stats">
      <div><b class="num">${fmtDur(s.tau)}</b><span>배에서 보낸 시간</span></div>
      <div><b class="num">${fmtDist(v.distM * s.f)}</b><span>온 거리${s.arrived ? '' : ` · ${fmtDist(dist)} 남음`}</span></div>
      <div><b class="num">${fmtSv(s.dose)}</b><span>받은 우주 방사선</span></div>
      <div><b class="num">${s.events}</b><span>겪은 사건</span></div>
      <div><b class="num">${s.crewAlive === v.ship.crew ? (v.ship.crew === 1 ? '혼자' : `${v.ship.crew - 1}명 함께`) : `${v.ship.crew - s.crewAlive}명 잃음`}</b><span>동료</span></div>
      <div><b class="num">${s.flags.contact ? '있었어요' : '없었어요'}</b><span>설명 못 한 일</span></div>
    </div>${s.mates.length ? `<div class="mates">${s.mates.map((m) => `<span class="${m.alive ? '' : 'gone'}">${esc(m.name)} <em>${esc(m.role)}</em></span>`).join('')}</div>` : ''}`;
    this._card(`${head}${kv}<div class="section-title" style="margin-top:18px">지나온 길</div><ul class="life">${rows}</ul>
      <div class="opts" style="margin-top:16px">${opt(0, '다시 시작', '다른 곳, 다른 확률로')}</div>`, () => this._setup(true));
    this._hud();
    this._panelLog();
  }
  // ================= 화면 갱신 =================
  _hud() {
    const v = this.voy; if (!v) return;
    const s = v.s, sh = v.ship;
    const g = (id, frac, text) => { const e = document.getElementById(id); e.querySelector('.bar i').style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`; e.querySelector('.bar i').classList.toggle('low', frac < 0.25); e.querySelector('.v').textContent = text; };
    g('g-food', s.food / sh.foodDays, s.food > 0 ? `${fmtDays(s.food)}${s.eco ? ' · 재배' : ''}` : '없음');
    g('g-water', s.water / sh.waterDays, s.water > 0 ? `${fmtDays(s.water)}${s.recycler ? ' · 재활용' : ''}` : '없음');
    g('g-o2', s.o2 / sh.o2Days, s.oga ? `발생기 가동 · 비축 ${fmtDays(s.o2)}` : s.o2 > 0 ? `비축 ${fmtDays(s.o2)}` : '없음');
    g('g-power', s.power, `${Math.round(s.power * 100)} %`);
    g('g-hull', s.hull, `${Math.round(s.hull * 100)} %`);
    g('g-health', s.health, `${Math.round(s.health * 100)} %`);
    g('g-morale', s.morale, `${Math.round(s.morale * 100)} %`);
    g('g-dose', Math.min(1, s.dose / 5), fmtSv(s.dose));
    const left = v.distM * (1 - s.f);
    document.getElementById('c-dist').textContent = s.arrived ? '도착' : fmtDist(left);
    document.getElementById('c-speed').textContent = sh.v >= 0.01 * 299792458 ? `빛의 ${Math.round(v.beta * 100)} %` : `${Math.round(v.v / 1e3)} km/s`;
    document.getElementById('c-earth').textContent = v.earthDate();
    document.getElementById('c-crew').textContent = (s.crewAlive === 1 ? '혼자' : `${s.crewAlive}명`) + (s.hib ? ' · 동면' : s.hibHalf ? ' · 교대 동면' : '');
    this.top.querySelector('.age').textContent = `${Math.floor(s.age)}세`;
    this.top.querySelector('.day').textContent = fmtAgo(s.tau);
    this.top.querySelector('.bar i').style.width = `${(s.f * 100).toFixed(2)}%`;
  }
  _panelLog() {
    const v = this.voy; if (!v) return;
    const b = this.ctx.els.body;
    const rows = v.s.log.slice(-14).reverse().map((e) => `<li><i style="--cat:${(CAT[e.cat] || CAT.nav)[1]}">${icon(e.cat)}</i><div><div class="w">${fmtAgo(e.tau)}</div>${esc(e.text)}</div></li>`).join('');
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">${esc(v.from.name)} → 지구</div><div class="title-lg">${v.ship.name}</div><p class="note">${esc(v.ship.spec)}</p></div>
      <div class="section"><div class="section-title">지나온 길</div><ul class="life">${rows}</ul></div>
      <div class="section"><div class="row"><button class="btn" id="t-restart">처음부터</button></div></div>
    </div>`);
    b.appendChild(this.root);
    this.root.querySelector('#t-restart').addEventListener('click', () => this._setup(true));
  }
  _toast(cat, text) {
    this.toast.innerHTML = `<i style="--cat:${(CAT[cat] || CAT.nav)[1]}">${icon(cat)}</i><span>${esc(text)}</span>`;
    this.toast.classList.add('on'); clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toast.classList.remove('on'), 4200);
  }
  _buildScale() {
    const sc = this.ctx.els.scale;
    sc.innerHTML = '<div class="rail"></div>';
    const lo = this.map.minLog, hi = this.map.maxLog;
    for (const [v, label] of TICKS) {
      const y = 100 - (v - lo) / (hi - lo) * 100;
      const t = el(`<div class="tick ${/km|AU|광년|Gpc/.test(label) ? '' : 'major'}" style="top:${y.toFixed(2)}%">${label}</div>`);
      t.addEventListener('click', () => this.map.zoomTo(v));
      sc.appendChild(t);
    }
    this.cursor = el('<div class="cursor"></div>'); this.cursorLabel = el('<div class="cursor-label num"></div>');
    sc.appendChild(this.cursor); sc.appendChild(this.cursorLabel);
  }

  tick(dt, now) {
    const map = this.map;
    if (this.sceneOn && now - (this._sceneAt || 0) > 100) { this._sceneAt = now; this._drawScene(); }
    if (this.state === 'voyage' && now - (this._ambAt || 0) > 40) { this._ambAt = now; this._ambient(); }
    if (this.state === 'voyage') {
      const v = this.voy;
      if (v.pending && this.card.classList.contains('hidden')) this._eventCard();
      const cardOpen = !this.card.classList.contains('hidden');
      if (!cardOpen) this.autoAt = 0;
      else if (this.auto && !this.autoAt) this.autoAt = now + 1500 + Math.random() * 800;
      if (this.auto && cardOpen && this.autoAt && now >= this.autoAt) {
        this.autoAt = -1;
        const opts = this.card.querySelectorAll('.opt');
        if (opts.length) { const pickEl = opts[Math.floor(Math.random() * opts.length)]; pickEl.classList.add('picked'); setTimeout(() => pickEl.click(), 350); }
      }
      if (!v.pending && !this.paused && this.card.classList.contains('hidden')) {
        const simDt = dt * this.simRate * this.speed;
        const steps = Math.max(1, Math.ceil(simDt / (30 * DAY)));
        for (let k = 0; k < steps && !v.pending && !v.done; k++) v.step(simDt / steps, this.eventGap);
        // 새 기록은 토스트로
        const log = v.s.log;
        if (log.length > this.shownLog) { const le = log[log.length - 1]; if (le.fx) this._fx(le.fx); this._toast(le.cat, le.text); this.shownLog = log.length; if (now - (this._panelAt || 0) > 800) { this._panelAt = now; this._panelLog(); } }
        if (now - (this._hudAt || 0) > 120) { this._hudAt = now; this._hud(); }
        const ship = v.pos();
        map.setShip(v.s.f);
        map.setFirstPerson(ship, this.route.B, true);
        if (v.done && !v.pending) this._end();
      }
    }
    if (this.ctx.bhOn) return;
    if (this.state === 'setup') {
      const lo = map.minLog, hi = map.maxLog;
      const y = 100 - (map.logDist - lo) / (hi - lo) * 100;
      this.cursor.style.top = y + '%'; this.cursorLabel.style.top = y + '%';
      this.cursorLabel.textContent = fmtDist(map.distanceMeters);
      if (now - (this.lastCalc || 0) > 1000) { this.lastCalc = now; map.updatePlanets(new Date()); }
    }
    // 라벨 (초당 20번, 내용이 바뀔 때만)
    if (now - (this._labelAt || 0) < 50) return;
    this._labelAt = now;
    const PRI = { sun: 0, planet: 2, star: 3, bh: 3, galaxy: 4 };
    const labels = map.projectLabels().sort((a, b) => (PRI[a.kind] - (a.data?.body === 'Earth' ? 1 : 0)) - (PRI[b.kind] - (b.data?.body === 'Earth' ? 1 : 0)));
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const placed = [];
    const journey = this.state !== 'setup';
    let html = '';
    for (const lb of labels) {
      if (journey && lb.kind !== 'planet' && lb.kind !== 'sun') continue;
      const x = lb.x / dpr, y = lb.y / dpr;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      if (placed.some((p) => Math.abs(p.x - x) < 70 && Math.abs(p.y - y) < 16)) continue;
      placed.push({ x, y });
      const dest = lb.kind === 'planet' ? lb.data.body : lb.data?.id || '';
      html += `<div class="lbl ${lb.kind}" data-dest="${esc(dest)}" style="left:${x.toFixed(0)}px;top:${(y - 8).toFixed(0)}px">${esc(lb.text)}</div>`;
      if (placed.length > 40) break;
    }
    if (html !== this._labelHtml) { this._labelHtml = html; this.ctx.els.labels.innerHTML = html; }
  }
}

const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>';

// 선택지 한 칸: 제목·설명 + 힌트 버튼 (힌트는 눌러야 펼쳐진다)
function opt(i, label, fx, hint, cls = '', hintsLeft = null) {
  const q = hint ? (hintsLeft == null ? '<button class="q" type="button">힌트</button>' : hintsLeft > 0 ? `<button class="q" type="button">힌트 ${hintsLeft}</button>` : '<button class="q" type="button" disabled>힌트 없음</button>') : '';
  return `<div class="opt${cls ? ' ' + cls : ''}" data-i="${i}" tabindex="0"><div class="row"><div><b>${esc(label)}</b>${fx ? `<span>${esc(fx)}</span>` : ''}</div>${q}</div>${hint ? `<div class="hint hidden">${esc(hint)}</div>` : ''}</div>`;
}
// onHint: 힌트를 열 때 호출, false 를 돌려주면 열지 않는다 (힌트 횟수 제한)
function bindOpts(card, onPick, onHint = null) {
  card.querySelectorAll('.opt').forEach((o) => {
    o.addEventListener('click', (e) => {
      const q = e.target.closest('.q');
      if (q) {
        const h = o.querySelector('.hint');
        if (h.classList.contains('hidden')) { if (q.disabled) return; if (onHint && !onHint()) return; h.classList.remove('hidden'); q.classList.add('open'); q.textContent = '닫기'; }
        else { h.classList.add('hidden'); q.classList.remove('open'); q.textContent = '열기'; }
        return;
      }
      onPick(+o.dataset.i);
    });
    o.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.target.closest('.q')) onPick(+o.dataset.i); });
  });
}

// ---- 표기 ----
export function fmtDist(m) {
  if (m < 0.01 * AU) return `${Math.round(m / 1e3).toLocaleString('en-US')} km`;
  if (m < 0.1 * LY) return `${(m / AU).toPrecision(3)} AU`;
  return `${fmtNum(m / LY)} 광년`;
}
function fmtNum(x) {
  if (x < 10) return x.toPrecision(3);
  if (x < 1e6) return Math.round(x).toLocaleString('en-US');
  if (x < 1e9) return `${(x / 1e6).toPrecision(3)}백만`;
  if (x < 1e12) return `${(x / 1e8).toPrecision(3)}억`;
  return fmtSci(x, 3);
}
function fmtYears(y) { return y < 1e4 ? `${Math.round(y).toLocaleString('en-US')}년` : `${fmtNum(y)}년`; }
export function fmtDur(s) {
  if (!isFinite(s)) return '∞';
  if (s < 60) return `${s.toPrecision(3)} 초`;
  if (s < 3600) return `${(s / 60).toPrecision(3)} 분`;
  if (s < 2 * DAY) return `${(s / 3600).toPrecision(3)} 시간`;
  if (s < 90 * DAY) return `${(s / DAY).toPrecision(3)} 일`;
  if (s < 2 * YEAR) return `${(s / (YEAR / 12)).toPrecision(3)} 개월`;
  return fmtYears(s / YEAR);
}
// 항해 기록용: "3일째", "1년 2개월"
function fmtAgo(s) {
  if (s < DAY) return `${Math.max(1, Math.round(s / 3600))}시간째`;
  const d = s / DAY;
  if (d < 60) return `${Math.round(d)}일째`;
  const y = Math.floor(s / YEAR), mo = Math.floor((s - y * YEAR) / (YEAR / 12));
  if (y === 0) return `${mo}개월째`;
  if (y < 100) return mo ? `${y}년 ${mo}개월` : `${y}년째`;
  return `${fmtYears(y)}째`;
}
function fmtDays(d) { return d < 1 ? '1일 미만' : d < 60 ? `${Math.round(d)}일` : d < 730 ? `${(d / 30.44).toPrecision(2)}개월` : `${(d / 365.25).toPrecision(2)}년`; }
function fmtSv(sv) { return sv < 1e-3 ? `${(sv * 1e6).toPrecision(3)} µSv` : sv < 1 ? `${(sv * 1e3).toPrecision(3)} mSv` : sv < 1e4 ? `${sv.toPrecision(3)} Sv` : `${fmtSci(sv, 2)} Sv`; }
