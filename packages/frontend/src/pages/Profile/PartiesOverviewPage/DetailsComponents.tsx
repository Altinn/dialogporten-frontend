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
} from '@navikt/aksel-icons';
import type { ProfessionalNotificationAddressResponse } from 'bff-types-generated';
import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { useProfile } from '../../../profile';

export const AccountToolbar = ({ id, type, isCurrentEndUser, favourite, onToggleFavourite }: AccountDetailsProps) => {
  return (
    <Flex spacing={2} size="xs">
      {!isCurrentEndUser && (
        <Button
          variant={favourite ? 'tinted' : 'outline'}
          icon={favourite ? HeartFillIcon : HeartIcon}
          onClick={() => onToggleFavourite?.(id)}
        >
          {favourite ? 'Fjern favoritt' : 'Legg til favoritt'}
        </Button>
      )}
      <Button icon={InboxIcon} variant="outline">
        Gå til Innboks
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
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  contactEmailAddress?: string;
  contactPhoneNumber?: string;
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

export const UserDetails = (props: AccountDetailsProps) => {
  const { alertPhoneNumber, alertEmailAddress, address, id } = props;
  return (
    <Section color="person" padding={6} spacing={2}>
      <AccountToolbar {...props} id={id} isCurrentEndUser={true} />
      <Divider />
      <List size="sm">
        <SettingsItem
          icon={MobileIcon}
          title="Varslinger på SMS"
          value={alertPhoneNumber?.length ? alertPhoneNumber : 'Mobilnummer ikke registrert'}
          badge={{ label: 'Endre mobil', variant: 'text' }}
          linkIcon
        />
        <SettingsItem
          icon={PaperplaneIcon}
          title="Varslinger på e-post"
          value={alertEmailAddress?.length ? alertEmailAddress : 'Epostadresse ikke registrert'}
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

interface NotificationSettingsProps {
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
}

export const NotificationSettings = ({ alertPhoneNumber, alertEmailAddress }: NotificationSettingsProps) => {
  const badge =
    alertPhoneNumber && alertEmailAddress
      ? { label: 'SMS og E-post' }
      : alertPhoneNumber
        ? { label: 'SMS' }
        : alertEmailAddress
          ? { label: 'E-post' }
          : { variant: 'text', label: 'Sett opp varsling' };

  const title = alertPhoneNumber || alertEmailAddress ? 'Varslinger er på' : 'Ingen varslinger';
  const value =
    alertPhoneNumber && alertEmailAddress
      ? `${alertEmailAddress}, ${alertPhoneNumber}`
      : alertPhoneNumber || alertEmailAddress;

  return (
    <List size="sm">
      <SettingsItem icon={BellIcon} title={title} value={value} badge={badge as BadgeProps} linkIcon />
    </List>
  );
};

export const CompanyDetails = ({ ...props }: AccountDetailsProps) => {
  const { id, uniqueId, parentId, items } = props;
  const parentAccount = items?.find((item) => item.id === parentId);

  const { getNotificationsettingsByUuid } = useProfile();

  const [notificationSettings, setNotificationSettings] = useState<
    ProfessionalNotificationAddressResponse[] | undefined
  >(undefined);

  useEffect(() => {
    let isMounted = true;
    getNotificationsettingsByUuid(id)
      .then((s) => {
        const settings = (s?.notificationsettingsByUuid as ProfessionalNotificationAddressResponse[]) ?? undefined;
        if (isMounted) setNotificationSettings(settings);
      })
      .catch((e) => {
        console.error('Failed to fetch notification settings:', e);
        setNotificationSettings([] as ProfessionalNotificationAddressResponse[] | undefined);
      });
    return () => {
      isMounted = false;
    };
  }, [id, getNotificationsettingsByUuid]);

  if (!notificationSettings) {
    return null;
  }

  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar {...props} id={id} />
      <Divider />
      {(notificationSettings as ProfessionalNotificationAddressResponse[] | null)?.map(
        (notificationSetting: ProfessionalNotificationAddressResponse, index: number) => (
          <NotificationSettings
            key={id + index}
            alertEmailAddress={notificationSetting.emailAddress || ''}
            alertPhoneNumber={notificationSetting.phoneNumber || ''}
          />
        ),
      )}
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
