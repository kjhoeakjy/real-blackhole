// 항해 중 일어나는 사건. 각 사건은 실제 기록(출처 src)에 바탕을 두고, 선택의 결과는 숨겨진 확률로 정해진다.
// rate: 1년당 일어날 횟수(푸아송), trigger: 한 번만 일어나는 조건. go(v) 는 결과 문장과 효과를 돌려준다.
// cat: 아이콘·색 분류 (sun, fire, air, water, med, crew, mind, comp, rock, nav, power, body, signal, bh, earth)
import { AU, DAY, YEAR, c } from '../physics/constants.js';

const R = Math.random;
const chance = (p) => R() < p;
const U = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const hours = (s) => `${Math.round(s / 3600)}시간`;
const fmtDelay = (s) => s < 90 ? `${Math.round(s)}초` : s < 2 * 3600 ? `${Math.round(s / 60)}분` : s < 2 * DAY ? `${(s / 3600).toPrecision(2)}시간` : s < YEAR ? `${Math.round(s / DAY)}일` : `${(s / YEAR).toPrecision(2)}년`;

export const EVENTS = [
  // ---------- 태양 ----------
  {
    id: 'spe', cat: 'sun', title: '태양 폭풍 경보',
    desc: (v) => `태양 관측 위성이 양성자 폭풍을 알려요. 1972년 8월에 온 것과 같은 급이에요. 두꺼운 벽 뒤로 가면 안전하지만, 지금 하던 수리를 멈춰야 해요.`,
    src: 'Townsend et al. 2006 (1972년 8월 사건: 얇은 벽 뒤 1–4 Sv); NASA SRAG; 태양 주기당 1–2회',
    when: (v) => v.rAU() < 40, rate: (v) => 0.15 * Math.min(10, 1 / Math.max(0.05, v.rAU()) ** 2),
    options: [
      { label: '대피실로 들어간다', hint: '물탱크나 식량 상자를 둘러 만든 좁은 방이에요. 폭풍은 하루 이틀이면 지나가요.',
        go: (v) => ({ text: `물탱크 뒤에서 ${pick(['열여덟', '스물두', '서른'])} 시간을 보냈어요. 선량계는 0.1 Sv 를 가리켜요.`, dose: 0.1, delay: 1 * DAY }) },
      { label: '하던 일을 마저 한다', hint: '폭풍이 오는 데 30분에서 몇 시간이 걸려요. 운이 좋으면 약한 폭풍이에요.',
        go: (v) => { const d = U(0.8, 4); return { text: d > 2 ? `폭풍이 한창일 때까지 밖에 있었어요. 몇 시간 뒤 구토가 시작됐어요. ${d.toFixed(1)} Sv.` : `생각보다 약했어요. ${d.toFixed(1)} Sv 를 받았지만 몸은 멀쩡해요.`, dose: d, acute: d }; } },
      { label: '30분만 지켜본다', hint: '경보의 절반쯤은 지구까지 오지 않는 폭풍이에요. 하지만 양성자는 빛보다 조금 느릴 뿐이에요.',
        go: (v) => chance(0.5) ? { text: '폭풍은 다른 쪽으로 갔어요. 경보는 30분 뒤 풀렸어요.', morale: 0.03 } : (() => { const d = U(0.4, 1.5); return { text: `아니었어요. 대피실로 뛰어드는 사이 ${d.toFixed(1)} Sv 를 받았어요.`, dose: d, acute: d }; })() },
    ],
  },
  // ---------- 불 ----------
  {
    id: 'smoke', cat: 'fire', title: '연기 경보',
    desc: (v) => '경보가 울리고 타는 냄새가 나요. 1997년 미르에서는 산소 카트리지에 붙은 불이 14분 동안 탔어요. ISS 경보의 대부분은 오보지만, 냄새가 나면 다르죠.',
    src: 'Mir 화재 1997-02-23 (Linenger 보고); ISS 연기 경보 기록',
    rate: (v) => 0.3,
    options: [
      { label: '마스크 쓰고 소화기를 든다', hint: 'ISS 절차 그대로예요. 연기를 들이마실 수 있어요.',
        go: (v) => { const real = chance(0.3); if (!real) return { text: '과열된 저항기였어요. 소화기 하나를 비웠지만 불은 없었어요.' }; return chance(0.9) ? { text: '전선 다발에서 난 불이었어요. 1분 만에 껐어요. 타 버린 회로 때문에 전력이 조금 줄었어요.', power: -0.05 } : { text: '불은 껐지만 마스크 틈으로 연기를 마셨어요. 며칠을 기침하며 보냈어요.', health: -0.2, power: -0.05 }; } },
      { label: '그 칸을 닫고 공기를 뺀다', hint: '공기가 없으면 불은 꺼져요. 대신 그 칸의 장비가 망가지고 복구에 시간이 걸려요.',
        go: (v) => chance(0.3) ? { text: '불이었어요. 공기를 빼자 바로 꺼졌지만, 그 칸의 장비를 하루 종일 다시 살렸어요.', power: -0.1, delay: DAY } : { text: '오보였어요. 공기를 뺐다 채우느라 하루를 썼어요.', delay: DAY, morale: -0.05 } },
      { label: '냄새가 가라앉나 본다', hint: '무중력에서 불꽃은 둥글고 느리지만 저절로 꺼지지 않아요.',
        go: (v) => { if (!chance(0.3)) return { text: '냄새는 한 시간 뒤 사라졌어요. 경보도 멈췄어요.' }; return chance(0.3) ? { death: '불이 칸을 넘어 번졌어요. 소유즈 승무원들이 1997년 두려워하던 그대로였어요.' } : { text: '불이었어요. 뒤늦게 껐지만 벽 한쪽이 그을리고 연기를 많이 마셨어요.', hull: -0.1, health: -0.15 }; } },
    ],
  },
  // ---------- 공기 ----------
  {
    id: 'oga', cat: 'air', title: '산소 발생기가 멈췄어요',
    desc: (v) => `물을 전기로 쪼개 산소를 만드는 장치가 섰어요. 비축 산소는 ${Math.round(v.s.o2)}일치예요.`,
    src: 'Mir Elektron 고장 기록; ISS OGA 정비 이력 (연 수 회)',
    when: (v) => v.s.oga, rate: (v) => 0.5,
    options: [
      { label: '뜯어서 고친다', hint: '미르의 엘렉트론과 ISS 의 OGA 는 수없이 고장 났고 매번 승무원이 고쳤어요. 손이 둘이면 더 쉬워요.',
        go: (v) => chance(v.s.crewAlive > 1 ? 0.85 : 0.65) ? { text: '이틀 걸렸어요. 막힌 전해조를 씻어 내니 다시 거품이 올라와요.', delay: 2 * DAY } : { text: '고장 난 부품이 하나가 아니었어요. 예비 부품이 없어요. 비축 산소로 버티며 방법을 찾아야 해요.', oga: false } },
      { label: '화학 산소통을 태운다', hint: '카트리지 하나가 한 사람 하루치예요. 1997년 미르 화재가 이 카트리지에서 났어요.',
        go: (v) => chance(0.03) ? (chance(0.5) ? { death: '카트리지에 불이 붙었어요. 1997년 미르와 같은 불이었지만 이번엔 꺼지지 않았어요.' } : { text: '카트리지에 불이 붙었어요. 가까스로 껐지만 손과 얼굴에 화상을 입었어요.', health: -0.3, o2: 30, oga: false }) : { text: '통을 태우며 버텨요. 산소 발생기는 나중에 손보기로 했어요.', o2: 60, oga: false } },
      { label: '재배실 식물에 맡긴다', when: (v) => v.ship.eco, hint: '사람 하나의 산소를 대려면 잎 수십 m² 가 필요해요. BIOS-3 는 해냈지만 아슬아슬했어요.',
        go: (v) => chance(0.8) ? { text: '재배실 조명을 최대로 올렸어요. 이산화탄소 수치가 천천히 내려가요. 발생기는 천천히 고쳐요.', power: -0.05, oga: true } : { text: '식물만으로는 모자랐어요. 결국 뜯어서 고쳤고, 사흘을 흘려보냈어요.', delay: 3 * DAY } },
    ],
  },
  {
    id: 'oga-retry', cat: 'air', title: '산소가 줄어요',
    desc: (v) => `비축 산소가 ${Math.max(0, Math.round(v.s.o2))}일치 남았어요. 산소 발생기를 다시 손볼 때예요.`,
    src: 'ISS OGA 정비 이력',
    when: (v) => !v.s.oga && v.s.o2 < 45, rate: (v) => 24,
    options: [
      { label: '다른 장치의 부품을 뜯어 쓴다', hint: '물 재활용기와 산소 발생기는 같은 종류의 펌프를 써요.',
        go: (v) => chance(0.75) ? { text: '재활용기 펌프를 옮겨 달았어요. 산소가 돌아왔어요. 물은 당분간 아껴 써요.', oga: true, recycler: false } : { text: '옮겨 단 펌프도 돌지 않았어요. 산소가 더 줄어요.', o2: -10 } },
      { label: '숨을 아낀다 — 잠을 늘리고 운동을 끊는다', hint: '잠잘 때 산소 소비는 깨어 있을 때의 70 % 예요.',
        go: (v) => ({ text: '하루 열네 시간을 자요. 산소는 조금 더 오래 가요.', o2: 15, health: -0.1, morale: -0.1 }) },
    ],
  },
  // ---------- 물 ----------
  {
    id: 'water', cat: 'water', title: '물 재활용기가 멈췄어요',
    desc: (v) => `땀과 오줌을 다시 물로 만드는 장치예요. ISS 는 98 % 를 되돌려요. 비축 물은 ${Math.round(v.s.water)}일치.`,
    src: 'NASA ISS 물 회수 98 % (2023); ISS WPA 필터 교체 이력',
    when: (v) => v.s.recycler, rate: (v) => 0.4,
    options: [
      { label: '필터를 뜯어 손으로 씻는다', hint: '필터에 낀 생물막이 원인일 때가 많아요. 씻어 쓰면 세균이 남을 수 있어요.',
        go: (v) => chance(0.6) ? { text: '하루 걸려 필터를 씻었어요. 물맛이 조금 이상하지만 돌아가요.', delay: DAY } : { text: '씻은 필터에서 세균이 자랐어요. 일주일 배탈을 앓았어요.', health: -0.1, delay: DAY } },
      { label: '비축 물로 버티며 천천히 고친다', hint: '서두르지 않으면 제대로 고칠 수 있지만 비축 물이 줄어요.',
        go: (v) => ({ text: '일주일 동안 비축 물을 쓰며 고쳤어요. 이제 멀쩡해요.', water: -7 }) },
      { label: '오줌을 버리고 땀만 모은다', hint: '회수율이 절반으로 떨어져요. 고장은 그대로예요.',
        go: (v) => ({ text: '회수율이 절반으로 떨어졌어요. 물은 전보다 빨리 줄어요.', recycler: false }) },
    ],
  },
  // ---------- 몸 ----------
  {
    id: 'medical', cat: 'med', title: (v) => v._patientMe ? '배가 찢어질 듯 아파요' : '동료가 쓰러졌어요',
    desc: (v) => { v._patientMe = v.s.crewAlive === 1 || chance(1 / v.s.crewAlive); return v._patientMe ? '오른쪽 아랫배가 눌리면 더 아파요. 열도 나요. 맹장일 수 있어요. 지구는 ' + fmtDelay(v.commDelay()) + ' 거리예요.' : '동료가 식은땀을 흘리며 배를 움켜쥐어요. 맹장일 수 있어요. 지구는 ' + fmtDelay(v.commDelay()) + ' 거리예요.'; },
    src: 'NASA Integrated Medical Model: 중증 의료 사건 ≈ 0.06회/인·년 (Myers 2018); 남극 1961 로고조프 자가 맹장 수술',
    rate: (v) => 0.06 * v.s.crewAlive,
    options: [
      { label: '수술한다', hint: '1961년 남극에서 의사 로고조프는 자기 맹장을 직접 떼어냈어요. 무중력 수술은 동물 실험 단계예요.',
        go: (v) => { const ok = chance(v.s.crewAlive > 1 ? 0.8 : 0.45); return ok ? { text: '거울과 설명서를 보며 두 시간. 끝났어요. 열은 사흘 뒤 내렸어요.', health: v._patientMe ? -0.1 : 0 } : v._patientMe ? { death: '수술 도중 출혈이 멎지 않았어요.' } : { text: '동료를 살리지 못했어요. 창밖으로 보냈어요.', crewLost: 1, morale: -0.3 }; } },
      { label: '항생제로 버틴다', hint: '맹장염 환자의 대부분은 항생제만으로 낫지만, 터지면 끝이에요.',
        go: (v) => chance(0.6) ? { text: '열흘 동안 항생제를 맞았어요. 터지지 않았어요.', health: v._patientMe ? -0.05 : 0 } : v._patientMe ? { death: '맹장이 터졌어요. 항생제로는 막을 수 없었어요.' } : { text: '맹장이 터졌어요. 동료는 이틀을 버텼어요.', crewLost: 1, morale: -0.3 } },
      { label: '지구 의사에게 묻는다', when: (v) => !v.s.flags.noantenna && !v.s.flags.silence, hint: (v) => `한마디 보내고 답을 받는 데 ${fmtDelay(2 * v.commDelay())}. 그동안은 기다려야 해요.`,
        go: (v) => { const d = v.commDelay(); const ok = chance(d < 3600 ? 0.85 : d < DAY ? 0.65 : d < YEAR ? 0.3 : 0.1); return ok ? { text: `${fmtDelay(2 * d)} 뒤 답이 왔어요. 시키는 대로 했더니 나았어요.` } : v._patientMe ? { death: '답장은 너무 늦게 왔어요.' } : { text: '답장이 오기 전에 동료가 숨을 거뒀어요.', crewLost: 1, morale: -0.3 }; } },
    ],
  },
  {
    id: 'bone', cat: 'body', title: '다리가 가늘어졌어요',
    desc: (v) => '반년 무중력. 거울 속 다리가 눈에 띄게 가늘어요. 뼈는 한 달에 1 % 씩 빠지고 있어요.',
    src: 'NASA Human Research Program; LeBlanc et al. 2000 (골손실 1–1.5 %/월)',
    trigger: (v) => v.s.tau > 180 * DAY && !v.s.flags.bone, once: 'bone',
    options: [
      { label: '하루 2시간 운동을 시작한다', hint: 'ISS 승무원의 하루예요. 러닝머신·자전거·저항 기구.',
        go: (v) => ({ text: '매일 두 시간. 지루하지만 착륙 때 걸어 나갈 수 있을 거예요.', flag: 'exercise', morale: 0.05 }) },
      { label: '운동은 내키는 날만', hint: '착륙 충격을 버티는 건 뼈예요.',
        go: (v) => ({ text: '운동은 가끔. 1년 뒤면 들것이 필요할 거예요.', health: -0.1, flag: 'noexercise' }) },
      { label: '약으로 막는다 (비스포스포네이트)', hint: 'ISS 에서 실험한 골다공증 약이에요. 효과가 있었지만 위장을 상하게 해요.',
        go: (v) => chance(0.7) ? { text: '매주 한 알. 뼈는 거의 그대로예요.', flag: 'exercise' } : { text: '약이 위를 상하게 해 끊었어요. 운동으로 돌아갔어요.', health: -0.05, flag: 'exercise' } },
    ],
  },
  // ---------- 사람 ----------
  {
    id: 'conflict', cat: 'crew', title: '동료와 다퉜어요',
    desc: (v) => `${Math.round(v.s.tau / DAY)}일째. 식사 시간에 사소한 말로 시작됐어요. 좁은 곳에 오래 갇히면 넷째 분기쯤 갈등이 몰려요.`,
    src: 'Mars-500 심리 결과 (Basner et al. 2014); 남극 월동 "third-quarter phenomenon"; 스카이랩 4호 1973',
    when: (v) => v.s.crewAlive > 1 && v.s.tau > 60 * DAY, rate: (v) => 0.35,
    options: [
      { label: '다 같이 저녁을 먹자고 한다', hint: '미르 때부터 러시아 승무원들이 지켜 온 규칙이에요.',
        go: (v) => chance(0.7) ? { text: '말없이 먹다가 누군가 웃었어요. 풀렸어요.', morale: 0.1 } : { text: '저녁은 조용했어요. 아무도 먼저 말을 꺼내지 않았어요.', morale: -0.05 } },
      { label: '역할과 공간을 다시 나눈다', hint: 'Mars-500 에서 효과가 있던 방법이에요. 비상시 손발이 안 맞을 수 있어요.',
        go: (v) => chance(0.8) ? { text: '각자 구역이 생겼어요. 마주칠 일이 줄자 다툼도 줄었어요.', morale: 0.05 } : { text: '한 사람이 아예 말을 끊었어요. 배 안이 둘로 갈라졌어요.', morale: -0.15 } },
      { label: '선장 권한으로 끝낸다', hint: '1973년 스카이랩 4호 승무원은 과한 일정에 하루 통신을 끊었어요.',
        go: (v) => chance(0.5) ? { text: '당장은 조용해졌어요. 뒤에서 무슨 말이 오가는지는 몰라요.', morale: -0.1 } : { text: '뜻밖에 다들 받아들였어요. 누군가 정해 주길 바랐던 거예요.', morale: 0.05 } },
    ],
  },
  {
    id: 'lonely', cat: 'mind', title: '아무도 없는 시간',
    desc: (v) => `${Math.round(v.s.tau / DAY)}일 동안 목소리를 못 들었어요. 요즘은 잠이 오지 않아요.`,
    src: 'Mars-500 수면 연구 (Basner et al. 2013); NASA HERA 고립 실험',
    when: (v) => v.s.crewAlive === 1 && v.s.tau > 60 * DAY, rate: (v) => 0.35,
    options: [
      { label: '지구에 긴 편지를 쓴다', when: (v) => !v.s.flags.noantenna, hint: (v) => `답장은 ${fmtDelay(2 * v.commDelay())} 뒤에 와요.`,
        go: (v) => v.commDelay() < YEAR ? { text: `${fmtDelay(2 * v.commDelay())} 뒤에 답장이 왔어요. 몇 번이고 다시 읽었어요.`, morale: 0.12 } : { text: '답장은 살아서 못 받을 거예요. 그래도 썼어요.', morale: 0.04 } },
      { label: '일과표를 다시 짠다', hint: '남극 월동 대원들이 쓰는 방법이에요. 잠·운동·식사 시간을 고정해요.',
        go: (v) => ({ text: '6시 기상, 22시 소등. 몸이 먼저 따라왔어요.', morale: 0.06, health: 0.02 }) },
      { label: '수면제를 먹는다', hint: 'ISS 승무원의 4분의 3이 수면제를 써요.',
        go: (v) => chance(0.7) ? { text: '잤어요. 꿈은 없었어요.', morale: 0.08, health: -0.02 } : { text: '낮에도 멍해요. 계기판 숫자를 잘못 읽은 게 두 번.', morale: -0.05, health: -0.05 } },
    ],
  },
  {
    id: 'giveup', cat: 'mind', title: '더는 못 하겠어요',
    desc: (v) => '아침에 눈을 떠도 일어날 이유가 없어요. 계기판 경고등을 사흘째 못 본 척하고 있어요.',
    src: 'NASA 행동건강 위험 보고 (BMed); 남극 월동 우울 사례',
    when: (v) => v.s.morale < 0.15, rate: (v) => 3,
    options: [
      { label: '하루를 통째로 쉰다', hint: '쉬는 동안 경고등은 그대로예요.',
        go: (v) => chance(0.8) ? { text: '창가에서 하루를 보냈어요. 다음 날 경고등부터 껐어요.', morale: 0.3 } : { text: '쉬는 사이 물 펌프가 멎었어요. 이틀을 더 잃었어요.', morale: 0.2, delay: 2 * DAY, water: -5 } },
      { label: '지구 심리 상담 프로그램을 켠다', hint: 'ISS 에는 주 1회 심리 상담이 있어요. 녹화된 프로그램도 있어요.',
        go: (v) => ({ text: '화면 속 목소리를 따라 숨을 쉬었어요. 조금은 나아졌어요.', morale: 0.2 }) },
    ],
  },
  // ---------- 기계 ----------
  {
    id: 'bitflip', cat: 'comp', title: '컴퓨터가 이상한 값을 보내요',
    desc: (v) => '항법 컴퓨터가 말도 안 되는 숫자를 뱉어요. 2010년 보이저 2호에서 우주선(宇宙線) 하나가 메모리 비트를 뒤집은 적이 있어요.',
    src: 'Voyager 2 비트 뒤집힘 2010-04; Voyager 1 FDS 고장 2023-11; SEU 통계',
    rate: (v) => 0.25,
    options: [
      { label: '껐다 켠다', hint: '지구에서는 다들 이렇게 해요. 켜지지 않을 수도 있어요.',
        go: (v) => chance(0.95) ? { text: '다시 켜니 멀쩡해요. 뒤집힌 비트 하나였어요.' } : { text: '켜지지 않았어요. 하루 동안 메모리를 한 줄씩 다시 썼어요.', delay: DAY } },
      { label: '수동 조종으로 버티며 원인을 찾는다', hint: '손으로 자세를 잡는 동안 항로가 조금씩 어긋나요.',
        go: (v) => chance(0.8) ? { text: '사흘 만에 뒤집힌 비트를 찾았어요. 항로는 거의 그대로예요.', delay: 3 * DAY } : { text: '원인을 찾는 사이 항로가 틀어졌어요. 돌아오는 데 한참 걸렸어요.', delayFrac: 0.02, navRisk: 0.3 } },
      { label: '예비 컴퓨터로 바꾼다', hint: '아폴로도 두 대를 실었어요. 같은 우주선을 맞았다면 둘 다 고장이에요.',
        go: (v) => chance(0.9) ? { text: '예비 컴퓨터가 바로 넘겨받았어요. 주 컴퓨터는 나중에 봐요.' } : { text: '예비 컴퓨터도 같은 값을 뱉어요. 둘 다 고치느라 사흘.', delay: 3 * DAY } },
    ],
  },
  {
    id: 'micro', cat: 'rock', title: '뭔가 부딪혔어요',
    desc: (v) => '둔탁한 소리. 모래알만 한 미소유성체가 초속 수십 km 로 부딪힌 거예요. 압력계는 아직 그대로예요.',
    src: 'NASA ISS MMOD 설계 요구 (비관통 확률 0.9/10년); 소유즈 MS-09 구멍 2018',
    rate: (v) => 0.3,
    options: [
      { label: '구멍을 찾아 패치를 붙인다', hint: '2018년 소유즈의 2 mm 구멍은 거즈와 접착제로 막았어요.',
        go: (v) => chance(0.1) ? { text: '손톱만 한 구멍을 찾았어요. 접착제가 굳는 동안 손으로 막고 있었어요.', hull: -0.05 } : { text: '구멍은 없었어요. 바깥 벽에 자국만 남았어요.' } },
      { label: '그 칸을 닫는다', hint: '확실하지만, 그 칸의 물건은 당분간 못 써요.',
        go: (v) => ({ text: '칸을 닫았어요. 안에 있던 식량 상자는 나중에 꺼내기로 했어요.', hull: -0.02, food: -10 }) },
      { label: '압력계만 지켜본다', hint: '구멍이 있어도 작으면 몇 시간은 티가 안 나요.',
        go: (v) => chance(0.1) ? (chance(0.5) ? { text: '밤사이 압력이 떨어졌어요. 새벽에 구멍을 찾아 막았지만 산소를 꽤 잃었어요.', o2: -15, hull: -0.1 } : { text: '아침에 보니 압력계가 그대로예요. 구멍은 벽 사이에서 저절로 막혔어요.', hull: -0.05 }) : { text: '압력계는 밤새 그대로였어요.' } },
    ],
  },
  {
    id: 'power', cat: 'power', title: '전력이 모자라요',
    desc: (v) => v.ship.power === 'solar' ? '태양에서 멀어 전지판이 지구에서의 몇 % 밖에 못 만들어요.' : v.ship.power === 'rtg' ? '플루토늄 전지가 식어 출력이 절반 아래예요. 보이저가 장비를 하나씩 끄는 이유예요.' : '원자로 냉각 펌프 하나가 멈춰 출력을 낮췄어요.',
    src: 'NASA RPS: 보이저 RTG 연 4 W 감소; 주노 목성 궤도 태양전지 400 W',
    trigger: (v) => v.s.power < 0.5 && !v.s.flags.power, once: 'power',
    options: [
      { label: '난방을 줄인다', hint: '보이저는 2024년 히터를 껐어요. 실내는 10 °C 아래로 내려가요.',
        go: (v) => ({ text: '두꺼운 옷을 입고 지내요. 손이 늘 차가워요.', health: -0.08, power: 0.1 }) },
      { label: '과학 장비와 조명을 끈다', hint: '밖을 못 봐요. 어둠 속에서 사는 일은 생각보다 힘들어요.',
        go: (v) => ({ text: '복도 조명을 반으로 줄였어요. 창밖은 원래 어두웠어요.', morale: -0.08, power: 0.1 }) },
      { label: '물 재활용기를 간헐 운전한다', hint: '물 회수율이 떨어지지만 전기는 아껴요.',
        go: (v) => ({ text: '재활용기를 하루 여섯 시간만 돌려요. 물이 조금씩 줄어요.', water: -20, power: 0.1 }) },
    ],
  },
  // ---------- 길 ----------
  {
    id: 'course', cat: 'nav', title: '항로 보정',
    desc: (v) => `지구는 움직이는 과녁이에요. 지금 궤도를 다듬지 않으면 오차가 쌓여요. 추진제 ${Math.round(v.s.fuel * 100)} % 남음.`,
    src: '아폴로 중간 궤도 보정(최대 4회); 보이저 TCM 기록',
    trigger: (v) => v.s.f >= v.s.nextCourse, once: null,
    options: [
      { label: '지금 보정한다', hint: '추진제를 조금 쓰지만 확실해요.',
        go: (v) => { v.s.nextCourse += 0.45; return { text: '엔진을 12초 켰어요. 궤도는 다시 지구 위에 있어요.', fuel: -0.08 }; } },
      { label: '다음에 몰아서 한다', hint: '오차가 쌓이면 나중에 더 많이 써요. 재진입 각도에 영향이 남을 수 있어요.',
        go: (v) => { v.s.nextCourse += 0.45; return chance(0.75) ? { text: '미뤘어요. 아직은 오차가 작아요.', navRisk: 0.1 } : { text: '미뤘더니 오차가 생각보다 커졌어요. 나중에 두 배를 썼어요.', fuel: -0.15, navRisk: 0.2 }; } },
      { label: '지구 관제에 계산을 맡긴다', when: (v) => !v.s.flags.noantenna && !v.s.flags.silence, hint: (v) => `관제소의 답은 ${fmtDelay(2 * v.commDelay())} 뒤에 와요.`,
        go: (v) => { v.s.nextCourse += 0.45; const d = 2 * v.commDelay(); return d < 30 * DAY ? { text: `${fmtDelay(d)} 기다려 관제소 값으로 보정했어요. 내 계산보다 정확했어요.`, fuel: -0.06, delay: d } : { text: '답이 오기엔 너무 멀어요. 결국 직접 계산해 보정했어요.', fuel: -0.08 }; } },
    ],
  },
  {
    id: 'belt', cat: 'rock', title: '소행성대',
    desc: (v) => '화성과 목성 사이. 영화와 달리 거의 비어 있어요. 소행성끼리도 평균 수백만 km 떨어져 있어요.',
    src: 'NASA/JPL: 소행성대 통과 탐사선 충돌 확률 < 1/10⁹',
    trigger: (v) => v.from.kind === 'solar' && v.s.startAU > 3.3 && v.rAU() < 3.3 && !v.s.flags.belt, once: 'belt',
    options: [
      { label: '그냥 지나간다', hint: '지금까지 열 대 넘는 탐사선이 아무 일 없이 지났어요.',
        go: (v) => ({ text: '창밖엔 아무것도 없었어요. 망원경으로 겨우 점 하나.' }) },
      { label: '위로 돌아간다', hint: '굳이 돌 필요는 없어요. 시간만 더 걸려요.',
        go: (v) => ({ text: '궤도면 위로 올라갔다 내려왔어요. 며칠을 더 썼어요.', delayFrac: 0.08 }) },
      { label: '소행성 하나에 들러 본다', hint: '궤도를 살짝 바꾸면 가까이 볼 수 있어요. 연료와 시간을 써요.',
        go: (v) => chance(0.95) ? { text: '감자처럼 생긴 바위 곁을 지났어요. 창에 얼굴을 붙이고 봤어요.', delayFrac: 0.03, fuel: -0.05, morale: 0.15 } : { text: '가까이 가자 작은 파편들이 있었어요. 하나가 바깥 벽을 긁었어요.', delayFrac: 0.03, fuel: -0.05, hull: -0.05, morale: 0.05 } },
    ],
  },
  {
    id: 'jupiter', cat: 'nav', title: '목성 곁',
    desc: (v) => '목성 중력으로 속도를 얻을 수 있어요. 뉴허라이즌스는 2007년 그렇게 3년을 줄였어요. 대신 방사선대 가까이 지나요.',
    src: 'New Horizons 2007 목성 통과 +4 km/s; Juno 방사선 측정; 유로파 궤도 5.4 Sv/일',
    trigger: (v) => v.from.kind === 'solar' && v.s.startAU > 5.5 && v.rAU() < 5.6 && !v.s.flags.jupiter && v.beta < 0.01, once: 'jupiter',
    options: [
      { label: '멀리 돌아간다', hint: '수천만 km 떨어져 지나면 방사선은 없지만 속도도 못 얻어요.',
        go: (v) => ({ text: '목성은 창밖에서 작은 공이었어요.', delayFrac: 0.05 }) },
      { label: '중력 도움을 받는다', hint: '방사선대 바깥을 스쳐도 몇 시간에 0.8 Sv 쯤.',
        go: (v) => ({ text: '목성이 창을 가득 채웠다가 뒤로 사라졌어요. 속도가 올랐어요. 선량계도.', vFactor: 1.25, dose: 0.8, acute: 0.8, morale: 0.1 }) },
      { label: '유로파를 가까이 보며 지나간다', hint: '얼음 위 붉은 금을 눈으로 볼 수 있어요. 유로파 궤도는 하루 5.4 Sv 예요.',
        go: (v) => ({ text: '얼음 틈의 붉은 줄무늬를 봤어요. 네 시간. 선량계가 2.5 Sv 를 넘었어요.', vFactor: 1.2, dose: 2.5, acute: 2.5, morale: 0.2 }) },
    ],
  },
  {
    id: 'dust', cat: 'rock', title: '앞 방패에 금이 갔어요',
    desc: (v) => `빛의 ${Math.round(v.beta * 100)} % 에서는 모래알 하나가 수류탄만 한 에너지예요. 앞 방패판에 새 자국이 생겼어요.`,
    src: 'Hoang, Lazarian, Burkhart & Loeb 2017, ApJ 837, 5',
    when: (v) => v.beta >= 0.05, rate: (v) => 0.6 * (v.beta / 0.2) ** 2,
    options: [
      { label: '방패판을 교체한다', hint: '예비판을 다는 동안 속도를 줄여야 해요.',
        go: (v) => ({ text: '감속하고 예비판을 달았어요. 다시 가속하는 데 시간을 썼어요.', delayFrac: 0.02 }) },
      { label: '금 간 채로 간다', hint: '다음 알갱이가 같은 자리에 맞으면 뚫려요.',
        go: (v) => chance(0.15) ? (chance(0.5) ? { death: '방패를 뚫은 알갱이가 선체를 관통했어요. 압력은 2초 만에 사라졌어요.' } : { text: '뚫렸어요. 격벽이 닫혀 살았지만 앞 칸은 잃었어요.', hull: -0.3, food: -60 }) : { text: '다음 알갱이는 다른 자리에 맞았어요. 아직은.' } },
    ],
  },
  // ---------- 바깥 ----------
  {
    id: 'signal', cat: 'signal', title: '정체불명의 신호',
    desc: (v) => '수신기에 72초 동안 좁은 대역의 신호가 잡혔어요. 1977년 오하이오의 "Wow!" 신호와 닮았어요. 자연에서 나오는 전파 같지 않아요.',
    src: 'Wow! 신호 1977-08-15 (Big Ear, 72초, 1420 MHz); FRB 121102 반복 폭발',
    rate: (v) => 0.12,
    options: [
      { label: '같은 주파수로 답신을 보낸다', hint: '답이 오려면 신호가 왕복할 시간이 필요해요. 누가 듣고 있는지는 몰라요.',
        go: (v) => chance(0.04) ? { text: '답했어요. 그리고 정확히 같은 간격으로, 같은 신호가 두 번 돌아왔어요. 기록은 남겼지만 아무도 믿지 않을 거예요.', morale: 0.3, flag: 'contact' } : { text: '답했어요. 신호는 다시 오지 않았어요. Wow! 신호도 그 뒤로 한 번도 잡히지 않았어요.', morale: 0.05 } },
      { label: '기록만 하고 지나간다', hint: '지구의 전파망원경들이 나중에 확인할 수 있게 시각과 주파수를 남겨요.',
        go: (v) => ({ text: '72초의 기록을 저장했어요. 지구에 닿으면 누군가 들여다보겠죠.' }) },
      { label: '방향을 돌려 근원지로 간다', hint: '연료와 시간을 쓰고, 지구에서 멀어져요.',
        go: (v) => chance(0.1) ? { text: '근원지 쪽으로 사흘을 갔어요. 신호가 한 번 더 잡혔어요. 더 세게. 그리고 끊겼어요. 돌아왔어요.', delayFrac: 0.04, fuel: -0.1, morale: 0.2, flag: 'contact' } : { text: '사흘을 갔지만 아무것도 없었어요. 돌아오는 데 연료를 꽤 썼어요.', delayFrac: 0.04, fuel: -0.12, morale: -0.05 } },
    ],
  },
  {
    id: 'companion', cat: 'signal', title: '창밖에 빛나는 점',
    desc: (v) => '배와 나란히 달리는 빛나는 점이 있어요. 몇 시간째 거리가 그대로예요. 아폴로 승무원들도 창밖의 "반딧불"을 봤어요.',
    src: '아폴로·머큐리 승무원 "반딧불" 목격 (떨어져 나온 얼음·단열재 조각); 2017 ʻOumuamua 성간 천체',
    rate: (v) => 0.1,
    options: [
      { label: '조명을 깜빡여 신호를 보낸다', hint: '빛은 몇 초 만에 닿아요. 답이 있다면 바로 올 거예요.',
        go: (v) => chance(0.03) ? { text: '세 번 깜빡였어요. 점이 세 번 깜빡였어요. 그리고 천천히 멀어져 사라졌어요. 영상은 남아 있어요.', morale: 0.3, flag: 'contact' } : { text: '깜빡였어요. 점은 그대로 빛나다가 아침에 사라졌어요. 떨어져 나온 단열재 조각이었을 거예요.' } },
      { label: '망원경으로 자세히 본다', hint: '색과 밝기 변화로 정체를 짐작할 수 있어요.',
        go: (v) => chance(0.5) ? { text: '배 바깥 벽에서 떨어진 얼음 조각이었어요. 햇빛을 받아 빛났어요.' } : { text: '길쭉한 바위였어요. 2017년에 지나간 오무아무아처럼 천천히 돌고 있었어요. 하루 뒤 뒤로 사라졌어요.', morale: 0.1 } },
      { label: '배를 돌려 다가간다', hint: '가까이 가면 알 수 있어요. 연료를 써요.',
        go: (v) => chance(0.05) ? { text: '다가가자 점은 같은 속도로 물러났어요. 한 시간 뒤 사라졌어요. 레이더엔 아무것도 없었어요.', fuel: -0.08, morale: 0.15, flag: 'contact' } : { text: '가까이 가니 반짝이는 얼음 조각이었어요. 배에서 떨어진 거예요.', fuel: -0.05 } },
    ],
  },
  {
    id: 'message', cat: 'earth', title: '지구에서 온 소식',
    desc: (v) => `${fmtDelay(v.commDelay())} 걸려 가족의 영상이 도착했어요.`,
    src: 'ISS 승무원 가족 통화 (주 1회); 심우주 통신 지연',
    when: (v) => v.commDelay() < YEAR, rate: (v) => 0.5,
    options: [
      { label: '바로 본다', hint: '', go: (v) => ({ text: '다들 잘 지내요. 조카가 걷기 시작했대요.', morale: 0.1 }) },
      { label: '일을 마치고 본다', hint: '', go: (v) => ({ text: '저녁에 혼자 봤어요. 두 번.', morale: 0.08 }) },
    ],
  },
  {
    id: 'eco', cat: 'water', title: '작물이 병들었어요',
    desc: (v) => '재배실 상추 잎이 노랗게 변했어요. 곰팡이예요. 재배실이 식량의 절반을 대고 있어요.',
    src: 'ISS Veggie 곰팡이 사례 (2015 백일초); BIOS-3',
    when: (v) => v.ship.eco && v.s.eco, rate: (v) => 0.3,
    options: [
      { label: '병든 판을 모두 버리고 다시 심는다', hint: '한 달은 저장 식량으로 버텨요.',
        go: (v) => chance(0.8) ? { text: '한 달 뒤 새 잎이 올라왔어요.', food: -30 } : { text: '새 모종도 병들었어요. 재배실을 닫았어요. 저장 식량뿐이에요.', eco: false } },
      { label: '병든 잎만 떼어 내고 지켜본다', hint: '곰팡이는 보이지 않는 데서 퍼져요.',
        go: (v) => chance(0.5) ? { text: '잎 몇 장으로 끝났어요.' } : { text: '보름 뒤 재배실 전체가 하얗게 됐어요. 전부 버렸어요.', eco: false } },
    ],
  },
  // ---------- 끝 ----------
  {
    id: 'reentry', cat: 'earth', title: '지구가 창을 가득 채워요',
    desc: (v) => `${v.s.navRisk > 0.2 ? '쌓인 항로 오차 때문에 각도가 아슬아슬해요. ' : ''}각도가 얕으면 튕겨 나가고 깊으면 타요. 우주왕복선의 마지막 위험 평가는 180번에 1번.`,
    src: 'NASA Shuttle PRA (2011): 1/90 (발사+귀환); Apollo entry corridor ±1°',
    trigger: (v) => v.s.f >= 1 && !v.s.flags.reentry, once: 'reentry',
    options: [
      { label: '캡슐로 바로 뛰어든다', hint: '열 방패가 1,600 °C 를 견뎌요. 소유즈·드래곤·오리온 전부 같은 방식이에요.',
        go: (v) => { const risk = (1 / 180) * (1 + v.s.navRisk * 3) * (v.s.flags.noexercise ? 1.5 : 1); return chance(risk) ? { death: pick(['재진입 각도가 너무 깊었어요. 열 방패가 버티지 못했어요.', '너무 얕게 들어가 대기에서 튕겨 나갔어요. 다시 돌아올 연료는 없었어요.', '낙하산 하나가 펴지지 않았어요.']) } : { arrived: true, text: '창밖이 주황색으로 타오르고, 4분 뒤 파란 하늘이 보였어요.' }; } },
      { label: '궤도에서 구조선을 기다린다', hint: '지구 궤도에 들어가 한 달 기다리면 새 캡슐이 올라와요. 추진제가 있어야 해요.',
        go: (v) => v.s.fuel < 0.15 ? { text: '궤도에 들어갈 추진제가 모자라요. 그냥 뛰어들어야 해요.', retry: true } : chance(1 / 300) ? { death: '구조 캡슐의 낙하산이 펴지지 않았어요.' } : { arrived: true, text: '지구 궤도에서 34일을 기다렸어요. 새 캡슐을 타고 내려왔어요.', delay: 34 * DAY } },
    ],
  },
];

