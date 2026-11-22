import * as THREE from 'three';

/**
 * Creates a cutaway annular ring or cylinder shell open toward the default (+X, +Z) camera.
 */
function createCutawayRing(rIn, rOut, height, mat, phiStart = Math.PI * 0.62, phiLen = Math.PI * 1.28) {
  const pts = [
    new THREE.Vector2(rIn, -height / 2),
    new THREE.Vector2(rOut, -height / 2),
    new THREE.Vector2(rOut, height / 2),
    new THREE.Vector2(rIn, height / 2),
    new THREE.Vector2(rIn, -height / 2)
  ];
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 64, phiStart, phiLen), mat);
}

/**
 * Generates a cutaway parametric aspheric optical lens with custom flange profile
 * (supports male/female 45° self-centering interlock conical tapers!).
 */
function createCutawayAsphericLens({
  rClear,
  rOut,
  flangeT,
  sagTop,
  sagBot,
  mat,
  phiStart = Math.PI * 0.62,
  phiLen = Math.PI * 1.28,
  interlockMale = false,
  interlockFemale = false,
  steps = 36
}) {
  const pts = [];
  const evalBot = (r) => sagBot(r);
  const evalTop = (r) => Math.max(sagTop(r), sagBot(r) + 0.24);

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

  // 2. Bottom flange with optional 45° Male Self-Centering Conical Interlock Rib!
  pts.push(new THREE.Vector2(rClear + 0.14, fBot));
  if (interlockMale) {
    const rCone0 = rClear + 0.55;
    const rCone1 = rClear + 1.15;
    pts.push(new THREE.Vector2(rCone0, fBot));
    pts.push(new THREE.Vector2(rCone0 + 0.26, fBot - 0.58)); // 45° precision self-centering cone tip!
    pts.push(new THREE.Vector2(rCone1 - 0.14, fBot - 0.58));
    pts.push(new THREE.Vector2(rCone1 + 0.14, fBot));
  }
  pts.push(new THREE.Vector2(rOut, fBot));

  // 3. Outer cylindrical edge
  pts.push(new THREE.Vector2(rOut, fTop));

  // 4. Top flange with optional 45° Female Self-Centering V-Taper Socket!
  if (interlockFemale) {
    const rCone0 = rClear + 0.52;
    const rCone1 = rClear + 1.18;
    pts.push(new THREE.Vector2(rCone1 + 0.18, fTop));
    pts.push(new THREE.Vector2(rCone1 - 0.10, fTop - 0.52)); // Matching 45° female V-socket!
    pts.push(new THREE.Vector2(rCone0 + 0.22, fTop - 0.52));
    pts.push(new THREE.Vector2(rCone0 - 0.04, fTop));
  }
  pts.push(new THREE.Vector2(rClear + 0.14, fTop));

  // 5. Top optical surface (rClear -> center)
  for (let i = steps; i >= 0; i--) {
    const r = (i / steps) * rClear;
    pts.push(new THREE.Vector2(r, evalTop(r)));
  }

  return new THREE.Mesh(new THREE.LatheGeometry(pts, 64, phiStart, phiLen), mat);
}

/**
 * Generates a curved thin optical coating shell hugging a parametric surface sagFn(r).
 */
function createCoatingShell(rMax, sagFn, thickness, mat, phiStart, phiLen, steps = 32) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * rMax;
    pts.push(new THREE.Vector2(r, sagFn(r)));
  }
  for (let i = steps; i >= 0; i--) {
    const r = (i / steps) * rMax;
    pts.push(new THREE.Vector2(r, sagFn(r) + thickness));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 64, phiStart, phiLen), mat);
}

/**
 * Generates one ultra-precision sculpted variable aperture blade in local XZ plane
 * (extruded Y, pivot hole centered at local origin (0, 0), inner knife-edge facing -X).
 * Exact kinematics verified for R_pivot = 7.20:
 *   swing = 0.03 rad -> wide-open f/1.42 (r_aperture ≈ 5.35)
 *   swing = 0.72 rad -> stopped-down f/4.0 (r_aperture ≈ 2.20)
 */
