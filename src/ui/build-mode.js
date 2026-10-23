// 만들기 모드: 질량과 스핀을 고르면 실제 물리량이 나온다. 미리보기는 광선추적.
import { M_SUN, M_EARTH, M_JUP, M_MOON, G, c, rs, rg, YEAR } from '../physics/constants.js';
import { horizons, isco, photonOrbit, hawkingTemperature, evaporationTime, tidalGradientSI } from '../physics/gr.js';
import { diskTemperature, bandName } from '../physics/disk.js';
import { fmtSci, fmtSolar, fmtTemp, fmtTime, fmtLen, esc, el } from './format.js';

const PRESETS = [
  ['사람 70 kg', 70 / M_SUN], ['달', M_MOON / M_SUN], ['지구', M_EARTH / M_SUN], ['목성', M_JUP / M_SUN], ['태양', 1],
  ['10 M☉', 10], ['가이아 BH3', 32.7], ['GW190521 잔해', 142], ['ω Cen', 4e4], ['궁수자리 A*', 4.297e6], ['M87*', 6.5e9], ['TON 618', 4.07e10],
];
const AGE_UNIVERSE = 13.787e9 * YEAR;

export class BuildMode {
  constructor(ctx) { this.ctx = ctx; this.logM = Math.log10(4.297e6); this.spin = 0.5; this.diskOn = true; }
  enter() {
    this.ctx.bh.animate = true;
    this._render();
    this.ctx.setHint('끌기: 시점 회전 · 휠/핀치: 거리');
  }
  leave() {}
  desc() {
    const mass = Math.pow(10, this.logM);
    return { custom: true, id: 'custom', short: '직접 만든 블랙홀', name: `M = ${fmtSolar(mass)}, a* = ${this.spin.toFixed(3)}`, mass, spin: this.spin, spinMeasured: true, disk: 'bright', eddington: 0.1, inc: 75, group: 'custom', incNote: '가정 75°' };
  }
  _render() {
    const b = this.ctx.els.body;
    const d = this.desc();
    this.ctx.custom = d;
    this.ctx.bh.setBH(d, { inc: this.ctx.bh.target.inc || 75, dist: this.ctx.bh.target.dist || 26, disk: this.diskOn });
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section">
        <div class="eyebrow">만들기</div>
        <div class="title-lg">블랙홀 하나 만들기</div>
        <p class="note">질량과 스핀만 정하면 블랙홀은 결정돼요 (전하는 0 으로). 아래 수치는 전부 그 두 값에서 계산한 것이에요.</p>
      </div>
      <div class="section">
        <div class="ctl"><label>질량</label><input type="range" id="b-mass" min="-30" max="11" step="0.01" value="${this.logM}"><span class="val num" id="b-mass-v"></span></div>
        <div class="chips" id="b-presets">${PRESETS.map(([n, m]) => `<button class="chip" data-m="${m}">${n}</button>`).join('')}</div>
        <div class="ctl" style="margin-top:12px"><label>스핀 a*</label><input type="range" id="b-spin" min="0" max="0.998" step="0.002" value="${this.spin}"><span class="val num" id="b-spin-v"></span></div>
        <div class="row wrap" style="margin-top:6px"><label class="toggle ${this.diskOn ? 'on' : ''}" id="b-disk"><span class="sw"></span>강착원반 (L/L_Edd = 0.1 가정)</label></div>
      </div>
      <div class="section" id="b-out"></div>
      <div class="section"><div class="row"><button class="btn primary" id="b-view">광선추적으로 보기</button><button class="btn" id="b-drop">물체 떨어뜨리기</button></div></div>
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
  _apply() {
    const d = this.desc(); this.ctx.custom = d;
    this.ctx.bh.setBH(d, { disk: this.diskOn });
  }
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
    const kH = tidalGradientSI(Mkg, rPlus, chi) * 2;    // 반지름 방향 늘임 k = 2A
    const kHuman = 1e3;
    const rTear = Math.cbrt(2 * G * Mkg / kHuman);     // 슈바르츠실트 근사
    const dt = diskTemperature(Mkg, 0.1, chi);
    const periodIsco = 2 * Math.PI * (Math.pow(rI, 1.5) + chi) * rgm / c;
    const near = PRESETS.reduce((best, p) => Math.abs(Math.log10(p[1]) - this.logM) < Math.abs(Math.log10(best[1]) - this.logM) ? p : best, PRESETS[0]);
    const humanVerdict = kH > kHuman ? `사람은 지평선 밖 ${fmtLen(rTear)} 에서 찢어져요.` : `사람은 지평선을 멀쩡히 넘어요 (지평선에서 머리–발 가속도 차 ${fmtSci(kH * 1.75 / 9.80665, 2)} g).`;
    const evapNote = tEv < 1 ? '만들자마자 호킹 복사로 증발해요.' : tEv < AGE_UNIVERSE ? '우주 나이보다 짧아요: 지금까지 남아 있으려면 더 무거워야 해요.' : `우주 나이의 ${fmtSci(tEv / AGE_UNIVERSE, 2)}배. 사실상 영원해요.`;
    q('#b-out').innerHTML = `
      <div class="section-title">이 블랙홀</div>
      <p class="note tiny">${esc(near[0])} 질량 근처예요 (${fmtSci(Mkg, 3)} kg).</p>
      <div class="kv">
        <div class="k">슈바르츠실트 반지름 r_s</div><div class="v num">${fmtLen(rs(Mkg))}</div>
        <div class="k">사건의 지평선 r₊</div><div class="v num">${fmtLen(rPlus * rgm)}<small>${rPlus.toFixed(3)} r_g</small></div>
        ${chi > 0 ? `<div class="k">내부 지평선 r₋</div><div class="v num">${fmtLen(rMinus * rgm)}<small>${rMinus.toFixed(3)} r_g</small></div>` : ''}
        <div class="k">ISCO</div><div class="v num">${fmtLen(rI * rgm)}<small>${rI.toFixed(3)} r_g</small></div>
        <div class="k">ISCO 공전 주기</div><div class="v num">${fmtTime(periodIsco)}</div>
        <div class="k">광자 궤도</div><div class="v num">${rPh.toFixed(3)} r_g</div>
        <div class="k">그림자 지름</div><div class="v num">${fmtLen(2 * Math.sqrt(27) * rgm)}</div>
        <div class="k">r_s 안쪽 평균 밀도</div><div class="v num">${fmtSci(dens, 2)} kg/m³</div>
        <div class="k">호킹 온도</div><div class="v num">${fmtTemp(TH)}</div>
        <div class="k">증발 시간</div><div class="v num">${fmtTime(tEv)}</div>
        <div class="k">지평선에서 조석 기울기</div><div class="v num">${fmtSci(kH, 2)} s⁻²</div>
        <div class="k">원반 안쪽 온도 (λ=0.1)</div><div class="v num">${fmtTemp(dt.Tstar)}<small>${bandName(dt.Tstar)}</small></div>
      </div>
      <p class="note" style="margin-top:10px">${humanVerdict}</p>
      <p class="note tiny">${evapNote} 증발 시간은 광자만 방출하는 공식 t = 5120π G²M³/(ħc⁴). 실제로는 입자 종류에 따라 2–3배 짧아요 (Page 1976). 호킹 온도는 커 공식 T = ħc³/(4πGMk_B)·√(1−a*²)/(1+√(1−a*²)).</p>`;
  }
  tick() {}
}