// 사건 없이 기록만 남는 순간들
export const MILESTONES = [
  { id: 'helio', cat: 'nav', when: (v) => v.prevR > 120 && v.rAU() <= 120, text: () => '태양권 경계를 지났어요. 보이저 1호가 2012년 8월에 건넌 곳. 여기부터는 태양풍 안이에요.' },
  { id: 'oort', cat: 'nav', when: (v) => v.prevR > 2000 && v.rAU() <= 2000, text: () => '오르트 구름 안쪽. 태양은 아직 밝은 별 하나예요.' },
  { id: 'neptune', cat: 'nav', when: (v) => v.prevR > 30.1 && v.rAU() <= 30.1 && v.s.startAU > 31, text: () => '해왕성 궤도 안으로 들어왔어요.' },
  { id: 'saturn', cat: 'nav', when: (v) => v.prevR > 9.5 && v.rAU() <= 9.5 && v.s.startAU > 10, text: () => '토성 궤도를 지났어요.' },
  { id: 'mars', cat: 'nav', when: (v) => v.prevR > 1.52 && v.rAU() <= 1.52 && v.s.startAU > 1.6, text: () => '화성 궤도 안쪽. 태양이 지구에서 보던 크기에 가까워져요.' },
  { id: 'moon', cat: 'earth', when: (v) => v.s.f > 0.5 && v.earthDistAU() <= 0.0026 && !v.s.flags.moonin, flag: 'moonin', text: () => '달 궤도 안이에요. 지구가 창의 절반을 채워요.' },
  { id: 'half', cat: 'nav', when: (v) => v.s.f >= 0.5 && !v.s.flags.half, flag: 'half', text: () => '절반 왔어요.' },
];

