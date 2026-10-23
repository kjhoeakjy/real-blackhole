// 지도 모드: 실시간 태양계 → 은하 → 외부 우주. 왼쪽 패널에 지금 이 순간의 수치, 오른쪽에 거리 눈금.
import { GROUP_LABEL, GROUP_ORDER } from '../data/catalog.js';
import { AU, PC, LY, KPC, MPC, M_SUN } from '../physics/constants.js';
import { shadowAngularSizeMicroarcsec } from '../physics/gr.js';
import { fmtSci, fmtSolar, fmtPc, fmtLy, fmtAngle, fmtErr, esc, el } from './format.js';

const A = globalThis.Astronomy;
const TICKS = [
  [Math.log10(AU), '1 AU'], [Math.log10(10 * AU), '10 AU'], [Math.log10(30 * AU), '해왕성 궤도'], [Math.log10(100 * AU), '100 AU'],
  [Math.log10(1000 * AU), '1,000 AU'], [Math.log10(LY), '1 광년'], [Math.log10(PC), '1 pc'], [Math.log10(10 * PC), '10 pc'],
  [Math.log10(100 * PC), '100 pc'], [Math.log10(KPC), '1 kpc'], [Math.log10(8.277 * KPC), '은하 중심'], [Math.log10(30 * KPC), '우리은하'],
  [Math.log10(100 * KPC), '100 kpc'], [Math.log10(761 * KPC), '안드로메다'], [Math.log10(16.8 * MPC), 'M87 · 처녀자리'],
  [Math.log10(1000 * MPC), '1 Gpc'], [Math.log10(1e4 * MPC), '10 Gpc'],
];

