---
name: scope
description: UI surface area owned by ui-designer agent, mapped to PDF tasks.
metadata:
  type: project
---

PDF Task → component the UI agent owns:

- Task 2 → `src/features/tasks/components/Task.tsx`
- Task 3 → `src/features/tasks/components/TaskList.tsx` + `src/shared/components/Pagination.tsx`
- Task 4 → `src/features/tasks/components/TaskForm.tsx`
- Task 10 → All components must be responsive (Tailwind `md:`, `lg:`)
- Bonus → `src/features/states/components/StateForm.tsx`

Pages are composition only — they import from features.

**Why:** keeps visual logic in features, leaves pages as thin route shells.

**How to apply:** when asked to "build the X page", build the feature components first, then compose them in `pages/`.
