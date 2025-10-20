import type { FilterState } from '@altinn/altinn-components';
import { BookmarkFillIcon, BookmarkIcon } from '@navikt/aksel-icons';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { buildCurrentStateURL, findMatchingSavedSearch } from '../../pages/SavedSearches';
import { useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { useSearchString } from '../PageLayout/Search';
import { ProfileButton } from '../ProfileButton';

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

  const currentStateURL = buildCurrentStateURL(filterState, enteredSearchValue, viewType);
  const matchingSavedSearch = findMatchingSavedSearch(currentStateURL, savedSearches);

  if (matchingSavedSearch) {
    return (
      <ProfileButton
        className={className}
        onClick={() => deleteSearch(matchingSavedSearch.id)}
        variant="tertiary"
        isLoading={isCTALoading}
      >
        <BookmarkFillIcon width="1.25rem" height="1.25rem" />
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
      <BookmarkIcon width="1.25rem" height="1.25rem" />
      {t('filter_bar.save_search')}
    </ProfileButton>
  );
};
