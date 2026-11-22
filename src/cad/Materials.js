import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

function toTexture(canvas, srgb = true, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * High-resolution procedural texture for the 1-inch CMOS active pixel array,
 * dummy pixel guard ring, and Optical Black (OB) tungsten light-shield frame.
 */
function createSensorSurfaceTextures() {
  const { c, ctx } = makeCanvas(1024, 768);
  const { c: rc, ctx: rctx } = makeCanvas(1024, 768);

  // Outer Optical Black (OB) tungsten light-shielded zone
  ctx.fillStyle = '#18202c';
  ctx.fillRect(0, 0, 1024, 768);
  rctx.fillStyle = '#707070';
  rctx.fillRect(0, 0, 1024, 768);

  // Fine OB shield micro-texture
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 12) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 768); ctx.stroke();
  }
  for (let y = 0; y < 768; y += 12) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }

  // Optical Black inner tungsten border
  ctx.strokeStyle = '#3b4a62';
  ctx.lineWidth = 8;
  ctx.strokeRect(26, 22, 972, 724);

  // Dummy pixel guard ring
  ctx.fillStyle = '#14263d';
  ctx.fillRect(42, 36, 940, 696);
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 36, 940, 696);

  // Active pixel imaging area (Quad Bayer microlens diffraction zone)
  const ax = 62, ay = 52, aw = 900, ah = 664;
  const grad = ctx.createLinearGradient(ax, ay, ax + aw, ay + ah);
  grad.addColorStop(0.0, '#0c274d');
  grad.addColorStop(0.25, '#0f3b68');
  grad.addColorStop(0.5, '#0b4a5e');
  grad.addColorStop(0.75, '#19376d');
  grad.addColorStop(1.0, '#0d2240');
  ctx.fillStyle = grad;
  ctx.fillRect(ax, ay, aw, ah);

  // Smooth glossy microlens roughness in active area
  rctx.fillStyle = '#181818';
  rctx.fillRect(ax, ay, aw, ah);

  // Subtle Quad-Bayer color diffraction grid (macro visual representation)
  const cell = 6;
  for (let y = ay; y < ay + ah; y += cell) {
    const row = Math.floor((y - ay) / cell);
    for (let x = ax; x < ax + aw; x += cell) {
      const col = Math.floor((x - ax) / cell);
      const qx = Math.floor(col / 2) % 2;
      const qy = Math.floor(row / 2) % 2;
      if (qx === 0 && qy === 0) ctx.fillStyle = 'rgba(239, 68, 68, 0.20)';
      else if (qx === 1 && qy === 1) ctx.fillStyle = 'rgba(59, 130, 246, 0.26)';
      else ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
    }
  }

  // Fine sub-pixel microlens highlights
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.16)';
  ctx.lineWidth = 0.7;
  for (let x = ax; x <= ax + aw; x += cell * 2) {
    ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, ay + ah); ctx.stroke();
  }
  for (let y = ay; y <= ay + ah; y += cell * 2) {
    ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(ax + aw, y); ctx.stroke();
  }

  // Corner optical alignment fiducial crosses (zero text)
  const corners = [
    [18, 16], [1006, 16], [18, 752], [1006, 752]
  ];
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
    ctx.stroke();
  }

  return {
    map: toTexture(c, true),
    roughnessMap: toTexture(rc, false)
  };
}

/**
 * Logic die floorplan: Dual column-parallel 14-bit ADC banks (top/bottom),
 * AI remosaic / ISP core, row decoders, PLL, MIPI CSI-2 PHY lanes.
 */
function createLogicDieTextures() {
  const { c, ctx } = makeCanvas(1024, 768);
  const { c: rc, ctx: rctx } = makeCanvas(1024, 768);

  ctx.fillStyle = '#1b2330';
  ctx.fillRect(0, 0, 1024, 768);
  rctx.fillStyle = '#484848';
  rctx.fillRect(0, 0, 1024, 768);

  // Top & Bottom Column-Parallel ADC Arrays
  const drawAdcBand = (y0, h) => {
    ctx.fillStyle = '#243247';
    ctx.fillRect(90, y0, 844, h);
    rctx.fillStyle = '#282828';
    rctx.fillRect(90, y0, 844, h);
    for (let x = 94; x < 930; x += 6) {
      ctx.fillStyle = (x % 18 === 0) ? '#64748b' : '#3b82f6';
      ctx.fillRect(x, y0 + 6, 3, h - 12);
    }
    // Comparator & counter rails
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(90, y0 + h * 0.35, 844, 3);
    ctx.fillRect(90, y0 + h * 0.72, 844, 3);
  };
  drawAdcBand(36, 128);
  drawAdcBand(604, 128);

  // Left & Right Row Drivers & Timing Generators
  const drawRowDriver = (x0) => {
    ctx.fillStyle = '#2a3444';
    ctx.fillRect(x0, 178, 58, 412);
    for (let y = 186; y < 582; y += 8) {
      ctx.fillStyle = (y % 24 === 0) ? '#d97706' : '#475569';
      ctx.fillRect(x0 + 6, y, 46, 4);
    }
  };
  drawRowDriver(22);
  drawRowDriver(944);

  // Center digital logic macros (ISP, AI Remosaic NPU, HDR Fusion, Line Buffers, MIPI PHY)
  const blocks = [
    { x: 102, y: 184, w: 240, h: 190, col: '#1e3a5f', accent: '#38bdf8' },
    { x: 356, y: 184, w: 312, h: 190, col: '#26304d', accent: '#818cf8' },
    { x: 682, y: 184, w: 240, h: 190, col: '#1f3b4d', accent: '#2dd4bf' },
    { x: 102, y: 390, w: 380, h: 194, col: '#2a2f42', accent: '#f59e0b' },
    { x: 496, y: 390, w: 426, h: 194, col: '#223346', accent: '#60a5fa' }
  ];

  for (const b of blocks) {
    ctx.fillStyle = b.col;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = b.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    // Sub-cell standard logic rows
    ctx.fillStyle = 'rgba(226, 232, 240, 0.16)';
    for (let y = b.y + 10; y < b.y + b.h - 10; y += 10) {
      for (let x = b.x + 10; x < b.x + b.w - 14; x += 22) {
        const w = ((x * 13 + y * 7) % 14) + 5;
        ctx.fillRect(x, y, w, 5);
      }
    }
  }

  // Power delivery metal mesh
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 2;
  for (let x = 90; x <= 934; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 36); ctx.lineTo(x, 732); ctx.stroke();
  }
  for (let y = 36; y <= 732; y += 64) {
    ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(934, y); ctx.stroke();
  }

  return {
    map: toTexture(c, true),
    roughnessMap: toTexture(rc, false)
  };
}

/**
 * Stacked DRAM die texture: 8x4 high-bandwidth memory banks + TSV arrays.
 */
function createDramDieTexture() {
  const { c, ctx } = makeCanvas(1024, 768);
  ctx.fillStyle = '#0f292e';
  ctx.fillRect(0, 0, 1024, 768);

  const cols = 8;
  const rows = 4;
  const padX = 36, padY = 34;
  const gapX = 16, gapY = 20;
  const bw = (1024 - padX * 2 - gapX * (cols - 1)) / cols;
  const bh = (768 - padY * 2 - gapY * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = padX + col * (bw + gapX);
      const y = padY + r * (bh + gapY);
      ctx.fillStyle = '#134e4a';
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, bw, bh);

      // Bitline/Wordline dense sub-array stripes
      ctx.fillStyle = 'rgba(94, 234, 212, 0.25)';
      for (let sy = y + 6; sy < y + bh - 6; sy += 6) {
        ctx.fillRect(x + 5, sy, bw - 10, 2);
      }
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + bw * 0.48, y + 2, 4, bh - 4);
    }
  }

  // Central TSV bus spines
  ctx.fillStyle = '#d97706';
  for (let x = 60; x < 964; x += 24) {
    ctx.beginPath();
    ctx.arc(x, 384, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(c, true);
}

/**
 * 2nd Layer Transistor Substrate texture: 2x2 shared AMP/RST/SEL + LOFIC cells.
 */
function createTransistorLayerTexture() {
  const { c, ctx } = makeCanvas(1024, 768);
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 1024, 768);

  const step = 32;
  for (let y = 16; y < 752; y += step) {
    for (let x = 16; x < 1008; x += step) {
      // Cell boundary
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, step - 2, step - 2);
      // Large AMP MOSFET gate
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 4, y + 4, 14, 10);
      // RST & SEL gates
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x + 4, y + 18, 8, 8);
      ctx.fillRect(x + 15, y + 18, 8, 8);
      // LOFIC capacitor plate
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 21, y + 4, 7, 11);
      // Vertical FD via contact dot
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x + 15, y + 15, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(c, true);
}

