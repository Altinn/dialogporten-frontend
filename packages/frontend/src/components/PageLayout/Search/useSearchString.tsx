import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { getSearchStringFromQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { useGlobalState } from '../../../useGlobalState.ts';

export const useSearchString = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchQueryParams = getSearchStringFromQueryParams(searchParams);
  const [searchValue, setSearchValue] = useGlobalState(QUERY_KEYS.SEARCH_VALUE, searchQueryParams);
  const [enteredSearchValue, setEnteredSearchValue] = useGlobalState(QUERY_KEYS.ENTERED_SEARCH_VALUE, '');

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const searchBarParam = new URLSearchParams(searchParams);
    const searchParamValue = searchBarParam.get('search') ?? '';

    if (searchParamValue !== enteredSearchValue) {
      setSearchValue(searchParamValue);
      setEnteredSearchValue(searchParamValue);
    }
  }, [searchParams, enteredSearchValue]);

  const onSearch = (value: string, org?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (!value && !org) {
      onClear();
      return;
    }

    if (!value && org) {
      newSearchParams.delete('search');
    }

    value && newSearchParams.set('search', value);
    org && newSearchParams.set('org', org);

    if (value || org) {
      if (location.pathname !== PageRoutes.inbox) {
        navigate(PageRoutes.inbox + `?${newSearchParams.toString()}`);
      } else {
        setSearchParams(newSearchParams);
      }
      setEnteredSearchValue(value);
    }
  };

  const onClear = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    let updated = false;

    for (const param of ['search', 'org']) {
      if (newSearchParams.has(param)) {
        newSearchParams.delete(param);
        updated = true;
      }
    }

    if (updated) {
      setSearchParams(newSearchParams);
    }

    setSearchValue('');
    setEnteredSearchValue('');
  };

  return { searchValue, enteredSearchValue, setSearchValue, onSearch, onClear };
};
