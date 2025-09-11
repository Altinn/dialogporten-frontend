import { renderHook } from '@testing-library/react';
import { type DialogStatus, SystemLabel } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../utils/test-utils.tsx';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from './InboxItemInput.ts';
import useGroupedDialogs from './useGroupedDialogs.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useFormat: vi.fn(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  };
});

const mockData: InboxItemInput[] = [
  {
    id: '01953842-438a-7232-b9c0-d90bd89e1072',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      type: 'company',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'company',
    },
    hasUnopenedContent: true,
    seenSinceLastContentUpdate: [],
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2025-02-24T14:00:21.642Z',
    guiAttachmentCount: 0,
    createdAt: '2025-02-24T14:00:21.642Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2025-02-24T14:02:58.540Z',
          isEndUser: true,
          seenAtLabel: '24.02.2025 15:02',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: '0195383e-0d9a-73b1-b96b-73c49e31097d',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      type: 'company',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: true,
    contentUpdatedAt: '2025-02-24T13:55:45.689Z',
    guiAttachmentCount: 1,
    createdAt: '2025-02-24T13:55:45.689Z',
    status: 'NEW' as DialogStatus,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    label: [SystemLabel.Default],
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2025-02-24T13:55:45.689Z',
          isEndUser: true,
          seenAtLabel: '24.02.2025 14:55',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: '0195383b-6068-726a-b632-1ff3cc836e9a',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Dialog laget med Scenario Builder 2025-2-24 14:52',
    summary: 'Denne teksten representerer et sammendrag av dialogen, som er opprettet av serviceOwner i dialogporten.',
    sender: {
      name: 'Digitaliseringsdirektoratet',
      type: 'company',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 1,
    createdAt: '2024-11-27T15:36:52.131Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'digdir',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2025-02-24T13:52:50.280Z',
          isEndUser: true,
          seenAtLabel: '24.02.2025 14:52',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: '01937766-ff24-7305-9361-d14743d2db30',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Test melding8',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen HTML-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'digitaliseringsdirektoratet',
      type: 'company',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 1,
    createdAt: '2024-11-29T10:10:58.980Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'digitaliseringsdirektoratet',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2024-11-29T10:10:58.980Z',
          isEndUser: true,
          seenAtLabel: '29.11.2024 11:10',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: '01936e30-ac82-70f3-96ba-eb3ccd31586a',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Test melding3',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen HTML-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'digitaliseringsdirektoratet',
      type: 'company',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 1,
    createdAt: '2024-11-27T15:15:03.934Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'digitaliseringsdirektoratet',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2024-11-27T15:15:03.934Z',
          isEndUser: true,
          seenAtLabel: '27.11.2024 16:15',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: 'f67d9101-5149-6377-95db-6146e6b2e196',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Tjeneste for rapportering av et eller annet fra SKE',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen riktekst-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'Skatteetaten',
      type: 'company',
      imageUrl: 'https://altinncdn.no/orgs/skd/skd.png',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 2,
    createdAt: '2024-08-23T06:39:38.321Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'skd',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2024-08-23T06:39:38.321Z',
          isEndUser: true,
          seenAtLabel: '23.08.2024 07:39',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
  },
  {
    id: 'f57d9101-e17a-8b76-94ba-c6d63f56b96f',
    party: 'urn:altinn:person:identifier-no:14886498226',
    title: 'Tjeneste for rapportering av et eller annet fra SKE',
    summary: 'Et sammendrag her. Maks 200 tegn, ingen riktekst-støtte. Påkrevd. Vises i liste.',
    sender: {
      name: 'Skatteetaten',
      type: 'company',
      imageUrl: 'https://altinncdn.no/orgs/skd/skd.png',
    },
    recipient: {
      name: 'Hjelpelinje Ordinær',
      type: 'person',
    },
    seenSinceLastContentUpdate: [],
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 2,
    createdAt: '2024-08-23T06:38:45.473Z',
    status: 'NEW' as DialogStatus,
    label: [SystemLabel.Default],
    org: 'skd',
    seenByLabel: 'Sett av deg',
    seenByOthersCount: 0,
    viewType: 'inbox' as InboxViewType,
    seenByLog: {
      collapsible: true,
      endUserLabel: 'Sett av deg',
      items: [
        {
          id: 'urn:altinn:person:identifier-no:14886498226',
          seenAt: '2024-08-23T06:38:45.473Z',
          isEndUser: true,
          seenAtLabel: '23.08.2024 07:38',
          name: 'Hjelpelinje Ordinær',
        },
      ],
    },
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
    const { result } = renderHook(
      () =>
        useGroupedDialogs({
          items: [],
          displaySearchResults: false,
          viewType: 'inbox',
          isLoading: true,
          hasNextPage: false,
          onSeenByLogModalChange: () => {},
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    expect(result.current.groupedDialogs).toHaveLength(5);
    expect(result.current.groups).toEqual({ loading: { title: 'word.loading' } });
  });

  it('should return grouped dialogs when isLoading is false', () => {
    const { result } = renderHook(
      () =>
        useGroupedDialogs({
          items: mockData,
          displaySearchResults: true,
          viewType: 'inbox',
          isLoading: false,
          hasNextPage: false,
          onSeenByLogModalChange: () => {},
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    expect(result.current.groupedDialogs).toHaveLength(7);
    expect(result.current.groups).toEqual({
      collapsed: { description: 'search.results.description', orderIndex: null, title: 'inbox.heading.title.inbox' },
    });
  });

  it('should generat groups orderIndex correctly', () => {
    const { result } = renderHook(
      () =>
        useGroupedDialogs({
          items: mockData,
          hasNextPage: false,
          displaySearchResults: false,
          viewType: 'inbox',
          isLoading: false,
          onSeenByLogModalChange: () => {},
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    console.info(mockData);
    const groups = result.current.groups;
    const uniqueOrderIndexes = [...new Set(Object.values(groups).map((item) => item.orderIndex?.toString()))];

    expect(uniqueOrderIndexes).toHaveLength(2);
    expect(uniqueOrderIndexes.toString()).toBe('2025,2024');
  });
});
