import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

// Preview at: ?mock=true&playwrightId=transmissions-without-activities
// The dialog id is the one `getMockedActivities` returns an empty list for, so this story covers
// a dialog that carries transmissions but no activity history at all.
export const dialogs: SearchDialogFieldsFragment[] = [
  {
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-8218-7756-be82-noactivities',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
    progress: null,
    isContentSeen: true,
    fromServiceOwnerTransmissionsCount: 1,
    fromPartyTransmissionsCount: 1,
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
            value: 'Dialog uten aktivitetslogg',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Denne dialogen har forsendelser, men ingen aktiviteter.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
];
