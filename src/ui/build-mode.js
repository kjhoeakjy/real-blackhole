// 만들기 모드: 질량과 스핀 → 실제 물리량. 미리보기는 광선추적.
import { M_SUN, M_EARTH, M_JUP, M_MOON, G, c, rs, rg, YEAR } from '../physics/constants.js';
import { horizons, isco, photonOrbit, hawkingTemperature, evaporationTime, tidalGradientSI } from '../physics/gr.js';
import { diskTemperature, bandName } from '../physics/disk.js';
import { fmtSci, fmtSolar, fmtTemp, fmtTime, fmtLen, esc, el } from './format.js';

const PRESETS = [
  ['사람', 70 / M_SUN], ['달', M_MOON / M_SUN], ['지구', M_EARTH / M_SUN], ['목성', M_JUP / M_SUN], ['태양', 1],
  ['10 M☉', 10], ['가이아 BH3', 32.7], ['GW190521', 142], ['ω Cen', 4e4], ['궁수자리 A*', 4.297e6], ['M87*', 6.5e9], ['TON 618', 4.07e10],
];
const AGE_UNIVERSE = 13.787e9 * YEAR;

export class BuildMode {
  constructor(ctx) { this.ctx = ctx; this.logM = Math.log10(4.297e6); this.spin = 0.5; this.diskOn = true; }
  enter() { this.ctx.bh.animate = true; this._render(); this.ctx.setHint('끌기 회전 · 휠/핀치 거리'); }
  leave() {}
  desc() {
    const mass = Math.pow(10, this.logM);
    return { custom: true, id: 'custom', short: '직접 만든 블랙홀', name: `M = ${fmtSolar(mass)}, a* = ${this.spin.toFixed(3)}`, mass, spin: this.spin, spinMeasured: true, disk: 'bright', eddington: 0.1, inc: 75, group: 'custom' };
  }
  _render() {
    const b = this.ctx.els.body;
    const d = this.desc();
    this.ctx.custom = d;
    this.ctx.bh.setBH(d, { inc: this.ctx.bh.target.inc || 75, dist: 'auto', disk: this.diskOn });
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section"><div class="eyebrow">만들기</div><div class="title-lg">질량과 스핀</div></div>
      <div class="section">
        <div class="ctl"><label>질량</label><input type="range" id="b-mass" min="-30" max="11" step="0.01" value="${this.logM}"><span class="val num" id="b-mass-v"></span></div>
        <div class="chips" id="b-presets">${PRESETS.map(([n, m]) => `<button class="chip" data-m="${m}">${n}</button>`).join('')}</div>
        <div class="ctl" style="margin-top:12px"><label>스핀 a*</label><input type="range" id="b-spin" min="0" max="0.998" step="0.002" value="${this.spin}"><span class="val num" id="b-spin-v"></span></div>
        <div class="row wrap" style="margin-top:6px"><label class="toggle ${this.diskOn ? 'on' : ''}" id="b-disk"><span class="sw"></span>원반 (L/L_Edd = 0.1)</label></div>
      </div>
      <div class="section" id="b-out"></div>
      <div class="section"><div class="row"><button class="btn primary" id="b-view">보기</button><button class="btn" id="b-drop">물체 집어넣기</button></div></div>
    </div>`);
    b.appendChild(this.root);
    const q = (s) => this.root.querySelector(s);
    q('#b-mass').addEventListener('input', (e) => { this.logM = +e.target.value; this._out(); });
    q('#b-mass').addEventListener('change', () => this._apply());
    q('#b-spin').addEventListener('input', (e) => { this.spin = +e.target.value; this._out(); });
    q('#b-spin').addEventListener('change', () => this._apply());
    q('#b-presets').querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { this.logM = Math.log10(+c.dataset.m); q('#b-mass').value = this.logM; this._out(); this._apply(); }));
    q('#b-disk').addEventListener('click', (e) => { this.diskOn = !this.diskOn; e.currentTarget.classList.toggle('on', this.diskOn); this.ctx.bh.setDisk(this.diskOn); });
    q('#b-view').addEventListener('click', () => { this._apply(); this.ctx.setMode('view', 'custom'); });
    q('#b-drop').addEventListener('click', () => { this._apply(); this.ctx.setMode('drop', 'custom'); });
    this._out();
  }
  _apply() { const d = this.desc(); this.ctx.custom = d; this.ctx.bh.setBH(d, { disk: this.diskOn }); }
  _out() {
    const q = (s) => this.root.querySelector(s);
    const mass = Math.pow(10, this.logM), chi = this.spin;
    const Mkg = mass * M_SUN, rgm = rg(Mkg);
    q('#b-mass-v').textContent = mass < 1e-3 ? fmtSci(Mkg, 2) + ' kg' : fmtSolar(mass);
    q('#b-spin-v').textContent = chi.toFixed(3);
    const { rPlus, rMinus } = horizons(chi);
    const rI = isco(chi), rPh = photonOrbit(chi);
    const TH = hawkingTemperature(Mkg, chi);
    const tEv = evaporationTime(Mkg);
    const dens = Mkg / (4 / 3 * Math.PI * Math.pow(rs(Mkg), 3));
    const kH = tidalGradientSI(Mkg, rPlus, chi) * 2;
    const rTear = Math.cbrt(2 * G * Mkg / 1e3);
    const dt = diskTemperature(Mkg, 0.1, chi);
    const periodIsco = 2 * Math.PI * (Math.pow(rI, 1.5) + chi) * rgm / c;
    const near = PRESETS.reduce((best, p) => Math.abs(Math.log10(p[1]) - this.logM) < Math.abs(Math.log10(best[1]) - this.logM) ? p : best, PRESETS[0]);
    const humanVerdict = kH > 1e3 ? `사람은 지평선 밖 ${fmtLen(rTear)} 에서 찢어져요.` : `사람은 지평선을 멀쩡히 넘어요.`;
    const evapNote = tEv < 1 ? '만들자마자 증발해요.' : tEv < AGE_UNIVERSE ? '우주 나이보다 먼저 증발해요.' : `우주 나이의 ${fmtSci(tEv / AGE_UNIVERSE, 2)}배 동안 남아요.`;
    q('#b-out').innerHTML = `
      <p class="note tiny" style="margin:0 0 8px">${esc(near[0])} 질량 근처 · ${fmtSci(Mkg, 3)} kg</p>
      <div class="kv">
        <div class="k">r_s</div><div class="v num">${fmtLen(rs(Mkg))}</div>
        <div class="k">지평선 r₊</div><div class="v num">${fmtLen(rPlus * rgm)}<small>${rPlus.toFixed(3)} r_g</small></div>
        ${chi > 0 ? `<div class="k">내부 지평선 r₋</div><div class="v num">${fmtLen(rMinus * rgm)}</div>` : ''}
        <div class="k">ISCO</div><div class="v num">${fmtLen(rI * rgm)}<small>${rI.toFixed(2)} r_g · ${fmtTime(periodIsco)}</small></div>
        <div class="k">광자 궤도</div><div class="v num">${rPh.toFixed(2)} r_g</div>
        <div class="k">그림자 지름</div><div class="v num">${fmtLen(2 * Math.sqrt(27) * rgm)}</div>
        <div class="k">평균 밀도</div><div class="v num">${fmtSci(dens, 2)} kg/m³</div>
        <div class="k">호킹 온도</div><div class="v num">${fmtTemp(TH)}</div>
        <div class="k">증발 시간</div><div class="v num">${fmtTime(tEv)}</div>
        <div class="k">지평선 조석 기울기</div><div class="v num">${fmtSci(kH, 2)} s⁻²</div>
        <div class="k">원반 온도</div><div class="v num">${fmtTemp(dt.Tstar)}<small>${bandName(dt.Tstar)}</small></div>
      </div>
      <p class="note" style="margin-top:10px">${humanVerdict} ${evapNote}</p>`;
  }
  tick() {}
}
