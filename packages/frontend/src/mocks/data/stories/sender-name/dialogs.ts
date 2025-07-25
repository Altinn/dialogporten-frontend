import { ActorType, DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

export const dialogs: SearchDialogFieldsFragment[] = [
    {
        seenSinceLastContentUpdate: [],
        id: '019241f7-8218-7756-be82-123qwe456rty',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'nav',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0,  contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 0,
        status: DialogStatus.RequiresAttention,
        createdAt: '2023-12-04T11:45:00.000Z',
        updatedAt: '2024-05-04T11:45:00.000Z',
        extendedStatus: null,
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
    },
    {
        seenSinceLastContentUpdate: [],
        id: '019241f7-6f45-72fd-a574-jksit83j1ks2',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0,  contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-10-25T11:34:00.000Z',
        extendedStatus: null,
        seenSinceLastUpdate: [
            {
                id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
                seenAt: '2024-09-30T11:36:01.572Z',
                seenBy: {
                    actorType: null,
                    actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
                    actorName: 'SØSTER FANTASIFULL 2024',
                },
                isCurrentEndUser: true,
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
                        value: 'This has a sender name defined',
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'sender name is defined',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: {
                mediaType: "text/plain",
                value: [
                    {
                        value: "SENDER NAME Oslo Kommune",
                        languageCode: "nb"
                    },
                    {
                        value: "SENDER NAME Oslo Kommune ENG",
                        languageCode: "en"
                    }
                ]
            },
            extendedStatus: null,
        },
    },
]

