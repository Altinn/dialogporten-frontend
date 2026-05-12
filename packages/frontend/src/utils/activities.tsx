import type { ActivityLogItemProps, AvatarProps } from '@altinn/altinn-components';
import { ActivityType, type DialogActivityFragment, type TransmissionFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { getActorProps } from '../api/hooks/useDialogById.tsx';
import type { ProfileType } from '../api/hooks/useParties.ts';
import { type LocalizationObject, getPreferredPropertyByLocale } from '../i18n/property.ts';
import type { FormatFunction, Locale } from '../i18n/useDateFnsLocale.tsx';
import type { OrganizationOutput } from './organizations.ts';
import { type TransmissionItemWithMeta, getTransmissionVisibility, getTransmissions } from './transmissions.ts';

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
  senderName?: LocalizationObject[] | undefined,
  serviceOwnerNbName?: string,
): ActivityLogItemProps[] => {
  return activities.map((activity) => {
    const clockPrefix = t('word.clock_prefix');
    const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
    const description = getPreferredPropertyByLocale(activity.description)?.value;
    const relatedTransmission = transmissions.find((transmission) => transmission.id === activity.transmissionId);
    const transmissionTitle = getPreferredPropertyByLocale(relatedTransmission?.content.title.value)?.value;
    const actorProps: AvatarProps = getActorProps(
      activity.performedBy,
      stopReversingPersonNameOrder,
      serviceOwner,
      senderName,
      serviceOwnerNbName,
    );
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
      items: TransmissionItemWithMeta[];
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
 * @param senderName
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
  senderName,
  locale,
  serviceOwnerNbName,
}: {
  activities: DialogActivityFragment[];
  transmissions: TransmissionFieldsFragment[];
  format: FormatFunction;
  stopReversingPersonNameOrder: boolean;
  serviceOwner?: OrganizationOutput;
  selectedProfile?: ProfileType;
  senderName?: LocalizationObject[];
  locale: Locale;
  serviceOwnerNbName?: string;
}): ActivityLogEntry[] => {
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;

  const dialogHistoryActivities: ActivityLogEntry[] = getDialogHistoryForActivities(
    activities,
    format,
    transmissions,
    stopReversingPersonNameOrder,
    serviceOwner,
    senderName,
    serviceOwnerNbName,
  ).map((activity) => ({
    id: activity.id ?? '',
    type: 'activity',
    items: [activity],
    date: activity.datetime!,
  }));

  // D: only visible transmissions appear as expandable cards in the activity log modal
  const dialogHistoryTransmissions: ActivityLogEntry[] = getTransmissions({
    transmissions,
    format,
    activities,
    stopReversingPersonNameOrder,
    serviceOwner,
    selectedProfile,
    locale,
    senderName,
    serviceOwnerNbName,
  })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.disabled && !item.isEmpty),
    }))
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      id: group.id ?? '',
      type: 'transmission' as const,
      date: group.items[0].createdAt ?? '',
      items: group.items,
    }));

  // A: API-only transmissions shown as plain text entries in the activity log instead of transmission components
  const apiOnlyTransmissionActivities: ActivityLogEntry[] = transmissions
    .filter((t) => getTransmissionVisibility(t) === 'filter')
    .map((transmission) => ({
      id: transmission.id,
      date: transmission.createdAt,
      type: 'activity' as const,
      items: [
        {
          id: transmission.id,
          summary: <>{t('activity.status.transmission_api_only')}</>,
          byline: format(transmission.createdAt, formatString),
          datetime: transmission.createdAt,
          type: 'activity' as const,
        },
      ],
    }));

  // B: unauthorized transmissions shown as plain text in the activity log; disabled card still shown in the main timeline
  const disabledTransmissionActivities: ActivityLogEntry[] = transmissions
    .filter((t) => getTransmissionVisibility(t) === 'disabled')
    .map((transmission) => ({
      id: transmission.id,
      date: transmission.createdAt,
      type: 'activity' as const,
      items: [
        {
          id: transmission.id,
          summary: <>{t('activity.status.transmission_unauthorized')}</>,
          byline: format(transmission.createdAt, formatString),
          datetime: transmission.createdAt,
          type: 'activity' as const,
        },
      ],
    }));

  // C: empty transmissions shown with their title in the activity log; empty-state card still shown in the main timeline
  const emptyTransmissionActivities: ActivityLogEntry[] = transmissions
    .filter((t) => getTransmissionVisibility(t) === 'empty')
    .map((transmission) => ({
      id: transmission.id,
      date: transmission.createdAt,
      type: 'activity' as const,
      items: [
        {
          id: transmission.id,
          summary: <>{getPreferredPropertyByLocale(transmission.content.title.value)?.value}</>,
          byline: format(transmission.createdAt, formatString),
          datetime: transmission.createdAt,
          type: 'activity' as const,
        },
      ],
    }));

  return [
    ...dialogHistoryActivities,
    ...dialogHistoryTransmissions,
    ...apiOnlyTransmissionActivities,
    ...disabledTransmissionActivities,
    ...emptyTransmissionActivities,
  ].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};
