import * as THREE from 'three';

/**
 * Helper: Creates a solid 270-degree cutaway revolved part (open on front-right +X/+Z quadrant,
 * phiStart = PI/2, phiLen = 3*PI/2) WITH watertight solid radial cross-section end-cap faces!
 *
 * LatheGeometry vertex convention: x = r * sin(phi), z = r * cos(phi).
 * So phi = PI/2 lies on the +X half-plane (z = 0, x >= 0),
 * and phi = 2*PI (= 0) lies on the +Z half-plane (x = 0, z >= 0).
 */
function createSolidCutawayLathe(profilePts, mat, capMat = mat, segments = 48) {
  const grp = new THREE.Group();
  const latheGeo = new THREE.LatheGeometry(profilePts, segments, Math.PI * 0.5, Math.PI * 1.5);
  grp.add(new THREE.Mesh(latheGeo, mat));

  // Build exact 2D cross-section polygon for both radial cutaway planes (+X face and +Z face)
  const shape = new THREE.Shape();
  shape.moveTo(profilePts[0].x, profilePts[0].y);
  for (let i = 1; i < profilePts.length; i++) {
    shape.lineTo(profilePts[i].x, profilePts[i].y);
  }
  shape.closePath();

  const capGeo = new THREE.ShapeGeometry(shape);
  // Face 1: phi = PI/2 -> lies on (x >= 0, y, z = 0) facing +Z
  const capZ = new THREE.Mesh(capGeo, capMat);
  grp.add(capZ);

  // Face 2: phi = 0 -> lies on (x = 0, y, z >= 0) facing +X
  const capX = new THREE.Mesh(capGeo, capMat);
  capX.rotation.y = -Math.PI / 2;
  grp.add(capX);

  return grp;
}

/**
 * Helper: Creates an extruded horizontal blade lamina slab spanning [xMin, xMax] x [zMin, zMax]
 * at elevation [yBot, yTop] with circular clearance holes carved cleanly via THREE.Path.
 * Note: ExtrudeGeometry rotated -PI/2 around X maps shape (x, y) -> world (x, z_extrude, -y),
 * so world Z maps to shapeY = -z!
 */
function createBladeLamina(xMin, xMax, zMin, zMax, yBot, yTop, holes, mat) {
  const s = new THREE.Shape();
  const r = 0.25;
  const syMin = -zMax;
  const syMax = -zMin;

  s.moveTo(xMin + r, syMin);
  s.lineTo(xMax, syMin);
  s.lineTo(xMax, syMax);
  s.lineTo(xMin + r, syMax);
  s.quadraticCurveTo(xMin, syMax, xMin, syMax - r);
  s.lineTo(xMin, syMin + r);
  s.quadraticCurveTo(xMin, syMin, xMin + r, syMin);
  s.closePath();

  for (const h of holes) {
    // Only add hole if it lies inside [xMin, xMax]
    if (h.x - h.r > xMax - 0.05 || h.x + h.r < xMin + 0.05) continue;
    const p = new THREE.Path();
    p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true);
    s.holes.push(p);
  }

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: yTop - yBot,
    bevelEnabled: false,
    curveSegments: 32
  });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = yBot;
  return m;
}

/**
 * Phase 8: Extreme Sub-Micron Aperture Tribology, Metallurgy & Micro-Contact Dissection
 * Scale: 1 CAD unit = 10 μm (Microscope Cross-Section Diorama — 30 Independent Parts!)
 *
 * 5 Mechanically Unified Cross-Section Zones:
 * - Zone C (Top-Center): 140 μm Titanium Cam Rotor, Laser HAZ, 15 μm F-DLC Liner, SUS440C/TiN Cam Pin & Swaged Rivet
 * - Zone A (Right Blade): 30 μm Blade 7-Layer Nano-Metallurgy Staircase & < 5 μm Half-Etched Knife Edge
 * - Zone B (Bottom-Right): 12 μm Coined Anti-Stiction Dimple, Φ3 μm Hertz Spot, CNT-PTFE Film & Tier-2 Blade
 * - Zone D (Center-Left): Oilless Sintered Porous Bronze Bushing, 44 MoS₂/PTFE Lubricant Pockets & TiN Stator Pin
 * - Zone E (Far-Left & Front-Left): 90° Gothic-Arch V-Groove + Φ350 μm Y-TZP Ceramic Ball + Φ28 μm Self-Bonding VCM Wire Bundle
 */
