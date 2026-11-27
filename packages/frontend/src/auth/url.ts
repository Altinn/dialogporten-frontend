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

export const getAltinn2AccountLink = () => `${getAccessAMUILink()}/altinn2account`;

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

const INFO_PORTAL_PATHS = {
  formsOverview: { nb: '/skjemaoversikt/', en: '/en/forms-overview/', nn: '/nn/skjemaoversikt/' },
  search: { nb: '/sok/', en: '/en/search/', nn: '/nn/sok/' },
  alternativeLogin: {
    nb: '/hjelp/innlogging/logg-inn-uten-f-d-nr/',
    en: '/en/help/logging-in/altinn-alternative-log-in-methods/',
    nn: '/nn/hjelp/innlogging/alternativ-innlogging-i-altinn/',
  },
  startNewBusiness: { nb: '/starte-og-drive/', en: '/en/start-and-run-business/', nn: '/nn/starte-og-drive/' },
  help: { nb: '/hjelp/', en: '/en/help/', nn: '/nn/hjelp/' },
  inboxHelp: { nb: '/hjelp/innboks/', en: '/en/help/inbox/', nn: '/nn/hjelp/innboks/' },
  inboxSearchHelp: {
    nb: '/hjelp/innboks/#finne-brev-eller-skjema-i-innboksen',
    en: '/en/help/inbox/#find-a-letter-or-form-in-your-inbox',
    nn: '/nn/hjelp/innboks/#finne-brev-eller-skjema-i-innboksen',
  },
  profileHelp: {
    nb: '/hjelp/varsling-og-kontakt/',
    en: '/en/help/notifications-and-contact-information/',
    nn: '/nn/hjelp/varsling-og-kontakt/',
  },
  aboutAltinn: { nb: '/om-altinn/', en: '/en/about-altinn/', nn: '/nn/om-altinn/' },
  serviceAnnouncements: {
    nb: '/om-altinn/driftsmeldinger/',
    en: '/en/about-altinn/service-announcements/',
    nn: '/nn/om-altinn/driftsmeldingar/',
  },
  privacy: { nb: '/om-altinn/personvern/', en: '/en/about-altinn/privacy/', nn: '/nn/om-altinn/personvern/' },
  accessibility: {
    nb: '/om-altinn/tilgjengelighet/',
    en: '/en/about-altinn/accessibility/',
    nn: '/nn/om-altinn/tilgjengelegheit-paa-altinnno/',
  },
} satisfies Record<string, LinkPathConfig>;

export type InfoPortalPage = keyof typeof INFO_PORTAL_PATHS;

export const getInfoPortalLink = (page: InfoPortalPage, language?: string) => {
  const baseHost = INFO_PORTAL_HOST_MAP[getEnvByHost()];
  const pathConfig: LinkPathConfig = INFO_PORTAL_PATHS[page];

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

export const getFrontPageLink = (language?: string) => {
  return getInfoSiteURL(language);
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

export const isValidURL = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
};
