// 여행 목적지와 탈것. 거리·좌표는 측정값 (출처는 각 항목).
import { c } from '../physics/constants.js';

// 태양계 천체: 위치는 astronomy-engine 으로 지금 이 순간 계산 (map.js PLANETS 와 같은 body 이름)
export const SOLAR = [
  { id: 'Moon', name: '달', body: 'Moon' },
  { id: 'Mercury', name: '수성', body: 'Mercury' },
  { id: 'Venus', name: '금성', body: 'Venus' },
  { id: 'Mars', name: '화성', body: 'Mars' },
  { id: 'Jupiter', name: '목성', body: 'Jupiter' },
  { id: 'Saturn', name: '토성', body: 'Saturn' },
  { id: 'Uranus', name: '천왕성', body: 'Uranus' },
  { id: 'Neptune', name: '해왕성', body: 'Neptune' },
  { id: 'Pluto', name: '명왕성', body: 'Pluto' },
  // 위성: 위치는 모행성으로 계산 (모행성에서 수십만 km 안)
  { id: 'Phobos', name: '포보스 (화성 위성)', body: 'Mars', note: '화성에서 6,000 km 위' },
  { id: 'Io', name: '이오 (목성 위성)', body: 'Jupiter', note: '태양계에서 화산이 가장 많은 곳' },
  { id: 'Europa', name: '유로파 (목성 위성)', body: 'Jupiter', note: '얼음 아래 바다' },
  { id: 'Titan', name: '타이탄 (토성 위성)', body: 'Saturn', note: '메탄 호수가 있는 위성' },
  { id: 'Enceladus', name: '엔셀라두스 (토성 위성)', body: 'Saturn', note: '남극에서 물을 뿜어요' },
  { id: 'Triton', name: '트리톤 (해왕성 위성)', body: 'Neptune', note: '거꾸로 도는 위성' },
];

// 탐사선 곁: 지금 위치 (NASA JPL Horizons 2026년 기준 근삿값, 적도 좌표·AU)
export const PROBES = [
  { id: 'voyager1', name: '보이저 1호 곁', ra: 258.0, dec: 12.1, distAU: 168, note: '1977년 출발, 성간 공간' },
  { id: 'voyager2', name: '보이저 2호 곁', ra: 301.0, dec: -59.0, distAU: 140, note: '1977년 출발, 성간 공간' },
  { id: 'pioneer10', name: '파이어니어 10호 곁', ra: 76.0, dec: 26.0, distAU: 137, note: '2003년 이후 침묵' },
  { id: 'newhorizons', name: '뉴허라이즌스 곁', ra: 298.5, dec: -20.5, distAU: 63, note: '2015년 명왕성을 지났어요' },
];

