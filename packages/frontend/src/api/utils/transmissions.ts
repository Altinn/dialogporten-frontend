import type { DialogHistoryItemProps, TransmissionType } from '@altinn/altinn-components';
import type { DialogHistorySegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import type { TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps, getAttachmentLinks } from '../hooks/useDialogById.tsx';
import type { OrganizationOutput } from './organizations.ts';

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
  serviceOwner?: OrganizationOutput,
): DialogHistoryItemProps => {
  const formatString = getClockFormatString();
  return {
    id: transmission.id,
    variant: 'transmission' as DialogHistoryItemProps['variant'],
    byline: format(transmission.createdAt, formatString),
    title: getPreferredPropertyByLocale(transmission.content.title.value)?.value ?? '',
    summary: getPreferredPropertyByLocale(transmission.content.summary.value)?.value ?? '',
    createdAt: transmission.createdAt,
    createdAtLabel: format(transmission.createdAt, formatString),
    type: transmission.type?.toLowerCase() as unknown as TransmissionType,
    sender: getActorProps(transmission.sender, serviceOwner),
    attachments: {
      items: getAttachmentLinks(transmission.attachments),
    },
    items: [],
  };
};

export const getTransmissionItems = (
  transmissions: TransmissionFieldsFragment[],
  format: FormatFunction,
  serviceOwner?: OrganizationOutput,
) => {
  return transmissions.map((transmission) => createTransmissionItem(transmission, format, serviceOwner));
};

export const getDialogHistoryForTransmissions = (
  transmissions: TransmissionFieldsFragment[],
  format: FormatFunction,
  serviceOwner?: OrganizationOutput,
): DialogHistorySegmentProps[] => {
  return groupTransmissions(transmissions).map((group) => {
    const sortedGroup = [...group].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const [lastTransmission, ...otherTransmissions] = sortedGroup;

    return {
      id: lastTransmission.id,
      expanded: group.length === 2,
      items: [
        {
          ...createTransmissionItem(lastTransmission, format, serviceOwner),
          items: otherTransmissions.map((item) => createTransmissionItem(item, format, serviceOwner)),
        },
      ],
      datetime: lastTransmission.createdAt,
      type: lastTransmission.type?.toLowerCase() as unknown as TransmissionType,
      sender: getActorProps(lastTransmission.sender, serviceOwner),
      createdAtLabel: format(lastTransmission.createdAt, getClockFormatString()),
      collapseLabel: t('dialog.transmission.collapseLabel'),
      expandLabel: `${t('dialog.transmission.expandLabel')} ${getPreferredPropertyByLocale(otherTransmissions[otherTransmissions.length - 1]?.content.title.value)?.value ?? ''}`,
    };
  });
};
