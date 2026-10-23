// 표시용 숫자 포맷. 지수 표기는 ×10ⁿ 형태로.
import { fmtTime as _fmtTime, fmtLen as _fmtLen } from '../physics/fall.js';
export { fmtMass } from '../physics/fall.js';
// fall.js 의 포맷은 e+n 지수 표기를 쓰므로 화면에서는 ×10ⁿ 으로 바꾼다
const fixExp = (str) => str.replace(/(\d(?:\.\d+)?)e([+-]?\d+)/g, (m, a, b) => `${a}×10${sup(parseInt(b, 10))}`);
export const fmtTime = (s) => fixExp(_fmtTime(s));
export const fmtLen = (m) => fixExp(_fmtLen(m));

const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
export const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');

// 1.23×10⁵ 꼴. |x| 가 1e-3..1e5 이면 일반 표기.
export function fmtSci(x, digits = 3) {
  if (x == null || !isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) {
    if (a >= 100) return x.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return Number(x.toPrecision(digits)).toString();
  }
  let e = Math.floor(Math.log10(a));
  let m = Number((x / Math.pow(10, e)).toPrecision(digits));
  if (Math.abs(m) >= 10) { m = Number((m / 10).toPrecision(digits)); e += 1; }
  return `${m}×10${sup(e)}`;
}
export function fmtInt(x) { return Math.round(x).toLocaleString('en-US'); }
export function fmtSolar(m) {
  if (m == null) return '—';
  if (m >= 1e4) return `${fmtSci(m, 3)} M☉`;
  return `${Number(m.toPrecision(3))} M☉`;
}
export function fmtTemp(T) {
  if (T < 1e-3) return `${fmtSci(T, 2)} K`;
  if (T < 10) return `${T.toPrecision(2)} K`;
  if (T < 1e5) return `${fmtInt(T)} K`;
  return `${fmtSci(T, 2)} K`;
}
// 각도(라디안) → µas / mas / ″ / ′ / °
export function fmtAngle(rad) {
  const deg = rad * 180 / Math.PI;
  if (deg >= 1) return `${deg.toPrecision(3)}°`;
  const arcmin = deg * 60;
  if (arcmin >= 1) return `${arcmin.toPrecision(3)}′`;
  const arcsec = arcmin * 60;
  if (arcsec >= 1) return `${arcsec.toPrecision(3)}″`;
  const mas = arcsec * 1e3;
  if (mas >= 1) return `${mas.toPrecision(3)} mas`;
  const uas = mas * 1e3;
  if (uas >= 0.01) return `${uas.toPrecision(3)} µas`;
  return `${fmtSci(uas, 2)} µas`;
}
export function fmtKm(m) {
  const km = m / 1e3;
  if (km < 1) return `${(m).toPrecision(3)} m`;
  if (km < 1e4) return `${Number(km.toPrecision(4)).toLocaleString('en-US')} km`;
  return `${fmtSci(km, 3)} km`;
}
export function fmtPc(pc) {
  if (pc == null) return '—';
  if (pc < 1e3) return `${Number(pc.toPrecision(3))} pc`;
  if (pc < 1e6) return `${Number((pc / 1e3).toPrecision(3))} kpc`;
  if (pc < 1e9) return `${Number((pc / 1e6).toPrecision(3))} Mpc`;
  return `${Number((pc / 1e9).toPrecision(3))} Gpc`;
}
export function fmtLy(pc) { // 파섹 → 광년
  if (pc == null) return '—';
  const ly = pc * 3.2615638;
  if (ly < 1e3) return `${Number(ly.toPrecision(3))} 광년`;
  if (ly < 1e6) return `${Number((ly / 1e3).toPrecision(3))}천 광년`;
  if (ly < 1e9) return `${Number((ly / 1e6).toPrecision(3))}백만 광년`;
  return `${Number((ly / 1e9).toPrecision(3))}십억 광년`;
}
export function fmtErr(v, plus, minus) {
  if (v == null) return '—';
  if (plus == null && minus == null) return fmtSci(v);
  if (plus != null && minus != null && Math.abs(plus - minus) / Math.max(plus, minus) < 0.05) return `${fmtSci(v)} ± ${fmtSci(plus, 2)}`;
  return `${fmtSci(v)} (+${fmtSci(plus ?? 0, 2)} / −${fmtSci(minus ?? 0, 2)})`;
}
export function fmtAU(m) { return `${(m / 1.495978707e11).toFixed(3)} AU`; }
export function fmtG(a) { return `${fmtSci(a / 9.80665, 2)} g`; }
export function fmtHMS(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
export function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}
export function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
