import { Heading, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../auth';
import { SaveSearchButton, type SaveSearchButtonProps } from '../SavedSearchButton/SaveSearchButton.tsx';

interface EmptyStateProps {
  viewType: InboxViewType;
  searchMode: boolean;
  saveSearchButtonProps: SaveSearchButtonProps;
}

export const EmptyState = ({ viewType, searchMode, saveSearchButtonProps }: EmptyStateProps) => {
  const { t } = useTranslation();
  const { currentPartyUuid } = useParties();
  if (searchMode) {
    return (
      <Typography size="sm">
        <Heading size="lg">{t('emptyState.noHits.title')}</Heading>
        <p>{t('emptyState.saveSearch.button.info')}</p>
        <p>
          <SaveSearchButton {...saveSearchButtonProps} variant="outline" />
        </p>
      </Typography>
    );
  }

  if (viewType === 'inbox') {
    return (
      <Typography size="sm">
        <Heading size="lg">{t('emptyState.inbox.title')}</Heading>
        <p>{t('emptyState.inbox.description', { br: <br key={'inbox-p-br'} /> })}</p>
        <Link to={createMessageBoxLink(currentPartyUuid)}>{t('inbox.historical_messages_date_warning_link')}</Link>
      </Typography>
    );
  }

  if (viewType === 'drafts') {
    return <Heading size="lg">{t('emptyState.drafts.title')}</Heading>;
  }

  if (viewType === 'sent') {
    return <Heading size="lg">{t('emptyState.sent.title')}</Heading>;
  }

  if (viewType === 'bin') {
    return <Heading size="lg">{t('emptyState.bin.title')}</Heading>;
  }

  if (viewType === 'archive') {
    return (
      <Typography size="sm">
        <Heading size="lg">{t('emptyState.archive.title')}</Heading>
        <p>{t('emptyState.archive.descriptionAfterBold')}</p>
      </Typography>
    );
  }

  return null;
};
