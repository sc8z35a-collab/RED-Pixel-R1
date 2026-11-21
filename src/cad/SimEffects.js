import * as THREE from 'three';

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
    // Animate photon & electron pulses
    if (this.opticsEnabled) {
      for (const p of this.photonPulses) {
        p.phase = (p.phase + dt * p.speed) % 1.0;
        p.curve.getPointAt(p.phase, p.mesh.position);
      }
    }

    // Apply exploded offset + real-time 3D Sensor-Shift OIS micro-actuation on moving parts
    const oisActive = this.oisEnabled && this.mode === 'macro';
    const oisX = oisActive ? Math.sin(elapsed * 4.4) * 0.55 : 0;
    const oisZ = oisActive ? Math.cos(elapsed * 3.1) * 0.45 : 0;
    const oisRoll = oisActive ? Math.sin(elapsed * 2.2) * 0.045 : 0;

    for (const entry of partsMap.values()) {
      const ex = entry.basePos.x + entry.explodeVec.x * explodeT;
      const ey = entry.basePos.y + entry.explodeVec.y * explodeT;
      const ez = entry.basePos.z + entry.explodeVec.z * explodeT;

      if (entry.oisMoving && oisActive) {
        entry.group.position.set(ex + oisX, ey, ez + oisZ);
        entry.group.rotation.y = oisRoll;
      } else {
        entry.group.position.set(ex, ey, ez);
        entry.group.rotation.y = 0;
      }
    }

    this.setGuideLinesOpacity(explodeT);
  }
}
