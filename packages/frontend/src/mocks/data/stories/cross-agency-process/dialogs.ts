import {
  ActivityType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogActivityFragment,
  DialogStatus,
  type GuiActionFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  type SearchDialogFieldsFragment,
  SystemLabel,
  type TransmissionFieldsFragment,
  TransmissionType,
} from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';
import {
  BAKERY_PARTY,
  DIALOG_IDS,
  daysAgo,
  formatDate,
  kari,
  martin,
  nb,
  payrollSystem,
  plainText,
  previousMonth,
  previousQuarter,
  serviceOwner,
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
  ...details
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
} & Pick<
  MockDialog,
  'attachments' | 'transmissions' | 'activities' | 'guiActions' | 'additionalInfo' | 'mainContentMarkdown'
>): MockDialog =>
  mockDialog({
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
    ...details,
  });

type Actor = TransmissionFieldsFragment['sender'];

const pdf = (id: string, name: string, url: string): AttachmentFieldsFragment => ({
  id,
  displayName: nb(name),
  expiresAt: null,
  urls: [{ id: `${id}-url`, url, consumerType: AttachmentUrlConsumer.Gui, mediaType: 'application/pdf' }],
});

const transmission = ({
  id,
  type,
  sender,
  createdAt,
  title,
  summary,
  relatedTo = null,
  attachments = [],
}: {
  id: string;
  type: TransmissionType;
  sender: Actor;
  createdAt: string;
  title: string;
  summary: string;
  relatedTo?: string | null;
  attachments?: AttachmentFieldsFragment[];
}): TransmissionFieldsFragment => ({
  id,
  isAuthorized: true,
  createdAt,
  type,
  sender,
  relatedTransmissionId: relatedTo,
  content: { title: plainText(title), summary: plainText(summary), contentReference: null },
  attachments,
});

const activity = (
  id: string,
  type: ActivityType,
  performedBy: Actor,
  createdAt: string,
  { transmissionId = null, description }: { transmissionId?: string | null; description?: string } = {},
): DialogActivityFragment => ({
  id,
  type,
  performedBy,
  createdAt,
  transmissionId,
  description: description ? nb(description) : [],
});

const link = (id: string, title: string, url: string, priority: GuiActionPriority): GuiActionFieldsFragment => ({
  id,
  url,
  isAuthorized: true,
  isDeleteDialogAction: false,
  action: 'read',
  authorizationAttribute: null,
  priority,
  httpMethod: HttpVerb.Get,
  title: nb(title),
  prompt: null,
});

const aMeldingPeriod = previousMonth(TIMELINE.aMelding.submitted);
const statisticsPeriod = previousQuarter();

