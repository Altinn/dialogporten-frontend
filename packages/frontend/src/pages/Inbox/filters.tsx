import {
  type FilterProps,
  type FilterState,
  type MenuItemProps,
  SelectDateFilter,
  type ToolbarFilterProps,
} from '@altinn/altinn-components';
import { CalendarIcon, InformationSquareIcon, MenuGridIcon, MenuHamburgerIcon } from '@navikt/aksel-icons';
import {
  type CountableDialogFieldsFragment,
  DialogStatus,
  type GetAllDialogsForPartiesQueryVariables,
  type OrganizationFieldsFragment,
  type ServiceResource,
  SystemLabel,
} from 'bff-types-generated';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns';
import type { Locale } from 'date-fns/locale';
import i18n, { t } from 'i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { getOrganization } from '../../api/utils/organizations.ts';
import { getEnvByHost } from '../../auth';

interface ServiceFilterProps {
  serviceResources: ServiceResource[];
  currentFilters?: FilterState;
  allOrganizations: OrganizationFieldsFragment[];
}

export enum DateFilterOption {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_SIX_MONTHS = 'LAST_SIX_MONTHS',
  LAST_TWELVE_MONTHS = 'LAST_TWELVE_MONTHS',
  OLDER_THAN_ONE_YEAR = 'OLDER_THAN_ONE_YEAR',
}

const getSuggestedServiceIds = () => {
  const envByHost = getEnvByHost();
  if (envByHost === 'at23' || envByHost === 'local') {
    return [
      'urn:altinn:resource:app_hdir_a2-4081-3',
      'urn:altinn:resource:app_sfd_a2-2975-1',
      'urn:altinn:resource:app_skd_a2-1051-181125',
      'urn:altinn:resource:nav-migratedcorrespondence-4503-',
      'urn:altinn:resource:app_skd_a2-1049-111124',
    ];
  }
  if (envByHost === 'tt02') {
    return [
      'urn:altinn:resource:app_skd_a2-1051-130203',
      'urn:altinn:resource:app_brg_bvr-utv',
      'urn:altinn:resource:app_dibk_a2-4655-2',
      'urn:altinn:resource:nav_sykepenger_inntektsmelding',
    ];
  }
  return [
    'urn:altinn:resource:app_brg_a2-2705-201511',
    'urn:altinn:resource:app_skd_a2-3736-140122',
    'urn:altinn:resource:app_skd_a2-1051-130203',
    'urn:altinn:resource:app_skd_a2-3707-190403',
    'urn:altinn:resource:app_dibk_a2-4655-4',
    'urn:altinn:resource:nav_sykepenger_inntektsmelding',
  ];
};

export const getDateRange = (unit: 'day' | 'week' | 'month' | 'sixMonths' | 'year') => {
  const now = new Date();
  switch (unit) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'sixMonths':
      return { start: subMonths(now, 6), end: endOfDay(now) };
    case 'year':
      return { start: subYears(now, 1), end: endOfDay(now) };
  }
};

const toIsoStartOfLocalDay = (dateStr?: string | number | undefined) => {
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return undefined;
    return startOfDay(date).toISOString();
  } catch {
    return undefined;
  }
};

const toIsoEndOfLocalDay = (dateStr?: string | number | undefined) => {
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return undefined;
    return endOfDay(date).toISOString();
  } catch {
    return undefined;
  }
};

const filterRanges: Record<DateFilterOption, { start?: Date; end?: Date }> = {
  [DateFilterOption.TODAY]: getDateRange('day'),
  [DateFilterOption.THIS_WEEK]: getDateRange('week'),
  [DateFilterOption.THIS_MONTH]: getDateRange('month'),
  [DateFilterOption.LAST_SIX_MONTHS]: getDateRange('sixMonths'),
  [DateFilterOption.LAST_TWELVE_MONTHS]: getDateRange('year'),
  [DateFilterOption.OLDER_THAN_ONE_YEAR]: { end: getDateRange('year').start },
};

export enum FilterCategory {
  ORG = 'org',
  STATUS = 'status',
  UPDATED = 'updated',
  SERVICE = 'service',
  FROM_DATE = 'fromDate',
  TO_DATE = 'toDate',
}

