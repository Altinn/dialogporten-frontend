import { ActorType, DialogStatus, SystemLabel, TransmissionType } from 'bff-types-generated';
import { getMockedUnauthorizedFCEContent } from '../../base/helper.ts';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

export const dialogs: MockDialog[] = [
  mockDialog({
    id: '019a4e5f-6a7b-7c8d-9e0f-1a2b3c4d5e6f',
    org: 'skd',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-01T06:00:00.000Z',
    contentUpdatedAt: '2026-10-20T06:00:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Melding med innhold du ikke har tilgang til', languageCode: 'nb' },
          { value: 'Message with content you do not have access to', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Oppsummeringen vises, men hovedinnholdet er skjult.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    mainContentReference: getMockedUnauthorizedFCEContent(),
    transmissions: [
      {
        id: '019a4e5f-6a7b-7c8d-9e0f-000000000001',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-20T06:00:00.000Z',
        type: TransmissionType.Information,
        sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
        content: {
          title: {
            value: [{ value: 'Forsendelse med innhold du ikke har tilgang til', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: getMockedUnauthorizedFCEContent(),
        },
        attachments: [],
      },
    ],
  }),
];
