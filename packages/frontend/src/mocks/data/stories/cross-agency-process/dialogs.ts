import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import {
  BAKERY_PARTY,
  DIALOG_IDS,
  daysAgo,
  kari,
  martin,
  plainText,
  previousMonth,
  previousQuarter,
  TIMELINE,
} from './shared.ts';

type SeenBy = SearchDialogFieldsFragment['seenSinceLastContentUpdate'][number];

const seenBy = (id: string, actor: typeof kari, seenAt: string, isCurrentEndUser: boolean): SeenBy => ({
  id,
  seenAt,
  seenBy: { actorType: null, actorId: actor.actorId, actorName: actor.actorName },
  isCurrentEndUser,
});

const dialog = ({
  id,
  org,
  service,
  title,
  summary,
  status,
  extendedStatus,
  createdAt,
  contentUpdatedAt,
  dueAt = null,
  seen = [],
  received,
  sent,
  attachments = 0,
}: {
  id: string;
  org: string;
  service: string;
  title: string;
  summary: string;
  status: DialogStatus;
  extendedStatus?: string;
  createdAt: string;
  contentUpdatedAt: string;
  dueAt?: string | null;
  seen?: SeenBy[];
  received: number;
  sent: number;
  attachments?: number;
}): SearchDialogFieldsFragment => ({
  id,
  org,
  party: BAKERY_PARTY,
  serviceResource: `urn:altinn:resource:${service}`,
  serviceResourceType: 'genericaccessresource',
  endUserContext: { systemLabels: [SystemLabel.Default] },
  progress: null,
  hasUnopenedContent: false,
  isContentSeen: seen.some((entry) => entry.isCurrentEndUser),
  seenSinceLastContentUpdate: seen,
  fromServiceOwnerTransmissionsCount: received,
  fromPartyTransmissionsCount: sent,
  guiAttachmentCount: attachments,
  status,
  createdAt,
  contentUpdatedAt,
  dueAt,
  content: {
    title: plainText(title),
    summary: plainText(summary),
    senderName: null,
    extendedStatus: extendedStatus ? plainText(extendedStatus) : null,
  },
});

const aMeldingPeriod = previousMonth(TIMELINE.aMelding.submitted);
const statisticsPeriod = previousQuarter();