/**
 * Cu-Cu Hybrid Bonding dielectric (SiCN) + dense copper micro-pad array.
 */
function createCuCuHybridTexture() {
  const { c, ctx } = makeCanvas(1024, 768);
  const { c: mc, ctx: mctx } = makeCanvas(1024, 768);

  // Ultra-flat SiCN dielectric matrix
  ctx.fillStyle = '#2b394a';
  ctx.fillRect(0, 0, 1024, 768);
  mctx.fillStyle = '#101010';
  mctx.fillRect(0, 0, 1024, 768);

  const pitch = 16;
  for (let y = 12; y < 756; y += pitch) {
    for (let x = 12; x < 1012; x += pitch) {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x, y, 8, 8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 1.5, y + 1.5, 5, 5);

      mctx.fillStyle = '#ffffff';
      mctx.fillRect(x, y, 8, 8);
    }
  }

  return {
    map: toTexture(c, true),
    metalnessMap: toTexture(mc, false)
  };
}

/**
 * High-density Rigid PCB texture: dark matte solder mask, copper differential
 * traces, ENIG gold finger pads, and central thermal via array.
 */
function createRigidPcbTexture() {
  const { c, ctx } = makeCanvas(1024, 1024);
  ctx.fillStyle = '#123d2d';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle glass-weave FR4/BT texture
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1024; i += 8) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
  }

  // Outer GND shield copper ring (ENIG gold finish)
  ctx.strokeStyle = '#d4a843';
  ctx.lineWidth = 16;
  ctx.strokeRect(24, 24, 976, 976);

  // Copper signal traces radiating from center die to perimeter
  ctx.strokeStyle = '#206b4e';
  ctx.lineWidth = 3;
  for (let i = 0; i < 28; i++) {
    const t = 180 + i * 24;
    ctx.beginPath();
    ctx.moveTo(t, 240);
    ctx.lineTo(t, 110);
    ctx.lineTo(t + (i - 14) * 4, 65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(t, 784);
    ctx.lineTo(t, 914);
    ctx.lineTo(t + (i - 14) * 4, 958);
    ctx.stroke();
  }

  // Central copper thermal pad & gold-plated thermal via array
  ctx.fillStyle = '#b4872c';
  ctx.fillRect(260, 310, 504, 404);
  ctx.fillStyle = '#0e2c21';
  ctx.fillRect(272, 322, 480, 380);

  for (let y = 344; y < 684; y += 30) {
    for (let x = 294; x < 734; x += 30) {
      ctx.fillStyle = '#e5b94c';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2416';
      ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Gold wire-bond fingers around inner perimeter
  ctx.fillStyle = '#f0c451';
  for (let x = 210; x <= 814; x += 18) {
    ctx.fillRect(x, 224, 10, 26);
    ctx.fillRect(x, 774, 10, 26);
  }
  for (let y = 270; y <= 754; y += 18) {
    ctx.fillRect(172, y, 26, 10);
    ctx.fillRect(826, y, 26, 10);
  }

  // Fiducial registration dots (4 corners)
  const fids = [[86, 86], [938, 86], [86, 938], [938, 938]];
  for (const [fx, fy] of fids) {
    ctx.fillStyle = '#f0c451';
    ctx.beginPath(); ctx.arc(fx, fy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#123d2d';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(fx, fy, 17, 0, Math.PI * 2); ctx.stroke();
  }

  return toTexture(c, true);
}

/**
 * Polyimide FPC differential MIPI CSI-2 trace texture (amber polyimide + copper pairs).
 */
function createFpcTexture() {
  const { c, ctx } = makeCanvas(512, 1024);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 1024);

  // Warm polyimide amber gradient
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, '#9a3412');
  g.addColorStop(0.25, '#c25e0a');
  g.addColorStop(0.5, '#d97706');
  g.addColorStop(0.75, '#c25e0a');
  g.addColorStop(1, '#9a3412');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1024);

  // Longitudinal MIPI CSI-2 4-lane + CLK differential copper trace pairs with ground guards
  const lanes = [56, 112, 168, 224, 288, 344, 400, 456];
  for (let idx = 0; idx < lanes.length; idx++) {
    const x = lanes[idx];
    // GND guard copper strip
    ctx.fillStyle = 'rgba(251, 191, 36, 0.38)';
    ctx.fillRect(x - 20, 0, 4, 1024);

    // Differential pair (+/-) with authentic length-matching serpentine meanders
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 4.5;
    for (const offset of [-5.5, 5.5]) {
      ctx.beginPath();
      for (let y = 0; y <= 1024; y += 14) {
        const meander = (y > 680 && y < 860 && idx % 2 === 0)
          ? Math.sin((y - 680) * 0.14) * 5.5
          : 0;
        if (y === 0) ctx.moveTo(x + offset + meander, y);
        else ctx.lineTo(x + offset + meander, y);
      }
      ctx.stroke();
    }
  }

  // Fine diamond hatched copper EMI reference mesh
  ctx.strokeStyle = 'rgba(20, 20, 25, 0.14)';
  ctx.lineWidth = 1.4;
  for (let i = -512; i < 1536; i += 22) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i + 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(512, i); ctx.lineTo(0, i + 512); ctx.stroke();
  }

  // Gold-plated solder landing fingers at PCB root (top edge)
  ctx.fillStyle = '#facc15';
  for (let x = 28; x < 484; x += 18) {
    ctx.fillRect(x, 0, 10, 42);
  }

  return toTexture(c, true);
}

/**
 * Fine enameled copper winding coil texture.
 */
function createCopperCoilTexture() {
  const { c, ctx } = makeCanvas(512, 256);
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y += 4) {
    const shade = (y % 8 === 0) ? '#ea580c' : '#c2410c';
    ctx.fillStyle = shade;
    ctx.fillRect(0, y, 512, 2.5);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(0, y, 512, 0.9);
  }
  return toTexture(c, true, 1, 2);
}

/**
 * Creates a clean white studio PMREM environment map for crisp CAD reflections
 * on white backgrounds (metallic copper/gold/SUS + glassy IRCF/OCL).
 */
export function createWhiteStudioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xf6f8fb);

  // Soft overhead studio softbox
  const topBox = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topBox.position.set(0, 14, 0);
  topBox.rotation.x = Math.PI / 2;
  envScene.add(topBox);

  // Key warm-white side softbox
  const keyBox = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 14),
    new THREE.MeshBasicMaterial({ color: 0xfffbf4, side: THREE.DoubleSide })
  );
  keyBox.position.set(16, 7, 12);
  keyBox.lookAt(0, 0, 0);
  envScene.add(keyBox);

  // Cool sky fill softbox
  const fillBox = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 14),
    new THREE.MeshBasicMaterial({ color: 0xe8f2ff, side: THREE.DoubleSide })
  );
  fillBox.position.set(-16, 6, -10);
  fillBox.lookAt(0, 0, 0);
  envScene.add(fillBox);

  // Subtle dark studio flags so metals and glass show crisp industrial contrast on white
  const darkFlag1 = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 6),
    new THREE.MeshBasicMaterial({ color: 0x334155, side: THREE.DoubleSide })
  );
  darkFlag1.position.set(0, 1.5, -18);
  darkFlag1.lookAt(0, 0, 0);
  envScene.add(darkFlag1);

  const darkFlag2 = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 5),
    new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide })
  );
  darkFlag2.position.set(18, 1.5, -8);
  darkFlag2.lookAt(0, 0, 0);
  envScene.add(darkFlag2);

  // Bright bounce floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({ color: 0xeef2f6, side: THREE.DoubleSide })
  );
  floor.position.set(0, -10, 0);
  floor.rotation.x = -Math.PI / 2;
  envScene.add(floor);

  const rt = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Phase 13: Precision sub-micron optical/TMR linear encoder zebra grating texture.
 */
