import {
  type ActivityType,
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  DialogStatus,
  type ExcludedElementFieldsFragment,
  type GuiActionPriority,
  type HttpVerb,
  SystemLabel,
  type TransmissionFieldsFragment,
  type TransmissionType,
} from 'bff-types-generated';
import { UNAUTHORIZED_URL } from '../../constants/sentinelUrls.ts';
import type {
  Actor,
  Attachment,
  AuthorizationContext,
  Localization,
  NavigationalAction,
  PreviewDialog,
  Transmission,
  UnauthorizedPresentation,
} from './dialogSchema.ts';

export const PREVIEW_DIALOG_ID = 'preview';
export const PREVIEW_DIALOG_TOKEN = 'preview';

const DEFAULT_MEDIA_TYPE = 'text/plain';

const LEGACY_STATUSES: Record<string, DialogStatus> = {
  New: DialogStatus.NotApplicable,
  Sent: DialogStatus.Awaiting,
};

interface ToDialogFragmentArgs {
  dialog: PreviewDialog;
  party: string;
  org: string;
  serviceResourceType: string;
  endUserName: string;
  now: Date;
}

const toEnumValue = <T extends string>(value: string): T =>
  value.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase() as T;

const toLocalizations = (values: Localization[] | null | undefined) =>
  (values ?? []).map(({ languageCode, value }) => ({ languageCode, value }));

const toContentValue = (content: { value: Localization[]; mediaType?: string | null } | null | undefined) =>
  content ? { mediaType: content.mediaType ?? DEFAULT_MEDIA_TYPE, value: toLocalizations(content.value) } : null;

const toActor = ({ actorType, actorId, actorName }: Actor) => ({
  actorType: toEnumValue<ActorType>(actorType),
  actorId: actorId ?? null,
  actorName: actorName ?? null,
});

interface WithAuthorizationContext {
  id?: string | null;
  authorizationContext?: AuthorizationContext | null;
}

interface AuthorizedItem<T> {
  item: T;
  id: string;
  isDisabled: boolean;
}

const splitByPresentation = <T extends WithAuthorizationContext>(
  items: T[] | null | undefined,
  idPrefix: string,
  getCreatedAt: (item: T) => string,
  inherited?: UnauthorizedPresentation,
) => {
  const authorized = (items ?? []).map((item, index) => ({
    item,
    id: item.id ?? `${idPrefix}-${index}`,
    presentation: item.authorizationContext?.unauthorizedPresentation ?? inherited,
  }));
  return {
    visible: authorized
      .filter(({ presentation }) => presentation !== 'Excluded')
      .map(({ item, id, presentation }): AuthorizedItem<T> => ({ item, id, isDisabled: presentation === 'Disabled' })),
    excluded: authorized
      .filter(({ presentation }) => presentation === 'Excluded')
      .map(({ item, id }): ExcludedElementFieldsFragment => ({ id, createdAt: getCreatedAt(item) })),
  };
};

const toAttachment = ({ item: attachment, id, isDisabled }: AuthorizedItem<Attachment>): AttachmentFieldsFragment => ({
  id,
  expiresAt: attachment.expiresAt ?? null,
  displayName: toLocalizations(attachment.displayName),
  urls: attachment.urls.map((url, index) => ({
    id: url.id ?? `${id}-url-${index}`,
    url: isDisabled ? UNAUTHORIZED_URL : url.url,
    mediaType: url.mediaType ?? null,
    consumerType: url.consumerType === 'Api' ? AttachmentUrlConsumer.Api : AttachmentUrlConsumer.Gui,
  })),
});

const toNavigationalAction = ({ item: action, isDisabled }: AuthorizedItem<NavigationalAction>) => ({
  url: isDisabled ? UNAUTHORIZED_URL : action.url,
  expiresAt: action.expiresAt ?? null,
  title: toLocalizations(action.title),
});

const toTransmission = (
  { item: transmission, id, isDisabled }: AuthorizedItem<Transmission>,
  createdAt: string,
): TransmissionFieldsFragment => {
  const inherited = isDisabled ? 'Disabled' : undefined;
  const getCreatedAt = () => createdAt;
  const attachments = splitByPresentation(transmission.attachments, `${id}-attachment`, getCreatedAt, inherited);
  const navigationalActions = splitByPresentation(
    transmission.navigationalActions,
    `${id}-navigational-action`,
    getCreatedAt,
    inherited,
  );
  return {
    id,
    isAuthorized: !isDisabled,
    createdAt,
    type: toEnumValue<TransmissionType>(transmission.type),
    relatedTransmissionId: transmission.relatedTransmissionId ?? null,
    sender: toActor(transmission.sender),
    content: {
      title: { mediaType: DEFAULT_MEDIA_TYPE, value: toLocalizations(transmission.content.title.value) },
      summary: toContentValue(transmission.content.summary),
      contentReference: null,
    },
    attachments: attachments.visible.map(toAttachment),
    excludedAttachments: attachments.excluded,
    navigationalActions: navigationalActions.visible.map(toNavigationalAction),
    excludedNavigationalActions: navigationalActions.excluded,
  };
};

