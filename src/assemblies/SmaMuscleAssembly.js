import * as THREE from 'three';

const UP_VEC = new THREE.Vector3(0, 1, 0);

/**
 * Helper: Creates a square annular frame with rounded outer corners and circular central aperture.
 */
function createSquareAperturePlate(halfW, halfD, holeR, depth, mat) {
  const s = new THREE.Shape();
  const r = 0.55;
  s.moveTo(-halfW + r, -halfD);
  s.lineTo(halfW - r, -halfD);
  s.quadraticCurveTo(halfW, -halfD, halfW, -halfD + r);
  s.lineTo(halfW, halfD - r);
  s.quadraticCurveTo(halfW, halfD, halfW - r, halfD);
  s.lineTo(-halfW + r, halfD);
  s.quadraticCurveTo(-halfW, halfD, -halfW, halfD - r);
  s.lineTo(-halfW, -halfD + r);
  s.quadraticCurveTo(-halfW, -halfD, -halfW + r, -halfD);
  s.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
  s.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 40 });
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

/**
 * Helper: Positions a unit-height (length=1 along Y) cylinder mesh strictly between two 3D points pA and pB.
 */
function alignCylinderBetween(mesh, pA, pB) {
  const dir = pB.clone().sub(pA);
  const len = dir.length();
  mesh.position.copy(pA).add(pB).multiplyScalar(0.5);
  mesh.scale.set(1, len, 1);
  if (len > 1e-5) {
    mesh.quaternion.setFromUnitVectors(UP_VEC, dir.divideScalar(len));
  }
}

/**
 * Helper: Builds one 150-degree stamped & folded micro-crimp jaw geometry (compact scale for actuator).
 */
function createMiniCrimpMesh(mat, scale = 1.0) {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.24 * scale, 0.42 * scale), mat);
  grp.add(base);
  const fold = new THREE.Mesh(new THREE.BoxGeometry(0.44 * scale, 0.14 * scale, 0.34 * scale), mat);
  fold.position.set(0, 0.14 * scale, 0.03 * scale);
  fold.rotation.x = 0.22;
  grp.add(fold);
  return grp;
}

/**
 * Helper: Creates a 3D ball-and-stick atomic crystal lattice block (either sheared monoclinic Martensite
 * or orthogonal cubic Austenite B2) for the magnified NiTiCu metallurgy cutaway!
 */
function createCrystalLattice(nx, ny, nz, pitchX, pitchY, pitchZ, shearZPerY, niMat, tiMat, bondMat) {
  const grp = new THREE.Group();
  const atomGeo = new THREE.SphereGeometry(0.165, 14, 12);
  const bondGeo = new THREE.CylinderGeometry(0.036, 0.036, 1.0, 8);

  const posGrid = [];
  for (let ix = 0; ix < nx; ix++) {
    posGrid[ix] = [];
    for (let iy = 0; iy < ny; iy++) {
      posGrid[ix][iy] = [];
      for (let iz = 0; iz < nz; iz++) {
        const cx = (ix - (nx - 1) * 0.5) * pitchX;
        const cy = (iy - (ny - 1) * 0.5) * pitchY;
        const cz = (iz - (nz - 1) * 0.5) * pitchZ + cy * shearZPerY;
        const p = new THREE.Vector3(cx, cy, cz);
        posGrid[ix][iy][iz] = p;

        // Alternating Ni / Ti CsCl-type B2 / B19' atomic occupancy
        const isNi = (ix + iy + iz) % 2 === 0;
        const atom = new THREE.Mesh(atomGeo, isNi ? niMat : tiMat);
        atom.position.copy(p);
        grp.add(atom);
      }
    }
  }

  // Lattice sticks connecting adjacent nearest-neighbor atoms
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        const p0 = posGrid[ix][iy][iz];
        if (ix + 1 < nx) {
          const b = new THREE.Mesh(bondGeo, bondMat);
          alignCylinderBetween(b, p0, posGrid[ix + 1][iy][iz]);
          grp.add(b);
        }
        if (iy + 1 < ny) {
          const b = new THREE.Mesh(bondGeo, bondMat);
          alignCylinderBetween(b, p0, posGrid[ix][iy + 1][iz]);
          grp.add(b);
        }
        if (iz + 1 < nz) {
          const b = new THREE.Mesh(bondGeo, bondMat);
          alignCylinderBetween(b, p0, posGrid[ix][iy][iz + 1]);
          grp.add(b);
        }
      }
    }
  }

  return grp;
}

/**
 * Phase 10: Zero-Magnet 8-Wire SMA (NiTiCu Shape Memory Alloy) Artificial-Muscle 5-Axis OIS + AF Actuator
 * & Atomic Martensite <-> Austenite Crystal-Phase Metallurgy Dissection (30 Independent Parts!)
 *
 * Left/Center Hero (X ∈ [-9.6, +3.6], Z ∈ [-6.6, +8.4]):
 *   - 8 Opposing Inclined Φ25 μm NiTiCu SMA Wires arranged in 4 opposing X-truss pairs around a floating 1-inch lens carrier
 *   - Real-time dynamic 3D wire re-aiming + Joule-heating thermal Austenite/Martensite color modulation in SimEffects!
 *   - Patented GB2607269A Tapered-Gap Thermal Cooling Fins, Moving Common Ring, 16x 150° Micro-Crimps, CM824 Self-Sensing ASIC & 8x 0.1% Shunts!
 * Right Side Inset Showcase (X ∈ [+6.0, +11.4], Z ∈ [-4.8, +4.8]):
 *   - 120x Magnified 150° Folded Micro-Crimp Jaw + Sliced Φ25 μm Wire + Monoclinic Martensite (B19') vs Glowing Phase Front vs Cubic Austenite (B2) Lattice!
 */
