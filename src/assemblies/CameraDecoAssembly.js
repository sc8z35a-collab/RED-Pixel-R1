import * as THREE from 'three';

/**
 * Helper to create a cutaway annular ring open toward (+X, +Z) camera
 */
function createCutawayRing(rIn, rOut, height, mat, phiStart = Math.PI * 0.62, phiLen = Math.PI * 1.26) {
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
 * Builds a genuinely sculpted concentric sawtooth Micro-Fresnel lens via LatheGeometry
 */
function createFresnelLensMesh(radius, thickness, rings, mat) {
  const pts = [];
  pts.push(new THREE.Vector2(0, -thickness / 2));
  pts.push(new THREE.Vector2(radius, -thickness / 2));
  pts.push(new THREE.Vector2(radius, thickness * 0.15));

  // Walk inward carving concentric sawtooth Fresnel prism ridges on the top surface
  for (let i = rings; i >= 1; i--) {
    const rOuter = (i / rings) * radius;
    const rInner = ((i - 1) / rings) * radius;
    const ridgeH = thickness * (0.48 + 0.14 * (i / rings));
    pts.push(new THREE.Vector2(rOuter - 0.02, thickness * 0.08));
    pts.push(new THREE.Vector2(rOuter - 0.04, ridgeH));
    pts.push(new THREE.Vector2(rInner + 0.03, thickness * 0.12));
  }
  pts.push(new THREE.Vector2(0, thickness * 0.52));

  return new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat);
}

/**
 * Builds the ULTRA-PRECISION Phase 4 Topmost Layer:
 * Exterior CNC Grade-5 Titanium Camera Deco, Gorilla Glass DX+ Multi-Layer Cover Stack,
 * IP68 Waterproofing & ePTFE Barometric Vent, dToF LiDAR Laser AF,
 * 9-LED Adaptive True Tone Fresnel Flash, Multispectral Color/Flicker Sensor & Zoom MEMS Mic
 * (24 Independent Dissectable Parts, 1 unit = 1 mm)
 */
