import * as THREE from 'three';

/**
 * Helper: Solid 270-degree cutaway LatheGeometry (open toward front-right +X/+Z quadrant,
 * phiStart = PI/2, phiLen = 3*PI/2) with solid watertight radial cross-section end-cap faces.
 */
function createSolidCutawayLathe(profilePts, mat, capMat = mat, segments = 48) {
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(new THREE.LatheGeometry(profilePts, segments, Math.PI * 0.5, Math.PI * 1.5), mat));

  const shape = new THREE.Shape();
  shape.moveTo(profilePts[0].x, profilePts[0].y);
  for (let i = 1; i < profilePts.length; i++) {
    shape.lineTo(profilePts[i].x, profilePts[i].y);
  }
  shape.closePath();

  const capGeo = new THREE.ShapeGeometry(shape);
  const capZ = new THREE.Mesh(capGeo, capMat);
  grp.add(capZ);
  const capX = new THREE.Mesh(capGeo, capMat);
  capX.rotation.y = -Math.PI / 2;
  grp.add(capX);
  return grp;
}

/**
 * Helper: Sculpted optical aspheric lens element (240° cutaway open toward +X/+Z camera).
 */
function createCutawayIrLens(rMax, yCenter, topSagFn, botSagFn, mat, phiStart = Math.PI * 0.58, phiLen = Math.PI * 1.38) {
  const pts = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * rMax;
    pts.push(new THREE.Vector2(Math.max(0.001, r), yCenter + botSagFn(r / rMax)));
  }
  for (let i = steps; i >= 0; i--) {
    const r = (i / steps) * rMax;
    pts.push(new THREE.Vector2(Math.max(0.001, r), yCenter + topSagFn(r / rMax)));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 48, phiStart, phiLen), mat);
}

/**
 * Helper: Open cutaway cylindrical barrel/ring open cleanly toward front-right (+X/+Z).
 */
function createCutawayCylinder(rIn, rOut, yBot, yTop, mat, phiStart = Math.PI * 0.62, phiLen = Math.PI * 1.30) {
  const pts = [
    new THREE.Vector2(rIn, yBot),
    new THREE.Vector2(rOut, yBot),
    new THREE.Vector2(rOut, yTop),
    new THREE.Vector2(rIn, yTop),
    new THREE.Vector2(rIn, yBot)
  ];
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 52, phiStart, phiLen), mat);
}

/**
 * Phase 9: Flagship Smartphone Quantum dToF LiDAR Depth Engine (32 Independent Dissectable Parts!)
 *
 * Dual-Cavity Quantum Photonics Cutaway Architecture:
 * - Left Cavity (Tx, X = -5.4): IEC 60825-1 ITO Eye-Safety Loop + Multi-Level Quartz DOE + Collimator +
 *   Monitor PD + 940 nm Multi-Junction VCSEL (16-pair p-DBR / AlOx Aperture / 3x InGaAs MQW + TJ / 34-pair n-DBR) +
 *   AlN Submount + Sub-ns GaN Laser Driver IC
 * - Right Cavity (Rx, X = +5.4): 940 nm a-Si:H/SiO₂ Narrowband Bandpass Filter + 4P IR Receiver Lenses +
 *   Sony-Class 3D-Stacked BSI SPAD (2x2 OCL / Dual Diffraction PSD + Bottom Grating / Full-DTI Metal Walls /
 *   Geiger-Mode Avalanche Junctions / 1:1 Cu-Cu Bonds) + 6 ns Quench + 10 ps Ring-TDC + TCSPC Histogram DSP
 * - Shared Base: High-Thermal Rigid PCB + Copper Thermal Slug + 24V Boost PMIC + MIPI CSI-2 FPC & 24-Pin BTB
 */
