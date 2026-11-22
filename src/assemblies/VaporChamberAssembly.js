import * as THREE from 'three';

/**
 * Phase 19 (EXACTLY 20th MULTISCALE MODE / EXACTLY 600-PART GRAND MILESTONE!!):
 * Ultra-Ultra-High Two-Phase Microfluidic Dissection ("超超高解剖") of the
 * Ultra-Thin 0.35 mm Pure-Copper 3D Vapor Chamber (34 Independent Parts!):
 *   - LEFT ZONE (X_VC = -5.6, 16 Parts): Full Smartphone 0.35 mm Oxygen-Free Copper (C1020)
 *     3D Vapor Chamber Cutaway with Artificial Graphite Spreader, Cutaway 50 um Cu Ceiling,
 *     Fiber-Laser Hermetic Seam, Degassing Pinch-Off Tail, SoC Hotspot Evaporator Pad,
 *     Anti-Collapse Support Pillar Matrix, Sintered Copper Powder Wick, #300 Woven Mesh,
 *     Axial Return Grooves, Open 150 um Vapor Core, Condenser Ribs, CuO Hydrophilic Coat,
 *     Midframe Boss, Dual NTC Thermistors & Live Infrared Thermal Equilibrium Map!
 *   - RIGHT ZONE (X_MW = +7.4, 18 Parts, 1,000x Micro-Scale):
 *     2-Layer Φ40 um Sintered Copper Micro-Spheres with Solid-State Diffusion Necks,
 *     Super-Hydrophilic CuO Nanoblade Whiskers (θ < 5°), Saturated Deionized H2O Pool,
 *     HERO Concave Thin-Film Capillary Menisci (Young-Laplace ΔP = 2σ cosθ / r_eff),
 *     Phase-Change Evaporation Plumes, Support Pillar Cutaway, Open Vacuum Vapor Core (45°C Boiling!),
 *     Biphilic Dropwise-Condensation Ceiling + Coalescing Sapphire Droplets, #300 Woven Return Mesh,
 *     and LIVE 24-Particle Closed-Loop Two-Phase Evaporation <-> Capillary Return Cycle!
 */