export function buildCameraDecoAssembly(mats) {
  const root = new THREE.Group();
  const parts = [];

  const register = (id, group, explodeVec) => {
    root.add(group);
    parts.push({
      id,
      group,
      explodeVec: new THREE.Vector3(...explodeVec),
      oisMoving: false,
      afMoving: false
    });
    return group;
  };

  // Exact verified non-overlapping centers inside the φ27.2 mm circular Titanium Camera Island
  const DECO_R = 13.6;
  const MAIN_X = -2.8;
  const MAIN_Z = -1.0;
  const MAIN_R = 6.15;

  const LIDAR_X = 7.1;
  const LIDAR_Z = -4.4;

  const FLASH_X = 7.0;
  const FLASH_Z = 3.8;

  const SPEC_X = 1.2;
  const SPEC_Z = 8.8;

  const MIC_X = -5.6;
  const MIC_Z = 8.2;

  const VENT_X = -1.6;
  const VENT_Z = -10.2;

  const CUT_START = Math.PI * 0.62;
  const CUT_LEN = Math.PI * 1.26;

  // =========================================================================
  // 01. MATTE AG FROSTED REAR BACK GLASS PANEL (Cutaway Corner)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -2.25;

    // Rounded-square rear glass panel (34 mm × 34 mm) with circular φ27.6 mm camera deco cutout
    const H = 17.0;
    const CR = 3.2;
    const s = new THREE.Shape();
    s.moveTo(-H + CR, -H);
    s.lineTo(H - CR, -H);
    s.quadraticCurveTo(H, -H, H, -H + CR);
    s.lineTo(H, 6.5);
    // Clean diagonal front-right cutaway exposing underside graphite & FPC
    s.lineTo(6.5, H);
    s.lineTo(-H + CR, H);
    s.quadraticCurveTo(-H, H, -H, H - CR);
    s.lineTo(-H, -H + CR);
    s.quadraticCurveTo(-H, -H, -H + CR, -H);

    const hole = new THREE.Path();
    hole.absarc(0, 0, DECO_R + 0.22, 0, Math.PI * 2, true);
    s.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.72,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 3
    });
    geo.rotateX(Math.PI / 2);
    const panel = new THREE.Mesh(geo, mats.decoBackGlass);
    g.add(panel);

    register('deco_matte_back_glass', g, [0, -5.8, 0]);
  }

  // =========================================================================
  // 02. CNC GRADE-5 TITANIUM (Ti-6Al-4V) CAMERA DECO HOUSING (Stepped Plateau)
  // =========================================================================
  {
    const g = new THREE.Group();

    // Lower titanium stepped flange + main circular plateau with 6 precision machined openings
    const shape = new THREE.Shape();
    shape.absarc(0, 0, DECO_R, 0, Math.PI * 2, false);

    // Punch all 6 exact circular optical/sensor/acoustic openings
    // Note: rotateX(Math.PI / 2) maps shape (x, y) -> world (x, z), so y = world Z!
    const punchCircle = (cx, cz, r) => {
      const p = new THREE.Path();
      p.absarc(cx, cz, r, 0, Math.PI * 2, true);
      shape.holes.push(p);
    };
    punchCircle(MAIN_X, MAIN_Z, MAIN_R + 0.15);
    punchCircle(LIDAR_X, LIDAR_Z, 2.38);
    punchCircle(FLASH_X, FLASH_Z, 2.42);
    punchCircle(SPEC_X, SPEC_Z, 1.75);
    punchCircle(MIC_X, MIC_Z, 1.15);
    punchCircle(VENT_X, VENT_Z, 1.32);

    const mainGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.85,
      bevelEnabled: true,
      bevelThickness: 0.24,
      bevelSize: 0.24,
      bevelSegments: 3
    });
    mainGeo.rotateX(Math.PI / 2);
    const plateau = new THREE.Mesh(mainGeo, mats.decoTitanium);
    plateau.position.y = 1.45;
    g.add(plateau);

    // Machined brushed-chamfer outer perimeter accent ring
    const outerCollar = new THREE.Mesh(
      new THREE.TorusGeometry(DECO_R + 0.12, 0.22, 14, 72),
      mats.susSteel
    );
    outerCollar.rotation.x = Math.PI / 2;
    outerCollar.position.y = -1.45;
    g.add(outerCollar);

    register('deco_titanium_housing', g, [0, -1.6, 0]);
  }

  // =========================================================================
  // 03. PVD BLACK-CHROME KNURLED MAIN LENS BEZEL RING (+0.35mm Bumper & Filter Groove)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, 1.92, MAIN_Z);

    // Cutaway stepped protective bezel ring rising +0.35mm above cover glass
    const baseRing = createCutawayRing(MAIN_R - 0.18, MAIN_R + 1.05, 1.15, mats.decoBezelPvd, CUT_START, CUT_LEN);
    g.add(baseRing);

    // 72 precision watch-bezel knurling teeth along the cutaway arc
    const toothGeo = new THREE.BoxGeometry(0.18, 0.96, 0.22);
    for (let i = 0; i < 72; i++) {
      const theta = (i / 72) * Math.PI * 2;
      // Only place teeth along the non-cutaway solid arc
      let rel = (theta - CUT_START) % (Math.PI * 2);
      if (rel < 0) rel += Math.PI * 2;
      if (rel > CUT_LEN) continue;
      // LatheGeometry uses (r * sin(theta), y, r * cos(theta))
      const rT = MAIN_R + 1.08;
      const tooth = new THREE.Mesh(toothGeo, mats.decoBezelPvd);
      tooth.position.set(Math.sin(theta) * rT, 0, Math.cos(theta) * rT);
      tooth.rotation.y = theta;
      g.add(tooth);
    }

    // Precision silver-chamfered 67mm bayonet external filter mounting groove rim
    const accentLip = createCutawayRing(MAIN_R + 0.15, MAIN_R + 0.42, 0.12, mats.susSteel, CUT_START, CUT_LEN);
    accentLip.position.y = 0.60;
    g.add(accentLip);

    register('deco_knurled_bezel_ring', g, [0, 5.2, 0]);
  }

  // =========================================================================
  // 04. IP68 WATERPROOF SILICONE O-RING & WATERPROOF ACRYLIC SEAL TAPE
  // =========================================================================
  {
    const g = new THREE.Group();

    // Main outer titanium-to-back-glass IP68 high-visibility orange silicone O-ring
    const outerOring = new THREE.Mesh(
      new THREE.TorusGeometry(DECO_R - 0.35, 0.32, 16, 72),
      mats.decoWaterproofOring
    );
    outerOring.rotation.x = Math.PI / 2;
    outerOring.position.y = -1.78;

    // Cover-glass seat IP68 precision waterproof O-ring around main lens opening
    const mainOring = new THREE.Mesh(
      new THREE.TorusGeometry(MAIN_R + 0.25, 0.20, 14, 64),
      mats.decoWaterproofOring
    );
    mainOring.rotation.x = Math.PI / 2;
    mainOring.position.set(MAIN_X, 1.38, MAIN_Z);

    // Secondary waterproof rings around LiDAR and Flash windows
    const lidarOring = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.14, 12, 40), mats.decoWaterproofOring);
    lidarOring.rotation.x = Math.PI / 2;
    lidarOring.position.set(LIDAR_X, 1.25, LIDAR_Z);

    const flashOring = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.14, 12, 40), mats.decoWaterproofOring);
    flashOring.rotation.x = Math.PI / 2;
    flashOring.position.set(FLASH_X, 1.25, FLASH_Z);

    g.add(outerOring, mainOring, lidarOring, flashOring);
    register('deco_ip68_oring_tape', g, [0, -3.2, 0]);
  }

  // =========================================================================
  // 05. ePTFE WATERPROOF BREATHABLE BAROMETRIC VENT MEMBRANE (0.2 μm Pores)
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(VENT_X, 0.45, VENT_Z);

    // Black PSA waterproof mounting ring + crisp white microporous GORE ePTFE membrane disc
    const psaRing = new THREE.Mesh(new THREE.CylinderGeometry(1.30, 1.30, 0.28, 32), mats.decoPoronFoam);
    const eptfeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.34, 32), mats.decoEptfeVent);
    // Protective recessed stainless vent cap with 4 micro breather ports
    const capRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.14, 12, 32), mats.susSteel);
    capRing.rotation.x = Math.PI / 2;
    capRing.position.y = 0.78;
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.92, 32, 1, true), mats.susDarkInner);
    duct.position.y = 0.32;

    g.add(psaRing, eptfeDisc, capRing, duct);
    register('deco_eptfe_vent', g, [0, 3.8, -3.4]);
  }

  // =========================================================================
  // 06. HIGH-DENSITY PORON LIGHT-SEAL FOAM & OPTICAL ISOLATION GASKET
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, -1.75, MAIN_Z);

    // Thick matte-black light-blocking urethane foam ring sealing Cover Glass to Lens Barrel below
    const mainFoam = createCutawayRing(MAIN_R - 0.35, MAIN_R + 0.55, 1.15, mats.decoPoronFoam, 0, Math.PI * 2);
    g.add(mainFoam);

    // Isolation barrier walls preventing Flash bleed & LiDAR IR stray light from entering Main Lens
    const flashBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.45, 5.2), mats.decoPoronFoam);
    flashBarrier.position.set(6.75, 0.45, 3.6);
    flashBarrier.rotation.y = 0.25;
    const lidarBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.45, 4.8), mats.decoPoronFoam);
    lidarBarrier.position.set(6.85, 0.45, -3.2);
    lidarBarrier.rotation.y = -0.28;
    g.add(flashBarrier, lidarBarrier);

    register('deco_light_seal_foam', g, [0, -4.4, 0]);
  }

  // =========================================================================
  // 07-10. MULTI-LAYER COVER GLASS STACK (Oleophobic -> AR DX+ -> Gorilla DX+ -> Silk Mask)
  // =========================================================================

  // 07. Ultra-Thin Fluoropolymer Oleophobic Anti-Fingerprint Coating (AF Coat)
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, 2.24, MAIN_Z);

    const film = new THREE.Mesh(
      new THREE.CylinderGeometry(MAIN_R - 0.15, MAIN_R - 0.15, 0.06, 64),
      mats.decoOleophobic
    );
    // 3 sculpted microscopic hydrophobic water droplets (contact angle > 115°) illustrating beading!
    const dropGeo = new THREE.SphereGeometry(0.32, 18, 16);
    for (const [dx, dz, sc] of [[-2.1, -1.4, 1.0], [1.8, -2.0, 0.72], [-0.4, 2.2, 0.85]]) {
      const drop = new THREE.Mesh(dropGeo, mats.decoGorillaDx);
      drop.scale.set(sc, sc * 0.78, sc);
      drop.position.set(dx, 0.20 * sc, dz);
      g.add(drop);
    }

    g.add(film);
    register('deco_oleophobic_coat', g, [0, 9.6, 0]);
  }

  // 08. Broadband Multi-Layer Anti-Reflective Coating (DX+ Interference Layer)
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, 2.08, MAIN_Z);

    const arFilm = new THREE.Mesh(
      new THREE.CylinderGeometry(MAIN_R - 0.10, MAIN_R - 0.10, 0.09, 64),
      mats.decoArDxCoat
    );
    g.add(arFilm);
    register('deco_ar_multilayer', g, [0, 8.2, 0]);
  }

  // 09. Corning Gorilla Glass DX+ High-Transmittance Optical Cover Glass (98% T)
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, 1.72, MAIN_Z);

    const slab = new THREE.Mesh(
      new THREE.CylinderGeometry(MAIN_R + 0.04, MAIN_R + 0.04, 0.56, 64),
      mats.decoGorillaDx
    );
    // Crisp chamfered optical perimeter rim
    const edgeRim = new THREE.Mesh(
      new THREE.TorusGeometry(MAIN_R + 0.02, 0.07, 10, 64),
      mats.susSteel
    );
    edgeRim.rotation.x = Math.PI / 2;
    edgeRim.position.y = 0.25;

    g.add(slab, edgeRim);
    register('deco_cover_glass_dx', g, [0, 6.8, 0]);
  }

  // 10. Rear Silk-Screen Matte Black Aperture Masking Print (OD > 5.0)
  {
    const g = new THREE.Group();
    g.position.set(MAIN_X, 1.38, MAIN_Z);

    const mask = createCutawayRing(MAIN_R - 1.05, MAIN_R + 0.06, 0.08, mats.lensEdgeBlack, 0, Math.PI * 2);
    g.add(mask);
    register('deco_silk_masking', g, [0, 3.6, 0]);
  }

  // =========================================================================
  // 11-14. dToF LiDAR LASER AUTOFOCUS MODULE (940 nm VCSEL + DOE + SPAD)
  // =========================================================================

  // 11. 940 nm Near-Infrared Pass Black Window (Half-Cutaway revealing VCSEL/SPAD!)
  {
    const g = new THREE.Group();
    g.position.set(LIDAR_X, 1.56, LIDAR_Z);

    // Cutaway dark-indigo IR-pass cover lens so internal VCSEL + DOE + SPAD glow visibly on load!
    const winMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.34, 2.34, 0.34, 48, 1, false, Math.PI * 0.55, Math.PI * 1.35),
      mats.decoIrBlackWindow
    );
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(2.36, 0.14, 12, 48), mats.decoBezelPvd);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.y = 0.08;
    g.add(winMesh, bezel);

    register('deco_dtof_ir_window', g, [3.2, 7.6, -2.6]);
  }

  // 12. 940 nm VCSEL Vertical-Cavity Surface-Emitting Laser (Class-1 Eye-Safe)
  {
    const g = new THREE.Group();
    g.position.set(LIDAR_X - 0.85, 0.15, LIDAR_Z);

    const pkg = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.52, 1.65), mats.icPackageDark);
    const goldFrame = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.14, 1.32), mats.goldBond);
    goldFrame.position.y = 0.30;
    // Active luminous GaAs VCSEL laser die (pulsed in Live Actuation Demo!)
    const vcselMat = mats.decoVcselLaser.clone();
    const vcselDie = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 24), vcselMat);
    vcselDie.position.y = 0.39;
    g.userData.vcselMat = vcselMat;

    g.add(pkg, goldFrame, vcselDie);
    register('deco_dtof_vcsel_laser', g, [2.8, 2.8, -2.2]);
  }

  // 13. DOE Diffractive Optical Element (Nano-Grating Dot Projector)
  {
    const g = new THREE.Group();
    g.position.set(LIDAR_X - 0.85, 0.96, LIDAR_Z);

    const doePlate = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.22, 1.56), mats.decoDoeGrating);
    // Visible microscopic diffraction grid ridges etched on the DOE top face
    for (let i = -2; i <= 2; i++) {
      const barX = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 0.06), mats.goldBond);
      barX.position.set(0, 0.12, i * 0.24);
      const barZ = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.34), mats.goldBond);
      barZ.position.set(i * 0.22, 0.12, 0);
      g.add(barX, barZ);
    }
    g.add(doePlate);

    register('deco_dtof_doe_diffuser', g, [3.0, 5.2, -2.4]);
  }

  // 14. SPAD Single-Photon Avalanche Diode Receiver Array (10 ps TDC Clock)
  {
    const g = new THREE.Group();
    g.position.set(LIDAR_X + 0.88, 0.18, LIDAR_Z);

    const sub = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.50, 1.95), mats.icPackageDark);
    const spadDie = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 1.62), mats.decoSpadArray);
    spadDie.position.y = 0.32;
    // 4×4 visible micro-lens / SPAD pixel avalanche array grid
    const cellGeo = new THREE.BoxGeometry(0.20, 0.06, 0.28);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = new THREE.Mesh(cellGeo, mats.l2FinChannel);
        cell.position.set(-0.36 + c * 0.24, 0.42, -0.54 + r * 0.36);
        g.add(cell);
      }
    }
    // Optical baffle septum separating VCSEL transmitter from SPAD receiver (prevents direct optical crosstalk)
    const septum = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.25, 2.05), mats.decoPoronFoam);
    septum.position.set(-0.84, 0.48, 0);

    g.add(sub, spadDie, septum);
    register('deco_dtof_spad_array', g, [4.6, 1.8, -2.8]);
  }

  // =========================================================================
  // 15-18. 9-LED (3×3) ADAPTIVE TRUE TONE FLASH & CONCENTRIC MICRO-FRESNEL LENS
  // =========================================================================

  // 15. Concentric-Ring Micro-Fresnel Diffuser Lens (Genuine Sawtooth Rings!)
  {
    const g = new THREE.Group();
    g.position.set(FLASH_X, 1.56, FLASH_Z);

    const fresnel = createFresnelLensMesh(2.36, 0.56, 7, mats.decoFresnelLens);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.14, 12, 48), mats.susSteel);
    rim.rotation.x = Math.PI / 2;
    g.add(fresnel, rim);

    register('deco_flash_fresnel_lens', g, [3.6, 7.6, 2.8]);
  }

  // 16. 3×3 (9-Element) Adaptive True Tone Multi-LED Matrix (Warm + Cool)
  {
    const g = new THREE.Group();
    g.position.set(FLASH_X, 0.48, FLASH_Z);

    const flashLeds = [];
    const ledGeo = new THREE.BoxGeometry(0.68, 0.22, 0.68);
    // 3×3 checkerboard of Cool White (6500K) and Warm Amber (2200K) high-power LED phosphor dies
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const isCenter = r === 1 && c === 1;
        const isWarm = (r + c) % 2 === 1;
        const baseColor = isCenter ? 0xfffbeb : isWarm ? 0xfbbf24 : 0xe0f2fe;
        const ledMat = new THREE.MeshStandardMaterial({
          color: baseColor,
          emissive: isWarm ? 0xf59e0b : 0xfef9c3,
          emissiveIntensity: isCenter ? 0.55 : 0.35,
          roughness: 0.20,
          metalness: 0.10,
          clippingPlanes: mats.decoTitanium.clippingPlanes,
          side: THREE.DoubleSide
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set((c - 1) * 0.84, 0, (r - 1) * 0.84);
        led.userData.isCenter = isCenter;
        led.userData.isWarm = isWarm;
        g.add(led);
        flashLeds.push(led);
      }
    }
    g.userData.flashLeds = flashLeds;

    register('deco_flash_led_matrix', g, [3.8, 4.4, 3.0]);
  }

  // 17. High-Reflectance Micro-Reflector Cup & AlN Ceramic Thermal Submount
  {
    const g = new THREE.Group();
    g.position.set(FLASH_X, -0.05, FLASH_Z);

    // Conical mirror reflector wall funneling side emission upward into Fresnel lens
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(2.32, 1.58, 1.05, 36, 1, true),
      mats.susSteel
    );
    cup.position.y = 0.52;
    // White AlN high-thermal-conductivity ceramic submount base
    const ceramicBase = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.38, 36), mats.ceramicZirconia);
    ceramicBase.position.y = -0.18;

    g.add(cup, ceramicBase);
    register('deco_flash_reflector_cup', g, [3.6, 1.6, 2.8]);
  }

  // 18. Flash Constant-Current Boost Driver IC & Optical Baffle Divider
  {
    const g = new THREE.Group();
    g.position.set(FLASH_X - 0.4, -1.25, FLASH_Z + 0.4);

    const driver = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.42, 2.05), mats.icPackageDark);
    const inductor = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.52, 1.15), mats.yokePermalloy);
    inductor.position.set(1.85, 0.04, -0.35);
    const goldPads = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.08, 2.25), mats.goldBond);
    goldPads.position.y = -0.22;

    g.add(driver, inductor, goldPads);
    register('deco_flash_driver_ic', g, [4.6, -2.2, 3.8]);
  }

  // =========================================================================
  // 19-20. MULTISPECTRAL COLOR TEMPERATURE & FLICKER SENSOR (11-14ch)
  // =========================================================================

  // 19. Wide-Angle Milky Opal Ambient Diffuser Window (Half-Cutaway)
  {
    const g = new THREE.Group();
    g.position.set(SPEC_X, 1.48, SPEC_Z);

    const opal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.70, 1.70, 0.32, 36, 1, false, Math.PI * 0.55, Math.PI * 1.38),
      mats.decoOpalDiffuser
    );
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.12, 12, 36), mats.decoBezelPvd);
    rim.rotation.x = Math.PI / 2;
    g.add(opal, rim);

    register('deco_spectral_window', g, [1.2, 6.8, 4.4]);
  }

  // 20. 11-14ch Multispectral Color & Flicker Detector IC (Rainbow Spectral Channels!)
  {
    const g = new THREE.Group();
    g.position.set(SPEC_X, 0.25, SPEC_Z);

    const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.55, 2.25), mats.icPackageDark);
    g.add(pkg);

    // 8 vivid visible spectral channels (415nm Violet -> 680nm Red) + NIR + Flicker diode!
    const bandColors = [
      0x7c3aed, 0x4f46e5, 0x2563eb, 0x06b6d4,
      0x10b981, 0xeab308, 0xf97316, 0xef4444
    ];
    const barGeo = new THREE.BoxGeometry(0.36, 0.14, 0.62);
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const bandMat = new THREE.MeshStandardMaterial({
        color: bandColors[i],
        metalness: 0.35,
        roughness: 0.20,
        clippingPlanes: mats.decoTitanium.clippingPlanes,
        side: THREE.DoubleSide
      });
      const bar = new THREE.Mesh(barGeo, bandMat);
      bar.position.set(-0.72 + col * 0.48, 0.32, -0.44 + row * 0.88);
      g.add(bar);
    }

    register('deco_spectral_flicker_ic', g, [1.2, 2.6, 4.6]);
  }

  // =========================================================================
  // 21-22. REAR DIRECTIONAL ZOOM-TRACKING MEMS MICROPHONE & IP68 ACOUSTIC MESH
  // =========================================================================

  // 21. Precision Acoustic Port Slit & Dual Stainless + ePTFE Waterproof Mesh
  {
    const g = new THREE.Group();
    g.position.set(MIC_X, 1.12, MIC_Z);

    // Recessed chamfered microphone pinhole bezel
    const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.18, 12, 32), mats.decoBezelPvd);
    portRing.rotation.x = Math.PI / 2;
    portRing.position.y = 0.42;

    // Fine stainless acoustic protective mesh grid
    for (let i = -2; i <= 2; i++) {
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 0.08), mats.susSteel);
      w1.position.set(0, 0.18, i * 0.28);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 1.55), mats.susSteel);
      w2.position.set(i * 0.28, 0.18, 0);
      g.add(w1, w2);
    }
    // White acoustic ePTFE waterproof membrane directly below mesh
    const mem = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.12, 28), mats.decoEptfeVent);
    mem.position.y = -0.05;
    g.add(portRing, mem);

    register('deco_zoom_mic_mesh', g, [-2.8, 5.6, 4.2]);
  }

  // 22. High-SNR Directional Rear MEMS Microphone Package (SNR 70 dB / AOP 135 dB)
  {
    const g = new THREE.Group();
    g.position.set(MIC_X, -0.45, MIC_Z);

    // Gold-plated metallic RF-shielded MEMS microphone can + L-shaped acoustic boot
    const micCan = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.88, 1.85), mats.goldBond);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.65, 24), mats.decoWaterproofOring);
    boot.position.set(0, 0.72, 0);
    // Tiny visible acoustic inlet port on top of MEMS lid
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 20), mats.lensEdgeBlack);
    inlet.position.set(0, 0.44, 0);

    g.add(micCan, boot, inlet);
    register('deco_mems_microphone', g, [-3.4, 1.4, 4.8]);
  }

  // =========================================================================
  // 23. THERMAL GRAPHITE HEAT-SPREADER SHEET & COPPER EMI SHIELD FOIL
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -3.08;

    const gs = new THREE.Shape();
    gs.absarc(0, 0, DECO_R - 0.6, 0, Math.PI * 2, false);
    // Cut central clear aperture for the 1-inch optical lens module sitting directly below!
    const lensHole = new THREE.Path();
    lensHole.absarc(MAIN_X, MAIN_Z, MAIN_R + 0.65, 0, Math.PI * 2, true);
    gs.holes.push(lensHole);

    const gGeo = new THREE.ExtrudeGeometry(gs, { depth: 0.22, bevelEnabled: false });
    gGeo.rotateX(Math.PI / 2);
    const graphite = new THREE.Mesh(gGeo, mats.graphiteSheet);

    // Electrolytic copper EMI grounding foil strips along the perimeter
    const cuRing = createCutawayRing(DECO_R - 1.35, DECO_R - 0.65, 0.26, mats.copperPad, CUT_START, CUT_LEN);
    cuRing.position.y = -0.10;

    g.add(graphite, cuRing);
    register('deco_thermal_graphite', g, [0, -7.2, 0]);
  }

  // =========================================================================
  // 24. AUXILIARY SENSOR UNIFIED POLYIMIDE FPC & MAINBOARD BTB CONNECTOR
  // =========================================================================
  {
    const g = new THREE.Group();
    g.position.y = -3.65;

    // Multi-branch warm amber polyimide flex routing from LiDAR, Flash, Spectral, and MEMS Mic
    const branchSpecs = [
      { x: 7.0, z: -0.3, w: 2.1, d: 9.8 },   // Connects LiDAR (+7.1,-4.4) <-> Flash (+7.0,+3.8)
      { x: 4.1, z: 6.4, w: 6.2, d: 1.85 },   // Flash -> Spectral (+1.2,+8.8)
      { x: -2.2, z: 8.5, w: 7.8, d: 1.85 },  // Spectral -> MEMS Mic (-5.6,+8.2)
      { x: -11.6, z: 8.2, w: 10.6, d: 2.4 }  // Main trunk exiting to phone motherboard BTB!
    ];
    for (const b of branchSpecs) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.16, b.d), mats.fpcPolyimide);
      m.position.set(b.x, 0, b.z);
      g.add(m);
    }

    // 0.35 mm pitch BTB Mezzanine Snap Connector + gold pins at motherboard exit
    const btb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.56, 3.6), mats.btbHousing);
    btb.position.set(-16.2, -0.22, 8.2);
    for (let i = 0; i < 8; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.18), mats.goldBond);
      pin.position.set(-16.2, -0.52, 6.8 + i * 0.40);
      g.add(pin);
    }
    g.add(btb);

    register('deco_sensor_interconnect_fpc', g, [-4.2, -8.6, 2.8]);
  }

  return {
    root,
    parts,
    gridY: -5.2,
    defaultCameraPos: new THREE.Vector3(34, 24.5, 34),
    defaultTarget: new THREE.Vector3(4.2, 0.4, -1.4),
    clipBounds: { x: 17.5, y: 5.5, z: 17.5 }
  };
}
