import { Button } from '@digdir/designsystemet-react';
import { CheckmarkIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { FeatureFlagKeys, useFeatureFlag } from '../../featureFlags';
import styles from './inboxItemsHeader.module.css';

interface InboxItemsHeaderProps {
  title: string;
  onSelectAll?: () => void;
  hideSelectAll?: boolean;
}

/**
 * `InboxItemsHeader` renders the header section of an inbox items list, including a title and an optional "Select All" button.
 *
 * @component
 * @example
 * const title = "Inbox"
 * const onSelectAll = () => console.log("All items selected")
 * return <InboxItemsHeader title={title} onSelectAll={onSelectAll} />
 *
 * @param {Object} props - Props for InboxItemsHeader
 * @param {string} props.title - The title to be displayed in the header.
 * @param {boolean} props.hideSelectAll - Optionally hide the select all button.
 * @param {Function} [props.onSelectAll] - Optional callback function to be called when the "Select All" button is clicked.
 */
export const InboxItemsHeader = ({ title, onSelectAll, hideSelectAll = false }: InboxItemsHeaderProps) => {
  const { t } = useTranslation();
  const disableBulkActions = useFeatureFlag<boolean>(FeatureFlagKeys.DisableBulkActions);
  return (
    <header className={styles.inboxItemsHeader}>
      <h2 className={styles.title}>{title}</h2>
      {typeof onSelectAll === 'function' && !disableBulkActions && !hideSelectAll && (
        <Button data-size="sm" onClick={onSelectAll} variant="tertiary" color="neutral">
          <CheckmarkIcon fontSize="1.5rem" />
          {t('inbox.heading.choose_all')}
        </Button>
      )}
    </header>
  );
};
