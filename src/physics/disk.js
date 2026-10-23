// 강착원반 온도: 노비코프–손(Novikov & Thorne 1973) / 샤쿠라–순야예프(1973) 얇은 원반의 r_in 기준 온도 스케일.
//   T* = (3 G M Ṁ / (8π σ r_in³))^{1/4},  Ṁ = λ L_Edd / (η c²),  η = 1 − E_isco,  E_isco = √(1 − 2/(3 r_isco))
// 광도 비 λ = L/L_Edd 가 알려진 천체만 '측정 기반', 나머지는 가정값을 쓰고 표시할 때 밝힌다.
import { G, c, sigmaSB, L_EDD, rg } from './constants.js';
import { isco } from './gr.js';

export function efficiency(chi) {
  const r = isco(chi, true);
  return 1 - Math.sqrt(1 - 2 / (3 * r));
}

export function accretionRate(Mkg, lambda, chi) {
  return lambda * L_EDD(Mkg) / (efficiency(chi) * c * c);
}

// 반환: { Tstar(K), Mdot(kg/s), eta, rIn(M 단위), L(W) }
export function diskTemperature(Mkg, lambda, chi) {
  const eta = efficiency(chi);
  const L = lambda * L_EDD(Mkg);
  const Mdot = L / (eta * c * c);
  const rIn = isco(chi, true);
  const rInM = rIn * rg(Mkg);
  const Tstar = Math.pow(3 * G * Mkg * Mdot / (8 * Math.PI * sigmaSB * rInM ** 3), 0.25);
  return { Tstar, Mdot, eta, rIn, L };
}

// 온도 → 주된 복사 대역 이름 (빈 변위 법칙 λ_peak = 2.898e-3 / T)
export function bandName(T) {
  const lam = 2.898e-3 / T;
  if (lam < 1e-11) return '감마선';
  if (lam < 1e-8) return 'X선';
  if (lam < 3.8e-7) return '자외선';
  if (lam < 7.5e-7) return '가시광';
  if (lam < 1e-3) return '적외선';
  return '전파';
}
