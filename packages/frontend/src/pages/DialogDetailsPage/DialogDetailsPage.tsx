import {
  type Color,
  type ContextMenuProps,
  DialogLayout,
  type MenuItemProps,
  type PageMenuProps,
} from '@altinn/altinn-components';
import { ArrowRedoIcon, ClockDashedIcon, InformationSquareIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useParams } from 'react-router-dom';
import { useDialogById } from '../../api/hooks/useDialogById.tsx';
import { useDialogByIdSubscription } from '../../api/hooks/useDialogByIdSubscription.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { DialogAccessInfoModal } from '../../components/DialogAccessInfoModal/DialogAccessInfoModal.tsx';
import { DialogDetails } from '../../components/DialogDetails/DialogDetails.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PartyGroups } from '../Inbox/queryParams.ts';
import { useDelegation } from './useDelegation.tsx';
import { useDialogActions } from './useDialogActions.tsx';

export const DialogDetailsPage = () => {
  const { id: dialogId } = useParams();
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const [isAccessInfoOpen, setIsAccessInfoOpen] = useState<boolean>(false);
  const { parties, selectedProfile, selectedParties, currentEndUser, selectedGroup, selectGroupWithoutPersisting } =
    useParties();
  const { t } = useTranslation();
  const location = useLocation();
  const qc = useQueryClient();
  const {
    dialog,
    isLoading: isLoadingDialog,
    isSuccess,
    isError,
    isAuthLevelTooLow,
    dataUpdatedAt,
    refreshDialogToken,
  } = useDialogById(parties, dialogId);
  const isLoading = isLoadingDialog || (!isSuccess && !isError);
  const displayDialogActions = !!(dialogId && dialog && !isLoading);
  const { delegationHref } = useDelegation(dialogId, dialog?.party, dialog?.org);

  usePageTitle({ baseTitle: dialog?.title || '' });
  const createLabelUpdateActions = useDialogActions();
  const delegationLink = delegationHref
    ? ([
        {
          id: 'delegation-link',
          groupId: 'delegation',
          title: t('altinn.delegate_access'),
          as: 'a',
          icon: ArrowRedoIcon,
          href: delegationHref,
        },
      ] as MenuItemProps[])
    : [];
  const contextMenu: ContextMenuProps = {
    id: 'dialog-context-menu',
    placement: 'right',
    color: dialog?.receiver.type === 'person' ? 'person' : 'company',
    'aria-label': t('dialog.context_menu.label', { title: dialog?.title }),
    items: [
      ...delegationLink,
      ...(dialogId && dialog ? createLabelUpdateActions(dialogId, dialog?.label ?? [], dialog?.unread) : []),
      {
        id: 'activity-log',
        groupId: 'logs',
        title: t('dialog.activity_log.title'),
        as: 'button',
        icon: ClockDashedIcon,
        onClick: () => setIsActivityLogOpen(true),
      },
      {
        id: 'access-info',
        groupId: 'logs',
        title: t('dialog.access_info.menu_item'),
        as: 'button',
        icon: InformationSquareIcon,
        onClick: () => setIsAccessInfoOpen(true),
      },
    ],
  };

  const mountAtRef = useRef<number>(Date.now());

  useEffect(() => {
    mountAtRef.current = Date.now();
  }, []);

  // We intentionally clear all cached main content reference queries for this dialog when leaving `/inbox/:dialogId`.
  // Reason: the expandable content is fetched lazily and keyed by (dialogId, itemId). If we keep it across navigations,
  // it can survive for `gcTime` and be reused on re-entry. For FCE we want each dialog visit to start clean and refetch
  // while still avoiding re-fetches during expand/collapse within the same visit for transmissions.
  useEffect(() => {
    return () => {
      if (!dialogId) return;
      qc.removeQueries({
        queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, dialogId, dialogId],
        exact: false,
      });
      qc.setQueryData([QUERY_KEYS.CURRENT_DIALOG_TITLE], '');
    };
  }, [qc, dialogId]);

  // Corrects a mismatched profile color when landing on a dialog via external navigation (no
  // `fromView`, e.g. a receipt link or cold URL) — e.g. "yourself" selected but the dialog belongs
  // to a company. Never fires on internal inbox -> dialog navigation, since the dialog is already
  // visible in the inbox the user came from.
  const correctedDialogIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (location.state?.fromView) return;
    if (!dialog) return;
    if (selectedGroup) return;
    if (correctedDialogIdRef.current === dialog.id) return;

    const isActingAsSelf =
      selectedProfile === 'person' &&
      selectedParties.length === 1 &&
      selectedParties[0]?.party === currentEndUser?.party;
    const isActingAsSingleCompany = selectedProfile === 'company' && selectedParties.length === 1;

    let applied = false;
    if (isActingAsSelf && dialog.receiver.type === 'company') {
      applied = selectGroupWithoutPersisting(PartyGroups.ALL_COMPANIES);
    } else if (isActingAsSingleCompany && dialog.receiver.type === 'person') {
      applied = selectGroupWithoutPersisting(PartyGroups.ALL_PERSONS);
    }

    if (applied) correctedDialogIdRef.current = dialog.id;
  }, [
    dialog,
    location.state,
    selectedGroup,
    selectedProfile,
    selectedParties,
    currentEndUser,
    selectGroupWithoutPersisting,
  ]);

  const dialogTokenIsFreshAfterMount = dataUpdatedAt > mountAtRef.current ? dialog?.dialogToken : undefined;
  const { onMessageEvent } = useDialogByIdSubscription(dialog?.id, dialogTokenIsFreshAfterMount, refreshDialogToken);
  const previousPath = (location?.state?.fromView ?? '/') + location.search;
  const labelActions = dialogId && dialog ? createLabelUpdateActions(dialogId, dialog.label, dialog.unread) : [];

  return (
    <DialogLayout
      color={dialog?.receiver?.type as Color}
      backButton={{
        label: t('word.back'),
        as: (props: LinkProps) => <Link {...props} to={previousPath} state={{ scrollToId: dialogId }} />,
      }}
      pageMenu={
        { items: displayDialogActions ? [...delegationLink, ...labelActions] : delegationLink } as PageMenuProps
      }
      contextMenu={displayDialogActions ? contextMenu : undefined}
    >
      <DialogDetails
        dialogToken={dialogTokenIsFreshAfterMount}
        dialog={dialog}
        isLoading={isLoading}
        onMessageEvent={onMessageEvent}
        isAuthLevelTooLow={isAuthLevelTooLow}
        activityModalProps={{
          isOpen: isActivityLogOpen,
          setIsOpen: setIsActivityLogOpen,
        }}
      />
      <DialogAccessInfoModal
        dialogId={dialogId}
        title={dialog?.title}
        isOpen={isAccessInfoOpen}
        onClose={() => setIsAccessInfoOpen(false)}
      />
    </DialogLayout>
  );
};
