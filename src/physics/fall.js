// 낙하 시나리오 계산: 물체를 자전축 위 r0 에서 정지 상태로 놓았을 때 각 단계가 일어나는 반지름과 고유시간.
import { G, c, M_SUN, rg, tg } from './constants.js';
import * as gr from './gr.js';
import { MICRO_STAGES, etaRyu } from '../data/objects.js';

// 반지름 방향 조석 기울기 k(r) = 2A(r)·c²/r_g²  (s^-2)
export function kRadial(Mkg, rM, chi) {
  const rgm = rg(Mkg);
  return 2 * gr.tidalA(rM, chi) * c * c / (rgm * rgm);
}
// k 가 처음 도달하는 반지름 (단위 M). 없으면 null.
export function radiusForK(Mkg, k, chi) {
  const rgm = rg(Mkg);
  const A = k * rgm * rgm / (2 * c * c);
  return gr.radiusForTidalA(A, chi);
}

// 단계 목록 생성. 반환: { stages:[{label,note,k,rM,rMeters,tau,main,inside,...}], horizon:{...}, totalTau, ... }
export function buildScenario(bh, obj, r0M, opts = {}) {
  const Mkg = bh.mass * M_SUN;
  const chi = Math.min(0.998, Math.max(0, opts.spin ?? bh.spin ?? 0));
  const rgm = rg(Mkg), tgs = tg(Mkg);
  const { rPlus, rMinus } = gr.horizons(chi);
  const E = gr.energyFromRest(r0M, chi);
  const rTurn = gr.turningPointAxis(E, chi);
  const rEnd = Math.max(rTurn, 1e-6); // 슈바르츠실트면 특이점, 커면 축 위 되튐점 (내부 지평선 안쪽)

  // 물체 단계
  const stages = [];
  const pushStage = (st, k, extra = {}) => {
    const rM = radiusForK(Mkg, k, chi);
    const entry = { ...st, k, rM, ...extra };
    if (rM == null) { entry.unreachable = true; }
    else {
      entry.rMeters = rM * rgm;
      entry.tau = gr.properTimeAxis(r0M, rM, chi, E) * tgs;
      entry.inside = rM < rPlus;
      entry.insideInner = rM < rMinus;
      entry.beforeTurn = rM > rTurn;
      if (rM >= r0M) entry.atRelease = true;
    }
    stages.push(entry);
  };
  for (const st of obj.stages) {
    let k = st.k;
    if (st.etaFn === 'ryu' || st.etaFixed) {
      const eta = st.etaFixed ?? etaRyu(bh.mass, obj.mass / M_SUN);
      k = 2 * G * obj.mass / (eta ** 3 * obj.radius ** 3);
      pushStage(st, k, { eta });
    } else pushStage(st, k);
  }
  for (const st of MICRO_STAGES) pushStage(st, st.k, { micro: true });

  const main = stages.find((s) => s.main);
  // 지평선 통과
  const horizon = { rM: rPlus, rMeters: rPlus * rgm, tau: gr.properTimeAxis(r0M, rPlus, chi, E) * tgs };
  const inner = chi > 0 ? { rM: rMinus, rMeters: rMinus * rgm, tau: gr.properTimeAxis(r0M, rMinus * 1.000001, chi, E) * tgs } : null;
  const end = { rM: rEnd, tau: gr.properTimeAxis(r0M, rEnd, chi, E) * tgs };
  // 먼 관측자 시계: 지평선 직전(0.1 % 바깥)까지
  const coordToNearHorizon = gr.coordinateTimeAxis(r0M, rPlus * 1.001, chi, E) * tgs;

  // 블랙홀이 물체보다 충분히 무겁지 않으면(질량비 < 30) 조석 파괴보다 병합에 가깝다
  const massRatio = Mkg / obj.mass;
  // 힐스 질량: 주 단계가 지평선 안쪽이면 '통째로 삼켜짐'
  return {
    Mkg, chi, rg: rgm, tg: tgs, rPlus, rMinus, E, rTurn, r0M, r0Meters: r0M * rgm,
    stages, main, horizon, inner, end, coordToNearHorizon, massRatio,
    mergerRegime: massRatio < 30,
    swallowedWhole: main && !main.unreachable && main.inside,
    table: gr.infallTable(r0M, rEnd, chi, 800),
  };
}

// 시간 표기
export function fmtTime(s) {
  if (!isFinite(s)) return '∞';
  if (s === 0) return '0';
  const abs = Math.abs(s);
  if (abs < 1e-21) return `${(s * 1e24).toPrecision(3)} ys`;
  if (abs < 1e-18) return `${(s * 1e21).toPrecision(3)} zs`;
  if (abs < 1e-15) return `${(s * 1e18).toPrecision(3)} as`;
  if (abs < 1e-12) return `${(s * 1e15).toPrecision(3)} fs`;
  if (abs < 1e-9) return `${(s * 1e12).toPrecision(3)} ps`;
  if (abs < 1e-6) return `${(s * 1e9).toPrecision(3)} ns`;
  if (abs < 1e-3) return `${(s * 1e6).toPrecision(3)} µs`;
  if (abs < 1) return `${(s * 1e3).toPrecision(3)} ms`;
  if (abs < 60) return `${s.toPrecision(3)} 초`;
  if (abs < 3600) return `${(s / 60).toPrecision(3)} 분`;
  if (abs < 86400) return `${(s / 3600).toPrecision(3)} 시간`;
  if (abs < 86400 * 365.25) return `${(s / 86400).toPrecision(3)} 일`;
  if (abs < 86400 * 365.25 * 1e4) return `${(s / (86400 * 365.25)).toPrecision(3)} 년`;
  return `${(s / (86400 * 365.25)).toExponential(2)} 년`;
}
export function fmtLen(m) {
  const a = Math.abs(m);
  if (a < 1e-12) return `${(m * 1e15).toPrecision(3)} fm`;
  if (a < 1e-9) return `${(m * 1e12).toPrecision(3)} pm`;
  if (a < 1e-6) return `${(m * 1e9).toPrecision(3)} nm`;
  if (a < 1e-3) return `${(m * 1e6).toPrecision(3)} µm`;
  if (a < 1) return `${(m * 1e3).toPrecision(3)} mm`;
  if (a < 1e3) return `${m.toPrecision(3)} m`;
  if (a < 1.495978707e11 * 0.1) return `${(m / 1e3).toPrecision(4)} km`;
  if (a < 3.0857e16 * 0.1) return `${(m / 1.495978707e11).toPrecision(3)} AU`;
  if (a < 3.0857e19) return `${(m / 3.0857e16).toPrecision(3)} pc`;
  if (a < 3.0857e22) return `${(m / 3.0857e19).toPrecision(3)} kpc`;
  return `${(m / 3.0857e22).toPrecision(3)} Mpc`;
}
export function fmtMass(solar) {
  if (solar >= 1e4) return `${solar.toExponential(2).replace('e+', '×10^')} M☉`;
  return `${solar.toPrecision(3)} M☉`;
}
