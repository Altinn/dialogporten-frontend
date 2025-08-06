import { ActorType, DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

export const dialogs: SearchDialogFieldsFragment[] = [
  {
    id: '019241f7-6f45-72fd-a574-f19d358aaf4e',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-01-15T11:34:00.000Z", guiAttachmentCount: 1,
    status: DialogStatus.RequiresAttention,
    createdAt: '2023-12-23T23:00:00.000Z',
    updatedAt: '2024-01-15T11:34:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
        seenAt: '2024-09-30T11:36:01.572Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'TEST TESTESEN',
        },
        isCurrentEndUser: true,
      },
      {
        id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a1',
        seenAt: '2024-09-30T11:36:01.572Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'ANNA FANTASIFULL',
        },
        isCurrentEndUser: false,
      },
      {
        id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a3',
        seenAt: '2024-09-30T11:36:01.572Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'PER GÅTEFULL',
        },
        isCurrentEndUser: false,
      },
    ],
    latestActivity: {
      description: [
        {
          value: 'Meldingen ble sendt.',
          languageCode: 'nb',
        },
      ],
      performedBy: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'Rakel Engelsvik',
      },
    },
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Melding om bortkjøring av snø',
            languageCode: 'nb',
          },
          {
            value: 'Notification of snow removal',
            languageCode: 'en',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value:
              'Melding om bortkjøring av snø mangler opplysninger om adresse.\n\nSe over opplysninger og send inn skjema på nytt.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-67dc-7562-a56f-1634796039e5',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ok',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-02-20T06:33:00.000Z", guiAttachmentCount: 1,
    status: DialogStatus.Awaiting,
    createdAt: '2023-12-15T06:33:00.000Z',
    updatedAt: '2024-02-20T06:33:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Melding om hull i veien',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Meldingen ble sendt.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-8375-75a3-8bdb-2cebee9cb585',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:organization:identifier-sub:2',
    org: 'fors',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-03-12T09:15:00.000Z", guiAttachmentCount: 1,
    status: DialogStatus.NotApplicable,
    createdAt: '2023-12-12T09:15:00.000Z',
    updatedAt: '2024-03-12T09:15:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: '03d5e075-9a8b-48b7-bb0a-99733ee3e572',
        seenAt: '2024-09-30T11:36:29.692Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'SØSTER FANTASIFULL',
        },
        isCurrentEndUser: true,
      },
    ],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Innkalling til sesjon',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Du er innkalt til sesjon og skal møte ved Oslo sesjonssenter.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-8218-7756-be82-5310042c3d95',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-04-04T11:45:00.000Z", guiAttachmentCount: 0,
    status: DialogStatus.RequiresAttention,
    createdAt: '2023-12-04T11:45:00.000Z',
    updatedAt: '2024-04-04T11:45:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [],
    latestActivity: {
      description: [
        {
          value: 'Du leverte søknad on arbeidsavklaringspenger.',
          languageCode: 'nb',
        },
      ],
      performedBy: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'Erik Huseklepp',
      },
    },
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Arbeidsavklaringspenger',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Søknaden om arbeidsavklaringspenger er klar til signering.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-812c-71c8-8e68-94a0b771fa10',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ssb',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-05-17T09:30:00.000Z", guiAttachmentCount: 0,
    status: DialogStatus.RequiresAttention,
    createdAt: '2023-05-17T09:30:00.000Z',
    updatedAt: '2024-05-17T09:30:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: '268edfdb-1843-4a18-a8c7-5d45fe7f7fc8',
        seenAt: '2024-09-30T11:37:05.020Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'SØSTER FANTASIFULL',
        },
        isCurrentEndUser: true,
      },
    ],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Undersøkelse om levekår',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value:
              'Du er en av 6.000 personer som er trukket ut fra folkeregisteret til å delta i SSBs undersøkelse om levekår.\n\n',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-78e6-7702-8724-a95e049d491e',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'dibk',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-06-18T10:55:00.000Z", guiAttachmentCount: 8,
    status: DialogStatus.NotApplicable,
    createdAt: '2023-04-18T10:55:00.000Z',
    updatedAt: '2024-06-18T10:55:00.000Z',
    dueAt: '2028-05-04T11:45:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: 'a06fa273-7aa7-41dc-911c-b0fb60640a6b',
        seenAt: '2024-10-01T07:17:14.541Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'SØSTER FANTASIFULL',
        },
        isCurrentEndUser: true,
      },
    ],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Nabovarsel for Louises gate 15',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Nabovarsel for byggeplaner i for Louises gate 15, 0169 Oslo (gårdsnr. 118, bruksnr. 366).',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-5fa0-7336-934d-716a8e5bbb49',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'skd',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2024-07-15T08:45:00.000Z", guiAttachmentCount: 1,
    status: DialogStatus.Completed,
    createdAt: '2023-03-11T07:00:00.000Z',
    updatedAt: '2024-07-15T08:45:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [],
    latestActivity: {
      description: [
        {
          value: 'Skattemeldingen ble levert.',
          languageCode: 'nb',
        },
      ],
      performedBy: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'Erik Huseklepp',
      },
    },
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Skatten din for 2022',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Skatteoppgjøret for 2022 er klart. Du kan fortsatt gjøre endringer.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-7f61-778d-9ef8-f6bae5e80579',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'dibk',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2023-08-13T09:25:00.000Z", guiAttachmentCount: 9,
    status: DialogStatus.NotApplicable,
    createdAt: '2022-04-13T09:25:00.000Z',
    updatedAt: '2023-08-13T09:25:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: '90801e39-23a4-4086-9e9a-f56811f75ff3',
        seenAt: '2024-09-30T08:34:31.801Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'SØSTER FANTASIFULL',
        },
        isCurrentEndUser: true,
      },
    ],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Nabovarsel for Wilhelms gate 10',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Nabovarsel for byggeplaner i for Wilhelms gate 10, 0169 Oslo (gårdsnr. 217, bruksnr. 486).',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-8698-7293-90aa-6c65a784c15e',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'svv',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2022-02-20T08:35:00.000Z", guiAttachmentCount: 1,
    status: DialogStatus.Completed,
    createdAt: '2022-01-05T07:00:00.000Z',
    updatedAt: '2022-02-20T08:35:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [
      {
        id: '3553a0ad-1458-47b2-b1b0-8d325b39f4b0',
        seenAt: '2024-10-01T07:17:21.025Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
          actorName: 'SØSTER FANTASIFULL',
        },
        isCurrentEndUser: true,
      },
    ],
    latestActivity: {
      description: [
        {
          value: 'Søknad om bilskilt personlig med påskrift DIGDIR ble sendt.',
          languageCode: 'nb',
        },
      ],
      performedBy: {
        actorType: ActorType.PartyRepresentative,
        actorId: null,
        actorName: 'Erik Huseklepp',
      },
    },
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Søknad om personlig bilskilt',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Søknaden ble avslått. Se tilbakemelding for detaljer.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
  {
    id: '019241f7-85ed-72fd-922a-fa784d7e4228',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'svv',
    progress: null,
    hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: "2001-04-05T22:00:00.000Z", guiAttachmentCount: 0,
    status: DialogStatus.Draft,
    createdAt: '2001-04-05T22:00:00.000Z',
    updatedAt: '2001-04-05T22:00:00.000Z',
    extendedStatus: null,
    seenSinceLastContentUpdate: [],
    seenSinceLastUpdate: [],
    latestActivity: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Klage på EU-kontroll',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Utkast til klage er opprettet.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
];
