import { Banner } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const BetaBanner = () => {
  const betaBannerKey = 'arbeidsflate:show_beta_banner';
  const isPreviouslyDismissed = localStorage.getItem(betaBannerKey) === 'true';
  const [showBetaBanner, setShowBetaBanner] = useState<boolean>(!isPreviouslyDismissed);

  const { t } = useTranslation();

  const onClose = () => {
    setShowBetaBanner(false);
    localStorage.setItem(betaBannerKey, 'true');
  };

  if (!showBetaBanner) {
    return null;
  }

  return (
    <Banner
      onClose={onClose}
      text="Du ser nå på en beta-versjon av nye Altinn Innboks i et testmiljø. Alt innhold du ser her er basert på
          testdata og kun ment for demonstrasjon."
      color="warning"
      closeTitle={t('word.close')}
    />
  );
};
