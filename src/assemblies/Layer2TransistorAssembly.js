import * as THREE from 'three';

/**
 * Helper to create a 3D tri-gate wrap-around arch wrapping over N parallel fins.
 * Cross section in YZ plane (extruded along X for gate length Lg).
 */
function createTriGateOverFins(finZPositions, finW, finH, gateL, shellThick, mat) {
  const g = new THREE.Group();
  const minZ = Math.min(...finZPositions) - finW / 2 - 0.55;
  const maxZ = Math.max(...finZPositions) + finW / 2 + 0.55;
  const totalSpanZ = maxZ - minZ;
  const centerZ = (minZ + maxZ) / 2;

  // Top continuous gate cap bridging all parallel fins
  const topCap = new THREE.Mesh(
    new THREE.BoxGeometry(gateL, shellThick, totalSpanZ),
    mat
  );
  topCap.position.set(0, finH + shellThick / 2, centerZ);
  g.add(topCap);

  // Side fill fingers dropping between and outside every fin down to BOX surface
  const edges = [];
  edges.push([minZ, finZPositions[0] - finW / 2]);
  for (let i = 0; i < finZPositions.length - 1; i++) {
    edges.push([finZPositions[i] + finW / 2, finZPositions[i + 1] - finW / 2]);
  }
  edges.push([finZPositions[finZPositions.length - 1] + finW / 2, maxZ]);

  for (const [z0, z1] of edges) {
    const w = z1 - z0;
    if (w <= 0.02) continue;
    const finger = new THREE.Mesh(
      new THREE.BoxGeometry(gateL, finH, w),
      mat
    );
    finger.position.set(0, finH / 2, (z0 + z1) / 2);
    g.add(finger);
  }
  return g;
}

/**
 * Helper to create an Ω-shaped conformal thermal SiO2 gate dielectric shell around each fin
 */
function createConformalGateOxide(finZPositions, finW, finH, gateL, oxT, mat) {
  const g = new THREE.Group();
  for (const fz of finZPositions) {
    // Top oxide cap
    const topOx = new THREE.Mesh(
      new THREE.BoxGeometry(gateL + oxT * 1.4, oxT, finW + oxT * 2),
      mat
    );
    topOx.position.set(0, finH + oxT / 2, fz);
    // Left & right vertical sidewall oxide liners
    const sideL = new THREE.Mesh(
      new THREE.BoxGeometry(gateL + oxT * 1.4, finH, oxT),
      mat
    );
    sideL.position.set(0, finH / 2, fz - finW / 2 - oxT / 2);
    const sideR = new THREE.Mesh(
      new THREE.BoxGeometry(gateL + oxT * 1.4, finH, oxT),
      mat
    );
    sideR.position.set(0, finH / 2, fz + finW / 2 + oxT / 2);
    g.add(topOx, sideL, sideR);
  }
  return g;
}

/**
 * Helper to create a raised diamond/hexagonal epitaxial S/D crystal block bridging parallel fins
 */
function createRaisedEpiSD(xPos, zPositions, lenX, finH, mat) {
  const minZ = Math.min(...zPositions) - 0.42;
  const maxZ = Math.max(...zPositions) + 0.42;
  const spanZ = maxZ - minZ;
  const cz = (minZ + maxZ) / 2;

  const shape = new THREE.Shape();
  const hw = lenX / 2;
  const h = finH * 1.18;
  shape.moveTo(-hw * 0.85, 0);
  shape.lineTo(hw * 0.85, 0);
  shape.lineTo(hw, h * 0.55);
  shape.lineTo(hw * 0.75, h);
  shape.lineTo(-hw * 0.75, h);
  shape.lineTo(-hw, h * 0.55);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: spanZ,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2
  });
  geo.translate(xPos, 0, minZ);
  return new THREE.Mesh(geo, mat);
}

/**
 * Helper to build a complete compact 2-Fin SOI Pixel FinFET (used for RST, SEL, FDG, LOFIC_SG)
 */
function buildCompactSoiFinFet(cx, cz, finLen, gateL, gateMat, mats, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;

  const finZs = [-0.55, 0.55];
  const finW = 0.34;
  const finH = 0.96;

  // 2 Silicon fins
  for (const fz of finZs) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(finLen, finH, finW), mats.l2FinChannel);
    fin.position.set(0, finH / 2, fz);
    g.add(fin);
  }
  // Conformal gate oxide
  g.add(createConformalGateOxide(finZs, finW, finH, gateL, 0.07, mats.l2GateOxide));
  // Tri-gate wrap electrode
  g.add(createTriGateOverFins(finZs, finW + 0.14, finH + 0.07, gateL, 0.44, gateMat));
  // Dual SiN sidewall spacers
  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, finH + 0.42, 2.3),
      mats.l2SpacerSiN
    );
    sp.position.set(sx * (gateL / 2 + 0.09), (finH + 0.42) / 2, 0);
    g.add(sp);
  }
  // Raised Epi S/D & NiSi salicide caps on both ends
  const sdOffset = finLen / 2 - 0.52;
  for (const sx of [-1, 1]) {
    g.add(createRaisedEpiSD(sx * sdOffset, finZs, 0.92, finH, mats.l2RaisedEpiSD));
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 1.84), mats.l2NiSiSalicide);
    cap.position.set(sx * sdOffset, finH * 1.2 + 0.06, 0);
    g.add(cap);
  }
  // Gate top NiSi salicide cap
  const gCap = new THREE.Mesh(new THREE.BoxGeometry(gateL * 0.92, 0.10, 2.2), mats.l2NiSiSalicide);
  gCap.position.set(0, finH + 0.56, 0);
  g.add(gCap);

  return g;
}

