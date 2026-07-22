import { act, renderHook } from '@testing-library/react';
import i18n from 'i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

const mockOpenSnackbar = vi.fn();
vi.mock('@altinn/altinn-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@altinn/altinn-components')>();
  return { ...actual, useSnackbar: () => ({ openSnackbar: mockOpenSnackbar }) };
});

const mockUseParties = vi.fn();
vi.mock('../../api/hooks/useParties.ts', () => ({
  useParties: (...args: unknown[]) => mockUseParties(...args),
}));

vi.mock('../../api/hooks/usePartiesSelectors.ts', () => ({
  hasOnlySelfParty: vi.fn(() => false),
  useSILegacyParties: vi.fn(() => []),
}));

const mockUpdateLanguage = vi.fn();
vi.mock('../../api/queries.ts', () => ({
  updateLanguage: (...args: unknown[]) => mockUpdateLanguage(...args),
}));

vi.mock('../../auth/url.ts', () => ({
  getAltinn2AccountLink: () => 'https://example.com/altinn2account',
}));

vi.mock('../../components/PageLayout/Accounts/useAccounts.tsx', () => ({
  useAccounts: vi.fn(() => ({ accounts: [], accountGroups: {} })),
}));

const mockUseFeatureFlag = vi.fn((..._args: unknown[]) => false);
vi.mock('../../featureFlags/useFeatureFlag.ts', () => ({
  useFeatureFlag: (...args: unknown[]) => mockUseFeatureFlag(...args),
}));

const mockLogError = vi.fn();
vi.mock('../../hooks/useErrorLogger', () => ({
  useErrorLogger: () => ({ logError: mockLogError }),
}));

vi.mock('../Inbox/queryParams.ts', () => ({
  pruneSearchQueryParams: () => '',
}));

vi.mock('../SavedSearches/useSavedSearches.tsx', () => ({
  useSavedSearches: vi.fn(() => ({ savedSearches: [] })),
}));

vi.mock('./usePartiesWithNotificationSettings.tsx', () => ({
  usePartiesWithNotificationSettings: vi.fn(() => ({
    partiesWithNotificationSettings: [],
    uniqueEmailAddresses: [],
    uniquePhoneNumbers: [],
  })),
}));

const mockUpdateProfileLanguage = vi.fn();
const mockUseProfile = vi.fn();
vi.mock('./useProfile.tsx', () => ({
  useProfile: (...args: unknown[]) => mockUseProfile(...args),
}));

vi.mock('./useUsername.tsx', () => ({
  useUsername: vi.fn(() => ({ username: null })),
}));

vi.mock('./useVerifiedAddresses.tsx', () => ({
  useVerifiedAddresses: vi.fn(() => ({ verifiedAddresses: [] })),
}));

import { getNotificationsSettingsBadge, useSettings } from './useSettings.tsx';

const t = (key: string) => key;

