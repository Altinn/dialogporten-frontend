import { Heading, Typography } from '@altinn/altinn-components';
import { QuestionmarkCircleFillIcon } from '@navikt/aksel-icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { getInfoPortalLink } from '../../auth';
import styles from './dialogHelp.module.css';

export const DialogHelp = (): ReactElement => {
  const { t, i18n } = useTranslation();

  return (
    <section className={styles.section}>
      <Heading size="lg">{t('dialog.help.title')}</Heading>
      <Typography size="sm">
        <a href={getInfoPortalLink('inboxHelp', i18n.language)} className={styles.helpLink}>
          <QuestionmarkCircleFillIcon className={styles.helpIcon} />
          {t('dialog.help.understand_link')}
        </a>
      </Typography>
    </section>
  );
};
