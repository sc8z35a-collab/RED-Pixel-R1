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
    this.perspCamera = new THREE.PerspectiveCamera(34, this.aspect, 0.05, 500);
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

    // Smooth CAD OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 1.1;
    this.controls.panSpeed = 0.85;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 120;
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

    this.cameraTween = null;
    this.edgeLines = [];
    this.selectionOutlineGroup = new THREE.Group();
    this.scene.add(this.selectionOutlineGroup);

    // Callbacks
    this.onPartSelect = null;
    this.onPartHover = null;
    this.onCameraSync = null;

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

  _bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.set(e.clientX, e.clientY);
      this.cameraTween = null;
    });

    dom.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this._updateHover();
    });

    dom.addEventListener('pointerup', (e) => {
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) < 5) {
        const hitId = this._raycastPart();
        this.selectPart(hitId);
      }
    });
  }

  resize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.aspect = this.width / this.height;

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
    this._refreshHighlightAppearance();
    if (focusCamera && this.selectedId) {
      this.focusOnPart(this.selectedId);
    }
    if (this.onPartSelect) this.onPartSelect(this.selectedId);
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
    for (const [id, entry] of this.partMap.entries()) {
      const isSelected = id === this.selectedId;
      const isHovered = id === this.hoveredId;
      const isDimmed = this.selectedId && !isSelected && this.shadingMode !== 'xray';

      entry.group.traverse((obj) => {
        if (!obj.isMesh || obj.userData.ignorePick) return;
        const mat = obj.material;
        if (!mat || !mat.isMaterial) return;

        // Subtle emissive highlight on selected / hovered CAD part
        if ('emissive' in mat) {
          if (!obj.userData.baseEmissiveHex) {
            obj.userData.baseEmissiveHex = mat.emissive.getHex();
            obj.userData.baseEmissiveInt = mat.emissiveIntensity ?? 0;
          }
          // Clone material once per part mesh if shared so highlighting stays strictly local
          if ((isSelected || isHovered) && !obj.userData.clonedForHighlight) {
            obj.material = mat.clone();
            obj.userData.clonedForHighlight = true;
          }
          const activeMat = obj.material;
          if (isSelected) {
            activeMat.emissive.setHex(0x2563eb);
            activeMat.emissiveIntensity = 0.24;
          } else if (isHovered) {
            activeMat.emissive.setHex(0x0ea5e9);
            activeMat.emissiveIntensity = 0.14;
          } else if (obj.userData.clonedForHighlight) {
            activeMat.emissive.setHex(obj.userData.baseEmissiveHex);
            activeMat.emissiveIntensity = obj.userData.baseEmissiveInt;
          }
        }
      });

      // Keep crisp visibility when non-selected parts stay solid (or subtly ghosted only in xray)
      void isDimmed;
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
    return next;
  }

  toggleIsolateSelected() {
    if (!this.selectedId) return false;
    if (this.isolatedId === this.selectedId) {
      // Restore all
      this.showAllParts();
      return false;
    }
    this.isolatedId = this.selectedId;
    for (const [id, entry] of this.partMap.entries()) {
      const keep = id === this.selectedId;
      entry.hidden = !keep;
      entry.group.visible = keep;
    }
    this.focusOnPart(this.selectedId);
    return true;
  }

  showAllParts() {
    this.isolatedId = null;
    for (const entry of this.partMap.values()) {
      entry.hidden = false;
      entry.group.visible = true;
    }
  }

  setShadingMode(mode) {
    this.shadingMode = mode;
    for (const line of this.edgeLines) {
      line.visible = (mode === 'cad');
    }
    for (const entry of this.partMap.values()) {
      entry.group.traverse((obj) => {
        if (!obj.isMesh || obj.userData.ignorePick) return;
        const orig = obj.userData.origMaterial;
        if (!orig) return;

        if (mode === 'xray') {
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
          obj.userData.clonedForHighlight = true;
        } else {
          // 'solid' or 'cad'
          obj.material = orig;
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

  animateCameraTo(position, target, duration = 560) {
    this.cameraTween = {
      startPos: this.camera.position.clone(),
      endPos: position.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: target.clone(),
      startTime: performance.now(),
      duration
    };
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
    this.animateCameraTo(pos, target, 520);
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
    this.animateCameraTo(endPos, center, 480);
  }

  update(now) {
    if (this.cameraTween) {
      const t = Math.min(1, (now - this.cameraTween.startTime) / this.cameraTween.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, ease);
      this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, ease);
      if (t >= 1) this.cameraTween = null;
    }

    this.controls.update();

    if (this.onCameraSync) {
      this.onCameraSync(this.camera.quaternion);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
