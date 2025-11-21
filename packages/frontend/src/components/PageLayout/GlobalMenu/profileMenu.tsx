import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import { Badge, formatDisplayName } from '@altinn/altinn-components';
import {
  BellIcon,
  Buildings2Icon,
  ChatExclamationmarkIcon,
  CogIcon,
  HeartIcon,
  InboxFillIcon,
  InformationSquareIcon,
  MenuGridIcon,
  PadlockLockedIcon,
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
  stopReversingPersonNameOrder,
  fromView,
  userName,
  showAmLink = false,
  currentPartyUuid,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  stopReversingPersonNameOrder: boolean;
  fromView?: string;
  userName?: string;
  showAmLink?: boolean;
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
      dataTestId: 'sidebar-about-altinn',
      groupId: 'help',
      icon: InformationSquareIcon,
      iconTheme: 'transparent',
      size: 'sm',
      title: t('global_menu.about_altinn'),
      as: createMenuItemComponent({
        to: getAboutNewAltinnLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'start-business',
      dataTestId: 'sidebar-start-business',
      groupId: 'help',
      icon: Buildings2Icon,
      iconTheme: 'transparent',
      size: 'sm',
      title: t('global_menu.start_business'),
      as: createMenuItemComponent({
        to: getStartNewBusinessLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'need-help',
      dataTestId: 'sidebar-need-help',
      groupId: 'help',
      icon: ChatExclamationmarkIcon,
      iconTheme: 'transparent',
      size: 'sm',
      title: t('global_menu.need_help'),
      as: createMenuItemComponent({
        to: getNeedHelpLink(currentPartyUuid, i18n.language),
      }),
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
      title: (
        <>
          {t('sidebar.inbox')} <Badge>{t('word.beta')}</Badge>
        </>
      ),
      selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
      expanded: true,
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
      icon: PadlockLockedIcon,
      hidden: !showAmLink,
      as: 'a',
      href: getAccessAMUILink(currentPartyUuid),
      title: (
        <>
          {t('altinn.access_management')} <Badge>{t('word.beta')}</Badge>
        </>
      ),
    },
    {
      id: 'all-forms',
      groupId: 'global',
      size: 'lg',
      icon: MenuGridIcon,
      iconTheme: 'tinted',
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
    iconTheme: 'transparent',
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
