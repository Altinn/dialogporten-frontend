import type { FilterProps, ToolbarFilterProps } from '@altinn/altinn-components';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useDialogsCount } from '../../api/hooks/useDialogsCount.tsx';
import { useServiceResource } from '../../api/hooks/useServiceResource.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { getEnvByHost } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { FilterCategory, getFilters, readFiltersFromURLQuery } from './filters';
import { useOrganizations } from './useOrganizations.ts';

interface UseFiltersOutput {
  filters: FilterProps[];
  getFilterLabel: ToolbarFilterProps['getFilterLabel'];
  filterGroups: FilterProps['groups'];
}

interface UseFiltersProps {
  viewType: InboxViewType;
}

export const useFilters = ({ viewType }: UseFiltersProps): UseFiltersOutput => {
  const { t, i18n } = useTranslation();
  const { dialogCounts: allDialogs } = useDialogsCount();
  const enableServiceFilter = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const [serviceResourcesQuery, setServiceResourcesQuery] = useState<string>('');
  const { organizations } = useOrganizations();
  const { serviceResources } = useServiceResource({});

  const [params] = useSearchParams();
  const orgsFromSearchState = params.getAll('org');

  const currentFilters = useMemo(() => {
    const filters = readFiltersFromURLQuery(params.toString());
    const normalizedFilters: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        normalizedFilters[key] = value.map(String);
      }
    }

    if (normalizedFilters.updated && normalizedFilters.updated.length > 0) {
      normalizedFilters.updated = [normalizedFilters.updated[0]];
    }

    return normalizedFilters;
  }, [params]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: i18n language won't change
  const suggestedServiceResources = useMemo(() => {
    const envByHost = getEnvByHost();
    const recommendedServices = serviceResources
      .filter((option) => {
        let shortlist = [];
        if (envByHost === 'at23' || envByHost === 'local') {
          shortlist = [
            'urn:altinn:resource:app_hdir_a2-4081-3',
            'urn:altinn:resource:app_sfd_a2-2975-1',
            'urn:altinn:resource:app_skd_a2-1051-181125',
            'urn:altinn:resource:nav-migratedcorrespondence-4503-',
            'urn:altinn:resource:app_skd_a2-1049-111124',
          ];
        } else if (envByHost === 'tt02') {
          shortlist = [
            'urn:altinn:resource:app_skd_a2-1051-130203',
            'urn:altinn:resource:app_brg_bvr-utv',
            'urn:altinn:resource:app_dibk_a2-4655-2',
            'urn:altinn:resource:nav_sykepenger_inntektsmelding',
          ];
        } else {
          shortlist = [
            'urn:altinn:resource:app_brg_a2-2705-201511',
            'urn:altinn:resource:app_skd_a2-3736-140122',
            'urn:altinn:resource:app_skd_a2-1051-130203',
            'urn:altinn:resource:app_skd_a2-3707-190403',
            'urn:altinn:resource:app_dibk_a2-4655-4',
            'urn:altinn:resource:nav_sykepenger_inntektsmelding',
          ];
        }
        return shortlist.some((sr) => option.id?.toLowerCase() === sr);
      })
      .map((option) => ({
        id: option.id + '-suggestion',
        ...option,
        groupId: 'recommendations',
      }));

    const selectedServices = serviceResources
      .filter((service) => currentFilters?.service?.includes(service.id!))
      .map((service) => ({
        ...service,
        groupId: 'selected',
      }));

    return !serviceResourcesQuery
      ? [...recommendedServices, ...selectedServices]
      : [...serviceResources, ...selectedServices];
  }, [serviceResources, serviceResourcesQuery, currentFilters]);

  const filters: FilterProps[] = useMemo(
    () =>
      getFilters({
        allDialogs,
        allOrganizations: organizations,
        viewType,
        orgsFromSearchState,
        serviceResources: suggestedServiceResources,
        currentFilters,
        serviceResourcesQuery,
        onServiceResourcesQueryChange: setServiceResourcesQuery,
        enableServiceFilter,
      }),
    [
      allDialogs,
      organizations,
      viewType,
      orgsFromSearchState,
      suggestedServiceResources,
      currentFilters,
      serviceResourcesQuery,
      enableServiceFilter,
    ],
  );

  const getFilterLabel = (name: string, value: (string | number)[] | undefined): string | undefined => {
    const filter = filters.find((f) => f.name === name);
    if (!filter || !value?.length) {
      return undefined;
    }

    if (name === FilterCategory.STATUS) {
      if (value?.length > 2) {
        return t('inbox.filter.multiple.status', { count: value?.length });
      }
      return value.map((v) => t(`status.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.UPDATED) {
      return value.map((v) => t(`filter.date.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.ORG) {
      if (value?.length === 1) {
        const serviceOwner = getOrganization(organizations, String(value[0]));
        return serviceOwner?.name || '';
      }
      return t('inbox.filter.multiple.sender', { count: value?.length });
    }

    if (name === FilterCategory.SERVICE) {
      if (value?.length === 1) {
        return t('inbox.filter.single.service');
      }
      return t('inbox.filter.multiple.service', { count: value?.length });
    }

    return undefined;
  };

  const filterGroups = {
    'status-date': {
      title: t('filter_bar.group.status_date'),
    },
    'service-related': {
      title: t('filter_bar.group.service_related'),
    },
  };

  return { filters, getFilterLabel, filterGroups };
};
