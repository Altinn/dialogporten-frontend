import type {
  AvatarProps,
  TimelineSegmentProps,
  TransmissionProps,
  TransmissionTypeValue,
} from '@altinn/altinn-components';
import { ActivityType, type DialogActivityFragment, type TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps, getAttachmentLinks } from '../hooks/useDialogById.tsx';
import type { OrganizationOutput } from './organizations.ts';

export interface TimelineSegmentWithTransmissions extends TimelineSegmentProps {
  items: TransmissionProps[];
}

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

const getClockFormatString = () => {
  const clockPrefix = t('word.clock_prefix');
  return `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
};

const createTransmissionItem = (
  transmission: TransmissionFieldsFragment,
  format: FormatFunction,
  activities?: DialogActivityFragment[],
  serviceOwner?: OrganizationOutput,
  selectedProfile?: AvatarProps['type'],
): TransmissionProps => {
  const formatString = getClockFormatString();
  const sender = getActorProps(transmission.sender, serviceOwner);
  let unread = true;
  if (activities && activities.length > 0) {
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      if (activity.transmissionId === transmission.id && activity.type === ActivityType.TransmissionOpened) {
        unread = false;
        break;
      }
    }
  }

  return {
    id: transmission.id,
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
      unread: true,
      badge: { color: selectedProfile === 'person' ? 'person' : 'company' },
    }),
    sender,
    attachments: {
      items: getAttachmentLinks(transmission.attachments),
    },
  };
};

export const getTransmissions = ({
  transmissions,
  format,
  activities,
  serviceOwner,
  selectedProfile,
}: {
  transmissions: TransmissionFieldsFragment[];
  format: FormatFunction;
  activities?: DialogActivityFragment[];
  serviceOwner?: OrganizationOutput;
  selectedProfile?: AvatarProps['type'];
}): TimelineSegmentWithTransmissions[] => {
  return groupTransmissions(transmissions).map((group) => {
    const sortedGroup = [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const [lastTransmission] = sortedGroup;
    const items: TransmissionProps[] = sortedGroup.map((transmission) =>
      createTransmissionItem(transmission, format, activities, serviceOwner, selectedProfile),
    );

    return {
      id: lastTransmission.id,
      items,
    };
  });
};
