import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogStatus,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import {
  getMockedFCEContent,
  getMockedHTMLFCEContent,
  getMockedLocalizedMarkdownFCEContent,
  getMockedUnauthorizedFCEContent,
} from '../../base/helper.ts';
import { type MockDialog, mockDialog, mockNotificationLog } from '../../base/mockDialog.ts';

const serviceOwnerActor = {
  actorType: ActorType.ServiceOwner,
  actorId: 'actor-01',
  actorName: 'Skatteetaten',
};

const partyActor = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
  actorName: 'NORDMANN KARI',
};

const otherPartyActor = {
  actorType: ActorType.PartyRepresentative,
  actorId: 'urn:altinn:person:identifier-ephemeral:9c11de772a',
  actorName: 'NORDMANN PER',
};

const labelAssignmentActors: Record<string, string> = {
  'SØSTER FANTASIFULL 2024': 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
  'NORDMANN OLA': 'urn:altinn:person:identifier-ephemeral:7f1c9d2e04',
};

const labelAssignmentPartyRepresentative = (
  name: string,
  action: string,
  createdAt: string,
  actorName = 'SØSTER FANTASIFULL 2024',
) => ({
  name,
  action,
  createdAt,
  performedBy: {
    actorType: ActorType.PartyRepresentative,
    actorId: labelAssignmentActors[actorName],
    actorName,
  },
});

const labelAssignmentServiceOwner = (name: string, action: string, createdAt: string) => ({
  name,
  action,
  createdAt,
  performedBy: {
    actorType: ActorType.ServiceOwner,
    actorId: null,
    actorName: null,
  },
});

