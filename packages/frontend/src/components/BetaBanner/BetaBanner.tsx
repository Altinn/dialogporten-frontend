import { Button } from '@digdir/designsystemet-react';
import { InformationSquareIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './betaBanner.module.css';

export const BetaBanner = () => {
  const betaBannerKey = 'arbeidsflate:show_beta_banner';
  const isPreviouslyDismissed = localStorage.getItem(betaBannerKey) === 'true';
  const [showBetaBanner, setShowBetaBanner] = useState<boolean>(!isPreviouslyDismissed);

  const { t } = useTranslation();

  const handleClick = () => {
    setShowBetaBanner(false);
    localStorage.setItem(betaBannerKey, 'true');
  };

  if (!showBetaBanner) {
    return null;
  }

  return (
    <section className={styles.betaBanner}>
      <div className={styles.betaBannerTitle}>
        <InformationSquareIcon className={styles.infoIcon} title={t('word.information')} />
        <span>
          Du ser nå på en beta-versjon av nye Altinn Innboks i et testmiljø. Alt innhold du ser her er basert på
          testdata og kun ment for demonstrasjon.
        </span>
      </div>
      <Button variant="tertiary" onClick={handleClick} type="button" className={styles.closeButton}>
        <XMarkIcon className={styles.closeIcon} aria-label={t('word.close')} />
      </Button>
    </section>
  );
};
