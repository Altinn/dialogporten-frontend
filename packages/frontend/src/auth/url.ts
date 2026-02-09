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

export const getEnvByHost = (): hostEnv => {
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

const INFO_PORTAL_HOST_MAP: Record<hostEnv, string> = {
  local: 'https://info.at23.altinn.cloud',
  at23: 'https://info.at23.altinn.cloud',
  tt02: 'https://info.tt02.altinn.no',
  yt: 'https://info.tt02.altinn.no',
  prod: 'https://info.altinn.no',
};

const INFO_PORTAL_HELP_LINK_MAP: Record<hostEnv, string> = {
  local: 'https://inte.info.altinn.no',
  at23: 'https://inte.info.altinn.no',
  tt02: 'https://prep.info.altinn.no',
  yt: 'https://prep.info.altinn.no',
  prod: 'https://info.altinn.no',
};

type LinkPathConfig = {
  nb: string;
  en: string;
  nn: string;
};

const createInfoPortalLink = (pathConfig: LinkPathConfig, currentPartyUuid?: string, language?: string) => {
  const baseHost = INFO_PORTAL_HOST_MAP[getEnvByHost()];

  let path: string;
  if (language === 'en') {
    path = pathConfig.en;
  } else if (language === 'nn') {
    path = pathConfig.nn;
  } else {
    path = pathConfig.nb;
  }

  return createChangeReporteeAndRedirect(currentPartyUuid, baseHost + path);
};

const createInfoPortalHelpLink = (pathConfig: LinkPathConfig, language?: string) => {
  const baseHost = INFO_PORTAL_HELP_LINK_MAP[getEnvByHost()];

  let path: string;
  if (language === 'en') {
    path = pathConfig.en;
  } else if (language === 'nn') {
    path = pathConfig.nn;
  } else {
    path = pathConfig.nb;
  }

  return `${baseHost}${path}`;
};

export const getNewFormLink = (currentPartyUuid?: string, language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/skjemaoversikt/',
      en: '/en/forms-overview/',
      nn: '/nn/skjemaoversikt/',
    },
    currentPartyUuid,
    language,
  );
};

export const getFrontPageLink = (currentPartyUuid?: string, language?: string) => {
  return createChangeReporteeAndRedirect(currentPartyUuid, getInfoSiteURL(language));
};

export const getAboutNewAltinnLink = (currentPartyUuid?: string, language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/nyheter/om-nye-altinn/',
      en: '/en/news/About-the-new-Altinn/',
      nn: '/nn/nyheiter/om-nye-altinn/',
    },
    currentPartyUuid,
    language,
  );
};

export const getNotificationSettingsLink = (language?: string) => {
  return createInfoPortalHelpLink(
    {
      nb: '/hjelp/dette-jobber-vi-fortsatt-med/profil--og-varslingsinnstillinger/',
      en: '/en/help/dette-jobber-vi-fortsatt-med/profil--og-varslingsinnstillinger/',
      nn: '/nn/hjelp/dette-jobber-vi-fortsatt-med/profil--og-varslingsinnstillinger/',
    },
    language,
  );
};

export const getStartNewBusinessLink = (currentPartyUuid?: string, language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/starte-og-drive/',
      en: '/en/start-and-run-business/',
      nn: '/nn/starte-og-drive/',
    },
    currentPartyUuid,
    language,
  );
};

export const getNeedHelpLink = (currentPartyUuid?: string, language?: string) => {
  return createInfoPortalLink(
    {
      nb: '/hjelp/',
      en: '/en/help/',
      nn: '/nn/hjelp/',
    },
    currentPartyUuid,
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

export const getFooterLink = (currentPartyUuid: string, path: string, language?: string) => {
  const mappedPath = getFooterPathForLanguage(path, language);
  return createChangeReporteeAndRedirect(currentPartyUuid, getInfoSiteURL(language) + mappedPath);
};

export const getFooterLinks = (currentPartyUuid: string, language?: string) => {
  return [
    {
      href: `${getFooterLink(currentPartyUuid, '/hjelp/', language)}`,
      resourceId: 'footer.nav.help_contact',
    },
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/', language)}`,
      resourceId: 'footer.nav.about_altinn',
    },
    {
      href: `${getFooterLink(currentPartyUuid, '/om-altinn/driftsmeldinger/', language)}`,
      resourceId: 'footer.nav.service_announcements',
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
