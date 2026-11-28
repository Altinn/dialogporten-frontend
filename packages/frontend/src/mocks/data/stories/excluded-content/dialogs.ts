import {
  ActivityType,
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogActivityFragment,
  DialogStatus,
  type GuiActionFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  SystemLabel,
  type TransmissionFieldsFragment,
  TransmissionType,
} from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

const firmaAs = 'urn:altinn:organization:identifier-no:1';
const serviceOwner = { actorType: ActorType.ServiceOwner, actorId: null, actorName: null };
const party = { actorType: ActorType.PartyRepresentative, actorId: null, actorName: 'NORDMANN KARI' };

const text = (nb: string, en?: string) => ({
  mediaType: 'text/plain',
  value: [{ value: nb, languageCode: 'nb' }, ...(en ? [{ value: en, languageCode: 'en' }] : [])],
});

const attachment = (
  id: string,
  name: string,
  url = `https://info.altinn.no/om-altinn/?vedlegg=${id}`,
): AttachmentFieldsFragment => ({
  id,
  displayName: [{ value: name, languageCode: 'nb' }],
  expiresAt: null,
  urls: [
    {
      id: `${id}-url`,
      url,
      consumerType: AttachmentUrlConsumer.Gui,
      mediaType: 'application/pdf',
    },
  ],
});

const noAccess = (id: string, name: string) => attachment(id, name, 'urn:dialogporten:unauthorized');

const guiAction = (
  id: string,
  title: string,
  priority: GuiActionPriority,
  isAuthorized = true,
): GuiActionFieldsFragment => ({
  id,
  url: isAuthorized ? `https://info.altinn.no/?handling=${id}` : 'urn:dialogporten:unauthorized',
  isAuthorized,
  isDeleteDialogAction: false,
  action: 'read',
  authorizationAttribute: null,
  priority,
  httpMethod: HttpVerb.Get,
  title: [{ value: title, languageCode: 'nb' }],
  prompt: null,
});

const excluded = (id: string, createdAt: string, count = 1) =>
  Array.from({ length: count }, (_, index) => ({ id: `${id}-${index}`, createdAt }));

const transmissionOpened = (transmissionId: string, createdAt: string): DialogActivityFragment => ({
  id: `${transmissionId}-opened`,
  performedBy: party,
  transmissionId,
  type: ActivityType.TransmissionOpened,
  description: [],
  createdAt,
});

const dialogCreated = (dialogId: string, createdAt: string): DialogActivityFragment => ({
  id: `${dialogId}-created`,
  performedBy: serviceOwner,
  transmissionId: null,
  type: ActivityType.DialogCreated,
  description: [],
  createdAt,
});

const transmission = ({
  id,
  createdAt,
  title,
  summary,
  type = TransmissionType.Information,
  sender = serviceOwner,
  isAuthorized = true,
  relatedTransmissionId = null,
  attachments = [],
  excludedAttachments = [],
  navigationalActions = [],
  excludedNavigationalActions = [],
}: {
  id: string;
  createdAt: string;
  title: string;
  summary?: string;
  type?: TransmissionType;
  sender?: TransmissionFieldsFragment['sender'];
  isAuthorized?: boolean;
  relatedTransmissionId?: string | null;
  attachments?: AttachmentFieldsFragment[];
  excludedAttachments?: TransmissionFieldsFragment['excludedAttachments'];
  navigationalActions?: TransmissionFieldsFragment['navigationalActions'];
  excludedNavigationalActions?: TransmissionFieldsFragment['excludedNavigationalActions'];
}): TransmissionFieldsFragment => ({
  id,
  createdAt,
  type,
  sender,
  isAuthorized,
  relatedTransmissionId,
  content: { title: text(title), summary: summary ? text(summary) : null, contentReference: null },
  attachments,
  excludedAttachments,
  navigationalActions,
  excludedNavigationalActions,
});

const openedBy = (transmissions: TransmissionFieldsFragment[]): DialogActivityFragment[] =>
  transmissions
    .filter(({ isAuthorized, sender }) => isAuthorized && sender.actorType === ActorType.ServiceOwner)
    .map(({ id, createdAt }) => transmissionOpened(id, createdAt));

