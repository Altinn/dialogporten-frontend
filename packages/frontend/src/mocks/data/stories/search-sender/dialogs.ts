import { ActorType, DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
export const dialogs: SearchDialogFieldsFragment[] = [
    {
        seenSinceLastContentUpdate: [],
        id: '1',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'nav',
        progress: null,
        hasUnopenedContent: false, contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-23T23:00:00.000Z',
        extendedStatus: null,
        seenSinceLastUpdate: [
            {
                id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
                seenAt: '2024-09-30T11:36:01.572Z',
                seenBy: {
                    actorType: null,
                    actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
                    actorName: 'USER TODAY',
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
                        value: `test1 NAV`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Nav Lorem Ipsum',
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
        id: '2',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'skd',
        progress: null,
        hasUnopenedContent: false, contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-23T23:00:00.000Z',
        extendedStatus: null,
        seenSinceLastUpdate: [
            {
                id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
                seenAt: '2024-09-30T11:36:01.572Z',
                seenBy: {
                    actorType: null,
                    actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
                    actorName: 'USER TODAY',
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
                        value: `test1 skatt`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Skatt1 Lorem Ipsum',
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
        id: '3',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'skd',
        progress: null,
        hasUnopenedContent: false, contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-23T23:00:00.000Z',
        extendedStatus: null,
        seenSinceLastUpdate: [
            {
                id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
                seenAt: '2024-09-30T11:36:01.572Z',
                seenBy: {
                    actorType: null,
                    actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
                    actorName: 'USER TODAY',
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
                        value: `test2 skatt`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Skatt2 Lorem Ipsum',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
]
