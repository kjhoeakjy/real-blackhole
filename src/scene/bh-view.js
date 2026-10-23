// BHRenderer 를 감싼 화면용 뷰: 궤도 카메라, 적응형 해상도(움직일 때 낮게, 멈추면 점점 선명하게), 낙하 카메라.
import { BHRenderer, axisInfallU } from './bh-renderer.js';
import { isco, horizons } from '../physics/gr.js';
import { diskTemperature } from '../physics/disk.js';
import { M_SUN, tg } from '../physics/constants.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export class BHView {
  constructor(canvas, skyCanvas) {
    this.canvas = canvas;
    this.R = new BHRenderer(canvas);
    this.R.setSky(skyCanvas);
    this.cam = { inc: 80, az: 0, dist: 28, fov: 42 };   // inc: 자전축에서 잰 각(도), az: 방위(도)
    this.target = { ...this.cam };
    this.scale = 0.35;            // 현재 렌더 해상도 배율 (CSS 픽셀 × dpr 기준)
    this.liveScale = 0.35;        // 움직이거나 원반이 돌 때 쓰는 배율. 프레임 시간을 보고 계속 조절한다
    this.hq = false;
    this.maxScale = 1;            // 멈췄을 때 한 번 그리는 배율. resize() 에서 픽셀 예산으로 정한다
    this.stillPixels = 2.0e6;     // 정지 화면 픽셀 예산
    this.minScale = 0.12;
    this.dirty = true;
    this.lastInteract = 0;
    this.animate = true;
    this.timeScale = 3;           // 초당 흐르는 좌표시간 (단위 M)
    this.fall = null;             // { r, E, chi, lookUp }
    this.frameMs = 20;
    this.desc = null;
    this.onFrame = null;
    this._pointer();
  }
  _pointer() {
    const c = this.canvas;
    let drag = null, pinch = null;
    const down = (e) => { if (this.fall) return; drag = { x: e.clientX, y: e.clientY, inc: this.target.inc, az: this.target.az }; c.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!drag || this.fall) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      this.target.az = drag.az - dx * 0.25;
      this.target.inc = clamp(drag.inc - dy * 0.25, 1, 179);
      this.touch();
    };
    const up = () => { drag = null; };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => { if (this.fall) return; e.preventDefault(); this.target.dist = clamp(this.target.dist * Math.exp(Math.sign(e.deltaY) * 0.12), 3, 200); this.touch(); }, { passive: false });
    c.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
    c.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && pinch && !this.fall) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); this.target.dist = clamp(this.target.dist * (pinch / d), 3, 200); pinch = d; this.touch(); } }, { passive: true });
    c.addEventListener('touchend', () => { pinch = null; });
  }
  touch() { this.dirty = true; this.lastInteract = performance.now(); }

  // desc: { mass(M☉), spin, disk:'bright'|'faint'|'riaf'|'none', eddington, inc }
  setBH(desc, opts = {}) {
    this.desc = desc;
    const s = this.R.state;
    const chi = clamp(desc.spin ?? 0, 0, 0.998);
    s.a = chi;
    const Mkg = desc.mass * M_SUN;
    const rIsco = isco(chi, true);
    const lambda = desc.eddington ?? (desc.disk === 'none' ? 0 : 0.1);
    const dt = lambda > 0 ? diskTemperature(Mkg, lambda, chi) : null;
    this.diskInfo = dt ? { ...dt, lambda, assumed: desc.eddington == null } : null;
    s.disk.on = desc.disk !== 'none' && lambda > 0 && opts.disk !== false;
    s.disk.rin = rIsco;
    s.disk.rout = Math.max(14, rIsco * 4.5);
    s.disk.Tstar = dt ? clamp(dt.Tstar, 1200, 40000) : 6500;
    // 노비코프–손 원반은 T ∝ r^-3/4 라 ISCO 근처 고리만 밝다. 정면에서도 바깥 원반이 보이도록 노출을 올린다 (안쪽은 ACES 로 부드럽게 포화)
    s.disk.gain = desc.disk === 'faint' ? 0.7 : desc.disk === 'riaf' ? 1.1 : 1.3;
    s.disk.turb = 0.75;
    s.skyGain = 1;
    s.obj.on = false;
    this.tg = tg(Mkg);
    this.rPlus = horizons(chi).rPlus;
    if (opts.inc != null) this.target.inc = this.cam.inc = clamp(opts.inc, 1, 179);
    if (opts.dist != null) this.target.dist = this.cam.dist = opts.dist === 'auto' ? clamp(2.3 * s.disk.rout, 26, 60) : opts.dist;
    this.touch();
  }
  setDisk(on) { this.R.state.disk.on = on && this.desc?.disk !== 'none'; this.touch(); }
  setSpin(chi) { if (this.desc) { this.desc = { ...this.desc, spin: chi }; this.setBH(this.desc); } }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // 정지 화면은 픽셀 예산 안에서만 (고화질이면 dpr 전체)
    const full = w * h * dpr * dpr;
    this.maxScale = this.hq ? 1 : Math.min(1, Math.sqrt(this.stillPixels / full));
    this.liveScale = clamp(this.liveScale, this.minScale, this.maxScale);
    const W = Math.max(64, Math.round(w * dpr * this.scale)), H = Math.max(36, Math.round(h * dpr * this.scale));
    this.R.resize(W, H);
  }
  setHQ(on) { this.hq = on; this.resize(); this.touch(); }
  // 낙하 카메라: 자전축 위 r (단위 M), 보존 에너지 E
  setFall(r, E, chi, look = 'down') {
    this.fall = { r, E, chi, look };
    this.R.state.a = chi;
    this.dirty = true;
  }
  clearFall() { this.fall = null; this.touch(); }

  _applyCamera() {
    const s = this.R.state;
    if (this.fall) {
      const { r, E, chi, look } = this.fall;
      const u = axisInfallU(r, E, chi);
      const pos = [0, 0, r];
      // '블랙홀 쪽'은 축에서 32° 기울여 본다: 지평선 안에서 정면(특이점 방향)은 완전히 검고, 바깥 우주는 등 뒤 쪽으로 몰리기 때문
      if (look === 'down') this.R.lookAt(pos, [r * Math.tan(32 * Math.PI / 180), 0, 0], [0, 0, 1], u);
      else if (look === 'up') this.R.lookAt(pos, [0, 0, r + 10], [1, 0, 0], u);
      else this.R.lookAt(pos, [1, 0, r], [0, 0, 1], u);
      s.fov = 95;
      return;
    }
    const c = this.cam;
    const inc = c.inc * Math.PI / 180, az = c.az * Math.PI / 180;
    const pos = [c.dist * Math.sin(inc) * Math.cos(az), c.dist * Math.sin(inc) * Math.sin(az), c.dist * Math.cos(inc)];
    this.R.lookAt(pos, [0, 0, 0], [0, 0, 1]);
    s.fov = c.fov;
  }
  // 매 프레임 호출. 반환: 실제로 그렸는지
  render(dt, now) {
    const c = this.cam, t = this.target;
    let moving = false;
    if (!this.fall) {
      for (const k of ['inc', 'az', 'dist']) {
        const d = t[k] - c[k];
        if (Math.abs(d) > (k === 'dist' ? 0.002 * c.dist : 0.02)) { c[k] += d * Math.min(1, dt * 9); moving = true; }
        else c[k] = t[k];
      }
    }
    const s = this.R.state;
    const animating = this.animate && s.disk.on;
    if (animating) { s.time += dt * this.timeScale; }
    const idleFor = now - this.lastInteract;
    const live = moving || !!this.fall || animating || idleFor < 400;   // 매 프레임 그리는 상태
    // 적응형 해상도: 직전 프레임 간격(dt)이 GPU 가 밀린 정도를 그대로 보여 준다. 30 fps 근처를 목표로 올리고 내린다
    if (this._liveLast) {
      if (dt > 0.05) this.liveScale *= 0.85;
      else if (dt > 0.038) this.liveScale *= 0.96;
      else if (dt < 0.022) this.liveScale *= 1.02;
      this.liveScale = clamp(this.liveScale, this.minScale, this.maxScale);
    }
    this._liveLast = live;
    const want = live ? this.liveScale : this.maxScale;       // 멈추면 한 번 선명하게
    const need = this.dirty || live || Math.abs(want - this.scale) > 0.01;
    if (!need) return false;
    if (Math.abs(want - this.scale) > 0.01) { this.scale = want; this.resize(); }
    // 적분 스텝: 움직일 때는 짧게, 정지 화면은 길게, 고화질은 더 길게
    s.maxSteps = this.hq ? 900 : live ? 300 : 520;
    this._applyCamera();
    this.R.render();
    this.dirty = false;
    this.onFrame?.();
    return true;
  }
}
