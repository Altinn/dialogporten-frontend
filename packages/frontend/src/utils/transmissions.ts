import type { TimelineSegmentProps, TransmissionProps, TransmissionTypeValue } from '@altinn/altinn-components';
import {
  ActivityType,
  AttachmentUrlConsumer,
  type DialogActivityFragment,
  type TransmissionFieldsFragment,
  TransmissionType,
} from 'bff-types-generated';
import { t } from 'i18next';
import { getActorProps, getAttachmentLinks } from '../api/hooks/useDialogById.tsx';
import type { ProfileType } from '../api/hooks/useParties.ts';
import { type LocalizationObject, getPreferredPropertyByLocale } from '../i18n/property.ts';
import type { FormatFunction, Locale } from '../i18n/useDateFnsLocale.tsx';
import type { OrganizationOutput } from './organizations.ts';

export interface TransmissionItemWithMeta extends TransmissionProps {
  isEmpty?: boolean;
}

export interface TimelineSegmentWithTransmissions extends TimelineSegmentProps {
  items: TransmissionItemWithMeta[];
}

// Decision table for how a transmission should be displayed (cases A/B/C from issue #3819).
// Consumers use the returned value to filter, disable, or show an empty-state message.
export type TransmissionVisibility = 'filter' | 'disabled' | 'empty' | 'visible';

export const getTransmissionVisibility = (transmission: TransmissionFieldsFragment): TransmissionVisibility => {
  const hasGuiAttachment = transmission.attachments.some((a) =>
    a.urls.some((url) => url.consumerType === AttachmentUrlConsumer.Gui),
  );
  const hasSummary = !!getPreferredPropertyByLocale(transmission.content.summary?.value)?.value;
  const hasContentReference =
    !!transmission.content.contentReference &&
    !!getPreferredPropertyByLocale(transmission.content.contentReference.value)?.value;

  // A: has attachments but none are GUI-consumable, and no other visible content — irrelevant for GUI users, remove from all lists
  if (transmission.attachments.length > 0 && !hasGuiAttachment && !hasSummary && !hasContentReference) return 'filter';

  // B: unauthorized at top level — show transmission but disable expansion
  if (!transmission.isAuthorized) return 'disabled';

  // C: authorized but nothing visible — expand with empty-state explanation
  // hasGuiAttachment covers case 6 too: unauthorized GUI links are shown as disabled links, which counts as visible content
  if (!hasSummary && !hasContentReference && !hasGuiAttachment) return 'empty';

  return 'visible';
};

export const groupTransmissions = (transmissions: TransmissionFieldsFragment[]): TransmissionFieldsFragment[][] => {
  const relatedMap = new Map<string, Set<string>>();

  // Build relational graph
  for (const { id, relatedTransmissionId } of transmissions) {
    if (!relatedMap.has(id)) relatedMap.set(id, new Set());

    if (relatedTransmissionId) {
      if (!relatedMap.has(relatedTransmissionId)) relatedMap.set(relatedTransmissionId, new Set());

      relatedMap.get(id)!.add(relatedTransmissionId);
      relatedMap.get(relatedTransmissionId)!.add(id); // Bidirectional linking
    }
  }

  // Find groups with DFS/BFS
  const visited = new Set<string>();
  const groups: TransmissionFieldsFragment[][] = [];

  const dfs = (startId: string, group: TransmissionFieldsFragment[]) => {
    if (visited.has(startId)) return;

    visited.add(startId);

    const transmission = transmissions.find((t) => t.id === startId);
    if (transmission) {
      group.push(transmission);
    }

    const relatedIds = relatedMap.get(startId);
    if (relatedIds) {
      for (const relatedId of relatedIds) {
        dfs(relatedId, group);
      }
    }
  };

  for (const { id } of transmissions) {
    if (!visited.has(id)) {
      const group: TransmissionFieldsFragment[] = [];
      dfs(id, group);
      groups.push(group);
    }
  }

  groups.sort((a, b) => {
    const latestA = Math.max(...a.map((t) => new Date(t.createdAt).getTime()));
    const latestB = Math.max(...b.map((t) => new Date(t.createdAt).getTime()));
    return latestB - latestA;
  });

  return groups;
};

