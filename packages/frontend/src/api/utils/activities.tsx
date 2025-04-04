import type { AvatarProps, DialogHistoryItemProps, TimelineLinkProps } from '@altinn/altinn-components';
import type { DialogHistorySegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import { ActivityType, type DialogActivityFragment, type TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps } from '../hooks/useDialogById.tsx';
import type { OrganizationOutput } from './organizations.ts';
import { getTransmissionItems } from './transmissions.ts';

const getActivityText = (
  activityType: DialogActivityFragment['type'],
  actorProps: AvatarProps,
  description?: string,
  relatedTransmissionTitle?: string,
) => {
  const name = actorProps?.name ?? '';
  switch (activityType) {
    case ActivityType.Information:
      return <>{t('activity.status.information', { actor: <strong>{name}</strong>, description })}</>;
    case ActivityType.CorrespondenceConfirmed:
      return <>{t('activity.status.correspondence_confirmed', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.CorrespondenceOpened:
      return <>{t('activity.status.correspondence_opened', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.DialogClosed:
      return <>{t('activity.status.dialog_closed', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.DialogCreated:
      return <>{t('activity.status.dialog_created', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.DialogDeleted:
      return <>{t('activity.status.dialog_deleted', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.DialogOpened:
      return <>{t('activity.status.dialog_opened', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.DialogRestored:
      return <>{t('activity.status.dialog_restored', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.FormSaved:
      return <>{t('activity.status.form_saved', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.FormSubmitted:
      return <>{t('activity.status.form_submitted', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.PaymentMade:
      return <>{t('activity.status.payment_made', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.SentToFormFill:
      return <>{t('activity.status.sent_to_form_fill', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.SentToPayment:
      return <>{t('activity.status.sent_to_payment', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.SentToSendIn:
      return <>{t('activity.status.sent_to_send_in', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.SentToSigning:
      return <>{t('activity.status.sent_to_signing', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.SignatureProvided:
      return <>{t('activity.status.signature_provided', { actor: <strong>{name}</strong> })}</>;
    case ActivityType.TransmissionOpened:
      return (
        <>
          {t('activity.status.transmission_opened', {
            transmission: relatedTransmissionTitle,
            actor: <strong>{name}</strong>,
          })}
        </>
      );

    default:
      return <strong>{activityType}</strong>;
  }
};

export const getDialogHistoryForActivities = (
  activities: DialogActivityFragment[],
  format: FormatFunction,
  transmissions: TransmissionFieldsFragment[],
  serviceOwner?: OrganizationOutput,
): DialogHistorySegmentProps[] => {
  return activities.map((activity) => {
    const clockPrefix = t('word.clock_prefix');
    const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
    const description = getPreferredPropertyByLocale(activity.description)?.value;
    const relatedTransmission = transmissions.find((transmission) => transmission.id === activity.transmissionId);
    const transmissionTitle = getPreferredPropertyByLocale(relatedTransmission?.content.title.value)?.value;
    const actorProps = getActorProps(activity.performedBy, serviceOwner);
    const items: DialogHistoryItemProps[] = [
      {
        id: activity.id,
        children: getActivityText(activity.type, actorProps, description, transmissionTitle),
        byline: format(activity.createdAt, formatString),
        datetime: activity.createdAt,
        sender: actorProps,
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
  const activityItems = getDialogHistoryForActivities(activities, format, transmissions, serviceOwner);
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
