import { BookmarkModal, BookmarkSettingsList, Heading, PageBase, Toolbar } from '@altinn/altinn-components';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelectedPartyIds } from '../../api/hooks/usePartiesSelectors.ts';
import { getPageRouteTitle } from '../../components/PageLayout/pageRouteToTitle.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes.ts';
import { filterBookmarksBySearch } from './searchUtils.ts';
import { useSavedSearches } from './useSavedSearches.tsx';

export const SavedSearchesPage = () => {
  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('sidebar.saved_searches') });
  const selectedPartyIds = useSelectedPartyIds();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const {
    items,
    groups,
    description,
    title,
    isLoading,
    onCloseSavedSearch,
    onSaveSearch,
    openedSavedSearch,
    onDeleteSavedSearch,
  } = useSavedSearches(selectedPartyIds);
  const currentSearch = useMemo(() => items?.find((item) => item.id === openedSavedSearch), [items, openedSavedSearch]);
  const filteredItems = filterBookmarksBySearch(items ?? [], searchQuery);
  //set groups priority (for sorting): personal=0, all-organizations=1 and the rest get 2
  const groupOrder: Record<string, number> = { personal: 0, 'all-organizations': 1 };

  return (
    <PageBase>
      <Heading as="h1" size="xl">
        {t(getPageRouteTitle(PageRoutes.savedSearches))}
      </Heading>
      <Toolbar
        search={{
          value: searchQuery,
          placeholder: t('savedSearches.search_placeholder'),
          onChange: (e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
          onClear: () => setSearchQuery(''),
        }}
      />
      {!isLoading && !items?.length && <Heading size="lg">{title}</Heading>}
      {filteredItems?.length > 0 && (
        <BookmarkSettingsList
          items={filteredItems}
          groups={groups}
          sortGroupBy={([a], [b]) => (groupOrder[a] ?? 2) - (groupOrder[b] ?? 2)}
          loading={isLoading}
        />
      )}
      <Heading size="xs" weight="normal">
        {description}
      </Heading>
      <BookmarkModal
        onClose={onCloseSavedSearch}
        title={t('savedSearches.edit_title')}
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
