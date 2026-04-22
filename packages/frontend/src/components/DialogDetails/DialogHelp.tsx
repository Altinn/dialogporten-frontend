import { Heading, Typography } from '@altinn/altinn-components';
import { QuestionmarkCircleFillIcon } from '@navikt/aksel-icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DialogHelp.module.css';

export const DialogHelp = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <Heading size="lg">{t('dialog.help.title')}</Heading>
      <Typography size="sm">
        <a href="https://info.altinn.no/hjelp/ny-innboks-beta/" className={styles.helpLink}>
          <QuestionmarkCircleFillIcon className={styles.helpIcon} />
          {t('dialog.help.understand_link')}
        </a>
      </Typography>
    </section>
  );
};
