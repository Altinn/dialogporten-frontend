import {
  type ActivityType,
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  DialogStatus,
  type GuiActionPriority,
  type HttpVerb,
  SystemLabel,
  type TransmissionFieldsFragment,
  type TransmissionType,
} from 'bff-types-generated';
import { UNAUTHORIZED_URL } from '../../constants/sentinelUrls.ts';
import type { Actor, Attachment, Localization, PreviewDialog, Transmission } from './dialogSchema.ts';

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

const toAttachment = (attachment: Attachment, id: string): AttachmentFieldsFragment => ({
  id: attachment.id ?? id,
  expiresAt: attachment.expiresAt ?? null,
  displayName: toLocalizations(attachment.displayName),
  urls: attachment.urls.map((url, index) => ({
    id: url.id ?? `${id}-url-${index}`,
    url: url.url,
    mediaType: url.mediaType ?? null,
    consumerType: url.consumerType === 'Api' ? AttachmentUrlConsumer.Api : AttachmentUrlConsumer.Gui,
  })),
});

const toTransmission = (transmission: Transmission, index: number, createdAt: string): TransmissionFieldsFragment => {
  const id = transmission.id ?? `transmission-${index}`;
  return {
    id,
    isAuthorized: true,
    createdAt: transmission.createdAt ?? createdAt,
    type: toEnumValue<TransmissionType>(transmission.type),
    relatedTransmissionId: transmission.relatedTransmissionId ?? null,
    sender: toActor(transmission.sender),
    content: {
      title: { mediaType: DEFAULT_MEDIA_TYPE, value: toLocalizations(transmission.content.title.value) },
      summary: toContentValue(transmission.content.summary),
      contentReference: null,
    },
    attachments: (transmission.attachments ?? []).map((attachment, attachmentIndex) =>
      toAttachment(attachment, `${id}-attachment-${attachmentIndex}`),
    ),
    navigationalActions: (transmission.navigationalActions ?? []).map((action) => ({
      url: action.url,
      expiresAt: action.expiresAt ?? null,
      title: toLocalizations(action.title),
    })),
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
  const transmissions = (dialog.transmissions ?? []).map((transmission, index) =>
    toTransmission(transmission, index, new Date(now.getTime() - index * 60_000).toISOString()),
  );

  return {
    id: PREVIEW_DIALOG_ID,
    dialogToken: PREVIEW_DIALOG_TOKEN,
    party,
    org,
    progress: dialog.progress ?? null,
    serviceResourceType,
    fromServiceOwnerTransmissionsCount: transmissions.filter((t) => t.sender.actorType === ActorType.ServiceOwner)
      .length,
    fromPartyTransmissionsCount: transmissions.filter((t) => t.sender.actorType === ActorType.PartyRepresentative)
      .length,
    isContentSeen: true,
    status: toStatus(dialog.status),
    dueAt: dialog.dueAt ?? null,
    createdAt: dialog.createdAt ?? nowIso,
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
    attachments: (dialog.attachments ?? []).map((attachment, index) => toAttachment(attachment, `attachment-${index}`)),
    activities: (dialog.activities ?? []).map((activity, index) => ({
      id: activity.id ?? `activity-${index}`,
      transmissionId: activity.transmissionId ?? null,
      type: toEnumValue<ActivityType>(activity.type),
      createdAt: activity.createdAt ?? nowIso,
      performedBy: toActor(activity.performedBy),
      description: toLocalizations(activity.description),
    })),
    guiActions: (dialog.guiActions ?? []).map((action, index) => ({
      id: action.id ?? `gui-action-${index}`,
      url: action.url,
      isAuthorized: action.url !== UNAUTHORIZED_URL,
      isDeleteDialogAction: action.isDeleteDialogAction ?? false,
      action: action.action,
      authorizationAttribute: action.authorizationAttribute ?? null,
      priority: toEnumValue<GuiActionPriority>(action.priority),
      httpMethod: (action.httpMethod ?? 'GET') as HttpVerb,
      title: toLocalizations(action.title),
      prompt: action.prompt ? toLocalizations(action.prompt) : null,
    })),
    transmissions,
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
