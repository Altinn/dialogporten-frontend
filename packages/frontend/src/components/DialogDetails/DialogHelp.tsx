import { Button, ButtonGroup, type ContactButtonProps, Heading, Typography } from '@altinn/altinn-components';
import { QuestionmarkCircleFillIcon } from '@navikt/aksel-icons';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DialogHelp.module.css';

interface DialogHelpProps {
  contactButtons?: ContactButtonProps[];
}

export const DialogHelp = ({ contactButtons }: DialogHelpProps): ReactElement => {
  const { t } = useTranslation();

  const hasContactButtons = contactButtons && contactButtons.length > 0;

  return (
    <section className={styles.section}>
      <Heading size="lg">{t('dialog.help.title')}</Heading>
      {hasContactButtons && (
        <>
          <Typography size="sm">
            <p>{t('dialog.help.description')}</p>
          </Typography>
          <ButtonGroup>
            {contactButtons.map((btn) => (
              //@ts-expect-error target is not in Button props but is valid for anchor elements
              <Button key={btn.href} as="a" href={btn.href} target="_blank" rel="noreferrer" variant="outline">
                {btn.label}
              </Button>
            ))}
          </ButtonGroup>
        </>
      )}

      <Typography size="sm">
        <a href="https://info.altinn.no/hjelp/ny-innboks-beta/" className={styles.helpLink}>
          <QuestionmarkCircleFillIcon className={styles.helpIcon} />
          {t('dialog.help.understand_link')}
        </a>
      </Typography>
    </section>
  );
};
