// 귀환길의 실제 사건과 선택지. 각 선택은 시간(timeFrac: 비율, timeAbs: 초)·피폭(dose Sv, doseFactor)·생존 계수(p 또는 pFn)를 바꾼다.
// hint: 선택지의 힌트 버튼에 보이는 설명. 수치 출처는 각 사건의 src 에. "모형" 이라고 쓴 확률은 실제 통계가 없어 단순하게 둔 값이다.
import { AU, DAY, YEAR } from '../physics/constants.js';

// 1972년 8월급 태양 양성자 사건: 태양 주기(11년)당 1~2회 → 연 0.15회 (Townsend et al. 2006)
const SPE_RATE_PER_YEAR = 0.15;
const crewOf = (ch) => ({ 0: 1, 1: 3, 2: 6 })[ch.crew ?? 1] ?? 3;

// plan: { from, tauYears(여행자 시계 년), startAU(태양에서 출발지까지 AU, 태양계 안이면), beta, distLy }
// choices: 지금까지 고른 선택 { id: 번호 } — 앞의 선택에 따라 뒤의 사건·선택지가 달라진다
export function buildHazards(plan, choices = {}) {
  const ev = [];
  const f = plan.from;
  const inSolar = f.kind === 'solar';
  const rAU = inSolar ? plan.startAU : null;
  const T = plan.tauYears;
  const crew = crewOf(choices);
  const atR = (r) => inSolar && rAU > r ? Math.min(0.95, Math.max(0.05, (rAU - r) / (rAU - 1))) : 0.9;
  const yrs = (y) => y < 1 ? `${Math.round(y * 12)}개월` : `${Math.round(y).toLocaleString('en-US')}년`;

  // ---------- 출발 전 ----------
  ev.push({
    id: 'crew', title: '누구와 갈까요', cls: '', at: 0,
    desc: '사람이 많으면 고장을 고치고 서로를 돌볼 수 있지만, 먹고 마실 것이 그만큼 늘어요.',
    src: 'ISS 상주 인원 6~7명; 아폴로 3명; Mars-500 (2010–11) 6명 520일',
    options: [
      { label: '혼자 간다', fx: '짐이 가벼워 시간 −3 %', timeFrac: -0.03,
        hint: '아폴로 사령선 조종사도 혼자 있던 시간은 하루 안쪽이었어요. 고장은 혼자 고쳐야 하고, 아프면 봐줄 사람이 없어요. 뒤에 나오는 수리·치료 선택지가 줄어요.' },
      { label: '셋이서 간다', fx: '아폴로·소유즈 정원',
        hint: '아폴로와 소유즈가 세 명을 태웠어요. 한 사람은 의사 역할을 맡을 수 있어요.' },
      { label: '여섯이서 간다', fx: '식량·물 두 배, 시간 +8 %', timeFrac: 0.08,
        hint: 'ISS 상주 인원이에요. Mars-500 실험에서는 여섯 명이 520일을 갇혀 지냈고, 둘이 우울·수면 장애를 겪었어요. 사람이 많을수록 갈등 사건이 생겨요.' },
    ],
  });
  ev.push({
    id: 'pack', title: '벽을 어떻게 두를까요', cls: '', at: 0,
    desc: '우주 방사선은 두꺼운 물이 가장 잘 막아요. 물 20 cm 벽은 피폭을 약 3분의 1 줄이지만, 무거워서 느려져요.',
    src: 'Slaba et al. 2017 (물 20 g/cm² 차폐로 GCR 선량 ~30 % 감소); Zeitlin et al. 2013',
    options: [
      { label: '물탱크로 벽을 두른다', fx: '피폭 −35 %, 시간 +10 %', doseFactor: 0.65, timeFrac: 0.1,
        hint: '물은 수소가 많아서 같은 무게의 알루미늄보다 우주선을 잘 막아요. 마실 물과 벽을 겸해요. 선량이 반으로 줄진 않아요.' },
      { label: '기본 선체 (아폴로 수준)', fx: '그대로',
        hint: '알루미늄 몇 mm. 큐리오시티가 화성까지 가며 잰 하루 1.84 mSv 가 이 수준이에요. 1년이면 0.67 Sv, 지구에서 평생 받는 양의 몇 배예요.' },
      { label: '최대한 가볍게', fx: '시간 −5 %, 피폭 +10 %', doseFactor: 1.1, timeFrac: -0.05,
        hint: '얇은 벽은 2차 입자를 덜 만들지만 그만큼 그대로 맞아요. 짧은 여행이면 차이가 작아요.' },
    ],
  });
  ev.push({
    id: 'food', title: '먹을 것은 어떻게', cls: T > 3 ? 'danger' : '', at: 0,
    desc: `한 사람이 하루 먹는 우주식은 포장까지 약 1.8 kg. ${crew}명이 ${yrs(T)} 먹으면 ${fmtTon(1.8 * crew * T * 365.25)}이에요.`,
    src: 'NASA Human Integration Design Handbook (1.83 kg/인·일); ISS Veggie (2014–); BIOS-3 (1972, 3명 180일)',
    options: [
      { label: '저장 식량만 싣는다', fx: T > 3 ? '3년 넘으면 바닥나요' : '그대로',
        pFn: (p) => T <= 3 ? 1 : Math.exp(-(T - 3) / 2),
        hint: '화성 왕복(약 3년)까지는 저장 식량으로 돼요. 그보다 길면 양도 문제지만 비타민이 분해돼 괴혈병·시력 저하가 와요 (NASA 식품 보존 한계 3~5년).' },
      { label: '채소를 키우며 간다', fx: '시간 +5 %', timeFrac: 0.05,
        pFn: (p) => T <= 3 ? 1 : Math.exp(-0.01 * (T - 3)),
        hint: 'ISS 에서는 상추·고추를 길러 먹어요. 다만 사람 먹을 양을 전부 키운 기록은 BIOS-3 의 180일이 가장 길고, 수십 년 운영 기록은 없어요. 그 뒤로는 해마다 1 % 씩 실패하는 모형이에요.' },
      { label: '최소한만 싣고 배급한다', fx: '시간 −5 %', timeFrac: -0.05,
        pFn: (p) => T <= 0.5 ? 1 : Math.exp(-2 * (T - 0.5)),
        hint: '1944년 미네소타 기아 실험에서 하루 1,570 kcal 로 6개월을 버틴 사람들은 체중의 4분의 1을 잃었어요. 반년 넘게는 버티기 어려워요.' },
    ],
  });
  ev.push({
    id: 'water', title: '물은 어떻게', cls: '', at: 0,
    desc: `한 사람이 하루 약 3 L. ${crew}명이 ${yrs(T)} 쓰면 ${fmtTon(3 * crew * T * 365.25)}이에요.`,
    src: 'NASA ISS 물 재활용 98 % 달성 (2023); NASA HIDH 음용·식품 물 3 L/인·일',
    options: [
      { label: '재활용 장치를 단다', fx: '98 % 를 되돌려요',
        hint: 'ISS 는 2023년에 땀·오줌·숨의 98 % 를 다시 마실 물로 만들었어요. 대신 장치가 가끔 고장 나 예비 부품이 필요해요.' },
      { label: '전부 싣고 간다', fx: T > 2 ? '2년 넘으면 모자라요' : `무게로 시간 +${Math.round(Math.min(30, 5 * T))} %`, timeFrac: Math.min(0.3, 0.05 * T),
        pFn: (p) => T <= 2 ? 1 : Math.exp(-(T - 2)),
        hint: '아폴로 방식. 짧은 여행에는 가장 단순하고 고장 날 게 없어요. 길면 몇십 톤이 되고, 떨어지면 끝이에요.' },
    ],
  });
  ev.push({
    id: 'power', title: '전기는 어디서', cls: '', at: 0,
    desc: '공기·물·난방이 전부 전기예요. 꺼지면 며칠 안에 끝나요.',
    src: 'NASA RPS: 보이저 RTG 출력 매년 약 4 W 감소, Pu-238 반감기 87.7년; Kilopower KRUSTY 지상 시험 2018',
    options: [
      { label: '태양 전지판', fx: inSolar && rAU < 5 ? '그대로' : '햇빛이 모자라요',
        pFn: (p) => inSolar && rAU < 5 ? 1 : 0.05,
        hint: '햇빛은 거리의 제곱으로 약해져요. 목성(5.2 AU)에서는 지구의 4 %, 해왕성에서는 0.1 %. 주노는 목성에서 거대한 판으로 겨우 400 W 를 얻었어요. 별에서 출발하면 햇빛 자체가 없어요.' },
      { label: '방사성 동위원소 전지 (보이저 방식)', fx: T > 40 ? '40년 뒤엔 반도 안 남아요' : '그대로',
        pFn: (p) => T <= 40 ? 1 : Math.exp(-(T - 40) / 30),
        hint: '플루토늄-238 이 식으며 내는 열로 전기를 만들어요. 보이저는 1977년 470 W 로 출발해 지금은 200 W 대, 장비를 하나씩 끄고 있어요.' },
      { label: '소형 원자로 (지상 시험만 마침)', fx: '피폭 +0.05 Sv/년', dose: 0.05 * T,
        pFn: (p) => T <= 15 ? 1 : Math.exp(-(T - 15) / 15),
        hint: 'NASA 킬로파워는 2018년 지상에서 10 kW 급을 시험했지만 우주에 띄운 적은 없어요. 설계 수명 10년 이상. 가까이 두면 피폭이 조금 늘어요.' },
    ],
  });

  // ---------- 가는 길 ----------
  if (inSolar && f.id === 'Jupiter') {
    ev.push({
      id: 'jupiter-belt', title: '목성의 방사선대', cls: 'danger', at: 0.02,
      desc: '목성 둘레에는 지구의 밴앨런대보다 수천 배 센 방사선대가 있어요. 유로파 궤도에서는 하루에 5.4 Sv 를 받아요.',
      src: 'NASA Europa Clipper 방사선 환경; Galileo EPD',
      options: [
        { label: '칼리스토 궤도에서 출발', fx: '피폭 거의 없음', dose: 0.0005, hint: '칼리스토는 목성에서 멀어 하루 0.0001 Sv. 그래서 NASA 유인 목성 탐사 구상(2003)도 칼리스토를 골랐어요.' },
        { label: '유로파 궤도에서 출발', fx: '벗어나는 4시간 동안 +0.9 Sv', dose: 0.9, hint: '유로파 궤도는 하루 5.4 Sv. 4시간만 있어도 0.9 Sv, 급성 방사선 증후군이 시작되는 양이에요.' },
      ],
    });
  }
  if (inSolar && ['Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(f.id) && plan.beta < 0.01) {
    ev.push({
      id: 'jupiter-flyby', title: '목성 곁을 지날까요', cls: '', at: atR(5.2),
      desc: '보이저·뉴허라이즌스처럼 목성 중력으로 속도를 얻으면 더 빨리 도착하지만, 방사선대를 몇 시간 지나요.',
      src: 'New Horizons 2007 목성 통과: +4 km/s; Juno 방사선 측정',
      options: [
        { label: '멀리 돌아간다', fx: '시간 +5 %', timeFrac: 0.05, hint: '목성에서 수천만 km 떨어져 지나면 방사선은 없지만 속도도 못 얻어요.' },
        { label: '목성 중력 도움', fx: '시간 −20 %, +0.8 Sv', timeFrac: -0.2, dose: 0.8, hint: '뉴허라이즌스는 2007년 목성을 230만 km 거리로 지나며 4 km/s 를 얻어 명왕성까지 3년을 줄였어요. 사람이 타면 방사선대 바깥을 스쳐도 0.8 Sv 쯤 받아요.' },
      ],
    });
  }
  if (inSolar && rAU > 3.3) {
    ev.push({
      id: 'belt', title: '소행성대', cls: 'ok', at: atR(2.8),
      desc: '화성과 목성 사이의 소행성대는 영화와 달리 거의 비어 있어요. 탐사선이 뭔가에 부딪힐 확률은 10억분의 1 아래예요.',
      src: 'NASA/JPL: 소행성대 통과 탐사선 충돌 확률 < 1/10⁹',
      options: [
        { label: '그냥 통과', fx: '위험 10억분의 1', p: 1 - 1e-9, hint: '소행성끼리도 평균 수백만 km 떨어져 있어요. 지금까지 열 대 넘는 탐사선이 아무 일 없이 지났어요.' },
        { label: '위로 돌아간다', fx: '시간 +8 %', timeFrac: 0.08, hint: '굳이 돌 필요는 없어요. 시간만 더 걸려요.' },
      ],
    });
  }
  ev.push({
    id: 'micro', title: '작은 돌이 날아와요', cls: '', at: 0.12,
    desc: '모래알만 한 미소유성체가 초속 수십 km 로 부딪혀요. ISS 는 10년 동안 관통당하지 않을 확률 90 % 로 설계됐어요.',
    src: 'NASA ISS MMOD 요구치 PNP ≈ 0.9/10년; Whipple 1947',
    options: [
      { label: '휘플 방패를 덧댄다', fx: '시간 +2 %', timeFrac: 0.02, hint: '얇은 판을 띄워 두 겹으로 만들면 돌이 첫 판에서 부서져 흩어져요. ISS 가 쓰는 방식이고, 큰 돌에는 소용없지만 그런 건 드물어요.' },
      { label: '그대로 간다', fx: `구멍 날 확률 연 1 % (${yrs(T)}이면 ${Math.round((1 - Math.exp(-0.0105 * T)) * 100)} %)`, pFn: () => Math.exp(-0.0105 * T), hint: 'ISS 설계 기준을 그대로 쓰면 1년에 약 1 %. 구멍이 나면 공기가 빠지는데, 2018년 소유즈 구멍(2 mm)은 테이프로 막았어요.' },
    ],
  });
  ev.push({
    id: 'fire', title: '연기 경보', cls: 'danger', at: 0.3,
    desc: '1997년 2월 미르에서는 산소 발생 카트리지에 불이 붙어 14분 동안 탔어요. 좁은 곳의 불은 몇 분 안에 공기를 망쳐요.',
    src: 'Mir 화재 1997-02-23 (NASA/Linenger 보고); ISS 비상 절차',
    options: [
      { label: '마스크 쓰고 소화기로 끈다', fx: '모형 · 위험 0.5 %', p: 0.995, hint: 'ISS 절차 그대로예요. 미르에서도 소화기 세 개로 껐어요. 다만 연기를 마실 수 있어요.' },
      { label: '그 칸을 닫고 공기를 뺀다', fx: '하루 손실, 위험 1 %', p: 0.99, timeAbs: DAY, hint: '공기가 없으면 불은 꺼져요. 대신 그 칸의 장비가 망가지고 복구에 시간이 걸려요.' },
      { label: '저절로 꺼지길 기다린다', fx: '모형 · 위험 10 %', p: 0.9, hint: '무중력에서 불꽃은 둥글고 느리지만 꺼지지 않아요. 미르 승무원들은 대피선 소유즈까지 길이 막혔었어요.' },
    ],
  });
  if (T > 0.1) {
    const fix = crew > 1 ? { label: '예비 부품으로 고친다', fx: '위험 1 %', p: 0.99, hint: '미르의 엘렉트론과 ISS 의 OGA 는 수없이 고장 났고 매번 승무원이 고쳤어요. 둘이면 한 명이 손전등을 들어요.' }
                         : { label: '혼자 뜯어 고친다', fx: '위험 5 %', p: 0.95, hint: '혼자서는 절차를 읽으며 동시에 고쳐야 해요. 지구 관제와 말이 오가는 데 몇 분에서 몇 년이 걸려요.' };
    ev.push({
      id: 'oxygen', title: '산소 발생기가 멈췄어요', cls: 'danger', at: 0.45,
      desc: '물을 전기로 쪼개 산소를 만드는 장치가 섰어요. 비축 산소로 며칠은 버텨요.',
      src: 'Mir Elektron 고장 기록 (1990년대); ISS OGA 정비 이력; SFOG(산소 카트리지) = 1997 미르 화재 원인',
      options: [
        fix,
        { label: '화학 산소통을 태운다', fx: '위험 3 %', p: 0.97, hint: '산소 카트리지(SFOG)는 한 통에 한 사람 하루치예요. 1997년 미르 화재가 이 카트리지에서 났어요.' },
        ...(choices.food === 1 ? [{ label: '키우는 식물의 산소로 버틴다', fx: '위험 2 %', p: 0.98, hint: '사람 하나의 산소를 대려면 잎 면적 수십 m² 가 필요해요. BIOS-3 는 그걸 해냈지만 아슬아슬했어요.' }] : []),
      ],
    });
  }
  if (T > 0.2) {
    const n = 0.06 * crew * T;   // 중증 의료 사건 기대 횟수
    const sev = (cure) => Math.exp(-n * (1 - cure));
    ev.push({
      id: 'medical', title: '누군가 쓰러졌어요', cls: n > 0.5 ? 'danger' : '', at: 0.55,
      desc: `NASA 의료 모형으로는 사람 한 명이 1년에 약 0.06번 급한 치료가 필요해요. 이 여행에서는 ${n < 1 ? `${Math.round(n * 100)} %` : `약 ${n.toFixed(1)}번`}.`,
      src: 'NASA Integrated Medical Model (Myers et al. 2018); 아폴로 13 요도 감염; 우주 치과·맹장 논의',
      options: [
        ...(crew > 1 ? [{ label: '동료 의사가 수술한다', fx: '사건당 생존 90 %', pFn: () => sev(0.9), hint: 'ISS 승무원 중 한 명은 응급 의료 훈련을 받아요. 무중력에서 수술은 아직 동물 실험 단계예요.' }] : []),
        { label: '지구와 원격 진료', fx: '사건당 생존 60 %', pFn: () => sev(0.6), hint: `지구와 말이 오가는 데 ${plan.distLy > 0.001 ? '몇 년' : '몇 분에서 몇 시간'}이 걸려요. 화성 거리면 왕복 40분, 목성이면 1시간 반.` },
        { label: '의료 키트와 설명서', fx: '사건당 생존 40 %', pFn: () => sev(0.4), hint: 'ISS 의료 키트는 약·주사기·봉합 도구 정도예요. 맹장염이면 항생제로 버텨요.' },
      ],
    });
  }
  if (crew > 1 && T > 0.3) {
    ev.push({
      id: 'conflict', title: '동료와 다퉜어요', cls: '', at: 0.62,
      desc: '좁은 곳에 오래 갇히면 넷째 분기쯤 갈등이 몰려요. 남극 월동 기지에서도 같은 일이 일어나요.',
      src: 'Mars-500 심리 결과 (Basner et al. 2014); 남극 "third-quarter phenomenon"; 스카이랩 4호 1973',
      options: [
        { label: '매일 같이 밥을 먹는다', fx: '모형 · 그대로', hint: '러시아 우주국이 미르 때부터 지켜온 규칙이에요. 작은 의식이 긴 고립을 버티게 해요.' },
        { label: '역할을 나누고 따로 지낸다', fx: '모형 · 위험 0.5 %', p: 0.995, hint: 'Mars-500 에서 효과가 있던 방법 중 하나예요. 다만 비상시 손발이 안 맞을 수 있어요.' },
        { label: '선장 권한으로 누른다', fx: '모형 · 위험 2 %', p: 0.98, hint: '1973년 스카이랩 4호 승무원은 과한 일정에 하루 통신을 끊었어요. 억누르면 비상시 협력이 깨져요.' },
      ],
    });
  }
  if (crew === 1 && T > 0.3) {
    ev.push({
      id: 'lonely', title: '아무도 없는 시간', cls: '', at: 0.62,
      desc: `${yrs(T)} 동안 말할 사람이 없어요. 고립은 수면·집중력을 먼저 무너뜨려요.`,
      src: 'Mars-500 수면 연구 (Basner et al. 2013); NASA HERA 고립 실험',
      options: [
        { label: '지구와 매일 메시지를 주고받는다', fx: '모형 · 그대로', hint: `답장은 ${plan.distLy > 0.001 ? '몇 년 뒤에' : '몇 분에서 몇 시간 뒤에'} 와요. 그래도 ISS 승무원들이 가장 큰 힘이라고 꼽는 게 가족과의 통화예요.` },
        { label: '일과표를 지킨다', fx: '모형 · 그대로', hint: '남극 월동 대원들이 쓰는 방법이에요. 잠·운동·식사 시간을 고정해요.' },
        { label: '되는 대로 지낸다', fx: '모형 · 위험 3 %', p: 0.97, hint: 'Mars-500 에서 수면 리듬이 무너진 승무원은 반응 속도가 눈에 띄게 떨어졌어요. 비상 대응이 늦어져요.' },
      ],
    });
  }
  {
    const scale = rAU != null && rAU < 1 ? Math.min(10, 1 / (rAU * rAU)) : 1;
    const n = SPE_RATE_PER_YEAR * scale * T;
    const nText = n < 0.01 ? `${(n * 100).toFixed(1)} %` : n < 1 ? `${Math.round(n * 100)} %` : `약 ${n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString('en-US')}회`;
    ev.push({
      id: 'spe', title: '태양 폭풍 경보', cls: n > 0.3 ? 'danger' : '', at: inSolar ? 0.5 : 0.85,
      desc: `1972년 8월 규모의 태양 양성자 폭풍은 태양 주기마다 한두 번 와요 (아폴로 16호와 17호 사이에 일어났어요). 이 여행 동안 만날 가능성 ${nText}.`,
      src: 'Townsend et al. 2006 (1972년 사건 선량); NASA SRAG',
      options: [
        { label: '경보 오면 대피실로', fx: `사건마다 하루 대기, +0.1 Sv`, dose: 0.1 * n, timeAbs: n * DAY, hint: '물탱크나 식량을 둘러 만든 좁은 방이에요. 폭풍은 하루 이틀이면 지나가요. 경보는 태양 관측 위성이 수십 분 전에 줘요.' },
        { label: '그냥 간다', fx: `사건마다 +1.5 Sv`, dose: 1.5 * n, hint: '얇은 벽 뒤에서 1972년 폭풍을 맞으면 1~4 Sv. 2 Sv 부터 구토·탈모, 4 Sv 면 치료 없이는 절반이 죽어요.' },
      ],
    });
  }
  if (!inSolar && plan.beta >= 0.05) {
    ev.push({
      id: 'ism', title: '성간 먼지', cls: 'danger', at: 0.25,
      desc: `빛의 ${Math.round(plan.beta * 100)} % 로 달리면 성간 가스·먼지가 앞면을 깎아내요. 빛의 20 % 로 4.2광년을 가면 가스만으로 약 1 mm 가 닳고, 먼지 알갱이는 더 깊은 자국을 내요.`,
      src: 'Hoang, Lazarian, Burkhart & Loeb 2017, ApJ 837, 5',
      options: [
        { label: '앞에 방패판을 단다', fx: '무게 때문에 시간 +10 %', timeFrac: 0.1, hint: '브레이크스루 스타샷이 검토한 방법이에요. 흑연이나 베릴륨 판을 몇 mm 두르면 가스는 막지만 큰 먼지는 못 막아요.' },
        { label: '그대로 간다', fx: '구멍 날 위험 (거리·속도에 비례)', pFn: (p) => Math.exp(-0.25 * Math.pow(p.beta / 0.2, 2) * (p.distLy / 4.25)), hint: '빛의 20 % 에서 모래알 하나는 수류탄만 한 에너지예요. 거리가 길수록 만날 확률이 늘어요.' },
      ],
    });
  }
  if (T > 0.4) {
    ev.push({
      id: 'bone', title: '무중력에 녹는 뼈', cls: '', at: 0.8,
      desc: `무중력에서는 한 달에 뼈의 1~1.5 % 가 빠져요. ${Math.round(T * 12).toLocaleString('en-US')}개월이면 착륙 때 일어서기도 어려워요.`,
      src: 'NASA Human Research Program; LeBlanc et al. 2000',
      options: [
        { label: '매일 2시간 운동', fx: 'ISS 방식, 손실 절반 이하', hint: 'ISS 승무원은 러닝머신·자전거·저항 운동기구로 하루 2시간을 써요. 그래도 1년 뒤 뼈가 다 돌아오진 않아요.' },
        { label: '안 한다', fx: '귀환 뒤 1년 재활 (생존엔 영향 없음)', hint: '1년 넘게 머문 우주인은 들것에 실려 나와요. 죽지는 않지만 착륙 충격에 뼈가 부러질 수 있어요.' },
      ],
    });
  }
  ev.push({
    id: 'nav', title: '지구 귀환 통로', cls: '', at: 0.95,
    desc: '대기에 들어가는 각도가 너무 얕으면 튕겨 나가고, 깊으면 타요. 아폴로의 통로는 폭 약 40 km 였어요.',
    src: 'Apollo entry corridor ±1° (NASA); 아폴로 중간 궤도 보정 최대 4회',
    options: [
      { label: '연료를 남겨 세 번 보정한다', fx: '그대로', hint: '아폴로는 지구로 오며 최대 네 번 궤도를 다듬었어요. 마지막 보정은 재진입 몇 시간 전이에요.' },
      { label: '한 번에 맞춘다', fx: '시간 −1 %, 위험 10 % (모형)', timeFrac: -0.01, p: 0.9, hint: '먼 데서 한 번 쏘면 오차가 쌓여요. 보이저가 매년 궤도를 다듬는 이유예요.' },
    ],
  });
  ev.push({
    id: 'reentry', title: '지구 대기 재진입', cls: '', at: 1,
    desc: '시속 4만 km 로 대기에 뛰어들어요. 우주왕복선의 마지막 위험 평가는 발사와 귀환을 합쳐 90번에 1번. 귀환 몫으로 180번에 1번을 둬요.',
    src: 'NASA Shuttle PRA (2011): 1/90',
    options: [{ label: '캡슐로 뛰어든다', fx: '위험 1/180', hint: '열 방패가 1,600 °C 를 견뎌요. 소유즈·드래곤·오리온 전부 같은 방식이에요.' }],
  });
  ev.sort((a, b) => a.at - b.at);
  return ev;
}

function fmtTon(kg) { const t = kg / 1000; return kg < 1000 ? `${Math.round(kg).toLocaleString('en-US')} kg` : t < 100 ? `${t.toPrecision(3).replace(/\.?0+$/, '')} t` : `${Math.round(t).toLocaleString('en-US')} t`; }

// 선택 결과 합산
export function applyChoices(hazards, choices, ctxVals) {
  const m = { timeFrac: 0, timeAbs: 0, dose: 0, p: 1, doseFactor: 1 };
  for (const h of hazards) {
    if (choices[h.id] == null) continue;      // 아직 안 고른 사건은 셈에 넣지 않는다
    const o = h.options[choices[h.id]];
    if (!o) continue;
    m.timeFrac += o.timeFrac || 0; m.timeAbs += o.timeAbs || 0; m.dose += o.dose || 0; m.doseFactor *= o.doseFactor ?? 1;
    if (o.p != null) m.p *= o.p;
    if (o.pFn) m.p *= o.pFn(ctxVals, choices);
  }
  return m;
}
