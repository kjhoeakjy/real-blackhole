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
];

// 다른 은하: 거리(kpc)
export const GALAXIES = [
  { id: 'lmc', name: '대마젤란은하', ra: 80.8942, dec: -69.7561, distPc: 49.6e3, note: '우리은하의 위성 은하' },
  { id: 'm31', name: '안드로메다 은하', ra: 10.6847, dec: 41.2688, distPc: 761e3, note: '약 45억 년 뒤 우리은하와 합쳐져요' },
];

// 탈것. real: 실제 기록, 아니면 가상의 속도.
export const SHIPS = [
  { id: 'apollo', name: '아폴로', v: 10.8e3, real: true, note: '1969년, 달로 가던 속도 10.8 km/s' },
  { id: 'voyager', name: '보이저 1호', v: 17.0e3, real: true, note: '1977년 발사, 지금 태양계 밖 17 km/s' },
  { id: 'parker', name: '파커 태양 탐사선', v: 191e3, real: true, note: '2024-12-24, 인류가 만든 가장 빠른 물체 191 km/s' },
  { id: 'c01', name: '빛의 1 %', v: 0.01 * c, real: false, note: '가상. 핵융합 로켓 구상의 상한 근처' },
  { id: 'c10', name: '빛의 10 %', v: 0.1 * c, real: false, note: '가상' },
  { id: 'c20', name: '빛의 20 %', v: 0.2 * c, real: false, note: '가상. 브레이크스루 스타샷의 목표 (그램 단위 탐사체)' },
  { id: 'c50', name: '빛의 50 %', v: 0.5 * c, real: false, note: '가상' },
  { id: 'c90', name: '빛의 90 %', v: 0.9 * c, real: false, note: '가상' },
  { id: 'c999', name: '빛의 99.9 %', v: 0.999 * c, real: false, note: '가상. 시간 지연이 뚜렷해요' },
];
