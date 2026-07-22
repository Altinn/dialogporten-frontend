import { renderHook } from '@testing-library/react';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('../../api/queries.ts', () => ({
  updateNotificationsetting: vi.fn(),
}));

vi.mock('../../auth/useAuthenticatedQuery.tsx', () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock('./useNotificationSettings.tsx', () => ({
  useNotificationSettingsForCurrentUser: vi.fn(() => ({
    notificationSettingsForCurrentUser: [],
    isLoading: false,
  })),
}));

import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { usePartiesWithNotificationSettings } from './usePartiesWithNotificationSettings.tsx';

const makeParty = (
  overrides: Record<string, unknown> = {},
): PartyFieldsFragment & { notificationSettings?: { emailAddress?: string; phoneNumber?: string } } =>
  ({
    partyUuid: 'uuid-1',
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    name: 'Ola Nordmann',
    isCurrentEndUser: false,
    subParties: undefined,
    notificationSettings: {},
    ...overrides,
  }) as never;

describe('usePartiesWithNotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty groupings when there is no data yet', () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => usePartiesWithNotificationSettings([]));

    expect(result.current.uniqueEmailAddresses).toEqual([]);
    expect(result.current.uniquePhoneNumbers).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('groups parties sharing the same email address', () => {
    const parties = [
      makeParty({
        partyUuid: 'uuid-1',
        name: 'Ola Nordmann',
        partyType: 'Person',
        notificationSettings: { emailAddress: 'shared@example.com' },
      }),
      makeParty({
        partyUuid: 'uuid-2',
        name: 'Nav Kommune',
        partyType: 'Organization',
        notificationSettings: { emailAddress: 'shared@example.com' },
      }),
      makeParty({
        partyUuid: 'uuid-3',
        name: 'Kari Nordmann',
        partyType: 'Person',
        notificationSettings: { emailAddress: 'other@example.com' },
      }),
    ];
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: parties, isLoading: false });

    const { result } = renderHook(() => usePartiesWithNotificationSettings([]));

    expect(result.current.uniqueEmailAddresses).toHaveLength(2);
    const shared = result.current.uniqueEmailAddresses.find((g) => g.email === 'shared@example.com');
    expect(shared?.parties.map((p) => p.partyUuid)).toEqual(['uuid-1', 'uuid-2']);
    expect(shared?.parties.find((p) => p.partyUuid === 'uuid-2')?.type).toBe('company');
  });

  it('groups parties sharing the same phone number', () => {
    const parties = [
      makeParty({ partyUuid: 'uuid-1', notificationSettings: { phoneNumber: '+4791234567' } }),
      makeParty({ partyUuid: 'uuid-2', notificationSettings: { phoneNumber: '+4791234567' } }),
    ];
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: parties, isLoading: false });

    const { result } = renderHook(() => usePartiesWithNotificationSettings([]));

    expect(result.current.uniquePhoneNumbers).toHaveLength(1);
    expect(result.current.uniquePhoneNumbers[0].parties).toHaveLength(2);
  });

  it('excludes parties with no email or phone number set', () => {
    const parties = [makeParty({ notificationSettings: {} })];
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: parties, isLoading: false });

    const { result } = renderHook(() => usePartiesWithNotificationSettings([]));

    expect(result.current.uniqueEmailAddresses).toEqual([]);
    expect(result.current.uniquePhoneNumbers).toEqual([]);
  });

  it('marks a party with subParties as not having a parent party', () => {
    const parties = [
      makeParty({
        partyUuid: 'uuid-root',
        subParties: [{ party: 'urn:sub', name: 'Sub', isDeleted: false }],
        notificationSettings: { emailAddress: 'root@example.com' },
      }),
      makeParty({
        partyUuid: 'uuid-child',
        subParties: undefined,
        notificationSettings: { emailAddress: 'child@example.com' },
      }),
    ];
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: parties, isLoading: false });

    const { result } = renderHook(() => usePartiesWithNotificationSettings([]));

    const root = result.current.uniqueEmailAddresses.find((g) => g.email === 'root@example.com');
    const child = result.current.uniqueEmailAddresses.find((g) => g.email === 'child@example.com');
    expect(root?.parties[0].hasParentParty).toBe(false);
    expect(child?.parties[0].hasParentParty).toBe(true);
  });
});
