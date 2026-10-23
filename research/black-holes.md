# Real black holes: verified data table (as of 23 Oct 2026)

Companion machine-readable file: `black-holes.json` (same entries, numbers as numbers, `refs` array per entry).

**Conventions**
- Masses are in solar masses (M☉). Errors are 1σ for electromagnetic measurements and **90% credible intervals for gravitational-wave (GW) events**.
- Values marked **derived** were computed here, not quoted from a paper. Luminosity distances from redshift use flat ΛCDM with Planck 2018 (H0 = 67.66, Ωm = 0.3097).
- "—" means not measured or not applicable. Coordinates are J2000/ICRS. Where a coordinate is given to fewer digits, it is approximate.
- **CONTESTED** marks values where published measurements disagree by more than their quoted errors.

---

## 1. Supermassive black holes

| Name (한국어) | Mass (M☉) | Spin a* | Distance | RA / Dec (J2000) | Inclination | Accretion state |
|---|---|---|---|---|---|---|
| **Sgr A\*** (궁수자리 A\*) | 4.297 ± 0.012 (stat) ± 0.040 (sys) × 10⁶ [GRAVITY 2022]; EHT ring: 4.0 (+1.1/−0.6) × 10⁶ | Not measured. EHT models favour a* ≳ 0.5 (MAD, prograde); a 2025 polarimetry paper disfavours very high spin | R0 = 8.277 kpc ± 9 (stat) ± 33 (sys) pc | 17h45m40.0409s, −29°00′28.118″ | Flare orbits i ≈ 150–160° (near face-on, clockwise); EHT models favour i < 50° | Quiescent. L_bol ≈ (6.8–9.2) × 10³⁵ erg/s, L/L_Edd ~ 10⁻⁹ |
| **M87\*** (M87\*, 처녀자리 A) | 6.5 ± 0.2 (stat) ± 0.7 (sys) × 10⁹ [EHT 2019]. **CONTESTED**: 6.6 ± 0.4 × 10⁹ (stars, Gebhardt 2011); 5.37 (+0.37/−0.25) × 10⁹ (stars, Liepold 2023); 3.5 × 10⁹ (gas, Walsh 2013) | Not measured. 3 EHT epochs marginally disfavour \|a*\| ≲ 0.2 (MAD); spin axis points away from us | 16.8 ± 0.8 Mpc (z = 0.00428) | 12h30m49.42338s, +12°23′28.0439″ | Jet at 17 ± 2° to line of sight | Active, low-luminosity AGN with a powerful jet. Ṁ ~ (3–20) × 10⁻⁴ M☉/yr, jet power 10⁴²–10⁴⁴ erg/s, L/L_Edd ~ 10⁻⁵ |
| **M31\*** (안드로메다 중심) | 1.4 (+0.9/−0.3) × 10⁸ | — | 761 ± 11 kpc | ≈ 00h42m44.33s, +41°16′07.5″ (nucleus; M31\* is in P2) | Galaxy disk ≈ 77° | Quiescent. L_X ~ 10³⁶ erg/s, ~10⁻¹⁰ L_Edd; X-ray flare in 2006 |
| **TON 618** | **CONTESTED**: 6.6 × 10¹⁰ (Hβ, Shemmer 2004) vs 4.07 × 10¹⁰ (C IV, Ge 2019). Both are single-epoch virial estimates with ~0.3–0.5 dex systematic error | — | z = 2.219. **Derived**: D_L ≈ 18.1 Gpc, comoving ≈ 5.6 Gpc, light-travel ≈ 10.8 Gyr | 12h28m24.9s, +31°28′38″ | — | Hyperluminous radio-loud quasar. L_bol ~ 4 × 10⁴⁷ erg/s (M_abs ≈ −30.7) |
| **Holmberg 15A\*** (홀름베르크 15A\*) | 4.0 ± 0.8 × 10¹⁰ (direct stellar dynamics) | — | z = 0.0554. **Derived**: D_L ≈ 256 Mpc (Abell 85 BCG) | 00h41m50.5s, −09°18′11″ | — | Dormant |
| **Cosmic Horseshoe BH** (코즈믹 호스슈) | log M = 10.56 (+0.07/−0.08 stat ± 0.12 sys), i.e. ≈ 3.6 × 10¹⁰ | — | z = 0.44. **Derived**: D_L ≈ 2.5 Gpc | 11h48m33.14s, +19°30′03.2″ | — | Dormant |
| **Phoenix A** (피닉스 A) | **NOT A MEASUREMENT**: "of order 10¹¹" from feedback and N-body core-scouring models. Do not present it as fact | — | z = 0.597. **Derived**: D_L ≈ 3.6 Gpc | ≈ 23h44m43.9s, −42°43′12″ | — | Active (obscured AGN, extreme cooling flow) |

