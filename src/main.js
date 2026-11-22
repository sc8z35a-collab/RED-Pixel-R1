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
import { buildIrisMicroAssembly } from './assemblies/IrisMicroAssembly.js';
import { buildIrisNanoAssembly } from './assemblies/IrisNanoAssembly.js';
import { buildLidarPhotonicsAssembly } from './assemblies/LidarPhotonicsAssembly.js';
import { buildSmaMuscleAssembly } from './assemblies/SmaMuscleAssembly.js';
import { buildLiquidLensAssembly } from './assemblies/LiquidLensAssembly.js';
import { buildTetraprismAssembly } from './assemblies/TetraprismAssembly.js';
import { buildContinuousZoomAssembly } from './assemblies/ContinuousZoomAssembly.js';
import { buildMetalensAssembly } from './assemblies/MetalensAssembly.js';
import { buildGlobalShutterAssembly } from './assemblies/GlobalShutterAssembly.js';
import { buildFlagshipSmartphoneAssembly } from './assemblies/FlagshipSmartphoneAssembly.js';
import { buildSocGaaAssembly } from './assemblies/SocGaaAssembly.js';
import { buildOledTandemAssembly } from './assemblies/OledTandemAssembly.js';
import { buildVaporChamberAssembly } from './assemblies/VaporChamberAssembly.js';
import {
  MACRO_PARTS,
  MICRO_PARTS,
  LAYER2_PARTS,
  LENS_PARTS,
  DECO_PARTS,
  PERISCOPE_PARTS,
  APERTURE_PARTS,
  IRIS_MICRO_PARTS,
  IRIS_NANO_PARTS,
  LIDAR_PARTS,
  SMA_PARTS,
  LIQUID_PARTS,
  TETRAPRISM_PARTS,
  CONTINUOUS_ZOOM_PARTS,
  METALENS_PARTS,
  GLOBAL_SHUTTER_PARTS,
  FLAGSHIP_PHONE_PARTS,
  SOC_GAA_PARTS,
  OLED_TANDEM_PARTS,
  VAPOR_CHAMBER_PARTS,
  OVERVIEW_DOCS,
  ALL_PARTS_BY_ID
} from './knowledge/sensorKnowledge.js';
import { ZeroTextUI } from './ui/ZeroTextUI.js';

const viewportEl = document.getElementById('cad-viewport');
const uiRoot = document.getElementById('ui-root');

const engine = new CadEngine(viewportEl);
const sim = new SimEffects(engine.scene);

// Pre-build all 20 multiscale modes (EXACTLY 600 independent dissectable 3D CAD parts!!)
const assemblies = {
  macro: buildMacroSensorAssembly(engine.materials),
  micro: buildMicroPixelAssembly(engine.materials),
  layer2: buildLayer2TransistorAssembly(engine.materials),
  lens: buildLensActuatorAssembly(engine.materials),
  deco: buildCameraDecoAssembly(engine.materials),
  periscope: buildPeriscopePrismAssembly(engine.materials),
  aperture: buildApertureLensAssembly(engine.materials),
  iris: buildIrisMicroAssembly(engine.materials),
  iris_nano: buildIrisNanoAssembly(engine.materials),
  lidar: buildLidarPhotonicsAssembly(engine.materials),
  sma: buildSmaMuscleAssembly(engine.materials),
  liquid: buildLiquidLensAssembly(engine.materials),
  tetra: buildTetraprismAssembly(engine.materials),
  zoom: buildContinuousZoomAssembly(engine.materials),
  metalens: buildMetalensAssembly(engine.materials),
  gshutter: buildGlobalShutterAssembly(engine.materials),
  soc_gaa: buildSocGaaAssembly(engine.materials),
  oled_tandem: buildOledTandemAssembly(engine.materials),
  vapor_chamber: buildVaporChamberAssembly(engine.materials),
  flagship: buildFlagshipSmartphoneAssembly(engine.materials)
};

