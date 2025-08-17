import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogByIdFieldsFragment,
  GuiActionPriority,
  HttpVerb, PartyFieldsFragment,
  SearchDialogFieldsFragment,
  TransmissionType,
} from 'bff-types-generated';
import { naiveSearchFilter } from "../../filters.ts";
import { InMemoryStore } from "../../handlers.ts";

export const filterDialogs = ({
  inMemoryStore,
  partyURIs,
  search,
  org,
  label,
  status,
  updatedAfter,
  updatedBefore,
}: {
  inMemoryStore: InMemoryStore;
  partyURIs: string[];
  search?: string;
  org?: string;
  label?: string;
  status?: string | string[];
  updatedBefore?: string;
  updatedAfter?: string;
}) => {

  if (!inMemoryStore.dialogs) return null;

  const allowedPartyIds = inMemoryStore.parties?.flatMap((party: PartyFieldsFragment) => [
    party.party,
    ...(party.subParties ?? []).map((subParty) => subParty.party),
  ]);

  const allPartiesEligible = partyURIs.every((partyURI) => allowedPartyIds?.includes(partyURI));
  const shouldReturnNull = !allPartiesEligible || partyURIs.length === 0;

  if (shouldReturnNull) return null;

  const normalizeArray = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const labels = normalizeArray(label);
  const statuses = normalizeArray(status);

  return inMemoryStore.dialogs.filter((dialog) => {
    const matchesParty = partyURIs.includes(dialog.party);

    const matchesTimeRange =
      (!updatedBefore || dialog.contentUpdatedAt < updatedBefore) &&
      (!updatedAfter || dialog.contentUpdatedAt > updatedAfter);

    const matchesOrg = !org?.length || org.includes(dialog.org);
    const matchesLabels = !labels.length ||
      labels.some(l => dialog.endUserContext?.systemLabels?.some(label => l.includes(label)));
    const matchesStatus = !statuses.length || statuses.includes(dialog.status);
    const matchesSearch = naiveSearchFilter(dialog, search);

    return matchesParty && matchesTimeRange && matchesOrg &&
      matchesLabels && matchesStatus && matchesSearch;
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
}

export const getMockedActivities = (latestActivity: SearchDialogFieldsFragment['latestActivity'], id: string): DialogByIdFieldsFragment['activities'] => {
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
          }
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
          }
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
          }
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
    ]
  }
  return [
    {
      id: Math.random() + '-activity',
      performedBy: {
        actorType: latestActivity?.performedBy.actorType as ActorType,
        actorId: latestActivity?.performedBy.actorId,
        actorName: latestActivity?.performedBy.actorName,
      },
      description: latestActivity?.description || [],
      type: ActivityType.Information,
      createdAt: new Date().toISOString(),
    },
  ]

}

export const getMockedTransmissions = (dialogId: string) => {
  const dialogWithTransmissions = '019241f7-8218-7756-be82-123qwe456rtA';
  if (dialogId === dialogWithTransmissions) {
    return [
      {
        "id": "transmission-1",
        "createdAt": "2024-07-30T18:12:54.233Z",
        isAuthorized: true,
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.ServiceOwner,
          "actorId": null,
          "actorName": null
        },
        "content": {
          "title": {
            "value": [{
              value: 'Tittel',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "summary": {
            "value": [{
              value: 'Oppsummering',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedFCEContent('transmission-1'),
        },
        "attachments": []
      },
      {
        "id": "transmission-2",
        relatedTransmissionId: 'transmission-1',
        isAuthorized: true,
        "createdAt": "2024-07-31T18:12:54.233Z",
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Kari Nordmann'
        },
        "content": {
          "title": {
            "value": [{
              value: 'Tittel 2',
              languageCode: 'nb',
            }],
            "mediaType": "text/pla  in"
          },
          "summary": {
            "value": [{
              value: 'Oppsummering 2',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedFCEContent('transmission-2'),
        },
        "attachments": []
      },
      {
        "id": "transmission-3",
        "createdAt": "2024-07-31T18:12:54.233Z",
        isAuthorized: false,
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Per Nordmann'
        },
        "content": {
          "title": {
            "value": [{
              value: 'Tittel 3',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedUnauthorizedFCEContent(),
          "summary": {
            "value": [{
              value: 'Oppsummering 3',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
        },
        "attachments": []
      },
      {
        "id": "transmission-999",
        "createdAt": "2024-07-31T11:12:54.233Z",
        isAuthorized: true,
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Per Nordmann'
        },
        "content": {
          "title": {
            "value": [{
              value: 'Inneholder HTML',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedHTMLFCEContent('HTML'),
          "summary": {
            "value": [{
              value: 'Oppsummering HTML',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
        },
        "attachments": []
      },
      {
        "id": "transmission-4",
        relatedTransmissionId: 'transmission-2',
        isAuthorized: true,
        "createdAt": "2024-08-13T12:12:54.233Z",
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Per Nordmann'
        },
        "content": {
          "title": {
            "value": [{
              value: 'Tittel 4',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedFCEContent('transmission-4'),
          "summary": {
            "value": [{
              value: 'Oppsummering 4',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
        },
        "attachments": []
      }
    ]
  }
  return [];
}

export const convertToDialogByIdTemplate = (input: SearchDialogFieldsFragment): DialogByIdFieldsFragment => {
  return {
    id: input.id,
    dialogToken: 'MOCKED_DIALOG_TOKEN',
    party: input.party,
    org: input.org,
    progress: input.progress,
    endUserContext: input.endUserContext,
    attachments: [
      {
        id: input.id,
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
            consumerType: AttachmentUrlConsumer.Gui,
          },
        ],
      },
    ],
    activities: getMockedActivities(input.latestActivity, input.id),
    transmissions: getMockedTransmissions(input.id),
    fromServiceOwnerTransmissionsCount: 3,
  fromPartyTransmissionsCount:4,
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
    // @ts-ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // biome-ignore lint/suspicious/noExplicitAny: NA
    seenSinceLastUpdate: input.seenSinceLastUpdate,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    extendedStatus: input.extendedStatus,
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
