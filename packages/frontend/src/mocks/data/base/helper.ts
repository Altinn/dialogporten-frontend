import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  type NotificationLogsResponse,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { naiveSearchFilter } from '../../filters';
import type { InMemoryStore } from '../../handlers.ts';

export const MAX_PARTY_URIS = 100;
export const MAX_SERVICE_RESOURCES = 20;
export const MAX_SERVICE_OWNERS = 20;

export const filterDialogs = ({
  inMemoryStore,
  partyURIs,
  serviceResources,
  search,
  org,
  label,
  status,
  updatedAfter,
  updatedBefore,
  isContentSeen,
}: {
  inMemoryStore: InMemoryStore;
  partyURIs: string[];
  serviceResources?: string[];
  search?: string;
  org?: string | string[];
  label?: string;
  status?: string | string[];
  updatedBefore?: string;
  updatedAfter?: string;
  isContentSeen?: boolean | null;
}) => {
  if (!inMemoryStore.dialogs) return null;

  const partyURIList = partyURIs ?? [];
  const serviceResourceList = serviceResources ?? [];
  const orgList = Array.isArray(org) ? org : org ? [org] : [];

  if (partyURIList.length > MAX_PARTY_URIS) return null;
  if (serviceResourceList.length > MAX_SERVICE_RESOURCES) return null;
  if (orgList.length > MAX_SERVICE_OWNERS) return null;
  if (partyURIList.length === 0 && serviceResourceList.length === 0) return null;

  if (partyURIList.length > 0) {
    const allowedPartyIds = inMemoryStore.parties?.flatMap((party: PartyFieldsFragment) => [
      party.party,
      ...(party.subParties ?? []).map((subParty) => subParty.party),
    ]);
    const allPartiesEligible = partyURIList.every((partyURI) => allowedPartyIds?.includes(partyURI));
    if (!allPartiesEligible) return null;
  }

  const normalizeArray = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const labels = normalizeArray(label);
  const statuses = normalizeArray(status);

  return inMemoryStore.dialogs.filter((dialog) => {
    const matchesParty = partyURIList.length === 0 || partyURIList.includes(dialog.party);
    const matchesServiceResource =
      serviceResourceList.length === 0 || serviceResourceList.includes(dialog.serviceResource);

    const matchesTimeRange =
      (!updatedBefore || dialog.contentUpdatedAt < updatedBefore) &&
      (!updatedAfter || dialog.contentUpdatedAt > updatedAfter);

    const matchesOrg = !orgList.length || orgList.includes(dialog.org);

    const matchesLabels =
      !labels.length || dialog.endUserContext?.systemLabels?.some((dialogLabel) => labels.includes(dialogLabel));
    const matchesStatus = !statuses.length || statuses.includes(dialog.status);
    const matchesSearch = naiveSearchFilter(dialog, search);
    const hasMarkedAsUnopened = dialog.endUserContext?.systemLabels?.includes(SystemLabel.MarkedAsUnopened) ?? false;
    const effectiveIsContentSeen = hasMarkedAsUnopened ? false : dialog.isContentSeen;
    const matchesIsContentSeen =
      isContentSeen === undefined || isContentSeen === null || effectiveIsContentSeen === isContentSeen;

    return (
      matchesParty &&
      matchesServiceResource &&
      matchesTimeRange &&
      matchesOrg &&
      matchesLabels &&
      matchesStatus &&
      matchesSearch &&
      matchesIsContentSeen
    );
  });
};

export const getMockedMainContent = (dialogId: string) => {
  const idWithLegacyHTML = '019241f7-6f45-72fd-a574-f19d358aaf4e';
  const idWithLocalizedContentUrls = '019241f7-8218-7756-be82-5310042c3d95';

  if (idWithLegacyHTML === dialogId) {
    return getMockedHTMLFCEContent();
  }

  if (idWithLocalizedContentUrls === dialogId) {
    return getMockedLocalizedMarkdownFCEContent();
  }

  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
    value: [
      {
        value: 'https://dialogporten-serviceprovider.net/fce-markdown',
        languageCode: 'nb',
      },
    ],
  };
};

export const getMockedLocalizedMarkdownFCEContent = (transmissionId?: string) => {
  const idParam = transmissionId ? `&id=${transmissionId}` : '';

  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
    value: ['nb', 'nn', 'en'].map((languageCode) => ({
      value: `https://dialogporten-serviceprovider.net/fce-markdown-localized?lang=${languageCode}${idParam}`,
      languageCode,
    })),
  };
};

export const getMockedFCEContent = (transmissionId: string) => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
    value: [
      {
        value: `https://dialogporten-serviceprovider.net/fce-markdown-transmission?id=t${transmissionId}`,
        languageCode: 'nb',
      },
    ],
  };
};

