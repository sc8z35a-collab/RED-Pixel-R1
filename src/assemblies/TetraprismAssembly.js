import * as THREE from 'three';

/**
 * Helper: Builds a 240° cutaway optical lens element centered at (cx, 0, cz) using LatheGeometry.
 */
function buildCutawayLens(cx, cz, rMax, yBot, yTop, sagBot, sagTop, mat) {
  const pts = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), yBot + sagBot * (1 - 0.85 * u * u)));
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    pts.push(new THREE.Vector2(Math.max(0.001, u * rMax), yTop + sagTop * (1 - 0.82 * u * u + 0.1 * u * u * u * u)));
  }
  // Open front-right ~110° cutaway facing the default isometric camera
  const geo = new THREE.LatheGeometry(pts, 44, 1.56, Math.PI * 2 - 1.70);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(cx, 0, cz);
  return m;
}

/**
 * Helper: Builds a flat sloped mirror / coating slab sitting cleanly on an exact prism facet segment (x0,y0) -> (x1,y1).
 */
function buildFacetSlab(x0, y0, x1, y1, thickness, depthZ, outwardSign, mat) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  // Outward unit normal for edge (dx, dy)
  const nx = (-dy / len) * outwardSign;
  const ny = (dx / len) * outwardSign;
  const mx = (x0 + x1) * 0.5 + nx * (thickness * 0.5 + 0.015);
  const my = (y0 + y1) * 0.5 + ny * (thickness * 0.5 + 0.015);

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, thickness, depthZ), mat);
  mesh.position.set(mx, my, 0);
  mesh.rotation.z = angle;
  return mesh;
}

/**
 * Phase 12: 4-Bounce Folded Tetraprism 5x Telephoto Optical Engine (120 mm f/2.8)
 * + Horizontal 3D Sensor-Shift AF/OIS (X/Y/Z 10,000 Hz!)
 * + 500x Magnified TIR Evanescent-Wave & 99.6% Protected-Silver Dielectric Mirror Nano-Anatomy (32 Independent Parts!)
 *
 * Exact 4-Bounce Trigonometric W-Path inside the Monolithic LaSF (n = 1.88) Tetraprism:
 *   - Entrance Vertical Axis: X_IN = -6.0 (down through 7-element circular entrance barrel)
 *   - Bounce 1 (M1 Mirror, 18.82°): P1 = (-6.0, -1.25) -> reflects UP-RIGHT at 37.65° from vertical!
 *   - Bounce 2 (M2 TIR Roof, 37.65° > θ_c 32.13°): P2 = (-3.3, +2.25) -> 100% Lossless TIR DOWN-RIGHT!
 *   - Bounce 3 (M3 TIR Floor, 37.65° > θ_c 32.13°): P3 = (-0.6, -1.25) -> 100% Lossless TIR UP-RIGHT!
 *   - Bounce 4 (M4 Mirror, 18.82° // M1): P4 = (+2.1, +2.25) -> reflects STRAIGHT DOWN onto Horizontal 3D Sensor-Shift CMOS!
 */
