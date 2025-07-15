import type { ActivityLogItemProps, AvatarProps, TransmissionProps } from '@altinn/altinn-components';
import { ActivityType, type DialogActivityFragment, type TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps } from '../hooks/useDialogById.tsx';
import type { OrganizationOutput } from './organizations.ts';
import { getTransmissions } from './transmissions.ts';

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
): ActivityLogItemProps[] => {
  return activities.map((activity) => {
    const clockPrefix = t('word.clock_prefix');
    const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
    const description = getPreferredPropertyByLocale(activity.description)?.value;
    const relatedTransmission = transmissions.find((transmission) => transmission.id === activity.transmissionId);
    const transmissionTitle = getPreferredPropertyByLocale(relatedTransmission?.content.title.value)?.value;
    const actorProps = getActorProps(activity.performedBy, serviceOwner);
    return {
      id: activity.id,
      summary: getActivityText(activity.type, actorProps, description, transmissionTitle),
      byline: format(activity.createdAt, formatString),
      datetime: activity.createdAt,
      type: 'activity',
    };
  });
};

export type ActivityLogEntry =
  | {
      id: string;
      date: string;
      type: 'activity';
      items: ActivityLogItemProps[];
    }
  | {
      id: string;
      date: string;
      type: 'transmission';
      items: TransmissionProps[];
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
): ActivityLogEntry[] => {
  const dialogHistoryActivities: ActivityLogEntry[] = getDialogHistoryForActivities(
    activities,
    format,
    transmissions,
    serviceOwner,
  ).map((activity) => ({
    id: activity.id ?? '',
    type: 'activity',
    items: [activity],
    date: activity.datetime ?? new Date().toISOString(),
  }));

  const dialogHistoryTransmissions: ActivityLogEntry[] = getTransmissions(
    transmissions,
    format,
    activities,
    serviceOwner,
  ).map((transmission) => ({
    id: transmission.id ?? '',
    type: 'transmission',
    date: transmission.datetime ?? new Date().toISOString(),
    items: transmission.items,
  }));

  return [...dialogHistoryActivities, ...dialogHistoryTransmissions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};
