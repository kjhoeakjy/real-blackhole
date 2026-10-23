# Black-hole disruption physics: reference for the simulation

Status: research notes for implementation. Last updated 2026-10-23.
Conventions: SI units unless noted. In "geometric" formulas G = c = 1 and lengths are in units of GM/c².
`k` always means the **radial tidal stretching gradient** felt by a freely falling body, in s⁻²
(acceleration difference per metre of separation). Numbers below were computed with the constants in section 0.

Confidence tags: **[exact]** a closed-form GR result; **[std]** a textbook or review standard;
**[fit]** a fit to simulations, valid only in its tested range; **[est]** an order-of-magnitude estimate made here
from cited inputs, which the game should present as an estimate.

---

## 0. Constants (CODATA 2018, IAU 2015 nominal)

| Symbol | Value |
|---|---|
| G | 6.67430e-11 m³ kg⁻¹ s⁻² |
| c | 299 792 458 m s⁻¹ |
| ħ | 1.054571817e-34 J s |
| k_B | 1.380649e-23 J K⁻¹ |
| M☉ | 1.98841e30 kg (GM☉ = 1.3271244e20 m³ s⁻², IAU 2015 B3) |
| R☉ (nominal) | 6.957e8 m |
| m_e, m_p, u | 9.1093837e-31, 1.67262192e-27, 1.66053907e-27 kg |
| a₀ (Bohr radius) | 5.29177e-11 m |
| e²/(4πε₀) | 2.307078e-28 J m |
| Planck time t_P = √(ħG/c⁵) | 5.391e-44 s |
| 1 MeV/fm | 160.2 N |
| 1 GeV/fm | 1.602e5 N |

Derived quantities for each hole: r_s = 2GM/c², GM/c³.

| Black hole | M | r_s | GM/c³ |
|---|---|---|---|
| Stellar, 10 M☉ | 1.988e31 kg | 29.53 km | 4.925e-5 s |
| Sgr A*, 4.0e6 M☉ (as specified) | 7.95e36 kg | 1.181e10 m | 19.70 s |
| Sgr A*, best mass 4.30e6 M☉ (GRAVITY Collab. 2022, A&A 657, L12; EHT 2022 ApJL 930 L12 gives 4.0 (+1.1/−0.6)e6) | 8.55e36 kg | 1.270e10 m | 21.18 s |

---

## 1. Radial free fall: proper time and coordinate time

### 1.1 Schwarzschild, released from rest at r₀ [exact]
Source: MTW *Gravitation* (1973) §25.5, eqs. 25.28 (τ) and 25.37 (t); Hartle *Gravity* (2003) §9.3; Taylor, Wheeler & Bertschinger, *Exploring Black Holes* 2nd ed., ch. 6.

Use the cycloid parameter η ∈ [0, π]:

```
r(η) = (r₀/2)(1 + cos η)            # equivalently η = 2·arccos(√(r/r₀))
τ(η) = √(r₀³ / (8GM)) · (η + sin η)  # proper time since release (MTW 25.28)
```

The r–τ relation is **identical to the Newtonian radial free-fall formula**, with r being the Schwarzschild areal
radius. That is a GR result: radial geodesics obey (dr/dτ)² = E² − 1 + 2GM/r, with E² = 1 − 2GM/(c²r₀).

Proper time from release to the singularity (η = π):  **τ_total = π √(r₀³/(8GM))**.

Coordinate (Schwarzschild, far-away-clock) time, MTW 25.37 with r_s = 2GM/c²:

```
t(η) = (r_s/c) · { ln| (√(r₀/r_s − 1) + tan(η/2)) / (√(r₀/r_s − 1) − tan(η/2)) |
                   + √(r₀/r_s − 1) · [ η + (r₀/(2 r_s)) (η + sin η) ] }
```

t → ∞ as r → r_s, where tan(η_h/2) = √(r₀/r_s − 1). Never use t for the infaller's clock. For the outside view,
use t together with light-travel delay (section 6).

### 1.2 Falling from rest at infinity ("raindrop", E = 1) [exact]
Source: Taylor, Wheeler & Bertschinger ch. 7; Hamilton & Lisle 2008, Am. J. Phys. 76, 519 ("river model").

```
dr/dτ = −c √(r_s/r)
τ_to_singularity(r) = (2/3) (r_s/c) (r/r_s)^{3/2} = (2/3) r^{3/2} / √(2GM)
t(r) = (r_s/c)[ −(2/3)(r/r_s)^{3/2} − 2√(r/r_s) + ln| (√(r/r_s)+1)/(√(r/r_s)−1) | ] + const
```

- Horizon to singularity for a raindrop: **τ = (2/3) r_s/c = (4/3) GM/c³**. That is 6.57e-5 s for 10 M☉ and 26.3 s for 4e6 M☉.
- **Maximum possible** proper time from horizon to singularity, for any infaller: **τ_max = π GM/c³**. It is
  reached by a body released from rest just above the horizon (E → 0). Values: 1.547e-4 s for 10 M☉, 61.9 s for 4e6 M☉,
  66.5 s for 4.3e6 M☉. Firing rockets inward or outward only shortens the time (Lewis & Kwan 2007, PASA 24, 46).

**Useful identity [exact for E = 1, asymptotically exact for any E as r → 0].** With k = 2GM/r³,

```
τ_left = 2 / (3 √k)
```

This does not depend on the hole's mass. Every tidal stage in section 5 therefore happens a fixed proper time before
the singularity, whatever the size of the hole, provided the stage occurs inside the horizon.