**Historical facts**
- **Sgr A\***: Balick & Brown discovered it as a compact radio source in February 1974. The EHT released its first image on **12 May 2022** (data from April 2017) and the polarized image on **27 March 2024**. The GRAVITY+ team announced the star **S301** in Nature on **19 Aug 2026**. S301 has an orbital period of about 8.7 yr, a pericentre of about 12 AU and a speed of about 25,000 km/s. It is sensitive enough to the black hole's rotation that it may measure Sgr A\*'s spin within about a decade. 2020 Nobel Prize: Genzel and Ghez.
- **M87\***: Curtis noted the jet in 1918. The EHT published the **first-ever black hole image on 10 April 2019**, with a ring diameter of 42 ± 3 μas. The polarized image followed on 24 March 2021 and the 2018-epoch image in January 2024. In September 2025 the EHT reported that the polarization pattern reversed direction between 2017 and 2021. The jet base was detected in 2021 EHT data (published January 2026).
- **M31\***: The radio source was found with the VLA in 1992. HST resolved the double nucleus (P1/P2) in 1993. It is explained as an eccentric disk of stars orbiting the black hole.
- **TON 618**: It entered the 1957 Tonantzintla catalogue as entry 618, a faint blue star, and was recognised as a quasar in the 1970s. In 2021 ALMA found a Lyα nebula about 100 kpc across around it.
- **Holm 15A\***: The galaxy has one of the largest stellar cores known (~2.2 kpc), scoured out by the black hole.
- **Cosmic Horseshoe** (2025): A radial lensed image near the galaxy centre, combined with MUSE kinematics, gives a 5σ detection of a ~36-billion-M☉ black hole. It is the heaviest black hole with a direct measurement claimed so far.
- **2026 extra**: McDonald et al. 2026 (ApJL 1002, L19) report a ~1 kpc cavity empty of stars in A402-BCG. They interpret it as possibly caused by a pair of ultramassive black holes totalling ~6 × 10¹⁰ M☉. This is an indirect estimate.

## 2. Stellar-mass black holes in the Milky Way

