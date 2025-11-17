import type { MenuProps } from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useFeatureFlag } from '../../../featureFlags';
import { useProfile } from '../../../pages/Profile';
import { PageRoutes } from '../../../pages/routes.ts';
import { buildInboxMenu } from './inboxMenu.tsx';
import { buildProfileMenu } from './profileMenu.tsx';

export interface UseGlobalMenuProps {
  sidebarMenu: MenuProps;
  mobileMenu: MenuProps;
  desktopMenu: MenuProps;
}

export const useGlobalMenu = (): UseGlobalMenuProps => {
  const { pathname, search: currentSearchQuery, state } = useLocation();
  const stopReversingPersonNameOrder = useFeatureFlag<boolean>('party.stopReversingPersonNameOrder');
  const isProfile = pathname.includes(PageRoutes.profile);
  const fromView = (state as { fromView?: string })?.fromView;
  const { t } = useTranslation();
  const { currentEndUser, currentPartyUuid } = useParties();
  const showAmLink: boolean = useFeatureFlag<boolean>('globalMenu.enableAccessManagementLink', false);
  const { user } = useProfile();

  const inboxMenus = useMemo(
    () =>
      buildInboxMenu({
        t,
        currentEndUserName: currentEndUser?.name,
        pathname,
        currentSearchQuery,
        fromView,
        showAmLink,
        currentPartyUuid,
      }),
    [t, currentEndUser?.name, pathname, currentSearchQuery, fromView, showAmLink, currentPartyUuid],
  );

  const profileMenus = useMemo(
    () =>
      buildProfileMenu({
        t,
        currentEndUserName: currentEndUser?.name,
        pathname,
        currentSearchQuery,
        stopReversingPersonNameOrder,
        fromView,
        userName: user?.party?.name ?? '',
        showAmLink,
        currentPartyUuid,
      }),
    [
      t,
      currentEndUser?.name,
      pathname,
      currentSearchQuery,
      stopReversingPersonNameOrder,
      fromView,
      user?.party?.name,
      showAmLink,
      currentPartyUuid,
    ],
  );

  return isProfile ? profileMenus : inboxMenus;
};