### 1.3 Kerr (spin a = J/(Mc), 0 ≤ a ≤ GM/c²)
Source: MTW §33; Chandrasekhar *Mathematical Theory of Black Holes* (1983); Hamilton & Avelino 2010, Phys. Rep. 495, 1;
Poisson & Israel 1990, PRD 41, 1796; Ori 1991, PRL 67, 789; Dafermos & Luk 2017, arXiv:1710.01722.

- Horizons (geometric units): r± = M ± √(M² − a²). The inner horizon r₋ is a Cauchy horizon.
- **On-axis infall** (θ = 0, L_z = 0, Carter constant Q = a²(1 − E²)) [exact]:
  `(dr/dτ)² = E² − 1 + 2Mr/(r² + a²)`. Integrate numerically from r₊ to r₋.
  For E = 1 and M = 1, proper time from r₊ to r₋ is 1.43 (a = 0.5), 0.84 (a = 0.9) and 0.126 (a = 0.998) in units of GM/c³.
  Along the axis r = 0 is **not** singular. The ring singularity sits at r = 0, θ = π/2, so an on-axis geodesic passes
  through the ring into the r < 0 region of the analytic extension. Off-axis and equatorial infallers generically
  reach the ring or are deflected, depending on their constants of motion.
- **Physical caveat [std].** The inner horizon is unstable to perturbations. Infalling and outgoing radiation is
  infinitely blueshifted there ("mass inflation", Poisson & Israel 1990; Hamilton & Avelino 2010). In the leading
  picture (Ori 1991; Dafermos & Luk 2017) the result is a *weak* null singularity: the metric stays continuous, but
  curvature diverges and the energy density of the blueshifted flux becomes enormous. Nothing beyond r₋ (the r < 0
  region, white-hole exits, other universes) is physically trusted.
- **Recommendation for the game.** Simulate Schwarzschild exactly. For Kerr, integrate the on-axis case to r₋ and
  stop there with the label "inner (Cauchy) horizon: mass-inflation zone, physics uncertain"; do not draw the ring
  traversal. If the falling object has not been tidally disrupted by r₋ (common for supermassive holes, see 2.3),
  report the outcome as "destroyed by the blueshifted radiation at the inner horizon (model-dependent)", not as a
  tidal time. Hamilton's inside-Kerr visualizations (section 6) follow the same convention.

---

## 2. Tidal tensor for a freely falling observer

### 2.1 Schwarzschild, radial infall [exact]
Source: Manasse & Misner 1963, J. Math. Phys. 4, 735 (Fermi normal coordinates); MTW §31.2 and eq. 31.4b; Hartle §21.

Geodesic deviation `d²ξ^î/dτ² = −R^î_{τ̂ ĵ τ̂} ξ^ĵ` in the infaller's orthonormal frame gives:

```
radial:      d²ξ_r/dτ² = + (2GM / r³) ξ_r     (stretch)
transverse:  d²ξ_⊥/dτ² = − ( GM / r³) ξ_⊥     (compression, each of 2 axes)
```

These components hold exactly for **any radially moving** observer, at any speed and inside or outside the horizon.
The reason is that Schwarzschild is Petrov type D with radial principal null directions, so the electric part of the
Weyl tensor is invariant under radial boosts. They are the same values a static observer would measure; the only
change is the meaning of r. The expression is linear in ξ, and the corrections are O(ξ/r) (the next term in the
Fermi expansion involves ∇R). It is therefore exact for every object in the list.

**Non-radial geodesic** with specific angular momentum L (Marck 1983, Proc. R. Soc. A 385, 431; also Ishii,
Shibata & Mino 2005, PRD 71, 044017). The eigenvalues of the tidal tensor become

```
λ_1 = +(2GM/r³)(1 + 3L²/(2 r² c²))     stretch
λ_2 = −( GM/r³)(1 + 3L²/(r² c²))       compression in the orbital plane
λ_3 = −( GM/r³)                       compression perpendicular to the orbital plane
```

These matter only for orbits near pericentre at a few r_s. For radial drops, use 2.1 directly.

### 2.2 Validity of the tidal approximation
The approximation needs R_object ≪ r (equivalently M_BH/m ≫ 1, since r_t/R = (M/m)^{1/3}). It is marginal for the
Sun or Jupiter falling into a 10 M☉ hole: (M/m)^{1/3} = 2.15 for the Sun. Treat that case as "a binary merger, not a
clean TDE" and flag it in the UI.

### 2.3 Kerr on-axis tidal field [exact]
On the symmetry axis the only non-zero Weyl scalar is Ψ₂ = −M/(r − i a)³, and a radial-axis infaller's frame is a
boosted principal frame. The tidal (electric) part is therefore

```
k_r(r) = 2GM · r (r² − 3a²) / (r² + a²)³         (stretch if > 0)
k_⊥(r) = −k_r / 2
```

with a = J/(Mc) in metres. The magnetic (frame-dragging) part ∝ a(3r² − a²)/(r² + a²)³ does not produce a static
differential acceleration. For r < √3·a the sign flips: the body is squeezed radially and stretched sideways. The field
stays **finite** all the way to r₋ and to r = 0 on the axis. In units of c⁶/(GM)², max|k| between r₊ and r₋ is about
11.7 for a = 0.5, 1.66 for a = 0.9 and 0.60 for a = 0.998. For 10 M☉ that unit is 4.12e8 s⁻²; for 4e6 M☉ it is 2.6e-3 s⁻².
A human falling along the axis of a spinning supermassive hole is therefore **never tidally torn before r₋**.

---

## 3. Self-gravitating bodies: disruption radius

Generic form (Hills 1975, Nature 254, 295; Rees 1988, Nature 333, 523):

