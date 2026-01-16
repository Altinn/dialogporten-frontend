import {
  type Account,
  type AccountMenuItemProps,
  type AvatarProps,
  Button,
  DialogList,
  DsAlert,
  DsParagraph,
  Flex,
  Heading,
  PageBase,
  Section,
  type SeenByLogItemProps,
  Toolbar,
} from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { createFiltersURLQuery, createMessageBoxLink } from '../../auth';
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx';
import { Notice } from '../../components/Notice';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchString } from '../../components/PageLayout/Search/';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
import { SeenByModal } from '../../components/SeenByModal/SeenByModal.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useAlertBanner } from '../../hooks/useAlertBanner.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useInboxOnboarding } from '../../onboardingTour';
import { PageRoutes } from '../routes.ts';
import { AlertBanner } from './AlertBanner.tsx';
import { Altinn2ActiveSchemasNotification } from './Altinn2ActiveSchemasNotification.tsx';
import { FilterCategory, readFiltersFromURLQuery } from './filters.ts';
import { resourceList } from './services/resources.ts';
import type { Resource } from './services/services.ts';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';
import { useMockError } from './useMockError.tsx';
import { useOrganizations } from './useOrganizations.ts';

type InboxProps = {
  viewType: InboxViewType;
};

export interface CurrentSeenByLog {
  title: string;
  dialogId: string;
  items: SeenByLogItemProps[];
}