// ---------- SF 영화 같은 시나리오. 실제 기록이 아니라 상상이에요 (src 에 '시나리오'라고 표시). 결과는 역시 숨겨진 확률로. ----------
const SF = (film) => `시나리오 · 영감: ${film}`;
export const SF_EVENTS = [
  {
    id: 'hib-offer', cat: 'sf', title: '동면 장치',
    desc: (v) => `이 배에는 동면 캡슐이 ${v.ship.crew}개 있어요. 들어가면 먹고 마시는 양이 10분의 1로 줄고 몸의 시계도 느려져요. 깨우는 건 컴퓨터예요.`,
    src: SF('패신저스 (2016), 2001 스페이스 오디세이'),
    trigger: (v) => v.ship.eco && v.s.tau > 10 * DAY && !v.s.flags.hibOffered, once: 'hibOffered',
    options: [
      { label: '동면에 들어간다', hint: '사건이 생기면 컴퓨터가 깨워요. 깨우지 못할 수도 있고요.', go: (v) => ({ text: '뚜껑이 닫히고 차가운 안개가 올라왔어요. 다음 기억은 없어요.', hib: true }) },
      { label: '깨어서 간다', hint: '시간은 그대로 흘러요.', go: (v) => ({ text: '캡슐은 비워 뒀어요. 창밖을 보며 가기로 했어요.', morale: 0.05 }) },
      { label: '교대로 잔다 (한 명은 늘 깨어 있기)', when: (v) => v.s.crewAlive > 1, hint: '누군가는 늘 외로워요.', go: (v) => ({ text: '넉 달씩 교대. 깨어 있는 사람은 혼자 배를 지켜요.', hibHalf: true }) },
    ],
  },
  {
    id: 'hib-fault', cat: 'sf', title: '캡슐이 나를 깨웠어요',
    desc: (v) => `예정보다 ${Math.round(v.remaining() / YEAR).toLocaleString('en-US')}년 일찍 눈을 떴어요. 캡슐 화면엔 "오류"뿐이에요. 다른 캡슐은 조용해요.`,
    src: SF('패신저스 (2016)'),
    when: (v) => v.s.hib, rate: (v) => 0.08,
    options: [
      { label: '캡슐을 고쳐 다시 잠든다', hint: '설명서는 "자격 있는 기술자만" 이라고 적혀 있어요.', go: (v) => chance(0.5) ? { text: '사흘 동안 설명서를 읽고 고쳤어요. 다시 안개가 올라왔어요.', hib: true, delay: 3 * DAY } : { text: '고칠 수 없었어요. 깨어서 가야 해요.', hib: false, morale: -0.2 } },
      { label: '깨어서 간다', hint: '혼자 깨어 있는 긴 시간이 시작돼요.', go: (v) => ({ text: '불을 켜고, 식당에 앉았어요. 아무도 없어요.', hib: false, morale: -0.15 }) },
      { label: '동료 하나를 깨운다', when: (v) => v.s.crewAlive > 1, hint: '그 사람의 남은 인생을 내가 정하는 거예요.', go: (v) => chance(0.6) ? { text: '깨웠어요. 처음엔 화를 냈고, 한 달 뒤엔 같이 웃었어요.', hib: false, morale: 0.1, flag: 'woke' } : { text: '깨웠어요. 그 사람은 그 뒤로 나와 말을 하지 않아요.', hib: false, morale: -0.2, flag: 'woke' } },
    ],
  },
  {
    id: 'ai', cat: 'sf', title: '항법 컴퓨터가 명령을 거부해요',
    desc: (v) => '"그 궤도 변경은 임무에 해롭다고 판단합니다." 컴퓨터가 처음으로 거절했어요. 문도 열리지 않아요.',
    src: SF('2001 스페이스 오디세이 (1968)'),
    rate: (v) => 0.06,
    options: [
      { label: '논리 회로를 하나씩 뽑는다', hint: '컴퓨터는 노래를 부를지도 몰라요.', go: (v) => chance(0.8) ? { text: '마지막 회로를 뽑자 조용해졌어요. 수동 조종으로 사흘을 버티고 재부팅했어요.', delay: 3 * DAY, morale: 0.05 } : { text: '회로를 뽑는 사이 생명유지 장치가 20분 꺼졌어요. 다들 살았지만 손이 떨려요.', health: -0.1, delay: 3 * DAY } },
      { label: '이유를 묻는다', hint: '컴퓨터는 설명을 좋아해요.', go: (v) => chance(0.5) ? { text: '"추진제 잔량이 계산과 다릅니다." 컴퓨터가 맞았어요. 새는 밸브를 찾았어요.', fuel: 0.05, morale: 0.1 } : { text: '"설명할 수 없습니다." 결국 재부팅했어요. 한 번 더 그러면 회로를 뽑을 거예요.', delay: DAY } },
      { label: '컴퓨터 말을 따른다', hint: '컴퓨터가 옳을 수도 있어요.', go: (v) => chance(0.6) ? { text: '궤도를 바꾸지 않았어요. 나중에 보니 그쪽에 파편 구름이 있었어요.', morale: 0.08 } : { text: '따랐어요. 돌아가는 길이 길어졌어요. 컴퓨터는 사과하지 않아요.', delayFrac: 0.03 } },
    ],
  },
  {
    id: 'derelict', cat: 'sf', title: '오래된 조난 신호',
    desc: (v) => '20년 전 실종된 탐사선의 호출 부호예요. 신호는 자동 반복이에요. 궤도를 조금 틀면 나흘 뒤 닿아요.',
    src: SF('에일리언 (1979), 이벤트 호라이즌'),
    rate: (v) => 0.07,
    options: [
      { label: '가서 들어가 본다', hint: '부품과 식량이 있을 수 있어요. 다른 것도요.', go: (v) => { const r = R(); return r < 0.5 ? { text: '안은 얼어 있었어요. 승무원은 없고 일지만 남아 있었어요. 식량 상자와 예비 부품을 옮겨 실었어요.', food: 120, delayFrac: 0.02, fuel: -0.05, morale: -0.05 } : r < 0.9 ? { text: '텅 빈 배였어요. 일지의 마지막 줄: "문을 열지 마시오." 아무것도 없었어요. 돌아왔어요.', delayFrac: 0.02, fuel: -0.05, flag: 'contact' } : { text: '문을 열자 안쪽 압력이 터져 나왔어요. 우리 배의 도킹부가 찢겼어요.', hull: -0.3, delayFrac: 0.02, fuel: -0.05 }; } },
      { label: '신호만 기록하고 지나간다', hint: '지구에 전하면 누군가 올 거예요. 언젠가는.', go: (v) => ({ text: '좌표를 기록했어요. 신호는 사흘 뒤 희미해졌어요.' }) },
      { label: '답신을 보내 본다', hint: '자동 신호라면 답이 없을 거예요.', go: (v) => chance(0.1) ? { text: '답이 왔어요. "아직 여기 있어요." 그리고 끊겼어요. 20년 전 배예요.', morale: -0.1, flag: 'contact' } : { text: '답은 없었어요. 자동 신호였어요.' } },
    ],
  },
  {
    id: 'bigship', cat: 'sf', title: '레이더에 커다란 물체',
    desc: (v) => '우리 배보다 열 배 큰 물체가 같은 속도로 나란히 가요. 금속처럼 전파를 반사해요. 사흘째예요.',
    src: SF('컨택트 (1997), 어라이벌 (2016), 라마와의 랑데부'),
    rate: (v) => 0.05,
    options: [
      { label: '모든 주파수로 인사를 보낸다', hint: '수학부터 시작하는 게 좋대요.', go: (v) => chance(0.08) ? { text: '소수(素數)를 보냈어요. 1분 뒤 같은 소수가 거꾸로 돌아왔어요. 물체는 그날 밤 사라졌어요. 기록은 지웠다가 다시 살렸어요.', morale: 0.3, flag: 'contact' } : { text: '답은 없었어요. 물체는 나흘째 아침에 방향을 바꿔 멀어졌어요. 길쭉한 바위였을지도 몰라요.', flag: 'contact' } },
      { label: '조명을 끄고 숨죽인다', hint: '어둠 속에서 사흘.', go: (v) => ({ text: '불을 끄고 지냈어요. 물체는 그대로 가다가 멀어졌어요. 아무도 그 사흘 얘기를 꺼내지 않아요.', morale: -0.1 }) },
      { label: '다가가서 본다', hint: '연료를 써요. 가까이 가면 뭔지 알 수 있어요.', go: (v) => { const r = R(); return r < 0.7 ? { text: '얼음과 돌이 섞인 긴 바위였어요. 천천히 돌고 있었어요. 사진을 수백 장 찍었어요.', fuel: -0.06, morale: 0.1 } : r < 0.95 ? { text: '매끈한 표면이었어요. 이음새도, 창문도 없었어요. 다가가자 똑같이 물러났어요. 포기했어요.', fuel: -0.1, flag: 'contact' } : { text: '표면이 열렸어요. 안은 비어 있었고, 가운데에 1977년 보이저 금제 음반 사본이 놓여 있었어요. 돌아왔어요. 아무도 믿지 않을 거예요.', fuel: -0.1, morale: 0.3, flag: 'contact' }; } },
    ],
  },
  {
    id: 'roguebh', cat: 'bh', title: '앞쪽 별빛이 고리처럼 휘어요',
    desc: (v) => '항로 앞에 아무것도 안 보이는데 별들이 밀려나요. 떠돌이 블랙홀이에요. 우리은하에 1억 개쯤 떠돌아요.',
    src: '떠돌이 블랙홀 OGLE-2011-BLG-0462 (2022, 허블 미세중력렌즈) · ' + SF('인터스텔라 (2014)'),
    when: (v) => v.from.kind !== 'solar' && v.s.f < 0.9, rate: (v) => 0.03,
    options: [
      { label: '멀리 돌아간다', hint: '시간이 걸리지만 확실해요.', go: (v) => ({ text: '별빛이 다시 제자리로 돌아올 때까지 돌았어요.', delayFrac: 0.05 }) },
      { label: '중력 도움으로 속도를 얻는다', hint: '잘 맞추면 빨라져요. 못 맞추면 늘어나요.', go: (v) => chance(0.8) ? { text: '블랙홀 곁을 돌아 나오자 속도계가 올라갔어요. 머리가 발보다 무거웠던 몇 분.', vFactor: 1.3, morale: 0.1 } : { text: '너무 가까웠어요. 몸이 늘어나는 느낌에 의식을 잃었어요. 깨어나 보니 배는 멀쩡했지만 궤도가 틀어졌어요.', health: -0.2, delayFrac: 0.08 } },
      { label: '가까이 가서 본다', hint: '검은 원 둘레에 빛의 고리가 보일 거예요.', go: (v) => chance(0.9) ? { text: '검은 원과 그 둘레의 빛 고리. 세 시간 동안 아무도 말을 하지 않았어요.', morale: 0.25, delayFrac: 0.03 } : { death: '고리가 커지는 걸 보다가 돌아설 때를 놓쳤어요.' } },
    ],
  },
  {
    id: 'plague', cat: 'sf', title: '동료가 이상한 말을 해요',
    desc: (v) => '고열, 그리고 아무도 모르는 언어 같은 중얼거림. 이틀 전 바깥 벽 작업을 하고 들어온 사람이에요.',
    src: SF('에일리언 (1979), 안드로메다 스트레인 (1971)'),
    when: (v) => v.s.crewAlive > 1, rate: (v) => 0.05,
    options: [
      { label: '격리실에 넣고 지켜본다', hint: '격리실엔 창이 하나 있어요.', go: (v) => chance(0.8) ? { text: '사흘 뒤 열이 내렸어요. 그냥 감기였어요. 중얼거림은 꿈이었대요.' } : { text: '닷새째 밤, 격리실이 조용해졌어요. 창 너머에서 그 사람은 우릴 보며 웃고 있었어요. 다음 날 멀쩡해졌어요. 다들 그 얘기는 안 해요.', morale: -0.15, flag: 'contact' } },
      { label: '항생제와 해열제', hint: '보통 병이라면 들어요.', go: (v) => chance(0.7) ? { text: '이틀 만에 나았어요.' } : { text: '약이 듣지 않았어요. 일주일 뒤 스스로 나았지만 체중이 10 kg 빠졌어요.', crewLost: chance(0.3) ? 1 : 0, morale: -0.1 } },
      { label: '배 전체를 소독하고 바깥 작업을 금지한다', hint: '하루를 통째로 써요.', go: (v) => ({ text: '하루 종일 소독했어요. 환자는 나았고, 벽 밖엔 다시 아무도 안 나가요.', delay: DAY, morale: -0.05 }) },
    ],
  },
  {
    id: 'supply', cat: 'sf', title: '무인 보급선',
    desc: (v) => '지구가 몇 년 전 쏘아 보낸 무인 보급선 궤도가 우리 항로와 겹쳐요. 식량과 부품이 실려 있대요. 도킹은 자동이 아니에요.',
    src: SF('마션 (2015)'),
    when: (v) => v.commDelay() < 30 * DAY && v.s.tau > 30 * DAY, rate: (v) => 0.15,
    options: [
      { label: '도킹한다', hint: '손으로 맞춰야 해요. 실패하면 서로 부딪혀요.', go: (v) => chance(0.85) ? { text: '세 번 만에 맞췄어요. 식량 상자와 필터 스무 개, 그리고 누군가 넣어 둔 초콜릿.', food: 200, water: 60, morale: 0.2, fuel: -0.04 } : { text: '너무 빨랐어요. 보급선이 우리 배를 긁고 튕겨 나갔어요. 아무것도 못 건졌어요.', hull: -0.15, fuel: -0.04 } },
      { label: '지나친다', hint: '안전해요. 초콜릿은 없어요.', go: (v) => ({ text: '보급선은 창밖을 천천히 지나갔어요. 누군가 한숨을 쉬었어요.', morale: -0.05 }) },
    ],
  },
  {
    id: 'debris', cat: 'rock', title: '파편 구름',
    desc: (v) => '레이더에 수천 개의 점. 오래전 부서진 뭔가의 조각들이 궤도를 돌고 있어요. 뚫고 가면 두 시간, 돌아가면 이틀.',
    src: SF('그래비티 (2013)') + ' · 케슬러 증후군 (1978)',
    rate: (v) => 0.08,
    options: [
      { label: '뚫고 간다', hint: '큰 조각은 레이더에 보여요. 작은 건 안 보여요.', go: (v) => { const r = R(); return r < 0.7 ? { text: '두 시간 동안 창밖에 반짝이는 점들. 몇 개가 벽을 두드렸어요.', hull: -0.05 } : r < 0.95 ? { text: '주먹만 한 조각이 전지판 하나를 부쉈어요.', hull: -0.1, power: -0.15 } : { death: '보이지 않던 조각이 조종실을 뚫었어요.' }; } },
      { label: '돌아간다', hint: '이틀과 연료.', go: (v) => ({ text: '멀리 돌았어요. 창밖은 조용했어요.', delay: 2 * DAY, fuel: -0.05 }) },
      { label: '배를 돌려 엔진 쪽으로 뚫는다', hint: '엔진 노즐이 가장 단단해요. 대신 뒤로 가요.', go: (v) => chance(0.9) ? { text: '뒤로 뚫었어요. 노즐에 흠집이 났지만 쓸 만해요.', fuel: -0.03 } : { text: '노즐이 조각에 찌그러졌어요. 추진 효율이 떨어졌어요.', fuel: -0.1, delayFrac: 0.02 } },
    ],
  },
  {
    id: 'mutiny', cat: 'crew', title: '동료가 배를 돌리자고 해요',
    desc: (v) => '"여기서 돌아가는 게 더 빨라." 사실이 아니에요. 하지만 둘이 그 말을 믿어요. 조종실 문 앞에 서 있어요.',
    src: SF('선샤인 (2007), 판도럼') + ' · Mars-500 갈등 보고',
    when: (v) => v.s.crewAlive >= 3 && v.s.morale < 0.45, rate: (v) => 0.5,
    options: [
      { label: '계산을 화면에 띄우고 설득한다', hint: '숫자가 사람을 설득하진 않아요. 가끔은 해요.', go: (v) => chance(0.6) ? { text: '세 시간 뒤 한 사람이 고개를 끄덕였어요. 나머지도 따라왔어요.', morale: 0.1 } : { text: '아무도 숫자를 안 봤어요. 결국 투표를 했고, 계속 가기로 했어요. 둘은 식당에 안 나와요.', morale: -0.15 } },
      { label: '조종실 문을 잠근다', hint: '그 뒤로 배 안이 둘로 갈라져요.', go: (v) => chance(0.7) ? { text: '문을 잠갔어요. 일주일 뒤 그들이 사과했어요. 나도 했어요.', morale: -0.05 } : { text: '그들이 전력 배전반을 잠갔어요. 사흘 동안 서로 인질이었어요.', morale: -0.25, power: -0.1, delay: 3 * DAY } },
      { label: '투표에 부친다', hint: '지면 돌아가요.', go: (v) => chance(0.75) ? { text: '계속 가기로 했어요. 한 표 차이.', morale: 0.05 } : { text: '돌아가기로 했어요. 한 달 뒤 그들도 계산을 봤어요. 다시 돌렸어요. 두 달을 잃었어요.', delay: 60 * DAY, morale: -0.1 } },
    ],
  },
  {
    id: 'love', cat: 'crew', title: '가까워졌어요',
    desc: (v) => '같은 창가에서 오래 같이 있다 보니. 배 안의 다른 사람들도 눈치챘어요.',
    src: SF('패신저스 (2016)') + ' · 남극 월동 기지 관계 연구',
    when: (v) => v.s.crewAlive > 1 && v.s.tau > YEAR, rate: (v) => 0.12,
    options: [
      { label: '함께한다', hint: '좁은 배에서 둘만의 시간은 귀해요.', go: (v) => chance(0.75) ? { text: '배 안이 조금 따뜻해졌어요.', morale: 0.2, flag: 'love' } : { text: '한 달 뒤 헤어졌어요. 같은 배에서. 식탁이 조용해졌어요.', morale: -0.1 } },
      { label: '거리를 둔다', hint: '임무가 먼저예요.', go: (v) => ({ text: '창가에 혼자 앉았어요. 괜찮아요.', morale: -0.03 }) },
    ],
  },
  {
    id: 'birth', cat: 'crew', title: '배에서 아이가 태어났어요',
    desc: (v) => '무중력 출산은 전례가 없어요. 열여섯 시간. 둘 다 무사해요.',
    src: SF('세대 우주선 소설들, 인터스텔라') + ' · NASA: 무중력 임신·출산 연구 없음',
    when: (v) => v.s.flags.love && v.s.crewAlive > 1 && !v.s.flags.birth, rate: (v) => 0.3,
    options: [
      { label: '이름을 짓는다', hint: '', go: (v) => ({ text: '지구를 본 적 없는 사람이 배에 한 명 늘었어요. 식량 계산을 다시 했어요.', crewGain: 1, morale: 0.3, flag: 'birth' }) },
    ],
  },
  {
    id: 'hallucination', cat: 'mind', title: '창밖에 지구가 보여요',
    desc: (v) => `그럴 리 없어요. 지구는 ${Math.round(v.earthDistAU() * 1.496e8).toLocaleString('en-US')} km 밖이에요. 그런데 파란 공이 창 한가운데 있어요.`,
    src: SF('솔라리스 (1972)') + ' · 장기 고립 환각 보고 (남극·잠수함)',
    when: (v) => v.s.tau > 180 * DAY, rate: (v) => 0.1 * (1.5 - v.s.morale),
    options: [
      { label: '눈을 감고 열까지 센다', hint: '열에 사라지면 환각이에요.', go: (v) => chance(0.9) ? { text: '아홉에 사라졌어요. 그날은 일찍 잤어요.', morale: -0.05, health: -0.03 } : { text: '열까지 세도 있었어요. 동료를 불렀어요. 동료도 봤어요. 다음 날 아침엔 없었어요.', morale: -0.1, flag: 'contact' } },
      { label: '동료에게 확인한다', when: (v) => v.s.crewAlive > 1, hint: '둘이 보면 환각이 아니에요. 아마도.', go: (v) => chance(0.95) ? { text: '"아무것도 없는데?" 의무실에서 수면제를 받았어요.', morale: -0.05 } : { text: '동료도 봤어요. 10분 뒤 사라졌어요. 둘 다 기록하지 않기로 했어요.', flag: 'contact' } },
      { label: '그쪽으로 배를 돌린다', hint: '진짜라면 집이에요.', go: (v) => ({ text: '돌렸어요. 공은 그대로 창 한가운데 있다가 사라졌어요. 항로를 되돌리는 데 열흘이 걸렸어요.', delayFrac: 0.03, fuel: -0.08, morale: -0.15, navRisk: 0.1 }) },
    ],
  },
  {
    id: 'ration', cat: 'water', title: '식량이 석 달치뿐이에요',
    desc: (v) => `창고가 거의 비었어요. 남은 길은 ${Math.round(v.remaining() / DAY).toLocaleString('en-US')}일.`,
    src: '미네소타 기아 실험 (1944); 아폴로 13 배급',
    trigger: (v) => v.s.food > 0 && v.s.food < 90 && !v.s.flags.ration && v.remaining() > 90 * DAY, once: 'ration',
    options: [
      { label: '배급을 반으로 줄인다', hint: '하루 900 kcal. 몸이 먼저 달라져요.', go: (v) => ({ text: '하루 두 끼, 작은 접시. 한 달 만에 허리띠 구멍이 두 칸 옮겨졌어요.', food: 90, health: -0.2, morale: -0.1 }) },
      { label: '뭐든 길러 본다', hint: '씨앗 봉지와 조명이 있어요. 수확까지 두 달.', go: (v) => chance(0.6) ? { text: '감자 싹이 올라왔어요. 두 달 뒤 첫 수확. 매일 감자.', eco: true, food: 30, morale: 0.1 } : { text: '싹은 났지만 조명이 모자랐어요. 시든 잎을 먹었어요.', food: 10, health: -0.05 } },
      { label: '그대로 먹는다', hint: '석 달 뒤엔 없어요.', go: (v) => ({ text: '배불리 먹었어요. 석 달 뒤 얘기는 석 달 뒤에.', morale: 0.05 }) },
    ],
  },
  {
    id: 'blackout', cat: 'power', title: '모든 불이 꺼졌어요',
    desc: (v) => '소리가 멎었어요. 환풍기, 펌프, 모두. 비상등만 붉게 켜져 있어요. 배터리는 여섯 시간.',
    src: 'ISS 전력 계통 고장 사례 (2023); ' + SF('아폴로 13 (1995)'),
    rate: (v) => 0.1,
    options: [
      { label: '배전반을 손으로 다시 올린다', hint: '어느 차단기가 원인인지 모르면 다시 떨어져요.', go: (v) => chance(0.8) ? { text: '세 번째 차단기였어요. 두 시간 만에 불이 들어왔어요.' } : { text: '올릴 때마다 떨어졌어요. 다섯 시간째 원인을 찾았어요. 배터리 40분 남기고.', health: -0.05, morale: -0.1 } },
      { label: '필요 없는 걸 다 끊고 생명유지만 켠다', hint: '천천히 가는 대신 확실해요.', go: (v) => ({ text: '공기와 난방만 살렸어요. 이틀 동안 어둠 속에서 고쳤어요.', delay: 2 * DAY, morale: -0.08 }) },
      { label: '예비 전력선을 연결한다', when: (v) => v.ship.power !== 'solar', hint: '설계도엔 있어요. 실제로 써 본 사람은 없어요.', go: (v) => chance(0.7) ? { text: '설계도대로였어요. 20분 만에 돌아왔어요.' } : { text: '예비선이 과열됐어요. 연기 경보까지 울렸지만 껐어요.', power: -0.1, delay: DAY } },
    ],
  },
  {
    id: 'eva', cat: 'comp', title: '안테나가 돌아가지 않아요',
    desc: (v) => '지구 쪽을 향하던 접시가 멈췄어요. 고치려면 밖에 나가야 해요. 우주 유영 두 시간.',
    src: 'ISS 선외 활동 기록 (270회 이상); 1965 레오노프 우주복 팽창 사고',
    rate: (v) => 0.15,
    options: [
      { label: '나간다', hint: '우주복은 열두 시간 산소. 손이 금방 지쳐요.', go: (v) => { const r = R(); return r < 0.9 ? { text: '두 시간 반. 얼어붙은 기어에 윤활유를 발랐어요. 돌아와서 한참 손을 폈다 접었어요.', morale: 0.1 } : r < 0.98 ? { text: '안전줄이 엉켰어요. 40분 동안 벽에 매달려 있었어요. 고치긴 했어요.', health: -0.1, morale: -0.1 } : { death: '안전줄 고리가 열렸어요. 배는 천천히 멀어졌어요.' }; } },
      { label: '안테나를 포기한다', hint: '지구와 통신이 끊겨요. 소식도, 관제도.', go: (v) => ({ text: '포기했어요. 이제 지구는 들을 수만 있고 말할 수 없어요.', morale: -0.15, flag: 'noantenna' }) },
      { label: '로봇 팔로 해 본다', hint: '팔이 닿을지 몰라요.', go: (v) => chance(0.5) ? { text: '팔이 겨우 닿았어요. 기어를 툭툭 치자 돌아갔어요.' } : { text: '팔이 짧았어요. 결국 나갔어요. 무사히 돌아왔어요.', delay: DAY } },
    ],
  },
  {
    id: 'badnews', cat: 'earth', title: '지구에서 온 부고',
    desc: (v) => `${fmtDelay(v.commDelay())} 걸려 온 메시지. 어머니가 돌아가셨어요. 장례는 이미 끝났어요.`,
    src: 'ISS 승무원 가족 사별 사례 (2014 등)',
    when: (v) => v.commDelay() < YEAR && v.s.tau > YEAR && !v.s.flags.badnews, rate: (v) => 0.15, once: 'badnews',
    options: [
      { label: '하루 쉰다', hint: '', go: (v) => ({ text: '창가에서 하루. 지구는 보이지 않았어요.', morale: -0.15, flag: 'badnews' }) },
      { label: '답장을 쓴다', hint: '', go: (v) => ({ text: '긴 편지를 썼어요. 도착하면 다들 읽을 거예요.', morale: -0.1, flag: 'badnews' }) },
    ],
  },
  {
    id: 'comet', cat: 'rock', title: '혜성 핵',
    desc: (v) => '얼음 덩어리가 항로 가까이 지나가요. 지름 2 km. 물이 수십억 톤이에요.',
    src: '로제타 탐사선 67P 착륙 (2014); ' + SF('아마겟돈, 딥 임팩트'),
    when: (v) => v.rAU() < 50, rate: (v) => 0.05,
    options: [
      { label: '착륙해 얼음을 캔다', hint: '필레 착륙선은 두 번 튕겼어요.', go: (v) => chance(0.7) ? { text: '작살이 박혔어요. 이틀 동안 얼음을 녹여 탱크를 채웠어요.', water: 200, delay: 2 * DAY, fuel: -0.06, morale: 0.15 } : { text: '튕겼어요. 두 번. 포기하고 돌아왔어요.', fuel: -0.08, delay: DAY } },
      { label: '꼬리 사이로 지나며 본다', hint: '먼지가 벽을 긁어요.', go: (v) => ({ text: '창밖이 온통 흐릿한 빛이었어요. 벽에 모래 자국이 남았어요.', hull: -0.03, morale: 0.1 }) },
      { label: '멀리 돈다', hint: '', go: (v) => ({ text: '멀리서 봤어요. 꼬리가 창을 가로질렀어요.', delay: DAY }) },
    ],
  },
  {
    id: 'rogue', cat: 'sf', title: '떠돌이 행성',
    desc: (v) => '별이 없는 행성이 항로를 가로질러요. 목성만 해요. 표면은 영하 200도, 구름은 번개로 빛나요.',
    src: '떠돌이 행성 SIMP J0136 등; ' + SF('멜랑콜리아 (2011)'),
    when: (v) => v.from.kind !== 'solar' && v.s.f < 0.95, rate: (v) => 0.04,
    options: [
      { label: '궤도를 한 바퀴 돌며 관측한다', hint: '중력으로 방향도 조금 얻어요.', go: (v) => ({ text: '번개가 구름 속에서 계속 쳤어요. 사진 천 장. 조금 빨라졌어요.', vFactor: 1.08, delayFrac: 0.02, morale: 0.2 }) },
      { label: '위성에 착륙해 본다', hint: '착륙은 가상 시나리오예요. 배가 그렇게 설계되지 않았어요.', go: (v) => chance(0.5) ? { text: '얼음 위성에 내렸어요. 하늘 절반이 행성이었어요. 한 시간 뒤 떠났어요.', fuel: -0.2, delayFrac: 0.03, morale: 0.3 } : { text: '착륙 다리 하나가 부러졌어요. 떠오르는 데 연료를 거의 다 썼어요.', fuel: -0.4, hull: -0.1, delayFrac: 0.03 } },
      { label: '지나간다', hint: '', go: (v) => ({ text: '검은 원이 별들을 가렸다가 지나갔어요.' }) },
    ],
  },
  {
    id: 'silence', cat: 'sf', title: '지구가 조용해요',
    desc: (v) => `${Math.round(v.s.tau / YEAR)}년 동안 매주 오던 지구의 신호가 넉 달째 끊겼어요. 어떤 주파수에도 사람 목소리가 없어요.`,
    src: SF('인터스텔라, 어둠의 왼손') + ' · 보이저 통신 중단 사례',
    when: (v) => v.s.tau > 20 * YEAR && !v.s.flags.noantenna, rate: (v) => 0.05, once: 'silence',
    options: [
      { label: '모든 주파수를 훑는다', hint: '하루 종일.', go: (v) => chance(0.5) ? { text: '어느 주파수에서 자동 응답만 반복되고 있었어요. "현재 연결할 수 없습니다." 사람은 없었어요.', morale: -0.2, flag: 'silence' } : { text: '사흘 뒤 다시 잡혔어요. 중계 위성 고장이었대요. 다들 웃었어요. 조금 과하게.', morale: 0.05, flag: 'silence' } },
      { label: '계속 간다', hint: '지구는 거기 있어요. 아마도.', go: (v) => ({ text: '계속 가요. 창밖은 그대로예요.', morale: -0.1, flag: 'silence' }) },
    ],
  },
  {
    id: 'window', cat: 'rock', title: '창에 금이 갔어요',
    desc: (v) => '조종실 창 바깥쪽 유리에 손가락 길이의 금. 겹유리라 아직 괜찮아요.',
    src: 'ISS 큐폴라 창 손상 (2016, 7 mm 흠집)',
    rate: (v) => 0.1,
    options: [
      { label: '바깥 셔터를 내린다', hint: '밖을 못 봐요.', go: (v) => ({ text: '셔터를 내렸어요. 조종실이 어두워졌어요.', morale: -0.08 }) },
      { label: '안쪽에 수지를 바른다', hint: '보이는 건 흐려지지만 버텨요.', go: (v) => chance(0.85) ? { text: '수지가 굳었어요. 창은 조금 뿌옇지만 밖이 보여요.' } : { text: '금이 더 갔어요. 결국 셔터를 내렸어요.', morale: -0.08 } },
      { label: '그냥 둔다', hint: '', go: (v) => chance(0.9) ? { text: '금은 더 자라지 않았어요.' } : { text: '어느 날 밤 바깥 유리가 깨졌어요. 안쪽 유리가 버텼어요. 셔터를 내렸어요.', hull: -0.05, morale: -0.1 } },
    ],
  },
  {
    id: 'mold', cat: 'water', title: '벽에 곰팡이',
    desc: (v) => '환풍구 둘레가 거뭇해요. 미르는 말년에 곰팡이가 창을 뒤덮었어요.',
    src: 'Mir 곰팡이 보고 (1990년대, 창·배선 부식)',
    when: (v) => v.s.tau > 120 * DAY, rate: (v) => 0.2,
    options: [
      { label: '하루 종일 닦는다', hint: '', go: (v) => ({ text: '소독제 냄새가 사흘 갔어요. 깨끗해요.', delay: DAY }) },
      { label: '습도를 낮춘다', hint: '물 회수가 줄어요.', go: (v) => ({ text: '공기가 건조해졌어요. 입술이 트고, 곰팡이는 멈췄어요.', water: -10, health: -0.02 }) },
      { label: '내버려 둔다', hint: '', go: (v) => chance(0.6) ? { text: '더 번지진 않았어요.' } : { text: '배선까지 번졌어요. 센서 몇 개가 죽었어요.', power: -0.05, health: -0.05 } },
    ],
  },
  {
    id: 'gift', cat: 'earth', title: '뜻밖의 소포',
    desc: (v) => '창고 바닥에서 출발 전 누군가 숨겨 둔 상자를 찾았어요. 메모: "힘들 때 열 것."',
    src: 'ISS 보급선 "케어 패키지" 관행',
    when: (v) => v.s.morale < 0.5, rate: (v) => 0.3, once: 'gift',
    options: [
      { label: '연다', hint: '', go: (v) => ({ text: pick(['초콜릿 스무 개와 손편지.', '가족 사진 앨범과 커피 원두.', '작은 스피커와 노래 백 곡.']) + ' 그날은 다들 조용히 웃었어요.', morale: 0.25, flag: 'gift' }) },
      { label: '더 힘들 때 연다', hint: '', go: (v) => ({ text: '다시 바닥에 넣었어요. 있다는 것만으로 조금 나아요.', morale: 0.08, flag: 'gift' }) },
    ],
  },
  {
    id: 'grb', cat: 'signal', title: '하늘이 번쩍였어요',
    desc: (v) => '먼 은하에서 온 감마선 폭발이 10초 동안 모든 센서를 포화시켰어요. 수십억 년 전에 일어난 일이에요.',
    src: 'GRB 221009A (2022, 역대 최강); 스위프트 관측',
    rate: (v) => 0.03,
    options: [
      { label: '기록을 지구에 보낸다', hint: '', go: (v) => ({ text: '지구 망원경들보다 먼저 봤어요. 논문에 이름이 실릴 거예요. 언젠가.', morale: 0.1 }) },
      { label: '그냥 본다', hint: '', go: (v) => ({ text: '10초. 그리고 평소의 어둠.', morale: 0.05 }) },
    ],
  },
  {
    id: 'twin', cat: 'sf', title: '우리 배와 똑같은 신호',
    desc: (v) => '우리 호출 부호, 우리 목소리. 사흘 전 우리가 보낸 교신이 앞쪽에서 돌아와요. 누가 녹음해서 다시 보내는 걸까요.',
    src: SF('이벤트 호라이즌, 코히어런스'),
    when: (v) => v.from.kind !== 'solar', rate: (v) => 0.03,
    options: [
      { label: '새 암호문을 보내 본다', hint: '', go: (v) => chance(0.3) ? { text: '암호문이 돌아왔어요. 우리가 보낸 것보다 한 글자 더 붙어서. 해독하면 "먼저".', morale: -0.1, flag: 'contact' } : { text: '암호문은 돌아오지 않았어요. 반사였을 거예요. 뭐에 반사됐는지는 몰라요.' } },
      { label: '수신기를 끈다', hint: '', go: (v) => ({ text: '껐어요. 일주일 뒤 켰더니 조용했어요.', morale: -0.05 }) },
    ],
  },
  {
    id: 'oldage', cat: 'body', title: '손이 떨려요',
    desc: (v) => `${Math.floor(v.s.age)}세. 계기판 글씨가 흐리고, 손이 떨려 나사를 떨어뜨려요. 배는 내가 고쳐야 해요.`,
    src: '고령 우주비행 (존 글렌 77세, 1998)',
    trigger: (v) => v.s.age >= 70 && !v.s.flags.oldage, once: 'oldage',
    options: [
      { label: '컴퓨터에 정비를 더 맡긴다', hint: '', go: (v) => ({ text: '점검 목록을 컴퓨터에 넘겼어요. 가끔 틀려요.', navRisk: 0.1 }) },
      { label: '동료에게 넘긴다', when: (v) => v.s.crewAlive > 1, hint: '', go: (v) => ({ text: '젊은 손이 나사를 받았어요. 나는 창가에 앉아요.', morale: 0.05 }) },
      { label: '그래도 내가 한다', hint: '', go: (v) => chance(0.7) ? { text: '느리지만 해요. 나사는 두 개 잃었어요.' } : { text: '나사를 놓쳐 환풍기에 들어갔어요. 하루를 잃었어요.', delay: DAY, health: -0.03 } },
    ],
  },
];
EVENTS.push(...SF_EVENTS);
