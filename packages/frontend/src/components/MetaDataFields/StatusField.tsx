import cx from 'classnames';
import type { ReactElement } from 'react';
import { CompletedIcon } from '../Icons';
import { SentIcon } from '../Icons/SentIcon';
import { LoadingCircle } from '../LoadingCircle/LoadingCircle.tsx';
import type { InboxItemMetaFieldType } from './MetaDataFields.tsx';
import styles from './statusField.module.css';

const getIconByType = (type?: InboxItemMetaFieldType): ReactElement | null => {
  switch (type) {
    case 'status_IN_PROGRESS':
      return <LoadingCircle percentage={75} />;
    case 'status_SENT':
      return <SentIcon className={styles.sentIcon} />;
    case 'status_COMPLETED':
      return <CompletedIcon className={styles.completedIcon} />;
    default:
      return null;
  }
};

export const StatusField = ({
  label,
  status,
}: { label: string; status: InboxItemMetaFieldType; icon?: React.ReactNode }) => {
  const icon = getIconByType(status);
  return (
    <div
      className={cx(styles.statusField, {
        [styles.statusFieldCompleted]: status === 'status_COMPLETED',
        [styles.statusFieldSent]: status === 'status_SENT',
        [styles.statusFieldInProgress]: status === 'status_IN_PROGRESS',
        [styles.statusFieldDraft]: status === 'status_DRAFT',
        [styles.statusFieldRequiresAttention]: status === 'status_REQUIRES_ATTENTION',
      })}
    >
      {icon && <div className={styles.statusIcon}>{icon}</div>}
      <span className={styles.statusLabel}>{label}</span>
    </div>
  );
};
