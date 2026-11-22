import * as THREE from 'three';
import { updateLiquidMorphMesh } from '../assemblies/LiquidLensAssembly.js';

/**
 * Interactive Physics & CAD Visual Overlays:
 * 1. Optical Photon Rays (Visible R/G/B focusing + Near-Infrared 850nm reflected/absorbed at IRCF;
 *    and wavelength-dependent absorption depth in Micro Pixel mode + electron cascade through D-VTG -> AMP -> Cu-Cu).
 * 2. Exploded-View CAD dashed alignment guide lines.
 * 3. 3D Sensor-Shift OIS (IBIS) real-time multi-axis micro-actuation demo.
 */
export class SimEffects {
  constructor(scene) {
    this.scene = scene;
    this.opticsGroup = new THREE.Group();
    this.opticsGroup.visible = false;
    this.scene.add(this.opticsGroup);

    this.guideGroup = new THREE.Group();
    this.guideGroup.visible = false;
    this.scene.add(this.guideGroup);

    this.photonPulses = [];
    this.mode = 'macro';
    this.opticsEnabled = false;
    this.oisEnabled = false;
  }

  rebuildForMode(mode) {
    this.mode = mode;
    this._clearGroup(this.opticsGroup);
    this._clearGroup(this.guideGroup);
    this.photonPulses = [];

    if (mode === 'macro') {
      this._buildMacroOptics();
      this._buildGuideLines(13.0, -9.5, [[-9.5, -8.0], [9.5, -8.0], [-9.5, 8.0], [9.5, 8.0]]);
    } else if (mode === 'micro') {
      this._buildMicroOptics();
      this._buildGuideLines(15.0, -15.0, [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]]);
    } else if (mode === 'lens') {
      this._buildLensOptics();
      this._buildGuideLines(14.0, -12.4, [[-9.2, -9.2], [9.2, -9.2], [-9.2, 9.2], [9.2, 9.2]]);
    } else if (mode === 'deco') {
      this._buildDecoSensing();
      this._buildGuideLines(12.2, -12.0, [[-13.5, -13.5], [13.5, -13.5], [-13.5, 13.5], [13.5, 13.5]]);
    } else if (mode === 'periscope') {
      this._buildPeriscopeOptics();
      this._buildPeriscopeGuideLines();
    } else if (mode === 'aperture') {
      this._buildApertureOptics();
      this._buildGuideLines(17.5, -15.5, [[-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]]);
    } else if (mode === 'iris') {
      this._buildIrisMicroOptics();
      this._buildGuideLines(13.5, -8.5, [[-14.5, -12.5], [14.5, -12.5], [-14.5, 12.5], [14.5, 12.5]]);
    } else if (mode === 'iris_nano') {
      this._buildIrisNanoPhysics();
      this._buildGuideLines(9.6, -7.2, [[-10.6, -2.6], [10.6, -2.6], [-10.6, 5.6], [10.6, 5.6]]);
    } else if (mode === 'lidar') {
      this._buildLidarPhotonics();
      this._buildGuideLines(13.8, -8.8, [[-10.8, -5.2], [10.8, -5.2], [-10.8, 5.2], [10.8, 5.2]]);
    } else if (mode === 'sma') {
      this._buildSmaPhysics();
      this._buildGuideLines(11.5, -8.5, [[-9.6, -6.5], [11.5, -6.5], [-9.6, 8.8], [11.5, 8.8]]);
    } else if (mode === 'liquid') {
      this._buildLiquidPhysics();
      this._buildGuideLines(11.8, -8.8, [[-9.4, -6.2], [12.0, -6.2], [-9.4, 8.6], [12.0, 8.6]]);
    } else if (mode === 'tetra') {
      this._buildTetraOptics();
      this._buildGuideLines(11.8, -8.8, [[-9.0, -4.5], [12.6, -4.5], [-9.0, 6.2], [12.6, 6.2]]);
    } else {
      this._buildLayer2SignalFlow();
      this._buildGuideLines(13.4, -11.0, [[-8.0, -8.0], [8.0, -8.0], [-8.0, 8.0], [8.0, 8.0]]);
    }
    this.opticsGroup.visible = this.opticsEnabled;
  }

  _clearGroup(group) {
    while (group.children.length) {
      const ch = group.children[0];
      group.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) {
        if (Array.isArray(ch.material)) ch.material.forEach((m) => m.dispose());
        else ch.material.dispose();
      }
    }
  }

  _addRay(points, colorHex, opacity = 0.72, radius = 0.045, pulseCount = 2) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.TubeGeometry(curve, 24, radius, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(tube, mat);
    mesh.userData.ignorePick = true;
    this.opticsGroup.add(mesh);

    // Animated photon/electron wave packets traveling along the ray
    const dotGeo = new THREE.SphereGeometry(radius * 2.5, 10, 10);
    const dotMat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < pulseCount; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.userData.ignorePick = true;
      this.opticsGroup.add(dot);
      this.photonPulses.push({
        mesh: dot,
        curve,
        phase: i / pulseCount,
        speed: 0.38
      });
    }
  }

  _buildMacroOptics() {
    // Visible R/G/B chief rays arriving at realistic Chief Ray Angles (CRA 0°..28°),
    // passing cleanly through the Blue Glass IRCF onto the active pixel surface
    const raySpecs = [
      { top: [-8.2, 11.5, -5.8], hit: [-4.6, 1.76, -3.2], col: 0xef4444 },
      { top: [0.0, 11.5, -3.2], hit: [0.0, 1.76, -1.6], col: 0x22c55e },
      { top: [7.8, 11.5, 4.8], hit: [4.4, 1.76, 2.7], col: 0x3b82f6 },
      { top: [-4.8, 11.5, 5.5], hit: [-2.6, 1.76, 3.1], col: 0x22c55e },
      { top: [5.2, 11.5, -5.2], hit: [2.9, 1.76, -2.9], col: 0xef4444 }
    ];
    for (const r of raySpecs) {
      this._addRay([
        new THREE.Vector3(...r.top),
        new THREE.Vector3(...r.hit)
      ], r.col, 0.62, 0.055, 2);
    }

    // Near-Infrared (850nm NIR) rays reflected sharply off the IRCF dielectric coating!
    const nirSpecs = [
      { start: [-2.8, 11.5, 1.2], bounce: [-1.4, 3.38, 0.5], end: [2.2, 10.6, -1.4] },
      { start: [3.6, 11.5, -1.0], bounce: [1.8, 3.38, -0.4], end: [-2.0, 10.6, 1.6] }
    ];
    for (const n of nirSpecs) {
      this._addRay([
        new THREE.Vector3(...n.start),
        new THREE.Vector3(...n.bounce),
        new THREE.Vector3(...n.end)
      ], 0xd946ef, 0.78, 0.06, 2);
    }
  }

  _buildMicroOptics() {
    // 1. Wavelength-dependent silicon penetration depth inside the 2x2 pixel block:
    //    - Blue (450 nm) absorbed shallow (~0.4 μm -> y ≈ +2.9)
    //    - Green (530 nm) absorbed mid-depth (~1.2 μm -> y ≈ +1.6)
    //    - Red (650 nm) penetrates deep (~3.0 μm -> y ≈ +0.3)
    const pixelRays = [
      // Red pixel (-3.2, -3.2): oblique CRA incoming -> focused by OCL -> penetrates deep PD
      {
        pts: [
          new THREE.Vector3(-4.4, 10.6, -4.4),
          new THREE.Vector3(-3.05, 6.2, -3.05),
          new THREE.Vector3(-3.2, 4.4, -3.2),
          new THREE.Vector3(-3.2, 0.25, -3.2)
        ],
        col: 0xef4444
      },
      // Green Gr pixel (+3.2, -3.2): absorbed mid-depth
      {
        pts: [
          new THREE.Vector3(4.2, 10.6, -4.2),
          new THREE.Vector3(3.05, 6.2, -3.05),
          new THREE.Vector3(3.2, 4.4, -3.2),
          new THREE.Vector3(3.2, 1.55, -3.2)
        ],
        col: 0x22c55e
      },
      // Green Gb pixel (-3.2, +3.2)
      {
        pts: [
          new THREE.Vector3(-4.2, 10.6, 4.2),
          new THREE.Vector3(-3.05, 6.2, 3.05),
          new THREE.Vector3(-3.2, 4.4, 3.2),
          new THREE.Vector3(-3.2, 1.55, 3.2)
        ],
        col: 0x22c55e
      },
      // Blue pixel (+3.2, +3.2): absorbed near backside surface
      {
        pts: [
          new THREE.Vector3(4.4, 10.6, 4.4),
          new THREE.Vector3(3.05, 6.2, 3.05),
          new THREE.Vector3(3.2, 4.4, 3.2),
          new THREE.Vector3(3.2, 2.85, 3.2)
        ],
        col: 0x3b82f6
      }
    ];

    for (const r of pixelRays) {
      this._addRay(r.pts, r.col, 0.78, 0.085, 2);
    }

    // 2. Photoelectron readout cascade: Photodiode -> D-VTG -> Shared FD -> DCNT Via -> 2nd-Layer AMP -> BEOL -> Cu-Cu -> Bottom ADC
    const electronPath = [
      new THREE.Vector3(-3.2, 0.2, -3.2),
      new THREE.Vector3(-2.4, -0.35, -2.4),
      new THREE.Vector3(0.0, -0.92, 0.0),
      new THREE.Vector3(0.0, -2.45, 0.0),
      new THREE.Vector3(-2.6, -2.65, -2.4),
      new THREE.Vector3(-1.5, -3.72, -1.5),
      new THREE.Vector3(-1.5, -4.84, -1.5),
      new THREE.Vector3(-1.5, -5.8, -1.5)
    ];
    this._addRay(electronPath, 0xf59e0b, 0.88, 0.09, 4);
  }

  _buildLayer2SignalFlow() {
    // 1. Gold/Amber: Photoelectron voltage transfer from Layer-1 BSC Sidewall -> FD Deep Contact -> M0 FD -> AMP Tri-Gate
    this._addRay([
      new THREE.Vector3(-5.6, -3.15, -2.0),
      new THREE.Vector3(-3.2, -3.15, 0.35),
      new THREE.Vector3(-3.2, 2.62, 0.35),
      new THREE.Vector3(-3.2, 2.62, -0.95),
      new THREE.Vector3(-3.2, 1.65, -0.95)
    ], 0xf59e0b, 0.9, 0.08, 3);

    // 2. Emerald: Amplified Source-Follower carrier flow across 3 parallel SOI fins -> SEL -> M2 VSL -> Top Exit Via
    for (const fz of [-4.9, -3.5, -2.1]) {
      this._addRay([
        new THREE.Vector3(-5.42, 0.65, fz),
        new THREE.Vector3(-3.2, 0.65, fz),
        new THREE.Vector3(-0.98, 0.65, fz)
      ], 0x10b981, 0.85, 0.065, 2);
    }
    this._addRay([
      new THREE.Vector3(-0.98, 2.62, -3.5),
      new THREE.Vector3(-2.06, 2.62, 0.35),
      new THREE.Vector3(-3.15, 2.62, 4.2),
      new THREE.Vector3(-4.4, 0.72, 4.2),
      new THREE.Vector3(-5.65, 4.46, 4.2),
      new THREE.Vector3(-5.65, 4.46, -5.6),
      new THREE.Vector3(-5.65, 5.65, -5.6)
    ], 0x10b981, 0.85, 0.08, 4);

    // 3. Magenta: High-brightness Overflow Electron Cascade -> FDG -> Stage-1 Trench MOS Cap -> SG -> Stage-2 3D ZAZ MIM Cap
    this._addRay([
      new THREE.Vector3(-3.2, 2.62, 0.58),
      new THREE.Vector3(1.85, 2.62, 0.8),
      new THREE.Vector3(2.7, 0.72, 0.8),
      new THREE.Vector3(3.55, 2.62, 3.9),
      new THREE.Vector3(4.8, 2.62, 3.9),
      new THREE.Vector3(5.4, 0.72, 0.8),
      new THREE.Vector3(4.1, 2.62, -2.4),
      new THREE.Vector3(4.1, 1.35, -4.0)
    ], 0xec4899, 0.88, 0.075, 4);
  }

  _buildLensOptics() {
    // Authentic Multi-Field Refracted Optical Ray Tracing through 1G7P + 6-Blade Variable Aperture Stop
    // 1. Emerald Green: On-axis (0° field) marginal + chief rays converging sharply to center of 1-inch sensor focal plane
    const axialOffsets = [
      { x: 0, z: 0 },
      { x: 2.35, z: 0 },
      { x: -2.35, z: 0 },
      { x: 0, z: 2.35 }
    ];
    for (const o of axialOffsets) {
      this._addRay([
        new THREE.Vector3(o.x * 1.15, 9.2, o.z * 1.15),
        new THREE.Vector3(o.x * 1.12, 6.08, o.z * 1.12), // Sapphire window
        new THREE.Vector3(o.x * 1.04, 4.75, o.z * 1.04), // L1 Molded Glass 1G (strong convergence)
        new THREE.Vector3(o.x * 0.82, 3.52, o.z * 0.82), // 6-Blade Variable Aperture Stop
        new THREE.Vector3(o.x * 0.78, 2.65, o.z * 0.78), // L2 Flint
        new THREE.Vector3(o.x * 0.62, 0.74, o.z * 0.62), // L3/L4
        new THREE.Vector3(o.x * 0.44, -1.36, o.z * 0.44), // L6
        new THREE.Vector3(o.x * 0.24, -3.65, o.z * 0.24), // L8 W-Field Flattener
        new THREE.Vector3(0, -5.85, 0)                    // 1-inch CMOS Focal Plane Center
      ], 0x10b981, 0.82, 0.065, 3);
    }

    // 2. Royal Blue: Mid-field (~20° field) oblique rays passing through aperture stop to mid-image height (r = 3.2 mm)
    for (const s of [-1, 1]) {
      this._addRay([
        new THREE.Vector3(s * -2.15, 9.0, s * 1.45),
        new THREE.Vector3(s * -0.95, 6.08, s * 0.62),
        new THREE.Vector3(s * -0.35, 4.65, s * 0.22),
        new THREE.Vector3(s * 0.15, 3.52, s * -0.10),   // Crossing 6-blade iris stop!
        new THREE.Vector3(s * 0.95, 1.76, s * -0.62),
        new THREE.Vector3(s * 1.88, -0.28, s * -1.25),
        new THREE.Vector3(s * 2.55, -2.46, s * -1.68),  // L7 Gullwing inflection
        new THREE.Vector3(s * 2.85, -3.65, s * -1.88),  // L8 CRA correction
        new THREE.Vector3(s * 3.15, -5.85, s * -2.08)   // Mid-field focus on 1-inch sensor
      ], 0x2563eb, 0.80, 0.062, 3);
    }

    // 3. Crimson Red: Extreme wide-angle (~38° edge field) rays bent by L7 Gullwing & L8 W-Flattener to CRA <= 34°
    for (const s of [-1, 1]) {
      this._addRay([
        new THREE.Vector3(s * -4.25, 8.7, s * -2.45),
        new THREE.Vector3(s * -2.25, 6.08, s * -1.28),
        new THREE.Vector3(s * -1.25, 4.55, s * -0.72),
        new THREE.Vector3(s * -0.15, 3.52, s * -0.08),  // Threading center of 6-blade iris stop!
        new THREE.Vector3(s * 1.45, 1.76, s * 0.84),
        new THREE.Vector3(s * 3.05, -0.28, s * 1.76),
        new THREE.Vector3(s * 4.55, -2.46, s * 2.62),   // Outer Gullwing wing of L7
        new THREE.Vector3(s * 5.25, -3.65, s * 3.02),   // L8 bends ray sharply back toward vertical (CRA <= 34°!)
        new THREE.Vector3(s * 5.75, -5.85, s * 3.32)    // 1-inch Image Circle Corner (r ≈ 6.6 mm)
      ], 0xef4444, 0.84, 0.065, 3);
    }

    // Translucent 1-inch CMOS Focal Plane Reference Disc (φ16 mm Image Circle target below L8)
    const focalDisc = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 6.85, 64),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    focalDisc.rotation.x = -Math.PI / 2;
    focalDisc.position.y = -5.86;
    focalDisc.userData.ignorePick = true;

    const focalRim = new THREE.Mesh(
      new THREE.RingGeometry(6.72, 6.88, 64),
      new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.52,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    focalRim.rotation.x = -Math.PI / 2;
    focalRim.position.y = -5.85;
    focalRim.userData.ignorePick = true;
    this.opticsGroup.add(focalDisc, focalRim);
  }

  _buildDecoSensing() {
    // 1. Main Lens Incoming Visible Light (98% Transmittance through Gorilla Glass DX+ AR Stack)
    const MAIN_X = -2.8, MAIN_Z = -1.0;
    const mainRays = [
      { ox: 0, oz: 0, col: 0x10b981 },
      { ox: 3.1, oz: 0, col: 0x0ea5e9 },
      { ox: -3.1, oz: 0, col: 0x0ea5e9 },
      { ox: 0, oz: 3.1, col: 0x22c55e },
      { ox: 0, oz: -3.1, col: 0x22c55e }
    ];
    for (const r of mainRays) {
      this._addRay([
        new THREE.Vector3(MAIN_X + r.ox * 1.18, 9.8, MAIN_Z + r.oz * 1.18),
        new THREE.Vector3(MAIN_X + r.ox, 2.2, MAIN_Z + r.oz),
        new THREE.Vector3(MAIN_X + r.ox * 0.92, 1.4, MAIN_Z + r.oz * 0.92),
        new THREE.Vector3(MAIN_X + r.ox * 0.65, -4.5, MAIN_Z + r.oz * 0.65)
      ], r.col, 0.80, 0.08, 3);
    }

    // 2. 940 nm dToF LiDAR Laser Fan (VCSEL -> DOE Diffractive Dot Fan -> Returning to SPAD!)
    const VX = 7.1 - 0.85, VZ = -4.4;
    const SX = 7.1 + 0.88, SZ = -4.4;
    const doeFans = [
      [0, 0], [2.4, 2.0], [-2.2, 2.2], [2.4, -2.0], [-2.0, -2.2]
    ];
    for (const [fx, fz] of doeFans) {
      this._addRay([
        new THREE.Vector3(VX, 0.45, VZ),
        new THREE.Vector3(VX, 1.05, VZ),
        new THREE.Vector3(VX + fx * 0.35, 3.6, VZ + fz * 0.35),
        new THREE.Vector3(VX + fx, 9.6, VZ + fz)
      ], 0xe11d48, 0.85, 0.065, 3);
    }
    // Returning reflected single-photon paths entering SPAD receiver array
    for (const [rx, rz] of [[1.8, 1.6], [-1.2, -1.6]]) {
      this._addRay([
        new THREE.Vector3(SX + rx, 9.6, SZ + rz),
        new THREE.Vector3(SX + rx * 0.35, 3.8, SZ + rz * 0.35),
        new THREE.Vector3(SX, 1.5, SZ),
        new THREE.Vector3(SX, 0.45, SZ)
      ], 0xa855f7, 0.82, 0.065, 3);
    }

    // 3. Adaptive 9-LED True Tone Flash Beam Cone through Concentric Fresnel Lens
    const FX = 7.0, FZ = 3.8;
    for (const [dx, dz, col] of [[0, 0, 0xfef08a], [2.6, 1.8, 0xf59e0b], [-2.2, 2.2, 0xfbbf24], [2.2, -2.0, 0xfbbf24]]) {
      this._addRay([
        new THREE.Vector3(FX + dx * 0.15, 0.55, FZ + dz * 0.15),
        new THREE.Vector3(FX + dx * 0.35, 1.75, FZ + dz * 0.35),
        new THREE.Vector3(FX + dx * 1.15, 9.2, FZ + dz * 1.15)
      ], col, 0.80, 0.075, 2);
    }

    // 4. Multispectral Ambient Light (Violet-Cyan) & Zoom MEMS Mic Acoustic Input Waves (Teal)
    this._addRay([
      new THREE.Vector3(1.2 + 1.8, 8.8, 8.8 + 1.8),
      new THREE.Vector3(1.2, 1.6, 8.8),
      new THREE.Vector3(1.2, 0.4, 8.8)
    ], 0x8b5cf6, 0.82, 0.07, 2);

    this._addRay([
      new THREE.Vector3(-5.6 - 2.0, 8.2, 8.2 + 2.2),
      new THREE.Vector3(-5.6, 1.5, 8.2),
      new THREE.Vector3(-5.6, -0.2, 8.2)
    ], 0x06b6d4, 0.82, 0.07, 2);
  }

  _buildPeriscopeOptics() {
    const PRISM_X = -8.8;
    const SENSOR_X = 10.02;

    // Helper for razor-sharp 90° mirror reflection bounce on 45° hypotenuse (x - PRISM_X) + y = 0
    const addFoldedRay = (pts, col, opacity = 0.84, rad = 0.068, pulses = 3) => {
      this._addRay(pts, col, opacity, rad, pulses);
    };

    // 1. On-Axis Emerald Green Telephoto Rays (0° field):
    //    Enter vertically downward (+Y -> -Y), strike 45° silver hypotenuse at (PRISM_X + dx, -dx, dz),
    //    fold sharply 90° along +X through G1 -> FCD100 ED -> G3 Flint -> G4 Macro -> G5 Flattener -> Vertical 200MP Sensor!
    const axialOffsets = [
      { dx: 0.0, dz: 0.0 },
      { dx: -1.55, dz: 0.0 },
      { dx: 1.55, dz: 0.0 },
      { dx: 0.0, dz: 1.95 },
      { dx: 0.0, dz: -1.95 }
    ];
    for (const o of axialOffsets) {
      const hx = PRISM_X + o.dx;
      const hy = -o.dx;
      const hz = o.dz;
      addFoldedRay([
        new THREE.Vector3(hx, 9.6, hz),
        new THREE.Vector3(hx, 4.38, hz),       // Rectangular AR entrance window
        new THREE.Vector3(hx, hy + 0.14, hz),  // Sharp corner lead-in knot
        new THREE.Vector3(hx, hy, hz),         // Exact 45° Ag mirror reflection point!
        new THREE.Vector3(hx + 0.14, hy, hz),  // Sharp 90° corner lead-out knot
        new THREE.Vector3(-4.35, hy * 0.96, hz * 0.96), // G1 front D-cut
        new THREE.Vector3(-1.35, hy * 0.78, hz * 0.78), // G2 HOYA FCD100 Fluorite ED!
        new THREE.Vector3(0.45, hy * 0.68, hz * 0.68),  // G3 Flint APO doublet
        new THREE.Vector3(2.45, hy * 0.50, hz * 0.50),  // G4 Floating Tele-Macro
        new THREE.Vector3(4.45, hy * 0.30, hz * 0.30),  // G5 Rear Field Flattener
        new THREE.Vector3(8.75, hy * 0.08, hz * 0.08),  // Vertical Blue-Glass IRCF
        new THREE.Vector3(SENSOR_X, 0.0, 0.0)           // Vertical 1/1.4" 200MP CMOS center
      ], 0x10b981, 0.84, 0.068, 3);
    }

    // 2. Upper-Field Royal Blue Telephoto Rays (+4.5° narrow telephoto FOV -> focuses on lower-front sensor quadrant)
    for (const off of [-0.95, 0.95]) {
      const hx = PRISM_X + off * 0.85;
      const hy = -off * 0.85;
      addFoldedRay([
        new THREE.Vector3(hx - 0.85, 9.6, -0.65),
        new THREE.Vector3(hx - 0.32, 4.38, -0.22),
        new THREE.Vector3(hx - 0.04, hy + 0.14, 0.02),
        new THREE.Vector3(hx, hy, 0.05),
        new THREE.Vector3(hx + 0.14, hy - 0.04, 0.10),
        new THREE.Vector3(-4.35, hy * 0.85 - 0.45, 0.55),
        new THREE.Vector3(-1.35, hy * 0.58 - 0.95, 1.15),
        new THREE.Vector3(2.45, hy * 0.30 - 1.55, 2.05),
        new THREE.Vector3(4.45, hy * 0.15 - 1.88, 2.55),
        new THREE.Vector3(SENSOR_X, -2.15, 3.05)
      ], 0x2563eb, 0.82, 0.062, 3);
    }

    // 3. Lower-Field Crimson Red Telephoto Rays (-4.5° FOV -> focuses on upper-rear sensor quadrant)
    for (const off of [-0.95, 0.95]) {
      const hx = PRISM_X + off * 0.85;
      const hy = -off * 0.85;
      addFoldedRay([
        new THREE.Vector3(hx + 0.85, 9.6, 0.65),
        new THREE.Vector3(hx + 0.32, 4.38, 0.22),
        new THREE.Vector3(hx + 0.04, hy + 0.14, -0.02),
        new THREE.Vector3(hx, hy, -0.05),
        new THREE.Vector3(hx + 0.14, hy + 0.04, -0.10),
        new THREE.Vector3(-4.35, hy * 0.85 + 0.45, -0.55),
        new THREE.Vector3(-1.35, hy * 0.58 + 0.95, -1.15),
        new THREE.Vector3(2.45, hy * 0.30 + 1.55, -2.05),
        new THREE.Vector3(4.45, hy * 0.15 + 1.88, -2.55),
        new THREE.Vector3(SENSOR_X, 2.15, -3.05)
      ], 0xef4444, 0.82, 0.062, 3);
    }

    // Translucent Vertical Focal-Plane Highlight Frame on the 1/1.4" 200MP CMOS Active Surface
    const focalBorderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(9.1, 6.8));
    focalBorderGeo.rotateY(-Math.PI / 2);
    const focalBorder = new THREE.LineSegments(
      focalBorderGeo,
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.72 })
    );
    focalBorder.position.set(SENSOR_X - 0.02, 0, 0);
    focalBorder.userData.ignorePick = true;
    this.opticsGroup.add(focalBorder);
  }

  _buildPeriscopeGuideLines() {
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.48,
      gapSize: 0.36,
      transparent: true,
      opacity: 0.55
    });
    const segments = [
      // Horizontal folded optical axis spanning prism -> D-cut lenses -> vertical 200MP sensor -> heatsink
      [new THREE.Vector3(-16.5, 0, 0), new THREE.Vector3(22.5, 0, 0)],
      // Vertical incoming optical axis through entrance window -> 45° prism -> Pitch OIS coil
      [new THREE.Vector3(-8.8, -11.0, 0), new THREE.Vector3(-8.8, 13.5, 0)],
      // Vertical alignment axes at outer module corners
      [new THREE.Vector3(-13.5, -10.5, -6.2), new THREE.Vector3(-13.5, 11.5, -6.2)],
      [new THREE.Vector3(12.2, -10.5, -6.2), new THREE.Vector3(12.2, 11.5, -6.2)]
    ];
    for (const [p0, p1] of segments) {
      const geo = new THREE.BufferGeometry().setFromPoints([p0, p1]);
      const line = new THREE.Line(geo, lineMat);
      line.computeLineDistances();
      line.userData.ignorePick = true;
      this.guideGroup.add(line);
    }
  }

  _buildApertureOptics() {
    // 1. Emerald Core Rays (f/4.0 Paraxial Bundle): thread straight through the stopped-down 6-blade hexagonal iris!
    const coreOffsets = [
      { x: 0, z: 0 },
      { x: 1.85, z: 0 },
      { x: -1.85, z: 0 },
      { x: 0, z: 1.85 },
      { x: 0, z: -1.85 }
    ];
    for (const o of coreOffsets) {
      this._addRay([
        new THREE.Vector3(o.x * 1.15, 11.2, o.z * 1.15),
        new THREE.Vector3(o.x * 1.12, 6.25, o.z * 1.12), // L1 Moth-Eye & ALD Coat
        new THREE.Vector3(o.x * 1.02, 4.75, o.z * 1.02), // L1 Lanthanum Glass + Hybrid UV Layer
        new THREE.Vector3(o.x * 0.86, 1.35, o.z * 0.86), // Threading cleanly through 6-Blade Iris Opening!
        new THREE.Vector3(o.x * 0.72, -0.78, o.z * 0.72), // L2 Flint Interlock
        new THREE.Vector3(o.x * 0.52, -2.55, o.z * 0.52), // L3 APEL Crown
        new THREE.Vector3(o.x * 0.30, -4.62, o.z * 0.30), // L4 Gullwing Field Flattener
        new THREE.Vector3(0, -8.8, 0)                     // Sharp Focal Point below L4!
      ], 0x10b981, 0.84, 0.095, 3);
    }

    // 2. Royal-Blue Oblique Field Rays passing through the optical stop at L1/L2 junction & steered by L4 Gullwing
    for (const s of [-1, 1]) {
      this._addRay([
        new THREE.Vector3(s * -4.2, 11.0, s * 2.4),
        new THREE.Vector3(s * -2.2, 6.1, s * 1.25),
        new THREE.Vector3(s * -0.9, 4.4, s * 0.52),
        new THREE.Vector3(s * 0.35, 1.35, s * -0.20),    // Crossing center of 6-blade iris!
        new THREE.Vector3(s * 1.65, -0.78, s * -0.95),
        new THREE.Vector3(s * 2.95, -2.55, s * -1.70),
        new THREE.Vector3(s * 4.35, -4.62, s * -2.52),   // L4 Gullwing inflection bends rays vertically!
        new THREE.Vector3(s * 4.95, -8.8, s * -2.86)
      ], 0x2563eb, 0.80, 0.088, 3);
    }

    // 3. Amber-Orange Marginal Rays (f/1.42 outer pupil) intercepted & cleanly blocked by the 6 DLC knife-edge blades at Y=+1.42!
    const stopAngles = [0.25, 1.30, 2.35, 3.40, 4.45, 5.50];
    for (const a of stopAngles) {
      const rIn = 4.65;
      const rHit = 3.85;
      this._addRay([
        new THREE.Vector3(Math.cos(a) * (rIn + 0.5), 10.8, Math.sin(a) * (rIn + 0.5)),
        new THREE.Vector3(Math.cos(a) * rIn, 5.95, Math.sin(a) * rIn),
        new THREE.Vector3(Math.cos(a) * (rIn - 0.35), 4.45, Math.sin(a) * (rIn - 0.35)),
        new THREE.Vector3(Math.cos(a) * rHit, 1.48, Math.sin(a) * rHit) // Stopped right on the 6 DLC iris blades!
      ], 0xf59e0b, 0.78, 0.082, 2);
    }

    // 4. Magenta Grazing Off-Axis Stray-Light Rays trapped & extinguished by Serrated Baffles / Edge Blackening!
    this._addRay([
      new THREE.Vector3(5.8, 10.6, -4.6),
      new THREE.Vector3(-4.2, 5.8, -5.2),
      new THREE.Vector3(-7.6, 4.6, -2.4),  // Strikes L1 Edge Blackening / Inner Serrated Baffle & dies!
      new THREE.Vector3(-8.1, 3.5, -1.8)
    ], 0xd946ef, 0.82, 0.085, 2);
  }

  _buildIrisMicroOptics() {
    // 1. Emerald Core Passing Rays threading straight through the central hexagonal diaphragm opening
    const corePts = [
      [0, 0], [2.1, 0], [-2.1, 0], [0, 2.1], [0, -2.1]
    ];
    for (const [cx, cz] of corePts) {
      this._addRay([
        new THREE.Vector3(cx * 1.15, 8.8, cz * 1.15),
        new THREE.Vector3(cx, 0.45, cz),
        new THREE.Vector3(cx * 0.55, -5.8, cz * 0.55)
      ], 0x10b981, 0.84, 0.11, 3);
    }

    // 2. Amber Marginal Rays (f/1.42 outer pupil) intercepted cleanly on the 6 razor-thin DLC knife edges!
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      this._addRay([
        new THREE.Vector3(Math.cos(a) * 6.2, 8.6, Math.sin(a) * 6.2),
        new THREE.Vector3(Math.cos(a) * 5.2, 0.72, Math.sin(a) * 5.2)
      ], 0xf59e0b, 0.78, 0.095, 2);
    }

    // 3. Golden 6-Point Starburst Diffraction Spike Fan (6条光芒) radiating below the 6-blade hexagonal diaphragm!
    const starY = -3.8;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.18;
      this._addRay([
        new THREE.Vector3(Math.cos(a) * 2.4, 0.25, Math.sin(a) * 2.4),
        new THREE.Vector3(Math.cos(a) * 3.8, starY * 0.55, Math.sin(a) * 3.8),
        new THREE.Vector3(Math.cos(a) * 7.8, starY, Math.sin(a) * 7.8)
      ], 0xfacc15, 0.76, 0.085, 2);
    }
  }

  _buildIrisNanoPhysics() {
    // 1. Emerald Optical Chief Rays grazing past the < 5 μm chemical half-etched knife edge without glare!
    for (const zOff of [-1.2, 0.0, 1.1]) {
      this._addRay([
        new THREE.Vector3(11.15, 5.4, zOff),
        new THREE.Vector3(11.05, 0.63, zOff),
        new THREE.Vector3(11.20, -3.6, zOff)
      ], 0x10b981, 0.84, 0.075, 2);
    }

    // 2. Magenta Oblique Stray Light absorbed & extinguished in the Ra = 0.3 μm matte micro-pyramid trap!
    this._addRay([
      new THREE.Vector3(9.4, 5.1, -1.8),
      new THREE.Vector3(6.1, 1.56, -1.55),
      new THREE.Vector3(5.45, 1.48, -1.48),
      new THREE.Vector3(4.95, 1.52, -1.62)
    ], 0xd946ef, 0.82, 0.068, 2);

    // 3. Crimson 4-Point Hertzian Contact & Magnetic Preload Load Paths through Gothic-Arch V-Grooves & Y-TZP Ball!
    for (const sx of [-1, 1]) {
      this._addRay([
        new THREE.Vector3(-8.4 + sx * 1.13, 5.1, -0.2),
        new THREE.Vector3(-8.4 + sx * 1.13, 2.05, -0.2),
        new THREE.Vector3(-8.4 + sx * 0.52, 0.92, -0.2),
        new THREE.Vector3(-8.4 + sx * 1.13, -0.21, -0.2),
        new THREE.Vector3(-8.4 + sx * 1.13, -2.55, -0.2)
      ], 0xf43f5e, 0.80, 0.065, 2);
    }

    // 4. Cyan Electrostatic ESD Drain Streams flowing off the dimple Hertz point through the CNT network inside PTFE!
    this._addRay([
      new THREE.Vector3(5.4, -0.63, 0.30),
      new THREE.Vector3(3.6, -0.96, 0.10),
      new THREE.Vector3(1.6, -1.02, -0.25),
      new THREE.Vector3(-0.2, -0.98, -0.40)
    ], 0x06b6d4, 0.82, 0.062, 2);

    // 5. Amber VCM Drive Current (I_coil) streaming through the Φ28 μm self-bonding OFC copper cores!
    for (const [yy, zz] of [[-0.52, 4.55], [-1.22, 4.95], [-1.92, 4.55]]) {
      this._addRay([
        new THREE.Vector3(-10.4, yy, zz),
        new THREE.Vector3(-6.6, yy, zz),
        new THREE.Vector3(-2.6, yy, zz)
      ], 0xf59e0b, 0.84, 0.065, 2);
    }
  }

  _buildLidarPhotonics() {
    const X_TX = -5.4;
    const X_RX = 5.4;

    // 1. Crimson 940 nm VCSEL Emission: MQW -> AlOx aperture -> Collimator -> Quartz DOE -> 5-Beam Structured Dot Fan!
    const doeFanDirs = [
      [-3.8, -2.0],
      [-2.2, 2.2],
      [0.0, 0.0],
      [2.2, -2.1],
      [3.6, 2.0]
    ];
    for (const [dx, dz] of doeFanDirs) {
      this._addRay([
        new THREE.Vector3(X_TX, 0.25, 0.0),                        // Multi-junction MQW gain core
        new THREE.Vector3(X_TX + dx * 0.22, 3.98, dz * 0.22),      // Collimated by Aspheric Glass Lens
        new THREE.Vector3(X_TX + dx * 0.34, 6.22, dz * 0.34),      // Multi-level Quartz DOE diffraction step!
        new THREE.Vector3(X_TX + dx * 1.18, 12.6, dz * 1.18)       // Structured 3D infrared dot fan into room!
      ], 0xe11d48, 0.84, 0.072, 3);
    }

    // 2. Amber Eye-Safety Back-Reflection Ray from Quartz DOE underside -> Tilted Monitor PD!
    this._addRay([
      new THREE.Vector3(X_TX + 0.65, 5.82, -0.55),
      new THREE.Vector3(X_TX + 3.45, 2.38, -1.55)
    ], 0xf59e0b, 0.82, 0.055, 2);

    // 3. Electric-Magenta Returning 940 nm Target Echo Photons -> Bandpass Filter -> 4P Lens -> Dual-Diffraction Zig-Zag -> SPAD Avalanche -> Cu-Cu -> 10 ps TDC!
    const rxBeams = [
      { topX: X_RX - 2.6, topZ: -1.4, pixX: X_RX - 1.76, pixZ: 0.0 },
      { topX: X_RX + 0.2, topZ: 0.4,  pixX: X_RX,        pixZ: 0.0 },
      { topX: X_RX + 2.4, topZ: 1.4,  pixX: X_RX + 1.76, pixZ: 0.0 }
    ];
    for (const b of rxBeams) {
      this._addRay([
        new THREE.Vector3(b.topX, 12.6, b.topZ),                   // Returning target echo photon
        new THREE.Vector3(X_RX + (b.topX - X_RX) * 0.62, 6.32, b.topZ * 0.62), // Passes 940nm Bandpass Filter!
        new THREE.Vector3(X_RX + (b.topX - X_RX) * 0.48, 4.16, b.topZ * 0.48), // Focused by L1/L2/L3/L4
        new THREE.Vector3(b.pixX, 0.72, b.pixZ),                   // OCL + Sony PSD inverted pyramid!
        new THREE.Vector3(b.pixX + 0.35, -0.15, b.pixZ + 0.22),    // Obliquely diffracted inside deep Si!
        new THREE.Vector3(b.pixX, -0.58, b.pixZ),                  // Triggers 24V Geiger-Mode Avalanche!
        new THREE.Vector3(b.pixX, -2.02, b.pixZ)                   // Streams through Cu-Cu -> Quench -> 10 ps TDC!
      ], 0xd946ef, 0.84, 0.070, 3);
    }

    // 4. Solar Visible-Light Noise Rays (Blue & Yellow) REJECTED cleanly off top of 940 nm Narrowband Bandpass Filter!
    this._addRay([
      new THREE.Vector3(X_RX - 4.2, 11.8, 2.2),
      new THREE.Vector3(X_RX - 1.4, 6.50, 0.8),
      new THREE.Vector3(X_RX + 2.2, 11.2, -1.2)
    ], 0x38bdf8, 0.78, 0.062, 2);
    this._addRay([
      new THREE.Vector3(X_RX + 3.8, 11.6, -2.4),
      new THREE.Vector3(X_RX + 1.3, 6.50, -0.9),
      new THREE.Vector3(X_RX - 2.0, 11.0, 1.4)
    ], 0xfacc15, 0.78, 0.062, 2);
  }

  _buildSmaPhysics() {
    const X_ACT = -3.0;
    const Z_ACT = -0.3;
    const X_MIC = 8.4;
    const Y_MIC = 0.65;

    // 1. Emerald Optical Chief Rays passing cleanly through the floating 1-inch glass lens payload!
    for (const [ox, oz] of [[0, 0], [1.45, 0], [-1.45, 0], [0, 1.45], [0, -1.45]]) {
      this._addRay([
        new THREE.Vector3(X_ACT + ox * 1.12, 8.6, Z_ACT + oz * 1.12),
        new THREE.Vector3(X_ACT + ox * 0.96, 2.65, Z_ACT + oz * 0.96),
        new THREE.Vector3(X_ACT + ox * 0.78, 1.25, Z_ACT + oz * 0.78),
        new THREE.Vector3(X_ACT + ox * 0.62, -0.10, Z_ACT + oz * 0.62),
        new THREE.Vector3(X_ACT + ox * 0.28, -5.2, Z_ACT + oz * 0.28)
      ], 0x10b981, 0.84, 0.072, 3);
    }

    // 2. Blazing Orange PWM Joule-Heating Drive Current (I_PWM: CM824 ASIC -> 0.1% Shunts -> Static Crimps -> Hot Pulling SMA Wires -> Common Ring!)
    this._addRay([
      new THREE.Vector3(X_ACT - 1.85, -1.82, Z_ACT + 7.45), // CM824 ASIC
      new THREE.Vector3(X_ACT + 1.25, -2.02, Z_ACT + 7.15), // 0.1% Precision Shunt Bank
      new THREE.Vector3(X_ACT + 3.75, -1.42, Z_ACT + 5.56), // +Z Front Static Crimp
      new THREE.Vector3(X_ACT - 2.55, 2.48, Z_ACT + 5.26),  // Up +Z Pulling SMA Wire!
      new THREE.Vector3(X_ACT - 2.55, 2.64, Z_ACT + 4.82)   // Into Moving Common Power Ring
    ], 0xf97316, 0.88, 0.068, 3);

    this._addRay([
      new THREE.Vector3(X_ACT - 1.85, -1.82, Z_ACT + 7.45), // CM824 ASIC
      new THREE.Vector3(X_ACT + 2.65, -2.02, Z_ACT + 6.95), // 0.1% Precision Shunt Bank
      new THREE.Vector3(X_ACT + 5.56, -1.42, Z_ACT + 3.75), // +X Right Static Crimp
      new THREE.Vector3(X_ACT + 5.26, 2.48, Z_ACT - 2.55),  // Up +X Pulling SMA Wire!
      new THREE.Vector3(X_ACT + 4.80, 2.64, Z_ACT - 2.55)   // Into Moving Common Power Ring
    ], 0xf97316, 0.88, 0.068, 3);

    // 3. Cyan >10 kHz Elastoresistive Self-Sensing (R = ρ·L/A) Return Loop (Zero Hall Sensors!)
    this._addRay([
      new THREE.Vector3(X_ACT - 4.78, 2.64, Z_ACT + 4.20),  // Moving Common Ring corner
      new THREE.Vector3(X_ACT - 5.45, 0.45, Z_ACT + 5.45),  // Down S-Curve BeCu Common Flexure
      new THREE.Vector3(X_ACT - 4.40, -2.05, Z_ACT + 6.80), // Across PCB sense bus
      new THREE.Vector3(X_ACT - 1.85, -1.82, Z_ACT + 7.45)  // Back to CM824 14-bit ADC!
    ], 0x06b6d4, 0.86, 0.065, 3);

    // Kelvin 4-Wire Self-Sensing Micro-Current across Right-Side 120x Magnified NiTiCu Wire Cutaway!
    this._addRay([
      new THREE.Vector3(X_MIC, Y_MIC + 2.75, 4.18),         // Upper Gold Kelvin Needle
      new THREE.Vector3(X_MIC, Y_MIC + 1.55, 4.18),         // Electrode Ring
      new THREE.Vector3(X_MIC, Y_MIC, 2.58),                // Rigid Cubic Austenite Zone (low R!)
      new THREE.Vector3(X_MIC, Y_MIC, 0.92),                // Glowing Phase Front
      new THREE.Vector3(X_MIC, Y_MIC, -0.78),               // Sheared Monoclinic Martensite Zone (high R!)
      new THREE.Vector3(X_MIC, Y_MIC, -3.55)                // Into 150° Folded Micro-Crimp Jaw!
    ], 0x06b6d4, 0.85, 0.068, 3);

    // 4. Amber Patented GB2607269A Tapered-Gap Rapid Heat Dissipation Arrows (Wire Midspan -> Tapered Heat Sink Fins!)
    for (const [p0, p1] of [
      [new THREE.Vector3(X_ACT + 5.35, 0.55, Z_ACT + 0.35), new THREE.Vector3(X_ACT + 6.55, 0.55, Z_ACT + 0.35)],
      [new THREE.Vector3(X_ACT + 0.35, 0.55, Z_ACT + 5.35), new THREE.Vector3(X_ACT + 0.35, 0.55, Z_ACT + 6.55)],
      [new THREE.Vector3(X_ACT - 5.35, 0.55, Z_ACT - 0.35), new THREE.Vector3(X_ACT - 6.65, 0.55, Z_ACT - 0.35)]
    ]) {
      this._addRay([p0, p1], 0xf59e0b, 0.84, 0.062, 2);
    }
  }

  _buildLiquidPhysics() {
    const X_CELL = -3.2;
    const Z_CELL = -0.2;
    const X_MIC = 8.4;
    const Y_MIC = 0.55;
    const Z_MIC = 0.2;

    // 1. Emerald & Royal-Blue Optical Rays refracting strongly across the Water (n=1.35) -> Oil (n=1.54) Curved Meniscus!
    for (const [ox, oz, col] of [
      [0, 0, 0x10b981],
      [1.85, 0, 0x10b981],
      [-1.85, 0, 0x10b981],
      [0, 1.85, 0x2563eb],
      [0, -1.85, 0x2563eb]
    ]) {
      this._addRay([
        new THREE.Vector3(X_CELL + ox * 1.18, 8.6, Z_CELL + oz * 1.18),
        new THREE.Vector3(X_CELL + ox * 1.04, 3.85, Z_CELL + oz * 1.04),  // Enters G1 Companion Glass
        new THREE.Vector3(X_CELL + ox * 0.96, 1.98, Z_CELL + oz * 0.96),  // Enters Conductive Water (n=1.35)
        new THREE.Vector3(X_CELL + ox * 0.92, 0.42, Z_CELL + oz * 0.92),  // Sharp Snell Refraction at Oil-Water Meniscus (n=1.54)!
        new THREE.Vector3(X_CELL + ox * 0.62, -1.98, Z_CELL + oz * 0.62), // Converging through Optical Oil!
        new THREE.Vector3(X_CELL + ox * 0.44, -2.85, Z_CELL + oz * 0.44), // G2 Relay Glass
        new THREE.Vector3(X_CELL, -6.2, Z_CELL)                           // Crisp Macro Focal Convergence!
      ], col, 0.84, 0.068, 3);
    }

    // 2. Blazing Amber-Gold 60 Vrms / 1 kHz AC Charge-Pump Drive Pulses (ASIC -> 100V MLCCs -> Feedthrough Pins -> 4-Quadrant Conical Electrodes!)
    this._addRay([
      new THREE.Vector3(X_CELL - 1.95, -2.28, Z_CELL + 6.95), // MAX14574/HV892 60 Vrms Charge-Pump ASIC
      new THREE.Vector3(X_CELL + 2.15, -2.52, Z_CELL + 6.52), // 100V Flying MLCC Bank
      new THREE.Vector3(X_CELL + 4.75, -2.25, Z_CELL - 1.35), // Hermetic Feedthrough Pin Q1 (+X)
      new THREE.Vector3(X_CELL + 3.92, -0.35, Z_CELL - 1.12), // Up Q1 Conical Gold Electrode!
      new THREE.Vector3(X_CELL + 4.25, 1.35, Z_CELL - 1.22)
    ], 0xf59e0b, 0.88, 0.066, 3);

    this._addRay([
      new THREE.Vector3(X_CELL - 1.95, -2.28, Z_CELL + 6.95), // 60 Vrms ASIC
      new THREE.Vector3(X_CELL - 2.65, -2.25, Z_CELL + 4.22), // Front Feedthrough Pin Q3 (+Z)
      new THREE.Vector3(X_CELL - 2.20, -0.25, Z_CELL + 3.55), // Up Q3 Conical Gold Electrode!
      new THREE.Vector3(X_CELL - 2.38, 1.32, Z_CELL + 3.88)
    ], 0xf59e0b, 0.86, 0.064, 3);

    // 3. Cyan Closed-Loop Capacitance Self-Sensing (C = 60-220 pF) Return Loop (Common Immersion Ring -> CDC Feedback IC!)
    this._addRay([
      new THREE.Vector3(X_CELL + 3.45, 1.82, Z_CELL - 2.45),  // Upper Immersion Common Ring Electrode
      new THREE.Vector3(X_CELL + 4.90, -0.40, Z_CELL + 2.40), // Guarded Capacitance Sense Return
      new THREE.Vector3(X_CELL + 2.55, -2.45, Z_CELL + 5.85),
      new THREE.Vector3(X_CELL + 0.58, -2.38, Z_CELL + 6.95)  // Back into CDC Capacitance Feedback IC!
    ], 0x06b6d4, 0.86, 0.064, 3);

    // 4. Violet-Magenta Nanoscale Electrostatic Maxwell Field Pulses crossing the 500x Parylene AF-4 Dielectric & pulling EDL ions!
    for (const dy of [-0.55, 0.15, 0.85]) {
      this._addRay([
        new THREE.Vector3(X_MIC - 1.95, Y_MIC + dy, Z_MIC + 2.42),
        new THREE.Vector3(X_MIC - 1.15, Y_MIC + dy, Z_MIC + 2.42),
        new THREE.Vector3(X_MIC - 0.28, Y_MIC + dy - 0.25, Z_MIC + 2.42)
      ], 0xc026d3, 0.86, 0.058, 2);
    }
  }

  _buildTetraOptics() {
    // Sharp piecewise-linear 4-bounce W-path ray helper (exact Law of Reflection at M1 -> M2 -> M3 -> M4!)
    const addSharpBounceRay = (pts, colorHex, opacity = 0.86, radius = 0.072, pulseCount = 4) => {
      const path = new THREE.CurvePath();
      const segMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        depthWrite: false
      });
      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        path.add(new THREE.LineCurve3(a, b));
        const dir = b.clone().sub(a);
        const len = dir.length();
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), segMat);
        cyl.position.copy(a).add(b).multiplyScalar(0.5);
        if (len > 1e-5) cyl.quaternion.setFromUnitVectors(up, dir.divideScalar(len));
        cyl.userData.ignorePick = true;
        this.opticsGroup.add(cyl);
      }

      // Luminous bounce highlight beads right on the 4 reflection points (M1, M2, M3, M4)
      const dotGeo = new THREE.SphereGeometry(radius * 2.45, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: colorHex });
      for (let k = 0; k < pulseCount; k++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.userData.ignorePick = true;
        this.opticsGroup.add(dot);
        this.photonPulses.push({
          mesh: dot,
          curve: path,
          phase: k / pulseCount,
          speed: 0.22 + (k % 2) * 0.03
        });
      }
    };

    // 1. Emerald Central Chief Ray: Exact 4-Bounce W-Path (M1 18.8° -> M2 37.7° TIR -> M3 37.7° TIR -> M4 18.8° -> Sensor!)
    addSharpBounceRay([
      new THREE.Vector3(-6.0, 9.6, 0.0),   // Above 7-element circular entrance barrel
      new THREE.Vector3(-6.0, 2.25, 0.0),  // Enters Tetraprism Entrance AR Face
      new THREE.Vector3(-6.0, -1.25, 0.0), // BOUNCE 1: M1 Protected-Silver Mirror (18.82°)!
      new THREE.Vector3(-3.3, 2.25, 0.0),  // BOUNCE 2: M2 Lossless TIR Roof (37.65° > θ_c 32.1°)!
      new THREE.Vector3(-0.6, -1.25, 0.0), // BOUNCE 3: M3 Lossless TIR Floor (37.65° > θ_c 32.1°)!
      new THREE.Vector3(2.1, 2.25, 0.0),   // BOUNCE 4: M4 Protected-Silver Mirror (18.82° // M1)!
      new THREE.Vector3(2.1, -1.25, 0.0),  // Exits Tetraprism AR Exit Face straight down!
      new THREE.Vector3(2.1, -2.60, 0.0)   // Focuses onto Horizontal 3D Sensor-Shift CMOS!
    ], 0x10b981, 0.90, 0.082, 4);

    // 2. Royal-Blue Front-Field Ray (+Z offset = +0.88 -> converges cleanly onto sensor front quadrant!)
    addSharpBounceRay([
      new THREE.Vector3(-6.45, 9.5, 0.92),
      new THREE.Vector3(-6.28, 2.25, 0.86),
      new THREE.Vector3(-6.28, -1.16, 0.78), // M1 Bounce 1
      new THREE.Vector3(-3.55, 2.25, 0.64),  // M2 TIR Bounce 2
      new THREE.Vector3(-0.82, -1.25, 0.50), // M3 TIR Bounce 3
      new THREE.Vector3(1.88, 2.32, 0.36),   // M4 Bounce 4
      new THREE.Vector3(1.96, -1.25, 0.24),
      new THREE.Vector3(2.02, -2.60, 0.16)
    ], 0x2563eb, 0.82, 0.062, 3);

    // 3. Crimson Rear-Field Ray (-Z offset = -0.88 -> converges cleanly onto sensor rear quadrant!)
    addSharpBounceRay([
      new THREE.Vector3(-5.55, 9.5, -0.92),
      new THREE.Vector3(-5.72, 2.25, -0.86),
      new THREE.Vector3(-5.72, -1.34, -0.78), // M1 Bounce 1
      new THREE.Vector3(-3.05, 2.25, -0.64),  // M2 TIR Bounce 2
      new THREE.Vector3(-0.38, -1.25, -0.50), // M3 TIR Bounce 3
      new THREE.Vector3(2.32, 2.18, -0.36),   // M4 Bounce 4
      new THREE.Vector3(2.24, -1.25, -0.24),
      new THREE.Vector3(2.18, -2.60, -0.16)
    ], 0xef4444, 0.82, 0.062, 3);

    // 4. Amber 10 kHz 3D Sensor-Shift Closed-Loop Drive Current (ASIC -> S-Flex -> XY/Z Coils!)
    this._addRay([
      new THREE.Vector3(-5.8, -3.52, 0.65),
      new THREE.Vector3(-2.35, -3.95, 0.0),
      new THREE.Vector3(-0.95, -2.75, 1.15),
      new THREE.Vector3(0.45, -3.02, 0.0),
      new THREE.Vector3(2.1, -3.26, 1.62)
    ], 0xf59e0b, 0.86, 0.064, 3);
  }

  _buildGuideLines(topY, botY, corners) {
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.45,
      gapSize: 0.35,
      transparent: true,
      opacity: 0.55
    });
    for (const [cx, cz] of corners) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cx, botY, cz),
        new THREE.Vector3(cx, topY, cz)
      ]);
      const line = new THREE.Line(geo, lineMat);
      line.computeLineDistances();
      line.userData.ignorePick = true;
      this.guideGroup.add(line);
    }
  }

  setOpticsVisible(enabled) {
    this.opticsEnabled = enabled;
    this.opticsGroup.visible = enabled;
  }

  setOisActive(enabled) {
    this.oisEnabled = enabled;
  }

  setGuideLinesOpacity(explodeT) {
    this.guideGroup.visible = explodeT > 0.04;
    this.guideGroup.children.forEach((l) => {
      if (l.material) l.material.opacity = Math.min(0.55, explodeT * 0.75);
    });
  }

  update(dt, elapsed, partsMap, explodeT) {
    // Lazily initialize zero-GC reusable math scratch objects for Phase 10 SMA live kinematics
    if (!this._smaUp) {
      this._smaUp = new THREE.Vector3(0, 1, 0);
      this._smaPtB = new THREE.Vector3();
      this._smaDir = new THREE.Vector3();
      this._smaCoolColor = new THREE.Color(0x38bdf8);
      this._smaHotColor = new THREE.Color(0xf97316);
      this._smaCoolEmissive = new THREE.Color(0x0284c7);
      this._smaHotEmissive = new THREE.Color(0xea580c);
    }

    // Animate photon & electron pulses
    if (this.opticsEnabled) {
      for (const p of this.photonPulses) {
        p.phase = (p.phase + dt * p.speed) % 1.0;
        p.curve.getPointAt(p.phase, p.mesh.position);
      }
    }

    // Apply exploded offset + real-time mode-specific live hardware actuation:
    //  - Macro: 3D Sensor-Shift OIS (IBIS) XY + Roll
    //  - Lens: 6-Blade Stepless Iris (f/1.63 <-> f/4.0) + Ball-Guide AF Z + OIS XY
    //  - Deco: Adaptive 9-LED Flash (Wide outer-8 <-> Telephoto center spot) + 940nm VCSEL Laser pulse
    //  - Periscope: 2-Axis Prism-Tilt OIS (Pitch+Yaw) + 3.1 mm Horizontal Floating Tele-Macro AF + 0.5x Rolling ZrO2 Balls!
    //  - Aperture: Ultra-Deep 6-Blade Interleaved Stepless Iris (f/1.42 <-> f/4.0) + Real Pierced Cam Rotor + 0.5x Thrust Balls!
    //  - Iris: Extreme 4x 32-Part Watchwork Micro-Iris (Dual-VCM Balanced Cam + 6 Rolling Balls + 3-Tier Blades + Dimples + Pins!)
    //  - IrisNano: Sub-Micron Cam Slot Push + Counter-Sliding Tier-1/Tier-2 Blades + 0.5x Rolling Y-TZP Ceramic Ball!
    //  - LiDAR: 940 nm Multi-Junction VCSEL Laser Pulse Burst + Delayed Geiger-Mode SPAD Single-Photon Avalanche Flashes!
    //  - SMA: 8-Wire Antagonistic NiTiCu Artificial-Muscle 5-Axis Motion + Real-Time Hot Austenite <-> Cool Martensite Glow + Phase Front!
    //  - Liquid: Live 3D Vertex-Morphing Oil-Water Meniscus (-15 D <-> +35 D AF + 2-Axis Quadrant OIS Tilt) + 500x EDL Wetting Slide!
    //  - Tetra: Horizontal 3D Sensor-Shift OIS (X/Y) + Vertical Sensor-Shift AF (Z) at 10,000 Hz + 500x EM Wave & Evanescent Field Pulse!
    const macroOis = this.oisEnabled && this.mode === 'macro';
    const lensAct = this.oisEnabled && this.mode === 'lens';
    const decoAct = this.oisEnabled && this.mode === 'deco';
    const periAct = this.oisEnabled && this.mode === 'periscope';
    const apAct = this.oisEnabled && this.mode === 'aperture';
    const irisMicroAct = this.oisEnabled && this.mode === 'iris';
    const irisNanoAct = this.oisEnabled && this.mode === 'iris_nano';
    const lidarAct = this.oisEnabled && this.mode === 'lidar';
    const smaAct = this.oisEnabled && this.mode === 'sma';
    const liquidAct = this.oisEnabled && this.mode === 'liquid';
    const tetraAct = this.oisEnabled && this.mode === 'tetra';

    const oisX = macroOis ? Math.sin(elapsed * 4.4) * 0.55 : lensAct ? Math.sin(elapsed * 2.9) * 0.28 : 0;
    const oisZ = macroOis ? Math.cos(elapsed * 3.1) * 0.45 : lensAct ? Math.cos(elapsed * 2.3) * 0.26 : 0;
    const oisRoll = macroOis ? Math.sin(elapsed * 2.2) * 0.045 : 0;
    const afStrokeY = lensAct ? Math.sin(elapsed * 1.9) * 0.42 : 0;
    const irisNorm = lensAct ? (0.5 - 0.5 * Math.cos(elapsed * 1.35)) : null;

    // Phase 6 & Phase 7 smooth stepless F-stop sweep: 0 = f/1.42 (Wide Open), 1 = f/4.0 (Stopped Down)
    const apNorm = apAct ? (0.5 - 0.5 * Math.cos(elapsed * 1.15)) : null;
    const imNorm = irisMicroAct ? (0.5 - 0.5 * Math.cos(elapsed * 1.12)) : null;

    // Phase 8 sub-micron cam sliding, counter-sliding Tier-1/Tier-2 blades & 0.5x rolling Y-TZP ceramic ball
    const nanoPhase = irisNanoAct ? Math.sin(elapsed * 1.95) : 0;
    const nanoCamX = nanoPhase * 0.54;
    const nanoUpperX = nanoPhase * 0.44;
    const nanoLowerX = -nanoPhase * 0.48;
    const nanoRaceZ = nanoPhase * 0.68;
    const nanoBallZ = nanoRaceZ * 0.5;

    // Periscope live actuation kinematics (zero collisions verified across full 3.1 mm stroke!)
    const periStrokeX = periAct ? (0.45 + 1.55 * Math.sin(elapsed * 1.35)) : 0;
    const prismPitch = periAct ? Math.sin(elapsed * 3.1) * 0.088 : 0; // ±5.0° visual pitch tilt around Z
    const prismYaw = periAct ? Math.cos(elapsed * 2.15) * 0.072 : 0;   // ±4.1° visual yaw tilt around Y

    // Adaptive flash cycle: 0 = Wide-Angle Outer 8 LEDs, 1 = Telephoto Center Spot LED
    const flashBlend = decoAct ? (0.5 + 0.5 * Math.sin(elapsed * 1.6)) : null;
    const vcselPulse = decoAct ? (0.45 + 0.95 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 9.0), 4)) : 0.48;

    // Phase 9 LiDAR sharp sub-nanosecond VCSEL laser burst + delayed Time-of-Flight Geiger avalanche cascade
    const lidarPulse = lidarAct ? (0.35 + 2.35 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 7.5), 8)) : 0.62;

    // Phase 10 8-Wire SMA 5-Axis OIS + AF floating lens carrier kinematics + moving crystal transformation front
    const smaDx = smaAct ? Math.sin(elapsed * 2.2) * 0.44 : 0;
    const smaDy = smaAct ? Math.sin(elapsed * 1.45) * 0.42 : 0;
    const smaDz = smaAct ? Math.cos(elapsed * 1.85) * 0.40 : 0;
    const smaFrontDz = smaAct ? Math.sin(elapsed * 2.2) * 0.62 : 0;

    // Phase 11 4-Quadrant EWOD Liquid Lens live AF sweep (-1.0 concave <-> +1.0 convex) + 2-axis OIS tilt + 500x EDL slide!
    const liqK = liquidAct ? Math.sin(elapsed * 1.45) : null;
    const liqTx = liquidAct ? Math.sin(elapsed * 2.65) * 0.28 : 0;
    const liqTz = liquidAct ? Math.cos(elapsed * 2.05) * 0.26 : 0;
    const liqMicroDy = liquidAct ? -0.34 * (liqK - 0.72) : 0;

    // Phase 12 4-Bounce Tetraprism Horizontal 3D Sensor-Shift (X/Y OIS + Z AF!) & 500x EM Wave Pulse!
    const tpDx = tetraAct ? Math.sin(elapsed * 3.8) * 0.34 : 0;
    const tpDy = tetraAct ? Math.sin(elapsed * 1.9) * 0.32 : 0;
    const tpDz = tetraAct ? Math.cos(elapsed * 3.1) * 0.30 : 0;
    const tpWavePulse = tetraAct ? (0.48 + 0.75 * (0.5 + 0.5 * Math.sin(elapsed * 6.5))) : 0.52;
    const tpEvanDy = tetraAct ? Math.sin(elapsed * 4.5) * 0.08 : 0;

    for (const entry of partsMap.values()) {
      const ex = entry.basePos.x + entry.explodeVec.x * explodeT;
      const ey = entry.basePos.y + entry.explodeVec.y * explodeT;
      const ez = entry.basePos.z + entry.explodeVec.z * explodeT;

      let dx = (entry.oisMoving && (macroOis || lensAct)) ? oisX : 0;
      let dy = (entry.afMoving && lensAct) ? afStrokeY : 0;
      let dz = (entry.oisMoving && (macroOis || lensAct)) ? oisZ : 0;

      // Periscope horizontal long-stroke floating tele-macro AF + 0.5x rolling ceramic ball bearings
      if (periAct && entry.afMoving) {
        dx += periStrokeX;
      } else if (periAct && entry.afBallRolling) {
        dx += periStrokeX * 0.5;
      }

      // Phase 8 sub-micron cam slot push + counter-sliding blades + 0.5x differential rolling ceramic ball
      if (irisNanoAct) {
        if (entry.nanoCamRotor) dx += nanoCamX;
        else if (entry.nanoUpperBlade) dx += nanoUpperX;
        else if (entry.nanoLowerBlade) dx += nanoLowerX;
        else if (entry.nanoUpperRace) dz += nanoRaceZ;
        else if (entry.nanoBall || entry.nanoBallFollow) dz += nanoBallZ;
      }

      // Phase 10 SMA 5-axis floating lens carrier + moving Martensite<->Austenite phase transformation front
      if (smaAct) {
        if (entry.smaMovingCarrier) {
          dx += smaDx;
          dy += smaDy;
          dz += smaDz;
        } else if (entry.smaPhaseFront) {
          dz += smaFrontDz;
        }
      }

      // Phase 11 500x Triple-Phase Contact-Line aqueous/oil wedge & EDL ion swarm sliding along hydrophobic wall!
      if (liquidAct && entry.liquidMicroWet) {
        dy += liqMicroDy;
      }

      // Phase 12 Tetraprism Horizontal 3D Sensor-Shift (X/Y OIS + Z AF!) & 500x Evanescent Field oscillation
      if (tetraAct) {
        if (entry.tetraSensor3d) {
          dx += tpDx;
          dy += tpDy;
          dz += tpDz;
        } else if (entry.tetraEvanescent) {
          dy += tpEvanDy;
        }
      }

      entry.group.position.set(ex + dx, ey + dy, ez + dz);

      if (entry.prismTiltMoving) {
        entry.group.rotation.set(0, prismYaw, prismPitch);
      } else if (entry.nanoBall && irisNanoAct) {
        // True rolling rotation around X axis matching 0.5x translation along Z (R_ball = 1.60)
        entry.group.rotation.set(nanoBallZ / 1.60, 0, 0);
      } else if (entry.isMicroIrisCam) {
        const u = entry.group.userData;
        const rotY = irisMicroAct ? (u.camRotMin + imNorm * (u.camRotMax - u.camRotMin)) : u.camRotRest;
        entry.group.rotation.set(0, rotY, 0);
      } else if (entry.isMicroIrisBalls) {
        const u = entry.group.userData;
        const rotY = irisMicroAct ? (u.camRotMin + imNorm * (u.camRotMax - u.camRotMin)) * 0.5 : u.camRotRest * 0.5;
        entry.group.rotation.set(0, rotY, 0);
      } else if (entry.isDeepIrisCam) {
        const u = entry.group.userData;
        const rotY = apAct ? (u.camRotMin + apNorm * (u.camRotMax - u.camRotMin)) : u.camRotRest;
        entry.group.rotation.set(0, rotY, 0);
      } else if (entry.isDeepIrisBalls) {
        const u = entry.group.userData;
        const rotY = apAct ? (u.camRotMin + apNorm * (u.camRotMax - u.camRotMin)) * 0.5 : u.camRotRest * 0.5;
        entry.group.rotation.set(0, rotY, 0);
      } else if (entry.oisMoving && macroOis) {
        entry.group.rotation.set(0, oisRoll, 0);
      } else if (entry.group.userData.isIrisCamRing) {
        entry.group.rotation.set(0, lensAct ? (irisNorm - 0.5) * 0.30 : 0, 0);
      } else {
        entry.group.rotation.set(0, 0, 0);
      }

      // Live 6-blade stepless variable aperture articulation (Phase 3 Lens mode)
      if (entry.group.userData.irisBlades) {
        for (const pivot of entry.group.userData.irisBlades) {
          const swing = lensAct ? (0.02 + irisNorm * 0.48) : pivot.userData.restSwing;
          pivot.rotation.y = pivot.userData.baseAzimuth + swing;
        }
      }

      // Live 6-blade interleaved stepless variable aperture (Phase 6 Deep Dissection)
      if (entry.group.userData.deepIrisBlades) {
        for (const pivot of entry.group.userData.deepIrisBlades) {
          const u = pivot.userData;
          const swing = apAct ? (u.swingMin + apNorm * (u.swingMax - u.swingMin)) : u.restSwing;
          pivot.rotation.y = u.baseAzimuth + swing;
        }
      }

      // Live 32-part 4x Watchwork Micro-Iris (Phase 7 — synchronized 3 tiers, knife edges, 24 dimples, cam pins & bushings!)
      if (entry.group.userData.microIrisBlades) {
        for (const pivot of entry.group.userData.microIrisBlades) {
          const u = pivot.userData;
          const swing = irisMicroAct ? (u.swingMin + imNorm * (u.swingMax - u.swingMin)) : u.restSwing;
          pivot.rotation.y = u.baseAzimuth + swing;
        }
      }

      // Live 9-LED Adaptive True Tone Flash pattern switching (Deco mode)
      if (entry.group.userData.flashLeds) {
        for (const led of entry.group.userData.flashLeds) {
          if (decoAct) {
            led.material.emissiveIntensity = led.userData.isCenter
              ? 0.15 + flashBlend * 2.2
              : 0.15 + (1.0 - flashBlend) * 1.65;
          } else {
            led.material.emissiveIntensity = led.userData.isCenter ? 0.55 : 0.35;
          }
        }
      }

      // Live 940nm VCSEL Laser pulse modulation (Deco mode)
      if (entry.group.userData.vcselMat) {
        entry.group.userData.vcselMat.emissiveIntensity = vcselPulse;
      }

      // Live Phase 9 Multi-Junction VCSEL pulse & delayed Geiger-Mode SPAD single-photon avalanche flashes!
      if (entry.group.userData.vcselPulseMat) {
        entry.group.userData.vcselPulseMat.emissiveIntensity = lidarPulse;
      }
      if (entry.group.userData.spadAvalancheCells) {
        for (const cell of entry.group.userData.spadAvalancheCells) {
          if (lidarAct) {
            // Delayed phase offset per cell simulating returning photon arrival times + 6 ns quench/recharge!
            const idx = cell.userData.spadCellIdx || 0;
            const phase = elapsed * 7.5 - 1.15 - idx * 0.42;
            const flash = Math.pow(0.5 + 0.5 * Math.sin(phase), 10);
            cell.material.emissiveIntensity = 0.28 + flash * 2.45;
          } else {
            cell.material.emissiveIntensity = 0.54;
          }
        }
      }

      // Live Phase 10 Dynamic 8-Wire SMA Endpoint Re-Aiming + Real-Time Hot Austenite <-> Cool Martensite Thermal Glow!
      if (entry.group.userData.smaWires) {
        for (const wMesh of entry.group.userData.smaWires) {
          const d = wMesh.userData.smaWireDef;
          this._smaPtB.copy(d.pMovingRest);
          if (smaAct) {
            this._smaPtB.x += smaDx;
            this._smaPtB.y += smaDy;
            this._smaPtB.z += smaDz;
          }
          this._smaDir.copy(this._smaPtB).sub(d.pStatic);
          const len = this._smaDir.length();
          wMesh.position.copy(d.pStatic).add(this._smaPtB).multiplyScalar(0.5);
          wMesh.scale.set(1, len, 1);
          if (len > 1e-5) {
            wMesh.quaternion.setFromUnitVectors(this._smaUp, this._smaDir.divideScalar(len));
          }
          if (smaAct) {
            // Exact tensegrity physics: wire shortening (deltaL < 0) = Joule-heated Austenite glow; stretching = cool Martensite!
            const deltaL = len - d.restLen;
            const heat = THREE.MathUtils.clamp(0.5 - deltaL * 1.25, 0, 1);
            d.wireMat.color.lerpColors(this._smaCoolColor, this._smaHotColor, heat);
            d.wireMat.emissive.lerpColors(this._smaCoolEmissive, this._smaHotEmissive, heat);
            d.wireMat.emissiveIntensity = 0.22 + heat * 0.88;
            if (wMesh.userData.solidHighlightMat) {
              wMesh.userData.solidHighlightMat.color.copy(d.wireMat.color);
              wMesh.userData.solidHighlightMat.emissive.copy(d.wireMat.emissive);
              wMesh.userData.solidHighlightMat.emissiveIntensity = d.wireMat.emissiveIntensity;
            }
          } else {
            d.wireMat.color.copy(d.defaultWarm ? this._smaHotColor : this._smaCoolColor);
            d.wireMat.emissive.copy(d.defaultWarm ? this._smaHotEmissive : this._smaCoolEmissive);
            d.wireMat.emissiveIntensity = d.defaultWarm ? 0.42 : 0.22;
            if (wMesh.userData.solidHighlightMat) {
              wMesh.userData.solidHighlightMat.color.copy(d.wireMat.color);
            }
            if (wMesh.userData.baseEmissiveHex !== undefined) {
              wMesh.userData.baseEmissiveHex = d.defaultWarm ? 0xea580c : 0x0284c7;
              wMesh.userData.baseEmissiveInt = d.defaultWarm ? 0.42 : 0.22;
            }
          }
        }
      }

      // Live Phase 11 3D Vertex-Morphing Oil-Water Meniscus, Aqueous Phase & Optical Oil Volumes!
      if (entry.group.userData.liquidMorphMesh) {
        const mesh = entry.group.userData.liquidMorphMesh;
        const targetK = liquidAct ? liqK : entry.group.userData.liquidRestK;
        const targetTx = liquidAct ? liqTx : 0;
        const targetTz = liquidAct ? liqTz : 0;
        const prev = mesh.userData._lastMorphState;
        if (!prev || Math.abs(prev.k - targetK) > 1e-4 || Math.abs(prev.tx - targetTx) > 1e-4 || Math.abs(prev.tz - targetTz) > 1e-4) {
          updateLiquidMorphMesh(mesh, targetK, targetTx, targetTz);
          mesh.userData._lastMorphState = { k: targetK, tx: targetTx, tz: targetTz };
        }
      }

      // Live Phase 11 4-Quadrant AC Voltage Glow Modulation (AF base voltage + 2-axis OIS differential bias!)
      if (entry.group.userData.liquidQuadMat) {
        const qMat = entry.group.userData.liquidQuadMat;
        const qMesh = entry.group.userData.liquidQuadMesh;
        const axis = entry.group.userData.liquidQuadAxis;
        let inten = 0.15;
        if (liquidAct) {
          const baseV = 0.5 + 0.5 * liqK;
          const bias =
            axis === 'x+' ? -liqTx : axis === 'x-' ? liqTx : axis === 'z+' ? -liqTz : liqTz;
          inten = THREE.MathUtils.clamp(0.10 + (baseV + bias * 1.4) * 0.78, 0.08, 1.05);
        }
        qMat.emissiveIntensity = inten;
        if (qMesh && qMesh.userData.solidHighlightMat && liquidAct) {
          qMesh.userData.solidHighlightMat.emissiveIntensity = inten;
        }
      }

      // Live Phase 12 500x Electromagnetic Wave Propagation Pulse
      if (entry.group.userData.tetraWaveMat) {
        entry.group.userData.tetraWaveMat.emissiveIntensity = tpWavePulse;
      }
    }

    this.setGuideLinesOpacity(explodeT);
  }
}