const mixedAttachmentsId = '019b0e1a-2c3d-7e4f-8a5b-000000000003';
const mixedAttachmentsTransmissions = [
  transmission({
    id: `${mixedAttachmentsId}-t1`,
    createdAt: '2026-11-06T08:00:00.000Z',
    title: 'Synlig, maskert og skjult vedlegg',
    summary: 'Ett vedlegg du kan åpne, ett du ikke har tilgang til, og to som er skjult.',
    type: TransmissionType.Decision,
    attachments: [
      attachment(`${mixedAttachmentsId}-t1-a1`, 'Vedtaksbrev.pdf'),
      noAccess(`${mixedAttachmentsId}-t1-a2`, 'Lønnsslipp.pdf'),
    ],
    excludedAttachments: excluded(`${mixedAttachmentsId}-t1-x`, '2026-11-06T08:00:00.000Z', 2),
  }),
  transmission({
    id: `${mixedAttachmentsId}-t2`,
    createdAt: '2026-11-05T08:00:00.000Z',
    title: 'Synlig og skjult vedlegg',
    summary: 'Ett vedlegg du kan åpne, og ett som er skjult.',
    attachments: [attachment(`${mixedAttachmentsId}-t2-a1`, 'Kvittering.pdf')],
    excludedAttachments: excluded(`${mixedAttachmentsId}-t2-x`, '2026-11-05T08:00:00.000Z'),
  }),
  transmission({
    id: `${mixedAttachmentsId}-t3`,
    createdAt: '2026-11-04T08:00:00.000Z',
    title: 'Maskert og skjult vedlegg',
    summary: 'Ett vedlegg du ikke har tilgang til, og tre som er skjult.',
    attachments: [noAccess(`${mixedAttachmentsId}-t3-a1`, 'Personalmappe.pdf')],
    excludedAttachments: excluded(`${mixedAttachmentsId}-t3-x`, '2026-11-04T08:00:00.000Z', 3),
  }),
  transmission({
    id: `${mixedAttachmentsId}-t4`,
    createdAt: '2026-11-03T08:00:00.000Z',
    title: 'Mange skjulte vedlegg',
    excludedAttachments: excluded(`${mixedAttachmentsId}-t4-x`, '2026-11-03T08:00:00.000Z', 12),
  }),
  transmission({
    id: `${mixedAttachmentsId}-t5`,
    createdAt: '2026-11-02T08:00:00.000Z',
    title: 'Bare maskert vedlegg',
    summary: 'Til sammenligning: et vedlegg du ikke har tilgang til, uten skjulte vedlegg.',
    attachments: [noAccess(`${mixedAttachmentsId}-t5-a1`, 'Sykmelding.pdf')],
  }),
];

const actionsId = '019b0e1a-2c3d-7e4f-8a5b-000000000007';
const actionsTransmissions = [
  transmission({
    id: `${actionsId}-t1`,
    createdAt: '2026-11-07T08:30:00.000Z',
    title: 'Forsendelse med navigasjonshandlinger',
    summary: 'En lenke du kan bruke, en du ikke har tilgang til, og tre som er skjult.',
    navigationalActions: [
      { title: [{ value: 'Gå til kvittering', languageCode: 'nb' }], url: 'https://info.altinn.no/', expiresAt: null },
      { title: [{ value: 'Se vedtaket', languageCode: 'nb' }], url: 'urn:dialogporten:unauthorized', expiresAt: null },
    ],
    excludedNavigationalActions: excluded(`${actionsId}-t1-x`, '2026-11-07T08:30:00.000Z', 3),
  }),
  transmission({
    id: `${actionsId}-t2`,
    createdAt: '2026-11-07T08:10:00.000Z',
    title: 'Bare skjulte navigasjonshandlinger',
    excludedNavigationalActions: excluded(`${actionsId}-t2-x`, '2026-11-07T08:10:00.000Z'),
  }),
];