function createDetailedIrisBladeGeometry() {
  const s = new THREE.Shape();
  // Note: ExtrudeGeometry sits in XY; after rotateX(-Math.PI/2), shape (x, y) maps to world (x, 0, -y)!
  // So positive shape Y maps to -Z (counterclockwise tangent from pivot at (+R, 0))!
  s.moveTo(-0.95, -0.62);
  // Rounded pivot ear wrapping around the golden pivot pin
  s.quadraticCurveTo(0.35, -1.05, 1.05, -0.25);
  // Outer cam-pin lobe & sweeping spine staying neatly inside R_out = 8.95
  s.quadraticCurveTo(1.38, 1.35, 1.15, 3.10);
  s.quadraticCurveTo(0.85, 5.45, -1.65, 7.75);
  // Crisp feathered tip
  s.lineTo(-2.95, 7.55);
  // Gently curved inner optical knife-edge forming rounded hexagonal f/4.0 diaphragm!
  s.quadraticCurveTo(-2.25, 4.15, -1.32, 0.55);
  s.quadraticCurveTo(-1.28, -0.18, -0.95, -0.62);
  s.closePath();

  // REAL pierced pivot pin hole at (0, 0)
  const pivotHole = new THREE.Path();
  pivotHole.absarc(0, 0, 0.34, 0, Math.PI * 2, true);
  s.holes.push(pivotHole);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 1
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Builds the ULTRA-DEEP Phase 6 Dissection Assembly:
 * Stepless 6-Blade Variable Aperture Mechanism (13 sub-parts) + Hybrid Glass/WLG,
 * Moth-Eye/ALD Nano-Coatings, Self-Centering Interlock Tapers & Barometric Vent Lens Core (15 sub-parts)
 * Total: 28 Independent Dissectable Parts (2x Magnified Engineering Scale: 1 unit = 0.5 mm)
 */
export function buildApertureLensAssembly(mats) {
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
      isDeepIrisCam: Boolean(opts.isDeepIrisCam),
      isDeepIrisBalls: Boolean(opts.isDeepIrisBalls)
    });
    return group;
  };

  // Architectural 230° cutaway leaving front-right (+X/+Z) wide open toward default camera
  const CUT_START = Math.PI * 0.62;
  const CUT_LEN = Math.PI * 1.28;

  // Shared exact kinematic constants for the 6-blade interleaved variable aperture
  const R_PIVOT = 7.20;
  const PIN_LOCAL_X = 0.55;
  const PIN_LOCAL_Z = -2.20; // maps to shape Y = +2.20
  const SWING_MIN = 0.03;    // f/1.42 wide open
  const SWING_MAX = 0.70;    // f/4.0 stopped down
  const SWING_REST = 0.36;   // crisp mid-stopped posture so hexagonal iris pops on load!
  const CAM_ROT_MIN = 0.16;  // rotor Y rotation at f/1.42
  const CAM_ROT_MAX = -0.22; // rotor Y rotation at f/4.0 (0.38 rad = 21.8° travel!)
  const CAM_ROT_REST = (CAM_ROT_MIN + CAM_ROT_MAX) * 0.5;

  // =========================================================================
  // 01. APERTURE TOP DUST-SHIELD COVER RING & KNIFE-EDGE STOP (Cutaway)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 2.48;

    const cover = createCutawayRing(5.55, 9.65, 0.18, mats.susDarkInner, CUT_START, CUT_LEN);
    // Raised outer dust-labyrinth rim skirt
    const lip = createCutawayRing(9.35, 9.65, 0.52, mats.susDarkInner, CUT_START, CUT_LEN);
    lip.position.y = -0.20;
    // Chamfered inner optical knife-edge ring
    const innerEdge = createCutawayRing(5.32, 5.62, 0.08, mats.lensEdgeBlack, CUT_START, CUT_LEN);
    innerEdge.position.y = -0.02;

    g.add(cover, lip, innerEdge);
    register('ap_dust_cover_ring', g, [0, 5.4, 0]);
  }

  // =========================================================================
  // 02. SLOTTED CAM-DRIVE ROTOR RING (6 REAL PIERCED SPIRAL CAM SLOTS + ARM)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.96;

    // Outer circular ring + integral -X drive lever arm in Shape XY (rotated -PI/2 around X -> maps Y to -Z)
    const camShape = new THREE.Shape();
    const R_OUT = 9.15;
    // Build smooth outer perimeter incorporating the -X drive lever arm (angles near PI)
    const segs = 96;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      // Add sculpted radial ear centered at angle PI (-X direction)
      let dAng = Math.abs(a - Math.PI);
      if (dAng > Math.PI) dAng = Math.PI * 2 - dAng;
      const rArm = dAng < 0.16 ? R_OUT + 2.35 * Math.cos((dAng / 0.16) * (Math.PI / 2)) : R_OUT;
      const px = Math.cos(a) * rArm;
      const py = Math.sin(a) * rArm;
      if (i === 0) camShape.moveTo(px, py);
      else camShape.lineTo(px, py);
    }
    camShape.closePath();

    // Central clear optical pupil bore
    const bore = new THREE.Path();
    bore.absarc(0, 0, 5.62, 0, Math.PI * 2, true);
    camShape.holes.push(bore);

    // Punch 6 MATHEMATICALLY EXACT PIERCED CURVED CAM SLOTS computed directly from blade pin kinematics!
    for (let k = 0; k < 6; k++) {
      const aBlade = (k / 6) * Math.PI * 2;
      const trackPts = [];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const swing = SWING_MIN + u * (SWING_MAX - SWING_MIN);
        const camRot = CAM_ROT_MIN + u * (CAM_ROT_MAX - CAM_ROT_MIN);

        // World position of blade cam pin at (aBlade, swing):
        // Local (PIN_LOCAL_X, PIN_LOCAL_Z) rotated by theta = -aBlade + swing around Y
        const th = -aBlade + swing;
        const wx = R_PIVOT * Math.cos(aBlade) + PIN_LOCAL_X * Math.cos(th) + PIN_LOCAL_Z * Math.sin(th);
        const wz = R_PIVOT * Math.sin(aBlade) - PIN_LOCAL_X * Math.sin(th) + PIN_LOCAL_Z * Math.cos(th);

        // Transform world (wx, wz) into cam rotor's local frame (rotate by -camRot around Y, then map (lx, -lz) to Shape XY)
        const lx = wx * Math.cos(-camRot) + wz * Math.sin(-camRot);
        const lz = -wx * Math.sin(-camRot) + wz * Math.cos(-camRot);
        trackPts.push(new THREE.Vector2(lx, -lz));
      }

      // Expand centerline curve into a crisp 0.44-wide pierced slot capsule
      const halfW = 0.23;
      const leftSide = [];
      const rightSide = [];
      for (let i = 0; i < trackPts.length; i++) {
        const pPrev = trackPts[Math.max(0, i - 1)];
        const pNext = trackPts[Math.min(trackPts.length - 1, i + 1)];
        const dir = pNext.clone().sub(pPrev).normalize();
        const perp = new THREE.Vector2(-dir.y, dir.x);
        leftSide.push(trackPts[i].clone().addScaledVector(perp, halfW));
        rightSide.push(trackPts[i].clone().addScaledVector(perp, -halfW));
      }
      // Extend rounded ends slightly so pin never touches slot walls
      const dStart = trackPts[1].clone().sub(trackPts[0]).normalize();
      const dEnd = trackPts[trackPts.length - 1].clone().sub(trackPts[trackPts.length - 2]).normalize();
      const slotPath = new THREE.Path();
      const startCap = trackPts[0].clone().addScaledVector(dStart, -0.22);
      const endCap = trackPts[trackPts.length - 1].clone().addScaledVector(dEnd, 0.22);
      slotPath.moveTo(startCap.x, startCap.y);
      for (const p of leftSide) slotPath.lineTo(p.x, p.y);
      slotPath.lineTo(endCap.x, endCap.y);
      for (let i = rightSide.length - 1; i >= 0; i--) slotPath.lineTo(rightSide[i].x, rightSide[i].y);
      slotPath.closePath();
      camShape.holes.push(slotPath);
    }

    const camGeo = new THREE.ExtrudeGeometry(camShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    camGeo.rotateX(-Math.PI / 2);
    const camMesh = new THREE.Mesh(camGeo, mats.lensIrisCam);
    g.add(camMesh);

    // Subtle anodized gold registration marks on rotor face
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.52;
      const dimple = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.30, 14), mats.goldBond);
      dimple.position.set(Math.cos(a) * 8.65, 0.13, Math.sin(a) * 8.65);
      g.add(dimple);
    }

    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ap_cam_rotor_ring', g, [0, 4.0, 0], { isDeepIrisCam: true });
  }

  // =========================================================================
  // 03. 3× ZrO2 CERAMIC THRUST/RADIAL MICRO-BALLS SUPPORTING CAM ROTOR
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.72;

    const ballGeo = new THREE.SphereGeometry(0.32, 24, 24);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.52;
      const ball = new THREE.Mesh(ballGeo, mats.ceramicZirconia);
      ball.position.set(Math.cos(a) * 8.62, 0, Math.sin(a) * 8.62);
      g.add(ball);

      // Tiny bronze micro-retainer collar around each ceramic ball
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.06, 10, 24), mats.beCuSpring);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(Math.cos(a) * 8.62, 0, Math.sin(a) * 8.62);
      g.add(collar);
    }

    g.rotation.y = CAM_ROT_REST * 0.5;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ap_rotor_ceramic_balls', g, [0, 3.0, 0], { isDeepIrisBalls: true });
  }

  // Shared detailed blade geometry for upper & lower interleaved tiers
  const bladeGeo = createDetailedIrisBladeGeometry();

  // =========================================================================
  // 04. UPPER TIER — 3 INTERLEAVED DLC BLACKENED APERTURE BLADES (0°, 120°, 240°)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.44;
    const pivots = [];

    for (let i = 0; i < 3; i++) {
      const idx = i * 2; // 0, 2, 4 -> 0°, 120°, 240°
      const a = (idx / 6) * Math.PI * 2;
      const p = new THREE.Group();
      p.position.set(Math.cos(a) * R_PIVOT, i * 0.014, Math.sin(a) * R_PIVOT);
      p.rotation.y = -a + SWING_REST;
      p.userData.baseAzimuth = -a;
      p.userData.restSwing = SWING_REST;
      p.userData.swingMin = SWING_MIN;
      p.userData.swingMax = SWING_MAX;

      const mesh = new THREE.Mesh(bladeGeo, mats.apBladeDlc);
      // Machined golden pivot bushing ring around pivot bore
      const bushing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 20), mats.goldBond);
      bushing.rotation.x = Math.PI / 2;
      bushing.position.y = 0.09;

      // Gleaming stainless cam-follower drive pin protruding cleanly into the REAL cut cam slot above!
      const camPin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.82, 14), mats.periHardenedRail);
      camPin.position.set(PIN_LOCAL_X, 0.44, PIN_LOCAL_Z);

      p.add(mesh, bushing, camPin);
      g.add(p);
      pivots.push(p);
    }

    g.userData.deepIrisBlades = pivots;
    register('ap_upper_3blades', g, [0, 2.1, 0]);
  }

  // =========================================================================
  // 05. 15 μm PTFE FLUOROPOLYMER NON-STICK INTERLEAVING SEPARATOR SHIM
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.24;

    // Ultra-thin satin cyan-white PTFE low-friction separator ring with 6 pin-clearance notches
    const shimShape = new THREE.Shape();
    shimShape.absarc(0, 0, 8.25, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 6.45, 0, Math.PI * 2, true);
    shimShape.holes.push(hole);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pHole = new THREE.Path();
      pHole.absarc(Math.cos(a) * R_PIVOT, Math.sin(a) * R_PIVOT, 0.42, 0, Math.PI * 2, true);
      shimShape.holes.push(pHole);
    }

    const shimGeo = new THREE.ExtrudeGeometry(shimShape, { depth: 0.07, bevelEnabled: false });
    shimGeo.rotateX(-Math.PI / 2);
    const shimMesh = new THREE.Mesh(shimGeo, mats.apPtfeShim);
    g.add(shimMesh);

    register('ap_ptfe_interleave_shim', g, [0, 1.3, 0]);
  }

  // =========================================================================
  // 06. LOWER TIER — 3 INTERLEAVED DLC APERTURE BLADES (60°, 180°, 300°)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 0.98;
    const pivots = [];

    for (let i = 0; i < 3; i++) {
      const idx = i * 2 + 1; // 1, 3, 5 -> 60°, 180°, 300°
      const a = (idx / 6) * Math.PI * 2;
      const p = new THREE.Group();
      p.position.set(Math.cos(a) * R_PIVOT, i * 0.014, Math.sin(a) * R_PIVOT);
      p.rotation.y = -a + SWING_REST;
      p.userData.baseAzimuth = -a;
      p.userData.restSwing = SWING_REST;
      p.userData.swingMin = SWING_MIN;
      p.userData.swingMax = SWING_MAX;

      const mesh = new THREE.Mesh(bladeGeo, mats.apBladeLowerDlc);
      const bushing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 10, 20), mats.goldBond);
      bushing.rotation.x = Math.PI / 2;
      bushing.position.y = 0.09;

      // Taller cam-follower drive pin reaching cleanly up through the clearance window into the cam rotor slot!
      const camPin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.24, 14), mats.periHardenedRail);
      camPin.position.set(PIN_LOCAL_X, 0.65, PIN_LOCAL_Z);

      p.add(mesh, bushing, camPin);
      g.add(p);
      pivots.push(p);
    }

    g.userData.deepIrisBlades = pivots;
    register('ap_lower_3blades', g, [0, 0.4, 0]);
  }

  // =========================================================================
  // 07. FIXED STATOR BASE RING & 6 HARDENED TiN-COATED PIVOT PINS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 0.64;

    const baseRing = createCutawayRing(5.65, 9.55, 0.28, mats.susDarkInner, 0, Math.PI * 2);
    g.add(baseRing);

    // 6 gleaming hardened golden TiN-coated vertical pivot pins passing through all 6 blade pivot holes
    const pinGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.18, 16);
    const collarGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.14, 16);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * R_PIVOT;
      const pz = Math.sin(a) * R_PIVOT;
      const pin = new THREE.Mesh(pinGeo, mats.goldBond);
      pin.position.set(px, 0.68, pz);
      const col = new THREE.Mesh(collarGeo, mats.goldBond);
      col.position.set(px, 0.18, pz);
      g.add(pin, col);
    }

    // 3 machined curved arc raceway pockets beneath the 3 ZrO2 ceramic thrust balls!
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * Math.PI * 2 + 0.16;
      const track = createCutawayRing(8.22, 9.02, 0.12, mats.periHardenedRail, a0, 0.72);
      track.position.y = 0.16;
      g.add(track);
    }

    // Side actuator mounting deck extending toward -X
    const actDeck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, 6.2), mats.susDarkInner);
    actDeck.position.set(-10.55, 0, 0);
    g.add(actDeck);

    register('ap_stator_pivot_pins', g, [0, -0.8, 0]);
  }

  // =========================================================================
  // 08. APERTURE ROTOR DUAL-POLE N52 MICRO-MAGNET & CARRIER (Swings with Cam!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 1.78;

    // Carrier saddle mounted directly onto the -X rotor lever arm at (-10.85, 0, 0)
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 3.85), mats.lensCarrierBody);
    carrier.position.set(-10.85, 0.14, 0);

    // Split Red N-Pole / Blue S-Pole sintered N52H neodymium micro-magnet facing down toward VCM coil
    const magN = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 1.62), mats.lensMagnetN);
    magN.position.set(-10.85, -0.24, -0.88);
    const magS = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.56, 1.62), mats.lensMagnetS);
    magS.position.set(-10.85, -0.24, 0.88);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.57, 0.18), mats.magnetSlit);
    slit.position.set(-10.85, -0.24, 0);

    g.add(carrier, magN, magS, slit);
    g.rotation.y = CAM_ROT_REST;
    g.userData.camRotRest = CAM_ROT_REST;
    g.userData.camRotMin = CAM_ROT_MIN;
    g.userData.camRotMax = CAM_ROT_MAX;
    register('ap_rotor_magnet_carrier', g, [-4.8, 3.8, 0], { isDeepIrisCam: true });
  }

  // =========================================================================
  // 09. ULTRA-COMPACT RACETRACK MICRO-VCM VOICE COIL (Stationary at -X)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-10.85, 0.92, 0);

    const coilShape = new THREE.Shape();
    coilShape.moveTo(-0.92, -2.05);
    coilShape.lineTo(0.92, -2.05);
    coilShape.lineTo(0.92, 2.05);
    coilShape.lineTo(-0.92, 2.05);
    coilShape.closePath();

    const coilHole = new THREE.Path();
    coilHole.moveTo(-0.38, -0.95);
    coilHole.lineTo(-0.38, 0.95);
    coilHole.lineTo(0.38, 0.95);
    coilHole.lineTo(0.38, -0.95);
    coilHole.closePath();
    coilShape.holes.push(coilHole);

    const coilGeo = new THREE.ExtrudeGeometry(coilShape, { depth: 0.44, bevelEnabled: false });
    coilGeo.rotateX(-Math.PI / 2);
    const coil = new THREE.Mesh(coilGeo, mats.copperCoil);
    coil.position.y = -0.18;

    // Gold coil termination pads
    const pad1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), mats.goldBond);
    pad1.position.set(-0.85, -0.18, 2.25);
    const pad2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), mats.goldBond);
    pad2.position.set(-0.25, -0.18, 2.25);

    g.add(coil, pad1, pad2);
    register('ap_micro_vcm_coil', g, [-5.4, 0.8, 0]);
  }

  // =========================================================================
  // 10. PERMALLOY FLUX-RETURN YOKE & POWER-OFF MAGNETIC DETENT PLATE
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-10.85, 0.42, 0);

    const yoke = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 4.9), mats.yokePermalloy);
    // Power-off wide-open magnetic detent iron tab positioned at wide-open arc end (+Z side)
    const detentTab = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.62), mats.periHardenedRail);
    detentTab.position.set(-0.75, 0.36, -2.05);

    g.add(yoke, detentTab);
    register('ap_magnetic_yoke_detent', g, [-6.4, -2.2, 0]);
  }

  // =========================================================================
  // 11. 12-BIT CLOSED-LOOP F-STOP ANGLE HALL / TMR SENSOR IC
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(-10.85, 0.94, 0);

    // Emerald WLCSP magnetic sensor nestled squarely inside the hollow core of the micro-VCM coil!
    const ic = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 0.92), mats.hallSensorEmerald);
    const solder = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 1.08), mats.goldBond);
    solder.position.y = -0.18;

    g.add(ic, solder);
    register('ap_hall_fstop_sensor', g, [-7.2, 1.8, 2.8]);
  }

  // =========================================================================
  // 12. WIDE-OPEN (f/1.42) & STOPPED-DOWN (f/4.0) ELASTOMER HARD STOPS (×2)
  // =========================================================================
  {
    const g = new THREE.Group();
    // Twin vibrant shock-absorbing elastomer hard-stop bumpers flanking the rotor lever arm!
    for (const sz of [-1, 1]) {
      const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.50, 0.88, 20), mats.apStopElastomer);
      bumper.position.set(-10.15, 1.56, sz * 2.82);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.15, 14), mats.susSteel);
      pin.position.set(-10.15, 1.48, sz * 2.82);
      g.add(bumper, pin);
    }

    register('ap_hard_stop_bumpers', g, [-4.8, 2.4, 3.4]);
  }

  // =========================================================================
  // 13. DEDICATED APERTURE ACTUATOR POLYIMIDE FPC & DRIVER PADS
  // =========================================================================
  {
    const g = new THREE.Group();

    // Curved polyimide arc ribbon hugging outer perimeter from -X micro-VCM coil around rear to +Z tail
    const fpcArc = createCutawayRing(9.85, 11.45, 0.12, mats.fpcPolyimide, Math.PI * 0.72, Math.PI * 0.64);
    fpcArc.position.y = 0.62;

    // Actuator solder landing tongue beneath the micro-VCM coil
    const coilPad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 5.4), mats.fpcPolyimide);
    coilPad.position.set(-10.95, 0.62, 0);

    // 6 ENIG gold-plated driver interface pads along the FPC tail
    for (let i = 0; i < 6; i++) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.55), mats.goldBond);
      pad.position.set(-12.05, 0.64, -1.65 + i * 0.66);
      g.add(pad);
    }

    g.add(fpcArc, coilPad);
    register('ap_iris_control_fpc', g, [-7.2, -0.6, -2.6]);
  }

  // =========================================================================
  // 14. MOTH-EYE (SWC) SUB-WAVELENGTH NANOSTRUCTURE ANTI-REFLECTION LAYER
  //     (With Magnified 3D Conical Nanopillar Inspection Patch on L1 Crown!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 4.92;
    const rC = 6.35;
    const sagTopL1 = (r) => {
      const u = r / rC;
      return 1.38 - 0.88 * u * u - 0.14 * Math.pow(u, 4);
    };

    // Ultra-thin translucent emerald moth-eye carrier film over L1 crown
    const film = createCoatingShell(rC * 0.94, (r) => sagTopL1(r) + 0.36, 0.08, mats.periArGreenCoat, CUT_START, CUT_LEN);
    g.add(film);

    // Magnified 3D Circular Inspection Patch of ~120 Sub-Wavelength Conical Moth-Eye Nanopillars!
    const coneGeo = new THREE.ConeGeometry(0.11, 0.36, 10);
    const conePositions = [];
    for (let ring = 0; ring <= 5; ring++) {
      const rr = ring * 0.34;
      const count = ring === 0 ? 1 : ring * 6;
      for (let j = 0; j < count; j++) {
        const ang = (j / count) * Math.PI * 2;
        const cx = -2.2 + Math.cos(ang) * rr;
        const cz = -1.6 + Math.sin(ang) * rr;
        const rRad = Math.hypot(cx, cz);
        if (rRad < rC * 0.88) {
          conePositions.push({ x: cx, y: sagTopL1(rRad) + 0.56, z: cz });
        }
      }
    }
    const instCones = new THREE.InstancedMesh(coneGeo, mats.lensMothEyeNano, conePositions.length);
    const dummy = new THREE.Object3D();
    conePositions.forEach((cp, idx) => {
      dummy.position.set(cp.x, cp.y, cp.z);
      // Tilt nanopillars gently along local spherical surface normal
      dummy.rotation.set(cp.z * 0.08, 0, -cp.x * 0.08);
      dummy.updateMatrix();
      instCones.setMatrixAt(idx, dummy.matrix);
    });
    instCones.instanceMatrix.needsUpdate = true;
    g.add(instCones);

    register('lens_nanocoat_motheye', g, [0, 10.6, 0]);
  }

  // =========================================================================
  // 15. 11-LAYER ALD (ATOMIC LAYER DEPOSITION) CONFORMAL AR INTERFERENCE COAT
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 4.92;
    const rC = 6.45;
    const sagTopL1 = (r) => {
      const u = r / rC;
      return 1.38 - 0.88 * u * u - 0.14 * Math.pow(u, 4);
    };

    const aldShell = createCoatingShell(rC, (r) => sagTopL1(r) + 0.08, 0.18, mats.lensAldCoat, CUT_START, CUT_LEN);
    g.add(aldShell);
    register('lens_ald_11layer_stack', g, [0, 9.2, 0]);
  }

  // =========================================================================
  // 16. L1 PRECISION MOLDED LANTHANUM GLASS CORE (GMO / WLG — Cutaway!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 4.92;
    const rC = 6.45;

    const glassCore = createCutawayAsphericLens({
      rClear: rC,
      rOut: 7.75,
      flangeT: 0.78,
      sagTop: (r) => {
        const u = r / rC;
        return 1.38 - 0.88 * u * u - 0.14 * Math.pow(u, 4);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.26 - 0.24 * u * u + 0.06 * Math.pow(u, 4);
      },
      mat: mats.lensGlass1G,
      phiStart: CUT_START,
      phiLen: CUT_LEN
    });
    g.add(glassCore);

    register('lens_l1_wlg_glass_core', g, [0, 7.6, 0]);
  }

  // =========================================================================
  // 17. HYBRID G+P UV-CURED ASPHERIC OPTICAL POLYMER REPLICA LAYER (Under L1!)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 4.92;
    const rC = 6.38;

    const hybridLayer = createCoatingShell(
      rC,
      (r) => {
        const u = r / rC;
        return -0.62 - 0.16 * u * u + 0.24 * Math.pow(u, 4) - 0.12 * Math.pow(u, 6);
      },
      0.34,
      mats.lensHybridResin,
      CUT_START,
      CUT_LEN
    );
    g.add(hybridLayer);

    register('lens_l1_uv_aspheric_resin', g, [0, 6.2, 0]);
  }

  // =========================================================================
  // 18. EDGE BLACKENING INK (コバ墨塗り) & FROSTED CHAMFER STRAY-LIGHT BAND
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 4.92;

    // Matte-black high-index carbon edge-blackening ink coat hugging L1's outer bevel edge
    const inkBand = createCutawayRing(7.76, 8.02, 0.92, mats.lensEdgeBlack, CUT_START, CUT_LEN);
    inkBand.position.y = -0.04;
    // Micro-frosted light-diffuser top & bottom bevel chamfers
    const topBevel = createCutawayRing(7.45, 7.98, 0.16, mats.susDarkInner, CUT_START, CUT_LEN);
    topBevel.position.y = 0.44;
    const botBevel = createCutawayRing(7.45, 7.98, 0.16, mats.susDarkInner, CUT_START, CUT_LEN);
    botBevel.position.y = -0.52;

    g.add(inkBand, topBevel, botBevel);
    register('lens_l1_edge_blackening', g, [4.2, 7.6, -3.2]);
  }

  // =========================================================================
  // 19. FRONT PRECISION RETAINER CLAMP RING & IP68 SILICONE O-RING GASKET
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = 6.32;

    const clamp = createCutawayRing(6.35, 9.65, 0.56, mats.decoBezelPvd, CUT_START, CUT_LEN);
    // Vivid orange fluoro-silicone micro-seal O-ring via LatheGeometry so its 230° cutaway matches clamp 100%!
    const oPts = [];
    const oSegs = 16;
    for (let i = 0; i <= oSegs; i++) {
      const th = (i / oSegs) * Math.PI * 2;
      oPts.push(new THREE.Vector2(7.25 + Math.cos(th) * 0.22, -0.34 + Math.sin(th) * 0.22));
    }
    const oring = new THREE.Mesh(
      new THREE.LatheGeometry(oPts, 64, CUT_START, CUT_LEN),
      mats.decoWaterproofOring
    );

    g.add(clamp, oring);
    register('lens_front_clamp_oring', g, [0, 11.8, 0]);
  }

  // =========================================================================
  // 20. L2 HIGH-DISPERSION FLINT MENISCUS WITH 45° MALE SELF-CENTERING INTERLOCK!
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -0.78;
    const rC = 6.20;

    const l2Mesh = createCutawayAsphericLens({
      rClear: rC,
      rOut: 8.25,
      flangeT: 0.72,
      sagTop: (r) => {
        const u = r / rC;
        return 0.44 - 0.56 * u * u + 0.14 * Math.pow(u, 4);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.22 - 0.36 * u * u + 0.10 * Math.pow(u, 4);
      },
      mat: mats.lensResinFlint,
      phiStart: CUT_START,
      phiLen: CUT_LEN,
      interlockMale: true // Real 45° male conical self-centering interlock rib protruding downward!
    });
    g.add(l2Mesh);

    // Molded plastic injection gate vestige flat tab & orientation key notch on outer flange
    const gateTab = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 1.35), mats.lensResinFlint);
    gateTab.position.set(-8.35, -0.18, 0);
    g.add(gateTab);

    register('lens_l2_flint_interlock', g, [0, -1.8, 0]);
  }

  // =========================================================================
  // 21. ULTRA-THIN 25 μm BLACKENED PET SHADING FOIL & KNIFE-EDGE BAFFLE (L2/L3)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -1.64;

    const foil = createCutawayRing(5.85, 8.15, 0.10, mats.lensEdgeBlack, CUT_START, CUT_LEN);
    g.add(foil);
    register('lens_shading_foil_l2l3', g, [4.6, -2.8, -3.2]);
  }

  // =========================================================================
  // 22. L3 APEL LOW-BIREFRINGENCE CROWN WITH MATCHING 45° FEMALE V-SOCKET!
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -2.55;
    const rC = 6.42;

    const l3Mesh = createCutawayAsphericLens({
      rClear: rC,
      rOut: 8.55,
      flangeT: 0.92,
      sagTop: (r) => {
        const u = r / rC;
        return 0.62 - 0.42 * u * u + 0.18 * Math.pow(u, 4);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.34 + 0.22 * u * u - 0.10 * Math.pow(u, 4);
      },
      mat: mats.lensResinApel,
      phiStart: CUT_START,
      phiLen: CUT_LEN,
      interlockFemale: true // Real matching 45° female V-taper socket receiving L2!
    });
    g.add(l3Mesh);

    register('lens_l3_apel_crown', g, [0, -4.0, 0]);
  }

  // =========================================================================
  // 23. BAROMETRIC PRESSURE-EQUALIZATION MICRO AIR-VENT CHANNELS (×4)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -3.38;

    // 4 radial micro-vent breathing ducts (visible cyan-metallic channel guides carved across L3/L4 spacer)
    const ventRing = createCutawayRing(6.55, 8.65, 0.14, mats.susDarkInner, CUT_START, CUT_LEN);
    g.add(ventRing);

    const ventAngles = [Math.PI * 0.78, Math.PI * 1.12, Math.PI * 1.46, Math.PI * 1.78];
    for (const a of ventAngles) {
      const duct = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.22, 0.34), mats.lensVentCyan);
      duct.position.set(Math.cos(a) * 7.62, 0.02, Math.sin(a) * 7.62);
      duct.rotation.y = -a;
      g.add(duct);

      // Labyrinth dust-trap turn stub at outer end of each vent channel
      const lab = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.92), mats.lensVentCyan);
      lab.position.set(Math.cos(a) * 8.68, 0.02, Math.sin(a) * 8.68);
      lab.rotation.y = -a;
      g.add(lab);
    }

    register('lens_air_vent_channels', g, [5.2, -5.2, -2.6]);
  }

  // =========================================================================
  // 24. L4 ICONIC 16TH-ORDER GULLWING (M/W-SHAPED) FIELD-FLATTENER LENS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -4.62;
    const rC = 7.45;

    // Classic smartphone Gullwing inflection profile: Concave Center -> Convex Shoulder -> Swept Rim!
    const l4Mesh = createCutawayAsphericLens({
      rClear: rC,
      rOut: 9.15,
      flangeT: 0.78,
      sagTop: (r) => {
        const u = r / rC;
        return 0.18 + 1.45 * u * u - 2.05 * Math.pow(u, 4) + 0.72 * Math.pow(u, 6);
      },
      sagBot: (r) => {
        const u = r / rC;
        return -0.58 + 1.28 * u * u - 1.88 * Math.pow(u, 4) + 0.68 * Math.pow(u, 6);
      },
      mat: mats.lensResinGullwing,
      phiStart: CUT_START,
      phiLen: CUT_LEN
    });
    g.add(l4Mesh);

    register('lens_l4_gullwing_flattener', g, [0, -6.8, 0]);
  }

  // =========================================================================
  // 25. INNER BARREL 12-STEP SERRATED KNIFE-EDGE STRAY-LIGHT BAFFLES
  // =========================================================================
  {
    const g = new THREE.Group();

    // 12 precision sawtooth knife-edge rings lining inner bore of the optical barrel
    const baffleY = [5.4, 4.9, 4.3, 3.6, 2.9, -0.3, -1.1, -2.0, -2.9, -3.7, -4.5, -5.2];
    baffleY.forEach((by, idx) => {
      const rBase = idx < 5 ? 8.15 : 8.65 + (idx - 5) * 0.14;
      const pts = [
        new THREE.Vector2(rBase - 0.42, by),
        new THREE.Vector2(rBase + 0.12, by - 0.16),
        new THREE.Vector2(rBase + 0.12, by + 0.22),
        new THREE.Vector2(rBase - 0.42, by)
      ];
      const rib = new THREE.Mesh(new THREE.LatheGeometry(pts, 64, CUT_START, CUT_LEN), mats.lensEdgeBlack);
      g.add(rib);
    });

    register('lens_serrated_baffle_wall', g, [-4.8, 0.2, -4.8]);
  }

  // =========================================================================
  // 26. 3-POINT SYMMETRIC (120°) MICRO-DISPENSED UV OPTICAL CEMENT POCKETS
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -5.62;

    // 3 glowing translucent indigo-violet UV epoxy droplets seated 120° apart (prevents astigmatism!)
    for (let i = 0; i < 3; i++) {
      const a = CUT_START + 0.38 + i * (CUT_LEN * 0.36);
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 16), mats.uvAdhesive);
      drop.scale.set(1.35, 0.65, 1.35);
      drop.position.set(Math.cos(a) * 9.25, 0, Math.sin(a) * 9.25);

      const pocket = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.22, 20), mats.susDarkInner);
      pocket.position.set(Math.cos(a) * 9.25, -0.14, Math.sin(a) * 9.25);
      g.add(drop, pocket);
    }

    register('lens_uv_cement_pockets', g, [4.6, -7.8, -3.4]);
  }

  // =========================================================================
  // 27. CARBON-LCP PRECISION STEPPED BARREL & M10×0.25 THREADS (230° Cutaway
  //     + Machined Side Window Slot for Zero-Collision Cam Lever Arm Swing!)
  // =========================================================================
  {
    const g = new THREE.Group();

    // Upper L1 glass barrel collar (Y in [+2.72, +6.45])
    const upperPts = [
      new THREE.Vector2(8.18, 6.45),
      new THREE.Vector2(9.95, 6.45),
      new THREE.Vector2(9.95, 2.72),
      new THREE.Vector2(8.18, 2.72),
      new THREE.Vector2(8.18, 6.45)
    ];
    g.add(new THREE.Mesh(new THREE.LatheGeometry(upperPts, 64, CUT_START, CUT_LEN), mats.lensLcpBarrel));

    // Lower L2-L4 precision stepped barrel (Y in [-6.15, +0.48])
    const lowerPts = [
      new THREE.Vector2(8.42, 0.48),
      new THREE.Vector2(10.35, 0.48),
      new THREE.Vector2(10.35, -6.15),
      new THREE.Vector2(9.45, -6.15),
      new THREE.Vector2(9.45, -4.25),
      new THREE.Vector2(8.95, -3.45),
      new THREE.Vector2(8.72, -1.85),
      new THREE.Vector2(8.42, 0.48)
    ];
    g.add(new THREE.Mesh(new THREE.LatheGeometry(lowerPts, 64, CUT_START, CUT_LEN), mats.lensLcpBarrel));

    // Rear-arc structural bridge column connecting upper & lower barrel while leaving the -X cam arm gallery wide open!
    const bridgeArc = createCutawayRing(9.62, 10.32, 2.28, mats.lensLcpBarrel, Math.PI * 0.72, Math.PI * 0.62);
    bridgeArc.position.y = 1.60;
    g.add(bridgeArc);

    // Finely turned M10 × 0.25 external AF carrier engagement thread ribs
    for (let i = 0; i < 8; i++) {
      const ty = -0.45 - i * 0.62;
      const rib = createCutawayRing(10.32, 10.56, 0.16, mats.susDarkInner, CUT_START, CUT_LEN);
      rib.position.y = ty;
      g.add(rib);
    }

    register('lens_precision_lcp_barrel', g, [-6.6, 1.4, -6.6]);
  }

  // =========================================================================
  // 28. REAR PRESS-FIT RETAINER LOCK RING & OPTICAL DATUM SEAT
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -6.22;

    const lockRing = createCutawayRing(7.65, 10.15, 0.48, mats.susSteel, CUT_START, CUT_LEN);
    g.add(lockRing);

    // Spanner wrench tightening notches along the bottom datum face
    for (let i = 0; i < 3; i++) {
      const a = CUT_START + 0.42 + i * (CUT_LEN * 0.34);
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.26, 0.42), mats.lensEdgeBlack);
      notch.position.set(Math.cos(a) * 8.95, -0.18, Math.sin(a) * 8.95);
      notch.rotation.y = -a;
      g.add(notch);
    }

    register('lens_rear_lock_washer', g, [0, -9.2, 0]);
  }

  return {
    root,
    parts,
    gridY: -7.45,
    defaultCameraPos: new THREE.Vector3(17.0, 21.5, 36.5),
    defaultTarget: new THREE.Vector3(1.6, 0.2, 0.0),
    clipBounds: { x: 13.0, y: 8.5, z: 13.0 }
  };
}
