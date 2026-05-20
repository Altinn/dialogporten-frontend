import type { ButtonVariant, FilterState } from '@altinn/altinn-components';
import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useServiceResource } from '../../api/hooks/useServiceResource.ts';
import { useDateFnsLocale } from '../../i18n/useDateFnsLocale.tsx';
import { buildOrganizationMap } from '../../utils/organizations.ts';
import { buildFilterParams } from '../SavedSearches/searchUtils.ts';
import { convertFilterStateToFilters } from '../SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../routes.ts';
import { useOrganizations } from './useOrganizations.ts';

interface SaveSearchInput {
  filters: FilterState;
  selectedParties: string[];
  enteredSearchValue: string;
  viewType: InboxViewType;
  name?: string;
}

interface UseBookmarkModalProps {
  filterState: FilterState;
  enteredSearchValue: string;
  viewType: InboxViewType;
  selectedPartyIds: string[];
  saveSearch: (props: SaveSearchInput) => Promise<string | undefined>;
  updateSavedSearchTitle: (id: string, name: string) => Promise<void> | void;
  deleteSavedSearch: (id: string) => Promise<void>;
}

type ModalState = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; search: SavedSearchesFieldsFragment };

export const useBookmarkModal = ({
  filterState,
  enteredSearchValue,
  viewType,
  selectedPartyIds,
  saveSearch,
  updateSavedSearchTitle,
  deleteSavedSearch,
}: UseBookmarkModalProps) => {
  const { t } = useTranslation();
  const { organizations } = useOrganizations();
  const orgMap = useMemo(() => buildOrganizationMap(organizations), [organizations]);
  const { serviceResourceById } = useServiceResource();
  const { locale } = useDateFnsLocale();

  const [state, setState] = useState<ModalState>({ kind: 'closed' });
  const [inputValue, setInputValue] = useState('');

  const close = () => {
    setState({ kind: 'closed' });
    setInputValue('');
  };

  const params = useMemo(() => {
    const deps = { organizations: orgMap, serviceResourceById, locale, t };
    if (state.kind === 'edit') {
      return buildFilterParams(state.search, deps);
    }
    const draftSavedSearch: SavedSearchesFieldsFragment = {
      __typename: 'SavedSearches',
      id: 0,
      name: '',
      createdAt: '',
      updatedAt: '',
      data: {
        __typename: 'SavedSearchData',
        filters: convertFilterStateToFilters(filterState),
        urn: selectedPartyIds,
        searchString: enteredSearchValue,
        fromView: PageRoutes[viewType],
      },
    };
    return buildFilterParams(draftSavedSearch, deps);
  }, [state, filterState, selectedPartyIds, enteredSearchValue, viewType, orgMap, serviceResourceById, locale, t]);

  const isEdit = state.kind === 'edit';

  const buttons = isEdit
    ? [
        {
          label: t('savedSearches.save'),
          onClick: async () => {
            if (state.kind === 'edit') {
              await updateSavedSearchTitle(state.search.id.toString(), inputValue);
            }
            close();
          },
        },
        {
          label: t('savedSearches.cancel'),
          variant: 'outline' as ButtonVariant,
          onClick: close,
        },
        {
          label: t('savedSearches.delete_search_menu'),
          variant: 'ghost' as ButtonVariant,
          onClick: async () => {
            if (state.kind === 'edit') {
              await deleteSavedSearch(state.search.id.toString());
            }
            close();
          },
        },
      ]
    : [
        {
          label: t('savedSearches.save_search'),
          onClick: async () => {
            const id = await saveSearch({
              filters: filterState,
              selectedParties: selectedPartyIds,
              enteredSearchValue,
              viewType,
              name: inputValue,
            });
            if (id) close();
          },
        },
        {
          label: t('savedSearches.cancel'),
          variant: 'outline' as ButtonVariant,
          onClick: close,
        },
      ];

  const bookmarkModalProps = {
    open: state.kind !== 'closed',
    onClose: close,
    title: isEdit ? t('savedSearches.edit_search') : t('savedSearches.save_search'),
    params,
    buttons,
    titleField: {
      label: t('savedSearches.bookmark.item_input_label'),
      placeholder: t('savedSearches.bookmark.item_input_placeholder'),
      value: inputValue,
      onChange: (e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    },
  };

  return {
    bookmarkModalProps,
    openSaveModal: () => {
      setInputValue('');
      setState({ kind: 'create' });
    },
    openEditModal: (search: SavedSearchesFieldsFragment) => {
      setInputValue(search.name ?? '');
      setState({ kind: 'edit', search });
    },
  };
};