| Name (한국어) | BH mass (M☉) | Spin a* (method) | Distance | RA / Dec (J2000) | Inclination | State | Companion: type, mass, period |
|---|---|---|---|---|---|---|---|
| **Cygnus X-1** (백조자리 X-1) | 21.2 ± 2.2 [Miller-Jones 2021]. **CONTESTED**: 12.7–17.8 [Ramachandran 2025] | > 0.9985 (3σ), continuum fitting [Zhao 2021] | 2.22 (+0.18/−0.17) kpc, VLBA parallax | 19h58m21.67574s, +35°12′05.7845″ | Orbit 27.51 (+0.77/−0.57)° | Persistent, wind-fed, ~1–2% L_Edd | HDE 226868, O9.7 Iab. 40.6 (+7.7/−7.1) M☉ [2021] or ~29 M☉ [2025]. P = 5.599829 d |
| **V404 Cygni** (백조자리 V404) | 9.0 (+0.2/−0.6) | Tentatively > 0.92 (reflection) | 2.39 ± 0.14 kpc, VLBI parallax | 20h24m03.82s, +33°52′02.0″ | 67 (+3/−1)° | Quiescent transient (outbursts 1938, 1989, 2015) | K3 III, ~0.7 M☉, P = 6.4714 d. Plus a wide tertiary star at ≥ 3500 AU (outer period ~70,000 yr) |
| **A0620-00** (외뿔소자리 V616) | 6.61 ± 0.25 [Cantrell 2010]. **CONTESTED**: 5.86 ± 0.24 [van Grunsven 2017] | 0.12 ± 0.19, continuum fitting | 1.06 ± 0.12 kpc | 06h22m44.542s, −00°20′44.29″ | 51.0 ± 0.9° | Quiescent (outbursts 1917, 1975) | K-dwarf (K2–K5 V), 0.40 M☉ (or 0.34), P = 7.752 h |
| **GRS 1915+105** (독수리자리 V1487) | 12.4 (+2.0/−1.8) | > 0.98, continuum fitting | 8.6 (+2.0/−1.6) kpc, parallax | 19h15m11.55s, +10°56′44.8″ | Jet 60 ± 5° | Active since 1992 (near-Eddington); faint and obscured since 2018 | K–M III giant, 0.47 ± 0.27 M☉, P = 33.85 d |
| **GX 339-4** (제단자리 V821) | **Poorly constrained**: 2.3–9.5 [Heida 2017]; ~4–11 [Zdziarski 2019] | 0.95 (+0.03/−0.05), reflection (model-dependent) | ~8–12 kpc (> 5 kpc); uncertain | 17h02m49.40s, −48°47′23.4″ | 37–78° (or ~40–60°) | Recurrent transient (every ~2–3 yr) | K1–2 IV, mass unknown, P = 1.7587 d |
| **MAXI J1820+070** | 8.48 (+0.79/−0.72), assuming the jet inclination | **CONTESTED**: 0.14 ± 0.09 (continuum) vs high spin (reflection) | 2.96 ± 0.33 kpc, radio parallax | 18h20m21.942s, +07°11′07.28″ | Jet 63 ± 3°; orbit 66–81° (possible misalignment) | Quiescent since 2023 (2018 outburst peaked ~0.15 L_Edd) | K3–5 V, 0.49 ± 0.10 M☉, P = 0.68549 d (16.45 h) |
| **Gaia BH1** (가이아 BH1) | 9.62 ± 0.18 [El-Badry 2023]; refined to 9.27 ± 0.10 [Nagarajan 2024] | — | **0.480 ± 0.004 kpc. Nearest known BH** | 17h28m41.09661s, −00°34′51.5234″ | 126.6 ± 0.4° | Dormant | G dwarf (Sun-like), 0.93 ± 0.05 M☉, P = 185.6 d, e = 0.45 |
| **Gaia BH2** (가이아 BH2) | 8.94 ± 0.34 | — | 1.16 ± 0.02 kpc | 13h50m16.748s, −59°14′20.33″ | 34.87 ± 0.34° | Dormant | Lower-RGB red giant, 1.07 ± 0.19 M☉, P = 1276.7 d, e = 0.518 |
| **Gaia BH3** (가이아 BH3) | **32.70 ± 0.82. Heaviest stellar BH in the Galaxy** | — | 0.5906 ± 0.0058 kpc (2nd nearest) | 19h39m18.71s, +14°55′54.0″ | 110.6° | Dormant | Very metal-poor ([Fe/H] = −2.56) halo G giant, 0.76 ± 0.05 M☉, P = 11.6 yr (4253 ± 98 d), e = 0.729 |
| **ω Cen IMBH** (오메가 센타우리, intermediate) | **Lower limit > 8,200**; models favour a few × 10⁴ | — | 5.43 ± 0.05 kpc | ≈ 13h26m47.24s, −47°28′46.5″ (cluster centre) | — | Dormant | — |

**Historical facts**
- **Cyg X-1**: A sounding-rocket flight discovered it in X-rays in 1964. It was the subject of Hawking's 1974 bet with Thorne that it was *not* a black hole. Hawking conceded in 1990.
- **V404 Cyg**: It was recorded as Nova Cyg 1938, and Ginga detected it in X-rays in May 1989. Its 2009 parallax was the first parallax distance measured to a black hole. In 2024 a bound third star was found, which suggests the black hole formed with almost no natal kick (Burdge 2024, Nature).
- **A0620-00**: During the 1975 outburst it was briefly the brightest X-ray source in the sky. In 1986 McClintock & Remillard showed its compact object exceeds 3 M☉. It was the nearest known black hole until 2022.
- **GRS 1915+105**: GRANAT/WATCH discovered it on 15 Aug 1992. In 1994 it became the first Galactic source seen with "superluminal" jets.
- **GX 339-4**: OSO-7 discovered it in 1973. It is the textbook source for the "q"-shaped hardness–intensity cycle of black hole X-ray binaries.
- **MAXI J1820+070**: ASAS-SN found it on 6 Mar 2018 and MAXI on 11 Mar 2018. NICER measured its X-ray reverberation "echo" (Kara 2019).
- **Gaia BH1/BH2/BH3**: These are dormant black holes found from Gaia astrometry (2022, 2023, 2024). Gaia BH3 was announced on 16 Apr 2024 from pre-release DR4 data. It belongs to the disrupted ED-2 star cluster.
- **ω Cen**: In July 2024, 20 years of HST data revealed 7 stars faster than the local escape speed in the cluster core.

