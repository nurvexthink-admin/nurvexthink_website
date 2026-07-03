"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// The 3D watermark scene is lazy-loaded so Three.js never blocks first paint.
const AmbientLogo3D = dynamic(() => import("./ambient-logo-3d"), {
  ssr: false,
  loading: () => null,
});

/**
 * Site-wide ambient background: the real NurvexThink mark, extruded and slowly
 * turning in true 3D as a faint watermark, floating over drifting aurora glows
 * and a faint grid. Theme-aware (opacity + tint come from CSS tokens),
 * decorative only (`aria-hidden`, `pointer-events: none`), and rendered a
 * single time from the root layout — the site's one WebGL scene.
 *
 * Aurora/grid motion is CSS-driven (transform/opacity only). This component
 * adds just one lightweight, rAF-throttled pointer listener for subtle
 * parallax, which stays off on touch devices and when the user prefers
 * reduced motion.
 */
export function AmbientBackground() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Parallax is a nicety, not the effect — skip it where it's unwanted or moot.
    const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (noMotion || !canHover) return;

    let frame = 0;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      frame = 0;
      root.style.setProperty("--amb-mx", (((lastX / window.innerWidth) * 2 - 1)).toFixed(3));
      root.style.setProperty("--amb-my", (((lastY / window.innerHeight) * 2 - 1)).toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Keep admin clean and functional.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div ref={rootRef} aria-hidden className="ambient-root">
      <div className="ambient-aurora ambient-aurora-a" />
      <div className="ambient-aurora ambient-aurora-b" />
      <div className="ambient-aurora ambient-aurora-c" />
      <div className="ambient-grid bg-grid" />

      {/* The watermark: the extruded brand mark on a slow 3D turntable. The
          wrapper owns size, opacity, theme filter, and mouse parallax. */}
      <div className="ambient-logo">
        <AmbientLogo3D />
      </div>
    </div>
  );
}
