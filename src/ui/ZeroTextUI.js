import * as THREE from 'three';

// Pure Geometric SVG Pictograms — STRICT ZERO-TEXT UI
const ICONS = {
  // Scale Switch (Macro Module / Micro 2x2 Pixel / Layer-2 SOI FinFET / Optical 1G7P Lens & VCM)
  macro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><rect x="7.5" y="8" width="9" height="8" rx="1"/><circle cx="12" cy="12" r="1.8"/><path d="M9 20v2M15 20v2"/></svg>`,
  micro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="7.5" cy="16.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  layer2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5h18"/><path d="M5.5 16.5v-5.5h3v5.5M10.5 16.5v-5.5h3v5.5M15.5 16.5v-5.5h3v5.5"/><rect x="4" y="7" width="16" height="4" rx="1.2" fill="currentColor" fill-opacity="0.18"/><line x1="12" y1="3.5" x2="12" y2="7"/><line x1="12" y1="16.5" x2="12" y2="20.5"/></svg>`,
  lens: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg>`,

  // Explode
  assembled: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>`,
  exploded: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 3.8-7 3.8-7-3.8L12 2z"/><path d="M5 12l7 3.8 7-3.8"/><path d="M5 17.5l7 3.8 7-3.8"/></svg>`,

  // Section Cut Axes (X=Red, Y=Green, Z=Blue — Zero Letters!)
  cutX: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2" stroke-opacity="0.45"/><line x1="12" y1="2.5" x2="12" y2="21.5" stroke="#dc2626" stroke-width="2.4"/><path d="M9 9l-2 3 2 3" stroke="#dc2626" stroke-width="1.8"/></svg>`,
  cutY: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2" stroke-opacity="0.45"/><line x1="2.5" y1="12" x2="21.5" y2="12" stroke="#16a34a" stroke-width="2.4"/><path d="M9 9l3-2 3 2" stroke="#16a34a" stroke-width="1.8"/></svg>`,
  cutZ: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke-opacity="0.45"/><line x1="5" y1="19" x2="19" y2="5" stroke="#2563eb" stroke-width="2.4"/></svg>`,

  // Shading Modes
  solid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="0.18"/><path d="M12 4a8 8 0 0 1 0 16" fill="currentColor" fill-opacity="0.55" stroke="none"/><circle cx="12" cy="12" r="8"/></svg>`,
  cadEdge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5" fill="currentColor" fill-opacity="0.12"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>`,
  xray: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="11" height="11" rx="2" stroke-dasharray="2.5 2"/><rect x="9" y="9" width="11" height="11" rx="2" fill="currentColor" fill-opacity="0.14"/></svg>`,
  wire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5"/><path d="M4 7.5l16 9M20 7.5l-16 9M12 3v18"/></svg>`,

  // Projection
  persp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="7 5 17 5 21 19 3 19"/><line x1="12" y1="5" x2="12" y2="19" stroke-opacity="0.45"/><line x1="5" y1="12" x2="19" y2="12" stroke-opacity="0.45"/></svg>`,
  ortho: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/><line x1="12" y1="4.5" x2="12" y2="19.5" stroke-opacity="0.45"/><line x1="4.5" y1="12" x2="19.5" y2="12" stroke-opacity="0.45"/></svg>`,

  // Physics Overlays
  rays: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="4" x2="11" y2="14"/><line x1="12" y1="3" x2="12" y2="15"/><line x1="19" y1="4" x2="13" y2="14"/><path d="M4 18h16"/><circle cx="12" cy="18" r="2.2" fill="currentColor"/></svg>`,
  ois: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M10 4l2-2 2 2M10 20l2 2 2-2M4 10l-2 2 2 2M20 10l2 2-2 2"/></svg>`,

  // View & Visibility
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.7"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a2.5 2.5 0 0 0 2.8 2.8"/><path d="M6.4 6.4C4.2 8 2.7 10.2 2 12c1.6 3.5 5.2 6.5 10 6.5 1.8 0 3.5-.4 5-1.2"/><path d="M14.1 5.8A10.7 10.7 0 0 1 22 12c-.5 1.1-1.3 2.3-2.3 3.3"/></svg>`,
  isolate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M9 8h7M9 12h7M9 16h4"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  focus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/><circle cx="12" cy="12" r="2.5"/></svg>`,

  // Ortho Presets (Top-Right View Snap Icons — Zero Letters!)
  viewIso: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 19.5 7.3 19.5 16.7 12 21 4.5 16.7 4.5 7.3"/><path d="M12 12l7.5-4.7M12 12v9M12 12L4.5 7.3"/></svg>`,
  viewTop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/></svg>`,
  viewSide: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="6" rx="1.5"/><line x1="3" y1="12" x2="21" y2="12" stroke-opacity="0.45"/></svg>`,

  // Part Category Micro-Glyphs for Layer Dissection Stack
  glyphs: {
    frame: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/><rect x="5" y="5" width="6" height="6" rx="0.8"/></svg>`,
    layers: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5.5L8 2.5l6 3-6 3-6-3z"/><path d="M2 9l6 3 6-3"/><path d="M2 12l6 3 6-3"/></svg>`,
    glass: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/><path d="M5 10.5l4-5M8.5 10.5l2.5-3.2"/></svg>`,
    box: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M4.5 6h7M4.5 10h7"/></svg>`,
    ring: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="10" height="10" rx="3"/></svg>`,
    grid: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="2.5" width="4.5" height="4.5"/><rect x="9" y="2.5" width="4.5" height="4.5"/><rect x="2.5" y="9" width="4.5" height="4.5"/><rect x="9" y="9" width="4.5" height="4.5"/></svg>`,
    chip: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="9" height="9" rx="1.2"/><path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6h2M1.5 10h2M12.5 6h2M12.5 10h2"/></svg>`,
    circuit: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M5.5 4H10v5h2M4 5.5V12h6.5"/></svg>`,
    dots: `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="4" r="1.3"/><circle cx="8" cy="4" r="1.3"/><circle cx="12" cy="4" r="1.3"/><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/><circle cx="4" cy="12" r="1.3"/><circle cx="8" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/></svg>`,
    memory: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="M8 3v10M2.5 8h11"/></svg>`,
    cpu: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/><rect x="6" y="6" width="4" height="4" fill="currentColor" stroke="none"/></svg>`,
    pins: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3h10M3 13h10M3 6v4M13 6v4"/></svg>`,
    arc: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 12.5C4.5 3.5 11.5 3.5 13.5 12.5"/><circle cx="2.5" cy="12.5" r="1.3" fill="currentColor"/><circle cx="13.5" cy="12.5" r="1.3" fill="currentColor"/></svg>`,
    mold: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/></svg>`,
    slab: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8l6-3.5L14 8l-6 3.5L2 8z"/></svg>`,
    stage: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2"/></svg>`,
    wave: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8c1.5-4 3-4 4.5 0s3 4 4.5 0 2.5-4 3.5 0"/></svg>`,
    coil: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4.5" width="12" height="7" rx="3.5"/><rect x="4.5" y="6.8" width="7" height="2.4" rx="1.2"/></svg>`,
    magnet: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="12" height="8" rx="1.5"/><line x1="8" y1="4" x2="8" y2="12"/></svg>`,
    shield: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l5.5 2v4c0 3.2-2.4 5.2-5.5 6-3.1-.8-5.5-2.8-5.5-6V4L8 2z"/></svg>`,
    sensor: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.2"/><path d="M4.2 4.2a5.4 5.4 0 0 0 0 7.6M11.8 4.2a5.4 5.4 0 0 1 0 7.6"/></svg>`,
    spheres: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="4.5" cy="4.5" r="2"/><circle cx="11.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/></svg>`,
    spring: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h10v3H6v4h7v3H3"/></svg>`,
    board: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><circle cx="5" cy="5.5" r="1"/><circle cx="11" cy="5.5" r="1"/><circle cx="5" cy="10.5" r="1"/><circle cx="11" cy="10.5" r="1"/></svg>`,
    cap: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="11" height="6" rx="1"/><line x1="5.2" y1="5" x2="5.2" y2="11"/><line x1="10.8" y1="5" x2="10.8" y2="11"/></svg>`,
    ic: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/><circle cx="5.5" cy="5.5" r="0.9" fill="currentColor"/></svg>`,
    rom: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="2.5" width="9" height="11" rx="1.5"/><line x1="6" y1="6" x2="10" y2="6"/><line x1="6" y1="9.5" x2="10" y2="9.5"/></svg>`,
    cable: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2v12M8 2v12M12 2v12"/></svg>`,
    plug: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="12" height="6" rx="1"/><path d="M5 5V3M8 5V3M11 5V3M5 11v2M8 11v2M11 11v2"/></svg>`,
    plate: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5.5" width="12" height="5" rx="1.2"/></svg>`,
    dome: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12a6 6 0 0 1 12 0z"/></svg>`,
    hash: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6h12M2 10h12M6 2v12M10 2v12"/></svg>`,
    film: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6h12M2 10h12"/></svg>`,
    wall: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2v12M2 8h12"/><rect x="2" y="2" width="12" height="12" rx="1"/></svg>`,
    cube: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" fill-opacity="0.2"/></svg>`,
    gate: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12h10M5.5 12V4M10.5 12V4"/></svg>`,
    capacitor: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4h10M3 7h10M3 10h10M3 13h10"/></svg>`,
    via: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="8" y1="2.5" x2="8" y2="13.5"/><circle cx="8" cy="2.5" r="1.4" fill="currentColor"/><circle cx="8" cy="13.5" r="1.4" fill="currentColor"/></svg>`,
    mosfet: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4v8M6 4v8M6 8h7M11 4v8"/></svg>`,
    routes: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h5v8h7M2 12h3V8h9"/></svg>`,
    bond: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="4" height="4" fill="currentColor"/><rect x="9" y="3" width="4" height="4" fill="currentColor"/><rect x="3" y="9" width="4" height="4" fill="currentColor"/><rect x="9" y="9" width="4" height="4" fill="currentColor"/></svg>`
  }
};

export class ZeroTextUI {
  constructor(rootEl, callbacks) {
    this.root = rootEl;
    this.cb = callbacks;
    this.scale = 'macro';
    this.partsList = [];
    this.selectedId = null;
    this.hiddenSet = new Set();
    this.infoOpen = true;
    this.activeClipAxis = null;
    this.shadingMode = 'solid';
    this.isOrtho = false;
    this.opticsOn = false;
    this.oisOn = false;
    this.isolateOn = false;

    this._buildDOM();
    this._setupGizmo();
  }

  _el(tag, className, html = '') {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html) e.innerHTML = html;
    return e;
  }

  _iconBtn(iconHtml, onClick, extraClass = '') {
    const b = this._el('button', `icon-btn ${extraClass}`.trim(), iconHtml);
    b.type = 'button';
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onClick(b, ev);
    });
    return b;
  }

  _buildDOM() {
    this.root.innerHTML = '';

    // 1. TOP-LEFT SCALE SWITCH (Macro Module <-> Micro 2x2 Pixel <-> Layer-2 Nanoscale <-> Optical Lens & VCM)
    const scaleDock = this._el('div', 'scale-dock cad-glass');
    this.btnMacro = this._iconBtn(ICONS.macro, () => this.cb.onSwitchScale('macro'));
    this.btnMicro = this._iconBtn(ICONS.micro, () => this.cb.onSwitchScale('micro'));
    this.btnLayer2 = this._iconBtn(ICONS.layer2, () => this.cb.onSwitchScale('layer2'));
    this.btnLens = this._iconBtn(ICONS.lens, () => this.cb.onSwitchScale('lens'), 'active');
    scaleDock.append(this.btnMacro, this.btnMicro, this.btnLayer2, this.btnLens);
    this.root.appendChild(scaleDock);

    // 2. LEFT VISUAL LAYER DISSECTION DOCK (ZERO TEXT — Color Bars + Category Glyphs + Eye Toggles)
    const layerDock = this._el('div', 'layer-dock cad-glass');
    const layerHead = this._el('div', 'layer-dock-head');
    this.btnShowAll = this._iconBtn(ICONS.eye, () => this.cb.onShowAll(), 'sm');
    this.btnIsolate = this._iconBtn(ICONS.isolate, () => this.cb.onToggleIsolate(), 'sm');
    layerHead.append(this.btnShowAll, this.btnIsolate);

    this.layerScroll = this._el('div', 'layer-scroll');
    layerDock.append(layerHead, this.layerScroll);
    this.root.appendChild(layerDock);

    // 3. TOP-RIGHT 3D ORIENTATION GIZMO (ZERO LETTERS!) + ORTHO SNAP PRESETS
    const topRight = this._el('div', 'top-right-stack');
    const presetDock = this._el('div', 'ortho-presets cad-glass');
    presetDock.append(
      this._iconBtn(ICONS.viewIso, () => this.cb.onSnapView('iso'), 'sm'),
      this._iconBtn(ICONS.viewTop, () => this.cb.onSnapView('top'), 'sm'),
      this._iconBtn(ICONS.viewSide, () => this.cb.onSnapView('front'), 'sm')
    );

    const gizmoShell = this._el('div', 'gizmo-shell cad-glass');
    this.gizmoCanvas = this._el('canvas', 'gizmo-canvas');
    this.gizmoCanvas.width = 144;
    this.gizmoCanvas.height = 144;
    gizmoShell.appendChild(this.gizmoCanvas);
    gizmoShell.addEventListener('click', () => this.cb.onSnapView('iso'));

    topRight.append(presetDock, gizmoShell);
    this.root.appendChild(topRight);

    // 4. BOTTOM FLOATING CAD TOOLBAR (100% ZERO-TEXT ICON CONTROLS)
    const bottomDock = this._el('div', 'bottom-dock cad-glass');

    // 4a. Explode Slider Group
    const explodeGroup = this._el('div', 'slider-wrap');
    const btnAssemble = this._iconBtn(ICONS.assembled, () => this.setExplodeUI(0, true), 'sm');
    this.explodeSlider = document.createElement('input');
    this.explodeSlider.type = 'range';
    this.explodeSlider.min = '0';
    this.explodeSlider.max = '100';
    this.explodeSlider.value = '0';
    this.explodeSlider.className = 'cad-range';
    this.explodeSlider.addEventListener('input', () => {
      this.cb.onExplodeChange(Number(this.explodeSlider.value) / 100);
    });
    const btnExplodeFull = this._iconBtn(ICONS.exploded, () => this.setExplodeUI(1, true), 'sm');
    explodeGroup.append(btnAssemble, this.explodeSlider, btnExplodeFull);

    // 4b. 3-Axis Real-time Section Cut Group
    const clipGroup = this._el('div', 'dock-group');
    this.btnClipX = this._iconBtn(ICONS.cutX, () => this._toggleClipAxis('x'), 'sm');
    this.btnClipY = this._iconBtn(ICONS.cutY, () => this._toggleClipAxis('y'), 'sm');
    this.btnClipZ = this._iconBtn(ICONS.cutZ, () => this._toggleClipAxis('z'), 'sm');
    this.clipSlider = document.createElement('input');
    this.clipSlider.type = 'range';
    this.clipSlider.min = '-100';
    this.clipSlider.max = '100';
    this.clipSlider.value = '0';
    this.clipSlider.disabled = true;
    this.clipSlider.className = 'cad-range short';
    this.clipSlider.addEventListener('input', () => {
      if (this.activeClipAxis) {
        this.cb.onClipChange(this.activeClipAxis, Number(this.clipSlider.value) / 100);
      }
    });
    clipGroup.append(this.btnClipX, this.btnClipY, this.btnClipZ, this.clipSlider);

    // 4c. Shading Mode Group
    const shadeGroup = this._el('div', 'dock-group');
    this.shadeBtns = {
      solid: this._iconBtn(ICONS.solid, () => this.setShadingUI('solid', true), 'sm active'),
      cad: this._iconBtn(ICONS.cadEdge, () => this.setShadingUI('cad', true), 'sm'),
      xray: this._iconBtn(ICONS.xray, () => this.setShadingUI('xray', true), 'sm'),
      wire: this._iconBtn(ICONS.wire, () => this.setShadingUI('wire', true), 'sm')
    };
    shadeGroup.append(this.shadeBtns.solid, this.shadeBtns.cad, this.shadeBtns.xray, this.shadeBtns.wire);

    // 4d. Projection & Physics Simulations Group
    const simGroup = this._el('div', 'dock-group');
    this.btnProj = this._iconBtn(ICONS.persp, () => {
      this.isOrtho = !this.isOrtho;
      this.btnProj.innerHTML = this.isOrtho ? ICONS.ortho : ICONS.persp;
      this.btnProj.classList.toggle('active', this.isOrtho);
      this.cb.onProjectionToggle(this.isOrtho);
    }, 'sm');

    this.btnRays = this._iconBtn(ICONS.rays, () => {
      this.opticsOn = !this.opticsOn;
      this.btnRays.classList.toggle('active-blue', this.opticsOn);
      this.cb.onOpticsToggle(this.opticsOn);
    }, 'sm');

    this.btnOis = this._iconBtn(ICONS.ois, () => {
      this.oisOn = !this.oisOn;
      this.btnOis.classList.toggle('active-amber', this.oisOn);
      this.cb.onOisToggle(this.oisOn);
    }, 'sm');

    this.btnReset = this._iconBtn(ICONS.reset, () => this.cb.onResetView(), 'sm');

    this.btnInfoToggle = this._iconBtn(ICONS.book, () => {
      this.setInfoOpen(!this.infoOpen);
    }, 'sm active');

    simGroup.append(this.btnProj, this.btnRays, this.btnOis, this.btnReset, this.btnInfoToggle);

    bottomDock.append(
      explodeGroup,
      this._el('div', 'dock-divider'),
      clipGroup,
      this._el('div', 'dock-divider'),
      shadeGroup,
      this._el('div', 'dock-divider'),
      simGroup
    );
    this.root.appendChild(bottomDock);

    // 5. RIGHT EXPLANATION DRAWER (THE ONLY UI ELEMENT CONTAINING TEXT)
    this.infoPanel = this._el('aside', 'info-panel cad-glass');

    const infoHead = this._el('div', 'info-head');
    this.infoColorBar = this._el('div', 'info-color-bar');
    const infoHeadText = this._el('div', 'info-head-text');
    this.infoCategory = this._el('div', 'info-category');
    this.infoTitle = this._el('h2', 'info-title');
    infoHeadText.append(this.infoCategory, this.infoTitle);

    const infoActions = this._el('div', 'info-actions');
    this.btnFocusSelected = this._iconBtn(ICONS.focus, () => {
      if (this.selectedId) this.cb.onFocusPart(this.selectedId);
      else this.cb.onResetView();
    }, 'sm');
    const btnCloseInfo = this._iconBtn(ICONS.close, () => this.setInfoOpen(false), 'sm');
    infoActions.append(this.btnFocusSelected, btnCloseInfo);
    infoHead.append(this.infoColorBar, infoHeadText, infoActions);

    this.infoBody = this._el('div', 'info-body');

    const infoFooter = this._el('div', 'info-footer');
    const btnPrev = this._iconBtn(ICONS.prev, () => this._stepPart(-1), 'sm');
    const track = this._el('div', 'info-progress-track');
    this.progressFill = this._el('div', 'info-progress-fill');
    track.appendChild(this.progressFill);
    const btnNext = this._iconBtn(ICONS.next, () => this._stepPart(1), 'sm');
    infoFooter.append(btnPrev, track, btnNext);

    this.infoPanel.append(infoHead, this.infoBody, infoFooter);
    this.root.appendChild(this.infoPanel);
  }

  _toggleClipAxis(axis) {
    if (this.activeClipAxis === axis) {
      this.activeClipAxis = null;
    } else {
      this.activeClipAxis = axis;
      this.clipSlider.value = '0';
    }
    this.btnClipX.classList.toggle('active-red', this.activeClipAxis === 'x');
    this.btnClipY.classList.toggle('active-green', this.activeClipAxis === 'y');
    this.btnClipZ.classList.toggle('active-blue', this.activeClipAxis === 'z');

    this.clipSlider.disabled = !this.activeClipAxis;
    this.clipSlider.classList.remove('clip-x', 'clip-y', 'clip-z');
    if (this.activeClipAxis) {
      this.clipSlider.classList.add(`clip-${this.activeClipAxis}`);
    }
    this.cb.onClipChange(this.activeClipAxis, Number(this.clipSlider.value) / 100);
  }

  resetClipUI() {
    this.activeClipAxis = null;
    this.btnClipX.classList.remove('active-red');
    this.btnClipY.classList.remove('active-green');
    this.btnClipZ.classList.remove('active-blue');
    this.clipSlider.disabled = true;
    this.clipSlider.value = '0';
    this.clipSlider.classList.remove('clip-x', 'clip-y', 'clip-z');
  }

  setExplodeUI(val, triggerCb = false) {
    this.explodeSlider.value = String(Math.round(val * 100));
    if (triggerCb) this.cb.onExplodeChange(val);
  }

  setShadingUI(mode, triggerCb = false) {
    this.shadingMode = mode;
    Object.entries(this.shadeBtns).forEach(([k, btn]) => {
      btn.classList.toggle('active', k === mode);
    });
    if (triggerCb) this.cb.onShadingChange(mode);
  }

  setScaleUI(scale) {
    this.scale = scale;
    this.btnMacro.classList.toggle('active', scale === 'macro');
    this.btnMicro.classList.toggle('active', scale === 'micro');
    this.btnLayer2.classList.toggle('active', scale === 'layer2');
    this.btnLens.classList.toggle('active', scale === 'lens');
    // Live mechanical actuation (Sensor-Shift OIS in macro / 6-Blade Iris + AF + OIS in lens)
    this.btnOis.style.display = (scale === 'macro' || scale === 'lens') ? 'inline-flex' : 'none';
  }

  setIsolateUI(active) {
    this.isolateOn = active;
    this.btnIsolate.classList.toggle('active', active);
  }

  setInfoOpen(open) {
    this.infoOpen = open;
    this.infoPanel.classList.toggle('collapsed', !open);
    this.btnInfoToggle.classList.toggle('active', open);
  }

  populateLayers(partsList) {
    this.partsList = partsList;
    this.hiddenSet.clear();
    this.layerScroll.innerHTML = '';
    this.chipMap = new Map();

    let prevGroup = null;
    partsList.forEach((p) => {
      if (prevGroup && p.group !== prevGroup) {
        this.layerScroll.appendChild(this._el('div', 'layer-group-sep'));
      }
      prevGroup = p.group;

      const chip = this._el('div', 'layer-chip');
      const swatch = this._el('span', 'chip-swatch');
      swatch.style.backgroundColor = p.color;

      const glyph = this._el('span', 'chip-glyph', ICONS.glyphs[p.glyph] || ICONS.glyphs.cube);

      const visBtn = this._el('button', 'chip-vis-btn', ICONS.eye);
      visBtn.type = 'button';
      visBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.cb.onTogglePartVis(p.id);
      });

      chip.append(swatch, glyph, visBtn);

      chip.addEventListener('mouseenter', () => this.cb.onHoverPartUI(p.id));
      chip.addEventListener('mouseleave', () => this.cb.onHoverPartUI(null));
      chip.addEventListener('click', () => {
        this.cb.onSelectPartUI(p.id);
      });

      this.layerScroll.appendChild(chip);
      this.chipMap.set(p.id, { chip, visBtn });
    });
  }

  syncVisibility(hiddenIds) {
    this.hiddenSet = new Set(hiddenIds);
    for (const [id, refs] of this.chipMap.entries()) {
      const isHidden = this.hiddenSet.has(id);
      refs.chip.classList.toggle('hidden-part', isHidden);
      refs.visBtn.innerHTML = isHidden ? ICONS.eyeOff : ICONS.eye;
    }
  }

  syncSelection(partId, doc) {
    this.selectedId = partId;
    for (const [id, refs] of this.chipMap.entries()) {
      refs.chip.classList.toggle('selected', id === partId);
    }
    if (partId && this.chipMap.has(partId)) {
      this.chipMap.get(partId).chip.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    this.renderExplanation(doc, partId);
  }

  _stepPart(delta) {
    if (!this.partsList.length) return;
    const idx = this.partsList.findIndex((p) => p.id === this.selectedId);
    let nextIdx;
    if (idx === -1) {
      nextIdx = delta > 0 ? 0 : this.partsList.length - 1;
    } else {
      nextIdx = (idx + delta + this.partsList.length) % this.partsList.length;
    }
    this.cb.onSelectPartUI(this.partsList[nextIdx].id);
  }

  renderExplanation(doc, partId) {
    if (!doc) return;
    this.infoColorBar.style.backgroundColor = doc.color || '#0f172a';
    this.infoCategory.textContent = doc.category || '';
    this.infoTitle.textContent = doc.title || '';

    const idx = this.partsList.findIndex((p) => p.id === partId);
    const pct = idx >= 0 ? ((idx + 1) / this.partsList.length) * 100 : 0;
    this.progressFill.style.width = `${pct}%`;

    this.infoBody.innerHTML = '';

    // Lead summary
    const summaryEl = this._el('p', 'info-summary');
    summaryEl.textContent = doc.summary;
    this.infoBody.appendChild(summaryEl);

    // Specs card
    if (doc.specs && doc.specs.length) {
      const specsBox = this._el('div', 'info-specs');
      for (const s of doc.specs) {
        const row = this._el('div', 'spec-row');
        const k = this._el('span', 'spec-k');
        k.textContent = s.k;
        const v = this._el('span', 'spec-v');
        v.textContent = s.v;
        row.append(k, v);
        specsBox.appendChild(row);
      }
      this.infoBody.appendChild(specsBox);
    }

    // Deep physical/circuit mechanism explanation
    if (doc.mechanism) {
      const sec = this._el('div', 'info-section');
      const heading = this._el('div', 'info-section-title');
      heading.append(this._el('span', 'info-section-dot'), document.createTextNode('物理・構造メカニズム'));
      const p = this._el('p', 'info-paragraph');
      p.textContent = doc.mechanism;
      sec.append(heading, p);
      this.infoBody.appendChild(sec);
    }

    // Engineering insight note
    if (doc.engineeringNote) {
      const note = this._el('div', 'info-note');
      note.textContent = doc.engineeringNote;
      this.infoBody.appendChild(note);
    }

    this.infoBody.scrollTop = 0;
  }

  // Zero-Text 3D Orientation Axis Gizmo synced live to CAD camera quaternion
  _setupGizmo() {
    this.gCtx = this.gizmoCanvas.getContext('2d');
    this._invQ = new THREE.Quaternion();
    this._axes = [
      { vec: new THREE.Vector3(1, 0, 0), col: '#dc2626', negCol: 'rgba(220,38,38,0.22)' },
      { vec: new THREE.Vector3(0, 1, 0), col: '#16a34a', negCol: 'rgba(22,163,74,0.22)' },
      { vec: new THREE.Vector3(0, 0, 1), col: '#2563eb', negCol: 'rgba(37,99,235,0.22)' }
    ];
  }

  updateGizmo(cameraQuaternion) {
    const ctx = this.gCtx;
    const w = this.gizmoCanvas.width;
    const h = this.gizmoCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 46;

    ctx.clearRect(0, 0, w, h);

    // Subtle circular reference ring (zero text)
    ctx.beginPath();
    ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this._invQ.copy(cameraQuaternion).invert();
    const items = [];
    for (const ax of this._axes) {
      const vPos = ax.vec.clone().applyQuaternion(this._invQ);
      items.push({ v: vPos, col: ax.col, pos: true });
      const vNeg = ax.vec.clone().negate().applyQuaternion(this._invQ);
      items.push({ v: vNeg, col: ax.negCol, pos: false });
    }
    // Depth-sort back to front
    items.sort((a, b) => a.v.z - b.v.z);

    for (const item of items) {
      const px = cx + item.v.x * r;
      const py = cy - item.v.y * r;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.strokeStyle = item.col;
      ctx.lineWidth = item.pos ? 3.2 : 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, item.pos ? 6.2 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = item.col;
      ctx.fill();
      if (item.pos) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    // Origin pivot sphere
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  }
}
