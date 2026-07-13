import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import {
  BellIcon,
  Buildings2Icon,
  ChatExclamationmarkIcon,
  ExternalLinkIcon,
  HeartIcon,
  InboxFillIcon,
  InboxIcon,
  InformationSquareIcon,
  MagnifyingGlassIcon,
  MenuGridIcon,
  PadlockLockedFillIcon,
  PersonCircleIcon,
} from '@navikt/aksel-icons';
import {
  getAboutNewAltinnLink,
  getAccessAMUILink,
  getFrontPageLink,
  getNeedHelpLink,
  getNewFormLink,
  getProfileHelpLink,
  getStartNewBusinessLink,
} from '../../../auth/url.ts';
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
  hasOnlySelfParty,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  fromView?: string;
  hasOnlySelfParty: boolean;
}): UseGlobalMenuProps {
  const menuGroups = {
    shortcuts: {
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
        ...(hasOnlySelfParty
          ? []
          : ([
              {
                id: '1',
                groupId: '2',
                icon: HeartIcon,
                size: 'md',
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
                size: 'md',
                title: t('sidebar.profile.notifications'),
                selected: isRouteSelected(pathname, PageRoutes.notifications, fromView),
                as: createMenuItemComponent({
                  to: PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery),
                }),
              },
            ] satisfies MenuItemProps[])),
        {
          id: '3',
          groupId: 'saved-searches',
          icon: MagnifyingGlassIcon,
          size: 'md',
          title: t('sidebar.saved_searches'),
          selected: isRouteSelected(pathname, PageRoutes.savedSearches, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.savedSearches + pruneSearchQueryParams(currentSearchQuery),
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
        to: getAboutNewAltinnLink(i18n.language),
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
        to: getStartNewBusinessLink(i18n.language),
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
        to: getNeedHelpLink(i18n.language),
      }),
    },
  ];

  const inboxShortcut: MenuItemProps = {
    id: 'profile-inbox-shortcut',
    groupId: 'shortcuts',
    icon: InboxIcon,
    title: t('sidebar.inbox'),
    selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
    as: createMenuItemComponent({
      to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
    }),
  };

  const shortcuts: MenuItemProps[] = [inboxShortcut];

  const sidebarMenu: MenuProps = {
    variant: 'tinted',
    groups: menuGroups,
    items: [
      ...profileItems.map((item, idx) => ({
        ...item,
        iconTheme: idx === 0 ? 'base' : 'tinted',
      })),
      ...shortcuts,
      {
        id: 'help-pages',
        'data-testid': 'sidebar-help-pages',
        groupId: 'help',
        icon: ExternalLinkIcon,
        title: t('floating_dropdown.help_pages'),
        as: createMenuItemComponent({
          to: getProfileHelpLink(i18n.language),
          isExternal: true,
        }),
      },
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
    },
    {
      id: 'am',
      groupId: 'global',
      size: 'lg',
      selected: false,
      icon: PadlockLockedFillIcon,
      as: 'a',
      href: getAccessAMUILink(),
      title: t('altinn.access_management'),
    },
    {
      id: 'all-forms',
      groupId: 'global',
      size: 'lg',
      icon: MenuGridIcon,
      title: t('global_menu.all_forms_services'),
      as: createMenuItemComponent({
        to: getNewFormLink(i18n.language),
      }),
      selected: false,
    },
    {
      id: 'altinn-search',
      groupId: 'global',
      size: 'lg',
      icon: MagnifyingGlassIcon,
      title: t('global_menu.altinn_search'),
      as: createMenuItemComponent({
        to: `${getFrontPageLink()}/sok?`,
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
    items: [
      ...globalMenuItems,
      ...helpItems,
      {
        id: 'help-pages',
        'data-testid': 'sidebar-help-pages',
        groupId: 'help',
        icon: ExternalLinkIcon,
        title: t('floating_dropdown.help_pages'),
        as: createMenuItemComponent({
          to: getProfileHelpLink(i18n.language),
          isExternal: true,
        }),
      },
      {
        ...profileMenuItem,
        selected: isRouteSelected(pathname, PageRoutes.profile, fromView),
        expanded: true,
        items: profileItems[0]?.items?.map((item) => ({ ...item, size: 'sm' })),
      },
    ],
  };

  return {
    sidebarMenu,
    desktopMenu,
  };
}
