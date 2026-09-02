import { describe, expect, it } from 'vitest';
import en from '../i18n/resources/en.json';
import nb from '../i18n/resources/nb.json';
import nn from '../i18n/resources/nn.json';
import { groupNotificationLogs, hiddenStatuses, type NotificationLog } from './notificationLogs.tsx';

const log = (overrides: Partial<NotificationLog>): NotificationLog => ({
  notificationId: 'notification-1',
  dialogId: 'dialog-1',
  transmissionId: null,
  type: 'Notification',
  channel: 'Email',
  destination: 'kari@example.com',
  status: 'Email_Delivered',
  requestedSendTime: '2024-08-24T14:54:53.511Z',
  lastUpdateTime: '2024-08-24T14:56:43.716Z',
  ...overrides,
});

const documentedTypes = ['Notification', 'Reminder', 'Instant', 'Composed'];
const documentedChannels = ['Email', 'Sms'];
const documentedStatuses = [
  'Email_New',
  'Email_Sending',
  'Email_Succeeded',
  'Email_Delivered',
  'Email_Failed',
  'Email_Failed_RecipientNotIdentified',
  'Email_Failed_InvalidFormat',
  'Email_Failed_RecipientReserved',
  'Email_Failed_SuppressedRecipient',
  'Email_Failed_TransientError',
  'Email_Failed_Bounced',
  'Email_Failed_FilteredSpam',
  'Email_Failed_Quarantined',
  'Email_Failed_TTL',
  'SMS_New',
  'SMS_Sending',
  'SMS_Accepted',
  'SMS_Delivered',
  'SMS_Failed',
  'SMS_Failed_InvalidRecipient',
  'SMS_Failed_RecipientReserved',
  'SMS_Failed_BarredReceiver',
  'SMS_Failed_Deleted',
  'SMS_Failed_Expired',
  'SMS_Failed_Undelivered',
  'SMS_Failed_RecipientNotIdentified',
  'SMS_Failed_Rejected',
  'SMS_Failed_TTL',
];

const unprefixed = (status: string) => status.replace(/^(Email|SMS)_/, '').toLowerCase();
const resources: [string, Record<string, string>][] = [
  ['nb', nb],
  ['nn', nn],
  ['en', en],
];

describe('the documented vocabulary has a label in every language', () => {
  it.each(resources)('%s labels every dispatch type', (_lang, resource) => {
    for (const type of documentedTypes) {
      expect(resource).toHaveProperty(`notification_log.type.${type.toLowerCase()}`);
    }
  });

  it.each(resources)('%s labels every channel', (_lang, resource) => {
    for (const channel of documentedChannels) {
      expect(resource).toHaveProperty(`notification_log.channel.${channel.toLowerCase()}`);
    }
  });

  it.each(resources)(
    '%s labels every status, prefixed as documented and bare as the log returns it',
    (_l, resource) => {
      for (const status of documentedStatuses) {
        expect(resource).toHaveProperty(`notification_log.status.${status.toLowerCase()}`);
        expect(resource).toHaveProperty(`notification_log.status.${unprefixed(status)}`);
      }
    },
  );

  it.each(resources)('%s has a fallback for an unrecognised value in every namespace', (_lang, resource) => {
    for (const namespace of ['type', 'channel', 'status']) {
      expect(resource).toHaveProperty(`notification_log.${namespace}.unknown`);
    }
  });

  it('covers the full documented surface', () => {
    expect(documentedTypes).toHaveLength(4);
    expect(documentedChannels).toHaveLength(2);
    expect(documentedStatuses).toHaveLength(28);
  });

  it('carries no status label outside the documented vocabulary', () => {
    const allowed = new Set([
      ...documentedStatuses.map((status) => status.toLowerCase()),
      ...documentedStatuses.map(unprefixed),
      'unknown',
    ]);
    const declared = Object.keys(nb)
      .filter((key) => key.startsWith('notification_log.status.'))
      .map((key) => key.replace('notification_log.status.', ''));

    expect(declared.filter((status) => !allowed.has(status))).toEqual([]);
  });

  it('keeps distinct failure reasons distinct rather than flattening them', () => {
    const byKey = (key: string) => (nb as Record<string, string>)[key];

    expect(byKey('notification_log.status.email_failed_bounced')).not.toBe(
      byKey('notification_log.status.email_failed_filteredspam'),
    );
    expect(byKey('notification_log.status.sms_failed_expired')).not.toBe(
      byKey('notification_log.status.sms_failed_ttl'),
    );
  });
});

