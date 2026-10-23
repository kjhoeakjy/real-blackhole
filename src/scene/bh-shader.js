// 커 블랙홀 광선추적 셰이더 (WebGL2 / GLSL ES 3.00)
// - 좌표계: 커-실드(Kerr–Schild) 직교좌표. 지평선에서 특이하지 않으므로 지평선 안쪽에서 보는 장면도 그대로 계산된다.
// - 측지선: 해밀토니안 H = ½ g^{μν} p_μ p_ν, g^{μν} = η^{μν} − f l^μ l^ν 를 RK4 로 적분. ∂H/∂x 는 해석적으로 미분.
// - 광선은 카메라에서 시간을 거슬러 추적한다 (p_back = −p_photon). 프레임 드래깅의 방향까지 정확히 뒤집힌다.
// - 강착원반: 적도면의 기하학적으로 얇은 원반. 노비코프–손(Novikov–Thorne) 형태의 온도 분포,
//   케플러 4-속도에서 계산한 적색편이 인자 g 로 도플러 빔과 중력 적색편이를 모두 반영 (흑체는 온도 g·T 인 흑체로 보인다).
// - 낙하 물체: 자전축 위의 타원체. 자유낙하 4-속도로 적색편이 → 지평선 가까이서 어둡고 붉게 멈춰 보인다.

export const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

export const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;

uniform vec2  uRes;
uniform float uA;          // 무차원 스핀 a (M=1)
uniform vec3  uCamPos;     // 카메라 위치 (KS 직교좌표, 단위 M)
uniform vec4  uCamU;       // 카메라 4-속도 u^μ (반변)
uniform vec4  uE1, uE2, uE3; // 카메라 사면체의 공간 기저 (반변, 오른쪽/위/앞)
uniform float uTanHalfFov;
uniform mat3  uSkyRot;     // KS 공간 방향 → 하늘(적도좌표) 방향
uniform sampler2D uSky;
uniform float uSkyGain;

uniform float uDiskOn;
uniform float uDiskIn, uDiskOut;  // 단위 M
uniform float uDiskTstar;         // 원반 최고 온도 스케일 (K)
uniform float uDiskGain;          // 밝기 노출
uniform float uDiskTurb;          // 난류 무늬 세기 0..1
uniform float uTime;              // 초 단위 (좌표시간, 단위 M 로 환산해 전달)

uniform float uObjOn;
uniform vec3  uObjPos;            // 물체 중심 (KS)
uniform vec2  uObjAxes;           // (가로 반지름, 세로(반지름 방향) 반지름) 단위 M
uniform vec4  uObjU;              // 물체 4-속도
uniform vec3  uObjColor;
uniform float uObjEmit;           // 0: 반사광 느낌(고정 밝기), 1: 자체 발광

uniform int   uMaxSteps;
uniform float uQuality;           // 스텝 배율 (1 = 기본)
uniform float uRFar;
uniform float uCamOutside;
uniform float uDebug;        // 1: 종료 원인 디버그 색 (빨강 지평선, 초록 하늘, 파랑 스텝 소진)    // 1: 카메라가 지평선 밖 → 지평선 안으로 들어간 광선은 수치 오차이므로 검정

const float PI = 3.14159265358979;