export const dialogs: SearchDialogFieldsFragment[] = [
  dialog({
    id: DIALOG_IDS.sickPay,
    org: 'nav',
    service: 'nav-sykepenger-arbeidsgiver',
    title: 'Sykepenger for Jonas Lie',
    summary: 'Jonas Lie har søkt om sykepenger. Send inntektsmelding, så kan vi beregne og utbetale sykepengene.',
    status: DialogStatus.RequiresAttention,
    extendedStatus: 'Venter på inntektsmelding',
    createdAt: TIMELINE.sickPay.sickNote,
    contentUpdatedAt: TIMELINE.sickPay.request,
    dueAt: TIMELINE.sickPay.due,
    received: 3,
    sent: 0,
  }),
  dialog({
    id: DIALOG_IDS.foodInspection,
    org: 'mat',
    service: 'mat-tilsyn-naeringsmiddelvirksomhet',
    title: 'Inspeksjonsrapport etter tilsyn',
    summary:
      'Tilsynet ga strekmunn. Dere må rette merkingen av allergener i disken og gi tilbakemelding til Mattilsynet innen fristen.',
    status: DialogStatus.RequiresAttention,
    extendedStatus: 'Pålegg om retting',
    createdAt: TIMELINE.foodInspection.registration,
    contentUpdatedAt: TIMELINE.foodInspection.report,
    dueAt: TIMELINE.foodInspection.due,
    seen: [seenBy('0199c6a2-5c10-7a01-9b02-000000000201', martin, daysAgo(3, 15, 10), false)],
    received: 2,
    sent: 1,
    attachments: 1,
  }),
  dialog({
    id: DIALOG_IDS.statistics,
    org: 'ssb',
    service: 'ssb-omsetningsstatistikk',
    title: `Omsetningsstatistikk for ${statisticsPeriod.quarter}. kvartal ${statisticsPeriod.year}`,
    summary:
      'Sagene Bakeri AS er trukket ut til å rapportere omsetning til SSB. Rapporteringen er pålagt og tar om lag ti minutter.',
    status: DialogStatus.RequiresAttention,
    createdAt: TIMELINE.statistics.request,
    contentUpdatedAt: TIMELINE.statistics.request,
    dueAt: TIMELINE.statistics.due,
    received: 1,
    sent: 0,
  }),
  dialog({
    id: DIALOG_IDS.outdoorSeating,
    org: 'ok',
    service: 'ok-uteservering',
    title: 'Søknad om uteservering',
    summary:
      'Søknaden om uteservering på fortauet utenfor bakeriet er mottatt. Forventet saksbehandlingstid er seks uker.',
    status: DialogStatus.Awaiting,
    extendedStatus: 'Under behandling',
    createdAt: TIMELINE.outdoorSeating.submitted,
    contentUpdatedAt: TIMELINE.outdoorSeating.receipt,
    seen: [seenBy('0199c6a2-5c10-7a01-9b02-000000000401', kari, daysAgo(9, 14, 6), true)],
    received: 1,
    sent: 1,
  }),
  dialog({
    id: DIALOG_IDS.aMelding,
    org: 'skd',
    service: 'skd-a-melding',
    title: `A-melding for ${aMeldingPeriod.name} ${aMeldingPeriod.year}`,
    summary: 'A-meldingen er mottatt og godkjent. Opplysningene om lønn og arbeidsforhold er delt med NAV og SSB.',
    status: DialogStatus.Completed,
    extendedStatus: 'Godkjent',
    createdAt: TIMELINE.aMelding.submitted,
    contentUpdatedAt: TIMELINE.aMelding.feedback,
    seen: [seenBy('0199c6a2-5c10-7a01-9b02-000000000501', kari, daysAgo(14, 8, 15), true)],
    received: 1,
    sent: 1,
  }),
  dialog({
    id: DIALOG_IDS.vehicle,
    org: 'svv',
    service: 'svv-eierskifte-kjoretoy',
    title: 'Eierskifte av varebil EL 48213',
    summary: 'Eierskiftet er registrert, og Sagene Bakeri AS står nå som eier av varebilen.',
    status: DialogStatus.Completed,
    extendedStatus: 'Registrert',
    createdAt: TIMELINE.vehicle.request,
    contentUpdatedAt: TIMELINE.vehicle.registered,
    seen: [seenBy('0199c6a2-5c10-7a01-9b02-000000000601', kari, daysAgo(22, 12, 40), true)],
    received: 2,
    sent: 1,
  }),
  dialog({
    id: DIALOG_IDS.servingLicence,
    org: 'ok',
    service: 'ok-serveringsbevilling',
    title: 'Søknad om serveringsbevilling',
    summary: 'Søknaden er innvilget. Sagene Bakeri AS har fått serveringsbevilling, og vedtaket ligger vedlagt.',
    status: DialogStatus.Completed,
    extendedStatus: 'Innvilget',
    createdAt: TIMELINE.servingLicence.submitted,
    contentUpdatedAt: TIMELINE.servingLicence.decision,
    seen: [
      seenBy('0199c6a2-5c10-7a01-9b02-000000000701', kari, daysAgo(35, 12, 26), true),
      seenBy('0199c6a2-5c10-7a01-9b02-000000000702', martin, daysAgo(34, 8, 3), false),
    ],
    received: 3,
    sent: 2,
    attachments: 1,
  }),
  dialog({
    id: DIALOG_IDS.vatRegistration,
    org: 'skd',
    service: 'skd-merverdiavgiftsregisteret',
    title: 'Registrering i Merverdiavgiftsregisteret',
    summary: 'Sagene Bakeri AS er registrert i Merverdiavgiftsregisteret og skal levere mva-melding annenhver måned.',
    status: DialogStatus.Completed,
    extendedStatus: 'Registrert',
    createdAt: TIMELINE.vatRegistration.received,
    contentUpdatedAt: TIMELINE.vatRegistration.decision,
    seen: [seenBy('0199c6a2-5c10-7a01-9b02-000000000801', kari, daysAgo(46, 11, 2), true)],
    received: 2,
    sent: 2,
  }),
  dialog({
    id: DIALOG_IDS.companyRegistration,
    org: 'brg',
    service: 'brg-samordnet-registermelding',
    title: 'Registrering av nytt aksjeselskap',
    summary:
      'Sagene Bakeri AS er registrert i Enhetsregisteret og Foretaksregisteret med organisasjonsnummer 313 507 648. Firmaattesten ligger vedlagt.',
    status: DialogStatus.Completed,
    extendedStatus: 'Registrert',
    createdAt: TIMELINE.companyRegistration.submitted,
    contentUpdatedAt: TIMELINE.companyRegistration.registered,
    seen: [
      seenBy('0199c6a2-5c10-7a01-9b02-000000000901', kari, daysAgo(66, 13, 5), true),
      seenBy('0199c6a2-5c10-7a01-9b02-000000000902', martin, daysAgo(66, 19, 48), false),
    ],
    received: 2,
    sent: 2,
    attachments: 1,
  }),
];