const createDateOptions = (): MenuItemProps[] => {
  const options = [
    {
      id: DateFilterOption.TODAY,
      role: 'radio',
      value: DateFilterOption.TODAY,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.THIS_WEEK,
      role: 'radio',
      value: DateFilterOption.THIS_WEEK,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.THIS_MONTH,
      role: 'radio',
      value: DateFilterOption.THIS_MONTH,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.LAST_SIX_MONTHS,
      role: 'radio',
      value: DateFilterOption.LAST_SIX_MONTHS,
      groupId: 'date-months',
    },
    {
      id: DateFilterOption.LAST_TWELVE_MONTHS,
      role: 'radio',
      value: DateFilterOption.LAST_TWELVE_MONTHS,
      groupId: 'date-months',
    },
    {
      id: DateFilterOption.OLDER_THAN_ONE_YEAR,
      role: 'radio',
      value: DateFilterOption.OLDER_THAN_ONE_YEAR,
      groupId: 'date-older',
    },
    {
      id: DateFilterOption.OLDER_THAN_ONE_YEAR,
      title: t('filter.date.fromandtodate'),
      icon: CalendarIcon,
      linkIcon: true,
      role: 'datepicker',
      value: DateFilterOption.OLDER_THAN_ONE_YEAR,
      groupId: 'custom',
    },
  ];

  return options.map((option) => ({
    title: t(`filter.date.${option.value.toLowerCase()}`),
    ...option,
    name: FilterCategory.UPDATED,
  }));
};

const createServiceOwnerFilter = (
  allDialogs: CountableDialogFieldsFragment[],
  allOrganizations: OrganizationFieldsFragment[],
): FilterProps => {
  const mostRelevantOrgs = Array.from(new Set([...allDialogs.map((d) => d.org)]));
  return {
    id: FilterCategory.ORG,
    icon: MenuHamburgerIcon,
    groupId: 'service-related',
    title: t('filter_bar.label.choose_sender'),
    name: FilterCategory.ORG,
    searchable: true,
    removable: true,
    groups: {
      'service-owners': {
        title: mostRelevantOrgs.length ? '' : t('filter_bar.group.choose_sender'),
      },
      selected: {},
      'most-relevant': {
        title: t('filter_bar.group.choose_sender'),
      },
    },
    items: allOrganizations
      .map((org) => {
        const localizedOrg = getOrganization(allOrganizations, org.id ?? '');
        return {
          id: org.id ?? '',
          name: FilterCategory.ORG,
          title: localizedOrg?.name ?? '',
          value: org.id ?? '',
          role: 'checkbox',
          groupId: mostRelevantOrgs.includes(org.id ?? '') ? 'most-relevant' : 'service-owners',
        };
      })
      .sort((a, b) => {
        const groupOrder: Record<string, number> = {
          'most-relevant': 0,
          'service-owners': 1,
        };
        const ga = groupOrder[a.groupId] ?? Number.MAX_SAFE_INTEGER;
        const gb = groupOrder[b.groupId] ?? Number.MAX_SAFE_INTEGER;

        if (ga !== gb) return ga - gb;

        return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
      }),
  };
};

const createStatusFilter = (): FilterProps => {
  return {
    id: FilterCategory.STATUS,
    title: t('filter_bar.label.choose_status'),
    groupId: 'status-date',
    icon: InformationSquareIcon,
    name: FilterCategory.STATUS,
    removable: true,
    groups: {
      'status-general': {
        title: t('filter_bar.group.choose_status'),
      },
      'status-active': {},
      'status-draft': {},
      'status-history': {},
    },
    items: [
      {
        id: DialogStatus.NotApplicable,
        title: t('status.not_applicable'),
        groupId: 'status-general',
        value: DialogStatus.NotApplicable,
      },
      {
        id: DialogStatus.RequiresAttention,
        title: t('status.requires_attention'),
        groupId: 'status-active',
        value: DialogStatus.RequiresAttention,
      },
      {
        id: DialogStatus.Awaiting,
        title: t('status.awaiting'),
        groupId: 'status-active',
        value: DialogStatus.Awaiting,
      },
      {
        id: DialogStatus.InProgress,
        title: t('status.in_progress'),
        groupId: 'status-active',
        value: DialogStatus.InProgress,
      },
      {
        id: DialogStatus.Completed,
        title: t('status.completed'),
        groupId: 'status-active',
        value: DialogStatus.Completed,
      },
      {
        id: DialogStatus.Draft,
        title: t('status.draft'),
        groupId: 'status-draft',
        value: DialogStatus.Draft,
      },
      {
        id: SystemLabel.Sent,
        title: t('status.sent'),
        groupId: 'status-history',
        value: SystemLabel.Sent,
      },
      {
        id: SystemLabel.Archive,
        title: t('status.archive'),
        groupId: 'status-history',
        value: SystemLabel.Archive,
      },
      {
        id: SystemLabel.Bin,
        title: t('status.bin'),
        groupId: 'status-history',
        value: SystemLabel.Bin,
      },
    ].map((item) => ({
      ...item,
      role: 'checkbox',
      name: FilterCategory.STATUS,
    })),
  };
};

