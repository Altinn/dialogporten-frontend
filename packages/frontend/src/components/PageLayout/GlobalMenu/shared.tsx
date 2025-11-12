import type { MenuItemProps } from '@altinn/altinn-components';
import { Link } from 'react-router-dom';
import { PageRoutes } from '../../../pages/routes.ts';

export const isRouteSelected = (currentRoute: string, targetRoute: PageRoutes, fromView?: string) => {
  if (currentRoute === targetRoute) {
    return true;
  }

  if (fromView && targetRoute === fromView) {
    return true;
  }

  /* default to inbox if no fromView and currentRoute is not a top level route, e.g. viewing a dialog entered the url */
  if (
    !fromView &&
    !Object.values(PageRoutes).includes(currentRoute as PageRoutes) &&
    targetRoute === PageRoutes.inbox
  ) {
    return true;
  }

  return false;
};

export const createMenuItemComponent =
  ({ to, isExternal = false }: { to: string; isExternal?: boolean }): React.FC<MenuItemProps> =>
  (props) => {
    // @ts-ignore
    return <Link {...props} to={to} {...(isExternal ? { target: '__blank', rel: 'noopener noreferrer' } : {})} />;
  };

/* TODO: When landing page for accessmanagement/ui/ is available, remove users from path */
export const getAccessAMUILink = () => {
  if (location.hostname.includes('at.altinn.cloud') || location.hostname.includes('at23.altinn.cloud')) {
    return 'https://am.ui.at23.altinn.cloud/accessmanagement/ui/users';
  }

  if (location.host.includes('yt.altinn.cloud')) {
    return 'https://am.ui.at23.altinn.cloud/accessmanagement/ui/users';
  }

  if (location.host.includes('tt.altinn.no') || location.host.includes('tt02.altinn.no')) {
    return 'https://am.ui.tt02.altinn.no/accessmanagement/ui/users';
  }
  return `https://am.ui.altinn.no/accessmanagement/ui/users`;
};
