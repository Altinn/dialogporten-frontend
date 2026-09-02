import type { ActivityLogItemProps } from '@altinn/altinn-components';
import type { NotificationLogsQuery } from 'bff-types-generated';
import i18n, { t } from 'i18next';
import type { FormatFunction, Locale } from '../i18n/useDateFnsLocale.tsx';

export type NotificationLog = NonNullable<NonNullable<NotificationLogsQuery['notificationLogs']>[number]>;

export interface NotificationLogGroup {
  id: string;
  type: string;
  status: string;
  channel: string;
  transmissionId?: string | null;
  date: string;
  destinations: string[];
  notificationIds: string[];
}

export interface NotificationLogEntry {
  id: string;
  date: string;
  items: ActivityLogItemProps[];
}

export const hiddenStatuses: ReadonlySet<string> = new Set([
  'email_new',
  'email_sending',
  'sms_new',
  'sms_sending',
  'new',
  'sending',
]);

const normalize = (value?: string | null): string => (value ?? '').trim().toLowerCase();

export const labelFor = (namespace: 'type' | 'channel' | 'status', value: string): string => {
  const key = `notification_log.${namespace}.${value}`;
  return i18n.exists(key) ? t(key) : t(`notification_log.${namespace}.unknown`);
};

const maxListedRecipients = 3;

const formatList = (destinations: string[], locale: Locale): string => {
  try {
    return new Intl.ListFormat(locale.code, { style: 'long', type: 'conjunction' }).format(destinations);
  } catch {
    return destinations.join(', ');
  }
};

const formatRecipients = (destinations: string[], locale: Locale): string => {
  if (destinations.length === 0) return t('notification_log.recipient.unknown');
  if (destinations.length <= maxListedRecipients) return formatList(destinations, locale);
  return t('notification_log.recipient.overflow', {
    recipients: destinations.slice(0, maxListedRecipients).join(', '),
    count: destinations.length - maxListedRecipients,
  });
};

export const groupNotificationLogs = (notificationLogs: NotificationLog[]): NotificationLogGroup[] => {
  const groups = new Map<string, NotificationLogGroup>();

  for (const log of notificationLogs) {
    const date = log.requestedSendTime ?? log.lastUpdateTime;
    if (!date) continue;

    const type = normalize(log.type);
    const channel = normalize(log.channel);
    const status = normalize(log.status);
    const key = [type, status, channel, log.transmissionId ?? '', date].join('|');
    const existing = groups.get(key);

    if (existing) {
      if (log.destination && !existing.destinations.includes(log.destination)) {
        existing.destinations.push(log.destination);
      }
      if (log.notificationId) existing.notificationIds.push(log.notificationId);
      continue;
    }

    groups.set(key, {
      id: `notification-log-${log.notificationId ?? key}`,
      type,
      status,
      channel,
      transmissionId: log.transmissionId,
      date,
      destinations: log.destination ? [log.destination] : [],
      notificationIds: log.notificationId ? [log.notificationId] : [],
    });
  }

  return [...groups.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getNotificationLogEntries = ({
  notificationLogs,
  format,
  locale,
}: {
  notificationLogs: NotificationLog[];
  format: FormatFunction;
  locale: Locale;
}): NotificationLogEntry[] => {
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;

  return groupNotificationLogs(notificationLogs)
    .filter((group) => !hiddenStatuses.has(group.status))
    .map((group) => {
      const summary = (
        <>
          {t('notification_log.summary', {
            type: labelFor('type', group.type),
            channel: labelFor('channel', group.channel),
            status: labelFor('status', group.status),
            recipients: <strong key={group.id}>{formatRecipients(group.destinations, locale)}</strong>,
          })}
        </>
      );

      return {
        id: group.id,
        date: group.date,
        items: [
          {
            id: group.id,
            summary,
            byline: format(group.date, formatString),
            datetime: group.date,
          },
        ],
      };
    });
};
