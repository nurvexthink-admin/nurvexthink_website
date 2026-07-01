"use client";

import { useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import type { Mesh } from "three";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

function Crystal({ animate }: { animate: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.y += delta * 0.22;
    ref.current.rotation.x += delta * 0.06;
  });
  return (
    <Float speed={animate ? 1.1 : 0} rotationIntensity={0.35} floatIntensity={0.7}>
      <mesh ref={ref} rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[1.55, 0]} />
        <meshStandardMaterial
          color="#c4c9d3"
          metalness={1}
          roughness={0.2}
          envMapIntensity={1.15}
          flatShading
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      frameloop={reduced ? "demand" : "always"}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Crystal animate={!reduced} />
      {/* Studio reflections in brand colours — no external HDR. */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 3, 3]} scale={[6, 3, 1]} color="#e8ebf0" />
        <Lightformer intensity={1.4} position={[-4, -1, 2]} scale={[4, 4, 1]} color="#1e2a44" />
        <Lightformer intensity={1.6} position={[4, 1, -2]} scale={[4, 4, 1]} color="#5c7cfa" />
        <Lightformer intensity={0.8} position={[0, -3, 1]} scale={[6, 2, 1]} color="#8a93a6" />
      </Environment>
    </Canvas>
  );
}
