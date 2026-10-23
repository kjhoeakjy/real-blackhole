// 블랙홀 카탈로그. 측정값은 data/blackholes.json(출처 포함)에서 읽고, 여기서는 화면에 필요한 보조 정보만 덧붙인다.
// renderSpin: 스핀이 측정되지 않은 천체에 렌더링용으로 쓰는 값. 표시할 때 '가정'임을 반드시 밝힌다.
// renderInc: 원반(또는 제트·궤도) 축과 시선 사이 각도(도). 측정 경사각이 있으면 그것을 쓴다.
export const RENDER = {
  'sgr-a-star':  { group: 'smbh', order: 1, renderSpin: 0.5,  spinAssumed: true,  renderInc: 30, incNote: 'EHT 모델 선호 i<50° (가정 30°)', disk: 'riaf' },
  'm87-star':    { group: 'smbh', order: 2, renderSpin: 0.9,  spinAssumed: true,  renderInc: 17, incNote: '제트 시선각 17°±2° (Walker 2018)', disk: 'riaf', jet: true },
  'm31-star':    { group: 'smbh', order: 3, renderSpin: 0.5,  spinAssumed: true,  renderInc: 77, incNote: '은하 원반 경사 77° (가정: 원반 정렬)', disk: 'riaf' },
  'ton-618':     { group: 'smbh', order: 4, renderSpin: 0.9,  spinAssumed: true,  renderInc: 45, incNote: '측정 없음 (가정 45°)', disk: 'bright', eddington: 0.07 },
  'holm-15a':    { group: 'smbh', order: 5, renderSpin: 0.5,  spinAssumed: true,  renderInc: 60, incNote: '측정 없음 (가정 60°)', disk: 'none' },
  'cosmic-horseshoe': { group: 'smbh', order: 6, renderSpin: 0.5, spinAssumed: true, renderInc: 60, incNote: '측정 없음 (가정 60°)', disk: 'none' },
  'cyg-x-1':     { group: 'stellar', order: 1, renderInc: 27.51, incNote: '궤도 경사 27.51° (Miller-Jones 2021)', disk: 'bright' },
  'v404-cyg':    { group: 'stellar', order: 2, renderSpin: 0.92, spinAssumed: true, renderInc: 67, incNote: '궤도 경사 67°', disk: 'faint' },
  'a0620-00':    { group: 'stellar', order: 3, renderInc: 51, incNote: '궤도 경사 51.0°', disk: 'faint' },
  'grs-1915':    { group: 'stellar', order: 4, renderInc: 60, incNote: '제트 경사 60°±5°', disk: 'bright' },
  'maxi-j1820':  { group: 'stellar', order: 5, renderInc: 63, incNote: '제트 경사 63°±3°', disk: 'faint' },
  'gaia-bh1':    { group: 'stellar', order: 6, renderSpin: 0, spinAssumed: true, renderInc: 126.6, incNote: '궤도 경사 126.6°', disk: 'none' },
  'gaia-bh2':    { group: 'stellar', order: 7, renderSpin: 0, spinAssumed: true, renderInc: 34.87, incNote: '궤도 경사 34.87°', disk: 'none' },
  'gaia-bh3':    { group: 'stellar', order: 8, renderSpin: 0, spinAssumed: true, renderInc: 110.6, incNote: '궤도 경사 110.6°', disk: 'none' },
  'omega-cen-imbh': { group: 'stellar', order: 9, renderSpin: 0, spinAssumed: true, renderInc: 60, incNote: '측정 없음', disk: 'none', massForRender: 40000, massNote: '하한 8,200 M☉, 모델은 수만 M☉ 선호 → 4만 M☉ 가정' },
  'gw150914':    { group: 'gw', order: 1, renderInc: 45, incNote: '병합 잔해: 원반 없음', disk: 'none' },
  'gw190521':    { group: 'gw', order: 2, renderInc: 45, incNote: '병합 잔해: 원반 없음', disk: 'none' },
  'gw231123':    { group: 'gw', order: 3, renderInc: 45, incNote: '병합 잔해: 원반 없음', disk: 'none' },
  'gw250114':    { group: 'gw', order: 4, renderInc: 45, incNote: '병합 잔해: 원반 없음', disk: 'none' },
};

// 별명·짧은 이름
export const SHORT = {
  'sgr-a-star': '궁수자리 A*', 'm87-star': 'M87*', 'm31-star': 'M31*', 'ton-618': 'TON 618', 'holm-15a': '홀름베르크 15A*',
  'cosmic-horseshoe': '코즈믹 호스슈', 'cyg-x-1': '백조자리 X-1', 'v404-cyg': 'V404 Cyg', 'a0620-00': 'A0620-00',
  'grs-1915': 'GRS 1915+105', 'maxi-j1820': 'MAXI J1820+070', 'gaia-bh1': '가이아 BH1', 'gaia-bh2': '가이아 BH2', 'gaia-bh3': '가이아 BH3',
  'omega-cen-imbh': 'ω Cen 중간질량', 'gw150914': 'GW150914 잔해', 'gw190521': 'GW190521 잔해', 'gw231123': 'GW231123 잔해', 'gw250114': 'GW250114 잔해',
};

export const GROUP_LABEL = { smbh: '초대질량', stellar: '항성질량 · 중간질량', gw: '중력파 병합 잔해' };

export async function loadCatalog(url = 'data/blackholes.json') {
  const raw = await (await fetch(url)).json();
  const list = [];
  for (const e of raw) {
    const r = RENDER[e.id];
    if (!r) continue;
    const mass = e.mass ?? r.massForRender;
    if (!mass) continue;
    const spinMeasured = e.spin != null;
    const spin = spinMeasured ? e.spin : (r.renderSpin ?? 0);
    const distPc = e.distance_kpc != null ? e.distance_kpc * 1e3 : (e.distance_mpc ?? e.luminosity_distance_mpc) != null ? (e.distance_mpc ?? e.luminosity_distance_mpc) * 1e6 : null;
    list.push({
      id: e.id, name: e.name, nameKo: e.name_ko, short: SHORT[e.id] || e.name_ko || e.name, group: r.group, order: r.order,
      type: e.type, mass, massErrPlus: e.mass_err_plus, massErrMinus: e.mass_err_minus, massNote: e.mass_note, massAssumed: e.mass == null,
      spin, spinMeasured, spinAssumed: !spinMeasured, spinNote: e.spin_note, spinMethod: e.spin_method,
      distPc, distNote: e.distance_note, redshift: e.redshift,
      ra: e.ra_deg, dec: e.dec_deg, raStr: e.ra, decStr: e.dec, coordRef: e.coord_ref,
      inc: e.inclination_deg ?? r.renderInc, incNote: r.incNote, incMeasured: e.inclination_deg != null,
      state: e.accretion_state, eddington: e.eddington_ratio ?? r.eddington ?? null, lumNote: e.luminosity_note,
      companion: e.companion, discovery: e.discovery_year, fact: e.fact_ko || e.fact, refs: e.refs,
      disk: r.disk, jet: !!r.jet, renderNote: r.massNote,
    });
  }
  list.sort((a, b) => (a.group === b.group ? a.order - b.order : ['smbh', 'stellar', 'gw'].indexOf(a.group) - ['smbh', 'stellar', 'gw'].indexOf(b.group)));
  return list;
}
