import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  type DialogActivityFragment,
  DialogStatus,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const serviceOwner = { actorType: ActorType.ServiceOwner, actorId: null, actorName: null };
const party = { actorType: ActorType.PartyRepresentative, actorId: null, actorName: 'NORDMANN KARI' };

const transmissionOpened = (transmissionId: string, createdAt: string): DialogActivityFragment => ({
  id: `${transmissionId}-opened`,
  performedBy: party,
  transmissionId,
  type: ActivityType.TransmissionOpened,
  description: [],
  createdAt,
});

export const dialogs: MockDialog[] = [
  mockDialog({
    id: '019a2b3c-4d5e-7f60-8a1b-2c3d4e5f6a7b',
    org: 'nav',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-09-28T06:17:00.000Z',
    contentUpdatedAt: '2026-10-04T06:17:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Navigasjonshandlinger i forsendelser', languageCode: 'nb' },
          { value: 'Navigational actions in transmissions', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Det er på tide å sende inn et par ting.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [],
    activities: [
      {
        id: '019a2b3c-4d5e-7f60-8a1b-0000000000c1',
        performedBy: serviceOwner,
        transmissionId: null,
        type: ActivityType.DialogCreated,
        description: [],
        createdAt: '2026-09-28T06:17:00.000Z',
      },
      transmissionOpened('019a2b3c-4d5e-7f60-8a1b-000000000003', '2026-09-28T08:00:00.000Z'),
      transmissionOpened('019a2b3c-4d5e-7f60-8a1b-000000000002', '2026-10-01T08:00:00.000Z'),
      transmissionOpened('019a2b3c-4d5e-7f60-8a1b-000000000001', '2026-10-04T08:00:00.000Z'),
    ],
    transmissions: [
      {
        id: '019a2b3c-4d5e-7f60-8a1b-000000000001',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-04T06:17:00.000Z',
        type: TransmissionType.Request,
        sender: serviceOwner,
        content: {
          title: {
            value: [
              { value: 'På tide å utføre en oppgave', languageCode: 'nb' },
              { value: 'Time to complete a task', languageCode: 'en' },
            ],
            mediaType: 'text/plain',
          },
          summary: {
            value: [{ value: 'Se detaljer i vedlegget og bruk knappene under.', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          contentReference: null,
        },
        attachments: [
          {
            id: '019a2b3c-4d5e-7f60-8a1b-0000000000a1',
            displayName: [{ value: 'Dokument.pdf', languageCode: 'nb' }],
            expiresAt: null,
            urls: [
              {
                id: '019a2b3c-4d5e-7f60-8a1b-0000000000b1',
                url: 'https://info.altinn.no/om-altinn/',
                consumerType: AttachmentUrlConsumer.Gui,
                mediaType: 'application/pdf',
              },
            ],
          },
        ],
        navigationalActions: [
          {
            title: [
              { value: 'Gå til kvitteringsvisning', languageCode: 'nb' },
              { value: 'Go to receipt', languageCode: 'en' },
            ],
            url: 'https://info.altinn.no/',
            expiresAt: null,
          },
          {
            title: [
              { value: 'Se vedtaket', languageCode: 'nb' },
              { value: 'See the decision', languageCode: 'en' },
            ],
            url: 'urn:dialogporten:unauthorized',
            expiresAt: null,
          },
          {
            title: [
              { value: 'Fyll ut skjema', languageCode: 'nb' },
              { value: 'Fill in form', languageCode: 'en' },
            ],
            url: 'urn:dialogporten:expired',
            expiresAt: '2026-10-06T00:00:00.000Z',
          },
        ],
      },
      {
        id: '019a2b3c-4d5e-7f60-8a1b-000000000002',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-01T06:17:00.000Z',
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        content: {
          title: {
            value: [{ value: 'Kvittering for innsending', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: null,
        },
        attachments: [],
        navigationalActions: [
          {
            title: [{ value: 'Åpne kvitteringen', languageCode: 'nb' }],
            url: 'https://info.altinn.no/',
            expiresAt: null,
          },
        ],
      },
      {
        id: '019a2b3c-4d5e-7f60-8a1b-000000000003',
        relatedTransmissionId: null,
        isAuthorized: false,
        createdAt: '2026-09-28T06:17:00.000Z',
        type: TransmissionType.Information,
        sender: serviceOwner,
        content: {
          title: {
            value: [{ value: 'Forsendelse uten tilgang', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: null,
        },
        attachments: [],
        navigationalActions: [
          {
            title: [{ value: 'Se saken', languageCode: 'nb' }],
            url: 'urn:dialogporten:unauthorized',
            expiresAt: null,
          },
        ],
      },
    ],
  }),
];