const toStatus = (status: PreviewDialog['status']): DialogStatus => {
  if (!status) {
    return DialogStatus.NotApplicable;
  }
  return LEGACY_STATUSES[status] ?? toEnumValue<DialogStatus>(status);
};

export const toDialogFragment = ({
  dialog,
  party,
  org,
  serviceResourceType,
  endUserName,
  now,
}: ToDialogFragmentArgs): DialogByIdFieldsFragment => {
  const nowIso = now.toISOString();
  const createdAt = dialog.createdAt ?? nowIso;
  const getDialogCreatedAt = () => createdAt;
  const datedTransmissions = (dialog.transmissions ?? []).map((transmission, index) => ({
    ...transmission,
    createdAt: transmission.createdAt ?? new Date(now.getTime() - index * 60_000).toISOString(),
  }));
  const splitTransmissions = splitByPresentation(datedTransmissions, 'transmission', (item) => item.createdAt);
  const transmissions = splitTransmissions.visible.map((transmission) =>
    toTransmission(transmission, transmission.item.createdAt),
  );
  const attachments = splitByPresentation(dialog.attachments, 'attachment', getDialogCreatedAt);
  const guiActions = splitByPresentation(dialog.guiActions, 'gui-action', getDialogCreatedAt);

  return {
    id: PREVIEW_DIALOG_ID,
    dialogToken: PREVIEW_DIALOG_TOKEN,
    party,
    org,
    progress: dialog.progress ?? null,
    serviceResourceType,
    fromServiceOwnerTransmissionsCount: datedTransmissions.filter(({ sender }) => sender.actorType === 'ServiceOwner')
      .length,
    fromPartyTransmissionsCount: datedTransmissions.filter(({ sender }) => sender.actorType === 'PartyRepresentative')
      .length,
    isContentSeen: true,
    status: toStatus(dialog.status),
    dueAt: dialog.dueAt ?? null,
    createdAt,
    contentUpdatedAt: dialog.updatedAt ?? nowIso,
    endUserContext: {
      systemLabels: [dialog.systemLabel ? toEnumValue<SystemLabel>(dialog.systemLabel) : SystemLabel.Default],
    },
    seenSinceLastContentUpdate: [
      {
        id: 'seen-by-end-user',
        seenAt: nowIso,
        isCurrentEndUser: true,
        seenBy: { actorType: ActorType.PartyRepresentative, actorId: null, actorName: endUserName },
      },
    ],
    attachments: attachments.visible.map(toAttachment),
    excludedAttachments: attachments.excluded,
    activities: (dialog.activities ?? []).map((activity, index) => ({
      id: activity.id ?? `activity-${index}`,
      transmissionId: activity.transmissionId ?? null,
      type: toEnumValue<ActivityType>(activity.type),
      createdAt: activity.createdAt ?? nowIso,
      performedBy: toActor(activity.performedBy),
      description: toLocalizations(activity.description),
    })),
    guiActions: guiActions.visible.map(({ item: action, id, isDisabled }) => {
      const isAuthorized = !isDisabled && action.url !== UNAUTHORIZED_URL;
      return {
        id,
        url: isAuthorized ? action.url : UNAUTHORIZED_URL,
        isAuthorized,
        isDeleteDialogAction: action.isDeleteDialogAction ?? false,
        action: action.action ?? action.authorizationContext?.action ?? 'read',
        authorizationAttribute: action.authorizationAttribute ?? null,
        priority: toEnumValue<GuiActionPriority>(action.priority),
        httpMethod: (action.httpMethod ?? 'GET') as HttpVerb,
        title: toLocalizations(action.title),
        prompt: action.prompt ? toLocalizations(action.prompt) : null,
      };
    }),
    excludedGuiActions: guiActions.excluded,
    transmissions,
    excludedTransmissions: splitTransmissions.excluded,
    content: {
      title: { mediaType: DEFAULT_MEDIA_TYPE, value: toLocalizations(dialog.content.title.value) },
      summary: toContentValue(dialog.content.summary),
      senderName: toContentValue(dialog.content.senderName),
      additionalInfo: toContentValue(dialog.content.additionalInfo),
      extendedStatus: toContentValue(dialog.content.extendedStatus),
      mainContentReference: null,
    },
  };
};
