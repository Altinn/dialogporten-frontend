import { Button, type FilterState } from '@altinn/altinn-components';
import { BookmarkFillIcon, BookmarkIcon } from '@navikt/aksel-icons';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { buildCurrentStateURL, findMatchingSavedSearch } from '../../pages/SavedSearches';
import { useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { useSearchString } from '../PageLayout/Search';

export type SaveSearchButtonProps = {
  disabled?: boolean;
  viewType: InboxViewType;
  filterState: FilterState;
  variant?: 'ghost' | 'outline';
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;

export const SaveSearchButton = ({
  disabled,
  className,
  filterState,
  viewType,
  variant = 'ghost',
}: SaveSearchButtonProps) => {
  const { t } = useTranslation();
  const { selectedPartyIds } = useParties();
  const { enteredSearchValue } = useSearchString();
  const {
    currentPartySavedSearches: savedSearches,
    isCTALoading,
    saveSearch,
    onDeleteSavedSearch,
  } = useSavedSearches(selectedPartyIds);

  if (disabled) {
    return null;
  }

  const currentStateURL = buildCurrentStateURL(filterState, enteredSearchValue, viewType);
  const matchingSavedSearch = findMatchingSavedSearch(currentStateURL, savedSearches);

  if (matchingSavedSearch) {
    return (
      <Button
        size="xs"
        className={className}
        onClick={() => onDeleteSavedSearch(matchingSavedSearch.id.toString())}
        loading={isCTALoading}
        variant={variant}
        aria-label={t('filter_bar.saved_search')}
      >
        <BookmarkFillIcon />
        <span>{t('filter_bar.saved_search')}</span>
      </Button>
    );
  }

  return (
    <Button
      size="xs"
      className={className}
      onClick={() =>
        saveSearch({ filters: filterState, selectedParties: selectedPartyIds, enteredSearchValue, viewType })
      }
      variant={variant}
      loading={isCTALoading}
      aria-label={t('filter_bar.save_search')}
    >
      <BookmarkIcon />
      <span>{t('filter_bar.save_search')}</span>
    </Button>
  );
};
