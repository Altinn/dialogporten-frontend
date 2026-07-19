import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { getSearchStringFromQueryParams, VariableGlobalQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { useGlobalStringState } from '../../../useGlobalState.ts';

export const useSearchString = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQueryParams = getSearchStringFromQueryParams(searchParams);
  const [searchValue, setSearchValue] = useGlobalStringState(QUERY_KEYS.SEARCH_VALUE, searchQueryParams);
  const enteredSearchValue = searchParams.get(VariableGlobalQueryParams.search) ?? '';

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync URL search param to display value (e.g. back button, external navigation)
  useEffect(() => {
    if (searchValue !== enteredSearchValue) {
      setSearchValue(enteredSearchValue);
    }
  }, [enteredSearchValue]);

  const onClear = () => {
    setSearchValue('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(VariableGlobalQueryParams.search);
      return next;
    });
  };

  return { searchValue, enteredSearchValue, setSearchValue, onClear };
};
