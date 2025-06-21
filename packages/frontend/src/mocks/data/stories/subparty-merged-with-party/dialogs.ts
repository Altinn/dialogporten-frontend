import { ActorType, DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';


export const dialogs: SearchDialogFieldsFragment[] = [
    {
        id: '019241f7-6f45-72fd-abcd-whydoesitnot',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-14T23:00:00.000Z',
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
                    value: 'Firma AS mock message 1',
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
                        value: `Message for Test Testesen`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Lorem ipsum',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-whydoesitnot',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-no:2',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-14T23:00:00.000Z',
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
                    value: 'Firma AS mock message 1',
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
                        value: `Main party message`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Main Message for Testbedrift AS',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-asddsaqwe123',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-no:1',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-14T23:00:00.000Z',
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
                    value: 'Firma AS mock message 1',
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
                        value: `Firma AS main message`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Main Message for Firma AS',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-nowitworksfi',
        endUserContext: {
              systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-sub:1',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-14T23:00:00.000Z',
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
                    value: 'Testbedrift AS mock message 1',
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
                        value: `Sub party message`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Sub message for Testbedrift AS',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-nowdsada',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-sub:2',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        updatedAt: '2024-06-14T23:00:00.000Z',
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
                    value: 'Testbedrift AS mock message 1',
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
                        value: `AVD Oslo only message`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Hei hei',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-mycompanyas1',
        endUserContext: {
          systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-mycompanyas-no:3',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-01-01T23:00:00.000Z',
        updatedAt: '2024-01-02T23:00:00.000Z',
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
                    value: 'MyCompany AS main',
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
                        value: `MyCompany AS main`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'MyCompany AS main',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-mycompanyas-sub1',
        endUserContext: {
          systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:id-mycompanyas-sub:1',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-01-01T23:00:00.000Z',
        updatedAt: '2024-01-02T23:00:00.000Z',
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
                    value: 'MyCompany AS main sub1',
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
                        value: `MyCompany AS main sub1`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'MyCompany AS main. Sub company name is same as main company name',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
    {
        id: '019241f7-6f45-72fd-abcd-mycompanyas-sub2',
        endUserContext: {
          systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:id-mycompanyas-sub:2',
        org: 'ok',
        progress: null,
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-02-01T23:00:00.000Z',
        updatedAt: '2024-02-02T23:00:00.000Z',
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
                    value: 'MyCompany AS main sub2 msg',
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
                        value: `MyCompany AS main sub2`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'MyCompany AS sub, name different.',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
]
