import { formatDisplayName } from '@altinn/altinn-components';
import {
  DialogStatus,
  type GetAllDialogsForPartiesQueryVariables,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { type TFunction, t } from 'i18next';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import type { InboxViewType } from '../hooks/useDialogs.tsx';
import { getOrganization } from './organizations.ts';
import { getViewTypes } from './viewType.ts';

interface SeenByItem {
  isCurrentEndUser: boolean;
}

export const getPartyIds = (partiesToUse: PartyFieldsFragment[]) => {
  const partyURIs = partiesToUse.filter((party) => !party.hasOnlyAccessToSubParties).map((party) => party.party);
  const subPartyURIs = partiesToUse.flatMap((party) => (party.subParties ?? []).map((subParty) => subParty.party));
  return [...partyURIs, ...subPartyURIs] as string[];
};

export const getSeenAtLabel = (seenAt: string, format: FormatFunction): string => {
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  return format(new Date(seenAt), formatString);
};

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

export function mapDialogToToInboxItems(
  input: SearchDialogFieldsFragment[],
  parties: PartyFieldsFragment[],
  organizations: OrganizationFieldsFragment[],
  format: FormatFunction,
): InboxItemInput[] {
  return input.map((item) => {
    const titleObj = item.content.title.value;
    const summaryObj = item.content.summary?.value;
    const endUserParty = parties?.find((party) => party.isCurrentEndUser);
    const senderName = item.content.senderName?.value;

    const dialogReceiverParty = parties?.find((party) => party.party === item.party);
    const dialogReceiverSubParty = parties?.find((party) =>
      (party.subParties ?? []).some((subParty) => subParty.party === item.party),
    );

    const actualReceiverParty = dialogReceiverParty ?? dialogReceiverSubParty ?? endUserParty;
    const serviceOwner = getOrganization(organizations || [], item.org);
    const { isSeenByEndUser, seenByOthersCount, seenByLabel } = getSeenByLabel(item.seenSinceLastContentUpdate, t);

    return {
      id: item.id,
      party: item.party,
      hasUnopenedContent: item.hasUnopenedContent,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      dueAt: item.dueAt,
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      sender: {
        name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
        type: 'company',
        imageUrl: serviceOwner?.logo,
        imageUrlAlt: t('dialog.imageAltURL', { companyName: getPreferredPropertyByLocale(senderName)?.value }),
      },
      recipient: {
        name: actualReceiverParty?.name ?? dialogReceiverSubParty?.name ?? '',
        type: 'person',
      },
      contentUpdatedAt: item.contentUpdatedAt,
      guiAttachmentCount: item.guiAttachmentCount ?? 0,
      createdAt: item.createdAt,
      status: item.status ?? 'UnknownStatus',
      isSeenByEndUser,
      label: item.endUserContext?.systemLabels,
      org: item.org,
      seenByLabel,
      seenByOthersCount,
      seenSinceLastContentUpdate: item.seenSinceLastContentUpdate,
      seenByLog: {
        collapsible: true,
        endUserLabel: t('word.you'),
        items: item.seenSinceLastContentUpdate.map((seenBy) => {
          const actorName = formatDisplayName({
            fullName: seenBy?.seenBy?.actorName ?? '',
            type: 'person',
            reverseNameOrder: true,
          });
          return {
            id: seenBy.id,
            name: actorName,
            seenAt: seenBy.seenAt,
            seenAtLabel: getSeenAtLabel(seenBy.seenAt, format),
            isEndUser: seenBy.isCurrentEndUser,
          };
        }),
      },
      viewType: getViewTypes({ status: item.status, systemLabel: item.endUserContext?.systemLabels }, true)?.[0],
      fromServiceOwnerTransmissionsCount: item.fromServiceOwnerTransmissionsCount ?? 0,
      fromPartyTransmissionsCount: item.fromPartyTransmissionsCount ?? 0,
      serviceResource: item.serviceResource,
    };
  });
}

interface QueryVariablesInput {
  viewType?: InboxViewType;
  variables?: Partial<GetAllDialogsForPartiesQueryVariables>;
  continuationToken?: string;
}

const viewTypeQueryMap: Record<InboxViewType, Record<string, string[] | string | number>> = {
  inbox: {
    status: [
      DialogStatus.NotApplicable,
      DialogStatus.InProgress,
      DialogStatus.RequiresAttention,
      DialogStatus.Completed,
    ],
    label: SystemLabel.Default,
  },
  drafts: {
    status: [DialogStatus.Draft],
    label: SystemLabel.Default,
  },
  sent: {
    label: [SystemLabel.Sent],
  },
  archive: {
    label: SystemLabel.Archive,
  },
  bin: {
    label: SystemLabel.Bin,
  },
};

export const getQueryVariables = ({
  viewType,
  continuationToken,
  variables,
}: QueryVariablesInput): Partial<GetAllDialogsForPartiesQueryVariables> => {
  const viewTypeQueries = viewType ? viewTypeQueryMap[viewType] || {} : {};
  return {
    ...viewTypeQueries,
    continuationToken,
    ...variables,
  };
};
