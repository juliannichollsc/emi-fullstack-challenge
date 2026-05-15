---
name: jest-best-practices
description: Use when writing or reviewing Jest + React Testing Library tests for the EMI task-app. Covers config, RTL queries, async, mocks (incl. axios), file conventions, and AAA. Owned by the jest-tester agent.
---

# Jest Best Practices — EMI Task App

PDF Task 7 explicitly demands Jest. This skill encodes the rules so tests are durable, accessible-by-default, and aligned with the repo's architecture.

## Repo-specific config

`jest.config.ts` (project root):

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/features/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/types.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
```

`src/setupTests.ts` already imports `@testing-library/jest-dom` — keep it; both runners benefit.

## File conventions

- Tests live next to the unit in `__tests__/`.
- Filename: `Foo.test.tsx` (component) or `useFoo.test.ts` (hook/logic).
- Co-exists with Vitest. Don't delete Vitest tests; mirror them under Jest-runnable form (`vi.` → `jest.`).

## AAA structure

```ts
it('marks a task as completed', async () => {
  // Arrange
  const onToggle = jest.fn();
  render(<Task task={taskFixture} onToggle={onToggle} />);

  // Act
  await userEvent.click(screen.getByRole('checkbox', { name: /completed/i }));

  // Assert
  expect(onToggle).toHaveBeenCalledWith(taskFixture.id);
});
```

## Query priority (RTL)

1. `getByRole(role, { name })` — preferred; aligns with a11y.
2. `getByLabelText` — for form fields.
3. `getByPlaceholderText` — only when no label is possible.
4. `getByText` — for static content.
5. `getByTestId` — last resort. If you reach for this, fix the UI first.

## Async patterns

- User events are async: `await userEvent.click(...)`.
- Wait for the DOM, not a fixed delay: `await screen.findByRole(...)` or `await waitFor(...)`.
- Never `setTimeout` in tests.

## Mocks

### `taskService` via `jest.mock`

```ts
jest.mock('@features/tasks/services/taskService', () => ({
  taskService: {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));
```

### Axios (see `axios-specialist` skill for full coverage)

Prefer `axios-mock-adapter` over hand-rolled `jest.mock('axios')`:

```ts
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';

const mock = new MockAdapter(httpClient);
afterEach(() => mock.reset());

it('surfaces a 500 as a user-facing error', async () => {
  mock.onGet('/tasks').reply(500);
  // ...assert ToastContext displays the error
});
```

## Fixtures

Type from the domain — never `any`:

```ts
import type { Task } from '@features/tasks/types';

export const taskFixture: Task = {
  id: '1',
  title: 'Complete Project Proposal',
  description: 'Prepare and submit.',
  dueDate: '2023-12-15',
  completed: false,
  stateHistory: [{ state: 'new', date: '2023-12-01' }],
  notes: ['Check guidelines'],
};
```

## Anti-patterns (never)

- DOM snapshots (`toMatchSnapshot` on rendered output).
- Asserting CSS classes — assert behavior.
- Mocking the Provider — render the real `TaskProvider`.
- Mocking `useReducer` — write a separate reducer-only test.
- `getByTestId('btn')` instead of `getByRole('button', { name: /save/i })`.

## Coverage target

- `src/features/tasks/` ≥ 80% on all metrics.
- At minimum (PDF compliance): one component fully tested. Aim for `TaskForm` first.

## Commands

```bash
pnpm test:jest                 # Jest only
pnpm test:jest -- --coverage   # Jest with coverage
pnpm test                      # Vitest (keep green)
```

## Scope anchor

Test against the contract in `doc/Code Challenge EMI 1 (1).pdf` and the shape in `doc/db 1.json`. If a behavior isn't required by those documents, don't add a test for it.