## 3. Gravitational-wave black holes (90% credible intervals)

| Event | Remnant mass (M☉) | Remnant spin | Components (M☉) | z / D_L | Notes |
|---|---|---|---|---|---|
| **GW150914** | 63.1 (+3.3/−3.0) | 0.69 (+0.05/−0.04) | 35.6 (+4.7/−3.1) + 30.6 (+3.0/−4.4) | z = 0.09 ± 0.03; 440 (+150/−170) Mpc | 14 Sep 2015, 09:50:45 UTC. Announced 11 Feb 2016. First GW detection. ~3 M☉c² radiated; peak 3.6 × 10⁵⁶ erg/s. Sky area ~600 deg² |
| **GW190521** | 142 (+28/−16). **First directly observed IMBH formation** | 0.72 (+0.09/−0.12) | 85 (+21/−14) + 66 (+17/−18) | z = 0.82 (+0.28/−0.34); 5.3 (+2.4/−2.6) Gpc | 21 May 2019, 03:02:29 UTC. Primary in the pair-instability gap. ZTF flare counterpart unconfirmed |
| **GW231123** (GW231123_135430) | 225 (+26/−43) | 0.84 (+0.08/−0.16) | 137 (+23/−18) + 101 (+22/−50); total 238 (+28/−49), range 190–265 | z = 0.39 (+0.27/−0.24); 2.2 (+1.9/−1.5) Gpc | 23 Nov 2023, 13:54:30 UTC. **Most massive BBH confirmed to date.** Component spins χ1 ≈ 0.9, χ2 ≈ 0.8. SNR ≈ 20.7. Large waveform systematics |
| **GW250114** (GW250114_082203) | 62.7 (+1.0/−1.1) | 0.68 ± 0.01 | 33.6 (+1.2/−0.8) + 32.2 (+0.8/−1.3); spins ≤ 0.26 | z = 0.09 ± 0.01; D_L ≈ 425 Mpc (**derived**); press figure ~1.3 Gly | 14 Jan 2025, 08:22:03 UTC. **Loudest event to date: SNR ≈ 80** (76.9 in GWTC-5.0). Hawking area theorem confirmed "at high credibility" (press figures: total horizon area ~240,000 km² before, ~400,000 km² after). Overtone (221) detected at 4.1σ; Kerr spectrum confirmed to ~30%. Sky area 42 deg² |
| **GW241011** | — | Primary χ1 = 0.78 ± 0.09 | 19.6 (+3.6/−2.5) + 5.9 ± 0.8 | 214 (+48/−44) Mpc | 11 Oct 2024. Candidate second-generation (hierarchical) black hole. Excludes some ultralight boson masses |
| **GW241110** | — | Primary χ1 = 0.61 (+0.40/−0.33), **anti-aligned** with the orbit | 17.2 (+4.4/−5.0) + 7.7 (+1.5/−2.2) | 736 (+267/−270) Mpc | 10 Nov 2024. First black hole spinning opposite to its orbit |

**GW catalog status (Oct 2026)**
- **GWTC-4.0** was released in **August 2025** (arXiv:2508.18080 introduction, 2508.18081 methods, 2508.18082 results; an ApJL Focus Issue). It added **128 new candidates** from O4a (24 May 2023 – 16 Jan 2024) with p_astro > 0.5. That brought the cumulative catalog to **218**. The catalog also contains 2 likely NSBH events and several events with total mass above 150 M☉, but no new BNS events. Eight of the 128 candidates were not found by the online searches.
- **O4 ended on 18 Nov 2025.** It started on 24 May 2023 and was the longest run to date. About **250 significant candidates were issued as real-time public alerts during O4**, out of 283 processed by the rapid-response team.
- **GWTC-5.0** was released in **May 2026** (arXiv:2605.27223/27224/27225). It added **161 new O4b candidates** (Apr 2024 – Jan 2025), all of them binary black holes. With the updated O4a set (GWTC-4.1, 229 events cumulative), the catalog now holds **390 candidates**. Other highlights: GW240615_113620 is the best-localized event (~6 deg²), and GW241116_151753 has the largest median component mass in O4b (~70 M☉). The O4c segment (Jan–Nov 2025) is still being analysed.
- **Next run**: a ~6-month observing run is planned to start in late summer or early fall 2026, after a maintenance break.

