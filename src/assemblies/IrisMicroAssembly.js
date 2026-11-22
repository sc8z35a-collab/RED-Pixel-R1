import * as THREE from 'three';

/**
 * Helper to create a cutaway annular ring open toward (+X, +Z) default camera.
 */
function createCutawayRing(rIn, rOut, height, mat, phiStart = Math.PI * 0.62, phiLen = Math.PI * 1.28) {
  const pts = [
    new THREE.Vector2(rIn, -height / 2),
    new THREE.Vector2(rOut, -height / 2),
    new THREE.Vector2(rOut, height / 2),
    new THREE.Vector2(rIn, height / 2),
    new THREE.Vector2(rIn, -height / 2)
  ];
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 64, phiStart, phiLen), mat);
}

/**
 * Computes exact spiral cam slot centerline points in cam rotor local shape XY
 * from the exact kinematics of a blade pivoted at R_PIVOT with cam pin at (PIN_X, PIN_Z).
 */
function computeSpiralSlotPoints(aBlade, rPivot, pinX, pinZ, swingMin, swingMax, camMin, camMax, steps = 14) {
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const swing = swingMin + u * (swingMax - swingMin);
    const camRot = camMin + u * (camMax - camMin);
    const th = -aBlade + swing;
    const wx = rPivot * Math.cos(aBlade) + pinX * Math.cos(th) + pinZ * Math.sin(th);
    const wz = rPivot * Math.sin(aBlade) - pinX * Math.sin(th) + pinZ * Math.cos(th);
    // Transform world (wx, wz) into cam rotor local frame (rotated by -camRot around Y)
    const lx = wx * Math.cos(-camRot) + wz * Math.sin(-camRot);
    const lz = -wx * Math.sin(-camRot) + wz * Math.cos(-camRot);
    // ExtrudeGeometry rotated -PI/2 around X maps shape (x, y) -> world (x, 0, -y), so shapeY = -lz
    pts.push(new THREE.Vector2(lx, -lz));
  }
  return pts;
}

/**
 * Expands a centerline polyline into an offset closed polygon path (used for both pierced slot holes and slot liners!).
 */
function buildOffsetCapsulePts(trackPts, halfW, endExt = 0.28) {
  const leftSide = [];
  const rightSide = [];
  for (let i = 0; i < trackPts.length; i++) {
    const pPrev = trackPts[Math.max(0, i - 1)];
    const pNext = trackPts[Math.min(trackPts.length - 1, i + 1)];
    const dir = pNext.clone().sub(pPrev).normalize();
    const perp = new THREE.Vector2(-dir.y, dir.x);
    leftSide.push(trackPts[i].clone().addScaledVector(perp, halfW));
    rightSide.push(trackPts[i].clone().addScaledVector(perp, -halfW));
  }
  const dStart = trackPts[1].clone().sub(trackPts[0]).normalize();
  const dEnd = trackPts[trackPts.length - 1].clone().sub(trackPts[trackPts.length - 2]).normalize();
  const startCap = trackPts[0].clone().addScaledVector(dStart, -endExt);
  const endCap = trackPts[trackPts.length - 1].clone().addScaledVector(dEnd, endExt);
  return [startCap, ...leftSide, endCap, ...rightSide.reverse()];
}

/**
 * Sculpted 4x-magnified variable aperture blade geometry (pivot bore centered at local (0, 0)).
 */
function createMicroBladeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.24, -0.80);
  s.quadraticCurveTo(0.46, -1.36, 1.36, -0.32);
  s.quadraticCurveTo(1.80, 1.75, 1.50, 4.05);
  s.quadraticCurveTo(1.10, 7.10, -2.14, 10.08);
  s.lineTo(-3.84, 9.82);
  // Inner optical crescent curve
  s.quadraticCurveTo(-2.92, 5.40, -1.72, 0.72);
  s.quadraticCurveTo(-1.66, -0.24, -1.24, -0.80);
  s.closePath();

  const pivotHole = new THREE.Path();
  pivotHole.absarc(0, 0, 0.44, 0, Math.PI * 2, true);
  s.holes.push(pivotHole);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 1
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Separate razor-sharp beveled optical knife-edge ribbon hugging the exact inner curve of a blade!
 */
