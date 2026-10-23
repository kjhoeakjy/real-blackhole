// 블랙홀에 집어넣을 물체. 수치와 파괴 기준은 research/disruption-physics.md 의 표를 따른다.
// kCrit: 물체가 '완전히 찢어지는' 조석 기울기 (s^-2, 반지름 방향 2GM/r^3 기준). 중력으로 묶인 천체는 η 로부터 계산.
//   k_crit = 2 G m / (η^3 R^3)
import { G, M_SUN, R_SUN, M_EARTH, R_EARTH, M_JUP, R_JUP, M_MOON, R_MOON } from '../physics/constants.js';

const kGrav = (m, R, eta) => 2 * G * m / (eta ** 3 * R ** 3);

export const OBJECTS = [
  {
    id: 'human', name: '사람', mass: 70, radius: 0.875, length: 1.75, color: [0.86, 0.72, 0.6],
    mechanism: '재료 강도', kCrit: 1e3, kRange: [3e2, 3e3],
    desc: '70 kg, 키 1.75 m. 허리에 약 1.5×10⁴ N 의 장력이 걸리면 몸이 둘로 나뉜다고 본다 (피부·인대·근막의 인장강도 합산, 연구 노트 §4.3).',
    stages: [
      { k: 10, label: '당김이 느껴짐', note: '손끝·발끝에 약 1 g' },
      { k: 50, label: '의식 상실', note: '머리와 발 쪽으로 피가 몰림 (+Gz 5 g 상당)' },
      { k: 200, label: '관절·인대 파열 시작', note: '장력 2–5 kN' },
      { k: 1e3, label: '몸이 둘로 찢어짐', note: '허리 장력 ≈ 1.5×10⁴ N', main: true },
      { k: 1e7, label: '센티미터 조각', note: '조직 인장강도 ~1 MPa, 3 cm 조각' },
      { k: 6e11, label: '세포 파열', note: '세포막 장력 10 mN/m, 반지름 5 µm' },
    ],
    refs: ['Ní Annaidh et al. 2012 (피부 인장강도)', 'Reilly & Burstein 1975 (뼈)', 'Yamada 1970 Strength of Biological Materials'],
  },
  {
    id: 'bennu', name: '소행성 베누', mass: 7.329e10, radius: 244, color: [0.25, 0.24, 0.23],
    mechanism: '자체 중력 + 응집력', kCrit: 3.6e-7,
    desc: '지름 약 490 m 의 파편 더미 소행성. OSIRIS-REx 측정: 표면 응집력 거의 0, 밀도 1190 kg/m³. 자체 중력 Gm/R³ 에 약 1 Pa 응집력을 더한 기준.',
    stages: [
      { k: 3.6e-7, label: '파편 더미가 흩어짐', note: '자체 중력 + 1 Pa 응집력 한계', main: true },
      { k: 4e3, label: '1 m 바위가 부서짐', note: '인장강도 ~1 MPa' },
      { k: 4e8, label: '1 cm 자갈이 부서짐', note: '인장강도 ~10 MPa' },
    ],
    refs: ['Scheeres et al. 2019 Nat. Astron. 3, 352', 'Walsh et al. 2022 Sci. Adv. 8, eabm6229', 'Ballouz et al. 2020 Nature 587, 205'],
  },
  {
    id: 'moon', name: '달', mass: M_MOON, radius: R_MOON, color: [0.62, 0.6, 0.58],
    mechanism: '자체 중력', eta: 1.0, kCrit: kGrav(M_MOON, R_MOON, 1.0),
    desc: '행성 규모에서는 암석 강도가 무시된다. 중심 밀도 ~7000 kg/m³ 기준 η ≈ 1.0.',
    stages: [
      { k: kGrav(M_MOON, R_MOON, 1.26), label: '표면이 들려 올라감', note: 'η = 1.26 (로슈 한계, 강체)' },
      { k: kGrav(M_MOON, R_MOON, 1.0), label: '달이 완전히 해체됨', note: 'η = 1.0 (중심까지 풀림)', main: true },
    ],
    refs: ['Weber et al. 2011 Science 331, 309 (달 내부)', 'Roche 1849'],
  },
  {
    id: 'earth', name: '지구', mass: M_EARTH, radius: 6.371e6, color: [0.35, 0.5, 0.75],
    mechanism: '자체 중력', eta: 0.95, kCrit: kGrav(M_EARTH, 6.371e6, 0.95),
    desc: 'PREM 지구 모형의 중심 밀도 ~13,000 kg/m³ 로 추정한 η ≈ 0.95. 지구 중심 압력(3.6×10¹¹ Pa)이 암석 강도의 10⁴ 배라서 강도는 무시된다.',
    stages: [
      { k: kGrav(M_EARTH, 6.371e6, 1.26), label: '지각·바다가 들려 올라감', note: 'η = 1.26' },
      { k: kGrav(M_EARTH, 6.371e6, 0.95), label: '핵까지 완전히 해체됨', note: 'η = 0.95', main: true },
    ],
    refs: ['Dziewonski & Anderson 1981 PREM', 'Holsapple & Michel 2006 Icarus 183, 331'],
  },
  {
    id: 'mars', name: '화성', mass: 6.4169e23, radius: 3.3895e6, color: [0.75, 0.42, 0.28],
    mechanism: '자체 중력', eta: 1.06, kCrit: kGrav(6.4169e23, 3.3895e6, 1.06),
    desc: 'InSight 지진 자료의 핵 크기로 추정한 중심 밀도 ~6500 kg/m³, η ≈ 1.06.',
    stages: [
      { k: kGrav(6.4169e23, 3.3895e6, 1.26), label: '표면이 들려 올라감', note: 'η = 1.26' },
      { k: kGrav(6.4169e23, 3.3895e6, 1.06), label: '완전히 해체됨', note: 'η = 1.06', main: true },
    ],
    refs: ['Stähler et al. 2021 Science 373, 443'],
  },
  {
    id: 'jupiter', name: '목성', mass: M_JUP, radius: 6.9911e7, color: [0.8, 0.68, 0.55],
    mechanism: '자체 중력', eta: 0.85, kCrit: kGrav(M_JUP, 6.9911e7, 0.85),
    desc: 'n≈1 폴리트로프(ρc/ρ̄ = π²/3)로 본 가스 행성, η ≈ 0.85. 항성질량 블랙홀(M/m ≲ 30)에 대해서는 조석 파괴보다 병합에 가깝다.',
    stages: [
      { k: kGrav(M_JUP, 6.9911e7, 1.26), label: '대기가 벗겨지기 시작', note: 'η = 1.26' },
      { k: kGrav(M_JUP, 6.9911e7, 0.85), label: '완전히 해체됨', note: 'η = 0.85', main: true },
    ],
    refs: ['Guillot 2005 ARE&PS 33, 493'],
  },
  {
    id: 'sun', name: '태양', mass: M_SUN, radius: R_SUN, color: [1.0, 0.85, 0.55], emit: 1,
    mechanism: '자체 중력 (수치 시뮬레이션 맞춤식)', etaFn: 'ryu',
    desc: 'Ryu et al. 2020 의 일반상대론 유체 시뮬레이션 맞춤식 Ψ = Ψ_BH(M)·Ψ_*(1 M☉) 로 완전 파괴 반지름을 정한다 (10⁵–5×10⁷ M☉ 범위에서 검증, 그 밖은 외삽).',
    stages: [
      { etaFixed: 2.0, label: '외층이 벗겨지기 시작', note: '부분 파괴 (r ≈ 2 r_t)' },
      { etaFn: 'ryu', label: '별이 완전히 해체됨', note: 'Ryu et al. 2020 맞춤식', main: true },
    ],
    refs: ['Ryu, Krolik, Piran & Noble 2020 ApJ 904, 98–101', 'Guillochon & Ramirez-Ruiz 2013 ApJ 767, 25', 'Rees 1988 Nature 333, 523'],
  },
  {
    id: 'sirius-b', name: '시리우스 B (백색왜성)', mass: 1.018 * M_SUN, radius: 5.64e6, color: [0.85, 0.9, 1.0], emit: 1,
    mechanism: '자체 중력', eta: 0.8, kCrit: kGrav(1.018 * M_SUN, 5.64e6, 0.8),
    desc: '질량 1.018 M☉, 반지름 5,640 km 의 백색왜성. 평균 밀도 2.7×10⁹ kg/m³. η ≈ 0.8 (0.55–1.1).',
    stages: [
      { k: kGrav(1.018 * M_SUN, 5.64e6, 1.26), label: '표면이 들려 올라감', note: 'η = 1.26' },
      { k: kGrav(1.018 * M_SUN, 5.64e6, 0.8), label: '완전히 해체됨', note: 'η = 0.8', main: true },
    ],
    refs: ['Bond et al. 2017 ApJ 840, 70', 'Joyce et al. 2018 MNRAS 481, 2361', 'Rosswog, Ramirez-Ruiz & Hix 2009 ApJ 695, 404'],
  },
  {
    id: 'psr-j0740', name: 'PSR J0740+6620 (중성자별)', mass: 2.08 * M_SUN, radius: 1.24e4, color: [0.7, 0.8, 1.0], emit: 1,
    mechanism: '자체 중력 (강한 상대론적)', eta: 1.1, kCrit: kGrav(2.08 * M_SUN, 1.24e4, 1.1),
    desc: '질량 2.08 M☉, 반지름 12.4 km 로 가장 무거운 중성자별 중 하나. 자체 중력이 강하게 상대론적이라 η 는 ±30 % 불확실.',
    stages: [
      { k: kGrav(2.08 * M_SUN, 1.24e4, 1.1), label: '중성자별이 해체됨', note: 'η ≈ 1.1 (1.0–1.26)', main: true },
    ],
    refs: ['Fonseca et al. 2021 ApJL 915, L12', 'Riley et al. 2021 ApJL 918, L27', 'Foucart, Hinderer & Nissanke 2018 PRD 98, 081501'],
  },
];

