import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { BufferGeometry } from "three";

interface Viewer3DProps {
  geometry: THREE.BufferGeometry | null;
  wireframe?: boolean;
  showGrid?: boolean;
}

export default function Viewer3D({ geometry, wireframe = false, showGrid = true }: Viewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    sceneRef.current = scene;

    // Grid
    if (showGrid) {
      const grid = new THREE.GridHelper(40, 40, 0x1e2a38, 0x1e2a38);
      grid.position.y = -5;
      scene.add(grid);
    }

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(10, 20, 10);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x4fd1c5, 0.4);
    dir2.position.set(-10, -5, -10);
    scene.add(dir2);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.01, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Axes helper
    const axes = new THREE.AxesHelper(3);
    scene.add(axes);

    // Resize
    const handleResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animate
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [showGrid]);

  // Update geometry when it changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }

    if (!geometry) return;

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a9faf,
      metalness: 0.2,
      roughness: 0.6,
      wireframe,
      side: THREE.DoubleSide,
    });

    // Wireframe overlay
    if (wireframe) {
      const wMat = new THREE.MeshBasicMaterial({ color: 0x4fd1c5, wireframe: true, opacity: 0.3, transparent: true });
      const wMesh = new THREE.Mesh(geometry, wMat);
      meshRef.current = wMesh;
      scene.add(wMesh);
    } else {
      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh;
      scene.add(mesh);

      // Subtle wireframe overlay
      const wEdges = new THREE.EdgesGeometry(geometry, 30);
      const wLine = new THREE.LineSegments(
        wEdges,
        new THREE.LineBasicMaterial({ color: 0x4fd1c5, opacity: 0.15, transparent: true })
      );
      mesh.add(wLine);
    }

    // Fit camera
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    const size = new THREE.Vector3();
    bb.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const controls = controlsRef.current;
    if (controls) {
      (controls as any).target.copy(center);
      (controls as any).object.position.set(
        center.x + maxDim * 1.5,
        center.y + maxDim * 1.2,
        center.z + maxDim * 2
      );
      controls.update();
    }
  }, [geometry, wireframe]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-md overflow-hidden"
      data-testid="viewer-3d"
      style={{ minHeight: 300 }}
    />
  );
}
