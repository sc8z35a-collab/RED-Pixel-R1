import * as THREE from 'three';

/**
 * Phase 18 (19th Multiscale Mode / 566-Part Milestone!):
 * Ultra-Ultra-High Quantum Dissection ("超超高解剖") of the Front 6.8" 1-120 Hz
 * TANDEM LTPO OLED Live Camera Viewfinder Display (34 Independent Parts!):
 *   - LEFT ZONE (X_PAN = -5.6, 16 Parts): Stepped cutaway stack from Ceramic Shield -> OCA ->
 *     Y-OCTA 240Hz Metal-Mesh Touch -> Polarizer-Less COE -> MLA Micro-Lens Domes -> 3-Layer TFE ->
 *     Diamond PenTile RGGB Subpixels -> Black PDL -> LTPO Backplane -> Flexible PI -> COP DDIC ->
 *     3D Ultrasonic Piezo Fingerprint -> Copper/Graphite -> PORON -> MIPI DSI FPC -> Ti Frame!
 *   - RIGHT ZONE (X_TD = +7.4, 18 Parts, 50,000x Quantum Scale):
 *     Single TANDEM 2-Stack OLED Subpixel Tower with a-IGZO (1 Hz) + LTPS (3,000 nit) Hybrid TFTs,
 *     C_st Capacitor, ITO/Ag Bottom Microcavity Mirror, Stack-1 (HIL/HTL-1 -> EML-1 -> ETL-1),
 *     HERO n-CGL/p-CGL Quantum Tunnel Junction, Stack-2 (HTL-2 -> EML-2 -> ETL-2/EIL),
 *     12 nm Half-Mirror Mg:Ag Cathode, CPL, TFE/COE Cap, 50,000x MLA Dome, Fabry-Pérot Standing-Wave
 *     Antinodes, and LIVE Hole (h+) / Electron (e-) Dual-Stack Exciton Recombination + Photon Emission!
 */
