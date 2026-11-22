import * as THREE from 'three';

const X_CELL = -3.2;
const Z_CELL = -0.2;
const Y_BOT = -1.96;
const Y_TOP = 1.96;

// Front-right ~98° cutaway window facing the default isometric camera (+25, +19, +35)
// In Three.js LatheGeometry / cylindrical coords: x = r * sin(phi), z = r * cos(phi).
// Leaving phi ∈ (-0.14, +1.56) open exposes BOTH cross-section slices straight toward the viewer!
const PHI_START = 1.56;
const PHI_END = Math.PI * 2 - 0.14;
const PHI_LEN = PHI_END - PHI_START; // ~4.583 rad (~262.6°)

/**
 * Conical chamber inner radius as a function of vertical coordinate Y.
 * Precision ~20° truncated cone provides automatic capillary self-centering of the oil lens!
 */
function chamberWallRadius(y) {
  return 3.36 + 0.355 * y;
}

/**
 * Exact spherical/paraboloidal liquid meniscus surface Y(u, phi) for normalized radius u ∈ [0, 1].
 * k ∈ [-1, +1]: -1 = 0 V concave diverging (-15 D), 0 = ~38 Vrms flat (0 D), +1 = 60 Vrms convex macro (+35 D).
 * (tx, tz): 4-quadrant differential OIS optical tilt!
 */
export function computeMeniscusY(u, phi, k, tx = 0, tz = 0) {
  const yCenter = 0.06 + 0.68 * k;
  const yRim = 0.06 - 0.54 * k;
  const tilt = u * (tx * Math.sin(phi) + tz * Math.cos(phi));
  const y = yCenter + (yRim - yCenter) * u * u + tilt;
  return THREE.MathUtils.clamp(y, Y_BOT + 0.24, Y_TOP - 0.24);
}

/**
 * Builds a zero-GC live-morphing 262° cutaway meniscus ribbon + thin sheet BufferGeometry.
 */
