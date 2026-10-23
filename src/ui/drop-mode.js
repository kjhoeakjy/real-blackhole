// 집어넣기 모드: 실제 물체를 실제 블랙홀에 집어넣고, 완전히 분해되기까지의 고유시간을 맞힌 뒤 1인칭 낙하를 본다.
import { OBJECTS } from '../data/objects.js';
import { buildScenario, kRadial } from '../physics/fall.js';
import { M_SUN, rg } from '../physics/constants.js';
import { fmtSci, fmtSolar, fmtKm, fmtG, fmtTime, fmtLen, esc, el } from './format.js';
import { bhSelect } from './common.js';

const UNITS = [['ns', 1e-9], ['µs', 1e-6], ['ms', 1e-3], ['초', 1], ['분', 60], ['시간', 3600], ['일', 86400], ['년', 365.25 * 86400]];
const DURATION = 24; // 낙하 애니메이션 길이 (초)

export class DropMode {
  constructor(ctx) { this.ctx = ctx; this.bh = null; this.obj = OBJECTS[0]; this.state = 'setup'; this.guess = null; this.best = 0; }
  enter(arg) {
    const list = this.ctx.catalog.filter((b) => !b.infoOnly);
    if (arg === 'custom' && this.ctx.custom) this.bh = this.ctx.custom;
    else this.bh = list.find((b) => b.id === arg) || (this.ctx.selected && !this.ctx.selected.infoOnly ? this.ctx.selected : null) || list[0];
    this.state = 'setup';
    this.ctx.bh.animate = true;
    this._applyBH();
    this._setup();
    this.ctx.setHint('');
  }
  leave() { this._stopFall(); }
  onEscape() { if (this.state === 'falling') this._finish(true); }
  _applyBH() { this.ctx.bh.setBH(this.bh, { inc: 80, dist: 30 }); }
  _gameSpin() { return this.bh.custom ? Math.min(0.998, this.bh.spin ?? 0) : (this.bh.spinMeasured ? Math.min(0.998, this.bh.spin) : 0); }
  _r0() {
    const Mkg = this.bh.mass * M_SUN, rgm = rg(Mkg);
    const sc = buildScenario(this.bh, this.obj, 1e6, { spin: this._gameSpin() });
    const rMain = sc.main && !sc.main.unreachable ? sc.main.rM : 1;
    return Math.max(1000, 10 * rMain, 100 * this.obj.radius / rgm);
  }
  _setup() {
    const b = this.ctx.els.body, bh = this.bh;
    const Mkg = bh.mass * M_SUN, rgm = rg(Mkg);
    const r0 = this._r0();
    const chi = this._gameSpin();
    const objs = OBJECTS.map((o) => `<button class="item${o.id === this.obj.id ? ' active' : ''}" data-obj="${o.id}"><span class="swatch" style="color:rgb(${o.color.map((c) => Math.round(c * 255)).join(',')});background:currentColor"></span><div class="name"><b>${esc(o.name)}</b></div><div class="meta num">${o.mass < 1e3 ? o.mass + ' kg' : fmtSci(o.mass, 2) + ' kg'}</div></button>`).join('');
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">집어넣기</div><div class="title-lg">완전히 분해될 때까지</div></div>
      <div class="section"><div class="section-title">블랙홀</div><div id="d-select"></div>
        <div class="kv" style="margin-top:10px"><div class="k">질량</div><div class="v num">${fmtSolar(bh.mass)}</div><div class="k">스핀</div><div class="v num">${chi.toFixed(3)}${bh.spinMeasured || bh.custom ? '' : ' <span class="tag assume">미측정 → 0</span>'}</div><div class="k">지평선</div><div class="v num">${fmtKm((1 + Math.sqrt(1 - chi * chi)) * rgm)}</div></div></div>
      <div class="section"><div class="section-title">물체</div><div class="list">${objs}</div></div>
      <div class="section"><div class="kv"><div class="k">놓는 거리</div><div class="v num">${fmtLen(r0 * rgm)}<small>${fmtSci(r0, 3)} r_g · 자전축 위, 정지 상태</small></div></div></div>
      <div class="section"><div class="section-title">물체의 시계로 얼마나 걸릴까요?</div>
        <div class="row"><input type="number" id="d-guess" min="0" step="any" placeholder="숫자" style="flex:1"><select id="d-unit" style="width:96px">${UNITS.map(([u]) => `<option value="${u}"${u === '초' ? ' selected' : ''}>${u}</option>`).join('')}</select></div>
        <p class="small" style="margin-top:12px">어디서 찢어질까요?</p>
        <div class="chips"><button class="chip" data-yn="1">지평선 밖</button><button class="chip" data-yn="0">지평선 안</button></div>
        <div class="row" style="margin-top:14px"><button class="btn primary block" id="d-go">집어넣기</button></div>
        <p class="note tiny" id="d-err"></p>
      </div>
      ${this.best ? `<div class="section"><div class="kv"><div class="k">최고 점수</div><div class="v num">${this.best} / 100</div></div></div>` : ''}
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#d-select').appendChild(bhSelect(this.ctx, bh.custom ? 'custom' : bh.id, (x) => { this.bh = x; if (!x.custom) this.ctx.selected = x; this._applyBH(); this._setup(); history.replaceState(null, '', '#drop/' + (x.custom ? 'custom' : x.id)); }));
    this.root.querySelectorAll('.item[data-obj]').forEach((c) => c.addEventListener('click', () => { this.obj = OBJECTS.find((o) => o.id === c.dataset.obj); this._setup(); }));
    this.yn = null;
    this.root.querySelectorAll('.chip[data-yn]').forEach((c) => c.addEventListener('click', () => { this.yn = c.dataset.yn === '1'; this.root.querySelectorAll('.chip[data-yn]').forEach((x) => x.classList.toggle('active', x === c)); }));
    q('#d-go').addEventListener('click', () => {
      const v = parseFloat(q('#d-guess').value);
      if (!(v > 0)) { q('#d-err').textContent = '0보다 큰 숫자를 넣어 주세요.'; return; }
      if (this.yn == null) { q('#d-err').textContent = '어디서 찢어질지도 골라 주세요.'; return; }
      const unit = UNITS.find(([u]) => u === q('#d-unit').value)[1];
      this.guess = { tau: v * unit, outside: this.yn, text: `${v} ${q('#d-unit').value}` };
      this._startFall();
    });
  }

