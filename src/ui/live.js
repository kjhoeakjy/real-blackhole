// 실시간 패널: 시계, 블랙홀 방향의 지평선 고도, JPL Horizons 교차검증, LVK(GraceDB) 최근 공개 이벤트.
import { esc, el, fmtHMS, fmtDate } from './format.js';

const A = globalThis.Astronomy;
const HORIZONS = (id, t0, t1) => `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${id}'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&REF_PLANE='FRAME'&VEC_TABLE='1'&OUT_UNITS='AU-D'&CSV_FORMAT='YES'&START_TIME='${t0}'&STOP_TIME='${t1}'&STEP_SIZE='1d'`;
const GRACEDB = 'https://gracedb.ligo.org/api/superevents/?query=is_public%3A%20True&count=6&orderby=-created&format=json';

export class LivePanel {
  constructor(ctx) {
    this.ctx = ctx;
    this.el = document.getElementById('drawer');
    this.body = document.getElementById('drawer-body');
    this.open = false;
    this.loc = { lat: 37.5665, lon: 126.978, name: '서울 (기본값)' };
    this.horizons = { state: 'idle' };
    this.gracedb = { state: 'idle' };
    this._render();
  }
  toggle(force) {
    this.open = force ?? !this.open;
    this.el.classList.toggle('open', this.open);
    if (this.open) { this._fetchAll(); this._render(); }
  }
  async _fetchAll() {
    if (this.horizons.state === 'idle') this._fetchHorizons();
    if (this.gracedb.state === 'idle') this._fetchGraceDB();
  }
  async _fetchHorizons() {
    this.horizons = { state: 'loading' };
    const now = new Date();
    const t0 = now.toISOString().slice(0, 10), t1 = new Date(now.getTime() + 86400e3).toISOString().slice(0, 10);
    const bodies = [['399', 'Earth', '지구'], ['499', 'Mars', '화성'], ['599', 'Jupiter', '목성']];
    try {
      const rows = [];
      for (const [id, body, name] of bodies) {
        const r = await fetch(HORIZONS(id, t0, t1), { mode: 'cors' });
        const j = await r.json();
        const txt = j.result || '';
        const m = txt.split('$$SOE')[1]?.split('$$EOE')[0]?.trim().split('\n')[0];
        if (!m) throw new Error('Horizons 응답 해석 실패');
        const f = m.split(',').map((s) => s.trim());
        // CSV: JDTDB, Calendar, X, Y, Z, ...
        const jpl = [+f[2], +f[3], +f[4]];
        const jd = +f[0];
        const date = new Date((jd - 2440587.5) * 86400e3);
        const v = A.HelioVector(A.Body[body], date);
        const dx = Math.hypot(v.x - jpl[0], v.y - jpl[1], v.z - jpl[2]) * 1.495978707e8; // km
        rows.push({ name, jd, jplAU: Math.hypot(...jpl), localAU: Math.hypot(v.x, v.y, v.z), dkm: dx });
      }
      this.horizons = { state: 'ok', rows, at: now };
    } catch (e) {
      this.horizons = { state: 'err', msg: e.message };
    }
    this._render();
  }
  async _fetchGraceDB() {
    this.gracedb = { state: 'loading' };
    try {
      const r = await fetch(GRACEDB, { mode: 'cors' });
      const j = await r.json();
      const ev = (j.superevents || []).map((s) => ({ id: s.superevent_id, created: s.created, far: s.far, labels: s.labels || [] }));
      this.gracedb = { state: 'ok', ev, at: new Date() };
    } catch (e) {
      this.gracedb = { state: 'err', msg: e.message };
    }
    this._render();
  }
  useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => { this.loc = { lat: p.coords.latitude, lon: p.coords.longitude, name: '현재 위치' }; this._render(); }, () => {});
  }
  _skyRows(d) {
    const obs = new A.Observer(this.loc.lat, this.loc.lon, 0);
    const list = this.ctx.catalog.filter((b) => b.ra != null).slice(0, 27);
    return list.map((b) => {
      const h = A.Horizon(d, obs, b.ra / 15, b.dec, 'normal');
      return { name: b.short, alt: h.altitude, az: h.azimuth };
    }).sort((p, q) => q.alt - p.alt);
  }
  _render() {
    if (!this.open) return;
    const d = new Date();
    const jd = d.getTime() / 86400e3 + 2440587.5;
    const sky = this._skyRows(d);
    const sun = A.Horizon(d, new A.Observer(this.loc.lat, this.loc.lon, 0), A.Equator(A.Body.Sun, d, new A.Observer(this.loc.lat, this.loc.lon, 0), true, true).ra, A.Equator(A.Body.Sun, d, new A.Observer(this.loc.lat, this.loc.lon, 0), true, true).dec, 'normal');
    const H = this.horizons, G = this.gracedb;
    const st = (s) => s === 'ok' ? 'ok' : s === 'err' ? 'err' : 'warn';
    this.body.innerHTML = `
      <div class="section">
        <div class="eyebrow">실시간</div>
        <div class="title-md">지금</div>
        <div class="kv" style="margin-top:8px">
          <div class="k">UTC</div><div class="v num">${fmtDate(d)} ${fmtHMS(d)}</div>
          <div class="k">KST</div><div class="v num">${fmtHMS(new Date(d.getTime() + 9 * 3600e3))}</div>
          <div class="k">율리우스일</div><div class="v num">${jd.toFixed(5)}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">블랙홀이 있는 하늘 · ${esc(this.loc.name)}</div>
        <p class="note tiny">태양 고도 ${sun.altitude.toFixed(1)}°. 고도가 양수면 지평선 위에 있어요. <a href="#" id="live-geo">내 위치 쓰기</a></p>
        <table class="tbl"><tr><th>블랙홀</th><th class="r">고도</th><th class="r">방위</th></tr>
          ${sky.slice(0, 10).map((r) => `<tr><td>${esc(r.name)}</td><td class="r num" style="color:${r.alt > 0 ? 'var(--ok)' : 'var(--text-3)'}">${r.alt.toFixed(1)}°</td><td class="r num">${r.az.toFixed(0)}°</td></tr>`).join('')}
        </table>
      </div>
      <div class="section">
        <div class="section-title">행성 위치 교차검증 · JPL Horizons</div>
        <div class="status"><span class="dot ${st(H.state)}"></span><span>${H.state === 'ok' ? `Horizons 응답 (${fmtHMS(H.at)} UTC)` : H.state === 'loading' ? '요청 중' : H.state === 'err' ? '브라우저에서 직접 접근 불가 (CORS 또는 네트워크)' : '대기'}</span></div>
        ${H.state === 'ok' ? `<table class="tbl" style="margin-top:6px"><tr><th>행성</th><th class="r">JPL (AU)</th><th class="r">기기 계산 (AU)</th><th class="r">차이</th></tr>${H.rows.map((r) => `<tr><td>${r.name}</td><td class="r num">${r.jplAU.toFixed(5)}</td><td class="r num">${r.localAU.toFixed(5)}</td><td class="r num">${r.dkm < 1000 ? r.dkm.toFixed(0) + ' km' : (r.dkm / 1e3).toFixed(1) + '천 km'}</td></tr>`).join('')}</table><p class="note tiny">오늘 0시 TDB 기준 태양중심 벡터 비교. 기기 계산은 VSOP87 (astronomy-engine).</p>` : H.state === 'err' ? `<p class="note tiny">${esc(H.msg || '')}. 지도는 기기 안에서 계산한 VSOP87 위치를 써요 (행성은 수백 km 이내로 맞아요).</p>` : ''}
      </div>
      <div class="section">
        <div class="section-title">중력파 · LIGO-Virgo-KAGRA</div>
        <div class="status"><span class="dot ${st(G.state)}"></span><span>${G.state === 'ok' ? `GraceDB 공개 이벤트 (${fmtHMS(G.at)} UTC)` : G.state === 'loading' ? '요청 중' : G.state === 'err' ? 'GraceDB 직접 접근 불가' : '대기'}</span></div>
        ${G.state === 'ok' ? `<table class="tbl" style="margin-top:6px"><tr><th>이벤트</th><th class="r">등록</th><th class="r">오경보율</th></tr>${G.ev.map((e) => `<tr><td><a href="https://gracedb.ligo.org/superevents/${esc(e.id)}/view/" target="_blank" rel="noopener">${esc(e.id)}</a></td><td class="r num">${esc((e.created || '').slice(0, 10))}</td><td class="r num">${e.far != null ? (1 / e.far / 31557600).toPrecision(2) + ' 년에 1번' : '—'}</td></tr>`).join('')}</table>` : ''}
        <p class="note tiny" style="margin-top:6px">O4 관측은 2025-11-18 에 끝났고 지금은 정비·업그레이드 기간이에요. 다음 관측(IR1, 약 6개월)은 2027년 1월 중순 시작이 목표 (observing.docs.ligo.org, 2026-10-15 기준). 카탈로그 GWTC-5.0 (2026-05) 까지 후보 390건.</p>
      </div>
      <div class="section">
        <div class="section-title">최근 소식 (2026-10 기준)</div>
        <p class="note">2026-08-19 GRAVITY+ 가 궁수자리 A* 를 8.7년 주기로 도는 별 S301 을 발표했어요. 근점 약 12 AU, 속도 약 25,000 km/s. 10년쯤 안에 Sgr A* 의 스핀을 잴 수 있을지도 몰라요 (Nature, doi:10.1038/s41586-026-10894-w).</p>
        <p class="note">2025-09 EHT: M87* 의 편광 무늬 방향이 2017 → 2021 사이에 뒤집혔어요. 2026-01: 2021년 자료에서 제트 밑동이 처음 보였어요.</p>
      </div>`;
    this.body.querySelector('#live-geo')?.addEventListener('click', (e) => { e.preventDefault(); this.useMyLocation(); });
  }
  tick() { if (this.open && Math.floor(Date.now() / 1000) % 5 === 0) this._render(); }
}
