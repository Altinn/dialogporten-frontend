import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogStatus,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const sharedActivityAndTransmissionId = '019d0153-2419-772a-a90c-dabeb1e10337';

const testDriverActor = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:9587188c95',
  actorName: 'NITROGEN LEKKER',
};

const filedBy = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:8c64174ef5',
  actorName: 'NITROGEN LEKKER',
};

export const dialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'urn:altinn:resource:app_ttd_testdriver-for-arbeidsflate',
    serviceResourceType: 'altinnapp',
    id: '019d0152-d7f9-7050-bac9-b8b52cdb4db8',
    endUserContext: {
      systemLabels: [SystemLabel.Archive, SystemLabel.Sent],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ttd',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2026-03-18T14:22:05.085744Z',
    status: DialogStatus.Awaiting,
    createdAt: '2026-03-18T14:21:39.705511Z',
    dueAt: null,
    seenSinceLastContentUpdate: [
      {
        id: '019d0153-455d-7134-8039-680969f032fa',
        seenAt: '2026-03-18T14:22:07.709298Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:9587188c95',
          actorName: 'NITROGEN LEKKER',
        },
        isCurrentEndUser: true,
      },
    ],
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Dialog title of the test driver', languageCode: 'en' },
          { value: 'Testdriverens dialogtittel', languageCode: 'nb' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'The submission has been automatically checked and forwarded, awaiting final confirmation.',
            languageCode: 'en',
          },
          {
            value: 'Innsendingen er maskinelt kontrollert og formidlet, venter på endelig bekreftelse.',
            languageCode: 'nb',
          },
          {
            value: 'Innsendinga er maskinelt kontrollert og formidla, ventar på endeleg stadfesting.',
            languageCode: 'nn',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    activities: [
      {
        id: '019d0152-d7fd-7fab-b832-c7a0c7a765a3',
        transmissionId: null,
        performedBy: testDriverActor,
        description: [],
        type: ActivityType.DialogCreated,
        createdAt: '2026-03-18T14:21:39.709364Z',
      },
      {
        id: '019d0152-ec81-79d1-8dc7-9b58a4aa878d',
        transmissionId: null,
        performedBy: testDriverActor,
        description: [],
        type: ActivityType.FormSaved,
        createdAt: '2026-03-18T14:21:58.175513Z',
      },
      {
        id: sharedActivityAndTransmissionId,
        transmissionId: null,
        performedBy: testDriverActor,
        description: [],
        type: ActivityType.FormSubmitted,
        createdAt: '2026-03-18T14:21:59.19374Z',
      },
    ],
    transmissions: [
      {
        id: sharedActivityAndTransmissionId,
        isAuthorized: true,
        createdAt: '2026-03-18T14:21:59.19374Z',
        type: TransmissionType.Submission,
        sender: testDriverActor,
        relatedTransmissionId: null,
        content: {
          title: {
            value: [
              { value: 'Submission #1', languageCode: 'en' },
              { value: 'Innsending #1', languageCode: 'nb' },
              { value: 'Innsending #1', languageCode: 'nn' },
            ],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: null,
        },
        attachments: [
          {
            id: '019d0153-2419-74e9-a9fb-a03de5669849',
            displayName: [{ value: 'Testdriver for Arbeidsflate - English variation.pdf', languageCode: 'nb' }],
            expiresAt: null,
            urls: [
              {
                id: '019d0153-3b1e-7328-b017-40210770a19c',
                url: 'https://info.altinn.no/om-altinn/',
                consumerType: AttachmentUrlConsumer.Gui,
                mediaType: 'application/pdf',
              },
            ],
          },
          {
            id: '019d0153-2419-7563-8d94-f91b1679ebc0',
            displayName: [{ value: 'model', languageCode: 'nb' }],
            expiresAt: null,
            urls: [
              {
                id: '019d0153-3b1e-7328-b006-a9d66eaf69cd',
                url: 'https://info.altinn.no/om-altinn/',
                consumerType: AttachmentUrlConsumer.Api,
                mediaType: 'application/xml',
              },
            ],
          },
        ],
      },
    ],
    labelAssignmentLog: [
      {
        name: 'systemlabel:Sent',
        action: 'set',
        createdAt: '2026-03-18T14:22:05.085744Z',
        performedBy: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      },
      { name: 'systemlabel:Bin', action: 'set', createdAt: '2026-03-18T14:22:12.963361Z', performedBy: filedBy },
      { name: 'systemlabel:Archive', action: 'set', createdAt: '2026-05-29T08:30:59.312424Z', performedBy: filedBy },
      { name: 'systemlabel:Bin', action: 'remove', createdAt: '2026-05-29T08:30:59.312424Z', performedBy: filedBy },
    ],
  }),
];
