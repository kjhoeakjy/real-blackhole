// 귀환 계산: 등속 항해 시간, 시간 지연, 우주 방사선 피폭, 수명, 블랙홀 탈출, 사건 선택의 영향 → 무사 귀환 확률.
// 상수는 측정값·공식 문서 기준이고, 확률은 단순 모형이다 (각 줄의 출처 참고).
import { c, YEAR, DAY, M_SUN } from './constants.js';
import { horizons, tidalGradientSI } from './gr.js';

// 깊은 우주 은하우주선 선량률: MSL/RAD 화성 항해 중 측정 1.84 mSv/day (Zeitlin et al. 2013, Science 340, 1080)
export const DOSE_RATE_SV_PER_YEAR = 1.84e-3 * 365.25;
// 치명 암 위험: ICRP 103 (2007) 전집단 손해 계수 5.5 %/Sv (선형)
export const FATAL_RISK_PER_SV = 0.055;
// 사망률 Gompertz 근사 λ(x) = a·e^{bx}: 기대수명 ≈ 81세 (통계청 2023 생명표 83.5세보다 조금 보수적)
const GOMPERTZ_A = 2.5e-5, GOMPERTZ_B = 0.095;
// 사람의 조석 한계 (반지름 방향 기울기 k, s⁻²): 10 느낌, 50 의식 상실, 1000 몸이 둘로 (research/disruption-physics.md)
export const HUMAN_K = { feel: 10, faint: 50, tear: 1e3 };
// 지구 대기 재진입·착륙 위험: 우주왕복선 최종 확률적 위험평가 1/90 (발사+귀환) 의 절반을 귀환 몫으로
export const REENTRY_RISK = 1 / 180;

const smooth = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// 나이 x 에서 x+T(년)까지 살아 있을 확률
export function survivalProb(age, T) {
  if (T <= 0) return 1;
  const { exp } = Math;
  return exp(-(GOMPERTZ_A / GOMPERTZ_B) * (exp(GOMPERTZ_B * (age + T)) - exp(GOMPERTZ_B * age)));
}

// 피폭 생존: 확률적 영향(선형) × 누적 선량이 수 Sv 를 넘으면 결정적 영향으로 급감 (차폐 없음 가정)
export function radiationSurvival(doseSv) {
  return Math.exp(-FATAL_RISK_PER_SV * doseSv) * (1 - smooth(doseSv, 5, 12));
}

// 블랙홀 곁에서 출발: 지평선 밖 r(r_g 단위) 에서 사람의 생존 계수. 지평선 안쪽은 0 (빠져나올 수 없음)
export function blackHoleSurvival(massSolar, chi, rOverRg) {
  const Mkg = massSolar * M_SUN;
  const { rPlus } = horizons(chi);
  if (rOverRg <= rPlus) return { p: 0, k: Infinity, inside: true, rPlus };
  const k = tidalGradientSI(Mkg, rOverRg, chi) * 2; // 반지름 방향 기울기
  let p = 1;
  if (k >= HUMAN_K.tear) p = 0;
  else if (k > HUMAN_K.faint) p = 1 - (Math.log10(k) - Math.log10(HUMAN_K.faint)) / (Math.log10(HUMAN_K.tear) - Math.log10(HUMAN_K.faint));
  return { p, k, inside: false, rPlus };
}

// 귀환 계획. distM: 지금 거리(m), v: 속도(m/s), age: 출발 나이,
// bh: { massSolar, chi, rOverRg } | null, mods: 사건 선택의 합 { timeFrac, timeAbs(s), dose(Sv), p }
export function planReturn({ distM, v, age, bh = null, mods = {} }) {
  const beta = Math.min(v / c, 0.9999999);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const tEarth = (distM / v) * (1 + (mods.timeFrac || 0)) + (mods.timeAbs || 0);   // 지구 시계
  const tau = tEarth / gamma;                                                       // 여행자 시계 (멈춘 시간은 작아서 같이 나눔)
  const dose = DOSE_RATE_SV_PER_YEAR * (tau / YEAR) + (mods.dose || 0);
  const pLife = survivalProb(age, tau / YEAR);
  const pRad = radiationSurvival(dose);
  const bhRes = bh ? blackHoleSurvival(bh.massSolar, bh.chi, bh.rOverRg) : null;
  const pBH = bhRes ? bhRes.p : 1;
  const pEvents = mods.p ?? 1;
  const pReentry = 1 - REENTRY_RISK;
  return {
    beta, gamma, tEarth, tau, lightTime: distM / c, dose,
    pLife, pRad, pBH, pEvents, pReentry, bh: bhRes,
    p: pLife * pRad * pBH * pEvents * pReentry,
    arriveAge: age + tau / YEAR, earthYears: tEarth / YEAR,
  };
}

export { DAY };
