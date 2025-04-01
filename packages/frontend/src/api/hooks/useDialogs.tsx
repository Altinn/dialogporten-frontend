import { keepPreviousData, useQuery } from '@tanstack/react-query';

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
import { type TFunction, t } from 'i18next';
import { useLocation } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { graphQLSDK } from '../queries.ts';
import { getOrganization } from '../utils/organizations.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';
export type DialogsByView = { [key in InboxViewType]: InboxItemInput[] };
interface UseDialogsOutput {
  dialogs: InboxItemInput[];
  dialogCountInconclusive: boolean;
  dialogsByView: DialogsByView;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
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
    const { isSeenByEndUser, seenByOthersCount, seenByLabel } = getSeenByLabel(item.seenSinceLastUpdate, t);
    return {
      id: item.id,
      party: item.party,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      sender: {
        name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
        type: 'company',
        imageUrl: serviceOwner?.logo,
        imageUrlAlt: t('dialog.imageAltURL', { companyName: getPreferredPropertyByLocale(senderName)?.value }),
      },
      receiver: {
        name: actualReceiverParty?.name ?? dialogReceiverSubParty?.name ?? '',
        type: 'person',
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

export const getSeenByLabel = (
  seenBy: SeenByItem[],
  t: TFunction<'translation', undefined>,
): { isSeenByEndUser: boolean; seenByOthersCount: number; seenByLabel: string | undefined } => {
  const isSeenByEndUser = seenBy?.some((item) => item.isCurrentEndUser);
  const seenByOthersCount = seenBy?.filter((item) => !item.isCurrentEndUser).length;
  let seenByLabel: string | undefined = undefined;
  if (isSeenByEndUser) {
    seenByLabel = `${t('word.seenBy')} ${t('word.you')}`;
  }
  if (seenByOthersCount > 0) {
    seenByLabel = (seenByLabel ?? t('word.seenBy')) + (isSeenByEndUser ? ` + ` : ' ') + seenByOthersCount;
  }

  return { isSeenByEndUser, seenByOthersCount, seenByLabel };
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

export const getPartyIds = (partiesToUse: PartyFieldsFragment[]) => {
  const partyURIs = partiesToUse.filter((party) => !party.hasOnlyAccessToSubParties).map((party) => party.party);
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
  if (isInboxDialog(dialog)) {
    return 'inbox';
  }
  console.warn('Unknown dialog status, fallback=inbox', dialog.status);
  return 'inbox';
};

export const useDialogs = (parties: PartyFieldsFragment[]): UseDialogsOutput => {
  const { organizations } = useOrganizations();
  const { selectedParties } = useParties();
  const partiesToUse = parties ? parties : selectedParties;
  const mergedPartiesWithSubParties = getPartyIds(partiesToUse);
  const location = useLocation();

  const { data, isSuccess, isLoading, isError } = useQuery<GetAllDialogsForPartiesQuery>({
    queryKey: [QUERY_KEYS.DIALOGS, mergedPartiesWithSubParties, location.pathname],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () => getDialogs(mergedPartiesWithSubParties),
    enabled: mergedPartiesWithSubParties.length > 0,
    gcTime: 0,
    placeholderData: keepPreviousData,
  });

  const dialogs = mapDialogToToInboxItem(data?.searchDialogs?.items ?? [], parties, organizations);

  return {
    isLoading,
    isSuccess,
    isError,
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
