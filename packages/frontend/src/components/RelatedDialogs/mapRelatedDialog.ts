import type { DialogListItemProps } from '@altinn/altinn-components';
import type { TFunction } from 'i18next';
import type { ElementType } from 'react';
import type { RelatedDialog } from '../../api/hooks/useDialogRelations.ts';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getDueAtProps } from '../../pages/Inbox/dueAt.ts';
import { getDialogStatus } from '../../pages/Inbox/status.ts';
import { getDialogSenderAndRecipient } from '../../utils/dialog.ts';
import type { OrganizationLookup } from '../../utils/organizations.ts';
import type { PartyGraph } from '../../utils/partyGraph.ts';

export const getRelatedDialogTitle = (dialog: RelatedDialog): string =>
  getPreferredPropertyByLocale(dialog.content.title.value)?.value ?? '';

/**
 * Maps a related dialog to a list item linking to the dialog, using the same sender, recipient and status mapping as
 * the inbox. The link target comes from useRelatedDialogLinkTarget, so it switches to the dialog's own party.
 */
export const mapRelatedDialogToListItem = ({
  dialog,
  partyGraph,
  organizations,
  format,
  t,
  link,
  as,
}: {
  dialog: RelatedDialog;
  partyGraph: PartyGraph;
  organizations: OrganizationLookup;
  format: FormatFunction;
  t: TFunction<'translation', undefined>;
  link: { href: string; onClick?: () => void };
  as: ElementType;
}): DialogListItemProps => {
  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  const title = getRelatedDialogTitle(dialog);
  const { sender, recipient } = getDialogSenderAndRecipient({
    party: dialog.party,
    org: dialog.org,
    senderName: dialog.content.senderName?.value,
    partyGraph,
    organizations,
  });

  return {
    id: dialog.id,
    title,
    summary: getPreferredPropertyByLocale(dialog.content.summary?.value)?.value ?? '',
    sender,
    recipient,
    recipientLabel: t('word.to'),
    color: recipient.type === 'company' ? 'company' : 'person',
    grouped: true,
    status: getDialogStatus(dialog.status, t),
    extendedStatusLabel: getPreferredPropertyByLocale(dialog.content.extendedStatus?.value)?.value || undefined,
    updatedAt: dialog.contentUpdatedAt,
    updatedAtLabel: format(dialog.contentUpdatedAt, formatString),
    dueAt: getDueAtProps(dialog.dueAt, dialog.status, t, (date) => format(date, formatString)),
    tooltips: { updatedAt: t('dialog.tooltip.updated_at') },
    ariaLabel: title,
    href: link.href,
    onClick: link.onClick,
    as,
  };
};
