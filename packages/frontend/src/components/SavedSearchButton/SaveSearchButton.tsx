import { Button, type FilterState } from '@altinn/altinn-components';
import { BookmarkFillIcon, BookmarkIcon } from '@navikt/aksel-icons';
import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useSelectedPartyIds } from '../../api/hooks/usePartiesSelectors.ts';
import { buildCurrentStateURL, findMatchingSavedSearch } from '../../pages/SavedSearches/bookmarkURL.ts';
import { useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { useSearchString } from '../PageLayout/Search/useSearchString.tsx';

export type SaveSearchButtonProps = {
  hidden?: boolean;
  viewType: InboxViewType;
  filterState: FilterState;
  variant?: 'ghost' | 'outline';
  onSaveClick?: () => void;
  onEditClick?: (savedSearch: SavedSearchesFieldsFragment) => void;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;

export const SaveSearchButton = ({
  hidden,
  className,
  filterState,
  viewType,
  variant = 'ghost',
  onSaveClick,
  onEditClick,
}: SaveSearchButtonProps) => {
  const { t } = useTranslation();
  const selectedPartyIds = useSelectedPartyIds();
  const { enteredSearchValue } = useSearchString();
  const { currentPartySavedSearches: savedSearches } = useSavedSearches(selectedPartyIds);

  if (hidden) {
    return null;
  }

  const currentStateURL = buildCurrentStateURL(filterState, enteredSearchValue, viewType);
  const matchingSavedSearch = findMatchingSavedSearch(currentStateURL, savedSearches);

  if (matchingSavedSearch) {
    return (
      <Button
        size="xs"
        className={className}
        onClick={() => onEditClick?.(matchingSavedSearch)}
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
      onClick={() => onSaveClick?.()}
      variant={variant}
      aria-label={t('filter_bar.save_search')}
    >
      <BookmarkIcon />
      <span>{t('filter_bar.save_search')}</span>
    </Button>
  );
};
