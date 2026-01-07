import {
  AvatarGroup,
  type AvatarGroupProps,
  type AvatarVariant,
  type BadgeProps,
  type SettingsGroupProps,
  type SettingsItemProps,
  type ToolbarSearchProps,
  type UsedByLogItemProps,
} from '@altinn/altinn-components';
import type { SettingsItemVariant } from '@altinn/altinn-components/dist/types/lib/components/Settings/SettingsItem';
import { BellIcon, HouseHeartIcon, MobileIcon, PaperplaneIcon, PersonRectangleIcon } from '@navikt/aksel-icons';
import { type ChangeEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useAccounts } from '../../../components/PageLayout/Accounts/useAccounts.tsx';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings.tsx';
import { useProfile } from '../useProfile.tsx';
import { AccountAlertsDetails } from './AccountAlertsDetails.tsx';
import { ContactProfileDetails } from './ContactProfileDetails.tsx';

export enum SettingsType {
  contact = `contact`,
  alerts = 'alerts',
  companies = 'companies',
  persons = 'persons',
  primary = 'primary',
  profiles = 'profiles',
  favorites = 'favorites',
}

interface UseSettingsOptions {
  groups?: Record<SettingsType | string, { title?: string | ReactNode }>;
  excludeGroups?: (keyof typeof SettingsType)[];
  includeGroups?: (keyof typeof SettingsType)[];
}

interface UseSettingsInput {
  options?: UseSettingsOptions;
  isLoading?: boolean;
}

interface UseSettingsOutput {
  settings: SettingsItemProps[];
  settingsGroups: Record<string, SettingsGroupProps>;
  settingsSearch: ToolbarSearchProps;
  getAccountAlertSettings?: (id: string) => SettingsItemProps;
}

const getDefaultGroups = (t: (key: string) => string) => ({
  [SettingsType.contact]: { title: t('profile.settings.contact_information') },
  [SettingsType.alerts]: { title: t('profile.settings.notifications') },
  [SettingsType.companies]: { title: t('profile.settings.company_notifications') },
  [SettingsType.persons]: { title: t('profile.settings.person_notifications') },
  [SettingsType.primary]: { title: t('profile.settings.favorite_notifications') },
  [SettingsType.profiles]: { title: t('profile.settings.alternative_addresses') },
});

const getDefaultOptions = (t: (key: string) => string) => ({
  groups: getDefaultGroups(t),
  includeGroups: undefined,
  excludeGroups: undefined,
});

export const getNotificationsSettingsBadge = ({
  phoneNumber,
  email,
  t,
}: {
  phoneNumber?: string | undefined;
  email?: string | undefined;
  isDeleted?: boolean;
  t: (key: string) => string;
}): BadgeProps => {
  const phoneLabel = phoneNumber?.length ? t('profile.settings.sms') : '';
  const emailLabel = email?.length ? t('profile.settings.email') : '';

  if (!phoneNumber && !email) {
    return {
      variant: 'text',
      label: t('profile.settings.add'),
    };
  }
  return {
    label: [emailLabel, phoneLabel].filter(Boolean).join(emailLabel && phoneLabel ? t('profile.settings.and') : ''),
  };
};

