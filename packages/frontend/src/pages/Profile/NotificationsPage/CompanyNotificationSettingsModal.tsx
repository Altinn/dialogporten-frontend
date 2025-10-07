import { type AvatarProps, SettingsModal } from '@altinn/altinn-components';
import { CompanyNotificationSettings } from '../PartiesOverviewPage/CompanyNotificationSettings';
import { urnToOrgNr } from '../PartiesOverviewPage/partyFieldToAccountList';
import type { NotificationAccountsType } from './NotificationsPage';

interface CompanyNotificationSettingsModalProps {
  notificationParty: NotificationAccountsType | null;
  onClose: () => void;
  onSave?: () => void;
}

export const CompanyNotificationSettingsModal = ({
  notificationParty,
  onClose,
  onSave,
}: CompanyNotificationSettingsModalProps) => {
  const partyType = notificationParty?.partyType === 'Organization' ? 'company' : 'person';
  const computedIcon = {
    type: partyType,
    name: notificationParty?.name || '',
  };

  if (!notificationParty) {
    return null;
  }

  return (
    <SettingsModal
      open={true}
      onClose={onClose}
      description={
        (notificationParty?.partyType === 'Organization' ? 'Org.nr. ' : 'Fødselsnummer: ') +
        urnToOrgNr(notificationParty.party) +
        (notificationParty.parentId ? ', del av ' + notificationParty.name : '')
      }
      title={notificationParty?.name}
      color={partyType}
      icon={computedIcon as AvatarProps}
    >
      <CompanyNotificationSettings notificationParty={notificationParty} onClose={onClose} onSave={onSave} />
    </SettingsModal>
  );
};
