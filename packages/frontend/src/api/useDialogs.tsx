import { useQuery } from '@tanstack/react-query';

import {
  DialogStatus,
  type GetAllDialogsForPartiesQuery,
  type GetSearchAutocompleteDialogsQuery,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  type SearchAutocompleteDialogFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { t } from 'i18next';
import type { InboxItemInput, InboxItemMetaField, InboxItemMetaFieldType } from '../components';
import { QUERY_KEYS } from '../constants/queryKeys.ts';
import { i18n } from '../i18n/config.ts';
import { getPreferredPropertyByLocale } from '../i18n/property.ts';
import { useOrganizations } from '../pages/Inbox/useOrganizations.ts';
import { getOrganization } from './organizations.ts';
import { graphQLSDK } from './queries.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';
export type DialogsByView = { [key in InboxViewType]: InboxItemInput[] };
interface UseDialogsOutput {
  dialogs: InboxItemInput[];
  dialogCountInconclusive: boolean;
  dialogsByView: DialogsByView;
  isSuccess: boolean;
  isLoading: boolean;
}

export function mapDialogToToInboxItem(
  input: SearchDialogFieldsFragment[],
  parties: PartyFieldsFragment[],
  organizations: OrganizationFieldsFragment[],
): InboxItemInput[] {
  return input.map((item) => {
    const titleObj = item.content.title.value;
    const summaryObj = item.content.summary.value;
    const endUserParty = parties?.find((party) => party.isCurrentEndUser);
    const senderName = item.content.senderName?.value;

    const dialogReceiverParty = parties?.find((party) => party.party === item.party);
    const dialogReceiverSubParty = parties?.find((party) =>
      (party.subParties ?? []).some((subParty) => subParty.party === item.party),
    );

    const actualReceiverParty = dialogReceiverParty ?? dialogReceiverSubParty ?? endUserParty;
    const serviceOwner = getOrganization(organizations || [], item.org, 'nb');
    const isSeenByEndUser =
      item.seenSinceLastUpdate.find((seenLogEntry) => seenLogEntry.isCurrentEndUser) !== undefined;

    const { isSeenByYou, seenByOthersCount } = getSeenByLabel(item.seenSinceLastUpdate);

    const seenByLabel = `${t('word.seenBy')} ${isSeenByYou ? t('word.you') : ''} ${seenByOthersCount > 0 ? ' + ' + seenByOthersCount : ''}`;
    return {
      id: item.id,
      party: item.party,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      sender: {
        name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
        isCompany: true,
        imageURL: serviceOwner?.logo,
      },
      receiver: {
        name: actualReceiverParty?.name ?? dialogReceiverSubParty?.name ?? '',
        isCompany: actualReceiverParty?.partyType === 'Organization',
      },
      guiAttachmentCount: item.guiAttachmentCount ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: item.status ?? 'UnknownStatus',
      isSeenByEndUser,
      label: item.systemLabel,
      org: item.org,
      seenByLabel,
      seenByOthersCount,
      viewType: getViewType(item),
    };
  });
}

export interface SearchAutocompleteDialogInput {
  id: string;
  title: string;
  summary: string;
  isSeenByEndUser: boolean;
}

export function mapAutocompleteDialogsDtoToInboxItem(
  input: SearchAutocompleteDialogFieldsFragment[],
): SearchAutocompleteDialogInput[] {
  return input.map((item) => {
    const titleObj = item.content.title.value;
    const summaryObj = item.content.summary.value;
    const isSeenByEndUser =
      item.seenSinceLastUpdate.find((seenLogEntry) => seenLogEntry.isCurrentEndUser) !== undefined;
    return {
      id: item.id,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      isSeenByEndUser,
    };
  });
}

interface SeenByItem {
  isCurrentEndUser: boolean;
}

export const getSeenByLabel = (seenBy: SeenByItem[]): { isSeenByYou: boolean; seenByOthersCount: number } => {
  const isSeenByYou = seenBy?.some((item) => item.isCurrentEndUser === true);
  const seenByOthersCount = seenBy?.filter((item) => item.isCurrentEndUser === false).length;

  return { isSeenByYou, seenByOthersCount };
};

export const searchDialogs = (
  partyURIs: string[],
  search: string | undefined,
  org: string | undefined,
): Promise<GetAllDialogsForPartiesQuery> => {
  return graphQLSDK.getAllDialogsForParties({
    partyURIs,
    search: search?.length === 0 ? undefined : search,
    org: org?.length === 0 ? undefined : org,
  });
};

export const searchAutocompleteDialogs = (
  partyURIs: string[],
  search: string | undefined,
): Promise<GetSearchAutocompleteDialogsQuery> => {
  return graphQLSDK.getSearchAutocompleteDialogs({
    partyURIs,
    search,
  });
};

export const getDialogs = (partyURIs: string[]): Promise<GetAllDialogsForPartiesQuery> =>
  graphQLSDK.getAllDialogsForParties({
    partyURIs,
  });

export const flattenParties = (partiesToUse: PartyFieldsFragment[]) => {
  const partyURIs = partiesToUse.map((party) => party.party);
  const subPartyURIs = partiesToUse.flatMap((party) => (party.subParties ?? []).map((subParty) => subParty.party));
  return [...partyURIs, ...subPartyURIs] as string[];
};

export const isBinDialog = (dialog: SearchDialogFieldsFragment): boolean => dialog.systemLabel === SystemLabel.Bin;

export const isArchivedDialog = (dialog: SearchDialogFieldsFragment): boolean =>
  dialog.systemLabel === SystemLabel.Archive;

export const isInboxDialog = (dialog: SearchDialogFieldsFragment): boolean =>
  !isBinDialog(dialog) &&
  !isArchivedDialog(dialog) &&
  [DialogStatus.New, DialogStatus.InProgress, DialogStatus.RequiresAttention, DialogStatus.Completed].includes(
    dialog.status,
  );

export const isDraftDialog = (dialog: SearchDialogFieldsFragment): boolean =>
  !isBinDialog(dialog) && !isArchivedDialog(dialog) && dialog.status === DialogStatus.Draft;

export const isSentDialog = (dialog: SearchDialogFieldsFragment): boolean =>
  !isBinDialog(dialog) && !isArchivedDialog(dialog) && dialog.status === DialogStatus.Sent;

export const getViewType = (dialog: SearchDialogFieldsFragment): InboxViewType => {
  if (isDraftDialog(dialog)) {
    return 'drafts';
  }
  if (isArchivedDialog(dialog)) {
    return 'archive';
  }
  if (isSentDialog(dialog)) {
    return 'sent';
  }
  if (isBinDialog(dialog)) {
    return 'bin';
  }
  return 'inbox';
};

export const useDialogs = (parties: PartyFieldsFragment[]): UseDialogsOutput => {
  const { organizations } = useOrganizations();
  const { selectedParties } = useParties();
  const partiesToUse = parties ? parties : selectedParties;
  const mergedPartiesWithSubParties = flattenParties(partiesToUse);

  const { data, isSuccess, isLoading } = useQuery<GetAllDialogsForPartiesQuery>({
    queryKey: [QUERY_KEYS.DIALOGS, mergedPartiesWithSubParties, organizations],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () => getDialogs(mergedPartiesWithSubParties),
    enabled: mergedPartiesWithSubParties.length > 0,
  });

  const dialogs = mapDialogToToInboxItem(data?.searchDialogs?.items ?? [], selectedParties, organizations);

  return {
    isLoading,
    isSuccess,
    dialogs,
    dialogsByView: {
      inbox: dialogs.filter((dialog) => dialog.viewType === 'inbox'),
      drafts: dialogs.filter((dialog) => dialog.viewType === 'drafts'),
      sent: dialogs.filter((dialog) => dialog.viewType === 'sent'),
      archive: dialogs.filter((dialog) => dialog.viewType === 'archive'),
      bin: dialogs.filter((dialog) => dialog.viewType === 'bin'),
    },
    dialogCountInconclusive: data?.searchDialogs?.hasNextPage === true || data?.searchDialogs?.items === null,
  };
};

export const getMetaFields = (item: SearchDialogFieldsFragment, isSeenByEndUser: boolean) => {
  const nOtherSeen = item.seenSinceLastUpdate?.filter((seenLogEntry) => !seenLogEntry.isCurrentEndUser).length ?? 0;
  const metaFields: InboxItemMetaField[] = [];
  metaFields.push({
    type: `status_${item.status}` as InboxItemMetaFieldType,
    label: `${i18n.t('word.status')}: ${item.status}`,
  });

  metaFields.push({ type: 'timestamp', label: item.updatedAt });

  if (typeof item.guiAttachmentCount === 'number' && item.guiAttachmentCount > 0) {
    metaFields.push({
      type: 'attachment',
      label: item.guiAttachmentCount.toString(),
    });
  }

  if (isSeenByEndUser && nOtherSeen) {
    metaFields.push({
      type: 'seenBy',
      label: `${i18n.t('word.seenBy')} ${i18n.t('word.you')} ${i18n.t('word.and')} ${nOtherSeen} ${i18n.t('word.others')}`,
      options: {
        tooltip: item.seenSinceLastUpdate.map((seenLogEntry) => seenLogEntry.seenBy.actorName).join('\n'),
      },
    });
  } else if (nOtherSeen) {
    metaFields.push({
      type: 'seenBy',
      label: `${i18n.t('word.seenBy')} ${nOtherSeen} ${i18n.t('word.others')}`,
      options: {
        tooltip: item.seenSinceLastUpdate.map((seenLogEntry) => seenLogEntry.seenBy.actorName).join('\n'),
      },
    });
  } else if (isSeenByEndUser) {
    metaFields.push({
      type: 'seenBy',
      label: `${i18n.t('word.seenBy')} ${i18n.t('word.you')}`,
      options: {
        tooltip: item.seenSinceLastUpdate.map((seenLogEntry) => seenLogEntry.seenBy.actorName).join('\n'),
      },
    });
  }

  return metaFields;
};
