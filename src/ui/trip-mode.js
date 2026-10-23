// 지구로 돌아가기: 출발지를 고르고, 사건이 하나씩 나올 때마다 선택하며 1인칭으로 지구까지 간다.
import * as THREE from 'three';
import { SOLAR, STARS, GALAXIES, SHIPS } from '../data/destinations.js';
import { buildHazards, applyChoices } from '../data/hazards.js';
import { planReturn, blackHoleSurvival, HUMAN_K } from '../physics/trip.js';
import { AU, PC, LY, KPC, MPC, YEAR, DAY, M_SUN, rs } from '../physics/constants.js';
import { horizons, energyFromRest } from '../physics/gr.js';
import { fmtSolar, fmtKm, fmtSci, esc, el } from './format.js';
import { tiltDir, radecToGalUnit } from '../scene/map.js';

const TICKS = [
  [7, '10,000 km'], [Math.log10(3.844e8), '달 궤도'], [Math.log10(AU), '1 AU'], [Math.log10(30 * AU), '해왕성 궤도'],
  [Math.log10(1000 * AU), '1,000 AU'], [Math.log10(LY), '1 광년'], [Math.log10(10 * LY), '10 광년'], [Math.log10(100 * LY), '100 광년'],
  [Math.log10(1000 * LY), '1,000 광년'], [Math.log10(8.277 * KPC), '은하 중심'], [Math.log10(30 * KPC), '우리은하'],
  [Math.log10(761 * KPC), '안드로메다'], [Math.log10(16.8 * MPC), 'M87'], [Math.log10(1000 * MPC), '1 Gpc'],
];
const TRAVEL_ANIM = 3.2;   // 사건 사이 이동 연출 (초)
const HUMAN_HEIGHT = 1.75;
const BH_STARTS = [[3, '멀찍이'], [1, '가까이'], [0.18, '지평선 바로 앞']]; // log10(r/r_s)

// 선택지 한 칸: 제목·효과 + 힌트 버튼 (힌트는 눌러야 펼쳐진다)
function opt(i, label, fx, hint, cls = '') {
  return `<div class="opt${cls ? ' ' + cls : ''}" data-i="${i}" tabindex="0"><div class="row"><div><b>${esc(label)}</b><span>${esc(fx || '')}</span></div>${hint ? `<button class="q" type="button">힌트</button>` : ''}</div>${hint ? `<div class="hint hidden">${esc(hint)}</div>` : ''}</div>`;
}
function bindOpts(card, onPick) {
  card.querySelectorAll('.opt').forEach((o) => {
    o.addEventListener('click', (e) => {
      if (e.target.closest('.q')) { const h = o.querySelector('.hint'); const open = h.classList.toggle('hidden'); e.target.textContent = open ? '힌트' : '닫기'; return; }
      onPick(+o.dataset.i);
    });
    o.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.target.closest('.q')) onPick(+o.dataset.i); });
  });
}

