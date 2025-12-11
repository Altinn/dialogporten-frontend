import { renderHook } from '@testing-library/react';
import { SystemLabel } from 'bff-types-generated';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { useDialogActions } from './useDialogActions';

vi.mock('@altinn/altinn-components', () => ({
  useSnackbar: () => ({ openSnackbar: vi.fn() }),
  SnackbarDuration: { normal: 3000 },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../../useGlobalState.ts', () => ({
  useGlobalState: () => [false, vi.fn()],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/queries', () => ({
  updateSystemLabel: vi.fn(),
}));

describe('useDialogActions', () => {
  it('returns archive and delete actions for Default (inbox)', () => {
    const { result } = renderHook(() => useDialogActions(), {
      wrapper: MemoryRouter,
    });
    const actions = result.current('abc123', [SystemLabel.Default], false);

    const ids = actions.map((item) => item.id);
    expect(ids).toContain('archive');
    expect(ids).toContain('delete');
    expect(ids).not.toContain('undo');
  });

  it('returns undo and delete actions for Archive', () => {
    const { result } = renderHook(() => useDialogActions(), {
      wrapper: MemoryRouter,
    });
    const actions = result.current('abc123', [SystemLabel.Archive], false);

    const ids = actions.map((item) => item.id);
    expect(ids).toContain('undo');
    expect(ids).toContain('delete');
    expect(ids).not.toContain('archive');
  });

  it('returns undo and archive actions for Bin', () => {
    const { result } = renderHook(() => useDialogActions(), {
      wrapper: MemoryRouter,
    });
    const actions = result.current('abc123', [SystemLabel.Bin], true);

    const ids = actions.map((item) => item.id);
    expect(ids).toContain('undo');
    expect(ids).toContain('archive');
    expect(ids).not.toContain('delete');
  });

  it('returns empty array if dialogId is undefined', () => {
    const { result } = renderHook(() => useDialogActions(), {
      wrapper: MemoryRouter,
    });
    const actions = result.current('', [SystemLabel.Default], false);

    expect(actions).toEqual([]);
  });
});
