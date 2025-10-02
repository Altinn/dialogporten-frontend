import {
  AccountList,
  type AvatarProps,
  Heading,
  PageBase,
  PageNav,
  Section,
  Toolbar,
  type ToolbarFilterProps,
  formatDisplayName,
} from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { pruneSearchQueryParams } from '../../Inbox/queryParams';
import { PageRoutes } from '../../routes';
import { partyFieldFragmentToAccountListItem } from './partyFieldToAccountList';

enum FilterStateEnum {
  ALL_PARTIES = 'ALL_PARTIES',
  PERSONS = 'PERSONS',
  COMPANIES = 'COMPANIES',
}

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { groups, user, addFavoriteParty, deleteFavoriteParty, favoritesGroup } = useProfile();
  const navigate = useNavigate();
  const { parties, isLoading: isLoadingParties, deletedParties } = useParties();
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterState, setFilterState] = React.useState<FilterState>({
    partyScope: [FilterStateEnum.ALL_PARTIES],
    showDeleted: [],
  });
  const showDeleted = (filterState?.showDeleted?.length ?? 0) > 0;

  const endUserName = `${user?.party?.person?.firstName ?? ''} ${user?.party?.person?.lastName ?? ''}`.trim();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  usePageTitle({ baseTitle: t('component.parties_overview') });

  const filteredParties = React.useMemo(() => {
    const filters = filterState?.partyScope ?? [];
    const includeDeletedParties = showDeleted || filters.includes(FilterStateEnum.ALL_PARTIES);

    let result = includeDeletedParties ? [...parties, ...deletedParties] : [...parties];

    if (searchValue.length > 0) {
      const search = searchValue.toLowerCase();
      result = result.filter(
        (party) => party.name.toLowerCase().includes(search) || party.party.toLowerCase().includes(search),
      );
    }

    result = result.filter((party) => {
      if (filters.includes(FilterStateEnum.ALL_PARTIES)) {
        return true;
      }

      if (filters.includes(FilterStateEnum.COMPANIES) && party.partyType === 'Organization') {
        return true;
      }

      return filters.includes(FilterStateEnum.PERSONS) && party.partyType === 'Person';
    });

    return result;
  }, [parties, deletedParties, filterState, searchValue, showDeleted]);

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

  const filterOptions: ToolbarFilterProps[] = [
    {
      optionType: 'radio',
      name: 'partyScope',
      label: t('filter_bar.add_filter'),
      options: [
        {
          groupId: '1',
          label: t('parties.filter.all_parties'),
          value: FilterStateEnum.ALL_PARTIES,
        },
        {
          groupId: '1',
          label: t('parties.filter.persons'),
          value: FilterStateEnum.PERSONS,
        },
        {
          groupId: '1',
          label: t('parties.filter.companies'),
          value: FilterStateEnum.COMPANIES,
        },
        {
          name: 'showDeleted',
          type: 'checkbox',
          groupId: 'company',
          label: t('parties.filter.show_deleted'),
          value: 'deleted',
          hidden:
            filterState?.partyScope?.includes(FilterStateEnum.PERSONS) ||
            filterState?.partyScope?.includes(FilterStateEnum.ALL_PARTIES) ||
            deletedParties.length === 0,
        },
      ],
    },
  ];

  const getFilterLabel = (_: string, filterValues: (string | number)[] | undefined) => {
    if (filterValues?.includes(FilterStateEnum.ALL_PARTIES)) {
      return t('parties.filter.all_parties');
    }

    return (
      filterValues
        ?.map((value) => {
          switch (value) {
            case FilterStateEnum.PERSONS:
              return t('parties.filter.persons');
            case FilterStateEnum.COMPANIES:
              return showDeleted ? t('parties.labels.all_organizations') : t('parties.filter.companies');
            default:
              return value.toString();
          }
        })
        .join(', ') || t('parties.filter.choose_parties')
    );
  };
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
          filters={filterOptions}
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
              parties: filteredParties,
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
