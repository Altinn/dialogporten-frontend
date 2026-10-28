import {
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  DialogStatus,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const serviceOwner = { actorType: ActorType.ServiceOwner, actorId: null, actorName: null };

const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const expired = '2025-01-01T00:00:00.000Z';

const attachment = (id: string, name: string, expiresAt: string | null, url: string): AttachmentFieldsFragment => ({
  id,
  displayName: [{ value: name, languageCode: 'nb' }],
  expiresAt,
  urls: [{ id: `${id}-url`, url, consumerType: AttachmentUrlConsumer.Gui, mediaType: 'application/pdf' }],
});

// One of each state: available, expiring, expired, no access, and no access + expired
const attachments = (prefix: string): AttachmentFieldsFragment[] => [
  attachment(`${prefix}-available`, 'Vedtak.pdf', null, 'https://info.altinn.no/om-altinn/'),
  attachment(`${prefix}-expiring`, 'Skatteoppgjør 2025.pdf', inThirtyDays, 'https://info.altinn.no/om-altinn/'),
  attachment(`${prefix}-expired`, 'Kvittering.pdf', expired, 'https://info.altinn.no/om-altinn/'),
  attachment(`${prefix}-unauthorized`, 'Lønnsoppgave.pdf', null, 'urn:dialogporten:unauthorized'),
  attachment(`${prefix}-unauthorized-expired`, 'Bilag til søknad.pdf', expired, 'urn:dialogporten:unauthorized'),
];

export const dialogs: MockDialog[] = [
  mockDialog({
    id: '019a3c4d-5e6f-7a80-9b1c-2d3e4f5a6b7c',
    org: 'skd',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-01T06:00:00.000Z',
    contentUpdatedAt: '2026-10-20T06:00:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Vedlegg med ulik tilgang og utløp', languageCode: 'nb' },
          { value: 'Attachments with different access and expiry', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Vedlegg som er tilgjengelige, utløpte og uten tilgang.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    attachments: attachments('dialog'),
    transmissions: [
      {
        id: '019a3c4d-5e6f-7a80-9b1c-000000000001',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-20T06:00:00.000Z',
        type: TransmissionType.Information,
        sender: serviceOwner,
        content: {
          title: {
            value: [{ value: 'Forsendelse med vedlegg i alle tilstander', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: null,
        },
        attachments: attachments('transmission'),
      },
    ],
  }),
];