```
r_t = R (M_BH / m)^{1/3}
r_disrupt = η · r_t         ⇔   k_crit = 2GM/r_disrupt³ = 2 G m / (η³ R³)
```

### 3.1 Physical meaning of η, and a structure-based estimate [est]
A mass shell at radius x inside the body is unbound when k > G m(<x)/x³. The quantity m(<x)/x³ is largest at the centre,
where it equals (4π/3)ρ_c. Hence:

- **Surface lift-off (onset):** k = G m/R³, so η_onset = 2^{1/3} = 1.26. This equals the rigid-body Roche coefficient
  1.26 (Roche 1849). The often-quoted 2.44 refers to a fluid satellite in a synchronous circular orbit and does not
  apply to a radial plunge.
- **Complete, quasi-static ("core torn"):** k = (4π/3) G ρ_c, so **η_complete ≈ 1.26 (ρ̄/ρ_c)^{1/3}**.

Hydrodynamic simulations show that full disruption needs less than the static core criterion, because the core
expands once the envelope is gone. Use the simulation fits below for stars, and the structure estimate for planets.

### 3.2 Main-sequence stars (e.g. the Sun) [fit]
- Guillochon & Ramirez-Ruiz 2013, ApJ 767, 25 (polytropes, parabolic orbits): full disruption at β_d = r_t/r_p of
  **0.90 for γ = 5/3 (n = 1.5)** and **1.85 for γ = 4/3 (n = 3)**. These give η_full = 1/β_d = 1.11 and 0.54
  respectively. Partial mass loss starts near β ≈ 0.5–0.6.
- Ryu, Krolik, Piran & Noble 2020, ApJ 904, 98–101 (papers I–IV, arXiv:2001.03501, 2001.03504; MESA stars in full GR).
  The physical tidal radius is 𝓡_t = Ψ r_t, the largest pericentre that still gives full disruption:
  ```
  Ψ = Ψ_BH(M_BH) · Ψ_*(M_*)
  Ψ_BH = 0.80 + 0.26 (M_BH / 1e6 M☉)^{0.5}                       (paper IV eq. 1)
  Ψ_*  = [1.47 + exp((M_*/M☉ − 0.669)/0.137)] / [1 + 2.34 exp((M_*/M☉ − 0.669)/0.137)]   (paper I eq. 5)
  ```
  Ψ_* ≈ 1–1.45 for M_* ≤ 0.5 M☉ and ≈ 0.45 for M_* ≥ 1 M☉; Ψ_*(1 M☉) = 0.466. The fits were tested for
  M_BH = 1e5 to 5e7 M☉ and M_* = 0.15 to 10 M☉, on parabolic orbits. For a 1 M☉ star Ψ runs from 0.425 at 1e5 M☉ to
  1.45 at 5e7 M☉.
- Static check for the Sun (n ≈ 3, ρ_c/ρ̄ ≈ 54 for an n = 3 polytrope; real Sun ρ_c ≈ 1.5e5 kg m⁻³): η_complete ≈ 0.33.
  This is consistent with the fits (0.37–0.54).

**Recommendation for the Sun:** η_full = Ψ_BH·Ψ_*. Use 0.37 for M_BH ≲ 1e5 M☉ (the Newtonian limit; 10 M☉ is outside
the fit range and is the merger regime of 2.2) and Ψ from the formula for 1e5–5e7 M☉. For 4e6 M☉, Ψ = 0.466 × 1.32 = 0.61,
so r_full = 6.8e10 m ≈ 5.7 r_s. Show partial stripping from 2·r_t inward.

**Why the radial plunge matters.** Ryu and Guillochon–Ramirez-Ruiz model parabolic flybys, where the star spends
only about one dynamical time near pericentre. In a radial plunge the tidal field keeps growing. The free-fall time
from r_t to the hole, √(r_t³/GM) = √(R³/Gm), is the star's own dynamical time, so "disruption at r_full" is the right
order and the error is about a factor of 2 in time.

### 3.3 Hills mass (star swallowed whole) [std]
Swallowing happens when r_disrupt < r_horizon (radial plunge) or < 4GM/c² (parabolic capture radius in Schwarzschild):

```
M_Hills = ( η R c² / (2G) )^{3/2} m^{-1/2}       (criterion r_disrupt = r_s)
```

Values with η = 1: Sun 1.14e8 M☉, Earth 5.8e7, Moon 7.4e7, Jupiter 1.18e8, Bennu 1.2e8, Sirius B 8.3e4, PSR J0740+6620 6.0 M☉.
Scale by η^{3/2} for other η values, and by (r_s/r_capture)^{3/2} for another capture criterion.
Spin: Kesden 2012, PRD 85, 024037 finds M_H ≈ 1e8 M☉ for a solar-type star around a Schwarzschild hole, rising to
**≈ 7e8 M☉** for prograde orbits around a maximally spinning hole (see also Beloborodov et al. 1992, MNRAS 256, 209).
For an on-axis radial plunge into Kerr, a crude rescaling is M_H ∝ (2M/r₊)^{3/2}, about ×2.6 at a = 0.998.

### 3.4 White dwarfs (Sirius B) [std / fit]
- Sirius B: M = 1.018 ± 0.011 M☉ (Bond et al. 2017, ApJ 840, 70); R ≈ 0.0081 R☉ = 5.64e3 km (Joyce et al. 2018,
  MNRAS 481, 2361). Mean ρ̄ = 2.7e9 kg m⁻³.
