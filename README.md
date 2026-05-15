# EMI · Task Management Application

Aplicación web de gestión de tareas construida con **React 18 + TypeScript + Vite**. Soporta CRUD de tareas, paginación, historial de estados, manejo de errores resiliente, animaciones con GSAP y un layout responsive mobile-first. La capa de datos se sirve contra `json-server` apuntando a `public/db.json`, por lo que el frontend funciona end-to-end sin un backend real.

---

## Tabla de contenidos

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Setup rápido](#setup-rápido)
- [Scripts](#scripts)
- [Variables de entorno](#variables-de-entorno)
- [Workflow asistido por IA (Claude Code)](#workflow-asistido-por-ia-claude-code)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Aliases de imports](#aliases-de-imports)
- [Modelo de datos](#modelo-de-datos)
- [Routing](#routing)
- [State management](#state-management)
- [Capa HTTP](#capa-http)
- [Manejo de errores](#manejo-de-errores)
- [Performance](#performance)
- [Responsive design](#responsive-design)
- [Testing](#testing)
- [Convenciones de código](#convenciones-de-código)
- [Troubleshooting](#troubleshooting)

---

## Stack

| Capa | Tecnología |
|---|---|
| Build / dev server | Vite 5 |
| UI | React 18 + TypeScript 5.6 |
| Routing | React Router v6 (`createBrowserRouter`, lazy routes) |
| Estado | Context API + `useReducer` |
| Estilos | Tailwind CSS 3 (mobile-first) |
| Animaciones | GSAP 3 + `@gsap/react` |
| HTTP | Axios 1.7 + `axios-retry` |
| Mock backend | `json-server` sobre `public/db.json` |
| Tests | Vitest + Jest + React Testing Library + `axios-mock-adapter` |
| Package manager | **pnpm** (obligatorio) |

---

## Requisitos

- **Node.js** 18.18 o superior (recomendado 20 LTS).
- **pnpm** 9 o superior (`npm i -g pnpm`). Este repo usa `pnpm-workspace.yaml` con `allowBuilds:` para autorizar el postinstall de `esbuild`; otros package managers no están soportados.

---

## Setup rápido

```bash
pnpm install
```

Para desarrollo necesitas **dos terminales** corriendo en paralelo:

```bash
# Terminal 1 — mock backend
pnpm api

# Terminal 2 — dev server
pnpm dev
```

- App: <http://localhost:5173>
- API mock: <http://localhost:3001>

Si abres la app sin que `pnpm api` esté arriba verás "Unexpected error" en la lista de tareas: el frontend no puede contactar al backend.

---

## Scripts

```bash
pnpm dev                   # Vite dev server (HMR) — http://localhost:5173
pnpm api                   # json-server con watch sobre public/db.json — http://localhost:3001
pnpm build                 # tsc -b && vite build (producción)
pnpm preview               # sirve el build estático
pnpm lint                  # ESLint sobre todo el repo
pnpm test                  # Vitest en modo watch
pnpm test:ui               # Vitest con UI interactiva
pnpm test:coverage         # Vitest con cobertura V8
pnpm test:jest             # Jest (suite paralela a Vitest)
pnpm test:jest:coverage    # Jest con gate de cobertura
pnpm test:e2e              # Playwright — abre tu navegador predeterminado y prueba las Tasks 1–10 + Bonus
pnpm test:e2e:demo         # Modo presentación: lento + cursor rojo visible (SLOW_MO=2000, pausa 3 s)
pnpm test:e2e:ui           # Playwright en modo UI interactivo
pnpm test:e2e:report       # abre el último HTML report
```

---

## Variables de entorno

Variables expuestas por Vite (prefijo `VITE_`):

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | URL base que consume la instancia de Axios. Cambiar para apuntar a un backend real. |

Define `.env.development` y/o `.env.production` en la raíz si necesitas overrides.

---

## Workflow asistido por IA (Claude Code)

Este repo está diseñado para colaborar con **Claude Code** bajo un patrón **multi-agente determinístico**. Toda la configuración vive en `.claude/` y se versiona con el código, de modo que cualquier persona que clone el proyecto reproduce el mismo comportamiento de IA sin pasos manuales.

### Arquitectura de agentes (`.claude/agents/`)

Un **orquestador** actúa como router puro: recibe cada prompt, recupera el contexto del proyecto y delega — **en paralelo** cuando aplica — a especialistas con responsabilidad acotada. Esta separación elimina la deriva típica de un único agente "todo-terreno" y mantiene el código alineado con la arquitectura del repo.

| Agente | Modelo | Responsabilidad |
|---|---|---|
| `orchestrator` | opus | Router único de cada prompt. Analiza, recupera contexto de `doc/` y delega. **Nunca implementa.** |
| `tech-engineer` | sonnet | Único implementador de código no-UI / no-test: state, HTTP, hooks, error handling, performance, routing y refactors arquitectónicos. |
| `ui-designer` | sonnet | Componentes, Tailwind, layout responsive, GSAP, accesibilidad y UX. |
| `jest-tester` | sonnet | Tests unit/component con Jest + React Testing Library, mocks, fixtures y cobertura. |
| `e2e-tester` | sonnet | Specs Playwright corriendo sobre el binario **Brave** ya instalado en la máquina (sin descargar Chromium). |

**Reglas de delegación**:

- Cada prompt entra obligatoriamente por el orquestador — no se permite implementación directa.
- Si el prompt cruza dominios, los especialistas se invocan **en paralelo** con múltiples `Agent` calls dentro de un solo mensaje.
- Si UI o tests requieren una superficie nueva (un hook, un reducer, un service), `tech-engineer` corre primero para crearla y los demás corren después en paralelo contra esa superficie ya estable.
- El orquestador reconcilia las salidas y devuelve un único resumen al usuario.

### Skills (`.claude/skills/`)

Los **skills** son contratos versionados que cada agente carga al entrar. Funcionan como playbooks ejecutables del repo: el agente no inventa convenciones — las consulta.

**Skills internos creados para este proyecto**:

| Skill | Cargado por | Encapsula |
|---|---|---|
| `architecture-guard` | **Todos los agentes (siempre)** | Validación de capas, dependencias unidireccionales y aliases antes de tocar archivos. |
| `axios-specialist` | `tech-engineer`, `jest-tester` | Patrón Axios + interceptores + retries idempotentes + propagación de `AbortSignal` + mocks con `axios-mock-adapter`. |
| `state-management` | `tech-engineer` | Patrón Context + `useReducer` con doble contexto (state/dispatch) y selectores memoizados. |
| `jest-best-practices` | `jest-tester` | Configuración Jest + ts-jest + jsdom, AAA, prioridad de queries RTL, fixtures tipadas, threshold de cobertura 80%. |
| `playwright-e2e` | `e2e-tester` | Lanzamiento de Brave existente vía `executablePath`, DB de prueba aislada en `e2e/.tmp/db.test.json`, puertos dedicados (5174 + 3002) para no chocar con `pnpm dev`/`pnpm api`. |

**Skills externos vendored** (los carga `ui-designer` según el tipo de petición):

- Familia GSAP completa: `gsap-core`, `gsap-timeline`, `gsap-react`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, `gsap-utils`, `gsap-frameworks`.
- Diseño y UX: `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max`.
- React/Next.js performance: `vercel-react-best-practices`.

### Hooks y guardrails (`.claude/settings.json`)

- **Stop hook**: tras cerrar cada prompt se ejecuta `pnpm lint` (con fallback a `npx --yes eslint .`). El árbol queda limpio de forma continua sin intervención manual.
- **Allowlist** acotada a comandos pnpm/jest seguros para Bash y PowerShell — reduce los prompts de permiso para los flujos cotidianos.
- **Denylist** explícita para operaciones destructivas (`rm -rf /*`, `Format-Volume`, `Invoke-Expression`, etc.) como defensa en profundidad incluso dentro del sandbox.

### Memoria persistente

Cada agente mantiene su propia memoria en `.claude/agents/memory/<agent>/`, con un `MEMORY.md` índice y archivos por tema (`scope.md`, `architecture.md`, `tailwind.md`, `a11y.md`, `conventions.md`, `coexistence.md`, …). Las entradas usan frontmatter tipado (`type: project | feedback | reference | user`) con tres bloques: la regla, un `Why` que justifica la decisión, y un `How to apply` que acota cuándo aplicarla. La siguiente sesión arranca con el contexto acumulado en lugar de re-descubrirlo.

### Documentación de requerimientos y arquitectura

La carpeta `doc/` concentra el contrato funcional y arquitectónico al que el proyecto debe responder:

- `architecture.md` — el rule-set arquitectónico (capas, dependencias, aliases) que el skill `architecture-guard` materializa.
- `checklist.md` — checklist de entrega.
- Un breakdown por módulo funcional (`00-overview.md` … `10-responsive.md`, `bonus-state-form.md`).

Los agentes consultan estos documentos al iniciar para mantener cualquier cambio dentro del alcance original.

### Garantías por construcción

- Cada **prompt** pasa por el orquestador → no se rompe la división de responsabilidades.
- Cada **archivo nuevo** atraviesa `architecture-guard` → no entra acoplamiento cross-feature ni imports relativos profundos.
- Cada **prompt cerrado** dispara ESLint → no se acumulan warnings ni código muerto.
- Cada **llamada HTTP** pasa por el interceptor → la UI sólo ve `HttpError` con mensajes amigables.
- Cada **agente** acumula su aprendizaje en su memoria → la siguiente sesión arranca con el contexto, no desde cero.

---

## Arquitectura

Diseño **feature-sliced** con dependencias unidireccionales:

```
┌──────────────────────────────────────────────────┐
│  pages/             screens conectadas a rutas   │
├──────────────────────────────────────────────────┤
│  features/*/components   features/*/hooks        │
│  features/*/context      features/*/services     │
│  features/*/types        features/*/index.ts     │
├──────────────────────────────────────────────────┤
│  shared/components  shared/hooks  shared/context │
│  shared/utils       shared/types                 │
├──────────────────────────────────────────────────┤
│  app/router  app/providers  app/layouts          │
└──────────────────────────────────────────────────┘
```

**Reglas duras:**

1. `pages/` puede importar de `features/` y `shared/`.
2. `features/` puede importar de `shared/`, **no** de otras features (única excepción documentada: `TaskForm` consume `useStateCatalog` porque el dropdown de estados es un selector lógico transversal).
3. `shared/` no importa de `features/` ni `pages/`.
4. `app/` es el único punto de composición — provee router, providers y layouts.
5. Cada feature expone su superficie pública por `index.ts` (barrel); el resto es interno.
6. Los componentes son funciones nombradas (`export function Component`); `export default` se reserva para páginas (compatibilidad con `React.lazy`).

---

## Estructura de carpetas

```
emi-task-app/
├── .claude/                          ← Configuración multi-agente de Claude Code
│   ├── agents/
│   │   ├── orchestrator.md           ← Router puro (opus); nunca implementa
│   │   ├── tech-engineer.md          ← Implementador de state, HTTP, hooks, perf
│   │   ├── ui-designer.md            ← Componentes, Tailwind, GSAP, a11y
│   │   ├── jest-tester.md            ← Tests unit/component (Jest + RTL)
│   │   ├── e2e-tester.md             ← Specs Playwright sobre Brave local
│   │   └── memory/<agent>/           ← Memoria persistente por agente
│   ├── skills/
│   │   ├── architecture-guard/       ← Capas + deps unidireccionales + aliases
│   │   ├── axios-specialist/         ← Patrón Axios + retries + AbortSignal
│   │   ├── state-management/         ← Context + useReducer + doble contexto
│   │   ├── jest-best-practices/      ← Config Jest + AAA + queries RTL
│   │   ├── playwright-e2e/           ← Brave local + DB aislada + puertos dedicados
│   │   ├── frontend-design/          ← Diseño de componentes (vendored)
│   │   ├── web-design-guidelines/    ← Heurísticas UX (vendored)
│   │   ├── ui-ux-pro-max/            ← Patrones UX avanzados (vendored)
│   │   ├── vercel-react-best-practices/  ← React/Next perf (vendored)
│   │   └── gsap-*/                   ← Familia GSAP completa (vendored)
│   └── settings.json                 ← Stop hook (eslint) + allow/denylist
├── doc/                              ← Requerimientos y rule-set arquitectónico
│   ├── architecture.md               ← Capas, deps unidireccionales, aliases
│   ├── checklist.md                  ← Checklist de entrega
│   ├── 00-overview.md … 10-*.md      ← Breakdown por módulo funcional
│   └── bonus-state-form.md
├── e2e/                              ← Specs Playwright (uno por módulo)
│   ├── fixtures.ts                   ← seedDb (auto: true) desde el dataset semilla
│   ├── global-setup.ts
│   ├── seed.mjs
│   └── *.spec.ts
├── public/
│   └── db.json                       ← Dataset mock (servido por json-server)
├── src/
│   ├── app/
│   │   ├── router.tsx                ← createBrowserRouter + lazy routes
│   │   ├── providers/
│   │   │   └── AppProviders.tsx      ← Composición de Providers globales
│   │   └── layouts/
│   │       └── RootLayout.tsx        ← Shell con header + <Outlet />
│   ├── features/
│   │   ├── tasks/
│   │   │   ├── components/           ← Task, TaskList, TaskForm
│   │   │   ├── context/              ← TaskContext + reducer
│   │   │   ├── hooks/                ← useTasks
│   │   │   ├── services/             ← taskService (CRUD)
│   │   │   ├── types/                ← Task, StateName
│   │   │   └── index.ts              ← Barrel público
│   │   └── states/
│   │       ├── components/           ← StateForm
│   │       ├── context/              ← StateContext + catálogo
│   │       ├── hooks/                ← useStateCatalog
│   │       ├── services/             ← stateService
│   │       ├── types/
│   │       └── index.ts
│   ├── pages/                        ← TaskListPage, TaskDetailPage, TaskNewPage,
│   │                                   TaskEditPage, StatesPage, NotFoundPage
│   ├── shared/
│   │   ├── components/               ← ErrorBoundary, Pagination, PageSpinner, ToastViewport
│   │   ├── context/                  ← ToastContext
│   │   ├── hooks/                    ← usePagination
│   │   ├── types/                    ← api.ts (tipos transversales)
│   │   └── utils/                    ← httpClient (Axios), http (HttpError)
│   ├── main.tsx
│   ├── index.css                     ← Tailwind directives
│   ├── setupTests.ts                 ← matchers para Vitest
│   └── setupJestEnv.ts               ← env para Jest
├── package.json
├── pnpm-workspace.yaml
├── vite.config.ts
├── tsconfig.app.json
├── jest.config.ts
└── tailwind.config.ts
```

---

## Aliases de imports

Definidos en `vite.config.ts` y `tsconfig.app.json`. Úsalos siempre en lugar de rutas relativas profundas (`../../../`).

| Alias | Resuelve a |
|---|---|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@pages/*` | `src/pages/*` |

```ts
// ✅ Bien
import { httpClient } from '@shared/utils/httpClient';
import { useTasks } from '@features/tasks';

// ❌ Mal
import { httpClient } from '../../../shared/utils/httpClient';
```

---

## Modelo de datos

`public/db.json` expone dos colecciones que json-server convierte automáticamente en endpoints REST.

```ts
type Task = {
  id?: string;                                       // json-server lo asigna en POST
  title: string;
  description: string;
  dueDate: string;                                   // formato YYYY-MM-DD
  completed: boolean;
  stateHistory: { state: string; date: string }[];  // el último es el estado actual
  notes: string[];                                   // se requiere al menos 1
};

type StateName = 'new' | 'active' | 'resolved' | 'closed';
```

Endpoints expuestos por json-server:

| Método | Path | Acción |
|---|---|---|
| `GET` | `/tasks` | Lista (soporta `?_page=&_limit=`, headers `X-Total-Count`) |
| `GET` | `/tasks/:id` | Detalle |
| `POST` | `/tasks` | Crea (json-server asigna `id`) |
| `PUT` / `PATCH` | `/tasks/:id` | Actualiza |
| `DELETE` | `/tasks/:id` | Elimina |
| `GET` | `/states` | Catálogo de estados |

---

## Routing

`src/app/router.tsx` usa `createBrowserRouter` con rutas **lazy** envueltas en `<Suspense>` + un `errorElement` global.

| Path | Componente | Descripción |
|---|---|---|
| `/` | `<Navigate to="/tasks" replace />` | Redirección |
| `/tasks` | `TaskListPage` | Listado paginado |
| `/tasks/new` | `TaskNewPage` | Formulario de creación |
| `/tasks/:id` | `TaskDetailPage` | Detalle |
| `/tasks/:id/edit` | `TaskEditPage` | Formulario de edición |
| `/states` | `StatesPage` | CRUD de estados |
| `*` | `NotFoundPage` | 404 |

Todas las páginas se cargan con `React.lazy` para code-splitting por ruta.

---

## State management

Context + `useReducer` por feature. La estructura típica:

```
features/<dom>/
├── context/
│   ├── <Dom>Context.tsx        ← Provider + reducer
│   └── __tests__/
│       └── <dom>Reducer.test.ts
└── hooks/
    └── use<Dom>.ts             ← hook público con selectores
```

- Los reducers son **puras**: reciben `(state, action)` y retornan estado nuevo. Se testean en aislamiento.
- Los servicios (`features/<dom>/services/`) son llamados desde **efectos** dentro del provider, nunca desde componentes.
- Los hooks (`useTasks`, `useStateCatalog`) son la única API pública del estado. Ningún componente toca `useContext` directamente.

---

## Capa HTTP

Una sola instancia de Axios en `src/shared/utils/httpClient.ts`. Los servicios la consumen; los componentes **nunca** importan `axios`.

```ts
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
```

**Reintentos** (`axios-retry`): 1 reintento sobre 5xx o errores de red, solo en métodos idempotentes (GET / HEAD / OPTIONS), con 500ms de backoff.

**Interceptor de respuesta**: mapea cualquier fallo a `HttpError(status, message, body)` antes de re-lanzar, de modo que los servicios y el UI solo ven un tipo de error consistente. Las cancelaciones (`AbortController`) se re-lanzan sin envolver para que el llamador pueda filtrarlas con `axios.isCancel`.

---

## Manejo de errores

Tres niveles complementarios:

1. **`HttpError`** (`shared/utils/http.ts`) — error tipado con `status`, `message` legible y `body` opcional. Es lo que ven los reducers/UI.
2. **`ErrorBoundary`** (`shared/components/ErrorBoundary.tsx`) — registrado como `errorElement` del router. Captura cualquier error de render no manejado y muestra un fallback amigable.
3. **`ToastContext`** (`shared/context/ToastContext.tsx`) — emite notificaciones para acciones del usuario (creación, edición, eliminación). El viewport vive en `RootLayout`.

Los reducers exponen `status: 'idle' | 'loading' | 'success' | 'error'` y un `error?: HttpError` para que los componentes rendericen el estado correcto sin truco extra.

---

## Performance

- **Code-splitting por ruta** con `React.lazy` + `Suspense`.
- **`React.memo`** en items de listas (`Task`).
- **`useMemo` / `useCallback`** en selectores y handlers que se pasan a componentes memoizados.
- **Paginación server-side** (`?_page=&_limit=`) — el listado nunca carga todo el dataset.
- **Reintentos limitados** a métodos idempotentes para evitar duplicar mutaciones.

---

## Responsive design

- Tailwind con enfoque **mobile-first**: los estilos base aplican en móvil; los breakpoints (`sm:`, `md:`, `lg:`, `xl:`) progresivamente refinan.
- Grids fluidas en listas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Tipografía y spacings escalan con utilidades responsive de Tailwind.
- Tooltips/menus reemplazados por sheets/drawers en viewports angostos cuando aplica.

---

## Testing

El repo soporta **dos runners en paralelo**:

| Runner | Comando | Uso |
|---|---|---|
| Vitest | `pnpm test` | Ejecución rápida con HMR, integrada con Vite |
| Jest | `pnpm test:jest` | Suite paralela con cobertura formal |

Ambos comparten `@testing-library/react`, `@testing-library/user-event` y `@testing-library/jest-dom` (matchers cargados en `src/setupTests.ts`).

**Convenciones:**

- Tests **junto al archivo bajo prueba** dentro de `__tests__/`.
- Prioridad de queries RTL: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.
- Estructura **AAA** (Arrange, Act, Assert) sin comentarios redundantes.
- HTTP se mockea con `axios-mock-adapter` sobre la instancia `httpClient`.
- El módulo `httpClient` tiene un manual mock en `src/shared/utils/__mocks__/httpClient.ts` para Jest.
- Los reducers se testean **puros**, sin renderizar componentes.
- Para componentes que dependen del Context, se usa el `Provider` real con un estado inicial controlado, no mocks.

Para ejecutar un archivo específico:

```bash
pnpm test src/features/tasks/components/__tests__/Task.test.tsx
pnpm test:jest src/features/tasks/context/__tests__/TaskContext.test.tsx
```

### Tests end-to-end con Playwright (tu navegador real)

Un tercer runner, `@playwright/test`, corre la suite **`e2e/*.spec.ts`** abriendo el navegador real del sistema y ejercitando cada PDF Task (1–10 + Bonus) de extremo a extremo: lista → paginación → formulario → ruta → persistencia contra `json-server` → errores → responsive.

| Concepto | Detalle |
|---|---|
| Test runner | `@playwright/test` (Microsoft, Apache-2.0) |
| Navegador | **Auto-detectado** del registro de Windows (`HKCU\…\UrlAssociations\http\UserChoice\ProgId`). Soporta Brave, Chrome, Edge, Opera, Vivaldi y Yandex. Si tu predeterminado no es Chromium-based (Firefox, Safari), cae a Brave → Chrome → Edge. |
| Binarios | **No descarga ningún navegador**. Usa el que ya tienes instalado vía `executablePath`. |
| Dev server | Vite en `:5174` (no conflictúa con `pnpm dev` en `:5173`). |
| Mock API | `json-server` en `:3002` con un db aislado `e2e/.tmp/db.test.json` semillado desde `doc/db 1.json`. Tu `public/db.json` queda intacto. |
| Visibilidad | Modo *headed* por defecto + `SLOW_MO=1000` para que veas cada acción. Pausa de 2 s entre tests para análisis humano. |

#### Configurar en Windows (los pasos que usé)

1. **Tener Brave, Chrome o Edge instalado** (el predeterminado del sistema). Verifica con:
   ```powershell
   node e2e/resolve-default-browser.mjs
   ```
   Debe imprimir la ruta a tu `.exe`.

2. **Asegurar que los puertos `5174` y `3002` estén libres**. Si chocan, los puedes cambiar editando `playwright.config.ts` (`VITE_PORT` / `API_PORT`).

3. **Instalar dependencias** una vez:
   ```powershell
   pnpm install
   ```
   Esto agrega `@playwright/test` a `devDependencies`. No se descargan navegadores adicionales.

4. **Correr la suite**:
   ```powershell
   pnpm test:e2e
   ```
   Verás tu navegador abrirse, navegar, hacer clics y rellenar formularios. Cada acción ~1 segundo, con 2 s de pausa entre tests.

#### Variables de entorno

| Variable | Default | Para qué |
|---|---|---|
| `BROWSER_PATH` | auto-detectado | Forzar un binario concreto (ej. para CI). |
| `SLOW_MO` | `1000` ms | Tiempo entre acciones individuales. `0` para CI. |
| `INTER_TEST_PAUSE_MS` | `2000` ms | Pausa entre tests para análisis humano. |
| `HEADLESS` | desactivado | Setear a `1` para correr sin ventana visible (CI). |
| `VISUAL_CURSOR` | desactivado | Setear a `1` para inyectar un puntito rojo que sigue cada acción de Playwright (`pnpm test:e2e:demo` lo activa automáticamente). |

#### Modo demo / presentación

Para mostrar la suite a alguien en vivo:

```powershell
# Toda la suite en modo presentación (cursor rojo, slowMo 2 s, pausa 3 s entre tests).
pnpm test:e2e:demo

# Sólo un spec (recomendado para demos cortas — Task 4 dura ~1 minuto).
pnpm test:e2e:demo -- 04-task-form

# Personalizar el ritmo de la demo sin tocar el script.
$env:SLOW_MO='3000'; $env:INTER_TEST_PAUSE_MS='4000'; pnpm test:e2e:demo
```

El cursor visible es un overlay HTML que sigue los eventos sintéticos del DevTools Protocol — no es el cursor del SO, sólo un puntito rojo (22 px) con borde blanco y resplandor que pulsa en amarillo en cada click. Cero binarios extras, cero deps nuevas, no interfiere con la página.

#### Otros ejemplos

```powershell
# CI rápido sin ventana
$env:SLOW_MO='0'; $env:INTER_TEST_PAUSE_MS='0'; $env:HEADLESS='1'; pnpm test:e2e

# Forzar Chrome aunque el predeterminado sea otro
$env:BROWSER_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; pnpm test:e2e

# Sólo un spec en modo normal
pnpm test:e2e -- 04-task-form
```

#### Mapping PDF Task → spec

| PDF Task | Spec | Asercion principal |
|---|---|---|
| 1 Project setup | `e2e/01-project-setup.spec.ts` | `/` redirecciona a `/tasks`, header EMI visible |
| 2 Task component | `e2e/02-task-component.spec.ts` | Card muestra title/desc/dueDate/lastState/notes + Editar/Eliminar |
| 3 TaskList + paginación | `e2e/03-task-list.spec.ts` | 5/página, mark-as-completed persiste |
| 4 TaskForm + validación | `e2e/04-task-form.spec.ts` | Errores inline, submit válido crea y redirecciona |
| 5 Routing | `e2e/05-routing.spec.ts` | Todas las rutas + 404 |
| 6 State management | `e2e/06-state-management.spec.ts` | Tarea creada sobrevive reload (verificado contra json-server) |
| 7 Testing (cross-cutting) | `e2e/07-testing.spec.ts` | Smoke completo: toggle complete + delete |
| 8 Error handling | `e2e/08-error-handling.spec.ts` | 500 simulado muestra panel `role="alert"` |
| 9 Performance | `e2e/09-performance.spec.ts` | Lazy chunk llega solo al navegar a `/states` |
| 10 Responsive | `e2e/10-responsive.spec.ts` | 3 viewports, sin overflow horizontal |
| Bonus | `e2e/bonus-state-form.spec.ts` | Crear / rechazar duplicado |

#### Reportes y debugging

- `pnpm test:e2e:report` abre el HTML report del último run con trazas, screenshots y videos de los fallos.
- `pnpm test:e2e:ui` abre el modo interactivo (paso a paso, time-travel debugging).

---

## Convenciones de código

- **TypeScript strict** habilitado. Sin `any`; usar `unknown` + narrowing cuando sea necesario.
- **Sin comentarios obvios.** Comentar solo el *porqué* cuando una constraint no se deduce del código.
- **Funciones puras** en utils y reducers.
- **Componentes pequeños** — si un componente supera ~150 líneas, partirlo.
- **Sin imports relativos profundos**: usar aliases.
- **Naming**:
  - Hooks: `useX`.
  - Contextos: `XContext` + `XProvider`.
  - Servicios: `xService` con métodos `list / get / create / update / remove`.
  - Tipos: `PascalCase`, sin prefijo `I`.
- **ESLint** debe pasar siempre; `pnpm lint` se ejecuta en CI y como gate local.

---

## Troubleshooting

**"Unexpected error" en la lista de tareas**

Significa que la instancia de Axios no pudo contactar al backend. Causas más comunes:

- `pnpm api` no está corriendo. Arráncalo en una segunda terminal.
- `VITE_API_URL` apunta a un puerto/host distinto al que escucha json-server.
- Otro proceso ocupa el puerto `3001`. Cambia el puerto en el script `api` y la variable `VITE_API_URL`.

Verifica rápidamente que el backend responde:

```bash
curl http://localhost:3001/tasks
```

**El build falla con errores de tipos en aliases**

Asegúrate de que `tsconfig.app.json` y `vite.config.ts` declaran los mismos aliases. Reinicia el TS server del IDE tras cambios en `tsconfig`.

**`pnpm install` se queda colgado en postinstall**

Es `esbuild` pidiendo permiso. `pnpm-workspace.yaml` lo autoriza vía `allowBuilds:`. Si lo modificas, ejecuta `pnpm approve-builds esbuild` o restaura la entrada.

**Tests de Jest fallan importando `import.meta.env`**

Jest mockea `httpClient` mediante `src/shared/utils/__mocks__/httpClient.ts`. Asegúrate de que el test ejecuta `jest.mock('@shared/utils/httpClient')` si depende de la instancia real.

**Cambios en `public/db.json` no se reflejan**

`json-server` corre con `--watch`, pero algunos editores escriben con archivos temporales que rompen el watcher. Reinicia `pnpm api` tras cambios manuales grandes.
