import type { FilterState } from '@altinn/altinn-components';
import { BookmarkFillIcon, BookmarkIcon } from '@navikt/aksel-icons';
import type { SavedSearchData } from 'bff-types-generated';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { convertFilterStateToFilters, useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { useSearchString } from '../PageLayout/Search';
import { ProfileButton } from '../ProfileButton';
import { getAlreadySavedSearch } from './alreadySaved.ts';

type SaveSearchButtonProps = {
  disabled?: boolean;
  viewType: InboxViewType;
  filterState: FilterState;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;

export const SaveSearchButton = ({ disabled, className, filterState, viewType }: SaveSearchButtonProps) => {
  const { t } = useTranslation();
  const { selectedPartyIds } = useParties();
  const { enteredSearchValue } = useSearchString();
  const {
    currentPartySavedSearches: savedSearches,
    isCTALoading,
    saveSearch,
    deleteSearch,
  } = useSavedSearches(selectedPartyIds);

  if (disabled) {
    return null;
  }

  const searchToCheckIfExistsAlready: SavedSearchData = {
    filters: convertFilterStateToFilters(filterState),
    urn: selectedPartyIds as string[],
    searchString: enteredSearchValue,
  };

  const alreadySavedSearch = getAlreadySavedSearch(searchToCheckIfExistsAlready, savedSearches, viewType);

  if (alreadySavedSearch) {
    return (
      <ProfileButton
        className={className}
        onClick={() => deleteSearch(alreadySavedSearch.id)}
        variant="tertiary"
        isLoading={isCTALoading}
      >
        <BookmarkFillIcon fontSize="0.875rem" />
        {t('filter_bar.saved_search')}
      </ProfileButton>
    );
  }

  return (
    <ProfileButton
      className={className}
      onClick={() =>
        saveSearch({ filters: filterState, selectedParties: selectedPartyIds, enteredSearchValue, viewType })
      }
      variant="tertiary"
      isLoading={isCTALoading}
    >
      <BookmarkIcon fontSize="0.875rem" />
      {t('filter_bar.save_search')}
    </ProfileButton>
  );
};