export function buildSmaMuscleAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'SmaMuscleRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // Shared mechanical coordinates for main 8-wire actuator
  const X_ACT = -3.0;
  const Z_ACT = -0.3;

  // Exact 8-wire opposing diagonal geometry (4 perimeter sides x 2 non-intersecting opposing diagonal wires!)
  // Side plane radial offsets: wire A at r = 5.05, wire B at r = 5.42 (0.37 radial separation -> zero wire rubbing!)
  const Y_STAT = -1.42;
  const Y_MOVE = 2.48;
  const SPAN_STAT = 3.75;
  const SPAN_MOVE = 2.55;

  const wireDefs = [
    // +X Side Pair (Wires #1 & #2)
    {
      groupKey: 'x_pos',
      axis: 'x+',
      pStatic: new THREE.Vector3(X_ACT + 5.18, Y_STAT, Z_ACT - SPAN_STAT),
      pMoving: new THREE.Vector3(X_ACT + 4.88, Y_MOVE, Z_ACT + SPAN_MOVE),
      heatSignX: 1, heatSignZ: 0.25, heatSignY: 1
    },
    {
      groupKey: 'x_pos',
      axis: 'x+',
      pStatic: new THREE.Vector3(X_ACT + 5.56, Y_STAT, Z_ACT + SPAN_STAT),
      pMoving: new THREE.Vector3(X_ACT + 5.26, Y_MOVE, Z_ACT - SPAN_MOVE),
      heatSignX: 1, heatSignZ: -0.25, heatSignY: 1
    },
    // -X Side Pair (Wires #3 & #4)
    {
      groupKey: 'x_neg',
      axis: 'x-',
      pStatic: new THREE.Vector3(X_ACT - 5.18, Y_STAT, Z_ACT - SPAN_STAT),
      pMoving: new THREE.Vector3(X_ACT - 4.88, Y_MOVE, Z_ACT + SPAN_MOVE),
      heatSignX: -1, heatSignZ: 0.25, heatSignY: 1
    },
    {
      groupKey: 'x_neg',
      axis: 'x-',
      pStatic: new THREE.Vector3(X_ACT - 5.56, Y_STAT, Z_ACT + SPAN_STAT),
      pMoving: new THREE.Vector3(X_ACT - 5.26, Y_MOVE, Z_ACT - SPAN_MOVE),
      heatSignX: -1, heatSignZ: -0.25, heatSignY: 1
    },
    // +Z Front Side Pair (Wires #5 & #6)
    {
      groupKey: 'z_pos',
      axis: 'z+',
      pStatic: new THREE.Vector3(X_ACT - SPAN_STAT, Y_STAT, Z_ACT + 5.18),
      pMoving: new THREE.Vector3(X_ACT + SPAN_MOVE, Y_MOVE, Z_ACT + 4.88),
      heatSignX: 0.25, heatSignZ: 1, heatSignY: 1
    },
    {
      groupKey: 'z_pos',
      axis: 'z+',
      pStatic: new THREE.Vector3(X_ACT + SPAN_STAT, Y_STAT, Z_ACT + 5.56),
      pMoving: new THREE.Vector3(X_ACT - SPAN_MOVE, Y_MOVE, Z_ACT + 5.26),
      heatSignX: -0.25, heatSignZ: 1, heatSignY: 1
    },
    // -Z Rear Side Pair (Wires #7 & #8)
    {
      groupKey: 'z_neg',
      axis: 'z-',
      pStatic: new THREE.Vector3(X_ACT - SPAN_STAT, Y_STAT, Z_ACT - 5.18),
      pMoving: new THREE.Vector3(X_ACT + SPAN_MOVE, Y_MOVE, Z_ACT - 4.88),
      heatSignX: 0.25, heatSignZ: -1, heatSignY: 1
    },
    {
      groupKey: 'z_neg',
      axis: 'z-',
      pStatic: new THREE.Vector3(X_ACT + SPAN_STAT, Y_STAT, Z_ACT - 5.56),
      pMoving: new THREE.Vector3(X_ACT - SPAN_MOVE, Y_MOVE, Z_ACT - 5.26),
      heatSignX: -0.25, heatSignZ: -1, heatSignY: 1
    }
  ];

  // =========================================================================
  // GROUP 1: SHIELD CAN, TAPERED HEAT SINKS & FLOATING LENS PAYLOAD (01-05)
  // =========================================================================

  // 01. Deep-Drawn Non-Magnetic SUS304 Zero-EMI Shield Can (Front-Right L-Cutaway!)
  const shieldGrp = new THREE.Group();
  {
    // Top roof covering rear-left L-section leaving front-right (+X, +Z) wide open to showcase the 8-wire X-truss!
    const rOut = 6.55;
    const rWin = 4.15;
    const roofShape = new THREE.Shape();
    // Shape X = local X, Shape Y = -local Z (rear is +shapeY, front is -shapeY)
    roofShape.moveTo(-rOut, -rOut);
    roofShape.lineTo(-1.2, -rOut);
    roofShape.lineTo(-1.2, -rWin);
    // Sweep cleanly around rear-left optical aperture arc from bottom (-1.2, -rWin) to right (+rWin, +1.2)
    const aStart = Math.atan2(-rWin, -1.2);
    const aEnd = Math.atan2(1.2, rWin);
    roofShape.absarc(0, 0, rWin, aStart + Math.PI * 2, aEnd, true);
    roofShape.lineTo(rOut, 1.2);
    roofShape.lineTo(rOut, rOut);
    roofShape.lineTo(-rOut, rOut);
    roofShape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.24, bevelEnabled: false, curveSegments: 44 });
    roofGeo.rotateX(-Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, mats.susSteel);
    roof.position.set(X_ACT, 4.48, Z_ACT);
    shieldGrp.add(roof);

    // Back wall (-Z = Z_ACT - rOut)
    const backW = new THREE.Mesh(new THREE.BoxGeometry(rOut * 2, 7.1, 0.22), mats.susSteel);
    backW.position.set(X_ACT, 1.05, Z_ACT - rOut + 0.11);
    shieldGrp.add(backW);

    // Left wall (-X = X_ACT - rOut)
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.1, rOut * 2), mats.susSteel);
    leftW.position.set(X_ACT - rOut + 0.11, 1.05, Z_ACT);
    shieldGrp.add(leftW);

    // Partial rear-right wall stub
    const rightStub = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.1, rOut - 1.2), mats.susSteel);
    rightStub.position.set(X_ACT + rOut - 0.11, 1.05, Z_ACT - (rOut + 1.2) * 0.5);
    shieldGrp.add(rightStub);
  }
  register('sma_shield_can', shieldGrp, [-2.2, 6.4, -2.0]);

  // 02. Patented Tapered-Gap Uniform-Cooling Thermal Heat Sink Fins (GB2607269A!)
  const heatsinkGrp = new THREE.Group();
  {
    // Tapered profile fin: closest to the SMA wires at the center span, angling away toward the crimped ends!
    const buildTaperedFin = () => {
      const s = new THREE.Shape();
      s.moveTo(-3.4, 0.0);
      s.lineTo(-1.8, 0.28); // Tapered inward close to wire center for rapid uniform air conduction!
      s.lineTo(1.8, 0.28);
      s.lineTo(3.4, 0.0);
      s.lineTo(3.4, -0.26);
      s.lineTo(-3.4, -0.26);
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: 3.25, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      return new THREE.Mesh(geo, mats.smaHeatsinkSteel);
    };

    // Place tapered cooling fins adjacent to Rear (-Z), Left (-X), and half-height Front/Right so wires stay crystal-clear!
    const finRear = buildTaperedFin();
    finRear.position.set(X_ACT, -1.05, Z_ACT - 5.95);
    finRear.rotation.y = Math.PI; // Taper faces inward (+Z) toward rear SMA wires
    heatsinkGrp.add(finRear);

    const finLeft = buildTaperedFin();
    finLeft.position.set(X_ACT - 5.95, -1.05, Z_ACT);
    finLeft.rotation.y = -Math.PI / 2; // Taper faces inward (+X) toward left SMA wires
    heatsinkGrp.add(finLeft);

    // Lower-profile tapered fins along Right (+X) and Front (+Z) so viewer sees both wires AND the tapered cooling gap!
    const finRight = buildTaperedFin();
    finRight.scale.set(1, 0.45, 1);
    finRight.position.set(X_ACT + 5.98, -1.15, Z_ACT);
    finRight.rotation.y = Math.PI / 2;
    heatsinkGrp.add(finRight);

    const finFront = buildTaperedFin();
    finFront.scale.set(1, 0.45, 1);
    finFront.position.set(X_ACT, -1.15, Z_ACT + 5.98);
    heatsinkGrp.add(finFront);
  }
  register('sma_tapered_heatsinks', heatsinkGrp, [-1.5, 4.4, -1.2]);

  // 03. Upper Quad 3,000 G Drop-Shock High-Damping Silicone End-Stoppers
  const topStopsGrp = new THREE.Group();
  {
    const corners = [
      [-4.65, -4.65], [4.65, -4.65], [-4.65, 4.65], [4.65, 4.65]
    ];
    for (const [cx, cz] of corners) {
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.95), mats.apStopElastomer);
      bumper.position.set(X_ACT + cx, 3.85, Z_ACT + cz);
      topStopsGrp.add(bumper);
    }
  }
  register('sma_top_elastomer_stops', topStopsGrp, [-1.2, 5.2, 0.4]);

  // 04. Floating 5-Axis Moving Lens Carrier (LCP Lightweight High-Stiffness Carriage — LIVE 5-AXIS MOVING!)
  const carrierGrp = new THREE.Group();
  {
    const mainBody = createSquareAperturePlate(4.52, 4.52, 3.35, 3.85, mats.lcpBlack);
    mainBody.position.set(X_ACT, -1.05, Z_ACT);
    carrierGrp.add(mainBody);

    // Machined lightening pockets on outer carrier faces & upper alignment flange
    const topLip = createSquareAperturePlate(4.68, 4.68, 3.35, 0.36, mats.susDarkInner);
    topLip.position.set(X_ACT, 2.78, Z_ACT);
    carrierGrp.add(topLip);
  }
  register('sma_carrier_lens_holder', carrierGrp, [-1.0, 2.4, 0.0], { smaMovingCarrier: true });

  // 05. Cutaway 1-Inch Heavy Optical Glass Lens Group Payload seated inside Floating Carrier
  const lensBarrelGrp = new THREE.Group();
  {
    // 240° cutaway optical barrel + 3 sculpted heavy glass lenses demonstrating the >1.5 g payload!
    const barrelPts = [
      new THREE.Vector2(2.96, -0.85),
      new THREE.Vector2(3.30, -0.85),
      new THREE.Vector2(3.30, 3.55),
      new THREE.Vector2(2.96, 3.55),
      new THREE.Vector2(2.96, -0.85)
    ];
    const barrel = new THREE.Mesh(new THREE.LatheGeometry(barrelPts, 48, Math.PI * 0.60, Math.PI * 1.36), mats.susDarkInner);
    barrel.position.set(X_ACT, 0, Z_ACT);
    lensBarrelGrp.add(barrel);

    // 3 heavy cutaway molded glass lens elements stacked inside
    const lensYs = [2.65, 1.25, -0.10];
    const lensMats = [mats.ldIrGlass, mats.lensHybridResin, mats.ldIrGlass];
    for (let li = 0; li < 3; li++) {
      const pts = [];
      const rMax = 2.92;
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), lensYs[li] - 0.28 * (1 - 0.7 * u * u)));
      }
      for (let i = 16; i >= 0; i--) {
        const u = i / 16;
        pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), lensYs[li] + 0.44 * (1 - 0.8 * u * u)));
      }
      const lm = new THREE.Mesh(new THREE.LatheGeometry(pts, 44, Math.PI * 0.60, Math.PI * 1.36), lensMats[li]);
      lm.position.set(X_ACT, 0, Z_ACT);
      lensBarrelGrp.add(lm);
    }
  }
  register('sma_demo_glass_barrel', lensBarrelGrp, [-1.0, 3.8, 0.2], { smaMovingCarrier: true });

  // =========================================================================
  // GROUP 2: THE 8 OPPOSING INCLINED NiTiCu SMA MUSCLE WIRES & CRIMPS (06-13)
  // =========================================================================
  const wireUnitGeo = new THREE.CylinderGeometry(0.115, 0.115, 1.0, 14);
  const dynamicWiresByKey = { x_pos: [], x_neg: [], z_pos: [], z_neg: [] };

  for (const wd of wireDefs) {
    // Each wire gets its own material clone so SimEffects can individually modulate hot Austenite <-> cool Martensite glow!
    const isInitialWarm = wd.groupKey === 'x_pos' || wd.groupKey === 'z_pos';
    const wMat = (isInitialWarm ? mats.smaWireWarm : mats.smaWireCool).clone();
    const wMesh = new THREE.Mesh(wireUnitGeo, wMat);
    alignCylinderBetween(wMesh, wd.pStatic, wd.pMoving);
    wMesh.userData.smaWireDef = {
      pStatic: wd.pStatic.clone(),
      pMovingRest: wd.pMoving.clone(),
      restLen: wd.pStatic.distanceTo(wd.pMoving),
      axis: wd.axis,
      heatSignX: wd.heatSignX,
      heatSignZ: wd.heatSignZ,
      heatSignY: wd.heatSignY,
      defaultWarm: isInitialWarm,
      wireMat: wMat
    };
    dynamicWiresByKey[wd.groupKey].push(wMesh);
  }

  // 06. +X Side Opposing SMA Wire Pair (#1 & #2)
  const wXPosGrp = new THREE.Group();
  dynamicWiresByKey.x_pos.forEach((m) => wXPosGrp.add(m));
  wXPosGrp.userData.smaWires = dynamicWiresByKey.x_pos;
  register('sma_wires_x_pos', wXPosGrp, [1.8, 1.4, 0.0]);

  // 07. -X Side Opposing SMA Wire Pair (#3 & #4)
  const wXNegGrp = new THREE.Group();
  dynamicWiresByKey.x_neg.forEach((m) => wXNegGrp.add(m));
  wXNegGrp.userData.smaWires = dynamicWiresByKey.x_neg;
  register('sma_wires_x_neg', wXNegGrp, [-3.4, 1.4, 0.0]);

  // 08. +Z Front Opposing SMA Wire Pair (#5 & #6)
  const wZPosGrp = new THREE.Group();
  dynamicWiresByKey.z_pos.forEach((m) => wZPosGrp.add(m));
  wZPosGrp.userData.smaWires = dynamicWiresByKey.z_pos;
  register('sma_wires_z_pos', wZPosGrp, [-0.8, 1.4, 2.8]);

  // 09. -Z Rear Opposing SMA Wire Pair (#7 & #8)
  const wZNegGrp = new THREE.Group();
  dynamicWiresByKey.z_neg.forEach((m) => wZNegGrp.add(m));
  wZNegGrp.userData.smaWires = dynamicWiresByKey.z_neg;
  register('sma_wires_z_neg', wZNegGrp, [-0.8, 1.4, -2.8]);

  // 10. Moving-Side Common Electrode Power Bus Ring (Copper Alloy — moves with carrier!)
  const commonRingGrp = new THREE.Group();
  {
    const ring = createSquareAperturePlate(5.15, 5.15, 4.46, 0.22, mats.smaCommonCopper);
    ring.position.set(X_ACT, Y_MOVE + 0.08, Z_ACT);
    commonRingGrp.add(ring);

    // 8 radial conductor tabs extending slightly to meet the 8 moving micro-crimps
    for (const wd of wireDefs) {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), mats.smaCommonCopper);
      tab.position.set(wd.pMoving.x, Y_MOVE + 0.14, wd.pMoving.z);
      commonRingGrp.add(tab);
    }
  }
  register('sma_common_power_ring', commonRingGrp, [-1.0, 3.0, 0.0], { smaMovingCarrier: true });

  // 11. 8x Moving-Side 150° Folded Micro-Crimps gripping upper ends of all 8 SMA wires!
  const moveCrimpsGrp = new THREE.Group();
  {
    for (const wd of wireDefs) {
      const cr = createMiniCrimpMesh(mats.smaCrimpGold, 1.15);
      cr.position.copy(wd.pMoving);
      if (wd.axis.startsWith('x')) cr.rotation.y = Math.PI / 2;
      moveCrimpsGrp.add(cr);
    }
  }
  register('sma_moving_crimps', moveCrimpsGrp, [-1.0, 2.1, 0.4], { smaMovingCarrier: true });

  // 12. 8x Stationary Isolated PWM Micro-Crimps anchored around outer stator perimeter!
  const statCrimpsGrp = new THREE.Group();
  {
    for (const wd of wireDefs) {
      const cr = createMiniCrimpMesh(mats.smaCrimpGold, 1.2);
      cr.position.copy(wd.pStatic);
      if (wd.axis.startsWith('x')) cr.rotation.y = Math.PI / 2;
      statCrimpsGrp.add(cr);

      // Vertical solder lead leg dropping cleanly into the rigid PCB below
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.12, 0.18), mats.goldBond);
      leg.position.set(wd.pStatic.x, wd.pStatic.y - 0.62, wd.pStatic.z);
      statCrimpsGrp.add(leg);
    }
  }
  register('sma_static_crimps', statCrimpsGrp, [-1.0, -0.6, 0.4]);

  // 13. 16x Micro Thermal-Break & Electrical Isolation Pads (Polyimide / Ceramic)
  const thermIsoGrp = new THREE.Group();
  {
    for (const wd of wireDefs) {
      // Static-side thermal break pad
      const pStat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.62), mats.smaThermalBreak);
      pStat.position.set(wd.pStatic.x, wd.pStatic.y - 0.22, wd.pStatic.z);
      thermIsoGrp.add(pStat);

      // Moving-side thermal break pad between carrier LCP and common crimp
      const pMov = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.56), mats.smaThermalBreak);
      pMov.position.set(wd.pMoving.x, wd.pMoving.y - 0.18, wd.pMoving.z);
      thermIsoGrp.add(pMov);
    }
  }
  register('sma_thermal_isolators', thermIsoGrp, [-1.0, -0.1, 0.8]);

  // =========================================================================
  // GROUP 3: PRELOAD FLEXURE, ANTI-TILT BEARINGS & STATOR BASE (14-19)
  // =========================================================================

  // 14. S-Shaped Serpentine Common-Rail Power Flexure Lead (BeCu — zero stiffness feed to Common Ring!)
  const flexureGrp = new THREE.Group();
  {
    for (const side of [-1, 1]) {
      const pts = [
        new THREE.Vector3(X_ACT + side * 4.95, Y_MOVE + 0.14, Z_ACT + side * 4.55),
        new THREE.Vector3(X_ACT + side * 5.65, 1.55, Z_ACT + side * 5.15),
        new THREE.Vector3(X_ACT + side * 5.05, 0.55, Z_ACT + side * 5.55),
        new THREE.Vector3(X_ACT + side * 5.75, -0.55, Z_ACT + side * 5.15),
        new THREE.Vector3(X_ACT + side * 5.45, -2.35, Z_ACT + side * 5.45)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      flexureGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.085, 8, false), mats.beCuSpring));
    }
  }
  register('sma_flexure_common_feed', flexureGrp, [-1.0, 0.6, 1.4]);

  // 15. 4x Corner ZrO₂ Ceramic Anti-Tilt Guide Balls & Low-Friction PTFE Pad Rests
  const ballsGrp = new THREE.Group();
  {
    const ballGeo = new THREE.SphereGeometry(0.38, 20, 16);
    const padGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.12, 20);
    const corners = [
      [-4.15, -4.15], [4.15, -4.15], [-4.15, 4.15], [4.15, 4.15]
    ];
    for (const [cx, cz] of corners) {
      const b = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      b.position.set(X_ACT + cx, -1.62, Z_ACT + cz);
      ballsGrp.add(b);
      const pad = new THREE.Mesh(padGeo, mats.apPtfeShim);
      pad.position.set(X_ACT + cx, -2.02, Z_ACT + cz);
      ballsGrp.add(pad);
    }
  }
  register('sma_ceramic_guide_balls', ballsGrp, [-1.0, -1.4, 0.6]);

  // 16. 20 μm Ultra-Thin BeCu Anti-Gravity Preload Tension Spider Leaf Spring
  const preloadGrp = new THREE.Group();
  {
    const outerRing = createSquareAperturePlate(5.05, 5.05, 4.55, 0.09, mats.beCuSpring);
    outerRing.position.set(X_ACT, -1.16, Z_ACT);
    preloadGrp.add(outerRing);

    const innerRing = createSquareAperturePlate(3.95, 3.95, 3.45, 0.09, mats.beCuSpring);
    innerRing.position.set(X_ACT, -1.16, Z_ACT);
    preloadGrp.add(innerRing);

    // 4 curved flexible spider flexure arms linking stator ring to floating carrier!
    for (let i = 0; i < 4; i++) {
      const a0 = i * Math.PI * 0.5 + 0.25;
      const pts = [
        new THREE.Vector3(X_ACT + Math.cos(a0) * 4.68, -1.12, Z_ACT + Math.sin(a0) * 4.68),
        new THREE.Vector3(X_ACT + Math.cos(a0 + 0.45) * 4.28, -1.12, Z_ACT + Math.sin(a0 + 0.45) * 4.28),
        new THREE.Vector3(X_ACT + Math.cos(a0 + 0.85) * 3.78, -1.12, Z_ACT + Math.sin(a0 + 0.85) * 3.78)
      ];
      preloadGrp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.075, 8, false), mats.beCuSpring));
    }
  }
  register('sma_preload_leaf_spring', preloadGrp, [-1.0, -0.9, 0.0]);

  // 17. High-Stiffness LCP Stator Perimeter Frame & 8 Molded Crimp Anchor Towers
  const statorGrp = new THREE.Group();
  {
    const baseRing = createSquareAperturePlate(6.25, 6.25, 4.72, 0.72, mats.ldCeramicHousing);
    baseRing.position.set(X_ACT, -2.35, Z_ACT);
    statorGrp.add(baseRing);

    // 8 Precision Crimp Anchor Towers rising cleanly beneath each static crimp!
    for (const wd of wireDefs) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.84, 0.76), mats.ldCeramicHousing);
      tw.position.set(wd.pStatic.x, -1.96, wd.pStatic.z);
      statorGrp.add(tw);
    }
  }
  register('sma_stator_lcp_frame', statorGrp, [-1.0, -2.2, -0.4]);

  // 18. Lower Drop-Shock Silicone Bumpers & Optical Dust-Exclusion Gasket Ring
  const botBumpGrp = new THREE.Group();
  {
    const gasket = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.16, 12, 48), mats.apStopElastomer);
    gasket.rotation.x = Math.PI / 2;
    gasket.position.set(X_ACT, -2.18, Z_ACT);
    botBumpGrp.add(gasket);

    for (const [bx, bz] of [[-4.8, -4.8], [4.8, -4.8], [-4.8, 4.8], [4.8, 4.8]]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.34, 0.82), mats.apStopElastomer);
      pad.position.set(X_ACT + bx, -2.18, Z_ACT + bz);
      botBumpGrp.add(pad);
    }
  }
  register('sma_bot_drop_bumpers', botBumpGrp, [-1.0, -2.9, 0.4]);

  // 19. Bottom CNC Oxygen-Free Copper Thermal Dissipation Baseplate
  const cuBaseGrp = new THREE.Group();
  {
    const plate = createSquareAperturePlate(6.48, 6.48, 3.65, 0.42, mats.periCopperHeatsink);
    plate.position.set(X_ACT, -3.48, Z_ACT);
    cuBaseGrp.add(plate);
  }
  register('sma_copper_thermal_base', cuBaseGrp, [-1.0, -4.8, 0.0]);

  // =========================================================================
  // GROUP 4: SELF-SENSING CLOSED-LOOP ELECTRONICS — ZERO HALL SENSORS! (20-24)
  // Mounted neatly on the front +Z PCB electronics apron (Z ∈ [+6.2, +8.4])!
  // =========================================================================

  // 20. CML CM824-Class 8-Channel PWM + >10 kHz Resistance-Feedback Self-Sensing ASIC
  const asicGrp = new THREE.Group();
  {
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.56, 2.15), mats.icPackageDark);
    pkg.position.set(X_ACT - 1.85, -2.14, Z_ACT + 7.45);
    asicGrp.add(pkg);

    // Pin-1 laser gold fiducial mark + central exposed silicon heat-slug ring
    const fid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), mats.goldBond);
    fid.position.set(X_ACT - 2.85, -1.85, Z_ACT + 8.18);
    asicGrp.add(fid);
    const dieGlow = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.92), mats.hallSensorEmerald);
    dieGlow.position.set(X_ACT - 1.75, -1.84, Z_ACT + 7.45);
    asicGrp.add(dieGlow);
  }
  register('sma_cm824_asic', asicGrp, [-1.4, -1.8, 3.2]);

  // 21. 8x Precision 0.1% Low-Tempco Resistance-Sensing Shunt Resistors (01005/0201 x8!)
  const shuntsGrp = new THREE.Group();
  {
    for (let s = 0; s < 8; s++) {
      const col = s % 4;
      const row = Math.floor(s / 4);
      const sx = X_ACT + 0.35 + col * 0.78;
      const sz = Z_ACT + 6.95 + row * 0.88;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.32), mats.smaShuntPrecision);
      body.position.set(sx, -2.28, sz);
      shuntsGrp.add(body);
      for (const side of [-0.22, 0.22]) {
        const term = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.30, 0.34), mats.solderTin);
        term.position.set(sx + side, -2.28, sz);
        shuntsGrp.add(term);
      }
    }
  }
  register('sma_shunt_resistors', shuntsGrp, [0.4, -1.5, 3.4]);

  // 22. 0201 Ambient Temperature Reference NTC Thermistor
  const ntcGrp = new THREE.Group();
  {
    const ntc = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.42), mats.hallSensorEmerald);
    ntc.position.set(X_ACT + 3.85, -2.25, Z_ACT + 7.35);
    ntcGrp.add(ntc);
    for (const side of [-0.28, 0.28]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.44), mats.goldBond);
      cap.position.set(X_ACT + 3.85 + side, -2.25, Z_ACT + 7.35);
      ntcGrp.add(cap);
    }
  }
  register('sma_ambient_ntc', ntcGrp, [1.2, -1.6, 3.6]);

  // 23. High-Current 2.8-3.2V Multi-Layer Stator Rigid PCB & 0201 PWM Decoupling MLCC Bank
  const pcbGrp = new THREE.Group();
  {
    // Main aperture stator PCB + front electronics apron (Z ∈ [-6.5, +8.8])
    const s = new THREE.Shape();
    // Shape X = local X, Shape Y = -local Z -> rear is +6.5, front apron is -8.8
    s.moveTo(-6.45, -8.85);
    s.lineTo(6.45, -8.85);
    s.lineTo(6.45, 6.45);
    s.lineTo(-6.45, 6.45);
    s.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 3.65, 0, Math.PI * 2, true);
    s.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.62, bevelEnabled: false, curveSegments: 40 });
    geo.rotateX(-Math.PI / 2);
    const board = new THREE.Mesh(geo, mats.rigidPcb);
    board.position.set(X_ACT, -3.04, Z_ACT);
    pcbGrp.add(board);

    // 6x 0201 PWM decoupling MLCC capacitors along left front apron
    for (let c = 0; c < 6; c++) {
      const cx = X_ACT - 5.65 + (c % 3) * 0.72;
      const cz = Z_ACT + 6.95 + Math.floor(c / 3) * 0.85;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.30, 0.30), mats.mlccCeramic);
      body.position.set(cx, -2.27, cz);
      pcbGrp.add(body);
      for (const sd of [-0.22, 0.22]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.32), mats.solderTin);
        cap.position.set(cx + sd, -2.27, cz);
        pcbGrp.add(cap);
      }
    }
  }
  register('sma_rigid_pcb_mlcc', pcbGrp, [-1.0, -3.8, 0.4]);

  // 24. Zero-EMI I²C/SPI Polyimide Control FPC Tail & 16-Pin 0.35mm Gold BTB Mezzanine Connector
  const fpcGrp = new THREE.Group();
  {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 2.85), mats.fpcPolyimide);
    ribbon.position.set(X_ACT - 1.85, -2.98, Z_ACT + 9.95);
    fpcGrp.add(ribbon);

    const btb = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.38, 0.92), mats.btbHousing);
    btb.position.set(X_ACT - 1.85, -2.74, Z_ACT + 11.15);
    fpcGrp.add(btb);

    for (let p = 0; p < 8; p++) {
      const px = X_ACT - 3.45 + p * 0.46;
      for (const pz of [Z_ACT + 10.82, Z_ACT + 11.48]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.20), mats.goldBond);
        pin.position.set(px, -2.72, pz);
        fpcGrp.add(pin);
      }
    }
  }
  register('sma_fpc_btb_io', fpcGrp, [-1.4, -4.4, 4.2]);

  // =========================================================================
  // GROUP 5: 120x MAGNIFIED MICRO-METALLURGY & 150° CRIMP CUTAWAY INSET (25-30)
  // Cleanly positioned on the right side (X_MIC = +8.6, Y_MIC = +0.55, Z ∈ [-4.8, +4.8])!
  // =========================================================================
  const X_MIC = 8.4;
  const Y_MIC = 0.65;

  // 25. Magnified 150° Stamped & Folded Micro-Crimp Jaw Cutaway (CML 4-Step Folding Profile!)
  const microCrimpGrp = new THREE.Group();
  {
    // Exact 2D X-Y cross-section of a 150° folded V-groove metal sheet biting tightly around the Φ25 μm wire!
    const s = new THREE.Shape();
    s.moveTo(-2.15, -2.10);
    s.lineTo(2.15, -2.10);
    s.lineTo(2.35, -0.35);
    s.lineTo(1.52, 1.85);   // Right jaw folded 150° inward!
    s.lineTo(0.28, 2.02);
    s.lineTo(0.28, 1.48);
    // Inner circular bite pocket gripping R = 1.62 wire with micro-serration teeth!
    s.absarc(0, 0, 1.62, Math.PI * 0.44, Math.PI * 2.0 - Math.PI * 1.44, true);
    s.lineTo(-0.28, 1.48);
    s.lineTo(-0.28, 2.02);
    s.lineTo(-1.52, 1.85);  // Left jaw folded 150° inward!
    s.lineTo(-2.35, -0.35);
    s.closePath();

    const jawGeo = new THREE.ExtrudeGeometry(s, {
      depth: 2.55,
      bevelEnabled: true,
      bevelThickness: 0.14, // Smooth bell-mouth fatigue-relief exit R!
      bevelSize: 0.10,
      bevelSegments: 3,
      curveSegments: 32
    });
    const jaw = new THREE.Mesh(jawGeo, mats.smaCrimpGold);
    jaw.position.set(X_MIC, Y_MIC, -4.75);
    microCrimpGrp.add(jaw);

    // Subtle mounting cradle plinth under the magnified crimp
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.55, 2.95), mats.ldCeramicHousing);
    plinth.position.set(X_MIC, -2.25, -3.45);
    microCrimpGrp.add(plinth);
  }
  register('sma_micro_crimp_jaw', microCrimpGrp, [3.6, 1.8, -2.6]);

  // 26. Magnified Φ25 μm NiTiCu Wire Surface TiO₂ Passivation Skin & Cutaway Half-Sheath
  const microSheathGrp = new THREE.Group();
  {
    // Open half-cylinder cutaway sheath along Z (open on front-right +X/+Y side so internal crystal lattices shine out!)
    const sheathPts = [
      new THREE.Vector2(1.42, -5.80),
      new THREE.Vector2(1.64, -5.80),
      new THREE.Vector2(1.64, 3.60),
      new THREE.Vector2(1.42, 3.60),
      new THREE.Vector2(1.42, -5.80)
    ];
    const geo = new THREE.LatheGeometry(sheathPts, 40, Math.PI * 0.85, Math.PI * 1.15);
    geo.rotateX(Math.PI / 2); // Align wire axis strictly along Z!
    const sheath = new THREE.Mesh(geo, mats.smaWireSkin);
    sheath.position.set(X_MIC, Y_MIC, 0.85);
    microSheathGrp.add(sheath);

    // Solid full-round crimped NiTiCu wire tail gripped snugly inside the 150° crimp jaw (Z ∈ [-4.95, -2.18])
    const crimpedCore = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.56, 2.82, 32), mats.smaWireSkin);
    crimpedCore.rotation.x = Math.PI / 2;
    crimpedCore.position.set(X_MIC, Y_MIC, -3.56);
    microSheathGrp.add(crimpedCore);
  }
  register('sma_micro_wire_sheath', microSheathGrp, [4.6, 2.4, 0.2]);

  // 27. Low-Temp De-Twinned Monoclinic Martensite (B19') Sheared Crystal Lattice (+4% Stretched!)
  const martensiteGrp = new THREE.Group();
  {
    // Sheared parallelogram lattice (shearZPerY = 0.34 -> visually tilted monoclinic B19' structure!)
    const latticeM = createCrystalLattice(3, 3, 3, 0.68, 0.68, 0.84, 0.34, mats.smaMartensiteAtom, mats.smaTiAtom, mats.smaWireCool);
    latticeM.position.set(X_MIC, Y_MIC, -0.78);
    martensiteGrp.add(latticeM);
  }
  register('sma_crystal_martensite', martensiteGrp, [2.8, 0.4, -1.2]);

  // 28. Moving Thermal Martensite <-> Austenite Phase Transformation Front Band (A_s 70°C -> A_f 85°C!)
  const phaseFrontGrp = new THREE.Group();
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.36, 32), mats.smaPhaseFront);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(X_MIC, Y_MIC, 0.92);
    phaseFrontGrp.add(disc);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.08, 12, 36), mats.smaPhaseFront);
    halo.position.set(X_MIC, Y_MIC, 0.92);
    phaseFrontGrp.add(halo);
  }
  register('sma_phase_front_band', phaseFrontGrp, [4.2, 1.2, 0.6], { smaPhaseFront: true });

  // 29. High-Temp Rigid Cubic Austenite (B2 CsCl) Ordered Atomic Lattice (Shortened -4%, 2.5x Stiffer!)
  const austeniteGrp = new THREE.Group();
  {
    // Perfectly orthogonal, tightly compacted cubic B2 lattice (shear = 0, pitchZ shortened to 0.68!)
    const latticeA = createCrystalLattice(3, 3, 3, 0.68, 0.68, 0.68, 0.0, mats.smaAusteniteAtom, mats.smaTiAtom, mats.smaWireWarm);
    latticeA.position.set(X_MIC, Y_MIC, 2.58);
    austeniteGrp.add(latticeA);
  }
  register('sma_crystal_austenite', austeniteGrp, [3.2, 0.4, 1.6]);

  // 30. Self-Sensing Resistance (R = ρ·L/A) Micro-Electrode Ring & Dual Kelvin Sense Probes
  const probeGrp = new THREE.Group();
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.84, 0.13, 14, 44), mats.ldItoTrace);
    ring.position.set(X_MIC, Y_MIC, 4.18);
    probeGrp.add(ring);

    // Twin gold Kelvin 4-wire resistance sensing needles contacting top & bottom of electrode ring
    for (const sy of [-1, 1]) {
      const needle = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.25, 14), mats.goldBond);
      needle.position.set(X_MIC, Y_MIC + sy * 2.42, 4.18);
      if (sy > 0) needle.rotation.x = Math.PI;
      probeGrp.add(needle);
    }

    // Precision sense electrode base bar
    const baseBar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.34, 1.2), mats.smaShuntPrecision);
    baseBar.position.set(X_MIC, -2.15, 4.18);
    probeGrp.add(baseBar);
  }
  register('sma_elastoresistive_probe', probeGrp, [4.4, -0.6, 3.0]);

  return {
    root,
    parts,
    gridY: -3.75,
    defaultCameraPos: new THREE.Vector3(25.5, 19.0, 35.5),
    defaultTarget: new THREE.Vector3(5.0, 0.4, 1.0),
    clipBounds: { x: 14.0, y: 8.5, z: 12.5 }
  };
}
