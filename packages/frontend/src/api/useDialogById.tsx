import type { AvatarProps } from '@altinn/altinn-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActorType,
  type AttachmentFieldsFragment,
  type DialogActivityFragment,
  type DialogByIdFieldsFragment,
  type DialogStatus,
  type GetDialogByIdQuery,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  type SystemLabel,
  type TransmissionFieldsFragment,
} from 'bff-types-generated';
import { AttachmentUrlConsumer } from 'bff-types-generated';
import { t } from 'i18next';
import type { GuiActionButtonProps } from '../components';
import { QUERY_KEYS } from '../constants/queryKeys.ts';
import { type ValueType, getPreferredPropertyByLocale } from '../i18n/property.ts';
import { useOrganizations } from '../pages/Inbox/useOrganizations.ts';
import { toTitleCase } from '../profile';
import { getOrganization } from './organizations.ts';
import { graphQLSDK } from './queries.ts';
import { getSeenByLabel } from './useDialogs.tsx';

export interface Participant {
  name: string;
  isCompany: boolean;
  imageURL?: string;
}

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
  performedBy: DialogActivityFragment['performedBy'];
}

export interface DialogTransmission {
  id: string;
  type: TransmissionFieldsFragment['type'];
  createdAt: string;
  sender: AvatarProps;
  attachments: TransmissionFieldsFragment['attachments'];
  title: string;
  summary: string;
}

export interface DialogByIdDetails {
  summary: string;
  sender: Participant;
  receiver: Participant;
  title: string;
  guiActions: GuiActionButtonProps[];
  additionalInfo: { value: string; mediaType: string } | undefined;
  attachments: AttachmentFieldsFragment[];
  dialogToken: string;
  mainContentReference?: EmbeddedContent;
  activities: DialogActivity[];
  updatedAt: string;
  createdAt: string;
  label: SystemLabel;
  transmissions: DialogTransmission[];
  status: DialogStatus;
  dueAt?: string;
  isSeenByEndUser: boolean;
  seenByOthersCount: number;
  seenByLabel?: string;
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

export function mapDialogToToInboxItem(
  item: DialogByIdFieldsFragment | null | undefined,
  parties: PartyFieldsFragment[],
  organizations: OrganizationFieldsFragment[],
): DialogByIdDetails | undefined {
  if (!item) {
    return undefined;
  }

  const titleObj = item?.content?.title?.value;
  const additionalInfoObj = item?.content?.additionalInfo?.value;
  const summaryObj = item?.content?.summary?.value;
  const mainContentReference = item?.content?.mainContentReference;
  const endUserParty = parties?.find((party) => party.isCurrentEndUser);
  const dialogReceiverParty = parties?.find((party) => party.party === item.party);
  const actualReceiverParty = dialogReceiverParty ?? endUserParty;
  const serviceOwner = getOrganization(organizations || [], item.org, 'nb');
  const senderName = item.content.senderName?.value;
  const { isSeenByEndUser, seenByOthersCount, seenByLabel } = getSeenByLabel(item.seenSinceLastUpdate, t);

  return {
    title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
    status: item.status,
    summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
    sender: {
      name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
      isCompany: true,
      imageURL: serviceOwner?.logo,
    },
    receiver: {
      name: actualReceiverParty?.name ?? '',
      isCompany: actualReceiverParty?.partyType === 'Organization',
    },
    additionalInfo: {
      value: getPreferredPropertyByLocale(additionalInfoObj)?.value ?? '',
      mediaType: item.content?.additionalInfo?.mediaType ?? '',
    },
    guiActions: item.guiActions.map((guiAction) => ({
      id: guiAction.id,
      url: guiAction.url,
      hidden: !guiAction.isAuthorized,
      priority: guiAction.priority,
      httpMethod: guiAction.httpMethod,
      title: getPreferredPropertyByLocale(guiAction.title)?.value ?? '',
      prompt: getPreferredPropertyByLocale(guiAction.prompt)?.value,
      isDeleteAction: guiAction.isDeleteDialogAction,
      disabled: !guiAction.isAuthorized,
    })),
    attachments: item.attachments.filter(
      (a) => a.urls.filter((url) => url.consumerType === AttachmentUrlConsumer.Gui).length > 0,
    ),
    mainContentReference: getMainContentReference(mainContentReference),
    dialogToken: item.dialogToken!,
    isSeenByEndUser,
    seenByLabel,
    seenByOthersCount,
    activities: item.activities
      .map((activity) => ({
        id: activity.id,
        type: activity.type,
        createdAt: activity.createdAt,
        performedBy: activity.performedBy,
        description: getPreferredPropertyByLocale(activity.description)?.value ?? '',
      }))
      .reverse(),
    transmissions: item.transmissions
      .map((transmission) => {
        const senderType =
          transmission.sender.actorType === ActorType.ServiceOwner ||
          (transmission.sender.actorId ?? '').includes('urn:altinn:organization:');
        const hasSenderName = (transmission.sender.actorName?.length ?? 0) > 0;
        const senderName = hasSenderName ? toTitleCase(transmission.sender.actorName) : (serviceOwner?.name ?? '');
        const senderLogo = senderType ? serviceOwner?.logo : undefined;
        const titleObj = transmission.content.title.value;
        const summaryObj = transmission.content.summary.value;
        return {
          id: transmission.id,
          type: transmission.type,
          createdAt: transmission.createdAt,
          sender: {
            name: senderName,
            type: senderType ? 'company' : ('person' as AvatarProps['type']),
            imageUrl: senderLogo,
          },
          attachments: transmission.attachments,
          title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
          summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
        };
      })
      .reverse(),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    label: item.systemLabel,
    dueAt: item.dueAt,
  };
}
export const useDialogById = (parties: PartyFieldsFragment[], id?: string): UseDialogByIdOutput => {
  const queryClient = useQueryClient();
  const { organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const partyURIs = parties.map((party) => party.party);
  const { data, isSuccess, isLoading, isError } = useQuery<GetDialogByIdQuery>({
    queryKey: [QUERY_KEYS.DIALOG_BY_ID, id, organizations],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () =>
      getDialogsById(id!).then((data) => {
        if (data?.dialogById.dialog) {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
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
    dialog: mapDialogToToInboxItem(data?.dialogById.dialog, parties, organizations),
    isError,
  };
};
