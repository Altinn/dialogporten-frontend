import { SystemLabel } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import en from '../i18n/resources/en.json';
import nb from '../i18n/resources/nb.json';
import nn from '../i18n/resources/nn.json';
import {
  getLabelAssignmentChanges,
  hiddenLabels,
  type LabelAssignmentLog,
  parseAction,
  parseLabel,
} from './labelAssignmentLogs.tsx';

const log = (overrides: Partial<LabelAssignmentLog>): LabelAssignmentLog => ({
  name: 'systemlabel:Bin',
  action: 'set',
  createdAt: '2024-08-24T14:54:53.511Z',
  performedBy: {
    actorId: 'urn:altinn:person:identifier-no:08887799435',
    actorName: 'Kari Nordmann',
    actorType: null,
  },
  ...overrides,
});

const resources: [string, Record<string, string>][] = [
  ['nb', nb],
  ['nn', nn],
  ['en', en],
];

const shownLabels = Object.values(SystemLabel).filter((label) => !hiddenLabels.has(label));
const keyFor = (label: SystemLabel) => label.toLowerCase().replaceAll('_', '');

describe('every system label the log can report has a sentence in every language', () => {
  it.each(resources)('%s covers both operations for every shown label', (_lang, resource) => {
    for (const label of shownLabels) {
      for (const action of ['set', 'remove']) {
        expect(resource).toHaveProperty(`label_assignment_log.${keyFor(label)}.${action}`);
      }
    }
  });

  it.each(resources)('%s names the actor in every sentence', (_lang, resource) => {
    const sentences = Object.entries(resource).filter(([key]) => key.startsWith('label_assignment_log.'));
    expect(sentences.length).toBeGreaterThan(0);
    for (const [key, sentence] of sentences) {
      expect(sentence, key).toContain('{actor}');
    }
  });

  it.each(resources)('%s carries no sentence for a label the log does not show', (_lang, resource) => {
    const allowed = new Set(shownLabels.flatMap((label) => [`${keyFor(label)}.set`, `${keyFor(label)}.remove`]));
    const declared = Object.keys(resource)
      .filter((key) => key.startsWith('label_assignment_log.'))
      .map((key) => key.replace('label_assignment_log.', ''));

    expect(declared.filter((key) => !allowed.has(key))).toEqual([]);
  });

  it('keeps set and remove distinct rather than reusing one sentence', () => {
    for (const label of shownLabels) {
      expect((nb as Record<string, string>)[`label_assignment_log.${keyFor(label)}.set`]).not.toBe(
        (nb as Record<string, string>)[`label_assignment_log.${keyFor(label)}.remove`],
      );
    }
  });
});

describe('parseLabel', () => {
  it.each([
    ['systemlabel:Bin', SystemLabel.Bin],
    ['systemlabel:Archive', SystemLabel.Archive],
    ['systemlabel:Default', SystemLabel.Default],
    ['systemlabel:MarkedAsUnopened', SystemLabel.MarkedAsUnopened],
    ['systemlabel:Sent', SystemLabel.Sent],
  ])('reads %s as the system label it names', (name, expected) => {
    expect(parseLabel(name)).toBe(expected);
  });

  it('accepts the label without its prefix, and in the casing the enum uses', () => {
    expect(parseLabel('Bin')).toBe(SystemLabel.Bin);
    expect(parseLabel('MARKED_AS_UNOPENED')).toBe(SystemLabel.MarkedAsUnopened);
    expect(parseLabel('SYSTEMLABEL:BIN')).toBe(SystemLabel.Bin);
    expect(parseLabel('  systemlabel:Archive  ')).toBe(SystemLabel.Archive);
  });

  it('does not guess at a name it has no sentence for', () => {
    expect(parseLabel('systemlabel:SomethingNew')).toBeUndefined();
    expect(parseLabel('')).toBeUndefined();
  });
});

describe('parseAction', () => {
  it.each([
    ['set', 'set'],
    ['Set', 'set'],
    ['remove', 'remove'],
    ['removed', 'remove'],
    ['REMOVED', 'remove'],
  ])('reads %s as %s', (action, expected) => {
    expect(parseAction(action)).toBe(expected);
  });

  it('does not guess at an operation it cannot name', () => {
    expect(parseAction('toggled')).toBeUndefined();
  });
});

describe('getLabelAssignmentChanges', () => {
  it('collapses the remove half of a move into the set that explains it', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:Archive', action: 'set' }),
      log({ name: 'systemlabel:Default', action: 'removed' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ label: SystemLabel.Archive, action: 'set' });
  });

  it('keeps a remove that arrives without the set that would explain it', () => {
    const result = getLabelAssignmentChanges([log({ name: 'systemlabel:Bin', action: 'removed' })]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ label: SystemLabel.Bin, action: 'remove' });
  });

  it('does not collapse a remove that belongs to a different moment', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:Archive', action: 'set', createdAt: '2024-08-24T14:54:53.511Z' }),
      log({ name: 'systemlabel:Default', action: 'removed', createdAt: '2024-08-25T09:00:00.000Z' }),
    ]);

    expect(result).toHaveLength(2);
  });

  it('does not collapse a remove performed by someone else at the same instant', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:Archive', action: 'set' }),
      log({
        name: 'systemlabel:Default',
        action: 'removed',
        performedBy: {
          actorId: 'urn:altinn:person:identifier-no:11223344556',
          actorName: 'Ola Nordmann',
          actorType: null,
        },
      }),
    ]);

    expect(result).toHaveLength(2);
  });

  it('keeps a read/unread change alongside the move it was made with', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:Default', action: 'set' }),
      log({ name: 'systemlabel:Archive', action: 'removed' }),
      log({ name: 'systemlabel:MarkedAsUnopened', action: 'set' }),
    ]);

    expect(result.map((change) => `${change.label}:${change.action}`)).toEqual([
      `${SystemLabel.Default}:set`,
      `${SystemLabel.MarkedAsUnopened}:set`,
    ]);
  });

  it('reports being marked as read, which is a remove with no set to hide behind', () => {
    const result = getLabelAssignmentChanges([log({ name: 'systemlabel:MarkedAsUnopened', action: 'removed' })]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ label: SystemLabel.MarkedAsUnopened, action: 'remove' });
  });

  it('leaves out Sent, which follows from what the service owner does', () => {
    expect(getLabelAssignmentChanges([log({ name: 'systemlabel:Sent', action: 'set' })])).toEqual([]);
  });

  it('drops entries it cannot turn into a sentence rather than rendering a raw label', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:SomethingNew', action: 'set' }),
      log({ name: 'systemlabel:Bin', action: 'toggled' }),
      log({ name: 'systemlabel:Bin', action: 'set', createdAt: '' }),
    ]);

    expect(result).toEqual([]);
  });

  it('returns the most recent change first', () => {
    const result = getLabelAssignmentChanges([
      log({ name: 'systemlabel:Archive', action: 'set', createdAt: '2024-08-24T14:54:53.511Z' }),
      log({ name: 'systemlabel:Bin', action: 'set', createdAt: '2024-08-26T14:54:53.511Z' }),
      log({ name: 'systemlabel:Default', action: 'set', createdAt: '2024-08-25T14:54:53.511Z' }),
    ]);

    expect(result.map((change) => change.label)).toEqual([SystemLabel.Bin, SystemLabel.Default, SystemLabel.Archive]);
  });
});