// 별·외계행성: J2000 좌표(도), 거리(pc). Gaia DR3 시차 기반 (Bailer-Jones et al. 2021), 외계행성은 NASA Exoplanet Archive.
export const STARS = [
  { id: 'proxima', name: '프록시마 센타우리 b', ra: 217.4289, dec: -62.6795, distPc: 1.3012, note: '가장 가까운 별의 행성' },
  { id: 'alphacen', name: '알파 센타우리', ra: 219.9009, dec: -60.8340, distPc: 1.3380, note: '가장 가까운 밝은 별' },
  { id: 'barnard', name: "바너드 별", ra: 269.4521, dec: 4.6933, distPc: 1.8282, note: '하늘에서 가장 빨리 움직이는 별' },
  { id: 'sirius', name: '시리우스', ra: 101.2872, dec: -16.7161, distPc: 2.6371, note: '밤하늘에서 가장 밝은 별' },
  { id: 'trappist', name: 'TRAPPIST-1', ra: 346.6224, dec: -5.0414, distPc: 12.43, note: '지구 크기 행성 7개' },
  { id: 'vega', name: '베가 (직녀)', ra: 279.2347, dec: 38.7837, distPc: 7.68, note: '' },
  { id: 'altair', name: '알타이르 (견우)', ra: 297.6958, dec: 8.8683, distPc: 5.13, note: '' },
  { id: 'polaris', name: '북극성', ra: 37.9546, dec: 89.2641, distPc: 137, note: '' },
  { id: 'betelgeuse', name: '베텔게우스', ra: 88.7929, dec: 7.4071, distPc: 168, note: '언젠가 초신성이 될 별' },
  { id: 'kepler452', name: '케플러-452b', ra: 296.0039, dec: 44.2774, distPc: 554, note: '지구와 비슷한 궤도의 행성' },
  { id: 'wolf359', name: '울프 359', ra: 164.12, dec: 7.015, distPc: 2.409, note: '어두운 붉은 별' },
  { id: 'lalande', name: '라란드 21185', ra: 165.83, dec: 35.97, distPc: 2.55, note: '행성 둘이 있는 붉은 별' },
  { id: 'luyten', name: '루이텐 b', ra: 111.85, dec: 5.226, distPc: 3.79, note: '생명 거주 가능 영역의 행성' },
  { id: 'ross128', name: '로스 128 b', ra: 176.93, dec: 0.804, distPc: 3.37, note: '조용한 붉은 별의 행성' },
  { id: 'epseri', name: '엡실론 에리다니', ra: 53.23, dec: -9.458, distPc: 3.22, note: '젊은 별, 먼지 원반' },
  { id: 'tauceti', name: '타우 세티', ra: 26.02, dec: -15.94, distPc: 3.65, note: '태양을 닮은 별' },
  { id: 'teegarden', name: '티가든 별 b', ra: 43.25, dec: 16.88, distPc: 3.83, note: '지구 크기 행성' },
  { id: 'gl1061', name: '글리제 1061 d', ra: 53.99, dec: -44.51, distPc: 3.67, note: '' },
  { id: '40eri', name: '40 에리다니 A', ra: 63.82, dec: -7.653, distPc: 5.04, note: '벌컨의 별' },
  { id: 'gl581', name: '글리제 581', ra: 229.86, dec: -7.722, distPc: 6.30, note: '' },
  { id: 'gl667', name: '글리제 667 Cc', ra: 259.74, dec: -34.99, distPc: 7.24, note: '세 별이 뜨는 하늘' },
  { id: 'fomalhaut', name: '포말하우트', ra: 344.41, dec: -29.62, distPc: 7.70, note: '먼지 고리가 있는 별' },
  { id: 'arcturus', name: '아크투루스', ra: 213.92, dec: 19.18, distPc: 11.26, note: '북쪽 하늘에서 가장 밝은 별' },
  { id: '55cnc', name: '55 게자리 e', ra: 133.15, dec: 28.33, distPc: 12.6, note: '용암 행성' },
  { id: 'lhs1140', name: 'LHS 1140 b', ra: 11.25, dec: -15.27, distPc: 14.99, note: '물이 있을지 모르는 행성' },
  { id: 'hd189733', name: 'HD 189733 b', ra: 300.18, dec: 22.71, distPc: 19.8, note: '유리 비가 옆으로 내리는 행성' },
  { id: 'aldebaran', name: '알데바란', ra: 68.98, dec: 16.51, distPc: 20.4, note: '황소의 눈' },
  { id: 'toi700', name: 'TOI-700 d', ra: 97.10, dec: -65.58, distPc: 31.1, note: '' },
  { id: 'k218', name: 'K2-18 b', ra: 172.56, dec: 7.588, distPc: 38.1, note: '대기에서 수증기를 찾은 행성' },
  { id: 'pleiades', name: '플레이아데스', ra: 56.85, dec: 24.12, distPc: 136, note: '푸른 별 무리' },
  { id: 'antares', name: '안타레스', ra: 247.35, dec: -26.43, distPc: 170, note: '전갈의 심장' },
  { id: 'kepler186', name: '케플러-186f', ra: 298.65, dec: 43.955, distPc: 178, note: '처음 찾은 지구 크기의 거주 가능 행성' },
  { id: 'kepler22', name: '케플러-22b', ra: 289.22, dec: 47.88, distPc: 190, note: '' },
  { id: 'helix', name: '나선 성운', ra: 337.41, dec: -20.84, distPc: 200, note: '죽어 가는 별이 남긴 눈' },
  { id: 'rigel', name: '리겔', ra: 78.63, dec: -8.20, distPc: 264, note: '오리온의 발' },
  { id: 'orion', name: '오리온 성운', ra: 83.82, dec: -5.39, distPc: 412, note: '별이 태어나는 곳' },
  { id: 'wasp12', name: 'WASP-12b', ra: 97.64, dec: 29.67, distPc: 427, note: '별에 먹히고 있는 행성' },
  { id: 'psr1257', name: 'PSR B1257+12', ra: 195.01, dec: 12.68, distPc: 710, note: '펄서를 도는 행성들' },
  { id: 'deneb', name: '데네브', ra: 310.36, dec: 45.28, distPc: 802, note: '백조의 꼬리' },
  { id: 'crab', name: '게 성운', ra: 83.63, dec: 22.01, distPc: 2000, note: '1054년 초신성의 잔해' },
  { id: 'etacar', name: '에타 카리나이', ra: 161.27, dec: -59.68, distPc: 2300, note: '언제 터질지 모르는 별' },
];

