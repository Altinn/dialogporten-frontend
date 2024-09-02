import { ActorType } from 'bff-types-generated';
import type { DialogActivity, Participant } from '../../api/useDialogById.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { Avatar } from '../Avatar';

import { t } from 'i18next';
import styles from './activity.module.css';

interface ActivityProps {
  activity: DialogActivity;
  serviceOwner?: Participant;
}

const getActivityText = (activity: DialogActivity) => {
  switch (activity.type) {
    case 'INFORMATION':
      return activity.description || t('activity.description_missing');
    case 'PAYMENT_MADE':
      return t('activity.status.payment_made');
    case 'SIGNATURE_PROVIDED':
      return t('activity.status.signature_provided');
    case 'DIALOG_CREATED':
      return t('activity.status.dialog_created');
    case 'DIALOG_CLOSED':
      return t('activity.status.dialog_closed');
    case 'TRANSMISSION_OPENED':
      return t('activity.status.transmission_opened');
    default:
      return activity.type;
  }
};

export const Activity = ({ activity, serviceOwner }: ActivityProps) => {
  const format = useFormat();
  const isCompany =
    activity.performedBy.actorType === ActorType.ServiceOwner ||
    (activity.performedBy.actorId ?? '').includes('urn:altinn:organization:');
  const performedByName = isCompany ? serviceOwner?.name ?? '' : activity.performedBy.actorName ?? '';
  const imageUrl = isCompany ? serviceOwner?.imageURL : undefined;
  const text = getActivityText(activity);

  return (
    <div key={activity.id}>
      <div className={styles.activityParticipants}>
        <div className={styles.sender}>
          <Avatar
            name={performedByName}
            companyName={isCompany ? performedByName : ''}
            imageUrl={imageUrl}
            size="small"
          />
          <span className={styles.participantLabel}>{performedByName}</span>
        </div>
        <span className={styles.dateLabel}>{format(activity.createdAt, 'do MMMM yyyy HH:mm')}</span>
      </div>
      <div className={styles.statusSection}>
        <div className={styles.activityContent}>
          <span className={styles.activityDescription}>{text}</span>
        </div>
      </div>
    </div>
  );
};