export const getMockedHTMLFCEContent = (transmissionId?: string) => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
    value: [
      {
        value: `https://dialogporten-serviceprovider.net/fce-html?id=t${transmissionId}`,
        languageCode: 'nb',
      },
    ],
  };
};

export const getMockedUnauthorizedFCEContent = () => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
    value: [
      {
        value: 'urn:dialogporten:unauthorized',
        languageCode: 'nb',
      },
    ],
  };
};

/* A dialog is not required to have any activities; this one deliberately has none. */
export const dialogWithoutActivities = '019241f7-8218-7756-be82-noactivities';

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

export const getMockedActivities = (id: string): DialogByIdFieldsFragment['activities'] => {
  if (id === dialogWithoutActivities) {
    return [];
  }
  if (id === '019241f7-8218-7756-be82-123qwe456rtA') {
    return [
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
    ];
  }
  return [
    {
      id: `${id}-activity-dialog-created`,
      performedBy: {
        actorType: ActorType.ServiceOwner,
        actorId: 'digdir',
        actorName: 'Digitaliseringsdirektoratet',
      },
      description: [],
      type: ActivityType.DialogCreated,
      createdAt: '2024-05-23T23:00:00.000Z',
      transmissionId: null,
    },
    {
      id: `${id}-activity-information`,
      performedBy: {
        actorType: ActorType.ServiceOwner,
        actorId: 'digdir',
        actorName: 'Digitaliseringsdirektoratet',
      },
      description: [
        {
          value: 'Dialogen er tilgjengelig for deg.',
          languageCode: 'nb',
        },
      ],
      type: ActivityType.Information,
      createdAt: '2024-05-24T08:30:00.000Z',
      transmissionId: null,
    },
  ];
};

export const dialogWithNotificationLogs = '019241f7-5fa0-7336-934d-716a8e5bbb49';

const notificationLog = (
  dialogId: string,
  notificationId: string,
  overrides: Partial<NotificationLogsResponse>,
): NotificationLogsResponse => ({
  dialogId,
  notificationId,
  transmissionId: null,
  type: 'Notification',
  channel: 'Email',
  destination: 'kari.nordmann@example.com',
  status: 'Email_Delivered',
  requestedSendTime: null,
  lastUpdateTime: null,
  ...overrides,
});

