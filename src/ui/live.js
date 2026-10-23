// 실시간 패널: 시계, 블랙홀 방향의 고도, JPL Horizons 교차검증, GraceDB 최근 공개 이벤트.
import { esc, fmtHMS, fmtDate } from './format.js';

const A = globalThis.Astronomy;
const HORIZONS = (id, t0, t1) => `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${id}'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'&CENTER='500@10'&REF_PLANE='FRAME'&VEC_TABLE='1'&OUT_UNITS='AU-D'&CSV_FORMAT='YES'&START_TIME='${t0}'&STOP_TIME='${t1}'&STEP_SIZE='1d'`;
const GRACEDB = 'https://gracedb.ligo.org/api/superevents/?query=is_public%3A%20True&count=6&orderby=-created&format=json';

export class LivePanel {
  constructor(ctx) {
    this.ctx = ctx;
    this.el = document.getElementById('drawer');
    this.body = document.getElementById('drawer-body');
    this.open = false;
    this.loc = { lat: 37.5665, lon: 126.978, name: '서울' };
    this.horizons = { state: 'idle' };
    this.gracedb = { state: 'idle' };
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
        const m = (j.result || '').split('$$SOE')[1]?.split('$$EOE')[0]?.trim().split('\n')[0];
        if (!m) throw new Error('응답 해석 실패');
        const f = m.split(',').map((s) => s.trim());
        const jpl = [+f[2], +f[3], +f[4]];
        const date = new Date((+f[0] - 2440587.5) * 86400e3);
        const v = A.HelioVector(A.Body[body], date);
        rows.push({ name, jplAU: Math.hypot(...jpl), localAU: Math.hypot(v.x, v.y, v.z), dkm: Math.hypot(v.x - jpl[0], v.y - jpl[1], v.z - jpl[2]) * 1.495978707e8 });
      }
      this.horizons = { state: 'ok', rows, at: now };
    } catch (e) { this.horizons = { state: 'err', msg: e.message }; }
    this._render();
  }
  async _fetchGraceDB() {
    this.gracedb = { state: 'loading' };
    try {
      const r = await fetch(GRACEDB, { mode: 'cors' });
      const j = await r.json();
      this.gracedb = { state: 'ok', ev: (j.superevents || []).map((s) => ({ id: s.superevent_id, created: s.created, far: s.far })), at: new Date() };
    } catch (e) { this.gracedb = { state: 'err', msg: e.message }; }
    this._render();
  }
  useMyLocation() {
    navigator.geolocation?.getCurrentPosition((p) => { this.loc = { lat: p.coords.latitude, lon: p.coords.longitude, name: '내 위치' }; this._render(); }, () => {});
  }
  _render() {
    if (!this.open) return;
    const d = new Date();
    const obs = new A.Observer(this.loc.lat, this.loc.lon, 0);
    const sky = this.ctx.catalog.filter((b) => b.ra != null).map((b) => { const h = A.Horizon(d, obs, b.ra / 15, b.dec, 'normal'); return { name: b.short, alt: h.altitude, az: h.azimuth }; }).sort((p, q) => q.alt - p.alt);
    const H = this.horizons, G = this.gracedb;
    const st = (s) => s === 'ok' ? 'ok' : s === 'err' ? 'err' : 'warn';
    this.body.innerHTML = `
      <div class="section"><div class="eyebrow">실시간</div>
        <div class="kv" style="margin-top:4px"><div class="k">UTC</div><div class="v num">${fmtDate(d)} ${fmtHMS(d)}</div><div class="k">KST</div><div class="v num">${fmtHMS(new Date(d.getTime() + 9 * 3600e3))}</div></div>
      </div>
      <div class="section">
        <div class="section-title">지금 하늘 · ${esc(this.loc.name)} <a href="#" id="live-geo" style="margin-left:8px;font-weight:400;text-transform:none;letter-spacing:0">내 위치</a></div>
        <table class="tbl"><tr><th>블랙홀</th><th class="r">고도</th><th class="r">방위</th></tr>
          ${sky.slice(0, 8).map((r) => `<tr><td>${esc(r.name)}</td><td class="r num" style="color:${r.alt > 0 ? 'var(--ok)' : 'var(--text-3)'}">${r.alt.toFixed(1)}°</td><td class="r num">${r.az.toFixed(0)}°</td></tr>`).join('')}
        </table>
      </div>
      <div class="section">
        <div class="section-title">행성 위치 · JPL Horizons 대조</div>
        <div class="status"><span class="dot ${st(H.state)}"></span><span>${H.state === 'ok' ? `응답 ${fmtHMS(H.at)} UTC` : H.state === 'loading' ? '요청 중' : H.state === 'err' ? '브라우저에서 접근 불가' : '대기'}</span></div>
        ${H.state === 'ok' ? `<table class="tbl" style="margin-top:6px"><tr><th></th><th class="r">JPL (AU)</th><th class="r">기기 (AU)</th><th class="r">차이</th></tr>${H.rows.map((r) => `<tr><td>${r.name}</td><td class="r num">${r.jplAU.toFixed(5)}</td><td class="r num">${r.localAU.toFixed(5)}</td><td class="r num">${r.dkm < 1000 ? r.dkm.toFixed(0) + ' km' : (r.dkm / 1e3).toFixed(1) + '천 km'}</td></tr>`).join('')}</table>` : ''}
      </div>
      <div class="section">
        <div class="section-title">중력파 · GraceDB</div>
        <div class="status"><span class="dot ${st(G.state)}"></span><span>${G.state === 'ok' ? `공개 이벤트 ${fmtHMS(G.at)} UTC` : G.state === 'loading' ? '요청 중' : G.state === 'err' ? '브라우저에서 접근 불가' : '대기'}</span></div>
        ${G.state === 'ok' ? `<table class="tbl" style="margin-top:6px"><tr><th>이벤트</th><th class="r">등록</th><th class="r">오경보율</th></tr>${G.ev.map((e) => `<tr><td><a href="https://gracedb.ligo.org/superevents/${esc(e.id)}/view/" target="_blank" rel="noopener">${esc(e.id)}</a></td><td class="r num">${esc((e.created || '').slice(0, 10))}</td><td class="r num">${e.far != null ? (1 / e.far / 31557600).toPrecision(2) + ' 년에 1번' : '—'}</td></tr>`).join('')}</table>` : ''}
        <p class="note tiny" style="margin-top:6px">O4 종료 2025-11-18 · 다음 관측(IR1) 2027-01 목표 · 후보 390건 (GWTC-5.0)</p>
      </div>`;
    this.body.querySelector('#live-geo')?.addEventListener('click', (e) => { e.preventDefault(); this.useMyLocation(); });
  }
  tick() { if (this.open && Math.floor(Date.now() / 1000) % 5 === 0) this._render(); }
}
