// 물리 상수 (CODATA 2018 / IAU 2015 공칭값)
export const G = 6.67430e-11;            // m^3 kg^-1 s^-2
export const c = 299792458;              // m/s
export const hbar = 1.054571817e-34;     // J s
export const kB = 1.380649e-23;          // J/K
export const sigmaSB = 5.670374419e-8;   // W m^-2 K^-4
export const mProton = 1.67262192369e-27;// kg
export const sigmaT = 6.6524587321e-29;  // m^2 (톰슨 산란 단면적)

export const GM_SUN = 1.3271244e20;      // m^3 s^-2 (IAU 2015 nominal)
export const M_SUN = GM_SUN / G;         // kg ≈ 1.98841e30
export const R_SUN = 6.957e8;            // m (IAU 2015 nominal)
export const L_SUN = 3.828e26;           // W (IAU 2015 nominal)
export const M_EARTH = 5.9722e24;        // kg
export const R_EARTH = 6.3781e6;         // m (equatorial, IAU 2015)
export const M_JUP = 1.89813e27;
export const R_JUP = 7.1492e7;
export const M_MOON = 7.342e22;
export const R_MOON = 1.7374e6;

export const AU = 1.495978707e11;        // m (IAU 2012)
export const PC = 3.0856775814913673e16; // m
export const KPC = PC * 1e3;
export const MPC = PC * 1e6;
export const LY = 9.4607304725808e15;    // m
export const YEAR = 365.25 * 86400;      // s (Julian year)
export const DAY = 86400;

// 질량 M(kg)에 대한 중력 반지름 GM/c^2 (m)
export const rg = (Mkg) => G * Mkg / (c * c);
// 슈바르츠실트 반지름 2GM/c^2 (m)
export const rs = (Mkg) => 2 * G * Mkg / (c * c);
// 중력 시간 단위 GM/c^3 (s)
export const tg = (Mkg) => G * Mkg / (c * c * c);
// 에딩턴 광도 (W), 수소 플라즈마 기준
export const L_EDD = (Mkg) => 4 * Math.PI * G * Mkg * mProton * c / sigmaT;
