// 귀환 모드: 우주 어딘가에서 출발해 지구로 무사히 돌아오기. 지금 이 순간의 거리, 실제 탈것의 속도, 실제 위험과 선택.
import * as THREE from 'three';
import { SOLAR, STARS, GALAXIES, SHIPS } from '../data/destinations.js';
import { buildHazards, applyChoices } from '../data/hazards.js';
import { planReturn, HUMAN_K } from '../physics/trip.js';
import { AU, PC, LY, KPC, MPC, YEAR, DAY, M_SUN, rg, rs } from '../physics/constants.js';
import { horizons, energyFromRest } from '../physics/gr.js';
import { fmtSolar, fmtKm, fmtSci, esc, el } from './format.js';
import { tiltDir, radecToGalUnit } from '../scene/map.js';

const TICKS = [
  [7, '10,000 km'], [Math.log10(3.844e8), '달 궤도'], [Math.log10(AU), '1 AU'], [Math.log10(30 * AU), '해왕성 궤도'],
  [Math.log10(1000 * AU), '1,000 AU'], [Math.log10(LY), '1 광년'], [Math.log10(10 * LY), '10 광년'], [Math.log10(100 * LY), '100 광년'],
  [Math.log10(1000 * LY), '1,000 광년'], [Math.log10(8.277 * KPC), '은하 중심'], [Math.log10(30 * KPC), '우리은하'],
  [Math.log10(761 * KPC), '안드로메다'], [Math.log10(16.8 * MPC), 'M87'], [Math.log10(1000 * MPC), '1 Gpc'],
];
const SHIP_ANIM = 6; // 탈것 이동 연출 (초)
const HUMAN_HEIGHT = 1.75;

