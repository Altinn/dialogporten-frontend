import type { ActivityLogItemProps, AvatarProps, TransmissionProps } from '@altinn/altinn-components';
import { ActivityType, type DialogActivityFragment, type TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction, Locale } from '../../i18n/useDateFnsLocale.tsx';
import { getActorProps } from '../hooks/useDialogById.tsx';
import type { ProfileType } from '../hooks/useParties.ts';
import type { OrganizationOutput } from './organizations.ts';
import { getTransmissions } from './transmissions.ts';

const getActivityText = (
  activity: DialogActivityFragment,
  actorProps: AvatarProps,
  description?: string,
  relatedTransmissionTitle?: string,
) => {
  const activityType = activity.type as ActivityType;
  const name = actorProps?.name ?? '';
  switch (activityType) {
    case ActivityType.Information:
      return <>{t('activity.status.information', { actor: <strong key={activity.id}>{name}</strong>, description })}</>;
    case ActivityType.CorrespondenceConfirmed:
      return <>{t('activity.status.correspondence_confirmed', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.CorrespondenceOpened:
      return <>{t('activity.status.correspondence_opened', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.DialogClosed:
      return <>{t('activity.status.dialog_closed', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.DialogCreated:
      return <>{t('activity.status.dialog_created', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.DialogDeleted:
      return <>{t('activity.status.dialog_deleted', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.DialogOpened:
      return <>{t('activity.status.dialog_opened', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.DialogRestored:
      return <>{t('activity.status.dialog_restored', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.FormSaved:
      return <>{t('activity.status.form_saved', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.FormSubmitted:
      return <>{t('activity.status.form_submitted', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.PaymentMade:
      return <>{t('activity.status.payment_made', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.SentToFormFill:
      return <>{t('activity.status.sent_to_form_fill', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.SentToPayment:
      return <>{t('activity.status.sent_to_payment', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.SentToSendIn:
      return <>{t('activity.status.sent_to_send_in', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.SentToSigning:
      return <>{t('activity.status.sent_to_signing', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.SignatureProvided:
      return <>{t('activity.status.signature_provided', { actor: <strong key={activity.id}>{name}</strong> })}</>;
    case ActivityType.TransmissionOpened:
      return (
        <>
          {t('activity.status.transmission_opened', {
            transmission: relatedTransmissionTitle,
            actor: <strong key={activity.id}>{name}</strong>,
          })}
        </>
      );

    default:
      return <strong key={activity.id}>{activityType}</strong>;
  }
};

export const getDialogHistoryForActivities = (
  activities: DialogActivityFragment[],
  format: FormatFunction,
  transmissions: TransmissionFieldsFragment[],
  stopReversingPersonNameOrder: boolean,
  serviceOwner?: OrganizationOutput,
): ActivityLogItemProps[] => {
  return activities.map((activity) => {
    const clockPrefix = t('word.clock_prefix');
    const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
    const description = getPreferredPropertyByLocale(activity.description)?.value;
    const relatedTransmission = transmissions.find((transmission) => transmission.id === activity.transmissionId);
    const transmissionTitle = getPreferredPropertyByLocale(relatedTransmission?.content.title.value)?.value;
    const actorProps: AvatarProps = getActorProps(activity.performedBy, stopReversingPersonNameOrder, serviceOwner);
    return {
      id: activity.id,
      summary: getActivityText(activity, actorProps, description, transmissionTitle),
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
 * Generates a combined and sorted history of activities and transmissions for a dialog.
 *
 * @param activities - The list of dialog activities.
 * @param transmissions - The list of transmissions.
 * @param format - The function to format dates.
 * @param serviceOwner - Optional service owner organization details.
 * @param selectedProfile - Optional selected party profile.
 * @param stopReversingPersonNameOrder
 * @param locale
 * @returns An array of activity and transmission log entries, sorted by date (descending).
 */
export const getActivityHistory = ({
  activities,
  transmissions,
  format,
  serviceOwner,
  selectedProfile,
  stopReversingPersonNameOrder,
  locale,
}: {
  activities: DialogActivityFragment[];
  transmissions: TransmissionFieldsFragment[];
  format: FormatFunction;
  stopReversingPersonNameOrder: boolean;
  serviceOwner?: OrganizationOutput;
  selectedProfile?: ProfileType;
  locale: Locale;
}): ActivityLogEntry[] => {
  const dialogHistoryActivities: ActivityLogEntry[] = getDialogHistoryForActivities(
    activities,
    format,
    transmissions,
    stopReversingPersonNameOrder,
    serviceOwner,
  ).map((activity) => ({
    id: activity.id ?? '',
    type: 'activity',
    items: [activity],
    date: activity.datetime!,
  }));

  const dialogHistoryTransmissions: ActivityLogEntry[] = getTransmissions({
    transmissions,
    format,
    activities,
    stopReversingPersonNameOrder,
    serviceOwner,
    selectedProfile,
    locale,
  }).map((transmission) => ({
    id: transmission.id ?? '',
    type: 'transmission',
    date: transmission.items?.[0]?.createdAt ?? '',
    items: transmission.items,
  }));

  return [...dialogHistoryActivities, ...dialogHistoryTransmissions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};
