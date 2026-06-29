import {
  AvatarGroup,
  type AvatarGroupProps,
  type AvatarVariant,
  type BadgeProps,
  Button,
  type SettingsGroupProps,
  type SettingsItemProps,
  type SettingsItemVariant,
  SnackbarDuration,
  type ToolbarSearchProps,
  type UsedByLogItemProps,
  formatDisplayName,
  useSnackbar,
} from '@altinn/altinn-components';
import {
  BellIcon,
  BriefcaseIcon,
  EarthIcon,
  GlobeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MobileIcon,
  PaperplaneIcon,
  PersonCircleIcon,
  PersonRectangleIcon,
  RecycleIcon,
} from '@navikt/aksel-icons';
import i18n from 'i18next';
import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties.ts';
import { useSILegacyParties } from '../../api/hooks/usePartiesSelectors.ts';
import { updateLanguage } from '../../api/queries.ts';
import { getAltinn2AccountLink } from '../../auth';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { pruneSearchQueryParams } from '../Inbox/queryParams.ts';
import { useSavedSearches } from '../SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../routes.ts';
import { AccountAlertsChannelDetails } from './AccountAlerts/AccountAlertsChannelDetails.tsx';
import { ServiceResourceNotificationsDetails } from './AccountAlerts/ServiceResourceNotificationsDetails.tsx';
import type { Channel } from './AccountAlerts/common.ts';
import { ContactProfileDetails } from './ContactProfileDetails.tsx';
import { LanguageSettingsContent } from './LanguageSettingsContent.tsx';
import { UsernameSetting } from './UsernameSetting.tsx';
import { usePartiesWithNotificationSettings } from './usePartiesWithNotificationSettings.tsx';
import { useProfile } from './useProfile.tsx';
import { useUsername } from './useUsername.tsx';
import { useVerifiedAddresses } from './useVerifiedAddresses.tsx';

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
  profile = 'profile',
  contactAddresses = 'contactAddresses',
  favorites = 'favorites',
  partySettings = 'partySettings',
  partyOverview = 'partyOverview',
  inboxShortcuts = 'inboxShortcuts',
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
}

interface UseSettingsOutput {
  settings: SettingsItemProps[];
  settingsGroups: Record<string, SettingsGroupProps>;
  settingsSearch: ToolbarSearchProps;
  getAccountAlertSettings?: (id: string) => SettingsItemProps[];
}

