import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogStatus,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { getMockedFCEContent } from '../../base/helper.ts';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const searchableTransmission = (
  id: string,
  type: TransmissionType,
  { title = 'Forsendelsesstittel', summary = 'Transmisjon oppsummering', withContentReference = true } = {},
) => ({
  id,
  isAuthorized: true,
  createdAt: '2026-06-26T08:07:24.063953Z',
  type,
  sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
  relatedTransmissionId: null,
  content: {
    title: {
      value: [
        { value: 'Transmission title', languageCode: 'en' },
        { value: title, languageCode: 'nb' },
      ],
      mediaType: 'text/plain',
    },
    summary: {
      value: [
        { value: 'Transmission summary', languageCode: 'en' },
        { value: summary, languageCode: 'nb' },
      ],
      mediaType: 'text/plain',
    },
    contentReference: withContentReference ? getMockedFCEContent(id) : null,
  },
  attachments: [
    {
      id: `${id}-attachment`,
      displayName: [
        { value: 'Transmission attachment display name', languageCode: 'en' },
        { value: 'Visningsnavn for forsendelsesvedlegg', languageCode: 'nb' },
      ],
      expiresAt: null,
      urls: [
        {
          id: `${id}-attachment-url`,
          url: 'https://info.altinn.no/om-altinn/',
          consumerType: AttachmentUrlConsumer.Gui,
          mediaType: null,
        },
      ],
    },
  ],
});

export const dialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'urn:altinn:resource:app_ttd_tryggvirksomhet',
    serviceResourceType: 'altinnapp',
    id: '019f02f8-22a0-7492-8fe2-74d92d4e5019',
    endUserContext: {
      systemLabels: [SystemLabel.Archive, SystemLabel.Sent],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'ttd',
    progress: 10,
    isContentSeen: true,
    contentUpdatedAt: '2026-06-26T08:07:24.063953Z',
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
    activities: [
      {
        id: '019f02f8-22a0-7492-8fef-fc751b0c7ca3',
        transmissionId: null,
        performedBy: { actorType: ActorType.PartyRepresentative, actorId: null, actorName: 'somename' },
        description: [],
        type: ActivityType.DialogCreated,
        createdAt: '2023-11-16T13:35:44.226849Z',
      },
      {
        id: '019f02f8-22a0-7492-8ffc-b435813ae8a2',
        transmissionId: null,
        performedBy: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
        description: [
          { value: 'Form created and pre-filled', languageCode: 'en' },
          { value: 'Skjema opprettet og forhåndsutfylt', languageCode: 'nb' },
        ],
        type: ActivityType.Information,
        createdAt: '2023-11-16T13:35:44.226849Z',
      },
    ],
    transmissions: [
      searchableTransmission('019f02f8-229a-7591-97c7-2cb62ba4e5e5', TransmissionType.Information),
      searchableTransmission('019f02f8-229a-7591-97c9-a34ef82fd57e', TransmissionType.Acceptance, {
        title: 'Forsendelsetittel',
        summary: 'Forsendelsesoppsummering',
        withContentReference: false,
      }),
      searchableTransmission('019f02f8-229a-7591-97d2-5d91f2799062', TransmissionType.Rejection),
      searchableTransmission('019f02f8-229a-7591-97d5-05f86903a0a9', TransmissionType.Request),
      searchableTransmission('019f02f8-229a-7591-97e2-5345c541a716', TransmissionType.Alert),
      searchableTransmission('019f02f8-229a-7591-97e9-c6bba0dbaaf7', TransmissionType.Decision),
      searchableTransmission('019f02f8-229a-7591-97f3-8f3b33700560', TransmissionType.Submission),
      searchableTransmission('019f02f8-229a-7591-97f5-c01862d82bee', TransmissionType.Correction),
    ],
  }),
];
