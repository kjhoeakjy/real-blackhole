// WebGL2 블랙홀 렌더러: 셰이더 구동, 카메라 사면체 계산, 하늘 텍스처.
import { VERT, FRAG } from './bh-shader.js';

// ---------- 커-실드 기하 (JS 쪽, 카메라 사면체용) ----------
function ksGeom(x, a) {
  const [X, Y, Z] = x;
  const rho2 = X * X + Y * Y + Z * Z, b = rho2 - a * a;
  const S = Math.sqrt(b * b + 4 * a * a * Z * Z);
  const r2 = 0.5 * (b + S), r = Math.sqrt(r2);
  const d = r2 + a * a;
  const f = 2 * r2 * r / (r2 * r2 + a * a * Z * Z);
  const l = [(r * X + a * Y) / d, (r * Y - a * X) / d, Z / r];
  return { r, f, l };
}
// g_{μν} v^μ w^ν
function gdot(v, w, f, l) {
  const lv = v[0] + l[0] * v[1] + l[1] * v[2] + l[2] * v[3];
  const lw = w[0] + l[0] * w[1] + l[1] * w[2] + l[2] * w[3];
  return -v[0] * w[0] + v[1] * w[1] + v[2] * w[2] + v[3] * w[3] + f * lv * lw;
}
const sub = (a, b, s) => a.map((v, i) => v - s * b[i]);
const scale = (a, s) => a.map((v) => v * s);

// 관측자 4-속도 u 와 공간 방향 세 개(오른쪽, 위, 앞)로 정규직교 사면체를 만든다 (그람–슈미트).
export function tetrad(x, a, u, right, up, fwd) {
  const { f, l } = ksGeom(x, a);
  const e0 = scale(u, 1 / Math.sqrt(-gdot(u, u, f, l)));
  const basis = [e0];
  const out = [];
  for (const dir of [fwd, up, right]) {
    let v = [0, dir[0], dir[1], dir[2]];
    // e0 성분 제거 (시간꼴이므로 부호 주의): v -= g(v,e0)/g(e0,e0) e0 = v + g(v,e0) e0
    v = sub(v, e0, -gdot(v, e0, f, l));
    for (let k = 1; k < basis.length; k++) v = sub(v, basis[k], gdot(v, basis[k], f, l));
    const n = Math.sqrt(Math.max(1e-30, gdot(v, v, f, l)));
    v = scale(v, 1 / n);
    basis.push(v);
    out.push(v);
  }
  // out = [fwd, up, right]
  return { u: e0, e3: out[0], e2: out[1], e1: out[2] };
}

// 정적 관측자 4-속도 (지평선 밖에서만 가능)
export function staticObserver(x, a) {
  const { f } = ksGeom(x, a);
  const gtt = -1 + f;
  if (gtt >= 0) return null;
  return [1 / Math.sqrt(-gtt), 0, 0, 0];
}

// 자전축(+z) 위 자유낙하 4-속도 (KS 좌표, 지평선에서 정칙). E = 보존 에너지, r = 현재 반지름.
export function axisInfallU(r, E, a) {
  const d = r * r + a * a, delta = r * r - 2 * r + a * a;
  const vr2 = E * E - 1 + 2 * r / d;
  const ur = -Math.sqrt(Math.max(0, vr2));
  const ut = (E * E * (d + 2 * r) + 4 * r * r / d) / (E * d - 2 * r * ur);
  return [ut, 0, 0, ur];
}

// ---------- 하늘 텍스처 ----------
// 히파르코스 별(ra, dec, mag, bv) + 은하수 윤곽(GeoJSON MultiPolygon, 등고선 5단계)을 등장방형(equirectangular) 캔버스에 그린다.
export function buildSkyCanvas(stars, mw, W = 4096, H = 2048) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // 은하수: 바깥 윤곽부터 안쪽으로 밝아지는 띠. mw.json 의 id 는 ol1..ol5.
  if (mw) {
    const feats = mw.features.slice().sort((p, q) => String(p.id).localeCompare(String(q.id)));
    const tones = ['rgba(120,130,170,0.10)', 'rgba(140,150,190,0.13)', 'rgba(170,175,210,0.16)', 'rgba(200,200,225,0.18)', 'rgba(230,225,235,0.22)'];
    feats.forEach((ft, k) => {
      ctx.fillStyle = tones[Math.min(k, tones.length - 1)];
      const polys = ft.geometry.type === 'MultiPolygon' ? ft.geometry.coordinates : [ft.geometry.coordinates];
      for (const poly of polys) {
        for (const ring of poly) {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const ra = lon < 0 ? lon + 360 : lon;
            const px = (ra / 360) * W, py = (0.5 - lat / 180) * H;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          });
          ctx.closePath(); ctx.fill();
        }
      }
    });
    // 살짝 흐리게
    ctx.filter = 'blur(6px)';
    ctx.drawImage(cv, 0, 0);
    ctx.filter = 'none';
  }
  // 별: 밝기 ∝ 10^(-0.4 mag), B−V → 색
  const n = stars.length / 4;
  for (let i = 0; i < n; i++) {
    const ra = stars[4 * i], dec = stars[4 * i + 1], mag = stars[4 * i + 2], bv = stars[4 * i + 3];
    const px = (ra / 360) * W, py = (0.5 - dec / 180) * H;
    const flux = Math.pow(10, -0.4 * (mag - 1.0)); // 1등성 = 1
    const [cr, cg, cb] = bvToRGB(bv);
    const rad = Math.min(14, 0.9 + 1.4 * Math.sqrt(flux));
    const alpha = Math.min(1, 0.25 + flux);
    const grd = ctx.createRadialGradient(px, py, 0, px, py, rad);
    grd.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
    grd.addColorStop(0.35, `rgba(${cr},${cg},${cb},${alpha * 0.45})`);
    grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
  }
  return cv;
}

