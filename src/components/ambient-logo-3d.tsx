"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Box3, ExtrudeGeometry, Vector3, type Group } from "three";
import {
  LOGO_NAVY_PATH,
  LOGO_SILVER_PATH,
  LOGO_TRACE_WIDTH,
} from "@/components/logo-shapes";

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

/** World-space width the logo is scaled to (camera z=5, fov 42). */
const LOGO_WORLD_WIDTH = 4.8;
/** One full turn takes this long — a slow, ambient rotation. */
const SPIN_SECONDS = 22;

/**
 * The real NurvexThink mark, extruded into 3D from its traced outlines
 * (logo-shapes.ts): navy "N", silver "T", beveled edges, metallic PBR.
 * Spins a full 360° like a physical object on a turntable.
 */
function LogoMark({ animate }: { animate: boolean }) {
  const ref = useRef<Group>(null);

  const { geometries, scale } = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_NAVY_PATH}"/><path d="${LOGO_SILVER_PATH}"/></svg>`;
    const { paths } = new SVGLoader().parse(svg);
    const geometries = paths.map((path) => {
      const shapes = SVGLoader.createShapes(path);
      return new ExtrudeGeometry(shapes, {
        depth: 36,
        bevelEnabled: true,
        bevelThickness: 6,
        bevelSize: 4,
        bevelSegments: 3,
        curveSegments: 14,
      });
    });

    // Centre the union of both letters so the group spins about its middle.
    const box = new Box3();
    for (const g of geometries) {
      g.computeBoundingBox();
      box.union(g.boundingBox!);
    }
    const c = box.getCenter(new Vector3());
    for (const g of geometries) g.translate(-c.x, -c.y, -c.z);

    return { geometries, scale: LOGO_WORLD_WIDTH / LOGO_TRACE_WIDTH };
  }, []);

  // Manually created geometries are not managed by R3F — dispose them ourselves.
  useEffect(() => {
    return () => geometries.forEach((g) => g.dispose());
  }, [geometries]);

  useFrame((_, delta) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.y += (delta / SPIN_SECONDS) * Math.PI * 2;
  });

  return (
    <Float speed={animate ? 1 : 0} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* SVG space is y-down: flip Y to display upright. */}
      <group ref={ref} scale={[scale, -scale, scale]} rotation={[0.1, 0, 0]}>
        <mesh geometry={geometries[0]}>
          {/* Deep navy with a lacquer clearcoat — dark but glossy. */}
          <meshPhysicalMaterial
            color="#1c2848"
            metalness={0.85}
            roughness={0.15}
            clearcoat={0.7}
            clearcoatRoughness={0.12}
            envMapIntensity={1.7}
          />
        </mesh>
        <mesh geometry={geometries[1]}>
          <meshPhysicalMaterial
            color="#dde2ea"
            metalness={0.85}
            roughness={0.2}
            envMapIntensity={1.8}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * The ambient watermark's 3D scene: the extruded brand mark on a slow turntable.
 * Rendered once, site-wide, inside the `.ambient-logo` wrapper (which owns
 * size, opacity, theme filter, and mouse parallax). dpr is capped — the layer
 * is faint, so extra resolution would be wasted GPU work.
 */
export default function AmbientLogo3D() {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      frameloop={reduced ? "demand" : "always"}
      className="absolute! inset-0"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      {/* Front fill so the extruded faces read (metal takes most light from env). */}
      <directionalLight position={[0, 1, 6]} intensity={0.7} />
      <LogoMark animate={!reduced} />
      {/* Studio reflections in brand colours — no external HDR. */}
      <Environment resolution={256}>
        <Lightformer intensity={2.6} position={[0, 3, 4]} scale={[7, 4, 1]} color="#e8ebf0" />
        <Lightformer intensity={2} position={[0, 0, 5]} scale={[8, 3, 1]} color="#c0c5ce" />
        <Lightformer intensity={1.4} position={[-4, -1, 2]} scale={[4, 4, 1]} color="#2d3a5c" />
        <Lightformer intensity={1.8} position={[4, 1, -2]} scale={[4, 4, 1]} color="#5c7cfa" />
        <Lightformer intensity={1} position={[0, -3, 1]} scale={[6, 2, 1]} color="#8a93a6" />
      </Environment>
    </Canvas>
  );
}
