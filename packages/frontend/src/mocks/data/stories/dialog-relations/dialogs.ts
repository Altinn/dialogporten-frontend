import { DialogRelationType, DialogStatus, SystemLabel } from 'bff-types-generated';
import type { MockDialog, MockDialogRelation } from '../../base/helper.ts';
import { MAIN_UNIT_URN, subunits } from './parties.ts';

/**
 * Typed dialog relations (Altinn/dialogporten#4474), three levels deep:
 *
 * - The main dialog sits on the foretak (main unit) and has 30 grouping children, one per report, spread over the four
 *   subunits. Three of them (positions 4, 14 and 27) are not part of the story, standing in for dialogs the end user
 *   cannot access. It is also RELATED to a guidance dialog.
 * - The first grouping dialog has 8 quarterly children of its own.
 *
 * The first grouping dialog is the oldest dialog, so it is listed last in the inbox.
 */
export const MAIN_DIALOG_ID = '01990000-0000-7000-8000-000000000001';
export const RELATED_DIALOG_ID = '01990000-0000-7000-8000-000000000002';
export const MAIN_DIALOG_TITLE = 'Innrapportering av sysselsettingsstatistikk 2026';
export const RELATED_DIALOG_TITLE = 'Veiledning til innrapporteringen';

export const GROUPING_COUNT = 30;
export const QUARTERLY_COUNT = 8;
const UNKNOWN_GROUPING_POSITIONS = new Set([4, 14, 27]);
const statuses = [DialogStatus.InProgress, DialogStatus.Awaiting, DialogStatus.Completed, DialogStatus.NotApplicable];

const pad = (n: number) => n.toString().padStart(2, '0');
export const groupingId = (n: number) => `01990000-0000-7000-8000-0000000001${pad(n)}`;
export const quarterlyId = (n: number) => `01990000-0000-7000-8000-0000000002${pad(n)}`;
export const groupingSubunit = (n: number) => subunits[n % subunits.length];
export const groupingTitle = (n: number) => `Rapport ${pad(n)} for ${groupingSubunit(n).name}`;
export const quarterlyTitle = (n: number) => `Kvartalsrapport ${(n % 4) + 1}. kvartal ${2025 + Math.floor(n / 4)}`;

/* Grouping dialogs the end user can open, in creation (= id) order */
export const knownGroupingPositions = Array.from({ length: GROUPING_COUNT }, (_, n) => n).filter(
  (n) => !UNKNOWN_GROUPING_POSITIONS.has(n),
);

const text = (value: string) => ({ mediaType: 'text/plain', value: [{ value, languageCode: 'nb' }] });
const relation = (type: DialogRelationType, id: string): MockDialogRelation => ({ type, id });

const baseDialog = (overrides: Partial<MockDialog> & Pick<MockDialog, 'id' | 'party' | 'content'>): MockDialog => ({
  hasUnopenedContent: false,
  serviceResource: 'urn:altinn:resource:ttd-dialogporten-automated-tests',
  serviceResourceType: 'GenericAccessResource',
  seenSinceLastContentUpdate: [],
  endUserContext: { systemLabels: [SystemLabel.Default] },
  org: 'ttd',
  progress: null,
  isContentSeen: true,
  fromServiceOwnerTransmissionsCount: 0,
  fromPartyTransmissionsCount: 0,
  guiAttachmentCount: 0,
  status: DialogStatus.InProgress,
  createdAt: '2026-09-01T08:00:00.000Z',
  contentUpdatedAt: '2026-09-01T08:00:00.000Z',
  dueAt: null,
  ...overrides,
});

const mainDialog = baseDialog({
  id: MAIN_DIALOG_ID,
  party: MAIN_UNIT_URN,
  status: DialogStatus.RequiresAttention,
  createdAt: '2026-09-01T08:00:00.000Z',
  contentUpdatedAt: '2026-10-01T08:00:00.000Z',
  relations: [
    ...Array.from({ length: GROUPING_COUNT }, (_, n) => relation(DialogRelationType.Child, groupingId(n))),
    relation(DialogRelationType.Related, RELATED_DIALOG_ID),
  ],
  content: {
    title: text(MAIN_DIALOG_TITLE),
    summary: text('Foretaket rapporterer sysselsetting for hver avdeling i egne dialoger.'),
    senderName: null,
    extendedStatus: null,
  },
});

const relatedDialog = baseDialog({
  id: RELATED_DIALOG_ID,
  party: MAIN_UNIT_URN,
  contentUpdatedAt: '2026-09-30T08:00:00.000Z',
  relations: [relation(DialogRelationType.Related, MAIN_DIALOG_ID)],
  content: {
    title: text(RELATED_DIALOG_TITLE),
    summary: text('Slik fyller du ut rapportene for avdelingene.'),
    senderName: null,
    extendedStatus: null,
  },
});

const groupingDialogs = knownGroupingPositions.map((n) =>
  baseDialog({
    id: groupingId(n),
    party: groupingSubunit(n).urn,
    status: statuses[n % statuses.length],
    createdAt: `2026-09-02T08:${pad(n)}:00.000Z`,
    contentUpdatedAt: n === 0 ? '2025-01-15T08:00:00.000Z' : `2026-09-20T08:${pad(n)}:00.000Z`,
    relations: [
      relation(DialogRelationType.Parent, MAIN_DIALOG_ID),
      ...(n === 0
        ? Array.from({ length: QUARTERLY_COUNT }, (_, q) => relation(DialogRelationType.Child, quarterlyId(q)))
        : []),
    ],
    content: {
      title: text(groupingTitle(n)),
      summary: text('Avdelingen rapporterer sysselsetting for hvert kvartal.'),
      senderName: null,
      extendedStatus: n === 0 ? text('8 kvartaler') : null,
    },
  }),
);

const quarterlyDialogs = Array.from({ length: QUARTERLY_COUNT }, (_, q) =>
  baseDialog({
    id: quarterlyId(q),
    party: groupingSubunit(0).urn,
    status: q < QUARTERLY_COUNT - 1 ? DialogStatus.Completed : DialogStatus.InProgress,
    createdAt: `2026-09-03T08:${pad(q)}:00.000Z`,
    contentUpdatedAt: `2026-08-${pad(q + 1)}T08:00:00.000Z`,
    relations: [relation(DialogRelationType.Parent, groupingId(0))],
    content: {
      title: text(quarterlyTitle(q)),
      summary: text('Sysselsetting for kvartalet.'),
      senderName: null,
      extendedStatus: null,
    },
  }),
);

export const dialogs: MockDialog[] = [mainDialog, relatedDialog, ...groupingDialogs, ...quarterlyDialogs];
