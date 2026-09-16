import { describe, expect, it } from 'vitest';
import { filterNotificationLogs } from '../src/graphql/notifications/notificationLogs.ts';

const log = (type: string, status: string, channel = 'Email') => ({
  notificationId: `${type}-${status}-${channel}`,
  dialogId: 'dialog-1',
  transmissionId: null,
  type,
  channel,
  destination: 'kari@example.com',
  status,
  requestedSendTime: '2026-08-05T10:00:00Z',
  lastUpdateTime: '2026-08-05T10:02:30Z',
});

describe('filterNotificationLogs', () => {
  it('keeps delivered notifications on both channels', () => {
    const logs = [log('Notification', 'Delivered'), log('Notification', 'Delivered', 'Sms')];

    expect(filterNotificationLogs(logs)).toEqual(logs);
  });

  it.each(['Composed', 'Instant', 'COMPOSED', 'INSTANT'])('drops %s dispatches even when delivered', (type) => {
    expect(filterNotificationLogs([log(type, 'Delivered')])).toEqual([]);
  });

  it.each(['New', 'Sending', 'Succeeded', 'Accepted', 'Failed', 'Failed_Bounced', 'Failed_TTL', ''])(
    'drops a notification with status %s',
    (status) => {
      expect(filterNotificationLogs([log('Notification', status)])).toEqual([]);
    },
  );

  it('keeps reminders and types it does not recognise', () => {
    const logs = [log('Reminder', 'Delivered'), log('SomethingNew', 'Delivered')];

    expect(filterNotificationLogs(logs)).toEqual(logs);
  });

  it('returns an empty list when upstream does not return a list', () => {
    expect(filterNotificationLogs(undefined)).toEqual([]);
    expect(filterNotificationLogs({ notificationId: '1' })).toEqual([]);
    expect(filterNotificationLogs([null])).toEqual([]);
  });
});
