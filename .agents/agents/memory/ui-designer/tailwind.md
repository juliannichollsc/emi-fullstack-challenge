---
name: tailwind
description: Tailwind conventions for the EMI task-app.
metadata:
  type: feedback
---

- Mobile-first: write base classes for mobile, layer `md:` / `lg:` upward.
- Don't hard-code colors — extend `tailwind.config.js` when a new token is needed.
- Repeated class clusters → extract into a `cn()` helper or a wrapping component.
- Animations and transitions must respect `prefers-reduced-motion: reduce`.

**Why:** Task 10 requires responsiveness; PDF expects polished UI; a11y is non-negotiable for senior bar.

**How to apply:** before committing any visual file, mentally check at 360px / 768px / 1280px.
