import { renderHook } from '@testing-library/react';
import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useFormat: vi.fn(),
}));

const mockData = [
  {
    id: '01953842-438a-7232-b9c0-d90bd89e1072',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      isCompany: true,
      imageURL: '',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 0,
    createdAt: '2025-02-24T14:00:21.642Z',
    updatedAt: '2025-02-24T14:02:58.540Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: '0195383e-0d9a-73b1-b96b-73c49e31097d',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      isCompany: true,
      imageURL: '',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 1,
    createdAt: '2025-02-24T13:55:45.689Z',
    updatedAt: '2025-02-24T13:55:45.689Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: '0195383b-6068-726a-b632-1ff3cc836e9a',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      isCompany: true,
      imageURL: '',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 1,
    createdAt: '2025-02-24T13:52:50.280Z',
    updatedAt: '2025-02-24T13:52:50.280Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: '01937766-ff24-7305-9361-d14743d2db30',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Test melding8',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen HTML-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'digitaliseringsdirektoratet',
      isCompany: true,
      imageURL: '',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 1,
    createdAt: '2024-11-29T10:10:58.980Z',
    updatedAt: '2024-11-29T10:10:58.980Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'digitaliseringsdirektoratet',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: '01936e30-ac82-70f3-96ba-eb3ccd31586a',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Test melding3',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen HTML-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'digitaliseringsdirektoratet',
      isCompany: true,
      imageURL: '',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 1,
    createdAt: '2024-11-27T15:15:03.934Z',
    updatedAt: '2024-11-27T15:15:03.934Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'digitaliseringsdirektoratet',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: 'f67d9101-5149-6377-95db-6146e6b2e196',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Tjeneste for rapportering av et eller annet fra SKE',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen riktekst-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'Skatteetaten',
      isCompany: true,
      imageURL: 'https://altinncdn.no/orgs/skd/skd.png',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 2,
    createdAt: '2024-08-23T06:39:38.321Z',
    updatedAt: '2024-08-23T06:39:38.321Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'skd',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
  {
    id: 'f57d9101-e17a-8b76-94ba-c6d63f56b96f',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Tjeneste for rapportering av et eller annet fra SKE',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen riktekst-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'Skatteetaten',
      isCompany: true,
      imageURL: 'https://altinncdn.no/orgs/skd/skd.png',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      isCompany: false,
    },
    guiAttachmentCount: 2,
    createdAt: '2024-08-23T06:38:45.473Z',
    updatedAt: '2024-08-23T06:38:45.473Z',
    status: 'NEW' as DialogStatus,
    isSeenByEndUser: true,
    label: 'DEFAULT' as SystemLabel,
    org: 'skd',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
  },
];

describe('useGroupedDialogs', () => {
  const t = vi.fn((key) => key);
  const format = vi.fn((date) => date.toString());

  beforeEach(() => {
    (useTranslation as Mock).mockReturnValue({ t });
    (useFormat as Mock).mockReturnValue(format);
  });

  it('should return loading items when isLoading is true', () => {
    const { result } = renderHook(() =>
      useGroupedDialogs({
        items: [],
        displaySearchResults: false,
        viewType: 'inbox',
        isLoading: true,
      }),
    );

    expect(result.current.groupedDialogs).toHaveLength(5);
    expect(result.current.groups).toEqual({ loading: { title: 'word.loading' } });
  });

  it('should return grouped dialogs when isLoading is false', () => {
    const { result } = renderHook(() =>
      useGroupedDialogs({
        items: mockData,
        displaySearchResults: true,
        viewType: 'inbox',
        isLoading: false,
      }),
    );

    expect(result.current.groupedDialogs).toHaveLength(7);
    expect(result.current.groups).toEqual({
      inbox: { title: 'inbox.heading.search_results.inbox', orderIndex: null },
    });
  });

  it('should generat groups orderIndex correctly', () => {
    const { result } = renderHook(() =>
      useGroupedDialogs({
        items: mockData,
        displaySearchResults: false,
        viewType: 'inbox',
        isLoading: false,
      }),
    );

    const groups = result.current.groups;
    const uniqueOrderIndexes = [...new Set(Object.values(groups).map((item) => item.orderIndex?.toString()))];

    expect(uniqueOrderIndexes).toHaveLength(2);
    expect(uniqueOrderIndexes.toString()).toBe('2025,2024');
  });
});
