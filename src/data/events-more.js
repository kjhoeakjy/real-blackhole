// 사건 더: 이름 있는 동료, 그들(납치범), 상상 시나리오, 그리고 실제로 일어날 법한 몸·배의 일.
// 실제 기록에 바탕을 둔 것은 src 에 출처를, 상상은 '시나리오'라고 적는다. 결과는 숨겨진 확률로 굴린다.
// fx: 카드가 열릴 때 또는 결과에 붙는 창밖 연출 이름 (UI 가 그린다).
import { AU, DAY, YEAR, LY } from '../physics/constants.js';
import { R, chance, U, pick, fmtDelay, SF, IMAGINE, who, him } from './ev-util.js';

const NEWCOMERS = [['이안 모리스', '밀항자'], ['윤채원', '동승자'], ['카를로스 멘데스', '동승자'], ['문서진', '동승자'], ['엘리 반더버그', '동승자']];
const newcomer = (v) => { const used = new Set(v.s.mates.map((m) => m.name)); return pick(NEWCOMERS.filter((n) => !used.has(n[0]))) || ['낯선 사람', '동승자']; };
const dead = (v) => v.s.mates.filter((m) => !m.alive);
const many = (v) => v.s.crewAlive > 1;
const tvYear = (v) => new Date().getFullYear() - Math.round(v.earthDistAU() * AU / LY);

