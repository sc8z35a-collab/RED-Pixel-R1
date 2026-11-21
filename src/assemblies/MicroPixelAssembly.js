import * as THREE from 'three';

/**
 * Helper to create a 3D cross + rear cutaway wall grid (open on front +X/+Z faces
 * so the internal CFA blocks, BSI Photodiodes, and D-VTG pillars are vividly exposed
 * like an authentic semiconductor cross-section CAD specimen).
 */
function createQuadGridWalls(totalSize, wallThick, height, mat, mode = 'cutaway') {
  const group = new THREE.Group();
  const half = totalSize / 2;

  // Inner cross walls separating all 2x2 pixels
  const barX = new THREE.Mesh(new THREE.BoxGeometry(totalSize, height, wallThick), mat);
  const barZ = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, totalSize), mat);
  group.add(barX, barZ);

  if (mode === 'cutaway' || mode === 'full') {
    const outerLen = totalSize + wallThick;
    // Rear -Z and -X walls kept intact to showcase full trench depth
    const nW = new THREE.Mesh(new THREE.BoxGeometry(outerLen, height, wallThick), mat);
    nW.position.z = -half;
    const wW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, outerLen), mat);
    wW.position.x = -half;
    group.add(nW, wW);

    if (mode === 'full') {
      const sW = new THREE.Mesh(new THREE.BoxGeometry(outerLen, height, wallThick), mat);
      sW.position.z = half;
      const eW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, outerLen), mat);
      eW.position.x = half;
      group.add(sW, eW);
    } else {
      // Subtle low cutaway sill ledges on the front +Z / +X edges so the trench footprint is clear
      const sillH = height * 0.12;
      const sillY = -height / 2 + sillH / 2;
      const sSill = new THREE.Mesh(new THREE.BoxGeometry(outerLen, sillH, wallThick), mat);
      sSill.position.set(0, sillY, half);
      const eSill = new THREE.Mesh(new THREE.BoxGeometry(wallThick, sillH, outerLen), mat);
      eSill.position.set(half, sillY, 0);
      group.add(sSill, eSill);
    }
  }
  return group;
}

/**
 * Builds the ultra-detailed 2×2 Quad-Bayer Sub-Micron Pixel Cross-Section CAD Model
 * featuring: CRA-shifted OCL, High-T ARL, CFA, Hybrid W/Low-n Grid, HfO2 Fixed-Charge Film,
 * Full-DTI, BSI Pinned Photodiode, Dual Vertical Transfer Gates (D-VTG), FD + LOFIC Capacitor,
 * Vertical DCNT Via, 2nd-Layer Large AMP/RST/SEL MOSFETs, M1-M5 BEOL Cu Interconnects,
 * Sub-Micron Cu-Cu Hybrid Bonding Interface, and 22nm Bottom FinFET Logic Layer.
 *
 * Scale: 1 unit ≈ 0.25 μm (1 pixel = 6.4 units = 1.6 μm; 2x2 unit = 12.8 x 12.8 units)
 */
