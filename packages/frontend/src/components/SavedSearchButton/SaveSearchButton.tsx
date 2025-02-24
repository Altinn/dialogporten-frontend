import type { FilterState } from '@altinn/altinn-components';
import { BookmarkFillIcon, BookmarkIcon } from '@navikt/aksel-icons';
import type { SavedSearchData } from 'bff-types-generated';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties';
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

  const searchToCheckIfExistsAlready: SavedSearchData = {
    filters: convertFilterStateToFilters(filterState),
    urn: selectedPartyIds as string[],
    searchString: enteredSearchValue,
  };

  if (disabled) {
    return null;
  }

  const alreadySavedSearch = getAlreadySavedSearch(searchToCheckIfExistsAlready, savedSearches);

  if (alreadySavedSearch) {
    return (
      <ProfileButton
        className={className}
        size="md"
        onClick={() => deleteSearch(alreadySavedSearch.id)}
        variant="tertiary"
        isLoading={isCTALoading}
      >
        <BookmarkFillIcon fontSize="1.25rem" />
        {t('filter_bar.saved_search')}
      </ProfileButton>
    );
  }

  return (
    <ProfileButton
      size="md"
      className={className}
      onClick={() =>
        saveSearch({ filters: filterState, selectedParties: selectedPartyIds, enteredSearchValue, viewType })
      }
      variant="tertiary"
      isLoading={isCTALoading}
    >
      <BookmarkIcon fontSize="1.25rem" />
      {t('filter_bar.save_search')}
    </ProfileButton>
  );
};
