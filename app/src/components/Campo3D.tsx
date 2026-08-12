import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { pitchGeom, setores } from '../pitch';

const g = pitchGeom;
/** World units: pitch is 3 wide x 5 long, matching the 30x50m proportion. */
const PW = 3;
const PL = 5;

/** Pitch markings are painted onto a canvas instead of built from line geometry:
 *  far crisper at grazing angles and far cheaper than dozens of meshes. */
function texturaDoCampo(): THREE.CanvasTexture {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = Math.round(S * (PW / PL));
  c.height = S;
  const ctx = c.getContext('2d')!;
  const w = c.width;
  const h = c.height;

  ctx.fillStyle = '#1b2b22';
  ctx.fillRect(0, 0, w, h);
  const faixas = 10;
  for (let i = 0; i < faixas; i++) {
    if (i % 2 === 0) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(0, (i * h) / faixas, w, h / faixas);
  }

  ctx.strokeStyle = 'rgba(235,242,238,0.62)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  const m = w * 0.03;
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);

  ctx.beginPath();
  ctx.moveTo(m, h / 2);
  ctx.lineTo(w - m, h / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, g.centerCircleR * w, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(235,242,238,0.5)';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.008, 0, Math.PI * 2);
  ctx.fill();

  for (const topo of [true, false]) {
    const areaH = g.penaltyDepth * h;
    const areaW = g.penaltyWidth * w;
    const ay = topo ? m : h - m - areaH;
    ctx.strokeRect((w - areaW) / 2, ay, areaW, areaH);

    const pH = g.goalAreaDepth * h;
    const pW = g.goalAreaWidth * w;
    const py = topo ? m : h - m - pH;
    ctx.strokeRect((w - pW) / 2, py, pW, pH);

    const spotY = topo ? m + g.penaltySpot * h : h - m - g.penaltySpot * h;
    ctx.beginPath();
    ctx.arc(w / 2, spotY, w * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export interface Celula {
  index: number;
  value: number;
  label: string;
}

interface Props {
  cols: number;
  rows: number;
  celulas: Celula[];
  /** rgb string per cell, already colourblind-safe (blue -> amber). */
  cores: string[];
  onSelect?: (index: number) => void;
}

export default function Campo3D({ cols, rows, celulas, cores, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const labelsRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    barras: THREE.Mesh[];
    alvos: number[];
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    raycaster?: THREE.Raycaster;
    rotulos: HTMLSpanElement[];
  }>({ barras: [], alvos: [], rotulos: [] });

  // Scene is built once; data changes only retarget bar heights.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const alvoHost: HTMLDivElement = host;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(4.9, 6.3, 5.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 22;
    // Clamped on purpose: free orbit is how a 3D chart ends up viewed edge-on or from
    // underneath, which is where these visualisations usually turn ugly.
    controls.minPolarAngle = Math.PI * 0.06;
    controls.maxPolarAngle = Math.PI * 0.34;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x0a1410, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3.2, 7, 4.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.radius = 3;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6f9dff, 0.35);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    const tex = texturaDoCampo();
    const gramado = new THREE.Mesh(
      new THREE.PlaneGeometry(PW, PL),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }),
    );
    gramado.rotation.x = -Math.PI / 2;
    gramado.receiveShadow = true;
    scene.add(gramado);

    // Thin rim so the pitch reads as an object, not a floating decal.
    const borda = new THREE.Mesh(
      new THREE.BoxGeometry(PW + 0.12, 0.06, PL + 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0d141b, roughness: 0.8 }),
    );
    borda.position.y = -0.035;
    borda.receiveShadow = true;
    scene.add(borda);

    // Traves: sem elas a placa lida como tabuleiro, não como campo.
    const traveMat = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.4, emissive: 0x223044, emissiveIntensity: 0.3 });
    for (const lado of [1, -1]) {
      const trave = new THREE.Mesh(new THREE.BoxGeometry(g.goalWidth * PW * 2.2, 0.19, 0.05), traveMat);
      trave.position.set(0, 0.095, (lado * PL) / 2);
      trave.castShadow = true;
      scene.add(trave);
    }

    const cells = setores(cols, rows);
    const bw = (PW / cols) * 0.72;
    const bd = (PL / rows) * 0.72;
    const barras: THREE.Mesh[] = [];
    const geo = new THREE.BoxGeometry(bw, 1, bd);
    geo.translate(0, 0.5, 0); // grow upward from the turf

    for (const s of cells) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2f6fd6, roughness: 0.45, metalness: 0,
        emissive: 0x0d2038, emissiveIntensity: 0.25,
        transparent: true, opacity: 0.82, depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((s.cx - 0.5) * PW, 0, -(s.cy - 0.5) * PL);
      mesh.scale.y = 0.001;
      mesh.castShadow = true;
      mesh.userData.index = s.index;
      scene.add(mesh);
      barras.push(mesh);
    }

    const rotulos: HTMLSpanElement[] = [];
    if (labelsRef.current) {
      labelsRef.current.innerHTML = '';
      for (let i = 0; i < cells.length; i++) {
        const el = document.createElement('span');
        el.style.cssText = [
          'position:absolute', 'transform:translate(-50%,-50%)', 'font-family:Barlow Condensed,sans-serif',
          'font-size:19px', 'font-weight:800', 'color:#fff', 'text-shadow:0 1px 4px rgba(0,0,0,0.85)',
          'pointer-events:none', 'line-height:1',
        ].join(';');
        labelsRef.current.appendChild(el);
        rotulos.push(el);
      }
    }

    const raycaster = new THREE.Raycaster();
    stateRef.current = { barras, alvos: barras.map(() => 0), rotulos, renderer, scene, camera, controls, raycaster };

    const DIST_BASE = 9.5;
    function resize() {
      const r = alvoHost.getBoundingClientRect();
      if (r.width === 0) return;
      renderer.setSize(r.width, r.height, false);
      const aspect = r.width / r.height;
      camera.aspect = aspect;
      // Narrow viewports have to pull back or the pitch runs off the sides.
      const fator = aspect < 1.35 ? 1 + (1.35 - aspect) * 0.62 : 1;
      camera.position.setLength(DIST_BASE * fator);
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      const st = stateRef.current;
      for (let i = 0; i < st.barras.length; i++) {
        const alvo = Math.max(0.001, st.alvos[i]);
        const atual = st.barras[i].scale.y;
        st.barras[i].scale.y = atual + (alvo - atual) * 0.12;
      }
      controls.update();
      renderer.render(scene, camera);

      const rect = alvoHost.getBoundingClientRect();
      const v = new THREE.Vector3();
      for (let i = 0; i < st.rotulos.length; i++) {
        const barra = st.barras[i];
        const el = st.rotulos[i];
        if (!barra || !el) continue;
        if (!barra.visible) { el.style.display = 'none'; continue; }
        el.style.display = 'block';
        v.set(barra.position.x, barra.scale.y + 0.07, barra.position.z).project(camera);
        el.style.left = `${((v.x + 1) / 2) * rect.width}px`;
        el.style.top = `${((-v.y + 1) / 2) * rect.height}px`;
      }
    }
    loop();

    function onClick(ev: PointerEvent) {
      if (!onSelect) return;
      const r = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((ev.clientX - r.left) / r.width) * 2 - 1,
        -((ev.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(barras, false)[0];
      if (hit) onSelect((hit.object as THREE.Mesh).userData.index as number);
    }
    renderer.domElement.addEventListener('pointerdown', onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onClick);
      controls.dispose();
      geo.dispose();
      tex.dispose();
      barras.forEach((b) => (b.material as THREE.Material).dispose());
      gramado.geometry.dispose();
      (gramado.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cols, rows, onSelect]);

  useEffect(() => {
    const st = stateRef.current;
    if (st.barras.length === 0) return;
    const max = Math.max(1, ...celulas.map((c) => c.value));
    st.alvos = st.barras.map((_, i) => {
      const v = celulas.find((c) => c.index === i)?.value ?? 0;
      return (v / max) * 0.42;
    });
    st.barras.forEach((b, i) => {
      const cor = cores[i] ?? 'rgb(47,111,214)';
      const mat = b.material as THREE.MeshStandardMaterial;
      mat.color.set(cor);
      mat.emissive.set(cor);
      mat.emissiveIntensity = 0.18;
      const valor = celulas.find((c) => c.index === i)?.value ?? 0;
      b.visible = valor > 0;
      if (st.rotulos[i]) st.rotulos[i].textContent = String(valor);
    });
  }, [celulas, cores]);

  return (
    <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative' }}>
      <div ref={labelsRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} />
    </div>
  );
}