export const dialogWithTransmissions = mockDialog({
  hasUnopenedContent: false,
  serviceResource: 'default',
  serviceResourceType: 'correspondenceservice',
  seenSinceLastContentUpdate: [],
  id: '019241f7-8218-7756-be82-123qwe456rtA',
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
  activities: [
    {
      id: 'activity-dialog-created',
      performedBy: serviceOwnerActor,
      description: [],
      type: ActivityType.DialogCreated,
      createdAt: '2024-05-23T23:00:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-information-sent',
      performedBy: serviceOwnerActor,
      description: [
        {
          value: 'Meldingen ble sendt.',
          languageCode: 'nb',
        },
      ],
      type: ActivityType.Information,
      createdAt: '2024-07-30T18:12:54.233Z',
      transmissionId: null,
    },
    {
      id: 'activity-dialog-opened',
      performedBy: partyActor,
      description: [],
      type: ActivityType.DialogOpened,
      createdAt: '2024-07-31T09:15:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-information-opened',
      performedBy: serviceOwnerActor,
      description: [
        {
          value: 'Meldingen ble åpnet.',
          languageCode: 'nb',
        },
      ],
      type: ActivityType.Information,
      createdAt: '2024-07-31T09:16:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-transmission-opened',
      performedBy: partyActor,
      transmissionId: 'transmission-2',
      type: ActivityType.TransmissionOpened,
      description: [],
      createdAt: '2024-07-31T18:20:00.000Z',
    },
    {
      id: 'activity-sent-to-form-fill',
      performedBy: serviceOwnerActor,
      description: [],
      type: ActivityType.SentToFormFill,
      createdAt: '2024-08-13T12:00:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-form-saved',
      performedBy: otherPartyActor,
      description: [],
      type: ActivityType.FormSaved,
      createdAt: '2024-08-13T12:13:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-form-submitted',
      performedBy: otherPartyActor,
      description: [],
      type: ActivityType.FormSubmitted,
      createdAt: '2024-08-13T12:20:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-sent-to-signing',
      performedBy: serviceOwnerActor,
      description: [],
      type: ActivityType.SentToSigning,
      createdAt: '2024-08-14T08:00:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-signature-provided',
      performedBy: partyActor,
      description: [],
      type: ActivityType.SignatureProvided,
      createdAt: '2024-08-14T09:30:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-sent-to-payment',
      performedBy: serviceOwnerActor,
      description: [],
      type: ActivityType.SentToPayment,
      createdAt: '2024-08-15T10:00:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-payment-made',
      performedBy: partyActor,
      description: [],
      type: ActivityType.PaymentMade,
      createdAt: '2024-08-15T10:45:00.000Z',
      transmissionId: null,
    },
    {
      id: 'activity-information-expired',
      performedBy: serviceOwnerActor,
      description: [
        {
          value: 'Denne meldingen er utløpt.',
          languageCode: 'nb',
        },
      ],
      type: ActivityType.Information,
      createdAt: '2024-11-27T15:36:52.131Z',
      transmissionId: null,
    },
  ],
  transmissions: [
    {
      id: 'transmission-1',
      relatedTransmissionId: null,
      createdAt: '2024-07-30T18:12:54.233Z',
      isAuthorized: true,
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.ServiceOwner,
        actorId: null,
        actorName: null,
      },
      content: {
        title: {
          value: [
            {
              value: 'Tittel',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        summary: {
          value: [
            {
              value: 'Oppsummering',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedLocalizedMarkdownFCEContent('transmission-1'),
      },
      attachments: [],
    },
    {
      id: 'transmission-2',
      relatedTransmissionId: 'transmission-1',
      isAuthorized: true,
      createdAt: '2024-07-31T18:12:54.233Z',
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'NORDMANN KARI',
      },
      content: {
        title: {
          value: [
            {
              value: 'Tittel 2',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/pla  in',
        },
        summary: {
          value: [
            {
              value: 'Oppsummering 2',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedFCEContent('transmission-2'),
      },
      attachments: [],
    },
    {
      id: 'transmission-3',
      relatedTransmissionId: null,
      createdAt: '2024-07-31T18:12:54.233Z',
      isAuthorized: false,
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'NORDMANN PER',
      },
      content: {
        title: {
          value: [
            {
              value: 'Tittel 3',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedUnauthorizedFCEContent(),
        summary: {
          value: [
            {
              value: 'Oppsummering 3',
              languageCode: 'n  b',
            },
          ],
          mediaType: 'text/plain',
        },
      },
      attachments: [],
    },
    {
      id: 'transmission-999',
      relatedTransmissionId: null,
      createdAt: '2024-07-31T11:12:54.233Z',
      isAuthorized: true,
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'NORDMANN PER',
      },
      content: {
        title: {
          value: [
            {
              value: 'Inneholder HTML',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedHTMLFCEContent('HTML'),
        summary: {
          value: [
            {
              value: 'Oppsummering HTML',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
      },
      attachments: [],
    },
    {
      id: 'transmission-4',
      relatedTransmissionId: 'transmission-2',
      isAuthorized: true,
      createdAt: '2024-08-13T12:12:54.233Z',
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'NORDMANN PER',
      },
      content: {
        title: {
          value: [
            {
              value: 'Tittel 4',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedFCEContent('transmission-4'),
        summary: {
          value: [
            {
              value: 'Oppsummering 4',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
      },
      attachments: [],
    },
    {
      id: 'transmission-system',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-13T12:12:54.233Z',
      type: TransmissionType.Information,
      sender: {
        actorType: ActorType.PartyRepresentative,
        actorId: 'urn:altinn:systemuser:uuid:321',
        actorName: 'SKEPTISK KOMMUNE',
      },
      content: {
        title: {
          value: [
            {
              value: 'Sendt inn av systembruker',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: {
          value: [
            {
              value: 'Oppsummering 4',
              languageCode: 'nb',
            },
          ],
          mediaType: 'text/plain',
        },
      },
      attachments: [],
    },
    // Case 1: isAuthorized=false + API-only attachment → A: filter
    {
      id: 'case1-filter-unauthorized-api',
      relatedTransmissionId: null,
      isAuthorized: false,
      createdAt: '2024-08-15T01:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 1: filtreres (isAuthorized=false, kun API-vedlegg)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: null,
      },
      attachments: [
        {
          id: 'case1-attachment',
          displayName: [{ value: 'API data', languageCode: 'nb' }],
          expiresAt: null,
          urls: [
            {
              id: 'case1-url',
              url: 'https://api.example.com/data',
              consumerType: AttachmentUrlConsumer.Api,
              mediaType: 'application/json',
            },
          ],
        },
      ],
    },
    // Case 2: isAuthorized=false + has GUI attachment → B: disabled
    {
      id: 'case2-disabled-unauthorized-gui',
      relatedTransmissionId: null,
      isAuthorized: false,
      createdAt: '2024-08-15T02:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 2: deaktiveres (isAuthorized=false, GUI-vedlegg)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: null,
      },
      attachments: [
        {
          id: 'case2-attachment',
          displayName: [{ value: 'Dokument', languageCode: 'nb' }],
          expiresAt: null,
          urls: [
            {
              id: 'case2-url',
              url: 'https://gui.example.com/dokument.pdf',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    },
    // Case 3: isAuthorized=true + API-only attachment → A: filter
    {
      id: 'case3-filter-authorized-api',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-15T03:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 3: filtreres (isAuthorized=true, kun API-vedlegg)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: null,
      },
      attachments: [
        {
          id: 'case3-attachment',
          displayName: [{ value: 'API data', languageCode: 'nb' }],
          expiresAt: null,
          urls: [
            {
              id: 'case3-url',
              url: 'https://api.example.com/data',
              consumerType: AttachmentUrlConsumer.Api,
              mediaType: 'application/json',
            },
          ],
        },
      ],
    },
    // Case 4: isAuthorized=true + visible content → visible
    {
      id: 'case4-visible',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-15T04:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 4: vises (isAuthorized=true, innhold finnes)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: {
          value: [{ value: 'Dette er synlig innhold for sluttbruker.', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
      },
      attachments: [],
    },
    // Case 5: isAuthorized=true + no visible content → C: show empty message
    {
      id: 'case5-empty',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-15T05:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 5: tom melding (isAuthorized=true, ingen innhold)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: null,
      },
      attachments: [],
    },
    // Case 6: isAuthorized=true + only a GUI link with isAuthorized=false (sentinel URL) → shows disabled link
    {
      id: 'case6-unauthorized-link',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-15T06:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 6: deaktivert lenke (isAuthorized=true, uautorisert lenke)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
        summary: null,
      },
      attachments: [
        {
          id: 'case6-attachment',
          displayName: [{ value: 'Dokument (ikke tilgjengelig)', languageCode: 'nb' }],
          expiresAt: null,
          urls: [
            {
              id: 'case6-url',
              url: 'urn:dialogporten:unauthorized',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    },
    // Case 7: isAuthorized=true + summary and GUI attachment → visible
    {
      id: 'case7-summary-and-gui-attachment',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-15T07:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [{ value: 'Sak 7: vises (isAuthorized=true, summary og GUI-vedlegg)', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        summary: {
          value: [{ value: 'Tilbakemelding på a-melding', languageCode: 'nb' }],
          mediaType: 'text/plain',
        },
        contentReference: null,
      },
      attachments: [
        {
          id: 'case7-attachment',
          displayName: [{ value: 'tilbakemelding', languageCode: 'nb' }],
          expiresAt: null,
          urls: [
            {
              id: 'case7-url-gui',
              url: 'https://info.altinn.no/om-altinn/',
              consumerType: AttachmentUrlConsumer.Gui,
              mediaType: 'application/pdf',
            },
            {
              id: 'case7-url-api',
              url: 'https://info.altinn.no/om-altinn/api/',
              consumerType: AttachmentUrlConsumer.Api,
              mediaType: 'application/json',
            },
          ],
        },
      ],
    },
    {
      id: 'language-fce',
      relatedTransmissionId: null,
      isAuthorized: true,
      createdAt: '2024-08-16T07:00:00.000Z',
      type: TransmissionType.Information,
      sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
      content: {
        title: {
          value: [
            { value: 'Språktest: innhold per språk', languageCode: 'nb' },
            { value: 'Språktest: innhald per språk', languageCode: 'nn' },
            { value: 'Language test: content per language', languageCode: 'en' },
          ],
          mediaType: 'text/plain',
        },
        summary: {
          value: [
            { value: 'Bytt språk i menyen for å se innholdet under bytte', languageCode: 'nb' },
            { value: 'Switch language in the menu to see the content below change', languageCode: 'en' },
          ],
          mediaType: 'text/plain',
        },
        contentReference: getMockedLocalizedMarkdownFCEContent('language-fce'),
      },
      attachments: [],
    },
  ],
  notificationLogs: [
    mockNotificationLog('ae0e2f9f-eb4f-4aab-9f72-7d47e425a507', {
      requestedSendTime: '2024-07-30T18:15:00.000Z',
      lastUpdateTime: '2024-07-30T18:16:43.716Z',
    }),
    mockNotificationLog('a37b3ad6-4418-40ea-b4d7-32dbd2e91a8a', {
      destination: 'post@firma-as.no',
      requestedSendTime: '2024-07-30T18:15:00.000Z',
      lastUpdateTime: '2024-07-30T18:16:54.035Z',
    }),
    mockNotificationLog('b18c0d31-5b71-4c9f-8a45-6f0f4c1c4a10', {
      channel: 'Sms',
      destination: '+4799887766',
      requestedSendTime: '2024-07-30T18:15:00.000Z',
      lastUpdateTime: '2024-07-30T18:15:22.512Z',
    }),
    mockNotificationLog('d0706926-2c76-4eb1-b723-885268c442be', {
      type: 'Reminder',
      requestedSendTime: '2024-08-07T09:00:00.000Z',
      lastUpdateTime: '2024-08-07T09:02:28.962Z',
    }),
    mockNotificationLog('f2a5b8c4-1d33-4e77-9a02-3b7e5c9d0a11', {
      transmissionId: 'transmission-2',
      requestedSendTime: '2024-08-13T12:05:00.000Z',
      lastUpdateTime: '2024-08-13T12:06:11.004Z',
    }),
    mockNotificationLog('9e8d7c6b-5a40-4f3e-8d2c-1b0a9f8e7d6c', {
      type: 'Reminder',
      destination: 'post@firma-as.no',
      requestedSendTime: '2024-08-18T09:00:00.000Z',
      lastUpdateTime: '2024-08-18T09:00:12.004Z',
    }),
    mockNotificationLog('9e8d7c6b-5a41-4f3e-8d2c-1b0a9f8e7d6c', {
      type: 'Reminder',
      destination: 'regnskap@firma-as.no',
      requestedSendTime: '2024-08-18T09:00:00.000Z',
      lastUpdateTime: '2024-08-18T09:01:12.004Z',
    }),
    mockNotificationLog('9e8d7c6b-5a42-4f3e-8d2c-1b0a9f8e7d6c', {
      type: 'Reminder',
      destination: 'daglig.leder@firma-as.no',
      requestedSendTime: '2024-08-18T09:00:00.000Z',
      lastUpdateTime: '2024-08-18T09:02:12.004Z',
    }),
    mockNotificationLog('9e8d7c6b-5a43-4f3e-8d2c-1b0a9f8e7d6c', {
      type: 'Reminder',
      destination: 'styret@firma-as.no',
      requestedSendTime: '2024-08-18T09:00:00.000Z',
      lastUpdateTime: '2024-08-18T09:03:12.004Z',
    }),
  ],
  labelAssignmentLog: [
    // filed into the archive: the removal of the inbox label is the other half of the same move
    labelAssignmentPartyRepresentative('systemlabel:Archive', 'set', '2024-08-20T10:15:00.000Z'),
    labelAssignmentPartyRepresentative('systemlabel:Default', 'removed', '2024-08-20T10:15:00.000Z'),
    // moved back out again by someone else on the same party
    labelAssignmentPartyRepresentative('systemlabel:Default', 'set', '2024-08-21T11:30:00.000Z', 'NORDMANN OLA'),
    labelAssignmentPartyRepresentative('systemlabel:Archive', 'removed', '2024-08-21T11:30:00.000Z', 'NORDMANN OLA'),
    // marked as unread, then read again when the dialog was next opened
    labelAssignmentPartyRepresentative('systemlabel:MarkedAsUnopened', 'set', '2024-08-22T09:00:00.000Z'),
    labelAssignmentPartyRepresentative('systemlabel:MarkedAsUnopened', 'removed', '2024-08-22T14:45:00.000Z'),
    // thrown in the bin
    labelAssignmentPartyRepresentative('systemlabel:Bin', 'set', '2024-08-23T16:20:00.000Z'),
    labelAssignmentServiceOwner('systemlabel:Bin', 'removed', '2024-08-23T16:20:00.000Z'),
    // Sent says nothing about who filed the dialog, so it is not part of the log
    labelAssignmentPartyRepresentative('systemlabel:Sent', 'set', '2024-08-23T16:20:00.000Z'),
  ],
});

export const dialogs: MockDialog[] = [
  dialogWithTransmissions,
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
