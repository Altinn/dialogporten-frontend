import {
  Article,
  type AttachmentLinkProps,
  type DialogActionButtonProps,
  DialogActions,
  DialogAttachments,
  DialogBody,
  type DialogButtonPriority,
  DialogHeader,
} from '@altinn/altinn-components';
import { DialogStatus } from 'bff-types-generated';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DialogActivity, DialogByIdDetails, DialogTransmission } from '../../api/useDialogById.tsx';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { getDialogStatus } from '../../pages/Inbox/status.ts';
import { Activity } from '../Activity';
import { AdditionalInfoContent } from '../AdditonalInfoContent';
import { MainContentReference } from '../MainContentReference';
import { Transmission } from '../Transmission';
import styles from './dialogDetails.module.css';

interface DialogDetailsProps {
  dialog: DialogByIdDetails | undefined | null;
  isLoading?: boolean;
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
  const format = useFormat();

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

  const attachmentCount = dialog.attachments.reduce((count, { urls }) => count + urls.length, 0);
  const attachmentItems: AttachmentLinkProps[] = dialog.attachments.flatMap((attachment) =>
    attachment.urls.map((url) => ({
      label: getPreferredPropertyByLocale(attachment.displayName)?.value || url.url,
      href: url.url,
    })),
  );
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
        seenBy={
          dialog.seenByLabel
            ? {
                seenByEndUser: dialog.isSeenByEndUser,
                seenByOthersCount: dialog.seenByOthersCount,
                label: dialog.seenByLabel,
              }
            : undefined
        }
      >
        <p>{dialog.summary}</p>
        <MainContentReference content={dialog.mainContentReference} dialogToken={dialog.dialogToken} />
        {attachmentCount > 0 && (
          <DialogAttachments
            title={t('inbox.heading.attachments', { count: attachmentCount })}
            items={attachmentItems}
          />
        )}
        <DialogActions items={dialogActions} />
      </DialogBody>
      <AdditionalInfoContent mediaType={dialog.additionalInfo?.mediaType} value={dialog.additionalInfo?.value} />
      {dialog.activities.length > 0 && (
        <section data-id="dialog-activity-history" className={styles.activities}>
          <h3 className={styles.activitiesTitle}>{t('word.activities')}</h3>
          {dialog.activities.map((activity: DialogActivity) => (
            <Activity key={activity.id} activity={activity} />
          ))}
        </section>
      )}
      {dialog.transmissions.length > 0 && (
        <section data-id="dialog-transmissions" className={styles.transmissions}>
          <h3 className={styles.transmissionsTitle}>{t('word.transmissions')}</h3>
          {dialog.transmissions.map((transmission: DialogTransmission) => (
            <Transmission key={transmission.id} transmission={transmission} />
          ))}
        </section>
      )}
    </Article>
  );
};
