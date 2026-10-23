// 보기 모드: 카탈로그 블랙홀을 일반상대론 광선추적으로 본다. 왼쪽 패널에 측정값과 출처.
import { GROUP_LABEL, GROUP_ORDER } from '../data/catalog.js';
import { M_SUN, PC, rs, rg, c, YEAR } from '../physics/constants.js';
import { horizons, isco, photonOrbit, hawkingTemperature, shadowAngularSizeMicroarcsec } from '../physics/gr.js';
import { bandName } from '../physics/disk.js';
import { fmtSci, fmtSolar, fmtPc, fmtLy, fmtAngle, fmtErr, fmtTemp, fmtKm, fmtTime, esc, el } from './format.js';

function compText(c) {
  if (typeof c === 'string') return c;
  const parts = [];
  if (c.spectral_type) parts.push(c.spectral_type);
  if (c.mass != null) parts.push(`${c.mass} M☉`);
  if (c.period_days != null) parts.push(c.period_days > 400 ? `주기 ${(c.period_days / 365.25).toPrecision(3)} 년` : c.period_days < 1 ? `주기 ${(c.period_days * 24).toPrecision(3)} 시간` : `주기 ${c.period_days} 일`);
  if (c.eccentricity != null) parts.push(`e = ${c.eccentricity}`);
  return `${c.name || ''}: ${parts.join(' · ')}`;
}

