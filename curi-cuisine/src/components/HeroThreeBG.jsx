import React, { useEffect, useRef } from "react";
import * as THREE from 'three';

export default function HeroThreeBG() {
  const mountRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight || 260;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 3, 4);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const geometry = new THREE.IcosahedronGeometry(2.2, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf4c430,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x222222,
      emissiveIntensity: 0.25,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const particles = new THREE.BufferGeometry();
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 20;
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      particles,
      new THREE.PointsMaterial({ color: 0x2B6777, size: 0.03, transparent: true, opacity: 0.6 })
    );
    scene.add(points);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || 260;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.004;
      points.rotation.y -= 0.0015;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      particles.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className="absolute inset-0 -z-10 opacity-60" />
  );
}
