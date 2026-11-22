import * as THREE from 'three';

/**
 * Helper: Builds a straight cylindrical rod between two 3D points pA and pB.
 */
function buildRod(pA, pB, radius, mat) {
  const dir = pB.clone().sub(pA);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 12), mat);
  mesh.position.copy(pA).add(pB).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/**
 * Phase 15 (16-Scale / 464-Part Milestone!):
 * Full-Frame Global Shutter Stacked BSI CMOS (Sony Alpha 9 III / Pregius S Class — 1/80,000 s All-Pixel Simultaneous Exposure!)
 * + Ultra-High-Speed 1/8,000 s Dual-Curtain Carbon-Fiber Mechanical Focal-Plane Shutter (1.8 ms Curtain Travel & Traveling Slit!)
 * + 10,000x Magnified Global Shutter Stacked Pixel Cross-Section (PD -> GS-TX -> Tungsten-Shielded Memory Node MN -> Cu-Cu Pillar -> CDS/AMP!)
 * 32 Independent Dissectable 3D CAD Parts!
 */
export function buildGlobalShutterAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'GlobalShutterRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // Left/Center Hero: Upright Full-Frame Camera Shutter + Stacked Global Shutter CMOS (facing +Z!)
  const X_L = -3.0;
  const Y_L = 0.55;
  // Exact 3:2 Full-Frame Aperture Opening (7.2 x 4.8 -> 36 x 24 mm proportional!)
  const AP_W = 7.2;
  const AP_H = 4.8;

  // Right-Hand Hero: 10,000x Magnified Global Shutter Stacked BSI Pixel Cross-Section
  const X_M = 9.0;

  // =========================================================================
  // GROUP 1: ULTRA-HIGH-SPEED 1/8,000s CARBON-FIBER MECHANICAL SHUTTER (01-10)
  // =========================================================================

  // 01. High-Rigidity Die-Cast Focal-Plane Shutter Baseplate (36x24 mm Window + Right Drive Bay)
  const chassisGrp = new THREE.Group();
  {
    const outer = new THREE.Shape();
    outer.moveTo(-5.0, -3.55);
    outer.lineTo(6.55, -3.55);
    outer.lineTo(6.55, 3.55);
    outer.lineTo(-5.0, 3.55);
    outer.closePath();

    const win = new THREE.Path();
    win.moveTo(-AP_W * 0.5, -AP_H * 0.5);
    win.lineTo(AP_W * 0.5, -AP_H * 0.5);
    win.lineTo(AP_W * 0.5, AP_H * 0.5);
    win.lineTo(-AP_W * 0.5, AP_H * 0.5);
    win.closePath();
    outer.holes.push(win);

    // Right-side drive-bay cutaway inspection window exposing coreless motors, 4-bar titanium parallelogram links & crimson brakes!
    const bayWin = new THREE.Path();
    bayWin.moveTo(4.02, -3.12);
    bayWin.lineTo(6.18, -3.12);
    bayWin.lineTo(6.18, 3.12);
    bayWin.lineTo(4.02, 3.12);
    bayWin.closePath();
    outer.holes.push(bayWin);

    const cGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 });
    cGeo.translate(0, 0, -0.12);
    const frame = new THREE.Mesh(cGeo, mats.lcpBlack);
    frame.position.set(X_L, Y_L, 2.55);
    chassisGrp.add(frame);
  }
  register('gs_shutter_chassis_plate', chassisGrp, [-0.5, 0.8, 5.2]);

  // 02. LIVE MOVING Front Curtain (4 Interlocking 50 um Carbon-Fiber Epoxy Slats — Lower half of slit!)
  const frontCurtainGrp = new THREE.Group();
  const frontSlats = [];
  {
    for (let i = 0; i < 4; i++) {
      // 4 overlapping carbon slats stacked along lower aperture at rest (top edge of front curtain = Y_L - 0.72!)
      const slat = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.5, 0.92, 0.055), mats.gsCarbonFront);
      const restY = Y_L - 1.18 - i * 0.42;
      slat.position.set(X_L, restY, 2.18 + i * 0.045);
      slat.userData.slatIdx = i;
      slat.userData.restY = restY;
      frontCurtainGrp.add(slat);
      frontSlats.push(slat);
    }
    // Crisp cyan-silver leading optical edge bar on top Front Curtain blade so the slit edge reads unmistakably!
    const leadEdge = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.5, 0.08, 0.075), mats.zmGuideShaft);
    leadEdge.position.set(0, 0.46, 0.01);
    frontSlats[0].add(leadEdge);

    frontCurtainGrp.userData.gsFrontSlats = frontSlats;
  }
  register('gs_front_curtain_blades', frontCurtainGrp, [-0.4, -1.8, 4.2]);

  // 03. LIVE MOVING Rear Curtain (4 Interlocking Carbon/Duralumin Slats — Chases Front Curtain forming 1/8,000s Slit!)
  const rearCurtainGrp = new THREE.Group();
  const rearSlats = [];
  {
    for (let i = 0; i < 4; i++) {
      // 4 overlapping carbon slats covering upper aperture at rest (bottom edge = Y_L + 0.72 -> crisp 1.44-unit open exposure slit!)
      const slat = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.5, 0.92, 0.055), mats.gsCarbonRear);
      const restY = Y_L + 1.18 + i * 0.42;
      slat.position.set(X_L, restY, 1.66 - i * 0.045);
      slat.userData.slatIdx = i;
      slat.userData.restY = restY;
      rearCurtainGrp.add(slat);
      rearSlats.push(slat);
    }
    // Crisp amber-gold trailing slit edge bar on lowest Rear Curtain blade!
    const trailEdge = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.5, 0.08, 0.075), mats.goldBond);
    trailEdge.position.set(0, -0.46, 0.01);
    rearSlats[0].add(trailEdge);

    rearCurtainGrp.userData.gsRearSlats = rearSlats;
  }
  register('gs_rear_curtain_blades', rearCurtainGrp, [-0.4, 2.2, 3.4]);

  // 04. Ultra-Thin 80 um Stainless Inter-Curtain Divider Plate (Prevents 13.3 m/s Front/Rear Blade Collision!)
  const divGrp = new THREE.Group();
  {
    const outer = new THREE.Shape();
    outer.moveTo(-4.15, -3.15);
    outer.lineTo(4.25, -3.15);
    outer.lineTo(4.25, 3.15);
    outer.lineTo(-4.15, 3.15);
    outer.closePath();

    const win = new THREE.Path();
    win.moveTo(-AP_W * 0.5 - 0.06, -AP_H * 0.5 - 0.06);
    win.lineTo(AP_W * 0.5 + 0.06, -AP_H * 0.5 - 0.06);
    win.lineTo(AP_W * 0.5 + 0.06, AP_H * 0.5 + 0.06);
    win.lineTo(-AP_W * 0.5 - 0.06, AP_H * 0.5 + 0.06);
    win.closePath();
    outer.holes.push(win);

    const dGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.06, bevelEnabled: false });
    dGeo.translate(0, 0, -0.03);
    const mesh = new THREE.Mesh(dGeo, mats.susSteel);
    mesh.position.set(X_L, Y_L, 1.94);
    divGrp.add(mesh);
  }
  register('gs_curtain_divider_plate', divGrp, [-0.4, 0.4, 3.8]);

  // 05. LIVE ARTICULATED Dual 4-Bar Parallelogram Titanium Drive Link Arms + Micro Rivet Pivots
  const linksGrp = new THREE.Group();
  const frontLinkPivot = new THREE.Group();
  const rearLinkPivot = new THREE.Group();
  {
    // Pivot shafts on right-side drive bay (X_L + 4.75 = +1.75)
    frontLinkPivot.position.set(X_L + 4.75, Y_L - 1.35, 2.34);
    for (const dy of [-0.32, 0.32]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 0.08), mats.gsTitaniumLink);
      arm.position.set(-0.78, dy, 0);
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 14), mats.goldBond);
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(-1.52, dy, 0.02);
      frontLinkPivot.add(arm, rivet);
    }

    rearLinkPivot.position.set(X_L + 4.75, Y_L + 1.35, 1.82);
    for (const dy of [-0.32, 0.32]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 0.08), mats.gsTitaniumLink);
      arm.position.set(-0.78, dy, 0);
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 14), mats.goldBond);
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(-1.52, dy, 0.02);
      rearLinkPivot.add(arm, rivet);
    }

    linksGrp.add(frontLinkPivot, rearLinkPivot);
    linksGrp.userData.gsFrontLink = frontLinkPivot;
    linksGrp.userData.gsRearLink = rearLinkPivot;
  }
  register('gs_parallelogram_link_arms', linksGrp, [1.8, 0.4, 4.6]);

  // 06. Twin Coreless Electromagnetic Rotary Curtain Actuators (Independent Front & Rear Release Coils!)
  const motorsGrp = new THREE.Group();
  {
    for (const dy of [-1.45, 1.45]) {
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.92, 28), mats.copperCoil);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(X_L + 5.55, Y_L + dy, 2.05);
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.34, 28), mats.yokePermalloy);
      yoke.rotation.x = Math.PI / 2;
      yoke.position.set(X_L + 5.55, Y_L + dy, 1.62);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.35, 16), mats.susSteel);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(X_L + 5.55, Y_L + dy, 2.15);
      motorsGrp.add(coil, yoke, shaft);
    }
  }
  register('gs_coreless_drive_motors', motorsGrp, [2.8, 0.5, 4.4]);

  // 07. Twin High-Tension Piano-Wire Curtain Acceleration Torsion Springs + Cocking Cam Gear
  const springGrp = new THREE.Group();
  {
    for (const dy of [-1.35, 1.35]) {
      // Multi-turn torsion coil wrapped around pivot shaft
      for (let t = 0; t < 3; t++) {
        const turn = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 10, 28), mats.beCuSpring);
        turn.position.set(X_L + 4.75, Y_L + dy, 2.58 + t * 0.11);
        springGrp.add(turn);
      }
    }
    // Central brass cocking cam gear between both drive shafts
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.24, 24), mats.goldBond);
    gear.rotation.x = Math.PI / 2;
    gear.position.set(X_L + 5.10, Y_L, 2.66);
    springGrp.add(gear);
  }
  register('gs_main_torsion_springs', springGrp, [2.4, 0.8, 5.4]);

  // 08. Anti-Bounce Elastomer & Magnetic Eddy-Current End-Stop Brake Dampers
  const brakeGrp = new THREE.Group();
  {
    for (const sy of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.62), mats.gsElastomerBrake);
      pad.position.set(X_L + 4.25, Y_L + sy * 2.85, 2.08);
      const eddyMag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.48), mats.magnetNickel);
      eddyMag.position.set(X_L + 5.35, Y_L + sy * 2.85, 2.08);
      brakeGrp.add(pad, eddyMag);
    }
  }
  register('gs_rebound_brake_dampers', brakeGrp, [1.8, 2.2, 4.8]);

  // 09. LIVE ANTI-PHASE Counter-Moving Mass Balancer Arm (Left side of shutter — cancels micro-shake!)
  const balGrp = new THREE.Group();
  {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.6, 14), mats.susSteel);
    rail.position.set(X_L - 4.45, Y_L, 2.15);
    const weight = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.55, 0.42), mats.copperPad);
    weight.position.set(X_L - 4.45, Y_L, 2.18);
    balGrp.add(rail, weight);
    balGrp.userData.gsBalancerWeight = weight;
    balGrp.userData.gsBalancerBaseY = Y_L;
  }
  register('gs_counter_balancer', balGrp, [-2.8, 0.4, 4.4]);

  // 10. Twin Optical Photo-Interrupter Self-Diagnostic Curtain-Velocity Sensors
  const photoGrp = new THREE.Group();
  {
    for (const sy of [-1.45, 1.45]) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.56), mats.icPackageDark);
      body.position.set(X_L - 3.92, Y_L + sy, 2.24);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.22), mats.tpGoosGauge);
      led.position.set(X_L - 3.68, Y_L + sy, 2.24);
      photoGrp.add(body, led);
    }
  }
  register('gs_curtain_photo_interrupters', photoGrp, [-2.2, -0.6, 5.0]);

  // =========================================================================
  // GROUP 2: FULL-FRAME STACKED BSI GLOBAL SHUTTER CMOS MODULE (11-22)
  // =========================================================================

  // 11. Piezo-Vibrated Supersonic Dust-Shaking Blue-Glass IRCF / Optical Filter Window
  const lpfGrp = new THREE.Group();
  {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.55, AP_H + 0.45, 0.16), mats.blueGlassIrcf);
    glass.position.set(X_L, Y_L, 0.92);
    const coat = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.45, AP_H + 0.35, 0.04), mats.ircfCoating);
    coat.position.set(X_L, Y_L, 1.02);
    // Side 70 kHz Ultrasonic Dust-Shaking Piezo Ceramic Strip!
    const piezo = new THREE.Mesh(new THREE.BoxGeometry(0.42, AP_H + 0.25, 0.24), mats.zmPztCeramic);
    piezo.position.set(X_L - AP_W * 0.5 - 0.50, Y_L, 0.92);
    lpfGrp.add(glass, coat, piezo);
  }
  register('gs_dust_ultrasonic_lpf', lpfGrp, [-0.2, 0.6, 2.4]);

  // 12. Hermetic Full-Frame Alumina Ceramic Sensor Cavity Package & Kovar Seal Ring
  const pkgGrp = new THREE.Group();
  {
    const outer = new THREE.Shape();
    outer.moveTo(-4.75, -3.45);
    outer.lineTo(4.75, -3.45);
    outer.lineTo(4.75, 3.45);
    outer.lineTo(-4.75, 3.45);
    outer.closePath();

    const cav = new THREE.Path();
    cav.moveTo(-3.82, -2.58);
    cav.lineTo(3.82, -2.58);
    cav.lineTo(3.82, 2.58);
    cav.lineTo(-3.82, 2.58);
    cav.closePath();
    outer.holes.push(cav);

    const pGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.72, bevelEnabled: false });
    pGeo.translate(0, 0, -0.36);
    const body = new THREE.Mesh(pGeo, mats.llCeramicChamber);
    body.position.set(X_L, Y_L, 0.22);
    pkgGrp.add(body);
  }
  register('gs_ceramic_cavity_pkg', pkgGrp, [-0.2, 0.0, 1.2]);

  // 13. Top Wafer: 24.6 MP Full-Frame Back-Illuminated Photodiode Array (1/80,000 s Simultaneous Exposure!)
  const pdWaferGrp = new THREE.Group();
  {
    const si = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.2, AP_H + 0.15, 0.18), mats.siliconBulkSide);
    si.position.set(X_L, Y_L, 0.34);
    const surf = new THREE.Mesh(new THREE.BoxGeometry(AP_W, AP_H, 0.05), mats.sensorOpticalSurface);
    surf.position.set(X_L, Y_L, 0.45);
    pdWaferGrp.add(si, surf);
  }
  register('gs_top_bsi_pd_wafer', pdWaferGrp, [0.0, 0.3, 0.8]);

  // 14. Per-Pixel 1-to-1 Direct Cu-Cu Hybrid Bonding Layer (~25 Million Micro-Copper Interconnects!)
  const cucuGrp = new THREE.Group();
  {
    const layer = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.15, AP_H + 0.10, 0.14), mats.cucuHybridLayer);
    layer.position.set(X_L, Y_L, -0.02);
    cucuGrp.add(layer);
  }
  register('gs_cucu_per_pixel_bond', cucuGrp, [0.0, 0.1, 0.0]);

  // 15. Bottom Stacked Wafer: Per-Pixel Analog Voltage-Domain Memory & Column-Parallel 14-bit ADC (120 fps!)
  const memWaferGrp = new THREE.Group();
  {
    const wafer = new THREE.Mesh(new THREE.BoxGeometry(AP_W + 0.22, AP_H + 0.18, 0.22), mats.logicDie);
    wafer.position.set(X_L, Y_L, -0.40);
    memWaferGrp.add(wafer);
  }
  register('gs_mid_memory_adc_wafer', memWaferGrp, [0.0, -0.2, -0.8]);

  // 16. On-Package Ultra-Wide-Bus Stacked DRAM Burst Frame Buffer (120 fps Blackout-Free RAW!)
  const dramGrp = new THREE.Group();
  {
    const die = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.6, 0.20), mats.dramDie);
    die.position.set(X_L, Y_L, -0.78);
    dramGrp.add(die);
  }
  register('gs_dram_frame_buffer', dramGrp, [0.0, -0.4, -1.6]);

  // 17. 48× Dual-Row Perimeter Φ25 um Thermosonic Gold Wire-Bond Loops
  const wireGrp = new THREE.Group();
  {
    for (let i = 0; i < 24; i++) {
      const wx = X_L - 3.45 + i * 0.30;
      for (const sy of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.54, 6), mats.goldBond);
        w.position.set(wx, Y_L + sy * 2.66, 0.42);
        w.rotation.x = sy * 0.42;
        wireGrp.add(w);
      }
    }
  }
  register('gs_gold_wire_bonds', wireGrp, [0.0, 0.5, 1.5]);

  // 18. 5-Axis In-Body Sensor-Shift IBIS Floating Stage (8.0-Stop Stabilization) & 4x ZrO2 Ceramic Balls
  const ibisStageGrp = new THREE.Group();
  {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(10.6, 7.2, 0.26), mats.oisCarrierPcb);
    plate.position.set(X_L + 0.25, Y_L, -1.24);
    ibisStageGrp.add(plate);

    for (const sx of [-4.4, 4.8]) {
      for (const sy of [-2.9, 2.9]) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), mats.ceramicZirconia);
        ball.position.set(X_L + sx, Y_L + sy, -1.52);
        ibisStageGrp.add(ball);
      }
    }
  }
  register('gs_5axis_ibis_stage', ibisStageGrp, [0.0, -0.6, -2.4]);

  // 19. 3-Axis Planar IBIS Voice Coils & High-Flux N52 NdFeB Magnet Stators
  const ibisVcmGrp = new THREE.Group();
  {
    // Left Y1 coil/magnet, Right Y2 coil/magnet (differential Roll!), Bottom X coil/magnet
    const sites = [
      [X_L - 4.25, Y_L, 1.15, 2.85],
      [X_L + 4.75, Y_L, 1.15, 2.85],
      [X_L + 0.25, Y_L - 2.85, 3.25, 1.15]
    ];
    for (const [cx, cy, cw, ch] of sites) {
      const coil = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, 0.16), mats.copperCoil);
      coil.position.set(cx, cy, -1.62);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(cw * 0.92, ch * 0.92, 0.24), mats.magnetNickel);
      mag.position.set(cx, cy, -1.88);
      ibisVcmGrp.add(coil, mag);
    }
  }
  register('gs_ibis_vcm_coils_mags', ibisVcmGrp, [0.2, -1.0, -3.2]);

  // 20. Oxygen-Free Pure-Copper Sensor Thermal Spreader & Graphite Cooling Fin
  const heatGrp = new THREE.Group();
  {
    const cu = new THREE.Mesh(new THREE.BoxGeometry(8.8, 5.8, 0.20), mats.copperPad);
    cu.position.set(X_L, Y_L, -2.14);
    const graph = new THREE.Mesh(new THREE.BoxGeometry(8.2, 5.2, 0.06), mats.susDarkInner);
    graph.position.set(X_L, Y_L, -2.28);
    heatGrp.add(cu, graph);
  }
  register('gs_copper_vapor_spreader', heatGrp, [0.0, -0.4, -4.0]);

  // 21. Sub-Microsecond Global-Pulse Clock Generator & Mechanical-Shutter Sync Controller ASIC
  const fpgaGrp = new THREE.Group();
  {
    const die = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.85, 0.28), mats.icPackageDark);
    die.position.set(X_L + 4.85, Y_L - 2.45, -2.40);
    const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 14), mats.goldBond);
    pin1.rotation.x = Math.PI / 2;
    pin1.position.set(X_L + 4.10, Y_L - 1.80, -2.24);
    fpgaGrp.add(die, pin1);
  }
  register('gs_timing_fpga_driver', fpgaGrp, [1.4, -2.4, -4.8]);

  // 22. 10-Layer Rigid Sensor PCB + Dual High-Speed SLVS-EC Polyimide Flex Ribbons & Gold BTB Connectors
  const pcbGrp = new THREE.Group();
  {
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(12.2, 8.2, 0.26), mats.rigidPcb);
    pcb.position.set(X_L + 0.55, Y_L, -2.62);
    pcbGrp.add(pcb);

    // Dual bottom SLVS-EC high-speed polyimide flex tails + gold BTB plugs
    for (const dx of [-2.4, 2.4]) {
      const fpc = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 2.35), mats.fpcPolyimide);
      fpc.position.set(X_L + dx, Y_L - 4.02, -1.55);
      const btb = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.24, 0.64), mats.lcpBlack);
      btb.position.set(X_L + dx, Y_L - 4.10, -0.45);
      pcbGrp.add(fpc, btb);
    }
  }
  register('gs_main_sensor_pcb_fpc', pcbGrp, [0.0, -1.4, -5.4]);

  // =========================================================================
  // GROUP 3: 10,000x GLOBAL SHUTTER STACKED BSI PIXEL CROSS-SECTION (23-32)
  // =========================================================================

  // 23. 10,000x High-Fill-Factor 2x2 On-Chip Microlenses (OCL) & RGGB Color Filter Slab
  const oclGrp = new THREE.Group();
  {
    const cfaColors = [mats.cfaRed, mats.cfaGreen, mats.cfaGreen, mats.cfaBlue];
    let idx = 0;
    for (const sx of [-1.05, 1.05]) {
      for (const sz of [-1.05, 1.05]) {
        const cfa = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.34, 2.02), cfaColors[idx++]);
        cfa.position.set(X_M + sx, 2.75, sz);
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.96, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
          mats.microLensPolymer
        );
        dome.scale.set(1, 0.68, 1);
        dome.position.set(X_M + sx, 2.92, sz);
        oclGrp.add(cfa, dome);
      }
    }
  }
  register('gs_px_ocl_cfa', oclGrp, [3.2, 4.0, 0.2]);

  // 24. 10,000x Reflective Tungsten (W) Surface Grid & Full-Depth DTI Oxide Pixel Isolation Walls
  const dtiGrp = new THREE.Group();
  {
    // Cross-shaped Tungsten surface light-shield grid + deep oxide DTI walls dividing 2x2 pixels
    const gridX = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.42, 0.16), mats.tungstenGrid);
    gridX.position.set(X_M, 2.75, 0);
    const gridZ = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 4.35), mats.tungstenGrid);
    gridZ.position.set(X_M, 2.75, 0);

    const dtiX = new THREE.Mesh(new THREE.BoxGeometry(4.35, 1.52, 0.12), mats.fullDtiOxide);
    dtiX.position.set(X_M, 1.82, 0);
    const dtiZ = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.52, 4.35), mats.fullDtiOxide);
    dtiZ.position.set(X_M, 1.82, 0);
    dtiGrp.add(gridX, gridZ, dtiX, dtiZ);
  }
  register('gs_px_full_dti_grid', dtiGrp, [3.8, 2.8, -0.6]);

  // 25. 10,000x Deep-Depletion BSI Silicon Photodiode (PD, 100% Fill Factor!) + Global Reset Drain (OFG)
  const pdPxGrp = new THREE.Group();
  {
    for (const sx of [-1.05, 1.05]) {
      for (const sz of [-1.05, 1.05]) {
        const pd = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.38, 1.88), mats.microPdSilicon);
        pd.position.set(X_M + sx, 1.82, sz);
        pdPxGrp.add(pd);
      }
    }
    // Global Overflow Reset Drain (OFG) gold rail along right-rear rim
    const ofg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 4.25), mats.goldBond);
    ofg.position.set(X_M + 2.28, 1.55, 0);
    pdPxGrp.add(ofg);
  }
  register('gs_px_bsi_photodiode', pdPxGrp, [3.0, 1.8, 0.4]);

  // 26. 10,000x Ultra-Opaque Wrap-Around Tungsten (W) Optical Light-Shield Cavity (PLS < -100 dB, Front-Cutaway!)
  const wShieldGrp = new THREE.Group();
  {
    // Top roof shield under PD (with central transfer slot for GS-TX!), rear wall, left & right walls -> front open so MN shines clearly!
    const topL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 4.35), mats.gsTungstenShield);
    topL.position.set(X_M - 1.32, 0.96, 0);
    const topR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 4.35), mats.gsTungstenShield);
    topR.position.set(X_M + 1.32, 0.96, 0);
    const backW = new THREE.Mesh(new THREE.BoxGeometry(4.40, 1.18, 0.22), mats.gsTungstenShield);
    backW.position.set(X_M, 0.40, -2.08);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.18, 4.35), mats.gsTungstenShield);
    sideL.position.set(X_M - 2.12, 0.40, 0);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.18, 4.35), mats.gsTungstenShield);
    sideR.position.set(X_M + 2.12, 0.40, 0);
    wShieldGrp.add(topL, topR, backW, sideL, sideR);
  }
  register('gs_px_tungsten_light_shield', wShieldGrp, [4.6, 0.8, -0.8]);

  // 27. 10,000x Simultaneous Global Transfer Gate (GS-TX — Snaps All 24.6M Pixels Simultaneously!)
  const txGrp = new THREE.Group();
  {
    const gateBar = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.34, 4.15), mats.gsGlobalTxGate);
    gateBar.position.set(X_M, 0.96, 0);
    // Vertical transfer fingers dipping down into storage memory node
    for (const sz of [-1.05, 1.05]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.85), mats.gsGlobalTxGate);
      fin.position.set(X_M, 0.78, sz);
      txGrp.add(fin);
    }
    txGrp.add(gateBar);
  }
  register('gs_px_global_tx_gate', txGrp, [3.4, 1.1, 1.6]);

  // 28. 10,000x In-Pixel Shielded Storage Memory Node (MN) & High-Density Deep-Trench MIM Capacitor (C_S)
  const mnGrp = new THREE.Group();
  {
    for (const sx of [-0.95, 0.95]) {
      for (const sz of [-0.95, 0.95]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.72, 1.42), mats.gsMemoryNode);
        cap.position.set(X_M + sx, 0.32, sz);
        mnGrp.add(cap);
      }
    }
  }
  register('gs_px_storage_memory_node', mnGrp, [3.6, 0.2, 1.4]);

  // 29. 10,000x Direct Per-Pixel Cu-Cu Hybrid Bond Micro-Pillar & SiCN Wafer-Bond Interface
  const pxCucuGrp = new THREE.Group();
  {
    const sicn = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.24, 4.45), mats.sicnDielectric);
    sicn.position.set(X_M, -0.58, 0);
    pxCucuGrp.add(sicn);

    // 4 stout pure-copper per-pixel hybrid bonding columns bridging upper memory wafer -> bottom CDS/AMP wafer!
    for (const sx of [-1.05, 1.05]) {
      for (const sz of [-1.05, 1.05]) {
        const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.92, 20), mats.copperPad);
        pil.position.set(X_M + sx, -0.58, sz);
        pxCucuGrp.add(pil);
      }
    }
  }
  register('gs_px_cucu_pixel_pillar', pxCucuGrp, [3.8, -0.8, 0.6]);

  // 30. 10,000x Bottom-Wafer Correlated Double Sampling (CDS) + Source-Follower AMP / RST / SEL FinFET Readout
  const ampGrp = new THREE.Group();
  {
    const sub = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.72, 4.45), mats.finfetLogicBase);
    sub.position.set(X_M, -1.68, 0);
    ampGrp.add(sub);

    for (const sx of [-1.05, 1.05]) {
      for (const sz of [-1.05, 1.05]) {
        const mos = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.34, 1.15), mats.mosfetAmp);
        mos.position.set(X_M + sx, -1.18, sz);
        ampGrp.add(mos);
      }
    }
  }
  register('gs_px_cds_amp_finfet', ampGrp, [3.6, -1.8, 0.2]);

  // 31. 10,000x LIVE Global-Snapshot Electron Charge Packet (Snaps simultaneously PD -> Shielded MN -> Cu-Cu -> AMP!)
  const elecGrp = new THREE.Group();
  const elecCloudSub = new THREE.Group();
  {
    const eGeo = new THREE.SphereGeometry(0.16, 18, 18);
    const offsets = [
      [-1.18, 0.14, 1.78], [-0.82, -0.06, 1.78], [-1.00, 0.04, 1.88],
      [1.18, 0.14, 1.78], [0.82, -0.06, 1.78], [1.00, 0.04, 1.88],
      [-1.05, 0.02, -0.95], [1.05, 0.02, -0.95], [0.0, 0.16, 1.72]
    ];
    for (const [ox, oy, oz] of offsets) {
      const sp = new THREE.Mesh(eGeo, mats.gsElectronCloud);
      sp.position.set(X_M + ox, 0.36 + oy, oz);
      elecCloudSub.add(sp);
    }
    elecGrp.add(elecCloudSub);
    elecGrp.userData.gsElectronCloud = elecCloudSub;
  }
  register('gs_px_electron_packet_snap', elecGrp, [4.2, 0.5, 2.4]);

  // 32. 10,000x Global Shutter Wafer Cross-Section Ceramic Metrology Plinth
  const plinthGrp = new THREE.Group();
  {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.36, 5.1), mats.llCeramicChamber);
    plinth.position.set(X_M, -2.35, 0);
    // Subtle vertical scale rail linking the 3 stacked wafer tiers on the right edge
    const rail = buildRod(new THREE.Vector3(X_M + 2.45, -2.15, 2.35), new THREE.Vector3(X_M + 2.45, 3.15, 2.35), 0.04, mats.tpGoosGauge);
    plinthGrp.add(plinth, rail);
  }
  register('gs_px_metrology_plinth', plinthGrp, [4.0, -3.2, 0.0]);

  return {
    root,
    parts,
    gridY: -3.55,
    defaultCameraPos: new THREE.Vector3(26.5, 16.5, 42.5),
    defaultTarget: new THREE.Vector3(4.2, 0.35, 0.2),
    clipBounds: { x: 15.0, y: 6.5, z: 9.0 }
  };
}