## 4. JWST-era early-universe black holes (2023–2026)

| Object | z | BH mass (M☉) | Notes |
|---|---|---|---|
| **CAPERS-LRD-z9** | 9.288 | log M = 7.58 ± 0.15 (Hβ); range 6.65–8.50 dex | Most distant confirmed broad-line AGN, ~520 Myr after the Big Bang (derived). Some press reported "300 million M☉", which does not match the paper |
| **Abell2744-QSO1** | 7.04 | log M = 7.7 ± 0.3, **dynamical** | First direct dynamical BH mass in the reionisation era (Nature 2026). M_BH / M_star > 2: a "naked" black hole |
| **MoM-BH\*-1** | 7.7569 | ~10⁶–10⁷ | "Black hole star": an accreting black hole cocooned in dense gas (Nature, 12 Aug 2026). RA/Dec 02h17m35.40s, −05°08′06.4″ |
| **UHZ1** | ~10.1 | ~10⁷–10⁸ (assumes Eddington) | Most distant black hole detected in X-rays (Chandra + JWST). Heavy-seed candidate |

## 5. Milky Way geometry (for rendering)

| Parameter | Value | Source |
|---|---|---|
| R0 (Sun–Galactic Centre distance) | **8.277 kpc ± 9 (stat) ± 33 (sys) pc** (GRAVITY 2022). Also 8.275 (GRAVITY 2021), 8.15 ± 0.15 (masers, Reid 2019), 8.2 ± 0.1 (review consensus) | GRAVITY 2022, A&A 657, L12; Reid+2019 ApJ 885, 131; Bland-Hawthorn & Gerhard 2016 ARA&A 54, 529 |
| Sun's height above the plane z☉ | **20.8 ± 0.3 pc** (Gaia DR2 vertical waves). Review value 25 ± 5 pc; masers 5.5 ± 5.8 pc | Bennett & Bovy 2019, MNRAS 482, 1417; BH&G 2016; Reid 2019 |
| Circular speed at Sun Θ0 | 236 ± 7 km/s (Θ0 + V☉ = 247 ± 4) | Reid 2019 |
| Bar (long bar) half-length | 5.0 ± 0.2 kpc (star counts). **CONTESTED**: the dynamical length is ≈ 3.5 kpc (Lucey 2023), with an overdensity reaching 4.8 kpc; the kinematic length is ≈ 4.0 kpc (Zhang 2024) | Wegg, Gerhard & Portail 2015, MNRAS 450, 4050; Lucey+2023 MNRAS 520, 4779; Zhang+2024 arXiv:2406.06678 |
| Bar angle to the Sun–GC line | 27 ± 2° (review); 28–33° (long bar); ~25° (Gaia LPVs). The near end is at positive Galactic longitude | BH&G 2016; Wegg 2015; Zhang 2024 |
| Bar pattern speed | 34.1 ± 2.4 km/s/kpc (Gaia LPVs); 39 ± 3.5 (Portail 2017); review 40 ± 5 | Zhang 2024; Portail+2017 MNRAS 465, 1621; BH&G 2016 |
| Spiral arms | **Four major arms**: Norma–Outer, Scutum–Centaurus (–OSC), Sagittarius–Carina, Perseus. Plus the **Local (Orion) arm/spur**, where the Sun sits, and the near/far **3-kpc arms** at the bar ends | Reid 2019 |
| Pitch angles | Norma–Outer ≈ 20° (Q1), ~0° beyond the Q4 tangency. Scutum–Centaurus ≈ 13°. Sagittarius–Carina ≈ 17° (inner), ~10° (outer). Perseus ≈ 9°. Length-weighted mean ≈ 10°. Arm width w(R) = 336 + 36(R − 8.15) pc | Reid 2019 |
| Disk scale lengths | Thin disk 2.6 ± 0.5 kpc; thick disk 2.0 ± 0.2 kpc | BH&G 2016 |
| Disk scale heights | Thin 300 ± 50 pc; thick 900 ± 180 pc | BH&G 2016 |
| Stellar disk extent | Disk stars are detected out to R ≈ 26 kpc (about 31 kpc in some directions). The disk is warped and flared beyond ~12 kpc | López-Corredoira et al. 2018, A&A 612, L8 |

