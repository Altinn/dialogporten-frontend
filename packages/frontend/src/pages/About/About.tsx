import {
  Article,
  Breadcrumbs,
  type BreadcrumbsProps,
  Heading,
  List,
  ListItem,
  PageBase,
  Section,
  Typography,
} from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { pruneSearchQueryParams } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes';

export const AboutPage = () => {
  const [expandInboxInfo, setExpandInboxInfo] = useState(false);
  const [expandProfileInfo, setExpandProfileInfo] = useState(false);
  const { t } = useTranslation();
  const { search } = useLocation();
  usePageTitle({ baseTitle: t('altinn.beta.about') });

  return (
    <PageBase>
      <Breadcrumbs
        items={
          [
            {
              label: t('altinn.beta.inbox'),
              as: (props) => <Link {...props} to={PageRoutes.inbox + pruneSearchQueryParams(search)} />,
            },
            {
              label: t('altinn.beta.about'),
            },
          ] as BreadcrumbsProps['items']
        }
      />
      <Article>
        <Heading size="xl">{t('about.inbox.title')}</Heading>
        <Typography maxWidth="65ch">
          <p>{t('about.inbox.intro1')}</p>

          <List>
            <ListItem
              collapsible
              title={<Typography maxWidth="65ch">{t('about.inbox.section.dialogs.title')}</Typography>}
              expanded={expandInboxInfo}
              as="button"
              onClick={() => setExpandInboxInfo((prev) => !prev)}
            >
              <Section padding={6}>
                <Typography maxWidth="65ch">
                  <p>{t('about.inbox.section.dialogs.p1')}</p>
                </Typography>
              </Section>
            </ListItem>
            <ListItem
              collapsible
              title={<Typography maxWidth="65ch">{t('about.inbox.section.profile.title')}</Typography>}
              expanded={expandProfileInfo}
              as="button"
              onClick={() => setExpandProfileInfo((prev) => !prev)}
            >
              <Section padding={6}>
                <Typography maxWidth="65ch">
                  <p>{t('about.inbox.section.profile.p1')}</p>
                </Typography>
              </Section>
            </ListItem>
          </List>

          <h2>{t('about.inbox.section.feedback.title')}</h2>
          <p>
            {t('about.inbox.section.feedback.p1')}{' '}
            <a href="mailto:support@altinn.no">{t('about.inbox.section.feedback.email')}</a>
          </p>
        </Typography>
      </Article>
    </PageBase>
  );
};
