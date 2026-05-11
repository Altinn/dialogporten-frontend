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
        if (id === 'fromDate' || id === 'toDate') {
          if (activeFilters.updated) {
            url.searchParams.append(id, String(v));
          }
        } else {
          url.searchParams.append(id, String(v));
        }
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

export const createMessageBoxLink = (partyUuid?: string) => {
  return createChangePartyAndRedirect(partyUuid, getFrontPageURL() + '/ui/Messagebox/');
};

export type hostEnv = 'local' | 'at23' | 'tt02' | 'yt' | 'prod';

export const getEnvByHost = (): hostEnv => {
  if (location.host.includes('localhost')) {
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

export const createChangePartyAndRedirect = (partyUuid?: string, goTo?: string) => {
  const hostMap: Record<hostEnv, string> = {
    local: 'https://am.ui.at23.altinn.cloud/accessmanagement/api/v1/reportee/changeandredirect/',
    at23: 'https://am.ui.at23.altinn.cloud/accessmanagement/api/v1/reportee/changeandredirect/',
    tt02: 'https://am.ui.tt02.altinn.no/accessmanagement/api/v1/reportee/changeandredirect/',
    yt: 'https://am.ui.at23.altinn.cloud/accessmanagement/api/v1/reportee/changeandredirect/',
    prod: 'https://am.ui.altinn.no/accessmanagement/api/v1/reportee/changeandredirect/',
  };
  const url = new URL(hostMap[getEnvByHost()]);
  if (partyUuid) {
    url.searchParams.set('partyUuid', partyUuid);
  }
  if (goTo) {
    url.searchParams.set('goTo', goTo);
  }
  return url.toString();
};

export const getAccessAMUILink = () => {
  const hostMap: Record<hostEnv, string> = {
    local: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui',
    at23: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui',
    tt02: 'https://am.ui.tt02.altinn.no/accessmanagement/ui',
    yt: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui', // there is no am ui in yt
    prod: 'https://am.ui.altinn.no/accessmanagement/ui',
  };

  return hostMap[getEnvByHost()];
};

const INFO_PORTAL_HOST_MAP: Record<hostEnv, string> = {
  local: 'https://info.at23.altinn.cloud',
  at23: 'https://info.at23.altinn.cloud',
  tt02: 'https://info.tt02.altinn.no',
  yt: 'https://info.tt02.altinn.no',
  prod: 'https://info.altinn.no',
};

type LinkPathConfig = {
  nb: string;
  en: string;
  nn: string;
};

const createInfoPortalLink = (pathConfig: LinkPathConfig, language?: string) => {
  const baseHost = INFO_PORTAL_HOST_MAP[getEnvByHost()];

  let path: string;
  if (language === 'en') {
    path = pathConfig.en;
  } else if (language === 'nn') {
    path = pathConfig.nn;
  } else {
    path = pathConfig.nb;
  }

  return baseHost + path;
};

export const getNewFormLink = (language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/skjemaoversikt/',
      en: '/en/forms-overview/',
      nn: '/nn/skjemaoversikt/',
    },
    language,
  );
};

export const getFrontPageLink = (language?: string) => {
  return getInfoSiteURL(language);
};

export const getAboutNewAltinnLink = (language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/nyheter/om-nye-altinn/',
      en: '/en/news/About-the-new-Altinn/',
      nn: '/nn/nyheiter/om-nye-altinn/',
    },
    language,
  );
};

export const getAlternativeLoginLink = (language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/hjelp/innlogging/logg-inn-uten-f-d-nr/',
      en: '/nn/hjelp/innlogging/alternativ-innlogging-i-altinn/',
      nn: '/en/help/logging-in/altinn-alternative-log-in-methods/',
    },
    language,
  );
};

export const getStartNewBusinessLink = (language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/starte-og-drive/',
      en: '/en/start-and-run-business/',
      nn: '/nn/starte-og-drive/',
    },
    language,
  );
};

export const getNeedHelpLink = (language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/hjelp/',
      en: '/en/help/',
      nn: '/nn/hjelp/',
    },
    language,
  );
};

export const getCookieDomain = () => {
  const hostMap: Record<hostEnv, string> = {
    local: 'app.localhost',
    at23: '.at23.altinn.cloud',
    tt02: '.tt02.altinn.no',
    yt: '.yt.altinn.cloud',
    prod: '.altinn.no',
  };
  return hostMap[getEnvByHost()] || hostMap.prod;
};

/* Used for footer links */
const getInfoSiteURL = (language?: string) => {
  const baseUrl = INFO_PORTAL_HOST_MAP[getEnvByHost()] || INFO_PORTAL_HOST_MAP.prod;

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
      '/hjelp/': '/help/',
      '/om-altinn/driftsmeldinger/': '/about-altinn/service-announcements/',
      '/om-altinn/personvern/': '/about-altinn/privacy/',
      '/om-altinn/tilgjengelighet/': '/about-altinn/tilgjengelighet/',
    };
    return pathMap[path] || path;
  }

  if (language === 'nn') {
    const pathMap: Record<string, string> = {
      '/om-altinn/': '/om-altinn/',
      '/hjelp/': '/hjelp/',
      '/om-altinn/driftsmeldinger/': '/om-altinn/driftsmeldingar/',
      '/om-altinn/personvern/': '/om-altinn/personvern/',
      '/om-altinn/tilgjengelighet/': '/om-altinn/tilgjengelighet/',
    };
    return pathMap[path] || path;
  }

  return path;
};

export const getFooterLink = (path: string, language?: string) => {
  const mappedPath = getFooterPathForLanguage(path, language);
  return getInfoSiteURL(language) + mappedPath;
};

export const getFooterLinks = (language?: string) => {
  return [
    {
      href: getFooterLink('/hjelp/', language),
      resourceId: 'footer.nav.help_contact',
    },
    {
      href: getFooterLink('/om-altinn/', language),
      resourceId: 'footer.nav.about_altinn',
    },
    {
      href: getFooterLink('/om-altinn/driftsmeldinger/', language),
      resourceId: 'footer.nav.service_announcements',
    },
    {
      href: getFooterLink('/om-altinn/personvern/', language),
      resourceId: 'footer.nav.privacy_policy',
    },
    {
      href: getFooterLink('/om-altinn/tilgjengelighet/', language),
      resourceId: 'footer.nav.accessibility',
    },
  ];
};

export const isValidURL = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
};
