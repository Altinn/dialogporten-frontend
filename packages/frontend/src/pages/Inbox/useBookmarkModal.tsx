import type { BookmarkSettingsListProps } from '@altinn/altinn-components';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SavedSearchItem = BookmarkSettingsListProps['items'][number];

export const useBookmarkModal = (
  savedSearchItems: SavedSearchItem[],
  onSaveSearch: ((id: string, title: string) => void) | undefined,
  onCloseSavedSearch: () => void,
) => {
  const { t } = useTranslation();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const currentSearch = useMemo(
    () => savedSearchItems?.find((item) => item.id === openedId),
    [savedSearchItems, openedId],
  );

  const close = () => {
    setOpenedId(null);
    onCloseSavedSearch();
  };

  const bookmarkModalProps = {
    open: !!openedId,
    onClose: close,
    title: t('savedSearches.save_search'),
    params: currentSearch?.params,
    buttons: [
      {
        label: t('savedSearches.save_search'),
        onClick: () => {
          if (currentSearch?.id) {
            onSaveSearch?.(currentSearch.id, inputValues[currentSearch.id]);
          }
          close();
        },
      },
      {
        label: t('savedSearches.cancel'),
        variant: 'outline' as const,
        onClick: close,
      },
    ],
    titleField: {
      label: t('savedSearches.bookmark.item_input_label'),
      placeholder: t('savedSearches.bookmark.item_input_placeholder'),
      helperText: t('savedSearches.bookmark.item_input_helper'),
      value: openedId ? (inputValues[openedId] ?? '') : '',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        openedId && setInputValues((prev) => ({ ...prev, [openedId]: e.target.value }));
      },
    },
  };

  return {
    bookmarkModalProps,
    onSaveSuccess: setOpenedId,
  };
};
