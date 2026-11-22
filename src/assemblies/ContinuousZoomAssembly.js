import * as THREE from 'three';

/**
 * Helper: Builds a precision D-cut (racetrack-clipped) optical lens element facing along the X axis
 * (optical axis = +X, centered at (cx, cy, cz), clipped top & bottom to fit thin smartphone Z-height!).
 * Uses ExtrudeGeometry with subtle beveled/curved optical feel + circular meniscus relief rings.
 */
function buildDcutLensElement(cx, cy, cz, radius, halfHeight, thickness, sagSign, mat) {
  const grp = new THREE.Group();
  grp.position.set(cx, cy, cz);

  // D-cut profile in the Y-Z plane (rotated into world Y-Z perpendicular to X optical axis)
  const h = Math.min(halfHeight, radius * 0.96);
  const alpha = Math.asin(h / radius); // angle from horizontal Z axis to top cut corner
  const shape = new THREE.Shape();
  // Right arc: -alpha -> +alpha (in 2D shape: x_s = Z, y_s = Y)
  shape.absarc(0, 0, radius, -alpha, alpha, false);
  // Top flat cut -> Left arc: PI - alpha -> PI + alpha
  shape.absarc(0, 0, radius, Math.PI - alpha, Math.PI + alpha, false);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.08, thickness * 0.24),
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 36
  });
  // ExtrudeGeometry extrudes along +Z_local; rotateY(+PI/2) maps local +Z -> world +X (optical axis!)
  geo.translate(0, 0, -thickness * 0.5);
  geo.rotateY(Math.PI / 2);

  const body = new THREE.Mesh(geo, mat);
  grp.add(body);

  // Subtle curved optical surface bulge / concave ring cue on front & back faces
  const capR = Math.min(radius * 0.74, h * 0.88);
  const capGeo = new THREE.SphereGeometry(capR, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.34);
  const frontCap = new THREE.Mesh(capGeo, mat);
  frontCap.rotation.z = sagSign > 0 ? -Math.PI / 2 : Math.PI / 2;
  frontCap.scale.set(1, 0.32, 1);
  frontCap.position.set(sagSign > 0 ? thickness * 0.36 : thickness * 0.54, 0, 0);
  grp.add(frontCap);

  return grp;
}

/**
 * Helper: Builds a straight cylindrical rod between two 3D points pA and pB.
 */
function buildRod(pA, pB, radius, mat) {
  const dir = pB.clone().sub(pA);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 14), mat);
  mesh.position.copy(pA).add(pB).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/**
 * Phase 13 (400-PART / 14-SCALE MILESTONE!):
 * Flagship Continuous True Optical Zoom Periscope (85-170 mm / 3.5x-7.1x Dual-Group Parfocal Moving Zoom)
 * + Twin 110 kHz Ultrasonic Piezoelectric Linear Motors (Zero Magnets, Zero Gears, 0 mW Power-Off Lock!)
 * + 10,000x Perovskite PZT (Pb[Zr,Ti]O3) Ferroelectric Atomic Dipole Lattice
 * + 500x Ultrasonic Elliptical Friction-Tip Micro-Drive Inset (32 Independent 3D CAD Parts!)
 *
 * Exact Zero-Collision Optical & Mechanical Layout:
 *   - Entrance Vertical Axis: X_IN = -7.65 (down into 45° Fold Prism -> reflects +X along Y_OPT = +0.55!)
 *   - Fixed Front G1: X = -5.45
 *   - LIVE MOVING Zoom Variator G2: X_REST = -2.45 (sweeps X ∈ [-3.65, -1.25] for 85 <-> 170 mm!)
 *   - LIVE NON-LINEAR PARFOCAL Compensator G3: X_REST = +0.95 (parabolic U-turn X ∈ [+0.23, +1.12]!)
 *   - Fixed Rear Flattener G4: X = +2.85 | Vertical IRCF: X = +3.85 | Vertical BSI CMOS: X = +4.45
 *   - Twin Rear Ceramic Guide Shafts: Z = -1.78 (Y = +1.95 & Y = -0.85) -> 100% open front optical sightline!
 *   - Twin Front 110 kHz Ultrasonic Piezo Motors:
 *       * G2 Upper Track (Y = +1.70, Z = +2.38) contacting G2's long upper alumina slider bar (len = 2.90)
 *       * G3 Lower Track (Y = -0.58, Z = +2.38) contacting G3's lower alumina slider bar (len = 2.10)
 *   - Right-Hand Twin-Scale Physics Showcase (X_MIC = +10.6):
 *       * Upper Tier (Y = +2.25): 10,000x Perovskite Pb(Zr,Ti)O3 Tetragonal Unit Cell (Pb2+, O6 Octahedron, live Ti4+ dipole!)
 *       * Lower Tier (Y = -1.65): 500x Ultrasonic Horn + Live Orbiting Ruby-Alumina Friction Tip on Elliptical Ring!
 */
