import { type FeatureFlagType, type FeatureFlagValue, featureFlagDefinitions } from 'bff-types-generated';

export {
  type FeatureFlagDefinition,
  type FeatureFlagKey,
  type FeatureFlagType,
  type FeatureFlagValue,
  featureFlagDefinitions,
} from 'bff-types-generated';

export function getFeatureFlag(key: string, overrides: Record<string, unknown> = {}): FeatureFlagValue | undefined {
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

      case 'string-array':
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'string') return value.split(',').map((s) => s.trim());
        return def.default;

      default:
        return def.default;
    }
  } catch {
    return def.default;
  }
}