describe('hiddenStatuses', () => {
  const inFlight = documentedStatuses.filter((status) => /_(New|Sending)$/.test(status));

  it.each(inFlight)('hides %s in both the prefixed and unprefixed form', (status) => {
    expect(hiddenStatuses.has(status.toLowerCase())).toBe(true);
    expect(hiddenStatuses.has(unprefixed(status))).toBe(true);
  });

  it('hides nothing beyond the statuses the reference documents as temporary', () => {
    const allowed = new Set([...inFlight.map((status) => status.toLowerCase()), ...inFlight.map(unprefixed)]);
    expect([...hiddenStatuses].filter((status) => !allowed.has(status))).toEqual([]);
  });

  it('hides nothing that has reached a final delivery result', () => {
    for (const status of ['email_delivered', 'sms_delivered', 'email_failed_bounced', 'sms_failed_ttl', 'delivered']) {
      expect(hiddenStatuses.has(status)).toBe(false);
    }
  });
});

describe('groupNotificationLogs', () => {
  it('correlates the same dispatch to several recipients into one entry', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1' }),
      log({ notificationId: '2', destination: 'per@example.com', lastUpdateTime: '2024-08-24T14:56:54.035Z' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].destinations).toEqual(['kari@example.com', 'per@example.com']);
    expect(result[0].notificationIds).toEqual(['1', '2']);
  });

  it('keeps channels, types, transmissions and outcomes apart', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1' }),
      log({ notificationId: '2', channel: 'Sms', destination: '+4799887766', status: 'SMS_Delivered' }),
      log({ notificationId: '3', type: 'Reminder' }),
      log({ notificationId: '4', transmissionId: 'transmission-2' }),
      log({ notificationId: '5', destination: 'per@example.com', status: 'Email_Failed_Bounced' }),
      log({ notificationId: '6', destination: 'ola@example.com', status: 'Email_Succeeded' }),
    ]);

    expect(result).toHaveLength(6);
  });

  it('keeps distinct failure reasons apart instead of merging them', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1', status: 'Email_Failed_Bounced' }),
      log({ notificationId: '2', destination: 'per@example.com', status: 'Email_Failed_FilteredSpam' }),
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((group) => group.status).sort()).toEqual(['email_failed_bounced', 'email_failed_filteredspam']);
  });

  it('keeps entries of an unrecognised type instead of dropping a notification the user received', () => {
    const result = groupNotificationLogs([log({ notificationId: '1', type: 'SomethingNew' })]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('somethingnew');
  });

  it('drops entries that cannot be placed in a chronological log', () => {
    expect(groupNotificationLogs([log({ requestedSendTime: null, lastUpdateTime: null })])).toHaveLength(0);
  });

  it('falls back to the last update time when no send time was reported', () => {
    const result = groupNotificationLogs([
      log({ requestedSendTime: null, lastUpdateTime: '2024-08-24T14:56:43.716Z' }),
    ]);

    expect(result[0].date).toBe('2024-08-24T14:56:43.716Z');
  });

  it('does not merge separate dispatches that both lack a send time', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1', requestedSendTime: null, lastUpdateTime: '2024-08-24T14:56:43.716Z' }),
      log({ notificationId: '2', requestedSendTime: null, lastUpdateTime: '2024-08-25T14:56:43.716Z' }),
    ]);

    expect(result).toHaveLength(2);
  });

  it('deduplicates a recipient that appears twice in the same dispatch', () => {
    const result = groupNotificationLogs([log({ notificationId: '1' }), log({ notificationId: '2' })]);

    expect(result[0].destinations).toEqual(['kari@example.com']);
  });

  it('sorts entries with the newest first', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1', requestedSendTime: '2024-08-24T14:54:53.511Z' }),
      log({ notificationId: '2', requestedSendTime: '2024-08-26T14:54:53.511Z' }),
      log({ notificationId: '3', requestedSendTime: '2024-08-25T14:54:53.511Z' }),
    ]);

    expect(result.map((group) => group.date)).toEqual([
      '2024-08-26T14:54:53.511Z',
      '2024-08-25T14:54:53.511Z',
      '2024-08-24T14:54:53.511Z',
    ]);
  });
});