**Distances used elsewhere**: M87 is at 16.8 ± 0.8 Mpc (EHT 2019 Paper VI). For TON 618, z = 2.219 gives D_L ≈ 18.1 Gpc (**derived**, Planck18), a comoving distance of ≈ 5.6 Gpc and a light-travel time of ≈ 10.8 Gyr. M31 is at 761 ± 11 kpc.

## 6. Contested or surprising points
1. **The mass of Cyg X-1 is disputed again.** Ramachandran et al. 2025 put the black hole at 12.7–17.8 M☉ and the donor at ~29 M☉. That is lower than the 21.2 ± 2.2 M☉ that Miller-Jones et al. found in 2021.
2. **The mass of M87\*** ranges from 3.5 to 6.6 × 10⁹ depending on method. EHT's 6.5 × 10⁹ agrees with stellar dynamics, and the 2023 stellar-dynamics value is lower (5.4 × 10⁹). Spin is still essentially unmeasured: the data only marginally disfavour |a*| ≲ 0.2.
3. **The mass of TON 618** (40 vs 66 billion M☉) rests on single-epoch line-width scaling relations, not direct dynamics. The heaviest black holes with *direct* masses are the Cosmic Horseshoe (~3.6 × 10¹⁰) and Holm 15A\* (4.0 × 10¹⁰). **The ~10¹¹ M☉ figure for Phoenix A is a model estimate, not a measurement.**
4. **Spins of X-ray binaries depend on the method**: continuum fitting and reflection disagree for MAXI J1820+070 (0.14 vs ~0.9). Treat X-ray-binary spins as uncertain.
5. **GW231123** is the heaviest black hole binary seen in gravitational waves (≈ 225 M☉ remnant), but its parameters depend strongly on the waveform model.
6. The **Gaia BH1 mass** was revised from 9.62 to 9.27 M☉. Gaia BH1 is still the nearest known black hole (~480 pc), and no closer one had been confirmed as of Oct 2026.
7. **Bar length**: counts of bar stars give a half-length of ~5 kpc, but dynamics give ~3.5 kpc. For rendering, a ~4.5–5 kpc visual bar with a ~3.5 kpc dynamical core is a defensible compromise.
8. **GW250114 luminosity distance**: no number in Mpc was found in the accessible text of the paper. The 425 Mpc used here comes from z = 0.09.

