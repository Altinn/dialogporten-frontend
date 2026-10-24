import { ActorType, DialogStatus, SystemLabel, TransmissionType } from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

// Preview at: ?mock=true&playwrightId=transmissions-without-activities
export const dialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-8218-7756-be82-noactivities',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
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
            value: 'Dialog uten aktivitetslogg',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Denne dialogen har forsendelser, men ingen aktiviteter.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    activities: [],
    transmissions: [
      {
        id: 'transmission-from-agency',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2024-07-30T18:12:54.233Z',
        type: TransmissionType.Information,
        sender: {
          actorType: ActorType.ServiceOwner,
          actorId: null,
          actorName: null,
        },
        content: {
          title: {
            value: [{ value: 'Melding fra etaten', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: {
            value: [{ value: 'Vi trenger noen opplysninger fra deg.', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          contentReference: null,
        },
        attachments: [],
      },
      {
        id: 'transmission-own-reply',
        relatedTransmissionId: 'transmission-from-agency',
        isAuthorized: true,
        createdAt: '2024-07-31T18:12:54.233Z',
        type: TransmissionType.Submission,
        sender: {
          actorType: ActorType.PartyRepresentative,
          actorId: null,
          actorName: 'NORDMANN KARI',
        },
        content: {
          title: {
            value: [{ value: 'Mitt svar til etaten', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: {
            value: [{ value: 'Opplysningene stemmer.', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          contentReference: null,
        },
        attachments: [],
      },
    ],
  }),
];