export const getMockedNotificationLogs = (dialogId: string): NotificationLogsResponse[] => {
  if (dialogId === '019241f7-8218-7756-be82-123qwe456rtA') {
    return [
      notificationLog(dialogId, 'ae0e2f9f-eb4f-4aab-9f72-7d47e425a507', {
        requestedSendTime: '2024-07-30T18:15:00.000Z',
        lastUpdateTime: '2024-07-30T18:16:43.716Z',
      }),
      notificationLog(dialogId, 'a37b3ad6-4418-40ea-b4d7-32dbd2e91a8a', {
        destination: 'post@firma-as.no',
        requestedSendTime: '2024-07-30T18:15:00.000Z',
        lastUpdateTime: '2024-07-30T18:16:54.035Z',
      }),
      notificationLog(dialogId, 'b18c0d31-5b71-4c9f-8a45-6f0f4c1c4a10', {
        channel: 'Sms',
        destination: '+4799887766',
        status: 'SMS_Accepted',
        requestedSendTime: '2024-07-30T18:15:00.000Z',
        lastUpdateTime: '2024-07-30T18:15:22.512Z',
      }),
      notificationLog(dialogId, 'd0706926-2c76-4eb1-b723-885268c442be', {
        type: 'Reminder',
        requestedSendTime: '2024-08-07T09:00:00.000Z',
        lastUpdateTime: '2024-08-07T09:02:28.962Z',
      }),
      notificationLog(dialogId, 'e4ad6a2e-5f1f-47ec-82ab-fbeabc483be8', {
        type: 'Reminder',
        destination: 'post@firma-as.no',
        status: 'Email_Failed_Bounced',
        requestedSendTime: '2024-08-07T09:00:00.000Z',
        lastUpdateTime: '2024-08-07T09:01:29.462Z',
      }),
      notificationLog(dialogId, 'f2a5b8c4-1d33-4e77-9a02-3b7e5c9d0a11', {
        transmissionId: 'transmission-2',
        type: 'Composed',
        status: 'Email_Succeeded',
        requestedSendTime: '2024-08-13T12:05:00.000Z',
        lastUpdateTime: '2024-08-13T12:06:11.004Z',
      }),
      notificationLog(dialogId, 'c7d9e0f1-2a34-4b56-8c78-9d0e1f2a3b4c', {
        channel: 'Sms',
        destination: '+4799887766',
        status: 'SMS_Sending',
        requestedSendTime: '2024-08-15T10:05:00.000Z',
        lastUpdateTime: '2024-08-15T10:05:03.881Z',
      }),
      notificationLog(dialogId, '1b2c3d4e-5f60-4a71-8b82-9c0d1e2f3a4b', {
        channel: 'Sms',
        destination: '+4791122334',
        status: 'SMS_Failed_TTL',
        requestedSendTime: '2024-08-16T07:30:00.000Z',
        lastUpdateTime: '2024-08-18T07:30:00.000Z',
      }),
      notificationLog(dialogId, '9e8d7c6b-5a40-4f3e-8d2c-1b0a9f8e7d6c', {
        type: 'Reminder',
        destination: 'post@firma-as.no',
        status: 'Email_Delivered',
        requestedSendTime: '2024-08-18T09:00:00.000Z',
        lastUpdateTime: '2024-08-18T09:00:12.004Z',
      }),
      notificationLog(dialogId, '9e8d7c6b-5a41-4f3e-8d2c-1b0a9f8e7d6c', {
        type: 'Reminder',
        destination: 'regnskap@firma-as.no',
        status: 'Email_Delivered',
        requestedSendTime: '2024-08-18T09:00:00.000Z',
        lastUpdateTime: '2024-08-18T09:01:12.004Z',
      }),
      notificationLog(dialogId, '9e8d7c6b-5a42-4f3e-8d2c-1b0a9f8e7d6c', {
        type: 'Reminder',
        destination: 'daglig.leder@firma-as.no',
        status: 'Email_Delivered',
        requestedSendTime: '2024-08-18T09:00:00.000Z',
        lastUpdateTime: '2024-08-18T09:02:12.004Z',
      }),
      notificationLog(dialogId, '9e8d7c6b-5a43-4f3e-8d2c-1b0a9f8e7d6c', {
        type: 'Reminder',
        destination: 'styret@firma-as.no',
        status: 'Email_Delivered',
        requestedSendTime: '2024-08-18T09:00:00.000Z',
        lastUpdateTime: '2024-08-18T09:03:12.004Z',
      }),
      notificationLog(dialogId, '9e8d7c6b-5a44-4f3e-8d2c-1b0a9f8e7d6c', {
        type: 'Reminder',
        destination: 'hr@firma-as.no',
        status: 'Email_Failed_Bounced',
        requestedSendTime: '2024-08-18T09:00:00.000Z',
        lastUpdateTime: '2024-08-18T09:04:12.004Z',
      }),
      notificationLog(dialogId, '0a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d', {
        type: 'Instant',
        channel: 'Sms',
        destination: '+4790011223',
        status: 'SMS_Delivered',
        requestedSendTime: '2024-08-19T13:20:00.000Z',
        lastUpdateTime: '2024-08-19T13:20:08.114Z',
      }),
    ];
  }

  if (dialogId === dialogWithNotificationLogs) {
    return [
      notificationLog(dialogId, '5f8c1a20-9d44-4f0e-8b21-7c3e6a9d1f02', {
        requestedSendTime: '2023-03-11T07:05:00.000Z',
        lastUpdateTime: '2023-03-11T07:06:12.310Z',
      }),
      notificationLog(dialogId, '6a9d2b31-0e55-4a1f-9c32-8d4f7b0e2a13', {
        channel: 'Sms',
        destination: '+4799887766',
        requestedSendTime: '2023-03-11T07:05:00.000Z',
        lastUpdateTime: '2023-03-11T07:05:41.128Z',
      }),
      notificationLog(dialogId, '7b0e3c42-1f66-4b20-8d43-9e5a8c1f3b24', {
        type: 'Reminder',
        requestedSendTime: '2024-07-15T08:45:00.000Z',
        lastUpdateTime: '2024-07-15T08:47:55.902Z',
      }),
    ];
  }

  return [];
};

const labelAssignmentActors: Record<string, string> = {
  'SØSTER FANTASIFULL 2024': 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
  'NORDMANN OLA': 'urn:altinn:person:identifier-ephemeral:7f1c9d2e04',
};

const labelAssignment = (name: string, action: string, createdAt: string, actorName = 'SØSTER FANTASIFULL 2024') => ({
  name,
  action,
  createdAt,
  performedBy: {
    actorType: ActorType.PartyRepresentative,
    actorId: labelAssignmentActors[actorName],
    actorName,
  },
});