const sickPay = (): MockDialog => {
  const t = TIMELINE.sickPay;
  const [sickNote, application, request] = ['t1', 't2', 't3'].map((suffix) => `${DIALOG_IDS.sickPay}-${suffix}`);
  return dialog({
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
    additionalInfo: 'Har du spørsmål om sykepenger, finner du svar for arbeidsgivere på nav.no.',
    mainContentMarkdown: `## Vi trenger inntektsmelding

Jonas Lie har søkt om sykepenger fra NAV. For at vi skal kunne behandle søknaden, må dere som arbeidsgiver sende inntektsmelding.

**Frist:** ${formatDate(t.due)}

### Dette må dere oppgi
- Beregnet månedsinntekt for Jonas Lie
- Arbeidsgiverperioden, det vil si de første 16 dagene av sykefraværet
- Om dere betaler lønn under sykefraværet og ønsker refusjon

Inntektsmeldingen kan sendes fra lønnssystemet eller fra NAVs skjema for arbeidsgivere.`,
    attachments: [],
    transmissions: [
      transmission({
        id: sickNote,
        type: TransmissionType.Information,
        sender: serviceOwner,
        createdAt: t.sickNote,
        title: 'Sykmelding for Jonas Lie',
        summary: `Jonas Lie er sykmeldt 100 prosent fra ${formatDate(t.sickLeaveFrom)} til ${formatDate(t.sickLeaveTo)}.`,
        attachments: [
          pdf(`${sickNote}-a1`, 'Sykmelding – Jonas Lie.pdf', 'https://www.nav.no/arbeidsgiver/sykmelding'),
        ],
      }),
      transmission({
        id: application,
        type: TransmissionType.Information,
        sender: serviceOwner,
        createdAt: t.application,
        title: 'Søknad om sykepenger',
        summary: 'Jonas Lie har sendt søknad om sykepenger for perioden. Søknaden er sendt til NAV og til dere.',
        relatedTo: sickNote,
      }),
      transmission({
        id: request,
        type: TransmissionType.Request,
        sender: serviceOwner,
        createdAt: t.request,
        title: 'Forespørsel om inntektsmelding',
        summary: `Send inntektsmelding innen ${formatDate(t.due)}. Vi bruker opplysningene til å beregne sykepengene.`,
        relatedTo: application,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.sickPay}-a1`, ActivityType.DialogCreated, serviceOwner, t.sickNote),
      activity(`${DIALOG_IDS.sickPay}-a2`, ActivityType.TransmissionOpened, kari, t.sickNote, {
        transmissionId: sickNote,
      }),
      activity(`${DIALOG_IDS.sickPay}-a3`, ActivityType.TransmissionOpened, martin, t.application, {
        transmissionId: application,
      }),
    ],
    guiActions: [
      link(
        'send-inntektsmelding',
        'Send inntektsmelding',
        'https://www.nav.no/arbeidsgiver/inntektsmelding',
        GuiActionPriority.Primary,
      ),
      link(
        'les-om-sykepenger',
        'Les om sykepenger for arbeidsgivere',
        'https://www.nav.no/arbeidsgiver/sykepenger',
        GuiActionPriority.Tertiary,
      ),
    ],
  });
};

const foodInspection = (): MockDialog => {
  const t = TIMELINE.foodInspection;
  const [registration, confirmation, report] = ['t1', 't2', 't3'].map(
    (suffix) => `${DIALOG_IDS.foodInspection}-${suffix}`,
  );
  return dialog({
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
    additionalInfo: 'Resultatet fra tilsynet publiseres på mattilsynet.no.',
    mainContentMarkdown: `## Resultat av tilsynet

Mattilsynet gjennomførte tilsyn hos Sagene Bakeri AS ${formatDate(t.inspection)}. Tilsynet ga resultatet **strekmunn**.

| Tema | Resultat |
| --- | --- |
| Rutiner og ledelse | Ingen anmerkning |
| Lokaler og utstyr | Ingen anmerkning |
| Mathåndtering og tilberedning | Ingen anmerkning |
| Merking og sporbarhet | Regelverksbrudd som krever oppfølging |

### Vedtak om pålegg
Dere må sørge for at kundene får informasjon om allergener i alle uemballerte bakervarer i disken.

**Frist for retting:** ${formatDate(t.due)}

Gi tilbakemelding til Mattilsynet når forholdet er rettet.`,
    attachments: [pdf(`${DIALOG_IDS.foodInspection}-a1`, 'Inspeksjonsrapport.pdf', 'https://www.mattilsynet.no/')],
    transmissions: [
      transmission({
        id: registration,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.registration,
        title: 'Melding om registrering av næringsmiddelvirksomhet',
        summary: 'Sagene Bakeri AS – produksjon og servering av bakervarer.',
      }),
      transmission({
        id: confirmation,
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        createdAt: t.confirmation,
        title: 'Bekreftelse på registrering',
        summary: 'Virksomheten er registrert hos Mattilsynet. Vi kan komme på tilsyn uten forhåndsvarsel.',
        relatedTo: registration,
      }),
      transmission({
        id: report,
        type: TransmissionType.Decision,
        sender: serviceOwner,
        createdAt: t.report,
        title: 'Inspeksjonsrapport med vedtak om pålegg',
        summary: `Tilsynet ga strekmunn. Merk allergener på alle uemballerte varer i disken innen ${formatDate(t.due)}.`,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.foodInspection}-a1`, ActivityType.DialogCreated, kari, t.registration),
      activity(`${DIALOG_IDS.foodInspection}-a2`, ActivityType.FormSubmitted, kari, t.registration),
      activity(`${DIALOG_IDS.foodInspection}-a3`, ActivityType.TransmissionOpened, kari, t.confirmation, {
        transmissionId: confirmation,
      }),
      activity(`${DIALOG_IDS.foodInspection}-a4`, ActivityType.Information, serviceOwner, t.inspection, {
        description: 'Tilsyn gjennomført på stedet.',
      }),
    ],
    guiActions: [
      link(
        'gi-tilbakemelding',
        'Gi tilbakemelding om retting',
        'https://www.mattilsynet.no/',
        GuiActionPriority.Primary,
      ),
    ],
  });
};

