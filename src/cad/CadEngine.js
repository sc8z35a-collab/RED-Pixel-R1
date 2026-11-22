import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWhiteStudioEnv, createMaterialLibrary } from './Materials.js';

export class CadEngine {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    // Scene with pure CAD white background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // WebGL2 High-Precision Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // White Studio Environment Reflections
    this.scene.environment = createWhiteStudioEnv(this.renderer);
    this.scene.environmentIntensity = 0.92;

    // Dual Cameras (Perspective & Orthographic CAD views)
    this.aspect = this.width / this.height;
    this.baseFov = 34;
    const initialFov = this._computeResponsiveFov(this.aspect);
    this.perspCamera = new THREE.PerspectiveCamera(initialFov, this.aspect, 0.05, 500);
    this.perspCamera.position.set(24, 19, 25);

    this.orthoFrustum = 26;
    this.orthoCamera = new THREE.OrthographicCamera(
      (-this.orthoFrustum * this.aspect) / 2,
      (this.orthoFrustum * this.aspect) / 2,
      this.orthoFrustum / 2,
      -this.orthoFrustum / 2,
      0.05,
      500
    );
    this.orthoCamera.position.copy(this.perspCamera.position);

    this.isOrtho = false;
    this.camera = this.perspCamera;

    // Smooth CAD OrbitControls (tuned for both mouse and mobile multi-touch!)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 1.1;
    this.controls.panSpeed = 0.85;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 140;
    this.controls.target.set(0, 1.0, 0);