export const MORE_EVENTS = [
  // ================= 동료 =================
  {
    id: 'mate-birthday', cat: 'crew', title: (v) => `${who(v)}의 생일`,
    desc: (v) => `${him(v)}(${v._m?.role})이 아침에 조용히 말했어요. 오늘이래요. 식량 창고엔 설탕 봉지 하나와 분말 달걀이 있어요.`,
    src: 'ISS 승무원 생일 기록 (NASA 블로그); 남극 월동 기지의 생일 전통',
    when: many, rate: (v) => 0.4,
    options: [
      { label: '케이크 비슷한 것을 만든다', hint: '설탕과 분말 달걀, 전기 오븐 20분. 식량을 조금 써요.', go: (v) => ({ text: `납작한 빵에 초 대신 손전등을 꽂았어요. ${him(v)}이 사진을 찍어 두자고 했어요.`, food: -2, morale: 0.15, bond: 1 }) },
      { label: '하루 일을 쉬게 한다', hint: '정비 일정이 하루 밀려요.', go: (v) => chance(0.85) ? { text: `${him(v)}은 하루 종일 창가에 있었어요. 다음 날 두 배로 일했어요.`, morale: 0.1, bond: 1, delay: DAY } : { text: '그날 밤 필터 경보가 울렸어요. 쉬는 날은 없던 일이 됐어요.', morale: -0.03, delay: DAY } },
      { label: '그냥 지나간다', hint: '여기선 날짜가 큰 의미 없어요.', go: (v) => ({ text: `${him(v)}은 아무 말도 하지 않았어요. 저녁에 혼자 음악을 들었어요.`, morale: -0.05 }) },
    ],
  },
  {
    id: 'mate-stash', cat: 'crew', title: '창고 수량이 안 맞아요',
    desc: (v) => `식량 상자 열한 개가 비었어요. 장부엔 여덟 개. ${who(v)}의 침낭 밑에서 포장지가 나왔어요.`,
    src: 'Mars-500 식량 분배 갈등 보고; 남극 월동 기지 식량 사고 사례',
    when: (v) => many(v) && v.s.tau > 90 * DAY, rate: (v) => 0.2,
    options: [
      { label: '둘만 있을 때 묻는다', hint: '창피를 주지 않으면 돌아오는 게 많아요.', go: (v) => chance(0.7) ? { text: `${him(v)}은 한참 말이 없다가 상자 두 개를 더 꺼내 왔어요. 다시 장부에 올렸어요.`, food: 20, morale: 0.05, bond: 1 } : { text: `${him(v)}은 아니라고 했어요. 다음 달 또 두 상자가 비었어요.`, food: -15, morale: -0.1 } },
      { label: '전원 앞에서 꺼낸다', hint: '공정하지만 사람 하나가 배에서 외톨이가 돼요.', go: (v) => chance(0.5) ? { text: '상자는 돌아왔어요. 그 사람은 그 뒤로 식탁에 앉지 않아요.', food: 25, morale: -0.15 } : { text: `${him(v)}이 먼저 사과했어요. 밤에 혼자 먹었대요. 무서워서. 식량 당번을 돌리기로 했어요.`, food: 25, morale: 0.05 } },
      { label: '모른 척한다', hint: '식량은 계속 줄어요.', go: (v) => ({ text: '석 달 뒤 상자 열 개가 더 비었어요.', food: -40, morale: -0.05 }) },
    ],
  },
  {
    id: 'mate-eva', cat: 'rock', title: '안테나 받침이 흔들려요',
    desc: (v) => `밖에 나가 볼트 네 개를 조여야 해요. ${who(v)}이 같이 가겠다고 해요. 1965년 레오노프는 우주복이 부풀어 에어록에 못 들어왔고, 2013년 파르미타노는 헬멧에 물이 찼어요.`,
    src: 'Voskhod 2 (1965) Leonov EVA; ISS EVA-23 (2013) Parmitano 헬멧 누수; NASA EVA 위험 ≈ 1/400 회',
    when: many, rate: (v) => 0.25,
    options: [
      { label: '둘이 나간다', hint: '서로 줄을 봐 줄 수 있어요. 둘 다 위험해요.', go: (v) => { const r = R(); return r < 0.9 ? { text: '네 시간. 볼트 넷. 돌아와 서로 헬멧을 벗겨 줬어요.', morale: 0.1, bond: 1 } : r < 0.97 ? { text: `${him(v)}의 줄이 꼬였어요. 내 줄로 끌어 왔어요. 둘 다 삼십 분 동안 말을 못 했어요.`, health: -0.05, morale: 0.05, bond: 2 } : { text: `${him(v)}의 헬멧 안에 물이 차기 시작했어요. 에어록까지 열두 걸음. 들어왔을 때는 늦었어요.`, crewLost: 1, lost: v._m, morale: -0.35 }; } },
      { label: (v) => `${him(v)} 혼자 보낸다`, hint: '안에서 줄과 생명 유지를 지켜볼 수 있어요.', go: (v) => chance(0.93) ? { text: `${him(v)}이 다섯 시간 뒤 들어왔어요. 볼트 넷, 그리고 선체에 찍힌 작은 운석 자국 사진.`, morale: 0.05 } : { text: `줄이 걸린 곳에서 우주복 압력이 떨어졌어요. 끌어 들였지만 ${him(v)}은 깨어나지 않았어요.`, crewLost: 1, lost: v._m, morale: -0.35 } },
      { label: '안에서 로봇 팔로 한다', hint: '느리고 서툴지만 안전해요. 안테나가 제대로 안 잡힐 수 있어요.', go: (v) => chance(0.6) ? { text: '이틀 걸렸어요. 볼트 셋은 조였고 하나는 못 잡았어요. 신호가 조금 흔들려요.', delay: 2 * DAY } : { text: '팔이 안테나를 쳤어요. 결국 나가서 고쳐야 했어요.', delay: 3 * DAY, hull: -0.03 } },
    ],
  },
  {
    id: 'mate-silent', cat: 'mind', title: (v) => `${who(v)}이 며칠째 말이 없어요`,
    desc: (v) => `식사 자리에 안 오고 자기 칸에서 나오지 않아요. 남극 월동대와 잠수함에서 흔한 일이에요. ${Math.round(v.s.tau / DAY)}일째예요.`,
    src: '남극 월동 우울증 보고 (Palinkas 2008); 잠수함 승무원 정신건강 연구',
    when: (v) => many(v) && v.s.tau > 120 * DAY, rate: (v) => 0.3 * (1.3 - v.s.morale),
    options: [
      { label: '옆에 가서 같이 앉아 있는다', hint: '말은 안 해도 돼요. 시간이 걸려요.', go: (v) => chance(0.75) ? { text: `사흘째 밤에 ${him(v)}이 먼저 말했어요. 지구에 두고 온 개 이야기였어요.`, morale: 0.1, bond: 2 } : { text: '일주일을 옆에 있었어요. 조금 나아졌어요. 아주 조금.', morale: 0.02 } },
      { label: '의무실 약을 준다', hint: '항우울제는 몇 주 걸려요. 부작용으로 잠이 늘어요.', go: (v) => chance(0.6) ? { text: '한 달 뒤 식탁에 돌아왔어요. 예전보다 조용하지만.', morale: 0.05 } : { text: '약을 먹고 하루 열여섯 시간을 자요. 정비 일이 남은 사람들에게 돌아갔어요.', morale: -0.05, health: -0.03 } },
      { label: '일을 더 맡긴다', hint: '바쁘면 생각이 줄어요. 안 통할 수도 있어요.', go: (v) => chance(0.5) ? { text: '재배실 당번을 맡겼어요. 싹이 난 날 처음으로 식탁에 나왔어요.', morale: 0.08 } : { text: '일을 던져 두고 다시 칸에 들어갔어요. 더 나빠졌어요.', morale: -0.12 } },
    ],
  },
  {
    id: 'mate-chess', cat: 'crew', title: (v) => `${who(v)}이 체스판을 만들었어요`,
    desc: (v) => '포장 상자를 잘라 말을 깎고, 자석 테이프로 판을 만들었어요. 1970년 소유즈 9호 승무원은 지상 관제와 체스를 뒀어요.',
    src: 'Soyuz 9 (1970) 우주–지상 체스; ISS 여가 활동 기록',
    when: many, rate: (v) => 0.2, once: 'chess', trigger: (v) => many(v) && v.s.tau > 45 * DAY && chance(0.004),
    options: [
      { label: '매일 저녁 한 판', hint: '시간은 많아요.', go: (v) => ({ text: `${Math.round(U(1, 3))}년에 걸친 대회가 시작됐어요. 승률표가 벽에 붙었어요.`, morale: 0.15, bond: 1 }) },
      { label: '구경만 한다', hint: '', go: (v) => ({ text: '두 사람이 두고 나머지가 훈수를 둬요. 저녁이 길어졌어요.', morale: 0.05 }) },
    ],
  },
  {
    id: 'mate-memory', cat: 'sf', title: (v) => `${who(v)}이 기억을 되찾았어요`, fx: 'eyes',
    desc: (v) => `${him(v)}은 그들의 배 안에서 깨어 있었대요. 빛, 길고 조용한 복도, 그리고 우리를 내려다보던 얼굴들. 손이 떨려요.`,
    src: IMAGINE,
    when: (v) => many(v) && v.s.tau > 30 * DAY && !v.s.flags.memory, rate: (v) => 0.15,
    options: [
      { label: '끝까지 듣는다', hint: '밤이 길어질 거예요.', go: (v) => ({ text: '그들은 우리를 해치지 않았대요. 돌려보낼 곳을 고르는 것처럼 보였대요. 왜 여기였는지는 모르겠어요.', morale: 0.05, flag: 'memory', bond: 1 }) },
      { label: '전부 기록한다', hint: '지구에서 누군가 읽을 거예요.', go: (v) => ({ text: '열두 쪽. 그들의 얼굴을 그려 달라고 했어요. 눈이 컸어요. 기록은 암호화해 두었어요.', flag: 'memory', morale: 0.02 }) },
      { label: '꿈이라고 한다', hint: '', go: (v) => ({ text: `${him(v)}은 그 뒤로 그 얘기를 하지 않았어요. 밤에 가끔 복도 불을 다 켜 놓아요.`, morale: -0.05, flag: 'memory' }) },
    ],
  },
  {
    id: 'mate-wedding', cat: 'crew', title: '배에서 결혼식',
    desc: (v) => '두 사람이 식탁 앞에 섰어요. 반지는 전선 피복으로 만들었어요. 2003년 말렌첸코는 ISS 에서 지구의 신부와 결혼했어요.',
    src: 'ISS 결혼 (Malenchenko 2003); ' + SF('패신저스 (2016)'),
    when: (v) => v.s.flags.love && v.s.crewAlive >= 3 && !v.s.flags.wedding, rate: (v) => 0.4,
    options: [
      { label: '주례를 본다', hint: '', go: (v) => ({ text: '세 문장짜리 주례였어요. 샴페인 대신 재배실 토마토 주스. 그날은 다들 일을 쉬었어요.', morale: 0.25, bond: 1, flag: 'wedding', food: -1 }) },
    ],
  },
  {
    id: 'mate-anniv', cat: 'mind', title: (v) => `${dead(v)[0]?.name}의 기일`,
    desc: (v) => `${dead(v)[0]?.name}(${dead(v)[0]?.role})을 잃고 1년. 그 사람 칸은 그대로 두었어요.`,
    src: '남극·잠수함 사별 대처 보고',
    when: (v) => dead(v).length > 0 && v.s.tau - dead(v)[0].diedTau > YEAR && !v.s.flags.anniv, rate: (v) => 2,
    options: [
      { label: '다 모여 이름을 부른다', hint: '', go: (v) => ({ text: '한 사람씩 그 사람에 대한 기억 하나를 말했어요. 그 사람 칸을 재배실로 만들기로 했어요.', morale: 0.1, flag: 'anniv', bond: 1 }) },
      { label: '혼자 창가에 앉는다', hint: '', go: (v) => ({ text: '별이 그날처럼 많았어요.', morale: 0.02, flag: 'anniv' }) },
    ],
  },
  {
    id: 'mate-show', cat: 'crew', title: (v) => `${who(v)}의 저녁 방송`,
    desc: (v) => `${him(v)}이 매일 저녁 선내 방송으로 "뉴스"를 읽어요. 오늘의 거리, 오늘의 고장, 오늘의 농담. 청취자 ${v.s.crewAlive - 1}명.`,
    src: 'ISS 승무원 여가 기록; 남극 기지 자체 라디오 방송 전통',
    when: (v) => many(v) && v.s.tau > 200 * DAY, rate: (v) => 0.15, once: 'show', trigger: (v) => many(v) && v.s.tau > 200 * DAY && chance(0.002),
    options: [
      { label: '게스트로 나간다', hint: '', go: (v) => ({ text: '지구에서 뭘 제일 먼저 먹을지 인터뷰했어요. 답이 세 시간 걸렸어요.', morale: 0.12, bond: 1 }) },
      { label: '듣기만 한다', hint: '', go: (v) => ({ text: '저녁 일곱 시가 기다려지는 시간이 됐어요.', morale: 0.08 }) },
    ],
  },
  {
    id: 'stowaway', cat: 'sf', title: '창고에서 사람이 나왔어요', fx: 'eyes',
    desc: (v) => `물탱크 뒤에서. 수척하고 겁에 질렸어요. 우리처럼 끌려왔다가 그들이 떠날 때 이 배에 숨었대요. 식량 계산은 ${v.s.crewAlive}명 기준이에요.`,
    src: IMAGINE,
    when: (v) => v.s.tau > 5 * DAY && v.s.tau < 400 * DAY && !v.s.flags.stowaway && v.ship.crew > 1, rate: (v) => 0.25,
    options: [
      { label: '받아들인다', hint: '먹는 입이 하나 늘어요. 손도 하나 늘고요.', go: (v) => { const [n, r] = newcomer(v); return { text: `${n}이라고 해요. 전기 일을 할 줄 안대요. 식량표를 다시 썼어요.`, crewGain: 1, newMate: { name: n, role: r }, morale: 0.1, flag: 'stowaway' }; } },
      { label: '격리실에 두고 지켜본다', hint: '병을 옮길 수도, 그들이 보낸 사람일 수도 있어요.', go: (v) => chance(0.8) ? (() => { const [n, r] = newcomer(v); return { text: `열흘 뒤 격리를 풀었어요. ${n}은 그 뒤로 식탁 가장 끝에 앉아요.`, crewGain: 1, newMate: { name: n, role: r }, flag: 'stowaway' }; })() : { text: '사흘째 밤 격리실이 비어 있었어요. 에어록은 닫혀 있었고요. 아무도 설명하지 못했어요.', morale: -0.15, flag: 'contact' } },
      { label: '구조 캡슐에 태워 내보낸다', hint: '캡슐엔 식량 한 달치가 있어요. 그 사람이 어떻게 될지는 몰라요.', go: (v) => ({ text: '캡슐이 멀어지는 걸 다 같이 봤어요. 아무도 저녁을 먹지 않았어요.', morale: -0.25, flag: 'stowaway' }) },
    ],
  },
  // ================= 그들 =================
  {
    id: 'abductors', cat: 'sf', title: '그들이 돌아왔어요', fx: 'saucer',
    desc: (v) => '창밖에 납작한 어둠. 아래쪽 불빛이 그날 밤과 같은 순서로 깜빡여요. 레이더엔 아무것도 없어요.',
    src: IMAGINE + ' · 영감: 미지와의 조우 (1977)',
    when: (v) => v.s.tau > 60 * DAY && !v.s.flags.abductors, rate: (v) => 0.08,
    options: [
      { label: '에어록을 연다', hint: '그들이 들어올 수도, 우리를 데려갈 수도 있어요.', go: (v) => { const r = R(); if (r < 0.4) return { text: '아무도 들어오지 않았어요. 아침에 에어록 바닥에 상자가 있었어요. 우리 식량과 같은 포장. 석 달치.', food: 90, morale: 0.1, flag: 'abductors' }; if (r < 0.7) return { text: '빛이 들어왔고 다음 기억은 침대예요. 시계가 여섯 달 앞으로 가 있고, 창밖 별자리가 달라요. 지구가 훨씬 가까워요.', jump: 0.3, delay: 180 * DAY, flag: 'abductors', fx: 'flash' }; if (many(v) && r < 0.85) { who(v); return { text: `아침에 ${him(v)}의 침낭이 비어 있었어요. 그 사람 신발은 에어록 앞에 나란히 놓여 있었어요.`, crewLost: 1, lost: v._m, morale: -0.3, flag: 'abductors' }; } return { text: '아무 일도 없었어요. 그들은 한 시간 뒤 사라졌어요. 에어록은 밤새 열려 있었어요.', morale: -0.1, flag: 'abductors' }; } },
      { label: '불을 다 끄고 숨는다', hint: '그들이 레이더에 안 잡힌다면 우리도 안 보일지 몰라요.', go: (v) => chance(0.7) ? { text: '두 시간을 어둠 속에서 보냈어요. 그들은 천천히 멀어졌어요.', morale: -0.05, flag: 'abductors' } : { text: '불을 꺼도 그들은 창 앞에 있었어요. 새벽에 사라졌어요. 선체 바깥에 손 자국 같은 것이 남았어요.', morale: -0.15, flag: 'abductors', flag2: 'contact' } },
      { label: '착륙등으로 같은 순서를 돌려보낸다', hint: '인사일지 도발일지 몰라요.', go: (v) => chance(0.6) ? { text: '그들의 불빛이 멈췄다가 새 순서로 깜빡였어요. 세 번. 그리고 떠났어요. 그 순서를 적어 뒀어요.', morale: 0.15, flag: 'abductors', flag2: 'contact' } : { text: '불빛이 꺼졌어요. 배가 한 번 크게 흔들렸고 그들은 없었어요. 안테나가 휘었어요.', hull: -0.08, flag: 'abductors' } },
    ],
  },
  {
    id: 'window-face', cat: 'sf', title: '헬멧 유리 너머에 얼굴', fx: 'eyes',
    desc: (v) => '선체 밖 작업 중이에요. 몸을 돌리자 팔 하나 거리에 얼굴이 있어요. 눈이 크고 검어요. 숨 소리가 내 것밖에 안 들려요.',
    src: IMAGINE,
    when: (v) => v.s.tau > 30 * DAY && !v.s.flags.face, rate: (v) => 0.06,
    options: [
      { label: '마주 본다', hint: '움직이지 않는 게 나을지도 몰라요.', go: (v) => chance(0.7) ? { text: '한참을 서로 봤어요. 그것이 먼저 고개를 조금 기울였어요. 그리고 뒤로 멀어져 사라졌어요.', morale: 0.05, flag: 'face', flag2: 'contact' } : { text: '그것이 손을 뻗어 내 헬멧을 건드렸어요. 산소 경보가 울렸어요. 안으로 뛰어들었어요.', health: -0.1, morale: -0.15, flag: 'face', flag2: 'contact' } },
      { label: '눈을 감고 열까지 센다', hint: '환각이면 사라져요.', go: (v) => chance(0.5) ? { text: '열에 눈을 떴어요. 없었어요. 손목 카메라에는 아무것도 없었어요.', morale: -0.05, flag: 'face' } : { text: '열에 눈을 떴어요. 더 가까이 있었어요. 카메라에는 빛 번짐만 남았어요.', morale: -0.15, flag: 'face', flag2: 'contact' } },
      { label: '손목 카메라를 켠다', hint: '증거가 남을지도 몰라요.', go: (v) => chance(0.3) ? { text: '찍혔어요. 흐리지만 눈 두 개가 분명해요. 그 사진은 식탁 위에 두지 않기로 했어요.', flag: 'face', flag2: 'contact', morale: 0.05 } : { text: '카메라를 드는 사이 사라졌어요. 사진엔 내 손만 있어요.', flag: 'face' } },
    ],
  },
  {
    id: 'artifact', cat: 'sf', title: '화물칸에서 낮게 우는 소리', fx: 'glow',
    desc: (v) => '식량 상자 뒤에서 손바닥만 한 검은 물체가 울려요. 따뜻해요. 우리 것이 아니에요. 그들이 두고 간 것 같아요.',
    src: IMAGINE + ' · 영감: 2001 스페이스 오디세이',
    when: (v) => v.s.tau > 20 * DAY && !v.s.flags.artifact, rate: (v) => 0.1,
    options: [
      { label: '배전반에 대 본다', hint: '따뜻한 건 에너지가 있다는 뜻이에요.', go: (v) => chance(0.6) ? { text: '전력 계기가 올라갔어요. 그게 뭐든 배에 전기를 주고 있어요.', power: 0.25, flag: 'artifact', morale: 0.1 } : { text: '배전반이 튀었어요. 물체는 식었고 반나절 배가 어두웠어요.', power: -0.1, flag: 'artifact', delay: DAY / 2 } },
      { label: '에어록 밖으로 던진다', hint: '모르는 건 배에 두지 않는 게 원칙이에요.', go: (v) => chance(0.8) ? { text: '던졌어요. 창밖에서 한참 빛나다가 보이지 않게 됐어요.', flag: 'artifact' } : { text: '던졌어요. 다음 날 아침 같은 자리에 다시 있었어요. 더는 건드리지 않아요.', flag: 'artifact', morale: -0.1, flag2: 'contact' } },
      { label: '납 상자에 넣어 보관한다', hint: '선량계를 옆에 둬요.', go: (v) => chance(0.85) ? { text: '선량계는 조용해요. 밤이면 상자가 조금 울려요. 아무도 신경 쓰지 않는 척해요.', flag: 'artifact' } : { text: '선량계가 올라갔어요. 작지만 꾸준히. 상자를 더 두껍게 쌌어요.', dose: 0.05, flag: 'artifact' } },
    ],
  },
  {
    id: 'traders', cat: 'sf', title: '작은 배가 다가와 물건을 내밀어요', fx: 'saucer',
    desc: (v) => '우리 배의 반도 안 되는 크기. 창에 투명한 상자가 붙었고 안에 물이 가득해요. 반대쪽에 빈 상자가 하나. 거래 같아요.',
    src: IMAGINE,
    when: (v) => v.s.tau > 90 * DAY && !v.s.flags.traders, rate: (v) => 0.05,
    options: [
      { label: '머리카락 한 줌을 넣는다', hint: '우리에겐 흔한 것이에요.', go: (v) => ({ text: '빈 상자가 닫히고 물 상자가 열렸어요. 300리터. 분석기엔 그냥 물이에요. 아주 깨끗한.', water: 120, morale: 0.1, flag: 'traders', flag2: 'contact' }) },
      { label: '가족 사진을 넣는다', hint: '', go: (v) => chance(0.5) ? { text: '그들은 사진을 오래 들여다봤어요. 물 상자가 열렸고, 다음 날 사진이 에어록에 돌아와 있었어요. 뒷면에 모르는 표식 하나.', water: 120, morale: 0.15, flag: 'traders', flag2: 'contact' } : { text: '사진은 가져갔고 물 상자는 닫힌 채 멀어졌어요.', morale: -0.1, flag: 'traders', flag2: 'contact' } },
      { label: '아무것도 주지 않는다', hint: '', go: (v) => ({ text: '한 시간을 기다리다 떠났어요. 창에 물 상자 모양으로 물방울 자국이 남았어요.', flag: 'traders' }) },
    ],
  },
  {
    id: 'pod', cat: 'sf', title: '떠도는 캡슐 안에 잠든 사람', fx: 'glow',
    desc: (v) => '우리 항로 바로 옆. 작은 캡슐 안에 사람이 누워 있어요. 서리가 낀 유리 너머로 가슴이 아주 천천히 오르내려요. 우리 글자가 아닌 글자가 적혀 있어요.',
    src: IMAGINE + ' · 영감: 에일리언, 패신저스',
    when: (v) => v.s.tau > 100 * DAY && !v.s.flags.pod, rate: (v) => 0.06,
    options: [
      { label: '끌어 들여 깨운다', hint: '사람이 하나 늘어요. 아니면 다른 것이 늘어요.', go: (v) => chance(0.7) ? (() => { const [n] = newcomer(v); return { text: `깨어나는 데 이틀. ${n}이라고 했어요. 우리처럼 끌려왔고 다른 배에 있었대요. 그 배는 이제 없대요.`, crewGain: 1, newMate: { name: n, role: '생존자' }, morale: 0.1, flag: 'pod' }; })() : { text: '깨어나지 않았어요. 캡슐을 열자 안은 비어 있었고 바닥에 모래 한 줌만 있었어요. 식량 창고가 그날 밤 10 % 비었어요.', food: -60, morale: -0.15, flag: 'pod', flag2: 'contact' } },
      { label: '밧줄로 묶어 끌고 간다', hint: '지구에서 깨우면 돼요. 속도가 조금 줄어요.', go: (v) => ({ text: '배 뒤에 캡슐이 따라와요. 밤마다 그쪽을 한 번씩 봐요.', vFactor: 0.97, flag: 'pod', morale: 0.03 }) },
      { label: '지나간다', hint: '', go: (v) => ({ text: '캡슐은 뒤로 멀어졌어요. 유리 너머 눈이 떠진 것처럼 보였어요. 아마 서리였겠죠.', morale: -0.08, flag: 'pod' }) },
    ],
  },
  {
    id: 'whale', cat: 'sf', title: '거대한 그림자가 노래해요', fx: 'glow',
    desc: (v) => '별들이 한 줄로 가려지며 지나가요. 길이가 몇 km. 라디오에서 아주 낮은 소리가 느리게 오르내려요. 고래 소리 같아요.',
    src: IMAGINE + ' · 영감: 컨택트 (2016), 스타 트렉 IV',
    when: (v) => v.s.tau > 150 * DAY && !v.s.flags.whale, rate: (v) => 0.04,
    options: [
      { label: '같은 소리를 돌려보낸다', hint: '스피커를 안테나에 물려요.', go: (v) => chance(0.7) ? { text: '소리가 멈췄다가 더 길게 돌아왔어요. 두 시간 동안 번갈아 울었어요. 그것이 지나간 뒤 배가 조금 더 빨라져 있었어요.', vFactor: 1.05, morale: 0.2, flag: 'whale', flag2: 'contact' } : { text: '소리가 커졌어요. 배가 종처럼 울렸어요. 창 두 장에 금이 갔어요.', hull: -0.1, morale: -0.1, flag: 'whale', flag2: 'contact' } },
      { label: '엔진을 끄고 조용히 있는다', hint: '', go: (v) => ({ text: '그림자는 한나절 걸려 지나갔어요. 배 전체가 그 소리에 맞춰 떨렸어요. 다들 바닥에 누워 들었어요.', morale: 0.1, delay: DAY / 2, flag: 'whale', flag2: 'contact' }) },
      { label: '속도를 올려 벗어난다', hint: '연료를 써요.', go: (v) => ({ text: '뒤로 멀어졌어요. 소리는 사흘 더 라디오에 남았어요.', fuel: -0.05, flag: 'whale' }) },
    ],
  },
  {
    id: 'seeds', cat: 'sf', title: '재배실에 심지 않은 싹', fx: 'glow',
    desc: (v) => '구석 화분에서 우리 씨앗이 아닌 싹이 올라왔어요. 잎이 검푸르고 밤이면 희미하게 빛나요.',
    src: IMAGINE + ' · 영감: 어나이얼레이션 (2018)',
    when: (v) => v.ship.eco && v.s.tau > 60 * DAY && !v.s.flags.seeds, rate: (v) => 0.12,
    options: [
      { label: '키워 본다', hint: '먹을 수 있을지는 몰라요.', go: (v) => { const r = R(); return r < 0.5 ? { text: '한 달 만에 천장까지 자랐어요. 열매는 달고 영양 분석도 멀쩡해요. 식량표가 늘었어요.', food: 150, morale: 0.15, flag: 'seeds' } : r < 0.8 ? { text: '먹을 건 안 됐어요. 대신 밤이면 재배실이 푸르게 빛나요. 다들 거기서 잠들어요.', morale: 0.12, flag: 'seeds' } : { text: '잎을 만진 손에 발진이 났어요. 뿌리가 물 배관까지 들어갔어요. 결국 태웠어요.', health: -0.1, water: -20, flag: 'seeds' }; } },
      { label: '뿌리까지 태운다', hint: '', go: (v) => chance(0.85) ? { text: '태웠어요. 재배실에 사흘 동안 단내가 났어요.', flag: 'seeds' } : { text: '태웠어요. 보름 뒤 다른 화분에서 다시 올라왔어요. 이번엔 두 개.', flag: 'seeds', morale: -0.05 } },
      { label: '밀봉 상자에 옮겨 지구로 가져간다', hint: '', go: (v) => ({ text: '상자 안에서 빛나며 자라요. 아무도 뚜껑을 열지 않아요.', flag: 'seeds', morale: 0.05 }) },
    ],
  },
  {
    id: 'pet', cat: 'crew', title: '식량 창고에 작은 생물',
    desc: (v) => '손바닥 크기, 다리 여섯, 눈은 둘. 상자 틈에 들어 있었어요. 우리 식량을 조금 먹었어요. 1973년 스카이랩엔 거미 두 마리가 타고 있었어요.',
    src: 'Skylab 3 (1973) 거미 Arabella·Anita 실험; ' + IMAGINE,
    when: (v) => v.s.tau > 10 * DAY && !v.s.flags.pet, rate: (v) => 0.1,
    options: [
      { label: '먹이를 주고 키운다', hint: '식량이 아주 조금 줘요. 이름이 생겨요.', go: (v) => chance(0.85) ? { text: `이름은 ${pick(['아라벨라', '여섯이', '손님', '승객', '모리'])}. 조종실 천장에 집을 지었어요. 밤이면 작은 소리를 내요.`, food: -5, morale: 0.15, flag: 'pet' } : { text: '한 달 뒤 두 마리가 됐어요. 석 달 뒤 스무 마리. 창고를 다 뒤져 상자째 내보냈어요.', food: -40, morale: -0.05, flag: 'pet' } },
      { label: '밀봉해 연구한다', hint: '', go: (v) => ({ text: '물도 공기도 없이 멀쩡해요. 지구 생물학자들이 좋아할 거예요.', flag: 'pet', morale: 0.05 }) },
      { label: '밖으로 내보낸다', hint: '', go: (v) => ({ text: '에어록이 열리자 가만히 떠올랐어요. 마지막까지 우리를 보고 있었어요.', morale: -0.05, flag: 'pet' }) },
    ],
  },
  {
    id: 'beacon', cat: 'sf', title: '앞길에 등대', fx: 'glow',
    desc: (v) => '항로 앞쪽에서 7초마다 한 번씩 짧은 전파가 와요. 자연에는 이렇게 규칙적인 것이 펄서밖에 없는데, 펄서는 아니에요. 지구 쪽을 가리켜요.',
    src: IMAGINE,
    when: (v) => v.s.f > 0.2 && v.s.f < 0.8 && !v.s.flags.beacon, rate: (v) => 0.05,
    options: [
      { label: '등대를 따라간다', hint: '누가 세웠는지 몰라요. 길은 곧아 보여요.', go: (v) => chance(0.8) ? { text: '신호를 따라가니 항로 오차가 사라졌어요. 보정 연료가 남아요.', navRisk: -0.15, fuel: 0.05, morale: 0.1, flag: 'beacon', flag2: 'contact' } : { text: '한 달 뒤 신호가 꺾였어요. 우리도 꺾였어요. 알아차리는 데 두 달.', delayFrac: 0.04, navRisk: 0.1, morale: -0.1, flag: 'beacon' } },
      { label: '무시하고 별로 항법한다', hint: '', go: (v) => ({ text: '신호는 지구가 가까워질수록 약해지다 사라졌어요.', flag: 'beacon' }) },
    ],
  },
  {
    id: 'dream', cat: 'mind', title: '모두 같은 꿈을 꿨어요', fx: 'eyes',
    desc: (v) => many(v) ? `아침 식탁에서 ${who(v)}이 꿈 얘기를 꺼냈고, 다들 숟가락을 멈췄어요. 같은 복도, 같은 빛, 같은 얼굴들. 같은 말: "돌아와."` : '같은 꿈이 사흘째예요. 긴 복도, 빛, 그리고 큰 눈. 마지막엔 늘 같은 말이에요. "돌아와."',
    src: IMAGINE,
    when: (v) => v.s.flags.abductors || v.s.flags.memory || v.s.flags.face, rate: (v) => 0.15, once: 'dream', trigger: (v) => (v.s.flags.abductors || v.s.flags.memory) && chance(0.003),
    options: [
      { label: '꿈을 전부 받아 적는다', hint: '', go: (v) => ({ text: '적어 보니 복도 끝에 문이 있었고, 그 문은 우리 배 모양이었어요. 더는 그 꿈을 꾸지 않아요.', morale: 0.05, flag: 'dream' }) },
      { label: '수면제를 먹는다', hint: '', go: (v) => ({ text: '꿈 없는 잠. 일주일 뒤 끊었어요. 꿈도 돌아오지 않았어요.', health: -0.02, flag: 'dream' }) },
      { label: '뒤를 돌아본다', hint: '', go: (v) => ({ text: '뒤쪽 카메라를 켰어요. 별들 사이에 아무것도 없었어요. 삼십 분 동안 아무것도. 그리고 불빛 하나가 꺼졌어요.', morale: -0.1, flag: 'dream', flag2: 'contact' }) },
    ],
  },
  {
    id: 'clock', cat: 'sf', title: '두 시계가 달라요', fx: 'dim',
    desc: (v) => '항법 시계와 손목시계가 여섯 시간 차이 나요. 어제까지 같았어요. 모두 똑같이 피곤하고, 식량이 하루치 더 비었어요.',
    src: IMAGINE + ' · 영감: 인터스텔라, 미싱 타임 보고들',
    when: (v) => v.s.tau > 30 * DAY && !v.s.flags.clock, rate: (v) => 0.05,
    options: [
      { label: '카메라 기록을 돌려 본다', hint: '', go: (v) => chance(0.5) ? { text: '여섯 시간 동안 모든 카메라가 같은 하얀 화면이에요. 그 앞뒤로 우리는 그냥 자고 있어요.', morale: -0.12, flag: 'clock', flag2: 'contact' } : { text: '컴퓨터 시계가 한 번 뒤로 갔다 돌아온 기록이 있어요. 소프트웨어 오류래요. 손목시계도요?', morale: -0.05, flag: 'clock' } },
      { label: '시계를 맞추고 넘어간다', hint: '', go: (v) => ({ text: '맞췄어요. 그 뒤로 다들 손목시계를 두 개씩 차요.', flag: 'clock' }) },
    ],
  },
  {
    id: 'voice', cat: 'sf', title: (v) => `컴퓨터가 ${dead(v)[0]?.name}의 목소리로 말해요`,
    desc: (v) => `아침 보고를 읽는 목소리가 바뀌었어요. ${dead(v)[0]?.name}이에요. 그 사람 음성 기록이 저장돼 있었고, 컴퓨터가 "승무원이 더 편안해할 것"으로 판단했대요.`,
    src: SF('문 (2009), 허 (2013)'),
    when: (v) => dead(v).length > 0 && !v.s.flags.voice, rate: (v) => 0.5,
    options: [
      { label: '원래 목소리로 돌린다', hint: '', go: (v) => ({ text: '돌렸어요. 그날 밤 그 사람 칸 문을 오래 보고 있었어요.', morale: -0.05, flag: 'voice' }) },
      { label: '그대로 둔다', hint: '', go: (v) => chance(0.6) ? { text: '처음엔 아무도 말을 못 했어요. 한 달 뒤엔 아침마다 "좋은 아침"이라고 답해요.', morale: 0.08, flag: 'voice' } : { text: '한 사람이 밤마다 컴퓨터와 이야기해요. 몇 시간씩. 끄기로 했어요.', morale: -0.1, flag: 'voice' } },
    ],
  },
  {
    id: 'oumuamua', cat: 'rock', title: '길쭉한 바위가 나란히 가요',
    desc: (v) => '길이 몇백 m, 담배처럼 길고 붉어요. 2017년 지구 곁을 지난 오우무아무아처럼 햇빛만으로는 설명이 안 되는 만큼 살짝 밀려 가요.',
    src: "1I/ʻOumuamua (2017) 관측: 길이 100–400 m, 비중력 가속 (Micheli 2018); " + IMAGINE,
    when: (v) => v.rAU() > 2 && !v.s.flags.oumuamua, rate: (v) => 0.05,
    options: [
      { label: '가까이 가서 표면을 찍는다', hint: '연료와 열흘.', go: (v) => chance(0.7) ? { text: '금속처럼 반짝이는 면이 있었어요. 자연 바위일 수도 있어요. 사진 삼천 장.', fuel: -0.05, delay: 10 * DAY, morale: 0.15, flag: 'oumuamua' } : { text: '가까이 가자 바위가 천천히 돌아 우리 쪽에 평평한 면을 보였어요. 그 면은 거울처럼 우리 배를 비췄어요. 돌아왔어요.', fuel: -0.05, delay: 10 * DAY, morale: -0.05, flag: 'oumuamua', flag2: 'contact' } },
      { label: '멀리서 관측만 한다', hint: '', go: (v) => ({ text: '사흘 동안 나란히 갔어요. 가스는 안 뿜는데 조금씩 빨라져요. 그러다 뒤로 멀어졌어요.', morale: 0.05, flag: 'oumuamua' }) },
    ],
  },
  {
    id: 'dyson', cat: 'sf', title: '별 둘레에 그림자 조각들', fx: 'dim',
    desc: (v) => '지나가는 별의 빛이 규칙적으로 깜빡여요. 큼직한 무언가가 궤도를 돌아요. 수백 개. 2015년 타비의 별도 이렇게 깜빡여 소동이 났었어요.',
    src: "KIC 8462852 (타비의 별) 밝기 변화 (Boyajian 2016); " + IMAGINE,
    when: (v) => v.from.kind !== 'solar' && v.rAU() > 1e4 && !v.s.flags.dyson, rate: (v) => 0.04,
    options: [
      { label: '망원경으로 한 달 지켜본다', hint: '', go: (v) => chance(0.5) ? { text: '그림자들이 서로 자리를 바꿔요. 바위는 그렇게 안 움직여요. 지구에 보낼 가장 긴 보고서를 썼어요.', morale: 0.2, flag: 'dyson', flag2: 'contact' } : { text: '먼지 구름이었어요. 아마도. 그래도 사진은 아름다웠어요.', morale: 0.08, flag: 'dyson' } },
      { label: '그쪽으로 신호를 보낸다', hint: '답은 수십 년 뒤에나 와요.', go: (v) => ({ text: '소수 열 개와 우리 배 그림을 보냈어요. 답은 지구에서 받게 되겠죠. 누군가가.', flag: 'dyson', morale: 0.05 }) },
    ],
  },
  // ================= 실제로 일어날 법한 일 =================
  {
    id: 'tvecho', cat: 'signal', title: (v) => `${tvYear(v)}년 방송이 잡혀요`,
    desc: (v) => `지구에서 떠난 전파가 여기까지 오는 데 ${Math.round(v.earthDistAU() * AU / LY)}년. 라디오에 ${tvYear(v)}년의 방송이 들려요. 지구에선 오래전 소리지만 여기에는 지금 도착했어요.`,
    src: '전파는 빛의 속도로 간다: 거리 N 광년 = N 년 전의 방송 (실제 물리)',
    when: (v) => { const ly = v.earthDistAU() * AU / LY; return ly > 1 && ly < 100 && !v.s.flags.noantenna; }, rate: (v) => 0.3, once: 'tvecho', trigger: (v) => { const ly = v.earthDistAU() * AU / LY; return ly > 1 && ly < 100 && !v.s.flags.noantenna && chance(0.002); },
    options: [
      { label: '밤새 듣는다', hint: '', go: (v) => ({ text: `잡음 사이로 노래 한 토막과 광고. 다 같이 식탁에 모여 들었어요. ${tvYear(v) < 1990 ? '부모님이 젊었던 해예요.' : '어릴 때 들은 노래예요.'}`, morale: 0.15 }) },
      { label: '녹음해 둔다', hint: '', go: (v) => ({ text: '열두 시간 녹음. 지구에 돌아가면 그 해 방송표와 맞춰 볼 거예요.', morale: 0.05 }) },
    ],
  },
  {
    id: 'kidney', cat: 'med', title: '옆구리가 끊어질 듯 아파요',
    desc: (v) => '무중력에서는 뼛속 칼슘이 오줌으로 빠져 결석이 잘 생겨요. 우주비행사들이 가장 두려워하는 통증 중 하나예요.',
    src: 'NASA 신장 결석 위험 (Pietrzyk 2007): 비행 중 발생 사례 다수; ISS 초음파 쇄석 연구',
    rate: (v) => 0.08,
    options: [
      { label: '물을 많이 마시고 기다린다', hint: '작은 돌은 며칠이면 나와요. 물을 써요.', go: (v) => chance(0.7) ? { text: '나흘째 밤에 나왔어요. 좁쌀만 한 것이 그렇게 아팠어요.', water: -8, health: -0.03 } : { text: '열흘을 아파했어요. 결국 나왔지만 체중이 빠졌어요.', water: -15, health: -0.1 } },
      { label: '초음파로 깨 본다', hint: 'ISS 에서 시험한 장비예요. 서툴면 다쳐요.', go: (v) => chance(0.6) ? { text: '세 번 쏘자 부서졌어요. 이틀 뒤 가루로 나왔어요.', health: -0.02 } : { text: '돌은 안 깨지고 멍이 들었어요. 결국 물로 밀어냈어요.', health: -0.08, water: -10 } },
      { label: '진통제만 먹고 일한다', hint: '', go: (v) => chance(0.5) ? { text: '진통제 여섯 알. 일주일 뒤 나왔어요.', health: -0.05 } : { text: '감염이 왔어요. 열이 나고 항생제를 열흘 맞았어요.', health: -0.15 } },
    ],
  },
  {
    id: 'vision', cat: 'body', title: '글자가 흐려 보여요',
    desc: (v) => '우주비행사의 60 % 가 겪는 일이에요. 머리로 몰린 체액이 안구 뒤를 눌러요. 안경이 필요해졌어요.',
    src: 'NASA SANS (우주비행 관련 신경안구 증후군), 장기 체류 60 % 이상 보고 (Lee 2020)',
    when: (v) => v.s.tau > 180 * DAY && !v.s.flags.vision, rate: (v) => 0.3,
    options: [
      { label: '예비 안경을 꺼낸다', hint: 'NASA 는 늘 여러 도수를 실어요.', go: (v) => ({ text: '+1.5 가 맞았어요. 화면 글자를 키웠어요.', flag: 'vision' }) },
      { label: '하체 음압 장치를 매일 쓴다', hint: '피를 아래로 끌어내려요. 하루 한 시간.', go: (v) => chance(0.6) ? { text: '한 달 뒤 조금 나아졌어요. 매일 한 시간은 그 안에서 보내요.', flag: 'vision', health: 0.02 } : { text: '별 차이 없었어요. 결국 안경.', flag: 'vision' } },
    ],
  },
  {
    id: 'tooth', cat: 'med', title: '어금니가 부서졌어요',
    desc: (v) => '딱딱한 비스킷에. 신경이 드러나 찬 물이 닿으면 눈물이 나요. 의무 상자에 임시 충전재가 있어요.',
    src: 'NASA 우주 치과 응급 훈련; 남극 기지 치과 사례 (연 1–2건/50명)',
    rate: (v) => 0.1,
    options: [
      { label: '임시 충전재로 메운다', hint: '거울 보며 혼자 하거나, 동료가 해 줘요.', go: (v) => chance(many(v) ? 0.85 : 0.65) ? { text: `${many(v) ? who(v) + '이 손전등을 물고 메워 줬어요.' : '거울 보며 메웠어요.'} 두 달은 가요.`, health: -0.01 } : { text: '충전재가 사흘 만에 빠졌어요. 다시, 또 다시. 결국 부드러운 것만 먹어요.', health: -0.04, morale: -0.05 } },
      { label: '뽑는다', hint: '진통제와 집게. 한 번에 끝나요.', go: (v) => chance(0.7) ? { text: '뽑았어요. 피가 삼십 분 났어요. 끝.', health: -0.03 } : { text: '뿌리가 남았어요. 잇몸이 부었고 항생제를 먹었어요.', health: -0.1 } },
    ],
  },
  {
    id: 'spider', cat: 'crew', title: '재배실에 거미줄',
    desc: (v) => '씨앗 상자에 묻어 온 거미 한 마리가 재배실 조명 아래 줄을 쳤어요. 1973년 스카이랩의 아라벨라도 사흘 만에 무중력 거미줄을 배웠어요.',
    src: 'Skylab 3 (1973) 거미 Arabella 실험',
    when: (v) => v.ship.eco && !v.s.flags.spider, rate: (v) => 0.3,
    options: [
      { label: '둔다', hint: '진딧물을 잡아 줘요.', go: (v) => ({ text: '이름은 아라벨라 2세. 재배실 진딧물이 사라졌어요. 아침마다 거미줄부터 확인해요.', morale: 0.1, flag: 'spider' }) },
      { label: '치운다', hint: '', go: (v) => ({ text: '치웠어요. 일주일 뒤 다른 구석에 줄이 있었어요.', flag: 'spider' }) },
    ],
  },
  {
    id: 'solar-ship', cat: 'sun', title: '태양이 가까워져요',
    desc: (v) => `${v.rAU().toFixed(2)} AU. 지구보다 태양에 가까운 길이에요. 선체 온도가 오르고 냉각 펌프가 쉬지 않아요.`,
    src: 'Parker Solar Probe 열 차폐 설계; Mercury 표면 온도 430 °C',
    when: (v) => v.rAU() < 0.75 && !v.s.flags.hot, rate: (v) => 3,
    options: [
      { label: '배를 돌려 그늘을 만든다', hint: '열 차폐판을 태양 쪽으로. 안테나가 반나절 지구를 못 봐요.', go: (v) => ({ text: '선체 온도가 내려갔어요. 안테나는 하루 두 번만 지구를 봐요.', flag: 'hot', power: 0.05 }) },
      { label: '냉각수를 더 돌린다', hint: '물을 써요.', go: (v) => ({ text: '물탱크가 라디에이터 역할을 해요. 마실 물이 줄었어요.', water: -20, flag: 'hot' }) },
    ],
  },
  {
    id: 'lost-tool', cat: 'rock', title: '공구 가방이 떠내려갔어요',
    desc: (v) => '선체 작업 중 손에서 미끄러졌어요. 2008년 ISS 에서도 10만 달러짜리 가방이 그렇게 사라졌어요. 렌치 세트와 예비 볼트가 들어 있었어요.',
    src: 'ISS STS-126 (2008) 공구 가방 분실',
    rate: (v) => 0.15,
    options: [
      { label: '분사 장치로 쫓아간다', hint: '우주복 추진기 연료는 한 번 왕복분이에요.', go: (v) => chance(0.5) ? { text: '잡았어요. 돌아올 때 연료 경고등이 켜졌어요.', morale: 0.05 } : { text: '놓쳤어요. 연료 바닥. 줄을 당겨 돌아왔어요.', health: -0.03, morale: -0.1 } },
      { label: '포기하고 3D 프린터로 만든다', hint: '', go: (v) => ({ text: '렌치 하나에 열한 시간. 플라스틱이라 두 번 쓰면 닳아요.', power: -0.03, delay: DAY }) },
    ],
  },
];

