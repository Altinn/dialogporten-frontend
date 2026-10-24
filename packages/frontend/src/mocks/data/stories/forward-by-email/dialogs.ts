import { DialogStatus, SystemLabel } from 'bff-types-generated';
import { type ForwardingMock, type MockDialog, mockAttachment, mockDialog } from '../../base/mockDialog.ts';

interface ForwardingScenario {
  id: string;
  title: string;
  summary: string;
  forwarding: ForwardingMock;
  attachmentCount: number;
}

const forwardingScenarios: ForwardingScenario[] = [
  {
    id: '019241f7-f0a0-7000-8000-000000000001',
    title: 'Videresending: 1 vedlegg',
    summary: 'Kan videresendes. «Inkluder 1 vedlegg» er huket av som standard.',
    forwarding: 'allowed',
    attachmentCount: 1,
  },
  {
    id: '019241f7-f0a0-7000-8000-000000000002',
    title: 'Videresending: 3 vedlegg',
    summary: 'Kan videresendes. «Inkluder 3 vedlegg» er huket av som standard.',
    forwarding: 'allowed',
    attachmentCount: 3,
  },
  {
    id: '019241f7-f0a0-7000-8000-000000000003',
    title: 'Videresending: vedlegg over 10 MB',
    summary:
      'Vedleggene er til sammen over 10 MB. Ingen avkrysningsboks, men en advarsel om at bare meldingen blir videresendt.',
    forwarding: 'attachmentsExceedMaxLimit',
    attachmentCount: 2,
  },
  {
    id: '019241f7-f0a0-7000-8000-000000000004',
    title: 'Videresending: uten vedlegg',
    summary: 'Kan videresendes. Avkrysningsboksen for vedlegg vises ikke.',
    forwarding: 'allowed',
    attachmentCount: 0,
  },
  {
    id: '019241f7-f0a0-7000-8000-000000000005',
    title: 'Videresending: ikke tillatt',
    summary: 'Taushetsbelagt melding. Viser at videresending ikke er mulig.',
    forwarding: 'notAllowed',
    attachmentCount: 1,
  },
  {
    id: '019241f7-f0a0-7000-8000-000000000006',
    title: 'Videresending: feilmeldinger',
    summary:
      'Videresend til allerede.videresendt@, ikke.lest@, ugyldig.melding@, ugyldig.adresse@ eller feil@ (valgfritt domene) for å se feilmeldingene. Flere adresser gir flere feil samtidig.',
    forwarding: 'allowed',
    attachmentCount: 1,
  },
];

export const dialogs: MockDialog[] = forwardingScenarios.map(
  ({ id, title, summary, forwarding, attachmentCount }, index) => {
    const updatedAt = new Date(Date.UTC(2024, 10, 30 - index, 10)).toISOString();
    return mockDialog({
      hasUnopenedContent: false,
      serviceResource: 'default',
      serviceResourceType: 'correspondenceservice',
      seenSinceLastContentUpdate: [],
      id,
      endUserContext: {
        systemLabels: [SystemLabel.Default],
      },
      party: 'urn:altinn:person:identifier-no:1',
      org: 'digdir',
      progress: null,
      isContentSeen: true,
      contentUpdatedAt: updatedAt,
      status: DialogStatus.RequiresAttention,
      createdAt: updatedAt,
      dueAt: null,
      content: {
        title: {
          mediaType: 'text/plain',
          value: [{ value: title, languageCode: 'nb' }],
        },
        summary: {
          mediaType: 'text/plain',
          value: [{ value: summary, languageCode: 'nb' }],
        },
        senderName: null,
        extendedStatus: null,
      },
      attachments: Array.from({ length: attachmentCount }, (_, attachmentIndex) => mockAttachment(id, attachmentIndex)),
      forwarding,
    });
  },
);
