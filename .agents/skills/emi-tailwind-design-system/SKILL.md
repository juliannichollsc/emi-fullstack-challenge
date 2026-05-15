---
name: emi-tailwind-design-system
description: Design-system rules for the EMI task-app — Tailwind v3.4 + React 18, JS-config tokens (no @theme), feature-sliced architecture, and the Grupo EMI Falck brand palette (corporate red / burgundy / ink). Use whenever writing or reviewing Tailwind classes, building components, designing pages, or auditing visual consistency. Adapted from wshobson/tailwind-design-system (v4) for our v3 stack.
metadata:
  derived_from: https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system
  tailwind_target: 3.4.x
  react_target: 18.3.x
  license_note: Original under MIT (wshobson/agents). This adaptation rewritten for project stack — no upstream code copied verbatim.
---

# EMI Task-App Design System

CSS-first design tokens **do not apply here** — the project is on **Tailwind v3.4 + React 18**. All theme tokens live in `tailwind.config.js` under `theme.extend.colors.emi.*`. The skill encodes the rules every agent should follow when touching Tailwind classes in this repo.

> Brand context: **Grupo EMI Falck Colombia** — private security + prehospital medical emergencies. Visual language is corporate red on burgundy/ink, NOT institutional gold/granate. See `.claude/agents/memory/ui-designer/MEMORY.md`.

## When to use this skill

Load on entry whenever you will:

- Write or review JSX with Tailwind classes
- Add or edit `tailwind.config.js`
- Build a new component (Task, layout, page, shared)
- Audit visual consistency, contrast, or responsive behavior
- Reference a color, radius, shadow, or motion token

## Hard rules (non-negotiable)

1. **Tailwind v3 syntax only.** No `@theme`, no `@custom-variant`, no `oklch()`, no `@import "tailwindcss"`. Use `@tailwind base/components/utilities` + `tailwind.config.js`.
2. **React 18 syntax only.** `forwardRef` for components that need a `ref`. **Never** treat `ref` as a regular prop (that is React 19, not on this project).
3. **Token namespace is `emi.*`.** Do not introduce new top-level color families. Extend `emi.{red,burgundy,accent,ink}` if needed.
4. **No new dependencies** without escalating to `tech-engineer`. CVA, `clsx`, `tailwind-merge` are NOT installed — use template literal joins (`[a, b].join(' ')`).
5. **Mobile-first.** Bare classes target mobile; use `sm: md: lg: xl:` to scale up.
6. **Architecture aliases.** Use `@app`, `@features`, `@shared`, `@pages` — never relative deep imports.
7. **Domain shape is locked** to `doc/db 1.json`. Visual changes never invent fields.

## Token reference (current `tailwind.config.js`)

```ts
emi: {
  red:     { 50…950 }   // corporate red, principal = 700 (#d4001a)
  granate: { 50…950 }   // alias → re-points to emi.red.* (legacy consumers)
  accent:  { 50…950 }   // controlled amber, principal = 500 (#f59e0b)
  gold:    { 50…950 }   // alias → re-points to emi.accent.* (legacy consumers)
  ink:     { 50…950 }   // neutral carbon, primary text = 800 (#26262a)
  cream:    '#f8f8f8'   // resting background — clean neutral
}
```

Additional tokens already in config:
- `boxShadow`: `card`, `card-hover`, `glow-red`, `glow-granate` (alias of `glow-red`), `glow-gold` (amber)
- `transitionTimingFunction.emi`: `cubic-bezier(0.22, 1, 0.36, 1)`
- `transitionDuration`: `fast` 150ms, `base` 250ms, `slow` 400ms
- `fontFamily`: `serif` (Fraunces, Georgia), `sans` (Inter, system-ui)

### Pending additions (when needed)

When the footer / navbar requires it, extend `emi.*` with **`burgundy`** (the deep wine-red of the real grupoemi.com footer):

```ts
emi: {
  // ...existing
  burgundy: {
    50:  '#fdf2f3',
    100: '#fce4e6',
    200: '#f8c5ca',
    300: '#f098a0',
    400: '#e36670',
    500: '#cb3a47',
    600: '#a8252e',  // primary burgundy on light bg
    700: '#891f27',
    800: '#5c1822',  // footer bg main candidate
    900: '#3a0e16',  // footer bg deeper candidate
    950: '#1f060a',
  },
}
```

Do NOT replace `emi.red.*` — `burgundy` is a sibling, used for **footer chrome and deep accents only**.

## Hierarchy of intent

```
Brand tokens (emi.red.700, emi.burgundy.800)
   └── Semantic role (primary CTA, alert state, footer chrome)
       └── Component class (btn-primary, .badge, .card)
```

When you reach for a hex value, stop. Use the token. New hex needs to be either a token or an explicit `style={{ ... }}` justified by a comment.

## Patterns (Tailwind v3 + React 18)

### Pattern 1 — Variant component with template literals (no CVA)

