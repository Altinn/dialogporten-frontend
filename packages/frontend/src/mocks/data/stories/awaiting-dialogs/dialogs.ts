import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { dialogs as baseDialogs } from '../../base/dialogs'

const dialogsWithStatusAwaiting: SearchDialogFieldsFragment[] = [
    {
        serviceResource: 'default',
        id: '019241f7-6f45-72fd-abcd-today83j1ks2',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'ok',
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: '2024-05-23T23:00:00.000Z', guiAttachmentCount: 1,
        status: DialogStatus.Awaiting,
        createdAt: '2024-05-23T23:00:00.000Z',
        extendedStatus: null,
        seenSinceLastContentUpdate: [],
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: `Mock Dialog Awaiting`,
                        languageCode: 'nb',
                    }
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
        serviceResource: 'default',
        id: '019241f7-6f45-72fd-a574-jksit83j1ks2',
        endUserContext: {
            systemLabels: [SystemLabel.Default],
        },
        party: 'urn:altinn:person:identifier-no:1',
        org: 'ok',
        seenSinceLastContentUpdate: [],
        progress: null,
        hasUnopenedContent: false, fromServiceOwnerTransmissionsCount: 0, fromPartyTransmissionsCount: 0, contentUpdatedAt: '2024-05-23T23:00:00.000Z', guiAttachmentCount: 1,
        status: DialogStatus.RequiresAttention,
        createdAt: '2024-05-23T23:00:00.000Z',
        extendedStatus: null,
        content: {
            title: {
                mediaType: 'text/plain',
                value: [
                    {
                        value: 'Melding om bortkjøring av snø i 2024',
                        languageCode: 'nb',
                    },
                    {
                        value: 'Notification of snow removal in 2024',
                        languageCode: 'en',
                    },
                ],
            },
            summary: {
                mediaType: 'text/plain',
                value: [
                    {
                        value:
                            'Melding om bortkjøring av snø i 2024 Oslo kommune til Test Testesen Melding om',
                        languageCode: 'nb',
                    },
                ],
            },
            senderName: null,
            extendedStatus: null,
        },
    },
]

export const dialogs: SearchDialogFieldsFragment[] = [
    ...dialogsWithStatusAwaiting,
    ...baseDialogs
]

