import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { naiveSearchFilter } from '../../filters';
import type { InMemoryStore } from '../../handlers.ts';

export const MAX_PARTY_URIS = 100;
export const MAX_SERVICE_RESOURCES = 20;

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
  org?: string;
  label?: string;
  status?: string | string[];
  updatedBefore?: string;
  updatedAfter?: string;
  isContentSeen?: boolean | null;
}) => {
  if (!inMemoryStore.dialogs) return null;

  const partyURIList = partyURIs ?? [];
  const serviceResourceList = serviceResources ?? [];

  if (partyURIList.length > MAX_PARTY_URIS) return null;
  if (serviceResourceList.length > MAX_SERVICE_RESOURCES) return null;
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

    const matchesOrg = !org?.length || org.includes(dialog.org);

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

  if (idWithLegacyHTML === dialogId) {
    return getMockedHTMLFCEContent();
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

export const getMockedActivities = (id: string): DialogByIdFieldsFragment['activities'] => {
  if (id === '019241f7-8218-7756-be82-123qwe456rtA') {
    return [
      {
        id: Math.random() + '-activity',
        performedBy: {
          actorType: ActorType.ServiceOwner,
          actorId: 'actor-01',
          actorName: 'Skatteetaten',
        },
        description: [
          {
            value: 'Meldingen ble sendt.',
            languageCode: 'nb',
          },
        ],
        type: ActivityType.Information,
        createdAt: '2023-12-03T10:45:00.000Z',
      },
      {
        id: Math.random() + '-activity',
        performedBy: {
          actorType: ActorType.ServiceOwner,
          actorId: 'actor-01',
          actorName: 'Skatteetaten',
        },
        description: [
          {
            value: 'Meldingen ble åpnet.',
            languageCode: 'nb',
          },
        ],
        type: ActivityType.Information,
        createdAt: '2023-12-04T10:45:00.000Z',
      },
      {
        id: Math.random() + '-activity',
        performedBy: {
          actorType: ActorType.ServiceOwner,
          actorId: 'actor-01',
          actorName: 'Skatteetaten',
        },
        description: [
          {
            value: 'Denne meldingen er utløpt.',
            languageCode: 'nb',
          },
        ],
        type: ActivityType.Information,
        createdAt: '2025-12-31T10:45:00.000Z',
      },
      {
        id: Math.random() + '-activity',
        performedBy: {
          actorType: ActorType.ServiceOwner,
          actorId: 'actor-01',
          actorName: 'Skatteetaten',
        },
        transmissionId: 'transmission-2',
        type: ActivityType.TransmissionOpened,
        description: [],
        createdAt: '2025-12-31T10:45:00.000Z',
      },
    ];
  }
  return [
    {
      id: Math.random() + '-activity',
      performedBy: {
        actorType: ActorType.ServiceOwner,
        actorId: 'digdir',
        actorName: 'Digitaliseringdirektoratet',
      },
      description: [],
      type: ActivityType.Information,
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getMockedTransmissions = (dialogId: string) => {
  const dialogWithTransmissions = '019241f7-8218-7756-be82-123qwe456rtA';
  if (dialogId === dialogWithTransmissions) {
    return [
      {
        id: 'transmission-1',
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
          contentReference: getMockedFCEContent('transmission-1'),
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
    ];
  }
  return [];
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
    guiActions: [
      {
        id: input.id,
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
    ],
    seenSinceLastContentUpdate: input.seenSinceLastContentUpdate,
    status: input.status,
    createdAt: input.createdAt,
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