export function buildContinuousZoomAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'ContinuousZoomRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // Shared optical coordinates
  const X_IN = -7.65;
  const Y_OPT = 0.55;
  const X_G1 = -5.45;
  const X_G2 = -2.45;
  const X_G3 = 0.95;
  const X_G4 = 2.85;
  const X_IRCF = 3.85;
  const X_CMOS = 4.45;

  // Rear guide rails & front piezo tracks
  const Z_RAIL = -1.78;
  const Y_RAIL_TOP = 1.95;
  const Y_RAIL_BOT = -0.85;
  const Z_SLIDER = 1.78;
  const Z_PIEZO = 2.38;
  const Y_G2_TRACK = 1.70;
  const Y_G3_TRACK = -0.58;

  // Right-hand Twin-Scale Physics Showcase
  const X_MIC = 10.6;
  const Y_CELL = 2.25;
  const Y_TIP = -1.55;

  // =========================================================================
  // GROUP 1: HOUSING, 45° FOLD PRISM & FIXED FRONT OBJECTIVE G1 (01-05)
  // =========================================================================

  // 01. Non-Magnetic SUS304 Front-Cutaway Long-Tunnel EMI Shield Can
  const shieldGrp = new THREE.Group();
  {
    // Back wall (-Z = -2.85) spanning entire horizontal periscope tunnel
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(15.2, 5.4, 0.20), mats.susSteel);
    backWall.position.set(-2.05, 0.35, -2.85);
    shieldGrp.add(backWall);

    // Matte black interior stray-light liner on back wall
    const backLiner = new THREE.Mesh(new THREE.BoxGeometry(14.8, 5.0, 0.05), mats.susDarkInner);
    backLiner.position.set(-2.05, 0.35, -2.72);
    shieldGrp.add(backLiner);

    // Left end cap wall (-X = -9.65)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.20, 5.4, 5.6), mats.susSteel);
    leftWall.position.set(-9.65, 0.35, -0.05);
    shieldGrp.add(leftWall);

    // Rear-half upper roof shelf (leaves entrance aperture & front moving zoom lenses crystal clear!)
    const roofRear = new THREE.Mesh(new THREE.BoxGeometry(11.3, 0.20, 2.2), mats.susSteel);
    roofRear.position.set(-0.25, 2.95, -1.75);
    shieldGrp.add(roofRear);

    // Right rear corner vertical stiffener stub (leaves vertical sensor + copper heatsink unobstructed!)
    const rightCorner = new THREE.Mesh(new THREE.BoxGeometry(0.20, 5.4, 1.55), mats.susSteel);
    rightCorner.position.set(5.45, 0.35, -2.08);
    shieldGrp.add(rightCorner);
  }
  register('zm_emi_shield_can', shieldGrp, [-1.8, 5.4, -2.8]);

  // 02. Entrance Optical AR Window & Rectangular Stray-Light Mask (above 45° fold prism)
  const winGrp = new THREE.Group();
  {
    // Matte-black rectangular mask bezel with aperture opening centered at X_IN = -7.65
    const outerShape = new THREE.Shape();
    outerShape.moveTo(-1.85, -1.95);
    outerShape.lineTo(1.85, -1.95);
    outerShape.lineTo(1.85, 1.95);
    outerShape.lineTo(-1.85, 1.95);
    outerShape.closePath();

    const hole = new THREE.Path();
    hole.absellipse(0, 0, 1.25, 1.48, 0, Math.PI * 2, true, 0);
    outerShape.holes.push(hole);

    const maskGeo = new THREE.ExtrudeGeometry(outerShape, { depth: 0.24, bevelEnabled: false });
    maskGeo.rotateX(Math.PI / 2);
    const maskMesh = new THREE.Mesh(maskGeo, mats.lcpBlack);
    maskMesh.position.set(X_IN, 3.06, 0);
    winGrp.add(maskMesh);

    // Clear Sapphire AR Window pane
    const arPane = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.16, 3.15), mats.lensSapphire);
    arPane.position.set(X_IN, 2.94, 0);
    winGrp.add(arPane);

    // Iridescent dielectric AR coating sheen rim
    const arRim = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.04, 3.26), mats.ircfCoating);
    arRim.position.set(X_IN, 3.04, 0);
    winGrp.add(arRim);
  }
  register('zm_entrance_ar_window', winGrp, [-2.2, 4.6, 0.5]);

  // 03. High-Index 45° TIR Fold Prism (Centered at X_IN = -7.65, Y_OPT = +0.55)
  // Exact 45° hypotenuse with normal (+1/√2, +1/√2) reflects vertical DOWN ray (-Y) -> horizontal RIGHT (+X)!
  const prismGrp = new THREE.Group();
  prismGrp.position.set(X_IN, Y_OPT, 0);
  {
    // Local vertices around (0, 0): A=(-1.35, +1.35), B=(+1.35, -1.35), C=(+1.35, +1.35)
    const pShape = new THREE.Shape();
    pShape.moveTo(-1.35, 1.35);
    pShape.lineTo(1.35, -1.35);
    pShape.lineTo(1.35, 1.35);
    pShape.closePath();

    const pGeo = new THREE.ExtrudeGeometry(pShape, {
      depth: 3.10,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    pGeo.translate(0, 0, -1.55);
    const prismBody = new THREE.Mesh(pGeo, mats.tpPrismGlass);
    prismGrp.add(prismBody);

    // Protected silver-dielectric 45° TIR mirror film on exact hypotenuse (-1.35, 1.35) -> (+1.35, -1.35)
    const hypLen = Math.hypot(2.70, 2.70);
    const hypMirror = new THREE.Mesh(new THREE.BoxGeometry(hypLen, 0.09, 3.06), mats.tpMirrorSilver);
    hypMirror.position.set(-0.04, -0.04, 0);
    hypMirror.rotation.z = -Math.PI / 4;
    prismGrp.add(hypMirror);

    // Top entrance AR coating film & right exit AR coating film
    const topAr = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.04, 3.02), mats.ircfCoating);
    topAr.position.set(0, 1.38, 0);
    prismGrp.add(topAr);

    const exitAr = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.62, 3.02), mats.ircfCoating);
    exitAr.position.set(1.38, 0, 0);
    prismGrp.add(exitAr);
  }
  register('zm_45deg_tir_prism', prismGrp, [-2.8, 1.8, 1.2], { zoomPrismOis: true });

  // 04. 2-Axis Prism Tilt OIS Gimbal Cradle & Mini VCM Coils
  const cradleGrp = new THREE.Group();
  cradleGrp.position.set(X_IN, Y_OPT, 0);
  {
    // Sloped aluminum/LCP cradle backing behind 45° hypotenuse
    const backSlope = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.24, 3.35), mats.oisCarrierPcb);
    backSlope.position.set(-0.24, -0.24, 0);
    backSlope.rotation.z = -Math.PI / 4;
    cradleGrp.add(backSlope);

    // Lower cradle foot & 2-axis gimbal pivot ball/yoke
    const foot = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.28, 3.35), mats.lcpBlack);
    foot.position.set(-0.25, -1.68, 0);
    cradleGrp.add(foot);

    // Twin mini Pitch/Yaw OIS VCM copper coils + NdFeB magnets under & behind prism cradle
    const pitchCoil = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.15), mats.copperCoil);
    pitchCoil.position.set(-0.10, -1.94, 0.85);
    cradleGrp.add(pitchCoil);

    const yawCoil = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.15), mats.copperCoil);
    yawCoil.position.set(-0.10, -1.94, -0.85);
    cradleGrp.add(yawCoil);

    // Gimbal pivot pins protruding cleanly along ±Z
    for (const s of [-1, 1]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 16), mats.susSteel);
      pin.rotation.x = Math.PI / 2;
      pin.position.set(-0.92, -0.92, s * 1.80);
      cradleGrp.add(pin);
    }
  }
  register('zm_prism_ois_cradle', cradleGrp, [-3.4, -1.8, 1.4], { zoomPrismOis: true });

  // 05. Fixed Front Objective D-Cut Positive Lens Group G1 (X = -5.45)
  const g1Grp = new THREE.Group();
  {
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-1.72, -1.38);
    frameShape.lineTo(1.72, -1.38);
    frameShape.lineTo(1.72, 1.38);
    frameShape.lineTo(-1.72, 1.38);
    frameShape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 1.44, -0.94, 0.94, false);
    hole.absarc(0, 0, 1.44, Math.PI - 0.94, Math.PI + 0.94, false);
    hole.closePath();
    frameShape.holes.push(hole);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.78, bevelEnabled: false });
    frameGeo.translate(0, 0, -0.39);
    frameGeo.rotateY(Math.PI / 2);
    const frameMesh = new THREE.Mesh(frameGeo, mats.lcpBlack);
    frameMesh.position.set(X_G1, Y_OPT, 0);
    g1Grp.add(frameMesh);

    // G1 Positive GMO Aspheric + ED Cemented Doublet
    g1Grp.add(buildDcutLensElement(X_G1 - 0.16, Y_OPT, 0, 1.44, 1.16, 0.34, +1, mats.zmDcutGlass));
    g1Grp.add(buildDcutLensElement(X_G1 + 0.19, Y_OPT, 0, 1.42, 1.14, 0.24, -1, mats.zmDcutFlint));
  }
  register('zm_fixed_g1_group', g1Grp, [-1.4, 2.4, 0.4]);

  // =========================================================================
  // GROUP 2: DUAL MOVING PARFOCAL ZOOM GROUPS (G2 + G3) & RAILS (06-13)
  // =========================================================================

  // 06. LIVE MOVING Zoom Variator Group G2 (Negative APO D-Cut Doublet at X_G2 = -2.45)
  const g2LensGrp = new THREE.Group();
  {
    g2LensGrp.add(buildDcutLensElement(X_G2 - 0.15, Y_OPT, 0, 1.34, 1.06, 0.28, -1, mats.zmDcutGlass));
    g2LensGrp.add(buildDcutLensElement(X_G2 + 0.15, Y_OPT, 0, 1.32, 1.04, 0.24, +1, mats.zmDcutFlint));
  }
  register('zm_variator_g2_lens', g2LensGrp, [-0.5, 3.1, 0.9], { zoomG2Moving: true });

  // 07. LIVE MOVING G2 Carbon-LCP Carriage (connects rear rails Z=-1.78 to front upper piezo track Y=+1.70!)
  const g2CarGrp = new THREE.Group();
  {
    // Hollow D-cut lens housing ring
    const cShape = new THREE.Shape();
    cShape.moveTo(-1.58, -1.24);
    cShape.lineTo(1.58, -1.24);
    cShape.lineTo(1.58, 1.24);
    cShape.lineTo(-1.58, 1.24);
    cShape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 1.32, -0.92, 0.92, false);
    hole.absarc(0, 0, 1.32, Math.PI - 0.92, Math.PI + 0.92, false);
    hole.closePath();
    cShape.holes.push(hole);

    const cGeo = new THREE.ExtrudeGeometry(cShape, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    cGeo.translate(0, 0, -0.36);
    cGeo.rotateY(Math.PI / 2);
    const carBody = new THREE.Mesh(cGeo, mats.oisCarrierPcb);
    carBody.position.set(X_G2, Y_OPT, 0);
    g2CarGrp.add(carBody);

    // Rear upper & lower boss arms reaching back to twin ceramic guide shafts (Z = -1.78)
    const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.56), mats.lcpBlack);
    armTop.position.set(X_G2, Y_RAIL_TOP, Z_RAIL + 0.12);
    g2CarGrp.add(armTop);

    const armBot = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.40, 0.56), mats.lcpBlack);
    armBot.position.set(X_G2, Y_RAIL_BOT, Z_RAIL + 0.12);
    g2CarGrp.add(armBot);

    // Front UPPER bracket tab supporting G2's long upper alumina friction slider (Y = +1.70, Z = +1.64)
    const sliderTab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.46), mats.oisCarrierPcb);
    sliderTab.position.set(X_G2, Y_G2_TRACK, 1.48);
    g2CarGrp.add(sliderTab);
  }
  register('zm_variator_g2_carriage', g2CarGrp, [-0.5, 1.6, 1.4], { zoomG2Moving: true });

  // 08. LIVE NON-LINEAR PARFOCAL Compensator / Focus Group G3 (Positive Aspheric Doublet at X_G3 = +0.95)
  const g3LensGrp = new THREE.Group();
  {
    g3LensGrp.add(buildDcutLensElement(X_G3 - 0.14, Y_OPT, 0, 1.32, 1.04, 0.30, +1, mats.zmDcutFlint));
    g3LensGrp.add(buildDcutLensElement(X_G3 + 0.16, Y_OPT, 0, 1.30, 1.02, 0.24, +1, mats.zmDcutGlass));
  }
  register('zm_compensator_g3_lens', g3LensGrp, [0.8, 3.1, 0.9], { zoomG3Moving: true });

  // 09. LIVE MOVING G3 Independent Parfocal Carriage (front LOWER piezo track Y = -0.58 -> zero overlap with G2!)
  const g3CarGrp = new THREE.Group();
  {
    const cShape = new THREE.Shape();
    cShape.moveTo(-1.56, -1.22);
    cShape.lineTo(1.56, -1.22);
    cShape.lineTo(1.56, 1.22);
    cShape.lineTo(-1.56, 1.22);
    cShape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 1.30, -0.92, 0.92, false);
    hole.absarc(0, 0, 1.30, Math.PI - 0.92, Math.PI + 0.92, false);
    hole.closePath();
    cShape.holes.push(hole);

    const cGeo = new THREE.ExtrudeGeometry(cShape, { depth: 0.70, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    cGeo.translate(0, 0, -0.35);
    cGeo.rotateY(Math.PI / 2);
    const carBody = new THREE.Mesh(cGeo, mats.siliconPhotodiode);
    carBody.position.set(X_G3, Y_OPT, 0);
    g3CarGrp.add(carBody);

    // Rear upper & lower boss arms to twin ceramic guide shafts (Z = -1.78)
    const armTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.40, 0.56), mats.lcpBlack);
    armTop.position.set(X_G3, Y_RAIL_TOP, Z_RAIL + 0.12);
    g3CarGrp.add(armTop);

    const armBot = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.56), mats.lcpBlack);
    armBot.position.set(X_G3, Y_RAIL_BOT, Z_RAIL + 0.12);
    g3CarGrp.add(armBot);

    // Front LOWER bracket tab supporting G3's lower alumina friction slider (Y = -0.58, Z = +1.48)
    const sliderTab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.46), mats.siliconPhotodiode);
    sliderTab.position.set(X_G3, Y_G3_TRACK, 1.48);
    g3CarGrp.add(sliderTab);
  }
  register('zm_compensator_g3_carriage', g3CarGrp, [0.8, 1.6, 1.4], { zoomG3Moving: true });

  // 10. Fixed Rear Field Flattener & Telecentric Relay Lens G4 (X = +2.85)
  const g4Grp = new THREE.Group();
  {
    const fShape = new THREE.Shape();
    fShape.moveTo(-1.58, -1.28);
    fShape.lineTo(1.58, -1.28);
    fShape.lineTo(1.58, 1.28);
    fShape.lineTo(-1.58, 1.28);
    fShape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, 1.28, -0.92, 0.92, false);
    hole.absarc(0, 0, 1.28, Math.PI - 0.92, Math.PI + 0.92, false);
    hole.closePath();
    fShape.holes.push(hole);

    const fGeo = new THREE.ExtrudeGeometry(fShape, { depth: 0.54, bevelEnabled: false });
    fGeo.translate(0, 0, -0.27);
    fGeo.rotateY(Math.PI / 2);
    const fMesh = new THREE.Mesh(fGeo, mats.lcpBlack);
    fMesh.position.set(X_G4, Y_OPT, 0);
    g4Grp.add(fMesh);

    g4Grp.add(buildDcutLensElement(X_G4, Y_OPT, 0, 1.28, 1.02, 0.28, -1, mats.zmDcutGlass));
  }
  register('zm_fixed_g4_flattener', g4Grp, [1.8, 2.4, 0.4]);

  // 11. Twin Ground Hardened SUS440C / Ceramic Parallel Guide Shafts (Rear wall Z = -1.78)
  const shaftsGrp = new THREE.Group();
  {
    for (const yRail of [Y_RAIL_TOP, Y_RAIL_BOT]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 9.2, 20), mats.zmGuideShaft);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(-1.15, yRail, Z_RAIL);
      shaftsGrp.add(rod);

      // End precision mounting brackets at X = -5.75 and X = +3.45
      for (const xEnd of [-5.75, 3.45]) {
        const blk = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.54), mats.oisCarrierPcb);
        blk.position.set(xEnd, yRail, Z_RAIL);
        shaftsGrp.add(blk);
      }
    }
  }
  register('zm_ceramic_guide_shafts', shaftsGrp, [-0.2, 1.8, -2.4]);

  // 12. 4× Flanged PTFE / Bronze Oilless Sub-Micron Sliding Bushings (2 follow G2, 2 follow G3!)
  const bushGrp = new THREE.Group();
  const bushG2Sub = new THREE.Group();
  const bushG3Sub = new THREE.Group();
  {
    const makeBushing = (xPos, yPos, len) => {
      const b = new THREE.Group();
      b.position.set(xPos, yPos, Z_RAIL);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, len, 20), mats.zmPtfeBushing);
      sleeve.rotation.z = Math.PI / 2;
      b.add(sleeve);
      for (const s of [-1, 1]) {
        const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), mats.zmPtfeBushing);
        flange.rotation.z = Math.PI / 2;
        flange.position.x = s * (len * 0.46);
        b.add(flange);
      }
      return b;
    };
    bushG2Sub.add(makeBushing(X_G2, Y_RAIL_TOP, 1.12));
    bushG2Sub.add(makeBushing(X_G2, Y_RAIL_BOT, 0.84));
    bushG3Sub.add(makeBushing(X_G3, Y_RAIL_TOP, 0.84));
    bushG3Sub.add(makeBushing(X_G3, Y_RAIL_BOT, 1.12));
    bushGrp.add(bushG2Sub, bushG3Sub);
    bushGrp.userData.zoomBushingG2 = bushG2Sub;
    bushGrp.userData.zoomBushingG3 = bushG3Sub;
  }
  register('zm_oilless_sleeve_bushings', bushGrp, [0.0, 2.4, -1.6]);

  // 13. Matte-Black LCP Optical Tunnel Floor & 12 Sawtooth Stray-Light Baffles
  const baffleGrp = new THREE.Group();
  {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.24, 4.4), mats.lcpBlack);
    floor.position.set(-1.35, -1.68, -0.25);
    baffleGrp.add(floor);

    // 12 precision sawtooth knife-edge stray-light baffles spanning optical tunnel floor
    for (let i = 0; i < 12; i++) {
      const bx = -5.65 + i * 0.78;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 3.65), mats.susDarkInner);
      fin.position.set(bx, -1.42, -0.15);
      fin.rotation.z = 0.28;
      baffleGrp.add(fin);
    }
  }
  register('zm_optical_tunnel_baffles', baffleGrp, [-0.4, -1.8, -0.6]);

  // =========================================================================
  // GROUP 3: TWIN 110 kHz ULTRASONIC PIEZOELECTRIC LINEAR MOTORS (14-20)
  // =========================================================================

  // 14. G2 Ultrasonic 110 kHz Co-Fired Multilayer PZT Piezo Stator Beam (Front Upper Track)
  const piezoG2Grp = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.54, 0.56), mats.zmPztCeramic);
    body.position.set(X_G2, Y_G2_TRACK, Z_PIEZO);
    piezoG2Grp.add(body);

    // Side metallic Ag-Pd termination electrodes (Phase A & Phase B quadrature drive terminals!)
    for (const dx of [-0.54, 0.54]) {
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.58, 0.06), mats.zmAgPdElectrode);
      term.position.set(X_G2 + dx, Y_G2_TRACK, Z_PIEZO + 0.29);
      piezoG2Grp.add(term);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 14), mats.goldBond);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(X_G2 + dx, Y_G2_TRACK, Z_PIEZO + 0.34);
      piezoG2Grp.add(pad);
    }
  }
  register('zm_piezo_stator_g2', piezoG2Grp, [-0.8, 1.4, 3.6]);

  // 15. G3 Ultrasonic 110 kHz Co-Fired Multilayer PZT Piezo Stator Beam (Front Lower Track at X = +0.72)
  const X_PIEZO_G3 = 0.72;
  const piezoG3Grp = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.54, 0.56), mats.zmPztCeramic);
    body.position.set(X_PIEZO_G3, Y_G3_TRACK, Z_PIEZO);
    piezoG3Grp.add(body);

    for (const dx of [-0.48, 0.48]) {
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.06), mats.zmAgPdElectrode);
      term.position.set(X_PIEZO_G3 + dx, Y_G3_TRACK, Z_PIEZO + 0.29);
      piezoG3Grp.add(term);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 14), mats.goldBond);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(X_PIEZO_G3 + dx, Y_G3_TRACK, Z_PIEZO + 0.34);
      piezoG3Grp.add(pad);
    }
  }
  register('zm_piezo_stator_g3', piezoG3Grp, [1.0, -0.6, 3.6]);

  // 16. Twin Wear-Resistant Ruby/Alumina Elliptical-Motion Driving Friction Tips (LIVE micro-elliptical orbit!)
  const tipsGrp = new THREE.Group();
  const tipG2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.36, 20), mats.zmRubyTip);
  tipG2Mesh.rotation.x = Math.PI / 2;
  tipG2Mesh.position.set(X_G2, Y_G2_TRACK, Z_SLIDER + 0.22);
  tipG2Mesh.userData.basePos = tipG2Mesh.position.clone();

  const tipG3Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.36, 20), mats.zmRubyTip);
  tipG3Mesh.rotation.x = Math.PI / 2;
  tipG3Mesh.position.set(X_PIEZO_G3, Y_G3_TRACK, Z_SLIDER + 0.22);
  tipG3Mesh.userData.basePos = tipG3Mesh.position.clone();

  // Ceramic mounting collars behind both ruby tips
  const colG2 = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 20), mats.zmAluminaCeramic);
  colG2.rotation.x = Math.PI / 2;
  colG2.position.set(X_G2, Y_G2_TRACK, Z_SLIDER + 0.34);
  const colG3 = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 20), mats.zmAluminaCeramic);
  colG3.rotation.x = Math.PI / 2;
  colG3.position.set(X_PIEZO_G3, Y_G3_TRACK, Z_SLIDER + 0.34);

  tipsGrp.add(tipG2Mesh, tipG3Mesh, colG2, colG3);
  tipsGrp.userData.zoomTipG2 = tipG2Mesh;
  tipsGrp.userData.zoomTipG3 = tipG3Mesh;
  register('zm_alumina_friction_tips', tipsGrp, [0.2, 0.6, 2.8]);

  // 17. Twin Lapped Alumina Friction Runner Bars (Bonded onto G2 upper & G3 lower carriages -> MOVE WITH CARRIAGES!)
  const slidersGrp = new THREE.Group();
  const sliderG2Sub = new THREE.Group();
  const sliderG3Sub = new THREE.Group();
  {
    // G2 upper alumina bar (len = 2.90, keeps solid contact with stationary tip at X = -2.45 across full ±1.20 sweep!)
    const barG2 = new THREE.Mesh(new THREE.BoxGeometry(2.90, 0.34, 0.20), mats.zmAluminaCeramic);
    barG2.position.set(X_G2, Y_G2_TRACK, Z_SLIDER);
    const backG2 = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.40, 0.08), mats.oisCarrierPcb);
    backG2.position.set(X_G2, Y_G2_TRACK, Z_SLIDER - 0.14);
    sliderG2Sub.add(barG2, backG2);

    // G3 lower alumina bar (len = 2.15, keeps solid contact with stationary tip at X = +0.72 across full parabolic curve!)
    const barG3 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.34, 0.20), mats.zmAluminaCeramic);
    barG3.position.set(X_G3, Y_G3_TRACK, Z_SLIDER);
    const backG3 = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.40, 0.08), mats.siliconPhotodiode);
    backG3.position.set(X_G3, Y_G3_TRACK, Z_SLIDER - 0.14);
    sliderG3Sub.add(barG3, backG3);

    slidersGrp.add(sliderG2Sub, sliderG3Sub);
    slidersGrp.userData.zoomSliderG2 = sliderG2Sub;
    slidersGrp.userData.zoomSliderG3 = sliderG3Sub;
  }
  register('zm_alumina_slider_bars', slidersGrp, [0.1, 0.5, 2.2]);

  // 18. Twin BeCu 8 gf Constant-Force Friction Preload Leaf Springs (Pressing nodal points of PZT stators!)
  const springsGrp = new THREE.Group();
  {
    const buildPreloadClip = (cx, cy) => {
      const g = new THREE.Group();
      // U-shaped bow spring hugging the front face of PZT stator at its vibration nodes
      const spanBar = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.18, 0.08), mats.beCuSpring);
      spanBar.position.set(cx, cy, Z_PIEZO + 0.46);
      g.add(spanBar);

      // Twin nodal contact fingers pressing PZT beam inward (-Z)
      for (const dx of [-0.62, 0.62]) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.18), mats.beCuSpring);
        finger.position.set(cx + dx, cy, Z_PIEZO + 0.36);
        g.add(finger);
      }

      // Left & right mounting anchor ears bolted to module frame
      for (const sx of [-1.28, 1.28]) {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.48), mats.beCuSpring);
        ear.position.set(cx + sx, cy, Z_PIEZO + 0.26);
        g.add(ear);
      }
      return g;
    };
    springsGrp.add(buildPreloadClip(X_G2, Y_G2_TRACK));
    springsGrp.add(buildPreloadClip(X_PIEZO_G3, Y_G3_TRACK));
  }
  register('zm_preload_leaf_springs', springsGrp, [0.2, 0.4, 4.4]);

  // 19. Twin Sub-Micron Optical / TMR Linear Encoder Scale Strips & Readheads
  const encGrp = new THREE.Group();
  const encReadG2 = new THREE.Group();
  const encReadG3 = new THREE.Group();
  {
    // Long optical/TMR zebra grating scale strip spanning the full zoom range along upper-rear ledge
    const scaleStrip = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 0.56), mats.zmEncoderScale);
    scaleStrip.position.set(-0.95, 2.38, -1.18);
    encGrp.add(scaleStrip);

    // G2 moving optical readhead hovering cleanly above scale strip
    const headG2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.44), mats.icPackageDark);
    headG2.position.set(X_G2, 2.56, -1.18);
    const ledG2 = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.18), mats.tpGoosGauge);
    ledG2.position.set(X_G2, 2.45, -1.18);
    encReadG2.add(headG2, ledG2);

    // G3 moving optical readhead hovering cleanly above scale strip
    const headG3 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.44), mats.icPackageDark);
    headG3.position.set(X_G3, 2.56, -1.18);
    const ledG3 = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.18), mats.tpGoosGauge);
    ledG3.position.set(X_G3, 2.45, -1.18);
    encReadG3.add(headG3, ledG3);

    encGrp.add(encReadG2, encReadG3);
    encGrp.userData.zoomEncG2 = encReadG2;
    encGrp.userData.zoomEncG3 = encReadG3;
  }
  register('zm_optical_linear_encoders', encGrp, [0.0, 3.6, -1.4]);

  // 20. Dual-Channel 110 kHz ±90° Quadrature Piezo Driver ASIC + Parfocal DSP + 01005 MLCCs
  const asicGrp = new THREE.Group();
  {
    const die = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.30, 1.45), mats.icPackageDark);
    die.position.set(-5.35, -1.96, 1.65);
    asicGrp.add(die);

    // Laser pin-1 marker dot & copper heat-slug ring
    const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.04, 14), mats.goldBond);
    pin1.position.set(-5.98, -1.80, 1.18);
    asicGrp.add(pin1);

    // High-Q boost chip inductor beside driver ASIC
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.42, 0.86), mats.siliconBulkSide);
    ind.position.set(-3.75, -1.90, 1.72);
    asicGrp.add(ind);

    // 6× 01005 decoupling MLCC capacitors along power rail
    for (let i = 0; i < 6; i++) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), mats.mlccCeramic);
      cap.position.set(-6.05 + i * 0.34, -2.04, 2.58);
      asicGrp.add(cap);
    }
  }
  register('zm_piezo_driver_asic', asicGrp, [-1.4, -2.8, 2.6]);

  // =========================================================================
  // GROUP 4: VERTICAL TELEPHOTO CMOS SENSOR & L-RIGID-FLEX (21-25)
  // =========================================================================

  // 21. Vertical Cu2+ Blue-Glass & Dielectric IRCF (X = +3.85)
  const ircfGrp = new THREE.Group();
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.75, 3.32), mats.blueGlassIrcf);
    glass.position.set(X_IRCF, Y_OPT, 0);
    ircfGrp.add(glass);

    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.68, 3.24), mats.ircfCoating);
    coat.position.set(X_IRCF - 0.10, Y_OPT, 0);
    ircfGrp.add(coat);

    // Thin matte-black IRCF perimeter holder frame
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 3.48), mats.lcpBlack);
    topBar.position.set(X_IRCF, Y_OPT + 1.44, 0);
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 3.48), mats.lcpBlack);
    botBar.position.set(X_IRCF, Y_OPT - 1.44, 0);
    ircfGrp.add(topBar, botBar);
  }
  register('zm_vertical_blue_ircf', ircfGrp, [2.6, 1.2, 0.6]);

  // 22. 90° Vertical Stacked BSI Exmor-RS Telephoto CMOS Sensor + Gold Wire-Bonds (X = +4.45)
  const cmosGrp = new THREE.Group();
  {
    // Silicon stacked die body
    const siBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.55, 3.12), mats.siliconBulkSide);
    siBody.position.set(X_CMOS + 0.08, Y_OPT, 0);
    cmosGrp.add(siBody);

    // Iridescent Bayer optical surface facing -X toward zoom lenses!
    const optFace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.24, 2.82), mats.sensorOpticalSurface);
    optFace.position.set(X_CMOS - 0.04, Y_OPT, 0);
    cmosGrp.add(optFace);

    // 28 fine Φ20 μm gold wire-bond loops along top & bottom edges of vertical die
    for (let i = 0; i < 14; i++) {
      const wz = -1.30 + i * 0.20;
      for (const sy of [-1, 1]) {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), mats.goldBond);
        wire.position.set(X_CMOS + 0.14, Y_OPT + sy * 1.38, wz);
        wire.rotation.z = sy * 0.55;
        cmosGrp.add(wire);
      }
    }
  }
  register('zm_vertical_cmos_sensor', cmosGrp, [3.4, 0.5, 0.4]);

  // 23. Vertical Pure-Copper Thermal Spreader & Graphite Pad (X = +5.10)
  const heatGrp = new THREE.Group();
  {
    const cuPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.85, 4.35), mats.copperPad);
    cuPlate.position.set(5.12, Y_OPT - 0.15, 0);
    heatGrp.add(cuPlate);

    const graphite = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.55, 4.05), mats.susDarkInner);
    graphite.position.set(5.27, Y_OPT - 0.15, 0);
    heatGrp.add(graphite);
  }
  register('zm_copper_heatsink_plate', heatGrp, [4.6, -0.4, 0.0]);

  // 24. L-Shaped Main Control Rigid PCB & 90° Vertical Sensor Riser Board
  const pcbGrp = new THREE.Group();
  {
    // Horizontal bottom control PCB
    const horiz = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.26, 5.7), mats.rigidPcb);
    horiz.position.set(-2.35, -2.25, 0.05);
    pcbGrp.add(horiz);

    // 90° Vertical sensor riser PCB directly behind vertical CMOS die
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.26, 4.55, 4.75), mats.rigidPcb);
    vert.position.set(4.78, -0.08, 0);
    pcbGrp.add(vert);

    // Corner rigid-flex 90° polyimide transition bridge flush along Z axis
    const bend = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 4.72), mats.fpcPolyimide);
    bend.position.set(4.74, -2.20, 0);
    pcbGrp.add(bend);
  }
  register('zm_l_rigid_pcb', pcbGrp, [0.4, -3.4, 0.2]);

  // 25. EMI-Shielded MIPI CSI-2 Polyimide FPC & 30-Pin Gold BTB Connector
  const fpcGrp = new THREE.Group();
  {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 2.25), mats.fpcPolyimide);
    ribbon.position.set(-7.15, -2.28, 3.65);
    fpcGrp.add(ribbon);

    // 30-pin gold BTB connector housing at distal end of FPC
    const btbBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 0.72), mats.lcpBlack);
    btbBody.position.set(-7.15, -2.38, 4.68);
    fpcGrp.add(btbBody);

    for (let i = 0; i < 15; i++) {
      const px = -8.12 + i * 0.14;
      for (const dz of [-0.26, 0.26]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.14), mats.goldBond);
        pin.position.set(px, -2.22, 4.68 + dz);
        fpcGrp.add(pin);
      }
    }
  }
  register('zm_mipi_fpc_btb', fpcGrp, [-2.2, -3.6, 3.8]);

  // =========================================================================
  // GROUP 5: 10,000x PEROVSKITE PZT CRYSTAL LATTICE & 500x ELLIPTICAL TIP (26-32)
  // =========================================================================
  const S = 1.38; // Half-width of magnified tetragonal perovskite unit cell

  // 26. 10,000x Top & Bottom Ag-Pd Co-Fired Internal Piezo Electrodes
  const elecGrp = new THREE.Group();
  const topElecSub = new THREE.Group();
  {
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.22, 3.85), mats.zmAgPdElectrode);
    topPlate.position.set(X_MIC, Y_CELL + S + 0.42, 0);
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.06, 3.65), mats.goldBond);
    topCap.position.set(X_MIC, Y_CELL + S + 0.55, 0);
    topElecSub.add(topPlate, topCap);

    const botPlate = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.22, 3.85), mats.zmAgPdElectrode);
    botPlate.position.set(X_MIC, Y_CELL - S - 0.42, 0);
    const botCap = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.06, 3.65), mats.goldBond);
    botCap.position.set(X_MIC, Y_CELL - S - 0.55, 0);

    elecGrp.add(topElecSub, botPlate, botCap);
    elecGrp.userData.zoomTopElectrode = topElecSub;
  }
  register('zm_micro_pzt_electrodes', elecGrp, [3.2, 3.8, 0.2]);

  // 27. 10,000x Perovskite Pb2+ Corner Cations (8 Large Metallic Spheres + Tetragonal Unit-Cell Frame)
  const pbGrp = new THREE.Group();
  const pbStretch = new THREE.Group();
  pbStretch.position.set(X_MIC, Y_CELL - S, 0);
  {
    const pbGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const corners = [];
    for (const sx of [-1, 1]) {
      for (const sy of [0, 2]) {
        for (const sz of [-1, 1]) {
          const p = new THREE.Vector3(sx * S, sy * S, sz * S);
          corners.push(p);
          const sp = new THREE.Mesh(pbGeo, mats.zmPbCation);
          sp.position.copy(p);
          pbStretch.add(sp);
        }
      }
    }
    // 12 sleek metallic unit-cell lattice edges
    const edges = [
      [0, 1], [2, 3], [4, 5], [6, 7], // Z edges
      [0, 2], [1, 3], [4, 6], [5, 7], // Y edges (c-axis)
      [0, 4], [1, 5], [2, 6], [3, 7]  // X edges
    ];
    for (const [i, j] of edges) {
      pbStretch.add(buildRod(corners[i], corners[j], 0.045, mats.susSteel));
    }
    pbGrp.add(pbStretch);
    pbGrp.userData.zoomLatticeStretch = pbStretch;
  }
  register('zm_micro_pb_corners', pbGrp, [3.8, 2.2, -0.6]);

  // 28. 10,000x O2- Face-Centered Oxygen Octahedron (O6) Cage (6 Emerald Spheres + 12 Octahedral Struts + Translucent Facets!)
  const oxGrp = new THREE.Group();
  const oxStretch = new THREE.Group();
  oxStretch.position.set(X_MIC, Y_CELL - S, 0);
  {
    const oxGeo = new THREE.SphereGeometry(0.24, 22, 22);
    const oxPts = [
      new THREE.Vector3(+S, S, 0),
      new THREE.Vector3(-S, S, 0),
      new THREE.Vector3(0, 2 * S, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, S, +S),
      new THREE.Vector3(0, S, -S)
    ];
    for (const p of oxPts) {
      const sp = new THREE.Mesh(oxGeo, mats.zmOxygenAnion);
      sp.position.copy(p);
      oxStretch.add(sp);
    }
    // 12 edges of the regular octahedron (top & bottom apices connect to 4 equatorial oxygens + equator ring)
    const octEdges = [
      [2, 0], [2, 1], [2, 4], [2, 5],
      [3, 0], [3, 1], [3, 4], [3, 5],
      [0, 4], [4, 1], [1, 5], [5, 0]
    ];
    for (const [i, j] of octEdges) {
      oxStretch.add(buildRod(oxPts[i], oxPts[j], 0.036, mats.zmOxygenAnion));
    }

    // Ultra-translucent octahedral crystal cage visual cue
    const octSolid = new THREE.Mesh(new THREE.OctahedronGeometry(S, 0), mats.zmOctaFacet);
    octSolid.position.set(0, S, 0);
    oxStretch.add(octSolid);

    oxGrp.add(oxStretch);
    oxGrp.userData.zoomLatticeStretch = oxStretch;
  }
  register('zm_micro_oxygen_octahedron', oxGrp, [4.6, 1.4, 0.8]);

  // 29. 10,000x Central Ti4+ / Zr4+ Off-Center Ferroelectric Dipole Cation (LIVE OSCILLATING ALONG c-AXIS!)
  const tiGrp = new THREE.Group();
  {
    const tiSphere = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 28), mats.zmTiDipole);
    tiSphere.position.set(X_MIC, Y_CELL + 0.26, 0);
    tiGrp.add(tiSphere);

    // Subtle equatorial orbital halo emphasizing +4 charge concentration
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.035, 12, 36), mats.zmTiDipole);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(X_MIC, Y_CELL + 0.26, 0);
    tiGrp.add(halo);
  }
  register('zm_micro_ti_zr_dipole', tiGrp, [3.6, 0.8, 1.6], { zoomTiDipole: true });

  // 30. 10,000x Spontaneous Polarization Vector P_s & Inverse Piezoelectric Strain Gauge ΔL = d33·V
  const dipGrp = new THREE.Group();
  {
    // Vertical dipole arrow P_s emerging from center through displaced Ti4+ ion
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.25, 14), mats.zmDipoleVector);
    shaft.position.set(X_MIC, Y_CELL + 0.25, 0);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.42, 16), mats.zmDipoleVector);
    head.position.set(X_MIC, Y_CELL + 0.98, 0);
    dipGrp.add(shaft, head);

    // Right-side ΔL = d33·V caliper strain gauge ticks beside unit cell
    const calX = X_MIC + S + 0.72;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, S * 2.0, 12), mats.tpGoosGauge);
    bar.position.set(calX, Y_CELL, 0);
    const tickTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.08), mats.tpGoosGauge);
    tickTop.position.set(calX - 0.12, Y_CELL + S, 0);
    const tickBot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.08), mats.tpGoosGauge);
    tickBot.position.set(calX - 0.12, Y_CELL - S, 0);
    dipGrp.add(bar, tickTop, tickBot);
  }
  register('zm_micro_dipole_arrow', dipGrp, [5.4, 2.0, 1.2], { zoomTiDipole: true });

  // 31. 500x Ultrasonic Standing-Wave PZT Resonator Horn, Ruby-Alumina Friction Tip & Glowing Elliptical Orbit Ring!
  const ellipGrp = new THREE.Group();
  const orbitHeadSub = new THREE.Group();
  {
    // Magnified glowing elliptical trajectory orbit ring (rx = 0.78, ry = 0.36 -> 8 um x 7 um @ 110 kHz!)
    const ringPts = [];
    const SEG = 64;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(X_MIC + Math.cos(a) * 0.78, Y_TIP + Math.sin(a) * 0.36, 0.22));
    }
    const ringCurve = new THREE.CatmullRomCurve3(ringPts, true);
    const ringMesh = new THREE.Mesh(new THREE.TubeGeometry(ringCurve, 64, 0.064, 12, true), mats.zmOrbitGlow);
    ellipGrp.add(ringMesh);

    // Magnified co-fired multilayer PZT horn block + ruby-alumina friction tip riding the ellipse!
    const horn = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.62, 1.35), mats.zmPztCeramic);
    horn.position.set(X_MIC, Y_TIP + 0.72, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.34, 20), mats.zmAluminaCeramic);
    neck.position.set(X_MIC, Y_TIP + 0.24, 0);
    const rubyBall = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), mats.zmRubyTip);
    rubyBall.position.set(X_MIC, Y_TIP, 0);
    orbitHeadSub.add(horn, neck, rubyBall);

    ellipGrp.add(orbitHeadSub);
    ellipGrp.userData.zoomMicroOrbitHead = orbitHeadSub;
  }
  register('zm_micro_elliptical_tip', ellipGrp, [3.4, -0.8, 1.4]);

  // 32. 500x Lapped Alumina Slider Contact Interface, Micro-Friction Kick Chevrons & Ceramic Metrology Plinth
  const contactGrp = new THREE.Group();
  {
    // Magnified lapped alumina slider bar directly beneath elliptical friction tip (top surface kisses bottom of ruby orbit!)
    const sliderSlab = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.44, 2.35), mats.zmAluminaCeramic);
    sliderSlab.position.set(X_MIC, Y_TIP - 0.82, 0);
    contactGrp.add(sliderSlab);

    // 3 glowing emerald friction-kick directional propulsion chevrons along the slider face
    for (let i = -1; i <= 1; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 12), mats.tpGoosGauge);
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(X_MIC + i * 1.08, Y_TIP - 0.82, 1.26);
      contactGrp.add(cone);
    }

    // Precision ceramic metrology plinth uniting the entire right-hand twin-scale showcase
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.34, 4.45), mats.llCeramicChamber);
    plinth.position.set(X_MIC, -2.78, 0);
    contactGrp.add(plinth);
  }
  register('zm_micro_slider_contact', contactGrp, [3.8, -3.2, 0.4]);

  return {
    root,
    parts,
    gridY: -3.2,
    defaultCameraPos: new THREE.Vector3(27.5, 18.2, 41.0),
    defaultTarget: new THREE.Vector3(5.6, 0.35, 0.2),
    clipBounds: { x: 14.5, y: 6.5, z: 6.5 }
  };
}
