import {
  Article,
  type DialogActionButtonProps,
  DialogActions,
  DialogAttachments,
  DialogBody,
  type DialogButtonPriority,
  DialogHeader,
  DialogHistory,
  DialogTabs,
} from '@altinn/altinn-components';
import type { DialogHistorySegmentProps } from '@altinn/altinn-components/dist/types/lib/components';
import { DialogStatus } from 'bff-types-generated';
import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DialogByIdDetails } from '../../api/hooks/useDialogById.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { getDialogStatus } from '../../pages/Inbox/status.ts';
import { AdditionalInfoContent } from '../AdditonalInfoContent';
import { MainContentReference } from '../MainContentReference';
import styles from './dialogDetails.module.css';

interface DialogDetailsProps {
  dialog: DialogByIdDetails | undefined | null;
  isLoading?: boolean;
}

type ActivePageTab = 'additional_info' | 'activities' | 'transmissions';

interface PageTab {
  id: ActivePageTab;
  title: string;
  onClick: () => void;
}

/**
 * Displays detailed information about an inbox item, including title, summary, sender, receiver, attachments, tags, and GUI actions.
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
 *     receiver: { name: "Bob", icon: <PersonIcon /> },
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
): Promise<void> => {
  const { url, httpMethod, prompt } = props;

  if (prompt && !window.confirm(prompt)) {
    responseFinished();
    return;
  }

  if (httpMethod === 'GET') {
    responseFinished();
    window.open(url, '_blank');
  } else {
    try {
      const response = await fetch(url, {
        method: httpMethod,
        headers: {
          Authorization: `Bearer ${dialogToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      responseFinished();
    }
  }
};

export const DialogDetails = ({ dialog, isLoading }: DialogDetailsProps): ReactElement => {
  const { t } = useTranslation();
  const [actionIdLoading, setActionIdLoading] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActivePageTab | undefined>();
  const format = useFormat();

  // biome-ignore lint/correctness/useExhaustiveDependencies: full control
  const dialogTabs = useMemo(() => {
    if (!dialog) {
      return [];
    }
    const tabs: PageTab[] = [];
    if (dialog.transmissions.length > 0) {
      tabs.push({
        id: 'transmissions',
        title: t('dialog.tabs.transmissions'),
        onClick: () => setActiveTab('transmissions'),
      });
    }
    if (dialog.additionalInfo?.value) {
      tabs.push({
        id: 'additional_info',
        title: t('dialog.tabs.additional_info'),
        onClick: () => setActiveTab('additional_info'),
      });
    }
    if (dialog.activityHistory.length > 0) {
      tabs.push({
        id: 'activities',
        title: t('dialog.tabs.activities'),
        onClick: () => setActiveTab('activities'),
      });
    }
    if (tabs.length > 0 && (activeTab === undefined || !tabs.map((tab) => tab.id).includes(activeTab))) {
      setActiveTab(tabs[0].id);
    }
    return tabs;
  }, [dialog, activeTab]);

  const transmissions = useMemo(() => {
    if (!dialog?.transmissions) {
      return [];
    }
    /* Add content reference to each item in the transmission - ensure they are not eagerly loaded, will only render on expand */
    return dialog.transmissions.map((transmission: DialogHistorySegmentProps) => ({
      ...transmission,
      items: transmission.items.map((item) => ({
        ...item,
        children: dialog.contentReferenceForTransmissions[item.id] ? (
          <MainContentReference
            id={item.id}
            content={dialog.contentReferenceForTransmissions[item.id]}
            dialogToken={dialog.dialogToken}
          />
        ) : null,
        items: item.items?.map((subItem) => ({
          ...subItem,
          children: dialog.contentReferenceForTransmissions[subItem.id] ? (
            <MainContentReference
              id={subItem.id}
              content={dialog.contentReferenceForTransmissions[subItem.id]}
              dialogToken={dialog.dialogToken}
            />
          ) : null,
        })),
      })),
    }));
  }, [dialog]);

  const activityHistoryItems = useMemo(() => {
    if (!dialog?.activityHistory) {
      return [];
    }
    return dialog.activityHistory.map((dialogHistoryItem: DialogHistorySegmentProps) => {
      if (dialogHistoryItem.items[0]?.variant === 'transmission') {
        return {
          ...dialogHistoryItem,
          items: dialogHistoryItem.items.map((item) => ({
            ...item,
            children: dialog.contentReferenceForTransmissions[item.id] ? (
              <MainContentReference
                id={item.id}
                content={dialog.contentReferenceForTransmissions[item.id]}
                dialogToken={dialog.dialogToken}
              />
            ) : null,
          })),
        };
      }
      return dialogHistoryItem;
    });
  }, [dialog]);

  if (isLoading) {
    return (
      <Article padding={6} spacing={6}>
        <DialogHeader
          loading
          dueAt={new Date().toISOString()}
          dueAtLabel={format(new Date(), 'do MMMM yyyy HH.mm').toString()}
          status={getDialogStatus(DialogStatus.New, t)}
          title={'???'}
        />
        <DialogBody
          sender={{ name: 'XXX' }}
          recipient={{ name: 'YYY' }}
          updatedAt={new Date().toISOString()}
          updatedAtLabel={format(new Date(), 'do MMMM yyyy HH.mm').toString()}
          loading
        />
      </Article>
    );
  }

  if (!dialog) {
    return (
      <Article padding={6} spacing={6}>
        <header className={styles.header} data-id="dialog-header">
          <h1 className={styles.title}>{t('error.dialog.not_found')}</h1>
        </header>
        <p className={styles.summary}>{t('dialog.error_message')}</p>
      </Article>
    );
  }

  const clockPrefix = t('word.clock_prefix');
  const formatString = clockPrefix ? `do MMMM yyyy '${clockPrefix}' HH.mm` : `do MMMM yyyy HH.mm`;
  const dueAtLabel = dialog.dueAt ? format(dialog.dueAt, formatString) : '';

  const dialogActions: DialogActionButtonProps[] = dialog.guiActions.map((action) => ({
    id: action.id,
    label: action.title,
    disabled: !!isLoading || action.disabled,
    priority: action.priority.toLocaleLowerCase() as DialogButtonPriority,
    url: action.url,
    httpMethod: action.httpMethod,
    loading: actionIdLoading === action.id,
    loadingText: t('word.loading'),
    hidden: action.hidden,
    onClick: () => {
      setActionIdLoading(action.id);
      void handleDialogActionClick(action, dialog.dialogToken, () => setActionIdLoading(''));
    },
  }));

  return (
    <Article padding={6} spacing={6}>
      <DialogHeader
        dueAt={dialog.dueAt}
        dueAtLabel={dueAtLabel}
        status={getDialogStatus(dialog.status, t)}
        title={dialog.title}
      />
      <DialogBody
        sender={dialog.sender}
        recipient={dialog.receiver}
        updatedAt={dialog.updatedAt}
        updatedAtLabel={format(dialog.updatedAt, formatString)}
        recipientLabel={t('word.to')}
        seenByLog={dialog.seenByLog}
      >
        <p>{dialog.summary}</p>
        <MainContentReference content={dialog.mainContentReference} dialogToken={dialog.dialogToken} id={dialog.id} />
        {dialog.attachments.length > 0 && (
          <DialogAttachments
            title={t('inbox.heading.attachments', { count: dialog.attachments.length })}
            items={dialog.attachments}
          />
        )}
        <DialogActions items={dialogActions} />
      </DialogBody>
      <DialogTabs
        items={dialogTabs.map((item) => ({
          ...item,
          selected: item.id === activeTab,
        }))}
      />
      {activeTab === 'transmissions' && <DialogHistory items={transmissions} collapsible />}
      {activeTab === 'additional_info' && (
        <AdditionalInfoContent mediaType={dialog.additionalInfo?.mediaType} value={dialog.additionalInfo?.value} />
      )}
      {activeTab === 'activities' && <DialogHistory items={activityHistoryItems} />}
    </Article>
  );
};
