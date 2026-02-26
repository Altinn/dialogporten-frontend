import { t } from 'i18next';
import { PageRoutes } from '../../pages/routes.ts';

export const getPageRouteTitle = (route: PageRoutes): string => {
  const routeMap: Record<PageRoutes, string> = {
    [PageRoutes.inbox]: 'inbox',
    [PageRoutes.drafts]: 'drafts',
    [PageRoutes.sent]: 'sent',
    [PageRoutes.bin]: 'deleted',
    [PageRoutes.archive]: 'archived',
    [PageRoutes.savedSearches]: 'saved_searches',
    [PageRoutes.inboxItem]: '',
    [PageRoutes.profile]: 'profile',
    [PageRoutes.partiesOverview]: 'parties',
    [PageRoutes.notifications]: 'notifications',
    [PageRoutes.settings]: 'settings',
    [PageRoutes.error]: 'error',
  };
  if (routeMap[route]) {
    return t('route.titles.' + routeMap[route]);
  }
  return '';
};
