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
import { AccountListSkeleton } from '../AccountListSkeleton';
import { useAccountFilters } from '../NotificationsPage/useAccountFilters';
import { partyFieldFragmentToAccountList } from './partyFieldToAccountList';

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const {
    user,
    addFavoriteParty,
    deleteFavoriteParty,
    favoritesGroup,
    isLoading: isLoadingProfile,
    isSuccess: isSuccessProfile,
  } = useProfile();

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
    self: {
      title: t('parties.groups.self'),
    },
    favorites: {
      title: t('parties.groups.favourites'),
    },
    persons: {
      title: t('parties.filter.persons'),
    },
    companies: {
      title: t('parties.filter.companies'),
    },
  };

  const accountListItems =
    !isLoadingParties && !isLoadingProfile && user && filteredParties.length
      ? partyFieldFragmentToAccountList({
          parties: filteredParties,
          isExpanded,
          toggleExpanded,
          favoritesGroup: isSuccessProfile && favoritesGroup ? favoritesGroup : undefined,
          user,
          addFavoriteParty,
          deleteFavoriteParty,
          navigate,
        })
      : [];

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
        {isLoadingParties || isLoadingProfile || !accountListItems.length ? (
          <AccountListSkeleton />
        ) : (
          <AccountList groups={accountListGroups} items={accountListItems} />
        )}
      </Section>
    </PageBase>
  );
};
