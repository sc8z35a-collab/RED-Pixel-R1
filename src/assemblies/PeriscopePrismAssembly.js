import * as THREE from 'three';

/**
 * Generates a mathematically exact Double-D-Cut (Flat Top & Flat Bottom Trimmed)
 * spherical/aspheric optical lens geometry centered at (0, 0, 0) with optical axis along +X!
 * - Horizontal width along Z spans [-rOuter, +rOuter] (circular arcs on left/right flanks)
 * - Vertical height along Y is razor-flat trimmed to [-hCut, +hCut] (D-cut chords)
 * - Front surface at x = -thick/2 + sagFront(rho), Back surface at x = +thick/2 + sagBack(rho)
 */
function createDCutLensGeometry(
  rOuter,
  hCut,
  centerThick,
  sagFrontFn,
  sagBackFn,
  radialSteps = 12,
  angleSteps = 72
) {
  const positions = [];
  const indices = [];

  const getRMax = (theta) => {
    const absSin = Math.abs(Math.sin(theta));
    if (absSin < 1e-5) return rOuter;
    return Math.min(rOuter, hCut / absSin);
  };

  // Helper to append a curved surface (front or back)
  const addCap = (isFront) => {
    const baseIdx = positions.length / 3;
    // Center vertex
    const x0 = isFront ? -centerThick / 2 + sagFrontFn(0) : centerThick / 2 + sagBackFn(0);
    positions.push(x0, 0, 0);

    for (let ir = 1; ir <= radialSteps; ir++) {
      const u = ir / radialSteps;
      for (let ia = 0; ia < angleSteps; ia++) {
        const theta = (ia / angleSteps) * Math.PI * 2;
        const rMax = getRMax(theta);
        const r = u * rMax;
        const z = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const rho = Math.hypot(z, y);
        const x = isFront
          ? -centerThick / 2 + sagFrontFn(rho)
          : centerThick / 2 + sagBackFn(rho);
        positions.push(x, y, z);
      }
    }

    // Center triangle fan
    for (let ia = 0; ia < angleSteps; ia++) {
      const next = (ia + 1) % angleSteps;
      const a = baseIdx;
      const b = baseIdx + 1 + ia;
      const c = baseIdx + 1 + next;
      if (isFront) indices.push(a, c, b);
      else indices.push(a, b, c);
    }

    // Concentric quads
    for (let ir = 1; ir < radialSteps; ir++) {
      const ring0 = baseIdx + 1 + (ir - 1) * angleSteps;
      const ring1 = baseIdx + 1 + ir * angleSteps;
      for (let ia = 0; ia < angleSteps; ia++) {
        const next = (ia + 1) % angleSteps;
        const a = ring0 + ia;
        const b = ring0 + next;
        const c = ring1 + ia;
        const d = ring1 + next;
        if (isFront) {
          indices.push(a, b, d, a, d, c);
        } else {
          indices.push(a, d, b, a, c, d);
        }
      }
    }
  };

  addCap(true);
  addCap(false);

  // Separate crisp rim vertices (so flat D-cut top/bottom walls have razor-sharp normals)
  const rimBase = positions.length / 3;
  for (let ia = 0; ia < angleSteps; ia++) {
    const theta = (ia / angleSteps) * Math.PI * 2;
    const rMax = getRMax(theta);
    const z = rMax * Math.cos(theta);
    const y = rMax * Math.sin(theta);
    const rho = Math.hypot(z, y);
    const xf = -centerThick / 2 + sagFrontFn(rho);
    const xb = centerThick / 2 + sagBackFn(rho);
    positions.push(xf, y, z);
    positions.push(xb, y, z);
  }
  for (let ia = 0; ia < angleSteps; ia++) {
    const next = (ia + 1) % angleSteps;
    const f0 = rimBase + ia * 2;
    const b0 = f0 + 1;
    const f1 = rimBase + next * 2;
    const b1 = f1 + 1;
    indices.push(f0, b0, b1, f0, b1, f1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a D-Cut (Double-D Stadium-Clipped Circle) thin extruded collar / baffle plate
 * oriented in the YZ plane, extruded along X.
 */
function createDCutRingMesh(rOut, hOut, rIn, hIn, thicknessX, mat) {
  const makeDCutPts = (R, H, steps = 64) => {
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const absSin = Math.abs(Math.sin(th));
      const r = absSin < 1e-5 ? R : Math.min(R, H / absSin);
      pts.push(new THREE.Vector2(r * Math.cos(th), r * Math.sin(th)));
    }
    return pts;
  };

  const shape = new THREE.Shape(makeDCutPts(rOut, hOut, 64));
  const hole = new THREE.Path(makeDCutPts(rIn, hIn, 64).reverse());
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thicknessX,
    bevelEnabled: false,
    curveSegments: 24
  });
  geo.center();
  // ExtrudeGeometry builds shape in XY and extrudes along +Z -> rotate Y by +90° so shape lies in YZ and extrudes along X!
  geo.rotateY(Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

/**
 * Helper to create a rounded rectangular frame with an inner rectangular hole (in XZ plane, extruded Y)
 */
function createRectFrameXZ(outW, outD, inW, inD, heightY, mat, holeOffsetX = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(-outW / 2, -outD / 2);
  shape.lineTo(outW / 2, -outD / 2);
  shape.lineTo(outW / 2, outD / 2);
  shape.lineTo(-outW / 2, outD / 2);
  shape.closePath();

  const hole = new THREE.Path();
  const hx0 = holeOffsetX - inW / 2;
  const hx1 = holeOffsetX + inW / 2;
  hole.moveTo(hx0, -inD / 2);
  hole.lineTo(hx0, inD / 2);
  hole.lineTo(hx1, inD / 2);
  hole.lineTo(hx1, -inD / 2);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: heightY, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -heightY / 2, 0);
  return new THREE.Mesh(geo, mat);
}

/**
 * Helper to create a vertical rectangular frame in the YZ plane with an inner cutout (extruded along X)
 */
function createRectFrameYZ(outW_Z, outH_Y, inW_Z, inH_Y, thickX, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(-outW_Z / 2, -outH_Y / 2);
  shape.lineTo(outW_Z / 2, -outH_Y / 2);
  shape.lineTo(outW_Z / 2, outH_Y / 2);
  shape.lineTo(-outW_Z / 2, outH_Y / 2);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-inW_Z / 2, -inH_Y / 2);
  hole.lineTo(-inW_Z / 2, inH_Y / 2);
  hole.lineTo(inW_Z / 2, inH_Y / 2);
  hole.lineTo(inW_Z / 2, -inH_Y / 2);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickX, bevelEnabled: false });
  geo.center();
  geo.rotateY(Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

/**
 * Builds the ULTRA-PRECISION Phase 5 Dissection Assembly:
 * Periscope Telephoto Prism Mechanism (28 Independent Dissectable Parts, 1 unit = 1 mm)
 * - Optical path enters vertically downward (+Y -> -Y) at X = -8.8, folds 90° along +X via 45° High-Index Prism,
 *   threads through Fixed G1 + Floating D-Cut HOYA FCD100 APO & Tele-Macro lenses (G2..G5) on twin V-groove
 *   stainless rails + 6 ZrO2 balls, and focuses onto a 90° Vertical 1/1.4" 200MP CMOS Sensor at X = +10.25!
 */
export function buildPeriscopePrismAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const register = (id, group, explodeVec, opts = {}) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      oisMoving: Boolean(opts.oisMoving),
      afMoving: Boolean(opts.afMoving),
      prismTiltMoving: Boolean(opts.prismTiltMoving),
      afBallRolling: Boolean(opts.afBallRolling)
    });
    return group;
  };

  // Master Spatial Coordinates (1 unit = 1 mm)
  const PRISM_X = -8.8; // Prism center (top face Y=+3.0, exit face X=-5.8, hypotenuse from (-11.8,+3.0) to (-5.8,-3.0))
  const PRISM_LEG = 6.0;
  const PRISM_HALF = PRISM_LEG / 2; // 3.0
  const PRISM_W_Z = 6.6;

  // =========================================================================
  // 01. OUTER EMI MAGNETIC SHIELD CAN (Non-Magnetic SUS304, L-Cutaway Showcase)
  // =========================================================================
  {
    const g = new THREE.Group();
    const L = 26.8; // X in [-14.2, +12.6] -> center X = -0.8
    const CX = -0.8;
    const W = 13.2; // Z in [-6.6, +6.6]
    const H = 8.65; // Y in [-4.32, +4.33]
    const T = 0.22;

    // Top deck: Left prism section (X in [-14.2, -4.4]) full-width with rectangular entrance cutout,
    // plus Rear half-roof strip (X in [-4.4, +12.6], Z in [-6.6, -1.2]) leaving front-top open to showcase D-cut APO lenses & vertical 200MP sensor!
    const prismRoofL = 9.8; // X in [-14.2, -4.4] -> center -9.3 (hole at -8.8 -> offset +0.5)
    const topDeckPrism = createRectFrameXZ(prismRoofL, W, 7.2, 7.6, T, mats.susSteel, PRISM_X - (-9.3));
    topDeckPrism.position.set(-9.3, H / 2 - T / 2, 0);
    g.add(topDeckPrism);

    const topDeckRear = new THREE.Mesh(new THREE.BoxGeometry(17.0, T, 5.4), mats.susSteel);
    topDeckRear.position.set(4.1, H / 2 - T / 2, -W / 2 + 2.7);
    g.add(topDeckRear);

    // Rear wall (-Z full length)
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(L, H, T), mats.susSteel);
    rearWall.position.set(CX, 0, -W / 2 + T / 2);
    g.add(rearWall);

    // Left end wall (-X behind prism bay)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(T, H, W), mats.susSteel);
    leftWall.position.set(CX - L / 2 + T / 2, 0, 0);
    g.add(leftWall);

    // Right end wall (+X behind vertical heatsink — rear half cutaway so copper heatsink fins gleam!)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(T, H, W * 0.56), mats.susSteel);
    rightWall.position.set(CX + L / 2 - T / 2, 0, -W * 0.22);
    g.add(rightWall);

    // Front (+Z) sleek cutaway lower trim skirt & left prism frame pillar (wide open window for clear interior view!)
    const frontPrismTopLip = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.64, T), mats.susSteel);
    frontPrismTopLip.position.set(-9.3, H / 2 - 0.32, W / 2 - T / 2);
    const frontBotLip = new THREE.Mesh(new THREE.BoxGeometry(L, 0.52, T), mats.susSteel);
    frontBotLip.position.set(CX, -H / 2 + 0.26, W / 2 - T / 2);
    const frontLeftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.05, H, T), mats.susSteel);
    frontLeftPillar.position.set(CX - L / 2 + 0.53, 0, W / 2 - T / 2);
    g.add(frontPrismTopLip, frontBotLip, frontLeftPillar);

    // Grounding EMI solder fingers along bottom edge
    for (let x = -12.4; x <= 11.0; x += 3.9) {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.36, 0.28), mats.goldBond);
      tab.position.set(x, -H / 2 + 0.18, -W / 2 - 0.04);
      g.add(tab);
    }

    register('peri_emi_shield', g, [0, 10.6, 0]);
  }

  // =========================================================================
  // 02. ENTRANCE AR WINDOW & RECTANGULAR GLARE-STOP APERTURE MASK
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(PRISM_X, 4.38, 0);

    // Outer chamfered PVD bezel around the rectangular periscope window
    const bezel = createRectFrameXZ(7.7, 8.1, 6.4, 6.8, 0.38, mats.decoBezelPvd, 0);
    g.add(bezel);

    // Crystal Gorilla Glass DX+ entrance window pane
    const glass = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 7.2), mats.decoGorillaDx);
    glass.position.y = 0.02;
    g.add(glass);

    // Top ultra-broadband green/cyan AR interference coat
    const arFilm = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.04, 6.9), mats.periArGreenCoat);
    arFilm.position.y = 0.18;
    g.add(arFilm);

    // Inner matte-black rectangular flare-stop mask sitting just beneath the glass
    const mask = createRectFrameXZ(7.0, 7.4, 5.7, 6.1, 0.16, mats.lensEdgeBlack, 0);
    mask.position.y = -0.22;
    g.add(mask);

    register('peri_entrance_window', g, [-1.5, 12.6, 0]);
  }

  // =========================================================================
  // 03. MATTE-BLACK LCP OPTICAL TUNNEL HOUSING & 14 KNIFE-EDGE BAFFLES
  // =========================================================================
  {
    const g = new THREE.Group();
    const CX = -0.8;
    const L = 25.4; // X in [-13.5, +11.9]
    const W = 12.2; // Z in [-6.1, +6.1]
    const H = 7.9;  // Y in [-3.95, +3.95]

    // Rear longitudinal structural spine (-Z side)
    const rearBulkhead = new THREE.Mesh(new THREE.BoxGeometry(L, H, 0.42), mats.lcpBlack);
    rearBulkhead.position.set(CX, 0, -W / 2 + 0.21);
    g.add(rearBulkhead);

    // Top ceiling wall: prism bay collar + rear half-ceiling strip (matching EMI L-cutaway!)
    const ceilingPrism = createRectFrameXZ(8.8, W, 6.9, 7.3, 0.34, mats.lcpBlack, PRISM_X - (-9.1));
    ceilingPrism.position.set(-9.1, H / 2 - 0.17, 0);
    const ceilingRear = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.34, 4.9), mats.lcpBlack);
    ceilingRear.position.set(3.6, H / 2 - 0.17, -W / 2 + 2.45);
    g.add(ceilingPrism, ceilingRear);

    // Floor structural web (cutout under prism pitch coil & linear actuator zone)
    const floorLeft = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.32, W), mats.lcpBlack);
    floorLeft.position.set(-11.9, -H / 2 + 0.16, 0);
    const floorMidRear = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.32, 3.2), mats.lcpBlack);
    floorMidRear.position.set(-0.8, -H / 2 + 0.16, -W / 2 + 1.6);
    const floorMidFront = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.32, 2.2), mats.lcpBlack);
    floorMidFront.position.set(-0.8, -H / 2 + 0.16, W / 2 - 1.1);
    const floorRight = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.32, W), mats.lcpBlack);
    floorRight.position.set(10.3, -H / 2 + 0.16, 0);
    g.add(floorLeft, floorMidRear, floorMidFront, floorRight);

    // Left end-stop bulkhead behind prism gimbal
    const leftEnd = new THREE.Mesh(new THREE.BoxGeometry(0.55, H, W), mats.lcpBlack);
    leftEnd.position.set(CX - L / 2 + 0.28, 0, 0);
    g.add(leftEnd);

    // 14 Precision Sawtooth Knife-Edge Stray-Light Baffle Ribs lining rear ceiling & rear tunnel interior!
    for (let i = 0; i < 14; i++) {
      const rx = -4.6 + i * 0.94;
      // Rear ceiling knife-edge rib (matches cutaway ceiling!)
      const topRib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 4.2), mats.lensEdgeBlack);
      topRib.position.set(rx, H / 2 - 0.56, -W / 2 + 2.35);
      topRib.rotation.z = 0.24; // Angled sawtooth light-trap face!
      g.add(topRib);

      // Rear inner wall vertical knife-edge rib (visible inside cutaway tunnel)
      const rearRib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 6.2, 0.32), mats.lensEdgeBlack);
      rearRib.position.set(rx, 0, -4.18);
      rearRib.rotation.y = -0.22;
      g.add(rearRib);
    }

    // Rear-half partition rib framing fixed G1 front lens bay (open on +Z front so optical ray & prism exit stay 100% unobstructed!)
    const g1WallRear = new THREE.Mesh(new THREE.BoxGeometry(0.38, H - 0.7, 2.2), mats.lcpBlack);
    g1WallRear.position.set(-4.95, 0, -4.65);
    g.add(g1WallRear);

    register('peri_lcp_housing', g, [0, -5.2, -3.2]);
  }

  // =========================================================================
  // 04. HIGH-RIGIDITY SUS BASEPLATE & GRAPHITE THERMAL SHEET
  // =========================================================================
  {
    const g = new THREE.Group();
    const CX = -0.8;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.32, 12.8), mats.susSteel);
    plate.position.set(CX, -4.18, 0);
    g.add(plate);

    // Underside artificial graphite thermal spreader sheet
    const graphite = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.10, 11.6), mats.graphiteSheet);
    graphite.position.set(CX, -4.39, 0);
    g.add(graphite);

    // 4 precision datum mounting bosses at corners
    for (const [bx, bz] of [[-13.3, -5.7], [-13.3, 5.7], [11.7, -5.7], [11.7, 5.7]]) {
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.44, 20), mats.susSteel);
      boss.position.set(bx, -4.12, bz);
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 16), mats.susDarkInner);
      hole.position.set(bx, -4.12, bz);
      g.add(boss, hole);
    }

    register('peri_base_plate', g, [0, -8.2, 0]);
  }

  // =========================================================================
  // 05. HIGH-INDEX GLASS 45° RIGHT-ANGLE TIR PRISM (H-ZF52/L-LAH58 n=1.85)
  //     Group anchored directly at (PRISM_X, 0, 0) for rigid-body 2-axis OIS tilt!
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(PRISM_X, 0, 0);

    // Chamfered 45° right-angle prism cross-section in XY:
    // Top-left (-3, +3), Top-right (+3, +3), Bottom-right (+3, -3)
    const c = 0.22; // precision optical bevel chamfer
    const tri = new THREE.Shape();
    tri.moveTo(-PRISM_HALF + c, PRISM_HALF);
    tri.lineTo(PRISM_HALF - c, PRISM_HALF);
    tri.lineTo(PRISM_HALF, PRISM_HALF - c);
    tri.lineTo(PRISM_HALF, -PRISM_HALF + c);
    tri.lineTo(PRISM_HALF - c, -PRISM_HALF);
    tri.lineTo(-PRISM_HALF, PRISM_HALF - c);
    tri.closePath();

    const prismGeo = new THREE.ExtrudeGeometry(tri, {
      depth: PRISM_W_Z,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2
    });
    prismGeo.translate(0, 0, -PRISM_W_Z / 2);

    const prismMesh = new THREE.Mesh(prismGeo, mats.periPrismGlass);
    g.add(prismMesh);

    // Crisp subtle glass refraction edge wireframe highlight so the crystal prism silhouette gleams against white CAD!
    const edgeGeo = new THREE.EdgesGeometry(prismGeo, 25);
    const edgeLine = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.52,
        clippingPlanes: mats.periPrismGlass.clippingPlanes
      })
    );
    edgeLine.userData.ignorePick = true;
    g.add(edgeLine);

    register('peri_tir_prism', g, [-4.2, 4.4, 0], { prismTiltMoving: true });
  }

  // =========================================================================
  // 06. 45° HYPOTENUSE PROTECTED SILVER (Ag) + DIELECTRIC MIRROR COATING
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(PRISM_X, 0, 0);

    const hypLen = Math.SQRT2 * (PRISM_LEG - 0.18); // ~8.23 mm
    // Mirror plate lies along x + y = 0, shifted slightly along outward normal (-1/sqrt2, -1/sqrt2)
    const offset = 0.11;
    const mirrorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(hypLen, 0.14, PRISM_W_Z - 0.12),
      mats.periSilverMirror
    );
    mirrorPlate.rotation.z = -Math.PI / 4;
    mirrorPlate.position.set(-offset * Math.SQRT1_2, -offset * Math.SQRT1_2, 0);
    g.add(mirrorPlate);

    // Ultra-thin iridescent dielectric enhancement film on inner side of Ag mirror
    const dielectricFilm = new THREE.Mesh(
      new THREE.BoxGeometry(hypLen - 0.12, 0.03, PRISM_W_Z - 0.24),
      mats.ircfCoating
    );
    dielectricFilm.rotation.z = -Math.PI / 4;
    dielectricFilm.position.set(-0.02 * Math.SQRT1_2, -0.02 * Math.SQRT1_2, 0);
    g.add(dielectricFilm);

    register('peri_silver_mirror', g, [-6.4, 1.8, 0], { prismTiltMoving: true });
  }

  // =========================================================================
  // 07. ENTRANCE/EXIT BROADBAND AR COATINGS & BLACKENED STRAY-LIGHT SIDES
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(PRISM_X, 0, 0);

    // Top horizontal entrance face broadband AR coating
    const topAr = new THREE.Mesh(
      new THREE.BoxGeometry(PRISM_LEG - 0.45, 0.06, PRISM_W_Z - 0.35),
      mats.periArGreenCoat
    );
    topAr.position.set(0, PRISM_HALF + 0.08, 0);
    g.add(topAr);

    // Right vertical exit face broadband AR coating
    const exitAr = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, PRISM_LEG - 0.45, PRISM_W_Z - 0.35),
      mats.periArGreenCoat
    );
    exitAr.position.set(PRISM_HALF + 0.08, 0, 0);
    g.add(exitAr);

    // Matte-black light-absorbing protective backing coat behind the Ag mirror
    const hypLen = Math.SQRT2 * (PRISM_LEG - 0.15);
    const backCoat = new THREE.Mesh(
      new THREE.BoxGeometry(hypLen, 0.12, PRISM_W_Z - 0.05),
      mats.lensEdgeBlack
    );
    backCoat.rotation.z = -Math.PI / 4;
    backCoat.position.set(-0.24 * Math.SQRT1_2, -0.24 * Math.SQRT1_2, 0);
    g.add(backCoat);

    // Blackened non-optical chamfer trim strips along outer rear triangular edges (front Z left clean for cutaway optics view!)
    const rearTri = new THREE.Shape();
    rearTri.moveTo(-PRISM_HALF + 0.15, PRISM_HALF - 0.1);
    rearTri.lineTo(PRISM_HALF - 0.1, PRISM_HALF - 0.1);
    rearTri.lineTo(PRISM_HALF - 0.1, -PRISM_HALF + 0.15);
    rearTri.closePath();
    const rearBlackFilm = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rearTri, { depth: 0.08, bevelEnabled: false }),
      mats.lensEdgeBlack
    );
    rearBlackFilm.position.z = -PRISM_W_Z / 2 - 0.12;
    g.add(rearBlackFilm);

    register('peri_prism_coatings', g, [-5.2, 6.2, 0], { prismTiltMoving: true });
  }

  // =========================================================================
  // 08. MOVING PRISM CRADLE HOLDER (2-Axis Tilt OIS Carrier)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(PRISM_X, 0, 0);

    // Main 45° diagonal cradle bed backing behind the prism hypotenuse
    const cradleLen = Math.SQRT2 * PRISM_LEG + 0.4;
    const cradleBack = new THREE.Mesh(
      new THREE.BoxGeometry(cradleLen, 0.42, PRISM_W_Z + 1.1),
      mats.lensCarrierBody
    );
    cradleBack.rotation.z = -Math.PI / 4;
    cradleBack.position.set(-0.56 * Math.SQRT1_2, -0.56 * Math.SQRT1_2, 0);
    g.add(cradleBack);

    // Sculpted rear cheek wall (-Z side) holding prism snugly without blocking front cutaway view
    const cheekShape = new THREE.Shape();
    cheekShape.moveTo(-PRISM_HALF - 0.45, PRISM_HALF + 0.15);
    cheekShape.lineTo(PRISM_HALF + 0.15, PRISM_HALF + 0.15);
    cheekShape.lineTo(PRISM_HALF + 0.15, -PRISM_HALF - 0.45);
    cheekShape.lineTo(-PRISM_HALF - 0.45, -PRISM_HALF - 0.45);
    cheekShape.closePath();
    const cheekGeo = new THREE.ExtrudeGeometry(cheekShape, { depth: 0.45, bevelEnabled: false });
    const rearCheek = new THREE.Mesh(cheekGeo, mats.lensCarrierBody);
    rearCheek.position.z = -PRISM_W_Z / 2 - 0.65;
    g.add(rearCheek);

    // Minimalist front retainer clips (+Z side) so glass prism remains 95% exposed & crystal clear
    const frontTopClip = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.34, 0.35), mats.lensCarrierBody);
    frontTopClip.position.set(0.2, PRISM_HALF + 0.14, PRISM_W_Z / 2 + 0.22);
    const frontHypClip = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.36, 0.38), mats.lensCarrierBody);
    frontHypClip.rotation.z = -Math.PI / 4;
    frontHypClip.position.set(-0.45, -0.45, PRISM_W_Z / 2 + 0.24);
    g.add(frontTopClip, frontHypClip);

    // Integrated lower & back-left magnet mounting wings
    const botWing = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.32, PRISM_W_Z + 0.4), mats.lensCarrierBody);
    botWing.position.set(-0.4, -PRISM_HALF - 0.28, 0);
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 4.6, PRISM_W_Z + 0.4), mats.lensCarrierBody);
    leftWing.position.set(-PRISM_HALF - 0.35, -0.3, 0);
    g.add(botWing, leftWing);

    // Stainless steel reinforcement rib embedded along hypotenuse spine
    const susRib = new THREE.Mesh(new THREE.BoxGeometry(cradleLen - 0.6, 0.16, 1.4), mats.susSteel);
    susRib.rotation.z = -Math.PI / 4;
    susRib.position.set(-0.84 * Math.SQRT1_2, -0.84 * Math.SQRT1_2, 0);
    g.add(susRib);

    register('peri_prism_holder', g, [-7.0, -0.6, 0], { prismTiltMoving: true });
  }

  // =========================================================================
  // 09. 2-AXIS UNIVERSAL GIMBAL FRAME & ZrO2 CERAMIC FULCRUM PIVOT BALLS
  // =========================================================================
  {
    const g = new THREE.Group();
    // Anchored directly behind the diagonal cradle at (-10.85, -1.75, 0)
    g.position.set(PRISM_X - 2.05, -1.65, 0);

    // Nested outer gimbal ring (Yaw axis frame) tilted parallel to hypotenuse
    const outerFrame = new THREE.Group();
    outerFrame.rotation.z = -Math.PI / 4;

    const ringOuter = createRectFrameXZ(4.4, 5.2, 3.3, 4.1, 0.34, mats.periHardenedRail, 0);
    outerFrame.add(ringOuter);

    // Inner gimbal cross-yoke (Pitch axis frame)
    const ringInner = createRectFrameXZ(3.0, 3.8, 2.0, 2.8, 0.28, mats.susSteel, 0);
    ringInner.position.y = 0.06;
    outerFrame.add(ringInner);

    // Cross pivot axle pins (Pitch along Z, Yaw along local X)
    const pitchPin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5.4, 16), mats.goldBond);
    pitchPin.rotation.x = Math.PI / 2;
    const yawPin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.6, 16), mats.goldBond);
    yawPin.rotation.z = Math.PI / 2;
    outerFrame.add(pitchPin, yawPin);

    // 3 Gleaming White Y-TZP ZrO2 Ceramic Fulcrum & Support Balls (zero-backlash spherical pivot!)
    const ballGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const ballCoords = [
      [0, 0.32, 0],       // Central spherical fulcrum ball
      [0, -0.26, -1.95],  // Rear Yaw support ball
      [0, -0.26, 1.95]    // Front Yaw support ball
    ];
    for (const [bx, by, bz] of ballCoords) {
      const ball = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      ball.position.set(bx, by, bz);
      outerFrame.add(ball);
    }

    // Fixed triangular pedestal bracket anchoring gimbal to the housing corner
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 5.6), mats.susDarkInner);
    bracket.position.set(-0.95, -0.95, 0);
    g.add(outerFrame, bracket);

    register('peri_gimbal_pivot', g, [-9.2, -2.4, 0]);
  }

  // =========================================================================
  // 10. PRISM 2-AXIS OIS N52 NEODYMIUM MAGNETS & MAGNETIC PRELOAD YOKE
  // =========================================================================
  {
    const g = new THREE.Group();

    // Pitch-axis Dual-Pole N52 Magnet under prism bay (X = -8.8, Y = -3.32)
    const pitchMagN = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.44, 5.2), mats.lensMagnetN);
    pitchMagN.position.set(PRISM_X - 1.0, -3.34, 0);
    const pitchMagS = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.44, 5.2), mats.lensMagnetS);
    pitchMagS.position.set(PRISM_X + 1.0, -3.34, 0);
    const pitchSlit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 5.2), mats.magnetSlit);
    pitchSlit.position.set(PRISM_X, -3.34, 0);
    g.add(pitchMagN, pitchMagS, pitchSlit);

    // Yaw-axis Dual-Pole N52 Magnet on left-back face (-X = -12.35)
    const yawMagN = new THREE.Mesh(new THREE.BoxGeometry(0.46, 3.6, 2.3), mats.lensMagnetN);
    yawMagN.position.set(PRISM_X - 3.65, 0.4, -1.25);
    const yawMagS = new THREE.Mesh(new THREE.BoxGeometry(0.46, 3.6, 2.3), mats.lensMagnetS);
    yawMagS.position.set(PRISM_X - 3.65, 0.4, 1.25);
    const yawSlit = new THREE.Mesh(new THREE.BoxGeometry(0.47, 3.6, 0.16), mats.magnetSlit);
    yawSlit.position.set(PRISM_X - 3.65, 0.4, 0);
    g.add(yawMagN, yawMagS, yawSlit);

    // Permalloy Magnetic Return Yoke + Zero-Backlash Preload Attraction Plate ("Pulling Plate")
    const botYoke = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 5.6), mats.yokePermalloy);
    botYoke.position.set(PRISM_X, -3.65, 0);
    const leftYoke = new THREE.Mesh(new THREE.BoxGeometry(0.20, 4.1, 5.2), mats.yokePermalloy);
    leftYoke.position.set(PRISM_X - 4.02, 0.4, 0);
    const pullPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.20, 3.6), mats.yokePermalloy);
    pullPlate.rotation.z = -Math.PI / 4;
    pullPlate.position.set(PRISM_X - 2.65, -2.15, 0);
    g.add(botYoke, leftYoke, pullPlate);

    register('peri_ois_magnets_yoke', g, [-7.8, -5.0, 0]);
  }

  // =========================================================================
  // 11. PITCH & YAW 2-AXIS PRISM-TILT OIS VOICE COILS + COIL FPC
  // =========================================================================
  {
    const g = new THREE.Group();

    // Helper for racetrack copper coil
    const makeCoil = (w, d, h, holeW, holeD) => createRectFrameXZ(w, d, holeW, holeD, h, mats.copperCoil, 0);

    // Pitch OIS Coil lying horizontally under the bottom Pitch magnet
    const pitchCoil = makeCoil(4.2, 5.1, 0.34, 1.5, 2.6);
    pitchCoil.position.set(PRISM_X, -3.86, 0);
    g.add(pitchCoil);

    // Yaw OIS Coil standing vertically on left side (-X = -12.95) facing Yaw magnet
    const yawCoil = createRectFrameYZ(4.9, 3.7, 2.3, 1.4, 0.34, mats.copperCoil);
    yawCoil.position.set(PRISM_X - 4.32, 0.4, 0);
    g.add(yawCoil);

    // Amber polyimide OIS coil FPC linking both Pitch & Yaw coils around the corner
    const fpcHoriz = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.08, 5.5), mats.fpcPolyimide);
    fpcHoriz.position.set(PRISM_X - 0.5, -4.02, 0);
    const fpcVert = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.8, 5.5), mats.fpcPolyimide);
    fpcVert.position.set(PRISM_X - 4.55, -0.8, 0);
    g.add(fpcHoriz, fpcVert);

    register('peri_ois_tilt_coils', g, [-5.4, -6.2, 2.4]);
  }

  // =========================================================================
  // 12. 2-AXIS CLOSED-LOOP PITCH & YAW HALL / TMR ANGLE SENSORS
  // =========================================================================
  {
    const g = new THREE.Group();

    // Pitch angle Hall/TMR IC nestled inside center air cavity of Pitch OIS coil
    const pitchHall = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.82), mats.hallSensorEmerald);
    pitchHall.position.set(PRISM_X, -3.86, 0);
    const pitchPad = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.05), mats.goldBond);
    pitchPad.position.set(PRISM_X, -3.98, 0);
    g.add(pitchHall, pitchPad);

    // Yaw angle Hall/TMR IC nestled inside center air cavity of Yaw OIS coil
    const yawHall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.82, 0.82), mats.hallSensorEmerald);
    yawHall.position.set(PRISM_X - 4.32, 0.4, 0);
    const yawPad = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.05), mats.goldBond);
    yawPad.position.set(PRISM_X - 4.46, 0.4, 0);
    g.add(yawHall, yawPad);

    register('peri_ois_hall_sensors', g, [-4.4, -7.4, 3.6]);
  }

  // =========================================================================
  // 13. G1 FIXED FRONT LARGE-APERTURE D-CUT GLASS ASPHERIC LENS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-4.35, 0, 0);

    // Biconvex positive gathering element (rOuter = 3.65, hCut = 2.85)
    const g1Geo = createDCutLensGeometry(
      3.55,
      2.76,
      1.02,
      (rho) => 0.032 * rho * rho - 0.0005 * Math.pow(rho, 4),   // convex front (-X bulges left)
      (rho) => -0.022 * rho * rho + 0.0003 * Math.pow(rho, 4)   // gently convex back (+X bulges right)
    );
    const g1Lens = new THREE.Mesh(g1Geo, mats.lensGlass1G);
    g.add(g1Lens);

    // Blackened D-cut outer mounting collar framing G1
    const g1Collar = createDCutRingMesh(3.88, 3.04, 3.48, 2.70, 0.78, mats.lensEdgeBlack);
    g.add(g1Collar);

    register('peri_g1_front_dcut', g, [-2.2, 4.8, 0]);
  }

  // =========================================================================
  // 14. G2 HOYA FCD100 FLUORITE-GRADE ULTRA-LOW-DISPERSION (ED) D-CUT LENS
  //     (Signature Aquamarine Fluorite ED Element — Floating APO Group!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-1.35, 0, 0);

    const g2Geo = createDCutLensGeometry(
      3.52,
      2.72,
      1.12,
      (rho) => 0.036 * rho * rho - 0.0006 * Math.pow(rho, 4),
      (rho) => -0.028 * rho * rho + 0.0004 * Math.pow(rho, 4)
    );
    const g2Lens = new THREE.Mesh(g2Geo, mats.periFcd100Glass);
    g.add(g2Lens);

    // Subtle fluorite rim chamfer collar
    const g2Collar = createDCutRingMesh(3.78, 2.94, 3.46, 2.68, 0.64, mats.lensEdgeBlack);
    g.add(g2Collar);

    register('peri_g2_fcd100_ed', g, [-0.8, 6.2, 0], { afMoving: true });
  }

  // =========================================================================
  // 15. G3 HIGH-INDEX FLINT CHROMATIC-CORRECTOR D-CUT CONCAVE LENS (APO Pair)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(0.45, 0, 0);

    // Biconcave / meniscus high-dispersion flint element pairing with FCD100
    const g3Geo = createDCutLensGeometry(
      3.42,
      2.66,
      0.56,
      (rho) => -0.026 * rho * rho + 0.0004 * Math.pow(rho, 4),
      (rho) => 0.024 * rho * rho - 0.0003 * Math.pow(rho, 4)
    );
    const g3Lens = new THREE.Mesh(g3Geo, mats.lensResinFlint);
    g.add(g3Lens);

    const g3Collar = createDCutRingMesh(3.72, 2.90, 3.36, 2.60, 0.72, mats.lensEdgeBlack);
    g.add(g3Collar);

    register('peri_g3_flint_dcut', g, [0.8, 5.2, 0], { afMoving: true });
  }

  // =========================================================================
  // 16. G4 FLOATING TELE-MACRO ASPHERIC D-CUT LENS ELEMENT
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(2.45, 0, 0);

    // High-order meniscus focusing element
    const g4Geo = createDCutLensGeometry(
      3.52,
      2.72,
      0.92,
      (rho) => 0.044 * rho * rho - 0.0014 * Math.pow(rho, 4),
      (rho) => 0.016 * rho * rho - 0.0009 * Math.pow(rho, 4)
    );
    const g4Lens = new THREE.Mesh(g4Geo, mats.lensResinApel);
    g.add(g4Lens);

    const g4Collar = createDCutRingMesh(3.80, 2.94, 3.46, 2.68, 0.68, mats.lensEdgeBlack);
    g.add(g4Collar);

    register('peri_g4_floating_macro', g, [2.4, 6.2, 0], { afMoving: true });
  }

  // =========================================================================
  // 17. G5 REAR FIELD-FLATTENER D-CUT GULLWING ASPHERIC LENS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(4.45, 0, 0);

    // Classic gullwing inflection profile flattening telephoto image circle onto 1/1.4" sensor
    const g5Geo = createDCutLensGeometry(
      3.78,
      2.82,
      0.86,
      (rho) => -0.022 * rho * rho + 0.0022 * Math.pow(rho, 4),
      (rho) => 0.032 * rho * rho - 0.0020 * Math.pow(rho, 4)
    );
    const g5Lens = new THREE.Mesh(g5Geo, mats.lensResinGullwing);
    g.add(g5Lens);

    const g5Collar = createDCutRingMesh(4.02, 3.04, 3.72, 2.76, 0.66, mats.lensEdgeBlack);
    g.add(g5Collar);

    register('peri_g5_rear_flattener', g, [4.0, 4.8, 0], { afMoving: true });
  }

  // =========================================================================
  // 18. D-CUT INTER-LENS MATTE-BLACK SHADING BAFFLES & AIR-GAP SPACERS (×4)
  // =========================================================================
  {
    const g = new THREE.Group();
    const baffleSpecs = [
      { x: -2.02, rIn: 3.18, hIn: 2.48 },
      { x: -0.45, rIn: 3.08, hIn: 2.40 },
      { x: 1.45, rIn: 3.12, hIn: 2.44 },
      { x: 3.48, rIn: 3.30, hIn: 2.54 }
    ];
    for (const b of baffleSpecs) {
      const sheet = createDCutRingMesh(3.86, 2.98, b.rIn, b.hIn, 0.10, mats.lensEdgeBlack);
      sheet.position.x = b.x;
      g.add(sheet);
    }

    register('peri_dcut_baffles', g, [1.4, 3.2, 2.8], { afMoving: true });
  }

  // =========================================================================
  // 19. FLOATING LINEAR D-CUT LENS BARREL CARRIAGE (Front +Z Cutaway)
  // =========================================================================
  {
    const g = new THREE.Group();
    const BX = 1.62;
    const BL = 7.45; // X in [-2.10, +5.35]

    // Top flat D-cut bridge roof (rear half cutaway so flat-top D-cut crowns of FCD100 ED & APO lenses gleam!)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(BL, 0.34, 3.6), mats.lensLcpBarrel);
    roof.position.set(BX, 3.16, -2.3);
    g.add(roof);

    // Bottom flat D-cut bridge floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(BL, 0.34, 8.2), mats.lensLcpBarrel);
    floor.position.set(BX, -3.16, 0);
    g.add(floor);

    // Rear curved/boxed carriage spine (-Z side) with machined V-groove bearing shoes!
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(BL, 6.66, 0.56), mats.lensLcpBarrel);
    rearWall.position.set(BX, 0, -4.12);
    g.add(rearWall);

    // Twin precision bearing race blocks protruding cleanly toward rear rail (-Z) & front-bottom rail (+Z)
    const rearShoe = new THREE.Mesh(new THREE.BoxGeometry(BL - 0.5, 0.85, 0.72), mats.lensCarrierBody);
    rearShoe.position.set(BX, -2.95, -4.46);
    const rearUpperShoe = new THREE.Mesh(new THREE.BoxGeometry(BL - 0.5, 0.72, 0.65), mats.lensCarrierBody);
    rearUpperShoe.position.set(BX, 2.95, -4.44);
    const frontShoe = new THREE.Mesh(new THREE.BoxGeometry(BL - 0.5, 0.64, 0.78), mats.lensCarrierBody);
    frontShoe.position.set(BX, -2.95, 4.38);
    g.add(rearShoe, rearUpperShoe, frontShoe);

    // Front (+Z) cutaway structural end-flanges framing G2 front & G5 rear while exposing all 4 glowing D-cut lenses!
    const frontLip = createDCutRingMesh(4.12, 3.30, 3.55, 2.75, 0.36, mats.lensLcpBarrel);
    frontLip.position.set(-2.08, 0, 0);
    const rearLip = createDCutRingMesh(4.24, 3.30, 3.82, 2.86, 0.36, mats.lensLcpBarrel);
    rearLip.position.set(5.32, 0, 0);
    g.add(frontLip, rearLip);

    // Linear VCM Coil mounting flange on rear spine (-Z = -4.65)
    const coilMount = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.6, 0.24), mats.lensCarrierBody);
    coilMount.position.set(BX, 0, -4.52);
    g.add(coilMount);

    register('peri_floating_barrel', g, [1.5, -2.4, 0], { afMoving: true });
  }

  // =========================================================================
  // 20. HARDENED STAINLESS TWIN V-GROOVE LINEAR GUIDE RAILS (SUS440C × 2)
  // =========================================================================
  {
    const g = new THREE.Group();
    const RAIL_X = 1.65;
    const RAIL_L = 12.2; // X in [-4.45, +7.75]

    // Main Rear-Bottom V-Groove Rail (-Z = -4.92, Y = -3.38)
    const makeRail = (y, z, isVGroove) => {
      const rg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(RAIL_L, 0.42, 0.72), mats.periHardenedRail);
      rg.add(body);
      if (isVGroove) {
        // Two chamfered 45° inner V-groove flanks
        const v1 = new THREE.Mesh(new THREE.BoxGeometry(RAIL_L, 0.26, 0.16), mats.susDarkInner);
        v1.position.set(0, 0.22, -0.18);
        v1.rotation.x = Math.PI / 4;
        const v2 = new THREE.Mesh(new THREE.BoxGeometry(RAIL_L, 0.26, 0.16), mats.susDarkInner);
        v2.position.set(0, 0.22, 0.18);
        v2.rotation.x = -Math.PI / 4;
        rg.add(v1, v2);
      } else {
        // Flat anti-overconstraint kinematic raceway
        const flatStrip = new THREE.Mesh(new THREE.BoxGeometry(RAIL_L, 0.08, 0.44), mats.susDarkInner);
        flatStrip.position.set(0, 0.23, 0);
        rg.add(flatStrip);
      }
      rg.position.set(RAIL_X, y, z);
      return rg;
    };

    // Main V-groove rail (rear-bottom), secondary flat rail (front-bottom — super visible in cutaway!), plus rear-top stabilizing rail
    g.add(makeRail(-3.54, -4.68, true));
    g.add(makeRail(-3.54, 4.55, false));
    g.add(makeRail(3.48, -4.68, true));

    // Precision end-stop bumpers at both rail ends
    for (const ex of [RAIL_X - RAIL_L / 2 - 0.14, RAIL_X + RAIL_L / 2 + 0.14]) {
      const stop1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.86), mats.lensDamperGel);
      stop1.position.set(ex, -3.45, -4.68);
      const stop2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.86), mats.lensDamperGel);
      stop2.position.set(ex, -3.45, 4.55);
      g.add(stop1, stop2);
    }

    register('peri_linear_rails', g, [1.4, -4.4, -2.6]);
  }

  // =========================================================================
  // 21. 6× Y-TZP ZrO2 CERAMIC LINEAR GUIDE BALLS (Rolls at 0.5× Barrel Stroke!)
  // =========================================================================
  {
    const g = new THREE.Group();
    const ballGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const ballXs = [-1.2, 1.62, 4.45];

    // 3 balls along main rear-bottom V-groove + 3 balls along front-bottom flat guide (crystal clear from cutaway!)
    for (const bx of ballXs) {
      const bRear = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      bRear.position.set(bx, -3.26, -4.68);
      const bFront = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      bFront.position.set(bx, -3.26, 4.55);
      g.add(bRear, bFront);
    }

    // Ultra-thin polymer ball retainer cages keeping equal ball spacing
    const cageRear = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.12, 0.34), mats.beCuSpring);
    cageRear.position.set(1.62, -3.26, -4.68);
    const cageFront = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.12, 0.34), mats.beCuSpring);
    cageFront.position.set(1.62, -3.26, 4.55);
    g.add(cageRear, cageFront);

    register('peri_linear_balls', g, [1.4, -3.6, 3.6], { afBallRolling: true });
  }

  // =========================================================================
  // 22. LONG-STROKE LINEAR FLAT AF VOICE COIL (Moves Horizontally with Barrel!)
  // =========================================================================
  {
    const g = new THREE.Group();
    const BX = 1.62;

    // Elongated copper racetrack coil facing the rear (-Z) multi-pole linear magnet
    const coilShape = new THREE.Shape();
    coilShape.moveTo(-3.0, -1.55);
    coilShape.lineTo(3.0, -1.55);
    coilShape.lineTo(3.0, 1.55);
    coilShape.lineTo(-3.0, 1.55);
    coilShape.closePath();

    const coilHole = new THREE.Path();
    coilHole.moveTo(-1.75, -0.68);
    coilHole.lineTo(-1.75, 0.68);
    coilHole.lineTo(1.75, 0.68);
    coilHole.lineTo(1.75, -0.68);
    coilHole.closePath();
    coilShape.holes.push(coilHole);

    const coilGeo = new THREE.ExtrudeGeometry(coilShape, { depth: 0.40, bevelEnabled: false });
    coilGeo.center();
    const linearCoil = new THREE.Mesh(coilGeo, mats.copperCoil);
    linearCoil.position.set(BX, 0, -4.86);
    g.add(linearCoil);

    // Gold coil termination pads + flexible power pigtail strip
    const term1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.12), mats.goldBond);
    term1.position.set(BX + 2.8, -1.35, -4.65);
    const term2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.12), mats.goldBond);
    term2.position.set(BX + 2.1, -1.35, -4.65);
    g.add(term1, term2);

    register('peri_linear_vcm_coil', g, [1.5, -5.6, -4.6], { afMoving: true });
  }

  // =========================================================================
  // 23. LONG-STROKE MULTI-POLE N52H NEODYMIUM MAGNET ARRAY
  // =========================================================================
  {
    const g = new THREE.Group();
    const MX = 1.65;

    // Left N-pole & Right S-pole sintered NdFeB bars along rear actuator bay (-Z = -5.44)
    const magN = new THREE.Mesh(new THREE.BoxGeometry(5.85, 4.4, 0.56), mats.lensMagnetN);
    magN.position.set(MX - 3.05, 0, -5.44);
    const magS = new THREE.Mesh(new THREE.BoxGeometry(5.85, 4.4, 0.56), mats.lensMagnetS);
    magS.position.set(MX + 3.05, 0, -5.44);
    const magSlit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.42, 0.58), mats.magnetSlit);
    magSlit.position.set(MX, 0, -5.44);
    g.add(magN, magS, magSlit);

    register('peri_linear_magnets', g, [1.5, -4.6, -6.8]);
  }

  // =========================================================================
  // 24. MAGNETIC PRELOAD SIDE YOKE & LONG-STROKE LINEAR TMR ENCODER STRIP
  // =========================================================================
  {
    const g = new THREE.Group();
    const MX = 1.65;

    // Permalloy flux-return yoke backing directly behind the linear magnets (-Z = -5.84)
    const backYoke = new THREE.Mesh(new THREE.BoxGeometry(12.3, 4.8, 0.22), mats.yokePermalloy);
    backYoke.position.set(MX, 0, -5.84);
    g.add(backYoke);

    // Multi-pole magnetic encoder scale strip running along the bottom front edge (super visible!)
    const scaleStrip = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.42, 0.22), mats.periTmrStrip);
    scaleStrip.position.set(MX, -2.25, 4.72);
    g.add(scaleStrip);

    // Fine alternating magnetic N/S encoder tick bands on the TMR scale strip
    for (let i = 0; i < 16; i++) {
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.36, 0.06),
        i % 2 === 0 ? mats.goldBond : mats.magnetNorthTint
      );
      tick.position.set(MX - 5.2 + i * 0.69, -2.25, 4.85);
      g.add(tick);
    }

    // Precision Linear TMR Magnetic Encoder Readhead IC reading the magnetic scale
    const tmrIc = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.34), mats.hallSensorEmerald);
    tmrIc.position.set(MX, -1.62, 4.72);
    const tmrFpc = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 0.08), mats.fpcPolyimide);
    tmrFpc.position.set(MX, -1.62, 4.92);
    g.add(tmrIc, tmrFpc);

    register('peri_linear_tmr_yoke', g, [1.5, -6.8, -5.0]);
  }

  // =========================================================================
  // 25. VERTICAL BLUE-GLASS IRCF & DUST-SEAL HOLDER (90° Upright at X = +8.75)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(8.75, 0, 0);

    // LCP dust-tight perimeter frame (10.6 mm wide Z × 8.0 mm tall Y)
    const frame = createRectFrameYZ(10.6, 7.9, 9.2, 6.85, 0.56, mats.lcpBlack);
    g.add(frame);

    // Translucent copper-ion Blue Glass IRCF pane
    const blueGlass = new THREE.Mesh(new THREE.BoxGeometry(0.24, 7.0, 9.35), mats.blueGlassIrcf);
    g.add(blueGlass);

    // Front iridescent TiO2/SiO2 50-layer IR reflection coating
    const irCoat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 6.95, 9.3), mats.ircfCoating);
    irCoat.position.x = -0.15;
    g.add(irCoat);

    register('peri_vertical_ircf', g, [5.6, 0.6, 0]);
  }

  // =========================================================================
  // 26. VERTICAL 90° UPRIGHT 1/1.4" 200MP STACKED CMOS SENSOR (ISOCELL HP9)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(10.25, 0, 0);

    // Ceramic / organic vertical package substrate backing (10.8 mm wide Z × 7.9 mm tall Y)
    const sub = new THREE.Mesh(new THREE.BoxGeometry(0.36, 7.8, 10.7), mats.rigidPcb);
    sub.position.x = 0.24;
    g.add(sub);

    // Stacked BSI Silicon Die Body (9.5 × 7.1 mm × 0.34 mm thick)
    const dieBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.1, 9.5), mats.siliconBulkSide);
    dieBody.position.x = -0.06;
    g.add(dieBody);

    // Iridescent 200MP 1/1.4" Active Pixel Surface (9.1 mm Z × 6.8 mm Y) facing -X toward lenses!
    const activeGeo = new THREE.PlaneGeometry(9.1, 6.8);
    activeGeo.rotateY(-Math.PI / 2); // face -X directly toward optical tunnel!
    const activeSurf = new THREE.Mesh(activeGeo, mats.sensorOpticalSurface);
    activeSurf.position.x = -0.23;
    g.add(activeSurf);

    // Perimeter Aluminum Bond Pads & 28 Micro Gold Wire-Bond Loops connecting vertical die to vertical substrate!
    const wireMat = mats.goldBond;
    // Top & Bottom rows of gold wire bonds
    for (let iz = -4.2; iz <= 4.2; iz += 0.70) {
      for (const sy of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.22), mats.alPad);
        pad.position.set(-0.22, sy * 3.44, iz);
        g.add(pad);

        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.22, sy * 3.44, iz),
          new THREE.Vector3(-0.46, sy * 3.68, iz),
          new THREE.Vector3(0.08, sy * 3.82, iz)
        );
        const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.032, 6, false), wireMat);
        g.add(wire);
      }
    }
    // Left (+Z) & Right (-Z) columns of gold wire bonds
    for (let iy = -2.8; iy <= 2.8; iy += 0.93) {
      for (const sz of [-1, 1]) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.22, iy, sz * 4.62),
          new THREE.Vector3(-0.46, iy, sz * 4.92),
          new THREE.Vector3(0.08, iy, sz * 5.18)
        );
        const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.032, 6, false), wireMat);
        g.add(wire);
      }
    }

    register('peri_vertical_sensor', g, [8.4, 0.3, 0]);
  }

  // =========================================================================
  // 27. VERTICAL CNC COPPER HEATSINK BACKPLATE & THERMAL TRANSFER TABS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(11.42, 0, 0);

    // Main vertical solid CNC copper backplate behind vertical PCB
    const cuPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 8.0, 11.2), mats.periCopperHeatsink);
    g.add(cuPlate);

    // Machined thermal dissipation micro-fins on rear (+X) surface
    for (let iy = -3.2; iy <= 3.2; iy += 0.8) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 10.6), mats.copperPad);
      fin.position.set(0.30, iy, 0);
      g.add(fin);
    }

    // Bottom 90° thermal transfer foot mating with phone vapor chamber
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 10.4), mats.periCopperHeatsink);
    foot.position.set(-0.68, -3.86, 0);
    g.add(foot);

    // Silver-filled thermal interface pad (TIM) facing vertical sensor PCB
    const tim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 7.2, 9.8), mats.silverEpoxyDaf);
    tim.position.set(-0.28, 0, 0);
    g.add(tim);

    register('peri_sensor_heatsink', g, [11.2, 0, 0]);
  }

  // =========================================================================
  // 28. L-BENT 90° RIGID-FLEX PCB + DUAL OIS/AF DRIVER ASIC + EEPROM + BTB
  // =========================================================================
  {
    const g = new THREE.Group();

    // Vertical rigid PCB leg seated directly behind sensor substrate (X = +10.88)
    const vertPcb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.8, 10.8), mats.rigidPcb);
    vertPcb.position.set(10.88, 0, 0);
    g.add(vertPcb);

    // Smooth 90° L-shaped Polyimide Flexible Bend wrapping cleanly underneath the module!
    const bendPts = [];
    for (let i = 0; i <= 14; i++) {
      const t = (i / 14) * (Math.PI / 2);
      const bx = 10.88 - 0.85 * (1 - Math.cos(t));
      const by = -3.85 - 0.85 * Math.sin(t);
      bendPts.push(new THREE.Vector3(bx, by, 0));
    }
    // Extrude amber polyimide curved ribbon across Z width 8.4 mm
    const ribbonShape = new THREE.Shape();
    ribbonShape.moveTo(10.76, -3.70);
    ribbonShape.lineTo(10.98, -3.70);
    ribbonShape.absarc(10.02, -3.70, 0.96, 0, -Math.PI / 2, true);
    ribbonShape.lineTo(3.2, -4.66);
    ribbonShape.lineTo(3.2, -4.46);
    ribbonShape.lineTo(10.02, -4.46);
    ribbonShape.absarc(10.02, -3.70, 0.76, -Math.PI / 2, 0, false);
    ribbonShape.closePath();

    const ribbonGeo = new THREE.ExtrudeGeometry(ribbonShape, { depth: 8.6, bevelEnabled: false, curveSegments: 16 });
    ribbonGeo.translate(0, 0, -4.3);
    const lFlexRibbon = new THREE.Mesh(ribbonGeo, mats.fpcPolyimide);
    g.add(lFlexRibbon);

    // Horizontal rigid control board tail underneath +X end carrying Driver ASIC, EEPROM, MLCCs & BTB!
    const horizTail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.34, 9.2), mats.rigidPcb);
    horizTail.position.set(6.2, -4.68, 0);
    g.add(horizTail);

    // Dual-Channel Closed-Loop 2-Axis OIS + Long-Stroke AF Driver ASIC (QFN dark package)
    const driverAsic = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 2.4), mats.icPackageDark);
    driverAsic.position.set(7.4, -4.98, -1.6);
    g.add(driverAsic);

    // Calibration EEPROM IC
    const eeprom = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.32, 1.1), mats.icPackageDark);
    eeprom.position.set(7.4, -4.95, 1.5);
    g.add(eeprom);

    // Bank of 01005 MLCC decoupling capacitors along horizontal rigid tail
    for (let i = 0; i < 6; i++) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.24), mats.mlccCeramic);
      cap.position.set(5.4 + (i % 3) * 0.65, -4.90, -2.8 + Math.floor(i / 3) * 5.6);
      const tL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.26), mats.solderTin);
      tL.position.set(cap.position.x - 0.18, -4.90, cap.position.z);
      const tR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.26), mats.solderTin);
      tR.position.set(cap.position.x + 0.18, -4.90, cap.position.z);
      g.add(cap, tL, tR);
    }

    // High-Speed MIPI CSI-2 Board-to-Board (BTB) Connector with 20 Gold Contact Pins!
    const btbHousing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 6.4), mats.btbHousing);
    btbHousing.position.set(3.85, -5.02, 0);
    g.add(btbHousing);
    for (let pz = -2.6; pz <= 2.6; pz += 0.52) {
      const pinL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.16), mats.goldBond);
      pinL.position.set(3.22, -5.06, pz);
      const pinR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.16), mats.goldBond);
      pinR.position.set(4.48, -5.06, pz);
      g.add(pinL, pinR);
    }

    register('peri_l_rigid_flex', g, [8.6, -5.8, 2.6]);
  }

  return {
    root,
    parts,
    gridY: -5.65,
    defaultCameraPos: new THREE.Vector3(10.5, 18.5, 43.0),
    defaultTarget: new THREE.Vector3(3.2, -0.4, 0.0),
    clipBounds: { x: 14.5, y: 6.5, z: 7.5 }
  };
}
