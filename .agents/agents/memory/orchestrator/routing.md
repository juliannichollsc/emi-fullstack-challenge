---
name: routing
description: Which subagent handles which intent. Used to decide delegation each prompt.
metadata:
  type: reference
---

| Intent | Agent | Skills the agent loads |
|---|---|---|
| UI / Tailwind / responsive / animation / GSAP / a11y | `ui-designer` | frontend-design, web-design-guidelines, ui-ux-pro-max, gsap-*, vercel-react-best-practices, architecture-guard |
| Unit / integration tests, mocks, coverage | `jest-tester` | jest-best-practices, axios-specialist (when relevant), architecture-guard |
| HTTP / axios / interceptors / services | `tech-engineer` | axios-specialist, architecture-guard |
| State / context / reducer / hooks | `tech-engineer` | state-management, vercel-react-best-practices, architecture-guard |
| Routing / lazy / performance / error handling | `tech-engineer` | vercel-react-best-practices, axios-specialist, architecture-guard |
| Architecture / refactor / aliases / config | `tech-engineer` | architecture-guard |

**Orchestrator never implements.** When a prompt mixes intents, spawn the relevant subagents in a single message with multiple Agent tool calls so they run in parallel. If one agent needs a seam from another (e.g., UI needs a hook from tech-engineer), spawn tech-engineer first, then UI + tests in parallel.