const hiddenTransmissionsId = '019b0e1a-2c3d-7e4f-8a5b-000000000004';
const hiddenTransmissionsTransmissions = [
  transmission({
    id: `${hiddenTransmissionsId}-t1`,
    createdAt: '2026-11-04T08:00:00.000Z',
    title: 'Purring',
    summary: 'Synlig forsendelse mellom skjulte.',
    type: TransmissionType.Alert,
    attachments: [attachment(`${hiddenTransmissionsId}-t1-a1`, 'Purring.pdf')],
  }),
  transmission({
    id: `${hiddenTransmissionsId}-t2`,
    createdAt: '2026-11-01T08:00:00.000Z',
    title: 'Forsendelse uten tilgang',
    summary: 'Til sammenligning: isAuthorized=false gir en deaktivert forsendelse.',
    isAuthorized: false,
    attachments: [noAccess(`${hiddenTransmissionsId}-t2-a1`, 'Vedtak.pdf')],
  }),
  transmission({
    id: `${hiddenTransmissionsId}-t3`,
    createdAt: '2026-10-31T08:00:00.000Z',
    title: 'Svar på skjult forespørsel',
    summary: 'Svaret er synlig, men forespørselen det svarer på er skjult.',
    type: TransmissionType.Submission,
    sender: party,
    relatedTransmissionId: `${hiddenTransmissionsId}-x4`,
  }),
];

