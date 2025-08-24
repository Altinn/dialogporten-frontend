import {
  type AccountListItemProps,
  Badge,
  type BadgeProps,
  Button,
  ButtonGroup,
  ContextMenu,
  type ContextMenuProps,
  Divider,
  Fieldset,
  Flex,
  Heading,
  IconButton,
  List,
  ListItemControls,
  ModalBase,
  ModalBody,
  ModalHeader,
  Section,
  SettingsItem,
  type SettingsItemProps,
  Switch,
  TextField,
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
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationSettingsResponse } from 'bff-types-generated';
import { type ChangeEvent, Fragment, type ReactNode, useState } from 'react';
import { updateNotificationsetting } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { useProfile } from '../../../profile';
import { useNotificationSettings } from '../../../profile/useNotificationSettings';

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
  userId?: string;
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
  notificationSetting: NotificationSettingsResponse;
}

export const NotificationSettings = ({ notificationSetting }: NotificationSettingsProps) => {
  const [showModal, setShowModal] = useState(false);
  const { emailAddress: alertEmailAddress, phoneNumber: alertPhoneNumber } = notificationSetting;
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
      <SettingsItem
        icon={BellIcon}
        title={title}
        value={value}
        badge={badge as BadgeProps}
        linkIcon
        onClick={() => setShowModal((prev) => !prev)}
        as="button"
      />
      <AccountNotificationsModal
        title="Varslingsinnstillinger"
        open={showModal}
        onClose={() => setShowModal(false)}
        notificationSetting={notificationSetting}
      />
    </List>
  );
};

interface AccountModalProps {
  title?: SettingsItemProps['title'];
  icon?: SettingsItemProps['icon'];
  description?: SettingsItemProps['description'];
  open?: boolean;
  onClose: () => void;
  children?: ReactNode;
}

const AccountModal = ({
  icon,
  title = 'Navn på aktør',
  description,
  open = false,
  onClose,
  children,
}: AccountModalProps) => {
  return (
    <ModalBase open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <List>
          <SettingsItem icon={icon} title={title} description={description} interactive={false} />
        </List>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ModalBase>
  );
};

export interface AccountNotificationSettingsProps {
  notificationSetting: NotificationSettingsResponse;
  onClose: () => void;
}

export const AccountNotificationSettings = ({ notificationSetting, onClose }: AccountNotificationSettingsProps) => {
  const queryClient = useQueryClient();

  const alertPhoneNumber = notificationSetting.phoneNumber || '';
  const alertEmailAddress = notificationSetting.emailAddress || '';
  const [enablePhoneNotifications, setEnablePhoneNotifications] = useState(alertPhoneNumber.length > 0);
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(alertEmailAddress.length > 0);
  const [alertEmailAddressState, setAlertEmailAddressState] = useState(alertEmailAddress);
  const [alertPhoneNumberState, setAlertPhoneNumberState] = useState(alertPhoneNumber);

  if (!notificationSetting) {
    return null;
  }

  const partyUuid = notificationSetting.partyUuid || '';

  const handleUpdateNotificationSettings = async () => {
    const updatedSettings = {
      userId: notificationSetting.userId,
      partyUuid: partyUuid,
      emailAddress: enableEmailNotifications ? alertEmailAddressState : null,
      phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : null,
    };

    try {
      await updateNotificationsetting(updatedSettings);
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGS] });
      onClose();
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  return (
    <>
      <Fieldset size="sm">
        <Switch
          label={'Varsle på SMS'}
          name="smsAlerts"
          value="SMS"
          checked={enablePhoneNotifications}
          onChange={() => setEnablePhoneNotifications((prev) => !prev)}
        />
        {enablePhoneNotifications && (
          <TextField
            name="phone"
            placeholder="Mobiltelefon"
            value={alertPhoneNumberState}
            onChange={(e) => setAlertPhoneNumberState(e.target.value)}
          />
        )}
        <Switch
          label={alertEmailAddress || 'Varsle på E-post'}
          name="emailAlerts"
          value="E-post"
          checked={enableEmailNotifications}
          onChange={() => setEnableEmailNotifications((prev) => !prev)}
        />
        {enableEmailNotifications && (
          <TextField
            name="email"
            placeholder="E-postadresse"
            value={alertEmailAddressState}
            onChange={(e) => setAlertEmailAddressState(e.target.value)}
          />
        )}
      </Fieldset>
      <ButtonGroup>
        <Button onClick={handleUpdateNotificationSettings}>Lagre og avslutt</Button>
        <Button variant="outline" onClick={onClose}>
          Avbryt
        </Button>
      </ButtonGroup>
    </>
  );
};

interface AccountNotificationsModalProps extends AccountModalProps, AccountNotificationSettingsProps {
  notificationSetting: NotificationSettingsResponse;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const AccountNotificationsModal = ({
  icon,
  title,
  description,
  open,
  onClose,
  notificationSetting,
}: AccountNotificationsModalProps) => {
  return (
    <AccountModal icon={icon} title={title} description={description} open={open} onClose={onClose}>
      <AccountNotificationSettings notificationSetting={notificationSetting} onClose={onClose} />
    </AccountModal>
  );
};

export const CompanyDetails = ({ ...props }: AccountDetailsProps) => {
  const { id: partyUuid, uniqueId, parentId, items } = props;
  const parentAccount = items?.find((item) => item.id === parentId);

  const { notificationSettings } = useNotificationSettings(partyUuid);

  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar {...props} id={partyUuid} />
      <Divider />
      {notificationSettings?.length > 0 ? (
        notificationSettings?.map((notificationSetting, index) => (
          <NotificationSettings key={partyUuid + index} notificationSetting={notificationSetting} />
        ))
      ) : (
        <NotificationSettings
          key={partyUuid}
          notificationSetting={{
            partyUuid: partyUuid,
            emailAddress: '',
            phoneNumber: '',
          }}
        />
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
