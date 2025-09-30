import type { MenuProps } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { FeatureFlagKeys, useFeatureFlag } from '../../../featureFlags';
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
  const isProfile = pathname.includes(PageRoutes.profile);
  const fromView = (state as { fromView?: string })?.fromView;
  const { t } = useTranslation();
  const { currentEndUser } = useParties();
  const showProfileLink: boolean = useFeatureFlag(FeatureFlagKeys.EnableProfileLinkInGlobalMenu);
  const showAmLink: boolean = useFeatureFlag(FeatureFlagKeys.EnableAccessManagementLinkInGlobalMenu);
  const { user } = useProfile();

  const inboxMenus = buildInboxMenu({
    t,
    currentEndUserName: currentEndUser?.name,
    pathname,
    currentSearchQuery,
    fromView,
    showProfileLink,
    showAmLink,
  });

  const profileMenus = buildProfileMenu({
    t,
    currentEndUserName: currentEndUser?.name,
    pathname,
    currentSearchQuery,
    fromView,
    userName: user?.party?.name ?? '',
    showAmLink,
  });

  return isProfile ? profileMenus : inboxMenus;
};
