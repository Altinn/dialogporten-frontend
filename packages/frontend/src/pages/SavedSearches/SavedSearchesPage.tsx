import {
  BookmarkModal,
  type BookmarkSettingsItemProps,
  BookmarkSettingsList,
  Heading,
  PageBase,
  Toolbar,
} from '@altinn/altinn-components';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelectedPartyIds } from '../../api/hooks/usePartiesSelectors.ts';
import { getPageRouteTitle } from '../../components/PageLayout/pageRouteToTitle.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes.ts';
import { filterBookmarksBySearch } from './searchUtils.ts';
import { useSavedSearches } from './useSavedSearches.tsx';

interface EditBookmarkModalProps {
  search: BookmarkSettingsItemProps | undefined;
  onClose: () => void;
  onSave?: (id: string, title: string) => void;
}

const EditBookmarkModal = ({ search, onClose, onSave }: EditBookmarkModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(search?.title ?? '');

  return (
    <BookmarkModal
      open={!!search}
      onClose={onClose}
      title={t('savedSearches.edit_title')}
      params={search?.params}
      buttons={[
        {
          label: t('savedSearches.save'),
          onClick: () => {
            if (search?.id) {
              onSave?.(search.id, title);
            }
            onClose();
          },
        },
        {
          label: t('savedSearches.cancel'),
          variant: 'outline',
          onClick: onClose,
        },
      ]}
      titleField={{
        label: t('savedSearches.bookmark.item_input_label'),
        placeholder: t('savedSearches.bookmark.item_input_placeholder'),
        helperText: t('savedSearches.bookmark.item_input_helper'),
        value: title,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
      }}
    />
  );
};

export const SavedSearchesPage = () => {
  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('sidebar.saved_searches') });
  const selectedPartyIds = useSelectedPartyIds();
  const [searchQuery, setSearchQuery] = useState('');
  const { items, groups, description, title, isLoading, onCloseSavedSearch, onSaveSearch, openedSavedSearch } =
    useSavedSearches(selectedPartyIds);
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
      {description && (
        <Heading size="xs" weight="normal">
          {description}
        </Heading>
      )}
      <EditBookmarkModal
        key={currentSearch?.id ?? 'none'}
        search={currentSearch}
        onClose={onCloseSavedSearch}
        onSave={onSaveSearch}
      />
    </PageBase>
  );
};