function buildDynamicMeniscusMesh(mat) {
  const NR = 14;
  const NPHI = 36;
  const cols = NPHI + 1;
  const rows = NR + 1;

  // Surface vertices (rows * cols) + two thickened front cutaway rim strips (2 * rows * 2 = 4 * rows)
  const surfCount = rows * cols;
  const rimStripVerts = rows * 2; // top + bottom of ribbon at PHI_START and PHI_END
  const totalVerts = surfCount + rimStripVerts * 2;

  const positions = new Float32Array(totalVerts * 3);
  const indices = [];

  // Main curved meniscus sheet
  for (let ir = 0; ir < NR; ir++) {
    for (let ip = 0; ip < NPHI; ip++) {
      const a = ir * cols + ip;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Front cutaway luminous edge ribbon #1 (phi = PHI_START) and #2 (phi = PHI_END)
  const rim1Base = surfCount;
  const rim2Base = surfCount + rimStripVerts;
  for (let ir = 0; ir < NR; ir++) {
    const a1 = rim1Base + ir * 2;
    indices.push(a1, a1 + 1, a1 + 2, a1 + 1, a1 + 3, a1 + 2);
    const a2 = rim2Base + ir * 2;
    indices.push(a2, a2 + 2, a2 + 1, a2 + 1, a2 + 2, a2 + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.morphMeta = { type: 'meniscus', NR, NPHI, surfCount, rim1Base, rim2Base };
  return mesh;
}

/**
 * Builds a closed 262° cutaway liquid phase volume (either 'water' above meniscus or 'oil' below meniscus)
 * whose curved outer conical wall AND both exposed front cross-section slices deform seamlessly in real time!
 */
function buildDynamicFluidVolumeMesh(kind, mat) {
  const NR = 14;
  const NPHI = 36;
  const NV = 6; // vertical subdivisions along conical outer wall
  const isWater = kind === 'water';

  // Layout of vertex blocks in positions Float32Array:
  // 1. Flat cap (top for water, bottom for oil): (NR+1) * (NPHI+1)
  // 2. Outer conical wall: (NV+1) * (NPHI+1)
  // 3. Exposed cutaway slice #1 (phi = PHI_START): 2 * (NR+1)
  // 4. Exposed cutaway slice #2 (phi = PHI_END):   2 * (NR+1)
  const cols = NPHI + 1;
  const capRows = NR + 1;
  const wallRows = NV + 1;

  const capBase = 0;
  const capCount = capRows * cols;
  const wallBase = capBase + capCount;
  const wallCount = wallRows * cols;
  const slice1Base = wallBase + wallCount;
  const sliceCount = 2 * capRows;
  const slice2Base = slice1Base + sliceCount;
  const totalVerts = slice2Base + sliceCount;

  const positions = new Float32Array(totalVerts * 3);
  const indices = [];

  // 1. Flat cap indices
  for (let ir = 0; ir < NR; ir++) {
    for (let ip = 0; ip < NPHI; ip++) {
      const a = capBase + ir * cols + ip;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (isWater) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }

  // 2. Outer conical wall indices
  for (let iv = 0; iv < NV; iv++) {
    for (let ip = 0; ip < NPHI; ip++) {
      const a = wallBase + iv * cols + ip;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // 3. Cutaway slice #1 (phi = PHI_START) & #2 (phi = PHI_END)
  for (let ir = 0; ir < NR; ir++) {
    const s1 = slice1Base + ir * 2;
    indices.push(s1, s1 + 1, s1 + 2, s1 + 1, s1 + 3, s1 + 2);
    const s2 = slice2Base + ir * 2;
    indices.push(s2, s2 + 2, s2 + 1, s2 + 1, s2 + 2, s2 + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.morphMeta = {
    type: kind,
    NR,
    NPHI,
    NV,
    capBase,
    wallBase,
    slice1Base,
    slice2Base
  };
  return mesh;
}

/**
 * Zero-GC real-time vertex updater for the live morphing meniscus, aqueous phase, and oil phase!
 */
export function updateLiquidMorphMesh(mesh, k, tx = 0, tz = 0) {
  const m = mesh.userData.morphMeta;
  if (!m) return;
  const posAttr = mesh.geometry.attributes.position;
  const arr = posAttr.array;

  const setV = (idx, x, y, z) => {
    const o = idx * 3;
    arr[o] = x;
    arr[o + 1] = y;
    arr[o + 2] = z;
  };

  if (m.type === 'meniscus') {
    const { NR, NPHI, rim1Base, rim2Base } = m;
    const cols = NPHI + 1;
    for (let ir = 0; ir <= NR; ir++) {
      const u = ir / NR;
      for (let ip = 0; ip <= NPHI; ip++) {
        const phi = PHI_START + (ip / NPHI) * PHI_LEN;
        const y = computeMeniscusY(u, phi, k, tx, tz);
        const r = u * (chamberWallRadius(y) - 0.035);
        setV(ir * cols + ip, X_CELL + r * Math.sin(phi), y, Z_CELL + r * Math.cos(phi));
      }
      // Front luminous cutaway edges (thickness ±0.038 so the golden meniscus curve reads unmistakably!)
      for (const [base, phi] of [[rim1Base, PHI_START], [rim2Base, PHI_END]]) {
        const y = computeMeniscusY(u, phi, k, tx, tz);
        const r = u * (chamberWallRadius(y) - 0.030);
        const cx = X_CELL + r * Math.sin(phi);
        const cz = Z_CELL + r * Math.cos(phi);
        setV(base + ir * 2, cx, y + 0.042, cz);
        setV(base + ir * 2 + 1, cx, y - 0.042, cz);
      }
    }
  } else {
    const isWater = m.type === 'water';
    const { NR, NPHI, NV, capBase, wallBase, slice1Base, slice2Base } = m;
    const cols = NPHI + 1;
    const yCap = isWater ? Y_TOP : Y_BOT;
    const rCapMax = chamberWallRadius(yCap) - 0.045;
    const gap = isWater ? 0.046 : -0.046;

    // 1. Flat cap
    for (let ir = 0; ir <= NR; ir++) {
      const u = ir / NR;
      const r = u * rCapMax;
      for (let ip = 0; ip <= NPHI; ip++) {
        const phi = PHI_START + (ip / NPHI) * PHI_LEN;
        setV(capBase + ir * cols + ip, X_CELL + r * Math.sin(phi), yCap, Z_CELL + r * Math.cos(phi));
      }
    }

    // 2. Outer conical wall conforming to chamberWallRadius(y)
    for (let ip = 0; ip <= NPHI; ip++) {
      const phi = PHI_START + (ip / NPHI) * PHI_LEN;
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      const yMenRim = computeMeniscusY(1.0, phi, k, tx, tz) + gap;
      const y0 = isWater ? yMenRim : Y_BOT;
      const y1 = isWater ? Y_TOP : yMenRim;
      for (let iv = 0; iv <= NV; iv++) {
        const v = iv / NV;
        const y = y0 + (y1 - y0) * v;
        const r = chamberWallRadius(y) - 0.045;
        setV(wallBase + iv * cols + ip, X_CELL + r * sp, y, Z_CELL + r * cp);
      }
    }

    // 3. Exposed front cutaway slices at PHI_START & PHI_END
    for (const [base, phi] of [[slice1Base, PHI_START], [slice2Base, PHI_END]]) {
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      for (let ir = 0; ir <= NR; ir++) {
        const u = ir / NR;
        const yMen = computeMeniscusY(u, phi, k, tx, tz) + gap;
        const rMen = u * (chamberWallRadius(yMen) - 0.045);
        const rCap = u * rCapMax;
        if (isWater) {
          setV(base + ir * 2, X_CELL + rMen * sp, yMen, Z_CELL + rMen * cp);
          setV(base + ir * 2 + 1, X_CELL + rCap * sp, yCap, Z_CELL + rCap * cp);
        } else {
          setV(base + ir * 2, X_CELL + rCap * sp, yCap, Z_CELL + rCap * cp);
          setV(base + ir * 2 + 1, X_CELL + rMen * sp, yMen, Z_CELL + rMen * cp);
        }
      }
    }
  }

  posAttr.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}

/**
 * Helper: Builds a cutaway LatheGeometry shell with custom profile points centered at (X_CELL, 0, Z_CELL).
 */
function buildCutawayLathe(pts, mat, phiStart = PHI_START, phiLen = PHI_LEN, segs = 48) {
  const geo = new THREE.LatheGeometry(pts, segs, phiStart, phiLen);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(X_CELL, 0, Z_CELL);
  return m;
}

/**
 * Phase 11: Zero-Gear Bionic Eye — 4-Quadrant Electrowetting Liquid Lens (EWOD AF + 2-Axis OIS)
 * & 500x Magnified Triple-Phase Contact-Line / Electric-Double-Layer (EDL) Nano-Anatomy (32 Independent Parts!)
 */
export function buildLiquidLensAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'LiquidLensRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // =========================================================================
  // GROUP 1: HERMETIC CAPSULE, THERMAL BELLOWS & COMPANION OPTICS (01-06)
  // =========================================================================

  // 01. Laser-Welded Titanium / SUS316L Hermetic Top Cap & Outer Shell (262° Cutaway!)
  const capGrp = new THREE.Group();
  {
    const pts = [
      new THREE.Vector2(3.75, 3.05),
      new THREE.Vector2(5.78, 3.05),
      new THREE.Vector2(5.78, -2.55),
      new THREE.Vector2(5.46, -2.55),
      new THREE.Vector2(5.46, 2.72),
      new THREE.Vector2(3.75, 2.72),
      new THREE.Vector2(3.75, 3.05)
    ];
    capGrp.add(buildCutawayLathe(pts, mats.decoTitanium));

    // Laser-weld seam bead ring along upper perimeter shoulder
    const weldPts = [
      new THREE.Vector2(5.76, 2.78),
      new THREE.Vector2(5.86, 2.86),
      new THREE.Vector2(5.86, 2.96),
      new THREE.Vector2(5.76, 3.02)
    ];
    capGrp.add(buildCutawayLathe(weldPts, mats.susSteel));
  }
  register('ll_titanium_hermetic_cap', capGrp, [-1.8, 6.2, -1.5]);

  // 02. Top Optical Borosilicate Glass Window & Dual-Side Broadband AR Coat (Cutaway!)
  const topWinGrp = new THREE.Group();
  {
    const pts = [
      new THREE.Vector2(0.001, 2.02),
      new THREE.Vector2(4.42, 2.02),
      new THREE.Vector2(4.42, 2.48),
      new THREE.Vector2(0.001, 2.48)
    ];
    topWinGrp.add(buildCutawayLathe(pts, mats.decoGorillaDx));

    // Iridescent top broadband AR coat film
    const arPts = [
      new THREE.Vector2(0.001, 2.49),
      new THREE.Vector2(4.36, 2.49),
      new THREE.Vector2(4.36, 2.55),
      new THREE.Vector2(0.001, 2.55)
    ];
    topWinGrp.add(buildCutawayLathe(arPts, mats.decoArDxCoat));
  }
  register('ll_top_glass_window', topWinGrp, [-1.2, 4.6, 0.0]);

  // 03. Upper Fixed Molded Aspheric Companion Collimator Lens (G1, Cutaway!)
  const g1Grp = new THREE.Group();
  {
    const pts = [];
    const rMax = 3.68;
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), 3.18 - 0.14 * (1 - 0.65 * u * u)));
    }
    for (let i = 18; i >= 0; i--) {
      const u = i / 18;
      pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), 3.92 + 0.56 * (1 - 0.85 * u * u + 0.12 * u * u * u * u)));
    }
    g1Grp.add(buildCutawayLathe(pts, mats.lensGlass1G));

    // Retaining rim collar around G1
    const rimPts = [
      new THREE.Vector2(3.64, 3.06),
      new THREE.Vector2(4.12, 3.06),
      new THREE.Vector2(4.12, 3.94),
      new THREE.Vector2(3.64, 3.94),
      new THREE.Vector2(3.64, 3.06)
    ];
    g1Grp.add(buildCutawayLathe(rimPts, mats.susDarkInner));
  }
  register('ll_companion_front_glass', g1Grp, [-1.2, 7.2, 0.2]);

  // 04. Corrugated SUS316L Thermal-Expansion Compensation Bellows Ring (-20°C to +70°C!)
  const bellowsGrp = new THREE.Group();
  {
    const pts = [];
    // Sinusoidal corrugated radial accordion profile spanning R ∈ [4.42, 5.34] at Y ≈ 2.28
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = 4.44 + t * 0.90;
      const y = 2.26 + Math.sin(t * Math.PI * 5) * 0.20;
      pts.push(new THREE.Vector2(r, y + 0.045));
    }
    for (let i = N; i >= 0; i--) {
      const t = i / N;
      const r = 4.44 + t * 0.90;
      const y = 2.26 + Math.sin(t * Math.PI * 5) * 0.20;
      pts.push(new THREE.Vector2(r, y - 0.045));
    }
    bellowsGrp.add(buildCutawayLathe(pts, mats.llBellowsSteel));
  }
  register('ll_thermal_bellows_membrane', bellowsGrp, [-1.5, 5.3, -0.4]);

  // 05. Twin Chemical-Resistant Perfluoroelastomer (FFKM) Compression O-Ring Seals
  const oringGrp = new THREE.Group();
  {
    for (const [rMaj, yPos] of [[4.36, 1.94], [3.16, -2.06]]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        pts.push(new THREE.Vector2(rMaj + Math.cos(a) * 0.16, yPos + Math.sin(a) * 0.14));
      }
      oringGrp.add(buildCutawayLathe(pts, mats.llFfkMOseal));
    }
  }
  register('ll_ffkm_hermetic_orings', oringGrp, [-1.0, 3.6, 0.2]);

  // 06. Matte-Black Precision Entrance Aperture Field Stop & Stray-Light Mask
  const stopGrp = new THREE.Group();
  {
    const pts = [
      new THREE.Vector2(2.72, 2.57),
      new THREE.Vector2(4.42, 2.57),
      new THREE.Vector2(4.42, 2.69),
      new THREE.Vector2(2.72, 2.69),
      new THREE.Vector2(2.72, 2.57)
    ];
    stopGrp.add(buildCutawayLathe(pts, mats.lensEdgeBlack));
  }
  register('ll_optical_aperture_stop', stopGrp, [-1.2, 5.8, 0.3]);

  // =========================================================================
  // GROUP 2: DENSITY-MATCHED DUAL-FLUID CORE & LIVE MORPHING MENISCUS (07-10)
  // =========================================================================
  const K_REST = 0.72; // Crisp convex macro dome at rest so curved liquid lens reads immediately!

  // 07. Conductive Polar Aqueous Electrolyte (Water Phase, n_d = 1.35 — LIVE MORPHING!)
  const waterGrp = new THREE.Group();
  const waterMesh = buildDynamicFluidVolumeMesh('water', mats.llWaterLiquid);
  updateLiquidMorphMesh(waterMesh, K_REST, 0, 0);
  waterGrp.add(waterMesh);
  waterGrp.userData.liquidMorphMesh = waterMesh;
  waterGrp.userData.liquidRestK = K_REST;
  register('ll_conductive_aqueous_phase', waterGrp, [-0.8, 2.5, 0.2]);

  // 08. HERO: Live-Morphing Oil-Water Spherical Meniscus Interface (-15 D <-> +35 D + 2-Axis OIS!)
  const meniscusGrp = new THREE.Group();
  const meniscusMesh = buildDynamicMeniscusMesh(mats.llMeniscusGlow);
  updateLiquidMorphMesh(meniscusMesh, K_REST, 0, 0);
  meniscusGrp.add(meniscusMesh);
  meniscusGrp.userData.liquidMorphMesh = meniscusMesh;
  meniscusGrp.userData.liquidRestK = K_REST;
  register('ll_oil_water_meniscus', meniscusGrp, [-0.6, 1.0, 0.4]);

  // 09. Insulating Non-Polar High-Index Aryl-Siloxane Optical Oil (Oil Phase, n_d = 1.54 — LIVE MORPHING!)
  const oilGrp = new THREE.Group();
  const oilMesh = buildDynamicFluidVolumeMesh('oil', mats.llOilLiquid);
  updateLiquidMorphMesh(oilMesh, K_REST, 0, 0);
  oilGrp.add(oilMesh);
  oilGrp.userData.liquidMorphMesh = oilMesh;
  oilGrp.userData.liquidRestK = K_REST;
  register('ll_nonpolar_optical_oil', oilGrp, [-0.8, -0.6, 0.2]);

  // 10. Bottom Hermetic Optical Window + Lower Fixed Glass Relay Lens (G2, Cutaway!)
  const botWinGrp = new THREE.Group();
  {
    const winPts = [
      new THREE.Vector2(0.001, -2.44),
      new THREE.Vector2(3.25, -2.44),
      new THREE.Vector2(3.25, -1.98),
      new THREE.Vector2(0.001, -1.98)
    ];
    botWinGrp.add(buildCutawayLathe(winPts, mats.decoGorillaDx));

    // Sculpted G2 meniscus glass relay lens seated neatly beneath the bottom window
    const g2Pts = [];
    const rMax = 2.75;
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      g2Pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), -3.12 + 0.22 * (1 - 0.7 * u * u)));
    }
    for (let i = 16; i >= 0; i--) {
      const u = i / 16;
      g2Pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), -2.56 + 0.10 * (1 - 0.8 * u * u)));
    }
    botWinGrp.add(buildCutawayLathe(g2Pts, mats.lensResinGullwing));
  }
  register('ll_bottom_window_companion', botWinGrp, [-1.0, -3.2, 0.0]);

  // =========================================================================
  // GROUP 3: CONICAL DIELECTRIC WALL & 4-QUADRANT OIS+AF ELECTRODES (11-18)
  // =========================================================================

  // 11. Upper Immersion Common-Ground Ring Electrode (Pt-Ir / Au contacting aqueous electrolyte!)
  const comElecGrp = new THREE.Group();
  {
    const rTop = chamberWallRadius(Y_TOP);
    const pts = [
      new THREE.Vector2(rTop - 0.16, 1.66),
      new THREE.Vector2(rTop + 0.22, 1.66),
      new THREE.Vector2(rTop + 0.22, 1.98),
      new THREE.Vector2(rTop - 0.16, 1.98),
      new THREE.Vector2(rTop - 0.16, 1.66)
    ];
    comElecGrp.add(buildCutawayLathe(pts, mats.goldBond));
  }
  register('ll_common_ground_electrode', comElecGrp, [-1.2, 3.0, -0.3]);

  // 12. 50 nm Amorphous Fluoropolymer (Cytop / Teflon AF) Conical Hydrophobic Top-Coat
  const cytopGrp = new THREE.Group();
  {
    const rB = chamberWallRadius(Y_BOT);
    const rT = chamberWallRadius(Y_TOP - 0.34);
    const pts = [
      new THREE.Vector2(rB, Y_BOT),
      new THREE.Vector2(rB + 0.08, Y_BOT),
      new THREE.Vector2(rT + 0.08, Y_TOP - 0.34),
      new THREE.Vector2(rT, Y_TOP - 0.34),
      new THREE.Vector2(rB, Y_BOT)
    ];
    cytopGrp.add(buildCutawayLathe(pts, mats.llCytopHydrophobic));
  }
  register('ll_hydrophobic_cytop_liner', cytopGrp, [-0.6, 1.6, -0.8]);

  // 13. 2.5 μm Room-Temp CVD Parylene AF-4 / HT High-Breakdown Dielectric Insulator Cone
  const paryleneGrp = new THREE.Group();
  {
    const rB = chamberWallRadius(Y_BOT) + 0.09;
    const rT = chamberWallRadius(Y_TOP - 0.34) + 0.09;
    const pts = [
      new THREE.Vector2(rB, Y_BOT),
      new THREE.Vector2(rB + 0.16, Y_BOT),
      new THREE.Vector2(rT + 0.16, Y_TOP - 0.34),
      new THREE.Vector2(rT, Y_TOP - 0.34),
      new THREE.Vector2(rB, Y_BOT)
    ];
    paryleneGrp.add(buildCutawayLathe(pts, mats.llParyleneDielectric));
  }
  register('ll_parylene_dielectric_cone', paryleneGrp, [-0.4, 0.8, -1.2]);

  // 14-17. 4-Quadrant Segmented Conical Gold/ITO Tilt+Focus Electrodes (Q1 +X, Q2 -X, Q3 +Z, Q4 -Z!)
  const makeQuadElectrode = (id, phi0, phiSpan, explodeVec, quadAxis) => {
    const grp = new THREE.Group();
    const rB = chamberWallRadius(Y_BOT) + 0.27;
    const rT = chamberWallRadius(Y_TOP - 0.36) + 0.27;
    const pts = [
      new THREE.Vector2(rB, Y_BOT + 0.04),
      new THREE.Vector2(rB + 0.18, Y_BOT + 0.04),
      new THREE.Vector2(rT + 0.18, Y_TOP - 0.36),
      new THREE.Vector2(rT, Y_TOP - 0.36),
      new THREE.Vector2(rB, Y_BOT + 0.04)
    ];
    const qMat = mats.llQuadElectrode.clone();
    const mesh = buildCutawayLathe(pts, qMat, phi0, phiSpan, 20);
    grp.add(mesh);
    grp.userData.liquidQuadMat = qMat;
    grp.userData.liquidQuadMesh = mesh;
    grp.userData.liquidQuadAxis = quadAxis;
    register(id, grp, explodeVec);
  };

  // Remember x = r*sin(phi), z = r*cos(phi). Cutaway gap is phi ∈ (-0.14, +1.56).
  // Q1 (+X right rear edge, visible right next to cutaway!): phi ∈ [1.58, 2.30]
  makeQuadElectrode('ll_quad_electrode_xp', 1.58, 0.72, [2.4, 0.2, 0.0], 'x+');
  // Q4 (-Z rear quadrant): phi ∈ [2.42, 3.86]
  makeQuadElectrode('ll_quad_electrode_zn', 2.42, 1.44, [-0.6, 0.2, -2.6], 'z-');
  // Q2 (-X left quadrant): phi ∈ [3.98, 5.42]
  makeQuadElectrode('ll_quad_electrode_xn', 3.98, 1.44, [-3.0, 0.2, 0.0], 'x-');
  // Q3 (+Z front-left segment bordering front cutaway edge!): phi ∈ [5.54, 6.13]
  makeQuadElectrode('ll_quad_electrode_zp', 5.54, 0.59, [-0.6, 0.2, 2.4], 'z+');

  // 18. Precision Machined Conical Alumina/Glass Chamber Body & Hermetic Base Housing
  const coreGrp = new THREE.Group();
  {
    const rB = chamberWallRadius(Y_BOT) + 0.47;
    const rT = chamberWallRadius(Y_TOP - 0.34) + 0.47;
    const pts = [
      new THREE.Vector2(3.26, -2.52),
      new THREE.Vector2(5.42, -2.52),
      new THREE.Vector2(5.42, 1.98),
      new THREE.Vector2(rT, 1.98),
      new THREE.Vector2(rB, Y_BOT),
      new THREE.Vector2(3.26, Y_BOT),
      new THREE.Vector2(3.26, -2.52)
    ];
    coreGrp.add(buildCutawayLathe(pts, mats.llCeramicChamber));
  }
  register('ll_conical_ceramic_core', coreGrp, [-1.4, -1.6, -1.0]);

  // =========================================================================
  // GROUP 4: 60 VRMS AC CHARGE-PUMP & CAPACITANCE-SENSING ELECTRONICS (19-25)
  // Cleanly arranged on the front electronics apron (Z ∈ [+5.5, +8.4])!
  // =========================================================================

  // 19. MAX14574 / HV892-Class 60 Vrms / 1 kHz AC Inductor-Less Charge-Pump + Quad H-Bridge ASIC
  const asicGrp = new THREE.Group();
  {
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.56, 2.05), mats.icPackageDark);
    pkg.position.set(X_CELL - 1.95, -2.58, Z_CELL + 6.95);
    asicGrp.add(pkg);

    // Pin-1 gold fiducial + high-voltage H-bridge top laser die stripe
    const fid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), mats.goldBond);
    fid.position.set(X_CELL - 2.92, -2.29, Z_CELL + 7.65);
    asicGrp.add(fid);
    const hvStripe = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.85), mats.llQuadElectrode);
    hvStripe.position.set(X_CELL - 1.85, -2.28, Z_CELL + 6.95);
    asicGrp.add(hvStripe);
  }
  register('ll_hv_chargepump_asic', asicGrp, [-1.4, -2.4, 3.0]);

  // 20. Closed-Loop Capacitance-to-Digital (CDC 60-220 pF) Meniscus-Position Feedback IC
  const cdcGrp = new THREE.Group();
  {
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.46, 1.55), mats.hallSensorEmerald);
    pkg.position.set(X_CELL + 0.58, -2.63, Z_CELL + 6.95);
    cdcGrp.add(pkg);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.95), mats.alPad);
    lid.position.set(X_CELL + 0.58, -2.38, Z_CELL + 6.95);
    cdcGrp.add(lid);
  }
  register('ll_capacitance_cdc_ic', cdcGrp, [0.4, -2.2, 3.2]);

  // 21. 100 V-Rated 0402 Charge-Pump Flying & High-Voltage Storage MLCC Bank (x6)
  const mlccGrp = new THREE.Group();
  {
    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const mx = X_CELL + 2.15 + col * 0.82;
      const mz = Z_CELL + 6.52 + row * 0.86;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.34), mats.mlccCeramic);
      body.position.set(mx, -2.69, mz);
      mlccGrp.add(body);
      for (const sd of [-0.25, 0.25]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.36), mats.solderTin);
        cap.position.set(mx + sd, -2.69, mz);
        mlccGrp.add(cap);
      }
    }
  }
  register('ll_hv_flying_mlccs', mlccGrp, [1.2, -2.2, 3.4]);

  // 22. 0201 Temperature-Drift Compensation NTC Thermistor (dn/dT & Viscosity Table)
  const ntcGrp = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.32, 0.40), mats.llParyleneDielectric);
    body.position.set(X_CELL + 4.55, -2.70, Z_CELL + 6.95);
    ntcGrp.add(body);
    for (const sd of [-0.26, 0.26]) {
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.42), mats.goldBond);
      term.position.set(X_CELL + 4.55 + sd, -2.70, Z_CELL + 6.95);
      ntcGrp.add(term);
    }
  }
  register('ll_temp_comp_ntc', ntcGrp, [1.8, -2.2, 3.5]);

  // 23. 5x Hermetic Glass-to-Metal Sealed High-Voltage Feedthrough Pins (Q1-Q4 + COM)
  const pinsGrp = new THREE.Group();
  {
    const pinAngles = [1.85, 3.14, 4.65, 5.75, 2.38];
    for (let i = 0; i < pinAngles.length; i++) {
      const a = pinAngles[i];
      const rP = 4.92;
      const px = X_CELL + rP * Math.sin(a);
      const pz = Z_CELL + rP * Math.cos(a);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.35, 14), mats.goldBond);
      pin.position.set(px, -2.62, pz);
      pinsGrp.add(pin);
      // Hermetic insulating glass bead collar around each pin!
      const bead = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 16), mats.llCytopHydrophobic);
      bead.position.set(px, -2.52, pz);
      pinsGrp.add(bead);
    }
  }
  register('ll_feedthrough_pins', pinsGrp, [-0.8, -3.4, 0.2]);

  // 24. High-Voltage Creepage-Guarded Multi-Layer Rigid Driver PCB & Ground Guard Ring
  const pcbGrp = new THREE.Group();
  {
    const s = new THREE.Shape();
    // Shape X = local X, Shape Y = -local Z (rear +6.0, front apron -8.3)
    s.moveTo(-6.05, -8.35);
    s.lineTo(6.05, -8.35);
    s.lineTo(6.05, 6.05);
    s.lineTo(-6.05, 6.05);
    s.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 3.12, 0, Math.PI * 2, true);
    s.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.56, bevelEnabled: false, curveSegments: 40 });
    geo.rotateX(-Math.PI / 2);
    const board = new THREE.Mesh(geo, mats.rigidPcb);
    board.position.set(X_CELL, -3.42, Z_CELL);
    pcbGrp.add(board);

    // Golden high-voltage creepage guard ring around central optical cutout
    const guard = new THREE.Mesh(new THREE.TorusGeometry(3.32, 0.08, 10, 44), mats.goldBond);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(X_CELL, -2.85, Z_CELL);
    pcbGrp.add(guard);
  }
  register('ll_hv_rigid_pcb', pcbGrp, [-1.0, -4.4, 0.4]);

  // 25. I²C Control Polyimide FPC Tail & 10-Pin 0.35 mm Gold BTB Mezzanine Connector
  const fpcGrp = new THREE.Group();
  {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.12, 2.75), mats.fpcPolyimide);
    ribbon.position.set(X_CELL - 1.95, -3.36, Z_CELL + 9.45);
    fpcGrp.add(ribbon);

    const btb = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.38, 0.88), mats.btbHousing);
    btb.position.set(X_CELL - 1.95, -3.12, Z_CELL + 10.65);
    fpcGrp.add(btb);

    for (let p = 0; p < 5; p++) {
      const px = X_CELL - 2.95 + p * 0.50;
      for (const pz of [Z_CELL + 10.34, Z_CELL + 10.96]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.20), mats.goldBond);
        pin.position.set(px, -3.10, pz);
        fpcGrp.add(pin);
      }
    }
  }
  register('ll_fpc_btb_connector', fpcGrp, [-1.4, -4.8, 4.0]);

  // =========================================================================
  // GROUP 5: 500x MAGNIFIED TRIPLE-PHASE CONTACT-LINE & EDL NANO-ANATOMY (26-32)
  // Positioned cleanly on the right side (X_MIC = +8.5, Y_MIC = +0.55, Z_MIC = +0.2)!
  // Wall stack stands vertically tilted at slight ~12° cone angle on the left of the inset,
  // with turquoise water above & golden oil below meeting at the live-sliding triple-phase line!
  // =========================================================================
  const X_MIC = 8.4;
  const Y_MIC = 0.55;
  const Z_MIC = 0.2;
  const SLAB_H = 5.4;
  const SLAB_D = 4.6;

  // 26. 500x Conical Gold Sidewall Electrode Slab & Induced Surface Charge Layer (σ_e)
  const mElecGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.82, SLAB_H, SLAB_D), mats.llQuadElectrode);
    slab.position.set(X_MIC - 2.35, Y_MIC, Z_MIC);
    mElecGrp.add(slab);

    // 4x3 glowing violet induced surface charge spheres (-σ_e) arrayed along the electrode face!
    const chGeo = new THREE.SphereGeometry(0.15, 12, 10);
    for (let iy = 0; iy < 5; iy++) {
      for (let iz = 0; iz < 3; iz++) {
        const q = new THREE.Mesh(chGeo, mats.llChargeNegative);
        q.position.set(X_MIC - 1.92, Y_MIC - 1.65 + iy * 0.82, Z_MIC - 1.35 + iz * 1.35);
        mElecGrp.add(q);
      }
    }
  }
  register('ll_micro_gold_electrode', mElecGrp, [1.8, 0.6, -0.8]);

  // 27. 500x Conformal Parylene AF-4 Dielectric Barrier (2.5 μm, E ≈ 24 MV/m Stack)
  const mParyGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.76, SLAB_H, SLAB_D), mats.llParyleneDielectric);
    slab.position.set(X_MIC - 1.54, Y_MIC, Z_MIC);
    mParyGrp.add(slab);

    // Subtle glowing electric-field lines bridging across the 2.5 μm dielectric thickness
    const fieldGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.72, 8);
    fieldGeo.rotateZ(Math.PI / 2);
    for (let iy = 0; iy < 4; iy++) {
      const fLine = new THREE.Mesh(fieldGeo, mats.llChargeNegative);
      fLine.position.set(X_MIC - 1.54, Y_MIC - 1.2 + iy * 0.82, Z_MIC + SLAB_D * 0.5 + 0.04);
      mParyGrp.add(fLine);
    }
  }
  register('ll_micro_parylene_insulator', mParyGrp, [2.6, 0.9, -0.4]);

  // 28. 500x 50 nm Cytop / Teflon AF Fluorocarbon (-CF₃) Hydrophobic Molecular Brush Layer
  const mCytopGrp = new THREE.Group();
  {
    const baseFilm = new THREE.Mesh(new THREE.BoxGeometry(0.26, SLAB_H, SLAB_D), mats.llCytopHydrophobic);
    baseFilm.position.set(X_MIC - 1.02, Y_MIC, Z_MIC);
    mCytopGrp.add(baseFilm);

    // Nanoscale -CF₃ fluorocarbon molecular brush pillars protruding rightward into the fluid boundary!
    const stemGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.34, 8);
    stemGeo.rotateZ(Math.PI / 2);
    const tipGeo = new THREE.SphereGeometry(0.095, 10, 8);
    for (let iy = 0; iy < 7; iy++) {
      for (let iz = 0; iz < 5; iz++) {
        const py = Y_MIC - 2.1 + iy * 0.70;
        const pz = Z_MIC - 1.6 + iz * 0.80;
        const stem = new THREE.Mesh(stemGeo, mats.llCytopHydrophobic);
        stem.position.set(X_MIC - 0.76, py, pz);
        mCytopGrp.add(stem);
        const tip = new THREE.Mesh(tipGeo, mats.llCytopHydrophobic);
        tip.position.set(X_MIC - 0.58, py, pz);
        mCytopGrp.add(tip);
      }
    }
  }
  register('ll_micro_fluoropolymer_brush', mCytopGrp, [3.3, 1.2, 0.0]);

  // 29. 500x Live-Wetting Conductive Aqueous Electrolyte Wedge (θ₀ 160° -> θ(V) 65° — LIVE SLIDING!)
  const mWaterGrp = new THREE.Group();
  {
    // Curved meniscus wedge contacting wall at x = -0.52 and arching smoothly rightward!
    const s = new THREE.Shape();
    s.moveTo(0.0, 2.55);
    s.lineTo(3.45, 2.55);
    s.lineTo(3.45, 0.55);
    s.quadraticCurveTo(1.55, 0.45, 0.0, -0.35); // Acute electrowetting contact angle θ(V) ≈ 65° dipping down the wall!
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, { depth: SLAB_D - 0.16, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, -(SLAB_D - 0.16) * 0.5);
    const wMesh = new THREE.Mesh(geo, mats.llWaterLiquid);
    wMesh.position.set(X_MIC - 0.50, Y_MIC, Z_MIC);
    mWaterGrp.add(wMesh);

    // Crisp luminous golden meniscus film along the curved water-oil contact line
    const arcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X_MIC - 0.50, Y_MIC - 0.35, Z_MIC),
      new THREE.Vector3(X_MIC + 0.42, Y_MIC + 0.06, Z_MIC),
      new THREE.Vector3(X_MIC + 1.62, Y_MIC + 0.40, Z_MIC),
      new THREE.Vector3(X_MIC + 2.95, Y_MIC + 0.55, Z_MIC)
    ]);
    const ribPts = arcCurve.getPoints(20);
    const menShape = new THREE.Shape();
    menShape.moveTo(ribPts[0].x - (X_MIC - 0.50), ribPts[0].y - Y_MIC + 0.05);
    for (let i = 1; i < ribPts.length; i++) {
      menShape.lineTo(ribPts[i].x - (X_MIC - 0.50), ribPts[i].y - Y_MIC + 0.05);
    }
    for (let i = ribPts.length - 1; i >= 0; i--) {
      menShape.lineTo(ribPts[i].x - (X_MIC - 0.50), ribPts[i].y - Y_MIC - 0.05);
    }
    menShape.closePath();
    const menGeo = new THREE.ExtrudeGeometry(menShape, { depth: SLAB_D - 0.10, bevelEnabled: false });
    menGeo.translate(0, 0, -(SLAB_D - 0.10) * 0.5);
    const menMesh = new THREE.Mesh(menGeo, mats.llMeniscusGlow);
    menMesh.position.set(X_MIC - 0.50, Y_MIC, Z_MIC);
    mWaterGrp.add(menMesh);
  }
  register('ll_micro_aqueous_wedge', mWaterGrp, [4.5, 2.2, 0.8], { liquidMicroWet: true });

  // 30. 500x Non-Polar Phenyl-Siloxane Optical Oil Wedge & Repelled Boundary (LIVE SLIDING!)
  const mOilGrp = new THREE.Group();
  {
    const s = new THREE.Shape();
    s.moveTo(0.0, -0.45);
    s.quadraticCurveTo(1.55, 0.35, 3.45, 0.45);
    s.lineTo(3.45, -2.60);
    s.lineTo(0.0, -2.60);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, { depth: SLAB_D - 0.16, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, -(SLAB_D - 0.16) * 0.5);
    const oMesh = new THREE.Mesh(geo, mats.llOilLiquid);
    oMesh.position.set(X_MIC - 0.50, Y_MIC, Z_MIC);
    mOilGrp.add(oMesh);
  }
  register('ll_micro_oil_wedge', mOilGrp, [4.5, -1.6, 0.8], { liquidMicroWet: true });

  // 31. 500x Nanoscale Electric Double Layer (EDL, λ_D ≈ 3 nm) Solvated Na⁺ / Cl⁻ Ion Swarm (LIVE SLIDING!)
  const mEdlGrp = new THREE.Group();
  {
    const ionGeo = new THREE.SphereGeometry(0.155, 14, 12);
    // Dense monolayer of glowing ruby cations (Na⁺/Li⁺) crowding right along the fluoropolymer wall & triple-line wedge!
    for (let i = 0; i < 18; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const iy = Y_MIC + 0.02 + col * 0.42;
      const iz = Z_MIC - 1.55 + row * 1.55;
      const cation = new THREE.Mesh(ionGeo, mats.llIonCation);
      cation.position.set(X_MIC - 0.24, iy, iz);
      mEdlGrp.add(cation);
    }
    // Diffuse outer counter-ion cloud (cyan Cl⁻ anions + dispersed Na⁺ cations cleanly inside bulk water!)
    const bulkCoords = [
      [0.45, 0.56, -1.2], [0.55, 1.28, 0.2], [0.40, 1.98, 1.3],
      [1.15, 0.88, 1.1], [1.35, 1.68, -0.9], [1.95, 1.22, 0.4],
      [0.85, 0.64, 0.3], [2.25, 1.88, -0.5], [1.65, 2.08, 1.2]
    ];
    for (let j = 0; j < bulkCoords.length; j++) {
      const [bx, by, bz] = bulkCoords[j];
      const ion = new THREE.Mesh(ionGeo, j % 2 === 0 ? mats.llIonAnion : mats.llIonCation);
      ion.position.set(X_MIC - 0.20 + bx, Y_MIC + by, Z_MIC + bz);
      mEdlGrp.add(ion);
    }
  }
  register('ll_micro_edl_ions', mEdlGrp, [3.9, 1.5, 1.8], { liquidMicroWet: true });

  // 32. 500x Young-Lippmann Contact-Angle θ(V) & Maxwell Electrostatic Pulling Stress Arc!
  const mArcGrp = new THREE.Group();
  {
    // Sculptural contact-angle protractor arc marking exact θ(V) ≈ 65° between vertical wall (+90°) and rising meniscus (+25°)!
    const arcGeo = new THREE.TorusGeometry(0.88, 0.068, 12, 32, Math.PI * 0.36);
    const arcMesh = new THREE.Mesh(arcGeo, mats.llIonCation);
    arcMesh.position.set(X_MIC - 0.48, Y_MIC - 0.32, Z_MIC + SLAB_D * 0.5 + 0.14);
    arcMesh.rotation.z = 0.42;
    mArcGrp.add(arcMesh);

    // Downward Maxwell Electrostatic Pulling Vector Arrow (F_EW = ε₀ε_r V² / 2d) along the wall!
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.35, 12), mats.llIonCation);
    shaft.position.set(X_MIC - 0.42, Y_MIC - 1.12, Z_MIC + SLAB_D * 0.5 + 0.16);
    mArcGrp.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.44, 14), mats.llIonCation);
    tip.rotation.x = Math.PI;
    tip.position.set(X_MIC - 0.42, Y_MIC - 1.92, Z_MIC + SLAB_D * 0.5 + 0.16);
    mArcGrp.add(tip);

    // Clean insulated ceramic base plinth anchoring the 500x nano-section cleanly above the CAD grid!
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.35, 0.46, SLAB_D + 0.4), mats.ldCeramicHousing);
    plinth.position.set(X_MIC + 0.15, Y_MIC - 2.95, Z_MIC);
    mArcGrp.add(plinth);
  }
  register('ll_micro_maxwell_arc', mArcGrp, [5.0, -0.5, 2.4]);

  return {
    root,
    parts,
    gridY: -3.95,
    defaultCameraPos: new THREE.Vector3(25.5, 18.8, 35.5),
    defaultTarget: new THREE.Vector3(4.8, 0.4, 1.0),
    clipBounds: { x: 14.5, y: 8.5, z: 12.5 }
  };
}