const createUpdatedAtFilter = (): FilterProps => {
  return {
    title: t('filter_bar.label.updated'),
    as: SelectDateFilter,
    icon: CalendarIcon,
    groupId: 'status-date',
    id: FilterCategory.UPDATED,
    name: FilterCategory.UPDATED,
    removable: true,
    groups: {
      'date-recent': {
        title: t('filter_bar.group.choose_date'),
      },
      'date-months': {},
      'date-older': {},
    },
    items: createDateOptions(),
  };
};

export const createServiceFilter = ({
  serviceResources,
  currentFilters = {},
  allOrganizations,
}: ServiceFilterProps): FilterProps => {
  const suggestedServiceIds = getSuggestedServiceIds();
  const serviceFilters: FilterProps[] = serviceResources
    .map((s) => ({
      id: s.id!,
      name: s.id!,
      items: [],
      title: s.title?.[i18n.language as keyof typeof s.title] ?? '',
      groupId: suggestedServiceIds?.includes(s.id!) ? 'most-relevant' : 'services',
      description: getOrganization(allOrganizations, s.org ?? '')?.name || '',
    }))
    .sort((a, b) => {
      const groupOrder: Record<string, number> = {
        'most-relevant': 0,
        services: 1,
      };
      const ga = groupOrder[a.groupId] ?? Number.MAX_SAFE_INTEGER;
      const gb = groupOrder[b.groupId] ?? Number.MAX_SAFE_INTEGER;

      return ga - gb;
    });

  return {
    id: FilterCategory.SERVICE,
    groupId: 'service-related',
    icon: MenuGridIcon,
    title: t('filter_bar.label.choose_service'),
    name: FilterCategory.SERVICE,
    removable: true,
    virtualized: true,
    searchable: true,
    groups: {
      selected: {},
      'most-relevant': {
        title: t('filter_bar.group.choose_service'),
      },
      services: {},
    },
    items: serviceFilters
      .filter((serviceResource) => serviceResource.id)
      .map((serviceResource) => {
        const checked = currentFilters.service?.includes(serviceResource.id ?? '') ?? false;
        return {
          groupId: serviceResource.groupId,
          description: serviceResource.description,
          title: serviceResource.title,
          value: serviceResource.id,
          searchWords: [serviceResource.id, serviceResource.title],
          checked,
          role: 'checkbox',
          name: FilterCategory.SERVICE,
        } as MenuItemProps;
      }),
  };
};

/**
 * Generates filters with suggestions, including count of available items.
 * Counts are calculated across ALL views, not just the current view.
 *
 * @param allDialogs - All dialogs from all views for accurate counting
 * @param allOrganizations
 * @param viewType
 * @param orgsFromSearchState
 * @param serviceResources
 * @param currentFilters - The current filter state to calculate accurate counts
 * @param enableServiceFilter
 * @returns {Array} - The array of filter settings.
 */

export const getFilters = ({
  allDialogs,
  allOrganizations,
  viewType,
  enableServiceFilter,
  prebuiltServiceFilter,
}: {
  allDialogs: CountableDialogFieldsFragment[];
  allOrganizations: OrganizationFieldsFragment[];
  viewType: InboxViewType;
  enableServiceFilter?: boolean;
  prebuiltServiceFilter?: FilterProps;
}): ToolbarFilterProps['filters'] => {
  const senderOrgFilter = createServiceOwnerFilter(allDialogs, allOrganizations ?? []);
  const statusFilter = createStatusFilter();
  const updatedAtFilter = createUpdatedAtFilter();

  const filters = [];

  if (viewType === 'inbox') {
    filters.push(statusFilter);
  }

  filters.push(updatedAtFilter);
  filters.push(senderOrgFilter);

  if (enableServiceFilter && prebuiltServiceFilter) {
    filters.push(prebuiltServiceFilter);
  }

  return filters.filter((filter) => {
    return filter.name === FilterCategory.SERVICE ? true : filter.items?.length > 0;
  });
};

