import * as THREE from 'three';

/**
 * Phase 17 (18th Multiscale Mode / 532-Part Milestone!):
 * Ultra-Ultra-High Atomic Dissection ("超超高解剖") of:
 *   - LEFT ZONE (X = -5.6, Real-Scale Cutaway Package): 2 nm Flagship Camera SoC
 *     (Triple 18-bit ISP, 100 TOPS NPU Systolic Array, 48 MB 6T-SRAM, 6-Port MIPI/SLVS-EC PHY,
 *      Stacked PoP 16 GB LPDDR5X-9600, 12,000+ C4 Cu-Pillar Bumps, 16-Layer ABF Substrate & BGA!)
 *   - RIGHT ZONE (X = +7.4, 100,000x ATOMIC SCALE — 1 unit ≈ 5 nm!):
 *     Single 2 nm Gate-All-Around (GAA) 3-Stack Silicon Nanosheet Transistor (5 nm thick = 18 Si atoms!)
 *     with 0.543 nm Si Diamond-Cubic Lattice Spheres, 360° Wrap-Around 1.2 nm HfO2 + WFM + RMG Gate,
 *     SiBCN Inner Spacers, Diamond-Faceted Strained Epitaxial Si:P Source/Drain,
 *     BACKSIDE POWER DELIVERY NETWORK (BSPDN / PowerVia / SuperPowerRail) Pure-Copper Rails + nTSV UNDERNEATH,
 *     13.5 nm EUV Barrierless Ruthenium (Ru) M0 + M1-M3 Dual-Damascene Copper Signal Highways ABOVE,
 *     and LIVE BALLISTIC ELECTRON WAVE-PACKETS racing through all 3 nanosheets in sync with V_GS ON/OFF!
 *
 * 32 Independent Dissectable Parts (14 Left Package/Die + 18 Right 100,000x Atomic GAA/BSPDN).
 */
