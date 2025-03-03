import type { FilterState } from '@altinn/altinn-components';

export const isSavedSearchDisabled = (filterState: FilterState, enteredSearchValue: string) => {
  if (enteredSearchValue.length > 0) {
    return false;
  }

  if (!filterState || !Object.keys(filterState).length) {
    return true;
  }

  return !Object.values(filterState)
    .filter((item) => typeof item !== 'undefined')
    .some((item) => {
      return Array.isArray(item) && item.length > 0;
    });
};
