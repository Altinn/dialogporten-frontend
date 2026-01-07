import { DsAlert, DsParagraph, Heading } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../auth';
import { useAlertBanner } from '../../hooks/useAlertBanner.ts';

interface AlertBannerProps {
  showAlertBanner: boolean;
}

export const AlertBanner = ({ showAlertBanner }: AlertBannerProps) => {
  const { t } = useTranslation();
  const { currentPartyUuid } = useParties();
  const alertBannerContent = useAlertBanner();
  const linkUrl = alertBannerContent?.link?.url || createMessageBoxLink(currentPartyUuid);
  const linkText = alertBannerContent?.link?.text || t('inbox.historical_messages_date_warning_link');
  const isExternal = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');

  if (!showAlertBanner) {
    return null;
  }

  return (
    <DsAlert data-color="warning">
      <Heading data-size="xs">{alertBannerContent?.title || t('inbox.unable_to_load_parties.title')}</Heading>
      <DsParagraph>{alertBannerContent?.description || t('inbox.historical_messages_date_warning')}</DsParagraph>
      <DsParagraph>
        {isExternal ? (
          <a style={{ color: 'rgb(60, 40, 7)' }} href={linkUrl} target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        ) : (
          <Link style={{ color: 'rgb(60, 40, 7)' }} to={linkUrl}>
            {linkText}
          </Link>
        )}
      </DsParagraph>
    </DsAlert>
  );
};