const statistics = (): MockDialog => {
  const t = TIMELINE.statistics;
  const { quarter, year } = previousQuarter();
  return dialog({
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
    additionalInfo: 'Opplysningene er underlagt taushetsplikt og brukes bare til statistiske formål.',
    mainContentMarkdown: `## Dere er trukket ut til å rapportere

Statistisk sentralbyrå (SSB) lager statistikk over omsetning i servering og varehandel. Statistikken brukes blant annet til å følge utviklingen i norsk økonomi.

**Periode:** ${quarter}. kvartal ${year}
**Frist:** ${formatDate(t.due)}

### Dette skal dere rapportere
- Samlet omsetning i perioden, uten merverdiavgift
- Fordeling mellom servering og salg av varer

Rapporteringsplikten følger av statistikkloven.`,
    attachments: [],
    transmissions: [
      transmission({
        id: `${DIALOG_IDS.statistics}-t1`,
        type: TransmissionType.Information,
        sender: serviceOwner,
        createdAt: t.request,
        title: 'Pålegg om rapportering',
        summary: `Rapporter omsetningen for ${quarter}. kvartal ${year} innen ${formatDate(t.due)}.`,
      }),
    ],
    activities: [activity(`${DIALOG_IDS.statistics}-a1`, ActivityType.DialogCreated, serviceOwner, t.request)],
    guiActions: [
      link('start-rapportering', 'Start rapportering', 'https://www.ssb.no/innrapportering', GuiActionPriority.Primary),
    ],
  });
};

