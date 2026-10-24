import { DialogStatus, SystemLabel } from 'bff-types-generated';
import { dialogs as baseDialogs } from '../../base/dialogs';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const customDialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today83j1ks2',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-05-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `First test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'First test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today11111',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-01-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `Second test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Second test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today22222',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-02-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `Third test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Third test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today33333',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-03-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `Fourth test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Fourth test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today55555',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-05-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `Fifth test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Fifth test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-6f45-72fd-abcd-today66666',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-05-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `Sixth test message`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Sixth test message',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  }),
];

export const firstMsgId = customDialogs[0].id;

export const dialogs: MockDialog[] = [...customDialogs, ...baseDialogs];
