import { PageBase, PageNav } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../../routes';

export const Activities = () => {
  return (
    <PageBase>
      <PageNav
        breadcrumbs={[
          {
            label: t('word.frontpage'),
            href: PageRoutes.inbox,
          },
          {
            label: t('sidebar.profile'),
            href: PageRoutes.profile,
          },
          {
            label: t('sidebar.profile.activities'),
            href: PageRoutes.activities,
          },
        ]}
      />
      <h1>{t('sidebar.profile.activities')}</h1>
    </PageBase>
  );
};
