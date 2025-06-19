import { Heading, PageBase, PageNav } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../../routes';

export const Access = () => {
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
            label: t('sidebar.profile.access'),
            href: PageRoutes.access,
          },
        ]}
      />
      <Heading size="xl">{t('sidebar.profile.access')}</Heading>
    </PageBase>
  );
};
