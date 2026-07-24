import { renderHook } from '@testing-library/react';
import { SystemLabel } from 'bff-types-generated';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageRoutes } from '../routes';
import { useDialogActions } from './useDialogActions';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

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

  describe('navigation back to the originating list', () => {
    const dialogId = 'abc123';
    const search = '?party=urn%3Aaltinn%3Aperson&search=snø';

    const renderOnDialogDetails = (fromView?: string) =>
      renderHook(() => useDialogActions(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <MemoryRouter initialEntries={[{ pathname: `/inbox/${dialogId}`, search, state: { fromView } }]}>
            {children}
          </MemoryRouter>
        ),
      });

    const clickAction = (actions: ReturnType<ReturnType<typeof useDialogActions>>, id: string) => {
      const action = actions.find((item) => item.id === id);
      expect(action).toBeDefined();
      action!.onClick?.();
    };

    beforeEach(() => {
      navigateMock.mockClear();
    });

    it.each([
      ['archive', SystemLabel.Default],
      ['delete', SystemLabel.Default],
      ['mark-as-unread', SystemLabel.Default],
    ])('navigates back to the originating view with scrollToId for "%s"', (actionId, label) => {
      const { result } = renderOnDialogDetails(PageRoutes.sent);
      clickAction(result.current(dialogId, [label], false), actionId);

      expect(navigateMock).toHaveBeenCalledWith(PageRoutes.sent + search, { state: { scrollToId: dialogId } });
    });

    it('falls back to inbox when there is no originating view', () => {
      const { result } = renderOnDialogDetails();
      clickAction(result.current(dialogId, [SystemLabel.Default], false), 'archive');

      expect(navigateMock).toHaveBeenCalledWith(PageRoutes.inbox + search, { state: { scrollToId: dialogId } });
    });

    it('navigates to inbox when undoing from the archive, not back to the archive', () => {
      const { result } = renderOnDialogDetails(PageRoutes.archive);
      clickAction(result.current(dialogId, [SystemLabel.Archive], false), 'undo');

      expect(navigateMock).toHaveBeenCalledWith(PageRoutes.inbox + search, { state: { scrollToId: dialogId } });
    });

    it.each(['archive', 'delete', 'mark-as-unread'])(
      'does not navigate for "%s" when triggered from the dialog list',
      (actionId) => {
        const { result } = renderHook(() => useDialogActions(), {
          wrapper: ({ children }: { children: ReactNode }) => (
            <MemoryRouter initialEntries={[{ pathname: PageRoutes.inbox, search }]}>{children}</MemoryRouter>
          ),
        });
        clickAction(result.current(dialogId, [SystemLabel.Default], false), actionId);

        expect(navigateMock).not.toHaveBeenCalled();
      },
    );
  });
});
