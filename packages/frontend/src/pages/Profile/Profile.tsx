import { PageBase, PageNav } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../routes';

export const Profile = () => {
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
        ]}
      />
      <h1>{t('sidebar.profile')}</h1>
    </PageBase>
  );
};
