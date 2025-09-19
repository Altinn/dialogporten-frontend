import { type AccountListItemProps, Divider, List, Section, SettingsItem } from '@altinn/altinn-components';
import { HouseIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useProfile } from '../useProfile';
import { AccountToolbar } from './CompanyDetails';
import { type NotificationType, UserNotificationSettingsModal } from './UserNotificationSettingsModal';

export interface UserDetailsProps extends AccountListItemProps {
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  address?: string;
}

export const UserDetails = ({ id, type, name }: UserDetailsProps) => {
  const { user } = useProfile();
  const alertEmailAddress = user?.email || '';
  const alertPhoneNumber = user?.phoneNumber || '';
  const address = `${user?.party?.person?.mailingAddress} ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;
  const [showNotificationModal, setShowNotificationModal] = useState<NotificationType>('none');

  return (
    <Section color="person" padding={6} spacing={2}>
      <AccountToolbar id={id} isCurrentEndUser={true} type={type} name={name} />
      <Divider />
      <List size="sm">
        <SettingsItem
          icon={MobileIcon}
          title="Varslinger på SMS"
          value={alertPhoneNumber?.length ? alertPhoneNumber : 'Mobilnummer ikke registrert'}
          badge={{ label: 'Endre mobil', variant: 'text' }}
          linkIcon
          onClick={() => setShowNotificationModal('phoneNumber')}
          as="button"
        />
        <SettingsItem
          icon={PaperplaneIcon}
          title="Varslinger på e-post"
          value={alertEmailAddress?.length ? alertEmailAddress : 'Epostadresse ikke registrert'}
          badge={{ label: 'Endre e-post', variant: 'text' }}
          linkIcon
          onClick={() => setShowNotificationModal('email')}
          as="button"
        />
        <Divider as="li" />
        <SettingsItem
          icon={HouseIcon}
          title="Adresse"
          value={address}
          badge={{ label: 'Endre Adresse', variant: 'text' }}
          linkIcon
          onClick={() => setShowNotificationModal('address')}
          as="button"
        />
      </List>
      <UserNotificationSettingsModal notificationType={showNotificationModal} setShowModal={setShowNotificationModal} />
    </Section>
  );
};
