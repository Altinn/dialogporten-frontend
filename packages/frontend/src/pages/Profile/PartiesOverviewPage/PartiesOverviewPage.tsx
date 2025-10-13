import {
  AccountList,
  AccountListItemDetails,
  type AccountListItemProps,
  Heading,
  PageBase,
  PageNav,
  Section,
  type SettingsItemProps,
  Toolbar,
} from '@altinn/altinn-components';
import type { AccountListItemType } from '@altinn/altinn-components/dist/types/lib/components/Account/AccountListItem';
import { BellIcon, HashtagIcon, InboxIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { type PartyItemProp, urnToSSNOrOrgNo, useAccounts } from '../../../components/PageLayout/Accounts/useAccounts';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { useProfileOnboarding } from '../../../onboardingTour/useProfileOnboarding';
import { getBreadcrumbs } from '../Settings/Settings.tsx';
import { useSettings } from '../Settings/useSettings.tsx';
import { useAccountFilters } from '../useAccountFilters.tsx';

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { getAccountAlertSettings, settings } = useSettings();
  const { addFavoriteParty, deleteFavoriteParty } = useProfile();
  const { parties, selectedParties, allOrganizationsSelected, isLoading } = useParties();
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<string>('');

  const { filters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching } = useAccountFilters({
    searchValue,
    parties: parties,
  });

  const { accounts, accountGroups } = useAccounts({
    parties: filteredParties,
    selectedParties,
    allOrganizationsSelected,
    isLoading,
    options: {
      showFavorites: !isSearching,
    },
  });

  usePageTitle({ baseTitle: t('component.parties_overview') });
  useProfileOnboarding({ isLoading, pageType: 'parties' });

  const toggleExpanded = (id: string) => setExpandedItem((currentId) => (currentId === id ? '' : id));

  const onToggleFavourite = async (partyUuid: string, isFavorite?: boolean) => {
    if (isFavorite) {
      await deleteFavoriteParty(partyUuid);
    } else {
      await addFavoriteParty(partyUuid);
    }
  };

  // TODO: Add more cases
  const getPartyButtons = (isCurrentEndUser: boolean) => {
    if (isCurrentEndUser) {
      return [{ label: 'Gå til innboks', as: (props: LinkProps) => <Link {...props} to="/" /> }];
    }
  };

  const getPartyNotificationsSettings = (id: string): SettingsItemProps[] => {
    if (id && typeof getAccountAlertSettings === 'function') {
      return [
        {
          ...getAccountAlertSettings!(id!),
          id: 'mobile',
          icon: BellIcon,
          title: 'Varslingsadresser',
        },
      ];
    }
    return [];
  };

  const getCompanySettings = (id: string): SettingsItemProps[] => {
    return [
      ...getPartyNotificationsSettings(id),
      {
        id: 'orgNr',
        icon: HashtagIcon,
        title: 'Organisasjonsnummer',
        value: urnToSSNOrOrgNo(id),
      },
    ];
  };

  const getPersonSettings = (id: string): SettingsItemProps[] => {
    return [
      ...getPartyNotificationsSettings(id),
      {
        id: 'snr',
        icon: HashtagIcon,
        title: 'Fødselsnummer',
        value: urnToSSNOrOrgNo(id),
      },
    ];
  };

  const PartyDetails = ({
    type,
    isCurrentEndUser,
    id,
  }: { type: AccountListItemType; isCurrentEndUser: boolean; id: string }) => {
    if (isCurrentEndUser) {
      const contactSettings = settings.filter((s) => s.groupId === 'contact');
      return (
        <AccountListItemDetails color="person" buttons={getPartyButtons(isCurrentEndUser)} settings={contactSettings} />
      );
    }

    if (type === 'company') {
      return (
        <AccountListItemDetails
          color="company"
          settings={getCompanySettings(id)}
          buttons={getPartyButtons(isCurrentEndUser)}
        />
      );
    }

    if (type === 'person') {
      return (
        <AccountListItemDetails
          color="person"
          settings={getPersonSettings(id)}
          buttons={getPartyButtons(isCurrentEndUser)}
        />
      );
    }

    return null;
  };

  const mapAccountToPartyListItem = (account: PartyItemProp): AccountListItemProps => {
    const { label: _, variant: __, ...party } = account;
    const itemId = account.id + account.groupId;
    return {
      ...party,
      groupId: String(party.groupId),
      favourite: party.isFavorite,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted,
      collapsible: true,
      expanded: expandedItem === itemId,
      onClick: () => toggleExpanded(itemId),
      as: 'button',
      title: party.name,
      onToggleFavourite: () => onToggleFavourite(party.uuid, party.isFavorite),
      children: <PartyDetails type={party.type} isCurrentEndUser={party.isCurrentEndUser ?? false} id={party.id} />,
      contextMenu: {
        id: party.groupId + party.id + '-menu',
        items: [
          {
            id: party.groupId + 'inbox',
            groupId: 'inbox',
            icon: InboxIcon,
            title: 'Gå til Innboks',
            as: (props) => <Link to={'/?party=' + party.id} {...props} />,
          },
        ],
      },
    };
  };

  const accountListItems = accounts.map(mapAccountToPartyListItem);
  const hits = accountListItems.map((a) => ({ ...a, groupId: 'search' }));
  const searchGroup = {
    search: { title: accountListItems.length + ' hits' },
  };

  return (
    <PageBase color="person">
      <PageNav breadcrumbs={getBreadcrumbs(t('sidebar.profile'), t('sidebar.profile.parties'), search)} />
      <Section as="header" spacing={6}>
        <Heading size="xl">{t('sidebar.profile.parties')}</Heading>
        <Toolbar
          search={{
            name: 'party-search',
            placeholder: t('parties.search.placeholder'),
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          getFilterLabel={getFilterLabel}
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filters={filters}
        />
        <AccountList groups={isSearching ? searchGroup : accountGroups} items={isSearching ? hits : accountListItems} />
      </Section>
    </PageBase>
  );
};