export function buildIrisNanoAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'IrisNanoRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // Key shared physical coordinates (1 CAD unit = 10 μm)
  const X_BALL = -8.4;
  const Z_BALL = -0.2;
  const Y_BALL = 0.92;
  const R_BALL = 1.60;

  const X_PIV = -3.6;
  const Z_PIV = -0.2;

  const X_CAM = 2.1;
  const Z_CAM = -0.2;

  const X_DIMPLE = 5.4;
  const Z_DIMPLE = 0.30;

  const BLADE_Z_MIN = -2.45;
  const BLADE_Z_MAX = 1.95;

  // =========================================================================
  // GROUP 1: UPPER CAM ROTOR & PIERCED CAM SLOT INTERFACE (01-06)
  // =========================================================================

  // 01. Titanium/SUS 140 μm Cam Rotor with Front-Open Cutaway Pierced Cam Slot
  const camRotorGrp = new THREE.Group();
  {
    // U-shaped rotor block in X-Z leaving a pierced cam slot opening straight toward +Z!
    const s = new THREE.Shape();
    // Shape X = world X, Shape Y = -world Z
    const xL = -0.75, xR = 5.05;
    const zBack = -2.55, zFront = 1.95;
    const slotXL = X_CAM - 1.18; // +0.92
    const slotXR = X_CAM + 1.18; // +3.28
    const slotZBack = Z_CAM - 1.08; // -1.28

    s.moveTo(xL, -zFront);
    s.lineTo(slotXL, -zFront);
    s.lineTo(slotXL, -slotZBack);
    s.lineTo(slotXR, -slotZBack);
    s.lineTo(slotXR, -zFront);
    s.lineTo(xR, -zFront);
    s.lineTo(xR, -zBack);
    s.lineTo(xL, -zBack);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.42,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2
    });
    geo.rotateX(-Math.PI / 2);
    const rotorMesh = new THREE.Mesh(geo, mats.nanoTiRotor);
    rotorMesh.position.y = 2.82;
    camRotorGrp.add(rotorMesh);

    // Subtle top machined concentric guide grooves showing rotary motion direction
    for (const rOff of [-1.85, -1.55]) {
      const gr = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.04, 0.08), mats.susDarkInner);
      gr.position.set(2.15, 4.27, rOff);
      camRotorGrp.add(gr);
    }
  }
  register('in_cam_rotor_titanium', camRotorGrp, [0.4, 5.4, -0.6], { nanoCamRotor: true });

  // 02. Laser-Cut Kerf Heat-Affected Zone (HAZ) & Micro-Chamfered Slot Rim
  const hazGrp = new THREE.Group();
  {
    const slotXL = X_CAM - 1.18;
    const slotXR = X_CAM + 1.18;
    const slotZBack = Z_CAM - 1.08;
    const zFront = 1.95;
    const hazW = 0.14;
    const hazH = 1.48;
    const yMid = 3.53;

    // Left slot wall HAZ strip
    const lStrip = new THREE.Mesh(new THREE.BoxGeometry(hazW, hazH, zFront - slotZBack + 0.04), mats.nanoLaserHaz);
    lStrip.position.set(slotXL + hazW * 0.5, yMid, (slotZBack + zFront) * 0.5);
    hazGrp.add(lStrip);

    // Right slot wall HAZ strip
    const rStrip = new THREE.Mesh(new THREE.BoxGeometry(hazW, hazH, zFront - slotZBack + 0.04), mats.nanoLaserHaz);
    rStrip.position.set(slotXR - hazW * 0.5, yMid, (slotZBack + zFront) * 0.5);
    hazGrp.add(rStrip);

    // Back slot wall HAZ strip
    const bStrip = new THREE.Mesh(new THREE.BoxGeometry(slotXR - slotXL, hazH, hazW), mats.nanoLaserHaz);
    bStrip.position.set(X_CAM, yMid, slotZBack + hazW * 0.5);
    hazGrp.add(bStrip);

    // Top & bottom barrel-tumbled micro-chamfer bead strips outlining the laser edge
    for (const cy of [2.80, 4.26]) {
      const topL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, zFront - slotZBack + 0.06), mats.nanoLaserHaz);
      topL.position.set(slotXL + 0.06, cy, (slotZBack + zFront) * 0.5);
      hazGrp.add(topL);
      const topR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, zFront - slotZBack + 0.06), mats.nanoLaserHaz);
      topR.position.set(slotXR - 0.06, cy, (slotZBack + zFront) * 0.5);
      hazGrp.add(topR);
      const topB = new THREE.Mesh(new THREE.BoxGeometry(slotXR - slotXL, 0.06, 0.18), mats.nanoLaserHaz);
      topB.position.set(X_CAM, cy, slotZBack + 0.06);
      hazGrp.add(topB);
    }
  }
  register('in_cam_laser_haz', hazGrp, [0.4, 4.2, -0.4], { nanoCamRotor: true });

  // 03. 15 μm F-DLC / PTFE Low-Friction Cam Slot Wall Liner
  const slotLinerGrp = new THREE.Group();
  {
    const slotXL = X_CAM - 1.04;
    const slotXR = X_CAM + 1.04;
    const slotZBack = Z_CAM - 0.94;
    const zFront = 1.95;
    const linT = 0.16;
    const linH = 1.38;
    const yMid = 3.53;

    const lLin = new THREE.Mesh(new THREE.BoxGeometry(linT, linH, zFront - slotZBack), mats.irSlotLinerTeal);
    lLin.position.set(slotXL + linT * 0.5, yMid, (slotZBack + zFront) * 0.5);
    slotLinerGrp.add(lLin);

    const rLin = new THREE.Mesh(new THREE.BoxGeometry(linT, linH, zFront - slotZBack), mats.irSlotLinerTeal);
    rLin.position.set(slotXR - linT * 0.5, yMid, (slotZBack + zFront) * 0.5);
    slotLinerGrp.add(rLin);

    const bLin = new THREE.Mesh(new THREE.BoxGeometry(slotXR - slotXL, linH, linT), mats.irSlotLinerTeal);
    bLin.position.set(X_CAM, yMid, slotZBack + linT * 0.5);
    slotLinerGrp.add(bLin);
  }
  register('in_slot_fdlc_liner', slotLinerGrp, [0.4, 3.2, -0.2], { nanoCamRotor: true });

  // 04. Cam Pin Mirror TiN PVD Wear Shell (2 μm) + 5 μm Running Air-Gap Collar
  const camPinTinGrp = new THREE.Group();
  {
    const tinProfile = [
      new THREE.Vector2(0.64, 1.66),
      new THREE.Vector2(0.77, 1.66),
      new THREE.Vector2(0.77, 4.74),
      new THREE.Vector2(0.66, 4.90),
      new THREE.Vector2(0.64, 4.90)
    ];
    const tinShell = createSolidCutawayLathe(tinProfile, mats.nanoTinGold, mats.nanoTinGold, 48);
    tinShell.position.set(X_CAM, 0, Z_CAM);
    camPinTinGrp.add(tinShell);

    // Translucent cyan 5 μm running air-gap visualization collar between TiN shell and slot liner
    const gapProfile = [
      new THREE.Vector2(0.78, 2.82),
      new THREE.Vector2(0.88, 2.82),
      new THREE.Vector2(0.88, 4.24),
      new THREE.Vector2(0.78, 4.24)
    ];
    const gapCollar = createSolidCutawayLathe(gapProfile, mats.nanoClearanceCyan, mats.nanoClearanceCyan, 48);
    gapCollar.position.set(X_CAM, 0, Z_CAM);
    camPinTinGrp.add(gapCollar);
  }
  register('in_cam_pin_tin_shell', camPinTinGrp, [0.3, 2.6, 0.5], { nanoUpperBlade: true });

  // 05. Hardened SUS440C Cam Follower Pin Core (Φ240 μm — Solid 270° Cutaway)
  const camPinCoreGrp = new THREE.Group();
  {
    const coreProfile = [
      new THREE.Vector2(0.001, 0.52),
      new THREE.Vector2(0.64, 0.52),
      new THREE.Vector2(0.64, 1.38),
      // Stepped load-bearing flange shoulder seated atop the 30 μm aperture blade
      new THREE.Vector2(0.92, 1.38),
      new THREE.Vector2(0.92, 1.66),
      new THREE.Vector2(0.64, 1.66),
      new THREE.Vector2(0.64, 4.88),
      new THREE.Vector2(0.52, 5.02),
      new THREE.Vector2(0.001, 5.02)
    ];
    const pinCore = createSolidCutawayLathe(coreProfile, mats.nanoSwageSteel, mats.nanoSus304Core, 48);
    pinCore.position.set(X_CAM, 0, Z_CAM);
    camPinCoreGrp.add(pinCore);
  }
  register('in_cam_pin_440c_core', camPinCoreGrp, [0.3, 1.8, 0.8], { nanoUpperBlade: true });

  // 06. Micro-Spun Swaged Rivet Mushroom Head & 90° Countersink Flush Lock
  const swageGrp = new THREE.Group();
  {
    // Exact mushroom flare seated 100% flush inside blade underside (Y = +0.20 .. +0.58)
    const swageProfile = [
      new THREE.Vector2(0.001, 0.21),
      new THREE.Vector2(1.04, 0.21),
      new THREE.Vector2(1.06, 0.28),
      new THREE.Vector2(0.86, 0.44),
      new THREE.Vector2(0.64, 0.56),
      new THREE.Vector2(0.001, 0.56)
    ];
    const swageMesh = createSolidCutawayLathe(swageProfile, mats.nanoSwageSteel, mats.nanoLaserHaz, 48);
    swageMesh.position.set(X_CAM, 0, Z_CAM);
    swageGrp.add(swageMesh);

    // Subtle concentric plastic-flow orbital spin ring on underside
    const flowRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.025, 10, 36, Math.PI * 1.5), mats.nanoKnifeEdge);
    flowRing.rotation.x = Math.PI / 2;
    flowRing.rotation.z = Math.PI * 0.5;
    flowRing.position.set(X_CAM, 0.205, Z_CAM);
    swageGrp.add(flowRing);
  }
  register('in_swaged_rivet_head', swageGrp, [0.3, -0.7, 1.2], { nanoUpperBlade: true });

  // =========================================================================
  // GROUP 2: 30 μm APERTURE BLADE 7-LAYER NANO-METALLURGY & KNIFE EDGE (07-13)
  // =========================================================================
  // Precision carved holes in upper blade so bushings, cam pin & dimple never clip!
  const bladeHolesTop = [
    { x: X_PIV, z: Z_PIV, r: 1.94 },
    { x: X_CAM, z: Z_CAM, r: 0.68 },
    { x: X_DIMPLE, z: Z_DIMPLE, r: 0.88 }
  ];
  const bladeHolesBot = [
    { x: X_PIV, z: Z_PIV, r: 1.94 },
    { x: X_CAM, z: Z_CAM, r: 1.07 }, // 90° countersink clearance for flush swaged rivet head!
    { x: X_DIMPLE, z: Z_DIMPLE, r: 0.88 }
  ];

  // 07. Sub-Micron Anti-Glare Matte Micro-Texture Trap Patch (Ra = 0.3 μm)
  const mattePatchGrp = new THREE.Group();
  {
    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.04, 1.38), mats.nanoBlackOxide);
    basePlinth.position.set(5.45, 1.40, -1.52);
    mattePatchGrp.add(basePlinth);

    // 7 x 4 array of micro-pyramids trapping oblique stray photons
    const coneGeo = new THREE.ConeGeometry(0.145, 0.24, 4);
    coneGeo.rotateY(Math.PI / 4);
    for (let ix = 0; ix < 7; ix++) {
      for (let iz = 0; iz < 4; iz++) {
        const pyr = new THREE.Mesh(coneGeo, (ix + iz) % 2 === 0 ? mats.nanoBlackOxide : mats.nanoFdlcTop);
        pyr.position.set(4.42 + ix * 0.34, 1.53, -2.02 + iz * 0.33);
        mattePatchGrp.add(pyr);
      }
    }
  }
  register('in_matte_micro_texture', mattePatchGrp, [1.8, 3.6, -0.5], { nanoUpperBlade: true });

  // 08. Top 1.5 μm Fluorine-Doped F-DLC (a-C:H:F) Super-Hydrophobic Armor
  const fdlcTopGrp = new THREE.Group();
  fdlcTopGrp.add(createBladeLamina(-5.85, 7.25, BLADE_Z_MIN, BLADE_Z_MAX, 1.22, 1.38, bladeHolesTop, mats.nanoFdlcTop));
  register('in_fdlc_armor_top', fdlcTopGrp, [1.2, 2.7, 0.0], { nanoUpperBlade: true });

  // 09. 1.2 μm Matte Black Oxide / CrN Light-Absorbing Undercoat
  const crnGrp = new THREE.Group();
  crnGrp.add(createBladeLamina(-5.85, 7.82, BLADE_Z_MIN, BLADE_Z_MAX, 1.05, 1.22, bladeHolesTop, mats.nanoBlackOxide));
  register('in_black_oxide_crn', crnGrp, [1.4, 1.9, 0.0], { nanoUpperBlade: true });

  // 10. 0.15 μm Sputtered Cr/Ti Adhesion Anchor Nanolayer
  const crTiGrp = new THREE.Group();
  crTiGrp.add(createBladeLamina(-5.85, 8.38, BLADE_Z_MIN, BLADE_Z_MAX, 0.92, 1.05, bladeHolesTop, mats.nanoCrTiAnchor));
  register('in_cr_ti_adhesion', crTiGrp, [1.6, 1.1, 0.0], { nanoUpperBlade: true });

  // 11. 24 μm Cold-Rolled Austenitic SUS304H Stainless Foil Core
  const susCoreGrp = new THREE.Group();
  {
    susCoreGrp.add(createBladeLamina(-5.85, 8.95, BLADE_Z_MIN, BLADE_Z_MAX, 0.34, 0.92, bladeHolesTop, mats.nanoSus304Core));
    // Micro cold-rolling grain lamellae accents along the exposed front cross-section edge (+Z = BLADE_Z_MAX)
    for (const gy of [0.46, 0.63, 0.80]) {
      const grainLine = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.025, 0.02), mats.nanoKnifeEdge);
      grainLine.position.set(7.32, gy, BLADE_Z_MAX + 0.008);
      susCoreGrp.add(grainLine);
    }
  }
  register('in_sus304h_core', susCoreGrp, [1.0, 0.25, 0.0], { nanoUpperBlade: true });

  // 12. Chemical Half-Etched Double-Bevel < 5 μm Optical Knife Edge Tip
  const knifeGrp = new THREE.Group();
  {
    // Exact double-sided isotropic chemical etch concave meniscus taper from 30 μm down to < 5 μm!
    const ks = new THREE.Shape();
    ks.moveTo(8.95, 0.34);
    ks.quadraticCurveTo(9.82, 0.42, 10.82, 0.60); // Bottom chemical etch meniscus
    ks.lineTo(10.82, 0.66);                        // < 5 μm razor optical knife edge!
    ks.quadraticCurveTo(9.82, 0.84, 8.95, 0.92);  // Top chemical etch meniscus
    ks.closePath();

    const kGeo = new THREE.ExtrudeGeometry(ks, {
      depth: BLADE_Z_MAX - BLADE_Z_MIN,
      bevelEnabled: false,
      curveSegments: 24
    });
    const kMesh = new THREE.Mesh(kGeo, mats.nanoKnifeEdge);
    kMesh.position.z = BLADE_Z_MIN;
    knifeGrp.add(kMesh);

    // Subtle dark F-DLC micro-tip anti-glare bevel highlight strip right at the razor crest
    const tipLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.065, BLADE_Z_MAX - BLADE_Z_MIN + 0.01),
      mats.nanoFdlcTop
    );
    tipLip.position.set(10.81, 0.63, (BLADE_Z_MIN + BLADE_Z_MAX) * 0.5);
    knifeGrp.add(tipLip);
  }
  register('in_half_etched_knife', knifeGrp, [3.8, 0.35, 0.0], { nanoUpperBlade: true });

  // 13. Bottom 1.5 μm F-DLC Symmetrical Anti-Warp Sliding Coat
  const fdlcBotGrp = new THREE.Group();
  fdlcBotGrp.add(createBladeLamina(-5.85, 8.95, BLADE_Z_MIN, BLADE_Z_MAX, 0.20, 0.34, bladeHolesBot, mats.nanoFdlcBot));
  register('in_fdlc_armor_bot', fdlcBotGrp, [1.2, -0.75, 0.0], { nanoUpperBlade: true });

  // =========================================================================
  // GROUP 3: ANTI-STICTION DIMPLE, HERTZ POINT & CNT-PTFE SEPARATOR (14-18)
  // =========================================================================

  // 14. Coined 12 μm Anti-Stiction Embossed Micro-Dimple Dome (Solid 270° Sheet-Metal Section)
  const dimpleGrp = new THREE.Group();
  {
    // Realistic stamped sheet-metal dome: concave depression at top, convex smooth dome reaching Y = -0.62!
    const dimplePts = [];
    const steps = 18;
    // Outer wall from apex (r=0.005, y=-0.62) up to outer rim (r=0.92, y=0.24)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = 0.005 + 0.915 * t;
      const y = -0.62 + 0.86 * (t * t * (3 - 2 * t));
      dimplePts.push(new THREE.Vector2(r, y));
    }
    // Outer top lip up to top blade surface (r=0.92, y=1.36)
    dimplePts.push(new THREE.Vector2(0.92, 1.36));
    // Inner concave depression contour descending back down to inner floor (r=0.005, y=-0.06)
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = 0.005 + 0.78 * t;
      const y = -0.06 + 1.42 * (t * t * (3 - 2 * t));
      dimplePts.push(new THREE.Vector2(r, y));
    }
    const domeCut = createSolidCutawayLathe(dimplePts, mats.nanoFdlcTop, mats.nanoSus304Core, 48);
    domeCut.position.set(X_DIMPLE, 0, Z_DIMPLE);
    dimpleGrp.add(domeCut);
  }
  register('in_embossed_dimple_dome', dimpleGrp, [2.2, -0.35, 1.4], { nanoUpperBlade: true });

  // 15. Φ3 μm Hertzian Point-Contact Footprint & Micro-Stress Rings
  const hertzDimpleGrp = new THREE.Group();
  {
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.055, 32), mats.nanoHertzGlow);
    spot.position.set(X_DIMPLE, -0.635, Z_DIMPLE);
    hertzDimpleGrp.add(spot);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 10, 36), mats.nanoHertzGlow);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(X_DIMPLE, -0.635, Z_DIMPLE);
    hertzDimpleGrp.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.018, 10, 36), mats.nanoHertzGlow);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(X_DIMPLE, -0.635, Z_DIMPLE);
    hertzDimpleGrp.add(ring2);
  }
  register('in_dimple_hertz_spot', hertzDimpleGrp, [2.2, -1.25, 1.8], { nanoUpperBlade: true });

  // 16. 15 μm UHMW-PTFE Fluoropolymer Separator Film Matrix
  const ptfeGrp = new THREE.Group();
  {
    const ptfeSlab = createBladeLamina(-0.25, 9.35, BLADE_Z_MIN, BLADE_Z_MAX, -1.32, -0.66, [], mats.nanoPtfeTranslucent);
    ptfeGrp.add(ptfeSlab);

    // Crisp icy edge frame outline along the cutaway front face so the translucent film reads cleanly on white
    const frontEdge = new THREE.Mesh(new THREE.BoxGeometry(9.60, 0.66, 0.04), mats.apPtfeShim);
    frontEdge.position.set(4.55, -0.99, BLADE_Z_MAX - 0.02);
    ptfeGrp.add(frontEdge);
  }
  register('in_ptfe_matrix_film', ptfeGrp, [1.5, -2.0, 0.0]);

  // 17. Conductive Carbon Nanotube (CNT) Anti-Static Percolation Network (Embedded inside PTFE!)
  const cntGrp = new THREE.Group();
  {
    // 10 longitudinal sinuous CNT bundles + 8 transverse conductive cross-links embedded at Y = -0.99
    for (let i = 0; i < 8; i++) {
      const zBase = BLADE_Z_MIN + 0.35 + i * 0.54;
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const u = k / 10;
        const x = 0.05 + u * 9.0;
        const z = zBase + Math.sin(u * Math.PI * 3 + i * 1.1) * 0.22;
        const y = -0.99 + Math.cos(u * Math.PI * 4 + i * 0.9) * 0.16;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      cntGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.036, 7, false), mats.nanoCntFilament));
    }
    for (let j = 0; j < 7; j++) {
      const xBase = 0.75 + j * 1.32;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        const z = BLADE_Z_MIN + 0.22 + u * (BLADE_Z_MAX - BLADE_Z_MIN - 0.44);
        const x = xBase + Math.cos(u * Math.PI * 2 + j) * 0.24;
        const y = -0.99 + Math.sin(u * Math.PI * 3 + j) * 0.15;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      cntGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.032, 7, false), mats.nanoCntFilament));
    }
    // Electrostatic dissipation junction nodes
    const nodeGeo = new THREE.SphereGeometry(0.068, 10, 10);
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < 3; i++) {
        const node = new THREE.Mesh(nodeGeo, mats.lensVentCyan);
        node.position.set(0.85 + j * 1.30, -0.99 + (i - 1) * 0.10, -1.6 + i * 1.55);
        cntGrp.add(node);
      }
    }
  }
  register('in_cnt_antistatic_net', cntGrp, [1.5, -2.6, 0.5]);

  // 18. Lower Tier-2 Adjacent Aperture Blade (Counter-Sliding 3-Ply F-DLC / SUS304H / F-DLC)
  const lowerBladeGrp = new THREE.Group();
  {
    // Top F-DLC sliding face
    lowerBladeGrp.add(createBladeLamina(-0.40, 9.65, BLADE_Z_MIN, BLADE_Z_MAX, -1.56, -1.42, [], mats.nanoFdlcTop));
    // SUS304H core
    lowerBladeGrp.add(createBladeLamina(-0.40, 9.65, BLADE_Z_MIN, BLADE_Z_MAX, -2.26, -1.56, [], mats.nanoSus304Core));
    // Bottom F-DLC face
    lowerBladeGrp.add(createBladeLamina(-0.40, 9.65, BLADE_Z_MIN, BLADE_Z_MAX, -2.42, -2.26, [], mats.nanoFdlcBot));
  }
  register('in_lower_tier_blade', lowerBladeGrp, [1.5, -4.0, 0.0], { nanoLowerBlade: true });

  // =========================================================================
  // GROUP 4: OILLESS SINTERED BRONZE PIVOT BEARING & TiN PIN (19-23)
  // =========================================================================

  // 19. Outer Press-Fit Interference Ring & Inner 4 μm Oilless Running Clearance Layer
  const pressFitGrp = new THREE.Group();
  {
    // Inner 4 μm running gap between TiN pivot pin (r=0.92) and bronze bushing bore (r=1.02)
    const innerGapProfile = [
      new THREE.Vector2(0.92, -0.55),
      new THREE.Vector2(1.02, -0.55),
      new THREE.Vector2(1.02, 1.86),
      new THREE.Vector2(0.92, 1.86)
    ];
    const innerGap = createSolidCutawayLathe(innerGapProfile, mats.nanoClearanceCyan, mats.nanoClearanceCyan, 48);
    innerGap.position.set(X_PIV, 0, Z_PIV);
    pressFitGrp.add(innerGap);

    // Outer interference press-fit collar locking bushing into blade pivot bore (r = 1.82..1.94)
    const outerPressProfile = [
      new THREE.Vector2(1.82, 0.20),
      new THREE.Vector2(1.94, 0.20),
      new THREE.Vector2(1.94, 1.38),
      new THREE.Vector2(1.82, 1.38)
    ];
    const outerPress = createSolidCutawayLathe(outerPressProfile, mats.nanoClearanceCyan, mats.lensVentCyan, 48);
    outerPress.position.set(X_PIV, 0, Z_PIV);
    pressFitGrp.add(outerPress);
  }
  register('in_pressfit_interference', pressFitGrp, [-1.4, 2.2, 0.6]);

  // 20. Flanged Sintered Porous Bronze Oilless Bushing Body (Solid 270° Cutaway)
  const bronzeBushGrp = new THREE.Group();
  {
    const bushProfile = [
      new THREE.Vector2(1.02, -0.55),
      new THREE.Vector2(1.82, -0.55),
      new THREE.Vector2(1.82, 1.44),
      new THREE.Vector2(2.30, 1.44), // Top thrust retention flange!
      new THREE.Vector2(2.30, 1.86),
      new THREE.Vector2(1.02, 1.86)
    ];
    const bushMesh = createSolidCutawayLathe(bushProfile, mats.nanoPorousBronze, mats.nanoPorousBronze, 52);
    bushMesh.position.set(X_PIV, 0, Z_PIV);
    bronzeBushGrp.add(bushMesh);
  }
  register('in_porous_bronze_bush', bronzeBushGrp, [-1.6, 0.9, 0.5]);

  // 21. Vacuum-Impregnated MoS₂ / PTFE Solid Lubricant Pockets inside Sintered Bronze Pores
  const mos2Grp = new THREE.Group();
  {
    const poreGeo = new THREE.SphereGeometry(0.095, 10, 10);
    // 1. Pockets visibly exposed on both radial cross-section cut faces (+X wall at z=Z_PIV, +Z wall at x=X_PIV)
    const wallCoords = [
      [1.22, -0.32], [1.56, -0.25], [1.34, 0.08], [1.66, 0.22],
      [1.20, 0.45],  [1.54, 0.62],  [1.28, 0.95], [1.66, 1.05],
      [1.22, 1.32],  [1.56, 1.56],  [1.98, 1.64], [2.14, 1.66]
    ];
    for (const [rr, yy] of wallCoords) {
      // Exposed along phi = PI/2 (+X face, z = Z_PIV)
      const p1 = new THREE.Mesh(poreGeo, mats.nanoMos2Lube);
      p1.scale.set(1.15, 0.85, 0.55);
      p1.position.set(X_PIV + rr, yy, Z_PIV + 0.015);
      mos2Grp.add(p1);

      // Exposed along phi = 0 (+Z face, x = X_PIV)
      const p2 = new THREE.Mesh(poreGeo, mats.nanoMos2Lube);
      p2.scale.set(0.55, 0.85, 1.15);
      p2.position.set(X_PIV + 0.015, yy, Z_PIV + rr);
      mos2Grp.add(p2);
    }

    // 2. Solid lubricant transfer pockets lining the inner bearing bore (r = 1.02, 270° arc)
    const boreGeo = new THREE.SphereGeometry(0.082, 10, 10);
    for (let k = 0; k < 20; k++) {
      const phi = Math.PI * 0.58 + (k / 19) * Math.PI * 1.34;
      const yy = -0.30 + ((k * 37) % 20) * 0.105;
      const bp = new THREE.Mesh(boreGeo, mats.nanoMos2Lube);
      bp.position.set(X_PIV + Math.sin(phi) * 1.02, yy, Z_PIV + Math.cos(phi) * 1.02);
      mos2Grp.add(bp);
    }
  }
  register('in_solid_mos2_pockets', mos2Grp, [-1.6, 0.2, 1.5]);

  // 22. Pivot Pin Golden TiN PVD Wear Coating Shell (2.5 μm)
  const pivTinGrp = new THREE.Group();
  {
    const pivTinProfile = [
      new THREE.Vector2(0.78, -1.88),
      new THREE.Vector2(0.92, -1.88),
      new THREE.Vector2(0.92, 2.26),
      new THREE.Vector2(0.68, 2.54),
      new THREE.Vector2(0.58, 2.54),
      new THREE.Vector2(0.78, 2.28)
    ];
    const pivTin = createSolidCutawayLathe(pivTinProfile, mats.nanoTinGold, mats.nanoTinGold, 48);
    pivTin.position.set(X_PIV, 0, Z_PIV);
    pivTinGrp.add(pivTin);
  }
  register('in_pivot_pin_tin_coat', pivTinGrp, [-1.6, -1.3, 0.4]);

  // 23. Stator-Fixed Hardened SUS440C Pivot Pin Core (Φ320 μm + Press-Fit Stator Base)
  const pivCoreGrp = new THREE.Group();
  {
    const pivCoreProfile = [
      new THREE.Vector2(0.001, -2.45),
      new THREE.Vector2(1.75, -2.45), // Stator base mounting flange
      new THREE.Vector2(1.75, -1.88),
      new THREE.Vector2(0.78, -1.88),
      new THREE.Vector2(0.78, 2.28),
      new THREE.Vector2(0.58, 2.54),  // 30° automated assembly lead-in chamfer!
      new THREE.Vector2(0.001, 2.54)
    ];
    const pivCore = createSolidCutawayLathe(pivCoreProfile, mats.nanoSwageSteel, mats.nanoSus304Core, 48);
    pivCore.position.set(X_PIV, 0, Z_PIV);
    pivCoreGrp.add(pivCore);
  }
  register('in_pivot_pin_440c', pivCoreGrp, [-1.6, -3.2, 0.0]);

  // =========================================================================
  // GROUP 5: GOTHIC-ARCH CERAMIC BALL CONTACT & Φ28 μm VCM WIRE BUNDLE (24-30)
  // =========================================================================
  // Ball centered at (X_BALL = -8.4, Y_BALL = 0.92, Z_BALL = -0.2), R_BALL = 1.60.
  // Exact ±45° Hertzian tangent points: dx = ±1.131, dy = ±1.131 -> yTop = +2.051, yBot = -0.211!
  const RACE_Z_LEN = 4.6;

  // 24. Upper Moving Hardened SUS440C 90° Gothic-Arch V-Groove Race
  const upperRaceGrp = new THREE.Group();
  {
    // 2D X-Y cross-section facing directly toward +Z viewer!
    // Groove ceiling opens downward with two gentle Gothic-arch curves kissing (±1.131, +2.051)
    const s = new THREE.Shape();
    s.moveTo(-2.25, 4.30);
    s.lineTo(2.25, 4.30);
    s.lineTo(2.25, 1.82);
    s.lineTo(1.56, 1.82);
    // Right Gothic-arch curved raceway wall passing right through (+1.13, +2.05) up to apex (0, +2.78)
    s.quadraticCurveTo(0.88, 2.26, 0.0, 2.78);
    // Left Gothic-arch curved raceway wall descending symmetrically through (-1.13, +2.05)
    s.quadraticCurveTo(-0.88, 2.26, -1.56, 1.82);
    s.lineTo(-2.25, 1.82);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: RACE_Z_LEN,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 24
    });
    const m = new THREE.Mesh(geo, mats.nanoGothicSteel);
    m.position.set(X_BALL, 0, Z_BALL - RACE_Z_LEN * 0.5);
    upperRaceGrp.add(m);
  }
  register('in_upper_gothic_race', upperRaceGrp, [-3.4, 4.6, -0.5], { nanoUpperRace: true });

  // 25. BeCu Non-Magnetic Ball Retainer Cage Pocket Lip
  const cageGrp = new THREE.Group();
  {
    // Equator pocket ring open cleanly toward front-right (+X/+Z) so ceramic ball cutaway stays 100% unobstructed!
    const cageProfile = [
      new THREE.Vector2(R_BALL + 0.08, Y_BALL - 0.24),
      new THREE.Vector2(R_BALL + 0.36, Y_BALL - 0.24),
      new THREE.Vector2(R_BALL + 0.36, Y_BALL + 0.24),
      new THREE.Vector2(R_BALL + 0.08, Y_BALL + 0.24)
    ];
    const pocket = createSolidCutawayLathe(cageProfile, mats.beCuSpring, mats.beCuSpring, 48);
    pocket.position.set(X_BALL, 0, Z_BALL);
    cageGrp.add(pocket);

    // Rear/side carrier wing strips connecting to adjacent ball pockets in the full aperture ring
    const wingBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.30, 1.05), mats.beCuSpring);
    wingBack.position.set(X_BALL - R_BALL - 0.20, Y_BALL, Z_BALL - 1.95);
    cageGrp.add(wingBack);
    const wingFront = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.30, 0.90), mats.beCuSpring);
    wingFront.position.set(X_BALL - R_BALL - 0.20, Y_BALL, Z_BALL + 1.82);
    cageGrp.add(wingFront);
  }
  register('in_becu_cage_pocket', cageGrp, [-3.8, 1.2, 0.8], { nanoBallFollow: true });

  // 26. Y-TZP Tetragonal Zirconia Ceramic Ball (Φ350 μm — 270° Quarter-Cutaway Revealing Micro-Grain Core!)
  const ballGrp = new THREE.Group();
  {
    const spherePts = [];
    const nSeg = 32;
    for (let i = 0; i <= nSeg; i++) {
      const th = -Math.PI * 0.5 + (i / nSeg) * Math.PI;
      spherePts.push(new THREE.Vector2(Math.max(0.001, Math.cos(th) * R_BALL), Math.sin(th) * R_BALL));
    }
    const ballCut = createSolidCutawayLathe(spherePts, mats.ceramicZirconia, mats.nanoZirconiaCore, 52);
    ballGrp.add(ballCut);

    // Subtle sintered micro-crystal grain texture beads on the cutaway inner planes
    const grainGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const grainSpots = [
      [0.42, 0.35], [0.86, 0.20], [0.55, -0.45], [1.05, -0.35], [0.35, -0.82], [0.75, 0.72]
    ];
    for (const [gr, gy] of grainSpots) {
      const g1 = new THREE.Mesh(grainGeo, mats.ceramicZirconia);
      g1.scale.set(1, 1, 0.3);
      g1.position.set(gr, gy, 0.015);
      ballGrp.add(g1);

      const g2 = new THREE.Mesh(grainGeo, mats.ceramicZirconia);
      g2.scale.set(0.3, 1, 1);
      g2.position.set(0.015, gy, gr);
      ballGrp.add(g2);
    }
  }
  ballGrp.position.set(X_BALL, Y_BALL, Z_BALL);
  register('in_ytzp_ceramic_ball', ballGrp, [-3.4, 0.3, 0.4], { nanoBall: true });

  // 27. 4-Point Hertzian Elliptical Contact Stress Patches (Upper ±45° & Lower ±45°)
  const hertzBallGrp = new THREE.Group();
  {
    const d45 = R_BALL * Math.SQRT1_2; // 1.131
    const contactCoords = [
      { sx: -1, sy: 1, rotZ: Math.PI / 4 },   // Upper-left contact
      { sx: 1, sy: 1, rotZ: -Math.PI / 4 },   // Upper-right contact
      { sx: -1, sy: -1, rotZ: -Math.PI / 4 }, // Lower-left contact
      { sx: 1, sy: -1, rotZ: Math.PI / 4 }    // Lower-right contact
    ];
    for (const c of contactCoords) {
      const patch = new THREE.Group();
      // Elliptical Hertzian contact lens elongated along the race groove (Z)
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.08, 24), mats.nanoHertzGlow);
      disc.scale.set(0.75, 1.0, 1.55);
      patch.add(disc);

      // Subsurface von Mises stress contour halo
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.032, 10, 28), mats.nanoHertzGlow);
      halo.rotation.x = Math.PI / 2;
      halo.scale.set(0.78, 1.48, 1.0);
      patch.add(halo);

      patch.position.set(X_BALL + c.sx * d45, Y_BALL + c.sy * d45, Z_BALL);
      patch.rotation.z = c.rotZ;
      hertzBallGrp.add(patch);
    }
  }
  register('in_hertz_contact_zones', hertzBallGrp, [-3.4, -0.5, 1.6], { nanoBallFollow: true });

  // 28. Lower Fixed SUS440C 90° Gothic-Arch V-Groove Race & Magnetic Preload Yoke Base
  const lowerRaceGrp = new THREE.Group();
  {
    const s = new THREE.Shape();
    s.moveTo(-2.25, -2.42);
    s.lineTo(2.25, -2.42);
    s.lineTo(2.25, 0.02);
    s.lineTo(1.56, 0.02);
    // Right lower Gothic-arch curved raceway passing through (+1.13, -0.21) down to apex (0, -0.94)
    s.quadraticCurveTo(0.88, -0.42, 0.0, -0.94);
    // Left lower Gothic-arch curved raceway ascending through (-1.13, -0.21)
    s.quadraticCurveTo(-0.88, -0.42, -1.56, 0.02);
    s.lineTo(-2.25, 0.02);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: RACE_Z_LEN,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 24
    });
    const m = new THREE.Mesh(geo, mats.nanoGothicSteel);
    m.position.set(X_BALL, 0, Z_BALL - RACE_Z_LEN * 0.5);
    lowerRaceGrp.add(m);

    // Embedded Permalloy magnetic preload flux attractor plate at base of lower race
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.34, RACE_Z_LEN - 0.12), mats.yokePermalloy);
    yoke.position.set(X_BALL, -2.58, Z_BALL);
    lowerRaceGrp.add(yoke);
  }
  register('in_lower_gothic_race', lowerRaceGrp, [-3.4, -3.6, -0.5]);

  // 29 & 30. Front-Left Self-Bonding Φ28 μm VCM Coil Wire Bundle (3×3 Hexagonal Close-Packed Cutaway!)
  // Positioned cleanly in front of Zone E1/D: X ∈ [-10.0, -3.2], Z ∈ [+3.5, +5.8], Y ∈ [-2.35, -0.15]
  const WIRE_PITCH_Z = 0.80;
  const WIRE_PITCH_Y = 0.70;
  const WIRE_CENTER_Y = -1.22;
  const WIRE_CENTER_Z = 4.68;
  const wireCenters = [];
  for (let row = -1; row <= 1; row++) {
    const zStagger = row === 0 ? 0.40 : 0.0; // Authentic hexagonal close-packed (HCP) honeycomb stacking!
    for (let col = -1; col <= 1; col++) {
      wireCenters.push({
        y: WIRE_CENTER_Y + row * WIRE_PITCH_Y,
        z: WIRE_CENTER_Z + col * WIRE_PITCH_Z + zStagger - 0.13
      });
    }
  }

  // 29. Dual-Coat Jacket: 2.5 μm UEW Polyurethane Enamel Insulation + 2.0 μm SB Thermoplastic Self-Bonding Fused Adhesive
  const wireCoatGrp = new THREE.Group();
  {
    const uewLen = 5.45; // X = -10.0 .. -4.55
    const sbLen = 4.25;  // X = -10.0 .. -5.75 (stepped telescopic cutaway peel-back!)

    for (const wc of wireCenters) {
      // Inner UEW polyurethane electrical insulation sleeve (hollow tube around bare Cu core)
      const uewPts = [
        new THREE.Vector2(0.252, 0),
        new THREE.Vector2(0.328, 0),
        new THREE.Vector2(0.328, uewLen),
        new THREE.Vector2(0.252, uewLen),
        new THREE.Vector2(0.252, 0)
      ];
      const uewGeo = new THREE.LatheGeometry(uewPts, 24);
      uewGeo.rotateZ(-Math.PI / 2);
      const uewMesh = new THREE.Mesh(uewGeo, mats.nanoUewEnamel);
      uewMesh.position.set(-10.0, wc.y, wc.z);
      wireCoatGrp.add(uewMesh);

      // Outer SB thermoplastic polyamide self-bonding jacket
      const sbPts = [
        new THREE.Vector2(0.330, 0),
        new THREE.Vector2(0.398, 0),
        new THREE.Vector2(0.398, sbLen),
        new THREE.Vector2(0.330, sbLen),
        new THREE.Vector2(0.330, 0)
      ];
      const sbGeo = new THREE.LatheGeometry(sbPts, 24);
      sbGeo.rotateZ(-Math.PI / 2);
      const sbMesh = new THREE.Mesh(sbGeo, mats.nanoSelfBondPoly);
      sbMesh.position.set(-10.0, wc.y, wc.z);
      wireCoatGrp.add(sbMesh);
    }

    // Fused interstitial thermoplastic self-bonding menisci bridging every touching wire pair (bobbin-less glue matrix!)
    for (let a = 0; a < wireCenters.length; a++) {
      for (let b = a + 1; b < wireCenters.length; b++) {
        const dy = wireCenters[b].y - wireCenters[a].y;
        const dz = wireCenters[b].z - wireCenters[a].z;
        const dist = Math.hypot(dy, dz);
        if (dist < 0.86) {
          const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(sbLen - 0.04, 0.22, 0.22),
            mats.nanoSelfBondPoly
          );
          bridge.position.set(
            -10.0 + sbLen * 0.5,
            (wireCenters[a].y + wireCenters[b].y) * 0.5,
            (wireCenters[a].z + wireCenters[b].z) * 0.5
          );
          bridge.rotation.x = Math.atan2(dy, dz);
          wireCoatGrp.add(bridge);
        }
      }
    }
  }
  register('in_vcm_wire_enamel_bond', wireCoatGrp, [-2.4, -0.4, 3.8]);

  // 30. Φ28 μm Electrolytic Oxygen-Free Copper (Cu ≥ 99.95%) Conductor Core Bundle
  const wireCuGrp = new THREE.Group();
  {
    const cuLen = 6.65; // X = -10.0 .. -3.35 (protrudes proud +1.20 past UEW coat so bare copper gleams!)
    const cuGeo = new THREE.CylinderGeometry(0.248, 0.248, cuLen, 24);
    cuGeo.rotateZ(-Math.PI / 2);
    const capRingGeo = new THREE.TorusGeometry(0.16, 0.022, 8, 20);
    capRingGeo.rotateY(Math.PI / 2);

    for (const wc of wireCenters) {
      const cu = new THREE.Mesh(cuGeo, mats.nanoOfcCopper);
      cu.position.set(-10.0 + cuLen * 0.5, wc.y, wc.z);
      wireCuGrp.add(cu);

      // Fresh micro-sectioned bright crystalline end face accent
      const ring = new THREE.Mesh(capRingGeo, mats.goldBond);
      ring.position.set(-10.0 + cuLen + 0.005, wc.y, wc.z);
      wireCuGrp.add(ring);
    }
  }
  register('in_vcm_wire_cu_core', wireCuGrp, [-1.4, -1.6, 4.6]);

  return {
    root,
    parts,
    gridY: -3.25,
    defaultCameraPos: new THREE.Vector3(21.5, 16.5, 31.5),
    defaultTarget: new THREE.Vector3(4.2, 0.25, 0.65),
    clipBounds: { x: 12.5, y: 7.5, z: 7.5 }
  };
}
