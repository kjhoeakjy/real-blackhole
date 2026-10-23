// 일반상대론 계산: 커(Kerr) 블랙홀의 기하량, 자전축 방향 자유낙하, 조석장, 호킹 복사.
// 단위: 별도 표기가 없으면 기하 단위 G = c = M = 1 (길이와 시간을 GM/c^2, GM/c^3 로 잰다).
import { G, c, hbar, kB, M_SUN, rg, tg, YEAR } from './constants.js';

// ---------- 커 블랙홀의 특성 반지름 (M = 1, chi = 무차원 스핀 a/M) ----------
export function horizons(chi) {
  const s = Math.sqrt(Math.max(0, 1 - chi * chi));
  return { rPlus: 1 + s, rMinus: 1 - s };
}

// 가장 안쪽 안정 원궤도 (Bardeen, Press & Teukolsky 1972). prograde = 원반이 자전 방향으로 도는 경우.
export function isco(chi, prograde = true) {
  const a = Math.abs(chi);
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const root = Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  return prograde ? 3 + z2 - root : 3 + z2 + root;
}

// 적도면 광자 원궤도 (Bardeen 1973)
export function photonOrbit(chi, prograde = true) {
  const a = Math.abs(chi);
  const sgn = prograde ? -1 : 1;
  return 2 * (1 + Math.cos((2 / 3) * Math.acos(sgn * a)));
}

// 슈바르츠실트 그림자 지름 2√27 M. 커의 경우 스핀·경사각에 따라 수 % 이내로 바뀐다(EHT 2019 Paper I).
export const SHADOW_DIAMETER_SCHW = 2 * Math.sqrt(27);

// 거리 D(m)에서 본 그림자 각지름 (마이크로각초)
export function shadowAngularSizeMicroarcsec(Mkg, Dm) {
  const theta = SHADOW_DIAMETER_SCHW * rg(Mkg) / Dm; // rad
  return theta * 206264.806247 * 1e6;
}

// ---------- 자전축(θ=0) 방향의 자유낙하 ----------
// 축 위에서 L = 0, Q = 0 인 측지선. 고유시간 미분:
//   (dr/dτ)^2 = E^2 - 1 + 2r/(r^2 + a^2)         (a=0 이면 슈바르츠실트 E^2 - 1 + 2/r)
// 정지 상태에서 r0 에서 떨어뜨리면 E^2 = 1 - 2 r0/(r0^2 + a^2).
export function energyFromRest(r0, chi) {
  return Math.sqrt(Math.max(0, 1 - 2 * r0 / (r0 * r0 + chi * chi)));
}

function vr2(r, E, chi) {
  return E * E - 1 + 2 * r / (r * r + chi * chi);
}

// r0 → r1 까지 떨어지는 고유시간 (r1 < r0), 단위 M. 심프슨 적분, 출발점의 v=0 특이성은 치환으로 제거.
export function properTimeAxis(r0, r1, chi, E = null) {
  if (E === null) E = energyFromRest(r0, chi);
  r1 = Math.max(r1, turningPointAxis(E, chi) * 1.0000001);
  if (r1 >= r0) return 0;
  // 치환 r = r0 - s^2 로 출발점 근방 1/√ 특이성 제거: dr = -2s ds
  const sMax = Math.sqrt(r0 - r1);
  const n = 4000;
  const h = sMax / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const s = i * h;
    const r = Math.max(r1, r0 - s * s);
    let v2 = vr2(r, E, chi);
    // 출발점(v2→0)에서는 2s/√v2 → 유한값: v2 ≈ v2'(r0)(r0 - r) = v2'(r0) s^2
    let f;
    if (i === 0) {
      const dv = dvr2dr(r0, chi);
      f = 2 / Math.sqrt(Math.max(1e-30, -dv));
    } else {
      f = 2 * s / Math.sqrt(Math.max(1e-30, v2));
    }
    const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    sum += w * f;
  }
  return sum * h / 3;
}

// 커 축 위 낙하는 내부 지평선 안쪽에서 되튀는 점(v=0)이 있다. 그 반지름(없으면 0).
export function turningPointAxis(E, chi) {
  if (chi === 0) return 0;
  // vr2(r) = E^2 - 1 + 2r/(r^2+a^2) = 0 → r^2 (1-E^2) - 2r + a^2 (1-E^2) = 0
  const k = 1 - E * E;
  if (k <= 0) return 0;
  const disc = 1 - k * k * chi * chi;
  if (disc < 0) return 0;
  return (1 - Math.sqrt(disc)) / k;
}