- Structure: a 1 M☉ white dwarf lies between n = 1.5 and n = 3 (ρ_c/ρ̄ ≈ 10–30). Recommend **η_full ≈ 0.8**
  (range 0.55–1.1, interpolating Guillochon & Ramirez-Ruiz 2013); onset at η = 1.26.
  See Rosswog, Ramirez-Ruiz & Hix 2009, ApJ 695, 404 on white-dwarf TDEs by intermediate-mass holes.
- Swallowed whole by holes above about 1e5 M☉. For 4e6 M☉, r_t = 0.075 r_s, so the white dwarf is torn only inside the horizon.

### 3.5 Neutron stars (PSR J0740+6620)
- M = 2.08 ± 0.07 M☉ (Fonseca et al. 2021, ApJL 915, L12). R = 12.39 (+1.30/−0.98) km (Riley et al. 2021,
  ApJL 918, L27); 13.7 (+2.6/−1.5) km (Miller et al. 2021, ApJL 918, L28). Use R = 12.4 km.
  Compactness C = GM/(Rc²) = 0.248; ρ̄ = 5.2e17 kg m⁻³.
- Radial plunge: Newtonian r_t = 0.71 r_s for a 10 M☉ hole, so the star is **swallowed whole**. The Hills mass is
  about 6 M☉ (η = 1). Self-gravity is strongly relativistic, so η is uncertain to ±30% [est].
- Quasi-circular inspirals (the astrophysical case; use them only if the game adds orbits). Foucart, Hinderer &
  Nissanke 2018, PRD 98, 081501(R), remnant mass outside the hole:
  ```
  M_rem / M_NS^b = [ max( α (1 − 2C)/η_s^{1/3} − β R̂_ISCO C/η_s + γ , 0 ) ]^δ
  α = 0.406, β = 0.139, γ = 0.255, δ = 1.761
  η_s = Q/(1+Q)²,  Q = M_BH/M_NS,  R̂_ISCO = r_ISCO c²/(G M_BH)  (= 6 for a non-spinning hole)
  ```
  (Older form: Foucart 2012, PRD 86, 124007, M_rem/M_NS^b = 0.288(3Q)^{1/3}(1 − 2C) − 0.148 r_ISCO/R_NS.)
  For J0740 and a non-spinning 10 M☉ hole the bracket is negative, so M_rem = 0 and the star plunges intact.
  Disruption outside the ISCO needs a low mass ratio and/or high prograde spin (χ ≳ 0.7 for Q ≈ 5).
- Inside the horizon the neutron star is torn when k ≈ G m/R³ = 1.45e8 s⁻². That is 2.6e4 m for 10 M☉ (just inside r_s = 2.95e4 m), about 5.5e-5 s
  before the singularity (τ_left = 2/(3√k)).

### 3.6 Rocky planets, moons and gas giants [est from 3.1]
Material strength is negligible at planetary scale. Earth's central pressure (~3.6e11 Pa) is about 10⁴ times the
tensile strength of rock (~10 MPa), so gravity alone sets the criterion. Strength matters only below roughly
100 km (Holsapple & Michel 2006, Icarus 183, 331).

| Body | m (kg) | R (m) | ρ̄ (kg m⁻³) | ρ_c (kg m⁻³) | η_onset | η_complete (3.1) | Sources |
|---|---|---|---|---|---|---|---|
| Earth | 5.9722e24 | 6.3710e6 | 5513 | ~13 000 (PREM, Dziewonski & Anderson 1981) | 1.26 | **0.95** | NASA fact sheet |
| Moon | 7.342e22 | 1.7374e6 | 3342 | ~7 000 (small Fe core; mantle ~3 300) | 1.26 | **1.0** (mantle 1.25) | Weber et al. 2011 Science 331, 309 |
| Mars | 6.4169e23 | 3.3895e6 | 3934 | ~6 500 | 1.26 | **1.06** | InSight: Stähler et al. 2021 Science 373, 443 |
| Jupiter | 1.89813e27 | 6.9911e7 | 1326 | ~4 400 (n ≈ 1, ρ_c/ρ̄ = π²/3) | 1.26 | **0.85** | Guillot 2005 ARE&PS 33, 493 |

### 3.7 Rubble piles: Bennu
- M = 7.329e10 kg (GM = 4.892 m³ s⁻²); bulk ρ = 1190 ± 13 kg m⁻³; mean radius ≈ 244 m
  (Scheeres et al. 2019, Nat. Astron. 3, 352; Lauretta et al. 2019, Nature 568, 55).
- Cohesion: near-surface regolith has **near-zero cohesion**, with a near subsurface about half the bulk density
  (Walsh et al. 2022, Sci. Adv. 8, eabm6229; Lauretta et al. 2022, Science 377, 285). Bulk cohesion is ≲ 1–10 Pa.
- Boulder tensile strength: 0.44–1.7 MPa (Ballouz et al. 2020, Nature 587, 205). Use Weibull size scaling
  σ(L) ∝ L^{-1/2}, as in that paper.
- Criterion: k_disperse = G m/R³ + 8c/(ρ (2R)²) = 3.33e-7 + 2.8e-8·(c / 1 Pa) s⁻². With c = 1 Pa, k ≈ 3.6e-7 s⁻².
  That puts r ≈ 1.95e9 m for 10 M☉ and 1.44e11 m ≈ 12 r_s for 4e6 M☉.
- After that, each boulder of size L breaks at k = 8σ(L)/(ρ_g L²) (section 4). With ρ_g ≈ 2000, a 1 m boulder breaks at
  k ≈ 4e3 s⁻² and a 1 cm pebble (σ ≈ 10 MPa) at k ≈ 4e8 s⁻².

---

## 4. Bodies held together by material strength

