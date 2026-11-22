import * as THREE from 'three';

/**
 * Helper: Builds a 240° cutaway cylindrical ring (hollow shell) centered at (cx, cy, cz)
 * facing open toward the default front-right isometric camera so interior wafer layers read clearly!
 */
function buildCutawayRing(cx, cy, cz, rIn, rOut, height, mat, openCut = true) {
  const pts = [
    new THREE.Vector2(rIn, -height * 0.5),
    new THREE.Vector2(rOut, -height * 0.5),
    new THREE.Vector2(rOut, height * 0.5),
    new THREE.Vector2(rIn, height * 0.5),
    new THREE.Vector2(rIn, -height * 0.5)
  ];
  const phiStart = openCut ? 1.58 : 0;
  const phiLen = openCut ? Math.PI * 2 - 1.78 : Math.PI * 2;
  const geo = new THREE.LatheGeometry(pts, 48, phiStart, phiLen);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, cy, cz);
  return mesh;
}

/**
 * Helper: Builds a 240° cutaway solid optical wafer disc centered at (cx, cy, cz).
 */
function buildCutawayDisc(cx, cy, cz, radius, height, mat, openCut = true) {
  const geo = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    48,
    1,
    false,
    openCut ? 1.58 : 0,
    openCut ? Math.PI * 2 - 1.78 : Math.PI * 2
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, cy, cz);
  return mesh;
}

/**
 * Phase 14 (15-Scale / 432-Part Milestone!):
 * Next-Gen Ultra-Thin Flat TiO2 Doublet Metalens Camera Module (TTL ~1.6 mm, Zero Curved Glass!)
 * + Monolithic MEMS Thin-Film PZT Autofocus Ring & Sub-Wavelength RGB Nano-Color-Router
 * + 20,000x Magnified Sub-Wavelength TiO2 Meta-Atom Nanofin Array & Live Plane->Spherical EM Wavefront Focusing (32 Independent Parts!)
 */
