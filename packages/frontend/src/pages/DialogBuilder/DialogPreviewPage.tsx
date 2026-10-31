import { Alert, type Color, DialogLayout } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useSearchParams } from 'react-router';
import { mapDialogToInboxItem } from '../../api/hooks/useDialogById.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { useSelectedProfile } from '../../api/hooks/usePartiesSelectors.ts';
import { DialogDetails } from '../../components/DialogDetails/DialogDetails.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { usePageTitle } from '../../hooks/usePageTitle.ts';
import { useDateFnsLocale, useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useOrganizations } from '../Inbox/useOrganizations.ts';
import { DIALOG_BUILDER_ROUTE, DIALOG_PREVIEW_QUERY_PARAM } from './availability.ts';
import { makeActionsInert } from './makeActionsInert.ts';
import { decodePreview, type PreviewEnvelope } from './previewEnvelope.ts';
import { PREVIEW_DIALOG_TOKEN, toDialogFragment } from './toDialogFragment.ts';
import { ValidationIssueList } from './ValidationIssueList.tsx';

const noop = () => {};

interface PreviewLayoutProps {
  color?: Color;
  children: ReactNode;
}

const PreviewLayout = ({ color, children }: PreviewLayoutProps) => {
  const { t } = useTranslation();
  const { search } = useLocation();

  return (
    <DialogLayout
      color={color}
      backButton={{
        label: t('word.back'),
        as: (props: LinkProps) => <Link {...props} to={`${DIALOG_BUILDER_ROUTE}${search}`} />,
      }}
    >
      {children}
    </DialogLayout>
  );
};

const usePreviewDialog = ({ dialog, org, serviceResourceType }: PreviewEnvelope) => {
  const { parties, selectedParties, currentEndUser, isLoading: isLoadingParties } = useParties();
  const { organizations, isLoading: isLoadingOrganizations } = useOrganizations();
  const format = useFormat();
  const { locale } = useDateFnsLocale();
  const selectedProfile = useSelectedProfile();
  const party = (selectedParties.length === 1 ? selectedParties[0] : currentEndUser)?.party;
  const [now] = useState(() => new Date());

  const endUserName = currentEndUser?.name ?? '';

  const item = useMemo(
    () => (party ? toDialogFragment({ dialog, party, org, serviceResourceType, endUserName, now }) : undefined),
    [dialog, party, org, serviceResourceType, endUserName, now],
  );

  if (isLoadingParties || isLoadingOrganizations || !item) {
    return { isLoading: true };
  }

  const details = mapDialogToInboxItem({
    item,
    parties,
    organizations,
    format,
    stopReversingPersonNameOrder: true,
    selectedProfile,
    locale,
  });

  return { isLoading: false, dialog: details && makeActionsInert(details) };
};

const PreviewContent = ({ preview }: { preview: PreviewEnvelope }) => {
  const queryClient = useQueryClient();
  const { dialog, isLoading } = usePreviewDialog(preview);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isSeenByLogOpen, setIsSeenByLogOpen] = useState(false);
  const title = dialog?.title ?? '';

  usePageTitle({ baseTitle: title });

  useEffect(() => {
    queryClient.setQueryData([QUERY_KEYS.CURRENT_DIALOG_TITLE], title);
    return () => {
      queryClient.setQueryData([QUERY_KEYS.CURRENT_DIALOG_TITLE], '');
    };
  }, [queryClient, title]);

  return (
    <PreviewLayout color={dialog?.receiver?.type as Color}>
      <Alert
        variant="warning"
        heading="Forhåndsvisning"
        message="Dette er ikke en ekte dialog. Den finnes ikke i Dialogporten, og handlinger som sender data utføres ikke. Innhold fra eksterne URL-er (FCE) hentes ikke."
      />
      <DialogDetails
        dialogToken={PREVIEW_DIALOG_TOKEN}
        dialog={dialog}
        isLoading={isLoading}
        onMessageEvent={noop}
        activityModalProps={{ isOpen: isActivityLogOpen, setIsOpen: setIsActivityLogOpen }}
        seenByLogModalProps={{ isOpen: isSeenByLogOpen, setIsOpen: setIsSeenByLogOpen }}
        onAccessInfoClick={noop}
      />
    </PreviewLayout>
  );
};

export const DialogPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get(DIALOG_PREVIEW_QUERY_PARAM);
  const preview = useMemo(() => decodePreview(encoded), [encoded]);

  if (preview.status === 'valid') {
    return <PreviewContent preview={preview} />;
  }

  return (
    <PreviewLayout>
      {preview.status === 'missing' ? (
        <Alert
          variant="info"
          heading="Ingen dialog å vise"
          message="Lenken inneholder ingen dialog. Gå tilbake til dialogbyggeren for å lage en ny forhåndsvisning."
        />
      ) : (
        <Alert variant="danger" heading="Dialogen kan ikke vises">
          <ValidationIssueList issues={preview.errors} />
        </Alert>
      )}
    </PreviewLayout>
  );
};