/**
 * Determines if a transmission is unread based on its type and related activities.
 *
 * A transmission is considered **read** if:
 * - It is of type `Correction` or `Submission` (end-user sent transmissions are never unread), or
 * - There exists an activity with a matching `transmissionId` and `type` equal to `TransmissionOpened`.
 *
 * Otherwise, it is considered **unread**.
 *
 * @param {string} id - The unique identifier of the transmission.
 * @param {TransmissionType} type - The type of transmission (e.g., Correction, Submission, etc.).
 * @param {DialogActivityFragment[]} [activities] - A list of dialog activities for the same dialog as the transmissions.
 * @returns {boolean} `true` if the transmission is unread, otherwise `false`.
 */
const isTransmissionUnread = (id: string, type: TransmissionType, activities?: DialogActivityFragment[]): boolean => {
  if (activities && activities.length > 0) {
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const endUserTransmission = type === TransmissionType.Correction || type === TransmissionType.Submission;
      if (
        endUserTransmission ||
        (activity.transmissionId === id && activity.type === ActivityType.TransmissionOpened)
      ) {
        return false;
      }
    }
  }
  return true;
};

const getClockFormatString = () => {
  const clockPrefix = t('word.clock_prefix');
  return `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
};

const createTransmissionItem = ({
  transmission,
  format,
  stopReversingPersonNameOrder,
  locale,
  activities,
  serviceOwner,
  selectedProfile,
  senderName,
  serviceOwnerNbName,
}: {
  transmission: TransmissionFieldsFragment;
  format: FormatFunction;
  stopReversingPersonNameOrder: boolean;
  locale: Locale;
  activities?: DialogActivityFragment[];
  serviceOwner?: OrganizationOutput;
  selectedProfile?: ProfileType;
  senderName?: LocalizationObject[];
  serviceOwnerNbName?: string;
}): TransmissionItemWithMeta => {
  const formatString = getClockFormatString();
  const sender = getActorProps(
    transmission.sender,
    stopReversingPersonNameOrder,
    serviceOwner,
    senderName,
    serviceOwnerNbName,
  );
  const unread = isTransmissionUnread(transmission.id, transmission.type, activities);
  const visibility = getTransmissionVisibility(transmission);

  return {
    id: transmission.id,
    disabled: visibility === 'disabled',
    byline: transmission?.createdAt ? `${sender.name}, ${format(transmission.createdAt, getClockFormatString())}` : '',
    title: getPreferredPropertyByLocale(transmission.content.title.value)?.value ?? '',
    summary: getPreferredPropertyByLocale(transmission.content.summary?.value)?.value ?? '',
    createdAt: transmission.createdAt,
    createdAtLabel: format(transmission.createdAt, formatString),
    type: {
      value: transmission.type?.toLowerCase() as TransmissionTypeValue,
      label: t(`transmission.type.${transmission.type?.toLowerCase()}`),
    },
    ...(unread && {
      unread,
      badge: { color: selectedProfile === 'person' ? 'person' : 'company' },
    }),
    sender,
    attachments: {
      items: getAttachmentLinks(transmission.attachments, locale, t),
    },
    isEmpty: visibility === 'empty',
  };
};

export const getTransmissions = ({
  transmissions,
  format,
  activities,
  serviceOwner,
  stopReversingPersonNameOrder,
  selectedProfile,
  locale,
  senderName,
  serviceOwnerNbName,
}: {
  transmissions: TransmissionFieldsFragment[];
  format: FormatFunction;
  stopReversingPersonNameOrder: boolean;
  activities?: DialogActivityFragment[];
  serviceOwner?: OrganizationOutput;
  selectedProfile?: ProfileType;
  locale: Locale;
  senderName?: LocalizationObject[];
  serviceOwnerNbName?: string;
}): TimelineSegmentWithTransmissions[] => {
  return groupTransmissions(transmissions.filter((t) => getTransmissionVisibility(t) !== 'filter')).map((group) => {
    const sortedGroup = [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const [lastTransmission] = sortedGroup;
    const items: TransmissionItemWithMeta[] = sortedGroup.map((transmission) =>
      createTransmissionItem({
        transmission,
        format,
        stopReversingPersonNameOrder,
        locale,
        activities,
        serviceOwner,
        selectedProfile,
        senderName,
        serviceOwnerNbName,
      }),
    );

    return {
      id: lastTransmission.id,
      items,
    };
  });
};
