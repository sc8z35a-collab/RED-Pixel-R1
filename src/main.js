import './style.css';
import { CadEngine } from './cad/CadEngine.js';
import { SimEffects } from './cad/SimEffects.js';
import { buildMacroSensorAssembly } from './assemblies/MacroSensorAssembly.js';
import { buildMicroPixelAssembly } from './assemblies/MicroPixelAssembly.js';
import { buildLayer2TransistorAssembly } from './assemblies/Layer2TransistorAssembly.js';
import { buildLensActuatorAssembly } from './assemblies/LensActuatorAssembly.js';
import { buildCameraDecoAssembly } from './assemblies/CameraDecoAssembly.js';
import { buildPeriscopePrismAssembly } from './assemblies/PeriscopePrismAssembly.js';
import { buildApertureLensAssembly } from './assemblies/ApertureLensAssembly.js';
import {
  MACRO_PARTS,
  MICRO_PARTS,
  LAYER2_PARTS,
  LENS_PARTS,
  DECO_PARTS,
  PERISCOPE_PARTS,
  APERTURE_PARTS,
  OVERVIEW_DOCS,
  ALL_PARTS_BY_ID
} from './knowledge/sensorKnowledge.js';
import { ZeroTextUI } from './ui/ZeroTextUI.js';

const viewportEl = document.getElementById('cad-viewport');
const uiRoot = document.getElementById('ui-root');

const engine = new CadEngine(viewportEl);
const sim = new SimEffects(engine.scene);

// Pre-build all 7 multiscale modes (180 independent dissectable 3D CAD parts!)
const assemblies = {
  macro: buildMacroSensorAssembly(engine.materials),
  micro: buildMicroPixelAssembly(engine.materials),
  layer2: buildLayer2TransistorAssembly(engine.materials),
  lens: buildLensActuatorAssembly(engine.materials),
  deco: buildCameraDecoAssembly(engine.materials),
  periscope: buildPeriscopePrismAssembly(engine.materials),
  aperture: buildApertureLensAssembly(engine.materials)
};

const partDocsByScale = {
  macro: MACRO_PARTS,
  micro: MICRO_PARTS,
  layer2: LAYER2_PARTS,
  lens: LENS_PARTS,
  deco: DECO_PARTS,
  periscope: PERISCOPE_PARTS,
  aperture: APERTURE_PARTS
};

Object.values(assemblies).forEach((asm) => engine.scene.add(asm.root));

let currentScale = 'aperture';
let activeAsm = assemblies.aperture;
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
    if (scale === currentScale || !assemblies[scale]) return;
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
    const dist =
      currentScale === 'aperture'
        ? 44
        : currentScale === 'periscope'
          ? 40
          : currentScale === 'deco'
            ? 42
            : currentScale === 'lens'
              ? 38
              : currentScale === 'macro'
                ? 36
                : currentScale === 'layer2'
                  ? 32
                  : 28;
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
  activeAsm = assemblies[scale];

  Object.entries(assemblies).forEach(([k, asm]) => {
    asm.root.visible = k === scale;
  });

  engine.setGridElevation(activeAsm.gridY);
  engine.registerAssembly(activeAsm.root, activeAsm.parts);
  engine.setSectionCut(null, 0, activeAsm.clipBounds);

  sim.rebuildForMode(scale);

  ui.setScaleUI(scale);
  ui.resetClipUI();
  ui.setIsolateUI(false);
  ui.populateLayers(partDocsByScale[scale]);
  ui.syncSelection(null, OVERVIEW_DOCS[scale]);

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

// Launch directly into Phase 6 Ultra-Deep Variable Aperture & Lens Micro-Anatomy Dissection
switchScale('aperture', true);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    engine.selectPart(null);
  }
});

let prevTime = performance.now();
const startTime = prevTime;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - prevTime) / 1000);
  prevTime = now;
  const elapsed = (now - startTime) / 1000;

  currentExplode += (targetExplode - currentExplode) * Math.min(1, dt * 11);
  if (Math.abs(targetExplode - currentExplode) < 0.0005) {
    currentExplode = targetExplode;
  }

  sim.update(dt, elapsed, engine.partMap, currentExplode);
  const gridDrop =
    currentExplode *
    (currentScale === 'aperture'
      ? 9.2
      : currentScale === 'periscope'
        ? 6.4
        : currentScale === 'deco'
          ? 8.8
          : currentScale === 'lens'
            ? 7.6
            : currentScale === 'layer2'
              ? 8.0
              : currentScale === 'macro'
                ? 9.6
                : 9.4);
  engine.setGridElevation(activeAsm.gridY - gridDrop);
  engine.update(now);
}

requestAnimationFrame(animate);
