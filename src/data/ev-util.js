// 사건 정의에서 같이 쓰는 작은 도우미
import { DAY, YEAR } from '../physics/constants.js';
export const R = Math.random;
export const chance = (p) => R() < p;
export const U = (a, b) => a + R() * (b - a);
export const pick = (arr) => arr[Math.floor(R() * arr.length)];
export const hours = (s) => `${Math.round(s / 3600)}시간`;
export const fmtDelay = (s) => s < 90 ? `${Math.round(s)}초` : s < 2 * 3600 ? `${Math.round(s / 60)}분` : s < 2 * DAY ? `${(s / 3600).toPrecision(2)}시간` : s < YEAR ? `${Math.round(s / DAY)}일` : `${(s / YEAR).toPrecision(2)}년`;
export const SF = (film) => `시나리오 · 영감: ${film}`;
export const IMAGINE = '시나리오 · 상상';
// 동료 이름: 사건 글에서 "동료" 대신 이름을 쓴다. v._m 에 그 사건의 당사자를 기억해 둔다
export const who = (v) => { v._m = v.mate(); return v._m ? v._m.name : '동료'; };
export const him = (v) => v._m ? v._m.name : '동료';
