import * as THREE from 'three';

/**
 * Helper to create a rounded rectangle THREE.Shape centered at (0, 0)
 */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.min(r, hw, hh);
  s.moveTo(-hw + rad, -hh);
  s.lineTo(hw - rad, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  s.lineTo(hw, hh - rad);
  s.quadraticCurveTo(hw, hh, hw - rad, hh);
  s.lineTo(-hw + rad, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  s.lineTo(-hw, -hh + rad);
  s.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  return s;
}

/**
 * Helper to create a rectangular frame with an inner rectangular hole, lying in XZ plane
 */
function createRectFrameGeometry(outerW, outerD, innerW, innerD, height, outerR = 0.6, innerR = 0.25, bevel = 0.04) {
  const shape = roundedRectShape(outerW, outerD, outerR);
  const hole = new THREE.Path();
  const hw = innerW / 2;
  const hd = innerD / 2;
  const ir = Math.min(innerR, hw, hd);
  hole.moveTo(-hw + ir, -hd);
  hole.lineTo(hw - ir, -hd);
  hole.quadraticCurveTo(hw, -hd, hw, -hd + ir);
  hole.lineTo(hw, hd - ir);
  hole.quadraticCurveTo(hw, hd, hw - ir, hd);
  hole.lineTo(-hw + ir, hd);
  hole.quadraticCurveTo(-hw, hd, -hw, hd - ir);
  hole.lineTo(-hw, -hd + ir);
  hole.quadraticCurveTo(-hw, -hd, -hw + ir, -hd);
  shape.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 16
  });
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, -height / 2, 0);
  return geom;
}

/**
 * Helper to create a racetrack (stadium) hollow coil geometry in XZ plane
 */
function createRacetrackCoilGeometry(length, width, wall, height) {
  const outer = roundedRectShape(length, width, width * 0.48);
  const iw = Math.max(0.2, length - wall * 2);
  const id = Math.max(0.2, width - wall * 2);
  const hole = roundedRectShape(iw, id, id * 0.45);
  outer.holes.push(hole);

  const geom = new THREE.ExtrudeGeometry(outer, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 18
  });
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, -height / 2, 0);
  return geom;
}

/**
 * Builds the ultra-detailed 1-inch Stacked CMOS Image Sensor & 3D Sensor-Shift OIS
 * Assembly (30 independent, dissectable CAD parts; 1 unit = 1 mm).
 */