export function buildVaporChamberAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'VaporChamberRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // =========================================================================
  // LEFT ZONE: 0.35 mm PURE-COPPER 3D VAPOR CHAMBER MACRO CUTAWAY (X_VC = -5.6)
  // =========================================================================
  const X_VC = -5.6;

  // 01. Multi-Layer Artificial Pyrolytic Graphite Spreader (1,500 W/m·K, cutaway back-left!)
  const graphGrp = new THREE.Group();
  {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.14, 3.2), mats.susDarkInner);
    sheet.position.set(X_VC, 1.88, -2.55);
    graphGrp.add(sheet);
  }
  register('vc_mac_graphite_spreader', graphGrp, [-0.8, 5.2, -1.2]);

  // 02. Top 50 um Oxygen-Free Copper (C1020) Condensation Ceiling Plate (L-cutaway exposing vapor cavity!)
  const topCuGrp = new THREE.Group();
  {
    const rearStrip = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 2.8), mats.fpVaporCopper);
    rearStrip.position.set(X_VC, 1.54, -2.85);
    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 5.6), mats.fpVaporCopper);
    leftStrip.position.set(X_VC - 3.55, 1.54, 1.35);
    topCuGrp.add(rearStrip, leftStrip);
  }
  register('vc_mac_top_cu_foil', topCuGrp, [-1.0, 4.0, -0.6]);

  // 03. Continuous Fiber-Laser Perimeter Hermetic Diffusion-Bond / Weld Seam
  const seamGrp = new THREE.Group();
  {
    const fBar = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.42, 0.34), mats.goldBond);
    fBar.position.set(X_VC, 0.62, 4.25);
    const bBar = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.42, 0.34), mats.goldBond);
    bBar.position.set(X_VC, 0.62, -4.25);
    const lBar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 8.8), mats.goldBond);
    lBar.position.set(X_VC - 5.15, 0.62, 0.0);
    const rBar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 8.8), mats.goldBond);
    rBar.position.set(X_VC + 5.15, 0.62, 0.0);
    seamGrp.add(fBar, bBar, lBar, rBar);
  }
  register('vc_mac_laser_hermetic_seam', seamGrp, [-0.6, 2.4, 0.0]);

  // 04. Ultra-Flat Degassing & Working-Fluid Injection Pinch-Off Tail
  const pinchGrp = new THREE.Group();
  {
    const neck = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.28, 0.65), mats.fpVaporCopper);
    neck.position.set(X_VC + 5.85, 0.62, -2.4);
    const crimp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.72), mats.goldBond);
    crimp.position.set(X_VC + 6.58, 0.62, -2.4);
    pinchGrp.add(neck, crimp);
  }
  register('vc_mac_fill_pinch_tube', pinchGrp, [1.2, 2.2, -1.6]);

  // 05. 2 nm Camera SoC / 1-Inch Sensor Thermal Interface Pad (Evaporator Hot-Zone!)
  const hotGrp = new THREE.Group();
  {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 3.2), mats.vcVaporPacket);
    pad.position.set(X_VC - 2.35, -0.34, 0.35);
    hotGrp.add(pad);
  }
  register('vc_mac_soc_hotspot_pad', hotGrp, [-1.4, -2.0, 0.6]);

  // 06. Etched Copper Micro-Support Pillar Matrix (Φ0.35 mm, Anti-Collapse!)
  const pilGrp = new THREE.Group();
  {
    const pGeo = new THREE.CylinderGeometry(0.18, 0.20, 0.92, 14);
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = -2; iz <= 2; iz++) {
        const p = new THREE.Mesh(pGeo, mats.copperPad);
        p.position.set(X_VC + ix * 1.28, 0.96, iz * 1.45);
        pilGrp.add(p);
      }
    }
  }
  register('vc_mac_micro_pillars_array', pilGrp, [-0.6, 1.8, 0.0]);

  // 07. Evaporator Zone High-Capillarity Sintered Copper Powder Wick (30-50 um Cu Spheres!)
  const sintGrp = new THREE.Group();
  {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.34, 4.4), mats.vcSinterCopper);
    bed.position.set(X_VC - 2.35, 0.38, 0.25);
    sintGrp.add(bed);
    // Textured sintered micro-sphere relief bumps on evaporator bed
    const bGeo = new THREE.SphereGeometry(0.16, 10, 8);
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = -3; iz <= 3; iz++) {
        const s = new THREE.Mesh(bGeo, mats.vcSinterCopper);
        s.position.set(X_VC - 2.35 + ix * 0.48, 0.56, 0.25 + iz * 0.56);
        sintGrp.add(s);
      }
    }
    // Gold magnification reticle showing exact 1,000x spot enlarged on the right!
    const ret = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.06, 10, 24), mats.goldBond);
    ret.rotation.x = Math.PI / 2;
    ret.position.set(X_VC - 0.85, 0.68, 0.85);
    sintGrp.add(ret);
  }
  register('vc_mac_sintered_evap_wick', sintGrp, [-1.4, 0.8, 0.4]);

  // 08. Condenser Zone Ultra-Fine #300 Diffusion-Bonded Copper Micro-Mesh Wick
  const meshGrp = new THREE.Group();
  {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.20, 7.6), mats.vcMeshWick);
    mesh.position.set(X_VC + 2.05, 0.30, 0.0);
    meshGrp.add(mesh);
  }
  register('vc_mac_woven_mesh_wick', meshGrp, [0.4, 0.6, 0.0]);

  // 09. Micro-Etched Axial Liquid-Return Capillary Arteries (Low Hydraulic Resistance!)
  const groovGrp = new THREE.Group();
  {
    for (const gz of [-2.6, -1.3, 0.0, 1.3, 2.6]) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 0.26), mats.vcLiquidPacket);
      ch.position.set(X_VC, 0.16, gz);
      groovGrp.add(ch);
    }
  }
  register('vc_mac_artery_return_grooves', groovGrp, [-0.6, -0.1, 0.0]);

  // 10. Open 150 um Vacuum Vapor-Core Distribution Corridors
  const vcoreGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.46, 7.6), mats.vcVaporPlume);
    slab.position.set(X_VC, 1.02, 0.0);
    vcoreGrp.add(slab);
  }
  register('vc_mac_vapor_core_channels', vcoreGrp, [-0.6, 2.8, 0.4]);

  // 11. Cold-Zone Condenser Micro-Groove Heat-Rejection Ribs (right cool zone!)
  const finGrp = new THREE.Group();
  {
    for (let i = 0; i < 7; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 7.2), mats.gaaIspBlock);
      rib.position.set(X_VC + 1.25 + i * 0.58, 0.68, 0.0);
      finGrp.add(rib);
    }
  }
  register('vc_mac_condensation_fins', finGrp, [0.8, 1.4, 0.0]);

  // 12. Bottom 60 um 3D Stepped Oxygen-Free Copper Baseplate
  const botCuGrp = new THREE.Group();
  {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.24, 8.6), mats.fpVaporCopper);
    plate.position.set(X_VC, 0.0, 0.0);
    // 3D stamped downward evaporator pocket reaching directly down to 2nm SoC!
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 3.6), mats.fpVaporCopper);
    step.position.set(X_VC - 2.35, -0.18, 0.35);
    botCuGrp.add(plate, step);
  }
  register('vc_mac_bot_cu_foil', botCuGrp, [-0.8, -1.2, 0.0]);

  // 13. Super-Hydrophilic Black CuO Nanoblade Surface Treatment Liner (θ < 5°)
  const cuoMacGrp = new THREE.Group();
  {
    const coat = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.06, 7.8), mats.lcpBlack);
    coat.position.set(X_VC, 0.18, 0.0);
    cuoMacGrp.add(coat);
  }
  register('vc_mac_hydrophilic_oxide', cuoMacGrp, [-0.6, -0.6, 0.0]);

  // 14. CNC Titanium-Aluminum Structural Midframe Thermal Contact Boss
  const midGrp = new THREE.Group();
  {
    const base = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.44, 9.4), mats.fpTitaniumFrame);
    base.position.set(X_VC, -0.82, 0.0);
    midGrp.add(base);
  }
  register('vc_mac_midframe_anchor', midGrp, [-0.8, -3.2, 0.0]);

  // 15. Dual-Zone 0201 Precision Thermal Telemetry NTC Sensors (T_evap & T_cond)
  const ntcGrp = new THREE.Group();
  {
    for (const [nx, nz] of [[X_VC - 2.35, 3.65], [X_VC + 3.65, 3.65]]) {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.34), mats.gaaSramBank);
      chip.position.set(nx, 0.88, nz);
      const padL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.36), mats.goldBond);
      padL.position.set(nx - 0.28, 0.88, nz);
      const padR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.36), mats.goldBond);
      padR.position.set(nx + 0.28, 0.88, nz);
      ntcGrp.add(chip, padL, padR);
    }
  }
  register('vc_mac_ntc_thermistor', ntcGrp, [-0.2, 2.0, 2.2]);

  // 16. LIVE Infrared Thermal Equilibrium Diffusion Map (Crimson SoC Hotspot -> Cool Blue Edge!)
  const thermGrp = new THREE.Group();
  const thermLiveMat = mats.vcThermalMap.clone();
  {
    const mapSlab = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.07, 7.8), thermLiveMat);
    mapSlab.position.set(X_VC, 1.38, 0.0);
    thermGrp.add(mapSlab);
    thermGrp.userData.vcThermalMat = thermLiveMat;
  }
  register('vc_mac_thermal_gradient_map', thermGrp, [-0.6, 3.6, 0.8]);

  // =========================================================================
  // RIGHT ZONE: 1,000x SINTERED COPPER WICK, MENISCUS & TWO-PHASE LOOP (X_MW = +7.4)
  // =========================================================================
  const X_MW = 7.4;

  // 17. 1,000x Bottom 60 um Oxygen-Free Copper Evaporator Wall
  const mBotGrp = new THREE.Group();
  {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.68, 6.8), mats.fpVaporCopper);
    wall.position.set(X_MW, -2.72, 0.0);
    mBotGrp.add(wall);
  }
  register('vc_mic_bot_cu_wall', mBotGrp, [0.8, -3.2, 0.0]);

  // 18. Conductive Thermal Heat-Flux Glow Band (q'' = 80 W/cm² Entering Base of Sintered Spheres!)
  const fluxGrp = new THREE.Group();
  const fluxLiveMat = mats.vcVaporPacket.clone();
  {
    const band = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 6.4), fluxLiveMat);
    band.position.set(X_MW - 1.95, -2.26, 0.0);
    fluxGrp.add(band);
    fluxGrp.userData.vcHeatPlumeMat = fluxLiveMat;
  }
  register('vc_mic_heat_flux_plume', fluxGrp, [0.2, -2.4, 0.6]);

  // 19. HERO Layer 1: Sintered Copper Micro-Spheres (Φ40 um) with Solid-State Diffusion Sinter Necks!
  const l1SphGrp = new THREE.Group();
  {
    const sGeo = new THREE.SphereGeometry(0.62, 18, 14);
    const neckGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.56, 12);
    const xs = [-3.4, -2.15, -0.9, 0.35];
    const zs = [-1.8, -0.6, 0.6, 1.8];
    for (const ox of xs) {
      for (const oz of zs) {
        const sp = new THREE.Mesh(sGeo, mats.vcSinterCopper);
        sp.position.set(X_MW + ox, -1.62, oz);
        const botNeck = new THREE.Mesh(neckGeo, mats.vcSinterCopper);
        botNeck.position.set(X_MW + ox, -2.18, oz);
        l1SphGrp.add(sp, botNeck);
      }
    }
  }
  register('vc_mic_sintered_cu_layer1', l1SphGrp, [0.0, -1.4, 0.4]);

  // 20. HERO Layer 2: Upper Porous Sintered Copper Micro-Spheres Forming 12 um Capillary Pores!
  const l2SphGrp = new THREE.Group();
  {
    const sGeo = new THREE.SphereGeometry(0.58, 18, 14);
    const xs = [-2.8, -1.55, -0.3];
    const zs = [-1.2, 0.0, 1.2];
    for (const ox of xs) {
      for (const oz of zs) {
        const sp = new THREE.Mesh(sGeo, mats.vcSinterCopper);
        sp.position.set(X_MW + ox, -0.68, oz);
        l2SphGrp.add(sp);
      }
    }
  }
  register('vc_mic_sintered_cu_layer2', l2SphGrp, [0.0, -0.4, 0.8]);

  // 21. Super-Hydrophilic CuO Nanoblade Whiskers (θ ≈ 3°) Growing on Copper Spheres!
  const bladeGrp = new THREE.Group();
  {
    const bGeo = new THREE.ConeGeometry(0.055, 0.34, 6);
    const xs = [-2.8, -1.55, -0.3];
    const zs = [-1.2, 0.0, 1.2];
    for (const ox of xs) {
      for (const oz of zs) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          const nb = new THREE.Mesh(bGeo, mats.lcpBlack);
          nb.position.set(X_MW + ox + Math.cos(a) * 0.42, -0.22, oz + Math.sin(a) * 0.42);
          nb.rotation.z = -Math.cos(a) * 0.55;
          nb.rotation.x = Math.sin(a) * 0.55;
          bladeGrp.add(nb);
        }
      }
    }
  }
  register('vc_mic_cuo_nanoblades', bladeGrp, [0.0, 0.4, 1.4]);

  // 22. Degassed Ultra-Pure Deionized Water (H2O, 18.2 MΩ·cm) Saturated Inside Wick Pores!
  const poolGrp = new THREE.Group();
  {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1.48, 6.2), mats.vcWaterPool);
    pool.position.set(X_MW, -1.56, 0.0);
    poolGrp.add(pool);
  }
  register('vc_mic_liquid_water_pool', poolGrp, [0.8, -0.8, 1.6]);

  // 23. HERO: Concave Thin-Film Capillary Menisci (Young-Laplace Pumping Engine ΔP = 2σ cosθ / r_eff!)
  const menGrp = new THREE.Group();
  {
    // True inverted concave liquid bowl surfaces suspended between upper copper spheres!
    const bowlGeo = new THREE.SphereGeometry(0.62, 20, 12, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42);
    for (const ox of [-2.18, -0.92]) {
      for (const oz of [-0.6, 0.6]) {
        const men = new THREE.Mesh(bowlGeo, mats.vcMeniscusCyan);
        men.position.set(X_MW + ox, -0.24, oz);
        men.scale.set(1.05, 0.65, 1.05);
        menGrp.add(men);
      }
    }
  }
  register('vc_mic_thinfilm_meniscus', menGrp, [0.0, 0.9, 1.8]);

  // 24. Phase-Change Latent Heat Evaporation Plume Interface (h_fg = 2,257 kJ/kg!)
  const plumeGrp = new THREE.Group();
  {
    const pGeo = new THREE.CylinderGeometry(0.55, 0.30, 1.55, 16, 1, true);
    for (const ox of [-2.18, -0.92]) {
      const pl = new THREE.Mesh(pGeo, mats.vcVaporPlume);
      pl.position.set(X_MW + ox, 0.72, 0.0);
      plumeGrp.add(pl);
    }
  }
  register('vc_mic_evap_vapor_plumes', plumeGrp, [0.0, 1.8, 0.8]);

  // 25. 1,000x Etched Solid Copper Support Pillar Column with Liquid-Return Bridge Channels!
  const mPilGrp = new THREE.Group();
  {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.76, 5.2, 24), mats.fpVaporCopper);
    col.position.set(X_MW + 3.15, 0.22, -0.45);
    // Vertical hydrophilic capillary grooves wrapping the support pillar
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.10, 4.9, 0.14), mats.vcMeniscusCyan);
      g.position.set(X_MW + 3.15 + Math.cos(a) * 0.70, 0.22, -0.45 + Math.sin(a) * 0.70);
      g.rotation.y = -a;
      mPilGrp.add(g);
    }
    mPilGrp.add(col);
  }
  register('vc_mic_support_pillar_cut', mPilGrp, [2.2, 0.6, -0.6]);

  // 26. Open 150 um Vacuum Vapor Core (P_sat ≈ 12 kPa @ 50°C — Water Boils at Body Temp!)
  const coreGrp = new THREE.Group();
  {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.8, 5.6), mats.oledMlaGlass);
    frame.position.set(X_MW, 1.25, -0.15);
    coreGrp.add(frame);
  }
  register('vc_mic_vapor_core_space', coreGrp, [0.8, 1.6, -1.6]);

  // 27. 1,000x Top 50 um Oxygen-Free Copper Condenser Ceiling Wall (front cutaway!)
  const mTopGrp = new THREE.Group();
  {
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.56, 6.4), mats.fpVaporCopper);
    ceil.position.set(X_MW, 3.08, -0.2);
    mTopGrp.add(ceil);
  }
  register('vc_mic_top_cu_ceiling', mTopGrp, [0.8, 4.2, 0.0]);

  // 28. Biphilic Hydrophobic Dropwise-Condensation Micro-Stripes on Ceiling (5x Faster Shedding!)
  const biphGrp = new THREE.Group();
  {
    for (const sx of [-2.8, -1.2, 0.4, 2.0, 3.4]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 5.8), mats.vcHydrophobicCoat);
      stripe.position.set(X_MW + sx, 2.74, -0.2);
      biphGrp.add(stripe);
    }
  }
  register('vc_mic_hydrophobic_cond_coat', biphGrp, [0.8, 3.4, 0.0]);

  // 29. HERO: Nucleating & Coalescing Sapphire Condensate Water Droplets on Ceiling & Pillar!
  const dropGrp = new THREE.Group();
  const vcCondDroplets = [];
  {
    const dGeo = new THREE.SphereGeometry(0.32, 16, 12);
    const coords = [
      [X_MW + 0.6, 2.52, 0.8],
      [X_MW + 1.5, 2.48, -0.6],
      [X_MW + 2.2, 2.46, 1.1],
      [X_MW + 2.9, 2.48, 0.4],
      [X_MW + 3.6, 2.50, -1.1],
      [X_MW + 1.8, 2.52, 0.1]
    ];
    coords.forEach(([dx, dy, dz], idx) => {
      const dr = new THREE.Mesh(dGeo, mats.vcMeniscusCyan);
      const r0 = 0.72 + (idx % 3) * 0.22;
      dr.position.set(dx, dy, dz);
      dr.scale.set(r0, r0 * 0.78, r0);
      dr.userData = { baseScale: r0, phase: idx * 0.48 };
      dropGrp.add(dr);
      vcCondDroplets.push(dr);
    });
    dropGrp.userData.vcCondDroplets = vcCondDroplets;
  }
  register('vc_mic_condensate_droplets', dropGrp, [1.4, 2.8, 0.8]);

  // 30. 1,000x Interwoven #300 Micro-Copper Mesh Return Wires (Right Condenser Side -> Left Sintered Wick!)
  const wvGrp = new THREE.Group();
  {
    const wireGeoX = new THREE.CylinderGeometry(0.085, 0.085, 3.6, 10);
    wireGeoX.rotateZ(Math.PI / 2);
    const wireGeoZ = new THREE.CylinderGeometry(0.085, 0.085, 5.2, 10);
    wireGeoZ.rotateX(Math.PI / 2);
    for (let iz = -2; iz <= 2; iz++) {
      const wx = new THREE.Mesh(wireGeoX, mats.goldBond);
      wx.position.set(X_MW + 2.35, -1.55 + (iz % 2 === 0 ? 0.08 : -0.08), iz * 1.05);
      wvGrp.add(wx);
    }
    for (let ix = 0; ix < 4; ix++) {
      const wz = new THREE.Mesh(wireGeoZ, mats.vcSinterCopper);
      wz.position.set(X_MW + 1.05 + ix * 0.92, -1.55 + (ix % 2 === 0 ? -0.08 : 0.08), 0.0);
      wvGrp.add(wz);
    }
  }
  register('vc_mic_mesh_return_weave', wvGrp, [1.8, -1.0, 0.6]);

  // 31. LIVE TWO-PHASE CLOSED-LOOP THERMODYNAMIC FLOW ENGINE (12 Hot Vapor + 12 Cool Liquid Packets!)
  const flowGrp = new THREE.Group();
  const vcVaporPackets = [];
  const vcLiquidPackets = [];
  {
    const vGeo = new THREE.SphereGeometry(0.19, 14, 10);
    const lGeo = new THREE.SphereGeometry(0.17, 14, 10);
    for (let i = 0; i < 12; i++) {
      const p = i / 12;
      const laneZ = (i % 3 - 1) * 1.15;
      // Hot Vapor Packet: climbs from left meniscus (-2.2, -0.1) -> races right across vapor core (+2.8, +2.2)
      const vp = new THREE.Mesh(vGeo, mats.vcVaporPacket);
      vp.position.set(X_MW - 2.2 + p * 5.0, 0.1 + Math.sin(p * Math.PI) * 1.9 + p * 1.4, laneZ);
      vp.userData = { basePhase: p, laneZ, xLeft: X_MW - 2.3, xRight: X_MW + 2.9 };
      flowGrp.add(vp);
      vcVaporPackets.push(vp);

      // Cool Condensed Liquid Packet: drops along right pillar (+3.0, +2.1 -> -1.5) -> pumps LEFT through wick -> left evaporator!
      const lp = new THREE.Mesh(lGeo, mats.vcLiquidPacket);
      lp.position.set(X_MW + 2.9 - p * 5.2, -1.55, laneZ);
      lp.userData = { basePhase: p, laneZ, xLeft: X_MW - 2.3, xRight: X_MW + 3.0 };
      flowGrp.add(lp);
      vcLiquidPackets.push(lp);
    }
    flowGrp.userData.vcVaporPackets = vcVaporPackets;
    flowGrp.userData.vcLiquidPackets = vcLiquidPackets;
  }
  register('vc_mic_live_vapor_packets', flowGrp, [1.0, 1.0, 2.8]);

  // 32. Young-Laplace Capillary Pressure Gradient Arc (ΔP_cap = 2σ cosθ / r_eff > ΔP_l + ΔP_v!)
  const lapGrp = new THREE.Group();
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(X_MW + 3.4, -1.9, 3.25),
      new THREE.Vector3(X_MW + 0.5, -1.6, 3.35),
      new THREE.Vector3(X_MW - 2.4, -0.35, 3.25)
    ]);
    const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.09, 10, false), mats.vcMeniscusCyan);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 12), mats.vcMeniscusCyan);
    tip.position.set(X_MW - 2.48, -0.28, 3.25);
    tip.rotation.z = 0.85;
    lapGrp.add(arc, tip);
  }
  register('vc_mic_laplace_pressure_arc', lapGrp, [0.8, -0.4, 2.8]);

  // 33. Ultra-High Vacuum (10^-4 Pa NCG-Free) & 45°C Saturation Boiling Reference Collar
  const vacGrp = new THREE.Group();
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 12, 36), mats.gaaNpuSystolic);
    ring.position.set(X_MW, 1.35, 2.95);
    vacGrp.add(ring);
  }
  register('vc_mic_vacuum_gauge_ring', vacGrp, [0.8, 1.6, 3.2]);

  // 34. White Ceramic Two-Phase Microfluidics Metrology Plinth (600-PART GRAND MILESTONE!)
  const plinthGrp = new THREE.Group();
  {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.42, 7.8), mats.zmAluminaCeramic);
    slab.position.set(X_MW, -3.55, 0.0);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(10.12, 0.08, 7.92), mats.goldBond);
    rim.position.set(X_MW, -3.32, 0.0);
    for (let i = -4; i <= 4; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.36), mats.goldBond);
      tick.position.set(X_MW + i * 1.08, -3.26, 3.72);
      plinthGrp.add(tick);
    }
    plinthGrp.add(slab, rim);
  }
  register('vc_mic_metrology_plinth', plinthGrp, [0.8, -4.4, 0.0]);

  return {
    root,
    parts,
    gridY: -3.9,
    defaultCameraPos: new THREE.Vector3(17.4, 14.8, 32.6),
    defaultTarget: new THREE.Vector3(4.8, 0.25, 0.0),
    clipBounds: { x: 13.5, y: 6.2, z: 6.2 }
  };
}
