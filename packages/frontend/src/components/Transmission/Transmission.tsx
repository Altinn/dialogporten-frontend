import { Avatar } from '@altinn/altinn-components';
import type { DialogTransmission } from '../../api/useDialogById.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';

import { Link } from '@digdir/designsystemet-react';
import { FileIcon } from '@navikt/aksel-icons';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import styles from './transmission.module.css';

interface TransmissionProps {
  transmission: DialogTransmission;
}

const getTransmissionText = (transmission: DialogTransmission) => {
  switch (transmission.type) {
    case 'INFORMATION':
      return t('transmission.type.information');
    case 'ACCEPTANCE':
      return t('transmission.type.acceptance');
    case 'REJECTION':
      return t('transmission.type.rejection');
    case 'REQUEST':
      return t('transmission.type.request');
    case 'ALERT':
      return t('transmission.type.alert');
    case 'DECISION':
      return t('transmission.type.decision');
    case 'SUBMISSION':
      return t('transmission.type.submission');
    case 'CORRECTION':
      return t('transmission.type.correction');
    default:
      return transmission.type;
  }
};

export const Transmission = ({ transmission }: TransmissionProps) => {
  const format = useFormat();
  const transmissionType = 'Type: ' + getTransmissionText(transmission);
  const clockPrefix = t('word.clock_prefix');
  const formatString = clockPrefix ? `do MMMM yyyy '${clockPrefix}' HH.mm` : `do MMMM yyyy HH.mm`;
  const { attachments } = transmission;
  const attachmentCount = attachments.length;
  const title = transmission.title ?? '';
  const summary = transmission.summary ?? '';

  return (
    <div key={transmission.id}>
      <div className={styles.transmissionParticipants}>
        <div className={styles.sender}>
          <Avatar {...transmission.sender} size="sm" />
          <span className={styles.participantLabel}>{transmission.sender.name}</span>
        </div>
        <span className={styles.dateLabel}>{format(transmission.createdAt, formatString)}</span>
      </div>
      <div className={styles.statusSection}>
        <header className={styles.header} data-id="dialog-header">
          <h1 className={styles.title}>{title}</h1>
        </header>
        <div className={styles.transmissionContent}>
          <i className={styles.transmissionDescription}>{transmissionType}</i>
          <section className={styles.summarySection}>
            <p className={styles.summary}>{summary}</p>
          </section>
        </div>
        <section data-id="transmission-attachments">
          {attachmentCount > 0 && (
            <h2 className={styles.attachmentTitle}>{t('inbox.heading.attachments', { count: attachmentCount })}</h2>
          )}
          <ul className={styles.attachments} data-id="transmission-attachments-list">
            {attachments.map((attachment) =>
              attachment.urls.map((url) => (
                <li key={url.id} className={styles.attachmentItem}>
                  <Link
                    target="_blank"
                    href={url.url}
                    aria-label={t('inbox.attachment.link', {
                      label: url.url,
                    })}
                  >
                    <FileIcon className={styles.attachmentIcon} />
                    {getPreferredPropertyByLocale(attachment.displayName)?.value || url.url}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      </div>
    </div>
  );
};
