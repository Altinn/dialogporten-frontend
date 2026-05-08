import {
  AvatarGroup,
  type AvatarGroupProps,
  type AvatarVariant,
  Badge,
  type BadgeProps,
  type SettingsGroupProps,
  type SettingsItemProps,
  type SettingsItemVariant,
  type ToolbarSearchProps,
  type UsedByLogItemProps,
} from '@altinn/altinn-components';
import {
  BellIcon,
  BriefcaseIcon,
  HouseHeartIcon,
  MobileIcon,
  PaperplaneIcon,
  PersonRectangleIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { type ChangeEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useAccounts } from '../../../components/PageLayout/Accounts/useAccounts.tsx';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings.tsx';
import { useProfile } from '../useProfile.tsx';
import { useVerifiedAddresses } from '../useVerifiedAddresses.tsx';
import { AccountAlertsChannelDetails } from './AccountAlerts/AccountAlertsChannelDetails.tsx';
import { ServiceResourceNotificationsDetails } from './AccountAlerts/ServiceResourceNotificationsDetails.tsx';
import type { Channel } from './AccountAlerts/common.ts';
import { ContactProfileDetails } from './ContactProfileDetails.tsx';

export enum SettingsType {
  contact = `contact`,
  alerts = 'alerts',
  mobileAlerts = 'mobileAlerts',
  emailAlerts = 'emailAlerts',
  emailProfiles = 'emailProfiles',
  mobileProfile = 'mobileProfile',
  companies = 'companies',
  persons = 'persons',
  primary = 'primary',
  profiles = 'profiles',
  favorites = 'favorites',
  other = 'other',
}

interface UseSettingsOptions {
  groups?: Record<SettingsType | string, { title?: string | ReactNode }>;
  excludeGroups?: SettingsType[];
  includeGroups?: SettingsType[];
}

interface UseSettingsInput {
  options?: UseSettingsOptions;
  isLoading?: boolean;
  isSelfIdentifiedUser?: boolean;
  disabled?: boolean;
}

interface UseSettingsOutput {
  settings: SettingsItemProps[];
  settingsGroups: Record<string, SettingsGroupProps>;
  settingsSearch: ToolbarSearchProps;
  getAccountAlertSettings?: (id: string) => SettingsItemProps[];
}

const getDefaultGroups = (t: (key: string) => string) => ({
  [SettingsType.contact]: { title: t('profile.settings.contact_information') },
  [SettingsType.emailAlerts]: { title: t('profile.settings.email_notifications') },
  [SettingsType.mobileAlerts]: { title: t('profile.settings.sms_notifications') },
  [SettingsType.companies]: { title: t('profile.settings.company_notifications') },
  [SettingsType.persons]: { title: t('profile.settings.person_notifications') },
  [SettingsType.primary]: { title: t('profile.settings.favorite_notifications') },
  [SettingsType.profiles]: { title: t('profile.settings.alternative_addresses') },
  [SettingsType.other]: { title: t('profile.settings.other') },
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

export const useSettings = ({
  options: inputOptions = {},
  isLoading,
  isSelfIdentifiedUser = false,
  disabled = false,
}: UseSettingsInput = {}): UseSettingsOutput => {
  const {
    isLoading: isLoadingParties,
    parties,
    selectedParties,
    allOrganizationsSelected,
    partyGraph,
    setSelectedPartyIds,
  } = useParties();
  const { user, showClientUnits, setShowClientUnits, shouldShowDeletedEntities, updateShowDeletedEntities } =
    useProfile();
  const { t } = useTranslation();
  const [searchString, setSearchString] = useState<string>('');
  const { partiesWithNotificationSettings, uniqueEmailAddresses, uniquePhoneNumbers } =
    usePartiesWithNotificationSettings(parties);
  const { verifiedAddresses } = useVerifiedAddresses();

  const isVerifiedAddress = (value: string, type: 'Email' | 'Sms') =>
    verifiedAddresses.some((addr) => addr?.value === value && addr?.addressType === type);

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
    partyGraph,
    setSelectedPartyIds,
    options: {
      groups: options?.groups,
      showDescription: true,
      showFavorites: false,
      excludeDeleted: false,
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

  const getAccountAlertChannelSettings = (id: string, channel: Channel): SettingsItemProps => {
    const account = accounts.find((account) => account.id === id);
    const notificationAccount = partiesWithNotificationSettings.find((p) => p.party === id);
    const isEmail = channel === 'Email';
    const value = account?.isCurrentEndUser
      ? (isEmail ? user?.email : user?.phoneNumber) || ''
      : ((isEmail
          ? notificationAccount?.notificationSettings?.emailAddress
          : notificationAccount?.notificationSettings?.phoneNumber) ?? '');

    return {
      id: `${account?.id ?? id}-${isEmail ? 'email' : 'sms'}`,
      color: (account?.type ?? 'neutral') as SettingsItemProps['color'],
      value,
      groupId: String(account?.groupId ?? ''),
      title: isEmail ? t('profile.account_alerts.email_dialog_title') : t('profile.account_alerts.sms_dialog_title'),
      icon: BellIcon,
      variant: 'modal' as SettingsItemVariant,
      modalProps: {
        icon: BellIcon,
        title: isEmail ? t('profile.account_alerts.email_dialog_title') : t('profile.account_alerts.sms_dialog_title'),
      },
      children: <AccountAlertsChannelDetails channel={channel} notificationParty={notificationAccount} />,
      badge: value
        ? { label: t('profile.settings.change'), variant: 'text' }
        : { label: t('profile.settings.add'), variant: 'text' },
    };
  };

  const getAccountAlertSettings = (id: string): SettingsItemProps[] => {
    const account = accounts.find((account) => account.id === id);
    if (account?.isCurrentEndUser) {
      const phoneNumber = user?.phoneNumber || '';
      const email = user?.email || '';
      return [
        {
          id: account?.id ?? id,
          color: (account?.type ?? 'neutral') as SettingsItemProps['color'],
          value: [email, phoneNumber].filter(Boolean).join(email && phoneNumber ? t('profile.settings.and') : ''),
          groupId: String(account?.groupId ?? ''),
          title: account?.name,
          icon: account?.icon,
          variant: 'modal' as SettingsItemVariant,
          modalProps: {
            icon: account?.icon,
            title: account?.name,
            description: account?.description ? String(account?.description) : '',
          },
          children: <ContactProfileDetails variant="alerts" phoneNumber={phoneNumber} emailAddress={email} readOnly />,
          badge: getNotificationsSettingsBadge({ phoneNumber, email, t }),
        },
      ];
    }
    const notificationAccount = partiesWithNotificationSettings.find((p) => p.party === id);
    const includedServiceCount = (notificationAccount?.notificationSettings?.resourceIncludeList ?? []).filter(
      (r): r is string => !!r,
    ).length;
    const serviceResourceEntry: SettingsItemProps = {
      id: `${account?.id ?? id}-services`,
      color: (account?.type ?? 'neutral') as SettingsItemProps['color'],
      groupId: String(account?.groupId ?? ''),
      title: t('profile.service_notifications.title'),
      description:
        includedServiceCount === 0
          ? t('profile.service_notifications.active_for_all')
          : t('profile.service_notifications.active_for_count', { count: includedServiceCount }),
      value: 'services',
      icon: BellIcon,
      variant: 'modal' as SettingsItemVariant,
      modalProps: {
        icon: BellIcon,
        title: t('profile.service_notifications.title'),
      },
      badge: {
        variant: 'text',
        label: t('word.change'),
      },
      children: <ServiceResourceNotificationsDetails notificationParty={notificationAccount} />,
    };
    return [
      getAccountAlertChannelSettings(id, 'Sms'),
      getAccountAlertChannelSettings(id, 'Email'),
      serviceResourceEntry,
    ];
  };

  const accountAlertSettings: SettingsItemProps[] = accounts
    .filter((a) => {
      if (!options.excludeGroups) {
        return true;
      }
      return !(options.excludeGroups.includes(SettingsType.companies) && a.type === 'company');
    })
    .flatMap((a) => getAccountAlertSettings(a.id));

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
          isSelfIdentifiedUser={isSelfIdentifiedUser}
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
      badge: isSelfIdentifiedUser ? undefined : getChangeSettingsBadge(user?.email || ''),
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
    ...(!isSelfIdentifiedUser
      ? [
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
          } as SettingsItemProps,
        ]
      : []),
  ];

  const contactProfileEmailSettings: SettingsItemProps[] = uniqueEmailAddresses.map((uea) => ({
    id: 'contact-profile-email-setting-' + uea.email,
    groupId: SettingsType.emailProfiles,
    icon: PersonRectangleIcon,
    title: t('profile.settings.notification_profile_email'),
    value: uea.email,
    controls: (
      <>
        {isVerifiedAddress(uea.email, 'Email') ? (
          <AvatarGroup items={getAvatarGroup(getUsedByEmail(uea.email))} size="lg" />
        ) : (
          <Badge
            variant="outline"
            label={t(
              isVerifiedAddress(uea.email, 'Email')
                ? 'profile.verification.status_verified'
                : 'profile.verification.status_unverified',
            )}
            size="sm"
          />
        )}
      </>
    ),
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
    groupId: SettingsType.mobileProfile,
    icon: PersonRectangleIcon,
    title: t('profile.settings.notification_profile_sms'),
    value: uep.phoneNumber,
    controls: (
      <>
        {isVerifiedAddress(uep.phoneNumber, 'Sms') ? (
          <AvatarGroup items={getAvatarGroup(getUsedByPhoneNumber(uep.phoneNumber))} size="lg" />
        ) : (
          <Badge
            variant="outline"
            label={t(
              isVerifiedAddress(uep.phoneNumber, 'Sms')
                ? 'profile.verification.status_verified'
                : 'profile.verification.status_unverified',
            )}
            size="sm"
          />
        )}
      </>
    ),
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

  const mobileAlertSettings: SettingsItemProps[] = [
    {
      id: 'alert-mobile',
      groupId: SettingsType.mobileAlerts,
      icon: BellIcon,
      title: t('profile.settings.sms_notifications'),
      value: user?.phoneNumber || '',
      badge: isSelfIdentifiedUser ? undefined : { label: t('profile.settings.change'), variant: 'text' },
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
  ];
  const emailAlertSettings: SettingsItemProps[] = [
    {
      id: 'alert-email',
      groupId: SettingsType.emailAlerts,
      icon: BellIcon,
      title: t('profile.settings.email_notifications'),
      value: user?.email || '',
      badge: isSelfIdentifiedUser ? undefined : { label: t('profile.settings.change'), variant: 'text' },
      variant: 'modal',
      children: <ContactProfileDetails variant="email" emailAddress={user?.email || ''} readOnly />,
    },
  ];

  const otherSettings: SettingsItemProps[] = isSelfIdentifiedUser
    ? []
    : [
        {
          id: 'other-settings-deleted-units',
          checked: shouldShowDeletedEntities ?? false,
          value: 'shouldShowDeletedEntities',
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            void updateShowDeletedEntities(event.target.checked);
          },
          groupId: SettingsType.other,
          variant: 'switch',
          description: shouldShowDeletedEntities
            ? t('profile.settings.show_deleted_units.enabled')
            : t('profile.settings.show_deleted_units.disabled'),
          icon: TrashIcon,
          title: t('profile.settings.show_deleted_units.title'),
        },
        {
          id: 'other-settings-show-client-units',
          value: 'showClientUnits',
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            void setShowClientUnits(event.target.checked);
          },
          checked: showClientUnits ?? false,
          groupId: SettingsType.other,
          variant: 'switch',
          description: showClientUnits
            ? t('profile.settings.show_client_units.enabled')
            : t('profile.settings.show_client_units.disabled'),
          title: t('profile.settings.show_client_units.title'),
          icon: BriefcaseIcon,
        },
      ];

  const allSettings = [
    ...contactSettings,
    ...mobileAlertSettings,
    ...contactProfilePhoneSettings,
    ...emailAlertSettings,
    ...contactProfileEmailSettings,
    ...accountAlertSettings,
    ...otherSettings,
  ].map((item) => {
    if (!disabled) return item;
    if (isSelfIdentifiedUser && item.id === 'contact-mobile') return item;
    return { ...item, disabled: true };
  });

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
