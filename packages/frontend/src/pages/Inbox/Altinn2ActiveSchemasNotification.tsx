import { NotificationItem } from '@altinn/altinn-components';
import { BellIcon } from '@navikt/aksel-icons';
import type { Altinn2Message } from 'bff-types-generated';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAltinn2Messages } from '../../api/hooks/useAltinn2Messages.tsx';
import { extractIdentifierNumber } from '../../components/PageLayout/mapPartyToAuthorizedParty.ts';

interface Altinn2ActiveSchemasNotificationProps {
  selectedAccountId?: string;
}

export const Altinn2ActiveSchemasNotification = ({ selectedAccountId }: Altinn2ActiveSchemasNotificationProps) => {
  const { t } = useTranslation();
  const selectedAccountIdentifier = extractIdentifierNumber(selectedAccountId);
  const { altinn2messages, isSuccess: altinn2messagesSuccess } = useAltinn2Messages(selectedAccountIdentifier);

  const mostRecentMessage = useMemo(() => {
    return altinn2messages?.reduce((latest: Altinn2Message | null, message: Altinn2Message | null) => {
      if (!message?.LastChangedDateTime || !latest?.LastChangedDateTime) {
        return latest;
      }
      const messageDate = new Date(message.LastChangedDateTime);
      const latestDate = new Date(latest?.LastChangedDateTime || '');
      return messageDate > latestDate ? message : latest;
    }, altinn2messages?.[0] || null);
  }, [altinn2messages]);

  if (!altinn2messagesSuccess || !altinn2messages || altinn2messages.length === 0 || !selectedAccountId) {
    return null;
  }

  const daysSinceMostRecentMessage = Math.floor(
    (Date.now() - new Date(mostRecentMessage?.LastChangedDateTime || '').getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceMostRecentMessage > 90) {
    return null;
  }

  return (
    <NotificationItem
      id="alert"
      as="a"
      href={mostRecentMessage?._links?.portalview?.href || ''}
      icon={BellIcon}
      iconBadge={{ label: t('inbox.old_inbox_notification.badge') }}
      title={t('inbox.old_inbox_notification')}
      description={t('inbox.old_inbox_notification.days_ago', { count: daysSinceMostRecentMessage })}
      variant="tinted"
    />
  );
};
