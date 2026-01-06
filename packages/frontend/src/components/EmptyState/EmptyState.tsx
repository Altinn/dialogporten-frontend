import { Heading, Section, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../auth/url.ts';

interface EmptyStateProps {
  query?: string;
  viewType: InboxViewType;
  searchMode: boolean;
}

export const EmptyState = ({ query, viewType, searchMode }: EmptyStateProps) => {
  const { t } = useTranslation();
  const { currentPartyUuid } = useParties();

  if (searchMode) {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.noHits.title')}</Heading>
        <Typography size="sm">
          {query && (
            <p>
              {t('emptyState.noHits.descriptionBeforeQuery')}
              <strong>{query}</strong>
              {t('emptyState.noHits.descriptionAfterQuery')}
            </p>
          )}
          <p>
            <strong>{t('emptyState.noHits.improvement')}</strong> {t('emptyState.noHits.suggestionsIntro')}
          </p>
          <ul>
            <li>
              {t('emptyState.noHits.suggestion1Part1')}
              <strong>{t('emptyState.noHits.suggestion1Bold1')}</strong>
              {t('emptyState.noHits.suggestion1Part2')}
              <strong>{t('emptyState.noHits.suggestion1Bold2')}</strong>
            </li>
            <li>{t('emptyState.noHits.suggestion2')}</li>
            <li>
              {t('emptyState.noHits.suggestion3Part1')}
              <strong>{t('emptyState.noHits.suggestion3Bold1')}</strong>,{' '}
              <strong>{t('emptyState.noHits.suggestion3Bold2')}</strong> og{' '}
              <strong>{t('emptyState.noHits.suggestion3Bold3')}</strong>
              {t('emptyState.noHits.suggestion3Part2')}
            </li>
          </ul>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'inbox') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.inbox.title')}</Heading>
        <Typography size="sm">
          <p>{t('emptyState.inbox.description', { br: <br key={'inbox-p-br'} /> })}</p>
          <Link to={createMessageBoxLink(currentPartyUuid)}>{t('inbox.historical_messages_date_warning_link')}</Link>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'drafts') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.drafts.title')}</Heading>
      </Section>
    );
  }

  if (viewType === 'sent') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.sent.title')}</Heading>
      </Section>
    );
  }

  if (viewType === 'bin') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.bin.title')}</Heading>
      </Section>
    );
  }

  if (viewType === 'archive') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.archive.title')}</Heading>
        <Typography size="sm">
          <p>{t('emptyState.archive.descriptionAfterBold')}</p>
        </Typography>
      </Section>
    );
  }

  return null;
};
