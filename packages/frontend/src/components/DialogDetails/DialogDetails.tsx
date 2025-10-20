import {
  type BadgeColor,
  type BadgeSize,
  type BadgeVariant,
  Button,
  type DialogActionButtonProps,
  DialogActions,
  DialogAttachments,
  DialogBody,
  type DialogButtonPriority,
  DialogHeader,
  Divider,
  DsAlert,
  DsParagraph,
  Heading,
  Timeline,
  TimelineSegment,
  TransmissionList,
  Typography,
} from '@altinn/altinn-components';
import type { ActivityLogSegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import { DialogStatus } from 'bff-types-generated';
import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics';
import { ANALYTICS_EVENTS } from '../../analyticsEvents';
import type { DialogByIdDetails } from '../../api/hooks/useDialogById.tsx';
import type { TimelineSegmentWithTransmissions } from '../../api/utils/transmissions.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { getDialogStatus } from '../../pages/Inbox/status.ts';
import { ActivityLogModal } from '../ActivityLog/activityLogModal.tsx';
import { AdditionalInfoContent } from '../AdditonalInfoContent';
import { MainContentReference } from '../MainContentReference';

interface DialogDetailsProps {
  dialog: DialogByIdDetails | undefined | null;
  activityModalProps: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
  };
  isAuthLevelTooLow?: boolean;
  isLoading?: boolean;
  subscriptionOpened?: boolean;
}

/**
 * Displays detailed information about an inbox item, including title, summary, sender, recipient, attachments, tags, and GUI actions.
 * This component is intended to be used for presenting a full view of an inbox item, with comprehensive details not shown in the summary view.
 * It supports rendering both text and React node summarys, and dynamically lists attachments with links.
 * Dynamically rendered action buttons are implemented through the `GuiActions` component.
 *
 * @component
 * @param {object} props - The properties passed to the component.
 * @param {DialogByIdDetails} props.dialog - The dialog details containing all the necessary information.
 * @returns {ReactElement} The InboxItemDetail component.
 *
 * @example
 * <InboxItemDetail
 *   dialog={{
 *     title: "Project Update",
 *     summary: "Here's the latest update on the project...",
 *     sender: { name: "Alice", icon: <PersonIcon /> },
 *     recipient: { name: "Bob", icon: <PersonIcon /> },
 *     attachment: [{ label: "Project Plan", href: "/path/to/document", mime: "application/pdf" }],
 *     tags: [{ label: "Important", icon: <FlagIcon />, className: "important" }],
 *     guiActions: [{ label: "Approve", onClick: () => alert('Approved') }]
 *   }}
 * />
 */

export interface DialogActionProps {
  id: string;
  title: string;
  url: string;
  httpMethod: string;
  prompt?: string;
  disabled?: boolean;
  priority: string;
  hidden?: boolean;
}

const handleDialogActionClick = async (
  props: DialogActionProps,
  dialogToken: string,
  responseFinished: () => void,
  logError: (error: Error, context?: Record<string, unknown>, errorMessage?: string) => void,
): Promise<void> => {
  const { id, title, url, httpMethod, prompt } = props;

  // Track the GUI action click event
  Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_CLICK, {
    'action.id': id,
    'action.title': title,
    'action.httpMethod': httpMethod,
    'action.hasPrompt': !!prompt,
    'action.url': url,
  });

  if (prompt && !window.confirm(prompt)) {
    Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_CANCELLED, {
      'action.id': id,
      'action.title': title,
      'cancellation.reason': 'user_declined_prompt',
    });
    responseFinished();
    return;
  }

  if (httpMethod === 'GET') {
    Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_SUCCESS, {
      'action.id': id,
      'action.title': title,
      'action.httpMethod': httpMethod,
      'action.type': 'external_link',
    });
    responseFinished();
    window.open(url, '_blank');
  } else {
    try {
      const response = await Analytics.trackFetchDependency(
        `DialogAction_${httpMethod}`,
        fetch(url, {
          method: httpMethod,
          headers: {
            Authorization: `Bearer ${dialogToken}`,
          },
        }),
      );

      if (!response.ok) {
        Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_FAILED, {
          'action.id': id,
          'action.title': title,
          'action.httpMethod': httpMethod,
          'error.status': response.status,
          'error.statusText': response.statusText,
        });
        console.error(`Error: ${response.statusText}`);
      } else {
        Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_SUCCESS, {
          'action.id': id,
          'action.title': title,
          'action.httpMethod': httpMethod,
          'action.type': 'api_call',
          'response.status': response.status,
        });
        logError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          {
            context: 'DialogDetails.handleDialogActionClick.response',
            url,
            httpMethod,
            status: response.status,
            statusText: response.statusText,
          },
          `Dialog action failed: ${response.statusText}`,
        );
      }
    } catch (error) {
      Analytics.trackEvent(ANALYTICS_EVENTS.GUI_ACTION_FAILED, {
        'action.id': id,
        'action.title': title,
        'action.httpMethod': httpMethod,
        'error.message': error instanceof Error ? error.message : 'Unknown error',
        'error.type': 'network_error',
      });
      console.error('Error performing action:', error);
      logError(
        error as Error,
        {
          context: 'DialogDetails.handleDialogActionClick.fetch',
          url,
          httpMethod,
        },
        'Error performing dialog action',
      );
    } finally {
      responseFinished();
    }
  }
};

