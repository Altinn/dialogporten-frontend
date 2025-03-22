import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogByIdFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  SearchDialogFieldsFragment, TransmissionType,
} from 'bff-types-generated';

export const getMockedMainContent = (dialogId: string) => {
  const idWithLegacyHTML = '019241f7-6f45-72fd-a574-f19d358aaf4e';

  if (idWithLegacyHTML === dialogId) {
    return {
      mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
      value: [
        {
          value: 'https://dialogporten-serviceprovider.net/fce-html',
          languageCode: 'nb',
        },
      ],
    };
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

export const getMockedTransmissions = (dialogId: string) => {
  const dialogWithTransmissions = '019241f7-8218-7756-be82-123qwe456rtA';
  if (dialogId === dialogWithTransmissions) {
    return [
      {
        "id": "transmission-1",
        "createdAt": "2024-07-30T18:12:54.233Z",
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.ServiceOwner,
          "actorId": null,
          "actorName": null
        },
        "content": {
          "title": {
            "value": [ {
              value: 'Tittel',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "summary": {
            "value": [ {
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
        "createdAt": "2024-07-31T18:12:54.233Z",
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Kari Nordmann'
        },
        "content": {
          "title": {
            "value": [ {
              value: 'Tittel 2',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "summary": {
            "value": [ {
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
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Per Nordmann'
        },
        "content": {
          "title": {
            "value": [ {
              value: 'Tittel 3',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedFCEContent('transmission-3'),
          "summary": {
            "value": [ {
              value: 'Oppsummering 3',
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
        "createdAt": "2024-08-13T12:12:54.233Z",
        "type": TransmissionType.Information,
        "sender": {
          "actorType": ActorType.PartyRepresentative,
          "actorId": null,
          "actorName": 'Per Nordmann'
        },
        "content": {
          "title": {
            "value": [ {
              value: 'Tittel 4',
              languageCode: 'nb',
            }],
            "mediaType": "text/plain"
          },
          "contentReference": getMockedFCEContent('transmission-4'),
          "summary": {
            "value": [ {
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
    systemLabel: input.systemLabel,
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
    activities: [
      {
        id: input.id,
        performedBy: {
          actorType: input.latestActivity!.performedBy.actorType as ActorType,
          actorId: input.latestActivity!.performedBy.actorId,
          actorName: input.latestActivity!.performedBy.actorName,
        },
        description: input.latestActivity!.description,
        type: ActivityType.Information,
        createdAt: input.createdAt,
      },
    ],
    transmissions: getMockedTransmissions(input.id),
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
