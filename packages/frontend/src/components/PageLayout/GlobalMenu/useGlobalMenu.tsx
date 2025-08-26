import type { BadgeProps, LayoutProps, MenuItemProps, MenuItemSize } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BellIcon,
  BookmarkIcon,
  ClockDashedIcon,
  CogIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  HandshakeIcon,
  HeartIcon,
  InboxFillIcon,
  InformationSquareIcon,
  LeaveIcon,
  PadlockUnlockedIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../../auth';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { useWindowSize } from '../useWindowSize.tsx';

interface UseGlobalMenuProps {
  sidebar: LayoutProps['sidebar'];
  global: MenuItemProps[];
}

export const getAlertBadgeProps = (count: number): BadgeProps | undefined => {
  if (count > 0) {
    return {
      label: count.toString(),
      size: 'xs',
      theme: 'base',
      color: 'danger',
    };
  }
};

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

const createMenuItemComponent =
  ({ to, isExternal = false }: { to: string; isExternal?: boolean }): React.FC<MenuItemProps> =>
  (props) => {
    // @ts-ignore
    return <Link {...props} to={to} {...(isExternal ? { target: '__blank', rel: 'noopener noreferrer' } : {})} />;
  };

export const useGlobalMenu = (): UseGlobalMenuProps => {
  const { t } = useTranslation();
  const { pathname, search: currentSearchQuery, state } = useLocation();
  const fromView = (state as { fromView?: string })?.fromView;
  const { selectedProfile } = useParties();
  const { isTabletOrSmaller } = useWindowSize();

  const inboxShortcuts: MenuItemProps[] = [
    {
      id: 'beta-about',
      groupId: 'shortcuts',
      icon: InformationSquareIcon,
      title: t('altinn.beta.about'),
      as: createMenuItemComponent({
        to: PageRoutes.about + pruneSearchQueryParams(currentSearchQuery),
      }),
      selected: isRouteSelected(pathname, PageRoutes.about, fromView),
    },
    {
      id: 'beta-exit',
      groupId: 'shortcuts',
      icon: LeaveIcon,
      title: t('altinn.beta.exit'),
      as: createMenuItemComponent({
        to: createMessageBoxLink(),
      }),
    },
  ];

  const inboxMenu: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: { svgElement: InboxFillIcon, theme: 'base' },
      title: t('sidebar.inbox'),
      selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
      }),
      badge: {
        label: t('word.beta'),
      },
      items: [
        {
          id: '2',
          groupId: '2',
          icon: DocPencilIcon,
          title: t('sidebar.drafts'),
          selected: isRouteSelected(pathname, PageRoutes.drafts, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.drafts + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '2',
          icon: FileCheckmarkIcon,
          title: t('sidebar.sent'),
          selected: isRouteSelected(pathname, PageRoutes.sent, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.sent + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '4',
          groupId: '3',
          icon: BookmarkIcon,
          title: t('sidebar.saved_searches'),
          selected: isRouteSelected(pathname, PageRoutes.savedSearches, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.savedSearches + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '5',
          groupId: '4',
          icon: ArchiveIcon,
          title: t('sidebar.archived'),
          selected: isRouteSelected(pathname, PageRoutes.archive, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.archive + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '6',
          groupId: '4',
          icon: TrashIcon,
          title: t('sidebar.deleted'),
          selected: isRouteSelected(pathname, PageRoutes.bin, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.bin + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const profileMenu: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: { svgElement: InboxFillIcon, theme: 'base' },
      title: t('sidebar.profile'),
      selected: isRouteSelected(pathname, PageRoutes.profile, fromView),
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
      }),
      items: [
        {
          id: '2',
          groupId: '2',
          icon: { svgElement: HeartIcon, theme: 'default' },
          title: t('sidebar.profile.parties'),
          selected: isRouteSelected(pathname, PageRoutes.partiesOverview, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.partiesOverview + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '3',
          icon: { svgElement: HandshakeIcon, theme: 'default' },
          title: t('sidebar.profile.authorize'),
          selected: isRouteSelected(pathname, PageRoutes.authorize, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.authorize + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '4',
          groupId: '3',
          icon: { svgElement: PadlockUnlockedIcon, theme: 'default' },
          title: t('sidebar.profile.access'),
          selected: isRouteSelected(pathname, PageRoutes.access, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.access + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '5',
          groupId: '2',
          icon: { svgElement: BellIcon, theme: 'default' },
          title: t('sidebar.profile.notifications'),
          selected: isRouteSelected(pathname, PageRoutes.notifications, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '6',
          groupId: '4',
          icon: { svgElement: CogIcon, theme: 'default' },
          title: t('sidebar.profile.settings'),
          selected: isRouteSelected(pathname, PageRoutes.settings, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.settings + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '7',
          groupId: '5',
          icon: { svgElement: ClockDashedIcon, theme: 'default' },
          title: t('sidebar.profile.activities'),
          selected: isRouteSelected(pathname, PageRoutes.activities, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.activities + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];
  const sidebarItems = pathname.includes(PageRoutes.profile) ? profileMenu : [...inboxMenu, ...inboxShortcuts];

  const sidebarGroups = {
    shortcuts: {
      divider: false,
      title: t('word.shortcuts'),
      defaultItemSize: 'sm' as MenuItemSize,
    },
    global: {
      divider: false,
    },
  };

  const sidebarMenu: LayoutProps['sidebar'] = {
    menu: {
      items: sidebarItems,
      groups: sidebarGroups,
    },
  };

  const globalMobileMenu: MenuItemProps[] = [
    {
      ...sidebarItems[0],
      color: selectedProfile,
      items: sidebarItems[0].items,
    },
    ...inboxShortcuts,
  ];

  const globalDesktopMenu: MenuItemProps[] = [
    {
      ...sidebarItems[0],
      color: selectedProfile,
      items: [],
    },
    ...inboxShortcuts,
  ];

  return {
    sidebar: sidebarMenu,
    global: isTabletOrSmaller ? globalMobileMenu : globalDesktopMenu,
  };
};
