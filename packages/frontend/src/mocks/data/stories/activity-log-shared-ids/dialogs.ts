import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { dialogWithSharedActivityAndTransmissionId } from '../../base/helper.ts';

export const dialogs: SearchDialogFieldsFragment[] = [
  {
    hasUnopenedContent: false,
    serviceResource: 'urn:altinn:resource:app_ttd_testdriver-for-arbeidsflate',
    serviceResourceType: 'altinnapp',
    id: dialogWithSharedActivityAndTransmissionId,
    endUserContext: {
      systemLabels: [SystemLabel.Archive, SystemLabel.Sent],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ttd',
    progress: null,
    isContentSeen: true,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 1,
    contentUpdatedAt: '2026-03-18T14:22:05.085744Z',
    guiAttachmentCount: 0,
    status: DialogStatus.Awaiting,
    createdAt: '2026-03-18T14:21:39.705511Z',
    dueAt: null,
    seenSinceLastContentUpdate: [
      {
        id: '019d0153-455d-7134-8039-680969f032fa',
        seenAt: '2026-03-18T14:22:07.709298Z',
        seenBy: {
          actorType: null,
          actorId: 'urn:altinn:person:identifier-ephemeral:9587188c95',
          actorName: 'NITROGEN LEKKER',
        },
        isCurrentEndUser: true,
      },
    ],
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Dialog title of the test driver', languageCode: 'en' },
          { value: 'Testdriverens dialogtittel', languageCode: 'nb' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'The submission has been automatically checked and forwarded, awaiting final confirmation.',
            languageCode: 'en',
          },
          {
            value: 'Innsendingen er maskinelt kontrollert og formidlet, venter på endelig bekreftelse.',
            languageCode: 'nb',
          },
          {
            value: 'Innsendinga er maskinelt kontrollert og formidla, ventar på endeleg stadfesting.',
            languageCode: 'nn',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  },
];
