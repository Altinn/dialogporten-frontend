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
import type { PartyFieldsFragment } from 'bff-types-generated';
import i18n from 'i18next';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useCurrentEndUser, useSelectedProfile } from '../../api/hooks/usePartiesSelectors.ts';
import { getFrontPageLink } from '../../auth/url.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getSearchStringFromQueryParams, type PartyGroup } from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile/useProfile.tsx';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { useAuth } from '../Login/AuthContext.tsx';
import { useFooter } from './Footer/useFooter.tsx';
import { useGlobalMenu } from './GlobalMenu/useGlobalMenu.tsx';
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
  const [selectedGroup] = useGlobalState<PartyGroup | null>(QUERY_KEYS.SELECTED_GROUP, null);
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [isErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);
  const { headerProps } = useHeaderConfig();
  const footer: FooterProps = useFooter();
  const { sidebarMenu } = useGlobalMenu();
  const { state } = useLocation();
  const fromView = (state as { fromView?: string })?.fromView;

  useProfile();

  const location = useLocation();
  const isInitialRender = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs synchronously after DOM mutations but before the browser paints.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (bulkMode) {
      setBulkMode(false);
    }

    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute('tabindex');
  }, [location.pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    const searchString = getSearchStringFromQueryParams(searchParams);
    queryClient.setQueryData(['search'], () => searchString || '');
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild breadcrumbs only when the route or language changes
  const breadcrumbItems = useMemo(() => {
    const isProfile = location.pathname.includes(PageRoutes.profile);
    const steps = [
      {
        label: t('route.titles.start'),
        as: (props: LinkProps) => {
          return <Link {...props} to={getFrontPageLink(i18n.language)} />;
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
  }, [location.pathname, fromView, docTitle]);

  const isAfterJune20 = new Date() >= new Date(2026, 5, 20);
  const bannerLink = getBannerLink(i18n.language, isAfterJune20);

  let color: LayoutColor = 'neutral';
  let theme: LayoutTheme = 'default';

  const isSinglePartyMatchingCurrentUser =
    selectedProfile === 'person' && selectedParties.length === 1 && selectedParties[0].party === currentEndUser?.party;

  if (isSinglePartyMatchingCurrentUser) {
    color = 'person';
    theme = 'subtle';
  } else if (selectedGroup) {
    color = 'person';
    theme = 'neutral';
  } else {
    color = selectedProfile === 'company' ? 'company' : 'person';
    theme = 'subtle';
  }

  const layoutProps: LayoutProps = {
    theme,
    color,
    banner: isAfterJune20
      ? {
          title: t('altinn_renewal_banner.title'),
          link: { label: t('altinn_renewal_banner.link'), href: bannerLink },
        }
      : {
          title: t('altinn_shutdown_banner.title'),
          link: { label: t('altinn_shutdown_banner.link'), href: bannerLink },
          color: 'warning',
          variant: 'alert',
        },
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
    },
    breadcrumbs: {
      ariaLabel: t('breadcrumbs.aria_label'),
      items: breadcrumbItems,
    },
  };

  return (
    <Layout {...layoutProps}>
      <Outlet />
      <Snackbar />
    </Layout>
  );
};

const getBannerLink = (languageCode: string, isAfterJune20: boolean) => {
  if (isAfterJune20) {
    switch (languageCode) {
      case 'en':
        return 'https://info.altinn.no/en/news/new-power-of-attorney-solution/';
      case 'nn':
        return 'https://info.altinn.no/nn/nyheiter/ny-fullmaktsloeysing/';
      default:
        return 'https://info.altinn.no/nyheter/ny-fullmaktsloesning/';
    }
  }
  switch (languageCode) {
    case 'en':
      return 'https://info.altinn.no/en/news/check-if-you-need-to-take-action-before-we-shut-down-the-old-altinn/';
    case 'nn':
      return 'https://info.altinn.no/nn/nyheiter/sjekk-om-du-ma-gjere-noko-for-vi-slar-av-gamle-altinn/';
    default:
      return 'https://info.altinn.no/nyheter/sjekk-om-du-ma-gjore-noe-for-vi-slar-av-gamle-altinn/';
  }
};
