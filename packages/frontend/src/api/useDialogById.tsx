import type { AttachmentLinkProps, AvatarProps, SeenByLogProps } from '@altinn/altinn-components';
import type { DialogHistorySegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type Actor,
  ActorType,
  type AttachmentFieldsFragment,
  type DialogActivityFragment,
  type DialogByIdFieldsFragment,
  type DialogStatus,
  type GetDialogByIdQuery,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { AttachmentUrlConsumer } from 'bff-types-generated';
import { t } from 'i18next';
import type { DialogActionProps } from '../components';
import { QUERY_KEYS } from '../constants/queryKeys.ts';
import { type ValueType, getPreferredPropertyByLocale } from '../i18n/property.ts';
import { useFormat } from '../i18n/useDateFnsLocale.tsx';
import type { FormatFunction } from '../i18n/useDateFnsLocale.tsx';
import { useOrganizations } from '../pages/Inbox/useOrganizations.ts';
import { toTitleCase } from '../profile';
import { type OrganizationOutput, getOrganization } from './organizations.ts';
import { graphQLSDK } from './queries.ts';
import { getDialogHistoryForTransmissions } from './transmissions.ts';
import { getSeenByLabel } from './useDialogs.tsx';

export enum EmbeddableMediaType {
  markdown = 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
  html = 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
  markdown_deprecated = 'application/vnd.dialogporten.frontchannelembed+json;type=markdown',
  html_deprecated = 'application/vnd.dialogporten.frontchannelembed+json;type=html',
}

export interface EmbeddedContent {
  url: string;
  mediaType: EmbeddableMediaType;
}

export interface DialogActivity {
  id: string;
  type: DialogActivityFragment['type'];
  createdAt: string;
  description: string;
  performedBy: AvatarProps;
}

export interface DialogByIdDetails {
  summary: string;
  sender: AvatarProps;
  receiver: AvatarProps;
  title: string;
  guiActions: DialogActionProps[];
  additionalInfo: { value: string; mediaType: string } | undefined;
  attachments: AttachmentLinkProps[];
  dialogToken: string;
  mainContentReference?: EmbeddedContent;
  activities: DialogActivity[];
  updatedAt: string;
  createdAt: string;
  label: SystemLabel;
  transmissions: DialogHistorySegmentProps[];
  contentReferenceForTransmissions: Record<string, EmbeddedContent>;
  status: DialogStatus;
  dueAt?: string;
  seenByLog?: SeenByLogProps;
}

interface UseDialogByIdOutput {
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  dialog?: DialogByIdDetails;
}
export const getDialogsById = (id: string): Promise<GetDialogByIdQuery> =>
  graphQLSDK.getDialogById({
    id,
  });

export const getAttachmentLinks = (attachments: AttachmentFieldsFragment[]): AttachmentLinkProps[] => {
  return attachments
    .filter((a) => a.urls.filter((url) => url.consumerType === AttachmentUrlConsumer.Gui).length > 0)
    .flatMap((attachment) =>
      attachment.urls.map((url) => ({
        label: getPreferredPropertyByLocale(attachment.displayName)?.value || url.url,
        href: url.url,
      })),
    );
};

const getMainContentReference = (
  args: { value: ValueType; mediaType: string } | undefined | null,
): EmbeddedContent | undefined => {
  if (typeof args === 'undefined' || args === null) return undefined;

  const { value, mediaType } = args;
  const content = getPreferredPropertyByLocale(value);
  const isValidMediaType = Object.values(EmbeddableMediaType).includes(mediaType as EmbeddableMediaType);

  if (!content || !isValidMediaType) return undefined;

  return {
    url: content.value,
    mediaType: mediaType as EmbeddableMediaType,
  };
};

export const getActorProps = (actor: Actor, serviceOwner?: OrganizationOutput) => {
  const isCompany =
    actor.actorType === ActorType.ServiceOwner || (actor.actorId ?? '').includes('urn:altinn:organization:');
  const type = isCompany ? 'company' : ('person' as AvatarProps['type']);
  const hasSenderName = (actor.actorName?.length ?? 0) > 0;
  const senderName = hasSenderName ? toTitleCase(actor.actorName) : (serviceOwner?.name ?? '');
  const senderLogo = isCompany ? serviceOwner?.logo : undefined;
  return {
    name: senderName,
    type,
    imageUrl: senderLogo,
    imageUrlAlt: t('dialog.imageAltURL', { companyName: senderName }),
  };
};

export function mapDialogToToInboxItem(
  item: DialogByIdFieldsFragment | null | undefined,
  parties: PartyFieldsFragment[],
  organizations: OrganizationFieldsFragment[],
  format: FormatFunction,
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
  const dialogReceiverParty = parties?.find((party) => party.party === item.party);
  const actualReceiverParty = dialogReceiverParty ?? endUserParty;
  const serviceOwner = getOrganization(organizations || [], item.org, 'nb');
  const senderName = item.content.senderName?.value;
  const { seenByLabel } = getSeenByLabel(item.seenSinceLastUpdate, t);

  return {
    title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
    status: item.status,
    summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
    sender: {
      name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
      type: 'company',
      imageUrl: serviceOwner?.logo,
      imageUrlAlt: t('dialog.imageAltURL', { companyName: getPreferredPropertyByLocale(senderName)?.value }),
    },
    receiver: {
      name: actualReceiverParty?.name ?? '',
      type: actualReceiverParty?.partyType === 'Organization' ? 'company' : 'person',
    },
    additionalInfo: {
      value: getPreferredPropertyByLocale(additionalInfoObj)?.value ?? '',
      mediaType: item.content?.additionalInfo?.mediaType ?? '',
    },
    guiActions: item.guiActions.map((guiAction) => ({
      id: guiAction.id,
      url: guiAction.url,
      hidden: !guiAction.isAuthorized || (guiAction.isDeleteDialogAction && item.systemLabel !== SystemLabel.Bin),
      priority: guiAction.priority,
      httpMethod: guiAction.httpMethod,
      title: getPreferredPropertyByLocale(guiAction.title)?.value ?? '',
      prompt: getPreferredPropertyByLocale(guiAction.prompt)?.value,
      isDeleteAction: guiAction.isDeleteDialogAction,
      disabled: !guiAction.isAuthorized,
    })),
    attachments: getAttachmentLinks(item.attachments),
    mainContentReference: getMainContentReference(mainContentReference),
    contentReferenceForTransmissions: item.transmissions.reduce(
      (acc, transmission) => {
        const reference = getMainContentReference(transmission.content?.contentReference);
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
      items: item.seenSinceLastUpdate.map((seen) => ({
        id: seen.id,
        isEndUser: seen.isCurrentEndUser,
        name: (seen?.isCurrentEndUser ? (endUserParty?.name ?? '') : toTitleCase(seen.seenBy?.actorName ?? '')) || '',
        seenAt: seen.seenAt,
        seenAtLabel: format(seen.seenAt, formatString),
        type: 'person',
      })),
    },
    activities: item.activities
      .map((activity) => {
        const actorProps = getActorProps(activity.performedBy, serviceOwner);
        return {
          id: activity.id,
          type: activity.type,
          createdAt: activity.createdAt,
          performedBy: actorProps,
          description: getPreferredPropertyByLocale(activity.description)?.value ?? '',
        };
      })
      .reverse(),
    transmissions: getDialogHistoryForTransmissions(item.transmissions, format, serviceOwner),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    label: item.systemLabel,
    dueAt: item.dueAt,
  };
}

export const useDialogById = (parties: PartyFieldsFragment[], id?: string): UseDialogByIdOutput => {
  const queryClient = useQueryClient();
  const format = useFormat();
  const { organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const partyURIs = parties.map((party) => party.party);
  const { data, isSuccess, isLoading, isError } = useQuery<GetDialogByIdQuery>({
    queryKey: [QUERY_KEYS.DIALOG_BY_ID, id, organizations],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () =>
      getDialogsById(id!).then((data) => {
        if (data?.dialogById.dialog) {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
        }
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
    dialog: mapDialogToToInboxItem(data?.dialogById.dialog, parties, organizations, format),
    isError,
  };
};
