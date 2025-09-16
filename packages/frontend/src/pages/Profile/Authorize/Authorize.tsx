import { Heading, List, ListItem, type ListItemProps, PageBase, PageNav, Toolbar } from '@altinn/altinn-components';
import { PlusIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../../utils/usePageTitle';
import { PageRoutes } from '../../routes';

const dummyUsers: ListItemProps[] = [
  {
    id: 'party:mathias',
    title: 'Kristian Haugen',
    description: 'Eier av Altinn',
    label: 'Eier',
    icon: {
      type: 'person',
      name: 'Kristian Haugen',
    },
  },
  {
    id: 'party:bergerbar',
    title: 'Lillehammer Bakeri',
    description: 'Bakeri i Lillehammer',
    icon: {
      type: 'company',
      name: 'Lillehammer Bakeri',
    },
  },
];

export const Authorize = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  usePageTitle({ baseTitle: t('sidebar.profile.authorize') });

  const filteredUsers = dummyUsers.filter(
    (user) => user.title?.toString().toLowerCase().includes(search.toLowerCase()) ?? false,
  );

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
            label: t('sidebar.profile.authorize'),
            href: PageRoutes.authorize,
          },
        ]}
      />
      <Heading size="xl">{t('profile.authorize.header')}</Heading>
      <Toolbar
        search={{ name: 'q', value: search, onChange: (e) => setSearch((e.target as HTMLInputElement).value) }}
      />
      <List>
        {filteredUsers.map((user) => (
          <ListItem key={user.id} id={user.id} title={user.title} description={user.description} icon={user.icon} />
        ))}
        <ListItem
          id="add-user"
          as={'button'}
          title={t('profile.authorize.add_user')}
          icon={{ theme: 'default', svgElement: PlusIcon }}
          onClick={() => {}}
        />
      </List>
    </PageBase>
  );
};
