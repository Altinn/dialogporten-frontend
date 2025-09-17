import { Article, Breadcrumbs, Heading, PageBase, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createMessageBoxLink } from '../../auth';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes';

export const AboutPage = () => {
  const { t } = useTranslation();

  usePageTitle({ baseTitle: t('altinn.beta.about') });

  return (
    <PageBase>
      <Breadcrumbs
        items={[
          {
            label: t('altinn.beta.inbox'),
            as: (props) => <Link {...props} to={PageRoutes.inbox} />,
          },
          {
            label: t('altinn.beta.about'),
          },
        ]}
      />
      <Article>
        <Heading size="xl">{t('about.inbox.title')}</Heading>
        <Typography maxWidth="65ch">
          <p>{t('about.inbox.intro1')}</p>
          <p>
            {t('about.inbox.intro2')}{' '}
            <a href={t('about.altinn.link')} target="_blank" rel="noreferrer">
              {t('about.inbox.intro.link')}
            </a>
          </p>

          <h2>{t('about.inbox.section.dialogs.title')}</h2>
          <p>{t('about.inbox.section.dialogs.p1')}</p>
          <ul>
            <li>{t('about.inbox.section.dialogs.li1')}</li>
            <li>{t('about.inbox.section.dialogs.li2')}</li>
          </ul>

          <h2>{t('about.inbox.section.find.title')}</h2>
          <p>{t('about.inbox.section.find.p1')}</p>
          <ul>
            <li>{t('about.inbox.section.find.li1')}</li>
            <li>{t('about.inbox.section.find.li2')}</li>
            <li>{t('about.inbox.section.find.li3')}</li>
          </ul>

          <h2>{t('about.inbox.section.availability.title')}</h2>
          <p>{t('about.inbox.section.availability.p1')}</p>
          <p>
            {t('about.inbox.section.availability.p2')}{' '}
            <a href={createMessageBoxLink()}>{t('about.inbox.section.availability.link')}</a>
          </p>

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
