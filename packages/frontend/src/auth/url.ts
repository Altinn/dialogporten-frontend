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

export const createMessageBoxLink = (currentPartyUuid?: string) => {
  const url = getFrontPageURL() + '/ui/Messagebox/';
  return createChangeReporteeAndRedirect(currentPartyUuid, url);
};

export type hostEnv = 'at23' | 'tt02' | 'yt' | 'prod';

const getEnvByHost = (): hostEnv => {
  if (
    location.hostname.includes('at.altinn.cloud') ||
    location.hostname.includes('at23.altinn.cloud') ||
    location.host.includes('app.localhost')
  ) {
    return 'at23';
  }

  if (location.host.includes('yt.altinn.cloud')) {
    return 'yt';
  }

  if (location.host.includes('tt.altinn.no') || location.host.includes('tt02.altinn.no')) {
    return 'tt02';
  }
  return 'prod';
};

/* Used for redirect from logo in header */
const getFrontPageURL = () => {
  const hostMap: Record<hostEnv, string> = {
    at23: 'https://at23.altinn.cloud',
    tt02: 'https://tt02.altinn.no',
    yt: 'https://yt.altinn.cloud',
    prod: 'https://altinn.no',
  };

  return hostMap[getEnvByHost()] || hostMap.prod;
};

export const createChangeReporteeAndRedirect = (currentPartyUuid?: string, goTo?: string) => {
  const frontPageURL = getFrontPageURL();
  const url = new URL('/ui/Reportee/ChangeReporteeAndRedirect', frontPageURL);

  if (currentPartyUuid) {
    url.searchParams.set('P', currentPartyUuid);
  }

  if (goTo) {
    url.searchParams.set('goTo', goTo);
  }
  return url.toString();
};

/* TODO: When landing page for accessmanagement/ui/ is available, remove users from path */
export const getAccessAMUILink = (currentPartyUuid?: string) => {
  const hostMap: Record<hostEnv, string> = {
    at23: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui/users',
    tt02: 'https://am.ui.tt02.altinn.no/accessmanagement/ui/users',
    yt: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui/users', // there is no am ui in yt
    prod: 'https://am.ui.altinn.no/accessmanagement/ui/users',
  };
  return createChangeReporteeAndRedirect(currentPartyUuid, hostMap[getEnvByHost()]);
};

export const getNewFormLink = (currentPartyUuid?: string) => {
  const hostMap: Record<hostEnv, string> = {
    at23: 'https://info.at23.altinn.cloud/skjemaoversikt/',
    tt02: 'https://info.tt02.altinn.no/skjemaoversikt/',
    yt: 'https://info.tt02.altinn.no/skjemaoversikt/', // there is no am ui in yt
    prod: 'https://info.altinn.no/skjemaoversikt/',
  };
  return createChangeReporteeAndRedirect(currentPartyUuid, hostMap[getEnvByHost()]);
};

export const getFrontPageLink = (currentPartyUuid?: string) => {
  return createChangeReporteeAndRedirect(currentPartyUuid, 'https://info.at23.altinn.cloud/');
};
