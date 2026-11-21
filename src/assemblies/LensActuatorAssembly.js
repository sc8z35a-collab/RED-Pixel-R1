import * as THREE from 'three';

/**
 * Generates a real parametrically sculpted rotationally-symmetric aspheric optical lens
 * using LatheGeometry with mounting flange and crisp edge-blackening ink rim.
 */
function createAsphericLens({ rClear, rOut, flangeT, sagTop, sagBot, mat, edgeMat, steps = 34 }) {
  const g = new THREE.Group();
  const pts = [];

  const evalBot = (r) => sagBot(r);
  const evalTop = (r) => Math.max(sagTop(r), sagBot(r) + 0.16);

  const yBotEdge = evalBot(rClear);
  const yTopEdge = evalTop(rClear);
  const flangeMid = (yBotEdge + yTopEdge) * 0.5;
  const fBot = Math.min(yBotEdge, flangeMid - flangeT * 0.5);
  const fTop = Math.max(yTopEdge, flangeMid + flangeT * 0.5);

  // 1. Bottom optical surface (center -> rClear)
  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * rClear;
    pts.push(new THREE.Vector2(r, evalBot(r)));
  }
  // 2. Bottom mounting flange step -> outer edge
  pts.push(new THREE.Vector2(rClear + 0.08, fBot));
  pts.push(new THREE.Vector2(rOut, fBot));
  // 3. Outer cylindrical edge -> top mounting flange
  pts.push(new THREE.Vector2(rOut, fTop));
  pts.push(new THREE.Vector2(rClear + 0.08, fTop));
  // 4. Top optical surface (rClear -> center)
  for (let i = steps; i >= 0; i--) {
    const r = (i / steps) * rClear;
    pts.push(new THREE.Vector2(r, evalTop(r)));
  }

  const latheGeo = new THREE.LatheGeometry(pts, 64);
  const lensMesh = new THREE.Mesh(latheGeo, mat);
  g.add(lensMesh);

  // Sleek micro-thin matte-black Edge Blackening ink band (コバ墨塗り) preserving crystal clarity
  const edgeH = Math.min(0.18, Math.max(0.10, (fTop - fBot) * 0.52));
  const edgeRing = new THREE.Mesh(
    new THREE.CylinderGeometry(rOut + 0.02, rOut + 0.02, edgeH, 64, 1, true),
    edgeMat
  );
  edgeRing.position.y = (fTop + fBot) * 0.5;
  g.add(edgeRing);

  return g;
}

/**
 * Creates a cutaway annular ring or cylinder shell open toward the default (+X, +Z) camera
 */
function createCutawayRing(rIn, rOut, height, mat, phiStart = Math.PI * 0.60, phiLen = Math.PI * 1.28) {
  const pts = [
    new THREE.Vector2(rIn, -height / 2),
    new THREE.Vector2(rOut, -height / 2),
    new THREE.Vector2(rOut, height / 2),
    new THREE.Vector2(rIn, height / 2),
    new THREE.Vector2(rIn, -height / 2)
  ];
  const geo = new THREE.LatheGeometry(pts, 56, phiStart, phiLen);
  return new THREE.Mesh(geo, mat);
}

/**
 * Helper to create a curved crescent aperture blade in the XZ plane with pivot at local origin
 */
function createIrisBladeShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.35, -0.35);
  s.quadraticCurveTo(0.45, -0.42, 0.95, 0.25);
  s.quadraticCurveTo(1.75, 1.45, 1.35, 3.35);
  s.lineTo(0.42, 3.65);
  // Crisp straight/slightly-concave inner aperture knife edge forming sharp hexagonal diaphragm
  s.quadraticCurveTo(0.32, 1.85, -0.38, 0.42);
  s.closePath();
  return s;
}

/**
 * Builds the ULTRA-PRECISION Phase 3 Optical Lens, 6-Blade Variable Aperture
 * & Closed-Loop Ball-Guide VCM/OIS Actuator Assembly (30 Independent Parts, 1 unit = 1 mm)
 */
