import {
  ActivityType,
  ActorType,
  type DialogActivityFragment,
  type TransmissionFieldsFragment,
  TransmissionType,
} from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { Locale } from '../i18n/useDateFnsLocale.tsx';
import { getActivityHistory } from './activities.tsx';

const makeTransmission = (overrides: Partial<TransmissionFieldsFragment> = {}): TransmissionFieldsFragment =>
  ({
    id: 'transmission',
    relatedTransmissionId: null,
    createdAt: '2026-08-01T10:00:00Z',
    isAuthorized: true,
    type: TransmissionType.Information,
    sender: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
    content: {
      title: { value: [{ value: 'Tittel', languageCode: 'nb' }], mediaType: 'text/plain' },
      summary: { value: [{ value: 'Oppsummering', languageCode: 'nb' }], mediaType: 'text/plain' },
      contentReference: null,
    },
    attachments: [],
    ...overrides,
  }) as unknown as TransmissionFieldsFragment;

const makeActivity = (overrides: Partial<DialogActivityFragment> = {}): DialogActivityFragment =>
  ({
    id: 'activity',
    type: ActivityType.Information,
    createdAt: '2026-08-01T09:00:00Z',
    transmissionId: null,
    description: [],
    performedBy: { actorType: ActorType.ServiceOwner, actorId: null, actorName: null },
    ...overrides,
  }) as unknown as DialogActivityFragment;

const historyOf = (activities: DialogActivityFragment[], transmissions: TransmissionFieldsFragment[]) =>
  getActivityHistory({
    activities,
    transmissions,
    format: (date) => String(date),
    stopReversingPersonNameOrder: true,
    locale: {} as Locale,
  });

const expectUniqueIds = (history: ReturnType<typeof historyOf>) => {
  const ids = history.map((entry) => entry.id);
  expect(new Set(ids).size).toBe(ids.length);
};

describe('getActivityHistory', () => {
  it('keeps ids unique when an activity shares its id with a transmission', () => {
    const history = historyOf(
      [makeActivity({ id: 'shared', type: ActivityType.FormSubmitted, createdAt: '2026-08-01T10:00:00Z' })],
      [makeTransmission({ id: 'shared', type: TransmissionType.Submission })],
    );

    expect(history.map((entry) => entry.type).sort()).toEqual(['activity', 'transmission']);
    expectUniqueIds(history);
  });

  it.each([
    ['empty', { content: { title: { value: [{ value: 'Tom', languageCode: 'nb' }] }, summary: null } }],
    ['unauthorized', { isAuthorized: false }],
  ])('keeps ids unique when the latest transmission in a thread is %s', (_case, overrides) => {
    const history = historyOf(
      [],
      [
        makeTransmission({ id: 'first', createdAt: '2026-08-01T10:00:00Z' }),
        makeTransmission({
          id: 'latest',
          relatedTransmissionId: 'first',
          createdAt: '2026-08-02T10:00:00Z',
          ...(overrides as Partial<TransmissionFieldsFragment>),
        }),
      ],
    );

    expect(history.map((entry) => entry.type).sort()).toEqual(['activity', 'transmission']);
    expectUniqueIds(history);
  });
});