export const Inbox = ({ viewType }: InboxProps) => {
  const { t } = useTranslation();
  const {
    selectedParties,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isSelfIdentifiedUser,
    currentPartyUuid,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
    organizationLimitReached,
  } = useParties();
  useMockError();
  const location = useLocation();
  const { organizations } = useOrganizations();
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));
  const [serviceSearchString, setServiceSearchString] = useState<string>('');
  const [serviceFilterState, setServiceFilterState] = useState<FilterState>({});
  const [currentSeenByLogModal, setCurrentSeenByLogModal] = useState<CurrentSeenByLog | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isAltinn2MessagesEnabled = useFeatureFlag<boolean>('inbox.enableAltinn2Messages');
  const isAlertBannerEnabled = useFeatureFlag<boolean>('inbox.enableAlertBanner');
  const alertBannerContent = useAlertBanner();

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const allowedFilters = Object.values(FilterCategory);
    const updatedURL = createFiltersURLQuery(filters, allowedFilters, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });
    setFilterState(filters);
  };

  const onServiceFiltersChange = (filters: FilterState) => {
    setServiceFilterState(filters);
  };

  const { enteredSearchValue } = useSearchString();

  const validSearchString = enteredSearchValue.length > 2 ? enteredSearchValue : undefined;
  const hasValidFilters = Object.values(filterState).some((arr) => typeof arr !== 'undefined' && arr?.length > 0);
  const searchMode = viewType === 'inbox' && (hasValidFilters || !!validSearchString);
  const savedSearchDisabled = isSavedSearchDisabled(filterState, enteredSearchValue);
  const serviceResourcesFilter = !(serviceFilterState?.resource ?? []).length
    ? []
    : (serviceFilterState?.resource ?? []).map((r) => 'urn:altinn:resource:' + r);
  const partiesForUseDialogs = allOrganizationsSelected && serviceResourcesFilter.length > 0 ? [] : selectedParties;

  const {
    dialogs,
    isLoading: isLoadingDialogs,
    isSuccess: dialogsSuccess,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDialogs({
    //parties: serviceResourcesFilter.length ? [] : selectedParties,
    parties: partiesForUseDialogs,
    viewType,
    filterState,
    search: validSearchString,
    queryKey: QUERY_KEYS.DIALOGS,
    serviceResources: serviceResourcesFilter,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (location.search) {
      setFilterState(readFiltersFromURLQuery(location.search));
    }
  }, [searchParams.toString()]);

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount, filterAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    options: {
      showGroups: true,
    },
  });

  const { filters, getFilterLabel } = useFilters({ viewType });

  usePageTitle({
    baseTitle: viewType,
    searchValue: enteredSearchValue,
    filterState,
    getFilterLabel,
  });

  const isLoading = isLoadingParties || isLoadingDialogs;

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  useEffect(() => {
    const scrollToId = location?.state?.scrollToId;
    const listElToScroll = document.getElementById(scrollToId);
    if (!isLoading) {
      if (listElToScroll) {
        listElToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isLoading]);

  const resources: Account[] = useMemo(() => {
    const allServicesOption = {
      id: 'all-services',
      groupId: 'all-services',
      type: 'company' as const,
      icon: {
        name: 'Alle tjenester',
        type: 'company',
        imageUrl: 'https://altinncdn.no/orgs/digdir/digdir.svg',
      } as AvatarProps,
      name: 'Alle tjenester',
    };

    const mappedResources: Account[] = (resourceList as Resource[]).map((resource) => ({
      id: resource.identifier,
      groupId: 'all',
      selected: serviceFilterState?.resource?.[0] === resource.identifier,
      type: 'company' as const,
      icon: {
        name: resource?.title?.nb || resource?.title?.['nb-no'],
        type: 'company',
        imageUrl: getOrganization(organizations, resource.hasCompetentAuthority.orgcode ?? '')?.logo,
      } as AvatarProps,
      name: resource.title.nb || resource.title.en || resource.identifier,
      description: resource.identifier,
    }));

    return [allServicesOption, ...mappedResources];
  }, [organizations, serviceFilterState]);

  const serviceSearchProps = {
    name: 'service-search',
    value: serviceSearchString,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setServiceSearchString(event.target.value);
    },
    placeholder: 'Søk etter tjeneste',
    getResultsLabel: (hits: number) => {
      if (hits === 0) {
        return t('parties.search.no_results');
      }
      return t('parties.results', { hits });
    },
  };

  useInboxOnboarding({
    isLoadingParties,
    isLoadingDialogs,
    dialogsSuccess,
    dialog: dialogs[0] || null,
    viewType,
  });

  const { groupedDialogs, groups } = useGroupedDialogs({
    onSeenByLogModalChange: setCurrentSeenByLogModal,
    items: dialogs,
    hasNextPage,
    displaySearchResults: searchMode,
    filters: filterState,
    viewType,
    isLoading,
    isFetchingNextPage,
  });

  const serviceFilterAccount = (item: AccountMenuItemProps, search: string) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const haystack = [item.title, item.name, item.id].filter(Boolean).map((v) => String(v).toLowerCase());

    return haystack.some((v) => v.includes(q));
  };

  if (unableToLoadParties) {
    return (
      <PageBase>
        <DsAlert data-color="danger">
          <Heading data-size="xs">{t('inbox.unable_to_load_parties.title')}</Heading>
          <DsParagraph>
            {t('inbox.unable_to_load_parties.body')}
            <a href="/api/logout">{t('inbox.unable_to_load_parties.link')}</a>
          </DsParagraph>
        </DsAlert>
      </PageBase>
    );
  }

  if (isSelfIdentifiedUser) {
    return (
      <PageBase margin="page">
        <Notice
          title={t('notice.self_identified_warning.title')}
          description={t('notice.self_identified_warning.description')}
          link={{
            href: createMessageBoxLink(currentPartyUuid),
            label: t('notice.self_identified_warning.button_link'),
          }}
        />
      </PageBase>
    );
  }

  if (partiesEmptyList) {
    return (
      <PageBase margin="page">
        <Notice title={t('inbox.no_parties_found')} />
      </PageBase>
    );
  }

  const resourceGroups = {
    'all-services': {
      title: 'Velg tjeneste',
    },
  };

  const selectedResourceName = serviceFilterState?.resource
    ? (() => {
        const foundResource = (resourceList as Resource[]).find(
          (r) => r?.identifier === serviceFilterState.resource?.[0],
        );
        return foundResource?.title?.nb || foundResource?.title?.['nb-no'];
      })()
    : 'Alle tjenester';

  const selectedResource: Account = {
    id: 'selected-account',
    type: 'company' as const,
    icon: {
      name: selectedResourceName || 'Alle tjenester',
      type: 'company',
    } as AvatarProps,
    name: selectedResourceName || 'Alle tjenester',
  };

  if (organizationLimitReached && !serviceResourcesFilter.length) {
    return (
      <PageBase margin="page">
        <Section data-testid="inbox-toolbar" style={{ marginTop: '-1rem' }}>
          <Flex spacing={2}>
            <Toolbar
              data-testid="inbox-toolbar-service"
              accountMenu={{
                id: 'account-menu-services',
                items: resources,
                groups: resourceGroups,
                search: serviceSearchProps,
                currentAccount: selectedResource,
                onSelectAccount: (resource: string) => {
                  if (resource === 'all-services') {
                    setServiceFilterState({
                      resource: [],
                    });
                  } else {
                    setServiceFilterState({
                      resource: [resource],
                    });
                  }
                },
                isVirtualized: true,
                title: 'Endre tjeneste',
                filterAccount: serviceFilterAccount,
              }}
              filterState={serviceFilterState}
              getFilterLabel={() => ''}
              onFilterStateChange={onServiceFiltersChange}
              filters={[]}
              showResultsLabel={t('filter.show_all_results')}
              removeButtonAltText={t('filter_bar.remove_filter')}
              addFilterButtonLabel={hasValidFilters ? t('filter_bar.add') : t('filter_bar.add_filter')}
            />
            <Toolbar
              data-testid="inbox-toolbar"
              accountMenu={{
                items: accounts,
                search: accountSearch,
                groups: accountGroups,
                currentAccount: selectedAccount,
                onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes[viewType]),
                filterAccount,
                isVirtualized: true,
                title: t('parties.change_label'),
              }}
            />
          </Flex>
          <Notice
            title={t('organizationLimitReached.title')}
            description={t('organizationLimitReached.description', { count: selectedParties.length })}
          />
        </Section>
      </PageBase>
    );
  }

  return (
    <PageBase margin="page">
      <section data-testid="inbox-toolbar" style={{ marginTop: '-1rem' }}>
        <Flex spacing={2}>
          <Toolbar
            data-testid="inbox-toolbar-service"
            accountMenu={{
              id: 'account-menu-services',
              items: resources,
              groups: resourceGroups,
              search: serviceSearchProps,
              currentAccount: selectedResource,
              onSelectAccount: (resource: string) => {
                if (resource === 'all-services') {
                  setServiceFilterState({
                    resource: [],
                  });
                } else {
                  setServiceFilterState({
                    resource: [resource],
                  });
                }
              },
              isVirtualized: true,
              title: 'Endre tjeneste',
              filterAccount: serviceFilterAccount,
            }}
            filterState={serviceFilterState}
            getFilterLabel={() => ''}
            onFilterStateChange={onServiceFiltersChange}
            filters={[]}
            showResultsLabel={t('filter.show_all_results')}
            removeButtonAltText={t('filter_bar.remove_filter')}
            addFilterButtonLabel={hasValidFilters ? t('filter_bar.add') : t('filter_bar.add_filter')}
          />
          {selectedAccount ? (
            <Toolbar
              data-testid="inbox-toolbar"
              accountMenu={{
                items: accounts,
                search: accountSearch,
                groups: accountGroups,
                currentAccount: selectedAccount,
                onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes[viewType]),
                filterAccount,
                isVirtualized: true,
                title: t('parties.change_label'),
              }}
              filterState={filterState}
              getFilterLabel={getFilterLabel}
              onFilterStateChange={onFiltersChange}
              filters={filters}
              showResultsLabel={t('filter.show_all_results')}
              removeButtonAltText={t('filter_bar.remove_filter')}
              addFilterButtonLabel={hasValidFilters ? t('filter_bar.add') : t('filter_bar.add_filter')}
            >
              <SaveSearchButton viewType={viewType} disabled={savedSearchDisabled} filterState={filterState} />
            </Toolbar>
          ) : null}
        </Flex>
      </section>
      <AlertBanner showAlertBanner={isAlertBannerEnabled && !!alertBannerContent} />
      <Section>
        {isAltinn2MessagesEnabled && <Altinn2ActiveSchemasNotification selectedAccount={selectedAccount} />}
        {dialogsSuccess && !dialogs.length && !isLoading && (
          <EmptyState query={enteredSearchValue} viewType={viewType} searchMode={searchMode} />
        )}
        <DialogList
          items={groupedDialogs}
          groups={groups}
          sortGroupBy={([aKey], [bKey]) => (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0)}
          isLoading={isLoading}
          highlightWords={searchMode ? [enteredSearchValue] : undefined}
        />
        {hasNextPage && (
          <Button
            aria-label={t('dialog.aria.fetch_more')}
            onClick={fetchNextPage}
            variant="outline"
            size="lg"
            labelSize="md"
          >
            {t('dialog.fetch_more')}
          </Button>
        )}
      </Section>
      <SeenByModal
        title={currentSeenByLogModal?.title}
        items={currentSeenByLogModal?.items}
        isOpen={!!currentSeenByLogModal}
        onClose={() => setCurrentSeenByLogModal(null)}
      />
    </PageBase>
  );
};
