export type ForwardingMock = 'allowed' | 'notAllowed' | 'attachmentsExceedMaxLimit';

export interface ForwardingScenario {
  title: string;
  summary: string;
  forwarding: ForwardingMock;
  attachmentCount: number;
}

export const forwardingScenarios: Record<string, ForwardingScenario> = {
  '019241f7-f0a0-7000-8000-000000000001': {
    title: 'Videresending: 1 vedlegg',
    summary: 'Kan videresendes. «Inkluder 1 vedlegg» er huket av som standard.',
    forwarding: 'allowed',
    attachmentCount: 1,
  },
  '019241f7-f0a0-7000-8000-000000000002': {
    title: 'Videresending: 3 vedlegg',
    summary: 'Kan videresendes. «Inkluder 3 vedlegg» er huket av som standard.',
    forwarding: 'allowed',
    attachmentCount: 3,
  },
  '019241f7-f0a0-7000-8000-000000000003': {
    title: 'Videresending: vedlegg over 10 MB',
    summary:
      'Vedleggene er til sammen over 10 MB. Ingen avkrysningsboks, men en advarsel om at bare meldingen blir videresendt.',
    forwarding: 'attachmentsExceedMaxLimit',
    attachmentCount: 2,
  },
  '019241f7-f0a0-7000-8000-000000000004': {
    title: 'Videresending: uten vedlegg',
    summary: 'Kan videresendes. Avkrysningsboksen for vedlegg vises ikke.',
    forwarding: 'allowed',
    attachmentCount: 0,
  },
  '019241f7-f0a0-7000-8000-000000000005': {
    title: 'Videresending: ikke tillatt',
    summary: 'Taushetsbelagt melding. Viser at videresending ikke er mulig.',
    forwarding: 'notAllowed',
    attachmentCount: 1,
  },
  '019241f7-f0a0-7000-8000-000000000006': {
    title: 'Videresending: feilmeldinger',
    summary:
      'Videresend til allerede.videresendt@, ikke.lest@, ugyldig.melding@, ugyldig.adresse@ eller feil@ (valgfritt domene) for å se feilmeldingene. Flere adresser gir flere feil samtidig.',
    forwarding: 'allowed',
    attachmentCount: 1,
  },
};
