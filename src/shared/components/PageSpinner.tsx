import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Grupo EMI Colombia spinner — concentric rings, corporate red primary.
export function PageSpinner() {
  const outerRef = useRef<SVGCircleElement>(null);
  const innerRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1 });
    if (outerRef.current) {
      tl.to(outerRef.current, { rotation: 360, svgOrigin: '24 24', duration: 1.2, ease: 'none' }, 0);
    }
    if (innerRef.current) {
      tl.to(innerRef.current, { rotation: -360, svgOrigin: '24 24', duration: 0.8, ease: 'none' }, 0);
    }
    return () => { tl.kill(); };
  }, []);

  return (
    <div
      className="flex items-center justify-center py-16"
      role="status"
      aria-label="Cargando"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        {/* Outer ring — corporate red */}
        <circle
          ref={outerRef}
          cx="24"
          cy="24"
          r="20"
          stroke="#d4001a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="90 36"
          opacity="0.85"
        />
        {/* Inner ring — muted red */}
        <circle
          ref={innerRef}
          cx="24"
          cy="24"
          r="12"
          stroke="#ff5560"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="40 36"
          opacity="0.5"
        />
        {/* Center dot */}
        <circle cx="24" cy="24" r="3" fill="#d4001a" opacity="0.5" />
      </svg>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
