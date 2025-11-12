import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import { Badge, formatDisplayName } from '@altinn/altinn-components';
import { BellIcon, CogIcon, HandshakeIcon, HeartIcon, InboxFillIcon, PersonCircleIcon } from '@navikt/aksel-icons';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { createMenuItemComponent, getAccessAMUILink, isRouteSelected } from './shared.tsx';
import type { UseGlobalMenuProps } from './useGlobalMenu.tsx';

export function buildProfileMenu({
  t,
  currentEndUserName,
  pathname,
  currentSearchQuery,
  stopReversingPersonNameOrder,
  fromView,
  userName,
  showAmLink = false,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  stopReversingPersonNameOrder: boolean;
  fromView?: string;
  userName?: string;
  showAmLink?: boolean;
}): UseGlobalMenuProps {
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
      title: t('parties.current_end_user', { name: currentEndUserName ?? 'n/a' }),
    },
  };

  const profileItems: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      iconTheme: 'base',
      icon: {
        name: formatDisplayName({
          fullName: userName ?? '',
          type: 'person',
          reverseNameOrder: !stopReversingPersonNameOrder,
        }),
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
          icon: HeartIcon,
          title: t('sidebar.profile.parties'),
          selected: isRouteSelected(pathname, PageRoutes.partiesOverview, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.partiesOverview + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '2',
          groupId: '2',
          icon: BellIcon,
          title: t('sidebar.profile.notifications'),
          selected: isRouteSelected(pathname, PageRoutes.notifications, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '4',
          icon: CogIcon,
          title: t('sidebar.profile.settings'),
          selected: isRouteSelected(pathname, PageRoutes.settings, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.settings + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const sidebarMenu: MenuProps = {
    groups: menuGroups,
    color: 'person',
    variant: 'subtle',
    defaultIconTheme: 'default',
    items: [
      ...profileItems.map((item, idx) => ({
        ...item,
        iconTheme: idx === 0 ? 'base' : item.iconTheme,
      })),
    ],
  };

  const globalMenuItems: MenuItemProps[] = [
    {
      id: '1',
      dataTestId: 'sidebar-inbox',
      groupId: 'global',
      size: 'lg',
      icon: InboxFillIcon,
      iconTheme: 'tinted',
      title: t('sidebar.inbox'),
      selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
      expanded: true,
      badge: <Badge>{t('word.beta')}</Badge>,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
      }),
    },
    {
      id: 'am',
      groupId: 'global',
      size: 'lg',
      iconTheme: 'tinted',
      selected: false,
      icon: HandshakeIcon,
      hidden: !showAmLink,
      as: 'a',
      href: getAccessAMUILink(),
      title: t('altinn.access_management'),
      badge: <Badge>{t('word.beta')}</Badge>,
    },
  ];

  const profileMenuItem: MenuItemProps = {
    groupId: 'profile-shortcut',
    id: 'profile',
    size: 'sm',
    as: createMenuItemComponent({
      to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
    }),
    icon: PersonCircleIcon,
    iconTheme: 'transparent',
    title: t('sidebar.profile'),
    selected: true,
    items: [],
  };

  const desktopMenu: MenuProps = {
    groups: menuGroups,
    items: [...globalMenuItems, profileMenuItem],
  };

  const mobileMenu: MenuProps = {
    ...desktopMenu,
    items: [
      ...globalMenuItems,
      {
        ...profileMenuItem,
        selected: isRouteSelected(pathname, PageRoutes.profile, fromView),
        expanded: true,
        items: profileItems[0].items,
      },
    ],
  };

  return {
    sidebarMenu,
    mobileMenu,
    desktopMenu,
  };
}