### 4.1 Stress model [std]
For a uniform rod of density ρ, cross-section A and length L aligned radially in a field k, the tension peaks at
the midpoint:

```
T_max = ∫₀^{L/2} ρ A k x dx = ρ A k L²/8 = m k L / 8
σ_max = ρ k L² / 8                         →  k_break = 8 σ_t / (ρ L²)
```

A sphere of radius R gives roughly the same result with L ≈ 2R. Applying the formula at every scale gives a
**fragmentation cascade**: the largest surviving piece has size L_max(k) = √(8σ(L)/(ρ k)). Feed this to the renderer
to break the body into ever smaller fragments.

The tidal field also loads the body hydrostatically along its axis, like gravity pointing outward from the centre:
g_eff(x) = k·x. This is what produces physiological effects before mechanical failure.

### 4.2 Material strengths (human)
| Tissue | Ultimate tensile strength | Source |
|---|---|---|
| Skin | 21.6 ± 8.4 MPa (range ~5–30) | Ní Annaidh et al. 2012, J. Mech. Behav. Biomed. Mater. 5, 139 |
| Tendon | ~100 MPa (50–150) | Maganaris & Paul 1999, J. Physiol. 521, 307; Yamada 1970 *Strength of Biological Materials* |
| Ligament | 10–40 MPa | Yamada 1970; Fung, *Biomechanics* (1993) |
| Cortical bone (longitudinal, tension) | ~133 MPa | Reilly & Burstein 1975, J. Biomech. 8, 393 |
| Skeletal muscle (passive) | 0.1–0.5 MPa | Yamada 1970 |
| Cervical spine, whole (tension) | ~1.5–4 kN failure load | cadaver tests, e.g. Yoganandan et al. 1996, J. Biomech. 29; Van Ee et al. 2000 (verify exact values) |
| Cell membrane lysis tension | ~5–10 mN m⁻¹ | Evans et al. 2003, Biophys. J. 85, 2342 |

### 4.3 Whole-body estimate [est]
Model: m = 70 kg, L = 1.75 m, ρ = 1050 kg m⁻³, falling feet- or head-first (it aligns radially by itself).
Waist tension is T = m k L/8 = 15.3·k N. The waist cross-section carries skin (perimeter 0.9 m × 2 mm × 20 MPa ≈ 36 kN),
the lumbar spine (a few kN) and muscle and fascia (~0.07 m² × 0.3 MPa ≈ 20 kN). The tissues do not fail
simultaneously, so the realistic separation load is T ≈ 1e4–4e4 N. The neck carries less load (T ≈ 3.75·k) and fails later.

| Stage | Criterion | k (s⁻²) | Δa head-to-toe = kL | r for 10 M☉ | r for 4e6 M☉ |
|---|---|---|---|---|---|
| Noticeable pull (~1 g at the extremities) | k·0.9 m ≈ 10 m s⁻² | ~10 | 1.8 g | 6.4e3 km | 4.7e5 km (0.04 r_s, inside) |
| Blackout (blood pooled toward head and feet; +Gz ≈ 5 g G-LOC analogue) | k·0.9 m ≈ 50 m s⁻² | ~50 | 9 g | 3.8e3 km | 2.8e5 km (0.023 r_s) |
| Joint and ligament tearing begins | T ≈ 2–5 kN | ~200 | 36 g | 2.4e3 km | 1.7e5 km |
| **Body torn in two (recommended "torn apart")** | T ≈ 1.5e4 N | **1e3** (range 3e2–3e3) | 180 g | **1385 km** | **1.02e5 km (0.0086 r_s, inside)** |
| Limbs and organs into cm pieces (σ ~ 1 MPa, L ~ 3 cm) | 4.1 | ~1e7 | – | 64 km | 4.7e3 km |
| Cells lysed (k ≈ 8γ/(ρR³), R = 5 µm, γ = 10 mN m⁻¹) | – | 6e11 | – | 1.6 km | 118 km |

The often-quoted "spaghettification at a few thousand km from a 10 M☉ hole" (e.g. Taylor & Wheeler *Exploring Black
Holes* exercises; Hartle *Gravity* problems; popular accounts such as Tyson, *Death by Black Hole*) matches the 10–100 g
rows. Death comes first; separation of the body follows at about 1400 km. Taylor & Wheeler use Δa ≈ g-scale thresholds
for discomfort and do not give a failure stress, which is why the table above is our own derivation.

**Recommended threshold:** k_tear = 1.0e3 s⁻² (uncertainty about ×3). Use it as the main "completely torn apart"
event for the human, and show the blackout (k = 50) and cell (6e11) stages as secondary markers.
From 10 M☉, the blackout-to-tear interval is ~0.1 s of proper time for a raindrop: τ_left = 2/(3√k) applies only
inside the horizon, so integrate section 1.1 outside it.

---

## 5. Microscopic stages ("complete" disruption)

General principle [std]: a bound system with internal angular frequency ω₀ is tidally ionised or dissociated when
**k ≳ ω₀²**. For a self-gravitating body ω₀² ~ Gρ, which recovers section 3. For a pair bond of maximum restoring force F
between masses m₁ and m₂ (reduced mass μ) at separation d, the condition is **k ≈ F_max/(μ d)**. For a constituent at
radius d from the centre of mass of a heavy core, use μ → m.

Radii: r = (2GM/k)^{1/3}. Proper time before the singularity: τ_left = 2/(3√k), valid when r ≪ r_s and independent of the hole's mass.