function dvr2dr(r, chi) {
  // d/dr [2r/(r^2+a^2)] = 2(a^2 - r^2)/(r^2+a^2)^2
  const d = r * r + chi * chi;
  return 2 * (chi * chi - r * r) / (d * d);
}

// 무한원점에서 정지 상태로 떨어질 때(E=1) 슈바르츠실트 닫힌 형태: τ = (2/3)(r0^{3/2} - r1^{3/2})/√2
export function properTimeFromInfinitySchw(r0, r1) {
  return (2 / 3) * (Math.pow(r0, 1.5) - Math.pow(r1, 1.5)) / Math.SQRT2;
}

// 슈바르츠실트에서 r0 정지 출발 → 특이점까지 닫힌 형태(사이클로이드): τ = (π/2) r0^{3/2} / √2
export function properTimeToSingularitySchw(r0) {
  return (Math.PI / 2) * Math.pow(r0, 1.5) / Math.SQRT2;
}

// 지평선에서 특이점까지 최대 고유시간은 πM (정지 출발 극한). 슈바르츠실트 전용.
export const MAX_TAU_INSIDE_SCHW = Math.PI;

// 먼 관측자의 좌표시간: dt/dτ. 축 위 커: u^t = E (r^2+a^2)/Δ  (Δ = r^2 - 2r + a^2)
// 지평선에서 발산하므로 r1 > r+ 에서만 의미가 있다.
export function coordinateTimeAxis(r0, r1, chi, E = null) {
  if (E === null) E = energyFromRest(r0, chi);
  const { rPlus } = horizons(chi);
  r1 = Math.max(r1, rPlus * 1.000001);
  if (r1 >= r0) return 0;
  const sMax = Math.sqrt(r0 - r1);
  const n = 8000;
  const h = sMax / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const s = i * h;
    const r = Math.max(r1, r0 - s * s);
    const delta = r * r - 2 * r + chi * chi;
    const ut = E * (r * r + chi * chi) / delta;
    let f;
    if (i === 0) {
      const dv = dvr2dr(r0, chi);
      f = ut * 2 / Math.sqrt(Math.max(1e-30, -dv));
    } else {
      f = ut * 2 * s / Math.sqrt(Math.max(1e-30, vr2(r, E, chi)));
    }
    const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    sum += w * f;
  }
  return sum * h / 3;
}

// 고유시간 τ 에서의 반지름을 얻기 위한 표(애니메이션용). r0 에서 rEnd 까지 N 개 샘플.
export function infallTable(r0, rEnd, chi, N = 600) {
  const E = energyFromRest(r0, chi);
  const rows = [];
  // 지수적으로 촘촘하게: 안쪽일수록 빠르므로 r 에 대해 등간격이면 충분히 부드럽다.
  for (let i = 0; i <= N; i++) {
    const r = r0 - (r0 - rEnd) * i / N;
    rows.push({ r, tau: properTimeAxisCached(r0, r, chi, E) });
  }
  return rows;
}

// 표 작성용 누적 적분 (매번 처음부터 적분하지 않도록 간단한 캐시)
let _cache = { key: null, r: [], tau: [] };
function properTimeAxisCached(r0, r1, chi, E) {
  const key = `${r0}|${chi}`;
  if (_cache.key !== key) {
    _cache = { key, r: [], tau: [] };
    const n = 20000;
    const sMax = Math.sqrt(r0 - turningPointAxis(E, chi) * 1.0000001 - 1e-9 * r0);
    const h = sMax / n;
    let acc = 0, prev = null;
    for (let i = 0; i <= n; i++) {
      const s = i * h;
      const r = Math.max(1e-30, r0 - s * s);
      let f;
      if (i === 0) f = 2 / Math.sqrt(Math.max(1e-30, -dvr2dr(r0, chi)));
      else f = 2 * s / Math.sqrt(Math.max(1e-30, vr2(r, E, chi)));
      if (prev !== null) acc += 0.5 * (prev + f) * h;
      prev = f;
      _cache.r.push(r); _cache.tau.push(acc);
    }
  }
  // 보간 (r 감소 순으로 저장되어 있음)
  const R = _cache.r, T = _cache.tau;
  if (r1 >= R[0]) return 0;
  let lo = 0, hi = R.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (R[mid] > r1) lo = mid; else hi = mid; }
  const f = (R[lo] - r1) / (R[lo] - R[hi] || 1);
  return T[lo] + (T[hi] - T[lo]) * f;
}

