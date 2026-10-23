// 귀환길의 실제 위험과 선택지. 각 선택은 시간(timeFrac: 비율, timeAbs: 초)·피폭(dose, Sv)·생존 계수(p)를 바꾼다.
// 수치 출처는 각 항목의 src 에.
import { AU, DAY, YEAR } from '../physics/constants.js';

// 1972년 8월급 태양 양성자 사건: 태양 주기(11년)당 1~2회 → 연 0.15회. 얇은 벽(알루미늄 1 g/cm²) 뒤 선량 ≈ 1~4 Sv (Townsend et al. 2006), 폭풍 대피실(물 20 cm) 뒤 ≈ 0.1 Sv 미만.
const SPE_RATE_PER_YEAR = 0.15;

// plan: { from, tauYears(여행자 시계 년), startAU(태양에서 출발지까지 AU, 태양계 안이면), beta }
export function buildHazards(plan) {
  const ev = [];
  const f = plan.from;
  const inSolar = f.kind === 'solar';
  const rAU = inSolar ? plan.startAU : null;

  // 목성에서 출발: 방사선대
  if (inSolar && f.id === 'Jupiter') {
    ev.push({
      id: 'jupiter-belt', title: '목성의 방사선대', cls: 'danger',
      desc: '목성 둘레에는 지구의 밴앨런대보다 수천 배 센 방사선대가 있어요. 유로파 궤도에서는 하루에 5.4 Sv, 칼리스토 궤도에서는 하루 0.0001 Sv 를 받아요.',
      src: 'NASA Europa Clipper 방사선 환경; Galileo EPD',
      options: [
        { label: '칼리스토 궤도에서 출발', fx: '피폭 거의 없음', dose: 0.0005 },
        { label: '유로파 궤도에서 출발', fx: '벗어나는 4시간 동안 +0.9 Sv', dose: 0.9 },
      ],
    });
  }
  // 바깥 행성에서 지구로: 목성 곁을 지나는 중력 도움
  if (inSolar && ['Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(f.id) && plan.beta < 0.01) {
    ev.push({
      id: 'jupiter-flyby', title: '목성 곁을 지날까요', cls: '',
      desc: '보이저·뉴허라이즌스처럼 목성 중력으로 속도를 얻으면 더 빨리 도착하지만, 방사선대를 몇 시간 지나요.',
      src: 'New Horizons 2007 목성 통과: +4 km/s; Juno 방사선 측정',
      options: [
        { label: '멀리 돌아간다', fx: '시간 +5 %', timeFrac: 0.05 },
        { label: '목성 중력 도움', fx: '시간 −20 %, +0.8 Sv', timeFrac: -0.2, dose: 0.8 },
      ],
    });
  }
  // 소행성대 통과 (출발지가 3.3 AU 바깥이면)
  if (inSolar && rAU > 3.3) {
    ev.push({
      id: 'belt', title: '소행성대', cls: 'ok',
      desc: '화성과 목성 사이의 소행성대는 영화와 달리 거의 비어 있어요. 탐사선이 뭔가에 부딪힐 확률은 10억분의 1 아래예요.',
      src: 'NASA/JPL: 소행성대 통과 탐사선 충돌 확률 < 1/10⁹',
      options: [
        { label: '그냥 통과', fx: '위험 10억분의 1', p: 1 - 1e-9 },
        { label: '위로 돌아간다', fx: '시간 +8 %', timeFrac: 0.08 },
      ],
    });
  }
  // 태양 폭풍: 모든 길 (태양에 가까울수록 자주·세게, ∝ 1/r²)
  {
    const scale = rAU != null && rAU < 1 ? Math.min(10, 1 / (rAU * rAU)) : 1;
    const n = SPE_RATE_PER_YEAR * scale * plan.tauYears;
    const nText = n < 0.01 ? `${(n * 100).toFixed(1)} %` : n < 1 ? `${Math.round(n * 100)} %` : `약 ${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString('en-US')}회`;
    ev.push({
      id: 'spe', title: '태양 폭풍', cls: n > 0.3 ? 'danger' : '',
      desc: `1972년 8월 규모의 태양 양성자 폭풍은 태양 주기마다 한두 번 와요 (아폴로 16호와 17호 사이에 일어났어요). 이 여행 동안 만날 가능성 ${nText}. 얇은 벽 뒤에서 맞으면 1 Sv 넘게 받고, 물탱크 뒤 대피실에서는 0.1 Sv 아래예요.`,
      src: 'Townsend et al. 2006 (1972년 사건 선량); NASA SRAG',
      options: [
        { label: '경보 오면 대피실로', fx: `사건마다 하루 대기, +0.1 Sv`, dose: 0.1 * n, timeAbs: n * DAY },
        { label: '그냥 간다', fx: `사건마다 +1.5 Sv`, dose: 1.5 * n },
      ],
    });
  }
  // 빠른 성간 항해: 앞에서 오는 성간 가스·먼지
  if (!inSolar && plan.beta >= 0.05) {
    ev.push({
      id: 'ism', title: '성간 먼지', cls: 'danger',
      desc: `빛의 ${Math.round(plan.beta * 100)} % 로 달리면 성간 가스·먼지가 앞면을 깎아내요. 빛의 20 % 로 4.2광년을 가면 가스만으로 약 1 mm 깊이가 닳고, 먼지 알갱이는 더 깊은 자국을 내요 (Hoang et al. 2017).`,
      src: 'Hoang, Lazarian, Burkhart & Loeb 2017, ApJ 837, 5',
      options: [
        { label: '앞에 방패판을 단다', fx: '무게 때문에 시간 +10 %', timeFrac: 0.1 },
        { label: '그대로 간다', fx: '구멍 날 위험 (거리·속도에 비례)', pFn: (p) => Math.exp(-0.25 * Math.pow(p.beta / 0.2, 2) * (p.distLy / 4.25)) },
      ],
    });
  }
  // 오래 머문 몸: 뼈·근육 (죽지는 않지만 귀환 뒤 회복)
  if (plan.tauYears > 0.4) {
    ev.push({
      id: 'bone', title: '무중력에 녹는 뼈', cls: '',
      desc: `무중력에서는 한 달에 뼈의 1~1.5 % 가 빠져요. ${Math.round(plan.tauYears * 12)}개월이면 착륙 때 일어서기도 어려워요.`,
      src: 'NASA Human Research Program; LeBlanc et al. 2000',
      options: [
        { label: '매일 2시간 운동', fx: 'ISS 방식, 손실 절반 이하' },
        { label: '안 한다', fx: '귀환 뒤 1년 재활 (생존엔 영향 없음)' },
      ],
    });
  }
  // 재진입 (선택 없음)
  ev.push({
    id: 'reentry', title: '지구 대기 재진입', cls: '', fixed: true,
    desc: '시속 4만 km 로 대기에 뛰어들어요. 우주왕복선의 마지막 위험 평가는 발사와 귀환을 합쳐 90번에 1번. 귀환 몫으로 180번에 1번을 둬요.',
    src: 'NASA Shuttle PRA (2011): 1/90',
    options: [{ label: '캡슐로 재진입', fx: '위험 1/180' }],
  });
  return ev;
}

// 선택 결과 합산
export function applyChoices(hazards, choices, ctxVals) {
  const m = { timeFrac: 0, timeAbs: 0, dose: 0, p: 1 };
  for (const h of hazards) {
    const o = h.options[choices[h.id] ?? 0];
    if (!o) continue;
    m.timeFrac += o.timeFrac || 0; m.timeAbs += o.timeAbs || 0; m.dose += o.dose || 0;
    if (o.p != null) m.p *= o.p;
    if (o.pFn) m.p *= o.pFn(ctxVals);
  }
  return m;
}
