import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import {
  VariableGlobalQueryParams,
  getSearchStringFromQueryParams,
  pruneSearchQueryParams,
} from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { useGlobalState } from '../../../useGlobalState.ts';

export const useSearchString = (onSearchCallback?: (value: string) => void) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchQueryParams = getSearchStringFromQueryParams(searchParams);
  const [searchValue, setSearchValue] = useGlobalState(QUERY_KEYS.SEARCH_VALUE, searchQueryParams);
  const searchBarParam = new URLSearchParams(searchParams);
  const searchParamValue = searchBarParam.get(VariableGlobalQueryParams.search) ?? '';
  const [enteredSearchValue, setEnteredSearchValue] = useGlobalState(QUERY_KEYS.ENTERED_SEARCH_VALUE, searchParamValue);
  const prevEnteredSearchValue = useRef<string>(searchParamValue);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to run this effect when the entered value changes
  useEffect(() => {
    if (prevEnteredSearchValue.current !== enteredSearchValue) {
      onSearchCallback?.(enteredSearchValue);
    }
    if (searchValue !== enteredSearchValue) {
      setSearchValue(enteredSearchValue);
    }
  }, [enteredSearchValue]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (searchParamValue !== enteredSearchValue) {
      setEnteredSearchValue(searchParamValue);
    }
  }, [searchParamValue, enteredSearchValue]);

  const onSearch = (value: string, org?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (!value) {
      newSearchParams.delete(VariableGlobalQueryParams.search);
      setEnteredSearchValue('');
    }

    if (value) {
      newSearchParams.set(VariableGlobalQueryParams.search, value);
    }

    if (org) {
      newSearchParams.set('org', org);
    }

    if (value || org) {
      const query: Record<string, string> = {};
      if (value) {
        query.search = value;
      } else {
        setSearchValue('');
      }

      if (org) {
        query.org = org;
      }

      if (location.pathname !== PageRoutes.inbox) {
        navigate(PageRoutes.inbox + pruneSearchQueryParams(newSearchParams.toString(), query));
      } else {
        setSearchParams(newSearchParams);
      }
    }
  };

  const onClear = () => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (newSearchParams.has(VariableGlobalQueryParams.search)) {
      newSearchParams.delete(VariableGlobalQueryParams.search);
      setSearchParams(newSearchParams);
    }

    setSearchValue('');
    setEnteredSearchValue('');
  };

  return { searchValue, enteredSearchValue, setSearchValue, onSearch, onClear };
};
