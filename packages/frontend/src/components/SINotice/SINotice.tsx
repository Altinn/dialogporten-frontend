import { Alert } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../api/hooks/useParties.ts';
import { getAlternativeLoginLink } from '../../auth';

export const SINotice = () => {
  const { t, i18n } = useTranslation();
  const { currentPartyUuid, selfIdentifiedUserType } = useParties();
  switch (selfIdentifiedUserType) {
    case 'Email':
      return (
        <Alert variant="info" heading={t('inbox.si_notice.email.title')}>
          {t('inbox.si_notice.email.body')}
          <p>
            <a href={getAlternativeLoginLink(i18n.language, currentPartyUuid)}>
              {t('inbox.si_notice.email.link_text')}
            </a>
          </p>
        </Alert>
      );
    case 'Legacy':
      return (
        <Alert variant="info" heading={t('inbox.si_notice.legacy.title')}>
          <p>
            <a href={getAlternativeLoginLink(i18n.language, currentPartyUuid)}>
              {t('inbox.si_notice.legacy.link_text')}
            </a>
          </p>
        </Alert>
      );
    default:
      return null;
  }
};
