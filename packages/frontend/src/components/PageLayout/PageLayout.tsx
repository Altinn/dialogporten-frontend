import {
  Badge,
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
import type { PartyFieldsFragment } from 'bff-types-generated';
import i18n from 'i18next';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useCurrentEndUser, useCurrentPartyUuid, useSelectedProfile } from '../../api/hooks/usePartiesSelectors.ts';
import { getFrontPageLink } from '../../auth';
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
import { getPageRouteTitle } from './pageRouteToTitle.ts';
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
  const [docTitle] = useGlobalState<string>(QUERY_KEYS.CURRENT_DIALOG_TITLE, '');
  const [bulkMode, setBulkMode] = useGlobalState<boolean>(QUERY_KEYS.BULK_MODE, false);
  const selectedProfile = useSelectedProfile();
  const currentEndUser = useCurrentEndUser();
  const currentPartyUuid = useCurrentPartyUuid();
  const [allOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [isErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);
  const { headerProps } = useHeaderConfig();
  const footer: FooterProps = useFooter();
  const { sidebarMenu } = useGlobalMenu();
  const { state } = useLocation();
  const fromView = (state as { fromView?: string })?.fromView;

  useProfile();

  const location = useLocation();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs synchronously after DOM mutations but before the browser paints.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (bulkMode) {
      setBulkMode(false);
    }
  }, [location.pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    const searchString = getSearchStringFromQueryParams(searchParams);
    queryClient.setQueryData(['search'], () => searchString || '');
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const breadcrumbItems = useMemo(() => {
    const isProfile = location.pathname.includes(PageRoutes.profile);
    const steps = [
      {
        label: t('route.titles.start'),
        as: (props: LinkProps) => {
          return <Link {...props} to={getFrontPageLink(currentPartyUuid, i18n.language)} />;
        },
      },
    ];

    if (isProfile) {
      steps.push({
        label: t('sidebar.profile'),
        as: (props) => (
          <Link {...props} to="/profile">
            {t('sidebar.profile')}
          </Link>
        ),
      });

      const initialPath = (fromView || location.pathname) as PageRoutes;
      const pageRouteTitle = getPageRouteTitle(initialPath);

      if (location.pathname !== PageRoutes.profile) {
        steps.push({
          label: pageRouteTitle,
          as: (props) => (
            <Link {...props} to={initialPath}>
              {pageRouteTitle}
            </Link>
          ),
        });
      }
    } else {
      const initialPath = (fromView || location.pathname) as PageRoutes;
      const pageRouteTitle = getPageRouteTitle(initialPath);
      const isDialogDetails = location.pathname.includes('/inbox/');

      steps.push({
        label: t('sidebar.inbox'),
        as: (props) => (
          <Link {...props} to={'/'}>
            {t('sidebar.inbox')}
          </Link>
        ),
      });

      if (location.pathname !== PageRoutes.inbox) {
        const shouldSkip = isDialogDetails && fromView === PageRoutes.inbox;

        if (!shouldSkip && pageRouteTitle) {
          steps.push({
            label: pageRouteTitle,
            as: (props) => (
              <Link {...props} to={initialPath}>
                {pageRouteTitle}
              </Link>
            ),
          });
        }
      }

      if (isDialogDetails) {
        steps.push({
          label: docTitle,
          as: (props) => (
            <Link {...props} to={location.pathname} state={{ fromView }}>
              {docTitle}
            </Link>
          ),
        });
      }
    }

    return steps;
  }, [currentPartyUuid, location.pathname, fromView, docTitle]);

  const layoutProps: LayoutProps = {
    theme: 'inbox',
    color: isProfile ? 'person' : selectedProfile,
    skipLink: {
      href: '#main-content',
      color: 'inherit' as Color,
      size: 'xs' as Size,
      children: t('skip_link.jumpto'),
    },
    header: headerProps,
    footer,
    sidebar: {
      sticky: true,
      menu: sidebarMenu,
      hidden: isErrorState || bulkMode,
      footer: <Badge label={t('word.beta')} variant="base" color="neutral" size="sm" />,
    },
    breadcrumbs: {
      ariaLabel: t('breadcrumbs.aria_label'),
      items: breadcrumbItems,
    },
  };

  return (
    <>
      <Layout {...layoutProps} useGlobalHeader>
        <Outlet />
        <Snackbar />
        <BetaModal />
        <FloatingDropdown />
      </Layout>
    </>
  );
};
