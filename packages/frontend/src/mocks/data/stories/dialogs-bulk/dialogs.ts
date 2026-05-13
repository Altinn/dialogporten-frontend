import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

const TOTAL_DIALOGS = 145;

const orgs = ['skd', 'nav', 'dibk', 'ssb', 'svv', 'ok', 'fors', 'brreg', 'udir', 'hdir'];

const statuses = [
  DialogStatus.RequiresAttention,
  DialogStatus.Awaiting,
  DialogStatus.NotApplicable,
  DialogStatus.Completed,
  DialogStatus.Draft,
];

const systemLabels = [
  [SystemLabel.Default],
  [SystemLabel.Default, SystemLabel.Sent],
  [SystemLabel.Default],
  [SystemLabel.Default],
  [SystemLabel.Default],
];

const titles = [
  'Skattemelding for næringsdrivende',
  'Søknad om dagpenger',
  'Nabovarsel for byggesak',
  'Undersøkelse om arbeidsmiljø',
  'Søknad om førerkort',
  'Melding om endring i folkeregisteret',
  'Krav om erstatning',
  'Søknad om foreldrepenger',
  'Klage på vedtak',
  'Innrapportering av merverdiavgift',
  'Melding om bruksendring',
  'Søknad om utsettelse',
  'Bekreftelse på registrering',
  'Varsel om kontroll',
  'Søknad om bostøtte',
  'Melding om konkurs',
  'Søknad om fritak',
  'Innkalling til møte',
  'Rapport om arbeidsskade',
  'Søknad om tilskudd',
];

const summaries = [
  'Skattemeldingen din er klar til innsending.',
  'Søknaden din er mottatt og er under behandling.',
  'Du har mottatt et nabovarsel som krever svar.',
  'Du er invitert til å delta i en undersøkelse.',
  'Søknaden om førerkort er registrert.',
  'Endringen i folkeregisteret er registrert.',
  'Kravet om erstatning er under vurdering.',
  'Søknaden om foreldrepenger er mottatt.',
  'Klagen din er mottatt og vil bli behandlet.',
  'Frist for innrapportering nærmer seg.',
  'Meldingen om bruksendring er registrert.',
  'Søknaden om utsettelse er til behandling.',
  'Registreringen din er bekreftet.',
  'Du har mottatt et varsel om kontroll.',
  'Søknaden om bostøtte er mottatt.',
  'Melding om konkurs er registrert i registeret.',
  'Søknaden om fritak er til vurdering.',
  'Du er innkalt til møte. Se detaljer.',
  'Rapporten om arbeidsskade er mottatt.',
  'Søknaden om tilskudd er under behandling.',
];

function generateUUID(index: number): string {
  const hex = index.toString(16).padStart(12, '0');
  return `019241f7-bulk-0000-0000-${hex}`;
}

function generateDialog(index: number): SearchDialogFieldsFragment {
  const titleIndex = index % titles.length;
  const dialogNumber = index + 1;
  const org = orgs[index % orgs.length];
  const status = statuses[index % statuses.length];
  const labels = systemLabels[index % systemLabels.length];

  const baseDate = new Date(2024, 0, 1);
  const createdDate = new Date(baseDate.getTime() - index * 3_600_000 * 6);
  const updatedDate = new Date(createdDate.getTime() + 86_400_000 * (index % 30));

  const seen = index % 3 === 0;

  return {
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    id: generateUUID(index),
    endUserContext: {
      systemLabels: labels,
    },
    party: 'urn:altinn:person:identifier-no:1',
    org,
    progress: null,
    isContentSeen: index % 4 !== 0,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    contentUpdatedAt: updatedDate.toISOString(),
    guiAttachmentCount: index % 5,
    status,
    createdAt: createdDate.toISOString(),
    seenSinceLastContentUpdate: seen
      ? [
          {
            id: `seen-${generateUUID(index)}`,
            seenAt: updatedDate.toISOString(),
            seenBy: {
              actorType: null,
              actorId: 'urn:altinn:person:identifier-ephemeral:2b34ab491b',
              actorName: 'TESTESEN TEST',
            },
            isCurrentEndUser: true,
          },
        ]
      : [],
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: `${titles[titleIndex]} #${dialogNumber}`,
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: summaries[titleIndex],
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
  };
}

function generateDialogs(total: number = TOTAL_DIALOGS): SearchDialogFieldsFragment[] {
  const result: SearchDialogFieldsFragment[] = [];
  for (let i = 0; i < total; i++) {
    result.push(generateDialog(i));
  }
  return result;
}

export const dialogs: SearchDialogFieldsFragment[] = generateDialogs();
