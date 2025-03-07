import { Avatar } from '@altinn/altinn-components';
import { t } from 'i18next';
import type { DialogActivity } from '../../api/useDialogById.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import styles from './activity.module.css';

interface ActivityProps {
  activity: DialogActivity;
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

export const Activity = ({ activity }: ActivityProps) => {
  const format = useFormat();
  const text = getActivityText(activity);
  const clockPrefix = t('word.clock_prefix');
  const formatString = clockPrefix ? `do MMMM yyyy '${clockPrefix}' HH.mm` : `do MMMM yyyy HH.mm`;

  return (
    <div key={activity.id}>
      <div className={styles.activityParticipants}>
        <div className={styles.sender}>
          <Avatar {...activity.performedBy} size="sm" />
          <span className={styles.participantLabel}>{activity.performedBy.name}</span>
        </div>
        <span className={styles.dateLabel}>{format(activity.createdAt, formatString)}</span>
      </div>
      <div className={styles.statusSection}>
        <div className={styles.activityContent}>
          <span className={styles.activityDescription}>{text}</span>
        </div>
      </div>
    </div>
  );
};