function createKnifeEdgeGeometry() {
  const curve = new THREE.QuadraticBezierCurve(
    new THREE.Vector2(-1.72, 0.72),
    new THREE.Vector2(-2.92, 5.40),
    new THREE.Vector2(-3.84, 9.82)
  );
  const pts = curve.getPoints(18);
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  for (let i = pts.length - 1; i >= 0; i--) s.lineTo(pts[i].x + 0.26, pts[i].y);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.075, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Builds the EXTREME Phase 7 Micron-Level Variable Aperture Mechanism Dissection:
 * 32 Ultra-Granular Independent Parts (4x Watchmaker Magnified Scale: 1 unit = 0.25 mm)
 * - Balanced Dual-VCM (-X/+X) Pure-Couple Rotary Drive + Differential Dual Hall/TMR
 * - 3-Tier Staggered 6-Blade Pairs (#1/#4, #2/#5, #3/#6) + Separate Knife-Edges + 24 Anti-Stiction Micro-Dimples
 * - 6 Swaged Cam Pins + 6 Flanged TiN Pivot Bushings + 2x 15um PTFE Interleaving Shims
 * - Real Pierced 6-Slot Spiral Cam Rotor + Low-Friction Teal Slot Liners + Upper/Lower V-Groove Races
 * - 6 Rolling ZrO2 Ceramic Balls + 3 BeCu Retainer Cages + BeCu Anti-Backlash Torsion Flexures
 * - Zero-Power Magnetic Detent + Quad Elastomer Hard Stops + Dust-Trap Adhesive Gel + Laser Welds + PID ASIC + NTC + EEPROM!
 */
export function buildIrisMicroAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const register = (id, group, explodeVec, opts = {}) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      isMicroIrisCam: Boolean(opts.isMicroIrisCam),
      isMicroIrisBalls: Boolean(opts.isMicroIrisBalls)
    });
    return group;
  };

  const CUT_START = Math.PI * 0.65;
  const CUT_LEN = Math.PI * 1.24;

  // Exact Master Kinematic Constants (4x Watchmaker Scale)
  const R_PIVOT = 9.40;
  const PIN_X = 0.72;
  const PIN_Z = -2.86;
  const SWING_MIN = 0.03;    // f/1.42 wide open (r ≈ 7.0)
  const SWING_MAX = 0.70;    // f/4.0 stopped down (r ≈ 2.85)
  const SWING_REST = 0.37;   // crisp mid-stopped hexagon on load
  const CAM_ROT_MIN = 0.16;  // rotor Y rotation at f/1.42
  const CAM_ROT_MAX = -0.22; // rotor Y rotation at f/4.0 (21.8° sweep)
  const CAM_ROT_REST = (CAM_ROT_MIN + CAM_ROT_MAX) * 0.5;

  // Exact 3-Tier Blade Y Elevations (zero clipping, clear vertical stagger!)
  const TIER_Y = [0.64, 0.28, -0.08]; // Tier 1 (#1/#4), Tier 2 (#2/#5), Tier 3 (#3/#6)
  const BLADE_TIER_FOR_INDEX = [0, 1, 2, 0, 1, 2]; // idx 0,3 -> T1; 1,4 -> T2; 2,5 -> T3

  // =========================================================================
  // 01. TOP PERMALLOY EMI SHIELD & DUST CAPSULE LID (Cutaway on Front +Z)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 2.92;

    const topPlate = createCutawayRing(7.45, 12.65, 0.22, mats.susDarkInner, CUT_START, CUT_LEN);
    const outerSkirt = createCutawayRing(12.35, 12.65, 0.78, mats.susDarkInner, CUT_START, CUT_LEN);
    outerSkirt.position.y = -0.32;
    const innerKnife = createCutawayRing(7.15, 7.55, 0.09, mats.lensEdgeBlack, CUT_START, CUT_LEN);
    innerKnife.position.y = -0.04;

    // Rear-half actuator bay protection hoods over -X and +X rotary magnets
    const leftHood = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 4.2), mats.susDarkInner);
    leftHood.position.set(-14.2, 0, -1.9);
    const rightHood = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 4.2), mats.susDarkInner);
    rightHood.position.set(14.2, 0, -1.9);

    g.add(topPlate, outerSkirt, innerKnife, leftHood, rightHood);
    register('ir_top_emi_cap', g, [0, 9.6, 0]);
  }

  // =========================================================================
  // 02. 6-POINT YAG LASER MICRO SPOT WELDS & ALIGNMENT DOWEL PINS
  // =========================================================================
  {
    const g = new THREE.Group();

    const weldAngles = [0.42, 1.48, 2.52, 3.56, 4.62, 5.66];
    for (const a of weldAngles) {
      const wx = Math.cos(a) * 12.68;
      const wz = Math.sin(a) * 12.68;

      // Vertical alignment dowel pin bridging baseplate to top cover
      const dowel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.35, 14), mats.periHardenedRail);
      dowel.position.set(wx, 1.24, wz);
      // Glowing laser spot-weld bead tab on perimeter seam
      const weldTab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 0.56), mats.irLaserWeld);
      weldTab.position.set(wx, 2.74, wz);
      weldTab.rotation.y = -a;
      const weldBead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), mats.irLaserWeld);
      weldBead.scale.set(1.2, 0.55, 1.2);
      weldBead.position.set(wx, 2.94, wz);
      g.add(dowel, weldTab, weldBead);
    }

    register('ir_laser_spot_welds', g, [0, 8.2, 0]);
  }

  // =========================================================================
  // 03. ADHESIVE DUST-TRAP SILICONE GEL RING (Particle-Catcher Strip!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 2.66;

    const gelRing = createCutawayRing(11.65, 12.22, 0.24, mats.irDustTrapGel, CUT_START, CUT_LEN);
    g.add(gelRing);
    register('ir_dust_trap_gel', g, [0, 7.2, 0]);
  }

  // =========================================================================
  // 04. UPPER LOW-FRICTION PTFE THRUST WEAR RING (Face-Down Protection, Cutaway)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 2.42;

    // Slim outer PTFE thrust wear pad matching lid cutaway so the 6 teal-lined spiral cam slots gleam unobstructed!
    const ptfeTop = createCutawayRing(10.15, 11.45, 0.09, mats.apPtfeShim, CUT_START, CUT_LEN);
    g.add(ptfeTop);
    register('ir_top_ptfe_thrust_ring', g, [0, 6.1, 0]);
  }

  // =========================================================================
  // 05. 50 μm PRECISION CALIBRATED SUS CLEARANCE MICRO-SHIM (Cutaway)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 2.24;

    const shim = createCutawayRing(11.65, 12.45, 0.12, mats.susSteel, CUT_START, CUT_LEN);
    g.add(shim);
    register('ir_aperture_blade_spacer_upper', g, [0, 5.2, 0]);
  }

  // Precompute all 6 mathematically exact spiral cam slot paths once
  const allSlotTracks = [];
  for (let k = 0; k < 6; k++) {
    const aBlade = (k / 6) * Math.PI * 2;
    allSlotTracks.push(
      computeSpiralSlotPoints(aBlade, R_PIVOT, PIN_X, PIN_Z, SWING_MIN, SWING_MAX, CAM_ROT_MIN, CAM_ROT_MAX, 14)
    );
  }

  // =========================================================================
  // 06. BALANCED DUAL-ARM SLOTTED SPIRAL CAM ROTOR PLATE (6 REAL PIERCED SLOTS!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.76;

    const R_OUT = 11.65;
    const camShape = new THREE.Shape();
    const segs = 128;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      // Symmetric dual drive lever wings at angle 0 (+X) AND angle PI (-X)!
      const dRight = Math.min(a, Math.PI * 2 - a);
      const dLeft = Math.abs(a - Math.PI);
      const dWing = Math.min(dRight, dLeft);
      const rArm = dWing < 0.165 ? R_OUT + 3.25 * Math.cos((dWing / 0.165) * (Math.PI / 2)) : R_OUT;
      const px = Math.cos(a) * rArm;
      const py = Math.sin(a) * rArm;
      if (i === 0) camShape.moveTo(px, py);
      else camShape.lineTo(px, py);
    }
    camShape.closePath();

    // Central clear optical pupil bore
    const bore = new THREE.Path();
    bore.absarc(0, 0, 7.38, 0, Math.PI * 2, true);
    camShape.holes.push(bore);

    // Pierce all 6 exact spiral cam slots cleanly through the rotor plate
    for (let k = 0; k < 6; k++) {
      const poly = buildOffsetCapsulePts(allSlotTracks[k], 0.34, 0.30);
      const slotHole = new THREE.Path();
      slotHole.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) slotHole.lineTo(poly[i].x, poly[i].y);
      slotHole.closePath();
      camShape.holes.push(slotHole);
    }

    const camGeo = new THREE.ExtrudeGeometry(camShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    camGeo.rotateX(-Math.PI / 2);
    g.add(new THREE.Mesh(camGeo, mats.lensIrisCam));

    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_cam_rotor_plate', g, [0, 4.1, 0], { isMicroIrisCam: true });
  }

  // =========================================================================
  // 07. 6× LOW-FRICTION F-DLC / PTFE CAM SLOT WALL LINERS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.74;

    // Build crisp glowing teal sleeve walls hugging the exact perimeter of all 6 pierced spiral slots!
    for (let k = 0; k < 6; k++) {
      const outerPoly = buildOffsetCapsulePts(allSlotTracks[k], 0.42, 0.36);
      const innerPoly = buildOffsetCapsulePts(allSlotTracks[k], 0.29, 0.25);

      const linerShape = new THREE.Shape();
      linerShape.moveTo(outerPoly[0].x, outerPoly[0].y);
      for (let i = 1; i < outerPoly.length; i++) linerShape.lineTo(outerPoly[i].x, outerPoly[i].y);
      linerShape.closePath();

      const hole = new THREE.Path();
      hole.moveTo(innerPoly[0].x, innerPoly[0].y);
      for (let i = 1; i < innerPoly.length; i++) hole.lineTo(innerPoly[i].x, innerPoly[i].y);
      hole.closePath();
      linerShape.holes.push(hole);

      const lGeo = new THREE.ExtrudeGeometry(linerShape, { depth: 0.39, bevelEnabled: false });
      lGeo.rotateX(-Math.PI / 2);
      g.add(new THREE.Mesh(lGeo, mats.irSlotLinerTeal));
    }

    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_cam_slot_liners', g, [0, 4.9, 0], { isMicroIrisCam: true });
  }

  // =========================================================================
  // 08. UPPER HARDENED SUS ARC V-GROOVE BALL RACEWAYS (×3, 120° Spacing)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.58;

    const R_RACE = 10.95;
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * Math.PI * 2 + 0.14;
      const racePts = [
        new THREE.Vector2(R_RACE - 0.54, 0.14),
        new THREE.Vector2(R_RACE + 0.54, 0.14),
        new THREE.Vector2(R_RACE + 0.54, -0.10),
        new THREE.Vector2(R_RACE + 0.34, -0.10),
        new THREE.Vector2(R_RACE, 0.06), // Crisp inverted 90° V-groove ceiling!
        new THREE.Vector2(R_RACE - 0.34, -0.10),
        new THREE.Vector2(R_RACE - 0.54, -0.10),
        new THREE.Vector2(R_RACE - 0.54, 0.14)
      ];
      g.add(new THREE.Mesh(new THREE.LatheGeometry(racePts, 24, a0, 0.78), mats.periHardenedRail));
    }

    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_upper_vgroove_race', g, [0, 3.2, 0], { isMicroIrisCam: true });
  }

  // =========================================================================
  // 09. 6× Y-TZP ZrO2 GRADE-5 CERAMIC ROLLING MICRO-BALLS (3 Pairs × 2 Balls!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.29;

    const R_RACE = 10.95;
    const ballGeo = new THREE.SphereGeometry(0.35, 24, 24);
    for (let i = 0; i < 3; i++) {
      const baseA = (i / 3) * Math.PI * 2 + 0.52;
      for (const da of [-0.14, 0.14]) {
        const a = baseA + da;
        const ball = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
        ball.position.set(Math.cos(a) * R_RACE, 0, Math.sin(a) * R_RACE);
        g.add(ball);
      }
    }

    g.rotation.y = CAM_ROT_REST * 0.5;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_ceramic_thrust_balls', g, [0, 2.3, 0], { isMicroIrisBalls: true });
  }

  // =========================================================================
  // 10. 3× ULTRA-THIN BeCu 2-BALL RETAINER CAGES (Rolls at 0.5× Rotor Angle!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.29;

    const R_RACE = 10.95;
    for (let i = 0; i < 3; i++) {
      const baseA = (i / 3) * Math.PI * 2 + 0.52;
      // Curved golden BeCu binocular strap linking the 2 ball pockets
      const strap = createCutawayRing(R_RACE - 0.14, R_RACE + 0.14, 0.12, mats.beCuSpring, baseA - 0.14, 0.28);
      g.add(strap);
      for (const da of [-0.14, 0.14]) {
        const a = baseA + da;
        const pocket = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.065, 10, 24), mats.beCuSpring);
        pocket.rotation.x = Math.PI / 2;
        pocket.position.set(Math.cos(a) * R_RACE, 0, Math.sin(a) * R_RACE);
        g.add(pocket);
      }
    }

    g.rotation.y = CAM_ROT_REST * 0.5;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_ball_retainer_cage', g, [0, 1.8, 0], { isMicroIrisBalls: true });
  }

  // =========================================================================
  // 11. LOWER FIXED V-GROOVE RACES (×3) & AXIAL MAGNETIC PRELOAD PULLING RING
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 0.98;

    const R_RACE = 10.95;
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * Math.PI * 2 + 0.14;
      const racePts = [
        new THREE.Vector2(R_RACE - 0.56, -0.14),
        new THREE.Vector2(R_RACE + 0.56, -0.14),
        new THREE.Vector2(R_RACE + 0.56, 0.12),
        new THREE.Vector2(R_RACE + 0.34, 0.12),
        new THREE.Vector2(R_RACE, -0.05), // Lower 90° V-groove bed!
        new THREE.Vector2(R_RACE - 0.34, 0.12),
        new THREE.Vector2(R_RACE - 0.56, 0.12),
        new THREE.Vector2(R_RACE - 0.56, -0.14)
      ];
      g.add(new THREE.Mesh(new THREE.LatheGeometry(racePts, 24, a0, 0.78), mats.periHardenedRail));
    }

    // Embedded soft-iron Axial Magnetic Preload Pulling Ring keeping zero vertical play
    const pullRing = createCutawayRing(11.65, 12.18, 0.14, mats.yokePermalloy, 0, Math.PI * 2);
    pullRing.position.y = -0.18;
    g.add(pullRing);

    register('ir_lower_vgroove_race', g, [0, 1.0, 0]);
  }

  // Helper to construct articulated pivot groups for blade sub-assemblies
  const makeBladePivot = (bladeIdx, yElevation) => {
    const a = (bladeIdx / 6) * Math.PI * 2;
    const p = new THREE.Group();
    p.position.set(Math.cos(a) * R_PIVOT, yElevation, Math.sin(a) * R_PIVOT);
    p.rotation.y = -a + SWING_REST;
    p.userData.baseAzimuth = -a;
    p.userData.restSwing = SWING_REST;
    p.userData.swingMin = SWING_MIN;
    p.userData.swingMax = SWING_MAX;
    return p;
  };

  const bladeGeo = createMicroBladeGeometry();

  // =========================================================================
  // 12. TIER 1 OPPOSING BLADE PAIR (#1 & #4 — 0° / 180°, Topmost Floor)
  // =========================================================================
  {
    const g = new THREE.Group();
    const pivots = [];
    for (const idx of [0, 3]) {
      const p = makeBladePivot(idx, TIER_Y[0]);
      p.add(new THREE.Mesh(bladeGeo, mats.irBladeTier1));
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_tier1_pair', g, [0, 0.1, 0]);
  }

  // =========================================================================
  // 13. TIER 2 OPPOSING BLADE PAIR (#2 & #5 — 60° / 240°, Middle Floor)
  // =========================================================================
  {
    const g = new THREE.Group();
    const pivots = [];
    for (const idx of [1, 4]) {
      const p = makeBladePivot(idx, TIER_Y[1]);
      p.add(new THREE.Mesh(bladeGeo, mats.irBladeTier2));
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_tier2_pair', g, [0, -1.2, 0]);
  }

  // =========================================================================
  // 14. TIER 3 OPPOSING BLADE PAIR (#3 & #6 — 120° / 300°, Bottom Floor)
  // =========================================================================
  {
    const g = new THREE.Group();
    const pivots = [];
    for (const idx of [2, 5]) {
      const p = makeBladePivot(idx, TIER_Y[2]);
      p.add(new THREE.Mesh(bladeGeo, mats.irBladeTier3));
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_tier3_pair', g, [0, -2.5, 0]);
  }

  // =========================================================================
  // 15. RAZOR-SHARP OPTICAL KNIFE-EDGE BEVELS (< 5 μm, All 6 Blades!)
  // =========================================================================
  {
    const g = new THREE.Group();
    const knifeGeo = createKnifeEdgeGeometry();
    const pivots = [];
    for (let idx = 0; idx < 6; idx++) {
      const tier = BLADE_TIER_FOR_INDEX[idx];
      const p = makeBladePivot(idx, TIER_Y[tier] + 0.03);
      p.add(new THREE.Mesh(knifeGeo, mats.irKnifeEdgeSheen));
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_knife_edges', g, [0, 0.75, 0]);
  }

  // =========================================================================
  // 16. 24× EMBOSSED ANTI-STICTION MICRO-DIMPLES (4 Stamped Domes per Blade!)
  // =========================================================================
  {
    const g = new THREE.Group();
    const dimpleGeo = new THREE.SphereGeometry(0.17, 14, 12);
    const dimpleCoords = [
      [-0.35, -2.15],
      [0.32, -4.15],
      [-0.65, -6.10],
      [-1.55, -7.95]
    ];
    const pivots = [];
    for (let idx = 0; idx < 6; idx++) {
      const tier = BLADE_TIER_FOR_INDEX[idx];
      const p = makeBladePivot(idx, TIER_Y[tier] + 0.13);
      for (const [dx, dz] of dimpleCoords) {
        const d = new THREE.Mesh(dimpleGeo, mats.goldBond);
        d.scale.set(1.0, 0.48, 1.0);
        d.position.set(dx, 0, dz);
        p.add(d);
      }
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_friction_dimples', g, [0, 1.35, 0]);
  }

  // =========================================================================
  // 17. 6× STEPPED HARDENED CAM-FOLLOWER DRIVE PINS & SWAGED RIVET HEADS
  // =========================================================================
  {
    const g = new THREE.Group();
    const pivots = [];
    for (let idx = 0; idx < 6; idx++) {
      const tier = BLADE_TIER_FOR_INDEX[idx];
      const yBase = TIER_Y[tier];
      // Pin top ends uniformly at Y = +2.18 (peeking cleanly out the top of the cam rotor at Y=+2.10!)
      const pinH = 2.18 - yBase;
      const p = makeBladePivot(idx, yBase);

      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, pinH, 16), mats.periHardenedRail);
      pin.position.set(PIN_X, pinH / 2, PIN_Z);
      // Micro-swaged rivet head underneath blade
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.08, 14), mats.periHardenedRail);
      rivet.position.set(PIN_X, -0.04, PIN_Z);

      p.add(pin, rivet);
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_cam_pins', g, [0, 2.75, 0]);
  }

  // =========================================================================
  // 18. 6× SELF-LUBRICATING FLANGED TiN/BRONZE PIVOT BUSHINGS
  // =========================================================================
  {
    const g = new THREE.Group();
    const pivots = [];
    for (let idx = 0; idx < 6; idx++) {
      const tier = BLADE_TIER_FOR_INDEX[idx];
      const p = makeBladePivot(idx, TIER_Y[tier]);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.16, 20), mats.goldBond);
      sleeve.position.y = 0.07;
      const flange = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.085, 10, 22), mats.beCuSpring);
      flange.rotation.x = Math.PI / 2;
      flange.position.y = 0.14;
      p.add(sleeve, flange);
      g.add(p);
      pivots.push(p);
    }
    g.userData.microIrisBlades = pivots;
    register('ir_blade_pivot_bushings', g, [0, -0.5, 0]);
  }

  // =========================================================================
  // 19. 2× 15 μm PTFE NON-STICK INTERLEAVING SEPARATOR SHIMS (T1/T2 & T2/T3)
  // =========================================================================
  {
    const g = new THREE.Group();
    const makeShim = (yPos) => {
      const sh = new THREE.Shape();
      sh.absarc(0, 0, 10.65, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 8.35, 0, Math.PI * 2, true);
      sh.holes.push(hole);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const pH = new THREE.Path();
        pH.absarc(Math.cos(a) * R_PIVOT, Math.sin(a) * R_PIVOT, 0.54, 0, Math.PI * 2, true);
        sh.holes.push(pH);
      }
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, mats.apPtfeShim);
      m.position.y = yPos;
      return m;
    };
    g.add(makeShim(0.46), makeShim(0.10));
    register('ir_interleave_ptfe_shims', g, [0, -1.85, 0]);
  }

  // =========================================================================
  // 20. BALANCED DUAL-POLE N52H ROTOR MAGNETS (-X & +X SYMMETRIC PAIR!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.54;

    for (const sx of [-1, 1]) {
      const mx = sx * 14.15;
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.24, 4.95), mats.lensCarrierBody);
      saddle.position.set(mx, 0.26, 0);

      // Opposite pole orientation on -X vs +X produces pure balanced torque couple!
      const magA = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.68, 2.10), sx < 0 ? mats.lensMagnetN : mats.lensMagnetS);
      magA.position.set(mx, -0.18, -1.12);
      const magB = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.68, 2.10), sx < 0 ? mats.lensMagnetS : mats.lensMagnetN);
      magB.position.set(mx, -0.18, 1.12);
      const slit = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.70, 0.22), mats.magnetSlit);
      slit.position.set(mx, -0.18, 0);
      g.add(saddle, magA, magB, slit);
    }

    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ir_dual_rotor_magnets', g, [0, 3.6, 0], { isMicroIrisCam: true });
  }

  // =========================================================================
  // 21. BALANCED DUAL ROTARY VCM COPPER VOICE COILS (-X & +X, Φ28 μm Cu)
  // =========================================================================
  {
    const g = new THREE.Group();
    const makeCoil = (cx) => {
      const cg = new THREE.Group();
      const s = new THREE.Shape();
      s.moveTo(-1.18, -2.55);
      s.lineTo(1.18, -2.55);
      s.lineTo(1.18, 2.55);
      s.lineTo(-1.18, 2.55);
      s.closePath();
      const h = new THREE.Path();
      h.moveTo(-0.52, -1.25);
      h.lineTo(-0.52, 1.25);
      h.lineTo(0.52, 1.25);
      h.lineTo(0.52, -1.25);
      h.closePath();
      s.holes.push(h);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.54, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      cg.add(new THREE.Mesh(geo, mats.copperCoil));
      cg.position.set(cx, 0.20, 0);
      return cg;
    };
    g.add(makeCoil(-14.15), makeCoil(14.15));
    register('ir_dual_vcm_coils', g, [0, -3.6, 0]);
  }

  // =========================================================================
  // 22. DUAL PERMALLOY FLUX-RETURN BACK YOKES (-X & +X)
  // =========================================================================
  {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.24, 5.85), mats.yokePermalloy);
      yoke.position.set(sx * 14.15, -0.14, 0);
      g.add(yoke);
    }
    register('ir_dual_permalloy_yokes', g, [0, -5.2, 0]);
  }

  // =========================================================================
  // 23. ZERO-POWER WIDE-OPEN (f/1.42) MAGNETIC DETENT LATCH IRON TOOTH
  // =========================================================================
  {
    const g = new THREE.Group();
    // Offset at the wide-open (+Z) end of the +X magnet sweep so power-off gently locks blades wide open!
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.78), mats.periHardenedRail);
    tooth.position.set(14.95, 0.56, 2.55);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.20, 1.25), mats.yokePermalloy);
    foot.position.set(14.95, 0.14, 2.55);
    g.add(tooth, foot);
    register('ir_magnetic_detent_latch', g, [4.2, -3.2, 2.4]);
  }

  // =========================================================================
  // 24. 2× ULTRA-THIN BeCu ZERO-BACKLASH TORSION PRELOAD FLEXURE SPRINGS
  // =========================================================================
  {
    const g = new THREE.Group();
    // Twin photo-etched S-curve golden BeCu micro-flexures at +Z and -Z outer quadrants
    for (const sz of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sz * -2.2, 1.05, sz * 12.15),
        new THREE.Vector3(sz * -0.9, 1.05, sz * 12.75),
        new THREE.Vector3(sz * 0.4, 1.05, sz * 11.75),
        new THREE.Vector3(sz * 1.7, 1.05, sz * 12.55),
        new THREE.Vector3(sz * 2.8, 1.05, sz * 11.55)
      ]);
      const flexTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.11, 8, false), mats.beCuSpring);
      const anchorFixed = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.42, 14), mats.goldBond);
      anchorFixed.position.set(sz * -2.2, 0.96, sz * 12.15);
      const anchorRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.42, 14), mats.goldBond);
      anchorRotor.position.set(sz * 2.8, 1.22, sz * 11.55);
      g.add(flexTube, anchorFixed, anchorRotor);
    }
    register('ir_return_flexure_springs', g, [0, -0.8, 4.4]);
  }

  // =========================================================================
  // 25. QUAD HIGH-DAMPING ELASTOMER HARD-STOP BUMPERS (×4, Wide & Min Ends!)
  // =========================================================================
  {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const bx = sx * 13.55;
        const bz = sz * 3.72;
        const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.58, 1.12, 20), mats.apStopElastomer);
        bumper.position.set(bx, 1.38, bz);
        const corePin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.48, 14), mats.susSteel);
        corePin.position.set(bx, 1.28, bz);
        g.add(bumper, corePin);
      }
    }
    register('ir_quad_hard_stops', g, [0, 1.2, 3.6]);
  }

  // =========================================================================
  // 26. CNC STATOR BASEPLATE & 6 HARDENED TiN-COATED PIVOT PINS (Datum Base)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -0.46;

    const baseRing = createCutawayRing(7.35, 12.75, 0.36, mats.lcpBlack, 0, Math.PI * 2);
    g.add(baseRing);

    // Dual -X/+X actuator bay mounting decks
    const leftDeck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.36, 8.6), mats.lcpBlack);
    leftDeck.position.set(-14.3, 0, 0);
    const rightDeck = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.36, 8.6), mats.lcpBlack);
    rightDeck.position.set(14.3, 0, 0);
    g.add(leftDeck, rightDeck);

    // 6 gleaming hardened golden TiN vertical pivot pins passing upward through all 3 tiers & 2 shims!
    const pinGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.48, 18);
    const bossGeo = new THREE.CylinderGeometry(0.52, 0.56, 0.20, 18);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * R_PIVOT;
      const pz = Math.sin(a) * R_PIVOT;
      const pin = new THREE.Mesh(pinGeo, mats.goldBond);
      pin.position.set(px, 0.86, pz);
      const boss = new THREE.Mesh(bossGeo, mats.goldBond);
      boss.position.set(px, 0.22, pz);
      g.add(pin, boss);
    }

    register('ir_stator_base_pins', g, [0, -4.4, 0]);
  }

  // =========================================================================
  // 27. DIFFERENTIAL DUAL 12-BIT HALL / TMR ANGLE SENSORS (-X & +X)
  // =========================================================================
  {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const hx = sx * 14.15;
      const hall = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.42, 1.25), mats.hallSensorEmerald);
      hall.position.set(hx, 0.46, 0);
      const pads = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.10, 1.45), mats.goldBond);
      pads.position.set(hx, 0.22, 0);
      g.add(hall, pads);
    }
    register('ir_dual_hall_tmr_sensors', g, [0, -2.2, 2.8]);
  }

  // =========================================================================
  // 28. 0201 NTC TEMPERATURE COMPENSATION THERMISTOR (Magnet Drift Compensation)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-16.05, 0.16, 2.25);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.36, 0.42), mats.lensVentCyan);
    const capL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.44), mats.solderTin);
    capL.position.x = -0.34;
    const capR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.44), mats.solderTin);
    capR.position.x = 0.34;
    g.add(body, capL, capR);

    register('ir_ntc_thermistor', g, [-4.2, -3.2, 3.2]);
  }

  // =========================================================================
  // 29. DEDICATED SMART CLOSED-LOOP PID APERTURE DRIVER ASIC
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-18.55, 0.12, -1.65);

    const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.54, 2.35), mats.icPackageDark);
    const pin1Dot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.56, 12), mats.goldBond);
    pin1Dot.position.set(-0.75, 0.02, -0.75);
    g.add(pkg, pin1Dot);

    register('ir_driver_asic', g, [-5.6, -4.4, -2.2]);
  }

  // =========================================================================
  // 30. FACTORY OPTICAL F-STOP CALIBRATION EEPROM IC
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-18.55, 0.08, 1.85);

    const pkg = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.25), mats.susDarkInner);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.32), mats.alPad);
    mark.position.set(-0.45, 0.01, -0.35);
    g.add(pkg, mark);

    register('ir_calibration_eeprom', g, [-5.6, -4.4, 2.6]);
  }

  // =========================================================================
  // 31. 6× 01005 MICRO MLCC DECOUPLING CAPACITORS & EMI FERRITE BEAD
  // =========================================================================
  {
    const g = new THREE.Group();
    const coords = [
      [-16.75, -2.55, false],
      [-16.75, -1.75, false],
      [-16.75, -0.95, false],
      [-16.75, -0.15, false],
      [-16.75, 0.65, false],
      [-16.75, 1.45, true] // Dark EMI ferrite bead
    ];
    for (const [cx, cz, isBead] of coords) {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.30, 0.32),
        isBead ? mats.icPackageDark : mats.mlccCeramic
      );
      body.position.set(cx, 0.04, cz);
      const tL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.34), mats.solderTin);
      tL.position.set(cx - 0.28, 0.04, cz);
      const tR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.34), mats.solderTin);
      tR.position.set(cx + 0.28, 0.04, cz);
      g.add(body, tL, tR);
    }
    register('ir_mlcc_decoupling', g, [-4.8, -5.0, 0.8]);
  }

  // =========================================================================
  // 32. DEDICATED DUAL-VCM POLYIMIDE FPC, RIGID ISLAND & 10-PIN GOLD BTB
  // =========================================================================
  {
    const g = new THREE.Group();

    // Graceful curved amber polyimide arch linking BOTH -X and +X VCM & Hall bays around rear (-Z)!
    const fpcArch = createCutawayRing(13.05, 15.15, 0.16, mats.fpcPolyimide, Math.PI * 0.52, Math.PI * 0.96);
    fpcArch.position.y = -0.24;
    g.add(fpcArch);

    // Left & Right VCM landing pads
    const padL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 6.4), mats.fpcPolyimide);
    padL.position.set(-14.2, -0.24, 0);
    const padR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 6.4), mats.fpcPolyimide);
    padR.position.set(14.2, -0.24, 0);
    g.add(padL, padR);

    // Left Rigid Control Island carrying ASIC, EEPROM, NTC, MLCCs & 10-Pin BTB!
    const island = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.28, 7.6), mats.rigidPcb);
    island.position.set(-18.8, -0.26, 0);
    g.add(island);

    // 10-Pin 0.35 mm Pitch Gold BTB Mezzanine Connector on far-left edge (-X = -21.05)
    const btb = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.58, 5.4), mats.btbHousing);
    btb.position.set(-21.05, 0.14, 0);
    g.add(btb);
    for (let i = 0; i < 5; i++) {
      const pz = -1.8 + i * 0.9;
      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.24), mats.goldBond);
      pL.position.set(-21.82, 0.08, pz);
      const pR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.24), mats.goldBond);
      pR.position.set(-20.28, 0.08, pz);
      g.add(pL, pR);
    }

    register('ir_rigid_flex_fpc_btb', g, [0, -6.6, -2.4]);
  }

  return {
    root,
    parts,
    gridY: -2.4,
    defaultCameraPos: new THREE.Vector3(11.0, 29.5, 44.0),
    defaultTarget: new THREE.Vector3(3.4, 0.4, 0.0),
    clipBounds: { x: 22.5, y: 5.5, z: 14.5 }
  };
}