// ---------- 커-실드 기하 ----------
float ksR(vec3 x, float a){
  float rho2 = dot(x,x); float b = rho2 - a*a;
  return sqrt(0.5*(b + sqrt(b*b + 4.0*a*a*x.z*x.z)));
}
// f, l_i (공변 공간부분; l_t = 1) 과 그 공간 도함수
void ksGeom(vec3 x, float a, out float r, out float f, out vec3 l, out vec3 df, out mat3 dl){
  float rho2 = dot(x,x); float b = rho2 - a*a;
  float S = sqrt(b*b + 4.0*a*a*x.z*x.z);
  float r2 = 0.5*(b + S); r = sqrt(r2);
  // ∂(r²)/∂x_i = x_i + (b x_i + 2a² z δ_iz)/S
  vec3 dr2 = x + (b*x + vec3(0.0,0.0,2.0*a*a*x.z))/S;
  vec3 dr = dr2/(2.0*r);
  float d = r2 + a*a;
  float den = r2*r2 + a*a*x.z*x.z;
  f = 2.0*r2*r/den;
  // ∂f = [6r² r_i den − 2r³(4r³ r_i + 2a² z δ_iz)]/den²
  vec3 dden = 4.0*r2*r*dr + vec3(0.0,0.0,2.0*a*a*x.z);
  df = (6.0*r2*dr*den - 2.0*r2*r*dden)/(den*den);
  l = vec3((r*x.x + a*x.y)/d, (r*x.y - a*x.x)/d, x.z/r);
  // dl[i] = ∂l/∂x_i (열 i), 행: 성분
  vec3 dd = 2.0*r*dr;
  // l_x
  vec3 nx = dr*x.x + vec3(r, a, 0.0);
  vec3 dlx = (nx*d - (r*x.x + a*x.y)*dd)/(d*d);
  vec3 ny = dr*x.y + vec3(-a, r, 0.0);
  vec3 dly = (ny*d - (r*x.y - a*x.x)*dd)/(d*d);
  vec3 dlz = (vec3(0.0,0.0,1.0)*r - x.z*dr)/(r2);
  dl = mat3(dlx, dly, dlz); // dl[i] 는 i 번째 열 = (∂l_x/∂x_i, ∂l_y/∂x_i, ∂l_z/∂x_i)
}

// f, l 만 (도함수 없이) — 종료 판정용
void ksFL(vec3 x, float a, out float r, out float f, out vec3 l){
  float rho2 = dot(x,x); float b = rho2 - a*a;
  float S = sqrt(b*b + 4.0*a*a*x.z*x.z);
  float r2 = 0.5*(b + S); r = sqrt(r2);
  float d = r2 + a*a;
  f = 2.0*r2*r/(r2*r2 + a*a*x.z*x.z);
  l = vec3((r*x.x + a*x.y)/d, (r*x.y - a*x.x)/d, x.z/r);
}
// 해밀턴 방정식. p = (p_t, p_x, p_y, p_z) 공변. l^μ = (−1, l_i).
void deriv(vec3 x, vec4 p, float a, out vec3 dx, out vec3 dp){
  float r, f; vec3 l, df; mat3 dl;
  ksGeom(x, a, r, f, l, df, dl);
  float lp = -p.x + dot(l, p.yzw);
  dx = p.yzw - f*lp*l;
  // ∂H/∂x_i = −½ ∂f_i lp² − f lp (∂l/∂x_i · p⃗)
  vec3 dlp = p.yzw * dl; // dlp_i = Σ_c (∂l_c/∂x_i) p_c
  vec3 dH = -0.5*df*lp*lp - f*lp*dlp;
  dp = -dH;
}

void rk4(inout vec3 x, inout vec4 p, float a, float h){
  vec3 k1x, k1p, k2x, k2p, k3x, k3p, k4x, k4p;
  deriv(x, p, a, k1x, k1p);
  deriv(x + 0.5*h*k1x, vec4(p.x, p.yzw + 0.5*h*k1p), a, k2x, k2p);
  deriv(x + 0.5*h*k2x, vec4(p.x, p.yzw + 0.5*h*k2p), a, k3x, k3p);
  deriv(x + h*k3x, vec4(p.x, p.yzw + h*k3p), a, k4x, k4p);
  x += h*(k1x + 2.0*k2x + 2.0*k3x + k4x)/6.0;
  p.yzw += h*(k1p + 2.0*k2p + 2.0*k3p + k4p)/6.0;
}

