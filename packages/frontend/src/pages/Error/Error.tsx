import { Article, ArticleHeader, Breadcrumbs, Button, PageBase, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../routes';

export const ErrorPage = () => {
  const location = useLocation();
  const { componentName } = location.state || { componentName: 'Unknown Component' };
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <PageBase>
      <Article>
        <Breadcrumbs
          items={[
            {
              label: t('word.frontpage'),
              href: PageRoutes.inbox,
            },
            {
              label: t('word.unknown_error'),
              href: PageRoutes.error,
            },
          ]}
        />
        <ArticleHeader title={`Unexpected error in ${componentName}`}>
          <Typography>
            <p>
              {t('error.check_status_on')}{' '}
              <a target="_blank" href="https://info.altinn.no/om-altinn/driftsmeldinger/" rel="noreferrer">
                {t('error.service_status')}
              </a>
            </p>
            <p>
              {t('word.or')} <Button onClick={handleGoBack} label={t('error.go_back')} />
            </p>
          </Typography>
        </ArticleHeader>
      </Article>
    </PageBase>
  );
};
