import type { PartyFieldsFragment, SearchDialogFieldsFragment } from 'bff-types-generated';
import { type TFunction, t } from 'i18next';
import { getActorProps } from '../api/hooks/useDialogById.tsx';
import { type LocalizationObject, getPreferredPropertyByLocale } from '../i18n/property.ts';
import type { FormatFunction } from '../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from '../pages/Inbox/InboxItemInput.ts';
import {
  type OrganizationLookup,
  type OrganizationOutput,
  getOrganization,
  getOrganizationByLocale,
} from './organizations.ts';
import type { PartyGraph } from './partyGraph.ts';
import { getViewTypes } from './viewType.ts';

interface SeenByItem {
  isCurrentEndUser: boolean;
}

export const getPartyIds = (partiesToUse: PartyFieldsFragment[], includeOnlySubPartiesWithSameName?: boolean) => {
  const partyURIs = partiesToUse.filter((party) => !party.hasOnlyAccessToSubParties).map((party) => party.party);
  const subPartyURIs = partiesToUse.flatMap(
    (party) =>
      party.subParties
        ?.filter((subParty) => (includeOnlySubPartiesWithSameName ? subParty.name === party.name : true))
        .map((subParty) => subParty.party) ?? [],
  );

  return Array.from(new Set([...partyURIs, ...subPartyURIs]));
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

export function mapDialogToInboxItems(
  input: SearchDialogFieldsFragment[],
  partyGraph: PartyGraph,
  organizations: OrganizationLookup,
  format: FormatFunction,
  stopReversingPersonNameOrder: boolean,
): InboxItemInput[] {
  const endUserParty = partyGraph.currentEndUser;

  return input.map((item) => {
    const titleObj = item.content.title.value;
    const summaryObj = item.content.summary?.value;
    const senderName = item.content.senderName?.value;
    const extendedStatusObj = item.content.extendedStatus?.value;

    const receiverParty = partyGraph.partyByUrn.get(item.party);
    const isSubParty = partyGraph.parentByChildUrn.has(item.party);
    const actualReceiverParty = receiverParty ?? endUserParty;

    const serviceOwner = getOrganization(organizations, item.org);
    const serviceOwnerNbName = getOrganizationByLocale(organizations, item.org, 'nb')?.name;
    const { isSeenByEndUser, seenByOthersCount, seenByLabel } = getSeenByLabel(item.seenSinceLastContentUpdate, t);
    const viewTypes = getViewTypes({ status: item.status, systemLabel: item.endUserContext?.systemLabels });

    return {
      id: item.id,
      party: item.party,
      isContentSeen: item.isContentSeen,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      dueAt: item.dueAt,
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      sender: {
        name: getPreferredPropertyByLocale(senderName)?.value || serviceOwner?.name || '',
        // At dialog level there is no actorType/actorId to determine the sender type.
        // senderName can refer to a person (e.g. an employee name on a sick leave notice),
        // but we default to 'company' as a pragmatic choice since the sender is always an org.
        type: 'company',
        imageUrl: getServiceOwnerLogo(senderName, serviceOwner, serviceOwnerNbName),
        imageUrlAlt: t('dialog.imageAltURL', { companyName: getPreferredPropertyByLocale(senderName)?.value }),
      },
      recipient: {
        name: actualReceiverParty?.name ?? '',
        type: actualReceiverParty?.partyType === 'Organization' ? 'company' : 'person',
        variant: receiverParty && isSubParty && actualReceiverParty?.partyType === 'Organization' ? 'outline' : 'solid',
      },
      serviceResourceType: item.serviceResourceType,
      color: actualReceiverParty?.partyType === 'Organization' ? 'company' : 'person',
      contentUpdatedAt: item.contentUpdatedAt,
      guiAttachmentCount: item.guiAttachmentCount ?? 0,
      createdAt: item.createdAt,
      unreadItems: item.hasUnopenedContent,
      status: item.status ?? 'UnknownStatus',
      extendedStatus: getPreferredPropertyByLocale(extendedStatusObj)?.value || undefined,
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
          const { name, type } = getActorProps(
            seenBy.seenBy,
            stopReversingPersonNameOrder,
            serviceOwner,
            senderName,
            serviceOwnerNbName,
          );
          return {
            id: seenBy.id,
            name,
            seenAt: seenBy.seenAt,
            type,
            seenAtLabel: getSeenAtLabel(seenBy.seenAt, format),
            isEndUser: seenBy.isCurrentEndUser,
          };
        }),
      },
      viewType: viewTypes?.[0],
      viewTypes: viewTypes,
      fromServiceOwnerTransmissionsCount: item.fromServiceOwnerTransmissionsCount ?? 0,
      fromPartyTransmissionsCount: item.fromPartyTransmissionsCount ?? 0,
      serviceResource: item.serviceResource,
      unread: !item.isContentSeen,
    };
  });
}

export const mergeDialogItems = (
  existingItems: SearchDialogFieldsFragment[] = [],
  newItems: SearchDialogFieldsFragment[] = [],
): SearchDialogFieldsFragment[] => {
  const byId = new Map<string, SearchDialogFieldsFragment>();

  for (const item of existingItems) {
    if (item?.id) {
      byId.set(item.id, item);
    }
  }

  for (const item of newItems) {
    if (item?.id) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values());
};

export const getServiceOwnerLogo = (
  senderName: LocalizationObject[] | undefined,
  serviceOwner: OrganizationOutput | undefined,
  serviceOwnerNbName?: string,
): string | undefined => {
  const actualSender = getPreferredPropertyByLocale(senderName, 'nb')?.value?.trim().toLowerCase();
  const owner = (serviceOwnerNbName ?? serviceOwner?.name)?.trim().toLowerCase();

  if (senderName && actualSender !== owner) {
    return undefined;
  }
  return serviceOwner?.logo || '';
};
