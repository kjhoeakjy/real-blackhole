// 보기 모드: 카탈로그 블랙홀을 일반상대론 광선추적으로 본다. 패널은 선택 메뉴, 조작, 측정값, 계산값.
import { GROUP_LABEL } from '../data/catalog.js';
import { M_SUN, PC, rs, rg, c, YEAR } from '../physics/constants.js';
import { horizons, isco, photonOrbit, hawkingTemperature, shadowAngularSizeMicroarcsec } from '../physics/gr.js';
import { bandName } from '../physics/disk.js';
import { fmtSci, fmtSolar, fmtLy, fmtAngle, fmtErr, fmtTemp, fmtKm, fmtTime, esc, el } from './format.js';
import { bhSelect } from './common.js';

function compText(c) {
  if (typeof c === 'string') return c;
  const parts = [];
  if (c.spectral_type) parts.push(c.spectral_type);
  if (c.mass != null) parts.push(`${c.mass} M☉`);
  if (c.period_days != null) parts.push(c.period_days > 400 ? `${(c.period_days / 365.25).toPrecision(3)} 년` : c.period_days < 1 ? `${(c.period_days * 24).toPrecision(3)} 시간` : `${c.period_days} 일`);
  return `${c.name ? c.name + ' · ' : ''}${parts.join(' · ')}`;
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
    this.ctx.setHint('끌기 회전 · 휠/핀치 거리');
  }
  leave() {}
  show(bh) {
    this.bh = bh;
    if (!bh.custom) this.ctx.selected = bh;
    this.ctx.bh.setBH(bh, { inc: bh.inc ?? 75, dist: 'auto', disk: this.diskOn });
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
    const shadow = bh.distPc ? fmtAngle(shadowAngularSizeMicroarcsec(Mkg, bh.distPc * PC) * 1e-6 / 206264.806247) : null;
    const iscoPeriod = 2 * Math.PI * (Math.pow(rI, 1.5) + chi) * rgm / c;
    const d = V.diskInfo;
    const spinTag = bh.spinMeasured ? '' : ' <span class="tag assume">가정</span>';
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section">
        <div class="eyebrow">${bh.custom ? '직접 만든 블랙홀' : GROUP_LABEL[bh.group]}${bh.estimateOnly ? ' · <span class="tag warn">질량 추정</span>' : ''}</div>
        <div id="v-select"></div>
        <div class="stat-row" style="margin-top:12px">
          <div class="stat"><div class="l">질량</div><div class="v num">${fmtSolar(bh.mass)}</div></div>
          <div class="stat"><div class="l">스핀 a*</div><div class="v num">${chi.toFixed(chi >= 0.99 ? 3 : 2)}</div></div>
          <div class="stat"><div class="l">지평선</div><div class="v num">${fmtKm(rPlus * rgm)}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="ctl"><label>시선 각도</label><input type="range" id="v-inc" min="1" max="179" step="1" value="${Math.round(V.target.inc)}"><span class="val num" id="v-inc-v">${Math.round(V.target.inc)}°</span></div>
        <div class="ctl"><label>거리</label><input type="range" id="v-dist" min="0.5" max="2.3" step="0.01" value="${Math.log10(V.target.dist).toFixed(2)}"><span class="val num" id="v-dist-v">${V.target.dist.toFixed(0)} r_g</span></div>
        ${bh.spinMeasured && !bh.custom ? '' : `<div class="ctl"><label>스핀 (가정)</label><input type="range" id="v-spin" min="0" max="0.998" step="0.002" value="${chi}"><span class="val num" id="v-spin-v">${chi.toFixed(3)}</span></div>`}
        <div class="row wrap" style="margin-top:6px">
          <label class="toggle ${V.R.state.disk.on ? 'on' : ''}" id="v-disk"><span class="sw"></span>원반</label>
          <label class="toggle ${V.animate ? 'on' : ''}" id="v-anim"><span class="sw"></span>회전</label>
          <label class="toggle" id="v-hq"><span class="sw"></span>고화질</label>
        </div>
      </div>
      <div class="section">
        <div class="section-title">측정</div>
        <div class="kv">
          <div class="k">질량</div><div class="v num">${bh.custom ? fmtSolar(bh.mass) : fmtErr(bh.mass, bh.massErrPlus, bh.massErrMinus) + ' M☉'}</div>
          <div class="k">스핀 a*</div><div class="v"><span class="num">${bh.spin ?? 0}</span>${spinTag}</div>
          ${bh.distPc != null ? `<div class="k">거리</div><div class="v num">${fmtLy(bh.distPc)}</div>` : bh.redshift != null ? `<div class="k">적색편이</div><div class="v num">z = ${bh.redshift}</div>` : ''}
          ${bh.incMeasured ? `<div class="k">기울기</div><div class="v num">${bh.inc}°</div>` : ''}
          ${bh.eddington != null ? `<div class="k">L / L_Edd</div><div class="v num">${fmtSci(bh.eddington, 2)}</div>` : ''}
          ${bh.companion ? `<div class="k">동반성</div><div class="v small">${esc(compText(bh.companion))}</div>` : ''}
          ${bh.discovery ? `<div class="k">발견</div><div class="v num">${bh.discovery}</div>` : ''}
          ${shadow ? `<div class="k">지구에서 본 그림자</div><div class="v num">${shadow}</div>` : ''}
        </div>
      </div>
      <div class="section">
        <div class="section-title">계산</div>
        <div class="kv">
          <div class="k">r_s</div><div class="v num">${fmtKm(rs(Mkg))}</div>
          <div class="k">ISCO</div><div class="v num">${fmtKm(rI * rgm)}<small>${rI.toFixed(2)} r_g · 한 바퀴 ${fmtTime(iscoPeriod)}</small></div>
          <div class="k">광자 궤도</div><div class="v num">${rPh.toFixed(2)} r_g</div>
          <div class="k">호킹 온도</div><div class="v num">${fmtTemp(hawkingTemperature(Mkg, chi))}</div>
          ${d ? `<div class="k">원반 온도</div><div class="v num">${fmtTemp(d.Tstar)}<small>${bandName(d.Tstar)}</small></div>
          <div class="k">강착률</div><div class="v num">${fmtSci(d.Mdot * YEAR / M_SUN, 2)} M☉/yr</div>` : ''}
        </div>
      </div>
      ${bh.fact || bh.refs?.length ? `<div class="section"><details class="refs"><summary>이야기 · 출처${bh.refs?.length ? ` ${bh.refs.length}건` : ''}</summary>${bh.fact ? `<p class="note">${esc(bh.fact)}</p>` : ''}${bh.refs?.length ? `<ul>${bh.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</details></div>` : ''}
      <div class="section"><div class="row"><button class="btn primary block" id="v-drop">물체 집어넣기</button></div></div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#v-select').appendChild(bhSelect(this.ctx, bh.custom ? 'custom' : bh.id, (x) => this.show(x)));
    q('#v-inc').addEventListener('input', (e) => { V.target.inc = +e.target.value; q('#v-inc-v').textContent = e.target.value + '°'; V.touch(); });
    q('#v-dist').addEventListener('input', (e) => { V.target.dist = Math.pow(10, +e.target.value); q('#v-dist-v').textContent = V.target.dist.toFixed(0) + ' r_g'; V.touch(); });
    q('#v-spin')?.addEventListener('change', (e) => { this.bh = { ...this.bh, spin: +e.target.value }; if (this.bh.custom) this.ctx.custom = this.bh; this.show(this.bh); });
    q('#v-spin')?.addEventListener('input', (e) => { q('#v-spin-v').textContent = (+e.target.value).toFixed(3); });
    q('#v-disk').addEventListener('click', (e) => { this.diskOn = !V.R.state.disk.on; V.setDisk(this.diskOn); e.currentTarget.classList.toggle('on', V.R.state.disk.on); });
    q('#v-anim').addEventListener('click', (e) => { V.animate = !V.animate; e.currentTarget.classList.toggle('on', V.animate); V.touch(); });
    q('#v-hq').addEventListener('click', (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); V.maxScale = on ? Math.min(devicePixelRatio || 1, 2) : Math.min(1, 1.5 / Math.max(1, devicePixelRatio)) * Math.min(1, devicePixelRatio); V.R.state.maxSteps = on ? 900 : 500; V.touch(); });
    q('#v-drop').addEventListener('click', () => this.ctx.setMode('drop', bh.custom ? 'custom' : bh.id));
  }
  tick() {}
}