export const dialogs: MockDialog[] = [
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000001',
    party: 'urn:altinn:organization:identifier-no:1',
    org: 'nav',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-09-30T08:00:00.000Z',
    contentUpdatedAt: '2026-10-10T08:00:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Innhold du ikke har tilgang til', languageCode: 'nb' },
          { value: 'Content you do not have access to', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Noe av innholdet er bare for utvalgte i virksomheten.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    attachments: [attachment('019b0e1a-2c3d-7e4f-8a5b-0000000000a1', 'Vedtak.pdf')],
    excludedAttachments: excluded('019b0e1a-2c3d-7e4f-8a5b-0000000000e1', '2026-09-30T08:00:00.000Z', 2),
    guiActions: [],
    activities: [
      {
        id: '019b0e1a-2c3d-7e4f-8a5b-0000000000c1',
        performedBy: serviceOwner,
        transmissionId: null,
        type: ActivityType.DialogCreated,
        description: [],
        createdAt: '2026-09-30T08:00:00.000Z',
      },
      transmissionOpened('019b0e1a-2c3d-7e4f-8a5b-000000000012', '2026-10-05T09:00:00.000Z'),
      transmissionOpened('019b0e1a-2c3d-7e4f-8a5b-000000000011', '2026-10-10T09:00:00.000Z'),
    ],
    transmissions: [
      {
        id: '019b0e1a-2c3d-7e4f-8a5b-000000000011',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-10T08:00:00.000Z',
        type: TransmissionType.Decision,
        sender: serviceOwner,
        content: {
          title: {
            value: [
              { value: 'Vedtak om tilskudd', languageCode: 'nb' },
              { value: 'Decision on grant', languageCode: 'en' },
            ],
            mediaType: 'text/plain',
          },
          summary: {
            value: [{ value: 'Søknaden er innvilget.', languageCode: 'nb' }],
            mediaType: 'text/plain',
          },
          contentReference: null,
        },
        attachments: [attachment('019b0e1a-2c3d-7e4f-8a5b-0000000000a2', 'Vedtaksbrev.pdf')],
        excludedAttachments: excluded('019b0e1a-2c3d-7e4f-8a5b-0000000000e2', '2026-10-10T08:00:00.000Z', 3),
      },
      {
        id: '019b0e1a-2c3d-7e4f-8a5b-000000000012',
        relatedTransmissionId: null,
        isAuthorized: true,
        createdAt: '2026-10-05T08:00:00.000Z',
        type: TransmissionType.Information,
        sender: serviceOwner,
        content: {
          title: {
            value: [
              { value: 'Lønnsopplysninger', languageCode: 'nb' },
              { value: 'Salary details', languageCode: 'en' },
            ],
            mediaType: 'text/plain',
          },
          summary: null,
          contentReference: null,
        },
        attachments: [],
        excludedAttachments: excluded('019b0e1a-2c3d-7e4f-8a5b-0000000000e3', '2026-10-05T08:00:00.000Z'),
      },
    ],
    excludedTransmissions: [{ id: '019b0e1a-2c3d-7e4f-8a5b-000000000013', createdAt: '2026-10-08T08:00:00.000Z' }],
  }),
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000002',
    org: 'skd',
    status: DialogStatus.NotApplicable,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-02T08:00:00.000Z',
    contentUpdatedAt: '2026-10-02T08:00:00.000Z',
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          { value: 'Vedlegg du ikke har tilgang til', languageCode: 'nb' },
          { value: 'Attachments you do not have access to', languageCode: 'en' },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Alle vedleggene er skjult for deg.', languageCode: 'nb' }],
      },
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    excludedAttachments: excluded('019b0e1a-2c3d-7e4f-8a5b-0000000000e4', '2026-10-02T08:00:00.000Z', 2),
    guiActions: [],
  }),
  mockDialog({
    id: mixedAttachmentsId,
    party: firmaAs,
    org: 'nav',
    status: DialogStatus.InProgress,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-11-01T08:00:00.000Z',
    contentUpdatedAt: '2026-11-06T08:00:00.000Z',
    content: {
      title: text('Synlige, maskerte og skjulte vedlegg', 'Visible, masked and hidden attachments'),
      summary: text('Vedlegg du kan åpne, vedlegg du ikke har tilgang til, og vedlegg som er skjult.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [
      attachment(`${mixedAttachmentsId}-a1`, 'Vedtak.pdf'),
      attachment(`${mixedAttachmentsId}-a2`, 'Søknad.pdf'),
      noAccess(`${mixedAttachmentsId}-a3`, 'Lønnsoppgave.pdf'),
    ],
    excludedAttachments: excluded(`${mixedAttachmentsId}-x`, '2026-11-01T08:00:00.000Z', 3),
    guiActions: [],
    activities: [
      dialogCreated(mixedAttachmentsId, '2026-11-01T08:00:00.000Z'),
      ...openedBy(mixedAttachmentsTransmissions),
    ],
    transmissions: mixedAttachmentsTransmissions,
  }),
  mockDialog({
    id: hiddenTransmissionsId,
    party: firmaAs,
    org: 'skd',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-29T08:00:00.000Z',
    contentUpdatedAt: '2026-11-05T08:00:00.000Z',
    content: {
      title: text('Flere skjulte forsendelser', 'Several hidden transmissions'),
      summary: text('Skjulte forsendelser blandet med synlige, og en forsendelse uten tilgang.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [],
    activities: [
      dialogCreated(hiddenTransmissionsId, '2026-10-29T08:00:00.000Z'),
      ...openedBy(hiddenTransmissionsTransmissions),
    ],
    transmissions: hiddenTransmissionsTransmissions,
    excludedTransmissions: [
      { id: `${hiddenTransmissionsId}-x1`, createdAt: '2026-11-05T08:00:00.000Z' },
      { id: `${hiddenTransmissionsId}-x2`, createdAt: '2026-11-03T08:00:00.000Z' },
      { id: `${hiddenTransmissionsId}-x3`, createdAt: '2026-11-02T08:00:00.000Z' },
      { id: `${hiddenTransmissionsId}-x4`, createdAt: '2026-10-30T08:00:00.000Z' },
    ],
  }),
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000005',
    party: firmaAs,
    org: 'nav',
    status: DialogStatus.NotApplicable,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-20T08:00:00.000Z',
    contentUpdatedAt: '2026-11-04T08:00:00.000Z',
    content: {
      title: text('Bare skjulte forsendelser', 'Only hidden transmissions'),
      summary: text('Alle forsendelsene i denne dialogen er skjult.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [],
    activities: [dialogCreated('019b0e1a-2c3d-7e4f-8a5b-000000000005', '2026-10-20T08:00:00.000Z')],
    excludedTransmissions: [
      { id: '019b0e1a-2c3d-7e4f-8a5b-000000000005-x1', createdAt: '2026-11-04T08:00:00.000Z' },
      { id: '019b0e1a-2c3d-7e4f-8a5b-000000000005-x2', createdAt: '2026-10-27T08:00:00.000Z' },
      { id: '019b0e1a-2c3d-7e4f-8a5b-000000000005-x3', createdAt: '2026-10-20T08:00:00.000Z' },
    ],
  }),
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000006',
    org: 'skd',
    status: DialogStatus.NotApplicable,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-03T08:00:00.000Z',
    contentUpdatedAt: '2026-10-03T08:00:00.000Z',
    content: {
      title: text('Synlige, maskerte og skjulte vedlegg for privatperson', 'Visible, masked and hidden attachments'),
      summary: text('Samme visning for en privatperson.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [
      attachment('019b0e1a-2c3d-7e4f-8a5b-000000000006-a1', 'Skattemelding.pdf'),
      noAccess('019b0e1a-2c3d-7e4f-8a5b-000000000006-a2', 'Skatteoppgjør.pdf'),
    ],
    excludedAttachments: excluded('019b0e1a-2c3d-7e4f-8a5b-000000000006-x', '2026-10-03T08:00:00.000Z', 2),
    guiActions: [],
  }),
  mockDialog({
    id: actionsId,
    party: firmaAs,
    org: 'skd',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-11-07T08:00:00.000Z',
    contentUpdatedAt: '2026-11-07T09:00:00.000Z',
    content: {
      title: text('Handlinger du ikke har tilgang til', 'Actions you do not have access to'),
      summary: text('Handlinger og navigasjonshandlinger du kan bruke, ikke har tilgang til, eller som er skjult.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [
      guiAction(`${actionsId}-g1`, 'Til skjema', GuiActionPriority.Primary),
      guiAction(`${actionsId}-g2`, 'Send inn', GuiActionPriority.Secondary, false),
      guiAction(`${actionsId}-g3`, 'Last ned kvittering', GuiActionPriority.Tertiary),
    ],
    excludedGuiActions: excluded(`${actionsId}-x`, '2026-11-07T08:00:00.000Z', 2),
    activities: [dialogCreated(actionsId, '2026-11-07T08:00:00.000Z'), ...openedBy(actionsTransmissions)],
    transmissions: actionsTransmissions,
  }),
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000008',
    party: firmaAs,
    org: 'nav',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-11-07T07:00:00.000Z',
    contentUpdatedAt: '2026-11-07T08:00:00.000Z',
    content: {
      title: text('Bare skjulte handlinger', 'Only hidden actions'),
      summary: text('Dialogen har en handling, men den er skjult for deg.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [],
    excludedGuiActions: excluded('019b0e1a-2c3d-7e4f-8a5b-000000000008-x', '2026-11-07T07:00:00.000Z'),
    activities: [dialogCreated('019b0e1a-2c3d-7e4f-8a5b-000000000008', '2026-11-07T07:00:00.000Z')],
  }),
  mockDialog({
    id: '019b0e1a-2c3d-7e4f-8a5b-000000000009',
    org: 'skd',
    status: DialogStatus.RequiresAttention,
    endUserContext: { systemLabels: [SystemLabel.Default] },
    createdAt: '2026-10-04T08:00:00.000Z',
    contentUpdatedAt: '2026-10-04T08:00:00.000Z',
    content: {
      title: text('Skjulte handlinger for privatperson', 'Hidden actions for a private person'),
      summary: text('Samme visning for en privatperson.'),
      senderName: null,
      extendedStatus: null,
    },
    attachments: [],
    guiActions: [guiAction('019b0e1a-2c3d-7e4f-8a5b-000000000009-g1', 'Til skjema', GuiActionPriority.Primary)],
    excludedGuiActions: excluded('019b0e1a-2c3d-7e4f-8a5b-000000000009-x', '2026-10-04T08:00:00.000Z'),
  }),
];
