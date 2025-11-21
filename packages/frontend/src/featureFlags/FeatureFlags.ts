export type FeatureFlagType = 'boolean' | 'number' | 'string';

export interface FeatureFlagDefinition {
  key: string; // dot-notation key
  type: FeatureFlagType; // type of value
  default: boolean | number | string; // fallback value
}

export const featureFlagDefinitions = [
  { key: 'party.stopReversingPersonNameOrder', type: 'boolean', default: false },
  { key: 'globalMenu.enableAccessManagementLink', type: 'boolean', default: false },
  { key: 'globalMenu.enabled', type: 'boolean', default: false },
  { key: 'inbox.disableDialogCount', type: 'boolean', default: false },
] as const satisfies readonly FeatureFlagDefinition[];

export type FeatureFlagKey = (typeof featureFlagDefinitions)[number]['key'];

export function getFeatureFlag(
  key: string,
  overrides: Record<string, unknown> = {},
): boolean | number | string | undefined {
  const def = featureFlagDefinitions.find((f) => f.key === key);
  if (!def) return undefined;

  const value = overrides[key];
  if (value === undefined) return def.default;

  const type = def.type as FeatureFlagType;

  try {
    switch (type) {
      case 'boolean':
        return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';

      case 'number': {
        const n = Number(value);
        return Number.isNaN(n) ? def.default : n;
      }

      case 'string':
        return String(value);

      default:
        return def.default;
    }
  } catch {
    return def.default;
  }
}
