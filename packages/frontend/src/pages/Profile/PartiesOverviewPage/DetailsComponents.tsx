import {
  type AccountListItemProps,
  Badge,
  type BadgeProps,
  Button,
  ContextMenu,
  type ContextMenuProps,
  Divider,
  Flex,
  Heading,
  IconButton,
  List,
  ListItemControls,
  Section,
  SettingsItem,
} from '@altinn/altinn-components';
import type { AccountListItemControlsProps } from '@altinn/altinn-components/dist/types/lib/components/Account/AccountListItemControls';
import {
  BellIcon,
  Buildings2Icon,
  HandshakeIcon,
  HeartFillIcon,
  HeartIcon,
  HouseIcon,
  InboxIcon,
  MinusCircleIcon,
  MobileIcon,
  PaperplaneIcon,
  PencilIcon,
} from '@navikt/aksel-icons';
import { Fragment, type ReactNode } from 'react';
import { useProfile } from '../../../profile';

export const AccountToolbar = ({ id, type }: AccountDetailsProps) => {
  return (
    <Flex spacing={2} size="xs">
      <Button icon={InboxIcon} variant="outline">
        Gå til Innboks
      </Button>
      <Button variant={'outline'} icon={PencilIcon} onClick={() => console.info('Edit group id: ', id)}>
        Rediger
      </Button>
      {type !== 'group' && (
        <Button icon={HandshakeIcon} variant="outline">
          Tilgangsstyring
        </Button>
      )}
    </Flex>
  );
};

interface AccountDetailsProps extends AccountListItemProps {
  smsAlerts?: boolean;
  emailAlerts?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  items?: AccountListItemProps[];
}

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
            const onRemoveFromGroup = async () => {
              await deleteFavoriteParty(item.id).then((res) => {
                console.info('Removed ', item.id, ' from group ', id, res);
              });
            };

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

export const UserDetails = ({ ...props }: AccountDetailsProps) => {
  const { phone, email, address, id } = props;
  return (
    <Section color="person" padding={6} spacing={2}>
      <AccountToolbar {...props} id={id} isCurrentEndUser={true} />
      <Divider />
      <List size="sm">
        <SettingsItem
          icon={MobileIcon}
          title="Varslinger på SMS"
          value={phone}
          badge={{ label: 'Endre mobil', variant: 'text' }}
          linkIcon
        />
        <SettingsItem
          icon={PaperplaneIcon}
          title="Varslinger på e-post"
          value={email}
          badge={{ label: 'Endre e-post', variant: 'text' }}
          linkIcon
        />
        <Divider as="li" />
        <SettingsItem
          icon={HouseIcon}
          title="Adresse"
          value={address}
          badge={{ label: 'Endre Adresse', variant: 'text' }}
          linkIcon
        />
      </List>
    </Section>
  );
};

export const NotificationSettings = ({ smsAlerts = false, emailAlerts = false, email, phone }: AccountDetailsProps) => {
  const badge =
    smsAlerts && emailAlerts
      ? { label: 'SMS og E-post' }
      : smsAlerts
        ? { label: 'SMS' }
        : emailAlerts
          ? { label: 'E-post' }
          : { variant: 'text', label: 'Sett opp varsling' };

  const title = smsAlerts || emailAlerts ? 'Varsler er på' : 'Ingen varsler';

  const value = smsAlerts && emailAlerts ? [email, phone].join(', ') : smsAlerts ? phone : emailAlerts && email;

  return (
    <List size="sm">
      <SettingsItem icon={BellIcon} title={title} value={value} badge={badge as BadgeProps} linkIcon />
    </List>
  );
};
export const CompanyDetails = ({ ...props }: AccountDetailsProps) => {
  const { id, uniqueId, parentId, items } = props;
  const parentAccount = items?.find((item) => item.id === parentId);

  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar {...props} id={id} />
      <Divider />
      <NotificationSettings {...props} id={id} />
      <List size="sm">
        <Divider as="li" />
        <SettingsItem
          icon={{ svgElement: Buildings2Icon, theme: 'default' }}
          title="Organisasjonsnummer"
          value={uniqueId}
          linkIcon
        />
        {parentAccount && (
          <>
            <Divider as="li" />
            <SettingsItem
              icon={{ svgElement: Buildings2Icon, theme: 'default' }}
              title="Overordnet organisasjon"
              value={parentAccount.name}
              linkIcon
            />
          </>
        )}
        <SettingsItem
          icon={{ svgElement: HandshakeIcon, theme: 'default' }}
          title="Rolle og rettigheter"
          value="Daglig leder"
          linkIcon
        />
      </List>
    </Section>
  );
};

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
    // if (isValidElement(badge)) {
    //   return badge;
    // }
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
