import {
  Heading,
  Icon,
  List,
  ListItem,
  PageBase,
  PageNav,
  Section,
  Toolbar,
  Typography,
} from '@altinn/altinn-components';
import { ExclamationmarkTriangleIcon, PackageIcon } from '@navikt/aksel-icons';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRoutes } from '../../routes';

const dummyGroups = [
  {
    id: 'skatt',
    name: 'Skatteetaten, regnskap og toll',
    description: 'Beskrivelse for Skatteetaten, regnskap og toll',
    services: [
      { groupId: 'skatt', name: 'Skatt og merverdigavgift', counter: 2 },
      { groupId: 'skatt', name: 'Skatteoppgjør', counter: 1 },
    ],
  },
  {
    id: 'personale',
    name: 'Personale',
    description: 'Beskrivelse for Personale',
    services: [
      { groupId: 'personale', name: 'Lønn og personal', counter: 3 },
      { groupId: 'personale', name: 'Personaladministrasjon', counter: 1 },
      { groupId: 'personale', name: 'Rekruttering', counter: 2 },
    ],
  },
  {
    id: 'miljø',
    name: 'Miljø og sikkerhet',
    description: 'Beskrivelse for Miljø og sikkerhet',
    services: [
      { groupId: 'miljø', name: 'Miljøtiltak og rapportering', counter: 1 },
      { groupId: 'miljø', name: 'Miljørapportering', counter: 1 },
      { groupId: 'miljø', name: 'Miljø og sikkerhet', counter: 1 },
    ],
  },
];

export const Access = () => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<{ type?: string[] }>({});
  const { t } = useTranslation();

  const onToggle = (id: string) => {
    setExpandedId((prevState) => (prevState === id ? null : id));
  };

  const filteredGroups = dummyGroups.filter((group) => {
    const matchesSearch = group.name?.toString().toLowerCase().includes(search.toLowerCase()) ?? false;
    const activeFilterValues: string[] = Array.isArray(filterState.type) ? filterState.type : [];
    const matchesFilter = activeFilterValues.length === 0 || activeFilterValues.includes(group.id);
    return matchesSearch && matchesFilter;
  });

  const filters = dummyGroups.map((group) => {
    return {
      groupId: 'groups',
      value: group.id,
      label: group.name,
    };
  });

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
      <Heading size="xl">{t('profile.access.heading')}</Heading>

      <Toolbar
        search={{ name: 'q', value: search, onChange: (e) => setSearch((e.target as HTMLInputElement).value) }}
        filterState={filterState}
        onFilterStateChange={setFilterState}
        filters={[
          {
            name: 'type',
            label: 'Alle kategorier',
            optionType: 'checkbox',
            options: [...filters],
          },
        ]}
      />

      <List>
        {filteredGroups.map((group) => {
          const expanded = group.id === expandedId;
          return (
            <ListItem
              key={group.id}
              id={group.id}
              title={group.name}
              collapsible
              expanded={expanded}
              onClick={() => onToggle(group.id)}
              as="button"
              icon={{ theme: 'default', svgElement: PackageIcon }}
              badge={
                <>
                  <Icon svgElement={ExclamationmarkTriangleIcon} />
                  <Typography size="xs">{t('profile.access.grant_access_word')}</Typography>
                </>
              }
            >
              {expanded && (
                <Section padding={4} spacing={4}>
                  <Heading>{group.description}</Heading>
                  <List>
                    {group.services.map((service) => (
                      <ListItem
                        key={service.name}
                        id={`${group.id}/${service.name}`}
                        title={service.name}
                        description={`${service.counter} services`}
                        as="button"
                        onClick={() => {}}
                        icon={{ theme: 'default', svgElement: PackageIcon }}
                      />
                    ))}
                  </List>
                </Section>
              )}
            </ListItem>
          );
        })}
      </List>
    </PageBase>
  );
};
