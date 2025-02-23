import { EyeIcon, PaperclipIcon } from '@navikt/aksel-icons';
import type { ReactElement } from 'react';
import type { InboxItemMetaFieldType } from './MetaDataFields.tsx';
import styles from './metaField.module.css';

interface MetaFieldProps {
  label: string;
  toolTip?: string;
  type?: InboxItemMetaFieldType;
}

const getIconByType = (type?: InboxItemMetaFieldType): ReactElement | null => {
  switch (type) {
    case 'attachment':
      return <PaperclipIcon className={styles.metaIcon} />;
    case 'seenBy':
      return <EyeIcon className={styles.metaIcon} />;
    default:
      return null;
  }
};

export const MetaField = ({ toolTip, type, label }: MetaFieldProps) => {
  const icon = getIconByType(type);
  return (
    <div className={styles.metaField} title={toolTip}>
      {icon}
      <span className={styles.metaLabel}>{label}</span>
    </div>
  );
};
