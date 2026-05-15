- [Visual scope](scope.md) — Which PDF tasks the UI agent owns.
- [Tailwind tokens](tailwind.md) — Mobile-first, semantic class clusters, prefers-reduced-motion.
- [Accessibility floor](a11y.md) — Non-negotiable a11y baseline tests rely on.

## Durable visual decisions (updated 2026-05-15, rev 2)

### Rebrand — Grupo EMI Falck (updated)
Brand name corrected from "Grupo EMI Colombia" to **Grupo EMI Falck** (private security + medical emergencies, Colombia).
Logo lockup = `emi` + `FALCK` wordmark + red eagle. `BrandLogo` component now handles both real PNG and SVG fallback.

### Token — `emi.burgundy.*`
Added 11-stop scale for footer chrome and deep accents. DO NOT use for primary actions (that is `emi.red.*`).
- `emi.burgundy.600` = `#a8252e` — accessible on light backgrounds
- `emi.burgundy.700` = `#891f27`
- `emi.burgundy.800` = `#5c1822` — footer background main candidate
- `emi.burgundy.900` = `#3a0e16` — footer gradient target
- `emi.burgundy.950` = `#1f060a`

### Component — `BrandLogo` (`src/shared/components/BrandLogo.tsx`)
- Tries `/brand/emi-falck-logo.png` first; falls back to inline shield+cross SVG on `onError`.
- Props: `className` (default `'h-8 md:h-10 w-auto'`), `alt` (default `'Grupo EMI Falck'`).
- Lives in `shared/components/` — architecture: domain-agnostic, used by `app/` layout.
- React 18: no `forwardRef` needed (no `ref` required by callers).

