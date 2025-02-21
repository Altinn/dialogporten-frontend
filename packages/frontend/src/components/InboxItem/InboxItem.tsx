import { Avatar } from '@altinn/altinn-components';
import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import classNames from 'classnames';
import cx from 'classnames';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Participant } from '../../api/useDialogById.tsx';
import type { InboxViewType } from '../../api/useDialogs.tsx';
import { FeatureFlagKeys, useFeatureFlag } from '../../featureFlags';
import type { InboxItemMetaField } from '../MetaDataFields';
import { MetaDataFields } from '../MetaDataFields';
import { useSelectedDialogs } from '../PageLayout';
import { ProfileCheckbox } from '../ProfileCheckbox';
import styles from './inboxItem.module.css';

interface InboxItemProps {
  checkboxValue: string;
  title: string;
  summary: string;
  sender: Participant;
  receiver: Participant;
  linkTo: string;
  isChecked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  metaFields?: InboxItemMetaField[];
  isUnread?: boolean;
  isMinimalistic?: boolean;
  onClose?: () => void;
  isSeenByEndUser?: boolean;
  viewType?: InboxViewType;
}

export interface InboxItemInput {
  id: string;
  party: string;
  title: string;
  summary: string;
  sender: Participant;
  receiver: Participant;
  metaFields: InboxItemMetaField[];
  createdAt: string;
  updatedAt: string;
  status: DialogStatus;
  isSeenByEndUser: boolean;
  label: SystemLabel;
  org?: string;
}

export const OptionalLinkContent = ({
  children,
  linkTo,
}: {
  children: React.ReactNode;
  linkTo: string | undefined;
}) => {
  if (linkTo) {
    return (
      <Link to={linkTo} state={{ fromView: location.pathname }} className={styles.link}>
        {children}
      </Link>
    );
  }
  return children;
};

/**
 * Represents an individual inbox item, displaying information such as the title,
 * summary, sender, and receiver, along with optional tags. It includes a checkbox
 * to mark the item as checked/unchecked and can visually indicate if it is unread.
 * Should only be used as child of InboxItems
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.checkboxValue - The value attribute for the checkbox input.
 * @param {string} props.title - The title of the inbox item.
 * @param {string} props.summary - The summary or content of the inbox item.
 * @param {Participant} props.sender - The sender of the inbox item, including label and optional icon.
 * @param {Participant} props.receiver - The receiver of the inbox item, including label and optional icon.
 * @param {boolean} props.isChecked - Whether the inbox item is checked. This can support batch operations.
 * @param {function(boolean): void} props.onCheckedChange - Callback function triggered when the checkbox value changes.
 * @param {boolean} [props.isUnread=false] - Whether the inbox item should be styled to indicate it is unread.
 * @param {string} [props.linkTo=undefined] - When provided a href it renders a link as title for navigation.
 * @returns {ReactElement} The InboxItem component.
 *
 * @example
 * <InboxItem
 *   checkboxValue="item1"
 *   title="Meeting Reminder"
 *   summary="Don't forget the meeting tomorrow at 10am."
 *   sender={{ label: "Alice", icon: <MailIcon /> }}
 *   receiver={{ label: "Bob", icon: <PersonIcon /> }}
 *   isChecked={false}
 *   onCheckedChange={(checked) => console.log(checked)}
 *   tags={[{ label: "Urgent", icon: <WarningIcon />, className: "urgent" }]}
 *   isUnread
 * />
 */
export const InboxItem = ({
  title,
  summary,
  sender,
  receiver,
  metaFields = [],
  onCheckedChange,
  checkboxValue,
  onClose,
  isUnread = false,
  isMinimalistic = false,
  isChecked = false,
  linkTo,
  viewType,
}: InboxItemProps): ReactElement => {
  const { inSelectionMode } = useSelectedDialogs();
  const { t } = useTranslation();
  const disableBulkActions = useFeatureFlag<boolean>(FeatureFlagKeys.DisableBulkActions);

  const hideSummaryAndMeta = !summary || viewType === 'archive' || viewType === 'bin';
  const onClick = () => {
    if (inSelectionMode && onCheckedChange) {
      onCheckedChange(!checkboxValue);
    }
    if (isMinimalistic) {
      onClose?.();
    }
  };
  if (isMinimalistic) {
    return (
      <div
        className={classNames(styles.inboxItemWrapper, {
          [styles.active]: isChecked,
          [styles.pointer]: inSelectionMode,
          [styles.minimalistic]: isMinimalistic,
        })}
        aria-selected={isChecked ? 'true' : 'false'}
        onClick={onClick}
        onKeyUp={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
      >
        <OptionalLinkContent linkTo={!inSelectionMode ? linkTo : undefined}>
          <section
            className={classNames(styles.inboxItem, {
              [styles.isUnread]: isUnread,
            })}
          >
            <header className={styles.header}>
              <h2 className={styles.title}>{title}</h2>
              {onCheckedChange && (
                <ProfileCheckbox
                  aria-label={t('inbox.checkbox.select_item')}
                  checked={isChecked}
                  value={checkboxValue}
                  onClick={(e) => {
                    if (e.currentTarget === e.target) {
                      e.stopPropagation();
                    }
                  }}
                  onChange={(e) => {
                    onCheckedChange?.(e.target.checked);
                  }}
                  data-size="sm"
                />
              )}
            </header>
            <p className={styles.summary}>{summary}</p>
          </section>
        </OptionalLinkContent>
      </div>
    );
  }

  return (
    <li
      className={classNames(styles.inboxItemWrapper, {
        [styles.active]: isChecked,
        [styles.hoverable]: linkTo,
        [styles.pointer]: inSelectionMode,
      })}
      aria-selected={isChecked ? 'true' : 'false'}
      onClick={onClick}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <OptionalLinkContent linkTo={!inSelectionMode ? linkTo : undefined}>
        <section
          className={classNames(styles.inboxItem, {
            [styles.isUnread]: isUnread,
          })}
        >
          <header className={styles.header}>
            <h2 className={classNames(styles.title, { [styles.title__unread]: isUnread })}>{title}</h2>
            {onCheckedChange && !disableBulkActions && (
              <ProfileCheckbox
                aria-label={t('inbox.checkbox.select_item')}
                checked={isChecked}
                value={checkboxValue}
                onClick={(e) => {
                  if (e.currentTarget === e.target) {
                    e.stopPropagation();
                  }
                }}
                onChange={(e) => {
                  onCheckedChange?.(e.target.checked);
                }}
                data-size="sm"
              />
            )}
          </header>
          <div className={cx(styles.participants, { [styles.bottomPadding]: hideSummaryAndMeta })}>
            <div className={styles.sender}>
              <Avatar
                name={sender?.name ?? ''}
                type={sender?.isCompany ? 'company' : 'person'}
                imageUrl={sender.imageURL}
                size="sm"
              />
              <span>{sender?.name}</span>
            </div>
            <div className={styles.receiver}>
              <span className={styles.participantLabel}>{`${t('word.to')} ${receiver?.name}`}</span>
            </div>
          </div>
          {hideSummaryAndMeta ? null : (
            <>
              <p className={styles.summary}>{summary}</p>
              <MetaDataFields metaFields={metaFields || []} viewType={viewType} />
            </>
          )}
        </section>
      </OptionalLinkContent>
    </li>
  );
};