// ---------- 조석장 ----------
// 자전축 위에서 자유낙하하는 관측자의 조석 텐서(국소 정규직교틀, 단위 1/M^2):
//   E_ij = diag(-2A, A, A),  A = r (r^2 - 3a^2) / (r^2 + a^2)^3
// a = 0 이면 A = 1/r^3 (반지름 방향 2M/r^3 늘임, 가로 방향 M/r^3 압축). 축 위에서는 속도에 무관하게 정확하다
// (주 널방향을 따른 부스트에 대해 Ψ2 가 불변).
export function tidalA(r, chi) {
  const d = r * r + chi * chi;
  return r * (r * r - 3 * chi * chi) / (d * d * d);
}

// 축 위 조석 세기 A(r) 가 최대가 되는 반지름. a=0 이면 r→0 에서 발산(0 반환).
export function tidalPeakRadius(chi) {
  if (chi <= 0) return 0;
  // A = r (r²−3a²)/(r²+a²)³ 는 r > √3 a 에서 한 번 최대를 갖는다. 황금분할 탐색.
  let lo = Math.sqrt(3) * chi, hi = 10 * chi + 10;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c1 = hi - phi * (hi - lo), c2 = lo + phi * (hi - lo);
  for (let i = 0; i < 100; i++) {
    if (tidalA(c1, chi) > tidalA(c2, chi)) { hi = c2; } else { lo = c1; }
    c1 = hi - phi * (hi - lo); c2 = lo + phi * (hi - lo);
  }
  return (lo + hi) / 2;
}

// 바깥에서 떨어지며 조석 세기 A 가 처음 Atarget 에 도달하는 반지름. 축 위 커에서는 조석이 유한한 최댓값을 가지므로
// 도달하지 못하면 null (슈바르츠실트는 r→0 에서 발산하므로 항상 도달).
export function radiusForTidalA(Atarget, chi) {
  if (Atarget <= 0) return null;
  if (chi <= 0) return Math.cbrt(1 / Atarget);
  const rPeak = tidalPeakRadius(chi);
  if (tidalA(rPeak, chi) < Atarget) return null;
  let lo = rPeak, hi = Math.max(1e3, 10 * Math.cbrt(1 / Atarget));
  while (tidalA(hi, chi) > Atarget) hi *= 10;
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if (tidalA(mid, chi) > Atarget) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// SI 변환: 조석 가속도 기울기 (s^-2) = A · c^6/(GM)^2
export function tidalGradientSI(Mkg, r_over_M, chi) {
  const rgm = rg(Mkg);
  return tidalA(r_over_M, chi) / (rgm * rgm) * c * c; // (1/m^2)·c^2 → s^-2
}

// ---------- 호킹 복사 ----------
// 온도 T = ħ c^3 / (8π G M k_B)  (슈바르츠실트). 커: T = ħ c^3 /(4π G M k_B) · √(1-χ²)/(1+√(1-χ²)).
export function hawkingTemperature(Mkg, chi = 0) {
  const s = Math.sqrt(Math.max(0, 1 - chi * chi));
  return hbar * c ** 3 / (4 * Math.PI * G * Mkg * kB) * s / (1 + s);
}

// 증발 시간. t = 5120 π G^2 M^3 /(ħ c^4) × 1/f, f 는 입자종 보정(Page 1976 / MacGibbon 1991).
// 광자+중성미자(3종)+중력자만 방출되는 큰 블랙홀(M ≫ 1e14 kg): f ≈ 1.63 ... 기본값은 광자만(f=1) 공식에
// MacGibbon-Page 보정을 곱한 값으로 두고, 표시할 때 어떤 가정인지 함께 적는다.
export function evaporationTime(Mkg, pageFactor = 1.0) {
  return 5120 * Math.PI * G * G * Mkg ** 3 / (hbar * c ** 4) / pageFactor;
}

// ---------- 단위 변환 보조 ----------
export const toM = (Mkg) => ({ len: rg(Mkg), time: tg(Mkg) });
export const solar = (n) => n * M_SUN;
export const secondsToHuman = (s) => s; // 표시용 포맷은 ui 쪽에서
export { YEAR };