export function buildOledTandemAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'OledTandemRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // =========================================================================
  // LEFT ZONE: 6.8" TANDEM LTPO OLED DISPLAY STACK CUTAWAY (X_PAN = -5.6)
  // =========================================================================
  const X_PAN = -5.6;

  // 01. Ceramic Shield Front Cover Glass & Oleophobic Coat (stepped cutaway leaving right half open!)
  const covGrp = new THREE.Group();
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 9.6), mats.lensSapphire);
    glass.position.set(X_PAN - 2.4, 2.72, 0.0);
    const oleo = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.04, 9.62), mats.oledMlaGlass);
    oleo.position.set(X_PAN - 2.4, 2.86, 0.0);
    covGrp.add(glass, oleo);
  }
  register('oled_cov_ceramic_shield', covGrp, [-1.4, 5.6, 0.0]);

  // 02. Refractive-Index-Matched OCA (n = 1.49) & Broadband AR Stack
  const ocaGrp = new THREE.Group();
  {
    const oca = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.10, 9.5), mats.fpFrostedGlass);
    oca.position.set(X_PAN - 1.95, 2.46, 0.0);
    ocaGrp.add(oca);
  }
  register('oled_cov_ar_oca_bond', ocaGrp, [-1.2, 4.8, 0.0]);

  // 03. Y-OCTA 240Hz On-Cell Diamond Metal-Mesh Touch Grid
  const touchGrp = new THREE.Group();
  {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 9.4), mats.oledYoctaMesh);
    mesh.position.set(X_PAN - 1.5, 2.24, 0.0);
    touchGrp.add(mesh);
  }
  register('oled_cov_y_octa_touch', touchGrp, [-1.0, 4.1, 0.0]);

  // 04. COE (Color Filter on Encapsulation) Polarizer-Less RGB Filter + Black Matrix
  const coeGrp = new THREE.Group();
  {
    const filt = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.10, 9.3), mats.mlColorRouter);
    filt.position.set(X_PAN - 1.1, 1.98, 0.0);
    coeGrp.add(filt);
  }
  register('oled_cov_coe_color_filter', coeGrp, [-0.8, 3.4, 0.0]);

  // 05. On-Panel High-Index Micro-Lens Array (MLA: Φ4 um Domes Breaking TIR!)
  const mlaArrGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.08, 9.2), mats.oledMlaGlass);
    slab.position.set(X_PAN - 0.75, 1.72, 0.0);
    mlaArrGrp.add(slab);
    const domeGeo = new THREE.SphereGeometry(0.24, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = -4; iz <= 4; iz++) {
        const d = new THREE.Mesh(domeGeo, mats.oledMlaGlass);
        d.position.set(X_PAN - 0.75 + ix * 0.96, 1.76, iz * 0.96);
        mlaArrGrp.add(d);
      }
    }
  }
  register('oled_cov_micro_lens_array', mlaArrGrp, [-0.6, 2.7, 0.0]);

  // 06. 3-Layer Thin-Film Encapsulation (TFE: SiNx / Organic Monomer / SiNx)
  const tfeGrp = new THREE.Group();
  {
    const tfe = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 9.1), mats.gaaHfo2HighK);
    tfe.position.set(X_PAN - 0.4, 1.46, 0.0);
    tfeGrp.add(tfe);
  }
  register('oled_cov_tfe_encap', tfeGrp, [-0.4, 2.0, 0.0]);

  // 07. Diamond PenTile RGGB Self-Emissive Subpixel Matrix (Live Scanning Pulse!)
  const subGrp = new THREE.Group();
  const subLiveMat = mats.oledDiamondSub.clone();
  {
    const matrix = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.14, 9.0), subLiveMat);
    matrix.position.set(X_PAN, 1.16, 0.0);
    // Golden zoom callout ring marking the single subpixel magnified 50,000x on the right!
    const reticle = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.055, 10, 24), mats.goldBond);
    reticle.rotation.x = Math.PI / 2;
    reticle.position.set(X_PAN + 3.1, 1.28, 0.4);
    subGrp.add(matrix, reticle);
    subGrp.userData.oledSubMat = subLiveMat;
  }
  register('oled_arr_diamond_subpixels', subGrp, [-0.4, 1.2, 0.0]);

  // 08. Black Polyimide Pixel Definition Layer (PDL) Micro-Wells & Photo-Spacers
  const pdlGrp = new THREE.Group();
  {
    const grid = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.10, 9.1), mats.lcpBlack);
    grid.position.set(X_PAN, 0.96, 0.0);
    // Raised PDL perimeter & micro photo-spacer pillars
    const pGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.22, 10);
    for (const px of [-3.6, 0, 3.6]) {
      for (const pz of [-3.6, 0, 3.6]) {
        const sp = new THREE.Mesh(pGeo, mats.lcpBlack);
        sp.position.set(X_PAN + px, 1.08, pz);
        pdlGrp.add(sp);
      }
    }
    pdlGrp.add(grid);
  }
  register('oled_arr_pdl_bank', pdlGrp, [-0.6, 0.5, 0.0]);

  // 09. 1-120 Hz Hybrid LTPO (LTPS + Oxide IGZO) TFT Backplane Array
  const ltpoGrp = new THREE.Group();
  {
    const bp = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.18, 9.2), mats.gaaSramBank);
    bp.position.set(X_PAN, 0.72, 0.0);
    ltpoGrp.add(bp);
  }
  register('oled_arr_ltpo_backplane', ltpoGrp, [-0.6, -0.2, 0.0]);

  // 10. Flexible 15 um Polyimide (PI) Substrate with U-Fold COP Bend on Front Edge!
  const piGrp = new THREE.Group();
  {
    const film = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.12, 9.3), mats.fpcPolyimide);
    film.position.set(X_PAN, 0.48, 0.0);
    // U-fold bend curving neatly underneath the front bezel (+Z = +4.65)!
    const bend = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 4.4, 20, 1, true, 0, Math.PI),
      mats.fpcPolyimide
    );
    bend.rotation.z = Math.PI / 2;
    bend.position.set(X_PAN, 0.12, 4.65);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.10, 2.2), mats.fpcPolyimide);
    tail.position.set(X_PAN, -0.24, 3.55);
    piGrp.add(film, bend, tail);
  }
  register('oled_arr_pi_substrate', piGrp, [-0.6, -0.9, 0.4]);

  // 11. COP Folded 10-bit 120Hz Display Driver IC (DDIC) tucked behind lower PI fold
  const ddicGrp = new THREE.Group();
  {
    const ic = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 1.05), mats.icPackageDark);
    ic.position.set(X_PAN, -0.44, 3.55);
    const goldPins = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.08, 1.15), mats.goldBond);
    goldPins.position.set(X_PAN, -0.34, 3.55);
    ddicGrp.add(ic, goldPins);
  }
  register('oled_arr_ddic_cop', ddicGrp, [-0.6, -1.8, 1.8]);

  // 12. Under-Display 3D Ultrasonic Piezo Fingerprint Sensor Module
  const fpGrp = new THREE.Group();
  {
    const mod = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.26, 2.2), mats.gaaIspBlock);
    mod.position.set(X_PAN, -0.36, 0.85);
    const piezo = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 1.85), mats.goldBond);
    piezo.position.set(X_PAN, -0.20, 0.85);
    fpGrp.add(mod, piezo);
  }
  register('oled_arr_3d_ultrasonic_fp', fpGrp, [-0.4, -2.1, 0.6]);

  // 13. Backside Pure-Copper Foil + Artificial Graphite EMI/Thermal Shield Sheet (with ultrasonic window!)
  const cuShGrp = new THREE.Group();
  {
    const topHalf = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.14, 4.4), mats.fpVaporCopper);
    topHalf.position.set(X_PAN, -0.02, -2.35);
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 4.6), mats.fpVaporCopper);
    leftSide.position.set(X_PAN - 2.95, -0.02, 2.15);
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 4.6), mats.fpVaporCopper);
    rightSide.position.set(X_PAN + 2.95, -0.02, 2.15);
    cuShGrp.add(topHalf, leftSide, rightSide);
  }
  register('oled_arr_copper_graphite', cuShGrp, [-0.8, -1.6, -0.4]);

  // 14. High-Damping PORON Drop-Shock Micro-Foam Cushion Layer
  const foamGrp = new THREE.Group();
  {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.18, 8.6), mats.susDarkInner);
    pad.position.set(X_PAN, -0.82, -0.15);
    foamGrp.add(pad);
  }
  register('oled_arr_sponge_cushion', foamGrp, [-0.8, -2.7, 0.0]);

  // 15. Dual MIPI DSI High-Speed Polyimide FPC & 50-Pin Gold BTB Connector
  const fpcGrp = new THREE.Group();
  {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.09, 3.2), mats.fpcPolyimide);
    ribbon.position.set(X_PAN + 3.4, -0.68, 2.2);
    const btb = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 0.72), mats.goldBond);
    btb.position.set(X_PAN + 3.4, -0.82, 3.55);
    fpcGrp.add(ribbon, btb);
  }
  register('oled_arr_fpc_btb', fpcGrp, [0.4, -2.4, 1.8]);

  // 16. Ultra-Narrow 1.2 mm Grade-5 Titanium Display Midframe Bezel Slice
  const frameGrp = new THREE.Group();
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.42, 10.2), mats.fpTitaniumFrame);
    base.position.set(X_PAN, -1.36, 0.0);
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 4.3, 10.2), mats.fpTitaniumFrame);
    railL.position.set(X_PAN - 4.92, 0.78, 0.0);
    const railBack = new THREE.Mesh(new THREE.BoxGeometry(10.2, 4.3, 0.36), mats.fpTitaniumFrame);
    railBack.position.set(X_PAN, 0.78, -4.92);
    frameGrp.add(base, railL, railBack);
  }
  register('oled_arr_ti_bezel_frame', frameGrp, [-1.0, -3.8, 0.0]);

  // =========================================================================
  // RIGHT ZONE: 50,000x QUANTUM TANDEM 2-STACK OLED TOWER + LTPO TFT (X_TD = +7.4)
  // =========================================================================
  const X_TD = 7.4;

  // 17. Oxide a-IGZO (InGaZnO) Ultra-Low-Leakage 1 Hz Switching TFT (left side of pixel base!)
  const igzoGrp = new THREE.Group();
  {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 2.2), mats.gaaSramBank);
    ch.position.set(X_TD - 2.1, -2.82, 0.0);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 2.5), mats.goldBond);
    gate.position.set(X_TD - 2.1, -2.46, 0.0);
    const sdL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.56, 2.2), mats.copperPad);
    sdL.position.set(X_TD - 3.05, -2.74, 0.0);
    const sdR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.56, 2.2), mats.copperPad);
    sdR.position.set(X_TD - 1.15, -2.74, 0.0);
    igzoGrp.add(ch, gate, sdL, sdR);
  }
  register('oled_q_igzo_switch_tft', igzoGrp, [-0.4, -3.4, 0.4]);

  // 18. ELA Poly-Si LTPS High-Mobility 3,000 nit Driving TFT (right side of pixel base!)
  const ltpsGrp = new THREE.Group();
  {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 2.4), mats.gaaIspBlock);
    ch.position.set(X_TD + 1.95, -2.84, 0.0);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.24, 2.65), mats.gaaWfmMetal);
    gate.position.set(X_TD + 1.95, -2.46, 0.0);
    // Vertical power drain via rising directly into bottom ITO/Ag Anode Mirror!
    const via = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.35, 16), mats.goldBond);
    via.position.set(X_TD + 2.55, -1.96, 0.0);
    ltpsGrp.add(ch, gate, via);
  }
  register('oled_q_ltps_drive_tft', ltpsGrp, [1.4, -3.4, 0.4]);

  // 19. Pixel Storage MIM Capacitor (C_st) Locking 10-bit Luminance Voltage during 1 Hz Hold
  const cstGrp = new THREE.Group();
  {
    const botPl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 2.2), mats.goldBond);
    botPl.position.set(X_TD - 0.1, -2.96, 0.0);
    const diel = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.20, 2.15), mats.gaaHfo2HighK);
    diel.position.set(X_TD - 0.1, -2.78, 0.0);
    const topPl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 2.2), mats.goldBond);
    topPl.position.set(X_TD - 0.1, -2.60, 0.0);
    cstGrp.add(botPl, diel, topPl);
  }
  register('oled_q_cst_capacitor', cstGrp, [0.4, -2.8, -0.8]);

  // 20. ITO / Ag (100 nm) / ITO High-Reflectance Bottom Microcavity Anode Mirror (R > 95%)
  const anodeGrp = new THREE.Group();
  {
    const ag = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.32, 5.2), mats.fpTitaniumFrame);
    ag.position.set(X_TD, -1.36, 0.0);
    const itoTop = new THREE.Mesh(new THREE.BoxGeometry(7.24, 0.08, 5.24), mats.oledMlaGlass);
    itoTop.position.set(X_TD, -1.16, 0.0);
    anodeGrp.add(ag, itoTop);
  }
  register('oled_q_ag_anode_mirror', anodeGrp, [0.6, -1.8, 0.0]);

  // 21. Stack 1 (Bottom) HIL & HTL-1 Hole Transport Layer
  const htl1Grp = new THREE.Group();
  {
    const htl1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.62, 4.8), mats.oledHtlBlue);
    htl1.position.set(X_TD, -0.78, 0.0);
    htl1Grp.add(htl1);
  }
  register('oled_q_hil_htl_stack1', htl1Grp, [0.6, -1.0, 0.0]);

  // 22. HERO Stack 1 Bottom Phosphorescent / TADF Emissive Layer (EML-1, 30 nm!)
  const eml1Grp = new THREE.Group();
  const eml1Mat = mats.oledEmlGlow.clone();
  {
    const eml1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.44, 4.8), eml1Mat);
    eml1.position.set(X_TD, -0.22, 0.0);
    eml1Grp.add(eml1);
    eml1Grp.userData.oledEml1Mat = eml1Mat;
  }
  register('oled_q_eml_stack1', eml1Grp, [0.8, -0.2, 0.6]);

  // 23. Stack 1 Electron Transport Layer (ETL-1) & HBL-1
  const etl1Grp = new THREE.Group();
  {
    const etl1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.46, 4.8), mats.oledEtlAmber);
    etl1.position.set(X_TD, 0.25, 0.0);
    etl1Grp.add(etl1);
  }
  register('oled_q_etl_stack1', etl1Grp, [0.6, 0.4, 0.0]);

  // 24. HERO: n-CGL / p-CGL Quantum Charge Generation Layer (15 nm Internal Tunnel Junction!)
  const cglGrp = new THREE.Group();
  const cglMat = mats.oledCglMagenta.clone();
  {
    const nCgl = new THREE.Mesh(new THREE.BoxGeometry(7.05, 0.16, 5.05), mats.gaaWfmMetal);
    nCgl.position.set(X_TD, 0.58, 0.0);
    const pCgl = new THREE.Mesh(new THREE.BoxGeometry(7.05, 0.20, 5.05), cglMat);
    pCgl.position.set(X_TD, 0.78, 0.0);
    cglGrp.add(nCgl, pCgl);
    cglGrp.userData.oledCglMat = cglMat;
  }
  register('oled_q_cgl_tunnel_junction', cglGrp, [1.2, 1.0, 1.0]);

  // 25. Stack 2 (Top) Hole Transport Layer (HTL-2)
  const htl2Grp = new THREE.Group();
  {
    const htl2 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.54, 4.8), mats.oledHtlBlue);
    htl2.position.set(X_TD, 1.18, 0.0);
    htl2Grp.add(htl2);
  }
  register('oled_q_htl_stack2', htl2Grp, [0.6, 1.6, 0.0]);

  // 26. HERO Stack 2 Upper Emissive Layer (EML-2, 30 nm Twin Tandem Quantum Light Engine!)
  const eml2Grp = new THREE.Group();
  const eml2Mat = mats.oledEmlGlow.clone();
  {
    const eml2 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.44, 4.8), eml2Mat);
    eml2.position.set(X_TD, 1.70, 0.0);
    eml2Grp.add(eml2);
    eml2Grp.userData.oledEml2Mat = eml2Mat;
  }
  register('oled_q_eml_stack2', eml2Grp, [0.8, 2.2, 0.6]);

  // 27. Stack 2 Electron Transport (ETL-2) & 1 nm LiF / Yb Electron Injection Layer (EIL)
  const etl2Grp = new THREE.Group();
  {
    const etl2 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.46, 4.8), mats.oledEtlAmber);
    etl2.position.set(X_TD, 2.18, 0.0);
    const eil = new THREE.Mesh(new THREE.BoxGeometry(6.84, 0.08, 4.84), mats.goldBond);
    eil.position.set(X_TD, 2.46, 0.0);
    etl2Grp.add(etl2, eil);
  }
  register('oled_q_etl_eil_stack2', etl2Grp, [0.6, 2.8, 0.0]);

  // 28. Ultra-Thin 12 nm Semi-Transparent Mg:Ag Top Cathode Half-Mirror
  const cathGrp = new THREE.Group();
  {
    const cath = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 5.2), mats.oledMgAgHalf);
    cath.position.set(X_TD, 2.64, 0.0);
    cathGrp.add(cath);
  }
  register('oled_q_mgag_cathode', cathGrp, [0.6, 3.4, 0.0]);

  // 29. High-Index (n ≈ 2.05) Organic Capping Layer (CPL, 70 nm)
  const cplGrp = new THREE.Group();
  {
    const cpl = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.28, 5.0), mats.gaaHfo2HighK);
    cpl.position.set(X_TD, 2.90, 0.0);
    cplGrp.add(cpl);
  }
  register('oled_q_cpl_capping', cplGrp, [0.6, 4.0, 0.0]);

  // 30. 50,000x TFE Nano-Barrier & COE Polarizer-Less Color-Filter Cap
  const capGrp = new THREE.Group();
  {
    const tfe = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.24, 5.2), mats.mlTio2IruCoupled);
    tfe.position.set(X_TD, 3.22, 0.0);
    const coe = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 4.4), mats.mlColorRouter);
    coe.position.set(X_TD, 3.48, 0.0);
    // Flanking Black Matrix walls around the COE filter
    for (const sx of [-1, 1]) {
      const bm = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 4.6), mats.lcpBlack);
      bm.position.set(X_TD + sx * 3.36, 3.48, 0.0);
      capGrp.add(bm);
    }
    capGrp.add(tfe, coe);
  }
  register('oled_q_tfe_nano_stack', capGrp, [0.8, 4.8, 0.0]);

  // 31. 50,000x High-Index Aspheric Micro-Lens Array (MLA) Photon Extraction Dome!
  const mlaGrp = new THREE.Group();
  {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.45, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.46),
      mats.oledMlaGlass
    );
    dome.scale.set(1.22, 0.68, 0.92);
    dome.position.set(X_TD, 3.60, 0.0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.07, 10, 42), mats.goldBond);
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1.22, 0.92, 1.0);
    rim.position.set(X_TD, 3.62, 0.0);
    mlaGrp.add(dome, rim);
  }
  register('oled_q_mla_dome_optics', mlaGrp, [0.8, 5.8, 0.0]);

  // 32. LIVE QUANTUM CARRIERS (Holes h+ ↑ & Electrons e- ↓) & LAUNCHED RGB MICROCAVITY PHOTONS!
  const carGrp = new THREE.Group();
  const oledHoles = [];
  const oledElectrons = [];
  const oledPhotons = [];
  {
    const cGeo = new THREE.SphereGeometry(0.15, 12, 10);
    const pGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const xs = [-2.1, -0.7, 0.7, 2.1];
    // Stack 1 & Stack 2 Holes (cyan-blue rising UP into EML-1 & EML-2!)
    xs.forEach((ox, idx) => {
      const h1 = new THREE.Mesh(cGeo, mats.oledHoleSphere);
      h1.position.set(X_TD + ox, -0.78, 1.35);
      h1.userData = { yStart: -1.12, yEnd: -0.22, phase: idx * 0.25 };
      carGrp.add(h1);
      oledHoles.push(h1);

      const h2 = new THREE.Mesh(cGeo, mats.oledHoleSphere);
      h2.position.set(X_TD + ox, 1.18, 1.35);
      h2.userData = { yStart: 0.78, yEnd: 1.70, phase: (idx * 0.25 + 0.15) % 1 };
      carGrp.add(h2);
      oledHoles.push(h2);

      // Stack 1 & Stack 2 Electrons (amber-gold descending DOWN into EML-1 & EML-2!)
      const e1 = new THREE.Mesh(cGeo, mats.gaaElectronPacket);
      e1.position.set(X_TD + ox, 0.25, 1.35);
      e1.userData = { yStart: 0.58, yEnd: -0.22, phase: idx * 0.25 };
      carGrp.add(e1);
      oledElectrons.push(e1);

      const e2 = new THREE.Mesh(cGeo, mats.gaaElectronPacket);
      e2.position.set(X_TD + ox, 2.18, 1.35);
      e2.userData = { yStart: 2.52, yEnd: 1.70, phase: (idx * 0.25 + 0.15) % 1 };
      carGrp.add(e2);
      oledElectrons.push(e2);

      // Launched Photon Wave-Packets rising cleanly out through Mg:Ag -> MLA Dome!
      const ph = new THREE.Mesh(pGeo, mats.oledEmlGlow);
      ph.position.set(X_TD + ox * 0.65, 3.85 + idx * 0.35, 0.85);
      ph.userData = { yStart: 1.72, yEnd: 6.45, phase: idx * 0.25 };
      carGrp.add(ph);
      oledPhotons.push(ph);
    });
    carGrp.userData.oledHoles = oledHoles;
    carGrp.userData.oledElectrons = oledElectrons;
    carGrp.userData.oledPhotons = oledPhotons;
  }
  register('oled_q_live_carriers_excitons', carGrp, [1.2, 1.4, 2.8]);

  // 33. Optical Fabry-Pérot Microcavity Standing-Wave Antinode Envelopes (locked onto EML-1 & EML-2!)
  const waveGrp = new THREE.Group();
  {
    // Twin sinusoidal standing-wave spindle envelopes on front-left & front-right edges of cavity!
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const y = -1.16 + t * 3.74; // Spans Ag Mirror (-1.16) -> Mg:Ag Half-Mirror (+2.58)!
      const r = 0.08 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.42; // 2 antinodes right at EML-1 & EML-2!
      pts.push(new THREE.Vector2(r, y));
    }
    const latheGeo = new THREE.LatheGeometry(pts, 24);
    const waveL = new THREE.Mesh(latheGeo, mats.oledStandingWave);
    waveL.position.set(X_TD - 3.05, 0, 2.15);
    const waveR = new THREE.Mesh(latheGeo, mats.oledStandingWave);
    waveR.position.set(X_TD + 3.05, 0, 2.15);
    waveGrp.add(waveL, waveR);
  }
  register('oled_q_microcavity_standing_wave', waveGrp, [1.4, 1.0, 2.2]);

  // 34. White Ceramic Quantum-Display Metrology Plinth
  const plinthGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.42, 7.6), mats.zmAluminaCeramic);
    slab.position.set(X_TD, -3.72, 0.0);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(9.32, 0.08, 7.72), mats.goldBond);
    rim.position.set(X_TD, -3.48, 0.0);
    for (let i = -3; i <= 3; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.34), mats.goldBond);
      tick.position.set(X_TD + i * 1.15, -3.42, 3.62);
      plinthGrp.add(tick);
    }
    plinthGrp.add(slab, rim);
  }
  register('oled_q_metrology_plinth', plinthGrp, [0.8, -4.6, 0.0]);

  return {
    root,
    parts,
    gridY: -4.1,
    defaultCameraPos: new THREE.Vector3(17.2, 14.8, 32.4),
    defaultTarget: new THREE.Vector3(4.8, 0.75, 0.0),
    clipBounds: { x: 13.5, y: 6.5, z: 6.2 }
  };
}