| Stage | Inputs | k_crit (s⁻²) | r for 10 M☉ (r_s = 29.5 km) | r for 4e6 M☉ (r_s = 1.18e10 m) | τ_left |
|---|---|---|---|---|---|
| Protein unfolding | F ~ 100 pN, 50 kDa, 5 nm (Rief et al. 1997, Science 276, 1109); k = 8F/(mL) | 2e21 | 1.1 m | 81 m | 1.5e-11 s |
| Biopolymer backbone (covalent) rupture | F ~ 2 nN (Grandbois et al. 1999, Science 283, 1727) | 4e22 | 0.40 m | 30 m | 3.3e-12 s |
| C–C bond (348 kJ mol⁻¹, 1.54 Å; F_max ≈ 4 nN, range 2–7 nN, Beyer 2000, J. Chem. Phys. 112, 7307) | k = 2F/(m_C d) | 3e27 | 9.6 mm | 0.71 m | 1.2e-14 s |
| O–H in water (459 kJ mol⁻¹, 0.96 Å; Morse F_max = D a/2 ≈ 8 nN) | k = F/(m_H d) | 6e28 | 3.6 mm | 0.27 m | 2.8e-15 s |
| H ionisation | k = e²/(4πε₀ m_e a₀³) = ω_atomic² | 1.71e33 | 0.12 mm | 8.5 mm | 1.6e-17 s |
| Inner (K-shell) electrons of C or O | hydrogenic scaling ∝ Z⁴ | 2e36 (C), 7e36 (O) | 11 µm | 0.78 mm | 4.5e-19 s |
| Gravitational pair creation, e⁺e⁻ (tidal energy over λ_C ~ m_e c²) | k ~ (m_e c²/ħ)² | 6e41 | 0.16 µm | 12 µm | 8.6e-22 s |
| Deuteron dissociation (B = 2.22 MeV) | F ~ 1 MeV/fm, μ = m_N/2, d ~ 4 fm | 5e40 | 0.38 µm | 28 µm | 3e-21 s |
| All nuclei into free nucleons (S_n ≈ 8–19 MeV, R = 1.2A^{1/3} fm; ħω ≈ 41A^{-1/3} MeV) | k ≈ F/(m_N R) ≈ ω² | **1e45** (range 3e44–1e45) | 14 nm | 1.0 µm | 2.1e-23 s |
| Pion production / nucleon "shredding" | k ~ (m_π c²/ħ)² | 4.5e46 | 3.9 nm | 0.29 µm | 3e-24 s |
| Quark string stretched (σ_QCD ≈ 0.18 GeV² ≈ 0.9 GeV/fm = 1.4e5 N) | k ≈ σ/(m_q d), m_q ≈ m_N/3, d ≈ 0.5 fm | 5e47 | 1.7 nm | 0.13 µm | 9e-25 s |
| **Planck curvature: classical GR fails** | k ~ c⁵/(ħG) = 1/t_P² | 3.44e86 | 2e-22 m | 1.5e-20 m | ~t_P |

Notes:
- **Quarks cannot be freed.** Confinement means the string breaks at ~1–1.5 fm, once its energy exceeds about
  2 × 0.3 GeV, by producing q q̄ pairs (Lund string model; Andersson et al. 1983, Phys. Rep. 97, 31). A tidal field
  above ~1e47 s⁻² turns nucleons into a shower of hadrons, not free quarks. Above the QCD scale the matter is better
  described as quantum fields in a strongly curved background. Label this stage "hadronic matter shredded; beyond
  here: quantum gravity".
- From about k ~ (m c²/ħ)² for a species, the tidal field creates particle pairs from the vacuum. The semiclassical
  regime (QFT on curved spacetime; Birrell & Davies 1982) still holds, and the true breakdown is at Planck curvature.
  Mention it, but do not try to simulate it.
- For **any** hole, the last ~1e-23 s of proper time contain every nuclear and sub-nuclear stage, and molecular
  bonds go in the last ~1e-14 s. For the 4e6 M☉ hole all of these stages occur inside the horizon. For 10 M☉ the human
  body is torn outside the horizon (1385 km ≫ 29.5 km), but molecules break inside it.

---

## 6. What observers see

### 6.1 Distant observer [std]
- Light emitted radially outward by an infaller is redshifted exponentially at late times:
  `1 + z ∝ exp(t/t_e)`, with **t_e = 1/κ = 4GM/c³ = 2 r_s/c** for Schwarzschild, where κ = c⁴/(4GM) is the surface
  gravity. For Kerr, κ = c (r₊ − r₋)/(2(r₊² + a²)) with lengths in metres, and t_e = 1/κ.
  Values: t_e = 1.97e-4 s for 10 M☉; 78.8 s for 4e6 M☉; 84.7 s for 4.3e6 M☉.
- Total observed luminosity, which is dominated by photons near the photon sphere, decays as
  `L ∝ exp(−t/(3√3 GM/c³))` (Podurets 1964, Sov. Astron. 8, 868; Ames & Thorne 1968, ApJ 151, 659; MTW §32.3 and Box 32.1).
  The timescale is 5.196 GM/c³: 2.6e-4 s for 10 M☉ and 102 s for 4e6 M☉. The object never visibly crosses the horizon.
  It reddens, dims and freezes near the horizon, and in practice vanishes after ~10–20 e-folds.
- The shadow edge sits at impact parameter b_c = 3√3 GM/c², giving an angular radius b_c/D for a distant viewer.
  Render the object's image with lensing: primary image plus higher-order photon-ring images.

