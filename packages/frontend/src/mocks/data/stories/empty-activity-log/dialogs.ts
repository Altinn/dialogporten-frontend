import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

export const dialogs: SearchDialogFieldsFragment[] = [
  {
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-8218-7756-be82-emptyactivitylog',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
    progress: null,
    isContentSeen: true,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    guiAttachmentCount: 0,
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-05-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Dialog med tom aktivitetslogg',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Denne dialogen har verken aktiviteter, forsendelser eller varsler.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
];
