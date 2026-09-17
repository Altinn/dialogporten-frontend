import { describe, expect, it } from 'vitest';
import en from '../i18n/resources/en.json';
import nb from '../i18n/resources/nb.json';
import nn from '../i18n/resources/nn.json';
import { groupNotificationLogs, type NotificationLog } from './notificationLogs.tsx';

const log = (overrides: Partial<NotificationLog>): NotificationLog => ({
  notificationId: 'notification-1',
  dialogId: 'dialog-1',
  transmissionId: null,
  type: 'Notification',
  channel: 'Email',
  destination: 'kari@example.com',
  status: 'Delivered',
  requestedSendTime: '2024-08-24T14:54:53.511Z',
  lastUpdateTime: '2024-08-24T14:56:43.716Z',
  ...overrides,
});

const shownTypes = ['Notification', 'Reminder'];
const documentedChannels = ['Email', 'Sms'];

const resources: [string, Record<string, string>][] = [
  ['nb', nb],
  ['nn', nn],
  ['en', en],
];

describe('the vocabulary the BFF passes on has a label in every language', () => {
  it.each(resources)('%s labels every dispatch type that is shown', (_lang, resource) => {
    for (const type of shownTypes) {
      expect(resource).toHaveProperty(`notification_log.type.${type.toLowerCase()}`);
    }
  });

  it.each(resources)('%s labels every channel', (_lang, resource) => {
    for (const channel of documentedChannels) {
      expect(resource).toHaveProperty(`notification_log.channel.${channel.toLowerCase()}`);
    }
  });

  it.each(resources)('%s has a fallback for an unrecognised type and channel', (_lang, resource) => {
    for (const namespace of ['type', 'channel']) {
      expect(resource).toHaveProperty(`notification_log.${namespace}.unknown`);
    }
  });

  it.each(resources)('%s carries no labels for what the BFF filters out', (_lang, resource) => {
    const filteredOut = Object.keys(resource).filter(
      (key) =>
        key.startsWith('notification_log.status.') ||
        key === 'notification_log.type.composed' ||
        key === 'notification_log.type.instant',
    );

    expect(filteredOut).toEqual([]);
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

  it('keeps channels, types and transmissions apart', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1' }),
      log({ notificationId: '2', channel: 'Sms', destination: '+4799887766' }),
      log({ notificationId: '3', type: 'Reminder' }),
      log({ notificationId: '4', transmissionId: 'transmission-2' }),
    ]);

    expect(result).toHaveLength(4);
  });

  it('keeps entries of an unrecognised type instead of dropping a notification the user received', () => {
    const result = groupNotificationLogs([log({ notificationId: '1', type: 'SomethingNew' })]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('somethingnew');
  });

  it('drops entries that cannot be placed in a chronological log', () => {
    expect(groupNotificationLogs([log({ requestedSendTime: null, lastUpdateTime: null })])).toHaveLength(0);
  });

  it('groups on the requested send time but places the entry at the last delivery', () => {
    const result = groupNotificationLogs([
      log({ notificationId: '1', lastUpdateTime: '2024-08-24T14:56:43.716Z' }),
      log({ notificationId: '2', destination: 'per@example.com', lastUpdateTime: '2024-08-24T15:10:00.000Z' }),
      log({ notificationId: '3', destination: 'ola@example.com', lastUpdateTime: '2024-08-24T14:55:00.000Z' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-08-24T15:10:00.000Z');
  });

  it('keeps dispatches requested at different times apart even when delivered at the same time', () => {
    const result = groupNotificationLogs([
      log({
        notificationId: '1',
        requestedSendTime: '2024-08-24T14:50:00.000Z',
        lastUpdateTime: '2024-08-24T15:00:00.000Z',
      }),
      log({
        notificationId: '2',
        requestedSendTime: '2024-08-24T14:55:00.000Z',
        lastUpdateTime: '2024-08-24T15:00:00.000Z',
      }),
    ]);

    expect(result).toHaveLength(2);
  });

  it('falls back to the requested send time when no delivery time was reported', () => {
    const result = groupNotificationLogs([log({ lastUpdateTime: null })]);

    expect(result[0].date).toBe('2024-08-24T14:54:53.511Z');
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

  it('sorts entries with the latest delivery first, even when it was requested earlier', () => {
    const result = groupNotificationLogs([
      log({
        notificationId: '1',
        requestedSendTime: '2024-08-24T10:00:00.000Z',
        lastUpdateTime: '2024-08-24T12:00:00.000Z',
      }),
      log({
        notificationId: '2',
        requestedSendTime: '2024-08-24T11:00:00.000Z',
        lastUpdateTime: '2024-08-24T11:01:00.000Z',
      }),
      log({
        notificationId: '3',
        requestedSendTime: '2024-08-24T09:00:00.000Z',
        lastUpdateTime: '2024-08-24T09:01:00.000Z',
      }),
    ]);

    expect(result.map((group) => group.notificationIds[0])).toEqual(['1', '2', '3']);
  });
});
