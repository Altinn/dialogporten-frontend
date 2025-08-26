import { Section } from '@altinn/altinn-components';
import { useNotificationSettings } from '../useNotificationSettings';
import type { AccountDetailsProps } from './CompanyDetails';
import { NotificationSetting } from './NotificationSettings';

export const NotificationDetails = ({ ...props }: AccountDetailsProps) => {
  const { id: partyUuid } = props;

  const { notificationSettings } = useNotificationSettings(partyUuid);

  return (
    <Section color="company" padding={6} spacing={2}>
      {notificationSettings ? (
        <NotificationSetting notificationSetting={notificationSettings} />
      ) : (
        <NotificationSetting
          key={partyUuid}
          notificationSetting={{
            partyUuid: partyUuid,
            emailAddress: '',
            phoneNumber: '',
          }}
        />
      )}
    </Section>
  );
};
