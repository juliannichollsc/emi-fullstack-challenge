# Arquitectura

## Principios

1. **Feature-sliced design** — cada dominio (`tasks`, `states`) es autocontenido (componentes, contexto, hooks, servicios, tipos).
2. **Dependencias unidireccionales**:
   - `pages/` puede importar de `features/` y `shared/`.
   - `features/` puede importar de `shared/`, no de otras features (excepción documentada: `TaskForm` consume `useStateCatalog` porque el dropdown de estados es un selector lógico común).
   - `shared/` no importa de `features/` ni `pages/`.
3. **`app/` es el punto de composición** — provee router, providers y layouts.

## Capas

```
┌──────────────────────────────────────────────────┐
│  pages/             (rutas, screens)             │
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

## Aliases TS / Vite

| Alias | Resuelve a |
|---|---|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@pages/*` | `src/pages/*` |

Definidos tanto en `vite.config.ts` como en `tsconfig.app.json` para evitar imports relativos profundos.

## Convenciones

- Cada feature exporta su superficie pública por `index.ts` (barrel) — el resto es interno.
- Los componentes son funciones nombradas; `default` se reserva para páginas (compatibilidad con `React.lazy`).
- Tipos del dominio viven en `features/<dom>/types/`; tipos transversales en `shared/types/`.
- Tests viven junto al archivo bajo prueba en `__tests__/`.

## Datos mock (`public/db.json`)

```json
{
  "tasks": [ { "id": "...", "title": "...", ... } ],
  "states": [ { "name": "new" }, { "name": "active" }, ... ]
}
```

> Nota: el `db.json` original del reto no incluye `id` por task. El servicio asume que **json-server lo agrega automáticamente** en `POST`. Si se quiere migrar a UUIDs, generar `id: crypto.randomUUID()` en `taskService.create`.

## Flujo de datos

```
UI → hook (useTasks)
   → context (TaskProvider)
   → service (taskService)
   → http() helper
   → json-server
   → db.json
```

Sentido inverso para actualizaciones (response del service → dispatch al reducer → re-render selectivo).

## Estrategia de testing

- Unit tests de componentes con RTL (no test ids salvo necesidad).
- Servicios: mocks de `fetch` con `vi.fn()`.
- No se mockea el contexto en tests de componente: se renderiza con el `Provider` real cuando aplica.

## Extensión futura

- **Backend real**: cambiar `VITE_API_URL`. La capa de servicio queda intacta.
- **Auth**: añadir `AuthProvider` en `app/providers`, gate de rutas con un `RequireAuth`.
- **i18n**: añadir un `IntlProvider`; los textos ya viven en componentes y son fáciles de extraer.
