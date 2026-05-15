import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function NotFoundPage() {
  const numRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline();
      if (numRef.current) {
        // 3D number entrance
        tl.fromTo(
          numRef.current,
          { autoAlpha: 0, rotateY: -30, scale: 0.9 },
          { autoAlpha: 1, rotateY: 0, scale: 1, duration: 0.7, ease: 'back.out(1.5)' },
        );
      }
      if (contentRef.current) {
        tl.fromTo(
          contentRef.current,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
          '-=0.2',
        );
      }

      // Gentle float on number
      if (numRef.current) {
        gsap.to(numRef.current, {
          y: -8,
          duration: 2.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.7,
        });
      }
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      if (numRef.current) gsap.set(numRef.current, { autoAlpha: 1 });
      if (contentRef.current) gsap.set(contentRef.current, { autoAlpha: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center gap-6"
      style={{ perspective: '800px' }}
    >
      {/* 3D 404 */}
      <div
        ref={numRef}
        className="select-none"
        style={{ visibility: 'hidden', transformStyle: 'preserve-3d' }}
        aria-hidden="true"
      >
        <span
          className="font-serif font-bold text-[120px] md:text-[160px] leading-none
                     bg-gradient-to-br from-emi-red-800 via-emi-red-600 to-emi-red-400
                     bg-clip-text text-transparent"
        >
          404
        </span>
      </div>

      <div ref={contentRef} style={{ visibility: 'hidden' }} className="flex flex-col items-center gap-4">
        <h2 className="font-serif text-xl font-semibold text-emi-ink-700">
          Página no encontrada
        </h2>
        <p className="text-sm text-emi-ink-400 max-w-xs">
          La ruta que buscas no existe o fue movida. Regresa al inicio para continuar.
        </p>
        <Link to="/tasks" className="btn-primary min-h-[44px]">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ir a tareas
        </Link>
      </div>
    </div>
  );
}
