import { PageBase, PageNav } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../../routes';

export const Notifications = () => {
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
            label: t('sidebar.profile.notifications'),
            href: PageRoutes.notifications,
          },
        ]}
      />
      <h1>{t('sidebar.profile.notifications')}</h1>
    </PageBase>
  );
};