## References (by key)
- GRAVITY Collaboration 2022, A&A 657, L12 (arXiv:2112.07478); 2021, A&A 647, A59; 2018, A&A 618, L10
- GRAVITY+ Collaboration (Mang F. et al.) 2026, Nature, doi:10.1038/s41586-026-10894-w (S301; ESO eso2612)
- EHT Collaboration 2019, ApJL 875, L1–L6; 2021, ApJL 910, L12–L13; 2022, ApJL 930, L12–L17; 2024, ApJL 964, L25–L26; 2024, A&A 681, A79; 2025, A&A 701 (doi:10.1051/0004-6361/202555855); Bernshteyn et al. 2026, ApJ 1000 (arXiv:2601.00394); Saurabh et al. 2026, A&A 706, A27
- Wong G.N. et al. 2025, arXiv:2509.22639
- Walker R.C. et al. 2018, ApJ 855, 128; Gebhardt K. et al. 2011, ApJ 729, 119; Liepold E.R. et al. 2023, ApJL 945, L35; Walsh J.L. et al. 2013, ApJ 770, 86
- Reid M.J. & Brunthaler A. 2004, ApJ 616, 872; Reid M.J. et al. 2019, ApJ 885, 131 (arXiv:1910.03357); Balick & Brown 1974, ApJ 194, 265
- Bender R. et al. 2005, ApJ 631, 280; Li S. et al. 2021, ApJ 920, 84; Li Z. et al. 2011, ApJL 728, L10
- Miller-Jones J.C.A. et al. 2021, Science 371, 1046 (arXiv:2102.09091); Zhao X. et al. 2021, ApJ 908, 117 (arXiv:2102.09093); Ramachandran V. et al. 2025, A&A 698, A37 (arXiv:2504.05885)
- Khargharia J. et al. 2010, ApJ 716, 1105; Miller-Jones J.C.A. et al. 2009, ApJL 706, L230; Burdge K.B. et al. 2024, Nature 635, 316
- Cantrell A.G. et al. 2010, ApJ 710, 1127; van Grunsven T.F.J. et al. 2017, MNRAS 472, 1907; Gou L. et al. 2010, ApJL 718, L122
- Reid M.J. et al. 2014, ApJ 796, 2; Steeghs D. et al. 2013, ApJ 768, 185; McClintock J.E. et al. 2006, ApJ 652, 518; Mirabel & Rodríguez 1994, Nature 371, 46
- Heida M. et al. 2017, ApJ 846, 132; Zdziarski A.A. et al. 2019, MNRAS 488, 1026; García J.A. et al. 2015, ApJ 813, 84; Parker M.L. et al. 2016, ApJL 821, L6
- Torres M.A.P. et al. 2019, ApJL 882, L21; 2020, ApJL 893, L37; Atri P. et al. 2020, MNRAS 493, L81; Zhao X. et al. 2021, ApJ 916, 108; Kara E. et al. 2019, Nature 565, 198
- El-Badry K. et al. 2023, MNRAS 518, 1057 (BH1); El-Badry K. et al. 2023, MNRAS 521, 4323 (BH2); Nagarajan P. et al. 2024, PASP 136, 014202; Gaia Collaboration (Panuzzo P. et al.) 2024, A&A 686, L2 (arXiv:2404.10486); Balbinot E. et al. 2024, A&A 687, L3
- Häberle M. et al. 2024, Nature 631, 285; Baumgardt & Vasiliev 2021, MNRAS 505, 5957
- Shemmer O. et al. 2004, ApJ 614, 547; Ge X. et al. 2019, AJ 157, 148; Li J. et al. 2021, ApJL 922, L29
- Mehrgan K. et al. 2019, ApJ 887, 195; Melo-Carneiro C.R. et al. 2025, MNRAS (doi:10.1093/mnras/staf1036, arXiv:2502.13788); Brockamp M. et al. 2016, A&A 585, A153; McDonald M. et al. 2026, ApJL 1002, L19
- LVC 2016, PRL 116, 061102; GWTC-1: LVC 2019, PRX 9, 031040; LVC 2020, PRL 125, 101102 and ApJL 900, L13; LVK 2025, arXiv:2507.08219 (GW231123); LVK 2025, PRL 135, 111403 (GW250114, doi:10.1103/kw5g-d732); LVK 2026, PRL 136, 041403 (arXiv:2509.08099); LVK 2025, ApJL 993, L21 (GW241011/GW241110)
- GWTC-4.0: arXiv:2508.18080, 2508.18081, 2508.18082. GWTC-5.0: arXiv:2605.27223, 2605.27224, 2605.27225. LIGO news, 18 Nov 2025 (end of O4)
- Taylor A.J. et al. 2025, ApJL 989, L7; Juodžbalis I. et al. 2026, Nature 653, 1017; Maiolino R. et al. 2025, arXiv:2505.22567; Naidu R.P. et al. 2026, Nature (doi:10.1038/s41586-026-10846-4); Bogdán Á. et al. 2024, Nature Astronomy 8, 126; Goulding A.D. et al. 2023, ApJL 955, L24
- Bland-Hawthorn J. & Gerhard O. 2016, ARA&A 54, 529; Bennett M. & Bovy J. 2019, MNRAS 482, 1417; Wegg C. et al. 2015, MNRAS 450, 4050; Lucey M. et al. 2023, MNRAS 520, 4779; Zhang H. et al. 2024, arXiv:2406.06678; Portail M. et al. 2017, MNRAS 465, 1621; López-Corredoira M. et al. 2018, A&A 612, L8