export function buildMicroPixelAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const S = 12.8; // 2x2 block width/depth (3.2 μm)
  const P = 6.4;  // single pixel pitch (1.6 μm)
  const quadCenters = [
    { x: -P / 2, z: -P / 2, color: 'R' },
    { x:  P / 2, z: -P / 2, color: 'G' },
    { x: -P / 2, z:  P / 2, color: 'G' },
    { x:  P / 2, z:  P / 2, color: 'B' }
  ];

  const register = (id, group, explodeVec) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      oisMoving: false
    });
    return group;
  };

  // =========================================================================
  // M01. ON-CHIP MICROLENS ARRAY (OCL: 2x2 Gapless High-P Domes w/ CRA Shift)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 5.75, 0);

    // Base polymer meniscus sheet joining gapless domes
    const baseFilm = new THREE.Mesh(
      new THREE.BoxGeometry(S, 0.20, S),
      mats.microLensPolymer
    );
    baseFilm.position.y = -0.05;
    g.add(baseFilm);

    // 4 High-refractive-index aspherical domes with subtle CRA offset toward center
    const domeGeo = new THREE.SphereGeometry(P * 0.495, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.5);
    domeGeo.scale(1.0, 0.56, 1.0);

    for (const q of quadCenters) {
      // Simulate slight Chief Ray Angle (CRA) inward shift toward optical axis
      const craShiftX = q.x * -0.045;
      const craShiftZ = q.z * -0.045;
      const dome = new THREE.Mesh(domeGeo, mats.microLensPolymer);
      dome.position.set(q.x + craShiftX, 0.04, q.z + craShiftZ);
      g.add(dome);
    }

    register('micro_ocl_microlens', g, [0, 8.2, 0]);
  }

  // =========================================================================
  // M02. UPPER PLANARIZATION OVERCOAT & HIGH-T ANTI-REFLECTIVE LAYER (ARL)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 5.32, 0);

    const planar = new THREE.Mesh(
      new THREE.BoxGeometry(S, 0.42, S),
      mats.microArlLayer
    );
    g.add(planar);

    // Ultra-thin top ARL nano-coating slab
    const arlFilm = new THREE.Mesh(
      new THREE.BoxGeometry(S + 0.02, 0.07, S + 0.02),
      mats.ircfCoating
    );
    arlFilm.position.y = 0.24;
    g.add(arlFilm);

    register('micro_planar_arl', g, [0, 6.7, 0]);
  }

  // =========================================================================
  // M03. QUAD-BAYER COLOR FILTER ARRAY (RGGB Pigmented Resist Blocks)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 4.38, 0);

    const blockGeo = new THREE.BoxGeometry(P - 0.56, 1.32, P - 0.56);
    for (const q of quadCenters) {
      const mat = q.color === 'R' ? mats.cfaRed : q.color === 'B' ? mats.cfaBlue : mats.cfaGreen;
      const blk = new THREE.Mesh(blockGeo, mat);
      blk.position.set(q.x, 0, q.z);
      g.add(blk);
    }

    register('micro_cfa_bayer', g, [0, 5.2, 0]);
  }

  // =========================================================================
  // M04. HYBRID TUNGSTEN & LOW-N OPTICAL LIGHT-SHIELDING GRID (Cutaway Specimen)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 4.38, 0);

    // Lower tungsten metallic opaque light barrier
    const tungstenPart = createQuadGridWalls(S, 0.34, 0.52, mats.tungstenGrid, 'cutaway');
    tungstenPart.position.y = -0.40;
    g.add(tungstenPart);

    // Upper low-refractive-index SiO2 / Air-gap total-internal-reflection guide walls
    const lowNPart = createQuadGridWalls(S, 0.28, 0.84, mats.lowNGrid, 'cutaway');
    lowNPart.position.y = 0.28;
    g.add(lowNPart);

    register('micro_metal_grid', g, [0, 4.0, 0]);
  }

  // =========================================================================
  // M05. BACKSIDE FIXED NEGATIVE CHARGE PASSIVATION FILM (HfO2 / Ta2O5 / Al2O3)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 3.56, 0);

    // Conformal ALD high-k dielectric bilayer capping the thinned Si surface
    const al2o3 = new THREE.Mesh(
      new THREE.BoxGeometry(S + 0.08, 0.16, S + 0.08),
      mats.hfo2FixedCharge
    );
    al2o3.position.y = -0.05;
    const hfo2 = new THREE.Mesh(
      new THREE.BoxGeometry(S + 0.08, 0.14, S + 0.08),
      mats.uvAdhesive
    );
    hfo2.position.y = 0.09;
    g.add(al2o3, hfo2);

    register('micro_fixed_charge', g, [0, 2.85, 0]);
  }

  // =========================================================================
  // M06. FULL-DEPTH DEEP TRENCH ISOLATION (Full-DTI Cutaway Specimen Walls)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.48, 0);

    const dtiH = 4.0; // Represents ~3.0-3.5 μm thinned Si optical absorption thickness
    const dtiWalls = createQuadGridWalls(S, 0.42, dtiH, mats.fullDtiOxide, 'cutaway');
    g.add(dtiWalls);

    // Central core poly/oxide negative-bias liner inside DTI cross walls
    const innerLiner = createQuadGridWalls(S, 0.14, dtiH + 0.04, mats.siliconBulkSide, 'cross');
    g.add(innerLiner);

    register('micro_full_dti', g, [0, 1.75, 0]);
  }

  // =========================================================================
  // M07. BSI PINNED PHOTODIODE (Deep N-Well + P+ Pinning + Depletion Cores)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.48, 0);

    const pdBodyGeo = new THREE.BoxGeometry(P - 0.56, 3.88, P - 0.56);
    const wellCoreGeo = new THREE.BoxGeometry(P - 1.55, 2.75, P - 1.55);

    for (const q of quadCenters) {
      // Main single-crystal thinned silicon cell
      const siCell = new THREE.Mesh(pdBodyGeo, mats.microPdSilicon);
      siCell.position.set(q.x, 0, q.z);
      g.add(siCell);

      // Deep N-well electron charge accumulation pocket inside the silicon
      const nWell = new THREE.Mesh(wellCoreGeo, mats.microPdDepletion);
      nWell.position.set(q.x, -0.22, q.z);
      g.add(nWell);
    }

    register('micro_photodiode', g, [0, 0.72, 0]);
  }

  // =========================================================================
  // M08. DUAL VERTICAL TRANSFER GATES (D-VTG × 2 Pillars per Photodiode = 8)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.35, 0);

    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.24, 1.85, 16);
    const oxideSleeveGeo = new THREE.CylinderGeometry(0.41, 0.33, 1.78, 16);
    const gateBridgeGeo = new THREE.BoxGeometry(2.4, 0.34, 0.92);

    for (const q of quadCenters) {
      // Offset toward central shared FD corner for authentic 2x2 shared-FD geometry
      const inwardX = q.x > 0 ? -0.95 : 0.95;
      const inwardZ = q.z > 0 ? -0.95 : 0.95;
      const cx = q.x + inwardX * 0.45;
      const cz = q.z + inwardZ * 0.45;

      // Dual vertical transfer pillars penetrating upward into deep photodiode
      for (const offset of [-0.68, 0.68]) {
        const pillar = new THREE.Mesh(pillarGeo, mats.polySiVtg);
        pillar.position.set(cx + offset, 0.85, cz);
        const sleeve = new THREE.Mesh(oxideSleeveGeo, mats.lowNGrid);
        sleeve.position.set(cx + offset, 0.85, cz);
        g.add(pillar, sleeve);
      }

      // Horizontal polysilicon VTG gate cap joining the dual vertical pillars
      const cap = new THREE.Mesh(gateBridgeGeo, mats.polySiVtg);
      cap.position.set(cx, -0.14, cz);
      g.add(cap);
    }

    register('micro_dual_vtg', g, [0, -0.48, 0]);
  }

  // =========================================================================
  // M09. FLOATING DIFFUSION (FD) & LOFIC LATERAL OVERFLOW CAPACITORS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.92, 0);

    // Central shared Floating Diffusion (FD) low-capacitance N+ diffusion island
    const fdNode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.36, 20),
      mats.fdLoficNode
    );
    g.add(fdNode);

    // 4 radial low-capacitance FD interconnect tabs to each pixel's D-VTG exit
    for (const q of quadCenters) {
      const sx = Math.sign(q.x);
      const sz = Math.sign(q.z);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.42), mats.fdLoficNode);
      arm.position.set(sx * 1.1, 0.04, sz * 1.1);
      arm.rotation.y = (sx * sz > 0) ? -Math.PI / 4 : Math.PI / 4;
      g.add(arm);

      // LOFIC Multi-plate High-Density MIM/MOM Overflow Capacitor tucked at outer corner of each pixel
      const loficGroup = new THREE.Group();
      loficGroup.position.set(q.x + sx * 1.45, -0.12, q.z + sz * 1.45);
      // Stacked parallel metallic plates (5 alternating capacitor plates!)
      for (let p = 0; p < 5; p++) {
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 0.08, 1.85),
          (p % 2 === 0) ? mats.fdLoficNode : mats.copperPad
        );
        plate.position.y = -0.32 + p * 0.16;
        loficGroup.add(plate);
      }
      // Dielectric core & overflow gate bridge
      const capDie = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.72, 1.72), mats.lowNGrid);
      loficGroup.add(capDie);
      g.add(loficGroup);
    }

    register('micro_fd_lofic', g, [0, -1.55, 0]);
  }

  // =========================================================================
  // M10. 3D VERTICAL INTER-LAYER CONTACT VIAS (DCNT + Coaxial Miller Shield)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.68, 0);

    // Central vertical FD-to-AMP-gate DCNT pillar connecting Layer 1 to Layer 2
    const mainVia = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 1.45, 16),
      mats.viaTungsten
    );
    g.add(mainVia);

    // Coaxial Miller-effect capacitive shield ring around central FD via
    const shieldRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 1.05, 20, 1, true),
      mats.microArlLayer
    );
    g.add(shieldRing);

    // 4 peripheral vertical control vias (D-VTG & LOFIC gate connections)
    const ctrlViaGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.45, 12);
    for (const [vx, vz] of [[-4.8, -4.8], [4.8, -4.8], [-4.8, 4.8], [4.8, 4.8], [-4.8, 0], [4.8, 0]]) {
      const v = new THREE.Mesh(ctrlViaGeo, mats.viaTungsten);
      v.position.set(vx, 0, vz);
      g.add(v);
    }

    register('micro_vertical_via', g, [0, -2.55, 0]);
  }

  // =========================================================================
  // M11. 2ND LAYER PIXEL TRANSISTOR SUBSTRATE (Large AMP / RST / SEL MOSFETs)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -2.52, 0);

    // Dedicated photodiode-free single-crystal silicon substrate layer (Layer 2)
    const siSub = new THREE.Mesh(
      new THREE.BoxGeometry(S, 0.56, S),
      mats.secondLayerSi
    );
    g.add(siSub);

    // Helper to build a detailed 3D planar MOSFET (Source/Drain diffusion + Gate Oxide + Gate + Contacts)
    const buildMosfet = (w, d, gateMat) => {
      const m = new THREE.Group();
      // Active diffusion region
      const active = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), mats.siliconPhotodiode);
      active.position.y = -0.24;
      // Thin gate oxide spacer
      const gox = new THREE.Mesh(new THREE.BoxGeometry(w * 0.44, 0.08, d + 0.16), mats.fullDtiOxide);
      gox.position.y = -0.37;
      // Wide low-noise MOSFET gate electrode
      const gate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.40, 0.28, d + 0.36), gateMat);
      gate.position.y = -0.52;
      // Source & Drain tungsten contact plugs
      const plugGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.45, 10);
      for (const sx of [-w * 0.34, w * 0.34]) {
        for (const sz of [-d * 0.28, d * 0.28]) {
          const p = new THREE.Mesh(plugGeo, mats.viaTungsten);
          p.position.set(sx, -0.52, sz);
          m.add(p);
        }
      }
      m.add(active, gox, gate);
      return m;
    };

    // Twin oversized low-noise AMP (Source Follower) MOSFETs — enabled by 2-layer separation!
    const amp1 = buildMosfet(4.8, 3.4, mats.mosfetAmp);
    amp1.position.set(-2.6, 0, -2.4);
    const amp2 = buildMosfet(4.8, 3.4, mats.mosfetAmp);
    amp2.position.set(2.6, 0, -2.4);

    // RST (Reset), SEL (Row Select), and DCG/LOFIC Switch MOSFETs on opposite half
    const rst = buildMosfet(3.2, 2.4, mats.mosfetRstSel);
    rst.position.set(-3.6, 0, 2.8);
    const sel = buildMosfet(3.2, 2.4, mats.mosfetRstSel);
    sel.position.set(0.0, 0, 2.8);
    const dcg = buildMosfet(3.2, 2.4, mats.polySiVtg);
    dcg.position.set(3.6, 0, 2.8);

    g.add(amp1, amp2, rst, sel, dcg);
    register('micro_amp_transistors', g, [0, -3.75, 0]);
  }

  // =========================================================================
  // M12. BEOL MULTI-LAYER DAMASCENE COPPER INTERCONNECT STACK (M1 - M5)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -3.72, 0);

    // Translucent low-k Inter-Layer Dielectric (ILD) bounding block
    const ild = new THREE.Mesh(
      new THREE.BoxGeometry(S - 0.1, 1.48, S - 0.1),
      mats.sicnDielectric
    );
    g.add(ild);

    // 5 orthogonal damascene copper metal layers (M1..M5) + vertical via arrays
    const layerY = [0.56, 0.28, 0.0, -0.28, -0.56];
    for (let l = 0; l < 5; l++) {
      const horizontal = (l % 2 === 0);
      const count = 6;
      const trackW = 0.24 + (l * 0.03);
      const trackH = 0.14;
      for (let i = 0; i < count; i++) {
        const offset = -5.0 + (i / (count - 1)) * 10.0;
        const geo = horizontal
          ? new THREE.BoxGeometry(S - 0.6, trackH, trackW)
          : new THREE.BoxGeometry(trackW, trackH, S - 0.6);
        const trace = new THREE.Mesh(geo, mats.beolCopper);
        trace.position.set(horizontal ? 0 : offset, layerY[l], horizontal ? offset : 0);
        g.add(trace);
      }

      // Vertical Cu vias between layer l and l+1
      if (l < 4) {
        const vGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 8);
        for (let a = -4; a <= 4; a += 2) {
          for (let b = -4; b <= 4; b += 4) {
            if (((a + b + l) % 4) !== 0) continue;
            const via = new THREE.Mesh(vGeo, mats.viaTungsten);
            via.position.set(a, (layerY[l] + layerY[l + 1]) / 2, b);
            g.add(via);
          }
        }
      }
    }

    register('micro_beol_copper', g, [0, -5.35, 0]);
  }

  // =========================================================================
  // M13. SUB-MICRON Cu-Cu HYBRID BONDING INTERFACE (16 Fused Cu Pad Pairs + SiCN)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -4.84, 0);

    // Upper & Lower SiCN direct-bond dielectric wafers meeting at y=0
    const sicnUp = new THREE.Mesh(new THREE.BoxGeometry(S, 0.34, S), mats.sicnDielectric);
    sicnUp.position.y = 0.18;
    const sicnDn = new THREE.Mesh(new THREE.BoxGeometry(S, 0.34, S), mats.sicnDielectric);
    sicnDn.position.y = -0.18;
    g.add(sicnUp, sicnDn);

    // 4×4 = 16 precision fused Cu-Cu direct hybrid-bonding pads (upper + lower fused pair)
    const padUpGeo = new THREE.BoxGeometry(1.45, 0.34, 1.45);
    const padDnGeo = new THREE.BoxGeometry(1.52, 0.34, 1.52);
    const seamGeo = new THREE.BoxGeometry(1.58, 0.04, 1.58);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const px = -4.5 + c * 3.0;
        const pz = -4.5 + r * 3.0;

        const up = new THREE.Mesh(padUpGeo, mats.copperPad);
        up.position.set(px, 0.18, pz);
        const dn = new THREE.Mesh(padDnGeo, mats.beolCopper);
        dn.position.set(px, -0.18, pz);
        const seam = new THREE.Mesh(seamGeo, mats.goldBond);
        seam.position.set(px, 0.0, pz);

        g.add(up, dn, seam);
      }
    }

    register('micro_cucu_pads', g, [0, -6.95, 0]);
  }

  // =========================================================================
  // M14. BOTTOM 22nm LOGIC WAFER (FinFET Transistor Array + Column ADC Cells)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -5.88, 0);

    // Bottom logic bulk silicon substrate
    const bulkSi = new THREE.Mesh(
      new THREE.BoxGeometry(S, 1.1, S),
      mats.finfetLogicBase
    );
    bulkSi.position.y = -0.32;
    g.add(bulkSi);

    // 3D FinFET silicon fins running along X + orthogonal high-k metal gates along Z
    const finGeo = new THREE.BoxGeometry(S - 1.2, 0.38, 0.14);
    for (let i = 0; i < 12; i++) {
      const fz = -5.2 + (i / 11) * 10.4;
      const fin = new THREE.Mesh(finGeo, mats.siliconPhotodiode);
      fin.position.set(0, 0.38, fz);
      g.add(fin);
    }

    const gateGeo = new THREE.BoxGeometry(0.32, 0.44, S - 1.0);
    for (let i = 0; i < 8; i++) {
      const gx = -4.9 + (i / 7) * 9.8;
      const gate = new THREE.Mesh(gateGeo, mats.mosfetRstSel);
      gate.position.set(gx, 0.42, 0);
      g.add(gate);
    }

    // Top local M0 logic interconnects linking FinFETs upward toward Cu-Cu pads
    const m0Geo = new THREE.BoxGeometry(1.1, 0.12, 1.1);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cap = new THREE.Mesh(m0Geo, mats.beolCopper);
        cap.position.set(-4.5 + c * 3.0, 0.68, -4.5 + r * 3.0);
        g.add(cap);
      }
    }

    register('micro_bottom_finfet', g, [0, -8.7, 0]);
  }

  return {
    root,
    parts,
    gridY: -7.2,
    defaultCameraPos: new THREE.Vector3(23, 14, 25),
    defaultTarget: new THREE.Vector3(3.2, -0.3, 0),
    clipBounds: { x: 7.0, y: 8.0, z: 7.0 }
  };
}