const outdoorSeating = (): MockDialog => {
  const t = TIMELINE.outdoorSeating;
  const [application, receipt] = ['t1', 't2'].map((suffix) => `${DIALOG_IDS.outdoorSeating}-${suffix}`);
  return dialog({
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
    additionalInfo: 'Du kan ikke starte uteserveringen før søknaden er innvilget.',
    mainContentMarkdown: `## Vi har mottatt søknaden

Søknaden om uteservering for Sagene Bakeri AS er registrert, og saken er sendt til saksbehandler.

**Forventet saksbehandlingstid:** seks uker

Vi tar kontakt hvis vi trenger flere opplysninger.`,
    attachments: [],
    transmissions: [
      transmission({
        id: application,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.submitted,
        title: 'Søknad om uteservering',
        summary: 'Tolv sitteplasser på fortauet utenfor bakeriet. Situasjonsplan er vedlagt.',
        attachments: [pdf(`${application}-a1`, 'Situasjonsplan.pdf', 'https://www.oslo.kommune.no/')],
      }),
      transmission({
        id: receipt,
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        createdAt: t.receipt,
        title: 'Kvittering for mottatt søknad',
        summary: 'Vi har mottatt søknaden og sender svar når den er ferdig behandlet.',
        relatedTo: application,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.outdoorSeating}-a1`, ActivityType.DialogCreated, kari, t.submitted),
      activity(`${DIALOG_IDS.outdoorSeating}-a2`, ActivityType.FormSubmitted, kari, t.submitted),
      activity(`${DIALOG_IDS.outdoorSeating}-a3`, ActivityType.TransmissionOpened, kari, t.receipt, {
        transmissionId: receipt,
      }),
    ],
    guiActions: [link('se-soknaden', 'Se søknaden', 'https://www.oslo.kommune.no/', GuiActionPriority.Secondary)],
  });
};

const aMelding = (): MockDialog => {
  const t = TIMELINE.aMelding;
  const { name, year } = previousMonth(t.submitted);
  const [submission, feedback] = ['t1', 't2'].map((suffix) => `${DIALOG_IDS.aMelding}-${suffix}`);
  return dialog({
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
    additionalInfo: 'Husk å betale forskuddstrekk og arbeidsgiveravgift innen fristen.',
    mainContentMarkdown: `## A-meldingen er godkjent

Vi har mottatt a-meldingen for ${name} ${year} fra Sagene Bakeri AS.

- **Inntektsmottakere:** 3
- **Forskuddstrekk:** 37 800 kroner
- **Arbeidsgiveravgift:** 17 766 kroner

Opplysningene om lønn og arbeidsforhold er delt med NAV og Statistisk sentralbyrå gjennom a-ordningen, slik at dere bare trenger å rapportere én gang.`,
    attachments: [],
    transmissions: [
      transmission({
        id: submission,
        type: TransmissionType.Submission,
        sender: payrollSystem,
        createdAt: t.submitted,
        title: `A-melding for ${name} ${year}`,
        summary: 'Tre inntektsmottakere. Sendt fra lønnssystemet.',
      }),
      transmission({
        id: feedback,
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        createdAt: t.feedback,
        title: 'Tilbakemelding på a-melding',
        summary: 'A-meldingen er godkjent uten avvik.',
        relatedTo: submission,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.aMelding}-a1`, ActivityType.DialogCreated, payrollSystem, t.submitted),
      activity(`${DIALOG_IDS.aMelding}-a2`, ActivityType.FormSubmitted, payrollSystem, t.submitted),
      activity(`${DIALOG_IDS.aMelding}-a3`, ActivityType.TransmissionOpened, kari, t.feedback, {
        transmissionId: feedback,
      }),
    ],
    guiActions: [
      link(
        'les-om-a-meldingen',
        'Les om a-meldingen',
        'https://www.skatteetaten.no/bedrift-og-organisasjon/arbeidsgiver/a-meldingen/',
        GuiActionPriority.Tertiary,
      ),
    ],
  });
};

