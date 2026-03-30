import { Alert, Flex } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useCurrentPartyUuid, useSelfIdentifiedUserType } from '../../api/hooks/usePartiesSelectors.ts';
import { getAlternativeLoginLink } from '../../auth';

export const SINotice = () => {
  const { t, i18n } = useTranslation();
  const currentPartyUuid = useCurrentPartyUuid();
  const selfIdentifiedUserType = useSelfIdentifiedUserType();
  switch (selfIdentifiedUserType) {
    case 'Email':
      return (
        <Alert variant="info" heading={t('inbox.si_notice.email.title')}>
          <Flex direction="col">
            {t('inbox.si_notice.email.body')}
            <a href={getAlternativeLoginLink(i18n.language, currentPartyUuid)}>
              {t('inbox.si_notice.email.link_text')}
            </a>
          </Flex>
        </Alert>
      );
    case 'Legacy':
      return (
        <Alert variant="info" heading={t('inbox.si_notice.legacy.title')}>
          <a href={getAlternativeLoginLink(i18n.language, currentPartyUuid)}>{t('inbox.si_notice.legacy.link_text')}</a>
        </Alert>
      );
    default:
      return null;
  }
};
