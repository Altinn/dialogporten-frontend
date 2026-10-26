import { DialogStatus, SystemLabel } from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

export const dialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-8218-7756-be82-123qwe456rty',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2023-12-04T11:45:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'This has no sender name defined',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Lorem ipsum dolor',
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
    id: '019241f7-6f45-72fd-a574-jksit83j1ks2',
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
            value: 'This has a sender name defined',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'sender name is defined',
            languageCode: 'nb',
          },
        ],
      },
      senderName: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'SENDER NAME Oslo Kommune',
            languageCode: 'nb',
          },
          {
            value: 'SENDER NAME Oslo Kommune ENG',
            languageCode: 'en',
          },
        ],
      },
      extendedStatus: null,
    },
  }),
];
