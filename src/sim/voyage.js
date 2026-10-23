// 항해 시뮬레이션: 배 안의 시간이 흐르면서 보급이 줄고, 나이를 먹고, 피폭이 쌓이고, 사건이 끼어든다.
// 모든 비율은 측정값(각 줄의 출처)이고, 죽음은 매 걸음마다 그 확률대로 굴린다.
import { c, AU, DAY, YEAR, LY } from '../physics/constants.js';
import { DOSE_RATE_SV_PER_YEAR, FATAL_RISK_PER_SV, HUMAN_K, blackHoleSurvival } from '../physics/trip.js';
import { EVENTS, MILESTONES, SIGHTS } from '../data/events.js';

const GOMPERTZ_A = 2.5e-5, GOMPERTZ_B = 0.095;  // 사망률 λ(x)=a·e^{bx}, 기대수명 ≈ 81세
const FOOD_KG_DAY = 1.83;                         // NASA HIDH, 포장 포함
const RTG_HALF_LIFE_Y = 87.7;                     // Pu-238
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const R = Math.random;
// 동면 중에는 컴퓨터가 비상시에만 깨운다: 이 사건들만 온다
const HIB_OK = new Set(['smoke', 'oga', 'oga-retry', 'water', 'water-retry', 'hib-offer2', 'power', 'blackout', 'micro', 'debris', 'dust', 'course', 'belt', 'jupiter', 'reentry', 'hib-fault', 'roguebh', 'ai', 'spe']);
const startAU2 = (v) => v.s.startAU * v.s.startAU;
// 되풀이돼도 되는 사건 (부족 경고처럼 상황이 이어지는 것)
const REPEATABLE = new Set(['oga-retry', 'water-retry']);
// 동료 후보: 이름·역할. 배에 오를 때 정원-1 명을 뽑는다
const MATES = [['서하린', '의사'], ['강민준', '기관사'], ['오지우', '항법사'], ['레나 오카포', '식물학자'], ['토마스 레예스', '통신사'], ['박도윤', '조종사'], ['아이샤 라만', '물리학자'], ['이수아', '정비사'], ['사토 유키', '심리상담사'], ['정하람', '요리사'], ['마테오 비앙키', '지질학자'], ['한세영', '간호사'], ['니콜라 페트로프', '전기기사'], ['최은우', '생물학자'], ['마리암 하다드', '천문학자']];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export class Voyage {
  // from: 출발지, A/B: 출발·지구 위치(m, 태양 중심), ship: SHIPS 항목, age: 출발 나이, bh: {massSolar, chi, rOverRg} | null
  constructor({ from, A, B, ship, age, bh = null }) {
    this.from = from; this.A = A; this.B = B; this.ship = ship; this.age0 = age; this.bh = bh;
    this.distM = A.distanceTo(B);
    this.beta = Math.min(ship.v / c, 0.9999999);
    this.gamma = 1 / Math.sqrt(1 - this.beta * this.beta);
    const startAU = A.length() / AU;
    this.s = {
      tau: 0, f: 0, age, dose: 0, acute: 0, crewAlive: ship.crew, startAU,
      food: ship.foodDays, water: ship.waterDays, o2: ship.o2Days, oga: true, recycler: true, eco: ship.eco,
      power: 1, hull: 1, health: 1, morale: 1, fuel: 1, navRisk: 0, vFactor: 1,
      alive: true, arrived: false, death: null, log: [], flags: {}, cancerAt: null, deathAt: null,
      hib: false, hibHalf: false, nextCourse: 0.35, lowPowerDays: 0, starveDays: 0, thirstDays: 0, chokeDays: 0, lastEventTau: -Infinity, events: 0,
      mates: shuffle(MATES.slice()).slice(0, Math.max(0, ship.crew - 1)).map(([name, role]) => ({ name, role, alive: true, bond: 0 })),
    };
    this.weather = null;   // 실제 우주 날씨 (UI 가 넣어 준다): {kp, xray, cls}
    this.pending = null;
    this.prevR = startAU;
    this.s.log.push({ tau: 0, cat: 'nav', text: `${from.name}에서 출발. ${ship.name}, ${ship.crew === 1 ? '혼자' : `${this.s.mates.map((m) => `${m.name}(${m.role})`).join(', ')}와 함께`}.` });
    // 블랙홀 곁 출발: 조석력은 출발 순간에 결정된다
    if (bh) {
      const res = blackHoleSurvival(bh.massSolar, bh.chi, bh.rOverRg);
      if (res.inside) this._die('사건의 지평선 안이었어요. 엔진은 돌았지만 밖으로 이어진 길이 없었어요.');
      else if (res.p === 0) this._die('엔진을 켜기도 전에, 머리와 발을 당기는 힘이 몸을 둘로 갈랐어요.');
      else if (R() > res.p) this._die('가속하는 동안 조석력이 세졌어요. 의식을 잃었고, 배는 홀로 떠났어요.');
      else if (res.k > HUMAN_K.feel) this.s.log.push({ tau: 0, cat: 'bh', text: '머리와 발이 서로 다른 쪽으로 당겨지는 걸 느끼며 탈출했어요.' });
    }
  }
  get v() { return this.ship.v * this.s.vFactor; }
  pos() { return this.A.clone().lerp(this.B, this.s.f); }
  rAU() { return this.pos().length() / AU; }
  earthDistAU() { return this.distM * (1 - this.s.f) / AU; }
  commDelay() { return this.distM * (1 - this.s.f) / c; }
  remaining() { return this.distM * (1 - this.s.f) / (this.v * this.gamma); } // 배 시계로 남은 시간(s)
  tEarth() { return this.s.tau * this.gamma + (this.s.earthExtra || 0); }   // 지구 시계: 상대론 + 시나리오(웜홀·블랙홀 곁)로 더 흐른 시간
  get done() { return !this.s.alive || this.s.arrived; }
  // 동료: 살아 있는 사람 중 하나 (없으면 null). 사건 글에 이름을 쓰기 위해
  alive() { return this.s.mates.filter((m) => m.alive); }
  mate() { const a = this.alive(); return a.length ? a[Math.floor(R() * a.length)] : null; }
  mateName() { const m = this.mate(); return m ? m.name : '동료'; }
  // 동료를 잃는다: 지정한 사람 또는 무작위. 이름을 돌려준다
  loseMate(n = 1, who = null) {
    const lost = [];
    for (let k = 0; k < n; k++) { const m = who && who.alive ? who : this.mate(); if (!m) break; m.alive = false; m.diedTau = this.s.tau; lost.push(m.name); who = null; }
    this.s.crewAlive = 1 + this.alive().length;
    return lost;
  }
  addMate(name, role) { this.s.mates.push({ name, role, alive: true, bond: 0, joinedTau: this.s.tau }); this.s.crewAlive = 1 + this.alive().length; }

  // dt: 배 시계로 흐르는 시간(s). cooldown: 사건 사이 최소 간격(s, 연출용)
  step(dt, cooldown = 0) {
    const s = this.s;
    if (this.pending || this.done) return;
    const dy = dt / YEAR, dd = dt / DAY;
    // 이동 (지구 틀에서 v·γ·dτ)
    s.f = Math.min(1, s.f + this.v * this.gamma * dt / this.distM);
    s.tau += dt; s.aged = (s.aged || 0) + dt * (s.hib ? 0.15 : s.hibHalf ? 0.6 : 1); s.age = this.age0 + s.aged / YEAR;   // 동면 중엔 몸의 시계가 느리게 (시나리오)
    const r = this.rAU();
    // 보급: 식량(재배실이 절반을 댐), 물(재활용), 산소(발생기)
    const hibF = s.hib ? 0.05 : s.hibHalf ? 0.5 : 1;            // 동면: 먹고 마시는 양 20분의 1 (시나리오)
    const crewFrac = s.crewAlive / this.ship.crew * hibF;
    s.food -= dd * crewFrac * (s.eco ? 0.35 : 1);   // 재배실이 식량의 3분의 2를 댄다 (BIOS-3 수준, 시나리오)
    s.water -= dd * crewFrac * (s.recycler ? 1 - this.ship.recycle : 1);
    if (!s.oga) s.o2 -= dd * crewFrac;
    // 전력: 태양 전지판 ∝ 1/r², 동위원소 전지 반감기, 원자로는 일정
    if (this.ship.power === 'solar') s.power = clamp(Math.min(900, Math.max(1.2, startAU2(this))) / Math.max(0.04, r * r), 0, 1);   // 전지판은 출발지 햇빛에 맞춰 크기를 잡는다 (주노처럼)
    else if (this.ship.power === 'rtg') s.power = Math.pow(0.5, s.tau / YEAR / RTG_HALF_LIFE_Y) * (1 - 0.004 * s.tau / YEAR); // 열전소자 노화 포함
    s.power = clamp(s.power, 0, 1);
    // 피폭: 은하우주선 (RAD 1.84 mSv/일) × 차폐. 태양권 밖은 1.3배 (보이저 CRS)
    const gcr = DOSE_RATE_SV_PER_YEAR * (r > 120 ? 1.3 : 1) * this.ship.shield * (s.hib ? 0.5 : 1);   // 동면 캡슐은 물탱크 안쪽 (시나리오)
    const dD = gcr * dy; s.dose += dD;
    if (s.cancerAt == null && R() < FATAL_RISK_PER_SV * dD) s.cancerAt = s.tau + (5 + 15 * R()) * YEAR;  // ICRP 5.5 %/Sv, 잠복 5–20년
    // 사기: 긴 고립은 천천히 깎고, 사람이 많으면 덜 깎인다
    if (!s.hib) s.morale = clamp(s.morale - dy * (s.crewAlive === 1 ? 0.12 : 0.06), 0, 1);
    s.health = clamp(s.health + dy * 0.05, 0, 1);  // 다친 몸은 천천히 회복
    // 죽음: 나이 (Gompertz), 암, 급성 피폭, 보급 고갈, 전력
    const lambda = GOMPERTZ_A * Math.exp(GOMPERTZ_B * s.age);
    if (R() < lambda * dy) return this._die(s.age > 75 ? '잠자듯 세상을 떠났어요. 배는 계속 가요.' : '심장이 멈췄어요. 지구에서라면 살렸을지도 몰라요.');
    if (s.cancerAt != null && s.tau >= s.cancerAt && !s.flags.cancer) { s.flags.cancer = true; s.deathAt = s.tau + (0.5 + R()) * YEAR; this._log('med', '검진 화면에 그림자가 보여요. 우주선에는 항암 치료가 없어요.'); }
    if (s.deathAt != null && s.tau >= s.deathAt) return this._die('우주 방사선이 남긴 암이었어요.');
    if (s.food <= 0) { s.starveDays += dd; if (s.starveDays > 60) return this._die('식량이 떨어지고 두 달. 더는 버틸 수 없었어요.'); }
    if (s.water <= 0) { s.thirstDays += dd; if (s.thirstDays > 3) return this._die('물이 떨어지고 사흘째였어요.'); }
    if (s.o2 <= 0 && !s.oga) { s.chokeDays += dd; if (s.chokeDays > 1) return this._die('산소가 떨어졌어요. 잠든 채였어요.'); }
    if (s.power < 0.25) { s.lowPowerDays += dd; if (s.lowPowerDays > 30) return this._die('전력이 바닥나 난방과 공기 순환이 멎었어요.'); } else s.lowPowerDays = 0;
    if (s.health <= 0) return this._die('몸이 더는 버티지 못했어요.');
    // 생일
    const ageInt = Math.floor(s.age);
    if (ageInt > Math.floor(this.age0) && ageInt !== s.flags.lastBirthday) { s.flags.lastBirthday = ageInt; this._log('body', `${ageInt}세. ${s.hib ? '동면 중이에요. ' : ''}지구 날짜로 ${this.earthDate()}.`); }
    // 기록만 남는 순간
    for (const m of MILESTONES) if (m.when(this)) { if (m.flag) s.flags[m.flag] = true; this._log(m.cat, m.text(this), m.fx || null); }
    // 눈에 보이는 순간 (유성·오로라·플레어…): 선택은 없고 창밖 연출과 기록만
    if (!s.hib && s.tau - (s.lastSightTau || 0) > 20 * DAY) for (const m of SIGHTS) { if (m.when && !m.when(this)) continue; if (R() < m.rate(this) * dy) { s.lastSightTau = s.tau; this._log(m.cat, typeof m.text === 'function' ? m.text(this) : m.text, m.fx); if (m.morale) s.morale = clamp(s.morale + m.morale, 0, 1); break; } }
    this.prevR = r;
    // 사건: 조건 사건(한 번)과 무작위 사건(푸아송). 연출을 위해 사건 사이 간격을 둔다
    const rateMul = (1 + (1 - s.morale) * 0.6) * (s.hib ? 0.35 : 1);   // 사기가 낮으면 실수가 는다, 동면 중엔 조용하다
    const ok = (e) => (!s.hib || HIB_OK.has(e.id)) && !(s.flags.noantenna && ['message', 'badnews', 'supply', 'silence'].includes(e.id)) && !(s.flags.silence && ['message', 'badnews', 'supply'].includes(e.id));
    for (const e of EVENTS) {
      if (e.trigger && ok(e) && (!e.once || !s.flags[e.once]) && e.trigger(this)) { if (e.once) s.flags[e.once] = true; return this._raise(e); }
    }
    if (s.tau - s.lastEventTau < cooldown) return;
    // 같은 사건은 되풀이될수록 드물게 (5분의 1씩), 같은 분류도 조금씩 드물게. 새 사건이 먼저 나온다
    const seen = s.seen || (s.seen = {}), seenCat = s.seenCat || (s.seenCat = {});
    for (const e of EVENTS) {
      if (!e.rate || !ok(e) || (e.when && !e.when(this))) continue;
      if (!REPEATABLE.has(e.id) && (seen[e.id] || 0) >= 2) continue;   // 같은 사건은 한 항해에 최대 두 번
      const rep = REPEATABLE.has(e.id) ? 1 : Math.pow(0.08, seen[e.id] || 0) * Math.pow(0.85, seenCat[e.cat] || 0);
      if (R() < e.rate(this) * rateMul * rep * dy) return this._raise(e);
    }
  }
  _raise(e) {
    const opts = e.options.filter((o) => !o.when || o.when(this));
    const title = typeof e.title === 'function' ? e.title(this) : e.title;
    const woke = this.s.hib && e.id !== 'hib-fault';
    const desc = (woke ? '캡슐이 나를 깨웠어요. 몸이 덜 풀린 채로 경고등을 봐요. ' : '') + e.desc(this);
    this.pending = { ev: e, woke, title: typeof e.title === 'function' ? e.title(this) : title, desc, options: opts.map((o) => ({ ...o, label: typeof o.label === 'function' ? o.label(this) : o.label, hint: typeof o.hint === 'function' ? o.hint(this) : o.hint })) };
    this.s.lastEventTau = this.s.tau; this.s.events++;
    const seen = this.s.seen || (this.s.seen = {}), seenCat = this.s.seenCat || (this.s.seenCat = {}); seen[e.id] = (seen[e.id] || 0) + 1; seenCat[e.cat] = (seenCat[e.cat] || 0) + 1;
  }
  // 선택: 결과를 굴리고 효과를 적용한다
  choose(i) {
    const p = this.pending; if (!p) return null;
    const o = p.options[i] || p.options[0];
    const r = o.go(this) || {};
    this.pending = null;
    if (r.retry) { this._log(p.ev.cat, r.text); this.s.flags[p.ev.once] = false; return { text: r.text }; }
    this.apply(r);
    const back = p.woke && this.s.hib && !r.death && !r.arrived ? ' 다시 캡슐에 들어갔어요.' : '';
    const entry = { cat: p.ev.cat, title: p.title, choice: o.label, text: (r.death || r.text) + back, fx: r.fx || null };
    this._log(p.ev.cat, `${p.title} — ${o.label}. ${r.death || r.text}${back}`);
    if (r.death) this._die(r.death, true);
    if (r.arrived) this.s.arrived = true;
    return entry;
  }
  apply(r) {
    const s = this.s;
    if (r.dose) s.dose += r.dose;
    if (r.acute) { s.acute += r.acute; if (r.acute >= 2) s.health -= 0.25; if (s.acute >= 8 || (s.acute >= 4 && R() < 0.5)) { s.deathAt = s.tau + 20 * DAY; s.flags.ars = true; this._log('sun', '급성 방사선 증후군. 머리카락이 빠지고 잇몸에서 피가 나요.'); } if (R() < FATAL_RISK_PER_SV * r.acute && s.cancerAt == null) s.cancerAt = s.tau + (5 + 15 * R()) * YEAR; }
    if (r.health) s.health = clamp(s.health + r.health, 0, 1);
    if (r.morale) s.morale = clamp(s.morale + r.morale, 0, 1);
    if (r.hull) s.hull = clamp(s.hull + r.hull, 0, 1);
    if (r.power) s.power = clamp(s.power + r.power, 0, 1);
    if (r.fuel) s.fuel = clamp(s.fuel + r.fuel, 0, 1);
    if (r.food) s.food += r.food;
    if (r.water) s.water += r.water;
    if (r.o2) s.o2 += r.o2;
    if (r.oga != null) s.oga = r.oga;
    if (r.recycler != null) s.recycler = r.recycler;
    if (r.eco != null) s.eco = r.eco;
    if (r.navRisk) s.navRisk += r.navRisk;
    if (r.vFactor) s.vFactor *= r.vFactor;
    if (r.crewLost) { const names = this.loseMate(r.crewLost, r.lost || null); if (names.length && !r.text?.includes(names[0])) this._log('crew', `${names.join(', ')}을(를) 잃었어요.`); }
    if (r.crewGain) { if (r.newMate) this.addMate(r.newMate.name, r.newMate.role); else s.crewAlive += r.crewGain; }
    if (r.bond) for (const m of this.alive()) m.bond += r.bond;
    if (r.jump) s.f = Math.max(0, Math.min(1, s.f + (1 - s.f) * r.jump));   // 남은 거리의 일부를 한 번에, 음수면 멀어짐 (시나리오)
    if (r.earthExtra) s.earthExtra = (s.earthExtra || 0) + r.earthExtra;
    if (r.hints) s.hintBonus = (s.hintBonus || 0) + r.hints;
    if (r.hib != null) { s.hib = r.hib; if (r.hib) s.hibHalf = false; }
    if (r.hibHalf) { s.hibHalf = true; s.hib = false; }
    if (r.flag) s.flags[r.flag] = true;
    if (r.flag2) s.flags[r.flag2] = true;
    const extra = (r.delay || 0) + (r.delayFrac ? r.delayFrac * this.remaining() : 0);   // 멈춰 있던 시간·돌아가는 길 (배 시계)
    if (extra) { s.tau += extra; s.aged = (s.aged || 0) + extra; s.age = this.age0 + s.aged / YEAR; }
  }
  _log(cat, text, fx = null) { const e = { tau: this.s.tau, cat, text }; if (fx) e.fx = fx; this.s.log.push(e); }
  _die(text, logged = false) { const s = this.s; s.alive = false; s.death = { text, age: s.age, tau: s.tau, f: s.f }; if (!logged) this._log('end', text); }
  earthDate() { const d = new Date(Date.now() + this.tEarth() * 1e3); return isFinite(d) && this.tEarth() / YEAR < 7000 ? d.toISOString().slice(0, 10) : `${Math.round(this.tEarth() / YEAR).toLocaleString('en-US')}년 뒤`; }
}
