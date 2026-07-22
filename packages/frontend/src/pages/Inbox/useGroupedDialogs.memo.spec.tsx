import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { DialogStatus } from 'bff-types-generated';
import { SystemLabel } from 'bff-types-generated';
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useGlobalState } from '../../useGlobalState.ts';
import type { InboxItemInput } from './InboxItemInput.ts';
import useGroupedDialogs from './useGroupedDialogs.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useFormat: vi.fn(),
}));

const makeItem = (id: string, contentUpdatedAt: string): InboxItemInput => ({
  id,
  party: 'urn:altinn:person:identifier-no:14886498226',
  title: `Dialog ${id}`,
  summary: 'summary',
  sender: { name: 'Digitaliseringsdirektoratet', type: 'company' },
  recipient: { name: 'Hjelpelinje Ordinær', type: 'person' },
  isContentSeen: false,
  unread: true,
  seenSinceLastContentUpdate: [],
  fromServiceOwnerTransmissionsCount: 0,
  fromPartyTransmissionsCount: 0,
  contentUpdatedAt,
  guiAttachmentCount: 0,
  createdAt: contentUpdatedAt,
  status: 'NEW' as DialogStatus,
  label: [SystemLabel.Default],
  org: 'digdir',
  seenByLabel: 'Sett av deg',
  seenByOthersCount: 0,
  viewType: 'inbox' as InboxViewType,
  viewTypes: ['inbox'],
  seenByLog: { collapsible: true, endUserLabel: 'Sett av deg', items: [] },
});

const items = [makeItem('dialog-1', '2025-02-24T14:00:21.642Z'), makeItem('dialog-2', '2025-02-24T13:55:45.689Z')];

const onSeenByLogModalChange = () => {};
const onAccessInfoModalChange = () => {};

describe('useGroupedDialogs memoization', () => {
  const t = vi.fn((key) => key);
  const format = vi.fn((date) => date.toString());

  beforeEach(() => {
    (useTranslation as Mock).mockReturnValue({ t });
    (useFormat as Mock).mockReturnValue(format);
  });

  it('keeps groupedDialogs identity across re-renders and recomputes on bulk selection', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => {
        const [, forceRender] = useReducer((n: number) => n + 1, 0);
        const [bulkMode] = useGlobalState<boolean>(QUERY_KEYS.BULK_MODE, false);
        const grouped = useGroupedDialogs({
          items,
          displaySearchResults: false,
          viewType: 'inbox',
          isLoading: false,
          hasNextPage: false,
          onSeenByLogModalChange,
          onAccessInfoModalChange,
          applicablePartyCount: 1,
        });
        return { grouped, forceRender, bulkMode };
      },
      { wrapper: createCustomWrapper(queryClient) },
    );

    const first = result.current.grouped.groupedDialogs;
    act(() => {
      result.current.forceRender();
    });
    expect(result.current.grouped.groupedDialogs).toBe(first);

    act(() => {
      queryClient.setQueryData([QUERY_KEYS.BULK_MODE], true);
      queryClient.setQueryData([QUERY_KEYS.BULK_MODE_SELECTED_IDS], ['dialog-1']);
    });

    await waitFor(() => expect(result.current.bulkMode).toBe(true));
    await waitFor(() => {
      const afterSelection = result.current.grouped.groupedDialogs;
      expect(afterSelection).not.toBe(first);
      expect(afterSelection.find((d) => d.id === 'dialog-1')?.selected).toBe(true);
      expect(afterSelection.find((d) => d.id === 'dialog-2')?.selected).toBe(false);
    });

    act(() => {
      queryClient.setQueryData([QUERY_KEYS.BULK_MODE_SELECTED_IDS], ['dialog-1', 'dialog-2']);
    });

    await waitFor(() =>
      expect(result.current.grouped.groupedDialogs.find((d) => d.id === 'dialog-2')?.selected).toBe(true),
    );
  });
});
