import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { dialogWithSearchableTransmissions } from '../../base/helper.ts';

export const dialogs: SearchDialogFieldsFragment[] = [
  {
    hasUnopenedContent: false,
    serviceResource: 'urn:altinn:resource:app_ttd_tryggvirksomhet',
    serviceResourceType: 'altinnapp',
    id: dialogWithSearchableTransmissions,
    endUserContext: {
      systemLabels: [SystemLabel.Archive, SystemLabel.Sent],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ttd',
    progress: 10,
    isContentSeen: true,
    fromServiceOwnerTransmissionsCount: 6,
    fromPartyTransmissionsCount: 2,
    contentUpdatedAt: '2026-06-26T08:07:24.063953Z',
    guiAttachmentCount: 1,
    status: DialogStatus.InProgress,
    createdAt: '2026-06-26T08:07:24.063953Z',
    dueAt: null,
    seenSinceLastContentUpdate: [],
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'VassenDialog', languageCode: 'en' },
          { value: 'VassenDialog', languageCode: 'nb' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'A summary here. Max 200 characters, no HTML support. Required. Displayed in list.',
            languageCode: 'en',
          },
          {
            value: 'Et sammendrag her. Maks 200 tegn, ingen HTML-støtte. Påkrevd. Vises i liste.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
];