export function buildMacroSensorAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const register = (id, group, explodeVec, opts = {}) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      oisMoving: Boolean(opts.oisMoving)
    });
    return group;
  };

  // =========================================================================
  // 01. EMI SHIELD BEZEL (SUS304 Top Shield Frame + Side Skirts + GND Clips)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 3.68, 0);

    const topPlate = new THREE.Mesh(
      createRectFrameGeometry(22.4, 19.4, 14.8, 11.4, 0.16, 1.1, 0.35, 0.03),
      mats.susSteel
    );
    g.add(topPlate);

    // Inner matte black anti-reflection aperture chamfer collar
    const innerLip = new THREE.Mesh(
      createRectFrameGeometry(15.2, 11.8, 14.6, 11.2, 0.24, 0.38, 0.30, 0.02),
      mats.susDarkInner
    );
    innerLip.position.y = -0.08;
    g.add(innerLip);

    // Side shield skirts with precision cutouts (4 walls)
    const wallH = 1.45;
    const wallT = 0.16;
    const wLong = new THREE.BoxGeometry(20.6, wallH, wallT);
    const wShort = new THREE.BoxGeometry(wallT, wallH, 17.6);

    const northW = new THREE.Mesh(wLong, mats.susSteel);
    northW.position.set(0, -wallH / 2, -9.62);
    const southW = new THREE.Mesh(wLong, mats.susSteel);
    southW.position.set(0, -wallH / 2, 9.62);
    const westW = new THREE.Mesh(wShort, mats.susSteel);
    westW.position.set(-11.12, -wallH / 2, 0);
    const eastW = new THREE.Mesh(wShort, mats.susSteel);
    eastW.position.set(11.12, -wallH / 2, 0);
    g.add(northW, southW, westW, eastW);

    // 8 GND spring contact tabs around bottom rim
    const tabGeo = new THREE.BoxGeometry(1.1, 0.32, 0.28);
    const tabPositions = [
      [-6.5, -1.42, -9.65], [6.5, -1.42, -9.65],
      [-6.5, -1.42, 9.65], [6.5, -1.42, 9.65],
      [-11.15, -1.42, -5.2], [-11.15, -1.42, 5.2],
      [11.15, -1.42, -5.2], [11.15, -1.42, 5.2]
    ];
    for (let i = 0; i < tabPositions.length; i++) {
      const m = new THREE.Mesh(tabGeo, mats.susSteel);
      m.position.set(...tabPositions[i]);
      if (i >= 4) m.rotation.y = Math.PI / 2;
      g.add(m);
    }

    // Precision laser-weld dimple dots along top bezel perimeter + 4 optical datum pinholes
    const weldGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12);
    const weldPts = [
      [-9.8, -8.5], [-4.8, -8.5], [0, -8.5], [4.8, -8.5], [9.8, -8.5],
      [-9.8, 8.5], [-4.8, 8.5], [0, 8.5], [4.8, 8.5], [9.8, 8.5],
      [-9.8, -3.5], [-9.8, 3.5], [9.8, -3.5], [9.8, 3.5]
    ];
    for (const [wx, wz] of weldPts) {
      const w = new THREE.Mesh(weldGeo, mats.yokePermalloy);
      w.position.set(wx, 0.095, wz);
      g.add(w);
    }

    // 4 subtle corner embossed alignment bosses
    const bossGeo = new THREE.TorusGeometry(0.45, 0.07, 10, 20);
    bossGeo.rotateX(Math.PI / 2);
    for (const [bx, bz] of [[-9.7, -8.2], [9.7, -8.2], [-9.7, 8.2], [9.7, 8.2]]) {
      const b = new THREE.Mesh(bossGeo, mats.susSteel);
      b.position.set(bx, 0.09, bz);
      g.add(b);
    }

    register('emi_shield_bezel', g, [0, 12.6, 0]);
  }

  // =========================================================================
  // 02. IRCF DIELECTRIC COATING (54-Layer TiO2/SiO2 Dichroic Interference Film)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 3.36, 0);

    const film = new THREE.Mesh(
      new THREE.BoxGeometry(16.2, 0.045, 12.8),
      mats.ircfCoating
    );
    g.add(film);

    // Subtle thin interference edge rim
    const rim = new THREE.Mesh(
      createRectFrameGeometry(16.24, 12.84, 16.02, 12.62, 0.05, 0.08, 0.04, 0),
      mats.ircfCoating
    );
    g.add(rim);

    register('ircf_dielectric_coating', g, [0, 10.7, 0]);
  }

  // =========================================================================
  // 03. BLUE GLASS IRCF (Cu2+-doped Phosphate Absorption Glass, 0.21mm)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 3.16, 0);

    const shape = roundedRectShape(16.4, 13.0, 0.18);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 2
    });
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, -0.11, 0);

    const glass = new THREE.Mesh(geom, mats.blueGlassIrcf);
    g.add(glass);

    register('ircf_blue_glass', g, [0, 9.2, 0]);
  }

  // =========================================================================
  // 04. IRCF LCP HOLDER & MULTI-STEP STRAY-LIGHT BAFFLE FRAME
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 2.74, 0);

    // Main outer LCP frame with recessed seat for IRCF glass
    const upperSeat = new THREE.Mesh(
      createRectFrameGeometry(21.0, 18.0, 16.65, 13.25, 0.34, 0.85, 0.2, 0.03),
      mats.lcpBlack
    );
    upperSeat.position.y = 0.26;
    g.add(upperSeat);

    // 4-step internal anti-stray-light sawtooth optical baffles
    const steps = [
      { iw: 15.7, id: 12.3, h: 0.14, y: 0.04 },
      { iw: 15.1, id: 11.7, h: 0.14, y: -0.10 },
      { iw: 14.6, id: 11.2, h: 0.14, y: -0.24 },
      { iw: 14.2, id: 10.8, h: 0.16, y: -0.39 }
    ];
    for (const st of steps) {
      const m = new THREE.Mesh(
        createRectFrameGeometry(21.0, 18.0, st.iw, st.id, st.h, 0.85, 0.15, 0.015),
        mats.lcpBlack
      );
      m.position.y = st.y;
      g.add(m);
    }

    // 4 Corner alignment dowel pins on bottom face
    const pinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.32, 16);
    for (const [px, pz] of [[-9.6, -8.1], [9.6, -8.1], [-9.6, 8.1], [9.6, 8.1]]) {
      const pin = new THREE.Mesh(pinGeo, mats.lcpBlack);
      pin.position.set(px, -0.58, pz);
      g.add(pin);
    }

    register('ircf_lcp_holder', g, [0, 7.3, 0]);
  }

  // =========================================================================
  // 05. ACTIVE ALIGNMENT UV-CURED DUST GASKET ADHESIVE RING
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 2.22, 0);

    const ring = new THREE.Mesh(
      createRectFrameGeometry(19.6, 16.6, 18.5, 15.5, 0.14, 0.65, 0.45, 0.03),
      mats.uvAdhesive
    );
    g.add(ring);

    // 4 precision active-alignment corner adhesive fillets
    const beadGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.18, 16);
    for (const [bx, bz] of [[-9.1, -7.6], [9.1, -7.6], [-9.1, 7.6], [9.1, 7.6]]) {
      const b = new THREE.Mesh(beadGeo, mats.uvAdhesive);
      b.position.set(bx, 0, bz);
      g.add(b);
    }

    register('active_alignment_seal', g, [0, 5.7, 0]);
  }

  // =========================================================================
  // 06. SENSOR OPTICAL SURFACE (Active Quad-Bayer OCL/CFA + OB Band)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.72, 0);

    // Main optical surface plate (13.6 x 10.2 mm: active 13.11x9.83 + OB ring)
    const surfGeo = new THREE.BoxGeometry(13.8, 0.06, 10.4);
    const surf = new THREE.Mesh(surfGeo, [
      mats.siliconBulkSide,
      mats.siliconBulkSide,
      mats.sensorOpticalSurface,
      mats.siliconBulkSide,
      mats.siliconBulkSide,
      mats.siliconBulkSide
    ]);
    g.add(surf);

    // Subtle micro-stepped tungsten Optical Black bezel frame around active array
    const obFrame = new THREE.Mesh(
      createRectFrameGeometry(14.1, 10.7, 13.12, 9.84, 0.075, 0.06, 0.02, 0.01),
      mats.susDarkInner
    );
    obFrame.position.y = 0.01;
    g.add(obFrame);

    register('sensor_optical_surface', g, [0, 4.35, 0], { oisMoving: true });
  }

  // =========================================================================
  // 07. PHOTODIODE TOP WAFER (BSI Thinned Pinned Photodiode Si Layer)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.59, 0);

    const pdLayer = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 0.16, 11.8),
      mats.siliconPhotodiode
    );
    g.add(pdLayer);

    // Subtle DTI guard scribe border on top perimeter
    const scribe = new THREE.Mesh(
      createRectFrameGeometry(15.05, 11.65, 14.6, 11.2, 0.02, 0.04, 0.04, 0),
      mats.siliconBulkSide
    );
    scribe.position.y = 0.085;
    g.add(scribe);

    register('photodiode_top_wafer', g, [0, 3.45, 0], { oisMoving: true });
  }

  // =========================================================================
  // 08. 2ND LAYER PIXEL TRANSISTOR SUBSTRATE (2-Layer Transistor Pixel)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.42, 0);

    const trDie = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 0.15, 11.8),
      [
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.transistorSilicon,
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.siliconBulkSide
      ]
    );
    g.add(trDie);

    register('transistor_pixel_layer', g, [0, 2.55, 0], { oisMoving: true });
  }

  // =========================================================================
  // 09. Cu-Cu HYBRID BONDING INTERFACE (SiCN Dielectric + 432 3D Copper Pads)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.28, 0);

    const sicnSlab = new THREE.Mesh(
      new THREE.BoxGeometry(15.1, 0.07, 11.7),
      [
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.cucuHybridLayer,
        mats.cucuHybridLayer,
        mats.siliconBulkSide,
        mats.siliconBulkSide
      ]
    );
    g.add(sicnSlab);

    // Instanced 3D micro copper hybrid-bond pillars (24 x 18 = 432 physical Cu pads)
    const cols = 24;
    const rows = 18;
    const padGeo = new THREE.BoxGeometry(0.24, 0.11, 0.24);
    const inst = new THREE.InstancedMesh(padGeo, mats.copperPad, cols * rows);
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -6.9 + (c / (cols - 1)) * 13.8;
        const z = -5.1 + (r / (rows - 1)) * 10.2;
        dummy.position.set(x, 0.01, z);
        dummy.updateMatrix();
        inst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);

    register('cu_cu_hybrid_bonding', g, [0, 1.72, 0], { oisMoving: true });
  }

  // =========================================================================
  // 10. MIDDLE HIGH-SPEED STACKED DRAM DIE (3-Layer Stacked Memory)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.11, 0);

    const dram = new THREE.Mesh(
      new THREE.BoxGeometry(15.0, 0.16, 11.6),
      [
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.dramDie,
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.siliconBulkSide
      ]
    );
    g.add(dram);

    // 32 Cu-TSV through-silicon via pillars along central spine
    const tsvGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.20, 10);
    const tsvInst = new THREE.InstancedMesh(tsvGeo, mats.copperPad, 32);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 32; i++) {
      const x = -6.4 + (i / 31) * 12.8;
      dummy.position.set(x, 0, (i % 2 === 0) ? -0.35 : 0.35);
      dummy.updateMatrix();
      tsvInst.setMatrixAt(i, dummy.matrix);
    }
    tsvInst.instanceMatrix.needsUpdate = true;
    g.add(tsvInst);

    register('stacked_dram_die', g, [0, 0.92, 0], { oisMoving: true });
  }

  // =========================================================================
  // 11. BOTTOM LOGIC DIE (22nm Column-Parallel ADC / AI Remosaic / MIPI PHY)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0.82, 0);

    const logic = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 0.36, 11.8),
      [
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.logicDie,
        mats.siliconBulkSide,
        mats.siliconBulkSide,
        mats.siliconBulkSide
      ]
    );
    g.add(logic);

    // Subtle 3D relief bars for upper/lower column-parallel ADC arrays
    const adcBarGeo = new THREE.BoxGeometry(12.2, 0.025, 1.35);
    const adcTop = new THREE.Mesh(adcBarGeo, mats.siliconBulkSide);
    adcTop.position.set(0, 0.19, -4.3);
    const adcBot = new THREE.Mesh(adcBarGeo, mats.siliconBulkSide);
    adcBot.position.set(0, 0.19, 4.3);
    g.add(adcTop, adcBot);

    register('bottom_logic_die', g, [0, 0.12, 0], { oisMoving: true });
  }

  // =========================================================================
  // 12. PERIPHERAL BOND PADS (112 Precision Al/Au Pads around Die Perimeter)
  // =========================================================================
  const bondPadCoords = []; // shared with wire-bonding loop generator!
  {
    const g = new THREE.Group();
    g.position.set(0, 1.69, 0);

    const nLong = 32;
    const nShort = 24;
    for (let i = 0; i < nLong; i++) {
      const x = -6.75 + (i / (nLong - 1)) * 13.5;
      bondPadCoords.push({ x, z: -5.62, side: 'N' });
      bondPadCoords.push({ x, z: 5.62, side: 'S' });
    }
    for (let i = 0; i < nShort; i++) {
      const z = -4.95 + (i / (nShort - 1)) * 9.9;
      bondPadCoords.push({ x: -7.32, z, side: 'W' });
      bondPadCoords.push({ x: 7.32, z, side: 'E' });
    }

    const padGeo = new THREE.BoxGeometry(0.24, 0.045, 0.24);
    const padInst = new THREE.InstancedMesh(padGeo, mats.alPad, bondPadCoords.length);
    const goldCapGeo = new THREE.BoxGeometry(0.18, 0.055, 0.18);
    const goldInst = new THREE.InstancedMesh(goldCapGeo, mats.goldBond, bondPadCoords.length);
    const dummy = new THREE.Object3D();

    bondPadCoords.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.updateMatrix();
      padInst.setMatrixAt(i, dummy.matrix);
      goldInst.setMatrixAt(i, dummy.matrix);
    });
    padInst.instanceMatrix.needsUpdate = true;
    goldInst.instanceMatrix.needsUpdate = true;
    g.add(padInst, goldInst);

    register('peripheral_bond_pads', g, [0, 3.88, 0], { oisMoving: true });
  }

  // =========================================================================
  // 13. GOLD WIRE BONDING LOOPS (112 Thermosonic Ball-to-Wedge Au Wires!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0, 0);

    const ballGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const ballInst = new THREE.InstancedMesh(ballGeo, mats.goldBond, bondPadCoords.length);
    const wedgeGeo = new THREE.BoxGeometry(0.09, 0.03, 0.16);
    const wedgeInst = new THREE.InstancedMesh(wedgeGeo, mats.goldBond, bondPadCoords.length);
    const dummy = new THREE.Object3D();

    // Build real 3D parabolic thermosonic wire arcs for all 112 pads
    const positions = [];
    const normals = [];
    const indices = [];
    let vertexOffset = 0;

    bondPadCoords.forEach((p, i) => {
      const startY = 1.71;
      const endY = 0.50; // lands on OIS moving carrier ENIG bond fingers
      let ex = p.x;
      let ez = p.z;
      let mx = p.x;
      let mz = p.z;

      if (p.side === 'N') {
        ez = -6.72;
        mz = -6.12;
      } else if (p.side === 'S') {
        ez = 6.72;
        mz = 6.12;
      } else if (p.side === 'W') {
        ex = -8.42;
        mx = -7.84;
      } else {
        ex = 8.42;
        mx = 7.84;
      }

      // Ball bond at die pad
      dummy.position.set(p.x, startY + 0.02, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ballInst.setMatrixAt(i, dummy.matrix);

      // Wedge bond at carrier substrate finger
      dummy.position.set(ex, endY + 0.015, ez);
      dummy.rotation.set(0, (p.side === 'W' || p.side === 'E') ? Math.PI / 2 : 0, 0);
      dummy.updateMatrix();
      wedgeInst.setMatrixAt(i, dummy.matrix);

      // Authentic low-loop thermosonic profile: vertical neck -> smooth arch -> wedge landing
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p.x, startY + 0.03, p.z),
        new THREE.Vector3(p.x + (mx - p.x) * 0.18, startY + 0.34, p.z + (mz - p.z) * 0.18),
        new THREE.Vector3(mx, startY + 0.25, mz),
        new THREE.Vector3(ex - (ex - mx) * 0.25, endY + 0.42, ez - (ez - mz) * 0.25),
        new THREE.Vector3(ex, endY + 0.02, ez)
      ]);
      const tube = new THREE.TubeGeometry(curve, 12, 0.024, 5, false);
      const posAttr = tube.attributes.position;
      const normAttr = tube.attributes.normal;
      const idxAttr = tube.index;

      for (let k = 0; k < posAttr.count; k++) {
        positions.push(posAttr.getX(k), posAttr.getY(k), posAttr.getZ(k));
        normals.push(normAttr.getX(k), normAttr.getY(k), normAttr.getZ(k));
      }
      for (let k = 0; k < idxAttr.count; k++) {
        indices.push(idxAttr.getX(k) + vertexOffset);
      }
      vertexOffset += posAttr.count;
      tube.dispose();
    });

    ballInst.instanceMatrix.needsUpdate = true;
    wedgeInst.instanceMatrix.needsUpdate = true;

    const mergedWireGeo = new THREE.BufferGeometry();
    mergedWireGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    mergedWireGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    mergedWireGeo.setIndex(indices);

    const wiresMesh = new THREE.Mesh(mergedWireGeo, mats.goldBond);
    g.add(wiresMesh, ballInst, wedgeInst);

    register('gold_wire_bonds', g, [0, 3.0, 0], { oisMoving: true });
  }

  // =========================================================================
  // 14. MOB (Molded-on-Board) BLACK EPOXY ENCAPSULATION FRAME
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 1.32, 0);

    // Encapsulates wire bonds & carrier passives while keeping optical aperture clean
    const mobOuter = new THREE.Mesh(
      createRectFrameGeometry(18.6, 15.2, 14.4, 11.0, 1.58, 0.55, 0.14, 0.05),
      mats.mobEpoxy
    );
    g.add(mobOuter);

    // Molded inner dam lip right outside optical black perimeter
    const damLip = new THREE.Mesh(
      createRectFrameGeometry(14.7, 11.3, 14.2, 10.8, 0.24, 0.16, 0.12, 0.02),
      mats.mobEpoxy
    );
    damLip.position.y = 0.72;
    g.add(damLip);

    register('mob_epoxy_molding', g, [0, 4.95, 0], { oisMoving: true });
  }

  // =========================================================================
  // 15. DIE ATTACH FILM / SILVER EPOXY THERMAL ADHESIVE LAYER (DAF)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0.59, 0);

    const daf = new THREE.Mesh(
      new THREE.BoxGeometry(15.35, 0.08, 11.95),
      mats.silverEpoxyDaf
    );
    g.add(daf);

    // Corner adhesive bleed fillets
    const fillet = new THREE.Mesh(
      createRectFrameGeometry(15.65, 12.25, 15.1, 11.7, 0.045, 0.25, 0.05, 0.01),
      mats.silverEpoxyDaf
    );
    fillet.position.y = -0.02;
    g.add(fillet);

    register('die_attach_adhesive', g, [0, -0.55, 0], { oisMoving: true });
  }

  // =========================================================================
  // 16. 3D SENSOR-SHIFT OIS MOVING CARRIER SUBSTRATE
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0.37, 0);

    const baseShape = roundedRectShape(19.0, 15.6, 0.7);
    const carrierGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 2
    });
    carrierGeo.rotateX(-Math.PI / 2);
    carrierGeo.translate(0, -0.14, 0);
    const carrier = new THREE.Mesh(carrierGeo, mats.oisCarrierPcb);
    g.add(carrier);

    // 112 ENIG gold substrate fingers along carrier top perimeter
    const fingerGeo = new THREE.BoxGeometry(0.18, 0.025, 0.52);
    const fingerInst = new THREE.InstancedMesh(fingerGeo, mats.goldBond, bondPadCoords.length);
    const dummy = new THREE.Object3D();
    bondPadCoords.forEach((p, i) => {
      let fx = p.x, fz = p.z, rot = 0;
      if (p.side === 'N') fz = -6.75;
      else if (p.side === 'S') fz = 6.75;
      else if (p.side === 'W') { fx = -8.45; rot = Math.PI / 2; }
      else { fx = 8.45; rot = Math.PI / 2; }
      dummy.position.set(fx, 0.16, fz);
      dummy.rotation.set(0, rot, 0);
      dummy.updateMatrix();
      fingerInst.setMatrixAt(i, dummy.matrix);
    });
    fingerInst.instanceMatrix.needsUpdate = true;
    g.add(fingerInst);

    // 4 bottom ceramic-ball bearing race pockets
    const pocketGeo = new THREE.CylinderGeometry(0.55, 0.42, 0.09, 18);
    for (const [px, pz] of [[-8.3, -6.6], [8.3, -6.6], [-8.3, 6.6], [8.3, 6.6]]) {
      const pk = new THREE.Mesh(pocketGeo, mats.susSteel);
      pk.position.set(px, -0.16, pz);
      g.add(pk);
    }

    register('ois_moving_carrier', g, [0, -1.35, 0], { oisMoving: true });
  }

  // =========================================================================
  // 17. S-SHAPED SERPENTINE FLEX SUSPENSION INTERCONNECT ARMS (×4)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0.28, 0);

    const buildSerpentineArm = (sx, sz) => {
      const pts = [
        new THREE.Vector3(sx * 7.8, 0.04, sz * 6.8),
        new THREE.Vector3(sx * 9.6, 0.0, sz * 7.2),
        new THREE.Vector3(sx * 10.6, -0.18, sz * 5.8),
        new THREE.Vector3(sx * 9.8, -0.42, sz * 4.5),
        new THREE.Vector3(sx * 10.8, -0.78, sz * 6.4),
        new THREE.Vector3(sx * 10.4, -1.18, sz * 8.2),
        new THREE.Vector3(sx * 9.2, -1.48, sz * 8.6)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const ribbonGeo = new THREE.TubeGeometry(curve, 36, 0.14, 6, false);
      ribbonGeo.scale(1, 0.35, 1);
      const mesh = new THREE.Mesh(ribbonGeo, mats.fpcPolyimide);
      return mesh;
    };

    g.add(
      buildSerpentineArm(-1, -1),
      buildSerpentineArm(1, -1),
      buildSerpentineArm(-1, 1),
      buildSerpentineArm(1, 1)
    );

    register('flex_suspension_arms', g, [0, -2.05, 0]);
  }

  // =========================================================================
  // 18. PLANAR OIS VOICE COILS (4 Racetrack Copper Windings around Perimeter)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.14, 0);

    const longCoilGeo = createRacetrackCoilGeometry(8.8, 2.35, 0.68, 0.44);
    const shortCoilGeo = createRacetrackCoilGeometry(6.8, 2.35, 0.68, 0.44);

    // North & South Y-axis + Roll coils
    const cNorth = new THREE.Mesh(longCoilGeo, mats.copperCoil);
    cNorth.position.set(0, 0, -6.35);
    const cSouth = new THREE.Mesh(longCoilGeo, mats.copperCoil);
    cSouth.position.set(0, 0, 6.35);

    // West & East X-axis coils
    const cWest = new THREE.Mesh(shortCoilGeo, mats.copperCoil);
    cWest.rotation.y = Math.PI / 2;
    cWest.position.set(-7.95, 0, 0);
    const cEast = new THREE.Mesh(shortCoilGeo, mats.copperCoil);
    cEast.rotation.y = Math.PI / 2;
    cEast.position.set(7.95, 0, 0);

    // Gold coil termination pads (2 per coil)
    const termGeo = new THREE.BoxGeometry(0.45, 0.08, 0.32);
    const termCoords = [
      [-4.7, 0.22, -6.35], [4.7, 0.22, -6.35],
      [-4.7, 0.22, 6.35], [4.7, 0.22, 6.35],
      [-7.95, 0.22, -3.7], [-7.95, 0.22, 3.7],
      [7.95, 0.22, -3.7], [7.95, 0.22, 3.7]
    ];
    termCoords.forEach(([tx, ty, tz]) => {
      const m = new THREE.Mesh(termGeo, mats.goldBond);
      m.position.set(tx, ty, tz);
      g.add(m);
    });

    g.add(cNorth, cSouth, cWest, cEast);
    register('ois_voice_coils', g, [0, -2.95, 0], { oisMoving: true });
  }

  // =========================================================================
  // 19. NEODYMIUM PERMANENT MAGNETS (4× Two-Pole NdFeB Blocks + Neutral Slits)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.78, 0);

    const buildDualPoleMagnet = (len, wid, h) => {
      const mg = new THREE.Group();
      const halfW = (wid - 0.14) / 2;
      const poleN = new THREE.Mesh(new THREE.BoxGeometry(len, h, halfW), mats.magnetNickel);
      poleN.position.z = -(halfW / 2 + 0.07);
      const poleS = new THREE.Mesh(new THREE.BoxGeometry(len, h, halfW), mats.magnetNorthTint);
      poleS.position.z = +(halfW / 2 + 0.07);
      const neutralSlit = new THREE.Mesh(new THREE.BoxGeometry(len * 0.99, h * 0.92, 0.14), mats.magnetSlit);
      mg.add(poleN, poleS, neutralSlit);
      return mg;
    };

    const mNorth = buildDualPoleMagnet(9.4, 2.55, 0.56);
    mNorth.position.set(0, 0, -6.35);

    const mSouth = buildDualPoleMagnet(9.4, 2.55, 0.56);
    mSouth.position.set(0, 0, 6.35);

    const mWest = buildDualPoleMagnet(7.4, 2.55, 0.56);
    mWest.rotation.y = Math.PI / 2;
    mWest.position.set(-7.95, 0, 0);

    const mEast = buildDualPoleMagnet(7.4, 2.55, 0.56);
    mEast.rotation.y = Math.PI / 2;
    mEast.position.set(7.95, 0, 0);

    g.add(mNorth, mSouth, mWest, mEast);
    register('neodymium_magnets', g, [0, -4.65, 0]);
  }

  // =========================================================================
  // 20. MAGNETIC YOKE & FLUX RETURN SHIELD PLATE (Permalloy)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.14, 0);

    const yokeRing = new THREE.Mesh(
      createRectFrameGeometry(19.6, 16.2, 11.4, 8.2, 0.18, 0.75, 0.45, 0.02),
      mats.yokePermalloy
    );
    g.add(yokeRing);

    // 4 upturned outer flux-return walls behind each magnet
    const wallLong = new THREE.BoxGeometry(9.6, 0.62, 0.16);
    const wallShort = new THREE.BoxGeometry(0.16, 0.62, 7.6);
    const yn = new THREE.Mesh(wallLong, mats.yokePermalloy);
    yn.position.set(0, 0.34, -7.75);
    const ys = new THREE.Mesh(wallLong, mats.yokePermalloy);
    ys.position.set(0, 0.34, 7.75);
    const yw = new THREE.Mesh(wallShort, mats.yokePermalloy);
    yw.position.set(-9.35, 0.34, 0);
    const ye = new THREE.Mesh(wallShort, mats.yokePermalloy);
    ye.position.set(9.35, 0.34, 0);
    g.add(yn, ys, yw, ye);

    register('magnetic_yoke_plate', g, [0, -5.85, 0]);
  }

  // =========================================================================
  // 21. SUB-MICRON HALL-EFFECT POSITION SENSORS (×3 inside Voice Coil Cavities)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.16, 0);

    const buildHallChip = (x, z) => {
      const hc = new THREE.Group();
      hc.position.set(x, 0, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.30, 0.85), mats.hallSensorEmerald);
      hc.add(body);
      const dieTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.04, 0.68), mats.icPackageDark);
      dieTop.position.y = 0.16;
      hc.add(dieTop);
      // 4 solder bumps on top/carrier interface
      const bGeo = new THREE.SphereGeometry(0.08, 8, 8);
      for (const [bx, bz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) {
        const sb = new THREE.Mesh(bGeo, mats.solderTin);
        sb.position.set(bx, 0.19, bz);
        hc.add(sb);
      }
      return hc;
    };

    // 2 along Y-axis coils (Y shift + Roll angle differential) + 1 in West X-axis coil
    g.add(
      buildHallChip(-1.8, -6.35),
      buildHallChip(1.8, 6.35),
      buildHallChip(-7.95, 0)
    );

    register('hall_effect_sensors', g, [0, -3.75, 0], { oisMoving: true });
  }

  // =========================================================================
  // 22. ZIRCONIA CERAMIC BALL BEARINGS & PRECISION RETAINER RINGS (×4)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -0.44, 0);

    const ballGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const guideGeo = new THREE.TorusGeometry(0.46, 0.06, 10, 24);
    guideGeo.rotateX(Math.PI / 2);

    for (const [bx, bz] of [[-8.3, -6.6], [8.3, -6.6], [-8.3, 6.6], [8.3, 6.6]]) {
      const ball = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      ball.position.set(bx, 0, bz);
      const guide = new THREE.Mesh(guideGeo, mats.susSteel);
      guide.position.set(bx, -0.04, bz);
      g.add(ball, guide);
    }

    register('ceramic_ball_bearings', g, [0, -4.15, 0]);
  }

  // =========================================================================
  // 23. BERYLLIUM COPPER SUSPENSION LEAF SPRINGS (Photo-etched Flexures)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, 0.08, 0);

    // Outer anchored spring frame
    const outerFrame = new THREE.Mesh(
      createRectFrameGeometry(21.4, 18.4, 20.6, 17.6, 0.055, 0.9, 0.7, 0),
      mats.beCuSpring
    );
    g.add(outerFrame);

    // Inner moving anchor ring
    const innerFrame = new THREE.Mesh(
      createRectFrameGeometry(17.8, 14.4, 17.1, 13.7, 0.055, 0.5, 0.4, 0),
      mats.beCuSpring
    );
    g.add(innerFrame);

    // 4 intricate multi-segment L/Z flexure arms connecting outer to inner
    const armMat = mats.beCuSpring;
    const makeArm = (sx, sz) => {
      const ag = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.055, 0.22), armMat);
      s1.position.set(sx * 7.2, 0, sz * 8.4);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 1.45), armMat);
      s2.position.set(sx * 4.5, 0, sz * 7.78);
      const s3 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.055, 0.22), armMat);
      s3.position.set(sx * 6.6, 0, sz * 7.12);
      const s4 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 1.9), armMat);
      s4.position.set(sx * 9.85, 0, sz * 7.45);
      ag.add(s1, s2, s3, s4);
      return ag;
    };

    g.add(makeArm(1, 1), makeArm(-1, 1), makeArm(1, -1), makeArm(-1, -1));
    register('suspension_leaf_springs', g, [0, -2.42, 0]);
  }

  // =========================================================================
  // 24. MAIN MULTI-LAYER RIGID PCB & COPPER THERMAL VIA ARRAY
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.52, 0);

    const pcbShape = roundedRectShape(22.8, 19.8, 1.15);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.52,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    pcbGeo.rotateX(-Math.PI / 2);
    pcbGeo.translate(0, -0.26, 0);

    // Top patterned PCB face overlay for sharp trace & pad alignment
    const pcbBody = new THREE.Mesh(pcbGeo, mats.oisCarrierPcb);
    g.add(pcbBody);

    const pcbTopFace = new THREE.Mesh(
      new THREE.PlaneGeometry(22.2, 19.2),
      mats.rigidPcb
    );
    pcbTopFace.rotation.x = -Math.PI / 2;
    pcbTopFace.position.y = 0.295;
    g.add(pcbTopFace);

    // 64 physical copper-filled through-board thermal vias under sensor center
    const viaGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.62, 12);
    const viaInst = new THREE.InstancedMesh(viaGeo, mats.goldBond, 64);
    const dummy = new THREE.Object3D();
    let vIdx = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        dummy.position.set(-4.2 + c * 1.2, 0, -3.15 + r * 0.9);
        dummy.updateMatrix();
        viaInst.setMatrixAt(vIdx++, dummy.matrix);
      }
    }
    viaInst.instanceMatrix.needsUpdate = true;
    g.add(viaInst);

    register('main_rigid_pcb', g, [0, -7.2, 0]);
  }

  // =========================================================================
  // 25. 01005 / 0201 DECOUPLING MLCC CAPACITOR ARRAY (×28 Detailed Passives)
  // =========================================================================
  {
    const g = new THREE.Group();

    const mlccPositions = [];
    // 16 ultra-tiny 01005 MLCCs right next to die power rails (on carrier perimeter)
    for (let i = 0; i < 8; i++) {
      mlccPositions.push({ x: -5.6 + i * 1.6, y: 0.62, z: -7.28, rot: 0, s: 1.0, moving: true });
      mlccPositions.push({ x: -5.6 + i * 1.6, y: 0.62, z: 7.28, rot: 0, s: 1.0, moving: true });
    }
    // 12 slightly larger 0201 bulk decoupling MLCCs on main fixed PCB
    for (let i = 0; i < 6; i++) {
      mlccPositions.push({ x: -9.8, y: -1.06, z: -5.2 + i * 2.08, rot: Math.PI / 2, s: 1.35, moving: false });
      mlccPositions.push({ x: 9.8, y: -1.06, z: -5.2 + i * 2.08, rot: Math.PI / 2, s: 1.35, moving: false });
    }

    const bodyGeo = new THREE.BoxGeometry(0.42, 0.24, 0.26);
    const capEndGeo = new THREE.BoxGeometry(0.14, 0.255, 0.275);
    const filletGeo = new THREE.BoxGeometry(0.16, 0.06, 0.30);

    for (const mp of mlccPositions) {
      const mg = new THREE.Group();
      mg.position.set(mp.x, mp.y, mp.z);
      mg.rotation.y = mp.rot;
      mg.scale.setScalar(mp.s);

      const cer = new THREE.Mesh(bodyGeo, mats.mlccCeramic);
      const endL = new THREE.Mesh(capEndGeo, mats.solderTin);
      endL.position.x = -0.24;
      const endR = new THREE.Mesh(capEndGeo, mats.solderTin);
      endR.position.x = 0.24;
      const filL = new THREE.Mesh(filletGeo, mats.solderTin);
      filL.position.set(-0.27, -0.11, 0);
      const filR = new THREE.Mesh(filletGeo, mats.solderTin);
      filR.position.set(0.27, -0.11, 0);

      mg.add(cer, endL, endR, filL, filR);
      g.add(mg);
    }

    register('mlcc_decoupling_array', g, [0, -6.35, 0]);
  }

  // =========================================================================
  // 26. CLOSED-LOOP OIS / AF DRIVER ASIC (QFN/WLCSP with 24 Lead Pins)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-7.6, -1.04, 8.2);

    const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 2.0), mats.icPackageDark);
    g.add(pkg);

    // Pin-1 alignment dimple
    const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 12), mats.alPad);
    pin1.position.set(-0.85, 0.20, -0.68);
    g.add(pin1);

    // 24 metallic QFN perimeter lead contacts
    const leadGeo = new THREE.BoxGeometry(0.16, 0.10, 0.22);
    for (let i = 0; i < 6; i++) {
      const lx = -0.88 + i * 0.35;
      const l1 = new THREE.Mesh(leadGeo, mats.solderTin);
      l1.position.set(lx, -0.15, -1.04);
      const l2 = new THREE.Mesh(leadGeo, mats.solderTin);
      l2.position.set(lx, -0.15, 1.04);
      g.add(l1, l2);
    }
    for (let i = 0; i < 6; i++) {
      const lz = -0.72 + i * 0.29;
      const l3 = new THREE.Mesh(leadGeo, mats.solderTin);
      l3.rotation.y = Math.PI / 2;
      l3.position.set(-1.24, -0.15, lz);
      const l4 = new THREE.Mesh(leadGeo, mats.solderTin);
      l4.rotation.y = Math.PI / 2;
      l4.position.set(1.24, -0.15, lz);
      g.add(l3, l4);
    }

    register('ois_driver_ic', g, [-2.4, -6.7, 2.2]);
  }

  // =========================================================================
  // 27. FACTORY CALIBRATION EEPROM (Non-Volatile WLCSP + Solder Bumps)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(7.8, -1.06, 8.2);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.34, 1.15), mats.icPackageDark);
    g.add(body);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.9), mats.siliconPhotodiode);
    cap.position.y = 0.18;
    g.add(cap);

    const bGeo = new THREE.SphereGeometry(0.09, 10, 10);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const b = new THREE.Mesh(bGeo, mats.solderTin);
        b.position.set(-0.45 + c * 0.3, -0.18, -0.28 + r * 0.56);
        g.add(b);
      }
    }

    register('calibration_eeprom', g, [2.4, -6.7, 2.2]);
  }

  // =========================================================================
  // 28. POLYIMIDE FPC CABLE & MIPI CSI-2 DIFFERENTIAL TRACES + EMI FILM
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.50, 9.65);

    // Seamless Rigid-Flex transition bridge + gold low-temp solder reinforcement strip
    const solderBridge = new THREE.Mesh(
      new THREE.BoxGeometry(8.9, 0.18, 0.7),
      mats.goldBond
    );
    solderBridge.position.set(0, 0.04, 0.25);
    g.add(solderBridge);

    // Main flexible ribbon exiting +Z side seamlessly from PCB edge
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.14, 10.6),
      mats.fpcPolyimide
    );
    ribbon.position.set(0, 0, 5.1);
    g.add(ribbon);

    // Black conductive EMI shielding patch over high-speed MIPI segment
    const emiPatch = new THREE.Mesh(
      new THREE.BoxGeometry(8.3, 0.035, 5.6),
      mats.fpcEmiFilm
    );
    emiPatch.position.set(0, 0.09, 4.4);
    g.add(emiPatch);

    // Rear stainless stiffener plate under BTB connector landing zone
    const endStiff = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.18, 3.8),
      mats.susSteel
    );
    endStiff.position.set(0, -0.16, 11.15);
    g.add(endStiff);

    // Connector landing zone polyimide widening
    const endPad = new THREE.Mesh(
      new THREE.BoxGeometry(9.8, 0.14, 4.1),
      mats.fpcPolyimide
    );
    endPad.position.set(0, 0, 11.15);
    g.add(endPad);

    register('fpc_mipi_cable', g, [0, -7.2, 4.2]);
  }

  // =========================================================================
  // 29. 0.35mm FINE-PITCH 40-PIN BTB MEZZANINE CONNECTOR
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.16, 20.8);

    // Main LCP molded housing with center mating island
    const outerWall = new THREE.Mesh(
      createRectFrameGeometry(8.6, 2.35, 7.6, 1.45, 0.56, 0.16, 0.08, 0.02),
      mats.btbHousing
    );
    g.add(outerWall);

    const centerIsland = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.48, 0.64),
      mats.btbHousing
    );
    centerIsland.position.y = -0.02;
    g.add(centerIsland);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.12, 2.3),
      mats.btbHousing
    );
    floor.position.y = -0.24;
    g.add(floor);

    // 40 precision gold-plated phosphor-bronze contact pins (2 rows × 20)
    const pinGeo = new THREE.BoxGeometry(0.14, 0.42, 0.42);
    const pinInst = new THREE.InstancedMesh(pinGeo, mats.goldBond, 40);
    const dummy = new THREE.Object3D();
    let pIdx = 0;
    for (let i = 0; i < 20; i++) {
      const px = -3.325 + i * 0.35;
      dummy.position.set(px, 0.04, -0.82);
      dummy.updateMatrix();
      pinInst.setMatrixAt(pIdx++, dummy.matrix);

      dummy.position.set(px, 0.04, 0.82);
      dummy.updateMatrix();
      pinInst.setMatrixAt(pIdx++, dummy.matrix);
    }
    pinInst.instanceMatrix.needsUpdate = true;
    g.add(pinInst);

    // Full-armor metallic power/lock end caps on left & right ends
    const armorGeo = new THREE.BoxGeometry(0.62, 0.58, 2.42);
    const armL = new THREE.Mesh(armorGeo, mats.susSteel);
    armL.position.set(-4.15, 0, 0);
    const armR = new THREE.Mesh(armorGeo, mats.susSteel);
    armR.position.set(4.15, 0, 0);
    g.add(armL, armR);

    register('btb_mezzanine_connector', g, [0, -6.1, 6.2]);
  }

  // =========================================================================
  // 30. REAR SUS304 STIFFENER PLATE & HIGH-CONDUCTIVITY GRAPHITE THERMAL SHEET
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0, -1.96, 0);

    const stiffShape = roundedRectShape(22.6, 19.6, 1.1);
    const stiffGeo = new THREE.ExtrudeGeometry(stiffShape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    });
    stiffGeo.rotateX(-Math.PI / 2);
    stiffGeo.translate(0, -0.10, 0);
    const stiffPlate = new THREE.Mesh(stiffGeo, mats.susSteel);
    g.add(stiffPlate);

    // High-conductivity graphite & TIM thermal spreader pad underneath sensor zone
    const graphite = new THREE.Mesh(
      new THREE.BoxGeometry(16.6, 0.14, 13.4),
      mats.graphiteSheet
    );
    graphite.position.y = -0.18;
    g.add(graphite);

    register('sus_stiffener_thermal', g, [0, -8.8, 0]);
  }

  return {
    root,
    parts,
    gridY: -3.2,
    defaultCameraPos: new THREE.Vector3(31, 25, 35),
    defaultTarget: new THREE.Vector3(4.2, 0.4, 3.6),
    clipBounds: { x: 13.5, y: 12.0, z: 24.0 }
  };
}
