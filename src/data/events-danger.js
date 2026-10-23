// 극적인 결말이 있는 시나리오: 사냥하는 것들, 블랙홀에 잡힘, 선체를 먹는 벌레, 초신성, 통째로 끌려감, 동료의 변이.
// 전부 상상(시나리오). 죽음은 death 로, 확률은 숨겨져 있다.
import { AU, DAY, YEAR } from '../physics/constants.js';
import { R, chance, U, pick, SF, IMAGINE, who, him } from './ev-util.js';

const far = (v) => v.from.kind !== 'solar';
const many = (v) => v.s.crewAlive > 1;

export const DANGER_EVENTS = [
  {
    id: 'hunters', cat: 'sf', title: '우리를 쫓는 배', fx: 'saucer',
    desc: (v) => '납치했던 외계인의 배가 아니에요. 더 작고, 더 빠르고, 불빛이 없어요. 사흘째 거리를 좁혀 와요. 교신 주파수에서 뼈를 긁는 듯한 소리가 나요.',
    src: IMAGINE + ' · 영감: 프레데터, 에일리언',
    when: (v) => v.s.tau > 40 * DAY && !v.s.flags.hunters, rate: (v) => 0.12,
    options: [
      { label: '엔진을 최대로 올려 도망친다', hint: '연료를 많이 써요. 따라잡히면 끝이에요.', go: (v) => { const r = R(); return r < 0.55 ? { text: '열두 시간 전속력. 레이더에서 점이 멀어졌어요. 연료 4분의 1이 사라졌어요.', fuel: -0.25, morale: -0.1, flag: 'hunters' } : r < 0.85 ? { text: '따라잡혔어요. 선체에 뭔가 달라붙었다가 떨어졌어요. 뒤쪽 칸이 뜯겨 나갔고, 외계인은 그걸 들고 사라졌어요.', hull: -0.3, food: -100, morale: -0.2, flag: 'hunters' } : { death: '따라잡혔어요. 선체가 통조림처럼 열렸어요. 마지막으로 본 건 어둠 속에서 움직이는 긴 팔이었어요.' }; } },
      { label: '불을 끄고 소행성 그림자에 숨는다', hint: '항로 근처에 바위가 있어요.', go: (v) => chance(0.7) ? { text: '바위 뒤에서 이틀. 그 배는 두 번 지나갔고 세 번째엔 오지 않았어요.', delay: 2 * DAY, morale: -0.05, flag: 'hunters' } : { death: '바위 뒤에서 이틀째 밤, 에어록이 바깥에서 열렸어요. 안에서 잠근 문이었는데.' } },
      { label: '정면으로 교신을 보낸다', hint: '뭘 원하는지 알 수 있을지도 몰라요.', go: (v) => chance(0.5) ? { text: '긁는 소리가 멈췄어요. 그 배는 우리 옆에 한 시간 떠 있다가 방향을 바꿨어요. 선체에 긁힌 자국 하나를 남기고요.', hull: -0.05, flag: 'hunters', flag2: 'contact' } : (many(v) ? (() => { who(v); return { text: `외계인은 교신에 답하지 않았어요. 대신 ${him(v)}이 있던 칸의 문이 열렸다 닫혔어요. 그 칸은 비어 있었어요.`, crewLost: 1, lost: v._m, morale: -0.3, flag: 'hunters', flag2: 'contact' }; })() : { death: '교신에 답이 왔어요. 우리 배 안에서. 등 뒤였어요.' }) },
    ],
  },
  {
    id: 'bh-capture', cat: 'bh', title: '블랙홀 중력에 잡혔어요', fx: 'dim',
    desc: (v) => '엔진이 꺼진 사이 항로가 휘었어요. 창밖 별들이 한쪽으로 쏠리고, 검은 원이 커져요. 지금 엔진을 켜면 빠져나올 수 있을지 계산이 아슬아슬해요.',
    src: SF('인터스텔라, 이벤트 호라이즌') + ' · 조석력은 실제 물리',
    when: (v) => far(v) && (v.s.seen?.roguebh || v.s.seen?.gargantua || v.from.kind === 'bh') && !v.s.flags.bhcapture, rate: (v) => 0.4,
    options: [
      { label: '남은 연료를 전부 태운다', hint: '성공하면 빠져나와요. 연료는 거의 남지 않아요.', go: (v) => chance(0.65) ? { text: '엔진이 사십 분 동안 울었어요. 검은 원이 천천히 작아졌어요. 연료는 바닥이에요.', fuel: -0.6, morale: 0.1, flag: 'bhcapture' } : { death: '엔진이 멎었을 때 검은 원이 하늘의 절반이었어요. 머리가 발보다 무거워지고, 별빛이 한 점으로 모이고, 그다음은 없어요.' } },
      { label: '궤도를 돌며 빠져나갈 순간을 기다린다', hint: '시간이 걸려요. 지구 시계는 훨씬 많이 가요.', go: (v) => chance(0.6) ? { text: '세 바퀴를 돌았어요. 배 안에서 열흘, 지구에서는 몇 년. 네 바퀴째에 빠져나왔어요.', delay: 10 * DAY, earthExtra: 4 * YEAR, fuel: -0.3, flag: 'bhcapture' } : { death: '궤도가 한 바퀴마다 좁아졌어요. 마지막 바퀴에서 창밖이 전부 검어졌어요.' } },
      { label: '구조 캡슐로 탈출한다', hint: '배를 버려요. 캡슐에는 식량 한 달치.', go: (v) => many(v) ? { text: '캡슐이 둘뿐이었어요. 셋이 탔고 나머지는 배에 남았어요. 배는 검은 원 속으로 천천히 사라졌어요.', crewLost: Math.max(1, v.s.crewAlive - 3), food: -v.s.food * 0.8, hull: -0.2, morale: -0.4, flag: 'bhcapture' } : { text: '캡슐로 옮겨 탔어요. 배가 검은 원 속으로 사라지는 걸 보며 지구 쪽으로 분사했어요.', food: -v.s.food * 0.8, hull: -0.2, morale: -0.3, flag: 'bhcapture' } },
    ],
  },
  {
    id: 'swarm', cat: 'sf', title: '선체를 먹는 벌레들', fx: 'glow',
    desc: (v) => '바깥 벽에 반짝이는 점이 수백 개 붙었어요. 손가락만 한 금속 벌레. 알루미늄을 갉아 먹고 수가 늘어요. 압력계가 흔들리기 시작했어요.',
    src: IMAGINE + ' · 영감: 스타게이트 레플리케이터',
    when: (v) => v.s.tau > 30 * DAY && !v.s.flags.swarm, rate: (v) => 0.1,
    options: [
      { label: '선체에 전기를 흘린다', hint: '전력을 많이 써요. 벌레가 전기에 약한지는 몰라요.', go: (v) => chance(0.65) ? { text: '벽이 울리자 벌레들이 한꺼번에 떨어졌어요. 뒤쪽으로 반짝이며 멀어졌어요. 벽에 구멍 수십 개.', power: -0.2, hull: -0.15, flag: 'swarm' } : { text: '전기를 먹고 더 커졌어요. 결국 그 칸을 통째로 잘라 버렸어요.', power: -0.2, hull: -0.3, food: -60, flag: 'swarm' } },
      { label: '밖에 나가 손으로 떼어 낸다', hint: '우주복에 붙으면 어떻게 될지 몰라요.', go: (v) => chance(0.5) ? { text: '네 시간 동안 수백 마리를 떼어 던졌어요. 장갑이 구멍 났지만 들어왔어요.', health: -0.1, hull: -0.1, flag: 'swarm' } : { death: '한 마리가 헬멧에 붙었어요. 유리가 녹는 소리가 들렸어요.' } },
      { label: '그 칸을 버리고 분리한다', hint: '확실하지만 그 칸의 물건을 잃어요.', go: (v) => ({ text: '뒤쪽 두 칸을 폭발 볼트로 떼어 냈어요. 벌레들은 그 칸과 함께 멀어졌어요. 식량 상자 절반이 거기 있었어요.', hull: -0.25, food: -v.s.food * 0.5, flag: 'swarm' }) },
    ],
  },
  {
    id: 'supernova', cat: 'sun', title: '가까운 별이 터졌어요', fx: 'flash',
    desc: (v) => '창 한쪽이 대낮처럼 밝아졌어요. 수십 광년 거리의 별이 초신성이 됐어요. 빛 다음에 오는 건 감마선과 입자예요. 몇 시간 안에 와요.',
    src: '초신성 감마선·우주선 (실제 물리); 베텔게우스는 언젠가 터져요 · ' + IMAGINE,
    when: (v) => far(v) && !v.s.flags.supernova, rate: (v) => 0.08,
    options: [
      { label: '물탱크 뒤로 들어가 배를 돌려 등진다', hint: '물이 가장 좋은 방패예요.', go: (v) => { const d = U(0.5, 2.5); return { text: `탱크 뒤에서 이틀. 선량계 ${d.toFixed(1)} Sv. 바깥 벽의 페인트가 다 벗겨졌어요.`, dose: d, acute: d * 0.5, delay: 2 * DAY, flag: 'supernova' }; } },
      { label: '창가에서 끝까지 본다', hint: '', go: (v) => chance(0.5) ? (() => { const d = U(3, 6); return { text: `평생 못 볼 빛이었어요. 그리고 ${d.toFixed(1)} Sv. 구토가 시작됐어요.`, dose: d, acute: d, morale: 0.1, flag: 'supernova' }; })() : { death: '빛이 너무 아름다워서 물러서지 않았어요. 입자가 도착한 건 세 시간 뒤였어요. 일주일 뒤 숨이 멎었어요.' } },
    ],
  },
  {
    id: 'taken', cat: 'sf', title: '배가 통째로 끌려가요', fx: 'saucer',
    desc: (v) => '엔진이 돌아가는데 배가 뒤로 가요. 창밖에 외계인의 배. 이번엔 훨씬 커요. 빛기둥 안으로 우리 배가 천천히 들어가요.',
    src: IMAGINE + ' · 영감: 미지와의 조우, 인디펜던스 데이',
    when: (v) => v.s.flags.abductors && !v.s.flags.taken, rate: (v) => 0.2,
    options: [
      { label: '엔진을 역방향으로 전부 켠다', hint: '', go: (v) => chance(0.5) ? { text: '배가 종처럼 떨렸어요. 빛기둥이 끊겼고 우리는 튕겨 나왔어요. 연료 절반, 선체 곳곳에 금.', fuel: -0.5, hull: -0.25, flag: 'taken' } : { death: '빛기둥 안으로 들어갔어요. 문이 열렸고, 큰 눈들이 내려다봤어요. 이번엔 돌려보내지 않았어요.' } },
      { label: '에어록을 열고 걸어 나간다', hint: '외계인이 원하는 게 나라면.', go: (v) => chance(0.6) ? { text: '빛 속에서 한 시간. 그리고 배에 돌아와 있었어요. 배는 지구 쪽으로 돌아서 있었고, 훨씬 가까웠어요.', jump: 0.5, morale: -0.1, flag: 'taken', flag2: 'contact' } : { death: `빛 속으로 걸어 들어갔어요. 배는 그 자리에 남았고, ${many(v) ? '남은 사람들은 조종실 창에서 끝까지 봤어요' : '아무도 돌아오지 않았어요'}.` } },
      { label: '구조 캡슐로 흩어진다', hint: '배는 잃어요.', go: (v) => ({ text: '캡슐 셋이 세 방향으로. 배는 빛기둥 속으로 사라졌어요. 한 달 뒤 캡슐들이 다시 모였어요. 식량은 캡슐에 있던 것뿐이에요.', food: -v.s.food * 0.7, hull: -0.3, fuel: -0.3, morale: -0.3, flag: 'taken' }) },
    ],
  },
  {
    id: 'parasite', cat: 'sf', title: (v) => `${who(v)}이 변하고 있어요`, fx: 'eyes',
    desc: (v) => `${him(v)}의 눈이 어두워졌어요. 잠을 안 자고 밤마다 에어록 앞에 서 있어요. 피 검사엔 우리에게 없는 것이 있어요.`,
    src: IMAGINE + ' · 영감: 더 씽 (1982), 에일리언',
    when: (v) => many(v) && v.s.tau > 60 * DAY && !v.s.flags.parasite, rate: (v) => 0.1,
    options: [
      { label: '격리실에 가두고 치료를 시도한다', hint: '', go: (v) => chance(0.5) ? { text: `열흘 동안 항생제와 수혈. 눈이 돌아왔어요. ${him(v)}은 아무것도 기억 못 해요.`, flag: 'parasite', morale: 0.05 } : { text: `사흘째 밤, 격리실 문이 안에서 열렸어요. ${him(v)}은 에어록을 열고 걸어 나갔어요. 우주복 없이.`, crewLost: 1, lost: v._m, morale: -0.3, flag: 'parasite', flag2: 'contact' } },
      { label: '에어록 밖으로 내보낸다', hint: '확실해요. 그리고 돌이킬 수 없어요.', go: (v) => chance(0.8) ? { text: `${him(v)}은 저항하지 않았어요. 마지막에 우리 눈을 보며 고개를 끄덕였어요. 아무도 그 얘기를 하지 않아요.`, crewLost: 1, lost: v._m, morale: -0.35, flag: 'parasite' } : { death: '에어록 앞에서 그 사람이 뒤돌아봤어요. 이미 사람이 아니었어요. 조종실까지 오는 데 10초가 안 걸렸어요.' } },
      { label: '지켜본다', hint: '', go: (v) => chance(0.4) ? { text: '일주일 뒤 제 발로 의무실에 왔어요. 열이 내렸고 눈이 돌아왔어요. 꿈이었대요.', flag: 'parasite' } : (chance(0.5) ? { text: `새벽에 ${him(v)}이 산소 발생기를 뜯고 있었어요. 막았지만 발생기가 망가졌어요. 그 뒤 격리했고 열흘 뒤 돌아왔어요.`, oga: false, flag: 'parasite' } : { death: '새벽에 깨어 보니 조종실 문이 열려 있고 압력 경보가 울리고 있었어요. 그 사람은 에어록 앞에서 웃고 있었어요.' }) },
    ],
  },
];