export class TripMode {
  constructor(ctx) {
    this.ctx = ctx;
    this.map = ctx.map;
    this.from = 'Mars';
    this.ship = 'parker';
    this.age = 30;
    this.bhLogR = 2;          // log10(r / r_s)
    this.bhOn = false;
    this.choices = {};
    this.shipT = 1;
    this.lastCalc = 0;
    this._buildScale();
    const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
    ctx.els.mapCanvas.addEventListener('click', (e) => {
      const hit = this.map.pickAt(e.clientX * dpr(), e.clientY * dpr(), 26 * dpr());
      if (hit) this.setFrom(hit.kind === 'planet' ? hit.data.body : hit.data.id);
    });
    ctx.els.labels.addEventListener('click', (e) => {
      const t = e.target.closest('.lbl'); if (!t?.dataset.dest) return;
      this.setFrom(t.dataset.dest);
    });
  }
  // 출발지 목록
  starts() {
    if (this._starts) return this._starts;
    const bhs = this.ctx.catalog.filter((b) => !b.infoOnly && b.ra != null && b.distPc != null);
    this._starts = [
      ...SOLAR.map((d) => ({ ...d, kind: 'solar', group: '태양계' })),
      ...STARS.map((d) => ({ ...d, kind: 'star', group: '가까운 별' })),
      ...bhs.map((b) => ({ id: b.id, name: b.short, kind: 'bh', group: '블랙홀 곁', bh: b, ra: b.ra, dec: b.dec, distPc: b.distPc })),
      ...GALAXIES.map((d) => ({ ...d, kind: 'galaxy', group: '다른 은하' })),
    ];
    return this._starts;
  }
  start(id) { return this.starts().find((d) => d.id === id); }
  // 위치 (미터, 태양중심 은하좌표)
  posOf(d, date) {
    if (d.kind === 'solar') { const h = this.map._helioGal(d.body, date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }
    const u = radecToGalUnit(d.ra, d.dec);
    return new THREE.Vector3(u[0], u[1], u[2]).multiplyScalar(d.distPc * PC);
  }
  earthPos(date) { const h = this.map._helioGal('Earth', date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }

  enter() {
    const b = this.ctx.els.body;
    b.innerHTML = '';
    const groups = {};
    for (const d of this.starts()) (groups[d.group] ??= []).push(d);
    const opts = Object.entries(groups).map(([g, ds]) => `<optgroup label="${g}">${ds.map((d) => `<option value="${d.id}"${d.id === this.from ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</optgroup>`).join('');
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">지금 이 순간의 우주</div><div class="title-lg">지구로 돌아가기</div></div>
      <div class="section">
        <div class="ctl"><label>출발</label><select id="t-from">${opts}</select></div>
        <div class="ctl"><label>탈것</label><select id="t-ship">${SHIPS.map((s) => `<option value="${s.id}"${s.id === this.ship ? ' selected' : ''}>${esc(s.name)}${s.real ? '' : ' · 가상'}</option>`).join('')}</select></div>
        <p class="note tiny" id="t-shipnote" style="margin:-2px 0 6px 102px"></p>
        <div class="ctl"><label>내 나이</label><input type="number" id="t-age" min="1" max="100" step="1" value="${this.age}"><span class="val">세</span></div>
      </div>
      <div class="section" id="t-bh" hidden></div>
      <div class="section" id="t-result"></div>
      <div class="section" id="t-events"></div>
      <div class="section"><details class="refs"><summary>계산 방법</summary><ul>
        <li>거리는 지금 이 순간의 위치로 계산해요 (행성: VSOP87, 별: Gaia 시차, 블랙홀: 각 논문). 지구도 그 사이 움직이지만 출발 순간의 위치로 둬요.</li>
        <li>탈것은 일정한 속도로 간다고 보고, 가속·감속은 빼요. 빛에 가까우면 여행자의 시계가 느리게 가요 (특수상대론).</li>
        <li>우주 방사선: 화성으로 가던 큐리오시티가 잰 1.84 mSv/일 (Zeitlin 2013). 치명 암 위험은 1 Sv 당 5.5 % (ICRP 103), 누적 5 Sv 를 넘으면 급격히 위험해져요. 차폐는 없다고 봐요.</li>
        <li>수명: 기대수명 약 81세의 Gompertz 사망률 곡선으로 도착할 때까지 살아 있을 확률.</li>
        <li>블랙홀 곁 출발: 머리와 발에 걸리는 중력 차이로 의식을 잃는 50 s⁻² 와 몸이 찢어지는 1000 s⁻² 사이를 선형으로, 지평선 안쪽은 0 %.</li>
        <li>착륙은 하지 않고 궤도에서 출발해요. 무사 귀환 확률은 위의 요인들을 곱한 값이에요.</li>
      </ul></details></div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#t-from').addEventListener('change', (e) => { this.from = e.target.value; this.choices = {}; this.update(true); });
    q('#t-ship').addEventListener('change', (e) => { this.ship = e.target.value; this.update(true); });
    q('#t-age').addEventListener('input', (e) => { this.age = Math.min(100, Math.max(1, +e.target.value || 30)); this.update(false); });
    this.ctx.setHint('끌기 회전 · 휠/핀치 거리 · 행성·별·블랙홀을 누르면 거기서 출발');
    this.update(true);
  }
  setFrom(id) {
    if (!this.start(id) || id === this.from) return;
    this.from = id; this.choices = {};
    const sel = this.root?.querySelector('#t-from'); if (sel) sel.value = id;
    this.update(true);
  }

  // 계산 + 패널 갱신. fly: 지도 카메라·탈것 연출 다시 시작
  update(fly) {
    const now = new Date();
    const from = this.start(this.from);
    const ship = SHIPS.find((s) => s.id === this.ship);
    const A = this.posOf(from, now), B = this.earthPos(now);
    const distM = A.distanceTo(B);
    const bh = from.kind === 'bh' ? from.bh : null;
    const chi = bh ? Math.min(0.998, bh.spin ?? 0) : 0;
    const rOverRg = bh ? Math.pow(10, this.bhLogR) * 2 : null;
    const bhArg = bh ? { massSolar: bh.mass, chi, rOverRg } : null;
    // 1차: 사건 없이 시간을 구해 사건 목록을 만든다
    const base = planReturn({ distM, v: ship.v, age: this.age, bh: bhArg });
    const ctxVals = { from, beta: base.beta, tauYears: base.tau / YEAR, startAU: from.kind === 'solar' ? A.length() / AU : null, distLy: distM / LY };
    this.hazards = buildHazards(ctxVals);
    const mods = applyChoices(this.hazards, this.choices, ctxVals);
    const R = planReturn({ distM, v: ship.v, age: this.age, bh: bhArg, mods });
    this.plan = { from, ship, A, B, distM, R, bh, chi };
    this._renderBH();
    this._renderEvents();
    this._renderResult();
    this.root.querySelector('#t-shipnote').textContent = ship.note;
    if (fly) this._fly();
  }
  _fly() {
    const { A, B, distM } = this.plan;
    const map = this.map;
    map.setRoute(A, B);
    this.shipT = 0;
    map.setFocus(A.clone().add(B).multiplyScalar(0.5));
    const ab = B.clone().sub(A).normalize();
    let perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(0, 0, 1));
    if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(1, 0, 0));
    perp.normalize();
    map.flyTo(tiltDir(perp, 0.5), Math.log10(Math.max(distM * 1.6, 2e8)), false);
    if (this.bhOn) this._showBH(false);
  }

  _renderEvents() {
    const box = this.root.querySelector('#t-events');
    box.innerHTML = `<div class="section-title">가는 길 · 고르면 확률이 바뀌어요</div>` + this.hazards.map((h) => {
      const cur = this.choices[h.id] ?? 0;
      return `<div class="ev ${h.cls || ''}" data-ev="${h.id}">
        <div class="t">${esc(h.title)}</div>
        <div class="d">${esc(h.desc)}</div>
        ${h.fixed ? `<div class="fx">${esc(h.options[0].fx)}</div>` : `<div class="chips">${h.options.map((o, i) => `<button class="chip${i === cur ? ' active' : ''}" data-i="${i}">${esc(o.label)}</button>`).join('')}</div>
        <div class="fx">${esc(h.options[cur].fx)}</div>`}
      </div>`;
    }).join('');
    box.querySelectorAll('.ev').forEach((evEl) => evEl.querySelectorAll('.chip').forEach((ch) => ch.addEventListener('click', () => { this.choices[evEl.dataset.ev] = +ch.dataset.i; this.update(false); })));
  }
  _renderResult() {
    const { from, ship, distM, R, bh } = this.plan;
    const pct = (p) => p >= 0.995 ? '99 % 이상' : p >= 0.01 ? `${Math.round(p * 100)} %` : p >= 1e-4 ? `${(p * 100).toFixed(2)} %` : p > 0 ? '0 % 에 가까움' : '0 %';
    const dil = R.gamma > 1.05;
    const arrDate = new Date(Date.now() + R.tEarth * 1e3);
    const arrText = R.earthYears < 7000 ? arrDate.toISOString().slice(0, 10) : `${fmtYears(R.earthYears)} 뒤`;
    let verdict;
    if (R.bh?.inside) verdict = `지평선 안에서는 빠져나올 수 없어요.`;
    else if (R.bh && R.pBH === 0) verdict = `블랙홀에 너무 가까워요. 출발하기도 전에 머리와 발의 중력 차이로 몸이 찢어져요.`;
    else if (R.pLife < 1e-3 && R.tau > 120 * YEAR) verdict = `내 시계로 ${fmtDur(R.tau)}. 사람의 수명 안에는 도착할 수 없어요.`;
    else if (R.dose > 5) verdict = `${fmtDur(R.tau)} 동안 우주 방사선 ${R.dose.toFixed(1)} Sv. 차폐 없이는 버티기 어려워요.`;
    else if (dil) verdict = `내 시계로는 ${fmtDur(R.tau)}이지만 지구는 ${fmtDur(R.tEarth)}이 지나요. 도착하면 ${Math.round(R.arriveAge)}세.`;
    else verdict = `도착하면 ${Math.round(R.arriveAge)}세, 지구 날짜로 ${arrText}.`;
    this.root.querySelector('#t-result').innerHTML = `
      <div class="bigp"><div class="l">무사 귀환 확률</div><div class="v num">${pct(R.p)}</div><div class="bar"><i style="width:${(Math.max(0.004, R.p) * 100).toFixed(1)}%"></i></div></div>
      <div class="stat-row">
        <div class="stat"><div class="l">지구까지 · 지금</div><div class="v num">${fmtDist(distM)}</div></div>
        <div class="stat"><div class="l">걸리는 시간${dil ? ' · 내 시계' : ''}</div><div class="v num">${fmtDur(R.tau)}</div></div>
        <div class="stat"><div class="l">빛으로</div><div class="v num">${fmtDur(R.lightTime)}</div></div>
      </div>
      <div class="kv" style="margin-top:10px">
        ${dil ? `<div class="k">지구 시계로</div><div class="v num">${fmtDur(R.tEarth)}</div>` : ''}
        <div class="k">도착</div><div class="v num">${arrText}${R.arriveAge < 130 ? `<small>${Math.round(R.arriveAge)}세</small>` : ''}</div>
        <div class="k">우주 방사선</div><div class="v num">${fmtSv(R.dose)}<small>${pct(R.pRad)}</small></div>
        <div class="k">수명</div><div class="v num">${pct(R.pLife)}</div>
        ${bh ? `<div class="k">블랙홀 탈출</div><div class="v num">${pct(R.pBH)}</div>` : ''}
        ${R.pEvents < 0.9999 ? `<div class="k">가는 길의 선택</div><div class="v num">${pct(R.pEvents)}</div>` : ''}
        <div class="k">재진입</div><div class="v num">${pct(R.pReentry)}</div>
      </div>
      <p class="note" style="margin-top:10px">${esc(verdict)}</p>`;
  }
  _renderBH() {
    const box = this.root.querySelector('#t-bh');
    const { bh, R } = this.plan;
    if (!bh) { box.hidden = true; if (this.bhOn) this._showBH(false); return; }
    box.hidden = false;
    const Mkg = bh.mass * M_SUN, rsm = rs(Mkg);
    const r = Math.pow(10, this.bhLogR);
    const dg = R.bh.inside ? null : R.bh.k * HUMAN_HEIGHT / 9.80665;
    const state = R.bh.inside ? '지평선 안 · 빠져나올 수 없어요' : R.bh.k >= HUMAN_K.tear ? '몸이 찢어져요' : R.bh.k >= HUMAN_K.faint ? '의식을 잃어요' : R.bh.k >= HUMAN_K.feel ? '당김이 느껴져요' : '편안해요';
    box.innerHTML = `
      <div class="section-title">${esc(bh.short)} 곁에서</div>
      <div class="ctl"><label>거리</label><input type="range" id="t-r" min="-0.4" max="3" step="0.01" value="${this.bhLogR}"><span class="val num" id="t-r-v">${fmtRs(r)}</span></div>
      <div class="kv">
        <div class="k">중심에서</div><div class="v num">${fmtKm(r * rsm)}</div>
        <div class="k">질량</div><div class="v num">${fmtSolar(bh.mass)}</div>
        <div class="k">지평선 지름</div><div class="v num">${fmtKm(2 * R.bh.rPlus * rg(Mkg))}</div>
        <div class="k">머리–발 중력 차</div><div class="v num">${dg == null ? '—' : dg < 1e-3 ? '거의 0' : dg >= 1e4 ? fmtSci(dg, 2) + ' g' : dg.toPrecision(3) + ' g'}</div>
      </div>
      <p class="note" style="margin-top:8px">${state}.</p>
      <div class="row" style="margin-top:10px"><button class="btn ${this.bhOn ? '' : 'primary'}" id="t-bhview">${this.bhOn ? '지도로' : '블랙홀 보기'}</button></div>`;
    box.querySelector('#t-r').addEventListener('input', (e) => { this.bhLogR = +e.target.value; this.update(false); if (this.bhOn) this._applyBHCamera(); });
    box.querySelector('#t-bhview').addEventListener('click', () => this._showBH(!this.bhOn));
  }
  _showBH(on) {
    this.bhOn = on;
    this.ctx.showBH(on);
    if (on) {
      const { bh } = this.plan;
      this.ctx.bh.setBH(bh, { inc: bh.inc ?? 75, dist: 'auto' });
      this.ctx.bh.animate = true;
      this._applyBHCamera();
      this.ctx.setHint('끌기 회전 · 휠/핀치 거리');
    } else {
      this.ctx.bh.clearFall();
      this.ctx.setHint('끌기 회전 · 휠/핀치 거리 · 행성·별·블랙홀을 누르면 거기서 출발');
    }
    this._renderBH();
  }
  _applyBHCamera() {
    const V = this.ctx.bh, { chi } = this.plan;
    const rG = Math.pow(10, this.bhLogR) * 2;
    const { rPlus } = horizons(chi);
    if (rG <= rPlus * 1.02) {
      // 지평선 안: 떨어지는 관측자의 눈으로, 온 길을 돌아본다
      V.setFall(Math.max(rG, rPlus * 0.55), energyFromRest(1000, chi), chi, 'up');
    } else {
      V.clearFall();
      V.target.dist = Math.min(200, Math.max(3, rG));
      V.touch();
    }
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
    if (this.bhOn) return;
    const map = this.map;
    // 탈것 연출 (출발지 → 지구)
    if (this.shipT < 1) { this.shipT = Math.min(1, this.shipT + dt / SHIP_ANIM); const u = this.shipT; map.setShip(u * u * (3 - 2 * u)); }
    // 눈금 커서
    const lo = map.minLog, hi = map.maxLog;
    const y = 100 - (map.logDist - lo) / (hi - lo) * 100;
    this.cursor.style.top = y + '%'; this.cursorLabel.style.top = y + '%';
    this.cursorLabel.textContent = fmtDist(map.distanceMeters);
    // 행성 위치 (1초마다) — 태양계 출발이면 거리도 다시 계산
    if (now - this.lastCalc > 1000) { this.lastCalc = now; map.updatePlanets(new Date()); if (this.plan?.from.kind === 'solar') this.update(false); }
    // 라벨 (초당 20번, 내용이 바뀔 때만)
    if (now - (this._labelAt || 0) < 50) return;
    this._labelAt = now;
    const PRI = { sun: 0, planet: 2, star: 3, bh: 3, galaxy: 4 };
    const labels = map.projectLabels().sort((a, b) => (PRI[a.kind] - (a.data?.body === 'Earth' ? 1 : 0)) - (PRI[b.kind] - (b.data?.body === 'Earth' ? 1 : 0)));
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const placed = [];
    let html = '';
    for (const l of labels) {
      const x = l.x / dpr, y2 = l.y / dpr;
      if (x < 40 || x > innerWidth - 40 || y2 < 60 || y2 > innerHeight - 40) continue;
      if (placed.some((p) => Math.abs(p.x - x) < 70 && Math.abs(p.y - y2) < 16)) continue;
      placed.push({ x, y: y2 });
      const id = l.kind === 'planet' ? l.data.body : l.kind === 'star' || l.kind === 'bh' ? l.data.id : null;
      const sel = id && (id === this.from || id === 'Earth');
      html += `<div class="lbl ${l.kind}${sel ? ' selected' : ''}" ${id && id !== 'Earth' ? `data-dest="${id}"` : ''} style="left:${x.toFixed(1)}px;top:${y2.toFixed(1)}px;opacity:${l.alpha.toFixed(2)}">${esc(l.text)}</div>`;
    }
    if (html !== this._labelHtml) { this._labelHtml = html; this.ctx.els.labels.innerHTML = html; }
  }
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
function fmtSv(sv) { return sv < 1e-3 ? `${(sv * 1e6).toPrecision(3)} µSv` : sv < 1 ? `${(sv * 1e3).toPrecision(3)} mSv` : sv < 1e4 ? `${sv.toPrecision(3)} Sv` : `${fmtSci(sv, 2)} Sv`; }
function fmtRs(r) { return r < 1 ? `지평선 안 (${r.toFixed(2)} r_s)` : `${r < 10 ? r.toFixed(1) : Math.round(r).toLocaleString('en-US')} r_s`; }
