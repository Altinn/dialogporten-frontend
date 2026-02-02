import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import {
  BellIcon,
  Buildings2Icon,
  ChatExclamationmarkIcon,
  CogIcon,
  HeartIcon,
  InboxFillIcon,
  InformationSquareIcon,
  MenuGridIcon,
  PadlockLockedFillIcon,
  PersonCircleIcon,
} from '@navikt/aksel-icons';
import {
  getAboutNewAltinnLink,
  getAccessAMUILink,
  getNeedHelpLink,
  getNewFormLink,
  getStartNewBusinessLink,
} from '../../../auth';
import { i18n } from '../../../i18n/config.ts';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { createMenuItemComponent, isRouteSelected } from './shared.tsx';
import type { UseGlobalMenuProps } from './useGlobalMenu.tsx';

export function buildProfileMenu({
  t,
  currentEndUserName,
  pathname,
  currentSearchQuery,
  fromView,
  currentPartyUuid,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  fromView?: string;
  currentPartyUuid?: string;
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
    help: {
      divider: true,
      defaultIconTheme: 'transparent' as Theme,
      defaultItemSize: 'sm' as MenuItemSize,
    },
    'profile-shortcut': {
      divider: true,
      title: t('parties.current_end_user', { name: currentEndUserName ?? 'n/a' }),
    },
  };

  const profileItems: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: {
        name: formatDisplayName({
          fullName: currentEndUserName ?? '',
          type: 'person',
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
          size: 'sm',
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
          size: 'sm',
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
          size: 'sm',
          title: t('sidebar.profile.settings'),
          selected: isRouteSelected(pathname, PageRoutes.settings, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.settings + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const helpItems: MenuItemProps[] = [
    {
      id: 'about-altinn',
      'data-testid': 'sidebar-about-altinn',
      groupId: 'help',
      icon: InformationSquareIcon,
      size: 'sm',
      title: t('global_menu.about_altinn'),
      as: createMenuItemComponent({
        to: getAboutNewAltinnLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'start-business',
      'data-testid': 'sidebar-start-business',
      groupId: 'help',
      icon: Buildings2Icon,
      size: 'sm',
      title: t('global_menu.start_business'),
      as: createMenuItemComponent({
        to: getStartNewBusinessLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'need-help',
      'data-testid': 'sidebar-need-help',
      groupId: 'help',
      icon: ChatExclamationmarkIcon,
      size: 'sm',
      title: t('global_menu.need_help'),
      as: createMenuItemComponent({
        to: getNeedHelpLink(currentPartyUuid, i18n.language),
      }),
    },
  ];

  const sidebarMenu: MenuProps = {
    variant: 'tinted',
    groups: menuGroups,
    color: 'person',
    items: [
      ...profileItems.map((item, idx) => ({
        ...item,
        iconTheme: idx === 0 ? 'base' : 'tinted',
      })),
    ],
  };

  const globalMenuItems: MenuItemProps[] = [
    {
      id: '1',
      'data-testid': 'sidebar-inbox',
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
        color: 'neutral',
        variant: 'base',
      },
    },
    {
      id: 'am',
      groupId: 'global',
      size: 'lg',
      selected: false,
      icon: PadlockLockedFillIcon,
      as: 'a',
      href: getAccessAMUILink(currentPartyUuid),
      title: t('altinn.access_management'),
      badge: {
        label: t('word.beta'),
        color: 'neutral',
        variant: 'base',
      },
    },
    {
      id: 'all-forms',
      groupId: 'global',
      size: 'lg',
      icon: MenuGridIcon,
      title: t('global_menu.all_forms_services'),
      as: createMenuItemComponent({
        to: getNewFormLink(currentPartyUuid, i18n.language),
      }),
      selected: false,
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
    title: t('sidebar.profile'),
    selected: true,
    items: [],
  };

  const desktopMenu: MenuProps = {
    groups: menuGroups,
    items: [...globalMenuItems, ...helpItems, profileMenuItem],
  };

  const mobileMenu: MenuProps = {
    ...desktopMenu,
    items: [
      ...globalMenuItems,
      ...helpItems,
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
