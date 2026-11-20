import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ProxyItem } from '../types';

interface NetworkFlow3DProps {
  proxies?: ProxyItem[];
  selectedProxyId?: string | null;
  onSelectProxy?: (proxy: ProxyItem) => void;
  activeProxies: number;
  totalProxies: number;
  accentHex?: string;
  luminanceFactor?: number;
  heightClass?: string;
  interactiveHint?: boolean;
}

const _vec3 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();
const _scale = new THREE.Vector3(1, 1, 1);

export const NetworkFlow3D: React.FC<NetworkFlow3DProps> = ({
  proxies = [],
  selectedProxyId = null,
  onSelectProxy,
  activeProxies,
  totalProxies,
  accentHex = '#e0be78',
  luminanceFactor = 1.0,
  heightClass = 'h-72 sm:h-80',
  interactiveHint = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelectProxy);
  onSelectRef.current = onSelectProxy;

  // Pick up to 14 representative live proxies (prioritizing fastest active + fixed)
  const topologyNodes = useMemo(() => {
    if (!proxies.length) return [];
    const active = proxies.filter((p) => p.status === 'active');
    const others = proxies.filter((p) => p.status !== 'active');
    return [...active.slice(0, 12), ...others.slice(0, 2)].slice(0, 14);
  }, [proxies]);

  const liveRef = useRef({
    activeProxies,
    totalProxies,
    accentHex,
    luminanceFactor,
    selectedProxyId,
    topologyNodes,
  });

  useEffect(() => {
    liveRef.current = {
      activeProxies,
      totalProxies,
      accentHex,
      luminanceFactor,
      selectedProxyId,
      topologyNodes,
    };
  }, [activeProxies, totalProxies, accentHex, luminanceFactor, selectedProxyId, topologyNodes]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070506);
    scene.fog = new THREE.FogExp2(0x070506, 0.042);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 120);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Lighting rig driven dynamically by site luminance
    const hemi = new THREE.HemisphereLight(0x9cb4d4, 0x1a1310, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfbe5bb, 2.3);
    keyLight.position.set(6, 9, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x34d399, 2.4, 24);
    rimLight.position.set(-4.5, 3, -3.5);
    scene.add(rimLight);

    const accentSpot = new THREE.PointLight(new THREE.Color(accentHex), 2.5, 22);
    accentSpot.position.set(0, 3.8, 0);
    scene.add(accentSpot);

    // Base studio grid + orbital perimeter ring
    const gridHelper = new THREE.GridHelper(22, 28, 0x453624, 0x1c1714);
    gridHelper.position.y = -1.75;
    scene.add(gridHelper);

    const outerOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(4.5, 0.018, 10, 96),
      new THREE.MeshBasicMaterial({ color: 0xe0be78, transparent: true, opacity: 0.25 })
    );
    outerOrbit.rotation.x = Math.PI / 2;
    outerOrbit.position.y = -0.15;
    scene.add(outerOrbit);

    // Composite Core Gateway Hub
    const hubGroup = new THREE.Group();
    scene.add(hubGroup);

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x181413,
      metalness: 0.78,
      roughness: 0.26,
    });
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(accentHex),
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 0.8,
    });
    const emeraldEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.7,
      metalness: 0.35,
      roughness: 0.2,
    });
    const pausedMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xfb7185,
      emissiveIntensity: 1.3,
      metalness: 0.35,
      roughness: 0.25,
    });
    const selectedMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: new THREE.Color(accentHex),
      emissiveIntensity: 2.2,
      metalness: 0.5,
      roughness: 0.15,
    });

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.7, 0.28, 36), obsidianMat);
    pedestal.position.y = -1.6;
    hubGroup.add(pedestal);

    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.075, 20, 64), goldMat);
    coreRing.rotation.x = Math.PI / 2;
    coreRing.position.y = -0.1;
    hubGroup.add(coreRing);

    const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.045, 16, 48), goldMat);
    hubGroup.add(gyroRing);

    const centralCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 0), goldMat);
    hubGroup.add(centralCore);

    const coreHalo = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.022, 12, 48), emeraldEmissiveMat);
    coreHalo.rotation.x = Math.PI / 3;
    hubGroup.add(coreHalo);

    // Selection target indicator ring that snaps to selected proxy node
    const selectionBeacon = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.032, 14, 36),
      selectedMat
    );
    selectionBeacon.rotation.x = Math.PI / 2;
    selectionBeacon.visible = false;
    scene.add(selectionBeacon);

    // Build dynamic proxy node topology slots (up to 14 nodes)
    const maxSlots = 14;
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const curves: THREE.CatmullRomCurve3[] = [];
    const nodeMeshes: Array<{
      group: THREE.Group;
      beacon: THREE.Mesh;
      hitSphere: THREE.Mesh;
      tube: THREE.Mesh;
      basePos: THREE.Vector3;
    }> = [];

    const fiberMatActive = new THREE.MeshStandardMaterial({
      color: 0x867052,
      metalness: 0.65,
      roughness: 0.3,
      transparent: true,
      opacity: 0.72,
    });

    const fiberMatHighlight = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      emissive: new THREE.Color(accentHex),
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.95,
    });

    const hitGeo = new THREE.SphereGeometry(0.42, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let i = 0; i < maxSlots; i++) {
      const angle = (i / maxSlots) * Math.PI * 2;
      const radius = 3.35 + (i % 3) * 0.58;
      const y = i % 2 === 0 ? 0.62 : -0.48;
      const pos = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

      const sat = new THREE.Group();
      sat.position.copy(pos);

      const satBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.38, 16), obsidianMat);
      const satRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 10, 24), goldMat);
      satRing.rotation.x = Math.PI / 2;
      satRing.position.y = 0.09;
      const satBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 14, 14),
        emeraldEmissiveMat
      );
      satBeacon.position.y = 0.26;
      const hitSphere = new THREE.Mesh(hitGeo, hitMat);
      hitSphere.userData.slotIndex = i;

      sat.add(satBody, satRing, satBeacon, hitSphere);
      nodeGroup.add(sat);

      const mid = pos.clone().multiplyScalar(0.48);
      mid.y += 1.15;
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), mid, pos]);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 26, 0.024, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, fiberMatActive);
      nodeGroup.add(tubeMesh);

      nodeMeshes.push({ group: sat, beacon: satBeacon, hitSphere, tube: tubeMesh, basePos: pos });
    }

    // InstancedMesh for flowing packets across all active paths
    const packetsPerCurve = 5;
    const totalPackets = maxSlots * packetsPerCurve;
    const packetGeo = new THREE.SphereGeometry(0.068, 10, 10);
    const packetMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d4,
      emissive: 0x34d399,
      emissiveIntensity: 2.0,
      roughness: 0.15,
    });
    const packetInstanced = new THREE.InstancedMesh(packetGeo, packetMat, totalPackets);
    packetInstanced.frustumCulled = false;
    scene.add(packetInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Interactive spherical camera orbit & raycast node click
    let targetYaw = 0;
    let targetPitch = 0.38;
    let targetRadius = 8.9;
    let currentYaw = 0;
    let currentPitch = 0.38;
    let currentRadius = 8.9;
    let dragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let lastPointer = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      lastPointer = { x: e.clientX, y: e.clientY };
      dom.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };
      targetYaw -= dx * 0.008;
      targetPitch = Math.max(0.12, Math.min(1.15, targetPitch + dy * 0.006));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      dom.style.cursor = 'grab';

      const distMoved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (distMoved < 6) {
        const rect = dom.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(
          nodeMeshes.filter((n) => n.group.visible).map((n) => n.hitSphere),
          false
        );
        if (hits.length > 0) {
          const slotIdx = Number(hits[0].object.userData.slotIndex);
          const proxy = liveRef.current.topologyNodes[slotIdx];
          if (proxy && onSelectRef.current) {
            onSelectRef.current(proxy);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetRadius = Math.max(4.8, Math.min(13.5, targetRadius + e.deltaY * 0.006));
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 75);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const {
        activeProxies: ap,
        totalProxies: tp,
        accentHex: ah,
        luminanceFactor: lum,
        selectedProxyId: selId,
        topologyNodes: nodes,
      } = liveRef.current;

      const ratio = tp > 0 ? Math.min(1, Math.max(0.25, ap / tp)) : 0.7;
      goldMat.color.set(ah);
      fiberMatHighlight.color.set(ah);
      fiberMatHighlight.emissive.set(ah);
      selectedMat.emissive.set(ah);
      accentSpot.color.set(ah);

      // Scale studio light exposure with site luminance (up to 900k cd)
      const lumScale = Math.max(0.55, Math.min(1.65, lum));
      renderer.toneMappingExposure = 0.95 + lumScale * 0.35;
      keyLight.intensity = 1.6 + lumScale * 1.1;
      accentSpot.intensity = 1.5 + lumScale * 1.6;

      centralCore.rotation.y += delta * (0.55 + ratio * 0.55);
      centralCore.rotation.x = Math.sin(elapsed * 0.7) * 0.18;
      gyroRing.rotation.x += delta * 0.7;
      gyroRing.rotation.z += delta * 0.45;
      coreHalo.rotation.z -= delta * 0.95;

      // Gentle auto-orbit when user isn't dragging
      if (!dragging) {
        targetYaw += delta * 0.1;
      }
      currentYaw += (targetYaw - currentYaw) * 0.08;
      currentPitch += (targetPitch - currentPitch) * 0.08;
      currentRadius += (targetRadius - currentRadius) * 0.08;

      camera.position.x = Math.sin(currentYaw) * Math.cos(currentPitch) * currentRadius;
      camera.position.y = Math.sin(currentPitch) * currentRadius;
      camera.position.z = Math.cos(currentYaw) * Math.cos(currentPitch) * currentRadius;
      camera.lookAt(0, -0.1, 0);

      // Sync visible proxy slots, colors, and selection beacon
      const visibleCount = nodes.length > 0 ? nodes.length : 8;
      let selFound = false;

      for (let i = 0; i < maxSlots; i++) {
        const slot = nodeMeshes[i];
        const visible = i < visibleCount;
        slot.group.visible = visible;
        slot.tube.visible = visible;
        if (!visible) continue;

        const proxy = nodes[i];
        const isSelected = Boolean(proxy && selId && proxy.id === selId);
        const isUp = !proxy || proxy.status === 'active';

        slot.beacon.material = isSelected
          ? selectedMat
          : isUp
          ? emeraldEmissiveMat
          : pausedMat;
        slot.tube.material = isSelected ? fiberMatHighlight : fiberMatActive;

        if (isSelected) {
          selFound = true;
          selectionBeacon.visible = true;
          selectionBeacon.position.copy(slot.basePos);
          selectionBeacon.position.y += 0.22;
          const pulse = 1 + Math.sin(elapsed * 4.5) * 0.18;
          selectionBeacon.scale.set(pulse, pulse, pulse);
        }
      }
      if (!selFound) {
        selectionBeacon.visible = false;
      }

      // Update instanced packets scaled dynamically by proxy ping & status
      let idx = 0;
      for (let c = 0; c < maxSlots; c++) {
        const proxy = nodes[c];
        const activeCurve = c < visibleCount && (!proxy || proxy.status === 'active');
        const pingVal = proxy?.ping ?? 45;
        const speedFactor = Math.max(0.22, Math.min(1.15, 36 / Math.max(12, pingVal)));
        const curve = curves[c];

        for (let p = 0; p < packetsPerCurve; p++) {
          if (!activeCurve) {
            _scale.set(0, 0, 0);
            _mat4.compose(_vec3.set(0, -50, 0), _quat, _scale);
            packetInstanced.setMatrixAt(idx++, _mat4);
            continue;
          }
          const isSel = Boolean(proxy && selId && proxy.id === selId);
          const speed = (0.24 + speedFactor * 0.42) * (isSel ? 1.45 : 1);
          const t = (elapsed * speed + p / packetsPerCurve + c * 0.11) % 1;
          curve.getPointAt(t, _vec3);
          const s = (isSel ? 1.35 : 0.85) + Math.sin(t * Math.PI) * 0.4;
          _scale.set(s, s, s);
          _mat4.compose(_vec3, _quat, _scale);
          packetInstanced.setMatrixAt(idx++, _mat4);
        }
      }
      packetInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  const selectedProxy = useMemo(
    () => topologyNodes.find((p) => p.id === selectedProxyId) || topologyNodes[0] || null,
    [topologyNodes, selectedProxyId]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[#070506]">
      <div ref={mountRef} className={`w-full ${heightClass}`} />

      {/* Top Interactive HUD Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-[11px]">
        <div className="flex items-center gap-2 rounded-xl bg-black/70 px-3 py-1.5 border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 active-proxy-lamp" />
          <span className="font-mono-tech text-emerald-300">
            {selectedProxy
              ? `STREAM: ${selectedProxy.country_code || 'GL'} · ${selectedProxy.ping ?? '--'} ms`
              : '3D LIVE PACKET FLOW'}
          </span>
        </div>

        <div className="rounded-xl bg-black/70 px-3 py-1.5 border border-[var(--accent)]/30 font-mono-tech text-[var(--accent-light)]">
          {activeProxies} ACTIVE / {totalProxies} NODES
        </div>
      </div>

      {/* Bottom Interactive Hint */}
      {interactiveHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3.5 py-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-[#cbbca7]">
          <span>اسحب للتدوير · عجلة الماوس للتكبير · انقر على أي عقدة دولة</span>
          {selectedProxy && (
            <span className="font-mono-tech text-[var(--accent-light)] ltr">
              {selectedProxy.server}:{selectedProxy.port}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