```tsx
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLS: Record<Variant, string> = {
  primary:   'bg-emi-red-700 text-white hover:bg-emi-red-800 focus-visible:ring-emi-red-700',
  secondary: 'bg-white text-emi-ink-800 border border-emi-ink-200 hover:bg-emi-ink-50 focus-visible:ring-emi-ink-400',
  danger:    'bg-white text-emi-red-700 border border-emi-red-200 hover:bg-emi-red-50 focus-visible:ring-emi-red-700',
  ghost:     'text-emi-ink-600 hover:bg-emi-ink-50 hover:text-emi-ink-900 focus-visible:ring-emi-ink-300',
};

const SIZE_CLS: Record<Size, string> = {
  sm: 'h-9  px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'primary', size = 'md', className = '', ...rest },
  ref,
) {
  const cls = [
    'inline-flex items-center justify-center gap-2 rounded-md font-medium',
    'transition-colors duration-base ease-emi',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANT_CLS[variant],
    SIZE_CLS[size],
    className,
  ].join(' ');
  return <button ref={ref} className={cls} {...rest} />;
});
```

**Why this shape and not CVA?** CVA + `clsx` + `tailwind-merge` would add 3 deps. Project uses native template-literal joins everywhere (see `Task.tsx:106–112`). Match the convention.

### Pattern 2 — Card layout that does NOT strangle the title

The bug we just hit: `md:flex-row md:justify-between` puts actions on the right and squeezes content inside a 340-px grid column. Fix:

**Option A — Actions docked at bottom (preferred for cards in dense grids):**

```tsx
<article className="card border-l-4 border-l-emi-red-700 p-4 flex flex-col gap-3 h-full">
  {/* Content grows */}
  <div className="flex-1 min-w-0 space-y-2">
    <header className="flex items-start gap-3">
      <Checkbox /> {/* fixed width */}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-semibold text-base leading-snug line-clamp-2 text-emi-ink-900">
          {task.title}
        </h3>
        <p className="mt-1 text-sm text-emi-ink-500 line-clamp-2">{task.description}</p>
      </div>
    </header>
    {/* meta, dates, notes */}
  </div>
  {/* Actions docked at bottom — always full width of card */}
  <footer className="flex items-center justify-end gap-2 pt-3 border-t border-emi-ink-100">
    <EditLink />
    <DeleteButton />
  </footer>
</article>
```

**Option B — Two-row header for wide cards (when grid is 1–2 cols):**

```tsx
<article className="card border-l-4 p-4 flex flex-col gap-3">
  <div className="flex items-start gap-3 justify-between">
    <div className="flex-1 min-w-0">
      <h3 className="line-clamp-2 ...">{task.title}</h3>
    </div>
    <div className="flex-shrink-0 flex gap-2">{/* actions */}</div>
  </div>
  {/* rest */}
</article>
```

**The non-negotiables for either option:**

- Title wrapper: `flex-1 min-w-0` (prevents overflow into siblings)
- Title text: `line-clamp-2` (truncation that does not push siblings)
- Actions container: `flex-shrink-0` (never gets squeezed)
- Grid: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` with container `max-w-7xl` (1280px) — not `max-w-5xl` (1024px)
- Card height: `h-full` so cards in a row match height; container needs `items-stretch` (grid default)

### Pattern 3 — Pill CTA for the EMI footer

```tsx
// Solid red pill
<a className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold
              bg-emi-red-700 text-white hover:bg-emi-red-800 transition-colors duration-base ease-emi
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emi-burgundy-800">
  Afíliate en línea
</a>

// Outline (over dark burgundy)
<a className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold
              border border-white/80 text-white hover:bg-white/10 transition-colors">
  Paga tus facturas
</a>

// Inverted (white on burgundy)
<a className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold
              bg-white text-emi-burgundy-800 hover:bg-emi-cream transition-colors">
  Portal cliente
</a>
```

### Pattern 4 — Dotted-pattern footer chrome

The real grupoemi.com footer uses a subtle radial-dot texture. In v3 use an inline `style`:

```tsx
<footer
  className="bg-emi-burgundy-800 text-white"
  style={{
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '8px 8px',
  }}
>
  ...
</footer>
```

### Pattern 5 — Responsive container scale

| Surface | Container | Justification |
|---|---|---|
| Marketing footer | `max-w-7xl` (1280px) | matches grupoemi.com chrome |
| Task grid | `max-w-7xl` | gives 3 cols room to breathe at xl |
| Forms (single column) | `max-w-2xl` | reading width 640px |
| Detail pages | `max-w-4xl` | richer prose + side info |

The current project uses `max-w-5xl` (1024px) everywhere — **upgrade the task-list container to `max-w-7xl`** so 3-col grid actually fits cards comfortably.

### Pattern 6 — Brand-logo component (when `public/brand/emi-falck-logo.png` exists)

```tsx
// src/shared/components/BrandLogo.tsx
import { useState } from 'react';