// g_{μν} v^μ w^ν = η(v,w) + f (l_μ v^μ)(l_μ w^μ),  l_μ = (1, l)
float gdot(vec4 v, vec4 w, float f, vec3 l){
  float lv = v.x + dot(l, v.yzw), lw = w.x + dot(l, w.yzw);
  return -v.x*w.x + dot(v.yzw, w.yzw) + f*lv*lw;
}
vec4 lower(vec4 v, float f, vec3 l){ // v^μ → v_μ
  float lv = v.x + dot(l, v.yzw);
  return vec4(-v.x + f*lv, v.yzw + f*lv*l);
}

// ---------- 색 ----------
// 흑체 색온도 → 선형 sRGB (Kang et al. 2002 의 CIE xy 근사 + 밝기 T^4 는 호출측)
vec3 blackbodyRGB(float T){
  T = clamp(T, 1000.0, 40000.0);
  float t = T;
  float x;
  if (t <= 4000.0) x = -0.2661239e9/(t*t*t) - 0.2343589e6/(t*t) + 0.8776956e3/t + 0.179910;
  else             x = -3.0258469e9/(t*t*t) + 2.1070379e6/(t*t) + 0.2226347e3/t + 0.240390;
  float y;
  if (t <= 2222.0)      y = -1.1063814*x*x*x - 1.34811020*x*x + 2.18555832*x - 0.20219683;
  else if (t <= 4000.0) y = -0.9549476*x*x*x - 1.37418593*x*x + 2.09137015*x - 0.16748867;
  else                  y =  3.0817580*x*x*x - 5.87338670*x*x + 3.75112997*x - 0.37001483;
  float Y = 1.0; float X = Y*x/y; float Z = Y*(1.0 - x - y)/y;
  vec3 rgb = vec3( 3.2406*X - 1.5372*Y - 0.4986*Z,
                  -0.9689*X + 1.8758*Y + 0.0415*Z,
                   0.0557*X - 0.2040*Y + 1.0570*Z);
  return max(rgb, 0.0);
}
vec3 aces(vec3 x){
  const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0);
}

// 해시 노이즈 (원반 난류 무늬)
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }

// ---------- 하늘 ----------
vec3 skyColor(vec3 dir){
  vec3 d = normalize(uSkyRot*dir);
  float ra = atan(d.y, d.x); float dec = asin(clamp(d.z,-1.0,1.0));
  vec2 uv = vec2(ra/(2.0*PI)+0.5, 0.5 - dec/PI);
  vec3 c = texture(uSky, uv).rgb;
  return pow(c, vec3(2.2))*uSkyGain; // sRGB 텍스처 → 선형
}

// ---------- 원반 ----------
vec3 diskEmission(vec3 x, vec4 p, float r, float f, vec3 l, out float alpha){
  // 케플러 원궤도 4-속도 (순행)
  float Om = 1.0/(pow(r,1.5) + uA);
  vec4 v = vec4(1.0, -x.y*Om, x.x*Om, 0.0);
  float n2 = -gdot(v, v, f, l);
  alpha = 0.0;
  if (n2 <= 0.0) return vec3(0.0); // 광자 영역 안쪽(원궤도 불가) 은 비움
  vec4 u = v/sqrt(n2);
  float g = 1.0/max(1e-4, dot(p, u)); // E_obs/E_em
  // 노비코프–손 형태 온도 (영토크 내경)
  float xr = uDiskIn/r;
  float T = uDiskTstar*pow(xr, 0.75)*pow(max(0.0, 1.0 - sqrt(xr)), 0.25);
  // 난류 무늬: 각속도 차이에 따라 감기는 패턴
  float phi = atan(x.y, x.x);
  float phase = phi - Om*uTime;
  float turb = fbm(vec2(r*1.2, phase*3.0)) ;
  float t2 = fbm(vec2(r*6.0 + 3.1, phase*12.0));
  float m = mix(1.0, 0.45 + 1.1*turb + 0.5*t2*t2, uDiskTurb);
  float Tobs = g*T;
  float lum = pow(max(Tobs,1.0)/max(uDiskTstar,1.0), 4.0)*m*uDiskGain;
  // 가장자리 부드럽게
  float edge = smoothstep(0.0, 0.08, (uDiskOut - r)/uDiskOut) * smoothstep(0.0, 0.03, (r - uDiskIn)/uDiskIn);
  alpha = clamp(edge*min(1.0, 0.25 + lum*4.0), 0.0, 1.0);
  return blackbodyRGB(Tobs)*lum*edge;
}