const getDefaultGroups = (t: (key: string) => string) => ({
  [SettingsType.emailAlerts]: { title: t('profile.settings.email_notifications') },
  [SettingsType.mobileAlerts]: { title: t('profile.settings.sms_notifications') },
  [SettingsType.companies]: { title: t('profile.settings.company_notifications') },
  [SettingsType.persons]: { title: t('profile.settings.person_notifications') },
  [SettingsType.primary]: { title: t('profile.settings.favorite_notifications') },
  [SettingsType.profile]: { title: t('profile.settings.your_profile') },
  [SettingsType.partyOverview]: { title: t('profile.settings.your_parties') },
  [SettingsType.inboxShortcuts]: { title: t('sidebar.inbox') },
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

export const useSettings = ({ options: inputOptions = {}, isLoading }: UseSettingsInput = {}): UseSettingsOutput => {
  const {
    isLoading: isLoadingParties,
    parties,
    selectedParties,
    selectedGroup,
    partyGraph,
    isSelfIdentifiedUser,
    selfIdentifiedUserType,
    currentEndUser,
    selectedPartyIds,
    setSelectedPartyIds,
  } = useParties();
  const enableSIConnectLink = useFeatureFlag<boolean>('SI.emailAccount.enableConnectLink');
  const enableSIPhoneEdit = useFeatureFlag<boolean>('profil.enableSIPhoneEdit');
  const siLegacyParties = useSILegacyParties();
  const hasSILegacyParty = siLegacyParties.length > 0;
  const isSIEmailConnected = selfIdentifiedUserType === 'Email' && hasSILegacyParty;
  const showSIEmailConnectLink = enableSIConnectLink && selfIdentifiedUserType === 'Email';
  const {
    user,
    showClientUnits,
    setShowClientUnits,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
    updateProfileLanguage,
  } = useProfile();
  const { openSnackbar } = useSnackbar();
  const { logError } = useErrorLogger();
  const { savedSearches } = useSavedSearches(selectedPartyIds);
  const { search: currentSearchQuery } = useLocation();

  const { t } = useTranslation();
  const [searchString, setSearchString] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);
  const { partiesWithNotificationSettings, uniqueEmailAddresses, uniquePhoneNumbers } =
    usePartiesWithNotificationSettings(parties);
  const { verifiedAddresses } = useVerifiedAddresses();
  const { username: currentUsername } = useUsername(currentEndUser?.partyUuid);
  const userDisplayName = formatDisplayName({
    fullName: currentEndUser?.name ?? '',
    type: 'person',
  });
  const folkeRegisteretUrl = location.hostname.includes('af.altinn.no')
    ? 'https://www.skatteetaten.no/person/folkeregister/flytte/'
    : 'https://testdata.skatteetaten.no/web/testnorge/soek/freg';
  const krrInfoUrl = 'https://eid.difi.no/nb/kontakt-og-reservasjonsregisteret';

  const handleUpdateLanguage = async (language: string) => {
    if (language === i18n.language) return;
    updateProfileLanguage(language);
    setSelectedLanguage(language);
    void i18n.changeLanguage(language);
    try {
      await updateLanguage(language);
      openSnackbar({
        message: t('profile.settings.language_changed'),
        color: 'company',
        duration: SnackbarDuration.normal,
      });
    } catch (error) {
      logError(
        error as Error,
        {
          context: 'useSettings.handleUpdateLanguage',
          language,
        },
        'Error updating language',
      );
    }
  };

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
    selectedGroup,
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

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const notificationByParty = useMemo(
    () => new Map(partiesWithNotificationSettings.map((p) => [p.party, p])),
    [partiesWithNotificationSettings],
  );

  const groupIncluded = (groupId: SettingsType): boolean => {
    if (options.includeGroups?.length) return options.includeGroups.includes(groupId);
    if (options.excludeGroups?.length) return !options.excludeGroups.includes(groupId);
    return true;
  };

  const settingsSearch = {
    name: 'settings-search',
    label: t('profile.settings.search.label'),
    hideLabel: true,
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
    const account = accountsById.get(id);
    const notificationAccount = notificationByParty.get(id);
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
    const account = accountsById.get(id);
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
          children: (
            <ContactProfileDetails
              variant="alerts"
              phoneNumber={phoneNumber}
              emailAddress={email}
              source="krr"
              readOnly
            />
          ),
          badge: getNotificationsSettingsBadge({ phoneNumber, email, t }),
        },
      ];
    }
    const notificationAccount = notificationByParty.get(id);
    const includedServiceCount = (notificationAccount?.notificationSettings?.resourceIncludeList ?? []).filter(
      (r): r is string => !!r,
    ).length;
    const serviceResourceEntry: SettingsItemProps = {
      id: `${account?.id ?? id}-services`,
      color: (account?.type ?? 'neutral') as SettingsItemProps['color'],
      groupId: String(account?.groupId ?? ''),
      title: t('profile.service_notifications.title'),
      description:
        includedServiceCount > 0
          ? t('profile.service_notifications.active_for_count', { count: includedServiceCount })
          : t('profile.service_notifications.active_for_all'),
      value: 'services',
      icon: BellIcon,
      variant: 'modal' as SettingsItemVariant,
      modalProps: {
        icon: account?.icon,
        title: account?.name,
        description: account?.description ? String(account?.description) : '',
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

  // Group IDs that account alert items may end up with — used to skip the per-account
  // build entirely when none of these groups will pass the include/exclude filter.
  const ACCOUNT_ALERT_OUTPUT_GROUPS = [
    SettingsType.companies,
    SettingsType.persons,
    SettingsType.primary,
    SettingsType.favorites,
  ] as const;

  const accountAlertSettings: SettingsItemProps[] = ACCOUNT_ALERT_OUTPUT_GROUPS.some(groupIncluded)
    ? accounts
        .filter((a) => {
          if (!options.excludeGroups) {
            return true;
          }
          return !(options.excludeGroups.includes(SettingsType.companies) && a.type === 'company');
        })
        .flatMap((a) => getAccountAlertSettings(a.id))
    : [];

  const address = `${user?.party?.person?.mailingAddress}, ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;

  const siEmailDescription =
    selfIdentifiedUserType === 'Email'
      ? isSIEmailConnected
        ? `${t('contact_profile.self_identified_email_user')} ${t('profile.settings.si_email.connected_description', { count: siLegacyParties.length })}`
        : showSIEmailConnectLink
          ? `${t('contact_profile.self_identified_email_user')} ${t('profile.settings.si_email.connect_account_description')}`
          : t('contact_profile.self_identified_email_user')
      : undefined;

  const profileSettings: SettingsItemProps[] = isSelfIdentifiedUser
    ? [
        {
          id: 'profile-settings',
          groupId: SettingsType.profile,
          title: userDisplayName,
          icon: {
            type: 'person',
            name: userDisplayName,
          },
          variant: 'link',
          as: 'div',
          summary: siEmailDescription,
          controls: showSIEmailConnectLink ? (
            <Button as="a" size="xs" variant="outline" href={getAltinn2AccountLink()}>
              {t('profile.settings.si_email.add_account')}
            </Button>
          ) : undefined,
        },
        ...(isSIEmailConnected
          ? siLegacyParties.map<SettingsItemProps>((legacy) => ({
              id: `si-old-username-${legacy.party}`,
              groupId: SettingsType.profile,
              title: t('profile.settings.si_email.linked_account'),
              value: legacy.name,
              icon: PersonCircleIcon,
              variant: 'default' as SettingsItemVariant,
              as: 'div' as const,
            }))
          : []),
      ]
    : [
        {
          id: 'profile-settings',
          groupId: SettingsType.profile,
          title: userDisplayName,
          icon: {
            type: 'person',
            name: userDisplayName,
          },
          variant: 'link',
          as: 'div',
        },
        {
          id: 'profile-address',
          groupId: SettingsType.profile,
          summary: (
            <p>
              {t('contact_profile.address_from_register_part1')}{' '}
              <a href={folkeRegisteretUrl}>{t('contact_profile.address_from_register_link')}</a>
            </p>
          ),
          icon: EarthIcon,
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
              source="folkeregisteret"
              readOnly
            />
          ),
        },
        {
          id: 'profile-username',
          groupId: SettingsType.profile,
          icon: PersonCircleIcon,
          title: t('profile.username.title'),
          value: currentUsername ?? '',
          summary: <p>{t('profile.username.summary')}</p>,
          variant: 'modal',
          as: 'div',
          badge: currentEndUser
            ? { label: t('profile.settings.add'), variant: 'text' }
            : { label: t('profile.settings.change'), variant: 'text' },
          children: <UsernameSetting partyUuid={currentEndUser?.partyUuid} />,
        },
      ];

  const contactSettings: SettingsItemProps[] = [
    {
      id: 'contact-mobile',
      groupId: SettingsType.contact,
      icon: MobileIcon,
      title: t('profile.settings.mobile_phone'),
      value: user?.phoneNumber || '',
      disabled: isSelfIdentifiedUser && !enableSIPhoneEdit,
      badge: isSelfIdentifiedUser && !enableSIPhoneEdit ? undefined : getChangeSettingsBadge(user?.phoneNumber || ''),
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="phone"
          source="krr"
          phoneNumber={user?.phoneNumber || ''}
          usedByItems={getUsedByPhoneNumber(user?.phoneNumber ?? '')}
          isSelfIdentifiedUser={enableSIPhoneEdit && isSelfIdentifiedUser}
          readOnly
        />
      ),
    },
    {
      id: 'contact-email',
      summary: isSelfIdentifiedUser ? undefined : (
        <p>
          {t('contact_profile.contact_info_part1')} <a href={krrInfoUrl}>{t('contact_profile.email_register')}</a>
          {t('contact_profile.contact_info_part2')}
        </p>
      ),
      groupId: SettingsType.contact,
      disabled: isSelfIdentifiedUser,
      icon: PaperplaneIcon,
      title: t('profile.settings.email_address'),
      value: isSelfIdentifiedUser ? (currentEndUser?.name ?? user?.email ?? '') : user?.email || '',
      badge: isSelfIdentifiedUser ? undefined : getChangeSettingsBadge(user?.email || ''),
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="email"
          source={isSelfIdentifiedUser ? 'altinn' : 'krr'}
          emailAddress={isSelfIdentifiedUser ? (currentEndUser?.name ?? user?.email ?? '') : user?.email || ''}
          usedByItems={getUsedByEmail(user?.email ?? '')}
          readOnly
        />
      ),
    },
  ];

  const contactProfileEmailSettings: SettingsItemProps[] = !groupIncluded(SettingsType.emailProfiles)
    ? []
    : uniqueEmailAddresses.map((uea) => ({
        id: 'contact-profile-email-setting-' + uea.email,
        groupId: SettingsType.emailProfiles,
        icon: PersonRectangleIcon,
        title: t('profile.settings.notification_profile_email'),
        value: uea.email,
        controls: (
          <>
            {isVerifiedAddress(uea.email, 'Email') && (
              <AvatarGroup items={getAvatarGroup(getUsedByEmail(uea.email))} size="lg" />
            )}
          </>
        ),
        variant: 'modal',
        children: (
          <ContactProfileDetails
            variant="email"
            source="altinn"
            emailAddress={uea.email}
            usedByItems={getUsedByEmail(uea.email)}
            readOnly
          />
        ),
      }));

  const contactProfilePhoneSettings: SettingsItemProps[] = !groupIncluded(SettingsType.mobileProfile)
    ? []
    : uniquePhoneNumbers.map((uep) => ({
        id: 'contact-profile-phone-setting-' + uep.phoneNumber,
        groupId: SettingsType.mobileProfile,
        icon: PersonRectangleIcon,
        title: t('profile.settings.notification_profile_sms'),
        value: uep.phoneNumber,
        controls: (
          <>
            {isVerifiedAddress(uep.phoneNumber, 'Sms') && (
              <AvatarGroup items={getAvatarGroup(getUsedByPhoneNumber(uep.phoneNumber))} size="lg" />
            )}
          </>
        ),
        variant: 'modal',
        children: (
          <ContactProfileDetails
            variant="phone"
            source="altinn"
            phoneNumber={uep.phoneNumber}
            readOnly
            usedByItems={getUsedByPhoneNumber(uep.phoneNumber)}
          />
        ),
      }));

  const addressCount =
    uniqueEmailAddresses.length + uniquePhoneNumbers.length + (user?.email ? 1 : 0) + (user?.phoneNumber ? 1 : 0);
  const contactAddressLink: SettingsItemProps[] = [
    {
      id: 'contact-address-link',
      variant: 'link',
      title: t('profile.notifications.heading'),
      as: (props: LinkProps) => (
        <Link {...props} to={PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery)} />
      ),
      groupId: SettingsType.contactAddresses,
      badge: {
        label: t('profile.settings.notification_addresses_count', {
          count: addressCount,
        }),
      },
      linkIcon: true,
      icon: PersonRectangleIcon,
      summary: <p>{t('profile.settings.notification_addresses_summary')}</p>,
    },
  ];

  const otherSettings: SettingsItemProps[] = [
    {
      id: 'language',
      groupId: SettingsType.other,
      variant: 'modal',
      icon: GlobeIcon,
      value: i18n.language,
      description: t('word.locale.' + i18n.language),
      title: 'Språk/language',
      badge: {
        variant: 'text',
        label: t('word.change'),
      },
      modalProps: {
        icon: GlobeIcon,
        title: 'Språk/language',
        buttons: [
          {
            label: t('word.save'),
            onClick: () => {
              void handleUpdateLanguage(selectedLanguage);
            },
            close: true,
          },
          {
            label: t('word.cancel'),
            variant: 'outline',
            close: true,
          },
        ],
      },
      children: <LanguageSettingsContent selectedLanguage={selectedLanguage} onSelect={setSelectedLanguage} />,
    },
  ];

  const partyOverviewLink: SettingsItemProps[] = [
    {
      id: 'party-overview-link',
      variant: 'link',
      title: t('sidebar.profile.parties'),
      as: (props: LinkProps) => (
        <Link {...props} to={PageRoutes.partiesOverview + pruneSearchQueryParams(currentSearchQuery)} />
      ),
      groupId: SettingsType.partyOverview,
      badge: {
        label: t('profile.parties', { count: parties.length }),
      },
      linkIcon: true,
      icon: HeartIcon,
      summary: <p>{t('profile.settings.parties_overview_summary')}</p>,
    },
  ];

  const inboxShortcuts: SettingsItemProps[] = [
    {
      id: 'inbox-saved-searched',
      variant: 'link',
      title: t('sidebar.saved_searches'),
      as: (props: LinkProps) => (
        <Link {...props} to={PageRoutes.savedSearches + pruneSearchQueryParams(currentSearchQuery)} />
      ),
      groupId: SettingsType.inboxShortcuts,
      linkIcon: true,
      icon: MagnifyingGlassIcon,
      badge: {
        label: t('profile.saved_searches', { count: savedSearches.length }),
      },
      summary: <p>{t('profile.settings.saved_searches_summary')}</p>,
    },
  ];

  const mobileAlertSettings: SettingsItemProps[] = [
    {
      id: 'alert-mobile',
      groupId: SettingsType.mobileAlerts,
      icon: BellIcon,
      title: t('profile.settings.sms_notifications'),
      summary: t('profile.settings.sms_notifications_summary'),
      disabled: isSelfIdentifiedUser,
      value: user?.phoneNumber || '',
      badge: isSelfIdentifiedUser ? undefined : { label: t('profile.settings.change'), variant: 'text' },
      variant: 'modal',
      children: (
        <ContactProfileDetails
          variant="phone"
          source="krr"
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
      disabled: isSelfIdentifiedUser,
      icon: BellIcon,
      title: t('profile.settings.email_notifications'),
      summary: t('profile.settings.email_notifications_summary'),
      value: user?.email || '',
      badge: isSelfIdentifiedUser ? undefined : { label: t('profile.settings.change'), variant: 'text' },
      variant: 'modal',
      children: <ContactProfileDetails variant="email" emailAddress={user?.email || ''} source="krr" readOnly />,
    },
  ];

  const partySettings: SettingsItemProps[] = isSelfIdentifiedUser
    ? []
    : [
        {
          id: 'other-settings-deleted-units',
          checked: shouldShowDeletedEntities ?? false,
          value: 'shouldShowDeletedEntities',
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            void updateShowDeletedEntities(event.target.checked);
          },
          groupId: SettingsType.partySettings,
          variant: 'switch',
          icon: RecycleIcon,
          title: t('profile.settings.show_deleted_units.title'),
        },
        {
          id: 'other-settings-show-client-units',
          value: 'showClientUnits',
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            void setShowClientUnits(event.target.checked);
          },
          checked: showClientUnits ?? false,
          groupId: SettingsType.partySettings,
          variant: 'switch',
          description: t('profile.settings.show_client_units.description'),
          title: t('profile.settings.show_client_units.title'),
          icon: BriefcaseIcon,
        },
      ];

  const allSettings = [
    ...profileSettings,
    ...contactSettings,
    ...contactAddressLink,
    ...partyOverviewLink,
    ...partySettings,
    ...inboxShortcuts,
    ...mobileAlertSettings,
    ...contactProfilePhoneSettings,
    ...emailAlertSettings,
    ...contactProfileEmailSettings,
    ...accountAlertSettings,
    ...otherSettings,
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