export class TripMode {
  constructor(ctx) {
    this.ctx = ctx;
    this.map = ctx.map;
    this.from = 'Mars';
    this.age = 30;
    this.state = 'setup';
    this.lastCalc = 0;
    this._buildScale();
    const dpr = () => Math.min(devicePixelRatio || 1, 1.5);
    ctx.els.mapCanvas.addEventListener('click', (e) => {
      if (this.state !== 'setup') return;
      const hit = this.map.pickAt(e.clientX * dpr(), e.clientY * dpr(), 26 * dpr());
      if (hit) this.setFrom(hit.kind === 'planet' ? hit.data.body : hit.data.id);
    });
    ctx.els.labels.addEventListener('click', (e) => {
      const t = e.target.closest('.lbl'); if (!t?.dataset.dest || this.state !== 'setup') return;
      this.setFrom(t.dataset.dest);
    });
    this.card = document.getElementById('card');
    this.cockpit = document.getElementById('cockpit');
  }
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
  posOf(d, date) {
    if (d.kind === 'solar') { const h = this.map._helioGal(d.body, date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }
    const u = radecToGalUnit(d.ra, d.dec);
    return new THREE.Vector3(u[0], u[1], u[2]).multiplyScalar(d.distPc * PC);
  }
  earthPos(date) { const h = this.map._helioGal('Earth', date); return new THREE.Vector3(h[0] * AU, h[1] * AU, h[2] * AU); }

  // ================= 준비 =================
  enter() { this._setup(true); }
  _setup(fly) {
    this.state = 'setup';
    this.steps = null; this.choices = {}; this.ship = null; this.bhLogR = 3; this.f = 0;
    this.map.exitFirstPerson();
    this.card.classList.add('hidden'); this.cockpit.classList.add('hidden');
    this.ctx.els.scale.classList.remove('hidden');
    this.ctx.els.panel.classList.remove('collapsed');
    if (this.ctx.bhOn) this.ctx.showBH(false);
    const b = this.ctx.els.body;
    b.innerHTML = '';
    const n = this.starts().length;
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">지금 이 순간의 우주</div><div class="title-lg">지구로 돌아가기</div>
        <p class="note" style="margin-top:6px">우주 어딘가에서 눈을 떠요. 어디일지는 고를 수 없어요. 사건이 하나씩 닥칠 때마다 고르면서 지구로 돌아오세요. 거리·속도·위험은 전부 실제 측정값이고, 결과는 그 확률대로 한 번 굴려요.</p></div>
      <div class="section">
        <div class="ctl"><label>내 나이</label><input type="number" id="t-age" min="1" max="100" step="1" value="${this.age}"><span class="val">세</span></div>
        <div class="kv" style="margin-top:8px" id="t-now"></div>
        <div class="row" style="margin-top:14px"><button class="btn primary block" id="t-go">눈 뜨기</button></div>
        <p class="note tiny" style="margin-top:8px">출발지 ${n}곳 중 하나: 달·행성, 가까운 별, 블랙홀 곁, 다른 은하.</p>
      </div>
      <div class="section"><details class="refs"><summary>계산 방법</summary><ul>
        <li>거리는 지금 이 순간의 위치로 계산해요 (행성: VSOP87, 별: Gaia 시차, 블랙홀: 각 논문).</li>
        <li>탈것은 일정한 속도로 간다고 보고 가속·감속은 빼요. 빛에 가까우면 여행자의 시계가 느리게 가요.</li>
        <li>우주 방사선: 화성으로 가던 큐리오시티가 잰 1.84 mSv/일 (Zeitlin 2013). 치명 암 위험 1 Sv 당 5.5 % (ICRP 103), 누적 5 Sv 를 넘으면 급격히 위험해져요.</li>
        <li>수명: 기대수명 약 81세의 Gompertz 곡선으로 도착할 때까지 살아 있을 확률.</li>
        <li>블랙홀 곁: 머리와 발의 중력 차이로 의식을 잃는 50 s⁻² 와 몸이 찢어지는 1000 s⁻² 사이를 선형으로, 지평선 안쪽은 0 %.</li>
        <li>무사 귀환 확률 = 수명 × 피폭 × 블랙홀 × 가는 길의 선택 × 재진입(1/180).</li>
      </ul></details></div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#t-age').addEventListener('input', (e) => { this.age = Math.min(100, Math.max(1, +e.target.value || 30)); });
    q('#t-go').addEventListener('click', () => this._wake());
    this.ctx.setHint('끌기 회전 · 휠/핀치 거리');
    this.from = null; this.route = null;
    this.map.clearRoute(); this.map.focusSun();
    if (fly) this.map.flyTo(tiltDir(new THREE.Vector3(0.6, -1.4, 0).normalize(), 0.55), 12.2, false);
  }
  // 무작위 출발지에서 눈을 뜬다
  _wake() {
    const list = this.starts();
    this.from = list[Math.floor(Math.random() * list.length)].id;
    this._setupRoute(true);
    const { from, distM } = this.route;
    const kindText = { solar: '태양계', star: '별', bh: '블랙홀 곁', galaxy: '다른 은하' }[from.kind];
    this.card.innerHTML = `<div class="step">눈을 뜬 곳 · ${kindText}</div><div class="t">${esc(from.name)}</div>
      <div class="d">${from.note ? esc(from.note) + '<br>' : ''}지구까지 ${fmtDist(distM)}. 빛으로도 ${fmtDur(distM / 299792458)}.${from.kind === 'bh' ? ` 블랙홀 질량 ${fmtSolar(from.bh.mass)}.` : ''}</div>
      <div class="opts"><div class="opt" id="t-begin" tabindex="0"><b>출발 준비</b><span>탈것을 고르고 떠나요</span></div></div>`;
    this.card.classList.remove('hidden');
    this.card.querySelector('#t-begin').addEventListener('click', () => this._begin());
    this.ctx.els.panel.classList.add('collapsed');
    this.ctx.els.scale.classList.add('hidden');
    this.ctx.setHint('');
    this.state = 'woke';
  }
  setFrom(id) {
    if (!this.start(id) || id === this.from || this.state !== 'never') return;
    this.from = id;
    const sel = this.root?.querySelector('#t-from'); if (sel) sel.value = id;
    this._setupRoute(true);
  }
  _setupRoute(fly) {
    const now = new Date();
    const from = this.start(this.from);
    const A = this.posOf(from, now), B = this.earthPos(now);
    this.route = { from, A, B, distM: A.distanceTo(B) };
    const nowEl = this.root.querySelector('#t-now');
    if (nowEl) nowEl.innerHTML = `<div class="k">눈 뜬 곳</div><div class="v">${esc(from.name)}</div><div class="k">지구까지 · 지금</div><div class="v num">${fmtDist(this.route.distM)}</div><div class="k">빛으로</div><div class="v num">${fmtDur(this.route.distM / 299792458)}</div>${from.kind === 'bh' ? `<div class="k">블랙홀 질량</div><div class="v num">${fmtSolar(from.bh.mass)}</div>` : from.note ? `<div class="k"></div><div class="v small faint">${esc(from.note)}</div>` : ''}`;
    if (!fly) return;
    const map = this.map;
    map.setRoute(A, B); map.setShip(0);
    map.setFocus(A.clone().add(B).multiplyScalar(0.5));
    const ab = B.clone().sub(A).normalize();
    let perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(0, 0, 1));
    if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3().crossVectors(ab, new THREE.Vector3(1, 0, 0));
    map.flyTo(tiltDir(perp.normalize(), 0.5), Math.log10(Math.max(this.route.distM * 1.6, 2e8)), false);
  }

