# 블랙홀 체험 — 작업 인수인계 (2026-10-23 01:10 UTC)

이 폴더(`/mnt/project-files/black-hole/`)가 저장소 `kjhoeakjy/real-blackhole`(현재 빈 저장소, main 브랜치) 의 내용이 될 예정.
GitHub Pages 로 서비스. 사용자 요구: 실제 데이터·최신 논문 수치 그대로, 실시간 데이터, 사진 같은 그래픽, 완성도 100, 시간 제한 없음. 한국어 해요체, 절제된 UI 문구.

## 지금까지 된 것 (모두 이 폴더 안)
- `research/black-holes.md`, `research/black-holes.json` : 블랙홀 27개 측정값+출처 (서브에이전트 조사, 2026-10 기준). 논쟁점 섹션 있음 (Cyg X-1 질량, M87* 질량/스핀, TON 618, Phoenix A 는 측정 아님 등).
- `research/disruption-physics.md` : 조석 파괴 물리 노트. 권장 모형: 자전축 방향 자유낙하(커는 축 위에서만), 조석장 k=2GM/r³, 물체별 k_crit/η 표, 미시 단계 사다리(분자 3e27 → 원자 1.7e33 → 핵 1e45 → 하드론 5e47 → 플랑크 3.4e86 s⁻²), 호킹 복사, 관측자 시점.
- `data/stars8.bin` : 히파르코스 41,411 별 (float32 ×4: ra, dec, mag, bv) — d3-celestial(BSD) 에서 변환. `data/mw.json` 은하수 윤곽, `data/bright-stars.json` 밝은 별 이름, `data/blackholes.json` (research 사본).
- `vendor/` : three.module.min.js 0.170.0, OrbitControls.js, astronomy.browser.min.js 2.1.19 (전역 `Astronomy`; HelioVector/Rotation_EQJ_GAL/RotateVector 사용).
- `src/physics/constants.js` : CODATA 2018 / IAU 2015 상수.
- `src/physics/gr.js` : 커 지평선·ISCO·광자궤도, 자전축 자유낙하 고유시간(수치, 되튐점 처리), 좌표시간, 축 위 조석장 A(r)=r(r²−3a²)/(r²+a²)³ (정확식), 조석 최대점·도달 반지름, 호킹 온도·증발시간. **검증됨** (슈바르츠실트 닫힌식과 일치, Sgr A* 그림자 53.3 µas vs EHT 51.8±2.3).
- `src/physics/fall.js` : buildScenario(bh, obj, r0M) → 단계별 반지름/고유시간, 지평선/내부지평선/되튐점, 먼 관측자 시간, 병합 영역·통째 삼킴 플래그; fmtTime/fmtLen/fmtMass.
- `src/data/objects.js` : 집어넣을 물체 9개(사람, 베누, 달, 지구, 화성, 목성, 태양, 시리우스 B, PSR J0740+6620) 단계·출처. `src/data/catalog.js` : JSON 위에 렌더링 보조정보(가정 스핀·경사각·원반 종류) 덧씌움. 스핀 미측정은 반드시 '가정' 표기.
- `src/scene/bh-shader.js` + `src/scene/bh-renderer.js` : **커 블랙홀 광선추적 (WebGL2)**. 커-실드(ingoing) 직교좌표 해밀토니안 측지선 RK4, 해석적 ∂H/∂x (검증됨). 노비코프–손 온도의 얇은 원반 + 케플러 4-속도 적색편이 g (도플러·중력), 하늘 텍스처 렌즈, 자전축 위 낙하 물체(타원체) 및 낙하 카메라(4-속도 axisInfallU, 지평선 안쪽도 정칙). ACES 톤맵.
  - 검증 스크린샷: a=0, a=0.9 에서 Interstellar 식 상·하 아크, 도플러 빔, 그림자 정상.
  - **남은 문제**: a ≥ 0.98 에서 그림자 안에 별이 새는 픽셀(지평선 근처 수치 발산). 임시로 렌더링 스핀을 0.95 로 clamp 하고 표기하거나, (r−r+) 비례 스텝/종료 조건 개선 필요.
  - 테스트: `tools/test-bh.html?a=0.9&inc=80&gain=4` ; 헤드리스 스크린샷 스크립트는 스크래치패드에 있었음(Playwright + swiftshader, `--use-gl=angle --use-angle=swiftshader`). 로컬 서버로 열어야 함(fetch 사용).