export function buildSocGaaAssembly(mats) {
  const root = new THREE.Group();
  root.name = 'SocGaaAtomicRoot';
  const parts = [];

  const register = (id, group, explodeVec, flags = {}) => {
    group.name = id;
    root.add(group);
    parts.push({ id, group, explodeVec: new THREE.Vector3(...explodeVec), ...flags });
  };

  // =========================================================================
  // LEFT ZONE: 2 nm CAMERA SoC PoP PACKAGE & COMPUTE DIE (X = -5.6)
  // =========================================================================
  const X_PKG = -5.6;

  // 01. Cutaway Pure-Copper EMI/Heatspreader Lid & Graphenic TIM (open front-right exposing PoP & SoC!)
  const lidGrp = new THREE.Group();
  {
    const backStrip = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.22, 3.2), mats.fpVaporCopper);
    backStrip.position.set(X_PKG, 3.45, -3.3);
    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 6.6), mats.fpVaporCopper);
    leftStrip.position.set(X_PKG - 3.3, 3.45, 1.6);
    // Side EMI skirt walls along rear & left edges
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.45, 0.18), mats.fpVaporCopper);
    backWall.position.set(X_PKG, 2.75, -4.82);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.45, 9.8), mats.fpVaporCopper);
    leftWall.position.set(X_PKG - 4.82, 2.75, 0);
    // Thin dark graphenic TIM layer underneath lid
    const tim = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.08, 2.8), mats.susDarkInner);
    tim.position.set(X_PKG, 3.28, -3.2);
    lidGrp.add(backStrip, leftStrip, backWall, leftWall, tim);
  }
  register('gaa_pkg_heatspreader_tim', lidGrp, [-1.4, 5.4, -1.0]);

  // 02. Stacked PoP 16 GB LPDDR5X-9600 Quad-Channel DRAM (L-cutaway revealing 4 stacked 35um DRAM dies!)
  const dramGrp = new THREE.Group();
  {
    // Molded dark upper PoP substrate base (L-cutaway leaving front-right quadrant open to see 2nm SoC!)
    const baseBack = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.24, 3.4), mats.rigidPcb);
    baseBack.position.set(X_PKG, 2.15, -2.9);
    const baseLeft = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.24, 5.8), mats.rigidPcb);
    baseLeft.position.set(X_PKG - 2.9, 2.15, 1.7);
    dramGrp.add(baseBack, baseLeft);

    // 4 Stacked 35um LPDDR5X DRAM Silicon Dies arranged in staircase wire-bond stack!
    for (let i = 0; i < 4; i++) {
      const w = 4.6 - i * 0.28;
      const d = 2.6 - i * 0.18;
      const die = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), mats.dramDie);
      die.position.set(X_PKG - 1.5 - i * 0.14, 2.38 + i * 0.20, -2.45 - i * 0.08);
      dramGrp.add(die);
    }
    // Translucent epoxy mold cutaway cap framing rear-left corner
    const cap = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.92, 3.1), mats.fpFrostedGlass);
    cap.position.set(X_PKG - 1.6, 2.74, -2.75);
    dramGrp.add(cap);
  }
  register('gaa_pkg_pop_lpddr5x', dramGrp, [-1.2, 3.8, -0.8]);

  // 03. Through-Mold-Via (TMV) Peripheral PoP Micro-Solder Ball Ring (0.30 mm pitch)
  const tmvGrp = new THREE.Group();
  {
    const ballGeo = new THREE.SphereGeometry(0.18, 12, 12);
    for (let i = -4; i <= 4; i++) {
      const offset = i * 0.98;
      const coords = [
        [X_PKG + offset, -4.25],
        [X_PKG + offset, 4.25],
        [X_PKG - 4.25, offset],
        [X_PKG + 4.25, offset]
      ];
      for (const [bx, bz] of coords) {
        // Avoid duplicate corners
        if ((Math.abs(bx - X_PKG) > 4.2 && Math.abs(bz) > 4.2) && i !== -4 && i !== 4) continue;
        const b = new THREE.Mesh(ballGeo, mats.solderTin);
        b.position.set(bx, 1.72, bz);
        tmvGrp.add(b);
      }
    }
    // Translucent mold carrier collar around perimeter
    const collar = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.36, 0.24), mats.fpFrostedGlass);
    collar.position.set(X_PKG, 1.72, -4.25);
    tmvGrp.add(collar);
  }
  register('gaa_pkg_tmv_solder_balls', tmvGrp, [-0.8, 2.6, 0.0]);

  // 04. 2 nm Monolithic Flagship Camera SoC Die (~30 Billion GAA Transistors!)
  const dieGrp = new THREE.Group();
  {
    const bulk = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.34, 6.8), mats.siliconBulkSide);
    bulk.position.set(X_PKG, 0.72, 0.15);
    const face = new THREE.Mesh(new THREE.BoxGeometry(6.72, 0.06, 6.72), mats.gaaSocDie);
    face.position.set(X_PKG, 0.92, 0.15);
    // Micro-zoom callout reticle frame on the die surface showing where the Right 100,000x GAA comes from!
    const reticle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 10, 24), mats.goldBond);
    reticle.rotation.x = Math.PI / 2;
    reticle.position.set(X_PKG + 2.15, 1.00, 0.65);
    dieGrp.add(bulk, face, reticle);
  }
  register('gaa_pkg_soc_silicon_die', dieGrp, [-0.6, 1.4, 0.0]);

  // 05. Triple 18-bit Real-Time RAW Image Signal Processor (ISP Pipeline — 3.2 GPix/s)
  const ispGrp = new THREE.Group();
  const ispLiveMat = mats.gaaIspBlock.clone();
  {
    for (let i = 0; i < 3; i++) {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 2.55), ispLiveMat);
      pipe.position.set(X_PKG - 2.35 + i * 0.98, 1.08, -1.45);
      ispGrp.add(pipe);
    }
    ispGrp.userData.gaaIspMat = ispLiveMat;
  }
  register('gaa_pkg_triple_isp_block', ispGrp, [-1.6, 2.4, -1.2]);

  // 06. Computational-Optics Tensor NPU (100 TOPS Systolic Matrix Array)
  const npuGrp = new THREE.Group();
  const npuLiveMat = mats.gaaNpuSystolic.clone();
  {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.56), npuLiveMat);
        tile.position.set(X_PKG + 0.52 + c * 0.68, 1.09, -2.42 + r * 0.68);
        npuGrp.add(tile);
      }
    }
    npuGrp.userData.gaaNpuMat = npuLiveMat;
  }
  register('gaa_pkg_npu_systolic_array', npuGrp, [-0.2, 2.6, -1.2]);

  // 07. 48 MB On-Die 6T-SRAM System-Level Cache & Zero-Shutter-Lag Ring Buffer
  const sramGrp = new THREE.Group();
  {
    for (let i = 0; i < 6; i++) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.18, 0.34), mats.gaaSramBank);
      bank.position.set(X_PKG - 1.48, 1.06, 0.52 + i * 0.48);
      sramGrp.add(bank);
    }
  }
  register('gaa_pkg_sram_slc_cache', sramGrp, [-1.4, 2.1, 1.2]);

  // 08. Unified 6-Port MIPI CSI-2 C-PHY / SLVS-EC High-Speed SerDes PHY Bank (120 Gbps)
  const phyGrp = new THREE.Group();
  {
    for (let p = 0; p < 6; p++) {
      const lane = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.20, 0.30), mats.goldBond);
      lane.position.set(X_PKG + 1.55, 1.07, 0.55 + p * 0.46);
      phyGrp.add(lane);
    }
  }
  register('gaa_pkg_mipi_slvsec_phy', phyGrp, [-0.2, 2.2, 1.4]);

  // 09. 12,000+ Flip-Chip Cu-Pillar C4 Micro-Bump Matrix (45 um pitch)
  const c4Grp = new THREE.Group();
  {
    const pilGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 10);
    const capGeo = new THREE.SphereGeometry(0.12, 10, 8);
    for (let ix = -4; ix <= 4; ix++) {
      for (let iz = -4; iz <= 4; iz++) {
        const cx = X_PKG + ix * 0.68;
        const cz = 0.15 + iz * 0.68;
        const pil = new THREE.Mesh(pilGeo, mats.copperPad);
        pil.position.set(cx, 0.40, cz);
        const cap = new THREE.Mesh(capGeo, mats.solderTin);
        cap.position.set(cx, 0.24, cz);
        c4Grp.add(pil, cap);
      }
    }
  }
  register('gaa_pkg_c4_microbumps', c4Grp, [-0.6, 0.3, 0.0]);

  // 10. Capillary Silica-Filled Epoxy Underfill (CUF) & Stress-Relief Fillet (front cutaway!)
  const ufGrp = new THREE.Group();
  {
    const backUf = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.34, 3.6), mats.fpFrostedGlass);
    backUf.position.set(X_PKG, 0.34, -1.65);
    const leftUf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.34, 3.6), mats.fpFrostedGlass);
    leftUf.position.set(X_PKG - 1.9, 0.34, 1.95);
    ufGrp.add(backUf, leftUf);
  }
  register('gaa_pkg_underfill_epoxy', ufGrp, [-1.4, 0.1, 0.4]);

  // 11. 16-Layer Ajinomoto Build-up Film (ABF) Ultra-HDI Package Substrate
  const abfGrp = new THREE.Group();
  {
    const topLayer = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.26, 9.6), mats.gaaAbfSub);
    topLayer.position.set(X_PKG, -0.02, 0.0);
    const coreLayer = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 9.6), mats.copperPad);
    coreLayer.position.set(X_PKG, -0.28, 0.0);
    const botLayer = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.24, 9.6), mats.gaaAbfSub);
    botLayer.position.set(X_PKG, -0.52, 0.0);
    abfGrp.add(topLayer, coreLayer, botLayer);
  }
  register('gaa_pkg_abf_substrate', abfGrp, [-0.8, -1.2, 0.0]);

  // 12. Land-Side Ultra-Low-ESL Silicon Capacitors (Si-Cap) & 01005 Decoupling Array
  const capGrp = new THREE.Group();
  {
    for (let ix = -1; ix <= 1; ix++) {
      for (let iz = -1; iz <= 1; iz++) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.28, 0.52), mats.mlccCeramic);
        cap.position.set(X_PKG + ix * 1.15, -0.84, iz * 0.95);
        const termL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.30, 0.54), mats.solderTin);
        termL.position.set(X_PKG + ix * 1.15 - 0.36, -0.84, iz * 0.95);
        const termR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.30, 0.54), mats.solderTin);
        termR.position.set(X_PKG + ix * 1.15 + 0.36, -0.84, iz * 0.95);
        capGrp.add(cap, termL, termR);
      }
    }
  }
  register('gaa_pkg_landside_mlcc', capGrp, [-0.8, -2.4, 0.0]);

  // 13. Bottom 1,800-Ball SAC305 BGA Mainboard Interconnect Grid (hollow center for Si-Caps!)
  const bgaGrp = new THREE.Group();
  {
    const bGeo = new THREE.SphereGeometry(0.22, 12, 10);
    for (let ix = -5; ix <= 5; ix++) {
      for (let iz = -5; iz <= 5; iz++) {
        // Leave central cavity open for Land-Side Silicon Capacitors!
        if (Math.abs(ix) <= 2 && Math.abs(iz) <= 2) continue;
        const b = new THREE.Mesh(bGeo, mats.solderTin);
        b.position.set(X_PKG + ix * 0.84, -0.92, iz * 0.84);
        bgaGrp.add(b);
      }
    }
  }
  register('gaa_pkg_bga_solder_grid', bgaGrp, [-0.8, -3.2, 0.0]);

  // 14. 12-Layer Dual-Deck Smartphone Main Logic Board (MLB) Local Mounting Slice
  const mlbGrp = new THREE.Group();
  {
    const board = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.58, 10.8), mats.rigidPcb);
    board.position.set(X_PKG, -1.46, 0.0);
    const cuSlug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.62, 4.2), mats.fpVaporCopper);
    cuSlug.position.set(X_PKG, -1.46, 0.0);
    mlbGrp.add(board, cuSlug);
  }
  register('gaa_pkg_pcb_interposer', mlbGrp, [-0.8, -4.4, 0.0]);

  // =========================================================================
  // RIGHT ZONE: 100,000x ATOMIC-SCALE 2 nm GAA 3-STACK NANOSHEET + BSPDN! (X = +7.4)
  // =========================================================================
  const X_GAA = 7.4;
  const NS_YS = [-0.25, 0.65, 1.55]; // Exact vertical heights of the 3 stacked 5 nm Si Nanosheets!

  // 15. Backside Power Delivery Network (BSPDN / PowerVia / SuperPowerRail) Thick Pure-Copper Rails!
  const bspdnGrp = new THREE.Group();
  {
    // Main underground VDD copper rail directly aligned below Source (X = X_GAA - 2.68)
    const vddTrunk = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.68, 7.6), mats.gaaBspdnCopper);
    vddTrunk.position.set(X_GAA - 2.68, -2.78, 0.0);
    // Underground VSS copper rail below Drain side
    const vssTrunk = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.68, 7.6), mats.copperCoil);
    vssTrunk.position.set(X_GAA + 2.68, -2.78, 0.0);
    // Lower orthogonal M-2B backside copper power bus bars
    for (const bz of [-2.4, 0.0, 2.4]) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.34, 0.72), mats.gaaBspdnCopper);
      cross.position.set(X_GAA, -3.32, bz);
      bspdnGrp.add(cross);
    }
    bspdnGrp.add(vddTrunk, vssTrunk);
  }
  register('gaa_nano_backside_power_rails', bspdnGrp, [1.2, -3.8, 0.0]);

  // 16. Self-Aligned Nano-TSV (nTSV) Backside Direct Source Power Contact Pillar!
  const ntsvGrp = new THREE.Group();
  {
    // Vertical tungsten/ruthenium pillar shooting straight UP from underground VDD rail into Source crystal!
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 2.02, 24), mats.goldBond);
    pillar.position.set(X_GAA - 2.68, -1.52, 0.0);
    // Conical backside landing contact flange directly touching Source bottom
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.44, 0.24, 24), mats.gaaWfmMetal);
    cap.position.set(X_GAA - 2.68, -0.56, 0.0);
    // Thin insulating dielectric collar around nTSV
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.64, 1.35, 24, 1, true), mats.gaaInnerSpacer);
    collar.position.set(X_GAA - 2.68, -1.62, 0.0);
    ntsvGrp.add(pillar, cap, collar);
  }
  register('gaa_nano_buried_tsv_nano_via', ntsvGrp, [-0.4, -2.6, 0.0]);

  // 17. Ultra-Thinned Si(100) Backside Substrate Floor & Copper-Diffusion Barrier Liner
  const subGrp = new THREE.Group();
  {
    // Split around the nTSV pillar cleanly so zero Z-fighting!
    const rightSlab = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.82, 7.6), mats.siliconBulkSide);
    rightSlab.position.set(X_GAA + 1.45, -1.78, 0.0);
    const leftSlab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.82, 7.6), mats.siliconBulkSide);
    leftSlab.position.set(X_GAA - 3.92, -1.78, 0.0);
    const liner = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.14, 7.6), mats.lcpBlack);
    liner.position.set(X_GAA, -2.26, 0.0);
    subGrp.add(rightSlab, leftSlab, liner);
  }
  register('gaa_nano_silicon_substrate', subGrp, [1.0, -2.2, 0.0]);

  // 18. Shallow Trench Isolation (STI) SiO2 Cell Boundary Walls (cutaway open on front!)
  const stiGrp = new THREE.Group();
  {
    const rearSti = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.95, 1.35), mats.fpFrostedGlass);
    rearSti.position.set(X_GAA, -0.38, -3.12);
    const frontRim = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.45, 0.72), mats.fpFrostedGlass);
    frontRim.position.set(X_GAA, -1.12, 3.44);
    stiGrp.add(rearSti, frontRim);
  }
  register('gaa_nano_sti_isolation', stiGrp, [1.0, -1.4, -2.0]);

  // 19. Bottom Dielectric Isolation (BDI: SiN/SiO2) Anti-Punch-Through Seal below Nanosheet #1
  const bdiGrp = new THREE.Group();
  {
    const seal = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.34, 3.3), mats.gaaHfo2HighK);
    seal.position.set(X_GAA, -1.06, 0.0);
    const subFin = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 3.3), mats.gaaInnerSpacer);
    subFin.position.set(X_GAA, -1.30, 0.0);
    bdiGrp.add(seal, subFin);
  }
  register('gaa_nano_bottom_isolation', bdiGrp, [0.4, -1.0, 0.0]);

  // 20. HERO: 3-Stack Horizontal Single-Crystal Silicon (Si) Nanosheet Channels (Thickness = 5 nm = 18 Si atoms!)
  const nsGrp = new THREE.Group();
  {
    for (const ny of NS_YS) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.42, 2.75), mats.gaaNanosheetSi);
      sheet.position.set(X_GAA, ny, 0.0);
      nsGrp.add(sheet);
    }
  }
  register('gaa_nano_si_nanosheets_3stack', nsGrp, [0.8, 0.4, 1.2]);

  // 21. Atomic-Scale Si Diamond-Cubic Crystal Lattice Spheres (a = 0.543 nm) INSIDE all 3 Nanosheets!
  const atomGrp = new THREE.Group();
  {
    const aGeo = new THREE.SphereGeometry(0.068, 10, 8);
    for (const ny of NS_YS) {
      for (let ix = -4; ix <= 4; ix++) {
        for (let iz = -2; iz <= 2; iz++) {
          for (const dy of [-0.09, 0.09]) {
            const stagger = (dy > 0 ? 0.24 : 0);
            const atom = new THREE.Mesh(aGeo, mats.gaaSiAtomSphere);
            atom.position.set(X_GAA + ix * 0.50 + stagger * 0.45, ny + dy, iz * 0.54);
            atomGrp.add(atom);
          }
        }
      }
    }
  }
  register('gaa_nano_si_atomic_lattice', atomGrp, [0.8, 0.8, 2.6]);

  // 22. Precision SiBCN Low-k Inner Spacers (Tucked strictly in the 9 nm cavities between the 3 Si ribbons!)
  const inSpGrp = new THREE.Group();
  {
    const gapYs = [-0.68, 0.20, 1.10, 1.98];
    for (const gy of gapYs) {
      for (const sx of [-1, 1]) {
        const plug = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 2.86), mats.gaaInnerSpacer);
        plug.position.set(X_GAA + sx * 1.44, gy, 0.0);
        inSpGrp.add(plug);
      }
    }
  }
  register('gaa_nano_inner_spacers', inSpGrp, [0.4, 0.6, 1.8]);

  // 23. 360° Wrap-Around 1.2 nm HfO2 (High-k, ε_r ≈ 25) + 0.5 nm SiO2 Interfacial Gate Oxide Shells!
  const hfo2Grp = new THREE.Group();
  const gateFieldMat = mats.gaaHfo2HighK.clone();
  {
    for (const ny of NS_YS) {
      // 4-sided 360° hollow wrap sleeve around each nanosheet (top, bottom, front, rear slabs!)
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.08, 2.94), gateFieldMat);
      top.position.set(X_GAA, ny + 0.26, 0.0);
      const bot = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.08, 2.94), gateFieldMat);
      bot.position.set(X_GAA, ny - 0.26, 0.0);
      const front = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.58, 0.08), gateFieldMat);
      front.position.set(X_GAA, ny, 1.44);
      const rear = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.58, 0.08), gateFieldMat);
      rear.position.set(X_GAA, ny, -1.44);
      hfo2Grp.add(top, bot, front, rear);
    }
    hfo2Grp.userData.gaaGateFieldMat = gateFieldMat;
  }
  register('gaa_nano_hfo2_highk_wrap', hfo2Grp, [0.6, 1.4, 0.8]);

  // 24. Conformal ALD TiAlC / TiN Work-Function Metal (WFM) V_th Tuning Shells
  const wfmGrp = new THREE.Group();
  {
    // Fills the inner vertical cavities between HfO2 shells + top/rear cutaway wrap!
    const wfmYs = [-0.68, 0.20, 1.10, 2.02];
    for (const wy of wfmYs) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.26, 3.06), mats.gaaWfmMetal);
      strip.position.set(X_GAA, wy, 0.0);
      wfmGrp.add(strip);
    }
    // Rear vertical conformal WFM spine connecting all 4 layers (front left open for cutaway clarity!)
    const spine = new THREE.Mesh(new THREE.BoxGeometry(2.14, 2.96, 0.16), mats.gaaWfmMetal);
    spine.position.set(X_GAA, 0.68, -1.56);
    wfmGrp.add(spine);
  }
  register('gaa_nano_workfunction_metal', wfmGrp, [0.6, 1.8, -0.6]);

  // 25. Central 3D Replacement Metal Gate (RMG Tungsten/Molybdenum) Core (Front Cutaway Arch!)
  const rmgGrp = new THREE.Group();
  {
    // Heavy upper metal gate bridge directly above top WFM + rear wrap column (front open so 3 nanosheets gleam!)
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.72, 3.42), mats.gaaTungstenGate);
    topCap.position.set(X_GAA, 2.52, -0.05);
    const rearCol = new THREE.Mesh(new THREE.BoxGeometry(2.18, 3.65, 0.92), mats.gaaTungstenGate);
    rearCol.position.set(X_GAA, 0.78, -2.02);
    // Vertical gate contact via rising to M0 Ruthenium rail
    const gateVia = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.42, 16), mats.goldBond);
    gateVia.position.set(X_GAA, 3.06, -0.85);
    rmgGrp.add(topCap, rearCol, gateVia);
  }
  register('gaa_nano_tungsten_gate_pillar', rmgGrp, [0.6, 2.4, -1.8]);

  // 26. Dual SiOCN Outer Gate Sidewall Spacers (L_g = 12 nm)
  const outSpGrp = new THREE.Group();
  {
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.92, 3.42), mats.zmAluminaCeramic);
      wall.position.set(X_GAA + sx * 1.34, 2.48, -0.05);
      outSpGrp.add(wall);
    }
  }
  register('gaa_nano_outer_spacer_walls', outSpGrp, [0.6, 2.8, 0.2]);

  // 27. Faceted Diamond-Shaped Epitaxial Si:P / SiGe Strained Source & Drain Crystals!
  const sdGrp = new THREE.Group();
  {
    // Build a true diamond-faceted {111} epitaxial crystal profile extruded along Z!
    const epiShape = new THREE.Shape();
    epiShape.moveTo(-0.85, -1.25);
    epiShape.lineTo(0.85, -1.25);
    epiShape.lineTo(1.12, 0.25);
    epiShape.lineTo(0.68, 1.35);
    epiShape.lineTo(-0.68, 1.35);
    epiShape.lineTo(-1.12, 0.25);
    epiShape.closePath();

    const epiGeo = new THREE.ExtrudeGeometry(epiShape, {
      depth: 2.95,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.10,
      bevelSegments: 2
    });
    epiGeo.translate(0, 0, -1.475);

    // Left = Source Crystal (anchored directly on top of underground nTSV power pillar!)
    const src = new THREE.Mesh(epiGeo, mats.gaaEpiSdCrystal);
    src.position.set(X_GAA - 2.68, 0.68, 0.0);
    // Right = Drain Crystal (anchored directly under front-side signal contact!)
    const drn = new THREE.Mesh(epiGeo, mats.gaaEpiSdCrystal);
    drn.position.set(X_GAA + 2.68, 0.68, 0.0);
    sdGrp.add(src, drn);
  }
  register('gaa_nano_epi_sd_crystals', sdGrp, [1.8, 0.4, 0.0]);

  // 28. Wrap-Around Titanium Silicide (TiSi2) & Cobalt/Mo Trench Drain Signal Contact (TS)
  const silGrp = new THREE.Group();
  {
    // Silicide wrap cap over Drain top + Source top passivation cap
    for (const sx of [-1, 1]) {
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.22, 3.12), mats.goldBond);
      wrap.position.set(X_GAA + sx * 2.68, 2.08, 0.0);
      silGrp.add(wrap);
    }
    // Tall vertical Co/Mo trench contact (TS) rising from Drain (+X) up to Front-Side M0 Signal Rail!
    const tsDrain = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 2.45), mats.gaaWfmMetal);
    tsDrain.position.set(X_GAA + 2.68, 2.68, 0.0);
    silGrp.add(tsDrain);
  }
  register('gaa_nano_silicide_wrap_contact', silGrp, [2.0, 1.8, 0.0]);

  // 29. LIVE QUANTUM BALLISTIC ELECTRON WAVE-PACKETS (18 e- spheres) & 360° GATE ELECTRIC-FIELD HALO RINGS!
  const elecGrp = new THREE.Group();
  const gaaElectrons = [];
  const gaaGateRings = [];
  {
    const eGeo = new THREE.SphereGeometry(0.16, 14, 12);
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const ny = NS_YS[sIdx];
      // 6 glowing golden ballistic electrons per nanosheet (3 front-window lane + 3 inner lane = 18 total!)
      for (let eIdx = 0; eIdx < 6; eIdx++) {
        const em = new THREE.Mesh(eGeo, mats.gaaElectronPacket);
        const phase = (eIdx / 6 + sIdx * 0.19) % 1.0;
        const ez = (eIdx % 2 === 0) ? 1.08 : -0.45;
        const ex = (X_GAA - 2.35) + phase * 4.70;
        em.position.set(ex, ny, ez);
        em.userData = { sheetIdx: sIdx, basePhase: phase, laneZ: ez, baseY: ny, xMin: X_GAA - 2.35, xSpan: 4.70 };
        elecGrp.add(em);
        gaaElectrons.push(em);
      }

      // 360° Gate Electric-Field Halo Ring encircling the waist of each nanosheet!
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.78,
        roughness: 0.15
      });
      const rGeo = new THREE.TorusGeometry(0.96, 0.045, 10, 32);
      rGeo.rotateY(Math.PI / 2);
      const ring = new THREE.Mesh(rGeo, ringMat);
      ring.scale.set(1.58, 0.34, 1);
      ring.position.set(X_GAA, ny, 0.0);
      elecGrp.add(ring);
      gaaGateRings.push(ring);
    }
    elecGrp.userData.gaaElectrons = gaaElectrons;
    elecGrp.userData.gaaGateRings = gaaGateRings;
  }
  register('gaa_nano_live_ballistic_electrons', elecGrp, [0.8, 1.0, 3.2]);

  // 30. 13.5 nm EUV Lithography M0 Barrierless Ruthenium (Ru) Local Signal Rails (18 nm Pitch!)
  const m0Grp = new THREE.Group();
  {
    for (const mz of [-2.0, -1.0, 0.0, 1.0, 2.0]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.24, 0.36), mats.gaaRutheniumM0);
      rail.position.set(X_GAA, 3.30, mz);
      m0Grp.add(rail);
    }
  }
  register('gaa_nano_m0_ruthenium_rails', m0Grp, [1.0, 3.4, 0.0]);

  // 31. Front-Side M1-M3 Dual-Damascene Copper Signal Highways & Air-Gap Low-k Vias
  const beolGrp = new THREE.Group();
  {
    // M1 orthogonal Z-rails
    for (const mx of [-3.0, -1.0, 1.0, 3.0]) {
      const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 7.2), mats.gaaIspBlock);
      m1.position.set(X_GAA + mx, 3.84, 0.0);
      beolGrp.add(m1);
      // V0 inter-layer via down to M0
      const v0 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.34, 12), mats.goldBond);
      v0.position.set(X_GAA + mx, 3.56, (mx > 0 ? 0.0 : -1.0));
      beolGrp.add(v0);
    }
    // M2 orthogonal X-rails
    for (const mz of [-2.2, 0.0, 2.2]) {
      const m2 = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.32, 0.52), mats.copperPad);
      m2.position.set(X_GAA, 4.44, mz);
      beolGrp.add(m2);
      const v1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 12), mats.goldBond);
      v1.position.set(X_GAA + (mz === 0 ? 3.0 : -1.0), 4.12, mz);
      beolGrp.add(v1);
    }
  }
  register('gaa_nano_beol_m1_m3_cu', beolGrp, [1.2, 4.8, 0.0]);

  // 32. Atomic-Scale Ceramic Metrology Plinth (0.543 nm Si Lattice & 5 nm Nanosheet Reference Base)
  const plinthGrp = new THREE.Group();
  {
    const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.42, 8.8), mats.zmAluminaCeramic);
    baseSlab.position.set(X_GAA, -4.05, 0.0);
    const goldRim = new THREE.Mesh(new THREE.BoxGeometry(10.32, 0.08, 8.92), mats.goldBond);
    goldRim.position.set(X_GAA, -3.82, 0.0);
    // Metrology L_g = 12 nm / CPP = 45 nm gold reference scale bar along front edge
    for (let i = -4; i <= 4; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.36), mats.goldBond);
      tick.position.set(X_GAA + i * 1.12, -3.76, 4.18);
      plinthGrp.add(tick);
    }
    plinthGrp.add(baseSlab, goldRim);
  }
  register('gaa_nano_metrology_plinth', plinthGrp, [1.2, -5.2, 0.0]);

  return {
    root,
    parts,
    gridY: -4.4,
    defaultCameraPos: new THREE.Vector3(17.5, 15.2, 32.8),
    defaultTarget: new THREE.Vector3(5.2, 0.25, 0.0),
    clipBounds: { x: 13.5, y: 6.2, z: 6.2 }
  };
}
