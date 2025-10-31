import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { dialogs as baseDialogs } from '../../base/dialogs'

const organizationsDialogs: SearchDialogFieldsFragment[] = [
    {
        serviceResource: 'default',
        seenSinceLastContentUpdate: [],
        id: '019241f7-6f45-72fd-abcd-whydoesitnot',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-no:1',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false,
        fromServiceOwnerTransmissionsCount: 0,
        fromPartyTransmissionsCount: 0,
        contentUpdatedAt: "2024-11-27T15:36:52.131Z",
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: `This is a message 1 for Firma AS`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Message 1 for Firma AS summary',
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
        seenSinceLastContentUpdate: [],
        id: '019241f7-6f45-72fd-abcd-nowitworksfi',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-no:2',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false,
        fromServiceOwnerTransmissionsCount: 0,
        fromPartyTransmissionsCount: 0,
        contentUpdatedAt: "2024-11-27T15:36:52.131Z",
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: `This is a message 1 for Testbedrift AS`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Message 1 for Testbedrift AS summary',
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
        seenSinceLastContentUpdate: [],
        id: '019241f7-6f45-72fd-abcd-nowitworksfi',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-sub:1',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false,
        fromServiceOwnerTransmissionsCount: 0,
        fromPartyTransmissionsCount: 0,
        contentUpdatedAt: "2024-11-27T15:36:52.131Z",
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: `This is a message 1 for Testbedrift AS sub party AVD SUB`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Message 1 for Testbedrift AS sub party AVD SUB',
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
        seenSinceLastContentUpdate: [],
        id: '019241f7-6f45-72fd-abcd-nowitworksfi',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:organization:identifier-sub:1',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false,
        fromServiceOwnerTransmissionsCount: 0,
        fromPartyTransmissionsCount: 0,
        contentUpdatedAt: "2024-11-27T15:36:52.131Z",
        guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: `This is a message 2 for Testbedrift AS sub party AVD SUB`,
                        languageCode: 'nb',
                    }
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Message 2 for Testbedrift AS sub party AVD SUB',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    }
]

export const dialogs: SearchDialogFieldsFragment[] = [
    ...organizationsDialogs,
    ...baseDialogs
]

