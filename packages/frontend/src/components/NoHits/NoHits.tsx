import { Heading, Section, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';

interface NoHitsProps {
  query?: string;
  viewType: InboxViewType;
}

export const NoHits = ({ query, viewType }: NoHitsProps) => {
  const { t } = useTranslation();

  if (query) {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.noHits.title')}</Heading>
        <Typography size="sm">
          <p>
            {t('emptyState.noHits.descriptionBeforeQuery')}
            <strong>{query}</strong>
            {t('emptyState.noHits.descriptionAfterQuery')}
          </p>
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
          <p>
            <strong>{t('emptyState.inbox.moving')}</strong> {t('emptyState.inbox.description')}
          </p>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'drafts') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.drafts.title')}</Heading>
        <Typography size="sm">
          <p>
            {t('emptyState.drafts.descriptionBeforeStrong')}
            <strong>{t('emptyState.drafts.descriptionBold')}</strong>
            {t('emptyState.drafts.descriptionAfterStrong')}
          </p>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'sent') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.sent.title')}</Heading>
        <Typography size="sm">
          <p>
            {t('emptyState.sent.descriptionBeforeStrong')}
            <strong>{t('emptyState.sent.descriptionBold')}</strong>
            {t('emptyState.sent.descriptionAfterStrong')}
          </p>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'bin') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.bin.title')}</Heading>
        <Typography size="sm">
          <p>
            <strong>{t('emptyState.bin.descriptionBold')}</strong> {t('emptyState.bin.descriptionAfterBold')}
          </p>
        </Typography>
      </Section>
    );
  }

  if (viewType === 'archive') {
    return (
      <Section spacing={3} margin="section">
        <Heading size="lg">{t('emptyState.archive.title')}</Heading>
        <Typography size="sm">
          <p>
            <strong>{t('emptyState.archive.descriptionBold')}</strong> {t('emptyState.archive.descriptionAfterBold')}
          </p>
        </Typography>
      </Section>
    );
  }

  return null;
};