export const readFiltersFromURLQuery = (query: string): FilterState => {
  const searchParams = new URLSearchParams(query);
  const allowedFilterKeys = Object.values(FilterCategory) as string[];
  const filters: FilterState = {};

  for (const [key, value] of searchParams) {
    if (allowedFilterKeys.includes(key) && value) {
      filters[key] = filters[key] || [];
      filters[key].push(value);
    }
  }

  return filters;
};

interface NormalizeFilterDefaults {
  filters: Partial<FilterState>;
  viewType?: InboxViewType;
  searchQuery?: string;
}

export const presetFiltersByView: Record<InboxViewType, Partial<GetAllDialogsForPartiesQueryVariables>> = {
  inbox: {
    status: [
      DialogStatus.NotApplicable,
      DialogStatus.InProgress,
      DialogStatus.Awaiting,
      DialogStatus.RequiresAttention,
      DialogStatus.Completed,
    ],
    label: [SystemLabel.Default],
  },
  drafts: {
    status: [DialogStatus.Draft],
    label: [SystemLabel.Default],
  },
  sent: {
    label: [SystemLabel.Sent],
  },
  archive: {
    label: [SystemLabel.Archive],
  },
  bin: {
    label: [SystemLabel.Bin],
  },
};

export const removeUndefinedValues = <T extends Record<string, unknown>>(obj: T): T => {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'undefined') {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
};

export const hasValidFilters = (filterState: FilterState) => {
  return Object.values(filterState).some((arr) => {
    if (typeof arr === 'undefined' || arr.length === 0) {
      return false;
    }
    const { fromDate, toDate } = filterState;
    if (arr[0] === 'fromAndToDate' && typeof fromDate === 'undefined' && typeof toDate === 'undefined') return false;

    return true;
  });
};

/**
 * Normalizes and merges dialog filter values based on system status labels and view presets.
 *
 * This function performs two key steps:
 * 1. **Normalization**:
 *    - Filters out system labels (`Bin`, `Archive`) from `status` and moves them into `label`.
 *    - Cleans up `status` to only include non-system statuses.
 * 2. **Preset merging**:
 *    - If a `viewType` is provided, merges in default filter presets (`presetFiltersByView`).
 *    - For array fields like `label` and `status`, values are combined and deduplicated.
 *    - For non-array fields, user-provided values take precedence.
 *
 * @param {Object} params
 * @param {FilterState} params.filters - The user-provided filter values.
 * @param {InboxViewType} [params.viewType] - The current inbox view, used to determine which presets to apply.
 * @returns {GetAllDialogsForPartiesQueryVariables} A normalized and preset-merged filter state object.
 */

export const normalizeFilterDefaults = ({
  filters,
  viewType,
  searchQuery,
}: NormalizeFilterDefaults): GetAllDialogsForPartiesQueryVariables => {
  const SYSTEM_LABEL_STATUSES = [SystemLabel.Bin, SystemLabel.Archive, SystemLabel.Sent] as string[];
  const { updatedAfter, fromDate, toDate, ...baseFilters } = filters;
  const { status, org, systemLabel, serviceResources } = baseFilters;
  const normalized: GetAllDialogsForPartiesQueryVariables = { ...baseFilters };

  const hasFilters = [status, org, systemLabel, updatedAfter, serviceResources].some((f) => {
    // Special case for date filters: if "fromAndToDate" is selected, both fromDate and toDate must be provided to be valid
    if (
      typeof f?.[0] === 'string' &&
      f?.[0] === 'fromAndToDate' &&
      typeof fromDate === 'undefined' &&
      typeof toDate === 'undefined'
    ) {
      return false;
    }
    return Array.isArray(f) && f.length > 0;
  });

  if (updatedAfter) {
    if (filterRanges[updatedAfter as unknown as DateFilterOption]) {
      const { start, end } = filterRanges[updatedAfter as unknown as DateFilterOption];
      if (start) normalized.updatedAfter = start.toISOString();
      if (end) normalized.updatedBefore = end.toISOString();
    } else if (updatedAfter?.[0] === 'fromAndToDate') {
      normalized.updatedAfter = toIsoStartOfLocalDay(fromDate?.[0]);
      normalized.updatedBefore = toIsoEndOfLocalDay(toDate?.[0]);
    }
  }

  const normalizedStatus = (normalized.status ?? []) as string[];
  const systemLabelsInStatus = normalizedStatus.filter((s) => SYSTEM_LABEL_STATUSES.includes(s)) as SystemLabel[];
  const remainingStatus = normalizedStatus.filter((s) => !SYSTEM_LABEL_STATUSES.includes(s)) as DialogStatus[];

  if (systemLabelsInStatus.length > 0) {
    normalized.label = systemLabelsInStatus;
  }
  normalized.status = remainingStatus.length > 0 ? remainingStatus : undefined;

  if ((hasFilters || searchQuery) && viewType === 'inbox') {
    return normalized;
  }

  return mergeFilterDefaults(normalized, viewType);
};