### 6.2 Infalling observer [exact for raindrop; ray-trace for full render]
Source: Hamilton & Polhemus 2010, New J. Phys. 12, 123027 ("Stereoscopic visualization in curved spacetime: seeing deep
inside a black hole"); Hamilton & Lisle 2008 (river model); A. Hamilton's JILA pages
https://jila.colorado.edu/~ajsh/insidebh/ ; Riazuelo 2019, IJMPD 28, 1950042 ("Seeing relativity I"); Riazuelo 2020 (Kerr interior).

For a raindrop (E = 1, β = √(r_s/r)) receiving a photon with impact parameter b, the angle θ of the photon's propagation
direction from the outward radial direction, in the infaller's frame, is given by

```
p̂ = −√(1 − (b/r)² (1 − r_s/r))      (ingoing photons; valid inside the horizon too)
cos θ = (p̂ + β) / (1 + β p̂)          (relativistic velocity addition)
ω_obs/ω_∞ = (1 + β p̂) / (1 − r_s/r)    (blueshift/redshift factor)
```

The photon appears to come from the opposite direction, π − θ. The outside sky fills directions with b ≤ b_c.

Key effects to render:
1. **You never see the horizon arrive.** It always lies ahead of and below you, and you do not see yourself cross.
   Light emitted just outside the horizon, by matter that fell in earlier, appears as a dark or dim surface below.
2. **The black region shrinks for a faller.** A static observer just above the horizon sees nearly the whole sky black.
   A raindrop at the horizon sees the outside sky as a disc of half-angle ≈ 138° around straight up, and the dark
   region is only ~42° in radius around straight down (from the formula with b = b_c, r = r_s: cos θ = (b² − r²)/(b² + r²)).
   This is relativistic aberration.
3. **Colour shift.** The sky straight overhead is *redshifted* for a raindrop, by a factor of 1/(1 + √(r_s/r)): ½ at the
   horizon, tending to 0 toward the singularity. Do not show a blueshifted "entire future of the universe": a free faller
   sees only a finite stretch of outside history (Hamilton). Photons near the shadow edge are blueshifted.
4. **Close to the singularity** the tidal field stretches your view. The outside sky is squeezed into a bright band
   around the "horizontal" plane, perpendicular to the fall, and the views straight up and straight down go dark
   and redshifted (Hamilton & Polhemus 2010, figs. 6–8).
5. **Your own body** (if you are the observer) is stretched along the line of sight: feet visibly recede ahead.
6. Kerr: the inner-horizon approach shows the infinitely blueshifted "mass inflation" flash. Hamilton's renderings end
   there; do the same.

---

## 7. Hawking radiation (tiny user-made holes) [std]

```
T_H = ħ c³ / (8π G M k_B) = 1.2269e23 K · (1 kg / M)  = 6.17e-8 K · (M☉ / M)
```
Values: 6.2e-9 K for 10 M☉ and 1.5e-14 K for 4e6 M☉. A hole is colder than the CMB (2.725 K) and therefore grows if
M > 4.5e22 kg (about the Moon's mass).

Evaporation time (Page 1976, PRD 13, 198; MacGibbon 1991, PRD 44, 376; Carr, Kohri, Sendouda & Yokoyama 2010, PRD 81, 104019):

```
dM/dt = −5.34e25 f(M) / (M/g)²   g s⁻¹
τ_evap ≈ 407 s · (f(M)/15.35)⁻¹ · (M / 1e10 g)³    =  6.24e-27 s · (M/g)³ / f(M)
```
- f(M) counts the emitted degrees of freedom, weighted by spin and greybody factors.
  f ≈ 1 for M ≳ 1e17 g (photons, gravitons, neutrinos). It rises to f ≈ 15.35 for M ≲ 1e9 g (T_H ≳ 1e4 GeV, all
  Standard Model species). Between these limits, interpolate in log M using species thresholds at k_B T_H ≈ m c²
  (Carr et al. 2010, fig. 1; MacGibbon 1991, eq. 12).
- Page 1976 (massless ν, γ, graviton; equivalent to f ≈ 0.72 in Carr's normalisation): dM/dt = −2.011e-4 ħc⁴/(G² M²), giving **τ = 8.66e-27 s (M/g)³**
  (8.67e-18 s (M/kg)³, or 2.2e66 yr for 1 M☉).
- Neutrinos are massive (≳ 0.05 eV for at least one state), so for M ≳ 1e19–1e20 kg (k_B T_H < m_ν c²) only photons
  and gravitons are emitted. Page's photon and graviton fractions (16.7% + 1.9% of his total) then give
  τ ≈ 4.7e-26 s (M/g)³, or about 1.2e67 yr for 1 M☉. The common 2.1e67 yr comes from the naive blackbody formula
  τ = 5120π G²M³/(ħc⁴) = 8.41e-17 s (M/kg)³, which omits greybody factors. Show it only as "rough".
- A primordial hole of initial mass ≈ 5.1e14 g (5.1e11 kg) evaporates in the current age of the universe (Carr et al. 2010).
- Recommended implementation: τ = 6.24e-27 s (M/g)³ / f(M), with f(M) = 1 for 1e17–1e22 g, about 0.13 above ~1e23 g (photons and gravitons only), and a
  log-interpolation up to 15.35 below 1e9 g. Show T_H, peak photon energy ≈ 2.82 k_B T_H, and power
  P = −c² dM/dt ≈ 4.8e39 W · f / (M/g)².

---

## 8. Recommended model for the game (summary)

1. **Trajectory:** an exact Schwarzschild radial drop from rest at r₀ (1.1), or from infinity (1.2). Report the
   infaller's proper time τ, never the coordinate time t. Kerr: on-axis only, integrate to r₋ (1.3).
2. **Tidal field:** k(r) = 2GM/r³ along the fall and −GM/r³ transverse (exact). Kerr on-axis: 2.3.
3. **Disruption event:** the first r at which k(r) ≥ k_crit for the object. Then τ_disrupt = τ(r₀ → r_d) from 1.1.

| Object | m (kg) | R (m) | Mechanism | k_crit (s⁻²) | η (vs R(M/m)^{1/3}) | r_d (10 M☉) | r_d (4e6 M☉) |
|---|---|---|---|---|---|---|---|
| Human | 70 | 0.875 (L = 1.75) | strength (4.3) | **1e3** | – | 1385 km | 1.02e8 m (inside) |
| Bennu | 7.329e10 | 244 | gravity + cohesion (3.7) | 3.6e-7 | ≈1.22 | 1.95e9 m | 1.44e11 m |
| Moon | 7.342e22 | 1.7374e6 | gravity (3.6) | 1.9e-6 | 1.0 | 1.12e9 m | 8.3e10 m |
| Earth | 5.9722e24 | 6.371e6 | gravity (3.6) | 3.6e-6 | 0.95 | 9.0e8 m | 6.7e10 m |
| Mars | 6.4169e23 | 3.3895e6 | gravity | 1.9e-6 | 1.06 | 1.13e9 m | 8.3e10 m |
| Jupiter | 1.89813e27 | 6.9911e7 | gravity | 1.2e-6 | 0.85 | 1.3e9 m (merger regime) | 9.6e10 m |
| Sun | 1.98841e30 | 6.957e8 | Ryu Ψ fit (3.2) | – | 0.37 (≤1e5 M☉) / 0.61 (4e6) | 5.6e8 m (merger regime) | 6.8e10 m ≈ 5.7 r_s |
| Sirius B | 2.024e30 | 5.64e6 | gravity (3.4) | – | 0.8 | 9.7e6 m | 7.1e8 m (inside) |
| PSR J0740+6620 | 4.136e30 | 1.24e4 | GR self-gravity (3.5) | ≈1.45e8 (η = 1.26) | ~1.0–1.26 | 2.1–2.6e4 m (inside) | 1.5–1.9e6 m (inside) |

   For gravity-bound bodies, k_crit = 2Gm/(η³R³).
   Recompute r_d at runtime from k_crit: r_d = (2GM/k_crit)^{1/3}. If r_d > r₀, the object is disrupted at release.
4. **Optional "completely atomised" ladder** (section 5): molecules at 3e27, atoms at 1.7e33, nuclei at 1e45,
   hadrons at ~5e47 and Planck at 3.4e86 s⁻². Near the singularity τ_left = 2/(3√k), the same for every hole.
5. **Flag in the UI:**
   - disruption inside the horizon, which a distant observer never sees;
   - the merger regime, when M_BH/m ≲ 30;
   - Kerr bodies that survive to r₋;
   - stages beyond Planck curvature.

---

## 9. Bibliography (main)
- Misner, Thorne & Wheeler, *Gravitation* (1973), §§25.5, 31.2, 32.3, 33.
- Hartle, *Gravity* (2003), ch. 9, 12, 21. Taylor, Wheeler & Bertschinger, *Exploring Black Holes*, 2nd ed.
- Manasse & Misner 1963, J. Math. Phys. 4, 735. Marck 1983, Proc. R. Soc. A 385, 431.
- Hills 1975, Nature 254, 295. Rees 1988, Nature 333, 523. Gezari 2021, ARA&A 59, 21. Stone, Kesden, Cheng & van Velzen 2019, GRG 51, 30 (TDEs in GR, review).
- Guillochon & Ramirez-Ruiz 2013, ApJ 767, 25. Ryu, Krolik, Piran & Noble 2020, ApJ 904, 98–101 (arXiv:2001.03501, 2001.03504).
- Kesden 2012, PRD 85, 024037. Beloborodov et al. 1992, MNRAS 256, 209.
- Foucart 2012, PRD 86, 124007. Foucart, Hinderer & Nissanke 2018, PRD 98, 081501.
- Fonseca et al. 2021, ApJL 915, L12. Riley et al. 2021, ApJL 918, L27. Miller et al. 2021, ApJL 918, L28.
- Bond et al. 2017, ApJ 840, 70. Joyce et al. 2018, MNRAS 481, 2361.
- Scheeres et al. 2019, Nat. Astron. 3, 352. Walsh et al. 2022, Sci. Adv. 8, eabm6229. Lauretta et al. 2022, Science 377, 285. Ballouz et al. 2020, Nature 587, 205.
- Poisson & Israel 1990, PRD 41, 1796. Ori 1991, PRL 67, 789. Hamilton & Avelino 2010, Phys. Rep. 495, 1. Dafermos & Luk 2017, arXiv:1710.01722.
- Hamilton & Lisle 2008, Am. J. Phys. 76, 519. Hamilton & Polhemus 2010, New J. Phys. 12, 123027. Ames & Thorne 1968, ApJ 151, 659.
- Page 1976, PRD 13, 198. MacGibbon 1991, PRD 44, 376. Carr et al. 2010, PRD 81, 104019.
- Biomechanics: Yamada 1970; Fung 1993; Ní Annaidh et al. 2012; Reilly & Burstein 1975; Maganaris & Paul 1999.
- Molecular forces: Grandbois et al. 1999, Science 283, 1727; Beyer 2000, J. Chem. Phys. 112, 7307; Rief et al. 1997, Science 276, 1109.

Items to re-verify against the primary paper before publishing in the UI: the exact cervical-spine tensile loads,
Bennu's bulk cohesion value, and the f(M) interpolation table (Carr et al. 2010, fig. 1).