    // Three-axis real-time section clipping planes (inactive initially)
    this.clipPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100);
    this.clipPlaneY = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    this.clipPlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), 100);
    this.clippingPlanes = [this.clipPlaneX, this.clipPlaneY, this.clipPlaneZ];
    this.activeClipAxis = null; // 'x' | 'y' | 'z' | null
    this.clipValue = 1.0;

    // Shared PBR Material Library
    this.materials = createMaterialLibrary(this.clippingPlanes);

    // CAD Lighting & White Studio Floor + Grid
    this._setupLighting();
    this._setupCadGrid();
    this._setupSectionVisualPlane();

    // State for selection, hover, shading, camera tweening
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();
    this.pickableRoots = [];
    this.partMap = new Map(); // partId -> { group, basePos, explodeVec, hidden, ... }
    this.hoveredId = null;
    this.selectedId = null;
    this.shadingMode = 'solid'; // 'solid' | 'cad' | 'xray' | 'wire'
    this.isolatedId = null;
    this.ghostMode = false;
    this.peelStack = [];

    this.cameraTween = null;
    this.edgeLines = [];
    this.selectionOutlineGroup = new THREE.Group();
    this.scene.add(this.selectionOutlineGroup);

    // 3D Click/Selection Holographic Shockwave Burst Group
    this.burstGroup = new THREE.Group();
    this.scene.add(this.burstGroup);
    this.burstRings = [];
    this.cinemaAngle = 0;

    // Callbacks
    this.onPartSelect = null;
    this.onPartHover = null;
    this.onCameraSync = null;
    this.onUserCameraInteract = null;

    // Events
    this._bindEvents();
  }

  _setupLighting() {
    // High-key crisp white CAD studio lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.05);
    hemi.position.set(0, 40, 0);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(22, 34, 24);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 5;
    key.shadow.camera.far = 90;
    const d = 24;
    key.shadow.camera.left = -d;
    key.shadow.camera.right = d;
    key.shadow.camera.top = d;
    key.shadow.camera.bottom = -d;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xeef6ff, 0.7);
    fill.position.set(-24, 18, -16);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff7ed, 0.55);
    rim.position.set(-10, 14, 24);
    this.scene.add(rim);

    // Subtle soft shadow catcher on white studio floor
    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.ShadowMaterial({ opacity: 0.085, color: 0x0f172a })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -4.2;
    shadowFloor.receiveShadow = true;
    this.shadowFloor = shadowFloor;
    this.scene.add(shadowFloor);
  }

  _setupCadGrid() {
    this.gridGroup = new THREE.Group();
    this.gridGroup.position.y = -4.18;

    // Fine engineering minor grid (light neutral gray on pure white)
    const minor = new THREE.GridHelper(64, 64, 0xdbe3ec, 0xeef2f7);
    minor.material.transparent = true;
    minor.material.opacity = 0.85;
    this.gridGroup.add(minor);

    // Major CAD millimeter reference lines
    const major = new THREE.GridHelper(64, 16, 0xcbd5e1, 0xdbe3ec);
    major.position.y = 0.005;
    major.material.transparent = true;
    major.material.opacity = 0.9;
    this.gridGroup.add(major);

    // Subtle origin crosshair (zero text)
    const axisXMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
    const axisZMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 });
    const gx = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-32, 0.01, 0), new THREE.Vector3(32, 0.01, 0)]);
    const gz = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, -32), new THREE.Vector3(0, 0.01, 32)]);
    this.gridGroup.add(new THREE.Line(gx, axisXMat));
    this.gridGroup.add(new THREE.Line(gz, axisZMat));

    this.scene.add(this.gridGroup);
  }

  _setupSectionVisualPlane() {
    // Visual translucent CAD cutting plane indicator (no text)
    const geom = new THREE.PlaneGeometry(34, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.sectionHelper = new THREE.Mesh(geom, mat);
    const borderGeom = new THREE.EdgesGeometry(geom);
    this.sectionBorder = new THREE.LineSegments(
      borderGeom,
      new THREE.LineBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.45 })
    );
    this.sectionHelper.add(this.sectionBorder);
    this.sectionHelper.visible = false;
    this.scene.add(this.sectionHelper);
  }

  _computeResponsiveFov(aspect) {
    if (aspect >= 1.0) return this.baseFov;
    const baseRad = THREE.MathUtils.degToRad(this.baseFov);
    const boosted = 2 * Math.atan(Math.tan(baseRad * 0.5) / Math.max(aspect, 0.56));
    return Math.min(54, THREE.MathUtils.radToDeg(boosted));
  }

  getResponsiveView(basePos, baseTarget) {
    const pos = basePos.clone();
    const target = baseTarget.clone();
    const isCompact = this.width <= 900 || this.height <= 520;
    if (isCompact) {
      // On mobile/compact screens, info panel starts collapsed -> center model horizontally!
      const shiftX = target.x * 0.85;
      target.x -= shiftX;
      pos.x -= shiftX;
      if (this.aspect < 1.0) {
        // Pull back smoothly in portrait so wide multi-zone/smartphone models frame edge-to-edge!
        const pull = THREE.MathUtils.clamp(0.70 / Math.max(this.aspect, 0.42), 1.08, 1.46);
        const offset = pos.clone().sub(target).multiplyScalar(pull);
        pos.copy(target).add(offset);
      }
    }
    return { pos, target };
  }

  _bindEvents() {
    const onViewportChange = () => this.resize();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 120));
    document.addEventListener('fullscreenchange', onViewportChange);
    document.addEventListener('webkitfullscreenchange', onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
    }

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.cameraTween = null;
      if (this.onUserCameraInteract) this.onUserCameraInteract();
    });
    dom.addEventListener('wheel', () => {
      this.cameraTween = null;
      if (this.onUserCameraInteract) this.onUserCameraInteract();
    }, { passive: true });

    dom.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this._updateHover();
    });

    dom.addEventListener('pointerup', (e) => {
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      const tapSlop = e.pointerType === 'touch' ? 9 : 5;
      if (Math.hypot(dx, dy) < tapSlop) {
        const rect = dom.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const hitId = this._raycastPart();
        this.selectPart(hitId);
      }
    });
  }

  resize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.aspect = this.width / Math.max(1, this.height);

    this.perspCamera.fov = this._computeResponsiveFov(this.aspect);
    this.perspCamera.aspect = this.aspect;
    this.perspCamera.updateProjectionMatrix();

    this.orthoCamera.left = (-this.orthoFrustum * this.aspect) / 2;
    this.orthoCamera.right = (this.orthoFrustum * this.aspect) / 2;
    this.orthoCamera.top = this.orthoFrustum / 2;
    this.orthoCamera.bottom = -this.orthoFrustum / 2;
    this.orthoCamera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  setGridElevation(y) {
    this.shadowFloor.position.y = y - 0.02;
    this.gridGroup.position.y = y;
  }

  registerAssembly(rootGroup, partsList) {
    // Clear previous edge lines & selection visuals
    this._clearSelectionHighlight();
    this.partMap.clear();
    this.pickableRoots = [rootGroup];
    this.edgeLines = [];

    for (const p of partsList) {
      p.group.userData.partId = p.id;
      p.group.traverse((obj) => {
        if (obj.isMesh) {
          obj.userData.partId = p.id;
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (!obj.userData.origMaterial) {
            obj.userData.origMaterial = obj.material;
          }
          // Pre-create crisp CAD edge overlay for technical CAD view
          if (!obj.isInstancedMesh && obj.geometry && obj.geometry.attributes.position && obj.geometry.attributes.position.count < 8000) {
            const edges = new THREE.EdgesGeometry(obj.geometry, 26);
            const line = new THREE.LineSegments(
              edges,
              new THREE.LineBasicMaterial({
                color: 0x0f172a,
                transparent: true,
                opacity: 0.34,
                clippingPlanes: this.clippingPlanes
              })
            );
            line.visible = false;
            line.userData.isCadEdge = true;
            obj.add(line);
            this.edgeLines.push(line);
          }
        }
      });

      if (!p.group.userData.origPos) {
        p.group.userData.origPos = p.group.position.clone();
      } else {
        p.group.position.copy(p.group.userData.origPos);
        p.group.rotation.set(0, 0, 0);
      }

      this.partMap.set(p.id, {
        ...p,
        basePos: p.group.userData.origPos.clone(),
        hidden: false
      });
    }

    this.isolatedId = null;
    this.ghostMode = false;
    this.peelStack = [];
    this.selectedId = null;
    this.hoveredId = null;
    this.setShadingMode(this.shadingMode);
  }

  _raycastPart() {
    if (!this.pickableRoots.length) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickableRoots, true);
    for (const hit of hits) {
      const obj = hit.object;
      if (!obj.isMesh || !obj.visible || obj.userData.ignorePick) continue;
      // Respect active clipping plane so clipped-away faces don't intercept clicks
      if (this.activeClipAxis) {
        const pt = hit.point;
        if (this.activeClipAxis === 'x' && this.clipPlaneX.distanceToPoint(pt) < -0.01) continue;
        if (this.activeClipAxis === 'y' && this.clipPlaneY.distanceToPoint(pt) < -0.01) continue;
        if (this.activeClipAxis === 'z' && this.clipPlaneZ.distanceToPoint(pt) < -0.01) continue;
      }
      const partId = obj.userData.partId;
      if (partId && this.partMap.has(partId)) {
        const entry = this.partMap.get(partId);
        if (!entry.hidden && entry.group.visible) {
          return partId;
        }
      }
    }
    return null;
  }

  _updateHover() {
    const id = this._raycastPart();
    if (id !== this.hoveredId) {
      this.hoveredId = id;
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      this._refreshHighlightAppearance();
      if (this.onPartHover) this.onPartHover(id);
    }
  }

  selectPart(partId, focusCamera = false) {
    this.selectedId = partId && this.partMap.has(partId) ? partId : null;
    if (this.ghostMode) {
      this._applyMaterialStates();
    } else {
      this._refreshHighlightAppearance();
    }
    if (this.selectedId) {
      this.triggerSelectionBurst(this.selectedId);
    }
    if (focusCamera && this.selectedId) {
      this.focusOnPart(this.selectedId);
    }
    if (this.onPartSelect) this.onPartSelect(this.selectedId);
  }

  triggerSelectionBurst(partId) {
    const entry = this.partMap.get(partId);
    if (!entry) return;
    const box = new THREE.Box3().setFromObject(entry.group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const baseR = Math.max(size.length() * 0.28, 0.9);
    const now = performance.now();

    for (let i = 0; i < 2; i++) {
      const geo = new THREE.RingGeometry(0.80, 1.0, 40);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x2563eb : 0x06b6d4,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);
      mesh.position.y += i * 0.08;
      mesh.scale.setScalar(baseR * 0.35);
      mesh.userData.ignorePick = true;
      this.burstGroup.add(mesh);
      this.burstRings.push({
        mesh,
        mat,
        geo,
        startTime: now + i * 95,
        duration: 560,
        startR: baseR * 0.35,
        endR: baseR * (1.55 + i * 0.35)
      });
    }
  }

  hoverPartFromUI(partId) {
    this.hoveredId = partId;
    this._refreshHighlightAppearance();
  }

  _clearSelectionHighlight() {
    while (this.selectionOutlineGroup.children.length) {
      const child = this.selectionOutlineGroup.children[0];
      this.selectionOutlineGroup.remove(child);
    }
  }

  _refreshHighlightAppearance() {
    const ghostActive = this.ghostMode && Boolean(this.selectedId);

    for (const [id, entry] of this.partMap.entries()) {
      const isSelected = id === this.selectedId;
      const isHovered = id === this.hoveredId;
      const isGhost = ghostActive && !isSelected;

      entry.group.traverse((obj) => {
        if (!obj.isMesh || obj.userData.ignorePick) return;
        const mat = obj.material;
        if (!mat || !mat.isMaterial) return;

        // Subtle emissive highlight on selected / hovered CAD part (with cached per-mesh highlight clone)
        if ('emissive' in mat) {
          if (obj.userData.baseEmissiveHex === undefined) {
            obj.userData.baseEmissiveHex = mat.emissive.getHex();
            obj.userData.baseEmissiveInt = mat.emissiveIntensity ?? 0;
          }

          if ((isSelected || isHovered) && !obj.userData.clonedForHighlight) {
            if (!obj.userData.solidHighlightMat) {
              obj.userData.solidHighlightMat = obj.userData.origMaterial.clone();
            }
            obj.material = obj.userData.solidHighlightMat;
            obj.userData.clonedForHighlight = true;
          }

          const activeMat = obj.material;
          if (isSelected) {
            activeMat.emissive.setHex(0x2563eb);
            activeMat.emissiveIntensity = ghostActive ? 0.16 : 0.24;
          } else if (isHovered && !isGhost) {
            activeMat.emissive.setHex(0x0ea5e9);
            activeMat.emissiveIntensity = 0.14;
          } else if (isHovered && isGhost) {
            activeMat.emissive.setHex(0x0ea5e9);
            activeMat.emissiveIntensity = 0.08;
          } else if (obj.userData.clonedForHighlight) {
            activeMat.emissive.setHex(obj.userData.baseEmissiveHex);
            activeMat.emissiveIntensity = obj.userData.baseEmissiveInt;
          }
        }
      });
    }
  }

  setPartHidden(partId, hidden) {
    const entry = this.partMap.get(partId);
    if (!entry) return;
    entry.hidden = hidden;
    entry.group.visible = !hidden;
    if (hidden && this.selectedId === partId) {
      this.selectPart(null);
    }
  }

  togglePartVisibility(partId) {
    const entry = this.partMap.get(partId);
    if (!entry) return false;
    const next = !entry.hidden;
    this.setPartHidden(partId, next);
    if (this.isolatedId === partId && next) {
      this.isolatedId = null;
    }
    if (!next) {
      this.peelStack = this.peelStack.filter((pid) => pid !== partId);
    }
    return next;
  }

  toggleIsolateSelected() {
    if (!this.selectedId) return false;
    if (this.isolatedId === this.selectedId) {
      // Restore all
      this.showAllParts();
      return false;
    }
    this.ghostMode = false;
    this.peelStack = [];
    this.isolatedId = this.selectedId;
    for (const [id, entry] of this.partMap.entries()) {
      const keep = id === this.selectedId;
      entry.hidden = !keep;
      entry.group.visible = keep;
    }
    this._applyMaterialStates();
    this.focusOnPart(this.selectedId);
    return true;
  }

  toggleGhostSurroundings() {
    this.ghostMode = !this.ghostMode;
    if (this.ghostMode && this.isolatedId) {
      // Restore hidden surroundings so they appear as translucent CAD ghost glass
      this.isolatedId = null;
      this.peelStack = [];
      for (const entry of this.partMap.values()) {
        entry.hidden = false;
        entry.group.visible = true;
      }
    }
    this._applyMaterialStates();
    if (this.ghostMode && this.selectedId) {
      this.focusOnPart(this.selectedId);
    }
    return this.ghostMode;
  }

  peelNextPart(orderedIds) {
    if (!orderedIds || !orderedIds.length) return null;
    // Keep at least 1 innermost part visible
    let visibleCount = 0;
    for (const entry of this.partMap.values()) {
      if (!entry.hidden) visibleCount++;
    }
    if (visibleCount <= 1) return null;

    // Peel the outermost currently visible part (top-to-bottom order)
    let peeledId = null;
    for (const id of orderedIds) {
      const entry = this.partMap.get(id);
      if (entry && !entry.hidden) {
        peeledId = id;
        break;
      }
    }
    if (!peeledId) return null;

    this.isolatedId = null;
    const peeledEntry = this.partMap.get(peeledId);
    peeledEntry.hidden = true;
    peeledEntry.group.visible = false;
    this.peelStack.push(peeledId);

    // Automatically select the next freshly uncovered layer so the explanation panel updates live
    const nextExposed = orderedIds.find((id) => {
      const e = this.partMap.get(id);
      return e && !e.hidden;
    });
    this.selectPart(nextExposed || null, false);
    return peeledId;
  }

  unpeelLastPart() {
    while (this.peelStack.length) {
      const id = this.peelStack.pop();
      const entry = this.partMap.get(id);
      if (entry && entry.hidden) {
        entry.hidden = false;
        entry.group.visible = true;
        this.selectPart(id, false);
        return id;
      }
    }
    return null;
  }

  getPeelCount() {
    return this.peelStack.length;
  }

  showAllParts() {
    this.isolatedId = null;
    this.peelStack = [];
    for (const entry of this.partMap.values()) {
      entry.hidden = false;
      entry.group.visible = true;
    }
    this._applyMaterialStates();
  }

  setShadingMode(mode) {
    this.shadingMode = mode;
    this._applyMaterialStates();
  }

  _applyMaterialStates() {
    const mode = this.shadingMode;
    const ghostActive = this.ghostMode && Boolean(this.selectedId);

    for (const line of this.edgeLines) {
      if (mode !== 'cad') {
        line.visible = false;
      } else if (ghostActive) {
        line.visible = line.parent?.userData?.partId === this.selectedId;
      } else {
        line.visible = true;
      }
    }

    for (const [id, entry] of this.partMap.entries()) {
      const isSelected = id === this.selectedId;
      const isGhost = ghostActive && !isSelected;
      const forceSolid = ghostActive && isSelected;

      entry.group.traverse((obj) => {
        if (!obj.isMesh || obj.userData.ignorePick) return;
        const orig = obj.userData.origMaterial;
        if (!orig) return;

        if (isGhost) {
          if (!obj.userData.ghostMat) {
            const gm = orig.clone();
            gm.transparent = true;
            gm.opacity = Math.min(orig.opacity ?? 1.0, 0.13);
            gm.depthWrite = false;
            gm.wireframe = false;
            gm.clippingPlanes = this.clippingPlanes;
            if ('emissive' in gm) {
              gm.emissive.setHex(0x000000);
              gm.emissiveIntensity = 0;
            }
            obj.userData.ghostMat = gm;
          }
          obj.material = obj.userData.ghostMat;
          obj.castShadow = false;
          obj.userData.clonedForHighlight = true;
        } else if (forceSolid) {
          obj.material = orig;
          obj.castShadow = true;
          obj.userData.clonedForHighlight = false;
        } else if (mode === 'xray') {
          if (!obj.userData.xrayMat) {
            const xm = orig.clone();
            xm.transparent = true;
            xm.opacity = Math.min(orig.opacity ?? 1.0, 0.24);
            xm.depthWrite = false;
            xm.wireframe = false;
            xm.clippingPlanes = this.clippingPlanes;
            obj.userData.xrayMat = xm;
          }
          obj.material = obj.userData.xrayMat;
          obj.castShadow = false;
          obj.userData.clonedForHighlight = true;
        } else if (mode === 'wire') {
          if (!obj.userData.wireMat) {
            const wm = new THREE.MeshBasicMaterial({
              color: orig.color ? orig.color.clone().multiplyScalar(0.75) : 0x1e293b,
              wireframe: true,
              transparent: true,
              opacity: 0.72,
              clippingPlanes: this.clippingPlanes
            });
            obj.userData.wireMat = wm;
          }
          obj.material = obj.userData.wireMat;
          obj.castShadow = false;
          obj.userData.clonedForHighlight = true;
        } else {
          // 'solid' or 'cad'
          obj.material = orig;
          obj.castShadow = true;
          obj.userData.clonedForHighlight = false;
        }
      });
    }
    this._refreshHighlightAppearance();
  }

  setProjection(isOrtho) {
    if (this.isOrtho === isOrtho) return;
    const prevCam = this.camera;
    const pos = prevCam.position.clone();
    const target = this.controls.target.clone();
    const dist = pos.distanceTo(target);

    this.isOrtho = isOrtho;
    if (isOrtho) {
      const fovRad = THREE.MathUtils.degToRad(this.perspCamera.fov);
      this.orthoFrustum = 2 * dist * Math.tan(fovRad / 2);
      this.orthoCamera.left = (-this.orthoFrustum * this.aspect) / 2;
      this.orthoCamera.right = (this.orthoFrustum * this.aspect) / 2;
      this.orthoCamera.top = this.orthoFrustum / 2;
      this.orthoCamera.bottom = -this.orthoFrustum / 2;
      this.orthoCamera.zoom = 1;
      this.orthoCamera.position.copy(pos);
      this.orthoCamera.lookAt(target);
      this.orthoCamera.updateProjectionMatrix();
      this.camera = this.orthoCamera;
    } else {
      const effectiveFrustum = this.orthoFrustum / this.orthoCamera.zoom;
      const fovRad = THREE.MathUtils.degToRad(this.perspCamera.fov);
      const newDist = effectiveFrustum / (2 * Math.tan(fovRad / 2));
      const dir = pos.clone().sub(target).normalize();
      this.perspCamera.position.copy(target).addScaledVector(dir, newDist);
      this.perspCamera.lookAt(target);
      this.perspCamera.updateProjectionMatrix();
      this.camera = this.perspCamera;
    }

    this.controls.object = this.camera;
    this.controls.target.copy(target);
    this.controls.update();
  }

  setSectionCut(axis, normalizedVal, bounds = { x: 16, y: 12, z: 16 }) {
    this.activeClipAxis = axis;
    this.clipValue = normalizedVal;

    // Reset all planes first
    this.clipPlaneX.constant = 200;
    this.clipPlaneY.constant = 200;
    this.clipPlaneZ.constant = 200;

    if (!axis) {
      this.sectionHelper.visible = false;
      return;
    }

    // normalizedVal in [-1, 1]
    this.sectionHelper.visible = true;
    this.sectionHelper.rotation.set(0, 0, 0);
    this.sectionHelper.position.set(0, 0, 0);

    if (axis === 'x') {
      const pos = normalizedVal * bounds.x;
      this.clipPlaneX.constant = pos;
      this.sectionHelper.rotation.y = Math.PI / 2;
      this.sectionHelper.position.set(pos, bounds.y * 0.2, 0);
      this.sectionHelper.material.color.setHex(0xdc2626);
      this.sectionBorder.material.color.setHex(0xdc2626);
    } else if (axis === 'y') {
      const pos = normalizedVal * bounds.y + bounds.y * 0.15;
      this.clipPlaneY.constant = pos;
      this.sectionHelper.rotation.x = Math.PI / 2;
      this.sectionHelper.position.set(0, pos, 0);
      this.sectionHelper.material.color.setHex(0x16a34a);
      this.sectionBorder.material.color.setHex(0x16a34a);
    } else if (axis === 'z') {
      const pos = normalizedVal * bounds.z;
      this.clipPlaneZ.constant = pos;
      this.sectionHelper.position.set(0, bounds.y * 0.2, pos);
      this.sectionHelper.material.color.setHex(0x2563eb);
      this.sectionBorder.material.color.setHex(0x2563eb);
    }
  }

  animateCameraTo(position, target, duration = 640, arcLift = 0.0) {
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: position.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: target.clone(),
      startTime: performance.now(),
      duration,
      arcLift
    };
  }

  startCinematicIntro(finalPos, finalTarget, duration = 1220) {
    // Begin slightly wider, higher & swept +18° azimuth for a dramatic Apple-Keynote crane dolly-in!
    const offset = finalPos.clone().sub(finalTarget);
    const cosA = Math.cos(0.32);
    const sinA = Math.sin(0.32);
    const rx = offset.x * cosA - offset.z * sinA;
    const rz = offset.x * sinA + offset.z * cosA;
    const startPos = new THREE.Vector3(
      finalTarget.x + rx * 1.24,
      finalTarget.y + offset.y * 1.18 + 2.4,
      finalTarget.z + rz * 1.24
    );
    this.camera.position.copy(startPos);
    this.controls.target.copy(finalTarget);
    this.controls.update();
    this.animateCameraTo(finalPos, finalTarget, duration, 1.35);
  }

  initCinematicOrbitFromCurrent(target) {
    const off = this.camera.position.clone().sub(target);
    this.cinemaAngle = Math.atan2(off.x, off.z);
    this._cinemaBaseRadius = Math.hypot(off.x, off.z);
    this._cinemaBaseY = off.y;
  }

  updateCinematicOrbit(dt, elapsed, target) {
    this.cameraTween = null;
    this.cinemaAngle += dt * 0.30;
    const r = (this._cinemaBaseRadius || 28) * (1.0 + 0.065 * Math.sin(elapsed * 0.55));
    const y = (this._cinemaBaseY || 18) * (1.0 + 0.14 * Math.sin(elapsed * 0.42 + 0.6));
    this.camera.position.set(
      target.x + Math.sin(this.cinemaAngle) * r,
      target.y + Math.max(4.5, y),
      target.z + Math.cos(this.cinemaAngle) * r
    );
    this.controls.target.lerp(target, Math.min(1, dt * 4.5));
  }

  snapView(preset, distance = 32, target = new THREE.Vector3(0, 1.2, 0)) {
    const dirMap = {
      iso: new THREE.Vector3(0.76, 0.56, 0.78).normalize(),
      top: new THREE.Vector3(0.001, 1, 0.001).normalize(),
      front: new THREE.Vector3(0, 0.05, 1).normalize(),
      right: new THREE.Vector3(1, 0.05, 0).normalize(),
      bottom: new THREE.Vector3(0.001, -1, 0.001).normalize()
    };
    const d = dirMap[preset] || dirMap.iso;
    const pos = target.clone().addScaledVector(d, distance);
    this.animateCameraTo(pos, target, 580, 0.85);
  }

  focusOnPart(partId) {
    const entry = this.partMap.get(partId);
    if (!entry) return;
    const box = new THREE.Box3().setFromObject(entry.group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() * 0.5, 2.2);
    const currentDir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (currentDir.lengthSq() < 0.001) currentDir.set(0.7, 0.55, 0.7).normalize();
    const desiredDist = Math.max(radius * 3.15, 13.5);
    const endPos = center.clone().addScaledVector(currentDir, desiredDist);
    this.animateCameraTo(endPos, center, 560, 0.55);
  }

  update(now) {
    if (this.cameraTween) {
      const t = Math.min(1, (now - this.cameraTween.startTime) / this.cameraTween.duration);
      const ease = 1 - Math.pow(1 - t, 4); // Silky quintic-feel studio deceleration
      this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, ease);
      if (this.cameraTween.arcLift) {
        this.camera.position.y += Math.sin(t * Math.PI) * this.cameraTween.arcLift;
      }
      this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, ease);
      if (t >= 1) this.cameraTween = null;
    }

    // Animate 3D click/selection shockwave burst rings
    for (let i = this.burstRings.length - 1; i >= 0; i--) {
      const b = this.burstRings[i];
      if (now < b.startTime) {
        b.mesh.visible = false;
        continue;
      }
      b.mesh.visible = true;
      const p = Math.min(1, (now - b.startTime) / b.duration);
      const ease = 1 - Math.pow(1 - p, 3.5);
      b.mesh.scale.setScalar(b.startR + (b.endR - b.startR) * ease);
      b.mat.opacity = 0.72 * Math.pow(1 - p, 1.9);
      if (p >= 1) {
        this.burstGroup.remove(b.mesh);
        b.geo.dispose();
        b.mat.dispose();
        this.burstRings.splice(i, 1);
      }
    }

    // Subtle breathing cobalt aura on currently selected part
    if (this.selectedId && this.partMap.has(this.selectedId)) {
      const selEntry = this.partMap.get(this.selectedId);
      const baseInt = this.ghostMode ? 0.16 : 0.24;
      const pulseInt = baseInt + 0.11 * (0.5 + 0.5 * Math.sin(now * 0.0055));
      selEntry.group.traverse((obj) => {
        if (obj.isMesh && !obj.userData.ignorePick && obj.material && 'emissiveIntensity' in obj.material && obj.userData.clonedForHighlight) {
          obj.material.emissiveIntensity = pulseInt;
        }
      });
    }

    this.controls.update();

    if (this.onCameraSync) {
      this.onCameraSync(this.camera.quaternion);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
