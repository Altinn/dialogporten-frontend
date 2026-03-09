import {
  BookmarkModal,
  BookmarkSettingsList,
  Heading,
  PageBase,
  Toolbar,
  ToolbarMenu,
} from '@altinn/altinn-components';
import { t } from 'i18next';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useParties } from '../../api/hooks/useParties.ts';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { getPageRouteTitle } from '../../components/PageLayout/pageRouteToTitle.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes.ts';
import { useSavedSearches } from './useSavedSearches.tsx';

export const SavedSearchesPage = () => {
  usePageTitle({ baseTitle: t('sidebar.saved_searches') });

  const { selectedPartyIds, parties, selectedParties, allOrganizationsSelected } = useParties();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const {
    items,
    description,
    title,
    isLoading,
    onCloseSavedSearch,
    onSaveSearch,
    openedSavedSearch,
    onDeleteSavedSearch,
  } = useSavedSearches(selectedPartyIds);
  const currentSearch = useMemo(() => items?.find((item) => item.id === openedSavedSearch), [items, openedSavedSearch]);
  const { accounts, accountSearch, accountGroups, onSelectAccount, currentAccountName } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    options: {
      showGroups: true,
    },
  });

  return (
    <PageBase>
      <Heading as="h1" size="xl">
        {t(getPageRouteTitle(PageRoutes.savedSearches))}
      </Heading>
      {currentAccountName ? (
        <Toolbar>
          <ToolbarMenu
            size="md"
            items={accounts}
            search={accountSearch}
            groups={accountGroups}
            label={currentAccountName}
            onSelectId={(id: string) => {
              onSelectAccount(id, PageRoutes.savedSearches);
            }}
            title={t('parties.change_label')}
            searchable
            virtualized
          />
        </Toolbar>
      ) : null}
      <Heading size="lg">{title}</Heading>
      {items?.length > 0 && <BookmarkSettingsList items={items} loading={isLoading} />}
      <Heading size="xs" weight="normal">
        {description}
      </Heading>
      <BookmarkModal
        onClose={onCloseSavedSearch}
        title={!openedSavedSearch ? t('savedSearches.edit_title') : ''}
        open={!!openedSavedSearch}
        params={currentSearch?.params}
        buttons={[
          {
            label: t('savedSearches.save_search'),
            onClick: () => {
              if (currentSearch?.id) {
                onSaveSearch?.(currentSearch?.id, inputValues[currentSearch?.id]);
              }
              onCloseSavedSearch();
            },
          },
          {
            label: t('savedSearches.delete_search'),
            variant: 'outline',
            color: 'danger',
            onClick: () => {
              if (currentSearch?.id) {
                onDeleteSavedSearch?.(currentSearch?.id);
              }
              onCloseSavedSearch();
            },
          },
        ]}
        titleField={{
          label: t('savedSearches.bookmark.item_input_label'),
          placeholder: t('savedSearches.bookmark.item_input_placeholder'),
          helperText: t('savedSearches.bookmark.item_input_helper'),
          value: typeof openedSavedSearch === 'string' ? (inputValues[openedSavedSearch] ?? '') : '',
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            openedSavedSearch && setInputValues((prev) => ({ ...prev, [openedSavedSearch]: e.target.value }));
          },
        }}
      />
    </PageBase>
  );
};