- `src/scene/map.js` : 우주 지도(three.js). 3층(태양계 AU / 은하 kpc / 원거리 Mpc)을 같은 방향 카메라로 겹쳐 그림, 로그 줌(logDist = log10 m, 10.6~27.2). 행성 9개 실시간 위치(astronomy-engine, Horizons 벡터 있으면 우선), 궤도선, Reid 2019 꺾임점 나선팔 모형+막대 27°+벌지+헤일로 16만 점, 블랙홀 마커(ra/dec/거리 → 은하좌표), M31/M33/LMC/M87 스프라이트, 라벨 투영·클릭 선택. **아직 브라우저에서 한 번도 실행 안 함 — 디버깅 필요.**
- `tools/test-bh.html` 렌더러 테스트 페이지.

## 아직 없는 것 (다음 스레드가 할 일)
1. `index.html` + `src/app.js` (UI 전체): 탭 = 지도 / 블랙홀 보기 / 집어넣기(맞히기 게임) / 만들기 / 실시간 패널. 디자인: 어두운 단색, 절제된 문구, 숫자는 tabular-nums, 모바일 대응.
2. 원반 온도: T* = (3GMṀ/(8πσ r_in³))^{1/4}, Ṁ = λL_Edd/(η c²), η = 1−E_isco, E_isco=√(1−2/(3r_isco)). 'riaf' 천체는 "같은 광도를 얇은 원반으로 환산" 이라고 표기. 원반 없음(잠든 BH·병합잔해)은 렌즈된 별하늘만.
3. 집어넣기 게임: BH + 물체 + 출발거리(r0 = max(1000 r_g, 10×주파괴반지름, 100×물체반지름) 권장) → 사용자가 '완전 분해까지 고유시간' 추측(숫자+단위) + '지평선 전에 찢어질까' 예/아니오 → 낙하 카메라(1인칭) 애니메이션 + 타임라인 + 늘임비 HUD → 정답 공개, 점수는 log10 오차 기준. 게임용 스핀은 측정값만 쓰고 미측정은 0 (축 위 커에서는 조석이 유한해서 Sgr A* 가정 스핀 0.5 면 사람이 내부 지평선까지 멀쩡함 — 이 사실 자체도 표시 가치 있음).
4. 만들기: 질량(로그 슬라이더, '지구를 압축하면' 등 프리셋)·스핀 → r_s, ISCO, 호킹 온도, 증발시간(f 보정 가정 표기), 그림자 크기 → 보기/집어넣기로 연결.
5. 실시간: JPL Horizons API (`https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='499'&EPHEM_TYPE=VECTORS&CENTER='500@10'&...`) 교차검증, GraceDB 공개 superevents (`https://gracedb.ligo.org/api/superevents/?query=is_public%3A%20True&count=10&orderby=-created&format=json`) — CORS 는 배포 후 실제 브라우저에서 확인해야 함(이 환경은 외부 접근 차단). 현재 LVK 상태: O4 는 2025-11-18 종료, 2026-10 현재 정비·업그레이드 중, IR1 6개월 관측 2027년 1월 중순 목표 (observing.docs.ligo.org, 2026-10-15 갱신).
6. README(한국어, 출처 목록), 저장소 푸시, Pages.

## 메모
- 이 환경(클라우드 컨테이너)은 npm 레지스트리 외 외부 접근이 막혀 있었음. 필요한 라이브러리는 `npm pack` 으로 받음.
- 사용자 GitHub: 이 스레드의 연결 신원은 yjkim0822 라 푸시 불가였고, 사용자가 kjhoeakjy 로 연결을 바꿔 새 스레드를 요청함.
