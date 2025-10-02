import {
  AccountList,
  type AvatarProps,
  Heading,
  PageBase,
  PageNav,
  Section,
  Toolbar,
  formatDisplayName,
} from '@altinn/altinn-components';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { pruneSearchQueryParams } from '../../Inbox/queryParams';
import { PageRoutes } from '../../routes';
import { useAccountFilters } from '../NotificationsPage/useAccountFilters';
import { partyFieldFragmentToAccountListItem } from './partyFieldToAccountList';

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { groups, user, addFavoriteParty, deleteFavoriteParty, favoritesGroup } = useProfile();
  const navigate = useNavigate();
  const { parties, isLoading: isLoadingParties } = useParties();
  const [searchValue, setSearchValue] = useState<string>('');
  const { filters, getFilterLabel, filterState, setFilterState, filteredParties } = useAccountFilters({
    searchValue,
    partiesToFilter: parties,
  });

  const endUserName = `${user?.party?.person?.firstName ?? ''} ${user?.party?.person?.lastName ?? ''}`.trim();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  usePageTitle({ baseTitle: t('component.parties_overview') });

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isExpanded = useCallback(
    (id: string) => {
      return expandedItems.includes(id);
    },
    [expandedItems],
  );

  const getBreadcrumbs = (person?: AvatarProps, reverseNameOrder?: boolean) => {
    if (!person) return [];
    return [
      {
        label: t('word.frontpage'),
        as: (props: React.ComponentProps<typeof Link>) => (
          <Link {...props} to={PageRoutes.inbox + pruneSearchQueryParams(search)} />
        ),
      },
      {
        label: formatDisplayName({
          fullName: person.name,
          type: person.type as 'person' | 'company',
          reverseNameOrder,
        }),
        href: PageRoutes.profile,
      },
      {
        label: t('sidebar.profile.parties'),
        href: PageRoutes.partiesOverview,
      },
    ];
  };

  const accountListGroups = {
    primary: {
      title: t('parties.groups.self'),
    },
    favourites: {
      title: t('parties.groups.favourites'),
    },
    persons: {
      title: t('parties.groups.favourites'),
    },
    secondary: {
      title: t('parties.groups.other_accounts'),
    },
  };

  // Below code needed to make current user be top of the page
  const currentEndUser = filteredParties.find((party) => party.isCurrentEndUser);
  const otherUsers = filteredParties.find((party) => !party.isCurrentEndUser);
  const sortedParties = [...(currentEndUser ? [currentEndUser] : []), ...(otherUsers ? [otherUsers] : [])];

  return (
    <PageBase color="person">
      <PageNav
        breadcrumbs={getBreadcrumbs({
          name: endUserName ?? '',
          type: 'person',
        })}
      />
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
      </Section>
      <Section spacing={6}>
        {isLoadingParties ? (
          <AccountList
            groups={{ loading: { title: t('word.loading') } }}
            items={[
              {
                id: 'loading',
                groupId: 'loading',
                loading: true,
                title: 'is loading, nothing here',
                type: 'company',
                disabled: true,
                interactive: false,
                name: '',
              },
            ]}
          />
        ) : (
          <AccountList
            groups={accountListGroups}
            items={partyFieldFragmentToAccountListItem({
              parties: sortedParties,
              isExpanded,
              toggleExpanded,
              user,
              favoritesGroup,
              addFavoriteParty,
              deleteFavoriteParty,
              groups,
              navigate,
            })}
          />
        )}
      </Section>
    </PageBase>
  );
};