  // ================= 여정 =================
  _begin() {
    const { from } = this.route;
    this.state = 'journey';
    this.steps = [];
    if (from.kind === 'bh') this.steps.push({ type: 'bh', at: 0 });
    this.steps.push({ type: 'ship', at: 0 });
    this.idx = -1; this.f = 0; this.travelTo = null;
    this.ctx.els.scale.classList.add('hidden');
    this.ctx.setHint('');
    this.map.setShip(0);
    this.map.setFirstPerson(this.route.A, this.route.B, true);
    this.cockpit.classList.remove('hidden');
    this.ctx.els.panel.classList.add('collapsed');
    this._next();
  }
  // 지금까지의 선택으로 계산
  _calc() {
    const { from, distM } = this.route;
    const ship = this.ship || SHIPS[1];
    const bh = from.kind === 'bh' ? from.bh : null;
    const chi = bh ? Math.min(0.998, bh.spin ?? 0) : 0;
    const bhArg = bh ? { massSolar: bh.mass, chi, rOverRg: Math.pow(10, this.bhLogR) * 2 } : null;
    const base = planReturn({ distM, v: ship.v, age: this.age, bh: bhArg });
    const ctxVals = { from, beta: base.beta, tauYears: base.tau / YEAR, startAU: from.kind === 'solar' ? this.route.A.length() / AU : null, distLy: distM / LY };
    this.ctxVals = ctxVals;
    if (!this.hazards && this.ship) this.hazards = buildHazards(ctxVals, this.choices);
    const mods = this.hazards ? applyChoices(this.hazards, this.choices, ctxVals) : {};
    const R = planReturn({ distM, v: ship.v, age: this.age, bh: bhArg, mods });
    this.plan = { ship, bh, chi, R };
    return R;
  }
  _next() {
    this.idx++;
    if (this.idx >= this.steps.length) { this._finish(); return; }
    const st = this.steps[this.idx];
    const at = st.at ?? st.h.at;
    if (at > this.f + 1e-6) { this.travelTo = at; this.travelFrom = this.f; this.travelT = 0; this.card.classList.add('hidden'); }
    else this._showCard();
    this._panelJourney();
  }
  _choose(i) {
    const st = this.steps[this.idx];
    if (st.type === 'bh') { this.bhLogR = BH_STARTS[i][0]; st.chosen = BH_STARTS[i][1]; if (this.ctx.bhOn) this.ctx.showBH(false); }
    else if (st.type === 'ship') {
      this.ship = SHIPS[i]; st.chosen = SHIPS[i].name;
      this.hazards = null; this._calc();
      this._rebuildSteps();
    } else {
      this.choices[st.h.id] = i; st.chosen = st.h.options[i].label; st.fx = st.h.options[i].fx;
      this.hazards = buildHazards(this.ctxVals, this.choices);
      this._rebuildSteps();
    }
    this._next();
  }
  // 아직 안 고른 사건을 지금 위치부터 다시 줄 세운다 (동료·식량 선택에 따라 뒤 사건이 달라짐)
  _rebuildSteps() {
    this.steps = this.steps.slice(0, this.idx + 1);
    for (const h of this.hazards) if (this.choices[h.id] == null && h.at >= this.f - 1e-6) this.steps.push({ type: 'hazard', h });
  }
  _showCard() {
    const st = this.steps[this.idx];
    const R = this._calc();
    const nH = this.steps.filter((x) => x.type === 'hazard').length, kH = this.steps.slice(0, this.idx + 1).filter((x) => x.type === 'hazard').length;
    let html;
    if (st.type === 'bh') {
      const bh = this.route.from.bh, Mkg = bh.mass * M_SUN;
      const opts = BH_STARTS.map(([lg, name], i) => {
        const r = Math.pow(10, lg);
        const res = blackHoleSurvival(bh.mass, this.plan.chi, r * 2);
        const dg = res.inside ? null : res.k * HUMAN_HEIGHT / 9.80665;
        const state = res.inside ? '빠져나올 수 없어요' : res.k >= HUMAN_K.tear ? '몸이 찢어져요' : res.k >= HUMAN_K.faint ? '의식을 잃어요' : res.k >= HUMAN_K.feel ? '당김이 느껴져요' : '편안해요';
        const hint = res.inside ? '사건의 지평선 안이에요. 빛도 못 나오니 어떤 배도 못 나와요.' : `머리와 발이 받는 중력이 ${dg < 1e-3 ? '거의 같아요' : `${dg >= 1e4 ? fmtSci(dg, 2) : dg.toPrecision(3)} g 만큼 달라요`}. 사람은 50 s⁻² 쯤에서 의식을 잃고 1000 s⁻² 에서 몸이 둘로 갈라져요. 무거운 블랙홀일수록 지평선 가까이가 오히려 부드러워요.`;
        return opt(i, `${name} · ${fmtKm(r * rs(Mkg))}`, `${r.toFixed(2).replace(/\.?0+$/, '')} r_s · 머리–발 중력 차 ${dg == null ? '—' : dg < 1e-3 ? '거의 0' : dg >= 1e4 ? fmtSci(dg, 2) + ' g' : dg.toPrecision(3) + ' g'} · ${state}`, hint, res.p === 0 ? 'danger' : '');
      }).join('');
      html = `<div class="step">출발</div><div class="t">${esc(bh.short)} 곁에서 눈을 떴어요</div>
        <div class="d">질량 ${fmtSolar(bh.mass)}, 지평선 지름 ${fmtKm(2 * horizons(this.plan.chi).rPlus * rs(Mkg) / 2)}. 어느 거리에서 출발할까요? 가까울수록 머리와 발에 걸리는 중력이 달라요.</div>
        <div class="opts">${opts}</div><div class="src">조석 기울기 2GM/r³ (커 축 위 정확식) · 사람 한계는 research/disruption-physics.md</div>`;
      if (!this.ctx.bhOn) { this.ctx.showBH(true); this.ctx.bh.setBH(bh, { inc: bh.inc ?? 75, dist: 'auto' }); this.ctx.bh.animate = true; this.ctx.bh.clearFall(); }
    } else if (st.type === 'ship') {
      const { distM } = this.route;
      html = `<div class="step">출발</div><div class="t">무엇을 타고 갈까요</div>
        <div class="d">지구까지 ${fmtDist(distM)}. 빛으로도 ${fmtDur(distM / 299792458)} 걸려요.</div>
        <div class="opts">${SHIPS.map((s, i) => { const t = planReturn({ distM, v: s.v, age: this.age }); return opt(i, `${s.name} · ${fmtDur(t.tau)}${t.gamma > 1.02 ? ` (지구 시계 ${fmtDur(t.tEarth)})` : ''}`, s.fx, s.desc); }).join('')}</div>`;
    } else {
      const h = st.h;
      html = `<div class="step">사건 ${kH} / ${nH} · ${fmtDist(this.route.distM * (1 - this.f))} 남음</div><div class="t">${esc(h.title)}</div><div class="d">${esc(h.desc)}</div>
        <div class="opts">${h.options.map((o, i) => opt(i, o.label, o.fx, o.hint)).join('')}</div>
        <div class="src">${esc(h.src)}</div>`;
    }
    this.card.innerHTML = html;
    this.card.classList.remove('hidden');
    bindOpts(this.card, (i) => this._choose(i));
    this._hud(R);
  }
  _finish() {
    this.state = 'done';
    const R = this._calc();
    const roll = rollOutcome(R);
    const arrDate = new Date(Date.now() + R.tEarth * 1e3);
    const arrText = R.earthYears < 7000 ? arrDate.toISOString().slice(0, 10) : `${fmtYears(R.earthYears)} 뒤`;
    const dil = R.gamma > 1.05;
    const { from } = this.route;
    let story;
    if (roll.ok) story = `${esc(from.name)}에서 ${fmtDur(R.tau)} 만에 지구에 닿았어요. ${dil ? `지구는 ${fmtDur(R.tEarth)}이 지났고, ` : ''}도착하면 ${Math.round(R.arriveAge)}세, 지구 날짜로 ${arrText}. 받은 우주 방사선 ${fmtSv(R.dose)}.`;
    else story = roll.text;
    this.card.innerHTML = `<div class="step">${roll.ok ? '지구 도착' : '귀환 실패'}</div><div class="t">${roll.ok ? '생존했습니다' : '지구에 도착하지 못했습니다'}</div>
      <div class="d">${story}</div>
      <details class="refs" style="margin-top:10px"><summary>왜 이런 결과가 나왔나요</summary><div class="kv" style="margin-top:8px">
        <div class="k">무사 귀환 확률</div><div class="v num">${pct(R.p)}</div>
        <div class="k">수명</div><div class="v num">${pct(R.pLife)}</div>
        <div class="k">우주 방사선 ${fmtSv(R.dose)}</div><div class="v num">${pct(R.pRad)}</div>
        ${R.bh ? `<div class="k">블랙홀 탈출</div><div class="v num">${pct(R.pBH)}</div>` : ''}
        ${R.pEvents < 0.9999 ? `<div class="k">가는 길의 선택</div><div class="v num">${pct(R.pEvents)}</div>` : ''}
        <div class="k">재진입</div><div class="v num">${pct(R.pReentry)}</div>
      </div></details>
      <div class="opts"><div class="opt" id="t-again" tabindex="0"><b>다시 눈 뜨기</b><span>다른 곳에서, 다른 확률로</span></div></div>`;
    this.card.classList.remove('hidden');
    this.card.querySelector('#t-again').addEventListener('click', () => this._setup(true));
    this._hud(R, true);
    this._panelJourney();
  }
  _hud(R, arrived = false) {
    const left = arrived ? 0 : this.route.distM * (1 - this.f);
    const pct = (p) => p >= 0.995 ? '99 %+' : p >= 0.01 ? `${Math.round(p * 100)} %` : p >= 1e-4 ? `${(p * 100).toFixed(2)} %` : '≈0 %';
    document.getElementById('c-dist').textContent = left < 2e7 ? '도착' : fmtDist(left);
    document.getElementById('c-time').textContent = fmtDur(R.tau * (arrived ? 1 : this.f));
    document.getElementById('c-dose').textContent = fmtSv(R.dose * (arrived ? 1 : this.f));
    document.getElementById('c-p').textContent = this.plan?.ship ? this.plan.ship.fx.replace(/^(실제|가상) · /, '') : '—';
  }
  _panelJourney() {
    const b = this.ctx.els.body;
    const { from } = this.route;
    const R = this.plan?.R;
    const rows = this.steps.map((st, i) => {
      const title = st.type === 'bh' ? '출발 거리' : st.type === 'ship' ? '탈것' : st.h.title;
      const done = i < this.idx || (i === this.idx && this.state === 'done');
      const cur = i === this.idx && this.state !== 'done';
      return `<li class="${done ? '' : cur ? 'cur' : 'next'}"><i></i><div>${esc(title)}${done ? ` · <b>${esc(st.chosen || '')}</b>` : ''}${done && st.fx ? `<div class="c">${esc(st.fx)}</div>` : ''}</div></li>`;
    }).join('');
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">${esc(from.name)} → 지구</div><div class="title-lg">${this.state === 'done' ? '도착' : '가는 중'}</div></div>
      ${R ? `<div class="section"><div class="kv">
        <div class="k">탈것</div><div class="v">${esc(this.plan.ship.name)}</div>
        <div class="k">걸리는 시간</div><div class="v num">${fmtDur(R.tau)}</div>
        <div class="k">피폭 예상</div><div class="v num">${fmtSv(R.dose)}</div>
      </div></div>` : ''}
      <div class="section"><div class="section-title">여정</div><ul class="log">${rows}</ul></div>
      <div class="section"><div class="row"><button class="btn" id="t-restart">처음부터</button></div></div>
    </div>`);
    b.appendChild(this.root);
    this.root.querySelector('#t-restart').addEventListener('click', () => this._setup(true));
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
    if (this.state === 'journey' && this.travelTo != null) {
      this.travelT = Math.min(1, this.travelT + dt / TRAVEL_ANIM);
      const u = this.travelT, e = u * u * (3 - 2 * u);
      this.f = this.travelFrom + (this.travelTo - this.travelFrom) * e;
      const ship = this.route.A.clone().lerp(this.route.B, this.f);
      map.setShip(this.f);
      map.setFirstPerson(ship, this.route.B, true);
      if (this.plan) this._hud(this.plan.R);
      if (u >= 1) { this.travelTo = null; this.f = this.steps[this.idx].at ?? this.steps[this.idx].h.at; this._showCard(); }
    }
    if (this.ctx.bhOn) return;
    if (this.state === 'setup') {
      const lo = map.minLog, hi = map.maxLog;
      const y = 100 - (map.logDist - lo) / (hi - lo) * 100;
      this.cursor.style.top = y + '%'; this.cursorLabel.style.top = y + '%';
      this.cursorLabel.textContent = fmtDist(map.distanceMeters);
      if (now - this.lastCalc > 1000) { this.lastCalc = now; map.updatePlanets(new Date()); }
    }
    // 라벨 (초당 20번, 내용이 바뀔 때만)
    if (now - (this._labelAt || 0) < 50) return;
    this._labelAt = now;
    const PRI = { sun: 0, planet: 2, star: 3, bh: 3, galaxy: 4 };
    const labels = map.projectLabels().sort((a, b) => (PRI[a.kind] - (a.data?.body === 'Earth' ? 1 : 0)) - (PRI[b.kind] - (b.data?.body === 'Earth' ? 1 : 0)));
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const placed = [];
    let html = '';
    for (const l of labels) {
      if (this.state !== 'setup' && l.kind !== 'planet' && l.kind !== 'sun') continue;
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

// ---- 결과 굴리기: 요인마다 한 번씩, 일어나는 순서대로 (블랙홀 → 가는 길 → 피폭·수명 → 재진입). 곱하면 전체 확률과 같다 ----
function rollOutcome(R) {
  const r = Math.random;
  const F = (text, short) => ({ ok: false, text, short });
  if (r() >= R.pBH) return F(R.bh?.inside ? '지평선 안에서는 어떤 길도 밖으로 이어지지 않았어요.' : '블랙홀의 조석력에 몸이 찢어졌어요.', '블랙홀');
  if (r() >= R.pEvents) return F('가는 길에 고른 선택이 배를 망가뜨렸어요.', '가는 길의 사고');
  const lifeOk = r() < R.pLife, radOk = r() < R.pRad;
  const rad = () => F(R.dose > 5 ? '우주 방사선 피폭으로 쓰러졌어요.' : '우주 방사선이 남긴 암으로 돌아오지 못했어요.', '우주 방사선');
  const life = () => F('도착 전에 수명이 다했어요.', '수명');
  if (!lifeOk && !radOk) return R.dose >= 12 ? rad() : life();   // 둘 다면 먼저 오는 쪽: 치사량이면 피폭, 아니면 세월
  if (!radOk) return rad();
  if (!lifeOk) return life();
  if (r() >= R.pReentry) return F('대기 재진입에서 캡슐을 잃었어요.', '재진입 사고');
  return { ok: true };
}
const pct = (p) => p >= 0.995 ? '99 % 이상' : p >= 0.01 ? `${Math.round(p * 100)} %` : p >= 1e-4 ? `${(p * 100).toFixed(2)} %` : p > 0 ? '0 % 에 가까움' : '0 %';

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
