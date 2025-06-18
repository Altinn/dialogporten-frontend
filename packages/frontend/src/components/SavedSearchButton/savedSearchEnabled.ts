import type { FilterState } from '@altinn/altinn-components';

export const isSavedSearchDisabled = (filterState: FilterState, enteredSearchValue: string | undefined) => {
  if ((enteredSearchValue ?? '')?.length <= 2) {
    return true;
  }

  const hasValidFilters = Object.values(filterState).some((arr) => typeof arr !== 'undefined' && arr?.length > 0);

  if (!hasValidFilters) {
    return true;
  }

  return !Object.values(filterState)
    .filter((item) => typeof item !== 'undefined')
    .some((item) => {
      return Array.isArray(item) && item.length > 0;
    });
};