  _startFall() {
    const bh = this.bh, obj = this.obj;
    const chi = this._gameSpin();
    const r0 = this._r0();
    const sc = this.sc = buildScenario(bh, obj, r0, { spin: chi });
    this.rEndAnim = chi > 0 ? Math.max(sc.rMinus * 1.02, sc.rTurn * 1.05, 0.05) : 0.22;
    const ev = [];
    for (const s of sc.stages) if (!s.unreachable && s.rM < r0 && s.rM > this.rEndAnim) ev.push({ r: s.rM, t: s.label, s: s.note, main: s.main, micro: s.micro });
    ev.push({ r: sc.rPlus, t: '사건의 지평선', s: '돌아갈 수 없어요', horizon: true });
    if (sc.inner) ev.push({ r: sc.rMinus, t: '내부 지평선', s: '여기서부터는 물리가 불확실해요', horizon: true });
    ev.sort((a, b) => b.r - a.r);
    this.events = ev; this.evIdx = 0;
    this.t = 0; this.state = 'falling';
    this.ctx.els.panel.classList.add('collapsed');
    this.ctx.els.hud.classList.add('on');
    this.ctx.els.card.classList.add('hidden');
    document.getElementById('flash').style.opacity = 0;
    const V = this.ctx.bh;
    V.setBH({ ...bh, spin: chi }, { disk: bh.disk !== 'none' });
    V.R.state.a = chi;
    this.look = 'down';
    V.setFall(r0, sc.E, chi, this.look);
    this._timeline();
    this._hudLookChips();
    this.ctx.setHint('Esc 건너뛰기 · 1/2/3 앞·옆·뒤');
    this._key = (e) => { if (e.key === '1') this.look = 'down'; else if (e.key === '2') this.look = 'side'; else if (e.key === '3') this.look = 'up'; };
    document.addEventListener('keydown', this._key);
  }
  _hudLookChips() {
    let c = document.getElementById('hud-look');
    if (!c) { c = el('<div id="hud-look" class="chips" style="position:absolute;left:50%;transform:translateX(-50%);bottom:72px;pointer-events:auto"></div>'); this.ctx.els.hud.appendChild(c); }
    c.innerHTML = `<button class="chip active" data-l="down">블랙홀 쪽</button><button class="chip" data-l="side">옆</button><button class="chip" data-l="up">온 길</button><button class="chip" data-l="skip">건너뛰기</button>`;
    c.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { if (b.dataset.l === 'skip') { this._finish(true); return; } this.look = b.dataset.l; c.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b)); }));
  }
  _timeline() {
    const tl = document.getElementById('hud-timeline');
    tl.querySelectorAll('.mark').forEach((m) => m.remove());
    const pos = (r) => this._progress(r) * 100;
    for (const e of this.events) {
      if (e.micro) continue;
      tl.appendChild(el(`<div class="mark${e.main ? ' main' : ''}${e.horizon ? ' horizon' : ''}" style="left:${pos(e.r).toFixed(2)}%"><i>${esc(e.main ? '분해' : e.horizon ? e.t : '')}</i></div>`));
    }
  }
  // 반지름 → 애니메이션 진행도 (0..1), 로그 간격
  _progress(r) { const a = Math.log(this.sc.r0M), b = Math.log(this.rEndAnim); return Math.min(1, Math.max(0, (Math.log(r) - a) / (b - a))); }
  _rAt(u) { const a = Math.log(this.sc.r0M), b = Math.log(this.rEndAnim); return Math.exp(a + (b - a) * Math.pow(u, 0.85)); }
  _tauAt(r) {
    const T = this.sc.table; // r 내림차순
    if (r >= T[0].r) return 0;
    let lo = 0, hi = T.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m].r > r) lo = m; else hi = m; }
    const f = (T[lo].r - r) / (T[lo].r - T[hi].r || 1);
    return (T[lo].tau + (T[hi].tau - T[lo].tau) * f) * this.sc.tg;
  }
  _stopFall() { if (this._key) document.removeEventListener('keydown', this._key); this._key = null; this.ctx.bh.clearFall(); document.getElementById('hud-look')?.remove(); }

  tick(dt) {
    if (this.state !== 'falling') return;
    this.t += dt;
    const u = Math.min(1, this.t / DURATION);
    const r = this._rAt(u);
    const sc = this.sc, V = this.ctx.bh;
    V.fall = { r, E: sc.E, chi: sc.chi, look: this.look };
    const tau = this._tauAt(r);
    const k = kRadial(sc.Mkg, r, sc.chi);
    const L = this.obj.length ?? 2 * this.obj.radius;
    const tauH = this.sc.horizon.tau;
    document.getElementById('hud-tau').textContent = fmtTime(tau) + (r < sc.rPlus ? `  ·  지평선 뒤 +${fmtTime(tau - tauH)}` : tau > 0.9 * tauH && tauH - tau < 0.2 * tauH ? `  ·  지평선까지 ${fmtTime(tauH - tau)}` : '');
    document.getElementById('hud-r').textContent = `${fmtLen(r * sc.rg)} · ${(r / 2).toPrecision(3)} r_s`;
    document.getElementById('hud-k').textContent = `${fmtSci(k, 2)} s⁻²`;
    document.getElementById('hud-g').textContent = fmtG(Math.abs(k) * L);
    const kCrit = this.sc.main?.k ?? 1e3;
    const frac = Math.min(1, Math.max(0, (Math.log10(Math.abs(k) + 1e-300) - (Math.log10(kCrit) - 5)) / 5));
    document.getElementById('hud-stretch').style.height = (frac * 100).toFixed(1) + '%';
    document.getElementById('hud-fill').style.width = (this._progress(r) * 100).toFixed(2) + '%';
    while (this.evIdx < this.events.length && r <= this.events[this.evIdx].r) {
      const e = this.events[this.evIdx++];
      if (!e.micro || e.main) this._event(e.t, e.s);
      if (e.main) { document.getElementById('flash').style.opacity = 0.35; setTimeout(() => { if (this.state === 'falling') document.getElementById('flash').style.opacity = 0; }, 900); }
    }
    if (u >= 1) this._finish(false);
  }
  _event(t, s) {
    const e = document.getElementById('hud-event');
    e.querySelector('.t').textContent = t; e.querySelector('.s').textContent = s || '';
    e.classList.add('show');
    clearTimeout(this._evT); this._evT = setTimeout(() => e.classList.remove('show'), 2600);
  }
  _finish(skipped) {
    if (this.state !== 'falling') return;
    this.state = 'reveal';
    document.getElementById('flash').style.opacity = 1;
    setTimeout(() => {
      this._stopFall();
      this.ctx.els.hud.classList.remove('on');
      this.ctx.bh.setBH(this.bh, { inc: 80, dist: 30 });
      document.getElementById('flash').style.opacity = 0;
      this.ctx.els.panel.classList.remove('collapsed');
      this.ctx.setHint('');
      this._reveal();
    }, skipped ? 300 : 1400);
  }
  _reveal() {
    const sc = this.sc, bh = this.bh, obj = this.obj, g = this.guess;
    const main = sc.main;
    let answer, answerLabel, outsideTruth;
    if (main && !main.unreachable) { answer = main.tau; answerLabel = main.label; outsideTruth = !main.inside; }
    else if (sc.inner) { answer = sc.inner.tau; answerLabel = '내부 지평선 도달'; outsideTruth = false; }
    else { answer = sc.end.tau; answerLabel = '특이점'; outsideTruth = false; }
    const err = Math.abs(Math.log10(g.tau / answer));
    const base = Math.max(0, 80 * (1 - err / 3));
    const bonus = g.outside === outsideTruth ? 20 : 0;
    const score = Math.round(base + bonus);
    this.best = Math.max(this.best, score);
    const ratio = g.tau / answer;
    const verdict = err < 0.1 ? '거의 정확해요' : err < 0.5 ? '같은 자릿수예요' : err < 1 ? '10배 안쪽이에요' : ratio > 1 ? `${fmtSci(ratio, 2)}배 길게 봤어요` : `${fmtSci(1 / ratio, 2)}배 짧게 봤어요`;
    const rows = sc.stages.filter((s) => !s.micro).map((s) => {
      const rel = s.unreachable || s.atRelease ? '' : s.inside ? `<br><span class="faint tiny">지평선 뒤 +${fmtTime(s.tau - sc.horizon.tau)}</span>` : `<br><span class="faint tiny">지평선 전 −${fmtTime(sc.horizon.tau - s.tau)}</span>`;
      return `<tr${s.main ? ' class="active"' : ''}><td>${esc(s.label)}</td><td class="r num">${s.unreachable ? '도달 못 함' : fmtLen(s.rMeters)}</td><td class="r num">${s.unreachable ? '—' : fmtTime(s.tau) + rel}</td></tr>`;
    }).join('');
    const when = main && !main.unreachable ? (main.inside ? `지평선을 넘고 ${fmtTime(main.tau - sc.horizon.tau)} 뒤` : `지평선 ${fmtTime(sc.horizon.tau - main.tau)} 전`) : '';
    const b = this.ctx.els.body;
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section">
        <div class="eyebrow">${esc(obj.name)} → ${esc(bh.short || bh.name)}</div>
        <div class="title-lg num">${score} <span class="faint" style="font-size:14px;font-weight:400">/ 100</span></div>
        <p class="note">${verdict}.</p>
      </div>
      <div class="section">
        <div class="stat-row">
          <div class="stat"><div class="l">정답</div><div class="v num">${fmtTime(answer)}</div></div>
          <div class="stat"><div class="l">내 추측</div><div class="v num">${esc(g.text)}</div></div>
          <div class="stat"><div class="l">${outsideTruth ? '지평선 밖' : '지평선 안'}</div><div class="v">${g.outside === outsideTruth ? '<span class="tag">맞음</span>' : '<span class="tag warn">틀림</span>'}</div></div>
        </div>
        <p class="note" style="margin-top:10px">${esc(answerLabel)}${when ? ` · ${when}` : ''}. 지평선까지 ${fmtTime(sc.horizon.tau)}.</p>
        ${sc.mergerRegime ? `<p class="note tiny"><span class="tag warn">주의</span> 질량비 ${fmtSci(sc.massRatio, 2)}. 조석 파괴보다 병합에 가까워요.</p>` : ''}
        ${main?.unreachable ? `<p class="note tiny">자전축 위에서는 조석장이 유한해 내부 지평선까지 찢어지지 않아요.</p>` : ''}
      </div>
      <div class="section"><div class="section-title">단계 · 물체 시계</div>
        <table class="tbl"><tr><th></th><th class="r">중심에서</th><th class="r">시간</th></tr>${rows}</table>
      </div>
      <div class="section"><p class="note tiny" style="margin:0">먼 곳에서는 지평선 앞에서 멈춘 듯 보이고, 밝기는 ${fmtTime(5.196 * sc.tg)} 마다 e분의 1로 줄어요.</p></div>
      <div class="section"><div class="row"><button class="btn primary" id="d-again">다시</button><button class="btn" id="d-view">보기</button></div></div>
    </div>`);
    b.appendChild(this.root);
    this.root.querySelector('#d-again').addEventListener('click', () => { this.state = 'setup'; this._setup(); });
    this.root.querySelector('#d-view').addEventListener('click', () => this.ctx.setMode('view', bh.custom ? 'custom' : bh.id));
  }
}