const vehicle = (): MockDialog => {
  const t = TIMELINE.vehicle;
  const [request, confirmed, registered] = ['t1', 't2', 't3'].map((suffix) => `${DIALOG_IDS.vehicle}-${suffix}`);
  return dialog({
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
    additionalInfo: 'Husk at kjøretøyet må være forsikret fra den dagen dere overtok det.',
    mainContentMarkdown: `## Eierskiftet er registrert

- **Kjøretøy:** Varebil, elektrisk
- **Registreringsnummer:** EL 48213
- **Ny eier:** Sagene Bakeri AS
- **Registrert:** ${formatDate(t.registered)}

Kjøretøyopplysningene er oppdatert, og dere står nå som eier i Motorvognregisteret.`,
    attachments: [],
    transmissions: [
      transmission({
        id: request,
        type: TransmissionType.Request,
        sender: serviceOwner,
        createdAt: t.request,
        title: 'Bekreft kjøp av kjøretøy',
        summary: 'Selger har meldt eierskifte for EL 48213. Bekreft kjøpet for å fullføre eierskiftet.',
      }),
      transmission({
        id: confirmed,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.confirmed,
        title: 'Kjøp bekreftet',
        summary: 'Sagene Bakeri AS bekrefter kjøpet av EL 48213.',
        relatedTo: request,
      }),
      transmission({
        id: registered,
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        createdAt: t.registered,
        title: 'Eierskiftet er registrert',
        summary: `Sagene Bakeri AS er registrert som eier fra ${formatDate(t.registered)}.`,
        relatedTo: confirmed,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.vehicle}-a1`, ActivityType.DialogCreated, serviceOwner, t.request),
      activity(`${DIALOG_IDS.vehicle}-a2`, ActivityType.TransmissionOpened, kari, t.confirmed, {
        transmissionId: request,
      }),
      activity(`${DIALOG_IDS.vehicle}-a3`, ActivityType.FormSubmitted, kari, t.confirmed),
      activity(`${DIALOG_IDS.vehicle}-a4`, ActivityType.TransmissionOpened, kari, t.registered, {
        transmissionId: registered,
      }),
    ],
    guiActions: [
      link('se-kjoretoy', 'Se kjøretøyopplysninger', 'https://www.vegvesen.no/kjoretoy/', GuiActionPriority.Tertiary),
    ],
  });
};

const servingLicence = (): MockDialog => {
  const t = TIMELINE.servingLicence;
  const [application, receipt, request, documentation, decision] = ['t1', 't2', 't3', 't4', 't5'].map(
    (suffix) => `${DIALOG_IDS.servingLicence}-${suffix}`,
  );
  return dialog({
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
    additionalInfo: 'Meld fra til kommunen hvis det blir endringer i eierforhold eller hvem som er styrer.',
    mainContentMarkdown: `## Vedtak: Serveringsbevilling innvilget

Oslo kommune har innvilget søknaden fra Sagene Bakeri AS om serveringsbevilling etter serveringsloven.

- **Bevillingshaver:** Sagene Bakeri AS
- **Styrer:** Kari Hansen
- **Gjelder fra:** ${formatDate(t.decision)}

Før vedtaket ble fattet, innhentet vi uttalelse fra politiet og Skatteetaten. Ingen av dem hadde merknader.

### Klage
Dere kan klage på vedtaket innen tre uker etter at dere mottok det.`,
    attachments: [
      pdf(`${DIALOG_IDS.servingLicence}-a1`, 'Vedtak om serveringsbevilling.pdf', 'https://www.oslo.kommune.no/'),
    ],
    transmissions: [
      transmission({
        id: application,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.submitted,
        title: 'Søknad om serveringsbevilling',
        summary: 'Styrer: Kari Hansen. Serveringsstedet har 24 sitteplasser.',
        attachments: [pdf(`${application}-a1`, 'Leiekontrakt.pdf', 'https://www.oslo.kommune.no/')],
      }),
      transmission({
        id: receipt,
        type: TransmissionType.Acceptance,
        sender: serviceOwner,
        createdAt: t.receipt,
        title: 'Søknaden er mottatt',
        summary: 'Vi innhenter uttalelse fra politiet og Skatteetaten før vi behandler søknaden.',
        relatedTo: application,
      }),
      transmission({
        id: request,
        type: TransmissionType.Request,
        sender: serviceOwner,
        createdAt: t.request,
        title: 'Vi trenger dokumentasjon på bestått etablererprøve',
        summary:
          'Styreren må ha bestått etablererprøven for serveringsvirksomhet. Last opp dokumentasjon innen 14 dager.',
        relatedTo: receipt,
      }),
      transmission({
        id: documentation,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.documentation,
        title: 'Dokumentasjon på bestått etablererprøve',
        summary: 'Kursbevis for etablererprøven er vedlagt.',
        relatedTo: request,
        attachments: [pdf(`${documentation}-a1`, 'Etablererprøven – Kari Hansen.pdf', 'https://www.oslo.kommune.no/')],
      }),
      transmission({
        id: decision,
        type: TransmissionType.Decision,
        sender: serviceOwner,
        createdAt: t.decision,
        title: 'Vedtak om serveringsbevilling',
        summary: `Søknaden er innvilget. Bevillingen gjelder fra ${formatDate(t.decision)}.`,
        relatedTo: documentation,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.servingLicence}-a1`, ActivityType.DialogCreated, kari, t.submitted),
      activity(`${DIALOG_IDS.servingLicence}-a2`, ActivityType.FormSubmitted, kari, t.submitted),
      activity(`${DIALOG_IDS.servingLicence}-a3`, ActivityType.TransmissionOpened, kari, t.receipt, {
        transmissionId: receipt,
      }),
      activity(`${DIALOG_IDS.servingLicence}-a4`, ActivityType.Information, serviceOwner, t.policeStatement, {
        description: 'Uttalelse mottatt fra politiet.',
      }),
      activity(`${DIALOG_IDS.servingLicence}-a5`, ActivityType.TransmissionOpened, kari, t.documentation, {
        transmissionId: request,
      }),
      activity(`${DIALOG_IDS.servingLicence}-a6`, ActivityType.Information, serviceOwner, t.taxStatement, {
        description: 'Uttalelse mottatt fra Skatteetaten.',
      }),
      activity(`${DIALOG_IDS.servingLicence}-a7`, ActivityType.TransmissionOpened, kari, t.decision, {
        transmissionId: decision,
      }),
    ],
    guiActions: [
      link(
        'les-om-serveringsbevilling',
        'Les om serveringsbevilling',
        'https://www.oslo.kommune.no/',
        GuiActionPriority.Tertiary,
      ),
    ],
  });
};