function createEncoderScaleTexture() {
  const { c, ctx } = makeCanvas(512, 128);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  // Fine incremental optical grating bars (20 um pitch visual representation)
  for (let x = 0; x < 512; x += 8) {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x, 14, 4, 52);
  }
  // Absolute reference index track along lower lane
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 84, 512, 8);
  for (let x = 16; x < 512; x += 48) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, 96, 10, 18);
  }
  return toTexture(c, true);
}

/**
 * Phase 13: Co-fired multilayer PZT ceramic + alternating Ag-Pd internal electrode lamination texture.
 */
function createPztStackTexture() {
  const { c, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#d9bc82';
  ctx.fillRect(0, 0, 256, 256);

  // Alternating warm PZT piezoelectric layers (25 um) & silver-palladium (Ag-Pd) internal electrodes
  for (let y = 0; y < 256; y += 16) {
    ctx.fillStyle = '#c9a667';
    ctx.fillRect(0, y, 256, 11);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, y + 11, 256, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, y + 14, 256, 2);
  }
  return toTexture(c, true);
}

/**
 * Phase 14: Concentric hyperbolic 0-2pi phase-wrapped TiO2 metalens optical zone texture.
 */
function createMetalensZoneTexture() {
  const { c, ctx } = makeCanvas(512, 512);
  const cx = 256, cy = 256;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);
  for (let r = 254; r > 0; r -= 2) {
    // Hyperbolic phase wrapping phi(r) ~ sqrt(r^2 + f^2) - f
    const phi = ((Math.sqrt(r * r + 180 * 180) - 180) * 0.24) % 1.0;
    const hue = 185 + phi * 105; // Cyan -> Sapphire -> Violet iridescent phase ring
    const lum = 46 + phi * 28;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${hue}, 88%, ${lum}%)`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  return toTexture(c, true);
}

/**
 * Phase 14: Sub-wavelength GaN/TiO2 photonic RGB color-router mosaic texture.
 */
function createMetaColorRouterTexture() {
  const { c, ctx } = makeCanvas(256, 256);
  const colors = ['#ef4444', '#10b981', '#10b981', '#3b82f6'];
  const step = 16;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      const idx = (((y / step) & 1) << 1) | ((x / step) & 1);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x + 4, y + 4, step - 8, 2);
      ctx.fillRect(x + 4, y + 9, step - 8, 2);
    }
  }
  return toTexture(c, true);
}

/**
 * Phase 15: High-modulus woven CFRP (50 um carbon-fiber epoxy) mechanical shutter blade texture.
 */
function createCarbonWeaveTexture() {
  const { c, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#181e28';
  ctx.fillRect(0, 0, 256, 256);
  const s = 16;
  for (let y = 0; y < 256; y += s) {
    for (let x = 0; x < 256; x += s) {
      const alt = (((x / s) + (y / s)) & 1) === 0;
      ctx.fillStyle = alt ? '#2b3445' : '#11161f';
      ctx.fillRect(x, y, s - 1, s - 1);
      ctx.fillStyle = alt ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.05)';
      ctx.fillRect(x + 1, y + 2, s - 3, 4);
    }
  }
  return toTexture(c, true);
}

/**
 * Phase 16: Strictly ZERO-TEXT LTPO Tandem OLED live camera viewfinder texture
 * (geometric composition rule-of-thirds grid, horizon reticle, focus bracket, shutter ring).
 */
function createOledViewfinderTexture() {
  const { c, ctx } = makeCanvas(1024, 512);
  // Deep twilight sky / alpine horizon photographic preview gradient
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0f172a');
  g.addColorStop(0.42, '#1e3a8a');
  g.addColorStop(0.68, '#0284c7');
  g.addColorStop(0.84, '#f59e0b');
  g.addColorStop(1, '#1e293b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle geometric mountain silhouette
  ctx.fillStyle = 'rgba(15,23,42,0.72)';
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(0, 390);
  ctx.lineTo(220, 290);
  ctx.lineTo(390, 355);
  ctx.lineTo(610, 240);
  ctx.lineTo(840, 360);
  ctx.lineTo(1024, 310);
  ctx.lineTo(1024, 512);
  ctx.closePath();
  ctx.fill();

  // Rule-of-thirds geometric grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 2;
  for (const x of [341, 682]) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (const y of [170, 341]) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
  }

  // Golden autofocus reticle brackets (center)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  const bx = 462, by = 206, bs = 100, arm = 22;
  ctx.beginPath();
  ctx.moveTo(bx, by + arm); ctx.lineTo(bx, by); ctx.lineTo(bx + arm, by);
  ctx.moveTo(bx + bs - arm, by); ctx.lineTo(bx + bs, by); ctx.lineTo(bx + bs, by + arm);
  ctx.moveTo(bx, by + bs - arm); ctx.lineTo(bx, by + bs); ctx.lineTo(bx + arm, by + bs);
  ctx.moveTo(bx + bs - arm, by + bs); ctx.lineTo(bx + bs, by + bs); ctx.lineTo(bx + bs, by + bs - arm);
  ctx.stroke();

  // Pure-geometric circular shutter trigger icon on right bezel bar (zero text!)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(942, 256, 36, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(942, 256, 27, 0, Math.PI * 2); ctx.fill();

  return toTexture(c, true);
}

/**
 * Phase 16: Strictly ZERO-TEXT high-density Silicon-Carbon (Si-C) stacked battery pouch texture.
 */
function createBatteryCellTexture() {
  const { c, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle brushed aluminum-laminate pouch sheen
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#2a3342');
  g.addColorStop(0.5, '#191f2a');
  g.addColorStop(1, '#262f3e');
  ctx.fillStyle = g;
  ctx.fillRect(14, 14, 484, 484);

  // Dual-cell stacked division groove & metallic heat-seal perimeter seam
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(18, 256); ctx.lineTo(494, 256); ctx.stroke();

  // Pure geometric lightning bolt emblem (zero text!)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(270, 180);
  ctx.lineTo(222, 266);
  ctx.lineTo(258, 266);
  ctx.lineTo(242, 336);
  ctx.lineTo(294, 246);
  ctx.lineTo(258, 246);
  ctx.closePath();
  ctx.fill();

  return toTexture(c, true);
}

/**
 * Material Library Factory with shared clipping planes & clean PBR parameters.
 */
export function createMaterialLibrary(clippingPlanes) {
  const sensorSurf = createSensorSurfaceTextures();
  const logicTex = createLogicDieTextures();
  const dramTex = createDramDieTexture();
  const trLayerTex = createTransistorLayerTexture();
  const cucuTex = createCuCuHybridTexture();
  const pcbTex = createRigidPcbTexture();
  const fpcTex = createFpcTexture();
  const coilTex = createCopperCoilTexture();
  const encoderTex = createEncoderScaleTexture();
  const pztStackTex = createPztStackTexture();
  const metalensZoneTex = createMetalensZoneTexture();
  const colorRouterTex = createMetaColorRouterTexture();
  const carbonWeaveTex = createCarbonWeaveTexture();
  const oledTex = createOledViewfinderTexture();
  const batteryTex = createBatteryCellTexture();

  const base = {
    clippingPlanes,
    clipShadows: true,
    side: THREE.DoubleSide
  };

  return {
    susSteel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xc2ccd6,
      metalness: 0.94,
      roughness: 0.22,
      clearcoat: 0.35,
      clearcoatRoughness: 0.18
    }),
    susDarkInner: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1b212a,
      metalness: 0.55,
      roughness: 0.52
    }),
    ircfCoating: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x67e8f9,
      metalness: 0.16,
      roughness: 0.04,
      transparent: true,
      opacity: 0.20,
      iridescence: 1.0,
      iridescenceIOR: 1.85,
      iridescenceThicknessRange: [240, 580],
      clearcoat: 1.0,
      depthWrite: false
    }),
    blueGlassIrcf: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0ea5e9,
      metalness: 0.04,
      roughness: 0.04,
      transparent: true,
      opacity: 0.26,
      ior: 1.52,
      reflectivity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.38,
      iridescenceIOR: 1.5,
      depthWrite: false
    }),
    lcpBlack: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x262d38,
      metalness: 0.08,
      roughness: 0.62
    }),
    uvAdhesive: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x4f46e5,
      metalness: 0.05,
      roughness: 0.22,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.8
    }),
    sensorOpticalSurface: new THREE.MeshPhysicalMaterial({
      ...base,
      map: sensorSurf.map,
      roughnessMap: sensorSurf.roughnessMap,
      color: 0xffffff,
      metalness: 0.45,
      roughness: 0.18,
      iridescence: 1.0,
      iridescenceIOR: 1.48,
      iridescenceThicknessRange: [260, 640],
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    }),
    siliconPhotodiode: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e3a8a,
      metalness: 0.62,
      roughness: 0.22,
      iridescence: 0.45,
      iridescenceIOR: 2.1,
      clearcoat: 0.5
    }),
    transistorSilicon: new THREE.MeshPhysicalMaterial({
      ...base,
      map: trLayerTex,
      color: 0xe0e7ff,
      metalness: 0.58,
      roughness: 0.26
    }),
    cucuHybridLayer: new THREE.MeshStandardMaterial({
      ...base,
      map: cucuTex.map,
      metalnessMap: cucuTex.metalnessMap,
      color: 0xffffff,
      metalness: 0.88,
      roughness: 0.24
    }),
    copperPad: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.20
    }),
    dramDie: new THREE.MeshPhysicalMaterial({
      ...base,
      map: dramTex,
      color: 0xffffff,
      metalness: 0.64,
      roughness: 0.24,
      clearcoat: 0.4
    }),
    logicDie: new THREE.MeshPhysicalMaterial({
      ...base,
      map: logicTex.map,
      roughnessMap: logicTex.roughnessMap,
      color: 0xffffff,
      metalness: 0.68,
      roughness: 0.28
    }),
    siliconBulkSide: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x3b4252,
      metalness: 0.78,
      roughness: 0.26
    }),
    goldBond: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf7c948,
      metalness: 0.98,
      roughness: 0.15,
      clearcoat: 0.2
    }),
    alPad: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.2
    }),
    mobEpoxy: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1b1f27,
      metalness: 0.06,
      roughness: 0.52
    }),
    silverEpoxyDaf: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x9ca3af,
      metalness: 0.75,
      roughness: 0.38
    }),
    oisCarrierPcb: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0f5c52,
      metalness: 0.18,
      roughness: 0.42
    }),
    rigidPcb: new THREE.MeshStandardMaterial({
      ...base,
      map: pcbTex,
      color: 0xffffff,
      metalness: 0.22,
      roughness: 0.42
    }),
    fpcPolyimide: new THREE.MeshPhysicalMaterial({
      ...base,
      map: fpcTex,
      color: 0xffffff,
      metalness: 0.35,
      roughness: 0.32,
      clearcoat: 0.45
    }),
    fpcEmiFilm: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1c1e24,
      metalness: 0.35,
      roughness: 0.48
    }),
    copperCoil: new THREE.MeshStandardMaterial({
      ...base,
      map: coilTex,
      color: 0xfb923c,
      metalness: 0.92,
      roughness: 0.26
    }),
    magnetNickel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xcbd5e1,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.3
    }),
    magnetNorthTint: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x94a3b8,
      metalness: 0.90,
      roughness: 0.22
    }),
    magnetSlit: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.4,
      roughness: 0.6
    }),
    yokePermalloy: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.32
    }),
    ceramicZirconia: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf8fafc,
      metalness: 0.04,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    }),
    beCuSpring: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd48b45,
      metalness: 0.94,
      roughness: 0.22
    }),
    mlccCeramic: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xb48a5a,
      metalness: 0.08,
      roughness: 0.36
    }),
    solderTin: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xdce3ec,
      metalness: 0.92,
      roughness: 0.22
    }),
    icPackageDark: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1e2430,
      metalness: 0.14,
      roughness: 0.42
    }),
    hallSensorEmerald: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x065f46,
      metalness: 0.35,
      roughness: 0.32
    }),
    btbHousing: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x2c2a29,
      metalness: 0.1,
      roughness: 0.48
    }),
    graphiteSheet: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x272a30,
      metalness: 0.48,
      roughness: 0.38
    }),

    // === MICRO PIXEL CROSS-SECTION MATERIALS ===
    microLensPolymer: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe0f2fe,
      metalness: 0.04,
      roughness: 0.03,
      transparent: true,
      opacity: 0.24,
      ior: 1.64,
      reflectivity: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      iridescence: 0.42,
      iridescenceIOR: 1.64,
      depthWrite: false
    }),
    microArlLayer: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xbae6fd,
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: 0.16,
      iridescence: 0.85,
      iridescenceIOR: 1.6,
      depthWrite: false
    }),
    cfaRed: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe11d48,
      metalness: 0.02,
      roughness: 0.12,
      transparent: true,
      opacity: 0.86,
      clearcoat: 0.75
    }),
    cfaGreen: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x16a34a,
      metalness: 0.02,
      roughness: 0.12,
      transparent: true,
      opacity: 0.86,
      clearcoat: 0.75
    }),
    cfaBlue: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2563eb,
      metalness: 0.02,
      roughness: 0.12,
      transparent: true,
      opacity: 0.86,
      clearcoat: 0.75
    }),
    tungstenGrid: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x475569,
      metalness: 0.92,
      roughness: 0.25
    }),
    lowNGrid: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.05,
      roughness: 0.12,
      transparent: true,
      opacity: 0.58
    }),
    hfo2FixedCharge: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x9333ea,
      metalness: 0.28,
      roughness: 0.16,
      transparent: true,
      opacity: 0.86,
      iridescence: 0.75
    }),
    fullDtiOxide: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbe4ee,
      metalness: 0.08,
      roughness: 0.24,
      transparent: true,
      opacity: 0.90
    }),
    microPdSilicon: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1d4ed8,
      metalness: 0.22,
      roughness: 0.15,
      transparent: true,
      opacity: 0.42,
      clearcoat: 0.6,
      depthWrite: false
    }),
    microPdDepletion: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.34,
      metalness: 0.12,
      roughness: 0.18,
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    }),
    polySiVtg: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf97316,
      metalness: 0.65,
      roughness: 0.28
    }),
    fdLoficNode: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xeab308,
      metalness: 0.82,
      roughness: 0.22
    }),
    viaTungsten: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.2
    }),
    secondLayerSi: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.42,
      roughness: 0.28,
      transparent: true,
      opacity: 0.62
    }),
    mosfetAmp: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x10b981,
      metalness: 0.72,
      roughness: 0.24
    }),
    mosfetRstSel: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0ea5e9,
      metalness: 0.72,
      roughness: 0.24
    }),
    beolCopper: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xea580c,
      metalness: 0.95,
      roughness: 0.18
    }),
    sicnDielectric: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x64748b,
      metalness: 0.12,
      roughness: 0.24,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    }),
    finfetLogicBase: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.72,
      roughness: 0.28
    }),

    // === LAYER-2 NANOSCALE PIXEL TRANSISTOR MATERIALS ===
    l2BoxOxide: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xcfe4ff,
      metalness: 0.04,
      roughness: 0.10,
      transparent: true,
      opacity: 0.16,
      clearcoat: 0.9,
      depthWrite: false
    }),
    l2InterPolySi: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0284c7,
      metalness: 0.62,
      roughness: 0.24
    }),
    l2SoiSilicon: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e3a8a,
      metalness: 0.56,
      roughness: 0.16,
      clearcoat: 0.72,
      iridescence: 0.35,
      iridescenceIOR: 2.0
    }),
    l2StiOxide: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbeafe,
      metalness: 0.04,
      roughness: 0.18,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    }),
    l2FinChannel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2563eb,
      metalness: 0.48,
      roughness: 0.12,
      clearcoat: 0.9,
      iridescence: 0.45,
      iridescenceIOR: 1.9
    }),
    l2GateOxide: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xc084fc,
      metalness: 0.12,
      roughness: 0.10,
      transparent: true,
      opacity: 0.78,
      iridescence: 0.85,
      iridescenceIOR: 1.55
    }),
    l2TinLiner: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xca8a04,
      metalness: 0.94,
      roughness: 0.20
    }),
    l2SpacerSiN: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x6366f1,
      metalness: 0.18,
      roughness: 0.32
    }),
    l2RaisedEpiSD: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      metalness: 0.52,
      roughness: 0.20,
      clearcoat: 0.55
    }),
    l2NiSiSalicide: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe5e7eb,
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 0.4
    }),
    l2CeslStress: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      metalness: 0.08,
      roughness: 0.10,
      transparent: true,
      opacity: 0.22,
      iridescence: 0.72,
      iridescenceIOR: 1.95,
      depthWrite: false
    }),
    l2LoficZazDielectric: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf43f5e,
      metalness: 0.15,
      roughness: 0.16,
      transparent: true,
      opacity: 0.72,
      iridescence: 0.8
    }),
    l2FdgGate: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x8b5cf6,
      metalness: 0.76,
      roughness: 0.22
    }),
    l2LoficGate: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xec4899,
      metalness: 0.76,
      roughness: 0.22
    }),
    l2MillerShield: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x14b8a6,
      metalness: 0.72,
      roughness: 0.22,
      transparent: true,
      opacity: 0.62
    }),
    l2LowKDielectric: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xcbd5e1,
      metalness: 0.04,
      roughness: 0.18,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    }),

    // === PHASE 3: OPTICAL 1G7P LENS, VARIABLE APERTURE & VCM/OIS MATERIALS ===
    lensSapphire: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe0f2fe,
      metalness: 0.04,
      roughness: 0.05,
      transparent: true,
      opacity: 0.30,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.55,
      iridescenceIOR: 1.77,
      depthWrite: false
    }),
    lensAldCoat: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2dd4bf,
      metalness: 0.18,
      roughness: 0.06,
      transparent: true,
      opacity: 0.34,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.46,
      depthWrite: false
    }),
    lensGlass1G: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x7dd3fc,
      metalness: 0.06,
      roughness: 0.05,
      transparent: true,
      opacity: 0.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.62,
      iridescenceIOR: 1.78,
      depthWrite: false
    }),
    lensResinApel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x93c5fd,
      metalness: 0.04,
      roughness: 0.06,
      transparent: true,
      opacity: 0.44,
      clearcoat: 0.96,
      iridescence: 0.36,
      iridescenceIOR: 1.54,
      depthWrite: false
    }),
    lensResinFlint: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xfcd34d,
      metalness: 0.06,
      roughness: 0.06,
      transparent: true,
      opacity: 0.48,
      clearcoat: 0.96,
      iridescence: 0.48,
      iridescenceIOR: 1.66,
      depthWrite: false
    }),
    lensResinGullwing: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xa5b4fc,
      metalness: 0.05,
      roughness: 0.06,
      transparent: true,
      opacity: 0.48,
      clearcoat: 1.0,
      iridescence: 0.58,
      iridescenceIOR: 1.56,
      depthWrite: false
    }),
    lensEdgeBlack: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x111827,
      metalness: 0.05,
      roughness: 0.92
    }),
    lensLcpBarrel: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1f2937,
      metalness: 0.16,
      roughness: 0.58
    }),
    lensIrisBlade: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1e293b,
      metalness: 0.58,
      roughness: 0.36
    }),
    lensIrisCam: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x64748b,
      metalness: 0.84,
      roughness: 0.26
    }),
    lensDamperGel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x818cf8,
      metalness: 0.05,
      roughness: 0.10,
      transparent: true,
      opacity: 0.62,
      clearcoat: 1.0
    }),
    lensWireCuNiSi: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd97706,
      metalness: 0.96,
      roughness: 0.18
    }),
    lensShieldMetal: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x475569,
      metalness: 0.84,
      roughness: 0.28,
      clearcoat: 0.25
    }),
    lensMagnetN: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xdc2626,
      metalness: 0.72,
      roughness: 0.24
    }),
    lensMagnetS: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x2563eb,
      metalness: 0.72,
      roughness: 0.24
    }),
    lensCarrierBody: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.24,
      roughness: 0.46
    }),

    // === PHASE 4: EXTERIOR CAMERA DECO, COVER GLASS DX+, IP68 & AUX SENSORS ===
    decoTitanium: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x8b939e,
      metalness: 0.88,
      roughness: 0.28,
      clearcoat: 0.24
    }),
    decoBezelPvd: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e242c,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.48
    }),
    decoBackGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbe2ec,
      metalness: 0.08,
      roughness: 0.42,
      clearcoat: 0.36,
      transparent: true,
      opacity: 0.82
    }),
    decoWaterproofOring: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf97316,
      metalness: 0.04,
      roughness: 0.54
    }),
    decoEptfeVent: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf8fafc,
      metalness: 0.02,
      roughness: 0.78
    }),
    decoPoronFoam: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x14171f,
      metalness: 0.02,
      roughness: 0.96
    }),
    decoOleophobic: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      metalness: 0.06,
      roughness: 0.04,
      transparent: true,
      opacity: 0.20,
      clearcoat: 1.0,
      iridescence: 0.88,
      iridescenceIOR: 1.38,
      depthWrite: false
    }),
    decoArDxCoat: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x10b981,
      metalness: 0.14,
      roughness: 0.05,
      transparent: true,
      opacity: 0.30,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.54,
      depthWrite: false
    }),
    decoGorillaDx: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe0f2fe,
      metalness: 0.04,
      roughness: 0.04,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1.0,
      iridescence: 0.38,
      iridescenceIOR: 1.52,
      depthWrite: false
    }),
    decoIrBlackWindow: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e1b4b,
      metalness: 0.16,
      roughness: 0.08,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1.0,
      iridescence: 0.65
    }),
    decoVcselLaser: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 0.48,
      metalness: 0.65,
      roughness: 0.18
    }),
    decoDoeGrating: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      metalness: 0.25,
      roughness: 0.12,
      transparent: true,
      opacity: 0.70,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.65
    }),
    decoSpadArray: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x312e81,
      metalness: 0.68,
      roughness: 0.18,
      iridescence: 0.72,
      iridescenceIOR: 2.0
    }),
    decoFresnelLens: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xfef3c7,
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: 0.56,
      clearcoat: 1.0,
      iridescence: 0.45,
      depthWrite: false
    }),
    decoOpalDiffuser: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf1f5f9,
      metalness: 0.02,
      roughness: 0.36,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.55
    }),

    // === PHASE 5: PERISCOPE TELEPHOTO PRISM, D-CUT FCD100 APO & LINEAR VCM ===
    periPrismGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbf4ff,
      metalness: 0.05,
      roughness: 0.03,
      transparent: true,
      opacity: 0.38,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.52,
      iridescenceIOR: 1.85,
      depthWrite: false
    }),
    periSilverMirror: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf1f5f9,
      metalness: 0.99,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.22,
      iridescenceIOR: 1.5
    }),
    periFcd100Glass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x5eead4,
      metalness: 0.05,
      roughness: 0.04,
      transparent: true,
      opacity: 0.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.82,
      iridescenceIOR: 1.44,
      depthWrite: false
    }),
    periArGreenCoat: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x34d399,
      metalness: 0.16,
      roughness: 0.05,
      transparent: true,
      opacity: 0.28,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.48,
      depthWrite: false
    }),
    periCopperHeatsink: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd97745,
      metalness: 0.94,
      roughness: 0.24,
      clearcoat: 0.24
    }),
    periHardenedRail: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.10,
      clearcoat: 0.55
    }),
    periTmrStrip: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0f766e,
      metalness: 0.58,
      roughness: 0.28
    }),

    // === PHASE 6: ULTRA-DEEP VARIABLE APERTURE & LENS MICRO-ANATOMY ===
    apBladeDlc: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x171e29,
      metalness: 0.76,
      roughness: 0.24,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18
    }),
    apBladeLowerDlc: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2b394d,
      metalness: 0.78,
      roughness: 0.26,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18
    }),
    apPtfeShim: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdff6ff,
      metalness: 0.04,
      roughness: 0.16,
      transparent: true,
      opacity: 0.80,
      clearcoat: 0.65
    }),
    apStopElastomer: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf97316,
      metalness: 0.04,
      roughness: 0.66
    }),
    lensHybridResin: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      metalness: 0.06,
      roughness: 0.04,
      transparent: true,
      opacity: 0.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.75,
      iridescenceIOR: 1.56,
      depthWrite: false
    }),
    lensMothEyeNano: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x10b981,
      metalness: 0.16,
      roughness: 0.10,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.32
    }),
    lensVentCyan: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x06b6d4,
      metalness: 0.82,
      roughness: 0.22
    }),

    // === PHASE 7: EXTREME MICRON-LEVEL VARIABLE APERTURE MATERIALS ===
    irBladeTier1: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x111722,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.16
    }),
    irBladeTier2: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x222e40,
      metalness: 0.78,
      roughness: 0.24,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18
    }),
    irBladeTier3: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.76,
      roughness: 0.26,
      clearcoat: 0.38,
      clearcoatRoughness: 0.20
    }),
    irKnifeEdgeSheen: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x64748b,
      metalness: 0.94,
      roughness: 0.12,
      clearcoat: 0.7
    }),
    irSlotLinerTeal: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0d9488,
      metalness: 0.35,
      roughness: 0.28
    }),
    irDustTrapGel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xfbbf24,
      metalness: 0.04,
      roughness: 0.14,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    }),
    irLaserWeld: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      metalness: 0.96,
      roughness: 0.16,
      iridescence: 0.85,
      iridescenceIOR: 1.8
    }),

    // === PHASE 8: SUB-MICRON APERTURE TRIBOLOGY, METALLURGY & MICRO-CONTACT ===
    nanoFdlcTop: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x162030,
      metalness: 0.52,
      roughness: 0.26,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      iridescence: 0.52,
      iridescenceIOR: 1.85,
      iridescenceThicknessRange: [180, 420]
    }),
    nanoGothicSteel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x526074,
      metalness: 0.88,
      roughness: 0.24,
      clearcoat: 0.45,
      clearcoatRoughness: 0.18
    }),
    nanoFdlcBot: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e293b,
      metalness: 0.68,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      iridescence: 0.72,
      iridescenceIOR: 1.85
    }),
    nanoBlackOxide: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x161922,
      metalness: 0.24,
      roughness: 0.84
    }),
    nanoCrTiAnchor: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x8b5cf6,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.65,
      iridescence: 0.92,
      iridescenceIOR: 2.15
    }),
    nanoSus304Core: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd5dde6,
      metalness: 0.96,
      roughness: 0.22,
      clearcoat: 0.32
    }),
    nanoKnifeEdge: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x94a3b8,
      metalness: 0.98,
      roughness: 0.10,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08
    }),
    nanoLaserHaz: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.22,
      iridescence: 1.0,
      iridescenceIOR: 2.1,
      iridescenceThicknessRange: [220, 560]
    }),
    nanoTiRotor: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x7c8798,
      metalness: 0.90,
      roughness: 0.28,
      clearcoat: 0.25
    }),
    nanoTinGold: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xeab308,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.45
    }),
    nanoPorousBronze: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xb4723c,
      metalness: 0.80,
      roughness: 0.54
    }),
    nanoMos2Lube: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1d4ed8,
      metalness: 0.48,
      roughness: 0.30,
      iridescence: 0.55,
      iridescenceIOR: 1.75
    }),
    nanoClearanceCyan: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x06b6d4,
      metalness: 0.18,
      roughness: 0.14,
      transparent: true,
      opacity: 0.46,
      clearcoat: 0.8,
      depthWrite: false
    }),
    nanoPtfeTranslucent: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xcffafe,
      metalness: 0.04,
      roughness: 0.16,
      transparent: true,
      opacity: 0.46,
      clearcoat: 0.85,
      clearcoatRoughness: 0.10,
      depthWrite: false
    }),
    nanoCntFilament: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.28,
      metalness: 0.65,
      roughness: 0.26
    }),
    nanoHertzGlow: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.52,
      metalness: 0.12,
      roughness: 0.20,
      transparent: true,
      opacity: 0.88
    }),
    nanoZirconiaCore: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbeafe,
      metalness: 0.08,
      roughness: 0.18,
      clearcoat: 0.90,
      iridescence: 0.38,
      iridescenceIOR: 2.15
    }),
    nanoUewEnamel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xc2410c,
      metalness: 0.28,
      roughness: 0.18,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08
    }),
    nanoSelfBondPoly: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x10b981,
      metalness: 0.08,
      roughness: 0.14,
      transparent: true,
      opacity: 0.56,
      clearcoat: 1.0,
      depthWrite: false
    }),
    nanoOfcCopper: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf97316,
      metalness: 0.98,
      roughness: 0.14,
      clearcoat: 0.32
    }),
    nanoSwageSteel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x9aa5b4,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.48
    }),

    // === PHASE 9: QUANTUM dToF LiDAR (940nm VCSEL + ITO DOE + 3D-STACKED BSI SPAD) ===
    ldCeramicHousing: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x333c4b,
      metalness: 0.16,
      roughness: 0.48
    }),
    ldAlNSubmount: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xe6ecf3,
      metalness: 0.08,
      roughness: 0.34
    }),
    ldQuartzDoe: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe0f2fe,
      metalness: 0.06,
      roughness: 0.06,
      transparent: true,
      opacity: 0.34,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.95,
      iridescenceIOR: 1.46,
      iridescenceThicknessRange: [240, 620],
      depthWrite: false
    }),
    ldItoTrace: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.38,
      metalness: 0.72,
      roughness: 0.18
    }),
    ldIrGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      metalness: 0.06,
      roughness: 0.04,
      transparent: true,
      opacity: 0.38,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.48,
      iridescenceIOR: 1.54,
      depthWrite: false
    }),
    ldBandpass940: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x9d174d,
      metalness: 0.32,
      roughness: 0.06,
      transparent: true,
      opacity: 0.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 1.0,
      iridescenceIOR: 2.25,
      iridescenceThicknessRange: [280, 640],
      depthWrite: false
    }),
    ldGaAsSub: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x283044,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.35
    }),
    ldDbrMirrorTop: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.16,
      iridescence: 0.88,
      iridescenceIOR: 2.0,
      clearcoat: 0.45
    }),
    ldDbrMirrorBot: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x6366f1,
      metalness: 0.88,
      roughness: 0.18,
      iridescence: 0.82,
      iridescenceIOR: 2.0,
      clearcoat: 0.4
    }),
    ldOxideAperture: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x14b8a6,
      metalness: 0.20,
      roughness: 0.24,
      clearcoat: 0.7
    }),
    ldMqwActive: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xe11d48,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.62,
      metalness: 0.28,
      roughness: 0.18
    }),
    ldSpadSiDeep: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1d4ed8,
      metalness: 0.24,
      roughness: 0.16,
      transparent: true,
      opacity: 0.40,
      clearcoat: 0.55,
      depthWrite: false
    }),
    ldSpadAvalanche: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xa855f7,
      emissive: 0xc026d3,
      emissiveIntensity: 0.54,
      metalness: 0.25,
      roughness: 0.16
    }),
    ldSpadGuardRing: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0ea5e9,
      metalness: 0.68,
      roughness: 0.22
    }),
    ldSpadDiffraction: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0f766e,
      metalness: 0.72,
      roughness: 0.22,
      iridescence: 0.90,
      iridescenceIOR: 1.9,
      clearcoat: 0.45
    }),
    ldLogicQuench: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x059669,
      metalness: 0.55,
      roughness: 0.28
    }),
    ldLogicTdc: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd97706,
      metalness: 0.72,
      roughness: 0.24
    }),
    ldLogicDsp: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x1e293b,
      metalness: 0.66,
      roughness: 0.26
    }),
    ldMonitorPd: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0284c7,
      metalness: 0.62,
      roughness: 0.20,
      clearcoat: 0.8
    }),

    // === PHASE 10: ZERO-MAGNET 8-WIRE SMA (NiTiCu) ARTIFICIAL-MUSCLE ACTUATOR ===
    smaWireWarm: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.42,
      metalness: 0.78,
      roughness: 0.22
    }),
    smaWireCool: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.22,
      metalness: 0.84,
      roughness: 0.22
    }),
    smaCrimpGold: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd99b26,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 0.35
    }),
    smaCommonCopper: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd97745,
      metalness: 0.94,
      roughness: 0.20,
      clearcoat: 0.30
    }),
    smaThermalBreak: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x7c3aed,
      metalness: 0.14,
      roughness: 0.38
    }),
    smaHeatsinkSteel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x475569,
      metalness: 0.88,
      roughness: 0.28,
      clearcoat: 0.25
    }),
    smaShuntPrecision: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x0f766e,
      metalness: 0.25,
      roughness: 0.36
    }),
    smaWireSkin: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.24,
      iridescence: 0.55,
      iridescenceIOR: 1.9
    }),
    smaMartensiteAtom: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0284c7,
      metalness: 0.55,
      roughness: 0.20,
      clearcoat: 0.7
    }),
    smaAusteniteAtom: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe11d48,
      metalness: 0.60,
      roughness: 0.18,
      clearcoat: 0.8
    }),
    smaTiAtom: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16
    }),
    smaPhaseFront: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xf97316,
      emissiveIntensity: 0.68,
      metalness: 0.15,
      roughness: 0.20,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    }),

    // === PHASE 11: 4-QUADRANT ELECTROWETTING LIQUID LENS & 500x EDL NANO-ANATOMY ===
    llWaterLiquid: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.14,
      metalness: 0.02,
      roughness: 0.06,
      transparent: true,
      opacity: 0.44,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.25,
      iridescenceIOR: 1.35,
      depthWrite: false
    }),
    llOilLiquid: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.16,
      metalness: 0.04,
      roughness: 0.05,
      transparent: true,
      opacity: 0.56,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.35,
      iridescenceIOR: 1.54,
      depthWrite: false
    }),
    llMeniscusGlow: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.38,
      metalness: 0.16,
      roughness: 0.04,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.48
    }),
    llCytopHydrophobic: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x6366f1,
      metalness: 0.14,
      roughness: 0.18,
      clearcoat: 0.92,
      iridescence: 0.48,
      iridescenceIOR: 1.34
    }),
    llParyleneDielectric: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.12,
      metalness: 0.10,
      roughness: 0.22,
      clearcoat: 0.65
    }),
    llQuadElectrode: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xfbbf24,
      emissive: 0xb45309,
      emissiveIntensity: 0.15,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.35
    }),
    llBellowsSteel: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xcbd5e1,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.25
    }),
    llFfkMOseal: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x4c1d3d,
      metalness: 0.06,
      roughness: 0.58
    }),
    llCeramicChamber: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x334155,
      metalness: 0.18,
      roughness: 0.44
    }),
    llIonCation: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.45,
      metalness: 0.12,
      roughness: 0.18,
      clearcoat: 0.85
    }),
    llIonAnion: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.40,
      metalness: 0.12,
      roughness: 0.18,
      clearcoat: 0.85
    }),
    llChargeNegative: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.46,
      metalness: 0.22,
      roughness: 0.20,
      clearcoat: 0.75
    }),

    // === PHASE 12: 4-BOUNCE TETRAPRISM 5x TELEPHOTO & 500x TIR EVANESCENT-WAVE NANO-STACK ===
    tpPrismGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xdbeafe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.08,
      metalness: 0.04,
      roughness: 0.03,
      transparent: true,
      opacity: 0.34,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      iridescence: 0.55,
      iridescenceIOR: 1.88,
      depthWrite: false
    }),
    tpMirrorSilver: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf1f5f9,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.14,
      metalness: 0.98,
      roughness: 0.06,
      clearcoat: 1.0,
      iridescence: 0.45,
      iridescenceIOR: 1.75
    }),
    tpTirAirGap: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.22,
      metalness: 0.10,
      roughness: 0.08,
      transparent: true,
      opacity: 0.38,
      clearcoat: 0.9,
      depthWrite: false
    }),
    tpDielectricTiO2: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x8b5cf6,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.18,
      metalness: 0.18,
      roughness: 0.14,
      iridescence: 0.95,
      iridescenceIOR: 2.35
    }),
    tpDielectricSiO2: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 0.14,
      metalness: 0.10,
      roughness: 0.16,
      clearcoat: 0.85
    }),
    tpWaveCrest: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.52,
      metalness: 0.18,
      roughness: 0.20
    }),
    tpEvanescentGlow: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.58,
      metalness: 0.06,
      roughness: 0.18,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    }),
    tpGoosGauge: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.42,
      metalness: 0.25,
      roughness: 0.24
    }),

    // === PHASE 13: CONTINUOUS OPTICAL ZOOM PERISCOPE (85-170mm) + 110kHz ULTRASONIC PIEZO + 10,000x PEROVSKITE PZT ===
    zmPztCeramic: new THREE.MeshPhysicalMaterial({
      ...base,
      map: pztStackTex,
      color: 0xffffff,
      emissive: 0xb45309,
      emissiveIntensity: 0.08,
      metalness: 0.16,
      roughness: 0.28,
      clearcoat: 0.55
    }),
    zmAgPdElectrode: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.65
    }),
    zmAluminaCeramic: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf8fafc,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.06,
      metalness: 0.05,
      roughness: 0.14,
      clearcoat: 0.92
    }),
    zmRubyTip: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 0.34,
      metalness: 0.12,
      roughness: 0.10,
      clearcoat: 1.0
    }),
    zmGuideShaft: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.08,
      clearcoat: 0.72
    }),
    zmPtfeBushing: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xc27c3e,
      metalness: 0.64,
      roughness: 0.26,
      clearcoat: 0.35
    }),
    zmEncoderScale: new THREE.MeshStandardMaterial({
      ...base,
      map: encoderTex,
      color: 0xffffff,
      metalness: 0.42,
      roughness: 0.28
    }),
    zmPbCation: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x64748b,
      emissive: 0x334155,
      emissiveIntensity: 0.18,
      metalness: 0.80,
      roughness: 0.18,
      clearcoat: 0.85
    }),
    zmOxygenAnion: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x14b8a6,
      emissive: 0x0d9488,
      emissiveIntensity: 0.36,
      metalness: 0.14,
      roughness: 0.14,
      clearcoat: 0.92
    }),
    zmOctaFacet: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.14,
      metalness: 0.06,
      roughness: 0.12,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    }),
    zmTiDipole: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 0.62,
      metalness: 0.22,
      roughness: 0.14,
      clearcoat: 1.0
    }),
    zmOrbitGlow: new THREE.MeshStandardMaterial({
      ...base,
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.68,
      metalness: 0.16,
      roughness: 0.18
    }),
    zmDipoleVector: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd946ef,
      emissive: 0xa21caf,
      emissiveIntensity: 0.56,
      metalness: 0.20,
      roughness: 0.18
    }),
    zmDcutGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xbfdbfe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.10,
      metalness: 0.04,
      roughness: 0.04,
      transparent: true,
      opacity: 0.44,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.68,
      iridescenceIOR: 1.78,
      depthWrite: false
    }),
    zmDcutFlint: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe9d5ff,
      emissive: 0xa855f7,
      emissiveIntensity: 0.10,
      metalness: 0.04,
      roughness: 0.04,
      transparent: true,
      opacity: 0.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.72,
      iridescenceIOR: 1.85,
      depthWrite: false
    }),

    // === PHASE 14: FLAT TiO2 METALENS & 20,000x SUB-WAVELENGTH NANOPHOTONIC WAVEFRONT ===
    mlFusedSilica: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.08,
      metalness: 0.04,
      roughness: 0.04,
      transparent: true,
      opacity: 0.34,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.48,
      iridescenceIOR: 1.46,
      depthWrite: false
    }),
    mlMetaSurfaceM1: new THREE.MeshPhysicalMaterial({
      ...base,
      map: metalensZoneTex,
      color: 0xffffff,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.14,
      metalness: 0.25,
      roughness: 0.14,
      iridescence: 1.0,
      iridescenceIOR: 2.50,
      clearcoat: 1.0
    }),
    mlMetaSurfaceM2: new THREE.MeshPhysicalMaterial({
      ...base,
      map: metalensZoneTex,
      color: 0xe0e7ff,
      emissive: 0x6366f1,
      emissiveIntensity: 0.22,
      metalness: 0.30,
      roughness: 0.12,
      iridescence: 1.0,
      iridescenceIOR: 2.55,
      clearcoat: 1.0
    }),
    mlColorRouter: new THREE.MeshPhysicalMaterial({
      ...base,
      map: colorRouterTex,
      color: 0xffffff,
      emissive: 0x334155,
      emissiveIntensity: 0.12,
      metalness: 0.22,
      roughness: 0.16,
      iridescence: 0.92,
      clearcoat: 0.9
    }),
    mlTio2PillarCenter: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.28,
      metalness: 0.18,
      roughness: 0.12,
      iridescence: 1.0,
      iridescenceIOR: 2.55,
      clearcoat: 1.0
    }),
    mlTio2FinMid: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.30,
      metalness: 0.18,
      roughness: 0.12,
      iridescence: 0.95,
      iridescenceIOR: 2.55,
      clearcoat: 1.0
    }),
    mlTio2PillarEdge: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x14b8a6,
      emissive: 0x0d9488,
      emissiveIntensity: 0.28,
      metalness: 0.18,
      roughness: 0.14,
      iridescence: 0.90,
      iridescenceIOR: 2.50,
      clearcoat: 1.0
    }),
    mlTio2IruCoupled: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x8b5cf6,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.34,
      metalness: 0.20,
      roughness: 0.12,
      iridescence: 1.0,
      iridescenceIOR: 2.55,
      clearcoat: 1.0
    }),
    mlWavePlane: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.56,
      metalness: 0.08,
      roughness: 0.14,
      transparent: true,
      opacity: 0.42,
      clearcoat: 0.85,
      depthWrite: false
    }),
    mlWaveSphere: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.54,
      metalness: 0.08,
      roughness: 0.14,
      transparent: true,
      opacity: 0.46,
      clearcoat: 0.85,
      depthWrite: false
    }),
    mlWaveGuideGlow: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      metalness: 0.10,
      roughness: 0.18,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    }),
    mlAirySpot: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.90,
      metalness: 0.15,
      roughness: 0.10,
      clearcoat: 1.0
    }),
    mlPhaseRibbon: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xd946ef,
      emissive: 0xc026d3,
      emissiveIntensity: 0.62,
      metalness: 0.18,
      roughness: 0.18
    }),

    // === PHASE 15: GLOBAL SHUTTER STACKED CMOS & 1/8,000s CARBON-FIBER MECHANICAL SHUTTER ===
    gsCarbonFront: new THREE.MeshPhysicalMaterial({
      ...base,
      map: carbonWeaveTex,
      color: 0xdbeafe,
      metalness: 0.34,
      roughness: 0.34,
      clearcoat: 0.48
    }),
    gsCarbonRear: new THREE.MeshPhysicalMaterial({
      ...base,
      map: carbonWeaveTex,
      color: 0xfef3c7,
      metalness: 0.40,
      roughness: 0.32,
      clearcoat: 0.55
    }),
    gsTungstenShield: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x475569,
      emissive: 0x1e293b,
      emissiveIntensity: 0.12,
      metalness: 0.92,
      roughness: 0.24,
      clearcoat: 0.45
    }),
    gsMemoryNode: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.48,
      metalness: 0.32,
      roughness: 0.18,
      clearcoat: 0.88
    }),
    gsGlobalTxGate: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.38,
      metalness: 0.52,
      roughness: 0.22,
      clearcoat: 0.6
    }),
    gsElectronCloud: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 0.88,
      metalness: 0.15,
      roughness: 0.12,
      clearcoat: 1.0
    }),
    gsElastomerBrake: new THREE.MeshStandardMaterial({
      ...base,
      color: 0xe11d48,
      metalness: 0.06,
      roughness: 0.60
    }),
    gsTitaniumLink: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x94a3b8,
      metalness: 0.90,
      roughness: 0.20,
      clearcoat: 0.55
    }),

    // === PHASE 16: COMPLETE INTEGRATED FLAGSHIP SMARTPHONE CAMERA SYSTEM (500-PART MILESTONE!) ===
    fpTitaniumFrame: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd0d7e0,
      metalness: 0.94,
      roughness: 0.24,
      clearcoat: 0.42,
      clearcoatRoughness: 0.20
    }),
    fpFrostedGlass: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xe2e8f0,
      emissive: 0xcbd5e1,
      emissiveIntensity: 0.08,
      metalness: 0.06,
      roughness: 0.30,
      transparent: true,
      opacity: 0.36,
      clearcoat: 0.85,
      depthWrite: false
    }),
    fpBatteryPouch: new THREE.MeshPhysicalMaterial({
      ...base,
      map: batteryTex,
      color: 0xffffff,
      metalness: 0.52,
      roughness: 0.34,
      clearcoat: 0.35
    }),
    fpOledScreen: new THREE.MeshPhysicalMaterial({
      ...base,
      map: oledTex,
      color: 0xffffff,
      emissive: 0x1e293b,
      emissiveIntensity: 0.28,
      metalness: 0.08,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    }),
    fpVaporCopper: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0xd97706,
      emissive: 0x92400e,
      emissiveIntensity: 0.10,
      metalness: 0.96,
      roughness: 0.18,
      clearcoat: 0.55
    }),
    fpSocPackage: new THREE.MeshPhysicalMaterial({
      ...base,
      color: 0x1e293b,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.14,
      metalness: 0.68,
      roughness: 0.18,
      iridescence: 0.72,
      iridescenceIOR: 1.9,
      clearcoat: 0.92
    })
  };
}
