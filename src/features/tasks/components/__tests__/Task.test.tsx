// Task 7 — Task component unit tests (Jest + RTL).
// Tests drive through props API only; no Provider needed for pure-props component.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
// Import the gsap mock directly so we can inspect its mock functions.
// moduleNameMapper routes 'gsap' → src/__mocks__/gsap.ts, so we get the same instance Task.tsx uses.
import { gsap as gsapMock } from 'gsap';
// Import useGSAP directly — jest.requireMock returns a DIFFERENT reference than
// what Task.tsx sees at module resolution time. The direct named import is the
// same object the component's module graph resolves, so mockImplementationOnce
// applies to the correct function reference.
import { useGSAP as mockUseGSAP } from '@gsap/react';
import { Task } from '../Task';
import type { Task as TaskModel } from '../../types/task.types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const baseFixture: TaskModel = {
  id: '1',
  title: 'Test task',
  description: 'A description',
  dueDate: '2025-01-01',
  completed: false,
  stateHistory: [
    { state: 'new', date: '2024-11-01' },
    { state: 'active', date: '2024-12-01' },
  ],
  notes: ['First note', 'Second note'],
};

// ── Helper ────────────────────────────────────────────────────────────────────

const renderTask = (props: Partial<React.ComponentProps<typeof Task>> = {}) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Task task={baseFixture} {...props} />
    </MemoryRouter>,
  );

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  it('renders title and description', () => {
    // Arrange + Act
    renderTask();
    // Assert
    expect(screen.getByText('Test task')).toBeInTheDocument();
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('shows the LAST state from stateHistory', () => {
    // Arrange + Act — stateHistory has 'new' then 'active'; last must win
    renderTask();
    // Assert: 'Activo' is the Spanish label mapped from 'active'
    expect(screen.getByText('Activo')).toBeInTheDocument();
    // 'Nuevo' (new) must NOT appear as active badge
    expect(screen.queryByText('Nuevo')).not.toBeInTheDocument();
  });

  it('renders the due date', () => {
    // Arrange + Act
    renderTask();
    // Assert
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
  });

  it('renders notes (up to 2 visible)', () => {
    // Arrange + Act
    renderTask();
    // Assert
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('shows +N más when there are more than 2 notes', () => {
    // Arrange
    const task: TaskModel = { ...baseFixture, notes: ['Note 1', 'Note 2', 'Note 3'] };
    // Act
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Task task={task} />
      </MemoryRouter>,
    );
    // Assert
    expect(screen.getByText(/\+1 más/)).toBeInTheDocument();
  });

  // ── Interactions ────────────────────────────────────────────────────────────

  it('calls onToggleComplete with task id when checkbox button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onToggle = jest.fn();
    renderTask({ onToggleComplete: onToggle });

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete with task id when delete button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = jest.fn();
    renderTask({ onDelete });

    // Act
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('renders an edit link pointing to /tasks/:id/edit', () => {
    // Arrange + Act
    renderTask();
    // Assert
    const editLink = screen.getByRole('link', { name: /editar/i });
    expect(editLink).toHaveAttribute('href', '/tasks/1/edit');
  });

  it('does not call onToggleComplete when no handler is provided', async () => {
    // Arrange — no onToggleComplete prop
    const user = userEvent.setup();
    renderTask();

    // Act — clicking should not throw
    await user.click(screen.getByRole('checkbox'));

    // Assert — no error thrown (pure smoke test)
    expect(true).toBe(true);
  });

  // ── Completed state ─────────────────────────────────────────────────────────

  it('shows Completada badge when task.completed is true', () => {
    // Arrange + Act
    renderTask({ task: { ...baseFixture, completed: true } });
    // Assert
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('does not show Completada badge when task.completed is false', () => {
    // Arrange + Act
    renderTask();
    // Assert
    expect(screen.queryByText('Completada')).not.toBeInTheDocument();
  });

  it('reflects aria-checked true when task is completed', () => {
    // Arrange + Act
    renderTask({ task: { ...baseFixture, completed: true } });
    // Assert
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects aria-checked false when task is not completed', () => {
    // Arrange + Act
    renderTask();
    // Assert
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('mounts without throwing when task.completed is true (SVG animation branch)', () => {
    // Arrange — completed:true activates the useGSAP branch at lines 79-82.
    // In jsdom checkPathRef.current is null so the gsap.from call is guarded by
    // "if (!path) return". The test confirms the component mounts cleanly.

    // Act + Assert — no throw
    expect(() => {
      renderTask({ task: { ...baseFixture, completed: true } });
    }).not.toThrow();

    // Completed badge is rendered, confirming the completed branch ran
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  // ── State config branches ───────────────────────────────────────────────────

  it('falls back to "Nuevo" config when state is unknown', () => {
    // Arrange — unknown state should fall back to STATE_CONFIG.new → label "Nuevo"
    const task: TaskModel = {
      ...baseFixture,
      stateHistory: [{ state: 'mystery-state', date: '2024-01-01' }],
    };

    // Act
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Task task={task} />
      </MemoryRouter>,
    );

    // Assert — falls back to "Nuevo" label (covers getStateConfig ?? branch)
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  // ── Notes branch ────────────────────────────────────────────────────────────

  it('handles notes stored as objects with content field', () => {
    // Arrange — notes as object array (covers the object-branch at line 101)
    const task: TaskModel = {
      ...baseFixture,
      notes: [{ content: 'obj note' } as unknown as string],
    };

    // Act
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Task task={task} />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText('obj note')).toBeInTheDocument();
  });

  // ── GSAP hover animation branches (Task.tsx lines 42-72) ───────────────────
  //
  // Strategy: useGSAP fires its callback synchronously in the mock, but at that
  // moment cardRef.current is null (React has not yet committed the DOM). We use
  // mockImplementationOnce on the DIRECT import of useGSAP (not jest.requireMock —
  // those return different object references) to capture the first useGSAP callback
  // WITHOUT calling it. After render() the ref is populated, then we invoke the
  // captured callback inside act(). The gsap.matchMedia mock calls the inner
  // callback immediately, so addEventListener('mousemove', onEnter) and
  // addEventListener('mouseleave', onLeave) are called on the real article node.
  // Firing those events covers the onEnter/onLeave branches.

  it('triggers hover transform on mousemove and resets on mouseleave', () => {
    // Arrange
    const gsapTo = (gsapMock as unknown as { to: jest.Mock }).to;
    let hoverCb: (() => void) | null = null;

    // Intercept ONLY the first useGSAP call (hover setup).
    // The second call (SVG animation) falls through to the default mock.
    (mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
      hoverCb = cb;
    });

    // Act — render commits the DOM and populates cardRef.current
    const { container } = renderTask();
    const article = container.querySelector('article') as HTMLElement;

    // Invoke the captured callback now that the ref is populated.
    // matchMedia.add() fires its inner callback synchronously, attaching
    // addEventListener on the real article node.
    act(() => {
      article.getBoundingClientRect = () => ({
        left: 0, top: 0, width: 200, height: 100,
        right: 200, bottom: 100, x: 0, y: 0,
        toJSON: () => ({}),
      });
      if (hoverCb) hoverCb();
    });

    // Fire mousemove → triggers onEnter → calls gsap.to (rotateX/rotateY)
    act(() => {
      fireEvent(article, new MouseEvent('mousemove', {
        bubbles: true, clientX: 150, clientY: 60,
      }));
    });

    // Assert — gsap.to called for enter transform (line 50-54)
    expect(gsapTo).toHaveBeenCalledTimes(1);
    expect(gsapTo).toHaveBeenCalledWith(article, expect.objectContaining({ rotateX: expect.any(Number) }));

    // Fire mouseleave → triggers onLeave → calls gsap.to (reset)
    act(() => {
      fireEvent(article, new MouseEvent('mouseleave', { bubbles: false }));
    });

    // Assert — second gsap.to call for leave reset (lines 57-62)
    expect(gsapTo).toHaveBeenCalledTimes(2);
    expect(gsapTo).toHaveBeenLastCalledWith(article, expect.objectContaining({ rotateX: 0, rotateY: 0 }));
  });

  // ── GSAP hover cleanup branches (Task.tsx lines 68-69) ────────────────────
  //
  // After the matchMedia.add() inner callback registers event listeners and
  // returns the cleanup fn, that fn is stored in matchMediaCleanups. Calling
  // matchMediaInstance.revert() (via gsap.matchMedia().revert()) invokes all
  // stored cleanups — covering the removeEventListener lines 68-69.

  it('runs hover cleanup (removeEventListener) when matchMedia reverts', () => {
    // Arrange — same setup as the hover transform test
    let hoverCb: (() => void) | null = null;
    (mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
      hoverCb = cb;
    });

    const { container } = renderTask();
    const article = container.querySelector('article') as HTMLElement;

    act(() => {
      article.getBoundingClientRect = () => ({
        left: 0, top: 0, width: 200, height: 100,
        right: 200, bottom: 100, x: 0, y: 0,
        toJSON: () => ({}),
      });
      if (hoverCb) hoverCb();
    });

    // Act — trigger revert, which invokes the stored cleanup (lines 68-69)
    act(() => {
      // gsap.matchMedia() returns the singleton matchMediaInstance whose
      // revert() fires all collected cleanups (removeEventListener calls).
      const mm = (gsapMock as unknown as { matchMedia: jest.Mock }).matchMedia();
      mm.revert();
    });

    // Assert — no throw; the cleanup ran and removed the event listeners.
    // Verify event listeners are gone: mousemove no longer triggers gsap.to.
    const gsapTo = (gsapMock as unknown as { to: jest.Mock }).to;
    act(() => {
      fireEvent(article, new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 50 }));
    });
    // After revert, listeners are removed — gsap.to should NOT have been called.
    expect(gsapTo).not.toHaveBeenCalled();
  });

  // ── SVG animation second useGSAP callback (Task.tsx lines 79-82) ───────────
  //
  // The second useGSAP call handles the SVG check animation. In jsdom, refs are
  // set after React commits the DOM, but the mock fires callbacks synchronously
  // during render (before commit). We capture BOTH useGSAP callbacks via two
  // mockImplementationOnce calls and invoke the second one after render so
  // checkPathRef.current is populated. This covers lines 79-82.

  it('runs SVG check animation when completed is true', () => {
    // Arrange — capture both useGSAP callbacks before rendering
    const gsapFrom = (gsapMock as unknown as { from: jest.Mock }).from;
    const gsapSet = (gsapMock as unknown as { set: jest.Mock }).set;

    // First useGSAP call = hover setup (lines 38-73); we skip invoking it.
    (mockUseGSAP as jest.Mock).mockImplementationOnce((_cb: () => void) => {
      // Do not call — we only care about the second call
    });

    let svgCb: (() => void) | null = null;
    // Second useGSAP call = SVG animation (lines 76-84)
    (mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
      svgCb = cb;
    });

    // Act — render with completed: true so the gsap.from branch at line 82 fires
    const { container } = renderTask({ task: { ...baseFixture, completed: true } });

    // Patch getTotalLength on the real SVG path so the mock can use a real length
    const pathEl = container.querySelector('path[d="M1 5 L4.5 8.5 L11 1"]') as SVGPathElement;
    if (pathEl) {
      pathEl.getTotalLength = () => 20;
    }

    act(() => {
      if (svgCb) svgCb();
    });

    // Assert — gsap.set was called (line 80) and gsap.from was called (line 82)
    expect(gsapSet).toHaveBeenCalled();
    expect(gsapFrom).toHaveBeenCalled();
  });

  it('runs SVG check animation when completed is false (gsap.from not called)', () => {
    // Arrange — completed: false, so gsap.from branch (line 81-83) is skipped
    const gsapFrom = (gsapMock as unknown as { from: jest.Mock }).from;
    const gsapSet = (gsapMock as unknown as { set: jest.Mock }).set;

    (mockUseGSAP as jest.Mock).mockImplementationOnce((_cb: () => void) => {
      // Skip first useGSAP (hover setup)
    });

    let svgCb: (() => void) | null = null;
    (mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
      svgCb = cb;
    });

    const { container } = renderTask({ task: { ...baseFixture, completed: false } });

    const pathEl = container.querySelector('path[d="M1 5 L4.5 8.5 L11 1"]') as SVGPathElement;
    if (pathEl) {
      pathEl.getTotalLength = () => 20;
    }

    act(() => {
      if (svgCb) svgCb();
    });

    // Assert — gsap.set was called (line 80) but gsap.from was NOT called (line 81 false branch)
    expect(gsapSet).toHaveBeenCalled();
    expect(gsapFrom).not.toHaveBeenCalled();
  });

  // ── handleToggle animation branches (Task.tsx lines 91-96) ─────────────────
  //
  // handleToggle creates its own matchMedia and calls mm.add(). The mock's add()
  // fires the inner callback synchronously, which calls gsap.to. The branch
  // `task.completed ? len : 0` determines strokeDashoffset.

  it('animates the check path when toggling on a completed task', async () => {
    // Arrange — completed: true → ternary produces `len` (strokeDashoffset non-zero)
    const user = userEvent.setup();
    const onToggle = jest.fn();
    const gsapTo = (gsapMock as unknown as { to: jest.Mock }).to;

    renderTask({ task: { ...baseFixture, completed: true }, onToggleComplete: onToggle });

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert — gsap.to invoked inside matchMedia callback; onToggle propagated
    expect(gsapTo).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('animates the check path when toggling on an incomplete task', async () => {
    // Arrange — completed: false → ternary produces `0` (strokeDashoffset = 0)
    const user = userEvent.setup();
    const onToggle = jest.fn();
    const gsapTo = (gsapMock as unknown as { to: jest.Mock }).to;

    renderTask({ task: { ...baseFixture, completed: false }, onToggleComplete: onToggle });

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert
    expect(gsapTo).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
