import type { MenuProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useCurrentEndUser, useHasOnlySelfParty } from '../../../api/hooks/usePartiesSelectors.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { buildInboxMenu } from './inboxMenu.tsx';
import { buildProfileMenu } from './profileMenu.tsx';

export interface UseGlobalMenuProps {
  sidebarMenu: MenuProps;
  desktopMenu: MenuProps;
  mobileMenu?: MenuProps;
}

export const useGlobalMenu = (): UseGlobalMenuProps => {
  const { pathname, search: currentSearchQuery, state } = useLocation();
  const isProfile = pathname.includes(PageRoutes.profile);
  const fromView = (state as { fromView?: string })?.fromView;
  const { t } = useTranslation();
  const currentEndUser = useCurrentEndUser();
  const hasOnlySelfParty = useHasOnlySelfParty();

  const inboxMenus = buildInboxMenu({
    t,
    currentEndUserName: currentEndUser?.name,
    pathname,
    currentSearchQuery,
    fromView,
    hasOnlySelfParty,
  });

  const profileMenus = buildProfileMenu({
    t,
    currentEndUserName: currentEndUser?.name,
    pathname,
    currentSearchQuery,
    fromView,
    hasOnlySelfParty,
  });

  return isProfile ? profileMenus : inboxMenus;
};