// 모든 물체에 공통인 미시적 단계 (연구 노트 §5). k 가 매우 커서 항상 '완전 파괴' 뒤에 온다.
export const MICRO_STAGES = [
  { k: 3e27, label: '분자 결합(C–C)이 끊어짐', note: 'F_max ≈ 4 nN, 1.54 Å' },
  { k: 1.71e33, label: '원자가 이온화됨', note: '수소: k = e²/(4πε₀ mₑ a₀³)' },
  { k: 1e45, label: '원자핵이 핵자로 풀림', note: '핵자당 결합에너지 8–19 MeV' },
  { k: 5e47, label: '핵자가 하드론 소나기로 찢어짐', note: 'QCD 끈 장력 0.9 GeV/fm. 쿼크는 단독으로 풀리지 않는다' },
  { k: 3.44e86, label: '플랑크 곡률: 일반상대론이 더 이상 성립하지 않음', note: 'k ~ c⁵/(ħG)', planck: true },
];

// Ryu et al. 2020 의 완전 파괴 η (태양형 별). Ψ_BH = 0.80 + 0.26 (M/1e6)^0.5, Ψ_*(1 M☉) = 0.466.
// 검증 범위 1e5–5e7 M☉; 그 아래는 뉴턴 극한값 0.37 로, 그 위는 외삽하되 2.0 을 넘지 않게 둔다.
export function etaRyu(Mbh_solar, mStar_solar = 1) {
  const x = (mStar_solar - 0.669) / 0.137;
  const psiStar = (1.47 + Math.exp(x)) / (1 + 2.34 * Math.exp(x));
  if (Mbh_solar < 1e5) return 0.37;
  const psiBH = 0.80 + 0.26 * Math.sqrt(Mbh_solar / 1e6);
  return Math.min(2.0, psiBH * psiStar);
}
