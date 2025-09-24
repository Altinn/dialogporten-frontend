import type { BadgeProps, MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BellIcon,
  BookmarkIcon,
  CogIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  HeartIcon,
  InboxFillIcon,
  InformationSquareIcon,
  LeaveIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../../auth';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../../pages/Profile';
import { PageRoutes } from '../../../pages/routes.ts';

interface UseGlobalMenuProps {
  sidebarMenu: MenuProps;
  mobileMenu: MenuProps;
  desktopMenu: MenuProps;
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
  const { currentEndUser } = useParties();
  const { pathname, search: currentSearchQuery, state } = useLocation();
  const fromView = (state as { fromView?: string })?.fromView;
  const { user } = useProfile();

  const inboxShortcuts: MenuItemProps[] = [
    {
      id: 'beta-about',
      dataTestId: 'sidebar-about',
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
      dataTestId: 'sidebar-exit',
      groupId: 'shortcuts',
      icon: LeaveIcon,
      title: t('altinn.beta.exit'),
      as: createMenuItemComponent({
        to: createMessageBoxLink(),
      }),
    },
  ];

  const inboxItems: MenuItemProps[] = [
    {
      id: '1',
      dataTestId: 'sidebar-inbox',
      groupId: 'global',
      size: 'lg',
      icon: InboxFillIcon,
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
          dataTestId: 'sidebar-drafts',
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
          dataTestId: 'sidebar-sent',
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
          dataTestId: 'sidebar-saved-searches',
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
          dataTestId: 'sidebar-archive',
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
          dataTestId: 'sidebar-bin',
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

  const profileItems: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: {
        name: user?.party?.name || '',
      },
      title: t('sidebar.profile'),
      selected: isRouteSelected(pathname, PageRoutes.profile, fromView),
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
      }),
      items: [
        {
          id: '1',
          groupId: '2',
          icon: { svgElement: HeartIcon, theme: 'default' },
          title: t('sidebar.profile.parties'),
          selected: isRouteSelected(pathname, PageRoutes.partiesOverview, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.partiesOverview + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '2',
          groupId: '2',
          icon: { svgElement: BellIcon, theme: 'default' },
          title: t('sidebar.profile.notifications'),
          selected: isRouteSelected(pathname, PageRoutes.notifications, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '4',
          icon: { svgElement: CogIcon, theme: 'default' },
          title: t('sidebar.profile.settings'),
          selected: isRouteSelected(pathname, PageRoutes.settings, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.settings + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];
  const menuItems = pathname.includes(PageRoutes.profile) ? profileItems : [...inboxItems, ...inboxShortcuts];

  const menuGroups = {
    shortcuts: {
      divider: false,
      title: t('word.shortcuts'),
      defaultIconTheme: 'transparent' as Theme,
      defaultItemSize: 'sm' as MenuItemSize,
    },
    global: {
      divider: false,
    },
    'profile-shortcut': {
      title: t('parties.current_end_user', { name: currentEndUser?.name ?? 'n/a' }),
    },
  };

  const menu: MenuProps = {
    items: menuItems,
    groups: menuGroups,
  };

  const sidebarMenu: MenuProps = {
    ...menu,
    variant: 'subtle',
    defaultIconTheme: 'default',
    items: menu.items.map((item, index) => ({
      ...item,
      iconTheme: index === 0 ? 'base' : item.iconTheme,
    })),
  };

  const mobileMenu: MenuProps = {
    ...menu,
    items: [
      ...menuItems.map((item, index) => ({
        ...item,
        items: (item.items || []).map((item) => ({
          ...item,
          dataTestId: (item.dataTestId ?? '') + '-mobile-menu' + (item.dataTestId ? '' : '-' + index),
        })),
        dataTestId: (item.dataTestId ?? '') + '-mobile-menu' + (item.dataTestId ? '' : '-' + index),
      })),
      { groupId: 'profile-shortcut', hidden: true },
    ],
    defaultIconTheme: 'tinted',
  };

  const desktopMenu: MenuProps = {
    ...mobileMenu,
    items: [{ ...mobileMenu.items[0], expanded: false, items: [] }, ...mobileMenu.items.slice(1)],
    groups: {
      ...mobileMenu.groups,
      shortcuts: {
        ...mobileMenu.groups?.shortcuts,
        divider: true,
        title: undefined,
      },
    },
  };

  return {
    sidebarMenu,
    mobileMenu,
    desktopMenu,
  };
};
