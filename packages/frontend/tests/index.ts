import { PageRoutes } from '../src/pages/routes';

export const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
export const baseQueryParams = '?mock=true';

export const appURLInbox = baseURL + PageRoutes.inbox + baseQueryParams;
export const appURLDrafts = baseURL + PageRoutes.drafts + baseQueryParams;
export const appURLBin = baseURL + PageRoutes.bin + baseQueryParams;
export const appURLSent = baseURL + PageRoutes.sent + baseQueryParams;
export const appURLSavedSearches = baseURL + PageRoutes.savedSearches + baseQueryParams;
export const appUrlWithPlaywrightId = (id: string): string => {
  return appURLInbox + `&playwrightId=${id}`;
};
export const matchPathName = (currentURL: string, expectedRoute: string): boolean => {
  return new URL(currentURL).pathname === new URL(expectedRoute).pathname;
};

export const defaultAppURL = appURLInbox;
