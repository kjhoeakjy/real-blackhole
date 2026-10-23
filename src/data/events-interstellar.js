// 시공간이 뒤틀리는 시나리오: 웜홀, 시간이 느리게 가는 행성, 거대 블랙홀, 되풀이되는 하루, 미래에서 온 신호.
// 전부 상상이고 src 에 '시나리오'라고 적는다. 효과 키: jump(남은 거리 비율, 음수면 멀어짐), earthExtra(지구 시계만 흐른 시간 s), hints(힌트 추가).
import { AU, DAY, YEAR, LY } from '../physics/constants.js';
import { R, chance, U, pick, SF, IMAGINE, who, him } from './ev-util.js';

const far = (v) => v.from.kind !== 'solar';
const many = (v) => v.s.crewAlive > 1;
const yrs = (y) => `${Math.round(y)}년`;

export const INTERSTELLAR_EVENTS = [
  {
    id: 'wormhole', cat: 'bh', title: '항로 앞에 웜홀이 있어요', fx: 'warp',
    desc: (v) => '항로 앞에 완벽한 구 하나. 안에 반대쪽 하늘이 둥글게 비쳐요. 레이더엔 지름 10 km. 누가 두고 간 것처럼 정확히 항로 위에 있어요.',
    src: SF('인터스텔라 (2014)') + ' · 웜홀은 이론(Morris–Thorne 1988)일 뿐 관측된 적 없어요',
    when: (v) => far(v) && v.s.f > 0.1 && v.s.f < 0.9 && !v.s.flags.wormhole, rate: (v) => 0.25,
    options: [
      { label: '들어간다', hint: '어디로 나올지 몰라요. 지구 쪽일 수도, 아닐 수도.', go: (v) => { const r = R(); if (r < 0.55) return { text: '배가 길게 늘어났다가 돌아왔어요. 몇 초. 창밖 별자리가 전부 달라졌고, 태양이 앞쪽에서 밝게 빛나요. 남은 길의 대부분이 사라졌어요.', jump: 0.8, morale: 0.3, flag: 'wormhole', fx: 'warp' }; if (r < 0.8) return { text: `나왔어요. 지구는 가까워졌는데 지구 시계가 ${yrs(U(8, 30))} 앞서 있어요. 안에서는 몇 초였어요.`, jump: 0.5, earthExtra: U(8, 30) * YEAR, flag: 'wormhole', fx: 'warp' }; if (r < 0.95) return { text: '나와 보니 아무 별도 모르는 하늘이었어요. 항법 컴퓨터가 사흘 걸려 위치를 찾았어요. 더 멀어졌어요.', jump: -0.6, morale: -0.2, flag: 'wormhole', fx: 'dim' }; return { death: '구 안으로 들어간 뒤 배의 신호는 어디에서도 다시 잡히지 않았어요.' }; } },
      { label: '탐사체만 보낸다', hint: '소형 탐사체 하나. 돌아오면 안을 알 수 있어요.', go: (v) => chance(0.6) ? { text: '탐사체가 한 시간 뒤 돌아왔어요. 카메라엔 낯선 별들과, 아주 가까운 파란 점 하나. 지구 같았어요. 들어가기로 했어요.', jump: 0.7, delay: DAY, flag: 'wormhole', fx: 'warp' } : { text: '탐사체는 돌아오지 않았어요. 구는 이틀 뒤 사라졌어요.', flag: 'wormhole', delay: 2 * DAY } },
      { label: '비켜 간다', hint: '', go: (v) => ({ text: '구를 돌아 지나갔어요. 뒤에서 보니 구 안에 우리 배가 비쳐 있었어요. 우리는 손을 흔들지 않았어요.', flag: 'wormhole', morale: -0.03 }) },
    ],
  },
  {
    id: 'miller', cat: 'bh', title: '블랙홀 곁의 물 행성', fx: 'dim',
    desc: (v) => '거대 블랙홀 곁을 도는 행성. 얕은 바다가 끝없이 펼쳐지고 물이 있어요. 블랙홀 중력 때문에 이 행성의 한 시간은 바깥의 7년이에요.',
    src: SF('인터스텔라 (2014)') + ' · 중력 시간 지연은 실제(GPS 보정), 이 정도 비율은 블랙홀 바로 곁에서만',
    when: (v) => far(v) && v.s.water < 200 && !v.s.flags.miller, rate: (v) => 0.15,
    options: [
      { label: '내려가서 물을 채운다', hint: '탱크 가득 채우는 데 두 시간. 바깥에선 14년.', go: (v) => chance(0.7) ? { text: '무릎까지 오는 바다. 탱크를 채우고 올라오니 배에 남은 사람은 14년을 기다렸대요. 지구 시계도 그만큼 갔어요.', water: 400, earthExtra: 14 * YEAR, morale: -0.1, flag: 'miller' } : { text: '지평선에서 산 같은 파도가 왔어요. 착륙선이 뒤집혔고, 탱크 절반만 채운 채 떠올랐어요. 바깥에선 23년.', water: 150, earthExtra: 23 * YEAR, hull: -0.1, morale: -0.2, flag: 'miller', fx: 'dim' } },
      { label: '궤도에서 얼음 조각만 건진다', hint: '행성 고리에 얼음이 있어요. 시간 지연은 훨씬 작아요.', go: (v) => ({ text: '고리에서 얼음을 열 덩이 건졌어요. 바깥 시계와 반년 차이.', water: 90, earthExtra: 0.5 * YEAR, flag: 'miller' }) },
      { label: '지나간다', hint: '', go: (v) => ({ text: '파란 행성이 블랙홀 그림자 앞을 천천히 지나갔어요.', flag: 'miller' }) },
    ],
  },
  {
    id: 'gargantua', cat: 'bh', title: '거대 블랙홀', fx: 'dim',
    desc: (v) => '태양 1억 배. 지평선이 하늘의 절반을 가리고, 빛의 고리가 위아래로 휘어요. 이렇게 큰 블랙홀은 조석력이 약해서 지평선 안까지 살아서 들어갈 수 있어요. 나올 수는 없고요.',
    src: SF('인터스텔라 (2014)') + ' · 조석력 ∝ M/r³: 초대질량 블랙홀은 지평선에서 부드러워요 (실제)',
    when: (v) => far(v) && v.s.f > 0.3 && !v.s.flags.gargantua, rate: (v) => 0.15,
    options: [
      { label: '지평선을 스쳐 중력으로 속도를 얻는다', hint: '잘 맞추면 크게 빨라져요. 지구 시계는 훨씬 많이 가요.', go: (v) => chance(0.7) ? { text: `블랙홀 곁을 반 바퀴. 배 안에서는 한나절, 지구에서는 ${yrs(U(20, 50))}. 속도가 두 배가 됐어요.`, vFactor: 2, earthExtra: U(20, 50) * YEAR, morale: 0.1, flag: 'gargantua', fx: 'warp' } : { text: '너무 가까웠어요. 배가 궤도에 잡혔고, 벗어나는 데 연료를 거의 다 썼어요. 지구에서는 수십 년.', fuel: -0.5, earthExtra: 40 * YEAR, morale: -0.2, flag: 'gargantua' } },
      { label: '안으로 들어간다', hint: '돌아올 수 없어요. 안에서 뭘 보는지는 아무도 몰라요.', go: (v) => chance(0.3) ? { text: '지평선을 넘자 빛이 뒤에서만 왔어요. 그리고 책장 같은 벽이 끝없이 이어진 곳. 벽 너머에 어릴 적 방이 보였어요. 시계를 두드렸어요. 다음 기억은 배의 침대예요. 지구 바로 곁이었어요. 지구 시계는 60년 앞서 있었어요.', jump: 0.98, earthExtra: 60 * YEAR, hints: 2, flag: 'gargantua', flag2: 'contact', fx: 'warp' } : { death: '지평선을 넘었어요. 바깥에서 보기엔 배가 가장자리에 영원히 멈춰 있는 것처럼 보였을 거예요.' } },
      { label: '멀리 돌아간다', hint: '', go: (v) => ({ text: '빛의 고리가 며칠 동안 창 한쪽에 걸려 있었어요. 아무도 그쪽 창을 가리지 않았어요.', delayFrac: 0.03, morale: 0.05, flag: 'gargantua' }) },
    ],
  },
  {
    id: 'tesseract', cat: 'sf', title: '벽 뒤에서 모스 부호가 들려요', fx: 'eyes',
    desc: (v) => '침실 벽에서 규칙적인 소리. 길고 짧은 두드림. 모스 부호예요. 좌표 숫자가 반복돼요. 우리 항로에서 아주 조금 벗어난 곳.',
    src: SF('인터스텔라 (2014)'),
    when: (v) => v.s.flags.gargantua || v.s.flags.wormhole || v.s.flags.contact, rate: (v) => 0.1, once: 'tesseract', trigger: (v) => (v.s.flags.gargantua || v.s.flags.wormhole) && chance(0.004),
    options: [
      { label: '좌표대로 항로를 바꾼다', hint: '누가 보낸 건지 몰라요. 우리를 아는 사람 같아요.', go: (v) => chance(0.75) ? { text: '그 길에 파편 구름이 없었어요. 원래 길에는 있었고요. 두드림은 그날 밤 멈췄어요.', navRisk: -0.2, morale: 0.15, hints: 1, flag: 'tesseract', flag2: 'contact' } : { text: '그 길은 멀었어요. 한 달을 잃었어요. 두드림은 계속됐고, 벽을 뜯어도 아무것도 없었어요.', delay: 30 * DAY, morale: -0.1, flag: 'tesseract' } },
      { label: '벽을 뜯어 본다', hint: '', go: (v) => ({ text: '배선과 단열재뿐. 다시 막자 두드림이 돌아왔어요. 이번엔 한 단어. "가라."', morale: -0.05, flag: 'tesseract', flag2: 'contact' }) },
      { label: '답을 두드린다', hint: '', go: (v) => ({ text: '내 이름을 두드렸어요. 긴 침묵 뒤에 같은 이름이 돌아왔어요. 그리고 끝났어요.', morale: 0.05, flag: 'tesseract', flag2: 'contact' }) },
    ],
  },
  {
    id: 'loop', cat: 'sf', title: '같은 하루가 되풀이돼요', fx: 'dim',
    desc: (v) => `${Math.round(v.s.tau / DAY)}일째. 어제도 ${Math.round(v.s.tau / DAY)}일째였어요. 일지의 마지막 줄이 같은 글씨로 세 번 적혀 있어요. 다른 사람들은 모르는 눈치예요.`,
    src: IMAGINE + ' · 영감: 엣지 오브 투모로우, 사랑의 블랙홀',
    when: (v) => v.s.tau > 100 * DAY && !v.s.flags.loop, rate: (v) => 0.1,
    options: [
      { label: '오늘 하는 일을 전부 바꾼다', hint: '', go: (v) => chance(0.6) ? { text: '아침 운동을 거르고 왼손으로 밥을 먹고 조종실 대신 창고에서 잤어요. 다음 날은 다음 날이었어요. 일지엔 사흘이 비어 있어요.', delay: 3 * DAY, morale: 0.05, flag: 'loop' } : { text: '바꿔도 같은 아침이었어요. 일곱 번째 아침에 포기하고 평소대로 살았더니 끝났어요.', delay: 7 * DAY, morale: -0.1, flag: 'loop' } },
      { label: '되풀이를 이용해 배를 점검한다', hint: '시간은 공짜예요. 아마도.', go: (v) => ({ text: '같은 하루에 배 전체를 세 번 점검했어요. 느슨한 볼트 아홉 개, 새는 밸브 하나. 나흘째 아침에 시간이 흘렀어요.', hull: 0.1, power: 0.05, delay: 4 * DAY, flag: 'loop' }) },
      { label: '수면제를 먹고 잔다', hint: '', go: (v) => ({ text: '깨어 보니 하루가 지나 있었어요. 일지에는 내 글씨로 "다행이다"라고 적혀 있었어요. 쓴 기억이 없어요.', flag: 'loop', morale: -0.05 }) },
    ],
  },
  {
    id: 'future-self', cat: 'signal', title: '미래의 내가 교신을 보냈어요', fx: 'glow',
    desc: (v) => `우리 호출 부호로 교신이 와요. 목소리는 내 것인데 늙었어요. "${pick(['다음 달 셋째 주, 배전반을 열지 마.', '물탱크 2번을 믿지 마.', '그 캡슐은 열지 마.', '지구에 도착하면 바로 북쪽으로 가.'])}" 그리고 잡음.`,
    src: IMAGINE + ' · 영감: 인터스텔라, 컨택트',
    when: (v) => v.s.tau > 60 * DAY && !v.s.flags.future, rate: (v) => 0.12,
    options: [
      { label: '말대로 한다', hint: '', go: (v) => chance(0.7) ? { text: '그 주에 배전반 2번 회로가 과열돼 있었어요. 열지 않았으니 불은 안 났어요.', hull: 0.05, morale: 0.1, hints: 1, flag: 'future', flag2: 'contact' } : { text: '그 주에 아무 일도 없었어요. 교신도 다시 오지 않았어요. 녹음은 남아 있어요.', flag: 'future', morale: 0.02 } },
      { label: '답을 보낸다', hint: '', go: (v) => ({ text: '"누구세요?" 답은 세 시간 뒤 왔어요. "알잖아." 그 뒤로 조용해요.', flag: 'future', flag2: 'contact', morale: -0.05 }) },
      { label: '녹음을 지운다', hint: '', go: (v) => ({ text: '지웠어요. 다음 날 같은 녹음이 같은 자리에 있었어요. 더는 지우지 않아요.', flag: 'future', morale: -0.08 }) },
    ],
  },
  {
    id: 'mann', cat: 'crew', title: '얼음 행성의 생존자', fx: 'glow',
    desc: (v) => '얼어붙은 구름 위에 자동 신호. 착륙해 보니 캡슐 안에 한 사람이 동면 중이었어요. 홀로 몇 년. 깨우자 우리 손을 오래 잡았어요.',
    src: SF('인터스텔라 (2014)'),
    when: (v) => far(v) && v.ship.crew > 1 && !v.s.flags.mann, rate: (v) => 0.12,
    options: [
      { label: '배에 태운다', hint: '사람이 하나 늘어요. 오래 혼자였던 사람은 가끔 달라져 있어요.', go: (v) => chance(0.6) ? { text: '지질학자예요. 식탁에서는 말이 많고, 밤에 가끔 복도에 혼자 서 있어요.', crewGain: 1, newMate: { name: '만', role: '지질학자' }, morale: 0.05, flag: 'mann', flag2: 'mannOn' } : { text: '한 달 뒤 그 사람이 착륙선을 훔쳐 떠나려 했어요. 도킹부가 찢기고 연료가 샜어요. 그 사람은 돌아오지 않았어요.', hull: -0.2, fuel: -0.25, morale: -0.2, flag: 'mann', delay: 10 * DAY } },
      { label: '식량만 나눠 주고 떠난다', hint: '', go: (v) => ({ text: '석 달치 식량을 내리고 좌표를 지구에 보냈어요. 그 사람은 창 앞에 서서 우리가 안 보일 때까지 있었어요.', food: -90, morale: -0.05, flag: 'mann' }) },
      { label: '깨우지 않고 지나간다', hint: '', go: (v) => ({ text: '신호는 계속 나왔어요. 사흘 동안.', morale: -0.1, flag: 'mann' }) },
    ],
  },
  {
    id: 'aberration', cat: 'nav', title: '별이 앞쪽으로 몰려요', fx: 'stars',
    desc: (v) => `빛의 ${Math.round(v.beta * 100)} %. 뒤쪽 하늘이 비고 앞쪽에 별이 몰려 색이 파랗게 변했어요. 실제 물리예요. 광행차와 도플러 효과.`,
    src: '상대론적 광행차·도플러 편이 (실제 물리, 0.2c 에서 뚜렷)',
    when: (v) => v.beta > 0.1 && !v.s.flags.aberration, rate: (v) => 2,
    options: [
      { label: '뒤쪽 창으로 간다', hint: '', go: (v) => ({ text: '뒤는 거의 캄캄해요. 출발한 별이 붉고 흐리게 하나. 앞은 파란 별들의 터널이에요.', morale: 0.08, flag: 'aberration' }) },
      { label: '사진을 찍어 둔다', hint: '', go: (v) => ({ text: '천 장. 지구의 어떤 망원경도 이런 하늘을 못 찍어요.', morale: 0.05, flag: 'aberration' }) },
    ],
  },
  {
    id: 'ghost-ship', cat: 'sf', title: '미래의 우리 배가 앞에 있어요', fx: 'eyes',
    desc: (v) => '레이더에 우리와 똑같은 배. 같은 호출 부호, 같은 흠집. 창 안에 사람들이 보여요. 우리예요. 늙은 우리.',
    src: IMAGINE + ' · 영감: 인터스텔라, 코히어런스',
    when: (v) => (v.s.flags.wormhole || v.s.flags.gargantua || v.s.flags.loop) && !v.s.flags.ghost, rate: (v) => 0.4,
    options: [
      { label: '도킹을 시도한다', hint: '', go: (v) => chance(0.5) ? { text: '도킹부가 맞닿는 순간 그 배는 없었어요. 우리 배 창고에 식량 상자가 두 배로 있었어요. 포장 날짜는 20년 뒤.', food: 200, morale: 0.1, flag: 'ghost', flag2: 'contact' } : { text: '가까이 가자 그 배가 손을 흔들더니 멀어졌어요. 우리보다 빨랐어요. 우리 배는 그 속도가 안 나요.', morale: -0.1, flag: 'ghost', flag2: 'contact' } },
      { label: '교신한다', hint: '', go: (v) => ({ text: '"가지 마." 늙은 내 목소리. "아니, 가." 다른 목소리. 둘 다 나예요. 교신은 거기서 끊겼어요.', morale: -0.05, flag: 'ghost', flag2: 'contact' }) },
      { label: '속도를 올려 지나친다', hint: '', go: (v) => ({ text: '지나쳤어요. 뒤쪽 창으로 보니 그 배는 반대 방향으로 가고 있었어요.', fuel: -0.03, flag: 'ghost' }) },
    ],
  },
  {
    id: 'frozen-time', cat: 'sf', title: '시계가 멈췄어요', fx: 'dim',
    desc: (v) => '모든 시계가 같은 시각에 서 있어요. 창밖 별도 안 움직여요. 숨은 쉬어져요. 커피에서 김이 올라가다 멈춰 있어요.',
    src: IMAGINE,
    when: (v) => v.s.tau > 200 * DAY && !v.s.flags.frozen, rate: (v) => 0.08,
    options: [
      { label: '배 안을 걸어 다닌다', hint: '', go: (v) => chance(0.7) ? { text: '복도 끝까지 갔다 왔어요. 돌아오니 김이 다시 올라갔어요. 시계는 1초 뒤였어요. 걸은 시간은 삼십 분이었는데.', morale: 0.05, flag: 'frozen', flag2: 'contact' } : { text: '복도 끝에서 누군가 서 있었어요. 멈춘 채로. 우리 배 사람이 아니었어요. 돌아오니 시간이 흘렀고 그 자리는 비어 있었어요.', morale: -0.15, flag: 'frozen', flag2: 'contact' } },
      { label: '눈을 감고 기다린다', hint: '', go: (v) => ({ text: '눈을 뜨니 시계가 갔어요. 일지엔 그 1초가 없어요. 커피는 식어 있었어요.', flag: 'frozen' }) },
    ],
  },
];