// B−V 색지수 → 대략의 sRGB (Ballesteros 2012 의 색온도 근사 + 흑체 색)
export function bvToRGB(bv) {
  bv = Math.max(-0.4, Math.min(2.0, bv));
  const T = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  const [r, g, b] = blackbodyRGB(T);
  const m = Math.max(r, g, b) || 1;
  return [Math.round(255 * r / m), Math.round(255 * g / m), Math.round(255 * b / m)];
}
function blackbodyRGB(T) {
  T = Math.max(1000, Math.min(40000, T));
  let x;
  if (T <= 4000) x = -0.2661239e9 / T ** 3 - 0.2343589e6 / T ** 2 + 0.8776956e3 / T + 0.179910;
  else x = -3.0258469e9 / T ** 3 + 2.1070379e6 / T ** 2 + 0.2226347e3 / T + 0.240390;
  let y;
  if (T <= 2222) y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683;
  else if (T <= 4000) y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867;
  else y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
  const Y = 1, X = Y * x / y, Z = Y * (1 - x - y) / y;
  const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
  return lin.map((v) => Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2));
}

// ---------- 렌더러 ----------
export class BHRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL2 를 지원하지 않는 브라우저입니다.');
    this.gl = gl;
    this.prog = this._program(VERT, FRAG);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, 'aPos');
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    const nU = gl.getProgramParameter(this.prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nU; i++) {
      const info = gl.getActiveUniform(this.prog, i);
      this.u[info.name] = gl.getUniformLocation(this.prog, info.name);
    }
    this.skyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.skyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.state = {
      a: 0, camPos: [0, 0, 30], camU: [1, 0, 0, 0], e1: [0, 1, 0, 0], e2: [0, 0, 1, 0], e3: [0, 0, 0, -1],
      fov: 60, skyRot: [1, 0, 0, 0, 1, 0, 0, 0, 1], skyGain: 1,
      disk: { on: true, rin: 6, rout: 20, Tstar: 6500, gain: 1, turb: 0.7 }, time: 0,
      obj: { on: false, pos: [0, 0, 10], axes: [0.5, 0.5], u: [1, 0, 0, 0], color: [0.6, 0.7, 0.9], emit: 0 },
      maxSteps: 500, quality: 1, rFar: 400, scale: 1, debug: false,
    };
  }
  _program(vs, fs) {
    const gl = this.gl;
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  setSky(canvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.skyTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }
  // 카메라: 위치 x, 4-속도 u (null 이면 정적 관측자), 바라보는 점 target, 위 방향 up
  lookAt(x, target, up = [0, 0, 1], u = null) {
    const s = this.state;
    const a = s.a;
    const fwd = [target[0] - x[0], target[1] - x[1], target[2] - x[2]];
    const fl = Math.hypot(...fwd); fwd.forEach((v, i) => (fwd[i] = v / fl));
    // right = fwd × up, up' = right × fwd
    let right = cross(fwd, up);
    if (Math.hypot(...right) < 1e-6) right = cross(fwd, [1, 0, 0]);
    const rl = Math.hypot(...right); right.forEach((v, i) => (right[i] = v / rl));
    const up2 = cross(right, fwd);
    const uu = u || staticObserver(x, a) || [1, 0, 0, 0];
    const t = tetrad(x, a, uu, right, up2, fwd);
    s.camPos = x; s.camU = t.u; s.e1 = t.e1; s.e2 = t.e2; s.e3 = t.e3;
  }
  resize(w, h) {
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
  }
  render() {
    const gl = this.gl, s = this.state, U = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(U.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(U.uA, s.a);
    gl.uniform3fv(U.uCamPos, s.camPos);
    gl.uniform4fv(U.uCamU, s.camU);
    gl.uniform4fv(U.uE1, s.e1); gl.uniform4fv(U.uE2, s.e2); gl.uniform4fv(U.uE3, s.e3);
    gl.uniform1f(U.uTanHalfFov, Math.tan((s.fov * Math.PI / 180) / 2));
    gl.uniformMatrix3fv(U.uSkyRot, false, s.skyRot);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.skyTex);
    gl.uniform1i(U.uSky, 0);
    gl.uniform1f(U.uSkyGain, s.skyGain);
    gl.uniform1f(U.uDiskOn, s.disk.on ? 1 : 0);
    gl.uniform1f(U.uDiskIn, s.disk.rin); gl.uniform1f(U.uDiskOut, s.disk.rout);
    gl.uniform1f(U.uDiskTstar, s.disk.Tstar); gl.uniform1f(U.uDiskGain, s.disk.gain);
    gl.uniform1f(U.uDiskTurb, s.disk.turb);
    gl.uniform1f(U.uTime, s.time);
    gl.uniform1f(U.uObjOn, s.obj.on ? 1 : 0);
    gl.uniform3fv(U.uObjPos, s.obj.pos); gl.uniform2fv(U.uObjAxes, s.obj.axes);
    gl.uniform4fv(U.uObjU, s.obj.u); gl.uniform3fv(U.uObjColor, s.obj.color);
    gl.uniform1f(U.uObjEmit, s.obj.emit);
    gl.uniform1i(U.uMaxSteps, s.maxSteps);
    gl.uniform1f(U.uQuality, s.quality);
    gl.uniform1f(U.uRFar, s.rFar);
    gl.uniform1f(U.uDebug, s.debug ? 1 : 0);
    gl.uniform1f(U.uCamOutside, ksGeom(s.camPos, s.a).r > 1 + Math.sqrt(Math.max(0, 1 - s.a * s.a)) ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