const partDocsByScale = {
  macro: MACRO_PARTS,
  micro: MICRO_PARTS,
  layer2: LAYER2_PARTS,
  lens: LENS_PARTS,
  deco: DECO_PARTS,
  periscope: PERISCOPE_PARTS,
  aperture: APERTURE_PARTS,
  iris: IRIS_MICRO_PARTS,
  iris_nano: IRIS_NANO_PARTS,
  lidar: LIDAR_PARTS,
  sma: SMA_PARTS,
  liquid: LIQUID_PARTS,
  tetra: TETRAPRISM_PARTS,
  zoom: CONTINUOUS_ZOOM_PARTS,
  metalens: METALENS_PARTS,
  gshutter: GLOBAL_SHUTTER_PARTS,
  soc_gaa: SOC_GAA_PARTS,
  oled_tandem: OLED_TANDEM_PARTS,
  vapor_chamber: VAPOR_CHAMBER_PARTS,
  flagship: FLAGSHIP_PHONE_PARTS
};

Object.values(assemblies).forEach((asm) => engine.scene.add(asm.root));

let currentScale = 'flagship';
let activeAsm = assemblies.flagship;
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
      currentScale === 'flagship'
        ? 40
        : currentScale === 'soc_gaa' || currentScale === 'oled_tandem' || currentScale === 'vapor_chamber'
          ? 38
          : currentScale === 'gshutter' || currentScale === 'metalens'
            ? 45
          : currentScale === 'zoom'
            ? 45
            : currentScale === 'tetra'
              ? 44
              : currentScale === 'liquid'
                ? 42
                : currentScale === 'sma'
                  ? 42
                  : currentScale === 'lidar'
                    ? 40
                    : currentScale === 'iris_nano'
                      ? 34
                      : currentScale === 'iris'
                        ? 44
                        : currentScale === 'aperture'
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
    ui.setPeelCountUI(engine.getPeelCount());
  },
  onToggleIsolate() {
    const active = engine.toggleIsolateSelected();
    ui.setIsolateUI(active);
    ui.setGhostUI(engine.ghostMode);
    ui.setPeelCountUI(engine.getPeelCount());
    ui.syncVisibility(getHiddenIds());
  },
  onToggleGhost() {
    const active = engine.toggleGhostSurroundings();
    ui.setGhostUI(active);
    ui.setIsolateUI(Boolean(engine.isolatedId));
    ui.setPeelCountUI(engine.getPeelCount());
    ui.syncVisibility(getHiddenIds());
  },
  onPeelLayer() {
    const orderedIds = partDocsByScale[currentScale].map((p) => p.id);
    engine.peelNextPart(orderedIds);
    ui.setIsolateUI(Boolean(engine.isolatedId));
    ui.setPeelCountUI(engine.getPeelCount());
    ui.syncVisibility(getHiddenIds());
    ui.setInfoOpen(true);
  },
  onUnpeelLayer() {
    engine.unpeelLastPart();
    ui.setIsolateUI(Boolean(engine.isolatedId));
    ui.setPeelCountUI(engine.getPeelCount());
    ui.syncVisibility(getHiddenIds());
  },
  onShowAll() {
    engine.showAllParts();
    ui.setIsolateUI(false);
    ui.setPeelCountUI(0);
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
  ui.setGhostUI(false);
  ui.setPeelCountUI(0);
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

// Launch directly into the Complete Integrated Flagship Smartphone RED-Pixel R1 (All 20 Scales / 600 Parts Unified!)
switchScale('flagship', true);

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
    (currentScale === 'flagship'
      ? 6.8
      : currentScale === 'soc_gaa' || currentScale === 'oled_tandem' || currentScale === 'vapor_chamber'
        ? 6.2
        : currentScale === 'gshutter' || currentScale === 'metalens'
          ? 6.4
        : currentScale === 'zoom'
          ? 6.4
          : currentScale === 'tetra'
            ? 6.4
            : currentScale === 'liquid'
              ? 6.2
            : currentScale === 'sma'
              ? 6.0
              : currentScale === 'lidar'
                ? 6.4
                : currentScale === 'iris_nano'
                  ? 5.0
                  : currentScale === 'iris'
                    ? 6.8
                    : currentScale === 'aperture'
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
