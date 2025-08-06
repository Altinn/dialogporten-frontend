import { Banner } from '@altinn/altinn-components';
import { Trans, useTranslation } from 'react-i18next';

export const BetaBanner = () => {
  const { t } = useTranslation();

  return (
    <Banner
      // biome-ignore lint/a11y/useValidAnchor:
      // biome-ignore lint/a11y/useAnchorContent:
      text={<Trans i18nKey="beta.banner" components={{ span: <span />, a: <a /> }} />}
      color="warning"
      closeTitle={t('word.close')}
      sticky={false}
    />
  );
};
