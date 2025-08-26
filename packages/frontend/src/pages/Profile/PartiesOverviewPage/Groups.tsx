import {
  Badge,
  type BadgeProps,
  ContextMenu,
  type ContextMenuProps,
  Divider,
  Heading,
  IconButton,
  List,
  ListItemControls,
  Section,
  SettingsItem,
} from '@altinn/altinn-components';
import type { AccountListItemControlsProps } from '@altinn/altinn-components/dist/types/lib/components/Account/AccountListItemControls';
import { HeartFillIcon, HeartIcon, MinusCircleIcon } from '@navikt/aksel-icons';
import { Fragment, type ReactNode } from 'react';
import { useProfile } from '..';
import { type AccountDetailsProps, AccountToolbar } from './CompanyDetails';

export const AccountListItemControls = ({
  id,
  type,
  badge,
  isCurrentEndUser = false,
  isDeleted = false,
  favourite = false,
  favouriteLabel,
  onToggleFavourite,
  contextMenu,
  loading,
}: AccountListItemControlsProps) => {
  /** Badge can be custom, or a Badge object. */
  const renderBadge = (): ReactNode => {
    if (badge && !loading && typeof badge === 'object' && 'label' in badge) {
      return <Badge {...(badge as BadgeProps)} />;
    }
    return null;
  };

  return (
    <ListItemControls>
      {badge && renderBadge()}
      {!isCurrentEndUser && !isDeleted && type !== 'group' && (
        <IconButton
          rounded
          variant="text"
          icon={favourite ? HeartFillIcon : HeartIcon}
          iconAltText={favouriteLabel || 'Toggle favourite'}
          onClick={() => onToggleFavourite?.(id)}
          size="xs"
        />
      )}
      {contextMenu && <ContextMenu {...contextMenu} />}
    </ListItemControls>
  );
};

export const GroupDetails = ({ items, id = 'group', accountIds }: AccountDetailsProps) => {
  const { groups, deleteFavoriteParty } = useProfile();
  const groupItems = accountIds
    ? items?.filter((item) => accountIds.includes(item.id))
    : items?.filter((item) => item.type === 'company');

  const currentGroup = groups.find((group) => group.id === Number.parseInt(id));
  const groupName = currentGroup?.name || 'Gruppe';

  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar name="group" type="group" id={id} />
      <Divider />
      <Section spacing={4}>
        <Heading size="sm">{items && items?.length > 0 ? items?.length : 0} medlemmer</Heading>
        <List size="sm" spacing={0}>
          {groupItems?.map((item, index) => {
            const onRemoveFromGroup = async () => await deleteFavoriteParty(item.id);

            return (
              <Fragment key={`${item.id}-${index}`}>
                {index > 0 && <Divider />}
                <SettingsItem
                  icon={item.icon}
                  title={item.title}
                  description={{
                    children: item.description as string,
                    size: 'xxs',
                  }}
                  {...item}
                  badge={
                    !item.expanded && (
                      <AccountListItemControls
                        id={id}
                        type={item.type}
                        favourite={item.favourite}
                        favouriteLabel={item.favouriteLabel}
                        badge={item.badge}
                        isCurrentEndUser={item.isCurrentEndUser}
                        isDeleted={item.isDeleted}
                        onToggleFavourite={item.onToggleFavourite}
                        contextMenu={
                          {
                            id: `${item.id}-menu`,
                            items: [
                              {
                                id: groupName + item.id + 'favremgroup',
                                groupId: currentGroup?.id?.toString(),
                                type: 'group',
                                icon: MinusCircleIcon,
                                title: `Fjern fra "${groupName}"`,
                                onClick: onRemoveFromGroup,
                              },
                            ],
                          } as ContextMenuProps
                        }
                      />
                    )
                  }
                  linkIcon
                />
              </Fragment>
            );
          })}
        </List>
      </Section>
    </Section>
  );
};
