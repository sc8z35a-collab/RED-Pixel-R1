import './style.css';
import * as THREE from 'three';
import { CadEngine } from './cad/CadEngine.js';
import { SimEffects } from './cad/SimEffects.js';
import { buildMacroSensorAssembly } from './assemblies/MacroSensorAssembly.js';
import { buildMicroPixelAssembly } from './assemblies/MicroPixelAssembly.js';
import { MACRO_PARTS, MICRO_PARTS, OVERVIEW_DOCS, ALL_PARTS_BY_ID } from './knowledge/sensorKnowledge.js';
import { ZeroTextUI } from './ui/ZeroTextUI.js';

const viewportEl = document.getElementById('cad-viewport');
const uiRoot = document.getElementById('ui-root');

const engine = new CadEngine(viewportEl);
const sim = new SimEffects(engine.scene);

// Pre-build both scales for instant zero-lag Macro <-> Micro transition
const macroAsm = buildMacroSensorAssembly(engine.materials);
const microAsm = buildMicroPixelAssembly(engine.materials);
engine.scene.add(macroAsm.root);
engine.scene.add(microAsm.root);

let currentScale = 'macro';
let activeAsm = macroAsm;
let targetExplode = 0;
let currentExplode = 0;

function getHiddenIds() {
  const arr = [];
  for (const [id, entry] of engine.partMap.entries()) {
    if (entry.hidden) arr.push(id);
  }
  return arr;
}

const ui = new ZeroTextUI(uiRoot, {
  onSwitchScale(scale) {
    if (scale === currentScale) return;
    switchScale(scale);
  },
  onExplodeChange(val) {
    targetExplode = val;
  },
  onClipChange(axis, normVal) {
    engine.setSectionCut(axis, normVal, activeAsm.clipBounds);
  },
  onShadingChange(mode) {
    engine.setShadingMode(mode);
  },
  onProjectionToggle(isOrtho) {
    engine.setProjection(isOrtho);
  },
  onOpticsToggle(enabled) {
    sim.setOpticsVisible(enabled);
  },
  onOisToggle(enabled) {
    sim.setOisActive(enabled);
  },
  onResetView() {
    engine.animateCameraTo(activeAsm.defaultCameraPos, activeAsm.defaultTarget, 520);
  },
  onSnapView(preset) {
    const dist = currentScale === 'macro' ? 35 : 28;
    engine.snapView(preset, dist, activeAsm.defaultTarget);
  },
  onSelectPartUI(partId) {
    engine.selectPart(partId, true);
    ui.setInfoOpen(true);
  },
  onHoverPartUI(partId) {
    engine.hoverPartFromUI(partId);
  },
  onTogglePartVis(partId) {
    engine.togglePartVisibility(partId);
    ui.syncVisibility(getHiddenIds());
    ui.setIsolateUI(Boolean(engine.isolatedId));
  },
  onToggleIsolate() {
    const active = engine.toggleIsolateSelected();
    ui.setIsolateUI(active);
    ui.syncVisibility(getHiddenIds());
  },
  onShowAll() {
    engine.showAllParts();
    ui.setIsolateUI(false);
    ui.syncVisibility([]);
  },
  onFocusPart(partId) {
    engine.focusOnPart(partId);
  }
});

// Sync 3D viewport interactions back to UI & Explanation panel
engine.onPartSelect = (partId) => {
  const doc = partId ? ALL_PARTS_BY_ID[partId] : OVERVIEW_DOCS[currentScale];
  ui.syncSelection(partId, doc);
  if (partId) ui.setInfoOpen(true);
};

engine.onCameraSync = (quat) => {
  ui.updateGizmo(quat);
};

function switchScale(scale, instantCamera = false) {
  currentScale = scale;
  activeAsm = scale === 'macro' ? macroAsm : microAsm;

  macroAsm.root.visible = scale === 'macro';
  microAsm.root.visible = scale === 'micro';

  engine.setGridElevation(activeAsm.gridY);
  engine.registerAssembly(activeAsm.root, activeAsm.parts);
  engine.setSectionCut(null, 0, activeAsm.clipBounds);

  sim.rebuildForMode(scale);

  ui.setScaleUI(scale);
  ui.resetClipUI();
  ui.setIsolateUI(false);
  ui.populateLayers(scale === 'macro' ? MACRO_PARTS : MICRO_PARTS);
  ui.syncSelection(null, OVERVIEW_DOCS[scale]);

  // Smoothly reset explode to subtle view or keep crisp assembled state
  targetExplode = 0;
  currentExplode = 0;
  ui.setExplodeUI(0, false);

  if (instantCamera) {
    engine.camera.position.copy(activeAsm.defaultCameraPos);
    engine.controls.target.copy(activeAsm.defaultTarget);
    engine.controls.update();
  } else {
    engine.animateCameraTo(activeAsm.defaultCameraPos, activeAsm.defaultTarget, 620);
  }
}

// Initialize into Macro 1-inch Sensor Assembly
switchScale('macro', true);

// Keyboard ergonomics (no UI text shown)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    engine.selectPart(null);
  }
});

// Main 60fps CAD Render & Physics Loop
let prevTime = performance.now();
const startTime = prevTime;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - prevTime) / 1000);
  prevTime = now;
  const elapsed = (now - startTime) / 1000;

  // Smooth exponential damping on explode slider
  currentExplode += (targetExplode - currentExplode) * Math.min(1, dt * 11);
  if (Math.abs(targetExplode - currentExplode) < 0.0005) {
    currentExplode = targetExplode;
  }

  sim.update(dt, elapsed, engine.partMap, currentExplode);
  const gridDrop = currentExplode * (currentScale === 'macro' ? 9.6 : 9.4);
  engine.setGridElevation(activeAsm.gridY - gridDrop);
  engine.update(now);
}

requestAnimationFrame(animate);
