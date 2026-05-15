import { useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ToastViewport } from '@shared/components/ToastViewport';
import { BrandLogo } from '@shared/components/BrandLogo';

gsap.registerPlugin(useGSAP);

export function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Page transition — fade+slide up on route change
  useGSAP(() => {
    const el = mainRef.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
      );
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(el, { autoAlpha: 1 });
    });
    return () => mm.revert();
  }, { scope: mainRef, dependencies: [location.pathname] });

  // Mobile drawer animation
  useGSAP(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (menuOpen) {
        gsap.fromTo(drawer, { x: '100%', autoAlpha: 0 }, { x: '0%', autoAlpha: 1, duration: 0.3, ease: 'power3.out' });
      } else {
        gsap.to(drawer, { x: '100%', autoAlpha: 0, duration: 0.25, ease: 'power3.in' });
      }
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(drawer, menuOpen ? { autoAlpha: 1, x: '0%' } : { autoAlpha: 0, x: '100%' });
    });
    return () => mm.revert();
  }, { scope: drawerRef, dependencies: [menuOpen] });

  return (
    <div className="min-h-screen flex flex-col bg-emi-cream">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-emi-ink-100/60 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo / wordmark */}
          <NavLink to="/tasks" className="flex items-center gap-2.5 group" aria-label="Grupo EMI Falck · Task Manager">
            <BrandLogo className="h-8 md:h-10 w-auto flex-shrink-0" alt="Grupo EMI Falck" />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-sm font-semibold text-emi-red-700 group-hover:text-emi-red-800 transition-colors duration-fast">
                Grupo EMI
              </span>
              <span className="text-[10px] font-medium text-emi-ink-400 tracking-wide uppercase">
                Colombia
              </span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            <NavItem to="/tasks">Tareas</NavItem>
            <NavItem to="/tasks/new">Nueva</NavItem>
            <NavItem to="/states">Estados</NavItem>
          </nav>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md
                       text-emi-ink-600 hover:bg-emi-ink-50 transition-colors duration-fast
                       focus-visible:ring-2 focus-visible:ring-emi-red-700"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Mobile drawer ─── */}
      <div
        ref={drawerRef}
        id="mobile-menu"
        className="fixed inset-0 z-40 md:hidden"
        style={{ visibility: 'hidden', opacity: 0 }}
        aria-modal="true"
        role="dialog"
        aria-label="Menú de navegación"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-emi-ink-900/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer panel */}
        <nav
          className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-card-hover
                     flex flex-col pt-16 pb-8 px-6 gap-2"
          aria-label="Menú móvil"
        >
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                       rounded-md text-emi-ink-500 hover:bg-emi-ink-50 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <MobileNavItem to="/tasks" onClick={() => setMenuOpen(false)}>Tareas</MobileNavItem>
          <MobileNavItem to="/tasks/new" onClick={() => setMenuOpen(false)}>Nueva tarea</MobileNavItem>
          <MobileNavItem to="/states" onClick={() => setMenuOpen(false)}>Estados</MobileNavItem>
        </nav>
      </div>

      {/* ─── Main content ─── */}
      <main id="main-content" ref={mainRef} className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      {/* ─── Footer — Grupo EMI Falck ─── */}
      <footer
        className="bg-emi-burgundy-800 text-white"
        style={{
          backgroundImage: "url('/brand/footer-background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">

          {/* ── CTA pills row ── */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-10">
            {/* "Afíliate en línea" — solid red pill */}
            <a
              href="https://www.grupoemi.com/colombia/ecommerce"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold',
                'bg-emi-red-700 text-white hover:bg-emi-red-800 transition-colors duration-base ease-emi',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-emi-burgundy-800',
              ].join(' ')}
            >
              Afíliate en línea
            </a>
            {/* "Paga tus facturas" — outline white pill */}
            <a
              href="https://pagosenlinea.grupoemi.com/pago/colombia"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold',
                'border border-white/80 text-white hover:bg-white/10 transition-colors duration-base ease-emi',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-emi-burgundy-800',
              ].join(' ')}
            >
              Paga tus facturas
            </a>
            {/* "Portal cliente" — white pill, burgundy text */}
            <a
              href="https://portal.grupoemi.com/welcome"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold',
                'bg-white text-emi-burgundy-800 hover:bg-emi-cream transition-colors duration-base ease-emi',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-emi-burgundy-800',
              ].join(' ')}
            >
              Portal cliente
            </a>

            {/* Decorative country selector — non-functional, fiel a grupoemi.com */}
            <div className="md:ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 text-sm text-white/60 select-none" aria-hidden="true">
              Estás en el sitio web de{' '}
              <span className="font-semibold text-white/80">Colombia</span>
              <svg className="w-3 h-3 text-white/50" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* ── 5-column link grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 mb-12">
            <FooterLinkGroup heading="Ayuda">
              <FooterLink href="https://www.grupoemi.com/ayuda">Centro de ayuda</FooterLink>
              <FooterLink href="https://www.grupoemi.com/ayuda">Preguntas frecuentes</FooterLink>
            </FooterLinkGroup>
            <FooterLinkGroup heading="Contacto">
              <FooterLink href="https://www.grupoemi.com/colombia/contactanos">Contáctanos</FooterLink>
              <FooterLink href="https://www.grupoemi.com/colombia/contactanos">Línea de emergencias</FooterLink>
            </FooterLinkGroup>
            <FooterLinkGroup heading="Legal">
              <FooterLink href="https://www.grupoemi.com/colombia/terminos-y-condiciones">Términos y condiciones</FooterLink>
              <FooterLink href="https://www.grupoemi.com/colombia/terminos-y-condiciones">Política de privacidad</FooterLink>
            </FooterLinkGroup>
            <FooterLinkGroup heading="Formación">
              <FooterLink href="https://www.grupoemi.com/colombia/capacitaciones">Capacitaciones</FooterLink>
              <FooterLink href="https://www.grupoemi.com/colombia/capacitaciones">Primeros auxilios</FooterLink>
            </FooterLinkGroup>
            <FooterLinkGroup heading="Recursos">
              <FooterLink href="https://www.grupoemi.com/blog">Blog</FooterLink>
              <FooterLink href="https://www.grupoemi.com/blog">Noticias EMI</FooterLink>
            </FooterLinkGroup>
          </div>

          {/* ── Bottom row ── */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Vigilado Supersalud badge */}
            <div className="flex items-center gap-2 text-xs text-white/60">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" viewBox="0 0 24 28" fill="none" aria-hidden="true">
                <path
                  d="M12 1L2 5.5v8c0 6.5 4.5 12.5 10 14 5.5-1.5 10-7.5 10-14v-8L12 1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path d="M8 14l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Vigilado Supersalud</span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/60 text-center">
              Todos los derechos reservados EMI &copy; 2026
            </p>

            {/* Author */}
            <p className="text-xs text-white/60">
              Code challenge by Julian Nicholls
            </p>
          </div>

          {/* ── Disclaimer ── */}
          <p className="mt-4 text-[11px] text-white/40 text-center leading-relaxed">
            Logo y marca de Grupo EMI Falck son propiedad de sus titulares. Uso demostrativo en el contexto de un code challenge.
          </p>

        </div>
      </footer>

      {/* ─── Floating CTAs ─────────────────────────────────────────────────────
           Two fixed-position pills matching the real grupoemi.com home page.
           z-50 keeps them above the mobile drawer (z-40) and page content.
           print:hidden removes them from print stylesheets.
           hover:scale-105 is user-intent-only (hover), so it is safe without
           a prefers-reduced-motion guard — no autonomous motion occurs.
      ──────────────────────────────────────────────────────────────────────── */}

      {/* Left pill — "QUIERO AFILIARME" (EMI red, phone icon) */}
      <a
        href="https://www.grupoemi.com/colombia/ecommerce"
        target="_blank"
        rel="noopener noreferrer"
        className={[
          'fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 print:hidden',
          'inline-flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 sm:py-2.5',
          'bg-emi-red-700 hover:bg-emi-red-800 text-white',
          'text-xs sm:text-sm font-semibold uppercase tracking-wide',
          'shadow-card-hover transition-all duration-base ease-emi hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emi-red-700',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        ].join(' ')}
        aria-label="Quiero afiliarme a Grupo EMI Falck"
      >
        {/* Phone-handset icon — matches grupoemi.com floating CTA */}
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2
               1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1
               C9.6 21 3 14.4 3 6.4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1
               0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
            fill="currentColor"
          />
        </svg>
        <span>QUIERO AFILIARME</span>
      </a>

      {/* Right pill — WhatsApp "QUIERO AFILIARME"
          BRAND FIDELITY NOTE: #25D366 is the canonical WhatsApp brand green used
          here per user direction to match grupoemi.com exactly. WhatsApp's own
          brand guidelines specify #25D366 with white text as the correct usage,
          and the real grupoemi.com site uses this color in this exact position.
          Brand fidelity overrides WCAG AA on this specific CTA (contrast ~1.46:1).
          A text-shadow is added for perceptual legibility without altering the color.
          Hover darkens to #1ebe5a (a touch deeper than resting, same brand family).
          WhatsApp brand colors (#25D366, #1ebe5a) are intentional exceptions to
          the emi.* token rule — WhatsApp's brand guidelines regulate these values. */}
      <a
        href="https://wa.me/573153289888"
        target="_blank"
        rel="noopener noreferrer"
        title="WhatsApp · Atención inmediata"
        className={[
          'fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 print:hidden',
          'inline-flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 sm:py-2.5',
          'text-white text-xs sm:text-sm font-semibold uppercase tracking-wide',
          'shadow-card-hover transition-all duration-base ease-emi hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        ].join(' ')}
        style={{ backgroundColor: '#25D366' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1ebe5a'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#25D366'; }}
        aria-label="Quiero afiliarme por WhatsApp"
      >
        {/* WhatsApp icon — classic speech-bubble with handset (14×14 viewBox) */}
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 0C3.134 0 0 3.134 0 7c0 1.234.323 2.393.888 3.397L0 14l3.72-.868A6.965 6.965 0 0 0 7 14c3.866 0 7-3.134 7-7s-3.134-7-7-7z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M7 1C3.686 1 1 3.686 1 7c0 1.18.322 2.286.884 3.232L1.25 12.75l2.586-.62A5.966 5.966 0 0 0 7 13c3.314 0 6-2.686 6-6s-2.686-6-6-6z"
            fill="currentColor"
          />
          <path
            d="M5.1 4.5c-.15-.34-.31-.35-.45-.35-.12 0-.25 0-.39.01-.14.01-.36.05-.55.27
               C3.53 4.65 3 5.19 3 6.28c0 1.1.8 2.16.91 2.31.11.15 1.54 2.43 3.79 3.3
               1.88.73 2.26.58 2.67.55.41-.03 1.32-.54 1.5-1.06.19-.52.19-.97.13-1.06
               C11.94 10.24 11.8 10.18 11.6 10.08c-.2-.1-1.17-.58-1.35-.64
               C10.07 9.38 9.95 9.35 9.82 9.56 9.7 9.77 9.32 10.24 9.21 10.36
               9.1 10.48 8.99 10.5 8.79 10.4c-.2-.1-.84-.31-1.6-.99
               C6.52 8.78 6.07 8.04 5.96 7.83 5.85 7.62 5.95 7.51 6.05 7.41
               c.09-.09.2-.24.3-.36.1-.12.13-.2.2-.33.07-.14.03-.26-.02-.36
               C6.49 6.27 6.07 5.24 5.9 4.83 5.74 4.5 5.58 4.5 5.43 4.5H5.1z"
            fill="white"
          />
        </svg>
        <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>QUIERO AFILIARME</span>
      </a>

      <ToastViewport />
    </div>
  );
}

// ── Desktop nav link ──────────────────────────────────────────────────────────
function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-1.5 rounded-md text-sm font-medium transition-[background-color,color] duration-fast ease-emi',
          isActive
            ? 'bg-emi-red-50 text-emi-red-700 shadow-glow-red/30'
            : 'text-emi-ink-600 hover:text-emi-red-700 hover:bg-emi-red-50/60',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

// ── Mobile nav link ───────────────────────────────────────────────────────────
function MobileNavItem({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'px-3 py-3 rounded-md text-sm font-medium transition-[background-color,color] duration-fast',
          'min-h-[44px] flex items-center',
          isActive
            ? 'bg-emi-red-50 text-emi-red-700 font-semibold'
            : 'text-emi-ink-600 hover:bg-emi-ink-50 hover:text-emi-ink-900',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}

// ── Footer helpers ────────────────────────────────────────────────────────────
function FooterLinkGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">{heading}</h3>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-white/80 hover:text-white transition-colors duration-fast focus-visible:outline-none focus-visible:underline"
    >
      {children}
    </a>
  );
}