export const useSettings = ({ options: inputOptions = {}, isLoading }: UseSettingsInput = {}): UseSettingsOutput => {
  const { isLoading: isLoadingParties, parties, selectedParties, allOrganizationsSelected } = useParties();
  const { user } = useProfile();
  const { t } = useTranslation();
  const [searchString, setSearchString] = useState<string>('');
  const { partiesWithNotificationSettings, uniqueEmailAddresses, uniquePhoneNumbers } =
    usePartiesWithNotificationSettings(parties);

  const getUsedByEmail = (email?: string): UsedByLogItemProps[] | undefined => {
    if (!email) return undefined;
    const userEmailGroup = uniqueEmailAddresses.find((group) => group?.email === email);
    return (userEmailGroup?.parties ?? []).map((party) => ({
      id: party.partyUuid,
      name: party.name,
      type: party.type,
      avatar: {
        name: party.name,
        type: party.type,
        variant: (party.hasParentParty ? 'outline' : 'solid') as AvatarVariant,
      },
    }));
  };

  const getChangeSettingsBadge = (value?: string) => {
    if (value) {
      return { label: t('profile.settings.change'), variant: 'text' as BadgeProps['variant'] };
    }
    return { label: t('profile.settings.add'), variant: 'text' as BadgeProps['variant'] };
  };

  const getAvatarGroup = (items?: UsedByLogItemProps[]): AvatarGroupProps['items'] => {
    if (items?.length) {
      return items.map((item) => (item.avatar ? item.avatar : { name: item.name, type: item.type }));
    }
    return [];
  };

  const getUsedByPhoneNumber = (phoneNumber?: string): UsedByLogItemProps[] | undefined => {
    if (!phoneNumber) return undefined;
    const userPhoneGroup = uniquePhoneNumbers?.find((group) => group?.phoneNumber === phoneNumber);
    return (
      (userPhoneGroup?.parties ?? []).map((party) => ({
        id: party.partyUuid,
        name: party.name,
        type: party.type,
        avatar: {
          name: party.name,
          type: party.type,
          variant: (party.hasParentParty ? 'outline' : 'solid') as AvatarVariant,
        },
      })) || []
    );
  };

  const options = { ...getDefaultOptions(t), ...inputOptions };

  const { accounts, accountGroups } = useAccounts({
    isLoading: isLoadingParties,
    parties,
    allOrganizationsSelected,
    selectedParties,
    options: {
      groups: options?.groups,
      showDescription: true,
      showFavorites: false,
    },
  });

  const settingsSearch = {
    name: 'settings-search',
    value: searchString,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setSearchString(event.target.value);
    },
    onClear: () => setSearchString(''),
    placeholder: '',
    getResultsLabel: (hits: number) => {
      if (hits === 0) {
        return t('profile.settings.no_results');
      }
      return t('parties.results', { hits });
    },
  };

  if (isLoading) {
    return {
      settingsSearch,
      settings: [
        {
          id: 'loading-account',
          groupId: 'loading',
          title: '.....',
          loading: true,
          icon: { name: '....', type: 'person' },
          name: '',
        },
      ],
      settingsGroups: {
        loading: { title: t('profile.settings.loading') },
      },
    };
  }

  const getAccountAlertSettings = (id: string): SettingsItemProps => {
    const account = accounts.find((account) => account.id === id);
    const notificationAccount = partiesWithNotificationSettings.find((p) => p.party === id);
    const phoneNumber = account?.isCurrentEndUser
      ? user?.phoneNumber || ''
      : (notificationAccount?.notificationSettings?.phoneNumber ?? '');
    const email = account?.isCurrentEndUser
      ? user?.email || ''
      : (notificationAccount?.notificationSettings?.emailAddress ?? '');

    return {
      id: account?.id ?? id,
      color: (account?.type ?? 'neutral') as SettingsItemProps['color'],
      value: [email, phoneNumber].filter(Boolean).join(email && phoneNumber ? ' og ' : ''),
      groupId: String(account?.groupId ?? ''),
      title: account?.name,
      icon: account?.icon,
      variant: 'modal' as SettingsItemVariant,
      modalProps: {
        icon: account?.icon,
        title: account?.name,
        description: account?.description ? String(account?.description) : '',
      },
      children: account?.isCurrentEndUser ? (
        <ContactProfileDetails variant="alerts" phoneNumber={phoneNumber} emailAddress={email} readOnly />
      ) : (
        <AccountAlertsDetails notificationParty={notificationAccount} />
      ),
      badge: getNotificationsSettingsBadge({ phoneNumber, email, t }),
    };
  };

  const accountAlertSettings: SettingsItemProps[] = accounts
    .filter((a) => {
      if (!options.excludeGroups) {
        return true;
      }
      return !(options.excludeGroups.includes(SettingsType.companies) && a.type === 'company');
    })
    .map((a) => getAccountAlertSettings(a.id));

  const address = `${user?.party?.person?.mailingAddress}, ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;

  const contactSettings: SettingsItemProps[] = [
    {
      id: 'contact-mobile',
      groupId: SettingsType.contact,
      icon: MobileIcon,
      title: t('profile.settings.mobile_phone'),
      value: user?.phoneNumber || '',
      badge: getChangeSettingsBadge(user?.phoneNumber || ''),
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="phone"
          phoneNumber={user?.phoneNumber || ''}
          usedByItems={getUsedByPhoneNumber(user?.phoneNumber ?? '')}
          readOnly
        />
      ),
    },
    {
      id: 'contact-email',
      groupId: SettingsType.contact,
      icon: PaperplaneIcon,
      title: t('profile.settings.email_address'),
      value: user?.email || '',
      badge: getChangeSettingsBadge(user?.email || ''),
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="email"
          emailAddress={user?.email || ''}
          usedByItems={getUsedByEmail(user?.email ?? '')}
          readOnly
        />
      ),
    },
    {
      id: 'contact-address',
      groupId: SettingsType.contact,
      icon: HouseHeartIcon,
      title: t('profile.settings.address'),
      value: address,
      badge: getChangeSettingsBadge(address),
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="address"
          mailingPostalCity={user?.party?.person?.mailingPostalCity ?? ''}
          mailingPostalCode={user?.party?.person?.mailingPostalCode ?? ''}
          mailingAddress={user?.party?.person?.mailingAddress ?? ''}
          readOnly
        />
      ),
    },
  ];

  const contactProfileEmailSettings: SettingsItemProps[] = uniqueEmailAddresses.map((uea) => ({
    id: 'contact-profile-email-setting-' + uea.email,
    groupId: SettingsType.profiles,
    icon: PersonRectangleIcon,
    title: t('profile.settings.notification_profile_email'),
    value: uea.email,
    badge: <AvatarGroup items={getAvatarGroup(getUsedByEmail(uea.email))} size="lg" />,
    variant: 'modal',
    children: (
      <ContactProfileDetails
        variant="email"
        emailAddress={uea.email}
        usedByItems={getUsedByEmail(uea.email)}
        description={t('profile.settings.coming_soon')}
        readOnly
      />
    ),
  }));

  const contactProfilePhoneSettings: SettingsItemProps[] = uniquePhoneNumbers.map((uep) => ({
    id: 'contact-profile-phone-setting-' + uep.phoneNumber,
    groupId: SettingsType.profiles,
    icon: PersonRectangleIcon,
    title: t('profile.settings.notification_profile_sms'),
    value: uep.phoneNumber,
    badge: <AvatarGroup items={getAvatarGroup(getUsedByPhoneNumber(uep.phoneNumber))} size="lg" />,
    variant: 'modal',
    children: (
      <ContactProfileDetails
        variant="phone"
        phoneNumber={uep.phoneNumber}
        readOnly
        usedByItems={getUsedByPhoneNumber(uep.phoneNumber)}
        description={t('profile.settings.coming_soon')}
      />
    ),
  }));

  const alertSettings: SettingsItemProps[] = [
    {
      id: 'alert-mobile',
      groupId: SettingsType.alerts,
      icon: BellIcon,
      title: t('profile.settings.sms_notifications'),
      value: user?.phoneNumber || '',
      badge: { label: t('profile.settings.change'), variant: 'text' },
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="phone"
          phoneNumber={user?.phoneNumber || ''}
          usedByItems={getUsedByPhoneNumber(user?.phoneNumber ?? '')}
          readOnly
        />
      ),
    },
    {
      id: 'alert-email',
      groupId: SettingsType.alerts,
      icon: BellIcon,
      title: t('profile.settings.email_notifications'),
      value: user?.email || '',
      badge: { label: t('profile.settings.change'), variant: 'text' },
      variant: 'modal',
      children: <ContactProfileDetails variant="email" emailAddress={user?.email || ''} readOnly />,
    },
  ];

  const allSettings = [
    ...contactSettings,
    ...alertSettings,
    ...contactProfilePhoneSettings,
    ...contactProfileEmailSettings,
    ...accountAlertSettings,
  ];

  const settings = allSettings.filter((item) => {
    const { includeGroups, excludeGroups } = options;
    if (includeGroups && includeGroups.length > 0) {
      return includeGroups.includes(item.groupId as SettingsType);
    }
    if (excludeGroups && excludeGroups.length > 0) {
      return !excludeGroups.includes(item.groupId as SettingsType);
    }
    return true;
  });

  if (searchString) {
    const normalized = searchString.trim().toLowerCase();
    const parts = normalized.split(/\s+/);

    const hits = settings
      .filter((s) => {
        const title = (s.title ?? '').toString().toLowerCase();
        const value = (s.value ?? '').toString().toLowerCase();
        return (
          parts.some((part) => title.includes(part) || value.includes(part)) ||
          title.includes(normalized) ||
          value.includes(normalized)
        );
      })
      .map((hit) => ({ ...hit, highlightWords: parts, groupId: 'search-results' }));

    return {
      settingsGroups: {
        'search-results': { title: t('search.hits', { count: hits.length }) },
      },
      settings: hits,
      settingsSearch,
    };
  }

  return {
    settings,
    settingsGroups: accountGroups as Record<string, SettingsGroupProps>,
    settingsSearch,
    getAccountAlertSettings,
  };
};
