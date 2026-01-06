import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
export const dialogs: SearchDialogFieldsFragment[] = [
    {
        serviceResource: 'default',
        serviceResourceType: 'correspondenceservice',
        seenSinceLastContentUpdate: [],
        id: '1',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'nav',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0,  contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
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
        serviceResource: 'default',
        serviceResourceType: 'correspondenceservice',
        seenSinceLastContentUpdate: [],
        id: '2',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'skd',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0,  contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
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
        serviceResource: 'default',
        serviceResourceType: 'correspondenceservice',
        seenSinceLastContentUpdate: [],
        id: '3',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'skd',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0,  contentUpdatedAt: "2024-11-27T15:36:52.131Z", guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
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