interface Props {
  className?: string;
  alt?: string;
}

export function BrandLogo({ className = 'h-8 md:h-10 w-auto', alt = 'Grupo EMI Falck' }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FallbackShield className={className} aria-label={alt} />;
  }
  return (
    <img
      src="/brand/emi-falck-logo.png"
      alt={alt}
      className={className}
      onError={() => {
        console.warn('[BrandLogo] /brand/emi-falck-logo.png failed to load — falling back to inline SVG');
        setFailed(true);
      }}
    />
  );
}

function FallbackShield({ className, ...rest }: { className?: string } & React.SVGAttributes<SVGSVGElement>) {
  // keep the current inline shield SVG verbatim as a fallback
  return (
    <svg viewBox="0 0 32 36" className={className} fill="none" {...rest}>
      {/* ... existing shield … */}
    </svg>
  );
}
```

## Anti-patterns — do NOT do these in this repo

1. **`@theme { --color-*: ... }`** — v4 CSS-first syntax. Project uses `tailwind.config.js` JS extends. Will not compile.
2. **`oklch(...)` color values** — v4-era. Use hex in the token config.
3. **`ref` as a regular prop** (`function Btn({ ref, ... }: Props & { ref?: Ref<...> })`) — React 19 only. We are on 18. Use `React.forwardRef`.
4. **CVA / `class-variance-authority`** — not installed. Use template-literal joins.
5. **`cn()` from `tailwind-merge`** — not installed. Use `[a, b, c].join(' ')` or `clsx`-style concat.
6. **`@custom-variant dark (&:where(.dark, .dark *))`** — v4 only. Dark mode is currently **out of scope** for this PDF; do not add unless requested.
7. **`bg-slate-*` / `bg-gray-*` / Tailwind default palette for chrome** — chrome must go through `emi.*` tokens.
8. **Absolute-positioned action buttons over card titles** — strangles content (see the bug we just fixed).
9. **`max-w-5xl` for task grids at xl** — too narrow. Use `max-w-7xl`.
10. **New top-level color families in `tailwind.config.js`** — extend `emi.*` instead.

## Accessibility checklist (must pass before shipping)

- All interactive elements: `focus-visible:ring-2 focus-visible:ring-offset-2` + the relevant `focus-visible:ring-emi-*` color.
- Text/background contrast ≥ **4.5:1** for normal text, ≥ **3:1** for large/bold.
  - `text-emi-red-700` on white = 5.1:1 ✅
  - `text-white` on `bg-emi-red-700` = 5.1:1 ✅
  - `text-white` on `bg-emi-burgundy-800` = ~10:1 ✅ (deeper)
  - `text-emi-ink-500` on white = 7.4:1 ✅
  - Avoid `text-emi-ink-300` on white = 2.9:1 ❌ (only OK on `bg-emi-ink-50`)
- Touch targets: min `h-11` (44px) on mobile, `min-h-11` on action rows.
- `aria-label` on every icon-only button. `aria-hidden="true"` on decorative SVGs.
- Skip link present (`<a href="#main-content" className="skip-link">`).
- `prefers-reduced-motion` respected — wrap GSAP in `gsap.matchMedia()`.

## Audit checklist (run after any visual edit)

- [ ] All hex values are in `tailwind.config.js`, not in JSX (except brand SVG fills).
- [ ] No `slate-*`, `gray-*`, `zinc-*`, `red-*` (without `emi-` prefix) in chrome.
- [ ] Every container uses `mx-auto px-4 md:px-6 lg:px-8` + a `max-w-*` ceiling.
- [ ] Mobile-first: bare class is the smallest viewport, `md:`/`lg:` scale up.
- [ ] Cards have `flex-1 min-w-0` on content wrappers and `flex-shrink-0` on action rows.
- [ ] `forwardRef` used; no `ref`-as-prop.
- [ ] No new npm deps unless `tech-engineer` agreed.

## Migration note (do not action)

Tailwind v4 + React 19 are not on the upgrade path for this code challenge. Do not propose either as a precondition. When v4 patterns from the upstream wshobson skill seem useful (e.g., container queries, `@starting-style` entry animations), translate them to v3 equivalents inside this skill instead of asking to upgrade.

## Related memory & skills

- `architecture-guard` — load before any file write to keep feature slices clean.
- `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines` — visual-quality reviewers; treat this skill as the **stack-specific overlay** on top of their generic guidance.
- `.claude/agents/memory/ui-designer/MEMORY.md` — durable rebrand decisions (Grupo EMI Falck palette adoption, alias strategy).

## Credit

Adapted from [`wshobson/agents` → `plugins/frontend-mobile-development/skills/tailwind-design-system`](https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system) (MIT). The original targets Tailwind v4 + React 19; this skill rewrites the same intent for our Tailwind v3.4 + React 18 stack with the Grupo EMI Falck brand. No upstream code is included verbatim.
