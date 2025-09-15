import { ActivityLog, Heading, PageBase, PageNav, Toolbar, type ToolbarFilterProps } from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../../utils/usePageTitle';
import { PageRoutes } from '../../routes';

const dummyActivities = [
  {
    id: '1',
    datetime: '2024-11-04',
    byline: '4. november 2024',
    children:
      'Altinn1 ANS mottok rettighet til tjenesten A01 a-melding for ATELIER INGER-HILDE NYRUD. Det var OLE GUNNAR HODDØ som ga rettigheten.',
  },
  {
    id: '2',
    datetime: '2024-11-23',
    byline: '23. november 2024',
    children:
      'Altinn1 ANS mottok rettighet til tjenesten Søknad om tilskudd fra Helsedirektoratet for PRAT, SPIS OG REIS LITT. Det var MONICA ARNESEN som ga rettigheten.',
  },
  {
    id: '3',
    datetime: '2024-08-26',
    byline: '26. august 2024',
    children: 'Altinn1 ANS mistet tilgang til tjenesten Årsregnskap (RR-0002) for ANITA MEISINGSET.',
  },
  {
    id: '4',
    datetime: '2024-08-26',
    byline: '26. august 2024',
    children: 'Altinn1 ANS mistet rollen Patent, varemerke og design for ANITA MEISINGSET.',
  },
  {
    id: '5',
    datetime: '2024-08-13',
    byline: '13. august 2024',
    children:
      'Altinn1 ANS mottok rettighet til tjenesten Energitilskudd-rapporteringsskjema for Suppoort AS. Det var Ola Support som ga rettigheten.',
  },
  {
    id: '6',
    datetime: '2024-04-22',
    byline: '22. april 2024',
    children:
      'Altinn1 ANS mistet tilgang til tjenestene ACN Bruksmønster F, Søknad om sykepenger, Energitilskudd-rapporteringsskjema, ACN Bruksmønster E, ACN Bruksmønster G og ACN Bruksmønster D for Suppoort AS. Det var Ola Support som fjernet rettigheten.',
  },
  {
    id: '7',
    datetime: '2024-04-22',
    byline: '22. april 2024',
    children:
      'Altinn1 ANS mottok rettighet til tjenesten Energitilskudd-rapporteringsskjema for Suppoort AS. Det var Anne Support som ga rettigheten.',
  },
  {
    id: '8',
    datetime: '2024-01-29',
    byline: '29. januar 2024',
    children:
      'Altinn1 ANS mottok rettighet til tjenesten Priser på betalingstjenester i bedriftskundemarkedet (RA-0820) for Test Organisasjonsnavn 38. Det var Kari Altinn2 som ga rettigheten.',
  },
  {
    id: '9',
    datetime: '2024-04-10',
    byline: '10. april 2024',
    children:
      'Altinn1 ANS mistet tilgang til tjenesten Ny søknad om patent (PS-101) for DEN LILLE HJELPER. Det var ELAINE KRISTIN MIKKELSEN SVARTIS som fjernet rettigheten.',
  },

  {
    id: '10',
    datetime: '2024-04-27',
    byline: '27. april 2024',
    children:
      'Altinn1 ANS mistet tilgang til tjenestene Folkeregisteret - Offentlig og privat virksomhet med hjemmel - På vegne av, Folkeregisteret - Offentlig virksomhet uten hjemmel - På vegne av og Folkeregisteret - Privat virksomhet - På vegne av for PRAT, SPIS OG REIS LITT. Det var STEIN ROGER WARHOLM som fjernet rettigheten.',
  },
  {
    id: '11',
    datetime: '2021-12-20',
    byline: '20. desember 2021',
    children:
      'Altinn1 ANS mottok rettighet til tjenestene Folkeregisteret - Offentlig virksomhet uten hjemmel - På vegne av, Folkeregisteret - Offentlig og privat virksomhet med hjemmel - På vegne av og Folkeregisteret - Privat virksomhet - På vegne av for PRAT, SPIS OG REIS LITT. Det var STEIN ROGER WARHOLM som ga rettigheten.',
  },
  {
    id: '12',
    datetime: '2021-12-02',
    byline: '2. desember 2021',
    children:
      'Altinn1 ANS mistet tilgang til tjenestene Folkeregisteret - Offentlig virksomhet uten hjemmel - På vegne av, Folkeregisteret - Offentlig og privat virksomhet med hjemmel - På vegne av og Folkeregisteret - Finansforetak - På vegne av for PRAT, SPIS OG REIS LITT. Det var STEIN ROGER WARHOLM som fjernet rettigheten.',
  },
];

export const dummyActivityLogTypeFilter: ToolbarFilterProps = {
  name: 'type',
  label: 'Alle aktører',
  optionType: 'radio',
  options: [
    {
      groupId: '1',
      label: 'Virksomheter',
      value: 'company',
    },
    {
      groupId: '1',
      label: 'Personer',
      value: 'person',
    },
  ],
};

export const Activities = () => {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('sidebar.profile.activities') });

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
      <Heading size="xl">{t('sidebar.profile.activities')}</Heading>
      <Toolbar
        filters={[dummyActivityLogTypeFilter]}
        search={{ name: 'q', value: search, onChange: (e) => setSearch((e.target as HTMLInputElement).value) }}
      />
      <ActivityLog items={dummyActivities} />
    </PageBase>
  );
};
