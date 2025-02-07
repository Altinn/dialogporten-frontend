import type { FilterState } from '@altinn/altinn-components';

const LOGIN_REDIRECT_STORAGE_KEY = 'arbeidsflate::auth::login_Redirect';
const LOGIN_REDIRECT_QUERY_KEY = 'loggedIn';

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

export const sanitizeURL = (url: string) => {
  const urlObj = new URL(url);
  urlObj.searchParams.delete(LOGIN_REDIRECT_QUERY_KEY);
  return urlObj.toString();
};

export const saveURL = (url: string) => {
  if (!isLogoutURL(url)) {
    localStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, sanitizeURL(url));
  }
};

export const isRedirectURL = (url: string): boolean => {
  return url.includes(LOGIN_REDIRECT_QUERY_KEY);
};

export const isLogoutURL = (url: string): boolean => {
  return url.includes('loggedout');
};

export const removeStoredURL = () => {
  localStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
};

export const getStoredURL = (): string | null => {
  const url = localStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
  if (url) {
    return sanitizeURL(url);
  }
  return null;
};
