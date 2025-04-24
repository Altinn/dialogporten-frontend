import { PageBase, PageNav } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../../routes';

export const Settings = () => {
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
            label: t('sidebar.profile.settings'),
            href: PageRoutes.settings,
          },
        ]}
      />
      <h1>{t('sidebar.profile.settings')}</h1>
    </PageBase>
  );
};