// 창밖에 보이는 순간: 선택은 없고 창밖 연출(fx)과 기록만. rate 는 1년당, 동면 중엔 안 뜬다
export const SIGHTS = [
  { id: 's-meteor', cat: 'rock', fx: 'meteor', rate: (v) => v.rAU() < 6 ? 1.2 : 0.3, text: () => pick(['유성 하나가 창을 가로질렀어요. 소리는 없어요.', '먼지 알갱이가 선체에 부딪혀 창 모서리가 반짝였어요.', '유성 두 개가 나란히 지나갔어요.']), morale: 0.02 },
  { id: 's-aurora', cat: 'sun', fx: 'aurora', when: (v) => (v.rAU() > 4.8 && v.rAU() < 5.6) || v.earthDistAU() < 0.01, rate: (v) => 6, text: (v) => v.earthDistAU() < 0.01 ? '지구 극지방 위로 초록 오로라가 커튼처럼 흘러요.' : '목성의 극이 오로라로 빛나요. 지구 것의 수백 배 밝아요.', morale: 0.05 },
  { id: 's-flare', cat: 'sun', fx: 'flash', when: (v) => v.rAU() < 3, rate: (v) => 0.8, text: () => '태양 가장자리에서 플레어가 터졌어요. 창 필터가 자동으로 어두워졌어요.', morale: 0.01 },
  { id: 's-comet', cat: 'rock', fx: 'comet', rate: (v) => 0.25, text: () => '혜성 하나가 긴 꼬리를 늘이고 지나가요. 꼬리는 태양 반대쪽을 가리켜요.', morale: 0.05 },
  { id: 's-zodiac', cat: 'sun', fx: 'glow', when: (v) => v.rAU() < 3 && v.rAU() > 0.5, rate: (v) => 0.4, text: () => '황도광. 태양 둘레 먼지가 비추는 희미한 빛이 창 아래쪽을 채워요.', morale: 0.02 },
  { id: 's-lightning', cat: 'sun', fx: 'lightning', when: (v) => v.rAU() > 4.8 && v.rAU() < 5.6, rate: (v) => 8, text: () => '목성 밤쪽 구름에서 번개가 쳐요. 하나가 지구 번개 천 개 밝기예요.', morale: 0.03 },
  { id: 's-eclipse', cat: 'earth', fx: 'dim', when: (v) => v.earthDistAU() < 0.02 && v.s.f > 0.5, rate: (v) => 4, text: () => '달이 태양을 가렸어요. 두 분 동안 코로나만 보였어요.', morale: 0.05 },
  { id: 's-milky', cat: 'nav', fx: 'stars', when: (v) => v.rAU() > 100, rate: (v) => 0.3, text: () => '불을 다 끄고 창밖을 봤어요. 은하수가 머리 위에서 발 아래까지 이어져요.', morale: 0.05 },
  { id: 's-eyes', cat: 'sf', fx: 'eyes', when: (v) => v.s.flags.contact, rate: (v) => 0.3, text: () => pick(['창밖 어둠 속에 빛 두 점이 나란히 떠 있다가 사라졌어요.', '뒤쪽 카메라에 불빛 하나가 따라오고 있어요. 레이더엔 없어요.']), morale: -0.03 },
  { id: 's-earthrise', cat: 'earth', fx: 'earth', when: (v) => v.earthDistAU() < 0.05 && v.s.f > 0.5 && !v.s.flags.erise, rate: (v) => 40, text: (v) => { v.s.flags.erise = true; return '창 아래쪽에서 파란 호가 올라와요. 구름, 바다, 그리고 밤쪽의 도시 불빛.'; }, morale: 0.15 },
];
