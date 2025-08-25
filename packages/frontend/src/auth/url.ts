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
  sessionStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, currentURL);
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

export const createMessageBoxLink = () => {
  if (import.meta.env.DEV) {
    return '/';
  }
  return createHomeLink() + '/ui/Messagebox/';
};

/* Used for redirect from logo in header */
export const createHomeLink = () => {
  // There is no landing page for Altinn locally, so returning to homepage in app makes sense here
  if (import.meta.env.DEV) {
    return '/';
  }

  if (location.hostname.includes('at.altinn.cloud')) {
    return 'https://at22.altinn.cloud';
  }

  if (location.host.includes('yt.altinn.cloud')) {
    return 'https://tt02.altinn.no';
  }

  if (location.host.includes('tt.altinn.no')) {
    return 'https://tt02.altinn.no';
  }
  return 'https://altinn.no';
};