// ---------- 낙하 물체 (타원체) ----------
float objF(vec3 x){
  vec3 d = x - uObjPos;
  return (d.x*d.x + d.y*d.y)/(uObjAxes.x*uObjAxes.x) + d.z*d.z/(uObjAxes.y*uObjAxes.y) - 1.0;
}
vec3 objShade(vec3 x, vec4 p, float f, vec3 l){
  float g = 1.0/max(1e-4, dot(p, uObjU));
  vec3 d = x - uObjPos;
  vec3 nrm = normalize(vec3(d.x/(uObjAxes.x*uObjAxes.x), d.y/(uObjAxes.x*uObjAxes.x), d.z/(uObjAxes.y*uObjAxes.y)));
  float lat = asin(clamp(nrm.z,-1.0,1.0)), lon = atan(nrm.y,nrm.x);
  float pat = 0.75 + 0.5*fbm(vec2(lon*3.0, lat*3.0)*2.0);
  float lambert = mix(1.0, 0.35 + 0.65*max(0.0, dot(nrm, normalize(vec3(0.3,0.5,0.8)))), 1.0 - uObjEmit);
  // 밝기 g^4 (흑체 가정), 색은 g 에 따라 붉어지도록 간단히 색온도 이동
  vec3 base = uObjColor*pat*lambert;
  float tint = clamp(g, 0.05, 3.0);
  vec3 shift = base*vec3(1.0, pow(tint,0.6), pow(tint,1.2));
  return shift*pow(g, 4.0)*2.0;
}