export function buildMetalensAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'MetalensRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  const X_L = -3.2; // Left/Center Ultra-Thin Wafer-Level Flat Metalens Camera Module
  const X_M = 8.6;  // Right-Hand 20,000x TiO2 Meta-Atom Nanophotonics & Live EM Wavefront Showcase

  // =========================================================================
  // GROUP 1: ULTRA-THIN WAFER-LEVEL HOUSING & FRONT CORRECTOR M1 (01-06)
  // =========================================================================

  // 01. Ultra-Slim 1.6 mm Non-Magnetic SUS304 Wafer-Level EMI Shield Can (240° cutaway)
  const shieldGrp = new THREE.Group();
  {
    shieldGrp.add(buildCutawayRing(X_L, 0.85, 0, 4.92, 5.18, 4.95, mats.susSteel, true));
    // Upper lip bezel framing entrance sapphire window
    shieldGrp.add(buildCutawayRing(X_L, 3.32, 0, 3.55, 5.18, 0.16, mats.susSteel, true));
    // Matte-black inner anti-glare liner
    shieldGrp.add(buildCutawayRing(X_L, 0.85, 0, 4.86, 4.92, 4.75, mats.susDarkInner, true));
  }
  register('ml_emi_shield_ring', shieldGrp, [-1.4, 5.6, -1.2]);

  // 02. Top Sapphire Optical Cover Glass & Dual-Side Broadband AR Coat
  const coverGrp = new THREE.Group();
  {
    coverGrp.add(buildCutawayDisc(X_L, 3.12, 0, 3.62, 0.16, mats.lensSapphire, true));
    coverGrp.add(buildCutawayDisc(X_L, 3.22, 0, 3.58, 0.04, mats.ircfCoating, true));
  }
  register('ml_sapphire_cover_ar', coverGrp, [-0.6, 5.0, 0.4]);

  // 03. Photolithographic Matte-Black Chromium (Cr/CrOx) Entrance Pupil Stop (f/1.8)
  const stopGrp = new THREE.Group();
  {
    stopGrp.add(buildCutawayRing(X_L, 2.76, 0, 2.38, 3.72, 0.12, mats.lcpBlack, true));
  }
  register('ml_entrance_pupil_stop', stopGrp, [-0.4, 4.3, 0.4]);

  // 04. Front 500 um Fused Silica (SiO2) Flat Optical Substrate (M1 Carrier)
  const m1SubGrp = new THREE.Group();
  {
    m1SubGrp.add(buildCutawayDisc(X_L, 2.42, 0, 3.68, 0.36, mats.mlFusedSilica, true));
  }
  register('ml_m1_silica_substrate', m1SubGrp, [-0.2, 3.6, 0.3]);

  // 05. Front 600 nm TiO2 Coma & Wide-FOV Corrector Metasurface Layer (M1)
  const m1MetaGrp = new THREE.Group();
  {
    // Concentric iridescent hyperbolic phase-wrapped metasurface disc directly under M1 silica
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.38, 3.38, 0.12, 52), mats.mlMetaSurfaceM1);
    disc.position.set(X_L, 2.16, 0);
    m1MetaGrp.add(disc);
  }
  register('ml_m1_tio2_corrector_layer', m1MetaGrp, [0.0, 2.9, 0.5]);

  // 06. DRIE-Etched Black Silicon Optical Air-Gap Spacer Wafer (650 um Cavity!)
  const spacerGrp = new THREE.Group();
  {
    spacerGrp.add(buildCutawayRing(X_L, 1.66, 0, 3.12, 3.82, 0.84, mats.siliconBulkSide, true));
    // Inner needle-like black silicon stray-light trap liner
    spacerGrp.add(buildCutawayRing(X_L, 1.66, 0, 3.04, 3.12, 0.80, mats.susDarkInner, true));
  }
  register('ml_si_spacer_wafer', spacerGrp, [-0.8, 2.2, -0.4]);

  // =========================================================================
  // GROUP 2: PRIMARY ACHROMATIC FOCUSING METALENS M2 & COLOR ROUTER (07-12)
  // =========================================================================

  // 07. Secondary 500 um Fused Silica (SiO2) Primary Focusing Substrate (M2 — LIVE MEMS AF MOVING!)
  const m2SubGrp = new THREE.Group();
  {
    m2SubGrp.add(buildCutawayDisc(X_L, 1.06, 0, 3.62, 0.34, mats.mlFusedSilica, true));
  }
  register('ml_m2_silica_substrate', m2SubGrp, [0.0, 1.5, 0.3], { metaMemsAf: true });

  // 08. Hero 650 nm Broadband Achromatic TiO2 Hyperbolic-Phase Focusing Metasurface (M2 — LIVE MEMS AF MOVING!)
  const m2MetaGrp = new THREE.Group();
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.36, 3.36, 0.14, 52), mats.mlMetaSurfaceM2);
    disc.position.set(X_L, 0.82, 0);
    m2MetaGrp.add(disc);

    // Subtle concentric raised phase-zone relief rings emphasizing nanophotonic structure
    for (const r of [0.85, 1.55, 2.20, 2.82]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 10, 48), mats.mlTio2FinMid);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(X_L, 0.74, 0);
      m2MetaGrp.add(ring);
    }
  }
  register('ml_m2_tio2_focusing_layer', m2MetaGrp, [0.2, 0.8, 0.7], { metaMemsAf: true });

  // 09. 12 nm Conformal ALD Al2O3 Environmental & Index-Matching Seal Overcoat
  const aldGrp = new THREE.Group();
  {
    aldGrp.add(buildCutawayDisc(X_L, 0.64, 0, 3.38, 0.05, mats.tpDielectricSiO2, true));
  }
  register('ml_protective_al2o3_cap', aldGrp, [0.3, 0.2, 0.8], { metaMemsAf: true });

  // 10. Matte-Black Edge-Blackening Collar & 4 Gold Dicing Alignment Fiducials
  const colGrp = new THREE.Group();
  {
    colGrp.add(buildCutawayRing(X_L, 0.92, 0, 3.58, 3.84, 0.62, mats.lcpBlack, true));
    for (const a of [0.4, 2.0, 3.6, 5.2]) {
      const fid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), mats.goldBond);
      fid.position.set(X_L + Math.cos(a) * 3.71, 1.25, Math.sin(a) * 3.71);
      colGrp.add(fid);
    }
  }
  register('ml_baffle_absorption_collar', colGrp, [-0.5, 0.6, 0.2], { metaMemsAf: true });

  // 11. Next-Gen GaN / TiO2 Sub-Wavelength RGB Photonic Nano-Color-Router Layer (2x Light Efficiency!)
  const routerGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.14, 4.3), mats.mlColorRouter);
    slab.position.set(X_L, -0.14, 0);
    routerGrp.add(slab);
  }
  register('ml_meta_color_router', routerGrp, [0.0, -0.4, 0.6]);

  // 12. Ultra-Thin 110 um Wafer-Bonded Dielectric IRCF & Zero-Order Absorber Ring
  const ircfGrp = new THREE.Group();
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.12, 4.5), mats.blueGlassIrcf);
    glass.position.set(X_L, -0.42, 0);
    ircfGrp.add(glass);
    // Zero-order perimeter mask frame
    const frameW = 5.65, frameD = 4.85;
    for (const sz of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.18, 0.24), mats.lcpBlack);
      b.position.set(X_L, -0.42, sz * (frameD * 0.5 - 0.12));
      ircfGrp.add(b);
    }
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, frameD), mats.lcpBlack);
      b.position.set(X_L + sx * (frameW * 0.5 - 0.12), -0.42, 0);
      ircfGrp.add(b);
    }
  }
  register('ml_zero_bump_ircf', ircfGrp, [0.0, -1.0, 0.5]);

  // =========================================================================
  // GROUP 3: ULTRA-THIN MEMS PIEZO-AF STAGE & COMPUTATIONAL WLC CMOS (13-20)
  // =========================================================================

  // 13. Ultra-Thin 250 um Monolithic Silicon + Thin-Film PZT MEMS Piezo-AF Ring Actuator!
  const memsGrp = new THREE.Group();
  {
    // Concentric segmented thin-film PZT piezoelectric ring around M2 carrier
    memsGrp.add(buildCutawayRing(X_L, 0.94, 0, 3.88, 4.66, 0.24, mats.zmPztCeramic, true));
    // Top Pt/Au thin-film piezo drive electrode ring
    memsGrp.add(buildCutawayRing(X_L, 1.08, 0, 3.94, 4.60, 0.05, mats.goldBond, true));
  }
  register('ml_mems_piezo_af_ring', memsGrp, [0.0, 1.3, 1.4], { metaMemsAf: true });

  // 14. 4× Etched Single-Crystal Silicon Serpentine MEMS Flexure Suspension Arms
  const flexGrp = new THREE.Group();
  {
    for (let i = 0; i < 4; i++) {
      const ang = i * (Math.PI / 2) + Math.PI / 4;
      const arm = new THREE.Group();
      arm.position.set(X_L, 0.72, 0);
      arm.rotation.y = ang;
      // 3-fold serpentine silicon spring connecting MEMS ring (r=4.66) to outer WLC ceramic frame
      const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.16), mats.beCuSpring);
      seg1.position.set(4.18, 0, -0.25);
      const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.65), mats.beCuSpring);
      seg2.position.set(4.48, 0, 0);
      const seg3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.16), mats.beCuSpring);
      seg3.position.set(4.18, 0, 0.25);
      arm.add(seg1, seg2, seg3);
      flexGrp.add(arm);
    }
  }
  register('ml_mems_flexure_arms', flexGrp, [0.0, 0.6, 1.6]);

  // 15. 4× Integrated Parallel-Plate Capacitive Z-Position Feedback Electrodes (< 20 nm!)
  const capGrp = new THREE.Group();
  {
    for (let i = 0; i < 4; i++) {
      const ang = i * (Math.PI / 2);
      const cx = X_L + Math.cos(ang) * 4.28;
      const cz = Math.sin(ang) * 4.28;
      // Upper moving electrode plate & lower fixed reference electrode plate
      const topPad = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.54), mats.tpGoosGauge);
      topPad.position.set(cx, 0.62, cz);
      const botPad = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.54), mats.goldBond);
      botPad.position.set(cx, 0.36, cz);
      capGrp.add(topPad, botPad);
    }
  }
  register('ml_capacitive_gap_sensors', capGrp, [0.0, 0.1, 1.8]);

  // 16. Wafer-Level Stacked BSI CMOS Image Sensor Die (TSV Flip-Chip — Zero Wire-Bond Height!)
  const cmosGrp = new THREE.Group();
  {
    const die = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.32, 4.6), mats.siliconBulkSide);
    die.position.set(X_L, -0.88, 0);
    const surf = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.06, 4.2), mats.sensorOpticalSurface);
    surf.position.set(X_L, -0.70, 0);
    cmosGrp.add(die, surf);
  }
  register('ml_bsi_cmos_die', cmosGrp, [0.0, -1.7, 0.2]);

  // 17. Ultra-Flat Molded Ceramic / LCP Wafer-Level Camera (WLC) Package Frame
  const pkgGrp = new THREE.Group();
  {
    const baseRing = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.46, 8.6), mats.llCeramicChamber);
    baseRing.position.set(X_L, -1.42, 0);
    pkgGrp.add(baseRing);
    // Corner support pillars linking package up to MEMS flexure seat
    for (const sx of [-4.2, 4.2]) {
      for (const sz of [-3.7, 3.7]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.95, 16), mats.llCeramicChamber);
        post.position.set(X_L + sx, -0.35, sz);
        pkgGrp.add(post);
      }
    }
  }
  register('ml_mob_ceramic_carrier', pkgGrp, [-0.3, -2.4, -0.2]);

  // 18. Co-Designed Computational Optics Neural-Deconvolution / Achromatic PSF Restoration IC
  const ispGrp = new THREE.Group();
  {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.30, 1.85), mats.icPackageDark);
    chip.position.set(X_L - 3.0, -1.94, 4.85);
    const accent = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 1.15), mats.mlTio2IruCoupled);
    accent.position.set(X_L - 3.0, -1.78, 4.85);
    ispGrp.add(chip, accent);
  }
  register('ml_computational_isp_asic', ispGrp, [-1.4, -3.1, 2.2]);

  // 19. Ultra-Thin 4-Layer HDI Rigid WLC Camera PCB + 01005 Decoupling MLCCs
  const pcbGrp = new THREE.Group();
  {
    const board = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.24, 11.4), mats.rigidPcb);
    board.position.set(X_L, -2.22, 0.9);
    pcbGrp.add(board);

    for (let i = 0; i < 8; i++) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), mats.mlccCeramic);
      cap.position.set(X_L - 0.6 + i * 0.42, -2.04, 5.55);
      pcbGrp.add(cap);
    }
  }
  register('ml_rigid_wlc_pcb', pcbGrp, [0.0, -3.5, 0.2]);

  // 20. EMI-Shielded MIPI CSI-2 Polyimide FPC & 24-Pin Gold BTB Mezzanine Connector
  const fpcGrp = new THREE.Group();
  {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.08, 2.15), mats.fpcPolyimide);
    ribbon.position.set(X_L + 1.85, -2.24, 7.25);
    const btb = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.26, 0.68), mats.lcpBlack);
    btb.position.set(X_L + 1.85, -2.32, 8.20);
    fpcGrp.add(ribbon, btb);

    for (let i = 0; i < 12; i++) {
      const px = X_L + 0.92 + i * 0.17;
      for (const dz of [-0.24, 0.24]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.14), mats.goldBond);
        pin.position.set(px, -2.18, 8.20 + dz);
        fpcGrp.add(pin);
      }
    }
  }
  register('ml_mipi_fpc_connector', fpcGrp, [0.8, -3.7, 3.6]);

  // =========================================================================
  // GROUP 4: 20,000x SUB-WAVELENGTH TiO2 META-ATOM NANOFIN ARRAY (21-26)
  // =========================================================================
  const Y_SUB_TOP = 0.45;
  const PILLAR_H = 1.32;
  const PITCH = 0.72; // 7x7 radial sub-wavelength meta-atom matrix spanning [-2.16, +2.16]

  // 21. 20,000x Fused Silica (SiO2 / n = 1.46) Glass Substrate Block & ALD Seed Layer
  const nanoSubGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.54, 5.45), mats.mlFusedSilica);
    slab.position.set(X_M, Y_SUB_TOP - 0.27, 0);
    nanoSubGrp.add(slab);
    const seed = new THREE.Mesh(new THREE.BoxGeometry(5.40, 0.05, 5.40), mats.ircfCoating);
    seed.position.set(X_M, Y_SUB_TOP + 0.01, 0);
    nanoSubGrp.add(seed);
  }
  register('ml_nano_silica_wafer', nanoSubGrp, [2.8, 0.4, 0.0]);

  // 22-25. Partition the 7x7 radial TiO2 Meta-Atom Matrix cleanly into 4 distinct nanophotonic parts!
  const centerPilGrp = new THREE.Group();
  const midFinGrp = new THREE.Group();
  const edgePilGrp = new THREE.Group();
  const iruGrp = new THREE.Group();
  const guideModeGrp = new THREE.Group();

  const guideMat = mats.mlWaveGuideGlow.clone();
  guideModeGrp.userData.metaGuideMat = guideMat;

  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      const px = X_M + ix * PITCH;
      const pz = iz * PITCH;
      const rGrid = Math.hypot(ix, iz);
      const yMid = Y_SUB_TOP + PILLAR_H * 0.5;

      // Internal glowing HE11 guided optical mode core inside every second/all meta-atoms!
      const modeR = rGrid <= 1.5 ? 0.11 : rGrid <= 2.5 ? 0.075 : 0.048;
      const modeCore = new THREE.Mesh(new THREE.CylinderGeometry(modeR, modeR, PILLAR_H * 0.86, 10), guideMat);
      modeCore.position.set(px, yMid, pz);
      guideModeGrp.add(modeCore);

      if (rGrid <= 1.45) {
        // 22. Center-Zone WIDE TiO2 Nanopillars (W = 0.42 -> highest n_eff -> max 2pi phase delay!)
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, PILLAR_H, 0.42), mats.mlTio2PillarCenter);
        pil.position.set(px, yMid, pz);
        centerPilGrp.add(pil);
      } else if (Math.abs(ix) === 2 && Math.abs(iz) === 2) {
        // 25. 4× Coupled Twin-Fin Achromatic Integrated-Resonant Units (IRUs — Group-Delay Matching!)
        const pair = new THREE.Group();
        pair.position.set(px, yMid, pz);
        pair.rotation.y = Math.atan2(iz, ix);
        const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, PILLAR_H, 0.11), mats.mlTio2IruCoupled);
        f1.position.z = -0.10;
        const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, PILLAR_H, 0.11), mats.mlTio2IruCoupled);
        f2.position.z = 0.10;
        pair.add(f1, f2);
        iruGrp.add(pair);
      } else if (rGrid <= 2.55) {
        // 23. Mid-Zone Anisotropic PB-Rotated TiO2 Nanofins (geometric phase phi_PB = +-2*theta!)
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.44, PILLAR_H, 0.17), mats.mlTio2FinMid);
        fin.position.set(px, yMid, pz);
        // True radial PB phase rotation angle theta = phi(r)/2 + azimuth!
        fin.rotation.y = Math.atan2(iz, ix) + rGrid * 0.55;
        midFinGrp.add(fin);
      } else {
        // 24. Outer-Zone Slender High-Aspect-Ratio (7:1) TiO2 Nanopillars (W = 0.16 -> min phase delay!)
        const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, PILLAR_H, 12), mats.mlTio2PillarEdge);
        sl.position.set(px, yMid, pz);
        edgePilGrp.add(sl);
      }
    }
  }
  register('ml_nano_tio2_center_pillars', centerPilGrp, [3.0, 2.2, 0.2]);
  register('ml_nano_tio2_mid_nanofins', midFinGrp, [3.6, 1.8, 0.8]);
  register('ml_nano_tio2_edge_pillars', edgePilGrp, [4.6, 1.4, 0.4]);
  register('ml_nano_iru_coupled_fins', iruGrp, [4.0, 2.8, 1.2]);

  // 26. 20,000x Sub-Wavelength Lattice Pitch Reference Frame (p = 320 nm < lambda / 2NA)
  const gridGrp = new THREE.Group();
  {
    const span = PITCH * 3.5;
    for (let i = -3; i <= 4; i++) {
      const off = (i - 0.5) * PITCH;
      const barX = new THREE.Mesh(new THREE.BoxGeometry(span * 2, 0.03, 0.025), mats.susSteel);
      barX.position.set(X_M, Y_SUB_TOP + 0.03, off);
      const barZ = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, span * 2), mats.susSteel);
      barZ.position.set(X_M + off, Y_SUB_TOP + 0.03, 0);
      gridGrp.add(barX, barZ);
    }
  }
  register('ml_nano_subwavelength_grid', gridGrp, [3.2, 0.9, -1.0]);

  // =========================================================================
  // GROUP 5: 20,000x LIVE EM WAVEFRONT TRANSFORMATION & AIRY FOCUS (27-32)
  // =========================================================================

  // 27. 20,000x Incoming Flat Electromagnetic Plane Wavefronts (3 Parallel Descending Planes — LIVE PROPAGATING!)
  const planeWaveGrp = new THREE.Group();
  const planeWaves = [];
  {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.08, 4.95), mats.mlWavePlane);
      const baseY = 2.15 + i * 0.72;
      w.position.set(X_M, baseY, 0);
      w.userData.planeIdx = i;
      planeWaveGrp.add(w);
      planeWaves.push(w);
    }
    planeWaveGrp.userData.metaPlaneWaves = planeWaves;
  }
  register('ml_wave_incident_planes', planeWaveGrp, [3.2, 4.2, 0.2]);

  // 28. 20,000x Confined HE11 Dielectric Waveguide Optical Modes inside TiO2 Nanopillars
  register('ml_wave_guided_modes', guideModeGrp, [3.4, 2.5, 1.4]);

  // 29. 20,000x Transmitted Curved Spherical Converging Wavefront Shells (3 Concave Bowls — LIVE FOCUSING!)
  const sphereWaveGrp = new THREE.Group();
  const sphereWaves = [];
  {
    const FOCAL_Y = -2.28;
    const radii = [2.25, 1.55, 0.88];
    for (let i = 0; i < radii.length; i++) {
      const R = radii[i];
      // Inverted spherical cap curving around focal point (X_M, FOCAL_Y, 0)!
      const capGeo = new THREE.SphereGeometry(R, 36, 18, 0, Math.PI * 2, 0, 0.82);
      const cap = new THREE.Mesh(capGeo, mats.mlWaveSphere);
      cap.position.set(X_M, FOCAL_Y, 0);
      cap.userData.sphereIdx = i;
      sphereWaveGrp.add(cap);
      sphereWaves.push(cap);
    }
    sphereWaveGrp.userData.metaSphereWaves = sphereWaves;
  }
  register('ml_wave_curved_spherical', sphereWaveGrp, [3.6, -1.2, 0.8]);

  // 30. 20,000x Diffraction-Limited Airy Disk Focal Spot (FWHM 375 nm + 1st Airy Ring!)
  const airyGrp = new THREE.Group();
  {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 28, 28), mats.mlAirySpot);
    core.scale.set(1.2, 0.55, 1.2);
    core.position.set(X_M, -2.30, 0);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 14, 42), mats.mlAirySpot);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(X_M, -2.32, 0);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.028, 12, 42), mats.mlWaveSphere);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(X_M, -2.33, 0);
    airyGrp.add(core, ring1, ring2);
  }
  register('ml_wave_airy_focal_spot', airyGrp, [3.8, -2.4, 1.2]);

  // 31. 20,000x Wrapped 0 -> 2pi Hyperbolic Phase-Delay Profile Ribbon phi(r)
  const phaseGrp = new THREE.Group();
  {
    const f = 2.6;
    const pts = [];
    const N = 84;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1; // [-1, 1]
      const r = u * 2.55;
      // Exact hyperbolic wrapped phase curve (sawtooth 0 -> 2pi!)
      const rawPhase = (Math.sqrt(r * r + f * f) - f) * 1.85;
      const wrapped = 1.0 - (rawPhase % 1.0);
      pts.push(new THREE.Vector3(X_M + r, Y_SUB_TOP + 0.15 + wrapped * 1.15, 2.95));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.055, 10, false), mats.mlPhaseRibbon);
    phaseGrp.add(ribbon);
  }
  register('ml_wave_phase_profile_ribbon', phaseGrp, [3.8, 1.2, 2.8]);

  // 32. 20,000x Nanophotonics Optical Bench Metrology Plinth
  const plinthGrp = new THREE.Group();
  {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.36, 5.9), mats.llCeramicChamber);
    plinth.position.set(X_M, -2.62, 0);
    const refRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.03, 10, 48), mats.tpGoosGauge);
    refRing.rotation.x = Math.PI / 2;
    refRing.position.set(X_M, -2.42, 0);
    plinthGrp.add(plinth, refRing);
  }
  register('ml_wave_metrology_plinth', plinthGrp, [4.0, -3.4, 0.0]);

  return {
    root,
    parts,
    gridY: -3.0,
    defaultCameraPos: new THREE.Vector3(26.0, 18.2, 41.0),
    defaultTarget: new THREE.Vector3(4.2, 0.35, 0.3),
    clipBounds: { x: 14.5, y: 6.5, z: 9.0 }
  };
}