### Footer composition (RootLayout)
- Root: `bg-emi-burgundy-800` (color fallback) + vendored PNG background via inline `style`.
- PNG: `public/brand/footer-background.png` (198 KB, fetched from live grupoemi.com via asset-fetcher 2026-05-15).
- Style: `backgroundImage: url('/brand/footer-background.png')`, `backgroundSize: cover`, `backgroundPosition: center`, `backgroundRepeat: no-repeat`.
- No dark overlay added — PNG is predominantly the same deep burgundy (#5c1822); white and text-white/60 contrast remains well above AA (~10:1).
- Previous CSS dot-pattern (`radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) / 8px 8px`) removed.
- Container: `max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16`.
- 3 CTA pills: solid red "Afíliate", outline-white "Paga tus facturas", white-on-burgundy "Portal cliente".
- 5-column link grid: Ayuda, Contacto, Legal, Formación, Recursos.
- Decorative country selector — `aria-hidden`, non-functional.
- Bottom row: Supersalud badge SVG + copyright + "Code challenge by Julian Nicholls".
- Disclaimer at 11px text.

### Footer hrefs corrected 2026-05-15
All footer `href` values in `RootLayout.tsx` updated to real Grupo EMI Falck Colombia destinations.
- Dedicated subdomains: `https://portal.grupoemi.com/` (Portal cliente), `https://pagosenlinea.grupoemi.com/pago/colombia` (Paga tus facturas), `https://emicolombia.info/` (Afíliate en línea + floating "QUIERO AFILIARME").
- Country-agnostic paths (no `/colombia/` prefix): `https://www.grupoemi.com/ayuda` (Ayuda group), `https://www.grupoemi.com/blog` (Recursos/Blog group).
- Unchanged verified paths: `/colombia/contactanos`, `/colombia/terminos-y-condiciones`, `/colombia/capacitaciones`.
- WhatsApp href `wa.me/573103305000` kept with inline `// TODO: confirm Grupo EMI Falck WhatsApp Business number`.

### Footer hrefs — final DOM-confirmed values (2026-05-15)
Real footer hrefs confirmed from live DOM — ecommerce (afiliación), portal/welcome, wa.me/573153289888. The 5 column links remain best-effort and may 404 per user direction.

### Floating CTA pattern (RootLayout — added 2026-05-15)
Two `fixed` pills rendered just before `<ToastViewport />` so toasts remain topmost.
- **Left (red, phone icon):** `fixed bottom-4 left-4 md:bottom-6 md:left-6 z-50 print:hidden` · `bg-emi-red-700 hover:bg-emi-red-800` · `shadow-card-hover transition-all duration-base ease-emi hover:scale-105` · links to grupoemi.com afiliacion.
- **Right (WhatsApp):** same positioning on `right-4/right-6` · background `#075E54` (darkest WhatsApp green, ~13.8:1 on white — passes AAA) with `#128C7E` on hover via inline `onMouseEnter/Leave` · `#25D366` bright green is WhatsApp brand but FAILS WCAG AA (1.46:1) with white text — used only as focus-ring color accent, not background · links to `wa.me/573103305000` (TODO: verify number).
- Both: `px-3 py-2 sm:px-4 sm:py-2.5` text `text-xs sm:text-sm` — safe at 320px viewport (≈150px each, 300px total = just fits).
- `hover:scale-105` is user-intent-only (hover), not autonomous — no `prefers-reduced-motion` guard needed.
- WhatsApp brand colors (`#25D366` resting, `#1ebe5a` hover) are a documented exception to the `emi.*` token rule — WhatsApp's brand guidelines regulate these values.
- Drawer uses `z-40`; CTAs use `z-50` — CTAs remain reachable even when drawer is open.
- **Brand fidelity overrode WCAG AA on the WhatsApp CTA (2026-05-15, per user direction):** `#25D366` chosen to match grupoemi.com exactly; text-shadow `0 1px 2px rgba(0,0,0,0.35)` added for perceptual legibility; contrast ~1.46:1 is expected and accepted.

### Container scale
- List pages (`main`, header): `max-w-7xl` (was `max-w-5xl`).
- Form pages: `max-w-2xl` (TaskNewPage, TaskEditPage — unchanged, correct).
- StatesPage inner: `max-w-lg` (unchanged, correct — single column form).

### Card layout fix (Task.tsx)
- Removed `md:flex-row md:items-start md:justify-between` from article.
- Article now `flex flex-col h-full gap-3`.
- Content area `flex-1 min-w-0 space-y-2`.
- Title `line-clamp-2`.
- Actions in `<footer className="flex items-center justify-end gap-2 pt-3 mt-auto border-t border-emi-ink-100">`.
- Grid updated to `sm:grid-cols-2` (was `md:grid-cols-2`) in TaskList.tsx for better tablet support.

## Durable visual decisions (updated 2026-05-15)

### Rebrand — Grupo EMI Colombia (private security + prehospital medical emergencies)
Executed 2026-05-15. Old identity (Escuela Militar de Ingeniería / Bolivia) fully replaced.

**Identity source:** Grupo EMI Colombia sector conventions (private security + emergency medical response).  
Corporate red `#D4001A` confirmed WCAG AA on white (contrast ratio ≈ 5.1:1 > 4.5:1 threshold).

**New palette anchors:**
- `emi.red.700`    = `#d4001a` — principal brand / corporate red (replaces `emi.granate.700` `#9b1b30`)
- `emi.red.800`    = `#aa0016` — hover / dark variant
- `emi.red.600`    = `#f50011` — vivid / focus ring
- `emi.accent.500` = `#f59e0b` — operational amber for status indicators (replaces `emi.gold.500` `#ecb910`)
- `emi.ink.800`    = `#26262a` — primary text (unchanged)
- `emi.cream`      = `#f8f8f8` — resting background (previously warm `#f9f6f1`, now clean neutral)

**Token strategy:**
- `emi.granate.*` aliased 1:1 to `emi.red.*` — zero churn in class names via tailwind.config.js
- `emi.gold.*` aliased 1:1 to `emi.accent.*` — backward compat preserved
- `shadow-glow-granate` shadow key kept, value updated to rgba(212,0,26,0.25)

**Logo:** Shield SVG replaced with security shield + medical cross (white cross on corporate red). No gold star, no escarapela.

**Footer:** "Escuela Militar de Ingeniería — Sistema de Gestión de Tareas" → "Grupo EMI Colombia — Gestión de Tareas Operativas"

**State badge decision (active state):**  
Red (`emi-red-700`) for "active" is intentionally on-brand for security/emergency context — reads as alert/in-progress, not error. This is documented in Task.tsx STATE_CONFIG.

**Focus ring:** Updated `ring-emi-granate-700` → `ring-emi-red-700` across index.css, layout, and interactive components.

## Durable visual decisions (appended 2026-05-15)

### Palette — EMI brand (Escuela Militar de Ingeniería)
- `emi.granate.700` = `#9b1b30` — primary institutional crimson (border-left active state, buttons, focus rings)
- `emi.granate.800` = `#7a1f2b` — hover/dark of primary
- `emi.gold.500`   = `#ecb910` — accent gold / escarapela (note dots, icons, progress bars)
- `emi.ink.800`    = `#26262a` — primary text
- `emi.cream`      = `#f9f6f1` — global background

### Typography
- Display/headings: `Fraunces` (Google Fonts, variable, serif) — institutional, distinctive
- UI body: `Inter` (Google Fonts) — legible, modern sans
- Fonts loaded via `@import` in `src/index.css`

### State → visual mapping (Task.tsx)
- `new`      → blue-400 dot, blue-50 badge, border-l-blue-400
- `active`   → emi-granate-700 dot, emi-granate-50 badge, border-l-emi-granate-700
- `resolved` → emerald-500 dot, emerald-50 badge, border-l-emerald-500
- `closed`   → emi-ink-400 dot, emi-ink-100 badge, border-l-emi-ink-400

### Animation patterns
- Page entrance: `gsap.fromTo(main, {autoAlpha:0, y:12}, {autoAlpha:1, y:0, 0.4s, power2.out})` on route change via `useLocation` dep
- Task list stagger: `gsap.fromTo(cards, {autoAlpha:0,y:10}, {autoAlpha:1,y:0, stagger:0.06, 0.35s})`
- Task card 3D hover: `rotateX ±4°, rotateY ±4°, translateZ 12px` on mousemove — scoped via `useGSAP`
- Check SVG tick draw: `strokeDashoffset` animation on toggle
- Mobile drawer: slide-in from right `x:100%→0%`, 0.3s power3.out
- Toast: slide-in from right `x:48→0`, autoAlpha fade; progress bar scaleX 1→0 over 4s
- 404: `rotateY -30→0°` entrance + continuous float `y -8px, sine.inOut, 2.5s, yoyo`
- All animations wrapped in `gsap.matchMedia()` — prefers-reduced-motion respected everywhere

### GSAP packages
- `gsap@3.15.0` + `@gsap/react@2.1.2` manually extracted to `node_modules/` (npm broken due to pnpm-lock.yaml conflict)
- Registered in `package.json` dependencies
- `useGSAP` registered with `gsap.registerPlugin(useGSAP)` in each component that uses it
- `ScrollTrigger` registered where needed

### Grid / responsive
- TaskList: `grid-cols-1` mobile / `md:grid-cols-2` / `xl:grid-cols-3`
- TaskForm: single col mobile, `md:grid-cols-2` for date+state section
- Nav: hamburger `<md` → animated drawer; desktop links `md+`
- Touch targets: all interactive elements ≥ 44px height

### A11y decisions
- Skip link: `.skip-link` → `#main-content`
- Focus visible: global `ring-2 ring-emi-granate-700 ring-offset-2 ring-offset-emi-cream`
- Checkbox replaced with `role="checkbox"` `aria-checked` button + SVG tick
- Toast error: `role="alert"`, toast info/success: `role="status"`
- Form errors: `aria-invalid`, `aria-describedby` pointing to error `<span id>`
- `data-testid="error-boundary-fallback"` preserved on both ErrorBoundary exports

### Tailwind shadows / transitions
- `shadow-card`: subtle card resting shadow
- `shadow-card-hover`: elevated on hover
- `shadow-glow-granate`: 3px ring glow for active pagination button
- `transition-*` classes use `ease-emi: cubic-bezier(0.22,1,0.36,1)` custom timing function
