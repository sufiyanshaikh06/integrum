import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroCanvasProps {
  className?: string;
}

export default function ThreeHeroCanvas({ className }: ThreeHeroCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Graceful fallback if WebGL is unavailable
      return;
    }

    const width = mount.clientWidth || 500;
    const height = mount.clientHeight || 500;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x0f2923, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2dd4bf, 3.0);
    dirLight1.position.set(5, 6, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 2.0);
    dirLight2.position.set(-5, -4, -2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x10b981, 2.5, 12);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // ── Core Polyhedron (Academic Crystal) ──
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Faceted Crystal Body
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f3832,
      emissive: 0x082622,
      roughness: 0.15,
      metalness: 0.3,
      transmission: 0.45,
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Luminous Wireframe Overlay
    const wireGeo = new THREE.IcosahedronGeometry(1.62, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    // ── Orbital Rings (Unified Academic Cycles) ──
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
    });
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.035, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    scene.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x0f766e,
      emissiveIntensity: 0.2,
    });
    const ringGeo2 = new THREE.TorusGeometry(2.7, 0.025, 16, 100);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 4;
    scene.add(ring2);

    // Small Satellite Node on Ring 1
    const nodeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.8,
    });
    const satellite = new THREE.Mesh(nodeGeo, nodeMat);
    scene.add(satellite);

    // ── Knowledge Particles Field ──
    const particleCount = 140;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.4 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePos[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = radius * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x6ee7b7,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Mouse & Touch Tracking ──
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isVisible = true;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = mount.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseX = ((clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // ── Visibility Observer (Pause when off-screen) ──
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(mount);

    // ── Resize Handler ──
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation Loop ──
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth inertia rotation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      coreGroup.rotation.x = elapsed * 0.35 + targetY * 0.4;
      coreGroup.rotation.y = elapsed * 0.45 + targetX * 0.6;

      ring1.rotation.z = elapsed * 0.4;
      ring1.rotation.y = Math.PI / 6 + targetX * 0.2;

      ring2.rotation.y = -elapsed * 0.3;
      ring2.rotation.x = -Math.PI / 4 + targetY * 0.2;

      // Satellite position on ring 1
      const satAngle = elapsed * 0.8;
      satellite.position.set(
        Math.cos(satAngle) * 2.35 * Math.cos(Math.PI / 6) - Math.sin(satAngle) * 2.35 * Math.sin(Math.PI / 6) * Math.cos(Math.PI / 3),
        Math.sin(satAngle) * 2.35 * Math.sin(Math.PI / 3),
        Math.cos(satAngle) * 2.35 * Math.sin(Math.PI / 6) + Math.sin(satAngle) * 2.35 * Math.cos(Math.PI / 6) * Math.cos(Math.PI / 3)
      );

      particles.rotation.y = -elapsed * 0.08;
      particles.rotation.x = Math.sin(elapsed * 0.1) * 0.1;

      // Subtle breathing scale
      const breath = 1 + Math.sin(elapsed * 1.5) * 0.025;
      coreGroup.scale.set(breath, breath, breath);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '380px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
      aria-label="Interactive 3D academic polyhedron model"
    />
  );
}