const mergeWithPresets = <T extends Record<string, unknown>>(current: T, presets: Partial<T>): T => {
  const merged = { ...current };

  for (const key of Object.keys(presets) as (keyof T)[]) {
    const presetValue = presets[key];
    const currentValue = merged[key];

    if (Array.isArray(presetValue)) {
      merged[key] = Array.isArray(currentValue)
        ? (Array.from(new Set([...presetValue, ...currentValue])) as T[typeof key])
        : (presetValue as T[typeof key]);
    } else if (typeof currentValue === 'undefined') {
      merged[key] = presetValue as T[typeof key];
    }
  }

  return merged;
};

export const mergeFilterDefaults = (
  currentFilters: GetAllDialogsForPartiesQueryVariables,
  viewType?: InboxViewType,
): GetAllDialogsForPartiesQueryVariables => {
  if (!viewType) return currentFilters;
  const presets = presetFiltersByView[viewType] ?? {};
  return mergeWithPresets(currentFilters, presets);
};

export const aggregateFilterState = (filterState: FilterState, viewType: InboxViewType): FilterState => {
  const presets = presetFiltersByView[viewType];
  if (!presets) return filterState;

  // @ts-ignore
  const asArray = (v: unknown): DialogStatus[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

  return {
    ...filterState,
    status: [...new Set([...asArray(presets.status), ...asArray(presets.label), ...asArray(filterState.status)])],
  };
};

type Dateish = string | number | Date;

const parseDateish = (value?: Dateish): Date | undefined => {
  if (value === undefined || value === null) return undefined;

  if (value instanceof Date) return isValid(value) ? value : undefined;

  const s = String(value);
  if (!s) return undefined;

  try {
    const d = parseISO(s);
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Standalone single-date formatter.
 */
export const formatSingleDate = (value: Dateish | undefined, locale: Locale): string | undefined => {
  const d = parseDateish(value);
  if (!d) return undefined;

  return format(d, 'd. MMMM yyyy', { locale });
};

export const formatDateRange = (
  fromStr: Dateish | undefined,
  toStr: Dateish | undefined,
  locale: Locale,
): string | undefined => {
  const from = parseDateish(fromStr);
  const to = parseDateish(toStr);

  if (!from && !to) return undefined;

  const fullFrom = from ? formatSingleDate(from, locale)! : undefined;
  const fullTo = to ? formatSingleDate(to, locale)! : undefined;

  if (from && !to) return `${fullFrom}—`;
  if (!from && to) return `—${fullTo}`;

  const sameYear = from!.getFullYear() === to!.getFullYear();
  const sameMonth = sameYear && from!.getMonth() === to!.getMonth();
  const sameDay = sameMonth && from!.getDate() === to!.getDate();

  if (sameDay) return fullFrom;

  if (sameMonth) {
    // 3.–5. februar 2026
    return `${format(from!, 'd.', { locale })}–${format(to!, 'd. MMMM yyyy', { locale })}`;
  }

  if (sameYear) {
    // 3. februar–5. juni 2026
    return `${format(from!, 'd. MMMM', { locale })}–${format(to!, 'd. MMMM yyyy', { locale })}`;
  }

  return `${fullFrom}–${fullTo}`;
};