export function buildLensActuatorAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const register = (id, group, explodeVec, opts = {}) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      oisMoving: Boolean(opts.oisMoving),
      afMoving: Boolean(opts.afMoving)
    });
    return group;
  };

  // Cutaway angular sector leaving front-right (+X/+Z, ~45°) wide open toward default camera
  const CUT_START = Math.PI * 0.62;
  const CUT_LEN = Math.PI * 1.26;

  // =========================================================================
  // 01. SUS430 / PERMALLOY MAGNETIC EMI SHIELD CAN (Architectural L-Cutaway)
  // =========================================================================
  {
    const g = new THREE.Group();
    const W = 18.8;
    const H = 11.4;
    const T = 0.26;
    const half = W / 2;

    // Back (-Z) and Left (-X) satin gunmetal shield walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), mats.lensShieldMetal);
    backWall.position.set(0, 0.2, -half);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(T, H, W), mats.lensShieldMetal);
    leftWall.position.set(-half, 0.2, 0);

    // Compact corner return flanges on +X (rear end) and +Z (left end) leaving all front hardware exposed
    const rightStub = new THREE.Mesh(new THREE.BoxGeometry(T, H, 2.8), mats.lensShieldMetal);
    rightStub.position.set(half, 0.2, -half + 1.4);
    const frontStub = new THREE.Mesh(new THREE.BoxGeometry(2.8, H, T), mats.lensShieldMetal);
    frontStub.position.set(-half + 1.4, 0.2, half);

    // Top deck plate with circular φ11.0 mm lens opening (cutaway on +X/+Z front diagonal!)
    const topShape = new THREE.Shape();
    topShape.moveTo(-half, -half);
    topShape.lineTo(half, -half);
    topShape.lineTo(half, -half + 2.8);
    topShape.lineTo(3.8, -half + 2.8);
    topShape.lineTo(-half + 2.8, 3.8);
    topShape.lineTo(-half + 2.8, half);
    topShape.lineTo(-half, half);
    topShape.closePath();

    const apertureHole = new THREE.Path();
    apertureHole.absarc(0, 0, 5.45, 0, Math.PI * 2, true);
    topShape.holes.push(apertureHole);

    const topGeo = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.30,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    });
    topGeo.rotateX(Math.PI / 2);
    const topDeck = new THREE.Mesh(topGeo, mats.lensShieldMetal);
    topDeck.position.y = 5.95;

    // Chamfered top decorative anodized bezel ring (cutaway)
    const bezel = createCutawayRing(5.35, 6.12, 0.40, mats.susDarkInner, CUT_START, CUT_LEN);
    bezel.position.y = 6.12;

    g.add(backWall, leftWall, rightStub, frontStub, topDeck, bezel);
    register('lens_emi_shield_can', g, [-7.2, 6.2, -7.2]);
  }

  // =========================================================================
  // 02. SAPPHIRE OPTICAL PROTECTION WINDOW & AF/AR COATING
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 6.08;

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(5.25, 5.25, 0.42, 64),
      mats.lensSapphire
    );
    // IP68 dark elastomer O-ring gasket framing the sapphire window perimeter
    const gasket = new THREE.Mesh(
      new THREE.TorusGeometry(5.34, 0.14, 12, 64),
      mats.lensEdgeBlack
    );
    gasket.rotation.x = Math.PI / 2;

    g.add(glass, gasket);
    register('lens_front_sapphire', g, [0, 11.4, 0]);
  }

  // =========================================================================
  // 03. LCP PRECISION STEPPED LENS BARREL (225° Cutaway + Inner Serrated Baffles)
  // =========================================================================
  {
    const g = new THREE.Group();

    // Multi-stepped tapered barrel profile matching L1 (r=4.65) -> L8 (r=6.95)
    const bPts = [
      new THREE.Vector2(4.15, 5.38),
      new THREE.Vector2(5.18, 5.38),
      new THREE.Vector2(5.18, 3.05),
      new THREE.Vector2(5.45, 2.75),
      new THREE.Vector2(5.45, 0.25),
      new THREE.Vector2(6.35, -0.35),
      new THREE.Vector2(6.35, -1.95),
      new THREE.Vector2(7.38, -2.55),
      new THREE.Vector2(7.38, -4.55),
      new THREE.Vector2(6.98, -4.55),
      new THREE.Vector2(6.98, -2.80),
      new THREE.Vector2(6.38, -2.40),
      new THREE.Vector2(5.84, -1.50),
      new THREE.Vector2(5.38, -0.40),
      new THREE.Vector2(4.98, 0.70),
      new THREE.Vector2(4.78, 1.85),
      new THREE.Vector2(4.68, 3.00),
      new THREE.Vector2(4.68, 5.00),
      new THREE.Vector2(4.15, 5.00),
      new THREE.Vector2(4.15, 5.38)
    ];
    const barrelGeo = new THREE.LatheGeometry(bPts, 64, CUT_START, CUT_LEN);
    const barrelMesh = new THREE.Mesh(barrelGeo, mats.lensLcpBarrel);
    g.add(barrelMesh);

    // Fine external M10x0.25 AF carrier engagement thread ribs
    for (let i = 0; i < 6; i++) {
      const ty = 2.1 - i * 0.42;
      const threadRib = createCutawayRing(5.42, 5.56, 0.10, mats.susDarkInner, CUT_START, CUT_LEN);
      threadRib.position.y = ty;
      g.add(threadRib);
    }

    register('lens_lcp_barrel', g, [-5.2, 3.2, -5.2], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 04. INTER-LENS PRECISION SHADING SHEETS & LIGHT-TRAP SPACER RINGS (×6)
  // =========================================================================
  {
    const g = new THREE.Group();
    const spacers = [
      { y: 2.24, rIn: 3.65, rOut: 4.62, h: 0.08 }, // L2 / L3
      { y: 1.24, rIn: 3.88, rOut: 4.82, h: 0.08 }, // L3 / L4
      { y: 0.22, rIn: 4.18, rOut: 5.15, h: 0.08 }, // L4 / L5
      { y: -0.84, rIn: 4.60, rOut: 5.58, h: 0.09 }, // L5 / L6
      { y: -1.94, rIn: 5.08, rOut: 6.12, h: 0.09 }, // L6 / L7
      { y: -3.08, rIn: 5.65, rOut: 6.72, h: 0.10 }  // L7 / L8
    ];
    for (const sp of spacers) {
      const ring = createCutawayRing(sp.rIn, sp.rOut, sp.h, mats.lensEdgeBlack, CUT_START, CUT_LEN);
      ring.position.y = sp.y;
      g.add(ring);
    }

    register('lens_shading_spacers', g, [4.8, 0.6, -4.6], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 05. REAR RETAINER LOCK RING & 6-AXIS ACTIVE ALIGNMENT (AA) FLANGE
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -4.55;

    const ring = createCutawayRing(6.18, 7.36, 0.34, mats.lensIrisCam, CUT_START, CUT_LEN);
    g.add(ring);

    // 6 UV Active Alignment low-shrinkage adhesive pockets spaced around perimeter
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      const bead = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.42), mats.uvAdhesive);
      bead.position.set(Math.cos(a) * 7.22, -0.14, Math.sin(a) * 7.22);
      bead.rotation.y = -a;
      g.add(bead);
    }

    register('lens_retainer_aa_ring', g, [0, -5.6, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 06. ALD ATOMIC LAYER DEPOSITION ULTRA-LOW-REFLECTION NANOCOATINGS
  // =========================================================================
  {
    const g = new THREE.Group();

    // Conformal ALD nanolayer cap hugging L1 front convex dome
    const l1Pts = [];
    for (let i = 0; i <= 28; i++) {
      const r = (i / 28) * 3.88;
      const y = 4.45 + 0.65 - 0.036 * r * r - 0.0004 * Math.pow(r, 4);
      l1Pts.push(new THREE.Vector2(r, y));
    }
    for (let i = 28; i >= 0; i--) {
      const r = (i / 28) * 3.88;
      const y = 4.45 + 0.72 - 0.036 * r * r - 0.0004 * Math.pow(r, 4);
      l1Pts.push(new THREE.Vector2(r, y));
    }
    const aldTop = new THREE.Mesh(new THREE.LatheGeometry(l1Pts, 64), mats.lensAldCoat);

    // Conformal ALD nanolayer coating the extreme W-shaped bottom surface of L8
    const l8Pts = [];
    const rC8 = 6.12;
    for (let i = 0; i <= 30; i++) {
      const r = (i / 30) * rC8;
      const u = r / rC8;
      const y = -3.65 - 0.46 + 0.88 * u * u - 1.28 * Math.pow(u, 4) + 0.45 * Math.pow(u, 6);
      l8Pts.push(new THREE.Vector2(r, y));
    }
    for (let i = 30; i >= 0; i--) {
      const r = (i / 30) * rC8;
      const u = r / rC8;
      const y = -3.65 - 0.40 + 0.88 * u * u - 1.28 * Math.pow(u, 4) + 0.45 * Math.pow(u, 6);
      l8Pts.push(new THREE.Vector2(r, y));
    }
    const aldBot = new THREE.Mesh(new THREE.LatheGeometry(l8Pts, 64), mats.lensAldCoat);

    g.add(aldTop, aldBot);
    register('lens_ald_coating', g, [0, 9.8, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 07-14. 1G7P 8-ELEMENT FLAGSHIP 1-INCH ASPHERIC OPTICAL PRESCRIPTION
  // =========================================================================

  // 07. L1 — Molded Aspheric Lanthanum Glass (1G / WLG, Positive Power)
  {
    const g = createAsphericLens({
      rClear: 3.90,
      rOut: 4.64,
      flangeT: 0.46,
      sagTop: (r) => 0.62 - 0.036 * r * r - 0.0004 * Math.pow(r, 4),
      sagBot: (r) => -0.45 + 0.008 * r * r + 0.0004 * Math.pow(r, 4),
      mat: mats.lensGlass1G,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = 4.45;
    register('lens_g1_molded_glass', g, [0, 8.6, 0], { afMoving: true, oisMoving: true });
  }

  // 08. L2 — Iupizeta EP-8000 High-Index Flint Negative Meniscus
  {
    const g = createAsphericLens({
      rClear: 3.68,
      rOut: 4.55,
      flangeT: 0.30,
      sagTop: (r) => 0.25 - 0.015 * r * r + 0.0003 * Math.pow(r, 4),
      sagBot: (r) => -0.15 - 0.028 * r * r + 0.0011 * Math.pow(r, 4),
      mat: mats.lensResinFlint,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = 2.72;
    register('lens_p2_flint', g, [0, 3.8, 0], { afMoving: true, oisMoving: true });
  }

  // 09. L3 — APEL COC Low-Birefringence Positive Crown Element
  {
    const g = createAsphericLens({
      rClear: 3.92,
      rOut: 4.74,
      flangeT: 0.34,
      sagTop: (r) => 0.38 - 0.020 * r * r + 0.0002 * Math.pow(r, 4),
      sagBot: (r) => -0.34 + 0.016 * r * r - 0.0003 * Math.pow(r, 4),
      mat: mats.lensResinApel,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = 1.76;
    register('lens_p3_apel', g, [0, 2.35, 0], { afMoving: true, oisMoving: true });
  }

  // 10. L4 — OKP-1 Fluorene Polyester Negative Chromatic Corrector
  {
    const g = createAsphericLens({
      rClear: 4.12,
      rOut: 4.94,
      flangeT: 0.30,
      sagTop: (r) => 0.17 + 0.010 * r * r - 0.00038 * Math.pow(r, 4),
      sagBot: (r) => -0.21 - 0.014 * r * r + 0.00055 * Math.pow(r, 4),
      mat: mats.lensResinFlint,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = 0.74;
    register('lens_p4_okp', g, [0, 1.0, 0], { afMoving: true, oisMoving: true });
  }

  // 11. L5 — APEL Bi-Aspheric Positive Meniscus Relay
  {
    const g = createAsphericLens({
      rClear: 4.52,
      rOut: 5.34,
      flangeT: 0.34,
      sagTop: (r) => 0.36 - 0.012 * r * r + 0.00038 * Math.pow(r, 4),
      sagBot: (r) => -0.32 - 0.006 * r * r + 0.00045 * Math.pow(r, 4),
      mat: mats.lensResinApel,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = -0.28;
    register('lens_p5_apel', g, [0, -0.35, 0], { afMoving: true, oisMoving: true });
  }

  // 12. L6 — Iupizeta EP-9000 Ultra-High-Index High-Dispersion Meniscus
  {
    const g = createAsphericLens({
      rClear: 4.96,
      rOut: 5.78,
      flangeT: 0.32,
      sagTop: (r) => 0.24 - 0.014 * r * r + 0.00052 * Math.pow(r, 4),
      sagBot: (r) => -0.22 - 0.018 * r * r + 0.00060 * Math.pow(r, 4),
      mat: mats.lensResinFlint,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = -1.36;
    register('lens_p6_ep9000', g, [0, -1.7, 0], { afMoving: true, oisMoving: true });
  }

  // 13. L7 — Iconic Gullwing (M-Shaped) Extreme 16th-Order Aspheric Lens
  {
    const rC = 5.52;
    const g = createAsphericLens({
      rClear: rC,
      rOut: 6.32,
      flangeT: 0.36,
      sagTop: (r) => {
        const u = r / rC;
        return 0.32 - 0.58 * u * u + 1.06 * Math.pow(u, 4) - 0.52 * Math.pow(u, 6);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.28 - 0.45 * u * u + 0.92 * Math.pow(u, 4) - 0.42 * Math.pow(u, 6);
      },
      mat: mats.lensResinGullwing,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = -2.46;
    register('lens_p7_gullwing', g, [0, -3.1, 0], { afMoving: true, oisMoving: true });
  }

  // 14. L8 — Iconic Wide W-Shaped Field Flattener & CRA ≤ 34° Control Element
  {
    const rC = 6.12;
    const g = createAsphericLens({
      rClear: rC,
      rOut: 6.92,
      flangeT: 0.38,
      sagTop: (r) => {
        const u = r / rC;
        return 0.16 + 0.96 * u * u - 1.36 * Math.pow(u, 4) + 0.48 * Math.pow(u, 6);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.38 + 0.88 * u * u - 1.28 * Math.pow(u, 4) + 0.45 * Math.pow(u, 6);
      },
      mat: mats.lensResinGullwing,
      edgeMat: mats.lensEdgeBlack
    });
    g.position.y = -3.65;
    register('lens_p8_field_flattener', g, [0, -4.4, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 15. VARIABLE APERTURE FIXED STATOR BASE RING (6 Pivot Pins)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 3.42;

    const ring = createCutawayRing(3.25, 4.78, 0.12, mats.susDarkInner, 0, Math.PI * 2);
    g.add(ring);

    // 6 precision golden stainless pivot pins spaced at 60° intervals
    const pinGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.34, 12);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pin = new THREE.Mesh(pinGeo, mats.goldBond);
      pin.position.set(Math.cos(a) * 3.92, 0.11, Math.sin(a) * 3.92);
      g.add(pin);
    }

    register('lens_iris_stator_ring', g, [0, 5.15, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 16. 6 INTERLOCKING MATTE-BLACK VARIABLE APERTURE BLADES (f/1.63 - f/4.0)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 3.53;

    const bladeShape = createIrisBladeShape();
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.045,
      bevelEnabled: false
    });
    bladeGeo.rotateX(-Math.PI / 2);

    const bladePivots = [];
    const baseSwing = 0.26; // Partially stopped-down rest posture so hexagonal iris pops immediately!

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pivot = new THREE.Group();
      // Tiny axial shingling offset prevents Z-fighting where adjacent blades overlap
      pivot.position.set(Math.cos(a) * 3.92, i * 0.012, Math.sin(a) * 3.92);
      pivot.rotation.y = -a + baseSwing;
      pivot.userData.baseAzimuth = -a;
      pivot.userData.restSwing = baseSwing;

      const blade = new THREE.Mesh(bladeGeo, mats.lensIrisBlade);
      // Tiny silver cam-engagement drive pin protruding upward into the cam ring slot
      const camPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.20, 10),
        mats.susSteel
      );
      camPin.position.set(0.32, 0.11, -1.05);

      pivot.add(blade, camPin);
      g.add(pivot);
      bladePivots.push(pivot);
    }

    // Expose blade pivot handles for live f/1.63 <-> f/4.0 mechanical actuation demo!
    g.userData.irisBlades = bladePivots;
    register('lens_iris_6blades', g, [0, 6.2, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 17. SLOTTED CAM-DRIVE ROTOR RING (6 Radial Cam Slots + Drive Arm)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 3.69;

    const camShape = new THREE.Shape();
    camShape.absarc(0, 0, 4.92, 0, Math.PI * 2, false);
    const innerHole = new THREE.Path();
    innerHole.absarc(0, 0, 3.35, 0, Math.PI * 2, true);
    camShape.holes.push(innerHole);

    const camGeo = new THREE.ExtrudeGeometry(camShape, { depth: 0.13, bevelEnabled: false });
    camGeo.rotateX(Math.PI / 2);
    const camMesh = new THREE.Mesh(camGeo, mats.lensIrisCam);
    g.add(camMesh);

    // 6 dark engraved radial cam slot indicators + outer drive lever tab toward -X micro-VCM
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.34;
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 0.18), mats.lensEdgeBlack);
      slot.position.set(Math.cos(a) * 4.15, -0.06, Math.sin(a) * 4.15);
      slot.rotation.y = -a + 0.38;
      g.add(slot);
    }
    const driveTab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.85), mats.lensIrisCam);
    driveTab.position.set(-5.2, -0.06, 0.0);
    g.add(driveTab);

    g.userData.isIrisCamRing = true;
    register('lens_iris_cam_ring', g, [0, 7.2, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 18. DEDICATED ROTARY MICRO-VCM IRIS ACTUATOR & HALL SENSOR
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-6.15, 3.65, 0.0);

    // Miniature housing yoke
    const house = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 2.75), mats.susDarkInner);
    // Miniature copper drive coil + tiny NdFeB rotor magnet + micro Hall position IC
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 1.85), mats.copperCoil);
    coil.position.set(0.32, 0, 0);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 1.55), mats.lensMagnetN);
    mag.position.set(-0.34, 0, 0);
    const hall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.55), mats.hallSensorEmerald);
    hall.position.set(0.0, 0.54, 0.85);
    const goldPad = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.95), mats.goldBond);
    goldPad.position.set(-0.45, 0.50, -0.65);

    g.add(house, coil, mag, hall, goldPad);
    register('lens_iris_micro_vcm', g, [-4.8, 6.2, 0], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 19. AF MOVABLE LENS CARRIER / BOBBIN (225° Cutaway + V-Groove Guide Rails)
  // =========================================================================
  {
    const g = new THREE.Group();
    const C = 14.8;
    const h = 8.4;
    const half = C / 2;
    const wallT = 0.68;

    // Back (-Z) and Left (-X) outer square carrier frames + cutaway stubs leaving +X/+Z corner open
    const backF = new THREE.Mesh(new THREE.BoxGeometry(C, h, wallT), mats.lensCarrierBody);
    backF.position.set(0, -0.2, -half + wallT / 2);
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, C), mats.lensCarrierBody);
    leftF.position.set(-half + wallT / 2, -0.2, 0);

    // Compact cardinal coil-backing plates supporting the +X and +Z AF coils cleanly
    const rightMid = new THREE.Mesh(new THREE.BoxGeometry(wallT * 0.7, 5.2, 6.0), mats.lensCarrierBody);
    rightMid.position.set(half - wallT * 0.35, -1.0, 0);
    const frontMid = new THREE.Mesh(new THREE.BoxGeometry(6.0, 5.2, wallT * 0.7), mats.lensCarrierBody);
    frontMid.position.set(0, -1.0, half - wallT * 0.35);

    // Inner circular hub sleeve cradling the stepped LCP barrel (cutaway)
    const innerSleeve = createCutawayRing(5.55, 6.45, 3.6, mats.lensCarrierBody, CUT_START, CUT_LEN);
    innerSleeve.position.y = 1.25;

    // Precision steel V-groove rail inserts at (-X, +Z) and (+X, -Z) corners for ZrO2 guide balls
    for (const [vx, vz, rot] of [[-6.85, 6.85, Math.PI / 4], [6.85, -6.85, Math.PI / 4]]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.95, 7.6, 0.42), mats.susSteel);
      rail.position.set(vx, -0.2, vz);
      rail.rotation.y = rot;
      g.add(rail);
    }

    g.add(backF, leftF, rightMid, frontMid, innerSleeve);
    register('lens_af_carrier', g, [-3.4, 1.4, -3.4], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 20. AF FOCUSING VOICE COILS (4-Side Racetrack Self-Bonding Copper Windings)
  // =========================================================================
  {
    const g = new THREE.Group();
    const buildRacetrackCoil = () => {
      const cg = new THREE.Group();
      const s = new THREE.Shape();
      const w = 5.6, h = 4.4, r = 0.65;
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

      const hole = new THREE.Path();
      const iw = 3.8, ih = 2.6, ir = 0.35;
      hole.moveTo(-iw / 2 + ir, -ih / 2);
      hole.lineTo(iw / 2 - ir, -ih / 2);
      hole.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + ir);
      hole.lineTo(iw / 2, ih / 2 - ir);
      hole.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - ir, ih / 2);
      hole.lineTo(-iw / 2 + ir, ih / 2);
      hole.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - ir);
      hole.lineTo(-iw / 2, -ih / 2 + ir);
      hole.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + ir, -ih / 2);
      s.holes.push(hole);

      const geo = new THREE.ExtrudeGeometry(s, {
        depth: 0.46,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2
      });
      geo.center();
      cg.add(new THREE.Mesh(geo, mats.copperCoil));
      return cg;
    };

    const sides = [
      { x: 0, z: -7.62, ry: 0 },
      { x: 0, z: 7.62, ry: 0 },
      { x: -7.62, z: 0, ry: Math.PI / 2 },
      { x: 7.62, z: 0, ry: Math.PI / 2 }
    ];
    for (const sd of sides) {
      const c = buildRacetrackCoil();
      c.position.set(sd.x, -1.0, sd.z);
      c.rotation.y = sd.ry;
      g.add(c);
    }

    register('lens_af_voice_coil', g, [2.2, 0.8, 2.2], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 21. Z-AXIS BALL-GUIDE ZrO2 CERAMIC BALL BEARINGS (×6 Spheres in Twin V-Rails)
  // =========================================================================
  {
    const g = new THREE.Group();
    const ballGeo = new THREE.SphereGeometry(0.40, 24, 24);
    const railCoords = [
      { x: -7.25, z: 7.25, rot: Math.PI / 4 },
      { x: 7.25, z: -7.25, rot: Math.PI / 4 }
    ];
    for (const rc of railCoords) {
      // Stationary outer V-groove track housing
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.92, 7.2, 0.32), mats.yokePermalloy);
      track.position.set(rc.x * 1.07, -0.2, rc.z * 1.07);
      track.rotation.y = rc.rot;
      g.add(track);

      // 3 gleaming white Y-TZP ZrO2 ceramic precision spheres per vertical guide rail
      for (const by of [2.1, -0.2, -2.5]) {
        const ball = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
        ball.position.set(rc.x, by, rc.z);
        g.add(ball);
      }
    }

    register('lens_af_guide_balls', g, [4.2, 0.2, -3.6], { oisMoving: true });
  }

  // =========================================================================
  // 22. MAGNETIC ATTRACTION PRELOAD YOKE PLATES (×2 Permalloy Pull Plates)
  // =========================================================================
  {
    const g = new THREE.Group();
    const yokeGeo = new THREE.BoxGeometry(4.4, 4.2, 0.18);

    const yBack = new THREE.Mesh(yokeGeo, mats.yokePermalloy);
    yBack.position.set(0, -1.0, -7.12);
    const yLeft = new THREE.Mesh(yokeGeo, mats.yokePermalloy);
    yLeft.rotation.y = Math.PI / 2;
    yLeft.position.set(-7.12, -1.0, 0);

    g.add(yBack, yLeft);
    register('lens_preload_yoke', g, [-3.8, -0.2, -3.8], { afMoving: true, oisMoving: true });
  }

  // =========================================================================
  // 23. 4-SIDE MULTI-POLE N52 NdFeB PERMANENT MAGNETS (Shared AF + OIS Circuit)
  // =========================================================================
  {
    const g = new THREE.Group();
    const buildDualPoleMagnet = () => {
      const mg = new THREE.Group();
      // Upper N-pole (Metallic Crimson) & Lower S-pole (Metallic Cobalt) showing 2-pole magnetization
      const upper = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.35, 0.84), mats.lensMagnetN);
      upper.position.y = 1.24;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.35, 0.84), mats.lensMagnetS);
      lower.position.y = -1.24;
      // Neutral magnetization boundary band
      const mid = new THREE.Mesh(new THREE.BoxGeometry(5.84, 0.16, 0.88), mats.susSteel);
      mg.add(upper, lower, mid);
      return mg;
    };

    const magPlacements = [
      { x: 0, z: -8.42, ry: 0 },
      { x: 0, z: 8.42, ry: 0 },
      { x: -8.42, z: 0, ry: Math.PI / 2 },
      { x: 8.42, z: 0, ry: Math.PI / 2 }
    ];
    for (const mp of magPlacements) {
      const m = buildDualPoleMagnet();
      m.position.set(mp.x, -1.0, mp.z);
      m.rotation.y = mp.ry;
      g.add(m);
    }

    register('lens_ndfeb_magnets', g, [4.6, -1.8, 4.6], { oisMoving: true });
  }

  // =========================================================================
  // 24. AF Z-AXIS CLOSED-LOOP HALL / TMR POSITION SENSOR IC
  // =========================================================================
  {
    const g = new THREE.Group();
    // Mounted on inner -X stationary rail directly opposite carrier sensing magnet
    const sensorPkg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 1.15), mats.hallSensorEmerald);
    sensorPkg.position.set(-7.95, 2.25, 3.6);
    const senseMag = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.92), mats.lensMagnetN);
    senseMag.position.set(-7.35, 2.25, 3.6);
    const padStrip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 1.35), mats.goldBond);
    padStrip.position.set(-8.12, 2.25, 3.6);

    g.add(sensorPkg, senseMag, padStrip);
    register('lens_af_hall_sensor', g, [-5.6, 1.6, 3.2]);
  }

  // =========================================================================
  // 25. OIS FIXED OUTER HOUSING BASE (Cutaway + Drop-Shock Stoppers)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -5.25;

    const baseShape = new THREE.Shape();
    const H = 9.1;
    baseShape.moveTo(-H, -H);
    baseShape.lineTo(H, -H);
    baseShape.lineTo(H, 3.2);
    baseShape.lineTo(3.2, H);
    baseShape.lineTo(-H, H);
    baseShape.closePath();

    // Central φ14.1 mm optical clear exit opening feeding the 1-inch sensor below
    const clearHole = new THREE.Path();
    clearHole.absarc(0, 0, 7.05, 0, Math.PI * 2, true);
    baseShape.holes.push(clearHole);

    const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.56,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2
    });
    baseGeo.rotateX(Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeo, mats.lensLcpBarrel);
    g.add(baseMesh);

    // 3 Corner mechanical drop-shock elastomer bumper stoppers
    for (const [sx, sz] of [[-8.3, -8.3], [8.3, -8.3], [-8.3, 8.3]]) {
      const stop = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.15, 1.05), mats.btbHousing);
      stop.position.set(sx, 0.52, sz);
      g.add(stop);
    }

    register('lens_ois_outer_housing', g, [0, -7.8, 0]);
  }

  // =========================================================================
  // 26. OIS XY-DRIVE FINE PATTERN COILS (FP-Coil ×4 on Multi-Layer Substrate)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -4.55;

    const buildFpCoil = () => {
      const fg = new THREE.Group();
      const s = new THREE.Shape();
      const w = 5.4, d = 1.65, r = 0.32;
      s.moveTo(-w / 2 + r, -d / 2);
      s.lineTo(w / 2 - r, -d / 2);
      s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
      s.lineTo(w / 2, d / 2 - r);
      s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
      s.lineTo(-w / 2 + r, d / 2);
      s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
      s.lineTo(-w / 2, -d / 2 + r);
      s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

      const hole = new THREE.Path();
      hole.moveTo(-1.7, -0.42);
      hole.lineTo(1.7, -0.42);
      hole.lineTo(1.7, 0.42);
      hole.lineTo(-1.7, 0.42);
      hole.closePath();
      s.holes.push(hole);

      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: false });
      geo.rotateX(Math.PI / 2);
      fg.add(new THREE.Mesh(geo, mats.copperCoil));
      return fg;
    };

    const fpSpecs = [
      { x: 0, z: -8.25, ry: 0 },
      { x: 0, z: 8.25, ry: 0 },
      { x: -8.25, z: 0, ry: Math.PI / 2 },
      { x: 8.25, z: 0, ry: Math.PI / 2 }
    ];
    for (const sp of fpSpecs) {
      const fp = buildFpCoil();
      fp.position.set(sp.x, 0, sp.z);
      fp.rotation.y = sp.ry;
      g.add(fp);
    }

    register('lens_ois_fp_coils', g, [0, -6.2, 0]);
  }

  // =========================================================================
  // 27. 4× Cu-Ni-Si OIS SUSPENSION WIRES (Electrical + Parallel-Link Support)
  // =========================================================================
  {
    const g = new THREE.Group();
    const wireGeo = new THREE.CylinderGeometry(0.065, 0.065, 9.45, 12);
    const padGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.20, 12);

    for (const [wx, wz] of [[-8.25, -8.25], [8.25, -8.25], [-8.25, 8.25], [8.25, 8.25]]) {
      const wire = new THREE.Mesh(wireGeo, mats.lensWireCuNiSi);
      wire.position.set(wx, 0.12, wz);
      const topSolder = new THREE.Mesh(padGeo, mats.goldBond);
      topSolder.position.set(wx, 4.84, wz);
      const botSolder = new THREE.Mesh(padGeo, mats.goldBond);
      botSolder.position.set(wx, -4.60, wz);
      g.add(wire, topSolder, botSolder);
    }

    register('lens_suspension_wires', g, [0, -3.4, 0]);
  }

  // =========================================================================
  // 28. UPPER & LOWER ETCHED BeCu LEAF SPRINGS + UV SILICONE DAMPER GEL
  // =========================================================================
  {
    const g = new THREE.Group();

    const buildLeafSpringDeck = (yPos) => {
      const sg = new THREE.Group();
      sg.position.y = yPos;

      // Outer anchor frame + inner carrier ring linked by 4 S-shaped flexural arms
      const outerR = createCutawayRing(7.75, 8.55, 0.09, mats.beCuSpring, CUT_START, CUT_LEN);
      const innerR = createCutawayRing(5.45, 5.95, 0.09, mats.beCuSpring, CUT_START, CUT_LEN);
      sg.add(outerR, innerR);

      // 4 intricate serpentine flexure arms + translucent UV silicone damping gel beads
      const armAngles = [Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25];
      for (const a of armAngles) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.09, 0.24), mats.beCuSpring);
        arm.position.set(Math.cos(a) * 6.85, 0, Math.sin(a) * 6.85);
        arm.rotation.y = -a + 0.35;
        sg.add(arm);

        // UV-cured viscoelastic silicone damping gel bead at hinge corner
        const gel = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), mats.lensDamperGel);
        gel.scale.set(1.2, 0.58, 1.2);
        gel.position.set(Math.cos(a) * 7.85, 0.04, Math.sin(a) * 7.85);
        sg.add(gel);
      }
      return sg;
    };

    g.add(buildLeafSpringDeck(4.78), buildLeafSpringDeck(-4.18));
    register('lens_leaf_springs_damper', g, [0, 3.6, 0], { oisMoving: true });
  }

  // =========================================================================
  // 29. OIS X/Y HALL SENSORS (×2) & INTEGRATED CLOSED-LOOP PID DRIVER IC
  // =========================================================================
  {
    const g = new THREE.Group();

    // 2 Orthogonal OIS Hall sensors seated inside the hollow cores of the -X and -Z FP-Coils
    const hallX = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.26, 0.65), mats.hallSensorEmerald);
    hallX.position.set(0, -4.52, -8.25);
    const hallY = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.26, 0.95), mats.hallSensorEmerald);
    hallY.position.set(-8.25, -4.52, 0);

    // Single-chip Closed-Loop AF + 2-Axis OIS + Stepless Iris PID Driver ASIC on side wing
    const driverIc = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 2.4), mats.icPackageDark);
    driverIc.position.set(-9.95, -4.85, 1.2);
    const icLead = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.10, 2.55), mats.goldBond);
    icLead.position.set(-9.95, -5.08, 1.2);

    // 4 local 0201 decoupling MLCC capacitors flanking the VCM driver ASIC
    for (let i = 0; i < 4; i++) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.30, 0.34), mats.mlccCeramic);
      cap.position.set(-9.95, -4.90, -0.7 - i * 0.62);
      g.add(cap);
    }

    g.add(hallX, hallY, driverIc, icLead);
    register('lens_ois_hall_ic_driver', g, [-5.4, -5.6, 0]);
  }

  // =========================================================================
  // 30. ACTUATOR CONTROL POLYIMIDE FPC & LOWER SENSOR MODULE INTERFACE PADS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-10.8, -5.18, 0.0);

    // Warm amber polyimide flex ribbon carrying VMOT + I3C + Hall signals down to sensor PCB
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 7.6), mats.fpcPolyimide);
    mainWing.position.set(0.4, 0, 0);

    // Stepped descending tail with 10 ENIG gold-plated reflow bonding pads
    const tail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 5.4), mats.fpcPolyimide);
    tail.position.set(-2.5, -0.22, 0);
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.34, 5.4), mats.fpcPolyimide);
    step.position.set(-1.3, -0.11, 0);

    for (let i = 0; i < 10; i++) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.28), mats.goldBond);
      pad.position.set(-3.35, -0.13, -2.15 + i * 0.48);
      g.add(pad);
    }

    g.add(mainWing, tail, step);
    register('lens_actuator_fpc', g, [-6.6, -6.6, 0]);
  }

  return {
    root,
    parts,
    gridY: -6.2,
    defaultCameraPos: new THREE.Vector3(35.5, 21.0, 35.5),
    defaultTarget: new THREE.Vector3(4.5, 0.0, -2.5),
    clipBounds: { x: 10.5, y: 7.5, z: 10.5 }
  };
}