export class ViewMode {
  constructor(ctx) { this.ctx = ctx; this.bh = null; this.diskOn = true; }
  enter(arg) {
    const list = this.ctx.catalog.filter((b) => !b.infoOnly);
    let target = null;
    if (arg === 'custom' && this.ctx.custom) target = this.ctx.custom;
    else target = list.find((b) => b.id === arg) || (this.ctx.selected && !this.ctx.selected.infoOnly ? this.ctx.selected : null) || list[0];
    this.ctx.bh.animate = true;
    this.show(target);
    this.ctx.setHint('끌기: 시점 회전 · 휠/핀치: 거리');
  }
  leave() {}
  show(bh) {
    this.bh = bh;
    if (!bh.custom) this.ctx.selected = bh;
    const V = this.ctx.bh;
    V.setBH(bh, { inc: bh.inc ?? 75, dist: 26, disk: this.diskOn });
    this._panel();
    history.replaceState(null, '', '#view/' + (bh.custom ? 'custom' : bh.id));
  }
  _panel() {
    const bh = this.bh, V = this.ctx.bh, b = this.ctx.els.body;
    const Mkg = bh.mass * M_SUN;
    const chi = Math.min(0.998, bh.spin ?? 0);
    const { rPlus } = horizons(chi);
    const rI = isco(chi), rPh = photonOrbit(chi);
    const rgm = rg(Mkg);
    const TH = hawkingTemperature(Mkg, chi);
    const shadow = bh.distPc ? fmtAngle(shadowAngularSizeMicroarcsec(Mkg, bh.distPc * PC) * 1e-6 / 206264.806247) : null;
    const iscoPeriod = 2 * Math.PI * (Math.pow(rI, 1.5) + chi) * rgm / c; // 좌표시간 기준
    const d = V.diskInfo;
    const spinTag = bh.spinMeasured ? `<span class="tag">측정 · ${esc(bh.spinMethod || '')}</span>` : `<span class="tag assume">가정</span>`;
    const groupLabel = bh.custom ? '직접 만든 블랙홀' : GROUP_LABEL[bh.group];
    const list = this.ctx.catalog.filter((x) => !x.infoOnly);
    const groups = {}; for (const x of list) (groups[x.group] ??= []).push(x);
    const chips = GROUP_ORDER.filter((g) => groups[g]).map((g) => `<div class="group-head"><span>${GROUP_LABEL[g]}</span></div><div class="chips">` + groups[g].map((x) => `<button class="chip${x.id === bh.id ? ' active' : ''}" data-id="${x.id}">${esc(x.short)}</button>`).join('') + '</div>').join('');
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section">
        <div class="eyebrow">${groupLabel}${bh.estimateOnly ? ' · <span class="tag warn">질량은 모형 추정</span>' : ''}</div>
        <div class="title-lg">${esc(bh.short || bh.name)}</div>
        ${bh.custom ? '' : `<div class="faint small">${esc(bh.name)}</div>`}
        <div class="stat-row" style="margin-top:12px">
          <div class="stat"><div class="l">질량</div><div class="v num">${fmtSolar(bh.mass)}</div></div>
          <div class="stat"><div class="l">스핀 a*</div><div class="v num">${chi.toFixed(chi >= 0.99 ? 3 : 2)}</div></div>
          <div class="stat"><div class="l">지평선 반지름</div><div class="v num">${fmtKm(rPlus * rgm)}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">보는 방법</div>
        <div class="ctl"><label>시선 각도</label><input type="range" id="v-inc" min="1" max="179" step="1" value="${Math.round(V.target.inc)}"><span class="val num" id="v-inc-v">${Math.round(V.target.inc)}°</span></div>
        <div class="ctl"><label>거리</label><input type="range" id="v-dist" min="0.5" max="2.3" step="0.01" value="${Math.log10(V.target.dist).toFixed(2)}"><span class="val num" id="v-dist-v">${V.target.dist.toFixed(0)} r_g</span></div>
        ${bh.spinMeasured && !bh.custom ? '' : `<div class="ctl"><label>스핀 (가정)</label><input type="range" id="v-spin" min="0" max="0.998" step="0.002" value="${chi}"><span class="val num" id="v-spin-v">${chi.toFixed(3)}</span></div>`}
        <div class="row wrap" style="margin-top:6px">
          <label class="toggle ${V.R.state.disk.on ? 'on' : ''}" id="v-disk"><span class="sw"></span>강착원반</label>
          <label class="toggle ${V.animate ? 'on' : ''}" id="v-anim"><span class="sw"></span>원반 회전</label>
          <label class="toggle" id="v-hq"><span class="sw"></span>최고 화질</label>
        </div>
        <p class="note tiny">시선 각도는 자전축과 시선 사이 각. ${esc(bh.incNote || '')}${bh.incMeasured ? ' (측정값)' : ''}</p>
      </div>
      <div class="section">
        <div class="section-title">측정값</div>
        <div class="kv">
          <div class="k">질량</div><div class="v num">${bh.custom ? fmtSolar(bh.mass) : fmtErr(bh.mass, bh.massErrPlus, bh.massErrMinus) + ' M☉'}</div>
          <div class="k">스핀 a*</div><div class="v">${bh.spin != null ? `<span class="num">${bh.spin}</span> ${spinTag}` : '—'}</div>
          ${bh.distPc != null ? `<div class="k">거리</div><div class="v num">${fmtPc(bh.distPc)}<small>${fmtLy(bh.distPc)}</small></div>` : ''}
          ${bh.redshift != null ? `<div class="k">적색편이</div><div class="v num">z = ${bh.redshift}</div>` : ''}
          ${bh.raStr ? `<div class="k">위치 (J2000)</div><div class="v num small">${esc(bh.raStr)} ${esc(bh.decStr)}</div>` : ''}
          ${bh.state ? `<div class="k">강착 상태</div><div class="v small">${esc(bh.state)}</div>` : ''}
          ${bh.eddington != null ? `<div class="k">L / L_Edd</div><div class="v num">${fmtSci(bh.eddington, 2)}</div>` : ''}
          ${bh.companion ? `<div class="k">동반성</div><div class="v small">${esc(compText(bh.companion))}</div>` : ''}
          ${bh.discovery ? `<div class="k">발견</div><div class="v num">${bh.discovery}</div>` : ''}
        </div>
        ${bh.massNote ? `<p class="note tiny">${esc(bh.massNote)}</p>` : ''}
        ${bh.spinNote ? `<p class="note tiny">${esc(bh.spinNote)}</p>` : ''}
      </div>
      <div class="section">
        <div class="section-title">계산값 (M = ${fmtSolar(bh.mass)}, a* = ${chi.toFixed(3)})</div>
        <div class="kv">
          <div class="k">슈바르츠실트 반지름 r_s</div><div class="v num">${fmtKm(rs(Mkg))}</div>
          <div class="k">사건의 지평선 r₊</div><div class="v num">${fmtKm(rPlus * rgm)}<small>${rPlus.toFixed(3)} r_g</small></div>
          <div class="k">가장 안쪽 안정궤도 ISCO</div><div class="v num">${fmtKm(rI * rgm)}<small>${rI.toFixed(3)} r_g</small></div>
          <div class="k">ISCO 공전 주기</div><div class="v num">${fmtTime(iscoPeriod)}</div>
          <div class="k">광자 궤도</div><div class="v num">${rPh.toFixed(3)} r_g</div>
          <div class="k">그림자 지름</div><div class="v num">${fmtKm(2 * Math.sqrt(27) * rgm)}${shadow ? `<small>지구에서 ${shadow}</small>` : ''}</div>
          <div class="k">호킹 온도</div><div class="v num">${fmtTemp(TH)}</div>
          ${d ? `<div class="k">원반 안쪽 온도 T*</div><div class="v num">${fmtTemp(d.Tstar)}<small>${bandName(d.Tstar)}</small></div>
          <div class="k">강착률 Ṁ</div><div class="v num">${fmtSci(d.Mdot * YEAR / M_SUN, 2)} M☉/yr</div>
          <div class="k">복사 효율 η</div><div class="v num">${(d.eta * 100).toFixed(1)} %</div>` : ''}
        </div>
        <p class="note tiny">${d ? `원반: 노비코프–손 얇은 원반, 내경 = ISCO, L/L_Edd = ${fmtSci(d.lambda, 2)}${d.assumed ? ' (가정)' : ' (측정)'}${bh.disk === 'riaf' ? '. 실제로는 복사 비효율 강착류(RIAF)라 같은 광도를 얇은 원반으로 환산한 모습이에요' : ''}. 색은 도플러·중력 적색편이를 반영한 흑체색.` : '강착원반 없음: 중력렌즈로 휜 별하늘만 보여요.'}</p>
      </div>
      ${bh.fact ? `<div class="section"><div class="section-title">알려진 사실</div><p class="note">${esc(bh.fact)}</p></div>` : ''}
      ${bh.refs?.length ? `<div class="section"><details class="refs"><summary>출처 ${bh.refs.length}건</summary><ul>${bh.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details></div>` : ''}
      <div class="section">
        <div class="row"><button class="btn primary block" id="v-drop">여기에 물체 떨어뜨리기</button></div>
      </div>
      <div class="section"><div class="section-title">다른 블랙홀</div>${chips}</div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#v-inc').addEventListener('input', (e) => { V.target.inc = +e.target.value; q('#v-inc-v').textContent = e.target.value + '°'; V.touch(); });
    q('#v-dist').addEventListener('input', (e) => { V.target.dist = Math.pow(10, +e.target.value); q('#v-dist-v').textContent = V.target.dist.toFixed(0) + ' r_g'; V.touch(); });
    q('#v-spin')?.addEventListener('change', (e) => { this.bh = { ...this.bh, spin: +e.target.value }; if (this.bh.custom) this.ctx.custom = this.bh; this.show(this.bh); });
    q('#v-spin')?.addEventListener('input', (e) => { q('#v-spin-v').textContent = (+e.target.value).toFixed(3); });
    q('#v-disk').addEventListener('click', (e) => { this.diskOn = !V.R.state.disk.on; V.setDisk(this.diskOn); e.currentTarget.classList.toggle('on', V.R.state.disk.on); });
    q('#v-anim').addEventListener('click', (e) => { V.animate = !V.animate; e.currentTarget.classList.toggle('on', V.animate); V.touch(); });
    q('#v-hq').addEventListener('click', (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); V.maxScale = on ? Math.min(devicePixelRatio || 1, 2) : Math.min(1, 1.5 / Math.max(1, devicePixelRatio)) * Math.min(1, devicePixelRatio); V.R.state.maxSteps = on ? 900 : 500; V.touch(); });
    q('#v-drop').addEventListener('click', () => this.ctx.setMode('drop', bh.custom ? 'custom' : bh.id));
    this.root.querySelectorAll('.chip[data-id]').forEach((ch) => ch.addEventListener('click', () => this.show(this.ctx.catalog.find((x) => x.id === ch.dataset.id))));
  }
  tick() {}
}