/**
 * Helper to build a single Ti/TiN-lined CVD Tungsten Contact Plug
 */
function createTungstenPlug(x, yBot, yTop, radius, mats) {
  const h = yTop - yBot;
  const g = new THREE.Group();
  g.position.set(x, yBot + h / 2, 0);
  // Outer TiN barrier liner sleeve
  const liner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.22, radius * 1.15, h, 14),
    mats.l2TinLiner
  );
  // Inner CVD Tungsten core
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.85, radius * 0.82, h + 0.04, 14),
    mats.viaTungsten
  );
  g.add(liner, core);
  return g;
}

/**
 * Builds the ULTRA-PRECISION Layer-2 ONLY Nanoscale 3D CAD Assembly
 * (26 Independent Dissectable Semiconductor Components — 1 unit = 100 nm)
 *
 * Orientation: Standard semiconductor process / TEM cross-section posture
 *  - Bottom (-Y): Layer 1/2 Interface (BSC Sidewall, 3D Sequential BOX, Intermediate Poly-Si, Deep Contacts)
 *  - Middle (Y=0): Body-less SOI Si Film, Full-Depth STI, Fully Dissected 3-Fin AMP SOI FinFET,
 *                  RST/SEL/FDG/LOFIC FinFETs, Stage-1 Trench MOS & Stage-2 3D ZAZ MIM Capacitors
 *  - Top (+Y): TiN/W Local Plugs, M0 Ultra-Low-C FD + Active Miller Guard, M1 Row Bus,
 *              M2 Shielded VSL/VDD/VSS Rails, Porous Low-k SiCOH ILD & Top Exit Vias
 */
