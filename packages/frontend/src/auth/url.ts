import type { FilterState } from '@altinn/altinn-components';

const LOGIN_REDIRECT_STORAGE_KEY = 'arbeidsflate:referrer';

export const createFiltersURLQuery = (activeFilters: FilterState, allFilterKeys: string[], baseURL: string): URL => {
  const url = new URL(baseURL);

  for (const filter of allFilterKeys) {
    url.searchParams.delete(filter);
  }

  for (const [id, value] of Object.entries(activeFilters).filter(([_, value]) => typeof value !== 'undefined')) {
    if (Array.isArray(value)) {
      for (const v of value) {
        url.searchParams.append(id, String(v));
      }
    } else {
      url.searchParams.append(id, String(value));
    }
  }
  return url;
};

export const saveURL = () => {
  const currentURL = getCurrentURL();
  if (!location.pathname.includes('loggedout')) {
    sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, currentURL);
  }
};

export const removeStoredURL = () => {
  sessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
};

export const getCurrentURL = () => window.location.pathname + window.location.search;

export const getStoredURL = (): string | null => {
  const url = sessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
  /* This will happen after the user is redirected to /, so URL sanitizing is unnecessary */
  if (url) {
    return url;
  }
  return null;
};

/* Used for redirect on logout and logo in header */
export const createHomeLink = () => {
  // There is no landing page for Altinn locally or in test, so returning to homepage in app makes sense here
  if (import.meta.env.DEV || location.hostname.includes('at.altinn.cloud')) {
    return '/';
  }
  if (location.host.includes('tt.altinn.no')) {
    return 'https://info.tt02.altinn.no/';
  }
  return 'https://info.altinn.no/';
};