// 다른 은하: 거리(kpc)
export const GALAXIES = [
  { id: 'lmc', name: '대마젤란은하', ra: 80.8942, dec: -69.7561, distPc: 49.6e3, note: '우리은하의 위성 은하' },
  { id: 'm31', name: '안드로메다 은하', ra: 10.6847, dec: 41.2688, distPc: 761e3, note: '약 45억 년 뒤 우리은하와 합쳐져요' },
  { id: 'smc', name: '소마젤란은하', ra: 13.19, dec: -72.83, distPc: 62.4e3, note: '' },
  { id: 'm33', name: '삼각형자리 은하', ra: 23.46, dec: 30.66, distPc: 840e3, note: '' },
  { id: 'cena', name: '센타우루스 A', ra: 201.37, dec: -43.02, distPc: 3.8e6, note: '거대 블랙홀이 제트를 뿜는 은하' },
  { id: 'm51', name: '소용돌이 은하', ra: 202.47, dec: 47.195, distPc: 7.0e6, note: '' },
];

// 탈것: 출발할 때 셋 중 하나. real: 실제 기록, 아니면 가상의 속도.
// 탈것. 속도는 실제 기록(보이저·파커)이거나 가상(빛의 20 %). 보급·전력·차폐가 항해 중 소모·고장의 바탕이 된다.
// foodDays: 정원 전원 기준 저장 식량 일수 (NASA 1.83 kg/인·일), waterDays: 비축 물 일수, recycle: 물 회수율 (ISS 2023: 98 %),
// o2Days: 비축 산소 일수 (산소 발생기가 멈췄을 때), power: solar | rtg | reactor, shield: 은하우주선 선량 배율 (물 20 g/cm² ≈ 0.65, Slaba 2017)
export const SHIPS = [
  { id: 'chem', name: '화학 로켓 캡슐', v: 17.0e3, crew: 1, foodDays: 3 * 365, waterDays: 240, recycle: 0.93, o2Days: 60, power: 'solar', shield: 1.0, eco: false,
    tag: '실제 속도', spec: '17 km/s · 혼자 · 식량 3년 · 태양 전지판 · 알루미늄 선체',
    desc: '보이저 1호가 지금 내는 속도. 혼자 타는 귀환 캡슐이에요. 전기는 햇빛에서 얻어요. 햇빛은 거리의 제곱으로 약해지니 태양에서 먼 곳이라면 생각해 보세요. 가볍고 단순해서 고칠 게 적고, 말할 사람은 없어요.' },
  { id: 'nuke', name: '핵전기 추진선', v: 191e3, crew: 4, foodDays: 5 * 365, waterDays: 180, recycle: 0.98, o2Days: 120, power: 'rtg', shield: 0.65, eco: false,
    tag: '속도는 실제 · 배는 설계안', spec: '191 km/s · 4명 · 식량 5년 · 동위원소 전지 · 물탱크 벽',
    desc: '파커 태양 탐사선이 2024년에 낸 인류 최고 속도. 플루토늄 전지는 햇빛이 없어도 되지만 해마다 조금씩 식어요. 물탱크 벽이 우주선(宇宙線)을 3분의 1 막아요.' },
  { id: 'sail', name: '광자 돛 항성선', v: 0.2 * c, crew: 6, foodDays: 2 * 365, waterDays: 120, recycle: 0.98, o2Days: 90, power: 'reactor', shield: 0.65, eco: true,
    tag: '가상', spec: '60,000 km/s · 6명 · 채소 재배 · 소형 원자로 · 물탱크 벽',
    desc: '브레이크스루 스타샷이 그램 단위 탐사체로 노리는 속도. 사람을 태운 배로는 아직 없어요. 빛에 가까워서 배 안의 시간이 느리게 가고, 앞에서 오는 먼지가 위험해요.' },
];