export const DialogDetails = ({
  dialog,
  isLoading,
  isAuthLevelTooLow,
  activityModalProps,
  subscriptionOpened,
}: DialogDetailsProps): ReactElement => {
  const { t } = useTranslation();
  const { logError } = useErrorLogger();
  const [actionIdLoading, setActionIdLoading] = useState<string>('');
  const [showAllTransmissions, setShowAllTransmissions] = useState<boolean>(false);

  const format = useFormat();

  const transmissions: TimelineSegmentWithTransmissions[] = useMemo(() => {
    if (!dialog?.transmissions) {
      return [];
    }

    /* Add content reference to each item in the transmission - ensure they are not eagerly loaded, will only render on expand */
    return dialog.transmissions.map((transmission) => ({
      ...transmission,
      items: transmission.items?.map((item, index) => {
        return {
          ...item,
          children: dialog.contentReferenceForTransmissions[item.id as string] ? (
            <MainContentReference
              id={item.id ?? `${transmission.id}-${index}`}
              content={dialog.contentReferenceForTransmissions[item.id as string]}
              dialogToken={dialog.dialogToken}
            />
          ) : null,
        };
      }),
    }));
  }, [dialog]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need with format
  const activityHistoryItems: ActivityLogSegmentProps[] = useMemo(() => {
    if (!dialog?.activityHistory) {
      return [];
    }

    return dialog.activityHistory.map((dialogHistoryItem) => {
      return {
        id: dialogHistoryItem.id,
        datetime: dialogHistoryItem.date,
        items: dialogHistoryItem.items.map((item) => ({
          id: item.id,
          summary: dialogHistoryItem.type === 'activity' ? item.summary : '',
          datetime: item.datetime,
          byline: item.datetime ? format(item.datetime, 'do MMMM yyyy HH.mm') : '',
        })),
        children:
          dialogHistoryItem.type === 'transmission' ? (
            <TransmissionList
              items={dialogHistoryItem.items.map((item) => ({
                ...item,
                children: dialog.contentReferenceForTransmissions[item.id as string] ? (
                  <MainContentReference
                    id={item.id}
                    content={dialog.contentReferenceForTransmissions[item.id as string]}
                    dialogToken={dialog.dialogToken}
                  />
                ) : null,
              }))}
            />
          ) : null,
      };
    });
  }, [dialog]);

  if (isLoading) {
    return (
      <>
        <DialogHeader
          loading
          updatedAt={new Date().toISOString()}
          updatedAtLabel={format(new Date(), 'do MMMM yyyy HH.mm').toString()}
          dueAt={new Date().toISOString()}
          dueAtLabel={format(new Date(), 'do MMMM yyyy HH.mm').toString()}
          status={getDialogStatus(DialogStatus.NotApplicable, t)}
          title={'???'}
        />
        <DialogBody sender={{ name: 'XXX' }} recipient={{ name: 'YYY' }} loading />
      </>
    );
  }

  if (isAuthLevelTooLow) {
    return (
      <>
        <DsAlert data-color="danger">
          <Heading data-size="xs">{t('error.dialog.auth_level_too_low')}</Heading>
          <DsParagraph>
            <a href="/api/login?idporten_loa_high=true">{t('error.dialog.auth_level_too_low.link')}</a>
          </DsParagraph>
        </DsAlert>
      </>
    );
  }

  if (!dialog) {
    return (
      <Typography>
        <h1>{t('error.dialog.not_found')}</h1>
        <p>{t('dialog.error_message.general')}</p>
      </Typography>
    );
  }

  const clockPrefix = t('word.clock_prefix');
  const formatString = clockPrefix ? `do MMMM yyyy '${clockPrefix}' HH.mm` : `do MMMM yyyy HH.mm`;
  const dueAtLabel = dialog.dueAt ? t('dialog.due_at', { date: format(dialog.dueAt, formatString) }) : '';
  const numberOfTransmissionGroups = 3;

  const dialogActions: DialogActionButtonProps[] = dialog.guiActions.map((action) => ({
    id: action.id,
    label: action.title,
    disabled: !!isLoading || action.disabled,
    priority: action.priority.toLocaleLowerCase() as DialogButtonPriority,
    loading: actionIdLoading === action.id,
    hidden: action.hidden,
    onClick: () => {
      setActionIdLoading(action.id);
      void handleDialogActionClick(action, dialog.dialogToken, () => setActionIdLoading(''), logError);
    },
  }));

  const headerBadge =
    dialog.viewType === 'bin' || dialog.viewType === 'archive'
      ? {
          label: t(`status.${dialog.viewType}`),
          size: 'sm' as BadgeSize,
          variant: 'subtle' as BadgeVariant,
          color: 'neutral' as BadgeColor,
        }
      : undefined;

  return (
    <>
      <DialogHeader
        updatedAt={dialog.updatedAt}
        updatedAtLabel={format(dialog.updatedAt, formatString)}
        dueAt={dialog.dueAt}
        dueAtLabel={dueAtLabel}
        status={getDialogStatus(dialog.status, t)}
        badge={headerBadge}
        title={dialog.title}
        sentCount={dialog.sentCount}
        receivedCount={dialog.receivedCount}
        activityLog={{
          onClick: () => {
            activityModalProps.setIsOpen(true);
          },
          label: t('dialog.activity_log.title'),
        }}
        attachmentsCount={dialog.attachments?.length}
      />
      <DialogBody
        sender={dialog.sender}
        recipient={dialog.receiver}
        recipientLabel={t('word.to')}
        seenByLog={dialog.seenByLog}
      >
        <p>{dialog.summary}</p>
        {subscriptionOpened && (
          <MainContentReference
            sender={dialog.sender.name}
            content={dialog.mainContentReference}
            dialogToken={dialog.dialogToken}
            id={dialog.id}
          />
        )}
        {dialog.attachments.length > 0 && (
          <DialogAttachments
            title={t('inbox.heading.attachments', { count: dialog.attachments.length })}
            items={dialog.attachments}
          />
        )}
        <DialogActions items={dialogActions} id="gui-actions" />
      </DialogBody>
      {transmissions?.length > 0 && (
        <Timeline>
          {transmissions
            .slice(0, showAllTransmissions ? undefined : numberOfTransmissionGroups)
            .map(({ items, ...timelineSegmentProps }) => {
              return (
                <TimelineSegment key={timelineSegmentProps.id} {...timelineSegmentProps}>
                  {transmissions?.length > 0 && <TransmissionList items={items} />}
                </TimelineSegment>
              );
            })}
        </Timeline>
      )}
      {dialog.transmissions.length > numberOfTransmissionGroups && !showAllTransmissions && (
        <Button
          variant="outline"
          onClick={() => {
            Analytics.trackEvent(ANALYTICS_EVENTS.DIALOG_TRANSMISSIONS_EXPAND, {
              'dialog.id': dialog.id,
              'transmissions.totalCount': dialog.transmissions.length,
              'transmissions.visibleCount': numberOfTransmissionGroups,
            });
            setShowAllTransmissions(true);
          }}
        >
          {t('dialog.transmission.expandLabel')}
        </Button>
      )}
      {showAllTransmissions && (
        <Button
          variant="outline"
          onClick={() => {
            Analytics.trackEvent(ANALYTICS_EVENTS.DIALOG_TRANSMISSIONS_COLLAPSE, {
              'dialog.id': dialog.id,
              'transmissions.totalCount': dialog.transmissions.length,
              'transmissions.visibleCount': numberOfTransmissionGroups,
            });
            setShowAllTransmissions(false);
          }}
        >
          {t('dialog.transmission.collapseLabel')}
        </Button>
      )}
      {dialog.additionalInfo?.value && (
        <>
          <Divider />
          <AdditionalInfoContent mediaType={dialog.additionalInfo.mediaType} value={dialog.additionalInfo.value} />
        </>
      )}
      <ActivityLogModal
        title={dialog.title}
        items={activityHistoryItems}
        isOpen={activityModalProps.isOpen}
        setIsOpen={activityModalProps.setIsOpen}
      />
    </>
  );
};
