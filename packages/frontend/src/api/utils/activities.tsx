import type { DialogHistoryItemProps, TimelineLinkProps } from '@altinn/altinn-components';
import type { DialogHistorySegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import type { DialogActivityFragment, TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps } from '../hooks/useDialogById.tsx';
import type { OrganizationOutput } from './organizations.ts';
import { getTransmissionItems } from './transmissions.ts';

const getActivityText = (activityType: DialogActivityFragment['type'], description?: string) => {
  switch (activityType) {
    case 'INFORMATION':
      return description || t('activity.description_missing');
    case 'PAYMENT_MADE':
      return t('activity.status.payment_made');
    case 'SIGNATURE_PROVIDED':
      return t('activity.status.signature_provided');
    case 'DIALOG_CREATED':
      return t('activity.status.dialog_created');
    case 'DIALOG_CLOSED':
      return t('activity.status.dialog_closed');
    case 'TRANSMISSION_OPENED':
      return t('activity.status.transmission_opened');
    default:
      return activityType;
  }
};

export const getDialogHistoryForActivities = (
  activities: DialogActivityFragment[],
  format: FormatFunction,
  serviceOwner?: OrganizationOutput,
): DialogHistorySegmentProps[] => {
  return activities.map((activity) => {
    const clockPrefix = t('word.clock_prefix');
    const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
    const description = getPreferredPropertyByLocale(activity.description)?.value;
    const items: DialogHistoryItemProps[] = [
      {
        id: activity.id,
        children: getActivityText(activity.type, description),
        byline: format(activity.createdAt, formatString),
        datetime: activity.createdAt,
        sender: getActorProps(activity.performedBy, serviceOwner),
        // @ts-ignore
        variant: 'activity' as DialogHistorySegmentProps['variant'],
      },
    ];
    return {
      id: activity.id,
      items,
    };
  });
};

const getRelatedTransmissionLink = (transmission?: TransmissionFieldsFragment): TimelineLinkProps | undefined => {
  if (transmission) {
    const title = getPreferredPropertyByLocale(transmission.content.title.value)?.value;
    return {
      label: `${t('dialog.transmission.expandLabel')} ${title}`,
      as: 'button',
      onClick: () => {
        const element = document.getElementById(transmission.id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      },
    };
  }
};

/**
 * Generates a history of activities and transmissions for a dialog, sorted by createdAt (ascending).
 *
 * @param {DialogActivityFragment[]} activities - The list of dialog activities.
 * @param {TransmissionFieldsFragment[]} transmissions - The list of transmissions.
 * @param {FormatFunction} format - The function to format dates.
 * @param {OrganizationOutput} [serviceOwner] - The service owner organization details.
 * @return
 **/
export const getActivityHistory = (
  activities: DialogActivityFragment[],
  transmissions: TransmissionFieldsFragment[],
  format: FormatFunction,
  serviceOwner?: OrganizationOutput,
): DialogHistorySegmentProps[] => {
  const activityItems = getDialogHistoryForActivities(activities, format, serviceOwner);
  const transmissionItems: DialogHistorySegmentProps[] = getTransmissionItems(transmissions, format, serviceOwner).map(
    (item) => {
      const relatedTransmission = transmissions.find((transmission) => transmission.relatedTransmissionId === item.id);
      const link = getRelatedTransmissionLink(relatedTransmission);
      return {
        id: item.id,
        items: [
          {
            ...item,
            link,
          },
        ],
      };
    },
  );
  return [...activityItems, ...transmissionItems].sort((a, b) => {
    const dateA = a.items[0].datetime || a.items[0].createdAt || '';
    const dateB = b.items[0].datetime || b.items[0].createdAt || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};
