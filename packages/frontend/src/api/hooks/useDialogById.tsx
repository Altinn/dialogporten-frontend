import type { AttachmentLinkProps, AvatarProps, SeenByLogProps } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import {
  type Actor,
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  type DialogStatus,
  type GetDialogByIdQuery,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { t } from 'i18next';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import type { DialogActionProps } from '../../components';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { type ValueType, getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { graphQLSDK } from '../queries.ts';
import { type ActivityLogEntry, getActivityHistory } from '../utils/activities.tsx';
import { getSeenByLabel } from '../utils/dialog.ts';
import { type OrganizationOutput, getOrganization } from '../utils/organizations.ts';
import { type TimelineSegmentWithTransmissions, getTransmissions } from '../utils/transmissions.ts';
import { getViewTypes } from '../utils/viewType.ts';
import type { InboxViewType } from './useDialogs.tsx';
import { type SelectedPartyType, useParties } from './useParties.ts';

export enum EmbeddableMediaType {
  markdown = 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
  html = 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
}

export interface EmbeddedContent {
  /* URL to content provided by service owner */
  url: string;
  /* Media type of content */
  mediaType: EmbeddableMediaType;
}

export interface DialogByIdDetails {
  /* id of dialog */
  id: string;
  /* summary of dialog by locale,sorted by preference */
  summary: string;
  /* sender of dialog, fallbacks to dialog's service owner */
  sender: AvatarProps;
  /* recipient of dialog, fallbacks to current end-user */
  receiver: AvatarProps;
  /* title of dialog by locale,sorted by preference */
  title: string;
  /* actions available for dialog  */
  guiActions: DialogActionProps[];
  /* additional info of dialog by locale, sorted by preference - can be markdown / HTML */
  additionalInfo: { value: string; mediaType: string } | undefined;
  /* attachments for dialog, same of each attachment can be represented differently through list of URLs  */
  attachments: AttachmentLinkProps[];
  /* Used for guiActions and front channel embeds */
  dialogToken: string;
  /* main content reference for dialog, used to dynamically embed content in the frontend from an external URL. */
  mainContentReference?: EmbeddedContent;
  /* all activities for dialog, including transmissions */
  activityHistory: ActivityLogEntry[];
  /* last updated timestamp */
  updatedAt: string;
  /* created timestamp */
  createdAt: string;
  /* list of system labels for the dialog */
  label: SystemLabel[];
  /* all transmissions for dialog, grouped by relationship */
  transmissions: TimelineSegmentWithTransmissions[];
  /* a map of all content references for all content reference for transmission, used to dynamically embed content in the frontend from an external URL. */
  contentReferenceForTransmissions: Record<string, EmbeddedContent>;

  /* dialog status */
  status: DialogStatus;
  /* all actions (including end-user) that have seen the dialog since last update */
  seenByLog: SeenByLogProps;
  /* due date for dialog: This is the last date when the dialog is expected to be completed. */
  dueAt?: string;
  /* view type of dialog, used for grouping in inbox */
  viewType: InboxViewType;
  /* Number of outgoing transmissions */
  sentCount?: number;
  /* Number of incoming transmissions */
  receivedCount?: number;
}

interface UseDialogByIdOutput {
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  dialog?: DialogByIdDetails;
  isAuthLevelTooLow?: boolean;
}
export const getDialogsById = (id: string): Promise<GetDialogByIdQuery> =>
  graphQLSDK.getDialogById({
    id,
  });

export const getAttachmentLinks = (attachments: AttachmentFieldsFragment[]): AttachmentLinkProps[] => {
  return attachments
    .filter((a) => a.urls.filter((url) => url.consumerType === AttachmentUrlConsumer.Gui).length > 0)
    .flatMap((attachment) =>
      attachment.urls
        .filter((url) => url.url !== 'urn:dialogporten:unauthorized')
        .map((url) => ({
          label: getPreferredPropertyByLocale(attachment.displayName)?.value || url.url,
          href: url.url,
        })),
    );
};

const getMainContentReference = (
  args: { value: ValueType; mediaType: string } | undefined | null,
  isAuthorized: boolean,
): EmbeddedContent | undefined => {
  if (!isAuthorized || typeof args === 'undefined' || args === null) return undefined;

  const { value, mediaType } = args;
  const content = getPreferredPropertyByLocale(value);
  const isValidMediaType = Object.values(EmbeddableMediaType).includes(mediaType as EmbeddableMediaType);

  if (!content || !isValidMediaType) return undefined;

  return {
    url: content.value,
    mediaType: mediaType as EmbeddableMediaType,
  };
};

/**
 * Maps an `Actor` (sender of a transmission or activity) to normalized
 * display props used by the Avatar component.
 *
 * Rules:
 * - `actor.actorType === ServiceOwner`: Always treated as a company.
 *   Will use `serviceOwner.name` and `serviceOwner.logo` if available.
 * - `actor.actorId` containing `"urn:altinn:organization:"`: Treated as a company.
 * - Otherwise: Treated as a person.
 *
 * Name resolution:
 * - Prefer `actor.actorName` if present.
 * - If missing and the actor is a `ServiceOwner`, fall back to `serviceOwner?.name`.
 * - Otherwise empty string.
 *
 * Logo resolution:
 * - Only provided for `ServiceOwner` actors (from `serviceOwner?.logo`).
 *
 * Notes:
 * - `actorName` may be `null` in edge cases if Dialogporten lookup fails,
 *   but is generally expected to be set for transmissions.
 *
 * @param actor        The actor object describing who performed or sent the action.
 * @param serviceOwner Optional service owner metadata used for name/logo fallback.
 * @returns Normalized avatar props (`name`, `type`, `imageUrl`, `imageUrlAlt`).
 */
export const getActorProps = (actor: Actor, serviceOwner?: OrganizationOutput): AvatarProps => {
  const isServiceOwner = actor.actorType === ActorType.ServiceOwner;
  const isCompany = isServiceOwner || (actor.actorId ?? '').includes('urn:altinn:organization:');
  const type: AvatarProps['type'] = isCompany ? 'company' : 'person';
  const actorName = formatDisplayName({
    fullName: actor.actorName ?? '',
    type: 'person',
    reverseNameOrder: true,
  });
  const senderName = actor.actorName ? actorName : isServiceOwner ? serviceOwner?.name || '' : '';
  const senderLogo = isServiceOwner ? serviceOwner?.logo : undefined;
  const senderLogoAlt = senderLogo ? t('dialog.imageAltURL', { companyName: senderName }) : undefined;

  return {
    name: senderName,
    type,
    imageUrl: senderLogo,
    imageUrlAlt: senderLogoAlt,
  };
};

export function mapDialogToToInboxItem(
  item: DialogByIdFieldsFragment | null | undefined,
  parties: PartyFieldsFragment[],
  organizations: OrganizationFieldsFragment[],
  format: FormatFunction,
  selectedProfile: SelectedPartyType,
): DialogByIdDetails | undefined {
  if (!item) {
    return undefined;
  }
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  const titleObj = item?.content?.title?.value;
  const additionalInfoObj = item?.content?.additionalInfo?.value;
  const summaryObj = item?.content?.summary?.value;
  const mainContentReference = item?.content?.mainContentReference;
  const endUserParty = parties?.find((party) => party.isCurrentEndUser);
  const dialogRecipientParty = parties?.find((party) => party.party === item.party);
  const actualRecipientParty = dialogRecipientParty ?? endUserParty;
  const serviceOwner = getOrganization(organizations || [], item.org, 'nb');
  const senderName = item.content.senderName?.value;
  const { seenByLabel } = getSeenByLabel(item.seenSinceLastContentUpdate, t);
  const transmissions = getTransmissions({
    transmissions: item.transmissions,
    format,
    activities: item.activities,
    serviceOwner,
    selectedProfile,
  });

  return {
    id: item.id,
    title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
    status: item.status,
    summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
    sentCount: item.fromPartyTransmissionsCount ?? 0,
    receivedCount: item.fromServiceOwnerTransmissionsCount ?? 0,
    sender: {
      name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
      type: 'company',
      imageUrl: serviceOwner?.logo,
      imageUrlAlt: t('dialog.imageAltURL', { companyName: getPreferredPropertyByLocale(senderName)?.value }),
    },
    receiver: {
      name: actualRecipientParty?.name ?? '',
      type: actualRecipientParty?.partyType === 'Organization' ? 'company' : 'person',
    },
    additionalInfo: {
      value: getPreferredPropertyByLocale(additionalInfoObj)?.value ?? '',
      mediaType: item.content?.additionalInfo?.mediaType ?? '',
    },
    guiActions: item.guiActions.map((guiAction) => ({
      id: guiAction.id,
      url: guiAction.url,
      hidden:
        !guiAction.isAuthorized ||
        (guiAction.isDeleteDialogAction && !item.endUserContext?.systemLabels.includes(SystemLabel.Bin)),
      priority: guiAction.priority,
      httpMethod: guiAction.httpMethod,
      title: getPreferredPropertyByLocale(guiAction.title)?.value ?? '',
      prompt: getPreferredPropertyByLocale(guiAction.prompt)?.value,
      isDeleteAction: guiAction.isDeleteDialogAction,
      disabled: !guiAction.isAuthorized,
    })),
    attachments: getAttachmentLinks(item.attachments),
    mainContentReference: getMainContentReference(mainContentReference, true),
    contentReferenceForTransmissions: item.transmissions.reduce(
      (acc, transmission) => {
        const reference = getMainContentReference(transmission.content?.contentReference, transmission.isAuthorized);
        if (reference) {
          acc[transmission.id] = reference;
        }
        return acc;
      },
      {} as Record<string, EmbeddedContent>,
    ),
    dialogToken: item.dialogToken!,
    seenByLog: {
      collapsible: true,
      title: seenByLabel,
      endUserLabel: t('word.you'),
      items: item.seenSinceLastContentUpdate.map((seen) => ({
        id: seen.id,
        isEndUser: seen.isCurrentEndUser,
        name: seen?.isCurrentEndUser
          ? (endUserParty?.name ?? '')
          : formatDisplayName({ fullName: seen?.seenBy?.actorName ?? '', type: 'person', reverseNameOrder: true }),
        seenAt: seen.seenAt,
        seenAtLabel: format(seen.seenAt, formatString),
        type: 'person',
      })),
    },
    activityHistory: getActivityHistory({
      activities: item.activities,
      transmissions: item.transmissions,
      format,
      serviceOwner,
      selectedProfile,
    }),
    transmissions,
    createdAt: item.createdAt,
    updatedAt: item.contentUpdatedAt,
    label: item.endUserContext?.systemLabels,
    viewType: getViewTypes({ status: item.status, systemLabel: item.endUserContext?.systemLabels }, true)?.[0],
    dueAt: item.dueAt,
  };
}

export const useDialogById = (parties: PartyFieldsFragment[], id?: string): UseDialogByIdOutput => {
  const format = useFormat();
  const { organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const { selectedProfile } = useParties();
  const partyURIs = parties.map((party) => party.party);
  const { data, isSuccess, isLoading, isError } = useAuthenticatedQuery<GetDialogByIdQuery>({
    queryKey: [QUERY_KEYS.DIALOG_BY_ID, id, organizations],
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 3,
    queryFn: () =>
      getDialogsById(id!).then((data) => {
        return data;
      }),
    enabled: typeof id !== 'undefined' && partyURIs.length > 0,
  });

  if (isOrganizationsLoading) {
    return { isLoading: true, isError: false, isSuccess: false };
  }

  return {
    isLoading,
    isSuccess,
    dialog: mapDialogToToInboxItem(data?.dialogById.dialog, parties, organizations, format, selectedProfile),
    isError,
    isAuthLevelTooLow:
      data?.dialogById?.errors?.some((error) => error.__typename === 'DialogByIdForbiddenAuthLevelTooLow') ?? false,
  };
};
