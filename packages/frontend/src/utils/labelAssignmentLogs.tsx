import type { ActivityLogItemProps, AvatarProps } from '@altinn/altinn-components';
import { type LabelAssignmentLogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { t } from 'i18next';
import { getActorProps } from '../api/hooks/useDialogById.tsx';
import type { LocalizationObject } from '../i18n/property.ts';
import type { FormatFunction } from '../i18n/useDateFnsLocale.tsx';
import type { OrganizationOutput } from './organizations.ts';

export type LabelAssignmentLog = LabelAssignmentLogFieldsFragment;

export type LabelAction = 'set' | 'remove';

export interface LabelAssignmentChange {
  label: SystemLabel;
  action: LabelAction;
  date: string;
  performedBy: LabelAssignmentLog['performedBy'];
}

export interface LabelAssignmentLogEntry {
  id: string;
  date: string;
  items: ActivityLogItemProps[];
}

const systemLabelPrefix = 'systemlabel:';

/* Default, Archive and Bin are the folders a dialog can sit in, and only ever one of them at a time */
const locationLabels: ReadonlySet<SystemLabel> = new Set([SystemLabel.Default, SystemLabel.Archive, SystemLabel.Bin]);

/* Sent follows from what the service owner does with the dialog, not from anyone filing it, so it stays out of the log */
export const hiddenLabels: ReadonlySet<SystemLabel> = new Set([SystemLabel.Sent]);

const normalize = (value: string): string => value.trim().toLowerCase().replaceAll('_', '');

const labelsByName = new Map(Object.values(SystemLabel).map((label) => [normalize(label), label]));

export const parseLabel = (name: string): SystemLabel | undefined => {
  const withoutPrefix = name.trim().toLowerCase().startsWith(systemLabelPrefix)
    ? name.trim().slice(systemLabelPrefix.length)
    : name;
  return labelsByName.get(normalize(withoutPrefix));
};

export const parseAction = (action: string): LabelAction | undefined => {
  const normalized = normalize(action);
  if (normalized === 'set') return 'set';
  /* the reference documents this as 'removed', the API has been seen to send 'remove' */
  if (normalized.startsWith('remov')) return 'remove';
  return undefined;
};

const translationKey = (label: SystemLabel, action: LabelAction): string =>
  `label_assignment_log.${normalize(label)}.${action}`;

/**
 * Reduces the raw log to the changes worth a sentence, in reverse chronological order.
 *
 * A move between folders writes a set of the new label and a remove of the old one at the same
 * instant. The set alone tells the whole story, so the remove is dropped when its counterpart is
 * present; a remove on its own still gets rendered rather than swallowed.
 */
export const getLabelAssignmentChanges = (labelAssignmentLogs: LabelAssignmentLog[]): LabelAssignmentChange[] => {
  const operations = new Map<string, LabelAssignmentChange[]>();

  for (const log of labelAssignmentLogs) {
    if (!log.createdAt) continue;
    const label = parseLabel(log.name);
    const action = parseAction(log.action);
    if (!label || !action || hiddenLabels.has(label)) continue;

    /* one user action writes every label it touches at the same instant */
    const key = [log.createdAt, log.performedBy?.actorId ?? log.performedBy?.actorName ?? ''].join('|');
    const change = { label, action, date: log.createdAt, performedBy: log.performedBy };
    operations.set(key, [...(operations.get(key) ?? []), change]);
  }

  return [...operations.values()]
    .flatMap((changes) => {
      const movedInto = changes.some((change) => change.action === 'set' && locationLabels.has(change.label));
      return movedInto
        ? changes.filter((change) => !(change.action === 'remove' && locationLabels.has(change.label)))
        : changes;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getLabelAssignmentLogEntries = ({
  labelAssignmentLogs,
  format,
  stopReversingPersonNameOrder,
  serviceOwner,
  senderName,
  serviceOwnerNbName,
}: {
  labelAssignmentLogs: LabelAssignmentLog[];
  format: FormatFunction;
  stopReversingPersonNameOrder: boolean;
  serviceOwner?: OrganizationOutput;
  senderName?: LocalizationObject[];
  serviceOwnerNbName?: string;
}): LabelAssignmentLogEntry[] => {
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;

  return getLabelAssignmentChanges(labelAssignmentLogs).map((change) => {
    const id = `label-assignment-log-${change.date}-${normalize(change.label)}-${change.action}`;
    const actorProps: AvatarProps = getActorProps(
      change.performedBy,
      stopReversingPersonNameOrder,
      serviceOwner,
      senderName,
      serviceOwnerNbName,
    );

    return {
      id,
      date: change.date,
      items: [
        {
          id,
          summary: (
            <>
              {t(translationKey(change.label, change.action), {
                actor: <strong key={id}>{actorProps.name}</strong>,
              })}
            </>
          ),
          byline: format(change.date, formatString),
          datetime: change.date,
        },
      ],
    };
  });
};