const vatRegistration = (): MockDialog => {
  const t = TIMELINE.vatRegistration;
  const [application, request, documentation, decision] = ['t1', 't2', 't3', 't4'].map(
    (suffix) => `${DIALOG_IDS.vatRegistration}-${suffix}`,
  );
  return dialog({
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
    additionalInfo: 'Søknaden ble sendt til Skatteetaten fra Brønnøysundregistrene via Samordnet registermelding.',
    mainContentMarkdown: `## Dere er registrert i Merverdiavgiftsregisteret

Sagene Bakeri AS er registrert i Merverdiavgiftsregisteret fra ${formatDate(t.decision)}.

### Dette betyr registreringen for dere
- Dere skal beregne merverdiavgift på salg av varer og tjenester.
- Dere kan trekke fra merverdiavgift på innkjøp til virksomheten.
- Mva-meldingen skal leveres annenhver måned.
- På fakturaer skal dere skrive «MVA» etter organisasjonsnummeret.`,
    attachments: [],
    transmissions: [
      transmission({
        id: application,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.received,
        title: 'Søknad om registrering',
        summary: 'Mottatt fra Brønnøysundregistrene via Samordnet registermelding.',
      }),
      transmission({
        id: request,
        type: TransmissionType.Request,
        sender: serviceOwner,
        createdAt: t.request,
        title: 'Vi trenger mer dokumentasjon',
        summary: 'Send kopi av leiekontrakt og fakturaer som viser at virksomheten har startet opp.',
        relatedTo: application,
      }),
      transmission({
        id: documentation,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.documentation,
        title: 'Leiekontrakt og fakturaer',
        summary: 'Leiekontrakt for lokalet og faktura for innkjøp av bakeovn er vedlagt.',
        relatedTo: request,
        attachments: [
          pdf(`${documentation}-a1`, 'Leiekontrakt.pdf', 'https://www.skatteetaten.no/'),
          pdf(`${documentation}-a2`, 'Faktura – bakeovn.pdf', 'https://www.skatteetaten.no/'),
        ],
      }),
      transmission({
        id: decision,
        type: TransmissionType.Decision,
        sender: serviceOwner,
        createdAt: t.decision,
        title: 'Vedtak om registrering',
        summary: `Sagene Bakeri AS er registrert i Merverdiavgiftsregisteret fra ${formatDate(t.decision)}.`,
        relatedTo: documentation,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.vatRegistration}-a1`, ActivityType.DialogCreated, serviceOwner, t.received),
      activity(`${DIALOG_IDS.vatRegistration}-a2`, ActivityType.TransmissionOpened, kari, t.documentation, {
        transmissionId: request,
      }),
      activity(`${DIALOG_IDS.vatRegistration}-a3`, ActivityType.TransmissionOpened, kari, t.decision, {
        transmissionId: decision,
      }),
    ],
    guiActions: [
      link(
        'les-om-mva',
        'Les om mva-meldingen',
        'https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/mva/',
        GuiActionPriority.Tertiary,
      ),
    ],
  });
};

const companyRegistration = (): MockDialog => {
  const t = TIMELINE.companyRegistration;
  const [submission, missingSignature, correction, registered] = ['t1', 't2', 't3', 't4'].map(
    (suffix) => `${DIALOG_IDS.companyRegistration}-${suffix}`,
  );
  return dialog({
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
    additionalInfo: 'Opplysningene om merverdiavgift er sendt videre til Skatteetaten.',
    mainContentMarkdown: `## Sagene Bakeri AS er registrert

Brønnøysundregistrene har registrert foretaket i Enhetsregisteret og Foretaksregisteret.

- **Organisasjonsnummer:** 313 507 648
- **Organisasjonsform:** Aksjeselskap
- **Daglig leder:** Kari Hansen
- **Styreleder:** Martin Haugen
- **Aksjekapital:** 30 000 kroner

Søknaden om registrering i Merverdiavgiftsregisteret er sendt videre til Skatteetaten, som behandler den delen av meldingen.

Firmaattesten ligger vedlagt. Den bekrefter at selskapet er registrert, og hvem som kan signere for det.`,
    attachments: [pdf(`${DIALOG_IDS.companyRegistration}-a1`, 'Firmaattest.pdf', 'https://www.brreg.no/')],
    transmissions: [
      transmission({
        id: submission,
        type: TransmissionType.Submission,
        sender: kari,
        createdAt: t.submitted,
        title: 'Samordnet registermelding',
        summary:
          'Melding om registrering av aksjeselskap i Enhetsregisteret, Foretaksregisteret og Merverdiavgiftsregisteret.',
        attachments: [
          pdf(`${submission}-a1`, 'Stiftelsesdokument.pdf', 'https://www.brreg.no/'),
          pdf(`${submission}-a2`, 'Vedtekter.pdf', 'https://www.brreg.no/'),
        ],
      }),
      transmission({
        id: missingSignature,
        type: TransmissionType.Request,
        sender: serviceOwner,
        createdAt: t.missingSignature,
        title: 'Meldingen mangler signatur',
        summary: 'Stiftelsesdokumentet må signeres av alle stiftere. Martin Haugen har ikke signert.',
        relatedTo: submission,
      }),
      transmission({
        id: correction,
        type: TransmissionType.Correction,
        sender: martin,
        createdAt: t.corrected,
        title: 'Signert stiftelsesdokument',
        summary: 'Stiftelsesdokumentet er nå signert av begge stiftere.',
        relatedTo: missingSignature,
      }),
      transmission({
        id: registered,
        type: TransmissionType.Decision,
        sender: serviceOwner,
        createdAt: t.registered,
        title: 'Foretaket er registrert',
        summary:
          'Sagene Bakeri AS er registrert med organisasjonsnummer 313 507 648. Søknaden om mva-registrering er sendt videre til Skatteetaten.',
        relatedTo: correction,
      }),
    ],
    activities: [
      activity(`${DIALOG_IDS.companyRegistration}-a1`, ActivityType.DialogCreated, kari, t.submitted),
      activity(`${DIALOG_IDS.companyRegistration}-a2`, ActivityType.SignatureProvided, kari, t.submitted),
      activity(`${DIALOG_IDS.companyRegistration}-a3`, ActivityType.FormSubmitted, kari, t.submitted),
      activity(`${DIALOG_IDS.companyRegistration}-a4`, ActivityType.TransmissionOpened, kari, t.missingSignature, {
        transmissionId: missingSignature,
      }),
      activity(`${DIALOG_IDS.companyRegistration}-a5`, ActivityType.SignatureProvided, martin, t.corrected),
      activity(`${DIALOG_IDS.companyRegistration}-a6`, ActivityType.TransmissionOpened, kari, t.registered, {
        transmissionId: registered,
      }),
    ],
    guiActions: [
      link(
        'se-enhetsregisteret',
        'Se Sagene Bakeri AS i Enhetsregisteret',
        'https://www.brreg.no/',
        GuiActionPriority.Tertiary,
      ),
    ],
  });
};

export const dialogs: MockDialog[] = [
  sickPay(),
  foodInspection(),
  statistics(),
  outdoorSeating(),
  aMelding(),
  vehicle(),
  servingLicence(),
  vatRegistration(),
  companyRegistration(),
];
