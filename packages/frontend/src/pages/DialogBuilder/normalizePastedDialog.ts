import { prune } from './builderDraft.ts';
import { SERVICE_RESOURCE_TYPES, type ServiceResourceType, SYSTEM_LABELS } from './dialogSchema.ts';

const SERVICE_RESOURCE_PLACEHOLDER = 'urn:altinn:resource:fyll-inn';
const GRAPHQL_ENUM_PATTERN = /^[A-Z]+(_[A-Z]+)*$/;

const ENUM_FIELDS = new Set(['status', 'type', 'actorType', 'consumerType', 'priority', 'systemLabel']);

const RESPONSE_ONLY_FIELDS = new Set([
  '__typename',
  'contentUpdatedAt',
  'deletedAt',
  'dialogToken',
  'endUserContext',
  'excludedApiActions',
  'excludedAttachments',
  'excludedGuiActions',
  'excludedNavigationalActions',
  'excludedTransmissions',
  'fromPartyTransmissionsCount',
  'fromServiceOwnerTransmissionsCount',
  'hasUnopenedContent',
  'isAuthorized',
  'isContentSeen',
  'isOpened',
  'org',
  'revision',
  'seenSinceLastContentUpdate',
  'seenSinceLastUpdate',
  'serviceResourceType',
]);

export interface DialogOrigin {
  org?: string;
  serviceResourceType?: ServiceResourceType;
}

interface NormalizedDialog extends DialogOrigin {
  dialog: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toPascalCase = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const removeResponseFields = (value: unknown, key?: string): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => removeResponseFields(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([field]) => !RESPONSE_ONLY_FIELDS.has(field))
        .map(([field, item]) => [field, removeResponseFields(item, field)]),
    );
  }
  const isGraphqlEnum = typeof value === 'string' && GRAPHQL_ENUM_PATTERN.test(value);
  return isGraphqlEnum && key && ENUM_FIELDS.has(key) ? toPascalCase(value) : value;
};

const unwrapGraphqlResponse = (input: unknown): unknown => {
  const response = input as { data?: { dialogById?: { dialog?: unknown } }; dialogById?: { dialog?: unknown } } | null;
  return response?.data?.dialogById?.dialog ?? response?.dialogById?.dialog ?? input;
};

const toServiceResourceType = (value: unknown): ServiceResourceType | undefined =>
  SERVICE_RESOURCE_TYPES.find((type) => type === String(value).toLowerCase());

const toSystemLabel = ({ systemLabel, endUserContext }: Record<string, unknown>) => {
  const { systemLabels = [] } = (endUserContext ?? {}) as { systemLabels?: string[] };
  const labels = [systemLabel, ...systemLabels].map((label) => toPascalCase(String(label)));
  return SYSTEM_LABELS.find((label) => labels.includes(label));
};

export const normalizePastedDialog = (input: unknown): NormalizedDialog => {
  const source = unwrapGraphqlResponse(input);
  if (!isRecord(source)) {
    return { dialog: source };
  }

  const dialog = prune(removeResponseFields(source)) as Record<string, unknown>;
  if (!('org' in source)) {
    return { dialog };
  }

  const { id: _id, ...dialogWithoutId } = dialog;
  return {
    org: typeof source.org === 'string' ? source.org : undefined,
    serviceResourceType: toServiceResourceType(source.serviceResourceType),
    dialog: {
      ...dialogWithoutId,
      serviceResource: dialog.serviceResource ?? SERVICE_RESOURCE_PLACEHOLDER,
      updatedAt: source.contentUpdatedAt ?? dialog.updatedAt,
      systemLabel: toSystemLabel(source),
    },
  };
};