export const getMockedLabelAssignmentLogs = (dialogId: string) => {
  if (dialogId !== '019241f7-8218-7756-be82-123qwe456rtA') {
    return [];
  }

  return [
    // filed into the archive: the removal of the inbox label is the other half of the same move
    labelAssignment('systemlabel:Archive', 'set', '2024-08-20T10:15:00.000Z'),
    labelAssignment('systemlabel:Default', 'removed', '2024-08-20T10:15:00.000Z'),
    // moved back out again by someone else on the same party
    labelAssignment('systemlabel:Default', 'set', '2024-08-21T11:30:00.000Z', 'NORDMANN OLA'),
    labelAssignment('systemlabel:Archive', 'removed', '2024-08-21T11:30:00.000Z', 'NORDMANN OLA'),
    // marked as unread, then read again when the dialog was next opened
    labelAssignment('systemlabel:MarkedAsUnopened', 'set', '2024-08-22T09:00:00.000Z'),
    labelAssignment('systemlabel:MarkedAsUnopened', 'removed', '2024-08-22T14:45:00.000Z'),
    // thrown in the bin
    labelAssignment('systemlabel:Bin', 'set', '2024-08-23T16:20:00.000Z'),
    labelAssignment('systemlabel:Default', 'removed', '2024-08-23T16:20:00.000Z'),
    // Sent says nothing about who filed the dialog, so it is not part of the log
    labelAssignment('systemlabel:Sent', 'set', '2024-08-23T16:20:00.000Z'),
  ];
};

export const getMockedTransmissions = (dialogId: string) => {
  const dialogWithTransmissions = '019241f7-8218-7756-be82-123qwe456rtA';
  if (dialogId === dialogWithoutActivities) {
    return [
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
    ];
  }
  if (dialogId === dialogWithTransmissions) {
    return [
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
    ];
  }
  return [];
};

/* A service owner can put a confirmation prompt on an authorized action; the default mock action is
   unauthorized, and so renders disabled and cannot exercise that flow. */
export const dialogWithPromptAction = '019241f7-8218-7756-be82-promptaction';

const getMockedGuiActions = (id: string): DialogByIdFieldsFragment['guiActions'] => {
  if (id === dialogWithPromptAction) {
    return [
      {
        id: 'confirm-with-prompt',
        url: 'https://dialogporten-serviceprovider.net/mutate/state-1/3',
        isAuthorized: true,
        isDeleteDialogAction: false,
        action: 'submit',
        authorizationAttribute: null,
        priority: GuiActionPriority.Primary,
        httpMethod: HttpVerb.Post,
        title: [
          {
            languageCode: 'nb',
            value: 'Send inn',
          },
        ],
        prompt: [
          {
            languageCode: 'nb',
            value: 'Er du sikker på at du vil sende inn?',
          },
        ],
      },
    ];
  }
  return [
    {
      id,
      url: 'urn:dialogporten:unauthorized',
      isAuthorized: false,
      isDeleteDialogAction: false,
      action: 'submit',
      authorizationAttribute: null,
      priority: GuiActionPriority.Primary,
      httpMethod: HttpVerb.Get,
      title: [
        {
          languageCode: 'nb',
          value: 'Til skjema',
        },
      ],
      prompt: [],
    },
  ];
};

export const convertToDialogByIdTemplate = (input: SearchDialogFieldsFragment): DialogByIdFieldsFragment => {
  return {
    id: input.id,
    serviceResourceType: 'correspondenceservice',
    dialogToken: 'MOCKED_DIALOG_TOKEN',
    party: input.party,
    org: input.org,
    progress: input.progress,
    endUserContext: input.endUserContext,
    attachments: [
      {
        id: input.id,
        expiresAt: new Date(Date.now() + 60_000 * 1000).toISOString(),
        displayName: [
          {
            value: 'kvittering.pdf',
            languageCode: 'nb',
          },
        ],
        urls: [
          {
            id: 'hello-attachment-id',
            url: 'https://info.altinn.no/om-altinn/',
            mediaType: 'application/pdf',
            consumerType: AttachmentUrlConsumer.Gui,
          },
        ],
      },
    ],
    activities: getMockedActivities(input.id),
    transmissions: getMockedTransmissions(input.id),
    fromServiceOwnerTransmissionsCount: 3,
    fromPartyTransmissionsCount: 4,
    guiActions: getMockedGuiActions(input.id),
    seenSinceLastContentUpdate: input.seenSinceLastContentUpdate,
    status: input.status,
    createdAt: input.createdAt,
    dueAt: input.dueAt,
    contentUpdatedAt: input.contentUpdatedAt,
    isContentSeen: input.endUserContext?.systemLabels?.includes(SystemLabel.MarkedAsUnopened)
      ? false
      : (input.isContentSeen ?? true),
    content: {
      title: input.content.title,
      summary: input.content.summary,
      senderName: input.content.senderName,
      additionalInfo: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Denne setningen inneholder tilleggsinformasjon for dialogen.',
            languageCode: 'nb',
          },
        ],
      },
      extendedStatus: input.content.extendedStatus,
      mainContentReference: getMockedMainContent(input.id),
    },
  };
};