export class MapMode {
  constructor(ctx) {
    this.ctx = ctx;
    this.map = ctx.map;
    this.selected = null;
    this._buildScale();
    ctx.els.mapCanvas.addEventListener('click', (e) => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const hit = this.map.pickAt(e.clientX * dpr, e.clientY * dpr, 26 * dpr);
      if (hit?.kind === 'bh') this.select(hit.data.id);
      else if (hit?.kind === 'planet') this.showPlanet(hit.data);
    });
    ctx.els.labels.addEventListener('click', (e) => {
      const t = e.target.closest('.lbl'); if (!t) return;
      if (t.dataset.bh) this.select(t.dataset.bh);
      else if (t.dataset.planet) this.showPlanet(this.map.planetSprites.find((s) => s.userData.body === t.dataset.planet)?.userData);
    });
  }
  _buildScale() {
    const sc = this.ctx.els.scale;
    sc.innerHTML = '<div class="rail"></div>';
    const lo = this.map.minLog, hi = this.map.maxLog;
    for (const [v, label] of TICKS) {
      const y = 100 - (v - lo) / (hi - lo) * 100;
      const t = el(`<div class="tick ${/AU|광년|pc|kpc|Mpc|Gpc/.test(label) ? '' : 'major'}" style="top:${y.toFixed(2)}%">${label}</div>`);
      t.addEventListener('click', () => this.map.zoomTo(v));
      sc.appendChild(t);
    }
    this.cursor = el('<div class="cursor"></div>'); this.cursorLabel = el('<div class="cursor-label num"></div>');
    sc.appendChild(this.cursor); sc.appendChild(this.cursorLabel);
  }
  enter(arg) {
    const b = this.ctx.els.body;
    b.innerHTML = '';
    this.root = el(`<div>
      <div class="section">
        <div class="eyebrow">지금 이 순간</div>
        <div class="title-lg">우주 지도</div>
        <p class="note">태양을 중심으로 실시간 행성 위치에서 시작해 은하와 그 너머까지 이어져요. 휠·핀치로 거리를 바꾸고, 끌어서 돌려 보세요. 블랙홀 표시를 누르면 자세한 값이 나와요.</p>
      </div>
      <div class="section" id="map-now"></div>
      <div class="section" id="map-planets"></div>
      <div class="section" id="map-bhs"></div>
      <div class="section">
        <div class="section-title">지도에 쓴 자료</div>
        <p class="note">행성 위치: astronomy-engine(VSOP87, 기기 안 계산) · 은하 모형: Reid et al. 2019 나선팔 꺾임점 모형, 막대 각도 27° (Wegg et al. 2015), R₀ = 8.277 kpc (GRAVITY 2022) · 별하늘: 히파르코스 41,411 개(d3-celestial) · 블랙홀 위치: 각 항목의 논문 좌표.</p>
      </div>
    </div>`);
    b.appendChild(this.root);
    this.nowEl = this.root.querySelector('#map-now');
    this.planetEl = this.root.querySelector('#map-planets');
    this.bhEl = this.root.querySelector('#map-bhs');
    this._renderBHList();
    this.ctx.setHint('끌기: 회전 · 휠/핀치: 거리 · 표시 클릭: 정보');
    this.lastPlanet = 0;
    if (arg) this.select(arg, true);
  }
  leave() { this.ctx.els.card.classList.add('hidden'); }
  onEscape() { this.ctx.els.card.classList.add('hidden'); }

  _renderBHList() {
    const groups = {};
    for (const bh of this.ctx.catalog) (groups[bh.group] ??= []).push(bh);
    let html = '<div class="section-title">실제 블랙홀 27개</div><div class="list">';
    for (const g of GROUP_ORDER) {
      if (!groups[g]) continue;
      html += `<div class="group-head"><span>${GROUP_LABEL[g]}</span><span>${groups[g].length}</span></div>`;
      for (const bh of groups[g]) {
        const where = bh.ra == null ? '하늘 위치 불확실' : bh.distPc != null ? `${fmtPc(bh.distPc)} · ${fmtLy(bh.distPc)}` : `z = ${bh.redshift}`;
        html += `<button class="item" data-id="${bh.id}"><div class="name"><b>${esc(bh.short)}</b><span>${esc(where)}</span></div><div class="meta num">${bh.mass ? fmtSolar(bh.mass) : '질량 미확정'}</div></button>`;
      }
    }
    html += '</div>';
    this.bhEl.innerHTML = html;
    this.bhEl.querySelectorAll('.item').forEach((it) => it.addEventListener('click', () => this.select(it.dataset.id)));
  }

  select(id, instant = false) {
    const bh = this.ctx.catalog.find((b) => b.id === id); if (!bh) return;
    this.selected = bh;
    this.ctx.selected = bh;
    this.bhEl.querySelectorAll('.item').forEach((it) => it.classList.toggle('active', it.dataset.id === id));
    // 지도 이동
    const sp = this.map.bhSprites.find((b) => b.bh.id === id);
    if (sp) {
      const L = this.map.layers[sp.layer];
      const p = sp.sprite.position;
      const dMeters = p.length() * L.unit;
      // 카메라는 원점을 보므로, 대상의 반대쪽에서 약간 위에서 내려다보게 둔다
      const n = Math.hypot(p.x, p.y, p.z) || 1;
      const d = [-p.x / n, -p.y / n, -p.z / n];
      const tilt = 0.32;
      const dir = [d[0] * Math.cos(tilt), d[1] * Math.cos(tilt), d[2] * Math.cos(tilt) + Math.sin(tilt)];
      this.map.flyTo(dir, Math.log10(dMeters) + 0.45, instant);
    }
    this._card(bh);
  }
  showPlanet(p) {
    if (!p) return;
    const now = new Date();
    const v = A.HelioVector(A.Body[p.body], now);
    const e = A.HelioVector(A.Body.Earth, now);
    const dSun = Math.hypot(v.x, v.y, v.z), dEarth = Math.hypot(v.x - e.x, v.y - e.y, v.z - e.z);
    const lt = dEarth * AU / 299792458;
    this.ctx.els.card.innerHTML = `<button class="close">×</button>
      <div class="eyebrow">행성 · 실시간</div><div class="title-md">${esc(p.name)}</div>
      <div class="kv" style="margin-top:10px">
        <div class="k">태양까지</div><div class="v num">${dSun.toFixed(4)} AU</div>
        <div class="k">지구까지</div><div class="v num">${dEarth.toFixed(4)} AU</div>
        <div class="k">빛으로</div><div class="v num">${lt < 3600 ? (lt / 60).toFixed(1) + ' 분' : (lt / 3600).toFixed(2) + ' 시간'}</div>
        <div class="k">공전 주기</div><div class="v num">${p.period.toFixed(2)} 일</div>
        <div class="k">반지름</div><div class="v num">${p.radiusKm.toLocaleString()} km</div>
      </div>
      <p class="note tiny" style="margin-top:8px">위치 계산: astronomy-engine (VSOP87), ${now.toISOString().slice(0, 19).replace('T', ' ')} UTC</p>`;
    this.ctx.els.card.classList.remove('hidden');
    this.ctx.els.card.querySelector('.close').addEventListener('click', () => this.ctx.els.card.classList.add('hidden'));
  }
  _card(bh) {
    const c = this.ctx.els.card;
    const shadow = bh.mass && bh.distPc ? fmtAngle(shadowAngularSizeMicroarcsec(bh.mass * M_SUN, bh.distPc * PC) * 1e-6 / 206264.806247) : null;
    const spin = bh.spinMeasured ? `<span class="num">${bh.spin}</span>` : `<span class="num">${bh.spin}</span> <span class="tag assume">가정</span>`;
    c.innerHTML = `<button class="close">×</button>
      <div class="eyebrow">${GROUP_LABEL[bh.group]}${bh.estimateOnly ? ' · <span class="tag warn">측정 아님</span>' : ''}</div>
      <div class="title-md">${esc(bh.short)}</div>
      <div class="faint small">${esc(bh.name)}</div>
      <div class="kv" style="margin-top:10px">
        <div class="k">질량</div><div class="v num">${bh.mass ? fmtErr(bh.mass, bh.massErrPlus, bh.massErrMinus) + ' M☉' : '미확정'}</div>
        <div class="k">스핀 a*</div><div class="v">${bh.mass ? spin : '—'}</div>
        <div class="k">거리</div><div class="v num">${bh.distPc != null ? fmtPc(bh.distPc) + ' <small>' + fmtLy(bh.distPc) + '</small>' : bh.redshift != null ? 'z = ' + bh.redshift : '—'}</div>
        ${bh.raStr ? `<div class="k">위치 (J2000)</div><div class="v num small">${esc(bh.raStr)} ${esc(bh.decStr)}</div>` : ''}
        ${shadow ? `<div class="k">지구에서 본 그림자</div><div class="v num">${shadow}</div>` : ''}
        ${bh.discovery ? `<div class="k">발견</div><div class="v num">${bh.discovery}</div>` : ''}
      </div>
      <p class="note" style="margin-top:10px">${esc(bh.fact || '')}</p>
      <div class="row" style="margin-top:12px">
        ${bh.infoOnly ? '' : `<button class="btn primary sm" data-go="view">광선추적으로 보기</button><button class="btn sm" data-go="drop">물체 떨어뜨리기</button>`}
      </div>`;
    c.classList.remove('hidden');
    c.querySelector('.close').addEventListener('click', () => c.classList.add('hidden'));
    c.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => this.ctx.setMode(b.dataset.go, bh.id)));
  }

  tick(dt, now) {
    const map = this.map;
    // 눈금 커서
    const lo = map.minLog, hi = map.maxLog;
    const y = 100 - (map.logDist - lo) / (hi - lo) * 100;
    this.cursor.style.top = y + '%'; this.cursorLabel.style.top = y + '%';
    this.cursorLabel.textContent = fmtDist(map.distanceMeters);
    // 라벨
    const PRI = { sun: 0, planet: 2, bh: 3, galaxy: 4 };
    const labels = map.projectLabels().sort((a, b) => (PRI[a.kind] - (a.data?.body === 'Earth' ? 1 : 0)) - (PRI[b.kind] - (b.data?.body === 'Earth' ? 1 : 0)));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const placed = [];
    let html = '';
    for (const l of labels) {
      const x = l.x / dpr, y2 = l.y / dpr;
      if (x < 40 || x > innerWidth - 40 || y2 < 60 || y2 > innerHeight - 40) continue;
      if (placed.some((p) => Math.abs(p.x - x) < 70 && Math.abs(p.y - y2) < 16)) continue;
      placed.push({ x, y: y2 });
      const sel = l.kind === 'bh' && this.selected && l.data?.id === this.selected.id;
      const data = l.kind === 'bh' ? `data-bh="${l.data.id}"` : l.kind === 'planet' ? `data-planet="${l.data.body}"` : '';
      html += `<div class="lbl ${l.kind}${sel ? ' selected' : ''}" ${data} style="left:${x.toFixed(1)}px;top:${y2.toFixed(1)}px;opacity:${l.alpha.toFixed(2)}">${esc(l.text)}</div>`;
    }
    this.ctx.els.labels.innerHTML = html;
    // 패널 수치 (1초마다)
    if (now - this.lastPlanet > 1000) {
      this.lastPlanet = now;
      const d = new Date();
      map.updatePlanets(d);
      const sunAU = map.planetSprites.map((s) => s.userData);
      this.nowEl.innerHTML = `<div class="section-title">보는 거리</div><div class="stat-row">
        <div class="stat"><div class="l">카메라</div><div class="v num">${fmtDist(map.distanceMeters)}</div></div>
        <div class="stat"><div class="l">빛으로</div><div class="v num">${fmtLight(map.distanceMeters)}</div></div>
        <div class="stat"><div class="l">시각 (UTC)</div><div class="v num">${d.toISOString().slice(11, 19)}</div></div></div>`;
      const earth = sunAU.find((p) => p.body === 'Earth');
      this.planetEl.innerHTML = `<div class="section-title">행성 · 지금 위치</div><table class="tbl"><tr><th>행성</th><th class="r">태양까지 (AU)</th><th class="r">지구까지 (AU)</th></tr>` +
        sunAU.map((p) => { const de = earth && p.helio ? Math.hypot(p.helio[0] - earth.helio[0], p.helio[1] - earth.helio[1], p.helio[2] - earth.helio[2]) : null; return `<tr><td>${p.name}</td><td class="r num">${p.distAU?.toFixed(3) ?? '—'}</td><td class="r num">${de != null ? de.toFixed(3) : '—'}</td></tr>`; }).join('') +
        `</table><p class="note tiny" style="margin-top:6px">VSOP87 이론으로 기기에서 직접 계산. JPL Horizons 와의 비교는 실시간 패널에서.</p>`;
    }
  }
}

export function fmtDist(m) {
  if (m < 0.1 * LY) return `${(m / AU).toPrecision(3)} AU`;
  if (m < 0.5 * PC) return `${(m / LY).toPrecision(3)} 광년`;
  if (m < 1e3 * PC) return `${(m / PC).toPrecision(3)} pc`;
  if (m < 1e6 * PC) return `${(m / KPC).toPrecision(3)} kpc`;
  if (m < 1e9 * PC) return `${(m / MPC).toPrecision(3)} Mpc`;
  return `${(m / (1e3 * MPC)).toPrecision(3)} Gpc`;
}
function fmtLight(m) {
  const s = m / 299792458;
  if (s < 3600) return `${(s / 60).toPrecision(3)} 분`;
  if (s < 86400 * 2) return `${(s / 3600).toPrecision(3)} 시간`;
  if (s < 86400 * 365.25) return `${(s / 86400).toPrecision(3)} 일`;
  const y = s / (86400 * 365.25);
  if (y < 1e4) return `${y.toPrecision(3)} 년`;
  return `${fmtSci(y, 3)} 년`;
}
