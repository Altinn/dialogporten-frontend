import {
  type Color,
  type FooterProps,
  Layout,
  type LayoutColor,
  type LayoutProps,
  type LayoutTheme,
  type Size,
  Snackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getSearchStringFromQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { BetaModal } from '../BetaModal';
import { FloatingDropdown } from '../FloatingDropdown';
import { useAuth } from '../Login/AuthContext.tsx';
import { useFooter } from './Footer';
import { useGlobalMenu } from './GlobalMenu';
import { useHeaderConfig } from './useHeaderConfig.tsx';

export const ProtectedPageLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  return <PageLayout />;
};

export const PageLayout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { selectedProfile, selectedParties, allOrganizationsSelected, currentEndUser } = useParties();
  const [isErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);
  const { isGlobalMenuEnabled, headerProps } = useHeaderConfig();

  const footer: FooterProps = useFooter();
  const { sidebarMenu } = useGlobalMenu();

  useProfile();

  const location = useLocation();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs synchronously after DOM mutations but before the browser paints.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    const searchString = getSearchStringFromQueryParams(searchParams);
    queryClient.setQueryData(['search'], () => searchString || '');
  }, [searchParams]);

  // CRITICAL PERFORMANCE: Memoize layoutProps to prevent Layout re-renders on navigation
  const layoutProps: LayoutProps = useMemo(() => {
    const isSinglePartyMatchingCurrentUser =
      selectedProfile === 'person' &&
      selectedParties.length === 1 &&
      selectedParties[0]?.party === currentEndUser?.party;

    let color: LayoutColor = 'neutral';
    let theme: LayoutTheme = 'default';

    if (isSinglePartyMatchingCurrentUser || isProfile || allOrganizationsSelected) {
      color = 'person';
      theme = 'neutral';
    } else {
      color = selectedProfile === 'company' ? 'company' : 'person';
      theme = 'subtle';
    }

    return {
      theme,
      color,
      content: {
        color: isProfile ? 'person' : undefined,
      },
      skipLink: {
        href: '#main-content',
        color: 'inherit' as Color,
        size: 'xs' as Size,
        children: t('skip_link.jumpto'),
      },
      header: headerProps,
      footer,
      sidebar: { menu: sidebarMenu, hidden: isErrorState },
    };
  }, [
    selectedProfile,
    selectedParties,
    currentEndUser,
    isProfile,
    allOrganizationsSelected,
    t,
    headerProps,
    footer,
    sidebarMenu,
    isErrorState,
  ]);

  return (
    <>
      <Layout {...layoutProps} useGlobalHeader={isGlobalMenuEnabled}>
        <Outlet />
        <Snackbar />
        <BetaModal />
        <FloatingDropdown />
      </Layout>
    </>
  );
};
