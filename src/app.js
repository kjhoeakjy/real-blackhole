// 앱 진입점: 자료 로드, 화면 모드(지도/보기/떨어뜨리기/만들기) 전환, 렌더 루프, 시계, 실시간 서랍.
import { loadCatalog } from './data/catalog.js';
import { buildSkyCanvas } from './scene/bh-renderer.js';
import { UniverseMap } from './scene/map.js';
import { BHView } from './scene/bh-view.js';
import { MapMode } from './ui/map-mode.js';
import { ViewMode } from './ui/view-mode.js';
import { DropMode } from './ui/drop-mode.js';
import { BuildMode } from './ui/build-mode.js';
import { LivePanel } from './ui/live.js';
import { fmtHMS, fmtDate } from './ui/format.js';

const $ = (s) => document.querySelector(s);
const ctx = {
  catalog: null, stars: null, mw: null, skyCanvas: null, map: null, bh: null,
  mode: null, modes: {}, selected: null, custom: null,
  els: { panel: $('#panel'), body: $('#panel-body'), labels: $('#labels'), card: $('#card'), hint: $('#hint'), scale: $('#scale'), hud: $('#hud'), mapCanvas: $('#map-canvas'), bhCanvas: $('#bh-canvas') },
  setHint(t) { this.els.hint.textContent = t || ''; },
  setMode(name, arg) { setMode(name, arg); },
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
    msg('별하늘 41,411 개');
    await new Promise((r) => setTimeout(r, 10));
    ctx.skyCanvas = buildSkyCanvas(ctx.stars, ctx.mw, 4096, 2048);
    msg('은하 모형');
    await new Promise((r) => setTimeout(r, 10));
    ctx.map = new UniverseMap(ctx.els.mapCanvas, catalog, { skyCanvas: ctx.skyCanvas });
    ctx.bh = new BHView(ctx.els.bhCanvas, ctx.skyCanvas);
    ctx.modes = { map: new MapMode(ctx), view: new ViewMode(ctx), drop: new DropMode(ctx), build: new BuildMode(ctx) };
    ctx.live = new LivePanel(ctx);
    wireChrome();
    resize();
    const initial = (location.hash.replace('#', '') || 'map').split('/');
    setMode(ctx.modes[initial[0]] ? initial[0] : 'map', initial[1]);
    $('#loading').classList.add('done');
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e);
    fail(e.message || String(e));
  }
}

function wireChrome() {
  document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#live-btn').addEventListener('click', () => ctx.live.toggle());
  $('#drawer-close').addEventListener('click', () => ctx.live.toggle(false));
  $('#panel-toggle').addEventListener('click', () => ctx.els.panel.classList.remove('collapsed'));
  // 모바일: 패널 손잡이 탭으로 접기/펴기
  ctx.els.panel.addEventListener('click', (e) => { if (e.target === ctx.els.panel) ctx.els.panel.classList.toggle('collapsed'); });
  window.addEventListener('resize', resize);
  window.addEventListener('hashchange', () => { const [m, a] = location.hash.replace('#', '').split('/'); if (ctx.modes[m] && m !== ctx.mode) setMode(m, a); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { ctx.live.toggle(false); ctx.modes[ctx.mode]?.onEscape?.(); } });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ctx.map.resize(Math.round(w * dpr), Math.round(h * dpr));
  ctx.els.mapCanvas.style.width = w + 'px'; ctx.els.mapCanvas.style.height = h + 'px';
  ctx.bh.resize();
  ctx.bh.touch();
}

function setMode(name, arg) {
  if (!ctx.modes[name]) return;
  if (ctx.mode === name && arg == null) return;
  ctx.modes[ctx.mode]?.leave?.();
  ctx.mode = name;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.mode === name));
  const usesMap = name === 'map';
  ctx.els.mapCanvas.classList.toggle('hidden', !usesMap);
  ctx.els.bhCanvas.classList.toggle('hidden', usesMap);
  ctx.els.labels.classList.toggle('hidden', !usesMap);
  ctx.els.scale.classList.toggle('hidden', !usesMap);
  ctx.els.card.classList.add('hidden');
  ctx.els.hud.classList.remove('on');
  ctx.els.panel.classList.remove('collapsed');
  ctx.bh.clearFall();
  ctx.els.body.innerHTML = '';
  ctx.els.body.scrollTop = 0;
  ctx.modes[name].enter(arg);
  if (!usesMap) { ctx.bh.resize(); ctx.bh.touch(); }
  const hash = '#' + name + (arg ? '/' + arg : '');
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

let last = performance.now(), clockAt = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const m = ctx.modes[ctx.mode];
  if (ctx.mode === 'map') { ctx.map.render(dt); }
  else { ctx.bh.render(dt, now); }
  m?.tick?.(dt, now);
  if (now - clockAt > 250) {
    clockAt = now;
    const d = new Date();
    const kst = new Date(d.getTime() + 9 * 3600e3);
    $('#clock-text').textContent = `${fmtDate(d)} ${fmtHMS(d)} UTC · ${fmtHMS(kst)} KST`;
    ctx.live.tick?.(d);
  }
  requestAnimationFrame(loop);
}

boot();