void main(){
  vec2 ndc = (vUv*2.0 - 1.0);
  ndc.x *= uRes.x/uRes.y;
  // 카메라 사면체에서 광선 방향
  vec3 nloc = normalize(vec3(ndc.x*uTanHalfFov, ndc.y*uTanHalfFov, 1.0));
  vec4 n4 = nloc.x*uE1 + nloc.y*uE2 + nloc.z*uE3;
  vec4 pUp = n4 - uCamU;          // 시간 역행 광자 (반변)

  vec3 x = uCamPos;
  float r0, f0; vec3 l0, df0; mat3 dl0;
  ksGeom(x, uA, r0, f0, l0, df0, dl0);
  vec4 p = lower(pUp, f0, l0);    // 공변 운동량, p_t 보존

  float rPlus = 1.0 + sqrt(max(0.0, 1.0 - uA*uA));
  vec3 col = vec3(0.0);
  float trans = 1.0;              // 남은 투과율
  bool done = false;
  int why = 0; int steps = 0;
  float prevZ = x.z;
  float prevF = uObjOn > 0.5 ? objF(x) : 1.0;
  vec3 prevX = x;
  vec4 prevP = p;

  for (int i = 0; i < 1200; i++){
    if (i >= uMaxSteps || done) break;
    float r = ksR(x, uA);
    // 스텝: 멀면 크게, 지평선·원반·물체 근처에서는 작게.
    // 안쪽(ingoing) 커-실드 좌표에서 시간을 거슬러 가는 광선은 과거 지평선에 다가가며 p 가 발산하므로
    // (r − r+) 에 비례해 스텝을 줄이고, 더 못 가면 '지평선에서 온 빛' = 검정으로 처리한다 (천체물리 블랙홀에는 과거 지평선이 없다).
    float gap = r - rPlus;
    float h = 0.04 + 0.06*max(0.0, gap);
    h = min(h, max(0.0015, 0.25*abs(gap)));
    // 운동량이 커지면(지평선 근처에서 발산) 좌표 이동량 h·|p| 가 목(throat)을 건너뛰지 않도록 스텝을 더 줄인다
    h /= max(1.0, 0.5*length(p.yzw));
    if (uDiskOn > 0.5 && abs(x.z) < 1.0 + 0.1*r) h = min(h, 0.03 + 0.15*abs(x.z));
    if (uObjOn > 0.5){
      float dObj = length(x - uObjPos) - max(uObjAxes.x, uObjAxes.y);
      h = min(h, max(0.002, 0.3*dObj));
    }
    h /= uQuality;
    prevX = x; prevP = p; prevZ = x.z;
    rk4(x, p, uA, h);
    float rn = ksR(x, uA);

    // 낙하 물체 교차
    if (uObjOn > 0.5){
      float F = objF(x);
      if (F < 0.0 && prevF >= 0.0){
        float t = prevF/(prevF - F);
        vec3 xh = mix(prevX, x, t);
        float rr, ff; vec3 ll, dff; mat3 dll; ksGeom(xh, uA, rr, ff, ll, dff, dll);
        col += trans*objShade(xh, mix(prevP, p, t), ff, ll);
        done = true; break;
      }
      prevF = F;
    }
    // 원반 교차 (적도면 통과)
    if (uDiskOn > 0.5 && (x.z*prevZ) < 0.0){
      float t = prevZ/(prevZ - x.z);
      vec3 xh = mix(prevX, x, t); xh.z = 0.0;
      float req = sqrt(max(0.0, dot(xh.xy, xh.xy) - uA*uA));
      if (req > uDiskIn && req < uDiskOut){
        float rr, ff; vec3 ll, dff; mat3 dll; ksGeom(xh, uA, rr, ff, ll, dff, dll);
        float al; vec3 em = diskEmission(xh, mix(prevP, p, t), req, ff, ll, al);
        col += trans*em;
        trans *= (1.0 - al);
        if (trans < 0.02){ done = true; break; }
      }
    }
    // 지평선: 검정. 시간을 거슬러 지평선에 접근하는 광선은 p 가 발산한다(무한 적색편이) → 검정으로 종료
    steps = i;
    if (uCamOutside > 0.5 && rn < rPlus){ done = true; why = 1; break; }
    if (abs(rn - rPlus) < 0.004 || rn < rPlus*0.98 || (rn - rPlus < 0.5 && dot(p.yzw, p.yzw) > 1600.0)){ done = true; why = 1; break; }
    // 지평선 근처에서 널 조건 H = ½ g^{μν}p_μp_ν = 0 이 깨지면 수치 오차로 튕긴 광선 → 검정
    if (rn - rPlus < 0.5){
      float rr, ff; vec3 ll; ksFL(x, uA, rr, ff, ll);
      float lp = -p.x + dot(ll, p.yzw);
      float H = 0.5*(-p.x*p.x + dot(p.yzw, p.yzw) - ff*lp*lp);
      if (abs(H) > 2e-3*(p.x*p.x + dot(p.yzw, p.yzw))){ done = true; why = 1; break; }
    }
    if (rn > uRFar && dot(x, p.yzw) > 0.0){           // 탈출: 하늘
      // 먼 곳에서 공간 방향 ≈ p⃗ (KS 는 점근적으로 평탄)
      col += trans*skyColor(normalize(p.yzw));
      done = true; why = 2; break;
    }
  }
  // 스텝 소진: 지평선 근처에서 멈춘 광선(검정) 또는 광자구 근처를 오래 도는 광선 → 검정
  if (uDebug > 0.5){ float b = 0.2 + 0.8*float(steps)/float(uMaxSteps); fragColor = vec4(why==1?b:0.0, why==2?b:0.0, why==0?b:0.0, 1.0); return; }
  col = aces(col);
  fragColor = vec4(pow(col, vec3(1.0/2.2)), 1.0);
}
`;