export function buildTetraprismAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'TetraprismRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  const X_IN = -6.0;
  const X_OUT = 2.1;
  const PRISM_D = 4.6; // Z ∈ [-2.3, +2.3]

  // Exact 8-vertex monolithic Tetraprism contour (CCW in X-Y plane, exact 18.82° M1 & M4 facets!)
  const M1_X0 = -7.65, M1_Y0 = -0.69;
  const M1_X1 = -4.35, M1_Y1 = -1.81;
  const M4_X0 = 0.45, M4_Y0 = 2.81;
  const M4_X1 = 3.65, M4_Y1 = 1.72;

  // =========================================================================
  // GROUP 1: EMI SHIELD & CIRCULAR 7-ELEMENT ENTRANCE LENS BARREL (01-08)
  // =========================================================================

  // 01. Non-Magnetic SUS304 Front-Cutaway Tetraprism EMI Shield Can & Module Frame
  const shieldGrp = new THREE.Group();
  {
    // Back wall (-Z = -3.45), left wall (-X = -8.65), right wall (+X = +5.65), partial top roof framing entrance barrel!
    const backW = new THREE.Mesh(new THREE.BoxGeometry(14.3, 8.6, 0.22), mats.susSteel);
    backW.position.set(-1.5, -0.35, -3.55);
    shieldGrp.add(backW);

    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.22, 8.6, 6.9), mats.susSteel);
    leftW.position.set(-8.65, -0.35, -0.2);
    shieldGrp.add(leftW);

    // Compact rear-right corner pillar leaving right-side 3D sensor-shift coils & 500x inset 100% unobstructed!
    const rightStub = new THREE.Mesh(new THREE.BoxGeometry(0.22, 8.6, 1.95), mats.susSteel);
    rightStub.position.set(5.45, -0.35, -2.58);
    shieldGrp.add(rightStub);

    // Upper rear roof shelf connecting rear wall to right side (leaves entrance lens & front prism crystal-clear!)
    const roofBack = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.22, 2.2), mats.susSteel);
    roofBack.position.set(1.3, 3.85, -2.45);
    shieldGrp.add(roofBack);
  }
  register('tp_emi_shield_housing', shieldGrp, [-2.2, 5.2, -2.8]);

  // 02. Circular Sapphire Front Window & f/2.8 Matte-Black Entrance Aperture Stop
  const frontStopGrp = new THREE.Group();
  {
    const winPts = [
      new THREE.Vector2(0.001, 6.72),
      new THREE.Vector2(2.38, 6.72),
      new THREE.Vector2(2.38, 6.98),
      new THREE.Vector2(0.001, 6.98)
    ];
    const win = new THREE.Mesh(new THREE.LatheGeometry(winPts, 44, 1.56, Math.PI * 2 - 1.70), mats.lensSapphire);
    win.position.set(X_IN, 0, 0);
    frontStopGrp.add(win);

    // Matte-black f/2.8 circular entrance aperture ring
    const stopPts = [
      new THREE.Vector2(1.88, 6.52),
      new THREE.Vector2(2.68, 6.52),
      new THREE.Vector2(2.68, 6.74),
      new THREE.Vector2(1.88, 6.74),
      new THREE.Vector2(1.88, 6.52)
    ];
    const stop = new THREE.Mesh(new THREE.LatheGeometry(stopPts, 44, 1.56, Math.PI * 2 - 1.70), mats.lensEdgeBlack);
    stop.position.set(X_IN, 0, 0);
    frontStopGrp.add(stop);
  }
  register('tp_entrance_sapphire_stop', frontStopGrp, [-1.5, 7.6, 0.0]);

  // 03. G1 High-Index Lanthanum Molded Glass Positive Crown Front Element (Cutaway!)
  const g1Grp = new THREE.Group();
  g1Grp.add(buildCutawayLens(X_IN, 0, 2.28, 5.76, 6.24, 0.08, 0.36, mats.lensGlass1G));
  register('tp_lens_g1_lanthanum', g1Grp, [-1.2, 6.4, 0.2]);

  // 04. G2 High-Dispersion Flint APO Chromatic-Corrector Negative Meniscus (Cutaway!)
  const g2Grp = new THREE.Group();
  g2Grp.add(buildCutawayLens(X_IN, 0, 2.18, 5.26, 5.62, -0.22, -0.10, mats.lensResinFlint));
  register('tp_lens_g2_flint_apo', g2Grp, [-1.0, 5.4, 0.2]);

  // 05. G3 Low-Dispersion Crown Aspheric Telephoto Focusing Element (Cutaway!)
  const g3Grp = new THREE.Group();
  g3Grp.add(buildCutawayLens(X_IN, 0, 2.08, 4.58, 5.02, -0.06, 0.24, mats.lensResinApel));
  register('tp_lens_g3_ed_crown', g3Grp, [-0.9, 4.4, 0.2]);

  // 06. G4-G5 Achromatic Telephoto Corrector Pair & Inter-Lens Shading Foils (Cutaway!)
  const g45Grp = new THREE.Group();
  g45Grp.add(buildCutawayLens(X_IN, 0, 1.98, 4.02, 4.38, -0.14, 0.08, mats.lensResinGullwing));
  g45Grp.add(buildCutawayLens(X_IN, 0, 1.90, 3.48, 3.84, 0.04, 0.16, mats.lensResinApel));
  // Thin black shading foil ring between G4 and G5
  const foilPts = [
    new THREE.Vector2(1.48, 3.88),
    new THREE.Vector2(2.04, 3.88),
    new THREE.Vector2(2.04, 3.96),
    new THREE.Vector2(1.48, 3.96),
    new THREE.Vector2(1.48, 3.88)
  ];
  const foil = new THREE.Mesh(new THREE.LatheGeometry(foilPts, 40, 1.56, Math.PI * 2 - 1.70), mats.lensEdgeBlack);
  foil.position.set(X_IN, 0, 0);
  g45Grp.add(foil);
  register('tp_lens_g4_g5_doublet', g45Grp, [-0.8, 3.4, 0.2]);

  // 07. G6-G7 Rear Aspheric Prism-Matching Collimator & Field Corrector Pair (7-Element Stack!)
  const g67Grp = new THREE.Group();
  g67Grp.add(buildCutawayLens(X_IN, 0, 1.84, 2.94, 3.30, -0.10, 0.06, mats.lensResinFlint));
  g67Grp.add(buildCutawayLens(X_IN, 0, 1.78, 2.48, 2.82, 0.02, 0.12, mats.lensResinGullwing));
  register('tp_lens_g6_g7_exit', g67Grp, [-0.7, 2.5, 0.2]);

  // 08. Stepped Carbon-LCP Circular Entrance Barrel with 8 Serrated Stray-Light Baffles (Cutaway!)
  const barrelGrp = new THREE.Group();
  {
    const pts = [
      new THREE.Vector2(2.12, 2.34),
      new THREE.Vector2(2.68, 2.34),
      new THREE.Vector2(2.68, 6.72),
      new THREE.Vector2(2.36, 6.72),
      new THREE.Vector2(2.36, 5.72),
      new THREE.Vector2(2.24, 5.62),
      new THREE.Vector2(2.24, 4.60),
      new THREE.Vector2(2.12, 4.50),
      new THREE.Vector2(2.12, 2.34)
    ];
    const bMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 44, 1.56, Math.PI * 2 - 1.70), mats.lensLcpBarrel);
    bMesh.position.set(X_IN, 0, 0);
    barrelGrp.add(bMesh);
  }
  register('tp_lcp_lens_barrel', barrelGrp, [-2.0, 4.6, -0.6]);

  // =========================================================================
  // GROUP 2: MONOLITHIC 4-BOUNCE HIGH-INDEX TETRAPRISM & COATINGS (09-16)
  // =========================================================================

  // 09. HERO: Monolithic CNC-Ground High-Index LaSF Optical Glass Tetraprism (n = 1.88, 4-Bounce W-Path!)
  const prismGrp = new THREE.Group();
  {
    const s = new THREE.Shape();
    s.moveTo(-7.65, 2.25);     // Top-left entrance edge
    s.lineTo(M1_X0, M1_Y0);    // Left side down to M1 mirror start (-7.65, -0.69)
    s.lineTo(M1_X1, M1_Y1);    // M1 18.82° Mirror Facet passing through P1=(-6.0, -1.25)!
    s.lineTo(-2.25, -1.25);    // Transition into M3 TIR Floor
    s.lineTo(3.65, -1.25);     // Flat M3 TIR Floor (X=-0.6) + Flat Exit Face (X=+2.1)!
    s.lineTo(M4_X1, M4_Y1);    // Right side up to M4 mirror end (+3.65, +1.72)
    s.lineTo(M4_X0, M4_Y0);    // M4 18.82° Mirror Facet passing through P4=(+2.1, +2.25)!
    s.lineTo(-1.15, 2.25);     // Transition into M2 flat TIR Roof (Y=+2.25, X=-3.3)!
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: PRISM_D,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    geo.translate(0, 0, -PRISM_D * 0.5);
    const glassMesh = new THREE.Mesh(geo, mats.tpPrismGlass);
    prismGrp.add(glassMesh);

    // Crisp sapphire-blue precision optical edges outlining the crystal glass monolith!
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 18),
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.58 })
    );
    edges.userData.ignorePick = true;
    prismGrp.add(edges);
  }
  register('tp_tetraprism_glass_core', prismGrp, [-0.6, 0.8, 0.0]);

  // 10. Entrance Face 14-Layer Broadband AR Coating (X_IN = -6.0, Y = +2.25)
  const entArGrp = new THREE.Group();
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.78, 0.08, 40), mats.decoArDxCoat);
    disc.position.set(X_IN, 2.31, 0);
    entArGrp.add(disc);
  }
  register('tp_entrance_ar_coat', entArGrp, [-0.8, 2.2, 0.4]);

  // 11. Bounce 1 (M1, 18.82°) 99.6% Polarization-Preserving Protected-Silver + Dielectric Mirror Stack
  const m1Grp = new THREE.Group();
  {
    // Inner dielectric boost sheet + outer pure silver reflective slab along exact M1 facet!
    m1Grp.add(buildFacetSlab(M1_X0, M1_Y0, M1_X1, M1_Y1, 0.14, PRISM_D - 0.12, -1, mats.tpMirrorSilver));
    m1Grp.add(buildFacetSlab(M1_X0, M1_Y0, M1_X1, M1_Y1, 0.06, PRISM_D - 0.16, -1, mats.tpDielectricTiO2));
  }
  register('tp_mirror_m1_silver', m1Grp, [-2.4, -1.2, 0.5]);

  // 12. Bounce 2 (M2, 37.65° > θ_c) Lossless TIR Roof & 50 μm Air-Gap Protective Shield
  const m2Grp = new THREE.Group();
  {
    // Translucent cyan air-gap indicator slab + raised non-contact dark protective roof cover above P2 = (-3.3, +2.25)
    const airGap = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.12, PRISM_D - 0.16), mats.tpTirAirGap);
    airGap.position.set(-2.78, 2.34, 0);
    m2Grp.add(airGap);

    const cover = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.18, PRISM_D - 0.10), mats.susDarkInner);
    cover.position.set(-2.78, 2.54, 0);
    m2Grp.add(cover);
  }
  register('tp_tir_m2_roof_gap', m2Grp, [-0.6, 3.0, 0.2]);

  // 13. Bounce 3 (M3, 37.65° > θ_c) Lossless TIR Floor & Protective Black Baffle
  const m3Grp = new THREE.Group();
  {
    const airGap = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.12, PRISM_D - 0.16), mats.tpTirAirGap);
    airGap.position.set(-0.78, -1.34, 0);
    m3Grp.add(airGap);

    const baffle = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.18, PRISM_D - 0.10), mats.lensEdgeBlack);
    baffle.position.set(-0.78, -1.54, 0);
    m3Grp.add(baffle);
  }
  register('tp_tir_m3_floor_gap', m3Grp, [-0.4, -1.6, 0.5]);

  // 14. Bounce 4 (M4, 18.82° // M1) 99.6% Polarization-Preserving Protected-Silver + Dielectric Mirror Stack
  const m4Grp = new THREE.Group();
  {
    m4Grp.add(buildFacetSlab(M4_X0, M4_Y0, M4_X1, M4_Y1, 0.14, PRISM_D - 0.12, 1, mats.tpMirrorSilver));
    m4Grp.add(buildFacetSlab(M4_X0, M4_Y0, M4_X1, M4_Y1, 0.06, PRISM_D - 0.16, 1, mats.tpDielectricTiO2));
  }
  register('tp_mirror_m4_silver', m4Grp, [1.8, 2.8, 0.5]);

  // 15. Exit Face AR Coating (X_OUT = +2.1) & Non-Optical Side Edge-Blackening Mask
  const exitMaskGrp = new THREE.Group();
  {
    const exitAr = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 2.95), mats.decoArDxCoat);
    exitAr.position.set(X_OUT, -1.31, 0);
    exitMaskGrp.add(exitAr);

    // Matte-black edge-blackening ink pads (rear-half cutaway so front 4th bounce into CMOS sensor shines clear!)
    const rightInk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.85, 1.95), mats.lensEdgeBlack);
    rightInk.position.set(3.74, 0.22, -1.25);
    exitMaskGrp.add(rightInk);

    const leftInk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.85, 1.95), mats.lensEdgeBlack);
    leftInk.position.set(-7.74, 0.78, -1.25);
    exitMaskGrp.add(leftInk);
  }
  register('tp_exit_ar_black_mask', exitMaskGrp, [0.4, -0.5, 0.8]);

  // 16. Zero-Stress 3-Point Kinematic Tetraprism Mount Cradle & Silicone Cushion Pads
  const cradleGrp = new THREE.Group();
  {
    // Rear spine rail holding prism strictly by its rear non-optical face so front face & TIR gaps stay 100% open!
    const spine = new THREE.Mesh(new THREE.BoxGeometry(11.9, 3.65, 0.42), mats.lcpBlack);
    spine.position.set(-2.0, 0.48, -PRISM_D * 0.5 - 0.34);
    cradleGrp.add(spine);

    // 3 orange elastomer stress-free kinematic cushion pads
    for (const [px, py] of [[-6.5, 0.8], [-2.0, 0.5], [2.4, 0.2]]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.16), mats.apStopElastomer);
      pad.position.set(px, py, -PRISM_D * 0.5 - 0.08);
      cradleGrp.add(pad);
    }
  }
  register('tp_prism_kinematic_cradle', cradleGrp, [-1.2, 0.4, -2.4]);

  // =========================================================================
  // GROUP 3: HORIZONTAL 3D SENSOR-SHIFT OIS + AF ENGINE (X/Y/Z 10,000 Hz!) (17-25)
  // Positioned squarely beneath the Tetraprism Exit Face at X_OUT = +2.1!
  // =========================================================================

  // 17. Exit-Plane Cu²⁺ Blue-Glass Infrared Cut Filter (IRCF 650 nm)
  const ircfGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.16, 2.75), mats.blueGlassIrcf);
    slab.position.set(X_OUT, -1.96, 0);
    ircfGrp.add(slab);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.22, 3.15), mats.susDarkInner);
    frame.position.set(X_OUT, -1.96, 0);
    // Use 4 crisp perimeter bars instead of solid box so blue glass stays crystal clear!
    ircfGrp.remove(frame);
    for (const sz of [-1.48, 1.48]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.22, 0.20), mats.susDarkInner);
      b.position.set(X_OUT, -1.96, sz);
      ircfGrp.add(b);
    }
    for (const sx of [-1.72, 1.72]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 2.76), mats.susDarkInner);
      b.position.set(X_OUT + sx, -1.96, 0);
      ircfGrp.add(b);
    }
  }
  register('tp_blue_glass_ircf', ircfGrp, [0.8, -1.5, 0.4]);

  // 18. Horizontal Quad-Pixel 100% Focus-Pixel Telephoto BSI CMOS Sensor (LIVE 3D X/Y/Z MOVING!)
  const sensorGrp = new THREE.Group();
  {
    const die = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.24, 2.45), mats.siliconBulkSide);
    die.position.set(X_OUT, -2.74, 0);
    sensorGrp.add(die);

    const active = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.05, 2.08), mats.sensorOpticalSurface);
    active.position.set(X_OUT, -2.60, 0);
    sensorGrp.add(active);

    // Subtle micro-gold wire-bond rows along sensor edges
    for (let i = 0; i < 10; i++) {
      const wx = X_OUT - 1.12 + i * 0.25;
      for (const sz of [-1.32, 1.32]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.24), mats.goldBond);
        w.position.set(wx, -2.64, sz);
        sensorGrp.add(w);
      }
    }
  }
  register('tp_cmos_tele_sensor', sensorGrp, [1.2, -2.2, 0.4], { tetraSensor3d: true });

  // 19. Ultra-Light 3D Sensor-Shift Moving Carrier (X/Y OIS + Z AF — LIVE 3D MOVING!)
  const carrierGrp = new THREE.Group();
  {
    const stage = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.26, 3.85), mats.oisCarrierPcb);
    stage.position.set(X_OUT, -3.02, 0);
    carrierGrp.add(stage);
  }
  register('tp_3d_sensor_carrier', carrierGrp, [1.2, -3.0, 0.4], { tetraSensor3d: true });

  // 20. Twin Horizontal X / Y Planar OIS Voice Coils (Mounted on 3D Moving Carrier!)
  const xyCoilGrp = new THREE.Group();
  {
    for (const sz of [-1.62, 1.62]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.22, 0.56), mats.copperCoil);
      c.position.set(X_OUT, -3.26, sz);
      xyCoilGrp.add(c);
    }
  }
  register('tp_xy_ois_voice_coils', xyCoilGrp, [1.2, -3.6, 1.2], { tetraSensor3d: true });

  // 21. Twin Vertical Z-Axis Sensor-Shift Autofocus Voice Coils (Moves Sensor Up/Down in Z!)
  const zCoilGrp = new THREE.Group();
  {
    for (const sx of [-2.38, 2.38]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 2.45), mats.copperCoil);
      c.position.set(X_OUT + sx, -2.86, 0);
      zCoilGrp.add(c);
    }
  }
  register('tp_z_af_voice_coils', zCoilGrp, [1.8, -2.9, 0.6], { tetraSensor3d: true });

  // 22. 4x Shared Multi-Pole N52H Neodymium Magnets & Permalloy Flux-Return Yoke (Static!)
  const magGrp = new THREE.Group();
  {
    // Left/Right side magnets driving vertical Z-AF coils & Front/Rear magnets driving horizontal XY-OIS coils!
    for (const sx of [-2.92, 2.92]) {
      const mN = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 2.55), mats.lensMagnetN);
      mN.position.set(X_OUT + sx, -2.62, 0);
      magGrp.add(mN);
      const mS = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 2.55), mats.lensMagnetS);
      mS.position.set(X_OUT + sx, -3.08, 0);
      magGrp.add(mS);
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.96, 2.65), mats.yokePermalloy);
      yoke.position.set(X_OUT + sx + Math.sign(sx) * 0.28, -2.85, 0);
      magGrp.add(yoke);
    }
    for (const sz of [-2.22, 2.22]) {
      const mN = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.36, 0.56), mats.lensMagnetN);
      mN.position.set(X_OUT - 0.68, -3.65, sz);
      magGrp.add(mN);
      const mS = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.36, 0.56), mats.lensMagnetS);
      mS.position.set(X_OUT + 0.68, -3.65, sz);
      magGrp.add(mS);
    }
  }
  register('tp_3d_ndfeb_magnets', magGrp, [2.0, -4.4, 0.2]);

  // 23. 3D Etched BeCu Flexure Suspension Springs & S-Curve Serpentine High-Speed MIPI Interconnect
  const flexGrp = new THREE.Group();
  {
    // 4 corner BeCu 3D parallel-link flexure arms + front serpentine polyimide MIPI flex ribbon!
    for (const [cx, cz] of [[-2.4, -1.95], [2.4, -1.95], [-2.4, 1.95], [2.4, 1.95]]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.26), mats.beCuSpring);
      arm.position.set(X_OUT + cx, -2.98, cz);
      flexGrp.add(arm);
    }
    // S-curve serpentine MIPI flex connecting moving carrier to main PCB on left (-X)
    const sCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X_OUT - 2.22, -3.02, 0.0),
      new THREE.Vector3(X_OUT - 3.05, -2.72, 1.25),
      new THREE.Vector3(X_OUT - 3.65, -3.55, -0.85),
      new THREE.Vector3(X_OUT - 4.45, -4.05, 0.0)
    ]);
    const flexRibbon = new THREE.Mesh(new THREE.TubeGeometry(sCurve, 28, 0.14, 8, false), mats.fpcPolyimide);
    flexGrp.add(flexRibbon);
  }
  register('tp_3d_flexure_suspension', flexGrp, [0.2, -3.5, 1.4]);

  // 24. 3-Axis (X / Y / Z) Sub-Micron Closed-Loop Hall/TMR Position Sensors (x3)
  const hallGrp = new THREE.Group();
  {
    const coords = [
      [X_OUT, -3.58, -1.62],     // Y-axis Hall
      [X_OUT, -3.58, 1.62],      // X/Roll differential Hall
      [X_OUT + 2.38, -3.58, 0.0] // Z-axis AF Hall!
    ];
    for (const [hx, hy, hz] of coords) {
      const ic = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.20, 0.46), mats.hallSensorEmerald);
      ic.position.set(hx, hy, hz);
      hallGrp.add(ic);
    }
  }
  register('tp_3d_hall_tmr_sensors', hallGrp, [1.2, -4.2, 1.6]);

  // 25. 10 kHz 3D Sensor-Shift PID Driver ASIC, 01005 MLCCs, Rigid Base PCB & MIPI BTB FPC
  const pcbGrp = new THREE.Group();
  {
    const board = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.44, 6.6), mats.rigidPcb);
    board.position.set(-1.5, -4.24, -0.15);
    pcbGrp.add(board);

    // 10 kHz 3D Sensor-Shift Closed-Loop PID Driver ASIC positioned neatly on the left electronics deck!
    const asic = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.46, 2.05), mats.icPackageDark);
    asic.position.set(-5.8, -3.79, 0.65);
    pcbGrp.add(asic);
    const asicCap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.92), mats.hallSensorEmerald);
    asicCap.position.set(-5.8, -3.54, 0.65);
    pcbGrp.add(asicCap);

    // 8x 01005 decoupling MLCCs beside the ASIC
    for (let i = 0; i < 8; i++) {
      const mx = -3.85 + (i % 4) * 0.56;
      const mz = 0.20 + Math.floor(i / 4) * 0.82;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.24), mats.mlccCeramic);
      cap.position.set(mx, -3.90, mz);
      pcbGrp.add(cap);
    }

    // MIPI CSI-2 Polyimide FPC tail & 30-pin gold BTB mezzanine connector exiting front-left (+Z)
    const fpc = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.10, 2.75), mats.fpcPolyimide);
    fpc.position.set(-5.2, -4.18, 4.45);
    pcbGrp.add(fpc);
    const btb = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.36, 0.86), mats.btbHousing);
    btb.position.set(-5.2, -3.96, 5.65);
    pcbGrp.add(btb);
    for (let p = 0; p < 8; p++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.20), mats.goldBond);
      pin.position.set(-6.75 + p * 0.44, -3.94, 5.98);
      pcbGrp.add(pin);
    }
  }
  register('tp_driver_asic_pcb_fpc', pcbGrp, [-0.8, -5.2, 0.6]);

  // =========================================================================
  // GROUP 4: 500x MAGNIFIED TIR EVANESCENT-WAVE & 99.6% MIRROR NANO-STACK INSET (26-32)
  // Positioned cleanly on the right side (X_MIC = +9.4, Y_MIC = +0.55, Z_MIC = +0.0)!
  // =========================================================================
  const X_MIC = 10.4;
  const Y_MIC = 0.35;
  const W_MIC = 5.4;
  const D_MIC = 4.6;

  // 26. 500x High-Index LaSF Optical Glass Substrate (n_d = 1.88, Top Half)
  const mGlassGrp = new THREE.Group();
  {
    const block = new THREE.Mesh(new THREE.BoxGeometry(W_MIC, 2.85, D_MIC), mats.tpPrismGlass);
    block.position.set(X_MIC, Y_MIC + 1.48, 0);
    mGlassGrp.add(block);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(W_MIC, 2.85, D_MIC)),
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.55 })
    );
    edges.position.set(X_MIC, Y_MIC + 1.48, 0);
    edges.userData.ignorePick = true;
    mGlassGrp.add(edges);
  }
  register('tp_micro_lasf_glass', mGlassGrp, [2.8, 2.8, 0.0]);

  // 27. 500x Phase-Matched SiO₂ / TiO₂ Enhanced Dielectric Mirror Stack (Right Half: M1/M4 Mirror Zone!)
  const mDielGrp = new THREE.Group();
  {
    // 4 alternating cyan (SiO₂) and violet (TiO₂) nanometer layers on the right half (X ∈ [X_MIC+0.08, X_MIC+2.70])
    const halfW = W_MIC * 0.48;
    const xR = X_MIC + W_MIC * 0.25;
    for (let i = 0; i < 4; i++) {
      const layer = new THREE.Mesh(
        new THREE.BoxGeometry(halfW, 0.16, D_MIC - 0.04),
        i % 2 === 0 ? mats.tpDielectricSiO2 : mats.tpDielectricTiO2
      );
      layer.position.set(xR, Y_MIC - 0.06 - i * 0.18, 0);
      mDielGrp.add(layer);
    }
  }
  register('tp_micro_dielectric_boost', mDielGrp, [3.6, 0.8, 0.4]);

  // 28. 500x 120 nm Ultra-Pure Vacuum-Evaporated Silver (Ag) Primary Mirror Film
  const mAgGrp = new THREE.Group();
  {
    const halfW = W_MIC * 0.48;
    const xR = X_MIC + W_MIC * 0.25;
    const ag = new THREE.Mesh(new THREE.BoxGeometry(halfW, 0.34, D_MIC - 0.04), mats.tpMirrorSilver);
    ag.position.set(xR, Y_MIC - 0.94, 0);
    mAgGrp.add(ag);
  }
  register('tp_micro_silver_layer', mAgGrp, [3.8, -0.4, 0.5]);

  // 29. 500x NiCr Sulfidation-Barrier + Matte-Black Opaque Rear Protective Paint Coat
  const mProtGrp = new THREE.Group();
  {
    const halfW = W_MIC * 0.48;
    const xR = X_MIC + W_MIC * 0.25;
    const nicr = new THREE.Mesh(new THREE.BoxGeometry(halfW, 0.16, D_MIC - 0.04), mats.yokePermalloy);
    nicr.position.set(xR, Y_MIC - 1.22, 0);
    mProtGrp.add(nicr);

    const black = new THREE.Mesh(new THREE.BoxGeometry(halfW, 0.34, D_MIC - 0.04), mats.lensEdgeBlack);
    black.position.set(xR, Y_MIC - 1.50, 0);
    mProtGrp.add(black);
  }
  register('tp_micro_nicr_black_coat', mProtGrp, [4.0, -1.6, 0.6]);

  // 30. 500x 3D Propagating Incident & Reflected Electromagnetic Wave Crests (Exact θ_i = θ_r — LIVE ANIMATED!)
  const mWaveGrp = new THREE.Group();
  {
    // Build twin 3D sinusoidal wave tubes inside the LaSF glass:
    // Left half = TIR bounce (incident from top-left -> boundary -> reflected top-right with tiny Goos-Hänchen shift!)
    const buildSineTube = (pStart, pEnd, amp, cycles, mat) => {
      const dir = pEnd.clone().sub(pStart);
      const len = dir.length();
      const uDir = dir.clone().divideScalar(len);
      const perp = new THREE.Vector3(-uDir.y, uDir.x, 0);
      const pts = [];
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = pStart.clone().addScaledVector(dir, t);
        p.addScaledVector(perp, Math.sin(t * Math.PI * 2 * cycles) * amp);
        pts.push(p);
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.Mesh(new THREE.TubeGeometry(curve, 52, 0.075, 10, false), mat);
    };

    // Incident wave entering TIR zone from top-left toward boundary at (X_MIC - 1.45, Y_MIC + 0.08)
    const incWave = buildSineTube(
      new THREE.Vector3(X_MIC - 2.48, Y_MIC + 2.75, 0.85),
      new THREE.Vector3(X_MIC - 1.42, Y_MIC + 0.08, 0.85),
      0.16,
      4.0,
      mats.tpWaveCrest
    );
    mWaveGrp.add(incWave);

    // Reflected wave emerging after tiny Goos-Hänchen shift (+0.52 right!) toward top-right!
    const refWave = buildSineTube(
      new THREE.Vector3(X_MIC - 0.90, Y_MIC + 0.08, 0.85),
      new THREE.Vector3(X_MIC + 0.16, Y_MIC + 2.75, 0.85),
      0.16,
      4.0,
      mats.tpWaveCrest
    );
    mWaveGrp.add(refWave);

    // Second wave pair on right half reflecting sharply off the 99.6% Silver-Dielectric Mirror!
    const incM = buildSineTube(
      new THREE.Vector3(X_MIC + 0.68, Y_MIC + 2.75, -0.55),
      new THREE.Vector3(X_MIC + 1.45, Y_MIC + 0.04, -0.55),
      0.14,
      3.5,
      mats.tpWaveCrest
    );
    const refM = buildSineTube(
      new THREE.Vector3(X_MIC + 1.45, Y_MIC + 0.04, -0.55),
      new THREE.Vector3(X_MIC + 2.22, Y_MIC + 2.75, -0.55),
      0.14,
      3.5,
      mats.tpWaveCrest
    );
    mWaveGrp.add(incM, refM);
  }
  mWaveGrp.userData.tetraWaveMat = mats.tpWaveCrest;
  register('tp_micro_incident_wave', mWaveGrp, [2.6, 3.6, 1.4]);

  // 31. 500x Decaying TIR Evanescent Wave Penetration Cloud (d_p ≈ 150 nm into Air Gap!)
  const mEvanGrp = new THREE.Group();
  {
    // Exponentially decaying crimson-rose nested glowing wave pillows protruding down into the left-half TIR air gap!
    const xL = X_MIC - W_MIC * 0.25;
    const widths = [2.35, 1.95, 1.48, 0.96];
    const heights = [0.22, 0.24, 0.24, 0.22];
    const yOffs = [-0.14, -0.40, -0.66, -0.90];
    for (let i = 0; i < widths.length; i++) {
      const m = mats.tpEvanescentGlow.clone();
      m.opacity = 0.72 - i * 0.15;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(widths[i], heights[i], D_MIC - 0.5 - i * 0.45), m);
      slab.position.set(xL, Y_MIC + yOffs[i], 0.35);
      mEvanGrp.add(slab);
    }
  }
  register('tp_micro_evanescent_field', mEvanGrp, [1.8, -0.8, 1.6], { tetraEvanescent: true });

  // 32. 500x Goos-Hänchen Lateral Beam Shift Gauge (δ_GH) & Ceramic Metrology Plinth
  const mGhGrp = new THREE.Group();
  {
    // Emerald horizontal lateral-shift arrow bridging exact incident point (-1.42) -> reflected emergence (-0.90)!
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.65, 12), mats.tpGoosGauge);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(X_MIC - 1.18, Y_MIC - 0.02, D_MIC * 0.5 + 0.16);
    mGhGrp.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 14), mats.tpGoosGauge);
    head.rotation.z = -Math.PI / 2;
    head.position.set(X_MIC - 0.78, Y_MIC - 0.02, D_MIC * 0.5 + 0.16);
    mGhGrp.add(head);

    // Precision ceramic metrology base plinth cleanly supporting the 500x inset above the CAD grid!
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W_MIC + 0.65, 0.48, D_MIC + 0.55), mats.ldCeramicHousing);
    plinth.position.set(X_MIC, -3.55, 0);
    mGhGrp.add(plinth);
  }
  register('tp_micro_goos_hanchen', mGhGrp, [4.6, -2.6, 1.6]);

  return {
    root,
    parts,
    gridY: -4.65,
    defaultCameraPos: new THREE.Vector3(27.8, 20.0, 38.2),
    defaultTarget: new THREE.Vector3(4.8, 0.3, 0.2),
    clipBounds: { x: 16.0, y: 9.0, z: 10.5 }
  };
}