export function buildLayer2TransistorAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const S = 16.0; // 1.6 μm × 1.6 μm 2×2 shared Layer-2 unit cell

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

  // Shared key coordinates across components for 100% circuit-accurate physical alignment
  const AMP_X = -3.2;
  const AMP_FIN_ZS = [-4.9, -3.5, -2.1]; // 3 parallel SOI fins
  const AMP_FIN_W = 0.42;
  const AMP_FIN_H = 1.18;
  const AMP_FIN_LEN = 6.2;
  const AMP_GATE_L = 1.95;

  const FD_VIA_X = -3.2;
  const FD_VIA_Z = 0.35;

  // =========================================================================
  // 01. BURIED SUBLOCAL SIDEWALL CONNECTION (BSC — Sony IISW 2023)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -3.15, 0);

    // 4-way buried conductive arms making ohmic contact to the 4 Layer-1 FD Si sidewalls
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.38, 20), mats.goldBond);
    hub.position.set(FD_VIA_X, 0, FD_VIA_Z);
    g.add(hub);

    const bscBranches = [
      { to: [-5.6, -2.0] },
      { to: [-0.8, -2.0] },
      { to: [-5.6,  2.7] },
      { to: [-0.8,  2.7] }
    ];
    for (const br of bscBranches) {
      const p0 = new THREE.Vector3(FD_VIA_X, 0, FD_VIA_Z);
      const p1 = new THREE.Vector3(br.to[0], 0, br.to[1]);
      const dir = p1.clone().sub(p0);
      const len = dir.length();
      const mid = p0.clone().add(p1).multiplyScalar(0.5);

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(len, 0.24, 0.34), mats.goldBond);
      bridge.position.copy(mid);
      bridge.rotation.y = -Math.atan2(dir.z, dir.x);
      g.add(bridge);

      // Vertical sidewall ohmic contact tab descending slightly into Layer-1 FD sidewall
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 0.46), mats.copperPad);
      tab.position.set(br.to[0], -0.22, br.to[1]);
      g.add(tab);
    }

    register('l2_bsc_sidewall', g, [0, -7.8, 0]);
  }

  // =========================================================================
  // 02. LOW-TEMP FUSION BONDING SiO2 BURIED OXIDE (3D Sequential BOX Layer)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.65, 0);

    // Lower Tier-1 capping TEOS SiO2 + Upper Tier-2 bonded BOX oxide meeting at fusion seam
    const lowerOx = new THREE.Mesh(new THREE.BoxGeometry(S, 1.32, S), mats.l2BoxOxide);
    lowerOx.position.y = -0.68;
    const upperBox = new THREE.Mesh(new THREE.BoxGeometry(S, 1.24, S), mats.l2BoxOxide);
    upperBox.position.y = 0.68;
    g.add(lowerOx, upperBox);

    // Crisp wafer-to-wafer fusion-bonding seam perimeter rails (hollow frame, non-occluding)
    const seamMat = mats.l2InterPolySi;
    const seamT = 0.08;
    const fFront = new THREE.Mesh(new THREE.BoxGeometry(S + 0.06, seamT, seamT), seamMat);
    fFront.position.set(0, 0, S / 2);
    const fBack = new THREE.Mesh(new THREE.BoxGeometry(S + 0.06, seamT, seamT), seamMat);
    fBack.position.set(0, 0, -S / 2);
    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(seamT, seamT, S + 0.06), seamMat);
    fLeft.position.set(-S / 2, 0, 0);
    const fRight = new THREE.Mesh(new THREE.BoxGeometry(seamT, seamT, S + 0.06), seamMat);
    fRight.position.set(S / 2, 0, 0);
    g.add(fFront, fBack, fLeft, fRight);

    register('l2_bonding_box', g, [0, -6.3, 0]);
  }

  // =========================================================================
  // 03. INTERMEDIATE POLY-SI WIRING LAYER (Sony IEDM 2024)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -2.05, 0);

    // Embedded heat-resistant N+ Poly-Si intermediate horizontal routing tracks inside BOX
    const tracks = [
      { x: 0.0, z: -5.2, w: 12.6, d: 0.42 },
      { x: 0.0, z:  5.4, w: 12.6, d: 0.42 },
      { x: 2.2, z: -0.6, w: 7.4,  d: 0.44 },
      { x: 5.2, z: -3.2, w: 0.42, d: 5.4  },
      { x: 1.4, z:  2.4, w: 0.42, d: 6.2  },
      { x: -6.2, z: 0.2, w: 0.42, d: 10.8 }
    ];
    for (const tr of tracks) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(tr.w, 0.30, tr.d), mats.l2InterPolySi);
      m.position.set(tr.x, 0, tr.z);
      g.add(m);
    }

    // Small intermediate landing pads linking vertical vias
    const padGeo = new THREE.BoxGeometry(0.80, 0.34, 0.80);
    for (const [px, pz] of [[-6.2, -5.2], [6.2, -5.2], [-6.2, 5.4], [6.2, 5.4], [1.4, -0.6], [5.2, -0.6]]) {
      const p = new THREE.Mesh(padGeo, mats.l2InterPolySi);
      p.position.set(px, 0, pz);
      g.add(p);
    }

    register('l2_inter_polysi', g, [0, -5.2, 0]);
  }

  // =========================================================================
  // 04. VERTICAL FD DEEP CONTACT + COAXIAL MILLER-EFFECT SHIELD RING
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(FD_VIA_X, -0.35, FD_VIA_Z);

    // Ultra-fine TiN/W deep vertical FD pillar ascending from BSC (y=-3.15) to M0 (y=+2.5)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 5.7, 20), mats.viaTungsten);
    const tinBarrier = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 5.65, 20), mats.l2TinLiner);
    g.add(tinBarrier, core);

    // Coaxial Miller-effect active bootstrap shield cylinder around the BOX transit zone
    // Cutaway 225-degree arc facing +X/+Z camera so the inner W pillar stays vividly visible!
    const shieldArc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 2.55, 24, 1, true, Math.PI * 0.55, Math.PI * 1.25),
      mats.l2MillerShield
    );
    shieldArc.position.y = -1.2;
    const shieldRingTop = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.06, 10, 24, Math.PI * 1.25),
      mats.l2MillerShield
    );
    shieldRingTop.rotation.x = Math.PI / 2;
    shieldRingTop.rotation.z = -Math.PI * 0.55;
    shieldRingTop.position.y = 0.07;
    g.add(shieldArc, shieldRingTop);

    register('l2_fd_deep_contact', g, [0, -4.0, 0]);
  }

  // =========================================================================
  // 05. 4-PIXEL TRANSFER GATE DEEP CONTACTS (Through-Oxide TG Vias × 4)
  // =========================================================================
  {
    const g = new THREE.Group();
    const tgCoords = [
      [-6.8, -6.8],
      [ 6.8, -6.8],
      [-6.8,  6.8],
      [ 6.8,  6.8]
    ];
    for (const [tx, tz] of tgCoords) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 6.7, 16), mats.polySiVtg);
      col.position.set(tx, 0.15, tz);
      // Thick SiO2 isolation collar preventing +2.8V pulse coupling into Layer-2 Si
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 2.8, 16, 1, true),
        mats.lowNGrid
      );
      collar.position.set(tx, -1.5, tz);
      // Top M1 landing pad
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.68), mats.beolCopper);
      cap.position.set(tx, 3.5, tz);
      g.add(col, collar, cap);
    }

    register('l2_tg_deep_contacts', g, [0, -3.2, 0]);
  }

  // =========================================================================
  // 06. LAYER-1 P-WELL SUBSTRATE REFERENCE VSS DEEP VIAS (×2)
  // =========================================================================
  {
    const g = new THREE.Group();
    for (const [gx, gz] of [[-7.2, 0.5], [7.2, -0.5]]) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 7.6, 16), mats.siliconBulkSide);
      v.position.set(gx, 0.6, gz);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.24, 16), mats.l2NiSiSalicide);
      foot.position.set(gx, -3.15, gz);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.72), mats.copperPad);
      head.position.set(gx, 4.42, gz);
      g.add(v, foot, head);
    }

    register('l2_pwell_gnd_via', g, [0, -2.5, 0]);
  }

  // =========================================================================
  // 07. BODY-LESS ULTRA-THIN SOI SINGLE-CRYSTAL SILICON ACTIVE ISLANDS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.18, 0);

    // Distinct isolated SOI mesa active pads resting directly on the BOX oxide (body-less!)
    const islands = [
      { x: AMP_X, z: -3.5, w: 6.6, d: 4.1 }, // AMP 3-fin island
      { x: -4.4,  z:  4.2, w: 4.1, d: 2.3 }, // SEL island
      { x: -0.6,  z:  4.2, w: 3.1, d: 2.3 }, // RST island
      { x:  2.7,  z:  0.8, w: 2.9, d: 2.2 }, // FDG/DCG island
      { x:  5.4,  z:  0.8, w: 2.3, d: 2.2 }, // LOFIC SG island
      { x:  4.1,  z:  4.4, w: 4.6, d: 2.8 }  // Stage-1 Trench MOS Cap island
    ];
    for (const isl of islands) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(isl.w, 0.34, isl.d), mats.l2SoiSilicon);
      mesh.position.set(isl.x, 0, isl.z);
      g.add(mesh);
    }

    register('l2_soi_silicon_body', g, [0, -2.2, 0]);
  }

  // =========================================================================
  // 08. FULL-DEPTH STI SHALLOW TRENCH ISOLATION OXIDE MATRIX
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.18, 0);

    // Cutaway STI isolation corridors separating every SOI active island down to BOX
    const bars = [
      // Outer perimeter rear + cutaway front sills
      { x: 0,    z: -7.55, w: S,   d: 0.9 },
      { x: -7.55, z: 0,    w: 0.9, d: S   },
      { x: 0,    z:  7.65, w: S,   d: 0.6 },
      { x:  7.65, z: 0,    w: 0.6, d: S   },
      // Internal device-to-device STI isolation trenches
      { x: 0.65, z: -0.2,  w: 0.85, d: 14.2 },
      { x: -3.2, z:  1.45, w: 7.4,  d: 1.9  },
      { x:  4.1, z:  2.45, w: 6.4,  d: 0.85 },
      { x: -2.25, z: 4.2,  w: 0.55, d: 2.6  },
      { x:  4.15, z: 0.8,  w: 0.45, d: 2.4  }
    ];
    for (const b of bars) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.38, b.d), mats.l2StiOxide);
      m.position.set(b.x, 0, b.z);
      g.add(m);
    }

    register('l2_sti_isolation', g, [0, -1.5, 0]);
  }

  // =========================================================================
  // 09. AMP SOURCE-FOLLOWER 3-FIN SOI PIXEL FINFET CHANNELS (×3 Parallel Fins)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    for (const fz of AMP_FIN_ZS) {
      // Main single-crystal Si fin body with subtle buried-channel core accent
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(AMP_FIN_LEN, AMP_FIN_H, AMP_FIN_W),
        mats.l2FinChannel
      );
      fin.position.set(0, AMP_FIN_H / 2, fz);
      g.add(fin);

      // Subtle atomic-flat (100) top terrace highlight & buried channel conductivity core
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(AMP_GATE_L * 1.15, AMP_FIN_H * 0.48, AMP_FIN_W * 0.52),
        mats.microPdDepletion
      );
      core.position.set(0, AMP_FIN_H * 0.55, fz);
      g.add(core);
    }

    register('l2_amp_si_fins', g, [0, -0.55, 0]);
  }

  // =========================================================================
  // 10. AMP ATOMICALLY FLAT THERMAL SiO2/SiON GATE OXIDE (Conformal Ω-Shell)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    const oxShell = createConformalGateOxide(
      AMP_FIN_ZS,
      AMP_FIN_W,
      AMP_FIN_H,
      AMP_GATE_L,
      0.09,
      mats.l2GateOxide
    );
    g.add(oxShell);

    register('l2_amp_gate_oxide', g, [0, 0.55, 0]);
  }

  // =========================================================================
  // 11. AMP 3D TRI-GATE ELECTRODE STACK (TiN Work-Function Liner + Poly-Si/W Gate)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    // Inner TiN work-function control metal liner wrapping 3 fins
    const tinShell = createTriGateOverFins(
      AMP_FIN_ZS,
      AMP_FIN_W + 0.18,
      AMP_FIN_H + 0.09,
      AMP_GATE_L,
      0.16,
      mats.l2TinLiner
    );
    g.add(tinShell);

    // Main low-resistance Tri-Gate body bridging all 3 fins
    const gateBody = createTriGateOverFins(
      AMP_FIN_ZS,
      AMP_FIN_W + 0.24,
      AMP_FIN_H + 0.24,
      AMP_GATE_L - 0.12,
      0.56,
      mats.mosfetAmp
    );
    g.add(gateBody);

    // Gate extension landing pad projecting toward the vertical FD deep contact (+Z)
    const gatePad = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 1.35), mats.mosfetAmp);
    gatePad.position.set(0, 1.48, -0.95);
    g.add(gatePad);

    register('l2_amp_trigate', g, [0, 1.75, 0]);
  }

  // =========================================================================
  // 12. DUAL SIDEWALL SPACERS (SiO2 Offset + SiN Low-k Gate Spacers)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    const spanZ = 4.25;
    const cz = -3.5;
    const spH = AMP_FIN_H + 0.72;

    for (const sx of [-1, 1]) {
      // Inner thin SiO2 offset liner
      const offOx = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, spH, spanZ),
        mats.fullDtiOxide
      );
      offOx.position.set(sx * (AMP_GATE_L / 2 + 0.05), spH / 2, cz);

      // Outer contoured SiN sidewall spacer
      const sinSp = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, spH * 0.92, spanZ),
        mats.l2SpacerSiN
      );
      sinSp.position.set(sx * (AMP_GATE_L / 2 + 0.24), (spH * 0.92) / 2, cz);

      g.add(offOx, sinSp);
    }

    register('l2_amp_spacers', g, [0, 2.55, 0]);
  }

  // =========================================================================
  // 13. LDD EXTENSIONS & RAISED EPITAXIAL N+ SOURCE / DRAIN CRYSTALS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    // LDD lightly doped drain/source extensions tucked beneath the spacers on each fin
    for (const fz of AMP_FIN_ZS) {
      for (const sx of [-1, 1]) {
        const ldd = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, AMP_FIN_H * 0.72, AMP_FIN_W + 0.06),
          mats.l2InterPolySi
        );
        ldd.position.set(sx * (AMP_GATE_L / 2 + 0.24), AMP_FIN_H * 0.62, fz);
        g.add(ldd);
      }
    }

    // Raised epitaxial merged N+ Source (right, +X) & Drain (left, -X) diamond crystals
    const drainEpi = createRaisedEpiSD(-2.22, AMP_FIN_ZS, 1.56, AMP_FIN_H, mats.l2RaisedEpiSD);
    const sourceEpi = createRaisedEpiSD( 2.22, AMP_FIN_ZS, 1.56, AMP_FIN_H, mats.l2RaisedEpiSD);
    g.add(drainEpi, sourceEpi);

    register('l2_amp_ldd_sd', g, [0, 0.95, 0]);
  }

  // =========================================================================
  // 14. NICKEL SILICIDE LOW-RESISTANCE OHMIC CAPS (NiSi / NiPtSi Salicide)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, 0);

    // Salicide caps over AMP Drain, Source, and Tri-Gate top
    const dCap = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.14, 3.65), mats.l2NiSiSalicide);
    dCap.position.set(-2.22, AMP_FIN_H * 1.18 + 0.07, -3.5);
    const sCap = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.14, 3.65), mats.l2NiSiSalicide);
    sCap.position.set( 2.22, AMP_FIN_H * 1.18 + 0.07, -3.5);
    const gCap = new THREE.Mesh(new THREE.BoxGeometry(AMP_GATE_L - 0.18, 0.14, 4.15), mats.l2NiSiSalicide);
    gCap.position.set(0, AMP_FIN_H + 0.86, -3.5);
    const gPadCap = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.14, 1.2), mats.l2NiSiSalicide);
    gPadCap.position.set(0, 1.85, -0.95);
    g.add(dCap, sCap, gCap, gPadCap);

    register('l2_nisi_silicide', g, [0, 3.25, 0]);
  }

  // =========================================================================
  // 15. TENSILE-STRESSED SiNx CONTACT ETCH STOP LAYER (+1.2 GPa CESL)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(AMP_X, 0, -3.5);

    // Conformal translucent tensile SiNx stress blanket draping over the AMP FinFET
    const crown = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.14, 4.45), mats.l2CeslStress);
    crown.position.y = AMP_FIN_H + 1.06;
    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 4.45), mats.l2CeslStress);
    skirtL.position.set(-2.25, AMP_FIN_H * 1.18 + 0.24, 0);
    const skirtR = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.14, 4.45), mats.l2CeslStress);
    skirtR.position.set( 2.25, AMP_FIN_H * 1.18 + 0.24, 0);
    const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 4.45), mats.l2CeslStress);
    stepL.position.set(-1.32, AMP_FIN_H + 0.72, 0);
    const stepR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 4.45), mats.l2CeslStress);
    stepR.position.set( 1.32, AMP_FIN_H + 0.72, 0);
    g.add(crown, skirtL, skirtR, stepL, stepR);

    register('l2_cesl_stress', g, [0, 3.3, 0]);
  }

  // =========================================================================
  // 16. RESET SOI FINFET (RST — Long-Channel Ultra-Low-Leakage)
  // =========================================================================
  {
    const g = buildCompactSoiFinFet(-0.6, 4.2, 3.0, 1.05, mats.mosfetRstSel, mats, 0);
    register('l2_rst_transistor', g, [0, 1.15, 1.8]);
  }

  // =========================================================================
  // 17. ROW SELECT SOI FINFET (SEL — Low-Ron Output Switch)
  // =========================================================================
  {
    const g = buildCompactSoiFinFet(-4.4, 4.2, 3.6, 0.85, mats.siliconPhotodiode, mats, 0);
    register('l2_sel_transistor', g, [-1.8, 1.15, 1.8]);
  }

  // =========================================================================
  // 18. DUAL CONVERSION GAIN SWITCH (FDG / DCG Switching SOI FinFET)
  // =========================================================================
  {
    const g = buildCompactSoiFinFet(2.7, 0.8, 2.7, 0.78, mats.l2FdgGate, mats, 0);
    register('l2_fdg_dcg_switch', g, [1.5, 1.15, 0.5]);
  }

  // =========================================================================
  // 19. 2-STAGE LOFIC OVERFLOW PARTITIONING GATE (SG-FET)
  // =========================================================================
  {
    const g = buildCompactSoiFinFet(5.4, 0.8, 2.2, 0.72, mats.l2LoficGate, mats, 0);
    register('l2_lofic_overflow_gate', g, [2.6, 1.15, 0.5]);
  }

  // =========================================================================
  // 20. STAGE-1 LOFIC HIGH-DENSITY TRENCH MOS CAPACITOR (~15 fF)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(4.1, 0, 4.4);

    // 4 deep parallel trench MOS ribs etched into the SOI silicon island
    for (let i = 0; i < 4; i++) {
      const tx = -1.5 + i * 1.0;
      const trenchOx = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.25, 2.35), mats.l2GateOxide);
      trenchOx.position.set(tx, 0.42, 0);
      const polyCore = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.38, 2.15), mats.fdLoficNode);
      polyCore.position.set(tx, 0.48, 0);
      g.add(trenchOx, polyCore);
    }
    // Cutaway N+ Poly-Si top electrode bridge (recessed along -Z so front trench cross-sections shine!)
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.22, 1.48), mats.fdLoficNode);
    topPlate.position.set(0, 1.24, -0.46);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.10, 1.32), mats.l2NiSiSalicide);
    cap.position.set(0, 1.40, -0.46);
    g.add(topPlate, cap);

    register('l2_lofic_stage1_mos', g, [2.1, 1.75, 2.1]);
  }

  // =========================================================================
  // 21. STAGE-2 LOFIC 3D HIGH-K ZAZ MIM CAPACITOR (~80 fF — DRAM-Style 3×3 Cylinders!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(4.1, 0, -4.0);

    // Bottom TiN common electrode base plate
    const botPlate = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 4.6), mats.l2TinLiner);
    botPlate.position.y = 0.14;
    g.add(botPlate);

    // 3×3 = 9 high-aspect 3D cylindrical TiN electrodes wrapped in ZrO2/Al2O3/ZrO2 High-k dielectric!
    // Front/right outer cups use a 215° cutaway arc to reveal the concentric TiN -> ZAZ High-k -> Outer Cup stack
    const innerCylGeo = new THREE.CylinderGeometry(0.34, 0.34, 2.18, 20);
    const zazCylGeo = new THREE.CylinderGeometry(0.49, 0.49, 2.04, 20);
    const fullOuterCupGeo = new THREE.CylinderGeometry(0.58, 0.58, 1.84, 20, 1, true);
    const cutOuterCupGeo = new THREE.CylinderGeometry(0.58, 0.58, 1.84, 20, 1, true, Math.PI * 0.55, Math.PI * 1.18);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cx = -1.45 + c * 1.45;
        const cz = -1.40 + r * 1.40;
        const isCutaway = r === 2 || c === 2;
        const inner = new THREE.Mesh(innerCylGeo, mats.l2TinLiner);
        inner.position.set(cx, 1.26, cz);
        const zaz = new THREE.Mesh(zazCylGeo, mats.l2LoficZazDielectric);
        zaz.position.set(cx, 1.22, cz);
        const outer = new THREE.Mesh(isCutaway ? cutOuterCupGeo : fullOuterCupGeo, mats.copperPad);
        outer.position.set(cx, 1.28, cz);
        g.add(inner, zaz, outer);
      }
    }

    // L-shaped cutaway upper TiN/Cu counter-electrode plate exposing front-right concentric ZAZ crowns!
    const topRear = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.20, 2.95), mats.copperPad);
    topRear.position.set(0, 2.40, -0.78);
    const topLeft = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.20, 1.65), mats.copperPad);
    topLeft.position.set(-0.88, 2.40, 1.42);
    g.add(topRear, topLeft);

    register('l2_lofic_stage2_mim', g, [2.4, 2.35, -2.1]);
  }

  // =========================================================================
  // 22. Ti/TiN-BARRIER CVD TUNGSTEN NANO CONTACT PLUGS (×24 Precision Plugs)
  // =========================================================================
  {
    const g = new THREE.Group();
    const plugSpecs = [
      // AMP Drain (3 parallel low-resistance plugs) -> VDD
      { x: AMP_X - 2.22, z: -4.6, y0: 1.45, y1: 4.35 },
      { x: AMP_X - 2.22, z: -3.5, y0: 1.45, y1: 4.35 },
      { x: AMP_X - 2.22, z: -2.4, y0: 1.45, y1: 4.35 },
      // AMP Source (3 parallel plugs) -> SEL Drain bridge
      { x: AMP_X + 2.22, z: -4.6, y0: 1.45, y1: 2.55 },
      { x: AMP_X + 2.22, z: -3.5, y0: 1.45, y1: 2.55 },
      { x: AMP_X + 2.22, z: -2.4, y0: 1.45, y1: 2.55 },
      // AMP Gate pad -> M0 FD route
      { x: AMP_X, z: -0.95, y0: 1.85, y1: 2.58 },
      // SEL Drain, Gate, Source plugs
      { x: -5.65, z: 4.2, y0: 1.2, y1: 4.35 }, // SEL Source -> M2 VSL
      { x: -4.4,  z: 4.2, y0: 1.5, y1: 3.45 }, // SEL Gate -> M1 SEL bus
      { x: -3.15, z: 4.2, y0: 1.2, y1: 2.55 }, // SEL Drain <- AMP Source
      // RST Source (FD), Gate, Drain (VDD)
      { x: -1.55, z: 4.2, y0: 1.2, y1: 2.58 }, // RST Source -> M0 FD
      { x: -0.6,  z: 4.2, y0: 1.5, y1: 3.45 }, // RST Gate -> M1 RST bus
      { x:  0.35, z: 4.2, y0: 1.2, y1: 4.35 }, // RST Drain -> M2 VDD
      // FDG/DCG Switch
      { x: 1.85, z: 0.8, y0: 1.2, y1: 2.58 }, // FDG Drain -> M0 FD
      { x: 2.7,  z: 0.8, y0: 1.5, y1: 3.45 }, // FDG Gate -> M1 FDG bus
      { x: 3.55, z: 0.8, y0: 1.2, y1: 2.58 }, // FDG Source -> Stage-1 MOS Cap
      // LOFIC Overflow Gate
      { x: 4.8,  z: 0.8, y0: 1.2, y1: 2.58 },
      { x: 5.4,  z: 0.8, y0: 1.5, y1: 3.45 },
      { x: 6.0,  z: 0.8, y0: 1.2, y1: 2.58 }, // -> Stage-2 MIM Cap
      // Stage-1 Trench MOS Cap contacts
      { x: 3.55, z: 3.9, y0: 1.4, y1: 2.58 },
      { x: 4.8,  z: 3.9, y0: 1.4, y1: 2.58 },
      // Stage-2 3D MIM Cap top electrode contacts
      { x: 4.1,  z: -2.4, y0: 2.45, y1: 3.45 },
      { x: 5.4,  z: -4.0, y0: 2.45, y1: 4.35 } // Counter-plate to VDD/VREF
    ];

    for (const ps of plugSpecs) {
      const plug = createTungstenPlug(ps.x, ps.y0, ps.y1, 0.14, mats);
      plug.position.z = ps.z;
      g.add(plug);
    }

    register('l2_tungsten_plugs', g, [0, 3.95, 0]);
  }

  // =========================================================================
  // 23. M0 ULTRA-LOW-C FD LOCAL ROUTE & ACTIVE MILLER GUARD TRACES
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 2.62, 0);

    // Core shortest-path ultra-fine FD route (FD Deep Via -> AMP Gate, RST Source, FDG Drain)
    const fdSegments = [
      { x: FD_VIA_X, z: -0.3,  w: 0.22, d: 1.6  }, // Deep Via -> AMP Gate pad
      { x: -0.68,    z:  0.58, w: 5.25, d: 0.22 }, // Deep Via -> FDG Drain
      { x: -1.55,    z:  2.38, w: 0.22, d: 3.8  }, // Branch -> RST Source
      // Secondary internal bridges (AMP Source -> SEL Drain, FDG -> Stage-1, SG -> Stage-2)
      { x: -0.98,    z: -3.5,  w: 0.32, d: 2.6  },
      { x: -2.06,    z:  0.35, w: 0.26, d: 7.7  }, // AMP Source -> SEL Drain route (active bootstrap!)
      { x:  3.55,    z:  2.35, w: 0.26, d: 3.3  }, // FDG -> Stage-1 MOS Cap
      { x:  4.8,     z:  2.35, w: 0.26, d: 3.3  }, // Stage-1 -> SG Gate
      { x:  5.05,    z: -0.8,  w: 2.1,  d: 0.26 }, // SG -> Stage-2 MIM Cap
      { x:  4.1,     z: -1.6,  w: 0.26, d: 1.8  }
    ];
    for (let i = 0; i < fdSegments.length; i++) {
      const s = fdSegments[i];
      const isFdCore = i < 3;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(s.w, 0.16, s.d),
        isFdCore ? mats.goldBond : mats.viaTungsten
      );
      m.position.set(s.x, 0, s.z);
      g.add(m);
    }

    // Active Miller-Effect Guard Lines flanking the main FD trace (driven by AMP Source potential!)
    for (const offset of [-0.42, 0.42]) {
      const guard = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.12), mats.l2MillerShield);
      guard.position.set(-0.55, 0, 0.58 + offset);
      g.add(guard);
    }

    register('l2_m0_fd_local', g, [0, 4.75, 0]);
  }

  // =========================================================================
  // 24. M1 HORIZONTAL ROW-CONTROL DAMASCENE COPPER BUS (TG / RST / SEL / FDG / SG)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 3.52, 0);

    // 6 horizontal damascene Cu control buses running along X across the pixel row
    const rowZs = [-6.8, -4.2, -1.6, 0.8, 4.2, 6.8];
    for (const rz of rowZs) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(S - 0.8, 0.16, 0.26), mats.beolCopper);
      bar.position.set(0, 0, rz);
      // TaN diffusion barrier bottom liner
      const liner = new THREE.Mesh(new THREE.BoxGeometry(S - 0.8, 0.04, 0.30), mats.l2TinLiner);
      liner.position.set(0, -0.09, rz);
      g.add(bar, liner);
    }

    register('l2_m1_control_bus', g, [0, 5.75, 0]);
  }

  // =========================================================================
  // 25. M2 VERTICAL SIGNAL LINE (VSL) & SHIELDED VDD/VSS ANALOG POWER RAILS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 4.46, 0);

    // Shielded sandwich array running vertically along Z:
    //  VSS(-7.2) | VSL(-5.65) | VDD(-4.1) | VDD(+0.35) | VREF(+5.4) | VSS(+7.2)
    const rails = [
      { x: -7.2,  w: 0.44, mat: mats.copperPad  }, // Analog GND (VSS) Shield
      { x: -5.65, w: 0.26, mat: mats.goldBond   }, // Vertical Signal Line (VSL Output!)
      { x: -4.1,  w: 0.44, mat: mats.beolCopper }, // AVDD 2.8V Analog Shield
      { x:  0.35, w: 0.40, mat: mats.beolCopper }, // Reset VDD Rail
      { x:  5.4,  w: 0.42, mat: mats.beolCopper }, // LOFIC VREF / Bias Rail
      { x:  7.2,  w: 0.44, mat: mats.copperPad  }  // Analog GND (VSS) Shield
    ];
    for (const r of rails) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.22, S - 0.6), r.mat);
      rail.position.set(r.x, 0, 0);
      g.add(rail);
    }

    // M2 horizontal jumper tying AMP Drain plugs (-5.42) to AVDD rail (-4.1)
    const vddTap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 2.5), mats.beolCopper);
    vddTap.position.set(-4.85, -0.02, -3.5);
    g.add(vddTap);

    register('l2_m2_vsl_power', g, [0, 6.85, 0]);
  }

  // =========================================================================
  // 26. POROUS LOW-K SiCOH ILD (Cutaway L-Frame) & TOP Cu-Cu EXIT VIAS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 2.55, 0);

    // Rear-two-walls cutaway translucent Porous SiCOH Low-k dielectric casing
    // Keeps front +X/+Z completely unobstructed for crystal-clear nanoscale inspection!
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(S, 4.9, 0.55), mats.l2LowKDielectric);
    backWall.position.set(0, 0, -7.72);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.9, S), mats.l2LowKDielectric);
    leftWall.position.set(-7.72, 0, 0);
    g.add(backWall, leftWall);

    // Top SiCN etch-stop cap rim + 6 vertical exit vias climbing toward upper BEOL / Cu-Cu bond layer
    const topRim = new THREE.Mesh(new THREE.BoxGeometry(S, 0.08, 0.6), mats.sicnDielectric);
    topRim.position.set(0, 2.48, -7.7);
    g.add(topRim);

    const exitX = [-7.2, -5.65, -4.1, 0.35, 5.4, 7.2];
    for (const ex of exitX) {
      const exitVia = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.95, 14), mats.copperPad);
      exitVia.position.set(ex, 2.52, -5.6);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.72), mats.copperPad);
      pad.position.set(ex, 3.04, -5.6);
      g.add(exitVia, pad);
    }

    register('l2_lowk_pmd_ild', g, [0, 7.85, 0]);
  }

  return {
    root,
    parts,
    gridY: -4.2,
    defaultCameraPos: new THREE.Vector3(26.5, 17.2, 26.5),
    defaultTarget: new THREE.Vector3(4.2, 0.2, -2.0),
    clipBounds: { x: 8.5, y: 6.5, z: 8.5 }
  };
}
