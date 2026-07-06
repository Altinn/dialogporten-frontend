import { Alert, NotificationItem } from '@altinn/altinn-components';
import { PersonCircleIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelfIdentifiedUserType } from '../../api/hooks/usePartiesSelectors.ts';
import { getAlternativeLoginLink, getAltinn2AccountLink } from '../../auth';

const SI_NOTICE_DISMISSED_KEY = 'si-notice:email-connect:dismissed';

export const SINotice = () => {
  const { t, i18n } = useTranslation();
  const selfIdentifiedUserType = useSelfIdentifiedUserType();
  const [dismissed, setDismissed] = useState<boolean>(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SI_NOTICE_DISMISSED_KEY) === 'true',
  );

  const handleDismiss = () => {
    window.localStorage.setItem(SI_NOTICE_DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  switch (selfIdentifiedUserType) {
    case 'Email':
      if (dismissed) return null;
      return (
        <NotificationItem
          id="si-banner-warning"
          as="a"
          href={getAltinn2AccountLink()}
          icon={PersonCircleIcon}
          title={t('inbox.si_notice.email.title')}
          description={t('inbox.si_notice.add_account.description')}
          variant="tinted"
          dismissable
          onDismiss={handleDismiss}
        />
      );
    case 'Legacy':
      return (
        <Alert variant="info" heading={t('inbox.si_notice.legacy.title')}>
          <a href={getAlternativeLoginLink(i18n.language)}>{t('inbox.si_notice.legacy.link_text')}</a>
        </Alert>
      );
    default:
      return null;
  }
};
