import { Article, ArticleHeader, Button, PageBase, Typography } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

export const ErrorPage = () => {
  const location = useLocation();
  const { componentName } = location.state || { componentName: 'Unknown Component' };
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getTranslatedComponentName = (name: string) => {
    const translationKey = `component.${name.toLowerCase().replace(/\s+/g, '_')}`;
    const translated = t(translationKey);
    return translated === translationKey ? name : translated;
  };

  const translatedComponentName = getTranslatedComponentName(componentName);

  return (
    <PageBase>
      <Article>
        <ArticleHeader title={t('error.unexpected_error_in', { componentName: translatedComponentName })}>
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
