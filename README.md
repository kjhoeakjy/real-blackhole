# 실제 블랙홀 (Real black holes)

실제 측정값과 논문 수치로 만든 블랙홀 체험. 브라우저에서 바로 열려요: **https://kjhoeakjy.github.io/real-blackhole/**

- **지도** — 지금 이 순간의 태양계(실시간 행성 위치)에서 출발해 은하수, 안드로메다, M87, 그 너머까지 로그 거리로 이어지는 우주 지도. 실제 블랙홀 27개가 논문 좌표에 표시돼요.
- **보기** — 일반상대론 광선추적(WebGL2)으로 본 블랙홀. 커 블랙홀의 측지선을 커–실드 좌표에서 적분하고, 강착원반은 노비코프–손 온도 분포에 도플러·중력 적색편이를 적용해요. 중력렌즈로 휜 별하늘은 히파르코스 별 41,411개.
- **떨어뜨리기** — 사람, 소행성 베누, 달, 지구, 화성, 목성, 태양, 백색왜성, 중성자별을 실제 블랙홀의 자전축 위에서 놓고, 완전히 분해될 때까지의 고유시간을 맞혀요. 그 뒤 물체의 눈으로 떨어지는 장면을 봐요 (지평선 안쪽까지).
- **만들기** — 질량과 스핀을 고르면 지평선·ISCO·호킹 온도·증발 시간·조석장 등 실제 물리량이 나오고, 바로 보거나 떨어뜨릴 수 있어요.
- **실시간** — 현재 위치에서 본 블랙홀들의 고도, JPL Horizons 와 행성 위치 교차검증, GraceDB 의 최근 공개 중력파 이벤트.

## 구조

```
index.html            화면
src/app.js            진입점, 모드 전환, 렌더 루프
src/ui/               지도·보기·떨어뜨리기·만들기·실시간 패널, 스타일
src/scene/bh-shader.js  커 블랙홀 광선추적 셰이더 (GLSL ES 3.00)
src/scene/bh-renderer.js  WebGL2 렌더러, 관측자 사면체, 하늘 텍스처
src/scene/bh-view.js    궤도 카메라, 적응형 해상도, 낙하 카메라
src/scene/map.js        three.js 우주 지도 (태양계 / 은하 / 원거리 3층)
src/physics/            상수(CODATA 2018), 커 기하·자유낙하·조석장·호킹 복사, 낙하 시나리오, 원반 온도
src/data/               블랙홀 카탈로그 보조정보, 떨어뜨릴 물체와 파괴 기준
data/                   blackholes.json(27개, 출처 포함), 히파르코스 별, 은하수 윤곽
research/               조사 노트 (블랙홀 측정값, 조석 파괴 물리)
vendor/                 three.js 0.170, OrbitControls, astronomy-engine 2.1.19
```

빌드 과정 없이 정적 파일만으로 동작해요. 로컬에서는 `python3 -m http.server` 같은 정적 서버로 열면 돼요 (fetch 를 쓰므로 file:// 로는 안 열려요).

## 물리

- 측지선: 해밀토니안 H = ½ g^{μν} p_μ p_ν, 커–실드 직교좌표, 해석적 ∂H/∂x, RK4. 지평선에서 정칙이라 지평선 안쪽에서 본 장면도 그대로 계산돼요.
- 원반: 얇은 원반, 내경 = ISCO (Bardeen, Press & Teukolsky 1972), 온도 T ∝ r^{-3/4}(1−√(r_in/r))^{1/4}, 케플러 4-속도로 적색편이 인자 g 계산, 밝기 g⁴. 온도 스케일 T* = (3GMṀ/8πσr_in³)^{1/4}, Ṁ = λL_Edd/(ηc²).
- 낙하: 자전축 위 자유낙하 (dr/dτ)² = E² − 1 + 2Mr/(r²+a²), 정지 출발. 조석장 k_r = 2GM·r(r²−3a²)/(r²+a²)³ (축 위 정확식, Ψ₂ 로부터).
- 분해 기준: 물체별 k_crit (사람은 허리 장력 ≈ 1.5×10⁴ N, 천체는 η·r_t, 태양은 Ryu et al. 2020 맞춤식), 미시 단계(분자 → 원자 → 핵 → 하드론 → 플랑크)는 research/disruption-physics.md 의 표.
- 호킹: T = ħc³/(4πGMk_B)·√(1−a*²)/(1+√(1−a*²)), 증발 t = 5120πG²M³/(ħc⁴) (광자만).

## 자료 출처

블랙홀 측정값은 `data/blackholes.json` 의 각 항목 `refs` 에, 조사 요약은 `research/black-holes.md` 에 있어요. 주요 출처: GRAVITY Collaboration 2022 (Sgr A* 질량·거리), EHT 2019/2022/2024 (M87*, Sgr A* 영상), Miller-Jones et al. 2021 (Cyg X-1), El-Badry et al. 2023 / Gaia Collaboration 2024 (Gaia BH1–3), LVK GWTC-4.0/5.0 (중력파), Reid et al. 2019 (은하 나선팔), Bland-Hawthorn & Gerhard 2016 (은하 구조).

스핀이 측정되지 않은 천체는 화면에 "가정" 으로 표시하고, 떨어뜨리기 게임에서는 0 으로 둬요. Phoenix A 의 질량은 측정이 아니라 모형 추정이라 따로 표시해요.

## 라이선스

코드: MIT. three.js (MIT, `vendor/LICENSE.three`), astronomy-engine (MIT), 별·은하수 자료는 d3-celestial (BSD-3, `data/LICENSE.d3-celestial`).
