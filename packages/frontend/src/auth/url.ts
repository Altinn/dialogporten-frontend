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

export type hostEnv = 'local' | 'at23' | 'tt02' | 'yt' | 'prod';

const getEnvByHost = (): hostEnv => {
  if (location.host.includes('app.localhost')) {
    return 'local';
  }

  if (location.hostname.includes('at.altinn.cloud') || location.hostname.includes('at23.altinn.cloud')) {
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
    local: 'https://at23.altinn.cloud',
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

export const getAccessAMUILink = (currentPartyUuid?: string) => {
  const hostMap: Record<hostEnv, string> = {
    local: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui',
    at23: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui',
    tt02: 'https://am.ui.tt02.altinn.no/accessmanagement/ui',
    yt: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui', // there is no am ui in yt
    prod: 'https://am.ui.altinn.no/accessmanagement/ui',
  };
  return createChangeReporteeAndRedirect(currentPartyUuid, hostMap[getEnvByHost()]);
};

export const getNewFormLink = (currentPartyUuid?: string, language?: string) => {
  const hostMap: Record<hostEnv, string> = {
    local: 'https://info.at23.altinn.cloud/skjemaoversikt/',
    at23: 'https://info.at23.altinn.cloud/skjemaoversikt/',
    tt02: 'https://info.tt02.altinn.no/skjemaoversikt/',
    yt: 'https://info.tt02.altinn.no/skjemaoversikt/', // there is no am ui in yt
    prod: 'https://info.altinn.no/skjemaoversikt/',
  };
  const url = hostMap[getEnvByHost()];

  if (language === 'en') {
    return createChangeReporteeAndRedirect(currentPartyUuid, url.replace('/skjemaoversikt/', '/en/forms-overview/'));
  }
  if (language === 'nn') {
    return createChangeReporteeAndRedirect(currentPartyUuid, url.replace('/skjemaoversikt/', '/nn/skjemaoversikt/'));
  }

  return createChangeReporteeAndRedirect(currentPartyUuid, url);
};

export const getFrontPageLink = (currentPartyUuid?: string, language?: string) => {
  return createChangeReporteeAndRedirect(currentPartyUuid, getInfoSiteURL(language));
};

export const getCookieDomain = () => {
  const hostMap: Record<hostEnv, string> = {
    local: 'app.localhost',
    at23: '.a23.altinn.cloud',
    tt02: '.tt02.altinn.no',
    yt: '.yt.altinn.cloud',
    prod: '.altinn.no',
  };
  return hostMap[getEnvByHost()] || hostMap.prod;
};

/* Used for footer links */
const getInfoSiteURL = (language?: string) => {
  const hostMap: Record<hostEnv, string> = {
    local: 'https://info.at23.altinn.cloud',
    at23: 'https://info.at23.altinn.cloud',
    tt02: 'https://info.tt02.altinn.no',
    yt: 'https://info.tt02.altinn.no',
    prod: 'https://info.altinn.no',
  };

  const baseUrl = hostMap[getEnvByHost()] || hostMap.prod;

  if (language === 'en') {
    return `${baseUrl}/en`;
  }
  if (language === 'nn') {
    return `${baseUrl}/nn`;
  }
  return baseUrl;
};

const getFooterPathForLanguage = (path: string, language?: string): string => {
  if (language === 'en') {
    const pathMap: Record<string, string> = {
      '/om-altinn/': '/about-altinn/',
      '/om-altinn/driftsmeldinger/': '/about-altinn/service-announcements/',
      '/om-altinn/personvern/': '/about-altinn/privacy/',
      '/om-altinn/tilgjengelighet/': '/about-altinn/tilgjengelighet/',
    };
    return pathMap[path] || path;
  }

  if (language === 'nn') {
    const pathMap: Record<string, string> = {
      '/om-altinn/': '/om-altinn/',
      '/om-altinn/driftsmeldinger/': '/om-altinn/driftsmeldingar/',
      '/om-altinn/personvern/': '/om-altinn/personvern/',
      '/om-altinn/tilgjengelighet/': '/om-altinn/tilgjengelighet/',
    };
    return pathMap[path] || path;
  }

  return path;
};

export const getFooterLink = (currentPartyUuid: string, path: string, language?: string) => {
  const mappedPath = getFooterPathForLanguage(path, language);
  return createChangeReporteeAndRedirect(currentPartyUuid, getInfoSiteURL(language) + mappedPath);
};

export const getFooterLinks = (currentPartyUuid: string, language?: string) => {
  return [
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/', language)}`,
      resourceId: 'footer.nav.about_altinn',
    },
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/driftsmeldinger/', language)}`,
      resourceId: 'footer.nav.service_messages',
    },
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/personvern/', language)}`,
      resourceId: 'footer.nav.privacy_policy',
    },
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/tilgjengelighet/', language)}`,
      resourceId: 'footer.nav.accessibility',
    },
  ];
};
