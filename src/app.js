// 앱 진입점: 자료 로드, 지도·블랙홀 화면 전환, 렌더 루프, 시계.
import { loadCatalog } from './data/catalog.js';
import { STARS } from './data/destinations.js';
import { buildSkyCanvas } from './scene/bh-renderer.js';
import { UniverseMap } from './scene/map.js';
import { BHView } from './scene/bh-view.js';
import { TripMode } from './ui/trip-mode.js';
import { fmtHMS, fmtDate } from './ui/format.js';

const $ = (s) => document.querySelector(s);
const ctx = {
  catalog: null, stars: null, mw: null, skyCanvas: null, map: null, bh: null, mode: null, bhOn: false,
  els: { panel: $('#panel'), body: $('#panel-body'), labels: $('#labels'), hint: $('#hint'), scale: $('#scale'), mapCanvas: $('#map-canvas'), bhCanvas: $('#bh-canvas') },
  setHint(t) { this.els.hint.textContent = t || ''; },
  // 지도 ↔ 블랙홀 광선추적 화면
  showBH(on) {
    this.bhOn = on;
    this.els.mapCanvas.classList.toggle('hidden', on);
    this.els.bhCanvas.classList.toggle('hidden', !on);
    this.els.labels.classList.toggle('hidden', on);
    this.els.scale.classList.toggle('hidden', on);
    if (on) { this.bh.resize(); this.bh.touch(); } else this.map._needsRender = true;
  },
};
window.__bh = ctx;

function fail(msg) { $('#error-msg').textContent = msg; $('#error').classList.add('on'); $('#loading').classList.add('done'); }

async function boot() {
  const msg = (t) => { $('#loading-msg').textContent = t; };
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('이 브라우저는 WebGL2 를 지원하지 않아요. 최신 Chrome, Safari, Firefox 에서 열어 주세요.');
    msg('블랙홀 카탈로그');
    const [catalog, starsBuf, mw] = await Promise.all([
      loadCatalog('data/blackholes.json'),
      fetch('data/stars8.bin').then((r) => r.arrayBuffer()),
      fetch('data/mw.json').then((r) => r.json()),
    ]);
    ctx.catalog = catalog; ctx.stars = new Float32Array(starsBuf); ctx.mw = mw;
    msg('별하늘');
    await new Promise((r) => setTimeout(r, 10));
    ctx.skyCanvas = buildSkyCanvas(ctx.stars, ctx.mw, 2048, 1024);
    msg('은하 모형');
    await new Promise((r) => setTimeout(r, 10));
    ctx.map = new UniverseMap(ctx.els.mapCanvas, catalog, { skyCanvas: ctx.skyCanvas, stars: STARS });
    ctx.bh = new BHView(ctx.els.bhCanvas, ctx.skyCanvas);
    ctx.mode = new TripMode(ctx);
    wireChrome();
    resize();
    ctx.mode.enter();
    $('#loading').classList.add('done');
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e);
    fail(e.message || String(e));
  }
}

function wireChrome() {
  $('#panel-toggle').addEventListener('click', () => ctx.els.panel.classList.remove('collapsed'));
  // 모바일: 패널 손잡이 탭으로 접기/펴기
  ctx.els.panel.addEventListener('click', (e) => { if (e.target === ctx.els.panel) ctx.els.panel.classList.toggle('collapsed'); });
  window.addEventListener('resize', resize);
  // 페이지 줌 막기: 지도·블랙홀 화면의 핀치는 각 캔버스가 직접 받는다
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 && !e.target.closest('#stage')) e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  // 지도는 점 수만 개를 가산 합성으로 그리므로 픽셀 비율을 1.5 까지만 쓴다
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  ctx.map.resize(Math.round(w * dpr), Math.round(h * dpr));
  ctx.els.mapCanvas.style.width = w + 'px'; ctx.els.mapCanvas.style.height = h + 'px';
  ctx.bh.resize();
  ctx.bh.touch();
}

let last = performance.now(), clockAt = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (ctx.bhOn) ctx.bh.render(dt, now); else ctx.map.render(dt);
  ctx.mode.tick(dt, now);
  if (now - clockAt > 250) {
    clockAt = now;
    const d = new Date();
    const kst = new Date(d.getTime() + 9 * 3600e3);
    $('#clock-text').textContent = `${fmtDate(d)} ${fmtHMS(d)} UTC · ${fmtHMS(kst)} KST`;
  }
  requestAnimationFrame(loop);
}

boot();
