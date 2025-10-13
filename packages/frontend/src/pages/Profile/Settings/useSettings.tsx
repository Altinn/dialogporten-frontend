import {
  AvatarGroup,
  type BadgeProps,
  type SettingsGroupProps,
  type SettingsItemProps,
  type ToolbarSearchProps,
  type UsedByLogItemProps,
} from '@altinn/altinn-components';
import type { SettingsItemVariant } from '@altinn/altinn-components/dist/types/lib/components/Settings/SettingsItem';
import { BellIcon, HouseHeartIcon, MobileIcon, PaperplaneIcon, PersonRectangleIcon } from '@navikt/aksel-icons';
import { type ChangeEvent, useState } from 'react';
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
  groups?: Record<string, Record<string, string>>;
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

const defaultGroups = {
  [SettingsType.contact]: { title: 'Kontaktinformasjon' },
  [SettingsType.alerts]: { title: 'Varsling' },
  [SettingsType.companies]: { title: 'Varslinger for virksomheter' },
  [SettingsType.persons]: { title: 'Varslinger for andre personer' },
  [SettingsType.primary]: { title: 'Varslinger for favoritter' },
  [SettingsType.profiles]: { title: 'Alternative varslingsadresser' },
};
const defaultOptions = {
  groups: defaultGroups,
  includeGroups: undefined,
  excludeGroups: undefined,
};

export const getNotificationsSettingsBadge = ({
  phoneNumber,
  email,
  isDeleted,
}: { phoneNumber?: string | undefined; email?: string | undefined; isDeleted?: boolean }): BadgeProps => {
  const phoneLabel = phoneNumber?.length ? 'SMS' : '';
  const emailLabel = email?.length ? 'E-post' : '';

  if (isDeleted) {
    return {
      color: 'danger',
      variant: 'base',
      label: 'Slettet',
    };
  }

  if (!phoneNumber && !email) {
    return {
      variant: 'text',
      label: 'Legg til',
    };
  }
  return {
    label: [emailLabel, phoneLabel].filter(Boolean).join(emailLabel && phoneLabel ? ' og ' : ''),
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
    return (
      (userEmailGroup?.parties ?? []).map((party) => ({
        id: party.partyUuid,
        name: party.name,
        type: party.type,
        variant: party.hasParentParty ? 'outline' : 'solid',
      })) || []
    );
  };

  const getUsedByPhoneNumber = (phoneNumber?: string): UsedByLogItemProps[] | undefined => {
    if (!phoneNumber) return undefined;
    const userPhoneGroup = uniquePhoneNumbers?.find((group) => group?.phoneNumber === phoneNumber);
    return (
      (userPhoneGroup?.parties ?? []).map((party) => ({
        id: party.partyUuid,
        name: party.name,
        type: party.type,
        variant: (party.hasParentParty ? 'outline' : 'solid') as UsedByLogItemProps['variant'],
      })) || []
    );
  };

  const options = { ...defaultOptions, ...inputOptions };

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
        return 'Ingen treff';
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
        loading: { title: 'Laster' },
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
        description: account?.description ? String(account?.description) : '',
      },
      children: account?.isCurrentEndUser ? (
        <ContactProfileDetails variant="alerts" phoneNumber={phoneNumber} emailAddress={email} readOnly />
      ) : (
        <AccountAlertsDetails notificationParty={notificationAccount} onClose={() => {}} />
      ),
      badge: getNotificationsSettingsBadge({ phoneNumber, email, isDeleted: account?.isDeleted }),
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
      title: 'Mobiltelefon',
      value: user?.phoneNumber || '',
      badge: { label: 'Endre', variant: 'text' },
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
      title: 'E-postadresse',
      value: user?.email || '',
      badge: { label: 'Endre', variant: 'text' },
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
      title: 'Adresse',
      value: address,
      badge: { label: 'Endre', variant: 'text' },
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
    title: 'Varslingsprofil for e-post',
    value: uea.email,
    badge: <AvatarGroup items={getUsedByEmail(uea.email)} size="lg" />,
    variant: 'modal',
    children: (
      <ContactProfileDetails
        variant="email"
        emailAddress={uea.email}
        usedByItems={getUsedByEmail(uea.email)}
        description="Snart kan du endre varslingsadressene dine her."
        readOnly
      />
    ),
  }));

  const contactProfilePhoneSettings: SettingsItemProps[] = uniquePhoneNumbers.map((uep) => ({
    id: 'contact-profile-phone-setting-' + uep.phoneNumber,
    groupId: SettingsType.profiles,
    icon: PersonRectangleIcon,
    title: 'Varslingsprofil for SMS',
    value: uep.phoneNumber,
    badge: <AvatarGroup items={getUsedByPhoneNumber(uep.phoneNumber)} size="lg" />,
    variant: 'modal',
    children: (
      <ContactProfileDetails
        variant="phone"
        phoneNumber={uep.phoneNumber}
        readOnly
        usedByItems={getUsedByPhoneNumber(uep.phoneNumber)}
        description="Snart kan du endre varslingsadressene dine her."
      />
    ),
  }));

  const alertSettings: SettingsItemProps[] = [
    {
      id: 'alert-mobile',
      groupId: SettingsType.alerts,
      icon: BellIcon,
      title: 'Varslinger på SMS',
      value: user?.phoneNumber || '',
      badge: { label: 'Endre', variant: 'text' },
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
      title: 'Varslinger på e-post',
      value: user?.email || '',
      badge: { label: 'Endre', variant: 'text' },
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
        'search-results': { title: hits.length + ' treff' },
      },
      settings: hits,
      settingsSearch,
    };
  }

  return {
    settings,
    settingsGroups: accountGroups,
    settingsSearch,
    getAccountAlertSettings,
  };
};