export function buildLidarPhotonicsAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'LidarPhotonicsRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  const X_TX = -5.4;
  const X_RX = 5.4;
  const Z_C = 0.0;

  // =========================================================================
  // GROUP 1: DUAL-CAVITY EMI SHIELD & OPTICAL CROSSTALK BAFFLE (01-02)
  // =========================================================================

  // 01. Non-Magnetic SUS304 Dual-Aperture Cutaway EMI Shield Can
  const emiGrp = new THREE.Group();
  {
    // Top roof plate tracing cleanly around twin circular optical windows (front cutaway at Z = +1.05 -> shapeY = -1.05)
    // With R_tx = 3.18 and R_rx = 3.38, exact intersection angles with shapeY = -1.05 are:
    //   sin(a) = -1.05 / R -> chord half-width dx = sqrt(R^2 - 1.05^2)
    const yCut = -1.05;
    const rTx = 3.18;
    const rRx = 3.38;
    const dxTx = Math.sqrt(rTx * rTx - yCut * yCut);
    const dxRx = Math.sqrt(rRx * rRx - yCut * yCut);
    const aTxStart = Math.atan2(yCut, -dxTx); // Left intersection on Tx circle (~-161 deg -> +199 deg)
    const aTxEnd = Math.atan2(yCut, dxTx);    // Right intersection on Tx circle (~-19 deg)
    const aRxStart = Math.atan2(yCut, -dxRx);
    const aRxEnd = Math.atan2(yCut, dxRx);

    const roofShape = new THREE.Shape();
    // Trace front-left edge -> around rear arc of Tx window -> center bridge -> around rear arc of Rx window -> front-right -> rear edge
    roofShape.moveTo(-10.95, yCut);
    roofShape.lineTo(X_TX - dxTx, yCut);
    // Trace clockwise along rear (+shapeY) arc of Tx aperture from left (-dxTx, yCut) over top (+rTx) to right (+dxTx, yCut)
    roofShape.absarc(X_TX, 0, rTx, aTxStart + Math.PI * 2, aTxEnd, true);
    roofShape.lineTo(X_RX - dxRx, yCut);
    // Trace clockwise along rear (+shapeY) arc of Rx aperture
    roofShape.absarc(X_RX, 0, rRx, aRxStart + Math.PI * 2, aRxEnd, true);
    roofShape.lineTo(10.95, yCut);
    roofShape.lineTo(10.95, 5.35);
    roofShape.lineTo(-10.95, 5.35);
    roofShape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.28, bevelEnabled: false, curveSegments: 44 });
    roofGeo.rotateX(-Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, mats.susSteel);
    roof.position.y = 6.88;
    emiGrp.add(roof);

    // Back wall (Z = -5.35)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(21.9, 10.1, 0.24), mats.susSteel);
    backWall.position.set(0, 1.98, -5.23);
    emiGrp.add(backWall);

    // Left outer wall (X = -10.95, cut back at front Z = +1.05)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 10.1, 6.4), mats.susSteel);
    leftWall.position.set(-10.83, 1.98, -2.15);
    emiGrp.add(leftWall);

    // Right outer wall (X = +10.95, cut back at front Z = +1.05)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 10.1, 6.4), mats.susSteel);
    rightWall.position.set(10.83, 1.98, -2.15);
    emiGrp.add(rightWall);

    // Rear perimeter GND solder tabs
    for (let i = -4; i <= 4; i++) {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.35), mats.solderTin);
      tab.position.set(i * 2.3, -2.95, -5.32);
      emiGrp.add(tab);
    }
  }
  register('ld_emi_shield_shell', emiGrp, [0.0, 7.6, -2.2]);

  // 02. Black Ceramic / LCP Dual-Cavity Housing & Central OD > 6 Optical Crosstalk Baffle Wall
  const housingGrp = new THREE.Group();
  {
    // Central high-OD optical isolation baffle wall completely separating Left Tx & Right Rx!
    const centerWall = new THREE.Mesh(new THREE.BoxGeometry(1.06, 9.48, 8.65), mats.ldCeramicHousing);
    centerWall.position.set(0, 2.12, -0.72);
    housingGrp.add(centerWall);

    // Bottom optical light-trap labyrinth step along PCB seam (prevents 940 nm underpass leakage!)
    const labFoot = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.32, 8.75), mats.susDarkInner);
    labFoot.position.set(0, -2.48, -0.72);
    housingGrp.add(labFoot);

    // Rear inner ceramic shroud lining both cavities
    const rearShroud = new THREE.Mesh(new THREE.BoxGeometry(21.1, 9.35, 0.42), mats.ldCeramicHousing);
    rearShroud.position.set(0, 2.08, -4.86);
    housingGrp.add(rearShroud);

    // Outer left & right inner ceramic ribs (open front for cutaway)
    const leftRib = new THREE.Mesh(new THREE.BoxGeometry(0.42, 9.35, 5.65), mats.ldCeramicHousing);
    leftRib.position.set(-10.38, 2.08, -2.05);
    housingGrp.add(leftRib);
    const rightRib = new THREE.Mesh(new THREE.BoxGeometry(0.42, 9.35, 5.65), mats.ldCeramicHousing);
    rightRib.position.set(10.38, 2.08, -2.05);
    housingGrp.add(rightRib);

    // Subtle matte-black vertical anti-reflection ribs on both faces of the central crosstalk wall
    for (let r = 0; r < 5; r++) {
      const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 7.8, 0.14), mats.susDarkInner);
      ribL.position.set(-0.56, 2.2, -3.4 + r * 1.45);
      housingGrp.add(ribL);
      const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 7.8, 0.14), mats.susDarkInner);
      ribR.position.set(0.56, 2.2, -3.4 + r * 1.45);
      housingGrp.add(ribR);
    }
  }
  register('ld_ceramic_dual_housing', housingGrp, [0.0, 5.2, -2.8]);

  // =========================================================================
  // GROUP 2: LEFT CAVITY (Tx) — EYE-SAFETY ITO, QUARTZ DOE & 940 nm VCSEL (03-13)
  // =========================================================================

  // 03. IEC 60825-1 Class-1 Transparent Conductive ITO Eye-Safety Fracture-Detection Interlock Loop
  const itoGrp = new THREE.Group();
  {
    // Serpentine continuous ITO conductive trace printed across the quartz DOE top face (Y = +6.48)
    const pts = [];
    const rows = 6;
    const span = 2.05;
    for (let r = 0; r < rows; r++) {
      const z = -span + (r / (rows - 1)) * (span * 2);
      const xStart = r % 2 === 0 ? -span : span;
      const xEnd = r % 2 === 0 ? span : -span;
      // Clip corners softly inside the circular DOE aperture
      const maxX = Math.sqrt(Math.max(0.25, 2.55 * 2.55 - z * z));
      const xs = Math.sign(xStart) * Math.min(Math.abs(xStart), maxX);
      const xe = Math.sign(xEnd) * Math.min(Math.abs(xEnd), maxX);
      pts.push(new THREE.Vector3(X_TX + xs, 6.49, Z_C + z));
      pts.push(new THREE.Vector3(X_TX + xe, 6.49, Z_C + z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.08);
    itoGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.052, 8, false), mats.ldItoTrace));

    // Twin ENIG gold interlock contact pads + vertical interconnect spring contacts to laser driver safety pin
    for (const [px, pz] of [[X_TX - 2.35, -2.05], [X_TX + 2.35, 2.05]]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.46), mats.goldBond);
      pad.position.set(px, 6.48, pz);
      itoGrp.add(pad);
    }
  }
  register('ld_ito_safety_trace', itoGrp, [-2.2, 6.4, 0.8]);

  // 04. Multi-Level Nano-Etched Quartz (Fused Silica) DOE Diffuser Grating
  const doeGrp = new THREE.Group();
  {
    const doeProfile = [
      new THREE.Vector2(0.001, 5.82),
      new THREE.Vector2(3.05, 5.82),
      new THREE.Vector2(3.05, 6.42),
      new THREE.Vector2(0.001, 6.42)
    ];
    const doeDisk = createSolidCutawayLathe(doeProfile, mats.ldQuartzDoe, mats.ldQuartzDoe, 52);
    doeDisk.position.set(X_TX, 0, Z_C);
    doeGrp.add(doeDisk);

    // Magnified 4-level stepped phase-grating micro-relief on upper surface (940 nm diffraction tiles)
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = -3; iz <= 3; iz++) {
        const px = ix * 0.62;
        const pz = iz * 0.62;
        if (Math.hypot(px, pz) > 2.45) continue;
        // Skip open front-right cutaway quadrant so cross-section stays crisp
        if (px > 0.1 && pz > 0.1) continue;
        const level = ((Math.abs(ix * 3 + iz * 5) % 4) + 1) * 0.045;
        const stepCell = new THREE.Mesh(new THREE.BoxGeometry(0.50, level, 0.50), mats.ldQuartzDoe);
        stepCell.position.set(X_TX + px, 6.42 + level * 0.5, Z_C + pz);
        doeGrp.add(stepCell);
      }
    }
  }
  register('ld_quartz_doe_grating', doeGrp, [-2.2, 5.4, 0.4]);

  // 05. 940 nm Precision Molded Aspheric Glass Collimator Lens
  const collimGrp = new THREE.Group();
  {
    const colLens = createCutawayIrLens(
      2.78,
      3.98,
      (u) => 0.62 * (1 - 0.82 * u * u + 0.12 * u * u * u * u),
      (u) => -0.34 * (1 - 0.65 * u * u),
      mats.ldIrGlass
    );
    colLens.position.set(X_TX, 0, Z_C);
    collimGrp.add(colLens);

    // Outer optical mounting flange edge
    const flange = createCutawayCylinder(2.68, 2.90, 3.84, 4.18, mats.ldIrGlass, Math.PI * 0.58, Math.PI * 1.38);
    flange.position.set(X_TX, 0, Z_C);
    collimGrp.add(flange);
  }
  register('ld_tx_collimator_lens', collimGrp, [-2.2, 3.6, 0.2]);

  // 06. Tx Matte-Black LCP Optical Barrel & Stray-Light Spacer
  const txBarrelGrp = new THREE.Group();
  {
    const outerCyl = createCutawayCylinder(2.94, 3.46, 1.85, 6.22, mats.lcpBlack, Math.PI * 0.68, Math.PI * 1.24);
    outerCyl.position.set(X_TX, 0, Z_C);
    txBarrelGrp.add(outerCyl);

    // Internal stepped stray-light baffle rings inside Tx barrel
    for (const by of [2.55, 3.15, 5.15]) {
      const step = createCutawayCylinder(2.74, 2.96, by, by + 0.14, mats.susDarkInner, Math.PI * 0.68, Math.PI * 1.24);
      step.position.set(X_TX, 0, Z_C);
      txBarrelGrp.add(step);
    }
  }
  register('ld_tx_barrel_spacer', txBarrelGrp, [-3.0, 2.6, -0.5]);

  // 07. Redundant Hardware Safety Monitor Photodiode (Monitor PD tilted toward DOE underside!)
  const monPdGrp = new THREE.Group();
  {
    const pdUnit = new THREE.Group();
    const pkg = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.36, 1.22), mats.icPackageDark);
    pdUnit.add(pkg);
    const activeDie = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.84), mats.ldMonitorPd);
    activeDie.position.y = 0.20;
    pdUnit.add(activeDie);
    const goldFrame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), mats.goldBond);
    goldFrame.position.y = 0.18;
    pdUnit.add(goldFrame);

    // Tilted 34° looking directly up toward the quartz DOE underside back-reflection!
    pdUnit.position.set(X_TX + 3.55, 2.15, -1.55);
    pdUnit.rotation.z = 0.58;
    pdUnit.rotation.x = 0.18;
    monPdGrp.add(pdUnit);

    // Angled mounting pedestal connecting Monitor PD down to PCB
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.45, 0.95), mats.ldCeramicHousing);
    ped.position.set(X_TX + 3.85, -0.40, -1.55);
    monPdGrp.add(ped);
  }
  register('ld_monitor_pd', monPdGrp, [-0.8, 2.2, -1.2]);

  // 08. VCSEL Top Output Mirror: 16-Pair p-AlGaAs/GaAs DBR Bragg Stack & Gold Ring Anode Aperture
  const topDbrGrp = new THREE.Group();
  {
    // Magnified central 270° cutaway VCSEL mesa stack (R = 2.05) showing alternating Bragg laminae!
    for (let k = 0; k < 5; k++) {
      const y0 = 0.78 + k * 0.13;
      const mat = k % 2 === 0 ? mats.ldDbrMirrorTop : mats.nanoSus304Core;
      const prof = [
        new THREE.Vector2(0.001, y0),
        new THREE.Vector2(1.98, y0),
        new THREE.Vector2(1.98, y0 + 0.125),
        new THREE.Vector2(0.001, y0 + 0.125)
      ];
      const layer = createSolidCutawayLathe(prof, mat, mat, 44);
      layer.position.set(X_TX, 0, Z_C);
      topDbrGrp.add(layer);
    }

    // Top Gold Ring Anode Contact framing the central circular laser emission window (R_in=0.92, R_out=1.98)
    const ringProf = [
      new THREE.Vector2(0.92, 1.43),
      new THREE.Vector2(1.98, 1.43),
      new THREE.Vector2(1.98, 1.62),
      new THREE.Vector2(0.92, 1.62)
    ];
    const goldRing = createSolidCutawayLathe(ringProf, mats.goldBond, mats.goldBond, 44);
    goldRing.position.set(X_TX, 0, Z_C);
    topDbrGrp.add(goldRing);

    // 8 surrounding companion VCSEL micro-mesa emitters representing the dense 2D array!
    const miniRingGeo = new THREE.TorusGeometry(0.24, 0.06, 10, 20);
    miniRingGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.35;
      const mx = X_TX + Math.cos(ang) * 2.52;
      const mz = Z_C + Math.sin(ang) * 2.52;
      const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.32, 16), mats.ldDbrMirrorTop);
      mesa.position.set(mx, 1.28, mz);
      topDbrGrp.add(mesa);
      const rGold = new THREE.Mesh(miniRingGeo, mats.goldBond);
      rGold.position.set(mx, 1.45, mz);
      topDbrGrp.add(rGold);
    }
  }
  register('ld_vcsel_top_pdbr', topDbrGrp, [-2.2, 2.1, 0.4]);

  // 09. Wet-Thermal AlOx Oxide Confinement Current Aperture Layer (Φ10 μm Funnel!)
  const oxideGrp = new THREE.Group();
  {
    const oxProf = [
      new THREE.Vector2(0.76, 0.42), // Central laser waist aperture!
      new THREE.Vector2(2.04, 0.42),
      new THREE.Vector2(2.04, 0.77),
      new THREE.Vector2(0.76, 0.77)
    ];
    const oxRing = createSolidCutawayLathe(oxProf, mats.ldOxideAperture, mats.ldOxideAperture, 48);
    oxRing.position.set(X_TX, 0, Z_C);
    oxideGrp.add(oxRing);
  }
  register('ld_vcsel_oxide_aperture', oxideGrp, [-2.2, 1.2, 0.9]);

  // 10. Multi-Junction 3× InGaAs/GaAs Multiple Quantum Wells (MQW) + Tunnel Junction Active Gain Cavity
  const mqwGrp = new THREE.Group();
  {
    // Own material instance so SimEffects can pulse VCSEL laser emission live!
    const activeMqwMat = mats.ldMqwActive.clone();
    mqwGrp.userData.vcselPulseMat = activeMqwMat;

    // 3 stacked glowing crimson InGaAs MQW active discs separated by 2 gleaming silver Tunnel Junctions!
    const mqwYs = [-0.26, -0.02, 0.22];
    for (const my of mqwYs) {
      const prof = [
        new THREE.Vector2(0.001, my),
        new THREE.Vector2(2.02, my),
        new THREE.Vector2(2.02, my + 0.16),
        new THREE.Vector2(0.001, my + 0.16)
      ];
      const well = createSolidCutawayLathe(prof, activeMqwMat, activeMqwMat, 48);
      well.position.set(X_TX, 0, Z_C);
      mqwGrp.add(well);
    }
    // 2 ultra-thin high-doped GaAs Tunnel Junction recycling interlayers
    for (const ty of [-0.10, 0.14]) {
      const tjProf = [
        new THREE.Vector2(0.001, ty),
        new THREE.Vector2(2.02, ty),
        new THREE.Vector2(2.02, ty + 0.075),
        new THREE.Vector2(0.001, ty + 0.075)
      ];
      const tj = createSolidCutawayLathe(tjProf, mats.alPad, mats.alPad, 48);
      tj.position.set(X_TX, 0, Z_C);
      mqwGrp.add(tj);
    }
  }
  register('ld_vcsel_mqw_tunnel', mqwGrp, [-2.2, 0.3, 1.2]);

  // 11. Bottom High-Reflectivity 34-Pair n-DBR Bragg Mirror (R > 99.9%) & 100 μm GaAs Substrate
  const botDbrGrp = new THREE.Group();
  {
    // 6 thick visual alternating indigo/silver n-DBR strata representing 34 pairs
    for (let k = 0; k < 6; k++) {
      const y0 = -1.04 + k * 0.13;
      const mat = k % 2 === 0 ? mats.ldDbrMirrorBot : mats.nanoSus304Core;
      const prof = [
        new THREE.Vector2(0.001, y0),
        new THREE.Vector2(2.06, y0),
        new THREE.Vector2(2.06, y0 + 0.125),
        new THREE.Vector2(0.001, y0 + 0.125)
      ];
      const l = createSolidCutawayLathe(prof, mat, mat, 48);
      l.position.set(X_TX, 0, Z_C);
      botDbrGrp.add(l);
    }

    // 100 μm n-GaAs single-crystal wafer base
    const gaasBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.68, 5.6), mats.ldGaAsSub);
    gaasBase.position.set(X_TX, -1.40, Z_C);
    botDbrGrp.add(gaasBase);
  }
  register('ld_vcsel_bot_ndbr', botDbrGrp, [-2.2, -0.9, 0.2]);

  // 12. High-Thermal-Conductivity AlN Ceramic Submount & Low-Inductance Parallel Gold Wire-Bonds
  const alnGrp = new THREE.Group();
  {
    const sub = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.78, 6.3), mats.ldAlNSubmount);
    sub.position.set(X_TX, -2.18, Z_C);
    alnGrp.add(sub);

    // Gold AuSn eutectic die-attach metallization pad
    const ausn = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.06, 5.85), mats.goldBond);
    ausn.position.set(X_TX, -1.77, Z_C);
    alnGrp.add(ausn);

    // 6 parallel low-inductance Φ25 μm gold wire-bond loops jumping from VCSEL anode to GaN laser driver!
    for (let w = 0; w < 6; w++) {
      const bx = X_TX - 2.65 - w * 0.18;
      const bz = 1.15 + w * 0.24;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(X_TX - 1.75, 1.48, 0.35 + w * 0.16),
        new THREE.Vector3(bx - 0.35, 1.85, bz + 0.2),
        new THREE.Vector3(X_TX - 3.05, -1.78, 2.25 + w * 0.22)
      );
      alnGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.036, 7, false), mats.goldBond));
    }
  }
  register('ld_vcsel_aln_submount', alnGrp, [-2.2, -2.2, 0.2]);

  // 13. Sub-Nanosecond GaN / CMOS High-Current VCSEL Pulse Driver IC & Ultra-Low-ESL Charge-Pump MLCCs
  const driverGrp = new THREE.Group();
  {
    // Main GaN laser driver QFN package on front-left PCB apron
    const ic = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.68, 2.1), mats.icPackageDark);
    ic.position.set(-8.6, -2.28, 3.15);
    driverGrp.add(ic);

    // Subtle pin-1 laser fiducial dot & exposed copper power thermal bar
    const fid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 14), mats.goldBond);
    fid.position.set(-9.6, -1.93, 3.85);
    driverGrp.add(fid);

    // 4 tightly coupled 01005/0201 charge-pump MLCC capacitors right beside the driver!
    for (let c = 0; c < 4; c++) {
      const cx = -6.5 + c * 0.82;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.38, 0.36), mats.mlccCeramic);
      body.position.set(cx, -2.43, 3.78);
      driverGrp.add(body);
      for (const sx of [-0.24, 0.24]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.40, 0.38), mats.solderTin);
        cap.position.set(cx + sx, -2.43, 3.78);
        driverGrp.add(cap);
      }
    }
  }
  register('ld_gan_laser_driver', driverGrp, [-3.4, -1.8, 2.6]);

  // =========================================================================
  // GROUP 3: RIGHT CAVITY (Rx) — 940 nm BANDPASS FILTER & 4P IR RECEIVER LENS (14-19)
  // =========================================================================

  // 14. 940 nm Narrowband Bandpass Interference Filter (a-Si:H / SiO₂, FWHM 28 nm, OD 4 Sunlight Cut!)
  const bpGrp = new THREE.Group();
  {
    const bpProfile = [
      new THREE.Vector2(0.001, 6.08),
      new THREE.Vector2(3.16, 6.08),
      new THREE.Vector2(3.16, 6.46),
      new THREE.Vector2(0.001, 6.46)
    ];
    const bpDisk = createSolidCutawayLathe(bpProfile, mats.ldBandpass940, mats.ldBandpass940, 52);
    bpDisk.position.set(X_RX, 0, Z_C);
    bpGrp.add(bpDisk);
  }
  register('ld_rx_bandpass_filter', bpGrp, [2.2, 6.0, 0.4]);

  // 15. Rx 940 nm Wide-Angle Aspheric Lens L1 (F1.4 Large-Aperture Collector)
  const l1Grp = new THREE.Group();
  {
    const l1 = createCutawayIrLens(
      2.92,
      5.24,
      (u) => 0.56 * (1 - 0.78 * u * u),
      (u) => -0.22 * (1 - 0.90 * u * u),
      mats.ldIrGlass
    );
    l1.position.set(X_RX, 0, Z_C);
    l1Grp.add(l1);
  }
  register('ld_rx_lens_l1', l1Grp, [2.2, 4.9, 0.3]);

  // 16. Rx 940 nm High-Index Aberration-Correcting Lens L2
  const l2Grp = new THREE.Group();
  {
    const l2 = createCutawayIrLens(
      2.62,
      4.16,
      (u) => 0.16 + 0.24 * u * u,
      (u) => -0.34 + 0.14 * u * u,
      mats.lensHybridResin
    );
    l2.position.set(X_RX, 0, Z_C);
    l2Grp.add(l2);
  }
  register('ld_rx_lens_l2', l2Grp, [2.2, 3.8, 0.2]);

  // 17. Rx 940 nm Wide-FOV Relay Lens L3 + Internal Fixed Matte-Black Aperture Stop Ring
  const l3Grp = new THREE.Group();
  {
    const l3 = createCutawayIrLens(
      2.72,
      2.96,
      (u) => 0.42 * (1 - 0.72 * u * u),
      (u) => -0.36 * (1 - 0.65 * u * u),
      mats.ldIrGlass
    );
    l3.position.set(X_RX, 0, Z_C);
    l3Grp.add(l3);

    // Precision matte-black fixed optical stop sheet right above L3
    const stopSheet = createCutawayCylinder(1.78, 2.95, 3.44, 3.54, mats.susDarkInner, Math.PI * 0.58, Math.PI * 1.38);
    stopSheet.position.set(X_RX, 0, Z_C);
    l3Grp.add(stopSheet);
  }
  register('ld_rx_lens_l3', l3Grp, [2.2, 2.8, 0.2]);

  // 18. Rx 940 nm Rear Gullwing Field-Flattener Lens L4 (Telecentric CRA Control)
  const l4Grp = new THREE.Group();
  {
    const l4 = createCutawayIrLens(
      2.96,
      1.86,
      (u) => 0.22 - 0.38 * u * u + 0.46 * u * u * u * u,
      (u) => -0.26 + 0.32 * u * u - 0.24 * u * u * u * u,
      mats.lensHybridResin
    );
    l4.position.set(X_RX, 0, Z_C);
    l4Grp.add(l4);
  }
  register('ld_rx_lens_l4', l4Grp, [2.2, 1.8, 0.2]);

  // 19. Rx Precision Carbon-Black LCP Lens Barrel & Serrated Stray-Light Baffle Holder
  const rxBarrelGrp = new THREE.Group();
  {
    const barrel = createCutawayCylinder(3.04, 3.62, 1.32, 6.46, mats.lcpBlack, Math.PI * 0.66, Math.PI * 1.26);
    barrel.position.set(X_RX, 0, Z_C);
    rxBarrelGrp.add(barrel);

    // Internal stray-light serration rings
    for (const sy of [2.42, 3.66, 4.72, 5.88]) {
      const baffle = createCutawayCylinder(2.88, 3.06, sy, sy + 0.12, mats.susDarkInner, Math.PI * 0.66, Math.PI * 1.26);
      baffle.position.set(X_RX, 0, Z_C);
      rxBarrelGrp.add(baffle);
    }
  }
  register('ld_rx_lens_barrel', rxBarrelGrp, [3.4, 3.2, -0.5]);

  // =========================================================================
  // GROUP 4: RIGHT CAVITY (Rx) — 3D-STACKED SONY-CLASS BSI SPAD & 10 ps TDC (20-29)
  // Magnified 3x3 Macro-Pixel SPAD Cross-Section (5.6 x 5.6 footprint centered at X_RX = +5.4, Z = 0)
  // =========================================================================
  const SPAD_PITCH = 1.76;
  const SPAD_W = 5.48;
  const cellOffsets = [-SPAD_PITCH, 0, SPAD_PITCH];

  // 20. 2x2 / Per-Pixel High-n On-Chip Microlens (OCL) Array
  const oclGrp = new THREE.Group();
  {
    const domeGeo = new THREE.SphereGeometry(0.84, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        const dome = new THREE.Mesh(domeGeo, mats.microLensPolymer);
        dome.scale.set(1.0, 0.52, 1.0);
        dome.position.set(X_RX + ox, 0.64, Z_C + oz);
        oclGrp.add(dome);
      }
    }
  }
  register('ld_spad_ocl_2x2', oclGrp, [2.2, 1.4, 0.6]);

  // 21. Sony Dual-Diffraction Front Inverted-Pyramid Surface (PSD) Nanostructure
  const psdGrp = new THREE.Group();
  {
    // 2x2 inverted pyramids inside each of the 9 SPAD pixels = 36 diffraction micro-pyramids!
    const pyrGeo = new THREE.ConeGeometry(0.36, 0.28, 4);
    pyrGeo.rotateX(Math.PI); // Inverted pyramid pointing downward into the silicon!
    pyrGeo.rotateY(Math.PI / 4);
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        for (const px of [-0.38, 0.38]) {
          for (const pz of [-0.38, 0.38]) {
            const p = new THREE.Mesh(pyrGeo, mats.ldSpadDiffraction);
            p.position.set(X_RX + ox + px, 0.48, Z_C + oz + pz);
            psdGrp.add(p);
          }
        }
      }
    }
  }
  register('ld_spad_psd_pyramids', psdGrp, [2.2, 0.8, 0.8]);

  // 22. Full-DTI Metal Reflective Trench Wall Grid + Shield Ring Contact (Cuts Crosstalk by 50%!)
  const dtiGrp = new THREE.Group();
  {
    // Vertical wall grid lines separating the 3x3 SPAD pixels down through the entire Si slab
    const wallH = 1.24;
    const wallY = -0.26;
    const gridPos = [-SPAD_PITCH * 1.5, -SPAD_PITCH * 0.5, SPAD_PITCH * 0.5, SPAD_PITCH * 1.5];
    for (const gp of gridPos) {
      // Bars along Z (cut front edge cleanly so front SPAD cells expose internal avalanche junction!)
      const barZ = new THREE.Mesh(new THREE.BoxGeometry(0.14, wallH, SPAD_W), mats.tungstenGrid);
      barZ.position.set(X_RX + gp, wallY, Z_C);
      dtiGrp.add(barZ);

      // Bars along X (omit front-most perimeter wall so viewer sees straight inside front row!)
      if (gp < SPAD_PITCH * 1.2) {
        const barX = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W, wallH, 0.14), mats.tungstenGrid);
        barX.position.set(X_RX, wallY, Z_C + gp);
        dtiGrp.add(barX);
      }
    }

    // Thin SiO₂ oxide insulation cladding strips flanking central metal DTI
    for (const gp of [-SPAD_PITCH * 0.5, SPAD_PITCH * 0.5]) {
      const oxZ = new THREE.Mesh(new THREE.BoxGeometry(0.22, wallH - 0.04, SPAD_W - 0.06), mats.fullDtiOxide);
      oxZ.position.set(X_RX + gp, wallY, Z_C);
      dtiGrp.add(oxZ);
    }
  }
  register('ld_spad_full_dti_shield', dtiGrp, [2.2, 0.2, 0.5]);

  // 23. Deep-Depletion p⁻ Silicon 940 nm Photon Absorption Layer (5-7 μm, 98.8% Charge Collection)
  const siAbsGrp = new THREE.Group();
  {
    const siSlab = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W - 0.12, 1.02, SPAD_W - 0.12), mats.ldSpadSiDeep);
    siSlab.position.set(X_RX, -0.18, Z_C);
    siAbsGrp.add(siSlab);
  }
  register('ld_spad_si_absorption', siAbsGrp, [2.2, -0.4, 0.3]);

  // 24. Geiger-Mode High-Field p⁺/n⁺⁺ Avalanche Multiplication Cores (24V) & Guard Rings!
  const avalGrp = new THREE.Group();
  {
    const avalancheCells = [];
    const coreGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 24);
    const guardGeo = new THREE.TorusGeometry(0.62, 0.075, 10, 28);
    guardGeo.rotateX(Math.PI / 2);

    let cellIdx = 0;
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        // Independent material clone per SPAD pixel so SimEffects can trigger stochastic Geiger avalanche flashes!
        const cellMat = mats.ldSpadAvalanche.clone();
        const core = new THREE.Mesh(coreGeo, cellMat);
        core.position.set(X_RX + ox, -0.58, Z_C + oz);
        core.userData.spadCellIdx = cellIdx++;
        avalGrp.add(core);
        avalancheCells.push(core);

        // Surrounding electric-field guard ring preventing premature edge breakdown
        const guard = new THREE.Mesh(guardGeo, mats.ldSpadGuardRing);
        guard.position.set(X_RX + ox, -0.58, Z_C + oz);
        avalGrp.add(guard);
      }
    }
    avalGrp.userData.spadAvalancheCells = avalancheCells;
  }
  register('ld_spad_avalanche_pn', avalGrp, [2.2, -1.0, 1.0]);

  // 25. Opposite-Side Periodic Shallow-Trench Back-Diffraction Grating & Mirror (Dual-Diffraction Bottom)
  const botDiffGrp = new THREE.Group();
  {
    const mirrorBase = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W, 0.14, SPAD_W), mats.ldSpadDiffraction);
    mirrorBase.position.set(X_RX, -0.98, Z_C);
    botDiffGrp.add(mirrorBase);

    // Periodic shallow-trench back-diffraction ribs scattering unabsorbed 940 nm photons back upward!
    for (let r = -6; r <= 6; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W - 0.14, 0.09, 0.14), mats.goldBond);
      rib.position.set(X_RX, -0.88, Z_C + r * 0.40);
      botDiffGrp.add(rib);
    }
  }
  register('ld_spad_bottom_diffraction', botDiffGrp, [2.2, -1.6, 0.4]);

  // 26. 1-to-1 Per-Pixel Direct Cu-Cu Hybrid Bonding Interface (6-10 μm Pitch + SiCN Dielectric)
  const cucuGrp = new THREE.Group();
  {
    const sicn = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W, 0.30, SPAD_W), mats.sicnDielectric);
    sicn.position.set(X_RX, -1.24, Z_C);
    cucuGrp.add(sicn);

    // 36 dense copper direct-bond pillars (4 per SPAD macro-cell: cathode, anode, guard, shield!)
    const padGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.34, 14);
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        for (const px of [-0.36, 0.36]) {
          for (const pz of [-0.36, 0.36]) {
            const cu = new THREE.Mesh(padGeo, mats.copperPad);
            cu.position.set(X_RX + ox + px, -1.24, Z_C + oz + pz);
            cucuGrp.add(cu);
          }
        }
      }
    }
  }
  register('ld_spad_cucu_bonds', cucuGrp, [2.2, -2.2, 0.5]);

  // 27. Per-Pixel Active/Passive Quenching & 6 ns Fast-Recharge Circuit Layer
  const quenchGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W, 0.34, SPAD_W), mats.ldLogicQuench);
    slab.position.set(X_RX, -1.62, Z_C);
    quenchGrp.add(slab);

    // 9 individual per-pixel quench transistor/resistor islands on top face
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.06, 1.38), mats.mosfetAmp);
        cell.position.set(X_RX + ox, -1.43, Z_C + oz);
        quenchGrp.add(cell);
      }
    }
  }
  register('ld_logic_quench_recharge', quenchGrp, [2.2, -2.9, 0.3]);

  // 28. Picosecond Ring-Oscillator / Vernier TDC (Time-to-Digital Converter) Matrix
  const tdcGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W, 0.34, SPAD_W), mats.ldLogicTdc);
    slab.position.set(X_RX, -2.02, Z_C);
    tdcGrp.add(slab);

    // 9 gleaming high-speed ring-oscillator timing rings visible atop the TDC stratum!
    const oscGeo = new THREE.TorusGeometry(0.56, 0.055, 8, 24);
    oscGeo.rotateX(Math.PI / 2);
    for (const ox of cellOffsets) {
      for (const oz of cellOffsets) {
        const ring = new THREE.Mesh(oscGeo, mats.goldBond);
        ring.position.set(X_RX + ox, -1.83, Z_C + oz);
        tdcGrp.add(ring);
      }
    }
  }
  register('ld_logic_tdc_ring', tdcGrp, [2.2, -3.6, 0.3]);

  // 29. On-Chip TCSPC Real-Time Histogram Peak-Finder & SRAM DSP Bottom Logic Wafer
  const dspGrp = new THREE.Group();
  {
    const wafer = new THREE.Mesh(new THREE.BoxGeometry(SPAD_W + 0.35, 0.38, SPAD_W + 0.35), mats.ldLogicDsp);
    wafer.position.set(X_RX, -2.42, Z_C);
    dspGrp.add(wafer);

    // Sculpted 3D miniature TCSPC Time-of-Flight Histogram peak relief along front +Z cutaway edge!
    // Shows low uniform sunlight noise bins + one dramatic sharp laser-echo distance peak!
    const binHeights = [0.10, 0.12, 0.11, 0.14, 0.12, 0.22, 0.44, 0.18, 0.11, 0.10, 0.12, 0.10];
    for (let b = 0; b < binHeights.length; b++) {
      const h = binHeights[b];
      const isPeak = b === 6;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, h, 0.12),
        isPeak ? mats.ldMqwActive : mats.ldItoTrace
      );
      bar.position.set(X_RX - 2.30 + b * 0.42, -2.58 + h * 0.5, SPAD_W * 0.5 + 0.22);
      dspGrp.add(bar);
    }
  }
  register('ld_logic_histogram_dsp', dspGrp, [2.2, -4.4, 0.2]);

  // =========================================================================
  // GROUP 5: SHARED SUBSTRATE, 24V BOOST PMIC & HIGH-SPEED FPC I/O (30-32)
  // =========================================================================

  // 30. High-Thermal-Conductivity Multi-Layer Rigid Module PCB with Copper Thermal Slug (under VCSEL)
  const pcbGrp = new THREE.Group();
  {
    const board = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.72, 10.4), mats.rigidPcb);
    board.position.set(0, -3.00, 0.0);
    pcbGrp.add(board);

    // Embedded pure-copper thermal slug right beneath the Tx VCSEL AlN submount!
    const slug = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.76, 6.1), mats.nanoOfcCopper);
    slug.position.set(X_TX, -3.00, Z_C);
    pcbGrp.add(slug);

    // Perimeter ENIG gold grounding ring along PCB front edge
    const gndBar = new THREE.Mesh(new THREE.BoxGeometry(21.2, 0.05, 0.34), mats.goldBond);
    gndBar.position.set(0, -2.62, 4.88);
    pcbGrp.add(gndBar);
  }
  register('ld_substrate_pcb', pcbGrp, [0.0, -5.2, 0.0]);

  // 31. 24V SPAD High-Voltage Boost PMIC IC + Decoupling MLCC Array + 0201 NTC Temperature Compensator
  const pmicGrp = new THREE.Group();
  {
    // 24V Boost PMIC QFN package mounted neatly on front-right PCB apron
    const pmic = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.58, 1.85), mats.icPackageDark);
    pmic.position.set(1.65, -2.33, 3.65);
    pmicGrp.add(pmic);

    // Boost power inductor cube beside PMIC
    const ind = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 1.15), mats.yokePermalloy);
    ind.position.set(3.75, -2.31, 3.72);
    pmicGrp.add(ind);

    // 50V-rated MLCC output smoothing caps + emerald NTC temperature compensation thermistor (17 mV/K tracker!)
    for (let k = 0; k < 4; k++) {
      const cx = 5.1 + k * 0.78;
      const isNtc = k === 3;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.34, 0.34),
        isNtc ? mats.hallSensorEmerald : mats.mlccCeramic
      );
      body.position.set(cx, -2.45, 3.85);
      pmicGrp.add(body);
      for (const sx of [-0.22, 0.22]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.36), mats.solderTin);
        cap.position.set(cx + sx, -2.45, 3.85);
        pmicGrp.add(cap);
      }
    }
  }
  register('ld_passive_pmic_array', pmicGrp, [1.2, -3.6, 2.8]);

  // 32. Shielded MIPI CSI-2 / I²C Polyimide FPC & 24-Pin 0.35mm Gold Mezzanine BTB Connector
  const fpcGrp = new THREE.Group();
  {
    // Polyimide ribbon exiting front-center PCB smoothly down to BTB mezzanine
    const fpcRibbon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 3.4), mats.fpcPolyimide);
    fpcRibbon.position.set(0.0, -3.12, 6.75);
    fpcGrp.add(fpcRibbon);

    // Black conductive EMI shield film overlay on FPC center run
    const emiFilm = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.04, 2.15), mats.fpcEmiFilm);
    emiFilm.position.set(0.0, -3.04, 6.25);
    fpcGrp.add(emiFilm);

    // 24-pin 0.35 mm pitch gold BTB mezzanine connector housing & twin pin rows
    const btbBody = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.42, 1.05), mats.btbHousing);
    btbBody.position.set(0.0, -2.86, 8.15);
    fpcGrp.add(btbBody);

    for (let p = 0; p < 12; p++) {
      const px = -2.1 + p * 0.38;
      for (const pz of [7.78, 8.52]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.22), mats.goldBond);
        pin.position.set(px, -2.84, pz);
        fpcGrp.add(pin);
      }
    }
  }
  register('ld_fpc_btb_io', fpcGrp, [0.0, -5.8, 3.6]);

  return {
    root,
    parts,
    gridY: -3.65,
    defaultCameraPos: new THREE.Vector3(23.0, 18.0, 32.5),
    defaultTarget: new THREE.Vector3(4.2, 1.4, 0.4),
    clipBounds: { x: 13.0, y: 9.0, z: 9.5 }
  };
}