describe('getNotificationsSettingsBadge', () => {
  it('shows an "add" label when neither phone nor email is set', () => {
    expect(getNotificationsSettingsBadge({ phoneNumber: '', email: '', t })).toEqual({
      variant: 'text',
      label: 'profile.settings.add',
    });
  });

  it('shows only the email label when only email is set', () => {
    const badge = getNotificationsSettingsBadge({ phoneNumber: '', email: 'test@example.com', t });
    expect(badge.label).toBe('profile.settings.email');
  });

  it('shows only the phone label when only phone is set', () => {
    const badge = getNotificationsSettingsBadge({ phoneNumber: '+4712345678', email: '', t });
    expect(badge.label).toBe('profile.settings.sms');
  });

  it('joins email and phone labels when both are set', () => {
    const badge = getNotificationsSettingsBadge({
      phoneNumber: '+4712345678',
      email: 'test@example.com',
      t,
    });
    expect(badge.label).toBe('profile.settings.emailprofile.settings.andprofile.settings.sms');
  });
});

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFeatureFlag.mockReturnValue(false);
    mockUseParties.mockReturnValue({
      isLoading: false,
      parties: [],
      selectedParties: [],
      selectedGroup: null,
      partyGraph: { partyByUrn: new Map() },
      isSelfIdentifiedUser: false,
      selfIdentifiedUserType: undefined,
      currentEndUser: { partyUuid: 'uuid-1', name: 'Ola Nordmann' },
      selectedPartyIds: [],
      setSelectedPartyIds: vi.fn(),
    });
    mockUseProfile.mockReturnValue({
      user: { email: '', phoneNumber: '', party: { person: {} } },
      showClientUnits: false,
      setShowClientUnits: vi.fn(),
      shouldShowDeletedEntities: false,
      updateShowDeletedEntities: vi.fn(),
      updateProfileLanguage: mockUpdateProfileLanguage,
    });
  });

  const renderSettings = () => renderHook(() => useSettings(), { wrapper: createCustomWrapper() });

  it('returns loading placeholder settings when isLoading is true', () => {
    const { result } = renderHook(() => useSettings({ isLoading: true }), { wrapper: createCustomWrapper() });

    expect(result.current.settings).toHaveLength(1);
    expect(result.current.settings[0].loading).toBe(true);
  });

  it('includes the language setting item among the default settings', () => {
    const { result } = renderSettings();
    expect(result.current.settings.some((s) => s.id === 'language')).toBe(true);
  });

  it('filters settings by a search string matching the title', () => {
    const { result } = renderSettings();

    act(() => {
      result.current.settingsSearch.onChange?.({ target: { value: 'Språk/language' } } as never);
    });

    expect(result.current.settings.every((s) => s.groupId === 'search-results')).toBe(true);
    expect(result.current.settings.some((s) => s.id === 'language')).toBe(true);
  });

  it('returns no hits for a search string matching nothing', () => {
    const { result } = renderSettings();

    act(() => {
      result.current.settingsSearch.onChange?.({ target: { value: 'zzz-no-match-zzz' } } as never);
    });

    expect(result.current.settings).toEqual([]);
  });

  it('onClear resets the search and restores the full settings list', () => {
    const { result } = renderSettings();
    const fullCount = result.current.settings.length;

    act(() => {
      result.current.settingsSearch.onChange?.({ target: { value: 'Språk/language' } } as never);
    });
    expect(result.current.settings.length).toBeLessThan(fullCount);

    act(() => {
      result.current.settingsSearch.onClear?.();
    });
    expect(result.current.settings.length).toBe(fullCount);
  });

  it('handleUpdateLanguage does nothing when the language is unchanged', async () => {
    const { result } = renderSettings();

    await act(async () => {
      const languageItem = result.current.settings.find((s) => s.id === 'language');
      await languageItem?.modalProps?.buttons?.[0].onClick?.({} as never);
    });

    expect(mockUpdateLanguage).not.toHaveBeenCalled();
    expect(mockUpdateProfileLanguage).not.toHaveBeenCalled();
  });

  it('handleUpdateLanguage updates language, calls API and shows a success snackbar', async () => {
    mockUpdateLanguage.mockResolvedValue(undefined);
    const otherLanguage = i18n.language === 'en' ? 'nb' : 'en';
    const { result } = renderSettings();

    act(() => {
      const languageItem = result.current.settings.find((s) => s.id === 'language');
      (languageItem!.children as { props: { onSelect: (lang: string) => void } }).props.onSelect(otherLanguage);
    });

    await act(async () => {
      const languageItem = result.current.settings.find((s) => s.id === 'language');
      await languageItem?.modalProps?.buttons?.[0].onClick?.({} as never);
    });

    expect(mockUpdateProfileLanguage).toHaveBeenCalledWith(otherLanguage);
    expect(mockUpdateLanguage).toHaveBeenCalledWith(otherLanguage);
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'profile.settings.language_changed' }),
    );
  });

  it('handleUpdateLanguage logs an error when the API call fails', async () => {
    mockUpdateLanguage.mockRejectedValue(new Error('network error'));
    const otherLanguage = i18n.language === 'en' ? 'nb' : 'en';
    const { result } = renderSettings();

    act(() => {
      const languageItem = result.current.settings.find((s) => s.id === 'language');
      (languageItem!.children as { props: { onSelect: (lang: string) => void } }).props.onSelect(otherLanguage);
    });

    await act(async () => {
      const languageItem = result.current.settings.find((s) => s.id === 'language');
      await languageItem?.modalProps?.buttons?.[0].onClick?.({} as never);
    });

    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: 'useSettings.handleUpdateLanguage' }),
      expect.any(String),
    );
  });

  it('excludeGroups filters out settings from the excluded group', () => {
    const { result } = renderHook(() => useSettings({ options: { excludeGroups: [] as never[] } }), {
      wrapper: createCustomWrapper(),
    });
    const fullCount = result.current.settings.length;

    const { result: filtered } = renderHook(() => useSettings({ options: { excludeGroups: ['other' as never] } }), {
      wrapper: createCustomWrapper(),
    });

    expect(filtered.current.settings.length).toBeLessThan(fullCount);
    expect(filtered.current.settings.some((s) => s.id === 'language')).toBe(false);
  });

  it('includeGroups restricts settings to only the included group', () => {
    const { result } = renderHook(() => useSettings({ options: { includeGroups: ['other' as never] } }), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.settings.every((s) => s.groupId === 'other')).toBe(true);
    expect(result.current.settings.some((s) => s.id === 'language')).toBe(true);
  });
});
