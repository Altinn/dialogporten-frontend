import { Button, ButtonGroup, DsLink, SettingsModal, TextField, Textarea, Typography } from '@altinn/altinn-components';
import { ExternalLinkIcon, PadlockLockedFillIcon } from '@navikt/aksel-icons';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import type { UserNotificationType } from '../NotificationsPage/NotificationsPage';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings';
import { useProfile } from '../useProfile';
import { NotificationUsedByList } from './NotificationUsedByList';
import styles from './UserNotificationSettingsModal.module.css';
export type NotificationType = 'email' | 'phoneNumber' | 'address' | 'none';

export interface UserNotificationSettingsModalProps {
  userNotification?: UserNotificationType;
  onClose: () => void;
}

export const UserNotificationSettingsModal = ({ userNotification, onClose }: UserNotificationSettingsModalProps) => {
  const { user, isLoading } = useProfile();
  const { t } = useTranslation();
  const { uniqueEmailAddresses, uniquePhoneNumbers } = usePartiesWithNotificationSettings();
  if (isLoading) {
    return null;
  }
  const showModal = userNotification?.notificationType !== undefined;
  const isProdEnvironment = location.hostname.includes('af.altinn.no');
  const krrBaseUrl = isProdEnvironment
    ? 'https://minprofil.kontaktregisteret.no'
    : 'https://minprofil.test.kontaktregisteret.no';
  const krrUrl = `${krrBaseUrl}/?locale=${i18n.language}`;
  const krrInfoUrl = 'https://eid.difi.no/nb/kontakt-og-reservasjonsregisteret';
  const folkeRegisteretUrl = isProdEnvironment
    ? 'https://www.skatteetaten.no/person/folkeregister/flytte/'
    : 'https://testdata.skatteetaten.no/web/testnorge/soek/freg';

  const userEmailGroup = uniqueEmailAddresses.find((group) => group?.email === user.email);
  const emailUsedByPartyNames = userEmailGroup?.parties.map((party) => ({ name: party.name, type: party.type })) || [];

  const userPhoneGroup = uniquePhoneNumbers?.find((group) => group?.phoneNumber === user.phoneNumber);
  const phoneNumberUsedByPartyNames =
    userPhoneGroup?.parties.map((party) => ({ name: party.name, type: party.type })) || [];
  const address = `${user?.party?.person?.mailingAddress} ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;

  if (!userNotification || isLoading) {
    return null;
  }

  const renderNotificationType = () => {
    if (userNotification?.notificationType === 'phoneNumber') {
      return (
        <>
          <div className={styles.flexContainer}>
            <PadlockLockedFillIcon fontSize="1.5rem" />
            <p>Mobiltelefon</p>
          </div>
          <TextField
            className={styles.textField}
            name="phone"
            type="tel"
            placeholder="Mobiltelefon"
            value={user.phoneNumber || ''}
            readOnly
          />

          <NotificationUsedByList
            currentEnduserName={user?.party?.name || ''}
            avatarItems={phoneNumberUsedByPartyNames}
          />
        </>
      );
    }
    if (userNotification?.notificationType === 'email') {
      return (
        <>
          <div className={styles.flexContainer}>
            <PadlockLockedFillIcon fontSize="1.5rem" />
            <p>E-postadresse</p>
          </div>
          <TextField
            className={styles.textField}
            name="email"
            type="email"
            placeholder="E-postadresse"
            value={user.email || ''}
            readOnly
          />
          <NotificationUsedByList currentEnduserName={user?.party?.name || ''} avatarItems={emailUsedByPartyNames} />
        </>
      );
    }
    if (userNotification?.notificationType === 'address') {
      return (
        <>
          <div className={styles.flexContainer}>
            <PadlockLockedFillIcon fontSize="1.5rem" />
            <p>Adresse</p>
          </div>
          <Textarea name="address" placeholder="Adresse" value={address} readOnly />
        </>
      );
    }
    return null;
  };

  const mobileAndPhoneText = (
    <Typography>
      Primære varslingsadresser hentes fra et felles kontaktregister for stat og kommune. Endre i{' '}
      <DsLink href={krrInfoUrl}>Kontakt og reservasjonsregisteret</DsLink>, et felles kontaktregister for stat og
      kommune. Gå videre for å endre.
    </Typography>
  );
  const addressText = (
    <Typography>
      Altinn bruker adressen din fra <DsLink href={folkeRegisteretUrl}>Folkeregisteret</DsLink>.
    </Typography>
  );

  return (
    <SettingsModal open={showModal} onClose={onClose} title={userNotification?.title} icon={userNotification?.icon}>
      {renderNotificationType()}
      {userNotification?.notificationType === 'address' ? addressText : mobileAndPhoneText}
      <ButtonGroup>
        <Button variant="outline" href={krrUrl} icon={{ svgElement: ExternalLinkIcon }} as="a" reverse>
          {t('profile.change_contact_settings')}
        </Button>
      </ButtonGroup>
    </SettingsModal>
  );
};
